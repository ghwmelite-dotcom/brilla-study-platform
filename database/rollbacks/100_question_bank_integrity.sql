-- Rollback for migration 100.
-- Execute only as one D1 batch (for example: wrangler d1 execute --file).
-- Any drift, deleted row, or reused slug aborts before mutation. The final
-- guard makes compare-and-swap misses abort the batch instead of partially
-- restoring historical values. The immutable audit ledger is retained.

CREATE TEMP TABLE _rollback_100_guard (
  ok INTEGER NOT NULL CHECK (ok = 1)
);

-- Require a real migration ledger and prove every current field still equals
-- the value written by migration 100. This protects legitimate later edits.
INSERT INTO _rollback_100_guard (ok)
SELECT CASE WHEN
  EXISTS (
    SELECT 1 FROM question_bank_remediation_log
    WHERE migration_id = '100_question_bank_integrity'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM question_bank_remediation_log l
    LEFT JOIN questions q ON q.id = l.entity_id
    WHERE l.migration_id = '100_question_bank_integrity'
      AND l.entity_type = 'question'
      AND (
        q.id IS NULL
        OR (l.field_name = 'topic_id' AND q.topic_id IS NOT l.new_value)
        OR (l.field_name = 'exam_type_id' AND q.exam_type_id IS NOT l.new_value)
      )
  )
  AND NOT EXISTS (
    SELECT 1
    FROM question_bank_remediation_log l
    LEFT JOIN subjects s ON s.id = l.entity_id
    WHERE l.migration_id = '100_question_bank_integrity'
      AND l.entity_type = 'subject'
      AND (
        s.id IS NULL
        OR (l.field_name = 'exam_type_id' AND s.exam_type_id IS NOT l.new_value)
        OR (l.field_name = 'category_id' AND s.category_id IS NOT l.new_value)
        OR (l.field_name = 'waec_code' AND s.waec_code IS NOT l.new_value)
        OR (l.field_name = 'slug' AND s.slug IS NOT l.new_value)
        OR (l.field_name = 'is_active' AND CAST(s.is_active AS TEXT) IS NOT l.new_value)
      )
  )
THEN 1 ELSE 0 END;

-- Refuse rollback when a post-migration row has reused a slug that must be
-- restored. No row has been changed when this guard fails.
INSERT INTO _rollback_100_guard (ok)
SELECT CASE WHEN NOT EXISTS (
  SELECT 1
  FROM question_bank_remediation_log l
  JOIN subjects occupied ON occupied.slug = l.old_value
    AND occupied.id <> l.entity_id
  WHERE l.migration_id = '100_question_bank_integrity'
    AND l.entity_type = 'subject'
    AND l.field_name = 'slug'
) THEN 1 ELSE 0 END;

-- Triggers are part of migration 100. Drop them inside the same atomic batch
-- before restoring the deliberately pre-remediation relationships.
DROP TRIGGER IF EXISTS trg_questions_subject_exam_insert;
DROP TRIGGER IF EXISTS trg_questions_subject_exam_update;
DROP TRIGGER IF EXISTS trg_questions_subject_topic_insert;
DROP TRIGGER IF EXISTS trg_questions_subject_topic_update;
DROP TRIGGER IF EXISTS trg_subject_exam_update_with_questions;
DROP TRIGGER IF EXISTS trg_topic_subject_update_with_questions;

-- Question relationships first, guarded by current=new compare-and-swap.
UPDATE questions
SET topic_id = (
  SELECT l.old_value
  FROM question_bank_remediation_log l
  WHERE l.migration_id = '100_question_bank_integrity'
    AND l.entity_type = 'question'
    AND l.entity_id = questions.id
    AND l.field_name = 'topic_id'
)
WHERE topic_id IS (
  SELECT l.new_value
  FROM question_bank_remediation_log l
  WHERE l.migration_id = '100_question_bank_integrity'
    AND l.entity_type = 'question'
    AND l.entity_id = questions.id
    AND l.field_name = 'topic_id'
)
AND EXISTS (
  SELECT 1 FROM question_bank_remediation_log l
  WHERE l.migration_id = '100_question_bank_integrity'
    AND l.entity_type = 'question'
    AND l.entity_id = questions.id
    AND l.field_name = 'topic_id'
);

UPDATE questions
SET exam_type_id = (
  SELECT l.old_value
  FROM question_bank_remediation_log l
  WHERE l.migration_id = '100_question_bank_integrity'
    AND l.entity_type = 'question'
    AND l.entity_id = questions.id
    AND l.field_name = 'exam_type_id'
)
WHERE exam_type_id IS (
  SELECT l.new_value
  FROM question_bank_remediation_log l
  WHERE l.migration_id = '100_question_bank_integrity'
    AND l.entity_type = 'question'
    AND l.entity_id = questions.id
    AND l.field_name = 'exam_type_id'
)
AND EXISTS (
  SELECT 1 FROM question_bank_remediation_log l
  WHERE l.migration_id = '100_question_bank_integrity'
    AND l.entity_type = 'question'
    AND l.entity_id = questions.id
    AND l.field_name = 'exam_type_id'
);

UPDATE subjects
SET exam_type_id = (
  SELECT l.old_value FROM question_bank_remediation_log l
  WHERE l.migration_id = '100_question_bank_integrity'
    AND l.entity_type = 'subject' AND l.entity_id = subjects.id
    AND l.field_name = 'exam_type_id'
)
WHERE exam_type_id IS (
  SELECT l.new_value FROM question_bank_remediation_log l
  WHERE l.migration_id = '100_question_bank_integrity'
    AND l.entity_type = 'subject' AND l.entity_id = subjects.id
    AND l.field_name = 'exam_type_id'
)
AND EXISTS (
  SELECT 1 FROM question_bank_remediation_log l
  WHERE l.migration_id = '100_question_bank_integrity'
    AND l.entity_type = 'subject' AND l.entity_id = subjects.id
    AND l.field_name = 'exam_type_id'
);

UPDATE subjects
SET category_id = (
  SELECT l.old_value FROM question_bank_remediation_log l
  WHERE l.migration_id = '100_question_bank_integrity'
    AND l.entity_type = 'subject' AND l.entity_id = subjects.id
    AND l.field_name = 'category_id'
)
WHERE category_id IS (
  SELECT l.new_value FROM question_bank_remediation_log l
  WHERE l.migration_id = '100_question_bank_integrity'
    AND l.entity_type = 'subject' AND l.entity_id = subjects.id
    AND l.field_name = 'category_id'
)
AND EXISTS (
  SELECT 1 FROM question_bank_remediation_log l
  WHERE l.migration_id = '100_question_bank_integrity'
    AND l.entity_type = 'subject' AND l.entity_id = subjects.id
    AND l.field_name = 'category_id'
);

UPDATE subjects
SET waec_code = (
  SELECT l.old_value FROM question_bank_remediation_log l
  WHERE l.migration_id = '100_question_bank_integrity'
    AND l.entity_type = 'subject' AND l.entity_id = subjects.id
    AND l.field_name = 'waec_code'
)
WHERE waec_code IS (
  SELECT l.new_value FROM question_bank_remediation_log l
  WHERE l.migration_id = '100_question_bank_integrity'
    AND l.entity_type = 'subject' AND l.entity_id = subjects.id
    AND l.field_name = 'waec_code'
)
AND EXISTS (
  SELECT 1 FROM question_bank_remediation_log l
  WHERE l.migration_id = '100_question_bank_integrity'
    AND l.entity_type = 'subject' AND l.entity_id = subjects.id
    AND l.field_name = 'waec_code'
);

UPDATE subjects
SET slug = (
  SELECT l.old_value FROM question_bank_remediation_log l
  WHERE l.migration_id = '100_question_bank_integrity'
    AND l.entity_type = 'subject' AND l.entity_id = subjects.id
    AND l.field_name = 'slug'
)
WHERE slug IS (
  SELECT l.new_value FROM question_bank_remediation_log l
  WHERE l.migration_id = '100_question_bank_integrity'
    AND l.entity_type = 'subject' AND l.entity_id = subjects.id
    AND l.field_name = 'slug'
)
AND EXISTS (
  SELECT 1 FROM question_bank_remediation_log l
  WHERE l.migration_id = '100_question_bank_integrity'
    AND l.entity_type = 'subject' AND l.entity_id = subjects.id
    AND l.field_name = 'slug'
);

UPDATE subjects
SET is_active = CAST((
  SELECT l.old_value FROM question_bank_remediation_log l
  WHERE l.migration_id = '100_question_bank_integrity'
    AND l.entity_type = 'subject' AND l.entity_id = subjects.id
    AND l.field_name = 'is_active'
) AS INTEGER)
WHERE CAST(is_active AS TEXT) IS (
  SELECT l.new_value FROM question_bank_remediation_log l
  WHERE l.migration_id = '100_question_bank_integrity'
    AND l.entity_type = 'subject' AND l.entity_id = subjects.id
    AND l.field_name = 'is_active'
)
AND EXISTS (
  SELECT 1 FROM question_bank_remediation_log l
  WHERE l.migration_id = '100_question_bank_integrity'
    AND l.entity_type = 'subject' AND l.entity_id = subjects.id
    AND l.field_name = 'is_active'
);

-- Compare the final state to every ledgered old value. A miss aborts the same
-- batch, rolling back all updates and trigger drops.
INSERT INTO _rollback_100_guard (ok)
SELECT CASE WHEN
  NOT EXISTS (
    SELECT 1
    FROM question_bank_remediation_log l
    LEFT JOIN questions q ON q.id = l.entity_id
    WHERE l.migration_id = '100_question_bank_integrity'
      AND l.entity_type = 'question'
      AND (
        q.id IS NULL
        OR (l.field_name = 'topic_id' AND q.topic_id IS NOT l.old_value)
        OR (l.field_name = 'exam_type_id' AND q.exam_type_id IS NOT l.old_value)
      )
  )
  AND NOT EXISTS (
    SELECT 1
    FROM question_bank_remediation_log l
    LEFT JOIN subjects s ON s.id = l.entity_id
    WHERE l.migration_id = '100_question_bank_integrity'
      AND l.entity_type = 'subject'
      AND (
        s.id IS NULL
        OR (l.field_name = 'exam_type_id' AND s.exam_type_id IS NOT l.old_value)
        OR (l.field_name = 'category_id' AND s.category_id IS NOT l.old_value)
        OR (l.field_name = 'waec_code' AND s.waec_code IS NOT l.old_value)
        OR (l.field_name = 'slug' AND s.slug IS NOT l.old_value)
        OR (l.field_name = 'is_active' AND CAST(s.is_active AS TEXT) IS NOT l.old_value)
      )
  )
THEN 1 ELSE 0 END;

DROP TABLE _rollback_100_guard;