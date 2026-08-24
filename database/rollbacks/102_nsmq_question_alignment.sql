CREATE TABLE IF NOT EXISTS _rollback_102_guard (
  valid INTEGER NOT NULL CHECK (valid = 1)
);
DELETE FROM _rollback_102_guard;

INSERT INTO _rollback_102_guard(valid)
SELECT CASE WHEN
  EXISTS (
    SELECT 1 FROM question_bank_remediation_log
    WHERE migration_id = '102_nsmq_question_alignment'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM question_bank_remediation_log l
    LEFT JOIN questions q ON q.id = l.entity_id
    WHERE l.migration_id = '102_nsmq_question_alignment'
      AND l.entity_type = 'question'
      AND (
        q.id IS NULL
        OR (l.field_name = 'topic_id' AND q.topic_id IS NOT l.new_value)
        OR (l.field_name = 'subject_id' AND q.subject_id IS NOT l.new_value)
        OR (l.field_name = 'exam_type_id' AND q.exam_type_id IS NOT l.new_value)
        OR (l.field_name = 'preexisting_canonical' AND q.subject_id IS NOT l.new_value)
      )
  )
  AND NOT EXISTS (
    SELECT 1
    FROM question_bank_remediation_log l
    LEFT JOIN subjects s ON s.id = l.entity_id
    WHERE l.migration_id = '102_nsmq_question_alignment'
      AND l.entity_type = 'subject'
      AND (s.id IS NULL OR (l.field_name = 'is_active' AND CAST(s.is_active AS TEXT) IS NOT l.new_value))
  )
  AND NOT EXISTS (
    SELECT 1 FROM questions q
    WHERE q.subject_id IN (
      'subj_nsmq_math', 'subj_nsmq_physics', 'subj_nsmq_chemistry', 'subj_nsmq_biology'
    )
      AND NOT EXISTS (
        SELECT 1 FROM question_bank_remediation_log l
        WHERE l.migration_id = '102_nsmq_question_alignment'
          AND l.entity_type = 'question'
          AND l.entity_id = q.id
          AND l.field_name IN ('subject_id', 'preexisting_canonical')
      )
  )
THEN 1 ELSE 0 END;

UPDATE questions
SET topic_id = CASE WHEN EXISTS (
      SELECT 1 FROM question_bank_remediation_log l
      WHERE l.migration_id = '102_nsmq_question_alignment'
        AND l.entity_type = 'question' AND l.entity_id = questions.id
        AND l.field_name = 'topic_id'
    ) THEN (
      SELECT l.old_value FROM question_bank_remediation_log l
      WHERE l.migration_id = '102_nsmq_question_alignment'
        AND l.entity_type = 'question' AND l.entity_id = questions.id
        AND l.field_name = 'topic_id'
    ) ELSE topic_id END,
    subject_id = (
      SELECT l.old_value FROM question_bank_remediation_log l
      WHERE l.migration_id = '102_nsmq_question_alignment'
        AND l.entity_type = 'question' AND l.entity_id = questions.id
        AND l.field_name = 'subject_id'
    ),
    exam_type_id = (
      SELECT l.old_value FROM question_bank_remediation_log l
      WHERE l.migration_id = '102_nsmq_question_alignment'
        AND l.entity_type = 'question' AND l.entity_id = questions.id
        AND l.field_name = 'exam_type_id'
    )
WHERE EXISTS (
  SELECT 1 FROM question_bank_remediation_log l
  WHERE l.migration_id = '102_nsmq_question_alignment'
    AND l.entity_type = 'question' AND l.entity_id = questions.id
    AND l.field_name = 'subject_id'
);

UPDATE subjects
SET is_active = CAST((
  SELECT l.old_value FROM question_bank_remediation_log l
  WHERE l.migration_id = '102_nsmq_question_alignment'
    AND l.entity_type = 'subject' AND l.entity_id = subjects.id
    AND l.field_name = 'is_active'
) AS INTEGER)
WHERE EXISTS (
  SELECT 1 FROM question_bank_remediation_log l
  WHERE l.migration_id = '102_nsmq_question_alignment'
    AND l.entity_type = 'subject' AND l.entity_id = subjects.id
    AND l.field_name = 'is_active'
);

INSERT INTO _rollback_102_guard(valid)
SELECT CASE WHEN NOT EXISTS (
  SELECT 1 FROM questions q JOIN subjects s ON s.id = q.subject_id
  WHERE q.exam_type_id IS NOT NULL AND q.exam_type_id IS NOT s.exam_type_id
) THEN 1 ELSE 0 END;
INSERT INTO _rollback_102_guard(valid)
SELECT CASE WHEN NOT EXISTS (
  SELECT 1 FROM questions q JOIN topics t ON t.id = q.topic_id
  WHERE q.topic_id IS NOT NULL AND q.subject_id IS NOT t.subject_id
) THEN 1 ELSE 0 END;
DROP TABLE _rollback_102_guard;
