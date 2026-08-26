-- 231: Assign reviewed BECE subj_bece_math questions to canonical same-subject topics.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS _migration_231_guard (valid INTEGER NOT NULL CHECK (valid = 1));
DELETE FROM _migration_231_guard;
CREATE TABLE IF NOT EXISTS _migration_231_map (
  question_id TEXT PRIMARY KEY,
  topic_id TEXT NOT NULL
);
DELETE FROM _migration_231_map;
INSERT INTO _migration_231_map(question_id, topic_id) VALUES
  ('q_bece_math_2024_010', 'topic_bece_math_number'),
  ('q_bece_math_2024_011', 'topic_bece_math_statistics'),
  ('q_bece_math_2024_012', 'topic_bece_math_algebra'),
  ('q_bece_math_2024_013', 'topic_bece_math_statistics'),
  ('q_bece_math_2024_014', 'topic_bece_math_number'),
  ('q_bece_math_2024_015', 'topic_bece_math_equations'),
  ('q_bece_math_2024_016', 'topic_bece_math_geometry'),
  ('q_bece_math_2024_017', 'topic_bece_math_algebra'),
  ('q_bece_math_2024_018', 'topic_bece_math_number'),
  ('q_bece_math_2024_019', 'topic_bece_math_geometry'),
  ('q_bece_math_2024_02', 'topic_bece_math_fractions'),
  ('q_bece_math_2024_020', 'topic_bece_math_fractions'),
  ('q_bece_math_2024_021', 'topic_bece_math_fractions'),
  ('q_bece_math_2024_022', 'topic_bece_math_number'),
  ('q_bece_math_2024_023', 'topic_bece_math_mensuration'),
  ('q_bece_math_2024_024', 'topic_bece_math_ratio'),
  ('q_bece_math_2024_025', 'topic_bece_math_number'),
  ('q_bece_math_2024_026', 'topic_bece_math_geometry'),
  ('q_bece_math_2024_027', 'topic_bece_math_statistics'),
  ('q_bece_math_2024_028', 'topic_bece_math_equations'),
  ('q_bece_math_2024_029', 'topic_bece_math_mensuration'),
  ('q_bece_math_2024_03', 'topic_bece_math_fractions'),
  ('q_bece_math_2024_030', 'topic_bece_math_fractions'),
  ('q_bece_math_2024_031', 'topic_bece_math_geometry'),
  ('q_bece_math_2024_032', 'topic_bece_math_ratio'),
  ('q_bece_math_2024_033', 'topic_bece_math_algebra'),
  ('q_bece_math_2024_034', 'topic_bece_math_statistics'),
  ('q_bece_math_2024_035', 'topic_bece_math_geometry'),
  ('q_bece_math_2024_036', 'topic_bece_math_equations'),
  ('q_bece_math_2024_037', 'topic_bece_math_algebra'),
  ('q_bece_math_2024_038', 'topic_bece_math_ratio'),
  ('q_bece_math_2024_039', 'topic_bece_math_geometry'),
  ('q_bece_math_2024_04', 'topic_bece_math_number'),
  ('q_bece_math_2024_040', 'topic_bece_math_algebra'),
  ('q_bece_math_2024_05', 'topic_bece_math_number'),
  ('q_bece_math_2024_06', 'topic_bece_math_number'),
  ('q_bece_math_2024_07', 'topic_bece_math_number'),
  ('q_bece_math_2024_08', 'topic_bece_math_fractions'),
  ('q_bece_math_2024_09', 'topic_bece_math_algebra'),
  ('q_bece_math_2024_10', 'topic_bece_math_number'),
  ('q_bece_math_2024_11', 'topic_bece_math_equations'),
  ('q_bece_math_2024_12', 'topic_bece_math_algebra'),
  ('q_bece_math_2024_13', 'topic_bece_math_equations'),
  ('q_bece_math_2024_14', 'topic_bece_math_algebra'),
  ('q_bece_math_2024_15', 'topic_bece_math_equations'),
  ('q_bece_math_2024_16', 'topic_bece_math_algebra'),
  ('q_bece_math_2024_17', 'topic_bece_math_algebra'),
  ('q_bece_math_2024_18', 'topic_bece_math_equations'),
  ('q_bece_math_2024_19', 'topic_bece_math_equations'),
  ('q_bece_math_2024_20', 'topic_bece_math_equations'),
  ('q_bece_math_2024_21', 'topic_bece_math_mensuration'),
  ('q_bece_math_2024_22', 'topic_bece_math_mensuration'),
  ('q_bece_math_2024_23', 'topic_bece_math_geometry'),
  ('q_bece_math_2024_24', 'topic_bece_math_mensuration'),
  ('q_bece_math_2024_25', 'topic_bece_math_geometry'),
  ('q_bece_math_2024_26', 'topic_bece_math_mensuration'),
  ('q_bece_math_2024_27', 'topic_bece_math_geometry'),
  ('q_bece_math_2024_28', 'topic_bece_math_mensuration'),
  ('q_bece_math_2024_29', 'topic_bece_math_geometry'),
  ('q_bece_math_2024_30', 'topic_bece_math_mensuration'),
  ('q_bece_math_2024_31', 'topic_bece_math_statistics'),
  ('q_bece_math_2024_32', 'topic_bece_math_statistics'),
  ('q_bece_math_2024_33', 'topic_bece_math_statistics'),
  ('q_bece_math_2024_34', 'topic_bece_math_statistics'),
  ('q_bece_math_2024_35', 'topic_bece_math_statistics'),
  ('q_bece_math_2024_36', 'topic_bece_math_statistics'),
  ('q_bece_math_2024_37', 'topic_bece_math_statistics'),
  ('q_bece_math_2024_38', 'topic_bece_math_statistics'),
  ('q_bece_math_2024_39', 'topic_bece_math_statistics'),
  ('q_bece_math_2024_40', 'topic_bece_math_statistics'),
  ('q_bece_num_001', 'topic_bece_math_fractions'),
  ('q_bece_num_002', 'topic_bece_math_number'),
  ('q_bece_num_003', 'topic_bece_math_number'),
  ('q_bece_num_004', 'topic_bece_math_fractions'),
  ('q_bece_num_005', 'topic_bece_math_fractions'),
  ('q_bece_stat_001', 'topic_bece_math_statistics'),
  ('q_bece_stat_002', 'topic_bece_math_statistics'),
  ('q_bece_stat_003', 'topic_bece_math_statistics'),
  ('q_bece_stat_004', 'topic_bece_math_statistics'),
  ('q_bece_stat_005', 'topic_bece_math_statistics');

INSERT INTO _migration_231_guard(valid)
SELECT CASE WHEN
  (SELECT COUNT(*) FROM _migration_231_map) = 80
  AND NOT EXISTS (
    SELECT 1
    FROM _migration_231_map m
    LEFT JOIN questions q ON q.id = m.question_id
    LEFT JOIN topics t ON t.id = m.topic_id
    WHERE q.id IS NULL
      OR q.subject_id IS NOT 'subj_bece_math'
      OR t.id IS NULL
      OR t.subject_id IS NOT 'subj_bece_math'
      OR (q.topic_id IS NOT NULL AND q.topic_id IS NOT m.topic_id)
  )
  AND NOT EXISTS (
    SELECT 1
    FROM question_bank_remediation_log l
    LEFT JOIN _migration_231_map m ON m.question_id = l.entity_id
    WHERE l.migration_id = '231_bece_topic_math_part_2'
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
      (SELECT COUNT(*) FROM questions q JOIN _migration_231_map m ON m.question_id = q.id WHERE q.topic_id IS NULL) = 80
      AND (SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id = '231_bece_topic_math_part_2') = 0
    )
    OR (
      (SELECT COUNT(*) FROM questions q JOIN _migration_231_map m ON m.question_id = q.id WHERE q.topic_id IS m.topic_id) = 80
      AND (SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id = '231_bece_topic_math_part_2') = 80
    )
  )
THEN 1 ELSE 0 END;

INSERT OR IGNORE INTO question_bank_remediation_log
  (migration_id, entity_type, entity_id, field_name, old_value, new_value)
SELECT '231_bece_topic_math_part_2', 'question', q.id, 'topic_id', q.topic_id, m.topic_id
FROM questions q
JOIN _migration_231_map m ON m.question_id = q.id
WHERE q.topic_id IS NULL;

UPDATE questions
SET topic_id = (SELECT m.topic_id FROM _migration_231_map m WHERE m.question_id = questions.id)
WHERE topic_id IS NULL AND id IN (SELECT question_id FROM _migration_231_map);

INSERT INTO _migration_231_guard(valid)
SELECT CASE WHEN
  (SELECT COUNT(*) FROM questions q JOIN _migration_231_map m ON m.question_id = q.id WHERE q.topic_id IS m.topic_id) = 80
  AND (SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id = '231_bece_topic_math_part_2') = 80
  AND NOT EXISTS (
    SELECT 1 FROM questions q JOIN topics t ON t.id = q.topic_id
    WHERE q.topic_id IS NOT NULL AND q.subject_id IS NOT t.subject_id
  )
THEN 1 ELSE 0 END;

DROP TABLE _migration_231_map;
DROP TABLE _migration_231_guard;
