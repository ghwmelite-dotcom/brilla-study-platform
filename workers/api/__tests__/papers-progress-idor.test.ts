import { describe, it, expect, vi } from 'vitest';
import { sign } from 'hono/jwt';
import worker from '../index';

// IDOR regression tests for the progress/papers family in index.ts: identity
// must come from the verified JWT (via shared requireAuth), never from the
// request body or query string. GET /progress previously defaulted to
// 'user_demo' and honored ?userId=; both are gone.

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

describe('progress/papers IDOR fixes', () => {
  it('GET /api/progress?userId=victim with an attacker token serves the attacker rows', async () => {
    const { db, calls } = makeDb(STUDENT);
    const t = await token({ userId: 'attacker_1', role: 'student' });
    const res = await worker.fetch(
      new Request('http://x/api/progress?userId=victim_1', {
        headers: { Authorization: `Bearer ${t}` },
      }),
      { DB: db, JWT_SECRET },
    );
    expect(res.status).toBe(200);

    // The progress SELECT must bind the JWT user, never the query param.
    const select = calls.find((c) => c.sql.includes('FROM user_progress'));
    expect(select).toBeDefined();
    expect(select!.args[0]).toBe('attacker_1');
    expect(select!.args).not.toContain('victim_1');
  });

  it('GET /api/progress without a token returns 401 (user_demo default removed)', async () => {
    const { db, calls } = makeDb(STUDENT);
    const res = await worker.fetch(new Request('http://x/api/progress'), {
      DB: db,
      JWT_SECRET,
    });
    expect(res.status).toBe(401);
    expect(calls.some((c) => c.args.includes('user_demo'))).toBe(false);
  });

  it('GET /api/papers/attempts ignores ?userId= and binds the JWT identity', async () => {
    const { db, calls } = makeDb(STUDENT);
    const t = await token({ userId: 'attacker_1', role: 'student' });
    const res = await worker.fetch(
      new Request('http://x/api/papers/attempts?userId=victim_1&limit=5', {
        headers: { Authorization: `Bearer ${t}` },
      }),
      { DB: db, JWT_SECRET },
    );
    expect(res.status).toBe(200);

    const select = calls.find((c) => c.sql.includes('FROM paper_attempts pa'));
    expect(select).toBeDefined();
    expect(select!.args).not.toContain('victim_1');
    expect(select!.args[0]).toBe('attacker_1');
  });

  it('POST /api/papers/:id/attempt ignores a spoofed body userId (INSERT uses JWT identity)', async () => {
    // requireAuth user lookup → STUDENT; paper lookup → a paper row; existing
    // in-progress attempt check → null (so the INSERT proceeds).
    const { db, calls } = makeDb(STUDENT, [], (sql) => {
      if (sql.includes('FROM paper_attempts')) return null;
      if (sql.includes('FROM rate_limits')) return null;
      if (sql.includes('SELECT role, subscription_tier_id')) return { role: 'teacher' };
      if (sql.includes('FROM subjects s')) {
        return { id: 'subj_nsmq_math', slug: 'nsmq-mathematics', exam_type_slug: 'nsmq', question_count: 20 };
      }
      if (sql.includes('FROM past_papers')) {
        return { id: 'paper_1', subject_id: 'subj_nsmq_math', time_allowed: 180, is_premium: 0 };
      }
      return STUDENT;
    });
    const t = await token({ userId: 'attacker_1', role: 'student' });
    const res = await worker.fetch(
      new Request('http://x/api/papers/paper_1/attempt', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'victim_1' }),
      }),
      { DB: db, JWT_SECRET },
    );
    expect(res.status).toBe(200);

    const insert = calls.find((c) => c.sql.includes('INSERT INTO paper_attempts'));
    expect(insert).toBeDefined();
    // user_id is the 2nd bound param — must be the attacker, not 'victim_1'.
    expect(insert!.args[1]).toBe('attacker_1');
    expect(insert!.args).not.toContain('victim_1');
  });

  it('GET /api/papers/attempts/:id/results is self-scoped (query override removed)', async () => {
    const { db, calls } = makeDb(STUDENT, [], (sql) => {
      if (sql.includes('FROM paper_attempts pa')) {
        return { id: 'pa_1', user_id: 'attacker_1', paper_id: 'paper_1', status: 'in_progress' };
      }
      return STUDENT;
    });
    const t = await token({ userId: 'attacker_1', role: 'student' });
    const res = await worker.fetch(
      new Request('http://x/api/papers/attempts/pa_1/results?userId=victim_1', {
        headers: { Authorization: `Bearer ${t}` },
      }),
      { DB: db, JWT_SECRET },
    );

    const select = calls.find((c) => c.sql.includes('FROM paper_attempts pa'));
    expect(select).toBeDefined();
    expect(select!.args).toEqual(['pa_1', 'attacker_1']);
    expect(select!.args).not.toContain('victim_1');
    // Mocked first() returns a real in-progress attempt shape, so safe resume data is available.
    expect(res.status).toBe(200);
  });
});
