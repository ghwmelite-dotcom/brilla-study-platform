-- Rollback 362. Run only after the Worker no longer serves /api/lab.
-- Both tables are new in 362, so the rollback is total and safe.
DROP INDEX IF EXISTS idx_lab_session_events_session;
DROP TABLE IF EXISTS lab_session_events;
DROP INDEX IF EXISTS idx_lab_sessions_user_experiment;
DROP INDEX IF EXISTS idx_lab_sessions_user_created;
DROP TABLE IF EXISTS lab_sessions;
