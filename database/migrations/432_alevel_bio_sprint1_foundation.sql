-- 432: Foundation guard for Cambridge A-Level Biology (9700) content sprint 1 (batch alevel-bio-sprint1-001).
-- Original BrillaPrep practice content; not official Cambridge International or WAEC material.
-- Also seeds the prod-canonical A-Level Biology topic rows for fresh baselines
-- (topic_alevel_bio_immunity is absent from prod-patch 096); INSERT OR IGNORE
-- no-ops on prod where every row already exists.
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
INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES ('topic_alevel_bio_cells', 'subj_alevel_biology', NULL, 'Cells and Biological Molecules', 'cells-and-biological-molecules', 'Ultrastructure, microscopy and the chemistry of life', NULL, NULL, 1, '2026-08-13T00:00:00.000Z');
INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES ('topic_alevel_bio_membranes', 'subj_alevel_biology', NULL, 'Membranes and Transport', 'membranes-and-transport', 'Membrane structure, transport mechanisms and gas exchange', NULL, NULL, 2, '2026-08-13T00:00:00.000Z');
INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES ('topic_alevel_bio_metabolism', 'subj_alevel_biology', NULL, 'Metabolism: Respiration and Photosynthesis', 'metabolism-respiration-photosynthesis', 'ATP, respiration pathways and photosynthesis', NULL, NULL, 3, '2026-08-13T00:00:00.000Z');
INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES ('topic_alevel_bio_genetics', 'subj_alevel_biology', NULL, 'Genetics, Inheritance and Evolution', 'genetics-inheritance-evolution', 'DNA, protein synthesis, inheritance patterns and selection', NULL, NULL, 4, '2026-08-13T00:00:00.000Z');
INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES ('topic_alevel_bio_homeostasis', 'subj_alevel_biology', NULL, 'Control and Homeostasis', 'control-and-homeostasis', 'Nervous and hormonal control, kidney function and homeostasis', NULL, NULL, 5, '2026-08-13T00:00:00.000Z');
INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES ('topic_alevel_bio_biodiversity', 'subj_alevel_biology', NULL, 'Biodiversity and Conservation', 'biodiversity-and-conservation', 'Classification, biodiversity and conservation strategies', NULL, NULL, 6, '2026-08-13T00:00:00.000Z');
INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES ('topic_alevel_bio_biotech', 'subj_alevel_biology', NULL, 'Biotechnology and Gene Technology', 'biotechnology-and-gene-technology', 'Genetic engineering, PCR and applications of biotechnology', NULL, NULL, 7, '2026-08-13T00:00:00.000Z');
INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES ('topic_alevel_bio_immunity', 'subj_alevel_biology', NULL, 'Immunity', 'immunity', 'Antigens, immune responses, memory cells and vaccination', NULL, NULL, 8, '2026-08-26T00:00:00.000Z');
CREATE TABLE IF NOT EXISTS _migration_432_guard (valid INTEGER NOT NULL CHECK (valid = 1));
DELETE FROM _migration_432_guard;
INSERT INTO _migration_432_guard(valid) SELECT CASE WHEN EXISTS (SELECT 1 FROM exam_types WHERE id = 'cambridge_a2') AND EXISTS (SELECT 1 FROM exam_boards WHERE id = 'board_cambridge') AND EXISTS (SELECT 1 FROM subjects WHERE id = 'subj_alevel_biology' AND exam_type_id = 'cambridge_a2') AND (SELECT COUNT(*) FROM topics WHERE id IN ('topic_alevel_bio_cells', 'topic_alevel_bio_membranes', 'topic_alevel_bio_metabolism', 'topic_alevel_bio_genetics', 'topic_alevel_bio_homeostasis', 'topic_alevel_bio_biodiversity', 'topic_alevel_bio_biotech', 'topic_alevel_bio_immunity') AND subject_id = 'subj_alevel_biology') = 8 THEN 1 ELSE 0 END;
DROP TABLE _migration_432_guard;
