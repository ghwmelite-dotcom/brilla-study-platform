import { Hono } from 'hono';
import type { Context } from 'hono';
import { requireAuth } from './auth-middleware';
import { parseLimit } from './http';
import type { AuthPayload } from './auth-middleware';

// Types for Cloudflare bindings
interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  LIBRARY_BUCKET?: R2Bucket;
}

// Context variables set by requireAuth
interface AuthVars {
  userId: string;
  userRole: string;
  user: AuthPayload;
}

// Library routes - both public and protected
const libraryApp = new Hono<{ Bindings: Env; Variables: AuthVars }>();

// Auth middleware: file serving stays public, everything else requires a
// verified JWT (sets userId/userRole on context).
libraryApp.use('*', async (c, next) => {
  const url = new URL(c.req.url);
  if (url.pathname.includes('/files/')) {
    return next();
  }
  return requireAuth(c, next);
});

// Helper to get user ID from context
function getUserId(c: Context): string | undefined {
  return c.get('userId');
}

// =============================================
// PUBLIC LIBRARY ROUTES
// =============================================

// Serve files from R2 bucket
libraryApp.get('/files/*', async (c) => {
  try {
    // Extract the file path from the URL (handles /api/library/files/...)
    const url = new URL(c.req.url);
    const path = url.pathname.split('/files/')[1] || '';

    if (!c.env.LIBRARY_BUCKET) {
      return c.json({ success: false, error: 'Storage not configured' }, 500);
    }

    const object = await c.env.LIBRARY_BUCKET.get(path);

    if (!object) {
      return c.json({ success: false, error: 'File not found' }, 404);
    }

    const headers = new Headers();
    headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream');
    headers.set('Cache-Control', 'public, max-age=31536000');

    return new Response(object.body, { headers });
  } catch (error) {
    console.error('Error serving file:', error);
    return c.json({ success: false, error: 'Failed to serve file' }, 500);
  }
});

// Get all library resources with filtering and pagination
libraryApp.get('/resources', async (c) => {
  try {
    const search = c.req.query('search') || '';
    const resourceType = c.req.query('type') || 'all';
    const subjectId = c.req.query('subjectId');
    const topicId = c.req.query('topicId');
    const schoolLevel = c.req.query('schoolLevel');
    const accessLevel = c.req.query('accessLevel') || 'all';
    const sortBy = c.req.query('sortBy') || 'newest';
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseLimit(c, 20);
    const offset = (page - 1) * limit;

    let query = `
      SELECT
        lr.*,
        s.name as subject_name,
        t.name as topic_name,
        AVG(rat.rating) as avg_rating,
        COUNT(DISTINCT rat.id) as rating_count
      FROM library_resources lr
      LEFT JOIN subjects s ON lr.subject_id = s.id
      LEFT JOIN topics t ON lr.topic_id = t.id
      LEFT JOIN library_ratings rat ON lr.id = rat.resource_id
      WHERE lr.is_active = 1
    `;
    const params: unknown[] = [];

    // Apply filters
    if (search) {
      query += ` AND (lr.title LIKE ? OR lr.description LIKE ? OR lr.tags LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (resourceType !== 'all') {
      query += ` AND lr.resource_type = ?`;
      params.push(resourceType);
    }
    if (subjectId) {
      query += ` AND lr.subject_id = ?`;
      params.push(subjectId);
    }
    if (topicId) {
      query += ` AND lr.topic_id = ?`;
      params.push(topicId);
    }
    if (schoolLevel) {
      query += ` AND (lr.school_level = ? OR lr.school_level = 'both')`;
      params.push(schoolLevel);
    }
    if (accessLevel !== 'all') {
      query += ` AND lr.access_level = ?`;
      params.push(accessLevel);
    }

    query += ` GROUP BY lr.id`;

    // Apply sorting
    switch (sortBy) {
      case 'popular':
        query += ` ORDER BY lr.views DESC`;
        break;
      case 'rating':
        query += ` ORDER BY avg_rating DESC NULLS LAST`;
        break;
      case 'title':
        query += ` ORDER BY lr.title ASC`;
        break;
      case 'newest':
      default:
        query += ` ORDER BY lr.created_at DESC`;
    }

    query += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const resources = await c.env.DB.prepare(query).bind(...params).all();

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM library_resources lr WHERE lr.is_active = 1`;
    const countParams: unknown[] = [];

    if (search) {
      countQuery += ` AND (lr.title LIKE ? OR lr.description LIKE ? OR lr.tags LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (resourceType !== 'all') {
      countQuery += ` AND lr.resource_type = ?`;
      countParams.push(resourceType);
    }
    if (subjectId) {
      countQuery += ` AND lr.subject_id = ?`;
      countParams.push(subjectId);
    }

    const countResult = await c.env.DB.prepare(countQuery).bind(...countParams).first();
    const total = (countResult?.total as number) || 0;

    return c.json({
      success: true,
      data: {
        resources: resources.results.map((r: Record<string, unknown>) => ({
          id: r.id,
          title: r.title,
          description: r.description,
          resourceType: r.resource_type,
          contentUrl: r.content_url,
          thumbnailUrl: r.thumbnail_url,
          fileSize: r.file_size,
          duration: r.duration,
          subjectId: r.subject_id,
          topicId: r.topic_id,
          schoolLevel: r.school_level,
          accessLevel: r.access_level,
          tags: r.tags ? JSON.parse(r.tags as string) : [],
          isFeatured: !!r.is_featured,
          isDownloadable: r.is_downloadable !== 0,
          views: r.views,
          downloads: r.downloads,
          rating: r.avg_rating,
          ratingCount: r.rating_count,
          subject: r.subject_name ? { id: r.subject_id, name: r.subject_name } : null,
          topic: r.topic_name ? { id: r.topic_id, name: r.topic_name } : null,
          createdAt: r.created_at,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: offset + resources.results.length < total,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching library resources:', error);
    return c.json({ success: false, error: 'Failed to fetch resources' }, 500);
  }
});

// Get featured resources
libraryApp.get('/featured', async (c) => {
  try {
    const limit = parseLimit(c, 6);

    const resources = await c.env.DB.prepare(`
      SELECT
        lr.*,
        s.name as subject_name,
        AVG(rat.rating) as avg_rating,
        COUNT(DISTINCT rat.id) as rating_count
      FROM library_resources lr
      LEFT JOIN subjects s ON lr.subject_id = s.id
      LEFT JOIN library_ratings rat ON lr.id = rat.resource_id
      WHERE lr.is_active = 1 AND lr.is_featured = 1
      GROUP BY lr.id
      ORDER BY lr.created_at DESC
      LIMIT ?
    `).bind(limit).all();

    return c.json({
      success: true,
      data: resources.results.map((r: Record<string, unknown>) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        resourceType: r.resource_type,
        contentUrl: r.content_url,
        thumbnailUrl: r.thumbnail_url,
        fileSize: r.file_size,
        duration: r.duration,
        accessLevel: r.access_level,
        isDownloadable: r.is_downloadable !== 0,
        views: r.views,
        rating: r.avg_rating,
        ratingCount: r.rating_count,
        subject: r.subject_name ? { id: r.subject_id, name: r.subject_name } : null,
        createdAt: r.created_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching featured resources:', error);
    return c.json({ success: false, error: 'Failed to fetch featured resources' }, 500);
  }
});

// Get single resource by ID
libraryApp.get('/resources/:id', async (c) => {
  try {
    const resourceId = c.req.param('id');
    const userId = getUserId(c);

    const resource = await c.env.DB.prepare(`
      SELECT
        lr.*,
        s.name as subject_name,
        t.name as topic_name,
        u.name as uploader_name,
        AVG(rat.rating) as avg_rating,
        COUNT(DISTINCT rat.id) as rating_count
      FROM library_resources lr
      LEFT JOIN subjects s ON lr.subject_id = s.id
      LEFT JOIN topics t ON lr.topic_id = t.id
      LEFT JOIN users u ON lr.uploaded_by = u.id
      LEFT JOIN library_ratings rat ON lr.id = rat.resource_id
      WHERE lr.id = ? AND lr.is_active = 1
      GROUP BY lr.id
    `).bind(resourceId).first();

    if (!resource) {
      return c.json({ success: false, error: 'Resource not found' }, 404);
    }

    // Get user's progress and bookmark status if authenticated
    let progress = null;
    let isBookmarked = false;
    let userRating = null;

    if (userId) {
      const userProgress = await c.env.DB.prepare(`
        SELECT progress_percent, last_position, completed
        FROM library_progress
        WHERE resource_id = ? AND user_id = ?
      `).bind(resourceId, userId).first();

      progress = userProgress ? {
        percent: userProgress.progress_percent,
        lastPosition: userProgress.last_position,
        completed: !!userProgress.completed,
      } : null;

      // Check if bookmarked
      const bookmark = await c.env.DB.prepare(`
        SELECT 1 FROM library_collection_items lci
        JOIN library_collections lc ON lci.collection_id = lc.id
        WHERE lci.resource_id = ? AND lc.owner_id = ?
        LIMIT 1
      `).bind(resourceId, userId).first();

      isBookmarked = !!bookmark;

      // Get user's rating
      const rating = await c.env.DB.prepare(`
        SELECT rating, review FROM library_ratings
        WHERE resource_id = ? AND user_id = ?
      `).bind(resourceId, userId).first();

      userRating = rating;

      // Increment view count
      await c.env.DB.prepare(`
        UPDATE library_resources SET views = views + 1 WHERE id = ?
      `).bind(resourceId).run();

      // Log access
      await c.env.DB.prepare(`
        INSERT INTO library_access_logs (id, resource_id, user_id, action, accessed_at)
        VALUES (?, ?, ?, 'view', datetime('now'))
      `).bind(`log_${Date.now()}`, resourceId, userId).run();
    }

    return c.json({
      success: true,
      data: {
        id: resource.id,
        title: resource.title,
        description: resource.description,
        resourceType: resource.resource_type,
        contentUrl: resource.content_url,
        thumbnailUrl: resource.thumbnail_url,
        fileSize: resource.file_size,
        duration: resource.duration,
        subjectId: resource.subject_id,
        topicId: resource.topic_id,
        schoolLevel: resource.school_level,
        accessLevel: resource.access_level,
        tags: resource.tags ? JSON.parse(resource.tags as string) : [],
        isFeatured: !!resource.is_featured,
        isDownloadable: resource.is_downloadable !== 0,
        views: resource.views,
        downloads: resource.downloads,
        rating: resource.avg_rating,
        ratingCount: resource.rating_count,
        subject: resource.subject_name ? { id: resource.subject_id, name: resource.subject_name } : null,
        topic: resource.topic_name ? { id: resource.topic_id, name: resource.topic_name } : null,
        uploadedBy: { id: resource.uploaded_by, name: resource.uploader_name },
        createdAt: resource.created_at,
        progress,
        isBookmarked,
        userRating,
      },
    });
  } catch (error) {
    console.error('Error fetching resource:', error);
    return c.json({ success: false, error: 'Failed to fetch resource' }, 500);
  }
});

// Get resources by subject
libraryApp.get('/subjects/:subjectId/resources', async (c) => {
  try {
    const subjectId = c.req.param('subjectId');
    const limit = parseLimit(c, 10);

    const resources = await c.env.DB.prepare(`
      SELECT
        lr.*,
        AVG(rat.rating) as avg_rating
      FROM library_resources lr
      LEFT JOIN library_ratings rat ON lr.id = rat.resource_id
      WHERE lr.subject_id = ? AND lr.is_active = 1
      GROUP BY lr.id
      ORDER BY lr.views DESC
      LIMIT ?
    `).bind(subjectId, limit).all();

    return c.json({
      success: true,
      data: resources.results.map((r: Record<string, unknown>) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        resourceType: r.resource_type,
        thumbnailUrl: r.thumbnail_url,
        isDownloadable: r.is_downloadable !== 0,
        views: r.views,
        rating: r.avg_rating,
      })),
    });
  } catch (error) {
    console.error('Error fetching subject resources:', error);
    return c.json({ success: false, error: 'Failed to fetch resources' }, 500);
  }
});

// =============================================
// PROTECTED LIBRARY ROUTES (require auth)
// =============================================

// Rate a resource
libraryApp.post('/resources/:id/rate', async (c) => {
  try {
    const resourceId = c.req.param('id');
    const userId = getUserId(c);

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    const body = await c.req.json();
    const { rating, review } = body;

    if (!rating || rating < 1 || rating > 5) {
      return c.json({ success: false, error: 'Rating must be between 1 and 5' }, 400);
    }

    // Check if resource exists
    const resource = await c.env.DB.prepare(
      'SELECT id FROM library_resources WHERE id = ?'
    ).bind(resourceId).first();

    if (!resource) {
      return c.json({ success: false, error: 'Resource not found' }, 404);
    }

    // Upsert rating
    await c.env.DB.prepare(`
      INSERT INTO library_ratings (id, resource_id, user_id, rating, review, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(resource_id, user_id) DO UPDATE SET
        rating = excluded.rating,
        review = excluded.review
    `).bind(`rating_${Date.now()}`, resourceId, userId, rating, review || null).run();

    return c.json({ success: true, message: 'Rating submitted' });
  } catch (error) {
    console.error('Error rating resource:', error);
    return c.json({ success: false, error: 'Failed to submit rating' }, 500);
  }
});

// Update reading/watching progress
libraryApp.post('/resources/:id/progress', async (c) => {
  try {
    const resourceId = c.req.param('id');
    const userId = getUserId(c);

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    const body = await c.req.json();
    const { progressPercent, lastPosition, completed } = body;

    await c.env.DB.prepare(`
      INSERT INTO library_progress (id, resource_id, user_id, progress_percent, last_position, completed, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(resource_id, user_id) DO UPDATE SET
        progress_percent = excluded.progress_percent,
        last_position = excluded.last_position,
        completed = excluded.completed,
        updated_at = datetime('now')
    `).bind(
      `prog_${Date.now()}`,
      resourceId,
      userId,
      progressPercent || 0,
      lastPosition || null,
      completed ? 1 : 0
    ).run();

    // Log completion
    if (completed) {
      await c.env.DB.prepare(`
        INSERT INTO library_access_logs (id, resource_id, user_id, action, progress, accessed_at)
        VALUES (?, ?, ?, 'complete', 100, datetime('now'))
      `).bind(`log_${Date.now()}`, resourceId, userId).run();
    }

    return c.json({ success: true, message: 'Progress updated' });
  } catch (error) {
    console.error('Error updating progress:', error);
    return c.json({ success: false, error: 'Failed to update progress' }, 500);
  }
});

// Get user's collections
libraryApp.get('/collections', async (c) => {
  try {
    const userId = getUserId(c);

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    const collections = await c.env.DB.prepare(`
      SELECT
        lc.*,
        COUNT(lci.id) as resource_count
      FROM library_collections lc
      LEFT JOIN library_collection_items lci ON lc.id = lci.collection_id
      WHERE lc.owner_id = ?
      GROUP BY lc.id
      ORDER BY lc.updated_at DESC
    `).bind(userId).all();

    return c.json({
      success: true,
      data: collections.results.map((col: Record<string, unknown>) => ({
        id: col.id,
        name: col.name,
        description: col.description,
        isPublic: !!col.is_public,
        color: col.color,
        resourceCount: col.resource_count,
        createdAt: col.created_at,
        updatedAt: col.updated_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching collections:', error);
    return c.json({ success: false, error: 'Failed to fetch collections' }, 500);
  }
});

// Create a new collection
libraryApp.post('/collections', async (c) => {
  try {
    const userId = getUserId(c);

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    const body = await c.req.json();
    const { name, description, isPublic, color } = body;

    if (!name?.trim()) {
      return c.json({ success: false, error: 'Collection name is required' }, 400);
    }

    const collectionId = `col_${Date.now()}`;

    await c.env.DB.prepare(`
      INSERT INTO library_collections (id, owner_id, name, description, is_public, color, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      collectionId,
      userId,
      name.trim(),
      description || null,
      isPublic ? 1 : 0,
      color || '#3B82F6'
    ).run();

    return c.json({
      success: true,
      data: {
        id: collectionId,
        name: name.trim(),
        description,
        isPublic: !!isPublic,
        color: color || '#3B82F6',
        resourceCount: 0,
      },
    });
  } catch (error) {
    console.error('Error creating collection:', error);
    return c.json({ success: false, error: 'Failed to create collection' }, 500);
  }
});

// Update a collection
libraryApp.put('/collections/:id', async (c) => {
  try {
    const collectionId = c.req.param('id');
    const userId = getUserId(c);

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    // Verify ownership
    const collection = await c.env.DB.prepare(
      'SELECT owner_id FROM library_collections WHERE id = ?'
    ).bind(collectionId).first();

    if (!collection || collection.owner_id !== userId) {
      return c.json({ success: false, error: 'Collection not found' }, 404);
    }

    const body = await c.req.json();
    const { name, description, isPublic, color } = body;

    await c.env.DB.prepare(`
      UPDATE library_collections
      SET name = ?, description = ?, is_public = ?, color = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      name?.trim() || collection.name,
      description ?? collection.description,
      isPublic ? 1 : 0,
      color || collection.color,
      collectionId
    ).run();

    return c.json({ success: true, message: 'Collection updated' });
  } catch (error) {
    console.error('Error updating collection:', error);
    return c.json({ success: false, error: 'Failed to update collection' }, 500);
  }
});

// Delete a collection
libraryApp.delete('/collections/:id', async (c) => {
  try {
    const collectionId = c.req.param('id');
    const userId = getUserId(c);

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    // Verify ownership
    const collection = await c.env.DB.prepare(
      'SELECT owner_id FROM library_collections WHERE id = ?'
    ).bind(collectionId).first();

    if (!collection || collection.owner_id !== userId) {
      return c.json({ success: false, error: 'Collection not found' }, 404);
    }

    // Delete collection (cascade will handle items)
    await c.env.DB.prepare(
      'DELETE FROM library_collections WHERE id = ?'
    ).bind(collectionId).run();

    return c.json({ success: true, message: 'Collection deleted' });
  } catch (error) {
    console.error('Error deleting collection:', error);
    return c.json({ success: false, error: 'Failed to delete collection' }, 500);
  }
});

// Add resource to collection
libraryApp.post('/collections/:id/items', async (c) => {
  try {
    const collectionId = c.req.param('id');
    const userId = getUserId(c);

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    // Verify ownership
    const collection = await c.env.DB.prepare(
      'SELECT owner_id FROM library_collections WHERE id = ?'
    ).bind(collectionId).first();

    if (!collection || collection.owner_id !== userId) {
      return c.json({ success: false, error: 'Collection not found' }, 404);
    }

    const body = await c.req.json();
    const { resourceId } = body;

    if (!resourceId) {
      return c.json({ success: false, error: 'Resource ID is required' }, 400);
    }

    // Check if resource exists
    const resource = await c.env.DB.prepare(
      'SELECT id FROM library_resources WHERE id = ?'
    ).bind(resourceId).first();

    if (!resource) {
      return c.json({ success: false, error: 'Resource not found' }, 404);
    }

    // Add to collection (ignore if already exists)
    await c.env.DB.prepare(`
      INSERT OR IGNORE INTO library_collection_items (id, collection_id, resource_id, added_at)
      VALUES (?, ?, ?, datetime('now'))
    `).bind(`item_${Date.now()}`, collectionId, resourceId).run();

    // Update collection timestamp
    await c.env.DB.prepare(
      'UPDATE library_collections SET updated_at = datetime(\'now\') WHERE id = ?'
    ).bind(collectionId).run();

    return c.json({ success: true, message: 'Resource added to collection' });
  } catch (error) {
    console.error('Error adding to collection:', error);
    return c.json({ success: false, error: 'Failed to add resource' }, 500);
  }
});

// Remove resource from collection
libraryApp.delete('/collections/:collectionId/items/:resourceId', async (c) => {
  try {
    const collectionId = c.req.param('collectionId');
    const resourceId = c.req.param('resourceId');
    const userId = getUserId(c);

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    // Verify ownership
    const collection = await c.env.DB.prepare(
      'SELECT owner_id FROM library_collections WHERE id = ?'
    ).bind(collectionId).first();

    if (!collection || collection.owner_id !== userId) {
      return c.json({ success: false, error: 'Collection not found' }, 404);
    }

    await c.env.DB.prepare(
      'DELETE FROM library_collection_items WHERE collection_id = ? AND resource_id = ?'
    ).bind(collectionId, resourceId).run();

    return c.json({ success: true, message: 'Resource removed from collection' });
  } catch (error) {
    console.error('Error removing from collection:', error);
    return c.json({ success: false, error: 'Failed to remove resource' }, 500);
  }
});

// Get user's reading history
libraryApp.get('/history', async (c) => {
  try {
    const userId = getUserId(c);

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    const limit = parseLimit(c, 20);

    const history = await c.env.DB.prepare(`
      SELECT
        lr.id,
        lr.title,
        lr.resource_type,
        lr.thumbnail_url,
        lp.progress_percent,
        lp.completed,
        lp.updated_at as last_accessed
      FROM library_progress lp
      JOIN library_resources lr ON lp.resource_id = lr.id
      WHERE lp.user_id = ? AND lr.is_active = 1
      ORDER BY lp.updated_at DESC
      LIMIT ?
    `).bind(userId, limit).all();

    return c.json({
      success: true,
      data: history.results.map((h: Record<string, unknown>) => ({
        id: h.id,
        title: h.title,
        resourceType: h.resource_type,
        thumbnailUrl: h.thumbnail_url,
        progress: h.progress_percent,
        completed: !!h.completed,
        lastAccessed: h.last_accessed,
      })),
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    return c.json({ success: false, error: 'Failed to fetch history' }, 500);
  }
});

// =============================================
// ADMIN ROUTES (resource management)
// =============================================

// Upload resource (admin/teacher only)
libraryApp.post('/upload', async (c) => {
  try {
    const userId = getUserId(c);
    const userRole = c.get('userRole');

    console.log('Upload request - userId:', userId, 'userRole:', userRole);

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    if (!['admin', 'teacher'].includes(userRole as string)) {
      return c.json({ success: false, error: `Permission denied. Role '${userRole}' not allowed.` }, 403);
    }

    let formData;
    try {
      formData = await c.req.formData();
    } catch (formError) {
      console.error('FormData parsing error:', formError);
      return c.json({ success: false, error: 'Failed to parse form data' }, 400);
    }
    const file = formData.get('file') as File | null;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string | null;
    const resourceType = formData.get('resourceType') as string;
    const subjectId = formData.get('subjectId') as string | null;
    const topicId = formData.get('topicId') as string | null;
    const schoolLevel = formData.get('schoolLevel') as string | null;
    const accessLevel = formData.get('accessLevel') as string || 'free';
    const tags = formData.get('tags') as string | null;
    const isDownloadable = formData.get('isDownloadable') !== 'false'; // Default to true

    if (!title?.trim()) {
      return c.json({ success: false, error: 'Title is required' }, 400);
    }

    if (!resourceType) {
      return c.json({ success: false, error: 'Resource type is required' }, 400);
    }

    let contentUrl = formData.get('contentUrl') as string || '';
    let fileSize = null;

    // Upload file to R2 if provided
    if (file && c.env.LIBRARY_BUCKET) {
      try {
        const fileExtension = file.name.split('.').pop();
        const fileKey = `resources/${Date.now()}_${crypto.randomUUID()}.${fileExtension}`;

        console.log('Uploading file to R2:', fileKey, 'size:', file.size);

        await c.env.LIBRARY_BUCKET.put(fileKey, file.stream(), {
          httpMetadata: {
            contentType: file.type,
          },
        });

        // Use our API to serve files from R2
        contentUrl = `https://brilla-api.ghwmelite.workers.dev/api/library/files/${fileKey}`;
        fileSize = file.size;
        console.log('File uploaded successfully:', contentUrl);
      } catch (r2Error) {
        console.error('R2 upload error:', r2Error);
        return c.json({ success: false, error: 'Failed to upload file to storage' }, 500);
      }
    } else if (file && !c.env.LIBRARY_BUCKET) {
      console.error('R2 bucket not configured');
      return c.json({ success: false, error: 'Storage not configured on server' }, 500);
    }

    if (!contentUrl) {
      return c.json({ success: false, error: 'File or content URL is required' }, 400);
    }

    const resourceId = `res_${Date.now()}`;

    // Verify user exists in database, or find matching user by role
    let actualUserId = userId;
    try {
      const userExists = await c.env.DB.prepare(
        'SELECT id FROM users WHERE id = ?'
      ).bind(userId).first();

      if (!userExists) {
        // User ID from session doesn't exist - try to find a matching user
        console.log(`User ${userId} not found in database, looking for matching user...`);
        const matchingUser = await c.env.DB.prepare(
          'SELECT id FROM users WHERE role = ? LIMIT 1'
        ).bind(userRole).first();

        if (matchingUser) {
          actualUserId = matchingUser.id as string;
          console.log(`Using matching user ID: ${actualUserId}`);
        } else {
          // No matching user found - use a system ID
          actualUserId = 'system_upload';
          console.log('No matching user found, using system_upload');
        }
      }
    } catch (userCheckError) {
      console.error('Error checking user:', userCheckError);
      // Continue with original userId
    }

    try {
      await c.env.DB.prepare(`
        INSERT INTO library_resources (
          id, title, description, resource_type, content_url, file_size,
          subject_id, topic_id, school_level, access_level, tags,
          uploaded_by, is_downloadable, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(
        resourceId,
        title.trim(),
        description || null,
        resourceType,
        contentUrl,
        fileSize,
        subjectId || null,
        topicId || null,
        schoolLevel || null,
        accessLevel,
        tags ? JSON.stringify(tags.split(',').map((t: string) => t.trim())) : null,
        actualUserId,
        isDownloadable ? 1 : 0
      ).run();

      console.log('Resource saved to database:', resourceId);
    } catch (dbError) {
      console.error('Database insert error:', dbError);
      const errMsg = dbError instanceof Error ? dbError.message : 'Unknown error';
      return c.json({ success: false, error: `Failed to save resource to database: ${errMsg}` }, 500);
    }

    return c.json({
      success: true,
      data: { id: resourceId, contentUrl },
    });
  } catch (error) {
    console.error('Error uploading resource:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ success: false, error: `Failed to upload resource: ${errorMessage}` }, 500);
  }
});

// Update resource (admin/teacher only)
libraryApp.put('/resources/:id', async (c) => {
  try {
    const resourceId = c.req.param('id');
    const userId = getUserId(c);
    const userRole = c.get('userRole');

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    // Check ownership or admin
    const resource = await c.env.DB.prepare(
      'SELECT uploaded_by FROM library_resources WHERE id = ?'
    ).bind(resourceId).first();

    if (!resource) {
      return c.json({ success: false, error: 'Resource not found' }, 404);
    }

    if (resource.uploaded_by !== userId && userRole !== 'admin') {
      return c.json({ success: false, error: 'Permission denied' }, 403);
    }

    const body = await c.req.json();
    const { title, description, subjectId, topicId, schoolLevel, accessLevel, tags, isFeatured, isActive, isDownloadable } = body;

    // Convert undefined to null for D1 compatibility
    const safeTitle = title !== undefined ? (title || null) : null;
    const safeDescription = description !== undefined ? description : null;
    const safeSubjectId = subjectId !== undefined ? subjectId : null;
    const safeTopicId = topicId !== undefined ? topicId : null;
    const safeSchoolLevel = schoolLevel !== undefined ? schoolLevel : null;
    const safeAccessLevel = accessLevel !== undefined ? accessLevel : null;
    const safeTags = tags !== undefined ? (Array.isArray(tags) ? JSON.stringify(tags) : null) : null;
    const safeIsFeatured = isFeatured !== undefined ? (isFeatured ? 1 : 0) : null;
    const safeIsActive = isActive !== undefined ? (isActive ? 1 : 0) : null;
    const safeIsDownloadable = isDownloadable !== undefined ? (isDownloadable ? 1 : 0) : null;

    await c.env.DB.prepare(`
      UPDATE library_resources SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        subject_id = COALESCE(?, subject_id),
        topic_id = COALESCE(?, topic_id),
        school_level = COALESCE(?, school_level),
        access_level = COALESCE(?, access_level),
        tags = COALESCE(?, tags),
        is_featured = COALESCE(?, is_featured),
        is_active = COALESCE(?, is_active),
        is_downloadable = COALESCE(?, is_downloadable),
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      safeTitle,
      safeDescription,
      safeSubjectId,
      safeTopicId,
      safeSchoolLevel,
      safeAccessLevel,
      safeTags,
      safeIsFeatured,
      safeIsActive,
      safeIsDownloadable,
      resourceId
    ).run();

    return c.json({ success: true, message: 'Resource updated' });
  } catch (error) {
    console.error('Error updating resource:', error);
    return c.json({ success: false, error: 'Failed to update resource' }, 500);
  }
});

// Delete resource (admin or resource owner)
libraryApp.delete('/resources/:id', async (c) => {
  try {
    const resourceId = c.req.param('id');
    const userId = getUserId(c);
    const userRole = c.get('userRole');

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    // Check if resource exists and get owner
    const resource = await c.env.DB.prepare(
      'SELECT uploaded_by, content_url FROM library_resources WHERE id = ?'
    ).bind(resourceId).first();

    if (!resource) {
      return c.json({ success: false, error: 'Resource not found' }, 404);
    }

    // Allow admin to delete any resource, or owner to delete their own
    if (userRole !== 'admin' && resource.uploaded_by !== userId) {
      return c.json({ success: false, error: 'Permission denied' }, 403);
    }

    // Optionally delete from R2 if it's a file we uploaded
    const contentUrl = resource.content_url as string;
    if (contentUrl.includes('/api/library/files/') && c.env.LIBRARY_BUCKET) {
      const fileKey = contentUrl.split('/files/')[1];
      if (fileKey) {
        try {
          await c.env.LIBRARY_BUCKET.delete(fileKey);
        } catch (e) {
          console.error('Failed to delete file from R2:', e);
          // Continue with soft delete even if R2 delete fails
        }
      }
    }

    // Soft delete (set is_active = 0)
    await c.env.DB.prepare(
      'UPDATE library_resources SET is_active = 0, updated_at = datetime(\'now\') WHERE id = ?'
    ).bind(resourceId).run();

    return c.json({ success: true, message: 'Resource deleted' });
  } catch (error) {
    console.error('Error deleting resource:', error);
    return c.json({ success: false, error: 'Failed to delete resource' }, 500);
  }
});

// Get library analytics (admin only)
libraryApp.get('/analytics', async (c) => {
  try {
    const userId = getUserId(c);
    const userRole = c.get('userRole');

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    if (userRole !== 'admin') {
      return c.json({ success: false, error: 'Admin access required' }, 403);
    }

    // Total resources by type
    const byType = await c.env.DB.prepare(`
      SELECT resource_type, COUNT(*) as count
      FROM library_resources WHERE is_active = 1
      GROUP BY resource_type
    `).all();

    // Top viewed resources
    const topViewed = await c.env.DB.prepare(`
      SELECT id, title, resource_type, views, downloads
      FROM library_resources WHERE is_active = 1
      ORDER BY views DESC LIMIT 10
    `).all();

    // Top rated resources
    const topRated = await c.env.DB.prepare(`
      SELECT lr.id, lr.title, lr.resource_type, AVG(rat.rating) as avg_rating, COUNT(rat.id) as rating_count
      FROM library_resources lr
      JOIN library_ratings rat ON lr.id = rat.resource_id
      WHERE lr.is_active = 1
      GROUP BY lr.id
      HAVING rating_count >= 3
      ORDER BY avg_rating DESC
      LIMIT 10
    `).all();

    // Activity over time (last 30 days)
    const activity = await c.env.DB.prepare(`
      SELECT DATE(accessed_at) as date, COUNT(*) as views
      FROM library_access_logs
      WHERE accessed_at >= datetime('now', '-30 days')
      GROUP BY DATE(accessed_at)
      ORDER BY date
    `).all();

    // Total stats
    const totalResources = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM library_resources WHERE is_active = 1'
    ).first();

    const totalViews = await c.env.DB.prepare(
      'SELECT SUM(views) as total FROM library_resources'
    ).first();

    const totalUsers = await c.env.DB.prepare(
      'SELECT COUNT(DISTINCT user_id) as count FROM library_access_logs'
    ).first();

    return c.json({
      success: true,
      data: {
        overview: {
          totalResources: totalResources?.count || 0,
          totalViews: totalViews?.total || 0,
          uniqueUsers: totalUsers?.count || 0,
        },
        byType: byType.results,
        topViewed: topViewed.results,
        topRated: topRated.results,
        activityTrend: activity.results,
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return c.json({ success: false, error: 'Failed to fetch analytics' }, 500);
  }
});

export { libraryApp };
