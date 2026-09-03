import { describe, it, expect, vi } from 'vitest';
import { sign } from 'hono/jwt';
import worker from '../index';

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
const GRADING_JSON = JSON.stringify({
  overallScore: 12, overallFeedback: 'Solid essay.',
  criteriaScores: [{ criterionName: 'Content', score: 12, maxScore: 20, feedback: 'Good coverage.' }],
  strengths: ['Structure'], areasForImprovement: ['Depth'], suggestions: ['Add examples'],
});

describe('POST /api/essays/:attemptId/grade on Workers AI', () => {
  it('grades via env.AI through the marking model and never fetches anthropic', async () => {
    const { db } = makeDb((sql) => {
      if (sql.includes('FROM essay_attempts')) {
        return {
          id: 'ea_1', user_id: 'student_1', grading_type: 'ai', grading_status: 'pending',
          answer_text: 'My essay', word_count: 120, marks: 20,
          marking_scheme: null, marking_rubric: null, word_limit_min: null, word_limit_max: null,
          question_text: 'Discuss photosynthesis.', subject_name: 'Integrated Science',
        };
      }
      return STUDENT; // requireAuth user lookup
    });
    const aiRun = vi.fn(async () => ({ response: GRADING_JSON }));
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
    expect(aiRun).toHaveBeenCalledTimes(1);
    expect(aiRun.mock.calls[0][0]).toBe('@cf/openai/gpt-oss-120b');
    const messages = (aiRun.mock.calls[0][1] as any).messages;
    expect(messages[0].role).toBe('system');
    expect(messages[0].content).toContain('WAEC examiner');
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
