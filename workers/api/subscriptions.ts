import { Hono } from 'hono';
import { verify } from 'hono/jwt';

// Types for Cloudflare bindings
interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  APP_URL: string;
}

// Demo user mappings (must match actual database IDs)
const demoUsers: Record<string, { id: string; role: string }> = {
  'student': { id: 'student_1766327981521', role: 'student' },
  'teacher': { id: 'teacher_1766327981453', role: 'teacher' },
  'admin': { id: 'admin_prod_001', role: 'admin' },
};

// Trial task definitions
const TRIAL_TASKS = [
  { id: 'complete_profile', day: 1, name: 'Complete your profile', description: 'Add your school and profile picture', xp: 100 },
  { id: 'answer_questions', day: 2, name: 'Answer 10 questions', description: 'Practice with at least 10 questions', xp: 150 },
  { id: 'join_house', day: 3, name: 'Join a house', description: 'Pick your house and start earning points', xp: 200 },
  { id: 'win_battle', day: 4, name: 'Win a battle', description: 'Challenge someone and win a 1v1 battle', xp: 300 },
  { id: 'try_essay', day: 5, name: 'Try essay grading', description: 'Submit an essay for AI feedback', xp: 250 },
  { id: 'join_community', day: 6, name: 'Join the community', description: 'Send a message in any chat room', xp: 150 },
  { id: 'invite_friend', day: 7, name: 'Invite a friend', description: 'Share your referral link with someone', xp: 500, bonus: true },
  { id: 'complete_quest', day: 8, name: 'Complete a quest', description: 'Finish any daily or weekly quest', xp: 200 },
  { id: 'study_time', day: 9, name: 'Study for 30 mins', description: 'Spend 30 minutes practicing', xp: 250 },
  { id: 'master_topic', day: 10, name: 'Master a topic', description: 'Get 80%+ accuracy on a topic', xp: 400 },
  { id: 'help_community', day: 11, name: 'Help in community', description: 'Answer a question in the community', xp: 200 },
  { id: 'streak_5', day: 12, name: 'Reach 5-day streak', description: 'Study 5 days in a row', xp: 300 },
  { id: 'past_paper', day: 13, name: 'Take a past paper', description: 'Complete a timed past paper', xp: 350 },
  { id: 'subscribe', day: 14, name: 'Subscribe!', description: 'Unlock all features with a subscription', xp: 1000, final: true },
];

// =============================================
// SUBSCRIPTIONS API
// =============================================

export const subscriptionsApp = new Hono<{ Bindings: Env }>();

// Authentication middleware
subscriptionsApp.use('*', async (c, next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'No authorization header' }, 401);
  }

  const token = authHeader.replace('Bearer ', '');

  // Handle demo tokens
  if (token.endsWith('_demo_token')) {
    const tokenPrefix = token.replace('_demo_token', '');
    const demoUser = demoUsers[tokenPrefix];

    if (demoUser) {
      c.set('userId', demoUser.id);
      c.set('userRole', demoUser.role);
      return next();
    }
  }

  // Verify JWT token
  try {
    const payload = await verify(token, c.env.JWT_SECRET);
    c.set('userId', payload.userId as string);
    c.set('userRole', payload.role as string);
    return next();
  } catch (error) {
    console.error('Token verification error:', error);
    return c.json({ success: false, error: 'Invalid token' }, 401);
  }
});

// Get subscription plans
subscriptionsApp.get('/plans', async (c) => {
  try {
    const userId = c.get('userId') as string | undefined;

    // Get user role if authenticated
    let userRole = 'student';
    if (userId) {
      const user = await c.env.DB.prepare(`
        SELECT role FROM users WHERE id = ?
      `).bind(userId).first();
      userRole = (user?.role as string) || 'student';
    }

    const { results } = await c.env.DB.prepare(`
      SELECT
        id,
        name,
        description,
        price_monthly,
        price_yearly,
        features,
        ai_grading_quota,
        is_active
      FROM subscription_tiers
      WHERE is_active = 1
      ORDER BY price_monthly ASC
    `).all();

    // Parse features JSON and filter by user role
    const plans = results
      .map((plan: Record<string, unknown>) => ({
        ...plan,
        features: JSON.parse((plan.features as string) || '[]'),
        userType: (plan.id as string).includes('teacher') ? 'teacher' : 'student',
      }))
      .filter((plan: Record<string, unknown>) => {
        // Free tier for everyone
        if (plan.id === 'tier_free') return true;
        // Show plans matching user role
        return plan.userType === userRole;
      });

    return c.json({ success: true, data: plans });
  } catch (error) {
    console.error('Fetch plans error:', error);
    return c.json({ success: false, error: 'Failed to fetch plans' }, 500);
  }
});

// Get current subscription status
subscriptionsApp.get('/status', async (c) => {
  try {
    const userId = c.get('userId') as string;

    const user = await c.env.DB.prepare(`
      SELECT
        u.subscription_tier_id,
        u.subscription_expires_at,
        u.ai_grading_credits,
        u.trial_started_at,
        u.trial_expires_at,
        st.name as plan_name,
        st.description as plan_description,
        st.features,
        st.ai_grading_quota
      FROM users u
      LEFT JOIN subscription_tiers st ON u.subscription_tier_id = st.id
      WHERE u.id = ?
    `).bind(userId).first();

    if (!user) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    // Check trial status
    const trial = await c.env.DB.prepare(`
      SELECT * FROM user_trials WHERE user_id = ?
    `).bind(userId).first();

    // Calculate subscription status
    const now = new Date();
    let status = 'free';
    let isActive = false;
    let daysRemaining = 0;

    if (user.subscription_expires_at) {
      const expiresAt = new Date(user.subscription_expires_at as string);
      if (expiresAt > now) {
        status = 'active';
        isActive = true;
        daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      } else {
        status = 'expired';
      }
    }

    // Check trial
    let trialInfo = null;
    if (trial) {
      const trialExpires = new Date(trial.expires_at as string);
      const trialDaysRemaining = Math.ceil((trialExpires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      trialInfo = {
        status: trial.status,
        startedAt: trial.started_at,
        expiresAt: trial.expires_at,
        daysRemaining: Math.max(0, trialDaysRemaining),
        tasksCompleted: JSON.parse((trial.tasks_completed as string) || '[]'),
        discountAvailable: trialDaysRemaining > 0 ? (trialDaysRemaining > 7 ? 25 : 15) : 0,
      };

      // If still in active trial and no subscription, user has trial access
      if (trial.status === 'active' && trialDaysRemaining > 0 && status === 'free') {
        status = 'trial';
        isActive = true;
        daysRemaining = trialDaysRemaining;
      }
    }

    return c.json({
      success: true,
      data: {
        status,
        isActive,
        daysRemaining,
        currentPlan: {
          id: user.subscription_tier_id,
          name: user.plan_name,
          description: user.plan_description,
          features: JSON.parse((user.features as string) || '[]'),
        },
        expiresAt: user.subscription_expires_at,
        aiGradingCredits: user.ai_grading_credits,
        aiGradingQuota: user.ai_grading_quota,
        trial: trialInfo,
      },
    });
  } catch (error) {
    console.error('Fetch subscription status error:', error);
    return c.json({ success: false, error: 'Failed to fetch subscription status' }, 500);
  }
});

// Start free trial
subscriptionsApp.post('/trial/start', async (c) => {
  try {
    const userId = c.get('userId') as string;

    // Check if user already has a trial or subscription
    const existing = await c.env.DB.prepare(`
      SELECT
        u.subscription_tier_id,
        u.subscription_expires_at,
        ut.id as trial_id
      FROM users u
      LEFT JOIN user_trials ut ON u.id = ut.user_id
      WHERE u.id = ?
    `).bind(userId).first();

    if (existing?.trial_id) {
      return c.json({ success: false, error: 'You have already used your free trial' }, 400);
    }

    // Check if user has active subscription
    if (existing?.subscription_tier_id && existing.subscription_tier_id !== 'tier_free') {
      const expiresAt = existing.subscription_expires_at ? new Date(existing.subscription_expires_at as string) : null;
      if (expiresAt && expiresAt > new Date()) {
        return c.json({ success: false, error: 'You already have an active subscription' }, 400);
      }
    }

    // Create trial record
    const trialId = crypto.randomUUID();
    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days

    await c.env.DB.prepare(`
      INSERT INTO user_trials (id, user_id, started_at, expires_at, status, tasks_completed)
      VALUES (?, ?, ?, ?, 'active', '[]')
    `).bind(
      trialId,
      userId,
      startedAt.toISOString(),
      expiresAt.toISOString()
    ).run();

    // Update user record
    await c.env.DB.prepare(`
      UPDATE users
      SET trial_started_at = ?, trial_expires_at = ?
      WHERE id = ?
    `).bind(startedAt.toISOString(), expiresAt.toISOString(), userId).run();

    return c.json({
      success: true,
      data: {
        trialId,
        startedAt: startedAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
        daysRemaining: 14,
        tasks: TRIAL_TASKS,
      },
    });
  } catch (error) {
    console.error('Start trial error:', error);
    return c.json({ success: false, error: 'Failed to start trial' }, 500);
  }
});

// Get trial status and tasks
subscriptionsApp.get('/trial/status', async (c) => {
  try {
    const userId = c.get('userId') as string;

    const trial = await c.env.DB.prepare(`
      SELECT * FROM user_trials WHERE user_id = ?
    `).bind(userId).first();

    if (!trial) {
      return c.json({
        success: true,
        data: {
          hasTrialAvailable: true,
          trial: null,
        },
      });
    }

    const now = new Date();
    const expiresAt = new Date(trial.expires_at as string);
    const startedAt = new Date(trial.started_at as string);
    const daysRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const currentDay = Math.min(14, Math.ceil((now.getTime() - startedAt.getTime()) / (1000 * 60 * 60 * 24)));

    const tasksCompleted = JSON.parse((trial.tasks_completed as string) || '[]');

    // Build tasks with completion status
    const tasks = TRIAL_TASKS.map(task => ({
      ...task,
      completed: tasksCompleted.includes(task.id),
      available: task.day <= currentDay,
    }));

    // Calculate early bird discount
    let discountPercent = 0;
    if (trial.status === 'active' && daysRemaining > 0) {
      const daysSinceTrial = Math.ceil((now.getTime() - startedAt.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceTrial <= 7) {
        discountPercent = 25;
      } else if (daysSinceTrial <= 14) {
        discountPercent = 15;
      }
    }

    // Check for extra week bonus (all tasks completed)
    const allTasksCompleted = tasks.every(t => t.completed || t.final);
    const bonusWeekAvailable = allTasksCompleted && trial.status === 'active';

    return c.json({
      success: true,
      data: {
        hasTrialAvailable: false,
        trial: {
          id: trial.id,
          status: trial.status,
          startedAt: trial.started_at,
          expiresAt: trial.expires_at,
          daysRemaining,
          currentDay,
          tasks,
          tasksCompleted: tasksCompleted.length,
          totalTasks: TRIAL_TASKS.length - 1, // Exclude "subscribe" task
          discountPercent,
          bonusWeekAvailable,
        },
      },
    });
  } catch (error) {
    console.error('Fetch trial status error:', error);
    return c.json({ success: false, error: 'Failed to fetch trial status' }, 500);
  }
});

// Complete a trial task
subscriptionsApp.post('/trial/task/:taskId/complete', async (c) => {
  try {
    const userId = c.get('userId') as string;
    const taskId = c.req.param('taskId');

    // Validate task exists
    const task = TRIAL_TASKS.find(t => t.id === taskId);
    if (!task) {
      return c.json({ success: false, error: 'Invalid task' }, 400);
    }

    // Get trial
    const trial = await c.env.DB.prepare(`
      SELECT * FROM user_trials WHERE user_id = ? AND status = 'active'
    `).bind(userId).first();

    if (!trial) {
      return c.json({ success: false, error: 'No active trial found' }, 404);
    }

    // Check if task already completed
    const tasksCompleted = JSON.parse((trial.tasks_completed as string) || '[]');
    if (tasksCompleted.includes(taskId)) {
      return c.json({ success: false, error: 'Task already completed' }, 400);
    }

    // Check if task is available (based on day)
    const startedAt = new Date(trial.started_at as string);
    const currentDay = Math.ceil((Date.now() - startedAt.getTime()) / (1000 * 60 * 60 * 24));
    if (task.day > currentDay) {
      return c.json({ success: false, error: 'Task not yet available' }, 400);
    }

    // Complete task
    tasksCompleted.push(taskId);
    await c.env.DB.prepare(`
      UPDATE user_trials SET tasks_completed = ? WHERE id = ?
    `).bind(JSON.stringify(tasksCompleted), trial.id).run();

    // Award XP
    await c.env.DB.prepare(`
      UPDATE users SET xp_points = xp_points + ? WHERE id = ?
    `).bind(task.xp, userId).run();

    return c.json({
      success: true,
      data: {
        taskId,
        xpAwarded: task.xp,
        tasksCompleted: tasksCompleted.length,
      },
    });
  } catch (error) {
    console.error('Complete trial task error:', error);
    return c.json({ success: false, error: 'Failed to complete task' }, 500);
  }
});

// Claim bonus week (for completing all tasks)
subscriptionsApp.post('/trial/bonus-week', async (c) => {
  try {
    const userId = c.get('userId') as string;

    const trial = await c.env.DB.prepare(`
      SELECT * FROM user_trials WHERE user_id = ? AND status = 'active'
    `).bind(userId).first();

    if (!trial) {
      return c.json({ success: false, error: 'No active trial found' }, 404);
    }

    const tasksCompleted = JSON.parse((trial.tasks_completed as string) || '[]');
    const requiredTasks = TRIAL_TASKS.filter(t => !t.final).map(t => t.id);
    const allCompleted = requiredTasks.every(id => tasksCompleted.includes(id));

    if (!allCompleted) {
      return c.json({ success: false, error: 'Complete all tasks to claim bonus week' }, 400);
    }

    // Check if bonus already claimed
    if (trial.discount_code === 'BONUS_WEEK_CLAIMED') {
      return c.json({ success: false, error: 'Bonus week already claimed' }, 400);
    }

    // Extend trial by 7 days
    const currentExpiry = new Date(trial.expires_at as string);
    const newExpiry = new Date(currentExpiry.getTime() + 7 * 24 * 60 * 60 * 1000);

    await c.env.DB.prepare(`
      UPDATE user_trials
      SET expires_at = ?, discount_code = 'BONUS_WEEK_CLAIMED'
      WHERE id = ?
    `).bind(newExpiry.toISOString(), trial.id).run();

    await c.env.DB.prepare(`
      UPDATE users SET trial_expires_at = ? WHERE id = ?
    `).bind(newExpiry.toISOString(), userId).run();

    return c.json({
      success: true,
      data: {
        message: 'Congratulations! You earned a bonus week!',
        newExpiresAt: newExpiry.toISOString(),
      },
    });
  } catch (error) {
    console.error('Claim bonus week error:', error);
    return c.json({ success: false, error: 'Failed to claim bonus week' }, 500);
  }
});

// Check and update expired trials (can be called by cron)
subscriptionsApp.post('/trial/check-expiry', async (c) => {
  try {
    // Find and expire trials
    const { results: expiredTrials } = await c.env.DB.prepare(`
      SELECT id, user_id FROM user_trials
      WHERE status = 'active' AND expires_at < datetime('now')
    `).all();

    for (const trial of expiredTrials) {
      await c.env.DB.prepare(`
        UPDATE user_trials SET status = 'expired' WHERE id = ?
      `).bind(trial.id).run();

      // Downgrade user to free tier
      await c.env.DB.prepare(`
        UPDATE users
        SET subscription_tier_id = 'tier_free'
        WHERE id = ? AND subscription_tier_id IS NULL
      `).bind(trial.user_id).run();
    }

    return c.json({
      success: true,
      data: { expiredCount: expiredTrials.length },
    });
  } catch (error) {
    console.error('Check trial expiry error:', error);
    return c.json({ success: false, error: 'Failed to check trial expiry' }, 500);
  }
});

// Cancel subscription
subscriptionsApp.post('/cancel', async (c) => {
  try {
    const userId = c.get('userId') as string;

    // Get current subscription
    const user = await c.env.DB.prepare(`
      SELECT subscription_tier_id, subscription_expires_at FROM users WHERE id = ?
    `).bind(userId).first();

    if (!user?.subscription_tier_id || user.subscription_tier_id === 'tier_free') {
      return c.json({ success: false, error: 'No active subscription to cancel' }, 400);
    }

    // For now, we don't delete the subscription - it will just expire naturally
    // In production, you might want to handle Paystack subscription cancellation

    return c.json({
      success: true,
      data: {
        message: 'Subscription will not renew after current period',
        expiresAt: user.subscription_expires_at,
      },
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return c.json({ success: false, error: 'Failed to cancel subscription' }, 500);
  }
});

// Get features available for current subscription level
subscriptionsApp.get('/features', async (c) => {
  try {
    const userId = c.get('userId') as string;
    const userRole = c.get('userRole') as string;

    // Admins and teachers get full access automatically
    const isPrivilegedRole = userRole === 'admin' || userRole === 'teacher';

    const user = await c.env.DB.prepare(`
      SELECT
        u.subscription_tier_id,
        u.subscription_expires_at,
        u.trial_expires_at,
        st.features,
        st.ai_grading_quota
      FROM users u
      LEFT JOIN subscription_tiers st ON u.subscription_tier_id = st.id
      WHERE u.id = ?
    `).bind(userId).first();

    if (!user) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    const now = new Date();
    let isSubscribed = false;
    let isTrial = false;

    // Check subscription
    if (user.subscription_tier_id && user.subscription_tier_id !== 'tier_free') {
      const expiresAt = user.subscription_expires_at ? new Date(user.subscription_expires_at as string) : null;
      isSubscribed = expiresAt ? expiresAt > now : false;
    }

    // Check trial
    if (!isSubscribed && user.trial_expires_at) {
      const trialExpires = new Date(user.trial_expires_at as string);
      isTrial = trialExpires > now;
    }

    // Privileged roles, subscribers, or trial users have premium features
    const hasAccess = isPrivilegedRole || isSubscribed || isTrial;

    const features = {
      unlimitedQuestions: true, // Everyone
      aiGrading: hasAccess,
      detailedFeedback: hasAccess,
      progressTracking: hasAccess,
      pastPapers: hasAccess,
      advancedAnalytics: isPrivilegedRole || isSubscribed, // Privileged roles or paid
      prioritySupport: isPrivilegedRole || isSubscribed,
      aiGradingQuota: hasAccess ? (user.ai_grading_quota || -1) : 0,
    };

    return c.json({
      success: true,
      data: {
        isSubscribed,
        isTrial,
        hasAccess,
        features,
      },
    });
  } catch (error) {
    console.error('Fetch features error:', error);
    return c.json({ success: false, error: 'Failed to fetch features' }, 500);
  }
});

export default subscriptionsApp;
