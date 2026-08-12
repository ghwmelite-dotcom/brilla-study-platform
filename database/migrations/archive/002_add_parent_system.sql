-- Migration: Add Parent Monitoring System
-- Description: Adds tables for parent-student relationships, notifications, and preferences
-- Date: 2025-01-01

-- =============================================
-- PARENT SYSTEM TABLES
-- =============================================

-- 1. Parent-Student Relationships
-- Links parents/guardians to students via invite codes
CREATE TABLE IF NOT EXISTS parent_student_links (
    id TEXT PRIMARY KEY,
    parent_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invite_code TEXT UNIQUE,
    invite_code_expires_at TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'revoked', 'expired')),
    relationship_type TEXT DEFAULT 'parent' CHECK (relationship_type IN ('parent', 'guardian')),
    student_opted_out INTEGER DEFAULT 0,
    opted_out_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    verified_at TEXT,
    UNIQUE(parent_id, student_id)
);

-- 2. Parent Notifications
-- Stores notifications sent to parents about their wards
CREATE TABLE IF NOT EXISTS parent_notifications (
    id TEXT PRIMARY KEY,
    parent_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN (
        'achievement_unlocked',
        'streak_milestone',
        'topic_mastered',
        'low_performance',
        'weekly_summary',
        'link_request',
        'student_opted_out',
        'link_confirmed'
    )),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data TEXT, -- JSON for additional context
    is_read INTEGER DEFAULT 0,
    email_sent INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

-- 3. Parent Notification Preferences
-- Customizable alert settings for each parent
CREATE TABLE IF NOT EXISTS parent_notification_preferences (
    id TEXT PRIMARY KEY,
    parent_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_alerts INTEGER DEFAULT 1,
    streak_alerts INTEGER DEFAULT 1,
    low_performance_alerts INTEGER DEFAULT 1,
    weekly_summary INTEGER DEFAULT 1,
    email_notifications INTEGER DEFAULT 1,
    low_performance_threshold INTEGER DEFAULT 40, -- percentage below which to alert
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(parent_id)
);

-- 4. Parent Activity Log (for audit trail)
-- Tracks parent access to student data
CREATE TABLE IF NOT EXISTS parent_activity_log (
    id TEXT PRIMARY KEY,
    parent_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN (
        'view_progress',
        'view_activity',
        'view_topics',
        'view_achievements',
        'link_student',
        'unlink_student'
    )),
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Parent-Student Links indexes
CREATE INDEX IF NOT EXISTS idx_parent_links_parent ON parent_student_links(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_links_student ON parent_student_links(student_id);
CREATE INDEX IF NOT EXISTS idx_parent_links_code ON parent_student_links(invite_code);
CREATE INDEX IF NOT EXISTS idx_parent_links_status ON parent_student_links(status);
CREATE INDEX IF NOT EXISTS idx_parent_links_active ON parent_student_links(status, student_opted_out);

-- Parent Notifications indexes
CREATE INDEX IF NOT EXISTS idx_parent_notifications_parent ON parent_notifications(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_notifications_student ON parent_notifications(student_id);
CREATE INDEX IF NOT EXISTS idx_parent_notifications_unread ON parent_notifications(parent_id, is_read);
CREATE INDEX IF NOT EXISTS idx_parent_notifications_type ON parent_notifications(type);
CREATE INDEX IF NOT EXISTS idx_parent_notifications_created ON parent_notifications(created_at DESC);

-- Parent Activity Log indexes
CREATE INDEX IF NOT EXISTS idx_parent_activity_parent ON parent_activity_log(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_activity_student ON parent_activity_log(student_id);
CREATE INDEX IF NOT EXISTS idx_parent_activity_created ON parent_activity_log(created_at DESC);

-- =============================================
-- SEED DEFAULT NOTIFICATION PREFERENCES
-- =============================================
-- Note: This will be inserted when a parent account is created
