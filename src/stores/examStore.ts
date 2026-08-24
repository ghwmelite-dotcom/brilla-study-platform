import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ExamType, ExamTypeSlug, Subject, SubjectCategory, PaperType } from '@/types';
import { api } from '@/lib/api';
import {
  examTypes as localExamTypes,
  getSubjectsByExamType,
  getCategoriesByExamType,
  getPaperTypesByExamType,
} from '@/data';

export interface ApiSubject {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  description?: string | null;
  exam_type_id?: string | null;
  category_id?: string | null;
  waec_code?: string | null;
  is_active?: number | boolean;
  display_order?: number | string;
  topicCount?: number | string;
  questionCount?: number | string;
  availabilityStatus?: string;
  availabilityReason?: string;
  contentReviewStatus?: string;
}

interface ExamState {
  currentExamType: ExamTypeSlug;
  examTypes: ExamType[];
  subjects: Subject[];
  categories: SubjectCategory[];
  paperTypes: PaperType[];
  isLoading: boolean;
  isLoadingSubjects: boolean;
  error: string | null;
  setExamType: (examType: ExamTypeSlug) => void;
  initializeExamData: () => void;
  fetchSubjects: (examType?: ExamTypeSlug) => Promise<void>;
  fetchCategories: (examType: ExamTypeSlug) => void;
  fetchPaperTypes: (examType: ExamTypeSlug) => void;
  getSubjectsByCategory: (categorySlug: string) => Subject[];
  getCategorySubjects: (categoryId: string) => Subject[];
  clearError: () => void;
}

let subjectRequestVersion = 0;

function nonNegativeInteger(value: number | string | undefined): number {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) && numeric > 0 ? Math.floor(numeric) : 0;
}

function isAvailabilityStatus(value: string | undefined): value is Subject['availabilityStatus'] {
  return value === 'available' || value === 'limited' || value === 'unavailable';
}

export function mapApiSubject(subject: ApiSubject): Subject {
  return {
    id: subject.id,
    name: subject.name,
    slug: subject.slug,
    icon: subject.icon,
    color: subject.color,
    description: subject.description ?? undefined,
    examTypeId: subject.exam_type_id ?? undefined,
    categoryId: subject.category_id ?? undefined,
    waecCode: subject.waec_code ?? undefined,
    isActive: subject.is_active === undefined
      ? true
      : subject.is_active === true || Number(subject.is_active) === 1,
    displayOrder: nonNegativeInteger(subject.display_order),
    topicCount: nonNegativeInteger(subject.topicCount),
    questionCount: nonNegativeInteger(subject.questionCount),
    availabilityStatus: isAvailabilityStatus(subject.availabilityStatus)
      ? subject.availabilityStatus
      : 'unknown',
    availabilityReason: subject.availabilityReason,
    contentReviewStatus: subject.contentReviewStatus === 'legacy_unreviewed'
      ? 'legacy_unreviewed'
      : undefined,
  };
}

function getSubjectPlaceholders(examType: ExamTypeSlug): Subject[] {
  return getSubjectsByExamType(examType).map(({ topicCount: _topicCount, questionCount: _questionCount, ...subject }) => ({
    ...subject,
    availabilityStatus: 'unknown' as const,
    availabilityReason: undefined,
    contentReviewStatus: undefined,
  }));
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
        subjectRequestVersion += 1;
        set({
          currentExamType: examType,
          subjects: getSubjectPlaceholders(examType),
          categories: getCategoriesByExamType(examType),
          paperTypes: getPaperTypesByExamType(examType),
          isLoading: false,
          isLoadingSubjects: true,
          error: null,
        });
        void get().fetchSubjects(examType);
      },

      initializeExamData: () => {
        const { currentExamType, subjects } = get();
        set({
          subjects: subjects.length > 0 ? subjects : getSubjectPlaceholders(currentExamType),
          categories: getCategoriesByExamType(currentExamType),
          paperTypes: getPaperTypesByExamType(currentExamType),
          examTypes: localExamTypes,
        });
      },

      fetchSubjects: async (examType) => {
        const exam = examType || get().currentExamType;
        const requestVersion = ++subjectRequestVersion;
        set({
          subjects: getSubjectPlaceholders(exam),
          isLoadingSubjects: true,
          error: null,
        });

        try {
          const response = await api.get<ApiSubject[]>(
            `/subjects?exam_type=${encodeURIComponent(exam)}`,
          );

          if (requestVersion !== subjectRequestVersion || get().currentExamType !== exam) {
            return;
          }

          if (!response?.success || !Array.isArray(response.data)) {
            set({
              isLoadingSubjects: false,
              error: response?.error || 'Live subject availability is temporarily unavailable.',
            });
            return;
          }

          set({
            subjects: response.data.map(mapApiSubject),
            isLoadingSubjects: false,
            error: null,
          });
        } catch (error) {
          if (requestVersion !== subjectRequestVersion || get().currentExamType !== exam) {
            return;
          }

          set({
            isLoadingSubjects: false,
            error: error instanceof Error && error.message
              ? error.message
              : 'Live subject availability is temporarily unavailable.',
          });
        }
      },

      fetchCategories: (examType) => {
        set({ categories: getCategoriesByExamType(examType) });
      },

      fetchPaperTypes: (examType) => {
        set({ paperTypes: getPaperTypesByExamType(examType) });
      },

      getSubjectsByCategory: (categorySlug) => {
        const { subjects, categories } = get();
        const category = categories.find((candidate) => candidate.slug === categorySlug);
        return category ? subjects.filter((subject) => subject.categoryId === category.id) : [];
      },

      getCategorySubjects: (categoryId) => (
        get().subjects.filter((subject) => subject.categoryId === categoryId)
      ),

      clearError: () => set({ error: null }),
    }),
    {
      name: 'brilla-exam',
      partialize: (state) => ({ currentExamType: state.currentExamType }),
    },
  ),
);

const initializeOnLoad = () => {
  const state = useExamStore.getState();
  state.initializeExamData();
  void state.fetchSubjects(state.currentExamType);
};

if (typeof window !== 'undefined') {
  setTimeout(initializeOnLoad, 0);
}
