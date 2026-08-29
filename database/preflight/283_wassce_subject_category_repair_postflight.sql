-- Postflight for migration 283. Every statement must return zero rows.

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
SELECT m.subject_id, s.category_id, m.category_id AS expected_category_id
FROM mapping m
LEFT JOIN subjects s ON s.id = m.subject_id
WHERE s.id IS NULL OR s.category_id IS NOT m.category_id;

SELECT id, name
FROM subjects
WHERE exam_type_id = 'exam_wassce'
  AND is_active = 1
  AND category_id IS NULL;

SELECT s.id, s.category_id, sc.exam_type_id AS category_exam_type_id
FROM subjects s
JOIN subject_categories sc ON sc.id = s.category_id
WHERE s.exam_type_id = 'exam_wassce'
  AND s.is_active = 1
  AND sc.exam_type_id IS NOT s.exam_type_id;

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
SELECT l.entity_id, l.new_value, m.category_id AS expected_category_id
FROM question_bank_remediation_log l
LEFT JOIN mapping m ON m.subject_id = l.entity_id
WHERE l.migration_id = '283_wassce_subject_category_repair'
  AND (
    l.entity_type IS NOT 'subject'
    OR l.field_name IS NOT 'category_id'
    OR l.old_value IS NOT NULL
    OR m.subject_id IS NULL
    OR l.new_value IS NOT m.category_id
  );
