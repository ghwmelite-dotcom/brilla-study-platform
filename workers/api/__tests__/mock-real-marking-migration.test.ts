import { readFileSync } from 'node:fs';
import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';

const migrationSql = readFileSync(
  new URL('../../../database/migrations/361_mock_real_marking.sql', import.meta.url),
  'utf8',
);
const rollbackSql = readFileSync(
  new URL('../../../database/rollbacks/361_mock_real_marking_rollback.sql', import.meta.url),
  'utf8',
);

function buildDb() {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE users (id TEXT PRIMARY KEY);
    CREATE TABLE past_papers (id TEXT PRIMARY KEY);
    CREATE TABLE questions (id TEXT PRIMARY KEY);
    CREATE TABLE paper_attempts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        paper_id TEXT NOT NULL REFERENCES past_papers(id) ON DELETE CASCADE,
        status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'graded', 'completed', 'abandoned')),
        started_at TEXT DEFAULT (datetime('now')),
        time_allowed INTEGER,
        time_used INTEGER,
        submitted_at TEXT,
        total_score INTEGER,
        max_score INTEGER,
        percentage REAL,
        grade TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        is_demo_data INTEGER DEFAULT 0,
        expires_at TEXT
    );
    CREATE INDEX idx_paper_attempts_user ON paper_attempts(user_id);
    CREATE INDEX idx_paper_attempts_paper ON paper_attempts(paper_id);
    CREATE INDEX idx_paper_attempts_status ON paper_attempts(status);
    CREATE INDEX idx_paper_attempts_demo ON paper_attempts(is_demo_data, expires_at);
    CREATE TABLE paper_attempt_answers (
        id TEXT PRIMARY KEY,
        paper_attempt_id TEXT NOT NULL REFERENCES paper_attempts(id) ON DELETE CASCADE,
        question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
        user_answer TEXT,
        is_correct INTEGER,
        time_taken INTEGER,
        marks_earned INTEGER DEFAULT 0,
        answered_at TEXT DEFAULT (datetime('now')),
        is_demo_data INTEGER DEFAULT 0,
        expires_at TEXT,
        UNIQUE(paper_attempt_id, question_id)
    );
    INSERT INTO users (id) VALUES ('user_1');
    INSERT INTO past_papers (id) VALUES ('paper_1');
    INSERT INTO questions (id) VALUES ('q_1');
    INSERT INTO questions (id) VALUES ('q_2');
    INSERT INTO paper_attempts (id, user_id, paper_id, status, time_allowed)
      VALUES ('pa_1', 'user_1', 'paper_1', 'graded', 90);
    -- Prod carries legacy 'completed' rows (pre-marking submit path); the
    -- rebuild must map them to 'graded' or the new CHECK rejects the copy.
    INSERT INTO paper_attempts (id, user_id, paper_id, status)
      VALUES ('pa_legacy', 'user_1', 'paper_1', 'completed');
    INSERT INTO paper_attempt_answers (id, paper_attempt_id, question_id, user_answer, marks_earned)
      VALUES ('paa_1', 'pa_1', 'q_1', 'A', 1);
  `);
  return db;
}

describe('migration 361 mock real marking', () => {
  it('adds marking columns, relaxes the status CHECK, and preserves rows and indexes', () => {
    const db = buildDb();
    try {
      db.exec(migrationSql);

      expect(db.prepare('PRAGMA table_info(paper_attempt_answers)').all())
        .toEqual(expect.arrayContaining([
          expect.objectContaining({ name: 'ai_score' }),
          expect.objectContaining({ name: 'ai_feedback' }),
          expect.objectContaining({ name: 'marking_status' }),
        ]));

      // Relaxed CHECK accepts partially_graded and still rejects junk.
      db.prepare("INSERT INTO paper_attempts (id, user_id, paper_id, status) VALUES ('pa_2', 'user_1', 'paper_1', 'partially_graded')").run();
      expect(() => db.prepare(
        "INSERT INTO paper_attempts (id, user_id, paper_id, status) VALUES ('pa_3', 'user_1', 'paper_1', 'nonsense')",
      ).run()).toThrow();

      // marking_status CHECK: valid lifecycle values in, junk out, NULL allowed.
      db.prepare("INSERT INTO paper_attempt_answers (id, paper_attempt_id, question_id, marking_status) VALUES ('paa_2', 'pa_1', 'q_2', 'pending')").run();
      expect(() => db.prepare(
        "INSERT INTO paper_attempt_answers (id, paper_attempt_id, question_id, marking_status) VALUES ('paa_3', 'pa_1', 'q_2', 'lost')",
      ).run()).toThrow();
      expect(db.prepare('SELECT marking_status FROM paper_attempt_answers WHERE id = ?').get('paa_1'))
        .toEqual({ marking_status: null });

      // Rows preserved through the rebuild.
      expect(db.prepare('SELECT status, time_allowed FROM paper_attempts WHERE id = ?').get('pa_1'))
        .toEqual({ status: 'graded', time_allowed: 90 });

      // Legacy 'completed' rows map to 'graded' during the copy.
      expect(db.prepare('SELECT status FROM paper_attempts WHERE id = ?').get('pa_legacy'))
        .toEqual({ status: 'graded' });

      // Indexes recreated by the rebuild.
      const indexNames = db.prepare(
        "SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'paper_attempts'",
      ).all().map((r) => (r as { name: string }).name);
      expect(indexNames).toEqual(expect.arrayContaining([
        'idx_paper_attempts_user', 'idx_paper_attempts_paper',
        'idx_paper_attempts_status', 'idx_paper_attempts_demo',
      ]));
    } finally {
      db.close();
    }
  });

  it('rollback restores the pre-361 shape', () => {
    const db = buildDb();
    try {
      db.exec(migrationSql);
      db.exec(rollbackSql);

      const columns = db.prepare('PRAGMA table_info(paper_attempt_answers)').all()
        .map((c) => (c as { name: string }).name);
      expect(columns).not.toContain('ai_score');
      expect(columns).not.toContain('ai_feedback');
      expect(columns).not.toContain('marking_status');
      expect(() => db.prepare(
        "INSERT INTO paper_attempts (id, user_id, paper_id, status) VALUES ('pa_9', 'user_1', 'paper_1', 'partially_graded')",
      ).run()).toThrow();
      expect(db.prepare('SELECT status FROM paper_attempts WHERE id = ?').get('pa_1'))
        .toEqual({ status: 'graded' });
    } finally {
      db.close();
    }
  });
});
