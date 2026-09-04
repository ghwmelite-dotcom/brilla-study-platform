-- Migration 361: real marking for paper attempts.
-- Additive marking columns on paper_attempt_answers (NULL for objective
-- questions; lifecycle pending → graded | marking_failed), and a rebuild of
-- paper_attempts to relax the status CHECK with 'partially_graded'.
-- Rebuild pattern: 092_users_parent_role.sql (FK enforcement off so the
-- rename doesn't rewrite the child tables that reference paper_attempts(id)).

ALTER TABLE paper_attempt_answers ADD COLUMN ai_score REAL;
ALTER TABLE paper_attempt_answers ADD COLUMN ai_feedback TEXT;
ALTER TABLE paper_attempt_answers ADD COLUMN marking_status TEXT DEFAULT NULL
  CHECK (marking_status IN ('pending', 'graded', 'marking_failed'));

PRAGMA foreign_keys = OFF;

CREATE TABLE paper_attempts_m361 (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    paper_id TEXT NOT NULL REFERENCES past_papers(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'graded', 'partially_graded', 'abandoned')),
    started_at TEXT DEFAULT (datetime('now')),
    time_allowed INTEGER,
    time_used INTEGER,
    submitted_at TEXT,
    total_score INTEGER,
    max_score INTEGER,
    percentage REAL,
    grade TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    is_demo_data INTEGER DEFAULT 0,
    expires_at TEXT
);

INSERT INTO paper_attempts_m361 (
    id, user_id, paper_id, status, started_at, time_allowed, time_used,
    submitted_at, total_score, max_score, percentage, grade, created_at,
    is_demo_data, expires_at
)
SELECT
    id, user_id, paper_id,
    -- Legacy 'completed' (20 rows in prod, written by the pre-marking submit
    -- path) maps to 'graded'; the relaxed CHECK rejects it otherwise.
    CASE WHEN status = 'completed' THEN 'graded' ELSE status END,
    started_at, time_allowed, time_used,
    submitted_at, total_score, max_score, percentage, grade, created_at,
    is_demo_data, expires_at
FROM paper_attempts;

DROP TABLE paper_attempts;
ALTER TABLE paper_attempts_m361 RENAME TO paper_attempts;

-- Recreate the secondary indexes (schema.sql:5057-5060).
CREATE INDEX idx_paper_attempts_user ON paper_attempts(user_id);
CREATE INDEX idx_paper_attempts_paper ON paper_attempts(paper_id);
CREATE INDEX idx_paper_attempts_status ON paper_attempts(status);
CREATE INDEX idx_paper_attempts_demo ON paper_attempts(is_demo_data, expires_at);

PRAGMA foreign_keys = ON;
