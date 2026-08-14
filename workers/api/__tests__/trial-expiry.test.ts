import { describe, it, expect } from 'vitest';
import { sign } from 'hono/jwt';
import { subscriptionsApp } from '../subscriptions';

type Query = { sql: string; params: unknown[] };

// D1 stub routing each query through a handler (same harness as payments.verify.test.ts).
function createMockDb(handler: (sql: string, params: unknown[]) => unknown) {
  const queries: Query[] = [];
  const batches: unknown[][] = [];
  const db = {
    prepare(sql: string) {
      return {
        bind(...params: unknown[]) {
          queries.push({ sql, params });
          const value = handler(sql, params);
          return {
            first: async () => value ?? null,
            all: async () => ({ results: Array.isArray(value) ? value : value ? [value] : [] }),
            run: async () => ({ meta: { changes: 1 } }),
          };
        },
      };
    },
    batch: async (statements: unknown[]) => {
      batches.push(statements);
      return statements.map(() => ({ meta: { changes: 1 } }));
    },
  } as unknown as D1Database;
  return { db, queries, batches };
}

const JWT_SECRET = 'test-secret';

// Row returned for the requireAuth per-request users lookup (Phase 1 auth unification).
const ACTIVE_USER = { role: 'student', status: 'approved', is_active: 1 };
const isAuthLookup = (sql: string) => sql.includes('role, status, is_active, session_version FROM users');

async function authHeader(userId: string) {
  const token = await sign(
    { userId, email: `${userId}@test.dev`, role: 'student', exp: Math.floor(Date.now() / 1000) + 3600 },
    JWT_SECRET,
  );
  return { Authorization: `Bearer ${token}` };
}

describe('POST /subscriptions/trial/check-expiry', () => {
  it('binds a JS ISO now parameter (no datetime(\'now\') against the ISO expires_at column)', async () => {
    const { db, queries } = createMockDb((sql) => {
      if (isAuthLookup(sql)) return ACTIVE_USER;
      if (sql.includes('FROM user_trials')) return [];
      return null;
    });

    const res = await subscriptionsApp.request('/trial/check-expiry', {
      method: 'POST',
      headers: await authHeader('user_1'),
    }, { DB: db, JWT_SECRET });

    expect(res.status).toBe(200);

    const select = queries.find((q) => q.sql.includes('FROM user_trials') && q.sql.includes('expires_at'));
    expect(select).toBeDefined();
    expect(select!.sql).not.toContain("datetime('now')");
    // Single bound parameter: a valid ISO-8601 UTC timestamp
    expect(select!.params).toHaveLength(1);
    expect(select!.params[0]).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it('expires a same-day-expired trial and reports expiredCount', async () => {
    const { db, queries, batches } = createMockDb((sql, params) => {
      if (isAuthLookup(sql)) return ACTIVE_USER;
      if (sql.includes('FROM user_trials') && sql.includes("status = 'active'")) {
        // Real D1 compares expires_at < bound ISO now. Emulate it: only return
        // the trial if its stored ISO expiry really is before the bound param.
        const boundNow = params[0] as string;
        const storedExpiry = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // 1h ago, same UTC day
        return storedExpiry < boundNow ? [{ id: 'trial_1', user_id: 'user_1' }] : [];
      }
      return null;
    });

    const res = await subscriptionsApp.request('/trial/check-expiry', {
      method: 'POST',
      headers: await authHeader('user_1'),
    }, { DB: db, JWT_SECRET });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.expiredCount).toBe(1);
    expect(queries.some((q) =>
      q.sql.includes('UPDATE user_trials') && q.sql.includes("status = 'expired'") && q.params[0] === 'trial_1',
    )).toBe(true);
    // Downgrade write issued for the trial owner
    expect(queries.some((q) =>
      q.sql.includes('UPDATE users') && q.sql.includes('tier_free') && q.params[0] === 'user_1',
    )).toBe(true);
    // Writes go out as a single batch: 1 trial → 2 statements
    expect(batches).toHaveLength(1);
    expect(batches[0]).toHaveLength(2);
  });

  it('requires auth (no verified JWT → 401)', async () => {
    const { db } = createMockDb(() => null);
    const res = await subscriptionsApp.request('/trial/check-expiry', {
      method: 'POST',
    }, { DB: db, JWT_SECRET });
    expect(res.status).toBe(401);
  });
});
