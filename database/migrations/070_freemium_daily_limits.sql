-- Migration: Freemium Daily Limits
-- Adds daily usage tracking for free/demo users with 10 questions/day limit

-- Daily usage tracking table
CREATE TABLE IF NOT EXISTS daily_usage (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    usage_date TEXT NOT NULL,  -- YYYY-MM-DD format (UTC)
    question_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, usage_date)
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_daily_usage_user_date ON daily_usage(user_id, usage_date);
CREATE INDEX IF NOT EXISTS idx_daily_usage_date ON daily_usage(usage_date);

-- Add daily_question_limit to subscription_tiers if not exists
-- -1 means unlimited, positive number is the daily limit
ALTER TABLE subscription_tiers ADD COLUMN daily_question_limit INTEGER DEFAULT -1;

-- Set limits: Free tier gets 10/day, all paid tiers get unlimited (-1)
UPDATE subscription_tiers SET daily_question_limit = 10 WHERE slug = 'free';
UPDATE subscription_tiers SET daily_question_limit = -1 WHERE slug != 'free';
