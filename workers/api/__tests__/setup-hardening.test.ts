import { describe, it, expect, vi } from "vitest";
import worker from "../index";

// Regression tests for the /auth/setup hardening (task 12):
// dedicated SETUP_KEY secret (404 when unset), constant-time key compare,
// 'setup' rate-limit bucket (5/hour), one-shot guard against an existing
// admin, role clamp rejecting 'admin' in caller arrays, and no password
// overwrite of existing users.
const JWT_SECRET = "test-secret-that-is-long-enough";
const SETUP_KEY = "setup-key-for-tests";

interface DbOptions {
  adminCount?: number;
  existingEmails?: string[];
  rateLimitCount?: number;
}

// Minimal D1 mock covering the queries /auth/setup + checkRateLimit make.
// Tracks rate-limit request counts in memory so the 429 test can issue
// real repeated requests.
function makeDb({
  adminCount = 0,
  existingEmails = [],
  rateLimitCount = 0,
}: DbOptions = {}) {
  let rateRequests = rateLimitCount;
  const calls: { sql: string; args: unknown[] }[] = [];
  const db = {
    prepare: vi.fn((sql: string) => {
      const statement = (args: unknown[]) => ({
        first: vi.fn().mockImplementation(() => {
          if (sql.includes("WITH usage(total_requests)")) {
            const maxRequests = Number(args[6]);
            if (rateRequests >= maxRequests) return Promise.resolve(null);
            rateRequests += 1;
            return Promise.resolve({
              request_count: rateRequests,
              total_requests: rateRequests,
            });
          }
          if (sql.includes("COUNT(*) as n FROM users WHERE role = 'admin'")) {
            return Promise.resolve({ n: adminCount });
          }
          if (sql.includes("FROM users WHERE email = ?")) {
            return Promise.resolve(
              existingEmails.includes(args[0] as string)
                ? { id: "existing_1" }
                : null,
            );
          }
          return Promise.resolve(null);
        }),
        all: vi.fn().mockResolvedValue({ results: [] }),
        run: vi.fn().mockImplementation(() => {
          return Promise.resolve({ success: true });
        }),
      });
      return {
        ...statement([]),
        bind: (...args: unknown[]) => {
          calls.push({ sql, args });
          return statement(args);
        },
      };
    }),
  } as unknown as D1Database;
  return { db, calls };
}

function setupRequest(body: unknown) {
  return new Request("http://x/api/auth/setup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const VALID_BODY = {
  setupKey: SETUP_KEY,
  users: [
    {
      email: "teacher@brillaprep.org",
      password: "S3cure!Pass",
      name: "Demo Teacher",
      role: "teacher",
    },
  ],
};

describe("/auth/setup hardening", () => {
  it("returns 404 when SETUP_KEY is not configured (endpoint disabled)", async () => {
    const { db } = makeDb();
    const res = await worker.fetch(setupRequest(VALID_BODY), {
      DB: db,
      JWT_SECRET,
    });
    expect(res.status).toBe(404);
  });

  it("returns 401 for a wrong setup key", async () => {
    const { db } = makeDb();
    const res = await worker.fetch(
      setupRequest({ ...VALID_BODY, setupKey: "wrong-key" }),
      { DB: db, JWT_SECRET, SETUP_KEY },
    );
    expect(res.status).toBe(401);
  });

  it("returns 403 when an admin already exists (one-shot guard)", async () => {
    const { db } = makeDb({ adminCount: 1 });
    const res = await worker.fetch(setupRequest(VALID_BODY), {
      DB: db,
      JWT_SECRET,
      SETUP_KEY,
    });
    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({
      error: "Setup has already been completed",
    });
  });

  it("returns 400 when the users array contains role: 'admin'", async () => {
    const { db } = makeDb();
    const res = await worker.fetch(
      setupRequest({
        setupKey: SETUP_KEY,
        users: [
          {
            email: "a@b.com",
            password: "S3cure!Pass",
            name: "Bad",
            role: "admin",
          },
        ],
      }),
      { DB: db, JWT_SECRET, SETUP_KEY },
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when no users array is supplied (no default credentials)", async () => {
    const { db } = makeDb();
    const res = await worker.fetch(setupRequest({ setupKey: SETUP_KEY }), {
      DB: db,
      JWT_SECRET,
      SETUP_KEY,
    });
    expect(res.status).toBe(400);
  });

  it("creates users and skips existing emails without overwriting passwords", async () => {
    const { db, calls } = makeDb({
      existingEmails: ["teacher@brillaprep.org"],
    });
    const res = await worker.fetch(
      setupRequest({
        setupKey: SETUP_KEY,
        users: [
          {
            email: "teacher@brillaprep.org",
            password: "S3cure!Pass",
            name: "T",
            role: "teacher",
          },
          {
            email: "student@brillaprep.org",
            password: "S3cure!Pass",
            name: "S",
            role: "student",
          },
        ],
      }),
      { DB: db, JWT_SECRET, SETUP_KEY },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.results).toEqual([
      { email: "teacher@brillaprep.org", action: "skipped_exists" },
      { email: "student@brillaprep.org", action: "created" },
    ]);
    // No password update may ever be issued by this endpoint.
    expect(
      calls.some((c) => c.sql.includes("UPDATE users SET password_hash")),
    ).toBe(false);
  });

  it("returns 429 on the 6th attempt within the window", async () => {
    const { db } = makeDb();
    const env = { DB: db, JWT_SECRET, SETUP_KEY };
    for (let i = 0; i < 5; i++) {
      const res = await worker.fetch(setupRequest(VALID_BODY), env);
      expect(res.status).not.toBe(429);
    }
    const res = await worker.fetch(setupRequest(VALID_BODY), env);
    expect(res.status).toBe(429);
  });
});

describe("/auth/test-notification hardening", () => {
  it("rejects requests without an admin JWT (adminKey body check removed)", async () => {
    const { db } = makeDb();
    const res = await worker.fetch(
      new Request("http://x/api/auth/test-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // The old path accepted the raw JWT secret as a body adminKey.
        body: JSON.stringify({ adminKey: JWT_SECRET }),
      }),
      { DB: db, JWT_SECRET, SETUP_KEY },
    );
    expect(res.status).toBe(401);
  });
});
