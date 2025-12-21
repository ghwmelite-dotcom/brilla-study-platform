import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Assessment,
  AssessmentDraft,
  AssessmentQuestionDraft,
  AssessmentAssignmentDraft,
  AssessmentFilters,
  StudentClass,
  TeacherDashboardStats,
  AssessmentType,
  Question,
} from '@/types';
import { api } from '@/lib/api';

// Default draft state (flat structure for easy form binding)
const defaultDraft: AssessmentDraft = {
  step: 0,
  // Basic Info
  title: '',
  description: '',
  assessmentType: 'quiz',
  subjectId: undefined,
  instructions: '',
  // Timing
  timeLimit: undefined,
  startDate: undefined,
  endDate: undefined,
  lateSubmissionAllowed: false,
  latePenaltyPercent: 0,
  // Settings
  passingScore: undefined,
  showCorrectAnswers: true,
  showScoreImmediately: true,
  shuffleQuestions: false,
  shuffleOptions: false,
  oneQuestionPerPage: false,
  allowReview: true,
  maxAttempts: 1,
  // Questions and Assignments
  questions: [],
  assignments: [],
};

interface AssessmentState {
  // Assessments
  assessments: Assessment[];
  currentAssessment: Assessment | null;

  // Classes
  classes: StudentClass[];
  currentClass: StudentClass | null;

  // Question Bank (for picker)
  questionBank: Question[];
  questionBankTotal: number;

  // Builder draft
  draft: AssessmentDraft;
  isEditMode: boolean;
  editingAssessmentId: string | null;

  // Dashboard stats
  dashboardStats: TeacherDashboardStats | null;

  // Loading states
  isLoading: boolean;
  isSaving: boolean;
  isLoadingClasses: boolean;
  isLoadingQuestions: boolean;
  error: string | null;

  // ========================================
  // ASSESSMENT ACTIONS
  // ========================================

  fetchAssessments: (filters?: AssessmentFilters) => Promise<void>;
  fetchAssessment: (id: string) => Promise<Assessment | null>;
  createAssessment: () => Promise<Assessment | null>;
  updateAssessment: (id: string, data: Partial<Assessment>) => Promise<void>;
  deleteAssessment: (id: string) => Promise<void>;
  publishAssessment: (id: string) => Promise<void>;
  archiveAssessment: (id: string) => Promise<void>;
  duplicateAssessment: (id: string) => Promise<Assessment | null>;

  // ========================================
  // QUESTION ACTIONS
  // ========================================

  addQuestionsToAssessment: (assessmentId: string, questions: AssessmentQuestionDraft[]) => Promise<void>;
  removeQuestionFromAssessment: (assessmentId: string, questionId: string) => Promise<void>;
  reorderQuestions: (assessmentId: string, questionIds: string[]) => Promise<void>;

  // ========================================
  // ASSIGNMENT ACTIONS
  // ========================================

  assignAssessment: (assessmentId: string, assignments: AssessmentAssignmentDraft[]) => Promise<void>;
  removeAssignment: (assessmentId: string, assignmentId: string) => Promise<void>;

  // ========================================
  // CLASS ACTIONS
  // ========================================

  fetchClasses: () => Promise<void>;
  fetchClass: (id: string) => Promise<StudentClass | null>;
  createClass: (data: Partial<StudentClass>) => Promise<StudentClass | null>;
  updateClass: (id: string, data: Partial<StudentClass>) => Promise<void>;
  deleteClass: (id: string) => Promise<void>;
  addClassMembers: (classId: string, studentIds: string[]) => Promise<void>;
  removeClassMember: (classId: string, memberId: string) => Promise<void>;

  // ========================================
  // QUESTION BANK ACTIONS
  // ========================================

  searchQuestionBank: (params: {
    search?: string;
    subjectId?: string;
    topicId?: string;
    difficulty?: string;
    questionType?: string;
    limit?: number;
    offset?: number;
  }) => Promise<void>;

  // ========================================
  // DASHBOARD ACTIONS
  // ========================================

  fetchDashboardStats: () => Promise<void>;

  // ========================================
  // DRAFT ACTIONS
  // ========================================

  initDraft: (type?: AssessmentType) => void;
  loadAssessmentIntoDraft: (assessment: Assessment) => void;
  updateDraft: (updates: Partial<AssessmentDraft>) => void;
  addDraftQuestion: (question: AssessmentQuestionDraft) => void;
  addDraftQuestions: (questions: AssessmentQuestionDraft[]) => void;
  removeDraftQuestion: (id: string) => void;
  updateDraftQuestion: (id: string, updates: Partial<AssessmentQuestionDraft>) => void;
  reorderDraftQuestions: (startIndex: number, endIndex: number) => void;
  setDraftAssignments: (assignments: AssessmentAssignmentDraft[]) => void;
  setDraftStep: (step: number) => void;
  resetDraft: () => void;
  clearDraft: () => void;
  saveDraft: () => Promise<boolean>;
  saveDraftAsAssessment: () => Promise<Assessment | null>;

  // ========================================
  // UTILITY
  // ========================================

  clearError: () => void;
  reset: () => void;
}

const initialState = {
  assessments: [],
  currentAssessment: null,
  classes: [],
  currentClass: null,
  questionBank: [],
  questionBankTotal: 0,
  draft: { ...defaultDraft },
  isEditMode: false,
  editingAssessmentId: null,
  dashboardStats: null,
  isLoading: false,
  isSaving: false,
  isLoadingClasses: false,
  isLoadingQuestions: false,
  error: null,
};

export const useAssessmentStore = create<AssessmentState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ========================================
      // ASSESSMENT ACTIONS
      // ========================================

      fetchAssessments: async (filters?: AssessmentFilters) => {
        set({ isLoading: true, error: null });
        try {
          const params = new URLSearchParams();
          if (filters?.status) params.append('status', filters.status);
          if (filters?.type) params.append('type', filters.type);
          if (filters?.subjectId) params.append('subjectId', filters.subjectId);
          if (filters?.search) params.append('search', filters.search);

          const response = await api.get<Assessment[]>(`/assessments?${params.toString()}`);

          if (!response.success || !response.data) {
            throw new Error(response.error || 'Failed to fetch assessments');
          }

          set({ assessments: response.data, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch assessments',
            isLoading: false,
          });
        }
      },

      fetchAssessment: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.get<Assessment>(`/assessments/${id}`);

          if (!response.success || !response.data) {
            throw new Error(response.error || 'Failed to fetch assessment');
          }

          set({ currentAssessment: response.data, isLoading: false });
          return response.data;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch assessment',
            isLoading: false,
          });
          return null;
        }
      },

      createAssessment: async () => {
        const { draft } = get();
        set({ isSaving: true, error: null });

        try {
          const assessmentData = {
            title: draft.title,
            description: draft.description,
            assessmentType: draft.assessmentType,
            subjectId: draft.subjectId,
            instructions: draft.instructions,
            timeLimit: draft.timeLimit,
            startDate: draft.startDate,
            endDate: draft.endDate,
            lateSubmissionAllowed: draft.lateSubmissionAllowed,
            latePenaltyPercent: draft.latePenaltyPercent,
            passingScore: draft.passingScore,
            showCorrectAnswers: draft.showCorrectAnswers,
            showScoreImmediately: draft.showScoreImmediately,
            shuffleQuestions: draft.shuffleQuestions,
            shuffleOptions: draft.shuffleOptions,
            oneQuestionPerPage: draft.oneQuestionPerPage,
            allowReview: draft.allowReview,
            maxAttempts: draft.maxAttempts,
            questions: draft.questions,
            assignments: draft.assignments,
          };

          const response = await api.post<Assessment>('/assessments', assessmentData);

          if (!response.success || !response.data) {
            throw new Error(response.error || 'Failed to create assessment');
          }

          // Add to list
          set((state) => ({
            assessments: [response.data!, ...state.assessments],
            currentAssessment: response.data,
            isSaving: false,
          }));

          return response.data;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to create assessment',
            isSaving: false,
          });
          return null;
        }
      },

      updateAssessment: async (id: string, data: Partial<Assessment>) => {
        set({ isSaving: true, error: null });
        try {
          const response = await api.put<Assessment>(`/assessments/${id}`, data);

          if (!response.success) {
            throw new Error(response.error || 'Failed to update assessment');
          }

          // Update in list
          set((state) => ({
            assessments: state.assessments.map((a) =>
              a.id === id ? { ...a, ...data } : a
            ),
            currentAssessment:
              state.currentAssessment?.id === id
                ? { ...state.currentAssessment, ...data }
                : state.currentAssessment,
            isSaving: false,
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update assessment',
            isSaving: false,
          });
          throw error;
        }
      },

      deleteAssessment: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.delete(`/assessments/${id}`);

          if (!response.success) {
            throw new Error(response.error || 'Failed to delete assessment');
          }

          set((state) => ({
            assessments: state.assessments.filter((a) => a.id !== id),
            currentAssessment:
              state.currentAssessment?.id === id ? null : state.currentAssessment,
            isLoading: false,
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to delete assessment',
            isLoading: false,
          });
          throw error;
        }
      },

      publishAssessment: async (id: string) => {
        set({ isSaving: true, error: null });
        try {
          const response = await api.post<Assessment>(`/assessments/${id}/publish`);

          if (!response.success) {
            throw new Error(response.error || 'Failed to publish assessment');
          }

          set((state) => ({
            assessments: state.assessments.map((a) =>
              a.id === id ? { ...a, status: 'published', publishedAt: new Date().toISOString() } : a
            ),
            currentAssessment:
              state.currentAssessment?.id === id
                ? { ...state.currentAssessment, status: 'published', publishedAt: new Date().toISOString() }
                : state.currentAssessment,
            isSaving: false,
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to publish assessment',
            isSaving: false,
          });
          throw error;
        }
      },

      archiveAssessment: async (id: string) => {
        set({ isSaving: true, error: null });
        try {
          const response = await api.post(`/assessments/${id}/archive`);

          if (!response.success) {
            throw new Error(response.error || 'Failed to archive assessment');
          }

          set((state) => ({
            assessments: state.assessments.map((a) =>
              a.id === id ? { ...a, status: 'archived', archivedAt: new Date().toISOString() } : a
            ),
            isSaving: false,
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to archive assessment',
            isSaving: false,
          });
          throw error;
        }
      },

      duplicateAssessment: async (id: string) => {
        set({ isSaving: true, error: null });
        try {
          const response = await api.post<Assessment>(`/assessments/${id}/duplicate`);

          if (!response.success || !response.data) {
            throw new Error(response.error || 'Failed to duplicate assessment');
          }

          set((state) => ({
            assessments: [response.data!, ...state.assessments],
            isSaving: false,
          }));

          return response.data;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to duplicate assessment',
            isSaving: false,
          });
          return null;
        }
      },

      // ========================================
      // QUESTION ACTIONS
      // ========================================

      addQuestionsToAssessment: async (assessmentId: string, questions: AssessmentQuestionDraft[]) => {
        set({ isSaving: true, error: null });
        try {
          const response = await api.post(`/assessments/${assessmentId}/questions`, { questions });

          if (!response.success) {
            throw new Error(response.error || 'Failed to add questions');
          }

          // Refresh assessment
          await get().fetchAssessment(assessmentId);
          set({ isSaving: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to add questions',
            isSaving: false,
          });
          throw error;
        }
      },

      removeQuestionFromAssessment: async (assessmentId: string, questionId: string) => {
        set({ isSaving: true, error: null });
        try {
          const response = await api.delete(`/assessments/${assessmentId}/questions/${questionId}`);

          if (!response.success) {
            throw new Error(response.error || 'Failed to remove question');
          }

          // Update current assessment
          set((state) => ({
            currentAssessment: state.currentAssessment
              ? {
                  ...state.currentAssessment,
                  questions: state.currentAssessment.questions?.filter((q) => q.id !== questionId),
                }
              : null,
            isSaving: false,
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to remove question',
            isSaving: false,
          });
          throw error;
        }
      },

      reorderQuestions: async (assessmentId: string, questionIds: string[]) => {
        set({ isSaving: true, error: null });
        try {
          const response = await api.post(`/assessments/${assessmentId}/questions/reorder`, { questionIds });

          if (!response.success) {
            throw new Error(response.error || 'Failed to reorder questions');
          }

          set({ isSaving: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to reorder questions',
            isSaving: false,
          });
          throw error;
        }
      },

      // ========================================
      // ASSIGNMENT ACTIONS
      // ========================================

      assignAssessment: async (assessmentId: string, assignments: AssessmentAssignmentDraft[]) => {
        set({ isSaving: true, error: null });
        try {
          const response = await api.post(`/assessments/${assessmentId}/assign`, { assignments });

          if (!response.success) {
            throw new Error(response.error || 'Failed to assign assessment');
          }

          // Refresh assessment
          await get().fetchAssessment(assessmentId);
          set({ isSaving: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to assign assessment',
            isSaving: false,
          });
          throw error;
        }
      },

      removeAssignment: async (assessmentId: string, assignmentId: string) => {
        set({ isSaving: true, error: null });
        try {
          const response = await api.delete(`/assessments/${assessmentId}/assignments/${assignmentId}`);

          if (!response.success) {
            throw new Error(response.error || 'Failed to remove assignment');
          }

          set((state) => ({
            currentAssessment: state.currentAssessment
              ? {
                  ...state.currentAssessment,
                  assignments: state.currentAssessment.assignments?.filter((a) => a.id !== assignmentId),
                }
              : null,
            isSaving: false,
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to remove assignment',
            isSaving: false,
          });
          throw error;
        }
      },

      // ========================================
      // CLASS ACTIONS
      // ========================================

      fetchClasses: async () => {
        set({ isLoadingClasses: true, error: null });
        try {
          const response = await api.get<StudentClass[]>('/classes');

          if (!response.success || !response.data) {
            throw new Error(response.error || 'Failed to fetch classes');
          }

          set({ classes: response.data, isLoadingClasses: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch classes',
            isLoadingClasses: false,
          });
        }
      },

      fetchClass: async (id: string) => {
        set({ isLoadingClasses: true, error: null });
        try {
          const response = await api.get<StudentClass>(`/classes/${id}`);

          if (!response.success || !response.data) {
            throw new Error(response.error || 'Failed to fetch class');
          }

          set({ currentClass: response.data, isLoadingClasses: false });
          return response.data;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch class',
            isLoadingClasses: false,
          });
          return null;
        }
      },

      createClass: async (data: Partial<StudentClass>) => {
        set({ isSaving: true, error: null });
        try {
          const response = await api.post<StudentClass>('/classes', data);

          if (!response.success || !response.data) {
            throw new Error(response.error || 'Failed to create class');
          }

          set((state) => ({
            classes: [...state.classes, response.data!],
            isSaving: false,
          }));

          return response.data;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to create class',
            isSaving: false,
          });
          return null;
        }
      },

      updateClass: async (id: string, data: Partial<StudentClass>) => {
        set({ isSaving: true, error: null });
        try {
          const response = await api.put<StudentClass>(`/classes/${id}`, data);

          if (!response.success) {
            throw new Error(response.error || 'Failed to update class');
          }

          set((state) => ({
            classes: state.classes.map((c) => (c.id === id ? { ...c, ...data } : c)),
            currentClass: state.currentClass?.id === id ? { ...state.currentClass, ...data } : state.currentClass,
            isSaving: false,
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update class',
            isSaving: false,
          });
          throw error;
        }
      },

      deleteClass: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.delete(`/classes/${id}`);

          if (!response.success) {
            throw new Error(response.error || 'Failed to delete class');
          }

          set((state) => ({
            classes: state.classes.filter((c) => c.id !== id),
            currentClass: state.currentClass?.id === id ? null : state.currentClass,
            isLoading: false,
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to delete class',
            isLoading: false,
          });
          throw error;
        }
      },

      addClassMembers: async (classId: string, studentIds: string[]) => {
        set({ isSaving: true, error: null });
        try {
          const response = await api.post(`/classes/${classId}/members`, { studentIds });

          if (!response.success) {
            throw new Error(response.error || 'Failed to add members');
          }

          // Refresh class
          await get().fetchClass(classId);
          set({ isSaving: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to add members',
            isSaving: false,
          });
          throw error;
        }
      },

      removeClassMember: async (classId: string, memberId: string) => {
        set({ isSaving: true, error: null });
        try {
          const response = await api.delete(`/classes/${classId}/members/${memberId}`);

          if (!response.success) {
            throw new Error(response.error || 'Failed to remove member');
          }

          set((state) => ({
            currentClass: state.currentClass
              ? {
                  ...state.currentClass,
                  members: state.currentClass.members?.filter((m) => m.id !== memberId),
                  memberCount: (state.currentClass.memberCount || 1) - 1,
                }
              : null,
            isSaving: false,
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to remove member',
            isSaving: false,
          });
          throw error;
        }
      },

      // ========================================
      // QUESTION BANK ACTIONS
      // ========================================

      searchQuestionBank: async (params) => {
        set({ isLoadingQuestions: true, error: null });
        try {
          const searchParams = new URLSearchParams();
          if (params.search) searchParams.append('search', params.search);
          if (params.subjectId) searchParams.append('subject', params.subjectId);
          if (params.topicId) searchParams.append('topic', params.topicId);
          if (params.difficulty) searchParams.append('difficulty', params.difficulty);
          if (params.questionType) searchParams.append('type', params.questionType);
          if (params.limit) searchParams.append('limit', params.limit.toString());
          if (params.offset) searchParams.append('offset', params.offset.toString());

          const response = await api.get<{ questions: Question[]; total: number }>(
            `/questions/bank?${searchParams.toString()}`
          );

          if (!response.success || !response.data) {
            throw new Error(response.error || 'Failed to search questions');
          }

          set({
            questionBank: response.data.questions,
            questionBankTotal: response.data.total,
            isLoadingQuestions: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to search questions',
            isLoadingQuestions: false,
          });
        }
      },

      // ========================================
      // DASHBOARD ACTIONS
      // ========================================

      fetchDashboardStats: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.get<TeacherDashboardStats>('/teacher/dashboard');

          if (!response.success || !response.data) {
            throw new Error(response.error || 'Failed to fetch dashboard stats');
          }

          set({ dashboardStats: response.data, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch dashboard stats',
            isLoading: false,
          });
        }
      },

      // ========================================
      // DRAFT ACTIONS
      // ========================================

      initDraft: (type?: AssessmentType) => {
        set({
          draft: {
            ...defaultDraft,
            assessmentType: type || 'quiz',
          },
          isEditMode: false,
          editingAssessmentId: null,
        });
      },

      loadAssessmentIntoDraft: (assessment: Assessment) => {
        set({
          draft: {
            id: assessment.id,
            step: 0,
            // Basic Info
            title: assessment.title,
            description: assessment.description || '',
            assessmentType: assessment.assessmentType,
            subjectId: assessment.subjectId,
            instructions: assessment.instructions || '',
            // Timing
            timeLimit: assessment.timeLimit,
            startDate: assessment.startDate,
            endDate: assessment.endDate,
            lateSubmissionAllowed: assessment.lateSubmissionAllowed,
            latePenaltyPercent: assessment.latePenaltyPercent,
            // Settings
            passingScore: assessment.passingScore,
            showCorrectAnswers: assessment.showCorrectAnswers,
            showScoreImmediately: assessment.showScoreImmediately,
            shuffleQuestions: assessment.shuffleQuestions,
            shuffleOptions: assessment.shuffleOptions,
            oneQuestionPerPage: assessment.oneQuestionPerPage,
            allowReview: assessment.allowReview,
            maxAttempts: assessment.maxAttempts,
            // Questions
            questions: (assessment.questions || []).map((q, index) => ({
              id: q.id,
              source: (q.questionId ? 'existing' : 'custom') as 'existing' | 'custom',
              questionId: q.questionId,
              customQuestionText: q.customQuestionText,
              customQuestionType: q.customQuestionType,
              customOptions: q.customOptions,
              customCorrectAnswer: q.customCorrectAnswer,
              customExplanation: q.customExplanation,
              displayOrder: index,
              marks: q.marks,
              question: q.question,
            })),
            assignments: [],
          },
          isEditMode: true,
          editingAssessmentId: assessment.id,
        });
      },

      updateDraft: (updates: Partial<AssessmentDraft>) => {
        set((state) => ({
          draft: { ...state.draft, ...updates },
        }));
      },

      addDraftQuestion: (question: AssessmentQuestionDraft) => {
        set((state) => ({
          draft: {
            ...state.draft,
            questions: [...state.draft.questions, question],
          },
        }));
      },

      addDraftQuestions: (questions: AssessmentQuestionDraft[]) => {
        set((state) => ({
          draft: {
            ...state.draft,
            questions: [...state.draft.questions, ...questions],
          },
        }));
      },

      removeDraftQuestion: (id: string) => {
        set((state) => ({
          draft: {
            ...state.draft,
            questions: state.draft.questions.filter((q) => q.id !== id),
          },
        }));
      },

      updateDraftQuestion: (id: string, updates: Partial<AssessmentQuestionDraft>) => {
        set((state) => ({
          draft: {
            ...state.draft,
            questions: state.draft.questions.map((q) =>
              q.id === id ? { ...q, ...updates } : q
            ),
          },
        }));
      },

      reorderDraftQuestions: (startIndex: number, endIndex: number) => {
        set((state) => {
          const questions = [...state.draft.questions];
          const [removed] = questions.splice(startIndex, 1);
          questions.splice(endIndex, 0, removed);
          // Update displayOrder
          questions.forEach((q, i) => {
            q.displayOrder = i;
          });
          return {
            draft: { ...state.draft, questions },
          };
        });
      },

      setDraftAssignments: (assignments: AssessmentAssignmentDraft[]) => {
        set((state) => ({
          draft: { ...state.draft, assignments },
        }));
      },

      setDraftStep: (step: number) => {
        set((state) => ({
          draft: { ...state.draft, step },
        }));
      },

      resetDraft: () => {
        set({
          draft: { ...defaultDraft },
          isEditMode: false,
          editingAssessmentId: null,
        });
      },

      clearDraft: () => {
        set({
          draft: { ...defaultDraft },
          isEditMode: false,
          editingAssessmentId: null,
        });
      },

      saveDraft: async () => {
        // Draft is auto-persisted via zustand persist middleware
        // This function is for explicit save actions
        return true;
      },

      saveDraftAsAssessment: async () => {
        const { isEditMode, editingAssessmentId, draft } = get();

        if (isEditMode && editingAssessmentId) {
          // Update existing
          await get().updateAssessment(editingAssessmentId, {
            title: draft.title,
            description: draft.description,
            assessmentType: draft.assessmentType,
            subjectId: draft.subjectId,
            instructions: draft.instructions,
            timeLimit: draft.timeLimit,
            startDate: draft.startDate,
            endDate: draft.endDate,
            lateSubmissionAllowed: draft.lateSubmissionAllowed,
            latePenaltyPercent: draft.latePenaltyPercent,
            passingScore: draft.passingScore,
            showCorrectAnswers: draft.showCorrectAnswers,
            showScoreImmediately: draft.showScoreImmediately,
            shuffleQuestions: draft.shuffleQuestions,
            shuffleOptions: draft.shuffleOptions,
            oneQuestionPerPage: draft.oneQuestionPerPage,
            allowReview: draft.allowReview,
            maxAttempts: draft.maxAttempts,
          });
          return get().currentAssessment;
        } else {
          // Create new
          return await get().createAssessment();
        }
      },

      // ========================================
      // UTILITY
      // ========================================

      clearError: () => set({ error: null }),

      reset: () => set(initialState),
    }),
    {
      name: 'brilla-assessment-store',
      partialize: (state) => ({
        draft: state.draft,
        isEditMode: state.isEditMode,
        editingAssessmentId: state.editingAssessmentId,
      }),
    }
  )
);
