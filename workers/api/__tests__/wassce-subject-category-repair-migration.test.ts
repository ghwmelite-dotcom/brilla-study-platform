import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';

const root = path.resolve(__dirname, '../../..');
const migration = fs.readFileSync(
  path.join(root, 'database/migrations/283_wassce_subject_category_repair.sql'),
  'utf8',
);
const preflight = fs.readFileSync(
  path.join(root, 'database/preflight/283_wassce_subject_category_repair_preflight.sql'),
  'utf8',
);
const postflight = fs.readFileSync(
  path.join(root, 'database/preflight/283_wassce_subject_category_repair_postflight.sql'),
  'utf8',
);

const assignments = [
  ['subj_wassce_biology', 'cat_wassce_science'],
  ['subj_wassce_chemistry', 'cat_wassce_science'],
  ['subj_wassce_crs', 'cat_wassce_arts'],
  ['subj_wassce_core_math', 'cat_wassce_core'],
  ['subj_wassce_economics', 'cat_wassce_business'],
  ['subj_wassce_elect_math', 'cat_wassce_science'],
  ['subj_wassce_english', 'cat_wassce_core'],
  ['subj_wassce_accounting', 'cat_wassce_business'],
  ['subj_wassce_foods', 'cat_wassce_technical'],
  ['subj_wassce_french', 'cat_wassce_arts'],
  ['subj_wassce_geography', 'cat_wassce_arts'],
  ['subj_wassce_government', 'cat_wassce_arts'],
  ['subj_wassce_history', 'cat_wassce_arts'],
  ['subj_wassce_ict', 'cat_wassce_technical'],
  ['subj_wassce_int_science', 'cat_wassce_core'],
  ['subj_wassce_literature', 'cat_wassce_arts'],
  ['subj_wassce_physics', 'cat_wassce_science'],
  ['subj_wassce_social', 'cat_wassce_core'],
  ['subj_wassce_twi', 'cat_wassce_languages'],
] as const;

function database(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  db.exec(`
    CREATE TABLE subject_categories (
      id TEXT PRIMARY KEY,
      exam_type_id TEXT NOT NULL
    );
    CREATE TABLE subjects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      exam_type_id TEXT,
      category_id TEXT REFERENCES subject_categories(id),
      is_active INTEGER DEFAULT 1
    );
    CREATE TABLE question_bank_remediation_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      migration_id TEXT NOT NULL,
      entity_type TEXT NOT NULL CHECK (entity_type IN ('subject', 'question')),
      entity_id TEXT NOT NULL,
      field_name TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      changed_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (migration_id, entity_type, entity_id, field_name)
    );
  `);

  const insertCategory = db.prepare(
    'INSERT INTO subject_categories(id, exam_type_id) VALUES (?, ?)',
  );
  for (const id of [
    'cat_wassce_core',
    'cat_wassce_science',
    'cat_wassce_business',
    'cat_wassce_arts',
    'cat_wassce_technical',
    'cat_wassce_languages',
  ]) {
    insertCategory.run(id, 'exam_wassce');
  }

  const insertSubject = db.prepare(`
    INSERT INTO subjects(id, name, exam_type_id, category_id, is_active)
    VALUES (?, ?, 'exam_wassce', ?, 1)
  `);
  assignments.forEach(([subjectId], index) => {
    insertSubject.run(subjectId, subjectId, index === 0 ? 'cat_wassce_science' : null);
  });

  return db;
}

function queryResults(db: Database.Database, sql: string): unknown[][] {
  return sql
    .replace(/^--.*$/gm, '')
    .split(';')
    .map((statement) => statement.trim())
    .filter((statement) => /^(WITH|SELECT|PRAGMA)/i.test(statement))
    .map((statement) => db.prepare(statement).all());
}

describe('migration 283 WASSCE subject category repair', () => {
  it('repairs every missing canonical assignment and passes both flight gates', () => {
    const db = database();

    expect(queryResults(db, preflight)).toEqual([[], [], [], []]);
    db.exec(migration);

    const actual = db
      .prepare('SELECT id, category_id AS categoryId FROM subjects ORDER BY id')
      .all();
    const expected = assignments
      .map(([id, categoryId]) => ({ id, categoryId }))
      .sort((left, right) => left.id.localeCompare(right.id));
    expect(actual).toEqual(expected);
    expect(queryResults(db, postflight)).toEqual([[], [], [], []]);
    expect(
      db.prepare(`
        SELECT COUNT(*) AS count
        FROM question_bank_remediation_log
        WHERE migration_id = '283_wassce_subject_category_repair'
      `).get(),
    ).toEqual({ count: 18 });
    expect(db.pragma('foreign_key_check')).toEqual([]);

    db.exec(migration);
    expect(queryResults(db, postflight)).toEqual([[], [], [], []]);
    expect(
      db.prepare(`
        SELECT COUNT(*) AS count
        FROM question_bank_remediation_log
        WHERE migration_id = '283_wassce_subject_category_repair'
      `).get(),
    ).toEqual({ count: 18 });

    db.close();
  });

  it('fails closed without mutation when a canonical subject has a conflicting category', () => {
    const db = database();
    db.prepare(
      "UPDATE subjects SET category_id = 'cat_wassce_business' WHERE id = 'subj_wassce_physics'",
    ).run();

    expect(() => db.exec(migration)).toThrow(/CHECK constraint failed/);
    expect(
      db.prepare("SELECT category_id AS categoryId FROM subjects WHERE id = 'subj_wassce_physics'").get(),
    ).toEqual({ categoryId: 'cat_wassce_business' });
    expect(db.prepare('SELECT COUNT(*) AS count FROM question_bank_remediation_log').get()).toEqual({ count: 0 });

    db.close();
  });

  it('fails closed when an additional active WASSCE subject is uncategorized', () => {
    const db = database();
    db.prepare(`
      INSERT INTO subjects(id, name, exam_type_id, category_id, is_active)
      VALUES ('subj_wassce_unmapped', 'Unmapped', 'exam_wassce', NULL, 1)
    `).run();

    expect(() => db.exec(migration)).toThrow(/CHECK constraint failed/);
    expect(
      db.prepare("SELECT category_id AS categoryId FROM subjects WHERE id = 'subj_wassce_chemistry'").get(),
    ).toEqual({ categoryId: null });
    expect(db.prepare('SELECT COUNT(*) AS count FROM question_bank_remediation_log').get()).toEqual({ count: 0 });

    db.close();
  });

  it('fails closed before mutation when a required WASSCE category is absent', () => {
    const db = database();
    db.pragma('foreign_keys = OFF');
    db.prepare("DELETE FROM subject_categories WHERE id = 'cat_wassce_languages'").run();
    db.pragma('foreign_keys = ON');

    expect(queryResults(db, preflight)[0]).toEqual([
      { category_id: 'cat_wassce_languages', exam_type_id: null },
    ]);
    expect(() => db.exec(migration)).toThrow(/CHECK constraint failed/);
    expect(
      db.prepare("SELECT category_id AS categoryId FROM subjects WHERE id = 'subj_wassce_twi'").get(),
    ).toEqual({ categoryId: null });
    expect(db.prepare('SELECT COUNT(*) AS count FROM question_bank_remediation_log').get()).toEqual({ count: 0 });

    db.close();
  });
});
