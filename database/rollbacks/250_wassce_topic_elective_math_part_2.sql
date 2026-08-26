-- Roll back 250 only after 251; retain the immutable remediation ledger.
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS _rollback_250_guard(valid INTEGER NOT NULL CHECK(valid=1));
DELETE FROM _rollback_250_guard;
INSERT INTO _rollback_250_guard(valid)
SELECT CASE WHEN
 (SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id='250_wassce_topic_elective_math_part_2'
  AND entity_type='question' AND field_name='topic_id' AND old_value IS NULL)=22
 AND NOT EXISTS (SELECT 1 FROM question_bank_remediation_log l LEFT JOIN questions q ON q.id=l.entity_id
  WHERE l.migration_id='250_wassce_topic_elective_math_part_2' AND (q.id IS NULL OR q.topic_id IS NOT l.new_value))
 AND NOT EXISTS (SELECT 1 FROM question_bank_remediation_log l JOIN questions q ON q.id=l.entity_id
  WHERE l.migration_id='251_wassce_elective_math_content_corrections'
   AND ((l.field_name='options' AND q.options IS l.new_value) OR (l.field_name='explanation' AND q.explanation IS l.new_value)))
THEN 1 ELSE 0 END;
UPDATE questions SET topic_id=(SELECT l.old_value FROM question_bank_remediation_log l
 WHERE l.migration_id='250_wassce_topic_elective_math_part_2' AND l.entity_id=questions.id AND l.field_name='topic_id')
WHERE EXISTS (SELECT 1 FROM question_bank_remediation_log l WHERE l.migration_id='250_wassce_topic_elective_math_part_2'
 AND l.entity_id=questions.id AND l.field_name='topic_id');
INSERT INTO _rollback_250_guard(valid)
SELECT CASE WHEN (SELECT COUNT(*) FROM question_bank_remediation_log l JOIN questions q ON q.id=l.entity_id
 WHERE l.migration_id='250_wassce_topic_elective_math_part_2' AND q.topic_id IS l.old_value)=22
 AND (SELECT COUNT(*) FROM questions WHERE subject_id='subj_wassce_elect_math')=204
 AND (SELECT COUNT(*) FROM questions WHERE subject_id='subj_wassce_elect_math' AND topic_id IS NULL)=22
THEN 1 ELSE 0 END;
DROP TABLE _rollback_250_guard;
