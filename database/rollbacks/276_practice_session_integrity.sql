-- Rollback 276. Run only after the Worker no longer reads these fields/table.
DROP INDEX IF EXISTS idx_practice_session_attempts_session;
DROP TABLE IF EXISTS practice_session_attempts;
DROP INDEX IF EXISTS idx_practice_sessions_user_client_request;
ALTER TABLE practice_sessions DROP COLUMN request_fingerprint;
ALTER TABLE practice_sessions DROP COLUMN client_request_id;
