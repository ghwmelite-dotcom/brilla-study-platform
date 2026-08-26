-- 233: Assign reviewed BECE subj_bece_science questions to canonical same-subject topics.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS _migration_233_guard (valid INTEGER NOT NULL CHECK (valid = 1));
DELETE FROM _migration_233_guard;
CREATE TABLE IF NOT EXISTS _migration_233_map (
  question_id TEXT PRIMARY KEY,
  topic_id TEXT NOT NULL
);
DELETE FROM _migration_233_map;
INSERT INTO _migration_233_map(question_id, topic_id) VALUES
  ('q_bece_env_001', 'topic_bece_science_health'),
  ('q_bece_env_002', 'topic_bece_science_health'),
  ('q_bece_env_003', 'topic_bece_science_health'),
  ('q_bece_env_004', 'topic_bece_science_health'),
  ('q_bece_env_005', 'topic_bece_science_health'),
  ('q_bece_liv_001', 'topic_bece_science_cells'),
  ('q_bece_liv_002', 'topic_bece_science_cells'),
  ('q_bece_liv_003', 'topic_bece_science_body'),
  ('q_bece_liv_004', 'topic_bece_science_cells'),
  ('q_bece_liv_005', 'topic_bece_science_cells'),
  ('q_bece_mat_001', 'topic_bece_science_matter'),
  ('q_bece_mat_002', 'topic_bece_science_matter'),
  ('q_bece_mat_003', 'topic_bece_science_energy'),
  ('q_bece_mat_004', 'topic_bece_science_machines'),
  ('q_bece_mat_005', 'topic_bece_science_energy'),
  ('q_bece_sci_2023_001', 'topic_bece_science_cells'),
  ('q_bece_sci_2023_002', 'topic_bece_science_matter'),
  ('q_bece_sci_2023_003', 'topic_bece_science_energy'),
  ('q_bece_sci_2023_004', 'topic_bece_science_body'),
  ('q_bece_sci_2023_005', 'topic_bece_science_matter'),
  ('q_bece_sci_2023_006', 'topic_bece_science_body'),
  ('q_bece_sci_2023_007', 'topic_bece_science_machines'),
  ('q_bece_sci_2023_008', 'topic_bece_science_matter'),
  ('q_bece_sci_2023_009', 'topic_bece_science_cells'),
  ('q_bece_sci_2023_01', 'topic_bece_science_body'),
  ('q_bece_sci_2023_010', 'topic_bece_science_matter'),
  ('q_bece_sci_2023_011', 'topic_bece_science_cells'),
  ('q_bece_sci_2023_012', 'topic_bece_science_energy'),
  ('q_bece_sci_2023_013', 'topic_bece_science_health'),
  ('q_bece_sci_2023_014', 'topic_bece_science_energy'),
  ('q_bece_sci_2023_015', 'topic_bece_science_earth_space'),
  ('q_bece_sci_2023_016', 'topic_bece_science_cells'),
  ('q_bece_sci_2023_017', 'topic_bece_science_energy'),
  ('q_bece_sci_2023_018', 'topic_bece_science_cells'),
  ('q_bece_sci_2023_019', 'topic_bece_science_health'),
  ('q_bece_sci_2023_02', 'topic_bece_science_cells'),
  ('q_bece_sci_2023_020', 'topic_bece_science_matter'),
  ('q_bece_sci_2023_021', 'topic_bece_science_matter'),
  ('q_bece_sci_2023_022', 'topic_bece_science_body'),
  ('q_bece_sci_2023_023', 'topic_bece_science_machines'),
  ('q_bece_sci_2023_024', 'topic_bece_science_cells'),
  ('q_bece_sci_2023_025', 'topic_bece_science_cells'),
  ('q_bece_sci_2023_026', 'topic_bece_science_energy'),
  ('q_bece_sci_2023_027', 'topic_bece_science_health'),
  ('q_bece_sci_2023_028', 'topic_bece_science_matter'),
  ('q_bece_sci_2023_029', 'topic_bece_science_energy'),
  ('q_bece_sci_2023_03', 'topic_bece_science_body'),
  ('q_bece_sci_2023_030', 'topic_bece_science_cells'),
  ('q_bece_sci_2023_031', 'topic_bece_science_matter'),
  ('q_bece_sci_2023_032', 'topic_bece_science_electricity'),
  ('q_bece_sci_2023_033', 'topic_bece_science_cells'),
  ('q_bece_sci_2023_034', 'topic_bece_science_earth_space'),
  ('q_bece_sci_2023_035', 'topic_bece_science_energy'),
  ('q_bece_sci_2023_036', 'topic_bece_science_matter'),
  ('q_bece_sci_2023_037', 'topic_bece_science_earth_space'),
  ('q_bece_sci_2023_038', 'topic_bece_science_health'),
  ('q_bece_sci_2023_039', 'topic_bece_science_body'),
  ('q_bece_sci_2023_04', 'topic_bece_science_body'),
  ('q_bece_sci_2023_040', 'topic_bece_science_health'),
  ('q_bece_sci_2023_05', 'topic_bece_science_cells'),
  ('q_bece_sci_2023_06', 'topic_bece_science_body'),
  ('q_bece_sci_2023_07', 'topic_bece_science_cells'),
  ('q_bece_sci_2023_08', 'topic_bece_science_body'),
  ('q_bece_sci_2023_09', 'topic_bece_science_health'),
  ('q_bece_sci_2023_10', 'topic_bece_science_cells'),
  ('q_bece_sci_2023_11', 'topic_bece_science_matter'),
  ('q_bece_sci_2023_12', 'topic_bece_science_matter'),
  ('q_bece_sci_2023_13', 'topic_bece_science_matter'),
  ('q_bece_sci_2023_14', 'topic_bece_science_energy'),
  ('q_bece_sci_2023_15', 'topic_bece_science_matter'),
  ('q_bece_sci_2023_16', 'topic_bece_science_machines'),
  ('q_bece_sci_2023_17', 'topic_bece_science_electricity'),
  ('q_bece_sci_2023_18', 'topic_bece_science_cells'),
  ('q_bece_sci_2023_19', 'topic_bece_science_electricity'),
  ('q_bece_sci_2023_20', 'topic_bece_science_energy'),
  ('q_bece_sci_2023_21', 'topic_bece_science_matter'),
  ('q_bece_sci_2023_22', 'topic_bece_science_health'),
  ('q_bece_sci_2023_23', 'topic_bece_science_health'),
  ('q_bece_sci_2023_24', 'topic_bece_science_health'),
  ('q_bece_sci_2023_25', 'topic_bece_science_body'),
  ('q_bece_sci_2023_26', 'topic_bece_science_cells'),
  ('q_bece_sci_2023_27', 'topic_bece_science_health'),
  ('q_bece_sci_2023_28', 'topic_bece_science_earth_space'),
  ('q_bece_sci_2023_29', 'topic_bece_science_health'),
  ('q_bece_sci_2023_30', 'topic_bece_science_health'),
  ('q_bece_sci_2023_31', 'topic_bece_science_energy'),
  ('q_bece_sci_2023_32', 'topic_bece_science_methods'),
  ('q_bece_sci_2023_33', 'topic_bece_science_machines'),
  ('q_bece_sci_2023_34', 'topic_bece_science_energy'),
  ('q_bece_sci_2023_35', 'topic_bece_science_electricity'),
  ('q_bece_sci_2023_36', 'topic_bece_science_energy'),
  ('q_bece_sci_2023_37', 'topic_bece_science_energy'),
  ('q_bece_sci_2023_38', 'topic_bece_science_electricity'),
  ('q_bece_sci_2023_39', 'topic_bece_science_earth_space'),
  ('q_bece_sci_2023_40', 'topic_bece_science_health'),
  ('q_bece_sci_2024_001', 'topic_bece_science_cells'),
  ('q_bece_sci_2024_002', 'topic_bece_science_matter'),
  ('q_bece_sci_2024_003', 'topic_bece_science_matter'),
  ('q_bece_sci_2024_004', 'topic_bece_science_body'),
  ('q_bece_sci_2024_005', 'topic_bece_science_cells');

INSERT INTO _migration_233_guard(valid)
SELECT CASE WHEN
  (SELECT COUNT(*) FROM _migration_233_map) = 100
  AND NOT EXISTS (
    SELECT 1
    FROM _migration_233_map m
    LEFT JOIN questions q ON q.id = m.question_id
    LEFT JOIN topics t ON t.id = m.topic_id
    WHERE q.id IS NULL
      OR q.subject_id IS NOT 'subj_bece_science'
      OR t.id IS NULL
      OR t.subject_id IS NOT 'subj_bece_science'
      OR (q.topic_id IS NOT NULL AND q.topic_id IS NOT m.topic_id)
  )
  AND NOT EXISTS (
    SELECT 1
    FROM question_bank_remediation_log l
    LEFT JOIN _migration_233_map m ON m.question_id = l.entity_id
    WHERE l.migration_id = '233_bece_topic_science_part_1'
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
      (SELECT COUNT(*) FROM questions q JOIN _migration_233_map m ON m.question_id = q.id WHERE q.topic_id IS NULL) = 100
      AND (SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id = '233_bece_topic_science_part_1') = 0
    )
    OR (
      (SELECT COUNT(*) FROM questions q JOIN _migration_233_map m ON m.question_id = q.id WHERE q.topic_id IS m.topic_id) = 100
      AND (SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id = '233_bece_topic_science_part_1') = 100
    )
  )
THEN 1 ELSE 0 END;

INSERT OR IGNORE INTO question_bank_remediation_log
  (migration_id, entity_type, entity_id, field_name, old_value, new_value)
SELECT '233_bece_topic_science_part_1', 'question', q.id, 'topic_id', q.topic_id, m.topic_id
FROM questions q
JOIN _migration_233_map m ON m.question_id = q.id
WHERE q.topic_id IS NULL;

UPDATE questions
SET topic_id = (SELECT m.topic_id FROM _migration_233_map m WHERE m.question_id = questions.id)
WHERE topic_id IS NULL AND id IN (SELECT question_id FROM _migration_233_map);

INSERT INTO _migration_233_guard(valid)
SELECT CASE WHEN
  (SELECT COUNT(*) FROM questions q JOIN _migration_233_map m ON m.question_id = q.id WHERE q.topic_id IS m.topic_id) = 100
  AND (SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id = '233_bece_topic_science_part_1') = 100
  AND NOT EXISTS (
    SELECT 1 FROM questions q JOIN topics t ON t.id = q.topic_id
    WHERE q.topic_id IS NOT NULL AND q.subject_id IS NOT t.subject_id
  )
THEN 1 ELSE 0 END;

DROP TABLE _migration_233_map;
DROP TABLE _migration_233_guard;
