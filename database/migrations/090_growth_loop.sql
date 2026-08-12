-- 090_growth_loop.sql — growth loop: points ledger, race cycles, schools, code requests
CREATE TABLE IF NOT EXISTS schools (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS race_cycles (
    id TEXT PRIMARY KEY,
    scope TEXT NOT NULL CHECK (scope IN ('platform', 'school')),
    school_id TEXT REFERENCES schools(id),
    target_points INTEGER NOT NULL,
    starts_at TEXT NOT NULL,
    ends_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'crowned', 'closed')),
    winner_user_id TEXT REFERENCES users(id),
    target_hit_at TEXT,
    crowned_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS race_crossings (
    cycle_id TEXT NOT NULL REFERENCES race_cycles(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    crossed_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (cycle_id, user_id)
);

CREATE TABLE IF NOT EXISTS points_ledger (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    source TEXT NOT NULL CHECK (source IN (
        'question_correct', 'battle_win', 'streak_day', 'quest_claim',
        'tutor_session', 'essay_graded', 'referral_signup',
        'referral_paid_conversion', 'house_contribution'
    )),
    source_ref TEXT,
    cycle_id TEXT REFERENCES race_cycles(id),
    is_demo_data INTEGER DEFAULT 0,
    expires_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS referral_code_requests (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    contact TEXT NOT NULL,
    school_name TEXT,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'rejected')),
    issued_code TEXT,
    fulfilled_by TEXT REFERENCES users(id),
    fulfilled_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

ALTER TABLE users ADD COLUMN school_id TEXT REFERENCES schools(id);
ALTER TABLE house_points ADD COLUMN is_demo_data INTEGER DEFAULT 0;
ALTER TABLE house_points ADD COLUMN expires_at TEXT;

CREATE INDEX IF NOT EXISTS idx_points_ledger_user_day ON points_ledger(user_id, source, created_at);
CREATE INDEX IF NOT EXISTS idx_points_ledger_cycle ON points_ledger(cycle_id);
CREATE INDEX IF NOT EXISTS idx_race_cycles_status ON race_cycles(status, scope);
CREATE INDEX IF NOT EXISTS idx_referral_code_requests_status ON referral_code_requests(status);
