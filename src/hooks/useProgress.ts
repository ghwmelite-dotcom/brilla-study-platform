import { useCallback } from 'react';
import { useProgressStore } from '@/stores';
import { calculateXP, calculateMastery } from '@/utils';
import type { Difficulty } from '@/types';

interface AnswerResult {
  isCorrect: boolean;
  pointsEarned: number;
  xpEarned: number;
  newMastery?: number;
  levelUp?: boolean;
  newAchievements?: string[];
}

export function useProgress() {
  const {
    topicProgress,
    totalXP,
    level,
    currentStreak,
    updateTopicProgress,
    addXP,
    checkLevelUp,
    checkAchievements,
  } = useProgressStore();

  const recordAnswer = useCallback(
    (
      topicId: string,
      isCorrect: boolean,
      difficulty: Difficulty,
      basePoints: number,
      timeTaken: number,
      timeLimit: number
    ): AnswerResult => {
      // Update topic progress
      updateTopicProgress(topicId, isCorrect);

      // Calculate XP
      const timeBonus = timeTaken <= timeLimit * 0.5;
      const xpEarned = calculateXP(isCorrect, difficulty, basePoints, timeBonus);

      // Add XP
      addXP(xpEarned);

      // Check for level up
      const levelUp = checkLevelUp();

      // Check for new achievements
      const newAchievements = checkAchievements().map((a) => a.id);

      // Get new mastery level
      const progress = topicProgress[topicId];
      const newMastery = progress
        ? calculateMastery(progress.questionsCorrect, progress.questionsAttempted)
        : 0;

      return {
        isCorrect,
        pointsEarned: isCorrect ? basePoints : 0,
        xpEarned,
        newMastery,
        levelUp,
        newAchievements: newAchievements.length > 0 ? newAchievements : undefined,
      };
    },
    [topicProgress, updateTopicProgress, addXP, checkLevelUp, checkAchievements]
  );

  const getTopicMastery = useCallback(
    (topicId: string): number => {
      const progress = topicProgress[topicId];
      if (!progress || progress.questionsAttempted === 0) return 0;
      return calculateMastery(progress.questionsCorrect, progress.questionsAttempted);
    },
    [topicProgress]
  );

  const getSubjectMastery = useCallback(
    (_subjectId: string, topicIds: string[]): number => {
      const relevantProgress = topicIds
        .map((id) => topicProgress[id])
        .filter(Boolean);

      if (relevantProgress.length === 0) return 0;

      const totalCorrect = relevantProgress.reduce((sum, p) => sum + p.questionsCorrect, 0);
      const totalAttempted = relevantProgress.reduce((sum, p) => sum + p.questionsAttempted, 0);

      return calculateMastery(totalCorrect, totalAttempted);
    },
    [topicProgress]
  );

  const getWeakTopics = useCallback(
    (threshold: number = 50): string[] => {
      return Object.entries(topicProgress)
        .filter(
          ([, progress]) =>
            progress.questionsAttempted >= 5 && progress.masteryLevel < threshold
        )
        .sort((a, b) => a[1].masteryLevel - b[1].masteryLevel)
        .map(([topicId]) => topicId);
    },
    [topicProgress]
  );

  const getStrongTopics = useCallback(
    (threshold: number = 70): string[] => {
      return Object.entries(topicProgress)
        .filter(([, progress]) => progress.masteryLevel >= threshold)
        .sort((a, b) => b[1].masteryLevel - a[1].masteryLevel)
        .map(([topicId]) => topicId);
    },
    [topicProgress]
  );

  const getLevelProgress = useCallback((): { current: number; next: number; percentage: number } => {
    const XP_PER_LEVEL = 1000;
    const xpInCurrentLevel = totalXP % XP_PER_LEVEL;
    return {
      current: xpInCurrentLevel,
      next: XP_PER_LEVEL,
      percentage: Math.round((xpInCurrentLevel / XP_PER_LEVEL) * 100),
    };
  }, [totalXP]);

  return {
    topicProgress,
    totalXP,
    level,
    currentStreak,
    recordAnswer,
    getTopicMastery,
    getSubjectMastery,
    getWeakTopics,
    getStrongTopics,
    getLevelProgress,
  };
}
