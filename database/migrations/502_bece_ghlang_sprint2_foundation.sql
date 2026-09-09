-- 502: Foundation guard for BECE Ghanaian Language content sprint 2 (batch bece-ghlang-sprint2-001).
-- Original BrillaPrep practice content; not official WAEC or NaCCA material.
-- Also seeds the prod-canonical BECE Ghanaian Language topic rows and the WAEC
-- exam-board row for fresh baselines; INSERT OR IGNORE no-ops on prod where
-- every row already exists.
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
INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES ('topic_bece_ghlang_greetings', 'subj_bece_gh_lang', NULL, 'Greetings and Forms of Address', 'greetings-and-forms-of-address', 'Greetings, titles and respectful forms of address', NULL, NULL, 1, '2026-08-13T00:00:00.000Z');
INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES ('topic_bece_ghlang_alphabet', 'subj_bece_gh_lang', NULL, 'Alphabet and Phonetics', 'alphabet-and-phonetics', 'Letters, sounds and tone in Ghanaian languages', NULL, NULL, 2, '2026-08-13T00:00:00.000Z');
INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES ('topic_bece_ghlang_numbers', 'subj_bece_gh_lang', NULL, 'Numbers and Counting', 'numbers-and-counting', 'Cardinal and ordinal numbers, counting and basic arithmetic terms', NULL, NULL, 3, '2026-08-13T00:00:00.000Z');
INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES ('topic_bece_ghlang_family', 'subj_bece_gh_lang', NULL, 'Family and Kinship', 'family-and-kinship', 'Kinship terms, family structure and relationships', NULL, NULL, 4, '2026-08-13T00:00:00.000Z');
INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES ('topic_bece_ghlang_grammar', 'subj_bece_gh_lang', NULL, 'Grammar and Sentence Structure', 'grammar-and-sentence-structure', 'Word classes, sentence formation and usage', NULL, NULL, 5, '2026-08-13T00:00:00.000Z');
INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES ('topic_bece_ghlang_proverbs', 'subj_bece_gh_lang', NULL, 'Proverbs and Idioms', 'proverbs-and-idioms', 'Common proverbs, idioms and their meanings', NULL, NULL, 6, '2026-08-13T00:00:00.000Z');
INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES ('topic_bece_ghlang_culture', 'subj_bece_gh_lang', NULL, 'Oral Literature and Culture', 'oral-literature-and-culture', 'Folktales, songs, festivals and cultural practices', NULL, NULL, 7, '2026-08-13T00:00:00.000Z');
CREATE TABLE IF NOT EXISTS _migration_502_guard (valid INTEGER NOT NULL CHECK (valid = 1));
DELETE FROM _migration_502_guard;
INSERT INTO _migration_502_guard(valid) SELECT CASE WHEN EXISTS (SELECT 1 FROM exam_types WHERE id = 'exam_bece') AND EXISTS (SELECT 1 FROM exam_boards WHERE id = 'board_waec') AND EXISTS (SELECT 1 FROM subjects WHERE id = 'subj_bece_gh_lang' AND exam_type_id = 'exam_bece') AND (SELECT COUNT(*) FROM topics WHERE id IN ('topic_bece_ghlang_greetings', 'topic_bece_ghlang_alphabet', 'topic_bece_ghlang_numbers', 'topic_bece_ghlang_family', 'topic_bece_ghlang_grammar', 'topic_bece_ghlang_proverbs', 'topic_bece_ghlang_culture') AND subject_id = 'subj_bece_gh_lang') = 7 THEN 1 ELSE 0 END;
DROP TABLE _migration_502_guard;
