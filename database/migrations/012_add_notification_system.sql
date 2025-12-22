-- Migration: Add Notification System
-- Created: 2024-12-21

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('achievement', 'streak', 'xp', 'challenge', 'content', 'system', 'reminder', 'social')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    icon TEXT,
    link TEXT,
    metadata TEXT, -- JSON for additional data
    is_read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    read_at TEXT
);

-- User streak history (for streak popup)
CREATE TABLE IF NOT EXISTS streak_history (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    activity_count INTEGER DEFAULT 1,
    xp_earned INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, date)
);

-- XP transactions (for XP popup history)
CREATE TABLE IF NOT EXISTS xp_transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('quiz', 'practice', 'streak', 'achievement', 'challenge', 'daily_bonus', 'library', 'essay', 'other')),
    description TEXT,
    reference_id TEXT, -- ID of related quiz, achievement, etc.
    created_at TEXT DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_streak_history_user ON streak_history(user_id);
CREATE INDEX IF NOT EXISTS idx_streak_history_date ON streak_history(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_user ON xp_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_created ON xp_transactions(user_id, created_at DESC);

-- Add longest_streak column to users if not exists
-- Note: SQLite doesn't support ADD COLUMN IF NOT EXISTS, so we handle this in code
