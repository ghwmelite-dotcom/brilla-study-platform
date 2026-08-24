import { describe, it, expect } from 'vitest';
import { sign } from 'hono/jwt';
import worker from '../index';
import { createMockD1, type MockHandler } from './helpers/mockD1';

// Regression tests for the user_progress write path: POST /questions/:id/attempt
// must upsert user_progress (keyed by user_id/topic_id/exam_type_id) in the
// same batch as the question_attempts insert, with mastery_level recomputed
// from cumulative counters. Also covers the NULL exam_type_id case, where
// SQLite UNIQUE never conflict-matches and an explicit SELECT+INSERT/UPDATE
// is used instead of ON CONFLICT.

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

// Freemium usage-limits plumbing: non-premium student, no usage recorded.
const usageHandlers: MockHandler[] = [
  {
    match: /SELECT role, subscription_tier_id, subscription_expires_at, trial_expires_at/,
    first: () => ({
      role: 'student',
      subscription_tier_id: null,
      subscription_expires_at: null,
      trial_expires_at: null,
    }),
  },
  { match: /INSERT INTO daily_usage/, first: () => ({ question_count: 1 }) },
  {
    match: /SELECT question_count FROM daily_usage/,
    first: () => ({ question_count: 1 }),
  },
];

function questionHandler(question: Record<string, unknown>): MockHandler {
  return {
    match: /SELECT q\.\*, s\.slug AS subject_slug, et\.slug AS exam_type_slug/,
    first: () => ({ ...question, subject_slug: 'wassce-core-mathematics', exam_type_slug: 'wassce' }),
  };
}

const writeHandlers: MockHandler[] = [
  { match: /INSERT INTO question_attempts/ },
  { match: /INSERT INTO user_progress/ },
  { match: /UPDATE user_progress SET/ },
];

async function attempt(db: unknown, questionId: string, answer: string) {
  const t = await token({ userId: 'user_1', role: 'student' });
  return worker.fetch(
    new Request(`http://x/api/questions/${questionId}/attempt`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer }),
    }),
    { DB: db as D1Database, JWT_SECRET },
  );
}

const baseQuestion = {
  id: 'q1',
  topic_id: 'topic_1',
  exam_type_id: 'exam_wassce',
  correct_answer: 'A',
  explanation: 'because',
  points: 10,
};

describe('POST /api/questions/:id/attempt user_progress write path', () => {
  it('inserts user_progress with mastery 100 on a first correct attempt', async () => {
    const db = createMockD1([
      authHandler,
      ...usageHandlers,
      questionHandler(baseQuestion),
      ...writeHandlers,
    ]);

    const res = await attempt(db, 'q1', 'A');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean; data: { isCorrect: boolean } };
    expect(body.success).toBe(true);
    expect(body.data.isCorrect).toBe(true);

    const attemptInsert = db.calls.find((c) => /INSERT INTO question_attempts/.test(c.sql));
    expect(attemptInsert).toBeDefined();
    expect(attemptInsert!.binds[1]).toBe('user_1');
    expect(attemptInsert!.binds[4]).toBe(1); // is_correct

    const upsert = db.calls.find((c) => /INSERT INTO user_progress/.test(c.sql));
    expect(upsert).toBeDefined();
    expect(upsert!.sql).toContain('ON CONFLICT(user_id, topic_id, exam_type_id) DO UPDATE SET');
    // binds: id, user_id, topic_id, exam_type_id, questions_correct, mastery_level, ...
    expect(upsert!.binds[1]).toBe('user_1');
    expect(upsert!.binds[2]).toBe('topic_1');
    expect(upsert!.binds[3]).toBe('exam_wassce');
    expect(upsert!.binds[4]).toBe(1); // questions_correct on first correct attempt
    expect(upsert!.binds[5]).toBe(100); // mastery_level = 100 * 1/1
    // ISO timestamps (Phase 2 convention, not datetime('now'))
    expect(upsert!.binds[6]).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(upsert!.binds[7]).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    // demo flags carried over for the cron cleanup (user_progress is in DEMO_DATA_TABLES)
    expect(upsert!.binds[9]).toBe(0);
    expect(upsert!.binds[10]).toBeNull();
  });

  it('recomputes mastery from cumulative counters on a subsequent wrong attempt', async () => {
    const db = createMockD1([
      authHandler,
      ...usageHandlers,
      questionHandler(baseQuestion),
      ...writeHandlers,
    ]);

    // First attempt: correct.
    await attempt(db, 'q1', 'A');
    // Second attempt: wrong. The mock does not persist state, so the upsert
    // SQL itself must carry the recompute from old counter values.
    const res = await attempt(db, 'q1', 'B');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { isCorrect: boolean } };
    expect(body.data.isCorrect).toBe(false);

    const upserts = db.calls.filter((c) => /INSERT INTO user_progress/.test(c.sql));
    expect(upserts).toHaveLength(2);
    const second = upserts[1];
    // mastery is recomputed in SQL from the existing row, not from a stale read
    expect(second.sql).toContain('questions_attempted = questions_attempted + 1');
    expect(second.sql).toContain('questions_correct = questions_correct + excluded.questions_correct');
    expect(second.sql).toContain(
      'mastery_level = ROUND(100.0 * (questions_correct + excluded.questions_correct) / (questions_attempted + 1))'
    );
    expect(second.binds[4]).toBe(0); // wrong answer adds nothing to questions_correct
    expect(second.binds[5]).toBe(0); // insert-branch mastery for a first wrong attempt
  });

  it('falls back to SELECT + INSERT/UPDATE when exam_type_id is NULL (no ON CONFLICT match)', async () => {
    const nullExamQuestion = { ...baseQuestion, exam_type_id: null };
    const progressLookup: MockHandler = {
      match: /SELECT id FROM user_progress/,
      first: () => null, // no existing row yet
    };
    const db = createMockD1([
      authHandler,
      ...usageHandlers,
      questionHandler(nullExamQuestion),
      progressLookup,
      ...writeHandlers,
    ]);

    const res = await attempt(db, 'q1', 'A');
    expect(res.status).toBe(200);

    const lookup = db.calls.find((c) => /SELECT id FROM user_progress/.test(c.sql));
    expect(lookup).toBeDefined();

    const insert = db.calls.find((c) => /INSERT INTO user_progress/.test(c.sql));
    expect(insert).toBeDefined();
    // NULL exam_type_id insert must not rely on ON CONFLICT (it can never match)
    expect(insert!.sql).not.toContain('ON CONFLICT');
    expect(insert!.sql).toContain('VALUES (?, ?, ?, NULL, 1, ?, ?, ?, ?, ?, ?, ?)');
    expect(insert!.binds[3]).toBe(1); // questions_correct (no exam_type_id bind)
    expect(insert!.binds[4]).toBe(100); // mastery_level
  });

  it('updates an existing NULL-exam_type_id progress row instead of duplicating it', async () => {
    const nullExamQuestion = { ...baseQuestion, exam_type_id: null };
    const progressLookup: MockHandler = {
      match: /SELECT id FROM user_progress/,
      first: () => ({ id: 'progress_existing' }),
    };
    const db = createMockD1([
      authHandler,
      ...usageHandlers,
      questionHandler(nullExamQuestion),
      progressLookup,
      ...writeHandlers,
    ]);

    const res = await attempt(db, 'q1', 'B'); // wrong answer
    expect(res.status).toBe(200);

    expect(db.calls.some((c) => /INSERT INTO user_progress/.test(c.sql))).toBe(false);
    const update = db.calls.find((c) => /UPDATE user_progress SET/.test(c.sql));
    expect(update).toBeDefined();
    expect(update!.sql).toContain(
      'mastery_level = ROUND(100.0 * (questions_correct + ?) / (questions_attempted + 1))'
    );
    expect(update!.binds[0]).toBe(0); // wrong answer
    expect(update!.binds[update!.binds.length - 1]).toBe('progress_existing');
  });
});
