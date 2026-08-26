-- 224: Add the missing canonical BECE topic taxonomy used by the reviewed mapping manifest.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS _migration_224_guard (
  valid INTEGER NOT NULL CHECK (valid = 1)
);
DELETE FROM _migration_224_guard;

INSERT INTO _migration_224_guard(valid)
SELECT CASE WHEN
  (SELECT COUNT(*) FROM subjects
   WHERE id IN ('subj_bece_french', 'subj_bece_science') AND exam_type_id = 'exam_bece' AND is_active = 1) = 2
  AND NOT EXISTS (
    SELECT 1 FROM topics
    WHERE id IN ('topic_bece_french_vocabulary', 'topic_bece_science_methods', 'topic_bece_science_earth_space')
      AND NOT ((
        id = 'topic_bece_french_vocabulary'
        AND subject_id = 'subj_bece_french'
        AND parent_id IS NULL
        AND name = 'General Vocabulary and Descriptions'
        AND slug = 'general-vocabulary-and-descriptions'
        AND description = 'Common descriptive words, colours, preferences and general expressions'
        AND display_order = 8
      )
      OR (
        id = 'topic_bece_science_methods'
        AND subject_id = 'subj_bece_science'
        AND parent_id IS NULL
        AND name = 'Scientific Inquiry and Technology'
        AND slug = 'scientific-inquiry-and-technology'
        AND description = 'Scientific method, variables, laboratory instruments and applications of technology'
        AND display_order = 9
      )
      OR (
        id = 'topic_bece_science_earth_space'
        AND subject_id = 'subj_bece_science'
        AND parent_id IS NULL
        AND name = 'Earth and Space Science'
        AND slug = 'earth-and-space-science'
        AND description = 'Earth structure, rocks, the atmosphere, the water cycle and the Solar System'
        AND display_order = 10
      ))
  )
  AND NOT EXISTS (
    SELECT 1 FROM topics
    WHERE (
        subject_id = 'subj_bece_french'
        AND slug = 'general-vocabulary-and-descriptions'
        AND id IS NOT 'topic_bece_french_vocabulary'
      )
      OR (
        subject_id = 'subj_bece_science'
        AND slug = 'scientific-inquiry-and-technology'
        AND id IS NOT 'topic_bece_science_methods'
      )
      OR (
        subject_id = 'subj_bece_science'
        AND slug = 'earth-and-space-science'
        AND id IS NOT 'topic_bece_science_earth_space'
      )
  )
THEN 1 ELSE 0 END;

INSERT OR IGNORE INTO topics
  (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at)
VALUES
  ('topic_bece_french_vocabulary', 'subj_bece_french', NULL, 'General Vocabulary and Descriptions', 'general-vocabulary-and-descriptions', 'Common descriptive words, colours, preferences and general expressions', NULL, NULL, '8', '2026-08-26T00:00:00.000Z'),
  ('topic_bece_science_methods', 'subj_bece_science', NULL, 'Scientific Inquiry and Technology', 'scientific-inquiry-and-technology', 'Scientific method, variables, laboratory instruments and applications of technology', NULL, NULL, '9', '2026-08-26T00:00:00.000Z'),
  ('topic_bece_science_earth_space', 'subj_bece_science', NULL, 'Earth and Space Science', 'earth-and-space-science', 'Earth structure, rocks, the atmosphere, the water cycle and the Solar System', NULL, NULL, '10', '2026-08-26T00:00:00.000Z');

INSERT INTO _migration_224_guard(valid)
SELECT CASE WHEN
  (SELECT COUNT(*) FROM topics WHERE id IN ('topic_bece_french_vocabulary', 'topic_bece_science_methods', 'topic_bece_science_earth_space') AND ((
        id = 'topic_bece_french_vocabulary'
        AND subject_id = 'subj_bece_french'
        AND parent_id IS NULL
        AND name = 'General Vocabulary and Descriptions'
        AND slug = 'general-vocabulary-and-descriptions'
        AND description = 'Common descriptive words, colours, preferences and general expressions'
        AND display_order = 8
      )
      OR (
        id = 'topic_bece_science_methods'
        AND subject_id = 'subj_bece_science'
        AND parent_id IS NULL
        AND name = 'Scientific Inquiry and Technology'
        AND slug = 'scientific-inquiry-and-technology'
        AND description = 'Scientific method, variables, laboratory instruments and applications of technology'
        AND display_order = 9
      )
      OR (
        id = 'topic_bece_science_earth_space'
        AND subject_id = 'subj_bece_science'
        AND parent_id IS NULL
        AND name = 'Earth and Space Science'
        AND slug = 'earth-and-space-science'
        AND description = 'Earth structure, rocks, the atmosphere, the water cycle and the Solar System'
        AND display_order = 10
      ))) = 3
THEN 1 ELSE 0 END;

DROP TABLE _migration_224_guard;
