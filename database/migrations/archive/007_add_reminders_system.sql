-- Study Reminders System Migration

-- User reminder preferences
CREATE TABLE IF NOT EXISTS reminder_settings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    enabled INTEGER DEFAULT 1,
    daily_goal_reminder INTEGER DEFAULT 1,
    streak_reminder INTEGER DEFAULT 1,
    quest_reminder INTEGER DEFAULT 1,
    study_time TEXT DEFAULT '18:00',
    timezone TEXT DEFAULT 'Africa/Accra',
    days_of_week TEXT DEFAULT '1,2,3,4,5,6,0',
    push_enabled INTEGER DEFAULT 0,
    email_enabled INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id)
);

-- Scheduled reminders log
CREATE TABLE IF NOT EXISTS reminder_log (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reminder_type TEXT NOT NULL CHECK (reminder_type IN ('daily_goal', 'streak_warning', 'quest_expiring', 'inactivity', 'custom')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    sent_at TEXT DEFAULT (datetime('now')),
    clicked INTEGER DEFAULT 0,
    clicked_at TEXT
);

-- Push notification subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    last_used TEXT,
    UNIQUE(user_id, endpoint)
);

-- Friend system tables
CREATE TABLE IF NOT EXISTS friendships (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
    created_at TEXT DEFAULT (datetime('now')),
    accepted_at TEXT,
    UNIQUE(user_id, friend_id)
);

-- Friend challenges
CREATE TABLE IF NOT EXISTS friend_challenges (
    id TEXT PRIMARY KEY,
    challenger_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    challenged_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    challenge_type TEXT NOT NULL CHECK (challenge_type IN ('quiz_battle', 'xp_race', 'streak_challenge', 'topic_mastery')),
    subject_id TEXT REFERENCES subjects(id),
    topic_id TEXT,
    target_value INTEGER,
    duration_hours INTEGER DEFAULT 24,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'active', 'completed', 'expired')),
    challenger_progress INTEGER DEFAULT 0,
    challenged_progress INTEGER DEFAULT 0,
    winner_id TEXT REFERENCES users(id),
    xp_wager INTEGER DEFAULT 50,
    created_at TEXT DEFAULT (datetime('now')),
    started_at TEXT,
    ends_at TEXT,
    completed_at TEXT
);

-- XP Multiplier Events
CREATE TABLE IF NOT EXISTS xp_events (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    multiplier REAL NOT NULL DEFAULT 2.0,
    event_type TEXT NOT NULL CHECK (event_type IN ('global', 'subject', 'topic', 'house', 'personal')),
    subject_id TEXT REFERENCES subjects(id),
    house_id TEXT,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Study Groups
CREATE TABLE IF NOT EXISTS study_groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT 'users',
    color TEXT DEFAULT '#3B82F6',
    owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id TEXT REFERENCES subjects(id),
    is_public INTEGER DEFAULT 1,
    max_members INTEGER DEFAULT 20,
    weekly_goal_xp INTEGER DEFAULT 1000,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Study Group Members
CREATE TABLE IF NOT EXISTS study_group_members (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    weekly_xp_contribution INTEGER DEFAULT 0,
    joined_at TEXT DEFAULT (datetime('now')),
    last_active TEXT,
    UNIQUE(group_id, user_id)
);

-- Study Group Messages
CREATE TABLE IF NOT EXISTS study_group_messages (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'achievement', 'milestone', 'challenge')),
    created_at TEXT DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reminder_settings_user ON reminder_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_user ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend ON friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friend_challenges_challenger ON friend_challenges(challenger_id);
CREATE INDEX IF NOT EXISTS idx_friend_challenges_challenged ON friend_challenges(challenged_id);
CREATE INDEX IF NOT EXISTS idx_xp_events_active ON xp_events(is_active, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_study_groups_owner ON study_groups(owner_id);
CREATE INDEX IF NOT EXISTS idx_study_group_members_group ON study_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_study_group_members_user ON study_group_members(user_id);
