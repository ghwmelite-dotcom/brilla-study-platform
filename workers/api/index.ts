import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';

// Types for Cloudflare bindings
interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  ENVIRONMENT: string;
  ANTHROPIC_API_KEY?: string;
  AI_PROVIDER?: string;
  AI_MODEL?: string;
}

// Claude API helper
async function callClaudeAPI(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json() as { content: Array<{ text: string }> };
  return data.content[0]?.text || 'No response generated.';
}

const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use('*', cors());

// Public routes (no auth required)
const publicApp = new Hono<{ Bindings: Env }>();

// Health check
publicApp.get('/health', (c) => {
  return c.json({ status: 'ok', environment: c.env.ENVIRONMENT });
});

// Auth routes
publicApp.post('/auth/register', async (c) => {
  const { email, password, name, house, yearGroup } = await c.req.json();

  // In production, hash the password
  const id = `user_${Date.now()}`;

  try {
    await c.env.DB.prepare(`
      INSERT INTO users (id, email, password_hash, name, house, year_group)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(id, email, password, name, house || null, yearGroup || null).run();

    const user = {
      id,
      email,
      name,
      role: 'student',
      house,
      yearGroup,
      xpPoints: 0,
      level: 1,
      streakDays: 0,
    };

    // In production, generate proper JWT
    const token = `mock_token_${id}`;

    return c.json({ success: true, data: { user, token } });
  } catch (error) {
    return c.json({ success: false, error: 'Registration failed' }, 400);
  }
});

publicApp.post('/auth/login', async (c) => {
  const { email, password } = await c.req.json();

  try {
    const result = await c.env.DB.prepare(`
      SELECT * FROM users WHERE email = ? AND password_hash = ?
    `).bind(email, password).first();

    if (!result) {
      return c.json({ success: false, error: 'Invalid credentials' }, 401);
    }

    const user = {
      id: result.id,
      email: result.email,
      name: result.name,
      role: result.role,
      house: result.house,
      yearGroup: result.year_group,
      xpPoints: result.xp_points,
      level: result.level,
      streakDays: result.streak_days,
    };

    const token = `mock_token_${result.id}`;

    return c.json({ success: true, data: { user, token } });
  } catch (error) {
    return c.json({ success: false, error: 'Login failed' }, 500);
  }
});

// Subjects
publicApp.get('/subjects', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT * FROM subjects ORDER BY display_order
    `).all();

    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch subjects' }, 500);
  }
});

publicApp.get('/subjects/:slug', async (c) => {
  const slug = c.req.param('slug');

  try {
    const subject = await c.env.DB.prepare(`
      SELECT * FROM subjects WHERE slug = ?
    `).bind(slug).first();

    if (!subject) {
      return c.json({ success: false, error: 'Subject not found' }, 404);
    }

    return c.json({ success: true, data: subject });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch subject' }, 500);
  }
});

// Topics
publicApp.get('/topics', async (c) => {
  const subjectId = c.req.query('subject');

  try {
    let query = 'SELECT * FROM topics';
    const params: string[] = [];

    if (subjectId) {
      query += ' WHERE subject_id = ?';
      params.push(subjectId);
    }

    query += ' ORDER BY display_order';

    const stmt = params.length > 0
      ? c.env.DB.prepare(query).bind(...params)
      : c.env.DB.prepare(query);

    const { results } = await stmt.all();

    // Parse key_formulas JSON
    const topics = results.map((t: Record<string, unknown>) => ({
      ...t,
      keyFormulas: t.key_formulas ? JSON.parse(t.key_formulas as string) : [],
    }));

    return c.json({ success: true, data: topics });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch topics' }, 500);
  }
});

publicApp.get('/topics/:id', async (c) => {
  const id = c.req.param('id');

  try {
    const topic = await c.env.DB.prepare(`
      SELECT * FROM topics WHERE id = ?
    `).bind(id).first();

    if (!topic) {
      return c.json({ success: false, error: 'Topic not found' }, 404);
    }

    return c.json({
      success: true,
      data: {
        ...topic,
        keyFormulas: topic.key_formulas ? JSON.parse(topic.key_formulas as string) : [],
      },
    });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch topic' }, 500);
  }
});

// Questions
publicApp.get('/questions', async (c) => {
  const subject = c.req.query('subject');
  const topic = c.req.query('topic');
  const difficulty = c.req.query('difficulty');
  const round = c.req.query('round');
  const limit = parseInt(c.req.query('limit') || '20');
  const offset = parseInt(c.req.query('offset') || '0');

  try {
    let query = 'SELECT * FROM questions WHERE 1=1';
    const params: (string | number)[] = [];

    if (subject) {
      query += ' AND subject_id = ?';
      params.push(subject);
    }
    if (topic) {
      query += ' AND topic_id = ?';
      params.push(topic);
    }
    if (difficulty) {
      query += ' AND difficulty = ?';
      params.push(difficulty);
    }
    if (round) {
      query += ' AND round_type = ?';
      params.push(round);
    }

    query += ' ORDER BY RANDOM() LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const stmt = c.env.DB.prepare(query).bind(...params);
    const { results } = await stmt.all();

    // Parse options JSON
    const questions = results.map((q: Record<string, unknown>) => ({
      ...q,
      options: q.options ? JSON.parse(q.options as string) : null,
    }));

    return c.json({ success: true, data: questions });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch questions' }, 500);
  }
});

publicApp.get('/questions/:id', async (c) => {
  const id = c.req.param('id');

  try {
    const question = await c.env.DB.prepare(`
      SELECT * FROM questions WHERE id = ?
    `).bind(id).first();

    if (!question) {
      return c.json({ success: false, error: 'Question not found' }, 404);
    }

    return c.json({
      success: true,
      data: {
        ...question,
        options: question.options ? JSON.parse(question.options as string) : null,
      },
    });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch question' }, 500);
  }
});

// Riddles
publicApp.get('/riddles', async (c) => {
  const subject = c.req.query('subject');

  try {
    let query = 'SELECT * FROM riddles';
    const params: string[] = [];

    if (subject) {
      query += ' WHERE subject_id = ?';
      params.push(subject);
    }

    const stmt = params.length > 0
      ? c.env.DB.prepare(query).bind(...params)
      : c.env.DB.prepare(query);

    const { results } = await stmt.all();

    // Format riddles with clues array
    const riddles = results.map((r: Record<string, unknown>) => ({
      id: r.id,
      subjectId: r.subject_id,
      answer: r.answer,
      clues: [r.clue_1, r.clue_2, r.clue_3, r.clue_4, r.clue_5].filter(Boolean),
      difficulty: r.difficulty,
    }));

    return c.json({ success: true, data: riddles });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch riddles' }, 500);
  }
});

// Achievements
publicApp.get('/achievements', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT * FROM achievements
    `).all();

    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch achievements' }, 500);
  }
});

// Leaderboard
publicApp.get('/leaderboard', async (c) => {
  const period = c.req.query('period') || 'weekly';

  try {
    const { results } = await c.env.DB.prepare(`
      SELECT l.*, u.name as user_name, u.avatar_url as user_avatar, u.house
      FROM leaderboard l
      JOIN users u ON l.user_id = u.id
      WHERE l.period = ?
      ORDER BY l.score DESC
      LIMIT 100
    `).bind(period).all();

    return c.json({ success: true, data: { entries: results, period } });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch leaderboard' }, 500);
  }
});

// =====================
// HOUSE CUP ENDPOINTS
// =====================

// Get all houses
publicApp.get('/houses', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT h.*,
        (SELECT COUNT(*) FROM users WHERE house = h.id) as member_count,
        COALESCE((SELECT SUM(points) FROM house_points WHERE house_id = h.id), 0) as total_points
      FROM houses h
      ORDER BY is_default DESC, name ASC
    `).all();

    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch houses' }, 500);
  }
});

// Get house by ID
publicApp.get('/houses/:id', async (c) => {
  const id = c.req.param('id');

  try {
    const house = await c.env.DB.prepare(`
      SELECT h.*,
        (SELECT COUNT(*) FROM users WHERE house = h.id) as member_count,
        COALESCE((SELECT SUM(points) FROM house_points WHERE house_id = h.id), 0) as total_points
      FROM houses h WHERE h.id = ?
    `).bind(id).first();

    if (!house) {
      return c.json({ success: false, error: 'House not found' }, 404);
    }

    return c.json({ success: true, data: house });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch house' }, 500);
  }
});

// Get house standings
publicApp.get('/houses/standings', async (c) => {
  const period = c.req.query('period') || 'all_time';

  try {
    const { results } = await c.env.DB.prepare(`
      SELECT
        h.id as house_id,
        h.name as house_name,
        h.color as house_color,
        h.icon,
        (SELECT COUNT(*) FROM users WHERE house = h.id) as member_count,
        COALESCE((SELECT SUM(points) FROM house_points WHERE house_id = h.id), 0) as total_points
      FROM houses h
      WHERE h.is_default = 1
      ORDER BY total_points DESC
    `).all();

    // Add rankings
    const standings = results.map((h: Record<string, unknown>, index: number) => ({
      ...h,
      rank: index + 1,
      period,
    }));

    return c.json({ success: true, data: standings });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch standings' }, 500);
  }
});

// Get house members
publicApp.get('/houses/:id/members', async (c) => {
  const id = c.req.param('id');
  const limit = parseInt(c.req.query('limit') || '20');

  try {
    const { results } = await c.env.DB.prepare(`
      SELECT u.id, u.name, u.avatar_url, u.xp_points, u.level,
        COALESCE((SELECT SUM(points) FROM house_points WHERE user_id = u.id AND house_id = ?), 0) as house_contribution
      FROM users u
      WHERE u.house = ?
      ORDER BY house_contribution DESC
      LIMIT ?
    `).bind(id, id, limit).all();

    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch members' }, 500);
  }
});

// Get recent house activity
publicApp.get('/houses/activity', async (c) => {
  const limit = parseInt(c.req.query('limit') || '20');

  try {
    const { results } = await c.env.DB.prepare(`
      SELECT hp.*, u.name as user_name, h.name as house_name, h.color as house_color
      FROM house_points hp
      JOIN users u ON hp.user_id = u.id
      JOIN houses h ON hp.house_id = h.id
      ORDER BY hp.created_at DESC
      LIMIT ?
    `).bind(limit).all();

    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch activity' }, 500);
  }
});

// =====================
// BATTLE ENDPOINTS
// =====================

// Get available battles to join
publicApp.get('/battles/available', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT b.*,
        u.name as challenger_name, u.avatar_url as challenger_avatar,
        s.name as subject_name
      FROM battles b
      JOIN users u ON b.challenger_id = u.id
      LEFT JOIN subjects s ON b.subject_id = s.id
      WHERE b.status = 'waiting'
      ORDER BY b.created_at DESC
      LIMIT 20
    `).all();

    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch battles' }, 500);
  }
});

// Get battle by ID
publicApp.get('/battles/:id', async (c) => {
  const id = c.req.param('id');

  try {
    const battle = await c.env.DB.prepare(`
      SELECT b.*,
        c.name as challenger_name, c.avatar_url as challenger_avatar,
        o.name as opponent_name, o.avatar_url as opponent_avatar,
        s.name as subject_name
      FROM battles b
      JOIN users c ON b.challenger_id = c.id
      LEFT JOIN users o ON b.opponent_id = o.id
      LEFT JOIN subjects s ON b.subject_id = s.id
      WHERE b.id = ?
    `).bind(id).first();

    if (!battle) {
      return c.json({ success: false, error: 'Battle not found' }, 404);
    }

    // Parse questions if present
    const data = {
      ...battle,
      questions: battle.questions ? JSON.parse(battle.questions as string) : [],
    };

    return c.json({ success: true, data });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch battle' }, 500);
  }
});

// Mount public routes
app.route('/api', publicApp);

// Protected routes (would add JWT middleware in production)
const protectedApp = new Hono<{ Bindings: Env }>();

// Submit answer
protectedApp.post('/questions/:id/attempt', async (c) => {
  const questionId = c.req.param('id');
  const { answer, userId } = await c.req.json();

  try {
    // Get the question
    const question = await c.env.DB.prepare(`
      SELECT * FROM questions WHERE id = ?
    `).bind(questionId).first();

    if (!question) {
      return c.json({ success: false, error: 'Question not found' }, 404);
    }

    const isCorrect = answer.toLowerCase().trim() ===
                      (question.correct_answer as string).toLowerCase().trim();
    const pointsEarned = isCorrect ? (question.points as number) : 0;

    // Record the attempt
    const attemptId = `attempt_${Date.now()}`;
    await c.env.DB.prepare(`
      INSERT INTO question_attempts (id, user_id, question_id, user_answer, is_correct, time_taken, points_earned)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(attemptId, userId, questionId, answer, isCorrect ? 1 : 0, 0, pointsEarned).run();

    return c.json({
      success: true,
      data: {
        isCorrect,
        correctAnswer: question.correct_answer,
        explanation: question.explanation,
        pointsEarned,
      },
    });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to submit answer' }, 500);
  }
});

// Get user progress
protectedApp.get('/progress', async (c) => {
  const userId = c.req.query('userId') || 'user_demo';

  try {
    const { results: progress } = await c.env.DB.prepare(`
      SELECT * FROM user_progress WHERE user_id = ?
    `).bind(userId).all();

    const user = await c.env.DB.prepare(`
      SELECT xp_points, level, streak_days FROM users WHERE id = ?
    `).bind(userId).first();

    const { results: attempts } = await c.env.DB.prepare(`
      SELECT COUNT(*) as total, SUM(is_correct) as correct
      FROM question_attempts WHERE user_id = ?
    `).bind(userId).all();

    const stats = attempts[0] as { total: number; correct: number };

    return c.json({
      success: true,
      data: {
        topicProgress: progress,
        totalAttempted: stats?.total || 0,
        totalCorrect: stats?.correct || 0,
        accuracy: stats?.total ? Math.round((stats.correct / stats.total) * 100) : 0,
        xp: user?.xp_points || 0,
        level: user?.level || 1,
        streak: user?.streak_days || 0,
      },
    });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch progress' }, 500);
  }
});

// =====================
// HOUSE CUP PROTECTED ENDPOINTS
// =====================

// Create custom house (admin only)
protectedApp.post('/houses', async (c) => {
  const { name, color, icon, description, schoolId, userId } = await c.req.json();

  // In production, verify user is admin
  try {
    const user = await c.env.DB.prepare(`
      SELECT role FROM users WHERE id = ?
    `).bind(userId).first();

    if (!user || user.role !== 'admin') {
      return c.json({ success: false, error: 'Admin access required' }, 403);
    }

    const id = `house_${Date.now()}`;
    await c.env.DB.prepare(`
      INSERT INTO houses (id, name, color, icon, description, is_default, school_id)
      VALUES (?, ?, ?, ?, ?, 0, ?)
    `).bind(id, name, color, icon || 'shield', description || null, schoolId || null).run();

    return c.json({ success: true, data: { id, name, color, icon: icon || 'shield', description, isDefault: false, schoolId } });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to create house' }, 500);
  }
});

// Award house points
protectedApp.post('/houses/points', async (c) => {
  const { houseId, userId, points, source, sourceId } = await c.req.json();

  try {
    // Get current period (YYYY-WW format for weekly)
    const now = new Date();
    const weekNum = Math.ceil((now.getDate() - now.getDay() + 1) / 7);
    const period = `${now.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;

    const id = `hp_${Date.now()}`;
    await c.env.DB.prepare(`
      INSERT INTO house_points (id, house_id, user_id, points, source, source_id, period)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(id, houseId, userId, points, source, sourceId || null, period).run();

    return c.json({ success: true, data: { id, houseId, userId, points, source, period } });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to award points' }, 500);
  }
});

// Update user's house
protectedApp.put('/users/:id/house', async (c) => {
  const id = c.req.param('id');
  const { houseId } = await c.req.json();

  try {
    await c.env.DB.prepare(`
      UPDATE users SET house = ?, updated_at = datetime('now') WHERE id = ?
    `).bind(houseId, id).run();

    return c.json({ success: true, data: { userId: id, houseId } });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to update house' }, 500);
  }
});

// =====================
// BATTLE PROTECTED ENDPOINTS
// =====================

// Create a new battle (challenge)
protectedApp.post('/battles', async (c) => {
  const { userId, subjectId, difficulty, questionCount } = await c.req.json();

  try {
    // Fetch random questions for the battle
    let questionsQuery = `
      SELECT * FROM questions
      WHERE question_type IN ('multiple_choice', 'direct_answer')
    `;
    const params: (string | number)[] = [];

    if (subjectId) {
      questionsQuery += ' AND subject_id = ?';
      params.push(subjectId);
    }
    if (difficulty) {
      questionsQuery += ' AND difficulty = ?';
      params.push(difficulty);
    }

    questionsQuery += ` ORDER BY RANDOM() LIMIT ?`;
    params.push(questionCount || 10);

    const { results: questions } = await c.env.DB.prepare(questionsQuery).bind(...params).all();

    // Parse options for each question
    const parsedQuestions = questions.map((q: Record<string, unknown>) => ({
      ...q,
      options: q.options ? JSON.parse(q.options as string) : null,
    }));

    const battleId = `battle_${Date.now()}`;
    await c.env.DB.prepare(`
      INSERT INTO battles (id, challenger_id, subject_id, difficulty, question_count, questions, status)
      VALUES (?, ?, ?, ?, ?, ?, 'waiting')
    `).bind(
      battleId,
      userId,
      subjectId || null,
      difficulty || 'medium',
      questionCount || 10,
      JSON.stringify(parsedQuestions)
    ).run();

    // Get challenger info
    const challenger = await c.env.DB.prepare(`
      SELECT name, avatar_url FROM users WHERE id = ?
    `).bind(userId).first();

    return c.json({
      success: true,
      data: {
        id: battleId,
        challengerId: userId,
        challengerName: challenger?.name,
        challengerAvatar: challenger?.avatar_url,
        subjectId,
        difficulty: difficulty || 'medium',
        questionCount: questionCount || 10,
        status: 'waiting',
        challengerScore: 0,
        opponentScore: 0,
        currentQuestion: 0,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to create battle' }, 500);
  }
});

// Join a battle
protectedApp.post('/battles/:id/join', async (c) => {
  const battleId = c.req.param('id');
  const { userId } = await c.req.json();

  try {
    // Check if battle exists and is waiting
    const battle = await c.env.DB.prepare(`
      SELECT * FROM battles WHERE id = ? AND status = 'waiting'
    `).bind(battleId).first();

    if (!battle) {
      return c.json({ success: false, error: 'Battle not found or already started' }, 404);
    }

    // Can't join own battle
    if (battle.challenger_id === userId) {
      return c.json({ success: false, error: 'Cannot join your own battle' }, 400);
    }

    // Update battle with opponent and start
    await c.env.DB.prepare(`
      UPDATE battles SET
        opponent_id = ?,
        status = 'active',
        started_at = datetime('now')
      WHERE id = ?
    `).bind(userId, battleId).run();

    // Get opponent info
    const opponent = await c.env.DB.prepare(`
      SELECT name, avatar_url FROM users WHERE id = ?
    `).bind(userId).first();

    return c.json({
      success: true,
      data: {
        battleId,
        opponentId: userId,
        opponentName: opponent?.name,
        opponentAvatar: opponent?.avatar_url,
        status: 'active',
        startedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to join battle' }, 500);
  }
});

// Submit answer in battle
protectedApp.post('/battles/:id/answer', async (c) => {
  const battleId = c.req.param('id');
  const { userId, questionIndex, answer, timeTaken } = await c.req.json();

  try {
    // Get battle
    const battle = await c.env.DB.prepare(`
      SELECT * FROM battles WHERE id = ? AND status = 'active'
    `).bind(battleId).first();

    if (!battle) {
      return c.json({ success: false, error: 'Battle not found or not active' }, 404);
    }

    // Verify user is part of battle
    if (battle.challenger_id !== userId && battle.opponent_id !== userId) {
      return c.json({ success: false, error: 'Not a participant in this battle' }, 403);
    }

    // Get question from battle questions
    const questions = JSON.parse(battle.questions as string);
    const question = questions[questionIndex];

    if (!question) {
      return c.json({ success: false, error: 'Invalid question index' }, 400);
    }

    // Check if already answered
    const existing = await c.env.DB.prepare(`
      SELECT id FROM battle_answers WHERE battle_id = ? AND user_id = ? AND question_index = ?
    `).bind(battleId, userId, questionIndex).first();

    if (existing) {
      return c.json({ success: false, error: 'Already answered this question' }, 400);
    }

    // Check answer
    const isCorrect = answer.toLowerCase().trim() === question.correct_answer.toLowerCase().trim();
    const pointsEarned = isCorrect ? (question.points || 3) : 0;

    // Record answer
    const answerId = `ba_${Date.now()}_${userId}`;
    await c.env.DB.prepare(`
      INSERT INTO battle_answers (id, battle_id, user_id, question_index, answer, is_correct, time_taken, points_earned)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(answerId, battleId, userId, questionIndex, answer, isCorrect ? 1 : 0, timeTaken || 0, pointsEarned).run();

    // Update score
    const scoreField = userId === battle.challenger_id ? 'challenger_score' : 'opponent_score';
    await c.env.DB.prepare(`
      UPDATE battles SET ${scoreField} = ${scoreField} + ? WHERE id = ?
    `).bind(pointsEarned, battleId).run();

    // Check if battle is complete (both answered all questions)
    const { results: answerCounts } = await c.env.DB.prepare(`
      SELECT user_id, COUNT(*) as count FROM battle_answers WHERE battle_id = ? GROUP BY user_id
    `).bind(battleId).all();

    const totalQuestions = questions.length;
    const bothComplete = answerCounts.length === 2 &&
      answerCounts.every((ac: Record<string, unknown>) => (ac.count as number) >= totalQuestions);

    if (bothComplete) {
      // Get final scores
      const updatedBattle = await c.env.DB.prepare(`
        SELECT challenger_score, opponent_score, challenger_id, opponent_id FROM battles WHERE id = ?
      `).bind(battleId).first();

      const winnerId = updatedBattle!.challenger_score > updatedBattle!.opponent_score
        ? updatedBattle!.challenger_id
        : updatedBattle!.opponent_score > updatedBattle!.challenger_score
          ? updatedBattle!.opponent_id
          : null; // Tie

      await c.env.DB.prepare(`
        UPDATE battles SET status = 'completed', winner_id = ?, completed_at = datetime('now') WHERE id = ?
      `).bind(winnerId, battleId).run();
    }

    return c.json({
      success: true,
      data: {
        isCorrect,
        correctAnswer: question.correct_answer,
        explanation: question.explanation,
        pointsEarned,
        battleComplete: bothComplete,
      },
    });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to submit answer' }, 500);
  }
});

// Cancel/forfeit battle
protectedApp.post('/battles/:id/cancel', async (c) => {
  const battleId = c.req.param('id');
  const { userId } = await c.req.json();

  try {
    const battle = await c.env.DB.prepare(`
      SELECT * FROM battles WHERE id = ? AND status IN ('waiting', 'active')
    `).bind(battleId).first();

    if (!battle) {
      return c.json({ success: false, error: 'Battle not found or already finished' }, 404);
    }

    // Verify user is part of battle
    if (battle.challenger_id !== userId && battle.opponent_id !== userId) {
      return c.json({ success: false, error: 'Not a participant in this battle' }, 403);
    }

    // If battle was active, the other player wins
    let winnerId = null;
    if (battle.status === 'active') {
      winnerId = battle.challenger_id === userId ? battle.opponent_id : battle.challenger_id;
    }

    await c.env.DB.prepare(`
      UPDATE battles SET status = 'cancelled', winner_id = ?, completed_at = datetime('now') WHERE id = ?
    `).bind(winnerId, battleId).run();

    return c.json({ success: true, data: { battleId, status: 'cancelled', winnerId } });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to cancel battle' }, 500);
  }
});

// Get user's battle history
protectedApp.get('/battles/history', async (c) => {
  const userId = c.req.query('userId');
  const limit = parseInt(c.req.query('limit') || '20');

  if (!userId) {
    return c.json({ success: false, error: 'userId required' }, 400);
  }

  try {
    const { results } = await c.env.DB.prepare(`
      SELECT b.*,
        c.name as challenger_name, c.avatar_url as challenger_avatar,
        o.name as opponent_name, o.avatar_url as opponent_avatar,
        s.name as subject_name
      FROM battles b
      JOIN users c ON b.challenger_id = c.id
      LEFT JOIN users o ON b.opponent_id = o.id
      LEFT JOIN subjects s ON b.subject_id = s.id
      WHERE b.challenger_id = ? OR b.opponent_id = ?
      ORDER BY b.created_at DESC
      LIMIT ?
    `).bind(userId, userId, limit).all();

    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch battle history' }, 500);
  }
});

// Mount protected routes
app.route('/api', protectedApp);

// =====================
// AI TUTOR ENDPOINTS
// =====================

// AI explain question/answer
protectedApp.post('/ai/explain', async (c) => {
  const { question, userAnswer, correctAnswer, isCorrect, userId } = await c.req.json();
  const apiKey = c.env.ANTHROPIC_API_KEY;
  const model = c.env.AI_MODEL || 'claude-3-haiku-20240307';

  try {
    const systemPrompt = `You are Brilla AI, a helpful NSMQ (National Science & Maths Quiz) tutor for Ghanaian high school students.
You specialize in Mathematics, Physics, Chemistry, and Biology.
Be concise (2-3 paragraphs max), encouraging, and focus on helping students understand concepts.`;

    const userPrompt = `Question: ${question}
${userAnswer ? `Student's Answer: ${userAnswer}` : ''}
Correct Answer: ${correctAnswer}
${isCorrect !== undefined ? `Result: ${isCorrect ? 'Correct' : 'Incorrect'}` : ''}

Please explain:
1. The correct answer and why it's correct
2. ${!isCorrect && userAnswer ? "Why the student's answer was incorrect" : 'Key concepts to remember'}
3. A helpful tip or memory trick for similar questions`;

    let explanation: string;
    let provider: string;

    if (apiKey) {
      // Use Claude API
      explanation = await callClaudeAPI(apiKey, model, systemPrompt, userPrompt);
      provider = 'anthropic';
    } else {
      // Fallback to mock response
      explanation = generateMockExplanation(question, correctAnswer, isCorrect, userAnswer);
      provider = 'mock';
    }

    return c.json({
      success: true,
      data: { explanation, provider },
    });
  } catch (error) {
    console.error('AI explain error:', error);
    // Fallback to mock on error
    const mockResponse = generateMockExplanation(question, correctAnswer, isCorrect, userAnswer);
    return c.json({
      success: true,
      data: { explanation: mockResponse, provider: 'mock' },
    });
  }
});

// AI chat
protectedApp.post('/ai/chat', async (c) => {
  const { message, context, conversationHistory, userId } = await c.req.json();
  const apiKey = c.env.ANTHROPIC_API_KEY;
  const model = c.env.AI_MODEL || 'claude-3-haiku-20240307';

  try {
    const systemPrompt = `You are Brilla AI, a helpful NSMQ (National Science & Maths Quiz) tutor for Ghanaian high school students.
You specialize in Mathematics, Physics, Chemistry, and Biology.
Be concise (keep responses under 200 words), encouraging, and focus on helping students understand concepts.
Use markdown formatting for clarity when explaining formulas or concepts.
${context ? `Current context: ${context}` : ''}`;

    let response: string;
    let provider: string;

    if (apiKey) {
      // Use Claude API
      response = await callClaudeAPI(apiKey, model, systemPrompt, message);
      provider = 'anthropic';
    } else {
      // Fallback to mock response
      response = generateMockChatResponse(message, context);
      provider = 'mock';
    }

    return c.json({
      success: true,
      data: { message: response, provider },
    });
  } catch (error) {
    console.error('AI chat error:', error);
    // Fallback to mock on error
    const mockResponse = generateMockChatResponse(message, context);
    return c.json({
      success: true,
      data: { message: mockResponse, provider: 'mock' },
    });
  }
});

// AI hint for current question
protectedApp.post('/ai/hint', async (c) => {
  const { question, hintLevel, userId } = await c.req.json();

  try {
    // hintLevel: 1 = subtle hint, 2 = moderate hint, 3 = strong hint
    const mockHint = generateMockHint(question, hintLevel || 1);

    return c.json({
      success: true,
      data: {
        hint: mockHint,
        hintLevel: hintLevel || 1,
        provider: 'mock',
      },
    });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to generate hint' }, 500);
  }
});

// AI study plan generation
protectedApp.post('/ai/study-plan', async (c) => {
  const { userId, weakTopics, strongTopics, targetDate } = await c.req.json();

  try {
    const mockPlan = {
      overview: "Based on your performance, here's a personalized study plan to maximize your NSMQ readiness.",
      dailyGoals: [
        "Practice 20 questions across all subjects",
        "Focus 40% of time on weak topics",
        "Review 5 formula cards daily",
        "Complete 1 speed drill session"
      ],
      weeklyFocus: weakTopics?.slice(0, 3) || ['Calculus', 'Thermodynamics', 'Organic Chemistry'],
      recommendations: [
        "Start each session with your weakest topic when your mind is fresh",
        "Use spaced repetition for formula memorization",
        "Practice under timed conditions to improve speed"
      ],
      estimatedReadiness: 75,
    };

    return c.json({
      success: true,
      data: mockPlan,
    });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to generate study plan' }, 500);
  }
});

// Helper functions for mock responses
function generateMockExplanation(question: string, correctAnswer: string, isCorrect?: boolean, userAnswer?: string): string {
  if (isCorrect) {
    return `Excellent work! You correctly identified that the answer is "${correctAnswer}".

This question tests your understanding of fundamental concepts. Your answer demonstrates good grasp of the material.

Tip: Keep practicing similar questions to reinforce this knowledge and improve your speed for the competition!`;
  }

  return `The correct answer is "${correctAnswer}".

${userAnswer ? `Your answer "${userAnswer}" was close, but ` : ''}Let me explain the key concept here. This type of question requires understanding the underlying principles and applying them systematically.

Pro tip: When facing similar questions, try breaking down the problem into smaller steps and verify each step before moving to the next. Practice makes perfect!`;
}

function generateMockChatResponse(message: string, context?: string): string {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('help') || lowerMessage.includes('explain')) {
    return "I'd be happy to help! Could you please share the specific topic or question you'd like me to explain? I can break down concepts in Mathematics, Physics, Chemistry, or Biology.";
  }

  if (lowerMessage.includes('formula') || lowerMessage.includes('equation')) {
    return "Formulas are essential for NSMQ! Here are some tips for memorizing them:\n\n1. Understand what each variable represents\n2. Practice deriving simpler formulas from first principles\n3. Create flashcards and review daily\n4. Apply formulas in practice problems\n\nWhich specific formula would you like me to explain?";
  }

  if (lowerMessage.includes('tip') || lowerMessage.includes('advice')) {
    return "Here are my top NSMQ preparation tips:\n\n1. **Practice daily** - Even 30 minutes helps\n2. **Focus on weak areas** - Use analytics to identify gaps\n3. **Speed drills** - Time yourself regularly\n4. **Study with peers** - Use 1v1 battles to test yourself\n5. **Stay curious** - Understanding 'why' helps more than memorizing\n\nWhat specific area would you like advice on?";
  }

  return "That's a great question! I'm here to help you prepare for NSMQ. Feel free to ask me about:\n\n- Specific topics in Maths, Physics, Chemistry, or Biology\n- Formula explanations and derivations\n- Study tips and strategies\n- Help understanding your wrong answers\n\nWhat would you like to explore?";
}

function generateMockHint(question: string, level: number): string {
  const hints = [
    "Think about the fundamental concepts involved in this question. What principles might apply?",
    "Consider breaking down the problem into smaller parts. What information do you already have?",
    "The answer involves applying a key formula or concept. Think about what you've learned recently about this topic."
  ];

  return hints[Math.min(level - 1, hints.length - 1)];
}

// 404 handler
app.notFound((c) => {
  return c.json({ success: false, error: 'Not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({ success: false, error: 'Internal server error' }, 500);
});

export default app;
