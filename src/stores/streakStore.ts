import { create } from 'zustand';
import type { StreakInfo, StreakMilestone } from '@/types';
import { api } from '@/lib/api';

interface StreakState {
  // Data
  streakInfo: StreakInfo | null;
  milestones: StreakMilestone[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchStreakInfo: () => Promise<void>;
  useProtection: () => Promise<boolean>;
  claimMilestone: (milestoneId: string) => Promise<{ xp: number; protections: number } | null>;
  recordActivity: () => Promise<void>;
  clearError: () => void;
}

export const useStreakStore = create<StreakState>((set, get) => ({
  streakInfo: null,
  milestones: [],
  isLoading: false,
  error: null,

  fetchStreakInfo: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.get<{
        currentStreak: number;
        longestStreak: number;
        lastActivity?: string;
        protectionsAvailable: number;
        protectionActive: boolean;
        protectionLastUsed?: string;
        milestones: Array<{
          id: string;
          days: number;
          name: string;
          description: string;
          xp_reward: number;
          protection_reward: number;
          is_claimed: number;
        }>;
      }>('/streak/info');

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch streak info');
      }

      const data = response.data;
      const milestones: StreakMilestone[] = data.milestones.map((m) => ({
        id: m.id,
        days: m.days,
        name: m.name,
        description: m.description,
        xpReward: m.xp_reward,
        protectionReward: m.protection_reward,
        isClaimed: !!m.is_claimed,
      }));

      // Find next unclaimed milestone
      const nextMilestone = milestones.find(
        (m) => !m.isClaimed && m.days > data.currentStreak
      );

      // Get recently achieved but unclaimed milestones
      const recentMilestones = milestones.filter(
        (m) => !m.isClaimed && m.days <= data.currentStreak
      );

      set({
        streakInfo: {
          currentStreak: data.currentStreak,
          longestStreak: data.longestStreak,
          lastActivity: data.lastActivity,
          protection: {
            available: data.protectionsAvailable,
            isActive: data.protectionActive,
            lastUsed: data.protectionLastUsed,
            canUseToday: !data.protectionActive && data.protectionsAvailable > 0,
          },
          nextMilestone,
          recentMilestones,
        },
        milestones,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch streak info',
        isLoading: false,
      });
    }
  },

  useProtection: async () => {
    const { streakInfo } = get();
    if (!streakInfo?.protection.canUseToday) {
      return false;
    }

    try {
      const response = await api.post('/streak/use-protection');

      if (!response.success) {
        throw new Error(response.error || 'Failed to use protection');
      }

      // Update local state
      set({
        streakInfo: streakInfo
          ? {
              ...streakInfo,
              protection: {
                ...streakInfo.protection,
                available: streakInfo.protection.available - 1,
                isActive: true,
                lastUsed: new Date().toISOString(),
                canUseToday: false,
              },
            }
          : null,
      });

      return true;
    } catch (error) {
      console.error('Failed to use protection:', error);
      return false;
    }
  },

  claimMilestone: async (milestoneId: string) => {
    try {
      const response = await api.post<{
        xp: number;
        protections: number;
      }>(`/streak/milestones/${milestoneId}/claim`);

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to claim milestone');
      }

      // Update local state
      set((state) => ({
        milestones: state.milestones.map((m) =>
          m.id === milestoneId ? { ...m, isClaimed: true } : m
        ),
        streakInfo: state.streakInfo
          ? {
              ...state.streakInfo,
              protection: {
                ...state.streakInfo.protection,
                available: state.streakInfo.protection.available + response.data!.protections,
              },
              recentMilestones: state.streakInfo.recentMilestones.filter(
                (m) => m.id !== milestoneId
              ),
            }
          : null,
      }));

      return response.data;
    } catch (error) {
      console.error('Failed to claim milestone:', error);
      return null;
    }
  },

  recordActivity: async () => {
    try {
      await api.post('/streak/activity');
      // Refresh streak info after recording activity
      get().fetchStreakInfo();
    } catch (error) {
      console.error('Failed to record activity:', error);
    }
  },

  clearError: () => set({ error: null }),
}));
