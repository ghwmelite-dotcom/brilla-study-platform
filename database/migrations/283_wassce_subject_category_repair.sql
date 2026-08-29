-- 283: Restore canonical category metadata lost by historical production rebuilds.
--
-- Migration 094 inserted canonical rows with INSERT OR IGNORE, so subjects that
-- already existed kept their NULL category_id values. Migration 095 restored
-- exam_type_id only. Keep this repair explicit and fail closed on any drift.

CREATE TABLE IF NOT EXISTS _migration_283_guard (
  valid INTEGER NOT NULL CHECK (valid = 1)
);
DELETE FROM _migration_283_guard;

-- Every category used by the repair must exist and belong to WASSCE.
INSERT INTO _migration_283_guard(valid)
SELECT CASE WHEN (
  SELECT COUNT(*)
  FROM subject_categories
  WHERE exam_type_id = 'exam_wassce'
    AND id IN (
      'cat_wassce_core',
      'cat_wassce_science',
      'cat_wassce_business',
      'cat_wassce_arts',
      'cat_wassce_technical',
      'cat_wassce_languages'
    )
) = 6 THEN 1 ELSE 0 END;

-- All 19 historical rows must still be active WASSCE subjects, and an existing
-- category is accepted only when it already equals the canonical assignment.
WITH mapping(subject_id, category_id) AS (
  VALUES
    ('subj_wassce_biology', 'cat_wassce_science'),
    ('subj_wassce_chemistry', 'cat_wassce_science'),
    ('subj_wassce_crs', 'cat_wassce_arts'),
    ('subj_wassce_core_math', 'cat_wassce_core'),
    ('subj_wassce_economics', 'cat_wassce_business'),
    ('subj_wassce_elect_math', 'cat_wassce_science'),
    ('subj_wassce_english', 'cat_wassce_core'),
    ('subj_wassce_accounting', 'cat_wassce_business'),
    ('subj_wassce_foods', 'cat_wassce_technical'),
    ('subj_wassce_french', 'cat_wassce_arts'),
    ('subj_wassce_geography', 'cat_wassce_arts'),
    ('subj_wassce_government', 'cat_wassce_arts'),
    ('subj_wassce_history', 'cat_wassce_arts'),
    ('subj_wassce_ict', 'cat_wassce_technical'),
    ('subj_wassce_int_science', 'cat_wassce_core'),
    ('subj_wassce_literature', 'cat_wassce_arts'),
    ('subj_wassce_physics', 'cat_wassce_science'),
    ('subj_wassce_social', 'cat_wassce_core'),
    ('subj_wassce_twi', 'cat_wassce_languages')
)
INSERT INTO _migration_283_guard(valid)
SELECT CASE WHEN
  (SELECT COUNT(*) FROM subjects s JOIN mapping m ON m.subject_id = s.id) = 19
  AND NOT EXISTS (
    SELECT 1
    FROM mapping m
    JOIN subjects s ON s.id = m.subject_id
    WHERE s.exam_type_id IS NOT 'exam_wassce'
       OR s.is_active IS NOT 1
       OR (s.category_id IS NOT NULL AND s.category_id IS NOT m.category_id)
  )
THEN 1 ELSE 0 END;

-- Do not silently ignore a newly discovered uncategorized WASSCE subject.
WITH mapping(subject_id) AS (
  VALUES
    ('subj_wassce_biology'),
    ('subj_wassce_chemistry'),
    ('subj_wassce_crs'),
    ('subj_wassce_core_math'),
    ('subj_wassce_economics'),
    ('subj_wassce_elect_math'),
    ('subj_wassce_english'),
    ('subj_wassce_accounting'),
    ('subj_wassce_foods'),
    ('subj_wassce_french'),
    ('subj_wassce_geography'),
    ('subj_wassce_government'),
    ('subj_wassce_history'),
    ('subj_wassce_ict'),
    ('subj_wassce_int_science'),
    ('subj_wassce_literature'),
    ('subj_wassce_physics'),
    ('subj_wassce_social'),
    ('subj_wassce_twi')
)
INSERT INTO _migration_283_guard(valid)
SELECT CASE WHEN NOT EXISTS (
  SELECT 1
  FROM subjects s
  WHERE s.exam_type_id = 'exam_wassce'
    AND s.is_active = 1
    AND s.category_id IS NULL
    AND s.id NOT IN (SELECT subject_id FROM mapping)
) THEN 1 ELSE 0 END;

WITH mapping(subject_id, category_id) AS (
  VALUES
    ('subj_wassce_biology', 'cat_wassce_science'),
    ('subj_wassce_chemistry', 'cat_wassce_science'),
    ('subj_wassce_crs', 'cat_wassce_arts'),
    ('subj_wassce_core_math', 'cat_wassce_core'),
    ('subj_wassce_economics', 'cat_wassce_business'),
    ('subj_wassce_elect_math', 'cat_wassce_science'),
    ('subj_wassce_english', 'cat_wassce_core'),
    ('subj_wassce_accounting', 'cat_wassce_business'),
    ('subj_wassce_foods', 'cat_wassce_technical'),
    ('subj_wassce_french', 'cat_wassce_arts'),
    ('subj_wassce_geography', 'cat_wassce_arts'),
    ('subj_wassce_government', 'cat_wassce_arts'),
    ('subj_wassce_history', 'cat_wassce_arts'),
    ('subj_wassce_ict', 'cat_wassce_technical'),
    ('subj_wassce_int_science', 'cat_wassce_core'),
    ('subj_wassce_literature', 'cat_wassce_arts'),
    ('subj_wassce_physics', 'cat_wassce_science'),
    ('subj_wassce_social', 'cat_wassce_core'),
    ('subj_wassce_twi', 'cat_wassce_languages')
)
INSERT OR IGNORE INTO question_bank_remediation_log
  (migration_id, entity_type, entity_id, field_name, old_value, new_value)
SELECT
  '283_wassce_subject_category_repair',
  'subject',
  s.id,
  'category_id',
  s.category_id,
  m.category_id
FROM subjects s
JOIN mapping m ON m.subject_id = s.id
WHERE s.category_id IS NULL;

WITH mapping(subject_id, category_id) AS (
  VALUES
    ('subj_wassce_biology', 'cat_wassce_science'),
    ('subj_wassce_chemistry', 'cat_wassce_science'),
    ('subj_wassce_crs', 'cat_wassce_arts'),
    ('subj_wassce_core_math', 'cat_wassce_core'),
    ('subj_wassce_economics', 'cat_wassce_business'),
    ('subj_wassce_elect_math', 'cat_wassce_science'),
    ('subj_wassce_english', 'cat_wassce_core'),
    ('subj_wassce_accounting', 'cat_wassce_business'),
    ('subj_wassce_foods', 'cat_wassce_technical'),
    ('subj_wassce_french', 'cat_wassce_arts'),
    ('subj_wassce_geography', 'cat_wassce_arts'),
    ('subj_wassce_government', 'cat_wassce_arts'),
    ('subj_wassce_history', 'cat_wassce_arts'),
    ('subj_wassce_ict', 'cat_wassce_technical'),
    ('subj_wassce_int_science', 'cat_wassce_core'),
    ('subj_wassce_literature', 'cat_wassce_arts'),
    ('subj_wassce_physics', 'cat_wassce_science'),
    ('subj_wassce_social', 'cat_wassce_core'),
    ('subj_wassce_twi', 'cat_wassce_languages')
)
UPDATE subjects
SET category_id = (
  SELECT m.category_id FROM mapping m WHERE m.subject_id = subjects.id
)
WHERE category_id IS NULL
  AND id IN (SELECT subject_id FROM mapping);

-- Final guards: the canonical rows match, all active WASSCE subjects are
-- categorized, and every category belongs to the same exam type.
WITH mapping(subject_id, category_id) AS (
  VALUES
    ('subj_wassce_biology', 'cat_wassce_science'),
    ('subj_wassce_chemistry', 'cat_wassce_science'),
    ('subj_wassce_crs', 'cat_wassce_arts'),
    ('subj_wassce_core_math', 'cat_wassce_core'),
    ('subj_wassce_economics', 'cat_wassce_business'),
    ('subj_wassce_elect_math', 'cat_wassce_science'),
    ('subj_wassce_english', 'cat_wassce_core'),
    ('subj_wassce_accounting', 'cat_wassce_business'),
    ('subj_wassce_foods', 'cat_wassce_technical'),
    ('subj_wassce_french', 'cat_wassce_arts'),
    ('subj_wassce_geography', 'cat_wassce_arts'),
    ('subj_wassce_government', 'cat_wassce_arts'),
    ('subj_wassce_history', 'cat_wassce_arts'),
    ('subj_wassce_ict', 'cat_wassce_technical'),
    ('subj_wassce_int_science', 'cat_wassce_core'),
    ('subj_wassce_literature', 'cat_wassce_arts'),
    ('subj_wassce_physics', 'cat_wassce_science'),
    ('subj_wassce_social', 'cat_wassce_core'),
    ('subj_wassce_twi', 'cat_wassce_languages')
)
INSERT INTO _migration_283_guard(valid)
SELECT CASE WHEN NOT EXISTS (
  SELECT 1
  FROM mapping m
  LEFT JOIN subjects s ON s.id = m.subject_id
  WHERE s.id IS NULL OR s.category_id IS NOT m.category_id
) THEN 1 ELSE 0 END;

INSERT INTO _migration_283_guard(valid)
SELECT CASE WHEN NOT EXISTS (
  SELECT 1
  FROM subjects s
  WHERE s.exam_type_id = 'exam_wassce'
    AND s.is_active = 1
    AND s.category_id IS NULL
) THEN 1 ELSE 0 END;

INSERT INTO _migration_283_guard(valid)
SELECT CASE WHEN NOT EXISTS (
  SELECT 1
  FROM subjects s
  JOIN subject_categories sc ON sc.id = s.category_id
  WHERE s.exam_type_id = 'exam_wassce'
    AND s.is_active = 1
    AND sc.exam_type_id IS NOT s.exam_type_id
) THEN 1 ELSE 0 END;

DROP TABLE _migration_283_guard;
