-- 225: Assign reviewed BECE subj_bece_bdt questions to canonical same-subject topics.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS _migration_225_guard (valid INTEGER NOT NULL CHECK (valid = 1));
DELETE FROM _migration_225_guard;
CREATE TABLE IF NOT EXISTS _migration_225_map (
  question_id TEXT PRIMARY KEY,
  topic_id TEXT NOT NULL
);
DELETE FROM _migration_225_map;
INSERT INTO _migration_225_map(question_id, topic_id) VALUES
  ('q_bece_bdt_2023_001', 'topic_bece_bdt_materials'),
  ('q_bece_bdt_2023_002', 'topic_bece_bdt_materials'),
  ('q_bece_bdt_2023_003', 'topic_bece_bdt_materials'),
  ('q_bece_bdt_2023_004', 'topic_bece_bdt_materials'),
  ('q_bece_bdt_2023_005', 'topic_bece_bdt_materials'),
  ('q_bece_bdt_2023_006', 'topic_bece_bdt_materials'),
  ('q_bece_bdt_2023_007', 'topic_bece_bdt_materials'),
  ('q_bece_bdt_2023_008', 'topic_bece_bdt_materials'),
  ('q_bece_bdt_2023_009', 'topic_bece_bdt_materials'),
  ('q_bece_bdt_2023_010', 'topic_bece_bdt_materials'),
  ('q_bece_bdt_2023_011', 'topic_bece_bdt_materials'),
  ('q_bece_bdt_2023_012', 'topic_bece_bdt_materials'),
  ('q_bece_bdt_2023_013', 'topic_bece_bdt_materials'),
  ('q_bece_bdt_2023_014', 'topic_bece_bdt_materials'),
  ('q_bece_bdt_2023_015', 'topic_bece_bdt_materials'),
  ('q_bece_bdt_2023_016', 'topic_bece_bdt_food'),
  ('q_bece_bdt_2023_017', 'topic_bece_bdt_food'),
  ('q_bece_bdt_2023_018', 'topic_bece_bdt_food'),
  ('q_bece_bdt_2023_019', 'topic_bece_bdt_food'),
  ('q_bece_bdt_2023_020', 'topic_bece_bdt_food'),
  ('q_bece_bdt_2023_021', 'topic_bece_bdt_food'),
  ('q_bece_bdt_2023_022', 'topic_bece_bdt_food'),
  ('q_bece_bdt_2023_023', 'topic_bece_bdt_food'),
  ('q_bece_bdt_2023_024', 'topic_bece_bdt_clothing'),
  ('q_bece_bdt_2023_025', 'topic_bece_bdt_clothing'),
  ('q_bece_bdt_2023_026', 'topic_bece_bdt_clothing'),
  ('q_bece_bdt_2023_027', 'topic_bece_bdt_clothing'),
  ('q_bece_bdt_2023_028', 'topic_bece_bdt_clothing'),
  ('q_bece_bdt_2023_029', 'topic_bece_bdt_clothing'),
  ('q_bece_bdt_2023_030', 'topic_bece_bdt_clothing'),
  ('q_bece_bdt_2023_031', 'topic_bece_bdt_design'),
  ('q_bece_bdt_2023_032', 'topic_bece_bdt_design'),
  ('q_bece_bdt_2023_033', 'topic_bece_bdt_design'),
  ('q_bece_bdt_2023_034', 'topic_bece_bdt_design'),
  ('q_bece_bdt_2023_035', 'topic_bece_bdt_design'),
  ('q_bece_bdt_2023_036', 'topic_bece_bdt_design'),
  ('q_bece_bdt_2023_037', 'topic_bece_bdt_design'),
  ('q_bece_bdt_2023_038', 'topic_bece_bdt_design'),
  ('q_bece_bdt_2023_039', 'topic_bece_bdt_design'),
  ('q_bece_bdt_2023_040', 'topic_bece_bdt_design'),
  ('q_bece_bdt_2024_001', 'topic_bece_bdt_materials'),
  ('q_bece_bdt_2024_002', 'topic_bece_bdt_materials'),
  ('q_bece_bdt_2024_003', 'topic_bece_bdt_materials'),
  ('q_bece_bdt_2024_004', 'topic_bece_bdt_materials'),
  ('q_bece_bdt_2024_005', 'topic_bece_bdt_materials'),
  ('q_bece_bdt_2024_006', 'topic_bece_bdt_materials'),
  ('q_bece_bdt_2024_007', 'topic_bece_bdt_materials'),
  ('q_bece_bdt_2024_008', 'topic_bece_bdt_materials'),
  ('q_bece_bdt_2024_009', 'topic_bece_bdt_materials'),
  ('q_bece_bdt_2024_010', 'topic_bece_bdt_materials'),
  ('q_bece_bdt_2024_011', 'topic_bece_bdt_materials'),
  ('q_bece_bdt_2024_012', 'topic_bece_bdt_materials'),
  ('q_bece_bdt_2024_013', 'topic_bece_bdt_materials'),
  ('q_bece_bdt_2024_014', 'topic_bece_bdt_materials'),
  ('q_bece_bdt_2024_015', 'topic_bece_bdt_materials'),
  ('q_bece_bdt_2024_016', 'topic_bece_bdt_food'),
  ('q_bece_bdt_2024_017', 'topic_bece_bdt_food'),
  ('q_bece_bdt_2024_018', 'topic_bece_bdt_food'),
  ('q_bece_bdt_2024_019', 'topic_bece_bdt_food'),
  ('q_bece_bdt_2024_020', 'topic_bece_bdt_food'),
  ('q_bece_bdt_2024_021', 'topic_bece_bdt_food'),
  ('q_bece_bdt_2024_022', 'topic_bece_bdt_food'),
  ('q_bece_bdt_2024_023', 'topic_bece_bdt_food'),
  ('q_bece_bdt_2024_024', 'topic_bece_bdt_clothing'),
  ('q_bece_bdt_2024_025', 'topic_bece_bdt_clothing'),
  ('q_bece_bdt_2024_026', 'topic_bece_bdt_clothing'),
  ('q_bece_bdt_2024_027', 'topic_bece_bdt_clothing'),
  ('q_bece_bdt_2024_028', 'topic_bece_bdt_clothing'),
  ('q_bece_bdt_2024_029', 'topic_bece_bdt_clothing'),
  ('q_bece_bdt_2024_030', 'topic_bece_bdt_clothing'),
  ('q_bece_bdt_2024_031', 'topic_bece_bdt_design'),
  ('q_bece_bdt_2024_032', 'topic_bece_bdt_design'),
  ('q_bece_bdt_2024_033', 'topic_bece_bdt_design'),
  ('q_bece_bdt_2024_034', 'topic_bece_bdt_design'),
  ('q_bece_bdt_2024_035', 'topic_bece_bdt_design'),
  ('q_bece_bdt_2024_036', 'topic_bece_bdt_design'),
  ('q_bece_bdt_2024_037', 'topic_bece_bdt_design'),
  ('q_bece_bdt_2024_038', 'topic_bece_bdt_design'),
  ('q_bece_bdt_2024_039', 'topic_bece_bdt_design'),
  ('q_bece_bdt_2024_040', 'topic_bece_bdt_design');

INSERT INTO _migration_225_guard(valid)
SELECT CASE WHEN
  (SELECT COUNT(*) FROM _migration_225_map) = 80
  AND NOT EXISTS (
    SELECT 1
    FROM _migration_225_map m
    LEFT JOIN questions q ON q.id = m.question_id
    LEFT JOIN topics t ON t.id = m.topic_id
    WHERE q.id IS NULL
      OR q.subject_id IS NOT 'subj_bece_bdt'
      OR t.id IS NULL
      OR t.subject_id IS NOT 'subj_bece_bdt'
      OR (q.topic_id IS NOT NULL AND q.topic_id IS NOT m.topic_id)
  )
  AND NOT EXISTS (
    SELECT 1
    FROM question_bank_remediation_log l
    LEFT JOIN _migration_225_map m ON m.question_id = l.entity_id
    WHERE l.migration_id = '225_bece_topic_bdt'
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
      (SELECT COUNT(*) FROM questions q JOIN _migration_225_map m ON m.question_id = q.id WHERE q.topic_id IS NULL) = 80
      AND (SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id = '225_bece_topic_bdt') = 0
    )
    OR (
      (SELECT COUNT(*) FROM questions q JOIN _migration_225_map m ON m.question_id = q.id WHERE q.topic_id IS m.topic_id) = 80
      AND (SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id = '225_bece_topic_bdt') = 80
    )
  )
THEN 1 ELSE 0 END;

INSERT OR IGNORE INTO question_bank_remediation_log
  (migration_id, entity_type, entity_id, field_name, old_value, new_value)
SELECT '225_bece_topic_bdt', 'question', q.id, 'topic_id', q.topic_id, m.topic_id
FROM questions q
JOIN _migration_225_map m ON m.question_id = q.id
WHERE q.topic_id IS NULL;

UPDATE questions
SET topic_id = (SELECT m.topic_id FROM _migration_225_map m WHERE m.question_id = questions.id)
WHERE topic_id IS NULL AND id IN (SELECT question_id FROM _migration_225_map);

INSERT INTO _migration_225_guard(valid)
SELECT CASE WHEN
  (SELECT COUNT(*) FROM questions q JOIN _migration_225_map m ON m.question_id = q.id WHERE q.topic_id IS m.topic_id) = 80
  AND (SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id = '225_bece_topic_bdt') = 80
  AND NOT EXISTS (
    SELECT 1 FROM questions q JOIN topics t ON t.id = q.topic_id
    WHERE q.topic_id IS NOT NULL AND q.subject_id IS NOT t.subject_id
  )
THEN 1 ELSE 0 END;

DROP TABLE _migration_225_map;
DROP TABLE _migration_225_guard;
