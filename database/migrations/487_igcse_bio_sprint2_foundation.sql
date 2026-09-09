-- 487: Foundation guard for Cambridge IGCSE Biology (0610) content sprint 2 (batch igcse-bio-sprint2-001).
-- Original BrillaPrep practice content; not official Cambridge International, WAEC or NSMQ material.
-- Also seeds the prod-canonical IGCSE Biology topic rows (copied from prod-patch
-- 096_seed_topics_for_empty_subjects.sql) for fresh baselines; INSERT OR IGNORE
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
INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES ('topic_igcse_bio_cells', 'subj_igcse_biology', NULL, 'Cells and Microscopy', 'cells-and-microscopy', 'Cell structure, specialised cells and microscope use', NULL, NULL, 1, '2026-08-13T00:00:00.000Z');
INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES ('topic_igcse_bio_molecules', 'subj_igcse_biology', NULL, 'Biological Molecules and Enzymes', 'biological-molecules-and-enzymes', 'Carbohydrates, proteins, lipids and enzyme action', NULL, NULL, 2, '2026-08-13T00:00:00.000Z');
INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES ('topic_igcse_bio_nutrition', 'subj_igcse_biology', NULL, 'Nutrition and Digestion', 'nutrition-and-digestion', 'Human and plant nutrition, the digestive system', NULL, NULL, 3, '2026-08-13T00:00:00.000Z');
INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES ('topic_igcse_bio_respiration', 'subj_igcse_biology', NULL, 'Respiration and Gas Exchange', 'respiration-and-gas-exchange', 'Aerobic and anaerobic respiration, breathing and gas exchange', NULL, NULL, 5, '2026-08-13T00:00:00.000Z');
INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES ('topic_igcse_bio_reproduction', 'subj_igcse_biology', NULL, 'Reproduction and Development', 'reproduction-and-development', 'Asexual and sexual reproduction in plants and humans', NULL, NULL, 6, '2026-08-13T00:00:00.000Z');
INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES ('topic_igcse_bio_genetics', 'subj_igcse_biology', NULL, 'Genetics and Inheritance', 'genetics-and-inheritance', 'DNA, genes, monohybrid inheritance and variation', NULL, NULL, 7, '2026-08-13T00:00:00.000Z');
INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES ('topic_igcse_bio_ecology', 'subj_igcse_biology', NULL, 'Ecology and Ecosystems', 'ecology-and-ecosystems', 'Food chains, nutrient cycles and human impacts', NULL, NULL, 8, '2026-08-13T00:00:00.000Z');
INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES ('topic_igcse_bio_cell_transport', 'subj_igcse_biology', NULL, 'Movement into and out of Cells', 'movement-into-and-out-of-cells', 'Diffusion, osmosis and active transport across cell membranes', NULL, NULL, 9, '2026-08-26T00:00:00.000Z');
CREATE TABLE IF NOT EXISTS _migration_487_guard (valid INTEGER NOT NULL CHECK (valid = 1));
DELETE FROM _migration_487_guard;
INSERT INTO _migration_487_guard(valid) SELECT CASE WHEN EXISTS (SELECT 1 FROM exam_types WHERE id = 'igcse') AND EXISTS (SELECT 1 FROM exam_boards WHERE id = 'board_cambridge') AND EXISTS (SELECT 1 FROM subjects WHERE id = 'subj_igcse_biology' AND exam_type_id = 'igcse') AND (SELECT COUNT(*) FROM topics WHERE id IN ('topic_igcse_bio_cells', 'topic_igcse_bio_molecules', 'topic_igcse_bio_nutrition', 'topic_igcse_bio_respiration', 'topic_igcse_bio_reproduction', 'topic_igcse_bio_genetics', 'topic_igcse_bio_ecology', 'topic_igcse_bio_cell_transport') AND subject_id = 'subj_igcse_biology') = 8 THEN 1 ELSE 0 END;
DROP TABLE _migration_487_guard;
