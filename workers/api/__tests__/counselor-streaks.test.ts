import { describe, it, expect, vi, afterEach } from "vitest";
import { sign } from "hono/jwt";
import { counselorApp } from "../counselor";

// Regression: POST /chat and POST /reports/generate used to query a phantom
// `user_streaks` table that never existed in any schema/migration — both
// endpoints 500'd on every real D1 database. The streak reads now map to
// users.streak_days (current) and subject_streaks.longest_streak (longest).
// This stub mimics real D1: any SQL referencing `user_streaks` throws
// "no such table", so a reintroduction fails loudly instead of passing
// against an over-permissive mock.

const JWT_SECRET = "test-secret-that-is-long-enough";

interface StubOptions {
  role?: string;
}

function makeStrictDb(recordedSql: string[], opts: StubOptions = {}) {
  const role = opts.role ?? "student";

  const first = vi.fn().mockImplementation(async function (this: {
    sql: string;
  }) {
    const sql = this.sql;
    if (sql.includes("WITH usage(total_requests)")) {
      return { request_count: 1, total_requests: 1 };
    }
    if (sql.includes("role, status, is_active")) {
      return { role, status: "approved", is_active: 1 };
    }
    if (sql.includes("streak_days")) {
      return { current_streak: 7, longest_streak: 9 };
    }
    if (sql.includes("FROM users")) {
      return {
        id: "student_1",
        name: "Ama",
        email: "ama@example.com",
        school_level: "SHS",
        year_group: 2,
      };
    }
    return null;
  });

  const prepare = vi.fn().mockImplementation((sql: string) => {
    recordedSql.push(sql);
    const stmt = {
      sql,
      bind: vi.fn(),
      first: null as unknown as ReturnType<typeof vi.fn>,
      all: vi.fn().mockResolvedValue({ results: [] }),
      run: vi.fn().mockResolvedValue({ success: true }),
    };
    if (sql.includes("user_streaks")) {
      // Mimic real D1 behavior for a table that does not exist.
      stmt.first = vi
        .fn()
        .mockRejectedValue(new Error("no such table: user_streaks"));
      stmt.all = vi
        .fn()
        .mockRejectedValue(new Error("no such table: user_streaks"));
      stmt.run = vi
        .fn()
        .mockRejectedValue(new Error("no such table: user_streaks"));
    } else {
      stmt.first = first.bind(stmt) as ReturnType<typeof vi.fn>;
    }
    stmt.bind.mockReturnValue(stmt);
    return stmt;
  });

  return { prepare } as unknown as D1Database;
}

async function token(payload: object) {
  return sign(
    {
      ...payload,
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    },
    JWT_SECRET,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("counselor streak reads (phantom user_streaks regression)", () => {
  it("POST /chat succeeds and never queries user_streaks", async () => {
    const recordedSql: string[] = [];
    const db = makeStrictDb(recordedSql);
    const t = await token({ userId: "student_1", role: "student" });

    // No ANTHROPIC_API_KEY → route falls back to a canned counselor reply.
    const res = await counselorApp.fetch(
      new Request("http://x/chat", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${t}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: "I feel great about my studies" }),
      }),
      { DB: db, JWT_SECRET },
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean };
    expect(body.success).toBe(true);
    expect(recordedSql.some((sql) => sql.includes("user_streaks"))).toBe(false);
  });

  it("POST /reports/generate succeeds and never queries user_streaks", async () => {
    const recordedSql: string[] = [];
    const db = makeStrictDb(recordedSql, { role: "teacher" });
    const t = await token({ userId: "teacher_1", role: "teacher" });

    // generateReportWithClaude calls the Anthropic API via global fetch.
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [
            {
              type: "text",
              text:
                '{"summary":"ok","academicPerformance":{},"wellbeingAssessment":{},' +
                '"keyInsights":[],"recommendations":[],"goals":[],"concernLevel":"none"}',
            },
          ],
        }),
      }),
    );

    const res = await counselorApp.fetch(
      new Request("http://x/reports/generate", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${t}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ studentId: "student_1" }),
      }),
      { DB: db, JWT_SECRET, ANTHROPIC_API_KEY: "test-key" },
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean };
    expect(body.success).toBe(true);
    expect(recordedSql.some((sql) => sql.includes("user_streaks"))).toBe(false);
    // Streak read must come from real tables.
    expect(recordedSql.some((sql) => sql.includes("streak_days"))).toBe(true);
  });
});
