import { Hono } from 'hono';
import { requireAuth } from './auth-middleware';
import { parseLimit } from './http';

// Types for Cloudflare bindings
interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

interface ModerationContext {
  Variables: {
    userId: string;
    userRole: string;
  };
}

export const moderationApp = new Hono<{ Bindings: Env; Variables: ModerationContext['Variables'] }>();

// All moderation routes require a verified JWT; userId/userRole come from
// the shared middleware (role is re-read fresh from the users table).
moderationApp.use('*', requireAuth);

// Helper to check if user is admin
function isAdmin(role: string): boolean {
  return role === 'admin';
}

// Helper to check if user is moderator or admin
function isModerator(role: string): boolean {
  return role === 'admin' || role === 'moderator';
}

// Helper to generate unique ID
function generateId(): string {
  return crypto.randomUUID();
}

// Helper to log audit action
async function logAuditAction(
  db: D1Database,
  actionType: string,
  targetType: string,
  targetId: string,
  moderatorId: string,
  details?: object
): Promise<void> {
  await db.prepare(`
    INSERT INTO moderation_audit_log (id, action_type, target_type, target_id, moderator_id, details)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    generateId(),
    actionType,
    targetType,
    targetId,
    moderatorId,
    details ? JSON.stringify(details) : null
  ).run();
}

// ==================== REPORTS ====================

// GET /reports - List reports (admin/mod only)
moderationApp.get('/reports', async (c) => {
  try {
    const userRole = c.get('userRole');

    if (!isModerator(userRole)) {
      return c.json({ success: false, error: 'Moderator access required' }, 403);
    }

    const status = c.req.query('status');
    const limit = parseLimit(c, 50);
    const offset = parseInt(c.req.query('offset') || '0');

    let query = `
      SELECT
        r.*,
        reporter.name as reporter_name,
        reported.name as reported_user_name,
        reviewer.name as reviewer_name,
        m.content as message_content,
        room.name as room_name
      FROM chat_reports r
      LEFT JOIN users reporter ON r.reporter_id = reporter.id
      LEFT JOIN users reported ON r.reported_user_id = reported.id
      LEFT JOIN users reviewer ON r.reviewed_by = reviewer.id
      LEFT JOIN chat_messages m ON r.message_id = m.id
      LEFT JOIN chat_rooms room ON r.room_id = room.id
    `;

    const params: any[] = [];

    if (status) {
      query += ' WHERE r.status = ?';
      params.push(status);
    }

    query += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const reports = await c.env.DB.prepare(query).bind(...params).all();

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM chat_reports';
    if (status) {
      countQuery += ' WHERE status = ?';
    }
    const countResult = await c.env.DB.prepare(countQuery)
      .bind(...(status ? [status] : []))
      .first<{ total: number }>();

    return c.json({
      reports: reports.results,
      total: countResult?.total || 0,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error listing reports:', error);
    return c.json({ success: false, error: 'Failed to list reports' }, 500);
  }
});

// GET /reports/:id - Get report details
moderationApp.get('/reports/:id', async (c) => {
  try {
    const userRole = c.get('userRole');

    if (!isModerator(userRole)) {
      return c.json({ success: false, error: 'Moderator access required' }, 403);
    }

    const reportId = c.req.param('id');

    const report = await c.env.DB.prepare(`
      SELECT
        r.*,
        reporter.name as reporter_name,
        reporter.email as reporter_email,
        reported.name as reported_user_name,
        reported.email as reported_user_email,
        reviewer.name as reviewer_name,
        m.content as message_content,
        m.created_at as message_created_at,
        room.name as room_name,
        room.type as room_type
      FROM chat_reports r
      LEFT JOIN users reporter ON r.reporter_id = reporter.id
      LEFT JOIN users reported ON r.reported_user_id = reported.id
      LEFT JOIN users reviewer ON r.reviewed_by = reviewer.id
      LEFT JOIN chat_messages m ON r.message_id = m.id
      LEFT JOIN chat_rooms room ON r.room_id = room.id
      WHERE r.id = ?
    `).bind(reportId).first();

    if (!report) {
      return c.json({ success: false, error: 'Report not found' }, 404);
    }

    // Get previous reports against this user
    const previousReports = await c.env.DB.prepare(`
      SELECT COUNT(*) as count, status
      FROM chat_reports
      WHERE reported_user_id = ? AND id != ?
      GROUP BY status
    `).bind(report.reported_user_id, reportId).all();

    // Get previous moderation actions against this user
    const previousActions = await c.env.DB.prepare(`
      SELECT action_type, reason, created_at, is_active
      FROM chat_moderation_actions
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `).bind(report.reported_user_id).all();

    return c.json({
      report,
      userHistory: {
        previousReports: previousReports.results,
        previousActions: previousActions.results
      }
    });
  } catch (error) {
    console.error('Error getting report:', error);
    return c.json({ success: false, error: 'Failed to get report' }, 500);
  }
});

// POST /reports - Submit a report (any authenticated user)
moderationApp.post('/reports', async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json<{
      reported_user_id: string;
      message_id?: string;
      room_id?: string;
      reason: string;
      description?: string;
    }>();

    if (!body.reported_user_id || !body.reason) {
      return c.json({ success: false, error: 'reported_user_id and reason are required' }, 400);
    }

    // Validate reason
    const validReasons = ['spam', 'harassment', 'inappropriate', 'hate_speech', 'threats', 'other'];
    if (!validReasons.includes(body.reason)) {
      return c.json({ success: false, error: 'Invalid reason' }, 400);
    }

    // Check if user is reporting themselves
    if (body.reported_user_id === userId) {
      return c.json({ success: false, error: 'Cannot report yourself' }, 400);
    }

    // Check if reported user exists
    const reportedUser = await c.env.DB.prepare(
      'SELECT id FROM users WHERE id = ?'
    ).bind(body.reported_user_id).first();

    if (!reportedUser) {
      return c.json({ success: false, error: 'Reported user not found' }, 404);
    }

    // Check for duplicate recent report
    const existingReport = await c.env.DB.prepare(`
      SELECT id FROM chat_reports
      WHERE reporter_id = ?
      AND reported_user_id = ?
      AND status = 'pending'
      AND created_at > datetime('now', '-24 hours')
    `).bind(userId, body.reported_user_id).first();

    if (existingReport) {
      return c.json({ success: false, error: 'You have already reported this user recently' }, 400);
    }

    const reportId = generateId();

    await c.env.DB.prepare(`
      INSERT INTO chat_reports (id, reporter_id, reported_user_id, message_id, room_id, reason, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      reportId,
      userId,
      body.reported_user_id,
      body.message_id || null,
      body.room_id || null,
      body.reason,
      body.description || null
    ).run();

    return c.json({
      success: true,
      reportId,
      message: 'Report submitted successfully. Our team will review it shortly.'
    });
  } catch (error) {
    console.error('Error submitting report:', error);
    return c.json({ success: false, error: 'Failed to submit report' }, 500);
  }
});

// PUT /reports/:id - Review/resolve report (admin/mod only)
moderationApp.put('/reports/:id', async (c) => {
  try {
    const userId = c.get('userId');
    const userRole = c.get('userRole');

    if (!isModerator(userRole)) {
      return c.json({ success: false, error: 'Moderator access required' }, 403);
    }

    const reportId = c.req.param('id');
    const body = await c.req.json<{
      status: string;
      review_notes?: string;
      resolution?: string;
    }>();

    if (!body.status) {
      return c.json({ success: false, error: 'status is required' }, 400);
    }

    const validStatuses = ['pending', 'reviewing', 'resolved', 'dismissed'];
    if (!validStatuses.includes(body.status)) {
      return c.json({ success: false, error: 'Invalid status' }, 400);
    }

    if (body.resolution) {
      const validResolutions = ['warning', 'mute', 'ban', 'message_deleted', 'no_action'];
      if (!validResolutions.includes(body.resolution)) {
        return c.json({ success: false, error: 'Invalid resolution' }, 400);
      }
    }

    // Check report exists
    const report = await c.env.DB.prepare(
      'SELECT * FROM chat_reports WHERE id = ?'
    ).bind(reportId).first<{ reported_user_id: string }>();

    if (!report) {
      return c.json({ success: false, error: 'Report not found' }, 404);
    }

    await c.env.DB.prepare(`
      UPDATE chat_reports
      SET status = ?, review_notes = ?, resolution = ?, reviewed_by = ?, reviewed_at = datetime('now')
      WHERE id = ?
    `).bind(
      body.status,
      body.review_notes || null,
      body.resolution || null,
      userId,
      reportId
    ).run();

    // Log audit action
    await logAuditAction(c.env.DB, 'report_reviewed', 'report', reportId, userId, {
      status: body.status,
      resolution: body.resolution
    });

    return c.json({ success: true });
  } catch (error) {
    console.error('Error reviewing report:', error);
    return c.json({ success: false, error: 'Failed to review report' }, 500);
  }
});

// ==================== MODERATION ACTIONS ====================

// GET /actions - List moderation history (admin/mod only)
moderationApp.get('/actions', async (c) => {
  try {
    const userRole = c.get('userRole');

    if (!isModerator(userRole)) {
      return c.json({ success: false, error: 'Moderator access required' }, 403);
    }

    const userId = c.req.query('user_id');
    const roomId = c.req.query('room_id');
    const actionType = c.req.query('action_type');
    const limit = parseLimit(c, 50);
    const offset = parseInt(c.req.query('offset') || '0');

    let query = `
      SELECT
        a.*,
        u.name as user_name,
        mod.name as moderator_name,
        room.name as room_name
      FROM chat_moderation_actions a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN users mod ON a.moderator_id = mod.id
      LEFT JOIN chat_rooms room ON a.room_id = room.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (userId) {
      query += ' AND a.user_id = ?';
      params.push(userId);
    }

    if (roomId) {
      query += ' AND a.room_id = ?';
      params.push(roomId);
    }

    if (actionType) {
      query += ' AND a.action_type = ?';
      params.push(actionType);
    }

    query += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const actions = await c.env.DB.prepare(query).bind(...params).all();

    return c.json({
      actions: actions.results,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error listing moderation actions:', error);
    return c.json({ success: false, error: 'Failed to list moderation actions' }, 500);
  }
});

// POST /actions/warn - Warn a user
moderationApp.post('/actions/warn', async (c) => {
  try {
    const moderatorId = c.get('userId');
    const userRole = c.get('userRole');

    if (!isModerator(userRole)) {
      return c.json({ success: false, error: 'Moderator access required' }, 403);
    }

    const body = await c.req.json<{
      user_id: string;
      room_id?: string;
      reason: string;
    }>();

    if (!body.user_id || !body.reason) {
      return c.json({ success: false, error: 'user_id and reason are required' }, 400);
    }

    const actionId = generateId();

    await c.env.DB.prepare(`
      INSERT INTO chat_moderation_actions (id, user_id, room_id, moderator_id, action_type, reason)
      VALUES (?, ?, ?, ?, 'warn', ?)
    `).bind(actionId, body.user_id, body.room_id || null, moderatorId, body.reason).run();

    await logAuditAction(c.env.DB, 'user_warned', 'user', body.user_id, moderatorId, {
      reason: body.reason,
      room_id: body.room_id
    });

    // Create notification for the user
    await c.env.DB.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, created_at)
      VALUES (?, ?, 'warning', 'You have received a warning', ?, datetime('now'))
    `).bind(generateId(), body.user_id, `Reason: ${body.reason}`).run().catch(() => {
      // Notification table might not exist, ignore
    });

    return c.json({ success: true, actionId });
  } catch (error) {
    console.error('Error warning user:', error);
    return c.json({ success: false, error: 'Failed to warn user' }, 500);
  }
});

// POST /actions/mute - Mute a user
moderationApp.post('/actions/mute', async (c) => {
  try {
    const moderatorId = c.get('userId');
    const userRole = c.get('userRole');

    if (!isModerator(userRole)) {
      return c.json({ success: false, error: 'Moderator access required' }, 403);
    }

    const body = await c.req.json<{
      user_id: string;
      room_id?: string;
      reason: string;
      duration: number; // in minutes
    }>();

    if (!body.user_id || !body.reason || !body.duration) {
      return c.json({ success: false, error: 'user_id, reason, and duration are required' }, 400);
    }

    const actionId = generateId();
    const expiresAt = new Date(Date.now() + body.duration * 60 * 1000).toISOString();

    // Deactivate any existing mute for this user/room combination
    await c.env.DB.prepare(`
      UPDATE chat_moderation_actions
      SET is_active = 0
      WHERE user_id = ? AND (room_id = ? OR (room_id IS NULL AND ? IS NULL))
      AND action_type = 'mute' AND is_active = 1
    `).bind(body.user_id, body.room_id || null, body.room_id || null).run();

    await c.env.DB.prepare(`
      INSERT INTO chat_moderation_actions (id, user_id, room_id, moderator_id, action_type, reason, duration, expires_at)
      VALUES (?, ?, ?, ?, 'mute', ?, ?, ?)
    `).bind(actionId, body.user_id, body.room_id || null, moderatorId, body.reason, body.duration, expiresAt).run();

    // Also update the chat_room_members table if room-specific
    if (body.room_id) {
      await c.env.DB.prepare(`
        UPDATE chat_room_members
        SET is_muted = 1, muted_until = ?
        WHERE user_id = ? AND room_id = ?
      `).bind(expiresAt, body.user_id, body.room_id).run();
    }

    await logAuditAction(c.env.DB, 'user_muted', 'user', body.user_id, moderatorId, {
      reason: body.reason,
      duration: body.duration,
      room_id: body.room_id,
      expires_at: expiresAt
    });

    return c.json({ success: true, actionId, expiresAt });
  } catch (error) {
    console.error('Error muting user:', error);
    return c.json({ success: false, error: 'Failed to mute user' }, 500);
  }
});

// POST /actions/unmute - Unmute a user
moderationApp.post('/actions/unmute', async (c) => {
  try {
    const moderatorId = c.get('userId');
    const userRole = c.get('userRole');

    if (!isModerator(userRole)) {
      return c.json({ success: false, error: 'Moderator access required' }, 403);
    }

    const body = await c.req.json<{
      user_id: string;
      room_id?: string;
      reason?: string;
    }>();

    if (!body.user_id) {
      return c.json({ success: false, error: 'user_id is required' }, 400);
    }

    const actionId = generateId();

    // Deactivate existing mute
    await c.env.DB.prepare(`
      UPDATE chat_moderation_actions
      SET is_active = 0
      WHERE user_id = ? AND (room_id = ? OR (room_id IS NULL AND ? IS NULL))
      AND action_type = 'mute' AND is_active = 1
    `).bind(body.user_id, body.room_id || null, body.room_id || null).run();

    // Record unmute action
    await c.env.DB.prepare(`
      INSERT INTO chat_moderation_actions (id, user_id, room_id, moderator_id, action_type, reason, is_active)
      VALUES (?, ?, ?, ?, 'unmute', ?, 0)
    `).bind(actionId, body.user_id, body.room_id || null, moderatorId, body.reason || null).run();

    // Update chat_room_members if room-specific
    if (body.room_id) {
      await c.env.DB.prepare(`
        UPDATE chat_room_members
        SET is_muted = 0, muted_until = NULL
        WHERE user_id = ? AND room_id = ?
      `).bind(body.user_id, body.room_id).run();
    }

    await logAuditAction(c.env.DB, 'user_unmuted', 'user', body.user_id, moderatorId, {
      reason: body.reason,
      room_id: body.room_id
    });

    return c.json({ success: true, actionId });
  } catch (error) {
    console.error('Error unmuting user:', error);
    return c.json({ success: false, error: 'Failed to unmute user' }, 500);
  }
});

// POST /actions/ban - Ban a user
moderationApp.post('/actions/ban', async (c) => {
  try {
    const moderatorId = c.get('userId');
    const userRole = c.get('userRole');

    // Only admins can ban
    if (!isAdmin(userRole)) {
      return c.json({ success: false, error: 'Admin access required' }, 403);
    }

    const body = await c.req.json<{
      user_id: string;
      room_id?: string;
      reason: string;
      duration?: number; // in minutes, null for permanent
    }>();

    if (!body.user_id || !body.reason) {
      return c.json({ success: false, error: 'user_id and reason are required' }, 400);
    }

    const actionId = generateId();
    const expiresAt = body.duration
      ? new Date(Date.now() + body.duration * 60 * 1000).toISOString()
      : null;

    // Deactivate any existing ban
    await c.env.DB.prepare(`
      UPDATE chat_moderation_actions
      SET is_active = 0
      WHERE user_id = ? AND (room_id = ? OR (room_id IS NULL AND ? IS NULL))
      AND action_type = 'ban' AND is_active = 1
    `).bind(body.user_id, body.room_id || null, body.room_id || null).run();

    await c.env.DB.prepare(`
      INSERT INTO chat_moderation_actions (id, user_id, room_id, moderator_id, action_type, reason, duration, expires_at)
      VALUES (?, ?, ?, ?, 'ban', ?, ?, ?)
    `).bind(
      actionId,
      body.user_id,
      body.room_id || null,
      moderatorId,
      body.reason,
      body.duration || null,
      expiresAt
    ).run();

    // If room-specific, remove from room
    if (body.room_id) {
      await c.env.DB.prepare(`
        DELETE FROM chat_room_members
        WHERE user_id = ? AND room_id = ?
      `).bind(body.user_id, body.room_id).run();
    }

    await logAuditAction(c.env.DB, 'user_banned', 'user', body.user_id, moderatorId, {
      reason: body.reason,
      duration: body.duration,
      room_id: body.room_id,
      expires_at: expiresAt,
      permanent: !body.duration
    });

    return c.json({ success: true, actionId, expiresAt });
  } catch (error) {
    console.error('Error banning user:', error);
    return c.json({ success: false, error: 'Failed to ban user' }, 500);
  }
});

// POST /actions/unban - Unban a user
moderationApp.post('/actions/unban', async (c) => {
  try {
    const moderatorId = c.get('userId');
    const userRole = c.get('userRole');

    if (!isAdmin(userRole)) {
      return c.json({ success: false, error: 'Admin access required' }, 403);
    }

    const body = await c.req.json<{
      user_id: string;
      room_id?: string;
      reason?: string;
    }>();

    if (!body.user_id) {
      return c.json({ success: false, error: 'user_id is required' }, 400);
    }

    const actionId = generateId();

    // Deactivate existing ban
    await c.env.DB.prepare(`
      UPDATE chat_moderation_actions
      SET is_active = 0
      WHERE user_id = ? AND (room_id = ? OR (room_id IS NULL AND ? IS NULL))
      AND action_type = 'ban' AND is_active = 1
    `).bind(body.user_id, body.room_id || null, body.room_id || null).run();

    // Record unban action
    await c.env.DB.prepare(`
      INSERT INTO chat_moderation_actions (id, user_id, room_id, moderator_id, action_type, reason, is_active)
      VALUES (?, ?, ?, ?, 'unban', ?, 0)
    `).bind(actionId, body.user_id, body.room_id || null, moderatorId, body.reason || null).run();

    await logAuditAction(c.env.DB, 'user_unbanned', 'user', body.user_id, moderatorId, {
      reason: body.reason,
      room_id: body.room_id
    });

    return c.json({ success: true, actionId });
  } catch (error) {
    console.error('Error unbanning user:', error);
    return c.json({ success: false, error: 'Failed to unban user' }, 500);
  }
});

// POST /actions/kick - Kick a user from a room
moderationApp.post('/actions/kick', async (c) => {
  try {
    const moderatorId = c.get('userId');
    const userRole = c.get('userRole');

    if (!isModerator(userRole)) {
      return c.json({ success: false, error: 'Moderator access required' }, 403);
    }

    const body = await c.req.json<{
      user_id: string;
      room_id: string;
      reason: string;
    }>();

    if (!body.user_id || !body.room_id || !body.reason) {
      return c.json({ success: false, error: 'user_id, room_id, and reason are required' }, 400);
    }

    const actionId = generateId();

    // Record kick action
    await c.env.DB.prepare(`
      INSERT INTO chat_moderation_actions (id, user_id, room_id, moderator_id, action_type, reason, is_active)
      VALUES (?, ?, ?, ?, 'kick', ?, 0)
    `).bind(actionId, body.user_id, body.room_id, moderatorId, body.reason).run();

    // Remove from room
    await c.env.DB.prepare(`
      DELETE FROM chat_room_members
      WHERE user_id = ? AND room_id = ?
    `).bind(body.user_id, body.room_id).run();

    await logAuditAction(c.env.DB, 'user_kicked', 'user', body.user_id, moderatorId, {
      reason: body.reason,
      room_id: body.room_id
    });

    return c.json({ success: true, actionId });
  } catch (error) {
    console.error('Error kicking user:', error);
    return c.json({ success: false, error: 'Failed to kick user' }, 500);
  }
});

// ==================== WORD FILTERS ====================

// GET /filters - List filtered words (admin only)
moderationApp.get('/filters', async (c) => {
  try {
    const userRole = c.get('userRole');

    if (!isAdmin(userRole)) {
      return c.json({ success: false, error: 'Admin access required' }, 403);
    }

    const filters = await c.env.DB.prepare(`
      SELECT f.*, u.name as added_by_name
      FROM chat_filtered_words f
      LEFT JOIN users u ON f.added_by = u.id
      ORDER BY f.severity DESC, f.word ASC
    `).all();

    return c.json({ filters: filters.results });
  } catch (error) {
    console.error('Error listing filters:', error);
    return c.json({ success: false, error: 'Failed to list filters' }, 500);
  }
});

// POST /filters - Add word filter (admin only)
moderationApp.post('/filters', async (c) => {
  try {
    const userId = c.get('userId');
    const userRole = c.get('userRole');

    if (!isAdmin(userRole)) {
      return c.json({ success: false, error: 'Admin access required' }, 403);
    }

    const body = await c.req.json<{
      word: string;
      severity?: string;
      replacement?: string;
    }>();

    if (!body.word) {
      return c.json({ success: false, error: 'word is required' }, 400);
    }

    const severity = body.severity || 'low';
    const validSeverities = ['low', 'medium', 'high'];
    if (!validSeverities.includes(severity)) {
      return c.json({ success: false, error: 'Invalid severity' }, 400);
    }

    const filterId = generateId();

    try {
      await c.env.DB.prepare(`
        INSERT INTO chat_filtered_words (id, word, severity, replacement, added_by)
        VALUES (?, ?, ?, ?, ?)
      `).bind(filterId, body.word.toLowerCase(), severity, body.replacement || null, userId).run();
    } catch (e: any) {
      if (e.message?.includes('UNIQUE constraint failed')) {
        return c.json({ success: false, error: 'Word already exists in filter list' }, 400);
      }
      throw e;
    }

    await logAuditAction(c.env.DB, 'filter_added', 'filter', filterId, userId, {
      word: body.word,
      severity
    });

    return c.json({ success: true, filterId });
  } catch (error) {
    console.error('Error adding filter:', error);
    return c.json({ success: false, error: 'Failed to add filter' }, 500);
  }
});

// PUT /filters/:id - Update filter (admin only)
moderationApp.put('/filters/:id', async (c) => {
  try {
    const userId = c.get('userId');
    const userRole = c.get('userRole');

    if (!isAdmin(userRole)) {
      return c.json({ success: false, error: 'Admin access required' }, 403);
    }

    const filterId = c.req.param('id');
    const body = await c.req.json<{
      severity?: string;
      replacement?: string;
      is_active?: boolean;
    }>();

    const updates: string[] = [];
    const params: any[] = [];

    if (body.severity) {
      const validSeverities = ['low', 'medium', 'high'];
      if (!validSeverities.includes(body.severity)) {
        return c.json({ success: false, error: 'Invalid severity' }, 400);
      }
      updates.push('severity = ?');
      params.push(body.severity);
    }

    if (body.replacement !== undefined) {
      updates.push('replacement = ?');
      params.push(body.replacement);
    }

    if (body.is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(body.is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      return c.json({ success: false, error: 'No updates provided' }, 400);
    }

    params.push(filterId);

    await c.env.DB.prepare(`
      UPDATE chat_filtered_words
      SET ${updates.join(', ')}
      WHERE id = ?
    `).bind(...params).run();

    await logAuditAction(c.env.DB, 'filter_updated', 'filter', filterId, userId, body);

    return c.json({ success: true });
  } catch (error) {
    console.error('Error updating filter:', error);
    return c.json({ success: false, error: 'Failed to update filter' }, 500);
  }
});

// DELETE /filters/:id - Remove filter (admin only)
moderationApp.delete('/filters/:id', async (c) => {
  try {
    const userId = c.get('userId');
    const userRole = c.get('userRole');

    if (!isAdmin(userRole)) {
      return c.json({ success: false, error: 'Admin access required' }, 403);
    }

    const filterId = c.req.param('id');

    // Get word for audit log
    const filter = await c.env.DB.prepare(
      'SELECT word FROM chat_filtered_words WHERE id = ?'
    ).bind(filterId).first<{ word: string }>();

    await c.env.DB.prepare(
      'DELETE FROM chat_filtered_words WHERE id = ?'
    ).bind(filterId).run();

    await logAuditAction(c.env.DB, 'filter_removed', 'filter', filterId, userId, {
      word: filter?.word
    });

    return c.json({ success: true });
  } catch (error) {
    console.error('Error removing filter:', error);
    return c.json({ success: false, error: 'Failed to remove filter' }, 500);
  }
});

// ==================== CONTENT CHECKING ====================

// POST /check-content - Check message content for violations
moderationApp.post('/check-content', async (c) => {
  try {
    const body = await c.req.json<{ content: string }>();

    if (!body.content) {
      return c.json({ success: false, error: 'content is required' }, 400);
    }

    // Get active filters
    const filters = await c.env.DB.prepare(`
      SELECT word, severity, replacement
      FROM chat_filtered_words
      WHERE is_active = 1
    `).all<{ word: string; severity: string; replacement: string | null }>();

    const contentLower = body.content.toLowerCase();
    const violations: Array<{ word: string; severity: string }> = [];
    let filteredContent = body.content;

    for (const filter of filters.results || []) {
      const regex = new RegExp(`\\b${filter.word}\\b`, 'gi');
      if (regex.test(contentLower)) {
        violations.push({ word: filter.word, severity: filter.severity });

        if (filter.replacement) {
          filteredContent = filteredContent.replace(regex, filter.replacement);
        } else {
          // Replace with asterisks
          filteredContent = filteredContent.replace(regex, '*'.repeat(filter.word.length));
        }
      }
    }

    const highSeverity = violations.filter(v => v.severity === 'high');
    const blocked = highSeverity.length > 0;

    return c.json({
      allowed: !blocked,
      violations,
      filteredContent: blocked ? null : filteredContent,
      message: blocked
        ? 'Message blocked due to prohibited content'
        : violations.length > 0
          ? 'Message filtered'
          : null
    });
  } catch (error) {
    console.error('Error checking content:', error);
    return c.json({ success: false, error: 'Failed to check content' }, 500);
  }
});

// ==================== USER HISTORY ====================

// GET /user/:id/history - Get user moderation history (admin/mod only)
moderationApp.get('/user/:id/history', async (c) => {
  try {
    const userRole = c.get('userRole');

    if (!isModerator(userRole)) {
      return c.json({ success: false, error: 'Moderator access required' }, 403);
    }

    const targetUserId = c.req.param('id');

    // Get user info
    const user = await c.env.DB.prepare(`
      SELECT id, name, email, role, created_at
      FROM users WHERE id = ?
    `).bind(targetUserId).first();

    if (!user) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    // Get reports against this user
    const reportsAgainst = await c.env.DB.prepare(`
      SELECT r.*, reporter.name as reporter_name
      FROM chat_reports r
      LEFT JOIN users reporter ON r.reporter_id = reporter.id
      WHERE r.reported_user_id = ?
      ORDER BY r.created_at DESC
      LIMIT 20
    `).bind(targetUserId).all();

    // Get reports by this user
    const reportsByUser = await c.env.DB.prepare(`
      SELECT r.*, reported.name as reported_user_name
      FROM chat_reports r
      LEFT JOIN users reported ON r.reported_user_id = reported.id
      WHERE r.reporter_id = ?
      ORDER BY r.created_at DESC
      LIMIT 20
    `).bind(targetUserId).all();

    // Get moderation actions against this user
    const moderationActions = await c.env.DB.prepare(`
      SELECT a.*, mod.name as moderator_name, room.name as room_name
      FROM chat_moderation_actions a
      LEFT JOIN users mod ON a.moderator_id = mod.id
      LEFT JOIN chat_rooms room ON a.room_id = room.id
      WHERE a.user_id = ?
      ORDER BY a.created_at DESC
    `).bind(targetUserId).all();

    // Get active bans/mutes
    const activeRestrictions = await c.env.DB.prepare(`
      SELECT a.*, room.name as room_name
      FROM chat_moderation_actions a
      LEFT JOIN chat_rooms room ON a.room_id = room.id
      WHERE a.user_id = ?
      AND a.is_active = 1
      AND a.action_type IN ('mute', 'ban')
      AND (a.expires_at IS NULL OR a.expires_at > datetime('now'))
    `).bind(targetUserId).all();

    return c.json({
      user,
      reportsAgainst: reportsAgainst.results,
      reportsByUser: reportsByUser.results,
      moderationActions: moderationActions.results,
      activeRestrictions: activeRestrictions.results
    });
  } catch (error) {
    console.error('Error getting user history:', error);
    return c.json({ success: false, error: 'Failed to get user history' }, 500);
  }
});

// ==================== AUDIT LOG ====================

// GET /audit-log - Get moderation audit log (admin only)
moderationApp.get('/audit-log', async (c) => {
  try {
    const userRole = c.get('userRole');

    if (!isAdmin(userRole)) {
      return c.json({ success: false, error: 'Admin access required' }, 403);
    }

    const moderatorId = c.req.query('moderator_id');
    const targetType = c.req.query('target_type');
    const limit = parseLimit(c, 100);
    const offset = parseInt(c.req.query('offset') || '0');

    let query = `
      SELECT l.*, mod.name as moderator_name
      FROM moderation_audit_log l
      LEFT JOIN users mod ON l.moderator_id = mod.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (moderatorId) {
      query += ' AND l.moderator_id = ?';
      params.push(moderatorId);
    }

    if (targetType) {
      query += ' AND l.target_type = ?';
      params.push(targetType);
    }

    query += ' ORDER BY l.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const logs = await c.env.DB.prepare(query).bind(...params).all();

    return c.json({
      logs: logs.results,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error getting audit log:', error);
    return c.json({ success: false, error: 'Failed to get audit log' }, 500);
  }
});

// ==================== STATISTICS ====================

// GET /stats - Get moderation statistics (admin only)
moderationApp.get('/stats', async (c) => {
  try {
    const userRole = c.get('userRole');

    if (!isAdmin(userRole)) {
      return c.json({ success: false, error: 'Admin access required' }, 403);
    }

    // Get report stats
    const reportStats = await c.env.DB.prepare(`
      SELECT
        status,
        COUNT(*) as count
      FROM chat_reports
      GROUP BY status
    `).all();

    // Get reports by reason
    const reportsByReason = await c.env.DB.prepare(`
      SELECT
        reason,
        COUNT(*) as count
      FROM chat_reports
      GROUP BY reason
      ORDER BY count DESC
    `).all();

    // Get action stats
    const actionStats = await c.env.DB.prepare(`
      SELECT
        action_type,
        COUNT(*) as count
      FROM chat_moderation_actions
      GROUP BY action_type
    `).all();

    // Get reports this week
    const weeklyReports = await c.env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM chat_reports
      WHERE created_at > datetime('now', '-7 days')
    `).first<{ count: number }>();

    // Get active bans/mutes
    const activeRestrictions = await c.env.DB.prepare(`
      SELECT
        action_type,
        COUNT(*) as count
      FROM chat_moderation_actions
      WHERE is_active = 1
      AND action_type IN ('mute', 'ban')
      AND (expires_at IS NULL OR expires_at > datetime('now'))
      GROUP BY action_type
    `).all();

    // Get top reporters
    const topReporters = await c.env.DB.prepare(`
      SELECT
        u.id,
        u.name,
        COUNT(*) as report_count
      FROM chat_reports r
      JOIN users u ON r.reporter_id = u.id
      GROUP BY r.reporter_id
      ORDER BY report_count DESC
      LIMIT 10
    `).all();

    // Get most reported users
    const mostReported = await c.env.DB.prepare(`
      SELECT
        u.id,
        u.name,
        COUNT(*) as report_count
      FROM chat_reports r
      JOIN users u ON r.reported_user_id = u.id
      GROUP BY r.reported_user_id
      ORDER BY report_count DESC
      LIMIT 10
    `).all();

    return c.json({
      reports: {
        byStatus: reportStats.results,
        byReason: reportsByReason.results,
        thisWeek: weeklyReports?.count || 0
      },
      actions: {
        byType: actionStats.results,
        activeRestrictions: activeRestrictions.results
      },
      users: {
        topReporters: topReporters.results,
        mostReported: mostReported.results
      }
    });
  } catch (error) {
    console.error('Error getting moderation stats:', error);
    return c.json({ success: false, error: 'Failed to get moderation stats' }, 500);
  }
});

export default moderationApp;
