#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const RELEASE = 'cambridge-content-reconciliation-2026-08-28';
const MANIFEST_FILE = 'database/manifests/cambridge_production_drift_hashes.json';
const OUT = 'database/reconciliation/cambridge-content';
const STATE_FIELDS = ['id','subject_id','topic_id','question_text','question_type','options','correct_answer','explanation','difficulty','points','marks','time_limit'];
const CONTENT_FIELDS = ['id','subject_id','question_text','question_type','options','correct_answer','explanation','difficulty','points','marks','time_limit'];
const MUTABLE_FIELDS = CONTENT_FIELDS.filter((field) => !['id','subject_id'].includes(field));
const P1 = 2147483647;
const P2 = 2147483629;
const MAX_SQL_BYTES = 18_500;
const SCOPE_SQL = "(id GLOB 'q_alevel_bio_[0-9][0-9][0-9]' OR id GLOB 'q_alevel_chem_[0-9][0-9][0-9]' OR id GLOB 'q_alevel_fm_[0-9][0-9][0-9]' OR id GLOB 'q_alevel_math_[0-9][0-9][0-9]' OR id GLOB 'q_alevel_phy_[0-9][0-9][0-9]' OR id GLOB 'q_igcse_addmath_[0-9][0-9][0-9]' OR id GLOB 'q_igcse_bio_[0-9][0-9][0-9]' OR id GLOB 'q_igcse_chem_[0-9][0-9][0-9]' OR id GLOB 'q_igcse_math_[0-9][0-9][0-9]' OR id GLOB 'q_igcse_phy_[0-9][0-9][0-9]')";
const SUBJECT_COUNTS = {
  subj_alevel_biology: 40, subj_alevel_chemistry: 40, subj_alevel_further_math: 55,
  subj_alevel_math: 55, subj_alevel_physics: 40, subj_igcse_add_math: 55,
  subj_igcse_biology: 40, subj_igcse_chemistry: 40, subj_igcse_math: 40, subj_igcse_physics: 50,
};

const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');
const sql = (value) => value === null || value === undefined ? 'NULL' : typeof value === 'number' ? String(value) : `'${String(value).replaceAll("'", "''")}'`;
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const fpEquals = (table, fp) => `(SELECT c=${fp[0]} AND n=${fp[1]} AND a=${fp[2]} AND b=${fp[3]} FROM ${table})`;
const fieldType = (field) => ['points','marks','time_limit'].includes(field) ? 'INTEGER' : 'TEXT';

function fpSql(name, source, orderBy = 'id') {
  const values = CONTENT_FIELDS.join(',');
  return `CREATE TABLE ${name}(c INTEGER,n INTEGER,a INTEGER,b INTEGER);INSERT INTO ${name}(c,n,a,b) WITH RECURSIVE r(k,v) AS (SELECT row_number() OVER(ORDER BY ${orderBy}),json_array(${values}) FROM ${source}),w(k,i,n,a,b,v) AS (SELECT k,0,length(v),7,11,v FROM r UNION ALL SELECT k,i+1,n,(a*131+unicode(substr(v,i+1,1)))%${P1},(b*137+unicode(substr(v,i+1,1)))%${P2},v FROM w WHERE i<n),f AS (SELECT k,n,a,b FROM w WHERE i=n) SELECT count(*),coalesce(sum(n),0),coalesce(sum((a*k)%${P1})%${P1},0),coalesce(sum((b*k)%${P2})%${P2},0) FROM f;`;
}

const scopeFpSql = (name = '_ccr_fp') => fpSql(name, `(SELECT ${CONTENT_FIELDS.join(',')} FROM questions WHERE ${SCOPE_SQL})`);
const stateFpSql = (name = '_ccr_sfp') => fpSql(name, `(SELECT ${STATE_FIELDS.join(',')} FROM questions WHERE ${SCOPE_SQL})`).replace(`json_array(${CONTENT_FIELDS.join(',')})`,`json_array(${STATE_FIELDS.join(',')})`);
const backupFpSql = (name = '_ccr_bfp') => fpSql(name, `(SELECT ${CONTENT_FIELDS.join(',')} FROM cambridge_content_reconciliation_backup WHERE release_id=${sql(RELEASE)})`);
const subjectGuard = () => Object.entries(SUBJECT_COUNTS).map(([id,count]) => `(SELECT count(*) FROM questions WHERE ${SCOPE_SQL} AND subject_id=${sql(id)})=${count}`).join(' AND ');
const ownerGuard = `NOT EXISTS(SELECT 1 FROM questions q JOIN topics t ON t.id=q.topic_id WHERE ${SCOPE_SQL.replaceAll('id GLOB','q.id GLOB')} AND q.subject_id<>t.subject_id)`;
const reviewedMode = (model) => `(${model.reviewedStateFingerprints.map((fp) => fpEquals('_ccr_sfp',fp)).join(' OR ')})`;
const legacyMode = (model) => `(${fpEquals('_ccr_fp', model.legacyFingerprint)} AND (SELECT count(*) FROM questions WHERE ${SCOPE_SQL} AND topic_id IS NULL)=455)`;
const baseExactGuard = (model) => `(SELECT count(*) FROM questions WHERE ${SCOPE_SQL})=455 AND ${subjectGuard()} AND ${ownerGuard} AND (${legacyMode(model)} OR ${reviewedMode(model)})`;

function validateManifest(manifest, reviewedRows, topicGenerator) {
  assert(manifest.scopeCount === 455, 'Expected 455 Cambridge rows');
  assert(manifest.driftRowCount === 144 && manifest.rows.length === 144, 'Expected 144 divergent rows');
  assert(Array.isArray(manifest.legacyContentFingerprint) && manifest.legacyContentFingerprint.length === 4, 'Missing legacy fingerprint');
  assert(Array.isArray(manifest.legacyBackupFingerprint) && manifest.legacyBackupFingerprint.length === 4, 'Missing backup fingerprint');
  assert(new Set(manifest.rows.map((row) => row.id)).size === 144, 'Duplicate drift IDs');
  assert(JSON.stringify(topicGenerator.rowsFingerprint(reviewedRows,CONTENT_FIELDS))===JSON.stringify(manifest.reviewedContentFingerprint),'Reviewed content fingerprint mismatch');
  const orderedHashes=[...manifest.rows].sort((a,b)=>a.id.localeCompare(b.id));
  let backupN=0,backupA=0,backupB=0;
  orderedHashes.forEach((row,index)=>{const hash=row.legacyContentHash;assert(hash&&hash.id===row.id&&[hash.n,hash.a,hash.b].every(Number.isInteger),`Invalid legacy hash ${row.id}`);backupN+=hash.n;backupA=(backupA+((hash.a*(index+1))%P1))%P1;backupB=(backupB+((hash.b*(index+1))%P2))%P2;});
  assert(JSON.stringify([144,backupN,backupA,backupB])===JSON.stringify(manifest.legacyBackupFingerprint),'Legacy backup hash aggregate mismatch');
  const reviewed = new Map(reviewedRows.map((row) => [row.id, row]));
  for (const row of manifest.rows) {
    assert(reviewed.get(row.id)?.subject_id === row.subjectId, `Unknown or mis-owned row ${row.id}`);
    assert(row.differingFields.length > 0 && row.differingFields.every((field) => MUTABLE_FIELDS.includes(field)), `Unsafe fields for ${row.id}`);
  }
}

function loadModel(options = {}) {
  const topicGenerator = options.topicGenerator || require('./generate-cambridge-topic-release.cjs');
  const topicModel = options.topicModel || topicGenerator.buildModel();
  const manifest = options.manifest || JSON.parse(read(MANIFEST_FILE));
  const reviewedRows = (options.reviewedRows || topicModel.states[0]).map((row) => ({...row})).sort((a,b) => a.id.localeCompare(b.id));
  validateManifest(manifest, reviewedRows, topicGenerator);
  const byId = new Map(reviewedRows.map((row) => [row.id, row]));
  const driftRows = manifest.rows.map((row) => ({...row, reviewed: byId.get(row.id)})).sort((a,b) => a.id.localeCompare(b.id));
  const legacyGenerator = options.legacyGenerator || require('./generate-cambridge-legacy-topic-release.cjs');
  const legacyModel = options.legacyModel || legacyGenerator.buildModel();
  const post281 = topicModel.states[5].map((row) => ({...row}));
  const post281ById = new Map(post281.map((row) => [row.id,row]));
  for (const mapping of legacyModel.mappings) if (post281ById.has(mapping.questionId)) post281ById.get(mapping.questionId).topic_id=mapping.topicId;
  for (const correction of legacyModel.corrections) if (post281ById.has(correction.questionId)) Object.assign(post281ById.get(correction.questionId),correction.new);
  return {
    manifest, reviewedRows, driftRows,
    legacyFingerprint: manifest.legacyContentFingerprint,
    reviewedPreFingerprint: manifest.reviewedContentFingerprint,
    reviewedPostFingerprint: options.reviewedPostFingerprint || topicGenerator.rowsFingerprint(topicModel.states[5], CONTENT_FIELDS),
    reviewedStateFingerprints: options.reviewedStateFingerprints || [topicGenerator.rowsFingerprint(topicModel.states[0],STATE_FIELDS),topicGenerator.rowsFingerprint(topicModel.states[5],STATE_FIELDS),topicGenerator.rowsFingerprint(post281,STATE_FIELDS)],
    backupFingerprint: manifest.legacyBackupFingerprint,
  };
}

function preflightSql(model) {
  return `-- Read-only fail-closed gate. Run first, before migration 271.\nPRAGMA foreign_keys=ON;CREATE TABLE _ccr_guard(valid INTEGER CHECK(valid=1));${scopeFpSql()}${stateFpSql()}INSERT INTO _ccr_guard SELECT CASE WHEN ${baseExactGuard(model)} AND NOT EXISTS(SELECT 1 FROM pragma_foreign_key_check) THEN 1 ELSE 0 END;DROP TABLE _ccr_sfp;DROP TABLE _ccr_fp;DROP TABLE _ccr_guard;\n`;
}

function initializeSql(model) {
  const ids = model.driftRows.map((row) => sql(row.id)).join(',');
  const columns = CONTENT_FIELDS.map((field) => `${field} ${fieldType(field)}`).join(',');
  return `-- Retain a bounded 144-row source backup only when the exact legacy state is present.\nPRAGMA foreign_keys=ON;CREATE TABLE _ccr_guard(valid INTEGER CHECK(valid=1));${scopeFpSql()}${stateFpSql()}INSERT INTO _ccr_guard SELECT CASE WHEN ${baseExactGuard(model)} THEN 1 ELSE 0 END;CREATE TABLE IF NOT EXISTS cambridge_content_reconciliation_backup(release_id TEXT NOT NULL,${columns},PRIMARY KEY(release_id,id));CREATE TABLE IF NOT EXISTS cambridge_content_reconciliation_state(release_id TEXT PRIMARY KEY,status TEXT NOT NULL,next_part INTEGER NOT NULL,content_c INTEGER NOT NULL,content_n INTEGER NOT NULL,content_a INTEGER NOT NULL,content_b INTEGER NOT NULL,updated_at TEXT NOT NULL);CREATE TABLE IF NOT EXISTS cambridge_content_reconciliation_audit(release_id TEXT NOT NULL,ordinal INTEGER NOT NULL,part_number INTEGER NOT NULL,question_id TEXT NOT NULL,field_name TEXT NOT NULL,action TEXT NOT NULL,created_at TEXT NOT NULL,PRIMARY KEY(release_id,ordinal));INSERT OR IGNORE INTO cambridge_content_reconciliation_backup(release_id,${CONTENT_FIELDS.join(',')}) SELECT ${sql(RELEASE)},${CONTENT_FIELDS.join(',')} FROM questions WHERE id IN(${ids}) AND ${legacyMode(model)};${backupFpSql()}INSERT INTO _ccr_guard SELECT CASE WHEN ${reviewedMode(model)} OR (${legacyMode(model)} AND ${fpEquals('_ccr_bfp',model.backupFingerprint)}) THEN 1 ELSE 0 END;INSERT OR IGNORE INTO cambridge_content_reconciliation_state SELECT ${sql(RELEASE)},'running',1,c,n,a,b,'2026-08-28T00:00:00.000Z' FROM _ccr_fp WHERE ${legacyMode(model)};DROP TABLE _ccr_bfp;DROP TABLE _ccr_sfp;DROP TABLE _ccr_fp;DROP TABLE _ccr_guard;\n`;
}

function rowUpdateSql(row, partNumber, ordinalStart) {
  const changed = row.differingFields;
  const matchBackup = changed.map((field) => `questions.${field} IS (SELECT ${field} FROM cambridge_content_reconciliation_backup b WHERE b.release_id=${sql(RELEASE)} AND b.id=questions.id)`).join(' AND ');
  const sets = changed.map((field) => `${field}=${sql(row.reviewed[field])}`).join(',');
  const running = `EXISTS(SELECT 1 FROM cambridge_content_reconciliation_state WHERE release_id=${sql(RELEASE)} AND status='running' AND next_part=${partNumber})`;
  const audit = changed.map((field,index) => `INSERT OR IGNORE INTO cambridge_content_reconciliation_audit SELECT ${sql(RELEASE)},${ordinalStart+index},${partNumber},${sql(row.id)},${sql(field)},'replace','2026-08-28T00:00:00.000Z' WHERE ${running};`).join('');
  const verify = changed.map((field) => `${field} IS ${sql(row.reviewed[field])}`).join(' AND ');
  return {sql:`${audit}UPDATE questions SET ${sets} WHERE id=${sql(row.id)} AND ${running} AND ${matchBackup};`,verify:`EXISTS(SELECT 1 FROM questions WHERE id=${sql(row.id)} AND ${verify})`,auditCount:changed.length};
}

function partSql(model, rows, partNumber, partCount, ordinalStart) {
  let ordinal = ordinalStart;
  const rendered = rows.map((row) => { const result=rowUpdateSql(row,partNumber,ordinal); ordinal+=result.auditCount; return result; });
  const stateGuard = `EXISTS(SELECT 1 FROM cambridge_content_reconciliation_state WHERE release_id=${sql(RELEASE)} AND status='running' AND next_part=${partNumber} AND content_c=(SELECT c FROM _ccr_fp) AND content_n=(SELECT n FROM _ccr_fp) AND content_a=(SELECT a FROM _ccr_fp) AND content_b=(SELECT b FROM _ccr_fp))`;
  const replayGuard = `EXISTS(SELECT 1 FROM cambridge_content_reconciliation_state WHERE release_id=${sql(RELEASE)} AND next_part>${partNumber} AND content_c=(SELECT c FROM _ccr_fp) AND content_n=(SELECT n FROM _ccr_fp) AND content_a=(SELECT a FROM _ccr_fp) AND content_b=(SELECT b FROM _ccr_fp)) AND ${rendered.map((item)=>item.verify).join(' AND ')}`;
  const nextStatus = partNumber === partCount ? 'completed' : 'running';
  const postGuard = partNumber === partCount ? reviewedMode(model) : `(${reviewedMode(model)} OR (${replayGuard}) OR (${rendered.map((item)=>item.verify).join(' AND ')} AND NOT EXISTS(SELECT 1 FROM pragma_foreign_key_check) AND ${ownerGuard}))`;
  return `-- Ordered reconciliation part ${partNumber}/${partCount}. Replays against an exact reviewed state are no-ops.\nPRAGMA foreign_keys=ON;CREATE TABLE _ccr_guard(valid INTEGER CHECK(valid=1));${scopeFpSql()}${stateFpSql()}${backupFpSql()}INSERT INTO _ccr_guard SELECT CASE WHEN ${reviewedMode(model)} OR ((${stateGuard} OR (${replayGuard})) AND ${fpEquals('_ccr_bfp',model.backupFingerprint)}) THEN 1 ELSE 0 END;${rendered.map((item)=>item.sql).join('')}DROP TABLE _ccr_sfp;DROP TABLE _ccr_fp;${scopeFpSql()}${stateFpSql()}INSERT INTO _ccr_guard SELECT CASE WHEN ${postGuard} THEN 1 ELSE 0 END;UPDATE cambridge_content_reconciliation_state SET status=${sql(nextStatus)},next_part=${partNumber+1},content_c=(SELECT c FROM _ccr_fp),content_n=(SELECT n FROM _ccr_fp),content_a=(SELECT a FROM _ccr_fp),content_b=(SELECT b FROM _ccr_fp),updated_at='2026-08-28T00:00:00.000Z' WHERE release_id=${sql(RELEASE)} AND status='running' AND next_part=${partNumber};DROP TABLE _ccr_bfp;DROP TABLE _ccr_sfp;DROP TABLE _ccr_fp;DROP TABLE _ccr_guard;\n`;
}

function rollbackPartSql(model, rows, partNumber, partCount) {
  const updates = rows.map((row) => {
    const sets=row.differingFields.map((field)=>`${field}=(SELECT ${field} FROM cambridge_content_reconciliation_backup b WHERE b.release_id=${sql(RELEASE)} AND b.id=questions.id)`).join(',');
    return `UPDATE questions SET ${sets} WHERE id=${sql(row.id)};`;
  }).join('');
  return `-- Reverse reconciliation part ${partNumber}; run strictly from ${partCount} down to 1. Backup is retained.\nPRAGMA foreign_keys=ON;CREATE TABLE _ccr_guard(valid INTEGER CHECK(valid=1));${scopeFpSql()}${stateFpSql()}${backupFpSql()}INSERT INTO _ccr_guard SELECT CASE WHEN ${fpEquals('_ccr_bfp',model.backupFingerprint)} AND EXISTS(SELECT 1 FROM cambridge_content_reconciliation_state WHERE release_id=${sql(RELEASE)} AND next_part=${partNumber+1} AND content_c=(SELECT c FROM _ccr_fp) AND content_n=(SELECT n FROM _ccr_fp) AND content_a=(SELECT a FROM _ccr_fp) AND content_b=(SELECT b FROM _ccr_fp)) THEN 1 ELSE 0 END;${updates}DROP TABLE _ccr_sfp;DROP TABLE _ccr_fp;${scopeFpSql()}${stateFpSql()}UPDATE cambridge_content_reconciliation_state SET status='running',next_part=${partNumber},content_c=(SELECT c FROM _ccr_fp),content_n=(SELECT n FROM _ccr_fp),content_a=(SELECT a FROM _ccr_fp),content_b=(SELECT b FROM _ccr_fp),updated_at='2026-08-28T00:00:00.000Z' WHERE release_id=${sql(RELEASE)};DELETE FROM cambridge_content_reconciliation_audit WHERE release_id=${sql(RELEASE)} AND part_number=${partNumber};INSERT INTO _ccr_guard SELECT CASE WHEN ${partNumber===1?fpEquals('_ccr_fp',model.legacyFingerprint):'1'} AND NOT EXISTS(SELECT 1 FROM pragma_foreign_key_check) THEN 1 ELSE 0 END;DROP TABLE _ccr_bfp;DROP TABLE _ccr_sfp;DROP TABLE _ccr_fp;DROP TABLE _ccr_guard;\n`;
}

function postflightSql(model, partCount, auditCount) {
  return `-- Exact reviewed-content postflight. Topic state may be pre-271 or a reviewed post-271 shape.\nPRAGMA foreign_keys=ON;CREATE TABLE _ccr_guard(valid INTEGER CHECK(valid=1));${scopeFpSql()}${stateFpSql()}${backupFpSql()}INSERT INTO _ccr_guard SELECT CASE WHEN ${reviewedMode(model)} AND ((NOT EXISTS(SELECT 1 FROM cambridge_content_reconciliation_state WHERE release_id=${sql(RELEASE)}) AND (SELECT count(*) FROM cambridge_content_reconciliation_backup WHERE release_id=${sql(RELEASE)})=0 AND (SELECT count(*) FROM cambridge_content_reconciliation_audit WHERE release_id=${sql(RELEASE)})=0) OR (${fpEquals('_ccr_bfp',model.backupFingerprint)} AND EXISTS(SELECT 1 FROM cambridge_content_reconciliation_state WHERE release_id=${sql(RELEASE)} AND status='completed' AND next_part=${partCount+1} AND content_c=(SELECT c FROM _ccr_fp) AND content_n=(SELECT n FROM _ccr_fp) AND content_a=(SELECT a FROM _ccr_fp) AND content_b=(SELECT b FROM _ccr_fp)) AND (SELECT count(*) FROM cambridge_content_reconciliation_audit WHERE release_id=${sql(RELEASE)})=${auditCount})) AND NOT EXISTS(SELECT 1 FROM pragma_foreign_key_check) AND ${ownerGuard} THEN 1 ELSE 0 END;DROP TABLE _ccr_bfp;DROP TABLE _ccr_sfp;DROP TABLE _ccr_fp;DROP TABLE _ccr_guard;\n`;
}

function cleanupSql(model) {
  return `-- OUTSIDE THE FLIGHT. Run only after 271-275 postflight and an explicit cleanup authorization.\nPRAGMA foreign_keys=ON;CREATE TABLE _ccr_guard(valid INTEGER CHECK(valid=1));${scopeFpSql()}${stateFpSql()}INSERT INTO _ccr_guard SELECT CASE WHEN ${reviewedMode(model)} AND (EXISTS(SELECT 1 FROM cambridge_content_reconciliation_state WHERE release_id=${sql(RELEASE)} AND status='completed') OR (NOT EXISTS(SELECT 1 FROM cambridge_content_reconciliation_state) AND NOT EXISTS(SELECT 1 FROM cambridge_content_reconciliation_backup) AND NOT EXISTS(SELECT 1 FROM cambridge_content_reconciliation_audit))) AND NOT EXISTS(SELECT 1 FROM cambridge_content_reconciliation_state WHERE release_id<>${sql(RELEASE)}) AND NOT EXISTS(SELECT 1 FROM cambridge_content_reconciliation_backup WHERE release_id<>${sql(RELEASE)}) AND NOT EXISTS(SELECT 1 FROM cambridge_content_reconciliation_audit WHERE release_id<>${sql(RELEASE)}) THEN 1 ELSE 0 END;DELETE FROM cambridge_content_reconciliation_audit WHERE release_id=${sql(RELEASE)};DELETE FROM cambridge_content_reconciliation_state WHERE release_id=${sql(RELEASE)};DELETE FROM cambridge_content_reconciliation_backup WHERE release_id=${sql(RELEASE)};DROP TABLE cambridge_content_reconciliation_audit;DROP TABLE cambridge_content_reconciliation_state;DROP TABLE cambridge_content_reconciliation_backup;DROP TABLE _ccr_sfp;DROP TABLE _ccr_fp;DROP TABLE _ccr_guard;\n`;
}

function partition(model) {
  const parts=[]; let ordinal=1;
  for(const subjectId of [...new Set(model.driftRows.map((row)=>row.subjectId))]){
    let current=[];
    for(const row of model.driftRows.filter((item)=>item.subjectId===subjectId)){
      const candidate=[...current,row],probe=partSql(model,candidate,parts.length+1,99,ordinal);
      if(current.length&&Buffer.byteLength(probe)>MAX_SQL_BYTES){parts.push(current);ordinal+=current.reduce((n,item)=>n+item.differingFields.length,0);current=[row];}else current=candidate;
    }
    if(current.length){parts.push(current);ordinal+=current.reduce((n,item)=>n+item.differingFields.length,0);}
  }
  return parts;
}

function buildArtifacts(options={}) {
  const model=loadModel(options); const parts=partition(model); const artifacts={};
  artifacts[`${OUT}/00_preflight.sql`]=preflightSql(model);
  artifacts[`${OUT}/01_initialize_backup.sql`]=initializeSql(model);
  let ordinal=1;
  parts.forEach((rows,index)=>{const number=index+1;const name=String(number+1).padStart(2,'0');artifacts[`${OUT}/${name}_reconcile_${rows[0].subjectId.replace(/^subj_/, '')}_part_${number}.sql`]=partSql(model,rows,number,parts.length,ordinal);ordinal+=rows.reduce((n,row)=>n+row.differingFields.length,0);});
  artifacts[`${OUT}/90_postflight.sql`]=postflightSql(model,parts.length,ordinal-1);
  [...parts].reverse().forEach((rows,reverseIndex)=>{const number=parts.length-reverseIndex;artifacts[`${OUT}/rollback/${String(reverseIndex+1).padStart(2,'0')}_rollback_part_${number}.sql`]=rollbackPartSql(model,rows,number,parts.length);});
  artifacts[`${OUT}/99_cleanup_after_release.sql`]=cleanupSql(model);
  const ordered=Object.keys(artifacts).filter((file)=>!file.includes('/rollback/')&&!file.endsWith('99_cleanup_after_release.sql'));
  const runnerFiles=ordered.map((file)=>path.basename(file));
  artifacts[`${OUT}/run-flight.cjs`]=`#!/usr/bin/env node\n'use strict';\nconst path=require('node:path'),{execFileSync}=require('node:child_process');\nconst files=${JSON.stringify(runnerFiles)};\nconst args=process.argv.slice(2),value=(name)=>{const i=args.indexOf(name);return i<0?null:args[i+1];},env=value('--env'),confirm=value('--confirm'),targets={production:'aa806d65-d3dd-4cf9-9cac-e3ddd252f937',staging:'1faeca41-2233-4a0b-a273-0d3aadba9c96'},database=targets[env];\nif(!database||confirm!==env+':'+database)throw Error('Use --env production|staging --confirm <env>:<pinned-uuid>');\nconst root=path.resolve(__dirname,'../../..'),wrangler=path.join(root,'node_modules','wrangler','bin','wrangler.js');\nfor(const file of files){const a=[wrangler,'d1','execute',database,'--remote','--file',path.join(__dirname,file)];if(env==='staging')a.push('--env','staging');process.stdout.write('RUN '+file+'\\n');execFileSync(process.execPath,a,{cwd:root,stdio:'inherit'});}\n`;
  artifacts[`${OUT}/RUNBOOK.md`]=`# Cambridge content reconciliation flight\n\nRun each SQL file as a separate D1 file execution in this exact order, stopping on the first failure:\n\n${ordered.map((file,index)=>`${index+1}. \`${path.basename(file)}\``).join('\n')}\n\nThen run this reconciliation postflight, followed by the unchanged canonical migrations and flights 271-282 in exact numeric order. Do not run \`99_cleanup_after_release.sql\` as part of this flight; the retained 144-row backup is removed only under a separate explicit authorization.\n\nRecovery: fix the cause, confirm the prior file was atomically rolled back, and replay that same file. To reverse a completed/partial reconciliation, run files in \`rollback/\` in their numbered order. Stop on the first failure. The backup remains retained.\n`;
  for(const [file,content] of Object.entries(artifacts)) if(file.endsWith('.sql')) assert(Buffer.byteLength(content)<19_500,`${file} exceeds D1 file ceiling`);
  return {model:{...model,parts:parts.map((rows)=>rows.map((row)=>row.id)),auditCount:ordinal-1},artifacts};
}

function main(){const {artifacts}=buildArtifacts();const write=process.argv.includes('--write'),check=process.argv.includes('--check');assert(write!==check,'Use exactly one of --write or --check');if(write)fs.rmSync(path.join(ROOT,OUT),{recursive:true,force:true});for(const[file,content]of Object.entries(artifacts)){const absolute=path.join(ROOT,file);if(write){fs.mkdirSync(path.dirname(absolute),{recursive:true});fs.writeFileSync(absolute,content);}else assert(fs.existsSync(absolute)&&fs.readFileSync(absolute,'utf8')===content,`${file} is missing or stale`);}process.stdout.write(`${JSON.stringify(Object.fromEntries(Object.entries(artifacts).map(([file,content])=>[file,Buffer.byteLength(content)])),null,2)}\n`);}
if(require.main===module)main();
module.exports={buildArtifacts,loadModel,CONTENT_FIELDS,STATE_FIELDS,SCOPE_SQL,RELEASE};
