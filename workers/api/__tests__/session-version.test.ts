import { describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import { requireAuth } from '../auth-middleware';

const JWT_SECRET = `${crypto.randomUUID()}-${crypto.randomUUID()}`;

function appFor(sessionVersion: number) {
  const DB = {
    prepare: vi.fn(() => ({
      bind: vi.fn(() => ({
        first: vi.fn().mockResolvedValue({
          role: 'student',
          status: 'approved',
          is_active: 1,
          session_version: sessionVersion,
        }),
      })),
    })),
  } as unknown as D1Database;
  const app = new Hono();
  app.use('*', requireAuth);
  app.get('/probe', (c) => c.json({ success: true }));
  return { app, env: { DB, JWT_SECRET } };
}

async function request(tokenSessionVersion?: number) {
  const payload: Record<string, unknown> = {
    userId: 'user_1',
    role: 'student',
    exp: Math.floor(Date.now() / 1000) + 3600,
  };
  if (tokenSessionVersion !== undefined) payload.sessionVersion = tokenSessionVersion;
  const token = await sign(payload, JWT_SECRET);
  return new Request('http://x/probe', { headers: { Authorization: `Bearer ${token}` } });
}

describe('credential-version session invalidation', () => {
  it('accepts a token whose version matches the current user row', async () => {
    const { app, env } = appFor(3);
    expect((await app.fetch(await request(3), env)).status).toBe(200);
  });

  it('rejects a token issued before a password change', async () => {
    const { app, env } = appFor(4);
    const response = await app.fetch(await request(3), env);
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ error: 'Session is no longer valid' });
  });

  it('keeps legacy versionless tokens valid only while the account remains at version zero', async () => {
    const zero = appFor(0);
    expect((await zero.app.fetch(await request(), zero.env)).status).toBe(200);

    const rotated = appFor(1);
    expect((await rotated.app.fetch(await request(), rotated.env)).status).toBe(401);
  });
});
