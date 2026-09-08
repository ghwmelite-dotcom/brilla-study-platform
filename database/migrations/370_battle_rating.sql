-- Migration 370: ranked matchmaking for 1v1 battles (spec 1.4b).
-- ELO battle_rating on users (K=32, everyone starts at 1200), an is_ranked
-- flag on battles, a single-slot-per-user ranked queue (re-queuing replaces
-- the row via INSERT OR REPLACE), and a per-battle rating-delta ledger whose
-- PRIMARY KEY makes applyRankedDelta idempotent (INSERT OR IGNORE claim).
-- Existing users/battles are unrated/unranked, so additive columns default
-- safely to 1200/0.

ALTER TABLE users ADD COLUMN battle_rating INTEGER NOT NULL DEFAULT 1200;
ALTER TABLE battles ADD COLUMN is_ranked INTEGER NOT NULL DEFAULT 0 CHECK (is_ranked IN (0, 1));

CREATE TABLE IF NOT EXISTS ranked_queue (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL,
    queued_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS battle_rating_updates (
    battle_id TEXT PRIMARY KEY REFERENCES battles(id) ON DELETE CASCADE,
    challenger_delta INTEGER NOT NULL,
    opponent_delta INTEGER NOT NULL,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_battles_ranked ON battles(is_ranked, status);
