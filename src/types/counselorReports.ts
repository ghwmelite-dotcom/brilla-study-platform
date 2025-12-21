// Counselor Reports Type Definitions
// For parent/guardian portal access to student counseling insights

export type ReportType = 'weekly' | 'monthly' | 'semester' | 'custom' | 'concern';
export type ReportStatus = 'draft' | 'published' | 'archived';
export type ConcernLevel = 'none' | 'low' | 'medium' | 'high' | 'urgent';
export type MoodTrend = 'improving' | 'stable' | 'declining' | 'fluctuating';
export type EmotionalState = 'positive' | 'neutral' | 'stressed' | 'anxious' | 'sad' | 'angry' | 'mixed';
export type AlertType = 'stress' | 'mood_decline' | 'inactivity' | 'concerning_content' | 'academic_struggle';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'urgent';
export type RelationshipType = 'parent' | 'guardian' | 'other';

// Study Pattern Analysis
export interface StudyPatterns {
  averageStudyHoursPerDay: number;
  peakStudyHours: string[]; // e.g., ["14:00-16:00", "19:00-21:00"]
  consistency: 'high' | 'medium' | 'low';
  preferredSubjects: string[];
  studyStreak: number;
  weeklyTrend: 'increasing' | 'stable' | 'decreasing';
}

// Subject Performance Analysis
export interface SubjectPerformance {
  subjectId: string;
  subjectName: string;
  averageScore: number;
  trend: 'improving' | 'stable' | 'declining';
  questionsAttempted: number;
  accuracy: number;
  timeSpentMinutes: number;
  strengths: string[];
  areasForImprovement: string[];
}

// Goal Tracking
export interface StudentGoal {
  id: string;
  title: string;
  description?: string;
  targetDate?: string;
  progress: number; // 0-100
  status: 'not_started' | 'in_progress' | 'achieved' | 'missed';
  category: 'academic' | 'wellbeing' | 'skill' | 'habit';
}

// Recommendation from AI
export interface Recommendation {
  id: string;
  category: 'academic' | 'wellbeing' | 'engagement' | 'skill_building';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionSteps: string[];
  targetAudience: 'student' | 'parent' | 'both';
  resources?: { title: string; url?: string; type: string }[];
}

// Main Counselor Report
export interface CounselorReport {
  id: string;
  studentId: string;
  studentName?: string;
  studentAvatar?: string;
  generatedBy: 'system' | 'counselor' | 'parent_request';
  reportType: ReportType;
  reportPeriodStart: string;
  reportPeriodEnd: string;

  // Overall Summary
  summary: string;
  keyInsights: string[];

  // Academic Section
  academicSummary?: string;
  academicStrengths: string[];
  academicChallenges: string[];
  studyPatterns?: StudyPatterns;
  subjectPerformance: SubjectPerformance[];

  // Wellbeing Section
  wellbeingSummary?: string;
  moodTrend?: MoodTrend;
  stressIndicators: string[];
  wellbeingScore?: number; // 1-100

  // Engagement Section
  engagementSummary?: string;
  platformUsageHours: number;
  counselorSessionsCount: number;
  topicsDiscussed: string[];

  // Goals & Progress
  goalsSet: StudentGoal[];
  goalsAchieved: StudentGoal[];
  goalsInProgress: StudentGoal[];

  // Recommendations
  recommendations: Recommendation[];
  parentActionItems: string[];
  followUpNeeded: boolean;
  followUpReason?: string;

  // Flags and Concerns
  concernLevel: ConcernLevel;
  concernAreas: string[];
  professionalReferralSuggested: boolean;
  referralType?: string;

  // Metadata
  status: ReportStatus;
  isReadByParent: boolean;
  readAt?: string;
  parentFeedback?: string;
  createdAt: string;
  updatedAt: string;
}

// Session Summary
export interface CounselorSessionSummary {
  id: string;
  conversationId: string;
  studentId: string;
  sessionDate: string;
  durationMinutes?: number;
  briefSummary: string;
  mainTopics: string[];
  emotionalState?: EmotionalState;
  keyConcerns: string[];
  breakthroughs: string[];
  studentActionItems: string[];
  recommendedResources: { title: string; url?: string; type: string }[];
  requiresAttention: boolean;
  attentionReason?: string;
  createdAt: string;
}

// Wellbeing Alert
export interface WellbeingAlert {
  id: string;
  studentId: string;
  studentName?: string;
  alertType: AlertType;
  severity: AlertSeverity;
  description: string;
  triggeredBy?: string;
  sourceId?: string;
  parentNotified: boolean;
  notifiedAt?: string;
  notificationMethod?: string;
  isResolved: boolean;
  resolvedAt?: string;
  resolutionNotes?: string;
  resolvedBy?: string;
  createdAt: string;
}

// Student-Parent Link
export interface StudentParentLink {
  id: string;
  studentId: string;
  parentId: string;
  studentName?: string;
  studentAvatar?: string;
  studentSchoolLevel?: string;
  studentYearGroup?: number;
  relationship: RelationshipType;
  isPrimary: boolean;
  notificationPreferences: {
    email: boolean;
    inApp: boolean;
    reports: boolean;
  };
  isVerified: boolean;
  verifiedAt?: string;
  createdAt: string;
}

// Parent-Counselor Message
export interface ParentCounselorMessage {
  id: string;
  reportId?: string;
  parentId: string;
  studentId: string;
  senderRole: 'parent' | 'counselor_ai' | 'admin';
  message: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

// Report Request (from parent)
export interface ReportRequest {
  studentId: string;
  reportType: ReportType;
  periodStart?: string;
  periodEnd?: string;
  focusAreas?: ('academic' | 'wellbeing' | 'engagement' | 'goals')[];
  additionalNotes?: string;
}

// Report Schedule
export interface ReportSchedule {
  id: string;
  studentId: string;
  parentId: string;
  reportType: 'weekly' | 'monthly' | 'semester';
  isActive: boolean;
  lastGeneratedAt?: string;
  nextGenerationAt?: string;
  createdAt: string;
}

// Parent Dashboard Data
export interface ParentDashboardData {
  linkedStudents: StudentParentLink[];
  recentReports: CounselorReport[];
  unresolvedAlerts: WellbeingAlert[];
  unreadMessages: number;
  upcomingReports: ReportSchedule[];
}

// Report Filters
export interface ReportFilters {
  studentId?: string;
  reportType?: ReportType;
  status?: ReportStatus;
  concernLevel?: ConcernLevel;
  dateFrom?: string;
  dateTo?: string;
  isRead?: boolean;
}

// Constants for UI
export const CONCERN_LEVEL_CONFIG: Record<ConcernLevel, { label: string; color: string; bgColor: string; icon: string }> = {
  none: { label: 'No Concerns', color: '#22C55E', bgColor: '#DCFCE7', icon: 'check-circle' },
  low: { label: 'Minor Attention', color: '#3B82F6', bgColor: '#DBEAFE', icon: 'info' },
  medium: { label: 'Needs Attention', color: '#F59E0B', bgColor: '#FEF3C7', icon: 'alert-triangle' },
  high: { label: 'Significant Concern', color: '#EF4444', bgColor: '#FEE2E2', icon: 'alert-circle' },
  urgent: { label: 'Urgent Action Needed', color: '#DC2626', bgColor: '#FEE2E2', icon: 'alert-octagon' },
};

export const REPORT_TYPE_CONFIG: Record<ReportType, { label: string; description: string; color: string }> = {
  weekly: { label: 'Weekly Report', description: 'Summary of the past week', color: '#3B82F6' },
  monthly: { label: 'Monthly Report', description: 'Comprehensive monthly overview', color: '#8B5CF6' },
  semester: { label: 'Semester Report', description: 'Full semester analysis', color: '#10B981' },
  custom: { label: 'Custom Report', description: 'Report for a specific period', color: '#F59E0B' },
  concern: { label: 'Concern Report', description: 'Generated due to flagged concerns', color: '#EF4444' },
};

export const MOOD_TREND_CONFIG: Record<MoodTrend, { label: string; color: string; icon: string }> = {
  improving: { label: 'Improving', color: '#22C55E', icon: 'trending-up' },
  stable: { label: 'Stable', color: '#3B82F6', icon: 'minus' },
  declining: { label: 'Needs Support', color: '#F59E0B', icon: 'trending-down' },
  fluctuating: { label: 'Fluctuating', color: '#8B5CF6', icon: 'activity' },
};

export const ALERT_SEVERITY_CONFIG: Record<AlertSeverity, { label: string; color: string; bgColor: string }> = {
  low: { label: 'Low', color: '#3B82F6', bgColor: '#DBEAFE' },
  medium: { label: 'Medium', color: '#F59E0B', bgColor: '#FEF3C7' },
  high: { label: 'High', color: '#EF4444', bgColor: '#FEE2E2' },
  urgent: { label: 'Urgent', color: '#DC2626', bgColor: '#FEE2E2' },
};
