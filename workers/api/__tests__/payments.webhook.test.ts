import { afterEach, describe, it, expect, vi } from 'vitest';
import { paymentsApp } from '../payments';

type Query = { sql: string; params: unknown[] };

// Minimal D1 stub: records every query; returns the provided row for first()/all().
function createMockDb(row: Record<string, unknown> | null = null) {
  const queries: Query[] = [];
  const db = {
    prepare(sql: string) {
      return {
        bind(...params: unknown[]) {
          queries.push({ sql, params });
          return {
            first: async () => row,
            all: async () => ({ results: row ? [row] : [] }),
            run: async () => ({ meta: { changes: 1 } }),
          };
        },
      };
    },
    async batch(statements: Array<{ run(): Promise<unknown> }>) {
      return Promise.all(statements.map((statement) => statement.run()));
    },
  } as unknown as D1Database;
  return { db, queries };
}

async function hmacSha512Hex(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-512' }, false, ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

const baseEnv = {
  JWT_SECRET: 'test-secret',
  PAYSTACK_SECRET_KEY: 'sk_test_x',
  PAYSTACK_PUBLIC_KEY: 'pk_test_x',
  APP_URL: 'https://brillaprep.org',
};

afterEach(() => vi.unstubAllGlobals());

describe('POST /payments/webhook', () => {
  it('refuses to process when PAYSTACK_WEBHOOK_SECRET is unset: 5xx and zero DB writes', async () => {
    const { db, queries } = createMockDb();
    const env = { ...baseEnv, DB: db }; // deliberately no PAYSTACK_WEBHOOK_SECRET
    const body = JSON.stringify({
      event: 'transfer.failed',
      data: { transfer_code: 'TRF_forged', reason: 'forged' },
    });

    const res = await paymentsApp.request('/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-paystack-signature': 'deadbeef' },
      body,
    }, env);

    expect(res.status).toBeGreaterThanOrEqual(500);
    expect(res.status).toBeLessThan(600);
    expect(queries).toHaveLength(0); // no DB write of any kind
  });

  it('rejects a bad signature with 401 and zero DB writes', async () => {
    const { db, queries } = createMockDb();
    const env = { ...baseEnv, DB: db, PAYSTACK_WEBHOOK_SECRET: 'whsec_test' };
    const body = JSON.stringify({ event: 'transfer.failed', data: { transfer_code: 'TRF_x' } });

    const res = await paymentsApp.request('/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-paystack-signature': 'wrong' },
      body,
    }, env);

    expect(res.status).toBe(401);
    expect(queries).toHaveLength(0);
  });

  it('processes a validly-signed transfer.failed and refunds available_earnings', async () => {
    const payout = { id: 'po_1', affiliate_id: 'ap_1', amount: 100, status: 'processing' };
    const { db, queries } = createMockDb(payout);
    const secret = 'whsec_test';
    const env = { ...baseEnv, DB: db, PAYSTACK_WEBHOOK_SECRET: secret };
    const body = JSON.stringify({
      event: 'transfer.failed',
      data: { transfer_code: 'TRF_real', reason: 'Insufficient balance' },
    });
    const signature = await hmacSha512Hex(secret, body);

    const res = await paymentsApp.request('/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-paystack-signature': signature },
      body,
    }, env);

    expect(res.status).toBe(200);
    const refund = queries.find((q) => q.sql.includes('affiliate_profiles') && q.sql.includes('available_earnings'));
    expect(refund).toBeDefined();
    expect(refund!.sql).toMatch(/SELECT ap\.amount/);
    expect(refund!.sql).toMatch(/refund_applied_at IS NULL/);
    expect(refund!.params).toEqual(['TRF_real', 'TRF_real']);
    expect(queries.some((q) => q.sql.includes('SELECT * FROM affiliate_payouts'))).toBe(false);
  });

  it('settles a signed charge.success through Paystack verification and stores no provider PII', async () => {
    const transaction = {
      id: 'tx_1', user_id: 'user_1', reference: 'SUB_REF_1', amount: 25,
      currency: 'GHS', plan_id: 'tier_pro', billing_cycle: 'monthly',
      status: 'pending', settlement_applied_at: null, affiliate_processed_at: null,
      ai_grading_quota: 10, referred_by: null,
    };
    const { db, queries } = createMockDb(transaction);
    const secret = 'whsec_test';
    const env = { ...baseEnv, DB: db, PAYSTACK_WEBHOOK_SECRET: secret };
    const body = JSON.stringify({
      event: 'charge.success',
      data: { reference: 'SUB_REF_1' },
    });
    const signature = await hmacSha512Hex(secret, body);
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      status: true,
      data: {
        reference: 'SUB_REF_1', status: 'success', amount: 2500, currency: 'GHS',
        customer: { email: 'private@example.com' },
        authorization: { last4: '4081' },
      },
    }))));

    const res = await paymentsApp.request('/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-paystack-signature': signature },
      body,
    }, env);

    expect(res.status).toBe(200);
    expect(queries.some((query) => query.sql.includes('ai_grading_credits'))).toBe(true);
    expect(queries.some((query) => query.sql.includes('payment_webhook_receipts'))).toBe(true);
    const settlement = queries.find((query) =>
      query.sql.includes('settlement_applied_at = datetime'));
    expect(JSON.stringify(settlement?.params)).not.toContain('private@example.com');
    expect(JSON.stringify(settlement?.params)).not.toContain('4081');
  });

  it('returns 503 without DB writes when charge verification is unavailable', async () => {
    const { db, queries } = createMockDb();
    const secret = 'whsec_test';
    const env = { ...baseEnv, DB: db, PAYSTACK_WEBHOOK_SECRET: secret };
    const body = JSON.stringify({
      event: 'charge.success',
      data: { reference: 'SUB_REF_1' },
    });
    const signature = await hmacSha512Hex(secret, body);
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 503 })));

    const res = await paymentsApp.request('/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-paystack-signature': signature },
      body,
    }, env);

    expect(res.status).toBe(503);
    expect(queries).toHaveLength(0);
  });

  it('records a signed transfer.success receipt atomically with completion', async () => {
    const { db, queries } = createMockDb();
    const secret = 'whsec_test';
    const body = JSON.stringify({
      event: 'transfer.success',
      data: { transfer_code: 'TRF_success' },
    });
    const signature = await hmacSha512Hex(secret, body);

    const res = await paymentsApp.request('/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-paystack-signature': signature },
      body,
    }, { ...baseEnv, DB: db, PAYSTACK_WEBHOOK_SECRET: secret });

    expect(res.status).toBe(200);
    expect(queries.some((query) =>
      query.sql.includes("status = 'completed'") && query.params[0] === 'TRF_success')).toBe(true);
    expect(queries.some((query) =>
      query.sql.includes("'transfer.success'") && query.params.includes('transfer.success:TRF_success')))
      .toBe(true);
  });

  it('refunds a signed transfer.reversed using only the stored payout amount', async () => {
    const { db, queries } = createMockDb();
    const secret = 'whsec_test';
    const body = JSON.stringify({
      event: 'transfer.reversed',
      data: { transfer_code: 'TRF_reversed', amount: 999999, reason: 'Reversed by provider' },
    });
    const signature = await hmacSha512Hex(secret, body);

    const res = await paymentsApp.request('/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-paystack-signature': signature },
      body,
    }, { ...baseEnv, DB: db, PAYSTACK_WEBHOOK_SECRET: secret });

    expect(res.status).toBe(200);
    const refund = queries.find((query) =>
      query.sql.includes('UPDATE affiliate_profiles') && query.sql.includes('SELECT ap.amount'));
    expect(refund?.params).toEqual(['TRF_reversed', 'TRF_reversed']);
    expect(JSON.stringify(refund?.params)).not.toContain('999999');
    expect(queries.some((query) => query.sql.includes("'transfer.reversed'"))).toBe(true);
  });
});
