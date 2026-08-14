-- Migration 094: Counselor Brie guidance foundation.
-- Safety properties:
--   * preflight the existing exam_readiness enum before rebuilding;
--   * use D1-compatible deferred foreign keys and persistent guard tables;
--   * copy columns explicitly and assert row-count parity;
--   * preserve idx_exam_readiness_user;
--   * retain learning_recommendations (it is not owned by this feature).

CREATE TABLE IF NOT EXISTS user_goals (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exam_type TEXT NOT NULL CHECK (exam_type IN (
        'wassce', 'bece', 'nsmq', 'igcse', 'cambridge_as', 'cambridge_a2',
        'edexcel_igcse', 'edexcel_as', 'edexcel_a2'
    )),
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    target_grade TEXT,
    exam_year INTEGER,
    exam_month INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, exam_type, subject_id),
    CHECK (exam_year IS NULL OR exam_year BETWEEN 2020 AND 2100),
    CHECK (exam_month IS NULL OR exam_month BETWEEN 1 AND 12)
);

CREATE TABLE IF NOT EXISTS guidance_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exam_type TEXT NOT NULL CHECK (exam_type IN (
        'wassce', 'bece', 'nsmq', 'igcse', 'cambridge_as', 'cambridge_a2',
        'edexcel_igcse', 'edexcel_as', 'edexcel_a2'
    )),
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'in_progress'
        CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
    algorithm_version TEXT NOT NULL,
    questions TEXT NOT NULL DEFAULT '{}',
    readiness_score REAL,
    completed_early INTEGER NOT NULL DEFAULT 0 CHECK (completed_early IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    completed_at TEXT
);

CREATE TABLE IF NOT EXISTS guidance_session_answers (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES guidance_sessions(id) ON DELETE CASCADE,
    ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
    question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
    user_answer TEXT NOT NULL,
    is_correct INTEGER NOT NULL CHECK (is_correct IN (0, 1)),
    time_taken INTEGER NOT NULL DEFAULT 0 CHECK (time_taken >= 0),
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),
    topic_id TEXT REFERENCES topics(id) ON DELETE SET NULL,
    idempotency_key TEXT NOT NULL,
    question_attempt_id TEXT NOT NULL UNIQUE REFERENCES question_attempts(id) ON DELETE RESTRICT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(session_id, ordinal),
    UNIQUE(session_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_user_goals_user
    ON user_goals(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_guidance_sessions_user
    ON guidance_sessions(user_id, subject_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_guidance_sessions_one_active
    ON guidance_sessions(user_id, exam_type, subject_id)
    WHERE status = 'in_progress';
CREATE INDEX IF NOT EXISTS idx_guidance_answers_session
    ON guidance_session_answers(session_id, ordinal);

PRAGMA defer_foreign_keys = ON;

CREATE TABLE _094_exam_readiness_enum_preflight (
    exam_type TEXT NOT NULL CHECK (exam_type IN (
        'wassce', 'bece', 'nsmq', 'igcse', 'cambridge_as', 'cambridge_a2',
        'edexcel_igcse', 'edexcel_as', 'edexcel_a2'
    ))
);
INSERT INTO _094_exam_readiness_enum_preflight (exam_type)
SELECT exam_type FROM exam_readiness;
DROP TABLE _094_exam_readiness_enum_preflight;

CREATE TABLE exam_readiness_new (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exam_type TEXT NOT NULL CHECK (exam_type IN (
        'wassce', 'bece', 'nsmq', 'igcse', 'cambridge_as', 'cambridge_a2',
        'edexcel_igcse', 'edexcel_as', 'edexcel_a2'
    )),
    subject_id TEXT REFERENCES subjects(id),
    readiness_score REAL DEFAULT 0,
    topics_mastered INTEGER DEFAULT 0,
    topics_total INTEGER DEFAULT 0,
    weak_topics TEXT,
    strong_topics TEXT,
    last_calculated TEXT DEFAULT (datetime('now')),
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, exam_type, subject_id)
);

INSERT INTO exam_readiness_new (
    id, user_id, exam_type, subject_id, readiness_score, topics_mastered,
    topics_total, weak_topics, strong_topics, last_calculated, created_at
)
SELECT
    id, user_id, exam_type, subject_id, readiness_score, topics_mastered,
    topics_total, weak_topics, strong_topics, last_calculated, created_at
FROM exam_readiness;

CREATE TABLE _094_exam_readiness_count_check (
    delta INTEGER NOT NULL CHECK (delta = 0)
);
INSERT INTO _094_exam_readiness_count_check (delta)
SELECT (SELECT COUNT(*) FROM exam_readiness)
     - (SELECT COUNT(*) FROM exam_readiness_new);
DROP TABLE _094_exam_readiness_count_check;

DROP TABLE exam_readiness;
ALTER TABLE exam_readiness_new RENAME TO exam_readiness;
CREATE INDEX IF NOT EXISTS idx_exam_readiness_user ON exam_readiness(user_id);

PRAGMA defer_foreign_keys = OFF;
