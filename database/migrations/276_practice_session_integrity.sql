-- Migration 276: fail-closed, idempotent practice-session persistence.
-- Existing sessions remain readable; all new writes must supply a per-user
-- client request ID and link the exact authenticated question attempts used to
-- derive the persisted summary.

ALTER TABLE practice_sessions ADD COLUMN client_request_id TEXT;
ALTER TABLE practice_sessions ADD COLUMN request_fingerprint TEXT;

CREATE UNIQUE INDEX idx_practice_sessions_user_client_request
ON practice_sessions(user_id, client_request_id)
WHERE client_request_id IS NOT NULL;

CREATE TABLE practice_session_attempts (
  session_id TEXT NOT NULL REFERENCES practice_sessions(id) ON DELETE CASCADE,
  attempt_id TEXT NOT NULL PRIMARY KEY REFERENCES question_attempts(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(session_id, attempt_id)
);

CREATE INDEX idx_practice_session_attempts_session
ON practice_session_attempts(session_id);
