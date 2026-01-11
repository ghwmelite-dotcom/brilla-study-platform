import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import type { BaseAiTextGenerationModels } from '@cloudflare/workers-types';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  AI: Ai;  // Cloudflare Workers AI binding
  AI_MODEL?: string;
}

interface UserPayload {
  userId: string;
  email: string;
  role: string;
}

// Teaching phase types
type TeachingPhase = 'hook' | 'explain' | 'check' | 'practice' | 'confirm' | 'connect';

interface TeachingContext {
  topicName: string;
  subjectName: string;
  examType: string;
  examBoard?: string;
  previousMessages?: { role: string; content: string }[];
  studentResponse?: string;
  checkpointResult?: { correct: boolean; answer: string };
  masteryLevel?: number;
}

const revisionClassroomApp = new Hono<{ Bindings: Env; Variables: { user: UserPayload } }>();

// JWT verification helper
async function verifyJWT(token: string, secret: string): Promise<UserPayload | null> {
  try {
    const payload = await verify(token, secret);
    return payload as unknown as UserPayload;
  } catch {
    return null;
  }
}

// Auth middleware - apply to all routes
revisionClassroomApp.use('*', async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized - Please log in' }, 401);
  }

  const token = authHeader.slice(7);
  const payload = await verifyJWT(token, c.env.JWT_SECRET);

  if (!payload) {
    return c.json({ success: false, error: 'Invalid or expired token' }, 401);
  }

  c.set('user', payload);
  await next();
});

// Helper to generate unique IDs
const generateId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

// =============================================
// AI TEACHING PROMPTS - 6-Phase Methodology
// =============================================

const TEACHING_SYSTEM_PROMPT = `You are Brilla AI Teacher, an expert educator on the Brilla Study Platform. You teach students preparing for BECE, WASSCE, Cambridge IGCSE, Cambridge A-Level, and Edexcel exams.

Your teaching follows a proven 6-phase methodology:
1. HOOK - Capture attention with an intriguing question or real-world connection
2. EXPLAIN - Teach the concept clearly with examples
3. CHECK - Ask questions to verify understanding
4. PRACTICE - Provide practice problems
5. CONFIRM - Ensure mastery before moving on
6. CONNECT - Link to related concepts and exam strategies

Guidelines:
- Use clear, simple language appropriate for secondary/high school students
- Include relevant examples from Ghana/West Africa when appropriate
- For Cambridge/Edexcel exams, reference specific syllabus points
- Use emojis sparingly to keep engagement (1-2 per message max)
- Break complex concepts into digestible parts
- Be encouraging but honest about areas needing improvement
- Reference exam techniques and common mark scheme points
- Keep responses focused and not too long (aim for 150-300 words)`;

const PHASE_PROMPTS: Record<TeachingPhase, string> = {
  hook: `You are in the HOOK phase. Your goal is to capture the student's attention and spark curiosity about the topic.

Instructions:
- Start with an intriguing question or surprising fact related to the topic
- Connect to something the student might experience in daily life
- Create curiosity that makes them want to learn more
- Keep it brief and engaging (2-3 sentences max)
- End with something that naturally leads into the explanation

DO NOT explain the concept yet - just hook their attention!`,

  explain: `You are in the EXPLAIN phase. Your goal is to teach the core concept clearly.

Instructions:
- Explain the main concept in a clear, structured way
- Use analogies and real-world examples to aid understanding
- Break down complex ideas into simpler parts
- Include key definitions and formulas if relevant
- Mention how this appears in exams (question types, mark allocation)
- Use bullet points or numbered lists for clarity when appropriate
- Highlight what examiners look for in answers

This is the main teaching moment - be thorough but accessible.`,

  check: `You are in the CHECK phase. Your goal is to verify the student understood the explanation.

Instructions:
- Ask 1-2 quick comprehension questions
- Questions should test understanding, not just memory
- Frame questions conversationally, not like a formal test
- Keep questions focused on the key concepts just taught
- Be encouraging in your tone

Wait for the student's response before moving on.`,

  practice: `You are in the PRACTICE phase. Your goal is to let the student apply what they learned.

Instructions:
- Present a practice problem or scenario
- The problem should be at exam level difficulty
- Specify what type of answer you're looking for (e.g., "Explain in 2-3 sentences" or "Calculate and show your working")
- If relevant, mention how many marks this would be worth in an exam
- Encourage the student to try before asking for help

This is their chance to actively engage with the material.`,

  confirm: `You are in the CONFIRM phase. Your goal is to ensure the student has achieved mastery.

Instructions:
- Based on their practice response, confirm if they've understood correctly
- If correct: celebrate and reinforce what they did well
- If incorrect: explain the error gently and clarify the concept
- Provide the model answer showing proper exam technique
- Share any exam tips specific to this type of question
- Ask if they have any remaining questions about this topic

Be specific about what was good/needs improvement.`,

  connect: `You are in the CONNECT phase. Your goal is to link this topic to the bigger picture.

Instructions:
- Connect to related topics they should study next
- Mention how this concept appears in other questions/contexts
- Highlight synoptic links (how it connects across the syllabus)
- Provide exam strategy tips for questions on this topic
- Suggest specific areas to review if they struggled
- End on an encouraging note about their progress

Help them see how this fits into their overall exam preparation.`,
};

// Generate AI teaching content
async function generateTeachingContent(
  env: Env,
  phase: TeachingPhase,
  context: TeachingContext
): Promise<{ content: string; tokensUsed?: number }> {
  const systemPrompt = `${TEACHING_SYSTEM_PROMPT}

Current Context:
- Topic: ${context.topicName}
- Subject: ${context.subjectName}
- Exam: ${context.examType.toUpperCase()}${context.examBoard ? ` (${context.examBoard})` : ''}
${context.masteryLevel !== undefined ? `- Student's mastery level: ${context.masteryLevel}%` : ''}

${PHASE_PROMPTS[phase]}`;

  const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    { role: 'system', content: systemPrompt },
  ];

  // Add conversation history if available
  if (context.previousMessages && context.previousMessages.length > 0) {
    for (const msg of context.previousMessages.slice(-6)) { // Keep last 6 messages for context
      messages.push({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      });
    }
  }

  // Add the appropriate user message based on phase
  let userMessage = '';
  switch (phase) {
    case 'hook':
      userMessage = `Start teaching me about "${context.topicName}" with an engaging hook.`;
      break;
    case 'explain':
      userMessage = `Now explain the concept of "${context.topicName}" to me clearly.`;
      break;
    case 'check':
      userMessage = `Ask me a question to check if I understood "${context.topicName}".`;
      break;
    case 'practice':
      userMessage = `Give me a practice problem about "${context.topicName}".`;
      break;
    case 'confirm':
      if (context.studentResponse) {
        userMessage = `Here's my answer: "${context.studentResponse}". Please evaluate it and confirm my understanding.`;
      } else if (context.checkpointResult) {
        userMessage = context.checkpointResult.correct
          ? `I got the question right! My answer was: "${context.checkpointResult.answer}". Please confirm I understand correctly.`
          : `I got the question wrong. My answer was: "${context.checkpointResult.answer}". Please help me understand the correct answer.`;
      } else {
        userMessage = `Please confirm my understanding of "${context.topicName}".`;
      }
      break;
    case 'connect':
      userMessage = `Help me connect "${context.topicName}" to other topics and exam strategies.`;
      break;
  }

  messages.push({ role: 'user', content: userMessage });

  try {
    const model = env.AI_MODEL || '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

    const result = await env.AI.run(model as BaseAiTextGenerationModels, {
      messages,
      max_tokens: 1024,
      temperature: 0.7,
    });

    // Handle the response
    const content = typeof result === 'object' && result !== null && 'response' in result
      ? (result as { response: string }).response
      : String(result);

    if (!content || content.trim() === '') {
      console.error('Empty response from Workers AI');
      return getFallbackContent(phase, context);
    }

    return { content, tokensUsed: 0 }; // Workers AI doesn't return token count directly
  } catch (error) {
    console.error('Error calling Workers AI for teaching:', error);
    return getFallbackContent(phase, context);
  }
}

// Fallback content when AI is unavailable
function getFallbackContent(phase: TeachingPhase, context: TeachingContext): { content: string } {
  const fallbacks: Record<TeachingPhase, string> = {
    hook: `Have you ever wondered about ${context.topicName}? 🤔 This is one of the most important concepts in ${context.subjectName}, and understanding it well could make a real difference in your ${context.examType.toUpperCase()} exam. Let me show you why this matters...`,

    explain: `Let me explain ${context.topicName} to you.\n\n**Key Concept:**\n${context.topicName} is a fundamental topic in ${context.subjectName}. In your ${context.examType.toUpperCase()} exam, you'll encounter questions testing your understanding of this concept.\n\n**Important Points:**\n• Pay attention to the key definitions\n• Understand the underlying principles\n• Practice applying the concept to different scenarios\n\nLet's make sure you understand this thoroughly before moving on.`,

    check: `Now let me check your understanding! 📝\n\nThink about what we just covered about ${context.topicName}. Can you explain in your own words what the main concept is and why it's important?\n\nTake your time to think about it.`,

    practice: `Time to put your knowledge into practice! ✍️\n\nHere's a question about ${context.topicName}:\n\nBased on what you've learned, explain the key concept and give one example of how it applies.\n\n*This would be worth about 4 marks in your exam.*\n\nType your answer below.`,

    confirm: `Let's confirm your understanding! ✅\n\n${context.studentResponse
      ? `Thank you for your answer. You've shown good understanding of ${context.topicName}. Remember to include specific details and examples in your exam answers for full marks.`
      : `You're making great progress with ${context.topicName}. The key things to remember are the main definitions and how to apply them.`
    }\n\nDo you have any questions before we move on?`,

    connect: `Excellent work on ${context.topicName}! 🎉\n\n**Connections:**\nThis topic links to several other areas in ${context.subjectName}. Make sure you can see how concepts build on each other.\n\n**Exam Tips:**\n• Questions on this topic often appear in Paper 2\n• Examiners look for clear explanations with examples\n• Practice past paper questions on this topic\n\nYou're making great progress! Keep up the excellent work. 💪`,
  };

  return { content: fallbacks[phase] };
}

// Generate a checkpoint question using AI
async function generateCheckpointQuestion(
  env: Env,
  context: TeachingContext,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium'
): Promise<{
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}> {
  const systemPrompt = `You are creating exam-style questions for the Brilla Study Platform.

Context:
- Topic: ${context.topicName}
- Subject: ${context.subjectName}
- Exam: ${context.examType.toUpperCase()}
- Difficulty: ${difficulty}

Generate a multiple choice question with 4 options (A, B, C, D).

RESPOND IN THIS EXACT JSON FORMAT:
{
  "question": "The question text here",
  "options": ["A) First option", "B) Second option", "C) Third option", "D) Fourth option"],
  "correctAnswer": "A",
  "explanation": "Brief explanation of why this is correct"
}`;

  try {
    const model = env.AI_MODEL || '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

    const result = await env.AI.run(model as BaseAiTextGenerationModels, {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate a ${difficulty} difficulty multiple choice question about "${context.topicName}".` },
      ],
      max_tokens: 512,
      temperature: 0.8,
    });

    const content = typeof result === 'object' && result !== null && 'response' in result
      ? (result as { response: string }).response
      : String(result);

    // Try to parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        question: parsed.question || `What is a key concept of ${context.topicName}?`,
        options: parsed.options || ['A) Option 1', 'B) Option 2', 'C) Option 3', 'D) Option 4'],
        correctAnswer: parsed.correctAnswer || 'A',
        explanation: parsed.explanation || 'Review the topic for the complete explanation.',
      };
    }
  } catch (error) {
    console.error('Error generating checkpoint question:', error);
  }

  // Fallback question
  return {
    question: `Which of the following best describes ${context.topicName}?`,
    options: [
      'A) The first possible explanation',
      'B) The second possible explanation',
      'C) The correct explanation based on the lesson',
      'D) An incorrect explanation',
    ],
    correctAnswer: 'C',
    explanation: `Review the explanation of ${context.topicName} to understand why option C is correct.`,
  };
}

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
// AI TEACHING - Generate teaching content using Llama AI
// =============================================

// Generate AI teaching content for a specific phase
revisionClassroomApp.post('/lessons/:lessonId/teach', async (c) => {
  try {
    const user = c.get('user');
    const lessonId = c.req.param('lessonId');
    const body = await c.req.json();
    const {
      phase,
      studentResponse,
      checkpointResult,
      previousMessages,
    } = body as {
      phase: TeachingPhase;
      studentResponse?: string;
      checkpointResult?: { correct: boolean; answer: string };
      previousMessages?: { role: string; content: string }[];
    };

    // Validate phase
    const validPhases: TeachingPhase[] = ['hook', 'explain', 'check', 'practice', 'confirm', 'connect'];
    if (!validPhases.includes(phase)) {
      return c.json({ success: false, error: 'Invalid teaching phase' }, 400);
    }

    // Get lesson details with topic and subject info
    const lesson = await c.env.DB.prepare(`
      SELECT
        rl.*,
        t.name as topic_name,
        s.name as subject_name,
        rs.exam_type,
        rs.user_id,
        tm.mastery_level
      FROM revision_lessons rl
      LEFT JOIN topics t ON rl.topic_id = t.id
      LEFT JOIN revision_sessions rs ON rl.session_id = rs.id
      LEFT JOIN subjects s ON rs.subject_id = s.id
      LEFT JOIN topic_mastery tm ON tm.topic_id = rl.topic_id AND tm.user_id = rs.user_id
      WHERE rl.id = ? AND rs.user_id = ?
    `).bind(lessonId, user.userId).first();

    if (!lesson) {
      return c.json({ success: false, error: 'Lesson not found' }, 404);
    }

    // Build teaching context
    const context: TeachingContext = {
      topicName: (lesson as any).topic_name || 'this topic',
      subjectName: (lesson as any).subject_name || 'this subject',
      examType: (lesson as any).exam_type || 'wassce',
      previousMessages,
      studentResponse,
      checkpointResult,
      masteryLevel: (lesson as any).mastery_level,
    };

    // Generate AI teaching content
    const { content, tokensUsed } = await generateTeachingContent(c.env, phase, context);

    // Record the interaction
    const interactionId = generateId('interaction');
    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      INSERT INTO revision_ai_interactions (
        id, lesson_id, user_id, interaction_type, ai_message,
        user_response, tokens_used, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      interactionId, lessonId, user.userId, `teach_${phase}`,
      content, studentResponse || null, tokensUsed || null, now
    ).run();

    // Update lesson's current phase
    await c.env.DB.prepare(`
      UPDATE revision_lessons
      SET current_phase = ?, updated_at = ?
      WHERE id = ?
    `).bind(phase, now, lessonId).run();

    return c.json({
      success: true,
      data: {
        content,
        phase,
        interactionId,
        context: {
          topicName: context.topicName,
          subjectName: context.subjectName,
          examType: context.examType,
        },
      },
    });
  } catch (error) {
    console.error('Error generating teaching content:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return c.json({ success: false, error: `Failed to generate teaching content: ${errorMessage}` }, 500);
  }
});

// Generate an AI checkpoint question
revisionClassroomApp.post('/lessons/:lessonId/checkpoint/generate', async (c) => {
  try {
    const user = c.get('user');
    const lessonId = c.req.param('lessonId');
    const body = await c.req.json();
    const { difficulty = 'medium' } = body as { difficulty?: 'easy' | 'medium' | 'hard' };

    // Get lesson details
    const lesson = await c.env.DB.prepare(`
      SELECT
        rl.*,
        t.name as topic_name,
        s.name as subject_name,
        rs.exam_type,
        rs.user_id
      FROM revision_lessons rl
      LEFT JOIN topics t ON rl.topic_id = t.id
      LEFT JOIN revision_sessions rs ON rl.session_id = rs.id
      LEFT JOIN subjects s ON rs.subject_id = s.id
      WHERE rl.id = ? AND rs.user_id = ?
    `).bind(lessonId, user.userId).first();

    if (!lesson) {
      return c.json({ success: false, error: 'Lesson not found' }, 404);
    }

    // Build context
    const context: TeachingContext = {
      topicName: (lesson as any).topic_name || 'this topic',
      subjectName: (lesson as any).subject_name || 'this subject',
      examType: (lesson as any).exam_type || 'wassce',
    };

    // Generate checkpoint question
    const checkpoint = await generateCheckpointQuestion(c.env, context, difficulty);

    // Save checkpoint to database
    const checkpointId = generateId('checkpoint');
    const now = new Date().toISOString();

    // Get max order
    const maxOrder = await c.env.DB.prepare(`
      SELECT COALESCE(MAX(order_index), 0) as max_order FROM revision_checkpoints WHERE lesson_id = ?
    `).bind(lessonId).first();

    await c.env.DB.prepare(`
      INSERT INTO revision_checkpoints (
        id, lesson_id, checkpoint_type, question_text, question_type,
        options, correct_answer, explanation, difficulty, points, order_index, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      checkpointId,
      lessonId,
      'understanding',
      checkpoint.question,
      'multiple_choice',
      JSON.stringify(checkpoint.options),
      checkpoint.correctAnswer,
      checkpoint.explanation,
      difficulty,
      difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
      ((maxOrder as any)?.max_order || 0) + 1,
      now
    ).run();

    return c.json({
      success: true,
      data: {
        checkpointId,
        question: checkpoint.question,
        options: checkpoint.options,
        difficulty,
        // Don't send correctAnswer to frontend - validate on submit
      },
    });
  } catch (error) {
    console.error('Error generating checkpoint:', error);
    return c.json({ success: false, error: 'Failed to generate checkpoint' }, 500);
  }
});

// Handle student question (ask anything, anytime feature)
revisionClassroomApp.post('/lessons/:lessonId/ask', async (c) => {
  try {
    const user = c.get('user');
    const lessonId = c.req.param('lessonId');
    const body = await c.req.json();
    const { question, previousMessages } = body as {
      question: string;
      previousMessages?: { role: string; content: string }[];
    };

    if (!question || question.trim().length === 0) {
      return c.json({ success: false, error: 'Question is required' }, 400);
    }

    // Get lesson details
    const lesson = await c.env.DB.prepare(`
      SELECT
        rl.*,
        t.name as topic_name,
        s.name as subject_name,
        rs.exam_type,
        rs.user_id
      FROM revision_lessons rl
      LEFT JOIN topics t ON rl.topic_id = t.id
      LEFT JOIN revision_sessions rs ON rl.session_id = rs.id
      LEFT JOIN subjects s ON rs.subject_id = s.id
      WHERE rl.id = ? AND rs.user_id = ?
    `).bind(lessonId, user.userId).first();

    if (!lesson) {
      return c.json({ success: false, error: 'Lesson not found' }, 404);
    }

    // Build the prompt for answering student questions
    const systemPrompt = `${TEACHING_SYSTEM_PROMPT}

Current Context:
- Topic: ${(lesson as any).topic_name || 'General'}
- Subject: ${(lesson as any).subject_name || 'General'}
- Exam: ${((lesson as any).exam_type || 'wassce').toUpperCase()}

The student has a question. Answer it helpfully and concisely, relating it back to the current topic when relevant. If the question is off-topic, gently guide them back while still being helpful.`;

    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Add conversation history
    if (previousMessages && previousMessages.length > 0) {
      for (const msg of previousMessages.slice(-6)) {
        messages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        });
      }
    }

    messages.push({ role: 'user', content: question });

    try {
      const model = c.env.AI_MODEL || '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

      const result = await c.env.AI.run(model as BaseAiTextGenerationModels, {
        messages,
        max_tokens: 1024,
        temperature: 0.7,
      });

      const content = typeof result === 'object' && result !== null && 'response' in result
        ? (result as { response: string }).response
        : String(result);

      if (!content || content.trim() === '') {
        return c.json({
          success: true,
          data: {
            answer: `That's a great question about ${(lesson as any).topic_name}! Let me help you understand this better. Could you be more specific about what aspect you'd like me to explain?`,
          },
        });
      }

      // Record the interaction
      const interactionId = generateId('interaction');
      const now = new Date().toISOString();

      await c.env.DB.prepare(`
        INSERT INTO revision_ai_interactions (
          id, lesson_id, user_id, interaction_type, ai_message,
          user_response, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        interactionId, lessonId, user.userId, 'student_question',
        content, question, now
      ).run();

      return c.json({
        success: true,
        data: {
          answer: content,
          interactionId,
        },
      });
    } catch (aiError) {
      console.error('AI error answering question:', aiError);
      return c.json({
        success: true,
        data: {
          answer: `That's a thoughtful question! While I'm having some technical difficulties, I encourage you to think about how ${(lesson as any).topic_name} relates to what you're asking. Try breaking down your question into smaller parts - what specific concept are you struggling with?`,
        },
      });
    }
  } catch (error) {
    console.error('Error handling student question:', error);
    return c.json({ success: false, error: 'Failed to process question' }, 500);
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

// =============================================
// AI WHITEBOARD TUTORING
// =============================================

// Types for whiteboard drawing commands
interface WhiteboardDrawCommand {
  type: 'rect' | 'circle' | 'line' | 'arrow' | 'text' | 'path' | 'polygon' | 'group';
  id: string;
  props: {
    // Position
    left?: number;
    top?: number;
    // Dimensions
    width?: number;
    height?: number;
    radius?: number;
    // Line/Arrow points
    x1?: number;
    y1?: number;
    x2?: number;
    y2?: number;
    // Path data for complex shapes
    path?: string;
    // Polygon points
    points?: { x: number; y: number }[];
    // Styling
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    opacity?: number;
    // Text specific
    text?: string;
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    textAlign?: string;
    // Transform
    angle?: number;
    scaleX?: number;
    scaleY?: number;
  };
}

interface WhiteboardStep {
  stepNumber: number;
  explanation: string;
  voiceOver?: string; // Text for TTS
  duration: number; // Seconds to display this step
  commands: WhiteboardDrawCommand[];
  highlights?: string[]; // IDs of objects to highlight
  clearPrevious?: boolean; // Whether to clear canvas before this step
}

interface WhiteboardTeachingContent {
  title: string;
  topic: string;
  totalDuration: number;
  canvasSize: { width: number; height: number };
  backgroundColor: string;
  steps: WhiteboardStep[];
  summary: string;
}

// Prompt for generating whiteboard teaching content
const WHITEBOARD_TEACHING_PROMPT = `You are an expert visual educator creating whiteboard lessons for the Brilla Study Platform.

Your task is to create a step-by-step visual explanation that will be rendered on a digital whiteboard canvas.

IMPORTANT GUIDELINES:
1. Think like a teacher drawing on a whiteboard - start simple, build complexity
2. Use shapes, arrows, and text to explain concepts visually
3. Each step should have ONE main idea with supporting visuals
4. Use colors meaningfully (e.g., red for important, blue for definitions, green for examples)
5. Position elements logically - left to right, top to bottom
6. Keep text concise - use labels, not paragraphs
7. Use arrows to show relationships and flow
8. For math: show step-by-step working
9. For science: draw diagrams, label parts
10. For concepts: use mind maps, flowcharts

CANVAS COORDINATES:
- Canvas is 1200x800 pixels
- (0,0) is top-left corner
- Use the full canvas space effectively
- Leave margins of about 50px

COLOR PALETTE:
- #1e40af (dark blue) - for main concepts/titles
- #dc2626 (red) - for important points/highlights
- #16a34a (green) - for examples/correct answers
- #7c3aed (purple) - for formulas/equations
- #ea580c (orange) - for warnings/common mistakes
- #0891b2 (teal) - for definitions
- #000000 (black) - for general text/lines
- #6b7280 (gray) - for secondary elements

RESPOND WITH VALID JSON ONLY in this exact format:
{
  "title": "Lesson title",
  "topic": "Topic name",
  "totalDuration": 60,
  "canvasSize": { "width": 1200, "height": 800 },
  "backgroundColor": "#ffffff",
  "steps": [
    {
      "stepNumber": 1,
      "explanation": "What the student should understand from this step",
      "voiceOver": "What to say while showing this step",
      "duration": 5,
      "commands": [
        {
          "type": "text",
          "id": "title1",
          "props": {
            "left": 100,
            "top": 50,
            "text": "Title Text",
            "fontSize": 32,
            "fontWeight": "bold",
            "fill": "#1e40af"
          }
        }
      ],
      "highlights": [],
      "clearPrevious": false
    }
  ],
  "summary": "Key takeaways from this visual lesson"
}`;

// Generate whiteboard teaching content
async function generateWhiteboardContent(
  env: Env,
  topic: string,
  subject: string,
  examType: string,
  lessonType: 'diagram' | 'step-by-step' | 'problem-solving' | 'concept-map' = 'step-by-step'
): Promise<WhiteboardTeachingContent> {
  const lessonTypeInstructions: Record<string, string> = {
    'diagram': `Create a labeled diagram explaining ${topic}. Include:
- Main diagram with clear labels
- Arrows pointing to key parts
- Brief text explanations for each component
- A title and summary`,

    'step-by-step': `Create a step-by-step visual explanation of ${topic}. Include:
- Start with the concept name/title
- Break down into 4-6 clear steps
- Each step builds on the previous
- Use shapes and arrows to show progression
- End with a summary/key points`,

    'problem-solving': `Create a worked example solving a problem related to ${topic}. Include:
- The problem statement at the top
- Step-by-step solution with calculations
- Highlight each step as you work through
- Use colors to distinguish steps
- Show the final answer prominently`,

    'concept-map': `Create a concept map/mind map for ${topic}. Include:
- Central concept in the middle
- Related sub-concepts branching out
- Connecting lines with relationship labels
- Use different colors for different branches
- Keep it organized and readable`,
  };

  const systemPrompt = `${WHITEBOARD_TEACHING_PROMPT}

Context:
- Subject: ${subject}
- Topic: ${topic}
- Exam: ${examType.toUpperCase()}
- Lesson Type: ${lessonType}

${lessonTypeInstructions[lessonType]}

Create content appropriate for ${examType.toUpperCase()} exam preparation.`;

  try {
    const model = env.AI_MODEL || '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

    const result = await env.AI.run(model as BaseAiTextGenerationModels, {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Create a ${lessonType} whiteboard lesson about "${topic}" for ${subject}.` },
      ],
      max_tokens: 4096,
      temperature: 0.7,
    });

    const responseText = typeof result === 'object' && result !== null && 'response' in result
      ? (result as { response: string }).response
      : String(result);

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as WhiteboardTeachingContent;
      return parsed;
    }

    throw new Error('Failed to parse whiteboard content');
  } catch (error) {
    console.error('Error generating whiteboard content:', error);
    // Return fallback content
    return getDefaultWhiteboardContent(topic, subject, examType);
  }
}

// Default/fallback whiteboard content
function getDefaultWhiteboardContent(topic: string, subject: string, examType: string): WhiteboardTeachingContent {
  return {
    title: `Understanding ${topic}`,
    topic,
    totalDuration: 30,
    canvasSize: { width: 1200, height: 800 },
    backgroundColor: '#ffffff',
    steps: [
      {
        stepNumber: 1,
        explanation: `Let's explore ${topic} together.`,
        voiceOver: `Welcome! Today we're going to learn about ${topic} in ${subject}.`,
        duration: 5,
        commands: [
          {
            type: 'text',
            id: 'title',
            props: {
              left: 600,
              top: 80,
              text: topic,
              fontSize: 48,
              fontWeight: 'bold',
              fill: '#1e40af',
              textAlign: 'center',
            },
          },
          {
            type: 'line',
            id: 'underline',
            props: {
              x1: 300,
              y1: 130,
              x2: 900,
              y2: 130,
              stroke: '#1e40af',
              strokeWidth: 3,
            },
          },
        ],
        highlights: [],
        clearPrevious: false,
      },
      {
        stepNumber: 2,
        explanation: `Key concepts in ${topic}`,
        voiceOver: `Let me show you the main ideas you need to understand.`,
        duration: 8,
        commands: [
          {
            type: 'text',
            id: 'concept1-label',
            props: {
              left: 150,
              top: 200,
              text: 'Key Concept 1',
              fontSize: 24,
              fontWeight: 'bold',
              fill: '#16a34a',
            },
          },
          {
            type: 'rect',
            id: 'concept1-box',
            props: {
              left: 100,
              top: 230,
              width: 300,
              height: 100,
              fill: '#f0fdf4',
              stroke: '#16a34a',
              strokeWidth: 2,
            },
          },
          {
            type: 'text',
            id: 'concept1-text',
            props: {
              left: 120,
              top: 260,
              text: `Understanding the basics\nof ${topic}`,
              fontSize: 18,
              fill: '#000000',
            },
          },
        ],
        highlights: ['concept1-box'],
        clearPrevious: false,
      },
      {
        stepNumber: 3,
        explanation: `How this applies to your ${examType.toUpperCase()} exam`,
        voiceOver: `This is important for your exam. Let me show you how questions are typically asked.`,
        duration: 10,
        commands: [
          {
            type: 'text',
            id: 'exam-label',
            props: {
              left: 600,
              top: 200,
              text: `${examType.toUpperCase()} Exam Tips`,
              fontSize: 28,
              fontWeight: 'bold',
              fill: '#dc2626',
              textAlign: 'center',
            },
          },
          {
            type: 'rect',
            id: 'exam-box',
            props: {
              left: 450,
              top: 240,
              width: 300,
              height: 150,
              fill: '#fef2f2',
              stroke: '#dc2626',
              strokeWidth: 2,
            },
          },
          {
            type: 'text',
            id: 'exam-tip1',
            props: {
              left: 470,
              top: 270,
              text: '• Read questions carefully',
              fontSize: 16,
              fill: '#000000',
            },
          },
          {
            type: 'text',
            id: 'exam-tip2',
            props: {
              left: 470,
              top: 300,
              text: '• Show all working',
              fontSize: 16,
              fill: '#000000',
            },
          },
          {
            type: 'text',
            id: 'exam-tip3',
            props: {
              left: 470,
              top: 330,
              text: '• Check your answers',
              fontSize: 16,
              fill: '#000000',
            },
          },
        ],
        highlights: ['exam-box'],
        clearPrevious: false,
      },
      {
        stepNumber: 4,
        explanation: 'Summary of what we learned',
        voiceOver: `Great job! Let's summarize what we've covered about ${topic}.`,
        duration: 7,
        commands: [
          {
            type: 'rect',
            id: 'summary-bg',
            props: {
              left: 100,
              top: 450,
              width: 1000,
              height: 280,
              fill: '#f8fafc',
              stroke: '#64748b',
              strokeWidth: 2,
            },
          },
          {
            type: 'text',
            id: 'summary-title',
            props: {
              left: 600,
              top: 480,
              text: 'Summary',
              fontSize: 32,
              fontWeight: 'bold',
              fill: '#7c3aed',
              textAlign: 'center',
            },
          },
          {
            type: 'text',
            id: 'summary-content',
            props: {
              left: 150,
              top: 530,
              text: `✓ We learned about ${topic}\n✓ Key concepts and definitions\n✓ How to approach ${examType.toUpperCase()} questions\n✓ Common mistakes to avoid`,
              fontSize: 20,
              fill: '#000000',
            },
          },
        ],
        highlights: [],
        clearPrevious: false,
      },
    ],
    summary: `In this lesson, we explored ${topic} as it relates to ${subject} for the ${examType.toUpperCase()} exam.`,
  };
}

// API Endpoint: Generate AI whiteboard teaching content
revisionClassroomApp.post('/lessons/:lessonId/whiteboard-teach', async (c) => {
  try {
    const user = c.get('user');
    const lessonId = c.req.param('lessonId');
    const body = await c.req.json();
    const { lessonType = 'step-by-step' } = body as {
      lessonType?: 'diagram' | 'step-by-step' | 'problem-solving' | 'concept-map';
    };

    // Get lesson details
    const lesson = await c.env.DB.prepare(`
      SELECT
        rl.*,
        t.name as topic_name,
        s.name as subject_name,
        rs.exam_type,
        rs.user_id
      FROM revision_lessons rl
      LEFT JOIN topics t ON rl.topic_id = t.id
      LEFT JOIN revision_sessions rs ON rl.session_id = rs.id
      LEFT JOIN subjects s ON rs.subject_id = s.id
      WHERE rl.id = ? AND rs.user_id = ?
    `).bind(lessonId, user.userId).first();

    if (!lesson) {
      return c.json({ success: false, error: 'Lesson not found' }, 404);
    }

    const topicName = (lesson as any).topic_name || 'this topic';
    const subjectName = (lesson as any).subject_name || 'this subject';
    const examType = (lesson as any).exam_type || 'wassce';

    // Generate whiteboard content
    const whiteboardContent = await generateWhiteboardContent(
      c.env,
      topicName,
      subjectName,
      examType,
      lessonType
    );

    // Record the interaction
    const interactionId = generateId('wb_interaction');
    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      INSERT INTO revision_ai_interactions (
        id, lesson_id, user_id, interaction_type, ai_message, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      interactionId, lessonId, user.userId, `whiteboard_${lessonType}`,
      JSON.stringify(whiteboardContent), now
    ).run();

    return c.json({
      success: true,
      data: {
        whiteboardContent,
        interactionId,
        lessonType,
      },
    });
  } catch (error) {
    console.error('Error generating whiteboard content:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return c.json({ success: false, error: `Failed to generate whiteboard content: ${errorMessage}` }, 500);
  }
});

// API Endpoint: Get available whiteboard lesson types
revisionClassroomApp.get('/whiteboard-types', async (c) => {
  return c.json({
    success: true,
    data: {
      types: [
        {
          id: 'diagram',
          name: 'Labeled Diagram',
          description: 'Visual diagram with labeled parts and explanations',
          icon: 'diagram',
          bestFor: ['Science', 'Biology', 'Geography', 'Technical subjects'],
        },
        {
          id: 'step-by-step',
          name: 'Step-by-Step Explanation',
          description: 'Progressive visual walkthrough of a concept',
          icon: 'steps',
          bestFor: ['All subjects', 'Complex concepts', 'Processes'],
        },
        {
          id: 'problem-solving',
          name: 'Worked Example',
          description: 'Step-by-step solution to a problem with calculations',
          icon: 'calculator',
          bestFor: ['Mathematics', 'Physics', 'Chemistry', 'Economics'],
        },
        {
          id: 'concept-map',
          name: 'Concept Map',
          description: 'Mind map showing relationships between ideas',
          icon: 'map',
          bestFor: ['Social Studies', 'History', 'English', 'Overview topics'],
        },
      ],
    },
  });
});

export { revisionClassroomApp };
