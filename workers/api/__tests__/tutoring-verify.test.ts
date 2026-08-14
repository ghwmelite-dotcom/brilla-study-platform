import { describe, it, expect, vi, afterEach } from 'vitest';
import { sign } from 'hono/jwt';
import { tutoringRouter } from '../tutoring';
import { createMockD1 } from './helpers/mockD1';

const JWT_SECRET = 'test-secret';
const baseEnv = {
  JWT_SECRET,
  APP_URL: 'https://brillaprep.org',
  PAYSTACK_SECRET_KEY: 'sk_test_x',
};

// Row returned for the requireAuth per-request users lookup (Phase 1 auth unification).
const authHandler = {
  match: /role, status, is_active, session_version FROM users/,
  first: () => ({ role: 'student', status: 'approved', is_active: 1 }),
};

async function authHeader(userId: string) {
  const token = await sign(
    { userId, email: `${userId}@test.dev`, role: 'student', exp: Math.floor(Date.now() / 1000) + 3600 },
    JWT_SECRET,
  );
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

// Paystack says: success, GHS 25.00 (= 2500 pesewas)
function stubPaystackVerify(amountPesewas = 2500, status = 'success') {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
    status: true,
    data: { status, amount: amountPesewas },
  }))));
}

afterEach(() => vi.unstubAllGlobals());

const pendingPayment = {
  id: 'pay_1',
  session_id: 'sess_1',
  student_id: 'user_1',
  teacher_id: 'teacher_1',
  amount: 25,
  teacher_payout: 21.25,
  payment_reference: 'TUT_ref_1',
  status: 'pending',
};

function verifyDb(claimChanges: number) {
  return createMockD1([
    authHandler,
    // Payment lookup (ownership-scoped)
    { match: /FROM tutoring_payments WHERE payment_reference/, first: () => pendingPayment },
    // The claim-first status UPDATE
    {
      match: /UPDATE tutoring_payments/,
      run: () => ({ success: true, meta: { changes: claimChanges } }),
    },
    { match: /UPDATE teacher_earnings/, run: () => ({ success: true, meta: { changes: 1 } }) },
    { match: /FROM teacher_earnings/, first: () => ({ 1: 1 }) },
    { match: /INSERT INTO teacher_earnings/, run: () => ({ success: true, meta: { changes: 1 } }) },
  ]);
}

describe('POST /sessions/pay/verify — claim-first tutoring verify', () => {
  it('race loser (claim changes=0) gets the already-processed response and credits nothing', async () => {
    stubPaystackVerify(2500);
    const db = verifyDb(0); // concurrent verify already claimed the payment
    const env = { ...baseEnv, DB: db };

    const res = await tutoringRouter.request('/sessions/pay/verify', {
      method: 'POST',
      headers: await authHeader('user_1'),
      body: JSON.stringify({ reference: 'TUT_ref_1' }),
    }, env);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.message).toBe('Payment already verified');
    // Zero teacher_earnings side-effects of any kind
    expect(db.calls.some((c) => c.sql.includes('teacher_earnings'))).toBe(false);
  });

  it('race winner (claim changes=1) credits teacher earnings exactly once', async () => {
    stubPaystackVerify(2500);
    const db = verifyDb(1);
    const env = { ...baseEnv, DB: db };

    const res = await tutoringRouter.request('/sessions/pay/verify', {
      method: 'POST',
      headers: await authHeader('user_1'),
      body: JSON.stringify({ reference: 'TUT_ref_1' }),
    }, env);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.message).toBe('Payment verified successfully');

    const earningsWrites = db.calls.filter((c) => c.sql.includes('UPDATE teacher_earnings'));
    expect(earningsWrites).toHaveLength(1);
    expect(earningsWrites[0].binds[0]).toBe(21.25);
    expect(earningsWrites[0].binds[1]).toBe('teacher_1');
    // No insert when the earnings row already exists
    expect(db.calls.some((c) => c.sql.includes('INSERT INTO teacher_earnings'))).toBe(false);
  });

  it('claim UPDATE is status-guarded (WHERE ... status != \'paid\')', async () => {
    stubPaystackVerify(2500);
    const db = verifyDb(1);
    const env = { ...baseEnv, DB: db };

    await tutoringRouter.request('/sessions/pay/verify', {
      method: 'POST',
      headers: await authHeader('user_1'),
      body: JSON.stringify({ reference: 'TUT_ref_1' }),
    }, env);

    const claim = db.calls.find((c) => c.sql.includes('UPDATE tutoring_payments'));
    expect(claim).toBeDefined();
    expect(claim!.sql).toContain("AND status != 'paid'");
  });

  it('returns 404 when the payment belongs to a different student (ownership check kept)', async () => {
    stubPaystackVerify(2500);
    const db = createMockD1([
      authHandler,
      // Ownership-scoped lookup finds nothing for the attacker
      { match: /FROM tutoring_payments WHERE payment_reference/, first: () => null },
    ]);
    const env = { ...baseEnv, DB: db };

    const res = await tutoringRouter.request('/sessions/pay/verify', {
      method: 'POST',
      headers: await authHeader('user_ATTACKER'),
      body: JSON.stringify({ reference: 'TUT_ref_1' }),
    }, env);

    expect(res.status).toBe(404);
    expect(db.calls.some((c) => c.sql.includes('teacher_earnings'))).toBe(false);
  });

  it('rejects when the Paystack amount does not match the recorded payment (exact-amount check kept)', async () => {
    stubPaystackVerify(5000); // recorded GHS 25.00, Paystack says GHS 50.00
    const db = verifyDb(1);
    const env = { ...baseEnv, DB: db };

    const res = await tutoringRouter.request('/sessions/pay/verify', {
      method: 'POST',
      headers: await authHeader('user_1'),
      body: JSON.stringify({ reference: 'TUT_ref_1' }),
    }, env);

    expect(res.status).toBe(400);
    expect(db.calls.some((c) => c.sql.includes('UPDATE tutoring_payments'))).toBe(false);
    expect(db.calls.some((c) => c.sql.includes('teacher_earnings'))).toBe(false);
  });
});
