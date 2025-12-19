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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}_assistant`,
        role: 'assistant',
        content: data.data.message,
        timestamp: new Date(),
      };

      set((state) => ({
        messages: [...state.messages, assistantMessage],
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to get response',
        isLoading: false,
      });
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get explanation');
      }

      set({ isLoading: false });
      return data.data.explanation;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to get explanation',
        isLoading: false,
      });
      throw error;
    }
  },

  getHint: async (question, hintLevel, userId) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch('/api/ai/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, hintLevel, userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get hint');
      }

      set({ isLoading: false });
      return data.data.hint;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to get hint',
        isLoading: false,
      });
      throw error;
    }
  },

  clearMessages: () => {
    set({ messages: [] });
  },

  clearError: () => set({ error: null }),
}));
