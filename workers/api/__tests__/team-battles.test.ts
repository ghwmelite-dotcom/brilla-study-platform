import { describe, it, expect } from 'vitest';
import { sign } from 'hono/jwt';
import worker from '../index';
import { createMockD1, type MockHandler } from './helpers/mockD1';

// Phase B tests for 3v3 team battles: equal-size captain start, 3-per-team
// cap, round-window answer enforcement, duplicate rejection, lazy completion
// (win / tie-break / draw), winner-only battle_win XP, waiting expiry, leave
// rules, and GET answer-material hygiene.

const JWT_SECRET = 'test-secret-that-is-long-enough';

const authUser = { role: 'student', status: 'approved', is_active: 1, session_version: 0 };

function authHandler(): MockHandler {
  return {
    match: /SELECT role, status, is_active, session_version FROM users/,
    first: () => authUser,
  };
}

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

function post(url: string, body: unknown, t: string) {
  return new Request(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function get(url: string, t: string) {
  return new Request(url, { headers: { Authorization: `Bearer ${t}` } });
}

const env = (db: unknown) => ({ DB: db as D1Database, JWT_SECRET, ENVIRONMENT: 'test' });

function battleRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'tb_1',
    status: 'active',
    total_questions: 3,
    time_per_question: 30,
    question_ids: JSON.stringify(['q1', 'q2', 'q3']),
    team1_score: 0,
    team2_score: 0,
    winner_team: null,
    xp_reward: 200,
    started_at: new Date().toISOString(), // round 0 open right now
    created_at: new Date().toISOString(),
    subject_id: null,
    topic_id: null,
    ...overrides,
  };
}

describe('POST /api/team-battles/:id/start', () => {
  function makeStartDb(opts: { isCaptain: number; count1: number; count2: number; sampledIds?: string[] }) {
    return createMockD1([
      authHandler(),
      { match: /UPDATE team_battles SET status = 'cancelled'/, run: () => ({ success: true, meta: { changes: 0 } }) },
      {
        match: /SELECT is_captain FROM team_battle_members/,
        first: () => ({ is_captain: opts.isCaptain }),
      },
      {
        match: /FROM team_battles WHERE id = \? AND status IN/,
        first: () => battleRow({ status: 'waiting', started_at: null, question_ids: null, total_questions: 3 }),
      },
      {
        match: /GROUP BY team_number/,
        all: () => ({
          results: [
            { team_number: 1, count: opts.count1 },
            { team_number: 2, count: opts.count2 },
          ],
        }),
      },
      {
        match: /SELECT q\.id/,
        all: () => ({ results: (opts.sampledIds ?? ['q1', 'q2', 'q3']).map((id) => ({ id })) }),
      },
      catchAll(),
    ]);
  }

  it('rejects non-captains', async () => {
    const db = makeStartDb({ isCaptain: 0, count1: 2, count2: 2 });
    const t = await token('member_1');
    const res = await worker.fetch(post('http://x/api/team-battles/tb_1/start', {}, t), env(db));
    expect(res.status).toBe(403);
  });

  it('rejects unequal team sizes', async () => {
    const db = makeStartDb({ isCaptain: 1, count1: 2, count2: 1 });
    const t = await token('captain_1');
    const res = await worker.fetch(post('http://x/api/team-battles/tb_1/start', {}, t), env(db));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain('same number of players');
    expect(db.calls.some((c) => c.sql.includes("SET status = 'active'"))).toBe(false);
  });

  it('rejects teams larger than 3', async () => {
    const db = makeStartDb({ isCaptain: 1, count1: 4, count2: 4 });
    const t = await token('captain_1');
    const res = await worker.fetch(post('http://x/api/team-battles/tb_1/start', {}, t), env(db));
    expect(res.status).toBe(400);
  });

  it('starts an equal-size battle: samples the bank, stores question_ids, sets started_at', async () => {
    const db = makeStartDb({ isCaptain: 1, count1: 2, count2: 2 });
    const t = await token('captain_1');
    const res = await worker.fetch(post('http://x/api/team-battles/tb_1/start', {}, t), env(db));
    expect(res.status === 200).toBe(true);

    const start = db.calls.find((c) => c.sql.includes("SET status = 'active'"));
    expect(start).toBeDefined();
    expect(start!.sql).toContain("started_at = datetime('now')");
    expect(JSON.parse(start!.binds[0] as string)).toEqual(['q1', 'q2', 'q3']);
    // Same shared-bank sampler discipline as 1v1: active subjects, real topics
    const sample = db.calls.find((c) => /SELECT q\.id/.test(c.sql));
    expect(sample!.sql).toContain('ORDER BY RANDOM()');
    expect(sample!.sql).toContain('s.is_active = 1');
  });

  it('fails when the bank cannot fill the question set', async () => {
    const db = makeStartDb({ isCaptain: 1, count1: 1, count2: 1, sampledIds: ['q1'] });
    const t = await token('captain_1');
    const res = await worker.fetch(post('http://x/api/team-battles/tb_1/start', {}, t), env(db));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('Not enough questions available');
  });
});

describe('POST /api/team-battles/:id/join', () => {
  it('enforces the 3-per-team cap', async () => {
    const db = createMockD1([
      authHandler(),
      { match: /UPDATE team_battles SET status = 'cancelled'/, run: () => ({ success: true, meta: { changes: 0 } }) },
      { match: /FROM team_battles WHERE id = \? AND status IN/, first: () => battleRow({ status: 'waiting' }) },
      { match: /FROM team_battle_members WHERE battle_id = \? AND user_id = \?/, first: () => null },
      {
        match: /COUNT\(\*\) as count FROM team_battle_members WHERE battle_id = \? AND team_number = \?/,
        first: () => ({ count: 3 }),
      },
      catchAll(),
    ]);
    const t = await token('late_1');
    const res = await worker.fetch(post('http://x/api/team-battles/tb_1/join', { teamNumber: 1 }, t), env(db));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('Team is full');
    expect(db.calls.some((c) => c.sql.includes('INSERT INTO team_battle_members'))).toBe(false);
  });
});

describe('POST /api/team-battles/:id/answer', () => {
  function makeAnswerDb(opts: {
    battle?: Record<string, unknown>;
    existingAnswer?: boolean;
    correctAnswer?: string;
  } = {}) {
    return createMockD1([
      authHandler(),
      { match: /FROM team_battles WHERE id = \?/, first: () => opts.battle ?? battleRow() },
      {
        match: /FROM team_battle_members WHERE battle_id = \? AND user_id = \?/,
        first: () => ({ id: 'm1', battle_id: 'tb_1', user_id: 'u1', team_number: 1, is_captain: 1 }),
      },
      {
        match: /SELECT id FROM team_battle_answers/,
        first: () => (opts.existingAnswer ? { id: 'tba_1' } : null),
      },
      {
        match: /SELECT q\.correct_answer, q\.points/,
        first: () => ({ correct_answer: opts.correctAnswer ?? 'A', points: 3 }),
      },
      catchAll(),
    ]);
  }

  it('rejects answers for rounds that are not open', async () => {
    const db = makeAnswerDb(); // round 0 is open; q2 is round 1
    const t = await token('u1');
    const res = await worker.fetch(
      post('http://x/api/team-battles/tb_1/answer', { questionId: 'q2', answer: 'A' }, t),
      env(db),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('That round is not open');
    expect(db.calls.some((c) => c.sql.includes('INSERT INTO team_battle_answers'))).toBe(false);
  });

  it('rejects duplicate answers', async () => {
    const db = makeAnswerDb({ existingAnswer: true });
    const t = await token('u1');
    const res = await worker.fetch(
      post('http://x/api/team-battles/tb_1/answer', { questionId: 'q1', answer: 'A' }, t),
      env(db),
    );
    expect(res.status).toBe(409);
  });

  it('scores base + speed bonus measured from round open', async () => {
    const db = makeAnswerDb();
    const t = await token('u1');
    const res = await worker.fetch(
      post('http://x/api/team-battles/tb_1/answer', { questionId: 'q1', answer: 'A' }, t),
      env(db),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: Record<string, unknown> };
    expect(body.data.correct).toBe(true);
    expect(body.data.points).toBe(5); // 3 base + 2 speed (answered at round open)
    expect(body.data.correctAnswer).toBe('A');

    const insert = db.calls.find((c) => c.sql.includes('INSERT INTO team_battle_answers'));
    expect(insert).toBeDefined();
    expect(insert!.binds[4]).toBe(0); // question_index
    expect(insert!.binds[6]).toBe(1); // is_correct
    expect(insert!.binds[8]).toBe(5); // points_earned

    const teamScore = db.calls.find((c) => c.sql.includes('team1_score = team1_score + ?'));
    expect(teamScore).toBeDefined();
    expect(teamScore!.binds[0]).toBe(5);
  });

  it('incorrect answers score 0', async () => {
    const db = makeAnswerDb();
    const t = await token('u1');
    const res = await worker.fetch(
      post('http://x/api/team-battles/tb_1/answer', { questionId: 'q1', answer: 'B' }, t),
      env(db),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { correct: boolean; points: number } };
    expect(body.data.correct).toBe(false);
    expect(body.data.points).toBe(0);
  });

  it('rejects answers after the final round and lazily completes the battle', async () => {
    const endedBattle = battleRow({
      started_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // all rounds closed
      team1_score: 9,
      team2_score: 4,
    });
    const db = makeAnswerDb({ battle: endedBattle });
    const t = await token('u1');
    const res = await worker.fetch(
      post('http://x/api/team-battles/tb_1/answer', { questionId: 'q1', answer: 'A' }, t),
      env(db),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('Battle has ended');

    const completion = db.calls.find((c) => c.sql.includes("UPDATE team_battles SET status = 'completed'"));
    expect(completion).toBeDefined();
    expect(completion!.binds[0]).toBe(1); // team 1 wins 9-4
    expect(completion!.sql).toContain("AND status = 'active'"); // idempotency guard
  });
});

describe('lazy completion + XP', () => {
  function makeGetDb(opts: {
    battle: Record<string, unknown>;
    times?: { team_number: number; total_time: number }[];
    winners?: { user_id: string }[];
  }) {
    return createMockD1([
      authHandler(),
      { match: /UPDATE team_battles SET status = 'cancelled'/, run: () => ({ success: true, meta: { changes: 0 } }) },
      // finalize's battle read (no alias)
      { match: /SELECT \* FROM team_battles WHERE id = \?/, first: () => opts.battle },
      { match: /total_time/, all: () => ({ results: opts.times ?? [] }) },
      {
        match: /SELECT user_id FROM team_battle_members WHERE battle_id = \? AND team_number = \?/,
        all: () => ({ results: opts.winners ?? [] }),
      },
      // GET's battle read (alias tb)
      { match: /FROM team_battles tb/, first: () => opts.battle },
      { match: /answered_count/, all: () => ({ results: [] }) },
      { match: /SELECT house FROM users/, first: () => ({ house: null }) },
      catchAll(),
    ]);
  }

  const endedRow = (overrides: Record<string, unknown> = {}) =>
    battleRow({
      total_questions: 2,
      started_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      ...overrides,
    });

  it('completes with a winner and awards battle_win XP to winning members only', async () => {
    const db = makeGetDb({
      battle: endedRow({ team1_score: 12, team2_score: 6 }),
      winners: [{ user_id: 'w1' }, { user_id: 'w2' }],
    });
    const t = await token('w1');
    const res = await worker.fetch(get('http://x/api/team-battles/tb_1', t), env(db));
    expect(res.status).toBe(200);

    const completion = db.calls.find((c) => c.sql.includes("UPDATE team_battles SET status = 'completed'"));
    expect(completion!.binds[0]).toBe(1);

    const xp = db.calls.filter((c) => c.sql.includes('UPDATE users SET xp_points'));
    expect(xp.map((c) => c.binds[1]).sort()).toEqual(['w1', 'w2']);
    expect(xp.every((c) => c.binds[0] === 200)).toBe(true); // xp_reward per winning member

    const ledger = db.calls.filter((c) => c.sql.includes('INSERT INTO points_ledger'));
    expect(ledger).toHaveLength(2);
    expect(ledger.every((c) => c.binds.includes('battle_win'))).toBe(true);
  });

  it('breaks score ties on lower aggregate time_taken', async () => {
    const db = makeGetDb({
      battle: endedRow({ team1_score: 8, team2_score: 8 }),
      times: [
        { team_number: 1, total_time: 42 },
        { team_number: 2, total_time: 30 },
      ],
      winners: [{ user_id: 'w9' }],
    });
    const t = await token('w9');
    const res = await worker.fetch(get('http://x/api/team-battles/tb_1', t), env(db));
    expect(res.status).toBe(200);

    const completion = db.calls.find((c) => c.sql.includes("UPDATE team_battles SET status = 'completed'"));
    expect(completion!.binds[0]).toBe(2); // team 2 was faster
  });

  it('records a draw (winner_team NULL) and awards no XP when score and time tie', async () => {
    const db = makeGetDb({
      battle: endedRow({ team1_score: 8, team2_score: 8 }),
      times: [
        { team_number: 1, total_time: 30 },
        { team_number: 2, total_time: 30 },
      ],
    });
    const t = await token('u1');
    const res = await worker.fetch(get('http://x/api/team-battles/tb_1', t), env(db));
    expect(res.status).toBe(200);

    const completion = db.calls.find((c) => c.sql.includes("UPDATE team_battles SET status = 'completed'"));
    expect(completion!.binds[0]).toBeNull();
    expect(db.calls.some((c) => c.sql.includes('UPDATE users SET xp_points'))).toBe(false);
    expect(db.calls.some((c) => c.sql.includes('INSERT INTO points_ledger'))).toBe(false);
  });

  it('does not re-complete (or re-award) an already completed battle', async () => {
    const db = makeGetDb({ battle: endedRow({ status: 'completed', winner_team: 1 }) });
    const t = await token('u1');
    const res = await worker.fetch(get('http://x/api/team-battles/tb_1', t), env(db));
    expect(res.status).toBe(200);
    expect(db.calls.some((c) => c.sql.includes("UPDATE team_battles SET status = 'completed'"))).toBe(false);
    expect(db.calls.some((c) => c.sql.includes('UPDATE users SET xp_points'))).toBe(false);
  });
});

describe('GET /api/team-battles/:battleId', () => {
  it('serves the open round question sanitized, derived clock, and progress counts — no answer material', async () => {
    const activeBattle = battleRow({ team1_score: 5, team2_score: 3 });
    const db = createMockD1([
      authHandler(),
      { match: /UPDATE team_battles SET status = 'cancelled'/, run: () => ({ success: true, meta: { changes: 0 } }) },
      { match: /SELECT \* FROM team_battles WHERE id = \?/, first: () => activeBattle },
      { match: /FROM team_battles tb/, first: () => ({ ...activeBattle, subject_name: 'Physics', topic_name: null }) },
      {
        match: /answered_count/,
        all: () => ({
          results: [
            { user_id: 'u1', name: 'Ama', avatar_url: null, is_captain: 1, team_number: 1, score: 5, correct_answers: 1, answered_count: 1 },
            { user_id: 'u2', name: 'Kofi', avatar_url: null, is_captain: 0, team_number: 2, score: 3, correct_answers: 1, answered_count: 1 },
          ],
        }),
      },
      {
        match: /q\.question_text/,
        first: () => ({
          id: 'q1',
          question_text: 'What is 1+1?',
          question_type: 'multiple_choice',
          options: JSON.stringify(['2', '3']),
        }),
      },
      catchAll(),
    ]);
    const t = await token('u1');
    const res = await worker.fetch(get('http://x/api/team-battles/tb_1', t), env(db));
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: {
        battle: Record<string, unknown> & { question: Record<string, unknown> | null };
        team1: Record<string, unknown>[];
        team2: Record<string, unknown>[];
      };
    };

    // Derived round clock
    expect(body.data.battle.currentQuestion).toBe(0);
    expect(typeof body.data.battle.roundEndsAt).toBe('string');

    // Sanitized question: ids+texts only, never answer material
    const q = body.data.battle.question!;
    expect(q).toMatchObject({ id: 'q1', questionText: 'What is 1+1?' });
    expect(q.options).toEqual([
      { id: 'A', text: '2' },
      { id: 'B', text: '3' },
    ]);
    expect(q).not.toHaveProperty('correct_answer');
    expect(q).not.toHaveProperty('explanation');

    // Progress counts without answer content
    expect(body.data.team1[0]).toMatchObject({ userId: 'u1', answeredCount: 1, isCaptain: true });
    expect(JSON.stringify(body.data)).not.toContain('correct_answer');
  });
});

describe('waiting expiry', () => {
  it('available list lazily cancels waiting battles older than 30 minutes', async () => {
    const db = createMockD1([
      authHandler(),
      { match: /UPDATE team_battles SET status = 'cancelled'/, run: () => ({ success: true, meta: { changes: 1 } }) },
      { match: /FROM team_battles tb/, all: () => ({ results: [] }) },
      catchAll(),
    ]);
    const t = await token('u1');
    const res = await worker.fetch(get('http://x/api/team-battles/available', t), env(db));
    expect(res.status).toBe(200);

    const expire = db.calls.find((c) => c.sql.includes("UPDATE team_battles SET status = 'cancelled'"));
    expect(expire).toBeDefined();
    expect(expire!.sql).toContain("status IN ('waiting', 'ready')");
    expect(expire!.sql).toContain("datetime('now', '-30 minutes')");
  });
});

describe('POST /api/team-battles/:id/leave', () => {
  function makeLeaveDb(opts: { status: string; isCaptain?: number | null }) {
    return createMockD1([
      authHandler(),
      { match: /SELECT id, status FROM team_battles WHERE id = \?/, first: () => ({ id: 'tb_1', status: opts.status }) },
      {
        match: /SELECT is_captain FROM team_battle_members/,
        first: () => (opts.isCaptain === null ? null : { is_captain: opts.isCaptain ?? 0 }),
      },
      catchAll(),
    ]);
  }

  it('non-captain leaves a waiting battle (membership deleted)', async () => {
    const db = makeLeaveDb({ status: 'waiting', isCaptain: 0 });
    const t = await token('member_1');
    const res = await worker.fetch(post('http://x/api/team-battles/tb_1/leave', {}, t), env(db));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { left: boolean; deleted: boolean } };
    expect(body.data).toEqual({ left: true, deleted: false });
    expect(db.calls.some((c) => c.sql.includes('DELETE FROM team_battle_members'))).toBe(true);
    expect(db.calls.some((c) => c.sql.includes('DELETE FROM team_battles'))).toBe(false);
  });

  it('captain leaving deletes the battle', async () => {
    const db = makeLeaveDb({ status: 'waiting', isCaptain: 1 });
    const t = await token('captain_1');
    const res = await worker.fetch(post('http://x/api/team-battles/tb_1/leave', {}, t), env(db));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { left: boolean; deleted: boolean } };
    expect(body.data).toEqual({ left: true, deleted: true });
    expect(db.calls.some((c) => c.sql.includes('DELETE FROM team_battles WHERE id = ?'))).toBe(true);
  });

  it('rejects leaving once the battle is active', async () => {
    const db = makeLeaveDb({ status: 'active', isCaptain: 0 });
    const t = await token('member_1');
    const res = await worker.fetch(post('http://x/api/team-battles/tb_1/leave', {}, t), env(db));
    expect(res.status).toBe(400);
  });

  it('rejects non-members', async () => {
    const db = makeLeaveDb({ status: 'waiting', isCaptain: null });
    const t = await token('outsider_1');
    const res = await worker.fetch(post('http://x/api/team-battles/tb_1/leave', {}, t), env(db));
    expect(res.status).toBe(403);
  });
});

describe('POST /api/team-battles/join-by-code', () => {
  it('joins the smaller team by shareable code', async () => {
    const db = createMockD1([
      authHandler(),
      { match: /UPDATE team_battles SET status = 'cancelled'/, run: () => ({ success: true, meta: { changes: 0 } }) },
      { match: /UPPER\(SUBSTR\(id, -8\)\)/, first: () => battleRow({ status: 'waiting' }) },
      {
        match: /GROUP BY team_number/,
        all: () => ({ results: [{ team_number: 1, count: 1 }] }),
      },
      { match: /FROM team_battle_members WHERE battle_id = \? AND user_id = \?/, first: () => null },
      {
        match: /COUNT\(\*\) as count FROM team_battle_members WHERE battle_id = \? AND team_number = \?/,
        first: () => ({ count: 0 }),
      },
      catchAll(),
    ]);
    const t = await token('joiner_1');
    const res = await worker.fetch(
      post('http://x/api/team-battles/join-by-code', { code: 'ABCD1234' }, t),
      env(db),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { battleId: string; teamNumber: number } };
    expect(body.data.battleId).toBe('tb_1');
    expect(body.data.teamNumber).toBe(2); // team 1 has the captain
  });

  it('returns 404 for an unknown code', async () => {
    const db = createMockD1([
      authHandler(),
      { match: /UPDATE team_battles SET status = 'cancelled'/, run: () => ({ success: true, meta: { changes: 0 } }) },
      { match: /UPPER\(SUBSTR\(id, -8\)\)/, first: () => null },
      catchAll(),
    ]);
    const t = await token('joiner_1');
    const res = await worker.fetch(
      post('http://x/api/team-battles/join-by-code', { code: 'NOPE9999' }, t),
      env(db),
    );
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('No waiting team battle with that code');
  });
});
