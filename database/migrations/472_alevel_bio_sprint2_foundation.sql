-- 472: Foundation guard for Cambridge A-Level Biology (9700) content sprint 2 (batch alevel-bio-sprint2-001).
-- Original BrillaPrep practice content; not official Cambridge International or WAEC material.
-- Seeds the prod-canonical topic_alevel_bio_ecology row, which exists in prod but
-- on no fresh baseline (prod-patch 096 and migration 432 predate it); INSERT OR
-- IGNORE no-ops on prod where the row already exists.
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
INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES ('topic_alevel_bio_ecology', 'subj_alevel_biology', NULL, 'Ecology and Nutrient Cycles', 'ecology-and-nutrient-cycles', 'Energy flow, productivity, nutrient cycles and population sampling', NULL, NULL, '9', '2026-09-09T00:00:00.000Z');
CREATE TABLE IF NOT EXISTS _migration_472_guard (valid INTEGER NOT NULL CHECK (valid = 1));
DELETE FROM _migration_472_guard;
INSERT INTO _migration_472_guard(valid) SELECT CASE WHEN EXISTS (SELECT 1 FROM exam_types WHERE id = 'cambridge_a2') AND EXISTS (SELECT 1 FROM exam_boards WHERE id = 'board_cambridge') AND EXISTS (SELECT 1 FROM subjects WHERE id = 'subj_alevel_biology' AND exam_type_id = 'cambridge_a2') AND (SELECT COUNT(*) FROM topics WHERE id IN ('topic_alevel_bio_ecology', 'topic_alevel_bio_cells', 'topic_alevel_bio_membranes', 'topic_alevel_bio_metabolism', 'topic_alevel_bio_genetics', 'topic_alevel_bio_homeostasis', 'topic_alevel_bio_biodiversity', 'topic_alevel_bio_biotech', 'topic_alevel_bio_immunity') AND subject_id = 'subj_alevel_biology') = 9 THEN 1 ELSE 0 END;
DROP TABLE _migration_472_guard;
