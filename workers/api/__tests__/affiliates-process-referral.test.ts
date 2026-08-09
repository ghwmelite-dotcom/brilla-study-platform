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
