-- Migration: AI Revision Classroom System
-- Description: Revolutionary AI-led revision where AI proactively teaches students through topics before exams
-- Supports: BECE, WASSCE, NSMQ, IGCSE, A-Level

-- Revision sessions - tracks a student's revision journey through a subject/topic
CREATE TABLE IF NOT EXISTS revision_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    exam_type TEXT NOT NULL, -- 'bece', 'wassce', 'nsmq', 'igcse', 'cambridge_as', 'cambridge_a2', 'edexcel_as', 'edexcel_a2'
    subject_id TEXT NOT NULL,
    topic_id TEXT, -- Optional: specific topic focus
    session_type TEXT NOT NULL DEFAULT 'full_revision', -- 'full_revision', 'topic_review', 'quick_recap', 'exam_prep'
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'paused', 'completed', 'abandoned'
    progress_percentage INTEGER DEFAULT 0,
    current_lesson_id TEXT,
    lessons_completed INTEGER DEFAULT 0,
    total_lessons INTEGER DEFAULT 0,
    mastery_score REAL DEFAULT 0, -- 0-100 mastery level
    time_spent_minutes INTEGER DEFAULT 0,
    started_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_activity_at TEXT NOT NULL DEFAULT (datetime('now')),
    completed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    FOREIGN KEY (topic_id) REFERENCES topics(id)
);

-- Revision lessons - individual lessons within a revision session
CREATE TABLE IF NOT EXISTS revision_lessons (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    topic_id TEXT NOT NULL,
    lesson_order INTEGER NOT NULL, -- Order in the revision sequence
    title TEXT NOT NULL,
    description TEXT,
    lesson_type TEXT NOT NULL DEFAULT 'concept', -- 'concept', 'example', 'practice', 'assessment'
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'skipped'

    -- AI Teaching Content
    hook_content TEXT, -- Engaging intro/hook
    explanation_content TEXT, -- Main teaching content
    visual_aids TEXT, -- JSON array of visual aid descriptions/references
    examples TEXT, -- JSON array of worked examples
    key_points TEXT, -- JSON array of key takeaways

    -- Student Progress
    understanding_level INTEGER DEFAULT 0, -- 0-5 scale from AI assessment
    questions_attempted INTEGER DEFAULT 0,
    questions_correct INTEGER DEFAULT 0,
    time_spent_seconds INTEGER DEFAULT 0,

    -- Timestamps
    started_at TEXT,
    completed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (session_id) REFERENCES revision_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (topic_id) REFERENCES topics(id)
);

-- Topic mastery tracking - detailed mastery per topic per user
CREATE TABLE IF NOT EXISTS topic_mastery (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    topic_id TEXT NOT NULL,
    exam_type TEXT NOT NULL,

    -- Mastery Metrics
    mastery_level REAL DEFAULT 0, -- 0-100
    confidence_level TEXT DEFAULT 'low', -- 'low', 'medium', 'high', 'mastered'
    lessons_completed INTEGER DEFAULT 0,
    practice_questions_attempted INTEGER DEFAULT 0,
    practice_questions_correct INTEGER DEFAULT 0,
    revision_count INTEGER DEFAULT 0, -- How many times revised

    -- Spaced Repetition
    last_revised_at TEXT,
    next_revision_due TEXT, -- When to suggest revisiting
    retention_strength REAL DEFAULT 1.0, -- Decay factor for spaced repetition

    -- Exam Board Specific
    exam_board_tips TEXT, -- JSON: exam board specific tips
    common_mistakes TEXT, -- JSON: common mistakes for this topic
    high_yield_points TEXT, -- JSON: frequently examined points

    -- Progress Over Time
    initial_assessment_score REAL,
    current_assessment_score REAL,
    improvement_percentage REAL DEFAULT 0,

    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, topic_id, exam_type),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (topic_id) REFERENCES topics(id)
);

-- Revision checkpoints - mini assessments during revision
CREATE TABLE IF NOT EXISTS revision_checkpoints (
    id TEXT PRIMARY KEY,
    lesson_id TEXT NOT NULL,
    checkpoint_type TEXT NOT NULL, -- 'quick_check', 'concept_check', 'application', 'exam_style'
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL, -- 'multiple_choice', 'short_answer', 'true_false', 'fill_blank'
    options TEXT, -- JSON array for MCQ
    correct_answer TEXT NOT NULL,
    explanation TEXT NOT NULL,
    difficulty TEXT DEFAULT 'medium', -- 'easy', 'medium', 'hard'
    points INTEGER DEFAULT 1,
    order_index INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (lesson_id) REFERENCES revision_lessons(id) ON DELETE CASCADE
);

-- Checkpoint responses - student answers to checkpoints
CREATE TABLE IF NOT EXISTS checkpoint_responses (
    id TEXT PRIMARY KEY,
    checkpoint_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    user_answer TEXT NOT NULL,
    is_correct INTEGER NOT NULL,
    time_taken_seconds INTEGER,
    ai_feedback TEXT, -- Personalized feedback from AI
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (checkpoint_id) REFERENCES revision_checkpoints(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES revision_sessions(id) ON DELETE CASCADE
);

-- AI teaching interactions - log of AI teaching exchanges
CREATE TABLE IF NOT EXISTS revision_ai_interactions (
    id TEXT PRIMARY KEY,
    lesson_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    interaction_type TEXT NOT NULL, -- 'teaching', 'question', 'clarification', 'encouragement', 'summary'
    ai_message TEXT NOT NULL,
    user_response TEXT,
    sentiment TEXT, -- 'confused', 'understanding', 'confident', 'struggling'
    tokens_used INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (lesson_id) REFERENCES revision_lessons(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Revision schedules - smart scheduling for revision
CREATE TABLE IF NOT EXISTS revision_schedules (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    exam_type TEXT NOT NULL,
    subject_id TEXT NOT NULL,
    target_exam_date TEXT, -- When the exam is
    schedule_type TEXT DEFAULT 'auto', -- 'auto', 'custom'

    -- Schedule Details
    topics_to_cover TEXT NOT NULL, -- JSON array of topic IDs
    estimated_hours INTEGER,
    daily_time_minutes INTEGER DEFAULT 30, -- Preferred daily revision time
    preferred_days TEXT, -- JSON array of preferred days

    -- Progress
    topics_completed TEXT, -- JSON array of completed topic IDs
    current_topic_id TEXT,
    on_track INTEGER DEFAULT 1, -- Boolean: is student on schedule?
    days_ahead INTEGER DEFAULT 0, -- Positive = ahead, negative = behind

    -- Status
    status TEXT DEFAULT 'active', -- 'active', 'paused', 'completed'
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id)
);

-- Exam board intelligence - store exam-specific patterns and tips
CREATE TABLE IF NOT EXISTS exam_board_intelligence (
    id TEXT PRIMARY KEY,
    exam_type TEXT NOT NULL,
    exam_board TEXT, -- 'waec', 'cambridge', 'edexcel'
    subject_id TEXT NOT NULL,
    topic_id TEXT,

    -- Intelligence Data
    frequency_score INTEGER DEFAULT 0, -- How often this topic appears (1-10)
    typical_marks INTEGER, -- Typical marks allocated
    question_styles TEXT, -- JSON: common question formats
    marking_scheme_tips TEXT, -- JSON: how examiners mark
    common_mistakes TEXT, -- JSON: frequent student errors
    model_answers TEXT, -- JSON: example answers
    examiner_comments TEXT, -- JSON: past examiner feedback
    key_formulas TEXT, -- JSON: must-know formulas

    -- Historical Data
    appeared_in_years TEXT, -- JSON: years this topic appeared
    last_appeared TEXT,

    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(exam_type, subject_id, topic_id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    FOREIGN KEY (topic_id) REFERENCES topics(id)
);

-- Revision achievements - gamification for revision
CREATE TABLE IF NOT EXISTS revision_achievements (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    achievement_type TEXT NOT NULL, -- 'topic_mastered', 'streak', 'subject_complete', 'quick_learner', 'persistent'
    achievement_name TEXT NOT NULL,
    achievement_description TEXT,
    exam_type TEXT,
    subject_id TEXT,
    topic_id TEXT,
    xp_earned INTEGER DEFAULT 0,
    earned_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    FOREIGN KEY (topic_id) REFERENCES topics(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_revision_sessions_user ON revision_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_revision_sessions_exam ON revision_sessions(exam_type);
CREATE INDEX IF NOT EXISTS idx_revision_sessions_subject ON revision_sessions(subject_id);
CREATE INDEX IF NOT EXISTS idx_revision_sessions_status ON revision_sessions(status);
CREATE INDEX IF NOT EXISTS idx_revision_lessons_session ON revision_lessons(session_id);
CREATE INDEX IF NOT EXISTS idx_revision_lessons_topic ON revision_lessons(topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_mastery_user ON topic_mastery(user_id);
CREATE INDEX IF NOT EXISTS idx_topic_mastery_topic ON topic_mastery(topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_mastery_exam ON topic_mastery(exam_type);
CREATE INDEX IF NOT EXISTS idx_revision_checkpoints_lesson ON revision_checkpoints(lesson_id);
CREATE INDEX IF NOT EXISTS idx_checkpoint_responses_user ON checkpoint_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_revision_ai_interactions_lesson ON revision_ai_interactions(lesson_id);
CREATE INDEX IF NOT EXISTS idx_revision_schedules_user ON revision_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_board_intelligence_exam ON exam_board_intelligence(exam_type);
CREATE INDEX IF NOT EXISTS idx_revision_achievements_user ON revision_achievements(user_id);
