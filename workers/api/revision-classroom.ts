import { Hono } from 'hono';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  ANTHROPIC_API_KEY?: string;
}

interface UserPayload {
  userId: string;
  email: string;
  role: string;
}

const revisionClassroomApp = new Hono<{ Bindings: Env; Variables: { user: UserPayload } }>();

// Helper to generate unique IDs
const generateId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

// =============================================
// REVISION SESSIONS
// =============================================

// Get all revision sessions for the current user
revisionClassroomApp.get('/sessions', async (c) => {
  try {
    const user = c.get('user');
    const status = c.req.query('status'); // 'active', 'paused', 'completed', 'abandoned'
    const examType = c.req.query('examType');
    const limit = parseInt(c.req.query('limit') || '20');

    let query = `
      SELECT
        rs.*,
        s.name as subject_name,
        t.name as topic_name
      FROM revision_sessions rs
      LEFT JOIN subjects s ON rs.subject_id = s.id
      LEFT JOIN topics t ON rs.topic_id = t.id
      WHERE rs.user_id = ?
    `;
    const params: any[] = [user.userId];

    if (status) {
      query += ' AND rs.status = ?';
      params.push(status);
    }

    if (examType) {
      query += ' AND rs.exam_type = ?';
      params.push(examType);
    }

    query += ' ORDER BY rs.last_activity_at DESC LIMIT ?';
    params.push(limit);

    const sessions = await c.env.DB.prepare(query).bind(...params).all();

    return c.json({
      success: true,
      data: { sessions: sessions.results },
    });
  } catch (error) {
    console.error('Error fetching revision sessions:', error);
    return c.json({ success: false, error: 'Failed to fetch sessions' }, 500);
  }
});

// Get a specific revision session with lessons
revisionClassroomApp.get('/sessions/:sessionId', async (c) => {
  try {
    const user = c.get('user');
    const sessionId = c.req.param('sessionId');

    const session = await c.env.DB.prepare(`
      SELECT
        rs.*,
        s.name as subject_name,
        t.name as topic_name
      FROM revision_sessions rs
      LEFT JOIN subjects s ON rs.subject_id = s.id
      LEFT JOIN topics t ON rs.topic_id = t.id
      WHERE rs.id = ? AND rs.user_id = ?
    `).bind(sessionId, user.userId).first();

    if (!session) {
      return c.json({ success: false, error: 'Session not found' }, 404);
    }

    // Get lessons for this session
    const lessons = await c.env.DB.prepare(`
      SELECT
        rl.*,
        t.name as topic_name
      FROM revision_lessons rl
      LEFT JOIN topics t ON rl.topic_id = t.id
      WHERE rl.session_id = ?
      ORDER BY rl.lesson_order ASC
    `).bind(sessionId).all();

    return c.json({
      success: true,
      data: {
        session,
        lessons: lessons.results,
      },
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    return c.json({ success: false, error: 'Failed to fetch session' }, 500);
  }
});

// Create a new revision session
revisionClassroomApp.post('/sessions', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const { examType, subjectId, sessionType = 'full_revision', topicId } = body;

    if (!examType || !subjectId) {
      return c.json({ success: false, error: 'examType and subjectId are required' }, 400);
    }

    const sessionId = generateId('session');
    const now = new Date().toISOString();

    // Get topics for this subject to determine total lessons
    const topics = await c.env.DB.prepare(`
      SELECT id, name, display_order
      FROM topics
      WHERE subject_id = ?
      ORDER BY display_order ASC
    `).bind(subjectId).all();

    const totalLessons = topicId ? 1 : topics.results.length;

    // Create the session
    await c.env.DB.prepare(`
      INSERT INTO revision_sessions (
        id, user_id, exam_type, subject_id, topic_id, session_type,
        status, progress_percentage, lessons_completed, total_lessons,
        mastery_score, time_spent_minutes, started_at, last_activity_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'active', 0, 0, ?, 0, 0, ?, ?, ?, ?)
    `).bind(
      sessionId, user.userId, examType, subjectId, topicId || null,
      sessionType, totalLessons, now, now, now, now
    ).run();

    // Create lessons for each topic
    const lessonsToCreate = topicId
      ? topics.results.filter((t: any) => t.id === topicId)
      : topics.results;

    for (let i = 0; i < lessonsToCreate.length; i++) {
      const topic = lessonsToCreate[i] as any;
      const lessonId = generateId('lesson');

      await c.env.DB.prepare(`
        INSERT INTO revision_lessons (
          id, session_id, topic_id, lesson_order, title, description,
          lesson_type, status, understanding_level, questions_attempted,
          questions_correct, time_spent_seconds, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'concept', 'pending', 0, 0, 0, 0, ?, ?)
      `).bind(
        lessonId, sessionId, topic.id, i + 1,
        `${topic.name} - Complete Revision`,
        `Master ${topic.name} for your ${examType.toUpperCase()} exam`,
        now, now
      ).run();
    }

    // Update session with first lesson ID
    const firstLesson = await c.env.DB.prepare(`
      SELECT id FROM revision_lessons WHERE session_id = ? ORDER BY lesson_order LIMIT 1
    `).bind(sessionId).first();

    if (firstLesson) {
      await c.env.DB.prepare(`
        UPDATE revision_sessions SET current_lesson_id = ? WHERE id = ?
      `).bind(firstLesson.id, sessionId).run();
    }

    // Fetch the created session with lessons
    const session = await c.env.DB.prepare(`
      SELECT * FROM revision_sessions WHERE id = ?
    `).bind(sessionId).first();

    const lessons = await c.env.DB.prepare(`
      SELECT * FROM revision_lessons WHERE session_id = ? ORDER BY lesson_order
    `).bind(sessionId).all();

    return c.json({
      success: true,
      data: {
        session,
        lessons: lessons.results,
      },
    });
  } catch (error) {
    console.error('Error creating session:', error);
    return c.json({ success: false, error: 'Failed to create session' }, 500);
  }
});

// Update session status
revisionClassroomApp.patch('/sessions/:sessionId', async (c) => {
  try {
    const user = c.get('user');
    const sessionId = c.req.param('sessionId');
    const body = await c.req.json();
    const { status, progressPercentage, masteryScore, timeSpentMinutes } = body;

    const now = new Date().toISOString();
    const updates: string[] = ['updated_at = ?', 'last_activity_at = ?'];
    const params: any[] = [now, now];

    if (status) {
      updates.push('status = ?');
      params.push(status);
      if (status === 'completed') {
        updates.push('completed_at = ?');
        params.push(now);
      }
    }

    if (progressPercentage !== undefined) {
      updates.push('progress_percentage = ?');
      params.push(progressPercentage);
    }

    if (masteryScore !== undefined) {
      updates.push('mastery_score = ?');
      params.push(masteryScore);
    }

    if (timeSpentMinutes !== undefined) {
      updates.push('time_spent_minutes = ?');
      params.push(timeSpentMinutes);
    }

    params.push(sessionId, user.userId);

    await c.env.DB.prepare(`
      UPDATE revision_sessions
      SET ${updates.join(', ')}
      WHERE id = ? AND user_id = ?
    `).bind(...params).run();

    const session = await c.env.DB.prepare(`
      SELECT * FROM revision_sessions WHERE id = ?
    `).bind(sessionId).first();

    return c.json({
      success: true,
      data: { session },
    });
  } catch (error) {
    console.error('Error updating session:', error);
    return c.json({ success: false, error: 'Failed to update session' }, 500);
  }
});

// =============================================
// REVISION LESSONS
// =============================================

// Get a specific lesson with checkpoints
revisionClassroomApp.get('/lessons/:lessonId', async (c) => {
  try {
    const user = c.get('user');
    const lessonId = c.req.param('lessonId');

    const lesson = await c.env.DB.prepare(`
      SELECT
        rl.*,
        t.name as topic_name,
        rs.exam_type,
        rs.subject_id
      FROM revision_lessons rl
      LEFT JOIN topics t ON rl.topic_id = t.id
      LEFT JOIN revision_sessions rs ON rl.session_id = rs.id
      WHERE rl.id = ? AND rs.user_id = ?
    `).bind(lessonId, user.userId).first();

    if (!lesson) {
      return c.json({ success: false, error: 'Lesson not found' }, 404);
    }

    // Get checkpoints for this lesson
    const checkpoints = await c.env.DB.prepare(`
      SELECT * FROM revision_checkpoints
      WHERE lesson_id = ?
      ORDER BY order_index ASC
    `).bind(lessonId).all();

    // Get user's responses to checkpoints
    const responses = await c.env.DB.prepare(`
      SELECT * FROM checkpoint_responses
      WHERE lesson_id = ? AND user_id = ?
    `).bind(lessonId, user.userId).all();

    return c.json({
      success: true,
      data: {
        lesson,
        checkpoints: checkpoints.results,
        responses: responses.results,
      },
    });
  } catch (error) {
    console.error('Error fetching lesson:', error);
    return c.json({ success: false, error: 'Failed to fetch lesson' }, 500);
  }
});

// Update lesson progress
revisionClassroomApp.patch('/lessons/:lessonId', async (c) => {
  try {
    const user = c.get('user');
    const lessonId = c.req.param('lessonId');
    const body = await c.req.json();
    const {
      status,
      understandingLevel,
      questionsAttempted,
      questionsCorrect,
      timeSpentSeconds,
      hookContent,
      explanationContent,
      keyPoints,
    } = body;

    // Verify user owns this lesson
    const lessonCheck = await c.env.DB.prepare(`
      SELECT rl.id, rs.user_id, rs.id as session_id
      FROM revision_lessons rl
      JOIN revision_sessions rs ON rl.session_id = rs.id
      WHERE rl.id = ? AND rs.user_id = ?
    `).bind(lessonId, user.userId).first();

    if (!lessonCheck) {
      return c.json({ success: false, error: 'Lesson not found' }, 404);
    }

    const now = new Date().toISOString();
    const updates: string[] = ['updated_at = ?'];
    const params: any[] = [now];

    if (status) {
      updates.push('status = ?');
      params.push(status);
      if (status === 'in_progress' && !body.startedAt) {
        updates.push('started_at = ?');
        params.push(now);
      }
      if (status === 'completed') {
        updates.push('completed_at = ?');
        params.push(now);
      }
    }

    if (understandingLevel !== undefined) {
      updates.push('understanding_level = ?');
      params.push(understandingLevel);
    }

    if (questionsAttempted !== undefined) {
      updates.push('questions_attempted = ?');
      params.push(questionsAttempted);
    }

    if (questionsCorrect !== undefined) {
      updates.push('questions_correct = ?');
      params.push(questionsCorrect);
    }

    if (timeSpentSeconds !== undefined) {
      updates.push('time_spent_seconds = ?');
      params.push(timeSpentSeconds);
    }

    if (hookContent) {
      updates.push('hook_content = ?');
      params.push(hookContent);
    }

    if (explanationContent) {
      updates.push('explanation_content = ?');
      params.push(explanationContent);
    }

    if (keyPoints) {
      updates.push('key_points = ?');
      params.push(JSON.stringify(keyPoints));
    }

    params.push(lessonId);

    await c.env.DB.prepare(`
      UPDATE revision_lessons
      SET ${updates.join(', ')}
      WHERE id = ?
    `).bind(...params).run();

    // Update session progress if lesson completed
    if (status === 'completed') {
      const sessionId = (lessonCheck as any).session_id;

      // Count completed lessons
      const completedCount = await c.env.DB.prepare(`
        SELECT COUNT(*) as count FROM revision_lessons
        WHERE session_id = ? AND status = 'completed'
      `).bind(sessionId).first();

      const totalCount = await c.env.DB.prepare(`
        SELECT COUNT(*) as count FROM revision_lessons WHERE session_id = ?
      `).bind(sessionId).first();

      const progress = Math.round(((completedCount as any).count / (totalCount as any).count) * 100);

      await c.env.DB.prepare(`
        UPDATE revision_sessions
        SET lessons_completed = ?, progress_percentage = ?, last_activity_at = ?
        WHERE id = ?
      `).bind((completedCount as any).count, progress, now, sessionId).run();
    }

    const lesson = await c.env.DB.prepare(`
      SELECT * FROM revision_lessons WHERE id = ?
    `).bind(lessonId).first();

    return c.json({
      success: true,
      data: { lesson },
    });
  } catch (error) {
    console.error('Error updating lesson:', error);
    return c.json({ success: false, error: 'Failed to update lesson' }, 500);
  }
});

// =============================================
// AI INTERACTIONS
// =============================================

// Record AI interaction
revisionClassroomApp.post('/lessons/:lessonId/interactions', async (c) => {
  try {
    const user = c.get('user');
    const lessonId = c.req.param('lessonId');
    const body = await c.req.json();
    const { interactionType, aiMessage, userResponse, sentiment, tokensUsed } = body;

    // Verify user owns this lesson
    const lessonCheck = await c.env.DB.prepare(`
      SELECT rl.id FROM revision_lessons rl
      JOIN revision_sessions rs ON rl.session_id = rs.id
      WHERE rl.id = ? AND rs.user_id = ?
    `).bind(lessonId, user.userId).first();

    if (!lessonCheck) {
      return c.json({ success: false, error: 'Lesson not found' }, 404);
    }

    const interactionId = generateId('interaction');
    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      INSERT INTO revision_ai_interactions (
        id, lesson_id, user_id, interaction_type, ai_message,
        user_response, sentiment, tokens_used, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      interactionId, lessonId, user.userId, interactionType,
      aiMessage, userResponse || null, sentiment || null, tokensUsed || null, now
    ).run();

    return c.json({
      success: true,
      data: { interactionId },
    });
  } catch (error) {
    console.error('Error recording interaction:', error);
    return c.json({ success: false, error: 'Failed to record interaction' }, 500);
  }
});

// Get AI interactions for a lesson
revisionClassroomApp.get('/lessons/:lessonId/interactions', async (c) => {
  try {
    const user = c.get('user');
    const lessonId = c.req.param('lessonId');

    const interactions = await c.env.DB.prepare(`
      SELECT rai.* FROM revision_ai_interactions rai
      JOIN revision_lessons rl ON rai.lesson_id = rl.id
      JOIN revision_sessions rs ON rl.session_id = rs.id
      WHERE rai.lesson_id = ? AND rs.user_id = ?
      ORDER BY rai.created_at ASC
    `).bind(lessonId, user.userId).all();

    return c.json({
      success: true,
      data: { interactions: interactions.results },
    });
  } catch (error) {
    console.error('Error fetching interactions:', error);
    return c.json({ success: false, error: 'Failed to fetch interactions' }, 500);
  }
});

// =============================================
// CHECKPOINTS
// =============================================

// Create checkpoint for a lesson
revisionClassroomApp.post('/lessons/:lessonId/checkpoints', async (c) => {
  try {
    const user = c.get('user');
    const lessonId = c.req.param('lessonId');
    const body = await c.req.json();
    const {
      checkpointType,
      questionText,
      questionType,
      options,
      correctAnswer,
      explanation,
      difficulty = 'medium',
      points = 1,
    } = body;

    // Verify user owns this lesson (or is admin/teacher)
    const lessonCheck = await c.env.DB.prepare(`
      SELECT rl.id FROM revision_lessons rl
      JOIN revision_sessions rs ON rl.session_id = rs.id
      WHERE rl.id = ? AND (rs.user_id = ? OR ? IN ('admin', 'teacher'))
    `).bind(lessonId, user.userId, user.role).first();

    if (!lessonCheck) {
      return c.json({ success: false, error: 'Lesson not found' }, 404);
    }

    // Get current max order
    const maxOrder = await c.env.DB.prepare(`
      SELECT COALESCE(MAX(order_index), 0) as max_order FROM revision_checkpoints WHERE lesson_id = ?
    `).bind(lessonId).first();

    const checkpointId = generateId('checkpoint');
    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      INSERT INTO revision_checkpoints (
        id, lesson_id, checkpoint_type, question_text, question_type,
        options, correct_answer, explanation, difficulty, points, order_index, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      checkpointId, lessonId, checkpointType, questionText, questionType,
      options ? JSON.stringify(options) : null, correctAnswer, explanation,
      difficulty, points, ((maxOrder as any).max_order || 0) + 1, now
    ).run();

    const checkpoint = await c.env.DB.prepare(`
      SELECT * FROM revision_checkpoints WHERE id = ?
    `).bind(checkpointId).first();

    return c.json({
      success: true,
      data: { checkpoint },
    });
  } catch (error) {
    console.error('Error creating checkpoint:', error);
    return c.json({ success: false, error: 'Failed to create checkpoint' }, 500);
  }
});

// Submit checkpoint response
revisionClassroomApp.post('/checkpoints/:checkpointId/respond', async (c) => {
  try {
    const user = c.get('user');
    const checkpointId = c.req.param('checkpointId');
    const body = await c.req.json();
    const { userAnswer, timeTakenSeconds } = body;

    // Get checkpoint and verify user has access
    const checkpoint = await c.env.DB.prepare(`
      SELECT rc.*, rs.id as session_id, rs.user_id
      FROM revision_checkpoints rc
      JOIN revision_lessons rl ON rc.lesson_id = rl.id
      JOIN revision_sessions rs ON rl.session_id = rs.id
      WHERE rc.id = ? AND rs.user_id = ?
    `).bind(checkpointId, user.userId).first();

    if (!checkpoint) {
      return c.json({ success: false, error: 'Checkpoint not found' }, 404);
    }

    // Check if answer is correct
    const isCorrect = userAnswer.toLowerCase().trim() === (checkpoint as any).correct_answer.toLowerCase().trim();

    // Generate AI feedback
    const aiFeedback = isCorrect
      ? `Excellent! You got it right. ${(checkpoint as any).explanation}`
      : `Not quite. The correct answer is "${(checkpoint as any).correct_answer}". ${(checkpoint as any).explanation}`;

    const responseId = generateId('response');
    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      INSERT INTO checkpoint_responses (
        id, checkpoint_id, user_id, session_id, user_answer,
        is_correct, time_taken_seconds, ai_feedback, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      responseId, checkpointId, user.userId, (checkpoint as any).session_id,
      userAnswer, isCorrect ? 1 : 0, timeTakenSeconds || null, aiFeedback, now
    ).run();

    // Update lesson statistics
    await c.env.DB.prepare(`
      UPDATE revision_lessons
      SET questions_attempted = questions_attempted + 1,
          questions_correct = questions_correct + ?
      WHERE id = (SELECT lesson_id FROM revision_checkpoints WHERE id = ?)
    `).bind(isCorrect ? 1 : 0, checkpointId).run();

    return c.json({
      success: true,
      data: {
        responseId,
        isCorrect,
        correctAnswer: (checkpoint as any).correct_answer,
        explanation: (checkpoint as any).explanation,
        aiFeedback,
        points: isCorrect ? (checkpoint as any).points : 0,
      },
    });
  } catch (error) {
    console.error('Error submitting response:', error);
    return c.json({ success: false, error: 'Failed to submit response' }, 500);
  }
});

// =============================================
// TOPIC MASTERY
// =============================================

// Get topic mastery for user
revisionClassroomApp.get('/mastery', async (c) => {
  try {
    const user = c.get('user');
    const examType = c.req.query('examType');
    const subjectId = c.req.query('subjectId');

    let query = `
      SELECT
        tm.*,
        t.name as topic_name,
        s.name as subject_name
      FROM topic_mastery tm
      LEFT JOIN topics t ON tm.topic_id = t.id
      LEFT JOIN subjects s ON t.subject_id = s.id
      WHERE tm.user_id = ?
    `;
    const params: any[] = [user.userId];

    if (examType) {
      query += ' AND tm.exam_type = ?';
      params.push(examType);
    }

    if (subjectId) {
      query += ' AND t.subject_id = ?';
      params.push(subjectId);
    }

    query += ' ORDER BY tm.mastery_level DESC';

    const mastery = await c.env.DB.prepare(query).bind(...params).all();

    return c.json({
      success: true,
      data: { mastery: mastery.results },
    });
  } catch (error) {
    console.error('Error fetching mastery:', error);
    return c.json({ success: false, error: 'Failed to fetch mastery' }, 500);
  }
});

// Update topic mastery
revisionClassroomApp.post('/mastery', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const {
      topicId,
      examType,
      masteryLevel,
      confidenceLevel,
      practiceQuestionsAttempted,
      practiceQuestionsCorrect,
    } = body;

    if (!topicId || !examType) {
      return c.json({ success: false, error: 'topicId and examType are required' }, 400);
    }

    const now = new Date().toISOString();

    // Check if mastery record exists
    const existing = await c.env.DB.prepare(`
      SELECT id FROM topic_mastery WHERE user_id = ? AND topic_id = ? AND exam_type = ?
    `).bind(user.userId, topicId, examType).first();

    if (existing) {
      // Update existing record
      const updates: string[] = ['updated_at = ?', 'last_revised_at = ?', 'revision_count = revision_count + 1'];
      const params: any[] = [now, now];

      if (masteryLevel !== undefined) {
        updates.push('mastery_level = ?');
        params.push(masteryLevel);
      }

      if (confidenceLevel) {
        updates.push('confidence_level = ?');
        params.push(confidenceLevel);
      }

      if (practiceQuestionsAttempted !== undefined) {
        updates.push('practice_questions_attempted = practice_questions_attempted + ?');
        params.push(practiceQuestionsAttempted);
      }

      if (practiceQuestionsCorrect !== undefined) {
        updates.push('practice_questions_correct = practice_questions_correct + ?');
        params.push(practiceQuestionsCorrect);
      }

      // Calculate next revision due (spaced repetition)
      const daysUntilNextReview = masteryLevel >= 80 ? 7 : masteryLevel >= 60 ? 3 : 1;
      const nextRevision = new Date(Date.now() + daysUntilNextReview * 24 * 60 * 60 * 1000).toISOString();
      updates.push('next_revision_due = ?');
      params.push(nextRevision);

      params.push((existing as any).id);

      await c.env.DB.prepare(`
        UPDATE topic_mastery SET ${updates.join(', ')} WHERE id = ?
      `).bind(...params).run();
    } else {
      // Create new record
      const masteryId = generateId('mastery');
      const nextRevision = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      await c.env.DB.prepare(`
        INSERT INTO topic_mastery (
          id, user_id, topic_id, exam_type, mastery_level, confidence_level,
          lessons_completed, practice_questions_attempted, practice_questions_correct,
          revision_count, last_revised_at, next_revision_due, retention_strength,
          initial_assessment_score, current_assessment_score, improvement_percentage,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, 1, ?, ?, 1.0, ?, ?, 0, ?, ?)
      `).bind(
        masteryId, user.userId, topicId, examType,
        masteryLevel || 0, confidenceLevel || 'low',
        practiceQuestionsAttempted || 0, practiceQuestionsCorrect || 0,
        now, nextRevision, masteryLevel || 0, masteryLevel || 0, now, now
      ).run();
    }

    const mastery = await c.env.DB.prepare(`
      SELECT * FROM topic_mastery WHERE user_id = ? AND topic_id = ? AND exam_type = ?
    `).bind(user.userId, topicId, examType).first();

    return c.json({
      success: true,
      data: { mastery },
    });
  } catch (error) {
    console.error('Error updating mastery:', error);
    return c.json({ success: false, error: 'Failed to update mastery' }, 500);
  }
});

// Get topics due for revision (spaced repetition)
revisionClassroomApp.get('/mastery/due', async (c) => {
  try {
    const user = c.get('user');
    const examType = c.req.query('examType');
    const limit = parseInt(c.req.query('limit') || '10');

    let query = `
      SELECT
        tm.*,
        t.name as topic_name,
        s.name as subject_name
      FROM topic_mastery tm
      LEFT JOIN topics t ON tm.topic_id = t.id
      LEFT JOIN subjects s ON t.subject_id = s.id
      WHERE tm.user_id = ?
        AND (tm.next_revision_due IS NULL OR tm.next_revision_due <= datetime('now'))
    `;
    const params: any[] = [user.userId];

    if (examType) {
      query += ' AND tm.exam_type = ?';
      params.push(examType);
    }

    query += ' ORDER BY tm.mastery_level ASC, tm.next_revision_due ASC LIMIT ?';
    params.push(limit);

    const dueTopics = await c.env.DB.prepare(query).bind(...params).all();

    return c.json({
      success: true,
      data: { dueTopics: dueTopics.results },
    });
  } catch (error) {
    console.error('Error fetching due topics:', error);
    return c.json({ success: false, error: 'Failed to fetch due topics' }, 500);
  }
});

// =============================================
// REVISION SCHEDULES
// =============================================

// Get user's revision schedules
revisionClassroomApp.get('/schedules', async (c) => {
  try {
    const user = c.get('user');
    const status = c.req.query('status');

    let query = `
      SELECT
        rs.*,
        s.name as subject_name
      FROM revision_schedules rs
      LEFT JOIN subjects s ON rs.subject_id = s.id
      WHERE rs.user_id = ?
    `;
    const params: any[] = [user.userId];

    if (status) {
      query += ' AND rs.status = ?';
      params.push(status);
    }

    query += ' ORDER BY rs.created_at DESC';

    const schedules = await c.env.DB.prepare(query).bind(...params).all();

    return c.json({
      success: true,
      data: { schedules: schedules.results },
    });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return c.json({ success: false, error: 'Failed to fetch schedules' }, 500);
  }
});

// Create revision schedule
revisionClassroomApp.post('/schedules', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const {
      examType,
      subjectId,
      targetExamDate,
      topicsToCover,
      dailyTimeMinutes = 30,
      preferredDays,
    } = body;

    if (!examType || !subjectId || !topicsToCover) {
      return c.json({ success: false, error: 'examType, subjectId, and topicsToCover are required' }, 400);
    }

    const scheduleId = generateId('schedule');
    const now = new Date().toISOString();

    // Calculate estimated hours based on topics and daily time
    const estimatedHours = Math.ceil((topicsToCover.length * 45) / 60); // Assume 45 min per topic

    await c.env.DB.prepare(`
      INSERT INTO revision_schedules (
        id, user_id, exam_type, subject_id, target_exam_date, schedule_type,
        topics_to_cover, estimated_hours, daily_time_minutes, preferred_days,
        topics_completed, current_topic_id, on_track, days_ahead, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'auto', ?, ?, ?, ?, '[]', ?, 1, 0, 'active', ?, ?)
    `).bind(
      scheduleId, user.userId, examType, subjectId, targetExamDate || null,
      JSON.stringify(topicsToCover), estimatedHours, dailyTimeMinutes,
      preferredDays ? JSON.stringify(preferredDays) : null,
      topicsToCover[0] || null, now, now
    ).run();

    const schedule = await c.env.DB.prepare(`
      SELECT * FROM revision_schedules WHERE id = ?
    `).bind(scheduleId).first();

    return c.json({
      success: true,
      data: { schedule },
    });
  } catch (error) {
    console.error('Error creating schedule:', error);
    return c.json({ success: false, error: 'Failed to create schedule' }, 500);
  }
});

// =============================================
// ACHIEVEMENTS
// =============================================

// Get user's revision achievements
revisionClassroomApp.get('/achievements', async (c) => {
  try {
    const user = c.get('user');

    const achievements = await c.env.DB.prepare(`
      SELECT
        ra.*,
        s.name as subject_name,
        t.name as topic_name
      FROM revision_achievements ra
      LEFT JOIN subjects s ON ra.subject_id = s.id
      LEFT JOIN topics t ON ra.topic_id = t.id
      WHERE ra.user_id = ?
      ORDER BY ra.earned_at DESC
    `).bind(user.userId).all();

    return c.json({
      success: true,
      data: { achievements: achievements.results },
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return c.json({ success: false, error: 'Failed to fetch achievements' }, 500);
  }
});

// Award achievement
revisionClassroomApp.post('/achievements', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const {
      achievementType,
      achievementName,
      achievementDescription,
      examType,
      subjectId,
      topicId,
      xpEarned = 0,
    } = body;

    const achievementId = generateId('achievement');
    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      INSERT INTO revision_achievements (
        id, user_id, achievement_type, achievement_name, achievement_description,
        exam_type, subject_id, topic_id, xp_earned, earned_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      achievementId, user.userId, achievementType, achievementName,
      achievementDescription || null, examType || null, subjectId || null,
      topicId || null, xpEarned, now
    ).run();

    return c.json({
      success: true,
      data: { achievementId, xpEarned },
    });
  } catch (error) {
    console.error('Error awarding achievement:', error);
    return c.json({ success: false, error: 'Failed to award achievement' }, 500);
  }
});

// =============================================
// EXAM BOARD INTELLIGENCE
// =============================================

// Get exam board intelligence for a topic
revisionClassroomApp.get('/intelligence/:examType/:subjectId', async (c) => {
  try {
    const examType = c.req.param('examType');
    const subjectId = c.req.param('subjectId');
    const topicId = c.req.query('topicId');

    let query = `
      SELECT * FROM exam_board_intelligence
      WHERE exam_type = ? AND subject_id = ?
    `;
    const params: any[] = [examType, subjectId];

    if (topicId) {
      query += ' AND topic_id = ?';
      params.push(topicId);
    }

    const intelligence = await c.env.DB.prepare(query).bind(...params).all();

    return c.json({
      success: true,
      data: { intelligence: intelligence.results },
    });
  } catch (error) {
    console.error('Error fetching intelligence:', error);
    return c.json({ success: false, error: 'Failed to fetch intelligence' }, 500);
  }
});

// =============================================
// STATISTICS
// =============================================

// Get revision statistics for user
revisionClassroomApp.get('/stats', async (c) => {
  try {
    const user = c.get('user');
    const examType = c.req.query('examType');

    // Total sessions
    let sessionsQuery = 'SELECT COUNT(*) as total, status FROM revision_sessions WHERE user_id = ?';
    const sessionsParams: any[] = [user.userId];
    if (examType) {
      sessionsQuery += ' AND exam_type = ?';
      sessionsParams.push(examType);
    }
    sessionsQuery += ' GROUP BY status';

    const sessionStats = await c.env.DB.prepare(sessionsQuery).bind(...sessionsParams).all();

    // Total time spent
    let timeQuery = 'SELECT SUM(time_spent_minutes) as total_minutes FROM revision_sessions WHERE user_id = ?';
    const timeParams: any[] = [user.userId];
    if (examType) {
      timeQuery += ' AND exam_type = ?';
      timeParams.push(examType);
    }

    const timeStats = await c.env.DB.prepare(timeQuery).bind(...timeParams).first();

    // Topic mastery stats
    let masteryQuery = `
      SELECT
        COUNT(*) as total_topics,
        COUNT(CASE WHEN mastery_level >= 80 THEN 1 END) as mastered,
        COUNT(CASE WHEN mastery_level >= 50 AND mastery_level < 80 THEN 1 END) as progressing,
        COUNT(CASE WHEN mastery_level < 50 THEN 1 END) as needs_work,
        AVG(mastery_level) as average_mastery
      FROM topic_mastery WHERE user_id = ?
    `;
    const masteryParams: any[] = [user.userId];
    if (examType) {
      masteryQuery += ' AND exam_type = ?';
      masteryParams.push(examType);
    }

    const masteryStats = await c.env.DB.prepare(masteryQuery).bind(...masteryParams).first();

    // Achievement count
    let achievementQuery = 'SELECT COUNT(*) as total, SUM(xp_earned) as total_xp FROM revision_achievements WHERE user_id = ?';
    const achievementParams: any[] = [user.userId];
    if (examType) {
      achievementQuery += ' AND exam_type = ?';
      achievementParams.push(examType);
    }

    const achievementStats = await c.env.DB.prepare(achievementQuery).bind(...achievementParams).first();

    return c.json({
      success: true,
      data: {
        sessions: sessionStats.results,
        totalTimeMinutes: (timeStats as any)?.total_minutes || 0,
        mastery: masteryStats,
        achievements: achievementStats,
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return c.json({ success: false, error: 'Failed to fetch stats' }, 500);
  }
});

export { revisionClassroomApp };
