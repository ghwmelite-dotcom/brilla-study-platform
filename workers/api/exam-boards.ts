import { Hono } from 'hono';
import { verify } from 'hono/jwt';

// Types for Cloudflare bindings
interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

// User type for JWT payload
interface UserPayload {
  userId: string;
  email: string;
  role: 'student' | 'teacher' | 'admin' | 'parent';
}

type Variables = {
  user?: UserPayload;
};

export const examBoardsApp = new Hono<{ Bindings: Env; Variables: Variables }>();

// JWT Authentication middleware for /user/* routes
examBoardsApp.use('/user/*', async (c, next) => {
  const authHeader = c.req.header('Authorization');

  // Skip auth for OPTIONS requests (CORS preflight)
  if (c.req.method === 'OPTIONS') {
    return next();
  }

  // Check for Authorization header
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized - No token provided' }, 401);
  }

  const token = authHeader.substring(7);

  try {
    const payload = await verify(token, c.env.JWT_SECRET) as UserPayload;
    c.set('user', payload);
    return next();
  } catch (error) {
    console.error('JWT verification failed:', error);
    return c.json({ success: false, error: 'Invalid or expired token' }, 401);
  }
});

// =============================================
// PUBLIC ENDPOINTS (No auth required)
// =============================================

// GET /exam-boards - Get all active exam boards
examBoardsApp.get('/', async (c) => {
  const db = c.env.DB;

  try {
    const { results } = await db
      .prepare(`
        SELECT id, name, code, full_name as fullName, region, website_url as websiteUrl,
               logo_url as logoUrl, is_active as isActive, display_order as displayOrder
        FROM exam_boards
        WHERE is_active = 1
        ORDER BY display_order ASC
      `)
      .all();

    return c.json({ success: true, data: results });
  } catch (error) {
    console.error('Error fetching exam boards:', error);
    return c.json({ success: false, error: 'Failed to fetch exam boards' }, 500);
  }
});

// =============================================
// SPECIFICATIONS ENDPOINTS (must be before /:id to avoid route conflicts)
// =============================================

// GET /specifications - Get specifications with optional filters
examBoardsApp.get('/specifications', async (c) => {
  const db = c.env.DB;
  const boardId = c.req.query('boardId');
  const examTypeId = c.req.query('examTypeId');
  const subjectId = c.req.query('subjectId');

  try {
    let query = `
      SELECT
        ss.id, ss.exam_board_id as examBoardId, ss.subject_id as subjectId,
        ss.exam_type_id as examTypeId, ss.syllabus_code as syllabusCode,
        ss.syllabus_name as syllabusName, ss.specification_year as specificationYear,
        ss.valid_from as validFrom, ss.valid_to as validTo,
        ss.syllabus_pdf_url as syllabusPdfUrl, ss.specimen_papers_url as specimenPapersUrl,
        ss.total_papers as totalPapers, ss.assessment_info as assessmentInfo,
        ss.is_active as isActive, ss.display_order as displayOrder,
        eb.name as examBoardName, eb.code as examBoardCode,
        s.name as subjectName, s.slug as subjectSlug, s.icon as subjectIcon, s.color as subjectColor,
        et.name as examTypeName, et.slug as examTypeSlug
      FROM subject_specifications ss
      LEFT JOIN exam_boards eb ON ss.exam_board_id = eb.id
      LEFT JOIN subjects s ON ss.subject_id = s.id
      LEFT JOIN exam_types et ON ss.exam_type_id = et.id
      WHERE ss.is_active = 1
    `;

    const params: string[] = [];

    if (boardId) {
      query += ' AND ss.exam_board_id = ?';
      params.push(boardId);
    }

    if (examTypeId) {
      query += ' AND ss.exam_type_id = ?';
      params.push(examTypeId);
    }

    if (subjectId) {
      query += ' AND ss.subject_id = ?';
      params.push(subjectId);
    }

    query += ' ORDER BY ss.display_order ASC, ss.syllabus_name ASC';

    const stmt = db.prepare(query);
    const { results } = params.length > 0
      ? await stmt.bind(...params).all()
      : await stmt.all();

    // Parse JSON fields
    const specifications = results.map((spec: Record<string, unknown>) => ({
      ...spec,
      assessmentInfo: spec.assessmentInfo ? JSON.parse(spec.assessmentInfo as string) : null,
      examBoard: {
        id: spec.examBoardId,
        name: spec.examBoardName,
        code: spec.examBoardCode,
      },
      subject: {
        id: spec.subjectId,
        name: spec.subjectName,
        slug: spec.subjectSlug,
        icon: spec.subjectIcon,
        color: spec.subjectColor,
      },
      examType: {
        id: spec.examTypeId,
        name: spec.examTypeName,
        slug: spec.examTypeSlug,
      },
    }));

    return c.json({ success: true, data: specifications });
  } catch (error) {
    console.error('Error fetching specifications:', error);
    return c.json({ success: false, error: 'Failed to fetch specifications' }, 500);
  }
});

// GET /specifications/:id - Get specification details
examBoardsApp.get('/specifications/:id', async (c) => {
  const db = c.env.DB;
  const specId = c.req.param('id');

  try {
    const spec = await db
      .prepare(`
        SELECT
          ss.id, ss.exam_board_id as examBoardId, ss.subject_id as subjectId,
          ss.exam_type_id as examTypeId, ss.syllabus_code as syllabusCode,
          ss.syllabus_name as syllabusName, ss.specification_year as specificationYear,
          ss.valid_from as validFrom, ss.valid_to as validTo,
          ss.syllabus_pdf_url as syllabusPdfUrl, ss.specimen_papers_url as specimenPapersUrl,
          ss.total_papers as totalPapers, ss.assessment_info as assessmentInfo,
          ss.is_active as isActive, ss.display_order as displayOrder,
          eb.name as examBoardName, eb.code as examBoardCode,
          s.name as subjectName, s.slug as subjectSlug, s.icon as subjectIcon, s.color as subjectColor,
          et.name as examTypeName, et.slug as examTypeSlug
        FROM subject_specifications ss
        LEFT JOIN exam_boards eb ON ss.exam_board_id = eb.id
        LEFT JOIN subjects s ON ss.subject_id = s.id
        LEFT JOIN exam_types et ON ss.exam_type_id = et.id
        WHERE ss.id = ?
      `)
      .bind(specId)
      .first();

    if (!spec) {
      return c.json({ success: false, error: 'Specification not found' }, 404);
    }

    return c.json({
      success: true,
      data: {
        ...spec,
        assessmentInfo: spec.assessmentInfo ? JSON.parse(spec.assessmentInfo as string) : null,
      },
    });
  } catch (error) {
    console.error('Error fetching specification:', error);
    return c.json({ success: false, error: 'Failed to fetch specification' }, 500);
  }
});

// GET /specifications/:id/papers - Get paper components for a specification
examBoardsApp.get('/specifications/:id/papers', async (c) => {
  const db = c.env.DB;
  const specId = c.req.param('id');

  try {
    const { results } = await db
      .prepare(`
        SELECT
          id, specification_id as specificationId, paper_number as paperNumber,
          paper_name as paperName, paper_code as paperCode,
          duration_minutes as durationMinutes, total_marks as totalMarks,
          weighting_percent as weightingPercent, question_format as questionFormat,
          is_compulsory as isCompulsory, tier, description, notes,
          display_order as displayOrder
        FROM paper_components
        WHERE specification_id = ?
        ORDER BY display_order ASC, paper_number ASC
      `)
      .bind(specId)
      .all();

    return c.json({ success: true, data: results });
  } catch (error) {
    console.error('Error fetching paper components:', error);
    return c.json({ success: false, error: 'Failed to fetch paper components' }, 500);
  }
});

// GET /specifications/:id/syllabus - Get syllabus topics for a specification
examBoardsApp.get('/specifications/:id/syllabus', async (c) => {
  const db = c.env.DB;
  const specId = c.req.param('id');

  try {
    const { results } = await db
      .prepare(`
        SELECT
          id, specification_id as specificationId, parent_id as parentId,
          topic_code as topicCode, title, description,
          learning_objectives as learningObjectives,
          assessment_objectives as assessmentObjectives,
          command_words as commandWords, tier,
          hours_recommended as hoursRecommended,
          display_order as displayOrder
        FROM syllabus_topics
        WHERE specification_id = ?
        ORDER BY display_order ASC, topic_code ASC
      `)
      .bind(specId)
      .all();

    // Parse JSON fields
    const topics = results.map((topic: Record<string, unknown>) => ({
      ...topic,
      learningObjectives: topic.learningObjectives
        ? JSON.parse(topic.learningObjectives as string)
        : null,
      assessmentObjectives: topic.assessmentObjectives
        ? JSON.parse(topic.assessmentObjectives as string)
        : null,
      commandWords: topic.commandWords
        ? JSON.parse(topic.commandWords as string)
        : null,
    }));

    return c.json({ success: true, data: topics });
  } catch (error) {
    console.error('Error fetching syllabus topics:', error);
    return c.json({ success: false, error: 'Failed to fetch syllabus topics' }, 500);
  }
});

// GET /specifications/:id/grade-boundaries - Get grade boundaries for a specification
examBoardsApp.get('/specifications/:id/grade-boundaries', async (c) => {
  const db = c.env.DB;
  const specId = c.req.param('id');
  const year = c.req.query('year');

  try {
    let query = `
      SELECT
        id, specification_id as specificationId, paper_component_id as paperComponentId,
        session, year, grade, raw_mark as rawMark, ums_mark as umsMark,
        percentage, is_overall as isOverall
      FROM grade_boundaries
      WHERE specification_id = ?
    `;

    const params: (string | number)[] = [specId];

    if (year) {
      query += ' AND year = ?';
      params.push(parseInt(year));
    }

    query += ' ORDER BY year DESC, session DESC, grade ASC';

    const { results } = await db.prepare(query).bind(...params).all();

    return c.json({ success: true, data: results });
  } catch (error) {
    console.error('Error fetching grade boundaries:', error);
    return c.json({ success: false, error: 'Failed to fetch grade boundaries' }, 500);
  }
});

// GET /command-words - Get command words
examBoardsApp.get('/command-words', async (c) => {
  const db = c.env.DB;
  const boardId = c.req.query('boardId');

  try {
    let query = `
      SELECT
        id, word, definition, marks_guidance as marksGuidance,
        example_usage as exampleUsage, typical_marks_range as typicalMarksRange,
        exam_board_id as examBoardId, subject_area as subjectArea
      FROM command_words
    `;

    if (boardId) {
      query += ' WHERE exam_board_id = ? OR exam_board_id IS NULL';
    }

    query += ' ORDER BY word ASC';

    const stmt = db.prepare(query);
    const { results } = boardId ? await stmt.bind(boardId).all() : await stmt.all();

    return c.json({ success: true, data: results });
  } catch (error) {
    console.error('Error fetching command words:', error);
    return c.json({ success: false, error: 'Failed to fetch command words' }, 500);
  }
});

// GET /exam-boards/:id - Get exam board details (must be after specific routes)
examBoardsApp.get('/:id', async (c) => {
  const db = c.env.DB;
  const boardId = c.req.param('id');

  try {
    const board = await db
      .prepare(`
        SELECT id, name, code, full_name as fullName, region, website_url as websiteUrl,
               logo_url as logoUrl, is_active as isActive, display_order as displayOrder
        FROM exam_boards
        WHERE id = ?
      `)
      .bind(boardId)
      .first();

    if (!board) {
      return c.json({ success: false, error: 'Exam board not found' }, 404);
    }

    return c.json({ success: true, data: board });
  } catch (error) {
    console.error('Error fetching exam board:', error);
    return c.json({ success: false, error: 'Failed to fetch exam board' }, 500);
  }
});

// =============================================
// PROTECTED ENDPOINTS (Auth required)
// =============================================

// These will be mounted under a protected route in index.ts

// POST /user/specifications - Select a specification
examBoardsApp.post('/user/specifications', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const db = c.env.DB;
  const body = await c.req.json();
  const { specificationId, priority = 0 } = body;

  if (!specificationId) {
    return c.json({ success: false, error: 'Specification ID is required' }, 400);
  }

  try {
    const id = `uspec_${crypto.randomUUID()}`;

    await db
      .prepare(`
        INSERT INTO user_specification_selections (id, user_id, specification_id, is_active, priority)
        VALUES (?, ?, ?, 1, ?)
        ON CONFLICT (user_id, specification_id) DO UPDATE SET
          is_active = 1,
          priority = excluded.priority
      `)
      .bind(id, user.userId, specificationId, priority)
      .run();

    return c.json({ success: true, message: 'Specification selected successfully' });
  } catch (error) {
    console.error('Error selecting specification:', error);
    return c.json({ success: false, error: 'Failed to select specification' }, 500);
  }
});

// GET /user/specifications - Get user's selected specifications
examBoardsApp.get('/user/specifications', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const db = c.env.DB;

  try {
    // Get selected specifications
    const { results: specifications } = await db
      .prepare(`
        SELECT
          uss.id, uss.specification_id as specificationId, uss.is_active as isActive,
          uss.priority,
          ss.syllabus_code as syllabusCode, ss.syllabus_name as syllabusName,
          eb.name as examBoardName, et.name as examTypeName
        FROM user_specification_selections uss
        JOIN subject_specifications ss ON uss.specification_id = ss.id
        LEFT JOIN exam_boards eb ON ss.exam_board_id = eb.id
        LEFT JOIN exam_types et ON ss.exam_type_id = et.id
        WHERE uss.user_id = ? AND uss.is_active = 1
        ORDER BY uss.priority ASC
      `)
      .bind(user.userId)
      .all();

    // Get target grades
    const { results: targetGrades } = await db
      .prepare(`
        SELECT
          id, specification_id as specificationId, target_grade as targetGrade,
          current_predicted as currentPredicted, exam_session as examSession,
          exam_year as examYear, notes
        FROM user_target_grades
        WHERE user_id = ?
      `)
      .bind(user.userId)
      .all();

    return c.json({
      success: true,
      data: {
        specifications,
        targetGrades,
      },
    });
  } catch (error) {
    console.error('Error fetching user specifications:', error);
    return c.json({ success: false, error: 'Failed to fetch user specifications' }, 500);
  }
});

// DELETE /user/specifications/:id - Remove a specification selection
examBoardsApp.delete('/user/specifications/:id', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const db = c.env.DB;
  const specificationId = c.req.param('id');

  try {
    await db
      .prepare(`
        UPDATE user_specification_selections
        SET is_active = 0
        WHERE user_id = ? AND specification_id = ?
      `)
      .bind(user.userId, specificationId)
      .run();

    return c.json({ success: true, message: 'Specification removed successfully' });
  } catch (error) {
    console.error('Error removing specification:', error);
    return c.json({ success: false, error: 'Failed to remove specification' }, 500);
  }
});

// POST /user/target-grades - Set target grade for a specification
examBoardsApp.post('/user/target-grades', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const db = c.env.DB;
  const body = await c.req.json();
  const { specificationId, targetGrade, examSession, examYear, notes } = body;

  if (!specificationId || !targetGrade) {
    return c.json({ success: false, error: 'Specification ID and target grade are required' }, 400);
  }

  try {
    const id = `utg_${crypto.randomUUID()}`;

    await db
      .prepare(`
        INSERT INTO user_target_grades (id, user_id, specification_id, target_grade, exam_session, exam_year, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (user_id, specification_id) DO UPDATE SET
          target_grade = excluded.target_grade,
          exam_session = excluded.exam_session,
          exam_year = excluded.exam_year,
          notes = excluded.notes,
          updated_at = datetime('now')
      `)
      .bind(id, user.userId, specificationId, targetGrade, examSession || null, examYear || null, notes || null)
      .run();

    return c.json({ success: true, message: 'Target grade set successfully' });
  } catch (error) {
    console.error('Error setting target grade:', error);
    return c.json({ success: false, error: 'Failed to set target grade' }, 500);
  }
});

// POST /user/syllabus-progress - Update syllabus topic progress
examBoardsApp.post('/user/syllabus-progress', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const db = c.env.DB;
  const body = await c.req.json();
  const { syllabusTopicId, status, confidenceLevel, notes } = body;

  if (!syllabusTopicId) {
    return c.json({ success: false, error: 'Syllabus topic ID is required' }, 400);
  }

  try {
    const id = `usp_${crypto.randomUUID()}`;

    await db
      .prepare(`
        INSERT INTO user_syllabus_progress (id, user_id, syllabus_topic_id, status, confidence_level, notes, last_practiced_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT (user_id, syllabus_topic_id) DO UPDATE SET
          status = excluded.status,
          confidence_level = excluded.confidence_level,
          notes = excluded.notes,
          last_practiced_at = datetime('now'),
          updated_at = datetime('now')
      `)
      .bind(id, user.userId, syllabusTopicId, status || 'in_progress', confidenceLevel || 0, notes || null)
      .run();

    // Fetch and return the updated progress
    const progress = await db
      .prepare(`
        SELECT
          id, user_id as userId, syllabus_topic_id as syllabusTopicId,
          status, confidence_level as confidenceLevel,
          questions_attempted as questionsAttempted, questions_correct as questionsCorrect,
          last_practiced_at as lastPracticedAt, notes
        FROM user_syllabus_progress
        WHERE user_id = ? AND syllabus_topic_id = ?
      `)
      .bind(user.userId, syllabusTopicId)
      .first();

    return c.json({ success: true, data: progress });
  } catch (error) {
    console.error('Error updating syllabus progress:', error);
    return c.json({ success: false, error: 'Failed to update syllabus progress' }, 500);
  }
});

// GET /user/syllabus-progress/:specificationId - Get syllabus progress for a specification
examBoardsApp.get('/user/syllabus-progress/:specificationId', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const db = c.env.DB;
  const specificationId = c.req.param('specificationId');

  try {
    const { results } = await db
      .prepare(`
        SELECT
          usp.id, usp.user_id as userId, usp.syllabus_topic_id as syllabusTopicId,
          usp.status, usp.confidence_level as confidenceLevel,
          usp.questions_attempted as questionsAttempted, usp.questions_correct as questionsCorrect,
          usp.last_practiced_at as lastPracticedAt, usp.notes,
          st.topic_code as topicCode, st.title as topicTitle
        FROM user_syllabus_progress usp
        JOIN syllabus_topics st ON usp.syllabus_topic_id = st.id
        WHERE usp.user_id = ? AND st.specification_id = ?
      `)
      .bind(user.userId, specificationId)
      .all();

    return c.json({ success: true, data: results });
  } catch (error) {
    console.error('Error fetching syllabus progress:', error);
    return c.json({ success: false, error: 'Failed to fetch syllabus progress' }, 500);
  }
});

export default examBoardsApp;
