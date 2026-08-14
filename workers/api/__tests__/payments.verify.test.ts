import { describe, it, expect, vi, afterEach } from 'vitest';
import { sign } from 'hono/jwt';
import { paymentsApp } from '../payments';

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
const isAuthLookup = (sql: string) => sql.includes('role, status, is_active, session_version FROM users');

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

describe('GET /payments/verify/:reference', () => {
  it('returns 404 when the transaction belongs to a different user (no ownership leak)', async () => {
    stubPaystackVerify();
    const { db, queries } = createMockDb((sql) => {
      if (isAuthLookup(sql)) return ACTIVE_USER;
      return sql.includes('FROM payment_transactions') ? pendingTx : null;
    });
    const env = { ...baseEnv, DB: db };

    const res = await paymentsApp.request('/verify/SUB_ref_1', {
      headers: await authHeader('user_ATTACKER'),
    }, env);

    expect(res.status).toBe(404);
    expect(queries.some((q) => q.sql.includes('ai_grading_credits'))).toBe(false);
  });

  it('does not re-credit when transaction is already success (skips ALL crediting side-effects)', async () => {
    stubPaystackVerify();
    const { db, queries } = createMockDb((sql) => {
      if (isAuthLookup(sql)) return ACTIVE_USER;
      return sql.includes('FROM payment_transactions')
        ? { ...pendingTx, status: 'success' }
        : null;
    });
    const env = { ...baseEnv, DB: db };

    const res = await paymentsApp.request('/verify/SUB_ref_1', {
      headers: await authHeader('user_1'),
    }, env);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.alreadyVerified).toBe(true);
    expect(queries.some((q) => q.sql.includes('ai_grading_credits'))).toBe(false);
    // No affiliate/referral side-effects either on re-verify
    expect(queries.some((q) => q.sql.includes('affiliate_'))).toBe(false);
    expect(queries.some((q) => q.sql.includes('user_trials'))).toBe(false);
  });

  it('rejects when Paystack amount does not match the recorded transaction amount', async () => {
    stubPaystackVerify(5000, 'GHS'); // tx says GHS 25.00, Paystack says GHS 50.00
    const { db, queries } = createMockDb((sql) => {
      if (isAuthLookup(sql)) return ACTIVE_USER;
      return sql.includes('FROM payment_transactions') ? pendingTx : null;
    });
    const env = { ...baseEnv, DB: db };

    const res = await paymentsApp.request('/verify/SUB_ref_1', {
      headers: await authHeader('user_1'),
    }, env);

    expect(res.status).toBe(400);
    expect(queries.some((q) => q.sql.includes('ai_grading_credits'))).toBe(false);
    // mismatch must mark the transaction failed
    expect(queries.some((q) =>
      q.sql.includes('UPDATE payment_transactions') && q.sql.includes("status = 'failed'"))).toBe(true);
  });

  it('credits exactly once for the legitimate owner with matching amount', async () => {
    stubPaystackVerify(2500, 'GHS');
    const { db, queries } = createMockDb((sql) => {
      if (isAuthLookup(sql)) return ACTIVE_USER;
      if (sql.includes('FROM payment_transactions')) return pendingTx;
      if (sql.includes('FROM subscription_tiers')) return { id: 'tier_pro', ai_grading_quota: 10 };
      if (sql.includes('referred_by')) return { referred_by: null };
      return null;
    });
    const env = { ...baseEnv, DB: db };

    const res = await paymentsApp.request('/verify/SUB_ref_1', {
      headers: await authHeader('user_1'),
    }, env);

    expect(res.status).toBe(200);
    const creditWrites = queries.filter((q) => q.sql.includes('ai_grading_credits'));
    expect(creditWrites).toHaveLength(1);
  });

  it('race loser (claim UPDATE changes=0) gets alreadyVerified and credits nothing', async () => {
    stubPaystackVerify(2500, 'GHS');
    // Simulate a concurrent verify winning the race: the status-guarded claim
    // UPDATE matches 0 rows because the winner already set status='success'.
    const { db, queries } = createMockDb(
      (sql) => {
        if (isAuthLookup(sql)) return ACTIVE_USER;
        if (sql.includes('FROM payment_transactions')) return pendingTx; // read as pending
        return null;
      },
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
    // Zero crediting side-effects of any kind
    expect(queries.some((q) => q.sql.includes('ai_grading_credits'))).toBe(false);
    expect(queries.some((q) => q.sql.includes('affiliate_'))).toBe(false);
    expect(queries.some((q) => q.sql.includes('user_trials'))).toBe(false);
  });

  it('status transitions are guarded against concurrent success (claim SQL)', async () => {
    stubPaystackVerify(2500, 'GHS');
    const { db, queries } = createMockDb((sql) => {
      if (isAuthLookup(sql)) return ACTIVE_USER;
      if (sql.includes('FROM payment_transactions')) return pendingTx;
      if (sql.includes('FROM subscription_tiers')) return { id: 'tier_pro', ai_grading_quota: 10 };
      if (sql.includes('referred_by')) return { referred_by: null };
      return null;
    });
    const env = { ...baseEnv, DB: db };

    await paymentsApp.request('/verify/SUB_ref_1', {
      headers: await authHeader('user_1'),
    }, env);

    const txUpdates = queries.filter((q) => q.sql.includes('UPDATE payment_transactions'));
    expect(txUpdates.length).toBeGreaterThan(0);
    for (const q of txUpdates) {
      expect(q.sql).toContain("AND status != 'success'");
    }
  });
});
