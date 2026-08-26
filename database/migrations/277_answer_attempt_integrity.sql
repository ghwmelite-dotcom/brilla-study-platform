-- Migration 277: atomic write limiting and idempotent question attempts.
-- Compaction is rerunnable and preserves the total count before installing the
-- uniqueness required by the single-statement rate-limit upsert.

ALTER TABLE question_attempts ADD COLUMN client_request_id TEXT;
ALTER TABLE question_attempts ADD COLUMN request_fingerprint TEXT;

UPDATE rate_limits AS survivor
SET
  request_count = (
    SELECT SUM(
      CASE
        WHEN candidate.request_count IS NULL OR candidate.request_count < 1 THEN 1
        ELSE candidate.request_count
      END
    )
    FROM rate_limits AS candidate
    WHERE candidate.identifier = survivor.identifier
      AND candidate.endpoint = survivor.endpoint
      AND candidate.window_start = survivor.window_start
  ),
  created_at = COALESCE((
    SELECT MIN(candidate.created_at)
    FROM rate_limits AS candidate
    WHERE candidate.identifier = survivor.identifier
      AND candidate.endpoint = survivor.endpoint
      AND candidate.window_start = survivor.window_start
  ), survivor.created_at),
  updated_at = COALESCE((
    SELECT MAX(candidate.updated_at)
    FROM rate_limits AS candidate
    WHERE candidate.identifier = survivor.identifier
      AND candidate.endpoint = survivor.endpoint
      AND candidate.window_start = survivor.window_start
  ), datetime('now'))
WHERE survivor.id = (
  SELECT MIN(candidate.id)
  FROM rate_limits AS candidate
  WHERE candidate.identifier = survivor.identifier
    AND candidate.endpoint = survivor.endpoint
    AND candidate.window_start = survivor.window_start
);

DELETE FROM rate_limits AS duplicate
WHERE duplicate.id <> (
  SELECT MIN(survivor.id)
  FROM rate_limits AS survivor
  WHERE survivor.identifier = duplicate.identifier
    AND survivor.endpoint = duplicate.endpoint
    AND survivor.window_start = duplicate.window_start
);

CREATE UNIQUE INDEX idx_rate_limits_bucket_unique
ON rate_limits(identifier, endpoint, window_start);

CREATE UNIQUE INDEX idx_question_attempts_user_client_request
ON question_attempts(user_id, client_request_id)
WHERE client_request_id IS NOT NULL;
