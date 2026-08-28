import { Hono } from 'hono';
import { requireAuth } from './auth-middleware';
import { parseLimit } from './http';

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
// TEAM BATTLES ENDPOINTS
// =============================================

// Get available team battles to join
teamBattlesApp.get('/available', async (c) => {
  try {
    const user = c.get('user');

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

// Create a new team battle
teamBattlesApp.post('/create', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const { subjectId, topicId, totalQuestions = 10, timePerQuestion = 30 } = body;

    // Get random questions
    let query = `
      SELECT q.id
      FROM questions q
      JOIN topics t ON t.id = q.topic_id AND t.subject_id = q.subject_id
      JOIN subjects s ON s.id = q.subject_id AND s.is_active = 1
      WHERE q.topic_id IS NOT NULL
    `;
    const params: any[] = [];

    if (subjectId) {
      query += ' AND q.subject_id = ?';
      params.push(subjectId);
    }
    if (topicId) {
      query += ' AND q.topic_id = ?';
      params.push(topicId);
    }

    query += ' ORDER BY RANDOM() LIMIT ?';
    params.push(totalQuestions);

    const questions = await c.env.DB.prepare(query).bind(...params).all();
    const questionIds = questions.results.map((q: any) => q.id);

    if (questionIds.length < totalQuestions) {
      return c.json({ success: false, error: 'Not enough questions available' }, 400);
    }

    // Create battle
    const battleId = generateId();
    await c.env.DB.prepare(`
      INSERT INTO team_battles (id, subject_id, topic_id, total_questions, time_per_question, question_ids)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(battleId, subjectId || null, topicId || null, totalQuestions, timePerQuestion, JSON.stringify(questionIds)).run();

    // Add creator as team 1 captain
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
      },
    });
  } catch (error) {
    console.error('Error creating team battle:', error);
    return c.json({ success: false, error: 'Failed to create battle' }, 500);
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

    const battle = await c.env.DB.prepare(
      'SELECT * FROM team_battles WHERE id = ? AND status IN (\'waiting\', \'ready\')'
    ).bind(battleId).first();

    if (!battle) {
      return c.json({ success: false, error: 'Battle not found or not joinable' }, 404);
    }

    // Check if already in battle
    const existing = await c.env.DB.prepare(
      'SELECT id FROM team_battle_members WHERE battle_id = ? AND user_id = ?'
    ).bind(battleId, user.userId).first();

    if (existing) {
      return c.json({ success: false, error: 'Already in this battle' }, 400);
    }

    // Check team size (max 3 per team)
    const teamCount = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM team_battle_members WHERE battle_id = ? AND team_number = ?'
    ).bind(battleId, teamNumber).first();

    if ((teamCount?.count as number) >= 3) {
      return c.json({ success: false, error: 'Team is full' }, 400);
    }

    // Join team
    await c.env.DB.prepare(`
      INSERT INTO team_battle_members (id, battle_id, user_id, team_number)
      VALUES (?, ?, ?, ?)
    `).bind(generateId(), battleId, user.userId, teamNumber).run();

    // Check if battle is ready (3v3)
    const team1Count = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM team_battle_members WHERE battle_id = ? AND team_number = 1'
    ).bind(battleId).first();
    const team2Count = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM team_battle_members WHERE battle_id = ? AND team_number = 2'
    ).bind(battleId).first();

    if ((team1Count?.count as number) >= 3 && (team2Count?.count as number) >= 3) {
      await c.env.DB.prepare(
        'UPDATE team_battles SET status = \'ready\' WHERE id = ?'
      ).bind(battleId).run();
    }

    return c.json({
      success: true,
      data: {
        joined: true,
        teamNumber,
      },
    });
  } catch (error) {
    console.error('Error joining battle:', error);
    return c.json({ success: false, error: 'Failed to join battle' }, 500);
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

// Get battle details
teamBattlesApp.get('/:battleId', async (c) => {
  try {
    const battleId = c.req.param('battleId');

    const battle = await c.env.DB.prepare(`
      SELECT tb.*, s.name as subject_name, t.name as topic_name
      FROM team_battles tb
      LEFT JOIN subjects s ON tb.subject_id = s.id
      LEFT JOIN topics t ON tb.topic_id = t.id
      WHERE tb.id = ?
    `).bind(battleId).first();

    if (!battle) {
      return c.json({ success: false, error: 'Battle not found' }, 404);
    }

    // Get team members
    const members = await c.env.DB.prepare(`
      SELECT tbm.*, u.display_name, u.avatar_url
      FROM team_battle_members tbm
      JOIN users u ON tbm.user_id = u.id
      WHERE tbm.battle_id = ?
      ORDER BY tbm.team_number, tbm.is_captain DESC
    `).bind(battleId).all();

    const team1 = members.results.filter((m: any) => m.team_number === 1);
    const team2 = members.results.filter((m: any) => m.team_number === 2);

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
          currentQuestion: battle.current_question,
          totalQuestions: battle.total_questions,
          timePerQuestion: battle.time_per_question,
          winnerTeam: battle.winner_team,
          xpReward: battle.xp_reward,
          startedAt: battle.started_at,
          completedAt: battle.completed_at,
        },
        team1: team1.map((m: any) => ({
          userId: m.user_id,
          displayName: m.display_name,
          avatarUrl: m.avatar_url,
          isCaptain: !!m.is_captain,
          score: m.score,
          correctAnswers: m.correct_answers,
        })),
        team2: team2.map((m: any) => ({
          userId: m.user_id,
          displayName: m.display_name,
          avatarUrl: m.avatar_url,
          isCaptain: !!m.is_captain,
          score: m.score,
          correctAnswers: m.correct_answers,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching battle:', error);
    return c.json({ success: false, error: 'Failed to fetch battle' }, 500);
  }
});

// Start battle (captain only)
teamBattlesApp.post('/:battleId/start', async (c) => {
  try {
    const user = c.get('user');
    const battleId = c.req.param('battleId');

    // Verify captain
    const membership = await c.env.DB.prepare(
      'SELECT is_captain FROM team_battle_members WHERE battle_id = ? AND user_id = ?'
    ).bind(battleId, user.userId).first();

    if (!membership?.is_captain) {
      return c.json({ success: false, error: 'Only captain can start the battle' }, 403);
    }

    const battle = await c.env.DB.prepare(
      'SELECT * FROM team_battles WHERE id = ? AND status = \'ready\''
    ).bind(battleId).first();

    if (!battle) {
      return c.json({ success: false, error: 'Battle not ready to start' }, 400);
    }

    await c.env.DB.prepare(`
      UPDATE team_battles
      SET status = 'active', started_at = datetime('now')
      WHERE id = ?
    `).bind(battleId).run();

    return c.json({
      success: true,
      data: { started: true },
    });
  } catch (error) {
    console.error('Error starting battle:', error);
    return c.json({ success: false, error: 'Failed to start battle' }, 500);
  }
});

// Submit answer in battle
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
      'SELECT * FROM team_battles WHERE id = ? AND status = \'active\''
    ).bind(battleId).first<{ question_ids: string | null }>();

    if (!battle) {
      return c.json({ success: false, error: 'Battle not active' }, 400);
    }

    const membership = await c.env.DB.prepare(
      'SELECT * FROM team_battle_members WHERE battle_id = ? AND user_id = ?'
    ).bind(battleId, user.userId).first();

    if (!membership) {
      return c.json({ success: false, error: 'Not in this battle' }, 403);
    }

    // Check answer
    let selectedQuestionIds: unknown;
    try {
      selectedQuestionIds = JSON.parse(battle.question_ids || '[]');
    } catch {
      return c.json({ success: false, error: 'Battle question set is unavailable' }, 409);
    }
    if (
      !Array.isArray(selectedQuestionIds)
      || selectedQuestionIds.some((id) => typeof id !== 'string')
      || !selectedQuestionIds.includes(questionId)
    ) {
      return c.json({ success: false, error: 'Question is not part of this battle' }, 400);
    }

    const question = await c.env.DB.prepare(
      `SELECT q.correct_answer
       FROM questions q
       JOIN topics t ON t.id = q.topic_id AND t.subject_id = q.subject_id
       JOIN subjects s ON s.id = q.subject_id AND s.is_active = 1
       WHERE q.topic_id IS NOT NULL
         AND q.id = ?`
    ).bind(questionId).first<{ correct_answer: string }>();

    if (!question) {
      return c.json({ success: false, error: 'Question is unavailable' }, 409);
    }

    const isCorrect = question.correct_answer === answer;
    const points = isCorrect ? 10 : 0;

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
        correctAnswer: question?.correct_answer,
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
