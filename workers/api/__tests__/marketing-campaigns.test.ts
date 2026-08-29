import { afterEach, describe, expect, it, vi } from 'vitest';
import { sign } from 'hono/jwt';
import worker from '../index';

const JWT_SECRET = 'marketing-test-secret';

async function authHeader(role: 'student' | 'admin' = 'student') {
  const token = await sign({
    userId: `${role}-1`,
    role,
    sessionVersion: 0,
    exp: Math.floor(Date.now() / 1000) + 3600,
  }, JWT_SECRET);
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

function mockDb(role: 'student' | 'admin' = 'student') {
  const authRow = { role, status: 'approved', is_active: 1, session_version: 0 };
  const marketingUser = {
    id: `${role}-1`,
    name: role === 'admin' ? 'Admin One' : 'Student One',
    email: `${role}@example.com`,
    role,
    email_verified: 1,
    status: 'approved',
    is_active: 1,
    is_demo: 0,
  };
  const statement = (sql: string) => ({
    bind: (..._params: unknown[]) => statement(sql),
    first: async () => {
      if (sql.includes('role, status, is_active, session_version FROM users')) return authRow;
      if (sql.includes('SELECT id, name, email, role, email_verified')) return marketingUser;
      return null;
    },
    all: async () => ({ results: [] }),
    run: async () => ({ success: true, meta: { changes: 1 } }),
  });
  return {
    prepare: (sql: string) => statement(sql),
    batch: async (statements: unknown[]) => statements.map(() => ({ success: true, meta: { changes: 1 } })),
  } as unknown as D1Database;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('referral marketing boundaries', () => {
  it('requires authentication for preference reads', async () => {
    const response = await worker.fetch(
      new Request('http://x/api/marketing/preferences'),
      { DB: mockDb(), JWT_SECRET },
    );
    expect(response.status).toBe(401);
  });

  it('rejects a student opt-in without adult attestation', async () => {
    const response = await worker.fetch(
      new Request('http://x/api/marketing/preferences', {
        method: 'PUT',
        headers: await authHeader('student'),
        body: JSON.stringify({ referralRewardsOptIn: true }),
      }),
      { DB: mockDb('student'), JWT_SECRET },
    );
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      success: false,
      error: expect.stringContaining('Adult confirmation'),
    });
  });

  it('does not expose an API that can send or schedule broadcasts', async () => {
    const response = await worker.fetch(
      new Request('http://x/api/marketing/admin/campaigns/campaign-1/send', {
        method: 'POST',
        headers: await authHeader('admin'),
      }),
      { DB: mockDb('admin'), JWT_SECRET },
    );
    expect(response.status).toBe(404);
  });
});
