import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';

// Types for Cloudflare bindings
interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  JWT_SECRET: string;
  ENVIRONMENT: string;
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

// Mount protected routes
app.route('/api', protectedApp);

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
