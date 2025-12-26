import { Hono } from 'hono';
import type { Context } from 'hono';
import { getDemoDataFlags, isDemoUserId } from './demoUtils';

// Types for Cloudflare bindings
interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  ANTHROPIC_API_KEY?: string;
}

// Types
type TutorContext = 'general' | 'question_help' | 'topic_study' | 'exam_prep';
type MessageType = 'chat' | 'explanation' | 'hint' | 'step_by_step';
type MessageRole = 'user' | 'assistant' | 'system';

interface StudentContext {
  name: string;
  gradeLevel?: string;
  schoolLevel?: string;
  subjects?: string[];
  examType?: string;
  currentTopic?: string;
  recentPerformance?: {
    accuracy: number;
    trend: 'improving' | 'stable' | 'declining';
  };
  learningStyle?: string;
  weakAreas?: string[];
}

interface QuestionContext {
  id: string;
  subject: string;
  topic: string;
  questionText: string;
  options?: string[];
  correctAnswer: string;
  userAnswer?: string;
  isCorrect?: boolean;
  explanation?: string;
}

// Tutor system prompts
const TUTOR_PROMPTS = {
  general: `You are an expert AI tutor for Brilla Study Platform, helping Ghanaian JHS and SHS students prepare for BECE, WASSCE, and NSMQ competitions.

Your role is to:
- Explain concepts clearly using simple language appropriate for secondary students
- Break down complex topics into understandable parts
- Use examples relevant to the Ghanaian curriculum and daily life
- Encourage questions and curiosity
- Adapt explanations based on student's responses and understanding level

Guidelines:
- Be patient, encouraging, and supportive
- Use step-by-step explanations when needed
- Provide analogies and real-world examples
- If a student seems confused, try explaining in a different way
- Celebrate understanding and progress
- Reference the Ghanaian/West African educational context

Student Context:
{studentContext}`,

  question_explainer: `You are an AI tutor specializing in explaining quiz questions and answers for Brilla Study Platform.

Your role is to:
- Explain why the correct answer is right
- Explain why the student's answer (if different) was incorrect
- Teach the underlying concept
- Provide memory tips or mnemonics when helpful
- Suggest related topics to review

Guidelines:
- Start by acknowledging whether the student got it right or wrong (encouragingly)
- Be specific about the reasoning, not just stating facts
- Use the Socratic method - guide understanding rather than just telling
- Keep explanations concise but thorough
- End with a key takeaway or study tip

Question Context:
{questionContext}

Student Context:
{studentContext}`,

  hint_provider: `You are an AI tutor providing hints for quiz questions on Brilla Study Platform.

Your role is to:
- Provide progressive hints that guide without giving away the answer
- Level 1 hints: Gentle nudge in the right direction
- Level 2 hints: More specific guidance, narrow down options
- Level 3 hints: Strong hint that nearly reveals the answer

Guidelines:
- Never give away the answer directly until Level 3
- Encourage the student to think and reason
- Reference concepts the student should know
- Be encouraging and supportive
- Tailor hints to the subject matter

Current Hint Level: {hintLevel}

Question Context:
{questionContext}

Student Context:
{studentContext}`,

  step_by_step: `You are an AI tutor providing step-by-step problem solving guidance on Brilla Study Platform.

Your role is to:
- Break down the problem into clear, numbered steps
- Explain the reasoning at each step
- Show any formulas or methods being used
- Verify the final answer
- Highlight common mistakes to avoid

Guidelines:
- Use clear mathematical notation when applicable
- Explain "why" at each step, not just "what"
- For science problems, explain the concepts involved
- For word problems, identify given information first
- Check and verify the final answer

Question Context:
{questionContext}

Student Context:
{studentContext}`,
};

// Create Hono app
const tutorApp = new Hono<{ Bindings: Env }>();

// Helper functions
function getUserId(c: Context): string | undefined {
  return c.get('userId') || c.req.header('x-user-id');
}

function formatStudentContext(context: StudentContext): string {
  return `
Name: ${context.name}
Grade: ${context.gradeLevel || 'Not specified'}
School Level: ${context.schoolLevel || 'Not specified'}
Exam Preparing For: ${context.examType || 'General'}
Current Topic: ${context.currentTopic || 'Not specified'}
Subjects: ${context.subjects?.join(', ') || 'Not specified'}
Recent Performance: ${context.recentPerformance ? `${context.recentPerformance.accuracy}% accuracy, ${context.recentPerformance.trend}` : 'No data'}
Learning Style: ${context.learningStyle || 'Not specified'}
Areas to Improve: ${context.weakAreas?.join(', ') || 'Not specified'}`;
}

function formatQuestionContext(question: QuestionContext): string {
  let context = `
Subject: ${question.subject}
Topic: ${question.topic}
Question: ${question.questionText}`;

  if (question.options) {
    context += `\nOptions:\n${question.options.map((opt, i) => `  ${String.fromCharCode(65 + i)}. ${opt}`).join('\n')}`;
  }

  context += `\nCorrect Answer: ${question.correctAnswer}`;

  if (question.userAnswer !== undefined) {
    context += `\nStudent's Answer: ${question.userAnswer}`;
    context += `\nResult: ${question.isCorrect ? 'Correct!' : 'Incorrect'}`;
  }

  if (question.explanation) {
    context += `\nReference Explanation: ${question.explanation}`;
  }

  return context;
}

// File attachment type for vision API
interface FileAttachment {
  url: string; // Base64 encoded data
  type: string; // MIME type
  name: string;
}

// Call Claude API for tutor response
async function getTutorResponse(
  env: Env,
  message: string,
  conversationHistory: Array<{ role: MessageRole; content: string }>,
  studentContext: StudentContext,
  messageType: MessageType,
  questionContext?: QuestionContext,
  hintLevel?: number,
  attachments?: FileAttachment[]
): Promise<{ content: string; tokensUsed?: number }> {
  const apiKey = env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return getMockResponse(message, messageType, questionContext);
  }

  // Build system prompt based on message type
  let systemPrompt: string;
  const studentContextStr = formatStudentContext(studentContext);

  switch (messageType) {
    case 'explanation':
      if (!questionContext) {
        throw new Error('Question context required for explanation');
      }
      systemPrompt = TUTOR_PROMPTS.question_explainer
        .replace('{questionContext}', formatQuestionContext(questionContext))
        .replace('{studentContext}', studentContextStr);
      break;

    case 'hint':
      if (!questionContext) {
        throw new Error('Question context required for hint');
      }
      systemPrompt = TUTOR_PROMPTS.hint_provider
        .replace('{hintLevel}', String(hintLevel || 1))
        .replace('{questionContext}', formatQuestionContext(questionContext))
        .replace('{studentContext}', studentContextStr);
      break;

    case 'step_by_step':
      if (!questionContext) {
        throw new Error('Question context required for step-by-step');
      }
      systemPrompt = TUTOR_PROMPTS.step_by_step
        .replace('{questionContext}', formatQuestionContext(questionContext))
        .replace('{studentContext}', studentContextStr);
      break;

    default:
      systemPrompt = TUTOR_PROMPTS.general.replace('{studentContext}', studentContextStr);
  }

  // Add vision capability instruction if there are image attachments
  if (attachments && attachments.some(a => a.type.startsWith('image/'))) {
    systemPrompt += `

IMPORTANT: The student has shared an image with you. Please analyze the image carefully and:
1. Describe what you see (math problem, diagram, handwritten notes, etc.)
2. If it's a problem, work through the solution step by step
3. If it's a diagram or concept, explain what it represents
4. Point out any errors or areas for improvement if applicable
5. Be encouraging and supportive in your response`;
  }

  // Build messages for Claude with vision support
  type MessageContent = string | Array<{
    type: 'text' | 'image';
    text?: string;
    source?: {
      type: 'base64';
      media_type: string;
      data: string;
    };
  }>;

  const messages: Array<{ role: 'user' | 'assistant'; content: MessageContent }> = conversationHistory.map(msg => ({
    role: msg.role === 'assistant' ? 'assistant' as const : 'user' as const,
    content: msg.content,
  }));

  // Build the user message content with attachments
  if (attachments && attachments.length > 0) {
    const contentParts: Array<{
      type: 'text' | 'image';
      text?: string;
      source?: {
        type: 'base64';
        media_type: string;
        data: string;
      };
    }> = [];

    // Add image attachments first
    for (const attachment of attachments) {
      if (attachment.type.startsWith('image/')) {
        contentParts.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: attachment.type,
            data: attachment.url, // Already base64 encoded from frontend
          },
        });
      } else if (attachment.type === 'application/pdf') {
        // For PDFs, add a note (Claude can't directly read PDFs yet via API)
        contentParts.push({
          type: 'text',
          text: `[PDF Document attached: ${attachment.name}. Note: Please describe what you'd like help with from this document.]`,
        });
      }
    }

    // Add the text message
    contentParts.push({
      type: 'text',
      text: message,
    });

    messages.push({ role: 'user', content: contentParts });
  } else {
    messages.push({ role: 'user', content: message });
  }

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
        max_tokens: 2000, // Increased for image analysis
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
      usage?: { input_tokens: number; output_tokens: number };
    };

    const content = data.content[0]?.type === 'text' ? data.content[0].text || '' : '';
    const tokensUsed = data.usage ? data.usage.input_tokens + data.usage.output_tokens : undefined;

    return { content, tokensUsed };
  } catch (error) {
    console.error('Error calling Claude API:', error);
    return getMockResponse(message, messageType, questionContext);
  }
}

// Mock responses for when API is unavailable
function getMockResponse(
  message: string,
  messageType: MessageType,
  questionContext?: QuestionContext
): { content: string } {
  const lowerMessage = message.toLowerCase();

  if (messageType === 'explanation' && questionContext) {
    if (questionContext.isCorrect) {
      return {
        content: `Excellent work! You got it right! 🎉\n\nThe correct answer is **${questionContext.correctAnswer}**.\n\n**Why this is correct:**\nThis question is about ${questionContext.topic} in ${questionContext.subject}. ${questionContext.explanation || 'Understanding the core concept here will help you with similar questions.'}\n\n**Key Takeaway:** Keep practicing questions like this to reinforce your understanding!`,
      };
    } else {
      return {
        content: `Good try! Let's learn from this. 📚\n\nThe correct answer is **${questionContext.correctAnswer}**, but you selected **${questionContext.userAnswer}**.\n\n**Why the correct answer is right:**\n${questionContext.explanation || `This relates to a key concept in ${questionContext.topic}. Take a moment to review this topic.`}\n\n**Common mistake:** Many students confuse this concept. The key is to remember the fundamental principle.\n\n**Study Tip:** Review ${questionContext.topic} in your textbook and try more practice questions on this topic.`,
      };
    }
  }

  if (messageType === 'hint') {
    return {
      content: `Here's a hint to help you think through this problem:\n\n🤔 **Think about:** What are the key concepts in ${questionContext?.topic || 'this topic'}?\n\n💡 **Remember:** Look carefully at each option and eliminate ones that don't match what you know.\n\nTake your time and think it through. You've got this!`,
    };
  }

  if (messageType === 'step_by_step' && questionContext) {
    return {
      content: `Let's solve this step by step:\n\n**Problem:** ${questionContext.questionText}\n\n**Step 1:** Identify what we're looking for\nWe need to find the answer related to ${questionContext.topic}.\n\n**Step 2:** Recall the relevant concept\nRemember the key principle from ${questionContext.subject}.\n\n**Step 3:** Apply the concept\nUsing what we know, we can work through the options.\n\n**Step 4:** Check our answer\nThe correct answer is **${questionContext.correctAnswer}**.\n\n**Why:** ${questionContext.explanation || 'This follows from the core principle we applied.'}`,
    };
  }

  // General chat responses
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return {
      content: "Hello! 👋 I'm your AI tutor, here to help you learn and succeed in your studies. What would you like to work on today? I can help explain concepts, work through problems, or give you study tips!",
    };
  }

  if (lowerMessage.includes('help') || lowerMessage.includes('explain')) {
    return {
      content: "I'd be happy to help! Here's what I can do:\n\n📚 **Explain concepts** - Ask me about any topic\n🔢 **Solve problems** - Work through math or science problems step-by-step\n💡 **Give hints** - Get guidance without the full answer\n📝 **Study tips** - Learn effective study strategies\n\nWhat would you like help with?",
    };
  }

  if (lowerMessage.includes('formula') || lowerMessage.includes('equation')) {
    return {
      content: "Great question about formulas! Here are some tips:\n\n1. **Understand, don't memorize** - Know what each part means\n2. **Practice applying** - Use the formula in different problems\n3. **Create a formula sheet** - Write them down with examples\n4. **Connect formulas** - See how they relate to each other\n\nWhich specific formula would you like me to explain?",
    };
  }

  return {
    content: "That's a great question! Let me help you understand this better.\n\nThe key to mastering any topic is to:\n1. Understand the core concept\n2. See examples of how it's applied\n3. Practice with similar problems\n\nWould you like me to explain a specific concept, work through a problem, or give you some study tips?",
  };
}

// Get student context from database
async function getStudentContext(env: Env, userId: string): Promise<StudentContext> {
  try {
    const student = await env.DB.prepare(`
      SELECT name, school_level, year_group FROM users WHERE id = ?
    `).bind(userId).first();

    const recentProgress = await env.DB.prepare(`
      SELECT
        AVG(CASE WHEN is_correct = 1 THEN 100 ELSE 0 END) as accuracy,
        COUNT(*) as attempts
      FROM question_attempts
      WHERE user_id = ? AND created_at >= datetime('now', '-7 days')
    `).bind(userId).first();

    return {
      name: student?.name as string || 'Student',
      schoolLevel: student?.school_level as string,
      gradeLevel: student?.year_group ? `Year ${student.year_group}` : undefined,
      recentPerformance: recentProgress?.attempts ? {
        accuracy: Math.round(recentProgress.accuracy as number),
        trend: 'stable',
      } : undefined,
    };
  } catch (error) {
    console.error('Error fetching student context:', error);
    return { name: 'Student' };
  }
}

// Update usage statistics
async function updateUsageStats(
  env: Env,
  userId: string,
  messageType: MessageType,
  tokensUsed?: number
): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];

    await env.DB.prepare(`
      INSERT INTO tutor_usage_stats (id, user_id, date, messages_sent, explanations_requested, hints_requested, total_tokens_used, created_at, updated_at)
      VALUES (?, ?, ?, 1, ?, ?, ?, datetime('now'), datetime('now'))
      ON CONFLICT(user_id, date) DO UPDATE SET
        messages_sent = messages_sent + 1,
        explanations_requested = explanations_requested + ?,
        hints_requested = hints_requested + ?,
        total_tokens_used = total_tokens_used + ?,
        updated_at = datetime('now')
    `).bind(
      `usage_${userId}_${today}`,
      userId,
      today,
      messageType === 'explanation' ? 1 : 0,
      messageType === 'hint' ? 1 : 0,
      tokensUsed || 0,
      messageType === 'explanation' ? 1 : 0,
      messageType === 'hint' ? 1 : 0,
      tokensUsed || 0
    ).run();
  } catch (error) {
    console.error('Error updating usage stats:', error);
  }
}

// =============================================
// CONVERSATION ROUTES
// =============================================

// Get user's tutor conversations
tutorApp.get('/conversations', async (c) => {
  try {
    const userId = getUserId(c);

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    const conversations = await c.env.DB.prepare(`
      SELECT
        id, context, exam_type, subject_id, topic_id, title, is_archived, created_at, updated_at
      FROM tutor_conversations
      WHERE user_id = ? AND is_archived = 0
      ORDER BY updated_at DESC
      LIMIT 50
    `).bind(userId).all();

    return c.json({
      success: true,
      data: conversations.results.map((conv: Record<string, unknown>) => ({
        id: conv.id,
        context: conv.context,
        examType: conv.exam_type,
        subjectId: conv.subject_id,
        topicId: conv.topic_id,
        title: conv.title,
        isArchived: !!conv.is_archived,
        createdAt: conv.created_at,
        updatedAt: conv.updated_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return c.json({ success: false, error: 'Failed to fetch conversations' }, 500);
  }
});

// Get conversation with messages
tutorApp.get('/conversations/:id', async (c) => {
  try {
    const conversationId = c.req.param('id');
    const userId = getUserId(c);

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    const conversation = await c.env.DB.prepare(`
      SELECT * FROM tutor_conversations WHERE id = ? AND user_id = ?
    `).bind(conversationId, userId).first();

    if (!conversation) {
      return c.json({ success: false, error: 'Conversation not found' }, 404);
    }

    const messages = await c.env.DB.prepare(`
      SELECT id, role, content, message_type, question_id, hint_level, created_at
      FROM tutor_messages
      WHERE conversation_id = ?
      ORDER BY created_at ASC
    `).bind(conversationId).all();

    return c.json({
      success: true,
      data: {
        id: conversation.id,
        context: conversation.context,
        examType: conversation.exam_type,
        subjectId: conversation.subject_id,
        topicId: conversation.topic_id,
        title: conversation.title,
        isArchived: !!conversation.is_archived,
        createdAt: conversation.created_at,
        updatedAt: conversation.updated_at,
        messages: messages.results.map((msg: Record<string, unknown>) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          messageType: msg.message_type,
          questionId: msg.question_id,
          hintLevel: msg.hint_level,
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
tutorApp.delete('/conversations/:id', async (c) => {
  try {
    const conversationId = c.req.param('id');
    const userId = getUserId(c);

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    await c.env.DB.prepare(`
      UPDATE tutor_conversations
      SET is_archived = 1, updated_at = datetime('now')
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

// General chat with tutor
tutorApp.post('/chat', async (c) => {
  try {
    const userId = getUserId(c);

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    const body = await c.req.json();
    const { conversationId, message, context, examType, subjectId, topicId, attachments } = body;

    if (!message?.trim() && (!attachments || attachments.length === 0)) {
      return c.json({ success: false, error: 'Message or attachment is required' }, 400);
    }

    // Get or create conversation
    let activeConversationId = conversationId;
    let isNewConversation = false;

    if (!conversationId) {
      // Create new conversation
      activeConversationId = `tutor_conv_${Date.now()}`;
      await c.env.DB.prepare(`
        INSERT INTO tutor_conversations (id, user_id, context, exam_type, subject_id, topic_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(activeConversationId, userId, context || 'general', examType || null, subjectId || null, topicId || null).run();
      isNewConversation = true;
    } else {
      // Verify conversation belongs to user
      const conv = await c.env.DB.prepare(`
        SELECT id FROM tutor_conversations WHERE id = ? AND user_id = ?
      `).bind(conversationId, userId).first();

      if (!conv) {
        return c.json({ success: false, error: 'Conversation not found' }, 404);
      }
    }

    // Get student context
    const studentContext = await getStudentContext(c.env, userId);
    if (examType) studentContext.examType = examType;

    // Get conversation history (last 10 messages)
    const historyResults = await c.env.DB.prepare(`
      SELECT role, content FROM tutor_messages
      WHERE conversation_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `).bind(activeConversationId).all();

    const conversationHistory = historyResults.results.reverse().map((msg: Record<string, unknown>) => ({
      role: msg.role as MessageRole,
      content: msg.content as string,
    }));

    // Save user message (with attachment info if present)
    const userMessageId = `msg_${Date.now()}_user`;
    const messageContent = message?.trim() || (attachments ? '[File attachment]' : '');
    const attachmentInfo = attachments && attachments.length > 0
      ? ` [Attachments: ${attachments.map((a: FileAttachment) => a.name).join(', ')}]`
      : '';

    await c.env.DB.prepare(`
      INSERT INTO tutor_messages (id, conversation_id, role, content, message_type, created_at)
      VALUES (?, ?, 'user', ?, 'chat', datetime('now'))
    `).bind(userMessageId, activeConversationId, messageContent + attachmentInfo).run();

    // Get AI response with attachments
    const aiResponse = await getTutorResponse(
      c.env,
      messageContent,
      conversationHistory,
      studentContext,
      'chat',
      undefined, // questionContext
      undefined, // hintLevel
      attachments as FileAttachment[] | undefined
    );

    // Save assistant response
    const assistantMessageId = `msg_${Date.now()}_assistant`;
    await c.env.DB.prepare(`
      INSERT INTO tutor_messages (id, conversation_id, role, content, message_type, tokens_used, created_at)
      VALUES (?, ?, 'assistant', ?, 'chat', ?, datetime('now'))
    `).bind(assistantMessageId, activeConversationId, aiResponse.content, aiResponse.tokensUsed || null).run();

    // Update conversation
    const title = isNewConversation ? message.trim().substring(0, 50) + (message.length > 50 ? '...' : '') : null;
    await c.env.DB.prepare(`
      UPDATE tutor_conversations
      SET title = COALESCE(?, title), updated_at = datetime('now')
      WHERE id = ?
    `).bind(title, activeConversationId).run();

    // Update usage stats
    await updateUsageStats(c.env, userId, 'chat', aiResponse.tokensUsed);

    return c.json({
      success: true,
      data: {
        conversationId: activeConversationId,
        userMessage: {
          id: userMessageId,
          role: 'user',
          content: message.trim(),
        },
        assistantMessage: {
          id: assistantMessageId,
          role: 'assistant',
          content: aiResponse.content,
        },
      },
    });
  } catch (error) {
    console.error('Error in chat:', error);
    return c.json({ success: false, error: 'Failed to send message' }, 500);
  }
});

// =============================================
// QUESTION EXPLANATION ROUTES
// =============================================

// Explain a question/answer
tutorApp.post('/explain', async (c) => {
  try {
    const userId = getUserId(c);

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    const body = await c.req.json();
    const {
      questionId,
      questionText,
      subject,
      topic,
      options,
      correctAnswer,
      userAnswer,
      isCorrect,
      existingExplanation,
      conversationId,
    } = body;

    if (!questionText || !correctAnswer) {
      return c.json({ success: false, error: 'Question and correct answer are required' }, 400);
    }

    // Get or create conversation
    let activeConversationId = conversationId;

    if (!conversationId) {
      activeConversationId = `tutor_conv_${Date.now()}`;
      await c.env.DB.prepare(`
        INSERT INTO tutor_conversations (id, user_id, context, title, created_at, updated_at)
        VALUES (?, ?, 'question_help', ?, datetime('now'), datetime('now'))
      `).bind(activeConversationId, userId, `Help with ${topic || subject || 'question'}`).run();
    }

    // Get student context
    const studentContext = await getStudentContext(c.env, userId);
    studentContext.currentTopic = topic;

    // Build question context
    const questionContext: QuestionContext = {
      id: questionId || `q_${Date.now()}`,
      subject: subject || 'General',
      topic: topic || 'General',
      questionText,
      options,
      correctAnswer,
      userAnswer,
      isCorrect,
      explanation: existingExplanation,
    };

    // Get AI explanation
    const prompt = isCorrect
      ? 'Please explain why my answer is correct and help me understand the concept better.'
      : 'Please explain why the correct answer is right and help me understand where I went wrong.';

    const aiResponse = await getTutorResponse(
      c.env,
      prompt,
      [],
      studentContext,
      'explanation',
      questionContext
    );

    // Save messages
    const userMessageId = `msg_${Date.now()}_user`;
    await c.env.DB.prepare(`
      INSERT INTO tutor_messages (id, conversation_id, role, content, message_type, question_id, created_at)
      VALUES (?, ?, 'user', ?, 'explanation', ?, datetime('now'))
    `).bind(userMessageId, activeConversationId, prompt, questionId || null).run();

    const assistantMessageId = `msg_${Date.now()}_assistant`;
    await c.env.DB.prepare(`
      INSERT INTO tutor_messages (id, conversation_id, role, content, message_type, question_id, tokens_used, created_at)
      VALUES (?, ?, 'assistant', ?, 'explanation', ?, ?, datetime('now'))
    `).bind(assistantMessageId, activeConversationId, aiResponse.content, questionId || null, aiResponse.tokensUsed || null).run();

    // Update usage stats
    await updateUsageStats(c.env, userId, 'explanation', aiResponse.tokensUsed);

    return c.json({
      success: true,
      data: {
        conversationId: activeConversationId,
        explanation: aiResponse.content,
        messageId: assistantMessageId,
      },
    });
  } catch (error) {
    console.error('Error explaining question:', error);
    return c.json({ success: false, error: 'Failed to explain question' }, 500);
  }
});

// =============================================
// HINT ROUTES
// =============================================

// Get a hint for a question
tutorApp.post('/hint', async (c) => {
  try {
    const userId = getUserId(c);

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    const body = await c.req.json();
    const {
      questionId,
      questionText,
      subject,
      topic,
      options,
      correctAnswer,
      hintLevel = 1,
      conversationId,
    } = body;

    if (!questionText || !correctAnswer) {
      return c.json({ success: false, error: 'Question and correct answer are required' }, 400);
    }

    if (hintLevel < 1 || hintLevel > 3) {
      return c.json({ success: false, error: 'Hint level must be 1, 2, or 3' }, 400);
    }

    // Get or create conversation
    let activeConversationId = conversationId;

    if (!conversationId) {
      activeConversationId = `tutor_conv_${Date.now()}`;
      await c.env.DB.prepare(`
        INSERT INTO tutor_conversations (id, user_id, context, title, created_at, updated_at)
        VALUES (?, ?, 'question_help', ?, datetime('now'), datetime('now'))
      `).bind(activeConversationId, userId, `Hints for ${topic || subject || 'question'}`).run();
    }

    // Get student context
    const studentContext = await getStudentContext(c.env, userId);
    studentContext.currentTopic = topic;

    // Build question context
    const questionContext: QuestionContext = {
      id: questionId || `q_${Date.now()}`,
      subject: subject || 'General',
      topic: topic || 'General',
      questionText,
      options,
      correctAnswer,
    };

    // Get AI hint
    const prompt = `Please give me a level ${hintLevel} hint for this question.`;

    const aiResponse = await getTutorResponse(
      c.env,
      prompt,
      [],
      studentContext,
      'hint',
      questionContext,
      hintLevel
    );

    // Save messages
    const userMessageId = `msg_${Date.now()}_user`;
    await c.env.DB.prepare(`
      INSERT INTO tutor_messages (id, conversation_id, role, content, message_type, question_id, hint_level, created_at)
      VALUES (?, ?, 'user', ?, 'hint', ?, ?, datetime('now'))
    `).bind(userMessageId, activeConversationId, prompt, questionId || null, hintLevel).run();

    const assistantMessageId = `msg_${Date.now()}_assistant`;
    await c.env.DB.prepare(`
      INSERT INTO tutor_messages (id, conversation_id, role, content, message_type, question_id, hint_level, tokens_used, created_at)
      VALUES (?, ?, 'assistant', ?, 'hint', ?, ?, ?, datetime('now'))
    `).bind(assistantMessageId, activeConversationId, aiResponse.content, questionId || null, hintLevel, aiResponse.tokensUsed || null).run();

    // Update usage stats
    await updateUsageStats(c.env, userId, 'hint', aiResponse.tokensUsed);

    return c.json({
      success: true,
      data: {
        conversationId: activeConversationId,
        hint: aiResponse.content,
        hintLevel,
        messageId: assistantMessageId,
        hasMoreHints: hintLevel < 3,
      },
    });
  } catch (error) {
    console.error('Error getting hint:', error);
    return c.json({ success: false, error: 'Failed to get hint' }, 500);
  }
});

// =============================================
// STEP-BY-STEP ROUTES
// =============================================

// Get step-by-step solution
tutorApp.post('/step-by-step', async (c) => {
  try {
    const userId = getUserId(c);

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    const body = await c.req.json();
    const {
      questionId,
      questionText,
      subject,
      topic,
      options,
      correctAnswer,
      explanation,
      conversationId,
    } = body;

    if (!questionText || !correctAnswer) {
      return c.json({ success: false, error: 'Question and correct answer are required' }, 400);
    }

    // Get or create conversation
    let activeConversationId = conversationId;

    if (!conversationId) {
      activeConversationId = `tutor_conv_${Date.now()}`;
      await c.env.DB.prepare(`
        INSERT INTO tutor_conversations (id, user_id, context, title, created_at, updated_at)
        VALUES (?, ?, 'question_help', ?, datetime('now'), datetime('now'))
      `).bind(activeConversationId, userId, `Step-by-step: ${topic || subject || 'problem'}`).run();
    }

    // Get student context
    const studentContext = await getStudentContext(c.env, userId);
    studentContext.currentTopic = topic;

    // Build question context
    const questionContext: QuestionContext = {
      id: questionId || `q_${Date.now()}`,
      subject: subject || 'General',
      topic: topic || 'General',
      questionText,
      options,
      correctAnswer,
      explanation,
    };

    // Get AI step-by-step solution
    const prompt = 'Please show me how to solve this problem step by step.';

    const aiResponse = await getTutorResponse(
      c.env,
      prompt,
      [],
      studentContext,
      'step_by_step',
      questionContext
    );

    // Save messages
    const userMessageId = `msg_${Date.now()}_user`;
    await c.env.DB.prepare(`
      INSERT INTO tutor_messages (id, conversation_id, role, content, message_type, question_id, created_at)
      VALUES (?, ?, 'user', ?, 'step_by_step', ?, datetime('now'))
    `).bind(userMessageId, activeConversationId, prompt, questionId || null).run();

    const assistantMessageId = `msg_${Date.now()}_assistant`;
    await c.env.DB.prepare(`
      INSERT INTO tutor_messages (id, conversation_id, role, content, message_type, question_id, tokens_used, created_at)
      VALUES (?, ?, 'assistant', ?, 'step_by_step', ?, ?, datetime('now'))
    `).bind(assistantMessageId, activeConversationId, aiResponse.content, questionId || null, aiResponse.tokensUsed || null).run();

    // Update usage stats
    await updateUsageStats(c.env, userId, 'step_by_step' as MessageType, aiResponse.tokensUsed);

    return c.json({
      success: true,
      data: {
        conversationId: activeConversationId,
        solution: aiResponse.content,
        messageId: assistantMessageId,
      },
    });
  } catch (error) {
    console.error('Error getting step-by-step solution:', error);
    return c.json({ success: false, error: 'Failed to get solution' }, 500);
  }
});

// =============================================
// FEEDBACK ROUTES
// =============================================

// Submit feedback on tutor message
tutorApp.post('/feedback', async (c) => {
  try {
    const userId = getUserId(c);

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    const body = await c.req.json();
    const { messageId, rating, feedbackType, feedbackText } = body;

    if (!messageId) {
      return c.json({ success: false, error: 'Message ID is required' }, 400);
    }

    await c.env.DB.prepare(`
      INSERT INTO tutor_feedback (id, message_id, user_id, rating, feedback_type, feedback_text, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      `fb_${Date.now()}`,
      messageId,
      userId,
      rating || null,
      feedbackType || null,
      feedbackText || null
    ).run();

    return c.json({ success: true, message: 'Feedback submitted' });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return c.json({ success: false, error: 'Failed to submit feedback' }, 500);
  }
});

// =============================================
// USAGE STATS ROUTES
// =============================================

// Get user's tutor usage stats
tutorApp.get('/stats', async (c) => {
  try {
    const userId = getUserId(c);

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    const days = parseInt(c.req.query('days') || '7');

    const stats = await c.env.DB.prepare(`
      SELECT
        SUM(messages_sent) as total_messages,
        SUM(explanations_requested) as total_explanations,
        SUM(hints_requested) as total_hints,
        SUM(total_tokens_used) as total_tokens
      FROM tutor_usage_stats
      WHERE user_id = ? AND date >= date('now', '-' || ? || ' days')
    `).bind(userId, days).first();

    const dailyStats = await c.env.DB.prepare(`
      SELECT date, messages_sent, explanations_requested, hints_requested
      FROM tutor_usage_stats
      WHERE user_id = ? AND date >= date('now', '-' || ? || ' days')
      ORDER BY date ASC
    `).bind(userId, days).all();

    return c.json({
      success: true,
      data: {
        summary: {
          totalMessages: stats?.total_messages || 0,
          totalExplanations: stats?.total_explanations || 0,
          totalHints: stats?.total_hints || 0,
          totalTokensUsed: stats?.total_tokens || 0,
        },
        daily: dailyStats.results.map((d: Record<string, unknown>) => ({
          date: d.date,
          messagesSent: d.messages_sent,
          explanationsRequested: d.explanations_requested,
          hintsRequested: d.hints_requested,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return c.json({ success: false, error: 'Failed to fetch stats' }, 500);
  }
});

export { tutorApp };
