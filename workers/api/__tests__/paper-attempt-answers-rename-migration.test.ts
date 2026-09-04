import { readFileSync } from 'node:fs';
import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';

const migrationSql = readFileSync(
  new URL('../../../database/migrations/367_paper_attempt_answers_column_rename.sql', import.meta.url),
  'utf8',
);
const rollbackSql = readFileSync(
  new URL('../../../database/rollbacks/367_paper_attempt_answers_column_rename_rollback.sql', import.meta.url),
  'utf8',
);

// Fixture mirrors prod's REAL legacy shape (verified against sqlite_master on
// 2026-09-04): attempt_id / answer_text, no is_demo_data/expires_at, marking
// columns from 361 already applied.
function buildDb() {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE paper_attempts (id TEXT PRIMARY KEY);
    CREATE TABLE questions (id TEXT PRIMARY KEY);
    CREATE TABLE paper_attempt_answers (
        id TEXT PRIMARY KEY,
        attempt_id TEXT NOT NULL,
        question_id TEXT NOT NULL,
        answer_text TEXT,
        is_correct INTEGER,
        time_taken INTEGER,
        marks_earned INTEGER DEFAULT 0,
        answered_at TEXT DEFAULT (datetime('now')),
        ai_score REAL,
        ai_feedback TEXT,
        marking_status TEXT DEFAULT NULL
          CHECK (marking_status IN ('pending', 'graded', 'marking_failed')),
        UNIQUE(attempt_id, question_id)
    );
    CREATE INDEX idx_paper_attempt_answers_question
      ON paper_attempt_answers(question_id);
    INSERT INTO paper_attempts (id) VALUES ('pa_1');
    INSERT INTO questions (id) VALUES ('q_1');
    INSERT INTO questions (id) VALUES ('q_2');
    INSERT INTO paper_attempt_answers (id, attempt_id, question_id, answer_text, is_correct, marks_earned)
      VALUES ('paa_1', 'pa_1', 'q_1', '11/12', 1, 1);
    INSERT INTO paper_attempt_answers (id, attempt_id, question_id, answer_text, marking_status)
      VALUES ('paa_2', 'pa_1', 'q_2', 'Essay answer.', 'pending');
    -- Orphan: prod has 1402 answers whose paper_attempts row was deleted.
    INSERT INTO paper_attempt_answers (id, attempt_id, question_id, answer_text)
      VALUES ('paa_orphan', 'pa_deleted', 'q_1', 'ghost');
  `);
  return db;
}

describe('migration 367 paper_attempt_answers column rename', () => {
  it('renames the legacy columns, preserves rows and marking data, recreates indexes', () => {
    const db = buildDb();
    try {
      db.exec(migrationSql);

      const columns = db.prepare('PRAGMA table_info(paper_attempt_answers)').all()
        .map((c) => (c as { name: string }).name);
      expect(columns).toEqual(expect.arrayContaining([
        'paper_attempt_id', 'user_answer', 'is_demo_data', 'expires_at',
        'ai_score', 'ai_feedback', 'marking_status',
      ]));
      expect(columns).not.toContain('attempt_id');
      expect(columns).not.toContain('answer_text');

      // Rows carry over with values mapped to the new columns.
      expect(db.prepare(
        'SELECT paper_attempt_id, user_answer, is_correct, marks_earned FROM paper_attempt_answers WHERE id = ?',
      ).get('paa_1')).toEqual({ paper_attempt_id: 'pa_1', user_answer: '11/12', is_correct: 1, marks_earned: 1 });
      expect(db.prepare('SELECT marking_status FROM paper_attempt_answers WHERE id = ?').get('paa_2'))
        .toEqual({ marking_status: 'pending' });

      // Orphan rows (parent attempt deleted) are excluded so FK enforcement
      // inside wrangler's migration transaction cannot abort the rebuild.
      expect(db.prepare('SELECT COUNT(*) AS n FROM paper_attempt_answers').get())
        .toEqual({ n: 2 });
      expect(db.prepare('SELECT id FROM paper_attempt_answers WHERE id = ?').get('paa_orphan'))
        .toBeUndefined();

      // Demo columns default honestly.
      expect(db.prepare('SELECT is_demo_data, expires_at FROM paper_attempt_answers WHERE id = ?').get('paa_1'))
        .toEqual({ is_demo_data: 0, expires_at: null });

      // The API's save-answer upsert (new column names) works post-migration.
      db.prepare(`
        INSERT INTO paper_attempt_answers (id, paper_attempt_id, question_id, user_answer, time_taken, is_demo_data, expires_at)
        VALUES ('paa_3', 'pa_1', 'q_1', 'A', 5, 0, NULL)
        ON CONFLICT(paper_attempt_id, question_id) DO UPDATE SET
          user_answer = excluded.user_answer,
          time_taken = excluded.time_taken,
          answered_at = datetime('now')
      `).run();
      expect(db.prepare('SELECT user_answer FROM paper_attempt_answers WHERE id = ?').get('paa_1'))
        .toEqual({ user_answer: 'A' });

      // Indexes recreated by the rebuild.
      const indexNames = db.prepare(
        "SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'paper_attempt_answers'",
      ).all().map((r) => (r as { name: string }).name);
      expect(indexNames).toEqual(expect.arrayContaining([
        'idx_paper_attempt_answers_attempt',
        'idx_paper_attempt_answers_demo',
        'idx_paper_attempt_answers_question',
      ]));
    } finally {
      db.close();
    }
  });

  it('rollback restores the legacy shape with data intact', () => {
    const db = buildDb();
    try {
      db.exec(migrationSql);
      db.exec(rollbackSql);

      const columns = db.prepare('PRAGMA table_info(paper_attempt_answers)').all()
        .map((c) => (c as { name: string }).name);
      expect(columns).toEqual(expect.arrayContaining(['attempt_id', 'answer_text', 'marking_status']));
      expect(columns).not.toContain('paper_attempt_id');
      expect(columns).not.toContain('is_demo_data');
      expect(db.prepare('SELECT attempt_id, answer_text FROM paper_attempt_answers WHERE id = ?').get('paa_1'))
        .toEqual({ attempt_id: 'pa_1', answer_text: '11/12' });
    } finally {
      db.close();
    }
  });
});
