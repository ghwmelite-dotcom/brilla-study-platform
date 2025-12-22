-- Migration: Add Parent-Counselor Messaging and Report Schedules
-- Description: Tables for parent-counselor communication and automated report scheduling

-- Parent-Counselor Messages table
CREATE TABLE IF NOT EXISTS parent_counselor_messages (
    id TEXT PRIMARY KEY,
    report_id TEXT,
    student_id TEXT,
    parent_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    content TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    read_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (report_id) REFERENCES counselor_reports(id),
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (parent_id) REFERENCES users(id),
    FOREIGN KEY (sender_id) REFERENCES users(id)
);

-- Report Schedules table
CREATE TABLE IF NOT EXISTS report_schedules (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    parent_id TEXT NOT NULL,
    report_type TEXT NOT NULL CHECK (report_type IN ('weekly_summary', 'monthly_progress', 'semester')),
    frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
    next_scheduled_at TEXT NOT NULL,
    last_generated_at TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (parent_id) REFERENCES users(id)
);

-- Report Access Logs table (if not exists)
CREATE TABLE IF NOT EXISTS report_access_logs (
    id TEXT PRIMARY KEY,
    report_id TEXT NOT NULL,
    accessed_by TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('read', 'download', 'share')),
    accessed_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (report_id) REFERENCES counselor_reports(id),
    FOREIGN KEY (accessed_by) REFERENCES users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_parent_messages_parent ON parent_counselor_messages(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_messages_student ON parent_counselor_messages(student_id);
CREATE INDEX IF NOT EXISTS idx_parent_messages_sender ON parent_counselor_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_parent_messages_report ON parent_counselor_messages(report_id);
CREATE INDEX IF NOT EXISTS idx_parent_messages_created ON parent_counselor_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_report_schedules_student ON report_schedules(student_id);
CREATE INDEX IF NOT EXISTS idx_report_schedules_parent ON report_schedules(parent_id);
CREATE INDEX IF NOT EXISTS idx_report_schedules_next ON report_schedules(next_scheduled_at);
CREATE INDEX IF NOT EXISTS idx_report_schedules_active ON report_schedules(is_active);
CREATE INDEX IF NOT EXISTS idx_report_access_logs_report ON report_access_logs(report_id);
CREATE INDEX IF NOT EXISTS idx_report_access_logs_user ON report_access_logs(accessed_by);
