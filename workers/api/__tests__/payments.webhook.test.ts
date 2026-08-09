import { describe, it, expect } from 'vitest';
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
    expect(refund!.params).toEqual([100, 'ap_1']);
  });
});
