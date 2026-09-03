import { Hono } from 'hono';
import type { Context } from 'hono';
import { requireAuth, constantTimeEqual } from './auth-middleware';
import { parseLimit } from './http';
import type { AuthPayload } from './auth-middleware';

const MAX_RECORDING_BYTES = 100 * 1024 * 1024; // 100MB

// Time-limited signed file URLs minted by the authorized metadata endpoints
// (list/get). The frontend loads assets via <img>/<audio>/<video> src and
// plain fetch(), which cannot send Authorization headers, so file serving
// authorizes via these signatures (or is_public / a share token) instead.
const SIGNED_FILE_URL_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

// Allowed upload content types per asset, matched on the base media type so
// codec parameters (e.g. audio/webm;codecs=opus) are accepted.
const ALLOWED_UPLOAD_CONTENT_TYPES: Record<string, string[]> = {
  events: ['application/json'],
  audio: ['audio/webm'],
  webcam: ['video/webm'],
  thumbnail: ['image/png'],
};

// Types for Cloudflare bindings
interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  RECORDINGS_BUCKET?: R2Bucket;
  APP_URL?: string;
}

// Context variables set by requireAuth
interface AuthVars {
  userId: string;
  userRole: string;
  user: AuthPayload;
}

// Recording type
interface WhiteboardRecording {
  id: string;
  teacher_id: string;
  title: string;
  description: string | null;
  duration: number;
  thumbnail_url: string | null;
  canvas_events_url: string;
  audio_url: string | null;
  webcam_url: string | null;
  canvas_width: number;
  canvas_height: number;
  initial_canvas_json: string | null;
  subject_id: string | null;
  topic_id: string | null;
  status: 'active' | 'archived' | 'deleted';
  is_public: number;
  view_count: number;
  created_at: string;
  updated_at: string;
}

// Generate unique ID. Object keys and share lookups derive from these IDs, so
// they must be cryptographically random, not enumerable.
function generateId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

// Generate secure share token
function generateShareToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// HMAC-SHA256 signature over `<r2 path>.<expiry>` for signed file URLs.
async function signFilePath(path: string, expiresAt: number, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${path}.${expiresAt}`));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Mint a time-limited signed variant of a stored asset URL
// (/api/recordings/files/<r2 path>) for an authorized caller.
async function signAssetUrl(url: string | null, secret: string): Promise<string | null> {
  if (!url) return url;
  const path = url.split('/files/')[1];
  if (!path) return url;
  const exp = Date.now() + SIGNED_FILE_URL_TTL_MS;
  const sig = await signFilePath(path, exp, secret);
  return `${url}?sig=${sig}&exp=${exp}`;
}

// Verify the sig/exp query params on a /files/ request against the R2 path.
async function hasValidFileSignature(path: string, url: URL, secret: string): Promise<boolean> {
  const sig = url.searchParams.get('sig');
  const exp = url.searchParams.get('exp');
  if (!sig || !exp || !/^\d+$/.test(exp)) return false;
  const expiresAt = Number(exp);
  if (expiresAt < Date.now()) return false;
  return constantTimeEqual(sig, await signFilePath(path, expiresAt, secret));
}

// Recordings routes
const recordingsApp = new Hono<{ Bindings: Env; Variables: AuthVars }>();

// Auth middleware: /public/ (share-token metadata) and /files/ (R2 serving)
// run without requireAuth — the /files/ handler enforces its own
// authorization (is_public, share token, or signed URL). Everything else
// requires a verified JWT (sets userId/userRole on context).
recordingsApp.use('*', async (c, next) => {
  const url = new URL(c.req.url);
  if (url.pathname.includes('/public/') || url.pathname.includes('/files/')) {
    return next();
  }
  return requireAuth(c, next);
});

// Helper to get user ID from context
function getUserId(c: Context): string | undefined {
  return c.get('userId');
}

// Helper to check if user is teacher or admin
function isTeacherOrAdmin(c: Context): boolean {
  const role = c.get('userRole');
  return role === 'teacher' || role === 'admin';
}

// =============================================
// FILE SERVING (AUTHORIZED VIA is_public / SHARE TOKEN / SIGNED URL)
// =============================================

// Serve recording files from R2 bucket
recordingsApp.get('/files/*', async (c) => {
  try {
    const url = new URL(c.req.url);
    const path = url.pathname.split('/files/')[1] || '';

    if (!c.env.RECORDINGS_BUCKET) {
      return c.json({ success: false, error: 'Storage not configured' }, 500);
    }

    // Authorize before touching storage. Object keys are
    // recordings/<recordingId>/<asset>; the recording row decides access.
    const recordingId = path.match(/^recordings\/([^/]+)\/[^/]+$/)?.[1];
    if (!recordingId) {
      return c.json({ success: false, error: 'File not found' }, 404);
    }

    const recording = await c.env.DB.prepare(`
      SELECT is_public, status FROM whiteboard_recordings WHERE id = ?
    `).bind(recordingId).first() as { is_public: number; status: string } | null;

    if (!recording || recording.status === 'deleted') {
      return c.json({ success: false, error: 'File not found' }, 404);
    }

    let allowed = recording.is_public === 1;

    // Share-token access: token must reference an active, unexpired share for
    // this recording that has not exhausted its view limit.
    if (!allowed) {
      const shareToken = url.searchParams.get('share');
      if (shareToken) {
        const share = await c.env.DB.prepare(`
          SELECT expires_at, max_views, current_views
          FROM recording_shares
          WHERE share_token = ? AND recording_id = ? AND is_active = 1
        `).bind(shareToken, recordingId).first() as {
          expires_at: string | null;
          max_views: number | null;
          current_views: number;
        } | null;

        allowed = !!share
          && (!share.expires_at || new Date(share.expires_at) > new Date())
          && (!share.max_views || share.current_views < share.max_views);
      }
    }

    // Signed-URL access for callers authorized by the metadata endpoints.
    if (!allowed) {
      allowed = await hasValidFileSignature(path, url, c.env.JWT_SECRET);
    }

    if (!allowed) {
      return c.json({ success: false, error: 'Access denied' }, 403);
    }

    const object = await c.env.RECORDINGS_BUCKET.get(path);

    if (!object) {
      return c.json({ success: false, error: 'File not found' }, 404);
    }

    const headers = new Headers();
    headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream');
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Cache-Control', 'public, max-age=31536000');
    // No Access-Control-Allow-Origin here: the global cors middleware scopes
    // cross-origin access to the app origin.

    return new Response(object.body, { headers });
  } catch (error) {
    console.error('Error serving file:', error);
    return c.json({ success: false, error: 'Failed to serve file' }, 500);
  }
});

// =============================================
// PUBLIC RECORDING ACCESS (via share token)
// =============================================

recordingsApp.get('/public/:shareToken', async (c) => {
  const shareToken = c.req.param('shareToken');

  try {
    // Find share record
    const share = await c.env.DB.prepare(`
      SELECT rs.*, wr.*
      FROM recording_shares rs
      JOIN whiteboard_recordings wr ON rs.recording_id = wr.id
      WHERE rs.share_token = ? AND rs.is_active = 1 AND wr.status = 'active'
    `).bind(shareToken).first() as (Record<string, unknown> & WhiteboardRecording) | null;

    if (!share) {
      return c.json({ success: false, error: 'Recording not found or link expired' }, 404);
    }

    // Check expiration
    if (share.expires_at && new Date(share.expires_at as string) < new Date()) {
      return c.json({ success: false, error: 'Share link has expired' }, 410);
    }

    // Check view limit
    if (share.max_views && (share.current_views as number) >= (share.max_views as number)) {
      return c.json({ success: false, error: 'Share link view limit reached' }, 410);
    }

    // Increment view count
    await c.env.DB.batch([
      c.env.DB.prepare(`
        UPDATE recording_shares SET current_views = current_views + 1 WHERE id = ?
      `).bind(share.id),
      c.env.DB.prepare(`
        UPDATE whiteboard_recordings SET view_count = view_count + 1 WHERE id = ?
      `).bind(share.recording_id),
    ]);

    // Get teacher name
    const teacher = await c.env.DB.prepare(`
      SELECT name FROM users WHERE id = ?
    `).bind(share.teacher_id).first() as { name: string } | null;

    // Asset URLs carry the share token so the gated /files/ route can
    // authorize these unauthenticated loads (revocation/expiry/view limits
    // are re-checked at serve time).
    const withShareToken = (assetUrl: string | null) =>
      assetUrl ? `${assetUrl}?share=${shareToken}` : assetUrl;

    return c.json({
      success: true,
      data: {
        id: share.recording_id,
        title: share.title,
        description: share.description,
        duration: share.duration,
        teacherName: teacher?.name || 'Unknown Teacher',
        thumbnailUrl: withShareToken(share.thumbnail_url),
        canvasEventsUrl: withShareToken(share.canvas_events_url),
        audioUrl: withShareToken(share.audio_url),
        webcamUrl: withShareToken(share.webcam_url),
        canvasWidth: share.canvas_width,
        canvasHeight: share.canvas_height,
        initialCanvasJSON: share.initial_canvas_json,
        createdAt: share.created_at,
      },
    });
  } catch (error) {
    console.error('Error fetching public recording:', error);
    return c.json({ success: false, error: 'Failed to fetch recording' }, 500);
  }
});

// =============================================
// PROTECTED RECORDING ENDPOINTS
// =============================================

// List recordings for current teacher
recordingsApp.get('/', async (c) => {
  const userId = getUserId(c);

  if (!userId) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  if (!isTeacherOrAdmin(c)) {
    return c.json({ success: false, error: 'Teacher or admin access required' }, 403);
  }

  try {
    const status = c.req.query('status') || 'active';
    const search = c.req.query('search') || '';
    const limit = parseLimit(c, 20);
    const offset = parseInt(c.req.query('offset') || '0');

    let query = `
      SELECT wr.*, u.name as teacher_name
      FROM whiteboard_recordings wr
      LEFT JOIN users u ON wr.teacher_id = u.id
      WHERE wr.teacher_id = ? AND wr.status = ?
    `;
    const params: (string | number)[] = [userId, status];

    if (search) {
      query += ` AND (wr.title LIKE ? OR wr.description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY wr.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const recordings = await c.env.DB.prepare(query).bind(...params).all();

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM whiteboard_recordings
      WHERE teacher_id = ? AND status = ?
    `;
    const countParams: (string | number)[] = [userId, status];

    if (search) {
      countQuery += ` AND (title LIKE ? OR description LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const countResult = await c.env.DB.prepare(countQuery).bind(...countParams).first() as { total: number };

    return c.json({
      success: true,
      data: {
        recordings: await Promise.all(recordings.results?.map(async (r: Record<string, unknown>) => ({
          id: r.id,
          title: r.title,
          description: r.description,
          duration: r.duration,
          teacherId: r.teacher_id,
          teacherName: r.teacher_name,
          thumbnailUrl: await signAssetUrl(r.thumbnail_url as string | null, c.env.JWT_SECRET),
          canvasEventsUrl: await signAssetUrl(r.canvas_events_url as string | null, c.env.JWT_SECRET),
          audioUrl: await signAssetUrl(r.audio_url as string | null, c.env.JWT_SECRET),
          webcamUrl: await signAssetUrl(r.webcam_url as string | null, c.env.JWT_SECRET),
          canvasWidth: r.canvas_width,
          canvasHeight: r.canvas_height,
          subjectId: r.subject_id,
          topicId: r.topic_id,
          isPublic: r.is_public === 1,
          viewCount: r.view_count,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        })) || []),
        total: countResult?.total || 0,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('Error listing recordings:', error);
    return c.json({ success: false, error: 'Failed to list recordings' }, 500);
  }
});

// Get a specific recording
recordingsApp.get('/:id', async (c) => {
  const userId = getUserId(c);
  const recordingId = c.req.param('id');

  if (!userId) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  try {
    const recording = await c.env.DB.prepare(`
      SELECT wr.*, u.name as teacher_name
      FROM whiteboard_recordings wr
      LEFT JOIN users u ON wr.teacher_id = u.id
      WHERE wr.id = ? AND wr.status != 'deleted'
    `).bind(recordingId).first() as (Record<string, unknown> & WhiteboardRecording) | null;

    if (!recording) {
      return c.json({ success: false, error: 'Recording not found' }, 404);
    }

    // Check access - owner, admin, or public recording
    if (recording.teacher_id !== userId && !isTeacherOrAdmin(c) && !recording.is_public) {
      return c.json({ success: false, error: 'Access denied' }, 403);
    }

    // Increment view count if not owner
    if (recording.teacher_id !== userId) {
      await c.env.DB.prepare(`
        UPDATE whiteboard_recordings SET view_count = view_count + 1 WHERE id = ?
      `).bind(recordingId).run();

      // Track view
      await c.env.DB.prepare(`
        INSERT INTO recording_views (id, recording_id, viewer_id)
        VALUES (?, ?, ?)
      `).bind(generateId('rv'), recordingId, userId).run();
    }

    return c.json({
      success: true,
      data: {
        id: recording.id,
        title: recording.title,
        description: recording.description,
        duration: recording.duration,
        teacherId: recording.teacher_id,
        teacherName: recording.teacher_name,
        thumbnailUrl: await signAssetUrl(recording.thumbnail_url, c.env.JWT_SECRET),
        canvasEventsUrl: await signAssetUrl(recording.canvas_events_url, c.env.JWT_SECRET),
        audioUrl: await signAssetUrl(recording.audio_url, c.env.JWT_SECRET),
        webcamUrl: await signAssetUrl(recording.webcam_url, c.env.JWT_SECRET),
        canvasWidth: recording.canvas_width,
        canvasHeight: recording.canvas_height,
        initialCanvasJSON: recording.initial_canvas_json,
        subjectId: recording.subject_id,
        topicId: recording.topic_id,
        isPublic: recording.is_public === 1,
        viewCount: recording.view_count,
        createdAt: recording.created_at,
        updatedAt: recording.updated_at,
      },
    });
  } catch (error) {
    console.error('Error fetching recording:', error);
    return c.json({ success: false, error: 'Failed to fetch recording' }, 500);
  }
});

// Create a new recording
recordingsApp.post('/', async (c) => {
  const userId = getUserId(c);

  if (!userId) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  if (!isTeacherOrAdmin(c)) {
    return c.json({ success: false, error: 'Teacher or admin access required' }, 403);
  }

  try {
    const body = await c.req.json();
    const {
      title,
      description,
      duration,
      canvasWidth = 1200,
      canvasHeight = 800,
      initialCanvasJSON,
      subjectId,
      topicId,
    } = body;

    if (!title || !duration) {
      return c.json({ success: false, error: 'Title and duration are required' }, 400);
    }

    const id = generateId('rec');
    const canvasEventsUrl = `recordings/${id}/events.json`;

    await c.env.DB.prepare(`
      INSERT INTO whiteboard_recordings (
        id, teacher_id, title, description, duration,
        canvas_events_url, canvas_width, canvas_height, initial_canvas_json,
        subject_id, topic_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, userId, title, description || null, duration,
      canvasEventsUrl, canvasWidth, canvasHeight, initialCanvasJSON || null,
      subjectId || null, topicId || null
    ).run();

    return c.json({
      success: true,
      data: {
        id,
        canvasEventsUrl,
      },
    });
  } catch (error) {
    console.error('Error creating recording:', error);
    return c.json({ success: false, error: 'Failed to create recording' }, 500);
  }
});

// Get upload URLs for recording assets
recordingsApp.post('/:id/upload-urls', async (c) => {
  const userId = getUserId(c);
  const recordingId = c.req.param('id');

  if (!userId) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  if (!isTeacherOrAdmin(c)) {
    return c.json({ success: false, error: 'Teacher or admin access required' }, 403);
  }

  try {
    // Verify ownership
    const recording = await c.env.DB.prepare(`
      SELECT id, teacher_id FROM whiteboard_recordings WHERE id = ?
    `).bind(recordingId).first() as { id: string; teacher_id: string } | null;

    if (!recording || recording.teacher_id !== userId) {
      return c.json({ success: false, error: 'Recording not found or access denied' }, 404);
    }

    const body = await c.req.json();
    const { files } = body as { files: Array<{ type: 'events' | 'audio' | 'webcam' | 'thumbnail'; contentType: string }> };

    if (!files || !Array.isArray(files)) {
      return c.json({ success: false, error: 'Files array required' }, 400);
    }

    // Generate paths for each file type
    const uploadInfo = await Promise.all(files.map(async (file) => {
      let path: string;
      switch (file.type) {
        case 'events':
          path = `recordings/${recordingId}/events.json`;
          break;
        case 'audio':
          path = `recordings/${recordingId}/audio.webm`;
          break;
        case 'webcam':
          path = `recordings/${recordingId}/webcam.webm`;
          break;
        case 'thumbnail':
          path = `recordings/${recordingId}/thumbnail.png`;
          break;
        default:
          throw new Error(`Unknown file type: ${file.type}`);
      }

      // Build the upload URL (direct R2 URL via our API)
      const uploadUrl = `/api/recordings/upload/${recordingId}/${file.type}`;
      const publicUrl = await signAssetUrl(`/api/recordings/files/${path}`, c.env.JWT_SECRET);

      return {
        type: file.type,
        uploadUrl,
        publicUrl,
        path,
      };
    }));

    return c.json({
      success: true,
      data: { uploads: uploadInfo },
    });
  } catch (error) {
    console.error('Error generating upload URLs:', error);
    return c.json({ success: false, error: 'Failed to generate upload URLs' }, 500);
  }
});

// Upload recording asset
recordingsApp.put('/upload/:recordingId/:fileType', async (c) => {
  const userId = getUserId(c);
  const recordingId = c.req.param('recordingId');
  const fileType = c.req.param('fileType') as 'events' | 'audio' | 'webcam' | 'thumbnail';

  if (!userId) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  if (!c.env.RECORDINGS_BUCKET) {
    return c.json({ success: false, error: 'Storage not configured' }, 500);
  }

  try {
    // Verify ownership
    const recording = await c.env.DB.prepare(`
      SELECT id, teacher_id FROM whiteboard_recordings WHERE id = ?
    `).bind(recordingId).first() as { id: string; teacher_id: string } | null;

    if (!recording || recording.teacher_id !== userId) {
      return c.json({ success: false, error: 'Recording not found or access denied' }, 404);
    }

    // Determine file path and content type
    let path: string;
    let dbColumn: string | null = null;

    switch (fileType) {
      case 'events':
        path = `recordings/${recordingId}/events.json`;
        dbColumn = 'canvas_events_url';
        break;
      case 'audio':
        path = `recordings/${recordingId}/audio.webm`;
        dbColumn = 'audio_url';
        break;
      case 'webcam':
        path = `recordings/${recordingId}/webcam.webm`;
        dbColumn = 'webcam_url';
        break;
      case 'thumbnail':
        path = `recordings/${recordingId}/thumbnail.png`;
        dbColumn = 'thumbnail_url';
        break;
      default:
        return c.json({ success: false, error: 'Invalid file type' }, 400);
    }

    // Validate the client-declared content type against the per-asset
    // whitelist before accepting the body.
    const contentType = (c.req.header('Content-Type') || '').split(';')[0].trim().toLowerCase();
    if (!ALLOWED_UPLOAD_CONTENT_TYPES[fileType].includes(contentType)) {
      return c.json({ success: false, error: 'Unsupported content type for this file type' }, 415);
    }

    // Get request body as ArrayBuffer (capped to MAX_RECORDING_BYTES)
    const declared = Number(c.req.header('Content-Length') || 0);
    if (declared > MAX_RECORDING_BYTES) {
      return c.json({ success: false, error: 'File exceeds 100MB limit' }, 413);
    }
    const body = await c.req.arrayBuffer();
    if (body.byteLength > MAX_RECORDING_BYTES) {
      return c.json({ success: false, error: 'File exceeds 100MB limit' }, 413);
    }

    // Upload to R2
    await c.env.RECORDINGS_BUCKET.put(path, body, {
      httpMetadata: {
        contentType,
      },
    });

    // Update database with the file URL
    const publicUrl = `/api/recordings/files/${path}`;
    if (dbColumn) {
      try {
        await c.env.DB.prepare(`
          UPDATE whiteboard_recordings SET ${dbColumn} = ?, updated_at = datetime('now') WHERE id = ?
        `).bind(publicUrl, recordingId).run();
      } catch (dbError) {
        // Best-effort compensating delete so no orphaned R2 object remains
        try {
          await c.env.RECORDINGS_BUCKET.delete(path);
        } catch (deleteError) {
          console.error(`Orphan risk: failed to link R2 object ${path}`, deleteError);
        }
        console.error(`Orphan risk: failed to link R2 object ${path}`, dbError);
        return c.json({ success: false, error: 'Failed to upload file' }, 500);
      }
    }

    return c.json({
      success: true,
      data: {
        path,
        url: await signAssetUrl(publicUrl, c.env.JWT_SECRET),
      },
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return c.json({ success: false, error: 'Failed to upload file' }, 500);
  }
});

// Update recording metadata
recordingsApp.put('/:id', async (c) => {
  const userId = getUserId(c);
  const recordingId = c.req.param('id');

  if (!userId) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  try {
    // Verify ownership
    const recording = await c.env.DB.prepare(`
      SELECT id, teacher_id FROM whiteboard_recordings WHERE id = ?
    `).bind(recordingId).first() as { id: string; teacher_id: string } | null;

    if (!recording) {
      return c.json({ success: false, error: 'Recording not found' }, 404);
    }

    if (recording.teacher_id !== userId && !isTeacherOrAdmin(c)) {
      return c.json({ success: false, error: 'Access denied' }, 403);
    }

    const body = await c.req.json();
    const { title, description, subjectId, topicId, isPublic } = body;

    const updates: string[] = [];
    const params: (string | number | null)[] = [];

    if (title !== undefined) {
      updates.push('title = ?');
      params.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
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

    if (updates.length === 0) {
      return c.json({ success: false, error: 'No fields to update' }, 400);
    }

    updates.push("updated_at = datetime('now')");
    params.push(recordingId);

    await c.env.DB.prepare(`
      UPDATE whiteboard_recordings SET ${updates.join(', ')} WHERE id = ?
    `).bind(...params).run();

    return c.json({ success: true, data: { id: recordingId } });
  } catch (error) {
    console.error('Error updating recording:', error);
    return c.json({ success: false, error: 'Failed to update recording' }, 500);
  }
});

// Delete recording (soft delete)
recordingsApp.delete('/:id', async (c) => {
  const userId = getUserId(c);
  const recordingId = c.req.param('id');

  if (!userId) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  try {
    // Verify ownership
    const recording = await c.env.DB.prepare(`
      SELECT id, teacher_id, canvas_events_url, audio_url, webcam_url, thumbnail_url
      FROM whiteboard_recordings WHERE id = ?
    `).bind(recordingId).first() as Record<string, unknown> | null;

    if (!recording) {
      return c.json({ success: false, error: 'Recording not found' }, 404);
    }

    if (recording.teacher_id !== userId && !isTeacherOrAdmin(c)) {
      return c.json({ success: false, error: 'Access denied' }, 403);
    }

    // Soft delete the recording
    await c.env.DB.prepare(`
      UPDATE whiteboard_recordings SET status = 'deleted', updated_at = datetime('now') WHERE id = ?
    `).bind(recordingId).run();

    // Delete files from R2 in the background so the response isn't blocked;
    // log orphans instead of failing the request.
    if (c.env.RECORDINGS_BUCKET) {
      const filesToDelete = [
        recording.canvas_events_url,
        recording.audio_url,
        recording.webcam_url,
        recording.thumbnail_url,
      ].filter(Boolean) as string[];

      c.executionCtx.waitUntil((async () => {
        for (const url of filesToDelete) {
          const path = url.replace('/api/recordings/files/', '');
          try {
            await c.env.RECORDINGS_BUCKET!.delete(path);
          } catch (err) {
            console.error(`Orphaned R2 object ${path}:`, err);
          }
        }
      })());
    }

    return c.json({ success: true, data: { id: recordingId } });
  } catch (error) {
    console.error('Error deleting recording:', error);
    return c.json({ success: false, error: 'Failed to delete recording' }, 500);
  }
});

// =============================================
// SHARE LINK MANAGEMENT
// =============================================

// Create a share link for a recording
recordingsApp.post('/:id/share', async (c) => {
  const userId = getUserId(c);
  const recordingId = c.req.param('id');

  if (!userId) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  try {
    // Verify ownership
    const recording = await c.env.DB.prepare(`
      SELECT id, teacher_id FROM whiteboard_recordings WHERE id = ? AND status = 'active'
    `).bind(recordingId).first() as { id: string; teacher_id: string } | null;

    if (!recording || recording.teacher_id !== userId) {
      return c.json({ success: false, error: 'Recording not found or access denied' }, 404);
    }

    const body = await c.req.json();
    const { expiresInDays, maxViews } = body;

    const shareToken = generateShareToken();
    const id = generateId('rs');

    let expiresAt: string | null = null;
    if (expiresInDays) {
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + expiresInDays);
      expiresAt = expDate.toISOString();
    }

    await c.env.DB.prepare(`
      INSERT INTO recording_shares (id, recording_id, share_token, created_by, expires_at, max_views)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(id, recordingId, shareToken, userId, expiresAt, maxViews || null).run();

    const shareUrl = `${c.env.APP_URL || ''}/teacher/whiteboard/recording/share/${shareToken}`;

    return c.json({
      success: true,
      data: {
        id,
        shareToken,
        shareUrl,
        expiresAt,
        maxViews,
      },
    });
  } catch (error) {
    console.error('Error creating share link:', error);
    return c.json({ success: false, error: 'Failed to create share link' }, 500);
  }
});

// List share links for a recording
recordingsApp.get('/:id/shares', async (c) => {
  const userId = getUserId(c);
  const recordingId = c.req.param('id');

  if (!userId) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  try {
    // Verify ownership
    const recording = await c.env.DB.prepare(`
      SELECT id, teacher_id FROM whiteboard_recordings WHERE id = ?
    `).bind(recordingId).first() as { id: string; teacher_id: string } | null;

    if (!recording || recording.teacher_id !== userId) {
      return c.json({ success: false, error: 'Recording not found or access denied' }, 404);
    }

    const shares = await c.env.DB.prepare(`
      SELECT * FROM recording_shares WHERE recording_id = ? ORDER BY created_at DESC
    `).bind(recordingId).all();

    return c.json({
      success: true,
      data: {
        shares: shares.results?.map((s: Record<string, unknown>) => ({
          id: s.id,
          shareToken: s.share_token,
          shareUrl: `${c.env.APP_URL || ''}/teacher/whiteboard/recording/share/${s.share_token}`,
          expiresAt: s.expires_at,
          maxViews: s.max_views,
          currentViews: s.current_views,
          isActive: s.is_active === 1,
          createdAt: s.created_at,
        })) || [],
      },
    });
  } catch (error) {
    console.error('Error listing share links:', error);
    return c.json({ success: false, error: 'Failed to list share links' }, 500);
  }
});

// Revoke a share link
recordingsApp.delete('/shares/:shareId', async (c) => {
  const userId = getUserId(c);
  const shareId = c.req.param('shareId');

  if (!userId) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  try {
    // Verify ownership via recording
    const share = await c.env.DB.prepare(`
      SELECT rs.*, wr.teacher_id
      FROM recording_shares rs
      JOIN whiteboard_recordings wr ON rs.recording_id = wr.id
      WHERE rs.id = ?
    `).bind(shareId).first() as Record<string, unknown> | null;

    if (!share || share.teacher_id !== userId) {
      return c.json({ success: false, error: 'Share link not found or access denied' }, 404);
    }

    await c.env.DB.prepare(`
      UPDATE recording_shares SET is_active = 0 WHERE id = ?
    `).bind(shareId).run();

    return c.json({ success: true, data: { id: shareId } });
  } catch (error) {
    console.error('Error revoking share link:', error);
    return c.json({ success: false, error: 'Failed to revoke share link' }, 500);
  }
});

// =============================================
// RECORDING ANALYTICS
// =============================================

// Get recording analytics
recordingsApp.get('/:id/analytics', async (c) => {
  const userId = getUserId(c);
  const recordingId = c.req.param('id');

  if (!userId) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  try {
    // Verify ownership
    const recording = await c.env.DB.prepare(`
      SELECT id, teacher_id, view_count FROM whiteboard_recordings WHERE id = ?
    `).bind(recordingId).first() as { id: string; teacher_id: string; view_count: number } | null;

    if (!recording || recording.teacher_id !== userId) {
      return c.json({ success: false, error: 'Recording not found or access denied' }, 404);
    }

    // Get view stats
    const viewStats = await c.env.DB.prepare(`
      SELECT
        COUNT(*) as total_views,
        COUNT(DISTINCT viewer_id) as unique_viewers,
        SUM(completed) as completions,
        AVG(watch_duration) as avg_watch_duration
      FROM recording_views
      WHERE recording_id = ?
    `).bind(recordingId).first() as Record<string, number>;

    // Get recent views
    const recentViews = await c.env.DB.prepare(`
      SELECT rv.*, u.name as viewer_name
      FROM recording_views rv
      LEFT JOIN users u ON rv.viewer_id = u.id
      WHERE rv.recording_id = ?
      ORDER BY rv.viewed_at DESC
      LIMIT 20
    `).bind(recordingId).all();

    return c.json({
      success: true,
      data: {
        totalViews: recording.view_count,
        uniqueViewers: viewStats?.unique_viewers || 0,
        completions: viewStats?.completions || 0,
        avgWatchDuration: viewStats?.avg_watch_duration || 0,
        recentViews: recentViews.results?.map((v: Record<string, unknown>) => ({
          viewerName: v.viewer_name || 'Anonymous',
          viewedAt: v.viewed_at,
          watchDuration: v.watch_duration,
          completed: v.completed === 1,
        })) || [],
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return c.json({ success: false, error: 'Failed to fetch analytics' }, 500);
  }
});

export { recordingsApp };
