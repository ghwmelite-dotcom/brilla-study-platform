import { describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';

const migrationNames = [
  '224_bece_topic_taxonomy.sql',
  '225_bece_topic_bdt.sql',
  '226_bece_topic_english_part_1.sql',
  '227_bece_topic_english_part_2.sql',
  '228_bece_topic_french.sql',
  '229_bece_topic_ict.sql',
  '230_bece_topic_math_part_1.sql',
  '231_bece_topic_math_part_2.sql',
  '232_bece_topic_rme.sql',
  '233_bece_topic_science_part_1.sql',
  '234_bece_topic_science_part_2.sql',
  '235_bece_topic_social_part_1.sql',
  '236_bece_topic_social_part_2.sql',
] as const;

const migrations = migrationNames.map((name) => readFileSync(
  new URL(`../../../database/migrations/${name}`, import.meta.url),
  'utf8',
));
const rollbacks = migrationNames.map((name) => readFileSync(
  new URL(`../../../database/rollbacks/${name}`, import.meta.url),
  'utf8',
));
const schema = readFileSync(new URL('../../../database/schema.sql', import.meta.url), 'utf8');
const seed = readFileSync(new URL('../../../database/seed.sql', import.meta.url), 'utf8');
const topicSeed = readFileSync(
  new URL('../../../database/prod-patches/096_seed_topics_for_empty_subjects.sql', import.meta.url),
  'utf8',
);
const prerequisiteNames = [
  '100_question_bank_integrity.sql',
  '101_atomic_question_allowance.sql',
  '102_nsmq_question_alignment.sql',
  '103_exact_question_deduplication.sql',
] as const;
const prerequisites = prerequisiteNames.map((name) => readFileSync(
  new URL(`../../../database/migrations/${name}`, import.meta.url),
  'utf8',
));
const preflight = readFileSync(
  new URL('../../../database/preflight/224_236_bece_topic_remediation.sql', import.meta.url),
  'utf8',
);
const manifest = JSON.parse(readFileSync(
  new URL('../../../database/manifests/224_236_bece_topic_mapping.json', import.meta.url),
  'utf8',
)) as {
  expectedQuestionCount: number;
  unresolvedQuestionCount: number;
  mappings: Array<{
    questionId: string;
    subjectId: string;
    topicId: string;
    classificationSource: string;
    migration: string;
  }>;
  newTopics: Array<{ id: string; subjectId: string }>;
};

function createFixture(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  db.exec(schema);
  db.exec(seed);
  db.exec(topicSeed);
  for (const prerequisite of prerequisites) db.exec(prerequisite);
  return db;
}

function applyAll(db: Database.Database) {
  for (const migration of migrations) db.exec(migration);
}

function scalar(db: Database.Database, sql: string): number {
  return (db.prepare(sql).get() as { count: number }).count;
}

describe('BECE topic remediation migrations 224-236', () => {
  it.each(migrationNames.map((name, index) => [name, migrations[index]]))(
    'keeps %s below the remote D1 query limit with CRLF and migration ledger SQL',
    (name, sql) => {
      const crlf = sql.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
      const ledger = `\r\nINSERT INTO "d1_migrations" (name) values ('${name}');`;
      expect(Buffer.byteLength(crlf + ledger, 'utf8')).toBeLessThan(19_500);
    },
  );

  it('contains one immutable, same-subject mapping for every null-topic BECE question', () => {
    expect(manifest.expectedQuestionCount).toBe(1040);
    expect(manifest.unresolvedQuestionCount).toBe(0);
    expect(manifest.mappings).toHaveLength(1040);
    expect(new Set(manifest.mappings.map((row) => row.questionId)).size).toBe(1040);
    expect(manifest.mappings.every((row) => migrationNames.includes(row.migration as typeof migrationNames[number]))).toBe(true);
    expect(new Set(manifest.mappings.map((row) => row.classificationSource))).toEqual(new Set([
      'source-range', 'manual-override', 'question-text', 'explanation', 'correct-option',
    ]));

    const counts = new Map<string, number>();
    for (const row of manifest.mappings) counts.set(row.topicId, (counts.get(row.topicId) ?? 0) + 1);
    expect(counts.get('topic_bece_english_summary')).toBe(1);
    expect(counts.get('topic_bece_science_earth_space')).toBe(8);
    expect(counts.get('topic_bece_math_sets') ?? 0).toBe(0);
    expect(counts.get('topic_bece_science_agric') ?? 0).toBe(0);
  });

  it('maps all 1,040 BECE questions, preserves subject boundaries, and is idempotent', () => {
    const db = createFixture();
    expect(scalar(db, `
      SELECT COUNT(*) AS count FROM questions q JOIN subjects s ON s.id = q.subject_id
      WHERE s.exam_type_id = 'exam_bece' AND q.topic_id IS NULL
    `)).toBe(1040);

    applyAll(db);
    expect(scalar(db, `
      SELECT COUNT(*) AS count FROM questions q JOIN subjects s ON s.id = q.subject_id
      WHERE s.exam_type_id = 'exam_bece' AND q.topic_id IS NULL
    `)).toBe(0);
    expect(scalar(db, `
      SELECT COUNT(*) AS count FROM questions q JOIN subjects s ON s.id = q.subject_id
      JOIN topics t ON t.id = q.topic_id
      WHERE s.exam_type_id = 'exam_bece' AND q.subject_id IS t.subject_id
    `)).toBe(1040);
    expect(scalar(db, `
      SELECT COUNT(*) AS count FROM question_bank_remediation_log
      WHERE migration_id LIKE '2%_bece_topic_%'
    `)).toBe(1040);
    expect(scalar(db, `
      SELECT COUNT(*) AS count FROM topics
      WHERE id IN ('topic_bece_french_vocabulary', 'topic_bece_science_methods', 'topic_bece_science_earth_space')
    `)).toBe(3);
    expect(db.pragma('foreign_key_check')).toEqual([]);

    applyAll(db);
    expect(scalar(db, `
      SELECT COUNT(*) AS count FROM question_bank_remediation_log
      WHERE migration_id LIKE '2%_bece_topic_%'
    `)).toBe(1040);
    expect(scalar(db, `
      SELECT COUNT(*) AS count FROM questions q JOIN subjects s ON s.id = q.subject_id
      WHERE s.exam_type_id = 'exam_bece' AND q.topic_id IS NOT NULL
    `)).toBe(1040);
    db.exec(preflight);
    expect(db.pragma('foreign_key_check')).toEqual([]);
    db.close();
  });

  it('rolls question topics and the added taxonomy back in reverse order', () => {
    const db = createFixture();
    const before = db.prepare(`
      SELECT q.id, q.subject_id AS subjectId, q.topic_id AS topicId
      FROM questions q JOIN subjects s ON s.id = q.subject_id
      WHERE s.exam_type_id = 'exam_bece'
      ORDER BY q.id
    `).all();

    applyAll(db);
    for (let index = rollbacks.length - 1; index >= 0; index--) db.exec(rollbacks[index]);

    const after = db.prepare(`
      SELECT q.id, q.subject_id AS subjectId, q.topic_id AS topicId
      FROM questions q JOIN subjects s ON s.id = q.subject_id
      WHERE s.exam_type_id = 'exam_bece'
      ORDER BY q.id
    `).all();
    expect(after).toEqual(before);
    expect(scalar(db, `
      SELECT COUNT(*) AS count FROM topics
      WHERE id IN ('topic_bece_french_vocabulary', 'topic_bece_science_methods', 'topic_bece_science_earth_space')
    `)).toBe(0);
    expect(scalar(db, `
      SELECT COUNT(*) AS count FROM question_bank_remediation_log
      WHERE migration_id LIKE '2%_bece_topic_%'
    `)).toBe(1040);
    expect(db.pragma('foreign_key_check')).toEqual([]);
    db.close();
  });

  it('fails closed when a target question already has a different topic', () => {
    const db = createFixture();
    db.exec(migrations[0]);
    const target = manifest.mappings.find((row) => row.migration === migrationNames[1]);
    expect(target).toBeDefined();
    const wrongTopic = db.prepare(`
      SELECT id FROM topics WHERE subject_id = ? AND id <> ? ORDER BY id LIMIT 1
    `).get(target!.subjectId, target!.topicId) as { id: string };
    db.prepare('UPDATE questions SET topic_id = ? WHERE id = ?').run(wrongTopic.id, target!.questionId);
    expect(() => db.exec(migrations[1])).toThrow();
    db.close();
  });

  it('fails closed when the expected question set has drifted', () => {
    const db = createFixture();
    db.exec(migrations[0]);
    const target = manifest.mappings.find((row) => row.migration === migrationNames[1]);
    expect(target).toBeDefined();
    db.prepare('DELETE FROM questions WHERE id = ?').run(target!.questionId);
    expect(() => db.exec(migrations[1])).toThrow();
    db.close();
  });
});