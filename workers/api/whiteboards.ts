import { Hono } from 'hono';
import { requireAuth } from './auth-middleware';
import type { AuthPayload } from './auth-middleware';

// Types for Cloudflare bindings
interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  APP_URL?: string;
}

// Context variables set by requireAuth
interface AuthVars {
  userId: string;
  userRole: string;
  user: AuthPayload;
}

// Whiteboard type
interface Whiteboard {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  canvas_json: string;
  thumbnail: string | null;
  canvas_width: number;
  canvas_height: number;
  subject_id: string | null;
  topic_id: string | null;
  is_template: number;
  is_public: number;
  status: 'active' | 'archived' | 'deleted';
  created_at: string;
  updated_at: string;
}

// Generate unique ID
function generateId(): string {
  return `wb_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// Whiteboards routes
const whiteboardsApp = new Hono<{ Bindings: Env; Variables: AuthVars }>();

// Auth middleware: the public share view stays public, everything else
// requires a verified JWT (sets userId/userRole on context).
whiteboardsApp.use('*', async (c, next) => {
  const url = new URL(c.req.url);
  if (url.pathname.includes('/public/')) {
    return next();
  }
  return requireAuth(c, next);
});

// GET /whiteboards - List user's whiteboards
whiteboardsApp.get('/', async (c) => {
  const userId = c.get('userId' as never) as string;
  const { search, status, limit = '50', offset = '0' } = c.req.query();

  try {
    let query = `
      SELECT * FROM whiteboards
      WHERE user_id = ? AND status != 'deleted'
    `;
    const params: (string | number)[] = [userId];

    if (status && status !== 'all') {
      query += ` AND status = ?`;
      params.push(status);
    }

    if (search) {
      query += ` AND (title LIKE ? OR description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY updated_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const whiteboards = await c.env.DB.prepare(query).bind(...params).all<Whiteboard>();

    // Get total count
    let countQuery = `SELECT COUNT(*) as count FROM whiteboards WHERE user_id = ? AND status != 'deleted'`;
    const countParams: (string | number)[] = [userId];

    if (status && status !== 'all') {
      countQuery += ` AND status = ?`;
      countParams.push(status);
    }

    if (search) {
      countQuery += ` AND (title LIKE ? OR description LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const countResult = await c.env.DB.prepare(countQuery).bind(...countParams).first<{ count: number }>();

    // Transform to camelCase for frontend
    const transformedWhiteboards = whiteboards.results?.map(wb => ({
      id: wb.id,
      userId: wb.user_id,
      title: wb.title,
      description: wb.description,
      canvasJSON: wb.canvas_json,
      thumbnail: wb.thumbnail,
      canvasWidth: wb.canvas_width,
      canvasHeight: wb.canvas_height,
      subjectId: wb.subject_id,
      topicId: wb.topic_id,
      isTemplate: wb.is_template === 1,
      isPublic: wb.is_public === 1,
      status: wb.status,
      createdAt: wb.created_at,
      updatedAt: wb.updated_at,
    })) || [];

    return c.json({
      success: true,
      data: {
        whiteboards: transformedWhiteboards,
        total: countResult?.count || 0,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error('Error listing whiteboards:', error);
    return c.json({ error: 'Failed to list whiteboards' }, 500);
  }
});

// GET /whiteboards/:id - Get a specific whiteboard
whiteboardsApp.get('/:id', async (c) => {
  const userId = c.get('userId' as never) as string;
  const { id } = c.req.param();

  try {
    const whiteboard = await c.env.DB.prepare(`
      SELECT * FROM whiteboards
      WHERE id = ? AND (user_id = ? OR is_public = 1) AND status != 'deleted'
    `).bind(id, userId).first<Whiteboard>();

    if (!whiteboard) {
      return c.json({ error: 'Whiteboard not found' }, 404);
    }

    return c.json({
      success: true,
      data: {
        id: whiteboard.id,
        userId: whiteboard.user_id,
        title: whiteboard.title,
        description: whiteboard.description,
        canvasJSON: whiteboard.canvas_json,
        thumbnail: whiteboard.thumbnail,
        canvasWidth: whiteboard.canvas_width,
        canvasHeight: whiteboard.canvas_height,
        subjectId: whiteboard.subject_id,
        topicId: whiteboard.topic_id,
        isTemplate: whiteboard.is_template === 1,
        isPublic: whiteboard.is_public === 1,
        status: whiteboard.status,
        createdAt: whiteboard.created_at,
        updatedAt: whiteboard.updated_at,
      },
    });
  } catch (error) {
    console.error('Error getting whiteboard:', error);
    return c.json({ error: 'Failed to get whiteboard' }, 500);
  }
});

// POST /whiteboards - Create a new whiteboard
whiteboardsApp.post('/', async (c) => {
  const userId = c.get('userId' as never) as string;

  try {
    const body = await c.req.json();
    const {
      id: providedId,
      title,
      description,
      canvasJSON,
      thumbnail,
      canvasWidth = 1200,
      canvasHeight = 800,
      subjectId,
      topicId,
    } = body;

    if (!title || !canvasJSON) {
      return c.json({ error: 'Title and canvasJSON are required' }, 400);
    }

    const id = providedId || generateId();
    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      INSERT INTO whiteboards (
        id, user_id, title, description, canvas_json, thumbnail,
        canvas_width, canvas_height, subject_id, topic_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, userId, title, description || null, canvasJSON, thumbnail || null,
      canvasWidth, canvasHeight, subjectId || null, topicId || null, now, now
    ).run();

    return c.json({
      success: true,
      data: {
        id,
        userId,
        title,
        description,
        canvasJSON,
        thumbnail,
        canvasWidth,
        canvasHeight,
        subjectId,
        topicId,
        isTemplate: false,
        isPublic: false,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      },
    });
  } catch (error) {
    console.error('Error creating whiteboard:', error);
    return c.json({ error: 'Failed to create whiteboard' }, 500);
  }
});

// PUT /whiteboards/:id - Update a whiteboard
whiteboardsApp.put('/:id', async (c) => {
  const userId = c.get('userId' as never) as string;
  const { id } = c.req.param();

  try {
    // Check ownership
    const existing = await c.env.DB.prepare(`
      SELECT id FROM whiteboards WHERE id = ? AND user_id = ? AND status != 'deleted'
    `).bind(id, userId).first();

    if (!existing) {
      return c.json({ error: 'Whiteboard not found or access denied' }, 404);
    }

    const body = await c.req.json();
    const {
      title,
      description,
      canvasJSON,
      thumbnail,
      canvasWidth,
      canvasHeight,
      subjectId,
      topicId,
      isPublic,
    } = body;

    const now = new Date().toISOString();

    // Build update query dynamically
    const updates: string[] = ['updated_at = ?'];
    const params: (string | number | null)[] = [now];

    if (title !== undefined) {
      updates.push('title = ?');
      params.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (canvasJSON !== undefined) {
      updates.push('canvas_json = ?');
      params.push(canvasJSON);
    }
    if (thumbnail !== undefined) {
      updates.push('thumbnail = ?');
      params.push(thumbnail);
    }
    if (canvasWidth !== undefined) {
      updates.push('canvas_width = ?');
      params.push(canvasWidth);
    }
    if (canvasHeight !== undefined) {
      updates.push('canvas_height = ?');
      params.push(canvasHeight);
    }
    if (subjectId !== undefined) {
      updates.push('subject_id = ?');
      params.push(subjectId);
    }
    if (topicId !== undefined) {
      updates.push('topic_id = ?');
      params.push(topicId);
    }
    if (isPublic !== undefined) {
      updates.push('is_public = ?');
      params.push(isPublic ? 1 : 0);
    }

    params.push(id);

    await c.env.DB.prepare(`
      UPDATE whiteboards SET ${updates.join(', ')} WHERE id = ?
    `).bind(...params).run();

    // Fetch updated whiteboard
    const updated = await c.env.DB.prepare(`
      SELECT * FROM whiteboards WHERE id = ?
    `).bind(id).first<Whiteboard>();

    return c.json({
      success: true,
      data: {
        id: updated!.id,
        userId: updated!.user_id,
        title: updated!.title,
        description: updated!.description,
        canvasJSON: updated!.canvas_json,
        thumbnail: updated!.thumbnail,
        canvasWidth: updated!.canvas_width,
        canvasHeight: updated!.canvas_height,
        subjectId: updated!.subject_id,
        topicId: updated!.topic_id,
        isTemplate: updated!.is_template === 1,
        isPublic: updated!.is_public === 1,
        status: updated!.status,
        createdAt: updated!.created_at,
        updatedAt: updated!.updated_at,
      },
    });
  } catch (error) {
    console.error('Error updating whiteboard:', error);
    return c.json({ error: 'Failed to update whiteboard' }, 500);
  }
});

// DELETE /whiteboards/:id - Soft delete a whiteboard
whiteboardsApp.delete('/:id', async (c) => {
  const userId = c.get('userId' as never) as string;
  const { id } = c.req.param();

  try {
    // Check ownership
    const existing = await c.env.DB.prepare(`
      SELECT id FROM whiteboards WHERE id = ? AND user_id = ? AND status != 'deleted'
    `).bind(id, userId).first();

    if (!existing) {
      return c.json({ error: 'Whiteboard not found or access denied' }, 404);
    }

    // Soft delete
    await c.env.DB.prepare(`
      UPDATE whiteboards SET status = 'deleted', updated_at = ? WHERE id = ?
    `).bind(new Date().toISOString(), id).run();

    return c.json({
      success: true,
      data: { id },
    });
  } catch (error) {
    console.error('Error deleting whiteboard:', error);
    return c.json({ error: 'Failed to delete whiteboard' }, 500);
  }
});

// POST /whiteboards/:id/duplicate - Duplicate a whiteboard
whiteboardsApp.post('/:id/duplicate', async (c) => {
  const userId = c.get('userId' as never) as string;
  const { id } = c.req.param();

  try {
    // Get original whiteboard
    const original = await c.env.DB.prepare(`
      SELECT * FROM whiteboards
      WHERE id = ? AND (user_id = ? OR is_public = 1) AND status != 'deleted'
    `).bind(id, userId).first<Whiteboard>();

    if (!original) {
      return c.json({ error: 'Whiteboard not found' }, 404);
    }

    const newId = generateId();
    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      INSERT INTO whiteboards (
        id, user_id, title, description, canvas_json, thumbnail,
        canvas_width, canvas_height, subject_id, topic_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      newId, userId, `${original.title} (Copy)`, original.description, original.canvas_json,
      original.thumbnail, original.canvas_width, original.canvas_height,
      original.subject_id, original.topic_id, now, now
    ).run();

    return c.json({
      success: true,
      data: {
        id: newId,
        userId,
        title: `${original.title} (Copy)`,
        description: original.description,
        canvasJSON: original.canvas_json,
        thumbnail: original.thumbnail,
        canvasWidth: original.canvas_width,
        canvasHeight: original.canvas_height,
        subjectId: original.subject_id,
        topicId: original.topic_id,
        isTemplate: false,
        isPublic: false,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      },
    });
  } catch (error) {
    console.error('Error duplicating whiteboard:', error);
    return c.json({ error: 'Failed to duplicate whiteboard' }, 500);
  }
});

// GET /whiteboards/public/:id - Get a public whiteboard (no auth required)
whiteboardsApp.get('/public/:id', async (c) => {
  const { id } = c.req.param();

  try {
    const whiteboard = await c.env.DB.prepare(`
      SELECT * FROM whiteboards WHERE id = ? AND is_public = 1 AND status = 'active'
    `).bind(id).first<Whiteboard>();

    if (!whiteboard) {
      return c.json({ error: 'Whiteboard not found' }, 404);
    }

    return c.json({
      success: true,
      data: {
        id: whiteboard.id,
        title: whiteboard.title,
        description: whiteboard.description,
        canvasJSON: whiteboard.canvas_json,
        thumbnail: whiteboard.thumbnail,
        canvasWidth: whiteboard.canvas_width,
        canvasHeight: whiteboard.canvas_height,
        createdAt: whiteboard.created_at,
      },
    });
  } catch (error) {
    console.error('Error getting public whiteboard:', error);
    return c.json({ error: 'Failed to get whiteboard' }, 500);
  }
});

export { whiteboardsApp };
