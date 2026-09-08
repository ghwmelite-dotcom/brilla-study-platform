import { Hono } from 'hono';
import { requireAuth } from './auth-middleware';
import { parseJsonBody, parseLimit } from './http';
import { getDemoDataFlags } from './demoUtils';

// Ranked matchmaking for 1v1 battles (spec 1.4b): an ELO ladder (K=32,
// everyone starts at 1200) with a single-slot-per-user queue that matches the
// nearest rating among players waiting <60s. applyRankedDelta is called from
// the battle-completion path in index.ts and is idempotent via the
// battle_rating_updates ledger (battle_id PRIMARY KEY + INSERT OR IGNORE).

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

interface UserPayload {
  userId: string;
  email?: string;
  role?: string;
}

const rankedApp = new Hono<{ Bindings: Env; Variables: { user: UserPayload } }>();

// All ranked routes require a verified JWT (sets user on context).
rankedApp.use('*', requireAuth);

export const ELO_K = 32;
export const ELO_DEFAULT_RATING = 1200;
export const RANKED_QUEUE_TIMEOUT_MS = 60_000;

const generateId = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

// Expected score of A against B under ELO.
export function eloExpectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

// Rating change for A: scoreA is 1 (win), 0.5 (draw), or 0 (loss).
export function eloDelta(ratingA: number, ratingB: number, scoreA: 0 | 0.5 | 1): number {
  return Math.round(ELO_K * (scoreA - eloExpectedScore(ratingA, ratingB)));
}

// queued_at is written by this module as an ISO string, but tolerate the
// SQLite datetime('now') default ('YYYY-MM-DD HH:MM:SS', UTC) as well.
function parseSqlTime(value: string): number {
  const ms = value.includes('T')
    ? Date.parse(value)
    : Date.parse(`${value.replace(' ', 'T')}Z`);
  return Number.isNaN(ms) ? 0 : ms;
}

// Local copy of index.ts's transformQuestionOptions (importing index.ts here
// would create a module cycle once index.ts mounts this router).
function transformQuestionOptions(
  options: unknown,
  correctAnswer: string | null | undefined,
): Array<{ id: string; text: string; isCorrect: boolean }> | null {
  if (!options) return null;

  let optionsArray: unknown[];
  if (typeof options === 'string') {
    try {
      optionsArray = JSON.parse(options);
    } catch {
      return null;
    }
  } else if (Array.isArray(options)) {
    optionsArray = options;
  } else {
    return null;
  }

  if (optionsArray.length > 0 && typeof optionsArray[0] === 'object' && optionsArray[0] !== null) {
    const firstOption = optionsArray[0] as Record<string, unknown>;
    if ('id' in firstOption && 'text' in firstOption) {
      return optionsArray as Array<{ id: string; text: string; isCorrect: boolean }>;
    }
  }

  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
  return optionsArray.map((option, index) => {
    const optionText = String(option);
    const letterId = letters[index] || String.fromCharCode(65 + index);

    let isCorrect = false;
    if (correctAnswer) {
      const trimmedAnswer = correctAnswer.trim();
      const answerLetter = trimmedAnswer.charAt(0).toUpperCase();
      isCorrect = letterId === answerLetter;
      if (!isCorrect && optionText.toLowerCase() === trimmedAnswer.toLowerCase()) {
        isCorrect = true;
      }
    }

    return { id: letterId, text: optionText, isCorrect };
  });
}

export interface RankedDeltaResult {
  battleId: string;
  challengerDelta: number;
  opponentDelta: number;
}

/**
 * Applies the ELO update for a completed ranked battle. Reads the battle row
 * itself, so the caller only needs the id. Idempotent: the first call claims
 * the battle in battle_rating_updates (INSERT OR IGNORE); repeat calls (and
 * non-ranked battles, or battles without an opponent) return null and change
 * nothing. A null winner_id is scored as a draw.
 */
export async function applyRankedDelta(
  db: D1Database,
  battleId: string,
): Promise<RankedDeltaResult | null> {
  const battle = await db.prepare(`
    SELECT id, challenger_id, opponent_id, winner_id, is_ranked FROM battles WHERE id = ?
  `).bind(battleId).first<{
    id: string;
    challenger_id: string;
    opponent_id: string | null;
    winner_id: string | null;
    is_ranked: number;
  }>();
  if (!battle || battle.is_ranked !== 1 || !battle.opponent_id) return null;

  const players = await db.prepare(`
    SELECT id, battle_rating FROM users WHERE id IN (?, ?)
  `).bind(battle.challenger_id, battle.opponent_id).all<{ id: string; battle_rating: number }>();
  const challenger = players.results.find((p) => p.id === battle.challenger_id);
  const opponent = players.results.find((p) => p.id === battle.opponent_id);
  if (!challenger || !opponent) return null;

  const challengerScore = battle.winner_id === battle.challenger_id
    ? 1
    : battle.winner_id === battle.opponent_id
      ? 0
      : 0.5;
  const challengerDelta = eloDelta(challenger.battle_rating, opponent.battle_rating, challengerScore);
  const opponentDelta = eloDelta(opponent.battle_rating, challenger.battle_rating, (1 - challengerScore) as 0 | 0.5 | 1);

  // Claim the battle in the ledger before touching users: a repeat call hits
  // the PRIMARY KEY, changes === 0, and bails without double-applying.
  const claim = await db.prepare(`
    INSERT OR IGNORE INTO battle_rating_updates (battle_id, challenger_delta, opponent_delta)
    VALUES (?, ?, ?)
  `).bind(battleId, challengerDelta, opponentDelta).run();
  if (claim.meta.changes === 0) return null;

  await db.batch([
    db.prepare('UPDATE users SET battle_rating = battle_rating + ? WHERE id = ?')
      .bind(challengerDelta, battle.challenger_id),
    db.prepare('UPDATE users SET battle_rating = battle_rating + ? WHERE id = ?')
      .bind(opponentDelta, battle.opponent_id),
  ]);

  return { battleId, challengerDelta, opponentDelta };
}

interface RankedQueueRow {
  user_id: string;
  rating: number;
  queued_at: string;
}

// Lazily drop queue entries past the 60s match window (no cron needed).
async function purgeStaleQueueEntries(db: D1Database): Promise<void> {
  await db.prepare(`DELETE FROM ranked_queue WHERE queued_at <= ?`)
    .bind(new Date(Date.now() - RANKED_QUEUE_TIMEOUT_MS).toISOString())
    .run();
}

// POST /queue — join the ranked queue. Matches the nearest-rating player who
// has been waiting <60s and starts an active ranked battle immediately;
// otherwise enqueues (re-queuing replaces the prior entry).
rankedApp.post('/queue', async (c) => {
  const userId = c.get('user').userId;
  const db = c.env.DB;
  const body = (await parseJsonBody(c)) ?? {};

  const difficulty = typeof body.difficulty === 'string' && body.difficulty
    ? body.difficulty
    : 'medium';
  const questionCount = Number.isInteger(body.questionCount) &&
    (body.questionCount as number) >= 1 && (body.questionCount as number) <= 50
    ? (body.questionCount as number)
    : 10;
  const subjectId = typeof body.subjectId === 'string' && body.subjectId
    ? body.subjectId
    : null;

  try {
    await purgeStaleQueueEntries(db);

    const me = await db.prepare(`
      SELECT id, name, avatar_url, battle_rating FROM users WHERE id = ?
    `).bind(userId).first<{
      id: string; name: string; avatar_url: string | null; battle_rating: number | null;
    }>();
    if (!me) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }
    const myRating = me.battle_rating ?? ELO_DEFAULT_RATING;

    // Nearest rating among OTHER waiting players; ties go to the longest wait.
    const candidate = await db.prepare(`
      SELECT user_id, rating, queued_at FROM ranked_queue
      WHERE user_id != ?
      ORDER BY ABS(rating - ?) ASC, queued_at ASC
      LIMIT 1
    `).bind(userId, myRating).first<RankedQueueRow>();

    const candidateFresh = candidate !== null &&
      Date.now() - parseSqlTime(candidate.queued_at) < RANKED_QUEUE_TIMEOUT_MS;

    if (candidate && candidateFresh) {
      // Matched: both leave the queue and a ranked battle starts active.
      await db.prepare(`DELETE FROM ranked_queue WHERE user_id IN (?, ?)`)
        .bind(userId, candidate.user_id).run();

      // Same question draw as POST /api/battles in index.ts.
      let questionsQuery = `
        SELECT q.* FROM questions q
        JOIN subjects s ON s.id = q.subject_id AND s.is_active = 1
        JOIN topics question_topic
          ON question_topic.id = q.topic_id AND question_topic.subject_id = q.subject_id
        WHERE q.question_type IN ('multiple_choice', 'direct_answer')
      `;
      const params: (string | number)[] = [];
      if (subjectId) {
        questionsQuery += ' AND q.subject_id = ?';
        params.push(subjectId);
      }
      if (difficulty) {
        questionsQuery += ' AND q.difficulty = ?';
        params.push(difficulty);
      }
      questionsQuery += ` ORDER BY RANDOM() LIMIT ?`;
      params.push(questionCount);

      const { results: questions } = await db.prepare(questionsQuery).bind(...params).all();
      const parsedQuestions = questions.map((q: Record<string, unknown>) => ({
        ...q,
        options: transformQuestionOptions(q.options, q.correct_answer as string),
      }));

      const opponent = await db.prepare(`
        SELECT id, name, avatar_url FROM users WHERE id = ?
      `).bind(candidate.user_id).first<{ id: string; name: string; avatar_url: string | null }>();

      const battleId = generateId('battle');
      const demoFlags = getDemoDataFlags(userId);
      // The waiting player challenges; the matcher joins as opponent. Same
      // insert shape as the vs-bot branch of POST /api/battles, plus
      // is_ranked = 1.
      await db.prepare(`
        INSERT INTO battles (id, challenger_id, opponent_id, subject_id, difficulty, question_count, questions, status, is_demo_data, expires_at, started_at, is_ranked)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, datetime('now'), 1)
      `).bind(
        battleId,
        candidate.user_id,
        userId,
        subjectId,
        difficulty,
        questionCount,
        JSON.stringify(parsedQuestions),
        demoFlags.is_demo_data,
        demoFlags.expires_at,
      ).run();

      return c.json({
        success: true,
        data: {
          queued: false,
          battle: {
            id: battleId,
            challengerId: candidate.user_id,
            challengerName: opponent?.name,
            challengerAvatar: opponent?.avatar_url,
            challengerRating: candidate.rating,
            opponentId: userId,
            opponentName: me.name,
            opponentAvatar: me.avatar_url,
            opponentRating: myRating,
            subjectId,
            difficulty,
            questionCount,
            status: 'active',
            challengerScore: 0,
            opponentScore: 0,
            currentQuestion: 0,
            isRanked: true,
            createdAt: new Date().toISOString(),
          },
        },
      });
    }

    // No fresh opponent: enqueue (INSERT OR REPLACE — re-queuing refreshes
    // the row rather than duplicating it).
    await db.prepare(`
      INSERT OR REPLACE INTO ranked_queue (user_id, rating, queued_at)
      VALUES (?, ?, ?)
    `).bind(userId, myRating, new Date().toISOString()).run();

    return c.json({ success: true, data: { queued: true, rating: myRating } });
  } catch {
    return c.json({ success: false, error: 'Failed to join ranked queue' }, 500);
  }
});

// GET /queue/status — 2s poll target: still waiting, or matched into a battle.
rankedApp.get('/queue/status', async (c) => {
  const userId = c.get('user').userId;
  const db = c.env.DB;

  try {
    await purgeStaleQueueEntries(db);

    const entry = await db.prepare(`
      SELECT user_id, rating, queued_at FROM ranked_queue WHERE user_id = ?
    `).bind(userId).first<RankedQueueRow>();

    if (entry) {
      return c.json({
        success: true,
        data: { queued: true, matched: false, rating: entry.rating, queuedAt: entry.queued_at },
      });
    }

    // Not in the queue: either a matcher paired this user (battle created),
    // or the user simply isn't queued.
    const battle = await db.prepare(`
      SELECT id FROM battles
      WHERE is_ranked = 1 AND status = 'active'
        AND (challenger_id = ? OR opponent_id = ?)
      ORDER BY created_at DESC
      LIMIT 1
    `).bind(userId, userId).first<{ id: string }>();

    if (battle) {
      return c.json({
        success: true,
        data: { queued: false, matched: true, battleId: battle.id },
      });
    }

    const me = await db.prepare(`
      SELECT battle_rating FROM users WHERE id = ?
    `).bind(userId).first<{ battle_rating: number | null }>();

    return c.json({
      success: true,
      data: { queued: false, matched: false, rating: me?.battle_rating ?? ELO_DEFAULT_RATING },
    });
  } catch {
    return c.json({ success: false, error: 'Failed to fetch queue status' }, 500);
  }
});

// DELETE /queue — leave the ranked queue.
rankedApp.delete('/queue', async (c) => {
  const userId = c.get('user').userId;

  try {
    await c.env.DB.prepare(`DELETE FROM ranked_queue WHERE user_id = ?`).bind(userId).run();
    return c.json({ success: true, data: { queued: false } });
  } catch {
    return c.json({ success: false, error: 'Failed to leave ranked queue' }, 500);
  }
});

// GET /leaderboard — top ELO ratings with ranked win/loss counts.
rankedApp.get('/leaderboard', async (c) => {
  const limit = parseLimit(c, 50);

  try {
    const { results } = await c.env.DB.prepare(`
      SELECT u.id, u.name, u.avatar_url, u.battle_rating,
        (SELECT COUNT(*) FROM battles b
          WHERE b.is_ranked = 1 AND b.status IN ('completed', 'cancelled')
            AND b.winner_id = u.id) AS wins,
        (SELECT COUNT(*) FROM battles b
          WHERE b.is_ranked = 1 AND b.status IN ('completed', 'cancelled')
            AND b.winner_id IS NOT NULL AND b.winner_id != u.id
            AND (b.challenger_id = u.id OR b.opponent_id = u.id)) AS losses
      FROM users u
      WHERE u.is_active = 1 AND u.status = 'approved' AND u.role = 'student'
      ORDER BY u.battle_rating DESC, u.name ASC
      LIMIT ?
    `).bind(limit).all<{
      id: string;
      name: string;
      avatar_url: string | null;
      battle_rating: number;
      wins: number;
      losses: number;
    }>();

    const data = results.map((row, index) => ({
      rank: index + 1,
      id: row.id,
      name: row.name,
      avatarUrl: row.avatar_url,
      rating: row.battle_rating,
      wins: row.wins,
      losses: row.losses,
    }));

    return c.json({ success: true, data });
  } catch {
    return c.json({ success: false, error: 'Failed to fetch ranked leaderboard' }, 500);
  }
});

// GET /delta/:battleId — the caller's applied rating delta for a ranked
// battle (drives the +/-N on the results screen). Participants only.
rankedApp.get('/delta/:battleId', async (c) => {
  const userId = c.get('user').userId;
  const battleId = c.req.param('battleId');

  try {
    const row = await c.env.DB.prepare(`
      SELECT bru.challenger_delta, bru.opponent_delta, b.challenger_id, b.opponent_id
      FROM battle_rating_updates bru
      JOIN battles b ON b.id = bru.battle_id
      WHERE bru.battle_id = ?
    `).bind(battleId).first<{
      challenger_delta: number;
      opponent_delta: number;
      challenger_id: string;
      opponent_id: string | null;
    }>();

    if (!row) {
      return c.json({ success: false, error: 'No rating update for this battle' }, 404);
    }
    if (row.challenger_id !== userId && row.opponent_id !== userId) {
      return c.json({ success: false, error: 'Not a participant in this battle' }, 403);
    }

    const me = await c.env.DB.prepare(`
      SELECT battle_rating FROM users WHERE id = ?
    `).bind(userId).first<{ battle_rating: number | null }>();

    return c.json({
      success: true,
      data: {
        battleId,
        delta: userId === row.challenger_id ? row.challenger_delta : row.opponent_delta,
        rating: me?.battle_rating ?? null,
      },
    });
  } catch {
    return c.json({ success: false, error: 'Failed to fetch rating delta' }, 500);
  }
});

export { rankedApp };
