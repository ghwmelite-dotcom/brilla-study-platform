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
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
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
