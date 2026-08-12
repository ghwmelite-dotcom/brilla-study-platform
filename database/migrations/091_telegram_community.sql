-- 091_telegram_community.sql — Telegram community notifications + connect points

CREATE TABLE IF NOT EXISTS telegram_links (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    chat_id TEXT NOT NULL UNIQUE,
    username TEXT,
    linked_at TEXT NOT NULL DEFAULT (datetime('now')),
    stale INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS telegram_link_tokens (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL,
    used_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS school_channels (
    school_id TEXT PRIMARY KEY REFERENCES schools(id) ON DELETE CASCADE,
    channel_id TEXT NOT NULL,
    channel_name TEXT,
    broken INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS race_alert_state (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cycle_id TEXT NOT NULL REFERENCES race_cycles(id) ON DELETE CASCADE,
    last_rank INTEGER,
    last_score INTEGER,
    alerted_flags INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, cycle_id)
);

-- Channel-post dedup (one post per event even if cron reruns).
ALTER TABLE race_cycles ADD COLUMN start_announced_at TEXT;
ALTER TABLE race_cycles ADD COLUMN winner_announced_at TEXT;

-- points_ledger CHECK rebuild: SQLite cannot ALTER a CHECK constraint.
-- IMPORTANT: DROP TABLE also drops idx_points_ledger_user_day and
-- idx_points_ledger_cycle (both in real SQLite AND in the canonical
-- generator's drop simulation) — they MUST be recreated below.
CREATE TABLE points_ledger_new (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    source TEXT NOT NULL CHECK (source IN (
        'question_correct', 'battle_win', 'streak_day', 'quest_claim',
        'tutor_session', 'essay_graded', 'referral_signup',
        'referral_paid_conversion', 'house_contribution',
        'notification_subscribe'
    )),
    source_ref TEXT,
    cycle_id TEXT REFERENCES race_cycles(id),
    is_demo_data INTEGER DEFAULT 0,
    expires_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

INSERT INTO points_ledger_new (id, user_id, points, source, source_ref, cycle_id, is_demo_data, expires_at, created_at)
    SELECT id, user_id, points, source, source_ref, cycle_id, is_demo_data, expires_at, created_at FROM points_ledger;

DROP TABLE points_ledger;
ALTER TABLE points_ledger_new RENAME TO points_ledger;

CREATE INDEX IF NOT EXISTS idx_points_ledger_user_day ON points_ledger(user_id, source, created_at);
CREATE INDEX IF NOT EXISTS idx_points_ledger_cycle ON points_ledger(cycle_id);
CREATE INDEX IF NOT EXISTS idx_telegram_link_tokens_user ON telegram_link_tokens(user_id, used_at);
CREATE INDEX IF NOT EXISTS idx_race_alert_state_cycle ON race_alert_state(cycle_id);
