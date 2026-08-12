-- Normalize legacy 'YYYY-MM-DD HH:MM:SS' timestamps to ISO-8601 ('YYYY-MM-DDTHH:MM:SS.SSSZ')
-- so lexicographic comparison against bound ISO parameters is correct.
-- strftime() parses both formats; rows already in ISO (contain 'T') are untouched.
-- Idempotent: the NOT LIKE '%T%' guards make a second application a no-op.
-- (Renumbered 030 -> 088: 030_* was already taken by question-seed migrations.)

UPDATE user_trials
SET expires_at = strftime('%Y-%m-%dT%H:%M:%fZ', expires_at)
WHERE expires_at IS NOT NULL AND expires_at NOT LIKE '%T%';

UPDATE user_trials
SET started_at = strftime('%Y-%m-%dT%H:%M:%fZ', started_at)
WHERE started_at IS NOT NULL AND started_at NOT LIKE '%T%';

UPDATE users
SET trial_expires_at = strftime('%Y-%m-%dT%H:%M:%fZ', trial_expires_at)
WHERE trial_expires_at IS NOT NULL AND trial_expires_at NOT LIKE '%T%';

UPDATE users
SET trial_started_at = strftime('%Y-%m-%dT%H:%M:%fZ', trial_started_at)
WHERE trial_started_at IS NOT NULL AND trial_started_at NOT LIKE '%T%';

UPDATE users
SET subscription_expires_at = strftime('%Y-%m-%dT%H:%M:%fZ', subscription_expires_at)
WHERE subscription_expires_at IS NOT NULL AND subscription_expires_at NOT LIKE '%T%';

UPDATE oauth_states
SET expires_at = strftime('%Y-%m-%dT%H:%M:%fZ', expires_at)
WHERE expires_at IS NOT NULL AND expires_at NOT LIKE '%T%';

UPDATE engagement_nudges
SET expires_at = strftime('%Y-%m-%dT%H:%M:%fZ', expires_at)
WHERE expires_at IS NOT NULL AND expires_at NOT LIKE '%T%';

UPDATE comeback_challenges
SET expires_at = strftime('%Y-%m-%dT%H:%M:%fZ', expires_at)
WHERE expires_at IS NOT NULL AND expires_at NOT LIKE '%T%';
