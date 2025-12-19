import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ExamType, ExamTypeSlug, Subject, SubjectCategory, PaperType } from '@/types';

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
  setExamType: (examType: ExamTypeSlug) => Promise<void>;
  fetchExamTypes: () => Promise<void>;
  fetchSubjects: (examType?: ExamTypeSlug, category?: string) => Promise<void>;
  fetchCategories: (examType: ExamTypeSlug) => Promise<void>;
  fetchPaperTypes: (examType: ExamTypeSlug) => Promise<void>;
  getSubjectsByCategory: (categorySlug: string) => Subject[];
  clearError: () => void;
}

export const useExamStore = create<ExamState>()(
  persist(
    (set, get) => ({
      currentExamType: 'nsmq',
      examTypes: [],
      subjects: [],
      categories: [],
      paperTypes: [],
      isLoading: false,
      isLoadingSubjects: false,
      error: null,

      setExamType: async (examType) => {
        set({ currentExamType: examType, isLoading: true });

        // Load data for the new exam type
        const { fetchSubjects, fetchCategories, fetchPaperTypes } = get();

        try {
          await Promise.all([
            fetchSubjects(examType),
            fetchCategories(examType),
            fetchPaperTypes(examType),
          ]);
          set({ isLoading: false });
        } catch {
          set({ isLoading: false, error: 'Failed to load exam data' });
        }
      },

      fetchExamTypes: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/exam-types');
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch exam types');
          }

          set({ examTypes: data.data, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch exam types',
            isLoading: false,
          });
        }
      },

      fetchSubjects: async (examType, category) => {
        const exam = examType || get().currentExamType;
        set({ isLoadingSubjects: true, error: null });

        try {
          let url = `/api/subjects?exam_type=${exam}`;
          if (category) {
            url += `&category=${category}`;
          }

          const response = await fetch(url);
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch subjects');
          }

          set({ subjects: data.data, isLoadingSubjects: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch subjects',
            isLoadingSubjects: false,
          });
        }
      },

      fetchCategories: async (examType) => {
        try {
          const response = await fetch(`/api/exam-types/${examType}/categories`);
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch categories');
          }

          set({ categories: data.data });
        } catch (error) {
          console.error('Failed to fetch categories:', error);
        }
      },

      fetchPaperTypes: async (examType) => {
        try {
          const response = await fetch(`/api/exam-types/${examType}/paper-types`);
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch paper types');
          }

          set({ paperTypes: data.data });
        } catch (error) {
          console.error('Failed to fetch paper types:', error);
        }
      },

      getSubjectsByCategory: (categorySlug) => {
        const { subjects } = get();
        return subjects.filter((s) => s.category?.slug === categorySlug);
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
