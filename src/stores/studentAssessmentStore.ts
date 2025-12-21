import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Assessment,
  AssessmentAttempt,
  AssessmentAttemptAnswer,
  AssessmentQuestion,
} from '@/types';
import { api } from '@/lib/api';

interface StudentAssessmentState {
  // Assigned assessments
  assignedAssessments: Assessment[];
  pendingAssessments: Assessment[];
  completedAssessments: Assessment[];

  // Current assessment being taken
  currentAssessment: Assessment | null;
  currentAttempt: AssessmentAttempt | null;
  currentQuestions: AssessmentQuestion[];
  currentQuestionIndex: number;

  // Answers (keyed by question ID)
  answers: Record<string, string>;
  answeredQuestions: Set<string>;
  markedForReview: Set<string>;

  // Timer
  timeRemaining: number; // seconds
  isTimerRunning: boolean;
  timerWarningShown: boolean;

  // Results
  lastResult: AssessmentAttempt | null;

  // Loading states
  isLoading: boolean;
  isSaving: boolean;
  isSubmitting: boolean;
  error: string | null;

  // ========================================
  // FETCH ACTIONS
  // ========================================

  fetchAssignedAssessments: () => Promise<void>;
  fetchAssessmentDetails: (id: string) => Promise<Assessment | null>;
  fetchAttemptResults: (attemptId: string) => Promise<AssessmentAttempt | null>;

  // ========================================
  // ATTEMPT ACTIONS
  // ========================================

  startAttempt: (assessmentId: string) => Promise<AssessmentAttempt | null>;
  resumeAttempt: (attemptId: string) => Promise<AssessmentAttempt | null>;
  saveAnswer: (questionId: string, answer: string) => Promise<void>;
  markForReview: (questionId: string, marked: boolean) => void;
  submitAttempt: () => Promise<AssessmentAttempt | null>;

  // ========================================
  // NAVIGATION ACTIONS
  // ========================================

  goToQuestion: (index: number) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;

  // ========================================
  // TIMER ACTIONS
  // ========================================

  startTimer: (seconds: number) => void;
  decrementTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  setTimerWarningShown: (shown: boolean) => void;

  // ========================================
  // UTILITY
  // ========================================

  getProgress: () => { answered: number; total: number; percentage: number };
  clearCurrentAssessment: () => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  assignedAssessments: [],
  pendingAssessments: [],
  completedAssessments: [],
  currentAssessment: null,
  currentAttempt: null,
  currentQuestions: [],
  currentQuestionIndex: 0,
  answers: {},
  answeredQuestions: new Set<string>(),
  markedForReview: new Set<string>(),
  timeRemaining: 0,
  isTimerRunning: false,
  timerWarningShown: false,
  lastResult: null,
  isLoading: false,
  isSaving: false,
  isSubmitting: false,
  error: null,
};

export const useStudentAssessmentStore = create<StudentAssessmentState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ========================================
      // FETCH ACTIONS
      // ========================================

      fetchAssignedAssessments: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.get<{
            pending: Assessment[];
            completed: Assessment[];
            all: Assessment[];
          }>('/student/assessments');

          if (!response.success || !response.data) {
            throw new Error(response.error || 'Failed to fetch assessments');
          }

          set({
            assignedAssessments: response.data.all,
            pendingAssessments: response.data.pending,
            completedAssessments: response.data.completed,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch assessments',
            isLoading: false,
          });
        }
      },

      fetchAssessmentDetails: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.get<Assessment>(`/student/assessments/${id}`);

          if (!response.success || !response.data) {
            throw new Error(response.error || 'Failed to fetch assessment');
          }

          set({
            currentAssessment: response.data,
            currentQuestions: response.data.questions || [],
            isLoading: false,
          });

          return response.data;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch assessment',
            isLoading: false,
          });
          return null;
        }
      },

      fetchAttemptResults: async (attemptId: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.get<AssessmentAttempt>(`/student/attempts/${attemptId}`);

          if (!response.success || !response.data) {
            throw new Error(response.error || 'Failed to fetch results');
          }

          set({ lastResult: response.data, isLoading: false });
          return response.data;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch results',
            isLoading: false,
          });
          return null;
        }
      },

      // ========================================
      // ATTEMPT ACTIONS
      // ========================================

      startAttempt: async (assessmentId: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post<{
            attempt: AssessmentAttempt;
            questions: AssessmentQuestion[];
          }>(`/student/assessments/${assessmentId}/start`);

          if (!response.success || !response.data) {
            throw new Error(response.error || 'Failed to start assessment');
          }

          const { attempt, questions } = response.data;

          set({
            currentAttempt: attempt,
            currentQuestions: questions,
            currentQuestionIndex: 0,
            answers: {},
            answeredQuestions: new Set(),
            markedForReview: new Set(),
            timeRemaining: (get().currentAssessment?.timeLimit || 0) * 60, // Convert minutes to seconds
            isTimerRunning: !!get().currentAssessment?.timeLimit,
            timerWarningShown: false,
            isLoading: false,
          });

          return attempt;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to start assessment',
            isLoading: false,
          });
          return null;
        }
      },

      resumeAttempt: async (attemptId: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.get<{
            attempt: AssessmentAttempt;
            questions: AssessmentQuestion[];
            savedAnswers: Record<string, string>;
            timeRemaining: number;
          }>(`/student/attempts/${attemptId}/resume`);

          if (!response.success || !response.data) {
            throw new Error(response.error || 'Failed to resume attempt');
          }

          const { attempt, questions, savedAnswers, timeRemaining } = response.data;

          set({
            currentAttempt: attempt,
            currentQuestions: questions,
            currentQuestionIndex: 0,
            answers: savedAnswers || {},
            answeredQuestions: new Set(Object.keys(savedAnswers || {})),
            markedForReview: new Set(),
            timeRemaining,
            isTimerRunning: timeRemaining > 0,
            timerWarningShown: false,
            isLoading: false,
          });

          return attempt;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to resume attempt',
            isLoading: false,
          });
          return null;
        }
      },

      saveAnswer: async (questionId: string, answer: string) => {
        const { currentAttempt, answers, answeredQuestions } = get();

        // Update local state immediately
        const newAnswers = { ...answers, [questionId]: answer };
        const newAnswered = new Set(answeredQuestions);
        newAnswered.add(questionId);

        set({
          answers: newAnswers,
          answeredQuestions: newAnswered,
        });

        // Save to server
        if (currentAttempt) {
          set({ isSaving: true });
          try {
            await api.put(`/student/assessments/${currentAttempt.assessmentId}/answer`, {
              attemptId: currentAttempt.id,
              questionId,
              answer,
            });
          } catch (error) {
            console.error('Failed to save answer:', error);
            // Don't throw - we still have the local state
          } finally {
            set({ isSaving: false });
          }
        }
      },

      markForReview: (questionId: string, marked: boolean) => {
        set((state) => {
          const newMarked = new Set(state.markedForReview);
          if (marked) {
            newMarked.add(questionId);
          } else {
            newMarked.delete(questionId);
          }
          return { markedForReview: newMarked };
        });
      },

      submitAttempt: async () => {
        const { currentAttempt, answers } = get();

        if (!currentAttempt) {
          set({ error: 'No active attempt' });
          return null;
        }

        set({ isSubmitting: true, error: null, isTimerRunning: false });

        try {
          const response = await api.post<AssessmentAttempt>(
            `/student/assessments/${currentAttempt.assessmentId}/submit`,
            {
              attemptId: currentAttempt.id,
              answers,
            }
          );

          if (!response.success || !response.data) {
            throw new Error(response.error || 'Failed to submit assessment');
          }

          set({
            currentAttempt: null,
            currentQuestions: [],
            answers: {},
            answeredQuestions: new Set(),
            markedForReview: new Set(),
            lastResult: response.data,
            isSubmitting: false,
          });

          return response.data;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to submit assessment',
            isSubmitting: false,
          });
          return null;
        }
      },

      // ========================================
      // NAVIGATION ACTIONS
      // ========================================

      goToQuestion: (index: number) => {
        const { currentQuestions } = get();
        if (index >= 0 && index < currentQuestions.length) {
          set({ currentQuestionIndex: index });
        }
      },

      nextQuestion: () => {
        const { currentQuestionIndex, currentQuestions } = get();
        if (currentQuestionIndex < currentQuestions.length - 1) {
          set({ currentQuestionIndex: currentQuestionIndex + 1 });
        }
      },

      previousQuestion: () => {
        const { currentQuestionIndex } = get();
        if (currentQuestionIndex > 0) {
          set({ currentQuestionIndex: currentQuestionIndex - 1 });
        }
      },

      // ========================================
      // TIMER ACTIONS
      // ========================================

      startTimer: (seconds: number) => {
        set({ timeRemaining: seconds, isTimerRunning: true });
      },

      decrementTimer: () => {
        const { timeRemaining, isTimerRunning } = get();
        if (isTimerRunning && timeRemaining > 0) {
          set({ timeRemaining: timeRemaining - 1 });
        }
      },

      pauseTimer: () => {
        set({ isTimerRunning: false });
      },

      resumeTimer: () => {
        set({ isTimerRunning: true });
      },

      setTimerWarningShown: (shown: boolean) => {
        set({ timerWarningShown: shown });
      },

      // ========================================
      // UTILITY
      // ========================================

      getProgress: () => {
        const { answeredQuestions, currentQuestions } = get();
        const total = currentQuestions.length;
        const answered = answeredQuestions.size;
        return {
          answered,
          total,
          percentage: total > 0 ? Math.round((answered / total) * 100) : 0,
        };
      },

      clearCurrentAssessment: () => {
        set({
          currentAssessment: null,
          currentAttempt: null,
          currentQuestions: [],
          currentQuestionIndex: 0,
          answers: {},
          answeredQuestions: new Set(),
          markedForReview: new Set(),
          timeRemaining: 0,
          isTimerRunning: false,
          timerWarningShown: false,
        });
      },

      clearError: () => set({ error: null }),

      reset: () => set(initialState),
    }),
    {
      name: 'brilla-student-assessment-store',
      partialize: (state) => ({
        // Persist answers in case of page refresh during assessment
        currentAttempt: state.currentAttempt,
        answers: state.answers,
        answeredQuestions: Array.from(state.answeredQuestions),
        markedForReview: Array.from(state.markedForReview),
        timeRemaining: state.timeRemaining,
        currentQuestionIndex: state.currentQuestionIndex,
      }),
      onRehydrateStorage: () => (state) => {
        // Convert arrays back to Sets
        if (state) {
          state.answeredQuestions = new Set(state.answeredQuestions);
          state.markedForReview = new Set(state.markedForReview);
        }
      },
    }
  )
);
