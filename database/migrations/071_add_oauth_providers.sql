-- OAuth Providers Migration
-- Adds support for Google OAuth authentication

-- OAuth linked accounts table
CREATE TABLE IF NOT EXISTS user_oauth_providers (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('google')),
    provider_user_id TEXT NOT NULL,
    provider_email TEXT,
    provider_name TEXT,
    provider_avatar_url TEXT,
    linked_at TEXT DEFAULT (datetime('now')),
    last_used_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(provider, provider_user_id),
    UNIQUE(user_id, provider)
);

-- Index for fast provider lookup
CREATE INDEX IF NOT EXISTS idx_oauth_provider_lookup ON user_oauth_providers(provider, provider_user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_user_id ON user_oauth_providers(user_id);

-- OAuth state table for CSRF protection during OAuth flow
CREATE TABLE IF NOT EXISTS oauth_states (
    id TEXT PRIMARY KEY,
    state TEXT UNIQUE NOT NULL,
    code_verifier TEXT NOT NULL,
    intent TEXT CHECK (intent IN ('login', 'register', 'link')),
    user_id TEXT,
    role TEXT,
    registration_data TEXT,
    ip_address TEXT,
    user_agent TEXT,
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Index for state lookup and cleanup
CREATE INDEX IF NOT EXISTS idx_oauth_state ON oauth_states(state);
CREATE INDEX IF NOT EXISTS idx_oauth_state_expires ON oauth_states(expires_at);
