import { describe, it, expect } from 'vitest';
import { sign } from 'hono/jwt';
import worker from '../index';

type Query = { sql: string; params: unknown[] };

// Row returned for the requireAdmin per-request users lookup.
const ADMIN_ROW = { role: 'admin', status: 'approved', is_active: 1 };
const isAuthLookup = (sql: string) => sql.includes('role, status, is_active FROM users');

const USER_ROW = {
  id: 'user_1',
  email: 'student@test.dev',
  name: 'Test Student',
  role: 'student',
  subjects_taught: '["Integrated Science"]',
};

// D1 stub: records bound queries, returns an admin row for the auth lookup,
// a count for COUNT(*), and one user row for the paginated SELECT.
function createMockDb() {
  const queries: Query[] = [];
  const stmt = (sql: string) => ({
    first: async () => {
      if (isAuthLookup(sql)) return ADMIN_ROW;
      if (sql.includes('COUNT(*)')) return { total: 3 };
      return null;
    },
    all: async () => ({
      results: sql.includes('ORDER BY created_at DESC') ? [USER_ROW] : [],
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

const JWT_SECRET = 'test-secret';

async function adminHeader() {
  const token = await sign(
    { userId: 'admin_1', email: 'admin@test.dev', role: 'admin', exp: Math.floor(Date.now() / 1000) + 3600 },
    JWT_SECRET,
  );
  return { Authorization: `Bearer ${token}` };
}

describe('GET /api/admin/users pagination', () => {
  it('clamps an oversized ?limit to the parseLimit cap (100) and returns the envelope', async () => {
    const { db, queries } = createMockDb();

    const res = await worker.fetch(
      new Request('http://x/api/admin/users?limit=1000000', {
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
    expect(body.data.users[0].subjectsTaught).toEqual(['Integrated Science']);

    const select = queries.find(
      (q) => q.sql.includes('ORDER BY created_at DESC') && q.sql.includes('LIMIT ? OFFSET ?'),
    );
    expect(select).toBeDefined();
    // parseLimit(c, 50) caps at 100 despite ?limit=1000000
    expect(select!.params).toEqual([100, 0]);
  });

  it('rejects non-admin callers', async () => {
    const { db } = createMockDb();
    const res = await worker.fetch(
      new Request('http://x/api/admin/users'),
      { DB: db, JWT_SECRET },
    );
    expect(res.status).toBe(401);
  });
});
