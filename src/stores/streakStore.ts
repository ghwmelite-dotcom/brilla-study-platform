import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StreakInfo, StreakMilestone } from '@/types';
import { api } from '@/lib/api';

// Extended streak types
export interface SubjectStreak {
  subjectId: string;
  subjectName: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
}

export interface StreakRescue {
  available: boolean;
  cooldownUntil: string | null;
  lastRescueDate: string | null;
  rescuesUsedThisMonth: number;
  maxRescuesPerMonth: number;
}

export interface ExtendedStreakMilestone extends StreakMilestone {
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  badge?: string;
}

// Enhanced milestones configuration
export const STREAK_MILESTONES: ExtendedStreakMilestone[] = [
  { id: 'streak_3', days: 3, name: 'First Steps', description: '3-day streak', xpReward: 50, protectionReward: 0, isClaimed: false, rarity: 'common', badge: 'streak_3' },
  { id: 'streak_7', days: 7, name: 'Week Warrior', description: '7-day streak', xpReward: 100, protectionReward: 1, isClaimed: false, rarity: 'common', badge: 'streak_7' },
  { id: 'streak_14', days: 14, name: 'Fortnight Fighter', description: '14-day streak', xpReward: 200, protectionReward: 0, isClaimed: false, rarity: 'rare', badge: 'streak_14' },
  { id: 'streak_30', days: 30, name: 'Monthly Master', description: '30-day streak', xpReward: 500, protectionReward: 2, isClaimed: false, rarity: 'rare', badge: 'streak_30' },
  { id: 'streak_60', days: 60, name: 'Dedication Champion', description: '60-day streak', xpReward: 1000, protectionReward: 2, isClaimed: false, rarity: 'epic', badge: 'streak_60' },
  { id: 'streak_100', days: 100, name: 'Centurion', description: '100-day streak', xpReward: 2000, protectionReward: 5, isClaimed: false, rarity: 'epic', badge: 'streak_100' },
  { id: 'streak_200', days: 200, name: 'Legendary Learner', description: '200-day streak', xpReward: 5000, protectionReward: 5, isClaimed: false, rarity: 'legendary', badge: 'streak_200' },
  { id: 'streak_365', days: 365, name: 'Year Legend', description: '365-day streak', xpReward: 10000, protectionReward: 10, isClaimed: false, rarity: 'legendary', badge: 'streak_365' },
];

interface StreakState {
  // Original data
  streakInfo: StreakInfo | null;
  milestones: StreakMilestone[];
  isLoading: boolean;
  error: string | null;

  // Extended streak data
  subjectStreaks: SubjectStreak[];
  accuracyStreak: number; // Days with 80%+ accuracy
  perfectDayStreak: number; // Days with 100% accuracy
  streakRescue: StreakRescue;
  streakAtRisk: boolean;
  hoursUntilStreakEnds: number | null;
  dailyAccuracy: number | null;
  dailyQuestionsCount: number;

  // Original actions
  fetchStreakInfo: () => Promise<void>;
  useProtection: () => Promise<boolean>;
  claimMilestone: (milestoneId: string) => Promise<{ xp: number; protections: number } | null>;
  recordActivity: () => Promise<void>;
  clearError: () => void;

  // Extended actions
  fetchSubjectStreaks: () => Promise<void>;
  useStreakRescue: () => Promise<boolean>;
  checkStreakAtRisk: () => void;
  updateDailyStats: (correct: boolean, total: number) => void;
  recordSubjectActivity: (subjectId: string, subjectName: string) => void;
  getNextMilestone: () => ExtendedStreakMilestone | null;
  getMilestoneProgress: () => { current: number; next: number; percentage: number };
}

export const useStreakStore = create<StreakState>()(
  persist(
    (set, get) => ({
  streakInfo: null,
  milestones: [],
  isLoading: false,
  error: null,

  // Extended state
  subjectStreaks: [],
  accuracyStreak: 0,
  perfectDayStreak: 0,
  streakRescue: {
    available: true,
    cooldownUntil: null,
    lastRescueDate: null,
    rescuesUsedThisMonth: 0,
    maxRescuesPerMonth: 2,
  },
  streakAtRisk: false,
  hoursUntilStreakEnds: null,
  dailyAccuracy: null,
  dailyQuestionsCount: 0,

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

  // Extended actions

  // Fetch subject-specific streaks
  fetchSubjectStreaks: async () => {
    try {
      const response = await api.get<{ subjectStreaks: SubjectStreak[] }>('/streak/subjects');
      if (response.success && response.data) {
        set({ subjectStreaks: response.data.subjectStreaks });
      }
    } catch (error) {
      console.error('Failed to fetch subject streaks:', error);
    }
  },

  // Use streak rescue (one-time restore of lost streak)
  useStreakRescue: async () => {
    const { streakRescue } = get();

    if (!streakRescue.available) {
      return false;
    }

    // Check cooldown
    if (streakRescue.cooldownUntil && new Date(streakRescue.cooldownUntil) > new Date()) {
      return false;
    }

    // Check monthly limit
    if (streakRescue.rescuesUsedThisMonth >= streakRescue.maxRescuesPerMonth) {
      return false;
    }

    try {
      const response = await api.post('/streak/rescue');

      if (response.success) {
        const now = new Date();
        const cooldownDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days cooldown

        set({
          streakRescue: {
            ...streakRescue,
            available: false,
            cooldownUntil: cooldownDate.toISOString(),
            lastRescueDate: now.toISOString(),
            rescuesUsedThisMonth: streakRescue.rescuesUsedThisMonth + 1,
          },
          streakAtRisk: false,
        });

        // Refresh streak info
        get().fetchStreakInfo();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to use streak rescue:', error);
      return false;
    }
  },

  // Check if streak is at risk (less than 4 hours until midnight)
  checkStreakAtRisk: () => {
    const { streakInfo } = get();
    if (!streakInfo?.lastActivity) {
      set({ streakAtRisk: false, hoursUntilStreakEnds: null });
      return;
    }

    const lastActivity = new Date(streakInfo.lastActivity);
    const today = new Date();
    const lastActivityDate = lastActivity.toISOString().split('T')[0];
    const todayDate = today.toISOString().split('T')[0];

    // If already practiced today, not at risk
    if (lastActivityDate === todayDate) {
      set({ streakAtRisk: false, hoursUntilStreakEnds: null });
      return;
    }

    // Calculate hours until midnight
    const midnight = new Date(today);
    midnight.setHours(23, 59, 59, 999);
    const hoursRemaining = Math.max(0, (midnight.getTime() - today.getTime()) / (1000 * 60 * 60));

    set({
      streakAtRisk: hoursRemaining < 4 && streakInfo.currentStreak > 0,
      hoursUntilStreakEnds: Math.round(hoursRemaining * 10) / 10,
    });
  },

  // Update daily accuracy stats
  updateDailyStats: (correct: boolean, _total: number) => {
    const { dailyAccuracy, dailyQuestionsCount, perfectDayStreak } = get();

    const newCount = dailyQuestionsCount + 1;
    const currentCorrect = dailyAccuracy !== null
      ? Math.round((dailyAccuracy / 100) * dailyQuestionsCount)
      : 0;
    const newCorrect = currentCorrect + (correct ? 1 : 0);
    const newAccuracy = Math.round((newCorrect / newCount) * 100);

    // Check if this ends a perfect day streak
    const stillPerfect = correct && (dailyAccuracy === null || dailyAccuracy === 100);

    set({
      dailyAccuracy: newAccuracy,
      dailyQuestionsCount: newCount,
      // If accuracy drops below 80%, reset accuracy streak at end of day
      // If no longer perfect, perfect day streak ends
      perfectDayStreak: stillPerfect ? perfectDayStreak : 0,
    });
  },

  // Record activity for a specific subject
  recordSubjectActivity: (subjectId: string, subjectName: string) => {
    const { subjectStreaks } = get();
    const today = new Date().toISOString().split('T')[0];

    const existingStreak = subjectStreaks.find((s) => s.subjectId === subjectId);

    if (existingStreak) {
      const lastDate = existingStreak.lastActivityDate;
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // If last activity was today, no update needed
      if (lastDate === today) return;

      // If last activity was yesterday, increment streak
      // Otherwise, reset streak to 1
      const newStreak = lastDate === yesterday ? existingStreak.currentStreak + 1 : 1;

      set({
        subjectStreaks: subjectStreaks.map((s) =>
          s.subjectId === subjectId
            ? {
                ...s,
                currentStreak: newStreak,
                longestStreak: Math.max(s.longestStreak, newStreak),
                lastActivityDate: today,
              }
            : s
        ),
      });
    } else {
      // New subject streak
      set({
        subjectStreaks: [
          ...subjectStreaks,
          {
            subjectId,
            subjectName,
            currentStreak: 1,
            longestStreak: 1,
            lastActivityDate: today,
          },
        ],
      });
    }
  },

  // Get next unclaimed milestone
  getNextMilestone: () => {
    const { streakInfo, milestones } = get();
    if (!streakInfo) return STREAK_MILESTONES[0];

    const currentStreak = streakInfo.currentStreak;
    const claimedIds = new Set(milestones.filter((m) => m.isClaimed).map((m) => m.id));

    return (
      STREAK_MILESTONES.find(
        (m) => !claimedIds.has(m.id) && m.days > currentStreak
      ) || null
    );
  },

  // Get milestone progress
  getMilestoneProgress: () => {
    const { streakInfo } = get();
    const currentStreak = streakInfo?.currentStreak || 0;
    const nextMilestone = get().getNextMilestone();

    if (!nextMilestone) {
      return { current: currentStreak, next: currentStreak, percentage: 100 };
    }

    // Find previous milestone
    const prevMilestone = STREAK_MILESTONES
      .filter((m) => m.days <= currentStreak)
      .sort((a, b) => b.days - a.days)[0];

    const start = prevMilestone?.days || 0;
    const end = nextMilestone.days;
    const progress = currentStreak - start;
    const total = end - start;
    const percentage = Math.round((progress / total) * 100);

    return {
      current: currentStreak,
      next: nextMilestone.days,
      percentage: Math.min(100, Math.max(0, percentage)),
    };
  },
    }),
    {
      name: 'brilla-streak',
      version: 1,
      partialize: (state) => ({
        subjectStreaks: state.subjectStreaks,
        accuracyStreak: state.accuracyStreak,
        perfectDayStreak: state.perfectDayStreak,
        streakRescue: state.streakRescue,
        dailyAccuracy: state.dailyAccuracy,
        dailyQuestionsCount: state.dailyQuestionsCount,
      }),
    }
  )
);
