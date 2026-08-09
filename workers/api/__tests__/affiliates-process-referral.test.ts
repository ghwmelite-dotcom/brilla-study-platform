import { describe, it, expect } from 'vitest';
import { sign } from 'hono/jwt';
import { affiliatesApp } from '../affiliates';
import { createMockD1 } from './helpers/mockD1';

const JWT_SECRET = 'test-secret';
const baseEnv = { JWT_SECRET, APP_URL: 'https://brillaprep.org' };

// Row returned for the requireAuth per-request users lookup (Phase 1 auth unification).
const authHandler = {
  match: /role, status, is_active FROM users/,
  first: () => ({ role: 'student', status: 'approved', is_active: 1 }),
};

async function authHeader(userId: string) {
  const token = await sign(
    { userId, email: `${userId}@test.dev`, role: 'student', exp: Math.floor(Date.now() / 1000) + 3600 },
    JWT_SECRET,
  );
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

const AFFILIATE = {
  id: 'aff_1',
  user_id: 'user_AFFILIATE',
  referral_code: 'ABC123XY',
  is_active: 1,
  affiliate_role: 'student',
  affiliate_email: 'affiliate@test.dev',
};

function referralDb() {
  return createMockD1([
    authHandler,
    // Affiliate lookup by code
    { match: /FROM affiliate_profiles ap/, first: () => AFFILIATE },
    // Referred user's email lookup (self-referral guard)
    { match: /SELECT email FROM users/, first: () => ({ email: 'someone-else@test.dev' }) },
    // No existing referral for this user
    { match: /FROM affiliate_referrals WHERE referred_user_id/, first: () => null },
    // Trial-started UPDATE / any other referral write
    { match: /UPDATE affiliate_referrals/, run: () => ({ success: true, meta: { changes: 1 } }) },
    { match: /INSERT INTO affiliate_referrals/, run: () => ({ success: true, meta: { changes: 1 } }) },
    { match: /UPDATE affiliate_profiles/, run: () => ({ success: true, meta: { changes: 1 } }) },
    { match: /UPDATE users SET/, run: () => ({ success: true, meta: { changes: 1 } }) },
    // updateChallengeProgress: no active challenges
    { match: /FROM affiliate_challenges/, all: () => ({ results: [] }) },
    // checkAffiliateAchievements: no profile → returns early
    { match: /FROM affiliate_profiles WHERE user_id/, first: () => null },
  ]);
}

describe('POST /process-referral — referred user is the JWT identity, never the body', () => {
  it('records the referral for the ATTACKER when body names a victim; victim is never written', async () => {
    const db = referralDb();
    const env = { ...baseEnv, DB: db };

    // Attacker is authenticated; body tries to attribute a VICTIM's account.
    const res = await affiliatesApp.request('/process-referral', {
      method: 'POST',
      headers: await authHeader('user_ATTACKER'),
      body: JSON.stringify({ referralCode: 'ABC123XY', newUserId: 'user_VICTIM' }),
    }, env);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    // The referral record names the authenticated user, not the body-supplied victim.
    const insert = db.calls.find((c) => c.sql.includes('INSERT INTO affiliate_referrals'));
    expect(insert).toBeDefined();
    expect(insert!.binds[2]).toBe('user_ATTACKER');

    // users.referred_by is written for the attacker, never for the victim.
    const referredBy = db.calls.find((c) => c.sql.includes('UPDATE users SET referred_by'));
    expect(referredBy).toBeDefined();
    expect(referredBy!.binds[1]).toBe('user_ATTACKER');

    // No statement anywhere binds the victim id.
    for (const call of db.calls) {
      expect(call.binds).not.toContain('user_VICTIM');
    }
  });

  it('rejects self-referral when the affiliate code belongs to the caller', async () => {
    const db = createMockD1([
      authHandler,
      { match: /FROM affiliate_profiles ap/, first: () => ({ ...AFFILIATE, user_id: 'user_ATTACKER' }) },
    ]);
    const env = { ...baseEnv, DB: db };

    const res = await affiliatesApp.request('/process-referral', {
      method: 'POST',
      headers: await authHeader('user_ATTACKER'),
      body: JSON.stringify({ referralCode: 'ABC123XY' }),
    }, env);

    expect(res.status).toBe(400);
    expect(db.calls.some((c) => c.sql.includes('INSERT INTO affiliate_referrals'))).toBe(false);
  });
});

describe('POST /referral/trial-started — identity from context, not body', () => {
  it('updates the referral for the authenticated user even when body names someone else', async () => {
    const db = referralDb();
    const env = { ...baseEnv, DB: db };

    const res = await affiliatesApp.request('/referral/trial-started', {
      method: 'POST',
      headers: await authHeader('user_ATTACKER'),
      body: JSON.stringify({ userId: 'user_VICTIM' }),
    }, env);

    expect(res.status).toBe(200);
    const update = db.calls.find(
      (c) => c.sql.includes('UPDATE affiliate_referrals') && c.sql.includes("status = 'trial'"),
    );
    expect(update).toBeDefined();
    expect(update!.binds[0]).toBe('user_ATTACKER');
    for (const call of db.calls) {
      expect(call.binds).not.toContain('user_VICTIM');
    }
  });
});

// Phase 3 Task 16 regression: checkAffiliateAchievements previously issued
// up to 3 awaited writes per unlocked achievement. All achievement writes
// must now flush in a single db.batch().
describe('checkAffiliateAchievements — single batch (Task 16)', () => {
  it('flushes all achievement writes in one db.batch, none awaited individually', async () => {
    const db = createMockD1([
      authHandler,
      { match: /FROM affiliate_profiles ap/, first: () => AFFILIATE },
      { match: /SELECT email FROM users/, first: () => ({ email: 'someone-else@test.dev' }) },
      { match: /FROM affiliate_referrals WHERE referred_user_id/, first: () => null },
      { match: /INSERT INTO affiliate_referrals/, run: () => ({ success: true, meta: { changes: 1 } }) },
      { match: /UPDATE affiliate_profiles/, run: () => ({ success: true, meta: { changes: 1 } }) },
      { match: /UPDATE users SET/, run: () => ({ success: true, meta: { changes: 1 } }) },
      { match: /INSERT INTO user_affiliate_achievements/, run: () => ({ success: true, meta: { changes: 1 } }) },
      // updateChallengeProgress: no active challenges
      { match: /FROM affiliate_challenges/, all: () => ({ results: [] }) },
      // checkAffiliateAchievements: profile stats unlock both achievements
      {
        match: /FROM affiliate_profiles WHERE user_id/,
        first: () => ({ total_referrals: 5, successful_conversions: 0, total_earnings: 0 }),
      },
      {
        match: /FROM affiliate_achievements/,
        all: () => ({
          results: [
            // Unlocked: insert + xp + cash = 3 writes
            { id: 'ach_1', requirement_type: 'referrals', requirement_value: 3, xp_reward: 100, cash_bonus: 10 },
            // Unlocked: insert + xp = 2 writes (no cash_bonus)
            { id: 'ach_2', requirement_type: 'referrals', requirement_value: 5, xp_reward: 50, cash_bonus: 0 },
            // Not unlocked (conversions 0 < 1): no writes
            { id: 'ach_3', requirement_type: 'conversions', requirement_value: 1, xp_reward: 10, cash_bonus: 0 },
          ],
        }),
      },
    ]);

    // Spy on batch() invocations.
    const batchSizes: number[] = [];
    const origBatch = db.batch.bind(db);
    db.batch = (stmts: { run(): Promise<unknown> }[]) => {
      batchSizes.push(stmts.length);
      return origBatch(stmts);
    };

    const env = { ...baseEnv, DB: db };
    const res = await affiliatesApp.request('/process-referral', {
      method: 'POST',
      headers: await authHeader('user_NEW'),
      body: JSON.stringify({ referralCode: 'ABC123XY' }),
    }, env);

    expect(res.status).toBe(200);

    // Exactly two batches: the referral write batch (4 stmts) and the
    // achievements batch (2 inserts + 2 xp updates + 1 cash update = 5).
    expect(batchSizes).toEqual([4, 5]);

    const unlockInserts = db.calls.filter((c) =>
      c.sql.includes('INSERT INTO user_affiliate_achievements'),
    );
    expect(unlockInserts).toHaveLength(2);
    expect(unlockInserts.map((c) => c.binds[2])).toEqual(['ach_1', 'ach_2']);

    // ach_3 (unmet requirement) produced no writes.
    for (const call of db.calls) {
      expect(call.binds).not.toContain('ach_3');
    }
  });

  it('issues no batch at all when nothing is unlocked', async () => {
    const db = createMockD1([
      authHandler,
      { match: /FROM affiliate_profiles ap/, first: () => AFFILIATE },
      { match: /SELECT email FROM users/, first: () => ({ email: 'someone-else@test.dev' }) },
      { match: /FROM affiliate_referrals WHERE referred_user_id/, first: () => null },
      { match: /INSERT INTO affiliate_referrals/, run: () => ({ success: true, meta: { changes: 1 } }) },
      { match: /UPDATE affiliate_profiles/, run: () => ({ success: true, meta: { changes: 1 } }) },
      { match: /UPDATE users SET/, run: () => ({ success: true, meta: { changes: 1 } }) },
      { match: /FROM affiliate_challenges/, all: () => ({ results: [] }) },
      {
        match: /FROM affiliate_profiles WHERE user_id/,
        first: () => ({ total_referrals: 0, successful_conversions: 0, total_earnings: 0 }),
      },
      {
        match: /FROM affiliate_achievements/,
        all: () => ({
          results: [
            { id: 'ach_1', requirement_type: 'referrals', requirement_value: 3, xp_reward: 100, cash_bonus: 10 },
          ],
        }),
      },
    ]);

    const batchSizes: number[] = [];
    const origBatch = db.batch.bind(db);
    db.batch = (stmts: { run(): Promise<unknown> }[]) => {
      batchSizes.push(stmts.length);
      return origBatch(stmts);
    };

    const env = { ...baseEnv, DB: db };
    const res = await affiliatesApp.request('/process-referral', {
      method: 'POST',
      headers: await authHeader('user_NEW'),
      body: JSON.stringify({ referralCode: 'ABC123XY' }),
    }, env);

    expect(res.status).toBe(200);
    // Only the referral write batch; no achievements batch, no unlock writes.
    expect(batchSizes).toEqual([4]);
    expect(db.calls.some((c) => c.sql.includes('INSERT INTO user_affiliate_achievements'))).toBe(false);
  });
});
