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
  options: string | null;
  question_text: string;
  topic_id: string | null;
  points: number;
  subject_name: string;
  marking_scheme: string | null;
  marking_rubric: string | null;
  model_answer: string | null;
  required_points: string | null;
  optional_points: string | null;
  marking_status?: string | null;
  ai_score?: number | null;
  is_correct?: number | null;
  marks_earned?: number | null;
}

function objectiveAnswer(id: string, qid: string, user: string, correct: string, marks: number): AnswerRow {
  return {
    id, paper_attempt_id: ATTEMPT_ID, question_id: qid, user_answer: user,
    correct_answer: correct, marks, question_type: 'true_false', options: null,
    question_text: `Question ${qid}`, topic_id: null, points: 3,
    subject_name: 'Core Mathematics', marking_scheme: null, marking_rubric: null,
    model_answer: null, required_points: null, optional_points: null,
  };
}

function essayAnswer(id: string, qid: string, user: string | null, marks = 20): AnswerRow {
  return {
    id, paper_attempt_id: ATTEMPT_ID, question_id: qid, user_answer: user,
    correct_answer: null, marks, question_type: 'essay', options: null,
    question_text: `Discuss topic ${qid}.`, topic_id: null, points: 3,
    subject_name: 'Social Studies', marking_scheme: null, marking_rubric: null,
    model_answer: null, required_points: null, optional_points: null,
  };
}

interface HarnessOptions {
  answers: AnswerRow[];
  totalMarks: number;
  credits: { ai_grading_credits: number; ai_grading_quota: number } | null;
  resultsAttemptStatus?: string;
}

function makeHarness(opts: HarnessOptions) {
  const store = {
    answers: opts.answers.map((a) => ({ ...a })) as AnswerRow[],
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
      first: () => opts.credits,
    },
    {
      match: /pa\.status = 'in_progress'/,
      first: () => ({
        id: ATTEMPT_ID, user_id: USER_ID, paper_id: PAPER_ID,
        status: 'in_progress', total_marks: opts.totalMarks,
      }),
    },
    {
      match: /LEFT JOIN essay_questions/,
      all: () => ({ results: store.answers }),
    },
    {
      match: /structured_question_parts/,
      all: () => ({ results: [] }),
    },
    {
      match: /SET marking_status = 'graded'/,
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
      match: /SET marking_status = 'pending'/,
      run: (binds) => {
        const row = findAnswer(binds[0]);
        if (row) row.marking_status = 'pending';
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
      match: /SET is_correct = \?, marks_earned = \?/,
      run: (binds) => {
        const row = findAnswer(binds[2]);
        if (row) {
          row.is_correct = Number(binds[0]);
          row.marks_earned = Number(binds[1]);
        }
        return { success: true, meta: { changes: 1 } };
      },
    },
    {
      match: /UPDATE paper_attempts/,
      run: () => ({ success: true, meta: { changes: 1 } }),
    },
    // Task 10 analytics writes (best-effort at end of submit).
    {
      match: /SELECT paa\.question_id, paa\.user_answer, paa\.is_correct/,
      all: () => ({ results: store.answers }),
    },
    {
      match: /SELECT et\.slug AS exam_type_slug, pp\.exam_type_id/,
      first: () => ({ exam_type_slug: 'wassce', exam_type_id: 'exam_wassce' }),
    },
    {
      match: /INSERT INTO (question_attempts|user_progress|topic_mastery|essay_attempts)|UPDATE user_progress/,
      run: () => ({ success: true, meta: { changes: 1 } }),
    },
    {
      match: /SELECT id FROM user_progress/,
      first: () => null,
    },
    {
      match: /paper_title/,
      first: () => ({
        id: ATTEMPT_ID, user_id: USER_ID, paper_id: PAPER_ID,
        status: opts.resultsAttemptStatus ?? 'partially_graded',
        percentage: 50, percentage_score: 50,
        paper_title: 'Mock Paper', year: 2024,
        subject_name: 'Social Studies', paper_type_name: 'Paper 2',
      }),
    },
    {
      match: /q\.explanation/,
      all: () => ({ results: store.answers }),
    },
  ];

  const db = createMockD1(handlers);
  return { db, calls: db.calls, store };
}

async function authToken(userId = USER_ID) {
  return sign(
    { userId, role: 'student', sessionVersion: 0, exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000) },
    JWT_SECRET,
  );
}

function markingJson(score: number) {
  return { response: JSON.stringify({
    score, maxScore: 20, perPoint: [],
    feedback: `Marked ${score}.`, strengths: ['s'], improvements: ['i'],
  }) };
}

async function submit(db: MockD1, aiRun: ReturnType<typeof vi.fn>) {
  const t = await authToken();
  return worker.fetch(
    new Request(`http://x/api/papers/attempts/${ATTEMPT_ID}/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ timeUsed: 120 }),
    }),
    { DB: db as unknown as D1Database, JWT_SECRET, AI: { run: aiRun } as unknown as Ai },
  );
}

describe('POST /papers/attempts/:attemptId/submit — theory marking fan-out', () => {
  it('marks mixed papers: objective + essays, credits sufficient', async () => {
    const { db, calls } = makeHarness({
      totalMarks: 44,
      credits: { ai_grading_credits: 5, ai_grading_quota: 10 },
      answers: [
        objectiveAnswer('a_o1', 'q_o1', 'true', 'true', 2),
        objectiveAnswer('a_o2', 'q_o2', 'false', 'true', 2),
        essayAnswer('a_e1', 'q_e1', 'Essay one answer.'),
        essayAnswer('a_e2', 'q_e2', 'Essay two answer.'),
      ],
    });
    const aiRun = vi.fn()
      .mockResolvedValueOnce(markingJson(15))
      .mockResolvedValueOnce(markingJson(12));

    const res = await submit(db, aiRun);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.data.status).toBe('graded');
    expect(body.data.markingStatus).toEqual({ theoryTotal: 2, graded: 2, failed: 0, pending: 0 });
    expect(body.data.totalScore).toBe(2 + 15 + 12);
    expect(body.data.totalMarks).toBe(44);

    const deduct = calls.find((c) => /UPDATE users SET ai_grading_credits = ai_grading_credits - \?/.test(c.sql));
    expect(deduct).toBeDefined();
    expect(deduct!.binds[0]).toBe(2);
    expect(deduct!.binds[2]).toBe(2); // atomic ai_grading_credits >= ? guard
    expect(aiRun).toHaveBeenCalledTimes(2);

    // Task 9: submit response carries the computed grade (WAEC fallback for
    // 66% — no grade_boundaries rows in this fixture) and the attempt UPDATE
    // persists it.
    expect(body.data.grade).toBe('B3');
    const attemptUpdate = calls.find((c) => /UPDATE paper_attempts/.test(c.sql));
    expect(attemptUpdate).toBeDefined();
    expect(attemptUpdate!.binds).toContain('B3');
  });

  it('marks only what credits cover: all-theory paper with 1 of 2 payable', async () => {
    const { db } = makeHarness({
      totalMarks: 40,
      credits: { ai_grading_credits: 1, ai_grading_quota: 10 },
      answers: [
        essayAnswer('a_t1', 'q_t1', 'First essay answer.'),
        essayAnswer('a_t2', 'q_t2', 'Second essay answer.'),
      ],
    });
    const aiRun = vi.fn().mockResolvedValueOnce(markingJson(14));

    const res = await submit(db, aiRun);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.data.status).toBe('partially_graded');
    expect(body.data.markingStatus).toEqual({ theoryTotal: 2, graded: 1, failed: 0, pending: 1 });
    expect(body.data.totalScore).toBe(14);
    expect(aiRun).toHaveBeenCalledTimes(1);
  });

  it('garbage AI output → marking_failed, attempt partially_graded, totals exclude it', async () => {
    const { db, store } = makeHarness({
      totalMarks: 40,
      credits: { ai_grading_credits: 5, ai_grading_quota: 10 },
      answers: [
        essayAnswer('a_t1', 'q_t1', 'First essay answer.'),
        essayAnswer('a_t2', 'q_t2', 'Second essay answer.'),
      ],
    });
    const aiRun = vi.fn()
      .mockResolvedValueOnce({ response: 'I cannot mark this.' })
      .mockResolvedValueOnce(markingJson(11));

    const res = await submit(db, aiRun);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.data.status).toBe('partially_graded');
    expect(body.data.markingStatus).toEqual({ theoryTotal: 2, graded: 1, failed: 1, pending: 0 });
    expect(body.data.totalScore).toBe(11);
    expect(store.answers.find((a) => a.id === 'a_t1')!.marking_status).toBe('marking_failed');
    expect(store.answers.find((a) => a.id === 'a_t2')!.marking_status).toBe('graded');
  });

  it('quota = 0 tier: no AI calls, objective graded, partially_graded + markingUnavailable', async () => {
    const { db } = makeHarness({
      totalMarks: 44,
      credits: { ai_grading_credits: 0, ai_grading_quota: 0 },
      answers: [
        objectiveAnswer('a_o1', 'q_o1', 'true', 'true', 2),
        objectiveAnswer('a_o2', 'q_o2', 'false', 'true', 2),
        essayAnswer('a_e1', 'q_e1', 'Essay one answer.'),
        essayAnswer('a_e2', 'q_e2', 'Essay two answer.'),
      ],
    });
    const aiRun = vi.fn();

    const res = await submit(db, aiRun);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.data.status).toBe('partially_graded');
    expect(body.data.markingUnavailable).toBe(true);
    expect(body.data.markingStatus).toEqual({ theoryTotal: 2, graded: 0, failed: 0, pending: 2 });
    expect(body.data.totalScore).toBe(2);
    expect(aiRun).not.toHaveBeenCalled();
  });

  it('objective-only paper: unchanged totals, graded, no AI calls, no credit deduction', async () => {
    const { db, calls } = makeHarness({
      totalMarks: 4,
      credits: null,
      answers: [
        objectiveAnswer('a_o1', 'q_o1', 'true', 'true', 2),
        objectiveAnswer('a_o2', 'q_o2', 'false', 'true', 2),
      ],
    });
    const aiRun = vi.fn();

    const res = await submit(db, aiRun);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.data.status).toBe('graded');
    expect(body.data.totalScore).toBe(2);
    expect(body.data.totalMarks).toBe(4);
    expect(body.data.percentageScore).toBe(50);
    expect(body.data.markingStatus).toEqual({ theoryTotal: 0, graded: 0, failed: 0, pending: 0 });
    expect(aiRun).not.toHaveBeenCalled();
    expect(calls.find((c) => /UPDATE users SET ai_grading_credits/.test(c.sql))).toBeUndefined();
    expect(calls.find((c) => /ai_grading_credits, st\.ai_grading_quota/.test(c.sql))).toBeUndefined();
  });

  it('unanswered theory questions are not marked and cost no credits', async () => {
    const { db, calls, store } = makeHarness({
      totalMarks: 60,
      credits: { ai_grading_credits: 5, ai_grading_quota: 10 },
      answers: [
        essayAnswer('a_e1', 'q_e1', 'Answered essay.'),
        essayAnswer('a_e2', 'q_e2', null),
        essayAnswer('a_e3', 'q_e3', '   '),
      ],
    });
    const aiRun = vi.fn().mockResolvedValueOnce(markingJson(16));

    const res = await submit(db, aiRun);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.data.status).toBe('graded');
    expect(body.data.markingStatus).toEqual({ theoryTotal: 1, graded: 1, failed: 0, pending: 0 });
    expect(aiRun).toHaveBeenCalledTimes(1);
    const deduct = calls.find((c) => /UPDATE users SET ai_grading_credits/.test(c.sql));
    expect(deduct!.binds[0]).toBe(1);
    const markingUpdates = calls.filter((c) => /UPDATE paper_attempt_answers[\s\S]*marking_status/.test(c.sql));
    for (const c of markingUpdates) {
      expect(c.binds).not.toContain('a_e2');
      expect(c.binds).not.toContain('a_e3');
    }
    expect(store.answers.find((a) => a.id === 'a_e2')!.marking_status).toBeUndefined();
  });

  it('results endpoint serves answers for a partially_graded attempt', async () => {
    const { db } = makeHarness({
      totalMarks: 40,
      credits: null,
      resultsAttemptStatus: 'partially_graded',
      answers: [essayAnswer('a_t1', 'q_t1', 'Essay answer.')],
    });
    const t = await authToken();
    const res = await worker.fetch(
      new Request(`http://x/api/papers/attempts/${ATTEMPT_ID}/results`, {
        headers: { Authorization: `Bearer ${t}` },
      }),
      { DB: db as unknown as D1Database, JWT_SECRET, AI: { run: vi.fn() } as unknown as Ai },
    );
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.data.answers).toHaveLength(1);
  });
});
