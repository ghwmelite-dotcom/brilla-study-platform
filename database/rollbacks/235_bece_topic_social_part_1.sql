-- Roll back 235_bece_topic_social_part_1; the immutable remediation ledger is retained for audit.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS _rollback_235_guard (valid INTEGER NOT NULL CHECK (valid = 1));
DELETE FROM _rollback_235_guard;

INSERT INTO _rollback_235_guard(valid)
SELECT CASE WHEN
  (SELECT COUNT(*) FROM question_bank_remediation_log
   WHERE migration_id = '235_bece_topic_social_part_1'
     AND entity_type = 'question'
     AND field_name = 'topic_id'
     AND old_value IS NULL) = 100
  AND NOT EXISTS (
    SELECT 1
    FROM question_bank_remediation_log l
    LEFT JOIN questions q ON q.id = l.entity_id
    WHERE l.migration_id = '235_bece_topic_social_part_1'
      AND (q.id IS NULL OR q.topic_id IS NOT l.new_value)
  )
THEN 1 ELSE 0 END;

UPDATE questions
SET topic_id = (
  SELECT l.old_value
  FROM question_bank_remediation_log l
  WHERE l.migration_id = '235_bece_topic_social_part_1'
    AND l.entity_type = 'question'
    AND l.entity_id = questions.id
    AND l.field_name = 'topic_id'
)
WHERE EXISTS (
  SELECT 1
  FROM question_bank_remediation_log l
  WHERE l.migration_id = '235_bece_topic_social_part_1'
    AND l.entity_type = 'question'
    AND l.entity_id = questions.id
    AND l.field_name = 'topic_id'
);

INSERT INTO _rollback_235_guard(valid)
SELECT CASE WHEN
  (SELECT COUNT(*)
   FROM question_bank_remediation_log l
   JOIN questions q ON q.id = l.entity_id
   WHERE l.migration_id = '235_bece_topic_social_part_1'
     AND l.entity_type = 'question'
     AND l.field_name = 'topic_id'
     AND q.topic_id IS l.old_value) = 100
  AND NOT EXISTS (
    SELECT 1 FROM questions q JOIN topics t ON t.id = q.topic_id
    WHERE q.topic_id IS NOT NULL AND q.subject_id IS NOT t.subject_id
  )
THEN 1 ELSE 0 END;

DROP TABLE _rollback_235_guard;
