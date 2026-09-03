import { readFileSync } from 'node:fs';
import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';

const MIGRATION = new URL('../../../database/migrations/362_lab_sessions.sql', import.meta.url);
const ROLLBACK = new URL('../../../database/rollbacks/362_lab_sessions_rollback.sql', import.meta.url);

function freshDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  // Minimal users stub so the FK from lab_sessions is enforceable.
  db.exec(`CREATE TABLE users (id TEXT PRIMARY KEY);`);
  db.exec(readFileSync(MIGRATION, 'utf8'));
  return db;
}

describe('migration 362 lab sessions', () => {
  it('creates both tables and all indexes, and is safe to replay', () => {
    const db = freshDb();
    try {
      db.prepare(`INSERT INTO users (id) VALUES ('user_1')`).run();
      db.prepare(
        `INSERT INTO lab_sessions (id, user_id, experiment_slug, mode) VALUES ('sess_1', 'user_1', 'acid-base-titration', 'guided')`,
      ).run();
      db.prepare(
        `INSERT INTO lab_session_events (id, session_id, client_event_id, event_type, payload)
         VALUES ('evt_1', 'sess_1', 'client_1', 'measurement', '{"value":25}')`,
      ).run();

      // Replay: IF NOT EXISTS makes a second application a no-op.
      db.exec(readFileSync(MIGRATION, 'utf8'));

      expect(db.prepare(`SELECT id, status, graded FROM lab_sessions`).get())
        .toEqual({ id: 'sess_1', status: 'in_progress', graded: 0 });
      for (const idx of [
        'idx_lab_sessions_user_created',
        'idx_lab_sessions_user_experiment',
        'idx_lab_session_events_session',
      ]) {
        expect(
          db.prepare(`SELECT name FROM sqlite_master WHERE type='index' AND name=?`).get(idx),
        ).toEqual({ name: idx });
      }
    } finally {
      db.close();
    }
  });

  it('enforces UNIQUE(session_id, client_event_id) for idempotent re-sync', () => {
    const db = freshDb();
    try {
      db.prepare(`INSERT INTO users (id) VALUES ('user_1')`).run();
      db.prepare(
        `INSERT INTO lab_sessions (id, user_id, experiment_slug, mode) VALUES ('sess_1', 'user_1', 'osmosis-cells', 'guided')`,
      ).run();
      const insert = db.prepare(
        `INSERT INTO lab_session_events (id, session_id, client_event_id, event_type, payload)
         VALUES (?, 'sess_1', 'client_dup', 'action', '{}')`,
      );
      insert.run('evt_1');
      expect(() => insert.run('evt_2')).toThrow(/UNIQUE constraint failed/);
      // INSERT OR IGNORE (the worker's write path) silently dedupes instead.
      db.prepare(
        `INSERT OR IGNORE INTO lab_session_events (id, session_id, client_event_id, event_type, payload)
         VALUES ('evt_3', 'sess_1', 'client_dup', 'action', '{}')`,
      ).run();
      expect(
        db.prepare(`SELECT COUNT(*) AS n FROM lab_session_events WHERE client_event_id = 'client_dup'`).get(),
      ).toEqual({ n: 1 });
    } finally {
      db.close();
    }
  });

  it('rejects invalid mode, status, and event_type values', () => {
    const db = freshDb();
    try {
      db.prepare(`INSERT INTO users (id) VALUES ('user_1')`).run();
      expect(() =>
        db.prepare(
          `INSERT INTO lab_sessions (id, user_id, experiment_slug, mode) VALUES ('s1', 'user_1', 'x', 'exam')`,
        ).run(),
      ).toThrow(/CHECK constraint failed/);
      db.prepare(
        `INSERT INTO lab_sessions (id, user_id, experiment_slug, mode) VALUES ('s2', 'user_1', 'x', 'sandbox')`,
      ).run();
      expect(() =>
        db.prepare(`UPDATE lab_sessions SET status = 'deleted' WHERE id = 's2'`).run(),
      ).toThrow(/CHECK constraint failed/);
      expect(() =>
        db.prepare(
          `INSERT INTO lab_session_events (id, session_id, client_event_id, event_type, payload)
           VALUES ('e1', 's2', 'c1', 'teleport', '{}')`,
        ).run(),
      ).toThrow(/CHECK constraint failed/);
    } finally {
      db.close();
    }
  });

  it('cascades deletes from users to sessions and from sessions to events', () => {
    const db = freshDb();
    try {
      db.prepare(`INSERT INTO users (id) VALUES ('user_1')`).run();
      db.prepare(
        `INSERT INTO lab_sessions (id, user_id, experiment_slug, mode) VALUES ('sess_1', 'user_1', 'gas-tests', 'guided')`,
      ).run();
      db.prepare(
        `INSERT INTO lab_session_events (id, session_id, client_event_id, event_type, payload)
         VALUES ('evt_1', 'sess_1', 'c1', 'observation', '{"text":"bubbles"}')`,
      ).run();

      db.prepare(`DELETE FROM lab_sessions WHERE id = 'sess_1'`).run();
      expect(db.prepare(`SELECT COUNT(*) AS n FROM lab_session_events`).get()).toEqual({ n: 0 });

      db.prepare(
        `INSERT INTO lab_sessions (id, user_id, experiment_slug, mode) VALUES ('sess_2', 'user_1', 'gas-tests', 'guided')`,
      ).run();
      db.prepare(`DELETE FROM users WHERE id = 'user_1'`).run();
      expect(db.prepare(`SELECT COUNT(*) AS n FROM lab_sessions`).get()).toEqual({ n: 0 });
    } finally {
      db.close();
    }
  });

  it('rollback drops both tables and all indexes', () => {
    const db = freshDb();
    try {
      db.exec(readFileSync(ROLLBACK, 'utf8'));
      const remaining = db
        .prepare(
          `SELECT name FROM sqlite_master
           WHERE (type = 'table' OR type = 'index') AND name LIKE '%lab_session%'`,
        )
        .all();
      expect(remaining).toEqual([]);
    } finally {
      db.close();
    }
  });
});
