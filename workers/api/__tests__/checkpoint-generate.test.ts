import { describe, it, expect } from 'vitest';
import { sign } from 'hono/jwt';
import worker from '../index';
import { createMockD1, type MockHandler } from './helpers/mockD1';

// Regression test for the parsed-JSON AI response shape: the live
// llama-3.3-70b-instruct-fp8-fast binding returns `response` as an
// ALREADY-PARSED object when the model output is bare valid JSON (proven in
// commit 390674f). Checkpoint MCQ generation string-processes the response
// (content.match), so a parsed-object response used to throw TypeError and the
// catch silently served the generic fallback question. Both shapes must yield
// the generated question.

const JWT_SECRET = 'test-secret-that-is-long-enough';

async function token(payload: object) {
  return sign(
    { ...payload, exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000) },
    JWT_SECRET,
  );
}

const authHandler: MockHandler = {
  match: /SELECT role, status, is_active FROM users/,
  first: () => ({ role: 'student', status: 'approved', is_active: 1 }),
};

const premiumHandler: MockHandler = {
  match: /SELECT role, subscription_tier_id, subscription_expires_at, trial_expires_at\s*FROM users/,
  first: () => ({
    role: 'student',
    subscription_tier_id: 'tier_premium',
    subscription_expires_at: '2099-01-01T00:00:00.000Z',
    trial_expires_at: null,
  }),
};

const lessonHandler: MockHandler = {
  match: /FROM revision_lessons rl/,
  first: () => ({
    id: 'lesson_1',
    topic_id: 'topic_1',
    topic_name: 'Algebra',
    subject_name: 'Core Mathematics',
    exam_type: 'wassce',
    user_id: 'user_1',
  }),
};

// Covers the max-order SELECT and both INSERTs (defaults: first -> null, run -> success).
const checkpointTablesHandler: MockHandler = {
  match: /revision_checkpoints|revision_ai_interactions/,
};

const QUESTION = {
  question: 'What is the value of x when 2x = 10?',
  options: ['A) 2', 'B) 5', 'C) 10', 'D) 20'],
  correctAnswer: 'B',
  explanation: 'Dividing both sides by 2 gives x = 5.',
};

const FALLBACK_MARKER = 'Which of the following best describes';

async function generate(db: unknown, ai: unknown) {
  const t = await token({ userId: 'user_1', role: 'student' });
  return worker.fetch(
    new Request('http://x/api/revision-classroom/lessons/lesson_1/checkpoint/generate', {
      method: 'POST',
      headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ difficulty: 'medium' }),
    }),
    { DB: db as D1Database, JWT_SECRET, AI: ai as Ai },
  );
}

describe('checkpoint question generation', () => {
  it('handles an already-parsed JSON response without falling back', async () => {
    const parsedJsonAi = {
      run: async () => ({ response: QUESTION, usage: { total_tokens: 60 } }),
    };
    const db = createMockD1([authHandler, premiumHandler, lessonHandler, checkpointTablesHandler]);

    const res = await generate(db, parsedJsonAi);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      success: boolean;
      data: { question: string; options: string[]; difficulty: string };
    };
    expect(body.success).toBe(true);
    expect(body.data.question).toBe(QUESTION.question);
    expect(body.data.question).not.toContain(FALLBACK_MARKER);
    expect(body.data.options).toHaveLength(4);
  });

  it('still handles a prose-wrapped string response (behavior unchanged)', async () => {
    const stringAi = {
      run: async () => ({
        response: `Sure! Here is the question:\n${JSON.stringify(QUESTION)}\nGood luck!`,
        usage: { total_tokens: 60 },
      }),
    };
    const db = createMockD1([authHandler, premiumHandler, lessonHandler, checkpointTablesHandler]);

    const res = await generate(db, stringAi);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { question: string; options: string[] } };
    expect(body.data.question).toBe(QUESTION.question);
    expect(body.data.options).toHaveLength(4);
  });
});
