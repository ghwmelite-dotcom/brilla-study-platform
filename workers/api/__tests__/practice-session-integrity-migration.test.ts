import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "../../..");
const migration = fs.readFileSync(
  path.join(root, "database/migrations/276_practice_session_integrity.sql"),
  "utf8",
);
const rollback = fs.readFileSync(
  path.join(root, "database/rollbacks/276_practice_session_integrity.sql"),
  "utf8",
);
const preflight = fs.readFileSync(
  path.join(root, "database/preflight/276_practice_session_integrity.sql"),
  "utf8",
);

function database(): Database.Database {
  const db = new Database(":memory:");
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE users (id TEXT PRIMARY KEY);
    CREATE TABLE subjects (id TEXT PRIMARY KEY);
    CREATE TABLE topics (id TEXT PRIMARY KEY, subject_id TEXT NOT NULL REFERENCES subjects(id));
    CREATE TABLE questions (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL REFERENCES subjects(id),
      topic_id TEXT REFERENCES topics(id)
    );
    CREATE TABLE question_attempts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      question_id TEXT NOT NULL REFERENCES questions(id)
    );
    CREATE TABLE practice_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      mode TEXT NOT NULL,
      subject_id TEXT REFERENCES subjects(id),
      topic_id TEXT REFERENCES topics(id),
      questions_count INTEGER DEFAULT 0,
      correct_count INTEGER DEFAULT 0,
      total_time INTEGER DEFAULT 0,
      score INTEGER DEFAULT 0
    );
  `);
  return db;
}

describe("migration 276 practice-session integrity", () => {
  it("preserves existing rows and enforces per-user request and single-attempt ownership", () => {
    const db = database();
    db.exec(`
      INSERT INTO users(id) VALUES ('u1'), ('u2');
      INSERT INTO subjects(id) VALUES ('s1');
      INSERT INTO topics(id, subject_id) VALUES ('t1', 's1');
      INSERT INTO questions(id, subject_id, topic_id) VALUES ('q1', 's1', 't1');
      INSERT INTO question_attempts(id, user_id, question_id) VALUES ('a1', 'u1', 'q1');
      INSERT INTO practice_sessions(id, user_id, mode) VALUES ('legacy', 'u1', 'topic_drill');
    `);

    db.exec(migration);
    expect(
      db.prepare("SELECT id, client_request_id FROM practice_sessions").get(),
    ).toEqual({
      id: "legacy",
      client_request_id: null,
    });

    db.exec(`
      INSERT INTO practice_sessions(id, user_id, mode, client_request_id, request_fingerprint)
      VALUES ('ps1', 'u1', 'topic_drill', 'req1', 'hash1');
      INSERT INTO practice_session_attempts(session_id, attempt_id) VALUES ('ps1', 'a1');
    `);
    expect(() =>
      db.exec(`
      INSERT INTO practice_sessions(id, user_id, mode, client_request_id, request_fingerprint)
      VALUES ('ps2', 'u1', 'topic_drill', 'req1', 'hash2');
    `),
    ).toThrow(/UNIQUE/);
    expect(() =>
      db.exec(`
      INSERT INTO practice_session_attempts(session_id, attempt_id) VALUES ('legacy', 'a1');
    `),
    ).toThrow(/UNIQUE/);

    db.exec(rollback);
    expect(
      db
        .prepare(
          "SELECT COUNT(*) AS count FROM pragma_table_info('practice_sessions') WHERE name = 'client_request_id'",
        )
        .get(),
    ).toEqual({ count: 0 });
  });

  it("flags a linked null-topic question when its session declares a topic", () => {
    const db = database();
    db.exec(`
      INSERT INTO users(id) VALUES ('u1');
      INSERT INTO subjects(id) VALUES ('s1');
      INSERT INTO topics(id, subject_id) VALUES ('t1', 's1');
      INSERT INTO questions(id, subject_id, topic_id) VALUES ('q_null', 's1', NULL);
      INSERT INTO question_attempts(id, user_id, question_id) VALUES ('a_null', 'u1', 'q_null');
      INSERT INTO practice_sessions(id, user_id, mode, subject_id, topic_id)
      VALUES ('ps_topic', 'u1', 'topic_drill', 's1', 't1');
    `);
    db.exec(migration);
    db.exec(`
      INSERT INTO practice_session_attempts(session_id, attempt_id)
      VALUES ('ps_topic', 'a_null');
    `);

    const nullTopicBoundary = preflight
      .split(";")
      .map((statement) => statement.trim())
      .find((statement) => statement.includes("q.topic_id IS NULL"));

    expect(nullTopicBoundary).toBeDefined();
    expect(db.prepare(nullTopicBoundary!).all()).toEqual([
      { session_id: "ps_topic", attempt_id: "a_null" },
    ]);
  });
});
