import { Hono } from 'hono';
import type { Env } from './index';
import { requireAuth } from './auth-middleware';
import { getChatModel, unwrapAiText } from './ai-models';
import { formatUntrustedAiData, UNTRUSTED_AI_DATA_INSTRUCTION } from './ai-safety';

// Identity shape read by the routes below. requireAuth sets `user` to the JWT
// payload (keyed by userId) with role refreshed from the DB; the adapter
// middleware re-adds the legacy `id` key the routes use.
interface TutorClassroomUser {
  userId: string;
  id?: string;
  email?: string;
  role?: string;
}

interface TutorAvailabilityRow {
  preferred_subjects: string | null;
  preferred_exam_types: string | null;
  preferred_difficulty_levels: string | null;
  max_observed_sessions: number;
  current_session_count: number;
  [key: string]: unknown;
}

const tutorClassroom = new Hono<{ Bindings: Env; Variables: { user: TutorClassroomUser } }>();

// Auth: shared middleware (HS256-pinned signature verify + per-request DB
// status/is_active/role re-check), mounted blanket.
// Public-route audit: every route in this module previously mounted a
// per-route auth or teacher gate, so all 27 routes already required a
// logged-in user (incl. the room-code join at
// /scheduled-sessions/join/:roomCode, which additionally checks participant
// membership). No public routes exist, so a blanket mount is behavior-
// equivalent to the previous per-route mounts. NOTE: the old per-route
// gates only checked c.get('user'), which nothing upstream ever set —
// these routes 401'd unconditionally before this fix.
tutorClassroom.use('*', requireAuth);
// Adapter: legacy routes read c.get('user').id; the shared middleware keys the
// JWT payload by userId, so re-add `id`.
tutorClassroom.use('*', async (c, next) => {
  const user = c.get('user');
  c.set('user', { ...user, id: user.userId });
  await next();
});

// Helper to generate unique IDs
function generateId(): string {
  return crypto.randomUUID().replace(/-/g, '');
}

// Helper to generate room codes
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 32 chars, excludes confusing ones
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  // 256 % 32 === 0, so the modulo introduces no bias
  return Array.from(bytes, (b) => chars.charAt(b % chars.length)).join('');
}

// Role gate - requires teacher or admin role. Runs after the blanket
// requireAuth + adapter above; user.role is fresh from the DB (not the JWT).
async function teacherMiddleware(c: any, next: () => Promise<void>) {
  const user = c.get('user');
  if (!user) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }
  if (user.role !== 'teacher' && user.role !== 'admin') {
    return c.json({ success: false, error: 'Teacher access required' }, 403);
  }
  await next();
}

// =====================================================
// TUTOR AVAILABILITY ENDPOINTS
// =====================================================

// Get tutor's availability settings
tutorClassroom.get('/availability', teacherMiddleware, async (c) => {
  const user = c.get('user');
  const db = c.env.DB;

  try {
    const availability = await db.prepare(`
      SELECT * FROM tutor_availability WHERE tutor_id = ?
    `).bind(user.id).first<TutorAvailabilityRow>();

    if (!availability) {
      // Return defaults if no settings exist
      return c.json({
        success: true,
        availability: {
          accepting_handoffs: true,
          accepting_observation: true,
          max_observed_sessions: 5,
          is_online: false,
          preferred_subjects: [],
          preferred_exam_types: [],
          notify_on_handoff_request: true,
          notify_on_high_struggle: true,
          min_struggle_score_notify: 70,
        }
      });
    }

    return c.json({
      success: true,
      availability: {
        ...availability,
        preferred_subjects: JSON.parse(availability.preferred_subjects || '[]'),
        preferred_exam_types: JSON.parse(availability.preferred_exam_types || '[]'),
        preferred_difficulty_levels: JSON.parse(availability.preferred_difficulty_levels || '[]'),
      }
    });
  } catch (error) {
    console.error('Get availability error:', error);
    return c.json({ success: false, error: 'Failed to get availability' }, 500);
  }
});

// Update tutor's availability settings
tutorClassroom.post('/availability', teacherMiddleware, async (c) => {
  const user = c.get('user');
  const db = c.env.DB;
  const body = await c.req.json();

  try {
    const existing = await db.prepare(`
      SELECT id FROM tutor_availability WHERE tutor_id = ?
    `).bind(user.id).first();

    if (existing) {
      // Update existing
      await db.prepare(`
        UPDATE tutor_availability SET
          accepting_handoffs = ?,
          accepting_observation = ?,
          max_observed_sessions = ?,
          preferred_subjects = ?,
          preferred_exam_types = ?,
          preferred_difficulty_levels = ?,
          notify_on_handoff_request = ?,
          notify_on_high_struggle = ?,
          min_struggle_score_notify = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE tutor_id = ?
      `).bind(
        body.accepting_handoffs ?? 1,
        body.accepting_observation ?? 1,
        body.max_observed_sessions ?? 5,
        JSON.stringify(body.preferred_subjects || []),
        JSON.stringify(body.preferred_exam_types || []),
        JSON.stringify(body.preferred_difficulty_levels || []),
        body.notify_on_handoff_request ?? 1,
        body.notify_on_high_struggle ?? 1,
        body.min_struggle_score_notify ?? 70,
        user.id
      ).run();
    } else {
      // Create new
      await db.prepare(`
        INSERT INTO tutor_availability (
          id, tutor_id, accepting_handoffs, accepting_observation, max_observed_sessions,
          preferred_subjects, preferred_exam_types, preferred_difficulty_levels,
          notify_on_handoff_request, notify_on_high_struggle, min_struggle_score_notify
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        generateId(),
        user.id,
        body.accepting_handoffs ?? 1,
        body.accepting_observation ?? 1,
        body.max_observed_sessions ?? 5,
        JSON.stringify(body.preferred_subjects || []),
        JSON.stringify(body.preferred_exam_types || []),
        JSON.stringify(body.preferred_difficulty_levels || []),
        body.notify_on_handoff_request ?? 1,
        body.notify_on_high_struggle ?? 1,
        body.min_struggle_score_notify ?? 70
      ).run();
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Update availability error:', error);
    return c.json({ success: false, error: 'Failed to update availability' }, 500);
  }
});

// Update online status (heartbeat)
tutorClassroom.post('/availability/heartbeat', teacherMiddleware, async (c) => {
  const user = c.get('user');
  const db = c.env.DB;

  try {
    await db.prepare(`
      UPDATE tutor_availability SET
        is_online = 1,
        last_heartbeat = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE tutor_id = ?
    `).bind(user.id).run();

    // Also update current session count
    const observationCount = await db.prepare(`
      SELECT COUNT(*) as count FROM tutor_observations
      WHERE tutor_id = ? AND is_active = 1
    `).bind(user.id).first();

    await db.prepare(`
      UPDATE tutor_availability SET current_session_count = ?, updated_at = CURRENT_TIMESTAMP WHERE tutor_id = ?
    `).bind(observationCount?.count || 0, user.id).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Heartbeat error:', error);
    return c.json({ success: false, error: 'Heartbeat failed' }, 500);
  }
});

// =====================================================
// OBSERVABLE SESSIONS ENDPOINTS
// =====================================================

// Get list of active AI sessions available for observation
tutorClassroom.get('/observable-sessions', teacherMiddleware, async (c) => {
  const user = c.get('user');
  const db = c.env.DB;
  const { subject_id, exam_type, min_struggle_score, page = '1', limit = '20' } = c.req.query();

  try {
    let query = `
      SELECT
        acs.*,
        CASE WHEN to2.id IS NOT NULL THEN 1 ELSE 0 END as is_observing
      FROM ai_classroom_sessions acs
      LEFT JOIN tutor_observations to2 ON to2.ai_session_id = acs.id AND to2.tutor_id = ? AND to2.is_active = 1
      WHERE acs.is_active = 1 AND acs.visibility = 'public'
    `;
    const params: any[] = [user.id];

    if (subject_id) {
      query += ` AND acs.subject_id = ?`;
      params.push(subject_id);
    }

    if (exam_type) {
      query += ` AND acs.exam_type = ?`;
      params.push(exam_type);
    }

    if (min_struggle_score) {
      query += ` AND acs.struggle_score >= ?`;
      params.push(parseFloat(min_struggle_score));
    }

    query += ` ORDER BY acs.struggle_score DESC, acs.last_activity_at DESC`;
    query += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const sessions = await db.prepare(query).bind(...params).all();

    return c.json({
      success: true,
      sessions: sessions.results || [],
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Get observable sessions error:', error);
    return c.json({ success: false, error: 'Failed to get sessions' }, 500);
  }
});

// Get full context of a specific session
tutorClassroom.get('/observable-sessions/:sessionId', teacherMiddleware, async (c) => {
  const { sessionId } = c.req.param();
  const db = c.env.DB;

  try {
    const session = await db.prepare(`
      SELECT * FROM ai_classroom_sessions WHERE id = ? AND visibility = 'public' AND is_active = 1
    `).bind(sessionId).first();

    if (!session) {
      return c.json({ success: false, error: 'Session not found' }, 404);
    }

    // Get recent events
    const events = await db.prepare(`
      SELECT * FROM tutor_classroom_events
      WHERE ai_session_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).bind(sessionId).all();

    return c.json({
      success: true,
      session,
      events: events.results || []
    });
  } catch (error) {
    console.error('Get session context error:', error);
    return c.json({ success: false, error: 'Failed to get session' }, 500);
  }
});

// Start observing a session
tutorClassroom.post('/observable-sessions/:sessionId/observe', teacherMiddleware, async (c) => {
  const user = c.get('user');
  const { sessionId } = c.req.param();
  const db = c.env.DB;

  try {
    const observable = await db.prepare(`
      SELECT 1 FROM ai_classroom_sessions
      WHERE id = ? AND visibility = 'public' AND is_active = 1
    `).bind(sessionId).first();
    if (!observable) return c.json({ success: false, error: 'Session not found' }, 404);

    // Check if already observing
    const existing = await db.prepare(`
      SELECT id FROM tutor_observations
      WHERE tutor_id = ? AND ai_session_id = ? AND is_active = 1
    `).bind(user.id, sessionId).first();

    if (existing) {
      return c.json({ success: true, message: 'Already observing' });
    }

    // Check max observations limit
    const availability = await db.prepare(`
      SELECT max_observed_sessions, current_session_count FROM tutor_availability WHERE tutor_id = ?
    `).bind(user.id).first<TutorAvailabilityRow>();

    if (availability && availability.current_session_count >= availability.max_observed_sessions) {
      return c.json({ success: false, error: 'Maximum observation limit reached' }, 400);
    }

    // Create observation
    const observationId = generateId();
    await db.prepare(`
      INSERT INTO tutor_observations (id, tutor_id, ai_session_id)
      VALUES (?, ?, ?)
    `).bind(observationId, user.id, sessionId).run();

    // Log event
    await db.prepare(`
      INSERT INTO tutor_classroom_events (id, ai_session_id, tutor_id, event_type)
      VALUES (?, ?, ?, 'observe_start')
    `).bind(generateId(), sessionId, user.id).run();

    // Update session count
    await db.prepare(`
      UPDATE tutor_availability SET current_session_count = current_session_count + 1, updated_at = CURRENT_TIMESTAMP WHERE tutor_id = ?
    `).bind(user.id).run();

    return c.json({ success: true, observationId });
  } catch (error) {
    console.error('Start observing error:', error);
    return c.json({ success: false, error: 'Failed to start observation' }, 500);
  }
});

// Stop observing a session
tutorClassroom.post('/observable-sessions/:sessionId/stop-observe', teacherMiddleware, async (c) => {
  const user = c.get('user');
  const { sessionId } = c.req.param();
  const db = c.env.DB;

  try {
    await db.prepare(`
      UPDATE tutor_observations SET is_active = 0, ended_at = CURRENT_TIMESTAMP
      WHERE tutor_id = ? AND ai_session_id = ? AND is_active = 1
    `).bind(user.id, sessionId).run();

    // Log event
    await db.prepare(`
      INSERT INTO tutor_classroom_events (id, ai_session_id, tutor_id, event_type)
      VALUES (?, ?, ?, 'observe_end')
    `).bind(generateId(), sessionId, user.id).run();

    // Update session count
    await db.prepare(`
      UPDATE tutor_availability SET current_session_count = MAX(0, current_session_count - 1), updated_at = CURRENT_TIMESTAMP WHERE tutor_id = ?
    `).bind(user.id).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Stop observing error:', error);
    return c.json({ success: false, error: 'Failed to stop observation' }, 500);
  }
});

// Poll for updates on observed session
tutorClassroom.get('/observable-sessions/:sessionId/updates', teacherMiddleware, async (c) => {
  const user = c.get('user');
  const { sessionId } = c.req.param();
  const { last_event_id } = c.req.query();
  const db = c.env.DB;

  try {
    // Only the tutor actively observing this session may poll its private events.
    const session = await db.prepare(`
      SELECT acs.struggle_score, acs.current_phase, acs.lesson_progress_percent, acs.handoff_status,
             acs.last_ai_message, acs.last_student_response, acs.last_activity_at
      FROM ai_classroom_sessions acs
      JOIN tutor_observations observation
        ON observation.ai_session_id = acs.id
       AND observation.tutor_id = ?
       AND observation.is_active = 1
      WHERE acs.id = ? AND acs.is_active = 1
    `).bind(user.id, sessionId).first();
    if (!session) return c.json({ success: false, error: 'Session not found' }, 404);

    // Get new events since last poll
    let eventsQuery = `
      SELECT * FROM tutor_classroom_events
      WHERE ai_session_id = ?
    `;
    const params: any[] = [sessionId];

    if (last_event_id) {
      eventsQuery += ` AND id > ?`;
      params.push(last_event_id);
    }

    eventsQuery += ` ORDER BY created_at ASC LIMIT 50`;

    const events = await db.prepare(eventsQuery).bind(...params).all();

    return c.json({
      success: true,
      session,
      events: events.results || [],
      lastEventId: events.results?.length > 0 ? events.results[events.results.length - 1].id : last_event_id
    });
  } catch (error) {
    console.error('Poll updates error:', error);
    return c.json({ success: false, error: 'Failed to get updates' }, 500);
  }
});

// =====================================================
// HANDOFF ENDPOINTS
// =====================================================

// Suggest handoff to student (called by AI/system)
tutorClassroom.post('/ai-sessions/:sessionId/suggest-handoff', async (c) => {
  const user = c.get('user');
  const { sessionId } = c.req.param();
  const body = await c.req.json();
  const db = c.env.DB;

  try {
    const update = await db.prepare(`
      UPDATE ai_classroom_sessions SET
        handoff_status = 'suggested',
        handoff_reason = ?,
        handoff_suggested_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND student_id = ? AND is_active = 1
    `).bind(body.reason || 'struggling_with_concept', sessionId, user.id).run();
    if (update.meta.changes !== 1) return c.json({ success: false, error: 'Session not found' }, 404);

    // Log event
    await db.prepare(`
      INSERT INTO tutor_classroom_events (id, ai_session_id, event_type, event_data)
      VALUES (?, ?, 'handoff_suggest', ?)
    `).bind(generateId(), sessionId, JSON.stringify({ reason: body.reason })).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Suggest handoff error:', error);
    return c.json({ success: false, error: 'Failed to suggest handoff' }, 500);
  }
});

// Student requests a human tutor
tutorClassroom.post('/ai-sessions/:sessionId/request-handoff', async (c) => {
  const user = c.get('user');
  const { sessionId } = c.req.param();
  const body = await c.req.json();
  const db = c.env.DB;

  try {
    // Verify student owns this session
    const session = await db.prepare(`
      SELECT * FROM ai_classroom_sessions WHERE id = ? AND student_id = ?
    `).bind(sessionId, user.id).first();

    if (!session) {
      return c.json({ success: false, error: 'Session not found' }, 404);
    }

    await db.prepare(`
      UPDATE ai_classroom_sessions SET
        handoff_status = 'requested',
        handoff_reason = ?,
        handoff_requested_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(body.reason || 'student_requested', sessionId).run();

    // Log event
    await db.prepare(`
      INSERT INTO tutor_classroom_events (id, ai_session_id, student_id, event_type, event_data)
      VALUES (?, ?, ?, 'handoff_request', ?)
    `).bind(generateId(), sessionId, user.id, JSON.stringify({ reason: body.reason })).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Request handoff error:', error);
    return c.json({ success: false, error: 'Failed to request handoff' }, 500);
  }
});

// Get pending handoff requests for tutor
tutorClassroom.get('/handoff-requests', teacherMiddleware, async (c) => {
  const user = c.get('user');
  const db = c.env.DB;

  try {
    // Get tutor preferences
    const availability = await db.prepare(`
      SELECT preferred_subjects, preferred_exam_types FROM tutor_availability WHERE tutor_id = ?
    `).bind(user.id).first<TutorAvailabilityRow>();

    // Get sessions with handoff requested that match preferences
    let query = `
      SELECT * FROM ai_classroom_sessions
      WHERE handoff_status IN ('requested', 'suggested')
        AND is_active = 1
        AND tutor_id IS NULL
    `;

    // Filter by preferences if set
    if (availability?.preferred_subjects) {
      const subjects = JSON.parse(availability.preferred_subjects);
      if (subjects.length > 0) {
        query += ` AND subject_id IN (${subjects.map(() => '?').join(',')})`;
      }
    }

    query += ` ORDER BY handoff_requested_at DESC, struggle_score DESC LIMIT 20`;

    const sessions = await db.prepare(query).bind().all();

    return c.json({
      success: true,
      requests: sessions.results || []
    });
  } catch (error) {
    console.error('Get handoff requests error:', error);
    return c.json({ success: false, error: 'Failed to get requests' }, 500);
  }
});

// Tutor accepts handoff request
tutorClassroom.post('/handoff-requests/:sessionId/accept', teacherMiddleware, async (c) => {
  const user = c.get('user');
  const { sessionId } = c.req.param();
  const body = await c.req.json();
  const db = c.env.DB;

  try {
    // Get tutor info
    const tutor = await db.prepare(`
      SELECT id, name, avatar_url FROM users WHERE id = ?
    `).bind(user.id).first();

    // Update session with tutor
    const accepted = await db.prepare(`
      UPDATE ai_classroom_sessions SET
        handoff_status = 'connected',
        tutor_id = ?,
        tutor_name = ?,
        tutor_avatar_url = ?,
        tutor_joined_at = CURRENT_TIMESTAMP,
        tutor_mode = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
        AND tutor_id IS NULL
        AND is_active = 1
        AND handoff_status IN ('requested', 'suggested')
    `).bind(
      user.id,
      tutor?.name || 'Tutor',
      tutor?.avatar_url,
      body.mode || 'observe',
      sessionId
    ).run();
    if (accepted.meta.changes !== 1) {
      return c.json({ success: false, error: 'Handoff is no longer available' }, 409);
    }

    // Log event
    await db.prepare(`
      INSERT INTO tutor_classroom_events (id, ai_session_id, tutor_id, event_type, event_data, content)
      VALUES (?, ?, ?, 'handoff_accept', ?, ?)
    `).bind(
      generateId(),
      sessionId,
      user.id,
      JSON.stringify({ mode: body.mode }),
      body.message || null
    ).run();

    // Start observation
    await db.prepare(`
      INSERT INTO tutor_observations (id, tutor_id, ai_session_id)
      VALUES (?, ?, ?)
      ON CONFLICT(tutor_id, ai_session_id) DO UPDATE SET is_active = 1, started_at = CURRENT_TIMESTAMP
    `).bind(generateId(), user.id, sessionId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Accept handoff error:', error);
    return c.json({ success: false, error: 'Failed to accept handoff' }, 500);
  }
});

// Tutor declines handoff request
tutorClassroom.post('/handoff-requests/:sessionId/decline', teacherMiddleware, async (c) => {
  const user = c.get('user');
  const { sessionId } = c.req.param();
  const body = await c.req.json();
  const db = c.env.DB;

  try {
    // Log event (don't change session status, other tutors can still accept)
    await db.prepare(`
      INSERT INTO tutor_classroom_events (id, ai_session_id, tutor_id, event_type, event_data)
      VALUES (?, ?, ?, 'handoff_decline', ?)
    `).bind(generateId(), sessionId, user.id, JSON.stringify({ reason: body.reason })).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Decline handoff error:', error);
    return c.json({ success: false, error: 'Failed to decline' }, 500);
  }
});

// =====================================================
// CO-TEACHING ENDPOINTS
// =====================================================

// Tutor sends message to student
tutorClassroom.post('/ai-sessions/:sessionId/send-message', teacherMiddleware, async (c) => {
  const user = c.get('user');
  const { sessionId } = c.req.param();
  const body = await c.req.json();
  const db = c.env.DB;

  try {
    // Verify tutor is connected to this session
    const session = await db.prepare(`
      SELECT tutor_id FROM ai_classroom_sessions WHERE id = ? AND tutor_id = ?
    `).bind(sessionId, user.id).first();

    if (!session) {
      return c.json({ success: false, error: 'Not connected to this session' }, 403);
    }

    const eventId = generateId();
    await db.prepare(`
      INSERT INTO tutor_classroom_events (
        id, ai_session_id, tutor_id, event_type, content, content_type
      ) VALUES (?, ?, ?, 'message_sent', ?, ?)
    `).bind(
      eventId,
      sessionId,
      user.id,
      body.content,
      body.type || 'text'
    ).run();

    return c.json({ success: true, eventId });
  } catch (error) {
    console.error('Send message error:', error);
    return c.json({ success: false, error: 'Failed to send message' }, 500);
  }
});

// Tutor adds whiteboard annotation
tutorClassroom.post('/ai-sessions/:sessionId/add-annotation', teacherMiddleware, async (c) => {
  const user = c.get('user');
  const { sessionId } = c.req.param();
  const body = await c.req.json();
  const db = c.env.DB;

  try {
    const connected = await db.prepare('SELECT 1 FROM ai_classroom_sessions WHERE id = ? AND tutor_id = ? AND is_active = 1').bind(sessionId, user.id).first();
    if (!connected) return c.json({ success: false, error: 'Not connected to this session' }, 403);
    const eventId = generateId();
    await db.prepare(`
      INSERT INTO tutor_classroom_events (
        id, ai_session_id, tutor_id, event_type, annotation_type, annotation_data, annotation_color
      ) VALUES (?, ?, ?, 'annotation_added', ?, ?, ?)
    `).bind(
      eventId,
      sessionId,
      user.id,
      body.annotation_type,
      JSON.stringify(body.annotation_data),
      body.color || '#10b981'
    ).run();

    return c.json({ success: true, eventId });
  } catch (error) {
    console.error('Add annotation error:', error);
    return c.json({ success: false, error: 'Failed to add annotation' }, 500);
  }
});

// Tutor guides AI behavior
tutorClassroom.post('/ai-sessions/:sessionId/guide-ai', teacherMiddleware, async (c) => {
  const user = c.get('user');
  const { sessionId } = c.req.param();
  const body = await c.req.json();
  const db = c.env.DB;

  try {
    const connected = await db.prepare('SELECT 1 FROM ai_classroom_sessions WHERE id = ? AND tutor_id = ? AND is_active = 1').bind(sessionId, user.id).first();
    if (!connected) return c.json({ success: false, error: 'Not connected to this session' }, 403);
    const eventId = generateId();
    await db.prepare(`
      INSERT INTO tutor_classroom_events (
        id, ai_session_id, tutor_id, event_type, content, event_data, is_visible_to_student
      ) VALUES (?, ?, ?, 'ai_guidance_sent', ?, ?, 0)
    `).bind(
      eventId,
      sessionId,
      user.id,
      body.guidance,
      JSON.stringify({ details: body.details }),
    ).run();

    return c.json({ success: true, eventId });
  } catch (error) {
    console.error('Guide AI error:', error);
    return c.json({ success: false, error: 'Failed to guide AI' }, 500);
  }
});

// Change tutor mode (observe/co-teach/takeover)
tutorClassroom.post('/ai-sessions/:sessionId/change-mode', teacherMiddleware, async (c) => {
  const user = c.get('user');
  const { sessionId } = c.req.param();
  const body = await c.req.json();
  const db = c.env.DB;

  try {
    await db.prepare(`
      UPDATE ai_classroom_sessions SET tutor_mode = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND tutor_id = ?
    `).bind(body.mode, sessionId, user.id).run();

    // Log event
    await db.prepare(`
      INSERT INTO tutor_classroom_events (id, ai_session_id, tutor_id, event_type, event_data)
      VALUES (?, ?, ?, 'mode_change', ?)
    `).bind(generateId(), sessionId, user.id, JSON.stringify({ mode: body.mode })).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Change mode error:', error);
    return c.json({ success: false, error: 'Failed to change mode' }, 500);
  }
});

// Tutor leaves session
tutorClassroom.post('/ai-sessions/:sessionId/leave', teacherMiddleware, async (c) => {
  const user = c.get('user');
  const { sessionId } = c.req.param();
  const db = c.env.DB;

  try {
    // Clear tutor from session
    await db.prepare(`
      UPDATE ai_classroom_sessions SET
        tutor_id = NULL,
        tutor_name = NULL,
        tutor_mode = NULL,
        handoff_status = 'none',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND tutor_id = ?
    `).bind(sessionId, user.id).run();

    // End observation
    await db.prepare(`
      UPDATE tutor_observations SET is_active = 0, ended_at = CURRENT_TIMESTAMP
      WHERE tutor_id = ? AND ai_session_id = ?
    `).bind(user.id, sessionId).run();

    // Log event
    await db.prepare(`
      INSERT INTO tutor_classroom_events (id, ai_session_id, tutor_id, event_type)
      VALUES (?, ?, ?, 'session_end')
    `).bind(generateId(), sessionId, user.id).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Leave session error:', error);
    return c.json({ success: false, error: 'Failed to leave session' }, 500);
  }
});

// =====================================================
// SCHEDULED SESSIONS ENDPOINTS
// =====================================================

// Get tutor's scheduled sessions
tutorClassroom.get('/scheduled-sessions', teacherMiddleware, async (c) => {
  const user = c.get('user');
  const { upcoming, status } = c.req.query();
  const db = c.env.DB;

  try {
    let query = `
      SELECT scs.*, u.name as student_name, u.avatar_url as student_avatar
      FROM scheduled_classroom_sessions scs
      LEFT JOIN users u ON u.id = scs.student_id
      WHERE scs.tutor_id = ?
    `;
    const params: any[] = [user.id];

    if (upcoming === 'true') {
      query += ` AND scs.scheduled_datetime >= datetime('now')`;
    }

    if (status) {
      query += ` AND scs.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY scs.scheduled_datetime ASC`;

    const sessions = await db.prepare(query).bind(...params).all();

    return c.json({
      success: true,
      sessions: sessions.results || []
    });
  } catch (error) {
    console.error('Get scheduled sessions error:', error);
    return c.json({ success: false, error: 'Failed to get sessions' }, 500);
  }
});

// Create scheduled session
tutorClassroom.post('/scheduled-sessions', teacherMiddleware, async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const db = c.env.DB;

  try {
    const sessionId = generateId();
    const roomCode = generateRoomCode();

    await db.prepare(`
      INSERT INTO scheduled_classroom_sessions (
        id, tutoring_session_id, tutor_id, student_id, subject_id, subject_name,
        topic_id, topic_name, exam_type, title, description, objectives,
        scheduled_datetime, scheduled_duration_minutes, room_code,
        ai_copilot_enabled, ai_copilot_mode, whiteboard_enabled, voice_enabled
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      sessionId,
      body.tutoring_session_id || null,
      user.id,
      body.student_id,
      body.subject_id || null,
      body.subject_name || null,
      body.topic_id || null,
      body.topic_name || null,
      body.exam_type || null,
      body.title || 'Live Tutoring Session',
      body.description || null,
      JSON.stringify(body.objectives || []),
      body.scheduled_datetime,
      body.duration_minutes || 60,
      roomCode,
      body.ai_copilot_enabled ?? 1,
      body.ai_copilot_mode || 'assistant',
      body.whiteboard_enabled ?? 1,
      body.voice_enabled ?? 1
    ).run();

    return c.json({
      success: true,
      sessionId,
      roomCode
    });
  } catch (error) {
    console.error('Create scheduled session error:', error);
    return c.json({ success: false, error: 'Failed to create session' }, 500);
  }
});

// Start scheduled session
tutorClassroom.post('/scheduled-sessions/:id/start', teacherMiddleware, async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();
  const db = c.env.DB;

  try {
    const session = await db.prepare(`
      SELECT * FROM scheduled_classroom_sessions WHERE id = ? AND tutor_id = ?
    `).bind(id, user.id).first();

    if (!session) {
      return c.json({ success: false, error: 'Session not found' }, 404);
    }

    await db.prepare(`
      UPDATE scheduled_classroom_sessions SET
        status = 'active',
        started_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(id).run();

    return c.json({
      success: true,
      roomCode: session.room_code
    });
  } catch (error) {
    console.error('Start session error:', error);
    return c.json({ success: false, error: 'Failed to start session' }, 500);
  }
});

// Join scheduled session (for both tutor and student)
tutorClassroom.get('/scheduled-sessions/join/:roomCode', async (c) => {
  const user = c.get('user');
  const { roomCode } = c.req.param();
  const db = c.env.DB;

  try {
    const session = await db.prepare(`
      SELECT * FROM scheduled_classroom_sessions WHERE room_code = ?
    `).bind(roomCode).first();

    if (!session) {
      return c.json({ success: false, error: 'Session not found' }, 404);
    }

    // Verify user is participant
    if (session.tutor_id !== user.id && session.student_id !== user.id) {
      return c.json({ success: false, error: 'Not a participant' }, 403);
    }

    return c.json({
      success: true,
      session,
      role: session.tutor_id === user.id ? 'tutor' : 'student'
    });
  } catch (error) {
    console.error('Join session error:', error);
    return c.json({ success: false, error: 'Failed to join session' }, 500);
  }
});

// Request AI assistance during session
tutorClassroom.post('/scheduled-sessions/:id/ai-assist', async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();
  const body = await c.req.json();
  const db = c.env.DB;
  const AI = c.env.AI;

  try {
    const session = await db.prepare(`
      SELECT * FROM scheduled_classroom_sessions
      WHERE id = ? AND (tutor_id = ? OR student_id = ?)
    `).bind(id, user.id, user.id).first();

    if (!session) {
      return c.json({ success: false, error: 'Session not found' }, 404);
    }

    // Determine requester role
    const role = session.tutor_id === user.id ? 'tutor' : 'student';

    // Build AI prompt based on request type
    let systemPrompt = `You are an AI teaching assistant helping in a live tutoring session.
${UNTRUSTED_AI_DATA_INSTRUCTION}`;

    let userPrompt = body.prompt || '';

    switch (body.request_type) {
      case 'explain_concept':
        systemPrompt += '\nProvide a clear, concise explanation suitable for the student level.';
        userPrompt = `Explain: ${body.context || userPrompt}`;
        break;
      case 'generate_problem':
        systemPrompt += '\nGenerate a practice problem with a clear question. Do not provide the answer yet.';
        userPrompt = `Generate a ${body.difficulty || 'medium'} difficulty problem about: ${body.context || userPrompt}`;
        break;
      case 'check_answer':
        systemPrompt += '\nCheck if the answer is correct and provide feedback.';
        userPrompt = `Question: ${body.question}\nStudent answer: ${body.answer}\nIs this correct? Provide feedback.`;
        break;
      case 'provide_hint':
        systemPrompt += '\nProvide a helpful hint without giving away the full answer.';
        userPrompt = `Provide a hint for: ${body.context || userPrompt}`;
        break;
      default:
        break;
    }

    // Call AI
    const aiResponse = await AI.run(getChatModel(c.env), {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: formatUntrustedAiData('Tutoring session and request context', {
          session: { subject: session.subject_name, topic: session.topic_name, examType: session.exam_type },
          request: userPrompt,
        }) }
      ],
      max_tokens: 1000
    });

    const responseText = unwrapAiText(aiResponse) || 'Unable to generate response';

    // Log the interaction
    await db.prepare(`
      INSERT INTO session_ai_interactions (
        id, scheduled_session_id, requested_by, requester_role,
        request_type, request_context, request_prompt, ai_response
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      generateId(),
      id,
      user.id,
      role,
      body.request_type,
      JSON.stringify(body.context),
      userPrompt,
      responseText
    ).run();

    // Update metrics
    await db.prepare(`
      UPDATE scheduled_classroom_sessions SET
        ai_suggestions_given = ai_suggestions_given + 1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(id).run();

    return c.json({
      success: true,
      response: responseText,
      request_type: body.request_type
    });
  } catch (error) {
    console.error('AI assist error:', error);
    return c.json({ success: false, error: 'AI assistance failed' }, 500);
  }
});

// End scheduled session
tutorClassroom.post('/scheduled-sessions/:id/end', teacherMiddleware, async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();
  const body = await c.req.json();
  const db = c.env.DB;

  try {
    const session = await db.prepare(`
      SELECT started_at FROM scheduled_classroom_sessions WHERE id = ? AND tutor_id = ?
    `).bind(id, user.id).first<{ started_at: string }>();

    if (!session) {
      return c.json({ success: false, error: 'Session not found' }, 404);
    }

    // Calculate duration
    const startedAt = new Date(session.started_at);
    const endedAt = new Date();
    const durationMinutes = Math.round((endedAt.getTime() - startedAt.getTime()) / 60000);

    await db.prepare(`
      UPDATE scheduled_classroom_sessions SET
        status = 'completed',
        ended_at = CURRENT_TIMESTAMP,
        actual_duration_minutes = ?,
        session_summary = ?,
        tutor_notes = ?,
        homework_assigned = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      durationMinutes,
      body.summary || null,
      body.notes || null,
      body.homework || null,
      id
    ).run();

    return c.json({ success: true, durationMinutes });
  } catch (error) {
    console.error('End session error:', error);
    return c.json({ success: false, error: 'Failed to end session' }, 500);
  }
});

// =====================================================
// STUDENT ENDPOINTS (for tutor presence in AI classroom)
// =====================================================

// Get tutor updates for student's AI session
tutorClassroom.get('/student/session/:sessionId/tutor-updates', async (c) => {
  const user = c.get('user');
  const { sessionId } = c.req.param();
  const { last_event_id } = c.req.query();
  const db = c.env.DB;

  try {
    // Verify student owns this session
    const session = await db.prepare(`
      SELECT tutor_id, tutor_name, tutor_avatar_url, tutor_mode, handoff_status
      FROM ai_classroom_sessions WHERE id = ? AND student_id = ?
    `).bind(sessionId, user.id).first();

    if (!session) {
      return c.json({ success: false, error: 'Session not found' }, 404);
    }

    // Get tutor events visible to student
    let query = `
      SELECT * FROM tutor_classroom_events
      WHERE ai_session_id = ? AND is_visible_to_student = 1
    `;
    const params: any[] = [sessionId];

    if (last_event_id) {
      query += ` AND id > ?`;
      params.push(last_event_id);
    }

    query += ` ORDER BY created_at ASC LIMIT 50`;

    const events = await db.prepare(query).bind(...params).all();

    return c.json({
      success: true,
      tutorPresence: session.tutor_id ? {
        tutorId: session.tutor_id,
        tutorName: session.tutor_name,
        tutorAvatar: session.tutor_avatar_url,
        mode: session.tutor_mode
      } : null,
      handoffStatus: session.handoff_status,
      events: events.results || [],
      lastEventId: events.results?.length > 0 ? events.results[events.results.length - 1].id : last_event_id
    });
  } catch (error) {
    console.error('Get tutor updates error:', error);
    return c.json({ success: false, error: 'Failed to get updates' }, 500);
  }
});

// Student declines handoff suggestion
tutorClassroom.post('/student/session/:sessionId/decline-handoff', async (c) => {
  const user = c.get('user');
  const { sessionId } = c.req.param();
  const db = c.env.DB;

  try {
    await db.prepare(`
      UPDATE ai_classroom_sessions SET handoff_status = 'declined', updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND student_id = ? AND handoff_status = 'suggested'
    `).bind(sessionId, user.id).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Decline handoff error:', error);
    return c.json({ success: false, error: 'Failed to decline' }, 500);
  }
});

export default tutorClassroom;
