-- 249: Assign all 40 ledger-backed, then 60 reviewed-source WASSCE Elective Mathematics questions.
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS _migration_249_guard (valid INTEGER NOT NULL CHECK (valid = 1));
DELETE FROM _migration_249_guard;
CREATE TABLE IF NOT EXISTS _migration_249_map (question_id TEXT PRIMARY KEY, topic_id TEXT NOT NULL);
DELETE FROM _migration_249_map;
INSERT INTO _migration_249_map(question_id, topic_id) VALUES
  ('q_wassce_emath_2023_01','topic_wassce_em_algebra'),('q_wassce_emath_2023_02','topic_wassce_em_polynomials'),
  ('q_wassce_emath_2023_03','topic_wassce_em_polynomials'),('q_wassce_emath_2023_04','topic_wassce_em_polynomials'),
  ('q_wassce_emath_2023_05','topic_wassce_em_algebra'),('q_wassce_emath_2023_06','topic_wassce_em_algebra'),
  ('q_wassce_emath_2023_07','topic_wassce_em_polynomials'),('q_wassce_emath_2023_08','topic_wassce_em_algebra'),
  ('q_wassce_emath_2023_09','topic_wassce_em_algebra'),('q_wassce_emath_2023_10','topic_wassce_em_sequences'),
  ('q_wassce_emath_2023_21','topic_wassce_em_differentiation'),('q_wassce_emath_2023_22','topic_wassce_em_differentiation'),
  ('q_wassce_emath_2023_23','topic_wassce_em_integration'),('q_wassce_emath_2023_24','topic_wassce_em_differentiation'),
  ('q_wassce_emath_2023_25','topic_wassce_em_integration'),('q_wassce_emath_2023_26','topic_wassce_em_differentiation'),
  ('q_wassce_emath_2023_27','topic_wassce_em_differentiation'),('q_wassce_emath_2023_28','topic_wassce_em_differentiation'),
  ('q_wassce_emath_2023_29','topic_wassce_em_differentiation'),('q_wassce_emath_2023_30','topic_wassce_em_integration'),
  ('q_wassce_emath_2024_01','topic_wassce_em_algebra'),('q_wassce_emath_2024_02','topic_wassce_em_polynomials'),
  ('q_wassce_emath_2024_03','topic_wassce_em_polynomials'),('q_wassce_emath_2024_04','topic_wassce_em_algebra'),
  ('q_wassce_emath_2024_05','topic_wassce_em_polynomials'),('q_wassce_emath_2024_06','topic_wassce_em_algebra'),
  ('q_wassce_emath_2024_07','topic_wassce_em_sequences'),('q_wassce_emath_2024_08','topic_wassce_em_sequences'),
  ('q_wassce_emath_2024_09','topic_wassce_em_polynomials'),('q_wassce_emath_2024_10','topic_wassce_em_algebra'),
  ('q_wassce_emath_2024_21','topic_wassce_em_differentiation'),('q_wassce_emath_2024_22','topic_wassce_em_differentiation'),
  ('q_wassce_emath_2024_23','topic_wassce_em_integration'),('q_wassce_emath_2024_24','topic_wassce_em_integration'),
  ('q_wassce_emath_2024_25','topic_wassce_em_differentiation'),('q_wassce_emath_2024_26','topic_wassce_em_differentiation'),
  ('q_wassce_emath_2024_27','topic_wassce_em_integration'),('q_wassce_emath_2024_28','topic_wassce_em_differentiation'),
  ('q_wassce_emath_2024_29','topic_wassce_em_differentiation'),('q_wassce_emath_2024_30','topic_wassce_em_integration'),
  ('q_em_2023_001','topic_wassce_em_differentiation'),('q_em_2023_002','topic_wassce_em_differentiation'),
  ('q_em_2023_003','topic_wassce_em_integration'),('q_em_2023_004','topic_wassce_em_differentiation'),
  ('q_em_2023_005','topic_wassce_em_differentiation'),('q_em_2023_006','topic_wassce_em_integration'),
  ('q_em_2023_007','topic_wassce_em_differentiation'),('q_em_2023_008','topic_wassce_em_differentiation'),
  ('q_em_2023_009','topic_wassce_em_integration'),('q_em_2023_010','topic_wassce_em_differentiation'),
  ('q_em_2023_011','topic_wassce_em_differentiation'),('q_em_2023_012','topic_wassce_em_integration'),
  ('q_em_2023_013','topic_wassce_em_differentiation'),('q_em_2023_014','topic_wassce_em_integration'),
  ('q_em_2023_015','topic_wassce_em_differentiation'),('q_em_2023_016','topic_wassce_em_coord_geom'),
  ('q_em_2023_017','topic_wassce_em_coord_geom'),('q_em_2023_018','topic_wassce_em_coord_geom'),
  ('q_em_2023_019','topic_wassce_em_coord_geom'),('q_em_2023_020','topic_wassce_em_coord_geom'),
  ('q_em_2023_021','topic_wassce_em_vectors'),('q_em_2023_022','topic_wassce_em_vectors'),
  ('q_em_2023_023','topic_wassce_em_vectors'),('q_em_2023_024','topic_wassce_em_vectors'),
  ('q_em_2023_025','topic_wassce_em_vectors'),('q_em_2023_026','topic_wassce_em_trig'),
  ('q_em_2023_027','topic_wassce_em_trig'),('q_em_2023_028','topic_wassce_em_trig'),
  ('q_em_2023_029','topic_wassce_em_trig'),('q_em_2023_030','topic_wassce_em_trig'),
  ('q_em_2023_031','topic_wassce_em_trig'),('q_em_2023_032','topic_wassce_em_trig'),
  ('q_em_2023_033','topic_wassce_em_trig'),('q_em_2023_034','topic_wassce_em_trig'),
  ('q_em_2023_035','topic_wassce_em_trig'),('q_em_2023_036','topic_wassce_em_stats'),
  ('q_em_2023_037','topic_wassce_em_stats'),('q_em_2023_038','topic_wassce_em_stats'),
  ('q_em_2023_039','topic_wassce_em_stats'),('q_em_2023_040','topic_wassce_em_stats'),
  ('q_em_2023_041','topic_wassce_em_stats'),('q_em_2023_042','topic_wassce_em_stats'),
  ('q_em_2023_043','topic_wassce_em_stats'),('q_em_2023_044','topic_wassce_em_stats'),
  ('q_em_2023_045','topic_wassce_em_stats'),('q_em_2023_046','topic_wassce_em_matrices'),
  ('q_em_2023_047','topic_wassce_em_sequences'),('q_em_2023_048','topic_wassce_em_sequences'),
  ('q_em_2023_049','topic_wassce_em_matrices'),('q_em_2023_050','topic_wassce_em_sequences'),
  ('q_wassce_emath_2023_31','topic_wassce_em_vectors'),('q_wassce_emath_2023_32','topic_wassce_em_vectors'),
  ('q_wassce_emath_2023_33','topic_wassce_em_vectors'),('q_wassce_emath_2023_34','topic_wassce_em_matrices'),
  ('q_wassce_emath_2023_35','topic_wassce_em_matrices'),('q_wassce_emath_2023_36','topic_wassce_em_vectors'),
  ('q_wassce_emath_2023_37','topic_wassce_em_matrices'),('q_wassce_emath_2023_38','topic_wassce_em_vectors'),
  ('q_wassce_emath_2023_39','topic_wassce_em_matrices'),('q_wassce_emath_2023_40','topic_wassce_em_vectors');

INSERT INTO _migration_249_guard(valid)
SELECT CASE WHEN
  (SELECT COUNT(*) FROM _migration_249_map)=100
  AND (SELECT COUNT(*) FROM questions WHERE subject_id='subj_wassce_elect_math')=204
  AND EXISTS (SELECT 1 FROM subjects WHERE id='subj_wassce_elect_math' AND exam_type_id='exam_wassce' AND is_active=1)
  AND NOT EXISTS (SELECT 1 FROM _migration_249_map m LEFT JOIN questions q ON q.id=m.question_id LEFT JOIN topics t ON t.id=m.topic_id
    WHERE q.id IS NULL OR q.subject_id IS NOT 'subj_wassce_elect_math' OR t.id IS NULL OR t.subject_id IS NOT 'subj_wassce_elect_math'
      OR (q.topic_id IS NOT NULL AND q.topic_id IS NOT m.topic_id))
  AND NOT EXISTS (SELECT 1 FROM question_bank_remediation_log l LEFT JOIN _migration_249_map m ON m.question_id=l.entity_id
    WHERE l.migration_id='249_wassce_topic_elective_math_part_1' AND (l.entity_type IS NOT 'question' OR l.field_name IS NOT 'topic_id'
      OR l.old_value IS NOT NULL OR m.question_id IS NULL OR l.new_value IS NOT m.topic_id))
  AND (
    ((SELECT COUNT(*) FROM questions WHERE subject_id='subj_wassce_elect_math' AND topic_id IS NULL)=122
      AND (SELECT COUNT(*) FROM questions q JOIN _migration_249_map m ON m.question_id=q.id WHERE q.topic_id IS NULL)=100
      AND (SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id='249_wassce_topic_elective_math_part_1')=0)
    OR
    ((SELECT COUNT(*) FROM questions WHERE subject_id='subj_wassce_elect_math' AND topic_id IS NULL)=22
      AND (SELECT COUNT(*) FROM questions q JOIN _migration_249_map m ON m.question_id=q.id WHERE q.topic_id IS m.topic_id)=100
      AND (SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id='249_wassce_topic_elective_math_part_1')=100)
  )
THEN 1 ELSE 0 END;

INSERT OR IGNORE INTO question_bank_remediation_log(migration_id,entity_type,entity_id,field_name,old_value,new_value)
SELECT '249_wassce_topic_elective_math_part_1','question',q.id,'topic_id',q.topic_id,m.topic_id
FROM questions q JOIN _migration_249_map m ON m.question_id=q.id WHERE q.topic_id IS NULL;
UPDATE questions SET topic_id=(SELECT m.topic_id FROM _migration_249_map m WHERE m.question_id=questions.id)
WHERE topic_id IS NULL AND id IN (SELECT question_id FROM _migration_249_map);

INSERT INTO _migration_249_guard(valid)
SELECT CASE WHEN
  (SELECT COUNT(*) FROM questions WHERE subject_id='subj_wassce_elect_math')=204
  AND (SELECT COUNT(*) FROM questions WHERE subject_id='subj_wassce_elect_math' AND topic_id IS NULL)=22
  AND (SELECT COUNT(*) FROM questions q JOIN _migration_249_map m ON m.question_id=q.id WHERE q.topic_id IS m.topic_id)=100
  AND (SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id='249_wassce_topic_elective_math_part_1')=100
  AND NOT EXISTS (SELECT 1 FROM questions q JOIN topics t ON t.id=q.topic_id WHERE q.topic_id IS NOT NULL AND q.subject_id IS NOT t.subject_id)
THEN 1 ELSE 0 END;
DROP TABLE _migration_249_map;
DROP TABLE _migration_249_guard;
