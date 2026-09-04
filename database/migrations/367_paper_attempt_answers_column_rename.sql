-- Migration 367: rebuild paper_attempt_answers to the canonical schema.sql shape.
-- Prod's table predates the column rename (schema.sql, 2025-12): it still has
-- attempt_id / answer_text and lacks is_demo_data / expires_at, while the API
-- has written paper_attempt_id / user_answer since #29 (2026-08-24). Every
-- answer save on prod has failed with "no such column: paper_attempt_id"
-- since then (last successful write 2026-08-23). Staging was bootstrapped
-- from the new schema and must record this migration WITHOUT running it
-- (its table has no attempt_id column to copy from).
-- Rebuild pattern: 361_mock_real_marking.sql (FK enforcement off).

PRAGMA foreign_keys = OFF;

CREATE TABLE paper_attempt_answers_m367 (
    id TEXT PRIMARY KEY,
    paper_attempt_id TEXT NOT NULL REFERENCES paper_attempts(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    user_answer TEXT,
    is_correct INTEGER,
    time_taken INTEGER,
    marks_earned INTEGER DEFAULT 0,
    answered_at TEXT DEFAULT (datetime('now')),
    is_demo_data INTEGER DEFAULT 0,
    expires_at TEXT,
    ai_score REAL,
    ai_feedback TEXT,
    marking_status TEXT DEFAULT NULL
      CHECK (marking_status IN ('pending', 'graded', 'marking_failed')),
    UNIQUE(paper_attempt_id, question_id)
);

INSERT INTO paper_attempt_answers_m367 (
    id, paper_attempt_id, question_id, user_answer, is_correct, time_taken,
    marks_earned, answered_at, is_demo_data, expires_at,
    ai_score, ai_feedback, marking_status
)
-- Orphan rows (attempt_id pointing at a deleted paper_attempts row, or a
-- deleted question) are unreachable and must be excluded: wrangler applies
-- migrations inside a transaction, where PRAGMA foreign_keys = OFF is a
-- no-op, so copying them would abort the rebuild with SQLITE_CONSTRAINT.
-- Prod on 2026-09-04: 1402 orphan answers of 2306 total, 0 orphan questions.
SELECT
    id, attempt_id, question_id, answer_text, is_correct, time_taken,
    marks_earned, answered_at, 0, NULL,
    ai_score, ai_feedback, marking_status
FROM paper_attempt_answers
WHERE attempt_id IN (SELECT id FROM paper_attempts)
  AND question_id IN (SELECT id FROM questions);

DROP TABLE paper_attempt_answers;
ALTER TABLE paper_attempt_answers_m367 RENAME TO paper_attempt_answers;

-- Recreate the secondary indexes (schema.sql:5143-5146, migration 103).
CREATE INDEX idx_paper_attempt_answers_attempt ON paper_attempt_answers(paper_attempt_id);
CREATE INDEX idx_paper_attempt_answers_demo ON paper_attempt_answers(is_demo_data, expires_at);
CREATE INDEX idx_paper_attempt_answers_question ON paper_attempt_answers(question_id);

PRAGMA foreign_keys = ON;
