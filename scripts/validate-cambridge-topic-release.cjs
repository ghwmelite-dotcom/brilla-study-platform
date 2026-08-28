'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { buildArtifacts } = require('./generate-cambridge-topic-release.cjs');

const ROOT = path.resolve(__dirname, '..');
const SOURCE_FILES = [
  'database/schema.sql',
  'database/seed.sql',
  'database/prod-patches/094_seed_missing_subjects_topics.sql',
  'database/prod-patches/096_seed_topics_for_empty_subjects.sql',
  'database/migrations/archive/077_seed_oalevel_questions.sql',
  'database/migrations/archive/078_more_biology_questions.sql',
  'database/migrations/archive/079_more_chemistry_questions.sql',
  'database/migrations/archive/080_more_maths_questions.sql',
  'database/migrations/archive/081_alevel_physics_questions.sql',
  'database/migrations/archive/082_alevel_chemistry_questions.sql',
  'database/migrations/archive/082_alevel_mathematics_questions.sql',
  'database/migrations/archive/083_alevel_biology_questions.sql',
  'database/migrations/archive/083_igcse_add_math_questions.sql',
  'database/migrations/archive/084_alevel_further_math_questions.sql',
  'database/prod-patches/088c_fix_orphan_refs.sql',
];
const MIGRATIONS = [271, 272, 273, 274, 275].map((number, index) => `database/migrations/${number}_cambridge_topic_remediation_part_${index + 1}.sql`);
const ROLLBACKS = [271, 272, 273, 274, 275].map((number, index) => `database/rollbacks/${number}_cambridge_topic_remediation_part_${index + 1}_rollback.sql`);
const PRE = 'database/preflight/271_275_cambridge_topic_remediation_preflight.sql';
const POST = 'database/preflight/271_275_cambridge_topic_remediation_postflight.sql';
const SCOPE = "(id GLOB 'q_alevel_bio_[0-9][0-9][0-9]' OR id GLOB 'q_alevel_chem_[0-9][0-9][0-9]' OR id GLOB 'q_alevel_fm_[0-9][0-9][0-9]' OR id GLOB 'q_alevel_math_[0-9][0-9][0-9]' OR id GLOB 'q_alevel_phy_[0-9][0-9][0-9]' OR id GLOB 'q_igcse_addmath_[0-9][0-9][0-9]' OR id GLOB 'q_igcse_bio_[0-9][0-9][0-9]' OR id GLOB 'q_igcse_chem_[0-9][0-9][0-9]' OR id GLOB 'q_igcse_math_[0-9][0-9][0-9]' OR id GLOB 'q_igcse_phy_[0-9][0-9][0-9]')";
const TOPIC_IDS = ['topic_igcse_chem_electrolysis','topic_igcse_chem_analysis','topic_igcse_bio_cell_transport','topic_igcse_bio_excretion','topic_igcse_bio_coordination','topic_igcse_addmath_series','topic_alevel_phys_medical','topic_alevel_phys_particles','topic_alevel_bio_immunity','topic_alevel_math_diffeq','topic_alevel_fmath_summation','topic_alevel_fmath_induction','topic_alevel_fmath_polynomial_roots','topic_alevel_fmath_vectors','topic_alevel_fmath_integration'];
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');

function fixture() {
  const db = new DatabaseSync(':memory:');
  for (const file of SOURCE_FILES) db.exec(read(file));
  return db;
}
function snapshot(db) {
  return JSON.stringify(db.prepare('SELECT id,subject_id,topic_id,question_text,question_type,options,correct_answer,explanation,difficulty,points,marks,time_limit FROM questions ORDER BY id').all());
}
function expectFailure(action, label) {
  let failed = false;
  try { action(); } catch (error) { failed = /CHECK constraint failed/.test(String(error)); }
  assert(failed, `${label} did not fail closed`);
}
function sqlSet() {
  const rendered = buildArtifacts().artifacts;
  return { migrations: MIGRATIONS.map((file) => rendered[file]), rollbacks: ROLLBACKS.map((file) => rendered[file]), pre: rendered[PRE], post: rendered[POST] };
}
function validate() {
  const sql = sqlSet();
  const db = fixture();
  const before = snapshot(db);
  db.exec(sql.pre);
  for (const migration of sql.migrations) { db.exec(migration); db.exec(migration); }
  for (const migration of sql.migrations) db.exec(migration);
  db.exec(sql.post);
  assert(db.prepare(`SELECT COUNT(*) count FROM questions WHERE topic_id IS NOT NULL AND ${SCOPE}`).get().count === 450, 'mapped count');
  assert(db.prepare("SELECT COUNT(*) count FROM question_bank_remediation_log WHERE migration_id LIKE '27%_cambridge_topic_remediation_part_%'").get().count === 453, 'ledger count');
  const q050 = db.prepare("SELECT correct_answer,explanation,topic_id FROM questions WHERE id='q_alevel_fm_050'").get();
  assert(q050.correct_answer === '1/3 unit' && q050.topic_id === 'topic_alevel_fmath_vectors' && q050.explanation.endsWith('1/3 unit.'), 'q050 correction');
  const q051 = db.prepare("SELECT options,topic_id FROM questions WHERE id='q_alevel_fm_051'").get();
  assert(q051.options.includes('x³/3') && q051.topic_id === null, 'q051 correction/exception');
  assert(db.prepare("SELECT COUNT(*) count FROM questions WHERE id LIKE 'q_alevel_maths_%' AND topic_id IS NOT NULL").get().count === 0, 'legacy maths rows mutated');
  assert(db.prepare('PRAGMA foreign_key_check').all().length === 0, 'foreign keys after apply');
  for (let index = sql.rollbacks.length - 1; index >= 0; index -= 1) db.exec(sql.rollbacks[index]);
  assert(snapshot(db) === before, 'reverse rollback did not restore every question');
  assert(db.prepare(`SELECT COUNT(*) count FROM topics WHERE id IN(${TOPIC_IDS.map((id) => `'${id}'`).join(',')})`).get().count === 0, 'new topics remain after rollback');
  assert(db.prepare('PRAGMA foreign_key_check').all().length === 0, 'foreign keys after rollback');
  db.close();

  const drift = fixture();
  drift.prepare("UPDATE questions SET explanation='tampered' WHERE id='q_igcse_phy_001'").run();
  expectFailure(() => drift.exec(sql.pre), 'preflight content drift');
  drift.close();

  const logDrift = fixture(); const logBefore = snapshot(logDrift);
  logDrift.prepare('INSERT INTO question_bank_remediation_log(migration_id,entity_type,entity_id,field_name,old_value,new_value) VALUES(?,?,?,?,?,?)').run('271_cambridge_topic_remediation_part_1','question','q_igcse_phy_001','topic_id',null,'topic_igcse_physics_waves');
  expectFailure(() => logDrift.exec(sql.migrations[0]), 'unexpected ledger row');
  assert(snapshot(logDrift) === logBefore, 'ledger drift guard wrote questions');
  logDrift.close();

  const order = fixture();
  for (const migration of sql.migrations) order.exec(migration);
  const finalState = snapshot(order);
  expectFailure(() => order.exec(sql.rollbacks[3]), 'out-of-order rollback');
  assert(snapshot(order) === finalState, 'out-of-order rollback wrote questions');
  order.close();

  const partial = fixture();
  partial.exec(sql.migrations[0]); partial.exec(sql.migrations[1]);
  partial.exec(sql.rollbacks[1]); partial.exec(sql.rollbacks[0]);
  assert(snapshot(partial) === before, 'partial reverse rollback');
  partial.close();
  return { mappings: 450, exceptions: 5, topics: 15, logs: 453, idempotence: 'immediate-and-full-replay', rollback: 'full-and-partial-strict-reverse' };
}

if (require.main === module) process.stdout.write(`${JSON.stringify(validate(), null, 2)}\n`);
module.exports = { validate };
