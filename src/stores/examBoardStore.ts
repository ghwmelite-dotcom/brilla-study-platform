import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ExamBoard,
  SubjectSpecification,
  PaperComponent,
  SyllabusTopic,
  GradeBoundary,
  UserTargetGrade,
  UserSpecificationSelection,
  UserSyllabusProgress,
  CommandWord,
  Subject,
} from '@/types';
import { api } from '@/lib/api';

interface ExamBoardState {
  // Data
  examBoards: ExamBoard[];
  specifications: SubjectSpecification[];
  paperComponents: PaperComponent[];
  syllabusTopics: SyllabusTopic[];
  gradeBoundaries: GradeBoundary[];
  commandWords: CommandWord[];

  // User selections
  userSpecifications: UserSpecificationSelection[];
  userTargetGrades: UserTargetGrade[];
  userSyllabusProgress: UserSyllabusProgress[];

  // Current selections (for wizard/navigation)
  selectedBoardId: string | null;
  selectedSpecificationId: string | null;

  // Available subjects for selected board/level
  availableSubjects: Subject[];

  // Loading states
  isLoading: boolean;
  isLoadingSpecifications: boolean;
  isLoadingSyllabus: boolean;
  isSaving: boolean;
  error: string | null;

  // Setup wizard state
  setupStep: number;
  setupComplete: boolean;

  // Actions - Data fetching
  fetchExamBoards: () => Promise<void>;
  fetchSpecifications: (boardId?: string, examTypeId?: string) => Promise<void>;
  fetchSpecificationDetails: (specificationId: string) => Promise<void>;
  fetchPaperComponents: (specificationId: string) => Promise<void>;
  fetchSyllabusTopics: (specificationId: string) => Promise<void>;
  fetchGradeBoundaries: (specificationId: string, year?: number) => Promise<void>;
  fetchCommandWords: (examBoardId?: string) => Promise<void>;
  fetchAvailableSubjects: (examTypeId: string) => Promise<void>;

  // Actions - User selections
  fetchUserSpecifications: () => Promise<void>;
  selectSpecification: (specificationId: string, priority?: number) => Promise<void>;
  removeSpecification: (specificationId: string) => Promise<void>;
  setTargetGrade: (specificationId: string, grade: string, examSession?: string) => Promise<void>;
  updateSyllabusProgress: (syllabusTopicId: string, status: string, confidence?: number) => Promise<void>;

  // Actions - Navigation
  setSelectedBoard: (boardId: string | null) => void;
  setSelectedSpecification: (specificationId: string | null) => void;

  // Actions - Setup wizard
  setSetupStep: (step: number) => void;
  completeSetup: () => void;
  resetSetup: () => void;

  // Computed getters
  getSpecificationsByBoard: (boardId: string) => SubjectSpecification[];
  getSpecificationsByLevel: (level: string) => SubjectSpecification[];
  getSyllabusTree: (specificationId: string) => SyllabusTopic[];
  getSyllabusProgress: (specificationId: string) => number;
  getPredictedGrade: (specificationId: string) => string | null;

  // Utility
  clearError: () => void;
  reset: () => void;
}

// Build syllabus tree from flat list
function buildSyllabusTree(topics: SyllabusTopic[]): SyllabusTopic[] {
  const topicMap = new Map<string, SyllabusTopic>();
  const roots: SyllabusTopic[] = [];

  // First pass: create map
  topics.forEach((topic) => {
    topicMap.set(topic.id, { ...topic, children: [] });
  });

  // Second pass: build tree
  topics.forEach((topic) => {
    const node = topicMap.get(topic.id)!;
    if (topic.parentId && topicMap.has(topic.parentId)) {
      topicMap.get(topic.parentId)!.children!.push(node);
    } else {
      roots.push(node);
    }
  });

  // Sort by displayOrder
  const sortByOrder = (a: SyllabusTopic, b: SyllabusTopic) =>
    a.displayOrder - b.displayOrder;

  roots.sort(sortByOrder);
  roots.forEach((root) => {
    if (root.children) {
      root.children.sort(sortByOrder);
      root.children.forEach((child) => {
        if (child.children) {
          child.children.sort(sortByOrder);
        }
      });
    }
  });

  return roots;
}

export const useExamBoardStore = create<ExamBoardState>()(
  persist(
    (set, get) => ({
      // Initial state
      examBoards: [],
      specifications: [],
      paperComponents: [],
      syllabusTopics: [],
      gradeBoundaries: [],
      commandWords: [],
      userSpecifications: [],
      userTargetGrades: [],
      userSyllabusProgress: [],
      selectedBoardId: null,
      selectedSpecificationId: null,
      availableSubjects: [],
      isLoading: false,
      isLoadingSpecifications: false,
      isLoadingSyllabus: false,
      isSaving: false,
      error: null,
      setupStep: 0,
      setupComplete: false,

      // Fetch exam boards
      fetchExamBoards: async () => {
        set({ isLoading: true, error: null });
        try {
          console.log('[ExamBoardStore] Fetching exam boards from /exam-boards...');
          const response = await api.get('/exam-boards');
          console.log('[ExamBoardStore] Response:', JSON.stringify(response, null, 2));
          console.log('[ExamBoardStore] success:', response.success, 'data:', response.data);
          if (response.success && response.data) {
            set({ examBoards: response.data as ExamBoard[], isLoading: false });
            console.log('[ExamBoardStore] Loaded', (response.data as ExamBoard[]).length, 'exam boards');
          } else {
            console.error('[ExamBoardStore] Error response - success:', response.success, 'error:', response.error);
            throw new Error(response.error || 'Failed to fetch exam boards');
          }
        } catch (error) {
          console.error('[ExamBoardStore] Caught error:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch exam boards',
            isLoading: false,
          });
        }
      },

      // Fetch specifications
      fetchSpecifications: async (boardId, examTypeId) => {
        set({ isLoadingSpecifications: true, error: null });
        try {
          const params = new URLSearchParams();
          if (boardId) params.append('boardId', boardId);
          if (examTypeId) params.append('examTypeId', examTypeId);

          const response = await api.get(`/exam-boards/specifications?${params.toString()}`);
          if (response.success && response.data) {
            set({ specifications: response.data as SubjectSpecification[], isLoadingSpecifications: false });
          } else {
            throw new Error(response.error || 'Failed to fetch specifications');
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch specifications',
            isLoadingSpecifications: false,
          });
        }
      },

      // Fetch specification details
      fetchSpecificationDetails: async (specificationId) => {
        set({ isLoadingSpecifications: true, error: null });
        try {
          const response = await api.get(`/exam-boards/specifications/${specificationId}`);
          if (response.success && response.data) {
            const specData = response.data as Partial<SubjectSpecification>;
            // Update the specification in the list
            set((state) => ({
              specifications: state.specifications.map((s) =>
                s.id === specificationId ? { ...s, ...specData } : s
              ),
              isLoadingSpecifications: false,
            }));
          } else {
            throw new Error(response.error || 'Failed to fetch specification details');
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch specification details',
            isLoadingSpecifications: false,
          });
        }
      },

      // Fetch paper components
      fetchPaperComponents: async (specificationId) => {
        try {
          const response = await api.get(`/exam-boards/specifications/${specificationId}/papers`);
          if (response.success && response.data) {
            set({ paperComponents: response.data as PaperComponent[] });
          }
        } catch (error) {
          console.error('Failed to fetch paper components:', error);
        }
      },

      // Fetch syllabus topics
      fetchSyllabusTopics: async (specificationId) => {
        set({ isLoadingSyllabus: true, error: null });
        try {
          const response = await api.get(`/exam-boards/specifications/${specificationId}/syllabus`);
          if (response.success && response.data) {
            set({ syllabusTopics: response.data as SyllabusTopic[], isLoadingSyllabus: false });
          } else {
            throw new Error(response.error || 'Failed to fetch syllabus');
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch syllabus',
            isLoadingSyllabus: false,
          });
        }
      },

      // Fetch grade boundaries
      fetchGradeBoundaries: async (specificationId, year) => {
        try {
          const params = new URLSearchParams();
          if (year) params.append('year', year.toString());

          const response = await api.get(
            `/exam-boards/specifications/${specificationId}/grade-boundaries?${params.toString()}`
          );
          if (response.success && response.data) {
            set({ gradeBoundaries: response.data as GradeBoundary[] });
          }
        } catch (error) {
          console.error('Failed to fetch grade boundaries:', error);
        }
      },

      // Fetch command words
      fetchCommandWords: async (examBoardId) => {
        try {
          const params = examBoardId ? `?boardId=${examBoardId}` : '';
          const response = await api.get(`/exam-boards/command-words${params}`);
          if (response.success && response.data) {
            set({ commandWords: response.data as CommandWord[] });
          }
        } catch (error) {
          console.error('Failed to fetch command words:', error);
        }
      },

      // Fetch available subjects for an exam type
      fetchAvailableSubjects: async (examTypeId) => {
        try {
          const response = await api.get(`/exam-boards/subjects?examTypeId=${examTypeId}`);
          if (response.success && response.data) {
            set({ availableSubjects: response.data as Subject[] });
          }
        } catch (error) {
          console.error('Failed to fetch available subjects:', error);
        }
      },

      // Fetch user's selected specifications
      fetchUserSpecifications: async () => {
        set({ isLoading: true });
        try {
          const response = await api.get('/exam-boards/user/specifications');
          if (response.success && response.data) {
            const data = response.data as { specifications?: UserSpecificationSelection[]; targetGrades?: UserTargetGrade[] };
            set({
              userSpecifications: data.specifications || [],
              userTargetGrades: data.targetGrades || [],
              isLoading: false,
            });
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          console.error('Failed to fetch user specifications:', error);
          set({ isLoading: false });
        }
      },

      // Select a specification
      selectSpecification: async (specificationId, priority = 0) => {
        set({ isSaving: true, error: null });
        try {
          const response = await api.post('/exam-boards/user/specifications', {
            specificationId,
            priority,
          });
          if (response.success) {
            await get().fetchUserSpecifications();
            set({ isSaving: false });
          } else {
            throw new Error(response.error || 'Failed to select specification');
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to select specification',
            isSaving: false,
          });
        }
      },

      // Remove a specification
      removeSpecification: async (specificationId) => {
        set({ isSaving: true, error: null });
        try {
          const response = await api.delete(`/exam-boards/user/specifications/${specificationId}`);
          if (response.success) {
            set((state) => ({
              userSpecifications: state.userSpecifications.filter(
                (s) => s.specificationId !== specificationId
              ),
              isSaving: false,
            }));
          } else {
            throw new Error(response.error || 'Failed to remove specification');
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to remove specification',
            isSaving: false,
          });
        }
      },

      // Set target grade
      setTargetGrade: async (specificationId, grade, examSession) => {
        set({ isSaving: true, error: null });
        try {
          const response = await api.post('/exam-boards/user/target-grades', {
            specificationId,
            targetGrade: grade,
            examSession,
          });
          if (response.success) {
            await get().fetchUserSpecifications();
            set({ isSaving: false });
          } else {
            throw new Error(response.error || 'Failed to set target grade');
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to set target grade',
            isSaving: false,
          });
        }
      },

      // Update syllabus progress
      updateSyllabusProgress: async (syllabusTopicId, status, confidence) => {
        try {
          const response = await api.post('/exam-boards/user/syllabus-progress', {
            syllabusTopicId,
            status,
            confidenceLevel: confidence,
          });
          if (response.success && response.data) {
            const progressData = response.data as UserSyllabusProgress;
            set((state) => {
              const existing = state.userSyllabusProgress.findIndex(
                (p) => p.syllabusTopicId === syllabusTopicId
              );
              if (existing >= 0) {
                const updated = [...state.userSyllabusProgress];
                updated[existing] = progressData;
                return { userSyllabusProgress: updated };
              }
              return {
                userSyllabusProgress: [...state.userSyllabusProgress, progressData],
              };
            });
          }
        } catch (error) {
          console.error('Failed to update syllabus progress:', error);
        }
      },

      // Navigation actions
      setSelectedBoard: (boardId) => set({ selectedBoardId: boardId }),
      setSelectedSpecification: (specificationId) =>
        set({ selectedSpecificationId: specificationId }),

      // Setup wizard actions
      setSetupStep: (step) => set({ setupStep: step }),
      completeSetup: () => set({ setupComplete: true, setupStep: 0 }),
      resetSetup: () => set({ setupComplete: false, setupStep: 0 }),

      // Computed getters
      getSpecificationsByBoard: (boardId) => {
        return get().specifications.filter((s) => s.examBoardId === boardId);
      },

      getSpecificationsByLevel: (level) => {
        const { specifications } = get();
        // Get exam types for the specified level
        return specifications.filter((s) => {
          // This would need to check the examType.level field
          return s.examTypeId?.includes(level.toLowerCase());
        });
      },

      getSyllabusTree: (specificationId) => {
        const topics = get().syllabusTopics.filter(
          (t) => t.specificationId === specificationId
        );
        return buildSyllabusTree(topics);
      },

      getSyllabusProgress: (specificationId) => {
        const { syllabusTopics, userSyllabusProgress } = get();
        const specTopics = syllabusTopics.filter(
          (t) => t.specificationId === specificationId
        );
        if (specTopics.length === 0) return 0;

        const completed = specTopics.filter((topic) => {
          const progress = userSyllabusProgress.find(
            (p) => p.syllabusTopicId === topic.id
          );
          return progress?.status === 'completed';
        }).length;

        return Math.round((completed / specTopics.length) * 100);
      },

      getPredictedGrade: (specificationId) => {
        const { userTargetGrades } = get();
        const target = userTargetGrades.find(
          (t) => t.specificationId === specificationId
        );

        // Simple prediction based on syllabus progress
        // TODO: Use gradeBoundaries for more accurate predictions
        const progress = get().getSyllabusProgress(specificationId);

        // Map progress to predicted grade (simplified)
        if (progress >= 90) return 'A*';
        if (progress >= 80) return 'A';
        if (progress >= 70) return 'B';
        if (progress >= 60) return 'C';
        if (progress >= 50) return 'D';
        if (progress >= 40) return 'E';
        return target?.targetGrade || null;
      },

      // Utility
      clearError: () => set({ error: null }),
      reset: () =>
        set({
          examBoards: [],
          specifications: [],
          paperComponents: [],
          syllabusTopics: [],
          gradeBoundaries: [],
          commandWords: [],
          userSpecifications: [],
          userTargetGrades: [],
          userSyllabusProgress: [],
          selectedBoardId: null,
          selectedSpecificationId: null,
          availableSubjects: [],
          isLoading: false,
          isLoadingSpecifications: false,
          isLoadingSyllabus: false,
          isSaving: false,
          error: null,
          setupStep: 0,
          setupComplete: false,
        }),
    }),
    {
      name: 'brilla-exam-board',
      partialize: (state) => ({
        selectedBoardId: state.selectedBoardId,
        selectedSpecificationId: state.selectedSpecificationId,
        setupComplete: state.setupComplete,
      }),
    }
  )
);

// Export for convenience
export type { ExamBoardState };
