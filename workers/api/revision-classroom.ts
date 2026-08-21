import { Hono } from 'hono';
import { requireAuth } from './auth-middleware';
import { parseLimit } from './http';
import { isPremiumUser, checkAiAllowance } from './usage-limits';
import { getChatModel, getGenerationModel, getTtsModel, getVisionModel, unwrapAiText } from './ai-models';
import { lookupAnswer, storeAnswer } from './answer-cache';
import { formatUntrustedAiData, UNTRUSTED_AI_DATA_INSTRUCTION } from './ai-safety';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  AI: Ai;  // Cloudflare Workers AI binding
  AI_MODEL?: string;
  AI_MODEL_TTS?: string;
  AI_MODEL_EMBEDDING?: string;
  AI_MODEL_VISION?: string;
  AI_CACHE_THRESHOLD?: string;
  ANSWERS_INDEX?: VectorizeIndex;
  RECORDINGS_BUCKET?: R2Bucket;
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

// Auth: shared middleware (HS256-pinned signature verify + per-request DB
// status/is_active/role re-check). Sets `user` = { ...JWT payload, role },
// which carries the userId/email/role keys the routes below read.
// Public-route audit: every route reads or writes per-user revision state and
// was already behind the previous blanket middleware — no public routes.
revisionClassroomApp.use('*', requireAuth);

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

${PHASE_PROMPTS[phase]}
${UNTRUSTED_AI_DATA_INSTRUCTION}`;

  const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: formatUntrustedAiData('Lesson context', {
      topic: context.topicName,
      subject: context.subjectName,
      examType: context.examType,
      examBoard: context.examBoard,
      masteryLevel: context.masteryLevel,
    }) },
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
    const model = getChatModel(env);

    const result = await env.AI.run(model, {
      messages,
      max_tokens: 1024,
      temperature: 0.7,
    });

    // Handle the response (unwrapAiText tolerates parsed-JSON responses)
    const content = unwrapAiText(result);

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
${UNTRUSTED_AI_DATA_INSTRUCTION}

Generate a multiple choice question with 4 options (A, B, C, D).

RESPOND IN THIS EXACT JSON FORMAT:
{
  "question": "The question text here",
  "options": ["A) First option", "B) Second option", "C) Third option", "D) Fourth option"],
  "correctAnswer": "A",
  "explanation": "Brief explanation of why this is correct"
}`;

  try {
    const model = getChatModel(env);

    const result = await env.AI.run(model, {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: formatUntrustedAiData('Question generation context', {
          topic: context.topicName,
          subject: context.subjectName,
          examType: context.examType,
          difficulty,
        }) },
      ],
      max_tokens: 512,
      temperature: 0.8,
    });

    const content = unwrapAiText(result);

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
    const limit = parseLimit(c, 20);

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

    // Validate the subject exists — a bogus id otherwise dies on the FK as a
    // 500, which the frontend cannot distinguish from a server fault.
    const subject = await c.env.DB.prepare(
      'SELECT id FROM subjects WHERE id = ?'
    ).bind(subjectId).first();
    if (!subject) {
      return c.json({ success: false, error: 'This subject is not available yet.' }, 400);
    }

    const sessionId = generateId('session');
    const now = new Date().toISOString();

    // Get topics for this subject to determine total lessons
    const topics = await c.env.DB.prepare(`
      SELECT id, name, display_order
      FROM topics
      WHERE subject_id = ?
      ORDER BY display_order ASC
    `).bind(subjectId).all<{ id: string; name: string; display_order: number }>();

    if (!topicId && topics.results.length === 0) {
      return c.json({ success: false, error: 'Revision content for this subject is being prepared. Please try another subject for now.' }, 400);
    }


    const selectedTopic = topicId
      ? topics.results.find((topic) => topic.id === topicId)
      : null;
    if (topicId && !selectedTopic) {
      return c.json({ success: false, error: 'This topic is not available for the selected subject.' }, 400);
    }
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
    const lessonsToCreate = selectedTopic ? [selectedTopic] : topics.results;

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

    // Get user's responses to checkpoints (join through checkpoints table)
    const responses = await c.env.DB.prepare(`
      SELECT cr.* FROM checkpoint_responses cr
      JOIN revision_checkpoints rc ON cr.checkpoint_id = rc.id
      WHERE rc.lesson_id = ? AND cr.user_id = ?
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

    // Free-tier daily AI allowance (premium = unlimited)
    const allowance = await checkAiAllowance(user.userId, c.env.DB);
    if (!allowance.allowed) {
      return c.json({
        success: false,
        error: "You've used today's free AI explanations. Upgrade for unlimited access, or come back tomorrow.",
        aiLimitReached: true,
        remaining: 0,
      }, 403);
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
        remainingFreeToday: allowance.remaining === -1 ? -1 : allowance.remaining - 1,
      },
    });
  } catch (error) {
    console.error('Error generating teaching content:', error);
    return c.json({ success: false, error: 'Failed to generate teaching content' }, 500);
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

    // Free-tier daily AI allowance (premium = unlimited)
    const allowance = await checkAiAllowance(user.userId, c.env.DB);
    if (!allowance.allowed) {
      return c.json({
        success: false,
        error: "You've used today's free AI explanations. Upgrade for unlimited access, or come back tomorrow.",
        aiLimitReached: true,
        remaining: 0,
      }, 403);
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

    await c.env.DB.prepare(`
      INSERT INTO revision_ai_interactions (
        id, lesson_id, user_id, interaction_type, ai_message, created_at
      ) VALUES (?, ?, ?, 'checkpoint', ?, ?)
    `).bind(
      generateId('interaction'), lessonId, user.userId, checkpoint.question, now
    ).run();

    return c.json({
      success: true,
      data: {
        checkpointId,
        question: checkpoint.question,
        options: checkpoint.options,
        difficulty,
        // Don't send correctAnswer to frontend - validate on submit
        remainingFreeToday: allowance.remaining === -1 ? -1 : allowance.remaining - 1,
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
        rs.subject_id,
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

    // Free-tier daily AI allowance (premium = unlimited). Read-only — computed
    // up front so a cache hit can report the remaining count without
    // incrementing anything.
    const allowance = await checkAiAllowance(user.userId, c.env.DB);

    // Semantic answer cache: a confident same-topic hit is FREE for EVERYONE —
    // owner decision 2026-08-13: cache hits bypass the daily free-tier cap
    // entirely (they cost nothing), so this check runs BEFORE the allowance
    // gate. No AI call, no interaction row, allowance NOT decremented. The
    // cache is optional; lookupAnswer swallows all failures and returns null
    // on a miss.
    const cached = await lookupAnswer(c.env, (lesson as any).topic_id, question);
    if (cached) {
      return c.json({
        success: true,
        data: {
          answer: cached.answerText,
          cached: true,
          remainingFreeToday: allowance.remaining,
        },
      });
    }

    // Cache miss: generating costs an AI call, so the daily cap applies here.
    if (!allowance.allowed) {
      return c.json({
        success: false,
        error: "You've used today's free AI explanations. Upgrade for unlimited access, or come back tomorrow.",
        aiLimitReached: true,
        remaining: 0,
      }, 403);
    }

    // Build the prompt for answering student questions
    const systemPrompt = `${TEACHING_SYSTEM_PROMPT}

The student has a question. Answer it helpfully and concisely, relating it back to the current topic when relevant. If the question is off-topic, gently guide them back while still being helpful.
${UNTRUSTED_AI_DATA_INSTRUCTION}`;

    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: formatUntrustedAiData('Current lesson context', {
        topic: (lesson as any).topic_name || 'General',
        subject: (lesson as any).subject_name || 'General',
        examType: (lesson as any).exam_type || 'wassce',
      }) },
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
      const model = getChatModel(c.env);

      const result = await c.env.AI.run(model, {
        messages,
        max_tokens: 1024,
        temperature: 0.7,
      });

      const content = unwrapAiText(result);

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

      // Store the answer for future semantic cache hits (best-effort). Prefer
      // waitUntil so it runs off the response path; fall back to a plain await
      // when no ExecutionContext is available (e.g. unit tests) — storeAnswer
      // swallows its own errors, so awaiting it can never break ask.
      const storePromise = storeAnswer(
        c.env,
        (lesson as any).topic_id,
        (lesson as any).subject_id,
        (lesson as any).exam_type,
        question,
        content,
        model,
      );
      try {
        c.executionCtx.waitUntil(storePromise);
      } catch {
        await storePromise;
      }

      return c.json({
        success: true,
        data: {
          answer: content,
          interactionId,
          cached: false,
          remainingFreeToday: allowance.remaining === -1 ? -1 : allowance.remaining - 1,
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
    const limit = parseLimit(c, 10);

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
  type: 'rect' | 'circle' | 'line' | 'arrow' | 'text' | 'path' | 'polygon' | 'group' | 'primitive' | 'math';
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
    // Primitive commands: renderPrimitive(name, params) on the frontend
    name?: string;
    params?: Record<string, unknown>;
    // Math commands: LaTeX source rendered by the frontend math renderer
    latex?: string;
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

VISUAL PRIMITIVES (prefer these over raw shapes whenever one fits):
Use { "type": "primitive", "id": "...", "props": { "name": "<name>", "params": { ... } } }.
All primitives take a bounding box and compute every coordinate internally — never hand-place their parts.
- axes — params: { left, top, width, height, xLabel?, yLabel?, xMin?, xMax?, yMin?, yMax? } → arrowed axes + ticks + labels.
- functionPlot — axes params + { fn, color? }; fn is like "2x^2 - 3x + 1" or "sin(x)" (supports + - * / ^, parentheses, sin/cos/tan).
- numberLine — params: { left, top, width, min, max, marks?: number[] } → line + ticks + dots at marks.
- fractionBar — params: { left, top, width, height, numerator, denominator, color? } → bar split into denominator cells, first numerator shaded, "n/d" label. denominator 1-12, 0 <= numerator <= denominator.
- triangleFigure — params: { left, top, width, height, labels?: { angles?: [string,string,string], sides?: [string,string,string] } } → labeled triangle.
- tableGrid — params: { left, top, width, height, rows: string[][] } → grid with cell texts.
Math expressions go in "math" commands with LaTeX: { "type": "math", "id": "...", "props": { "left": 100, "top": 100, "latex": "\\frac{3}{4}" } } (latex max 200 chars).
RAW COMMAND PROPS (use only these exact keys):
- rect: left, top, width, height, fill, stroke, strokeWidth, opacity, angle, scaleX, scaleY
- circle: left, top, radius, fill, stroke, strokeWidth, opacity
- line/arrow: x1, y1, x2, y2, stroke, strokeWidth, opacity (never use from/to)
- text: left, top, text, fontSize, fontFamily, fontWeight, fill, textAlign, opacity
- path: left, top, path, fill, stroke, strokeWidth, opacity
- polygon: left, top, points (array of { x, y }), fill, stroke, strokeWidth, opacity

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

// Structured-output schema restricts the model to renderer-supported property
// names. Runtime validation below remains the final untrusted-output boundary.
const WHITEBOARD_COMMAND_PROPS_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    left: { type: 'number' },
    top: { type: 'number' },
    width: { type: 'number' },
    height: { type: 'number' },
    radius: { type: 'number' },
    x1: { type: 'number' },
    y1: { type: 'number' },
    x2: { type: 'number' },
    y2: { type: 'number' },
    strokeWidth: { type: 'number' },
    opacity: { type: 'number' },
    fontSize: { type: 'number' },
    angle: { type: 'number' },
    scaleX: { type: 'number' },
    scaleY: { type: 'number' },
    path: { type: 'string', maxLength: 10000 },
    fill: { type: 'string', maxLength: 10000 },
    stroke: { type: 'string', maxLength: 10000 },
    text: { type: 'string', maxLength: 10000 },
    fontFamily: { type: 'string', maxLength: 10000 },
    fontWeight: { type: 'string', maxLength: 10000 },
    textAlign: { type: 'string', maxLength: 10000 },
    color: { type: 'string', maxLength: 10000 },
    latex: { type: 'string', minLength: 1, maxLength: 200 },
    points: {
      type: 'array',
      minItems: 3,
      maxItems: 100,
      items: {
        type: 'object',
        properties: { x: { type: 'number' }, y: { type: 'number' } },
        required: ['x', 'y'],
        additionalProperties: false,
      },
    },
    name: { type: 'string', minLength: 1, maxLength: 100 },
    params: { type: 'object' },
  },
  additionalProperties: false,
};
// Structural validation of AI-generated whiteboard content. The model's JSON
// is untrusted: it must have the fields the renderer dereferences, every
// command must be a known type, and every numeric prop must be finite.
const WHITEBOARD_COMMAND_TYPE_VALUES = ['rect', 'circle', 'line', 'arrow', 'text', 'path', 'polygon', 'primitive', 'math'] as const;
const WHITEBOARD_COMMAND_TYPES = new Set<string>(WHITEBOARD_COMMAND_TYPE_VALUES);

// Cloudflare JSON Mode schema for the generation model. Keeping this shape
// beside the runtime validator makes structured-output drift visible in tests
// while the validator remains the final untrusted-output boundary.
const WHITEBOARD_COMMAND_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    type: { type: 'string', enum: [...WHITEBOARD_COMMAND_TYPE_VALUES] },
    id: { type: 'string', minLength: 1, maxLength: 100 },
    props: WHITEBOARD_COMMAND_PROPS_RESPONSE_SCHEMA,
  },
  required: ['type', 'id', 'props'],
};

const WHITEBOARD_STEP_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    stepNumber: { type: 'integer', minimum: 1, maximum: 6 },
    explanation: { type: 'string', minLength: 1, maxLength: 4000 },
    voiceOver: { type: 'string', minLength: 1, maxLength: 4000 },
    duration: { type: 'number', minimum: 1, maximum: 120 },
    commands: {
      type: 'array',
      minItems: 1,
      maxItems: 12,
      items: WHITEBOARD_COMMAND_RESPONSE_SCHEMA,
    },
    highlights: {
      type: 'array',
      maxItems: 12,
      items: { type: 'string', minLength: 1, maxLength: 100 },
    },
    clearPrevious: { type: 'boolean' },
  },
  required: ['stepNumber', 'explanation', 'voiceOver', 'duration', 'commands', 'highlights', 'clearPrevious'],
};

const WHITEBOARD_FUSED_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    outline: {
      type: 'array',
      minItems: 4,
      maxItems: 6,
      items: { type: 'string', minLength: 1, maxLength: 200 },
    },
    firstStep: WHITEBOARD_STEP_RESPONSE_SCHEMA,
  },
  required: ['outline', 'firstStep'],
};

const WHITEBOARD_NUMERIC_PROPS = new Set([
  'left', 'top', 'width', 'height', 'radius', 'x1', 'y1', 'x2', 'y2',
  'strokeWidth', 'opacity', 'fontSize', 'angle', 'scaleX', 'scaleY',
]);
const WHITEBOARD_STRING_PROPS = new Set([
  'path', 'fill', 'stroke', 'text', 'fontFamily', 'fontWeight', 'textAlign', 'color', 'latex',
]);
const WHITEBOARD_ALLOWED_PROPS: Record<string, ReadonlySet<string>> = {
  rect: new Set(['left', 'top', 'width', 'height', 'fill', 'stroke', 'strokeWidth', 'opacity', 'angle', 'scaleX', 'scaleY']),
  circle: new Set(['left', 'top', 'radius', 'fill', 'stroke', 'strokeWidth', 'opacity']),
  line: new Set(['x1', 'y1', 'x2', 'y2', 'stroke', 'strokeWidth', 'opacity']),
  arrow: new Set(['x1', 'y1', 'x2', 'y2', 'stroke', 'strokeWidth', 'opacity']),
  text: new Set(['left', 'top', 'text', 'fontSize', 'fontFamily', 'fontWeight', 'fill', 'textAlign', 'opacity']),
  path: new Set(['left', 'top', 'path', 'fill', 'stroke', 'strokeWidth', 'opacity']),
  polygon: new Set(['left', 'top', 'points', 'fill', 'stroke', 'strokeWidth', 'opacity']),
  primitive: new Set(['name', 'params']),
  math: new Set(['left', 'top', 'latex', 'fontSize', 'fontFamily', 'color', 'fill', 'opacity']),
};

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isBoundedPrimitiveParam(value: unknown, depth = 0): boolean {
  if (depth > 4) return false;
  if (value === null || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value) && Math.abs(value) <= 10000;
  if (typeof value === 'string') return value.length <= 1000;
  if (Array.isArray(value)) {
    return value.length <= 100 && value.every((item) => isBoundedPrimitiveParam(item, depth + 1));
  }
  if (!isPlainRecord(value)) return false;
  const entries = Object.entries(value);
  return entries.length <= 50 && entries.every(([key, item]) => (
    key.length > 0
    && key.length <= 100
    && isBoundedPrimitiveParam(item, depth + 1)
  ));
}

function hasValidWhiteboardProps(type: string, props: unknown): props is Record<string, unknown> {
  if (!isPlainRecord(props)) return false;
  const allowed = WHITEBOARD_ALLOWED_PROPS[type];
  if (!allowed) return false;
  for (const [key, value] of Object.entries(props)) {
    if (!allowed.has(key)) return false;
    if (WHITEBOARD_NUMERIC_PROPS.has(key)) {
      if (typeof value !== 'number' || !Number.isFinite(value) || Math.abs(value) > 10000) return false;
      continue;
    }
    if (WHITEBOARD_STRING_PROPS.has(key)) {
      if (typeof value !== 'string' || value.length > 10000) return false;
      continue;
    }
    if (key === 'points') {
      if (
        !Array.isArray(value)
        || value.length < 3
        || value.length > 100
        || !value.every((point) => (
          isPlainRecord(point)
          && Object.keys(point).length === 2
          && typeof point.x === 'number'
          && Number.isFinite(point.x)
          && Math.abs(point.x) <= 10000
          && typeof point.y === 'number'
          && Number.isFinite(point.y)
          && Math.abs(point.y) <= 10000
        ))
      ) return false;
      continue;
    }
    if (key === 'name') {
      if (typeof value !== 'string' || value.length === 0 || value.length > 100) return false;
      continue;
    }
    if (key === 'params' && !isBoundedPrimitiveParam(value)) return false;
  }
  if (
    'opacity' in props
    && (typeof props.opacity !== 'number' || props.opacity < 0 || props.opacity > 1)
  ) return false;
  for (const positiveProp of ['width', 'height', 'radius', 'strokeWidth', 'fontSize', 'scaleX', 'scaleY']) {
    if (positiveProp in props && (typeof props[positiveProp] !== 'number' || props[positiveProp] <= 0)) {
      return false;
    }
  }

  if (type === 'rect') {
    return typeof props.width === 'number' && props.width > 0
      && typeof props.height === 'number' && props.height > 0;
  }
  if (type === 'circle') return typeof props.radius === 'number' && props.radius > 0;
  if (type === 'line' || type === 'arrow') {
    const coordinates = [props.x1, props.y1, props.x2, props.y2];
    return coordinates.every((value) => typeof value === 'number' && Number.isFinite(value))
      && (props.x1 !== props.x2 || props.y1 !== props.y2);
  }
  if (type === 'text') {
    return typeof props.text === 'string' && props.text.trim().length > 0;
  }
  if (type === 'path') {
    return typeof props.path === 'string' && props.path.trim().length > 0;
  }
  if (type === 'primitive') return 'name' in props && 'params' in props;
  if (type === 'math') {
    return typeof props.latex === 'string' && props.latex.length > 0 && props.latex.length <= 200;
  }
  return true;
}
function isValidWhiteboardStep(
  step: unknown,
  expectedStepNumber?: number,
  requireComplete = false,
): step is WhiteboardStep {
  if (!step || typeof step !== 'object') return false;
  const s = step as Partial<WhiteboardStep>;
  if (!Number.isInteger(s.stepNumber) || (s.stepNumber as number) < 1 || (s.stepNumber as number) > 20) {
    return false;
  }
  if (expectedStepNumber !== undefined && s.stepNumber !== expectedStepNumber) return false;
  if (
    typeof s.explanation !== 'string'
    || s.explanation.length === 0
    || s.explanation.length > 4000
  ) return false;
  if (!Number.isFinite(s.duration) || (s.duration as number) < 1 || (s.duration as number) > 120) {
    return false;
  }
  if (
    s.voiceOver !== undefined
    && (typeof s.voiceOver !== 'string' || s.voiceOver.length === 0 || s.voiceOver.length > 4000)
  ) return false;
  if (requireComplete && typeof s.voiceOver !== 'string') return false;
  if (
    s.highlights !== undefined
    && (
      !Array.isArray(s.highlights)
      || s.highlights.length > 12
      || !s.highlights.every((id) => typeof id === 'string' && id.length > 0 && id.length <= 100)
    )
  ) return false;
  if (requireComplete && !Array.isArray(s.highlights)) return false;
  if (s.clearPrevious !== undefined && typeof s.clearPrevious !== 'boolean') return false;
  if (requireComplete && typeof s.clearPrevious !== 'boolean') return false;
  if (!Array.isArray(s.commands) || s.commands.length === 0 || s.commands.length > 12) return false;
  for (const cmd of s.commands) {
    if (
      !cmd
      || typeof cmd.id !== 'string'
      || cmd.id.length === 0
      || cmd.id.length > 100
      || !WHITEBOARD_COMMAND_TYPES.has(cmd.type)
    ) return false;
    if (!hasValidWhiteboardProps(cmd.type, cmd.props)) {
      console.error('Whiteboard command props rejected', {
        type: cmd.type,
        propKeys: isPlainRecord(cmd.props) ? Object.keys(cmd.props).slice(0, 30) : [],
      });
      return false;
    }
  }
  return true;
}

function isValidWhiteboardContent(c: unknown): c is WhiteboardTeachingContent {
  if (!c || typeof c !== 'object') return false;
  const content = c as Partial<WhiteboardTeachingContent>;
  if (typeof content.title !== 'string') return false;
  if (!content.canvasSize || typeof content.canvasSize.width !== 'number' || typeof content.canvasSize.height !== 'number') return false;
  if (typeof content.backgroundColor !== 'string') return false;
  if (!Array.isArray(content.steps) || content.steps.length === 0) return false;
  for (const step of content.steps) {
    if (!isValidWhiteboardStep(step)) return false;
  }
  return true;
}

// Global per-topic cache: whiteboard lessons are reused across all users and
// lessons for the same topic + lesson type. Rows live in
// revision_ai_interactions as type `whiteboard_<lessonType>` and are only
// ever written for validated, non-fallback content. The stored ai_message
// holds the progressive shape `{ outline: string[], steps: WhiteboardStep[] }`
// which fills in one step at a time; legacy rows hold a whole-lesson
// WhiteboardTeachingContent and are still tolerated on read.
interface CachedWhiteboardRow {
  id: string;
  ai_message: string;
}

interface ParsedWhiteboardCache {
  outline: string[];
  // Positional: index i holds step i, or null when that step has not been
  // generated yet (or failed validation in a stored row).
  steps: (WhiteboardStep | null)[];
}

async function getCachedWhiteboardRow(
  db: D1Database,
  topicId: string,
  lessonType: string
): Promise<CachedWhiteboardRow | null> {
  return db.prepare(`
    SELECT rai.id, rai.ai_message
    FROM revision_ai_interactions rai
    JOIN revision_lessons rl ON rai.lesson_id = rl.id
    WHERE rl.topic_id = ? AND rai.interaction_type = ?
    ORDER BY rai.created_at DESC
    LIMIT 1
  `).bind(topicId, `whiteboard_${lessonType}`).first<CachedWhiteboardRow>();
}

// Guarantee command ids are unique across the whole lesson: the frontend
// tracks drawn objects by command id, so the same id in two steps would
// silently drop drawing commands. Highlights reference command ids, so they
// are prefixed identically.
function prefixStepCommandIds(step: WhiteboardStep, stepIndex: number): WhiteboardStep {
  return {
    ...step,
    commands: step.commands.map((cmd) => ({ ...cmd, id: `s${stepIndex}-${cmd.id}` })),
    highlights: step.highlights?.map((id) => `s${stepIndex}-${id}`),
  };
}

// Parse a cached row into the progressive shape. Legacy whole-lesson rows are
// converted on the fly (their steps carry no titles, so the outline is
// synthesized) and their command ids are prefixed per step. Returns null for
// corrupt/invalid rows — callers treat that as a cache miss.
function parseCachedWhiteboard(aiMessage: string): ParsedWhiteboardCache | null {
  try {
    const parsed = JSON.parse(aiMessage) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;

    // Progressive shape written by the per-step protocol (outline + steps;
    // command ids were prefixed per step at write time).
    const maybeProgressive = parsed as { outline?: unknown; steps?: unknown };
    if (Array.isArray(maybeProgressive.outline) && Array.isArray(maybeProgressive.steps)) {
      const steps = maybeProgressive.steps.map((s) => (isValidWhiteboardStep(s) ? s : null));
      if (!steps.some(Boolean)) return null;
      const outline = maybeProgressive.outline.filter(
        (t): t is string => typeof t === 'string' && t.trim().length > 0
      );
      return { outline, steps };
    }

    // Legacy whole-lesson shape: convert on the fly (its steps carry no
    // titles, so the outline is synthesized) and prefix its command ids.
    if (isValidWhiteboardContent(parsed)) {
      return {
        outline: parsed.steps.map((_, i) => `Step ${i + 1}`),
        steps: parsed.steps.map((step, i) => prefixStepCommandIds(step, i)),
      };
    }
    return null;
  } catch {
    return null;
  }
}

// Merge one generated step into the per-topic progressive cache row. The row
// is created on the first successful step (keyed to the requesting lesson)
// and updated in place as later steps fill in, so the single-row lookup
// keeps working.
async function upsertProgressiveWhiteboardCache(
  db: D1Database,
  topicId: string,
  lessonType: string,
  lessonId: string,
  userId: string,
  outline: string[],
  stepIndex: number,
  step: WhiteboardStep,
  tokensUsed: number | null
): Promise<void> {
  const existing = await getCachedWhiteboardRow(db, topicId, lessonType);

  let mergedOutline = outline;
  let mergedSteps: (WhiteboardStep | null)[] = [];
  if (existing) {
    const parsed = parseCachedWhiteboard(existing.ai_message);
    if (parsed) {
      mergedSteps = parsed.steps;
      if (parsed.outline.length > 0) mergedOutline = parsed.outline;
    }
  }
  mergedSteps = [...mergedSteps];
  mergedSteps[stepIndex] = step;

  const payload = JSON.stringify({ outline: mergedOutline, steps: mergedSteps });

  if (existing) {
    await db.prepare(`
      UPDATE revision_ai_interactions
      SET ai_message = ?, tokens_used = ?
      WHERE id = ?
    `).bind(payload, tokensUsed, existing.id).run();
  } else {
    await db.prepare(`
      INSERT INTO revision_ai_interactions (
        id, lesson_id, user_id, interaction_type, ai_message, tokens_used, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      generateId('wb_interaction'), lessonId, userId, `whiteboard_${lessonType}`,
      payload, tokensUsed, new Date().toISOString()
    ).run();
  }
}

// Per-lesson-type creative guidance, shared by the outline and step prompts.
function getWhiteboardLessonTypeInstructions(lessonType: string): string {
  const instructions: Record<string, string> = {
    'diagram': `Create a labeled diagram explaining the supplied topic. Include:
- Main diagram with clear labels
- Arrows pointing to key parts
- Brief text explanations for each component
- A title and summary`,

    'step-by-step': `Create a step-by-step visual explanation of the supplied topic. Include:
- Start with the concept name/title
- Break down into 4-6 clear steps
- Each step builds on the previous
- Use shapes and arrows to show progression
- End with a summary/key points`,

    'problem-solving': `Create a worked example solving a problem related to the supplied topic. Include:
- The problem statement at the top
- Step-by-step solution with calculations
- Highlight each step as you work through
- Use colors to distinguish steps
- Show the final answer prominently`,

    'concept-map': `Create a concept map/mind map for the supplied topic. Include:
- Central concept in the middle
- Related sub-concepts branching out
- Connecting lines with relationship labels
- Use different colors for different branches
- Keep it organized and readable`,
  };
  return instructions[lessonType] || instructions['step-by-step'];
}

// Generic outline used when outline generation fails — honest, and the
// per-step fallback keeps every one of these titles renderable.
const WHITEBOARD_FALLBACK_OUTLINE = ['Introduction', 'Core concepts', 'Worked example', 'Practice tips', 'Summary'];

// Outline shape rule: 4-6 non-empty titles, trimmed.
function parseWhiteboardOutline(v: unknown): string[] | null {
  if (!Array.isArray(v) || v.length < 4 || v.length > 6) return null;
  if (!v.every((t) => typeof t === 'string' && t.trim().length > 0 && t.trim().length <= 200)) return null;
  return v.map((t) => (t as string).trim());
}

// Fused cold-path generation (Phase C Task 6): ONE AI call produces both the
// lesson outline and its first step, halving cold TTFS. On partial failure
// (valid outline, broken step) step 0 is retried with a dedicated second
// call; on total failure the generic fallback outline + fallback step are
// returned (flagged, never cached).
async function generateWhiteboardOutlineAndFirstStep(
  env: Env,
  topic: string,
  subject: string,
  examType: string,
  lessonType: 'diagram' | 'step-by-step' | 'problem-solving' | 'concept-map'
): Promise<{ outline: string[]; step: WhiteboardStep; usedFallback: boolean; tokensUsed: number | null }> {
  const systemPrompt = `${WHITEBOARD_TEACHING_PROMPT}

${getWhiteboardLessonTypeInstructions(lessonType)}

Output ONE JSON object only — the lesson outline AND its first step together — in this exact format:
{
  "outline": ["4-6 step titles"],
  "firstStep": {
    "stepNumber": 1,
    "explanation": "What the student should understand from this step",
    "voiceOver": "What to say while showing this step",
    "duration": 5,
    "commands": [ { "type": "text", "id": "title1", "props": { "left": 100, "top": 50, "text": "Title Text", "fontSize": 32, "fontWeight": "bold", "fill": "#1e40af" } } ],
    "highlights": [],
    "clearPrevious": false
  }
}
The first step ONLY opens the lesson for the first outline title — keep it light: at most 6 commands (a title plus a few elements). Later steps carry the detail. Canvas is 1200x800.
${UNTRUSTED_AI_DATA_INSTRUCTION}`;

  try {
    const model = getGenerationModel(env);

    const result = await env.AI.run(model, {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: formatUntrustedAiData('Whiteboard lesson context', { topic, subject, examType, lessonType }) },
      ],
      max_tokens: 1600,
      temperature: 0.2,
      response_format: {
        type: 'json_schema',
        json_schema: WHITEBOARD_FUSED_RESPONSE_SCHEMA,
      },
    });

    const raw: unknown = typeof result === 'object' && result !== null && 'response' in result
      ? (result as { response: unknown }).response
      : result;

    const tokensUsed =
      typeof result === 'object' && result !== null && 'usage' in result
        ? ((result as { usage?: { total_tokens?: number } }).usage?.total_tokens ?? null)
        : null;

    // Workers AI returns `response` as a string normally, but as ALREADY-PARSED
    // JSON when the model output is bare valid JSON (llama fp8-fast does this).
    const candidate = typeof raw === 'string' ? raw.match(/\{[\s\S]*\}/)?.[0] : raw;
    const parsed = candidate
      ? ((typeof candidate === 'string' ? JSON.parse(candidate) : candidate) as { outline?: unknown; firstStep?: unknown })
      : null;

    const outline = parseWhiteboardOutline(parsed?.outline);
    if (outline) {
      if (isValidWhiteboardStep(parsed?.firstStep, 1, true)) {
        return { outline, step: prefixStepCommandIds(parsed.firstStep, 0), usedFallback: false, tokensUsed };
      }
      // Partial failure: the outline is good — retry only step 0 with the
      // dedicated per-step call before resorting to the fallback step.
      console.error('Fused outline+step: first step failed validation — generating it separately');
      const stepResult = await generateWhiteboardStep(env, topic, subject, examType, lessonType, outline, 0);
      const combinedTokens = tokensUsed !== null || stepResult.tokensUsed !== null
        ? (tokensUsed ?? 0) + (stepResult.tokensUsed ?? 0)
        : null;
      return { outline, step: stepResult.step, usedFallback: stepResult.usedFallback, tokensUsed: combinedTokens };
    }

    console.error('Fused outline+step failed validation — using fallback');
    throw new Error('Failed to parse fused whiteboard outline');
  } catch (error) {
    console.error('Error generating fused whiteboard outline+first step:', error);
    const outline = [...WHITEBOARD_FALLBACK_OUTLINE];
    return {
      outline,
      step: prefixStepCommandIds(getFallbackWhiteboardStep(topic, outline, 0), 0),
      usedFallback: true,
      tokensUsed: null,
    };
  }
}

// Minimal generic step used when generation of one step fails — only that
// step is flagged as fallback, the rest of the lesson is unaffected. Command
// ids are prefixed by the caller like any generated step.
function getFallbackWhiteboardStep(topic: string, outline: string[], stepIndex: number): WhiteboardStep {
  const title = outline[stepIndex] || topic;
  return {
    stepNumber: stepIndex + 1,
    explanation: `Let's look at ${title}.`,
    voiceOver: `In this step, we'll cover ${title} as part of our lesson on ${topic}.`,
    duration: 6,
    commands: [
      {
        type: 'text',
        id: 'heading',
        props: {
          left: 600,
          top: 80,
          text: title,
          fontSize: 36,
          fontWeight: 'bold',
          fill: '#1e40af',
          textAlign: 'center',
        },
      },
      {
        type: 'text',
        id: 'body',
        props: {
          left: 150,
          top: 200,
          text: `Key ideas about ${topic}.`,
          fontSize: 20,
          fill: '#000000',
        },
      },
    ],
    highlights: [],
    clearPrevious: false,
  };
}

// Generate ONE whiteboard step, guided by the outline and its position.
async function generateWhiteboardStep(
  env: Env,
  topic: string,
  subject: string,
  examType: string,
  lessonType: 'diagram' | 'step-by-step' | 'problem-solving' | 'concept-map',
  outline: string[],
  stepIndex: number
): Promise<{ step: WhiteboardStep; usedFallback: boolean; tokensUsed: number | null }> {
  const systemPrompt = `${WHITEBOARD_TEACHING_PROMPT}

${getWhiteboardLessonTypeInstructions(lessonType)}
${UNTRUSTED_AI_DATA_INSTRUCTION}

Output ONE JSON step object only — not a whole lesson — in this exact format:
{
  "stepNumber": ${stepIndex + 1},
  "explanation": "What the student should understand from this step",
  "voiceOver": "What to say while showing this step",
  "duration": 5,
  "commands": [ { "type": "text", "id": "title1", "props": { "left": 100, "top": 50, "text": "Title Text", "fontSize": 32, "fontWeight": "bold", "fill": "#1e40af" } } ],
  "highlights": [],
  "clearPrevious": false
}
Canvas is 1200x800. Keep commands under 12.`;

  const model = getGenerationModel(env);
  let totalTokens = 0;
  let hasTokenUsage = false;
  let lastError: unknown = new Error('Whiteboard generation did not run');

  // Structured generation is probabilistic even with JSON schema enabled.
  // Retry once on a transport, parse, or validation failure; invalid content is
  // never cached, and two failed attempts still degrade honestly to fallback.
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const result = await env.AI.run(model, {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: formatUntrustedAiData('Whiteboard step context', {
            topic, subject, examType, lessonType, outline, stepIndex,
          }) },
        ],
        max_tokens: 1800,
        temperature: 0.2,
        response_format: {
          type: 'json_schema',
          json_schema: {
            ...WHITEBOARD_STEP_RESPONSE_SCHEMA,
            properties: {
              ...WHITEBOARD_STEP_RESPONSE_SCHEMA.properties,
              stepNumber: { type: 'integer', enum: [stepIndex + 1] },
            },
          },
        },
      });

      const raw: unknown = typeof result === 'object' && result !== null && 'response' in result
        ? (result as { response: unknown }).response
        : result;
      const attemptTokens =
        typeof result === 'object' && result !== null && 'usage' in result
          ? ((result as { usage?: { total_tokens?: number } }).usage?.total_tokens ?? null)
          : null;
      if (attemptTokens !== null) {
        totalTokens += attemptTokens;
        hasTokenUsage = true;
      }

      // Workers AI returns `response` as a string normally, but as already
      // parsed JSON when the model output is bare valid JSON.
      const candidate = typeof raw === 'string' ? raw.match(/\{[\s\S]*\}/)?.[0] : raw;
      if (candidate) {
        const parsedCandidate = (typeof candidate === 'string' ? JSON.parse(candidate) : candidate) as unknown;
        // Step position is selected and authorized by the server route, not by
        // generated content. Normalize that metadata while validating every
        // generated presentation field unchanged.
        const parsed = isPlainRecord(parsedCandidate) ? { ...parsedCandidate, stepNumber: stepIndex + 1 } : parsedCandidate;
        if (isValidWhiteboardStep(parsed, stepIndex + 1, true)) {
          return {
            step: prefixStepCommandIds(parsed, stepIndex),
            usedFallback: false,
            tokensUsed: hasTokenUsage ? totalTokens : null,
          };
        }

        const parsedRecord = isPlainRecord(parsed) ? parsed : {};
        const commands = Array.isArray(parsedRecord.commands) ? parsedRecord.commands : [];
        console.error('Whiteboard step shape rejected', {
          expectedStepNumber: stepIndex + 1,
          stepNumber: typeof parsedRecord.stepNumber === 'number' ? parsedRecord.stepNumber : typeof parsedRecord.stepNumber,
          explanation: typeof parsedRecord.explanation === 'string' ? parsedRecord.explanation.length : typeof parsedRecord.explanation,
          voiceOver: typeof parsedRecord.voiceOver === 'string' ? parsedRecord.voiceOver.length : typeof parsedRecord.voiceOver,
          duration: typeof parsedRecord.duration === 'number' ? parsedRecord.duration : typeof parsedRecord.duration,
          commandCount: commands.length,
          commandShapes: commands.slice(0, 12).map((command) => (
            isPlainRecord(command)
              ? {
                  type: typeof command.type === 'string' ? command.type : typeof command.type,
                  propKeys: isPlainRecord(command.props) ? Object.keys(command.props).slice(0, 30) : [],
                }
              : { type: typeof command, propKeys: [] }
          )),
          highlightCount: Array.isArray(parsedRecord.highlights) ? parsedRecord.highlights.length : typeof parsedRecord.highlights,
          clearPrevious: typeof parsedRecord.clearPrevious,
        });
      } else {
        console.error('Whiteboard step response contained no JSON object', {
          rawType: typeof raw,
          rawLength: typeof raw === 'string' ? raw.length : null,
        });
      }
      lastError = new Error('Failed to validate whiteboard step');
    } catch (error) {
      console.error('Whiteboard step attempt could not be parsed', {
        attempt,
        errorType: error instanceof Error ? error.name : typeof error,
      });
      lastError = error;
    }

    if (attempt === 1) {
      console.error(`Whiteboard step ${stepIndex} generation failed validation — retrying once`);
    }
  }

  console.error(`Error generating whiteboard step ${stepIndex} after retry:`, lastError);
  return {
    step: prefixStepCommandIds(getFallbackWhiteboardStep(topic, outline, stepIndex), stepIndex),
    usedFallback: true,
    tokensUsed: null,
  };
}
// API Endpoint: Generate AI whiteboard teaching content (progressive per-step protocol)
revisionClassroomApp.post('/lessons/:lessonId/whiteboard-teach', async (c) => {
  try {
    const user = c.get('user');
    const lessonId = c.req.param('lessonId');
    const body = await c.req.json();
    const { lessonType = 'step-by-step', stepIndex, outline } = body as {
      lessonType?: 'diagram' | 'step-by-step' | 'problem-solving' | 'concept-map';
      stepIndex?: number;
      outline?: string[];
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

    // Premium-only feature — reject before any AI generation cost is incurred.
    if (!(await isPremiumUser(user.userId, c.env.DB))) {
      return c.json({
        success: false,
        error: 'The AI Whiteboard is a premium feature. Upgrade to watch the teacher draw and explain.',
        upgradeRequired: true,
      }, 403);
    }

    const topicName = (lesson as any).topic_name || 'this topic';
    const subjectName = (lesson as any).subject_name || 'this subject';
    const examType = (lesson as any).exam_type || 'wassce';

    // Global per-topic cache: hits skip generation entirely and cache writes
    // only ever store validated, non-fallback steps. Topic-less lessons
    // bypass the cache.
    const topicId = (lesson as any).topic_id as string | null;

    // --- Step request: generate (or serve) one step of a known outline ---
    if (typeof stepIndex === 'number' && stepIndex > 0) {
      if (
        !Number.isInteger(stepIndex) ||
        !Array.isArray(outline) ||
        outline.length === 0 ||
        !outline.every((t) => typeof t === 'string' && t.trim().length > 0) ||
        stepIndex >= outline.length
      ) {
        return c.json({
          success: false,
          error: 'Step requests require the lesson outline and a stepIndex within it',
        }, 400);
      }
      const cleanOutline = outline.map((t) => t.trim());

      if (topicId) {
        const row = await getCachedWhiteboardRow(c.env.DB, topicId, lessonType);
        const cachedStep = row ? parseCachedWhiteboard(row.ai_message)?.steps[stepIndex] : null;
        if (cachedStep) {
          return c.json({
            success: true,
            data: { step: cachedStep, stepIndex, totalSteps: cleanOutline.length, fallback: false, cached: true },
          });
        }
      }

      const { step, usedFallback, tokensUsed } = await generateWhiteboardStep(
        c.env, topicName, subjectName, examType, lessonType, cleanOutline, stepIndex
      );

      if (!usedFallback && topicId) {
        await upsertProgressiveWhiteboardCache(
          c.env.DB, topicId, lessonType, lessonId, user.userId, cleanOutline, stepIndex, step, tokensUsed
        );
      }

      return c.json({
        success: true,
        data: { step, stepIndex, totalSteps: cleanOutline.length, fallback: usedFallback, cached: false },
      });
    }

    // --- Outline request: outline plus step 0 in one round trip ---
    if (topicId) {
      const row = await getCachedWhiteboardRow(c.env.DB, topicId, lessonType);
      const cached = row ? parseCachedWhiteboard(row.ai_message) : null;
      const firstStep = cached?.steps[0];
      if (cached && firstStep) {
        const cachedOutline = cached.outline.length > 0
          ? cached.outline
          : cached.steps.map((_, i) => `Step ${i + 1}`);
        return c.json({
          success: true,
          data: {
            outline: cachedOutline,
            totalSteps: cachedOutline.length,
            step: firstStep,
            stepIndex: 0,
            fallback: false,
            cached: true,
          },
        });
      }
    }

    // Cold path: ONE fused AI call produces the outline and step 0 together.
    const fused = await generateWhiteboardOutlineAndFirstStep(c.env, topicName, subjectName, examType, lessonType);

    // Only fully-generated lessons enter the cache, so fallback content
    // never poisons it.
    if (!fused.usedFallback && topicId) {
      await upsertProgressiveWhiteboardCache(
        c.env.DB, topicId, lessonType, lessonId, user.userId,
        fused.outline, 0, fused.step, fused.tokensUsed
      );
    }

    return c.json({
      success: true,
      data: {
        outline: fused.outline,
        totalSteps: fused.outline.length,
        step: fused.step,
        stepIndex: 0,
        fallback: fused.usedFallback,
        cached: false,
      },
    });
  } catch (error) {
    console.error('Error generating whiteboard content:', error);
    return c.json({ success: false, error: 'Failed to generate whiteboard content' }, 500);
  }
});

// =============================================
// CHECK MY WORK (Phase C) — vision grading with spatial annotations
// =============================================

type CheckWorkVerdict = 'correct' | 'partial' | 'incorrect' | 'unknown';

interface CheckWorkAnnotation {
  type: 'circle' | 'arrow' | 'text' | 'rect';
  id: string;
  props: Record<string, unknown>;
}

interface CheckWorkGrade {
  verdict: CheckWorkVerdict;
  explanation: string;
  voiceOver: string;
  annotations: CheckWorkAnnotation[];
}

const CHECK_WORK_MAX_IMAGE_CHARS = 700_000;
const CHECK_WORK_ANNOTATION_TYPES = new Set(['circle', 'arrow', 'text', 'rect']);
// Canvas-space props: clamped in place after validation (never rejected).
const CHECK_WORK_X_PROPS = new Set(['left', 'x1', 'x2', 'cx']);
const CHECK_WORK_Y_PROPS = new Set(['top', 'y1', 'y2', 'cy']);
const CHECK_WORK_W_PROPS = new Set(['width', 'radius']);
const CHECK_WORK_H_PROPS = new Set(['height']);

// Honest payload served whenever vision grading is unavailable or the model
// output fails validation — never a fabricated verdict.
const CHECK_WORK_FALLBACK: CheckWorkGrade = {
  verdict: 'unknown',
  explanation: "I couldn't read the work clearly — try darker ink or a clearer photo of the page.",
  voiceOver: '',
  annotations: [],
};

// guided_json is verified honored by the vision model (vision spike results),
// so the annotation schema is passed alongside the prompt.
const CHECK_WORK_GUIDED_SCHEMA = {
  type: 'object',
  properties: {
    verdict: { type: 'string', enum: ['correct', 'partial', 'incorrect'] },
    explanation: { type: 'string' },
    voiceOver: { type: 'string' },
    annotations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['circle', 'arrow', 'text', 'rect'] },
          id: { type: 'string' },
          props: { type: 'object' },
        },
        required: ['type', 'id', 'props'],
      },
    },
  },
  required: ['verdict', 'explanation', 'voiceOver', 'annotations'],
};

// Structural validation of the model's grading JSON. Verdict must be a known
// enum (not 'unknown' — that value is reserved for the honest fallback);
// annotations are capped at 8, whitelisted to circle/arrow/text/rect, every
// numeric prop must be finite. Coordinate props are then CLAMPED in place to
// the image bounds (clamping, not rejection, for out-of-bounds values). The
// bounds default to the 1200x800 whiteboard canvas; photos of paper work
// pass their own pixel dims (Task 5).
function isValidAnnotationSet(v: unknown, imageWidth = 1200, imageHeight = 800): v is CheckWorkGrade {
  if (!v || typeof v !== 'object') return false;
  const g = v as Partial<CheckWorkGrade>;
  if (g.verdict !== 'correct' && g.verdict !== 'partial' && g.verdict !== 'incorrect') return false;
  if (typeof g.explanation !== 'string' || typeof g.voiceOver !== 'string') return false;
  if (!Array.isArray(g.annotations) || g.annotations.length > 8) return false;

  for (const ann of g.annotations) {
    if (!ann || typeof ann !== 'object') return false;
    if (!CHECK_WORK_ANNOTATION_TYPES.has(ann.type)) return false;
    if (typeof ann.id !== 'string' || ann.id.trim().length === 0) return false;
    if (!ann.props || typeof ann.props !== 'object' || Array.isArray(ann.props)) return false;
    for (const val of Object.values(ann.props)) {
      if (typeof val === 'number' && !Number.isFinite(val)) return false;
    }
  }

  for (const ann of g.annotations) {
    for (const [key, val] of Object.entries(ann.props)) {
      if (typeof val !== 'number') continue;
      if (CHECK_WORK_X_PROPS.has(key) || CHECK_WORK_W_PROPS.has(key)) {
        ann.props[key] = Math.min(imageWidth, Math.max(0, val));
      } else if (CHECK_WORK_Y_PROPS.has(key) || CHECK_WORK_H_PROPS.has(key)) {
        ann.props[key] = Math.min(imageHeight, Math.max(0, val));
      }
    }
  }
  return true;
}

// Server-side id prefix: annotations render on the lesson canvas as a
// transient layer tracked by the `annot-` prefix (auto-cleared by the
// frontend). Duplicates are suffixed so every command id is unique.
function prefixAnnotationIds(annotations: CheckWorkAnnotation[]): void {
  const seen = new Set<string>();
  for (const ann of annotations) {
    let id = ann.id.startsWith('annot-') ? ann.id : `annot-${ann.id}`;
    while (seen.has(id)) id = `${id}-x`;
    seen.add(id);
    ann.id = id;
  }
}

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// The current step's explanation is the problem context for the marking
// prompt. It comes from the progressive whiteboard cache row (any lesson
// type) when one exists for this topic; absence is fine.
async function getWhiteboardStepContext(
  db: D1Database,
  topicId: string,
  stepIndex: number
): Promise<string | null> {
  const row = await db.prepare(`
    SELECT rai.ai_message
    FROM revision_ai_interactions rai
    JOIN revision_lessons rl ON rai.lesson_id = rl.id
    WHERE rl.topic_id = ? AND rai.interaction_type LIKE 'whiteboard_%'
    ORDER BY rai.created_at DESC
    LIMIT 1
  `).bind(topicId).first<{ ai_message: string }>();
  if (!row) return null;
  return parseCachedWhiteboard(row.ai_message)?.steps[stepIndex]?.explanation ?? null;
}

// API Endpoint: Grade a snapshot of the student's work on the whiteboard
// (premium-only). Only correct verdicts are cached — keyed by the image hash
// in user_response — because wrong-work feedback is unique per attempt.
revisionClassroomApp.post('/lessons/:lessonId/check-work', async (c) => {
  // Premium-only feature — reject before any AI generation cost is incurred.
  const user = c.get('user');
  if (!(await isPremiumUser(user.userId, c.env.DB))) {
    return c.json({
      success: false,
      error: 'Checking your work with the AI teacher is a premium feature. Upgrade to have your work marked.',
      upgradeRequired: true,
    }, 403);
  }

  const lessonId = c.req.param('lessonId');
  const body = await c.req.json().catch(() => null);
  const imageBase64 = body?.imageBase64;
  if (!imageBase64 || typeof imageBase64 !== 'string') {
    return c.json({ success: false, error: 'imageBase64 is required' }, 400);
  }
  if (imageBase64.length > CHECK_WORK_MAX_IMAGE_CHARS) {
    return c.json({ success: false, error: 'Image too large (max ~500KB)' }, 413);
  }
  const stepIndex = typeof body?.stepIndex === 'number' && Number.isInteger(body.stepIndex) && body.stepIndex >= 0
    ? (body.stepIndex as number)
    : undefined;
  // Photos of paper work (Task 5) declare their own pixel dims; annotations
  // for them live in that coordinate space instead of the 1200x800 canvas.
  const isPhoto = body?.imageWidth !== undefined || body?.imageHeight !== undefined;
  const imageWidth = body?.imageWidth === undefined ? 1200 : body.imageWidth;
  const imageHeight = body?.imageHeight === undefined ? 800 : body.imageHeight;
  if (!Number.isInteger(imageWidth) || imageWidth < 100 || imageWidth > 2000 ||
      !Number.isInteger(imageHeight) || imageHeight < 100 || imageHeight > 2000) {
    return c.json({ success: false, error: 'imageWidth/imageHeight must be integers between 100 and 2000' }, 400);
  }

  // Same lesson join as whiteboard-teach: topic/subject/exam from the row.
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
  const topicId = (lesson as any).topic_id as string | null;

  // Correct-verdict cache: identical work already marked correct is served
  // without an AI call. Incorrect/partial verdicts are never cached. A cache
  // lookup failure degrades to a fresh grading call — it must never 500 the
  // endpoint.
  const imageHash = await sha256Hex(imageBase64);
  let cachedRow: { ai_message: string } | null = null;
  try {
    cachedRow = await c.env.DB.prepare(`
      SELECT ai_message FROM revision_ai_interactions
      WHERE lesson_id = ? AND interaction_type = 'checkwork_correct' AND user_response = ?
      ORDER BY created_at DESC
      LIMIT 1
    `).bind(lessonId, imageHash).first<{ ai_message: string }>();
  } catch (error) {
    console.error('Check-work cache lookup failed — grading fresh:', error);
  }

  if (cachedRow) {
    try {
      const cachedPayload = JSON.parse(cachedRow.ai_message) as CheckWorkGrade;
      return c.json({
        success: true,
        data: { ...cachedPayload, cached: true, fallback: false },
      });
    } catch {
      // Corrupt cache row — fall through to a fresh grading call.
    }
  }

  const stepContext = topicId !== null && stepIndex !== undefined
    ? await getWhiteboardStepContext(c.env.DB, topicId, stepIndex).catch(() => null)
    : null;

  const imageDescription = isPhoto
    ? `The attached image is a ${imageWidth}x${imageHeight} px photo of the student's handwritten work on paper.`
    : `The attached image is a 1200x800 whiteboard snapshot: the lesson content plus the student's own handwritten work on it.`;

  const prompt = `You are an expert ${examType.toUpperCase()} teacher marking a student's handwritten work on "${topicName}" (${subjectName}).
${stepContext ? `The current lesson step is about: "${stepContext}". Use it as the problem context.` : ''}
${imageDescription}

CRITICAL: Read the student's WRITTEN work verbatim — transcribe exactly what is written, even where it is mathematically wrong. Do NOT auto-correct what you read toward the right answer; mark what is actually on the page.

Mark the work and respond with ONLY JSON in this exact shape:
{
  "verdict": "correct" | "partial" | "incorrect",
  "explanation": "at most 80 words, warm teacher tone",
  "voiceOver": "at most 40 words of spoken feedback",
  "annotations": [
    { "type": "circle" | "arrow" | "text" | "rect", "id": "a1", "props": { "...canvas coordinates..." } }
  ]
}
Annotations must point AT the work: circle the exact wrong term ({ left, top, radius, stroke }), arrow to the line where the error starts ({ x1, y1, x2, y2, stroke }), text labels of at most 4 words ({ left, top, text, fontSize, fill }), rect around a whole region ({ left, top, width, height, stroke }). The image is ${imageWidth}x${imageHeight} px — annotate in that coordinate space. Provide 2-6 annotations (use 0 only when nothing useful can be marked).`;

  try {
    const model = getVisionModel(c.env);
    const result: unknown = await c.env.AI.run(model as never, {
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:image/png;base64,${imageBase64}` } },
          ],
        },
      ],
      max_tokens: 1200,
      guided_json: CHECK_WORK_GUIDED_SCHEMA,
    } as never);

    // The runtime shape is { response: string } — always unwrap, never cast.
    const text = unwrapAiText(result);
    const candidate = text.match(/\{[\s\S]*\}/)?.[0];
    const parsed = candidate ? (JSON.parse(candidate) as unknown) : null;

    if (!parsed || !isValidAnnotationSet(parsed, imageWidth, imageHeight)) {
      console.error('Check-work output failed validation — serving honest fallback');
      throw new Error('Invalid check-work response');
    }

    prefixAnnotationIds(parsed.annotations);
    const grade: CheckWorkGrade = {
      verdict: parsed.verdict,
      explanation: parsed.explanation,
      voiceOver: parsed.voiceOver,
      annotations: parsed.annotations,
    };

    if (grade.verdict === 'correct') {
      await c.env.DB.prepare(`
        INSERT INTO revision_ai_interactions (
          id, lesson_id, user_id, interaction_type, ai_message, user_response, tokens_used, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        generateId('checkwork'), lessonId, user.userId, 'checkwork_correct',
        JSON.stringify(grade), imageHash, null, new Date().toISOString()
      ).run();
    }

    return c.json({
      success: true,
      data: { ...grade, cached: false, fallback: false },
    });
  } catch (error) {
    console.error('Check-work vision grading failed:', error);
    return c.json({
      success: true,
      data: { ...CHECK_WORK_FALLBACK, cached: false, fallback: true },
    });
  }
});

// =============================================
// POINT-AND-ASK (Phase C) — "what does THIS mean?"
// =============================================

interface AskAboutAnnotation {
  type: 'circle';
  id: string;
  props: Record<string, unknown>;
}

interface AskAboutAnswer {
  answer: string;
  annotation: AskAboutAnnotation | null;
}

const ASK_ABOUT_MAX_QUESTION_CHARS = 300;

// Honest payload served whenever the vision call is unavailable or the model
// output fails validation.
const ASK_ABOUT_FALLBACK: AskAboutAnswer = {
  answer: "I couldn't make out that spot — try asking in chat instead.",
  annotation: null,
};

// guided_json requires a JSON-mode-supported vision model.
const ASK_ABOUT_ANNOTATION_PROP_KEYS = new Set([
  'left', 'top', 'radius', 'stroke', 'strokeWidth', 'fill', 'opacity',
]);

const ASK_ABOUT_GUIDED_SCHEMA = {
  type: 'object',
  properties: {
    answer: { type: 'string', minLength: 1, maxLength: 4000 },
    annotation: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['circle'] },
        id: { type: 'string', minLength: 1, maxLength: 100 },
        props: {
          type: 'object',
          properties: {
            left: { type: 'number' },
            top: { type: 'number' },
            radius: { type: 'number', exclusiveMinimum: 0, maximum: 600 },
            stroke: { type: 'string', maxLength: 100 },
            strokeWidth: { type: 'number', exclusiveMinimum: 0, maximum: 100 },
            fill: { type: 'string', maxLength: 100 },
            opacity: { type: 'number', minimum: 0, maximum: 1 },
          },
          required: ['left', 'top', 'radius'],
          additionalProperties: false,
        },
      },
      required: ['type', 'id', 'props'],
      additionalProperties: false,
    },
  },
  required: ['answer'],
  additionalProperties: false,
};

// Structural validation of the model's answer JSON. The annotation is
// optional but, when present, must be a bounded circle. Coordinate props are
// clamped in place to the 1200x800 canvas.
function isValidAskAboutResponse(v: unknown): v is { answer: string; annotation?: AskAboutAnnotation } {
  if (!isPlainRecord(v)) return false;
  if (typeof v.answer !== 'string' || v.answer.trim().length === 0 || v.answer.length > 4000) return false;
  if (v.annotation === undefined || v.annotation === null) return true;
  if (!isPlainRecord(v.annotation)) return false;

  const ann = v.annotation;
  if (Object.keys(ann).some((key) => !['type', 'id', 'props'].includes(key))) return false;
  if (ann.type !== 'circle') return false;
  if (typeof ann.id !== 'string' || ann.id.trim().length === 0 || ann.id.length > 100) return false;
  if (!isPlainRecord(ann.props)) return false;
  if (
    typeof ann.props.left !== 'number'
    || typeof ann.props.top !== 'number'
    || typeof ann.props.radius !== 'number'
  ) return false;

  if (ann.props.radius <= 0 || ann.props.radius > 600) return false;
  if (
    ann.props.strokeWidth !== undefined
    && (
      typeof ann.props.strokeWidth !== 'number'
      || ann.props.strokeWidth <= 0
      || ann.props.strokeWidth > 100
    )
  ) return false;
  if (
    ann.props.opacity !== undefined
    && (typeof ann.props.opacity !== 'number' || ann.props.opacity < 0 || ann.props.opacity > 1)
  ) return false;
  for (const [key, val] of Object.entries(ann.props)) {
    if (!ASK_ABOUT_ANNOTATION_PROP_KEYS.has(key)) return false;
    if (typeof val === 'number') {
      if (!Number.isFinite(val) || Math.abs(val) > 10000) return false;
    } else if (typeof val === 'string') {
      if (val.length > 100) return false;
    } else {
      return false;
    }
  }

  for (const [key, val] of Object.entries(ann.props)) {
    if (typeof val !== 'number') continue;
    if (CHECK_WORK_X_PROPS.has(key) || CHECK_WORK_W_PROPS.has(key)) {
      ann.props[key] = Math.min(1200, Math.max(0, val));
    } else if (CHECK_WORK_Y_PROPS.has(key) || CHECK_WORK_H_PROPS.has(key)) {
      ann.props[key] = Math.min(800, Math.max(0, val));
    }
  }
  return true;
}
// API Endpoint: Answer a question about the exact spot the student tapped on
// the whiteboard (premium-only). Never cached — every tap/question is unique.
revisionClassroomApp.post('/lessons/:lessonId/ask-about', async (c) => {
  // Premium-only feature — reject before any AI generation cost is incurred.
  const user = c.get('user');
  if (!(await isPremiumUser(user.userId, c.env.DB))) {
    return c.json({
      success: false,
      error: 'Asking the AI teacher about a spot on the board is a premium feature. Upgrade to point and ask.',
      upgradeRequired: true,
    }, 403);
  }

  const lessonId = c.req.param('lessonId');
  const body = await c.req.json().catch(() => null);
  const imageBase64 = body?.imageBase64;
  if (!imageBase64 || typeof imageBase64 !== 'string') {
    return c.json({ success: false, error: 'imageBase64 is required' }, 400);
  }
  if (imageBase64.length > CHECK_WORK_MAX_IMAGE_CHARS) {
    return c.json({ success: false, error: 'Image too large (max ~500KB)' }, 413);
  }
  if (typeof body?.x !== 'number' || !Number.isFinite(body.x) ||
      typeof body?.y !== 'number' || !Number.isFinite(body.y)) {
    return c.json({ success: false, error: 'x and y must be finite numbers' }, 400);
  }
  // Taps outside the canvas are clamped, never rejected.
  const x = Math.round(Math.min(1200, Math.max(0, body.x)));
  const y = Math.round(Math.min(800, Math.max(0, body.y)));
  const question = typeof body?.question === 'string' && body.question.trim().length > 0
    ? body.question.trim().slice(0, ASK_ABOUT_MAX_QUESTION_CHARS)
    : undefined;

  // Same lesson join as whiteboard-teach: topic/subject/exam from the row.
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

  const prompt = `You are an expert ${examType.toUpperCase()} teacher helping a student with "${topicName}" (${subjectName}).
The attached image is a 1200x800 whiteboard lesson snapshot.
The student tapped point (${x}, ${y}) on this image. Their question: "${question ?? 'what does this part mean?'}"
Answer concisely (at most 60 words), referencing what is at or near that point.
Respond with ONLY JSON in this exact shape:
{ "answer": "...", "annotation": { "type": "circle", "id": "tap-highlight", "props": { "left": ${x}, "top": ${y}, "radius": 60, "stroke": "#7c3aed" } } }
The annotation is optional — include it only when circling the tapped spot helps. It must be a circle centered near (${x}, ${y}); the canvas is 1200x800.`;

  const model = getVisionModel(c.env);
  let lastError: unknown = new Error('Ask-about generation did not run');
  let lastValidAnswer: string | null = null;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const result: unknown = await c.env.AI.run(model as never, {
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: `data:image/png;base64,${imageBase64}` } },
            ],
          },
        ],
        max_tokens: 400,
        guided_json: ASK_ABOUT_GUIDED_SCHEMA,
      } as never);

      const text = unwrapAiText(result);
      const candidate = text.match(/\{[\s\S]*\}/)?.[0];
      const parsed = candidate ? (JSON.parse(candidate) as unknown) : null;

      if (parsed && isValidAskAboutResponse(parsed)) {
        const annotation = parsed.annotation ?? null;
        if (annotation) prefixAnnotationIds([annotation]);

        return c.json({
          success: true,
          data: { answer: parsed.answer, annotation, fallback: false },
        });
      }

      const parsedRecord = isPlainRecord(parsed) ? parsed : {};
      if (
        typeof parsedRecord.answer === 'string'
        && parsedRecord.answer.trim().length > 0
        && parsedRecord.answer.length <= 4000
      ) {
        lastValidAnswer = parsedRecord.answer.trim();
      }
      const annotation = isPlainRecord(parsedRecord.annotation) ? parsedRecord.annotation : {};
      console.error('Ask-about output failed validation', {
        attempt,
        answer: typeof parsedRecord.answer === 'string' ? parsedRecord.answer.length : typeof parsedRecord.answer,
        annotationType: parsedRecord.annotation === null ? 'null' : typeof parsedRecord.annotation,
        annotationKeys: Object.keys(annotation).slice(0, 10),
        propKeys: isPlainRecord(annotation.props) ? Object.keys(annotation.props).slice(0, 20) : [],
      });
      lastError = new Error('Invalid ask-about response');
    } catch (error) {
      console.error('Ask-about attempt could not be parsed', {
        attempt,
        errorType: error instanceof Error ? error.name : typeof error,
      });
      lastError = error;
    }

    if (attempt === 1) {
      console.error('Ask-about generation failed — retrying once');
    }
  }

  if (lastValidAnswer) {
    console.warn('Ask-about served a valid answer without an invalid optional annotation');
    return c.json({
      success: true,
      data: { answer: lastValidAnswer, annotation: null, fallback: false },
    });
  }

  console.error('Ask-about vision call failed after retry:', lastError);
  return c.json({
    success: true,
    data: { ...ASK_ABOUT_FALLBACK, fallback: true },
  });
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

// =============================================
// WHITEBOARD TTS (Deepgram Aura 2 via Workers AI)
// =============================================

const TTS_MAX_CHARS = 1500;
const TTS_SPEAKER = 'luna';

// Cache key: sha-256 hex of `${model}|${speaker}|${text}` — global across
// users (voiceOver text is generated content, identical for everyone).
async function ttsCacheKey(model: string, text: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`${model}|${TTS_SPEAKER}|${text}`)
  );
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `tts/${hex}.mp3`;
}

// Aura 2 (verified via /api/admin/tts-spike) returns a ReadableStream of raw
// MP3 bytes. The other shapes are handled defensively so a model swap via
// AI_MODEL_TTS doesn't silently break the endpoint.
async function extractTtsAudio(result: unknown): Promise<Uint8Array> {
  if (result instanceof ReadableStream) {
    const reader = result.getReader();
    const chunks: Uint8Array[] = [];
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value instanceof Uint8Array ? value : new Uint8Array(value as ArrayBuffer));
    }
    const total = chunks.reduce((n, ch) => n + ch.byteLength, 0);
    const merged = new Uint8Array(total);
    let off = 0;
    for (const ch of chunks) { merged.set(ch, off); off += ch.byteLength; }
    return merged;
  }
  if (result instanceof ArrayBuffer) return new Uint8Array(result);
  if (result instanceof Uint8Array) return result;
  if (typeof result === 'string') {
    // base64-encoded audio
    const binary = atob(result);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }
  if (result && typeof result === 'object' && typeof (result as { audio?: unknown }).audio === 'string') {
    const binary = atob((result as { audio: string }).audio);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }
  throw new Error('Unexpected TTS response shape');
}

// API Endpoint: Text-to-speech for whiteboard voiceOvers (premium-only).
// R2-cached globally; the frontend falls back to speechSynthesis on any
// non-audio response.
revisionClassroomApp.post('/tts', async (c) => {
  // Premium-only — reject before any AI cost is incurred.
  const user = c.get('user');
  if (!(await isPremiumUser(user.userId, c.env.DB))) {
    return c.json({ success: false, error: 'Voice narration is a premium feature.' }, 403);
  }

  const body = await c.req.json().catch(() => null);
  const text = typeof body?.text === 'string' ? body.text.trim() : '';
  if (!text || text.length > TTS_MAX_CHARS) {
    return c.json({ success: false, error: `text is required and must be at most ${TTS_MAX_CHARS} characters` }, 400);
  }

  const model = getTtsModel(c.env);
  const key = await ttsCacheKey(model, text);

  try {
    const cached = await c.env.RECORDINGS_BUCKET?.get(key);
    if (cached) {
      return new Response(cached.body, {
        headers: { 'Content-Type': 'audio/mpeg', 'X-TTS-Cache': 'hit' },
      });
    }

    const result: unknown = await c.env.AI.run(model as never, {
      text,
      speaker: TTS_SPEAKER,
      encoding: 'mp3',
    } as never);
    const bytes = await extractTtsAudio(result);
    if (bytes.byteLength === 0) throw new Error('TTS returned empty audio');

    await c.env.RECORDINGS_BUCKET?.put(key, bytes, {
      httpMetadata: { contentType: 'audio/mpeg' },
    });

    return new Response(bytes, {
      headers: { 'Content-Type': 'audio/mpeg', 'X-TTS-Cache': 'miss' },
    });
  } catch (error) {
    console.error('TTS error:', error);
    return c.json({ success: false, error: 'TTS unavailable', ttsUnavailable: true }, 502);
  }
});

export { revisionClassroomApp };
