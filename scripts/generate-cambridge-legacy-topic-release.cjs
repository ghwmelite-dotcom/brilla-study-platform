'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const previous = require('./generate-cambridge-topic-release.cjs');

const ROOT = path.resolve(__dirname, '..');
const MIGRATION_ID = '281_cambridge_legacy_topic_remediation';
const MIGRATION_FILE = `database/migrations/${MIGRATION_ID}.sql`;
const ROLLBACK_FILE = `database/rollbacks/${MIGRATION_ID}_rollback.sql`;
const PREFLIGHT_FILE = `database/preflight/${MIGRATION_ID}_preflight.sql`;
const POSTFLIGHT_FILE = `database/preflight/${MIGRATION_ID}_postflight.sql`;
const MANIFEST_FILE = 'database/manifests/281_cambridge_legacy_topic_remediation.json';
const CREATED_AT = '2026-08-26T00:00:00.000Z';
const P1 = 2147483647;
const P2 = 2147483629;
const STATE_FIELDS = ['id', 'subject_id', 'topic_id', 'question_text', 'question_type', 'options', 'correct_answer', 'explanation', 'difficulty', 'points', 'marks', 'time_limit'];
const TOPIC_FIELDS = ['id', 'subject_id', 'parent_id', 'name', 'slug', 'description', 'theory_content', 'key_formulas', 'display_order', 'created_at'];
const LOG_FIELDS = ['migration_id', 'entity_type', 'entity_id', 'field_name', 'old_value', 'new_value'];
const LOG_ORDER = [...LOG_FIELDS];

const NEW_TOPICS = [
  {
    id: 'topic_alevel_bio_ecology',
    subjectId: 'subj_alevel_biology',
    name: 'Ecology and Nutrient Cycles',
    slug: 'ecology-and-nutrient-cycles',
    description: 'Energy transfer, ecosystems, nutrient cycles and ecological relationships',
    displayOrder: 9,
  },
  {
    id: 'topic_alevel_fmath_power_series',
    subjectId: 'subj_alevel_further_math',
    name: 'Power Series and Expansions',
    slug: 'power-series-and-expansions',
    description: 'Taylor and Maclaurin expansions, convergence and approximation with power series',
    displayOrder: 12,
  },
].map((topic) => ({ ...topic, createdAt: CREATED_AT }));

const groups = {
  topic_alevel_math_algebra: [1, 2, 3, 4],
  topic_alevel_math_coord: [5],
  topic_alevel_math_sequences: [7, 8, 9],
  topic_alevel_math_trig: [10, 11, 12],
  topic_alevel_math_logs: [13, 14],
  topic_alevel_math_calculus: [6, 15, 16, 17, 18, 19, 20, 21, 22, 26],
  topic_alevel_math_vectors: [23, 24, 25],
  topic_alevel_math_stats: [27, 28, 29, 30, 31, 32],
  topic_alevel_math_mechanics: [33, 34, 35, 36, 37, 38, 39, 40],
};
const pad = (number) => String(number).padStart(3, '0');
const LEGACY_MATH_MAPPINGS = Object.entries(groups).flatMap(([topicId, numbers]) =>
  numbers.map((number) => ({ questionId: `q_alevel_maths_${pad(number)}`, subjectId: 'subj_alevel_math', topicId })),
);
const REASSESSED_EXCEPTION_MAPPINGS = [
  { questionId: 'q_alevel_bio_028', subjectId: 'subj_alevel_biology', topicId: 'topic_alevel_bio_ecology' },
  { questionId: 'q_alevel_bio_029', subjectId: 'subj_alevel_biology', topicId: 'topic_alevel_bio_ecology' },
  { questionId: 'q_alevel_fm_051', subjectId: 'subj_alevel_further_math', topicId: 'topic_alevel_fmath_power_series' },
  { questionId: 'q_alevel_fm_052', subjectId: 'subj_alevel_further_math', topicId: 'topic_alevel_fmath_power_series' },
  { questionId: 'q_alevel_fm_053', subjectId: 'subj_alevel_further_math', topicId: 'topic_alevel_fmath_integration' },
];
const MAPPINGS = [...LEGACY_MATH_MAPPINGS, ...REASSESSED_EXCEPTION_MAPPINGS]
  .sort((left, right) => left.questionId.localeCompare(right.questionId));

const CORRECTIONS = [
  {
    questionId: 'q_alevel_maths_014',
    reason: 'The source substituted x=3 even though it does not satisfy the logarithmic equation.',
    old: {
      correct_answer: 'x = 3',
      explanation: 'log₂[(x+3)(x-1)] = 3. (x+3)(x-1) = 8. x² + 2x - 3 = 8. x² + 2x - 11 = 0. x = 3 (rejecting negative)',
    },
    new: {
      correct_answer: 'x = -1 + 2√3 (approximately 2.464)',
      explanation: 'Combining the logarithms gives (x + 3)(x - 1) = 8, so x² + 2x - 11 = 0. Hence x = -1 ± 2√3. The logarithm domain requires x > 1, leaving x = -1 + 2√3 (approximately 2.464).',
    },
  },
  {
    questionId: 'q_alevel_maths_024',
    reason: 'The source calculation gives cos θ = 1/√50 but reports an inconsistent angle.',
    old: {
      correct_answer: '71.6° or 1.25 rad',
      explanation: 'a·b = 3 - 2 = 1. |a| = √5, |b| = √10. cos θ = 1/(√5 × √10) = 1/√50. θ = 81.9° (or 71.6° depending on calculation)',
    },
    new: {
      correct_answer: '81.9° or 1.43 rad',
      explanation: 'a·b = 3 - 2 = 1, while |a| = √5 and |b| = √10. Therefore cos θ = 1/(√5 × √10) = 1/√50, so θ = arccos(1/√50) ≈ 81.9° ≈ 1.43 rad.',
    },
  },
];

const sql = (value) => value === null || value === undefined
  ? 'NULL'
  : `'${String(value).replaceAll("'", "''")}'`;
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const compareFields = (fields) => (left, right) => {
  for (const field of fields) {
    const a = left[field];
    const b = right[field];
    if (a === b) continue;
    if (a === null || a === undefined) return -1;
    if (b === null || b === undefined) return 1;
    const compared = String(a).localeCompare(String(b));
    if (compared !== 0) return compared;
  }
  return 0;
};
const serialize = (row, fields) => JSON.stringify(fields.map((field) => row[field] ?? null));

function fingerprint(payload) {
  let a = 7;
  let b = 11;
  const characters = Array.from(String(payload));
  for (const character of characters) {
    const code = character.codePointAt(0);
    a = (a * 131 + code) % P1;
    b = (b * 137 + code) % P2;
  }
  return [characters.length, a, b];
}

function rowsFingerprint(rows, fields) {
  let n = 0;
  let a = 0;
  let b = 0;
  rows.forEach((row, index) => {
    const [length, first, second] = fingerprint(serialize(row, fields));
    const ordinal = index + 1;
    n += length;
    a = (a + ((first * ordinal) % P1)) % P1;
    b = (b + ((second * ordinal) % P2)) % P2;
  });
  return [rows.length, n, a, b];
}

const fpEquals = (table, value) =>
  `(SELECT c=${value[0]} AND n=${value[1]} AND a=${value[2]} AND b=${value[3]} FROM ${table})`;
const fpSql = (table, fromSql, orderBy, fields) =>
  `CREATE TABLE ${table}(c INTEGER,n INTEGER,a INTEGER,b INTEGER);` +
  `INSERT INTO ${table}(c,n,a,b) WITH RECURSIVE r(k,v) AS (` +
  `SELECT row_number() OVER(ORDER BY ${orderBy}),json_array(${fields.join(',')}) ${fromSql}),` +
  `w(k,i,n,a,b,v) AS (SELECT k,0,length(v),7,11,v FROM r UNION ALL ` +
  `SELECT k,i+1,n,(a*131+unicode(substr(v,i+1,1)))%${P1},(b*137+unicode(substr(v,i+1,1)))%${P2},v FROM w WHERE i<n),` +
  `f AS (SELECT k,n,a,b FROM w WHERE i=n) SELECT count(*),coalesce(sum(n),0),` +
  `coalesce(sum((a*k)%${P1})%${P1},0),coalesce(sum((b*k)%${P2})%${P2},0) FROM f;`;

function fixture() {
  const db = previous.fixture();
  const artifacts = previous.buildArtifacts().artifacts;
  for (let number = 271; number <= 275; number += 1) {
    const part = number - 270;
    db.exec(artifacts[`database/migrations/${number}_cambridge_topic_remediation_part_${part}.sql`]);
  }
  return db;
}

function buildFullModel() {
  assert(MAPPINGS.length === 45, 'Expected 45 mappings');
  assert(LEGACY_MATH_MAPPINGS.length === 40, 'Expected 40 legacy Mathematics mappings');
  assert(new Set(MAPPINGS.map((row) => row.questionId)).size === 45, 'Duplicate mapping IDs');
  const db = fixture();
  try {
    const placeholders = MAPPINGS.map(() => '?').join(',');
    const source = db.prepare(
      `SELECT ${STATE_FIELDS.join(',')} FROM questions WHERE id IN(${placeholders}) ORDER BY id`,
    ).all(...MAPPINGS.map((row) => row.questionId));
    assert(source.length === 45, `Source count drift: ${source.length}`);
    assert(source.every((row) => row.topic_id === null), 'Expected every source row to have a null topic');
    const byId = new Map(source.map((row) => [row.id, row]));
    const existingTopics = new Map(
      db.prepare('SELECT id,subject_id FROM topics').all().map((row) => [row.id, row.subject_id]),
    );
    const proposedTopics = new Map(NEW_TOPICS.map((row) => [row.id, row.subjectId]));
    for (const mapping of MAPPINGS) {
      assert(byId.get(mapping.questionId)?.subject_id === mapping.subjectId, `${mapping.questionId}: subject drift`);
      assert((existingTopics.get(mapping.topicId) ?? proposedTopics.get(mapping.topicId)) === mapping.subjectId,
        `${mapping.questionId}: cross-subject or missing topic`);
    }
    for (const correction of CORRECTIONS) {
      const row = byId.get(correction.questionId);
      assert(row.correct_answer === correction.old.correct_answer, `${correction.questionId}: answer source drift`);
      assert(row.explanation === correction.old.explanation, `${correction.questionId}: explanation source drift`);
    }
    const target = source.map((row) => {
      const result = { ...row };
      result.topic_id = MAPPINGS.find((mapping) => mapping.questionId === row.id).topicId;
      const correction = CORRECTIONS.find((candidate) => candidate.questionId === row.id);
      if (correction) Object.assign(result, correction.new);
      return result;
    });
    const topics = NEW_TOPICS.map((topic) => ({
      id: topic.id,
      subject_id: topic.subjectId,
      parent_id: null,
      name: topic.name,
      slug: topic.slug,
      description: topic.description,
      theory_content: null,
      key_formulas: null,
      display_order: topic.displayOrder,
      created_at: topic.createdAt,
    })).sort(compareFields(['id']));
    const logs = [
      ...MAPPINGS.map((mapping) => ({
        migration_id: MIGRATION_ID,
        entity_type: 'question',
        entity_id: mapping.questionId,
        field_name: 'topic_id',
        old_value: null,
        new_value: mapping.topicId,
      })),
      ...CORRECTIONS.flatMap((correction) => ['correct_answer', 'explanation'].map((field) => ({
        migration_id: MIGRATION_ID,
        entity_type: 'question',
        entity_id: correction.questionId,
        field_name: field,
        old_value: correction.old[field],
        new_value: correction.new[field],
      }))),
    ].sort(compareFields(LOG_ORDER));
    return {
      source,
      target,
      topics,
      logs,
      mappings: MAPPINGS,
      corrections: CORRECTIONS,
      sourceFingerprint: rowsFingerprint(source, STATE_FIELDS),
      targetFingerprint: rowsFingerprint(target, STATE_FIELDS),
      topicFingerprint: rowsFingerprint(topics, TOPIC_FIELDS),
      logFingerprint: rowsFingerprint(logs, LOG_FIELDS),
    };
  } finally {
    db.close();
  }
}

function baseMappingTable() {
  const grouped = new Map();
  for (const row of MAPPINGS) {
    const entries = grouped.get(row.topicId) ?? [];
    entries.push(row);
    grouped.set(row.topicId, entries);
  }
  return `CREATE TABLE _m281(question_id TEXT PRIMARY KEY,subject_id TEXT NOT NULL,topic_id TEXT NOT NULL);` +
    [...grouped.entries()].map(([topicId, rows]) =>
      `INSERT INTO _m281 SELECT column1,column2,${sql(topicId)} FROM(VALUES${rows.map((row) => `(${sql(row.questionId)},${sql(row.subjectId)})`).join(',')});`,
    ).join('');
}

function topicTable() {
  return `CREATE TABLE _t281(id TEXT PRIMARY KEY,subject_id TEXT NOT NULL,name TEXT NOT NULL,slug TEXT NOT NULL,description TEXT NOT NULL,display_order INTEGER NOT NULL,created_at TEXT NOT NULL);` +
    `INSERT INTO _t281 VALUES${NEW_TOPICS.map((topic) => `(${[
      topic.id, topic.subjectId, topic.name, topic.slug, topic.description, topic.displayOrder, topic.createdAt,
    ].map(sql).join(',')})`).join(',')};`;
}

const questionFp = () => fpSql('_qf281', 'FROM questions WHERE id IN(SELECT question_id FROM _m281)', 'id', STATE_FIELDS);
const topicFp = () => fpSql('_tf281', 'FROM topics WHERE id IN(SELECT id FROM _t281)', 'id', TOPIC_FIELDS);
const logFp = () => fpSql('_lf281', `FROM question_bank_remediation_log WHERE migration_id=${sql(MIGRATION_ID)}`, LOG_ORDER.join(','), LOG_FIELDS);
const singularFp = () => fpSql('_sf281', 'FROM questions WHERE id IN(SELECT question_id FROM _s281)', 'id', STATE_FIELDS);
const fingerprints = () => `${questionFp()}${singularFp()}${topicFp()}${logFp()}`;
const dropFingerprints = () => 'DROP TABLE _lf281;DROP TABLE _tf281;DROP TABLE _sf281;DROP TABLE _qf281;';
const cleanup = () => `${dropFingerprints()}DROP TABLE _t281;DROP TABLE _s281;DROP TABLE _m281;DROP TABLE _g281;`;

function obsoleteMappingIntegrity() {
  return `(SELECT COUNT(*) FROM _m281)=45 AND NOT EXISTS(` +
    `SELECT 1 FROM _m281 m LEFT JOIN questions q ON q.id=m.question_id ` +
    `LEFT JOIN topics t ON t.id=m.topic_id LEFT JOIN _t281 p ON p.id=m.topic_id ` +
    `WHERE q.id IS NULL OR q.subject_id<>m.subject_id OR COALESCE(t.subject_id,p.subject_id)<>m.subject_id` +
    `) AND NOT EXISTS(SELECT 1 FROM _t281 p LEFT JOIN subjects s ON s.id=p.subject_id ` +
    `WHERE s.id IS NULL OR s.is_active<>1 OR s.exam_type_id<>'cambridge_a2') AND NOT EXISTS(` +
    `SELECT 1 FROM _t281 p JOIN topics t ON t.subject_id=p.subject_id AND t.id<>p.id AND (t.name=p.name OR t.slug=p.slug))`;
}

function obsoleteStateCondition(model, stage) {
  if (stage === 'source') {
    return `${fpEquals('_qf281', model.sourceFingerprint)} AND ${fpEquals('_lf281', [0, 0, 0, 0])} ` +
      `AND (SELECT COUNT(*) FROM topics WHERE id IN(SELECT id FROM _t281))=0`;
  }
  return `${fpEquals('_qf281', model.targetFingerprint)} AND ${fpEquals('_lf281', model.logFingerprint)} ` +
    `AND ${fpEquals('_tf281', model.topicFingerprint)} AND (SELECT COUNT(*) FROM topics WHERE id IN(SELECT id FROM _t281))=2`;
}

function insertTopics() {
  return 'INSERT OR IGNORE INTO topics(id,subject_id,parent_id,name,slug,description,theory_content,key_formulas,display_order,created_at) ' +
    'SELECT id,subject_id,NULL,name,slug,description,NULL,NULL,display_order,created_at FROM _t281;';
}

function obsoleteInsertLogs() {
  const correctionRows = CORRECTIONS.flatMap((correction) => ['correct_answer', 'explanation'].map((field) =>
    `(${[MIGRATION_ID, 'question', correction.questionId, field, correction.old[field], correction.new[field]].map(sql).join(',')})`,
  ));
  return `INSERT OR IGNORE INTO question_bank_remediation_log(migration_id,entity_type,entity_id,field_name,old_value,new_value) VALUES${correctionRows.join(',')};` +
    `INSERT OR IGNORE INTO question_bank_remediation_log(migration_id,entity_type,entity_id,field_name,old_value,new_value) ` +
    `SELECT ${sql(MIGRATION_ID)},'question',q.id,'topic_id',NULL,m.topic_id FROM questions q JOIN _m281 m ON m.question_id=q.id WHERE q.topic_id IS NULL;`;
}

function applyCorrections(forward) {
  return CORRECTIONS.map((correction) => {
    const from = forward ? correction.old : correction.new;
    const to = forward ? correction.new : correction.old;
    return `UPDATE questions SET correct_answer=${sql(to.correct_answer)},explanation=${sql(to.explanation)} ` +
      `WHERE id=${sql(correction.questionId)} AND correct_answer=${sql(from.correct_answer)} AND explanation=${sql(from.explanation)};`;
  }).join('');
}

function buildModel() {
  const m=buildFullModel(),db=fixture();
  try {
    const ids=Array.from({length:40},(_,i)=>`q_alevel_math_${pad(i+1)}`);
    const singular=db.prepare(`SELECT ${STATE_FIELDS.join(',')} FROM questions WHERE id IN(${ids.map(()=>'?').join(',')}) ORDER BY id`).all(...ids);
    const wanted=new Set(REASSESSED_EXCEPTION_MAPPINGS.map(x=>x.questionId));
    const source=m.source.filter(x=>wanted.has(x.id)),target=m.target.filter(x=>wanted.has(x.id)),logs=m.logs.filter(x=>wanted.has(x.entity_id));
    m.singularIds=ids;m.singularFingerprint=rowsFingerprint(singular,STATE_FIELDS);
    m.production={source,target,logs,sourceFingerprint:rowsFingerprint(source,STATE_FIELDS),targetFingerprint:rowsFingerprint(target,STATE_FIELDS),logFingerprint:rowsFingerprint(logs,LOG_FIELDS)};
    assert(JSON.stringify(m.production.sourceFingerprint)===JSON.stringify([5,1432,1920873078,1147809825]),'production source fingerprint drift');
    assert(JSON.stringify(m.production.targetFingerprint)===JSON.stringify([5,1562,1891889133,1131942752]),'production target fingerprint drift');
    assert(JSON.stringify(m.production.logFingerprint)===JSON.stringify([5,592,761733629,1545996926]),'production log fingerprint drift');
    assert(JSON.stringify(m.singularFingerprint)===JSON.stringify([40,11250,560185981,2023523715]),'singular fingerprint drift');
    return m;
  } finally {db.close();}
}

function mappingTable() {
  return baseMappingTable()+`CREATE TABLE _s281(question_id TEXT PRIMARY KEY);INSERT INTO _s281 VALUES${Array.from({length:40},(_,i)=>`(${sql(`q_alevel_math_${pad(i+1)}`)})`).join(',')};`;
}

function mappingIntegrity() {
  return `((SELECT count(*) FROM questions q JOIN _m281 m ON m.question_id=q.id)=45 OR ((SELECT count(*) FROM questions q JOIN _m281 m ON m.question_id=q.id)=5 AND (SELECT count(*) FROM _m281 m LEFT JOIN questions q ON q.id=m.question_id WHERE q.id IS NULL)=40 AND NOT EXISTS(SELECT 1 FROM questions q JOIN _m281 m ON m.question_id=q.id WHERE m.question_id LIKE 'q_alevel_maths_%'))) AND ${fpEquals('_sf281',ACTIVE_MODEL.singularFingerprint)} AND NOT EXISTS(SELECT 1 FROM _m281 m JOIN questions q ON q.id=m.question_id LEFT JOIN topics t ON t.id=m.topic_id LEFT JOIN _t281 p ON p.id=m.topic_id WHERE q.subject_id<>m.subject_id OR coalesce(t.subject_id,p.subject_id)<>m.subject_id) AND NOT EXISTS(SELECT 1 FROM _t281 p LEFT JOIN subjects s ON s.id=p.subject_id WHERE s.id IS NULL OR s.is_active<>1 OR s.exam_type_id<>'cambridge_a2') AND NOT EXISTS(SELECT 1 FROM _t281 p JOIN topics t ON t.subject_id=p.subject_id AND t.id<>p.id AND (t.name=p.name OR t.slug=p.slug))`;
}

function stateCondition(model,stage) {
  const q=stage==='source'?[model.sourceFingerprint,model.production.sourceFingerprint]:[model.targetFingerprint,model.production.targetFingerprint];
  const l=stage==='source'?[[0,0,0,0]]:[model.logFingerprint,model.production.logFingerprint];
  const base=`(${fpEquals('_qf281',q[0])} OR ${fpEquals('_qf281',q[1])}) AND (${l.map(x=>fpEquals('_lf281',x)).join(' OR ')}) AND ${fpEquals('_sf281',model.singularFingerprint)}`;
  return stage==='source'?`${base} AND (SELECT count(*) FROM topics WHERE id IN(SELECT id FROM _t281))=0`:`${base} AND ${fpEquals('_tf281',model.topicFingerprint)} AND (SELECT count(*) FROM topics WHERE id IN(SELECT id FROM _t281))=2`;
}

function insertLogs() {
  const c=CORRECTIONS.flatMap(x=>['correct_answer','explanation'].map(f=>`INSERT OR IGNORE INTO question_bank_remediation_log(migration_id,entity_type,entity_id,field_name,old_value,new_value) SELECT ${[MIGRATION_ID,'question',x.questionId,f,x.old[f],x.new[f]].map(sql).join(',')} WHERE EXISTS(SELECT 1 FROM questions WHERE id=${sql(x.questionId)});`)).join('');
  return c+`INSERT OR IGNORE INTO question_bank_remediation_log(migration_id,entity_type,entity_id,field_name,old_value,new_value) SELECT ${sql(MIGRATION_ID)},'question',q.id,'topic_id',NULL,m.topic_id FROM questions q JOIN _m281 m ON m.question_id=q.id WHERE q.topic_id IS NULL;`;
}

let ACTIVE_MODEL;
function migrationSql(model) { ACTIVE_MODEL=model;
  const before = `(${stateCondition(model, 'source')}) OR (${stateCondition(model, 'target')})`;
  return `-- Generated by scripts/generate-cambridge-legacy-topic-release.cjs.\nPRAGMA foreign_keys=ON;` +
    `${mappingTable()}${topicTable()}CREATE TABLE _g281(valid INTEGER CHECK(valid=1));${fingerprints()}` +
    `INSERT INTO _g281 SELECT CASE WHEN (${before}) AND ${mappingIntegrity()} THEN 1 ELSE 0 END;` +
    `${insertTopics()}${insertLogs()}${applyCorrections(true)}` +
    `UPDATE questions SET topic_id=(SELECT topic_id FROM _m281 WHERE question_id=questions.id) ` +
    `WHERE id IN(SELECT question_id FROM _m281) AND topic_id IS NULL;` +
    `${dropFingerprints()}${fingerprints()}` +
    `INSERT INTO _g281 SELECT CASE WHEN ${stateCondition(model, 'target')} AND ${mappingIntegrity()} ` +
    `AND NOT EXISTS(SELECT 1 FROM pragma_foreign_key_check) AND NOT EXISTS(` +
    `SELECT 1 FROM questions q JOIN _m281 m ON m.question_id=q.id JOIN topics t ON t.id=q.topic_id WHERE q.subject_id<>t.subject_id) THEN 1 ELSE 0 END;` +
    `${cleanup()}\n`;
}

function rollbackSql(model) {
  const before = `(${stateCondition(model, 'target')}) OR (${stateCondition(model, 'source')})`;
  return `-- Generated by scripts/generate-cambridge-legacy-topic-release.cjs.\nPRAGMA foreign_keys=ON;` +
    `${mappingTable()}${topicTable()}CREATE TABLE _g281(valid INTEGER CHECK(valid=1));${fingerprints()}` +
    `INSERT INTO _g281 SELECT CASE WHEN (${before}) AND ${mappingIntegrity()} THEN 1 ELSE 0 END;` +
    `${applyCorrections(false)}` +
    `UPDATE questions SET topic_id=NULL WHERE id IN(SELECT question_id FROM _m281) ` +
    `AND topic_id=(SELECT topic_id FROM _m281 WHERE question_id=questions.id);` +
    `DELETE FROM question_bank_remediation_log WHERE migration_id=${sql(MIGRATION_ID)};` +
    `DELETE FROM topics WHERE id IN(SELECT id FROM _t281);` +
    `${dropFingerprints()}${fingerprints()}` +
    `INSERT INTO _g281 SELECT CASE WHEN ${stateCondition(model, 'source')} AND ${mappingIntegrity()} ` +
    `AND NOT EXISTS(SELECT 1 FROM pragma_foreign_key_check) THEN 1 ELSE 0 END;${cleanup()}\n`;
}

function flightSql(model, stage) {
  return `-- Generated by scripts/generate-cambridge-legacy-topic-release.cjs.\nPRAGMA foreign_keys=ON;` +
    `${mappingTable()}${topicTable()}CREATE TABLE _g281(valid INTEGER CHECK(valid=1));${fingerprints()}` +
    `INSERT INTO _g281 SELECT CASE WHEN ${stateCondition(model, stage)} AND ${mappingIntegrity()} ` +
    `AND NOT EXISTS(SELECT 1 FROM pragma_foreign_key_check)` +
    (stage === 'target'
      ? ` AND NOT EXISTS(SELECT 1 FROM questions q JOIN _m281 m ON m.question_id=q.id JOIN topics t ON t.id=q.topic_id WHERE q.subject_id<>t.subject_id)`
      : '') +
    ` THEN 1 ELSE 0 END;${cleanup()}\n`;
}

function baseBuildArtifacts() {
  const model = buildModel();
  const manifest = {
    release: 'cambridge-legacy-topic-remediation-2026-08-26',
    status: 'reviewed-local-preparation-only',
    migrationId: MIGRATION_ID,
    sourceQuestionCount: 45,
    legacyMathematicsQuestionCount: 40,
    reassessedExceptionCount: 5,
    mappedQuestionCount: 45,
    retainedExceptionCount: 0,
    newTopics: NEW_TOPICS,
    corrections: CORRECTIONS,
    mappings: MAPPINGS,
    fingerprints: {
      source: model.sourceFingerprint,
      target: model.targetFingerprint,
      topics: model.topicFingerprint,
      logs: model.logFingerprint,
    },
    catalogueDecision: {
      filterRequired: false,
      reason: 'Every reviewed row has a defensible topic after two narrow taxonomy additions and two deterministic answer corrections.',
      invariant: 'For every Cambridge subject, raw question count equals the sum of topic question counts after migration 281.',
    },
  };
  return {
    model,
    artifacts: {
      [MANIFEST_FILE]: `${JSON.stringify(manifest, null, 2)}\n`,
      [MIGRATION_FILE]: migrationSql(model),
      [ROLLBACK_FILE]: rollbackSql(model),
      [PREFLIGHT_FILE]: flightSql(model, 'source'),
      [POSTFLIGHT_FILE]: flightSql(model, 'target'),
    },
  };
}

function buildArtifacts() {
  const out=baseBuildArtifacts(),m=out.model;
  const manifest=JSON.parse(out.artifacts[MANIFEST_FILE]);
  manifest.adaptiveModes={full45:{presentMappedQuestions:45,absentPluralQuestions:0,topicLogs:45,correctionLogs:4,sourceFingerprint:m.sourceFingerprint,targetFingerprint:m.targetFingerprint,logFingerprint:m.logFingerprint},historicalProduction5:{presentMappedQuestions:5,absentPluralQuestions:40,topicLogs:5,correctionLogs:0,sourceFingerprint:m.production.sourceFingerprint,targetFingerprint:m.production.targetFingerprint,logFingerprint:m.production.logFingerprint}};
  manifest.protectedSingularMathematics={count:40,fingerprint:m.singularFingerprint,mutationAllowed:false};
  manifest.fingerprints.historicalProduction5Source=m.production.sourceFingerprint;
  manifest.fingerprints.historicalProduction5Target=m.production.targetFingerprint;
  manifest.fingerprints.historicalProduction5Logs=m.production.logFingerprint;
  manifest.fingerprints.protectedSingularMathematics=m.singularFingerprint;
  manifest.catalogueDecision.reason='Every present reviewed row has a defensible topic; historical production never synthesizes the 40 absent plural-ID rows.';
  manifest.catalogueDecision.invariant='Migration 281 mutates only the exact reviewed rows present in one guarded variant.';
  out.artifacts[MANIFEST_FILE]=JSON.stringify(manifest,null,2)+'\n';return out;
}

function main() {
  const write = process.argv.includes('--write');
  const check = process.argv.includes('--check');
  assert(write !== check, 'Use exactly one of --write or --check');
  const { artifacts } = buildArtifacts();
  for (const [file, content] of Object.entries(artifacts)) {
    const absolute = path.join(ROOT, file);
    if (write) {
      fs.mkdirSync(path.dirname(absolute), { recursive: true });
      fs.writeFileSync(absolute, content);
    } else {
      assert(fs.existsSync(absolute), `${file} is missing`);
      assert(fs.readFileSync(absolute, 'utf8') === content, `${file} is stale`);
    }
    if (file === MIGRATION_FILE || file === ROLLBACK_FILE) {
      assert(Buffer.byteLength(content, 'utf8') < 19_500, `${file} exceeds 19,500 bytes`);
    }
  }
  process.stdout.write(`${JSON.stringify(Object.fromEntries(
    Object.entries(artifacts).map(([file, content]) => [file, Buffer.byteLength(content, 'utf8')]),
  ), null, 2)}\n`);
}

if (require.main === module) main();
module.exports = {
  buildArtifacts,
  buildModel,
  fixture,
  rowsFingerprint,
  MIGRATION_ID,
  MIGRATION_FILE,
  ROLLBACK_FILE,
  PREFLIGHT_FILE,
  POSTFLIGHT_FILE,
  MANIFEST_FILE,
};
