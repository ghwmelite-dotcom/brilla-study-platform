-- Migration: Add Reminder Settings
-- Description: Table for user reminder preferences and scheduling

-- Reminder Settings table
CREATE TABLE IF NOT EXISTS reminder_settings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    enabled INTEGER DEFAULT 1,
    daily_goal_reminder INTEGER DEFAULT 1,
    streak_reminder INTEGER DEFAULT 1,
    quest_reminder INTEGER DEFAULT 1,
    study_time TEXT DEFAULT '18:00',
    timezone TEXT DEFAULT 'UTC',
    days_of_week TEXT DEFAULT '0,1,2,3,4,5,6',
    push_enabled INTEGER DEFAULT 0,
    email_enabled INTEGER DEFAULT 0,
    last_reminder_sent_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Reminder History table (for tracking sent reminders)
CREATE TABLE IF NOT EXISTS reminder_history (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    reminder_type TEXT NOT NULL CHECK (reminder_type IN ('daily_goal', 'streak', 'quest', 'custom')),
    channel TEXT NOT NULL CHECK (channel IN ('push', 'email', 'in_app')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    sent_at TEXT NOT NULL DEFAULT (datetime('now')),
    opened_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reminder_settings_user ON reminder_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_reminder_settings_enabled ON reminder_settings(enabled);
CREATE INDEX IF NOT EXISTS idx_reminder_history_user ON reminder_history(user_id);
CREATE INDEX IF NOT EXISTS idx_reminder_history_type ON reminder_history(reminder_type);
CREATE INDEX IF NOT EXISTS idx_reminder_history_sent ON reminder_history(sent_at);
