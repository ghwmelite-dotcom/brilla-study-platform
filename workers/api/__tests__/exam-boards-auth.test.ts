import { describe, it, expect, vi } from 'vitest';
import { sign } from 'hono/jwt';
import { examBoardsApp } from '../exam-boards';

// Task 8: POST /seed-questions used to trust a body.secretKey compared
// against JWT_SECRET. It is now gated behind requireAdmin (verified JWT +
// fresh users-table role lookup). These tests pin the new behavior.

const JWT_SECRET = 'test-secret-that-is-long-enough';

function makeDb(userRow: unknown, batchResults: unknown[] = [{ meta: { changes: 1 } }]) {
  const stmt = {
    bind: vi.fn(),
    first: vi.fn().mockResolvedValue(userRow),
    all: vi.fn().mockResolvedValue({ results: [] }),
    run: vi.fn().mockResolvedValue({ success: true }),
  };
  stmt.bind.mockReturnValue(stmt);
  return {
    prepare: vi.fn(() => stmt),
    batch: vi.fn().mockResolvedValue(batchResults),
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

  it('rejects an inconsistent question tuple before any insert batch', async () => {
    const db = makeDb(
      { role: 'admin', status: 'approved', is_active: 1 },
      [{ results: [{ is_valid: 0 }], meta: { changes: 0 } }],
    );
    const t = await token({ userId: 'admin_1', role: 'admin' });
    const res = await examBoardsApp.fetch(
      new Request('http://x/seed-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
        body: JSON.stringify({
          questions: [{
            id: 'q_bad', subject_id: 'subject-a', topic_id: 'topic-b', exam_type_id: 'exam-a',
            question_text: 'Invalid tuple', question_type: 'short_answer',
            correct_answer: 'No', explanation: 'Mismatch', difficulty: 'easy',
          }],
        }),
      }),
      { DB: db, JWT_SECRET },
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ code: 'QUESTION_RELATIONSHIP_MISMATCH', index: 0 });
    expect(db.batch).toHaveBeenCalledTimes(1);
  });
});
