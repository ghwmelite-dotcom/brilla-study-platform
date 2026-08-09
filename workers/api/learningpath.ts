import { Hono } from 'hono';
import { requireAuth } from './auth-middleware';
import { parseLimit } from './http';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

interface UserPayload {
  userId: string;
  email: string;
  role: string;
}

const learningPathApp = new Hono<{ Bindings: Env; Variables: { user: UserPayload } }>();

// All learning path routes require a verified JWT (sets user on context).
learningPathApp.use('*', requireAuth);

const generateId = () => `lp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

// =============================================
// LEARNING PATH ENDPOINTS
// =============================================

// Get personalized recommendations
learningPathApp.get('/recommendations', async (c) => {
  try {
    const user = c.get('user');
    const limit = parseLimit(c, 10);

    // Get user's topic mastery from progress
    const topicMastery = await c.env.DB.prepare(`
      SELECT
        t.id as topic_id,
        t.name as topic_name,
        t.subject_id,
        s.name as subject_name,
        COALESCE(AVG(CASE WHEN qa.is_correct = 1 THEN 100 ELSE 0 END), 0) as mastery,
        COUNT(qa.id) as questions_attempted
      FROM topics t
      LEFT JOIN subjects s ON t.subject_id = s.id
      LEFT JOIN questions q ON q.topic_id = t.id
      LEFT JOIN question_attempts qa ON qa.question_id = q.id AND qa.user_id = ?
      GROUP BY t.id
      ORDER BY mastery ASC, questions_attempted ASC
      LIMIT ?
    `).bind(user.userId, limit * 2).all();

    // Prioritize weak areas and untouched topics
    const recommendations = topicMastery.results.map((topic: any) => {
      let priority: 'critical' | 'high' | 'medium' | 'low' = 'medium';
      let reason = 'review_needed';

      if (topic.questions_attempted === 0) {
        priority = 'high';
        reason = 'not_started';
      } else if (topic.mastery < 30) {
        priority = 'critical';
        reason = 'weak_area';
      } else if (topic.mastery < 50) {
        priority = 'high';
        reason = 'weak_area';
      } else if (topic.mastery < 70) {
        priority = 'medium';
        reason = 'review_needed';
      } else {
        priority = 'low';
        reason = 'maintain';
      }

      return {
        topicId: topic.topic_id,
        topicName: topic.topic_name,
        subjectId: topic.subject_id,
        subjectName: topic.subject_name,
        priority,
        reason,
        masteryScore: Math.round(topic.mastery),
        questionsAttempted: topic.questions_attempted,
        estimatedTime: topic.mastery < 50 ? 45 : 30,
      };
    }).slice(0, limit);

    return c.json({
      success: true,
      data: { recommendations },
    });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return c.json({ success: false, error: 'Failed to fetch recommendations' }, 500);
  }
});

// Calculate exam readiness
learningPathApp.get('/exam-readiness/:examType', async (c) => {
  try {
    const user = c.get('user');
    const examType = c.req.param('examType');

    if (!['wassce', 'bece', 'nsmq'].includes(examType)) {
      return c.json({ success: false, error: 'Invalid exam type' }, 400);
    }

    // Get subjects for this exam type
    const subjects = await c.env.DB.prepare(`
      SELECT s.id, s.name, s.icon
      FROM subjects s
      LEFT JOIN exam_types et ON et.id = s.exam_type_id
      WHERE et.slug = ? OR s.exam_type_id IS NULL
      ORDER BY s.name
    `).bind(examType).all();

    const subjectRows = subjects.results as any[];

    // Compute mastery for all subjects in a single grouped query (one round
    // trip instead of one aggregate per subject).
    const masteryBySubject = new Map<string, any>();
    if (subjectRows.length > 0) {
      const placeholders = subjectRows.map(() => '?').join(',');
      const masteryRows = await c.env.DB.prepare(`
        SELECT
          s.id AS subject_id,
          COUNT(DISTINCT t.id) AS total_topics,
          COUNT(DISTINCT CASE WHEN topic_mastery.mastery >= 70 THEN t.id END) AS mastered_topics,
          COALESCE(AVG(topic_mastery.mastery), 0) AS avg_mastery
        FROM subjects s
        LEFT JOIN topics t ON t.subject_id = s.id
        LEFT JOIN (
          SELECT
            q.topic_id,
            AVG(CASE WHEN qa.is_correct = 1 THEN 100 ELSE 0 END) as mastery
          FROM questions q
          LEFT JOIN question_attempts qa ON qa.question_id = q.id AND qa.user_id = ?
          GROUP BY q.topic_id
        ) topic_mastery ON topic_mastery.topic_id = t.id
        WHERE s.id IN (${placeholders})
        GROUP BY s.id
      `).bind(user.userId, ...subjectRows.map((s: any) => s.id)).all();

      for (const m of masteryRows.results as any[]) {
        masteryBySubject.set(m.subject_id, m);
      }
    }

    // Get weak and strong topics for all subjects in a single grouped query
    // (one round trip instead of one per subject), stitched in JS below.
    const topicsBySubject = new Map<string, any[]>();
    if (subjectRows.length > 0) {
      const placeholders = subjectRows.map(() => '?').join(',');
      const topicRows = await c.env.DB.prepare(`
        SELECT
          t.subject_id,
          t.id,
          t.name,
          COALESCE(AVG(CASE WHEN qa.is_correct = 1 THEN 100 ELSE 0 END), 0) as mastery
        FROM topics t
        LEFT JOIN questions q ON q.topic_id = t.id
        LEFT JOIN question_attempts qa ON qa.question_id = q.id AND qa.user_id = ?
        WHERE t.subject_id IN (${placeholders})
        GROUP BY t.id
      `).bind(user.userId, ...subjectRows.map((s: any) => s.id)).all();

      for (const t of topicRows.results as any[]) {
        const list = topicsBySubject.get(t.subject_id) || [];
        list.push(t);
        topicsBySubject.set(t.subject_id, list);
      }
    }

    const readinessData = [];

    for (const subject of subjectRows) {
      const mastery = masteryBySubject.get(subject.id);

      const topicDetails = topicsBySubject.get(subject.id) || [];

      const weakTopics = topicDetails
        .filter((t: any) => t.mastery < 50)
        .map((t: any) => ({ id: t.id, name: t.name, mastery: Math.round(t.mastery) }));

      const strongTopics = topicDetails
        .filter((t: any) => t.mastery >= 70)
        .map((t: any) => ({ id: t.id, name: t.name, mastery: Math.round(t.mastery) }));

      readinessData.push({
        subjectId: subject.id,
        subjectName: subject.name,
        subjectIcon: subject.icon,
        readinessScore: Math.round(mastery?.avg_mastery || 0),
        topicsMastered: mastery?.mastered_topics || 0,
        topicsTotal: mastery?.total_topics || 0,
        weakTopics,
        strongTopics,
      });

      // Upsert exam readiness record
      await c.env.DB.prepare(`
        INSERT INTO exam_readiness (id, user_id, exam_type, subject_id, readiness_score, topics_mastered, topics_total, weak_topics, strong_topics, last_calculated)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(user_id, exam_type, subject_id) DO UPDATE SET
          readiness_score = excluded.readiness_score,
          topics_mastered = excluded.topics_mastered,
          topics_total = excluded.topics_total,
          weak_topics = excluded.weak_topics,
          strong_topics = excluded.strong_topics,
          last_calculated = datetime('now')
      `).bind(
        generateId(),
        user.userId,
        examType,
        subject.id,
        Math.round(mastery?.avg_mastery || 0),
        mastery?.mastered_topics || 0,
        mastery?.total_topics || 0,
        JSON.stringify(weakTopics.map((t: any) => t.id)),
        JSON.stringify(strongTopics.map((t: any) => t.id))
      ).run();
    }

    // Calculate overall readiness
    const overallReadiness = readinessData.length > 0
      ? Math.round(readinessData.reduce((sum, s) => sum + s.readinessScore, 0) / readinessData.length)
      : 0;

    return c.json({
      success: true,
      data: {
        examType,
        overallReadiness,
        subjects: readinessData,
      },
    });
  } catch (error) {
    console.error('Error calculating exam readiness:', error);
    return c.json({ success: false, error: 'Failed to calculate readiness' }, 500);
  }
});

// Get/create study plan
learningPathApp.get('/study-plan', async (c) => {
  try {
    const user = c.get('user');

    // Get active study plan
    const plan = await c.env.DB.prepare(`
      SELECT * FROM study_plans
      WHERE user_id = ? AND is_active = 1
      ORDER BY created_at DESC
      LIMIT 1
    `).bind(user.userId).first();

    if (plan) {
      return c.json({
        success: true,
        data: {
          id: plan.id,
          planType: plan.plan_type,
          startDate: plan.start_date,
          endDate: plan.end_date,
          items: JSON.parse(plan.items as string),
        },
      });
    }

    return c.json({
      success: true,
      data: null,
    });
  } catch (error) {
    console.error('Error fetching study plan:', error);
    return c.json({ success: false, error: 'Failed to fetch study plan' }, 500);
  }
});

// Generate a new study plan
learningPathApp.post('/study-plan/generate', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const { examType, daysPerWeek = 5, minutesPerDay = 60 } = body;

    // Get weak topics that need focus
    const weakTopics = await c.env.DB.prepare(`
      SELECT
        t.id,
        t.name,
        t.subject_id,
        s.name as subject_name,
        COALESCE(AVG(CASE WHEN qa.is_correct = 1 THEN 100 ELSE 0 END), 0) as mastery
      FROM topics t
      LEFT JOIN subjects s ON t.subject_id = s.id
      LEFT JOIN questions q ON q.topic_id = t.id
      LEFT JOIN question_attempts qa ON qa.question_id = q.id AND qa.user_id = ?
      GROUP BY t.id
      HAVING mastery < 70
      ORDER BY mastery ASC
      LIMIT 14
    `).bind(user.userId).all();

    // Generate study plan items
    const today = new Date();
    const startDate = today.toISOString().split('T')[0];
    const endDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const items = weakTopics.results.map((topic: any, index: number) => {
      const dayOffset = Math.floor(index / 2);
      const itemDate = new Date(today.getTime() + dayOffset * 24 * 60 * 60 * 1000);

      return {
        id: `item_${index}`,
        topicId: topic.id,
        topicName: topic.name,
        subjectId: topic.subject_id,
        subjectName: topic.subject_name,
        currentMastery: Math.round(topic.mastery),
        targetMastery: 80,
        estimatedTime: minutesPerDay / 2,
        scheduledDate: itemDate.toISOString().split('T')[0],
        completed: false,
      };
    });

    // Deactivate old plans
    await c.env.DB.prepare(
      'UPDATE study_plans SET is_active = 0 WHERE user_id = ?'
    ).bind(user.userId).run();

    // Create new plan
    const planId = generateId();
    await c.env.DB.prepare(`
      INSERT INTO study_plans (id, user_id, plan_type, start_date, end_date, items)
      VALUES (?, ?, 'weekly', ?, ?, ?)
    `).bind(planId, user.userId, startDate, endDate, JSON.stringify(items)).run();

    return c.json({
      success: true,
      data: {
        id: planId,
        planType: 'weekly',
        startDate,
        endDate,
        items,
      },
    });
  } catch (error) {
    console.error('Error generating study plan:', error);
    return c.json({ success: false, error: 'Failed to generate study plan' }, 500);
  }
});

// Update study plan item completion
learningPathApp.patch('/study-plan/:planId/item/:itemId', async (c) => {
  try {
    const user = c.get('user');
    const planId = c.req.param('planId');
    const itemId = c.req.param('itemId');
    const body = await c.req.json();

    const plan = await c.env.DB.prepare(
      'SELECT * FROM study_plans WHERE id = ? AND user_id = ?'
    ).bind(planId, user.userId).first();

    if (!plan) {
      return c.json({ success: false, error: 'Plan not found' }, 404);
    }

    const items = JSON.parse(plan.items as string);
    const itemIndex = items.findIndex((i: any) => i.id === itemId);

    if (itemIndex === -1) {
      return c.json({ success: false, error: 'Item not found' }, 404);
    }

    items[itemIndex] = { ...items[itemIndex], ...body };

    await c.env.DB.prepare(
      'UPDATE study_plans SET items = ?, updated_at = datetime(\'now\') WHERE id = ?'
    ).bind(JSON.stringify(items), planId).run();

    return c.json({
      success: true,
      data: { item: items[itemIndex] },
    });
  } catch (error) {
    console.error('Error updating study plan item:', error);
    return c.json({ success: false, error: 'Failed to update item' }, 500);
  }
});

// Get subject streaks
learningPathApp.get('/subject-streaks', async (c) => {
  try {
    const user = c.get('user');

    const streaks = await c.env.DB.prepare(`
      SELECT ss.*, s.name as subject_name, s.icon as subject_icon
      FROM subject_streaks ss
      JOIN subjects s ON ss.subject_id = s.id
      WHERE ss.user_id = ?
      ORDER BY ss.current_streak DESC
    `).bind(user.userId).all();

    return c.json({
      success: true,
      data: {
        streaks: streaks.results.map((s: any) => ({
          subjectId: s.subject_id,
          subjectName: s.subject_name,
          subjectIcon: s.subject_icon,
          currentStreak: s.current_streak,
          longestStreak: s.longest_streak,
          lastActivityDate: s.last_activity_date,
          totalDaysStudied: s.total_days_studied,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching subject streaks:', error);
    return c.json({ success: false, error: 'Failed to fetch streaks' }, 500);
  }
});

export { learningPathApp };
