-- Migration: 003_add_audit_system.sql
-- Description: Comprehensive audit trail for all user actions
-- Created: 2024

-- ===========================================
-- AUDIT LOG TABLE
-- ===========================================
-- Central audit log for tracking all important system events

CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY,

    -- Who performed the action
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    user_email TEXT,
    user_role TEXT,

    -- What action was performed
    action TEXT NOT NULL,
    action_category TEXT NOT NULL CHECK (action_category IN (
        'auth',           -- Login, logout, password changes
        'user_management', -- Registration, approval, role changes
        'content',        -- Questions, topics, subjects
        'practice',       -- Practice sessions, attempts
        'parent',         -- Parent linking, monitoring
        'admin',          -- Admin actions
        'settings',       -- User/system settings changes
        'api',            -- API access, rate limiting
        'security'        -- Security events, suspicious activity
    )),

    -- What was affected
    target_type TEXT,     -- 'user', 'question', 'topic', 'session', etc.
    target_id TEXT,
    target_details TEXT,  -- Additional context (e.g., user email, question title)

    -- Request context
    ip_address TEXT,
    user_agent TEXT,
    request_path TEXT,
    request_method TEXT,

    -- Outcome
    status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failure', 'warning')),
    error_message TEXT,

    -- Additional data (JSON)
    metadata TEXT,        -- JSON blob for action-specific data

    -- Timestamps
    created_at TEXT DEFAULT (datetime('now'))
);

-- ===========================================
-- SECURITY EVENTS TABLE
-- ===========================================
-- Separate table for security-specific events that need special attention

CREATE TABLE IF NOT EXISTS security_events (
    id TEXT PRIMARY KEY,

    -- Event details
    event_type TEXT NOT NULL CHECK (event_type IN (
        'failed_login',
        'account_locked',
        'password_reset',
        'suspicious_activity',
        'rate_limit_exceeded',
        'unauthorized_access',
        'permission_escalation',
        'data_export',
        'bulk_operation',
        'api_key_usage'
    )),
    severity TEXT DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),

    -- Who/what triggered it
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    user_email TEXT,
    ip_address TEXT,
    user_agent TEXT,

    -- Details
    description TEXT NOT NULL,
    metadata TEXT,        -- JSON for additional context

    -- Resolution
    is_resolved INTEGER DEFAULT 0,
    resolved_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TEXT,
    resolution_notes TEXT,

    -- Timestamps
    created_at TEXT DEFAULT (datetime('now'))
);

-- ===========================================
-- LOGIN ATTEMPTS TABLE
-- ===========================================
-- Track login attempts for rate limiting and security

CREATE TABLE IF NOT EXISTS login_attempts (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    success INTEGER DEFAULT 0,
    failure_reason TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- ===========================================
-- USER SESSIONS TABLE
-- ===========================================
-- Track active user sessions

CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,  -- Hash of JWT for validation
    ip_address TEXT,
    user_agent TEXT,
    device_info TEXT,
    is_active INTEGER DEFAULT 1,
    last_activity_at TEXT DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);

-- ===========================================
-- DATA CHANGE LOG TABLE
-- ===========================================
-- Track changes to important data for compliance

CREATE TABLE IF NOT EXISTS data_change_log (
    id TEXT PRIMARY KEY,

    -- What was changed
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),

    -- Who made the change
    changed_by TEXT REFERENCES users(id) ON DELETE SET NULL,

    -- What changed (for updates)
    old_values TEXT,      -- JSON of previous values
    new_values TEXT,      -- JSON of new values
    changed_fields TEXT,  -- JSON array of field names that changed

    -- Context
    reason TEXT,          -- Optional reason for the change

    -- Timestamp
    created_at TEXT DEFAULT (datetime('now'))
);

-- ===========================================
-- INDEXES
-- ===========================================

-- Audit log indexes
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_category ON audit_log(action_category);
CREATE INDEX IF NOT EXISTS idx_audit_log_target ON audit_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_status ON audit_log(status);
CREATE INDEX IF NOT EXISTS idx_audit_log_ip ON audit_log(ip_address);

-- Security events indexes
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_user ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_unresolved ON security_events(is_resolved, severity);
CREATE INDEX IF NOT EXISTS idx_security_events_created ON security_events(created_at);

-- Login attempts indexes
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created ON login_attempts(created_at);

-- User sessions indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token_hash);

-- Data change log indexes
CREATE INDEX IF NOT EXISTS idx_data_change_table ON data_change_log(table_name);
CREATE INDEX IF NOT EXISTS idx_data_change_record ON data_change_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_data_change_user ON data_change_log(changed_by);
CREATE INDEX IF NOT EXISTS idx_data_change_created ON data_change_log(created_at);

-- ===========================================
-- CLEANUP - Remove old entries (run periodically)
-- ===========================================
-- Note: These would be run as scheduled jobs in production

-- Keep audit logs for 1 year
-- DELETE FROM audit_log WHERE created_at < datetime('now', '-1 year');

-- Keep security events for 2 years
-- DELETE FROM security_events WHERE created_at < datetime('now', '-2 years') AND is_resolved = 1;

-- Keep login attempts for 90 days
-- DELETE FROM login_attempts WHERE created_at < datetime('now', '-90 days');

-- Keep data change logs for 2 years
-- DELETE FROM data_change_log WHERE created_at < datetime('now', '-2 years');
