'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { ROOT, collectMappings, loadDb } = require('./generate-bece-topic-remediation.cjs');

const DATABASE = path.join(ROOT, 'database');
const MIGRATIONS = path.join(DATABASE, 'migrations');
const ROLLBACKS = path.join(DATABASE, 'rollbacks');
const PREFLIGHT = path.join(DATABASE, 'preflight');
const MANIFESTS = path.join(DATABASE, 'manifests');
const MAX_ROWS_PER_MIGRATION = 100;

const NEW_TOPICS = [
  {
    id: 'topic_bece_french_vocabulary',
    subjectId: 'subj_bece_french',
    name: 'General Vocabulary and Descriptions',
    slug: 'general-vocabulary-and-descriptions',
    description: 'Common descriptive words, colours, preferences and general expressions',
    displayOrder: 8,
  },
  {
    id: 'topic_bece_science_methods',
    subjectId: 'subj_bece_science',
    name: 'Scientific Inquiry and Technology',
    slug: 'scientific-inquiry-and-technology',
    description: 'Scientific method, variables, laboratory instruments and applications of technology',
    displayOrder: 9,
  },
  {
    id: 'topic_bece_science_earth_space',
    subjectId: 'subj_bece_science',
    name: 'Earth and Space Science',
    slug: 'earth-and-space-science',
    description: 'Earth structure, rocks, the atmosphere, the water cycle and the Solar System',
    displayOrder: 10,
  },
];

const SUBJECTS = [
  ['bdt', 'subj_bece_bdt'],
  ['english', 'subj_bece_english'],
  ['french', 'subj_bece_french'],
  ['ict', 'subj_bece_ict'],
  ['math', 'subj_bece_math'],
  ['rme', 'subj_bece_rme'],
  ['science', 'subj_bece_science'],
  ['social', 'subj_bece_social'],
];

function sql(value) {
  if (value === null) return 'NULL';
  return `'${String(value).replaceAll("'", "''")}'`;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function buildBatches(rows) {
  let migrationNumber = 225;
  const batches = [];
  for (const [slug, subjectId] of SUBJECTS) {
    const subjectRows = rows.filter((row) => row.subject_id === subjectId);
    const parts = [];
    for (let start = 0; start < subjectRows.length; start += MAX_ROWS_PER_MIGRATION) {
      parts.push(subjectRows.slice(start, start + MAX_ROWS_PER_MIGRATION));
    }
    parts.forEach((partRows, index) => {
      const suffix = parts.length > 1 ? `_part_${index + 1}` : '';
      const base = `${migrationNumber}_bece_topic_${slug}${suffix}`;
      batches.push({
        number: migrationNumber,
        migrationId: base,
        fileName: `${base}.sql`,
        subjectId,
        rows: partRows,
      });
      migrationNumber++;
    });
  }
  return batches;
}

function taxonomyMigration() {
  const ids = NEW_TOPICS.map((topic) => sql(topic.id)).join(', ');
  const subjectIds = [...new Set(NEW_TOPICS.map((topic) => topic.subjectId))].map(sql).join(', ');
  const values = NEW_TOPICS.map((topic) => `(${[
    topic.id,
    topic.subjectId,
    null,
    topic.name,
    topic.slug,
    topic.description,
    null,
    null,
    topic.displayOrder,
    '2026-08-26T00:00:00.000Z',
  ].map(sql).join(', ')})`).join(',\n  ');
  const exactPredicate = NEW_TOPICS.map((topic) => `(
        id = ${sql(topic.id)}
        AND subject_id = ${sql(topic.subjectId)}
        AND parent_id IS NULL
        AND name = ${sql(topic.name)}
        AND slug = ${sql(topic.slug)}
        AND description = ${sql(topic.description)}
        AND display_order = ${topic.displayOrder}
      )`).join('\n      OR ');
  const collisionPredicate = NEW_TOPICS.map((topic) => `(
        subject_id = ${sql(topic.subjectId)}
        AND slug = ${sql(topic.slug)}
        AND id IS NOT ${sql(topic.id)}
      )`).join('\n      OR ');

  return `-- 224: Add the missing canonical BECE topic taxonomy used by the reviewed mapping manifest.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS _migration_224_guard (
  valid INTEGER NOT NULL CHECK (valid = 1)
);
DELETE FROM _migration_224_guard;

INSERT INTO _migration_224_guard(valid)
SELECT CASE WHEN
  (SELECT COUNT(*) FROM subjects
   WHERE id IN (${subjectIds}) AND exam_type_id = 'exam_bece' AND is_active = 1) = 2
  AND NOT EXISTS (
    SELECT 1 FROM topics
    WHERE id IN (${ids})
      AND NOT (${exactPredicate})
  )
  AND NOT EXISTS (
    SELECT 1 FROM topics
    WHERE ${collisionPredicate}
  )
THEN 1 ELSE 0 END;

INSERT OR IGNORE INTO topics
  (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at)
VALUES
  ${values};

INSERT INTO _migration_224_guard(valid)
SELECT CASE WHEN
  (SELECT COUNT(*) FROM topics WHERE id IN (${ids}) AND (${exactPredicate})) = ${NEW_TOPICS.length}
THEN 1 ELSE 0 END;

DROP TABLE _migration_224_guard;
`;
}

function taxonomyRollback() {
  const ids = NEW_TOPICS.map((topic) => sql(topic.id)).join(', ');
  const exactPredicate = NEW_TOPICS.map((topic) => `(
        id = ${sql(topic.id)}
        AND subject_id = ${sql(topic.subjectId)}
        AND name = ${sql(topic.name)}
        AND slug = ${sql(topic.slug)}
        AND display_order = ${topic.displayOrder}
      )`).join('\n      OR ');
  return `-- Roll back 224 after all BECE topic mapping rollbacks have completed.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS _rollback_224_guard (
  valid INTEGER NOT NULL CHECK (valid = 1)
);
DELETE FROM _rollback_224_guard;

INSERT INTO _rollback_224_guard(valid)
SELECT CASE WHEN
  (SELECT COUNT(*) FROM topics WHERE id IN (${ids}) AND (${exactPredicate})) = ${NEW_TOPICS.length}
  AND NOT EXISTS (SELECT 1 FROM questions WHERE topic_id IN (${ids}))
THEN 1 ELSE 0 END;

DELETE FROM topics WHERE id IN (${ids});

INSERT INTO _rollback_224_guard(valid)
SELECT CASE WHEN NOT EXISTS (SELECT 1 FROM topics WHERE id IN (${ids}))
THEN 1 ELSE 0 END;

DROP TABLE _rollback_224_guard;
`;
}

function mappingValues(rows) {
  return rows.map((row) => `(${sql(row.id)}, ${sql(row.topicId)})`).join(',\n  ');
}

function mappingMigration(batch) {
  const guard = `_migration_${batch.number}_guard`;
  const map = `_migration_${batch.number}_map`;
  const expected = batch.rows.length;
  const migrationId = sql(batch.migrationId);
  const subjectId = sql(batch.subjectId);
  return `-- ${batch.number}: Assign reviewed BECE ${batch.subjectId} questions to canonical same-subject topics.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS ${guard} (valid INTEGER NOT NULL CHECK (valid = 1));
DELETE FROM ${guard};
CREATE TABLE IF NOT EXISTS ${map} (
  question_id TEXT PRIMARY KEY,
  topic_id TEXT NOT NULL
);
DELETE FROM ${map};
INSERT INTO ${map}(question_id, topic_id) VALUES
  ${mappingValues(batch.rows)};

INSERT INTO ${guard}(valid)
SELECT CASE WHEN
  (SELECT COUNT(*) FROM ${map}) = ${expected}
  AND NOT EXISTS (
    SELECT 1
    FROM ${map} m
    LEFT JOIN questions q ON q.id = m.question_id
    LEFT JOIN topics t ON t.id = m.topic_id
    WHERE q.id IS NULL
      OR q.subject_id IS NOT ${subjectId}
      OR t.id IS NULL
      OR t.subject_id IS NOT ${subjectId}
      OR (q.topic_id IS NOT NULL AND q.topic_id IS NOT m.topic_id)
  )
  AND NOT EXISTS (
    SELECT 1
    FROM question_bank_remediation_log l
    LEFT JOIN ${map} m ON m.question_id = l.entity_id
    WHERE l.migration_id = ${migrationId}
      AND (
        l.entity_type IS NOT 'question'
        OR l.field_name IS NOT 'topic_id'
        OR l.old_value IS NOT NULL
        OR m.question_id IS NULL
        OR l.new_value IS NOT m.topic_id
      )
  )
  AND (
    (
      (SELECT COUNT(*) FROM questions q JOIN ${map} m ON m.question_id = q.id WHERE q.topic_id IS NULL) = ${expected}
      AND (SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id = ${migrationId}) = 0
    )
    OR (
      (SELECT COUNT(*) FROM questions q JOIN ${map} m ON m.question_id = q.id WHERE q.topic_id IS m.topic_id) = ${expected}
      AND (SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id = ${migrationId}) = ${expected}
    )
  )
THEN 1 ELSE 0 END;

INSERT OR IGNORE INTO question_bank_remediation_log
  (migration_id, entity_type, entity_id, field_name, old_value, new_value)
SELECT ${migrationId}, 'question', q.id, 'topic_id', q.topic_id, m.topic_id
FROM questions q
JOIN ${map} m ON m.question_id = q.id
WHERE q.topic_id IS NULL;

UPDATE questions
SET topic_id = (SELECT m.topic_id FROM ${map} m WHERE m.question_id = questions.id)
WHERE topic_id IS NULL AND id IN (SELECT question_id FROM ${map});

INSERT INTO ${guard}(valid)
SELECT CASE WHEN
  (SELECT COUNT(*) FROM questions q JOIN ${map} m ON m.question_id = q.id WHERE q.topic_id IS m.topic_id) = ${expected}
  AND (SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id = ${migrationId}) = ${expected}
  AND NOT EXISTS (
    SELECT 1 FROM questions q JOIN topics t ON t.id = q.topic_id
    WHERE q.topic_id IS NOT NULL AND q.subject_id IS NOT t.subject_id
  )
THEN 1 ELSE 0 END;

DROP TABLE ${map};
DROP TABLE ${guard};
`;
}

function mappingRollback(batch) {
  const guard = `_rollback_${batch.number}_guard`;
  const expected = batch.rows.length;
  const migrationId = sql(batch.migrationId);
  return `-- Roll back ${batch.migrationId}; the immutable remediation ledger is retained for audit.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS ${guard} (valid INTEGER NOT NULL CHECK (valid = 1));
DELETE FROM ${guard};

INSERT INTO ${guard}(valid)
SELECT CASE WHEN
  (SELECT COUNT(*) FROM question_bank_remediation_log
   WHERE migration_id = ${migrationId}
     AND entity_type = 'question'
     AND field_name = 'topic_id'
     AND old_value IS NULL) = ${expected}
  AND NOT EXISTS (
    SELECT 1
    FROM question_bank_remediation_log l
    LEFT JOIN questions q ON q.id = l.entity_id
    WHERE l.migration_id = ${migrationId}
      AND (q.id IS NULL OR q.topic_id IS NOT l.new_value)
  )
THEN 1 ELSE 0 END;

UPDATE questions
SET topic_id = (
  SELECT l.old_value
  FROM question_bank_remediation_log l
  WHERE l.migration_id = ${migrationId}
    AND l.entity_type = 'question'
    AND l.entity_id = questions.id
    AND l.field_name = 'topic_id'
)
WHERE EXISTS (
  SELECT 1
  FROM question_bank_remediation_log l
  WHERE l.migration_id = ${migrationId}
    AND l.entity_type = 'question'
    AND l.entity_id = questions.id
    AND l.field_name = 'topic_id'
);

INSERT INTO ${guard}(valid)
SELECT CASE WHEN
  (SELECT COUNT(*)
   FROM question_bank_remediation_log l
   JOIN questions q ON q.id = l.entity_id
   WHERE l.migration_id = ${migrationId}
     AND l.entity_type = 'question'
     AND l.field_name = 'topic_id'
     AND q.topic_id IS l.old_value) = ${expected}
  AND NOT EXISTS (
    SELECT 1 FROM questions q JOIN topics t ON t.id = q.topic_id
    WHERE q.topic_id IS NOT NULL AND q.subject_id IS NOT t.subject_id
  )
THEN 1 ELSE 0 END;

DROP TABLE ${guard};
`;
}

function preflightSql(batches) {
  const migrationIds = batches.map((batch) => sql(batch.migrationId)).join(', ');
  return `-- Read-only post-migration checks for BECE topic remediation 224-236.
SELECT 'bece_total_questions' AS check_name, COUNT(*) AS actual, 1040 AS expected
FROM questions q JOIN subjects s ON s.id = q.subject_id
WHERE s.exam_type_id = 'exam_bece';

SELECT 'bece_null_topics' AS check_name, COUNT(*) AS actual, 0 AS expected
FROM questions q JOIN subjects s ON s.id = q.subject_id
WHERE s.exam_type_id = 'exam_bece' AND q.topic_id IS NULL;

SELECT 'bece_cross_subject_topic_links' AS check_name, COUNT(*) AS actual, 0 AS expected
FROM questions q JOIN subjects s ON s.id = q.subject_id JOIN topics t ON t.id = q.topic_id
WHERE s.exam_type_id = 'exam_bece' AND q.subject_id IS NOT t.subject_id;

SELECT 'bece_remediation_ledger_rows' AS check_name, COUNT(*) AS actual, 1040 AS expected
FROM question_bank_remediation_log
WHERE migration_id IN (${migrationIds});

SELECT s.id AS subject_id, COUNT(*) AS questions, COUNT(q.topic_id) AS topic_bound
FROM subjects s LEFT JOIN questions q ON q.subject_id = s.id
WHERE s.exam_type_id = 'exam_bece'
GROUP BY s.id ORDER BY s.id;

SELECT t.subject_id, t.id AS topic_id, t.name, COUNT(q.id) AS questions
FROM topics t LEFT JOIN questions q ON q.topic_id = t.id
WHERE t.subject_id LIKE 'subj_bece_%'
GROUP BY t.subject_id, t.id, t.name
ORDER BY t.subject_id, t.display_order, t.id;

PRAGMA foreign_key_check;
`;
}

function validate(rows) {
  assert(rows.length === 1040, `Expected 1040 mapped BECE questions, got ${rows.length}`);
  assert(new Set(rows.map((row) => row.id)).size === rows.length, 'Duplicate question IDs in mapping output');
  const db = loadDb();
  try {
    const ownership = new Map(db.prepare('SELECT id, subject_id FROM topics').all().map((row) => [row.id, row.subject_id]));
    for (const topic of NEW_TOPICS) {
      assert(!ownership.has(topic.id), `New topic already exists in canonical fixture: ${topic.id}`);
      ownership.set(topic.id, topic.subjectId);
    }
    for (const row of rows) {
      assert(ownership.get(row.topicId) === row.subject_id, `Cross-subject mapping ${row.id} -> ${row.topicId}`);
      assert(['source-range', 'question-text', 'explanation', 'correct-option', 'manual-override'].includes(row.source), `Unexpected source ${row.source}`);
    }
  } finally {
    db.close();
  }
  const expectedCounts = new Map([
    ['subj_bece_bdt', 80], ['subj_bece_english', 180], ['subj_bece_french', 80], ['subj_bece_ict', 80],
    ['subj_bece_math', 180], ['subj_bece_rme', 80], ['subj_bece_science', 180], ['subj_bece_social', 180],
  ]);
  for (const [subjectId, expected] of expectedCounts) {
    assert(rows.filter((row) => row.subject_id === subjectId).length === expected, `Unexpected ${subjectId} mapping count`);
  }
}

function writeArtifacts() {
  const { mapped, unresolved } = collectMappings();
  assert(unresolved.length === 0, `Cannot generate with ${unresolved.length} unresolved questions`);
  validate(mapped);
  const batches = buildBatches(mapped);
  assert(batches.at(-1).number === 236, `Expected final migration 236, got ${batches.at(-1).number}`);

  fs.mkdirSync(MANIFESTS, { recursive: true });
  fs.writeFileSync(path.join(MIGRATIONS, '224_bece_topic_taxonomy.sql'), taxonomyMigration());
  fs.writeFileSync(path.join(ROLLBACKS, '224_bece_topic_taxonomy.sql'), taxonomyRollback());
  for (const batch of batches) {
    fs.writeFileSync(path.join(MIGRATIONS, batch.fileName), mappingMigration(batch));
    fs.writeFileSync(path.join(ROLLBACKS, batch.fileName), mappingRollback(batch));
  }
  fs.writeFileSync(path.join(PREFLIGHT, '224_236_bece_topic_remediation.sql'), preflightSql(batches));

  const migrationByQuestion = new Map();
  for (const batch of batches) for (const row of batch.rows) migrationByQuestion.set(row.id, batch.fileName);
  const sourceCounts = {};
  for (const row of mapped) sourceCounts[row.source] = (sourceCounts[row.source] ?? 0) + 1;
  const manifest = {
    release: 'bece-topic-remediation-2026-08-26',
    taxonomyMigration: '224_bece_topic_taxonomy.sql',
    questionMigrationRange: [225, 236],
    expectedQuestionCount: 1040,
    unresolvedQuestionCount: 0,
    classifierSourceCounts: sourceCounts,
    newTopics: NEW_TOPICS,
    mappings: mapped.map((row) => ({
      questionId: row.id,
      subjectId: row.subject_id,
      topicId: row.topicId,
      classificationSource: row.source,
      migration: migrationByQuestion.get(row.id),
    })),
  };
  fs.writeFileSync(path.join(MANIFESTS, '224_236_bece_topic_mapping.json'), `${JSON.stringify(manifest, null, 2)}\n`);

  return {
    mappings: mapped.length,
    migrations: ['224_bece_topic_taxonomy.sql', ...batches.map((batch) => batch.fileName)],
    sourceCounts,
  };
}

if (!process.argv.includes('--write')) {
  throw new Error('Refusing to write without --write');
}
console.log(JSON.stringify(writeArtifacts(), null, 2));