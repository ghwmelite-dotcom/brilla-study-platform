-- Daily Quests System Migration
-- Quest Templates (reusable quest definitions)
CREATE TABLE IF NOT EXISTS quest_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT DEFAULT 'target',
    quest_type TEXT NOT NULL CHECK (quest_type IN ('daily', 'weekly', 'special')),
    requirement_type TEXT NOT NULL CHECK (requirement_type IN (
        'answer_questions', 'correct_answers', 'complete_topics',
        'earn_xp', 'maintain_streak', 'win_battles', 'perfect_quiz',
        'study_time', 'help_others'
    )),
    requirement_value INTEGER NOT NULL,
    xp_reward INTEGER NOT NULL DEFAULT 50,
    coin_reward INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    subject_id TEXT REFERENCES subjects(id),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- User Quest Progress (tracks individual user's quest progress)
CREATE TABLE IF NOT EXISTS user_quests (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quest_template_id TEXT NOT NULL REFERENCES quest_templates(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0,
    target INTEGER NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired', 'claimed')),
    started_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT,
    claimed_at TEXT,
    expires_at TEXT NOT NULL,
    UNIQUE(user_id, quest_template_id, expires_at)
);

-- User Quest History (for analytics and tracking)
CREATE TABLE IF NOT EXISTS quest_completions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quest_template_id TEXT NOT NULL REFERENCES quest_templates(id),
    xp_earned INTEGER NOT NULL,
    completed_at TEXT DEFAULT (datetime('now')),
    quest_type TEXT NOT NULL
);

-- Weekly Challenges
CREATE TABLE IF NOT EXISTS weekly_challenges (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT DEFAULT 'trophy',
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    requirement_type TEXT NOT NULL,
    requirement_value INTEGER NOT NULL,
    xp_reward INTEGER NOT NULL DEFAULT 500,
    bonus_reward TEXT,
    is_active INTEGER DEFAULT 1,
    subject_id TEXT REFERENCES subjects(id),
    created_at TEXT DEFAULT (datetime('now'))
);

-- User Weekly Challenge Progress
CREATE TABLE IF NOT EXISTS user_weekly_challenges (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    challenge_id TEXT NOT NULL REFERENCES weekly_challenges(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'claimed')),
    completed_at TEXT,
    claimed_at TEXT,
    UNIQUE(user_id, challenge_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_quests_user ON user_quests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quests_status ON user_quests(status);
CREATE INDEX IF NOT EXISTS idx_user_quests_expires ON user_quests(expires_at);
CREATE INDEX IF NOT EXISTS idx_quest_completions_user ON quest_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_weekly_challenges_user ON user_weekly_challenges(user_id);

-- Insert default daily quest templates
INSERT OR IGNORE INTO quest_templates (id, name, description, icon, quest_type, requirement_type, requirement_value, xp_reward, difficulty) VALUES
    ('daily_answer_10', 'Quick Study', 'Answer 10 questions today', 'book-open', 'daily', 'answer_questions', 10, 50, 'easy'),
    ('daily_answer_25', 'Dedicated Learner', 'Answer 25 questions today', 'book-open', 'daily', 'answer_questions', 25, 100, 'medium'),
    ('daily_correct_5', 'Knowledge Seeker', 'Get 5 correct answers', 'check-circle', 'daily', 'correct_answers', 5, 75, 'easy'),
    ('daily_correct_15', 'Sharp Mind', 'Get 15 correct answers', 'check-circle', 'daily', 'correct_answers', 15, 150, 'medium'),
    ('daily_perfect', 'Perfect Score', 'Complete a quiz with 100% accuracy', 'star', 'daily', 'perfect_quiz', 1, 200, 'hard'),
    ('daily_xp_100', 'XP Hunter', 'Earn 100 XP today', 'zap', 'daily', 'earn_xp', 100, 50, 'easy'),
    ('daily_xp_300', 'XP Master', 'Earn 300 XP today', 'zap', 'daily', 'earn_xp', 300, 150, 'hard'),
    ('daily_battle', 'Battle Champion', 'Win a knowledge battle', 'swords', 'daily', 'win_battles', 1, 100, 'medium'),
    ('daily_streak', 'Consistency', 'Maintain your study streak', 'flame', 'daily', 'maintain_streak', 1, 75, 'medium');

-- Insert default weekly quest templates
INSERT OR IGNORE INTO quest_templates (id, name, description, icon, quest_type, requirement_type, requirement_value, xp_reward, difficulty) VALUES
    ('weekly_answer_100', 'Week Warrior', 'Answer 100 questions this week', 'target', 'weekly', 'answer_questions', 100, 500, 'medium'),
    ('weekly_correct_50', 'Knowledge Master', 'Get 50 correct answers this week', 'award', 'weekly', 'correct_answers', 50, 600, 'medium'),
    ('weekly_xp_1000', 'XP Legend', 'Earn 1000 XP this week', 'crown', 'weekly', 'earn_xp', 1000, 500, 'hard'),
    ('weekly_battles_5', 'Battle Legend', 'Win 5 battles this week', 'trophy', 'weekly', 'win_battles', 5, 750, 'hard'),
    ('weekly_streak_7', 'Perfect Week', 'Maintain a 7-day streak', 'flame', 'weekly', 'maintain_streak', 7, 1000, 'hard');
