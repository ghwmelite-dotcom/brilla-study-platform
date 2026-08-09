import { describe, it, expect } from 'vitest';
import { sign } from 'hono/jwt';
import worker from '../index';
import { createMockD1, type MockHandler } from '../__tests__/helpers/mockD1';

// Regression tests for the phantom users.xp column fix: every XP award or
// deduction must target the real xp_points column. The quick-play /submit
// assertion targets the users UPDATE statement itself, so it survives the
// Task 12 grading-loop rewiring.

const JWT_SECRET = 'test-secret-that-is-long-enough';

async function token(payload: object) {
  return sign(
    { ...payload, exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000) },
    JWT_SECRET,
  );
}

const authHandler: MockHandler = {
  match: /SELECT role, status, is_active FROM users/,
  first: () => ({ role: 'student', status: 'approved', is_active: 1 }),
};

describe('XP awards use the real users.xp_points column', () => {
  it('POST /api/quickplay/submit awards XP via UPDATE users SET xp_points = xp_points + ?', async () => {
    const db = createMockD1([
      authHandler,
      {
        match: /SELECT \* FROM quick_play_sessions WHERE id = \?/,
        first: () => ({
          id: 'sess_1',
          user_id: 'user_1',
          game_type: 'subject_dash',
          completed_at: null,
        }),
      },
      {
        match: /SELECT correct_answer, explanation FROM questions/,
        first: () => ({ correct_answer: 'A', explanation: 'because' }),
      },
      {
        match: /SELECT id, multiplier FROM daily_multipliers/,
        first: () => null,
      },
      { match: /UPDATE quick_play_sessions/ },
      { match: /UPDATE users SET xp_points = xp_points \+/ },
      { match: /INSERT INTO activity_feed/ },
    ]);

    const t = await token({ userId: 'user_1', role: 'student' });
    const res = await worker.fetch(
      new Request('http://x/api/quickplay/submit', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'sess_1',
          answers: [{ questionId: 'q1', answer: 'A' }],
          timeTaken: 15000,
        }),
      }),
      { DB: db as unknown as D1Database, JWT_SECRET },
    );
    expect(res.status).toBe(200);

    const award = db.calls.find((c) => /UPDATE users SET/.test(c.sql));
    expect(award).toBeDefined();
    expect(award!.sql).toMatch(/UPDATE users SET xp_points = xp_points \+ \?/);
    expect(award!.binds[1]).toBe('user_1');
    // No statement anywhere may touch the phantom users.xp column.
    expect(db.calls.some((c) => /SET xp =/.test(c.sql))).toBe(false);
  });

  it('POST /api/events/tournaments/:id/join deducts the entry fee via xp_points - ?', async () => {
    const db = createMockD1([
      authHandler,
      {
        match: /SELECT \* FROM tournaments WHERE id = \?/,
        first: () => ({
          id: 'tour_1',
          status: 'active',
          max_participants: null,
          entry_fee: 50,
        }),
      },
      {
        match: /SELECT id FROM tournament_participants/,
        first: () => null,
      },
      {
        match: /SELECT xp_points FROM users/,
        first: () => ({ xp_points: 100 }),
      },
      { match: /UPDATE users SET xp_points = xp_points - \?/ },
      { match: /INSERT INTO tournament_participants/ },
    ]);

    const t = await token({ userId: 'user_1', role: 'student' });
    const res = await worker.fetch(
      new Request('http://x/api/events/tournaments/tour_1/join', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}` },
      }),
      { DB: db as unknown as D1Database, JWT_SECRET },
    );
    expect(res.status).toBe(200);

    const deduction = db.calls.find((c) => /UPDATE users SET/.test(c.sql));
    expect(deduction).toBeDefined();
    expect(deduction!.sql).toMatch(/xp_points - \?/);
    expect(deduction!.binds).toEqual([50, 'user_1']);
    expect(db.calls.some((c) => /SET xp =/.test(c.sql))).toBe(false);
  });
});
