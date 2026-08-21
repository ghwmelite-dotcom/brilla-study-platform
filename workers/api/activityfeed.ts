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

const activityFeedApp = new Hono<{ Bindings: Env; Variables: { user: UserPayload } }>();

// All activity feed routes require a verified JWT (sets user on context).
activityFeedApp.use('*', requireAuth);

const generateId = () => `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

// =============================================
// ACTIVITY FEED ENDPOINTS
// =============================================

// Get user's activity feed (own + friends)
activityFeedApp.get('/', async (c) => {
  try {
    const user = c.get('user');
    const limit = parseLimit(c, 20);
    const offset = parseInt(c.req.query('offset') || '0');
    const type = c.req.query('type'); // Optional filter by activity type

    let query = `
      SELECT
        af.*,
        u.name as user_name,
        u.avatar_url as user_avatar
      FROM activity_feed af
      JOIN users u ON af.user_id = u.id
      WHERE (
        af.user_id = ?
        OR (
          af.is_public = 1
          AND af.user_id IN (
            SELECT friend_id FROM friendships WHERE user_id = ? AND status = 'accepted'
            UNION
            SELECT user_id FROM friendships WHERE friend_id = ? AND status = 'accepted'
          )
        )
      )
    `;
    const params: any[] = [user.userId, user.userId, user.userId];

    if (type) {
      query += ` AND af.activity_type = ?`;
      params.push(type);
    }

    query += ` ORDER BY af.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const activities = await c.env.DB.prepare(query).bind(...params).all();

    return c.json({
      success: true,
      data: {
        activities: activities.results.map((a: any) => ({
          id: a.id,
          userId: a.user_id,
          userName: a.user_name,
          userAvatar: a.user_avatar,
          activityType: a.activity_type,
          title: a.title,
          description: a.description,
          metadata: a.metadata ? JSON.parse(a.metadata) : null,
          createdAt: a.created_at,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching activity feed:', error);
    return c.json({ success: false, error: 'Failed to fetch activity feed' }, 500);
  }
});

// Get only friend activities
activityFeedApp.get('/friends', async (c) => {
  try {
    const user = c.get('user');
    const limit = parseLimit(c, 10);

    const activities = await c.env.DB.prepare(`
      SELECT
        af.*,
        u.name as user_name,
        u.avatar_url as user_avatar
      FROM activity_feed af
      JOIN users u ON af.user_id = u.id
      WHERE af.is_public = 1
        AND af.user_id != ?
        AND af.user_id IN (
          SELECT friend_id FROM friendships WHERE user_id = ? AND status = 'accepted'
          UNION
          SELECT user_id FROM friendships WHERE friend_id = ? AND status = 'accepted'
        )
      ORDER BY af.created_at DESC
      LIMIT ?
    `).bind(user.userId, user.userId, user.userId, limit).all();

    return c.json({
      success: true,
      data: {
        activities: activities.results.map((a: any) => ({
          id: a.id,
          userId: a.user_id,
          userName: a.user_name,
          userAvatar: a.user_avatar,
          activityType: a.activity_type,
          title: a.title,
          description: a.description,
          metadata: a.metadata ? JSON.parse(a.metadata) : null,
          createdAt: a.created_at,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching friend activities:', error);
    return c.json({ success: false, error: 'Failed to fetch friend activities' }, 500);
  }
});

// Get specific user's activities (for profile view)
activityFeedApp.get('/user/:userId', async (c) => {
  try {
    const currentUser = c.get('user');
    const targetUserId = c.req.param('userId');
    const limit = parseLimit(c, 10);

    // Check if target user is a friend or self
    const isSelf = currentUser.userId === targetUserId;
    let isFriend = false;

    if (!isSelf) {
      const friendship = await c.env.DB.prepare(`
        SELECT id FROM friendships
        WHERE ((user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?))
        AND status = 'accepted'
      `).bind(currentUser.userId, targetUserId, targetUserId, currentUser.userId).first();
      isFriend = !!friendship;
    }

    let query = `
      SELECT
        af.*,
        u.name as user_name,
        u.avatar_url as user_avatar
      FROM activity_feed af
      JOIN users u ON af.user_id = u.id
      WHERE af.user_id = ?
    `;

    // Only show public activities if not self or friend
    if (!isSelf && !isFriend) {
      query += ` AND af.is_public = 1`;
    }

    query += ` ORDER BY af.created_at DESC LIMIT ?`;

    const activities = await c.env.DB.prepare(query).bind(targetUserId, limit).all();

    return c.json({
      success: true,
      data: {
        activities: activities.results.map((a: any) => ({
          id: a.id,
          userId: a.user_id,
          userName: a.user_name,
          userAvatar: a.user_avatar,
          activityType: a.activity_type,
          title: a.title,
          description: a.description,
          metadata: a.metadata ? JSON.parse(a.metadata) : null,
          createdAt: a.created_at,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching user activities:', error);
    return c.json({ success: false, error: 'Failed to fetch user activities' }, 500);
  }
});

// Create activity (internal use, typically called from other endpoints)
activityFeedApp.post('/', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const { activityType, title, description, metadata, isPublic = true } = body;

    const validTypes = [
      'achievement', 'level_up', 'streak', 'battle_win', 'high_score',
      'friend_added', 'quest_complete', 'event_join', 'cosmetic_unlock'
    ];

    if (!validTypes.includes(activityType)) {
      return c.json({ success: false, error: 'Invalid activity type' }, 400);
    }

    const activityId = generateId();
    await c.env.DB.prepare(`
      INSERT INTO activity_feed (id, user_id, activity_type, title, description, metadata, is_public)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      activityId,
      user.userId,
      activityType,
      title,
      description || null,
      metadata ? JSON.stringify(metadata) : null,
      isPublic ? 1 : 0
    ).run();

    return c.json({
      success: true,
      data: {
        id: activityId,
        activityType,
        title,
        description,
        metadata,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error creating activity:', error);
    return c.json({ success: false, error: 'Failed to create activity' }, 500);
  }
});

// Helper function to create activity (for internal use)
export async function createActivity(
  db: D1Database,
  userId: string,
  activityType: string,
  title: string,
  description?: string,
  metadata?: Record<string, unknown>,
  isPublic = true
) {
  const activityId = generateId();
  await db.prepare(`
    INSERT INTO activity_feed (id, user_id, activity_type, title, description, metadata, is_public)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    activityId,
    userId,
    activityType,
    title,
    description || null,
    metadata ? JSON.stringify(metadata) : null,
    isPublic ? 1 : 0
  ).run();
  return activityId;
}

export { activityFeedApp };
