import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { sign } from "hono/jwt";
import worker from "../index";

const JWT_SECRET = "test-secret-that-is-long-enough";

interface RunnableStatement {
  run(): D1Result;
}

function sqliteD1(sqlite: Database.Database): D1Database {
  return {
    prepare(sql: string) {
      let params: unknown[] = [];
      const statement = {
        bind(...values: unknown[]) {
          params = values;
          return statement;
        },
        first<T>() {
          return (sqlite.prepare(sql).get(...params) as T | undefined) ?? null;
        },
        all<T>() {
          return { results: sqlite.prepare(sql).all(...params) as T[] };
        },
        run() {
          const prepared = sqlite.prepare(sql);
          if (prepared.reader) {
            return {
              success: true,
              results: prepared.all(...params),
              meta: {
                changes: sqlite.prepare("SELECT changes() AS changes").get()
                  .changes,
              },
            } as D1Result;
          }
          const result = prepared.run(...params);
          return {
            success: true,
            meta: { changes: result.changes },
          } as D1Result;
        },
      };
      return statement;
    },
    batch(statements: RunnableStatement[]) {
      return sqlite.transaction(() =>
        statements.map((statement) => statement.run()),
      )();
    },
  } as unknown as D1Database;
}

function createDb(): Database.Database {
  const sqlite = new Database(":memory:");
  sqlite.pragma("foreign_keys = ON");
  sqlite.exec(`
    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL,
      status TEXT NOT NULL,
      is_active INTEGER NOT NULL,
      session_version INTEGER NOT NULL DEFAULT 0,
      subscription_tier_id TEXT,
      subscription_expires_at TEXT,
      trial_expires_at TEXT
    );
    CREATE TABLE exam_types (id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE);
    CREATE TABLE subjects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      exam_type_id TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1
    );
    CREATE TABLE topics (id TEXT PRIMARY KEY, subject_id TEXT NOT NULL, name TEXT NOT NULL);
    CREATE TABLE paper_types (id TEXT PRIMARY KEY, name TEXT NOT NULL);
    CREATE TABLE past_papers (
      id TEXT PRIMARY KEY,
      exam_type_id TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      paper_type_id TEXT NOT NULL,
      year INTEGER NOT NULL,
      title TEXT NOT NULL,
      total_marks INTEGER,
      time_allowed INTEGER,
      is_premium INTEGER DEFAULT 0
    );
    CREATE TABLE questions (
      id TEXT PRIMARY KEY,
      topic_id TEXT,
      subject_id TEXT NOT NULL,
      exam_type_id TEXT,
      past_paper_id TEXT,
      question_text TEXT NOT NULL,
      question_type TEXT NOT NULL,
      options TEXT,
      correct_answer TEXT NOT NULL,
      explanation TEXT,
      difficulty TEXT DEFAULT 'medium',
      points INTEGER DEFAULT 3,
      marks INTEGER DEFAULT 1,
      time_limit INTEGER DEFAULT 30,
      question_number INTEGER,
      section TEXT
    );
    CREATE TABLE daily_usage (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      usage_date TEXT NOT NULL,
      question_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, usage_date)
    );
    CREATE TRIGGER trg_daily_usage_question_limit_insert
    BEFORE INSERT ON daily_usage
    WHEN NEW.question_count < 0 OR NEW.question_count > 10
    BEGIN SELECT RAISE(ABORT, 'DAILY_QUESTION_LIMIT_EXCEEDED'); END;
    CREATE TRIGGER trg_daily_usage_question_limit_update
    BEFORE UPDATE OF question_count ON daily_usage
    WHEN NEW.question_count < 0 OR NEW.question_count > 10
    BEGIN SELECT RAISE(ABORT, 'DAILY_QUESTION_LIMIT_EXCEEDED'); END;
    CREATE TABLE question_attempts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      question_id TEXT NOT NULL,
      user_answer TEXT NOT NULL,
      is_correct INTEGER NOT NULL,
      time_taken INTEGER NOT NULL,
      points_earned INTEGER DEFAULT 0,
      is_demo_data INTEGER DEFAULT 0,
      expires_at TEXT,
      client_request_id TEXT,
      request_fingerprint TEXT
    );
    CREATE UNIQUE INDEX idx_question_attempts_user_client_request
    ON question_attempts(user_id, client_request_id)
    WHERE client_request_id IS NOT NULL;
    CREATE TABLE user_progress (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      topic_id TEXT NOT NULL,
      exam_type_id TEXT,
      questions_attempted INTEGER DEFAULT 0,
      questions_correct INTEGER DEFAULT 0,
      mastery_level REAL DEFAULT 0,
      last_attempt_at TEXT,
      created_at TEXT,
      updated_at TEXT,
      is_demo_data INTEGER DEFAULT 0,
      expires_at TEXT,
      UNIQUE(user_id, topic_id, exam_type_id)
    );
    CREATE TABLE paper_attempts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      paper_id TEXT NOT NULL,
      status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'graded', 'abandoned')),
      started_at TEXT DEFAULT (datetime('now')),
      time_allowed INTEGER,
      time_used INTEGER,
      submitted_at TEXT,
      total_score INTEGER,
      max_score INTEGER,
      percentage REAL,
      is_demo_data INTEGER DEFAULT 0,
      expires_at TEXT
    );
    CREATE TABLE paper_attempt_answers (
      id TEXT PRIMARY KEY,
      paper_attempt_id TEXT NOT NULL,
      question_id TEXT NOT NULL,
      user_answer TEXT,
      is_correct INTEGER,
      time_taken INTEGER,
      marks_earned INTEGER DEFAULT 0,
      answered_at TEXT DEFAULT (datetime('now')),
      is_demo_data INTEGER DEFAULT 0,
      expires_at TEXT,
      UNIQUE(paper_attempt_id, question_id)
    );
    CREATE TABLE rate_limits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      identifier TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      request_count INTEGER NOT NULL,
      window_start TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(identifier, endpoint, window_start)
    );

    INSERT INTO users (id, role, status, is_active) VALUES ('student_1', 'student', 'approved', 1);
    INSERT INTO exam_types (id, slug) VALUES
      ('exam_wassce', 'wassce'),
      ('exam_igcse', 'igcse'),
      ('exam_unknown', 'unknown-board');
    INSERT INTO subjects (id, name, slug, exam_type_id) VALUES
      ('subject_math', 'Core Mathematics', 'wassce-core-mathematics', 'exam_wassce'),
      ('subject_igcse', 'IGCSE Mathematics', 'igcse-mathematics', 'exam_igcse'),
      ('subject_unknown', 'Unknown Mathematics', 'unknown-mathematics', 'exam_unknown');
    INSERT INTO topics (id, subject_id, name) VALUES
      ('topic_math', 'subject_math', 'Arithmetic'),
      ('topic_igcse', 'subject_igcse', 'International Mathematics');
    INSERT INTO paper_types (id, name) VALUES ('paper_type_1', 'Paper 1');
    INSERT INTO past_papers (id, exam_type_id, subject_id, paper_type_id, year, title, total_marks, time_allowed)
    VALUES
      ('paper_1', 'exam_wassce', 'subject_math', 'paper_type_1', 2025, 'Mathematics Paper 1', 10, 60),
      ('paper_2', 'exam_wassce', 'subject_math', 'paper_type_1', 2024, 'Mathematics Paper 2', 10, 60);
    INSERT INTO questions (
      id, topic_id, subject_id, exam_type_id, past_paper_id, question_text,
      question_type, options, correct_answer, explanation, points, marks, question_number, section
    ) VALUES
      ('q_free', 'topic_math', 'subject_math', 'exam_wassce', 'paper_1', 'What is 2 + 2?', 'multiple_choice', '[{"id":"A","text":"3"},{"id":"B","text":"4"}]', '4', 'Two plus two is four.', 3, 2, 1, 'A'),
      ('q_foreign', 'topic_math', 'subject_math', 'exam_wassce', 'paper_2', 'What is 3 + 3?', 'multiple_choice', '["5","6"]', 'B', 'Three plus three is six.', 3, 2, 1, 'A'),
      ('q_igcse', 'topic_igcse', 'subject_igcse', 'exam_igcse', NULL, 'International question', 'short_answer', NULL, 'answer', 'Explanation', 3, 1, 1, 'A'),
      ('q_unknown', NULL, 'subject_unknown', 'exam_unknown', NULL, 'Unknown board question', 'short_answer', NULL, 'answer', 'Explanation', 3, 1, 1, 'A');
    INSERT INTO paper_attempts (id, user_id, paper_id, status, time_allowed)
    VALUES ('attempt_1', 'student_1', 'paper_1', 'in_progress', 60);
  `);
  return sqlite;
}

async function authToken() {
  return sign(
    {
      userId: "student_1",
      role: "student",
      sessionVersion: 0,
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    },
    JWT_SECRET,
  );
}

async function request(db: D1Database, path: string, init: RequestInit = {}) {
  const token = await authToken();
  return worker.fetch(
    new Request(`http://test${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    }),
    { DB: db, JWT_SECRET },
  );
}

describe("question and paper lifecycle against real SQLite constraints", () => {
  let sqlite: Database.Database;
  let db: D1Database;

  beforeEach(() => {
    sqlite = createDb();
    db = sqliteD1(sqlite);
  });

  afterEach(() => sqlite.close());

  it("submits option ID B, records progress, and consumes one allowance atomically", async () => {
    const response = await request(db, "/api/questions/q_free/attempt", {
      method: "POST",
      body: JSON.stringify({
        answer: "B",
        clientRequestId: "lifecycle_answer_success_0001",
      }),
    });
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      data: { isCorrect: boolean; usage: { used: number } };
    };
    expect(body.data.isCorrect).toBe(true);
    expect(body.data.usage.used).toBe(1);
    expect(
      sqlite
        .prepare("SELECT user_answer, is_correct FROM question_attempts")
        .get(),
    ).toEqual({
      user_answer: "B",
      is_correct: 1,
    });
    expect(
      sqlite.prepare("SELECT question_count FROM daily_usage").get(),
    ).toEqual({ question_count: 1 });
  });

  it("rejects malformed answers before quota mutation and rolls quota back when attempt recording fails", async () => {
    const malformed = await request(db, "/api/questions/q_free/attempt", {
      method: "POST",
      body: JSON.stringify({
        answer: { value: "B" },
        clientRequestId: "lifecycle_answer_malformed_001",
      }),
    });
    expect(malformed.status).toBe(400);
    expect(
      sqlite.prepare("SELECT COUNT(*) AS count FROM daily_usage").get(),
    ).toEqual({ count: 0 });

    sqlite.exec(`
      CREATE TRIGGER fail_question_attempt
      BEFORE INSERT ON question_attempts
      BEGIN SELECT RAISE(ABORT, 'ATTEMPT_WRITE_FAILED'); END;
    `);
    const failed = await request(db, "/api/questions/q_free/attempt", {
      method: "POST",
      body: JSON.stringify({
        answer: "B",
        clientRequestId: "lifecycle_answer_failure_0001",
      }),
    });
    expect(failed.status).toBe(500);
    expect(
      sqlite.prepare("SELECT COUNT(*) AS count FROM daily_usage").get(),
    ).toEqual({ count: 0 });
    expect(
      sqlite.prepare("SELECT COUNT(*) AS count FROM question_attempts").get(),
    ).toEqual({ count: 0 });
  });

  it("fails closed at the daily ceiling and excludes unknown exam boards from unfiltered free reads", async () => {
    sqlite
      .prepare(
        `
      INSERT INTO daily_usage (id, user_id, usage_date, question_count)
      VALUES ('usage_1', 'student_1', date('now'), 10)
    `,
      )
      .run();
    const capped = await request(db, "/api/questions/q_free/attempt", {
      method: "POST",
      body: JSON.stringify({
        answer: "B",
        clientRequestId: "lifecycle_answer_capped_00001",
      }),
    });
    expect(capped.status).toBe(403);
    expect(
      sqlite.prepare("SELECT COUNT(*) AS count FROM question_attempts").get(),
    ).toEqual({ count: 0 });

    sqlite.prepare("DELETE FROM daily_usage").run();
    const listing = await request(db, "/api/questions?limit=20");
    expect(listing.status).toBe(200);
    const body = (await listing.json()) as { data: Array<{ id: string }> };
    const ids = body.data.map((question) => question.id);
    expect(ids).toContain("q_free");
    expect(ids).toContain("q_igcse");
    expect(ids).not.toContain("q_unknown");
  });

  it("enforces paper membership, redacts in-progress keys, and grades with canonical columns", async () => {
    const saved = await request(db, "/api/papers/attempts/attempt_1/answer", {
      method: "PUT",
      body: JSON.stringify({
        questionId: "q_free",
        answer: "B",
        timeTaken: 12,
      }),
    });
    expect(saved.status).toBe(200);

    const foreign = await request(db, "/api/papers/attempts/attempt_1/answer", {
      method: "PUT",
      body: JSON.stringify({ questionId: "q_foreign", answer: "B" }),
    });
    expect(foreign.status).toBe(404);
    expect(
      sqlite
        .prepare("SELECT COUNT(*) AS count FROM paper_attempt_answers")
        .get(),
    ).toEqual({ count: 1 });

    const inProgress = await request(
      db,
      "/api/papers/attempts/attempt_1/results",
    );
    expect(inProgress.status).toBe(200);
    const inProgressBody = (await inProgress.json()) as {
      data: { answers: Array<Record<string, unknown>> };
    };
    expect(inProgressBody.data.answers[0].answer_text).toBe("B");
    expect(inProgressBody.data.answers[0]).not.toHaveProperty("correct_answer");
    expect(inProgressBody.data.answers[0]).not.toHaveProperty("explanation");

    const submitted = await request(
      db,
      "/api/papers/attempts/attempt_1/submit",
      {
        method: "POST",
        body: JSON.stringify({ timeUsed: 30 }),
      },
    );
    expect(submitted.status).toBe(200);
    const submittedBody = (await submitted.json()) as {
      data: { status: string; totalScore: number };
    };
    expect(submittedBody.data).toMatchObject({
      status: "graded",
      totalScore: 2,
    });
    expect(
      sqlite
        .prepare("SELECT status, total_score, max_score FROM paper_attempts")
        .get(),
    ).toEqual({
      status: "graded",
      total_score: 2,
      max_score: 10,
    });

    const results = await request(db, "/api/papers/attempts/attempt_1/results");
    expect(results.status).toBe(200);
    const resultsBody = (await results.json()) as {
      data: { answers: Array<Record<string, unknown>> };
    };
    expect(resultsBody.data.answers[0]).toMatchObject({
      paper_attempt_id: "attempt_1",
      user_answer: "B",
      answer_text: "B",
      correct_answer: "4",
      is_correct: 1,
      marks_earned: 2,
    });
  });
});
