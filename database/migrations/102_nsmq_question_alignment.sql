CREATE TABLE IF NOT EXISTS _migration_102_guard (
  valid INTEGER NOT NULL CHECK (valid = 1)
);
DELETE FROM _migration_102_guard;

WITH subject_map(source_subject_id, target_subject_id) AS (
  VALUES
    ('subj_wassce_core_math', 'subj_nsmq_math'),
    ('subj_wassce_physics', 'subj_nsmq_physics'),
    ('subj_wassce_chemistry', 'subj_nsmq_chemistry'),
    ('subj_wassce_biology', 'subj_nsmq_biology')
)
INSERT INTO _migration_102_guard(valid)
SELECT CASE WHEN
  (SELECT COUNT(*) FROM exam_types WHERE id IN ('exam_wassce', 'exam_nsmq')) = 2
  AND (SELECT COUNT(*) FROM subjects s JOIN subject_map m ON s.id = m.source_subject_id
       WHERE s.exam_type_id = 'exam_wassce' AND s.is_active = 1) = 4
  AND (SELECT COUNT(*) FROM subjects s JOIN subject_map m ON s.id = m.target_subject_id
       WHERE s.exam_type_id = 'exam_nsmq' AND s.is_active = 1) = 4
  AND (SELECT COUNT(*) FROM subjects WHERE id IN (
    'subj_math', 'subj_physics', 'subj_chemistry', 'subj_biology'
  )) IN (0, 4)
  AND (SELECT COUNT(*) FROM questions WHERE subject_id IN (
    'subj_math', 'subj_physics', 'subj_chemistry', 'subj_biology'
  )) = 0
  AND NOT EXISTS (
    SELECT 1 FROM questions q
    WHERE q.round_type IS NOT NULL
      AND q.subject_id NOT IN (
        SELECT source_subject_id FROM subject_map
        UNION ALL
        SELECT target_subject_id FROM subject_map
      )
  )
  AND NOT EXISTS (
    SELECT 1 FROM questions q JOIN subjects s ON s.id = q.subject_id
    WHERE q.exam_type_id IS NOT NULL AND q.exam_type_id IS NOT s.exam_type_id
  )
  AND NOT EXISTS (
    SELECT 1 FROM questions q JOIN topics t ON t.id = q.topic_id
    WHERE q.topic_id IS NOT NULL AND q.subject_id IS NOT t.subject_id
  )
  AND (
    (
      (SELECT COUNT(*) FROM questions q JOIN subject_map m ON m.source_subject_id = q.subject_id
       WHERE q.round_type IS NOT NULL) > 0
    )
    OR (
      (SELECT COUNT(*) FROM questions q JOIN subject_map m ON m.source_subject_id = q.subject_id
           WHERE q.round_type IS NOT NULL) = 0
      AND (SELECT COUNT(*) FROM questions q JOIN subject_map m ON m.target_subject_id = q.subject_id
           WHERE q.round_type IS NOT NULL) > 0
    )
  )
THEN 1 ELSE 0 END;

WITH target_subjects(subject_id) AS (
  VALUES
    ('subj_nsmq_math'),
    ('subj_nsmq_physics'),
    ('subj_nsmq_chemistry'),
    ('subj_nsmq_biology')
)
INSERT OR IGNORE INTO question_bank_remediation_log
  (migration_id, entity_type, entity_id, field_name, old_value, new_value)
SELECT '102_nsmq_question_alignment', 'question', q.id, 'preexisting_canonical',
       q.subject_id, q.subject_id
FROM questions q
JOIN target_subjects t ON t.subject_id = q.subject_id
WHERE q.round_type IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM question_bank_remediation_log
    WHERE migration_id = '102_nsmq_question_alignment'
  );

WITH subject_map(source_subject_id, target_subject_id) AS (
  VALUES
    ('subj_wassce_core_math', 'subj_nsmq_math'),
    ('subj_wassce_physics', 'subj_nsmq_physics'),
    ('subj_wassce_chemistry', 'subj_nsmq_chemistry'),
    ('subj_wassce_biology', 'subj_nsmq_biology')
)
INSERT OR IGNORE INTO question_bank_remediation_log
  (migration_id, entity_type, entity_id, field_name, old_value, new_value)
SELECT '102_nsmq_question_alignment', 'question', q.id, 'topic_id', q.topic_id,
       CASE
         WHEN q.topic_id IS NOT NULL AND (
           SELECT COUNT(*) FROM topics candidate JOIN topics old_topic ON old_topic.id = q.topic_id
           WHERE candidate.subject_id = m.target_subject_id
             AND lower(trim(candidate.name)) = lower(trim(old_topic.name))
         ) = 1 THEN (
           SELECT MIN(candidate.id) FROM topics candidate JOIN topics old_topic ON old_topic.id = q.topic_id
           WHERE candidate.subject_id = m.target_subject_id
             AND lower(trim(candidate.name)) = lower(trim(old_topic.name))
         )
         ELSE NULL
       END
FROM questions q
JOIN subject_map m ON m.source_subject_id = q.subject_id
WHERE q.round_type IS NOT NULL
  AND q.topic_id IS NOT CASE
    WHEN q.topic_id IS NOT NULL AND (
      SELECT COUNT(*) FROM topics candidate JOIN topics old_topic ON old_topic.id = q.topic_id
      WHERE candidate.subject_id = m.target_subject_id
        AND lower(trim(candidate.name)) = lower(trim(old_topic.name))
    ) = 1 THEN (
      SELECT MIN(candidate.id) FROM topics candidate JOIN topics old_topic ON old_topic.id = q.topic_id
      WHERE candidate.subject_id = m.target_subject_id
        AND lower(trim(candidate.name)) = lower(trim(old_topic.name))
    )
    ELSE NULL
  END;

WITH subject_map(source_subject_id, target_subject_id) AS (
  VALUES
    ('subj_wassce_core_math', 'subj_nsmq_math'),
    ('subj_wassce_physics', 'subj_nsmq_physics'),
    ('subj_wassce_chemistry', 'subj_nsmq_chemistry'),
    ('subj_wassce_biology', 'subj_nsmq_biology')
)
INSERT OR IGNORE INTO question_bank_remediation_log
  (migration_id, entity_type, entity_id, field_name, old_value, new_value)
SELECT '102_nsmq_question_alignment', 'question', q.id, 'subject_id',
       q.subject_id, m.target_subject_id
FROM questions q
JOIN subject_map m ON m.source_subject_id = q.subject_id
WHERE q.round_type IS NOT NULL;

WITH subject_map(source_subject_id, target_subject_id) AS (
  VALUES
    ('subj_wassce_core_math', 'subj_nsmq_math'),
    ('subj_wassce_physics', 'subj_nsmq_physics'),
    ('subj_wassce_chemistry', 'subj_nsmq_chemistry'),
    ('subj_wassce_biology', 'subj_nsmq_biology')
)
INSERT OR IGNORE INTO question_bank_remediation_log
  (migration_id, entity_type, entity_id, field_name, old_value, new_value)
SELECT '102_nsmq_question_alignment', 'question', q.id, 'exam_type_id',
       q.exam_type_id, 'exam_nsmq'
FROM questions q
JOIN subject_map m ON m.source_subject_id = q.subject_id
WHERE q.round_type IS NOT NULL
  AND q.exam_type_id IS NOT 'exam_nsmq';

WITH subject_map(source_subject_id, target_subject_id) AS (
  VALUES
    ('subj_wassce_core_math', 'subj_nsmq_math'),
    ('subj_wassce_physics', 'subj_nsmq_physics'),
    ('subj_wassce_chemistry', 'subj_nsmq_chemistry'),
    ('subj_wassce_biology', 'subj_nsmq_biology')
)
UPDATE questions
SET topic_id = CASE
      WHEN topic_id IS NOT NULL AND (
        SELECT COUNT(*) FROM topics candidate JOIN topics old_topic ON old_topic.id = questions.topic_id
        WHERE candidate.subject_id = (
          SELECT target_subject_id FROM subject_map WHERE source_subject_id = questions.subject_id
        ) AND lower(trim(candidate.name)) = lower(trim(old_topic.name))
      ) = 1 THEN (
        SELECT MIN(candidate.id) FROM topics candidate JOIN topics old_topic ON old_topic.id = questions.topic_id
        WHERE candidate.subject_id = (
          SELECT target_subject_id FROM subject_map WHERE source_subject_id = questions.subject_id
        ) AND lower(trim(candidate.name)) = lower(trim(old_topic.name))
      )
      ELSE NULL
    END,
    subject_id = (
      SELECT target_subject_id FROM subject_map WHERE source_subject_id = questions.subject_id
    ),
    exam_type_id = 'exam_nsmq'
WHERE round_type IS NOT NULL
  AND subject_id IN (SELECT source_subject_id FROM subject_map);

INSERT OR IGNORE INTO question_bank_remediation_log
  (migration_id, entity_type, entity_id, field_name, old_value, new_value)
SELECT '102_nsmq_question_alignment', 'subject', id, 'is_active',
       CAST(is_active AS TEXT), '0'
FROM subjects
WHERE id IN ('subj_math', 'subj_physics', 'subj_chemistry', 'subj_biology')
  AND is_active <> 0;

UPDATE subjects
SET is_active = 0
WHERE id IN ('subj_math', 'subj_physics', 'subj_chemistry', 'subj_biology')
  AND is_active <> 0;

INSERT INTO _migration_102_guard(valid)
SELECT CASE WHEN NOT EXISTS (
  SELECT 1 FROM questions q JOIN subjects s ON s.id = q.subject_id
  WHERE q.exam_type_id IS NOT NULL AND q.exam_type_id IS NOT s.exam_type_id
) THEN 1 ELSE 0 END;
INSERT INTO _migration_102_guard(valid)
SELECT CASE WHEN NOT EXISTS (
  SELECT 1 FROM questions q JOIN topics t ON t.id = q.topic_id
  WHERE q.topic_id IS NOT NULL AND q.subject_id IS NOT t.subject_id
) THEN 1 ELSE 0 END;
DROP TABLE _migration_102_guard;
