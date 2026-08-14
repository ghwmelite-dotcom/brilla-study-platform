import { describe, it, expect } from 'vitest';
import { sign } from 'hono/jwt';
import worker from '../index';
import { createMockD1, type MockHandler } from './helpers/mockD1';

// Task 12 regression tests for quick-play /submit:
// (a) empty answers -> 400 before any DB write (no NaN score can be stored);
// (b) negative timeTaken -> clamped to 0 for storage and excluded from the
//     speed bonus (audit finding 6: negative time guaranteed the bonus);
// (c) grading uses one batched WHERE id IN (...) query, not N per-answer SELECTs.

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

const sessionHandler: MockHandler = {
  match: /SELECT \* FROM quick_play_sessions WHERE id = \?/,
  first: () => ({
    id: 'sess_1',
    user_id: 'user_1',
    game_type: 'speed_blitz',
    completed_at: null,
  }),
};

const writeHandlers: MockHandler[] = [
  { match: /SELECT id, multiplier FROM daily_multipliers/, first: () => null },
  { match: /UPDATE quick_play_sessions/ },
  // awardPoints (question_correct): daily cap read, XP update, cycle lookup,
  // ledger insert, house lookup (unhoused test user -> no house_points row).
  { match: /AS today FROM points_ledger/, first: () => ({ today: 0 }) },
  { match: /UPDATE users SET xp_points = xp_points \+/ },
  { match: /FROM race_cycles rc/, first: () => null },
  { match: /INSERT INTO points_ledger/ },
  { match: /SELECT house FROM users/, first: () => null },
  { match: /INSERT INTO activity_feed/ },
];

async function submit(db: unknown, body: object) {
  const t = await token({ userId: 'user_1', role: 'student' });
  return worker.fetch(
    new Request('http://x/api/quickplay/submit', {
      method: 'POST',
      headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
    { DB: db as D1Database, JWT_SECRET },
  );
}

describe('POST /api/quickplay/submit payload validation and batched grading', () => {
  it('rejects an empty answers array with 400 and writes nothing (no NaN score)', async () => {
    const db = createMockD1([authHandler, sessionHandler, ...writeHandlers]);

    const res = await submit(db, { sessionId: 'sess_1', answers: [], timeTaken: 15000 });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { success: boolean; error: string };
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/non-empty array/);

    // Validation happens before any DB write, so no NaN can reach score/XP.
    expect(db.calls.some((c) => /UPDATE quick_play_sessions/.test(c.sql))).toBe(false);
    expect(db.calls.some((c) => /INSERT INTO activity_feed/.test(c.sql))).toBe(false);
    expect(db.calls.some((c) => c.binds.some((b) => typeof b === 'number' && Number.isNaN(b)))).toBe(false);
  });

  it('rejects malformed answer items with 400', async () => {
    const db = createMockD1([authHandler, sessionHandler, ...writeHandlers]);

    const res = await submit(db, {
      sessionId: 'sess_1',
      answers: [{ questionId: 'q1' }],
      timeTaken: 15000,
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { success: boolean; error: string };
    expect(body.error).toMatch(/Invalid answer shape/);
    expect(db.calls.some((c) => /UPDATE quick_play_sessions/.test(c.sql))).toBe(false);
  });

  it('clamps negative timeTaken to 0 for storage and excludes the speed bonus', async () => {
    const db = createMockD1([
      authHandler,
      sessionHandler,
      {
        match: /SELECT id, correct_answer, explanation FROM questions WHERE id IN/,
        all: () => ({ results: [{ id: 'q1', correct_answer: 'A', explanation: 'because' }] }),
      },
      ...writeHandlers,
    ]);

    const res = await submit(db, {
      sessionId: 'sess_1',
      answers: [{ questionId: 'q1', answer: 'A' }],
      timeTaken: -5000,
    });
    expect(res.status).toBe(200);

    // speed_blitz: baseXp 50, accuracy 1/1 -> 50; no speed bonus; multiplier 1.
    const body = (await res.json()) as { data: { xpEarned: number } };
    expect(body.data.xpEarned).toBe(100);

    const update = db.calls.find((c) => /UPDATE quick_play_sessions/.test(c.sql));
    expect(update).toBeDefined();
    // binds: questions_answered, correct_answers, score, time_taken, xp_earned, multiplier, id
    expect(update!.binds[3]).toBe(0);
    expect(update!.binds[4]).toBe(100);

    const award = db.calls.find((c) => /UPDATE users SET xp_points/.test(c.sql));
    expect(award!.binds[0]).toBe(100);
  });

  it('grades 10 answers with exactly one questions query', async () => {
    const answers = Array.from({ length: 10 }, (_, i) => ({
      questionId: `q${i + 1}`,
      answer: 'A',
    }));
    const db = createMockD1([
      authHandler,
      sessionHandler,
      {
        match: /SELECT id, correct_answer, explanation FROM questions WHERE id IN/,
        all: (binds) => ({
          results: (binds as string[]).map((id) => ({
            id,
            correct_answer: 'A',
            explanation: 'because',
          })),
        }),
      },
      ...writeHandlers,
    ]);

    const res = await submit(db, { sessionId: 'sess_1', answers, timeTaken: 45000 });
    expect(res.status).toBe(200);

    const questionQueries = db.calls.filter((c) => /FROM questions/.test(c.sql));
    expect(questionQueries).toHaveLength(1);
    expect(questionQueries[0].sql).toMatch(/WHERE id IN \(\?,\?,\?,\?,\?,\?,\?,\?,\?,\?\)/);
    expect(questionQueries[0].binds).toEqual(answers.map((a) => a.questionId));

    const body = (await res.json()) as {
      data: { score: number; correctAnswers: number; totalQuestions: number; results: unknown[] };
    };
    expect(body.data.score).toBe(100);
    expect(body.data.correctAnswers).toBe(10);
    expect(body.data.totalQuestions).toBe(10);
    expect(body.data.results).toHaveLength(10);
  });
});
