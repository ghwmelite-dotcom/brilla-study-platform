import { describe, it, expect } from 'vitest';
import { sign } from 'hono/jwt';
import worker from '../index';
import { createMockD1, type MockHandler } from './helpers/mockD1';

const JWT_SECRET = 'test-secret-that-is-long-enough';

async function token(payload: object) {
  return sign(
    { ...payload, exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000) },
    JWT_SECRET,
  );
}

const authHandler: MockHandler = {
  match: /SELECT role, status, is_active FROM users/,
  first: () => ({ role: 'student', status: 'approved', is_active: 1 }),
};

function featuresReq(db: unknown) {
  return token({ userId: 'user_1', role: 'student' }).then((t) =>
    worker.fetch(
      new Request('http://x/api/subscriptions/features', {
        headers: { Authorization: `Bearer ${t}` },
      }),
      { DB: db as D1Database, JWT_SECRET },
    ),
  );
}

const userRowHandler = (tierId: string, expiresAt: string | null): MockHandler => ({
  match: /u\.subscription_tier_id,\s*u\.subscription_expires_at,\s*u\.trial_expires_at/,
  first: () => ({
    subscription_tier_id: tierId,
    subscription_expires_at: expiresAt,
    trial_expires_at: null,
    features: '[]',
    ai_grading_quota: 0,
  }),
});

describe('GET /api/subscriptions/features', () => {
  it('free user: whiteboard false, dailyAiLimit 10', async () => {
    const db = createMockD1([authHandler, userRowHandler('tier_free', null)]);
    const res = await featuresReq(db);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { features: Record<string, unknown> } };
    expect(body.data.features.whiteboard).toBe(false);
    expect(body.data.features.dailyAiLimit).toBe(10);
  });

  it('paid user: whiteboard true, dailyAiLimit -1', async () => {
    const db = createMockD1([
      authHandler,
      userRowHandler('tier_student_monthly', new Date(Date.now() + 86400000).toISOString()),
    ]);
    const res = await featuresReq(db);
    const body = (await res.json()) as { data: { features: Record<string, unknown> } };
    expect(body.data.features.whiteboard).toBe(true);
    expect(body.data.features.dailyAiLimit).toBe(-1);
  });
});
