-- Migration 092: allow role='parent' on users (prod CHECK only had student/teacher/admin).
-- Parent self-registration AND admin parent creation both 500'd on the CHECK.
-- SQLite can't ALTER a CHECK, so the table is rebuilt (same pattern as 091).
-- FK enforcement is disabled for the rebuild so the rename doesn't rewrite
-- the many child tables that reference users(id), and re-enabled after.

PRAGMA foreign_keys = OFF;

CREATE TABLE users_new (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin', 'parent')),
    house TEXT,
    year_group INTEGER,
    xp_points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    streak_days INTEGER DEFAULT 0,
    last_activity_date TEXT,
    avatar_url TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
    email_verified INTEGER DEFAULT 0,
    verification_token TEXT,
    verification_token_expires_at TEXT,
    password_reset_token TEXT,
    password_reset_expires_at TEXT,
    is_active INTEGER DEFAULT 1,
    last_login_at TEXT,
    created_by TEXT REFERENCES users(id),
    approved_by TEXT REFERENCES users(id),
    approved_at TEXT,
    rejection_reason TEXT,
    school_name TEXT,
    school_level TEXT CHECK (school_level IN ('jhs', 'shs')),
    teacher_license_number TEXT,
    subjects_taught TEXT,
    years_experience TEXT,
    qualifications TEXT,
    streak_protections INTEGER DEFAULT 0,
    streak_protection_used_at TEXT,
    streak_freeze_active INTEGER DEFAULT 0,
    streak_last_activity TEXT,
    ai_grading_credits INTEGER DEFAULT 10,
    longest_streak INTEGER DEFAULT 0,
    is_demo INTEGER DEFAULT 0,
    trial_started_at TEXT,
    trial_expires_at TEXT,
    referred_by TEXT,
    is_affiliate INTEGER DEFAULT 0,
    affiliate_xp INTEGER DEFAULT 0,
    rejected_by TEXT,
    rejected_at TEXT,
    selected_tier_id TEXT REFERENCES subscription_tiers(id),
    subscription_tier_id TEXT,
    subscription_expires_at TEXT,
    primary_exam_type_id TEXT REFERENCES exam_types(id),
    school_id TEXT REFERENCES schools(id)
);

INSERT INTO users_new SELECT * FROM users;

DROP TABLE users;

ALTER TABLE users_new RENAME TO users;

-- Recreate the secondary indexes (autoindexes from UNIQUE/PK come back with the table)
CREATE INDEX idx_users_verification_token ON users(verification_token);
CREATE INDEX idx_users_password_reset_token ON users(password_reset_token);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_is_demo ON users(is_demo);
CREATE INDEX idx_users_selected_tier ON users(selected_tier_id);

PRAGMA foreign_keys = ON;
