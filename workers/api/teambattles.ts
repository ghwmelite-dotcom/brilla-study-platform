import { Hono } from 'hono';
import { requireAuth } from './auth-middleware';
import { parseLimit } from './http';
import { awardPoints } from './points';
import { getDemoDataFlags } from './demoUtils';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

interface UserPayload {
  userId: string;
  email: string;
  role: string;
}

const teamBattlesApp = new Hono<{ Bindings: Env; Variables: { user: UserPayload } }>();

// All team battle routes require a verified JWT (sets user on context).
teamBattlesApp.use('*', requireAuth);

const generateId = () => `tb_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

// =============================================
// TEAM BATTLE ENGINE HELPERS
// =============================================

// Scoring mirrors the 1v1 battleAnswerPoints in index.ts: correct answers earn
// question.points || 3 plus a speed bonus measured from ROUND OPEN (+2 <=5s,
// +1 <=10s, else 0); incorrect answers always score 0.
function teamBattleAnswerPoints(isCorrect: boolean, basePoints: number, timeTaken: number): number {
  if (!isCorrect) return 0;
  const speedBonus = timeTaken <= 5 ? 2 : timeTaken <= 10 ? 1 : 0;
  return basePoints + speedBonus;
}

// Mirrors normalizeAnswerForComparison in index.ts (1v1): direct match,
// letter-prefixed answers ("B. value" vs "B"), case-insensitive.
function isTeamBattleAnswerCorrect(userAnswer: string, correctAnswer: string): boolean {
  const userTrimmed = userAnswer.trim().toLowerCase();
  const correctTrimmed = correctAnswer.trim().toLowerCase();
  if (userTrimmed === correctTrimmed) return true;

  const letterMatch = userAnswer.match(/^([A-Fa-f])\s*\.\s*/);
  if (letterMatch) {
    const userLetter = letterMatch[1].toUpperCase();
    if (/^[A-Fa-f]$/.test(correctAnswer.trim())) {
      return userLetter.toLowerCase() === correctTrimmed;
    }
    const userValue = userAnswer.replace(/^[A-Fa-f]\s*\.\s*/, '').trim().toLowerCase();
    return userValue === correctTrimmed;
  }

  // Client submits the option letter for MC questions; correct_answer is
  // often the letter itself.
  if (/^[A-Fa-f]$/.test(userAnswer.trim()) && /^[A-Fa-f]$/.test(correctAnswer.trim())) {
    return userTrimmed === correctTrimmed;
  }
  return false;
}

// started_at/created_at are written with datetime('now') ("YYYY-MM-DD HH:MM:SS",
// UTC). Normalize to a parseable ISO string.
function parseSqlUtc(raw: string): number {
  const s = String(raw);
  return Date.parse(s.includes('T') ? s : `${s.replace(' ', 'T')}Z`);
}

// Waiting team battles expire 30 minutes after creation (team_battles has no
// expires_at column — created_at is the clock). Lazy cancellation on every
// read/join path, same approach as the 1v1 expireStaleWaitingBattles.
async function expireStaleWaitingTeamBattles(db: D1Database): Promise<void> {
  await db.prepare(`
    UPDATE team_battles SET status = 'cancelled', completed_at = datetime('now')
    WHERE status IN ('waiting', 'ready') AND created_at <= datetime('now', '-30 minutes')
  `).bind().run();
}

interface TeamBattleRow {
  id: string;
  status: string;
  total_questions: number;
  time_per_question: number;
  question_ids: string | null;
  team1_score: number;
  team2_score: number;
  winner_team: number | null;
  xp_reward: number | null;
  started_at: string | null;
  created_at: string;
}

function readQuestionIds(battle: TeamBattleRow): string[] {
  try {
    const parsed: unknown = JSON.parse(battle.question_ids || '[]');
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

// Synchronized rounds on a lazy clock: round i opens at
// started_at + i*time_per_question. The current round is DERIVED, never
// stored-advanced — no cron.
function deriveTeamBattleRound(
  battle: TeamBattleRow,
  nowMs: number,
): { roundIndex: number; roundEndsAt: string | null; ended: boolean } {
  const total = battle.total_questions;
  const seconds = battle.time_per_question;
  if (battle.status !== 'active' || !battle.started_at) {
    return { roundIndex: 0, roundEndsAt: null, ended: battle.status === 'completed' };
  }
  const startMs = parseSqlUtc(battle.started_at);
  const elapsedSec = Math.max(0, (nowMs - startMs) / 1000);
  const rawIndex = Math.floor(elapsedSec / seconds);
  const ended = rawIndex >= total;
  const roundIndex = Math.min(rawIndex, total - 1);
  const roundEndsAt = ended
    ? null
    : new Date(startMs + (rawIndex + 1) * seconds * 1000).toISOString();
  return { roundIndex, roundEndsAt, ended };
}

// Lazy completion: the first read after the final round closes completes the
// battle. Winner = higher team score; tie -> lower aggregate time_taken;
// still tied -> draw (winner_team NULL). battle_win XP goes to winning
// members only (no participation source exists in points.ts). The status
// guard makes completion idempotent.
async function finalizeTeamBattleIfComplete(db: D1Database, battleId: string): Promise<boolean> {
  const battle = await db.prepare(
    'SELECT * FROM team_battles WHERE id = ?'
  ).bind(battleId).first<TeamBattleRow>();
  if (!battle || battle.status !== 'active' || !battle.started_at) {
    return battle?.status === 'completed';
  }

  const { ended } = deriveTeamBattleRound(battle, Date.now());
  if (!ended) return false;

  const [t1, t2] = [battle.team1_score || 0, battle.team2_score || 0];
  let winnerTeam: number | null = null;
  if (t1 !== t2) {
    winnerTeam = t1 > t2 ? 1 : 2;
  } else {
    const { results: times } = await db.prepare(`
      SELECT tbm.team_number, COALESCE(SUM(tba.time_taken), 0) AS total_time
      FROM team_battle_members tbm
      LEFT JOIN team_battle_answers tba
        ON tba.battle_id = tbm.battle_id AND tba.user_id = tbm.user_id
      WHERE tbm.battle_id = ?
      GROUP BY tbm.team_number
    `).bind(battleId).all();
    const time1 = Number(times.find((r) => (r as Record<string, unknown>).team_number === 1)?.total_time ?? 0);
    const time2 = Number(times.find((r) => (r as Record<string, unknown>).team_number === 2)?.total_time ?? 0);
    if (time1 !== time2) winnerTeam = time1 < time2 ? 1 : 2;
  }

  const completion = await db.prepare(`
    UPDATE team_battles SET status = 'completed', winner_team = ?, completed_at = datetime('now')
    WHERE id = ? AND status = 'active'
  `).bind(winnerTeam, battleId).run();
  if (completion.meta.changes === 0) return true; // already completed concurrently

  if (winnerTeam !== null) {
    const { results: winners } = await db.prepare(
      'SELECT user_id FROM team_battle_members WHERE battle_id = ? AND team_number = ?'
    ).bind(battleId, winnerTeam).all();
    for (const member of winners) {
      const userId = (member as Record<string, unknown>).user_id as string;
      const demoFlags = getDemoDataFlags(userId);
      await awardPoints(db, {
        userId,
        points: battle.xp_reward ?? 200,
        source: 'battle_win',
        sourceRef: battleId,
        isDemoData: demoFlags.is_demo_data,
        expiresAt: demoFlags.expires_at,
      });
    }
  }

  return true;
}

// Strip answer material before serving a question to battle clients (same
// policy as sanitizeQuestionForStudent for 1v1).
function sanitizeTeamBattleQuestion(question: Record<string, unknown>): Record<string, unknown> {
  let options: Array<{ id: string; text: string }> | null = null;
  try {
    const parsed: unknown = typeof question.options === 'string' ? JSON.parse(question.options) : question.options;
    if (Array.isArray(parsed)) {
      const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
      options = parsed.map((option, index) => {
        if (option && typeof option === 'object' && 'id' in option && 'text' in option) {
          const o = option as { id: string; text: string };
          return { id: o.id, text: o.text };
        }
        return { id: letters[index] || String.fromCharCode(65 + index), text: String(option) };
      });
    }
  } catch {
    options = null;
  }
  return {
    id: question.id,
    questionText: question.question_text,
    questionType: question.question_type,
    options,
  };
}

// Shared membership insert for join / join-by-code / invite-accept.
async function addMemberToBattle(
  db: D1Database,
  battleId: string,
  userId: string,
  teamNumber: number,
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const existing = await db.prepare(
    'SELECT id FROM team_battle_members WHERE battle_id = ? AND user_id = ?'
  ).bind(battleId, userId).first();
  if (existing) return { ok: false, error: 'Already in this battle', status: 400 };

  const teamCount = await db.prepare(
    'SELECT COUNT(*) as count FROM team_battle_members WHERE battle_id = ? AND team_number = ?'
  ).bind(battleId, teamNumber).first();
  if ((teamCount?.count as number) >= 3) {
    return { ok: false, error: 'Team is full', status: 400 };
  }

  await db.prepare(`
    INSERT INTO team_battle_members (id, battle_id, user_id, team_number)
    VALUES (?, ?, ?, ?)
  `).bind(generateId(), battleId, userId, teamNumber).run();
  return { ok: true };
}

// =============================================
// TEAM BATTLES ENDPOINTS
// =============================================

// Get available team battles to join
teamBattlesApp.get('/available', async (c) => {
  try {
    const user = c.get('user');
    await expireStaleWaitingTeamBattles(c.env.DB);

    const battles = await c.env.DB.prepare(`
      SELECT
        tb.*,
        s.name as subject_name,
        t.name as topic_name,
        (SELECT COUNT(*) FROM team_battle_members WHERE battle_id = tb.id AND team_number = 1) as team1_count,
        (SELECT COUNT(*) FROM team_battle_members WHERE battle_id = tb.id AND team_number = 2) as team2_count
      FROM team_battles tb
      LEFT JOIN subjects s ON tb.subject_id = s.id
      LEFT JOIN topics t ON tb.topic_id = t.id
      WHERE tb.status IN ('waiting', 'ready')
        AND tb.id NOT IN (
          SELECT battle_id FROM team_battle_members WHERE user_id = ?
        )
      ORDER BY tb.created_at DESC
      LIMIT 20
    `).bind(user.userId).all();

    return c.json({
      success: true,
      data: {
        battles: battles.results.map((b: any) => ({
          id: b.id,
          subjectId: b.subject_id,
          subjectName: b.subject_name,
          topicId: b.topic_id,
          topicName: b.topic_name,
          status: b.status,
          team1Count: b.team1_count,
          team2Count: b.team2_count,
          totalQuestions: b.total_questions,
          timePerQuestion: b.time_per_question,
          xpReward: b.xp_reward,
          createdAt: b.created_at,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching available battles:', error);
    return c.json({ success: false, error: 'Failed to fetch battles' }, 500);
  }
});

// Create a new team battle (shell only — questions are sampled at start time)
teamBattlesApp.post('/create', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const { subjectId, topicId } = body;
    const totalQuestions = Math.min(Math.max(Number(body.totalQuestions) || 10, 3), 20);
    const timePerQuestion = Math.min(Math.max(Number(body.timePerQuestion) || 30, 10), 120);

    const battleId = generateId();
    await c.env.DB.prepare(`
      INSERT INTO team_battles (id, subject_id, topic_id, total_questions, time_per_question)
      VALUES (?, ?, ?, ?, ?)
    `).bind(battleId, subjectId || null, topicId || null, totalQuestions, timePerQuestion).run();

    // Creator is team 1 captain
    await c.env.DB.prepare(`
      INSERT INTO team_battle_members (id, battle_id, user_id, team_number, is_captain)
      VALUES (?, ?, ?, 1, 1)
    `).bind(generateId(), battleId, user.userId).run();

    return c.json({
      success: true,
      data: {
        battleId,
        status: 'waiting',
        teamNumber: 1,
        isCaptain: true,
        totalQuestions,
        timePerQuestion,
      },
    });
  } catch (error) {
    console.error('Error creating team battle:', error);
    return c.json({ success: false, error: 'Failed to create battle' }, 500);
  }
});

// Join a waiting team battle by its shareable 8-char code (id suffix),
// auto-assigned to the smaller team. Registered before /:battleId routes.
teamBattlesApp.post('/join-by-code', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json().catch(() => ({}));
    const code = String((body as { code?: unknown })?.code ?? '').trim();
    // Team-battle ids look like tb_<timestamp>_<rand>, so the last-8 code can
    // legitimately contain an underscore — allow it (SQL matches verbatim).
    if (!/^[A-Za-z0-9_]{4,8}$/.test(code)) {
      return c.json({ success: false, error: 'A battle code is required' }, 400);
    }

    await expireStaleWaitingTeamBattles(c.env.DB);

    const battle = await c.env.DB.prepare(`
      SELECT * FROM team_battles
      WHERE UPPER(SUBSTR(id, -8)) = UPPER(?) AND status IN ('waiting', 'ready')
    `).bind(code).first();
    if (!battle) {
      return c.json({ success: false, error: 'No waiting team battle with that code' }, 404);
    }

    const { results: counts } = await c.env.DB.prepare(`
      SELECT team_number, COUNT(*) as count FROM team_battle_members
      WHERE battle_id = ? GROUP BY team_number
    `).bind(battle.id).all();
    const count1 = Number(counts.find((r) => (r as Record<string, unknown>).team_number === 1)?.count ?? 0);
    const count2 = Number(counts.find((r) => (r as Record<string, unknown>).team_number === 2)?.count ?? 0);
    // Auto-assign: smaller team; tie (or empty team 2) -> team 2, since the
    // creator always sits on team 1.
    const teamNumber = count2 <= count1 ? 2 : 1;

    const joined = await addMemberToBattle(c.env.DB, battle.id as string, user.userId, teamNumber);
    if (!joined.ok) {
      return c.json({ success: false, error: joined.error }, joined.status as 400);
    }

    return c.json({
      success: true,
      data: { battleId: battle.id, teamNumber },
    });
  } catch (error) {
    console.error('Error joining battle by code:', error);
    return c.json({ success: false, error: 'Failed to join battle' }, 500);
  }
});

// Join a team battle
teamBattlesApp.post('/:battleId/join', async (c) => {
  try {
    const user = c.get('user');
    const battleId = c.req.param('battleId');
    const body = await c.req.json();
    const { teamNumber } = body;

    if (![1, 2].includes(teamNumber)) {
      return c.json({ success: false, error: 'Invalid team number' }, 400);
    }

    await expireStaleWaitingTeamBattles(c.env.DB);

    const battle = await c.env.DB.prepare(
      'SELECT * FROM team_battles WHERE id = ? AND status IN (\'waiting\', \'ready\')'
    ).bind(battleId).first();

    if (!battle) {
      return c.json({ success: false, error: 'Battle not found or not joinable' }, 404);
    }

    const joined = await addMemberToBattle(c.env.DB, battleId, user.userId, teamNumber);
    if (!joined.ok) {
      return c.json({ success: false, error: joined.error }, joined.status as 400);
    }

    return c.json({
      success: true,
      data: {
        joined: true,
        battleId,
        teamNumber,
      },
    });
  } catch (error) {
    console.error('Error joining battle:', error);
    return c.json({ success: false, error: 'Failed to join battle' }, 500);
  }
});

// Leave a team battle (waiting phase only). A leaving captain deletes the
// battle; members just lose their seat.
teamBattlesApp.post('/:battleId/leave', async (c) => {
  try {
    const user = c.get('user');
    const battleId = c.req.param('battleId');

    const battle = await c.env.DB.prepare(
      'SELECT id, status FROM team_battles WHERE id = ?'
    ).bind(battleId).first();
    if (!battle) {
      return c.json({ success: false, error: 'Battle not found' }, 404);
    }
    if (battle.status !== 'waiting' && battle.status !== 'ready') {
      return c.json({ success: false, error: 'You can only leave before the battle starts' }, 400);
    }

    const membership = await c.env.DB.prepare(
      'SELECT is_captain FROM team_battle_members WHERE battle_id = ? AND user_id = ?'
    ).bind(battleId, user.userId).first();
    if (!membership) {
      return c.json({ success: false, error: 'You are not in this battle' }, 403);
    }

    if (membership.is_captain) {
      // ON DELETE CASCADE removes members (and invites)
      await c.env.DB.prepare('DELETE FROM team_battles WHERE id = ?').bind(battleId).run();
      return c.json({ success: true, data: { left: true, deleted: true } });
    }

    await c.env.DB.prepare(
      'DELETE FROM team_battle_members WHERE battle_id = ? AND user_id = ?'
    ).bind(battleId, user.userId).run();
    return c.json({ success: true, data: { left: true, deleted: false } });
  } catch (error) {
    console.error('Error leaving battle:', error);
    return c.json({ success: false, error: 'Failed to leave battle' }, 500);
  }
});

// Invite friend to team battle
teamBattlesApp.post('/:battleId/invite', async (c) => {
  try {
    const user = c.get('user');
    const battleId = c.req.param('battleId');
    const body = await c.req.json();
    const { inviteeId, teamNumber } = body;

    // Verify inviter is in the battle
    const membership = await c.env.DB.prepare(
      'SELECT team_number FROM team_battle_members WHERE battle_id = ? AND user_id = ?'
    ).bind(battleId, user.userId).first();

    if (!membership) {
      return c.json({ success: false, error: 'You are not in this battle' }, 403);
    }

    // Create invite
    const inviteId = generateId();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

    await c.env.DB.prepare(`
      INSERT INTO team_battle_invites (id, battle_id, inviter_id, invitee_id, team_number, expires_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(inviteId, battleId, user.userId, inviteeId, teamNumber || membership.team_number, expiresAt).run();

    return c.json({
      success: true,
      data: { inviteId, expiresAt },
    });
  } catch (error) {
    console.error('Error creating invite:', error);
    return c.json({ success: false, error: 'Failed to create invite' }, 500);
  }
});

// Accept team battle invite
teamBattlesApp.post('/invites/:inviteId/accept', async (c) => {
  try {
    const user = c.get('user');
    const inviteId = c.req.param('inviteId');

    const invite = await c.env.DB.prepare(
      'SELECT * FROM team_battle_invites WHERE id = ? AND invitee_id = ? AND status = \'pending\''
    ).bind(inviteId, user.userId).first();

    if (!invite) {
      return c.json({ success: false, error: 'Invite not found or expired' }, 404);
    }

    if (new Date(invite.expires_at as string) < new Date()) {
      await c.env.DB.prepare(
        'UPDATE team_battle_invites SET status = \'expired\' WHERE id = ?'
      ).bind(inviteId).run();
      return c.json({ success: false, error: 'Invite has expired' }, 400);
    }

    // Join the battle
    await c.env.DB.prepare(`
      INSERT INTO team_battle_members (id, battle_id, user_id, team_number)
      VALUES (?, ?, ?, ?)
    `).bind(generateId(), invite.battle_id, user.userId, invite.team_number).run();

    // Update invite status
    await c.env.DB.prepare(
      'UPDATE team_battle_invites SET status = \'accepted\' WHERE id = ?'
    ).bind(inviteId).run();

    return c.json({
      success: true,
      data: {
        battleId: invite.battle_id,
        teamNumber: invite.team_number,
      },
    });
  } catch (error) {
    console.error('Error accepting invite:', error);
    return c.json({ success: false, error: 'Failed to accept invite' }, 500);
  }
});

// Get battle details: battle + rosters + derived round clock + per-member
// progress counts. Never serves answer content or opponent submissions.
teamBattlesApp.get('/:battleId', async (c) => {
  try {
    const battleId = c.req.param('battleId');

    await expireStaleWaitingTeamBattles(c.env.DB);
    await finalizeTeamBattleIfComplete(c.env.DB, battleId);

    const battle = await c.env.DB.prepare(`
      SELECT tb.*, s.name as subject_name, t.name as topic_name
      FROM team_battles tb
      LEFT JOIN subjects s ON tb.subject_id = s.id
      LEFT JOIN topics t ON tb.topic_id = t.id
      WHERE tb.id = ?
    `).bind(battleId).first<Record<string, unknown>>();

    if (!battle) {
      return c.json({ success: false, error: 'Battle not found' }, 404);
    }

    const members = await c.env.DB.prepare(`
      SELECT tbm.*, u.name, u.avatar_url,
        (SELECT COUNT(*) FROM team_battle_answers tba
         WHERE tba.battle_id = tbm.battle_id AND tba.user_id = tbm.user_id) AS answered_count
      FROM team_battle_members tbm
      JOIN users u ON tbm.user_id = u.id
      WHERE tbm.battle_id = ?
      ORDER BY tbm.team_number, tbm.is_captain DESC, tbm.joined_at
    `).bind(battleId).all();

    const toMember = (m: any) => ({
      userId: m.user_id,
      name: m.name,
      avatarUrl: m.avatar_url,
      isCaptain: !!m.is_captain,
      teamNumber: m.team_number,
      score: m.score,
      correctAnswers: m.correct_answers,
      answeredCount: m.answered_count ?? 0,
    });
    const team1 = members.results.filter((m: any) => m.team_number === 1).map(toMember);
    const team2 = members.results.filter((m: any) => m.team_number === 2).map(toMember);

    const round = deriveTeamBattleRound(battle as unknown as TeamBattleRow, Date.now());

    // Serve the current question (sanitized) while its round is open.
    let question: Record<string, unknown> | null = null;
    if (battle.status === 'active' && !round.ended) {
      const questionIds = readQuestionIds(battle as unknown as TeamBattleRow);
      const questionId = questionIds[round.roundIndex];
      if (questionId) {
        const row = await c.env.DB.prepare(`
          SELECT q.id, q.question_text, q.question_type, q.options
          FROM questions q
          JOIN topics t ON t.id = q.topic_id AND t.subject_id = q.subject_id
          JOIN subjects s ON s.id = q.subject_id AND s.is_active = 1
          WHERE q.topic_id IS NOT NULL AND q.id = ?
        `).bind(questionId).first<Record<string, unknown>>();
        if (row) question = sanitizeTeamBattleQuestion(row);
      }
    }

    return c.json({
      success: true,
      data: {
        battle: {
          id: battle.id,
          subjectName: battle.subject_name,
          topicName: battle.topic_name,
          status: battle.status,
          team1Score: battle.team1_score,
          team2Score: battle.team2_score,
          currentQuestion: round.roundIndex,
          roundEndsAt: round.roundEndsAt,
          totalQuestions: battle.total_questions,
          timePerQuestion: battle.time_per_question,
          winnerTeam: battle.winner_team,
          xpReward: battle.xp_reward,
          startedAt: battle.started_at,
          completedAt: battle.completed_at,
          createdAt: battle.created_at,
          question,
        },
        team1,
        team2,
      },
    });
  } catch (error) {
    console.error('Error fetching battle:', error);
    return c.json({ success: false, error: 'Failed to fetch battle' }, 500);
  }
});

// Start battle (captain only). Requires both teams to be equal size, 1-3
// members each; samples the question set now and opens round 0.
teamBattlesApp.post('/:battleId/start', async (c) => {
  try {
    const user = c.get('user');
    const battleId = c.req.param('battleId');

    await expireStaleWaitingTeamBattles(c.env.DB);

    // Verify captain
    const membership = await c.env.DB.prepare(
      'SELECT is_captain FROM team_battle_members WHERE battle_id = ? AND user_id = ?'
    ).bind(battleId, user.userId).first();

    if (!membership?.is_captain) {
      return c.json({ success: false, error: 'Only captain can start the battle' }, 403);
    }

    const battle = await c.env.DB.prepare(
      'SELECT * FROM team_battles WHERE id = ? AND status IN (\'waiting\', \'ready\')'
    ).bind(battleId).first<Record<string, unknown>>();

    if (!battle) {
      return c.json({ success: false, error: 'Battle not found or already started' }, 400);
    }

    // Equal-size teams, 1-3 members each
    const { results: counts } = await c.env.DB.prepare(`
      SELECT team_number, COUNT(*) as count FROM team_battle_members
      WHERE battle_id = ? GROUP BY team_number
    `).bind(battleId).all();
    const count1 = Number(counts.find((r) => (r as Record<string, unknown>).team_number === 1)?.count ?? 0);
    const count2 = Number(counts.find((r) => (r as Record<string, unknown>).team_number === 2)?.count ?? 0);
    if (count1 !== count2 || count1 < 1 || count1 > 3) {
      return c.json({
        success: false,
        error: `Both teams must have the same number of players (1-3 each). Currently ${count1} vs ${count2}.`,
      }, 400);
    }

    // Sample the question set from the real bank (same eligibility rules and
    // ORDER BY RANDOM() sampler as 1v1).
    let query = `
      SELECT q.id
      FROM questions q
      JOIN topics t ON t.id = q.topic_id AND t.subject_id = q.subject_id
      JOIN subjects s ON s.id = q.subject_id AND s.is_active = 1
      WHERE q.topic_id IS NOT NULL
        AND q.question_type IN ('multiple_choice', 'direct_answer')
    `;
    const params: (string | number)[] = [];
    if (battle.subject_id) {
      query += ' AND q.subject_id = ?';
      params.push(battle.subject_id as string);
    }
    if (battle.topic_id) {
      query += ' AND q.topic_id = ?';
      params.push(battle.topic_id as string);
    }
    query += ' ORDER BY RANDOM() LIMIT ?';
    params.push(battle.total_questions as number);

    const questions = await c.env.DB.prepare(query).bind(...params).all();
    const questionIds = questions.results.map((q: any) => q.id as string);
    if (questionIds.length < (battle.total_questions as number)) {
      return c.json({ success: false, error: 'Not enough questions available' }, 400);
    }

    const started = await c.env.DB.prepare(`
      UPDATE team_battles
      SET status = 'active', started_at = datetime('now'), question_ids = ?
      WHERE id = ? AND status IN ('waiting', 'ready')
    `).bind(JSON.stringify(questionIds), battleId).run();
    if (started.meta.changes === 0) {
      return c.json({ success: false, error: 'Battle already started' }, 400);
    }

    return c.json({
      success: true,
      data: { started: true, teamSize: count1 },
    });
  } catch (error) {
    console.error('Error starting battle:', error);
    return c.json({ success: false, error: 'Failed to start battle' }, 500);
  }
});

// Submit an answer for the currently open round. The round window is computed
// server-side from started_at — client timestamps are never trusted.
teamBattlesApp.post('/:battleId/answer', async (c) => {
  try {
    const user = c.get('user');
    const battleId = c.req.param('battleId');
    const body = await c.req.json();
    const { questionId, answer } = body;

    if (typeof questionId !== 'string' || questionId.length === 0 || typeof answer !== 'string') {
      return c.json({ success: false, error: 'Invalid answer payload' }, 400);
    }

    const battle = await c.env.DB.prepare(
      'SELECT * FROM team_battles WHERE id = ?'
    ).bind(battleId).first<TeamBattleRow>();

    if (!battle || (battle.status !== 'active' && battle.status !== 'completed')) {
      return c.json({ success: false, error: 'Battle not active' }, 400);
    }

    const membership = await c.env.DB.prepare(
      'SELECT * FROM team_battle_members WHERE battle_id = ? AND user_id = ?'
    ).bind(battleId, user.userId).first();

    if (!membership) {
      return c.json({ success: false, error: 'Not in this battle' }, 403);
    }

    const questionIds = readQuestionIds(battle);
    const questionIndex = questionIds.indexOf(questionId);
    if (questionIndex === -1) {
      return c.json({ success: false, error: 'Question is not part of this battle' }, 400);
    }

    // Round-window enforcement on the lazy clock
    const round = deriveTeamBattleRound(battle, Date.now());
    if (round.ended) {
      await finalizeTeamBattleIfComplete(c.env.DB, battleId);
      return c.json({ success: false, error: 'Battle has ended' }, 400, );
    }
    if (battle.status !== 'active') {
      return c.json({ success: false, error: 'Battle not active' }, 400);
    }
    if (questionIndex !== round.roundIndex) {
      return c.json({ success: false, error: 'That round is not open' }, 400);
    }

    // One answer per member per question
    const existing = await c.env.DB.prepare(`
      SELECT id FROM team_battle_answers
      WHERE battle_id = ? AND user_id = ? AND question_index = ?
    `).bind(battleId, user.userId, questionIndex).first();
    if (existing) {
      return c.json({ success: false, error: 'Already answered this question' }, 409);
    }

    const question = await c.env.DB.prepare(
      `SELECT q.correct_answer, q.points
       FROM questions q
       JOIN topics t ON t.id = q.topic_id AND t.subject_id = q.subject_id
       JOIN subjects s ON s.id = q.subject_id AND s.is_active = 1
       WHERE q.topic_id IS NOT NULL
         AND q.id = ?`
    ).bind(questionId).first<{ correct_answer: string; points: number | null }>();

    if (!question) {
      return c.json({ success: false, error: 'Question is unavailable' }, 409);
    }

    // time_taken is measured from the round's open, never from the client.
    const startMs = parseSqlUtc(battle.started_at as string);
    const timeTaken = Math.max(
      0,
      Math.floor((Date.now() - (startMs + round.roundIndex * battle.time_per_question * 1000)) / 1000),
    );

    const isCorrect = isTeamBattleAnswerCorrect(answer, question.correct_answer);
    const points = teamBattleAnswerPoints(isCorrect, question.points || 3, timeTaken);

    await c.env.DB.prepare(`
      INSERT INTO team_battle_answers (id, battle_id, user_id, question_id, question_index, answer, is_correct, time_taken, points_earned)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(generateId(), battleId, user.userId, questionId, questionIndex, answer, isCorrect ? 1 : 0, timeTaken, points).run();

    // Update member score
    await c.env.DB.prepare(`
      UPDATE team_battle_members
      SET score = score + ?, correct_answers = correct_answers + ?
      WHERE battle_id = ? AND user_id = ?
    `).bind(points, isCorrect ? 1 : 0, battleId, user.userId).run();

    // Update team score
    const teamField = membership.team_number === 1 ? 'team1_score' : 'team2_score';
    await c.env.DB.prepare(`
      UPDATE team_battles
      SET ${teamField} = ${teamField} + ?
      WHERE id = ?
    `).bind(points, battleId).run();

    return c.json({
      success: true,
      data: {
        correct: isCorrect,
        points,
        correctAnswer: question.correct_answer,
        questionIndex,
        timeTaken,
      },
    });
  } catch (error) {
    console.error('Error submitting answer:', error);
    return c.json({ success: false, error: 'Failed to submit answer' }, 500);
  }
});

// Get user's battle history
teamBattlesApp.get('/history/me', async (c) => {
  try {
    const user = c.get('user');
    const limit = parseLimit(c, 10);

    const battles = await c.env.DB.prepare(`
      SELECT
        tb.*,
        tbm.team_number,
        tbm.score as my_score,
        tbm.correct_answers as my_correct,
        s.name as subject_name
      FROM team_battles tb
      JOIN team_battle_members tbm ON tb.id = tbm.battle_id AND tbm.user_id = ?
      LEFT JOIN subjects s ON tb.subject_id = s.id
      WHERE tb.status = 'completed'
      ORDER BY tb.completed_at DESC
      LIMIT ?
    `).bind(user.userId, limit).all();

    return c.json({
      success: true,
      data: {
        battles: battles.results.map((b: any) => ({
          id: b.id,
          subjectName: b.subject_name,
          myTeam: b.team_number,
          team1Score: b.team1_score,
          team2Score: b.team2_score,
          winnerTeam: b.winner_team,
          won: b.winner_team === b.team_number,
          myScore: b.my_score,
          myCorrect: b.my_correct,
          xpReward: b.xp_reward,
          completedAt: b.completed_at,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching battle history:', error);
    return c.json({ success: false, error: 'Failed to fetch history' }, 500);
  }
});

export { teamBattlesApp };
