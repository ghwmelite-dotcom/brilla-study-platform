-- Read-only post-migration checks for BECE topic remediation 224-236.
SELECT 'bece_total_questions' AS check_name, COUNT(*) AS actual, 1040 AS expected
FROM questions q JOIN subjects s ON s.id = q.subject_id
WHERE s.exam_type_id = 'exam_bece';

SELECT 'bece_null_topics' AS check_name, COUNT(*) AS actual, 0 AS expected
FROM questions q JOIN subjects s ON s.id = q.subject_id
WHERE s.exam_type_id = 'exam_bece' AND q.topic_id IS NULL;

SELECT 'bece_cross_subject_topic_links' AS check_name, COUNT(*) AS actual, 0 AS expected
FROM questions q JOIN subjects s ON s.id = q.subject_id JOIN topics t ON t.id = q.topic_id
WHERE s.exam_type_id = 'exam_bece' AND q.subject_id IS NOT t.subject_id;

SELECT 'bece_remediation_ledger_rows' AS check_name, COUNT(*) AS actual, 1040 AS expected
FROM question_bank_remediation_log
WHERE migration_id IN ('225_bece_topic_bdt', '226_bece_topic_english_part_1', '227_bece_topic_english_part_2', '228_bece_topic_french', '229_bece_topic_ict', '230_bece_topic_math_part_1', '231_bece_topic_math_part_2', '232_bece_topic_rme', '233_bece_topic_science_part_1', '234_bece_topic_science_part_2', '235_bece_topic_social_part_1', '236_bece_topic_social_part_2');

SELECT s.id AS subject_id, COUNT(*) AS questions, COUNT(q.topic_id) AS topic_bound
FROM subjects s LEFT JOIN questions q ON q.subject_id = s.id
WHERE s.exam_type_id = 'exam_bece'
GROUP BY s.id ORDER BY s.id;

SELECT t.subject_id, t.id AS topic_id, t.name, COUNT(q.id) AS questions
FROM topics t LEFT JOIN questions q ON q.topic_id = t.id
WHERE t.subject_id LIKE 'subj_bece_%'
GROUP BY t.subject_id, t.id, t.name
ORDER BY t.subject_id, t.display_order, t.id;

PRAGMA foreign_key_check;
