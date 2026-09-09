-- 618: Foundation guard for BECE Integrated Science sprint 3 beta batch (bece-int-science-sprint3-001).
-- Original BrillaPrep practice content; not official WAEC or NaCCA examination material.
-- Re-asserts the prod-canonical topic rows for subj_bece_science on scratch
-- baselines; INSERT OR IGNORE no-ops on prod and on fresh baselines where the
-- rows already exist (prod patches 094/095/096).
PRAGMA foreign_keys = ON;
INSERT OR IGNORE INTO exam_boards (id, name, code, full_name, region, website_url, is_active, display_order) VALUES ('board_waec', 'WAEC', 'WAEC', 'West African Examinations Council', 'West Africa', 'https://waecgh.org/', 1, 1);
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
INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES ('topic_bece_science_cells', 'subj_bece_science', NULL, 'Cells and Living Organisms', 'cells-and-living-organisms', 'Cell structure, classification and characteristics of living things', NULL, NULL, 1, '2026-08-13T00:00:00.000Z');
INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES ('topic_bece_science_body', 'subj_bece_science', NULL, 'Human Body Systems', 'human-body-systems', 'Digestive, circulatory, respiratory and reproductive systems', NULL, NULL, 2, '2026-08-13T00:00:00.000Z');
INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES ('topic_bece_science_matter', 'subj_bece_science', NULL, 'Matter and Its States', 'matter-and-its-states', 'Particles, states of matter, elements, mixtures and separation', NULL, NULL, 3, '2026-08-13T00:00:00.000Z');
INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES ('topic_bece_science_energy', 'subj_bece_science', NULL, 'Energy and Its Forms', 'energy-and-its-forms', 'Forms, sources, transformation and conservation of energy', NULL, NULL, 4, '2026-08-13T00:00:00.000Z');
INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES ('topic_bece_science_electricity', 'subj_bece_science', NULL, 'Electricity and Magnetism', 'electricity-and-magnetism', 'Simple circuits, conductors, insulators and magnets', NULL, NULL, 5, '2026-08-13T00:00:00.000Z');
INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES ('topic_bece_science_machines', 'subj_bece_science', NULL, 'Force, Work and Machines', 'force-work-and-machines', 'Types of forces, work, energy and simple machines', NULL, NULL, 6, '2026-08-13T00:00:00.000Z');
INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES ('topic_bece_science_agric', 'subj_bece_science', NULL, 'Agriculture and Food Production', 'agriculture-and-food-production', 'Soil, crops, farm animals and food preservation', NULL, NULL, 7, '2026-08-13T00:00:00.000Z');
INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES ('topic_bece_science_health', 'subj_bece_science', NULL, 'Health, Sanitation and Environment', 'health-sanitation-and-environment', 'Personal hygiene, diseases, waste management and ecosystems', NULL, NULL, 8, '2026-08-13T00:00:00.000Z');
INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES ('topic_bece_science_methods', 'subj_bece_science', NULL, 'Scientific Inquiry and Technology', 'scientific-inquiry-and-technology', 'Scientific method, variables, laboratory instruments and applications of technology', NULL, NULL, 9, '2026-08-13T00:00:00.000Z');
INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES ('topic_bece_science_earth_space', 'subj_bece_science', NULL, 'Earth and Space Science', 'earth-and-space-science', 'Earth structure, rocks, the atmosphere, the water cycle and the Solar System', NULL, NULL, 10, '2026-08-13T00:00:00.000Z');
CREATE TABLE IF NOT EXISTS _migration_618_guard (valid INTEGER NOT NULL CHECK (valid = 1));
DELETE FROM _migration_618_guard;
INSERT INTO _migration_618_guard(valid) SELECT CASE WHEN EXISTS (SELECT 1 FROM exam_types WHERE id = 'exam_bece') AND EXISTS (SELECT 1 FROM exam_boards WHERE id = 'board_waec') AND EXISTS (SELECT 1 FROM subjects WHERE id = 'subj_bece_science' AND exam_type_id = 'exam_bece') AND (SELECT COUNT(*) FROM topics t JOIN subjects s ON s.id = t.subject_id WHERE t.id IN ('topic_bece_science_cells', 'topic_bece_science_body', 'topic_bece_science_matter', 'topic_bece_science_energy', 'topic_bece_science_electricity', 'topic_bece_science_machines', 'topic_bece_science_agric', 'topic_bece_science_health', 'topic_bece_science_methods', 'topic_bece_science_earth_space') AND t.subject_id = 'subj_bece_science' AND s.exam_type_id = 'exam_bece') = 10 THEN 1 ELSE 0 END;
DROP TABLE _migration_618_guard;
