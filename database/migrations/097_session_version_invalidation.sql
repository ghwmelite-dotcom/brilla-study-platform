-- Invalidate outstanding JWTs after any credential change without storing
-- bearer tokens server-side. Legacy tokens map to version 0 until the first
-- credential rotation for that account.
ALTER TABLE users ADD COLUMN session_version INTEGER NOT NULL DEFAULT 0;
