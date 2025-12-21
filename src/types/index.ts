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

export type UserStatus = 'pending' | 'approved' | 'rejected';
export type SchoolLevel = 'jss' | 'shs';
export type UserRole = 'student' | 'teacher' | 'admin' | 'parent';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  house?: string;
  yearGroup?: number;
  schoolLevel?: SchoolLevel;
  schoolName?: string;
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
  // Approval workflow
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
}

// Extended registration data for pending users
export interface PendingUserData {
  // Common
  email: string;
  name: string;
  role: 'student' | 'teacher' | 'admin' | 'parent';

  // Student-specific
  schoolLevel?: SchoolLevel;
  yearGroup?: number;
  schoolName?: string;
  house?: string;

  // Teacher-specific
  teacherLicenseNumber?: string;
  subjectsTaught?: string[];
  yearsExperience?: string;
  qualifications?: string;

  // Admin-specific
  adminCode?: string;

  // Metadata
  registeredAt: string;
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
  | 'comprehension'
  | 'fill_blank';

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

// =============================================
// COMMUNITY CHAT SYSTEM
// =============================================

export type ChatRoomType = 'dm' | 'public' | 'private' | 'subject';
export type ChatMemberRole = 'owner' | 'moderator' | 'member';
export type ChatContentType = 'text' | 'image' | 'file' | 'system';
export type ModerationActionType = 'mute' | 'unmute' | 'ban' | 'unban' | 'warn' | 'kick';
export type ReportReason = 'spam' | 'harassment' | 'inappropriate' | 'hate_speech' | 'other';
export type ReportStatus = 'pending' | 'reviewing' | 'resolved' | 'dismissed';
export type ReportResolution = 'no_action' | 'warning' | 'message_deleted' | 'user_muted' | 'user_banned';

export interface ChatRoom {
  id: string;
  name?: string;
  description?: string;
  type: ChatRoomType;
  subjectId?: string;
  examTypeId?: string;
  avatarUrl?: string;
  isArchived: boolean;
  maxMembers: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  // Computed/joined
  memberCount?: number;
  unreadCount?: number;
  lastMessage?: ChatMessage;
  members?: ChatRoomMember[];
  myRole?: ChatMemberRole;
  isMuted?: boolean;
  // For DMs
  otherUser?: {
    id: string;
    name: string;
    avatarUrl?: string;
    isOnline?: boolean;
  };
}

export interface ChatRoomMember {
  id: string;
  roomId: string;
  userId: string;
  role: ChatMemberRole;
  nickname?: string;
  isMuted: boolean;
  joinedAt: string;
  lastReadAt: string;
  // Joined user data
  user?: {
    id: string;
    name: string;
    avatarUrl?: string;
    isOnline?: boolean;
  };
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  contentType: ChatContentType;
  replyToId?: string;
  isEdited: boolean;
  isDeleted: boolean;
  deletedBy?: string;
  deletedReason?: string;
  createdAt: string;
  updatedAt: string;
  // Joined data
  sender?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  replyTo?: {
    id: string;
    content: string;
    senderName: string;
  };
  reactions?: ChatMessageReaction[];
}

export interface ChatMessageReaction {
  emoji: string;
  count: number;
  userIds: string[];
  hasReacted: boolean; // Current user has reacted
}

export interface ChatUserBlock {
  id: string;
  blockerId: string;
  blockedId: string;
  reason?: string;
  createdAt: string;
  // Joined
  blockedUser?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

export interface ChatModerationAction {
  id: string;
  roomId?: string;
  userId: string;
  moderatorId: string;
  actionType: ModerationActionType;
  reason?: string;
  duration?: number; // in minutes
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
  // Joined
  user?: { id: string; name: string };
  moderator?: { id: string; name: string };
  room?: { id: string; name: string };
}

export interface ChatReport {
  id: string;
  reporterId: string;
  reportedUserId?: string;
  messageId?: string;
  roomId?: string;
  reason: ReportReason;
  description?: string;
  status: ReportStatus;
  reviewedBy?: string;
  reviewNotes?: string;
  resolution?: ReportResolution;
  createdAt: string;
  reviewedAt?: string;
  // Joined
  reporter?: { id: string; name: string };
  reportedUser?: { id: string; name: string };
  message?: { id: string; content: string };
  room?: { id: string; name: string };
  reviewer?: { id: string; name: string };
}

export interface ChatFilteredWord {
  id: string;
  word: string;
  severity: 'low' | 'medium' | 'high';
  replacement: string;
  isActive: boolean;
  addedBy?: string;
  createdAt: string;
}

export interface ChatTypingUser {
  id: string;
  name: string;
}

// WebSocket message types
export interface ChatWSMessage {
  type:
    | 'room_state'
    | 'user_joined'
    | 'user_left'
    | 'message'
    | 'message_deleted'
    | 'message_edited'
    | 'typing_start'
    | 'typing_stop'
    | 'reaction_added'
    | 'reaction_removed'
    | 'moderation_action'
    | 'error';
  [key: string]: unknown;
}

// Chat store state types
export interface CreateRoomData {
  name?: string;
  description?: string;
  type: ChatRoomType;
  subjectId?: string;
  examTypeId?: string;
  memberIds?: string[];
}

export interface SendMessageData {
  content: string;
  contentType?: ChatContentType;
  replyToId?: string;
}

// Rate limit constants
export const CHAT_RATE_LIMITS = {
  MESSAGES_PER_MINUTE: 20,
  MESSAGES_PER_HOUR: 200,
  DM_PER_MINUTE: 10,
} as const;

// =============================================
// PARENT MONITORING SYSTEM
// =============================================

// Parent-Student Link Types
export type ParentLinkStatus = 'pending' | 'active' | 'revoked' | 'expired';
export type RelationshipType = 'parent' | 'guardian';

export interface ParentStudentLink {
  id: string;
  parentId: string;
  studentId: string;
  inviteCode?: string;
  inviteCodeExpiresAt?: string;
  status: ParentLinkStatus;
  relationshipType: RelationshipType;
  studentOptedOut: boolean;
  optedOutAt?: string;
  createdAt: string;
  verifiedAt?: string;
  // Joined student data
  student?: {
    id: string;
    name: string;
    email?: string;
    schoolLevel?: SchoolLevel;
    yearGroup?: number;
    house?: string;
    avatarUrl?: string;
    xpPoints?: number;
    level?: number;
    streakDays?: number;
    lastActiveAt?: string;
  };
  // Joined parent data (for student view)
  parent?: {
    id: string;
    name: string;
    email?: string;
  };
}

// Parent Notification Types
export type ParentNotificationType =
  | 'achievement_unlocked'
  | 'streak_milestone'
  | 'topic_mastered'
  | 'low_performance'
  | 'weekly_summary'
  | 'link_request'
  | 'student_opted_out'
  | 'link_confirmed';

export interface ParentNotification {
  id: string;
  parentId: string;
  studentId: string;
  type: ParentNotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  emailSent: boolean;
  createdAt: string;
  // Joined data
  student?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

// Parent Notification Preferences
export interface ParentNotificationPreferences {
  id?: string;
  parentId?: string;
  achievementAlerts: boolean;
  streakAlerts: boolean;
  lowPerformanceAlerts: boolean;
  weeklySummary: boolean;
  emailNotifications: boolean;
  lowPerformanceThreshold: number; // percentage (0-100)
}

// Student Progress Summary (for parent dashboard)
export interface StudentProgressSummary {
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  schoolLevel?: SchoolLevel;
  yearGroup?: number;
  house?: string;
  // Progress stats
  xpPoints: number;
  level: number;
  streakDays: number;
  longestStreak: number;
  totalQuestionsAttempted: number;
  totalCorrect: number;
  overallAccuracy: number;
  // Topic mastery
  topicsStarted: number;
  topicsMastered: number; // 80%+ mastery
  // Recent activity
  recentAchievements: Achievement[];
  strengthAreas: TopicMastery[];
  weakAreas: TopicMastery[];
  lastActiveAt?: string;
  // Exam preferences
  primaryExamType?: string;
}

export interface TopicMastery {
  topicId: string;
  topicName: string;
  subjectName: string;
  mastery: number; // 0-100
  questionsAttempted: number;
  questionsCorrect: number;
}

// Student Activity (for parent view)
export interface StudentActivity {
  id: string;
  type: 'practice_session' | 'achievement' | 'battle' | 'paper_attempt' | 'essay';
  title: string;
  description: string;
  score?: number;
  maxScore?: number;
  xpEarned?: number;
  timestamp: string;
  // Additional context
  subjectName?: string;
  topicName?: string;
  achievementIcon?: string;
}

// Parent Activity Log Entry
export interface ParentActivityLogEntry {
  id: string;
  parentId: string;
  studentId: string;
  action: 'view_progress' | 'view_activity' | 'view_topics' | 'view_achievements' | 'link_student' | 'unlink_student';
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

// Invite Code Response
export interface InviteCodeResponse {
  code: string;
  expiresAt: string;
  existingLinks: number;
}

// =============================================
// AUDIT SYSTEM TYPES
// =============================================

export type AuditActionCategory =
  | 'auth'           // Login, logout, password changes
  | 'user_management' // Registration, approval, role changes
  | 'content'        // Questions, topics, subjects
  | 'practice'       // Practice sessions, attempts
  | 'parent'         // Parent linking, monitoring
  | 'admin'          // Admin actions
  | 'settings'       // User/system settings changes
  | 'api'            // API access, rate limiting
  | 'security';      // Security events

export type AuditStatus = 'success' | 'failure' | 'warning';

export interface AuditLogEntry {
  id: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  action: string;
  actionCategory: AuditActionCategory;
  targetType?: string;
  targetId?: string;
  targetDetails?: string;
  ipAddress?: string;
  userAgent?: string;
  requestPath?: string;
  requestMethod?: string;
  status: AuditStatus;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  // Joined data for display
  userName?: string;
}

export type SecurityEventType =
  | 'failed_login'
  | 'account_locked'
  | 'password_reset'
  | 'suspicious_activity'
  | 'rate_limit_exceeded'
  | 'unauthorized_access'
  | 'permission_escalation'
  | 'data_export'
  | 'bulk_operation'
  | 'api_key_usage';

export type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical';

export interface SecurityEvent {
  id: string;
  eventType: SecurityEventType;
  severity: SecuritySeverity;
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  description: string;
  metadata?: Record<string, unknown>;
  isResolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  createdAt: string;
  // Joined data
  userName?: string;
  resolvedByName?: string;
}

export interface LoginAttempt {
  id: string;
  email: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  failureReason?: string;
  createdAt: string;
}

export interface UserSession {
  id: string;
  userId: string;
  tokenHash: string;
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: string;
  isActive: boolean;
  lastActivityAt: string;
  expiresAt: string;
  createdAt: string;
  // Joined
  userName?: string;
  userEmail?: string;
}

export interface DataChangeLog {
  id: string;
  tableName: string;
  recordId: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  changedBy?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  changedFields?: string[];
  reason?: string;
  createdAt: string;
  // Joined
  changedByName?: string;
}

// Audit Dashboard Statistics
export interface AuditDashboardStats {
  totalEvents: number;
  todayEvents: number;
  failedLogins24h: number;
  activeSecurityEvents: number;
  criticalEvents: number;
  topActions: { action: string; count: number }[];
  eventsByCategory: { category: AuditActionCategory; count: number }[];
  eventsByHour: { hour: number; count: number }[];
  recentSecurityEvents: SecurityEvent[];
}

// Audit Log Filters
export interface AuditLogFilters {
  userId?: string;
  actionCategory?: AuditActionCategory;
  action?: string;
  status?: AuditStatus;
  targetType?: string;
  startDate?: string;
  endDate?: string;
  ipAddress?: string;
  search?: string;
}

// =============================================
// TEACHER ASSESSMENT SYSTEM TYPES
// =============================================

export type AssessmentType = 'quiz' | 'homework' | 'mock_exam';
export type AssessmentStatus = 'draft' | 'published' | 'archived' | 'closed';
export type AssignmentType = 'individual' | 'class' | 'school_level';
export type AttemptStatus = 'in_progress' | 'submitted' | 'graded' | 'late';
export type AssessmentGradingStatus = 'pending' | 'partial' | 'complete';

// Student Class/Group
export interface StudentClass {
  id: string;
  teacherId: string;
  name: string;
  description?: string;
  schoolLevel?: 'jhs' | 'shs';
  yearGroup?: number;
  subjectId?: string;
  academicYear?: string;
  isActive: boolean;
  color: string;
  createdAt: string;
  updatedAt: string;
  // Computed/Joined
  memberCount?: number;
  members?: ClassMember[];
  subject?: { id: string; name: string };
  teacher?: { id: string; name: string };
}

// Class Member
export interface ClassMember {
  id: string;
  classId: string;
  studentId: string;
  joinedAt: string;
  isActive: boolean;
  // Joined
  student?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    yearGroup?: number;
    schoolLevel?: string;
  };
}

// Assessment
export interface Assessment {
  id: string;
  teacherId: string;
  title: string;
  description?: string;
  instructions?: string;
  assessmentType: AssessmentType;
  status: AssessmentStatus;
  // Subject/Topic
  subjectId?: string;
  topicIds?: string[];
  examTypeId?: string;
  // Timing
  timeLimit?: number; // minutes
  startDate?: string;
  endDate?: string;
  lateSubmissionAllowed: boolean;
  latePenaltyPercent: number;
  // Grading
  totalMarks: number;
  passingScore?: number;
  showCorrectAnswers: boolean;
  showScoreImmediately: boolean;
  // Question config
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  oneQuestionPerPage: boolean;
  allowReview: boolean;
  maxAttempts?: number;
  // Metadata
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  archivedAt?: string;
  // Computed/Joined
  questionCount?: number;
  questions?: AssessmentQuestion[];
  assignments?: AssessmentAssignment[];
  attemptCount?: number;
  averageScore?: number;
  completedCount?: number;
  pendingGradingCount?: number;
  teacher?: { id: string; name: string };
  subject?: { id: string; name: string; color?: string };
}

// Assessment Question
export interface AssessmentQuestion {
  id: string;
  assessmentId: string;
  questionId?: string; // null if custom
  // Custom question data
  customQuestionText?: string;
  customQuestionType?: QuestionType;
  customOptions?: QuestionOption[];
  customCorrectAnswer?: string;
  customExplanation?: string;
  customImageUrl?: string;
  // Config
  marks: number;
  displayOrder: number;
  isRequired: boolean;
  createdAt: string;
  // Joined
  question?: Question;
}

// Assessment Assignment
export interface AssessmentAssignment {
  id: string;
  assessmentId: string;
  assignmentType: AssignmentType;
  studentId?: string;
  classId?: string;
  schoolLevel?: 'jhs' | 'shs';
  yearGroup?: number;
  assignedAt: string;
  assignedBy: string;
  customStartDate?: string;
  customEndDate?: string;
  // Joined
  student?: { id: string; name: string; email: string };
  class?: { id: string; name: string; memberCount: number };
}

// Assessment Attempt
export interface AssessmentAttempt {
  id: string;
  assessmentId: string;
  studentId: string;
  attemptNumber: number;
  status: AttemptStatus;
  // Timing
  startedAt: string;
  submittedAt?: string;
  timeTaken?: number; // seconds
  // Scores
  autoScore: number;
  manualScore: number;
  totalScore: number;
  maxScore: number;
  percentage?: number;
  grade?: string;
  // Late
  isLate: boolean;
  latePenaltyApplied: number;
  // Grading
  gradingStatus: AssessmentGradingStatus;
  gradedBy?: string;
  gradedAt?: string;
  teacherFeedback?: string;
  // Metadata
  createdAt: string;
  updatedAt: string;
  // Joined
  assessment?: Assessment;
  student?: { id: string; name: string; email: string; avatarUrl?: string };
  answers?: AssessmentAttemptAnswer[];
}

// Assessment Attempt Answer
export interface AssessmentAttemptAnswer {
  id: string;
  attemptId: string;
  assessmentQuestionId: string;
  // Answer
  answerText?: string;
  answerOptions?: string[]; // for multiple select
  // Auto-grading
  isCorrect?: boolean; // null for essays
  autoMarks: number;
  // Manual grading
  manualMarks?: number;
  teacherComment?: string;
  gradedBy?: string;
  gradedAt?: string;
  // Timing
  timeTaken?: number;
  answeredAt: string;
  // Joined
  assessmentQuestion?: AssessmentQuestion;
}

// Assessment Template
export interface AssessmentTemplate {
  id: string;
  teacherId: string;
  name: string;
  description?: string;
  assessmentType: AssessmentType;
  subjectId?: string;
  settings: AssessmentSettings;
  isShared: boolean;
  createdAt: string;
  updatedAt: string;
}

// Assessment Settings (for templates and defaults)
export interface AssessmentSettings {
  timeLimit?: number;
  lateSubmissionAllowed: boolean;
  latePenaltyPercent: number;
  passingScore?: number;
  showCorrectAnswers: boolean;
  showScoreImmediately: boolean;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  oneQuestionPerPage: boolean;
  allowReview: boolean;
  maxAttempts?: number;
}

// Assessment Builder Draft (flat structure for easy form binding)
export interface AssessmentDraft {
  id?: string;
  step: number;
  // Basic Info
  title: string;
  description: string;
  assessmentType: AssessmentType;
  subjectId?: string;
  instructions?: string;
  // Timing
  timeLimit?: number;
  startDate?: string;
  endDate?: string;
  lateSubmissionAllowed: boolean;
  latePenaltyPercent: number;
  // Settings
  passingScore?: number;
  showCorrectAnswers: boolean;
  showScoreImmediately: boolean;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  oneQuestionPerPage: boolean;
  allowReview: boolean;
  maxAttempts?: number;
  // Questions and Assignments
  questions: AssessmentQuestionDraft[];
  assignments: AssessmentAssignmentDraft[];
}

export interface AssessmentQuestionDraft {
  id: string; // temp ID for ordering
  source: 'existing' | 'custom';
  questionId?: string;
  // Custom question fields (flat for easy form binding)
  customQuestionText?: string;
  customQuestionType?: QuestionType;
  customOptions?: { id: string; text: string; isCorrect: boolean }[];
  customCorrectAnswer?: string;
  customExplanation?: string;
  customImageUrl?: string;
  // Ordering and marks
  displayOrder: number;
  marks: number;
  // Joined question data (when source is 'existing')
  question?: Question;
}

export interface AssessmentAssignmentDraft {
  assignmentType: AssignmentType;
  studentId?: string;
  studentIds?: string[];
  classId?: string;
  classIds?: string[];
  schoolLevel?: 'jhs' | 'shs';
  yearGroup?: number;
}

// Filter Types
export interface AssessmentFilters {
  status?: AssessmentStatus;
  type?: AssessmentType;
  subjectId?: string;
  search?: string;
  dateRange?: { start: string; end: string };
}

export interface GradingFilters {
  assessmentId?: string;
  status?: AssessmentGradingStatus;
  search?: string;
}

// Teacher Dashboard Stats
export interface TeacherDashboardStats {
  totalAssessments: number;
  publishedAssessments: number;
  draftAssessments: number;
  totalClasses: number;
  totalStudents: number;
  pendingGrading: number;
  recentSubmissions: AssessmentAttempt[];
  upcomingDeadlines: Assessment[];
  classPerformance: { classId: string; className: string; avgScore: number }[];
}

// =============================================
// VIRTUAL LAB TYPES
// =============================================

export * from './lab';

// =============================================
// GUIDE SYSTEM TYPES
// =============================================

export * from './guide';
