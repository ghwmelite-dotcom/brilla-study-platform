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

const quickPlayApp = new Hono<{ Bindings: Env; Variables: { user: UserPayload } }>();

// All quickplay routes require a verified JWT (sets user on context).
quickPlayApp.use('*', requireAuth);

// Helper to generate unique ID
const generateId = () => `qp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

// =============================================
// QUICK PLAY ENDPOINTS
// =============================================

// Get daily challenge
quickPlayApp.get('/daily-challenge', async (c) => {
  try {
    const user = c.get('user');
    const today = new Date().toISOString().split('T')[0];

    // Check if daily challenge exists for today
    let challenge = await c.env.DB.prepare(
      'SELECT * FROM daily_challenges WHERE date = ?'
    ).bind(today).first();

    // If no challenge exists, create one
    if (!challenge) {
      // Get random questions for the challenge
      const questions = await c.env.DB.prepare(`
        SELECT id FROM questions
        WHERE difficulty IN ('easy', 'medium')
        ORDER BY RANDOM()
        LIMIT 5
      `).all();

      if (questions.results.length > 0) {
        const challengeId = generateId();
        const questionIds = JSON.stringify(questions.results.map((q: any) => q.id));

        await c.env.DB.prepare(`
          INSERT INTO daily_challenges (id, date, question_ids, xp_reward, time_limit)
          VALUES (?, ?, ?, 100, 120)
        `).bind(challengeId, today, questionIds).run();

        challenge = await c.env.DB.prepare(
          'SELECT * FROM daily_challenges WHERE id = ?'
        ).bind(challengeId).first();
      }
    }

    // Check if user already completed today's challenge
    const completed = await c.env.DB.prepare(`
      SELECT id FROM quick_play_sessions
      WHERE user_id = ? AND game_type = 'daily_challenge'
      AND DATE(created_at) = ?
    `).bind(user.userId, today).first();

    return c.json({
      success: true,
      data: {
        challenge: challenge ? {
          id: challenge.id,
          date: challenge.date,
          questionCount: challenge.question_ids ? JSON.parse(challenge.question_ids as string).length : 0,
          xpReward: challenge.xp_reward,
          timeLimit: challenge.time_limit,
          completed: !!completed,
        } : null,
      },
    });
  } catch (error) {
    console.error('Error fetching daily challenge:', error);
    return c.json({ success: false, error: 'Failed to fetch daily challenge' }, 500);
  }
});

// Start a quick play session
quickPlayApp.post('/start', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const { gameType, subjectId } = body;

    if (!['speed_blitz', 'brain_teaser', 'subject_dash', 'daily_challenge'].includes(gameType)) {
      return c.json({ success: false, error: 'Invalid game type' }, 400);
    }

    // Get questions based on game type
    let questionCount = 5;
    let timeLimit = 60;

    if (gameType === 'subject_dash') {
      questionCount = 7;
      timeLimit = 90;
    } else if (gameType === 'brain_teaser') {
      questionCount = 1;
      timeLimit = 120;
    } else if (gameType === 'daily_challenge') {
      questionCount = 5;
      timeLimit = 120;
    }

    // Build query for questions
    let query = `
      SELECT q.id, q.question_text, q.options, q.correct_answer, q.explanation,
             q.difficulty, t.name as topic_name, s.name as subject_name
      FROM questions q
      LEFT JOIN topics t ON q.topic_id = t.id
      LEFT JOIN subjects s ON q.subject_id = s.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (subjectId) {
      query += ` AND q.subject_id = ?`;
      params.push(subjectId);
    }

    if (gameType === 'brain_teaser') {
      query += ` AND q.difficulty = 'hard'`;
    }

    query += ` ORDER BY RANDOM() LIMIT ?`;
    params.push(questionCount);

    const questions = await c.env.DB.prepare(query).bind(...params).all();

    // Create session
    const sessionId = generateId();
    await c.env.DB.prepare(`
      INSERT INTO quick_play_sessions (id, user_id, game_type, subject_id, started_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).bind(sessionId, user.userId, gameType, subjectId || null).run();

    // Get user's daily multiplier
    const today = new Date().toISOString().split('T')[0];
    const multiplier = await c.env.DB.prepare(`
      SELECT multiplier FROM daily_multipliers
      WHERE user_id = ? AND date = ? AND used = 0
    `).bind(user.userId, today).first();

    return c.json({
      success: true,
      data: {
        sessionId,
        gameType,
        timeLimit,
        multiplier: multiplier?.multiplier || 1.0,
        questions: questions.results.map((q: any) => ({
          id: q.id,
          questionText: q.question_text,
          options: q.options ? JSON.parse(q.options) : [],
          difficulty: q.difficulty,
          topicName: q.topic_name,
          subjectName: q.subject_name,
        })),
      },
    });
  } catch (error) {
    console.error('Error starting quick play:', error);
    return c.json({ success: false, error: 'Failed to start game' }, 500);
  }
});

// Submit quick play answers
quickPlayApp.post('/submit', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const { sessionId, answers, timeTaken } = body;

    // Validate the payload before touching the DB (audit findings 4 & 6).
    if (!Array.isArray(answers) || answers.length === 0 || answers.length > 100) {
      return c.json({ success: false, error: 'answers must be a non-empty array (max 100)' }, 400);
    }
    for (const a of answers) {
      if (!a || typeof a.questionId !== 'string' || typeof a.answer !== 'string') {
        return c.json({ success: false, error: 'Invalid answer shape' }, 400);
      }
    }
    const elapsed = typeof timeTaken === 'number' && Number.isFinite(timeTaken)
      ? Math.min(Math.max(Math.round(timeTaken), 0), 3_600_000) // clamp 0..60min
      : 0;

    // Get session
    const session = await c.env.DB.prepare(
      'SELECT * FROM quick_play_sessions WHERE id = ? AND user_id = ?'
    ).bind(sessionId, user.userId).first();

    if (!session) {
      return c.json({ success: false, error: 'Session not found' }, 404);
    }

    if (session.completed_at) {
      return c.json({ success: false, error: 'Session already completed' }, 400);
    }

    // Calculate score — one batched query instead of a per-answer SELECT.
    const ids = [...new Set(answers.map((a: any) => a.questionId as string))];
    const { results: questions } = await c.env.DB.prepare(
      `SELECT id, correct_answer, explanation FROM questions WHERE id IN (${ids.map(() => '?').join(',')})`
    ).bind(...ids).all();
    const byId = new Map((questions as any[]).map((q) => [q.id, q]));

    let correctCount = 0;
    const results = answers.map((a: any) => {
      const q = byId.get(a.questionId);
      const isCorrect = q ? q.correct_answer === a.answer : false;
      if (isCorrect) correctCount++;
      return {
        questionId: a.questionId,
        correct: isCorrect,
        correctAnswer: q?.correct_answer ?? null,
        explanation: q?.explanation ?? null,
      };
    });

    // Calculate XP based on performance
    const baseXp = session.game_type === 'brain_teaser' ? 50 :
                   session.game_type === 'subject_dash' ? 75 : 50;
    const accuracyBonus = Math.round((correctCount / answers.length) * baseXp);
    // elapsed === 0 means missing/invalid (e.g. negative) timeTaken — no speed bonus.
    const speedBonus = elapsed === 0 ? 0 : elapsed < 30000 ? 25 : elapsed < 60000 ? 10 : 0;

    // Get multiplier
    const today = new Date().toISOString().split('T')[0];
    const multiplierRecord = await c.env.DB.prepare(`
      SELECT id, multiplier FROM daily_multipliers
      WHERE user_id = ? AND date = ? AND used = 0
    `).bind(user.userId, today).first();

    const multiplier = multiplierRecord?.multiplier || 1.0;
    const totalXp = Math.round((baseXp + accuracyBonus + speedBonus) * multiplier);

    // Update session
    await c.env.DB.prepare(`
      UPDATE quick_play_sessions
      SET questions_answered = ?, correct_answers = ?, score = ?,
          time_taken = ?, xp_earned = ?, multiplier_applied = ?,
          completed_at = datetime('now')
      WHERE id = ?
    `).bind(
      answers.length, correctCount, Math.round((correctCount / answers.length) * 100),
      elapsed, totalXp, multiplier, sessionId
    ).run();

    // Mark multiplier as used
    if (multiplierRecord) {
      await c.env.DB.prepare(
        'UPDATE daily_multipliers SET used = 1 WHERE id = ?'
      ).bind(multiplierRecord.id).run();
    }

    // Award XP to user
    await c.env.DB.prepare(
      'UPDATE users SET xp_points = xp_points + ? WHERE id = ?'
    ).bind(totalXp, user.userId).run();

    // Log activity
    await c.env.DB.prepare(`
      INSERT INTO activity_feed (id, user_id, activity_type, title, description, metadata)
      VALUES (?, ?, 'high_score', ?, ?, ?)
    `).bind(
      generateId(),
      user.userId,
      `Completed ${session.game_type.replace('_', ' ')}`,
      `Scored ${Math.round((correctCount / answers.length) * 100)}%`,
      JSON.stringify({ gameType: session.game_type, score: correctCount, total: answers.length, xp: totalXp })
    ).run();

    return c.json({
      success: true,
      data: {
        score: Math.round((correctCount / answers.length) * 100),
        correctAnswers: correctCount,
        totalQuestions: answers.length,
        xpEarned: totalXp,
        multiplierApplied: multiplier,
        timeTaken,
        results,
      },
    });
  } catch (error) {
    console.error('Error submitting quick play:', error);
    return c.json({ success: false, error: 'Failed to submit answers' }, 500);
  }
});

// Get quick play history
quickPlayApp.get('/history', async (c) => {
  try {
    const user = c.get('user');
    const limit = parseLimit(c, 10);

    const sessions = await c.env.DB.prepare(`
      SELECT qp.*, s.name as subject_name
      FROM quick_play_sessions qp
      LEFT JOIN subjects s ON qp.subject_id = s.id
      WHERE qp.user_id = ? AND qp.completed_at IS NOT NULL
      ORDER BY qp.completed_at DESC
      LIMIT ?
    `).bind(user.userId, limit).all();

    return c.json({
      success: true,
      data: {
        sessions: sessions.results.map((s: any) => ({
          id: s.id,
          gameType: s.game_type,
          subjectName: s.subject_name,
          score: s.score,
          correctAnswers: s.correct_answers,
          questionsAnswered: s.questions_answered,
          xpEarned: s.xp_earned,
          timeTaken: s.time_taken,
          completedAt: s.completed_at,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    return c.json({ success: false, error: 'Failed to fetch history' }, 500);
  }
});

// Get quick play stats
quickPlayApp.get('/stats', async (c) => {
  try {
    const user = c.get('user');

    const stats = await c.env.DB.prepare(`
      SELECT
        COUNT(*) as total_games,
        SUM(xp_earned) as total_xp,
        AVG(score) as avg_score,
        SUM(correct_answers) as total_correct,
        SUM(questions_answered) as total_questions
      FROM quick_play_sessions
      WHERE user_id = ? AND completed_at IS NOT NULL
    `).bind(user.userId).first();

    const today = new Date().toISOString().split('T')[0];
    const todayStats = await c.env.DB.prepare(`
      SELECT COUNT(*) as games_today, SUM(xp_earned) as xp_today
      FROM quick_play_sessions
      WHERE user_id = ? AND DATE(completed_at) = ?
    `).bind(user.userId, today).first();

    return c.json({
      success: true,
      data: {
        totalGames: stats?.total_games || 0,
        totalXp: stats?.total_xp || 0,
        avgScore: Math.round(stats?.avg_score || 0),
        accuracy: stats?.total_questions > 0
          ? Math.round((stats.total_correct / stats.total_questions) * 100)
          : 0,
        gamesToday: todayStats?.games_today || 0,
        xpToday: todayStats?.xp_today || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return c.json({ success: false, error: 'Failed to fetch stats' }, 500);
  }
});

export { quickPlayApp };
