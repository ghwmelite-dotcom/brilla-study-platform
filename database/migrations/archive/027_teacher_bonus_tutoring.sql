-- Migration: 027_teacher_bonus_tutoring.sql
-- Description: Add Teacher Year-End Bonus System and Tutoring Marketplace
-- Date: 2025-12-25

-- ============================================
-- PART 1: TEACHER YEAR-END BONUS SYSTEM
-- ============================================

-- Bonus tier configuration (configurable per year)
CREATE TABLE IF NOT EXISTS teacher_bonus_config (
  id TEXT PRIMARY KEY,
  year INTEGER NOT NULL,
  min_students INTEGER NOT NULL,
  max_students INTEGER, -- NULL means unlimited
  bonus_percentage REAL NOT NULL, -- Percentage of student payments
  min_active_months INTEGER DEFAULT 3, -- Minimum months student must be active to qualify
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(year, min_students)
);

-- Insert 2025 tier configuration
INSERT OR IGNORE INTO teacher_bonus_config (id, year, min_students, max_students, bonus_percentage, min_active_months) VALUES
  ('bonus_tier_2025_1', 2025, 5, 10, 15.0, 3),
  ('bonus_tier_2025_2', 2025, 11, 20, 20.0, 3),
  ('bonus_tier_2025_3', 2025, 21, 35, 25.0, 3),
  ('bonus_tier_2025_4', 2025, 36, 50, 30.0, 3),
  ('bonus_tier_2025_5', 2025, 51, NULL, 35.0, 3);

-- Insert 2026 tier configuration (copy of 2025)
INSERT OR IGNORE INTO teacher_bonus_config (id, year, min_students, max_students, bonus_percentage, min_active_months) VALUES
  ('bonus_tier_2026_1', 2026, 5, 10, 15.0, 3),
  ('bonus_tier_2026_2', 2026, 11, 20, 20.0, 3),
  ('bonus_tier_2026_3', 2026, 21, 35, 25.0, 3),
  ('bonus_tier_2026_4', 2026, 36, 50, 30.0, 3),
  ('bonus_tier_2026_5', 2026, 51, NULL, 35.0, 3);

-- Year-end bonus records for each teacher
CREATE TABLE IF NOT EXISTS teacher_year_end_bonuses (
  id TEXT PRIMARY KEY,
  teacher_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  affiliate_profile_id TEXT REFERENCES affiliate_profiles(id),
  year INTEGER NOT NULL,

  -- Student tracking
  total_referred_students INTEGER DEFAULT 0,
  active_students INTEGER DEFAULT 0, -- Students with 3+ months active subscription

  -- Financial calculations
  total_student_payments REAL DEFAULT 0, -- Gross payments from referred students in GHS
  bonus_percentage REAL DEFAULT 0, -- Applied percentage based on tier
  bonus_amount REAL DEFAULT 0, -- Calculated bonus amount in GHS

  -- Status workflow
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'calculated', 'approved', 'paid', 'rejected')),
  calculation_date TEXT,

  -- Review/Approval
  reviewed_by TEXT REFERENCES users(id),
  reviewed_at TEXT,
  review_notes TEXT,

  -- Payout details (reuses affiliate payout infrastructure)
  payout_id TEXT REFERENCES affiliate_payouts(id),
  paid_at TEXT,

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(teacher_id, year)
);

CREATE INDEX IF NOT EXISTS idx_teacher_bonuses_teacher ON teacher_year_end_bonuses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_bonuses_year ON teacher_year_end_bonuses(year);
CREATE INDEX IF NOT EXISTS idx_teacher_bonuses_status ON teacher_year_end_bonuses(status);

-- Individual student contributions to teacher bonus
CREATE TABLE IF NOT EXISTS teacher_bonus_students (
  id TEXT PRIMARY KEY,
  bonus_id TEXT NOT NULL REFERENCES teacher_year_end_bonuses(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referral_id TEXT REFERENCES affiliate_referrals(id),

  -- Subscription tracking for the year
  first_subscription_date TEXT,
  active_months INTEGER DEFAULT 0, -- Months with active paid subscription
  total_payments REAL DEFAULT 0, -- Total payments made by this student in the year (GHS)

  -- Qualification status
  is_qualified INTEGER DEFAULT 0, -- Has 3+ active months
  qualification_date TEXT,

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(bonus_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_bonus_students_bonus ON teacher_bonus_students(bonus_id);
CREATE INDEX IF NOT EXISTS idx_bonus_students_student ON teacher_bonus_students(student_id);
CREATE INDEX IF NOT EXISTS idx_bonus_students_qualified ON teacher_bonus_students(is_qualified);


-- ============================================
-- PART 2: TUTORING MARKETPLACE
-- ============================================

-- Extended teacher profiles for public directory
CREATE TABLE IF NOT EXISTS teacher_directory_profiles (
  id TEXT PRIMARY KEY,
  teacher_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- Profile display info
  display_name TEXT NOT NULL,
  bio TEXT, -- Detailed description
  profile_photo_url TEXT,
  banner_image_url TEXT,
  tagline TEXT, -- Short intro line (max 100 chars)

  -- Professional info
  teaching_style TEXT, -- e.g., 'Interactive', 'Lecture-based', 'Problem-solving focused'
  education_background TEXT, -- JSON array of degrees/certifications

  -- Subjects taught (JSON array with details)
  -- Format: [{"subjectId": "...", "subjectName": "...", "level": "beginner|intermediate|advanced", "description": "..."}]
  subjects TEXT NOT NULL,

  -- Session offerings
  -- JSON array: ['video', 'chat', 'whiteboard']
  session_types TEXT NOT NULL,
  hourly_rate REAL NOT NULL, -- GHS per hour
  currency TEXT DEFAULT 'GHS',

  -- Availability schedule
  -- JSON format: {"monday": [{"start": "09:00", "end": "17:00"}], ...}
  availability TEXT,
  timezone TEXT DEFAULT 'Africa/Accra',

  -- Directory approval status (separate from user account approval)
  directory_status TEXT DEFAULT 'pending' CHECK(directory_status IN ('pending', 'approved', 'rejected', 'suspended')),
  approved_by TEXT REFERENCES users(id),
  approved_at TEXT,
  rejection_reason TEXT,
  suspended_reason TEXT,
  suspended_at TEXT,

  -- Visibility controls
  is_visible INTEGER DEFAULT 0, -- Only visible after approval
  is_featured INTEGER DEFAULT 0, -- Featured on homepage/top of directory
  feature_order INTEGER DEFAULT 0, -- Order among featured teachers

  -- Cached stats (updated after each session/review)
  total_sessions INTEGER DEFAULT 0,
  completed_sessions INTEGER DEFAULT 0,
  total_hours REAL DEFAULT 0,
  average_rating REAL DEFAULT 0, -- 1-5 stars
  rating_count INTEGER DEFAULT 0,
  response_rate REAL DEFAULT 100, -- Percentage of requests responded to
  response_time_hours REAL, -- Average response time in hours
  repeat_student_rate REAL DEFAULT 0, -- Percentage of students who book again

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_directory_profiles_teacher ON teacher_directory_profiles(teacher_id);
CREATE INDEX IF NOT EXISTS idx_directory_profiles_status ON teacher_directory_profiles(directory_status);
CREATE INDEX IF NOT EXISTS idx_directory_profiles_visible ON teacher_directory_profiles(is_visible);
CREATE INDEX IF NOT EXISTS idx_directory_profiles_featured ON teacher_directory_profiles(is_featured);
CREATE INDEX IF NOT EXISTS idx_directory_profiles_rating ON teacher_directory_profiles(average_rating DESC);
CREATE INDEX IF NOT EXISTS idx_directory_profiles_sessions ON teacher_directory_profiles(total_sessions DESC);

-- Teacher reviews from students
CREATE TABLE IF NOT EXISTS teacher_reviews (
  id TEXT PRIMARY KEY,
  teacher_profile_id TEXT NOT NULL REFERENCES teacher_directory_profiles(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id TEXT REFERENCES tutoring_sessions(id), -- Optional link to specific session

  -- Overall rating (required)
  rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),

  -- Review content
  title TEXT, -- Optional headline
  review_text TEXT, -- Detailed review

  -- Specific aspect ratings (optional, 1-5)
  knowledge_rating INTEGER CHECK(knowledge_rating IS NULL OR (knowledge_rating >= 1 AND knowledge_rating <= 5)),
  communication_rating INTEGER CHECK(communication_rating IS NULL OR (communication_rating >= 1 AND communication_rating <= 5)),
  punctuality_rating INTEGER CHECK(punctuality_rating IS NULL OR (punctuality_rating >= 1 AND punctuality_rating <= 5)),
  patience_rating INTEGER CHECK(patience_rating IS NULL OR (patience_rating >= 1 AND patience_rating <= 5)),

  -- Teacher response
  teacher_response TEXT,
  teacher_responded_at TEXT,

  -- Moderation
  is_approved INTEGER DEFAULT 1, -- Auto-approved by default
  is_flagged INTEGER DEFAULT 0,
  flagged_reason TEXT,
  moderated_by TEXT REFERENCES users(id),
  moderated_at TEXT,

  -- Helpful votes
  helpful_count INTEGER DEFAULT 0,

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_teacher_reviews_profile ON teacher_reviews(teacher_profile_id);
CREATE INDEX IF NOT EXISTS idx_teacher_reviews_student ON teacher_reviews(student_id);
CREATE INDEX IF NOT EXISTS idx_teacher_reviews_session ON teacher_reviews(session_id);
CREATE INDEX IF NOT EXISTS idx_teacher_reviews_rating ON teacher_reviews(rating DESC);
CREATE INDEX IF NOT EXISTS idx_teacher_reviews_approved ON teacher_reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_teacher_reviews_flagged ON teacher_reviews(is_flagged);

-- Prevent duplicate reviews for same session
CREATE UNIQUE INDEX IF NOT EXISTS idx_teacher_reviews_session_unique
ON teacher_reviews(teacher_profile_id, student_id, session_id)
WHERE session_id IS NOT NULL;

-- Tutoring requests from students
CREATE TABLE IF NOT EXISTS tutoring_requests (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  teacher_profile_id TEXT NOT NULL REFERENCES teacher_directory_profiles(id) ON DELETE CASCADE,

  -- Request details
  subject_id TEXT NOT NULL REFERENCES subjects(id),
  topic_description TEXT, -- What the student wants to learn
  session_type TEXT NOT NULL CHECK(session_type IN ('video', 'chat', 'whiteboard')),

  -- Proposed schedule
  proposed_datetime TEXT NOT NULL, -- ISO datetime
  proposed_duration INTEGER NOT NULL DEFAULT 60, -- Minutes (30, 60, 90, 120)
  alternative_datetime TEXT, -- Optional second choice

  -- Student's message to teacher
  message TEXT,

  -- Pricing snapshot (at time of request)
  hourly_rate REAL NOT NULL,
  estimated_cost REAL NOT NULL, -- hourly_rate * (duration / 60)

  -- Status workflow
  status TEXT DEFAULT 'pending' CHECK(status IN (
    'pending',      -- Awaiting teacher response
    'accepted',     -- Teacher accepted, awaiting payment
    'declined',     -- Teacher declined
    'expired',      -- No response within 48 hours
    'cancelled',    -- Cancelled by student
    'paid',         -- Payment completed, session scheduled
    'completed'     -- Session completed
  )),

  -- Teacher response
  teacher_response TEXT, -- Message when accepting/declining
  responded_at TEXT,

  -- Confirmed schedule (may differ from proposed)
  confirmed_datetime TEXT,
  confirmed_duration INTEGER,

  -- Auto-expiry
  expires_at TEXT, -- Default: 48 hours after creation

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tutoring_requests_student ON tutoring_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_tutoring_requests_teacher ON tutoring_requests(teacher_profile_id);
CREATE INDEX IF NOT EXISTS idx_tutoring_requests_status ON tutoring_requests(status);
CREATE INDEX IF NOT EXISTS idx_tutoring_requests_datetime ON tutoring_requests(proposed_datetime);
CREATE INDEX IF NOT EXISTS idx_tutoring_requests_expires ON tutoring_requests(expires_at);

-- Tutoring sessions (created after request is accepted and paid)
CREATE TABLE IF NOT EXISTS tutoring_sessions (
  id TEXT PRIMARY KEY,
  request_id TEXT REFERENCES tutoring_requests(id),
  student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  teacher_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  teacher_profile_id TEXT NOT NULL REFERENCES teacher_directory_profiles(id),

  -- Session details
  subject_id TEXT NOT NULL REFERENCES subjects(id),
  topic_description TEXT,
  session_type TEXT NOT NULL CHECK(session_type IN ('video', 'chat', 'whiteboard')),

  -- Schedule
  scheduled_datetime TEXT NOT NULL,
  scheduled_duration INTEGER NOT NULL, -- Minutes

  -- Actual session times
  started_at TEXT,
  ended_at TEXT,
  actual_duration INTEGER, -- Actual minutes

  -- Session status
  status TEXT DEFAULT 'scheduled' CHECK(status IN (
    'scheduled',           -- Upcoming session
    'in_progress',         -- Session currently active
    'completed',           -- Session finished normally
    'cancelled_by_student',
    'cancelled_by_teacher',
    'no_show_student',     -- Student didn't show up
    'no_show_teacher',     -- Teacher didn't show up
    'rescheduled'          -- Moved to a new time
  )),
  cancellation_reason TEXT,
  cancelled_at TEXT,
  rescheduled_to TEXT, -- New session ID if rescheduled

  -- Session resources (linked to existing systems)
  chat_room_id TEXT, -- References chat_rooms(id) for chat sessions
  whiteboard_id TEXT, -- References whiteboards(id) for whiteboard sessions
  recording_id TEXT, -- References whiteboard_recordings(id) if recorded
  video_room_url TEXT, -- External video call URL (Zoom/Meet link)
  video_room_id TEXT, -- If using internal video system

  -- Session notes
  teacher_notes TEXT, -- Private notes for teacher
  session_summary TEXT, -- Shared summary visible to student
  homework_assigned TEXT, -- Optional homework or follow-up tasks

  -- Billing (15% platform commission, 85% to teacher)
  hourly_rate REAL NOT NULL,
  session_cost REAL NOT NULL, -- Total cost to student
  platform_fee REAL NOT NULL, -- 15% of session_cost
  teacher_earnings REAL NOT NULL, -- 85% of session_cost

  -- Review tracking
  student_reviewed INTEGER DEFAULT 0,
  review_reminder_sent INTEGER DEFAULT 0,

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tutoring_sessions_student ON tutoring_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_tutoring_sessions_teacher ON tutoring_sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_tutoring_sessions_profile ON tutoring_sessions(teacher_profile_id);
CREATE INDEX IF NOT EXISTS idx_tutoring_sessions_status ON tutoring_sessions(status);
CREATE INDEX IF NOT EXISTS idx_tutoring_sessions_datetime ON tutoring_sessions(scheduled_datetime);
CREATE INDEX IF NOT EXISTS idx_tutoring_sessions_request ON tutoring_sessions(request_id);

-- Tutoring payments
CREATE TABLE IF NOT EXISTS tutoring_payments (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES tutoring_sessions(id) ON DELETE CASCADE,
  request_id TEXT REFERENCES tutoring_requests(id),
  student_id TEXT NOT NULL REFERENCES users(id),
  teacher_id TEXT NOT NULL REFERENCES users(id),

  -- Payment amounts (in GHS)
  amount REAL NOT NULL, -- Total paid by student
  currency TEXT DEFAULT 'GHS',
  platform_fee REAL NOT NULL, -- 15% to platform
  teacher_payout REAL NOT NULL, -- 85% to teacher

  -- Paystack integration
  payment_reference TEXT UNIQUE,
  paystack_response TEXT, -- JSON response from Paystack
  paystack_authorization_code TEXT, -- For recurring payments

  -- Payment status
  status TEXT DEFAULT 'pending' CHECK(status IN (
    'pending',       -- Awaiting payment
    'processing',    -- Payment being processed
    'paid',          -- Successfully paid
    'failed',        -- Payment failed
    'refunded',      -- Fully refunded
    'partial_refund',-- Partially refunded
    'disputed'       -- Under dispute
  )),
  paid_at TEXT,

  -- Teacher payout status
  teacher_payout_status TEXT DEFAULT 'pending' CHECK(teacher_payout_status IN (
    'pending',      -- Awaiting session completion
    'processing',   -- Payout being processed
    'completed',    -- Paid to teacher
    'failed',       -- Payout failed
    'held'          -- Held due to dispute or issue
  )),
  teacher_payout_id TEXT REFERENCES affiliate_payouts(id), -- Reuse payout infrastructure
  teacher_paid_at TEXT,

  -- Refund tracking
  refund_amount REAL,
  refund_reason TEXT,
  refunded_at TEXT,
  refund_reference TEXT,

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tutoring_payments_session ON tutoring_payments(session_id);
CREATE INDEX IF NOT EXISTS idx_tutoring_payments_student ON tutoring_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_tutoring_payments_teacher ON tutoring_payments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_tutoring_payments_status ON tutoring_payments(status);
CREATE INDEX IF NOT EXISTS idx_tutoring_payments_teacher_payout ON tutoring_payments(teacher_payout_status);
CREATE INDEX IF NOT EXISTS idx_tutoring_payments_reference ON tutoring_payments(payment_reference);

-- Teacher earnings aggregation (combined tutoring + bonus earnings)
CREATE TABLE IF NOT EXISTS teacher_earnings (
  id TEXT PRIMARY KEY,
  teacher_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- Tutoring earnings
  total_tutoring_earnings REAL DEFAULT 0, -- All-time tutoring earnings
  pending_tutoring REAL DEFAULT 0, -- Awaiting session completion/payout

  -- Bonus earnings
  total_bonus_earnings REAL DEFAULT 0, -- All-time bonus earnings
  pending_bonus REAL DEFAULT 0, -- Approved but not yet paid

  -- Affiliate earnings (synced from affiliate_profiles)
  total_affiliate_earnings REAL DEFAULT 0,

  -- Available for withdrawal
  available_balance REAL DEFAULT 0,

  -- Payout info (same as affiliate system)
  mobile_money_number TEXT,
  mobile_money_provider TEXT CHECK(mobile_money_provider IS NULL OR mobile_money_provider IN ('mtn', 'vodafone', 'airteltigo')),
  bank_account_number TEXT,
  bank_name TEXT,
  bank_account_name TEXT,
  preferred_payout_method TEXT DEFAULT 'mobile_money' CHECK(preferred_payout_method IN ('mobile_money', 'bank_transfer')),

  -- Lifetime stats
  total_paid_out REAL DEFAULT 0,
  last_payout_at TEXT,
  payout_count INTEGER DEFAULT 0,

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_teacher_earnings_teacher ON teacher_earnings(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_earnings_balance ON teacher_earnings(available_balance DESC);

-- Review helpful votes (track who found a review helpful)
CREATE TABLE IF NOT EXISTS review_helpful_votes (
  id TEXT PRIMARY KEY,
  review_id TEXT NOT NULL REFERENCES teacher_reviews(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(review_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_review_votes_review ON review_helpful_votes(review_id);

-- Session reminders (for notification system)
CREATE TABLE IF NOT EXISTS session_reminders (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES tutoring_sessions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK(reminder_type IN ('24h', '1h', '15m', 'start')),
  scheduled_for TEXT NOT NULL,
  sent INTEGER DEFAULT 0,
  sent_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(session_id, user_id, reminder_type)
);

CREATE INDEX IF NOT EXISTS idx_session_reminders_session ON session_reminders(session_id);
CREATE INDEX IF NOT EXISTS idx_session_reminders_scheduled ON session_reminders(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_session_reminders_pending ON session_reminders(sent) WHERE sent = 0;
