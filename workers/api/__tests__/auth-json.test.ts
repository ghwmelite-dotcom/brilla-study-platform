import { describe, it, expect, vi } from 'vitest';
import worker from '../index';

// Task 21: registration error semantics + guarded JSON parsing.
//
// 1. A malformed JSON body must produce a clean 400 ('Invalid JSON body')
//    from the handler's guarded parse — never a 500 from the global onError.
// 2. A genuine server-side failure during registration (e.g. D1 error) must
//    surface as 500, not be masqueraded as a client 400.

const JWT_SECRET = 'test-secret-that-is-long-enough';

describe('guarded JSON parsing + register error semantics', () => {
  it('POST /auth/login with a malformed JSON body returns 400, not 500', async () => {
    const res = await worker.fetch(
      new Request('http://x/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not-json',
      }),
      // Parse is the handler's first statement, so the DB is never touched.
      { DB: {} as unknown as D1Database, JWT_SECRET },
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ success: false, error: 'Invalid JSON body' });
  });

  it('POST /auth/register surfaces a forced DB error as 500', async () => {
    // Every statement rejects. checkRateLimit fails open on DB errors, then
    // the email-exists lookup inside the handler's try/catch rejects and the
    // catch must answer 500 'Registration failed'.
    const db = {
      prepare: vi.fn((sql: string) => ({
        sql,
        bind: () => ({
          first: vi.fn().mockRejectedValue(new Error('forced D1 failure')),
          all: vi.fn().mockRejectedValue(new Error('forced D1 failure')),
          run: vi.fn().mockRejectedValue(new Error('forced D1 failure')),
        }),
      })),
      batch: vi.fn().mockRejectedValue(new Error('forced D1 failure')),
    } as unknown as D1Database;

    const res = await worker.fetch(
      new Request('http://x/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'new.student@example.com',
          password: 'S3cure!Pass',
          name: 'New Student',
          role: 'student',
        }),
      }),
      { DB: db, JWT_SECRET },
    );
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ success: false, error: 'Registration failed' });
  });
});
