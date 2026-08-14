import { describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';

const migrationSql = readFileSync(
  new URL('../../../database/migrations/095_guidance_subject_exam_types.sql', import.meta.url),
  'utf8',
);

describe('migration 095 guidance subject compatibility', () => {
  it('backfills only canonical null WASSCE and BECE associations and is idempotent', () => {
    const db = new Database(':memory:');
    db.exec(`
      PRAGMA foreign_keys = ON;
      CREATE TABLE exam_types (id TEXT PRIMARY KEY);
      CREATE TABLE subjects (
        id TEXT PRIMARY KEY,
        exam_type_id TEXT REFERENCES exam_types(id)
      );
      INSERT INTO exam_types (id) VALUES ('exam_wassce'), ('exam_bece'), ('other_exam');
      INSERT INTO subjects (id, exam_type_id) VALUES
        ('subj_wassce_core_math', NULL),
        ('subj_wassce_english', 'other_exam'),
        ('subj_bece_math', NULL),
        ('subj_alevel_math', NULL),
        ('custom_subject', NULL);
    `);

    db.exec(migrationSql);
    db.exec(migrationSql);

    const rows = db.prepare('SELECT id, exam_type_id AS examTypeId FROM subjects ORDER BY id').all();
    expect(rows).toEqual([
      { id: 'custom_subject', examTypeId: null },
      { id: 'subj_alevel_math', examTypeId: null },
      { id: 'subj_bece_math', examTypeId: 'exam_bece' },
      { id: 'subj_wassce_core_math', examTypeId: 'exam_wassce' },
      { id: 'subj_wassce_english', examTypeId: 'other_exam' },
    ]);
    db.close();
  });
});