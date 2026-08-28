"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { buildPlan } = require("./generate-nsmq-legacy-null-topic-remediation.cjs");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "database", "reconciliation", "nsmq-pre278");
const RELEASE = "nsmq-pre278-one-row-reconciliation-2026-08-28";
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
const FLIGHT_FILES = ["00_expected_part_1.sql", "01_expected_part_2.sql", "02_expected_part_3.sql", "03_preflight.sql", "04_reconcile.sql", "90_postflight.sql"];
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
  return { plan, target };
}

function expectedTables(plan, prefix) {
  return `CREATE TABLE ${prefix}_m(q TEXT PRIMARY KEY,s TEXT NOT NULL,r TEXT NOT NULL,t TEXT NOT NULL,m TEXT NOT NULL);
INSERT INTO ${prefix}_m VALUES
  ${values(plan.mappings.map((row) => [row.questionId, row.subjectId, row.roundType, row.topicId, row.migrationId]))};
CREATE TABLE ${prefix}_q(q TEXT PRIMARY KEY,s TEXT NOT NULL,r TEXT NOT NULL);
INSERT INTO ${prefix}_q VALUES
  ${values(plan.quarantines.map((row) => [row.questionId, row.subjectId, row.roundType]))};`;
}

function renderExpectedPart(rows, quarantines, first) {
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

function renderPreflight(plan) {
  const p = EXPECTED_PREFIX;
  return `-- Fail closed unless the complete 270-row reviewed NSMQ scope is exact legacy production or exact canonical post-278 staging.\nPRAGMA foreign_keys=ON;\n${guard(`${p}_guard`, `${identityGuard(p)} AND ((${legacyState(p)}) OR (${reconciledPre278State(p)}) OR (${canonicalState(p)})) AND NOT EXISTS(SELECT 1 FROM pragma_foreign_key_check)`)}\n`;
}

function renderReconcile(plan) {
  const p = EXPECTED_PREFIX;
  const fresh = `NOT EXISTS(SELECT 1 FROM nsmq_pre278_reconcile_state WHERE release=${sql(RELEASE)})`;
  const replay = `((SELECT mode||':'||status FROM nsmq_pre278_reconcile_state WHERE release=${sql(RELEASE)})='legacy:completed' AND (SELECT count(*) FROM nsmq_pre278_reconcile_backup WHERE release=${sql(RELEASE)} AND question_id=${sql(QUESTION_ID)} AND old_topic_id=${sql(LEGACY_TOPIC)})=1 AND (SELECT count(*) FROM nsmq_pre278_reconcile_audit WHERE release=${sql(RELEASE)} AND question_id=${sql(QUESTION_ID)} AND old_topic_id=${sql(LEGACY_TOPIC)} AND new_topic_id IS NULL)=1 AND (SELECT topic_id IS NULL FROM questions WHERE id=${sql(QUESTION_ID)})) OR ((SELECT mode||':'||status FROM nsmq_pre278_reconcile_state WHERE release=${sql(RELEASE)})='reviewed_noop:completed' AND (SELECT count(*) FROM nsmq_pre278_reconcile_backup WHERE release=${sql(RELEASE)})=0 AND (SELECT count(*) FROM nsmq_pre278_reconcile_audit WHERE release=${sql(RELEASE)})=0 AND (${canonicalState(p)}))`;
  return `-- One-row pre-278 correction. Canonical migration 278 remains byte-for-byte unchanged.\nPRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS nsmq_pre278_reconcile_state(release TEXT PRIMARY KEY,mode TEXT NOT NULL CHECK(mode IN('legacy','reviewed_noop')),status TEXT NOT NULL CHECK(status IN('started','completed','rolled_back')),next_step INTEGER NOT NULL CHECK(next_step BETWEEN 1 AND 2));
CREATE TABLE IF NOT EXISTS nsmq_pre278_reconcile_backup(release TEXT NOT NULL,question_id TEXT NOT NULL,old_topic_id TEXT NOT NULL,PRIMARY KEY(release,question_id));
CREATE TABLE IF NOT EXISTS nsmq_pre278_reconcile_audit(id INTEGER PRIMARY KEY AUTOINCREMENT,release TEXT NOT NULL,question_id TEXT NOT NULL,old_topic_id TEXT,new_topic_id TEXT,UNIQUE(release,question_id));
${guard(`${p}_guard`, `${identityGuard(p)} AND ((${fresh} AND ((${legacyState(p)}) OR (${canonicalState(p)}))) OR (${replay}))`)}
INSERT INTO nsmq_pre278_reconcile_state(release,mode,status,next_step)
SELECT ${sql(RELEASE)},CASE WHEN (${legacyState(p)}) THEN 'legacy' ELSE 'reviewed_noop' END,'started',1 WHERE ${fresh};
INSERT INTO nsmq_pre278_reconcile_backup(release,question_id,old_topic_id)
SELECT ${sql(RELEASE)},id,topic_id FROM questions WHERE id=${sql(QUESTION_ID)} AND topic_id=${sql(LEGACY_TOPIC)} AND (SELECT mode FROM nsmq_pre278_reconcile_state WHERE release=${sql(RELEASE)})='legacy';
INSERT INTO nsmq_pre278_reconcile_audit(release,question_id,old_topic_id,new_topic_id)
SELECT ${sql(RELEASE)},${sql(QUESTION_ID)},${sql(LEGACY_TOPIC)},NULL WHERE (SELECT mode FROM nsmq_pre278_reconcile_state WHERE release=${sql(RELEASE)})='legacy' AND NOT EXISTS(SELECT 1 FROM nsmq_pre278_reconcile_audit WHERE release=${sql(RELEASE)});
UPDATE questions SET topic_id=NULL WHERE id=${sql(QUESTION_ID)} AND topic_id=${sql(LEGACY_TOPIC)} AND (SELECT mode FROM nsmq_pre278_reconcile_state WHERE release=${sql(RELEASE)})='legacy';
UPDATE nsmq_pre278_reconcile_state SET status='completed',next_step=2 WHERE release=${sql(RELEASE)};
${guard(`${p}_post_guard`, `((SELECT mode FROM nsmq_pre278_reconcile_state WHERE release=${sql(RELEASE)})='legacy' AND (SELECT topic_id IS NULL FROM questions WHERE id=${sql(QUESTION_ID)}) AND (SELECT count(*) FROM nsmq_pre278_reconcile_backup WHERE release=${sql(RELEASE)})=1 AND (SELECT count(*) FROM nsmq_pre278_reconcile_audit WHERE release=${sql(RELEASE)})=1) OR ((SELECT mode FROM nsmq_pre278_reconcile_state WHERE release=${sql(RELEASE)})='reviewed_noop' AND (${canonicalState(p)}) AND (SELECT count(*) FROM nsmq_pre278_reconcile_backup WHERE release=${sql(RELEASE)})=0 AND (SELECT count(*) FROM nsmq_pre278_reconcile_audit WHERE release=${sql(RELEASE)})=0)`)}
`;
}

function renderPostflight(plan) {
  const p = EXPECTED_PREFIX;
  const completedLegacy = `(SELECT mode||':'||status||':'||next_step FROM nsmq_pre278_reconcile_state WHERE release=${sql(RELEASE)})='legacy:completed:2' AND (SELECT topic_id IS NULL FROM questions WHERE id=${sql(QUESTION_ID)}) AND (SELECT count(*) FROM questions q JOIN ${p}_m e ON e.q=q.id WHERE e.q<>${sql(QUESTION_ID)} AND q.topic_id IS NULL)=267 AND (SELECT count(*) FROM nsmq_pre278_reconcile_backup WHERE release=${sql(RELEASE)} AND question_id=${sql(QUESTION_ID)} AND old_topic_id=${sql(LEGACY_TOPIC)})=1 AND (SELECT count(*) FROM nsmq_pre278_reconcile_audit WHERE release=${sql(RELEASE)} AND question_id=${sql(QUESTION_ID)} AND old_topic_id=${sql(LEGACY_TOPIC)} AND new_topic_id IS NULL)=1`;
  const noOp = `(SELECT mode||':'||status||':'||next_step FROM nsmq_pre278_reconcile_state WHERE release=${sql(RELEASE)})='reviewed_noop:completed:2' AND (${canonicalState(p)}) AND (SELECT count(*) FROM nsmq_pre278_reconcile_backup WHERE release=${sql(RELEASE)})=0 AND (SELECT count(*) FROM nsmq_pre278_reconcile_audit WHERE release=${sql(RELEASE)})=0`;
  return `-- Stop gate before canonical migration 278.\nPRAGMA foreign_keys=ON;\n${guard(`${p}_guard`, `${identityGuard(p)} AND ((${completedLegacy}) OR (${noOp})) AND NOT EXISTS(SELECT 1 FROM pragma_foreign_key_check)`)}\nSELECT mode,status,next_step FROM nsmq_pre278_reconcile_state WHERE release=${sql(RELEASE)};\n`;
}

function renderRollback(plan) {
  const p = EXPECTED_PREFIX;
  return `-- Separate rollback; never part of the forward runner. Only valid before migration 278.\nPRAGMA foreign_keys=ON;\n${guard(`${p}_guard`, `${identityGuard(p)} AND (SELECT mode||':'||status FROM nsmq_pre278_reconcile_state WHERE release=${sql(RELEASE)})='legacy:completed' AND (SELECT topic_id IS NULL FROM questions WHERE id=${sql(QUESTION_ID)}) AND (SELECT count(*) FROM nsmq_pre278_reconcile_backup WHERE release=${sql(RELEASE)} AND question_id=${sql(QUESTION_ID)} AND old_topic_id=${sql(LEGACY_TOPIC)})=1 AND (SELECT count(*) FROM nsmq_pre278_reconcile_audit WHERE release=${sql(RELEASE)})=1 AND (${legacyLedgerStage()}) AND NOT EXISTS(SELECT 1 FROM question_bank_remediation_log WHERE migration_id IN (${CANONICAL_MIGRATIONS.map(sql).join(",")}))`)}
UPDATE questions SET topic_id=(SELECT old_topic_id FROM nsmq_pre278_reconcile_backup WHERE release=${sql(RELEASE)} AND question_id=questions.id) WHERE id=${sql(QUESTION_ID)};
UPDATE nsmq_pre278_reconcile_state SET status='rolled_back',next_step=1 WHERE release=${sql(RELEASE)};
${guard(`${p}_post_guard`, `${legacyState(p)} AND (SELECT mode||':'||status FROM nsmq_pre278_reconcile_state WHERE release=${sql(RELEASE)})='legacy:rolled_back'`)}
`;
}

function renderCleanup(plan) {
  const p = EXPECTED_PREFIX;
  const legacyEvidence = `(SELECT mode||':'||status FROM nsmq_pre278_reconcile_state WHERE release=${sql(RELEASE)})='legacy:completed' AND (SELECT count(*) FROM nsmq_pre278_reconcile_backup WHERE release=${sql(RELEASE)})=1 AND (SELECT count(*) FROM nsmq_pre278_reconcile_audit WHERE release=${sql(RELEASE)})=1`;
  const noOpEvidence = `(SELECT mode||':'||status FROM nsmq_pre278_reconcile_state WHERE release=${sql(RELEASE)})='reviewed_noop:completed' AND (SELECT count(*) FROM nsmq_pre278_reconcile_backup WHERE release=${sql(RELEASE)})=0 AND (SELECT count(*) FROM nsmq_pre278_reconcile_audit WHERE release=${sql(RELEASE)})=0`;
  return `-- Explicit post-release cleanup. Run only after canonical migrations 278-282 and their postflight pass.\nPRAGMA foreign_keys=ON;\n${guard(`${p}_guard`, `${identityGuard(p)} AND (${canonicalState(p)}) AND ((${legacyEvidence}) OR (${noOpEvidence}))`)}
DROP TABLE nsmq_pre278_reconcile_audit;\nDROP TABLE nsmq_pre278_reconcile_backup;\nDROP TABLE nsmq_pre278_reconcile_state;\nDROP TABLE ${p}_q;\nDROP TABLE ${p}_m;\n`;
}

function renderRunner() {
  return `#!/usr/bin/env node\n'use strict';\nconst path=require('node:path'),{execFileSync}=require('node:child_process');\nconst files=${JSON.stringify(FLIGHT_FILES)},args=process.argv.slice(2),value=(n)=>{const i=args.indexOf(n);return i<0?null:args[i+1];},env=value('--env'),confirm=value('--confirm'),targets={production:'aa806d65-d3dd-4cf9-9cac-e3ddd252f937',staging:'1faeca41-2233-4a0b-a273-0d3aadba9c96'},db=targets[env];\nif(!db||confirm!==env+':'+db)throw Error('Use --env production|staging --confirm <env>:<pinned-uuid>');\nconst root=path.resolve(__dirname,'../../..'),wrangler=path.join(root,'node_modules','wrangler','bin','wrangler.js');\nfor(const file of files){const a=[wrangler,'d1','execute',db,'--remote','--file',path.join(__dirname,file)];if(env==='staging')a.push('--env','staging');process.stdout.write('RUN '+file+'\\n');execFileSync(process.execPath,a,{cwd:root,stdio:'inherit'});}\nprocess.stdout.write('STOP: now run unchanged canonical migrations 278-282 in order, then their canonical postflight. Cleanup remains separate.\\n');\n`;
}

function renderRunbook() {
  return `# NSMQ pre-278 one-row reconciliation\n\nThis flight is ordered **after canonical migration 267 (and 268-270) and before immutable migration 278**. It may not be skipped or reordered. The runner stops on the first failed SQL file.\n\n1. Run \`run-flight.cjs --env <production|staging> --confirm <env>:<pinned-uuid>\`.\n2. Confirm \`90_postflight.sql\` passed.\n3. Run unchanged canonical migrations 278, 279, 280, 281, and 282 in exact order, followed by their canonical postflight.\n4. Run \`99_cleanup_after_release.sql\` explicitly only after the canonical release passes.\n\n\`rollback/01_restore_legacy_topic.sql\` is separate and valid only before migration 278. Neither rollback nor cleanup is in the forward runner.\n`;
}

function renderFiles() {
  const { plan } = model();
  return new Map([
    [path.join(OUT, "00_expected_part_1.sql"), renderExpectedPart(plan.mappings.slice(0, 90), [], true)],
    [path.join(OUT, "01_expected_part_2.sql"), renderExpectedPart(plan.mappings.slice(90, 180), [], false)],
    [path.join(OUT, "02_expected_part_3.sql"), renderExpectedPart(plan.mappings.slice(180), plan.quarantines, false)],
    [path.join(OUT, "03_preflight.sql"), renderPreflight(plan)],
    [path.join(OUT, "04_reconcile.sql"), renderReconcile(plan)],
    [path.join(OUT, "90_postflight.sql"), renderPostflight(plan)],
    [path.join(OUT, "99_cleanup_after_release.sql"), renderCleanup(plan)],
    [path.join(OUT, "rollback", "01_restore_legacy_topic.sql"), renderRollback(plan)],
    [path.join(OUT, "run-flight.cjs"), renderRunner()],
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

module.exports = { CANONICAL_MIGRATIONS, FLIGHT_FILES, POST278_LEDGER, PRE278_LEDGER, LEGACY_TOPIC, OUT, QUESTION_ID, RELEASE, TARGET_TOPIC, model, renderFiles, writeOrCheck };
