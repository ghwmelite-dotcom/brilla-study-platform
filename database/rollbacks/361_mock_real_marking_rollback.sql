-- Rollback 361. Run only after the Worker no longer reads or writes
-- ai_score/ai_feedback/marking_status and never sets 'partially_graded'.
-- Any attempt already in 'partially_graded' is mapped back to 'submitted'
-- before the CHECK is re-tightened so the copy cannot fail.

PRAGMA foreign_keys = OFF;

UPDATE paper_attempts SET status = 'submitted' WHERE status = 'partially_graded';

CREATE TABLE paper_attempts_r361 (
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
    created_at TEXT DEFAULT (datetime('now')),
    is_demo_data INTEGER DEFAULT 0,
    expires_at TEXT
);

INSERT INTO paper_attempts_r361 (
    id, user_id, paper_id, status, started_at, time_allowed, time_used,
    submitted_at, total_score, max_score, percentage, grade, created_at,
    is_demo_data, expires_at
)
SELECT
    id, user_id, paper_id, status, started_at, time_allowed, time_used,
    submitted_at, total_score, max_score, percentage, grade, created_at,
    is_demo_data, expires_at
FROM paper_attempts;

DROP TABLE paper_attempts;
ALTER TABLE paper_attempts_r361 RENAME TO paper_attempts;

CREATE INDEX idx_paper_attempts_user ON paper_attempts(user_id);
CREATE INDEX idx_paper_attempts_paper ON paper_attempts(paper_id);
CREATE INDEX idx_paper_attempts_status ON paper_attempts(status);
CREATE INDEX idx_paper_attempts_demo ON paper_attempts(is_demo_data, expires_at);

PRAGMA foreign_keys = ON;

ALTER TABLE paper_attempt_answers DROP COLUMN marking_status;
ALTER TABLE paper_attempt_answers DROP COLUMN ai_feedback;
ALTER TABLE paper_attempt_answers DROP COLUMN ai_score;
