import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "../../..");
const migration = fs.readFileSync(
  path.join(root, "database/migrations/282_battle_demo_data_integrity.sql"),
  "utf8",
);
const rollback = fs.readFileSync(
  path.join(
    root,
    "database/rollbacks/282_battle_demo_data_integrity_rollback.sql",
  ),
  "utf8",
);
const preflight = fs.readFileSync(
  path.join(
    root,
    "database/preflight/282_battle_demo_data_integrity_preflight.sql",
  ),
  "utf8",
);
const postflight = fs.readFileSync(
  path.join(
    root,
    "database/preflight/282_battle_demo_data_integrity_postflight.sql",
  ),
  "utf8",
);

function database(): Database.Database {
  const db = new Database(":memory:");
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE users (id TEXT PRIMARY KEY);
    CREATE TABLE subjects (id TEXT PRIMARY KEY);
    CREATE TABLE battles (
      id TEXT PRIMARY KEY,
      challenger_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      opponent_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'completed', 'cancelled')),
      subject_id TEXT REFERENCES subjects(id),
      difficulty TEXT DEFAULT 'medium',
      question_count INTEGER DEFAULT 10,
      questions TEXT,
      challenger_score INTEGER DEFAULT 0,
      opponent_score INTEGER DEFAULT 0,
      current_question INTEGER DEFAULT 0,
      winner_id TEXT REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now')),
      started_at TEXT,
      completed_at TEXT
    );
    CREATE TABLE battle_answers (
      id TEXT PRIMARY KEY,
      battle_id TEXT NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      question_index INTEGER NOT NULL,
      answer TEXT,
      is_correct INTEGER,
      time_taken INTEGER,
      points_earned INTEGER DEFAULT 0,
      answered_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX idx_battles_status ON battles(status);
    CREATE INDEX idx_battles_challenger ON battles(challenger_id);
    CREATE INDEX idx_battles_opponent ON battles(opponent_id);
    CREATE INDEX idx_battle_answers_battle ON battle_answers(battle_id);

    INSERT INTO users(id) VALUES ('student_1'), ('demo_student_1');
    INSERT INTO subjects(id) VALUES ('subject_1');
    INSERT INTO battles(id, challenger_id, subject_id) VALUES ('legacy_battle', 'student_1', 'subject_1');
    INSERT INTO battle_answers(id, battle_id, user_id, question_index)
    VALUES ('legacy_answer', 'legacy_battle', 'student_1', 0);
  `);
  return db;
}

function queryResults(db: Database.Database, sql: string): unknown[][] {
  return sql
    .replace(/^--.*$/gm, "")
    .split(";")
    .map((statement) => statement.trim())
    .filter((statement) => /^(WITH|SELECT|PRAGMA)/i.test(statement))
    .map((statement) => db.prepare(statement).all());
}

describe("migration 282 battle demo-data integrity", () => {
  it("adds the exact route columns, preserves legacy rows, and passes both flight gates", () => {
    const db = database();

    expect(queryResults(db, preflight)).toEqual([[], [], [], []]);
    db.exec(migration);

    expect(
      db.prepare("SELECT id, is_demo_data, expires_at FROM battles").all(),
    ).toEqual([{ id: "legacy_battle", is_demo_data: 0, expires_at: null }]);
    expect(
      db
        .prepare("SELECT id, is_demo_data, expires_at FROM battle_answers")
        .all(),
    ).toEqual([{ id: "legacy_answer", is_demo_data: 0, expires_at: null }]);
    expect(queryResults(db, postflight)).toEqual([[], [], [], []]);
    expect(db.pragma("foreign_key_check")).toEqual([]);

    expect(() =>
      db.exec(`
        INSERT INTO battles(id, challenger_id, is_demo_data)
        VALUES ('invalid_flag', 'student_1', 2)
      `),
    ).toThrow(/CHECK/);

    db.close();
  });

  it("indexes the exact cleanup predicates and removes only expired demo rows", () => {
    const db = database();
    db.exec(migration);
    db.exec(`
      INSERT INTO battles(id, challenger_id, subject_id, is_demo_data, expires_at)
      VALUES
        ('expired_demo', 'demo_student_1', 'subject_1', 1, '2026-08-26T00:00:00.000Z'),
        ('future_demo', 'demo_student_1', 'subject_1', 1, '2026-08-28T00:00:00.000Z'),
        ('real_battle', 'student_1', 'subject_1', 0, NULL);
      INSERT INTO battle_answers(
        id, battle_id, user_id, question_index, is_demo_data, expires_at
      ) VALUES
        ('expired_answer', 'future_demo', 'demo_student_1', 0, 1, '2026-08-26T00:00:00.000Z'),
        ('future_answer', 'future_demo', 'demo_student_1', 1, 1, '2026-08-28T00:00:00.000Z'),
        ('real_answer', 'real_battle', 'student_1', 0, 0, NULL);
    `);

    const battlePlan = db
      .prepare(
        `
        EXPLAIN QUERY PLAN
        DELETE FROM battles
        WHERE is_demo_data = 1 AND expires_at IS NOT NULL AND expires_at < ?
      `,
      )
      .all("2026-08-27T00:00:00.000Z") as Array<{ detail: string }>;
    const answerPlan = db
      .prepare(
        `
        EXPLAIN QUERY PLAN
        DELETE FROM battle_answers
        WHERE is_demo_data = 1 AND expires_at IS NOT NULL AND expires_at < ?
      `,
      )
      .all("2026-08-27T00:00:00.000Z") as Array<{ detail: string }>;

    expect(
      battlePlan.some((row) => row.detail.includes("idx_battles_demo")),
    ).toBe(true);
    expect(
      answerPlan.some((row) => row.detail.includes("idx_battle_answers_demo")),
    ).toBe(true);

    db.prepare(
      `
      DELETE FROM battle_answers
      WHERE is_demo_data = 1 AND expires_at IS NOT NULL AND expires_at < ?
    `,
    ).run("2026-08-27T00:00:00.000Z");
    db.prepare(
      `
      DELETE FROM battles
      WHERE is_demo_data = 1 AND expires_at IS NOT NULL AND expires_at < ?
    `,
    ).run("2026-08-27T00:00:00.000Z");

    expect(db.prepare("SELECT id FROM battles ORDER BY id").all()).toEqual([
      { id: "future_demo" },
      { id: "legacy_battle" },
      { id: "real_battle" },
    ]);
    expect(
      db.prepare("SELECT id FROM battle_answers ORDER BY id").all(),
    ).toEqual([
      { id: "future_answer" },
      { id: "legacy_answer" },
      { id: "real_answer" },
    ]);

    db.close();
  });

  it("rolls back the additive schema without losing pre-existing battle data", () => {
    const db = database();
    const beforeBattles = db.pragma("table_info('battles')");
    const beforeAnswers = db.pragma("table_info('battle_answers')");

    db.exec(migration);
    db.exec(rollback);

    expect(db.pragma("table_info('battles')")).toEqual(beforeBattles);
    expect(db.pragma("table_info('battle_answers')")).toEqual(beforeAnswers);
    expect(db.prepare("SELECT id FROM battles").all()).toEqual([
      { id: "legacy_battle" },
    ]);
    expect(db.prepare("SELECT id FROM battle_answers").all()).toEqual([
      { id: "legacy_answer" },
    ]);
    expect(db.pragma("foreign_key_check")).toEqual([]);

    db.close();
  });
});
