-- Engagement Features Migration
-- Adds tables for Quick Play, Learning Path, Activity Feed, Events, Team Battles, Cosmetics, Rewards, and Anti-Churn

-- =============================================
-- QUICK PLAY MINI-GAMES
-- =============================================

-- Daily challenges (one per day)
CREATE TABLE IF NOT EXISTS daily_challenges (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL UNIQUE,
    subject_id TEXT REFERENCES subjects(id),
    difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    question_ids TEXT NOT NULL, -- JSON array of question IDs
    xp_reward INTEGER DEFAULT 50,
    time_limit INTEGER DEFAULT 120, -- seconds
    created_at TEXT DEFAULT (datetime('now'))
);

-- Quick play game sessions
CREATE TABLE IF NOT EXISTS quick_play_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_type TEXT NOT NULL CHECK (game_type IN ('speed_blitz', 'brain_teaser', 'subject_dash', 'daily_challenge')),
    subject_id TEXT REFERENCES subjects(id),
    questions_answered INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    score INTEGER DEFAULT 0,
    time_taken INTEGER, -- milliseconds
    xp_earned INTEGER DEFAULT 0,
    multiplier_applied REAL DEFAULT 1.0,
    started_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Brain teasers (harder single questions)
CREATE TABLE IF NOT EXISTS brain_teasers (
    id TEXT PRIMARY KEY,
    question_id TEXT NOT NULL REFERENCES questions(id),
    hint_1 TEXT,
    hint_2 TEXT,
    hint_3 TEXT,
    base_xp INTEGER DEFAULT 50,
    hint_penalty INTEGER DEFAULT 10, -- XP deducted per hint used
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_quick_play_user ON quick_play_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_quick_play_date ON quick_play_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_daily_challenges_date ON daily_challenges(date);

-- =============================================
-- SUBJECT STREAKS (extends streak system)
-- =============================================

CREATE TABLE IF NOT EXISTS subject_streaks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES subjects(id),
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date TEXT,
    total_days_studied INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, subject_id)
);

-- Streak rescue tokens
CREATE TABLE IF NOT EXISTS streak_rescues (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rescue_type TEXT NOT NULL CHECK (rescue_type IN ('main', 'subject')),
    subject_id TEXT REFERENCES subjects(id),
    streak_before INTEGER NOT NULL,
    streak_after INTEGER NOT NULL,
    rescue_date TEXT DEFAULT (datetime('now')),
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_subject_streaks_user ON subject_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_subject_streaks_subject ON subject_streaks(subject_id);

-- =============================================
-- LEARNING PATH & RECOMMENDATIONS
-- =============================================

CREATE TABLE IF NOT EXISTS learning_recommendations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic_id TEXT NOT NULL REFERENCES topics(id),
    subject_id TEXT NOT NULL REFERENCES subjects(id),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    reason TEXT NOT NULL, -- 'weak_area', 'not_started', 'review_needed', 'exam_frequent'
    mastery_score REAL DEFAULT 0,
    estimated_time INTEGER DEFAULT 30, -- minutes
    is_completed INTEGER DEFAULT 0,
    dismissed INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS exam_readiness (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exam_type TEXT NOT NULL CHECK (exam_type IN ('wassce', 'bece', 'nsmq')),
    subject_id TEXT REFERENCES subjects(id),
    readiness_score REAL DEFAULT 0, -- 0-100
    topics_mastered INTEGER DEFAULT 0,
    topics_total INTEGER DEFAULT 0,
    weak_topics TEXT, -- JSON array of topic IDs
    strong_topics TEXT, -- JSON array of topic IDs
    last_calculated TEXT DEFAULT (datetime('now')),
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, exam_type, subject_id)
);

CREATE TABLE IF NOT EXISTS study_plans (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_type TEXT DEFAULT 'weekly' CHECK (plan_type IN ('daily', 'weekly', 'custom')),
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    items TEXT NOT NULL, -- JSON array of study plan items
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_learning_rec_user ON learning_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_readiness_user ON exam_readiness(user_id);
CREATE INDEX IF NOT EXISTS idx_study_plans_user ON study_plans(user_id);

-- =============================================
-- ACTIVITY FEED
-- =============================================

CREATE TABLE IF NOT EXISTS activity_feed (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK (activity_type IN (
        'achievement', 'level_up', 'streak', 'battle_win', 'high_score',
        'friend_added', 'quest_complete', 'event_join', 'cosmetic_unlock'
    )),
    title TEXT NOT NULL,
    description TEXT,
    metadata TEXT, -- JSON with additional data
    is_public INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_activity_feed_user ON activity_feed(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_type ON activity_feed(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created ON activity_feed(created_at DESC);

-- =============================================
-- SEASONAL EVENTS & TOURNAMENTS
-- =============================================

CREATE TABLE IF NOT EXISTS seasonal_events (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    theme TEXT NOT NULL CHECK (theme IN ('wassce_prep', 'house_cup', 'subject_week', 'holiday', 'special')),
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    xp_multiplier REAL DEFAULT 1.0,
    accent_color TEXT DEFAULT '#8B5CF6',
    banner_image TEXT,
    rewards TEXT, -- JSON array of rewards
    quests TEXT, -- JSON array of event quests
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user_event_progress (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id TEXT NOT NULL REFERENCES seasonal_events(id) ON DELETE CASCADE,
    quests_completed TEXT DEFAULT '[]', -- JSON array of completed quest IDs
    xp_earned INTEGER DEFAULT 0,
    rewards_claimed TEXT DEFAULT '[]', -- JSON array of claimed reward IDs
    joined_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, event_id)
);

CREATE TABLE IF NOT EXISTS tournaments (
    id TEXT PRIMARY KEY,
    event_id TEXT REFERENCES seasonal_events(id),
    name TEXT NOT NULL,
    description TEXT,
    tournament_type TEXT NOT NULL CHECK (tournament_type IN ('bracket', 'leaderboard', 'team')),
    subject_id TEXT REFERENCES subjects(id),
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    max_participants INTEGER,
    entry_fee INTEGER DEFAULT 0, -- XP cost to enter
    prizes TEXT NOT NULL, -- JSON array of prizes
    rules TEXT, -- JSON rules config
    status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tournament_participants (
    id TEXT PRIMARY KEY,
    tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER DEFAULT 0,
    rank INTEGER,
    matches_played INTEGER DEFAULT 0,
    matches_won INTEGER DEFAULT 0,
    joined_at TEXT DEFAULT (datetime('now')),
    UNIQUE(tournament_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_events_active ON seasonal_events(is_active, start_date);
CREATE INDEX IF NOT EXISTS idx_user_event_progress ON user_event_progress(user_id, event_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status, start_date);

-- =============================================
-- TEAM BATTLES (3v3)
-- =============================================

CREATE TABLE IF NOT EXISTS team_battles (
    id TEXT PRIMARY KEY,
    subject_id TEXT REFERENCES subjects(id),
    topic_id TEXT REFERENCES topics(id),
    status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'ready', 'active', 'completed', 'cancelled')),
    team1_score INTEGER DEFAULT 0,
    team2_score INTEGER DEFAULT 0,
    current_question INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 10,
    question_ids TEXT, -- JSON array
    time_per_question INTEGER DEFAULT 30, -- seconds
    winner_team INTEGER, -- 1 or 2
    xp_reward INTEGER DEFAULT 200,
    started_at TEXT,
    completed_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS team_battle_members (
    id TEXT PRIMARY KEY,
    battle_id TEXT NOT NULL REFERENCES team_battles(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team_number INTEGER NOT NULL CHECK (team_number IN (1, 2)),
    is_captain INTEGER DEFAULT 0,
    score INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    joined_at TEXT DEFAULT (datetime('now')),
    UNIQUE(battle_id, user_id)
);

CREATE TABLE IF NOT EXISTS team_battle_invites (
    id TEXT PRIMARY KEY,
    battle_id TEXT NOT NULL REFERENCES team_battles(id) ON DELETE CASCADE,
    inviter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invitee_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team_number INTEGER NOT NULL CHECK (team_number IN (1, 2)),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    created_at TEXT DEFAULT (datetime('now')),
    expires_at TEXT,
    UNIQUE(battle_id, invitee_id)
);

CREATE INDEX IF NOT EXISTS idx_team_battles_status ON team_battles(status);
CREATE INDEX IF NOT EXISTS idx_team_battle_members ON team_battle_members(battle_id, team_number);
CREATE INDEX IF NOT EXISTS idx_team_battle_invites_user ON team_battle_invites(invitee_id, status);

-- =============================================
-- COSMETICS & CUSTOMIZATION
-- =============================================

CREATE TABLE IF NOT EXISTS cosmetics (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    cosmetic_type TEXT NOT NULL CHECK (cosmetic_type IN (
        'avatar_frame', 'title', 'profile_theme', 'badge_style', 'name_effect'
    )),
    rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    unlock_method TEXT NOT NULL CHECK (unlock_method IN ('level', 'achievement', 'purchase', 'event', 'streak', 'default')),
    unlock_requirement TEXT, -- JSON with unlock details
    preview_data TEXT, -- JSON with visual data (colors, animations, etc.)
    xp_cost INTEGER DEFAULT 0,
    is_premium INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user_cosmetics (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cosmetic_id TEXT NOT NULL REFERENCES cosmetics(id) ON DELETE CASCADE,
    is_equipped INTEGER DEFAULT 0,
    equipped_slot TEXT, -- for multiple equip slots
    acquired_at TEXT DEFAULT (datetime('now')),
    acquired_method TEXT, -- how it was obtained
    UNIQUE(user_id, cosmetic_id)
);

CREATE TABLE IF NOT EXISTS user_cosmetic_settings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    equipped_frame TEXT REFERENCES cosmetics(id),
    equipped_title TEXT REFERENCES cosmetics(id),
    equipped_theme TEXT REFERENCES cosmetics(id),
    equipped_badge_style TEXT REFERENCES cosmetics(id),
    equipped_name_effect TEXT REFERENCES cosmetics(id),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_cosmetics_type ON cosmetics(cosmetic_type, rarity);
CREATE INDEX IF NOT EXISTS idx_user_cosmetics ON user_cosmetics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_cosmetics_equipped ON user_cosmetics(user_id, is_equipped);

-- =============================================
-- VARIABLE REWARDS
-- =============================================

-- Daily multipliers
CREATE TABLE IF NOT EXISTS daily_multipliers (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    multiplier REAL NOT NULL,
    applies_to TEXT DEFAULT 'all' CHECK (applies_to IN ('all', 'subject', 'quiz_type', 'quick_play')),
    target_id TEXT, -- subject_id or quiz_type if not 'all'
    date TEXT NOT NULL,
    used INTEGER DEFAULT 0,
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, date)
);

-- Mystery chests
CREATE TABLE IF NOT EXISTS mystery_chests (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chest_type TEXT NOT NULL CHECK (chest_type IN ('bronze', 'silver', 'gold', 'diamond')),
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'opened', 'expired')),
    source TEXT NOT NULL, -- 'achievement', 'streak', 'level_up', 'event'
    source_id TEXT, -- ID of achievement/event that triggered this
    reward_xp INTEGER,
    reward_cosmetic_id TEXT REFERENCES cosmetics(id),
    reward_protection INTEGER DEFAULT 0,
    opened_at TEXT,
    expires_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Lucky wheel spins
CREATE TABLE IF NOT EXISTS lucky_wheel_spins (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    spin_date TEXT NOT NULL,
    reward_type TEXT NOT NULL CHECK (reward_type IN ('xp', 'multiplier', 'cosmetic', 'protection', 'chest')),
    reward_value TEXT NOT NULL, -- JSON with reward details
    wheel_segment INTEGER, -- which segment it landed on
    created_at TEXT DEFAULT (datetime('now'))
);

-- User reward stats
CREATE TABLE IF NOT EXISTS user_reward_stats (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    total_chests_opened INTEGER DEFAULT 0,
    total_wheel_spins INTEGER DEFAULT 0,
    last_wheel_spin TEXT,
    weekly_wheel_spins INTEGER DEFAULT 0,
    week_start TEXT,
    surprise_challenges_completed INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_daily_multipliers_user ON daily_multipliers(user_id, date);
CREATE INDEX IF NOT EXISTS idx_mystery_chests_user ON mystery_chests(user_id, status);
CREATE INDEX IF NOT EXISTS idx_lucky_wheel_user ON lucky_wheel_spins(user_id, spin_date);

-- =============================================
-- ENGAGEMENT & ANTI-CHURN
-- =============================================

-- Comeback challenges for inactive users
CREATE TABLE IF NOT EXISTS comeback_challenges (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    xp_reward INTEGER DEFAULT 500,
    tasks TEXT NOT NULL, -- JSON array of tasks
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'expired')),
    days_inactive INTEGER NOT NULL,
    accepted_at TEXT,
    completed_at TEXT,
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS comeback_task_progress (
    id TEXT PRIMARY KEY,
    challenge_id TEXT NOT NULL REFERENCES comeback_challenges(id) ON DELETE CASCADE,
    task_id TEXT NOT NULL,
    progress INTEGER DEFAULT 0,
    target INTEGER NOT NULL,
    completed INTEGER DEFAULT 0,
    completed_at TEXT,
    UNIQUE(challenge_id, task_id)
);

-- Engagement nudges
CREATE TABLE IF NOT EXISTS engagement_nudges (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nudge_type TEXT NOT NULL CHECK (nudge_type IN (
        'streak_warning', 'friend_activity', 'missed_goal', 'comeback',
        'achievement_close', 'friend_challenge', 'event_reminder'
    )),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_label TEXT,
    action_link TEXT,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    dismissed INTEGER DEFAULT 0,
    dismissed_at TEXT,
    expires_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- User engagement metrics
CREATE TABLE IF NOT EXISTS user_engagement_metrics (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    days_since_last_activity INTEGER DEFAULT 0,
    avg_session_length INTEGER DEFAULT 0, -- seconds
    avg_questions_per_day REAL DEFAULT 0,
    streak_at_risk INTEGER DEFAULT 0,
    engagement_score REAL DEFAULT 100, -- 0-100
    risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    last_nudge_sent TEXT,
    comeback_modal_shown INTEGER DEFAULT 0,
    last_calculated TEXT DEFAULT (datetime('now')),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_comeback_challenges_user ON comeback_challenges(user_id, status);
CREATE INDEX IF NOT EXISTS idx_engagement_nudges_user ON engagement_nudges(user_id, dismissed);
CREATE INDEX IF NOT EXISTS idx_engagement_metrics_risk ON user_engagement_metrics(risk_level);

-- =============================================
-- SEED DEFAULT COSMETICS
-- =============================================

-- Default avatar frames
INSERT OR IGNORE INTO cosmetics (id, name, description, cosmetic_type, rarity, unlock_method, preview_data) VALUES
    ('frame_default', 'Classic Frame', 'The default profile frame', 'avatar_frame', 'common', 'default', '{"borderColor": "#6B7280", "borderWidth": 2}'),
    ('frame_bronze', 'Bronze Frame', 'A simple bronze border', 'avatar_frame', 'common', 'level', '{"borderColor": "#CD7F32", "borderWidth": 3}'),
    ('frame_silver', 'Silver Frame', 'An elegant silver border', 'avatar_frame', 'rare', 'level', '{"borderColor": "#C0C0C0", "borderWidth": 3}'),
    ('frame_gold', 'Golden Frame', 'A prestigious gold border', 'avatar_frame', 'epic', 'level', '{"borderColor": "#FFD700", "borderWidth": 4}'),
    ('frame_diamond', 'Diamond Frame', 'The ultimate prestige frame', 'avatar_frame', 'legendary', 'achievement', '{"borderColor": "#B9F2FF", "borderWidth": 4, "animated": true}'),
    ('frame_flame', 'Flame Frame', 'Burning with dedication', 'avatar_frame', 'epic', 'streak', '{"borderColor": "#FF6B35", "borderWidth": 4, "effect": "flame"}'),
    ('frame_scholar', 'Scholar Frame', 'For the dedicated learner', 'avatar_frame', 'rare', 'achievement', '{"borderColor": "#8B5CF6", "borderWidth": 3}');

-- Default titles
INSERT OR IGNORE INTO cosmetics (id, name, description, cosmetic_type, rarity, unlock_method, unlock_requirement) VALUES
    ('title_student', 'Student', 'A dedicated learner', 'title', 'common', 'default', NULL),
    ('title_rising_star', 'Rising Star', 'Showing great promise', 'title', 'common', 'level', '{"level": 10}'),
    ('title_scholar', 'Scholar', 'A serious academic', 'title', 'rare', 'level', '{"level": 25}'),
    ('title_master', 'Master', 'Achieved mastery', 'title', 'epic', 'level', '{"level": 50}'),
    ('title_legend', 'Legend', 'A true academic legend', 'title', 'legendary', 'level', '{"level": 100}'),
    ('title_streak_warrior', 'Streak Warrior', 'Never breaks the chain', 'title', 'epic', 'streak', '{"streak": 30}'),
    ('title_perfectionist', 'Perfectionist', '100 correct in a row', 'title', 'legendary', 'achievement', '{"achievement": "perfect_100"}'),
    ('title_speed_demon', 'Speed Demon', 'Lightning fast answers', 'title', 'epic', 'achievement', '{"achievement": "speed_demon"}');

-- Default profile themes
INSERT OR IGNORE INTO cosmetics (id, name, description, cosmetic_type, rarity, unlock_method, preview_data) VALUES
    ('theme_default', 'Classic Blue', 'The default theme', 'profile_theme', 'common', 'default', '{"primary": "#3B82F6", "secondary": "#1E40AF"}'),
    ('theme_emerald', 'Emerald', 'Fresh and green', 'profile_theme', 'common', 'level', '{"primary": "#10B981", "secondary": "#047857"}'),
    ('theme_purple', 'Royal Purple', 'Majestic and bold', 'profile_theme', 'rare', 'level', '{"primary": "#8B5CF6", "secondary": "#6D28D9"}'),
    ('theme_sunset', 'Sunset', 'Warm and vibrant', 'profile_theme', 'rare', 'level', '{"primary": "#F59E0B", "secondary": "#DC2626"}'),
    ('theme_midnight', 'Midnight', 'Dark and mysterious', 'profile_theme', 'epic', 'achievement', '{"primary": "#1F2937", "secondary": "#111827"}'),
    ('theme_rainbow', 'Rainbow', 'All the colors', 'profile_theme', 'legendary', 'event', '{"gradient": true, "animated": true}');

-- =============================================
-- SEED SAMPLE EVENT
-- =============================================

INSERT OR IGNORE INTO seasonal_events (id, name, description, theme, start_date, end_date, xp_multiplier, accent_color, rewards, quests) VALUES
    ('event_wassce_2026', 'WASSCE Countdown 2026', 'Prepare for the upcoming WASSCE exams with special challenges and bonus XP!', 'wassce_prep', '2026-01-01', '2026-03-31', 1.5, '#8B5CF6',
    '[{"id": "badge_wassce_warrior", "type": "cosmetic", "name": "WASSCE Warrior Badge"}, {"id": "xp_5000", "type": "xp", "amount": 5000}]',
    '[{"id": "quest_100_questions", "title": "Answer 100 WASSCE Questions", "target": 100, "xpReward": 500}, {"id": "quest_all_subjects", "title": "Practice All Core Subjects", "target": 6, "xpReward": 300}]');
