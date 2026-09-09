-- Migration 633: allow role='school_admin' on users (phase 2 of the school
-- subscription spec: docs/plans/2026-09-08-school-subscriptions.md).
-- SQLite can't ALTER a CHECK, so the table is rebuilt (pattern: 092). The
-- column list below is the FULL current users shape: schema.sql's canonical
-- definition (= 092's rebuild shape) + session_version (097) + battle_rating
-- (370). Columns are listed explicitly in the copy-back INSERT so the rebuild
-- is exact on both the fresh-bootstrap chain (schema.sql column order) and
-- prod (092's rebuild order + later ALTER-appended columns), where SELECT *
-- ordering would differ.
--
-- Two deviations from 092, both forced by the fresh-bootstrap verifier, which
-- replays migrations one transaction per file with PRAGMA foreign_keys = ON:
--   1. PRAGMA defer_foreign_keys = ON — unlike foreign_keys=OFF, this pragma
--      IS honored inside a transaction: FK checks are deferred to COMMIT, by
--      which time the rebuilt users table holds every original row (same
--      ids) and all references resolve. Seeded rows (e.g.
--      chat_rooms.created_by -> admin_1, battles -> bot_battler) otherwise
--      make the DROP's implicit DELETE fail immediately. On prod (D1), where
--      migrations run with FK enforcement off, both pragmas are harmless.
--   2. No ALTER ... RENAME: the data is staged in users_legacy_633, users is
--      dropped, then recreated under the SAME name. Rename-based rebuilds
--      rewrite child-table REFERENCES clauses to the scratch name in modern
--      SQLite and fail the deferred FK check at COMMIT; a same-name recreate
--      leaves every child reference resolving to the rebuilt table.

PRAGMA foreign_keys = OFF;
PRAGMA defer_foreign_keys = ON;

CREATE TABLE users_legacy_633 AS SELECT * FROM users;

DROP TABLE users;

CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin', 'parent', 'school_admin')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),

    -- Email verification
    email_verified INTEGER DEFAULT 0,
    verification_token TEXT,
    verification_token_expires_at TEXT,
    password_reset_token TEXT,
    password_reset_expires_at TEXT,

    -- Account status
    is_active INTEGER DEFAULT 1,
    last_login_at TEXT,
    session_version INTEGER NOT NULL DEFAULT 0,
    created_by TEXT REFERENCES users(id),
    approved_by TEXT REFERENCES users(id),
    approved_at TEXT,
    rejection_reason TEXT,

    -- Student fields
    house TEXT,
    year_group INTEGER,
    school_level TEXT CHECK (school_level IN ('jhs', 'shs')),
    school_name TEXT,

    -- Teacher fields
    teacher_license_number TEXT,
    subjects_taught TEXT,
    years_experience TEXT,
    qualifications TEXT,

    -- Progress & gamification
    xp_points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    streak_days INTEGER DEFAULT 0,
    last_activity_date TEXT,
    avatar_url TEXT,

    -- Subscription
    primary_exam_type_id TEXT REFERENCES exam_types(id),
    subscription_tier_id TEXT REFERENCES subscription_tiers(id) DEFAULT 'tier_free',
    subscription_expires_at TEXT,
    ai_grading_credits INTEGER DEFAULT 0,

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    streak_protections INTEGER DEFAULT 0,
    streak_protection_used_at TEXT,
    streak_freeze_active INTEGER DEFAULT 0,
    streak_last_activity TEXT,
    is_demo INTEGER DEFAULT 0,
    trial_started_at TEXT,
    trial_expires_at TEXT,
    referred_by TEXT,
    is_affiliate INTEGER DEFAULT 0,
    affiliate_xp INTEGER DEFAULT 0,
    selected_tier_id TEXT REFERENCES subscription_tiers(id),
    school_id TEXT REFERENCES schools(id),
    longest_streak INTEGER DEFAULT 0,
    rejected_by TEXT,
    rejected_at TEXT,
    battle_rating INTEGER NOT NULL DEFAULT 1200
);

INSERT INTO users (
    id, email, password_hash, name, role, status,
    email_verified, verification_token, verification_token_expires_at,
    password_reset_token, password_reset_expires_at,
    is_active, last_login_at, session_version,
    created_by, approved_by, approved_at, rejection_reason,
    house, year_group, school_level, school_name,
    teacher_license_number, subjects_taught, years_experience, qualifications,
    xp_points, level, streak_days, last_activity_date, avatar_url,
    primary_exam_type_id, subscription_tier_id, subscription_expires_at, ai_grading_credits,
    created_at, updated_at,
    streak_protections, streak_protection_used_at, streak_freeze_active, streak_last_activity,
    is_demo, trial_started_at, trial_expires_at,
    referred_by, is_affiliate, affiliate_xp,
    selected_tier_id, school_id,
    longest_streak, rejected_by, rejected_at, battle_rating
)
SELECT
    id, email, password_hash, name, role, status,
    email_verified, verification_token, verification_token_expires_at,
    password_reset_token, password_reset_expires_at,
    is_active, last_login_at, session_version,
    created_by, approved_by, approved_at, rejection_reason,
    house, year_group, school_level, school_name,
    teacher_license_number, subjects_taught, years_experience, qualifications,
    xp_points, level, streak_days, last_activity_date, avatar_url,
    primary_exam_type_id, subscription_tier_id, subscription_expires_at, ai_grading_credits,
    created_at, updated_at,
    streak_protections, streak_protection_used_at, streak_freeze_active, streak_last_activity,
    is_demo, trial_started_at, trial_expires_at,
    referred_by, is_affiliate, affiliate_xp,
    selected_tier_id, school_id,
    longest_streak, rejected_by, rejected_at, battle_rating
FROM users_legacy_633;

DROP TABLE users_legacy_633;

-- Recreate the secondary indexes (autoindexes from UNIQUE/PK come back with the table)
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_demo ON users(is_demo);
CREATE INDEX IF NOT EXISTS idx_users_selected_tier ON users(selected_tier_id);

PRAGMA foreign_keys = ON;
