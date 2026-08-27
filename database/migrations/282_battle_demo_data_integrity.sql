-- Migration 282: align battle persistence with demo-data isolation writes and cleanup.
-- Existing rows are real data unless explicitly flagged, so additive columns default safely to 0/NULL.

ALTER TABLE battles ADD COLUMN is_demo_data INTEGER NOT NULL DEFAULT 0 CHECK (is_demo_data IN (0, 1));
ALTER TABLE battles ADD COLUMN expires_at TEXT;

ALTER TABLE battle_answers ADD COLUMN is_demo_data INTEGER NOT NULL DEFAULT 0 CHECK (is_demo_data IN (0, 1));
ALTER TABLE battle_answers ADD COLUMN expires_at TEXT;

CREATE INDEX idx_battles_demo
ON battles(is_demo_data, expires_at);

CREATE INDEX idx_battle_answers_demo
ON battle_answers(is_demo_data, expires_at);
