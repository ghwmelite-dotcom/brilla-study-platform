// Tutoring Marketplace & Teacher Bonus Types

// ============================================
// TEACHER BONUS SYSTEM TYPES
// ============================================

export interface TeacherBonusConfig {
  id: string;
  year: number;
  minStudents: number;
  maxStudents: number | null;
  bonusPercentage: number;
  minActiveMonths: number;
  isActive: boolean;
}

export type BonusStatus = 'pending' | 'calculated' | 'approved' | 'paid' | 'rejected';

export interface TeacherYearEndBonus {
  id: string;
  teacherId: string;
  affiliateProfileId?: string;
  year: number;

  // Student tracking
  totalReferredStudents: number;
  activeStudents: number;

  // Financial
  totalStudentPayments: number;
  bonusPercentage: number;
  bonusAmount: number;

  // Status
  status: BonusStatus;
  calculationDate?: string;

  // Review
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;

  // Payout
  payoutId?: string;
  paidAt?: string;

  createdAt: string;
  updatedAt: string;
}

export interface TeacherBonusStudent {
  id: string;
  bonusId: string;
  studentId: string;
  referralId?: string;

  // Student info (joined)
  studentName?: string;
  studentEmail?: string;

  // Subscription tracking
  firstSubscriptionDate?: string;
  activeMonths: number;
  totalPayments: number;

  // Qualification
  isQualified: boolean;
  qualificationDate?: string;
}

export interface TeacherBonusStatusResponse {
  currentTier: TeacherBonusConfig | null;
  nextTier: TeacherBonusConfig | null;
  activeStudents: number;
  studentsToNextTier: number;
  totalReferredStudents: number;
  estimatedBonus: number;
  bonusHistory: TeacherYearEndBonus[];
}


// ============================================
// TUTORING MARKETPLACE TYPES
// ============================================

export type SessionType = 'video' | 'chat' | 'whiteboard';

export type DirectoryStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface SubjectOffering {
  subjectId: string;
  subjectName: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  description?: string;
}

export interface AvailabilitySlot {
  start: string; // "09:00"
  end: string;   // "17:00"
}

export interface WeeklyAvailability {
  monday?: AvailabilitySlot[];
  tuesday?: AvailabilitySlot[];
  wednesday?: AvailabilitySlot[];
  thursday?: AvailabilitySlot[];
  friday?: AvailabilitySlot[];
  saturday?: AvailabilitySlot[];
  sunday?: AvailabilitySlot[];
}

export interface TeacherDirectoryProfile {
  id: string;
  teacherId: string;

  // Profile display
  displayName: string;
  bio?: string;
  profilePhotoUrl?: string;
  bannerImageUrl?: string;
  tagline?: string;

  // Professional info
  teachingStyle?: string;
  educationBackground?: string[];

  // Subjects
  subjects: SubjectOffering[];

  // Session offerings
  sessionTypes: SessionType[];
  hourlyRate: number;
  currency: string;

  // Availability
  availability?: WeeklyAvailability;
  timezone: string;

  // Directory status
  directoryStatus: DirectoryStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  suspendedReason?: string;

  // Visibility
  isVisible: boolean;
  isFeatured: boolean;

  // Cached stats
  totalSessions: number;
  completedSessions: number;
  totalHours: number;
  averageRating: number;
  ratingCount: number;
  responseRate: number;
  responseTimeHours?: number;
  repeatStudentRate: number;

  // Teacher info (joined from users table)
  teacherName?: string;
  teacherEmail?: string;
  teacherLicenseNumber?: string;
  yearsExperience?: string;
  qualifications?: string;

  createdAt: string;
  updatedAt: string;
}

// Simplified profile for directory listing
export interface TeacherDirectoryCard {
  id: string;
  teacherId: string;
  displayName: string;
  tagline?: string;
  profilePhotoUrl?: string;
  subjects: SubjectOffering[];
  sessionTypes: SessionType[];
  hourlyRate: number;
  averageRating: number;
  ratingCount: number;
  totalSessions: number;
  responseRate: number;
  isFeatured: boolean;
}


// ============================================
// REVIEWS
// ============================================

export interface TeacherReview {
  id: string;
  teacherProfileId: string;
  studentId: string;
  sessionId?: string;

  // Ratings
  rating: number; // 1-5
  knowledgeRating?: number;
  communicationRating?: number;
  punctualityRating?: number;
  patienceRating?: number;

  // Content
  title?: string;
  reviewText?: string;

  // Teacher response
  teacherResponse?: string;
  teacherRespondedAt?: string;

  // Moderation
  isApproved: boolean;
  isFlagged: boolean;

  // Stats
  helpfulCount: number;

  // Student info (joined)
  studentName?: string;

  createdAt: string;
  updatedAt: string;
}

export interface ReviewFormData {
  rating: number;
  title?: string;
  reviewText?: string;
  knowledgeRating?: number;
  communicationRating?: number;
  punctualityRating?: number;
  patienceRating?: number;
}


// ============================================
// TUTORING REQUESTS
// ============================================

export type RequestStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'expired'
  | 'cancelled'
  | 'paid'
  | 'completed';

export interface TutoringRequest {
  id: string;
  studentId: string;
  teacherProfileId: string;

  // Request details
  subjectId: string;
  subjectName?: string;
  topicDescription?: string;
  sessionType: SessionType;

  // Proposed schedule
  proposedDatetime: string;
  proposedDuration: number; // minutes
  alternativeDatetime?: string;

  // Student message
  message?: string;

  // Pricing
  hourlyRate: number;
  estimatedCost: number;

  // Status
  status: RequestStatus;
  teacherResponse?: string;
  respondedAt?: string;

  // Confirmed schedule
  confirmedDatetime?: string;
  confirmedDuration?: number;

  expiresAt?: string;

  // Joined data
  teacherName?: string;
  teacherProfilePhotoUrl?: string;
  studentName?: string;
  studentEmail?: string;

  createdAt: string;
  updatedAt: string;
}

export interface CreateTutoringRequestData {
  teacherProfileId: string;
  subjectId: string;
  topicDescription?: string;
  sessionType: SessionType;
  proposedDatetime: string;
  proposedDuration: number;
  alternativeDatetime?: string;
  message?: string;
}


// ============================================
// TUTORING SESSIONS
// ============================================

export type SessionStatus =
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled_by_student'
  | 'cancelled_by_teacher'
  | 'no_show_student'
  | 'no_show_teacher'
  | 'rescheduled';

export interface TutoringSession {
  id: string;
  requestId?: string;
  studentId: string;
  teacherId: string;
  teacherProfileId: string;

  // Session details
  subjectId: string;
  subjectName?: string;
  topicDescription?: string;
  sessionType: SessionType;

  // Schedule
  scheduledDatetime: string;
  scheduledDuration: number;

  // Actual session
  startedAt?: string;
  endedAt?: string;
  actualDuration?: number;

  // Status
  status: SessionStatus;
  cancellationReason?: string;
  cancelledAt?: string;
  rescheduledTo?: string;

  // Session resources
  chatRoomId?: string;
  whiteboardId?: string;
  recordingId?: string;
  videoRoomUrl?: string;

  // Notes
  teacherNotes?: string;
  sessionSummary?: string;
  homeworkAssigned?: string;

  // Billing
  hourlyRate: number;
  sessionCost: number;
  platformFee: number;
  teacherEarnings: number;

  // Review
  studentReviewed: boolean;

  // Joined data
  teacherName?: string;
  teacherProfilePhotoUrl?: string;
  studentName?: string;
  studentEmail?: string;

  createdAt: string;
  updatedAt: string;
}


// ============================================
// PAYMENTS
// ============================================

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'partial_refund'
  | 'disputed';

export type PayoutStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'held';

export interface TutoringPayment {
  id: string;
  sessionId: string;
  requestId?: string;
  studentId: string;
  teacherId: string;

  // Amounts
  amount: number;
  currency: string;
  platformFee: number;
  teacherPayout: number;

  // Payment status
  paymentReference?: string;
  status: PaymentStatus;
  paidAt?: string;

  // Teacher payout
  teacherPayoutStatus: PayoutStatus;
  teacherPayoutId?: string;
  teacherPaidAt?: string;

  // Refund
  refundAmount?: number;
  refundReason?: string;
  refundedAt?: string;

  createdAt: string;
  updatedAt: string;
}


// ============================================
// TEACHER EARNINGS
// ============================================

export type PayoutMethod = 'mobile_money' | 'bank_transfer';
export type MobileMoneyProvider = 'mtn' | 'vodafone' | 'airteltigo';

export interface TeacherEarnings {
  id: string;
  teacherId: string;

  // Earnings breakdown
  totalTutoringEarnings: number;
  pendingTutoring: number;
  totalBonusEarnings: number;
  pendingBonus: number;
  totalAffiliateEarnings: number;

  // Available balance
  availableBalance: number;

  // Payout info
  mobileMoneyNumber?: string;
  mobileMoneyProvider?: MobileMoneyProvider;
  bankAccountNumber?: string;
  bankName?: string;
  bankAccountName?: string;
  preferredPayoutMethod: PayoutMethod;

  // Stats
  totalPaidOut: number;
  lastPayoutAt?: string;
  payoutCount: number;

  createdAt: string;
  updatedAt: string;
}


// ============================================
// DIRECTORY FILTERS
// ============================================

export interface DirectoryFilters {
  search?: string;
  subjectId?: string;
  sessionTypes?: SessionType[];
  minRating?: number;
  maxHourlyRate?: number;
  minHourlyRate?: number;
  sortBy?: 'rating' | 'price_low' | 'price_high' | 'sessions' | 'newest';
  page?: number;
  pageSize?: number;
}

export interface DirectoryResponse {
  teachers: TeacherDirectoryCard[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}


// ============================================
// ADMIN TYPES
// ============================================

export interface PendingDirectoryProfile extends TeacherDirectoryProfile {
  // Additional fields for admin review
  submittedAt: string;
  teacherLicenseNumber?: string;
  subjectsTaught?: string[];
  yearsExperience?: string;
  qualifications?: string;
}

export interface AdminBonusListItem extends TeacherYearEndBonus {
  teacherName: string;
  teacherEmail: string;
}

export interface TutoringStats {
  totalTeachers: number;
  pendingApprovals: number;
  activeTeachers: number;
  totalSessions: number;
  completedSessions: number;
  totalRevenue: number;
  platformRevenue: number;
  teacherPayouts: number;
  averageRating: number;
  topTeachers: TeacherDirectoryCard[];
}
