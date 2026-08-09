/**
 * Usage Store
 * Manages daily question usage limits for freemium model
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';
import { DAILY_QUESTION_LIMIT } from '@/config';

export interface DailyUsage {
  used: number;
  limit: number;
  remaining: number;
  resetsAt: string;
  isPremium: boolean;
  isUnlimited: boolean;
}

interface UsageState {
  // State
  dailyUsage: DailyUsage | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: string | null;

  // Actions
  fetchDailyUsage: () => Promise<void>;
  incrementLocal: () => void;
  setUsageFromResponse: (usage: Partial<DailyUsage>) => void;
  resetState: () => void;
  checkLimitReached: () => boolean;
  shouldShowWarning: () => boolean;
}

const DEFAULT_USAGE: DailyUsage = {
  used: 0,
  limit: DAILY_QUESTION_LIMIT,
  remaining: DAILY_QUESTION_LIMIT,
  resetsAt: new Date().toISOString(),
  isPremium: false,
  isUnlimited: false,
};

export const useUsageStore = create<UsageState>()(
  persist(
    (set, get) => ({
      // Initial state
      dailyUsage: null,
      isLoading: false,
      error: null,
      lastFetched: null,

      // Fetch daily usage from API
      fetchDailyUsage: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await api.get<DailyUsage>('/usage/daily');

          if (response && response.success && response.data) {
            set({
              dailyUsage: response.data,
              isLoading: false,
              lastFetched: new Date().toISOString(),
            });
          } else {
            // Default to free tier limits
            set({
              dailyUsage: DEFAULT_USAGE,
              isLoading: false,
              lastFetched: new Date().toISOString(),
            });
          }
        } catch (error) {
          console.error('Failed to fetch daily usage:', error);
          set({
            error: 'Failed to fetch usage info',
            isLoading: false,
            // Still set default so UI doesn't break
            dailyUsage: get().dailyUsage || DEFAULT_USAGE,
          });
        }
      },

      // Increment local count (optimistic update)
      incrementLocal: () => {
        const { dailyUsage } = get();
        if (!dailyUsage || dailyUsage.isUnlimited) return;

        set({
          dailyUsage: {
            ...dailyUsage,
            used: dailyUsage.used + 1,
            remaining: Math.max(0, dailyUsage.remaining - 1),
          },
        });
      },

      // Update usage from API response (e.g., after submitting an answer)
      setUsageFromResponse: (usage) => {
        const { dailyUsage } = get();
        if (!dailyUsage) {
          set({
            dailyUsage: {
              ...DEFAULT_USAGE,
              ...usage,
            } as DailyUsage,
          });
          return;
        }

        set({
          dailyUsage: {
            ...dailyUsage,
            ...usage,
          },
        });
      },

      // Reset state (e.g., on logout)
      resetState: () => {
        set({
          dailyUsage: null,
          isLoading: false,
          error: null,
          lastFetched: null,
        });
      },

      // Check if daily limit is reached
      checkLimitReached: () => {
        const { dailyUsage } = get();
        if (!dailyUsage) return false;
        if (dailyUsage.isUnlimited) return false;
        return dailyUsage.remaining <= 0;
      },

      // Check if we should show warning (3 or fewer remaining)
      shouldShowWarning: () => {
        const { dailyUsage } = get();
        if (!dailyUsage) return false;
        if (dailyUsage.isUnlimited) return false;
        return dailyUsage.remaining <= 3 && dailyUsage.remaining > 0;
      },
    }),
    {
      name: 'brilla-usage',
      partialize: (state) => ({
        dailyUsage: state.dailyUsage,
        lastFetched: state.lastFetched,
      }),
    }
  )
);

export default useUsageStore;
