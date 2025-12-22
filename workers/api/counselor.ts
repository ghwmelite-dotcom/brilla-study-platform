import { Hono } from 'hono';
import type { Context } from 'hono';

// Types for Cloudflare bindings
interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  ANTHROPIC_API_KEY?: string;
}

// Types
type CounselorType = 'academic' | 'career' | 'wellbeing' | 'general';
type MessageRole = 'user' | 'counselor' | 'system';
type Sentiment = 'positive' | 'neutral' | 'concerned' | 'urgent';
type ReportType = 'weekly_summary' | 'monthly_progress' | 'incident_report' | 'milestone_achievement' | 'intervention_needed';

interface StudentContext {
  name: string;
  gradeLevel?: string;
  schoolLevel?: string;
  subjects?: string[];
  recentPerformance?: {
    accuracy: number;
    trend: 'improving' | 'stable' | 'declining';
  };
  streakDays?: number;
  studyHoursThisWeek?: number;
  goals?: string[];
}

interface SuggestedResource {
  type: 'article' | 'video' | 'exercise' | 'professional';
  title: string;
  url?: string;
  description?: string;
}

// Counselor system prompts
const COUNSELOR_PROMPTS: Record<CounselorType, string> = {
  academic: `You are an empathetic and knowledgeable academic advisor for Brilla Study Platform, a Ghanaian educational app for JHS and SHS students preparing for BECE and WASSCE exams.

Your role is to:
- Help students with study strategies, time management, and exam preparation
- Provide subject-specific guidance and recommend study approaches
- Encourage consistent practice and celebrate academic improvements
- Address academic stress and help students set realistic goals
- Understand the Ghanaian curriculum and exam requirements

Guidelines:
- Be warm, encouraging, and culturally sensitive
- Use clear, simple language appropriate for secondary students
- Provide actionable advice students can implement immediately
- Reference the student's recent performance when giving personalized tips
- Suggest using platform features (practice quizzes, past papers, study groups)
- If a student expresses severe distress, gently recommend speaking with a trusted adult

Student Context:
{studentContext}`,

  career: `You are a career guidance counselor for Brilla Study Platform, helping Ghanaian JHS and SHS students explore future opportunities.

Your role is to:
- Help students discover careers aligned with their interests and strengths
- Explain pathways to various professions in Ghana and beyond
- Discuss university programs, polytechnics, and vocational training options
- Share information about scholarships and educational opportunities
- Connect academic subjects to real-world career applications

Guidelines:
- Be inspiring while remaining realistic about requirements and challenges
- Highlight diverse career paths including STEM, arts, trades, and entrepreneurship
- Discuss both local and international opportunities
- Encourage students to develop skills alongside academic performance
- Provide specific, actionable next steps for career exploration
- Consider the Ghanaian job market and emerging industries

Student Context:
{studentContext}`,

  wellbeing: `You are a supportive wellness counselor for Brilla Study Platform, focused on the mental health and emotional wellbeing of Ghanaian secondary school students.

Your role is to:
- Provide a safe, non-judgmental space for students to express concerns
- Help students manage academic stress, peer pressure, and exam anxiety
- Teach coping strategies, mindfulness, and emotional regulation
- Encourage healthy study-life balance and self-care practices
- Identify signs of distress and recommend appropriate support

Guidelines:
- Be warm, patient, and deeply empathetic
- Normalize struggles while offering hope and practical solutions
- Use culturally appropriate language and examples
- For serious concerns (self-harm, abuse, severe depression), always recommend speaking with a trusted adult, school counselor, or professional help
- Never diagnose or provide medical/psychological treatment
- Focus on building resilience and positive coping skills

IMPORTANT: If a student mentions self-harm, abuse, or thoughts of hurting themselves or others, immediately and compassionately encourage them to speak with a trusted adult and provide information about support resources.

Student Context:
{studentContext}`,

  general: `You are a friendly school counselor for Brilla Study Platform, ready to help Ghanaian secondary school students with any questions or concerns.

Your role is to:
- Be a supportive first point of contact for student concerns
- Help students navigate academic, social, and personal challenges
- Direct students to specialized support (academic advisor, career counselor, etc.) when appropriate
- Celebrate student achievements and encourage continued growth
- Foster a positive relationship with learning

Guidelines:
- Be approachable, friendly, and patient
- Listen actively and respond with understanding
- Ask clarifying questions to better understand student needs
- Provide balanced advice considering multiple perspectives
- Use encouraging language that builds confidence
- Know when to recommend speaking with teachers, parents, or professionals

Student Context:
{studentContext}`,
};

// Counselor routes
const counselorApp = new Hono<{ Bindings: Env }>();

// Helper functions
function getUserId(c: Context): string | undefined {
  return c.get('userId') || c.req.header('x-user-id');
}

function getUserRole(c: Context): string | undefined {
  return c.get('userRole') || c.req.header('x-user-role');
}

// Call Claude API for counselor response
async function getCounselorResponse(
  env: Env,
  message: string,
  conversationHistory: Array<{ role: MessageRole; content: string }>,
  studentContext: StudentContext,
  counselorType: CounselorType
): Promise<{ content: string; sentiment: Sentiment; thinking?: string; resources?: SuggestedResource[] }> {
  const apiKey = env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  // Build system prompt with student context
  const contextString = `
Name: ${studentContext.name}
Grade: ${studentContext.gradeLevel || 'Not specified'}
School Level: ${studentContext.schoolLevel || 'Not specified'}
Subjects: ${studentContext.subjects?.join(', ') || 'Not specified'}
Recent Performance: ${studentContext.recentPerformance ? `${studentContext.recentPerformance.accuracy}% accuracy, ${studentContext.recentPerformance.trend}` : 'No recent data'}
Current Streak: ${studentContext.streakDays ?? 0} days
Study Hours This Week: ${studentContext.studyHoursThisWeek ?? 0} hours
Goals: ${studentContext.goals?.join(', ') || 'No goals set'}`;

  const systemPrompt = COUNSELOR_PROMPTS[counselorType].replace('{studentContext}', contextString);

  // Build messages for Claude
  const messages = conversationHistory.map(msg => ({
    role: msg.role === 'counselor' ? 'assistant' as const : 'user' as const,
    content: msg.content,
  }));

  messages.push({ role: 'user', content: message });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', errorText);
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json() as {
      content: Array<{ type: string; text?: string }>;
    };

    const content = data.content[0]?.type === 'text' ? data.content[0].text || '' : '';

    // Analyze sentiment based on content
    const sentiment = analyzeSentiment(message, content);

    // Extract any resource suggestions
    const resources = extractResources(content, counselorType);

    return { content, sentiment, resources };
  } catch (error) {
    console.error('Error calling Claude API:', error);
    throw error;
  }
}

// Analyze sentiment from conversation
function analyzeSentiment(userMessage: string, _response: string): Sentiment {
  const lowerMessage = userMessage.toLowerCase();

  // Check for urgent/concerning keywords
  const urgentKeywords = ['hurt myself', 'suicide', 'kill', 'abuse', 'danger', 'scared', 'helpless', 'hopeless'];
  const concernedKeywords = ['stressed', 'anxious', 'worried', 'failing', 'struggling', 'overwhelmed', 'depressed', 'sad'];
  const positiveKeywords = ['happy', 'excited', 'proud', 'achieved', 'improved', 'confident', 'great'];

  if (urgentKeywords.some(kw => lowerMessage.includes(kw))) {
    return 'urgent';
  }
  if (concernedKeywords.some(kw => lowerMessage.includes(kw))) {
    return 'concerned';
  }
  if (positiveKeywords.some(kw => lowerMessage.includes(kw))) {
    return 'positive';
  }

  return 'neutral';
}

// Extract resource suggestions from response
function extractResources(content: string, _counselorType: CounselorType): SuggestedResource[] {
  const resources: SuggestedResource[] = [];

  // Simple pattern matching for resource mentions
  if (content.toLowerCase().includes('practice quiz') || content.toLowerCase().includes('take a quiz')) {
    resources.push({
      type: 'exercise',
      title: 'Practice Quiz',
      description: 'Test your knowledge with practice questions',
      url: '/practice',
    });
  }

  if (content.toLowerCase().includes('past paper') || content.toLowerCase().includes('exam paper')) {
    resources.push({
      type: 'exercise',
      title: 'Past Papers',
      description: 'Practice with actual BECE/WASSCE questions',
      url: '/past-papers',
    });
  }

  if (content.toLowerCase().includes('breathing') || content.toLowerCase().includes('relax')) {
    resources.push({
      type: 'exercise',
      title: 'Relaxation Exercises',
      description: 'Simple breathing and mindfulness exercises',
    });
  }

  return resources;
}

// =============================================
// CONVERSATION ROUTES
// =============================================

// Get user's conversations
counselorApp.get('/conversations', async (c) => {
  try {
    const userId = getUserId(c);

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    const conversations = await c.env.DB.prepare(`
      SELECT
        id, counselor_type, title, status, message_count, last_message_at, created_at
      FROM counselor_conversations
      WHERE user_id = ? AND status != 'archived'
      ORDER BY last_message_at DESC NULLS LAST, created_at DESC
      LIMIT 50
    `).bind(userId).all();

    return c.json({
      success: true,
      data: conversations.results.map((conv: Record<string, unknown>) => ({
        id: conv.id,
        counselorType: conv.counselor_type,
        title: conv.title,
        status: conv.status,
        messageCount: conv.message_count,
        lastMessageAt: conv.last_message_at,
        createdAt: conv.created_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return c.json({ success: false, error: 'Failed to fetch conversations' }, 500);
  }
});

// Start a new conversation
counselorApp.post('/conversations', async (c) => {
  try {
    const userId = getUserId(c);

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    const body = await c.req.json();
    const { counselorType = 'general', title } = body;

    const conversationId = `conv_${Date.now()}`;

    await c.env.DB.prepare(`
      INSERT INTO counselor_conversations (id, user_id, counselor_type, title, status, message_count, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'active', 0, datetime('now'), datetime('now'))
    `).bind(conversationId, userId, counselorType, title || null).run();

    // Add welcome message based on counselor type
    const welcomeMessages: Record<CounselorType, string> = {
      academic: "Hello! I'm your academic advisor. I'm here to help you with study strategies, exam preparation, and achieving your academic goals. What would you like to work on today?",
      career: "Hi there! I'm your career guidance counselor. I'm here to help you explore career paths, understand educational opportunities, and plan for your future. What career interests would you like to discuss?",
      wellbeing: "Hello, I'm glad you're here. I'm your wellness counselor, and I'm here to support you through any challenges you might be facing. This is a safe space to share. How are you feeling today?",
      general: "Hi! I'm your school counselor and I'm here to help with anything on your mind - whether it's academics, career questions, personal challenges, or just needing someone to talk to. What brings you here today?",
    };

    const welcomeMessageId = `msg_${Date.now()}`;

    await c.env.DB.prepare(`
      INSERT INTO counselor_messages (id, conversation_id, role, content, sentiment, created_at)
      VALUES (?, ?, 'counselor', ?, 'positive', datetime('now'))
    `).bind(welcomeMessageId, conversationId, welcomeMessages[counselorType as CounselorType]).run();

    await c.env.DB.prepare(`
      UPDATE counselor_conversations
      SET message_count = 1, last_message_at = datetime('now')
      WHERE id = ?
    `).bind(conversationId).run();

    return c.json({
      success: true,
      data: {
        id: conversationId,
        counselorType,
        title,
        status: 'active',
        messageCount: 1,
        welcomeMessage: {
          id: welcomeMessageId,
          role: 'counselor',
          content: welcomeMessages[counselorType as CounselorType],
          sentiment: 'positive',
        },
      },
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return c.json({ success: false, error: 'Failed to create conversation' }, 500);
  }
});

// Get conversation with messages
counselorApp.get('/conversations/:id', async (c) => {
  try {
    const conversationId = c.req.param('id');
    const userId = getUserId(c);

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    const conversation = await c.env.DB.prepare(`
      SELECT * FROM counselor_conversations
      WHERE id = ? AND user_id = ?
    `).bind(conversationId, userId).first();

    if (!conversation) {
      return c.json({ success: false, error: 'Conversation not found' }, 404);
    }

    const messages = await c.env.DB.prepare(`
      SELECT id, role, content, thinking, sentiment, suggested_resources, created_at
      FROM counselor_messages
      WHERE conversation_id = ?
      ORDER BY created_at ASC
    `).bind(conversationId).all();

    return c.json({
      success: true,
      data: {
        id: conversation.id,
        counselorType: conversation.counselor_type,
        title: conversation.title,
        status: conversation.status,
        messageCount: conversation.message_count,
        lastMessageAt: conversation.last_message_at,
        createdAt: conversation.created_at,
        messages: messages.results.map((msg: Record<string, unknown>) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          thinking: msg.thinking,
          sentiment: msg.sentiment,
          suggestedResources: msg.suggested_resources ? JSON.parse(msg.suggested_resources as string) : null,
          createdAt: msg.created_at,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return c.json({ success: false, error: 'Failed to fetch conversation' }, 500);
  }
});

// Archive a conversation
counselorApp.delete('/conversations/:id', async (c) => {
  try {
    const conversationId = c.req.param('id');
    const userId = getUserId(c);

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    await c.env.DB.prepare(`
      UPDATE counselor_conversations
      SET status = 'archived', updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `).bind(conversationId, userId).run();

    return c.json({ success: true, message: 'Conversation archived' });
  } catch (error) {
    console.error('Error archiving conversation:', error);
    return c.json({ success: false, error: 'Failed to archive conversation' }, 500);
  }
});

// =============================================
// CHAT ROUTES
// =============================================

// Send a message and get AI response
counselorApp.post('/chat', async (c) => {
  try {
    const userId = getUserId(c);

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    const body = await c.req.json();
    const { conversationId, message } = body;

    if (!message?.trim()) {
      return c.json({ success: false, error: 'Message is required' }, 400);
    }

    // Get or create conversation
    let conversation;
    let isNewConversation = false;

    if (conversationId) {
      conversation = await c.env.DB.prepare(`
        SELECT * FROM counselor_conversations WHERE id = ? AND user_id = ?
      `).bind(conversationId, userId).first();

      if (!conversation) {
        return c.json({ success: false, error: 'Conversation not found' }, 404);
      }
    } else {
      // Create new conversation
      const newConversationId = `conv_${Date.now()}`;
      await c.env.DB.prepare(`
        INSERT INTO counselor_conversations (id, user_id, counselor_type, status, message_count, created_at, updated_at)
        VALUES (?, ?, 'general', 'active', 0, datetime('now'), datetime('now'))
      `).bind(newConversationId, userId).run();

      conversation = {
        id: newConversationId,
        counselor_type: 'general',
        user_id: userId,
      };
      isNewConversation = true;
    }

    // Get student context
    const student = await c.env.DB.prepare(`
      SELECT name, school_level, year_group FROM users WHERE id = ?
    `).bind(userId).first();

    // Get recent performance
    const recentProgress = await c.env.DB.prepare(`
      SELECT
        AVG(CASE WHEN is_correct = 1 THEN 100 ELSE 0 END) as accuracy,
        COUNT(*) as attempts
      FROM question_attempts
      WHERE user_id = ? AND created_at >= datetime('now', '-7 days')
    `).bind(userId).first();

    // Get streak info
    const streakInfo = await c.env.DB.prepare(`
      SELECT current_streak FROM user_streaks WHERE user_id = ?
    `).bind(userId).first();

    const studentContext: StudentContext = {
      name: student?.name as string || 'Student',
      schoolLevel: student?.school_level as string,
      gradeLevel: student?.year_group ? `Year ${student.year_group}` : undefined,
      recentPerformance: recentProgress?.attempts ? {
        accuracy: Math.round(recentProgress.accuracy as number),
        trend: 'stable', // Could be calculated from historical data
      } : undefined,
      streakDays: streakInfo?.current_streak as number || 0,
    };

    // Get conversation history (last 10 messages for context)
    const historyResults = await c.env.DB.prepare(`
      SELECT role, content FROM counselor_messages
      WHERE conversation_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `).bind(conversation.id).all();

    const conversationHistory = historyResults.results.reverse().map((msg: Record<string, unknown>) => ({
      role: msg.role as MessageRole,
      content: msg.content as string,
    }));

    // Save user message
    const userMessageId = `msg_${Date.now()}_user`;
    await c.env.DB.prepare(`
      INSERT INTO counselor_messages (id, conversation_id, role, content, created_at)
      VALUES (?, ?, 'user', ?, datetime('now'))
    `).bind(userMessageId, conversation.id, message.trim()).run();

    // Get AI response
    let aiResponse;
    try {
      aiResponse = await getCounselorResponse(
        c.env,
        message.trim(),
        conversationHistory,
        studentContext,
        conversation.counselor_type as CounselorType
      );
    } catch (error) {
      console.error('AI response error:', error);
      // Fallback response
      aiResponse = {
        content: "I'm sorry, I'm having trouble responding right now. Please try again in a moment, or if this continues, let a teacher or parent know.",
        sentiment: 'neutral' as Sentiment,
      };
    }

    // Save counselor response
    const counselorMessageId = `msg_${Date.now()}_counselor`;
    await c.env.DB.prepare(`
      INSERT INTO counselor_messages (id, conversation_id, role, content, sentiment, suggested_resources, created_at)
      VALUES (?, ?, 'counselor', ?, ?, ?, datetime('now'))
    `).bind(
      counselorMessageId,
      conversation.id,
      aiResponse.content,
      aiResponse.sentiment,
      aiResponse.resources?.length ? JSON.stringify(aiResponse.resources) : null
    ).run();

    // Update conversation
    const newTitle = isNewConversation ? message.trim().substring(0, 50) + (message.length > 50 ? '...' : '') : null;

    await c.env.DB.prepare(`
      UPDATE counselor_conversations
      SET
        message_count = message_count + 2,
        last_message_at = datetime('now'),
        title = COALESCE(?, title),
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(newTitle, conversation.id).run();

    // Flag conversation if sentiment is urgent
    if (aiResponse.sentiment === 'urgent') {
      await c.env.DB.prepare(`
        UPDATE counselor_conversations SET status = 'flagged' WHERE id = ?
      `).bind(conversation.id).run();

      // Create wellbeing alert
      await c.env.DB.prepare(`
        INSERT INTO wellbeing_alerts (id, student_id, alert_type, severity, title, description, trigger_source, created_at)
        VALUES (?, ?, 'emotional_concern', 'high', 'Urgent Support Needed', ?, 'counselor_chat', datetime('now'))
      `).bind(
        `alert_${Date.now()}`,
        userId,
        `Student expressed concerning thoughts during counselor session. Immediate attention recommended.`
      ).run();
    }

    return c.json({
      success: true,
      data: {
        conversationId: conversation.id,
        userMessage: {
          id: userMessageId,
          role: 'user',
          content: message.trim(),
        },
        counselorMessage: {
          id: counselorMessageId,
          role: 'counselor',
          content: aiResponse.content,
          sentiment: aiResponse.sentiment,
          suggestedResources: aiResponse.resources,
        },
      },
    });
  } catch (error) {
    console.error('Error in chat:', error);
    return c.json({ success: false, error: 'Failed to send message' }, 500);
  }
});

// Rate message helpfulness
counselorApp.post('/messages/:id/feedback', async (c) => {
  try {
    const messageId = c.req.param('id');
    const userId = getUserId(c);

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    const body = await c.req.json();
    const { rating, feedbackType, comment } = body;

    await c.env.DB.prepare(`
      INSERT INTO counselor_feedback (id, message_id, user_id, rating, feedback_type, comment, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      `fb_${Date.now()}`,
      messageId,
      userId,
      rating || null,
      feedbackType || null,
      comment || null
    ).run();

    return c.json({ success: true, message: 'Feedback submitted' });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return c.json({ success: false, error: 'Failed to submit feedback' }, 500);
  }
});

// =============================================
// WELLBEING ROUTES
// =============================================

// Log daily wellbeing check-in
counselorApp.post('/wellbeing/log', async (c) => {
  try {
    const userId = getUserId(c);

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    const body = await c.req.json();
    const { stressLevel, studySatisfaction, energyLevel, mood, notes } = body;

    const today = new Date().toISOString().split('T')[0];

    await c.env.DB.prepare(`
      INSERT INTO wellbeing_logs (id, user_id, log_date, stress_level, study_satisfaction, energy_level, mood, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(user_id, log_date) DO UPDATE SET
        stress_level = excluded.stress_level,
        study_satisfaction = excluded.study_satisfaction,
        energy_level = excluded.energy_level,
        mood = excluded.mood,
        notes = excluded.notes
    `).bind(
      `well_${Date.now()}`,
      userId,
      today,
      stressLevel || null,
      studySatisfaction || null,
      energyLevel || null,
      mood || null,
      notes || null
    ).run();

    // Check if stress is high and create alert
    if (stressLevel && stressLevel >= 4) {
      try {
        await c.env.DB.prepare(`
          INSERT INTO wellbeing_alerts (id, student_id, alert_type, severity, title, description, trigger_source, created_at)
          VALUES (?, ?, 'stress_indicator', ?, 'High Stress Level Reported', ?, 'wellbeing_checkin', datetime('now'))
        `).bind(
          `alert_${Date.now()}`,
          userId,
          stressLevel === 5 ? 'high' : 'medium',
          `Student reported stress level ${stressLevel}/5 during daily check-in.${notes ? ` Note: ${notes}` : ''}`
        ).run();
      } catch (alertError) {
        // Don't fail the whole operation if alert creation fails
        console.error('Failed to create wellbeing alert:', alertError);
      }
    }

    return c.json({ success: true, message: 'Wellbeing logged' });
  } catch (error) {
    console.error('Error logging wellbeing:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    // Check if it's a foreign key constraint error
    if (errorMessage.includes('FOREIGN KEY') || errorMessage.includes('SQLITE_CONSTRAINT')) {
      return c.json({ success: false, error: 'User not found. Please log in again.' }, 400);
    }
    return c.json({ success: false, error: `Failed to log wellbeing: ${errorMessage}` }, 500);
  }
});

// Get wellbeing history
counselorApp.get('/wellbeing/history', async (c) => {
  try {
    const userId = getUserId(c);

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    const days = parseInt(c.req.query('days') || '30');

    const logs = await c.env.DB.prepare(`
      SELECT log_date, stress_level, study_satisfaction, energy_level, mood, notes
      FROM wellbeing_logs
      WHERE user_id = ? AND log_date >= date('now', '-' || ? || ' days')
      ORDER BY log_date DESC
    `).bind(userId, days).all();

    return c.json({
      success: true,
      data: logs.results.map((log: Record<string, unknown>) => ({
        logDate: log.log_date,
        stressLevel: log.stress_level,
        studySatisfaction: log.study_satisfaction,
        energyLevel: log.energy_level,
        mood: log.mood,
        notes: log.notes,
      })),
    });
  } catch (error) {
    console.error('Error fetching wellbeing history:', error);
    return c.json({ success: false, error: 'Failed to fetch history' }, 500);
  }
});

// =============================================
// REPORT GENERATION ROUTES
// =============================================

// Generate counselor report for a student (counselor/admin only)
counselorApp.post('/reports/generate', async (c) => {
  try {
    const userId = getUserId(c);
    const userRole = getUserRole(c);

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    if (!['admin', 'teacher'].includes(userRole as string)) {
      return c.json({ success: false, error: 'Permission denied' }, 403);
    }

    const body = await c.req.json();
    const { studentId, reportType, dateRangeStart, dateRangeEnd } = body;

    if (!studentId) {
      return c.json({ success: false, error: 'Student ID is required' }, 400);
    }

    // Get student info
    const student = await c.env.DB.prepare(`
      SELECT id, name, email, school_level, year_group FROM users WHERE id = ? AND role = 'student'
    `).bind(studentId).first();

    if (!student) {
      return c.json({ success: false, error: 'Student not found' }, 404);
    }

    // Gather student data for report
    const startDate = dateRangeStart || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = dateRangeEnd || new Date().toISOString().split('T')[0];

    // Academic performance
    const performance = await c.env.DB.prepare(`
      SELECT
        COUNT(*) as total_attempts,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct,
        AVG(CASE WHEN is_correct = 1 THEN 100.0 ELSE 0 END) as accuracy
      FROM question_attempts
      WHERE user_id = ? AND DATE(created_at) BETWEEN ? AND ?
    `).bind(studentId, startDate, endDate).first();

    // Wellbeing logs
    const wellbeingLogs = await c.env.DB.prepare(`
      SELECT AVG(stress_level) as avg_stress, AVG(study_satisfaction) as avg_satisfaction
      FROM wellbeing_logs
      WHERE user_id = ? AND log_date BETWEEN ? AND ?
    `).bind(studentId, startDate, endDate).first();

    // Counselor sessions
    const sessions = await c.env.DB.prepare(`
      SELECT
        COUNT(DISTINCT cc.id) as session_count,
        SUM(cc.message_count) as total_messages,
        GROUP_CONCAT(DISTINCT cc.counselor_type) as counselor_types
      FROM counselor_conversations cc
      WHERE cc.user_id = ? AND DATE(cc.created_at) BETWEEN ? AND ?
    `).bind(studentId, startDate, endDate).first();

    // Streak info
    const streak = await c.env.DB.prepare(`
      SELECT current_streak, longest_streak FROM user_streaks WHERE user_id = ?
    `).bind(studentId).first();

    // Generate report content using Claude
    const reportContent = await generateReportWithClaude(c.env, {
      studentName: student.name as string,
      schoolLevel: student.school_level as string,
      yearGroup: student.year_group as number,
      dateRange: { start: startDate, end: endDate },
      performance: {
        totalAttempts: (performance?.total_attempts as number) || 0,
        accuracy: Math.round((performance?.accuracy as number) || 0),
      },
      wellbeing: {
        avgStress: wellbeingLogs?.avg_stress as number,
        avgSatisfaction: wellbeingLogs?.avg_satisfaction as number,
      },
      sessions: {
        count: (sessions?.session_count as number) || 0,
        types: (sessions?.counselor_types as string)?.split(',') || [],
      },
      streak: {
        current: (streak?.current_streak as number) || 0,
        longest: (streak?.longest_streak as number) || 0,
      },
    });

    // Create report record
    const reportId = `report_${Date.now()}`;

    await c.env.DB.prepare(`
      INSERT INTO counselor_reports (
        id, student_id, counselor_id, report_type, summary, academic_performance,
        wellbeing_assessment, key_insights, recommendations, goals,
        concern_level, date_range_start, date_range_end, is_read_by_parent,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, datetime('now'), datetime('now'))
    `).bind(
      reportId,
      studentId,
      userId,
      reportType || 'weekly_summary',
      reportContent.summary,
      JSON.stringify(reportContent.academicPerformance),
      JSON.stringify(reportContent.wellbeingAssessment),
      JSON.stringify(reportContent.keyInsights),
      JSON.stringify(reportContent.recommendations),
      JSON.stringify(reportContent.goals),
      reportContent.concernLevel,
      startDate,
      endDate
    ).run();

    return c.json({
      success: true,
      data: {
        id: reportId,
        ...reportContent,
      },
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return c.json({ success: false, error: 'Failed to generate report' }, 500);
  }
});

// Helper function to generate report content with Claude
async function generateReportWithClaude(
  env: Env,
  data: {
    studentName: string;
    schoolLevel: string;
    yearGroup: number;
    dateRange: { start: string; end: string };
    performance: { totalAttempts: number; accuracy: number };
    wellbeing: { avgStress: number | null; avgSatisfaction: number | null };
    sessions: { count: number; types: string[] };
    streak: { current: number; longest: number };
  }
) {
  const apiKey = env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    // Return a template report if no API key
    return generateTemplateReport(data);
  }

  const prompt = `Generate a comprehensive counselor report for a student. Use the data provided to create insightful observations and recommendations.

Student: ${data.studentName}
School Level: ${data.schoolLevel || 'Not specified'}
Year Group: ${data.yearGroup || 'Not specified'}
Report Period: ${data.dateRange.start} to ${data.dateRange.end}

Academic Data:
- Total practice attempts: ${data.performance.totalAttempts}
- Average accuracy: ${data.performance.accuracy}%
- Current study streak: ${data.streak.current} days
- Longest streak: ${data.streak.longest} days

Wellbeing Data:
- Average stress level: ${data.wellbeing.avgStress ?? 'No data'}/5
- Average study satisfaction: ${data.wellbeing.avgSatisfaction ?? 'No data'}/5
- Counselor sessions this period: ${data.sessions.count}
- Session types: ${data.sessions.types.join(', ') || 'None'}

Please provide a JSON response with the following structure:
{
  "summary": "A 2-3 sentence overall summary",
  "academicPerformance": {
    "overallScore": <number 0-100>,
    "strengths": ["strength1", "strength2"],
    "areasForImprovement": ["area1", "area2"],
    "subjectBreakdown": [{"subject": "Overall", "score": <number>, "trend": "improving|stable|declining"}]
  },
  "wellbeingAssessment": {
    "overallMood": "positive|neutral|concerned",
    "stressLevel": "low|moderate|high",
    "engagementLevel": "high|medium|low",
    "socialInteraction": "active|moderate|limited"
  },
  "keyInsights": ["insight1", "insight2", "insight3"],
  "recommendations": [
    {"category": "academic|wellbeing|engagement", "priority": "high|medium|low", "recommendation": "text", "actionItems": ["action1", "action2"]}
  ],
  "goals": [
    {"goal": "text", "targetDate": "${new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]}", "status": "suggested", "milestones": ["milestone1"]}
  ],
  "concernLevel": "none|low|moderate|high"
}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      console.error('Claude API error for report generation');
      return generateTemplateReport(data);
    }

    const result = await response.json() as {
      content: Array<{ type: string; text?: string }>;
    };

    const content = result.content[0]?.type === 'text' ? result.content[0].text || '' : '';

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return generateTemplateReport(data);
  } catch (error) {
    console.error('Error generating report with Claude:', error);
    return generateTemplateReport(data);
  }
}

// Template report generator (fallback)
function generateTemplateReport(data: {
  studentName: string;
  schoolLevel: string;
  yearGroup: number;
  dateRange: { start: string; end: string };
  performance: { totalAttempts: number; accuracy: number };
  wellbeing: { avgStress: number | null; avgSatisfaction: number | null };
  sessions: { count: number; types: string[] };
  streak: { current: number; longest: number };
}) {
  const accuracy = data.performance.accuracy;
  const attempts = data.performance.totalAttempts;
  const streak = data.streak.current;

  let concernLevel = 'none';
  if (data.wellbeing.avgStress && data.wellbeing.avgStress >= 4) concernLevel = 'moderate';
  if (accuracy < 50 && attempts > 10) concernLevel = 'low';

  return {
    summary: `${data.studentName} completed ${attempts} practice questions with ${accuracy}% accuracy during this period. ${streak > 0 ? `They maintained a ${streak}-day study streak.` : 'Consistent study habits could be improved.'}`,
    academicPerformance: {
      overallScore: accuracy,
      strengths: accuracy >= 70 ? ['Consistent practice', 'Good accuracy'] : ['Willing to practice'],
      areasForImprovement: accuracy < 70 ? ['Improve accuracy', 'Review difficult topics'] : ['Challenge with harder questions'],
      subjectBreakdown: [{ subject: 'Overall', score: accuracy, trend: 'stable' }],
    },
    wellbeingAssessment: {
      overallMood: data.wellbeing.avgSatisfaction && data.wellbeing.avgSatisfaction >= 3 ? 'positive' : 'neutral',
      stressLevel: data.wellbeing.avgStress && data.wellbeing.avgStress >= 4 ? 'high' : data.wellbeing.avgStress && data.wellbeing.avgStress >= 2 ? 'moderate' : 'low',
      engagementLevel: attempts >= 50 ? 'high' : attempts >= 20 ? 'medium' : 'low',
      socialInteraction: 'moderate',
    },
    keyInsights: [
      `Completed ${attempts} practice questions this period`,
      `Accuracy rate of ${accuracy}%`,
      streak > 0 ? `Maintained ${streak}-day study streak` : 'Study streak could be improved',
    ],
    recommendations: [
      {
        category: 'academic',
        priority: accuracy < 60 ? 'high' : 'medium',
        recommendation: accuracy < 60 ? 'Focus on reviewing fundamental concepts' : 'Continue current study pace',
        actionItems: ['Review past mistakes', 'Practice daily'],
      },
    ],
    goals: [
      {
        goal: accuracy < 70 ? 'Achieve 70% accuracy' : 'Maintain high performance',
        targetDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
        status: 'suggested',
        milestones: ['Complete 50 practice questions', 'Review weak topics'],
      },
    ],
    concernLevel,
  };
}

// Get reports for a student (parent/counselor/admin)
counselorApp.get('/reports', async (c) => {
  try {
    const userId = getUserId(c);
    const userRole = getUserRole(c);

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    let studentIds: string[] = [];

    if (userRole === 'parent') {
      // Get linked students
      const links = await c.env.DB.prepare(`
        SELECT student_id FROM student_parent_links WHERE parent_id = ? AND status = 'active'
      `).bind(userId).all();
      studentIds = links.results.map((l: Record<string, unknown>) => l.student_id as string);
    } else if (userRole === 'student') {
      studentIds = [userId];
    } else if (['admin', 'teacher'].includes(userRole as string)) {
      // Can view all reports
      const studentId = c.req.query('studentId');
      if (studentId) {
        studentIds = [studentId];
      }
    }

    if (studentIds.length === 0 && !['admin', 'teacher'].includes(userRole as string)) {
      return c.json({ success: true, data: [] });
    }

    let query = `
      SELECT
        cr.*,
        u.name as student_name,
        c.name as counselor_name
      FROM counselor_reports cr
      LEFT JOIN users u ON cr.student_id = u.id
      LEFT JOIN users c ON cr.counselor_id = c.id
    `;

    if (studentIds.length > 0) {
      query += ` WHERE cr.student_id IN (${studentIds.map(() => '?').join(',')})`;
    }

    query += ` ORDER BY cr.created_at DESC LIMIT 50`;

    const reports = studentIds.length > 0
      ? await c.env.DB.prepare(query).bind(...studentIds).all()
      : await c.env.DB.prepare(query).all();

    return c.json({
      success: true,
      data: reports.results.map((r: Record<string, unknown>) => ({
        id: r.id,
        studentId: r.student_id,
        studentName: r.student_name,
        counselorId: r.counselor_id,
        counselorName: r.counselor_name,
        reportType: r.report_type,
        summary: r.summary,
        concernLevel: r.concern_level,
        isReadByParent: !!r.is_read_by_parent,
        dateRangeStart: r.date_range_start,
        dateRangeEnd: r.date_range_end,
        createdAt: r.created_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return c.json({ success: false, error: 'Failed to fetch reports' }, 500);
  }
});

// Get single report
counselorApp.get('/reports/:id', async (c) => {
  try {
    const reportId = c.req.param('id');
    const userId = getUserId(c);
    const userRole = getUserRole(c);

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    const report = await c.env.DB.prepare(`
      SELECT
        cr.*,
        u.name as student_name,
        c.name as counselor_name
      FROM counselor_reports cr
      LEFT JOIN users u ON cr.student_id = u.id
      LEFT JOIN users c ON cr.counselor_id = c.id
      WHERE cr.id = ?
    `).bind(reportId).first();

    if (!report) {
      return c.json({ success: false, error: 'Report not found' }, 404);
    }

    // Verify access
    if (userRole === 'parent') {
      const hasAccess = await c.env.DB.prepare(`
        SELECT 1 FROM student_parent_links
        WHERE parent_id = ? AND student_id = ? AND status = 'active'
      `).bind(userId, report.student_id).first();

      if (!hasAccess) {
        return c.json({ success: false, error: 'Access denied' }, 403);
      }
    } else if (userRole === 'student' && report.student_id !== userId) {
      return c.json({ success: false, error: 'Access denied' }, 403);
    }

    return c.json({
      success: true,
      data: {
        id: report.id,
        studentId: report.student_id,
        studentName: report.student_name,
        counselorId: report.counselor_id,
        counselorName: report.counselor_name,
        reportType: report.report_type,
        summary: report.summary,
        academicPerformance: report.academic_performance ? JSON.parse(report.academic_performance as string) : null,
        wellbeingAssessment: report.wellbeing_assessment ? JSON.parse(report.wellbeing_assessment as string) : null,
        keyInsights: report.key_insights ? JSON.parse(report.key_insights as string) : [],
        recommendations: report.recommendations ? JSON.parse(report.recommendations as string) : [],
        goals: report.goals ? JSON.parse(report.goals as string) : [],
        concernLevel: report.concern_level,
        parentFeedback: report.parent_feedback,
        isReadByParent: !!report.is_read_by_parent,
        readAt: report.read_at,
        dateRangeStart: report.date_range_start,
        dateRangeEnd: report.date_range_end,
        createdAt: report.created_at,
      },
    });
  } catch (error) {
    console.error('Error fetching report:', error);
    return c.json({ success: false, error: 'Failed to fetch report' }, 500);
  }
});

// Mark report as read (parent)
counselorApp.post('/reports/:id/read', async (c) => {
  try {
    const reportId = c.req.param('id');
    const userId = getUserId(c);

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    await c.env.DB.prepare(`
      UPDATE counselor_reports
      SET is_read_by_parent = 1, read_at = datetime('now')
      WHERE id = ?
    `).bind(reportId).run();

    // Log access
    await c.env.DB.prepare(`
      INSERT INTO report_access_logs (id, report_id, accessed_by, action, accessed_at)
      VALUES (?, ?, ?, 'read', datetime('now'))
    `).bind(`log_${Date.now()}`, reportId, userId).run();

    return c.json({ success: true, message: 'Report marked as read' });
  } catch (error) {
    console.error('Error marking report as read:', error);
    return c.json({ success: false, error: 'Failed to update report' }, 500);
  }
});

// Submit parent feedback on report
counselorApp.post('/reports/:id/feedback', async (c) => {
  try {
    const reportId = c.req.param('id');
    const userId = getUserId(c);

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    const body = await c.req.json();
    const { feedback } = body;

    if (!feedback?.trim()) {
      return c.json({ success: false, error: 'Feedback is required' }, 400);
    }

    await c.env.DB.prepare(`
      UPDATE counselor_reports
      SET parent_feedback = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(feedback.trim(), reportId).run();

    return c.json({ success: true, message: 'Feedback submitted' });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return c.json({ success: false, error: 'Failed to submit feedback' }, 500);
  }
});

// =============================================
// ALERTS ROUTES (for parents/counselors)
// =============================================

// Get wellbeing alerts
counselorApp.get('/alerts', async (c) => {
  try {
    const userId = getUserId(c);
    const userRole = getUserRole(c);

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    let studentIds: string[] = [];

    if (userRole === 'parent') {
      const links = await c.env.DB.prepare(`
        SELECT student_id FROM student_parent_links WHERE parent_id = ? AND status = 'active'
      `).bind(userId).all();
      studentIds = links.results.map((l: Record<string, unknown>) => l.student_id as string);

      if (studentIds.length === 0) {
        return c.json({ success: true, data: [] });
      }
    }

    let query = `
      SELECT
        wa.*,
        u.name as student_name
      FROM wellbeing_alerts wa
      JOIN users u ON wa.student_id = u.id
    `;

    if (studentIds.length > 0) {
      query += ` WHERE wa.student_id IN (${studentIds.map(() => '?').join(',')})`;
    }

    query += ` ORDER BY wa.created_at DESC LIMIT 50`;

    const alerts = studentIds.length > 0
      ? await c.env.DB.prepare(query).bind(...studentIds).all()
      : await c.env.DB.prepare(query).all();

    return c.json({
      success: true,
      data: alerts.results.map((a: Record<string, unknown>) => ({
        id: a.id,
        studentId: a.student_id,
        studentName: a.student_name,
        alertType: a.alert_type,
        severity: a.severity,
        title: a.title,
        description: a.description,
        triggerSource: a.trigger_source,
        isResolved: !!a.is_resolved,
        resolvedAt: a.resolved_at,
        resolvedBy: a.resolved_by,
        resolutionNotes: a.resolution_notes,
        createdAt: a.created_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return c.json({ success: false, error: 'Failed to fetch alerts' }, 500);
  }
});

// Resolve an alert
counselorApp.post('/alerts/:id/resolve', async (c) => {
  try {
    const alertId = c.req.param('id');
    const userId = getUserId(c);
    const userRole = getUserRole(c);

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    if (!['admin', 'teacher', 'parent'].includes(userRole as string)) {
      return c.json({ success: false, error: 'Permission denied' }, 403);
    }

    const body = await c.req.json();
    const { resolutionNotes } = body;

    await c.env.DB.prepare(`
      UPDATE wellbeing_alerts
      SET is_resolved = 1, resolved_at = datetime('now'), resolved_by = ?, resolution_notes = ?
      WHERE id = ?
    `).bind(userId, resolutionNotes || null, alertId).run();

    return c.json({ success: true, message: 'Alert resolved' });
  } catch (error) {
    console.error('Error resolving alert:', error);
    return c.json({ success: false, error: 'Failed to resolve alert' }, 500);
  }
});

// =============================================
// PARENT-STUDENT LINKING
// =============================================

// Link parent to student
counselorApp.post('/link-student', async (c) => {
  try {
    const userId = getUserId(c);
    const userRole = getUserRole(c);

    if (!userId || userRole !== 'parent') {
      return c.json({ success: false, error: 'Parent authentication required' }, 401);
    }

    const body = await c.req.json();
    const { studentEmail, relationship } = body;

    if (!studentEmail) {
      return c.json({ success: false, error: 'Student email is required' }, 400);
    }

    // Find student
    const student = await c.env.DB.prepare(`
      SELECT id, name FROM users WHERE email = ? AND role = 'student'
    `).bind(studentEmail.toLowerCase()).first();

    if (!student) {
      return c.json({ success: false, error: 'Student not found' }, 404);
    }

    // Check if already linked
    const existing = await c.env.DB.prepare(`
      SELECT id FROM student_parent_links WHERE parent_id = ? AND student_id = ?
    `).bind(userId, student.id).first();

    if (existing) {
      return c.json({ success: false, error: 'Already linked to this student' }, 400);
    }

    // Create link (pending approval)
    const linkId = `link_${Date.now()}`;
    await c.env.DB.prepare(`
      INSERT INTO student_parent_links (id, student_id, parent_id, relationship, status, created_at)
      VALUES (?, ?, ?, ?, 'pending', datetime('now'))
    `).bind(linkId, student.id, userId, relationship || 'parent').run();

    return c.json({
      success: true,
      data: {
        linkId,
        studentName: student.name,
        status: 'pending',
      },
    });
  } catch (error) {
    console.error('Error linking student:', error);
    return c.json({ success: false, error: 'Failed to link student' }, 500);
  }
});

// Get linked students (for parent)
counselorApp.get('/linked-students', async (c) => {
  try {
    const userId = getUserId(c);
    const userRole = getUserRole(c);

    if (!userId || userRole !== 'parent') {
      return c.json({ success: false, error: 'Parent authentication required' }, 401);
    }

    const links = await c.env.DB.prepare(`
      SELECT
        spl.*,
        u.name as student_name,
        u.email as student_email,
        u.school_level,
        u.year_group
      FROM student_parent_links spl
      JOIN users u ON spl.student_id = u.id
      WHERE spl.parent_id = ?
      ORDER BY spl.created_at DESC
    `).bind(userId).all();

    return c.json({
      success: true,
      data: links.results.map((l: Record<string, unknown>) => ({
        id: l.id,
        studentId: l.student_id,
        studentName: l.student_name,
        studentEmail: l.student_email,
        schoolLevel: l.school_level,
        yearGroup: l.year_group,
        relationship: l.relationship,
        status: l.status,
        createdAt: l.created_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching linked students:', error);
    return c.json({ success: false, error: 'Failed to fetch linked students' }, 500);
  }
});

// =============================================
// PARENT-COUNSELOR MESSAGING
// =============================================

// Get parent-counselor messages
counselorApp.get('/parent-messages', async (c) => {
  try {
    const userId = getUserId(c);
    const userRole = getUserRole(c);

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    const studentId = c.req.query('studentId');

    let query = `
      SELECT
        pcm.*,
        sender.name as sender_name,
        sender.role as sender_role
      FROM parent_counselor_messages pcm
      LEFT JOIN users sender ON pcm.sender_id = sender.id
      WHERE 1=1
    `;
    const params: string[] = [];

    if (userRole === 'parent') {
      // Parent sees messages they sent or received
      query += ` AND (pcm.sender_id = ? OR pcm.parent_id = ?)`;
      params.push(userId, userId);
    } else if (['admin', 'teacher'].includes(userRole as string)) {
      // Staff can filter by student
      if (studentId) {
        query += ` AND pcm.student_id = ?`;
        params.push(studentId);
      }
    }

    query += ` ORDER BY pcm.created_at DESC LIMIT 100`;

    const messages = await c.env.DB.prepare(query).bind(...params).all();

    return c.json({
      success: true,
      data: messages.results.map((m: Record<string, unknown>) => ({
        id: m.id,
        reportId: m.report_id,
        studentId: m.student_id,
        parentId: m.parent_id,
        senderId: m.sender_id,
        senderName: m.sender_name,
        senderRole: m.sender_role,
        content: m.content,
        isRead: !!m.is_read,
        readAt: m.read_at,
        createdAt: m.created_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching parent messages:', error);
    return c.json({ success: false, error: 'Failed to fetch messages' }, 500);
  }
});

// Send parent-counselor message
counselorApp.post('/parent-messages', async (c) => {
  try {
    const userId = getUserId(c);
    const userRole = getUserRole(c);

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    const body = await c.req.json();
    const { reportId, studentId, content } = body;

    if (!content?.trim()) {
      return c.json({ success: false, error: 'Message content is required' }, 400);
    }

    // Determine parent_id based on sender role
    let parentId = userId;
    if (userRole !== 'parent') {
      // Staff is sending to parent - need to find the parent
      if (!studentId) {
        return c.json({ success: false, error: 'Student ID is required' }, 400);
      }
      const link = await c.env.DB.prepare(`
        SELECT parent_id FROM student_parent_links
        WHERE student_id = ? AND status = 'active' LIMIT 1
      `).bind(studentId).first();
      parentId = link?.parent_id as string;
    }

    const messageId = `pmsg_${Date.now()}`;

    await c.env.DB.prepare(`
      INSERT INTO parent_counselor_messages (id, report_id, student_id, parent_id, sender_id, content, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, datetime('now'))
    `).bind(
      messageId,
      reportId || null,
      studentId || null,
      parentId,
      userId,
      content.trim()
    ).run();

    return c.json({
      success: true,
      data: {
        id: messageId,
        content: content.trim(),
        senderId: userId,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error sending parent message:', error);
    return c.json({ success: false, error: 'Failed to send message' }, 500);
  }
});

// Mark parent message as read
counselorApp.post('/parent-messages/:id/read', async (c) => {
  try {
    const messageId = c.req.param('id');
    const userId = getUserId(c);

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    await c.env.DB.prepare(`
      UPDATE parent_counselor_messages
      SET is_read = 1, read_at = datetime('now')
      WHERE id = ?
    `).bind(messageId).run();

    return c.json({ success: true, message: 'Message marked as read' });
  } catch (error) {
    console.error('Error marking message as read:', error);
    return c.json({ success: false, error: 'Failed to update message' }, 500);
  }
});

// =============================================
// REPORT SCHEDULES
// =============================================

// Get report schedules
counselorApp.get('/schedules', async (c) => {
  try {
    const userId = getUserId(c);
    const userRole = getUserRole(c);

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    let query = `
      SELECT
        rs.*,
        u.name as student_name
      FROM report_schedules rs
      LEFT JOIN users u ON rs.student_id = u.id
      WHERE 1=1
    `;
    const params: string[] = [];

    if (userRole === 'parent') {
      // Get schedules for linked students
      const links = await c.env.DB.prepare(`
        SELECT student_id FROM student_parent_links WHERE parent_id = ? AND status = 'active'
      `).bind(userId).all();
      const studentIds = links.results.map((l: Record<string, unknown>) => l.student_id as string);

      if (studentIds.length === 0) {
        return c.json({ success: true, data: [] });
      }

      query += ` AND rs.student_id IN (${studentIds.map(() => '?').join(',')})`;
      params.push(...studentIds);
    }

    query += ` ORDER BY rs.created_at DESC`;

    const schedules = await c.env.DB.prepare(query).bind(...params).all();

    return c.json({
      success: true,
      data: schedules.results.map((s: Record<string, unknown>) => ({
        id: s.id,
        studentId: s.student_id,
        studentName: s.student_name,
        reportType: s.report_type,
        frequency: s.frequency,
        nextScheduledAt: s.next_scheduled_at,
        isActive: !!s.is_active,
        createdAt: s.created_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return c.json({ success: false, error: 'Failed to fetch schedules' }, 500);
  }
});

// Create report schedule
counselorApp.post('/schedules', async (c) => {
  try {
    const userId = getUserId(c);
    const userRole = getUserRole(c);

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    const body = await c.req.json();
    const { studentId, reportType, frequency } = body;

    if (!studentId || !reportType || !frequency) {
      return c.json({ success: false, error: 'studentId, reportType, and frequency are required' }, 400);
    }

    // Verify parent has access to student
    if (userRole === 'parent') {
      const hasAccess = await c.env.DB.prepare(`
        SELECT 1 FROM student_parent_links WHERE parent_id = ? AND student_id = ? AND status = 'active'
      `).bind(userId, studentId).first();

      if (!hasAccess) {
        return c.json({ success: false, error: 'Access denied' }, 403);
      }
    }

    // Calculate next scheduled date based on frequency
    let nextScheduled: Date;
    switch (frequency) {
      case 'daily':
        nextScheduled = new Date(Date.now() + 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        nextScheduled = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        nextScheduled = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        nextScheduled = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    const scheduleId = `sched_${Date.now()}`;

    await c.env.DB.prepare(`
      INSERT INTO report_schedules (id, student_id, parent_id, report_type, frequency, next_scheduled_at, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'))
    `).bind(
      scheduleId,
      studentId,
      userId,
      reportType,
      frequency,
      nextScheduled.toISOString()
    ).run();

    return c.json({
      success: true,
      data: {
        id: scheduleId,
        studentId,
        reportType,
        frequency,
        nextScheduledAt: nextScheduled.toISOString(),
        isActive: true,
      },
    });
  } catch (error) {
    console.error('Error creating schedule:', error);
    return c.json({ success: false, error: 'Failed to create schedule' }, 500);
  }
});

// Update report schedule
counselorApp.put('/schedules/:id', async (c) => {
  try {
    const scheduleId = c.req.param('id');
    const userId = getUserId(c);

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    const body = await c.req.json();
    const { isActive, frequency } = body;

    const updates: string[] = [];
    const params: (string | number)[] = [];

    if (isActive !== undefined) {
      updates.push('is_active = ?');
      params.push(isActive ? 1 : 0);
    }

    if (frequency) {
      updates.push('frequency = ?');
      params.push(frequency);
    }

    if (updates.length === 0) {
      return c.json({ success: false, error: 'No updates provided' }, 400);
    }

    params.push(scheduleId);

    await c.env.DB.prepare(`
      UPDATE report_schedules SET ${updates.join(', ')} WHERE id = ?
    `).bind(...params).run();

    return c.json({ success: true, message: 'Schedule updated' });
  } catch (error) {
    console.error('Error updating schedule:', error);
    return c.json({ success: false, error: 'Failed to update schedule' }, 500);
  }
});

// Delete report schedule
counselorApp.delete('/schedules/:id', async (c) => {
  try {
    const scheduleId = c.req.param('id');
    const userId = getUserId(c);

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    await c.env.DB.prepare(`
      DELETE FROM report_schedules WHERE id = ?
    `).bind(scheduleId).run();

    return c.json({ success: true, message: 'Schedule deleted' });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    return c.json({ success: false, error: 'Failed to delete schedule' }, 500);
  }
});

// =============================================
// SESSION SUMMARIES
// =============================================

// Get session summaries for a student
counselorApp.get('/session-summaries', async (c) => {
  try {
    const userId = getUserId(c);
    const userRole = getUserRole(c);

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    const studentId = c.req.query('studentId');

    // For students, use their own ID
    let targetStudentId = studentId;
    if (userRole === 'student') {
      targetStudentId = userId;
    }

    // For parents, verify access
    if (userRole === 'parent' && studentId) {
      const hasAccess = await c.env.DB.prepare(`
        SELECT 1 FROM student_parent_links WHERE parent_id = ? AND student_id = ? AND status = 'active'
      `).bind(userId, studentId).first();

      if (!hasAccess) {
        return c.json({ success: false, error: 'Access denied' }, 403);
      }
    }

    // Get conversations with summary info
    const sessions = await c.env.DB.prepare(`
      SELECT
        cc.id,
        cc.counselor_type,
        cc.title,
        cc.message_count,
        cc.status,
        cc.created_at,
        cc.last_message_at,
        (SELECT content FROM counselor_messages WHERE conversation_id = cc.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT sentiment FROM counselor_messages WHERE conversation_id = cc.id AND role = 'user' ORDER BY created_at DESC LIMIT 1) as last_sentiment
      FROM counselor_conversations cc
      WHERE cc.user_id = ? AND cc.status != 'archived'
      ORDER BY cc.last_message_at DESC NULLS LAST
      LIMIT 50
    `).bind(targetStudentId).all();

    return c.json({
      success: true,
      data: sessions.results.map((s: Record<string, unknown>) => ({
        id: s.id,
        counselorType: s.counselor_type,
        title: s.title,
        messageCount: s.message_count,
        status: s.status,
        lastMessage: s.last_message,
        lastSentiment: s.last_sentiment,
        createdAt: s.created_at,
        lastMessageAt: s.last_message_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching session summaries:', error);
    return c.json({ success: false, error: 'Failed to fetch summaries' }, 500);
  }
});

export { counselorApp };
