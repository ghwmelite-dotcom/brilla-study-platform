import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AiTutorState {
  isOpen: boolean;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  currentContext?: string;

  // Actions
  openChat: (context?: string) => void;
  closeChat: () => void;
  sendMessage: (message: string, userId: string) => Promise<void>;
  explainQuestion: (question: string, correctAnswer: string, userAnswer?: string, isCorrect?: boolean, userId?: string) => Promise<string>;
  getHint: (question: string, hintLevel: number, userId: string) => Promise<string>;
  clearMessages: () => void;
  clearError: () => void;
}

// Mock AI responses when API is unavailable
function generateMockResponse(message: string): string {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('study') || lowerMessage.includes('tip')) {
    return `Here are some effective study tips:

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

Would you like me to explain any of these strategies in more detail?`;
  }

  if (lowerMessage.includes('explain') || lowerMessage.includes('what is')) {
    return `I'd be happy to help explain that concept!

To give you the best explanation, could you please:
1. Specify which subject (Maths, Physics, Chemistry, Biology, or another WASSCE subject)
2. Tell me what specifically you're finding confusing

For example, you could ask:
- "Explain the concept of momentum in Physics"
- "What is photosynthesis and how does it work?"
- "How do I solve quadratic equations?"

I'm here to help you understand!`;
  }

  if (lowerMessage.includes('formula') || lowerMessage.includes('equation')) {
    return `Formulas are key to success in science and maths exams!

**Tips for learning formulas:**

1. **Understand, don't just memorize** - Know what each variable represents and why the formula works
2. **Use flashcards** - Write formula on one side, meaning on the other
3. **Practice application** - Use the formula in different types of problems
4. **Group related formulas** - E.g., all kinematic equations together

Which specific formula would you like me to explain?`;
  }

  if (lowerMessage.includes('hello') || lowerMessage.includes('hi ') || lowerMessage === 'hi') {
    return `Hello! I'm Brilla AI, your personal study assistant.

I can help you with:
- **Explaining concepts** in any WASSCE subject
- **Study tips** and exam strategies
- **Practice questions** and worked solutions
- **Formula explanations** and derivations

What would you like help with today?`;
  }

  // Default response
  return `Thanks for your question! I'm here to help you prepare for your exams.

I can assist you with:
- **Subject explanations** - Ask me about any topic in Maths, Sciences, English, or other subjects
- **Study strategies** - Get tips for effective revision
- **Exam techniques** - Learn how to approach different question types
- **Practice problems** - Work through examples together

What specific topic or question would you like help with?`;
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

export const useAiTutorStore = create<AiTutorState>()((set, get) => ({
  isOpen: false,
  messages: [],
  isLoading: false,
  error: null,
  currentContext: undefined,

  openChat: (context) => {
    set({ isOpen: true, currentContext: context });
  },

  closeChat: () => {
    set({ isOpen: false });
  },

  sendMessage: async (message, userId) => {
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    set((state) => ({
      messages: [...state.messages, userMessage],
      isLoading: true,
      error: null,
    }));

    try {
      let assistantContent: string;

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
          }),
        });

        const parsed = await safeJsonParse(response);

        if (!parsed.success || !response.ok) {
          // API unavailable or returned error - use mock response
          assistantContent = generateMockResponse(message);
        } else {
          assistantContent = (parsed.data as { data?: { message?: string } })?.data?.message || generateMockResponse(message);
        }
      } catch {
        // Network error or API unavailable - use mock response
        assistantContent = generateMockResponse(message);
      }

      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}_assistant`,
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date(),
      };

      set((state) => ({
        messages: [...state.messages, assistantMessage],
        isLoading: false,
      }));
    } catch (error) {
      // Final fallback - still provide a response
      const fallbackMessage: ChatMessage = {
        id: `msg_${Date.now()}_assistant`,
        role: 'assistant',
        content: generateMockResponse(message),
        timestamp: new Date(),
      };

      set((state) => ({
        messages: [...state.messages, fallbackMessage],
        isLoading: false,
        error: null,
      }));
    }
  },

  explainQuestion: async (question, correctAnswer, userAnswer, isCorrect, userId) => {
    set({ isLoading: true, error: null });

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
        }),
      });

      const parsed = await safeJsonParse(response);

      if (!parsed.success || !response.ok) {
        // Return mock explanation
        const mockExplanation = isCorrect
          ? `Excellent work! The correct answer is "${correctAnswer}".\n\nYou demonstrated a good understanding of this concept. Keep practicing to reinforce your knowledge!`
          : `The correct answer is "${correctAnswer}".\n\n${userAnswer ? `Your answer "${userAnswer}" was not quite right. ` : ''}This concept requires understanding the underlying principles. Review the topic and try similar questions to strengthen your understanding.`;

        set({ isLoading: false });
        return mockExplanation;
      }

      set({ isLoading: false });
      return (parsed.data as { data?: { explanation?: string } })?.data?.explanation ||
        `The correct answer is "${correctAnswer}". Keep practicing!`;
    } catch {
      const fallbackExplanation = `The correct answer is "${correctAnswer}".\n\nThis is a common question type. Make sure you understand the key concepts and practice similar problems.`;
      set({ isLoading: false });
      return fallbackExplanation;
    }
  },

  getHint: async (question, hintLevel, userId) => {
    set({ isLoading: true, error: null });

    const mockHints = [
      "Think about the fundamental concepts involved. What principles might apply here?",
      "Consider breaking the problem into smaller parts. What information do you already have?",
      "Focus on the key variables and relationships. What formula or concept connects them?"
    ];

    try {
      const response = await fetch('/api/ai/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, hintLevel, userId }),
      });

      const parsed = await safeJsonParse(response);

      if (!parsed.success || !response.ok) {
        set({ isLoading: false });
        return mockHints[Math.min(hintLevel - 1, mockHints.length - 1)];
      }

      set({ isLoading: false });
      return (parsed.data as { data?: { hint?: string } })?.data?.hint ||
        mockHints[Math.min(hintLevel - 1, mockHints.length - 1)];
    } catch {
      set({ isLoading: false });
      return mockHints[Math.min(hintLevel - 1, mockHints.length - 1)];
    }
  },

  clearMessages: () => {
    set({ messages: [] });
  },

  clearError: () => set({ error: null }),
}));
