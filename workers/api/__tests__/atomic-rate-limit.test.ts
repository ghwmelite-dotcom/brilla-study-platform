import Database from "better-sqlite3";
import { afterEach, describe, expect, it, vi } from "vitest";

import { checkRateLimit } from "../rate-limit";

function rateLimitDatabase(): Database.Database {
  const database = new Database(":memory:");
  database.exec(`
    CREATE TABLE rate_limits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      identifier TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      request_count INTEGER DEFAULT 1,
      window_start TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE UNIQUE INDEX idx_rate_limits_bucket_unique
    ON rate_limits(identifier, endpoint, window_start);
  `);
  return database;
}

function sqliteD1(database: Database.Database): D1Database {
  return {
    prepare(sql: string) {
      let bindings: unknown[] = [];
      const statement = {
        bind(...values: unknown[]) {
          bindings = values;
          return statement;
        },
        async first<T>() {
          return (
            (database.prepare(sql).get(...bindings) as T | undefined) ?? null
          );
        },
      };
      return statement;
    },
  } as unknown as D1Database;
}

describe("atomic shared rate limiter", () => {
  const databases: Database.Database[] = [];

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    for (const database of databases.splice(0)) database.close();
  });

  it("allows exactly the cap under concurrent requests and never over-increments", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-26T12:00:30.000Z"));
    const database = rateLimitDatabase();
    databases.push(database);
    const db = sqliteD1(database);
    const config = {
      maxRequests: 30,
      windowMs: 60_000,
      failureMode: "closed" as const,
    };

    const results = await Promise.all(
      Array.from({ length: 64 }, () =>
        checkRateLimit(db, "student_1", "practice-session-save", config),
      ),
    );

    expect(results.filter(({ allowed }) => allowed)).toHaveLength(30);
    expect(
      results.filter(({ reason }) => reason === "limit_exceeded"),
    ).toHaveLength(34);
    expect(
      database
        .prepare(
          `
      SELECT COUNT(*) AS rows, SUM(request_count) AS requests
      FROM rate_limits
      WHERE identifier = 'student_1' AND endpoint = 'practice-session-save'
    `,
        )
        .get(),
    ).toEqual({ rows: 1, requests: 30 });
  });

  it("enforces the rolling total across adjacent buckets", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-26T12:01:10.000Z"));
    const database = rateLimitDatabase();
    databases.push(database);
    database
      .prepare(
        `
      INSERT INTO rate_limits (identifier, endpoint, request_count, window_start)
      VALUES (?, ?, ?, ?)
    `,
      )
      .run(
        "student_1",
        "practice-session-save",
        29,
        "2026-08-26T12:00:30.000Z",
      );
    const db = sqliteD1(database);
    const config = {
      maxRequests: 30,
      windowMs: 60_000,
      failureMode: "closed" as const,
    };

    await expect(
      checkRateLimit(db, "student_1", "practice-session-save", config),
    ).resolves.toMatchObject({
      allowed: true,
      remaining: 0,
    });
    await expect(
      checkRateLimit(db, "student_1", "practice-session-save", config),
    ).resolves.toMatchObject({
      allowed: false,
      reason: "limit_exceeded",
    });
    expect(
      database
        .prepare(
          `
      SELECT SUM(request_count) AS requests FROM rate_limits
      WHERE identifier = 'student_1' AND endpoint = 'practice-session-save'
    `,
        )
        .get(),
    ).toEqual({ requests: 30 });
  });

  it("does not reset the cap at the former full-window boundary", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-26T12:00:59.900Z"));
    const database = rateLimitDatabase();
    databases.push(database);
    const db = sqliteD1(database);
    const config = {
      maxRequests: 30,
      windowMs: 60_000,
      failureMode: "closed" as const,
    };

    const initial = await Promise.all(
      Array.from({ length: 30 }, () =>
        checkRateLimit(db, "student_1", "practice-session-save", config),
      ),
    );
    expect(initial.every(({ allowed }) => allowed)).toBe(true);

    vi.setSystemTime(new Date("2026-08-26T12:01:00.100Z"));
    await expect(
      checkRateLimit(db, "student_1", "practice-session-save", config),
    ).resolves.toMatchObject({
      allowed: false,
      remaining: 0,
      reason: "limit_exceeded",
    });
  });
  it("isolates counters by identifier and endpoint", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-26T12:00:30.000Z"));
    const database = rateLimitDatabase();
    databases.push(database);
    const db = sqliteD1(database);
    const config = {
      maxRequests: 2,
      windowMs: 60_000,
      failureMode: "closed" as const,
    };

    expect(
      (await checkRateLimit(db, "student_1", "write-a", config)).allowed,
    ).toBe(true);
    expect(
      (await checkRateLimit(db, "student_1", "write-a", config)).allowed,
    ).toBe(true);
    expect(
      (await checkRateLimit(db, "student_1", "write-a", config)).allowed,
    ).toBe(false);
    expect(
      (await checkRateLimit(db, "student_2", "write-a", config)).allowed,
    ).toBe(true);
    expect(
      (await checkRateLimit(db, "student_1", "write-b", config)).allowed,
    ).toBe(true);
  });

  it("distinguishes fail-closed backend unavailability from degraded fail-open behavior", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const unavailable = {
      prepare() {
        throw new Error("D1 unavailable");
      },
    } as unknown as D1Database;

    await expect(
      checkRateLimit(unavailable, "student_1", "practice-session-save", {
        maxRequests: 30,
        windowMs: 60_000,
        failureMode: "closed",
      }),
    ).resolves.toMatchObject({
      allowed: false,
      remaining: 0,
      retryAfter: 30,
      reason: "backend_unavailable",
    });

    await expect(
      checkRateLimit(unavailable, "student_1", "question-read", {
        maxRequests: 120,
        windowMs: 60_000,
        failureMode: "open",
      }),
    ).resolves.toMatchObject({
      allowed: true,
      remaining: 120,
      degraded: true,
    });
  });
});
