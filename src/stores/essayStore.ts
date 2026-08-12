import { create } from 'zustand';
import type { EssayQuestion, EssayAttempt, AIEssayFeedback } from '@/types';
import { getAuthHeaders } from '@/lib/api';

interface EssayState {
  // Current essay session
  currentQuestion: EssayQuestion | null;
  currentDraft: string;
  wordCount: number;
  isSubmitting: boolean;
  isGrading: boolean;

  // Grading results
  currentAttempt: EssayAttempt | null;
  gradingResult: AIEssayFeedback | null;

  // History
  history: EssayAttempt[];
  isLoadingHistory: boolean;

  // Error handling
  error: string | null;

  // Actions
  setCurrentQuestion: (question: EssayQuestion | null) => void;
  updateDraft: (text: string) => void;
  clearDraft: () => void;
  submitEssay: (questionId: string, answerText: string) => Promise<EssayAttempt | null>;
  requestAIGrading: (attemptId: string) => Promise<AIEssayFeedback | null>;
  fetchHistory: () => Promise<void>;
  clearCurrentSession: () => void;
  setError: (error: string | null) => void;
}

// Word count helper
function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

// API base URL
const API_BASE = '/api';

export const useEssayStore = create<EssayState>((set, get) => ({
  // Initial state
  currentQuestion: null,
  currentDraft: '',
  wordCount: 0,
  isSubmitting: false,
  isGrading: false,
  currentAttempt: null,
  gradingResult: null,
  history: [],
  isLoadingHistory: false,
  error: null,

  // Set current question
  setCurrentQuestion: (question) => {
    set({
      currentQuestion: question,
      currentDraft: '',
      wordCount: 0,
      currentAttempt: null,
      gradingResult: null,
      error: null,
    });
  },

  // Update draft with word count
  updateDraft: (text) => {
    set({
      currentDraft: text,
      wordCount: countWords(text),
    });
  },

  // Clear draft
  clearDraft: () => {
    set({
      currentDraft: '',
      wordCount: 0,
    });
  },

  // Submit essay for grading
  submitEssay: async (questionId, answerText) => {
    set({ isSubmitting: true, error: null });

    try {
      const response = await fetch(`${API_BASE}/essays/submit`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          questionId,
          answerText,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit essay');
      }

      const attempt: EssayAttempt = await response.json();
      set({
        currentAttempt: attempt,
        isSubmitting: false,
      });

      return attempt;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit essay';
      set({ error: message, isSubmitting: false });
      return null;
    }
  },

  // Request AI grading
  requestAIGrading: async (attemptId) => {
    set({ isGrading: true, error: null });

    try {
      const response = await fetch(`${API_BASE}/essays/${attemptId}/grade`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to grade essay');
      }

      const result = await response.json();
      const feedback: AIEssayFeedback = result.feedback;

      set({
        gradingResult: feedback,
        currentAttempt: {
          ...get().currentAttempt!,
          gradingStatus: 'graded',
          aiScore: result.score,
          aiFeedback: feedback,
        },
        isGrading: false,
      });

      return feedback;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to grade essay';
      set({ error: message, isGrading: false });
      return null;
    }
  },

  // Fetch essay history
  fetchHistory: async () => {
    set({ isLoadingHistory: true, error: null });

    try {
      const response = await fetch(`${API_BASE}/essays/history`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch essay history');
      }

      const data = await response.json();
      set({
        history: data.attempts || [],
        isLoadingHistory: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch history';
      set({ error: message, isLoadingHistory: false });
    }
  },

  // Clear current session
  clearCurrentSession: () => {
    set({
      currentQuestion: null,
      currentDraft: '',
      wordCount: 0,
      currentAttempt: null,
      gradingResult: null,
      error: null,
    });
  },

  // Set error
  setError: (error) => {
    set({ error });
  },
}));
