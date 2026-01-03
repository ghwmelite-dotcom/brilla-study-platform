import { Hono } from 'hono';
import type { Context } from 'hono';

// Types for Cloudflare bindings
interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

// JWT verification helper
async function verifyJWT(token: string, secret: string): Promise<{ userId: string; email: string; role: string } | null> {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split('.');
    if (!headerB64 || !payloadB64 || !signatureB64) return null;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signatureData = Uint8Array.from(atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    const dataToVerify = encoder.encode(`${headerB64}.${payloadB64}`);

    const isValid = await crypto.subtle.verify('HMAC', key, signatureData, dataToVerify);
    if (!isValid) return null;

    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

// Create Hono app
const friendsApp = new Hono<{ Bindings: Env }>();

// Auth middleware
friendsApp.use('*', async (c, next) => {
  const authHeader = c.req.header('Authorization');

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '');

    // Handle demo tokens
    if (token.endsWith('_demo_token')) {
      const tokenPrefix = token.replace('_demo_token', '');
      const demoUsers: Record<string, { id: string; role: string }> = {
        'student': { id: 'demo_student_1', role: 'student' },
        'teacher': { id: 'demo_teacher_1', role: 'teacher' },
        'admin': { id: 'demo_admin_1', role: 'admin' },
      };
      const demoUser = demoUsers[tokenPrefix];
      if (demoUser) {
        c.set('userId', demoUser.id);
        c.set('userRole', demoUser.role);
      }
    } else {
      try {
        const payload = await verifyJWT(token, c.env.JWT_SECRET);
        if (payload) {
          c.set('userId', payload.userId);
          c.set('userRole', payload.role);
        }
      } catch (error) {
        console.error('Token verification error:', error);
      }
    }
  }

  // Check headers as fallback
  if (!c.get('userId')) {
    const headerUserId = c.req.header('x-user-id');
    const headerRole = c.req.header('x-user-role');
    if (headerUserId) {
      c.set('userId', headerUserId);
      c.set('userRole', headerRole || 'student');
    }
  }

  return next();
});

// Helper to get user ID from context
function getUserId(c: Context): string | undefined {
  return c.get('userId') || c.req.header('x-user-id');
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
