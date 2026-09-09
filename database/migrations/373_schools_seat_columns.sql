-- Migration 373: school seat-package state on schools (spec decision 4).
-- seat_expires_at doubles as the school's package expiry (no separate
-- school_expires_at). seat_code is the ONE invite code per school with
-- seat_code_uses counting redemptions against seat_cap.
-- SQLite cannot ADD COLUMN ... UNIQUE, so the code uniqueness lives in a
-- partial unique index (NULLs = schools without a package stay distinct-free).

ALTER TABLE schools ADD COLUMN seat_tier_id TEXT REFERENCES subscription_tiers(id);
ALTER TABLE schools ADD COLUMN seat_expires_at TEXT;
ALTER TABLE schools ADD COLUMN seat_code TEXT;
ALTER TABLE schools ADD COLUMN seat_code_uses INTEGER NOT NULL DEFAULT 0;
ALTER TABLE schools ADD COLUMN seat_cap INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS idx_schools_seat_code ON schools(seat_code) WHERE seat_code IS NOT NULL;
