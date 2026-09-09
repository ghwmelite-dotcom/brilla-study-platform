-- 608: Foundation guard for Cambridge IGCSE Physics (0625) content sprint 3 (batch igcse-physics-sprint3-001).
-- Original BrillaPrep practice content; not official Cambridge International, WAEC or NSMQ material.
-- Re-asserts the prod-canonical IGCSE Physics topic rows (copied verbatim from
-- prod-patch 096_seed_topics_for_empty_subjects.sql) for fresh baselines;
-- INSERT OR IGNORE no-ops on prod where every row already exists.
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
INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES ('topic_igcse_physics_mechanics', 'subj_igcse_physics', NULL, 'Motion, Forces and Energy', 'motion-forces-and-energy', 'Speed, acceleration, Newton''s laws, work, energy and power', NULL, NULL, 1, '2026-08-13T00:00:00.000Z');
INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES ('topic_igcse_physics_thermal', 'subj_igcse_physics', NULL, 'Thermal Physics', 'thermal-physics', 'Kinetic model, temperature, specific heat capacity and transfer', NULL, NULL, 2, '2026-08-13T00:00:00.000Z');
INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES ('topic_igcse_physics_waves', 'subj_igcse_physics', NULL, 'Waves', 'waves', 'Properties of waves, light, sound and the electromagnetic spectrum', NULL, NULL, 3, '2026-08-13T00:00:00.000Z');
INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES ('topic_igcse_physics_electricity', 'subj_igcse_physics', NULL, 'Electricity and Magnetism', 'electricity-and-magnetism', 'Circuits, resistance, electromagnetism, motors and transformers', NULL, NULL, 4, '2026-08-13T00:00:00.000Z');
INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES ('topic_igcse_physics_nuclear', 'subj_igcse_physics', NULL, 'Nuclear Physics', 'nuclear-physics', 'Atomic structure, radioactivity, fission and fusion', NULL, NULL, 5, '2026-08-13T00:00:00.000Z');
INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES ('topic_igcse_physics_space', 'subj_igcse_physics', NULL, 'Space Physics', 'space-physics', 'The Solar System, stars, galaxies and the expanding universe', NULL, NULL, 6, '2026-08-13T00:00:00.000Z');
CREATE TABLE IF NOT EXISTS _migration_608_guard (valid INTEGER NOT NULL CHECK (valid = 1));
DELETE FROM _migration_608_guard;
INSERT INTO _migration_608_guard(valid) SELECT CASE WHEN EXISTS (SELECT 1 FROM exam_types WHERE id = 'igcse') AND EXISTS (SELECT 1 FROM exam_boards WHERE id = 'board_cambridge') AND EXISTS (SELECT 1 FROM subjects WHERE id = 'subj_igcse_physics' AND exam_type_id = 'igcse') AND (SELECT COUNT(*) FROM topics WHERE id IN ('topic_igcse_physics_mechanics', 'topic_igcse_physics_thermal', 'topic_igcse_physics_waves', 'topic_igcse_physics_electricity', 'topic_igcse_physics_nuclear', 'topic_igcse_physics_space') AND subject_id = 'subj_igcse_physics') = 6 THEN 1 ELSE 0 END;
DROP TABLE _migration_608_guard;
