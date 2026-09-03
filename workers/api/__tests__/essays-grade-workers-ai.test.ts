import { describe, it, expect, vi } from 'vitest';
import { sign } from 'hono/jwt';
import worker, { theoryMarkingToEssayFeedback } from '../index';
import { createMockD1, type MockHandler } from './helpers/mockD1';

const JWT_SECRET = 'test-secret-that-is-long-enough';

function makeDb(firstFor: (sql: string) => unknown) {
  const calls: { sql: string; args: unknown[] }[] = [];
  const db = {
    prepare: vi.fn((sql: string) => ({
      bind: (...args: unknown[]) => {
        calls.push({ sql, args });
        return {
          first: vi.fn().mockImplementation(() => Promise.resolve(firstFor(sql))),
          all: vi.fn().mockResolvedValue({ results: [] }),
          run: vi.fn().mockResolvedValue({ success: true, meta: { changes: 1 } }),
        };
      },
    })),
    batch: vi.fn(async (stmts: { run(): Promise<unknown> }[]) => {
      const out = [];
      for (const s of stmts) out.push(await s.run());
      return out;
    }),
  } as unknown as D1Database;
  return { db, calls };
}

async function token(payload: object) {
  return sign(
    { ...payload, exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000) },
    JWT_SECRET,
  );
}

const STUDENT = { role: 'student', status: 'approved', is_active: 1 };
// The theory-marking output contract (Task 5/6): score/perPoint/feedback.
const MARKING_JSON = JSON.stringify({
  score: 12, maxScore: 20,
  perPoint: [{ point: 'Content', awarded: 12, maxMarks: 20, comment: 'Good coverage.' }],
  feedback: 'Solid essay.', strengths: ['Structure'], improvements: ['Depth'],
});

describe('theoryMarkingToEssayFeedback adapter', () => {
  it('maps the theory-marking contract onto the legacy essay feedback shape', () => {
    const feedback = theoryMarkingToEssayFeedback({
      score: 12,
      maxScore: 20,
      perPoint: [{ point: 'Content', awarded: 12, maxMarks: 20, comment: 'Good coverage.' }],
      feedback: 'Solid essay.',
      strengths: ['Structure'],
      improvements: ['Depth'],
    }) as any;
    expect(feedback.overallScore).toBe(12);
    expect(feedback.overallFeedback).toBe('Solid essay.');
    expect(feedback.criteriaScores).toEqual([
      { criterionName: 'Content', score: 12, maxScore: 20, feedback: 'Good coverage.' },
    ]);
    expect(feedback.strengths).toEqual(['Structure']);
    expect(feedback.areasForImprovement).toEqual(['Depth']);
    expect(feedback.suggestions).toEqual(['Depth']);
  });
});

describe('POST /api/essays/:attemptId/grade on Workers AI', () => {
  it('grades via gradeTheoryAnswer and adapts the legacy feedback shape end-to-end', async () => {
    const { db } = makeDb((sql) => {
      if (sql.includes('FROM essay_attempts')) {
        return {
          id: 'ea_1', user_id: 'student_1', grading_type: 'ai', grading_status: 'pending',
          answer_text: 'My essay', word_count: 120, marks: 20,
          marking_scheme: null, marking_rubric: null, word_limit_min: 100, word_limit_max: 250,
          question_text: 'Discuss photosynthesis.', subject_name: 'Integrated Science',
        };
      }
      return STUDENT; // requireAuth user lookup
    });
    const aiRun = vi.fn(async () => ({ response: MARKING_JSON }));
    const t = await token({ userId: 'student_1', role: 'student' });
    const res = await worker.fetch(
      new Request('http://x/api/essays/ea_1/grade', {
        method: 'POST', headers: { Authorization: `Bearer ${t}` },
      }),
      { DB: db, JWT_SECRET, AI: { run: aiRun } as unknown as Ai },
    );
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.success).toBe(true);
    expect(body.data.score).toBe(12);
    expect(body.data.feedback.overallFeedback).toBe('Solid essay.');
    expect(body.data.feedback.criteriaScores).toEqual([
      { criterionName: 'Content', score: 12, maxScore: 20, feedback: 'Good coverage.' },
    ]);
    expect(body.data.feedback.suggestions).toEqual(['Depth']);
    expect(aiRun).toHaveBeenCalledTimes(1);
    expect(aiRun.mock.calls[0][0]).toBe('@cf/openai/gpt-oss-120b');
    const messages = (aiRun.mock.calls[0][1] as any).messages;
    expect(messages[0].role).toBe('system');
    expect(messages[0].content).toContain('WAEC examiner');
    // Word limits are passed through as untrusted marking inputs.
    expect(messages[1].content).toContain('wordLimits');
  });

  it('marks the attempt failed when the model returns garbage (no fabricated score)', async () => {
    const { db, calls } = makeDb((sql) => {
      if (sql.includes('FROM essay_attempts')) {
        return {
          id: 'ea_2', user_id: 'student_1', grading_type: 'ai', grading_status: 'pending',
          answer_text: 'My essay', word_count: 120, marks: 20,
          marking_scheme: null, marking_rubric: null, word_limit_min: null, word_limit_max: null,
          question_text: 'Discuss photosynthesis.', subject_name: 'Integrated Science',
        };
      }
      return STUDENT;
    });
    const aiRun = vi.fn(async () => ({ response: 'sorry, I cannot help' }));
    const t = await token({ userId: 'student_1', role: 'student' });
    const res = await worker.fetch(
      new Request('http://x/api/essays/ea_2/grade', {
        method: 'POST', headers: { Authorization: `Bearer ${t}` },
      }),
      { DB: db, JWT_SECRET, AI: { run: aiRun } as unknown as Ai },
    );
    expect(res.status).toBe(500);
    const failUpdate = calls.find(
      (c) => c.sql.includes("UPDATE essay_attempts SET grading_status = 'failed'"),
    );
    expect(failUpdate).toBeDefined();
  });
});

describe('paper-sit essay convergence', () => {
  it('paper submit inserts an essay_attempts row linked by paper_attempt_id', async () => {
    const ATTEMPT_ID = 'att_essay_1';
    const answer = {
      id: 'a_e1', paper_attempt_id: ATTEMPT_ID, question_id: 'q_e1',
      user_answer: 'My paper essay.', correct_answer: null, marks: 20,
      question_type: 'essay', options: null, question_text: 'Discuss the 1948 riots.',
      topic_id: null, points: 3, subject_name: 'Social Studies',
      marking_scheme: null, marking_rubric: null, model_answer: null,
      required_points: null, optional_points: null,
      marking_status: null, ai_score: null, is_correct: null, marks_earned: 0,
      time_taken: 60, exam_type_id: 'exam_wassce',
    };
    const handlers: MockHandler[] = [
      {
        match: /SELECT role, status, is_active, session_version FROM users/,
        first: () => STUDENT,
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
          id: ATTEMPT_ID, user_id: 'student_1', paper_id: 'paper_1', status: 'in_progress',
          total_marks: 20, specification_id: null, paper_component_id: null,
          session: null, year: 2024, exam_type_id: 'exam_wassce', exam_type_slug: 'wassce',
        }),
      },
      { match: /LEFT JOIN essay_questions/, all: () => ({ results: [answer] }) },
      // Catch-all: answer updates, attempt update, analytics writes.
      {
        match: /[\s\S]/,
        first: () => null,
        all: () => ({ results: [] }),
        run: () => ({ success: true, meta: { changes: 1 } }),
      },
    ];
    const db = createMockD1(handlers);
    const aiRun = vi.fn(async () => ({ response: MARKING_JSON }));
    const t = await token({ userId: 'student_1', role: 'student', sessionVersion: 0 });
    const res = await worker.fetch(
      new Request(`http://x/api/papers/attempts/${ATTEMPT_ID}/submit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeUsed: 60 }),
      }),
      { DB: db as unknown as D1Database, JWT_SECRET, AI: { run: aiRun } as unknown as Ai },
    );
    expect(res.status).toBe(200);

    const insert = db.calls.find((c) => /INSERT INTO essay_attempts/.test(c.sql));
    expect(insert).toBeDefined();
    expect(insert!.sql).toContain('paper_attempt_id');
    expect(insert!.binds[2]).toBe('q_e1'); // question_id
    expect(insert!.binds[3]).toBe(ATTEMPT_ID); // paper_attempt_id
    // Prod's essay_attempts CHECK accepts only pending/grading/completed/failed
    // (verified via wrangler d1 execute --remote against sqlite_master); the
    // insert must stay inside that set or the submit batch would fail live.
    expect(insert!.sql).toContain("'ai', 'completed'");
    expect(insert!.binds[5]).toBe(12); // ai_score
    const feedback = JSON.parse(String(insert!.binds[6])) as any;
    expect(feedback.overallFeedback).toBe('Solid essay.');
    expect(insert!.binds[7]).toBe(12); // final_score
  });
});

describe('essay_attempts prod-schema compliance (CHECK regression)', () => {
  // Prod's essay_attempts CHECK accepts only pending/grading/completed/failed
  // and has ai_graded_at, not graded_at (verified via wrangler d1 execute
  // --remote against sqlite_master). 'graded'/'graded_at' writes throw live.
  it('grade endpoint persists completed status with ai_graded_at', async () => {
    const { db, calls } = makeDb((sql) => {
      if (sql.includes('FROM essay_attempts')) {
        return {
          id: 'ea_1', user_id: 'student_1', grading_type: 'ai', grading_status: 'pending',
          answer_text: 'My essay', word_count: 120, marks: 20,
          marking_scheme: null, marking_rubric: null, word_limit_min: null, word_limit_max: null,
          question_text: 'Discuss photosynthesis.', subject_name: 'Integrated Science',
        };
      }
      return STUDENT;
    });
    const aiRun = vi.fn(async () => ({ response: MARKING_JSON }));
    const t = await token({ userId: 'student_1', role: 'student' });
    const res = await worker.fetch(
      new Request('http://x/api/essays/ea_1/grade', {
        method: 'POST', headers: { Authorization: `Bearer ${t}` },
      }),
      { DB: db, JWT_SECRET, AI: { run: aiRun } as unknown as Ai },
    );
    expect(res.status).toBe(200);
    const update = calls.find(
      (c) => c.sql.includes('UPDATE essay_attempts') && c.sql.includes('ai_score = ?'),
    );
    expect(update).toBeDefined();
    expect(update!.sql).toContain("grading_status = 'completed'");
    expect(update!.sql).toContain('ai_graded_at');
    expect(update!.sql).not.toMatch(/[^a-z_]graded_at/);
  });

  it('self-graded submit inserts completed, not the illegal graded status', async () => {
    const { db, calls } = makeDb((sql) => {
      if (sql.includes('FROM users u')) {
        return { id: 'student_1', ai_grading_quota: 5, ai_grading_credits: 5 };
      }
      return STUDENT;
    });
    const t = await token({ userId: 'student_1', role: 'student' });
    const res = await worker.fetch(
      new Request('http://x/api/essays/submit', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: 'q_1', answerText: 'My self graded essay.', gradingType: 'self' }),
      }),
      { DB: db, JWT_SECRET, AI: { run: vi.fn() } as unknown as Ai },
    );
    expect(res.status).toBe(200);
    const insert = calls.find((c) => c.sql.includes('INSERT INTO essay_attempts'));
    expect(insert).toBeDefined();
    expect(insert!.args[5]).toBe('self'); // grading_type
    expect(insert!.args[6]).toBe('completed'); // grading_status within prod CHECK
    const body = await res.json() as any;
    expect(body.data.gradingStatus).toBe('completed');
  });
});
