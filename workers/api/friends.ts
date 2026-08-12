import { Hono } from 'hono';
import type { Context } from 'hono';
import { requireAuth } from './auth-middleware';

// Types for Cloudflare bindings
interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

// Create Hono app
const friendsApp = new Hono<{ Bindings: Env }>();

// All friends routes require a verified JWT (sets userId/userRole on context).
friendsApp.use('*', requireAuth);

// Helper to get user ID from context
function getUserId(c: Context): string | undefined {
  return c.get('userId');
}

// Generate unique ID
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// =============================================
// FRIENDS ROUTES
// =============================================

// Get friends list, pending requests, and sent requests
friendsApp.get('/', async (c) => {
  try {
    const userId = getUserId(c);
    if (!userId) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    // Get accepted friends
    const friends = await c.env.DB.prepare(`
      SELECT
        f.id,
        CASE WHEN f.user_id = ? THEN f.friend_id ELSE f.user_id END as user_id,
        u.name, u.avatar_url as avatar, u.house, u.level, u.xp_points,
        f.status, f.accepted_at as last_active
      FROM friendships f
      JOIN users u ON u.id = CASE WHEN f.user_id = ? THEN f.friend_id ELSE f.user_id END
      WHERE (f.user_id = ? OR f.friend_id = ?) AND f.status = 'accepted'
    `).bind(userId, userId, userId, userId).all();

    // Get pending requests (others sent to me)
    const pending = await c.env.DB.prepare(`
      SELECT
        f.id, f.user_id,
        u.name, u.avatar_url as avatar, u.house, u.level, u.xp_points
      FROM friendships f
      JOIN users u ON u.id = f.user_id
      WHERE f.friend_id = ? AND f.status = 'pending'
    `).bind(userId).all();

    // Get sent requests (I sent to others)
    const sent = await c.env.DB.prepare(`
      SELECT
        f.id, f.friend_id as user_id,
        u.name, u.avatar_url as avatar
      FROM friendships f
      JOIN users u ON u.id = f.friend_id
      WHERE f.user_id = ? AND f.status = 'pending'
    `).bind(userId).all();

    return c.json({
      success: true,
      data: {
        friends: friends.results,
        pending: pending.results,
        sent: sent.results,
      },
    });
  } catch (error) {
    console.error('Error fetching friends:', error);
    return c.json({ success: false, error: 'Failed to fetch friends' }, 500);
  }
});

// Send friend request
friendsApp.post('/request', async (c) => {
  try {
    const userId = getUserId(c);
    if (!userId) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { friend_id } = body;

    if (!friend_id) {
      return c.json({ success: false, error: 'Friend ID is required' }, 400);
    }

    if (friend_id === userId) {
      return c.json({ success: false, error: 'Cannot send friend request to yourself' }, 400);
    }

    // Check if friendship already exists
    const existing = await c.env.DB.prepare(`
      SELECT id, status FROM friendships
      WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
    `).bind(userId, friend_id, friend_id, userId).first();

    if (existing) {
      if (existing.status === 'accepted') {
        return c.json({ success: false, error: 'Already friends' }, 400);
      }
      return c.json({ success: false, error: 'Friend request already exists' }, 400);
    }

    // Create friend request
    const id = generateId('friend');
    await c.env.DB.prepare(`
      INSERT INTO friendships (id, user_id, friend_id, status, created_at)
      VALUES (?, ?, ?, 'pending', datetime('now'))
    `).bind(id, userId, friend_id).run();

    return c.json({ success: true, data: { id } });
  } catch (error) {
    console.error('Error sending friend request:', error);
    return c.json({ success: false, error: 'Failed to send friend request' }, 500);
  }
});

// Accept friend request
friendsApp.post('/:id/accept', async (c) => {
  try {
    const userId = getUserId(c);
    if (!userId) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const friendshipId = c.req.param('id');

    // Verify the request exists and is for this user
    const friendship = await c.env.DB.prepare(`
      SELECT id FROM friendships WHERE id = ? AND friend_id = ? AND status = 'pending'
    `).bind(friendshipId, userId).first();

    if (!friendship) {
      return c.json({ success: false, error: 'Friend request not found' }, 404);
    }

    // Accept the request
    await c.env.DB.prepare(`
      UPDATE friendships SET status = 'accepted', accepted_at = datetime('now') WHERE id = ?
    `).bind(friendshipId).run();

    return c.json({ success: true, message: 'Friend request accepted' });
  } catch (error) {
    console.error('Error accepting friend request:', error);
    return c.json({ success: false, error: 'Failed to accept friend request' }, 500);
  }
});

// Decline friend request
friendsApp.post('/:id/decline', async (c) => {
  try {
    const userId = getUserId(c);
    if (!userId) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const friendshipId = c.req.param('id');

    // Delete the request
    await c.env.DB.prepare(`
      DELETE FROM friendships WHERE id = ? AND friend_id = ? AND status = 'pending'
    `).bind(friendshipId, userId).run();

    return c.json({ success: true, message: 'Friend request declined' });
  } catch (error) {
    console.error('Error declining friend request:', error);
    return c.json({ success: false, error: 'Failed to decline friend request' }, 500);
  }
});

// Remove friend
friendsApp.delete('/:id', async (c) => {
  try {
    const userId = getUserId(c);
    if (!userId) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const friendshipId = c.req.param('id');

    // Delete friendship (only if user is part of it)
    await c.env.DB.prepare(`
      DELETE FROM friendships WHERE id = ? AND (user_id = ? OR friend_id = ?)
    `).bind(friendshipId, userId, userId).run();

    return c.json({ success: true, message: 'Friend removed' });
  } catch (error) {
    console.error('Error removing friend:', error);
    return c.json({ success: false, error: 'Failed to remove friend' }, 500);
  }
});

// =============================================
// CHALLENGES ROUTES
// =============================================

// Get challenges
friendsApp.get('/challenges', async (c) => {
  try {
    const userId = getUserId(c);
    if (!userId) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const challenges = await c.env.DB.prepare(`
      SELECT
        fc.*,
        u1.name as challenger_name,
        u2.name as challenged_name
      FROM friend_challenges fc
      LEFT JOIN users u1 ON fc.challenger_id = u1.id
      LEFT JOIN users u2 ON fc.challenged_id = u2.id
      WHERE fc.challenger_id = ? OR fc.challenged_id = ?
      ORDER BY fc.created_at DESC
      LIMIT 50
    `).bind(userId, userId).all();

    return c.json({
      success: true,
      data: { challenges: challenges.results },
    });
  } catch (error) {
    console.error('Error fetching challenges:', error);
    return c.json({ success: false, error: 'Failed to fetch challenges' }, 500);
  }
});

// Create challenge
friendsApp.post('/challenges', async (c) => {
  try {
    const userId = getUserId(c);
    if (!userId) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { friend_id, challenge_type, subject_id, topic_id, target_value, duration_hours, xp_wager } = body;

    if (!friend_id || !challenge_type) {
      return c.json({ success: false, error: 'Friend ID and challenge type are required' }, 400);
    }

    // Verify friendship exists
    const friendship = await c.env.DB.prepare(`
      SELECT id FROM friendships
      WHERE ((user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?))
      AND status = 'accepted'
    `).bind(userId, friend_id, friend_id, userId).first();

    if (!friendship) {
      return c.json({ success: false, error: 'You can only challenge friends' }, 400);
    }

    const id = generateId('challenge');
    await c.env.DB.prepare(`
      INSERT INTO friend_challenges (
        id, challenger_id, challenged_id, challenge_type, subject_id, topic_id,
        target_value, duration_hours, status, challenger_progress, challenged_progress,
        xp_wager, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0, 0, ?, datetime('now'))
    `).bind(
      id, userId, friend_id, challenge_type,
      subject_id || null, topic_id || null,
      target_value || 100, duration_hours || 24, xp_wager || 50
    ).run();

    return c.json({ success: true, data: { id } });
  } catch (error) {
    console.error('Error creating challenge:', error);
    return c.json({ success: false, error: 'Failed to create challenge' }, 500);
  }
});

// Accept challenge
friendsApp.post('/challenges/:id/accept', async (c) => {
  try {
    const userId = getUserId(c);
    if (!userId) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const challengeId = c.req.param('id');

    // Verify challenge exists and is for this user
    const challenge = await c.env.DB.prepare(`
      SELECT id, duration_hours FROM friend_challenges
      WHERE id = ? AND challenged_id = ? AND status = 'pending'
    `).bind(challengeId, userId).first();

    if (!challenge) {
      return c.json({ success: false, error: 'Challenge not found' }, 404);
    }

    // Accept and start the challenge
    await c.env.DB.prepare(`
      UPDATE friend_challenges
      SET status = 'active',
          started_at = datetime('now'),
          ends_at = datetime('now', '+' || ? || ' hours')
      WHERE id = ?
    `).bind(challenge.duration_hours, challengeId).run();

    return c.json({ success: true, message: 'Challenge accepted' });
  } catch (error) {
    console.error('Error accepting challenge:', error);
    return c.json({ success: false, error: 'Failed to accept challenge' }, 500);
  }
});

// Decline challenge
friendsApp.post('/challenges/:id/decline', async (c) => {
  try {
    const userId = getUserId(c);
    if (!userId) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const challengeId = c.req.param('id');

    await c.env.DB.prepare(`
      UPDATE friend_challenges SET status = 'declined'
      WHERE id = ? AND challenged_id = ? AND status = 'pending'
    `).bind(challengeId, userId).run();

    return c.json({ success: true, message: 'Challenge declined' });
  } catch (error) {
    console.error('Error declining challenge:', error);
    return c.json({ success: false, error: 'Failed to decline challenge' }, 500);
  }
});

export { friendsApp };
