import { describe, it, expect, vi } from 'vitest';
import { sign } from 'hono/jwt';
import { notificationsApp } from '../notifications';

// Regression test: notifications previously decoded the JWT payload with raw
// atob() and never verified the signature, so a tampered payload was accepted.
// The shared requireAuth middleware must now reject it with 401.

const JWT_SECRET = 'test-secret-that-is-long-enough';
const ACTIVE_USER = { role: 'student', status: 'approved', is_active: 1 };

// Generic D1 stub: requireAuth's user lookup resolves via .first(userRow);
// route-level list queries resolve via .all({ results: [] }).
function makeDb(userRow: unknown) {
  const stmt = {
    bind: vi.fn(),
    first: vi.fn().mockResolvedValue(userRow),
    all: vi.fn().mockResolvedValue({ results: [] }),
    run: vi.fn().mockResolvedValue({ success: true }),
  };
  stmt.bind.mockReturnValue(stmt);
  return { prepare: vi.fn(() => stmt) } as unknown as D1Database;
}

async function token(payload: object) {
  return sign(
    { ...payload, exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000) },
    JWT_SECRET,
  );
}

describe('notifications router auth', () => {
  it('rejects a tampered token (payload re-encoded with a different sub, stale signature) with 401', async () => {
    const valid = await token({ userId: 'user_1', role: 'student' });
    const [header, , signature] = valid.split('.');
    // Attacker re-encodes the payload claiming another identity, but cannot
    // re-sign it — the old code accepted this, the new code must not.
    const forgedPayload = Buffer.from(
      JSON.stringify({
        userId: 'admin_1',
        sub: 'admin_1',
        role: 'admin',
        exp: Math.floor(Date.now() / 1000) + 3600,
      }),
    ).toString('base64url');
    const tampered = `${header}.${forgedPayload}.${signature}`;

    const res = await notificationsApp.fetch(
      new Request('http://x/', { headers: { Authorization: `Bearer ${tampered}` } }),
      { DB: makeDb(ACTIVE_USER), JWT_SECRET },
    );
    expect(res.status).toBe(401);
  });

  it('rejects a bare x-user-id header with 401', async () => {
    const res = await notificationsApp.fetch(
      new Request('http://x/', { headers: { 'x-user-id': 'user_1' } }),
      { DB: makeDb(ACTIVE_USER), JWT_SECRET },
    );
    expect(res.status).toBe(401);
  });

  it('accepts a valid signed token with an active DB user (200)', async () => {
    const t = await token({ userId: 'user_1', role: 'student' });
    const res = await notificationsApp.fetch(
      new Request('http://x/', { headers: { Authorization: `Bearer ${t}` } }),
      { DB: makeDb(ACTIVE_USER), JWT_SECRET },
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean };
    expect(body.success).toBe(true);
  });
});
