import { describe, it, expect, vi } from 'vitest';
import { sign } from 'hono/jwt';
import worker from '../index';
import { createMockD1, type MockHandler, type MockD1 } from './helpers/mockD1';

const JWT_SECRET = 'test-secret-that-is-long-enough';
const USER_ID = 'student_1';
const ATTEMPT_ID = 'att_1';
const PAPER_ID = 'paper_1';

const AUTH_USER = { role: 'student', status: 'approved', is_active: 1, session_version: 0 };

interface AnswerRow {
  id: string;
  paper_attempt_id: string;
  question_id: string;
  user_answer: string | null;
  correct_answer: string | null;
  marks: number;
  question_type: string;
  question_text: string;
  topic_id: string | null;
  points: number;
  subject_name: string;
  marking_scheme: string | null;
  marking_rubric: string | null;
  model_answer: string | null;
  required_points: string | null;
  optional_points: string | null;
  marking_status: string | null;
  ai_score: number | null;
  is_correct: number | null;
  marks_earned: number | null;
}

function theoryRow(id: string, qid: string, markingStatus: string | null): AnswerRow {
  return {
    id, paper_attempt_id: ATTEMPT_ID, question_id: qid, user_answer: `Answer for ${qid}.`,
    correct_answer: null, marks: 20, question_type: 'essay',
    question_text: `Discuss topic ${qid}.`, topic_id: null, points: 3,
    subject_name: 'Social Studies', marking_scheme: null, marking_rubric: null,
    model_answer: null, required_points: null, optional_points: null,
    marking_status: markingStatus, ai_score: null, is_correct: null, marks_earned: 0,
  };
}

function objectiveRow(id: string, qid: string, marksEarned: number): AnswerRow {
  return {
    ...theoryRow(id, qid, null),
    question_type: 'true_false', correct_answer: 'true', marks: 2,
    is_correct: marksEarned > 0 ? 1 : 0, marks_earned: marksEarned,
  };
}

interface HarnessOptions {
  attemptStatus?: string | null; // null → attempt query finds nothing (404 path)
  attemptUserId?: string;
  totalMarks?: number;
  answers: AnswerRow[];
  credits?: { ai_grading_credits: number; ai_grading_quota: number } | null;
}

function makeHarness(opts: HarnessOptions) {
  const store = {
    attempt: {
      id: ATTEMPT_ID,
      user_id: opts.attemptUserId ?? USER_ID,
      paper_id: PAPER_ID,
      status: opts.attemptStatus === null ? 'in_progress' : (opts.attemptStatus ?? 'partially_graded'),
    } as Record<string, unknown>,
    answers: opts.answers.map((a) => ({ ...a })),
  };
  const findAnswer = (id: unknown) => store.answers.find((a) => a.id === id);

  const handlers: MockHandler[] = [
    {
      match: /SELECT role, status, is_active, session_version FROM users/,
      first: () => AUTH_USER,
    },
    {
      match: /UPDATE users SET ai_grading_credits = ai_grading_credits - \?/,
      run: () => ({ success: true, meta: { changes: 1 } }),
    },
    {
      match: /ai_grading_credits, st\.ai_grading_quota/,
      first: () => opts.credits ?? null,
    },
    {
      match: /pa\.status IN \('graded', 'partially_graded'\)/,
      first: () => (opts.attemptStatus === null
        ? null
        : { ...store.attempt, total_marks: opts.totalMarks ?? 40 }),
    },
    {
      match: /marking_status IN \('marking_failed', 'pending'\)/,
      all: () => ({
        results: store.answers.filter(
          (a) => a.marking_status === 'marking_failed' || a.marking_status === 'pending',
        ),
      }),
    },
    {
      match: /structured_question_parts/,
      all: () => ({ results: [] }),
    },
    {
      match: /SET marking_status = 'graded', ai_score = \?/,
      run: (binds) => {
        const row = findAnswer(binds[3]);
        if (row) {
          row.marking_status = 'graded';
          row.ai_score = Number(binds[0]);
          row.marks_earned = Number(binds[2]);
        }
        return { success: true, meta: { changes: 1 } };
      },
    },
    {
      match: /SET marking_status = 'marking_failed'/,
      run: (binds) => {
        const row = findAnswer(binds[0]);
        if (row) row.marking_status = 'marking_failed';
        return { success: true, meta: { changes: 1 } };
      },
    },
    {
      match: /SELECT paa\.marks_earned, paa\.ai_score, paa\.marking_status/,
      all: () => ({ results: store.answers }),
    },
    {
      match: /SELECT pp\.total_marks FROM paper_attempts/,
      first: () => ({ total_marks: opts.totalMarks ?? 40 }),
    },
    {
      match: /UPDATE paper_attempts\s+SET status = \?, total_score = \?/,
      run: (binds) => {
        store.attempt.status = binds[0];
        store.attempt.total_score = binds[1];
        return { success: true, meta: { changes: 1 } };
      },
    },
  ];

  const db = createMockD1(handlers);
  return { db, calls: db.calls, store };
}

async function authToken(userId = USER_ID, role = 'student') {
  return sign(
    { userId, role, sessionVersion: 0, exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000) },
    JWT_SECRET,
  );
}

function markingJson(score: number) {
  return { response: JSON.stringify({
    score, maxScore: 20, perPoint: [],
    feedback: `Marked ${score}.`, strengths: ['s'], improvements: ['i'],
  }) };
}

async function remark(db: MockD1, aiRun: ReturnType<typeof vi.fn>, userId = USER_ID) {
  const t = await authToken(userId);
  return worker.fetch(
    new Request(`http://x/api/papers/attempts/${ATTEMPT_ID}/remark`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${t}` },
    }),
    { DB: db as unknown as D1Database, JWT_SECRET, AI: { run: aiRun } as unknown as Ai },
  );
}

describe('POST /papers/attempts/:attemptId/remark', () => {
  it('rejects non-owner non-admin with 403 (IDOR)', async () => {
    const { db } = makeHarness({
      attemptUserId: 'someone_else',
      answers: [theoryRow('a_t1', 'q_t1', 'marking_failed')],
    });
    const res = await remark(db, vi.fn());
    expect(res.status).toBe(403);
  });

  it('returns 404 for an in_progress attempt', async () => {
    const { db } = makeHarness({
      attemptStatus: null,
      answers: [theoryRow('a_t1', 'q_t1', 'pending')],
    });
    const res = await remark(db, vi.fn());
    expect(res.status).toBe(404);
  });

  it('re-marks marking_failed answers free of charge and flips attempt to graded', async () => {
    const { db, calls } = makeHarness({
      answers: [
        objectiveRow('a_o1', 'q_o1', 2),
        theoryRow('a_t1', 'q_t1', 'marking_failed'),
      ],
    });
    const aiRun = vi.fn().mockResolvedValueOnce(markingJson(13));

    const res = await remark(db, aiRun);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.data).toMatchObject({ remarked: 1, failed: 0, remaining: 0, status: 'graded' });
    expect(aiRun).toHaveBeenCalledTimes(1);
    expect(calls.find((c) => /UPDATE users SET ai_grading_credits/.test(c.sql))).toBeUndefined();
    expect(calls.find((c) => /ai_grading_credits, st\.ai_grading_quota/.test(c.sql))).toBeUndefined();

    const finalize = calls.find((c) => /UPDATE paper_attempts\s+SET status = \?, total_score = \?/.test(c.sql));
    expect(finalize).toBeDefined();
    expect(finalize!.binds[0]).toBe('graded');
    expect(finalize!.binds[1]).toBe(15); // 2 objective + 13 re-marked
  });

  it('marks a pending answer after an atomic 1-credit deduction', async () => {
    const { db, calls } = makeHarness({
      answers: [
        objectiveRow('a_o1', 'q_o1', 2),
        theoryRow('a_t1', 'q_t1', 'pending'),
      ],
      credits: { ai_grading_credits: 3, ai_grading_quota: 10 },
    });
    const aiRun = vi.fn().mockResolvedValueOnce(markingJson(17));

    const res = await remark(db, aiRun);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.data).toMatchObject({ remarked: 1, failed: 0, remaining: 0, status: 'graded' });
    const deduct = calls.find((c) => /UPDATE users SET ai_grading_credits = ai_grading_credits - \?/.test(c.sql));
    expect(deduct).toBeDefined();
    expect(deduct!.binds[0]).toBe(1);
    expect(deduct!.binds[2]).toBe(1);
    expect(aiRun).toHaveBeenCalledTimes(1);
  });

  it('leaves pending answers untouched when credits are zero', async () => {
    const { db, store } = makeHarness({
      answers: [theoryRow('a_t1', 'q_t1', 'pending')],
      credits: { ai_grading_credits: 0, ai_grading_quota: 10 },
    });
    const aiRun = vi.fn();

    const res = await remark(db, aiRun);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.data).toMatchObject({ remarked: 0, failed: 0, remaining: 1, status: 'partially_graded' });
    expect(aiRun).not.toHaveBeenCalled();
    expect(store.answers[0].marking_status).toBe('pending');
  });

  it('is idempotent: a second call finds nothing retryable and spends nothing', async () => {
    const { db, calls } = makeHarness({
      answers: [
        objectiveRow('a_o1', 'q_o1', 2),
        theoryRow('a_t1', 'q_t1', 'marking_failed'),
      ],
    });
    const aiRun = vi.fn().mockResolvedValueOnce(markingJson(13));

    const first = await remark(db, aiRun);
    expect(first.status).toBe(200);

    const second = await remark(db, aiRun);
    expect(second.status).toBe(200);
    const body = await second.json() as any;
    expect(body.data).toMatchObject({ remarked: 0, failed: 0, remaining: 0, status: 'graded' });
    expect(aiRun).toHaveBeenCalledTimes(1);
    expect(calls.filter((c) => /UPDATE users SET ai_grading_credits/.test(c.sql))).toHaveLength(0);
  });

  it('AI garbage on retry returns the answer to marking_failed and stays partially_graded', async () => {
    const { db, store } = makeHarness({
      answers: [theoryRow('a_t1', 'q_t1', 'marking_failed')],
    });
    const aiRun = vi.fn().mockResolvedValueOnce({ response: 'not json at all' });

    const res = await remark(db, aiRun);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.data).toMatchObject({ remarked: 0, failed: 1, remaining: 1, status: 'partially_graded' });
    expect(store.answers[0].marking_status).toBe('marking_failed');
  });
});
