import { describe, it, expect, vi } from 'vitest';
import worker from '../index';

// Regression tests for the /auth/reset-demo-passwords hardening:
// the demo passwords are public knowledge, so the endpoint must return
// 404 outside local development (ENVIRONMENT 'development'/'dev').
const JWT_SECRET = 'test-secret-that-is-long-enough';

interface DbOptions {
  existingEmails?: string[];
  rateLimitCount?: number;
}

// Minimal D1 mock covering the queries /auth/reset-demo-passwords +
// checkRateLimit make.
function makeDb({ existingEmails = [], rateLimitCount = 0 }: DbOptions = {}) {
  let rateRequests = rateLimitCount;
  const calls: { sql: string; args: unknown[] }[] = [];
  const db = {
    prepare: vi.fn((sql: string) => {
      const statement = (args: unknown[]) => ({
        first: vi.fn().mockImplementation(() => {
          if (sql.includes('FROM rate_limits') && sql.includes('SUM(request_count)')) {
            return Promise.resolve({ total_requests: rateRequests, last_request: null });
          }
          if (sql.includes('FROM rate_limits') && sql.includes('SELECT id, request_count')) {
            return Promise.resolve(
              rateRequests > 0 ? { id: 1, request_count: rateRequests } : null,
            );
          }
          if (sql.includes('FROM users WHERE email = ?')) {
            return Promise.resolve(
              existingEmails.includes(args[0] as string) ? { id: 'existing_1' } : null,
            );
          }
          return Promise.resolve(null);
        }),
        all: vi.fn().mockResolvedValue({ results: [] }),
        run: vi.fn().mockImplementation(() => {
          if (sql.includes('rate_limits')) {
            rateRequests += 1;
          }
          return Promise.resolve({ success: true });
        }),
      });
      return {
        ...statement([]),
        bind: (...args: unknown[]) => {
          calls.push({ sql, args });
          return statement(args);
        },
      };
    }),
  } as unknown as D1Database;
  return { db, calls };
}

function resetRequest() {
  return new Request('http://x/api/auth/reset-demo-passwords', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
}

describe('/auth/reset-demo-passwords hardening', () => {
  it('returns 404 when ENVIRONMENT is production', async () => {
    const { db, calls } = makeDb();
    const res = await worker.fetch(resetRequest(), {
      DB: db,
      JWT_SECRET,
      ENVIRONMENT: 'production',
    });
    expect(res.status).toBe(404);
    expect(await res.json()).toMatchObject({ success: false, error: 'Not found' });
    // No password reset or user creation may happen outside development.
    expect(calls.some((c) => c.sql.includes('UPDATE users SET password_hash'))).toBe(false);
    expect(calls.some((c) => c.sql.includes('INSERT INTO users'))).toBe(false);
  });

  it('returns 404 when ENVIRONMENT is unset', async () => {
    const { db } = makeDb();
    const res = await worker.fetch(resetRequest(), { DB: db, JWT_SECRET });
    expect(res.status).toBe(404);
  });

  it('resets demo passwords when ENVIRONMENT is development', async () => {
    const { db, calls } = makeDb({ existingEmails: ['teacher@brillaprep.org'] });
    const res = await worker.fetch(resetRequest(), {
      DB: db,
      JWT_SECRET,
      ENVIRONMENT: 'development',
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.results).toEqual([
      { email: 'teacher@brillaprep.org', status: 'password_reset' },
      { email: 'student@brillaprep.org', status: 'created' },
    ]);
    expect(calls.some((c) => c.sql.includes('UPDATE users SET password_hash'))).toBe(true);
  });
});
