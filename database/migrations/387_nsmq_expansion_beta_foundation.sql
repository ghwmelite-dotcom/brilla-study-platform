-- 387: Foundation guard for NSMQ question bank expansion beta batch 001.
-- Original BrillaPrep practice content; not official NSMQ (Primetime) material.
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS question_content_releases (
    question_id TEXT PRIMARY KEY REFERENCES questions(id) ON DELETE CASCADE,
    batch_id TEXT NOT NULL,
    quality_assurance TEXT NOT NULL CHECK (quality_assurance IN ('automated_beta', 'human_reviewed')),
    release_channel TEXT NOT NULL CHECK (release_channel IN ('beta', 'production')),
    content_label TEXT NOT NULL,
    source_url TEXT NOT NULL,
    official_exam_board_content INTEGER NOT NULL DEFAULT 0 CHECK (official_exam_board_content IN (0, 1)),
    feedback_enabled INTEGER NOT NULL DEFAULT 1 CHECK (feedback_enabled IN (0, 1)),
    released_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
CREATE INDEX IF NOT EXISTS idx_question_content_releases_batch ON question_content_releases(batch_id);
CREATE TABLE IF NOT EXISTS _migration_387_guard (valid INTEGER NOT NULL CHECK (valid = 1));
DELETE FROM _migration_387_guard;
INSERT INTO _migration_387_guard(valid) SELECT CASE WHEN EXISTS (SELECT 1 FROM exam_types WHERE id = 'exam_nsmq') AND (SELECT COUNT(*) FROM subjects WHERE id IN ('subj_nsmq_math', 'subj_nsmq_physics', 'subj_nsmq_chemistry', 'subj_nsmq_biology') AND exam_type_id = 'exam_nsmq') = 4 AND (SELECT COUNT(*) FROM topics WHERE id IN ('topic_algebra', 'topic_quadratic', 'topic_geometry', 'topic_trigonometry', 'topic_statistics', 'topic_calculus', 'topic_mechanics', 'topic_kinematics', 'topic_electricity', 'topic_waves', 'topic_thermodynamics', 'topic_modern_physics', 'topic_atomic', 'topic_bonding', 'topic_stoichiometry', 'topic_equilibrium', 'topic_organic', 'topic_electrochemistry', 'topic_cells', 'topic_genetics', 'topic_ecology', 'topic_physiology', 'topic_biochemistry')) = 23 THEN 1 ELSE 0 END;
DROP TABLE _migration_387_guard;
