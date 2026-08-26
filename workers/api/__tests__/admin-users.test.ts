import { afterEach, describe, it, expect, vi } from "vitest";
import { sign } from "hono/jwt";
import worker from "../index";

type Query = { sql: string; params: unknown[] };

// Row returned for the requireAdmin per-request users lookup.
const ADMIN_ROW = { role: "admin", status: "approved", is_active: 1 };
const isAuthLookup = (sql: string) =>
  sql.includes("role, status, is_active, session_version FROM users");

const USER_ROW = {
  id: "user_1",
  email: "student@test.dev",
  name: "Test Student",
  role: "student",
  email_verified: 1,
  password_set: 1,
  subjects_taught: '["Integrated Science"]',
};

// D1 stub: records bound queries, returns an admin row for the auth lookup,
// a count for COUNT(*), and one user row for the paginated SELECT.
function createMockDb() {
  const queries: Query[] = [];
  const stmt = (sql: string) => ({
    first: async () => {
      if (isAuthLookup(sql)) return ADMIN_ROW;
      if (sql.includes("COUNT(*)")) return { total: 3 };
      return null;
    },
    all: async () => ({
      results: sql.includes("ORDER BY created_at DESC") ? [USER_ROW] : [],
    }),
    run: async () => ({ meta: { changes: 1 } }),
  });
  const db = {
    prepare(sql: string) {
      return {
        ...stmt(sql),
        bind(...params: unknown[]) {
          queries.push({ sql, params });
          return stmt(sql);
        },
      };
    },
  } as unknown as D1Database;
  return { db, queries };
}

const JWT_SECRET = "test-secret";

async function adminHeader() {
  const token = await sign(
    {
      userId: "admin_1",
      email: "admin@test.dev",
      role: "admin",
      exp: Math.floor(Date.now() / 1000) + 3600,
    },
    JWT_SECRET,
  );
  return { Authorization: `Bearer ${token}` };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("GET /api/admin/users pagination", () => {
  it("clamps an oversized ?limit to the parseLimit cap (100) and returns the envelope", async () => {
    const { db, queries } = createMockDb();

    const res = await worker.fetch(
      new Request("http://x/api/admin/users?limit=1000000", {
        headers: await adminHeader(),
      }),
      { DB: db, JWT_SECRET },
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.total).toBe(3);
    expect(body.data.page).toBe(1);
    expect(body.data.limit).toBe(100);
    expect(Array.isArray(body.data.users)).toBe(true);
    // Per-row JSON.parse behavior preserved
    expect(body.data.users[0].subjectsTaught).toEqual(["Integrated Science"]);
    // The API exposes only a boolean, never the password hash itself.
    expect(body.data.users[0].password_set).toBe(1);
    expect(body.data.users[0]).not.toHaveProperty("password_hash");

    const select = queries.find(
      (q) =>
        q.sql.includes("ORDER BY created_at DESC") &&
        q.sql.includes("LIMIT ? OFFSET ?"),
    );
    expect(select).toBeDefined();
    // parseLimit(c, 50) caps at 100 despite ?limit=1000000
    expect(select!.params).toEqual([100, 0]);
  });

  it("rejects non-admin callers", async () => {
    const { db } = createMockDb();
    const res = await worker.fetch(new Request("http://x/api/admin/users"), {
      DB: db,
      JWT_SECRET,
    });
    expect(res.status).toBe(401);
  });
});

describe("POST /api/admin/users/:id/send-password-reset", () => {
  it("sends a reset link for an already-verified user and stores a one-hour token", async () => {
    const queries: Query[] = [];
    const target = {
      id: "user_1",
      name: "Test Student",
      email: "student@test.dev",
      email_verified: 1,
    };
    const db = {
      prepare(sql: string) {
        const statement = {
          first: async () => {
            if (isAuthLookup(sql)) return ADMIN_ROW;
            if (sql.includes("WITH usage(total_requests)"))
              return { request_count: 1, total_requests: 1 };
            if (sql.includes("SELECT id, name, email FROM users WHERE id = ?"))
              return target;
            return null;
          },
          all: async () => ({ results: [] }),
          run: async () => ({ success: true, meta: { changes: 1 } }),
        };
        return {
          ...statement,
          bind(...params: unknown[]) {
            queries.push({ sql, params });
            return statement;
          },
        };
      },
    } as unknown as D1Database;
    const emailFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "email_1" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", emailFetch);

    const res = await worker.fetch(
      new Request("http://x/api/admin/users/user_1/send-password-reset", {
        method: "POST",
        headers: await adminHeader(),
      }),
      {
        DB: db,
        JWT_SECRET,
        RESEND_API_KEY: "resend-test-key",
        APP_URL: "https://brillaprep.org",
      },
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      success: true,
      data: { message: "Password reset email sent" },
    });
    const tokenWrite = queries.find((query) =>
      query.sql.includes("password_reset_token = ?"),
    );
    expect(tokenWrite).toBeDefined();
    expect(tokenWrite?.params[2]).toBe("user_1");
    expect(emailFetch).toHaveBeenCalledOnce();
    const emailRequest = emailFetch.mock.calls[0][1] as RequestInit;
    const emailBody = JSON.parse(String(emailRequest.body)) as {
      to: string[];
      html: string;
    };
    expect(emailBody.to).toEqual(["student@test.dev"]);
    expect(emailBody.html).toContain(
      "https://brillaprep.org/reset-password?token=",
    );
  });

  it("rejects unauthenticated reset-link requests", async () => {
    const { db } = createMockDb();
    const res = await worker.fetch(
      new Request("http://x/api/admin/users/user_1/send-password-reset", {
        method: "POST",
      }),
      { DB: db, JWT_SECRET },
    );
    expect(res.status).toBe(401);
  });
});
