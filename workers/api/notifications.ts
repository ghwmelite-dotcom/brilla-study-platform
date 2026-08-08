import { Hono } from 'hono';
import { requireAuth } from './auth-middleware';

// Types for Cloudflare bindings
interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

const notificationsApp = new Hono<{
  Bindings: Env;
  Variables: { userId: string; userRole: string };
}>();

// All notification/streak/XP/reminder routes are private: identity comes only
// from a signature-verified JWT via the shared middleware.
notificationsApp.use('*', requireAuth);

// =============================================
// NOTIFICATION ENDPOINTS
// =============================================

// Get user's notifications
notificationsApp.get('/', async (c) => {
  try {
    const userId = c.get('userId')!;

    const limit = parseInt(c.req.query('limit') || '20');
    const offset = parseInt(c.req.query('offset') || '0');
    const unreadOnly = c.req.query('unread') === 'true';

    let query = `
      SELECT * FROM notifications
      WHERE user_id = ?
    `;
    const params: any[] = [userId];

    if (unreadOnly) {
      query += ` AND is_read = 0`;
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const notifications = await c.env.DB.prepare(query).bind(...params).all();

    // Get unread count
    const unreadCount = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0'
    ).bind(userId).first();

    return c.json({
      success: true,
      data: {
        notifications: notifications.results.map((n: any) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          icon: n.icon,
          link: n.link,
          metadata: n.metadata ? JSON.parse(n.metadata) : null,
          isRead: !!n.is_read,
          createdAt: n.created_at,
          readAt: n.read_at,
        })),
        unreadCount: unreadCount?.count || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return c.json({ success: false, error: 'Failed to fetch notifications' }, 500);
  }
});

// Get unread count only
notificationsApp.get('/count', async (c) => {
  try {
    const userId = c.get('userId')!;

    const result = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0'
    ).bind(userId).first();

    return c.json({
      success: true,
      data: { count: result?.count || 0 },
    });
  } catch (error) {
    console.error('Error fetching notification count:', error);
    return c.json({ success: false, error: 'Failed to fetch count' }, 500);
  }
});

// Mark notification as read
notificationsApp.post('/:id/read', async (c) => {
  try {
    const userId = c.get('userId')!;

    const notificationId = c.req.param('id');

    await c.env.DB.prepare(
      `UPDATE notifications SET is_read = 1, read_at = datetime('now')
       WHERE id = ? AND user_id = ?`
    ).bind(notificationId, userId).run();

    return c.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return c.json({ success: false, error: 'Failed to update notification' }, 500);
  }
});

// Mark all notifications as read
notificationsApp.post('/read-all', async (c) => {
  try {
    const userId = c.get('userId')!;

    await c.env.DB.prepare(
      `UPDATE notifications SET is_read = 1, read_at = datetime('now')
       WHERE user_id = ? AND is_read = 0`
    ).bind(userId).run();

    return c.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all as read:', error);
    return c.json({ success: false, error: 'Failed to update notifications' }, 500);
  }
});

// Delete a notification
notificationsApp.delete('/:id', async (c) => {
  try {
    const userId = c.get('userId')!;

    const notificationId = c.req.param('id');

    await c.env.DB.prepare(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?'
    ).bind(notificationId, userId).run();

    return c.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return c.json({ success: false, error: 'Failed to delete notification' }, 500);
  }
});

// =============================================
// STREAK ENDPOINTS
// =============================================

// Get user's streak data
notificationsApp.get('/streak', async (c) => {
  try {
    const userId = c.get('userId')!;

    // Get user's current streak
    const user = await c.env.DB.prepare(
      'SELECT streak_days, longest_streak, last_activity_date FROM users WHERE id = ?'
    ).bind(userId).first();

    // Get streak history (last 30 days)
    const history = await c.env.DB.prepare(`
      SELECT date, activity_count, xp_earned
      FROM streak_history
      WHERE user_id = ?
      ORDER BY date DESC
      LIMIT 30
    `).bind(userId).all();

    // Calculate streak stats
    const currentStreak = user?.streak_days || 0;
    const longestStreak = user?.longest_streak || currentStreak;
    const lastActivityDate = user?.last_activity_date;

    // Get today's activity
    const today = new Date().toISOString().split('T')[0];
    const todayActivity = history.results.find((h: any) => h.date === today);

    return c.json({
      success: true,
      data: {
        currentStreak,
        longestStreak,
        lastActivityDate,
        todayCompleted: !!todayActivity,
        todayXP: todayActivity?.xp_earned || 0,
        history: history.results.map((h: any) => ({
          date: h.date,
          activityCount: h.activity_count,
          xpEarned: h.xp_earned,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching streak data:', error);
    return c.json({ success: false, error: 'Failed to fetch streak data' }, 500);
  }
});

// =============================================
// XP ENDPOINTS
// =============================================

// Get user's XP data and transactions
notificationsApp.get('/xp', async (c) => {
  try {
    const userId = c.get('userId')!;

    // Get user's XP and level
    const user = await c.env.DB.prepare(
      'SELECT xp_points, level FROM users WHERE id = ?'
    ).bind(userId).first<{ xp_points: number; level: number }>();

    // Get recent XP transactions
    const transactions = await c.env.DB.prepare(`
      SELECT id, amount, type, description, created_at
      FROM xp_transactions
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 20
    `).bind(userId).all();

    // Get XP breakdown by type (last 30 days)
    const breakdown = await c.env.DB.prepare(`
      SELECT type, SUM(amount) as total
      FROM xp_transactions
      WHERE user_id = ? AND created_at >= datetime('now', '-30 days')
      GROUP BY type
      ORDER BY total DESC
    `).bind(userId).all();

    // Calculate level progress
    const currentXP = user?.xp_points || 0;
    const currentLevel = user?.level || 1;
    const xpForCurrentLevel = (currentLevel - 1) * 1000; // Simplified: 1000 XP per level
    const xpForNextLevel = currentLevel * 1000;
    const progressXP = currentXP - xpForCurrentLevel;
    const neededXP = xpForNextLevel - xpForCurrentLevel;
    const progressPercent = Math.min(100, Math.round((progressXP / neededXP) * 100));

    return c.json({
      success: true,
      data: {
        totalXP: currentXP,
        level: currentLevel,
        progressXP,
        neededXP,
        progressPercent,
        xpToNextLevel: neededXP - progressXP,
        transactions: transactions.results.map((t: any) => ({
          id: t.id,
          amount: t.amount,
          type: t.type,
          description: t.description,
          createdAt: t.created_at,
        })),
        breakdown: breakdown.results.map((b: any) => ({
          type: b.type,
          total: b.total,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching XP data:', error);
    return c.json({ success: false, error: 'Failed to fetch XP data' }, 500);
  }
});

// =============================================
// HELPER: Create notification (for internal use)
// =============================================

export async function createNotification(
  db: any,
  userId: string,
  type: string,
  title: string,
  message: string,
  options?: { icon?: string; link?: string; metadata?: any }
) {
  const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  await db.prepare(`
    INSERT INTO notifications (id, user_id, type, title, message, icon, link, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    userId,
    type,
    title,
    message,
    options?.icon || null,
    options?.link || null,
    options?.metadata ? JSON.stringify(options.metadata) : null
  ).run();

  return id;
}

// =============================================
// HELPER: Record XP transaction
// =============================================

export async function recordXPTransaction(
  db: any,
  userId: string,
  amount: number,
  type: string,
  description: string,
  referenceId?: string
) {
  const id = `xp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  await db.prepare(`
    INSERT INTO xp_transactions (id, user_id, amount, type, description, reference_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(id, userId, amount, type, description, referenceId || null).run();

  return id;
}

// =============================================
// HELPER: Record streak activity
// =============================================

export async function recordStreakActivity(
  db: any,
  userId: string,
  xpEarned: number
) {
  const today = new Date().toISOString().split('T')[0];
  const id = `streak_${userId}_${today}`;

  await db.prepare(`
    INSERT INTO streak_history (id, user_id, date, activity_count, xp_earned)
    VALUES (?, ?, ?, 1, ?)
    ON CONFLICT(user_id, date) DO UPDATE SET
      activity_count = activity_count + 1,
      xp_earned = xp_earned + excluded.xp_earned
  `).bind(id, userId, today, xpEarned).run();
}

// =============================================
// REMINDER SETTINGS ENDPOINTS
// =============================================

// Get reminder settings
notificationsApp.get('/reminders/settings', async (c) => {
  try {
    const userId = c.get('userId')!;

    const settings = await c.env.DB.prepare(
      'SELECT * FROM reminder_settings WHERE user_id = ?'
    ).bind(userId).first();

    if (!settings) {
      // Return default settings
      return c.json({
        success: true,
        data: {
          settings: null,
        },
      });
    }

    return c.json({
      success: true,
      data: {
        settings: {
          id: settings.id,
          user_id: settings.user_id,
          enabled: settings.enabled,
          daily_goal_reminder: settings.daily_goal_reminder,
          streak_reminder: settings.streak_reminder,
          quest_reminder: settings.quest_reminder,
          study_time: settings.study_time,
          timezone: settings.timezone,
          days_of_week: settings.days_of_week,
          push_enabled: settings.push_enabled,
          email_enabled: settings.email_enabled,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching reminder settings:', error);
    return c.json({ success: false, error: 'Failed to fetch settings' }, 500);
  }
});

// Update/create reminder settings
notificationsApp.post('/reminders/settings', async (c) => {
  try {
    const userId = c.get('userId')!;

    const body = await c.req.json();
    const {
      enabled = true,
      daily_goal_reminder = true,
      streak_reminder = true,
      quest_reminder = true,
      study_time = '18:00',
      timezone = 'UTC',
      days_of_week = '0,1,2,3,4,5,6',
      push_enabled = false,
      email_enabled = false,
    } = body;

    // Check if settings exist
    const existing = await c.env.DB.prepare(
      'SELECT id FROM reminder_settings WHERE user_id = ?'
    ).bind(userId).first();

    if (existing) {
      // Update existing
      await c.env.DB.prepare(`
        UPDATE reminder_settings
        SET enabled = ?, daily_goal_reminder = ?, streak_reminder = ?,
            quest_reminder = ?, study_time = ?, timezone = ?,
            days_of_week = ?, push_enabled = ?, email_enabled = ?,
            updated_at = datetime('now')
        WHERE user_id = ?
      `).bind(
        enabled ? 1 : 0,
        daily_goal_reminder ? 1 : 0,
        streak_reminder ? 1 : 0,
        quest_reminder ? 1 : 0,
        study_time,
        timezone,
        days_of_week,
        push_enabled ? 1 : 0,
        email_enabled ? 1 : 0,
        userId
      ).run();
    } else {
      // Create new
      const settingsId = `settings_${Date.now()}`;
      await c.env.DB.prepare(`
        INSERT INTO reminder_settings (
          id, user_id, enabled, daily_goal_reminder, streak_reminder,
          quest_reminder, study_time, timezone, days_of_week,
          push_enabled, email_enabled, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(
        settingsId,
        userId,
        enabled ? 1 : 0,
        daily_goal_reminder ? 1 : 0,
        streak_reminder ? 1 : 0,
        quest_reminder ? 1 : 0,
        study_time,
        timezone,
        days_of_week,
        push_enabled ? 1 : 0,
        email_enabled ? 1 : 0
      ).run();
    }

    return c.json({ success: true, message: 'Settings saved' });
  } catch (error) {
    console.error('Error saving reminder settings:', error);
    return c.json({ success: false, error: 'Failed to save settings' }, 500);
  }
});

// Get pending reminders for user
notificationsApp.get('/reminders/pending', async (c) => {
  try {
    const userId = c.get('userId')!;

    // Check if user should receive reminders today
    const settings = await c.env.DB.prepare(
      'SELECT * FROM reminder_settings WHERE user_id = ? AND enabled = 1'
    ).bind(userId).first();

    if (!settings) {
      return c.json({
        success: true,
        data: { reminders: [] },
      });
    }

    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysOfWeek = (settings.days_of_week as string).split(',').map(Number);

    if (!daysOfWeek.includes(dayOfWeek)) {
      return c.json({
        success: true,
        data: { reminders: [] },
      });
    }

    const reminders: Array<{ type: string; title: string; message: string }> = [];

    // Check daily goal
    if (settings.daily_goal_reminder) {
      const todayDate = today.toISOString().split('T')[0];
      const activity = await c.env.DB.prepare(`
        SELECT COUNT(*) as count FROM question_attempts
        WHERE user_id = ? AND DATE(created_at) = ?
      `).bind(userId, todayDate).first();

      if (!activity?.count || (activity.count as number) < 10) {
        reminders.push({
          type: 'daily_goal',
          title: 'Daily Goal Reminder',
          message: `You've completed ${activity?.count || 0}/10 questions today. Keep going!`,
        });
      }
    }

    // Check streak
    if (settings.streak_reminder) {
      const user = await c.env.DB.prepare(
        'SELECT streak_days, last_activity_date FROM users WHERE id = ?'
      ).bind(userId).first();

      const lastActivity = user?.last_activity_date as string;
      if (lastActivity) {
        const lastDate = new Date(lastActivity);
        const diffHours = (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60);

        if (diffHours > 20 && diffHours < 48) {
          reminders.push({
            type: 'streak',
            title: 'Streak at Risk!',
            message: `Your ${user?.streak_days || 0}-day streak is at risk. Study now to keep it going!`,
          });
        }
      }
    }

    return c.json({
      success: true,
      data: { reminders },
    });
  } catch (error) {
    console.error('Error checking reminders:', error);
    return c.json({ success: false, error: 'Failed to check reminders' }, 500);
  }
});

// Send a test reminder notification
notificationsApp.post('/reminders/test', async (c) => {
  try {
    const userId = c.get('userId')!;

    // Create a test notification
    const notificationId = await createNotification(
      c.env.DB,
      userId,
      'reminder',
      'Test Reminder',
      'This is a test reminder notification. Your reminder settings are working correctly!',
      { icon: 'bell', link: '/settings' }
    );

    return c.json({
      success: true,
      data: { notificationId },
    });
  } catch (error) {
    console.error('Error sending test reminder:', error);
    return c.json({ success: false, error: 'Failed to send test reminder' }, 500);
  }
});

export { notificationsApp };
