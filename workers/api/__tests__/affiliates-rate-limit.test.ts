import { describe, it, expect } from 'vitest';
import { affiliatesApp } from '../affiliates';
import { createMockD1, type MockHandler } from './helpers/mockD1';

// The public affiliate endpoints used to be throttled by a per-isolate
// in-memory Map — ineffective on Workers, where each isolate has its own
// copy. They now use the shared D1-backed checkRateLimit from rate-limit.ts.
// These tests drive the endpoints through the D1 mock, simulating the
// rate_limits rolling-window counter semantics of checkRateLimit's atomic
// INSERT ... WHERE total < max ... RETURNING: a row while under the limit,
// null (blocked) once the per-(identifier, endpoint) total is reached.

function env(db: unknown) {
  return { DB: db, JWT_SECRET: 'test-secret', APP_URL: 'https://app.example' };
}
const IP_A = { 'cf-connecting-ip': '9.9.9.1' };
const IP_B = { 'cf-connecting-ip': '9.9.9.2' };

function rateLimitHandler(totals: Map<string, number>): MockHandler {
  return {
    match: /WITH usage\(total_requests\)/,
    first: (binds) => {
      // bind order: identifier, endpoint, rollingStart, identifier,
      // endpoint, bucketStart, maxRequests, maxRequests
      const max = binds[6] as number;
      const key = `${binds[0]}|${binds[1]}`;
      const total = totals.get(key) ?? 0;
      if (total >= max) return null;
      totals.set(key, total + 1);
      return { request_count: 1, total_requests: total + 1 };
    },
  };
}

describe('GET /validate-code/:code throttling (D1-backed)', () => {
  function makeDb(totals: Map<string, number>) {
    return createMockD1([
      rateLimitHandler(totals),
      { match: /FROM affiliate_profiles ap/, first: () => ({ school_name: 'Test School' }) },
    ]);
  }

  it('allows 30 validations per IP per minute, then returns 429', async () => {
    const db = makeDb(new Map());
    for (let i = 0; i < 30; i++) {
      const res = await affiliatesApp.request('/validate-code/ABC123XY', { headers: IP_A }, env(db));
      expect(res.status).toBe(200);
      expect(await res.json()).toMatchObject({ success: true, data: { valid: true } });
    }
    const res = await affiliatesApp.request('/validate-code/ABC123XY', { headers: IP_A }, env(db));
    expect(res.status).toBe(429);
    expect(await res.json()).toMatchObject({ success: false, error: 'Too many requests' });
  });

  it('keeps per-IP buckets separate', async () => {
    const db = makeDb(new Map());
    for (let i = 0; i < 30; i++) {
      await affiliatesApp.request('/validate-code/ABC123XY', { headers: IP_A }, env(db));
    }
    const res = await affiliatesApp.request('/validate-code/ABC123XY', { headers: IP_B }, env(db));
    expect(res.status).toBe(200);
  });
});

describe('GET /ref/:code throttling (D1-backed)', () => {
  function makeDb(totals: Map<string, number>) {
    return createMockD1([
      rateLimitHandler(totals),
      { match: /SELECT id FROM affiliate_profiles/, first: () => ({ id: 'aff_1' }) },
      { match: /FROM affiliate_clicks/, first: () => null },
      { match: /INSERT INTO affiliate_clicks/, run: () => ({ success: true, meta: { changes: 1 } }) },
      { match: /UPDATE affiliate_profiles/, run: () => ({ success: true, meta: { changes: 1 } }) },
    ]);
  }

  it('tracks 10 clicks per IP per minute, then redirects without tracking', async () => {
    const db = makeDb(new Map());
    for (let i = 0; i < 10; i++) {
      const res = await affiliatesApp.request('/ref/ABC123XY', { headers: IP_A }, env(db));
      expect(res.status).toBe(302);
      expect(res.headers.get('Location')).toBe('https://app.example/register?ref=ABC123XY');
    }
    // 11th request: still redirects, but the rate limiter denied it before
    // the affiliate lookup, so no click is tracked.
    const res = await affiliatesApp.request('/ref/ABC123XY', { headers: IP_A }, env(db));
    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toBe('https://app.example/register?ref=ABC123XY');

    const affiliateLookups = db.calls.filter((c) =>
      c.sql.includes('SELECT id FROM affiliate_profiles'),
    );
    const clickInserts = db.calls.filter((c) => c.sql.includes('INSERT INTO affiliate_clicks'));
    expect(affiliateLookups).toHaveLength(10);
    expect(clickInserts).toHaveLength(10);
  });
});
