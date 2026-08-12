import { describe, it, expect } from 'vitest';
import worker from '../index';

// Task 17: the global app.onError must log detail server-side and return the
// generic envelope — never the internal error message.
//
// Approach: exercise the REAL onError handler through the REAL app.
// /auth/set-password parses its JSON body as the first statement of the
// handler (index.ts, unguarded `await c.req.json()` before any try/catch),
// so a malformed body throws and the exception escapes the handler into
// Hono, which invokes app.onError.
// (A broken-DB mock does not work: checkRateLimit fails open and the DB user
// lookup sits inside the handler's own try/catch.)
//
// Task 21 note: this test previously used /auth/login, whose JSON parse is
// now guarded by parseJsonBody (malformed body → 400, see auth-json.test.ts).
// /auth/set-password keeps the same unguarded-parse shape login used to have,
// so it remains a faithful proof of the global onError path.
const env = { DB: {} as unknown as D1Database, JWT_SECRET: 'test-secret' };

describe('global onError generic message', () => {
  it('thrown route errors return exactly the generic envelope', async () => {
    const res = await worker.fetch(
      new Request('http://x/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"token": "db connection string xyz', // malformed JSON → SyntaxError
      }),
      env,
    );
    expect(res.status).toBe(500);
    // Exact body: no internal detail (no SyntaxError message, no stack).
    expect(await res.json()).toEqual({ success: false, error: 'Internal server error' });
  });
});
