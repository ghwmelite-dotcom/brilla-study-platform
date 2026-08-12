-- Rate limiting table for auth endpoints
CREATE TABLE IF NOT EXISTS rate_limits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    identifier TEXT NOT NULL,           -- IP address or email
    endpoint TEXT NOT NULL,             -- e.g., 'login', 'register', 'forgot-password'
    request_count INTEGER DEFAULT 1,
    window_start TEXT NOT NULL,         -- ISO timestamp of window start
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup
ON rate_limits(identifier, endpoint, window_start);

-- Index for cleanup of old records
CREATE INDEX IF NOT EXISTS idx_rate_limits_window
ON rate_limits(window_start);
