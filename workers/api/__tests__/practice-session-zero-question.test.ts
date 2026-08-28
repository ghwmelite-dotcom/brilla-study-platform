import { expect, it } from 'vitest';
import { sign } from 'hono/jwt';
import worker from '../index';
import { createMockD1, type MockHandler } from './helpers/mockD1';

const JWT_SECRET = 'practice-session-zero-question-secret';
const authHandler: MockHandler = {
  match: /SELECT role, status, is_active, session_version FROM users WHERE id = \?/,
  first: () => ({ role: 'student', status: 'approved', is_active: 1, session_version: 0 }),
};

it('rejects a completed practice session with zero attempt-backed questions and performs no insert', async () => {
  const now = Math.floor(Date.now() / 1000);
  const token = await sign({
    userId: 'student_zero',
    role: 'student',
    sessionVersion: 0,
    iat: now,
    exp: now + 3600,
  }, JWT_SECRET);
  const db = createMockD1([authHandler]);
  const response = await worker.fetch(new Request('http://x/api/practice/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      mode: 'topic_drill',
      clientRequestId: 'request_zero',
      attemptIds: [],
    }),
  }), { DB: db as D1Database, JWT_SECRET });

  expect(response.status).toBe(400);
  expect(db.calls.some(({ sql }) => /INSERT INTO practice_sessions/.test(sql))).toBe(false);
});
