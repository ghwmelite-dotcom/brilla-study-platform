import { describe, it, expect, vi } from 'vitest';
import { sign } from 'hono/jwt';
import worker from '../index';

// IDOR regression tests for the houses/battles family in index.ts: identity
// must come from the verified JWT (via shared requireAuth), never from the
// request body or query string.

const JWT_SECRET = 'test-secret-that-is-long-enough';

function makeDb(userRow: unknown, allResults: Record<string, unknown>[] = []) {
  const calls: { sql: string; args: unknown[] }[] = [];
  const db = {
    prepare: vi.fn((sql: string) => ({
      bind: (...args: unknown[]) => {
        calls.push({ sql, args });
        return {
          first: vi.fn().mockResolvedValue(userRow),
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

describe('houses/battles IDOR fixes', () => {
  it('POST /api/houses/points with a student token returns 403 (no self-award)', async () => {
    const { db, calls } = makeDb({ role: 'student', status: 'approved', is_active: 1 });
    const t = await token({ userId: 'student_1', role: 'student' });
    const res = await worker.fetch(
      new Request('http://x/api/houses/points', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ houseId: 'house_1', points: 100, source: 'manual' }),
      }),
      { DB: db, JWT_SECRET },
    );
    expect(res.status).toBe(403);
    expect(calls.some((c) => c.sql.includes('INSERT INTO house_points'))).toBe(false);
  });

  it('POST /api/battles with a spoofed body userId inserts the row with the JWT identity', async () => {
    const { db, calls } = makeDb({ role: 'student', status: 'approved', is_active: 1 });
    const t = await token({ userId: 'attacker_1', role: 'student' });
    const res = await worker.fetch(
      new Request('http://x/api/battles', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'victim_1', subjectId: 'subj_1', questionCount: 5 }),
      }),
      { DB: db, JWT_SECRET },
    );
    expect(res.status).toBe(200);

    const insert = calls.find((c) => c.sql.includes('INSERT INTO battles'));
    expect(insert).toBeDefined();
    // challenger_id is the 2nd bound param — must be the attacker, not 'victim_1'.
    expect(insert!.args[1]).toBe('attacker_1');
    expect(insert!.args).not.toContain('victim_1');

    const body = (await res.json()) as { data: { challengerId: string } };
    expect(body.data.challengerId).toBe('attacker_1');
  });

  it('GET /api/battles/history without a token returns 401 (publicApp duplicate removed)', async () => {
    const { db } = makeDb({ role: 'student', status: 'approved', is_active: 1 });
    const res = await worker.fetch(
      new Request('http://x/api/battles/history?userId=victim_1'),
      { DB: db, JWT_SECRET },
    );
    expect(res.status).toBe(401);
  });

  it('GET /api/battles/history with a token serves the JWT identity and ignores ?userId=', async () => {
    const { db, calls } = makeDb({ role: 'student', status: 'approved', is_active: 1 });
    const t = await token({ userId: 'user_1', role: 'student' });
    const res = await worker.fetch(
      new Request('http://x/api/battles/history?userId=victim_1', {
        headers: { Authorization: `Bearer ${t}` },
      }),
      { DB: db, JWT_SECRET },
    );
    expect(res.status).toBe(200);

    // The history SELECT must bind the JWT user, never the query param.
    const select = calls.find((c) => c.sql.includes('FROM battles b'));
    expect(select).toBeDefined();
    expect(select!.args.slice(0, 5)).toEqual(['user_1', 'user_1', 'user_1', 'user_1', 'user_1']);
    expect(select!.args).not.toContain('victim_1');
  });

  it('GET /api/battles/history returns rows in the Competition-page shape (your_score/opponent)', async () => {
    const battleRow = {
      id: 'battle_1',
      status: 'completed',
      winner_id: 'user_1',
      your_score: 24,
      opponent_score: 18,
      created_at: '2026-08-01T10:00:00Z',
      opponent_name_display: 'Ama Serwaa',
    };
    const { db } = makeDb({ role: 'student', status: 'approved', is_active: 1 }, [battleRow]);
    const t = await token({ userId: 'user_1', role: 'student' });
    const res = await worker.fetch(
      new Request('http://x/api/battles/history?limit=10', {
        headers: { Authorization: `Bearer ${t}` },
      }),
      { DB: db, JWT_SECRET },
    );
    expect(res.status).toBe(200);

    const body = (await res.json()) as {
      success: boolean;
      data: Array<Record<string, unknown> & { opponent?: { name?: string } }>;
    };
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0]).toMatchObject({
      id: 'battle_1',
      status: 'completed',
      winner_id: 'user_1',
      your_score: 24,
      opponent_score: 18,
      created_at: '2026-08-01T10:00:00Z',
      opponent: { name: 'Ama Serwaa' },
    });
  });
});
