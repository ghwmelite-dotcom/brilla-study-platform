-- =============================================
-- Migration 004: Teacher Assessment System
-- Creates tables for quizzes, homework, mock exams
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

    -- Subject/Topic targeting
    subject_id TEXT REFERENCES subjects(id) ON DELETE SET NULL,
    topic_ids TEXT, -- JSON array of topic IDs
    exam_type_id TEXT REFERENCES exam_types(id) ON DELETE SET NULL,

    -- Timing configuration
    time_limit INTEGER, -- in minutes (null = untimed)
    start_date TEXT, -- when assessment becomes available
    end_date TEXT, -- deadline
    late_submission_allowed INTEGER DEFAULT 0,
    late_penalty_percent INTEGER DEFAULT 0, -- e.g., 10 = 10% deduction per day

    -- Grading configuration
    total_marks INTEGER NOT NULL DEFAULT 0,
    passing_score INTEGER,
    show_correct_answers INTEGER DEFAULT 1, -- show answers after submission
    show_score_immediately INTEGER DEFAULT 1,

    -- Question configuration
    shuffle_questions INTEGER DEFAULT 0,
    shuffle_options INTEGER DEFAULT 0,
    one_question_per_page INTEGER DEFAULT 0,
    allow_review INTEGER DEFAULT 1, -- allow students to review before submit

    -- Attempt limits
    max_attempts INTEGER DEFAULT 1, -- null = unlimited

    -- Metadata
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    published_at TEXT,
    archived_at TEXT
);

-- Assessment Questions (links questions to assessments)
CREATE TABLE IF NOT EXISTS assessment_questions (
    id TEXT PRIMARY KEY,
    assessment_id TEXT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    question_id TEXT REFERENCES questions(id) ON DELETE SET NULL, -- null if custom question

    -- Custom question data (if not linked to existing question)
    custom_question_text TEXT,
    custom_question_type TEXT CHECK (custom_question_type IS NULL OR custom_question_type IN (
        'multiple_choice', 'true_false', 'direct_answer', 'essay', 'short_answer', 'calculation'
    )),
    custom_options TEXT, -- JSON array for multiple choice options
    custom_correct_answer TEXT,
    custom_explanation TEXT,
    custom_image_url TEXT,

    -- Question configuration
    marks INTEGER NOT NULL DEFAULT 1,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_required INTEGER DEFAULT 1,

    created_at TEXT DEFAULT (datetime('now'))
);

-- Assessment Assignments (who is assigned the assessment)
CREATE TABLE IF NOT EXISTS assessment_assignments (
    id TEXT PRIMARY KEY,
    assessment_id TEXT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    assignment_type TEXT NOT NULL CHECK (assignment_type IN ('individual', 'class', 'school_level')),

    -- Target (one of these will be set based on assignment_type)
    student_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    class_id TEXT REFERENCES classes(id) ON DELETE CASCADE,
    school_level TEXT CHECK (school_level IS NULL OR school_level IN ('jhs', 'shs')),
    year_group INTEGER,

    assigned_at TEXT DEFAULT (datetime('now')),
    assigned_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Override dates for this specific assignment
    custom_start_date TEXT,
    custom_end_date TEXT
);

-- Assessment Attempts (student submissions)
CREATE TABLE IF NOT EXISTS assessment_attempts (
    id TEXT PRIMARY KEY,
    assessment_id TEXT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    attempt_number INTEGER NOT NULL DEFAULT 1,

    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'graded', 'late')),

    -- Timing
    started_at TEXT DEFAULT (datetime('now')),
    submitted_at TEXT,
    time_taken INTEGER, -- in seconds

    -- Scores
    auto_score INTEGER DEFAULT 0, -- points from auto-graded questions
    manual_score INTEGER DEFAULT 0, -- points from manually graded questions
    total_score INTEGER DEFAULT 0, -- auto + manual
    max_score INTEGER NOT NULL,
    percentage REAL,
    grade TEXT,

    -- Late submission
    is_late INTEGER DEFAULT 0,
    late_penalty_applied INTEGER DEFAULT 0,

    -- Grading status
    grading_status TEXT DEFAULT 'pending' CHECK (grading_status IN ('pending', 'partial', 'complete')),
    graded_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    graded_at TEXT,

    -- Feedback
    teacher_feedback TEXT,

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),

    UNIQUE(assessment_id, student_id, attempt_number)
);

-- Assessment Attempt Answers (individual question responses)
CREATE TABLE IF NOT EXISTS assessment_attempt_answers (
    id TEXT PRIMARY KEY,
    attempt_id TEXT NOT NULL REFERENCES assessment_attempts(id) ON DELETE CASCADE,
    assessment_question_id TEXT NOT NULL REFERENCES assessment_questions(id) ON DELETE CASCADE,

    -- Answer data
    answer_text TEXT,
    answer_options TEXT, -- JSON array for multiple selection

    -- Auto-grading
    is_correct INTEGER, -- null for essay/short answer
    auto_marks INTEGER DEFAULT 0,

    -- Manual grading
    manual_marks INTEGER,
    teacher_comment TEXT,
    graded_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    graded_at TEXT,

    -- Timing
    time_taken INTEGER, -- seconds spent on this question
    answered_at TEXT DEFAULT (datetime('now')),

    UNIQUE(attempt_id, assessment_question_id)
);

-- Assessment Templates (reusable assessment configurations)
CREATE TABLE IF NOT EXISTS assessment_templates (
    id TEXT PRIMARY KEY,
    teacher_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    assessment_type TEXT NOT NULL CHECK (assessment_type IN ('quiz', 'homework', 'mock_exam')),
    subject_id TEXT REFERENCES subjects(id) ON DELETE SET NULL,
    settings TEXT NOT NULL, -- JSON with default settings
    is_shared INTEGER DEFAULT 0, -- share with other teachers
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- =============================================
-- INDEXES
-- =============================================

-- Classes
CREATE INDEX IF NOT EXISTS idx_classes_teacher ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_active ON classes(is_active);
CREATE INDEX IF NOT EXISTS idx_classes_subject ON classes(subject_id);
CREATE INDEX IF NOT EXISTS idx_classes_level ON classes(school_level, year_group);

-- Class Members
CREATE INDEX IF NOT EXISTS idx_class_members_class ON class_members(class_id);
CREATE INDEX IF NOT EXISTS idx_class_members_student ON class_members(student_id);
CREATE INDEX IF NOT EXISTS idx_class_members_active ON class_members(class_id, is_active);

-- Assessments
CREATE INDEX IF NOT EXISTS idx_assessments_teacher ON assessments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assessments_status ON assessments(status);
CREATE INDEX IF NOT EXISTS idx_assessments_type ON assessments(assessment_type);
CREATE INDEX IF NOT EXISTS idx_assessments_subject ON assessments(subject_id);
CREATE INDEX IF NOT EXISTS idx_assessments_dates ON assessments(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_assessments_teacher_status ON assessments(teacher_id, status);

-- Assessment Questions
CREATE INDEX IF NOT EXISTS idx_assessment_questions_assessment ON assessment_questions(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_questions_question ON assessment_questions(question_id);
CREATE INDEX IF NOT EXISTS idx_assessment_questions_order ON assessment_questions(assessment_id, display_order);

-- Assessment Assignments
CREATE INDEX IF NOT EXISTS idx_assessment_assignments_assessment ON assessment_assignments(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_assignments_student ON assessment_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_assessment_assignments_class ON assessment_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_assessment_assignments_level ON assessment_assignments(school_level, year_group);

-- Assessment Attempts
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_assessment ON assessment_attempts(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_student ON assessment_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_status ON assessment_attempts(status);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_grading ON assessment_attempts(grading_status);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_student_assessment ON assessment_attempts(student_id, assessment_id);

-- Assessment Attempt Answers
CREATE INDEX IF NOT EXISTS idx_attempt_answers_attempt ON assessment_attempt_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_attempt_answers_question ON assessment_attempt_answers(assessment_question_id);

-- Assessment Templates
CREATE INDEX IF NOT EXISTS idx_assessment_templates_teacher ON assessment_templates(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assessment_templates_type ON assessment_templates(assessment_type);
CREATE INDEX IF NOT EXISTS idx_assessment_templates_shared ON assessment_templates(is_shared);
