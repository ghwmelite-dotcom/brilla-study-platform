import { Hono } from 'hono';
import { requireAuth } from './auth-middleware';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

interface UserPayload {
  userId: string;
  email: string;
  role: string;
}

const engagementApp = new Hono<{ Bindings: Env; Variables: { user: UserPayload } }>();

// All engagement routes require a verified JWT (sets user on context).
engagementApp.use('*', requireAuth);

const generateId = () => `eng_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

// Comeback challenge templates
const comebackTemplates = [
  {
    title: 'Welcome Back Champion!',
    description: 'Complete these quick tasks to get back on track.',
    tasks: [
      { id: 'task_1', title: 'Answer 5 Questions', description: 'Practice any subject', target: 5, xpReward: 50 },
      { id: 'task_2', title: 'Start a Streak', description: 'Begin your learning streak', target: 1, xpReward: 25 },
      { id: 'task_3', title: 'Play Quick Play', description: 'Complete a Speed Blitz', target: 1, xpReward: 75 },
    ],
    xpReward: 250,
  },
  {
    title: 'The Comeback Kid',
    description: 'You\'ve been missed! Show us you\'ve still got it.',
    tasks: [
      { id: 'task_1', title: 'Score 80%+', description: 'Get at least 80% on any quiz', target: 1, xpReward: 75 },
      { id: 'task_2', title: 'Study 2 Subjects', description: 'Practice two different subjects', target: 2, xpReward: 50 },
      { id: 'task_3', title: 'Answer 10 Questions', description: 'Complete 10 practice questions', target: 10, xpReward: 75 },
    ],
    xpReward: 350,
  },
];

// =============================================
// ENGAGEMENT ENDPOINTS
// =============================================

// Get engagement status
engagementApp.get('/status', async (c) => {
  try {
    const user = c.get('user');

    // Get or create engagement metrics
    let metrics = await c.env.DB.prepare(
      'SELECT * FROM user_engagement_metrics WHERE user_id = ?'
    ).bind(user.userId).first();

    if (!metrics) {
      await c.env.DB.prepare(`
        INSERT INTO user_engagement_metrics (id, user_id)
        VALUES (?, ?)
      `).bind(generateId(), user.userId).run();

      metrics = await c.env.DB.prepare(
        'SELECT * FROM user_engagement_metrics WHERE user_id = ?'
      ).bind(user.userId).first();
    }

    // Get user's streak info
    const userData = await c.env.DB.prepare(
      'SELECT streak_days, streak_last_activity FROM users WHERE id = ?'
    ).bind(user.userId).first();

    // Calculate streak at risk
    let streakAtRisk = false;
    let hoursUntilStreakLoss = null;

    if (userData?.streak_days && userData.streak_days > 0 && userData.streak_last_activity) {
      const lastActivity = new Date(userData.streak_last_activity as string);
      const now = new Date();
      const hoursSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);

      if (hoursSinceActivity > 20) {
        streakAtRisk = true;
        hoursUntilStreakLoss = Math.max(0, 24 - hoursSinceActivity);
      }
    }

    // Get pending nudges (ISO comparison against bound JS ISO now)
    const nowIso = new Date().toISOString();
    const nudges = await c.env.DB.prepare(`
      SELECT * FROM engagement_nudges
      WHERE user_id = ? AND dismissed = 0
        AND (expires_at IS NULL OR expires_at > ?)
      ORDER BY
        CASE priority
          WHEN 'urgent' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          ELSE 4
        END,
        created_at DESC
      LIMIT 5
    `).bind(user.userId, nowIso).all();

    // Get active comeback challenge
    const comebackChallenge = await c.env.DB.prepare(
      'SELECT * FROM comeback_challenges WHERE user_id = ? AND status = \'active\''
    ).bind(user.userId).first();

    let challengeData = null;
    if (comebackChallenge) {
      const taskProgress = await c.env.DB.prepare(
        'SELECT * FROM comeback_task_progress WHERE challenge_id = ?'
      ).bind(comebackChallenge.id).all();

      challengeData = {
        id: comebackChallenge.id,
        title: comebackChallenge.title,
        description: comebackChallenge.description,
        xpReward: comebackChallenge.xp_reward,
        expiresAt: comebackChallenge.expires_at,
        tasks: JSON.parse(comebackChallenge.tasks as string).map((task: any) => {
          const progress = taskProgress.results.find((p: any) => p.task_id === task.id);
          return {
            ...task,
            progress: progress?.progress || 0,
            completed: !!progress?.completed,
          };
        }),
      };
    }

    return c.json({
      success: true,
      data: {
        streak: userData?.streak_days || 0,
        streakAtRisk,
        hoursUntilStreakLoss: hoursUntilStreakLoss ? Math.round(hoursUntilStreakLoss * 10) / 10 : null,
        daysInactive: metrics?.days_since_last_activity || 0,
        engagementScore: metrics?.engagement_score || 100,
        riskLevel: metrics?.risk_level || 'low',
        comebackChallenge: challengeData,
        nudges: nudges.results.map((n: any) => ({
          id: n.id,
          type: n.nudge_type,
          title: n.title,
          message: n.message,
          actionLabel: n.action_label,
          actionLink: n.action_link,
          priority: n.priority,
          createdAt: n.created_at,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching engagement status:', error);
    return c.json({ success: false, error: 'Failed to fetch status' }, 500);
  }
});

// Check for comeback challenge (called on login after inactivity)
engagementApp.post('/check-comeback', async (c) => {
  try {
    const user = c.get('user');

    // Get engagement metrics
    const metrics = await c.env.DB.prepare(
      'SELECT * FROM user_engagement_metrics WHERE user_id = ?'
    ).bind(user.userId).first();

    // Check for existing active challenge
    const existingChallenge = await c.env.DB.prepare(
      'SELECT id FROM comeback_challenges WHERE user_id = ? AND status IN (\'pending\', \'active\')'
    ).bind(user.userId).first();

    if (existingChallenge) {
      return c.json({
        success: true,
        data: { hasComebackChallenge: true, isNew: false },
      });
    }

    // Check if user qualifies for comeback challenge (3+ days inactive)
    const daysInactive = metrics?.days_since_last_activity || 0;
    if (daysInactive < 3) {
      return c.json({
        success: true,
        data: { hasComebackChallenge: false },
      });
    }

    // Create comeback challenge
    const template = comebackTemplates[Math.floor(Math.random() * comebackTemplates.length)];
    const challengeId = generateId();
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(); // 48 hours

    await c.env.DB.prepare(`
      INSERT INTO comeback_challenges (id, user_id, title, description, xp_reward, tasks, days_inactive, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      challengeId,
      user.userId,
      template.title,
      template.description,
      template.xpReward,
      JSON.stringify(template.tasks),
      daysInactive,
      expiresAt
    ).run();

    // Create task progress entries
    for (const task of template.tasks) {
      await c.env.DB.prepare(`
        INSERT INTO comeback_task_progress (id, challenge_id, task_id, target)
        VALUES (?, ?, ?, ?)
      `).bind(generateId(), challengeId, task.id, task.target).run();
    }

    return c.json({
      success: true,
      data: {
        hasComebackChallenge: true,
        isNew: true,
        challenge: {
          id: challengeId,
          title: template.title,
          description: template.description,
          xpReward: template.xpReward,
          expiresAt,
          tasks: template.tasks.map(t => ({ ...t, progress: 0, completed: false })),
        },
      },
    });
  } catch (error) {
    console.error('Error checking comeback:', error);
    return c.json({ success: false, error: 'Failed to check comeback' }, 500);
  }
});

// Accept comeback challenge
engagementApp.post('/comeback/accept', async (c) => {
  try {
    const user = c.get('user');

    const challenge = await c.env.DB.prepare(
      'SELECT * FROM comeback_challenges WHERE user_id = ? AND status = \'pending\''
    ).bind(user.userId).first();

    if (!challenge) {
      return c.json({ success: false, error: 'No pending challenge' }, 404);
    }

    await c.env.DB.prepare(`
      UPDATE comeback_challenges
      SET status = 'active', accepted_at = datetime('now')
      WHERE id = ?
    `).bind(challenge.id).run();

    return c.json({
      success: true,
      data: { accepted: true },
    });
  } catch (error) {
    console.error('Error accepting challenge:', error);
    return c.json({ success: false, error: 'Failed to accept challenge' }, 500);
  }
});

// Update comeback task progress
engagementApp.post('/comeback/progress', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const { taskId, progressIncrement = 1 } = body;

    const challenge = await c.env.DB.prepare(
      'SELECT * FROM comeback_challenges WHERE user_id = ? AND status = \'active\''
    ).bind(user.userId).first();

    if (!challenge) {
      return c.json({ success: false, error: 'No active challenge' }, 404);
    }

    // Update task progress
    await c.env.DB.prepare(`
      UPDATE comeback_task_progress
      SET progress = MIN(progress + ?, target),
          completed = CASE WHEN progress + ? >= target THEN 1 ELSE 0 END,
          completed_at = CASE WHEN progress + ? >= target AND completed = 0 THEN datetime('now') ELSE completed_at END
      WHERE challenge_id = ? AND task_id = ?
    `).bind(progressIncrement, progressIncrement, progressIncrement, challenge.id, taskId).run();

    // Check if all tasks completed
    const taskStatus = await c.env.DB.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed
      FROM comeback_task_progress
      WHERE challenge_id = ?
    `).bind(challenge.id).first();

    const allCompleted = taskStatus?.completed === taskStatus?.total;

    return c.json({
      success: true,
      data: {
        allCompleted,
        tasksCompleted: taskStatus?.completed || 0,
        tasksTotal: taskStatus?.total || 0,
      },
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    return c.json({ success: false, error: 'Failed to update progress' }, 500);
  }
});

// Claim comeback challenge reward
engagementApp.post('/comeback/claim', async (c) => {
  try {
    const user = c.get('user');

    const challenge = await c.env.DB.prepare(
      'SELECT * FROM comeback_challenges WHERE user_id = ? AND status = \'active\''
    ).bind(user.userId).first();

    if (!challenge) {
      return c.json({ success: false, error: 'No active challenge' }, 404);
    }

    // Verify all tasks completed
    const incomplete = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM comeback_task_progress WHERE challenge_id = ? AND completed = 0'
    ).bind(challenge.id).first();

    if ((incomplete?.count as number) > 0) {
      return c.json({ success: false, error: 'Not all tasks completed' }, 400);
    }

    // Award XP
    await c.env.DB.prepare(
      'UPDATE users SET xp_points = xp_points + ? WHERE id = ?'
    ).bind(challenge.xp_reward, user.userId).run();

    // Mark challenge complete
    await c.env.DB.prepare(`
      UPDATE comeback_challenges
      SET status = 'completed', completed_at = datetime('now')
      WHERE id = ?
    `).bind(challenge.id).run();

    // Log activity
    await c.env.DB.prepare(`
      INSERT INTO activity_feed (id, user_id, activity_type, title, description, metadata)
      VALUES (?, ?, 'quest_complete', 'Comeback Challenge Complete!', ?, ?)
    `).bind(
      generateId(),
      user.userId,
      `Earned ${challenge.xp_reward} XP`,
      JSON.stringify({ challengeId: challenge.id, xpEarned: challenge.xp_reward })
    ).run();

    return c.json({
      success: true,
      data: {
        xpEarned: challenge.xp_reward,
      },
    });
  } catch (error) {
    console.error('Error claiming reward:', error);
    return c.json({ success: false, error: 'Failed to claim reward' }, 500);
  }
});

// Dismiss a nudge
engagementApp.post('/nudges/:nudgeId/dismiss', async (c) => {
  try {
    const user = c.get('user');
    const nudgeId = c.req.param('nudgeId');

    await c.env.DB.prepare(`
      UPDATE engagement_nudges
      SET dismissed = 1, dismissed_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `).bind(nudgeId, user.userId).run();

    return c.json({
      success: true,
      data: { dismissed: true },
    });
  } catch (error) {
    console.error('Error dismissing nudge:', error);
    return c.json({ success: false, error: 'Failed to dismiss nudge' }, 500);
  }
});

// Create a nudge (internal use)
engagementApp.post('/nudges/create', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const { nudgeType, title, message, actionLabel, actionLink, priority = 'medium', expiresIn } = body;

    const nudgeId = generateId();
    const expiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 60 * 60 * 1000).toISOString()
      : null;

    await c.env.DB.prepare(`
      INSERT INTO engagement_nudges (id, user_id, nudge_type, title, message, action_label, action_link, priority, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      nudgeId,
      user.userId,
      nudgeType,
      title,
      message,
      actionLabel || null,
      actionLink || null,
      priority,
      expiresAt
    ).run();

    return c.json({
      success: true,
      data: { nudgeId },
    });
  } catch (error) {
    console.error('Error creating nudge:', error);
    return c.json({ success: false, error: 'Failed to create nudge' }, 500);
  }
});

// Use streak rescue
engagementApp.post('/streak/rescue', async (c) => {
  try {
    const user = c.get('user');

    const userData = await c.env.DB.prepare(
      'SELECT streak, streak_protections FROM users WHERE id = ?'
    ).bind(user.userId).first();

    if (!userData?.streak_protections || (userData.streak_protections as number) < 1) {
      return c.json({ success: false, error: 'No streak protections available' }, 400);
    }

    // Use protection
    await c.env.DB.prepare(`
      UPDATE users
      SET streak_protections = streak_protections - 1,
          streak_last_activity = datetime('now')
      WHERE id = ?
    `).bind(user.userId).run();

    // Log rescue
    await c.env.DB.prepare(`
      INSERT INTO streak_rescues (id, user_id, rescue_type, streak_before, streak_after)
      VALUES (?, ?, 'main', ?, ?)
    `).bind(generateId(), user.userId, userData.streak, userData.streak).run();

    return c.json({
      success: true,
      data: {
        streakSaved: true,
        currentStreak: userData.streak,
        protectionsRemaining: (userData.streak_protections as number) - 1,
      },
    });
  } catch (error) {
    console.error('Error using streak rescue:', error);
    return c.json({ success: false, error: 'Failed to rescue streak' }, 500);
  }
});

// Mark comeback modal as seen
engagementApp.post('/comeback/seen', async (c) => {
  try {
    const user = c.get('user');

    await c.env.DB.prepare(`
      UPDATE user_engagement_metrics
      SET comeback_modal_shown = 1, updated_at = datetime('now')
      WHERE user_id = ?
    `).bind(user.userId).run();

    return c.json({
      success: true,
      data: { marked: true },
    });
  } catch (error) {
    console.error('Error marking modal seen:', error);
    return c.json({ success: false, error: 'Failed to mark seen' }, 500);
  }
});

export { engagementApp };
