import { SCORING, XP_PER_LEVEL, XP_MULTIPLIERS } from '@/types';
import type { Difficulty, RoundType } from '@/types';

/**
 * Calculate points for a Round 1 (Fundamentals) answer
 */
export function calculateRound1Points(
  isCorrect: boolean,
  isBonus: boolean = false
): number {
  if (!isCorrect) return 0;
  return isBonus ? SCORING.ROUND_ONE.BONUS : SCORING.ROUND_ONE.CORRECT;
}

/**
 * Calculate points for a Round 2 (Speed Race) answer
 */
export function calculateRound2Points(
  isCorrect: boolean,
  position: 1 | 2 | 3 | null
): number {
  if (!isCorrect) return SCORING.ROUND_TWO.WRONG;

  switch (position) {
    case 1:
      return SCORING.ROUND_TWO.FIRST;
    case 2:
      return SCORING.ROUND_TWO.SECOND;
    case 3:
      return SCORING.ROUND_TWO.THIRD;
    default:
      return 0;
  }
}

/**
 * Calculate points for a Round 3 (Problem of the Day) answer
 */
export function calculateRound3Points(
  partialCorrect: number,
  totalParts: number
): number {
  const ratio = partialCorrect / totalParts;
  return Math.round(ratio * SCORING.ROUND_THREE.MAX);
}

/**
 * Calculate points for a Round 4 (True or False) answer
 */
export function calculateRound4Points(
  answer: 'correct' | 'wrong' | 'pass'
): number {
  switch (answer) {
    case 'correct':
      return SCORING.ROUND_FOUR.CORRECT;
    case 'wrong':
      return SCORING.ROUND_FOUR.WRONG;
    case 'pass':
      return SCORING.ROUND_FOUR.PASS;
  }
}

/**
 * Calculate points for a Round 5 (Riddles) answer
 */
export function calculateRound5Points(clueNumber: number): number {
  if (clueNumber === 1) return SCORING.ROUND_FIVE.CLUE_1;
  if (clueNumber === 2) return SCORING.ROUND_FIVE.CLUE_2;
  return SCORING.ROUND_FIVE.CLUE_3_PLUS;
}

/**
 * Calculate XP earned from answering a question
 */
export function calculateXP(
  isCorrect: boolean,
  difficulty: Difficulty,
  basePoints: number,
  timeBonus: boolean = false
): number {
  if (!isCorrect) return Math.round(basePoints * 0.1); // Small XP for attempting

  const difficultyMultiplier = XP_MULTIPLIERS[difficulty.toUpperCase() as keyof typeof XP_MULTIPLIERS];
  let xp = basePoints * difficultyMultiplier;

  if (timeBonus) {
    xp *= 1.5; // 50% bonus for fast answers
  }

  return Math.round(xp);
}

/**
 * Calculate the level from total XP
 */
export function calculateLevel(totalXP: number): number {
  return Math.floor(totalXP / XP_PER_LEVEL) + 1;
}

/**
 * Calculate XP progress towards next level
 */
export function calculateLevelProgress(totalXP: number): {
  currentLevel: number;
  currentLevelXP: number;
  xpForNextLevel: number;
  progress: number;
} {
  const currentLevel = calculateLevel(totalXP);
  const xpForCurrentLevel = (currentLevel - 1) * XP_PER_LEVEL;
  const currentLevelXP = totalXP - xpForCurrentLevel;
  const xpForNextLevel = XP_PER_LEVEL;
  const progress = Math.round((currentLevelXP / xpForNextLevel) * 100);

  return {
    currentLevel,
    currentLevelXP,
    xpForNextLevel,
    progress,
  };
}

/**
 * Calculate mastery level based on accuracy and attempts
 */
export function calculateMastery(
  correct: number,
  attempted: number,
  minAttempts: number = 5
): number {
  if (attempted < minAttempts) {
    // Not enough data, scale down mastery
    const scaleFactor = attempted / minAttempts;
    return Math.round((correct / attempted) * 100 * scaleFactor);
  }

  return Math.round((correct / attempted) * 100);
}

/**
 * Get mastery level label
 */
export function getMasteryLabel(mastery: number): {
  label: string;
  color: string;
} {
  if (mastery >= 90) return { label: 'Mastered', color: 'text-green-600' };
  if (mastery >= 70) return { label: 'Proficient', color: 'text-blue-600' };
  if (mastery >= 50) return { label: 'Learning', color: 'text-yellow-600' };
  if (mastery >= 30) return { label: 'Developing', color: 'text-orange-600' };
  return { label: 'Beginner', color: 'text-red-600' };
}

/**
 * Calculate time bonus eligibility
 */
export function hasTimeBonus(
  timeTaken: number,
  timeLimit: number,
  threshold: number = 0.5
): boolean {
  return timeTaken <= timeLimit * threshold;
}

/**
 * Format score with sign
 */
export function formatScore(score: number): string {
  if (score > 0) return `+${score}`;
  return score.toString();
}

/**
 * Calculate accuracy percentage
 */
export function calculateAccuracy(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

/**
 * Get points for a specific round type
 */
export function getDefaultPoints(roundType: RoundType): number {
  switch (roundType) {
    case 'round_one':
      return SCORING.ROUND_ONE.CORRECT;
    case 'speed_race':
      return SCORING.ROUND_TWO.FIRST;
    case 'problem_of_day':
      return SCORING.ROUND_THREE.MAX;
    case 'true_false':
      return SCORING.ROUND_FOUR.CORRECT;
    case 'riddles':
      return SCORING.ROUND_FIVE.CLUE_1;
    default:
      return 3;
  }
}

/**
 * Get time limit for a specific round type
 */
export function getDefaultTimeLimit(roundType: RoundType): number {
  switch (roundType) {
    case 'round_one':
      return 30;
    case 'speed_race':
      return 10;
    case 'problem_of_day':
      return 240; // 4 minutes
    case 'true_false':
      return 30;
    case 'riddles':
      return 60;
    default:
      return 30;
  }
}
