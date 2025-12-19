// User types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'teacher' | 'admin';
  house?: string;
  yearGroup?: number;
  xpPoints: number;
  level: number;
  streakDays: number;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Subject and Topic types
export interface Subject {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  description?: string;
  topicCount?: number;
  questionCount?: number;
}

export interface Topic {
  id: string;
  subjectId: string;
  parentId?: string;
  name: string;
  slug: string;
  description?: string;
  theoryContent?: string;
  keyFormulas?: string[];
  children?: Topic[];
  questionCount?: number;
  masteryLevel?: number;
}

// Question types
export type QuestionType = 'multiple_choice' | 'true_false' | 'direct_answer' | 'problem' | 'riddle';
export type RoundType = 'round_one' | 'speed_race' | 'problem_of_day' | 'true_false' | 'riddles';
export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

export interface Question {
  id: string;
  topicId: string;
  subjectId: string;
  questionText: string;
  questionType: QuestionType;
  roundType: RoundType;
  options?: QuestionOption[];
  correctAnswer: string;
  explanation?: string;
  difficulty: Difficulty;
  points: number;
  timeLimit: number; // in seconds
  imageUrl?: string;
  createdAt: string;
}

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Riddle {
  id: string;
  subjectId: string;
  answer: string;
  clues: string[];
  difficulty: Difficulty;
}

// Progress types
export interface UserProgress {
  id: string;
  userId: string;
  topicId: string;
  questionsAttempted: number;
  questionsCorrect: number;
  masteryLevel: number; // 0-100
  lastAttemptAt: string;
}

export interface QuestionAttempt {
  id: string;
  userId: string;
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  timeTaken: number; // in seconds
  pointsEarned: number;
  createdAt: string;
}

// Competition types
export type CompetitionStatus = 'waiting' | 'in_progress' | 'completed';

export interface Competition {
  id: string;
  name: string;
  status: CompetitionStatus;
  currentRound: number;
  schools: CompetitionSchool[];
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface CompetitionSchool {
  id: string;
  name: string;
  score: number;
  color: string;
}

export interface RoundState {
  round: number;
  questionIndex: number;
  timeRemaining: number;
  isActive: boolean;
  currentSchoolId?: string;
  answers: RoundAnswer[];
}

export interface RoundAnswer {
  schoolId: string;
  questionId: string;
  answer: string;
  isCorrect: boolean;
  points: number;
  timeTaken: number;
}

// Achievement types
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirementType: 'questions_answered' | 'streak_days' | 'mastery_level' | 'xp_earned' | 'competitions_won';
  requirementValue: number;
  xpReward: number;
  unlockedAt?: string;
}

// Leaderboard types
export type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly' | 'all_time';

export interface LeaderboardEntry {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  period: LeaderboardPeriod;
  score: number;
  rank: number;
  house?: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Practice Session types
export interface PracticeSession {
  id: string;
  userId: string;
  mode: 'topic_drill' | 'speed_race' | 'flashcard' | 'competition_sim';
  subjectId?: string;
  topicId?: string;
  questions: Question[];
  currentIndex: number;
  score: number;
  startedAt: string;
  completedAt?: string;
  results?: PracticeResult[];
}

export interface PracticeResult {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  timeTaken: number;
  pointsEarned: number;
}

// Scoring constants
export const SCORING = {
  ROUND_ONE: {
    CORRECT: 3,
    BONUS: 2,
    PARTIAL_MAX: 2,
  },
  ROUND_TWO: {
    FIRST: 3,
    SECOND: 2,
    THIRD: 1,
    WRONG: -1,
  },
  ROUND_THREE: {
    MAX: 10,
    PARTIAL: true,
  },
  ROUND_FOUR: {
    CORRECT: 2,
    WRONG: -1,
    PASS: 0,
  },
  ROUND_FIVE: {
    CLUE_1: 5,
    CLUE_2: 4,
    CLUE_3_PLUS: 3,
  },
} as const;

// XP and Level constants
export const XP_PER_LEVEL = 1000;
export const XP_MULTIPLIERS = {
  EASY: 1,
  MEDIUM: 1.5,
  HARD: 2,
  EXPERT: 3,
} as const;
