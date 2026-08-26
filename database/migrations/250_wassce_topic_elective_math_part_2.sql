-- 250: Assign the remaining 22 reviewed-source WASSCE Elective Mathematics questions.
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS _migration_250_guard (valid INTEGER NOT NULL CHECK (valid = 1));
DELETE FROM _migration_250_guard;
CREATE TABLE IF NOT EXISTS _migration_250_map (question_id TEXT PRIMARY KEY, topic_id TEXT NOT NULL);
DELETE FROM _migration_250_map;
INSERT INTO _migration_250_map(question_id,topic_id) VALUES
 ('q_wassce_emath_2023_41','topic_wassce_em_stats'),('q_wassce_emath_2023_42','topic_wassce_em_stats'),
 ('q_wassce_emath_2023_46','topic_wassce_em_stats'),('q_wassce_emath_2023_48','topic_wassce_em_stats'),
 ('q_wassce_emath_2023_49','topic_wassce_em_stats'),('q_wassce_emath_2023_50','topic_wassce_em_stats'),
 ('q_wassce_emath_2024_31','topic_wassce_em_vectors'),('q_wassce_emath_2024_32','topic_wassce_em_vectors'),
 ('q_wassce_emath_2024_33','topic_wassce_em_vectors'),('q_wassce_emath_2024_34','topic_wassce_em_matrices'),
 ('q_wassce_emath_2024_35','topic_wassce_em_matrices'),('q_wassce_emath_2024_36','topic_wassce_em_matrices'),
 ('q_wassce_emath_2024_37','topic_wassce_em_vectors'),('q_wassce_emath_2024_38','topic_wassce_em_vectors'),
 ('q_wassce_emath_2024_39','topic_wassce_em_matrices'),('q_wassce_emath_2024_40','topic_wassce_em_vectors'),
 ('q_wassce_emath_2024_41','topic_wassce_em_stats'),('q_wassce_emath_2024_42','topic_wassce_em_stats'),
 ('q_wassce_emath_2024_46','topic_wassce_em_stats'),('q_wassce_emath_2024_47','topic_wassce_em_stats'),
 ('q_wassce_emath_2024_49','topic_wassce_em_stats'),('q_wassce_emath_2024_50','topic_wassce_em_stats');

INSERT INTO _migration_250_guard(valid)
SELECT CASE WHEN
 (SELECT COUNT(*) FROM _migration_250_map)=22
 AND (SELECT COUNT(*) FROM questions WHERE subject_id='subj_wassce_elect_math')=204
 AND (SELECT COUNT(*) FROM question_bank_remediation_log l JOIN questions q ON q.id=l.entity_id
   WHERE l.migration_id='249_wassce_topic_elective_math_part_1' AND l.field_name='topic_id' AND q.topic_id IS l.new_value)=100
 AND NOT EXISTS (SELECT 1 FROM _migration_250_map m LEFT JOIN questions q ON q.id=m.question_id LEFT JOIN topics t ON t.id=m.topic_id
   WHERE q.id IS NULL OR q.subject_id IS NOT 'subj_wassce_elect_math' OR t.id IS NULL OR t.subject_id IS NOT 'subj_wassce_elect_math'
    OR (q.topic_id IS NOT NULL AND q.topic_id IS NOT m.topic_id))
 AND NOT EXISTS (SELECT 1 FROM question_bank_remediation_log l LEFT JOIN _migration_250_map m ON m.question_id=l.entity_id
   WHERE l.migration_id='250_wassce_topic_elective_math_part_2' AND (l.entity_type IS NOT 'question' OR l.field_name IS NOT 'topic_id'
    OR l.old_value IS NOT NULL OR m.question_id IS NULL OR l.new_value IS NOT m.topic_id))
 AND (
   ((SELECT COUNT(*) FROM questions WHERE subject_id='subj_wassce_elect_math' AND topic_id IS NULL)=22
    AND (SELECT COUNT(*) FROM questions q JOIN _migration_250_map m ON m.question_id=q.id WHERE q.topic_id IS NULL)=22
    AND (SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id='250_wassce_topic_elective_math_part_2')=0)
   OR
   ((SELECT COUNT(*) FROM questions WHERE subject_id='subj_wassce_elect_math' AND topic_id IS NULL)=0
    AND (SELECT COUNT(*) FROM questions q JOIN _migration_250_map m ON m.question_id=q.id WHERE q.topic_id IS m.topic_id)=22
    AND (SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id='250_wassce_topic_elective_math_part_2')=22)
 )
THEN 1 ELSE 0 END;

INSERT OR IGNORE INTO question_bank_remediation_log(migration_id,entity_type,entity_id,field_name,old_value,new_value)
SELECT '250_wassce_topic_elective_math_part_2','question',q.id,'topic_id',q.topic_id,m.topic_id
FROM questions q JOIN _migration_250_map m ON m.question_id=q.id WHERE q.topic_id IS NULL;
UPDATE questions SET topic_id=(SELECT m.topic_id FROM _migration_250_map m WHERE m.question_id=questions.id)
WHERE topic_id IS NULL AND id IN (SELECT question_id FROM _migration_250_map);

INSERT INTO _migration_250_guard(valid)
SELECT CASE WHEN
 (SELECT COUNT(*) FROM questions WHERE subject_id='subj_wassce_elect_math')=204
 AND (SELECT COUNT(*) FROM questions WHERE subject_id='subj_wassce_elect_math' AND topic_id IS NULL)=0
 AND (SELECT COUNT(*) FROM questions q JOIN _migration_250_map m ON m.question_id=q.id WHERE q.topic_id IS m.topic_id)=22
 AND (SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id='250_wassce_topic_elective_math_part_2')=22
 AND NOT EXISTS (SELECT 1 FROM questions q JOIN topics t ON t.id=q.topic_id WHERE q.topic_id IS NOT NULL AND q.subject_id IS NOT t.subject_id)
THEN 1 ELSE 0 END;
DROP TABLE _migration_250_map;
DROP TABLE _migration_250_guard;
