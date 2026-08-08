import { describe, it, expect, vi } from 'vitest';
import { sign } from 'hono/jwt';
import worker from '../index';

// IDOR regression tests for the essays family and /usage/daily in index.ts:
// identity must come from the verified JWT (via shared requireAuth), never
// from the request body or query string. /essays/submit previously deducted
// AI grading credits from a body-supplied userId; /essays/:attemptId/grade
// graded any attempt by id; /essays/history and /usage/daily honored
// ?userId= for any caller.
const JWT_SECRET = 'test-secret-that-is-long-enough';

function makeDb(
  userRow: unknown,
  allResults: Record<string, unknown>[] = [],
  firstFor?: (sql: string) => unknown,
) {
  const calls: { sql: string; args: unknown[] }[] = [];
  const db = {
    prepare: vi.fn((sql: string) => ({
      bind: (...args: unknown[]) => {
        calls.push({ sql, args });
        return {
          first: vi.fn().mockImplementation(() =>
            Promise.resolve(firstFor ? firstFor(sql) : userRow),
          ),
          all: vi.fn().mockResolvedValue({ results: allResults }),
          run: vi.fn().mockResolvedValue({ success: true }),
        };
      },
    })),
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
const ADMIN = { role: 'admin', status: 'approved', is_active: 1 };

describe('essays/usage IDOR fixes', () => {
  it('POST /api/essays/submit ignores a spoofed body userId (attempt + credit deduction bind the JWT identity)', async () => {
    // requireAuth lookup → STUDENT; subscription/credits lookup → a row with
    // AI credits so the AI-grading path (and credit deduction) executes.
    const { db, calls } = makeDb(STUDENT, [], (sql) => {
      if (sql.includes('subscription_tiers')) {
        return { id: 'attacker_1', ai_grading_quota: 10, ai_grading_credits: 5 };
      }
      return STUDENT;
    });
    const t = await token({ userId: 'attacker_1', role: 'student' });
    const res = await worker.fetch(
      new Request('http://x/api/essays/submit', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'victim_1',
          questionId: 'q_1',
          answerText: 'An essay answer with several words.',
          gradingType: 'ai',
        }),
      }),
      { DB: db, JWT_SECRET },
    );
    expect(res.status).toBe(200);

    // The attempt row must be bound to the attacker, never to 'victim_1'.
    const insert = calls.find((c) => c.sql.includes('INSERT INTO essay_attempts'));
    expect(insert).toBeDefined();
    expect(insert!.args[1]).toBe('attacker_1');
    expect(insert!.args).not.toContain('victim_1');

    // The AI credit must be deducted from the attacker, not the victim.
    const deduct = calls.find(
      (c) => c.sql.includes('UPDATE users SET ai_grading_credits'),
    );
    expect(deduct).toBeDefined();
    expect(deduct!.args[0]).toBe('attacker_1');
  });

  it("POST /api/essays/:attemptId/grade returns 403 when grading someone else's attempt", async () => {
    // Attempt fetch → a pending AI attempt owned by 'victim_1'.
    const { db, calls } = makeDb(STUDENT, [], (sql) => {
      if (sql.includes('FROM essay_attempts ea')) {
        return { id: 'ea_victim', user_id: 'victim_1', marks: 20 };
      }
      return STUDENT;
    });
    const t = await token({ userId: 'attacker_1', role: 'student' });
    const res = await worker.fetch(
      new Request('http://x/api/essays/ea_victim/grade', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}` },
      }),
      { DB: db, JWT_SECRET },
    );
    expect(res.status).toBe(403);

    // No grading writes may happen.
    expect(calls.some((c) => c.sql.includes('UPDATE essay_attempts'))).toBe(false);
  });

  it('POST /api/essays/:attemptId/grade allows the owner to grade their own attempt', async () => {
    const { db } = makeDb(STUDENT, [], (sql) => {
      if (sql.includes('FROM essay_attempts ea')) {
        return {
          id: 'ea_mine',
          user_id: 'attacker_1',
          marks: 20,
          marking_scheme: null,
          marking_rubric: null,
          word_count: 50,
          answer_text: 'My essay.',
          question_text: 'Discuss.',
          subject_name: 'English',
        };
      }
      return STUDENT;
    });
    const t = await token({ userId: 'attacker_1', role: 'student' });
    const res = await worker.fetch(
      new Request('http://x/api/essays/ea_mine/grade', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}` },
      }),
      { DB: db, JWT_SECRET }, // no ANTHROPIC_API_KEY → mock grading path
    );
    expect(res.status).toBe(200);
  });

  it('GET /api/essays/history ignores ?userId= for students and binds the JWT identity', async () => {
    const { db, calls } = makeDb(STUDENT);
    const t = await token({ userId: 'attacker_1', role: 'student' });
    const res = await worker.fetch(
      new Request('http://x/api/essays/history?userId=victim_1', {
        headers: { Authorization: `Bearer ${t}` },
      }),
      { DB: db, JWT_SECRET },
    );
    expect(res.status).toBe(200);

    const select = calls.find((c) => c.sql.includes('FROM essay_attempts ea'));
    expect(select).toBeDefined();
    expect(select!.args[0]).toBe('attacker_1');
    expect(select!.args).not.toContain('victim_1');
  });

  it('GET /api/essays/history is self-only even for admins (no ?userId= override)', async () => {
    const { db, calls } = makeDb(ADMIN);
    const t = await token({ userId: 'admin_1', role: 'admin' });
    const res = await worker.fetch(
      new Request('http://x/api/essays/history?userId=victim_1', {
        headers: { Authorization: `Bearer ${t}` },
      }),
      { DB: db, JWT_SECRET },
    );
    expect(res.status).toBe(200);

    const select = calls.find((c) => c.sql.includes('FROM essay_attempts ea'));
    expect(select).toBeDefined();
    expect(select!.args[0]).toBe('admin_1');
    expect(select!.args).not.toContain('victim_1');
  });

  it('GET /api/usage/daily ignores ?userId= and serves the JWT identity', async () => {
    // isPremiumUser lookup → non-premium student, so getDailyUsage queries daily_usage.
    const { db, calls } = makeDb(STUDENT);
    const t = await token({ userId: 'attacker_1', role: 'student' });
    const res = await worker.fetch(
      new Request('http://x/api/usage/daily?userId=victim_1', {
        headers: { Authorization: `Bearer ${t}` },
      }),
      { DB: db, JWT_SECRET },
    );
    expect(res.status).toBe(200);

    const usageSelect = calls.find((c) => c.sql.includes('FROM daily_usage'));
    expect(usageSelect).toBeDefined();
    expect(usageSelect!.args[0]).toBe('attacker_1');
    expect(calls.some((c) => c.args.includes('victim_1'))).toBe(false);
  });
});
