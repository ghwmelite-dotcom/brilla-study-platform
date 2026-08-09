import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { examService } from '@/lib/services';
import type { UserExamPreference, ExamTypeSlug } from '@/types';

interface ExamPreferencesState {
  // User's exam preferences
  preferences: UserExamPreference[];
  primaryExamTypeId: string | null;

  // Currently active exam type for filtering
  activeExamTypeId: string | null;

  // All available exam types
  availableExamTypes: Array<{
    id: string;
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    color?: string;
  }>;

  // Loading states
  isLoading: boolean;
  isLoadingExamTypes: boolean;
  error: string | null;

  // Actions
  loadExamTypes: () => Promise<void>;
  loadPreferences: () => Promise<void>;
  setPreferences: (examTypeIds: string[], primaryId: string) => Promise<void>;
  setActiveExamType: (examTypeId: string) => void;
  hasExamType: (examTypeId: string) => boolean;
  getActiveExamSlug: () => ExamTypeSlug | null;
  clearPreferences: () => void;
  clearError: () => void;
}

export const useExamPreferencesStore = create<ExamPreferencesState>()(
  persist(
    (set, get) => ({
      preferences: [],
      primaryExamTypeId: null,
      activeExamTypeId: null,
      availableExamTypes: [],
      isLoading: false,
      isLoadingExamTypes: false,
      error: null,

      loadExamTypes: async () => {
        set({ isLoadingExamTypes: true, error: null });
        try {
          const examTypes = await examService.getExamTypes();
          set({
            availableExamTypes: examTypes,
            isLoadingExamTypes: false
          });
        } catch (error) {
          console.error('Failed to load exam types:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to load exam types',
            isLoadingExamTypes: false
          });
        }
      },

      loadPreferences: async () => {
        set({ isLoading: true, error: null });
        try {
          const data = await examService.getMyExamPreferences();
          const { preferences: rawPreferences, primaryExamTypeId } = data;

          // Map preferences to ensure correct types
          const preferences: UserExamPreference[] = rawPreferences.map(p => ({
            id: p.id,
            examTypeId: p.examTypeId,
            isPrimary: p.isPrimary,
            targetYear: p.targetYear,
            name: p.name,
            slug: p.slug as ExamTypeSlug,
            description: p.description,
            icon: p.icon,
            color: p.color,
          }));

          // Set active exam type to primary if not already set
          const currentActive = get().activeExamTypeId;
          const activeId = currentActive || primaryExamTypeId ||
            (preferences.length > 0 ? preferences[0].examTypeId : null);

          set({
            preferences,
            primaryExamTypeId,
            activeExamTypeId: activeId,
            isLoading: false
          });
        } catch (error) {
          console.error('Failed to load exam preferences:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to load preferences',
            isLoading: false
          });
        }
      },

      setPreferences: async (examTypeIds: string[], primaryId: string) => {
        set({ isLoading: true, error: null });
        try {
          await examService.setMyExamPreferences({ examTypeIds, primaryExamTypeId: primaryId });

          // Reload preferences after update
          await get().loadPreferences();
        } catch (error) {
          console.error('Failed to set exam preferences:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to update preferences',
            isLoading: false
          });
          throw error;
        }
      },

      setActiveExamType: (examTypeId: string) => {
        const { preferences } = get();
        // Only allow setting active if user has this preference
        if (preferences.some(p => p.examTypeId === examTypeId)) {
          set({ activeExamTypeId: examTypeId });
        }
      },

      hasExamType: (examTypeId: string) => {
        const { preferences } = get();
        return preferences.some(p => p.examTypeId === examTypeId);
      },

      getActiveExamSlug: () => {
        const { activeExamTypeId, preferences } = get();
        if (!activeExamTypeId) return null;

        const activePref = preferences.find(p => p.examTypeId === activeExamTypeId);
        return activePref?.slug as ExamTypeSlug || null;
      },

      clearPreferences: () => {
        set({
          preferences: [],
          primaryExamTypeId: null,
          activeExamTypeId: null,
          error: null,
        });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'exam-preferences-storage',
      partialize: (state) => ({
        preferences: state.preferences,
        primaryExamTypeId: state.primaryExamTypeId,
        activeExamTypeId: state.activeExamTypeId,
      }),
    }
  )
);
