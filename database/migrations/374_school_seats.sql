-- Migration 374: school_seats — one row per (school, student) seat grant
-- (spec decisions 2 + 6). prior_tier_id/prior_expires_at snapshot the
-- student's individual entitlement at redemption so the lapse/revoke path can
-- restore it exactly ("keep the better of snapshot vs current" is resolved in
-- code by comparing expiry timestamps). The partial unique index enforces at
-- most one ACTIVE seat per (school, user) — re-redeem is a no-op and
-- revoked/expired rows keep the audit trail.

CREATE TABLE IF NOT EXISTS school_seats (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    granted_at TEXT NOT NULL DEFAULT (datetime('now')),
    source_payment_ref TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
    prior_tier_id TEXT,
    prior_expires_at TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_school_seats_one_active
    ON school_seats(school_id, user_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_school_seats_school_status ON school_seats(school_id, status);
CREATE INDEX IF NOT EXISTS idx_school_seats_user_status ON school_seats(user_id, status);
