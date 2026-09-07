-- Migration 369: per-answer records for 3v3 team battles (Phase B).
-- The synchronized-round engine enforces one answer per member per question
-- via UNIQUE(battle_id, user_id, question_index); aggregate time_taken is the
-- score tie-breaker at completion.

CREATE TABLE IF NOT EXISTS team_battle_answers (
    id TEXT PRIMARY KEY,
    battle_id TEXT NOT NULL REFERENCES team_battles(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL,
    question_index INTEGER NOT NULL,
    answer TEXT,
    is_correct INTEGER,
    time_taken INTEGER,
    points_earned INTEGER DEFAULT 0,
    answered_at TEXT DEFAULT (datetime('now')),
    UNIQUE(battle_id, user_id, question_index)
);

CREATE INDEX IF NOT EXISTS idx_team_battle_answers_battle ON team_battle_answers(battle_id);
