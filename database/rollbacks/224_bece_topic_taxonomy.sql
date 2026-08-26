-- Roll back 224 after all BECE topic mapping rollbacks have completed.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS _rollback_224_guard (
  valid INTEGER NOT NULL CHECK (valid = 1)
);
DELETE FROM _rollback_224_guard;

INSERT INTO _rollback_224_guard(valid)
SELECT CASE WHEN
  (SELECT COUNT(*) FROM topics WHERE id IN ('topic_bece_french_vocabulary', 'topic_bece_science_methods', 'topic_bece_science_earth_space') AND ((
        id = 'topic_bece_french_vocabulary'
        AND subject_id = 'subj_bece_french'
        AND name = 'General Vocabulary and Descriptions'
        AND slug = 'general-vocabulary-and-descriptions'
        AND display_order = 8
      )
      OR (
        id = 'topic_bece_science_methods'
        AND subject_id = 'subj_bece_science'
        AND name = 'Scientific Inquiry and Technology'
        AND slug = 'scientific-inquiry-and-technology'
        AND display_order = 9
      )
      OR (
        id = 'topic_bece_science_earth_space'
        AND subject_id = 'subj_bece_science'
        AND name = 'Earth and Space Science'
        AND slug = 'earth-and-space-science'
        AND display_order = 10
      ))) = 3
  AND NOT EXISTS (SELECT 1 FROM questions WHERE topic_id IN ('topic_bece_french_vocabulary', 'topic_bece_science_methods', 'topic_bece_science_earth_space'))
THEN 1 ELSE 0 END;

DELETE FROM topics WHERE id IN ('topic_bece_french_vocabulary', 'topic_bece_science_methods', 'topic_bece_science_earth_space');

INSERT INTO _rollback_224_guard(valid)
SELECT CASE WHEN NOT EXISTS (SELECT 1 FROM topics WHERE id IN ('topic_bece_french_vocabulary', 'topic_bece_science_methods', 'topic_bece_science_earth_space'))
THEN 1 ELSE 0 END;

DROP TABLE _rollback_224_guard;
