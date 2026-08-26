-- 234: Assign reviewed BECE subj_bece_science questions to canonical same-subject topics.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS _migration_234_guard (valid INTEGER NOT NULL CHECK (valid = 1));
DELETE FROM _migration_234_guard;
CREATE TABLE IF NOT EXISTS _migration_234_map (
  question_id TEXT PRIMARY KEY,
  topic_id TEXT NOT NULL
);
DELETE FROM _migration_234_map;
INSERT INTO _migration_234_map(question_id, topic_id) VALUES
  ('q_bece_sci_2024_006', 'topic_bece_science_electricity'),
  ('q_bece_sci_2024_007', 'topic_bece_science_machines'),
  ('q_bece_sci_2024_008', 'topic_bece_science_matter'),
  ('q_bece_sci_2024_009', 'topic_bece_science_cells'),
  ('q_bece_sci_2024_01', 'topic_bece_science_body'),
  ('q_bece_sci_2024_010', 'topic_bece_science_machines'),
  ('q_bece_sci_2024_011', 'topic_bece_science_health'),
  ('q_bece_sci_2024_012', 'topic_bece_science_matter'),
  ('q_bece_sci_2024_013', 'topic_bece_science_body'),
  ('q_bece_sci_2024_014', 'topic_bece_science_energy'),
  ('q_bece_sci_2024_015', 'topic_bece_science_cells'),
  ('q_bece_sci_2024_016', 'topic_bece_science_body'),
  ('q_bece_sci_2024_017', 'topic_bece_science_matter'),
  ('q_bece_sci_2024_018', 'topic_bece_science_body'),
  ('q_bece_sci_2024_019', 'topic_bece_science_energy'),
  ('q_bece_sci_2024_02', 'topic_bece_science_cells'),
  ('q_bece_sci_2024_020', 'topic_bece_science_energy'),
  ('q_bece_sci_2024_021', 'topic_bece_science_body'),
  ('q_bece_sci_2024_022', 'topic_bece_science_matter'),
  ('q_bece_sci_2024_023', 'topic_bece_science_body'),
  ('q_bece_sci_2024_024', 'topic_bece_science_matter'),
  ('q_bece_sci_2024_025', 'topic_bece_science_cells'),
  ('q_bece_sci_2024_026', 'topic_bece_science_machines'),
  ('q_bece_sci_2024_027', 'topic_bece_science_health'),
  ('q_bece_sci_2024_028', 'topic_bece_science_electricity'),
  ('q_bece_sci_2024_029', 'topic_bece_science_body'),
  ('q_bece_sci_2024_03', 'topic_bece_science_cells'),
  ('q_bece_sci_2024_030', 'topic_bece_science_matter'),
  ('q_bece_sci_2024_031', 'topic_bece_science_earth_space'),
  ('q_bece_sci_2024_032', 'topic_bece_science_body'),
  ('q_bece_sci_2024_033', 'topic_bece_science_matter'),
  ('q_bece_sci_2024_034', 'topic_bece_science_health'),
  ('q_bece_sci_2024_035', 'topic_bece_science_cells'),
  ('q_bece_sci_2024_036', 'topic_bece_science_matter'),
  ('q_bece_sci_2024_037', 'topic_bece_science_cells'),
  ('q_bece_sci_2024_038', 'topic_bece_science_electricity'),
  ('q_bece_sci_2024_039', 'topic_bece_science_body'),
  ('q_bece_sci_2024_04', 'topic_bece_science_cells'),
  ('q_bece_sci_2024_040', 'topic_bece_science_earth_space'),
  ('q_bece_sci_2024_05', 'topic_bece_science_body'),
  ('q_bece_sci_2024_06', 'topic_bece_science_cells'),
  ('q_bece_sci_2024_07', 'topic_bece_science_cells'),
  ('q_bece_sci_2024_08', 'topic_bece_science_body'),
  ('q_bece_sci_2024_09', 'topic_bece_science_cells'),
  ('q_bece_sci_2024_10', 'topic_bece_science_cells'),
  ('q_bece_sci_2024_11', 'topic_bece_science_matter'),
  ('q_bece_sci_2024_12', 'topic_bece_science_matter'),
  ('q_bece_sci_2024_13', 'topic_bece_science_machines'),
  ('q_bece_sci_2024_14', 'topic_bece_science_energy'),
  ('q_bece_sci_2024_15', 'topic_bece_science_machines'),
  ('q_bece_sci_2024_16', 'topic_bece_science_matter'),
  ('q_bece_sci_2024_17', 'topic_bece_science_energy'),
  ('q_bece_sci_2024_18', 'topic_bece_science_energy'),
  ('q_bece_sci_2024_19', 'topic_bece_science_matter'),
  ('q_bece_sci_2024_20', 'topic_bece_science_machines'),
  ('q_bece_sci_2024_21', 'topic_bece_science_earth_space'),
  ('q_bece_sci_2024_22', 'topic_bece_science_health'),
  ('q_bece_sci_2024_23', 'topic_bece_science_health'),
  ('q_bece_sci_2024_24', 'topic_bece_science_health'),
  ('q_bece_sci_2024_25', 'topic_bece_science_health'),
  ('q_bece_sci_2024_26', 'topic_bece_science_health'),
  ('q_bece_sci_2024_27', 'topic_bece_science_health'),
  ('q_bece_sci_2024_28', 'topic_bece_science_health'),
  ('q_bece_sci_2024_29', 'topic_bece_science_health'),
  ('q_bece_sci_2024_30', 'topic_bece_science_health'),
  ('q_bece_sci_2024_31', 'topic_bece_science_methods'),
  ('q_bece_sci_2024_32', 'topic_bece_science_energy'),
  ('q_bece_sci_2024_33', 'topic_bece_science_methods'),
  ('q_bece_sci_2024_34', 'topic_bece_science_methods'),
  ('q_bece_sci_2024_35', 'topic_bece_science_energy'),
  ('q_bece_sci_2024_36', 'topic_bece_science_electricity'),
  ('q_bece_sci_2024_37', 'topic_bece_science_methods'),
  ('q_bece_sci_2024_38', 'topic_bece_science_energy'),
  ('q_bece_sci_2024_39', 'topic_bece_science_methods'),
  ('q_bece_sci_2024_40', 'topic_bece_science_electricity'),
  ('q_bece_tech_001', 'topic_bece_science_methods'),
  ('q_bece_tech_002', 'topic_bece_science_methods'),
  ('q_bece_tech_003', 'topic_bece_science_methods'),
  ('q_bece_tech_004', 'topic_bece_science_methods'),
  ('q_bece_tech_005', 'topic_bece_science_energy');

INSERT INTO _migration_234_guard(valid)
SELECT CASE WHEN
  (SELECT COUNT(*) FROM _migration_234_map) = 80
  AND NOT EXISTS (
    SELECT 1
    FROM _migration_234_map m
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
    LEFT JOIN _migration_234_map m ON m.question_id = l.entity_id
    WHERE l.migration_id = '234_bece_topic_science_part_2'
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
      (SELECT COUNT(*) FROM questions q JOIN _migration_234_map m ON m.question_id = q.id WHERE q.topic_id IS NULL) = 80
      AND (SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id = '234_bece_topic_science_part_2') = 0
    )
    OR (
      (SELECT COUNT(*) FROM questions q JOIN _migration_234_map m ON m.question_id = q.id WHERE q.topic_id IS m.topic_id) = 80
      AND (SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id = '234_bece_topic_science_part_2') = 80
    )
  )
THEN 1 ELSE 0 END;

INSERT OR IGNORE INTO question_bank_remediation_log
  (migration_id, entity_type, entity_id, field_name, old_value, new_value)
SELECT '234_bece_topic_science_part_2', 'question', q.id, 'topic_id', q.topic_id, m.topic_id
FROM questions q
JOIN _migration_234_map m ON m.question_id = q.id
WHERE q.topic_id IS NULL;

UPDATE questions
SET topic_id = (SELECT m.topic_id FROM _migration_234_map m WHERE m.question_id = questions.id)
WHERE topic_id IS NULL AND id IN (SELECT question_id FROM _migration_234_map);

INSERT INTO _migration_234_guard(valid)
SELECT CASE WHEN
  (SELECT COUNT(*) FROM questions q JOIN _migration_234_map m ON m.question_id = q.id WHERE q.topic_id IS m.topic_id) = 80
  AND (SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id = '234_bece_topic_science_part_2') = 80
  AND NOT EXISTS (
    SELECT 1 FROM questions q JOIN topics t ON t.id = q.topic_id
    WHERE q.topic_id IS NOT NULL AND q.subject_id IS NOT t.subject_id
  )
THEN 1 ELSE 0 END;

DROP TABLE _migration_234_map;
DROP TABLE _migration_234_guard;
