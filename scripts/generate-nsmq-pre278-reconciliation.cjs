"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { buildPlan } = require("./generate-nsmq-legacy-null-topic-remediation.cjs");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "database", "reconciliation", "nsmq-pre278");
const RELEASE = "nsmq-pre278-full-scope-reconciliation-2026-08-28";
const QUESTION_ID = "nsmq_chem_sr_008";
const SUBJECT_ID = "subj_nsmq_chemistry";
const ROUND_TYPE = "speed_race";
const LEGACY_TOPIC = "topic_nsmq_chem_atomic";
const TARGET_TOPIC = "topic_nsmq_chem_environmental";
const HISTORICAL_MIGRATION = "102_nsmq_question_alignment";
const CANONICAL_MIGRATIONS = [
  "278_nsmq_legacy_null_topic_part_1",
  "279_nsmq_legacy_null_topic_part_2",
  "280_nsmq_legacy_null_topic_part_3",
];
const EXPECTED_PREFIX = "_npr_expected";
const LOADER_FILES = ["00_expected_part_1.sql", "01_expected_part_2.sql", "02_expected_part_3.sql"];
const ACTION_FILES = ["03_preflight.sql", "04_reconcile.sql", "90_postflight.sql"];
const FLIGHT_FILES = [...LOADER_FILES, ...ACTION_FILES];
const PRE278_LEDGER = [
  "267_nsmq_topic_remediation_part_1.sql",
  "268_nsmq_topic_remediation_part_2.sql",
  "269_nsmq_topic_remediation_part_3.sql",
  "270_nsmq_topic_remediation_part_4.sql",
];
const POST278_LEDGER = [
  "278_nsmq_legacy_null_topic_part_1.sql",
  "279_nsmq_legacy_null_topic_part_2.sql",
  "280_nsmq_legacy_null_topic_part_3.sql",
  "281_cambridge_legacy_topic_remediation.sql",
  "282_battle_demo_data_integrity.sql",
];

const sql = (value) => value == null ? "NULL" : `'${String(value).replaceAll("'", "''")}'`;
const values = (rows) => rows.map((row) => `(${row.map(sql).join(",")})`).join(",\n  ");

function model() {
  const source = buildPlan();
  const resolved = new Map(source.topicResolutions.map((row) => {
    if (!row.candidateTopicIds.length) throw new Error(`Missing reviewed topic resolution: ${row.logicalTopicId}`);
    return [`${row.subjectId}:${row.logicalTopicId}`, row.candidateTopicIds[0]];
  }));
  const plan = {
    ...source,
    mappings: source.mappings.map((row) => ({ ...row, topicId: resolved.get(`${row.subjectId}:${row.topicId}`) })),
  };
  const target = plan.mappings.find((row) => row.questionId === QUESTION_ID);
  if (!target || target.subjectId !== SUBJECT_ID || target.roundType !== ROUND_TYPE || target.topicId !== TARGET_TOPIC || target.migrationId !== CANONICAL_MIGRATIONS[0]) {
    throw new Error("Reviewed NSMQ target drift");
  }
  if (plan.mappings.length !== 268 || plan.quarantines.length !== 2) throw new Error("Reviewed NSMQ manifest cardinality drift");
  const fingerprint = crypto.createHash("sha256").update(JSON.stringify({ mappings: plan.mappings, quarantines: plan.quarantines })).digest("hex");
  return { plan, target, fingerprint };
}

function expectedTables(plan, prefix) {
  return `CREATE TABLE ${prefix}_m(q TEXT PRIMARY KEY,s TEXT NOT NULL,r TEXT NOT NULL,t TEXT NOT NULL,m TEXT NOT NULL);
INSERT INTO ${prefix}_m VALUES
  ${values(plan.mappings.map((row) => [row.questionId, row.subjectId, row.roundType, row.topicId, row.migrationId]))};
CREATE TABLE ${prefix}_q(q TEXT PRIMARY KEY,s TEXT NOT NULL,r TEXT NOT NULL);
INSERT INTO ${prefix}_q VALUES
  ${values(plan.quarantines.map((row) => [row.questionId, row.subjectId, row.roundType]))};`;
}

function renderExpectedPartFull(rows, quarantines, first) {
  return `-- Bounded reviewed-scope ${first ? "initialization" : "population"}; retained through canonical release cleanup.\nPRAGMA foreign_keys=ON;
${first ? `CREATE TABLE IF NOT EXISTS ${EXPECTED_PREFIX}_m(q TEXT PRIMARY KEY,s TEXT NOT NULL,r TEXT NOT NULL,t TEXT NOT NULL,m TEXT NOT NULL);\nCREATE TABLE IF NOT EXISTS ${EXPECTED_PREFIX}_q(q TEXT PRIMARY KEY,s TEXT NOT NULL,r TEXT NOT NULL);\nDELETE FROM ${EXPECTED_PREFIX}_m;\nDELETE FROM ${EXPECTED_PREFIX}_q;\n` : ""}INSERT INTO ${EXPECTED_PREFIX}_m VALUES
  ${values(rows.map((row) => [row.questionId, row.subjectId, row.roundType, row.topicId, row.migrationId]))};
${quarantines.length ? `INSERT INTO ${EXPECTED_PREFIX}_q VALUES\n  ${values(quarantines.map((row) => [row.questionId, row.subjectId, row.roundType]))};\n` : ""}`;
}
function identityGuard(prefix) {
  return `(SELECT count(*) FROM ${prefix}_m)=268
  AND (SELECT count(*) FROM ${prefix}_q)=2
  AND (SELECT count(*) FROM questions q JOIN ${prefix}_m e ON e.q=q.id WHERE q.subject_id=e.s AND q.round_type=e.r)=268
  AND (SELECT count(*) FROM questions q JOIN ${prefix}_q e ON e.q=q.id WHERE q.subject_id=e.s AND q.round_type=e.r)=2
  AND NOT EXISTS(SELECT 1 FROM ${prefix}_m e LEFT JOIN topics t ON t.id=e.t WHERE t.id IS NULL OR t.subject_id<>e.s)
  AND (SELECT count(*) FROM topics t JOIN subjects s ON s.id=t.subject_id WHERE t.id=${sql(LEGACY_TOPIC)} AND t.subject_id=${sql(SUBJECT_ID)} AND s.exam_type_id='exam_nsmq' AND s.is_active=1)=1
  AND NOT EXISTS(SELECT 1 FROM (SELECT s FROM ${prefix}_m UNION SELECT s FROM ${prefix}_q) e LEFT JOIN subjects s ON s.id=e.s WHERE s.id IS NULL OR s.exam_type_id<>'exam_nsmq' OR s.is_active<>1)`;
}

function legacyLedgerStage() {
  return `(SELECT count(*) FROM d1_migrations WHERE name IN (${PRE278_LEDGER.map(sql).join(",")}))=4
  AND NOT EXISTS(SELECT 1 FROM d1_migrations WHERE name IN (${POST278_LEDGER.map(sql).join(",")}))
  AND (SELECT count(*) FROM question_bank_remediation_log WHERE migration_id='267_nsmq_topic_remediation_part_1')=103
  AND (SELECT count(*) FROM question_bank_remediation_log WHERE migration_id='268_nsmq_topic_remediation_part_2')=100
  AND (SELECT count(*) FROM question_bank_remediation_log WHERE migration_id='269_nsmq_topic_remediation_part_3')=100
  AND (SELECT count(*) FROM question_bank_remediation_log WHERE migration_id='270_nsmq_topic_remediation_part_4')=73`;
}

function canonicalLedgerStage() {
  return `(SELECT count(*) FROM d1_migrations WHERE name IN (${POST278_LEDGER.map(sql).join(",")}))=5`;
}
function legacyState(prefix) {
  return `(SELECT count(*) FROM questions q JOIN ${prefix}_m e ON e.q=q.id WHERE e.q<>${sql(QUESTION_ID)} AND q.topic_id IS NULL)=267
  AND (SELECT count(*) FROM questions WHERE id=${sql(QUESTION_ID)} AND subject_id=${sql(SUBJECT_ID)} AND round_type=${sql(ROUND_TYPE)} AND topic_id=${sql(LEGACY_TOPIC)})=1
  AND (SELECT count(*) FROM questions q JOIN ${prefix}_q e ON e.q=q.id WHERE q.topic_id IS NULL)=2
  AND NOT EXISTS(SELECT 1 FROM question_bank_remediation_log WHERE migration_id IN (${CANONICAL_MIGRATIONS.map(sql).join(",")}))
  AND (${legacyLedgerStage()})
  AND (SELECT count(*) FROM question_bank_remediation_log WHERE migration_id=${sql(HISTORICAL_MIGRATION)} AND entity_type='question' AND entity_id=${sql(QUESTION_ID)} AND field_name='topic_id' AND old_value='topic_wchem_atomic' AND new_value=${sql(LEGACY_TOPIC)})=1`;
}

function reconciledPre278State(prefix) {
  return `(${legacyLedgerStage()})
  AND (SELECT count(*) FROM questions q JOIN ${prefix}_m e ON e.q=q.id WHERE e.q<>${sql(QUESTION_ID)} AND q.topic_id IS NULL)=267
  AND (SELECT count(*) FROM questions WHERE id=${sql(QUESTION_ID)} AND subject_id=${sql(SUBJECT_ID)} AND round_type=${sql(ROUND_TYPE)} AND topic_id IS NULL)=1
  AND (SELECT count(*) FROM questions q JOIN ${prefix}_q e ON e.q=q.id WHERE q.topic_id IS NULL)=2
  AND NOT EXISTS(SELECT 1 FROM question_bank_remediation_log WHERE migration_id IN (${CANONICAL_MIGRATIONS.map(sql).join(",")}))
  AND (SELECT count(*) FROM question_bank_remediation_log WHERE migration_id=${sql(HISTORICAL_MIGRATION)} AND entity_type='question' AND entity_id=${sql(QUESTION_ID)} AND field_name='topic_id' AND old_value='topic_wchem_atomic' AND new_value=${sql(LEGACY_TOPIC)})=1`;
}
function canonicalState(prefix) {
  return `(${canonicalLedgerStage()})
  AND (SELECT count(*) FROM questions q JOIN ${prefix}_m e ON e.q=q.id WHERE q.topic_id=e.t)=268
  AND (SELECT count(*) FROM questions q JOIN ${prefix}_q e ON e.q=q.id WHERE q.topic_id IS NULL)=2
  AND (SELECT count(*) FROM question_bank_remediation_log l JOIN ${prefix}_m e ON e.q=l.entity_id AND e.m=l.migration_id WHERE l.entity_type='question' AND l.field_name='topic_id' AND l.old_value IS NULL AND l.new_value=e.t)=268
  AND (SELECT count(*) FROM question_bank_remediation_log WHERE migration_id IN (${CANONICAL_MIGRATIONS.map(sql).join(",")}))=268`;
}

function guard(name, condition) {
  return `CREATE TABLE ${name}(valid INTEGER NOT NULL CHECK(valid=1));\nINSERT INTO ${name} SELECT CASE WHEN ${condition} THEN 1 ELSE 0 END;\nDROP TABLE ${name};`;
}

function renderPreflightFull(fingerprint) {
  const p = EXPECTED_PREFIX;
  return `-- Fail closed unless the complete 270-row reviewed NSMQ scope is exact legacy production or exact canonical post-278 staging.\nPRAGMA foreign_keys=ON;\n${guard(`${p}_guard`, `${identityGuard(p)} AND ((${legacyState(p)}) OR (${reconciledPre278State(p)}) OR (${canonicalState(p)})) AND NOT EXISTS(SELECT 1 FROM pragma_foreign_key_check)`)}\n`;
}

function renderReconcileFull(f) { const p=EXPECTED_PREFIX,fresh=`NOT EXISTS(SELECT 1 FROM nsmq_pre278_reconcile_state WHERE release=${sql(RELEASE)})`,existing=`(SELECT status||':'||expected_count||':'||manifest_fingerprint FROM nsmq_pre278_reconcile_state WHERE release=${sql(RELEASE)})=${sql(`completed:268:${f}`)}`,backupExact=`EXISTS(SELECT 1 FROM nsmq_pre278_reconcile_fingerprint z JOIN (${backupFpFull()}) x ON z.c=x.c AND z.n=x.n AND z.a=x.a AND z.b=x.b WHERE z.release=${sql(RELEASE)} AND z.c=268)`; return `PRAGMA foreign_keys=ON;\nCREATE TABLE IF NOT EXISTS nsmq_pre278_reconcile_state(release TEXT PRIMARY KEY,mode TEXT NOT NULL CHECK(mode IN('legacy','reviewed_noop')),status TEXT NOT NULL CHECK(status IN('started','completed','rolled_back')),expected_count INTEGER NOT NULL,manifest_fingerprint TEXT NOT NULL);\nCREATE TABLE IF NOT EXISTS nsmq_pre278_reconcile_backup(release TEXT NOT NULL,question_id TEXT NOT NULL,subject_id TEXT NOT NULL,round_type TEXT NOT NULL,old_topic_id TEXT NOT NULL,target_topic_id TEXT NOT NULL,canonical_migration TEXT NOT NULL,PRIMARY KEY(release,question_id));\nCREATE TABLE IF NOT EXISTS nsmq_pre278_reconcile_audit(id INTEGER PRIMARY KEY AUTOINCREMENT,release TEXT NOT NULL,question_id TEXT NOT NULL,old_topic_id TEXT NOT NULL,new_topic_id TEXT,UNIQUE(release,question_id));\nCREATE TABLE IF NOT EXISTS nsmq_pre278_reconcile_fingerprint(release TEXT PRIMARY KEY,c INTEGER NOT NULL,n INTEGER NOT NULL,a INTEGER NOT NULL,b INTEGER NOT NULL);\n${guard(p+'_guard',`${identityFull(p)} AND ((${fresh} AND ((${legacyFull(p)}) OR (${canonicalFull(p)}))) OR (${existing}))`)}\nINSERT INTO nsmq_pre278_reconcile_state SELECT ${sql(RELEASE)},CASE WHEN (${legacyLedgerStage()}) THEN 'legacy' ELSE 'reviewed_noop' END,'started',268,${sql(f)} WHERE ${fresh};\nINSERT INTO nsmq_pre278_reconcile_backup SELECT ${sql(RELEASE)},q.id,q.subject_id,q.round_type,q.topic_id,e.t,e.m FROM questions q JOIN ${p}_m e ON e.q=q.id WHERE (SELECT mode||':'||status FROM nsmq_pre278_reconcile_state WHERE release=${sql(RELEASE)})='legacy:started';\nINSERT INTO nsmq_pre278_reconcile_fingerprint(release,c,n,a,b) SELECT ${sql(RELEASE)},c,n,a,b FROM (${backupFpFull()}) WHERE (SELECT mode||':'||status FROM nsmq_pre278_reconcile_state WHERE release=${sql(RELEASE)})='legacy:started';\nINSERT INTO nsmq_pre278_reconcile_audit(release,question_id,old_topic_id,new_topic_id) SELECT ${sql(RELEASE)},question_id,old_topic_id,NULL FROM nsmq_pre278_reconcile_backup WHERE release=${sql(RELEASE)} AND NOT EXISTS(SELECT 1 FROM nsmq_pre278_reconcile_audit WHERE release=${sql(RELEASE)});\nUPDATE questions SET topic_id=NULL WHERE id IN (SELECT question_id FROM nsmq_pre278_reconcile_backup WHERE release=${sql(RELEASE)}) AND (SELECT mode||':'||status FROM nsmq_pre278_reconcile_state WHERE release=${sql(RELEASE)})='legacy:started';\nUPDATE nsmq_pre278_reconcile_state SET status='completed' WHERE release=${sql(RELEASE)} AND status='started';\n${guard(p+'_post_guard',`((SELECT mode||':'||status FROM nsmq_pre278_reconcile_state WHERE release=${sql(RELEASE)})='legacy:completed' AND (SELECT count(*) FROM nsmq_pre278_reconcile_backup WHERE release=${sql(RELEASE)})=268 AND (SELECT count(*) FROM nsmq_pre278_reconcile_audit WHERE release=${sql(RELEASE)})=268 AND (${backupExact}) AND (SELECT count(*) FROM questions q JOIN ${p}_m e ON e.q=q.id WHERE q.topic_id IS NULL)=268) OR ((SELECT mode||':'||status FROM nsmq_pre278_reconcile_state WHERE release=${sql(RELEASE)})='reviewed_noop:completed' AND (${canonicalFull(p)}) AND (SELECT count(*) FROM nsmq_pre278_reconcile_backup WHERE release=${sql(RELEASE)})=0 AND (SELECT count(*) FROM nsmq_pre278_reconcile_fingerprint WHERE release=${sql(RELEASE)})=0)`)}\n`; }
function renderPostflightFull(fingerprint) {
  const p = EXPECTED_PREFIX;
  const completedLegacy = `(SELECT mode||':'||status||':'||next_step FROM nsmq_pre278_reconcile_state WHERE release=${sql(RELEASE)})='legacy:completed:2' AND (SELECT topic_id IS NULL FROM questions WHERE id=${sql(QUESTION_ID)}) AND (SELECT count(*) FROM questions q JOIN ${p}_m e ON e.q=q.id WHERE e.q<>${sql(QUESTION_ID)} AND q.topic_id IS NULL)=267 AND (SELECT count(*) FROM nsmq_pre278_reconcile_backup WHERE release=${sql(RELEASE)} AND question_id=${sql(QUESTION_ID)} AND old_topic_id=${sql(LEGACY_TOPIC)})=1 AND (SELECT count(*) FROM nsmq_pre278_reconcile_audit WHERE release=${sql(RELEASE)} AND question_id=${sql(QUESTION_ID)} AND old_topic_id=${sql(LEGACY_TOPIC)} AND new_topic_id IS NULL)=1`;
  const noOp = `(SELECT mode||':'||status||':'||next_step FROM nsmq_pre278_reconcile_state WHERE release=${sql(RELEASE)})='reviewed_noop:completed:2' AND (${canonicalState(p)}) AND (SELECT count(*) FROM nsmq_pre278_reconcile_backup WHERE release=${sql(RELEASE)})=0 AND (SELECT count(*) FROM nsmq_pre278_reconcile_audit WHERE release=${sql(RELEASE)})=0`;
  return `-- Stop gate before canonical migration 278.\nPRAGMA foreign_keys=ON;\n${guard(`${p}_guard`, `${identityGuard(p)} AND ((${completedLegacy}) OR (${noOp})) AND NOT EXISTS(SELECT 1 FROM pragma_foreign_key_check)`)}\nSELECT mode,status,next_step FROM nsmq_pre278_reconcile_state WHERE release=${sql(RELEASE)};\n`;
}

function renderRollbackFull(fingerprint) {
  const p = EXPECTED_PREFIX;
  return `-- Separate rollback; never part of the forward runner. Only valid before migration 278.\nPRAGMA foreign_keys=ON;\n${guard(`${p}_guard`, `${identityGuard(p)} AND (SELECT mode||':'||status FROM nsmq_pre278_reconcile_state WHERE release=${sql(RELEASE)})='legacy:completed' AND (SELECT topic_id IS NULL FROM questions WHERE id=${sql(QUESTION_ID)}) AND (SELECT count(*) FROM nsmq_pre278_reconcile_backup WHERE release=${sql(RELEASE)} AND question_id=${sql(QUESTION_ID)} AND old_topic_id=${sql(LEGACY_TOPIC)})=1 AND (SELECT count(*) FROM nsmq_pre278_reconcile_audit WHERE release=${sql(RELEASE)})=1 AND (${legacyLedgerStage()}) AND NOT EXISTS(SELECT 1 FROM question_bank_remediation_log WHERE migration_id IN (${CANONICAL_MIGRATIONS.map(sql).join(",")}))`)}
UPDATE questions SET topic_id=(SELECT old_topic_id FROM nsmq_pre278_reconcile_backup WHERE release=${sql(RELEASE)} AND question_id=questions.id) WHERE id=${sql(QUESTION_ID)};
UPDATE nsmq_pre278_reconcile_state SET status='rolled_back',next_step=1 WHERE release=${sql(RELEASE)};
${guard(`${p}_post_guard`, `${legacyState(p)} AND (SELECT mode||':'||status FROM nsmq_pre278_reconcile_state WHERE release=${sql(RELEASE)})='legacy:rolled_back'`)}
`;
}

function renderCleanupFull(fingerprint) {
  const p = EXPECTED_PREFIX;
  const legacyEvidence = `(SELECT mode||':'||status FROM nsmq_pre278_reconcile_state WHERE release=${sql(RELEASE)})='legacy:completed' AND (SELECT count(*) FROM nsmq_pre278_reconcile_backup WHERE release=${sql(RELEASE)})=1 AND (SELECT count(*) FROM nsmq_pre278_reconcile_audit WHERE release=${sql(RELEASE)})=1`;
  const noOpEvidence = `(SELECT mode||':'||status FROM nsmq_pre278_reconcile_state WHERE release=${sql(RELEASE)})='reviewed_noop:completed' AND (SELECT count(*) FROM nsmq_pre278_reconcile_backup WHERE release=${sql(RELEASE)})=0 AND (SELECT count(*) FROM nsmq_pre278_reconcile_audit WHERE release=${sql(RELEASE)})=0`;
  return `-- Explicit post-release cleanup. Run only after canonical migrations 278-282 and their postflight pass.\nPRAGMA foreign_keys=ON;\n${guard(`${p}_guard`, `${identityGuard(p)} AND (${canonicalState(p)}) AND ((${legacyEvidence}) OR (${noOpEvidence}))`)}
DROP TABLE nsmq_pre278_reconcile_audit;\nDROP TABLE nsmq_pre278_reconcile_backup;\nDROP TABLE nsmq_pre278_reconcile_state;\nDROP TABLE ${p}_q;\nDROP TABLE ${p}_m;\n`;
}

function renderRunnerFull() {
  return `#!/usr/bin/env node\n'use strict';\nconst path=require('node:path'),{execFileSync}=require('node:child_process');\nconst files=${JSON.stringify(FLIGHT_FILES)},args=process.argv.slice(2),value=(n)=>{const i=args.indexOf(n);return i<0?null:args[i+1];},env=value('--env'),confirm=value('--confirm'),targets={production:'aa806d65-d3dd-4cf9-9cac-e3ddd252f937',staging:'1faeca41-2233-4a0b-a273-0d3aadba9c96'},db=targets[env];\nif(!db||confirm!==env+':'+db)throw Error('Use --env production|staging --confirm <env>:<pinned-uuid>');\nconst root=path.resolve(__dirname,'../../..'),wrangler=path.join(root,'node_modules','wrangler','bin','wrangler.js');\nfor(const file of files){const a=[wrangler,'d1','execute',db,'--remote','--file',path.join(__dirname,file)];if(env==='staging')a.push('--env','staging');process.stdout.write('RUN '+file+'\\n');execFileSync(process.execPath,a,{cwd:root,stdio:'inherit'});}\nprocess.stdout.write('STOP: now run unchanged canonical migrations 278-282 in order, then their canonical postflight. Cleanup remains separate.\\n');\n`;
}

function renderRunbook() { return "# NSMQ pre-278 full-scope reconciliation\n\nRun after 267-277 and before immutable 278. The flight proves, backs up, audits, and nulls exactly 268 reviewed rows. Retained scratch is never recreated. Rollback and cleanup are separate.\n";
}


// Full-scope production-shape overrides. Earlier helpers remain only to keep the generator diff reviewable.
function renderExpectedPartFull(rows, quarantines, first) {
  return `PRAGMA foreign_keys=ON;\n${first ? `CREATE TABLE ${EXPECTED_PREFIX}_m(q TEXT PRIMARY KEY,s TEXT NOT NULL,r TEXT NOT NULL,t TEXT NOT NULL,m TEXT NOT NULL);\nCREATE TABLE ${EXPECTED_PREFIX}_q(q TEXT PRIMARY KEY,s TEXT NOT NULL,r TEXT NOT NULL);\n` : ""}INSERT INTO ${EXPECTED_PREFIX}_m VALUES\n  ${values(rows.map((x) => [x.questionId,x.subjectId,x.roundType,x.topicId,x.migrationId]))};\n${quarantines.length ? `INSERT INTO ${EXPECTED_PREFIX}_q VALUES\n  ${values(quarantines.map((x) => [x.questionId,x.subjectId,x.roundType]))};\n` : ""}`;
}
const P1=2147483647,P2=2147483629;
function fpSelectFull(source,orderBy,fields) { return `WITH RECURSIVE r(k,v) AS (SELECT row_number() OVER(ORDER BY ${orderBy}),json_array(${fields}) FROM (${source})),w(k,i,n,a,b,v) AS (SELECT k,0,length(v),7,11,v FROM r UNION ALL SELECT k,i+1,n,(a*131+unicode(substr(v,i+1,1)))%${P1},(b*137+unicode(substr(v,i+1,1)))%${P2},v FROM w WHERE i<n),f AS (SELECT k,n,a,b FROM w WHERE i=n) SELECT count(*) c,coalesce(sum(n),0) n,coalesce(sum((a*k)%${P1})%${P1},0) a,coalesce(sum((b*k)%${P2})%${P2},0) b FROM f`; }
function manifestFull(p) { return `(SELECT c=268 AND n=31109 AND a=906496064 AND b=615681201 FROM (${fpSelectFull(`SELECT q,s,r,t,m FROM ${p}_m`,'q','q,s,r,t,m')}))`; }
function backupFpFull() { return fpSelectFull(`SELECT question_id,subject_id,round_type,old_topic_id,target_topic_id,canonical_migration FROM nsmq_pre278_reconcile_backup WHERE release=${sql(RELEASE)}`,'question_id','question_id,subject_id,round_type,old_topic_id,target_topic_id,canonical_migration'); }
function identityFull(p) { return `(${identityGuard(p)}) AND (${manifestFull(p)})`; }

function provenanceFull(p) { return `(SELECT count(*) FROM question_bank_remediation_log l JOIN ${p}_m e ON e.q=l.entity_id WHERE e.q<>${sql(QUESTION_ID)} AND l.migration_id='100_question_bank_integrity' AND l.entity_type='question' AND l.field_name='topic_id')=267 AND (SELECT count(*) FROM question_bank_remediation_log l JOIN ${p}_m e ON e.q=l.entity_id WHERE e.q<>${sql(QUESTION_ID)} AND l.migration_id='102_nsmq_question_alignment' AND l.entity_type='question' AND l.field_name='topic_id' AND l.new_value IS NOT NULL)=267 AND (SELECT count(*) FROM question_bank_remediation_log WHERE migration_id='102_nsmq_question_alignment' AND entity_type='question' AND entity_id=${sql(QUESTION_ID)} AND field_name='topic_id' AND old_value='topic_wchem_atomic' AND new_value=${sql(LEGACY_TOPIC)})=1`; }
function legacyFull(p) { return `(${legacyLedgerStage()}) AND (${provenanceFull(p)}) AND (SELECT count(*) FROM questions q JOIN ${p}_m e ON e.q=q.id JOIN question_bank_remediation_log l ON l.entity_id=e.q AND l.migration_id='102_nsmq_question_alignment' AND l.entity_type='question' AND l.field_name='topic_id' AND l.new_value=q.topic_id WHERE q.topic_id IS NOT NULL)=268 AND (SELECT count(*) FROM questions q JOIN ${p}_m e ON e.q=q.id JOIN topics t ON t.id=q.topic_id AND t.subject_id=e.s JOIN subjects s ON s.id=e.s AND s.exam_type_id='exam_nsmq' AND s.is_active=1)=268 AND (SELECT count(*) FROM questions q JOIN ${p}_m e ON e.q=q.id WHERE q.topic_id=e.t)=183 AND (SELECT count(*) FROM questions q JOIN ${p}_m e ON e.q=q.id WHERE q.topic_id IS NOT e.t)=85 AND (SELECT count(*) FROM questions q JOIN ${p}_q e ON e.q=q.id WHERE q.topic_id IS NULL)=2 AND NOT EXISTS(SELECT 1 FROM question_bank_remediation_log WHERE migration_id IN (${CANONICAL_MIGRATIONS.map(sql).join(',')}))`; }
function canonicalFull(p) { return `(${canonicalLedgerStage()}) AND (SELECT count(*) FROM questions q JOIN ${p}_m e ON e.q=q.id WHERE q.topic_id=e.t)=268 AND (SELECT count(*) FROM questions q JOIN ${p}_q e ON e.q=q.id WHERE q.topic_id IS NULL)=2 AND (SELECT count(*) FROM questions q JOIN ${p}_m e ON e.q=q.id JOIN topics t ON t.id=q.topic_id AND t.subject_id=e.s JOIN subjects s ON s.id=e.s AND s.exam_type_id='exam_nsmq' AND s.is_active=1)=268 AND (SELECT count(*) FROM question_bank_remediation_log l JOIN ${p}_m e ON e.q=l.entity_id AND e.m=l.migration_id WHERE l.entity_type='question' AND l.field_name='topic_id' AND l.old_value IS NULL AND l.new_value=e.t)=268 AND (SELECT count(*) FROM question_bank_remediation_log WHERE migration_id IN (${CANONICAL_MIGRATIONS.map(sql).join(',')}))=268`; }
function evidenceFull(p,f,state) { return `(SELECT mode||':'||status||':'||expected_count||':'||manifest_fingerprint FROM nsmq_pre278_reconcile_state WHERE release=${sql(RELEASE)})=${sql(`legacy:completed:268:${f}`)} AND (SELECT count(*) FROM nsmq_pre278_reconcile_backup b JOIN ${p}_m e ON e.q=b.question_id JOIN question_bank_remediation_log l ON l.entity_id=e.q AND l.migration_id='102_nsmq_question_alignment' AND l.entity_type='question' AND l.field_name='topic_id' AND l.new_value=b.old_topic_id WHERE b.release=${sql(RELEASE)} AND b.subject_id=e.s AND b.round_type=e.r AND b.target_topic_id=e.t AND b.canonical_migration=e.m)=268 AND EXISTS(SELECT 1 FROM nsmq_pre278_reconcile_fingerprint f JOIN (${backupFpFull()}) x ON f.c=x.c AND f.n=x.n AND f.a=x.a AND f.b=x.b WHERE f.release=${sql(RELEASE)} AND f.c=268) AND (SELECT count(*) FROM nsmq_pre278_reconcile_audit a JOIN nsmq_pre278_reconcile_backup b ON b.release=a.release AND b.question_id=a.question_id WHERE a.release=${sql(RELEASE)} AND a.old_topic_id=b.old_topic_id AND a.new_topic_id IS NULL)=268 AND (SELECT count(*) FROM questions q JOIN ${p}_m e ON e.q=q.id WHERE ${state})=268`; }
function renderPreflightFull(f) { const p=EXPECTED_PREFIX, pre=`(${legacyLedgerStage()}) AND (${evidenceFull(p,f,'q.topic_id IS NULL')})`, post=`(${canonicalFull(p)}) AND (${evidenceFull(p,f,'q.topic_id=e.t')})`, noop=`(${canonicalFull(p)}) AND (SELECT mode FROM nsmq_pre278_reconcile_state WHERE release=${sql(RELEASE)})='reviewed_noop' AND (SELECT count(*) FROM nsmq_pre278_reconcile_fingerprint WHERE release=${sql(RELEASE)})=0`; return `PRAGMA foreign_keys=ON;\nCREATE TABLE IF NOT EXISTS nsmq_pre278_reconcile_state(release TEXT PRIMARY KEY,mode TEXT NOT NULL CHECK(mode IN('legacy','reviewed_noop')),status TEXT NOT NULL CHECK(status IN('started','completed','rolled_back')),expected_count INTEGER NOT NULL,manifest_fingerprint TEXT NOT NULL);\nCREATE TABLE IF NOT EXISTS nsmq_pre278_reconcile_backup(release TEXT NOT NULL,question_id TEXT NOT NULL,subject_id TEXT NOT NULL,round_type TEXT NOT NULL,old_topic_id TEXT NOT NULL,target_topic_id TEXT NOT NULL,canonical_migration TEXT NOT NULL,PRIMARY KEY(release,question_id));\nCREATE TABLE IF NOT EXISTS nsmq_pre278_reconcile_audit(id INTEGER PRIMARY KEY AUTOINCREMENT,release TEXT NOT NULL,question_id TEXT NOT NULL,old_topic_id TEXT NOT NULL,new_topic_id TEXT,UNIQUE(release,question_id));\nCREATE TABLE IF NOT EXISTS nsmq_pre278_reconcile_fingerprint(release TEXT PRIMARY KEY,c INTEGER NOT NULL,n INTEGER NOT NULL,a INTEGER NOT NULL,b INTEGER NOT NULL);\n${guard(p+'_guard',`${identityFull(p)} AND ((${legacyFull(p)}) OR (${pre}) OR ((${canonicalFull(p)}) AND NOT EXISTS(SELECT 1 FROM nsmq_pre278_reconcile_state WHERE release=${sql(RELEASE)})) OR (${post}) OR (${noop})) AND NOT EXISTS(SELECT 1 FROM pragma_foreign_key_check)`)}\n`; }
function renderReconcileFull(f) { const p=EXPECTED_PREFIX,fresh=`NOT EXISTS(SELECT 1 FROM nsmq_pre278_reconcile_state WHERE release=${sql(RELEASE)})`,existing=`(SELECT status||':'||expected_count||':'||manifest_fingerprint FROM nsmq_pre278_reconcile_state WHERE release=${sql(RELEASE)})=${sql(`completed:268:${f}`)}`,backupExact=`EXISTS(SELECT 1 FROM nsmq_pre278_reconcile_fingerprint z JOIN (${backupFpFull()}) x ON z.c=x.c AND z.n=x.n AND z.a=x.a AND z.b=x.b WHERE z.release=${sql(RELEASE)} AND z.c=268)`; return `PRAGMA foreign_keys=ON;\nCREATE TABLE IF NOT EXISTS nsmq_pre278_reconcile_state(release TEXT PRIMARY KEY,mode TEXT NOT NULL CHECK(mode IN('legacy','reviewed_noop')),status TEXT NOT NULL CHECK(status IN('started','completed','rolled_back')),expected_count INTEGER NOT NULL,manifest_fingerprint TEXT NOT NULL);\nCREATE TABLE IF NOT EXISTS nsmq_pre278_reconcile_backup(release TEXT NOT NULL,question_id TEXT NOT NULL,subject_id TEXT NOT NULL,round_type TEXT NOT NULL,old_topic_id TEXT NOT NULL,target_topic_id TEXT NOT NULL,canonical_migration TEXT NOT NULL,PRIMARY KEY(release,question_id));\nCREATE TABLE IF NOT EXISTS nsmq_pre278_reconcile_audit(id INTEGER PRIMARY KEY AUTOINCREMENT,release TEXT NOT NULL,question_id TEXT NOT NULL,old_topic_id TEXT NOT NULL,new_topic_id TEXT,UNIQUE(release,question_id));\nCREATE TABLE IF NOT EXISTS nsmq_pre278_reconcile_fingerprint(release TEXT PRIMARY KEY,c INTEGER NOT NULL,n INTEGER NOT NULL,a INTEGER NOT NULL,b INTEGER NOT NULL);\n${guard(p+'_guard',`${identityFull(p)} AND ((${fresh} AND ((${legacyFull(p)}) OR (${canonicalFull(p)}))) OR (${existing}))`)}\nINSERT INTO nsmq_pre278_reconcile_state SELECT ${sql(RELEASE)},CASE WHEN (${legacyLedgerStage()}) THEN 'legacy' ELSE 'reviewed_noop' END,'started',268,${sql(f)} WHERE ${fresh};\nINSERT INTO nsmq_pre278_reconcile_backup SELECT ${sql(RELEASE)},q.id,q.subject_id,q.round_type,q.topic_id,e.t,e.m FROM questions q JOIN ${p}_m e ON e.q=q.id WHERE (SELECT mode||':'||status FROM nsmq_pre278_reconcile_state WHERE release=${sql(RELEASE)})='legacy:started';\nINSERT INTO nsmq_pre278_reconcile_fingerprint(release,c,n,a,b) SELECT ${sql(RELEASE)},c,n,a,b FROM (${backupFpFull()}) WHERE (SELECT mode||':'||status FROM nsmq_pre278_reconcile_state WHERE release=${sql(RELEASE)})='legacy:started';\nINSERT INTO nsmq_pre278_reconcile_audit(release,question_id,old_topic_id,new_topic_id) SELECT ${sql(RELEASE)},question_id,old_topic_id,NULL FROM nsmq_pre278_reconcile_backup WHERE release=${sql(RELEASE)} AND NOT EXISTS(SELECT 1 FROM nsmq_pre278_reconcile_audit WHERE release=${sql(RELEASE)});\nUPDATE questions SET topic_id=NULL WHERE id IN (SELECT question_id FROM nsmq_pre278_reconcile_backup WHERE release=${sql(RELEASE)}) AND (SELECT mode||':'||status FROM nsmq_pre278_reconcile_state WHERE release=${sql(RELEASE)})='legacy:started';\nUPDATE nsmq_pre278_reconcile_state SET status='completed' WHERE release=${sql(RELEASE)} AND status='started';\n${guard(p+'_post_guard',`((SELECT mode||':'||status FROM nsmq_pre278_reconcile_state WHERE release=${sql(RELEASE)})='legacy:completed' AND (SELECT count(*) FROM nsmq_pre278_reconcile_backup WHERE release=${sql(RELEASE)})=268 AND (SELECT count(*) FROM nsmq_pre278_reconcile_audit WHERE release=${sql(RELEASE)})=268 AND (${backupExact}) AND (SELECT count(*) FROM questions q JOIN ${p}_m e ON e.q=q.id WHERE q.topic_id IS NULL)=268) OR ((SELECT mode||':'||status FROM nsmq_pre278_reconcile_state WHERE release=${sql(RELEASE)})='reviewed_noop:completed' AND (${canonicalFull(p)}) AND (SELECT count(*) FROM nsmq_pre278_reconcile_backup WHERE release=${sql(RELEASE)})=0 AND (SELECT count(*) FROM nsmq_pre278_reconcile_fingerprint WHERE release=${sql(RELEASE)})=0)`)}\n`; }
function renderPostflightFull(f) { const p=EXPECTED_PREFIX; return `PRAGMA foreign_keys=ON;\n${guard(p+'_guard',`${identityFull(p)} AND (((${legacyLedgerStage()}) AND (${evidenceFull(p,f,'q.topic_id IS NULL')})) OR ((${canonicalFull(p)}) AND ((${evidenceFull(p,f,'q.topic_id=e.t')}) OR ((SELECT mode FROM nsmq_pre278_reconcile_state WHERE release=${sql(RELEASE)})='reviewed_noop' AND (SELECT count(*) FROM nsmq_pre278_reconcile_fingerprint WHERE release=${sql(RELEASE)})=0)))) AND NOT EXISTS(SELECT 1 FROM pragma_foreign_key_check)`)}\nSELECT mode,status,expected_count,manifest_fingerprint FROM nsmq_pre278_reconcile_state WHERE release=${sql(RELEASE)};\n`; }
function renderRollbackFull(f) { const p=EXPECTED_PREFIX; return `PRAGMA foreign_keys=ON;\n${guard(p+'_guard',`(${legacyLedgerStage()}) AND (${evidenceFull(p,f,'q.topic_id IS NULL')})`)}\nUPDATE questions SET topic_id=(SELECT old_topic_id FROM nsmq_pre278_reconcile_backup b WHERE b.release=${sql(RELEASE)} AND b.question_id=questions.id) WHERE id IN (SELECT question_id FROM nsmq_pre278_reconcile_backup WHERE release=${sql(RELEASE)});\nUPDATE nsmq_pre278_reconcile_state SET status='rolled_back' WHERE release=${sql(RELEASE)};\n${guard(p+'_post_guard',`${legacyFull(p)} AND (SELECT status FROM nsmq_pre278_reconcile_state WHERE release=${sql(RELEASE)})='rolled_back'`)}\n`; }
function renderCleanupFull(f) { const p=EXPECTED_PREFIX; return `PRAGMA foreign_keys=ON;\n${guard(p+'_guard',`${identityFull(p)} AND (${canonicalFull(p)}) AND ((${evidenceFull(p,f,'q.topic_id=e.t')}) OR ((SELECT mode FROM nsmq_pre278_reconcile_state WHERE release=${sql(RELEASE)})='reviewed_noop' AND (SELECT count(*) FROM nsmq_pre278_reconcile_fingerprint WHERE release=${sql(RELEASE)})=0))`)}\nDROP TABLE nsmq_pre278_reconcile_fingerprint;\nDROP TABLE nsmq_pre278_reconcile_audit;\nDROP TABLE nsmq_pre278_reconcile_backup;\nDROP TABLE nsmq_pre278_reconcile_state;\nDROP TABLE ${p}_q;\nDROP TABLE ${p}_m;\n`; }
function renderRunnerFull() { return `#!/usr/bin/env node\n'use strict';\nconst path=require('node:path'),{execFileSync}=require('node:child_process'),loaders=${JSON.stringify(LOADER_FILES)},actions=${JSON.stringify(ACTION_FILES)},args=process.argv.slice(2),value=(n)=>{const i=args.indexOf(n);return i<0?null:args[i+1]},env=value('--env'),confirm=value('--confirm'),targets={production:'aa806d65-d3dd-4cf9-9cac-e3ddd252f937',staging:'1faeca41-2233-4a0b-a273-0d3aadba9c96'},db=targets[env];if(!db||confirm!==env+':'+db)throw Error('Use --env production|staging --confirm <env>:<pinned-uuid>');const root=path.resolve(__dirname,'../../..'),wrangler=path.join(root,'node_modules','wrangler','bin','wrangler.js'),base=[wrangler,'d1','execute',db,'--remote'];if(env==='staging')base.push('--env','staging');const raw=execFileSync(process.execPath,[...base,'--command',\"SELECT EXISTS(SELECT 1 FROM sqlite_master WHERE name='_npr_expected_m') m,EXISTS(SELECT 1 FROM sqlite_master WHERE name='_npr_expected_q') q\",'--json'],{cwd:root,encoding:'utf8'}),find=(v)=>{if(Array.isArray(v)){for(const x of v){const r=find(x);if(r)return r}}else if(v&&typeof v==='object'){if(Object.hasOwn(v,'m')&&Object.hasOwn(v,'q'))return v;for(const x of Object.values(v)){const r=find(x);if(r)return r}}},state=find(JSON.parse(raw));if(!state)throw Error('Unable to classify retained expected scratch');let files;if(+state.m===0&&+state.q===0)files=[...loaders,...actions];else if(+state.m===1&&+state.q===1)files=actions;else throw Error('Interrupted expected scratch');for(const file of files)execFileSync(process.execPath,[...base,'--file',path.join(__dirname,file)],{cwd:root,stdio:'inherit'});\n`; }

function renderFiles() {
  const { plan, fingerprint } = model();
  return new Map([
    [path.join(OUT, "00_expected_part_1.sql"), renderExpectedPartFull(plan.mappings.slice(0, 90), [], true)],
    [path.join(OUT, "01_expected_part_2.sql"), renderExpectedPartFull(plan.mappings.slice(90, 180), [], false)],
    [path.join(OUT, "02_expected_part_3.sql"), renderExpectedPartFull(plan.mappings.slice(180), plan.quarantines, false)],
    [path.join(OUT, "03_preflight.sql"), renderPreflightFull(fingerprint)],
    [path.join(OUT, "04_reconcile.sql"), renderReconcileFull(fingerprint)],
    [path.join(OUT, "90_postflight.sql"), renderPostflightFull(fingerprint)],
    [path.join(OUT, "99_cleanup_after_release.sql"), renderCleanupFull(fingerprint)],
    [path.join(OUT, "rollback", "01_restore_legacy_topics.sql"), renderRollbackFull(fingerprint)],
    [path.join(OUT, "run-flight.cjs"), renderRunnerFull()],
    [path.join(OUT, "RUNBOOK.md"), renderRunbook()],
  ]);
}

function writeOrCheck(files, check) {
  for (const [file, content] of files) {
    if (check) {
      if (!fs.existsSync(file) || fs.readFileSync(file, "utf8") !== content) throw new Error(`Generated artifact drift: ${path.relative(ROOT, file)}`);
    } else {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, content);
    }
  }
}

if (require.main === module) {
  const files = renderFiles();
  writeOrCheck(files, process.argv.includes("--check"));
  process.stdout.write(`${JSON.stringify({ release: RELEASE, target: QUESTION_ID, files: [...files.keys()].map((file) => path.relative(ROOT, file)) }, null, 2)}\n`);
}

module.exports = { ACTION_FILES, CANONICAL_MIGRATIONS, FLIGHT_FILES, LOADER_FILES, POST278_LEDGER, PRE278_LEDGER, LEGACY_TOPIC, OUT, QUESTION_ID, RELEASE, TARGET_TOPIC, model, renderFiles, writeOrCheck };
