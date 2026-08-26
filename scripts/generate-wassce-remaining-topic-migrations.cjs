"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  REPO_ONLY_EXCLUDED_IDS,
  buildSubjectManifests,
  buildTaxonomyProposal,
} = require("./generate-wassce-remaining-topic-remediation.cjs");

const ROOT = path.resolve(__dirname, "..");
const MIGRATION_DIR = path.join(ROOT, "database/migrations");
const ROLLBACK_DIR = path.join(ROOT, "database/rollbacks");
const PREFLIGHT_DIR = path.join(ROOT, "database/preflight");
const PREFLIGHT_FILENAME = "252_266_wassce_remaining_topic_remediation.sql";
const START_MIGRATION = 252;
const END_MIGRATION = 266;
const BATCH_SIZE = 100;
const EXPECTED_MAPPING_COUNT = 1500;
const EXPECTED_TOPIC_COUNT = 20;

const sql = (value) =>
  value === null ? "NULL" : `'${String(value).replace(/'/g, "''")}'`;
const valuesSql = (rows) =>
  rows.map((row) => `(${row.map(sql).join(",")})`).join(",\n ");
const inSql = (values) => values.map(sql).join(",");

function buildMappings() {
  const mappings = buildSubjectManifests()
    .flatMap((manifest) =>
      manifest.mappingGroups.flatMap((group) =>
        group.questionIds.map((questionId) => ({
          questionId,
          subjectId: manifest.subjectId,
          topicId: group.topicId,
        })),
      ),
    )
    .sort((left, right) => left.questionId.localeCompare(right.questionId));
  assert.equal(mappings.length, EXPECTED_MAPPING_COUNT);
  assert.equal(
    new Set(mappings.map((item) => item.questionId)).size,
    mappings.length,
    "duplicate WASSCE release question ID",
  );
  assert.ok(
    mappings.every(
      (item) =>
        !REPO_ONLY_EXCLUDED_IDS.includes(item.questionId) &&
        item.subjectId !== "subj_wassce_elect_math",
    ),
    "excluded or Elective Mathematics row leaked into release mappings",
  );
  return mappings;
}

function buildTopicContract() {
  const topics = buildTaxonomyProposal().topics.map((topic) => {
    assert.equal(
      topic.officialSources.length,
      1,
      `${topic.topicId}: migration contract requires one canonical source`,
    );
    return {
      topicId: topic.topicId,
      subjectId: topic.subjectId,
      name: topic.name,
      slug: topic.slug,
      description: topic.description,
      source: topic.officialSources[0],
    };
  });
  topics.sort((left, right) => left.topicId.localeCompare(right.topicId));
  assert.equal(topics.length, EXPECTED_TOPIC_COUNT);
  return topics;
}

function migrationFilename(number, index) {
  return `${number}_wassce_remaining_topic_mapping_part_${String(index + 1).padStart(2, "0")}.sql`;
}
function migrationId(filename) {
  return filename.replace(/\.sql$/, "");
}

function buildBatches() {
  const mappings = buildMappings();
  const batches = Array.from(
    { length: EXPECTED_MAPPING_COUNT / BATCH_SIZE },
    (_, index) => {
      const number = START_MIGRATION + index;
      const filename = migrationFilename(number, index);
      return {
        number,
        index,
        filename,
        migrationId: migrationId(filename),
        mappings: mappings.slice(index * BATCH_SIZE, (index + 1) * BATCH_SIZE),
      };
    },
  );
  assert.equal(batches.length, END_MIGRATION - START_MIGRATION + 1);
  assert.ok(batches.every((batch) => batch.mappings.length === BATCH_SIZE));
  return batches;
}

const topicIdsSql = (topics) => inSql(topics.map((topic) => topic.topicId));
function topicOwnershipPredicate(topics, alias = "t") {
  return `${alias}.subject_id IS CASE ${alias}.id ${topics
    .map((topic) => `WHEN ${sql(topic.topicId)} THEN ${sql(topic.subjectId)}`)
    .join(" ")} END`;
}
function topicContractPredicate(topics, alias = "t") {
  return topics
    .map(
      (topic) =>
        `(${alias}.id=${sql(topic.topicId)} AND ${alias}.subject_id=${sql(topic.subjectId)} AND ${alias}.parent_id IS NULL AND ${alias}.name=${sql(topic.name)} AND ${alias}.slug=${sql(topic.slug)} AND ${alias}.description=${sql(topic.description)} AND ${alias}.theory_content IS NULL AND ${alias}.key_formulas IS NULL AND ${alias}.display_order=0)`,
    )
    .join(" OR\n    ");
}

function batchTopicScope(batch) {
  const byTopic = new Map();
  for (const mapping of batch.mappings) {
    const existing = byTopic.get(mapping.topicId);
    assert.ok(
      existing === undefined || existing === mapping.subjectId,
      `${batch.migrationId}: topic ${mapping.topicId} crosses subject scope`,
    );
    byTopic.set(mapping.topicId, mapping.subjectId);
  }
  return [...byTopic.entries()].sort(([left], [right]) =>
    left.localeCompare(right),
  );
}

function priorContractSql(batches, index) {
  const ids = batches.slice(0, index).map((batch) => batch.migrationId);
  if (ids.length === 0) return "1=1";
  return `(SELECT COUNT(*) FROM question_bank_remediation_log l JOIN questions q ON q.id=l.entity_id JOIN topics t ON t.id=l.new_value
   WHERE l.migration_id IN (${inSql(ids)}) AND l.entity_type='question' AND l.field_name='topic_id' AND l.old_value IS NULL
    AND q.topic_id IS l.new_value AND q.subject_id IS t.subject_id)=${ids.length * BATCH_SIZE}
  AND NOT EXISTS (SELECT 1 FROM question_bank_remediation_log l LEFT JOIN questions q ON q.id=l.entity_id LEFT JOIN topics t ON t.id=l.new_value
   WHERE l.migration_id IN (${inSql(ids)}) AND (l.entity_type IS NOT 'question' OR l.field_name IS NOT 'topic_id' OR l.old_value IS NOT NULL OR q.id IS NULL OR q.topic_id IS NOT l.new_value OR t.id IS NULL OR q.subject_id IS NOT t.subject_id))`;
}

function renderTopicBootstrap(topics, guardTable) {
  const sourceByUrl = new Map();
  for (const topic of topics) {
    if (!sourceByUrl.has(topic.source.url)) {
      sourceByUrl.set(topic.source.url, {
        sourceKey: `source_${String(sourceByUrl.size + 1).padStart(2, "0")}`,
        ...topic.source,
      });
    }
  }
  const sources = [...sourceByUrl.values()].sort((left, right) =>
    left.sourceKey.localeCompare(right.sourceKey),
  );
  const topicRows = topics.map((topic) => [
    topic.topicId,
    topic.subjectId,
    topic.name,
    topic.slug,
    topic.description,
    sourceByUrl.get(topic.source.url).sourceKey,
  ]);
  return `CREATE TABLE IF NOT EXISTS _m252_sources(source_key TEXT PRIMARY KEY,authority TEXT NOT NULL,title TEXT NOT NULL,url TEXT NOT NULL);
DELETE FROM _m252_sources;
INSERT INTO _m252_sources VALUES
 ${valuesSql(sources.map((source) => [source.sourceKey, source.authority, source.title, source.url]))};
CREATE TABLE IF NOT EXISTS _m252_topics(topic_id TEXT PRIMARY KEY,subject_id TEXT NOT NULL,name TEXT NOT NULL,slug TEXT NOT NULL,description TEXT NOT NULL,source_key TEXT NOT NULL);
DELETE FROM _m252_topics;
INSERT INTO _m252_topics VALUES
 ${valuesSql(topicRows)};
INSERT INTO ${guardTable}(valid)
SELECT CASE WHEN
 (SELECT COUNT(*) FROM _m252_sources)=${sources.length}
 AND (SELECT COUNT(*) FROM _m252_topics)=${EXPECTED_TOPIC_COUNT}
 AND NOT EXISTS (SELECT 1 FROM _m252_topics p LEFT JOIN _m252_sources s ON s.source_key=p.source_key WHERE s.source_key IS NULL)
 AND NOT EXISTS (SELECT 1 FROM topics t JOIN _m252_topics p ON t.id=p.topic_id WHERE t.subject_id IS NOT p.subject_id OR t.parent_id IS NOT NULL OR t.name IS NOT p.name OR t.slug IS NOT p.slug OR t.description IS NOT p.description OR t.theory_content IS NOT NULL OR t.key_formulas IS NOT NULL OR t.display_order<>0)
 AND NOT EXISTS (SELECT 1 FROM topics t JOIN _m252_topics p ON t.subject_id=p.subject_id AND (t.slug=p.slug OR lower(t.name)=lower(p.name)) WHERE t.id IS NOT p.topic_id)
 AND (SELECT COUNT(*) FROM topics WHERE id IN (${topicIdsSql(topics)})) IN (0,${EXPECTED_TOPIC_COUNT})
THEN 1 ELSE 0 END;
INSERT OR IGNORE INTO topics(id,subject_id,parent_id,name,slug,description,theory_content,key_formulas,display_order)
SELECT topic_id,subject_id,NULL,name,slug,description,NULL,NULL,0 FROM _m252_topics;
INSERT INTO ${guardTable}(valid)
SELECT CASE WHEN (SELECT COUNT(*) FROM topics t JOIN _m252_topics p ON p.topic_id=t.id
 WHERE t.subject_id IS p.subject_id AND t.parent_id IS NULL AND t.name IS p.name AND t.slug IS p.slug AND t.description IS p.description AND t.theory_content IS NULL AND t.key_formulas IS NULL AND t.display_order=0)=${EXPECTED_TOPIC_COUNT} THEN 1 ELSE 0 END;
DROP TABLE _m252_sources;`;
}

function renderMigration(batch, batches, topics) {
  const guard = `_migration_${batch.number}_guard`;
  const map = `_migration_${batch.number}_map`;
  const scope = `_migration_${batch.number}_scope`;
  const mapRows = batch.mappings.map((item) => [item.questionId, item.topicId]);
  const scopeRows = batchTopicScope(batch);
  const bootstrap =
    batch.number === START_MIGRATION
      ? `${renderTopicBootstrap(topics, guard)}\n`
      : "";
  return `-- ${batch.number}: WASSCE remaining-topic remediation batch ${batch.index + 1}/15 (exactly 100 authoritative live rows).
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS ${guard}(valid INTEGER NOT NULL CHECK(valid=1));
DELETE FROM ${guard};
CREATE TABLE IF NOT EXISTS ${map}(question_id TEXT PRIMARY KEY,topic_id TEXT NOT NULL);
DELETE FROM ${map};
INSERT INTO ${map} VALUES
 ${valuesSql(mapRows)};
CREATE TABLE IF NOT EXISTS ${scope}(topic_id TEXT PRIMARY KEY,subject_id TEXT NOT NULL);
DELETE FROM ${scope};
INSERT INTO ${scope} VALUES
 ${valuesSql(scopeRows)};
INSERT INTO ${guard}(valid)
SELECT CASE WHEN
 (SELECT COUNT(*) FROM ${map})=${BATCH_SIZE}
 AND (SELECT COUNT(*) FROM ${scope})=${scopeRows.length}
${
   batch.number === START_MIGRATION
     ? ""
     : `AND (SELECT COUNT(*) FROM topics WHERE id IN (${topicIdsSql(topics)}))=${EXPECTED_TOPIC_COUNT}
 AND NOT EXISTS (SELECT 1 FROM topics t WHERE t.id IN (${topicIdsSql(topics)}) AND NOT (${topicOwnershipPredicate(topics)}))`
 }
 AND NOT EXISTS (SELECT 1 FROM ${map} m LEFT JOIN ${scope} e ON e.topic_id=m.topic_id LEFT JOIN questions q ON q.id=m.question_id LEFT JOIN subjects s ON s.id=q.subject_id LEFT JOIN topics t ON t.id=m.topic_id
  WHERE e.topic_id IS NULL OR q.id IS NULL OR q.subject_id IS NOT e.subject_id OR s.id IS NULL OR s.exam_type_id IS NOT 'exam_wassce' OR s.is_active<>1 OR (t.id IS NULL AND m.topic_id NOT IN (${topicIdsSql(topics)})) OR (t.id IS NOT NULL AND t.subject_id IS NOT e.subject_id) OR (q.topic_id IS NOT NULL AND q.topic_id IS NOT m.topic_id))
 AND NOT EXISTS (SELECT 1 FROM question_bank_remediation_log l LEFT JOIN ${map} m ON m.question_id=l.entity_id
  WHERE l.migration_id=${sql(batch.migrationId)} AND (l.entity_type IS NOT 'question' OR l.field_name IS NOT 'topic_id' OR l.old_value IS NOT NULL OR m.question_id IS NULL OR l.new_value IS NOT m.topic_id))
 AND (${priorContractSql(batches, batch.index)})
 AND (((SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id=${sql(batch.migrationId)})=0
       AND (SELECT COUNT(*) FROM questions q JOIN ${map} m ON m.question_id=q.id WHERE q.topic_id IS NULL)=${BATCH_SIZE})
   OR ((SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id=${sql(batch.migrationId)})=${BATCH_SIZE}
       AND ((SELECT COUNT(*) FROM questions q JOIN ${map} m ON m.question_id=q.id WHERE q.topic_id IS NULL)=${BATCH_SIZE}
         OR (SELECT COUNT(*) FROM questions q JOIN ${map} m ON m.question_id=q.id WHERE q.topic_id IS m.topic_id)=${BATCH_SIZE})))
 AND NOT EXISTS (SELECT 1 FROM questions q JOIN topics t ON t.id=q.topic_id WHERE q.topic_id IS NOT NULL AND q.subject_id IS NOT t.subject_id)
THEN 1 ELSE 0 END;
${bootstrap}INSERT OR IGNORE INTO question_bank_remediation_log(migration_id,entity_type,entity_id,field_name,old_value,new_value)
SELECT ${sql(batch.migrationId)},'question',q.id,'topic_id',q.topic_id,m.topic_id FROM questions q JOIN ${map} m ON m.question_id=q.id WHERE q.topic_id IS NULL;
UPDATE questions SET topic_id=(SELECT m.topic_id FROM ${map} m WHERE m.question_id=questions.id)
WHERE topic_id IS NULL AND id IN (SELECT question_id FROM ${map});
INSERT INTO ${guard}(valid)
SELECT CASE WHEN
 (SELECT COUNT(*) FROM topics WHERE id IN (${topicIdsSql(topics)}))=${EXPECTED_TOPIC_COUNT}
 AND (SELECT COUNT(*) FROM questions q JOIN ${map} m ON m.question_id=q.id WHERE q.topic_id IS m.topic_id)=${BATCH_SIZE}
 AND (SELECT COUNT(*) FROM question_bank_remediation_log l JOIN ${map} m ON m.question_id=l.entity_id WHERE l.migration_id=${sql(batch.migrationId)} AND l.entity_type='question' AND l.field_name='topic_id' AND l.old_value IS NULL AND l.new_value IS m.topic_id)=${BATCH_SIZE}
 AND NOT EXISTS (SELECT 1 FROM questions q JOIN topics t ON t.id=q.topic_id WHERE q.topic_id IS NOT NULL AND q.subject_id IS NOT t.subject_id)
THEN 1 ELSE 0 END;
${batch.number === START_MIGRATION ? "DROP TABLE _m252_topics;\n" : ""}DROP TABLE ${scope};
DROP TABLE ${map};
DROP TABLE ${guard};
`;
}

function renderRollback(batch, batches, topics) {
  const guard = `_rollback_${batch.number}_guard`;
  const map = `_rollback_${batch.number}_map`;
  const scope = `_rollback_${batch.number}_scope`;
  const scopeRows = batchTopicScope(batch);
  const laterIds = batches
    .slice(batch.index + 1)
    .map((item) => item.migrationId);
  const laterActive = laterIds.length
    ? `(SELECT COUNT(*) FROM question_bank_remediation_log l JOIN questions q ON q.id=l.entity_id WHERE l.migration_id IN (${inSql(laterIds)}) AND l.entity_type='question' AND l.field_name='topic_id' AND q.topic_id IS l.new_value)`
    : "0";
  const mapRows = batch.mappings.map((item) => [item.questionId, item.topicId]);
  const rollbackTopics = `_rollback_${START_MIGRATION}_topics`;
  const topicSetup =
    batch.number === START_MIGRATION
      ? `CREATE TABLE IF NOT EXISTS ${rollbackTopics}(topic_id TEXT PRIMARY KEY,subject_id TEXT NOT NULL,name TEXT NOT NULL,slug TEXT NOT NULL,description TEXT NOT NULL);
DELETE FROM ${rollbackTopics};
INSERT INTO ${rollbackTopics} VALUES
 ${valuesSql(topics.map((topic) => [topic.topicId, topic.subjectId, topic.name, topic.slug, topic.description]))};
`
      : "";
  const topicPrecondition =
    batch.number === START_MIGRATION
      ? `(SELECT COUNT(*) FROM ${rollbackTopics})=${EXPECTED_TOPIC_COUNT}
 AND (SELECT COUNT(*) FROM topics WHERE id IN (${topicIdsSql(topics)})) IN (0,${EXPECTED_TOPIC_COUNT})
 AND ((SELECT COUNT(*) FROM topics WHERE id IN (${topicIdsSql(topics)}))=0
   OR (SELECT COUNT(*) FROM topics t JOIN ${rollbackTopics} p ON p.topic_id=t.id
       WHERE t.subject_id IS p.subject_id AND t.parent_id IS NULL AND t.name IS p.name AND t.slug IS p.slug AND t.description IS p.description
         AND t.theory_content IS NULL AND t.key_formulas IS NULL AND t.display_order=0)=${EXPECTED_TOPIC_COUNT})`
      : `(SELECT COUNT(*) FROM topics WHERE id IN (${topicIdsSql(topics)}))=${EXPECTED_TOPIC_COUNT}
 AND NOT EXISTS (SELECT 1 FROM topics t WHERE t.id IN (${topicIdsSql(topics)}) AND NOT (${topicOwnershipPredicate(topics)}))`;
  const topicCleanup =
    batch.number === START_MIGRATION
      ? `INSERT INTO ${guard}(valid)
SELECT CASE WHEN
 NOT EXISTS (SELECT 1 FROM question_bank_remediation_log l JOIN questions q ON q.id=l.entity_id WHERE l.migration_id IN (${inSql(batches.map((item) => item.migrationId))}) AND l.entity_type='question' AND l.field_name='topic_id' AND q.topic_id IS l.new_value)
 AND NOT EXISTS (SELECT 1 FROM questions WHERE topic_id IN (${topicIdsSql(topics)}))
THEN 1 ELSE 0 END;
DELETE FROM topics WHERE id IN (SELECT topic_id FROM ${rollbackTopics});
INSERT INTO ${guard}(valid)
SELECT CASE WHEN (SELECT COUNT(*) FROM topics WHERE id IN (${topicIdsSql(topics)}))=0 THEN 1 ELSE 0 END;
DROP TABLE ${rollbackTopics};
`
      : "";
  return `-- Roll back ${batch.migrationId}; restore only ledger-proven NULL topic IDs.
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS ${guard}(valid INTEGER NOT NULL CHECK(valid=1));
DELETE FROM ${guard};
${topicSetup}CREATE TABLE IF NOT EXISTS ${map}(question_id TEXT PRIMARY KEY,topic_id TEXT NOT NULL);
DELETE FROM ${map};
INSERT INTO ${map} VALUES
 ${valuesSql(mapRows)};
CREATE TABLE IF NOT EXISTS ${scope}(topic_id TEXT PRIMARY KEY,subject_id TEXT NOT NULL);
DELETE FROM ${scope};
INSERT INTO ${scope} VALUES
 ${valuesSql(scopeRows)};
INSERT INTO ${guard}(valid)
SELECT CASE WHEN
 (SELECT COUNT(*) FROM ${map})=${BATCH_SIZE}
 AND (SELECT COUNT(*) FROM ${scope})=${scopeRows.length}
 AND (${topicPrecondition})
 AND (SELECT COUNT(*) FROM question_bank_remediation_log l JOIN ${map} m ON m.question_id=l.entity_id WHERE l.migration_id=${sql(batch.migrationId)} AND l.entity_type='question' AND l.field_name='topic_id' AND l.old_value IS NULL AND l.new_value IS m.topic_id)=${BATCH_SIZE}
 AND NOT EXISTS (SELECT 1 FROM question_bank_remediation_log l LEFT JOIN ${map} m ON m.question_id=l.entity_id LEFT JOIN questions q ON q.id=l.entity_id LEFT JOIN ${scope} e ON e.topic_id=m.topic_id LEFT JOIN topics t ON t.id=m.topic_id WHERE l.migration_id=${sql(batch.migrationId)} AND (l.entity_type IS NOT 'question' OR l.field_name IS NOT 'topic_id' OR l.old_value IS NOT NULL OR m.question_id IS NULL OR l.new_value IS NOT m.topic_id OR q.id IS NULL OR e.topic_id IS NULL OR q.subject_id IS NOT e.subject_id OR (q.topic_id IS NOT NULL AND (t.id IS NULL OR t.subject_id IS NOT e.subject_id)) OR (q.topic_id IS NOT l.new_value AND q.topic_id IS NOT NULL)))
 AND ((SELECT COUNT(*) FROM questions q JOIN ${map} m ON m.question_id=q.id WHERE q.topic_id IS m.topic_id)=${BATCH_SIZE}
   OR (SELECT COUNT(*) FROM questions q JOIN ${map} m ON m.question_id=q.id WHERE q.topic_id IS NULL)=${BATCH_SIZE})
 AND ${laterActive}=0
THEN 1 ELSE 0 END;
UPDATE questions SET topic_id=NULL
WHERE EXISTS (SELECT 1 FROM question_bank_remediation_log l JOIN ${map} m ON m.question_id=l.entity_id WHERE l.migration_id=${sql(batch.migrationId)} AND l.entity_type='question' AND l.field_name='topic_id' AND l.old_value IS NULL AND l.new_value IS questions.topic_id AND l.entity_id=questions.id);
INSERT INTO ${guard}(valid)
SELECT CASE WHEN (SELECT COUNT(*) FROM questions q JOIN ${map} m ON m.question_id=q.id WHERE q.topic_id IS NULL)=${BATCH_SIZE} THEN 1 ELSE 0 END;
${topicCleanup}DROP TABLE ${scope};
DROP TABLE ${map};
DROP TABLE ${guard};
`;
}

function renderPreflight(batches, topics) {
  const mappings = batches.flatMap((batch) => batch.mappings);
  const subjectIds = [
    ...new Set(mappings.map((item) => item.subjectId)),
  ].sort();
  const releaseIds = batches.map((batch) => batch.migrationId);
  return `-- Aggregate read-only preflight/postflight/rollback checks for WASSCE remediation 252-266.
WITH
expected(question_id,subject_id,topic_id) AS (VALUES
 ${valuesSql(mappings.map((item) => [item.questionId, item.subjectId, item.topicId]))}
),
excluded(question_id) AS (VALUES
 ${valuesSql(REPO_ONLY_EXCLUDED_IDS.map((id) => [id]))}
),
release_ids(migration_id) AS (VALUES
 ${valuesSql(releaseIds.map((id) => [id]))}
),
proposed(topic_id,subject_id,name,slug,description) AS (VALUES
 ${valuesSql(topics.map((topic) => [topic.topicId, topic.subjectId, topic.name, topic.slug, topic.description]))}
),
stats AS (
 SELECT
  (SELECT COUNT(*) FROM expected e JOIN questions q ON q.id=e.question_id) target_present,
  (SELECT COUNT(*) FROM expected e JOIN questions q ON q.id=e.question_id WHERE q.subject_id IS e.subject_id) target_subjects,
  (SELECT COUNT(*) FROM expected e JOIN questions q ON q.id=e.question_id WHERE q.topic_id IS NULL) target_nulls,
  (SELECT COUNT(*) FROM expected e JOIN questions q ON q.id=e.question_id WHERE q.topic_id IS e.topic_id) target_mapped,
  (SELECT COUNT(*) FROM question_bank_remediation_log l JOIN release_ids r ON r.migration_id=l.migration_id) ledger_rows,
  (SELECT COUNT(*) FROM question_bank_remediation_log l JOIN release_ids r ON r.migration_id=l.migration_id JOIN expected e ON e.question_id=l.entity_id WHERE l.entity_type='question' AND l.field_name='topic_id' AND l.old_value IS NULL AND l.new_value IS e.topic_id) ledger_exact,
  (SELECT COUNT(*) FROM proposed p JOIN topics t ON t.id=p.topic_id) topics_present,
  (SELECT COUNT(*) FROM proposed p JOIN topics t ON t.id=p.topic_id WHERE t.subject_id IS p.subject_id AND t.parent_id IS NULL AND t.name IS p.name AND t.slug IS p.slug AND t.description IS p.description AND t.theory_content IS NULL AND t.key_formulas IS NULL AND t.display_order=0) topics_exact,
  (SELECT COUNT(*) FROM proposed p JOIN topics t ON t.subject_id=p.subject_id AND (t.slug=p.slug OR lower(t.name)=lower(p.name)) WHERE t.id IS NOT p.topic_id) topic_collisions,
  (SELECT COUNT(*) FROM excluded e JOIN questions q ON q.id=e.question_id) excluded_present,
  (SELECT COUNT(*) FROM excluded e JOIN questions q ON q.id=e.question_id WHERE q.topic_id IS NOT NULL) excluded_non_null,
  (SELECT COUNT(*) FROM excluded e JOIN question_bank_remediation_log l ON l.entity_id=e.question_id JOIN release_ids r ON r.migration_id=l.migration_id) excluded_ledgers,
  (SELECT COUNT(*) FROM question_bank_remediation_log l JOIN release_ids r ON r.migration_id=l.migration_id JOIN questions q ON q.id=l.entity_id WHERE q.subject_id='subj_wassce_elect_math') elective_math_ledgers,
  (SELECT COUNT(*) FROM questions q JOIN topics t ON t.id=q.topic_id WHERE q.topic_id IS NOT NULL AND q.subject_id IS NOT t.subject_id) cross_subject_links,
  (SELECT COUNT(*) FROM questions q JOIN subjects s ON s.id=q.subject_id WHERE s.exam_type_id='exam_wassce' AND s.is_active=1 AND q.subject_id IN (${inSql(subjectIds)}) AND q.topic_id IS NULL AND q.id NOT IN (SELECT question_id FROM expected) AND q.id NOT IN (SELECT question_id FROM excluded)) unexpected_live_nulls,
  (SELECT COUNT(*) FROM (SELECT l.migration_id FROM question_bank_remediation_log l JOIN release_ids r ON r.migration_id=l.migration_id GROUP BY l.migration_id HAVING COUNT(*)=${BATCH_SIZE})) complete_batches
),
state AS (
 SELECT *,CASE
  WHEN target_present=${EXPECTED_MAPPING_COUNT} AND target_subjects=${EXPECTED_MAPPING_COUNT} AND target_nulls=${EXPECTED_MAPPING_COUNT} AND target_mapped=0 AND ledger_rows=0 AND topics_present=0 AND topics_exact=0 AND topic_collisions=0 AND excluded_present IN (0,${REPO_ONLY_EXCLUDED_IDS.length}) AND excluded_non_null=0 AND excluded_ledgers=0 AND elective_math_ledgers=0 AND cross_subject_links=0 AND unexpected_live_nulls=0 THEN 'pristine_pre'
  WHEN target_present=${EXPECTED_MAPPING_COUNT} AND target_subjects=${EXPECTED_MAPPING_COUNT} AND target_nulls=0 AND target_mapped=${EXPECTED_MAPPING_COUNT} AND ledger_rows=${EXPECTED_MAPPING_COUNT} AND ledger_exact=${EXPECTED_MAPPING_COUNT} AND topics_present=${EXPECTED_TOPIC_COUNT} AND topics_exact=${EXPECTED_TOPIC_COUNT} AND topic_collisions=0 AND complete_batches=15 AND excluded_present IN (0,${REPO_ONLY_EXCLUDED_IDS.length}) AND excluded_non_null=0 AND excluded_ledgers=0 AND elective_math_ledgers=0 AND cross_subject_links=0 AND unexpected_live_nulls=0 THEN 'applied_post'
  WHEN target_present=${EXPECTED_MAPPING_COUNT} AND target_subjects=${EXPECTED_MAPPING_COUNT} AND target_nulls=${EXPECTED_MAPPING_COUNT} AND target_mapped=0 AND ledger_rows=${EXPECTED_MAPPING_COUNT} AND ledger_exact=${EXPECTED_MAPPING_COUNT} AND topics_present=0 AND topics_exact=0 AND topic_collisions=0 AND complete_batches=15 AND excluded_present IN (0,${REPO_ONLY_EXCLUDED_IDS.length}) AND excluded_non_null=0 AND excluded_ledgers=0 AND elective_math_ledgers=0 AND cross_subject_links=0 AND unexpected_live_nulls=0 THEN 'rolled_back'
  ELSE 'invalid' END release_state
 FROM stats
)
SELECT 'release_state' check_name,release_state actual,'pristine_pre|applied_post|rolled_back' expected FROM state
UNION ALL SELECT 'release_state_valid',CASE WHEN release_state='invalid' THEN 0 ELSE 1 END,1 FROM state
UNION ALL SELECT 'target_rows_present',target_present,${EXPECTED_MAPPING_COUNT} FROM state
UNION ALL SELECT 'target_subjects_exact',target_subjects,${EXPECTED_MAPPING_COUNT} FROM state
UNION ALL SELECT 'target_nulls',target_nulls,CASE WHEN release_state='applied_post' THEN 0 ELSE ${EXPECTED_MAPPING_COUNT} END FROM state
UNION ALL SELECT 'target_exact_mappings',target_mapped,CASE WHEN release_state='applied_post' THEN ${EXPECTED_MAPPING_COUNT} ELSE 0 END FROM state
UNION ALL SELECT 'release_ledger_rows',ledger_rows,CASE WHEN release_state='pristine_pre' THEN 0 ELSE ${EXPECTED_MAPPING_COUNT} END FROM state
UNION ALL SELECT 'release_ledger_exact',ledger_exact,CASE WHEN release_state='pristine_pre' THEN 0 ELSE ${EXPECTED_MAPPING_COUNT} END FROM state
UNION ALL SELECT 'proposed_topic_ids',topics_present,CASE WHEN release_state='applied_post' THEN ${EXPECTED_TOPIC_COUNT} ELSE 0 END FROM state
UNION ALL SELECT 'proposed_topic_contract',topics_exact,CASE WHEN release_state='applied_post' THEN ${EXPECTED_TOPIC_COUNT} ELSE 0 END FROM state
UNION ALL SELECT 'proposed_topic_collisions',topic_collisions,0 FROM state
UNION ALL SELECT 'repo_only_count_valid',CASE WHEN excluded_present IN (0,${REPO_ONLY_EXCLUDED_IDS.length}) THEN 1 ELSE 0 END,1 FROM state
UNION ALL SELECT 'repo_only_non_null',excluded_non_null,0 FROM state
UNION ALL SELECT 'repo_only_release_ledgers',excluded_ledgers,0 FROM state
UNION ALL SELECT 'elective_math_release_ledgers',elective_math_ledgers,0 FROM state
UNION ALL SELECT 'unexpected_live_nulls',unexpected_live_nulls,0 FROM state
UNION ALL SELECT 'global_cross_subject_links',cross_subject_links,0 FROM state;
PRAGMA foreign_key_check;
`;
}

function buildArtifacts() {
  const batches = buildBatches();
  const topics = buildTopicContract();
  const proposedTopicIds = new Set(topics.map((topic) => topic.topicId));
  assert.ok(
    batches[0].mappings.every(
      (mapping) => !proposedTopicIds.has(mapping.topicId),
    ),
    "migration 252 scope preguard must not depend on topics it creates",
  );
  return {
    batches,
    topics,
    migrations: batches.map((batch) => ({
      filename: batch.filename,
      sql: renderMigration(batch, batches, topics),
    })),
    rollbacks: batches.map((batch) => ({
      filename: batch.filename,
      sql: renderRollback(batch, batches, topics),
    })),
    preflight: {
      filename: PREFLIGHT_FILENAME,
      sql: renderPreflight(batches, topics),
    },
  };
}

function writeArtifacts() {
  const artifacts = buildArtifacts();
  fs.mkdirSync(MIGRATION_DIR, { recursive: true });
  fs.mkdirSync(ROLLBACK_DIR, { recursive: true });
  fs.mkdirSync(PREFLIGHT_DIR, { recursive: true });
  for (const artifact of artifacts.migrations)
    fs.writeFileSync(path.join(MIGRATION_DIR, artifact.filename), artifact.sql);
  for (const artifact of artifacts.rollbacks)
    fs.writeFileSync(path.join(ROLLBACK_DIR, artifact.filename), artifact.sql);
  fs.writeFileSync(
    path.join(PREFLIGHT_DIR, artifacts.preflight.filename),
    artifacts.preflight.sql,
  );
  return artifacts;
}

if (require.main === module) {
  const artifacts = process.argv.includes("--write")
    ? writeArtifacts()
    : buildArtifacts();
  process.stdout.write(
    `${JSON.stringify({ migrations: artifacts.migrations.length, rollbacks: artifacts.rollbacks.length, rowsPerMigration: artifacts.batches.map((batch) => batch.mappings.length), topics: artifacts.topics.length, preflight: artifacts.preflight.filename }, null, 2)}\n`,
  );
}

module.exports = {
  BATCH_SIZE,
  END_MIGRATION,
  EXPECTED_MAPPING_COUNT,
  EXPECTED_TOPIC_COUNT,
  MIGRATION_DIR,
  PREFLIGHT_DIR,
  PREFLIGHT_FILENAME,
  ROLLBACK_DIR,
  START_MIGRATION,
  buildArtifacts,
  buildBatches,
  buildMappings,
  buildTopicContract,
  writeArtifacts,
};
