-- 227: Assign reviewed BECE subj_bece_english questions to canonical same-subject topics.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS _migration_227_guard (valid INTEGER NOT NULL CHECK (valid = 1));
DELETE FROM _migration_227_guard;
CREATE TABLE IF NOT EXISTS _migration_227_map (
  question_id TEXT PRIMARY KEY,
  topic_id TEXT NOT NULL
);
DELETE FROM _migration_227_map;
INSERT INTO _migration_227_map(question_id, topic_id) VALUES
  ('q_bece_eng_2024_015', 'topic_bece_english_grammar'),
  ('q_bece_eng_2024_016', 'topic_bece_english_grammar'),
  ('q_bece_eng_2024_017', 'topic_bece_english_grammar'),
  ('q_bece_eng_2024_018', 'topic_bece_english_grammar'),
  ('q_bece_eng_2024_019', 'topic_bece_english_grammar'),
  ('q_bece_eng_2024_02', 'topic_bece_english_grammar'),
  ('q_bece_eng_2024_020', 'topic_bece_english_grammar'),
  ('q_bece_eng_2024_021', 'topic_bece_english_grammar'),
  ('q_bece_eng_2024_022', 'topic_bece_english_grammar'),
  ('q_bece_eng_2024_023', 'topic_bece_english_grammar'),
  ('q_bece_eng_2024_024', 'topic_bece_english_grammar'),
  ('q_bece_eng_2024_025', 'topic_bece_english_grammar'),
  ('q_bece_eng_2024_026', 'topic_bece_english_grammar'),
  ('q_bece_eng_2024_027', 'topic_bece_english_grammar'),
  ('q_bece_eng_2024_028', 'topic_bece_english_grammar'),
  ('q_bece_eng_2024_029', 'topic_bece_english_grammar'),
  ('q_bece_eng_2024_03', 'topic_bece_english_grammar'),
  ('q_bece_eng_2024_030', 'topic_bece_english_vocabulary'),
  ('q_bece_eng_2024_031', 'topic_bece_english_grammar'),
  ('q_bece_eng_2024_032', 'topic_bece_english_grammar'),
  ('q_bece_eng_2024_033', 'topic_bece_english_vocabulary'),
  ('q_bece_eng_2024_034', 'topic_bece_english_grammar'),
  ('q_bece_eng_2024_035', 'topic_bece_english_grammar'),
  ('q_bece_eng_2024_036', 'topic_bece_english_grammar'),
  ('q_bece_eng_2024_037', 'topic_bece_english_literature'),
  ('q_bece_eng_2024_038', 'topic_bece_english_grammar'),
  ('q_bece_eng_2024_039', 'topic_bece_english_grammar'),
  ('q_bece_eng_2024_04', 'topic_bece_english_grammar'),
  ('q_bece_eng_2024_040', 'topic_bece_english_vocabulary'),
  ('q_bece_eng_2024_05', 'topic_bece_english_grammar'),
  ('q_bece_eng_2024_06', 'topic_bece_english_grammar'),
  ('q_bece_eng_2024_07', 'topic_bece_english_grammar'),
  ('q_bece_eng_2024_08', 'topic_bece_english_grammar'),
  ('q_bece_eng_2024_09', 'topic_bece_english_grammar'),
  ('q_bece_eng_2024_10', 'topic_bece_english_grammar'),
  ('q_bece_eng_2024_11', 'topic_bece_english_grammar'),
  ('q_bece_eng_2024_12', 'topic_bece_english_grammar'),
  ('q_bece_eng_2024_13', 'topic_bece_english_grammar'),
  ('q_bece_eng_2024_14', 'topic_bece_english_grammar'),
  ('q_bece_eng_2024_15', 'topic_bece_english_grammar'),
  ('q_bece_eng_2024_16', 'topic_bece_english_vocabulary'),
  ('q_bece_eng_2024_17', 'topic_bece_english_vocabulary'),
  ('q_bece_eng_2024_18', 'topic_bece_english_vocabulary'),
  ('q_bece_eng_2024_19', 'topic_bece_english_vocabulary'),
  ('q_bece_eng_2024_20', 'topic_bece_english_vocabulary'),
  ('q_bece_eng_2024_21', 'topic_bece_english_vocabulary'),
  ('q_bece_eng_2024_22', 'topic_bece_english_vocabulary'),
  ('q_bece_eng_2024_23', 'topic_bece_english_vocabulary'),
  ('q_bece_eng_2024_24', 'topic_bece_english_vocabulary'),
  ('q_bece_eng_2024_25', 'topic_bece_english_vocabulary'),
  ('q_bece_eng_2024_26', 'topic_bece_english_comprehension'),
  ('q_bece_eng_2024_27', 'topic_bece_english_vocabulary'),
  ('q_bece_eng_2024_28', 'topic_bece_english_literature'),
  ('q_bece_eng_2024_29', 'topic_bece_english_letter'),
  ('q_bece_eng_2024_30', 'topic_bece_english_composition'),
  ('q_bece_eng_2024_31', 'topic_bece_english_literature'),
  ('q_bece_eng_2024_32', 'topic_bece_english_composition'),
  ('q_bece_eng_2024_33', 'topic_bece_english_letter'),
  ('q_bece_eng_2024_34', 'topic_bece_english_literature'),
  ('q_bece_eng_2024_35', 'topic_bece_english_literature'),
  ('q_bece_eng_2024_36', 'topic_bece_english_letter'),
  ('q_bece_eng_2024_37', 'topic_bece_english_letter'),
  ('q_bece_eng_2024_38', 'topic_bece_english_composition'),
  ('q_bece_eng_2024_39', 'topic_bece_english_composition'),
  ('q_bece_eng_2024_40', 'topic_bece_english_letter'),
  ('q_bece_essay_001', 'topic_bece_english_letter'),
  ('q_bece_essay_002', 'topic_bece_english_composition'),
  ('q_bece_essay_003', 'topic_bece_english_composition'),
  ('q_bece_essay_004', 'topic_bece_english_letter'),
  ('q_bece_essay_005', 'topic_bece_english_composition'),
  ('q_bece_gram_001', 'topic_bece_english_grammar'),
  ('q_bece_gram_002', 'topic_bece_english_grammar'),
  ('q_bece_gram_003', 'topic_bece_english_grammar'),
  ('q_bece_gram_004', 'topic_bece_english_grammar'),
  ('q_bece_gram_005', 'topic_bece_english_grammar'),
  ('q_bece_voc_001', 'topic_bece_english_vocabulary'),
  ('q_bece_voc_002', 'topic_bece_english_vocabulary'),
  ('q_bece_voc_003', 'topic_bece_english_vocabulary'),
  ('q_bece_voc_004', 'topic_bece_english_vocabulary'),
  ('q_bece_voc_005', 'topic_bece_english_vocabulary');

INSERT INTO _migration_227_guard(valid)
SELECT CASE WHEN
  (SELECT COUNT(*) FROM _migration_227_map) = 80
  AND NOT EXISTS (
    SELECT 1
    FROM _migration_227_map m
    LEFT JOIN questions q ON q.id = m.question_id
    LEFT JOIN topics t ON t.id = m.topic_id
    WHERE q.id IS NULL
      OR q.subject_id IS NOT 'subj_bece_english'
      OR t.id IS NULL
      OR t.subject_id IS NOT 'subj_bece_english'
      OR (q.topic_id IS NOT NULL AND q.topic_id IS NOT m.topic_id)
  )
  AND NOT EXISTS (
    SELECT 1
    FROM question_bank_remediation_log l
    LEFT JOIN _migration_227_map m ON m.question_id = l.entity_id
    WHERE l.migration_id = '227_bece_topic_english_part_2'
      AND (
        l.entity_type IS NOT 'question'
        OR l.field_name IS NOT 'topic_id'
        OR l.old_value IS NOT NULL
        OR m.question_id IS NULL
        OR l.new_value IS NOT m.topic_id
      )
  )
  AND (
    (
      (SELECT COUNT(*) FROM questions q JOIN _migration_227_map m ON m.question_id = q.id WHERE q.topic_id IS NULL) = 80
      AND (SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id = '227_bece_topic_english_part_2') = 0
    )
    OR (
      (SELECT COUNT(*) FROM questions q JOIN _migration_227_map m ON m.question_id = q.id WHERE q.topic_id IS m.topic_id) = 80
      AND (SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id = '227_bece_topic_english_part_2') = 80
    )
  )
THEN 1 ELSE 0 END;

INSERT OR IGNORE INTO question_bank_remediation_log
  (migration_id, entity_type, entity_id, field_name, old_value, new_value)
SELECT '227_bece_topic_english_part_2', 'question', q.id, 'topic_id', q.topic_id, m.topic_id
FROM questions q
JOIN _migration_227_map m ON m.question_id = q.id
WHERE q.topic_id IS NULL;

UPDATE questions
SET topic_id = (SELECT m.topic_id FROM _migration_227_map m WHERE m.question_id = questions.id)
WHERE topic_id IS NULL AND id IN (SELECT question_id FROM _migration_227_map);

INSERT INTO _migration_227_guard(valid)
SELECT CASE WHEN
  (SELECT COUNT(*) FROM questions q JOIN _migration_227_map m ON m.question_id = q.id WHERE q.topic_id IS m.topic_id) = 80
  AND (SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id = '227_bece_topic_english_part_2') = 80
  AND NOT EXISTS (
    SELECT 1 FROM questions q JOIN topics t ON t.id = q.topic_id
    WHERE q.topic_id IS NOT NULL AND q.subject_id IS NOT t.subject_id
  )
THEN 1 ELSE 0 END;

DROP TABLE _migration_227_map;
DROP TABLE _migration_227_guard;
