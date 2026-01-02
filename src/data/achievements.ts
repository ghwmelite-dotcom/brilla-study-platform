// Achievement Rarity Types
export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: 'learning' | 'streak' | 'accuracy' | 'speed' | 'social' | 'special';
  rarity: AchievementRarity;
  icon: string;
  xpReward: number;
  requirement: {
    type: 'count' | 'streak' | 'accuracy' | 'time' | 'perfect' | 'special';
    value: number;
    unit?: string;
  };
  unlockPercentage?: number; // % of users who have this
  visualEffect?: 'none' | 'glow' | 'animated' | 'particles';
}

// Rarity styling configuration
export const RARITY_CONFIG: Record<AchievementRarity, {
  label: string;
  bg: string;
  bgHover: string;
  border: string;
  text: string;
  icon: string;
  glow: string;
  gradient: string;
}> = {
  common: {
    label: 'Common',
    bg: 'bg-neutral-50',
    bgHover: 'hover:bg-neutral-100',
    border: 'border-neutral-200',
    text: 'text-neutral-600',
    icon: 'text-neutral-500',
    glow: '',
    gradient: 'from-neutral-400 to-neutral-500',
  },
  rare: {
    label: 'Rare',
    bg: 'bg-blue-50',
    bgHover: 'hover:bg-blue-100',
    border: 'border-blue-300',
    text: 'text-blue-600',
    icon: 'text-blue-500',
    glow: 'shadow-blue-200 shadow-lg',
    gradient: 'from-blue-400 to-blue-600',
  },
  epic: {
    label: 'Epic',
    bg: 'bg-purple-50',
    bgHover: 'hover:bg-purple-100',
    border: 'border-purple-400',
    text: 'text-purple-600',
    icon: 'text-purple-500',
    glow: 'shadow-purple-300 shadow-xl',
    gradient: 'from-purple-500 to-pink-500',
  },
  legendary: {
    label: 'Legendary',
    bg: 'bg-gradient-to-r from-amber-50 to-orange-50',
    bgHover: 'hover:from-amber-100 hover:to-orange-100',
    border: 'border-amber-400',
    text: 'text-amber-600',
    icon: 'text-amber-500',
    glow: 'shadow-amber-300 shadow-2xl animate-pulse',
    gradient: 'from-amber-400 via-orange-500 to-red-500',
  },
};

// All achievements
export const ACHIEVEMENTS: Achievement[] = [
  // Learning Achievements
  {
    id: 'first_question',
    name: 'First Steps',
    description: 'Answer your first question',
    category: 'learning',
    rarity: 'common',
    icon: 'Target',
    xpReward: 10,
    requirement: { type: 'count', value: 1, unit: 'questions' },
    unlockPercentage: 95,
  },
  {
    id: 'questions_50',
    name: 'Dedicated Learner',
    description: 'Answer 50 questions',
    category: 'learning',
    rarity: 'common',
    icon: 'BookOpen',
    xpReward: 50,
    requirement: { type: 'count', value: 50, unit: 'questions' },
    unlockPercentage: 60,
  },
  {
    id: 'questions_200',
    name: 'Knowledge Seeker',
    description: 'Answer 200 questions',
    category: 'learning',
    rarity: 'rare',
    icon: 'BookOpen',
    xpReward: 150,
    requirement: { type: 'count', value: 200, unit: 'questions' },
    unlockPercentage: 35,
  },
  {
    id: 'questions_500',
    name: 'Scholar',
    description: 'Answer 500 questions',
    category: 'learning',
    rarity: 'rare',
    icon: 'GraduationCap',
    xpReward: 300,
    requirement: { type: 'count', value: 500, unit: 'questions' },
    unlockPercentage: 20,
  },
  {
    id: 'questions_1000',
    name: 'Master Student',
    description: 'Answer 1000 questions',
    category: 'learning',
    rarity: 'epic',
    icon: 'Award',
    xpReward: 500,
    requirement: { type: 'count', value: 1000, unit: 'questions' },
    unlockPercentage: 10,
    visualEffect: 'glow',
  },
  {
    id: 'questions_5000',
    name: 'Grand Master',
    description: 'Answer 5000 questions',
    category: 'learning',
    rarity: 'legendary',
    icon: 'Crown',
    xpReward: 2000,
    requirement: { type: 'count', value: 5000, unit: 'questions' },
    unlockPercentage: 2,
    visualEffect: 'particles',
  },

  // Streak Achievements
  {
    id: 'streak_3',
    name: 'Getting Started',
    description: 'Build a 3-day streak',
    category: 'streak',
    rarity: 'common',
    icon: 'Flame',
    xpReward: 30,
    requirement: { type: 'streak', value: 3, unit: 'days' },
    unlockPercentage: 70,
  },
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    category: 'streak',
    rarity: 'common',
    icon: 'Flame',
    xpReward: 100,
    requirement: { type: 'streak', value: 7, unit: 'days' },
    unlockPercentage: 45,
  },
  {
    id: 'streak_30',
    name: 'Monthly Master',
    description: 'Achieve a 30-day streak',
    category: 'streak',
    rarity: 'rare',
    icon: 'Flame',
    xpReward: 500,
    requirement: { type: 'streak', value: 30, unit: 'days' },
    unlockPercentage: 15,
    visualEffect: 'glow',
  },
  {
    id: 'streak_100',
    name: 'Centurion',
    description: 'Reach a 100-day streak',
    category: 'streak',
    rarity: 'epic',
    icon: 'Flame',
    xpReward: 2000,
    requirement: { type: 'streak', value: 100, unit: 'days' },
    unlockPercentage: 5,
    visualEffect: 'animated',
  },
  {
    id: 'streak_365',
    name: 'Year Legend',
    description: 'Complete a 365-day streak',
    category: 'streak',
    rarity: 'legendary',
    icon: 'Flame',
    xpReward: 10000,
    requirement: { type: 'streak', value: 365, unit: 'days' },
    unlockPercentage: 0.5,
    visualEffect: 'particles',
  },

  // Accuracy Achievements
  {
    id: 'accuracy_70',
    name: 'Accurate',
    description: 'Achieve 70% overall accuracy',
    category: 'accuracy',
    rarity: 'common',
    icon: 'Target',
    xpReward: 50,
    requirement: { type: 'accuracy', value: 70 },
    unlockPercentage: 55,
  },
  {
    id: 'accuracy_85',
    name: 'Sharpshooter',
    description: 'Achieve 85% overall accuracy',
    category: 'accuracy',
    rarity: 'rare',
    icon: 'Target',
    xpReward: 150,
    requirement: { type: 'accuracy', value: 85 },
    unlockPercentage: 25,
  },
  {
    id: 'accuracy_95',
    name: 'Precision Master',
    description: 'Achieve 95% overall accuracy',
    category: 'accuracy',
    rarity: 'epic',
    icon: 'Target',
    xpReward: 500,
    requirement: { type: 'accuracy', value: 95 },
    unlockPercentage: 8,
    visualEffect: 'glow',
  },

  // Speed Achievements
  {
    id: 'speed_10',
    name: 'Quick Thinker',
    description: 'Answer 10 questions in under 2 minutes',
    category: 'speed',
    rarity: 'rare',
    icon: 'Zap',
    xpReward: 100,
    requirement: { type: 'time', value: 120, unit: 'seconds for 10 questions' },
    unlockPercentage: 20,
  },
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Answer 10 questions correctly in under 2 minutes',
    category: 'speed',
    rarity: 'epic',
    icon: 'Zap',
    xpReward: 300,
    requirement: { type: 'perfect', value: 10, unit: 'correct in 2 minutes' },
    unlockPercentage: 5,
    visualEffect: 'glow',
  },

  // Perfect Achievements
  {
    id: 'perfect_10',
    name: 'Perfect Ten',
    description: 'Answer 10 questions in a row correctly',
    category: 'accuracy',
    rarity: 'rare',
    icon: 'Star',
    xpReward: 100,
    requirement: { type: 'perfect', value: 10 },
    unlockPercentage: 30,
  },
  {
    id: 'perfect_25',
    name: 'Flawless Run',
    description: '25 consecutive correct answers',
    category: 'accuracy',
    rarity: 'epic',
    icon: 'Star',
    xpReward: 250,
    requirement: { type: 'perfect', value: 25 },
    unlockPercentage: 12,
    visualEffect: 'glow',
  },
  {
    id: 'perfect_100',
    name: 'Perfectionist',
    description: '100 consecutive correct answers',
    category: 'accuracy',
    rarity: 'legendary',
    icon: 'Star',
    xpReward: 1000,
    requirement: { type: 'perfect', value: 100 },
    unlockPercentage: 1,
    visualEffect: 'particles',
  },

  // Social Achievements
  {
    id: 'first_battle',
    name: 'Challenger',
    description: 'Win your first battle',
    category: 'social',
    rarity: 'common',
    icon: 'Swords',
    xpReward: 50,
    requirement: { type: 'count', value: 1, unit: 'battle wins' },
    unlockPercentage: 40,
  },
  {
    id: 'battle_master',
    name: 'Battle Master',
    description: 'Win 50 battles',
    category: 'social',
    rarity: 'rare',
    icon: 'Swords',
    xpReward: 300,
    requirement: { type: 'count', value: 50, unit: 'battle wins' },
    unlockPercentage: 15,
  },
  {
    id: 'undefeated',
    name: 'Undefeated',
    description: 'Win 10 battles in a row',
    category: 'social',
    rarity: 'epic',
    icon: 'Trophy',
    xpReward: 500,
    requirement: { type: 'streak', value: 10, unit: 'consecutive wins' },
    unlockPercentage: 5,
    visualEffect: 'animated',
  },

  // Special Achievements
  {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Study after midnight 7 times',
    category: 'special',
    rarity: 'rare',
    icon: 'Moon',
    xpReward: 100,
    requirement: { type: 'count', value: 7, unit: 'late night sessions' },
    unlockPercentage: 20,
  },
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Study before 6am 7 times',
    category: 'special',
    rarity: 'rare',
    icon: 'Sun',
    xpReward: 100,
    requirement: { type: 'count', value: 7, unit: 'early sessions' },
    unlockPercentage: 15,
  },
  {
    id: 'all_subjects',
    name: 'Renaissance Student',
    description: 'Practice all 5 core subjects in one day',
    category: 'special',
    rarity: 'epic',
    icon: 'Sparkles',
    xpReward: 200,
    requirement: { type: 'special', value: 5, unit: 'subjects in one day' },
    unlockPercentage: 8,
    visualEffect: 'glow',
  },
  {
    id: 'nsmq_champion',
    name: 'NSMQ Champion',
    description: 'Win 3 NSMQ simulations in a row',
    category: 'special',
    rarity: 'legendary',
    icon: 'Crown',
    xpReward: 1000,
    requirement: { type: 'streak', value: 3, unit: 'NSMQ wins' },
    unlockPercentage: 2,
    visualEffect: 'particles',
  },
];

// Get achievements by rarity
export const getAchievementsByRarity = (rarity: AchievementRarity): Achievement[] => {
  return ACHIEVEMENTS.filter(a => a.rarity === rarity);
};

// Get achievements by category
export const getAchievementsByCategory = (category: Achievement['category']): Achievement[] => {
  return ACHIEVEMENTS.filter(a => a.category === category);
};

// Check if achievement is unlocked
export const isAchievementUnlocked = (
  achievementId: string,
  userStats: {
    questionsAnswered: number;
    currentStreak: number;
    longestStreak: number;
    accuracy: number;
    perfectStreak: number;
    battleWins: number;
    battleWinStreak: number;
  }
): boolean => {
  const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
  if (!achievement) return false;

  const { requirement } = achievement;

  switch (requirement.type) {
    case 'count':
      if (requirement.unit === 'questions') return userStats.questionsAnswered >= requirement.value;
      if (requirement.unit === 'battle wins') return userStats.battleWins >= requirement.value;
      return false;
    case 'streak':
      if (requirement.unit === 'days') return userStats.longestStreak >= requirement.value;
      if (requirement.unit === 'consecutive wins') return userStats.battleWinStreak >= requirement.value;
      return false;
    case 'accuracy':
      return userStats.accuracy >= requirement.value;
    case 'perfect':
      return userStats.perfectStreak >= requirement.value;
    default:
      return false;
  }
};
