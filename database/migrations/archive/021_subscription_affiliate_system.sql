-- Migration: 021_subscription_affiliate_system.sql
-- Description: Add gamified subscription and affiliate marketing system
-- Date: 2024-12-23

-- =============================================
-- SUBSCRIPTION SYSTEM TABLES
-- =============================================

-- Subscription tiers (create if not exists)
CREATE TABLE IF NOT EXISTS subscription_tiers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    description TEXT,
    price_monthly REAL DEFAULT 0,
    price_yearly REAL DEFAULT 0,
    currency TEXT DEFAULT 'GHS',
    ai_grading_quota INTEGER DEFAULT 0,
    features TEXT,
    user_type TEXT DEFAULT 'student',
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
);

-- User trial tracking
CREATE TABLE IF NOT EXISTS user_trials (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  converted_at TEXT,
  discount_code TEXT,
  discount_percent INTEGER,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'expired', 'converted')),
  tasks_completed TEXT DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_user_trials_user ON user_trials(user_id);
CREATE INDEX IF NOT EXISTS idx_user_trials_status ON user_trials(status);
CREATE INDEX IF NOT EXISTS idx_user_trials_expires ON user_trials(expires_at);

-- Payment transactions (Paystack)
CREATE TABLE IF NOT EXISTS payment_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reference TEXT NOT NULL UNIQUE,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'GHS',
  plan_id TEXT,
  plan_type TEXT NOT NULL,
  billing_cycle TEXT CHECK(billing_cycle IN ('monthly', 'yearly')),
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'success', 'failed', 'refunded')),
  paystack_response TEXT,
  paystack_customer_code TEXT,
  paystack_subscription_code TEXT,
  metadata TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  verified_at TEXT,
  refunded_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_user ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_reference ON payment_transactions(reference);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);

-- =============================================
-- AFFILIATE SYSTEM TABLES
-- =============================================

-- Affiliate tiers/ranks
CREATE TABLE IF NOT EXISTS affiliate_tiers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  min_referrals INTEGER NOT NULL,
  max_referrals INTEGER,
  commission_rate REAL NOT NULL,
  badge_icon TEXT,
  badge_color TEXT,
  xp_bonus INTEGER DEFAULT 0,
  perks TEXT DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now'))
);

-- Affiliate profiles
CREATE TABLE IF NOT EXISTS affiliate_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL UNIQUE,
  tier_id TEXT REFERENCES affiliate_tiers(id) DEFAULT 'tier_scout',
  total_referrals INTEGER DEFAULT 0,
  successful_conversions INTEGER DEFAULT 0,
  total_earnings REAL DEFAULT 0,
  pending_earnings REAL DEFAULT 0,
  available_earnings REAL DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  mobile_money_number TEXT,
  mobile_money_provider TEXT CHECK(mobile_money_provider IN ('mtn', 'vodafone', 'airteltigo')),
  joined_at TEXT DEFAULT (datetime('now')),
  last_referral_at TEXT,
  last_payout_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_affiliate_profiles_user ON affiliate_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_profiles_code ON affiliate_profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_profiles_tier ON affiliate_profiles(tier_id);

-- Referral tracking
CREATE TABLE IF NOT EXISTS affiliate_referrals (
  id TEXT PRIMARY KEY,
  affiliate_id TEXT NOT NULL REFERENCES affiliate_profiles(id) ON DELETE CASCADE,
  referred_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'trial', 'converted', 'churned')),
  signup_at TEXT DEFAULT (datetime('now')),
  trial_started_at TEXT,
  converted_at TEXT,
  churned_at TEXT,
  first_payment_id TEXT REFERENCES payment_transactions(id),
  lifetime_value REAL DEFAULT 0,
  UNIQUE(affiliate_id, referred_user_id)
);

CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_affiliate ON affiliate_referrals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_referred ON affiliate_referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_status ON affiliate_referrals(status);

-- Commission records
CREATE TABLE IF NOT EXISTS affiliate_commissions (
  id TEXT PRIMARY KEY,
  affiliate_id TEXT NOT NULL REFERENCES affiliate_profiles(id) ON DELETE CASCADE,
  referral_id TEXT NOT NULL REFERENCES affiliate_referrals(id) ON DELETE CASCADE,
  transaction_id TEXT REFERENCES payment_transactions(id),
  amount REAL NOT NULL,
  commission_rate REAL NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'paid', 'cancelled')),
  created_at TEXT DEFAULT (datetime('now')),
  approved_at TEXT,
  paid_at TEXT,
  payout_id TEXT REFERENCES affiliate_payouts(id)
);

CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_affiliate ON affiliate_commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_status ON affiliate_commissions(status);

-- Payout requests
CREATE TABLE IF NOT EXISTS affiliate_payouts (
  id TEXT PRIMARY KEY,
  affiliate_id TEXT NOT NULL REFERENCES affiliate_profiles(id) ON DELETE CASCADE,
  amount REAL NOT NULL,
  payment_method TEXT DEFAULT 'mobile_money',
  mobile_money_number TEXT NOT NULL,
  mobile_money_provider TEXT NOT NULL CHECK(mobile_money_provider IN ('mtn', 'vodafone', 'airteltigo')),
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'failed')),
  paystack_transfer_code TEXT,
  paystack_recipient_code TEXT,
  failure_reason TEXT,
  requested_at TEXT DEFAULT (datetime('now')),
  processed_at TEXT,
  admin_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_affiliate ON affiliate_payouts(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_status ON affiliate_payouts(status);

-- Affiliate link clicks (analytics)
CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id TEXT PRIMARY KEY,
  affiliate_id TEXT NOT NULL REFERENCES affiliate_profiles(id) ON DELETE CASCADE,
  ip_hash TEXT,
  user_agent TEXT,
  referrer_url TEXT,
  landing_page TEXT,
  converted INTEGER DEFAULT 0,
  clicked_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_affiliate ON affiliate_clicks(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_date ON affiliate_clicks(clicked_at);

-- =============================================
-- GAMIFICATION TABLES
-- =============================================

-- Affiliate challenges/quests
CREATE TABLE IF NOT EXISTS affiliate_challenges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT NOT NULL CHECK(challenge_type IN ('daily', 'weekly', 'monthly', 'milestone', 'seasonal')),
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  xp_reward INTEGER DEFAULT 0,
  cash_bonus REAL DEFAULT 0,
  badge_icon TEXT,
  badge_color TEXT,
  is_active INTEGER DEFAULT 1,
  start_date TEXT,
  end_date TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_affiliate_challenges_type ON affiliate_challenges(challenge_type);
CREATE INDEX IF NOT EXISTS idx_affiliate_challenges_active ON affiliate_challenges(is_active);

-- User challenge progress
CREATE TABLE IF NOT EXISTS user_affiliate_challenges (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id TEXT NOT NULL REFERENCES affiliate_challenges(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'claimed', 'expired')),
  started_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT,
  claimed_at TEXT,
  xp_earned INTEGER DEFAULT 0,
  cash_earned REAL DEFAULT 0,
  UNIQUE(user_id, challenge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_affiliate_challenges_user ON user_affiliate_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_affiliate_challenges_status ON user_affiliate_challenges(status);

-- Affiliate achievements
CREATE TABLE IF NOT EXISTS affiliate_achievements (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  xp_reward INTEGER DEFAULT 0,
  cash_bonus REAL DEFAULT 0,
  tier_unlock TEXT REFERENCES affiliate_tiers(id),
  is_secret INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- User affiliate achievements
CREATE TABLE IF NOT EXISTS user_affiliate_achievements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES affiliate_achievements(id) ON DELETE CASCADE,
  unlocked_at TEXT DEFAULT (datetime('now')),
  notified INTEGER DEFAULT 0,
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_affiliate_achievements_user ON user_affiliate_achievements(user_id);

-- Affiliate leaderboard (cached)
CREATE TABLE IF NOT EXISTS affiliate_leaderboard (
  id TEXT PRIMARY KEY,
  affiliate_id TEXT NOT NULL REFERENCES affiliate_profiles(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period TEXT NOT NULL CHECK(period IN ('daily', 'weekly', 'monthly', 'all_time')),
  period_value TEXT,
  referrals_count INTEGER DEFAULT 0,
  conversions_count INTEGER DEFAULT 0,
  earnings REAL DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  rank INTEGER,
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(affiliate_id, period, period_value)
);

CREATE INDEX IF NOT EXISTS idx_affiliate_leaderboard_period ON affiliate_leaderboard(period, period_value);
CREATE INDEX IF NOT EXISTS idx_affiliate_leaderboard_rank ON affiliate_leaderboard(rank);

-- School affiliate competition
CREATE TABLE IF NOT EXISTS school_affiliate_standings (
  id TEXT PRIMARY KEY,
  school_name TEXT NOT NULL,
  period TEXT NOT NULL CHECK(period IN ('monthly', 'yearly', 'all_time')),
  period_value TEXT,
  total_affiliates INTEGER DEFAULT 0,
  total_referrals INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  total_earnings REAL DEFAULT 0,
  rank INTEGER,
  prize_won TEXT,
  prize_claimed INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(school_name, period, period_value)
);

CREATE INDEX IF NOT EXISTS idx_school_standings_period ON school_affiliate_standings(period, period_value);
CREATE INDEX IF NOT EXISTS idx_school_standings_rank ON school_affiliate_standings(rank);

-- Seasonal campaigns
CREATE TABLE IF NOT EXISTS affiliate_campaigns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  campaign_type TEXT CHECK(campaign_type IN ('back_to_school', 'exam_season', 'holiday', 'special')),
  commission_multiplier REAL DEFAULT 1.0,
  bonus_xp_multiplier REAL DEFAULT 1.0,
  bonus_per_referral REAL DEFAULT 0,
  min_referrals_for_bonus INTEGER DEFAULT 0,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  banner_image TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_affiliate_campaigns_active ON affiliate_campaigns(is_active);
CREATE INDEX IF NOT EXISTS idx_affiliate_campaigns_dates ON affiliate_campaigns(start_date, end_date);

-- =============================================
-- USER TABLE ALTERATIONS
-- =============================================

-- Add subscription and affiliate fields to users table
ALTER TABLE users ADD COLUMN trial_started_at TEXT;
ALTER TABLE users ADD COLUMN trial_expires_at TEXT;
ALTER TABLE users ADD COLUMN referred_by TEXT;
ALTER TABLE users ADD COLUMN is_affiliate INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN affiliate_xp INTEGER DEFAULT 0;

-- =============================================
-- SEED DATA
-- =============================================

-- Insert affiliate tiers
INSERT OR IGNORE INTO affiliate_tiers (id, name, title, min_referrals, max_referrals, commission_rate, badge_icon, badge_color, xp_bonus, perks) VALUES
('tier_scout', 'scout', 'Scout', 0, 5, 0.25, '🔰', '#10B981', 0, '["Basic referral tracking", "Monthly payouts"]'),
('tier_champion', 'champion', 'Champion', 6, 15, 0.30, '⚔️', '#3B82F6', 500, '["Priority support", "Weekly payouts", "Exclusive challenges"]'),
('tier_ambassador', 'ambassador', 'Ambassador', 16, 30, 0.40, '🛡️', '#8B5CF6', 1500, '["Featured on leaderboard", "Early campaign access", "Custom referral page"]'),
('tier_legend', 'legend', 'Legend', 31, 50, 0.50, '👑', '#F59E0B', 3000, '["VIP support", "Instant payouts", "Bonus multipliers"]'),
('tier_elite', 'elite', 'Brilla Elite', 51, NULL, 0.50, '💎', '#EC4899', 5000, '["All Legend perks", "Revenue share bonuses", "Exclusive events", "Merchandise"]');

-- Insert affiliate achievements
INSERT OR IGNORE INTO affiliate_achievements (id, name, description, icon, requirement_type, requirement_value, xp_reward, cash_bonus) VALUES
('ach_first_blood', 'First Blood', 'Get your first referral signup', '🎯', 'referrals', 1, 100, 5),
('ach_recruiter', 'Recruiter', 'Refer 5 users to Brilla', '👥', 'referrals', 5, 250, 10),
('ach_influencer', 'Influencer', 'Get 10 referrals to convert', '⭐', 'conversions', 10, 500, 25),
('ach_money_maker', 'Money Maker', 'Earn 100 GHS in commissions', '💰', 'earnings', 100, 300, 0),
('ach_top_10', 'Top 10', 'Reach the top 10 affiliate leaderboard', '🏆', 'rank', 10, 1000, 50),
('ach_champion_rank', 'Champion Rank', 'Reach Champion affiliate tier', '⚔️', 'tier', 2, 500, 0),
('ach_legend_rank', 'Legendary', 'Reach Legend affiliate tier', '👑', 'tier', 4, 2000, 100),
('ach_elite_club', 'Elite Club', 'Join the exclusive Brilla Elite', '💎', 'tier', 5, 5000, 250),
('ach_streak_week', 'Weekly Warrior', 'Get referrals 7 days in a row', '🔥', 'streak', 7, 350, 15),
('ach_school_champion', 'School Champion', 'Be top affiliate from your school', '🏫', 'school_rank', 1, 750, 30);

-- Insert default affiliate challenges
INSERT OR IGNORE INTO affiliate_challenges (id, name, description, challenge_type, requirement_type, requirement_value, xp_reward, cash_bonus, is_active) VALUES
('chal_daily_share', 'Daily Share', 'Share your referral link today', 'daily', 'shares', 1, 25, 0, 1),
('chal_daily_click', 'Traffic Driver', 'Get 5 clicks on your link today', 'daily', 'clicks', 5, 50, 0, 1),
('chal_weekly_signup', 'Weekly Recruiter', 'Get 2 signups this week', 'weekly', 'referrals', 2, 200, 5, 1),
('chal_weekly_convert', 'Closer', 'Get 1 referral to subscribe this week', 'weekly', 'conversions', 1, 500, 10, 1),
('chal_monthly_5', 'Monthly 5', 'Refer 5 users this month', 'monthly', 'referrals', 5, 750, 20, 1),
('chal_monthly_10', 'Monthly Master', 'Refer 10 users this month', 'monthly', 'referrals', 10, 1500, 50, 1),
('chal_first_referral', 'Getting Started', 'Get your first referral', 'milestone', 'referrals', 1, 100, 5, 1),
('chal_first_convert', 'First Convert', 'Get your first conversion', 'milestone', 'conversions', 1, 250, 10, 1),
('chal_reach_champion', 'Reach Champion', 'Advance to Champion tier', 'milestone', 'tier', 2, 500, 25, 1),
('chal_reach_ambassador', 'Become Ambassador', 'Advance to Ambassador tier', 'milestone', 'tier', 3, 1000, 50, 1);

-- Update subscription_tiers with new pricing
DELETE FROM subscription_tiers;

INSERT INTO subscription_tiers (id, name, description, price_monthly, price_yearly, features, ai_grading_quota, user_type, is_active) VALUES
('tier_free', 'Free', 'Basic access to practice questions', 0, 0, '["unlimited_questions", "model_answers", "basic_analytics", "community_access"]', 0, 'student', 1),
('tier_student_monthly', 'Student Monthly', 'Full access for students - monthly billing', 50, NULL, '["unlimited_questions", "ai_grading", "detailed_feedback", "progress_tracking", "past_papers", "advanced_analytics", "priority_support"]', 50, 'student', 1),
('tier_student_yearly', 'Student Yearly', 'Full access for students - yearly billing (save 20%)', NULL, 480, '["unlimited_questions", "ai_grading", "detailed_feedback", "progress_tracking", "past_papers", "advanced_analytics", "priority_support", "yearly_bonus_content"]', -1, 'student', 1),
('tier_teacher_monthly', 'Teacher Monthly', 'Full access for teachers - monthly billing', 75, NULL, '["unlimited_questions", "ai_grading", "detailed_feedback", "class_management", "assessment_builder", "student_analytics", "bulk_grading", "priority_support"]', -1, 'teacher', 1),
('tier_teacher_yearly', 'Teacher Yearly', 'Full access for teachers - yearly billing (save 20%)', NULL, 720, '["unlimited_questions", "ai_grading", "detailed_feedback", "class_management", "assessment_builder", "student_analytics", "bulk_grading", "priority_support", "yearly_bonus_content"]', -1, 'teacher', 1);
