import { afterEach, describe, expect, it, vi } from 'vitest';
import { sign } from 'hono/jwt';
import { paymentsApp } from '../payments';

type Query = { sql: string; params: unknown[] };

function createMockDb() {
  const queries: Query[] = [];
  const db = {
    prepare(sql: string) {
      return {
        bind(...params: unknown[]) {
          queries.push({ sql, params });
          let row: Record<string, unknown> | null = null;
          if (sql.includes('role, status, is_active, session_version FROM users')) {
            row = { role: 'student', status: 'approved', is_active: 1, session_version: 0 };
          } else if (sql.includes('SELECT id, email, name, role FROM users')) {
            row = { id: 'user_1', email: 'student@example.com', name: 'Student', role: 'student' };
          } else if (sql.includes('FROM subscription_tiers')) {
            row = { id: 'tier_pro', price_monthly: 25, price_yearly: 250 };
          }
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

const JWT_SECRET = 'test-secret';

afterEach(() => vi.unstubAllGlobals());

async function authorization() {
  const token = await sign({
    userId: 'user_1',
    email: 'student@example.com',
    role: 'student',
    exp: Math.floor(Date.now() / 1000) + 3600,
  }, JWT_SECRET);
  return `Bearer ${token}`;
}

describe('POST /payments/initialize', () => {
  it('marks the local transaction failed when Paystack initialization fails', async () => {
    const { db, queries } = createMockDb();
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      status: false,
      message: 'Provider unavailable',
    }))));

    const response = await paymentsApp.request('/initialize', {
      method: 'POST',
      headers: {
        Authorization: await authorization(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ planId: 'tier_pro', billingCycle: 'monthly' }),
    }, {
      DB: db,
      JWT_SECRET,
      PAYSTACK_SECRET_KEY: 'sk_test_x',
      PAYSTACK_PUBLIC_KEY: 'pk_test_x',
      APP_URL: 'https://brillaprep.org',
    });

    expect(response.status).toBe(500);
    expect(queries.some((query) => query.sql.includes('INSERT INTO payment_transactions'))).toBe(true);
    const failure = queries.find((query) =>
      query.sql.includes('UPDATE payment_transactions') && query.sql.includes("status = 'failed'"));
    expect(failure).toBeDefined();
    expect(failure?.params[0]).toBe(JSON.stringify({ status: 'initialization_failed' }));
  });
  it('fails closed when Paystack returns a different reference', async () => {
    const { db, queries } = createMockDb();
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      status: true,
      data: {
        authorization_url: 'https://checkout.paystack.test/redirect',
        access_code: 'access_test',
        reference: 'SUB_PROVIDER_DIFFERENT',
      },
    }))));

    const response = await paymentsApp.request('/initialize', {
      method: 'POST',
      headers: {
        Authorization: await authorization(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ planId: 'tier_pro', billingCycle: 'monthly' }),
    }, {
      DB: db,
      JWT_SECRET,
      PAYSTACK_SECRET_KEY: 'sk_test_x',
      PAYSTACK_PUBLIC_KEY: 'pk_test_x',
      APP_URL: 'https://brillaprep.org',
    });

    expect(response.status).toBe(502);
    const failure = queries.find((query) =>
      query.sql.includes('UPDATE payment_transactions') && query.sql.includes("status = 'failed'"));
    expect(failure).toBeDefined();
    expect(failure?.params[0]).toBe(JSON.stringify({ status: 'initialization_reference_mismatch' }));
  });
});
