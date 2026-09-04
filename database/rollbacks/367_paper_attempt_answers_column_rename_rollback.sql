-- Rollback for 367_paper_attempt_answers_column_rename.sql: restore the
-- pre-367 legacy shape (attempt_id / answer_text, no demo columns).
-- Rebuild pattern: 361_mock_real_marking.sql.

PRAGMA foreign_keys = OFF;

CREATE TABLE paper_attempt_answers_r367 (
    id TEXT PRIMARY KEY,
    attempt_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    answer_text TEXT,
    is_correct INTEGER,
    time_taken INTEGER,
    marks_earned INTEGER DEFAULT 0,
    answered_at TEXT DEFAULT (datetime('now')),
    ai_score REAL,
    ai_feedback TEXT,
    marking_status TEXT DEFAULT NULL
      CHECK (marking_status IN ('pending', 'graded', 'marking_failed')),
    UNIQUE(attempt_id, question_id)
);

INSERT INTO paper_attempt_answers_r367 (
    id, attempt_id, question_id, answer_text, is_correct, time_taken,
    marks_earned, answered_at, ai_score, ai_feedback, marking_status
)
SELECT
    id, paper_attempt_id, question_id, user_answer, is_correct, time_taken,
    marks_earned, answered_at, ai_score, ai_feedback, marking_status
FROM paper_attempt_answers;

DROP TABLE paper_attempt_answers;
ALTER TABLE paper_attempt_answers_r367 RENAME TO paper_attempt_answers;

CREATE INDEX idx_paper_attempt_answers_question ON paper_attempt_answers(question_id);

PRAGMA foreign_keys = ON;
