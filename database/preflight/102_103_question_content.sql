-- SELECT-only preflight for migrations 102 and 103.
-- Emits aggregate counts only; no question text, answers, users, or payment data.

WITH subject_map(source_subject_id, target_subject_id) AS (
  VALUES
    ('subj_wassce_core_math', 'subj_nsmq_math'),
    ('subj_wassce_physics', 'subj_nsmq_physics'),
    ('subj_wassce_chemistry', 'subj_nsmq_chemistry'),
    ('subj_wassce_biology', 'subj_nsmq_biology')
)
SELECT
  (SELECT COUNT(*) FROM questions q JOIN subject_map m ON m.source_subject_id = q.subject_id
   WHERE q.round_type IS NOT NULL) AS source_rounds,
  (SELECT COUNT(*) FROM questions q JOIN subject_map m ON m.target_subject_id = q.subject_id
   WHERE q.round_type IS NOT NULL) AS target_rounds,
  (SELECT COUNT(*) FROM questions q
   WHERE q.round_type IS NOT NULL
     AND q.subject_id NOT IN (
       SELECT source_subject_id FROM subject_map
       UNION ALL SELECT target_subject_id FROM subject_map
     )) AS unexpected_rounds,
  (SELECT COUNT(*) FROM questions q JOIN subjects s ON s.id = q.subject_id
   WHERE q.exam_type_id IS NOT NULL AND q.exam_type_id IS NOT s.exam_type_id) AS exam_mismatches,
  (SELECT COUNT(*) FROM questions q JOIN topics t ON t.id = q.topic_id
   WHERE q.topic_id IS NOT NULL AND q.subject_id IS NOT t.subject_id) AS topic_mismatches,
  (SELECT COUNT(*) FROM subjects
   WHERE id IN ('subj_math', 'subj_physics', 'subj_chemistry', 'subj_biology')) AS legacy_subjects,
  (SELECT COUNT(*) FROM questions
   WHERE subject_id IN ('subj_math', 'subj_physics', 'subj_chemistry', 'subj_biology')) AS legacy_questions,
  (SELECT COUNT(*) FROM guidance_sessions gs
   WHERE gs.status = 'in_progress'
     AND (
       NOT json_valid(gs.questions)
       OR json_type(CASE WHEN json_valid(gs.questions) THEN gs.questions ELSE '{}' END) IS NOT 'object'
       OR json_type(CASE WHEN json_valid(gs.questions) THEN gs.questions ELSE '{}' END, '$.asked') IS NOT 'array'
       OR json_type(CASE WHEN json_valid(gs.questions) THEN gs.questions ELSE '{}' END, '$.topicQueue') IS NOT 'array'
     )) AS active_guidance_invalid_envelopes,
  (SELECT COUNT(*)
   FROM guidance_sessions gs
   JOIN questions q ON q.id = json_extract(
     CASE WHEN json_valid(gs.questions) THEN gs.questions ELSE '{}' END,
     '$.pendingQuestionId'
   )
   JOIN subject_map m ON m.source_subject_id = q.subject_id
   WHERE gs.status = 'in_progress' AND q.round_type IS NOT NULL) AS active_guidance_moved_pending;

WITH ranked AS (
  SELECT id, round_type,
    ROW_NUMBER() OVER (PARTITION BY
      topic_id, subject_id, exam_type_id, paper_type_id, past_paper_id,
      question_text, question_type, round_type, options, correct_answer,
      explanation, difficulty, points, marks, time_limit, question_number,
      section, is_compulsory, image_url, syllabus_topic_id, command_word,
      assessment_objective, source_paper_code, source_question_number, exam_board_id
      ORDER BY id
    ) AS duplicate_rank
  FROM questions
), redundant AS (
  SELECT id, round_type FROM ranked WHERE duplicate_rank > 1
)
SELECT
  COUNT(*) AS redundant_rows,
  COALESCE(SUM(CASE WHEN round_type IS NOT NULL THEN 1 ELSE 0 END), 0) AS redundant_round_rows,
  COALESCE(SUM(CASE WHEN
       EXISTS (SELECT 1 FROM question_attempts x WHERE x.question_id = redundant.id)
    OR EXISTS (SELECT 1 FROM assessment_questions x WHERE x.question_id = redundant.id)
    OR EXISTS (SELECT 1 FROM tutor_messages x WHERE x.question_id = redundant.id)
    OR EXISTS (SELECT 1 FROM brain_teasers x WHERE x.question_id = redundant.id)
    OR EXISTS (SELECT 1 FROM essay_attempts x WHERE x.question_id = redundant.id)
    OR EXISTS (SELECT 1 FROM essay_questions x WHERE x.question_id = redundant.id)
    OR EXISTS (SELECT 1 FROM structured_question_parts x WHERE x.question_id = redundant.id)
    OR EXISTS (SELECT 1 FROM guidance_session_answers x WHERE x.question_id = redundant.id)
    OR EXISTS (SELECT 1 FROM paper_attempt_answers x WHERE x.question_id = redundant.id)
    OR EXISTS (
      SELECT 1 FROM guidance_sessions x
      WHERE x.status = 'in_progress'
        AND (
          NOT json_valid(x.questions)
          OR json_type(CASE WHEN json_valid(x.questions) THEN x.questions ELSE '{}' END) IS NOT 'object'
          OR json_type(CASE WHEN json_valid(x.questions) THEN x.questions ELSE '{}' END, '$.asked') IS NOT 'array'
          OR json_type(CASE WHEN json_valid(x.questions) THEN x.questions ELSE '{}' END, '$.topicQueue') IS NOT 'array'
          OR json_extract(
       CASE WHEN json_valid(x.questions) THEN x.questions ELSE '{}' END,
       '$.pendingQuestionId'
          ) = redundant.id
        )
    )
    OR EXISTS (
      SELECT 1 FROM daily_challenges x
      WHERE NOT json_valid(x.question_ids)
         OR json_type(CASE WHEN json_valid(x.question_ids) THEN x.question_ids ELSE '[]' END) <> 'array'
         OR EXISTS (
           SELECT 1
           FROM json_each(CASE WHEN json_valid(x.question_ids) THEN x.question_ids ELSE '[]' END) item
           WHERE item.type = 'text' AND item.value = redundant.id
         )
    )
    OR EXISTS (
      SELECT 1 FROM team_battles x
      WHERE x.question_ids IS NOT NULL
        AND (
          NOT json_valid(x.question_ids)
          OR json_type(CASE WHEN json_valid(x.question_ids) THEN x.question_ids ELSE '[]' END) <> 'array'
          OR EXISTS (
            SELECT 1
            FROM json_each(CASE WHEN json_valid(x.question_ids) THEN x.question_ids ELSE '[]' END) item
            WHERE item.type = 'text' AND item.value = redundant.id
          )
        )
    )
  THEN 1 ELSE 0 END), 0) AS referenced_redundant_rows
FROM redundant;
