-- 412: Foundation guard for WASSCE Integrated Science content sprint 1 batch 001.
-- Original BrillaPrep practice content; not official WAEC examination material.
-- Re-asserts the prod-canonical topic rows (from prod-patch 096 and migration 365) with
-- INSERT OR IGNORE so fresh baselines and prod both satisfy the question FK/trigger checks.
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
INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES ('topic_wassce_p2_sci_eco', 'subj_wassce_int_science', NULL, 'Ecosystems', 'wassce-p2-sci-eco', 'Describe ecosystem components and construct food chains that show energy flow between organisms.', NULL, NULL, 1, '2026-08-04T00:00:00.000Z');
INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES ('topic_wassce_p2_sci_mat', 'subj_wassce_int_science', NULL, 'Matter and mixtures', 'wassce-p2-sci-mat', 'Select and justify physical separation techniques for the components of common mixtures.', NULL, NULL, 2, '2026-08-04T00:00:00.000Z');
INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES ('topic_wassce_p2_sci_enr', 'subj_wassce_int_science', NULL, 'Electricity and energy', 'wassce-p2-sci-enr', 'Analyse simple series circuits, relating current, resistance and lamp brightness quantitatively.', NULL, NULL, 3, '2026-08-04T00:00:00.000Z');
INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES ('topic_wassce_p2_sci_bio', 'subj_wassce_int_science', NULL, 'Human digestion', 'wassce-p2-sci-bio', 'Explain the stages of human digestion, naming the enzymes and organs responsible at each stage.', NULL, NULL, 4, '2026-08-04T00:00:00.000Z');
INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES ('topic_wassce_p2_sci_hlt', 'subj_wassce_int_science', NULL, 'Disease and health', 'wassce-p2-sci-hlt', 'Explain the transmission, symptoms and prevention of common communicable diseases in Ghana.', NULL, NULL, 6, '2026-08-04T00:00:00.000Z');
INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES ('topic_wassce_intsci_reproduction', 'subj_wassce_int_science', NULL, 'Reproduction and Heredity', 'wassce-intsci-reproduction', 'Reproduction in plants and animals, growth and basic genetics', NULL, NULL, 3, '2026-08-04T00:00:00.000Z');
CREATE TABLE IF NOT EXISTS _migration_412_guard (valid INTEGER NOT NULL CHECK (valid = 1));
DELETE FROM _migration_412_guard;
INSERT INTO _migration_412_guard(valid) SELECT CASE WHEN EXISTS (SELECT 1 FROM exam_types WHERE id = 'exam_wassce') AND EXISTS (SELECT 1 FROM subjects WHERE id = 'subj_wassce_int_science' AND exam_type_id = 'exam_wassce') AND (SELECT COUNT(*) FROM topics t JOIN subjects s ON s.id = t.subject_id WHERE t.id IN ('topic_wassce_p2_sci_eco', 'topic_wassce_p2_sci_mat', 'topic_wassce_p2_sci_enr', 'topic_wassce_p2_sci_bio', 'topic_wassce_p2_sci_hlt', 'topic_wassce_intsci_reproduction') AND s.id = 'subj_wassce_int_science' AND s.exam_type_id = 'exam_wassce') = 6 THEN 1 ELSE 0 END;
DROP TABLE _migration_412_guard;
