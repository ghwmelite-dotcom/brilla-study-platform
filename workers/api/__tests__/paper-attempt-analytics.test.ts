import { describe, it, expect, vi } from 'vitest';
import { sign } from 'hono/jwt';
import worker from '../index';
import { createMockD1, type MockHandler, type MockD1 } from './helpers/mockD1';

const JWT_SECRET = 'test-secret-that-is-long-enough';
const USER_ID = 'student_1';
const ATTEMPT_ID = 'att_1';
const PAPER_ID = 'paper_1';

const AUTH_USER = { role: 'student', status: 'approved', is_active: 1, session_version: 0 };

function row(over: Record<string, unknown>) {
  return {
    id: 'a_x', paper_attempt_id: ATTEMPT_ID, question_id: 'q_x',
    user_answer: 'answer', correct_answer: null, marks: 20,
    question_type: 'essay', options: null, question_text: 'Q?',
    topic_id: null, points: 3, subject_name: 'Social Studies',
    marking_scheme: null, marking_rubric: null, model_answer: null,
    required_points: null, optional_points: null,
    marking_status: null, ai_score: null, is_correct: null,
    marks_earned: 0, time_taken: 30, exam_type_id: 'exam_wassce',
    ...over,
  };
}

function makeHarness(opts: { failAnalytics?: boolean } = {}) {
  const store = {
    answers: [
      row({
        id: 'a_o1', question_id: 'q_o1', question_type: 'true_false', marks: 2,
        correct_answer: 'true', user_answer: 'true', topic_id: 'topic_math',
      }),
      row({ id: 'a_e1', question_id: 'q_e1', user_answer: 'Essay one.', topic_id: 'topic_social' }),
      row({ id: 'a_e2', question_id: 'q_e2', user_answer: 'Essay two.', topic_id: null }),
    ],
  };
  const findAnswer = (id: unknown) => store.answers.find((a) => a.id === id);

  const handlers: MockHandler[] = [
    {
      match: /SELECT role, status, is_active, session_version FROM users/,
      first: () => AUTH_USER,
    },
    {
      match: /UPDATE users SET ai_grading_credits/,
      run: () => ({ success: true, meta: { changes: 1 } }),
    },
    {
      match: /ai_grading_credits, st\.ai_grading_quota/,
      first: () => ({ ai_grading_credits: 5, ai_grading_quota: 10 }),
    },
    {
      match: /pa\.status = 'in_progress'/,
      first: () => ({
        id: ATTEMPT_ID, user_id: USER_ID, paper_id: PAPER_ID, status: 'in_progress',
        total_marks: 42, specification_id: null, paper_component_id: null,
        session: null, year: 2024, exam_type_id: 'exam_wassce', exam_type_slug: 'wassce',
      }),
    },
    {
      match: /LEFT JOIN essay_questions/,
      all: () => ({ results: store.answers }),
    },
    {
      match: /SET marking_status = 'graded', ai_score = \?/,
      run: (binds) => {
        const r = findAnswer(binds[3]);
        if (r) { r.marking_status = 'graded'; r.ai_score = Number(binds[0]); r.marks_earned = Number(binds[2]); }
        return { success: true, meta: { changes: 1 } };
      },
    },
    {
      match: /SET marking_status = 'pending'/,
      run: (binds) => {
        const r = findAnswer(binds[0]);
        if (r) r.marking_status = 'pending';
        return { success: true, meta: { changes: 1 } };
      },
    },
    {
      match: /SET is_correct = \?, marks_earned = \?/,
      run: (binds) => {
        const r = findAnswer(binds[2]);
        if (r) { r.is_correct = Number(binds[0]); r.marks_earned = Number(binds[1]); }
        return { success: true, meta: { changes: 1 } };
      },
    },
    // --- analytics queries (writePaperAnalytics) ---
    {
      match: /SELECT paa\.question_id, paa\.user_answer, paa\.is_correct/,
      all: () => ({ results: store.answers }),
    },
    {
      match: /SELECT et\.slug AS exam_type_slug, pp\.exam_type_id/,
      first: () => ({ exam_type_slug: 'wassce', exam_type_id: 'exam_wassce' }),
    },
    ...(opts.failAnalytics
      ? [{
          match: /INSERT INTO question_attempts/,
          run: () => { throw new Error('analytics boom'); },
        } as MockHandler]
      : []),
    {
      match: /UPDATE paper_attempts/,
      run: () => ({ success: true, meta: { changes: 1 } }),
    },
    // Catch-all for analytics inserts/upserts (question_attempts, user_progress,
    // topic_mastery) and anything incidental.
    {
      match: /[\s\S]/,
      first: () => null,
      all: () => ({ results: [] }),
      run: () => ({ success: true, meta: { changes: 1 } }),
    },
  ];

  const db = createMockD1(handlers);
  return { db, calls: db.calls, store };
}

async function submit(db: MockD1, aiRun: ReturnType<typeof vi.fn>) {
  const t = await sign(
    { userId: USER_ID, role: 'student', sessionVersion: 0, exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000) },
    JWT_SECRET,
  );
  return worker.fetch(
    new Request(`http://x/api/papers/attempts/${ATTEMPT_ID}/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ timeUsed: 60 }),
    }),
    { DB: db as unknown as D1Database, JWT_SECRET, AI: { run: aiRun } as unknown as Ai },
  );
}

function markingJson(score: number) {
  return { response: JSON.stringify({
    score, maxScore: 20, perPoint: [],
    feedback: 'ok', strengths: [], improvements: [],
  }) };
}

describe('paper submit analytics writes', () => {
  it('writes question_attempts + user_progress + topic_mastery per topic-carrying graded answer', async () => {
    const { db, calls } = makeHarness();
    const aiRun = vi.fn()
      .mockResolvedValueOnce(markingJson(15)) // a_e1 → 15/20 ≥ 50% → correct
      .mockResolvedValueOnce(markingJson(9));  // a_e2 → topic NULL, excluded

    const res = await submit(db, aiRun);
    expect(res.status).toBe(200);

    // 1. exactly one question_attempts insert per topic-carrying answer
    const qaInserts = calls.filter((c) => /INSERT INTO question_attempts/.test(c.sql));
    expect(qaInserts).toHaveLength(2);
    const qaQuestionIds = qaInserts.map((c) => c.binds[2]).sort();
    expect(qaQuestionIds).toEqual(['q_e1', 'q_o1']);

    // 2. theory answer's question_attempts row binds is_correct = 1 (15/20 ≥ 50%)
    const theoryQa = qaInserts.find((c) => c.binds[2] === 'q_e1')!;
    expect(theoryQa.binds[4]).toBe(1);
    const objectiveQa = qaInserts.find((c) => c.binds[2] === 'q_o1')!;
    expect(objectiveQa.binds[4]).toBe(1);

    // 3. user_progress upsert per topic (ON CONFLICT shape from attempt-progress.ts)
    const progressUpserts = calls.filter((c) =>
      /INSERT INTO user_progress/.test(c.sql) && /ON CONFLICT\(user_id, topic_id, exam_type_id\)/.test(c.sql));
    expect(progressUpserts).toHaveLength(2);

    // 4. topic_mastery upsert binds the paper's exam type slug
    const masteryUpserts = calls.filter((c) => /INSERT INTO topic_mastery/.test(c.sql));
    expect(masteryUpserts).toHaveLength(2);
    for (const c of masteryUpserts) {
      expect(c.binds[3]).toBe('wassce');
      expect(c.sql).toContain('ON CONFLICT(user_id, topic_id, exam_type)');
    }
  });

  it('analytics failure never fails the submit', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const { db } = makeHarness({ failAnalytics: true });
      const aiRun = vi.fn()
        .mockResolvedValueOnce(markingJson(15))
        .mockResolvedValueOnce(markingJson(9));

      const res = await submit(db, aiRun);
      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.data.status).toBe('graded');
      expect(body.data.markingStatus).toEqual({ theoryTotal: 2, graded: 2, failed: 0, pending: 0 });
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Paper analytics write failed for attempt ${ATTEMPT_ID}`),
        expect.anything(),
      );
    } finally {
      errorSpy.mockRestore();
    }
  });
});
