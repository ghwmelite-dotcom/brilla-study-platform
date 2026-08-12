import { describe, it, expect, vi } from 'vitest';
import { sign } from 'hono/jwt';
import { quickPlayApp } from '../quickplay';
import { teamBattlesApp } from '../teambattles';
import { eventsApp } from '../events';
import { cosmeticsApp } from '../cosmetics';
import { rewardsApp } from '../rewards';
import { engagementApp } from '../engagement';
import { learningPathApp } from '../learningpath';
import { activityFeedApp } from '../activityfeed';

// Integration-style tests: the eight previously-orphan engagement/activity
// routers are mounted bare in index.ts with no middleware, yet read
// c.get('user'). Before Task 7 every route 500s; now requireAuth must
// reject unauthenticated requests with 401 and let a verified Bearer JWT
// (with an active users-table row) through.

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
  { name: 'quickplay', app: quickPlayApp, path: '/daily-challenge' },
  { name: 'teambattles', app: teamBattlesApp, path: '/available' },
  { name: 'events', app: eventsApp, path: '/active' },
  { name: 'cosmetics', app: cosmeticsApp, path: '/available' },
  { name: 'rewards', app: rewardsApp, path: '/daily-multiplier' },
  { name: 'engagement', app: engagementApp, path: '/status' },
  { name: 'learningpath', app: learningPathApp, path: '/study-plan' },
  { name: 'activityfeed', app: activityFeedApp, path: '/friends' },
] as const;

describe.each(cases)('$name router auth', ({ app, path }) => {
  it('returns 401 (previously 500) for an unauthenticated request', async () => {
    const res = await app.fetch(
      new Request(`http://x${path}`),
      { DB: makeDb(ACTIVE_USER), JWT_SECRET },
    );
    expect(res.status).toBe(401);
  });

  it('rejects identity spoofing via x-user-* headers with 401', async () => {
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
  });
});
