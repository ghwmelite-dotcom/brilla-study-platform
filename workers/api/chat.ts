import { Hono } from 'hono';
import type { Context } from 'hono';
import { getDemoDataFlags, isDemoUserId } from './demoUtils';

// Types for Cloudflare bindings
interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

// Types
type ChatRoomType = 'dm' | 'public' | 'private' | 'subject';
type ChatMemberRole = 'owner' | 'moderator' | 'member';
type ChatContentType = 'text' | 'image' | 'file' | 'system';

interface ChatRoom {
  id: string;
  name?: string;
  description?: string;
  type: ChatRoomType;
  subjectId?: string;
  examTypeId?: string;
  avatarUrl?: string;
  isArchived: boolean;
  maxMembers: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  memberCount?: number;
  unreadCount?: number;
  lastMessage?: {
    content: string;
    senderName: string;
    createdAt: string;
  };
  otherUser?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

// Create Hono app
const chatApp = new Hono<{ Bindings: Env }>();

// Helper functions
function getUserId(c: Context): string | undefined {
  return c.get('userId') || c.req.header('x-user-id');
}

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// =============================================
// ROOM ROUTES
// =============================================

// Get user's chat rooms
chatApp.get('/rooms', async (c) => {
  try {
    const userId = getUserId(c);

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    // Get all rooms user is a member of
    const rooms = await c.env.DB.prepare(`
      SELECT
        cr.id, cr.name, cr.description, cr.type, cr.subject_id, cr.avatar_url,
        cr.is_archived, cr.max_members, cr.created_by, cr.created_at, cr.updated_at,
        crm.role as my_role, crm.last_read_at,
        (SELECT COUNT(*) FROM chat_room_members WHERE room_id = cr.id) as member_count,
        (SELECT COUNT(*) FROM chat_messages WHERE room_id = cr.id AND created_at > crm.last_read_at AND sender_id != ?) as unread_count
      FROM chat_rooms cr
      INNER JOIN chat_room_members crm ON cr.id = crm.room_id AND crm.user_id = ?
      WHERE cr.is_archived = 0
      ORDER BY cr.updated_at DESC
      LIMIT 100
    `).bind(userId, userId).all();

    // For each room, get last message and other user (for DMs)
    const roomsWithDetails = await Promise.all(
      rooms.results.map(async (room: Record<string, unknown>) => {
        // Get last message
        const lastMessage = await c.env.DB.prepare(`
          SELECT cm.content, cm.created_at, u.name as sender_name
          FROM chat_messages cm
          LEFT JOIN users u ON cm.sender_id = u.id
          WHERE cm.room_id = ? AND cm.is_deleted = 0
          ORDER BY cm.created_at DESC
          LIMIT 1
        `).bind(room.id).first();

        // For DMs, get the other user
        let otherUser = null;
        if (room.type === 'dm') {
          const other = await c.env.DB.prepare(`
            SELECT u.id, u.name, u.avatar_url
            FROM chat_room_members crm
            JOIN users u ON crm.user_id = u.id
            WHERE crm.room_id = ? AND crm.user_id != ?
            LIMIT 1
          `).bind(room.id, userId).first();

          if (other) {
            otherUser = {
              id: other.id,
              name: other.name,
              avatarUrl: other.avatar_url,
            };
          }
        }

        return {
          id: room.id,
          name: room.name,
          description: room.description,
          type: room.type,
          subjectId: room.subject_id,
          avatarUrl: room.avatar_url,
          isArchived: !!room.is_archived,
          maxMembers: room.max_members,
          createdBy: room.created_by,
          createdAt: room.created_at,
          updatedAt: room.updated_at,
          myRole: room.my_role,
          memberCount: room.member_count,
          unreadCount: room.unread_count || 0,
          lastMessage: lastMessage ? {
            content: lastMessage.content,
            senderName: lastMessage.sender_name,
            createdAt: lastMessage.created_at,
          } : null,
          otherUser,
        };
      })
    );

    return c.json({ success: true, data: roomsWithDetails });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return c.json({ success: false, error: 'Failed to fetch rooms' }, 500);
  }
});

// Get public/subject rooms (for browsing)
chatApp.get('/rooms/browse', async (c) => {
  try {
    const userId = getUserId(c);

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    const type = c.req.query('type') || 'public';
    const subjectId = c.req.query('subjectId');

    let query = `
      SELECT
        cr.id, cr.name, cr.description, cr.type, cr.subject_id, cr.avatar_url,
        cr.max_members, cr.created_at,
        (SELECT COUNT(*) FROM chat_room_members WHERE room_id = cr.id) as member_count,
        (SELECT 1 FROM chat_room_members WHERE room_id = cr.id AND user_id = ?) as is_member
      FROM chat_rooms cr
      WHERE cr.is_archived = 0 AND cr.type = ?
    `;

    const params: (string | number)[] = [userId, type];

    if (subjectId) {
      query += ' AND cr.subject_id = ?';
      params.push(subjectId);
    }

    query += ' ORDER BY member_count DESC LIMIT 50';

    const rooms = await c.env.DB.prepare(query).bind(...params).all();

    return c.json({
      success: true,
      data: rooms.results.map((room: Record<string, unknown>) => ({
        id: room.id,
        name: room.name,
        description: room.description,
        type: room.type,
        subjectId: room.subject_id,
        avatarUrl: room.avatar_url,
        maxMembers: room.max_members,
        memberCount: room.member_count,
        isMember: !!room.is_member,
        createdAt: room.created_at,
      })),
    });
  } catch (error) {
    console.error('Error browsing rooms:', error);
    return c.json({ success: false, error: 'Failed to browse rooms' }, 500);
  }
});

// Get room details
chatApp.get('/rooms/:id', async (c) => {
  try {
    const roomId = c.req.param('id');
    const userId = getUserId(c);

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    const room = await c.env.DB.prepare(`
      SELECT cr.*, crm.role as my_role
      FROM chat_rooms cr
      LEFT JOIN chat_room_members crm ON cr.id = crm.room_id AND crm.user_id = ?
      WHERE cr.id = ?
    `).bind(userId, roomId).first();

    if (!room) {
      return c.json({ success: false, error: 'Room not found' }, 404);
    }

    // Check if user is a member (required for private rooms)
    if (room.type === 'private' && !room.my_role) {
      return c.json({ success: false, error: 'Access denied' }, 403);
    }

    // Get member count
    const memberCount = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM chat_room_members WHERE room_id = ?
    `).bind(roomId).first();

    // Get members preview (first 5)
    const members = await c.env.DB.prepare(`
      SELECT u.id, u.name, u.avatar_url, crm.role
      FROM chat_room_members crm
      JOIN users u ON crm.user_id = u.id
      WHERE crm.room_id = ?
      ORDER BY crm.role = 'owner' DESC, crm.joined_at ASC
      LIMIT 5
    `).bind(roomId).all();

    return c.json({
      success: true,
      data: {
        id: room.id,
        name: room.name,
        description: room.description,
        type: room.type,
        subjectId: room.subject_id,
        avatarUrl: room.avatar_url,
        isArchived: !!room.is_archived,
        maxMembers: room.max_members,
        createdBy: room.created_by,
        createdAt: room.created_at,
        myRole: room.my_role,
        memberCount: memberCount?.count || 0,
        membersPreview: members.results.map((m: Record<string, unknown>) => ({
          id: m.id,
          name: m.name,
          avatarUrl: m.avatar_url,
          role: m.role,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching room:', error);
    return c.json({ success: false, error: 'Failed to fetch room' }, 500);
  }
});

// Create a new room
chatApp.post('/rooms', async (c) => {
  try {
    const userId = getUserId(c);

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    const body = await c.req.json();
    const { name, description, type, subjectId, memberIds } = body;

    if (!type || !['public', 'private', 'subject'].includes(type)) {
      return c.json({ success: false, error: 'Valid room type is required' }, 400);
    }

    if (type !== 'private' && !name?.trim()) {
      return c.json({ success: false, error: 'Room name is required' }, 400);
    }

    const roomId = generateId('room');

    // Create room
    await c.env.DB.prepare(`
      INSERT INTO chat_rooms (id, name, description, type, subject_id, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(roomId, name?.trim() || null, description?.trim() || null, type, subjectId || null, userId).run();

    // Add creator as owner
    await c.env.DB.prepare(`
      INSERT INTO chat_room_members (id, room_id, user_id, role, joined_at, last_read_at)
      VALUES (?, ?, ?, 'owner', datetime('now'), datetime('now'))
    `).bind(generateId('member'), roomId, userId).run();

    // Add initial members if provided
    if (memberIds && Array.isArray(memberIds)) {
      for (const memberId of memberIds) {
        if (memberId !== userId) {
          try {
            await c.env.DB.prepare(`
              INSERT INTO chat_room_members (id, room_id, user_id, role, joined_at, last_read_at)
              VALUES (?, ?, ?, 'member', datetime('now'), datetime('now'))
            `).bind(generateId('member'), roomId, memberId).run();
          } catch {
            // Ignore duplicate member errors
          }
        }
      }
    }

    // Add system message
    await c.env.DB.prepare(`
      INSERT INTO chat_messages (id, room_id, sender_id, content, content_type, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'system', datetime('now'), datetime('now'))
    `).bind(generateId('msg'), roomId, userId, `Room "${name}" was created`).run();

    return c.json({
      success: true,
      data: {
        id: roomId,
        name,
        description,
        type,
        subjectId,
        createdBy: userId,
      },
    });
  } catch (error) {
    console.error('Error creating room:', error);
    return c.json({ success: false, error: 'Failed to create room' }, 500);
  }
});

// Join a room
chatApp.post('/rooms/:id/join', async (c) => {
  try {
    const roomId = c.req.param('id');
    const userId = getUserId(c);

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    // Check if room exists and is joinable
    const room = await c.env.DB.prepare(`
      SELECT * FROM chat_rooms WHERE id = ? AND is_archived = 0
    `).bind(roomId).first();

    if (!room) {
      return c.json({ success: false, error: 'Room not found' }, 404);
    }

    if (room.type === 'private') {
      return c.json({ success: false, error: 'Cannot join private room without invitation' }, 403);
    }

    if (room.type === 'dm') {
      return c.json({ success: false, error: 'Cannot join a direct message' }, 403);
    }

    // Check member count
    const memberCount = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM chat_room_members WHERE room_id = ?
    `).bind(roomId).first();

    if ((memberCount?.count as number) >= (room.max_members as number)) {
      return c.json({ success: false, error: 'Room is full' }, 400);
    }

    // Check if already a member
    const existing = await c.env.DB.prepare(`
      SELECT id FROM chat_room_members WHERE room_id = ? AND user_id = ?
    `).bind(roomId, userId).first();

    if (existing) {
      return c.json({ success: true, message: 'Already a member' });
    }

    // Add as member
    await c.env.DB.prepare(`
      INSERT INTO chat_room_members (id, room_id, user_id, role, joined_at, last_read_at)
      VALUES (?, ?, ?, 'member', datetime('now'), datetime('now'))
    `).bind(generateId('member'), roomId, userId).run();

    // Get user name for system message
    const user = await c.env.DB.prepare(`SELECT name FROM users WHERE id = ?`).bind(userId).first();

    // Add system message
    await c.env.DB.prepare(`
      INSERT INTO chat_messages (id, room_id, sender_id, content, content_type, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'system', datetime('now'), datetime('now'))
    `).bind(generateId('msg'), roomId, userId, `${user?.name || 'A user'} joined the room`).run();

    // Update room timestamp
    await c.env.DB.prepare(`
      UPDATE chat_rooms SET updated_at = datetime('now') WHERE id = ?
    `).bind(roomId).run();

    return c.json({ success: true, message: 'Joined room successfully' });
  } catch (error) {
    console.error('Error joining room:', error);
    return c.json({ success: false, error: 'Failed to join room' }, 500);
  }
});

// Leave a room
chatApp.post('/rooms/:id/leave', async (c) => {
  try {
    const roomId = c.req.param('id');
    const userId = getUserId(c);

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    // Check membership
    const membership = await c.env.DB.prepare(`
      SELECT * FROM chat_room_members WHERE room_id = ? AND user_id = ?
    `).bind(roomId, userId).first();

    if (!membership) {
      return c.json({ success: false, error: 'Not a member of this room' }, 400);
    }

    // Get user name for system message
    const user = await c.env.DB.prepare(`SELECT name FROM users WHERE id = ?`).bind(userId).first();

    // Remove membership
    await c.env.DB.prepare(`
      DELETE FROM chat_room_members WHERE room_id = ? AND user_id = ?
    `).bind(roomId, userId).run();

    // Add system message
    await c.env.DB.prepare(`
      INSERT INTO chat_messages (id, room_id, sender_id, content, content_type, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'system', datetime('now'), datetime('now'))
    `).bind(generateId('msg'), roomId, userId, `${user?.name || 'A user'} left the room`).run();

    // If owner left and room has other members, transfer ownership
    if (membership.role === 'owner') {
      const nextOwner = await c.env.DB.prepare(`
        SELECT user_id FROM chat_room_members
        WHERE room_id = ?
        ORDER BY role = 'moderator' DESC, joined_at ASC
        LIMIT 1
      `).bind(roomId).first();

      if (nextOwner) {
        await c.env.DB.prepare(`
          UPDATE chat_room_members SET role = 'owner' WHERE room_id = ? AND user_id = ?
        `).bind(roomId, nextOwner.user_id).run();
      } else {
        // No members left, archive the room
        await c.env.DB.prepare(`
          UPDATE chat_rooms SET is_archived = 1, updated_at = datetime('now') WHERE id = ?
        `).bind(roomId).run();
      }
    }

    return c.json({ success: true, message: 'Left room successfully' });
  } catch (error) {
    console.error('Error leaving room:', error);
    return c.json({ success: false, error: 'Failed to leave room' }, 500);
  }
});

// Archive a room (owner only)
chatApp.delete('/rooms/:id', async (c) => {
  try {
    const roomId = c.req.param('id');
    const userId = getUserId(c);

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    // Check if user is owner
    const membership = await c.env.DB.prepare(`
      SELECT role FROM chat_room_members WHERE room_id = ? AND user_id = ?
    `).bind(roomId, userId).first();

    if (!membership || membership.role !== 'owner') {
      return c.json({ success: false, error: 'Only room owner can archive the room' }, 403);
    }

    await c.env.DB.prepare(`
      UPDATE chat_rooms SET is_archived = 1, updated_at = datetime('now') WHERE id = ?
    `).bind(roomId).run();

    return c.json({ success: true, message: 'Room archived' });
  } catch (error) {
    console.error('Error archiving room:', error);
    return c.json({ success: false, error: 'Failed to archive room' }, 500);
  }
});

// =============================================
// DIRECT MESSAGE ROUTES
// =============================================

// Start or get existing DM
chatApp.post('/dm', async (c) => {
  try {
    const userId = getUserId(c);

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    const body = await c.req.json();
    const { targetUserId } = body;

    if (!targetUserId) {
      return c.json({ success: false, error: 'Target user ID is required' }, 400);
    }

    if (targetUserId === userId) {
      return c.json({ success: false, error: 'Cannot start DM with yourself' }, 400);
    }

    // Check if target user exists
    const targetUser = await c.env.DB.prepare(`
      SELECT id, name, avatar_url FROM users WHERE id = ?
    `).bind(targetUserId).first();

    if (!targetUser) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    // Check if user is blocked
    const blocked = await c.env.DB.prepare(`
      SELECT id FROM chat_user_blocks
      WHERE (blocker_id = ? AND blocked_id = ?) OR (blocker_id = ? AND blocked_id = ?)
    `).bind(userId, targetUserId, targetUserId, userId).first();

    if (blocked) {
      return c.json({ success: false, error: 'Cannot message this user' }, 403);
    }

    // Check if DM already exists
    const existingDm = await c.env.DB.prepare(`
      SELECT cr.id FROM chat_rooms cr
      WHERE cr.type = 'dm'
      AND EXISTS (SELECT 1 FROM chat_room_members WHERE room_id = cr.id AND user_id = ?)
      AND EXISTS (SELECT 1 FROM chat_room_members WHERE room_id = cr.id AND user_id = ?)
    `).bind(userId, targetUserId).first();

    if (existingDm) {
      return c.json({
        success: true,
        data: {
          roomId: existingDm.id,
          isNew: false,
          otherUser: {
            id: targetUser.id,
            name: targetUser.name,
            avatarUrl: targetUser.avatar_url,
          },
        },
      });
    }

    // Create new DM room
    const roomId = generateId('dm');

    await c.env.DB.prepare(`
      INSERT INTO chat_rooms (id, type, created_by, created_at, updated_at)
      VALUES (?, 'dm', ?, datetime('now'), datetime('now'))
    `).bind(roomId, userId).run();

    // Add both users as members
    await c.env.DB.prepare(`
      INSERT INTO chat_room_members (id, room_id, user_id, role, joined_at, last_read_at)
      VALUES (?, ?, ?, 'member', datetime('now'), datetime('now'))
    `).bind(generateId('member'), roomId, userId).run();

    await c.env.DB.prepare(`
      INSERT INTO chat_room_members (id, room_id, user_id, role, joined_at, last_read_at)
      VALUES (?, ?, ?, 'member', datetime('now'), datetime('now'))
    `).bind(generateId('member'), roomId, targetUserId).run();

    return c.json({
      success: true,
      data: {
        roomId,
        isNew: true,
        otherUser: {
          id: targetUser.id,
          name: targetUser.name,
          avatarUrl: targetUser.avatar_url,
        },
      },
    });
  } catch (error) {
    console.error('Error creating DM:', error);
    return c.json({ success: false, error: 'Failed to create DM' }, 500);
  }
});

// Get list of DMs
chatApp.get('/dm', async (c) => {
  try {
    const userId = getUserId(c);

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    const dms = await c.env.DB.prepare(`
      SELECT
        cr.id, cr.created_at, cr.updated_at,
        crm.last_read_at
      FROM chat_rooms cr
      INNER JOIN chat_room_members crm ON cr.id = crm.room_id AND crm.user_id = ?
      WHERE cr.type = 'dm' AND cr.is_archived = 0
      ORDER BY cr.updated_at DESC
      LIMIT 50
    `).bind(userId).all();

    // Get other user and last message for each DM
    const dmsWithDetails = await Promise.all(
      dms.results.map(async (dm: Record<string, unknown>) => {
        const otherUser = await c.env.DB.prepare(`
          SELECT u.id, u.name, u.avatar_url
          FROM chat_room_members crm
          JOIN users u ON crm.user_id = u.id
          WHERE crm.room_id = ? AND crm.user_id != ?
          LIMIT 1
        `).bind(dm.id, userId).first();

        const lastMessage = await c.env.DB.prepare(`
          SELECT content, sender_id, created_at
          FROM chat_messages
          WHERE room_id = ? AND is_deleted = 0
          ORDER BY created_at DESC
          LIMIT 1
        `).bind(dm.id).first();

        const unreadCount = await c.env.DB.prepare(`
          SELECT COUNT(*) as count
          FROM chat_messages
          WHERE room_id = ? AND created_at > ? AND sender_id != ?
        `).bind(dm.id, dm.last_read_at, userId).first();

        return {
          roomId: dm.id,
          otherUser: otherUser ? {
            id: otherUser.id,
            name: otherUser.name,
            avatarUrl: otherUser.avatar_url,
          } : null,
          lastMessage: lastMessage ? {
            content: lastMessage.content,
            isFromMe: lastMessage.sender_id === userId,
            createdAt: lastMessage.created_at,
          } : null,
          unreadCount: unreadCount?.count || 0,
          updatedAt: dm.updated_at,
        };
      })
    );

    return c.json({ success: true, data: dmsWithDetails });
  } catch (error) {
    console.error('Error fetching DMs:', error);
    return c.json({ success: false, error: 'Failed to fetch DMs' }, 500);
  }
});

// =============================================
// MESSAGE ROUTES
// =============================================

// Get messages for a room
chatApp.get('/rooms/:id/messages', async (c) => {
  try {
    const roomId = c.req.param('id');
    const userId = getUserId(c);

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    // Verify membership
    const membership = await c.env.DB.prepare(`
      SELECT * FROM chat_room_members WHERE room_id = ? AND user_id = ?
    `).bind(roomId, userId).first();

    if (!membership) {
      return c.json({ success: false, error: 'Not a member of this room' }, 403);
    }

    const limit = parseInt(c.req.query('limit') || '50');
    const before = c.req.query('before'); // For pagination

    let query = `
      SELECT
        cm.id, cm.room_id, cm.sender_id, cm.content, cm.content_type,
        cm.file_url, cm.file_name, cm.file_size, cm.reply_to_id,
        cm.is_edited, cm.is_deleted, cm.created_at, cm.updated_at,
        u.name as sender_name, u.avatar_url as sender_avatar
      FROM chat_messages cm
      LEFT JOIN users u ON cm.sender_id = u.id
      WHERE cm.room_id = ?
    `;

    const params: (string | number)[] = [roomId];

    if (before) {
      query += ' AND cm.created_at < ?';
      params.push(before);
    }

    query += ' ORDER BY cm.created_at DESC LIMIT ?';
    params.push(limit);

    const messages = await c.env.DB.prepare(query).bind(...params).all();

    // Get reactions for messages
    const messagesWithReactions = await Promise.all(
      messages.results.map(async (msg: Record<string, unknown>) => {
        const reactions = await c.env.DB.prepare(`
          SELECT emoji, COUNT(*) as count,
            GROUP_CONCAT(user_id) as user_ids
          FROM chat_message_reactions
          WHERE message_id = ?
          GROUP BY emoji
        `).bind(msg.id).all();

        // Get reply-to message if exists
        let replyTo = null;
        if (msg.reply_to_id) {
          const reply = await c.env.DB.prepare(`
            SELECT cm.id, cm.content, u.name as sender_name
            FROM chat_messages cm
            LEFT JOIN users u ON cm.sender_id = u.id
            WHERE cm.id = ?
          `).bind(msg.reply_to_id).first();

          if (reply) {
            replyTo = {
              id: reply.id,
              content: reply.content,
              senderName: reply.sender_name,
            };
          }
        }

        return {
          id: msg.id,
          roomId: msg.room_id,
          senderId: msg.sender_id,
          content: msg.is_deleted ? '[Message deleted]' : msg.content,
          contentType: msg.content_type,
          fileUrl: msg.file_url,
          fileName: msg.file_name,
          fileSize: msg.file_size,
          isEdited: !!msg.is_edited,
          isDeleted: !!msg.is_deleted,
          createdAt: msg.created_at,
          updatedAt: msg.updated_at,
          sender: {
            id: msg.sender_id,
            name: msg.sender_name,
            avatarUrl: msg.sender_avatar,
          },
          replyTo,
          reactions: reactions.results.map((r: Record<string, unknown>) => ({
            emoji: r.emoji,
            count: r.count,
            userIds: (r.user_ids as string)?.split(',') || [],
            hasReacted: (r.user_ids as string)?.includes(userId),
          })),
        };
      })
    );

    // Update last read timestamp
    await c.env.DB.prepare(`
      UPDATE chat_room_members SET last_read_at = datetime('now') WHERE room_id = ? AND user_id = ?
    `).bind(roomId, userId).run();

    return c.json({
      success: true,
      data: messagesWithReactions.reverse(), // Return in chronological order
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return c.json({ success: false, error: 'Failed to fetch messages' }, 500);
  }
});

// Send a message
chatApp.post('/rooms/:id/messages', async (c) => {
  try {
    const roomId = c.req.param('id');
    const userId = getUserId(c);

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    // Verify membership
    const membership = await c.env.DB.prepare(`
      SELECT * FROM chat_room_members WHERE room_id = ? AND user_id = ?
    `).bind(roomId, userId).first();

    if (!membership) {
      return c.json({ success: false, error: 'Not a member of this room' }, 403);
    }

    if (membership.is_muted) {
      // Check if mute has expired
      if (membership.muted_until && new Date(membership.muted_until as string) > new Date()) {
        return c.json({ success: false, error: 'You are muted in this room' }, 403);
      }
    }

    const body = await c.req.json();
    const { content, contentType = 'text', replyToId, fileUrl, fileName, fileSize } = body;

    if (!content?.trim() && contentType === 'text') {
      return c.json({ success: false, error: 'Message content is required' }, 400);
    }

    const messageId = generateId('msg');
    const demoFlags = getDemoDataFlags(userId);

    await c.env.DB.prepare(`
      INSERT INTO chat_messages (id, room_id, sender_id, content, content_type, file_url, file_name, file_size, reply_to_id, is_demo_data, expires_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      messageId, roomId, userId, content?.trim() || '',
      contentType, fileUrl || null, fileName || null, fileSize || null,
      replyToId || null, demoFlags.is_demo_data, demoFlags.expires_at
    ).run();

    // Update room timestamp
    await c.env.DB.prepare(`
      UPDATE chat_rooms SET updated_at = datetime('now') WHERE id = ?
    `).bind(roomId).run();

    // Update sender's last read
    await c.env.DB.prepare(`
      UPDATE chat_room_members SET last_read_at = datetime('now') WHERE room_id = ? AND user_id = ?
    `).bind(roomId, userId).run();

    // Get sender info
    const sender = await c.env.DB.prepare(`
      SELECT id, name, avatar_url FROM users WHERE id = ?
    `).bind(userId).first();

    return c.json({
      success: true,
      data: {
        id: messageId,
        roomId,
        senderId: userId,
        content: content?.trim() || '',
        contentType,
        fileUrl,
        fileName,
        fileSize,
        replyToId,
        isEdited: false,
        isDeleted: false,
        createdAt: new Date().toISOString(),
        sender: {
          id: sender?.id,
          name: sender?.name,
          avatarUrl: sender?.avatar_url,
        },
      },
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return c.json({ success: false, error: 'Failed to send message' }, 500);
  }
});

// Edit a message
chatApp.put('/messages/:id', async (c) => {
  try {
    const messageId = c.req.param('id');
    const userId = getUserId(c);

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    const message = await c.env.DB.prepare(`
      SELECT * FROM chat_messages WHERE id = ? AND sender_id = ? AND is_deleted = 0
    `).bind(messageId, userId).first();

    if (!message) {
      return c.json({ success: false, error: 'Message not found or cannot be edited' }, 404);
    }

    const body = await c.req.json();
    const { content } = body;

    if (!content?.trim()) {
      return c.json({ success: false, error: 'Message content is required' }, 400);
    }

    await c.env.DB.prepare(`
      UPDATE chat_messages SET content = ?, is_edited = 1, updated_at = datetime('now') WHERE id = ?
    `).bind(content.trim(), messageId).run();

    return c.json({ success: true, message: 'Message updated' });
  } catch (error) {
    console.error('Error editing message:', error);
    return c.json({ success: false, error: 'Failed to edit message' }, 500);
  }
});

// Delete a message
chatApp.delete('/messages/:id', async (c) => {
  try {
    const messageId = c.req.param('id');
    const userId = getUserId(c);

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    const message = await c.env.DB.prepare(`
      SELECT cm.*, crm.role as user_role
      FROM chat_messages cm
      LEFT JOIN chat_room_members crm ON cm.room_id = crm.room_id AND crm.user_id = ?
      WHERE cm.id = ?
    `).bind(userId, messageId).first();

    if (!message) {
      return c.json({ success: false, error: 'Message not found' }, 404);
    }

    // Can delete own messages or if moderator/owner
    const canDelete = message.sender_id === userId ||
      message.user_role === 'owner' ||
      message.user_role === 'moderator';

    if (!canDelete) {
      return c.json({ success: false, error: 'Cannot delete this message' }, 403);
    }

    await c.env.DB.prepare(`
      UPDATE chat_messages SET is_deleted = 1, deleted_by = ?, updated_at = datetime('now') WHERE id = ?
    `).bind(userId, messageId).run();

    return c.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    console.error('Error deleting message:', error);
    return c.json({ success: false, error: 'Failed to delete message' }, 500);
  }
});

// =============================================
// REACTION ROUTES
// =============================================

// Add reaction
chatApp.post('/messages/:id/reactions', async (c) => {
  try {
    const messageId = c.req.param('id');
    const userId = getUserId(c);

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    const body = await c.req.json();
    const { emoji } = body;

    if (!emoji) {
      return c.json({ success: false, error: 'Emoji is required' }, 400);
    }

    // Verify message exists and user has access
    const message = await c.env.DB.prepare(`
      SELECT cm.room_id FROM chat_messages cm
      INNER JOIN chat_room_members crm ON cm.room_id = crm.room_id AND crm.user_id = ?
      WHERE cm.id = ?
    `).bind(userId, messageId).first();

    if (!message) {
      return c.json({ success: false, error: 'Message not found or no access' }, 404);
    }

    // Add reaction (ignore if already exists)
    try {
      await c.env.DB.prepare(`
        INSERT INTO chat_message_reactions (id, message_id, user_id, emoji, created_at)
        VALUES (?, ?, ?, ?, datetime('now'))
      `).bind(generateId('reaction'), messageId, userId, emoji).run();
    } catch {
      // Already reacted with this emoji - remove it (toggle behavior)
      await c.env.DB.prepare(`
        DELETE FROM chat_message_reactions WHERE message_id = ? AND user_id = ? AND emoji = ?
      `).bind(messageId, userId, emoji).run();
    }

    return c.json({ success: true, message: 'Reaction toggled' });
  } catch (error) {
    console.error('Error adding reaction:', error);
    return c.json({ success: false, error: 'Failed to add reaction' }, 500);
  }
});

// Remove reaction
chatApp.delete('/messages/:id/reactions/:emoji', async (c) => {
  try {
    const messageId = c.req.param('id');
    const emoji = decodeURIComponent(c.req.param('emoji'));
    const userId = getUserId(c);

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    await c.env.DB.prepare(`
      DELETE FROM chat_message_reactions WHERE message_id = ? AND user_id = ? AND emoji = ?
    `).bind(messageId, userId, emoji).run();

    return c.json({ success: true, message: 'Reaction removed' });
  } catch (error) {
    console.error('Error removing reaction:', error);
    return c.json({ success: false, error: 'Failed to remove reaction' }, 500);
  }
});

// =============================================
// USER SEARCH & BLOCKING
// =============================================

// Search users for DM
chatApp.get('/users/search', async (c) => {
  try {
    const userId = getUserId(c);

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    const query = c.req.query('q');

    if (!query || query.length < 2) {
      return c.json({ success: true, data: [] });
    }

    const users = await c.env.DB.prepare(`
      SELECT u.id, u.name, u.avatar_url, u.school_level
      FROM users u
      WHERE u.id != ?
      AND u.name LIKE ?
      AND u.id NOT IN (
        SELECT blocked_id FROM chat_user_blocks WHERE blocker_id = ?
      )
      AND u.id NOT IN (
        SELECT blocker_id FROM chat_user_blocks WHERE blocked_id = ?
      )
      LIMIT 20
    `).bind(userId, `%${query}%`, userId, userId).all();

    // Check if DM already exists with each user
    const usersWithDmStatus = await Promise.all(
      users.results.map(async (user: Record<string, unknown>) => {
        const existingDm = await c.env.DB.prepare(`
          SELECT cr.id FROM chat_rooms cr
          WHERE cr.type = 'dm'
          AND EXISTS (SELECT 1 FROM chat_room_members WHERE room_id = cr.id AND user_id = ?)
          AND EXISTS (SELECT 1 FROM chat_room_members WHERE room_id = cr.id AND user_id = ?)
        `).bind(userId, user.id).first();

        return {
          id: user.id,
          name: user.name,
          avatarUrl: user.avatar_url,
          schoolLevel: user.school_level,
          existingDmId: existingDm?.id || null,
        };
      })
    );

    return c.json({ success: true, data: usersWithDmStatus });
  } catch (error) {
    console.error('Error searching users:', error);
    return c.json({ success: false, error: 'Failed to search users' }, 500);
  }
});

// Block a user
chatApp.post('/blocked/:userId', async (c) => {
  try {
    const targetUserId = c.req.param('userId');
    const userId = getUserId(c);

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    const body = await c.req.json();
    const { reason } = body;

    await c.env.DB.prepare(`
      INSERT INTO chat_user_blocks (id, blocker_id, blocked_id, reason, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
      ON CONFLICT(blocker_id, blocked_id) DO NOTHING
    `).bind(generateId('block'), userId, targetUserId, reason || null).run();

    return c.json({ success: true, message: 'User blocked' });
  } catch (error) {
    console.error('Error blocking user:', error);
    return c.json({ success: false, error: 'Failed to block user' }, 500);
  }
});

// Unblock a user
chatApp.delete('/blocked/:userId', async (c) => {
  try {
    const targetUserId = c.req.param('userId');
    const userId = getUserId(c);

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    await c.env.DB.prepare(`
      DELETE FROM chat_user_blocks WHERE blocker_id = ? AND blocked_id = ?
    `).bind(userId, targetUserId).run();

    return c.json({ success: true, message: 'User unblocked' });
  } catch (error) {
    console.error('Error unblocking user:', error);
    return c.json({ success: false, error: 'Failed to unblock user' }, 500);
  }
});

// Get blocked users
chatApp.get('/blocked', async (c) => {
  try {
    const userId = getUserId(c);

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    const blocked = await c.env.DB.prepare(`
      SELECT cub.id, cub.reason, cub.created_at, u.id as user_id, u.name, u.avatar_url
      FROM chat_user_blocks cub
      JOIN users u ON cub.blocked_id = u.id
      WHERE cub.blocker_id = ?
      ORDER BY cub.created_at DESC
    `).bind(userId).all();

    return c.json({
      success: true,
      data: blocked.results.map((b: Record<string, unknown>) => ({
        id: b.id,
        userId: b.user_id,
        name: b.name,
        avatarUrl: b.avatar_url,
        reason: b.reason,
        blockedAt: b.created_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching blocked users:', error);
    return c.json({ success: false, error: 'Failed to fetch blocked users' }, 500);
  }
});

// =============================================
// TYPING INDICATORS (Polling)
// =============================================

// Set typing indicator
chatApp.post('/rooms/:id/typing', async (c) => {
  try {
    const roomId = c.req.param('id');
    const userId = getUserId(c);

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    // Set typing indicator with 5 second expiry
    await c.env.DB.prepare(`
      INSERT INTO chat_typing_indicators (id, room_id, user_id, started_at, expires_at)
      VALUES (?, ?, ?, datetime('now'), datetime('now', '+5 seconds'))
      ON CONFLICT(room_id, user_id) DO UPDATE SET
        started_at = datetime('now'),
        expires_at = datetime('now', '+5 seconds')
    `).bind(generateId('typing'), roomId, userId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error setting typing:', error);
    return c.json({ success: false, error: 'Failed to set typing' }, 500);
  }
});

// Get typing users for a room
chatApp.get('/rooms/:id/typing', async (c) => {
  try {
    const roomId = c.req.param('id');
    const userId = getUserId(c);

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    // Clean up expired indicators
    await c.env.DB.prepare(`
      DELETE FROM chat_typing_indicators WHERE expires_at < datetime('now')
    `).run();

    // Get active typing users (excluding self)
    const typing = await c.env.DB.prepare(`
      SELECT cti.user_id, u.name
      FROM chat_typing_indicators cti
      JOIN users u ON cti.user_id = u.id
      WHERE cti.room_id = ? AND cti.user_id != ? AND cti.expires_at > datetime('now')
    `).bind(roomId, userId).all();

    return c.json({
      success: true,
      data: typing.results.map((t: Record<string, unknown>) => ({
        id: t.user_id,
        name: t.name,
      })),
    });
  } catch (error) {
    console.error('Error getting typing users:', error);
    return c.json({ success: false, error: 'Failed to get typing users' }, 500);
  }
});

// =============================================
// POLLING ENDPOINT
// =============================================

// Poll for new messages (alternative to WebSocket)
chatApp.get('/rooms/:id/poll', async (c) => {
  try {
    const roomId = c.req.param('id');
    const userId = getUserId(c);
    const since = c.req.query('since'); // ISO timestamp

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    // Verify membership
    const membership = await c.env.DB.prepare(`
      SELECT * FROM chat_room_members WHERE room_id = ? AND user_id = ?
    `).bind(roomId, userId).first();

    if (!membership) {
      return c.json({ success: false, error: 'Not a member of this room' }, 403);
    }

    // Get new messages since timestamp
    const messages = await c.env.DB.prepare(`
      SELECT
        cm.id, cm.sender_id, cm.content, cm.content_type, cm.is_edited, cm.is_deleted, cm.created_at,
        u.name as sender_name, u.avatar_url as sender_avatar
      FROM chat_messages cm
      LEFT JOIN users u ON cm.sender_id = u.id
      WHERE cm.room_id = ? AND cm.created_at > ?
      ORDER BY cm.created_at ASC
      LIMIT 100
    `).bind(roomId, since || '1970-01-01').all();

    // Get typing users
    const typing = await c.env.DB.prepare(`
      SELECT cti.user_id, u.name
      FROM chat_typing_indicators cti
      JOIN users u ON cti.user_id = u.id
      WHERE cti.room_id = ? AND cti.user_id != ? AND cti.expires_at > datetime('now')
    `).bind(roomId, userId).all();

    return c.json({
      success: true,
      data: {
        messages: messages.results.map((msg: Record<string, unknown>) => ({
          id: msg.id,
          senderId: msg.sender_id,
          content: msg.is_deleted ? '[Message deleted]' : msg.content,
          contentType: msg.content_type,
          isEdited: !!msg.is_edited,
          isDeleted: !!msg.is_deleted,
          createdAt: msg.created_at,
          sender: {
            id: msg.sender_id,
            name: msg.sender_name,
            avatarUrl: msg.sender_avatar,
          },
        })),
        typingUsers: typing.results.map((t: Record<string, unknown>) => ({
          id: t.user_id,
          name: t.name,
        })),
        serverTime: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error polling:', error);
    return c.json({ success: false, error: 'Failed to poll' }, 500);
  }
});

export { chatApp };
