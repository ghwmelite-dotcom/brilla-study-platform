-- Preflight for migration 283. Every statement must return zero rows.

WITH required_categories(category_id) AS (
  VALUES
    ('cat_wassce_core'),
    ('cat_wassce_science'),
    ('cat_wassce_business'),
    ('cat_wassce_arts'),
    ('cat_wassce_technical'),
    ('cat_wassce_languages')
)
SELECT r.category_id, sc.exam_type_id
FROM required_categories r
LEFT JOIN subject_categories sc ON sc.id = r.category_id
WHERE sc.id IS NULL OR sc.exam_type_id IS NOT 'exam_wassce';

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
SELECT m.subject_id, s.exam_type_id, s.is_active, s.category_id, m.category_id AS expected_category_id
FROM mapping m
LEFT JOIN subjects s ON s.id = m.subject_id
WHERE s.id IS NULL
   OR s.exam_type_id IS NOT 'exam_wassce'
   OR s.is_active IS NOT 1
   OR (s.category_id IS NOT NULL AND s.category_id IS NOT m.category_id);

WITH mapping(subject_id) AS (
  VALUES
    ('subj_wassce_biology'), ('subj_wassce_chemistry'), ('subj_wassce_crs'),
    ('subj_wassce_core_math'), ('subj_wassce_economics'), ('subj_wassce_elect_math'),
    ('subj_wassce_english'), ('subj_wassce_accounting'), ('subj_wassce_foods'),
    ('subj_wassce_french'), ('subj_wassce_geography'), ('subj_wassce_government'),
    ('subj_wassce_history'), ('subj_wassce_ict'), ('subj_wassce_int_science'),
    ('subj_wassce_literature'), ('subj_wassce_physics'), ('subj_wassce_social'),
    ('subj_wassce_twi')
)
SELECT s.id, s.name
FROM subjects s
WHERE s.exam_type_id = 'exam_wassce'
  AND s.is_active = 1
  AND s.category_id IS NULL
  AND s.id NOT IN (SELECT subject_id FROM mapping);

SELECT s.id, s.category_id, sc.exam_type_id AS category_exam_type_id
FROM subjects s
JOIN subject_categories sc ON sc.id = s.category_id
WHERE s.exam_type_id = 'exam_wassce'
  AND s.is_active = 1
  AND sc.exam_type_id IS NOT s.exam_type_id;
