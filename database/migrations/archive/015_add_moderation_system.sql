-- Migration: Add Moderation System
-- Description: Tables for content moderation, reports, and user actions

-- Chat reports table
CREATE TABLE IF NOT EXISTS chat_reports (
    id TEXT PRIMARY KEY,
    reporter_id TEXT NOT NULL,
    reported_user_id TEXT NOT NULL,
    message_id TEXT,
    room_id TEXT,
    reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'hate_speech', 'threats', 'other')),
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
    reviewed_by TEXT,
    review_notes TEXT,
    resolution TEXT CHECK (resolution IN ('warning', 'mute', 'ban', 'message_deleted', 'no_action', NULL)),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    reviewed_at TEXT,
    FOREIGN KEY (reporter_id) REFERENCES users(id),
    FOREIGN KEY (reported_user_id) REFERENCES users(id),
    FOREIGN KEY (message_id) REFERENCES chat_messages(id),
    FOREIGN KEY (room_id) REFERENCES chat_rooms(id),
    FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

-- Chat moderation actions table
CREATE TABLE IF NOT EXISTS chat_moderation_actions (
    id TEXT PRIMARY KEY,
    room_id TEXT,
    user_id TEXT NOT NULL,
    moderator_id TEXT NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('warn', 'mute', 'unmute', 'kick', 'ban', 'unban')),
    reason TEXT,
    duration INTEGER,
    expires_at TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (room_id) REFERENCES chat_rooms(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (moderator_id) REFERENCES users(id)
);

-- Chat filtered words table
CREATE TABLE IF NOT EXISTS chat_filtered_words (
    id TEXT PRIMARY KEY,
    word TEXT NOT NULL UNIQUE,
    severity TEXT DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high')),
    replacement TEXT,
    is_active INTEGER DEFAULT 1,
    added_by TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (added_by) REFERENCES users(id)
);

-- Moderation audit log table
CREATE TABLE IF NOT EXISTS moderation_audit_log (
    id TEXT PRIMARY KEY,
    action_type TEXT NOT NULL,
    target_type TEXT NOT NULL CHECK (target_type IN ('user', 'message', 'room', 'report', 'filter')),
    target_id TEXT NOT NULL,
    moderator_id TEXT NOT NULL,
    details TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (moderator_id) REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_reports_reporter ON chat_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_chat_reports_reported ON chat_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_chat_reports_status ON chat_reports(status);
CREATE INDEX IF NOT EXISTS idx_chat_reports_created ON chat_reports(created_at);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_user ON chat_moderation_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_room ON chat_moderation_actions(room_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_type ON chat_moderation_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_active ON chat_moderation_actions(is_active);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_expires ON chat_moderation_actions(expires_at);
CREATE INDEX IF NOT EXISTS idx_filtered_words_active ON chat_filtered_words(is_active);
CREATE INDEX IF NOT EXISTS idx_audit_log_moderator ON moderation_audit_log(moderator_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_target ON moderation_audit_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON moderation_audit_log(created_at);
