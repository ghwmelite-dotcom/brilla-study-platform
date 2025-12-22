-- Migration: Add Demo Data Isolation (Core)
-- Description: Adds is_demo flag to users and is_demo_data/expires_at columns to core tables
-- Purpose: Isolate demo user data for automatic cleanup after 24 hours

-- =============================================
-- STEP 1: Add is_demo flag to users table
-- =============================================

ALTER TABLE users ADD COLUMN is_demo INTEGER DEFAULT 0;

-- Mark existing demo users based on email pattern
UPDATE users SET is_demo = 1 WHERE email LIKE '%@brillaprep.org';

-- Index for efficient demo user lookups
CREATE INDEX IF NOT EXISTS idx_users_is_demo ON users(is_demo);

-- =============================================
-- STEP 2: Add demo data columns to core tables that definitely exist
-- =============================================

-- User Progress
ALTER TABLE user_progress ADD COLUMN is_demo_data INTEGER DEFAULT 0;
ALTER TABLE user_progress ADD COLUMN expires_at TEXT;
CREATE INDEX IF NOT EXISTS idx_user_progress_demo ON user_progress(is_demo_data, expires_at);

-- Question Attempts
ALTER TABLE question_attempts ADD COLUMN is_demo_data INTEGER DEFAULT 0;
ALTER TABLE question_attempts ADD COLUMN expires_at TEXT;
CREATE INDEX IF NOT EXISTS idx_question_attempts_demo ON question_attempts(is_demo_data, expires_at);

-- Practice Sessions
ALTER TABLE practice_sessions ADD COLUMN is_demo_data INTEGER DEFAULT 0;
ALTER TABLE practice_sessions ADD COLUMN expires_at TEXT;
CREATE INDEX IF NOT EXISTS idx_practice_sessions_demo ON practice_sessions(is_demo_data, expires_at);

-- Leaderboard
ALTER TABLE leaderboard ADD COLUMN is_demo_data INTEGER DEFAULT 0;
ALTER TABLE leaderboard ADD COLUMN expires_at TEXT;
CREATE INDEX IF NOT EXISTS idx_leaderboard_demo ON leaderboard(is_demo_data, expires_at);
