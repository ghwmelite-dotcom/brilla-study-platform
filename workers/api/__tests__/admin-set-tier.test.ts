import { describe, it, expect } from 'vitest';
import { sign } from 'hono/jwt';
import worker from '../index';
import { createMockD1, type MockHandler } from './helpers/mockD1';

const JWT_SECRET = 'test-secret-that-is-long-enough';

async function adminToken() {
  return sign(
    { userId: 'admin_1', role: 'admin', email: 'admin@test.com', exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000) },
    JWT_SECRET,
  );
}

const authHandler: MockHandler = {
  match: /SELECT role, status, is_active FROM users/,
  first: () => ({ role: 'admin', status: 'approved', is_active: 1 }),
};

const tierHandler: MockHandler = {
  match: /FROM subscription_tiers WHERE id = \? AND is_active = 1/,
  first: () => ({ id: 'tier_student_monthly', name: 'Student Monthly', slug: 'student-monthly', ai_grading_quota: 50 }),
};

const targetUserHandler: MockHandler = {
  match: /SELECT id, email, subscription_tier_id FROM users WHERE id = \?/,
  first: () => ({ id: 'user_1', email: 'student@test.com', subscription_tier_id: 'tier_free' }),
};

// mockD1 throws on any SQL without a matching handler, so the success path
// needs explicit handlers for the two UPDATEs and the audit INSERT.
const updateTierHandler: MockHandler = {
  match: /UPDATE users SET\s+subscription_tier_id/,
  run: () => ({ success: true, meta: { changes: 1 } }),
};

const updateCreditsHandler: MockHandler = {
  match: /ai_grading_credits = COALESCE/,
  run: () => ({ success: true, meta: { changes: 1 } }),
};

const auditHandler: MockHandler = {
  match: /INSERT INTO audit_log/,
  run: () => ({ success: true, meta: { changes: 1 } }),
};

function setTier(db: unknown, body: object) {
  return adminToken().then((t) =>
    worker.fetch(
      new Request('http://x/api/admin/users/user_1/set-tier', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
      { DB: db as D1Database, JWT_SECRET },
    ),
  );
}

describe('POST /api/admin/users/:id/set-tier', () => {
  it('rejects invalid durationDays', async () => {
    const db = createMockD1([authHandler]);
    const res = await setTier(db, { tierId: 'tier_student_monthly', durationDays: 0 });
    expect(res.status).toBe(400);
  });

  it('rejects unknown tier', async () => {
    const db = createMockD1([authHandler, { match: /FROM subscription_tiers/, first: () => null }]);
    const res = await setTier(db, { tierId: 'tier_nope', durationDays: 30 });
    expect(res.status).toBe(404);
  });

  it('sets tier, expiry and grading-credit top-up, and writes an audit row', async () => {
    const db = createMockD1([authHandler, tierHandler, targetUserHandler, updateTierHandler, updateCreditsHandler, auditHandler]);
    const res = await setTier(db, { tierId: 'tier_student_monthly', durationDays: 30 });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { tierName: string; expiresAt: string; creditsAdded: number } };
    expect(body.data.tierName).toBe('Student Monthly');
    expect(new Date(body.data.expiresAt).getTime()).toBeGreaterThan(Date.now() + 29 * 86400000);
    expect(body.data.creditsAdded).toBe(50);

    const update = db.calls.find((c) => /UPDATE users SET\s+subscription_tier_id/.test(c.sql));
    expect(update).toBeDefined();
    expect(update!.binds[0]).toBe('tier_student_monthly');

    const credits = db.calls.find((c) => /ai_grading_credits = COALESCE/.test(c.sql));
    expect(credits!.binds[0]).toBe(50);

    expect(db.calls.some((c) => /INSERT INTO audit_log/.test(c.sql))).toBe(true);
  });
});

describe('GET /api/admin/users/:id/subscription', () => {
  it('never queries the nonexistent user_subscriptions table', async () => {
    const userRow: MockHandler = {
      match: /FROM users u\s+LEFT JOIN subscription_tiers/,
      first: () => ({
        id: 'user_1', email: 'student@test.com', name: 'Student', role: 'student',
        ai_grading_credits: 50, trial_started_at: null, trial_expires_at: null,
        subscription_tier_id: 'tier_student_monthly',
        subscription_expires_at: new Date(Date.now() + 15 * 86400000).toISOString(),
        plan_name: 'Student Monthly', plan_slug: 'student-monthly',
        ai_grading_quota: 50, price_monthly: 50, price_yearly: 480,
      }),
    };
    const trialRow: MockHandler = { match: /FROM user_trials WHERE user_id = \?/, first: () => null };
    const db = createMockD1([authHandler, userRow, trialRow]);

    const t = await adminToken();
    const res = await worker.fetch(
      new Request('http://x/api/admin/users/user_1/subscription', { headers: { Authorization: `Bearer ${t}` } }),
      { DB: db as D1Database, JWT_SECRET },
    );
    expect(res.status).toBe(200);
    expect(db.calls.some((c) => /user_subscriptions/.test(c.sql))).toBe(false);
    const body = (await res.json()) as { data: { subscription: { planName: string; status: string } } };
    expect(body.data.subscription.planName).toBe('Student Monthly');
    expect(body.data.subscription.status).toBe('active');
  });
});
