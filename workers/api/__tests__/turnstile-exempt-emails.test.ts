import { describe, it, expect, vi } from 'vitest';
import worker from '../index';

// Demo access has been removed: the TURNSTILE_EXEMPT_EMAILS exemption no
// longer exists. Formerly-exempt demo accounts (teacher@/student@/parent@
// brillaprep.org) must now present a Turnstile token like everyone else when
// TURNSTILE_SECRET is set — no token means 400.
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

describe('login Turnstile gate — no demo exemption', () => {
  it('admin@brillaprep.org without turnstileToken returns 400 Security verification required', async () => {
    const res = await loginRequest('admin@brillaprep.org');
    expect(res.status).toBe(400);
    const body = await res.json() as { success: boolean; error: string };
    expect(body.error).toBe('Security verification required.');
  });

  it('student@brillaprep.org (former demo account) without turnstileToken returns 400', async () => {
    const res = await loginRequest('student@brillaprep.org');
    expect(res.status).toBe(400);
    const body = await res.json() as { success: boolean; error: string };
    expect(body.error).toBe('Security verification required.');
  });

  it('teacher@brillaprep.org (former demo account) without turnstileToken returns 400', async () => {
    const res = await loginRequest('teacher@brillaprep.org');
    expect(res.status).toBe(400);
    const body = await res.json() as { success: boolean; error: string };
    expect(body.error).toBe('Security verification required.');
  });

  it('parent@brillaprep.org (former demo account, mixed case) without turnstileToken returns 400', async () => {
    const res = await loginRequest('Parent@BrillaPrep.org');
    expect(res.status).toBe(400);
    const body = await res.json() as { success: boolean; error: string };
    expect(body.error).toBe('Security verification required.');
  });

  it('staff@brillaprep.org without token returns 400', async () => {
    const res = await loginRequest('staff@brillaprep.org');
    expect(res.status).toBe(400);
    const body = await res.json() as { success: boolean; error: string };
    expect(body.error).toBe('Security verification required.');
  });
});
