import { describe, it, expect } from 'vitest';
import { sign } from 'hono/jwt';
import {
  rankedApp,
  applyRankedDelta,
  eloDelta,
  eloExpectedScore,
  ELO_K,
  ELO_DEFAULT_RATING,
  RANKED_QUEUE_TIMEOUT_MS,
} from '../ranked';
import { createMockD1, type MockHandler } from './helpers/mockD1';

// Ranked matchmaking (spec 1.4b): ELO math, queue match/no-match/stale-entry
// behavior, idempotent rating application, authz, and leaderboard shaping.

const JWT_SECRET = 'test-secret-that-is-long-enough';

const authUser = { role: 'student', status: 'approved', is_active: 1, session_version: 0 };

function authHandler(): MockHandler {
  return {
    match: /SELECT role, status, is_active, session_version FROM users/,
    first: () => authUser,
  };
}

const catchAll = (): MockHandler => ({
  match: /./,
  first: () => null,
  all: () => ({ results: [] }),
  run: () => ({ success: true, meta: { changes: 1 } }),
});

async function token(userId: string) {
  return sign(
    { userId, role: 'student', exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000) },
    JWT_SECRET,
  );
}

function req(url: string, method: string, t: string | null, body?: unknown) {
  return new Request(url, {
    method,
    headers: {
      ...(t ? { Authorization: `Bearer ${t}` } : {}),
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

const env = (db: unknown) => ({ DB: db as D1Database, JWT_SECRET, ENVIRONMENT: 'test' });

describe('ELO math', () => {
  it('exports K=32 and a 1200 default rating', () => {
    expect(ELO_K).toBe(32);
    expect(ELO_DEFAULT_RATING).toBe(1200);
    expect(RANKED_QUEUE_TIMEOUT_MS).toBe(60_000);
  });

  it('gives equal-rated players a 0.5 expected score', () => {
    expect(eloExpectedScore(1200, 1200)).toBeCloseTo(0.5);
  });

  it('awards +16/-16 for a win/loss between equal ratings', () => {
    expect(eloDelta(1200, 1200, 1)).toBe(16);
    expect(eloDelta(1200, 1200, 0)).toBe(-16);
  });

  it('splits a draw between equal ratings as 0', () => {
    expect(eloDelta(1200, 1200, 0.5)).toBe(0);
  });

  it('punishes a higher-rated player for a draw', () => {
    // expected(1400 vs 1200) ~= 0.7597 → 32 * (0.5 - 0.7597) ~= -8.31 → -8
    expect(eloDelta(1400, 1200, 0.5)).toBe(-8);
    // …and rewards the underdog: 32 * (0.5 - 0.2403) ~= 8.31 → 8
    expect(eloDelta(1200, 1400, 0.5)).toBe(8);
  });

  it('gives the underdog more for a win than the favorite', () => {
    expect(eloDelta(1200, 1400, 1)).toBe(24); // 32 * (1 - 0.2403) ~= 24.31
    expect(eloDelta(1400, 1200, 1)).toBe(8); // 32 * (1 - 0.7597) ~= 7.69
  });

  it('uses the documented expected-score formula', () => {
    // 1 / (1 + 10^((rb - ra) / 400))
    expect(eloExpectedScore(1000, 1400)).toBeCloseTo(1 / (1 + Math.pow(10, 1)));
  });
});

describe('applyRankedDelta', () => {
  const rankedBattle = {
    id: 'battle_ranked_1',
    challenger_id: 'user_a',
    opponent_id: 'user_b',
    winner_id: 'user_a',
    is_ranked: 1,
  };

  function makeDb(battle: unknown, claimChanges = 1) {
    return createMockD1([
      {
        match: /SELECT id, challenger_id, opponent_id, winner_id, is_ranked FROM battles/,
        first: () => battle,
      },
      {
        match: /SELECT id, battle_rating FROM users WHERE id IN/,
        all: () => ({
          results: [
            { id: 'user_a', battle_rating: 1200 },
            { id: 'user_b', battle_rating: 1200 },
          ],
        }),
      },
      {
        match: /INSERT OR IGNORE INTO battle_rating_updates/,
        run: () => ({ success: true, meta: { changes: claimChanges } }),
      },
      catchAll(),
    ]);
  }

  it('applies +16/-16 to winner/loser on an equal-rated ranked battle', async () => {
    const db = makeDb(rankedBattle);
    const result = await applyRankedDelta(db as unknown as D1Database, 'battle_ranked_1');
    expect(result).toEqual({ battleId: 'battle_ranked_1', challengerDelta: 16, opponentDelta: -16 });

    const updates = db.calls.filter((c) => c.sql.includes('UPDATE users SET battle_rating'));
    expect(updates).toHaveLength(2);
    expect(updates[0].binds).toEqual([16, 'user_a']);
    expect(updates[1].binds).toEqual([-16, 'user_b']);
  });

  it('splits a draw (null winner_id)', async () => {
    const db = makeDb({ ...rankedBattle, winner_id: null });
    const result = await applyRankedDelta(db as unknown as D1Database, 'battle_ranked_1');
    expect(result).toEqual({ battleId: 'battle_ranked_1', challengerDelta: 0, opponentDelta: 0 });
  });

  it('is idempotent: a second claim (changes === 0) updates nothing', async () => {
    const db = makeDb(rankedBattle, 0);
    const result = await applyRankedDelta(db as unknown as D1Database, 'battle_ranked_1');
    expect(result).toBeNull();
    expect(db.calls.some((c) => c.sql.includes('UPDATE users SET battle_rating'))).toBe(false);
  });

  it('ignores non-ranked battles', async () => {
    const db = makeDb({ ...rankedBattle, is_ranked: 0 });
    const result = await applyRankedDelta(db as unknown as D1Database, 'battle_ranked_1');
    expect(result).toBeNull();
    expect(db.calls.some((c) => c.sql.includes('battle_rating_updates'))).toBe(false);
  });

  it('ignores battles without an opponent', async () => {
    const db = makeDb({ ...rankedBattle, opponent_id: null });
    const result = await applyRankedDelta(db as unknown as D1Database, 'battle_ranked_1');
    expect(result).toBeNull();
  });
});

describe('authentication', () => {
  it('rejects unauthenticated requests with 401', async () => {
    const db = createMockD1([authHandler()]);
    for (const [method, url] of [
      ['POST', 'http://x/queue'],
      ['GET', 'http://x/queue/status'],
      ['DELETE', 'http://x/queue'],
      ['GET', 'http://x/leaderboard'],
      ['GET', 'http://x/delta/battle_1'],
    ] as const) {
      const res = await rankedApp.fetch(req(url, method, null), env(db));
      expect(res.status).toBe(401);
    }
  });
});

describe('POST /queue', () => {
  const meHandler = (rating = 1200): MockHandler => ({
    match: /SELECT id, name, avatar_url, battle_rating FROM users/,
    first: () => ({ id: 'user_1', name: 'Ama', avatar_url: null, battle_rating: rating }),
  });

  it('enqueues when nobody is waiting and returns {queued:true}', async () => {
    const db = createMockD1([
      authHandler(),
      meHandler(),
      { match: /SELECT user_id, rating, queued_at FROM ranked_queue/, first: () => null },
      catchAll(),
    ]);
    const t = await token('user_1');
    const res = await rankedApp.fetch(req('http://x/queue', 'POST', t, {}), env(db));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { queued: boolean; rating: number } };
    expect(body.data).toEqual({ queued: true, rating: 1200 });

    const upsert = db.calls.find((c) => c.sql.includes('INSERT OR REPLACE INTO ranked_queue'));
    expect(upsert).toBeDefined();
    expect(upsert!.binds[0]).toBe('user_1');
    expect(upsert!.binds[1]).toBe(1200);
  });

  it('re-queuing replaces the prior entry (INSERT OR REPLACE)', async () => {
    const db = createMockD1([
      authHandler(),
      meHandler(1350),
      { match: /SELECT user_id, rating, queued_at FROM ranked_queue/, first: () => null },
      catchAll(),
    ]);
    const t = await token('user_1');
    const res = await rankedApp.fetch(req('http://x/queue', 'POST', t, {}), env(db));
    expect(res.status).toBe(200);
    const upsert = db.calls.find((c) => c.sql.includes('INSERT OR REPLACE INTO ranked_queue'));
    expect(upsert!.sql).toContain('INSERT OR REPLACE');
    expect(upsert!.binds[1]).toBe(1350);
  });

  it('matches a fresh waiting player and creates an active ranked battle', async () => {
    const freshQueuedAt = new Date(Date.now() - 10_000).toISOString();
    const db = createMockD1([
      authHandler(),
      meHandler(),
      {
        match: /SELECT user_id, rating, queued_at FROM ranked_queue/,
        first: () => ({ user_id: 'user_2', rating: 1210, queued_at: freshQueuedAt }),
      },
      { match: /FROM questions q/, all: () => ({ results: [] }) },
      {
        match: /SELECT id, name, avatar_url FROM users/,
        first: () => ({ id: 'user_2', name: 'Kofi', avatar_url: null }),
      },
      catchAll(),
    ]);
    const t = await token('user_1');
    const res = await rankedApp.fetch(req('http://x/queue', 'POST', t, {}), env(db));
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: { queued: boolean; battle: Record<string, unknown> };
    };
    expect(body.data.queued).toBe(false);
    expect(body.data.battle).toMatchObject({
      challengerId: 'user_2',
      challengerName: 'Kofi',
      opponentId: 'user_1',
      opponentName: 'Ama',
      status: 'active',
      isRanked: true,
    });

    const insert = db.calls.find((c) => c.sql.includes('INSERT INTO battles'));
    expect(insert).toBeDefined();
    expect(insert!.sql).toContain('is_ranked');
    expect(insert!.binds[1]).toBe('user_2'); // waiting player challenges
    expect(insert!.binds[2]).toBe('user_1'); // matcher joins as opponent

    // Both players are removed from the queue.
    const leave = db.calls.find((c) => c.sql.includes('DELETE FROM ranked_queue WHERE user_id IN'));
    expect(leave!.binds).toEqual(['user_1', 'user_2']);
    expect(db.calls.some((c) => c.sql.includes('INSERT OR REPLACE INTO ranked_queue'))).toBe(false);
  });

  it('does NOT match a player waiting longer than 60s', async () => {
    const staleQueuedAt = new Date(Date.now() - 61_000).toISOString();
    const db = createMockD1([
      authHandler(),
      meHandler(),
      {
        match: /SELECT user_id, rating, queued_at FROM ranked_queue/,
        first: () => ({ user_id: 'user_2', rating: 1200, queued_at: staleQueuedAt }),
      },
      catchAll(),
    ]);
    const t = await token('user_1');
    const res = await rankedApp.fetch(req('http://x/queue', 'POST', t, {}), env(db));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { queued: boolean } };
    expect(body.data.queued).toBe(true);
    expect(db.calls.some((c) => c.sql.includes('INSERT INTO battles'))).toBe(false);
  });

  it('purges stale queue entries before matchmaking', async () => {
    const db = createMockD1([
      authHandler(),
      meHandler(),
      { match: /SELECT user_id, rating, queued_at FROM ranked_queue/, first: () => null },
      catchAll(),
    ]);
    const t = await token('user_1');
    await rankedApp.fetch(req('http://x/queue', 'POST', t, {}), env(db));
    const purge = db.calls.find((c) => c.sql.includes('DELETE FROM ranked_queue WHERE queued_at <='));
    expect(purge).toBeDefined();
  });
});

describe('GET /queue/status', () => {
  it('reports queued while the entry exists', async () => {
    const db = createMockD1([
      authHandler(),
      {
        match: /SELECT user_id, rating, queued_at FROM ranked_queue WHERE user_id = \?/,
        first: () => ({ user_id: 'user_1', rating: 1200, queued_at: new Date().toISOString() }),
      },
      catchAll(),
    ]);
    const t = await token('user_1');
    const res = await rankedApp.fetch(req('http://x/queue/status', 'GET', t), env(db));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { queued: boolean; matched: boolean } };
    expect(body.data).toMatchObject({ queued: true, matched: false, rating: 1200 });
  });

  it('reports matched with the battle id once paired', async () => {
    const db = createMockD1([
      authHandler(),
      { match: /FROM ranked_queue WHERE user_id = \?/, first: () => null },
      { match: /SELECT id FROM battles/, first: () => ({ id: 'battle_ranked_9' }) },
      catchAll(),
    ]);
    const t = await token('user_1');
    const res = await rankedApp.fetch(req('http://x/queue/status', 'GET', t), env(db));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { queued: boolean; matched: boolean; battleId: string } };
    expect(body.data).toEqual({ queued: false, matched: true, battleId: 'battle_ranked_9' });
  });

  it('reports idle when neither queued nor matched', async () => {
    const db = createMockD1([
      authHandler(),
      { match: /FROM ranked_queue WHERE user_id = \?/, first: () => null },
      { match: /SELECT id FROM battles/, first: () => null },
      { match: /SELECT battle_rating FROM users/, first: () => ({ battle_rating: 1184 }) },
      catchAll(),
    ]);
    const t = await token('user_1');
    const res = await rankedApp.fetch(req('http://x/queue/status', 'GET', t), env(db));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { queued: boolean; matched: boolean; rating: number } };
    expect(body.data).toEqual({ queued: false, matched: false, rating: 1184 });
  });
});

describe('DELETE /queue', () => {
  it('removes the caller from the queue', async () => {
    const db = createMockD1([authHandler(), catchAll()]);
    const t = await token('user_1');
    const res = await rankedApp.fetch(req('http://x/queue', 'DELETE', t), env(db));
    expect(res.status).toBe(200);
    const del = db.calls.find((c) => c.sql.includes('DELETE FROM ranked_queue WHERE user_id = ?'));
    expect(del!.binds).toEqual(['user_1']);
  });
});

describe('GET /leaderboard', () => {
  it('returns ranked rows ordered by rating with win/loss counts', async () => {
    const db = createMockD1([
      authHandler(),
      {
        match: /SELECT u\.id, u\.name, u\.avatar_url, u\.battle_rating/,
        all: () => ({
          results: [
            { id: 'user_9', name: 'Esi', avatar_url: null, battle_rating: 1512, wins: 7, losses: 2 },
            { id: 'user_1', name: 'Ama', avatar_url: null, battle_rating: 1200, wins: 1, losses: 1 },
          ],
        }),
      },
      catchAll(),
    ]);
    const t = await token('user_1');
    const res = await rankedApp.fetch(req('http://x/leaderboard', 'GET', t), env(db));
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: { rank: number; id: string; rating: number; wins: number; losses: number }[];
    };
    expect(body.data).toHaveLength(2);
    expect(body.data[0]).toMatchObject({ rank: 1, id: 'user_9', rating: 1512, wins: 7, losses: 2 });
    expect(body.data[1]).toMatchObject({ rank: 2, id: 'user_1', rating: 1200 });

    const select = db.calls.find((c) => c.sql.includes('u.battle_rating'));
    expect(select!.sql).toContain('ORDER BY u.battle_rating DESC');
  });
});

describe('GET /delta/:battleId', () => {
  const deltaRow = {
    challenger_delta: 16,
    opponent_delta: -16,
    challenger_id: 'user_a',
    opponent_id: 'user_b',
  };

  it('returns the caller-side delta and current rating', async () => {
    const db = createMockD1([
      authHandler(),
      { match: /FROM battle_rating_updates bru/, first: () => deltaRow },
      { match: /SELECT battle_rating FROM users/, first: () => ({ battle_rating: 1216 }) },
      catchAll(),
    ]);
    const t = await token('user_a');
    const res = await rankedApp.fetch(req('http://x/delta/battle_ranked_1', 'GET', t), env(db));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { delta: number; rating: number } };
    expect(body.data).toEqual({ battleId: 'battle_ranked_1', delta: 16, rating: 1216 });
  });

  it('serves the opponent-side delta to the opponent', async () => {
    const db = createMockD1([
      authHandler(),
      { match: /FROM battle_rating_updates bru/, first: () => deltaRow },
      { match: /SELECT battle_rating FROM users/, first: () => ({ battle_rating: 1184 }) },
      catchAll(),
    ]);
    const t = await token('user_b');
    const res = await rankedApp.fetch(req('http://x/delta/battle_ranked_1', 'GET', t), env(db));
    const body = (await res.json()) as { data: { delta: number } };
    expect(body.data.delta).toBe(-16);
  });

  it('404s when no rating update exists (unranked battle)', async () => {
    const db = createMockD1([
      authHandler(),
      { match: /FROM battle_rating_updates bru/, first: () => null },
      catchAll(),
    ]);
    const t = await token('user_a');
    const res = await rankedApp.fetch(req('http://x/delta/battle_1', 'GET', t), env(db));
    expect(res.status).toBe(404);
  });

  it('403s for non-participants', async () => {
    const db = createMockD1([
      authHandler(),
      { match: /FROM battle_rating_updates bru/, first: () => deltaRow },
      catchAll(),
    ]);
    const t = await token('intruder_1');
    const res = await rankedApp.fetch(req('http://x/delta/battle_ranked_1', 'GET', t), env(db));
    expect(res.status).toBe(403);
  });
});
