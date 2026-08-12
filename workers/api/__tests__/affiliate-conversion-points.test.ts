import { describe, it, expect, vi, afterEach } from 'vitest';
import { sign } from 'hono/jwt';
import { paymentsApp, REFERRAL_PAID_CONVERSION_POINTS } from '../payments';

type Query = { sql: string; params: unknown[] };

// D1 stub routing each query through a handler so different SELECTs return different rows.
// runChanges optionally controls D1Result meta.changes for run() (default 1).
function createMockDb(
  handler: (sql: string, params: unknown[]) => unknown,
  runChanges?: (sql: string, params: unknown[]) => number,
) {
  const queries: Query[] = [];
  const db = {
    prepare(sql: string) {
      return {
        bind(...params: unknown[]) {
          queries.push({ sql, params });
          const value = handler(sql, params);
          return {
            first: async () => value ?? null,
            all: async () => ({ results: Array.isArray(value) ? value : value ? [value] : [] }),
            run: async () => ({ meta: { changes: runChanges ? runChanges(sql, params) : 1 } }),
          };
        },
      };
    },
  } as unknown as D1Database;
  return { db, queries };
}

const JWT_SECRET = 'test-secret';
const baseEnv = {
  JWT_SECRET,
  PAYSTACK_SECRET_KEY: 'sk_test_x',
  PAYSTACK_PUBLIC_KEY: 'pk_test_x',
  APP_URL: 'https://brillaprep.org',
};

// Row returned for the requireAuth per-request users lookup (Phase 1 auth unification).
const ACTIVE_USER = { role: 'student', status: 'approved', is_active: 1 };
const isAuthLookup = (sql: string) => sql.includes('role, status, is_active FROM users');

async function authHeader(userId: string) {
  const token = await sign(
    { userId, email: `${userId}@test.dev`, role: 'student', exp: Math.floor(Date.now() / 1000) + 3600 },
    JWT_SECRET,
  );
  return { Authorization: `Bearer ${token}` };
}

// Paystack says: success, GHS 25.00 (= 2500 pesewas)
function stubPaystackVerify(amountPesewas = 2500, currency = 'GHS', status = 'success') {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
    status: true,
    data: { status, amount: amountPesewas, currency, reference: 'SUB_ref_1' },
  }))));
}

afterEach(() => vi.unstubAllGlobals());

const pendingTx = {
  id: 'tx_1', user_id: 'user_1', reference: 'SUB_ref_1',
  amount: 25, currency: 'GHS', plan_id: 'tier_pro', plan_type: 'student',
  billing_cycle: 'monthly', status: 'pending',
};

const AFFILIATE = {
  id: 'aff_1', user_id: 'affiliate_user_1', referral_code: 'AFFCODE1',
  is_active: 1, commission_rate: 0.1, user_role: 'student',
};

// signup 2 days ago — comfortably past MIN_SIGNUP_TO_CONVERSION_HOURS
const REFERRAL = {
  id: 'ref_1', affiliate_id: 'aff_1', referred_user_id: 'user_1',
  status: 'pending', signup_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
};

// Handler for a referred user whose payment converts an affiliate referral.
function referredHandler(referral: Record<string, unknown>) {
  return (sql: string): unknown => {
    if (isAuthLookup(sql)) return ACTIVE_USER;
    if (sql.includes('FROM payment_transactions')) return pendingTx;
    if (sql.includes('FROM subscription_tiers')) return { id: 'tier_pro', ai_grading_quota: 10 };
    if (sql.includes('referred_by')) return { referred_by: 'AFFCODE1' };
    if (sql.includes('FROM affiliate_profiles') && sql.includes('referral_code')) return AFFILIATE;
    if (sql.includes('FROM affiliate_referrals')) return referral;
    if (sql.includes('COUNT(*)') && sql.includes('affiliate_commissions')) return { count: 0 };
    return null; // existing commission, race cycles, house lookup, etc.
  };
}

const ledgerInserts = (queries: Query[]) =>
  queries.filter((q) => q.sql.includes('INSERT INTO points_ledger'));

describe('affiliate paid-conversion race points', () => {
  it('awards exactly one 500pt referral_paid_conversion ledger entry to the affiliate on a verified referred payment', async () => {
    stubPaystackVerify();
    const { db, queries } = createMockDb(referredHandler(REFERRAL));
    const env = { ...baseEnv, DB: db };

    const res = await paymentsApp.request('/verify/SUB_ref_1', {
      headers: await authHeader('user_1'),
    }, env);

    expect(res.status).toBe(200);
    expect(REFERRAL_PAID_CONVERSION_POINTS).toBe(500);
    const inserts = ledgerInserts(queries);
    expect(inserts).toHaveLength(1);
    // bind order: id, user_id, points, source, source_ref, cycle_id, is_demo_data, expires_at
    expect(inserts[0].params[1]).toBe('affiliate_user_1');
    expect(inserts[0].params[2]).toBe(500);
    expect(inserts[0].params[3]).toBe('referral_paid_conversion');
    expect(inserts[0].params[4]).toBe('ref_1');
  });

  it('awards nothing on a repeat verify (claim-first race loser, changes=0)', async () => {
    stubPaystackVerify();
    const { db, queries } = createMockDb(
      referredHandler(REFERRAL),
      (sql) =>
        sql.includes('UPDATE payment_transactions') && sql.includes("status = 'success'") ? 0 : 1,
    );
    const env = { ...baseEnv, DB: db };

    const res = await paymentsApp.request('/verify/SUB_ref_1', {
      headers: await authHeader('user_1'),
    }, env);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.alreadyVerified).toBe(true);
    expect(ledgerInserts(queries)).toHaveLength(0);
  });

  it('awards nothing when the referral is already converted', async () => {
    stubPaystackVerify();
    const { db, queries } = createMockDb(referredHandler({ ...REFERRAL, status: 'converted' }));
    const env = { ...baseEnv, DB: db };

    const res = await paymentsApp.request('/verify/SUB_ref_1', {
      headers: await authHeader('user_1'),
    }, env);

    expect(res.status).toBe(200);
    expect(ledgerInserts(queries)).toHaveLength(0);
    expect(queries.some((q) => q.sql.includes('INSERT INTO affiliate_commissions'))).toBe(false);
  });
});
