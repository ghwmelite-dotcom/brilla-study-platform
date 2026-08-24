CREATE TABLE IF NOT EXISTS question_bank_question_archive (
  migration_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  canonical_question_id TEXT NOT NULL,
  row_json TEXT NOT NULL CHECK (json_valid(row_json)),
  archived_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (migration_id, question_id)
);
CREATE INDEX IF NOT EXISTS idx_question_bank_question_archive_canonical
  ON question_bank_question_archive(migration_id, canonical_question_id);

CREATE TABLE IF NOT EXISTS _migration_103_guard (
  valid INTEGER NOT NULL CHECK (valid = 1)
);
DELETE FROM _migration_103_guard;

WITH ranked AS (
  SELECT q.id,
    MIN(q.id) OVER (PARTITION BY
      topic_id, subject_id, exam_type_id, paper_type_id, past_paper_id,
      question_text, question_type, round_type, options, correct_answer,
      explanation, difficulty, points, marks, time_limit, question_number,
      section, is_compulsory, image_url, syllabus_topic_id, command_word,
      assessment_objective, source_paper_code, source_question_number, exam_board_id
    ) canonical_id,
    ROW_NUMBER() OVER (PARTITION BY
      topic_id, subject_id, exam_type_id, paper_type_id, past_paper_id,
      question_text, question_type, round_type, options, correct_answer,
      explanation, difficulty, points, marks, time_limit, question_number,
      section, is_compulsory, image_url, syllabus_topic_id, command_word,
      assessment_objective, source_paper_code, source_question_number, exam_board_id
      ORDER BY id
    ) duplicate_rank
  FROM questions q
), redundant AS (
  SELECT id, canonical_id FROM ranked WHERE duplicate_rank > 1
)
INSERT INTO _migration_103_guard(valid)
SELECT CASE WHEN
  (
    NOT EXISTS (
      SELECT 1 FROM question_bank_question_archive
      WHERE migration_id = '103_exact_question_deduplication'
    )
    AND EXISTS (SELECT 1 FROM redundant)
    AND NOT EXISTS (
      SELECT 1 FROM redundant r
      WHERE EXISTS (SELECT 1 FROM question_attempts x WHERE x.question_id = r.id)
         OR EXISTS (SELECT 1 FROM assessment_questions x WHERE x.question_id = r.id)
         OR EXISTS (SELECT 1 FROM tutor_messages x WHERE x.question_id = r.id)
         OR EXISTS (SELECT 1 FROM brain_teasers x WHERE x.question_id = r.id)
         OR EXISTS (SELECT 1 FROM essay_attempts x WHERE x.question_id = r.id)
         OR EXISTS (SELECT 1 FROM essay_questions x WHERE x.question_id = r.id)
         OR EXISTS (SELECT 1 FROM structured_question_parts x WHERE x.question_id = r.id)
         OR EXISTS (SELECT 1 FROM guidance_session_answers x WHERE x.question_id = r.id)
    )
  )
  OR (
    EXISTS (
      SELECT 1 FROM question_bank_question_archive
      WHERE migration_id = '103_exact_question_deduplication'
    )
    AND NOT EXISTS (
      SELECT 1 FROM question_bank_question_archive a
      WHERE a.migration_id = '103_exact_question_deduplication'
        AND (
          EXISTS (SELECT 1 FROM questions q WHERE q.id = a.question_id)
          OR NOT EXISTS (SELECT 1 FROM questions q WHERE q.id = a.canonical_question_id)
        )
    )
  )
THEN 1 ELSE 0 END;

WITH ranked AS (
  SELECT q.*,
    MIN(q.id) OVER (PARTITION BY
      topic_id, subject_id, exam_type_id, paper_type_id, past_paper_id,
      question_text, question_type, round_type, options, correct_answer,
      explanation, difficulty, points, marks, time_limit, question_number,
      section, is_compulsory, image_url, syllabus_topic_id, command_word,
      assessment_objective, source_paper_code, source_question_number, exam_board_id
    ) canonical_id,
    ROW_NUMBER() OVER (PARTITION BY
      topic_id, subject_id, exam_type_id, paper_type_id, past_paper_id,
      question_text, question_type, round_type, options, correct_answer,
      explanation, difficulty, points, marks, time_limit, question_number,
      section, is_compulsory, image_url, syllabus_topic_id, command_word,
      assessment_objective, source_paper_code, source_question_number, exam_board_id
      ORDER BY id
    ) duplicate_rank
  FROM questions q
)
INSERT OR IGNORE INTO question_bank_question_archive
  (migration_id, question_id, canonical_question_id, row_json)
SELECT '103_exact_question_deduplication', id, canonical_id,
  json_object(
    'id', id, 'topic_id', topic_id, 'subject_id', subject_id,
    'exam_type_id', exam_type_id, 'paper_type_id', paper_type_id,
    'past_paper_id', past_paper_id, 'question_text', question_text,
    'question_type', question_type, 'round_type', round_type,
    'options', options, 'correct_answer', correct_answer,
    'explanation', explanation, 'difficulty', difficulty, 'points', points,
    'marks', marks, 'time_limit', time_limit, 'question_number', question_number,
    'section', section, 'is_compulsory', is_compulsory, 'image_url', image_url,
    'syllabus_topic_id', syllabus_topic_id, 'command_word', command_word,
    'assessment_objective', assessment_objective,
    'source_paper_code', source_paper_code,
    'source_question_number', source_question_number,
    'exam_board_id', exam_board_id, 'created_at', created_at, 'updated_at', updated_at
  )
FROM ranked
WHERE duplicate_rank > 1;

DELETE FROM questions
WHERE id IN (
  SELECT question_id FROM question_bank_question_archive
  WHERE migration_id = '103_exact_question_deduplication'
);

WITH clones AS (
  SELECT COUNT(*) row_count
  FROM questions
  GROUP BY
    topic_id, subject_id, exam_type_id, paper_type_id, past_paper_id,
    question_text, question_type, round_type, options, correct_answer,
    explanation, difficulty, points, marks, time_limit, question_number,
    section, is_compulsory, image_url, syllabus_topic_id, command_word,
    assessment_objective, source_paper_code, source_question_number, exam_board_id
  HAVING COUNT(*) > 1
)
INSERT INTO _migration_103_guard(valid)
SELECT CASE WHEN NOT EXISTS (SELECT 1 FROM clones) THEN 1 ELSE 0 END;
DROP TABLE _migration_103_guard;
