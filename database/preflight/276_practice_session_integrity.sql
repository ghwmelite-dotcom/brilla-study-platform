-- Post-migration, pre-deploy integrity gate for migration 276.
-- Every SELECT must return zero. Any row blocks the Worker deployment.

-- Existing non-null request IDs must be unique per authenticated owner.
SELECT user_id, client_request_id, COUNT(*) AS duplicate_count
FROM practice_sessions
WHERE client_request_id IS NOT NULL
GROUP BY user_id, client_request_id
HAVING COUNT(*) > 1;

-- Every link must resolve to a session and attempt owned by the same user.
SELECT psa.session_id, psa.attempt_id
FROM practice_session_attempts psa
LEFT JOIN practice_sessions ps ON ps.id = psa.session_id
LEFT JOIN question_attempts qa ON qa.id = psa.attempt_id
WHERE ps.id IS NULL OR qa.id IS NULL OR ps.user_id <> qa.user_id;

-- Linked attempts must match any explicit session subject/topic boundary.
SELECT psa.session_id, psa.attempt_id
FROM practice_session_attempts psa
JOIN practice_sessions ps ON ps.id = psa.session_id
JOIN question_attempts qa ON qa.id = psa.attempt_id
JOIN questions q ON q.id = qa.question_id
WHERE (ps.subject_id IS NOT NULL AND ps.subject_id <> q.subject_id)
   OR (ps.topic_id IS NOT NULL AND (q.topic_id IS NULL OR ps.topic_id <> q.topic_id));

SELECT * FROM pragma_foreign_key_check;
