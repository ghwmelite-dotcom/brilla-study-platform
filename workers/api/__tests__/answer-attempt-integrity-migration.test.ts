import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "../../..");
const migration = fs.readFileSync(
  path.join(root, "database/migrations/277_answer_attempt_integrity.sql"),
  "utf8",
);
const rollback = fs.readFileSync(
  path.join(root, "database/rollbacks/277_answer_attempt_integrity.sql"),
  "utf8",
);

function database(): Database.Database {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE question_attempts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL
    );
    CREATE TABLE rate_limits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      identifier TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      request_count INTEGER DEFAULT 1,
      window_start TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);
  return db;
}

describe("migration 277 answer-attempt and atomic-rate-limit integrity", () => {
  it("compacts duplicate buckets, normalizes invalid counters, and installs uniqueness", () => {
    const db = database();
    db.exec(`
      INSERT INTO rate_limits (
        identifier, endpoint, request_count, window_start, created_at, updated_at
      ) VALUES
        ('student_1', 'practice-session-save', 2, '2026-08-26T12:00:00.000Z', '2026-08-26 12:00:00', '2026-08-26 12:00:01'),
        ('student_1', 'practice-session-save', 3, '2026-08-26T12:00:00.000Z', '2026-08-26 12:00:02', '2026-08-26 12:00:03'),
        ('student_1', 'practice-session-save', NULL, '2026-08-26T12:00:00.000Z', '2026-08-26 12:00:04', NULL),
        ('student_2', 'practice-session-save', 0, '2026-08-26T12:00:00.000Z', '2026-08-26 12:00:05', '2026-08-26 12:00:06');
    `);

    db.exec(migration);

    expect(
      db
        .prepare(
          `
      SELECT identifier, request_count, created_at, updated_at
      FROM rate_limits ORDER BY identifier
    `,
        )
        .all(),
    ).toEqual([
      {
        identifier: "student_1",
        request_count: 6,
        created_at: "2026-08-26 12:00:00",
        updated_at: "2026-08-26 12:00:03",
      },
      {
        identifier: "student_2",
        request_count: 1,
        created_at: "2026-08-26 12:00:05",
        updated_at: "2026-08-26 12:00:06",
      },
    ]);
    expect(
      db
        .prepare(
          `
      SELECT "unique" AS is_unique
      FROM pragma_index_list('rate_limits')
      WHERE name = 'idx_rate_limits_bucket_unique'
    `,
        )
        .get(),
    ).toEqual({ is_unique: 1 });
    expect(() =>
      db.exec(`
      INSERT INTO rate_limits (identifier, endpoint, request_count, window_start)
      VALUES ('student_1', 'practice-session-save', 1, '2026-08-26T12:00:00.000Z')
    `),
    ).toThrow(/UNIQUE/);

    db.exec(`
      INSERT INTO question_attempts(id, user_id, client_request_id, request_fingerprint)
      VALUES ('a1', 'student_1', 'request_1', 'hash_1');
    `);
    expect(() =>
      db.exec(`
        INSERT INTO question_attempts(id, user_id, client_request_id, request_fingerprint)
        VALUES ('a2', 'student_1', 'request_1', 'hash_2');
      `),
    ).toThrow(/UNIQUE/);
    expect(() =>
      db.exec(`
        INSERT INTO question_attempts(id, user_id, client_request_id, request_fingerprint)
        VALUES ('a3', 'student_2', 'request_1', 'hash_3');
      `),
    ).not.toThrow();
    db.exec(rollback);
    expect(
      db
        .prepare(
          `
      SELECT COUNT(*) AS count FROM pragma_index_list('rate_limits')
      WHERE name = 'idx_rate_limits_bucket_unique'
    `,
        )
        .get(),
    ).toEqual({ count: 0 });
    expect(
      db
        .prepare(
          `SELECT COUNT(*) AS count FROM pragma_table_info('question_attempts')
           WHERE name IN ('client_request_id', 'request_fingerprint')`,
        )
        .get(),
    ).toEqual({ count: 0 });
  });
});
