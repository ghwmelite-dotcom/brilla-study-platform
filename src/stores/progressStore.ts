import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProgress, Achievement, LeaderboardEntry, LeaderboardPeriod } from '@/types';

// Clear old cached data on load
const STORE_VERSION = 2;
if (typeof window !== 'undefined') {
  try {
    const stored = localStorage.getItem('brilla-progress');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Clear if no version or old version
      if (!parsed.version || parsed.version < STORE_VERSION) {
        localStorage.removeItem('brilla-progress');
      }
    }
  } catch {
    localStorage.removeItem('brilla-progress');
  }
}

interface ProgressState {
  // Progress data
  topicProgress: Record<string, UserProgress>;
  subjectProgress: Record<string, { attempted: number; correct: number; mastery: number }>;

  // Stats
  totalQuestionsAttempted: number;
  totalCorrect: number;
  overallAccuracy: number;
  currentStreak: number;
  longestStreak: number;
  totalXP: number;
  level: number;

  // Achievements
  achievements: Achievement[];
  unlockedAchievements: string[];

  // Leaderboard
  leaderboard: Record<LeaderboardPeriod, LeaderboardEntry[]>;
  userRank: Record<LeaderboardPeriod, number>;

  // Loading states
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchProgress: () => Promise<void>;
  updateTopicProgress: (topicId: string, correct: boolean) => void;
  calculateMastery: (topicId: string) => number;

  addXP: (amount: number) => void;
  checkLevelUp: () => boolean;

  checkAchievements: () => Achievement[];
  unlockAchievement: (achievementId: string) => void;

  fetchLeaderboard: (period: LeaderboardPeriod) => Promise<void>;

  getStrengths: () => { topicId: string; name: string; mastery: number }[];
  getWeaknesses: () => { topicId: string; name: string; mastery: number }[];

  reset: () => void;
}

const XP_PER_LEVEL = 1000;

const initialState = {
  topicProgress: {},
  subjectProgress: {},
  totalQuestionsAttempted: 0,
  totalCorrect: 0,
  overallAccuracy: 0,
  currentStreak: 0,
  longestStreak: 0,
  totalXP: 0,
  level: 1,
  achievements: [],
  unlockedAchievements: [],
  leaderboard: {
    daily: [],
    weekly: [],
    monthly: [],
    all_time: [],
  },
  userRank: {
    daily: 0,
    weekly: 0,
    monthly: 0,
    all_time: 0,
  },
  isLoading: false,
  error: null,
};

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      ...initialState,

      fetchProgress: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/progress');
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch progress');
          }

          set({
            topicProgress: data.topicProgress || {},
            subjectProgress: data.subjectProgress || {},
            totalQuestionsAttempted: data.totalAttempted || 0,
            totalCorrect: data.totalCorrect || 0,
            overallAccuracy: data.accuracy || 0,
            currentStreak: data.streak || 0,
            totalXP: data.xp || 0,
            level: data.level || 1,
            achievements: data.achievements || [],
            unlockedAchievements: data.unlockedAchievements || [],
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch progress',
            isLoading: false,
          });
        }
      },

      updateTopicProgress: (topicId, correct) => {
        const { topicProgress, totalQuestionsAttempted, totalCorrect, currentStreak, longestStreak } = get();

        const existing = topicProgress[topicId] || {
          id: `progress_${topicId}`,
          userId: '',
          topicId,
          questionsAttempted: 0,
          questionsCorrect: 0,
          masteryLevel: 0,
          lastAttemptAt: '',
        };

        const updated: UserProgress = {
          ...existing,
          questionsAttempted: existing.questionsAttempted + 1,
          questionsCorrect: existing.questionsCorrect + (correct ? 1 : 0),
          lastAttemptAt: new Date().toISOString(),
        };

        // Calculate mastery level (0-100)
        updated.masteryLevel = Math.round(
          (updated.questionsCorrect / updated.questionsAttempted) * 100
        );

        const newStreak = correct ? currentStreak + 1 : 0;
        const newTotalAttempted = totalQuestionsAttempted + 1;
        const newTotalCorrect = totalCorrect + (correct ? 1 : 0);

        set({
          topicProgress: { ...topicProgress, [topicId]: updated },
          totalQuestionsAttempted: newTotalAttempted,
          totalCorrect: newTotalCorrect,
          overallAccuracy: Math.round((newTotalCorrect / newTotalAttempted) * 100),
          currentStreak: newStreak,
          longestStreak: Math.max(longestStreak, newStreak),
        });
      },

      calculateMastery: (topicId) => {
        const { topicProgress } = get();
        const progress = topicProgress[topicId];

        if (!progress || progress.questionsAttempted === 0) {
          return 0;
        }

        return Math.round((progress.questionsCorrect / progress.questionsAttempted) * 100);
      },

      addXP: (amount) => {
        set((state) => ({
          totalXP: state.totalXP + amount,
        }));
      },

      checkLevelUp: () => {
        const { totalXP, level } = get();
        const xpForNextLevel = level * XP_PER_LEVEL;

        if (totalXP >= xpForNextLevel) {
          set({ level: level + 1 });
          return true;
        }
        return false;
      },

      checkAchievements: () => {
        const {
          achievements,
          unlockedAchievements,
          totalQuestionsAttempted,
          currentStreak,
          totalXP,
          topicProgress,
        } = get();

        const newlyUnlocked: Achievement[] = [];

        achievements.forEach((achievement) => {
          if (unlockedAchievements.includes(achievement.id)) {
            return;
          }

          let isUnlocked = false;

          switch (achievement.requirementType) {
            case 'questions_answered':
              isUnlocked = totalQuestionsAttempted >= achievement.requirementValue;
              break;
            case 'streak_days':
              isUnlocked = currentStreak >= achievement.requirementValue;
              break;
            case 'xp_earned':
              isUnlocked = totalXP >= achievement.requirementValue;
              break;
            case 'mastery_level':
              const masteredTopics = Object.values(topicProgress).filter(
                (p) => p.masteryLevel >= 80
              ).length;
              isUnlocked = masteredTopics >= achievement.requirementValue;
              break;
          }

          if (isUnlocked) {
            newlyUnlocked.push(achievement);
          }
        });

        if (newlyUnlocked.length > 0) {
          set((state) => ({
            unlockedAchievements: [
              ...state.unlockedAchievements,
              ...newlyUnlocked.map((a) => a.id),
            ],
            totalXP: state.totalXP + newlyUnlocked.reduce((sum, a) => sum + a.xpReward, 0),
          }));
        }

        return newlyUnlocked;
      },

      unlockAchievement: (achievementId) => {
        const { unlockedAchievements, achievements } = get();

        if (!unlockedAchievements.includes(achievementId)) {
          const achievement = achievements.find((a) => a.id === achievementId);
          set((state) => ({
            unlockedAchievements: [...state.unlockedAchievements, achievementId],
            totalXP: state.totalXP + (achievement?.xpReward || 0),
          }));
        }
      },

      fetchLeaderboard: async (period) => {
        try {
          const response = await fetch(`/api/leaderboard?period=${period}`);
          const data = await response.json();

          if (response.ok) {
            set((state) => ({
              leaderboard: {
                ...state.leaderboard,
                [period]: data.entries || [],
              },
              userRank: {
                ...state.userRank,
                [period]: data.userRank || 0,
              },
            }));
          }
        } catch (error) {
          console.error('Failed to fetch leaderboard:', error);
        }
      },

      getStrengths: () => {
        const { topicProgress } = get();

        return Object.entries(topicProgress)
          .filter(([, progress]) => progress.masteryLevel >= 70)
          .sort((a, b) => b[1].masteryLevel - a[1].masteryLevel)
          .slice(0, 5)
          .map(([topicId, progress]) => ({
            topicId,
            name: topicId, // Would be replaced with actual topic name
            mastery: progress.masteryLevel,
          }));
      },

      getWeaknesses: () => {
        const { topicProgress } = get();

        return Object.entries(topicProgress)
          .filter(([, progress]) => progress.questionsAttempted >= 5 && progress.masteryLevel < 50)
          .sort((a, b) => a[1].masteryLevel - b[1].masteryLevel)
          .slice(0, 5)
          .map(([topicId, progress]) => ({
            topicId,
            name: topicId, // Would be replaced with actual topic name
            mastery: progress.masteryLevel,
          }));
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'brilla-progress',
      version: STORE_VERSION,
      partialize: (state) => ({
        topicProgress: state.topicProgress,
        totalQuestionsAttempted: state.totalQuestionsAttempted,
        totalCorrect: state.totalCorrect,
        currentStreak: state.currentStreak,
        longestStreak: state.longestStreak,
        totalXP: state.totalXP,
        level: state.level,
        unlockedAchievements: state.unlockedAchievements,
      }),
    }
  )
);
