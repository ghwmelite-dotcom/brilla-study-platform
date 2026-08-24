import { describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';

const migrationSql = readFileSync(
  new URL('../../../database/migrations/100_question_bank_integrity.sql', import.meta.url),
  'utf8',
);
const rollbackSql = readFileSync(
  new URL('../../../database/rollbacks/100_question_bank_integrity.sql', import.meta.url),
  'utf8',
);

const internationalSubjects = [
  ['subj_igcse_physics', 'Physics'],
  ['subj_igcse_chemistry', 'Chemistry'],
  ['subj_igcse_biology', 'Biology'],
  ['subj_igcse_math', 'Mathematics'],
  ['subj_igcse_add_math', 'Additional Mathematics'],
  ['subj_alevel_physics', 'A-Level Physics'],
  ['subj_alevel_chemistry', 'A-Level Chemistry'],
  ['subj_alevel_biology', 'A-Level Biology'],
  ['subj_alevel_math', 'A-Level Mathematics'],
  ['subj_alevel_further_math', 'A-Level Further Mathematics'],
  ['subj_edexcel_igcse_physics', 'Edexcel Physics'],
  ['subj_edexcel_igcse_chemistry', 'Edexcel Chemistry'],
  ['subj_edexcel_igcse_biology', 'Edexcel Biology'],
  ['subj_edexcel_igcse_math', 'Edexcel Mathematics'],
] as const;

function createFixture(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  db.exec(`
    CREATE TABLE exam_types (id TEXT PRIMARY KEY);
    CREATE TABLE subject_categories (
      id TEXT PRIMARY KEY,
      exam_type_id TEXT NOT NULL REFERENCES exam_types(id)
    );
    CREATE TABLE subjects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      exam_type_id TEXT REFERENCES exam_types(id),
      category_id TEXT REFERENCES subject_categories(id),
      waec_code TEXT,
      is_active INTEGER NOT NULL DEFAULT 1
    );
    CREATE TABLE topics (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL REFERENCES subjects(id),
      name TEXT NOT NULL,
      slug TEXT NOT NULL
    );
    CREATE TABLE questions (
      id TEXT PRIMARY KEY,
      topic_id TEXT REFERENCES topics(id),
      subject_id TEXT NOT NULL REFERENCES subjects(id),
      exam_type_id TEXT REFERENCES exam_types(id)
    );

    INSERT INTO exam_types(id) VALUES
      ('igcse'), ('cambridge_a2'), ('edexcel_igcse'), ('exam_wassce');

    INSERT INTO subject_categories(id, exam_type_id) VALUES
      ('cat_igcse_sciences', 'igcse'),
      ('cat_igcse_mathematics', 'igcse'),
      ('cat_alevel_sciences', 'cambridge_a2'),
      ('cat_alevel_mathematics', 'cambridge_a2'),
      ('cat_edexcel_igcse_sciences', 'edexcel_igcse'),
      ('cat_edexcel_igcse_mathematics', 'edexcel_igcse'),
      ('cat_wassce_business', 'exam_wassce'),
      ('cat_wassce_technical', 'exam_wassce');

    INSERT INTO subjects(id, name, slug, exam_type_id, category_id, waec_code) VALUES
      ('subj_wassce_cost_accounting', 'Cost Accounting', 'cost-accounting', NULL, NULL, NULL),
      ('subj_wassce_cost_acct', 'Cost Accounting duplicate', 'wassce-cost-accounting', 'exam_wassce', 'cat_wassce_business', 'CAC'),
      ('subj_wassce_tech_drawing', 'Technical Drawing', 'technical-drawing', NULL, NULL, NULL),
      ('subj_wassce_tech_draw', 'Technical Drawing duplicate', 'wassce-technical-drawing', 'exam_wassce', 'cat_wassce_technical', 'TED'),
      ('subj_wassce_other', 'Other WASSCE', 'other-wassce', 'exam_wassce', NULL, NULL);
  `);

  const insertSubject = db.prepare(
    'INSERT INTO subjects(id, name, slug) VALUES (?, ?, ?)',
  );
  for (const [id, name] of internationalSubjects) {
    insertSubject.run(id, name, id.replaceAll('_', '-'));
  }

  db.exec(`
    INSERT INTO topics(id, subject_id, name, slug) VALUES
      ('topic_old_algebra', 'subj_wassce_other', '  ALGEBRA  ', 'old-algebra'),
      ('topic_math_algebra', 'subj_igcse_math', 'algebra', 'algebra'),
      ('topic_old_motion', 'subj_wassce_other', 'Motion', 'old-motion'),
      ('topic_physics_motion_1', 'subj_igcse_physics', 'motion', 'motion-one'),
      ('topic_physics_motion_2', 'subj_igcse_physics', 'MOTION', 'motion-two'),
      ('topic_old_unmatched', 'subj_wassce_other', 'Ancient topic', 'ancient-topic');

    INSERT INTO questions(id, topic_id, subject_id, exam_type_id) VALUES
      ('q_cost', NULL, 'subj_wassce_cost_accounting', NULL),
      ('q_tech', NULL, 'subj_wassce_tech_drawing', NULL),
      ('q_unique', 'topic_old_algebra', 'subj_igcse_math', NULL),
      ('q_ambiguous', 'topic_old_motion', 'subj_igcse_physics', NULL),
      ('q_unmatched', 'topic_old_unmatched', 'subj_igcse_biology', NULL),
      ('q_preserved', NULL, 'subj_igcse_chemistry', 'igcse'),
      ('q_wassce_null', NULL, 'subj_wassce_other', NULL);
  `);
  return db;
}

function snapshot(db: Database.Database) {
  return {
    subjects: db.prepare(`
      SELECT id, slug, exam_type_id, category_id, waec_code, is_active
      FROM subjects ORDER BY id
    `).all(),
    questions: db.prepare(`
      SELECT id, topic_id, subject_id, exam_type_id
      FROM questions ORDER BY id
    `).all(),
  };
}

describe('migration 100 question-bank integrity', () => {
  it('stays below the remote D1 query limit with a worst-case CRLF checkout', () => {
    const normalizedMigration = migrationSql.replace(/\r\n/g, '\n');
    const crlfMigration = normalizedMigration.replace(/\n/g, '\r\n');
    const migrationLedgerWrite = `
INSERT INTO "d1_migrations" (name)
values ('100_question_bank_integrity.sql');`;

    expect(Buffer.byteLength(crlfMigration + migrationLedgerWrite, 'utf8')).toBeLessThan(19_500);
  });

  it('is deterministic, idempotent, and exactly reversible', () => {
    const db = createFixture();
    const before = snapshot(db);

    db.exec(migrationSql);
    const afterFirstRun = snapshot(db);
    const ledgerCount = (db.prepare(
      'SELECT COUNT(*) AS count FROM question_bank_remediation_log',
    ).get() as { count: number }).count;

    db.exec(migrationSql);
    expect(snapshot(db)).toEqual(afterFirstRun);
    expect((db.prepare('SELECT COUNT(*) AS count FROM question_bank_remediation_log')
      .get() as { count: number }).count).toBe(ledgerCount);

    const mapped = db.prepare(`
      SELECT id, exam_type_id AS examTypeId, category_id AS categoryId
      FROM subjects
      WHERE id LIKE 'subj_igcse_%'
         OR id LIKE 'subj_alevel_%'
         OR id LIKE 'subj_edexcel_igcse_%'
      ORDER BY id
    `).all() as Array<{ id: string; examTypeId: string; categoryId: string }>;
    expect(mapped).toEqual([
      { id: 'subj_alevel_biology', examTypeId: 'cambridge_a2', categoryId: 'cat_alevel_sciences' },
      { id: 'subj_alevel_chemistry', examTypeId: 'cambridge_a2', categoryId: 'cat_alevel_sciences' },
      { id: 'subj_alevel_further_math', examTypeId: 'cambridge_a2', categoryId: 'cat_alevel_mathematics' },
      { id: 'subj_alevel_math', examTypeId: 'cambridge_a2', categoryId: 'cat_alevel_mathematics' },
      { id: 'subj_alevel_physics', examTypeId: 'cambridge_a2', categoryId: 'cat_alevel_sciences' },
      { id: 'subj_edexcel_igcse_biology', examTypeId: 'edexcel_igcse', categoryId: 'cat_edexcel_igcse_sciences' },
      { id: 'subj_edexcel_igcse_chemistry', examTypeId: 'edexcel_igcse', categoryId: 'cat_edexcel_igcse_sciences' },
      { id: 'subj_edexcel_igcse_math', examTypeId: 'edexcel_igcse', categoryId: 'cat_edexcel_igcse_mathematics' },
      { id: 'subj_edexcel_igcse_physics', examTypeId: 'edexcel_igcse', categoryId: 'cat_edexcel_igcse_sciences' },
      { id: 'subj_igcse_add_math', examTypeId: 'igcse', categoryId: 'cat_igcse_mathematics' },
      { id: 'subj_igcse_biology', examTypeId: 'igcse', categoryId: 'cat_igcse_sciences' },
      { id: 'subj_igcse_chemistry', examTypeId: 'igcse', categoryId: 'cat_igcse_sciences' },
      { id: 'subj_igcse_math', examTypeId: 'igcse', categoryId: 'cat_igcse_mathematics' },
      { id: 'subj_igcse_physics', examTypeId: 'igcse', categoryId: 'cat_igcse_sciences' },
    ]);

    expect(db.prepare(
      'SELECT topic_id AS topicId, exam_type_id AS examTypeId FROM questions WHERE id = ?',
    ).get('q_unique')).toEqual({ topicId: 'topic_math_algebra', examTypeId: 'igcse' });
    expect(db.prepare(
      'SELECT topic_id AS topicId FROM questions WHERE id = ?',
    ).get('q_ambiguous')).toEqual({ topicId: null });
    expect(db.prepare(
      'SELECT topic_id AS topicId FROM questions WHERE id = ?',
    ).get('q_unmatched')).toEqual({ topicId: null });
    expect(db.prepare(
      'SELECT exam_type_id AS examTypeId FROM questions WHERE id = ?',
    ).get('q_preserved')).toEqual({ examTypeId: 'igcse' });
    expect(db.prepare(
      'SELECT exam_type_id AS examTypeId FROM questions WHERE id = ?',
    ).get('q_wassce_null')).toEqual({ examTypeId: 'exam_wassce' });
    expect(db.prepare(
      'SELECT exam_type_id AS examTypeId FROM questions WHERE id IN (?, ?) ORDER BY id',
    ).all('q_cost', 'q_tech')).toEqual([
      { examTypeId: 'exam_wassce' },
      { examTypeId: 'exam_wassce' },
    ]);


    expect(db.prepare(
      'SELECT slug, is_active AS isActive FROM subjects WHERE id = ?',
    ).get('subj_wassce_cost_acct')).toEqual({
      slug: 'wassce-cost-accounting--retired-100',
      isActive: 0,
    });
    expect(db.prepare(
      'SELECT exam_type_id AS examTypeId, category_id AS categoryId, waec_code AS waecCode FROM subjects WHERE id = ?',
    ).get('subj_wassce_tech_drawing')).toEqual({
      examTypeId: 'exam_wassce',
      categoryId: 'cat_wassce_technical',
      waecCode: 'TED',
    });

    expect(db.pragma('foreign_key_check')).toEqual([]);
    expect(db.pragma('integrity_check', { simple: true })).toBe('ok');

    db.exec(rollbackSql);
    expect(snapshot(db)).toEqual(before);
    expect(db.pragma('foreign_key_check')).toEqual([]);
    expect(db.pragma('integrity_check', { simple: true })).toBe('ok');
    db.close();
  });

  it('enforces subject/topic/exam relationships after remediation', () => {
    const db = createFixture();
    db.exec(migrationSql);

    expect(() => db.prepare(`
      INSERT INTO questions(id, topic_id, subject_id, exam_type_id)
      VALUES (?, ?, ?, ?)
    `).run('q_bad_topic', 'topic_physics_motion_1', 'subj_igcse_math', 'igcse'))
      .toThrow(/QUESTION_SUBJECT_TOPIC_MISMATCH/);
    expect(() => db.prepare(`
      INSERT INTO questions(id, topic_id, subject_id, exam_type_id)
      VALUES (?, ?, ?, ?)
    `).run('q_bad_exam', 'topic_math_algebra', 'subj_igcse_math', 'exam_wassce'))
      .toThrow(/QUESTION_SUBJECT_EXAM_MISMATCH/);
    expect(() => db.prepare('UPDATE topics SET subject_id = ? WHERE id = ?')
      .run('subj_igcse_physics', 'topic_math_algebra'))
      .toThrow(/TOPIC_SUBJECT_HAS_MISMATCHED_QUESTIONS/);

    db.close();
  });

  it('refuses rollback before mutation when a ledgered field drifted', () => {
    const db = createFixture();
    db.exec(migrationSql);
    db.prepare('UPDATE subjects SET waec_code = ? WHERE id = ?')
      .run('NEW', 'subj_wassce_cost_accounting');
    const beforeRollback = snapshot(db);

    expect(() => db.exec(rollbackSql)).toThrow();
    expect(snapshot(db)).toEqual(beforeRollback);
    expect(db.prepare(`
      SELECT COUNT(*) AS count FROM sqlite_master
      WHERE type = 'trigger' AND name = 'trg_questions_subject_exam_insert'
    `).get()).toEqual({ count: 1 });
    db.close();
  });

  it('refuses rollback before mutation when a retired slug was reused', () => {
    const db = createFixture();
    db.exec(migrationSql);
    db.prepare(`
      INSERT INTO subjects(id, name, slug, exam_type_id, category_id, is_active)
      VALUES (?, ?, ?, ?, ?, 1)
    `).run(
      'subj_post_migration',
      'Later subject',
      'wassce-cost-accounting',
      'exam_wassce',
      'cat_wassce_business',
    );
    const beforeRollback = snapshot(db);

    expect(() => db.exec(rollbackSql)).toThrow();
    expect(snapshot(db)).toEqual(beforeRollback);
    db.close();
  });

  it('fails closed when the reviewed 14-subject allowlist drifts', () => {
    const db = createFixture();
    db.prepare('DELETE FROM subjects WHERE id = ?').run('subj_edexcel_igcse_math');
    expect(() => db.exec(migrationSql)).toThrow();
    db.close();
  });

  it('accepts canonical populated WASSCE subjects already assigned to the correct exam', () => {
    const db = createFixture();
    db.prepare(`
      UPDATE subjects
      SET exam_type_id = 'exam_wassce'
      WHERE id IN ('subj_wassce_cost_accounting', 'subj_wassce_tech_drawing')
    `).run();

    expect(() => db.exec(migrationSql)).not.toThrow();
    expect(db.prepare(`
      SELECT id, exam_type_id AS examTypeId, category_id AS categoryId, waec_code AS waecCode
      FROM subjects
      WHERE id IN ('subj_wassce_cost_accounting', 'subj_wassce_tech_drawing')
      ORDER BY id
    `).all()).toEqual([
      {
        id: 'subj_wassce_cost_accounting',
        examTypeId: 'exam_wassce',
        categoryId: 'cat_wassce_business',
        waecCode: 'CAC',
      },
      {
        id: 'subj_wassce_tech_drawing',
        examTypeId: 'exam_wassce',
        categoryId: 'cat_wassce_technical',
        waecCode: 'TED',
      },
    ]);
    expect(db.prepare(`
      SELECT COUNT(*) AS count
      FROM question_bank_remediation_log
      WHERE entity_id IN ('subj_wassce_cost_accounting', 'subj_wassce_tech_drawing')
        AND field_name = 'exam_type_id'
    `).get()).toEqual({ count: 0 });
    db.close();
  });

  it('fails before mutation when a canonical populated WASSCE subject has the wrong exam', () => {
    const db = createFixture();
    db.prepare('UPDATE subjects SET exam_type_id = ? WHERE id = ?')
      .run('igcse', 'subj_wassce_cost_accounting');
    const before = snapshot(db);

    expect(() => db.exec(migrationSql)).toThrow();
    expect(snapshot(db)).toEqual(before);
    db.close();
  });
  it('fails before mutation when a mapped category belongs to the wrong exam', () => {
    const db = createFixture();
    db.prepare('UPDATE subject_categories SET exam_type_id = ? WHERE id = ?')
      .run('exam_wassce', 'cat_igcse_sciences');
    const before = snapshot(db);

    expect(() => db.exec(migrationSql)).toThrow();
    expect(snapshot(db)).toEqual(before);
    db.close();
  });

  it('fails before mutation when a mapped subject has conflicting metadata', () => {
    const db = createFixture();
    db.prepare('UPDATE subjects SET exam_type_id = ?, category_id = ? WHERE id = ?')
      .run('exam_wassce', 'cat_wassce_business', 'subj_igcse_math');
    const before = snapshot(db);

    expect(() => db.exec(migrationSql)).toThrow();
    expect(snapshot(db)).toEqual(before);
    db.close();
  });

  it('fails before mutation when a mapped subject has a conflicting question exam', () => {
    const db = createFixture();
    db.prepare('UPDATE questions SET exam_type_id = ? WHERE id = ?')
      .run('exam_wassce', 'q_preserved');
    const before = snapshot(db);

    expect(() => db.exec(migrationSql)).toThrow();
    expect(snapshot(db)).toEqual(before);
    db.close();
  });
});
