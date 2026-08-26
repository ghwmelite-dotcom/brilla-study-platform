'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const ROOT = path.resolve(__dirname, '..');
const PARTS = [271, 272, 273, 274, 275];
const SIZES = [100, 100, 100, 100, 50];
const IDS = PARTS.map((number, index) => `${number}_cambridge_topic_remediation_part_${index + 1}`);
const SUBJECT_COUNTS = {
  subj_alevel_biology: 40, subj_alevel_chemistry: 40, subj_alevel_further_math: 55,
  subj_alevel_math: 55, subj_alevel_physics: 40, subj_igcse_add_math: 55,
  subj_igcse_biology: 40, subj_igcse_chemistry: 40, subj_igcse_math: 40, subj_igcse_physics: 50,
};
const SCOPE_SQL = "(id GLOB 'q_alevel_bio_[0-9][0-9][0-9]' OR id GLOB 'q_alevel_chem_[0-9][0-9][0-9]' OR id GLOB 'q_alevel_fm_[0-9][0-9][0-9]' OR id GLOB 'q_alevel_math_[0-9][0-9][0-9]' OR id GLOB 'q_alevel_phy_[0-9][0-9][0-9]' OR id GLOB 'q_igcse_addmath_[0-9][0-9][0-9]' OR id GLOB 'q_igcse_bio_[0-9][0-9][0-9]' OR id GLOB 'q_igcse_chem_[0-9][0-9][0-9]' OR id GLOB 'q_igcse_math_[0-9][0-9][0-9]' OR id GLOB 'q_igcse_phy_[0-9][0-9][0-9]')";
const SOURCES = [
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
];
const NEW_TOPICS = [
  ['topic_igcse_chem_electrolysis','subj_igcse_chemistry','Electrolysis','electrolysis','Electrolytes, electrodes, electrolysis products and industrial applications',9],
  ['topic_igcse_chem_analysis','subj_igcse_chemistry','Experimental Techniques and Chemical Analysis','experimental-techniques-and-chemical-analysis','Separation methods, qualitative analysis and tests for ions and gases',10],
  ['topic_igcse_bio_cell_transport','subj_igcse_biology','Movement into and out of Cells','movement-into-and-out-of-cells','Diffusion, osmosis and active transport across cell membranes',9],
  ['topic_igcse_bio_excretion','subj_igcse_biology','Excretion in Humans','excretion-in-humans','Excretory products, kidneys, nephrons and urine formation',10],
  ['topic_igcse_bio_coordination','subj_igcse_biology','Coordination and Response','coordination-and-response','Nervous control, hormones, tropisms and homeostasis',11],
  ['topic_igcse_addmath_series','subj_igcse_add_math','Series','series','Arithmetic and geometric progressions and binomial expansions',8],
  ['topic_alevel_phys_medical','subj_alevel_physics','Medical Physics','medical-physics','Diagnostic imaging, ultrasound, X-rays and medical applications of physics',7],
  ['topic_alevel_phys_particles','subj_alevel_physics','Particle Physics','particle-physics','Fundamental particles, quarks, leptons and particle interactions',8],
  ['topic_alevel_bio_immunity','subj_alevel_biology','Immunity','immunity','Antigens, immune responses, memory cells and vaccination',8],
  ['topic_alevel_math_diffeq','subj_alevel_math','Differential Equations','differential-equations','Forming and solving first-order differential equations',10],
  ['topic_alevel_fmath_summation','subj_alevel_further_math','Summation of Series','summation-of-series','Finite series, standard sums and the method of differences',7],
  ['topic_alevel_fmath_induction','subj_alevel_further_math','Proof by Induction','proof-by-induction','Inductive proofs for identities, divisibility and matrix results',8],
  ['topic_alevel_fmath_polynomial_roots','subj_alevel_further_math','Roots of Polynomial Equations','roots-of-polynomial-equations','Relations between polynomial roots and coefficients',9],
  ['topic_alevel_fmath_vectors','subj_alevel_further_math','Vectors','vectors','Vector products, lines, planes and distances in three dimensions',10],
  ['topic_alevel_fmath_integration','subj_alevel_further_math','Integration','integration','Advanced integration, arc length and reduction formulae',11],
].map(([id, subjectId, name, slug, description, displayOrder]) => ({ id, subjectId, name, slug, description, displayOrder, createdAt: '2026-08-26T00:00:00.000Z' }));
const Q050_OLD = { correct_answer: '1 unit', explanation: 'd = |2(1) + 2(2) + 1(3) - 10|/√(4+4+1) = |2 + 4 + 3 - 10|/3 = |-1|/3 = 1/3... Actually: d = |9-10|/3 = 1/3' };
const Q050_NEW = { correct_answer: '1/3 unit', explanation: 'For 2x + 2y + z - 10 = 0, d = |2(1) + 2(2) + 3 - 10|/√(2² + 2² + 1²) = |9 - 10|/3 = 1/3 unit.' };
const Q051_OLD = '["A. 1 + x + x²/2 + x³/6", "B. 1 + x + x² + x³", "C. x + x²/2 + x³/6", "D. 1 + x + x²/2! + x³/3!"]';
const Q051_NEW = '["A. 1 + x + x²/2 + x³/6","B. 1 + x + x² + x³","C. x + x²/2 + x³/6","D. 1 + x + x²/2 + x³/3"]';
const EXCEPTIONS = ['q_alevel_bio_028','q_alevel_bio_029','q_alevel_fm_051','q_alevel_fm_052','q_alevel_fm_053'];
const STATE_FIELDS = ['id','subject_id','topic_id','question_text','question_type','options','correct_answer','explanation','difficulty','points','marks','time_limit'];
const LOG_FIELDS = ['migration_id','entity_type','entity_id','field_name','old_value','new_value'];
const TOPIC_FIELDS = ['id','subject_id','parent_id','name','slug','description','theory_content','key_formulas','display_order','created_at'];
const LOG_ORDER = ['migration_id','entity_type','entity_id','field_name','old_value','new_value'];
const P1 = 2147483647; const P2 = 2147483629;

const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');
const json = (file) => JSON.parse(read(file));
const sql = (value) => value === null || value === undefined ? 'NULL' : `'${String(value).replaceAll("'", "''")}'`;
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const chars = (value) => Array.from(String(value));
const serialize = (row, fields) => JSON.stringify(fields.map((field) => row[field] ?? null));
const compareFields = (fields) => (left, right) => {
  for (const field of fields) {
    const a = left[field]; const b = right[field];
    if (a === b) continue;
    if (a === null || a === undefined) return -1;
    if (b === null || b === undefined) return 1;
    if (String(a) < String(b)) return -1;
    if (String(a) > String(b)) return 1;
  }
  return 0;
};
function fingerprint(payload) {
  let h1 = 7; let h2 = 11;
  for (const character of chars(payload)) {
    const code = character.codePointAt(0);
    h1 = (h1 * 131 + code) % P1;
    h2 = (h2 * 137 + code) % P2;
  }
  return [chars(payload).length, h1, h2];
}
function rowsFingerprint(rows, fields) {
  let n = 0; let a = 0; let b = 0;
  rows.forEach((row, index) => {
    const rowFingerprint = fingerprint(serialize(row, fields));
    const ordinal = index + 1;
    n += rowFingerprint[0];
    a = (a + ((rowFingerprint[1] * ordinal) % P1)) % P1;
    b = (b + ((rowFingerprint[2] * ordinal) % P2)) % P2;
  });
  return [rows.length, n, a, b];
}
const fpEquals = (table, fp) => `(SELECT c=${fp[0]} AND n=${fp[1]} AND a=${fp[2]} AND b=${fp[3]} FROM ${table})`;
const fpState = (table, rows, fields) => fpEquals(table, rowsFingerprint(rows, fields));
const fpSql = (alias, tableSql, orderBy, fields) => `CREATE TEMP TABLE ${alias} AS WITH RECURSIVE r(k,v) AS (SELECT row_number() OVER(ORDER BY ${orderBy}),json_array(${fields.join(',')}) ${tableSql}),w(k,i,n,a,b,v) AS (SELECT k,0,length(v),7,11,v FROM r UNION ALL SELECT k,i+1,n,(a*131+unicode(substr(v,i+1,1)))%${P1},(b*137+unicode(substr(v,i+1,1)))%${P2},v FROM w WHERE i<n),f AS (SELECT k,n,a,b FROM w WHERE i=n) SELECT count(*) c,coalesce(sum(n),0) n,coalesce(sum((a*k)%${P1})%${P1},0) a,coalesce(sum((b*k)%${P2})%${P2},0) b FROM f;`;

function fixture() {
  const db = new DatabaseSync(':memory:');
  for (const file of ['database/schema.sql','database/seed.sql','database/prod-patches/094_seed_missing_subjects_topics.sql','database/prod-patches/096_seed_topics_for_empty_subjects.sql',...SOURCES,'database/prod-patches/088c_fix_orphan_refs.sql']) db.exec(read(file));
  return db;
}
function buildModel() {
  const manifests = [json('database/manifests/cambridge_igcse_topic_mapping.json'), json('database/manifests/cambridge_alevel_topic_mapping.json')];
  const proposal = json('database/manifests/cambridge_topic_taxonomy_proposals.json');
  const base = manifests.flatMap((manifest) => manifest.subjects.flatMap((subject) => subject.mappingGroups.flatMap((group) => group.questionIds.map((questionId) => ({ questionId, topicId: group.topicId }))))) ;
  const mappings = [...base, ...proposal.proposedMappings.map((row) => ({ questionId: row.questionId, topicId: row.proposedTopicId }))].sort((a, b) => a.questionId.localeCompare(b.questionId));
  const q050Index = mappings.findIndex((row) => row.questionId === 'q_alevel_fm_050');
  assert(q050Index >= 0, 'q050 mapping missing'); mappings.unshift(mappings.splice(q050Index, 1)[0]);
  assert(mappings.length === 450 && new Set(mappings.map((row) => row.questionId)).size === 450, 'Expected 450 unique mappings');
  assert(proposal.retainedExceptions.length === 5 && proposal.retainedExceptions.every((row) => EXCEPTIONS.includes(row.questionId)), 'Five-exception ledger drift');
  const db = fixture();
  try {
    const source = db.prepare(`SELECT ${STATE_FIELDS.join(',')} FROM questions WHERE ${SCOPE_SQL} ORDER BY id`).all();
    assert(source.length === 455 && source.every((row) => row.topic_id === null), `Source drift: ${source.length}`);
    for (const [subjectId, count] of Object.entries(SUBJECT_COUNTS)) assert(source.filter((row) => row.subject_id === subjectId).length === count, `${subjectId} count drift`);
    const byId = new Map(source.map((row) => [row.id, row]));
    assert(byId.get('q_alevel_fm_050').correct_answer === Q050_OLD.correct_answer && byId.get('q_alevel_fm_050').explanation === Q050_OLD.explanation, 'q050 source drift');
    assert(byId.get('q_alevel_fm_051').options === Q051_OLD, 'q051 source drift');
    const batches = []; let offset = 0;
    for (let index = 0; index < PARTS.length; index += 1) { batches.push({ number: PARTS[index], migrationId: IDS[index], rows: mappings.slice(offset, offset + SIZES[index]) }); offset += SIZES[index]; }
    const targetById = new Map(mappings.map((row) => [row.questionId, row.topicId]));
    const batchById = new Map(batches.flatMap((batch) => batch.rows.map((row) => [row.questionId, batch.number])));
    const stateAt = (partIndex) => source.map((original) => {
      const row = { ...original };
      if (partIndex >= 0 && row.id === 'q_alevel_fm_050') Object.assign(row, Q050_NEW);
      if (partIndex >= 0 && row.id === 'q_alevel_fm_051') row.options = Q051_NEW;
      if ((batchById.get(row.id) ?? Infinity) <= PARTS[partIndex]) row.topic_id = targetById.get(row.id);
      return row;
    });
    const states = [source, ...PARTS.map((_, index) => stateAt(index))];
    const logsByMigration = new Map(batches.map((batch) => [batch.migrationId, batch.rows.map((row) => ({ migration_id: batch.migrationId, entity_type: 'question', entity_id: row.questionId, field_name: 'topic_id', old_value: null, new_value: row.topicId }))]));
    logsByMigration.get(IDS[0]).push(
      { migration_id: IDS[0], entity_type: 'question', entity_id: 'q_alevel_fm_050', field_name: 'correct_answer', old_value: Q050_OLD.correct_answer, new_value: Q050_NEW.correct_answer },
      { migration_id: IDS[0], entity_type: 'question', entity_id: 'q_alevel_fm_050', field_name: 'explanation', old_value: Q050_OLD.explanation, new_value: Q050_NEW.explanation },
      { migration_id: IDS[0], entity_type: 'question', entity_id: 'q_alevel_fm_051', field_name: 'options', old_value: Q051_OLD, new_value: Q051_NEW },
    );
    for (const rows of logsByMigration.values()) rows.sort(compareFields(LOG_ORDER));
    const topicRows = NEW_TOPICS.map((topic) => ({ id: topic.id, subject_id: topic.subjectId, parent_id: null, name: topic.name, slug: topic.slug, description: topic.description, theory_content: null, key_formulas: null, display_order: topic.displayOrder, created_at: topic.createdAt })).sort(compareFields(['id']));
    const logsThrough = (index) => index < 0 ? [] : IDS.slice(0, index + 1).flatMap((id) => logsByMigration.get(id)).sort(compareFields(LOG_ORDER));
    return { proposal, mappings, batches, states, logsByMigration, logsThrough, topicRows };
  } finally { db.close(); }
}

function mapTable(name, rows) {
  const groups = new Map();
  for (const row of rows) { const ids = groups.get(row.topicId) ?? []; ids.push(row.questionId); groups.set(row.topicId, ids); }
  return `CREATE TEMP TABLE ${name}(question_id TEXT PRIMARY KEY,topic_id TEXT NOT NULL);${[...groups].map(([topicId, questionIds]) => `INSERT INTO ${name} SELECT column1,${sql(topicId)} FROM(VALUES${questionIds.map((questionId) => `(${sql(questionId)})`).join(',')});`).join('')}`;
}
const stateFpTable = (name) => fpSql(name, `FROM questions WHERE ${SCOPE_SQL}`, 'id', STATE_FIELDS);
const topicFpTable = (name) => fpSql(name, `FROM topics WHERE id IN(${NEW_TOPICS.map((topic) => sql(topic.id)).join(',')})`, 'id', TOPIC_FIELDS);
const logFpTable = (name) => fpSql(name, `FROM question_bank_remediation_log WHERE migration_id IN(${IDS.map(sql).join(',')})`, LOG_ORDER.join(','), LOG_FIELDS);
const scopeTable = () => `CREATE TEMP TABLE _sr AS SELECT * FROM questions WHERE ${SCOPE_SQL};`;
function topicSpecsSql() { return `CREATE TEMP TABLE _ts(id TEXT PRIMARY KEY,subject_id TEXT NOT NULL,name TEXT NOT NULL,slug TEXT NOT NULL,description TEXT NOT NULL,display_order INTEGER NOT NULL,created_at TEXT NOT NULL);INSERT INTO _ts VALUES${NEW_TOPICS.map((topic) => `(${[topic.id,topic.subjectId,topic.name,topic.slug,topic.description,topic.displayOrder,topic.createdAt].map(sql).join(',')})`).join(',')};`; }
function supportTables(includeSpecs = false) { return `${includeSpecs ? topicSpecsSql() : ''}${scopeTable()}${stateFpTable('_sf')}${topicFpTable('_tf')}${logFpTable('_lf')}`; }
const dropFingerprints = () => 'DROP TABLE _lf;DROP TABLE _tf;DROP TABLE _sf;';
const dropSupport = (includeSpecs = false) => `${dropFingerprints()}DROP TABLE _sr;${includeSpecs ? 'DROP TABLE _ts;' : ''}`;
function topicGuard(model, firstRun) {
  const ids = NEW_TOPICS.map((topic) => sql(topic.id)).join(','); const exact = fpEquals('_tf', rowsFingerprint(model.topicRows, TOPIC_FIELDS));
  const collision = firstRun ? "NOT EXISTS(SELECT 1 FROM _ts s JOIN topics t ON t.subject_id=s.subject_id AND t.id<>s.id AND (t.name=s.name OR t.slug=s.slug))" : `NOT EXISTS(SELECT 1 FROM topics n JOIN topics o ON o.subject_id=n.subject_id AND o.id<>n.id AND (o.name=n.name OR o.slug=n.slug) WHERE n.id IN(${ids}))`;
  const active = firstRun ? "AND NOT EXISTS(SELECT 1 FROM _ts s LEFT JOIN subjects x ON x.id=s.subject_id WHERE x.id IS NULL OR x.is_active<>1 OR x.exam_type_id<>CASE WHEN s.subject_id LIKE 'subj_igcse_%' THEN 'igcse' ELSE 'cambridge_a2' END)" : '';
  return firstRun ? `((SELECT COUNT(*) FROM topics WHERE id IN(${ids}))=0 OR ((SELECT COUNT(*) FROM topics WHERE id IN(${ids}))=15 AND ${exact})) AND ${collision} ${active}` : `(SELECT COUNT(*) FROM topics WHERE id IN(${ids}))=15 AND ${exact} AND ${collision}`;
}

function migrationSql(model, index) {
  const batch = model.batches[index]; const map = `_m${batch.number}`; const guard = `_g${batch.number}`;
  const preState = fpEquals('_sf', rowsFingerprint(model.states[index], STATE_FIELDS)); const postState = fpEquals('_sf', rowsFingerprint(model.states[index + 1], STATE_FIELDS)); const finalState = fpEquals('_sf', rowsFingerprint(model.states[5], STATE_FIELDS));
  const preLogs = fpState('_lf', model.logsThrough(index - 1), LOG_FIELDS); const postLogs = fpState('_lf', model.logsThrough(index), LOG_FIELDS); const finalLogs = fpState('_lf', model.logsThrough(4), LOG_FIELDS);
  const ownerJoins = index === 0 ? 'LEFT JOIN topics t ON t.id=m.topic_id LEFT JOIN _ts s ON s.id=m.topic_id' : 'LEFT JOIN topics t ON t.id=m.topic_id';
  const ownerFailure = index === 0 ? '(t.id IS NULL AND s.id IS NULL) OR q.subject_id<>COALESCE(t.subject_id,s.subject_id)' : 't.id IS NULL OR q.subject_id<>t.subject_id';
  const topicInsert = index === 0 ? 'INSERT OR IGNORE INTO topics(id,subject_id,parent_id,name,slug,description,theory_content,key_formulas,display_order,created_at) SELECT id,subject_id,NULL,name,slug,description,NULL,NULL,display_order,created_at FROM _ts;' : '';
  const corrections = index === 0 ? `INSERT OR IGNORE INTO question_bank_remediation_log(migration_id,entity_type,entity_id,field_name,old_value,new_value) VALUES(${sql(IDS[0])},'question','q_alevel_fm_050','correct_answer',${sql(Q050_OLD.correct_answer)},${sql(Q050_NEW.correct_answer)}),(${sql(IDS[0])},'question','q_alevel_fm_050','explanation',${sql(Q050_OLD.explanation)},${sql(Q050_NEW.explanation)}),(${sql(IDS[0])},'question','q_alevel_fm_051','options',${sql(Q051_OLD)},${sql(Q051_NEW)});UPDATE questions SET correct_answer=${sql(Q050_NEW.correct_answer)},explanation=${sql(Q050_NEW.explanation)} WHERE id='q_alevel_fm_050' AND correct_answer=${sql(Q050_OLD.correct_answer)} AND explanation=${sql(Q050_OLD.explanation)};UPDATE questions SET options=${sql(Q051_NEW)} WHERE id='q_alevel_fm_051' AND options=${sql(Q051_OLD)};` : '';
  return `-- ${batch.migrationId}: ${batch.rows.length} reviewed Cambridge mappings.\nPRAGMA foreign_keys=ON;${mapTable(map,batch.rows)}CREATE TEMP TABLE ${guard}(valid INTEGER CHECK(valid=1));${supportTables(index===0)}INSERT INTO ${guard} SELECT CASE WHEN (((${preState} AND ${preLogs}) OR (${postState} AND ${postLogs})) OR (${finalState} AND ${finalLogs})) AND ${topicGuard(model,index===0)} AND (SELECT COUNT(*) FROM ${map})=${batch.rows.length} AND NOT EXISTS(SELECT 1 FROM ${map} m LEFT JOIN questions q ON q.id=m.question_id ${ownerJoins} WHERE q.id IS NULL OR ${ownerFailure}) THEN 1 ELSE 0 END;${topicInsert}${corrections}INSERT OR IGNORE INTO question_bank_remediation_log(migration_id,entity_type,entity_id,field_name,old_value,new_value) SELECT ${sql(batch.migrationId)},'question',q.id,'topic_id',NULL,m.topic_id FROM questions q JOIN ${map} m ON m.question_id=q.id WHERE q.topic_id IS NULL;UPDATE questions SET topic_id=(SELECT topic_id FROM ${map} WHERE question_id=questions.id) WHERE id IN(SELECT question_id FROM ${map}) AND topic_id IS NULL;${dropFingerprints()}${stateFpTable('_sf')}${topicFpTable('_tf')}${logFpTable('_lf')}INSERT INTO ${guard} SELECT CASE WHEN ((${postState} AND ${postLogs}) OR (${finalState} AND ${finalLogs})) AND ${topicGuard(model,false)} AND NOT EXISTS(SELECT 1 FROM pragma_foreign_key_check) AND NOT EXISTS(SELECT 1 FROM _sr q JOIN topics t ON t.id=q.topic_id WHERE q.topic_id IS NOT NULL AND q.subject_id<>t.subject_id) THEN 1 ELSE 0 END;${dropSupport(index===0)}DROP TABLE ${map};DROP TABLE ${guard};\n`;
}
function rollbackSql(model,index) {
  const batch=model.batches[index]; const map=`_r${batch.number}`; const guard=`_rg${batch.number}`;
  const preState=fpEquals('_sf',rowsFingerprint(model.states[index],STATE_FIELDS)); const postState=fpEquals('_sf',rowsFingerprint(model.states[index+1],STATE_FIELDS));
  const allowedLogs=Array.from({length:5-index},(_,offset)=>fpState('_lf',model.logsThrough(index+offset),LOG_FIELDS)).join(' OR ');
  const restore=index===0?`UPDATE questions SET correct_answer=${sql(Q050_OLD.correct_answer)},explanation=${sql(Q050_OLD.explanation)} WHERE id='q_alevel_fm_050' AND correct_answer=${sql(Q050_NEW.correct_answer)} AND explanation=${sql(Q050_NEW.explanation)};UPDATE questions SET options=${sql(Q051_OLD)} WHERE id='q_alevel_fm_051' AND options=${sql(Q051_NEW)};`:'';
  const remove=index===0?`INSERT INTO ${guard} SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM questions WHERE topic_id IN(${NEW_TOPICS.map((topic)=>sql(topic.id)).join(',')})) THEN 1 ELSE 0 END;DELETE FROM topics WHERE id IN(${NEW_TOPICS.map((topic)=>sql(topic.id)).join(',')});`:'';
  return `-- Reverse ${batch.migrationId}; immutable ledger rows are retained.\nPRAGMA foreign_keys=ON;${mapTable(map,batch.rows)}CREATE TEMP TABLE ${guard}(valid INTEGER CHECK(valid=1));${supportTables()}INSERT INTO ${guard} SELECT CASE WHEN ${postState} AND (${allowedLogs}) AND ${topicGuard(model,false)} AND NOT EXISTS(SELECT 1 FROM ${map} m LEFT JOIN question_bank_remediation_log l ON l.migration_id=${sql(batch.migrationId)} AND l.entity_id=m.question_id AND l.field_name='topic_id' WHERE l.entity_id IS NULL OR l.old_value IS NOT NULL OR l.new_value<>m.topic_id) THEN 1 ELSE 0 END;UPDATE questions SET topic_id=NULL WHERE id IN(SELECT question_id FROM ${map}) AND topic_id=(SELECT new_value FROM question_bank_remediation_log l WHERE l.migration_id=${sql(batch.migrationId)} AND l.entity_id=questions.id AND l.field_name='topic_id');${restore}${remove}DROP TABLE _tf;DROP TABLE _sf;${stateFpTable('_sf')}${topicFpTable('_tf')}INSERT INTO ${guard} SELECT CASE WHEN ${preState} AND ${index===0?fpEquals('_tf',[0,0,0,0]):topicGuard(model,false)} AND NOT EXISTS(SELECT 1 FROM pragma_foreign_key_check) THEN 1 ELSE 0 END;${dropSupport()}DROP TABLE ${map};DROP TABLE ${guard};\n`;
}
function flightSql(model,post){
  const state=fpEquals('_sf',rowsFingerprint(model.states[post?5:0],STATE_FIELDS)); const logs=fpState('_lf',post?model.logsThrough(4):[],LOG_FIELDS); const topics=post?topicGuard(model,false):fpEquals('_tf',[0,0,0,0]);
  return `-- Cambridge 271-275 ${post?'postflight':'preflight'}.\nPRAGMA foreign_keys=ON;CREATE TEMP TABLE _fg(valid INTEGER CHECK(valid=1));${supportTables()}INSERT INTO _fg SELECT CASE WHEN ${state} AND ${logs} AND ${topics} AND (SELECT COUNT(*) FROM _sr)=455 AND (SELECT COUNT(*) FROM _sr WHERE subject_id LIKE 'subj_igcse_%' AND topic_id IS NOT NULL)=${post?225:0} AND (SELECT COUNT(*) FROM _sr WHERE subject_id LIKE 'subj_alevel_%' AND topic_id IS NOT NULL)=${post?225:0} AND ${post?`(SELECT COUNT(*) FROM _sr WHERE id IN(${EXCEPTIONS.map(sql).join(',')}) AND topic_id IS NULL)=5`:'(SELECT COUNT(*) FROM _sr WHERE topic_id IS NULL)=455'} AND NOT EXISTS(SELECT 1 FROM pragma_foreign_key_check) AND NOT EXISTS(SELECT 1 FROM _sr q JOIN topics t ON t.id=q.topic_id WHERE q.topic_id IS NOT NULL AND q.subject_id<>t.subject_id) THEN 1 ELSE 0 END;${dropSupport()}DROP TABLE _fg;\n`;
}
function buildArtifacts(){
  const model=buildModel(); const artifacts={};
  for(let index=0;index<PARTS.length;index+=1){const base=IDS[index];artifacts[`database/migrations/${base}.sql`]=migrationSql(model,index);artifacts[`database/rollbacks/${base}_rollback.sql`]=rollbackSql(model,index);}
  artifacts['database/preflight/271_275_cambridge_topic_remediation_preflight.sql']=flightSql(model,false);
  artifacts['database/preflight/271_275_cambridge_topic_remediation_postflight.sql']=flightSql(model,true);
  artifacts['database/manifests/271_275_cambridge_topic_remediation.json']=`${JSON.stringify({release:'cambridge-topic-remediation-2026-08-26',status:'local-staging-preparation-only',migrationRange:[271,275],sourceQuestionCount:455,mappedQuestionCount:450,reviewedExceptionCount:5,chunkSizes:SIZES,newTopics:NEW_TOPICS,contentCorrections:model.proposal.contentCorrectionProposals,mappings:model.batches.flatMap((batch)=>batch.rows.map((row)=>({...row,subjectId:model.states[0].find((question)=>question.id===row.questionId).subject_id,migrationId:batch.migrationId}))),stateFingerprints:model.states.map((rows,index)=>({stage:index,fingerprint:rowsFingerprint(rows,STATE_FIELDS)}))},null,2)}\n`;
  artifacts['database/manifests/271_275_cambridge_reviewed_exceptions.json']=`${JSON.stringify({release:'cambridge-topic-remediation-2026-08-26',status:'reviewed-retained-exceptions',expectedExceptionCount:5,exceptions:model.proposal.retainedExceptions},null,2)}\n`;
  return {model,artifacts};
}
function main(){const {artifacts}=buildArtifacts();const write=process.argv.includes('--write');const check=process.argv.includes('--check');assert(write!==check,'Use exactly one of --write or --check');for(const [file,content] of Object.entries(artifacts)){const absolute=path.join(ROOT,file);if(write){fs.mkdirSync(path.dirname(absolute),{recursive:true});fs.writeFileSync(absolute,content);}else assert(fs.existsSync(absolute)&&fs.readFileSync(absolute,'utf8')===content,`${file} is missing or stale`);if(file.includes('/migrations/')||file.includes('/rollbacks/'))assert(Buffer.byteLength(content)<19500,`${file} exceeds 19,500 bytes`);}process.stdout.write(`${JSON.stringify(Object.fromEntries(Object.entries(artifacts).map(([file,content])=>[file,Buffer.byteLength(content)])),null,2)}\n`);}
if(require.main===module)main();
module.exports={buildArtifacts,buildModel,fingerprint,rowsFingerprint};
