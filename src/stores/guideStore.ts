import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TourStep } from '@/types/guide';

interface GuideState {
  // Onboarding
  showOnboarding: boolean;
  onboardingStep: number;
  hasCompletedOnboarding: boolean;

  // Feature Tours
  activeTour: string | null;
  tourStep: number;
  tourSteps: TourStep[];
  completedTours: string[];

  // Tooltips & Hints
  dismissedHints: string[];
  activeHint: string | null;

  // Help Center
  viewedGuides: string[];
  searchQuery: string;
  selectedCategory: string | null;

  // Actions - Onboarding
  startOnboarding: () => void;
  nextOnboardingStep: () => void;
  prevOnboardingStep: () => void;
  skipOnboarding: () => void;
  completeOnboarding: () => void;

  // Actions - Tours
  startTour: (tourId: string, steps: TourStep[]) => void;
  nextTourStep: () => void;
  prevTourStep: () => void;
  endTour: (completed?: boolean) => void;
  isTourCompleted: (tourId: string) => boolean;

  // Actions - Hints
  showHint: (hintId: string) => void;
  dismissHint: (hintId: string, permanently?: boolean) => void;
  isHintDismissed: (hintId: string) => boolean;

  // Actions - Help Center
  markGuideViewed: (guideId: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string | null) => void;

  // Reset
  resetProgress: () => void;
}

const initialState = {
  showOnboarding: false,
  onboardingStep: 0,
  hasCompletedOnboarding: false,
  activeTour: null,
  tourStep: 0,
  tourSteps: [],
  completedTours: [],
  dismissedHints: [],
  activeHint: null,
  viewedGuides: [],
  searchQuery: '',
  selectedCategory: null,
};

export const useGuideStore = create<GuideState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Onboarding Actions
      startOnboarding: () => {
        // Reset completed state so the tour can be replayed
        set({ showOnboarding: true, onboardingStep: 0, hasCompletedOnboarding: false });
      },

      nextOnboardingStep: () => {
        set((state) => ({ onboardingStep: state.onboardingStep + 1 }));
      },

      prevOnboardingStep: () => {
        set((state) => ({
          onboardingStep: Math.max(0, state.onboardingStep - 1),
        }));
      },

      skipOnboarding: () => {
        set({ showOnboarding: false, hasCompletedOnboarding: true });
      },

      completeOnboarding: () => {
        set({ showOnboarding: false, hasCompletedOnboarding: true });
      },

      // Tour Actions
      startTour: (tourId, steps) => {
        set({
          activeTour: tourId,
          tourStep: 0,
          tourSteps: steps,
        });
      },

      nextTourStep: () => {
        const { tourStep, tourSteps, activeTour, completedTours } = get();
        if (tourStep < tourSteps.length - 1) {
          set({ tourStep: tourStep + 1 });
        } else {
          // Tour completed
          set({
            activeTour: null,
            tourStep: 0,
            tourSteps: [],
            completedTours: activeTour
              ? [...completedTours, activeTour]
              : completedTours,
          });
        }
      },

      prevTourStep: () => {
        set((state) => ({
          tourStep: Math.max(0, state.tourStep - 1),
        }));
      },

      endTour: (completed = false) => {
        const { activeTour, completedTours } = get();
        set({
          activeTour: null,
          tourStep: 0,
          tourSteps: [],
          completedTours:
            completed && activeTour
              ? [...completedTours, activeTour]
              : completedTours,
        });
      },

      isTourCompleted: (tourId) => {
        return get().completedTours.includes(tourId);
      },

      // Hint Actions
      showHint: (hintId) => {
        if (!get().dismissedHints.includes(hintId)) {
          set({ activeHint: hintId });
        }
      },

      dismissHint: (hintId, permanently = true) => {
        set((state) => ({
          activeHint: state.activeHint === hintId ? null : state.activeHint,
          dismissedHints: permanently
            ? [...state.dismissedHints, hintId]
            : state.dismissedHints,
        }));
      },

      isHintDismissed: (hintId) => {
        return get().dismissedHints.includes(hintId);
      },

      // Help Center Actions
      markGuideViewed: (guideId) => {
        set((state) => ({
          viewedGuides: state.viewedGuides.includes(guideId)
            ? state.viewedGuides
            : [...state.viewedGuides, guideId],
        }));
      },

      setSearchQuery: (query) => {
        set({ searchQuery: query });
      },

      setSelectedCategory: (category) => {
        set({ selectedCategory: category });
      },

      // Reset
      resetProgress: () => {
        set(initialState);
      },
    }),
    {
      name: 'brilla-guide-storage',
      partialize: (state) => ({
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        completedTours: state.completedTours,
        dismissedHints: state.dismissedHints,
        viewedGuides: state.viewedGuides,
      }),
    }
  )
);
