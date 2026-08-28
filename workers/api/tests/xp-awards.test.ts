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
  match: /SELECT role, status, is_active, session_version FROM users/,
  first: () => ({ role: 'student', status: 'approved', is_active: 1 }),
};

async function boundSessionId(questionIds: string[]): Promise<string> {
  const payload = btoa(JSON.stringify({ sessionId: 'sess_1', questionIds }))
    .split('+').join('-')
    .split('/').join('_')
    .replace(/=+$/u, '');
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signatureBytes = new Uint8Array(
    await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload)),
  );
  let binary = '';
  for (const byte of signatureBytes) binary += String.fromCharCode(byte);
  const signature = btoa(binary)
    .split('+').join('-')
    .split('/').join('_')
    .replace(/=+$/u, '');
  return `qps1.${payload}.${signature}`;
}

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
        match: /SELECT q.id, q.correct_answer, q.explanation/,
        all: () => ({ results: [{ id: 'q1', correct_answer: 'A', explanation: 'because' }] }),
      },
      {
        match: /SELECT id, multiplier FROM daily_multipliers/,
        first: () => null,
      },
      { match: /UPDATE quick_play_sessions/ },
      // awardPoints (question_correct): daily cap read, XP update, cycle
      // lookup, ledger insert, house lookup (unhoused -> no house_points row).
      { match: /AS today FROM points_ledger/, first: () => ({ today: 0 }) },
      { match: /UPDATE users SET xp_points = xp_points \+/ },
      { match: /FROM race_cycles rc/, first: () => null },
      { match: /INSERT INTO points_ledger/ },
      { match: /SELECT house FROM users/, first: () => null },
      { match: /INSERT INTO activity_feed/ },
    ]);

    const t = await token({ userId: 'user_1', role: 'student' });
    const res = await worker.fetch(
      new Request('http://x/api/quickplay/submit', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: await boundSessionId(['q1']),
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
    // Conditional debit (Task 7): the balance guard is the third bind, so no
    // separate balance SELECT is needed.
    expect(deduction!.binds).toEqual([50, 'user_1', 50]);
    expect(db.calls.some((c) => /SELECT xp_points FROM users/.test(c.sql))).toBe(false);
    expect(db.calls.some((c) => /SET xp =/.test(c.sql))).toBe(false);
  });

  it('POST /api/engagement/streak/rescue reads the real streak_days column', async () => {
    const db = createMockD1([
      authHandler,
      {
        match: /SELECT streak_days, streak_protections FROM users/,
        first: () => ({ streak_days: 7, streak_protections: 2 }),
      },
      { match: /UPDATE users\s+SET streak_protections = streak_protections - 1/ },
      { match: /INSERT INTO streak_rescues/ },
    ]);

    const t = await token({ userId: 'user_1', role: 'student' });
    const res = await worker.fetch(
      new Request('http://x/api/engagement/streak/rescue', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}` },
      }),
      { DB: db as unknown as D1Database, JWT_SECRET },
    );
    expect(res.status).toBe(200);

    // No statement may select the phantom users.streak column (real: streak_days).
    expect(db.calls.some((c) => /SELECT streak\b(?!_)/.test(c.sql))).toBe(false);

    // Rescue log binds streak_days before and after (phantom read would bind undefined).
    const rescue = db.calls.find((c) => /INSERT INTO streak_rescues/.test(c.sql));
    expect(rescue).toBeDefined();
    expect(rescue!.binds.slice(2)).toEqual([7, 7]);

    const body = (await res.json()) as { data: { currentStreak: number; protectionsRemaining: number } };
    expect(body.data.currentStreak).toBe(7);
    expect(body.data.protectionsRemaining).toBe(1);
  });
});
