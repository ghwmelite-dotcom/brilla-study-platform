import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ExamType, ExamTypeSlug, Subject, SubjectCategory, PaperType } from '@/types';
import {
  examTypes as localExamTypes,
  getSubjectsByExamType,
  getCategoriesByExamType,
  getPaperTypesByExamType,
} from '@/data';

interface ExamState {
  // Current exam mode
  currentExamType: ExamTypeSlug;
  examTypes: ExamType[];

  // Loaded data for current exam
  subjects: Subject[];
  categories: SubjectCategory[];
  paperTypes: PaperType[];

  // Loading states
  isLoading: boolean;
  isLoadingSubjects: boolean;
  error: string | null;

  // Actions
  setExamType: (examType: ExamTypeSlug) => void;
  initializeExamData: () => void;
  fetchSubjects: (examType?: ExamTypeSlug) => void;
  fetchCategories: (examType: ExamTypeSlug) => void;
  fetchPaperTypes: (examType: ExamTypeSlug) => void;
  getSubjectsByCategory: (categorySlug: string) => Subject[];
  getCategorySubjects: (categoryId: string) => Subject[];
  clearError: () => void;
}

export const useExamStore = create<ExamState>()(
  persist(
    (set, get) => ({
      currentExamType: 'nsmq',
      examTypes: localExamTypes,
      subjects: [],
      categories: [],
      paperTypes: [],
      isLoading: false,
      isLoadingSubjects: false,
      error: null,

      setExamType: (examType) => {
        set({ currentExamType: examType, isLoading: true });

        // Load data for the new exam type using local data
        const subjects = getSubjectsByExamType(examType);
        const categories = getCategoriesByExamType(examType);
        const paperTypes = getPaperTypesByExamType(examType);

        set({
          subjects,
          categories,
          paperTypes,
          isLoading: false,
          isLoadingSubjects: false,
        });
      },

      initializeExamData: () => {
        const { currentExamType } = get();

        // Load data for current exam type
        const subjects = getSubjectsByExamType(currentExamType);
        const categories = getCategoriesByExamType(currentExamType);
        const paperTypes = getPaperTypesByExamType(currentExamType);

        set({
          subjects,
          categories,
          paperTypes,
          examTypes: localExamTypes,
        });
      },

      fetchSubjects: (examType) => {
        const exam = examType || get().currentExamType;
        set({ isLoadingSubjects: true });

        const subjects = getSubjectsByExamType(exam);
        set({ subjects, isLoadingSubjects: false });
      },

      fetchCategories: (examType) => {
        const categories = getCategoriesByExamType(examType);
        set({ categories });
      },

      fetchPaperTypes: (examType) => {
        const paperTypes = getPaperTypesByExamType(examType);
        set({ paperTypes });
      },

      getSubjectsByCategory: (categorySlug) => {
        const { subjects, categories } = get();
        const category = categories.find((c) => c.slug === categorySlug);
        if (!category) return [];
        return subjects.filter((s) => s.categoryId === category.id);
      },

      getCategorySubjects: (categoryId) => {
        const { subjects } = get();
        return subjects.filter((s) => s.categoryId === categoryId);
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'brilla-exam',
      partialize: (state) => ({
        currentExamType: state.currentExamType,
      }),
    }
  )
);

// Initialize exam data on store creation
// This runs after rehydration automatically
const initializeOnLoad = () => {
  const state = useExamStore.getState();
  if (state.subjects.length === 0) {
    state.initializeExamData();
  }
};

// Call initialization after a microtask to ensure store is fully created
if (typeof window !== 'undefined') {
  setTimeout(initializeOnLoad, 0);
}
