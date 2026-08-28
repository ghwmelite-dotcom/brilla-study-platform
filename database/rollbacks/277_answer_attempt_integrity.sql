-- Rollback 277. Counter compaction is intentionally preserved because the
-- original duplicate row split cannot be reconstructed truthfully.
DROP INDEX IF EXISTS idx_question_attempts_user_client_request;
DROP INDEX IF EXISTS idx_rate_limits_bucket_unique;
ALTER TABLE question_attempts DROP COLUMN request_fingerprint;
ALTER TABLE question_attempts DROP COLUMN client_request_id;
