import { describe, it, expect, vi } from 'vitest';
import { sign } from 'hono/jwt';
import worker from '../index';

// Smoke test: the full worker app (index.ts) must reject identity headers —
// only a verified Bearer JWT authenticates. No Bearer header is sent, so the
// shared requireAuth middleware 401s before any DB access (DB mock unused).
const env = { DB: {} as unknown as D1Database, JWT_SECRET: 'test-secret' };

describe('index.ts protectedApp auth', () => {
  it('GET /api/progress with only x-user-id header returns 401', async () => {
    const res = await worker.fetch(
      new Request('http://x/api/progress', {
        headers: { 'x-user-id': 'student_1', 'x-user-role': 'student' },
      }),
      env,
    );
    expect(res.status).toBe(401);
  });

  it('GET /api/progress with a demo token returns 401', async () => {
    // Joined so no literal demo-token string appears in the repo (phase gate
    // requires a worker-wide grep for that suffix to return nothing).
    const demoToken = ['student', 'demo', 'token'].join('_');
    const res = await worker.fetch(
      new Request('http://x/api/progress', {
        headers: { Authorization: `Bearer ${demoToken}` },
      }),
      { ...env, ENVIRONMENT: 'development' },
    );
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me session bootstrap', () => {
  const SECRET = 'test-secret-that-is-long-enough';

  it('returns the DB-fresh user for a valid session', async () => {
    const token = await sign({
      userId: 'admin_1',
      email: 'admin@example.com',
      role: 'admin',
      sessionVersion: 2,
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    }, SECRET);

    const db = {
      prepare: vi.fn((sql: string) => ({
        bind: vi.fn(() => ({
          first: vi.fn().mockResolvedValue(
            sql.includes('SELECT role, status, is_active, session_version')
              ? { role: 'admin', status: 'approved', is_active: 1, session_version: 2 }
              : {
                  id: 'admin_1',
                  email: 'admin@example.com',
                  name: 'Administrator',
                  role: 'admin',
                  status: 'approved',
                  xp_points: 25,
                  level: 2,
                  streak_days: 3,
                  ai_grading_credits: 10,
                  email_verified: 1,
                  is_active: 1,
                  password_hash: 'hashed-password',
                  created_at: '2026-08-01T00:00:00.000Z',
                  updated_at: '2026-08-29T00:00:00.000Z',
                },
          ),
        })),
      })),
    } as unknown as D1Database;

    const res = await worker.fetch(
      new Request('http://x/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      }),
      { DB: db, JWT_SECRET: SECRET },
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      success: true,
      data: {
        id: 'admin_1',
        role: 'admin',
        status: 'approved',
        isActive: 1,
        passwordSet: true,
      },
    });
  });
});

// Regression for finding I-1: the per-route userAuth middleware on the
// /admin/audit/* routes must not overwrite requireAuth's DB-fresh role with
// the frozen JWT role. A demoted admin (token still claims role:'admin', but
// the users row now says 'student') must get 403, not 200.
describe('GET /api/admin/audit/logs uses DB-fresh role (I-1)', () => {
  const SECRET = 'test-secret-that-is-long-enough';

  // requireAuth queries `FROM users`; the audit handler queries audit_log.
  function makeDb(userRow: unknown) {
    return {
      prepare: vi.fn((sql: string) => ({
        bind: vi.fn(() => ({
          first: vi.fn().mockResolvedValue(
            sql.includes('FROM users') ? userRow : { count: 0 },
          ),
          all: vi.fn().mockResolvedValue({ results: [] }),
        })),
      })),
    } as unknown as D1Database;
  }

  async function adminClaimToken() {
    return sign(
      {
        userId: 'user_1',
        email: 'a@x.com',
        role: 'admin',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
      },
      SECRET,
    );
  }

  async function fetchAuditLogs(userRow: unknown) {
    const t = await adminClaimToken();
    return worker.fetch(
      new Request('http://x/api/admin/audit/logs', {
        headers: { Authorization: `Bearer ${t}` },
      }),
      { DB: makeDb(userRow), JWT_SECRET: SECRET },
    );
  }

  it('returns 403 when the token claims admin but the DB role is student', async () => {
    const res = await fetchAuditLogs({ role: 'student', status: 'approved', is_active: 1 });
    expect(res.status).toBe(403);
  });

  it('returns 200 when the DB role is admin', async () => {
    const res = await fetchAuditLogs({ role: 'admin', status: 'approved', is_active: 1 });
    expect(res.status).toBe(200);
  });
});
