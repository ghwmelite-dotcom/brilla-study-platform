import { Hono } from 'hono';
import { verify } from 'hono/jwt';

// Types for Cloudflare bindings
interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  APP_URL: string;
  PAYSTACK_SECRET_KEY: string;
}

// JWT payload type
interface UserPayload {
  userId: string;
  email: string;
  role: string;
  exp?: number;
}

// Verify JWT token
async function verifyJWT(token: string, secret: string): Promise<UserPayload | null> {
  try {
    const payload = await verify(token, secret);
    return payload as UserPayload;
  } catch {
    return null;
  }
}

// Authentication middleware
const authMiddleware = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');

  if (c.req.method === 'OPTIONS') {
    return next();
  }

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const token = authHeader.replace('Bearer ', '');

  // Demo token support
  if (token.endsWith('_demo_token')) {
    const isDevelopment = c.env.ENVIRONMENT === 'development' || c.env.ENVIRONMENT === 'dev';
    if (isDevelopment) {
      const tokenPrefix = token.replace('_demo_token', '');
      const demoUsers: Record<string, { id: string; role: string }> = {
        'student': { id: 'student_1766327981521', role: 'student' },
        'teacher': { id: 'teacher_1766327981453', role: 'teacher' },
        'admin': { id: 'admin_prod_001', role: 'admin' },
      };
      const demoUser = demoUsers[tokenPrefix];
      if (demoUser) {
        c.set('userId', demoUser.id);
        c.set('userRole', demoUser.role);
        return next();
      }
    }
  }

  try {
    const payload = await verifyJWT(token, c.env.JWT_SECRET);
    if (!payload) {
      return c.json({ success: false, error: 'Invalid token' }, 401);
    }

    c.set('userId', payload.userId);
    c.set('userEmail', payload.email);
    c.set('userRole', payload.role);
    return next();
  } catch {
    return c.json({ success: false, error: 'Token verification failed' }, 401);
  }
};

// Optional auth middleware (for public routes that may have auth)
const optionalAuthMiddleware = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '');
    try {
      const payload = await verifyJWT(token, c.env.JWT_SECRET);
      if (payload) {
        c.set('userId', payload.userId);
        c.set('userEmail', payload.email);
        c.set('userRole', payload.role);
      }
    } catch {
      // Ignore invalid tokens for optional auth
    }
  }

  return next();
};

const adminMiddleware = async (c: any, next: any) => {
  const role = c.get('userRole');
  if (role !== 'admin') {
    return c.json({ success: false, error: 'Admin access required' }, 403);
  }
  return next();
};

const teacherMiddleware = async (c: any, next: any) => {
  const role = c.get('userRole');
  if (role !== 'teacher' && role !== 'admin') {
    return c.json({ success: false, error: 'Teacher access required' }, 403);
  }
  return next();
};

const studentMiddleware = async (c: any, next: any) => {
  const role = c.get('userRole');
  if (role !== 'student' && role !== 'admin') {
    return c.json({ success: false, error: 'Student access required' }, 403);
  }
  return next();
};

// Generate unique ID
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Create the router
export const tutoringRouter = new Hono<{ Bindings: Env }>();


// ============================================
// PUBLIC DIRECTORY ENDPOINTS
// ============================================

/**
 * GET /tutoring/directory
 * List approved teachers in the directory (public)
 */
tutoringRouter.get('/directory', optionalAuthMiddleware, async (c) => {
  const search = c.req.query('search');
  const subjectId = c.req.query('subjectId');
  const sessionType = c.req.query('sessionType');
  const minRating = parseFloat(c.req.query('minRating') || '0');
  const maxRate = parseFloat(c.req.query('maxRate') || '999999');
  const minRate = parseFloat(c.req.query('minRate') || '0');
  const sortBy = c.req.query('sortBy') || 'rating';
  const page = parseInt(c.req.query('page') || '1');
  const pageSize = Math.min(parseInt(c.req.query('pageSize') || '12'), 50);
  const offset = (page - 1) * pageSize;

  try {
    let whereClause = "WHERE tdp.directory_status = 'approved' AND tdp.is_visible = 1";
    const params: any[] = [];

    if (search) {
      whereClause += ` AND (tdp.display_name LIKE ? OR tdp.bio LIKE ? OR tdp.tagline LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (subjectId) {
      whereClause += ` AND tdp.subjects LIKE ?`;
      params.push(`%${subjectId}%`);
    }

    if (sessionType) {
      whereClause += ` AND tdp.session_types LIKE ?`;
      params.push(`%${sessionType}%`);
    }

    if (minRating > 0) {
      whereClause += ` AND tdp.average_rating >= ?`;
      params.push(minRating);
    }

    whereClause += ` AND tdp.hourly_rate >= ? AND tdp.hourly_rate <= ?`;
    params.push(minRate, maxRate);

    // Order by
    let orderBy = 'tdp.average_rating DESC, tdp.total_sessions DESC';
    switch (sortBy) {
      case 'price_low':
        orderBy = 'tdp.hourly_rate ASC';
        break;
      case 'price_high':
        orderBy = 'tdp.hourly_rate DESC';
        break;
      case 'sessions':
        orderBy = 'tdp.total_sessions DESC';
        break;
      case 'newest':
        orderBy = 'tdp.approved_at DESC';
        break;
      default:
        orderBy = 'tdp.is_featured DESC, tdp.average_rating DESC, tdp.total_sessions DESC';
    }

    // Count total
    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM teacher_directory_profiles tdp
      ${whereClause}
    `).bind(...params).first();

    // Get teachers
    const result = await c.env.DB.prepare(`
      SELECT
        tdp.id,
        tdp.teacher_id,
        tdp.display_name,
        tdp.tagline,
        tdp.profile_photo_url,
        tdp.subjects,
        tdp.session_types,
        tdp.hourly_rate,
        tdp.average_rating,
        tdp.rating_count,
        tdp.total_sessions,
        tdp.response_rate,
        tdp.is_featured
      FROM teacher_directory_profiles tdp
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `).bind(...params, pageSize, offset).all();

    const teachers = (result.results || []).map((row: any) => ({
      id: row.id,
      teacherId: row.teacher_id,
      displayName: row.display_name,
      tagline: row.tagline,
      profilePhotoUrl: row.profile_photo_url,
      subjects: JSON.parse(row.subjects || '[]'),
      sessionTypes: JSON.parse(row.session_types || '[]'),
      hourlyRate: row.hourly_rate,
      averageRating: row.average_rating || 0,
      ratingCount: row.rating_count || 0,
      totalSessions: row.total_sessions || 0,
      responseRate: row.response_rate || 100,
      isFeatured: !!row.is_featured
    }));

    return c.json({
      success: true,
      data: {
        teachers,
        total: (countResult?.count as number) || 0,
        page,
        pageSize,
        hasMore: offset + pageSize < ((countResult?.count as number) || 0)
      }
    });
  } catch (error) {
    console.error('Error listing directory:', error);
    return c.json({ success: false, error: 'Failed to list teachers' }, 500);
  }
});


/**
 * GET /tutoring/directory/:id
 * Get a teacher's public profile
 */
tutoringRouter.get('/directory/:id', optionalAuthMiddleware, async (c) => {
  const profileId = c.req.param('id');

  try {
    const result = await c.env.DB.prepare(`
      SELECT
        tdp.*,
        u.name as teacher_name,
        u.teacher_license_number,
        u.years_experience,
        u.qualifications
      FROM teacher_directory_profiles tdp
      JOIN users u ON tdp.teacher_id = u.id
      WHERE tdp.id = ?
        AND tdp.directory_status = 'approved'
        AND tdp.is_visible = 1
    `).bind(profileId).first();

    if (!result) {
      return c.json({ success: false, error: 'Teacher not found' }, 404);
    }

    const profile = {
      id: result.id,
      teacherId: result.teacher_id,
      displayName: result.display_name,
      bio: result.bio,
      profilePhotoUrl: result.profile_photo_url,
      bannerImageUrl: result.banner_image_url,
      tagline: result.tagline,
      teachingStyle: result.teaching_style,
      educationBackground: JSON.parse((result.education_background as string) || '[]'),
      subjects: JSON.parse((result.subjects as string) || '[]'),
      sessionTypes: JSON.parse((result.session_types as string) || '[]'),
      hourlyRate: result.hourly_rate,
      currency: result.currency || 'GHS',
      availability: JSON.parse((result.availability as string) || '{}'),
      timezone: result.timezone || 'Africa/Accra',
      isVisible: !!result.is_visible,
      isFeatured: !!result.is_featured,
      totalSessions: result.total_sessions || 0,
      completedSessions: result.completed_sessions || 0,
      totalHours: result.total_hours || 0,
      averageRating: result.average_rating || 0,
      ratingCount: result.rating_count || 0,
      responseRate: result.response_rate || 100,
      responseTimeHours: result.response_time_hours,
      repeatStudentRate: result.repeat_student_rate || 0,
      teacherName: result.teacher_name,
      teacherLicenseNumber: result.teacher_license_number,
      yearsExperience: result.years_experience,
      qualifications: result.qualifications,
      createdAt: result.created_at,
      updatedAt: result.updated_at
    };

    return c.json({ success: true, data: profile });
  } catch (error) {
    console.error('Error getting profile:', error);
    return c.json({ success: false, error: 'Failed to get teacher profile' }, 500);
  }
});


/**
 * GET /tutoring/directory/:id/reviews
 * Get reviews for a teacher
 */
tutoringRouter.get('/directory/:id/reviews', optionalAuthMiddleware, async (c) => {
  const profileId = c.req.param('id');
  const page = parseInt(c.req.query('page') || '1');
  const pageSize = Math.min(parseInt(c.req.query('pageSize') || '10'), 50);
  const offset = (page - 1) * pageSize;

  try {
    // Count total reviews
    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM teacher_reviews
      WHERE teacher_profile_id = ? AND is_approved = 1
    `).bind(profileId).first();

    // Get reviews
    const result = await c.env.DB.prepare(`
      SELECT
        tr.*,
        u.name as student_name
      FROM teacher_reviews tr
      JOIN users u ON tr.student_id = u.id
      WHERE tr.teacher_profile_id = ? AND tr.is_approved = 1
      ORDER BY tr.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(profileId, pageSize, offset).all();

    const reviews = (result.results || []).map((row: any) => ({
      id: row.id,
      teacherProfileId: row.teacher_profile_id,
      studentId: row.student_id,
      studentName: row.student_name,
      sessionId: row.session_id,
      rating: row.rating,
      knowledgeRating: row.knowledge_rating,
      communicationRating: row.communication_rating,
      punctualityRating: row.punctuality_rating,
      patienceRating: row.patience_rating,
      title: row.title,
      reviewText: row.review_text,
      teacherResponse: row.teacher_response,
      teacherRespondedAt: row.teacher_responded_at,
      helpfulCount: row.helpful_count || 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    return c.json({
      success: true,
      data: {
        reviews,
        total: (countResult?.count as number) || 0,
        page,
        pageSize,
        hasMore: offset + pageSize < ((countResult?.count as number) || 0)
      }
    });
  } catch (error) {
    console.error('Error getting reviews:', error);
    return c.json({ success: false, error: 'Failed to get reviews' }, 500);
  }
});


// ============================================
// STUDENT ENDPOINTS
// ============================================

/**
 * POST /tutoring/requests
 * Create a tutoring request (student only)
 */
tutoringRouter.post('/requests', authMiddleware, studentMiddleware, async (c) => {
  const studentId = c.get('userId');
  const body = await c.req.json();

  const {
    teacherProfileId,
    subjectId,
    topicDescription,
    sessionType,
    proposedDatetime,
    proposedDuration = 60,
    alternativeDatetime,
    message
  } = body;

  // Validation
  if (!teacherProfileId || !subjectId || !sessionType || !proposedDatetime) {
    return c.json({
      success: false,
      error: 'Missing required fields: teacherProfileId, subjectId, sessionType, proposedDatetime'
    }, 400);
  }

  if (!['video', 'chat', 'whiteboard'].includes(sessionType)) {
    return c.json({ success: false, error: 'Invalid session type' }, 400);
  }

  if (![30, 60, 90, 120].includes(proposedDuration)) {
    return c.json({ success: false, error: 'Duration must be 30, 60, 90, or 120 minutes' }, 400);
  }

  try {
    // Get teacher profile
    const profile = await c.env.DB.prepare(`
      SELECT * FROM teacher_directory_profiles
      WHERE id = ? AND directory_status = 'approved' AND is_visible = 1
    `).bind(teacherProfileId).first();

    if (!profile) {
      return c.json({ success: false, error: 'Teacher not found or not available' }, 404);
    }

    // Check if teacher offers this session type
    const sessionTypes = JSON.parse((profile.session_types as string) || '[]');
    if (!sessionTypes.includes(sessionType)) {
      return c.json({ success: false, error: 'Teacher does not offer this session type' }, 400);
    }

    // Calculate cost
    const hourlyRate = profile.hourly_rate as number;
    const estimatedCost = hourlyRate * (proposedDuration / 60);

    // Create request
    const requestId = generateId('req');
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(); // 48 hours

    await c.env.DB.prepare(`
      INSERT INTO tutoring_requests (
        id, student_id, teacher_profile_id,
        subject_id, topic_description, session_type,
        proposed_datetime, proposed_duration, alternative_datetime,
        message, hourly_rate, estimated_cost,
        status, expires_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, datetime('now'), datetime('now'))
    `).bind(
      requestId,
      studentId,
      teacherProfileId,
      subjectId,
      topicDescription || null,
      sessionType,
      proposedDatetime,
      proposedDuration,
      alternativeDatetime || null,
      message || null,
      hourlyRate,
      estimatedCost,
      expiresAt
    ).run();

    return c.json({
      success: true,
      data: {
        id: requestId,
        status: 'pending',
        estimatedCost,
        expiresAt
      }
    });
  } catch (error) {
    console.error('Error creating request:', error);
    return c.json({ success: false, error: 'Failed to create request' }, 500);
  }
});


/**
 * GET /tutoring/requests
 * Get student's tutoring requests
 */
tutoringRouter.get('/requests', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const role = c.get('userRole');
  const status = c.req.query('status');
  const page = parseInt(c.req.query('page') || '1');
  const pageSize = Math.min(parseInt(c.req.query('pageSize') || '10'), 50);
  const offset = (page - 1) * pageSize;

  try {
    let whereClause = '';
    const params: any[] = [];

    if (role === 'student') {
      whereClause = 'WHERE tr.student_id = ?';
      params.push(userId);
    } else if (role === 'teacher') {
      whereClause = 'WHERE tdp.teacher_id = ?';
      params.push(userId);
    } else {
      return c.json({ success: false, error: 'Invalid role' }, 400);
    }

    if (status) {
      whereClause += ' AND tr.status = ?';
      params.push(status);
    }

    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM tutoring_requests tr
      JOIN teacher_directory_profiles tdp ON tr.teacher_profile_id = tdp.id
      ${whereClause}
    `).bind(...params).first();

    const result = await c.env.DB.prepare(`
      SELECT
        tr.*,
        tdp.display_name as teacher_name,
        tdp.profile_photo_url as teacher_profile_photo_url,
        u.name as student_name,
        u.email as student_email,
        s.name as subject_name
      FROM tutoring_requests tr
      JOIN teacher_directory_profiles tdp ON tr.teacher_profile_id = tdp.id
      JOIN users u ON tr.student_id = u.id
      JOIN subjects s ON tr.subject_id = s.id
      ${whereClause}
      ORDER BY tr.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(...params, pageSize, offset).all();

    const requests = (result.results || []).map((row: any) => ({
      id: row.id,
      studentId: row.student_id,
      studentName: row.student_name,
      studentEmail: row.student_email,
      teacherProfileId: row.teacher_profile_id,
      teacherName: row.teacher_name,
      teacherProfilePhotoUrl: row.teacher_profile_photo_url,
      subjectId: row.subject_id,
      subjectName: row.subject_name,
      topicDescription: row.topic_description,
      sessionType: row.session_type,
      proposedDatetime: row.proposed_datetime,
      proposedDuration: row.proposed_duration,
      alternativeDatetime: row.alternative_datetime,
      message: row.message,
      hourlyRate: row.hourly_rate,
      estimatedCost: row.estimated_cost,
      status: row.status,
      teacherResponse: row.teacher_response,
      respondedAt: row.responded_at,
      confirmedDatetime: row.confirmed_datetime,
      confirmedDuration: row.confirmed_duration,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    return c.json({
      success: true,
      data: {
        requests,
        total: (countResult?.count as number) || 0,
        page,
        pageSize,
        hasMore: offset + pageSize < ((countResult?.count as number) || 0)
      }
    });
  } catch (error) {
    console.error('Error getting requests:', error);
    return c.json({ success: false, error: 'Failed to get requests' }, 500);
  }
});


/**
 * POST /tutoring/requests/:id/cancel
 * Cancel a pending request (student only)
 */
tutoringRouter.post('/requests/:id/cancel', authMiddleware, studentMiddleware, async (c) => {
  const studentId = c.get('userId');
  const requestId = c.req.param('id');

  try {
    const request = await c.env.DB.prepare(`
      SELECT * FROM tutoring_requests
      WHERE id = ? AND student_id = ?
    `).bind(requestId, studentId).first();

    if (!request) {
      return c.json({ success: false, error: 'Request not found' }, 404);
    }

    if (request.status !== 'pending') {
      return c.json({ success: false, error: 'Can only cancel pending requests' }, 400);
    }

    await c.env.DB.prepare(`
      UPDATE tutoring_requests
      SET status = 'cancelled', updated_at = datetime('now')
      WHERE id = ?
    `).bind(requestId).run();

    return c.json({ success: true, data: { id: requestId, status: 'cancelled' } });
  } catch (error) {
    console.error('Error cancelling request:', error);
    return c.json({ success: false, error: 'Failed to cancel request' }, 500);
  }
});


/**
 * GET /tutoring/sessions
 * Get user's tutoring sessions
 */
tutoringRouter.get('/sessions', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const role = c.get('userRole');
  const status = c.req.query('status');
  const upcoming = c.req.query('upcoming') === 'true';
  const page = parseInt(c.req.query('page') || '1');
  const pageSize = Math.min(parseInt(c.req.query('pageSize') || '10'), 50);
  const offset = (page - 1) * pageSize;

  try {
    let whereClause = '';
    const params: any[] = [];

    if (role === 'student') {
      whereClause = 'WHERE ts.student_id = ?';
      params.push(userId);
    } else if (role === 'teacher') {
      whereClause = 'WHERE ts.teacher_id = ?';
      params.push(userId);
    } else if (role === 'admin') {
      whereClause = 'WHERE 1=1';
    } else {
      return c.json({ success: false, error: 'Invalid role' }, 400);
    }

    if (status) {
      whereClause += ' AND ts.status = ?';
      params.push(status);
    }

    if (upcoming) {
      whereClause += " AND ts.scheduled_datetime > datetime('now') AND ts.status = 'scheduled'";
    }

    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM tutoring_sessions ts
      ${whereClause}
    `).bind(...params).first();

    const result = await c.env.DB.prepare(`
      SELECT
        ts.*,
        tdp.display_name as teacher_name,
        tdp.profile_photo_url as teacher_profile_photo_url,
        u.name as student_name,
        u.email as student_email,
        s.name as subject_name,
        tp.status as payment_status,
        tp.payment_reference,
        tp.paid_at
      FROM tutoring_sessions ts
      JOIN teacher_directory_profiles tdp ON ts.teacher_profile_id = tdp.id
      JOIN users u ON ts.student_id = u.id
      JOIN subjects s ON ts.subject_id = s.id
      LEFT JOIN tutoring_payments tp ON ts.id = tp.session_id
      ${whereClause}
      ORDER BY ts.scheduled_datetime DESC
      LIMIT ? OFFSET ?
    `).bind(...params, pageSize, offset).all();

    const sessions = (result.results || []).map((row: any) => ({
      id: row.id,
      requestId: row.request_id,
      studentId: row.student_id,
      studentName: row.student_name,
      studentEmail: row.student_email,
      teacherId: row.teacher_id,
      teacherProfileId: row.teacher_profile_id,
      teacherName: row.teacher_name,
      teacherProfilePhotoUrl: row.teacher_profile_photo_url,
      subjectId: row.subject_id,
      subjectName: row.subject_name,
      topicDescription: row.topic_description,
      sessionType: row.session_type,
      scheduledDatetime: row.scheduled_datetime,
      scheduledDuration: row.scheduled_duration,
      startedAt: row.started_at,
      endedAt: row.ended_at,
      actualDuration: row.actual_duration,
      status: row.status,
      chatRoomId: row.chat_room_id,
      whiteboardId: row.whiteboard_id,
      videoRoomUrl: row.video_room_url,
      sessionSummary: row.session_summary,
      hourlyRate: row.hourly_rate,
      sessionCost: row.session_cost,
      platformFee: row.platform_fee,
      teacherEarnings: row.teacher_earnings,
      paymentStatus: row.payment_status || 'unpaid',
      paymentReference: row.payment_reference,
      paidAt: row.paid_at,
      studentReviewed: !!row.student_reviewed,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    return c.json({
      success: true,
      data: {
        sessions,
        total: (countResult?.count as number) || 0,
        page,
        pageSize,
        hasMore: offset + pageSize < ((countResult?.count as number) || 0)
      }
    });
  } catch (error) {
    console.error('Error getting sessions:', error);
    return c.json({ success: false, error: 'Failed to get sessions' }, 500);
  }
});


/**
 * POST /tutoring/sessions/:id/review
 * Submit a review for a completed session
 */
tutoringRouter.post('/sessions/:id/review', authMiddleware, studentMiddleware, async (c) => {
  const studentId = c.get('userId');
  const sessionId = c.req.param('id');
  const body = await c.req.json();

  const {
    rating,
    title,
    reviewText,
    knowledgeRating,
    communicationRating,
    punctualityRating,
    patienceRating
  } = body;

  if (!rating || rating < 1 || rating > 5) {
    return c.json({ success: false, error: 'Rating must be between 1 and 5' }, 400);
  }

  try {
    // Get session
    const session = await c.env.DB.prepare(`
      SELECT * FROM tutoring_sessions
      WHERE id = ? AND student_id = ? AND status = 'completed'
    `).bind(sessionId, studentId).first();

    if (!session) {
      return c.json({ success: false, error: 'Session not found or not completed' }, 404);
    }

    if (session.student_reviewed) {
      return c.json({ success: false, error: 'Session already reviewed' }, 400);
    }

    // Create review
    const reviewId = generateId('review');
    await c.env.DB.prepare(`
      INSERT INTO teacher_reviews (
        id, teacher_profile_id, student_id, session_id,
        rating, title, review_text,
        knowledge_rating, communication_rating, punctuality_rating, patience_rating,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      reviewId,
      session.teacher_profile_id,
      studentId,
      sessionId,
      rating,
      title || null,
      reviewText || null,
      knowledgeRating || null,
      communicationRating || null,
      punctualityRating || null,
      patienceRating || null
    ).run();

    // Update session
    await c.env.DB.prepare(`
      UPDATE tutoring_sessions
      SET student_reviewed = 1, updated_at = datetime('now')
      WHERE id = ?
    `).bind(sessionId).run();

    // Update teacher profile stats
    await c.env.DB.prepare(`
      UPDATE teacher_directory_profiles
      SET
        average_rating = (
          SELECT AVG(rating) FROM teacher_reviews
          WHERE teacher_profile_id = ? AND is_approved = 1
        ),
        rating_count = rating_count + 1,
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(session.teacher_profile_id, session.teacher_profile_id).run();

    return c.json({ success: true, data: { id: reviewId } });
  } catch (error) {
    console.error('Error creating review:', error);
    return c.json({ success: false, error: 'Failed to create review' }, 500);
  }
});


// ============================================
// TEACHER ENDPOINTS
// ============================================

/**
 * GET /tutoring/teacher/profile
 * Get teacher's own directory profile
 */
tutoringRouter.get('/teacher/profile', authMiddleware, teacherMiddleware, async (c) => {
  const teacherId = c.get('userId');

  try {
    const result = await c.env.DB.prepare(`
      SELECT * FROM teacher_directory_profiles WHERE teacher_id = ?
    `).bind(teacherId).first();

    if (!result) {
      return c.json({ success: true, data: null });
    }

    const profile = {
      id: result.id,
      teacherId: result.teacher_id,
      displayName: result.display_name,
      bio: result.bio,
      profilePhotoUrl: result.profile_photo_url,
      bannerImageUrl: result.banner_image_url,
      tagline: result.tagline,
      teachingStyle: result.teaching_style,
      educationBackground: JSON.parse((result.education_background as string) || '[]'),
      subjects: JSON.parse((result.subjects as string) || '[]'),
      sessionTypes: JSON.parse((result.session_types as string) || '[]'),
      hourlyRate: result.hourly_rate,
      currency: result.currency || 'GHS',
      availability: JSON.parse((result.availability as string) || '{}'),
      timezone: result.timezone || 'Africa/Accra',
      directoryStatus: result.directory_status,
      rejectionReason: result.rejection_reason,
      isVisible: !!result.is_visible,
      isFeatured: !!result.is_featured,
      totalSessions: result.total_sessions || 0,
      averageRating: result.average_rating || 0,
      ratingCount: result.rating_count || 0,
      createdAt: result.created_at,
      updatedAt: result.updated_at
    };

    return c.json({ success: true, data: profile });
  } catch (error) {
    console.error('Error getting teacher profile:', error);
    return c.json({ success: false, error: 'Failed to get profile' }, 500);
  }
});


/**
 * POST /tutoring/teacher/profile
 * Create or update teacher's directory profile
 */
tutoringRouter.post('/teacher/profile', authMiddleware, teacherMiddleware, async (c) => {
  const teacherId = c.get('userId');
  const body = await c.req.json();

  const {
    displayName,
    bio,
    profilePhotoUrl,
    bannerImageUrl,
    tagline,
    teachingStyle,
    educationBackground,
    subjects,
    sessionTypes,
    hourlyRate,
    availability,
    timezone
  } = body;

  // Validation
  if (!displayName || !subjects || !sessionTypes || !hourlyRate) {
    return c.json({
      success: false,
      error: 'Missing required fields: displayName, subjects, sessionTypes, hourlyRate'
    }, 400);
  }

  if (!Array.isArray(subjects) || subjects.length === 0) {
    return c.json({ success: false, error: 'At least one subject is required' }, 400);
  }

  if (!Array.isArray(sessionTypes) || sessionTypes.length === 0) {
    return c.json({ success: false, error: 'At least one session type is required' }, 400);
  }

  if (hourlyRate < 1) {
    return c.json({ success: false, error: 'Hourly rate must be at least 1 GHS' }, 400);
  }

  try {
    // Check if profile exists
    const existing = await c.env.DB.prepare(`
      SELECT id, directory_status FROM teacher_directory_profiles WHERE teacher_id = ?
    `).bind(teacherId).first();

    const profileId = existing?.id || generateId('profile');

    if (existing) {
      // Update existing profile
      await c.env.DB.prepare(`
        UPDATE teacher_directory_profiles SET
          display_name = ?,
          bio = ?,
          profile_photo_url = ?,
          banner_image_url = ?,
          tagline = ?,
          teaching_style = ?,
          education_background = ?,
          subjects = ?,
          session_types = ?,
          hourly_rate = ?,
          availability = ?,
          timezone = ?,
          updated_at = datetime('now')
        WHERE id = ?
      `).bind(
        displayName,
        bio || null,
        profilePhotoUrl || null,
        bannerImageUrl || null,
        tagline || null,
        teachingStyle || null,
        JSON.stringify(educationBackground || []),
        JSON.stringify(subjects),
        JSON.stringify(sessionTypes),
        hourlyRate,
        JSON.stringify(availability || {}),
        timezone || 'Africa/Accra',
        profileId
      ).run();
    } else {
      // Create new profile
      await c.env.DB.prepare(`
        INSERT INTO teacher_directory_profiles (
          id, teacher_id, display_name, bio,
          profile_photo_url, banner_image_url, tagline,
          teaching_style, education_background,
          subjects, session_types, hourly_rate,
          availability, timezone, directory_status,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'), datetime('now'))
      `).bind(
        profileId,
        teacherId,
        displayName,
        bio || null,
        profilePhotoUrl || null,
        bannerImageUrl || null,
        tagline || null,
        teachingStyle || null,
        JSON.stringify(educationBackground || []),
        JSON.stringify(subjects),
        JSON.stringify(sessionTypes),
        hourlyRate,
        JSON.stringify(availability || {}),
        timezone || 'Africa/Accra'
      ).run();
    }

    return c.json({
      success: true,
      data: {
        id: profileId,
        status: existing?.directory_status || 'pending'
      }
    });
  } catch (error) {
    console.error('Error saving profile:', error);
    return c.json({ success: false, error: 'Failed to save profile' }, 500);
  }
});


/**
 * POST /tutoring/teacher/profile/submit
 * Submit profile for admin approval
 */
tutoringRouter.post('/teacher/profile/submit', authMiddleware, teacherMiddleware, async (c) => {
  const teacherId = c.get('userId');

  try {
    const profile = await c.env.DB.prepare(`
      SELECT * FROM teacher_directory_profiles WHERE teacher_id = ?
    `).bind(teacherId).first();

    if (!profile) {
      return c.json({ success: false, error: 'Profile not found. Please create a profile first.' }, 404);
    }

    if (profile.directory_status === 'approved') {
      return c.json({ success: false, error: 'Profile is already approved' }, 400);
    }

    await c.env.DB.prepare(`
      UPDATE teacher_directory_profiles
      SET directory_status = 'pending', rejection_reason = NULL, updated_at = datetime('now')
      WHERE id = ?
    `).bind(profile.id).run();

    return c.json({
      success: true,
      data: { id: profile.id, status: 'pending' }
    });
  } catch (error) {
    console.error('Error submitting profile:', error);
    return c.json({ success: false, error: 'Failed to submit profile' }, 500);
  }
});


/**
 * POST /tutoring/teacher/requests/:id/accept
 * Accept a tutoring request
 */
tutoringRouter.post('/teacher/requests/:id/accept', authMiddleware, teacherMiddleware, async (c) => {
  const teacherId = c.get('userId');
  const requestId = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));
  const { response, confirmedDatetime, confirmedDuration } = body;

  try {
    // Get request and verify teacher
    const request = await c.env.DB.prepare(`
      SELECT tr.*, tdp.teacher_id
      FROM tutoring_requests tr
      JOIN teacher_directory_profiles tdp ON tr.teacher_profile_id = tdp.id
      WHERE tr.id = ? AND tdp.teacher_id = ?
    `).bind(requestId, teacherId).first();

    if (!request) {
      return c.json({ success: false, error: 'Request not found' }, 404);
    }

    if (request.status !== 'pending') {
      return c.json({ success: false, error: 'Request is not pending' }, 400);
    }

    // Update request
    await c.env.DB.prepare(`
      UPDATE tutoring_requests SET
        status = 'accepted',
        teacher_response = ?,
        responded_at = datetime('now'),
        confirmed_datetime = ?,
        confirmed_duration = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      response || null,
      confirmedDatetime || request.proposed_datetime,
      confirmedDuration || request.proposed_duration,
      requestId
    ).run();

    // Update teacher response rate
    await c.env.DB.prepare(`
      UPDATE teacher_directory_profiles SET
        response_rate = (
          SELECT CAST(SUM(CASE WHEN status IN ('accepted', 'declined') THEN 1 ELSE 0 END) AS REAL) * 100 /
                 NULLIF(COUNT(*), 0)
          FROM tutoring_requests
          WHERE teacher_profile_id = ?
        ),
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(request.teacher_profile_id, request.teacher_profile_id).run();

    return c.json({
      success: true,
      data: {
        id: requestId,
        status: 'accepted',
        message: 'Request accepted. Awaiting student payment.'
      }
    });
  } catch (error) {
    console.error('Error accepting request:', error);
    return c.json({ success: false, error: 'Failed to accept request' }, 500);
  }
});


/**
 * POST /tutoring/teacher/requests/:id/decline
 * Decline a tutoring request
 */
tutoringRouter.post('/teacher/requests/:id/decline', authMiddleware, teacherMiddleware, async (c) => {
  const teacherId = c.get('userId');
  const requestId = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));
  const { reason } = body;

  try {
    const request = await c.env.DB.prepare(`
      SELECT tr.*, tdp.teacher_id
      FROM tutoring_requests tr
      JOIN teacher_directory_profiles tdp ON tr.teacher_profile_id = tdp.id
      WHERE tr.id = ? AND tdp.teacher_id = ?
    `).bind(requestId, teacherId).first();

    if (!request) {
      return c.json({ success: false, error: 'Request not found' }, 404);
    }

    if (request.status !== 'pending') {
      return c.json({ success: false, error: 'Request is not pending' }, 400);
    }

    await c.env.DB.prepare(`
      UPDATE tutoring_requests SET
        status = 'declined',
        teacher_response = ?,
        responded_at = datetime('now'),
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(reason || null, requestId).run();

    return c.json({
      success: true,
      data: { id: requestId, status: 'declined' }
    });
  } catch (error) {
    console.error('Error declining request:', error);
    return c.json({ success: false, error: 'Failed to decline request' }, 500);
  }
});


/**
 * GET /tutoring/teacher/earnings
 * Get teacher's earnings summary
 */
tutoringRouter.get('/teacher/earnings', authMiddleware, teacherMiddleware, async (c) => {
  const teacherId = c.get('userId');

  try {
    // Get or create earnings record
    let earnings = await c.env.DB.prepare(`
      SELECT * FROM teacher_earnings WHERE teacher_id = ?
    `).bind(teacherId).first();

    if (!earnings) {
      // Create earnings record
      const earningsId = generateId('earnings');
      await c.env.DB.prepare(`
        INSERT INTO teacher_earnings (id, teacher_id, created_at, updated_at)
        VALUES (?, ?, datetime('now'), datetime('now'))
      `).bind(earningsId, teacherId).run();

      earnings = await c.env.DB.prepare(`
        SELECT * FROM teacher_earnings WHERE teacher_id = ?
      `).bind(teacherId).first();
    }

    // Get recent completed sessions
    const recentSessions = await c.env.DB.prepare(`
      SELECT
        ts.id,
        ts.scheduled_datetime,
        ts.session_cost,
        ts.teacher_earnings,
        u.name as student_name,
        s.name as subject_name
      FROM tutoring_sessions ts
      JOIN users u ON ts.student_id = u.id
      JOIN subjects s ON ts.subject_id = s.id
      WHERE ts.teacher_id = ? AND ts.status = 'completed'
      ORDER BY ts.ended_at DESC
      LIMIT 10
    `).bind(teacherId).all();

    return c.json({
      success: true,
      data: {
        earnings: {
          id: earnings.id,
          teacherId: earnings.teacher_id,
          totalTutoringEarnings: earnings.total_tutoring_earnings || 0,
          pendingTutoring: earnings.pending_tutoring || 0,
          totalBonusEarnings: earnings.total_bonus_earnings || 0,
          pendingBonus: earnings.pending_bonus || 0,
          totalAffiliateEarnings: earnings.total_affiliate_earnings || 0,
          availableBalance: earnings.available_balance || 0,
          mobileMoneyNumber: earnings.mobile_money_number,
          mobileMoneyProvider: earnings.mobile_money_provider,
          preferredPayoutMethod: earnings.preferred_payout_method || 'mobile_money',
          totalPaidOut: earnings.total_paid_out || 0,
          lastPayoutAt: earnings.last_payout_at,
          payoutCount: earnings.payout_count || 0
        },
        recentSessions: (recentSessions.results || []).map((row: any) => ({
          id: row.id,
          scheduledDatetime: row.scheduled_datetime,
          sessionCost: row.session_cost,
          teacherEarnings: row.teacher_earnings,
          studentName: row.student_name,
          subjectName: row.subject_name
        }))
      }
    });
  } catch (error) {
    console.error('Error getting earnings:', error);
    return c.json({ success: false, error: 'Failed to get earnings' }, 500);
  }
});


/**
 * PUT /tutoring/teacher/payout-details
 * Update teacher's payout details
 */
tutoringRouter.put('/teacher/payout-details', authMiddleware, teacherMiddleware, async (c) => {
  const teacherId = c.get('userId');
  const body = await c.req.json();

  const {
    mobileMoneyNumber,
    mobileMoneyProvider,
    bankAccountNumber,
    bankName,
    bankAccountName,
    preferredPayoutMethod
  } = body;

  try {
    await c.env.DB.prepare(`
      INSERT INTO teacher_earnings (id, teacher_id, mobile_money_number, mobile_money_provider,
        bank_account_number, bank_name, bank_account_name, preferred_payout_method,
        created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      ON CONFLICT(teacher_id) DO UPDATE SET
        mobile_money_number = ?,
        mobile_money_provider = ?,
        bank_account_number = ?,
        bank_name = ?,
        bank_account_name = ?,
        preferred_payout_method = ?,
        updated_at = datetime('now')
    `).bind(
      generateId('earnings'),
      teacherId,
      mobileMoneyNumber || null,
      mobileMoneyProvider || null,
      bankAccountNumber || null,
      bankName || null,
      bankAccountName || null,
      preferredPayoutMethod || 'mobile_money',
      mobileMoneyNumber || null,
      mobileMoneyProvider || null,
      bankAccountNumber || null,
      bankName || null,
      bankAccountName || null,
      preferredPayoutMethod || 'mobile_money'
    ).run();

    return c.json({ success: true, data: { message: 'Payout details updated' } });
  } catch (error) {
    console.error('Error updating payout details:', error);
    return c.json({ success: false, error: 'Failed to update payout details' }, 500);
  }
});


/**
 * POST /tutoring/teacher/reviews/:id/respond
 * Respond to a review
 */
tutoringRouter.post('/teacher/reviews/:id/respond', authMiddleware, teacherMiddleware, async (c) => {
  const teacherId = c.get('userId');
  const reviewId = c.req.param('id');
  const { response } = await c.req.json();

  if (!response) {
    return c.json({ success: false, error: 'Response is required' }, 400);
  }

  try {
    const review = await c.env.DB.prepare(`
      SELECT tr.*, tdp.teacher_id
      FROM teacher_reviews tr
      JOIN teacher_directory_profiles tdp ON tr.teacher_profile_id = tdp.id
      WHERE tr.id = ? AND tdp.teacher_id = ?
    `).bind(reviewId, teacherId).first();

    if (!review) {
      return c.json({ success: false, error: 'Review not found' }, 404);
    }

    await c.env.DB.prepare(`
      UPDATE teacher_reviews SET
        teacher_response = ?,
        teacher_responded_at = datetime('now'),
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(response, reviewId).run();

    return c.json({ success: true, data: { id: reviewId } });
  } catch (error) {
    console.error('Error responding to review:', error);
    return c.json({ success: false, error: 'Failed to respond to review' }, 500);
  }
});


// ============================================
// ADMIN ENDPOINTS
// ============================================

/**
 * GET /tutoring/admin/pending-profiles
 * Get profiles pending approval
 */
tutoringRouter.get('/admin/pending-profiles', authMiddleware, adminMiddleware, async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const pageSize = Math.min(parseInt(c.req.query('pageSize') || '20'), 100);
  const offset = (page - 1) * pageSize;

  try {
    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM teacher_directory_profiles
      WHERE directory_status = 'pending'
    `).first();

    const result = await c.env.DB.prepare(`
      SELECT
        tdp.*,
        u.name as teacher_name,
        u.email as teacher_email,
        u.teacher_license_number,
        u.subjects_taught,
        u.years_experience,
        u.qualifications
      FROM teacher_directory_profiles tdp
      JOIN users u ON tdp.teacher_id = u.id
      WHERE tdp.directory_status = 'pending'
      ORDER BY tdp.created_at ASC
      LIMIT ? OFFSET ?
    `).bind(pageSize, offset).all();

    const profiles = (result.results || []).map((row: any) => ({
      id: row.id,
      teacherId: row.teacher_id,
      teacherName: row.teacher_name,
      teacherEmail: row.teacher_email,
      displayName: row.display_name,
      bio: row.bio,
      profilePhotoUrl: row.profile_photo_url,
      subjects: JSON.parse(row.subjects || '[]'),
      sessionTypes: JSON.parse(row.session_types || '[]'),
      hourlyRate: row.hourly_rate,
      teacherLicenseNumber: row.teacher_license_number,
      subjectsTaught: JSON.parse(row.subjects_taught || '[]'),
      yearsExperience: row.years_experience,
      qualifications: row.qualifications,
      createdAt: row.created_at
    }));

    return c.json({
      success: true,
      data: {
        profiles,
        total: (countResult?.count as number) || 0,
        page,
        pageSize
      }
    });
  } catch (error) {
    console.error('Error getting pending profiles:', error);
    return c.json({ success: false, error: 'Failed to get pending profiles' }, 500);
  }
});


/**
 * POST /tutoring/admin/profiles/:id/approve
 * Approve a teacher profile
 */
tutoringRouter.post('/admin/profiles/:id/approve', authMiddleware, adminMiddleware, async (c) => {
  const profileId = c.req.param('id');
  const adminId = c.get('userId');

  try {
    const profile = await c.env.DB.prepare(`
      SELECT * FROM teacher_directory_profiles WHERE id = ?
    `).bind(profileId).first();

    if (!profile) {
      return c.json({ success: false, error: 'Profile not found' }, 404);
    }

    await c.env.DB.prepare(`
      UPDATE teacher_directory_profiles SET
        directory_status = 'approved',
        approved_by = ?,
        approved_at = datetime('now'),
        is_visible = 1,
        rejection_reason = NULL,
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(adminId, profileId).run();

    return c.json({
      success: true,
      data: { id: profileId, status: 'approved' }
    });
  } catch (error) {
    console.error('Error approving profile:', error);
    return c.json({ success: false, error: 'Failed to approve profile' }, 500);
  }
});


/**
 * POST /tutoring/admin/profiles/:id/reject
 * Reject a teacher profile
 */
tutoringRouter.post('/admin/profiles/:id/reject', authMiddleware, adminMiddleware, async (c) => {
  const profileId = c.req.param('id');
  const { reason } = await c.req.json();

  if (!reason) {
    return c.json({ success: false, error: 'Rejection reason is required' }, 400);
  }

  try {
    await c.env.DB.prepare(`
      UPDATE teacher_directory_profiles SET
        directory_status = 'rejected',
        rejection_reason = ?,
        is_visible = 0,
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(reason, profileId).run();

    return c.json({
      success: true,
      data: { id: profileId, status: 'rejected' }
    });
  } catch (error) {
    console.error('Error rejecting profile:', error);
    return c.json({ success: false, error: 'Failed to reject profile' }, 500);
  }
});


/**
 * GET /tutoring/admin/stats
 * Get tutoring platform statistics
 */
tutoringRouter.get('/admin/stats', authMiddleware, adminMiddleware, async (c) => {
  try {
    const stats = await c.env.DB.prepare(`
      SELECT
        (SELECT COUNT(*) FROM teacher_directory_profiles) as total_teachers,
        (SELECT COUNT(*) FROM teacher_directory_profiles WHERE directory_status = 'pending') as pending_approvals,
        (SELECT COUNT(*) FROM teacher_directory_profiles WHERE directory_status = 'approved' AND is_visible = 1) as active_teachers,
        (SELECT COUNT(*) FROM tutoring_sessions) as total_sessions,
        (SELECT COUNT(*) FROM tutoring_sessions WHERE status = 'completed') as completed_sessions,
        (SELECT COALESCE(SUM(session_cost), 0) FROM tutoring_sessions WHERE status = 'completed') as total_revenue,
        (SELECT COALESCE(SUM(platform_fee), 0) FROM tutoring_sessions WHERE status = 'completed') as platform_revenue,
        (SELECT COALESCE(SUM(teacher_earnings), 0) FROM tutoring_sessions WHERE status = 'completed') as teacher_payouts,
        (SELECT AVG(average_rating) FROM teacher_directory_profiles WHERE rating_count > 0) as avg_rating
    `).first();

    // Get top teachers
    const topTeachers = await c.env.DB.prepare(`
      SELECT
        id, teacher_id, display_name, profile_photo_url,
        average_rating, rating_count, total_sessions, hourly_rate
      FROM teacher_directory_profiles
      WHERE directory_status = 'approved' AND is_visible = 1
      ORDER BY average_rating DESC, total_sessions DESC
      LIMIT 5
    `).all();

    return c.json({
      success: true,
      data: {
        totalTeachers: stats?.total_teachers || 0,
        pendingApprovals: stats?.pending_approvals || 0,
        activeTeachers: stats?.active_teachers || 0,
        totalSessions: stats?.total_sessions || 0,
        completedSessions: stats?.completed_sessions || 0,
        totalRevenue: stats?.total_revenue || 0,
        platformRevenue: stats?.platform_revenue || 0,
        teacherPayouts: stats?.teacher_payouts || 0,
        averageRating: stats?.avg_rating || 0,
        topTeachers: (topTeachers.results || []).map((row: any) => ({
          id: row.id,
          teacherId: row.teacher_id,
          displayName: row.display_name,
          profilePhotoUrl: row.profile_photo_url,
          averageRating: row.average_rating || 0,
          ratingCount: row.rating_count || 0,
          totalSessions: row.total_sessions || 0,
          hourlyRate: row.hourly_rate
        }))
      }
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    return c.json({ success: false, error: 'Failed to get statistics' }, 500);
  }
});


// =============================================
// TUTORING PAYMENT ENDPOINTS
// =============================================

const PAYSTACK_API = 'https://api.paystack.co';

// Paystack utility: Initialize transaction
async function initializePaystackTransaction(
  secretKey: string,
  email: string,
  amount: number, // in pesewas
  reference: string,
  callbackUrl: string,
  metadata?: Record<string, unknown>
): Promise<{ status: boolean; data?: { authorization_url: string; reference: string }; message?: string }> {
  try {
    const response = await fetch(`${PAYSTACK_API}/transaction/initialize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount,
        reference,
        callback_url: callbackUrl,
        currency: 'GHS',
        channels: ['mobile_money', 'card'],
        metadata,
      }),
    });
    return await response.json();
  } catch (error) {
    console.error('Paystack initialize error:', error);
    return { status: false, message: 'Failed to initialize transaction' };
  }
}

// Paystack utility: Verify transaction
async function verifyPaystackTransaction(
  secretKey: string,
  reference: string
): Promise<{ status: boolean; data?: { status: string; amount: number; metadata?: Record<string, unknown> }; message?: string }> {
  try {
    const response = await fetch(`${PAYSTACK_API}/transaction/verify/${reference}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${secretKey}` },
    });
    return await response.json();
  } catch (error) {
    console.error('Paystack verify error:', error);
    return { status: false, message: 'Failed to verify transaction' };
  }
}

// Generate unique reference
function generateTutoringReference(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `TUT_${timestamp}_${randomPart}`.toUpperCase();
}

// Initialize payment for a tutoring session
tutoringRouter.post('/sessions/:id/pay/initialize', authMiddleware, async (c) => {
  try {
    const sessionId = c.req.param('id');
    const userId = c.get('userId') as string;

    // Get session details
    const session = await c.env.DB.prepare(`
      SELECT
        ts.*,
        u.email as student_email,
        tdp.display_name as teacher_name
      FROM tutoring_sessions ts
      JOIN users u ON ts.student_id = u.id
      JOIN teacher_directory_profiles tdp ON ts.teacher_profile_id = tdp.id
      WHERE ts.id = ? AND ts.student_id = ?
    `).bind(sessionId, userId).first();

    if (!session) {
      return c.json({ success: false, error: 'Session not found' }, 404);
    }

    // Check if session is in a payable state
    if (session.status !== 'scheduled') {
      return c.json({ success: false, error: 'Session is not in a payable state' }, 400);
    }

    // Check if payment already exists
    const existingPayment = await c.env.DB.prepare(`
      SELECT * FROM tutoring_payments WHERE session_id = ? AND status IN ('pending', 'paid')
    `).bind(sessionId).first();

    if (existingPayment) {
      if (existingPayment.status === 'paid') {
        return c.json({ success: false, error: 'Session already paid' }, 400);
      }
      // Return existing pending payment
      return c.json({
        success: true,
        data: {
          paymentId: existingPayment.id,
          reference: existingPayment.payment_reference,
          amount: existingPayment.amount,
          message: 'Existing payment found'
        }
      });
    }

    // Generate payment reference
    const reference = generateTutoringReference();
    const amountInPesewas = Math.round((session.session_cost as number) * 100);

    // Calculate fees (15% platform fee)
    const platformFee = (session.session_cost as number) * 0.15;
    const teacherPayout = (session.session_cost as number) * 0.85;

    // Create payment record
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    await c.env.DB.prepare(`
      INSERT INTO tutoring_payments (
        id, session_id, student_id, teacher_id, amount, platform_fee, teacher_payout,
        payment_reference, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'), datetime('now'))
    `).bind(
      paymentId,
      sessionId,
      userId,
      session.teacher_id,
      session.session_cost,
      platformFee,
      teacherPayout,
      reference
    ).run();

    // Initialize Paystack transaction
    const callbackUrl = `${c.env.APP_URL}/tutoring/sessions?payment=verify&ref=${reference}`;
    const result = await initializePaystackTransaction(
      c.env.PAYSTACK_SECRET_KEY,
      session.student_email as string,
      amountInPesewas,
      reference,
      callbackUrl,
      {
        payment_type: 'tutoring_session',
        session_id: sessionId,
        payment_id: paymentId,
        student_id: userId,
        teacher_id: session.teacher_id,
        teacher_name: session.teacher_name,
      }
    );

    if (!result.status) {
      // Mark payment as failed
      await c.env.DB.prepare(`
        UPDATE tutoring_payments SET status = 'failed', updated_at = datetime('now')
        WHERE id = ?
      `).bind(paymentId).run();

      return c.json({ success: false, error: result.message || 'Payment initialization failed' }, 500);
    }

    return c.json({
      success: true,
      data: {
        paymentId,
        reference,
        authorizationUrl: result.data?.authorization_url,
        amount: session.session_cost
      }
    });
  } catch (error) {
    console.error('Payment initialization error:', error);
    return c.json({ success: false, error: 'Failed to initialize payment' }, 500);
  }
});

// Verify payment for a tutoring session
tutoringRouter.post('/sessions/pay/verify', authMiddleware, async (c) => {
  try {
    const { reference } = await c.req.json();
    const userId = c.get('userId') as string;

    if (!reference) {
      return c.json({ success: false, error: 'Payment reference required' }, 400);
    }

    // Get payment record
    const payment = await c.env.DB.prepare(`
      SELECT * FROM tutoring_payments WHERE payment_reference = ? AND student_id = ?
    `).bind(reference, userId).first();

    if (!payment) {
      return c.json({ success: false, error: 'Payment not found' }, 404);
    }

    if (payment.status === 'paid') {
      return c.json({
        success: true,
        data: { status: 'paid', message: 'Payment already verified' }
      });
    }

    // Verify with Paystack
    const result = await verifyPaystackTransaction(c.env.PAYSTACK_SECRET_KEY, reference);

    if (!result.status || result.data?.status !== 'success') {
      return c.json({
        success: false,
        error: 'Payment verification failed',
        data: { paystackStatus: result.data?.status }
      }, 400);
    }

    // Verify amount matches
    const expectedAmount = Math.round((payment.amount as number) * 100);
    if (result.data.amount !== expectedAmount) {
      console.error(`Amount mismatch: expected ${expectedAmount}, got ${result.data.amount}`);
      return c.json({ success: false, error: 'Payment amount mismatch' }, 400);
    }

    // Update payment status
    await c.env.DB.prepare(`
      UPDATE tutoring_payments
      SET status = 'paid', paid_at = datetime('now'), updated_at = datetime('now')
      WHERE id = ?
    `).bind(payment.id).run();

    // Update teacher earnings
    await c.env.DB.prepare(`
      UPDATE teacher_earnings
      SET
        pending_tutoring = pending_tutoring + ?,
        updated_at = datetime('now')
      WHERE teacher_id = ?
    `).bind(payment.teacher_payout, payment.teacher_id).run();

    // If no earnings record exists, create one
    const earningsExists = await c.env.DB.prepare(`
      SELECT 1 FROM teacher_earnings WHERE teacher_id = ?
    `).bind(payment.teacher_id).first();

    if (!earningsExists) {
      await c.env.DB.prepare(`
        INSERT INTO teacher_earnings (id, teacher_id, pending_tutoring, created_at, updated_at)
        VALUES (?, ?, ?, datetime('now'), datetime('now'))
      `).bind(
        `earn_${Date.now()}`,
        payment.teacher_id,
        payment.teacher_payout
      ).run();
    }

    return c.json({
      success: true,
      data: {
        status: 'paid',
        sessionId: payment.session_id,
        amount: payment.amount,
        message: 'Payment verified successfully'
      }
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    return c.json({ success: false, error: 'Failed to verify payment' }, 500);
  }
});

// Get payment status for a session
tutoringRouter.get('/sessions/:id/payment', authMiddleware, async (c) => {
  try {
    const sessionId = c.req.param('id');
    const userId = c.get('userId') as string;

    const payment = await c.env.DB.prepare(`
      SELECT * FROM tutoring_payments
      WHERE session_id = ? AND student_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `).bind(sessionId, userId).first();

    if (!payment) {
      return c.json({ success: true, data: { status: 'unpaid' } });
    }

    return c.json({
      success: true,
      data: {
        paymentId: payment.id,
        status: payment.status,
        amount: payment.amount,
        reference: payment.payment_reference,
        paidAt: payment.paid_at
      }
    });
  } catch (error) {
    console.error('Get payment status error:', error);
    return c.json({ success: false, error: 'Failed to get payment status' }, 500);
  }
});

export default tutoringRouter;
