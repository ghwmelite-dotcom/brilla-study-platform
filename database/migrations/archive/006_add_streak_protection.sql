-- Streak Protection System Migration

-- Add streak protection columns to users table
ALTER TABLE users ADD COLUMN streak_protections INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN streak_protection_used_at TEXT;
ALTER TABLE users ADD COLUMN streak_freeze_active INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN streak_last_activity TEXT;

-- Streak protection history
CREATE TABLE IF NOT EXISTS streak_protection_log (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('earned', 'used', 'purchased', 'expired')),
    amount INTEGER NOT NULL DEFAULT 1,
    reason TEXT,
    streak_before INTEGER,
    streak_after INTEGER,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Milestone rewards for streaks
CREATE TABLE IF NOT EXISTS streak_milestones (
    id TEXT PRIMARY KEY,
    days INTEGER NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    xp_reward INTEGER NOT NULL DEFAULT 0,
    protection_reward INTEGER DEFAULT 0,
    badge_id TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- User milestone progress
CREATE TABLE IF NOT EXISTS user_streak_milestones (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    milestone_id TEXT NOT NULL REFERENCES streak_milestones(id),
    claimed_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, milestone_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_streak_protection_log_user ON streak_protection_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_streak_milestones_user ON user_streak_milestones(user_id);

-- Insert default streak milestones
INSERT OR IGNORE INTO streak_milestones (id, days, name, description, xp_reward, protection_reward) VALUES
    ('streak_3', 3, '3-Day Streak', 'Study for 3 consecutive days', 100, 0),
    ('streak_7', 7, 'Week Warrior', 'Study for a full week', 250, 1),
    ('streak_14', 14, 'Two Week Titan', 'Maintain a 2-week streak', 500, 1),
    ('streak_30', 30, 'Monthly Master', 'Study every day for a month', 1500, 2),
    ('streak_60', 60, 'Double Month Champion', 'Maintain a 60-day streak', 3000, 3),
    ('streak_90', 90, 'Quarterly Genius', 'Study for 90 consecutive days', 5000, 5),
    ('streak_180', 180, 'Half-Year Hero', 'Maintain a 180-day streak', 10000, 10),
    ('streak_365', 365, 'Year of Excellence', 'Study every day for a year', 25000, 20);
