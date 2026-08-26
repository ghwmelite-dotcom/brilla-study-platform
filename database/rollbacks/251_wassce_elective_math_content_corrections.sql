-- Roll back 251 content corrections exactly; retain the immutable remediation ledger.
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS _rollback_251_guard(valid INTEGER NOT NULL CHECK(valid=1));
DELETE FROM _rollback_251_guard;
INSERT INTO _rollback_251_guard(valid)
SELECT CASE WHEN
 (SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id='251_wassce_elective_math_content_corrections'
   AND entity_type='question' AND field_name IN ('options','explanation'))=9
 AND NOT EXISTS (SELECT 1 FROM question_bank_remediation_log l LEFT JOIN questions q ON q.id=l.entity_id
   WHERE l.migration_id='251_wassce_elective_math_content_corrections'
    AND (q.id IS NULL OR q.subject_id IS NOT 'subj_wassce_elect_math'
      OR (l.field_name='options' AND q.options IS NOT l.new_value)
      OR (l.field_name='explanation' AND q.explanation IS NOT l.new_value)))
THEN 1 ELSE 0 END;
UPDATE questions SET options=(SELECT l.old_value FROM question_bank_remediation_log l
 WHERE l.migration_id='251_wassce_elective_math_content_corrections' AND l.entity_id=questions.id AND l.field_name='options')
WHERE EXISTS (SELECT 1 FROM question_bank_remediation_log l WHERE l.migration_id='251_wassce_elective_math_content_corrections'
 AND l.entity_id=questions.id AND l.field_name='options');
UPDATE questions SET explanation=(SELECT l.old_value FROM question_bank_remediation_log l
 WHERE l.migration_id='251_wassce_elective_math_content_corrections' AND l.entity_id=questions.id AND l.field_name='explanation')
WHERE EXISTS (SELECT 1 FROM question_bank_remediation_log l WHERE l.migration_id='251_wassce_elective_math_content_corrections'
 AND l.entity_id=questions.id AND l.field_name='explanation');
INSERT INTO _rollback_251_guard(valid)
SELECT CASE WHEN (SELECT COUNT(*) FROM question_bank_remediation_log l JOIN questions q ON q.id=l.entity_id
 WHERE l.migration_id='251_wassce_elective_math_content_corrections'
  AND ((l.field_name='options' AND q.options IS l.old_value) OR (l.field_name='explanation' AND q.explanation IS l.old_value)))=9
THEN 1 ELSE 0 END;
DROP TABLE _rollback_251_guard;
