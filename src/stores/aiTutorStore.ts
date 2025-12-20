import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isNew?: boolean;
}

export interface UserPersonalization {
  name: string;
  preferredName?: string;
  learningStyle?: 'visual' | 'auditory' | 'reading' | 'kinesthetic';
  strengths?: string[];
  weakAreas?: string[];
  gradeLevel?: string;
  previousTopics?: string[];
  encouragementStyle?: 'motivational' | 'analytical' | 'supportive';
}

type ThinkingStage = 'idle' | 'thinking' | 'composing' | 'typing';

interface AiTutorState {
  isOpen: boolean;
  messages: ChatMessage[];
  isLoading: boolean;
  thinkingStage: ThinkingStage;
  error: string | null;
  currentContext?: string;
  latestMessageId?: string;
  userPersonalization?: UserPersonalization;

  // Actions
  openChat: (context?: string) => void;
  closeChat: () => void;
  sendMessage: (message: string, userId: string, userName?: string) => Promise<void>;
  explainQuestion: (question: string, correctAnswer: string, userAnswer?: string, isCorrect?: boolean, userId?: string, context?: string) => Promise<string>;
  getHint: (question: string, hintLevel: number, userId: string) => Promise<string>;
  clearMessages: () => void;
  clearError: () => void;
  markMessageAsOld: (messageId: string) => void;
  setUserPersonalization: (data: Partial<UserPersonalization>) => void;
}

// Mock AI responses when API is unavailable - now with personalization
function generateMockResponse(message: string, userName?: string): string {
  const lowerMessage = message.toLowerCase();
  const greeting = userName ? `${userName}, ` : '';
  const personalTouch = userName ? ` I'm here specifically for you, ${userName}.` : '';

  if (lowerMessage.includes('study') || lowerMessage.includes('tip')) {
    return `Great question, ${greeting}here are some effective study tips tailored for you:

**1. Active Recall**
Test yourself regularly instead of just re-reading notes. Try to explain concepts without looking at your materials.

**2. Spaced Repetition**
Review material at increasing intervals (1 day, 3 days, 1 week) to strengthen long-term memory.

**3. Practice Problems**
Work through past exam questions under timed conditions. This helps with both understanding and exam technique.

**4. Teach Others**
Explaining concepts to classmates helps solidify your own understanding.

**5. Take Breaks**
Use the Pomodoro technique: 25 minutes focused study, 5 minute break.

Would you like me to explain any of these strategies in more detail?${personalTouch}`;
  }

  if (lowerMessage.includes('explain') || lowerMessage.includes('what is')) {
    return `${greeting ? `Of course, ${greeting}` : ''}I'd be happy to help explain that concept!

To give you the best explanation, could you please:
1. Specify which subject (Maths, Physics, Chemistry, Biology, or another subject)
2. Tell me what specifically you're finding confusing

For example, you could ask:
- "Explain the concept of momentum in Physics"
- "What is photosynthesis and how does it work?"
- "How do I solve quadratic equations?"

I'm here to help you understand!${personalTouch}`;
  }

  if (lowerMessage.includes('formula') || lowerMessage.includes('equation')) {
    return `${greeting ? `Great thinking, ${greeting}` : ''}Formulas are key to success in science and maths exams!

**Tips for learning formulas:**

1. **Understand, don't just memorize** - Know what each variable represents and why the formula works
2. **Use flashcards** - Write formula on one side, meaning on the other
3. **Practice application** - Use the formula in different types of problems
4. **Group related formulas** - E.g., all kinematic equations together

Which specific formula would you like me to explain?`;
  }

  if (lowerMessage.includes('hello') || lowerMessage.includes('hi ') || lowerMessage === 'hi') {
    return `Hello${userName ? `, ${userName}` : ''}! I'm Brilla AI, your personal study companion.

I'm so glad you're here! I can help you with:
- **Explaining concepts** in any subject
- **Study tips** and exam strategies
- **Practice questions** and worked solutions
- **Formula explanations** and derivations

What would you like to work on together today? Remember, there are no silly questions - I'm here to help you succeed!`;
  }

  // Default response
  return `${greeting ? `Thanks for reaching out, ${greeting}` : 'Thanks for your question! '}I'm here to help you prepare for your exams.

I can assist you with:
- **Subject explanations** - Ask me about any topic in Maths, Sciences, English, or other subjects
- **Study strategies** - Get tips for effective revision
- **Exam techniques** - Learn how to approach different question types
- **Practice problems** - Work through examples together

What specific topic or question would you like help with?${personalTouch}`;
}

// Safe JSON parse helper
async function safeJsonParse(response: Response): Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }> {
  try {
    const text = await response.text();
    if (!text || text.trim() === '') {
      return { success: false, error: 'Empty response from server' };
    }
    const data = JSON.parse(text);
    return { success: true, data };
  } catch {
    return { success: false, error: 'Invalid response from server' };
  }
}

// Simulate thinking stages with delays
function simulateThinking(
  setStage: (stage: ThinkingStage) => void,
  onComplete: () => void
) {
  setStage('thinking');

  setTimeout(() => {
    setStage('composing');

    setTimeout(() => {
      onComplete();
    }, 800 + Math.random() * 400);
  }, 600 + Math.random() * 400);
}

export const useAiTutorStore = create<AiTutorState>()((set, get) => ({
  isOpen: false,
  messages: [],
  isLoading: false,
  thinkingStage: 'idle',
  error: null,
  currentContext: undefined,
  latestMessageId: undefined,
  userPersonalization: undefined,

  openChat: (context) => {
    set({ isOpen: true, currentContext: context });
  },

  closeChat: () => {
    set({ isOpen: false });
  },

  setUserPersonalization: (data) => {
    set((state) => ({
      userPersonalization: { ...state.userPersonalization, ...data } as UserPersonalization,
    }));
  },

  markMessageAsOld: (messageId) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId ? { ...m, isNew: false } : m
      ),
    }));
  },

  sendMessage: async (message, userId, userName) => {
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: message,
      timestamp: new Date(),
      isNew: false,
    };

    // Mark all previous messages as old
    set((state) => ({
      messages: [...state.messages.map((m) => ({ ...m, isNew: false })), userMessage],
      isLoading: true,
      thinkingStage: 'thinking',
      error: null,
    }));

    try {
      let assistantContent: string;
      const personalization = get().userPersonalization;
      const displayName = userName || personalization?.preferredName || personalization?.name;

      // Simulate thinking stages
      await new Promise<void>((resolve) => {
        simulateThinking(
          (stage) => set({ thinkingStage: stage }),
          resolve
        );
      });

      try {
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message,
            context: get().currentContext,
            conversationHistory: get().messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            userId,
            userName: displayName,
            userPersonalization: personalization,
          }),
        });

        const parsed = await safeJsonParse(response);

        if (!parsed.success || !response.ok) {
          // API unavailable or returned error - use mock response
          assistantContent = generateMockResponse(message, displayName);
        } else {
          assistantContent = (parsed.data as { data?: { message?: string } })?.data?.message || generateMockResponse(message, displayName);
        }
      } catch {
        // Network error or API unavailable - use mock response
        assistantContent = generateMockResponse(message, displayName);
      }

      const messageId = `msg_${Date.now()}_assistant`;
      const assistantMessage: ChatMessage = {
        id: messageId,
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date(),
        isNew: true,
      };

      set((state) => ({
        messages: [...state.messages, assistantMessage],
        isLoading: false,
        thinkingStage: 'typing',
        latestMessageId: messageId,
      }));

      // Clear typing stage after a delay
      setTimeout(() => {
        set({ thinkingStage: 'idle' });
      }, 500);

    } catch (error) {
      // Final fallback - still provide a response
      const displayName = userName || get().userPersonalization?.name;
      const messageId = `msg_${Date.now()}_assistant`;
      const fallbackMessage: ChatMessage = {
        id: messageId,
        role: 'assistant',
        content: generateMockResponse(message, displayName),
        timestamp: new Date(),
        isNew: true,
      };

      set((state) => ({
        messages: [...state.messages, fallbackMessage],
        isLoading: false,
        thinkingStage: 'idle',
        error: null,
        latestMessageId: messageId,
      }));
    }
  },

  explainQuestion: async (question, correctAnswer, userAnswer, isCorrect, userId, context) => {
    set({ isLoading: true, thinkingStage: 'thinking', error: null });

    try {
      const response = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          correctAnswer,
          userAnswer,
          isCorrect,
          userId,
          context,
          userPersonalization: get().userPersonalization,
        }),
      });

      const parsed = await safeJsonParse(response);

      if (!parsed.success || !response.ok) {
        // Return mock explanation
        const userName = get().userPersonalization?.name;
        const mockExplanation = isCorrect
          ? `${userName ? `Excellent work, ${userName}! ` : 'Excellent work! '}The correct answer is "${correctAnswer}".\n\nYou demonstrated a good understanding of this concept. Keep practicing to reinforce your knowledge!`
          : `The correct answer is "${correctAnswer}".\n\n${userAnswer ? `Your answer "${userAnswer}" was not quite right. ` : ''}This concept requires understanding the underlying principles.${userName ? ` Don't worry, ${userName} - ` : ' '}Review the topic and try similar questions to strengthen your understanding.`;

        set({ isLoading: false, thinkingStage: 'idle' });
        return mockExplanation;
      }

      set({ isLoading: false, thinkingStage: 'idle' });
      return (parsed.data as { data?: { explanation?: string } })?.data?.explanation ||
        `The correct answer is "${correctAnswer}". Keep practicing!`;
    } catch {
      const userName = get().userPersonalization?.name;
      const fallbackExplanation = `The correct answer is "${correctAnswer}".\n\n${userName ? `${userName}, this` : 'This'} is a common question type. Make sure you understand the key concepts and practice similar problems.`;
      set({ isLoading: false, thinkingStage: 'idle' });
      return fallbackExplanation;
    }
  },

  getHint: async (question, hintLevel, userId) => {
    set({ isLoading: true, thinkingStage: 'thinking', error: null });

    const userName = get().userPersonalization?.name;
    const mockHints = [
      `${userName ? `${userName}, think` : 'Think'} about the fundamental concepts involved. What principles might apply here?`,
      `${userName ? `You've got this, ${userName}! ` : ''}Consider breaking the problem into smaller parts. What information do you already have?`,
      `${userName ? `Almost there, ${userName}! ` : ''}Focus on the key variables and relationships. What formula or concept connects them?`
    ];

    try {
      const response = await fetch('/api/ai/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, hintLevel, userId }),
      });

      const parsed = await safeJsonParse(response);

      if (!parsed.success || !response.ok) {
        set({ isLoading: false, thinkingStage: 'idle' });
        return mockHints[Math.min(hintLevel - 1, mockHints.length - 1)];
      }

      set({ isLoading: false, thinkingStage: 'idle' });
      return (parsed.data as { data?: { hint?: string } })?.data?.hint ||
        mockHints[Math.min(hintLevel - 1, mockHints.length - 1)];
    } catch {
      set({ isLoading: false, thinkingStage: 'idle' });
      return mockHints[Math.min(hintLevel - 1, mockHints.length - 1)];
    }
  },

  clearMessages: () => {
    set({ messages: [], latestMessageId: undefined });
  },

  clearError: () => set({ error: null }),
}));
