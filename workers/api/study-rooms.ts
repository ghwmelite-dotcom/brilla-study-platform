import { Hono } from 'hono';
import { Env } from './index';
import { requireAuth } from './auth-middleware';
import { getChatModel } from './ai-models';

// Identity shape read by the routes below. requireAuth sets `user` to the JWT
// payload keyed by userId; the adapter middleware re-adds the legacy `id` key.
interface StudyRoomUser {
  userId: string;
  id?: string;
  email?: string;
  role?: string;
}

export const studyRoomsApp = new Hono<{ Bindings: Env; Variables: { user: StudyRoomUser } }>();

// Types
interface CreateSessionRequest {
  title: string;
  description?: string;
  subjectId?: string;
  topicId?: string;
  examType: string;
  maxParticipants?: number;
  aiEnabled?: boolean;
  whiteboardEnabled?: boolean;
  voiceEnabled?: boolean;
  recordingEnabled?: boolean;
  isPublic?: boolean;
  password?: string;
  roomCode?: string;
}

// Auth: shared middleware (HS256-pinned signature verify + per-request DB
// status/is_active/role re-check).
// Public-route audit: every route below reads or writes per-user session state
// and was already behind the previous blanket middleware. The room-code join is
// authenticated by design (the frontend always attaches Bearer via
// src/services/api.ts) — no public routes.
studyRoomsApp.use('*', requireAuth);
// Adapter: legacy routes read c.get('user').id; the shared middleware keys the
// JWT payload by userId, so re-add `id` for the routes below.
studyRoomsApp.use('*', async (c, next) => {
  const user = c.get('user');
  c.set('user', { ...user, id: user.userId });
  await next();
});

// Get list of public study rooms
studyRoomsApp.get('/', async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT
        ss.id,
        ss.title,
        ss.description,
        ss.room_code as roomCode,
        ss.exam_type as examType,
        ss.max_participants as maxParticipants,
        ss.voice_enabled as voiceEnabled,
        ss.whiteboard_enabled as whiteboardEnabled,
        ss.ai_tutor_enabled as aiEnabled,
        ss.recording_enabled as recordingEnabled,
        ss.is_public as isPublic,
        ss.status,
        ss.created_at as createdAt,
        s.name as subject,
        s.id as subjectId,
        t.name as topic,
        t.id as topicId,
        u.name as hostName,
        ss.owner_id as hostId,
        (SELECT COUNT(*) FROM study_session_participants WHERE session_id = ss.id AND is_active = 1) as participantCount
      FROM study_sessions ss
      LEFT JOIN subjects s ON ss.subject_id = s.id
      LEFT JOIN topics t ON ss.topic_id = t.id
      LEFT JOIN users u ON ss.owner_id = u.id
      WHERE ss.is_public = 1 AND ss.status IN ('waiting', 'active')
      ORDER BY ss.created_at DESC
      LIMIT 50
    `).all();

    const sessions = result.results.map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      roomCode: row.roomCode,
      examType: row.examType,
      maxParticipants: row.maxParticipants || 5,
      voiceEnabled: Boolean(row.voiceEnabled),
      whiteboardEnabled: Boolean(row.whiteboardEnabled),
      aiEnabled: Boolean(row.aiEnabled),
      recordingEnabled: Boolean(row.recordingEnabled),
      isPublic: Boolean(row.isPublic),
      status: row.status,
      createdAt: row.createdAt,
      subject: row.subject || 'General',
      subjectId: row.subjectId,
      topic: row.topic || 'Study Session',
      topicId: row.topicId,
      hostName: row.hostName,
      hostId: row.hostId,
      participants: [], // Will be populated separately
      participantCount: row.participantCount || 0,
    }));

    return c.json({ success: true, data: sessions });
  } catch (error: any) {
    console.error('Failed to fetch study rooms:', error);
    return c.json({ success: false, error: 'Failed to fetch study rooms' }, 500);
  }
});

// Create a new study room
studyRoomsApp.post('/', async (c) => {
  const user = c.get('user') as any;

  try {
    const body = await c.req.json<CreateSessionRequest>();

    if (!body.title?.trim()) {
      return c.json({ success: false, error: 'Title is required' }, 400);
    }

    const sessionId = crypto.randomUUID();
    const roomCode = body.roomCode || generateRoomCode();
    const participantColor = getRandomColor();

    // Create session
    await c.env.DB.prepare(`
      INSERT INTO study_sessions (
        id, owner_id, room_code, title, description, subject_id, topic_id,
        exam_type, max_participants, voice_enabled, whiteboard_enabled,
        ai_tutor_enabled, recording_enabled, is_public, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'waiting', datetime('now'))
    `).bind(
      sessionId,
      user.id,
      roomCode,
      body.title,
      body.description || null,
      body.subjectId || null,
      body.topicId || null,
      body.examType || 'WASSCE',
      body.maxParticipants || 5,
      body.voiceEnabled !== false ? 1 : 0,
      body.whiteboardEnabled !== false ? 1 : 0,
      body.aiEnabled !== false ? 1 : 0,
      body.recordingEnabled ? 1 : 0,
      body.isPublic !== false ? 1 : 0
    ).run();

    // Add creator as host participant
    await c.env.DB.prepare(`
      INSERT INTO study_session_participants (
        id, session_id, user_id, role, drawing_color, joined_at, is_active
      ) VALUES (?, ?, ?, 'host', ?, datetime('now'), 1)
    `).bind(
      crypto.randomUUID(),
      sessionId,
      user.id,
      participantColor
    ).run();

    // Get user info
    const userResult = await c.env.DB.prepare(`
      SELECT name, avatar_url FROM users WHERE id = ?
    `).bind(user.id).first();

    const session = {
      id: sessionId,
      title: body.title,
      description: body.description,
      roomCode,
      examType: body.examType || 'WASSCE',
      maxParticipants: body.maxParticipants || 5,
      voiceEnabled: body.voiceEnabled !== false,
      whiteboardEnabled: body.whiteboardEnabled !== false,
      aiEnabled: body.aiEnabled !== false,
      recordingEnabled: Boolean(body.recordingEnabled),
      isPublic: body.isPublic !== false,
      status: 'waiting',
      subject: 'General',
      topic: 'Study Session',
      hostId: user.id,
      participants: [{
        id: user.id,
        name: (userResult as any)?.name || 'Host',
        avatar: (userResult as any)?.avatar_url,
        color: participantColor,
        role: 'host',
        isSpeaking: false,
        micEnabled: false,
        handRaised: false,
      }],
      createdAt: new Date().toISOString(),
    };

    return c.json({ success: true, data: session });
  } catch (error: any) {
    console.error('Failed to create study room:', error);
    return c.json({ success: false, error: 'Failed to create study room' }, 500);
  }
});

// Join a study room
studyRoomsApp.post('/:roomCode/join', async (c) => {
  const user = c.get('user') as any;
  const roomCode = c.req.param('roomCode').toUpperCase();

  try {
    // Find session
    const session = await c.env.DB.prepare(`
      SELECT
        ss.*,
        s.name as subject_name,
        t.name as topic_name,
        (SELECT COUNT(*) FROM study_session_participants WHERE session_id = ss.id AND is_active = 1) as participant_count
      FROM study_sessions ss
      LEFT JOIN subjects s ON ss.subject_id = s.id
      LEFT JOIN topics t ON ss.topic_id = t.id
      WHERE ss.room_code = ?
    `).bind(roomCode).first();

    if (!session) {
      return c.json({ success: false, error: 'Room not found' }, 404);
    }

    if ((session as any).status === 'ended') {
      return c.json({ success: false, error: 'This session has ended' }, 400);
    }

    if ((session as any).participant_count >= ((session as any).max_participants || 5)) {
      return c.json({ success: false, error: 'Room is full' }, 400);
    }

    // Check if already in session
    const existingParticipant = await c.env.DB.prepare(`
      SELECT id FROM study_session_participants
      WHERE session_id = ? AND user_id = ? AND is_active = 1
    `).bind((session as any).id, user.id).first();

    const participantColor = getRandomColor();

    if (!existingParticipant) {
      // Add as participant
      await c.env.DB.prepare(`
        INSERT INTO study_session_participants (
          id, session_id, user_id, role, drawing_color, joined_at, is_active
        ) VALUES (?, ?, ?, 'participant', ?, datetime('now'), 1)
      `).bind(
        crypto.randomUUID(),
        (session as any).id,
        user.id,
        participantColor
      ).run();
    }

    // Get all participants
    const participantsResult = await c.env.DB.prepare(`
      SELECT
        ssp.user_id as id,
        u.name,
        u.avatar_url as avatar,
        ssp.drawing_color as color,
        ssp.role,
        ssp.mic_enabled as micEnabled,
        ssp.hand_raised as handRaised,
        ssp.is_speaking as isSpeaking
      FROM study_session_participants ssp
      JOIN users u ON ssp.user_id = u.id
      WHERE ssp.session_id = ? AND ssp.is_active = 1
    `).bind((session as any).id).all();

    const responseData = {
      id: (session as any).id,
      title: (session as any).title,
      description: (session as any).description,
      roomCode: (session as any).room_code,
      examType: (session as any).exam_type,
      maxParticipants: (session as any).max_participants || 5,
      voiceEnabled: Boolean((session as any).voice_enabled),
      whiteboardEnabled: Boolean((session as any).whiteboard_enabled),
      aiEnabled: Boolean((session as any).ai_tutor_enabled),
      recordingEnabled: Boolean((session as any).recording_enabled),
      isPublic: Boolean((session as any).is_public),
      status: (session as any).status,
      subject: (session as any).subject_name || 'General',
      topic: (session as any).topic_name || 'Study Session',
      hostId: (session as any).owner_id,
      participants: participantsResult.results.map((p: any) => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        color: p.color || participantColor,
        role: p.role,
        isSpeaking: Boolean(p.isSpeaking),
        micEnabled: Boolean(p.micEnabled),
        handRaised: Boolean(p.handRaised),
      })),
      createdAt: (session as any).created_at,
    };

    return c.json({ success: true, data: responseData });
  } catch (error: any) {
    console.error('Failed to join study room:', error);
    return c.json({ success: false, error: 'Failed to join study room' }, 500);
  }
});

// Leave a study room
studyRoomsApp.post('/:roomCode/leave', async (c) => {
  const user = c.get('user') as any;
  const roomCode = c.req.param('roomCode').toUpperCase();

  try {
    // Find session
    const session = await c.env.DB.prepare(`
      SELECT id, owner_id FROM study_sessions WHERE room_code = ?
    `).bind(roomCode).first();

    if (!session) {
      return c.json({ success: false, error: 'Room not found' }, 404);
    }

    // Mark participant as inactive
    await c.env.DB.prepare(`
      UPDATE study_session_participants
      SET is_active = 0, left_at = datetime('now')
      WHERE session_id = ? AND user_id = ?
    `).bind((session as any).id, user.id).run();

    // If host left and no other active participants, end session
    if ((session as any).owner_id === user.id) {
      const activeCount = await c.env.DB.prepare(`
        SELECT COUNT(*) as count FROM study_session_participants
        WHERE session_id = ? AND is_active = 1
      `).bind((session as any).id).first();

      if ((activeCount as any).count === 0) {
        await c.env.DB.prepare(`
          UPDATE study_sessions SET status = 'ended', ended_at = datetime('now')
          WHERE id = ?
        `).bind((session as any).id).run();
      }
    }

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Failed to leave study room:', error);
    return c.json({ success: false, error: 'Failed to leave study room' }, 500);
  }
});

// Update participant status
studyRoomsApp.post('/:roomCode/update-status', async (c) => {
  const user = c.get('user') as any;
  const roomCode = c.req.param('roomCode').toUpperCase();

  try {
    const body = await c.req.json();

    // Find session
    const session = await c.env.DB.prepare(`
      SELECT id FROM study_sessions WHERE room_code = ?
    `).bind(roomCode).first();

    if (!session) {
      return c.json({ success: false, error: 'Room not found' }, 404);
    }

    // Build update query
    const updates: string[] = [];
    const values: any[] = [];

    if (body.micEnabled !== undefined) {
      updates.push('mic_enabled = ?');
      values.push(body.micEnabled ? 1 : 0);
    }
    if (body.handRaised !== undefined) {
      updates.push('hand_raised = ?');
      values.push(body.handRaised ? 1 : 0);
    }
    if (body.isSpeaking !== undefined) {
      updates.push('is_speaking = ?');
      values.push(body.isSpeaking ? 1 : 0);
    }
    if (body.cursorX !== undefined && body.cursorY !== undefined) {
      updates.push('cursor_x = ?, cursor_y = ?');
      values.push(body.cursorX, body.cursorY);
    }

    if (updates.length > 0) {
      updates.push('last_heartbeat = datetime(\'now\')');
      values.push((session as any).id, user.id);

      await c.env.DB.prepare(`
        UPDATE study_session_participants
        SET ${updates.join(', ')}
        WHERE session_id = ? AND user_id = ?
      `).bind(...values).run();
    }

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Failed to update status:', error);
    return c.json({ success: false, error: 'Failed to update status' }, 500);
  }
});

// Send message
studyRoomsApp.post('/:roomCode/messages', async (c) => {
  const user = c.get('user') as any;
  const roomCode = c.req.param('roomCode').toUpperCase();

  try {
    const body = await c.req.json();

    // Find session
    const session = await c.env.DB.prepare(`
      SELECT id FROM study_sessions WHERE room_code = ?
    `).bind(roomCode).first();

    if (!session) {
      return c.json({ success: false, error: 'Room not found' }, 404);
    }

    const messageId = crypto.randomUUID();

    await c.env.DB.prepare(`
      INSERT INTO study_session_messages (
        id, session_id, sender_id, message_type, content, created_at
      ) VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      messageId,
      (session as any).id,
      user.id,
      body.type || 'text',
      body.content
    ).run();

    return c.json({ success: true, data: { id: messageId } });
  } catch (error: any) {
    console.error('Failed to send message:', error);
    return c.json({ success: false, error: 'Failed to send message' }, 500);
  }
});

// Ask AI
studyRoomsApp.post('/:roomCode/ask-ai', async (c) => {
  const user = c.get('user') as any;
  const roomCode = c.req.param('roomCode').toUpperCase();

  try {
    const body = await c.req.json();

    // Find session
    const session = await c.env.DB.prepare(`
      SELECT id, subject_id, topic_id, exam_type, ai_tutor_enabled
      FROM study_sessions WHERE room_code = ?
    `).bind(roomCode).first();

    if (!session) {
      return c.json({ success: false, error: 'Room not found' }, 404);
    }

    if (!(session as any).ai_tutor_enabled) {
      return c.json({ success: false, error: 'AI is not enabled for this session' }, 400);
    }

    // Get subject/topic context
    let context = '';
    if ((session as any).subject_id) {
      const subject = await c.env.DB.prepare(`
        SELECT name FROM subjects WHERE id = ?
      `).bind((session as any).subject_id).first();
      if (subject) {
        context += `Subject: ${(subject as any).name}. `;
      }
    }
    if ((session as any).topic_id) {
      const topic = await c.env.DB.prepare(`
        SELECT name FROM topics WHERE id = ?
      `).bind((session as any).topic_id).first();
      if (topic) {
        context += `Topic: ${(topic as any).name}. `;
      }
    }
    context += `Exam: ${(session as any).exam_type || 'General'}`;

    // Generate AI response
    const prompt = `You are Brilla AI, a helpful study tutor for Ghanaian students. You are helping in a collaborative study room.

Context: ${context}

Student's question: ${body.question}

Provide a clear, educational response. Be encouraging and helpful. If the question is about a specific concept, explain it step by step. Keep your response concise but comprehensive.`;

    const aiResponse = await c.env.AI.run(getChatModel(c.env) as BaseAiTextGenerationModels, {
      messages: [
        { role: 'system', content: 'You are Brilla AI, a helpful and encouraging study tutor.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 500,
    });

    const response = (aiResponse as any).response || 'I apologize, but I could not generate a response. Please try again.';

    // Save the interaction
    await c.env.DB.prepare(`
      INSERT INTO study_session_messages (
        id, session_id, sender_id, message_type, content, created_at
      ) VALUES (?, ?, 'ai', 'ai_response', ?, datetime('now'))
    `).bind(
      crypto.randomUUID(),
      (session as any).id,
      response
    ).run();

    return c.json({ success: true, data: { response } });
  } catch (error: any) {
    console.error('Failed to get AI response:', error);
    return c.json({ success: false, error: 'Failed to get AI response' }, 500);
  }
});

// Get updates (polling endpoint)
studyRoomsApp.get('/:roomCode/updates', async (c) => {
  const user = c.get('user') as any;
  const roomCode = c.req.param('roomCode').toUpperCase();
  const lastMessageId = c.req.query('lastMessageId');

  try {
    // Find session
    const session = await c.env.DB.prepare(`
      SELECT id, status FROM study_sessions WHERE room_code = ?
    `).bind(roomCode).first();

    if (!session) {
      return c.json({ success: false, error: 'Room not found' }, 404);
    }

    // Get participants
    const participantsResult = await c.env.DB.prepare(`
      SELECT
        ssp.user_id as id,
        u.name,
        u.avatar_url as avatar,
        ssp.drawing_color as color,
        ssp.role,
        ssp.mic_enabled as micEnabled,
        ssp.hand_raised as handRaised,
        ssp.is_speaking as isSpeaking,
        ssp.cursor_x as cursorX,
        ssp.cursor_y as cursorY
      FROM study_session_participants ssp
      JOIN users u ON ssp.user_id = u.id
      WHERE ssp.session_id = ? AND ssp.is_active = 1
    `).bind((session as any).id).all();

    // Get new messages
    let messagesQuery = `
      SELECT
        m.id,
        m.sender_id as senderId,
        COALESCE(u.name, 'Brilla AI') as senderName,
        m.content,
        m.message_type as type,
        m.created_at as timestamp
      FROM study_session_messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.session_id = ?
    `;

    if (lastMessageId) {
      messagesQuery += ` AND m.id > ? ORDER BY m.created_at ASC LIMIT 50`;
    } else {
      messagesQuery += ` ORDER BY m.created_at DESC LIMIT 50`;
    }

    const messagesResult = lastMessageId
      ? await c.env.DB.prepare(messagesQuery).bind((session as any).id, lastMessageId).all()
      : await c.env.DB.prepare(messagesQuery).bind((session as any).id).all();

    // Update heartbeat
    await c.env.DB.prepare(`
      UPDATE study_session_participants
      SET last_heartbeat = datetime('now')
      WHERE session_id = ? AND user_id = ?
    `).bind((session as any).id, user.id).run();

    return c.json({
      success: true,
      data: {
        sessionStatus: (session as any).status,
        participants: participantsResult.results.map((p: any) => ({
          id: p.id,
          name: p.name,
          avatar: p.avatar,
          color: p.color,
          role: p.role,
          isSpeaking: Boolean(p.isSpeaking),
          micEnabled: Boolean(p.micEnabled),
          handRaised: Boolean(p.handRaised),
          cursorX: p.cursorX,
          cursorY: p.cursorY,
        })),
        newMessages: messagesResult.results.map((m: any) => ({
          id: m.id,
          senderId: m.senderId,
          senderName: m.senderName,
          content: m.content,
          type: m.type,
          timestamp: new Date(m.timestamp),
        })),
      },
    });
  } catch (error: any) {
    console.error('Failed to get updates:', error);
    return c.json({ success: false, error: 'Failed to get updates' }, 500);
  }
});

// Drawing event
studyRoomsApp.post('/:roomCode/drawing', async (c) => {
  const user = c.get('user') as any;
  const roomCode = c.req.param('roomCode').toUpperCase();

  try {
    const body = await c.req.json();

    // Find session
    const session = await c.env.DB.prepare(`
      SELECT id FROM study_sessions WHERE room_code = ?
    `).bind(roomCode).first();

    if (!session) {
      return c.json({ success: false, error: 'Room not found' }, 404);
    }

    // Store drawing event
    await c.env.DB.prepare(`
      INSERT INTO study_session_events (
        id, session_id, user_id, event_type, event_data, created_at
      ) VALUES (?, ?, ?, 'draw', ?, datetime('now'))
    `).bind(
      crypto.randomUUID(),
      (session as any).id,
      user.id,
      JSON.stringify(body)
    ).run();

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Failed to save drawing:', error);
    return c.json({ success: false, error: 'Failed to save drawing' }, 500);
  }
});

// Helper functions
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 32 chars, excludes confusing ones
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  // 256 % 32 === 0, so the modulo introduces no bias
  return Array.from(bytes, (b) => chars.charAt(b % chars.length)).join('');
}

function getRandomColor(): string {
  const colors = [
    '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export default studyRoomsApp;
