-- Brilla Study Platform Database Schema
-- D1 SQLite Database
-- Supports: NSMQ, WASSCE, BECE

-- =============================================
-- EXAM SYSTEM TABLES (New for multi-exam support)
-- =============================================

-- Exam types (NSMQ, WASSCE, BECE)
CREATE TABLE IF NOT EXISTS exam_types (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    country TEXT DEFAULT 'Ghana',
    is_active INTEGER DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    icon TEXT,
    color TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Subject categories (for WASSCE groupings: Core, Science, Business, Arts, etc.)
CREATE TABLE IF NOT EXISTS subject_categories (
    id TEXT PRIMARY KEY,
    exam_type_id TEXT NOT NULL REFERENCES exam_types(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    is_core INTEGER DEFAULT 0,
    display_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(exam_type_id, slug)
);

-- Paper types (Paper 1 - Objectives, Paper 2 - Theory, Paper 3 - Practical)
CREATE TABLE IF NOT EXISTS paper_types (
    id TEXT PRIMARY KEY,
    exam_type_id TEXT NOT NULL REFERENCES exam_types(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    question_format TEXT NOT NULL CHECK (question_format IN ('objective', 'essay', 'practical', 'mixed')),
    typical_duration INTEGER,
    total_marks INTEGER,
    display_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(exam_type_id, slug)
);

-- Past papers organized by year
CREATE TABLE IF NOT EXISTS past_papers (
    id TEXT PRIMARY KEY,
    exam_type_id TEXT NOT NULL REFERENCES exam_types(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    paper_type_id TEXT NOT NULL REFERENCES paper_types(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month TEXT,
    series TEXT,
    title TEXT NOT NULL,
    description TEXT,
    total_questions INTEGER DEFAULT 0,
    total_marks INTEGER,
    time_allowed INTEGER,
    instructions TEXT,
    is_complete INTEGER DEFAULT 0,
    is_premium INTEGER DEFAULT 0,
    source_url TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(exam_type_id, subject_id, paper_type_id, year, month)
);

-- Essay questions (extended data for essay-type questions)
CREATE TABLE IF NOT EXISTS essay_questions (
    id TEXT PRIMARY KEY,
    question_id TEXT UNIQUE NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    word_limit_min INTEGER,
    word_limit_max INTEGER,
    requires_introduction INTEGER DEFAULT 1,
    requires_conclusion INTEGER DEFAULT 1,
    marking_scheme TEXT NOT NULL,
    model_answer TEXT,
    marking_rubric TEXT,
    required_points TEXT,
    optional_points TEXT,
    ai_grading_enabled INTEGER DEFAULT 0,
    sample_answer_excellent TEXT,
    sample_answer_good TEXT,
    sample_answer_poor TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Essay submissions and grading
CREATE TABLE IF NOT EXISTS essay_attempts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    paper_attempt_id TEXT REFERENCES paper_attempts(id) ON DELETE SET NULL,
    answer_text TEXT NOT NULL,
    word_count INTEGER,
    time_taken INTEGER,
    grading_type TEXT CHECK (grading_type IN ('ai', 'manual', 'self', 'peer')),
    grading_status TEXT DEFAULT 'pending' CHECK (grading_status IN ('pending', 'grading', 'completed', 'failed')),
    ai_score INTEGER,
    ai_feedback TEXT,
    ai_criteria_scores TEXT,
    ai_graded_at TEXT,
    ai_model_used TEXT,
    ai_confidence REAL,
    manual_score INTEGER,
    manual_feedback TEXT,
    graded_by TEXT REFERENCES users(id),
    manually_graded_at TEXT,
    final_score INTEGER,
    marks_earned REAL,
    is_premium_graded INTEGER DEFAULT 0,
    flagged_for_review INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Paper attempts (timed mock exams)
CREATE TABLE IF NOT EXISTS paper_attempts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    paper_id TEXT NOT NULL REFERENCES past_papers(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'graded', 'abandoned')),
    started_at TEXT DEFAULT (datetime('now')),
    time_allowed INTEGER,
    time_used INTEGER,
    submitted_at TEXT,
    total_score INTEGER,
    max_score INTEGER,
    percentage REAL,
    grade TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Paper attempt answers
CREATE TABLE IF NOT EXISTS paper_attempt_answers (
    id TEXT PRIMARY KEY,
    paper_attempt_id TEXT NOT NULL REFERENCES paper_attempts(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    user_answer TEXT,
    is_correct INTEGER,
    time_taken INTEGER,
    marks_earned INTEGER DEFAULT 0,
    answered_at TEXT DEFAULT (datetime('now')),
    UNIQUE(paper_attempt_id, question_id)
);

-- Structured question parts (for multi-part questions)
CREATE TABLE IF NOT EXISTS structured_question_parts (
    id TEXT PRIMARY KEY,
    question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    part_label TEXT NOT NULL,
    part_text TEXT NOT NULL,
    marks INTEGER NOT NULL DEFAULT 1,
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    answer_type TEXT DEFAULT 'text' CHECK (answer_type IN ('text', 'calculation', 'diagram', 'table', 'graph')),
    display_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

-- User exam preferences
CREATE TABLE IF NOT EXISTS user_exam_preferences (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exam_type_id TEXT NOT NULL REFERENCES exam_types(id) ON DELETE CASCADE,
    is_primary INTEGER DEFAULT 0,
    target_year INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, exam_type_id)
);

-- User subject selections (for WASSCE electives)
CREATE TABLE IF NOT EXISTS user_subject_selections (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exam_type_id TEXT NOT NULL REFERENCES exam_types(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    is_selected INTEGER DEFAULT 1,
    priority INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, exam_type_id, subject_id)
);

-- Subscription tiers
CREATE TABLE IF NOT EXISTS subscription_tiers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    price_monthly REAL DEFAULT 0,
    price_yearly REAL DEFAULT 0,
    currency TEXT DEFAULT 'GHS',
    ai_grading_quota INTEGER DEFAULT 0,
    features TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
);

-- AI grading rate limits
CREATE TABLE IF NOT EXISTS ai_grading_limits (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    period_start TEXT NOT NULL,
    period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),
    usage_count INTEGER DEFAULT 0,
    limit_count INTEGER NOT NULL,
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, period_start, period_type)
);

-- =============================================
-- CORE TABLES
-- =============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin', 'parent')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),

    -- Email verification
    email_verified INTEGER DEFAULT 0,
    verification_token TEXT,
    verification_token_expires_at TEXT,
    password_reset_token TEXT,
    password_reset_expires_at TEXT,

    -- Account status
    is_active INTEGER DEFAULT 1,
    last_login_at TEXT,
    created_by TEXT REFERENCES users(id),
    approved_by TEXT REFERENCES users(id),
    approved_at TEXT,
    rejection_reason TEXT,

    -- Student fields
    house TEXT,
    year_group INTEGER,
    school_level TEXT CHECK (school_level IN ('jhs', 'shs')),
    school_name TEXT,

    -- Teacher fields
    teacher_license_number TEXT,
    subjects_taught TEXT, -- JSON array
    years_experience TEXT,
    qualifications TEXT,

    -- Progress & gamification
    xp_points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    streak_days INTEGER DEFAULT 0,
    last_activity_date TEXT,
    avatar_url TEXT,

    -- Subscription
    primary_exam_type_id TEXT REFERENCES exam_types(id),
    subscription_tier_id TEXT REFERENCES subscription_tiers(id) DEFAULT 'tier_free',
    subscription_expires_at TEXT,
    ai_grading_credits INTEGER DEFAULT 0,

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- User indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Subjects table
CREATE TABLE IF NOT EXISTS subjects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    exam_type_id TEXT REFERENCES exam_types(id),
    category_id TEXT REFERENCES subject_categories(id),
    waec_code TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Topics table (hierarchical with parent_id for subtopics)
CREATE TABLE IF NOT EXISTS topics (
    id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    parent_id TEXT REFERENCES topics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    theory_content TEXT,
    key_formulas TEXT, -- JSON array of formulas
    display_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(subject_id, slug)
);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    exam_type_id TEXT REFERENCES exam_types(id),
    paper_type_id TEXT REFERENCES paper_types(id),
    past_paper_id TEXT REFERENCES past_papers(id),
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL CHECK (question_type IN (
        'multiple_choice', 'true_false', 'direct_answer', 'problem', 'riddle',
        'essay', 'short_answer', 'structured', 'practical', 'calculation', 'diagram', 'comprehension'
    )),
    round_type TEXT CHECK (round_type IN ('round_one', 'speed_race', 'problem_of_day', 'true_false', 'riddles')),
    options TEXT, -- JSON array for multiple choice options
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),
    points INTEGER DEFAULT 3,
    marks INTEGER DEFAULT 1,
    time_limit INTEGER DEFAULT 30, -- seconds
    question_number INTEGER,
    section TEXT,
    is_compulsory INTEGER DEFAULT 1,
    image_url TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Riddles table (separate for multi-clue format)
CREATE TABLE IF NOT EXISTS riddles (
    id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    answer TEXT NOT NULL,
    clue_1 TEXT NOT NULL,
    clue_2 TEXT NOT NULL,
    clue_3 TEXT NOT NULL,
    clue_4 TEXT,
    clue_5 TEXT,
    difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),
    created_at TEXT DEFAULT (datetime('now'))
);

-- User progress per topic
CREATE TABLE IF NOT EXISTS user_progress (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    exam_type_id TEXT REFERENCES exam_types(id),
    questions_attempted INTEGER DEFAULT 0,
    questions_correct INTEGER DEFAULT 0,
    mastery_level INTEGER DEFAULT 0, -- 0-100
    last_attempt_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, topic_id, exam_type_id)
);

-- Question attempts (detailed history)
CREATE TABLE IF NOT EXISTS question_attempts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    user_answer TEXT NOT NULL,
    is_correct INTEGER NOT NULL, -- 0 or 1
    time_taken INTEGER NOT NULL, -- seconds
    points_earned INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Achievements
CREATE TABLE IF NOT EXISTS achievements (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    requirement_type TEXT NOT NULL CHECK (requirement_type IN ('questions_answered', 'streak_days', 'mastery_level', 'xp_earned', 'competitions_won', 'perfect_rounds', 'speed_record')),
    requirement_value INTEGER NOT NULL,
    xp_reward INTEGER DEFAULT 100,
    created_at TEXT DEFAULT (datetime('now'))
);

-- User achievements (junction table)
CREATE TABLE IF NOT EXISTS user_achievements (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id TEXT NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, achievement_id)
);

-- Leaderboard (cached/computed scores)
CREATE TABLE IF NOT EXISTS leaderboard (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'all_time')),
    score INTEGER NOT NULL DEFAULT 0,
    rank INTEGER,
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, period)
);

-- Practice sessions
CREATE TABLE IF NOT EXISTS practice_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mode TEXT NOT NULL CHECK (mode IN ('topic_drill', 'speed_race', 'flashcard', 'competition_sim', 'past_paper', 'essay_practice')),
    exam_type_id TEXT REFERENCES exam_types(id),
    paper_type_id TEXT REFERENCES paper_types(id),
    past_paper_id TEXT REFERENCES past_papers(id),
    subject_id TEXT REFERENCES subjects(id),
    topic_id TEXT REFERENCES topics(id),
    questions_count INTEGER DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    total_time INTEGER DEFAULT 0, -- seconds
    score INTEGER DEFAULT 0,
    started_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT
);

-- Competitions (for full NSMQ simulations)
CREATE TABLE IF NOT EXISTS competitions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'completed')),
    current_round INTEGER DEFAULT 1,
    school_data TEXT, -- JSON with school names and scores
    created_by TEXT REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now')),
    started_at TEXT,
    completed_at TEXT
);

-- Houses table (for House Cup system)
CREATE TABLE IF NOT EXISTS houses (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    icon TEXT DEFAULT 'shield',
    description TEXT,
    is_default INTEGER DEFAULT 0,
    school_id TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- House points tracking
CREATE TABLE IF NOT EXISTS house_points (
    id TEXT PRIMARY KEY,
    house_id TEXT NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    source TEXT NOT NULL CHECK (source IN ('practice', 'battle', 'competition', 'achievement', 'bonus')),
    source_id TEXT,
    period TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);

-- House standings (cached rankings)
CREATE TABLE IF NOT EXISTS house_standings (
    id TEXT PRIMARY KEY,
    house_id TEXT NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
    period TEXT NOT NULL CHECK (period IN ('weekly', 'monthly', 'yearly', 'all_time')),
    period_value TEXT NOT NULL,
    total_points INTEGER DEFAULT 0,
    member_count INTEGER DEFAULT 0,
    rank INTEGER,
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(house_id, period, period_value)
);

-- Battles table (for 1v1 battles)
CREATE TABLE IF NOT EXISTS battles (
    id TEXT PRIMARY KEY,
    challenger_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    opponent_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'completed', 'cancelled')),
    subject_id TEXT REFERENCES subjects(id),
    difficulty TEXT DEFAULT 'medium',
    question_count INTEGER DEFAULT 10,
    questions TEXT,
    challenger_score INTEGER DEFAULT 0,
    opponent_score INTEGER DEFAULT 0,
    current_question INTEGER DEFAULT 0,
    winner_id TEXT REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now')),
    started_at TEXT,
    completed_at TEXT
);

-- Battle answers tracking
CREATE TABLE IF NOT EXISTS battle_answers (
    id TEXT PRIMARY KEY,
    battle_id TEXT NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_index INTEGER NOT NULL,
    answer TEXT,
    is_correct INTEGER,
    time_taken INTEGER,
    points_earned INTEGER DEFAULT 0,
    answered_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject_id);
CREATE INDEX IF NOT EXISTS idx_questions_round ON questions(round_type);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_exam_type ON questions(exam_type_id);
CREATE INDEX IF NOT EXISTS idx_questions_paper_type ON questions(paper_type_id);
CREATE INDEX IF NOT EXISTS idx_questions_past_paper ON questions(past_paper_id);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(question_type);
CREATE INDEX IF NOT EXISTS idx_topics_subject ON topics(subject_id);
CREATE INDEX IF NOT EXISTS idx_topics_parent ON topics(parent_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_topic ON user_progress(topic_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_exam ON user_progress(exam_type_id);
CREATE INDEX IF NOT EXISTS idx_question_attempts_user ON question_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_question_attempts_question ON question_attempts(question_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_period ON leaderboard(period);
CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard(score DESC);
CREATE INDEX IF NOT EXISTS idx_riddles_subject ON riddles(subject_id);
CREATE INDEX IF NOT EXISTS idx_houses_default ON houses(is_default);
CREATE INDEX IF NOT EXISTS idx_house_points_house ON house_points(house_id);
CREATE INDEX IF NOT EXISTS idx_house_points_user ON house_points(user_id);
CREATE INDEX IF NOT EXISTS idx_house_points_period ON house_points(period);
CREATE INDEX IF NOT EXISTS idx_house_standings_period ON house_standings(period, period_value);
CREATE INDEX IF NOT EXISTS idx_battles_status ON battles(status);
CREATE INDEX IF NOT EXISTS idx_battles_challenger ON battles(challenger_id);
CREATE INDEX IF NOT EXISTS idx_battles_opponent ON battles(opponent_id);
CREATE INDEX IF NOT EXISTS idx_battle_answers_battle ON battle_answers(battle_id);

-- Indexes for exam system tables
CREATE INDEX IF NOT EXISTS idx_exam_types_active ON exam_types(is_active);
CREATE INDEX IF NOT EXISTS idx_subject_categories_exam ON subject_categories(exam_type_id);
CREATE INDEX IF NOT EXISTS idx_paper_types_exam ON paper_types(exam_type_id);
CREATE INDEX IF NOT EXISTS idx_subjects_exam_type ON subjects(exam_type_id);
CREATE INDEX IF NOT EXISTS idx_subjects_category ON subjects(category_id);
CREATE INDEX IF NOT EXISTS idx_subjects_active ON subjects(is_active);
CREATE INDEX IF NOT EXISTS idx_past_papers_exam ON past_papers(exam_type_id);
CREATE INDEX IF NOT EXISTS idx_past_papers_subject ON past_papers(subject_id);
CREATE INDEX IF NOT EXISTS idx_past_papers_paper_type ON past_papers(paper_type_id);
CREATE INDEX IF NOT EXISTS idx_past_papers_year ON past_papers(year DESC);
CREATE INDEX IF NOT EXISTS idx_past_papers_composite ON past_papers(exam_type_id, year DESC, subject_id);
CREATE INDEX IF NOT EXISTS idx_essay_questions_question ON essay_questions(question_id);
CREATE INDEX IF NOT EXISTS idx_essay_questions_ai ON essay_questions(ai_grading_enabled);
CREATE INDEX IF NOT EXISTS idx_essay_attempts_user ON essay_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_essay_attempts_question ON essay_attempts(question_id);
CREATE INDEX IF NOT EXISTS idx_essay_attempts_status ON essay_attempts(grading_status);
CREATE INDEX IF NOT EXISTS idx_paper_attempts_user ON paper_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_paper_attempts_paper ON paper_attempts(paper_id);
CREATE INDEX IF NOT EXISTS idx_paper_attempts_status ON paper_attempts(status);
CREATE INDEX IF NOT EXISTS idx_paper_attempt_answers_attempt ON paper_attempt_answers(paper_attempt_id);
CREATE INDEX IF NOT EXISTS idx_structured_parts_question ON structured_question_parts(question_id);
CREATE INDEX IF NOT EXISTS idx_user_exam_prefs_user ON user_exam_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_exam_prefs_primary ON user_exam_preferences(is_primary);
CREATE INDEX IF NOT EXISTS idx_user_subject_sel_user ON user_subject_selections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subject_sel_exam ON user_subject_selections(exam_type_id);
CREATE INDEX IF NOT EXISTS idx_ai_grading_limits_user ON ai_grading_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_exam ON practice_sessions(exam_type_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_paper ON practice_sessions(past_paper_id);

-- =============================================
-- COMMUNITY CHAT SYSTEM TABLES
-- =============================================

-- Chat rooms (DMs, public, private, subject-specific)
CREATE TABLE IF NOT EXISTS chat_rooms (
    id TEXT PRIMARY KEY,
    name TEXT,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('dm', 'public', 'private', 'subject')),
    subject_id TEXT REFERENCES subjects(id) ON DELETE SET NULL,
    exam_type_id TEXT REFERENCES exam_types(id) ON DELETE SET NULL,
    avatar_url TEXT,
    is_archived INTEGER DEFAULT 0,
    max_members INTEGER DEFAULT 500,
    created_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Room members with roles
CREATE TABLE IF NOT EXISTS chat_room_members (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'moderator', 'member')),
    nickname TEXT,
    is_muted INTEGER DEFAULT 0,
    joined_at TEXT DEFAULT (datetime('now')),
    last_read_at TEXT DEFAULT (datetime('now')),
    UNIQUE(room_id, user_id)
);

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    content_type TEXT DEFAULT 'text' CHECK (content_type IN ('text', 'image', 'file', 'system')),
    reply_to_id TEXT REFERENCES chat_messages(id) ON DELETE SET NULL,
    is_edited INTEGER DEFAULT 0,
    is_deleted INTEGER DEFAULT 0,
    deleted_by TEXT REFERENCES users(id),
    deleted_reason TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Message reactions
CREATE TABLE IF NOT EXISTS chat_message_reactions (
    id TEXT PRIMARY KEY,
    message_id TEXT NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(message_id, user_id, emoji)
);

-- User blocks (one user blocking another)
CREATE TABLE IF NOT EXISTS chat_user_blocks (
    id TEXT PRIMARY KEY,
    blocker_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(blocker_id, blocked_id)
);

-- Moderation actions (mute, ban, warn, kick)
CREATE TABLE IF NOT EXISTS chat_moderation_actions (
    id TEXT PRIMARY KEY,
    room_id TEXT REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    moderator_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (action_type IN ('mute', 'unmute', 'ban', 'unban', 'warn', 'kick')),
    reason TEXT,
    duration INTEGER,
    expires_at TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Content reports
CREATE TABLE IF NOT EXISTS chat_reports (
    id TEXT PRIMARY KEY,
    reporter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    message_id TEXT REFERENCES chat_messages(id) ON DELETE SET NULL,
    room_id TEXT REFERENCES chat_rooms(id) ON DELETE SET NULL,
    reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'hate_speech', 'other')),
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
    reviewed_by TEXT REFERENCES users(id),
    review_notes TEXT,
    resolution TEXT CHECK (resolution IN ('no_action', 'warning', 'message_deleted', 'user_muted', 'user_banned')),
    created_at TEXT DEFAULT (datetime('now')),
    reviewed_at TEXT
);

-- Profanity/word filter list
CREATE TABLE IF NOT EXISTS chat_filtered_words (
    id TEXT PRIMARY KEY,
    word TEXT NOT NULL UNIQUE,
    severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
    replacement TEXT DEFAULT '***',
    is_active INTEGER DEFAULT 1,
    added_by TEXT REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now'))
);

-- Rate limiting tracking
CREATE TABLE IF NOT EXISTS chat_rate_limits (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    room_id TEXT REFERENCES chat_rooms(id) ON DELETE CASCADE,
    message_count INTEGER DEFAULT 0,
    window_start TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, room_id)
);

-- Teacher moderator assignments (for subject rooms)
CREATE TABLE IF NOT EXISTS chat_teacher_assignments (
    id TEXT PRIMARY KEY,
    teacher_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    assigned_by TEXT NOT NULL REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(teacher_id, subject_id)
);

-- Student moderator assignments (for specific rooms)
CREATE TABLE IF NOT EXISTS chat_student_moderators (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    room_id TEXT NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    assigned_by TEXT NOT NULL REFERENCES users(id),
    expires_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, room_id)
);

-- Indexes for chat tables
CREATE INDEX IF NOT EXISTS idx_chat_rooms_type ON chat_rooms(type);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_subject ON chat_rooms(subject_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_exam_type ON chat_rooms(exam_type_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_created_by ON chat_rooms(created_by);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_archived ON chat_rooms(is_archived);
CREATE INDEX IF NOT EXISTS idx_chat_room_members_room ON chat_room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_room_members_user ON chat_room_members(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_room_members_role ON chat_room_members(role);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_reply ON chat_messages(reply_to_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_deleted ON chat_messages(is_deleted);
CREATE INDEX IF NOT EXISTS idx_chat_reactions_message ON chat_message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_reactions_user ON chat_message_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_user_blocks_blocker ON chat_user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_chat_user_blocks_blocked ON chat_user_blocks(blocked_id);
CREATE INDEX IF NOT EXISTS idx_chat_moderation_user ON chat_moderation_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_moderation_room ON chat_moderation_actions(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_moderation_active ON chat_moderation_actions(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_chat_moderation_type ON chat_moderation_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_chat_reports_status ON chat_reports(status);
CREATE INDEX IF NOT EXISTS idx_chat_reports_reported ON chat_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_chat_reports_reporter ON chat_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_chat_rate_limits_user ON chat_rate_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_teacher_assignments_teacher ON chat_teacher_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_chat_teacher_assignments_subject ON chat_teacher_assignments(subject_id);
CREATE INDEX IF NOT EXISTS idx_chat_student_mods_user ON chat_student_moderators(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_student_mods_room ON chat_student_moderators(room_id);

-- =============================================
-- PARENT MONITORING SYSTEM TABLES
-- =============================================

-- Parent-Student Relationships
-- Links parents/guardians to students via invite codes
CREATE TABLE IF NOT EXISTS parent_student_links (
    id TEXT PRIMARY KEY,
    parent_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invite_code TEXT UNIQUE,
    invite_code_expires_at TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'revoked', 'expired')),
    relationship_type TEXT DEFAULT 'parent' CHECK (relationship_type IN ('parent', 'guardian')),
    student_opted_out INTEGER DEFAULT 0,
    opted_out_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    verified_at TEXT,
    UNIQUE(parent_id, student_id)
);

-- Parent Notifications
-- Stores notifications sent to parents about their wards
CREATE TABLE IF NOT EXISTS parent_notifications (
    id TEXT PRIMARY KEY,
    parent_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN (
        'achievement_unlocked',
        'streak_milestone',
        'topic_mastered',
        'low_performance',
        'weekly_summary',
        'link_request',
        'student_opted_out',
        'link_confirmed'
    )),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data TEXT, -- JSON for additional context
    is_read INTEGER DEFAULT 0,
    email_sent INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Parent Notification Preferences
-- Customizable alert settings for each parent
CREATE TABLE IF NOT EXISTS parent_notification_preferences (
    id TEXT PRIMARY KEY,
    parent_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_alerts INTEGER DEFAULT 1,
    streak_alerts INTEGER DEFAULT 1,
    low_performance_alerts INTEGER DEFAULT 1,
    weekly_summary INTEGER DEFAULT 1,
    email_notifications INTEGER DEFAULT 1,
    low_performance_threshold INTEGER DEFAULT 40,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(parent_id)
);

-- Parent Activity Log (for audit trail)
CREATE TABLE IF NOT EXISTS parent_activity_log (
    id TEXT PRIMARY KEY,
    parent_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN (
        'view_progress',
        'view_activity',
        'view_topics',
        'view_achievements',
        'link_student',
        'unlink_student'
    )),
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for parent system
CREATE INDEX IF NOT EXISTS idx_parent_links_parent ON parent_student_links(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_links_student ON parent_student_links(student_id);
CREATE INDEX IF NOT EXISTS idx_parent_links_code ON parent_student_links(invite_code);
CREATE INDEX IF NOT EXISTS idx_parent_links_status ON parent_student_links(status);
CREATE INDEX IF NOT EXISTS idx_parent_links_active ON parent_student_links(status, student_opted_out);
CREATE INDEX IF NOT EXISTS idx_parent_notifications_parent ON parent_notifications(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_notifications_student ON parent_notifications(student_id);
CREATE INDEX IF NOT EXISTS idx_parent_notifications_unread ON parent_notifications(parent_id, is_read);
CREATE INDEX IF NOT EXISTS idx_parent_notifications_type ON parent_notifications(type);
CREATE INDEX IF NOT EXISTS idx_parent_notifications_created ON parent_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_parent_activity_parent ON parent_activity_log(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_activity_student ON parent_activity_log(student_id);
CREATE INDEX IF NOT EXISTS idx_parent_activity_created ON parent_activity_log(created_at DESC);

-- ===========================================
-- AUDIT SYSTEM TABLES
-- ===========================================

-- Central Audit Log
CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    user_email TEXT,
    user_role TEXT,
    action TEXT NOT NULL,
    action_category TEXT NOT NULL CHECK (action_category IN (
        'auth', 'user_management', 'content', 'practice',
        'parent', 'admin', 'settings', 'api', 'security'
    )),
    target_type TEXT,
    target_id TEXT,
    target_details TEXT,
    ip_address TEXT,
    user_agent TEXT,
    request_path TEXT,
    request_method TEXT,
    status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failure', 'warning')),
    error_message TEXT,
    metadata TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Security Events
CREATE TABLE IF NOT EXISTS security_events (
    id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'failed_login', 'account_locked', 'password_reset',
        'suspicious_activity', 'rate_limit_exceeded', 'unauthorized_access',
        'permission_escalation', 'data_export', 'bulk_operation', 'api_key_usage'
    )),
    severity TEXT DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    user_email TEXT,
    ip_address TEXT,
    user_agent TEXT,
    description TEXT NOT NULL,
    metadata TEXT,
    is_resolved INTEGER DEFAULT 0,
    resolved_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TEXT,
    resolution_notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Login Attempts
CREATE TABLE IF NOT EXISTS login_attempts (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    success INTEGER DEFAULT 0,
    failure_reason TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- User Sessions
CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    device_info TEXT,
    is_active INTEGER DEFAULT 1,
    last_activity_at TEXT DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Data Change Log
CREATE TABLE IF NOT EXISTS data_change_log (
    id TEXT PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    changed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    old_values TEXT,
    new_values TEXT,
    changed_fields TEXT,
    reason TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Audit System Indexes
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_category ON audit_log(action_category);
CREATE INDEX IF NOT EXISTS idx_audit_log_target ON audit_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_status ON audit_log(status);
CREATE INDEX IF NOT EXISTS idx_audit_log_ip ON audit_log(ip_address);

CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_user ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_unresolved ON security_events(is_resolved, severity);
CREATE INDEX IF NOT EXISTS idx_security_events_created ON security_events(created_at);

CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created ON login_attempts(created_at);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token_hash);

CREATE INDEX IF NOT EXISTS idx_data_change_table ON data_change_log(table_name);
CREATE INDEX IF NOT EXISTS idx_data_change_record ON data_change_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_data_change_user ON data_change_log(changed_by);
CREATE INDEX IF NOT EXISTS idx_data_change_created ON data_change_log(created_at);

-- =============================================
-- TEACHER ASSESSMENT SYSTEM TABLES
-- =============================================

-- Student Classes/Groups (for organizing students)
CREATE TABLE IF NOT EXISTS classes (
    id TEXT PRIMARY KEY,
    teacher_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    school_level TEXT CHECK (school_level IN ('jhs', 'shs')),
    year_group INTEGER,
    subject_id TEXT REFERENCES subjects(id) ON DELETE SET NULL,
    academic_year TEXT,
    is_active INTEGER DEFAULT 1,
    color TEXT DEFAULT '#3B82F6',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Class Memberships (students in classes)
CREATE TABLE IF NOT EXISTS class_members (
    id TEXT PRIMARY KEY,
    class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TEXT DEFAULT (datetime('now')),
    is_active INTEGER DEFAULT 1,
    UNIQUE(class_id, student_id)
);

-- Assessments (quizzes, homework, mock exams)
CREATE TABLE IF NOT EXISTS assessments (
    id TEXT PRIMARY KEY,
    teacher_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    instructions TEXT,
    assessment_type TEXT NOT NULL CHECK (assessment_type IN ('quiz', 'homework', 'mock_exam')),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived', 'closed')),
    subject_id TEXT REFERENCES subjects(id) ON DELETE SET NULL,
    topic_ids TEXT,
    exam_type_id TEXT REFERENCES exam_types(id) ON DELETE SET NULL,
    time_limit INTEGER,
    start_date TEXT,
    end_date TEXT,
    late_submission_allowed INTEGER DEFAULT 0,
    late_penalty_percent INTEGER DEFAULT 0,
    total_marks INTEGER NOT NULL DEFAULT 0,
    passing_score INTEGER,
    show_correct_answers INTEGER DEFAULT 1,
    show_score_immediately INTEGER DEFAULT 1,
    shuffle_questions INTEGER DEFAULT 0,
    shuffle_options INTEGER DEFAULT 0,
    one_question_per_page INTEGER DEFAULT 0,
    allow_review INTEGER DEFAULT 1,
    max_attempts INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    published_at TEXT,
    archived_at TEXT
);

-- Assessment Questions
CREATE TABLE IF NOT EXISTS assessment_questions (
    id TEXT PRIMARY KEY,
    assessment_id TEXT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    question_id TEXT REFERENCES questions(id) ON DELETE SET NULL,
    custom_question_text TEXT,
    custom_question_type TEXT,
    custom_options TEXT,
    custom_correct_answer TEXT,
    custom_explanation TEXT,
    custom_image_url TEXT,
    marks INTEGER NOT NULL DEFAULT 1,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_required INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Assessment Assignments
CREATE TABLE IF NOT EXISTS assessment_assignments (
    id TEXT PRIMARY KEY,
    assessment_id TEXT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    assignment_type TEXT NOT NULL CHECK (assignment_type IN ('individual', 'class', 'school_level')),
    student_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    class_id TEXT REFERENCES classes(id) ON DELETE CASCADE,
    school_level TEXT,
    year_group INTEGER,
    assigned_at TEXT DEFAULT (datetime('now')),
    assigned_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    custom_start_date TEXT,
    custom_end_date TEXT
);

-- Assessment Attempts
CREATE TABLE IF NOT EXISTS assessment_attempts (
    id TEXT PRIMARY KEY,
    assessment_id TEXT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    attempt_number INTEGER NOT NULL DEFAULT 1,
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'graded', 'late')),
    started_at TEXT DEFAULT (datetime('now')),
    submitted_at TEXT,
    time_taken INTEGER,
    auto_score INTEGER DEFAULT 0,
    manual_score INTEGER DEFAULT 0,
    total_score INTEGER DEFAULT 0,
    max_score INTEGER NOT NULL,
    percentage REAL,
    grade TEXT,
    is_late INTEGER DEFAULT 0,
    late_penalty_applied INTEGER DEFAULT 0,
    grading_status TEXT DEFAULT 'pending' CHECK (grading_status IN ('pending', 'partial', 'complete')),
    graded_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    graded_at TEXT,
    teacher_feedback TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(assessment_id, student_id, attempt_number)
);

-- Assessment Attempt Answers
CREATE TABLE IF NOT EXISTS assessment_attempt_answers (
    id TEXT PRIMARY KEY,
    attempt_id TEXT NOT NULL REFERENCES assessment_attempts(id) ON DELETE CASCADE,
    assessment_question_id TEXT NOT NULL REFERENCES assessment_questions(id) ON DELETE CASCADE,
    answer_text TEXT,
    answer_options TEXT,
    is_correct INTEGER,
    auto_marks INTEGER DEFAULT 0,
    manual_marks INTEGER,
    teacher_comment TEXT,
    graded_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    graded_at TEXT,
    time_taken INTEGER,
    answered_at TEXT DEFAULT (datetime('now')),
    UNIQUE(attempt_id, assessment_question_id)
);

-- Assessment Templates
CREATE TABLE IF NOT EXISTS assessment_templates (
    id TEXT PRIMARY KEY,
    teacher_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    assessment_type TEXT NOT NULL CHECK (assessment_type IN ('quiz', 'homework', 'mock_exam')),
    subject_id TEXT REFERENCES subjects(id) ON DELETE SET NULL,
    settings TEXT NOT NULL,
    is_shared INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Assessment System Indexes
CREATE INDEX IF NOT EXISTS idx_classes_teacher ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_active ON classes(is_active);
CREATE INDEX IF NOT EXISTS idx_class_members_class ON class_members(class_id);
CREATE INDEX IF NOT EXISTS idx_class_members_student ON class_members(student_id);
CREATE INDEX IF NOT EXISTS idx_assessments_teacher ON assessments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assessments_status ON assessments(status);
CREATE INDEX IF NOT EXISTS idx_assessments_type ON assessments(assessment_type);
CREATE INDEX IF NOT EXISTS idx_assessments_dates ON assessments(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_assessment_questions_assessment ON assessment_questions(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_assignments_assessment ON assessment_assignments(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_assignments_student ON assessment_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_assessment_assignments_class ON assessment_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_assessment ON assessment_attempts(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_student ON assessment_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_grading ON assessment_attempts(grading_status);
CREATE INDEX IF NOT EXISTS idx_attempt_answers_attempt ON assessment_attempt_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_assessment_templates_teacher ON assessment_templates(teacher_id);
