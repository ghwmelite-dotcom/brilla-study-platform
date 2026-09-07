-- Migration 368: dedicated bot user for practice battles.
-- POST /api/battles with vsBot creates battles against this opponent;
-- battles.opponent_id REFERENCES users(id), so the bot needs a real row.
-- Idempotent; the route also carries an INSERT OR IGNORE guard.

INSERT OR IGNORE INTO users (id, email, password_hash, name, role, status, email_verified, is_active)
VALUES ('bot_battler', 'bot@brillaprep.org', 'BOT_ACCOUNT_NO_LOGIN', 'Brilla Bot', 'student', 'approved', 1, 1);
