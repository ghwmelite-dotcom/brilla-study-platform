import { describe, it, expect, vi } from 'vitest';
import { sign } from 'hono/jwt';
import { examBoardsApp } from '../exam-boards';

// Task 8: POST /seed-questions used to trust a body.secretKey compared
// against JWT_SECRET. It is now gated behind requireAdmin (verified JWT +
// fresh users-table role lookup). These tests pin the new behavior.

const JWT_SECRET = 'test-secret-that-is-long-enough';

function makeDb(userRow: unknown) {
  const stmt = {
    bind: vi.fn(),
    first: vi.fn().mockResolvedValue(userRow),
    all: vi.fn().mockResolvedValue({ results: [] }),
    run: vi.fn().mockResolvedValue({ success: true }),
  };
  stmt.bind.mockReturnValue(stmt);
  return {
    prepare: vi.fn(() => stmt),
    batch: vi.fn().mockResolvedValue([{ meta: { changes: 1 } }]),
  } as unknown as D1Database;
}

async function token(payload: object) {
  return sign(
    { ...payload, exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000) },
    JWT_SECRET,
  );
}

function postSeed(headers: Record<string, string> = {}) {
  return examBoardsApp.fetch(
    new Request('http://x/seed-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ secretKey: JWT_SECRET, questions: [] }),
    }),
    { DB: makeDb({ role: 'student', status: 'approved', is_active: 1 }), JWT_SECRET },
  );
}

describe('exam-boards POST /seed-questions auth gate', () => {
  it('returns 401 for the old secretKey body with no token', async () => {
    const res = await postSeed();
    expect(res.status).toBe(401);
  });

  it('returns 403 for a valid non-admin token', async () => {
    const t = await token({ userId: 'student_1', role: 'student' });
    const res = await postSeed({ Authorization: `Bearer ${t}` });
    expect(res.status).toBe(403);
  });
});
