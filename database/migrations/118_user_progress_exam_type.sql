-- Bring legacy production user_progress tables in line with the canonical
-- exam-aware progress contract used by workers/api/attempt-progress.ts.
-- Rebuilding is required because SQLite cannot replace the legacy
-- UNIQUE(user_id, topic_id) constraint with the canonical three-column key.

CREATE TABLE user_progress_m118 (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    exam_type_id TEXT REFERENCES exam_types(id),
    questions_attempted INTEGER DEFAULT 0,
    questions_correct INTEGER DEFAULT 0,
    mastery_level INTEGER DEFAULT 0,
    last_attempt_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    is_demo_data INTEGER DEFAULT 0,
    expires_at TEXT,
    UNIQUE(user_id, topic_id, exam_type_id)
);

INSERT INTO user_progress_m118 (
    id, user_id, topic_id, exam_type_id, questions_attempted,
    questions_correct, mastery_level, last_attempt_at, created_at,
    updated_at, is_demo_data, expires_at
)
SELECT
    up.id,
    up.user_id,
    up.topic_id,
    (
        SELECT s.exam_type_id
        FROM topics t
        JOIN subjects s ON s.id = t.subject_id
        WHERE t.id = up.topic_id
    ),
    up.questions_attempted,
    up.questions_correct,
    up.mastery_level,
    up.last_attempt_at,
    up.created_at,
    up.updated_at,
    up.is_demo_data,
    up.expires_at
FROM user_progress up;

DROP TABLE user_progress;
ALTER TABLE user_progress_m118 RENAME TO user_progress;

CREATE INDEX IF NOT EXISTS idx_user_progress_user ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_topic ON user_progress(topic_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_exam ON user_progress(exam_type_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_demo ON user_progress(is_demo_data, expires_at);
