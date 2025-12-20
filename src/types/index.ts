// =============================================
// EXAM TYPE SYSTEM
// =============================================

export type ExamTypeSlug = 'nsmq' | 'wassce' | 'bece';

export interface ExamType {
  id: string;
  name: string;
  slug: ExamTypeSlug;
  description?: string;
  country: string;
  isActive: boolean;
  displayOrder: number;
  icon?: string;
  color?: string;
}

export interface SubjectCategory {
  id: string;
  examTypeId: string;
  name: string;
  slug: string;
  description?: string;
  isCore: boolean;
  displayOrder: number;
}

export interface PaperType {
  id: string;
  examTypeId: string;
  name: string;
  slug: string;
  description?: string;
  questionFormat: 'objective' | 'essay' | 'practical' | 'mixed';
  typicalDuration?: number; // in minutes
  totalMarks?: number;
  displayOrder: number;
}

// =============================================
// SUBSCRIPTION & PREMIUM FEATURES
// =============================================

export type SubscriptionTierSlug = 'free' | 'basic' | 'premium' | 'school';

export interface SubscriptionTier {
  id: string;
  name: string;
  slug: SubscriptionTierSlug;
  description?: string;
  priceMonthly: number;
  priceYearly: number;
  aiGradingQuota: number; // -1 for unlimited
  features: string[];
  isActive: boolean;
}

// =============================================
// USER TYPES (Extended)
// =============================================

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
  // Multi-exam additions
  primaryExamTypeId?: string;
  subscriptionTierId?: string;
  subscriptionExpiresAt?: string;
  aiGradingCredits: number;
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
  // Multi-exam additions
  examTypeId?: string;
  categoryId?: string;
  waecCode?: string;
  isActive: boolean;
  displayOrder: number;
  // Computed
  topicCount?: number;
  questionCount?: number;
  category?: SubjectCategory;
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
  displayOrder?: number;
  children?: Topic[];
  questionCount?: number;
  masteryLevel?: number;
}

// Question types
export type QuestionType =
  | 'multiple_choice'
  | 'objective'  // Alias for multiple_choice
  | 'true_false'
  | 'direct_answer'
  | 'problem'
  | 'riddle'
  // Extended types for WASSCE/BECE
  | 'essay'
  | 'short_answer'
  | 'structured'
  | 'practical'
  | 'calculation'
  | 'diagram'
  | 'comprehension';

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
  // Multi-exam additions
  examTypeId?: string;
  paperTypeId?: string;
  pastPaperId?: string;
  marks?: number;
  questionNumber?: number;
  section?: string;
  createdAt: string;
}

// Simplified question type for sample/seed data
export interface SampleQuestion {
  id: string;
  topicId?: string;
  subjectId: string;
  questionText: string;
  questionType: QuestionType;
  roundType?: RoundType;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  difficulty: Difficulty;
  points?: number;
  timeLimit?: number;
  examTypeId?: string;
  paperTypeId?: string;
}

// =============================================
// PAST PAPERS SYSTEM
// =============================================

export interface PastPaper {
  id: string;
  examTypeId: string;
  subjectId: string;
  paperTypeId: string;
  year: number;
  month?: string; // 'May-June', 'November-December'
  series?: string;
  title: string;
  totalQuestions: number;
  totalMarks?: number;
  timeAllowed?: number; // in minutes
  instructions?: string;
  isComplete: boolean;
  isPremium: boolean;
  // Computed/joined
  subject?: Subject;
  paperType?: PaperType;
  questions?: Question[];
}

export interface PaperAttempt {
  id: string;
  userId: string;
  paperId: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  timeAllowed?: number;
  timeUsed?: number;
  totalScore?: number;
  percentageScore?: number;
  startedAt: string;
  submittedAt?: string;
  // Computed/joined
  paper?: PastPaper;
  answers?: PaperAttemptAnswer[];
}

export interface PaperAttemptAnswer {
  id: string;
  attemptId: string;
  questionId: string;
  answerText: string;
  isCorrect?: boolean;
  marksEarned?: number;
  timeTaken?: number;
  answeredAt: string;
}

// =============================================
// ESSAY SYSTEM
// =============================================

export interface EssayQuestion {
  id: string;
  questionId: string;
  subjectId?: string;
  questionText?: string;
  wordLimitMin?: number;
  wordLimitMax?: number;
  marks?: number;
  timeAllowed?: number;
  markingScheme?: MarkingScheme | MarkingCriteria[];
  modelAnswer?: string;
  markingRubric?: MarkingRubric;
  aiGradingEnabled: boolean;
  tips?: string[];
  // Display helpers
  subject?: string;
  topic?: string;
  // Joined
  question?: Question;
}

export interface MarkingScheme {
  criteria: MarkingCriteria[];
  totalMarks: number;
}

export interface MarkingCriteria {
  name: string;
  description: string;
  maxMarks?: number;
  maxScore?: number;
  guidelines?: string;
}

export interface MarkingRubric {
  criteria: RubricCriterion[];
  totalMarks: number;
}

export interface RubricCriterion {
  name: string;
  description: string;
  maxMarks: number;
  levels: RubricLevel[];
}

export interface RubricLevel {
  marks: number;
  description: string;
}

export type GradingType = 'ai' | 'manual' | 'self' | 'peer';
export type GradingStatus = 'pending' | 'grading' | 'graded' | 'reviewed' | 'failed';

export interface EssayAttempt {
  id: string;
  userId: string;
  questionId: string;
  answerText: string;
  wordCount: number;
  gradingType?: GradingType;
  gradingStatus: GradingStatus;
  aiScore?: number;
  aiFeedback?: AIEssayFeedback;
  manualScore?: number;
  manualFeedback?: string;
  finalScore?: number;
  createdAt: string;
  gradedAt?: string;
  // Joined
  question?: Question;
  essayQuestion?: EssayQuestion;
}

export interface AIEssayFeedback {
  overallScore: number;
  overallFeedback: string;
  criteriaScores: CriteriaScore[];
  strengths: string[];
  areasForImprovement: string[];
  suggestions?: string[];
  grammarErrors?: GrammarError[];
  spellingErrors?: string[];
}

export interface CriteriaScore {
  criterionName: string;
  score: number;
  maxScore: number;
  feedback: string;
}

export interface GrammarError {
  text: string;
  suggestion: string;
  position: { start: number; end: number };
  type: 'grammar' | 'punctuation' | 'style';
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

// House types (House Cup System)
export interface House {
  id: string;
  name: string;
  color: string;
  icon: string;
  description?: string;
  isDefault: boolean;
  schoolId?: string;
  memberCount?: number;
  totalPoints?: number;
  createdAt: string;
}

export interface HousePoints {
  id: string;
  houseId: string;
  userId: string;
  points: number;
  source: 'practice' | 'battle' | 'competition' | 'achievement' | 'bonus';
  sourceId?: string;
  period: string;
  createdAt: string;
}

export interface HouseStanding {
  id: string;
  houseId: string;
  houseName: string;
  houseColor: string;
  period: 'weekly' | 'monthly' | 'yearly' | 'all_time';
  periodValue: string;
  totalPoints: number;
  memberCount: number;
  rank: number;
}

// Battle types (1v1 Battles)
export type BattleStatus = 'waiting' | 'active' | 'completed' | 'cancelled';

export interface Battle {
  id: string;
  challengerId: string;
  challengerName?: string;
  challengerAvatar?: string;
  opponentId?: string;
  opponentName?: string;
  opponentAvatar?: string;
  status: BattleStatus;
  subjectId?: string;
  subjectName?: string;
  difficulty: Difficulty;
  questionCount: number;
  questions?: Question[];
  challengerScore: number;
  opponentScore: number;
  currentQuestion: number;
  winnerId?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface BattleAnswer {
  id: string;
  battleId: string;
  userId: string;
  questionIndex: number;
  answer: string;
  isCorrect: boolean;
  timeTaken: number;
  pointsEarned: number;
  answeredAt: string;
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
