import { create } from 'zustand';
import type {
  AssessmentAttempt,
  AssessmentAttemptAnswer,
  GradingFilters,
  AssessmentGradingStatus,
} from '@/types';
import { api } from '@/lib/api';

interface GradingState {
  // Queue of attempts needing grading
  gradingQueue: AssessmentAttempt[];
  queueTotal: number;

  // Current attempt being graded
  currentAttempt: AssessmentAttempt | null;
  currentAnswers: AssessmentAttemptAnswer[];

  // Filters
  filters: GradingFilters;

  // Stats
  pendingCount: number;
  partialCount: number;
  completedTodayCount: number;

  // Loading states
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  // ========================================
  // QUEUE ACTIONS
  // ========================================

  fetchGradingQueue: (filters?: GradingFilters) => Promise<void>;
  setFilters: (filters: GradingFilters) => void;
  refreshQueue: () => Promise<void>;

  // ========================================
  // GRADING ACTIONS
  // ========================================

  loadAttemptForGrading: (attemptId: string) => Promise<AssessmentAttempt | null>;
  gradeAnswer: (answerId: string, marks: number, comment?: string) => Promise<void>;
  gradeMultipleAnswers: (grades: { answerId: string; marks: number; comment?: string }[]) => Promise<void>;
  completeGrading: (attemptId: string, feedback?: string) => Promise<void>;
  returnForRevision: (attemptId: string, reason: string) => Promise<void>;

  // ========================================
  // BULK ACTIONS
  // ========================================

  autoGradeObjectives: (attemptId: string) => Promise<void>;
  gradeAllAnswersFullMarks: (questionId: string) => Promise<void>;

  // ========================================
  // UTILITY
  // ========================================

  clearError: () => void;
  reset: () => void;
}

const initialState = {
  gradingQueue: [],
  queueTotal: 0,
  currentAttempt: null,
  currentAnswers: [],
  filters: {},
  pendingCount: 0,
  partialCount: 0,
  completedTodayCount: 0,
  isLoading: false,
  isSaving: false,
  error: null,
};

export const useGradingStore = create<GradingState>((set, get) => ({
  ...initialState,

  // ========================================
  // QUEUE ACTIONS
  // ========================================

  fetchGradingQueue: async (filters?: GradingFilters) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      const currentFilters = filters || get().filters;

      if (currentFilters.assessmentId) params.append('assessmentId', currentFilters.assessmentId);
      if (currentFilters.status) params.append('status', currentFilters.status);
      if (currentFilters.search) params.append('search', currentFilters.search);

      const response = await api.get<{
        attempts: AssessmentAttempt[];
        total: number;
        pendingCount: number;
        partialCount: number;
        completedTodayCount: number;
      }>(`/grading?${params.toString()}`);

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch grading queue');
      }

      set({
        gradingQueue: response.data.attempts,
        queueTotal: response.data.total,
        pendingCount: response.data.pendingCount,
        partialCount: response.data.partialCount,
        completedTodayCount: response.data.completedTodayCount,
        filters: currentFilters,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch grading queue',
        isLoading: false,
      });
    }
  },

  setFilters: (filters: GradingFilters) => {
    set({ filters });
  },

  refreshQueue: async () => {
    await get().fetchGradingQueue(get().filters);
  },

  // ========================================
  // GRADING ACTIONS
  // ========================================

  loadAttemptForGrading: async (attemptId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<{
        attempt: AssessmentAttempt;
        answers: AssessmentAttemptAnswer[];
      }>(`/grading/${attemptId}`);

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to load attempt');
      }

      set({
        currentAttempt: response.data.attempt,
        currentAnswers: response.data.answers,
        isLoading: false,
      });

      return response.data.attempt;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load attempt',
        isLoading: false,
      });
      return null;
    }
  },

  gradeAnswer: async (answerId: string, marks: number, comment?: string) => {
    set({ isSaving: true, error: null });
    try {
      const { currentAttempt } = get();
      if (!currentAttempt) throw new Error('No attempt loaded');

      const response = await api.post(`/grading/${currentAttempt.id}/answer/${answerId}`, {
        marks,
        comment,
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to grade answer');
      }

      // Update local state
      set((state) => ({
        currentAnswers: state.currentAnswers.map((a) =>
          a.id === answerId
            ? {
                ...a,
                manualMarks: marks,
                teacherComment: comment,
                gradedAt: new Date().toISOString(),
              }
            : a
        ),
        isSaving: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to grade answer',
        isSaving: false,
      });
      throw error;
    }
  },

  gradeMultipleAnswers: async (grades: { answerId: string; marks: number; comment?: string }[]) => {
    set({ isSaving: true, error: null });
    try {
      const { currentAttempt } = get();
      if (!currentAttempt) throw new Error('No attempt loaded');

      const response = await api.post(`/grading/${currentAttempt.id}/answers/batch`, { grades });

      if (!response.success) {
        throw new Error(response.error || 'Failed to grade answers');
      }

      // Update local state
      set((state) => ({
        currentAnswers: state.currentAnswers.map((a) => {
          const grade = grades.find((g) => g.answerId === a.id);
          if (grade) {
            return {
              ...a,
              manualMarks: grade.marks,
              teacherComment: grade.comment,
              gradedAt: new Date().toISOString(),
            };
          }
          return a;
        }),
        isSaving: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to grade answers',
        isSaving: false,
      });
      throw error;
    }
  },

  completeGrading: async (attemptId: string, feedback?: string) => {
    set({ isSaving: true, error: null });
    try {
      const response = await api.post(`/grading/${attemptId}/complete`, { feedback });

      if (!response.success) {
        throw new Error(response.error || 'Failed to complete grading');
      }

      // Update local state
      set((state) => ({
        currentAttempt: state.currentAttempt
          ? {
              ...state.currentAttempt,
              gradingStatus: 'complete' as AssessmentGradingStatus,
              status: 'graded',
              teacherFeedback: feedback,
              gradedAt: new Date().toISOString(),
            }
          : null,
        gradingQueue: state.gradingQueue.filter((a) => a.id !== attemptId),
        pendingCount: state.pendingCount - 1,
        completedTodayCount: state.completedTodayCount + 1,
        isSaving: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to complete grading',
        isSaving: false,
      });
      throw error;
    }
  },

  returnForRevision: async (attemptId: string, reason: string) => {
    set({ isSaving: true, error: null });
    try {
      const response = await api.post(`/grading/${attemptId}/return`, { reason });

      if (!response.success) {
        throw new Error(response.error || 'Failed to return for revision');
      }

      // Remove from queue
      set((state) => ({
        gradingQueue: state.gradingQueue.filter((a) => a.id !== attemptId),
        currentAttempt: null,
        currentAnswers: [],
        isSaving: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to return for revision',
        isSaving: false,
      });
      throw error;
    }
  },

  // ========================================
  // BULK ACTIONS
  // ========================================

  autoGradeObjectives: async (attemptId: string) => {
    set({ isSaving: true, error: null });
    try {
      const response = await api.post(`/grading/${attemptId}/auto-grade`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to auto-grade');
      }

      // Reload attempt to get updated scores
      await get().loadAttemptForGrading(attemptId);
      set({ isSaving: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to auto-grade',
        isSaving: false,
      });
      throw error;
    }
  },

  gradeAllAnswersFullMarks: async (questionId: string) => {
    set({ isSaving: true, error: null });
    try {
      // This would grade all students' answers for a specific question with full marks
      const response = await api.post(`/grading/bulk/full-marks`, { questionId });

      if (!response.success) {
        throw new Error(response.error || 'Failed to bulk grade');
      }

      set({ isSaving: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to bulk grade',
        isSaving: false,
      });
      throw error;
    }
  },

  // ========================================
  // UTILITY
  // ========================================

  clearError: () => set({ error: null }),

  reset: () => set(initialState),
}));
