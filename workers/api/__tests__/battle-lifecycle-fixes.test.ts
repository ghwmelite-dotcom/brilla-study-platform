import { describe, it, expect } from 'vitest';
import { sign } from 'hono/jwt';
import worker from '../index';
import { createMockD1, type MockHandler } from './helpers/mockD1';

// Regression tests for the 1v1 battle fixes: join-by-code route, lazy
// waiting-room expiry, post-answer correct-option reveal, speed-bonus
// scoring, battle_win XP on completion, and the deterministic practice bot.

const JWT_SECRET = 'test-secret-that-is-long-enough';

const authUser = { role: 'student', status: 'approved', is_active: 1, session_version: 0 };

function authHandler(userRow: unknown = authUser): MockHandler {
  return {
    match: /SELECT role, status, is_active, session_version FROM users/,
    first: () => userRow,
  };
}

// Last-resort handler so unrelated middleware queries never throw.
function catchAll(): MockHandler {
  return {
    match: /./,
    first: () => null,
    all: () => ({ results: [] }),
    run: () => ({ success: true, meta: { changes: 1 } }),
  };
}

async function token(userId: string) {
  return sign(
    { userId, role: 'student', exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000) },
    JWT_SECRET,
  );
}

function authedPost(url: string, body: unknown, t: string) {
  return new Request(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const env = (db: unknown) => ({ DB: db as D1Database, JWT_SECRET, ENVIRONMENT: 'test' });

// Two-question MC battle payload in the post-transform shape battles.questions stores.
function battleQuestions() {
  return [
    {
      id: 'q1',
      question_type: 'multiple_choice',
      question_text: 'What is 1+1?',
      options: [
        { id: 'A', text: '2', isCorrect: true },
        { id: 'B', text: '3', isCorrect: false },
      ],
      correct_answer: 'A',
      explanation: 'Basic arithmetic.',
      points: 3,
    },
    {
      id: 'q2',
      question_type: 'multiple_choice',
      question_text: 'What is 2+2?',
      options: [
        { id: 'A', text: '3', isCorrect: false },
        { id: 'B', text: '4', isCorrect: true },
      ],
      correct_answer: 'B',
      explanation: 'Basic arithmetic.',
      points: 3,
    },
  ];
}

describe('POST /api/battles/join-by-code', () => {
  const waitingBattle = {
    id: 'battle_1700000000ABCD1234',
    challenger_id: 'challenger_1',
    status: 'waiting',
    question_count: 2,
    questions: JSON.stringify(battleQuestions()),
  };

  function makeDb(battleRow: unknown) {
    return createMockD1([
      authHandler(),
      { match: /UPDATE battles SET status = 'cancelled'/, run: () => ({ success: true, meta: { changes: 0 } }) },
      { match: /UPPER\(SUBSTR\(id, -8\)\)/, first: () => battleRow },
      { match: /UPDATE battles SET[\s\S]*opponent_id/, run: () => ({ success: true, meta: { changes: 1 } }) },
      { match: /SELECT name, avatar_url FROM users/, first: () => ({ name: 'Kwame', avatar_url: null }) },
      catchAll(),
    ]);
  }

  it('joins a waiting battle by code (case-insensitive)', async () => {
    const db = makeDb(waitingBattle);
    const t = await token('joiner_1');
    const res = await worker.fetch(
      authedPost('http://x/api/battles/join-by-code', { code: 'abcd1234' }, t),
      env(db),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean; data: Record<string, unknown> };
    expect(body.success).toBe(true);
    expect(body.data).toMatchObject({
      battleId: waitingBattle.id,
      opponentId: 'joiner_1',
      status: 'active',
    });

    const joinUpdate = db.calls.find((c) => /UPDATE battles SET[\s\S]*opponent_id/.test(c.sql));
    expect(joinUpdate).toBeDefined();
    expect(joinUpdate!.binds[0]).toBe('joiner_1');
    expect(joinUpdate!.binds[1]).toBe(waitingBattle.id);
    // Joining clears the waiting-room expiry for non-demo battles.
    expect(joinUpdate!.sql).toContain('expires_at = CASE WHEN is_demo_data = 1');
  });

  it('returns 404 for an unknown code', async () => {
    const db = makeDb(null);
    const t = await token('joiner_1');
    const res = await worker.fetch(
      authedPost('http://x/api/battles/join-by-code', { code: 'ZZZZ9999' }, t),
      env(db),
    );
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('No waiting battle with that code');
  });

  it('rejects joining your own battle', async () => {
    const db = makeDb({ ...waitingBattle, challenger_id: 'joiner_1' });
    const t = await token('joiner_1');
    const res = await worker.fetch(
      authedPost('http://x/api/battles/join-by-code', { code: 'ABCD1234' }, t),
      env(db),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('Cannot join your own battle');
  });

  it('requires auth (app-level requireAuth route, not shadowed by publicApp /battles/:id)', async () => {
    const db = makeDb(waitingBattle);
    const res = await worker.fetch(
      new Request('http://x/api/battles/join-by-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'ABCD1234' }),
      }),
      env(db),
    );
    expect(res.status).toBe(401);
  });
});

describe('lazy waiting-room expiry', () => {
  it('available-battles list cancels stale waiting battles before reading', async () => {
    const db = createMockD1([
      { match: /UPDATE battles SET status = 'cancelled'/, run: () => ({ success: true, meta: { changes: 2 } }) },
      { match: /FROM battles b/, all: () => ({ results: [] }) },
      catchAll(),
    ]);
    const res = await worker.fetch(new Request('http://x/api/battles/available'), env(db));
    expect(res.status).toBe(200);

    const expire = db.calls.find((c) => c.sql.includes("UPDATE battles SET status = 'cancelled'"));
    expect(expire).toBeDefined();
    expect(expire!.sql).toContain("WHERE status = 'waiting'");
    expect(expire!.sql).toContain('expires_at <= ?');
    // The list query keeps its not-yet-expired filter as a second layer.
    const list = db.calls.find((c) => c.sql.includes('FROM battles b'));
    expect(list!.sql).toContain('(b.expires_at IS NULL OR b.expires_at > ?)');
  });

  it('GET /battles/:id still serves a lazily-cancelled expired battle (client shows expired state)', async () => {
    const cancelledBattle = {
      id: 'battle_expired_1',
      status: 'cancelled',
      challenger_id: 'challenger_1',
      opponent_id: null,
      questions: JSON.stringify([]),
      expires_at: '2020-01-01T00:00:00.000Z',
    };
    const db = createMockD1([
      { match: /UPDATE battles SET status = 'cancelled'/, run: () => ({ success: true, meta: { changes: 1 } }) },
      { match: /FROM battles WHERE id = \? AND opponent_id = \?/, first: () => null },
      { match: /FROM battles b/, first: () => cancelledBattle },
      { match: /FROM questions q/, all: () => ({ results: [] }) },
      catchAll(),
    ]);
    const res = await worker.fetch(new Request('http://x/api/battles/battle_expired_1'), env(db));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { status: string } };
    expect(body.data.status).toBe('cancelled');

    const detail = db.calls.find((c) => c.sql.includes('WHERE b.id = ?'));
    expect(detail!.sql).toContain("b.status != 'waiting'");
  });
});

describe('POST /api/battles/:id/answer', () => {
  const activeBattle = {
    id: 'battle_active_1',
    status: 'active',
    challenger_id: 'user_a',
    opponent_id: 'user_b',
    questions: JSON.stringify(battleQuestions()),
  };

  function makeAnswerDb(opts: {
    answerCounts?: { user_id: string; count: number }[];
    scores?: { challenger_score: number; opponent_score: number; challenger_id: string; opponent_id: string };
    streakSolo?: { winner_id: string | null; completed_at: string }[];
    streakTeam?: { winner_team: number | null; completed_at: string; team_number: number }[];
  } = {}) {
    return createMockD1([
      authHandler(),
      { match: /SELECT \* FROM battles WHERE id = \? AND status = 'active'/, first: () => activeBattle },
      { match: /SELECT id FROM battle_answers/, first: () => null },
      { match: /INSERT INTO battle_answers/, run: () => ({ success: true, meta: { changes: 1 } }) },
      { match: /UPDATE battles SET challenger_score/, run: () => ({ success: true, meta: { changes: 1 } }) },
      { match: /SELECT user_id, COUNT\(\*\) as count FROM battle_answers/, all: () => ({ results: opts.answerCounts ?? [{ user_id: 'user_a', count: 1 }] }) },
      {
        match: /SELECT challenger_score, opponent_score, challenger_id, opponent_id FROM battles/,
        first: () => opts.scores ?? null,
      },
      { match: /UPDATE battles SET status = 'completed'/, run: () => ({ success: true, meta: { changes: 1 } }) },
      { match: /SELECT winner_id, completed_at FROM battles/, all: () => ({ results: opts.streakSolo ?? [] }) },
      { match: /SELECT tb\.winner_team, tb\.completed_at, tbm\.team_number/, all: () => ({ results: opts.streakTeam ?? [] }) },
      { match: /SELECT house FROM users/, first: () => ({ house: null }) },
      catchAll(),
    ]);
  }

  it('reveals the correct option id only in the post-answer response', async () => {
    const db = makeAnswerDb();
    const t = await token('user_a');
    const res = await worker.fetch(
      authedPost('http://x/api/battles/battle_active_1/answer', {
        questionIndex: 0, answer: 'B', timeTaken: 12,
      }, t),
      env(db),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: Record<string, unknown> };
    expect(body.data.isCorrect).toBe(false);
    expect(body.data.correctAnswer).toBe('A');
    expect(body.data.correctOptionId).toBe('A'); // options[0].isCorrect === true
    expect(body.data.battleComplete).toBe(false);
  });

  it.each([
    { timeTaken: 4, expected: 5, label: '<=5s earns +2 speed bonus' },
    { timeTaken: 8, expected: 4, label: '<=10s earns +1 speed bonus' },
    { timeTaken: 30, expected: 3, label: '>10s earns no bonus' },
  ])('correct answer $label', async ({ timeTaken, expected }) => {
    const db = makeAnswerDb();
    const t = await token('user_a');
    const res = await worker.fetch(
      authedPost('http://x/api/battles/battle_active_1/answer', {
        questionIndex: 0, answer: 'A', timeTaken,
      }, t),
      env(db),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { isCorrect: boolean; pointsEarned: number } };
    expect(body.data.isCorrect).toBe(true);
    expect(body.data.pointsEarned).toBe(expected); // base 3 + speed bonus
  });

  it('incorrect answers score 0 regardless of speed', async () => {
    const db = makeAnswerDb();
    const t = await token('user_a');
    const res = await worker.fetch(
      authedPost('http://x/api/battles/battle_active_1/answer', {
        questionIndex: 0, answer: 'B', timeTaken: 2,
      }, t),
      env(db),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { isCorrect: boolean; pointsEarned: number } };
    expect(body.data.isCorrect).toBe(false);
    expect(body.data.pointsEarned).toBe(0);
  });

  it('on completion the winner gets battle_win XP and the loser gets nothing', async () => {
    const db = makeAnswerDb({
      answerCounts: [
        { user_id: 'user_a', count: 2 },
        { user_id: 'user_b', count: 2 },
      ],
      scores: { challenger_score: 10, opponent_score: 6, challenger_id: 'user_a', opponent_id: 'user_b' },
      // The just-completed battle is part of the history (completion UPDATE
      // runs before the streak read), so an empty prior record is streak 1.
      streakSolo: [{ winner_id: 'user_a', completed_at: '2026-09-06 12:00:00' }],
    });
    const t = await token('user_a');
    const res = await worker.fetch(
      authedPost('http://x/api/battles/battle_active_1/answer', {
        questionIndex: 1, answer: 'B', timeTaken: 7,
      }, t),
      env(db),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { battleComplete: boolean } };
    expect(body.data.battleComplete).toBe(true);

    const completion = db.calls.find((c) => c.sql.includes("UPDATE battles SET status = 'completed'"));
    expect(completion!.binds[0]).toBe('user_a'); // winner

    // battle_win award + first-win streak bonus (+10), both to the winner only
    const xpUpdates = db.calls.filter((c) => c.sql.includes('UPDATE users SET xp_points'));
    expect(xpUpdates).toHaveLength(2);
    expect(xpUpdates[0].binds).toEqual([60, 'user_a']); // 50 victory bonus + 10 battle score
    expect(xpUpdates[1].binds).toEqual([10, 'user_a']); // win streak x1

    const ledger = db.calls.filter((c) => c.sql.includes('INSERT INTO points_ledger'));
    expect(ledger).toHaveLength(2);
    expect(ledger[0].binds).toContain('battle_win');
    expect(ledger[1].binds).toContain('battle_win_streak');
    expect(ledger.every((c) => c.binds.includes('user_a'))).toBe(true);

    // win_battles quest progress for the winner (same pattern as /quests/progress)
    const questProgress = db.calls.filter((c) => c.sql.includes('UPDATE user_quests'));
    expect(questProgress.length).toBeGreaterThan(0);
    expect(questProgress.every((c) => c.binds[0] === 'user_a' || c.binds.includes('user_a'))).toBe(true);
  });

  it('win streak increments across consecutive wins', async () => {
    // History (most recent first, including the battle just won): 3 straight wins.
    const db = makeAnswerDb({
      answerCounts: [
        { user_id: 'user_a', count: 2 },
        { user_id: 'user_b', count: 2 },
      ],
      scores: { challenger_score: 10, opponent_score: 6, challenger_id: 'user_a', opponent_id: 'user_b' },
      streakSolo: [
        { winner_id: 'user_a', completed_at: '2026-09-06 12:00:00' },
        { winner_id: 'user_a', completed_at: '2026-09-06 11:00:00' },
        { winner_id: 'user_a', completed_at: '2026-09-06 10:00:00' },
        { winner_id: 'user_b', completed_at: '2026-09-06 09:00:00' }, // loss breaks the run
      ],
    });
    const t = await token('user_a');
    const res = await worker.fetch(
      authedPost('http://x/api/battles/battle_active_1/answer', {
        questionIndex: 1, answer: 'B', timeTaken: 7,
      }, t),
      env(db),
    );
    expect(res.status).toBe(200);

    const xpUpdates = db.calls.filter((c) => c.sql.includes('UPDATE users SET xp_points'));
    expect(xpUpdates.map((c) => c.binds[0])).toEqual([60, 30]); // streak x3 -> +30
    const streakLedger = db.calls.filter(
      (c) => c.sql.includes('INSERT INTO points_ledger') && c.binds.includes('battle_win_streak'),
    );
    expect(streakLedger).toHaveLength(1);
  });

  it('win streak resets after a loss and counts team-battle wins too', async () => {
    const db = makeAnswerDb({
      answerCounts: [
        { user_id: 'user_a', count: 2 },
        { user_id: 'user_b', count: 2 },
      ],
      scores: { challenger_score: 10, opponent_score: 6, challenger_id: 'user_a', opponent_id: 'user_b' },
      streakSolo: [
        { winner_id: 'user_a', completed_at: '2026-09-06 12:00:00' },
        { winner_id: 'user_b', completed_at: '2026-09-06 09:00:00' }, // most recent PRIOR solo was a loss
      ],
      streakTeam: [
        { winner_team: 1, completed_at: '2026-09-06 11:00:00', team_number: 1 }, // team win in between
      ],
    });
    const t = await token('user_a');
    const res = await worker.fetch(
      authedPost('http://x/api/battles/battle_active_1/answer', {
        questionIndex: 1, answer: 'B', timeTaken: 7,
      }, t),
      env(db),
    );
    expect(res.status).toBe(200);

    // Merged timeline: win (this battle, 12:00), team win (11:00), solo loss (09:00) -> streak 2.
    const xpUpdates = db.calls.filter((c) => c.sql.includes('UPDATE users SET xp_points'));
    expect(xpUpdates.map((c) => c.binds[0])).toEqual([60, 20]);
  });

  it('win-streak bonus caps at +50', async () => {
    const db = makeAnswerDb({
      answerCounts: [
        { user_id: 'user_a', count: 2 },
        { user_id: 'user_b', count: 2 },
      ],
      scores: { challenger_score: 10, opponent_score: 6, challenger_id: 'user_a', opponent_id: 'user_b' },
      streakSolo: Array.from({ length: 8 }, (_, i) => ({
        winner_id: 'user_a',
        completed_at: `2026-09-06 ${String(12 - i).padStart(2, '0')}:00:00`,
      })),
    });
    const t = await token('user_a');
    const res = await worker.fetch(
      authedPost('http://x/api/battles/battle_active_1/answer', {
        questionIndex: 1, answer: 'B', timeTaken: 7,
      }, t),
      env(db),
    );
    expect(res.status).toBe(200);

    const xpUpdates = db.calls.filter((c) => c.sql.includes('UPDATE users SET xp_points'));
    expect(xpUpdates.map((c) => c.binds[0])).toEqual([60, 50]); // streak 8 -> capped +50
  });
});

describe('win-streak surfacing on completed battles', () => {
  it('GET /battles/:id includes winner_streak and winner_streak_bonus', async () => {
    const completedBattle = {
      id: 'battle_done_1',
      status: 'completed',
      challenger_id: 'user_a',
      opponent_id: 'user_b',
      winner_id: 'user_a',
      questions: JSON.stringify([]),
      expires_at: null,
    };
    const db = createMockD1([
      { match: /UPDATE battles SET status = 'cancelled'/, run: () => ({ success: true, meta: { changes: 0 } }) },
      { match: /FROM battles WHERE id = \? AND opponent_id = \?/, first: () => null },
      { match: /FROM battles b/, first: () => completedBattle },
      { match: /FROM questions q/, all: () => ({ results: [] }) },
      {
        match: /SELECT winner_id, completed_at FROM battles/,
        all: () => ({
          results: [
            { winner_id: 'user_a', completed_at: '2026-09-06 12:00:00' },
            { winner_id: 'user_a', completed_at: '2026-09-06 11:00:00' },
            { winner_id: 'user_b', completed_at: '2026-09-06 10:00:00' },
          ],
        }),
      },
      { match: /SELECT tb\.winner_team/, all: () => ({ results: [] }) },
      catchAll(),
    ]);
    const res = await worker.fetch(new Request('http://x/api/battles/battle_done_1'), env(db));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: Record<string, unknown> };
    expect(body.data.winner_streak).toBe(2);
    expect(body.data.winner_streak_bonus).toBe(20);
  });

  it('omits streak fields while the battle is not completed', async () => {
    const activeBattle = {
      id: 'battle_live_1',
      status: 'active',
      challenger_id: 'user_a',
      opponent_id: 'user_b',
      winner_id: null,
      questions: JSON.stringify([]),
      expires_at: null,
    };
    const db = createMockD1([
      { match: /UPDATE battles SET status = 'cancelled'/, run: () => ({ success: true, meta: { changes: 0 } }) },
      { match: /FROM battles WHERE id = \? AND opponent_id = \?/, first: () => null },
      { match: /FROM battles b/, first: () => activeBattle },
      { match: /FROM questions q/, all: () => ({ results: [] }) },
      catchAll(),
    ]);
    const res = await worker.fetch(new Request('http://x/api/battles/battle_live_1'), env(db));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: Record<string, unknown> };
    expect(body.data).not.toHaveProperty('winner_streak');
    expect(db.calls.some((c) => c.sql.includes('SELECT winner_id, completed_at FROM battles'))).toBe(false);
  });
});

describe('practice bot battles', () => {
  it('POST /api/battles with vsBot creates an active battle against bot_battler', async () => {
    const db = createMockD1([
      authHandler(),
      {
        match: /SELECT q\.\* FROM questions q/,
        all: () => ({
          results: [
            { id: 'q1', question_type: 'multiple_choice', options: JSON.stringify(['2', '3']), correct_answer: 'A', points: 3 },
            { id: 'q2', question_type: 'multiple_choice', options: JSON.stringify(['3', '4']), correct_answer: 'B', points: 3 },
          ],
        }),
      },
      { match: /INSERT OR IGNORE INTO users/, run: () => ({ success: true, meta: { changes: 1 } }) },
      { match: /INSERT INTO battles/, run: () => ({ success: true, meta: { changes: 1 } }) },
      { match: /SELECT name, avatar_url FROM users/, first: () => ({ name: 'Ama', avatar_url: null }) },
      catchAll(),
    ]);
    const t = await token('user_h');
    const res = await worker.fetch(
      authedPost('http://x/api/battles', { difficulty: 'medium', questionCount: 2, vsBot: true }, t),
      env(db),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: Record<string, unknown> };
    expect(body.data).toMatchObject({
      status: 'active',
      opponentId: 'bot_battler',
      opponentName: 'Brilla Bot',
    });

    const botGuard = db.calls.find((c) => c.sql.includes('INSERT OR IGNORE INTO users'));
    expect(botGuard).toBeDefined();
    expect(botGuard!.binds[0]).toBe('bot_battler');

    const insert = db.calls.find((c) => c.sql.includes('INSERT INTO battles'));
    expect(insert!.sql).toContain("'active'");
    expect(insert!.binds).toContain('bot_battler');
  });

  const botBattleRow = {
    id: 'battle_bot_1',
    status: 'active',
    challenger_id: 'user_h',
    opponent_id: 'bot_battler',
    difficulty: 'medium',
    questions: JSON.stringify(battleQuestions()),
    started_at: '2020-01-01 00:00:00', // every scheduled bot answer is due
    created_at: '2020-01-01 00:00:00',
    is_demo_data: 0,
    expires_at: null,
  };

  function makeBotGetDb(opts: {
    existingBotAnswers?: boolean;
    humanCount?: number;
    scores?: { challenger_score: number; opponent_score: number; challenger_id: string; opponent_id: string };
  } = {}) {
    return createMockD1([
      { match: /UPDATE battles SET status = 'cancelled'/, run: () => ({ success: true, meta: { changes: 0 } }) },
      { match: /FROM battles WHERE id = \? AND opponent_id = \? AND status = 'active'/, first: () => botBattleRow },
      {
        match: /SELECT id FROM battle_answers/,
        first: () => (opts.existingBotAnswers ? { id: 'ba_existing' } : null),
      },
      { match: /INSERT INTO battle_answers/, run: () => ({ success: true, meta: { changes: 1 } }) },
      { match: /UPDATE battles SET opponent_score/, run: () => ({ success: true, meta: { changes: 1 } }) },
      {
        match: /SELECT user_id, COUNT\(\*\) as count FROM battle_answers/,
        all: () => ({
          results: [
            { user_id: 'bot_battler', count: 2 },
            { user_id: 'user_h', count: opts.humanCount ?? 2 },
          ],
        }),
      },
      {
        match: /SELECT challenger_score, opponent_score, challenger_id, opponent_id FROM battles/,
        first: () => opts.scores ?? { challenger_score: 4, opponent_score: 11, challenger_id: 'user_h', opponent_id: 'bot_battler' },
      },
      { match: /UPDATE battles SET status = 'completed'/, run: () => ({ success: true, meta: { changes: 1 } }) },
      // Win-streak history: the just-completed battle counts (completion
      // UPDATE runs before the streak read), so the human winner is streak 1.
      {
        match: /SELECT winner_id, completed_at FROM battles/,
        all: (binds) => ({
          results: binds[0] === 'user_h'
            ? [{ winner_id: 'user_h', completed_at: '2026-09-06 12:00:00' }]
            : [],
        }),
      },
      { match: /SELECT tb\.winner_team/, all: () => ({ results: [] }) },
      { match: /FROM battles b/, first: () => ({ ...botBattleRow, questions: JSON.stringify([]) }) },
      { match: /FROM questions q/, all: () => ({ results: [] }) },
      { match: /SELECT house FROM users/, first: () => ({ house: null }) },
      catchAll(),
    ]);
  }

  it('GET materializes due bot answers with scheduled delays and completes the battle', async () => {
    const db = makeBotGetDb();
    const res = await worker.fetch(new Request('http://x/api/battles/battle_bot_1'), env(db));
    expect(res.status).toBe(200);

    const botInserts = db.calls.filter((c) => c.sql.includes('INSERT INTO battle_answers'));
    expect(botInserts).toHaveLength(2);
    for (const insert of botInserts) {
      expect(insert.binds[2]).toBe('bot_battler');
      const timeTaken = insert.binds[6] as number;
      expect(timeTaken).toBeGreaterThanOrEqual(12);
      expect(timeTaken).toBeLessThanOrEqual(25);
    }

    const completion = db.calls.find((c) => c.sql.includes("UPDATE battles SET status = 'completed'"));
    expect(completion).toBeDefined();
    expect(completion!.binds[0]).toBe('bot_battler'); // bot outscored the human

    // Bot winners must never receive XP or quest progress.
    expect(db.calls.some((c) => c.sql.includes('UPDATE users SET xp_points'))).toBe(false);
    expect(db.calls.some((c) => c.sql.includes('INSERT INTO points_ledger'))).toBe(false);
    expect(db.calls.some((c) => c.sql.includes('UPDATE user_quests'))).toBe(false);
  });

  it('awards battle_win XP to the human when the human beats the bot', async () => {
    const db = makeBotGetDb({
      scores: { challenger_score: 11, opponent_score: 4, challenger_id: 'user_h', opponent_id: 'bot_battler' },
    });
    const res = await worker.fetch(new Request('http://x/api/battles/battle_bot_1'), env(db));
    expect(res.status).toBe(200);

    const xpUpdates = db.calls.filter((c) => c.sql.includes('UPDATE users SET xp_points'));
    expect(xpUpdates).toHaveLength(2);
    expect(xpUpdates[0].binds).toEqual([61, 'user_h']); // 50 + 11 battle_win
    expect(xpUpdates[1].binds).toEqual([10, 'user_h']); // win streak x1
    expect(xpUpdates.every((c) => !c.binds.includes('bot_battler'))).toBe(true);
  });

  it('is idempotent: existing bot answers are not re-inserted', async () => {
    const db = makeBotGetDb({ existingBotAnswers: true, humanCount: 1 });
    const res = await worker.fetch(new Request('http://x/api/battles/battle_bot_1'), env(db));
    expect(res.status).toBe(200);
    expect(db.calls.some((c) => c.sql.includes('INSERT INTO battle_answers'))).toBe(false);
  });
});
