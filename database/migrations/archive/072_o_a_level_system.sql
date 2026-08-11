-- Migration: O-Level and A-Level Exam System
-- Adds support for Cambridge (CAIE) and Edexcel examination boards
-- Includes IGCSE, AS Level, and A-Level qualifications

-- =============================================
-- EXAM BOARDS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS exam_boards (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    full_name TEXT,
    region TEXT DEFAULT 'International',
    website_url TEXT,
    logo_url TEXT,
    is_active INTEGER DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

-- =============================================
-- SUBJECT SPECIFICATIONS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS subject_specifications (
    id TEXT PRIMARY KEY,
    exam_board_id TEXT NOT NULL REFERENCES exam_boards(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    exam_type_id TEXT NOT NULL REFERENCES exam_types(id) ON DELETE CASCADE,
    syllabus_code TEXT NOT NULL,
    syllabus_name TEXT NOT NULL,
    specification_year TEXT,
    valid_from TEXT,
    valid_to TEXT,
    syllabus_pdf_url TEXT,
    specimen_papers_url TEXT,
    total_papers INTEGER DEFAULT 0,
    assessment_info TEXT,
    is_active INTEGER DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(exam_board_id, syllabus_code, specification_year)
);

-- =============================================
-- PAPER COMPONENTS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS paper_components (
    id TEXT PRIMARY KEY,
    specification_id TEXT NOT NULL REFERENCES subject_specifications(id) ON DELETE CASCADE,
    paper_number INTEGER NOT NULL,
    paper_name TEXT NOT NULL,
    paper_code TEXT,
    duration_minutes INTEGER,
    total_marks INTEGER,
    weighting_percent REAL,
    question_format TEXT CHECK (question_format IN ('mcq', 'structured', 'essay', 'practical', 'coursework', 'mixed')),
    is_compulsory INTEGER DEFAULT 1,
    tier TEXT CHECK (tier IN ('core', 'extended', 'foundation', 'higher', NULL)),
    description TEXT,
    notes TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(specification_id, paper_number)
);

-- =============================================
-- SYLLABUS TOPICS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS syllabus_topics (
    id TEXT PRIMARY KEY,
    specification_id TEXT NOT NULL REFERENCES subject_specifications(id) ON DELETE CASCADE,
    parent_id TEXT REFERENCES syllabus_topics(id) ON DELETE CASCADE,
    topic_code TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    learning_objectives TEXT,
    assessment_objectives TEXT,
    command_words TEXT,
    tier TEXT CHECK (tier IN ('core', 'extended', 'both', NULL)),
    hours_recommended REAL,
    display_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(specification_id, topic_code)
);

-- =============================================
-- TOPIC SYLLABUS MAPPING TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS topic_syllabus_mapping (
    id TEXT PRIMARY KEY,
    topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    syllabus_topic_id TEXT NOT NULL REFERENCES syllabus_topics(id) ON DELETE CASCADE,
    coverage_level TEXT DEFAULT 'full' CHECK (coverage_level IN ('full', 'partial', 'introduces')),
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(topic_id, syllabus_topic_id)
);

-- =============================================
-- GRADE BOUNDARIES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS grade_boundaries (
    id TEXT PRIMARY KEY,
    specification_id TEXT NOT NULL REFERENCES subject_specifications(id) ON DELETE CASCADE,
    paper_component_id TEXT REFERENCES paper_components(id) ON DELETE SET NULL,
    session TEXT NOT NULL,
    year INTEGER NOT NULL,
    grade TEXT NOT NULL,
    raw_mark INTEGER NOT NULL,
    ums_mark INTEGER,
    percentage REAL,
    is_overall INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(specification_id, paper_component_id, session, year, grade)
);

-- =============================================
-- PAST PAPER FILES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS past_paper_files (
    id TEXT PRIMARY KEY,
    past_paper_id TEXT NOT NULL REFERENCES past_papers(id) ON DELETE CASCADE,
    file_type TEXT NOT NULL CHECK (file_type IN ('question_paper', 'mark_scheme', 'examiner_report', 'specimen', 'insert', 'grade_thresholds')),
    file_url TEXT NOT NULL,
    file_name TEXT,
    file_size INTEGER,
    page_count INTEGER,
    is_premium INTEGER DEFAULT 0,
    uploaded_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(past_paper_id, file_type)
);

-- =============================================
-- USER TARGET GRADES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS user_target_grades (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    specification_id TEXT NOT NULL REFERENCES subject_specifications(id) ON DELETE CASCADE,
    target_grade TEXT NOT NULL,
    current_predicted TEXT,
    exam_session TEXT,
    exam_year INTEGER,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, specification_id)
);

-- =============================================
-- COMMAND WORDS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS command_words (
    id TEXT PRIMARY KEY,
    word TEXT NOT NULL,
    definition TEXT NOT NULL,
    marks_guidance TEXT,
    example_usage TEXT,
    typical_marks_range TEXT,
    exam_board_id TEXT REFERENCES exam_boards(id) ON DELETE SET NULL,
    subject_area TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(word, exam_board_id)
);

-- =============================================
-- USER SPECIFICATION SELECTIONS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS user_specification_selections (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    specification_id TEXT NOT NULL REFERENCES subject_specifications(id) ON DELETE CASCADE,
    is_active INTEGER DEFAULT 1,
    priority INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, specification_id)
);

-- =============================================
-- SYLLABUS PROGRESS TRACKING TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS user_syllabus_progress (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    syllabus_topic_id TEXT NOT NULL REFERENCES syllabus_topics(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'needs_review')),
    confidence_level INTEGER DEFAULT 0 CHECK (confidence_level >= 0 AND confidence_level <= 100),
    questions_attempted INTEGER DEFAULT 0,
    questions_correct INTEGER DEFAULT 0,
    last_practiced_at TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, syllabus_topic_id)
);

-- =============================================
-- EXTEND EXAM_TYPES TABLE
-- =============================================

-- Add new columns to exam_types
ALTER TABLE exam_types ADD COLUMN exam_board_id TEXT REFERENCES exam_boards(id);
ALTER TABLE exam_types ADD COLUMN level TEXT CHECK (level IN ('GCSE', 'IGCSE', 'AS', 'A2', 'A-Level', 'O-Level', NULL));
ALTER TABLE exam_types ADD COLUMN grading_scale TEXT CHECK (grading_scale IN ('A*-G', '9-1', 'A*-E', 'A*-U', NULL));

-- =============================================
-- EXTEND PAST_PAPERS TABLE
-- =============================================

-- Add new columns to past_papers
ALTER TABLE past_papers ADD COLUMN exam_board_id TEXT REFERENCES exam_boards(id);
ALTER TABLE past_papers ADD COLUMN specification_id TEXT REFERENCES subject_specifications(id);
ALTER TABLE past_papers ADD COLUMN paper_component_id TEXT REFERENCES paper_components(id);
ALTER TABLE past_papers ADD COLUMN variant TEXT;
ALTER TABLE past_papers ADD COLUMN session TEXT;
ALTER TABLE past_papers ADD COLUMN tier TEXT CHECK (tier IN ('core', 'extended', 'foundation', 'higher', NULL));
ALTER TABLE past_papers ADD COLUMN has_mark_scheme INTEGER DEFAULT 0;
ALTER TABLE past_papers ADD COLUMN has_examiner_report INTEGER DEFAULT 0;

-- =============================================
-- EXTEND QUESTIONS TABLE
-- =============================================

-- Add new columns to questions
ALTER TABLE questions ADD COLUMN syllabus_topic_id TEXT REFERENCES syllabus_topics(id);
ALTER TABLE questions ADD COLUMN command_word TEXT;
ALTER TABLE questions ADD COLUMN assessment_objective TEXT;
ALTER TABLE questions ADD COLUMN source_paper_code TEXT;
ALTER TABLE questions ADD COLUMN source_question_number TEXT;
ALTER TABLE questions ADD COLUMN exam_board_id TEXT REFERENCES exam_boards(id);

-- =============================================
-- INDEXES
-- =============================================

-- Exam boards indexes
CREATE INDEX IF NOT EXISTS idx_exam_boards_code ON exam_boards(code);
CREATE INDEX IF NOT EXISTS idx_exam_boards_active ON exam_boards(is_active);

-- Subject specifications indexes
CREATE INDEX IF NOT EXISTS idx_specifications_board ON subject_specifications(exam_board_id);
CREATE INDEX IF NOT EXISTS idx_specifications_subject ON subject_specifications(subject_id);
CREATE INDEX IF NOT EXISTS idx_specifications_exam_type ON subject_specifications(exam_type_id);
CREATE INDEX IF NOT EXISTS idx_specifications_code ON subject_specifications(syllabus_code);
CREATE INDEX IF NOT EXISTS idx_specifications_active ON subject_specifications(is_active);

-- Paper components indexes
CREATE INDEX IF NOT EXISTS idx_paper_components_spec ON paper_components(specification_id);
CREATE INDEX IF NOT EXISTS idx_paper_components_format ON paper_components(question_format);

-- Syllabus topics indexes
CREATE INDEX IF NOT EXISTS idx_syllabus_topics_spec ON syllabus_topics(specification_id);
CREATE INDEX IF NOT EXISTS idx_syllabus_topics_parent ON syllabus_topics(parent_id);
CREATE INDEX IF NOT EXISTS idx_syllabus_topics_code ON syllabus_topics(topic_code);

-- Topic syllabus mapping indexes
CREATE INDEX IF NOT EXISTS idx_topic_syllabus_map_topic ON topic_syllabus_mapping(topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_syllabus_map_syllabus ON topic_syllabus_mapping(syllabus_topic_id);

-- Grade boundaries indexes
CREATE INDEX IF NOT EXISTS idx_grade_boundaries_spec ON grade_boundaries(specification_id);
CREATE INDEX IF NOT EXISTS idx_grade_boundaries_year ON grade_boundaries(year DESC);
CREATE INDEX IF NOT EXISTS idx_grade_boundaries_session ON grade_boundaries(session);
CREATE INDEX IF NOT EXISTS idx_grade_boundaries_grade ON grade_boundaries(grade);

-- Past paper files indexes
CREATE INDEX IF NOT EXISTS idx_paper_files_paper ON past_paper_files(past_paper_id);
CREATE INDEX IF NOT EXISTS idx_paper_files_type ON past_paper_files(file_type);
CREATE INDEX IF NOT EXISTS idx_paper_files_premium ON past_paper_files(is_premium);

-- User target grades indexes
CREATE INDEX IF NOT EXISTS idx_user_targets_user ON user_target_grades(user_id);
CREATE INDEX IF NOT EXISTS idx_user_targets_spec ON user_target_grades(specification_id);
CREATE INDEX IF NOT EXISTS idx_user_targets_session ON user_target_grades(exam_session);

-- Command words indexes
CREATE INDEX IF NOT EXISTS idx_command_words_word ON command_words(word);
CREATE INDEX IF NOT EXISTS idx_command_words_board ON command_words(exam_board_id);

-- User specification selections indexes
CREATE INDEX IF NOT EXISTS idx_user_spec_sel_user ON user_specification_selections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_spec_sel_spec ON user_specification_selections(specification_id);
CREATE INDEX IF NOT EXISTS idx_user_spec_sel_active ON user_specification_selections(is_active);

-- User syllabus progress indexes
CREATE INDEX IF NOT EXISTS idx_user_syllabus_prog_user ON user_syllabus_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_syllabus_prog_topic ON user_syllabus_progress(syllabus_topic_id);
CREATE INDEX IF NOT EXISTS idx_user_syllabus_prog_status ON user_syllabus_progress(status);

-- Extended past_papers indexes
CREATE INDEX IF NOT EXISTS idx_past_papers_board ON past_papers(exam_board_id);
CREATE INDEX IF NOT EXISTS idx_past_papers_spec ON past_papers(specification_id);
CREATE INDEX IF NOT EXISTS idx_past_papers_component ON past_papers(paper_component_id);
CREATE INDEX IF NOT EXISTS idx_past_papers_session ON past_papers(session);

-- Extended questions indexes
CREATE INDEX IF NOT EXISTS idx_questions_syllabus_topic ON questions(syllabus_topic_id);
CREATE INDEX IF NOT EXISTS idx_questions_command_word ON questions(command_word);
CREATE INDEX IF NOT EXISTS idx_questions_ao ON questions(assessment_objective);
CREATE INDEX IF NOT EXISTS idx_questions_board ON questions(exam_board_id);
