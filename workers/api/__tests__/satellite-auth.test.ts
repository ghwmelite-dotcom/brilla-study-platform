import { describe, it, expect, vi } from 'vitest';
import { sign } from 'hono/jwt';
import { chatApp } from '../chat';
import { tutorApp } from '../tutor';
import { counselorApp } from '../counselor';

// Integration-style tests: the chat/tutor/counselor satellite routers must
// reject identity headers and accept only a verified Bearer JWT (shared
// requireAuth middleware does a fresh users-table lookup).

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

const cases = [
  { name: 'chat', app: chatApp, path: '/rooms' },
  { name: 'tutor', app: tutorApp, path: '/conversations' },
  { name: 'counselor', app: counselorApp, path: '/conversations' },
] as const;

describe.each(cases)('$name router auth', ({ app, path }) => {
  it('returns 401 for a request with only x-user-id/x-user-role headers', async () => {
    const res = await app.fetch(
      new Request(`http://x${path}`, {
        headers: { 'x-user-id': 'student_1', 'x-user-role': 'student' },
      }),
      { DB: makeDb(ACTIVE_USER), JWT_SECRET },
    );
    expect(res.status).toBe(401);
  });

  it('accepts a valid signed token with an active DB user (non-401)', async () => {
    const t = await token({ userId: 'student_1', role: 'student' });
    const res = await app.fetch(
      new Request(`http://x${path}`, {
        headers: { Authorization: `Bearer ${t}` },
      }),
      { DB: makeDb(ACTIVE_USER), JWT_SECRET },
    );
    expect(res.status).not.toBe(401);
    expect(res.status).toBe(200);
  });
});
