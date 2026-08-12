import { describe, it, expect, vi } from 'vitest';
import worker from '../index';

// Tests the login Turnstile skip narrowing: only the explicit
// TURNSTILE_EXEMPT_EMAILS accounts (teacher@/student@/parent@brillaprep.org)
// may skip the gate. Any other account on the @brillaprep.org domain — e.g.
// admin@brillaprep.org — must present a Turnstile token when TURNSTILE_SECRET
// is set.
//
// Approach: full-route test through the worker app (same pattern as
// index-auth.test.ts) with D1 mocked per-SQL so rate-limit checks pass and
// the users lookup returns null (yielding a 401 past the gate).

const env = {
  DB: {
    prepare: vi.fn((_sql: string) => ({
      bind: vi.fn((..._args: unknown[]) => ({
        first: vi.fn().mockResolvedValue(null),
        run: vi.fn().mockResolvedValue({ success: true }),
        all: vi.fn().mockResolvedValue({ results: [] }),
      })),
    })),
  } as unknown as D1Database,
  JWT_SECRET: 'test-secret',
  TURNSTILE_SECRET: 'test-turnstile-secret',
};

function loginRequest(email: string) {
  return worker.fetch(
    new Request('http://x/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'whatever' }),
    }),
    env,
  );
}

describe('login Turnstile exemption narrowing', () => {
  it('admin@brillaprep.org without turnstileToken returns 400 Security verification required', async () => {
    const res = await loginRequest('admin@brillaprep.org');
    expect(res.status).toBe(400);
    const body = await res.json() as { success: boolean; error: string };
    expect(body.error).toBe('Security verification required.');
  });

  it('student@brillaprep.org without turnstileToken passes the Turnstile gate', async () => {
    const res = await loginRequest('student@brillaprep.org');
    // Gate skipped → reaches credential check; mocked DB has no user → 401.
    expect(res.status).toBe(401);
    const body = await res.json() as { success: boolean; error: string };
    expect(body.error).not.toContain('Security verification');
  });

  it('Student@BrillaPrep.org (mixed case) also passes the Turnstile gate', async () => {
    const res = await loginRequest('Student@BrillaPrep.org');
    expect(res.status).toBe(401);
    const body = await res.json() as { success: boolean; error: string };
    expect(body.error).not.toContain('Security verification');
  });

  it('staff@brillaprep.org (non-exempt domain account) without token returns 400', async () => {
    const res = await loginRequest('staff@brillaprep.org');
    expect(res.status).toBe(400);
    const body = await res.json() as { success: boolean; error: string };
    expect(body.error).toBe('Security verification required.');
  });
});
