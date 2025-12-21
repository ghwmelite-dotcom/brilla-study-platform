import { useCallback } from 'react';
import { useProgressStore } from '@/stores/progressStore';
import { useToastStore } from '@/stores/toastStore';

/**
 * Hook for gamification actions that trigger toasts
 * Wraps progress store actions and shows celebratory notifications
 */
export function useGamification() {
  const progressStore = useProgressStore();
  const toast = useToastStore();

  /**
   * Award XP and show toast notification
   */
  const awardXP = useCallback((amount: number, reason?: string) => {
    const prevLevel = progressStore.level;

    // Add XP to progress store
    progressStore.addXP(amount);

    // Show XP gain toast
    toast.showXpGain(amount, reason);

    // Check for level up
    const didLevelUp = progressStore.checkLevelUp();
    if (didLevelUp) {
      const newLevel = progressStore.level;
      if (newLevel > prevLevel) {
        // Delay level up toast slightly so it appears after XP toast
        setTimeout(() => {
          toast.showLevelUp(newLevel);
        }, 500);
      }
    }

    // Check for new achievements
    const newAchievements = progressStore.checkAchievements();
    newAchievements.forEach((achievement, index) => {
      // Stagger achievement toasts
      setTimeout(() => {
        toast.showAchievement(achievement);
      }, 1000 + index * 800);
    });

    return {
      xpGained: amount,
      leveledUp: didLevelUp,
      newAchievements,
    };
  }, [progressStore, toast]);

  /**
   * Record a correct/incorrect answer and award XP accordingly
   */
  const recordAnswer = useCallback((topicId: string, correct: boolean) => {
    // Update progress
    progressStore.updateTopicProgress(topicId, correct);

    // Award XP for answering (more for correct)
    const xpAmount = correct ? 25 : 5;
    const reason = correct ? 'Correct answer!' : 'Question attempted';

    return awardXP(xpAmount, reason);
  }, [progressStore, awardXP]);

  /**
   * Award bonus XP for special achievements
   */
  const awardBonus = useCallback((amount: number, reason: string) => {
    return awardXP(amount, reason);
  }, [awardXP]);

  /**
   * Show streak celebration
   */
  const celebrateStreak = useCallback((days: number) => {
    toast.showStreak(days);

    // Award bonus XP for streak milestones
    if (days === 3) {
      awardXP(50, '3-day streak bonus!');
    } else if (days === 7) {
      awardXP(150, 'Week streak bonus!');
    } else if (days === 30) {
      awardXP(500, 'Month streak bonus!');
    } else if (days === 100) {
      awardXP(2000, '100-day streak bonus!');
    }
  }, [toast, awardXP]);

  /**
   * Check achievements without triggering XP
   */
  const checkAndShowAchievements = useCallback(() => {
    const newAchievements = progressStore.checkAchievements();
    newAchievements.forEach((achievement, index) => {
      setTimeout(() => {
        toast.showAchievement(achievement);
      }, index * 800);
    });
    return newAchievements;
  }, [progressStore, toast]);

  return {
    // Data from progress store
    totalXP: progressStore.totalXP,
    level: progressStore.level,
    currentStreak: progressStore.currentStreak,
    longestStreak: progressStore.longestStreak,
    achievements: progressStore.achievements,
    unlockedAchievements: progressStore.unlockedAchievements,

    // Actions
    awardXP,
    awardBonus,
    recordAnswer,
    celebrateStreak,
    checkAndShowAchievements,

    // Direct store access for reading
    progressStore,
  };
}
