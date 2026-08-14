import { describe, it, expect } from 'vitest';
import { sign } from 'hono/jwt';
import worker from '../index';
import { createMockD1, type MockHandler } from './helpers/mockD1';

const JWT_SECRET = 'test-secret-that-is-long-enough';

async function token(payload: object) {
  return sign(
    { ...payload, exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000) },
    JWT_SECRET,
  );
}

const authHandler: MockHandler = {
  match: /SELECT role, status, is_active, session_version FROM users/,
  first: () => ({ role: 'student', status: 'approved', is_active: 1 }),
};

const lessonHandler: MockHandler = {
  match: /FROM revision_lessons rl/,
  first: () => ({
    id: 'lesson_1', session_id: 'session_1', topic_id: 'topic_1',
    topic_name: 'Algebra', subject_name: 'Mathematics', exam_type: 'nsmq', user_id: 'user_1',
  }),
};

const premiumHandler: MockHandler = {
  match: /SELECT role, subscription_tier_id, subscription_expires_at, trial_expires_at\s+FROM users/,
  first: () => ({
    role: 'student', subscription_tier_id: 'tier_student_monthly',
    subscription_expires_at: new Date(Date.now() + 86400000).toISOString(), trial_expires_at: null,
  }),
};

const freeHandler: MockHandler = {
  match: /SELECT role, subscription_tier_id, subscription_expires_at, trial_expires_at\s+FROM users/,
  first: () => ({
    role: 'student', subscription_tier_id: 'tier_free',
    subscription_expires_at: null, trial_expires_at: null,
  }),
};

const cappedHandler: MockHandler = {
  match: /SELECT COUNT\(\*\) AS count FROM revision_ai_interactions/,
  first: () => ({ count: 10 }),
};

function post(path: string, db: unknown, body: object) {
  return token({ userId: 'user_1', role: 'student' }).then((t) =>
    worker.fetch(
      new Request(`http://x/api/revision-classroom${path}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
      { DB: db as D1Database, JWT_SECRET },
    ),
  );
}

describe('whiteboard-teach premium gate', () => {
  it('rejects free users with 403 upgradeRequired before any AI work', async () => {
    const db = createMockD1([authHandler, lessonHandler, freeHandler]);
    const res = await post('/lessons/lesson_1/whiteboard-teach', db, { lessonType: 'diagram' });
    expect(res.status).toBe(403);
    const body = (await res.json()) as { success: boolean; upgradeRequired?: boolean };
    expect(body.success).toBe(false);
    expect(body.upgradeRequired).toBe(true);
    // no interaction recorded for a rejected request
    expect(db.calls.some((c) => /INSERT INTO revision_ai_interactions/.test(c.sql))).toBe(false);
  });
});

describe('teach daily AI allowance', () => {
  it('rejects a capped free user with 403 aiLimitReached', async () => {
    const db = createMockD1([authHandler, lessonHandler, freeHandler, cappedHandler]);
    const res = await post('/lessons/lesson_1/teach', db, { phase: 'hook', previousMessages: [] });
    expect(res.status).toBe(403);
    const body = (await res.json()) as { aiLimitReached?: boolean; remaining?: number };
    expect(body.aiLimitReached).toBe(true);
    expect(body.remaining).toBe(0);
  });
});
