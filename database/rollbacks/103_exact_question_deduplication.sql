CREATE TABLE IF NOT EXISTS _rollback_103_guard (
  valid INTEGER NOT NULL CHECK (valid = 1)
);
DELETE FROM _rollback_103_guard;

INSERT INTO _rollback_103_guard(valid)
SELECT CASE WHEN
  EXISTS (
    SELECT 1 FROM question_bank_question_archive
    WHERE migration_id = '103_exact_question_deduplication'
  )
  AND NOT EXISTS (
    SELECT 1 FROM question_bank_question_archive a
    WHERE a.migration_id = '103_exact_question_deduplication'
      AND (
        NOT json_valid(a.row_json)
        OR EXISTS (SELECT 1 FROM questions q WHERE q.id = a.question_id)
        OR NOT EXISTS (SELECT 1 FROM questions q WHERE q.id = a.canonical_question_id)
      )
  )
THEN 1 ELSE 0 END;

INSERT INTO questions (
  id, topic_id, subject_id, exam_type_id, paper_type_id, past_paper_id,
  question_text, question_type, round_type, options, correct_answer,
  explanation, difficulty, points, marks, time_limit, question_number,
  section, is_compulsory, image_url, syllabus_topic_id, command_word,
  assessment_objective, source_paper_code, source_question_number,
  exam_board_id, created_at, updated_at
)
SELECT
  json_extract(row_json, '$.id'),
  json_extract(row_json, '$.topic_id'),
  json_extract(row_json, '$.subject_id'),
  json_extract(row_json, '$.exam_type_id'),
  json_extract(row_json, '$.paper_type_id'),
  json_extract(row_json, '$.past_paper_id'),
  json_extract(row_json, '$.question_text'),
  json_extract(row_json, '$.question_type'),
  json_extract(row_json, '$.round_type'),
  json_extract(row_json, '$.options'),
  json_extract(row_json, '$.correct_answer'),
  json_extract(row_json, '$.explanation'),
  json_extract(row_json, '$.difficulty'),
  json_extract(row_json, '$.points'),
  json_extract(row_json, '$.marks'),
  json_extract(row_json, '$.time_limit'),
  json_extract(row_json, '$.question_number'),
  json_extract(row_json, '$.section'),
  json_extract(row_json, '$.is_compulsory'),
  json_extract(row_json, '$.image_url'),
  json_extract(row_json, '$.syllabus_topic_id'),
  json_extract(row_json, '$.command_word'),
  json_extract(row_json, '$.assessment_objective'),
  json_extract(row_json, '$.source_paper_code'),
  json_extract(row_json, '$.source_question_number'),
  json_extract(row_json, '$.exam_board_id'),
  json_extract(row_json, '$.created_at'),
  json_extract(row_json, '$.updated_at')
FROM question_bank_question_archive
WHERE migration_id = '103_exact_question_deduplication'
ORDER BY question_id;

INSERT INTO _rollback_103_guard(valid)
SELECT CASE WHEN NOT EXISTS (
  SELECT 1 FROM question_bank_question_archive a
  WHERE a.migration_id = '103_exact_question_deduplication'
    AND NOT EXISTS (SELECT 1 FROM questions q WHERE q.id = a.question_id)
) THEN 1 ELSE 0 END;
DROP TABLE _rollback_103_guard;
