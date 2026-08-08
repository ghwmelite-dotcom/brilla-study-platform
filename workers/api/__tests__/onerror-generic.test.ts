import { describe, it, expect } from 'vitest';
import worker from '../index';

// Task 17: the global app.onError must log detail server-side and return the
// generic envelope — never the internal error message.
//
// Approach: exercise the REAL onError handler through the REAL app. The login
// handler parses its JSON body outside its try/catch (index.ts:1221; the first
// `try` in that handler is at :1277), so a malformed body throws and the
// exception escapes the handler into Hono, which invokes app.onError.
// (A broken-DB mock does not work: checkRateLimit fails open and the DB user
// lookup sits inside the handler's own try/catch.)
const env = { DB: {} as unknown as D1Database, JWT_SECRET: 'test-secret' };

describe('global onError generic message', () => {
  it('thrown route errors return exactly the generic envelope', async () => {
    const res = await worker.fetch(
      new Request('http://x/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"email": "db connection string xyz', // malformed JSON → SyntaxError
      }),
      env,
    );
    expect(res.status).toBe(500);
    // Exact body: no internal detail (no SyntaxError message, no stack).
    expect(await res.json()).toEqual({ success: false, error: 'Internal server error' });
  });
});
