import { describe, it, expect, vi } from 'vitest';
import { sign } from 'hono/jwt';
import worker from '../index';

// Route-shadowing regression tests: Hono resolves first-registered-wins, so
// publicApp param routes (registered before the protectedApp mount) used to
// capture static routes:
//   - publicApp GET /questions/:id captured protectedApp /questions/bank
//     (now an app-level requireAuth route registered before the publicApp
//     mount).
//   - publicApp GET /houses/:id captured its own siblings /houses/standings
//     and /houses/activity (now registered BEFORE the param route).

const JWT_SECRET = 'test-secret-that-is-long-enough';

function makeDb(userRow: unknown, allResults: Record<string, unknown>[] = []) {
  const calls: { sql: string; args: unknown[] }[] = [];
  const db = {
    prepare: vi.fn((sql: string) => {
      const bound = {
        first: vi.fn().mockResolvedValue(userRow),
        all: vi.fn().mockResolvedValue({ results: allResults }),
        run: vi.fn().mockResolvedValue({ success: true }),
      };
      return {
        ...bound,
        bind: (...args: unknown[]) => {
          calls.push({ sql, args });
          return bound;
        },
      };
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

const activeUser = { role: 'teacher', status: 'approved', is_active: 1 };

describe('route shadowing fixes', () => {
  it('GET /api/questions/bank without a token returns 401 (app-level requireAuth route wins over public /questions/:id)', async () => {
    const { db } = makeDb(activeUser);
    const res = await worker.fetch(
      new Request('http://x/api/questions/bank'),
      { DB: db, JWT_SECRET },
    );
    expect(res.status).toBe(401);
  });

  it('GET /api/questions/bank with a valid token serves the bank handler (not the /questions/:id 404 shape)', async () => {
    const questionRow = {
      id: 'q_1',
      question_text: 'What is photosynthesis?',
      question_type: 'multiple_choice',
      options: null,
      correct_answer: 'A',
      explanation: 'Plants convert light to energy.',
      difficulty: 'easy',
      points: 2,
      topic_id: 'topic_1',
      topic_name: 'Biology',
      subject_id: 'subj_1',
      subject_name: 'Integrated Science',
    };
    const { db, calls } = makeDb(activeUser, [questionRow]);
    const t = await token({ userId: 'teacher_1', role: 'teacher' });
    const res = await worker.fetch(
      new Request('http://x/api/questions/bank?search=photo&limit=5', {
        headers: { Authorization: `Bearer ${t}` },
      }),
      { DB: db, JWT_SECRET },
    );
    expect(res.status).not.toBe(401);
    expect(res.status).toBe(200);

    const body = (await res.json()) as {
      success: boolean;
      data: { questions: Array<Record<string, unknown>>; total: number };
    };
    // Bank-handler shape: { data: { questions: [...], total } }, never the
    // single-question shape of /questions/:id.
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data.questions)).toBe(true);
    expect(body.data.questions[0]).toMatchObject({
      id: 'q_1',
      questionText: 'What is photosynthesis?',
      topicName: 'Biology',
      subjectName: 'Integrated Science',
    });

    // The bank query (FROM questions q LEFT JOIN topics) must have run —
    // not the /questions/:id single-row lookup.
    expect(
      calls.some((c) => c.sql.includes('FROM questions q')),
    ).toBe(true);
  });

  it('GET /api/houses/standings returns the standings shape (ranked array), not the /houses/:id single-house shape', async () => {
    const standingsRow = {
      house_id: 'house_1',
      house_name: 'Phoenix',
      house_color: '#ff0000',
      icon: 'fire',
      member_count: 42,
      total_points: 9000,
    };
    const { db } = makeDb(null, [standingsRow]);
    const res = await worker.fetch(
      new Request('http://x/api/houses/standings?period=weekly'),
      { DB: db, JWT_SECRET },
    );
    expect(res.status).toBe(200);

    const body = (await res.json()) as {
      success: boolean;
      data: Array<Record<string, unknown>>;
    };
    expect(body.success).toBe(true);
    // Standings handler returns an ARRAY of ranked houses; /houses/:id
    // returns a single house object (and would 404 on the null first()).
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data[0]).toMatchObject({
      house_id: 'house_1',
      house_name: 'Phoenix',
      rank: 1,
      period: 'weekly',
    });
  });

  it('GET /api/houses/activity returns the activity shape (house_points rows), not the /houses/:id single-house shape', async () => {
    const activityRow = {
      id: 'hp_1',
      user_id: 'user_1',
      house_id: 'house_1',
      points: 10,
      source: 'question',
      created_at: '2026-08-01T10:00:00Z',
      user_name: 'Kofi',
      house_name: 'Phoenix',
      house_color: '#ff0000',
    };
    const { db, calls } = makeDb(null, [activityRow]);
    const res = await worker.fetch(
      new Request('http://x/api/houses/activity?limit=5'),
      { DB: db, JWT_SECRET },
    );
    expect(res.status).toBe(200);

    const body = (await res.json()) as {
      success: boolean;
      data: Array<Record<string, unknown>>;
    };
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data[0]).toMatchObject({
      id: 'hp_1',
      user_name: 'Kofi',
      house_name: 'Phoenix',
    });

    expect(
      calls.some((c) => c.sql.includes('FROM house_points hp')),
    ).toBe(true);
  });
});
