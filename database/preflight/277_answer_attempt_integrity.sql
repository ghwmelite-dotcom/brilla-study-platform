-- Post-migration, pre-deploy integrity gate for migration 277.
-- Every SELECT must return zero. Any row blocks the Worker deployment.

SELECT identifier, endpoint, window_start, COUNT(*) AS duplicate_count
FROM rate_limits
GROUP BY identifier, endpoint, window_start
HAVING COUNT(*) > 1;

SELECT id, request_count
FROM rate_limits
WHERE request_count IS NULL OR request_count < 1;

SELECT user_id, client_request_id, COUNT(*) AS duplicate_count
FROM question_attempts
WHERE client_request_id IS NOT NULL
GROUP BY user_id, client_request_id
HAVING COUNT(*) > 1;

SELECT id
FROM question_attempts
WHERE (client_request_id IS NULL) <> (request_fingerprint IS NULL);

SELECT * FROM pragma_foreign_key_check;
