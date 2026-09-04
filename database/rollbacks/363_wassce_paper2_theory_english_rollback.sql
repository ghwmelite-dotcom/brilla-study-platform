-- Rollback 363. Run only after the Worker no longer serves the WASSCE English
-- Language Paper 2 theory practice paper inserted by migration 363.
-- Deletes the paper, its questions, marking schemes, structured parts and
-- release rows. Student attempts on the paper would orphan — do not run once
-- the paper has live attempts.

DELETE FROM question_content_releases WHERE question_id IN (
  'q_eng_2024_2_001', 'q_eng_2024_2_002', 'q_eng_2024_2_003', 'q_eng_2024_2_004',
  'q_eng_2024_2_005', 'q_eng_2024_2_006', 'q_eng_2024_2_007', 'q_eng_2024_2_008'
);
DELETE FROM structured_question_parts WHERE question_id IN (
  'q_eng_2024_2_001', 'q_eng_2024_2_002', 'q_eng_2024_2_003', 'q_eng_2024_2_004',
  'q_eng_2024_2_005', 'q_eng_2024_2_006', 'q_eng_2024_2_007', 'q_eng_2024_2_008'
);
DELETE FROM essay_questions WHERE question_id IN (
  'q_eng_2024_2_001', 'q_eng_2024_2_002', 'q_eng_2024_2_003', 'q_eng_2024_2_004',
  'q_eng_2024_2_005', 'q_eng_2024_2_006', 'q_eng_2024_2_007', 'q_eng_2024_2_008'
);
DELETE FROM questions WHERE id IN (
  'q_eng_2024_2_001', 'q_eng_2024_2_002', 'q_eng_2024_2_003', 'q_eng_2024_2_004',
  'q_eng_2024_2_005', 'q_eng_2024_2_006', 'q_eng_2024_2_007', 'q_eng_2024_2_008'
);
DELETE FROM past_papers WHERE id = 'pp_wassce_eng_2024_2';
DELETE FROM topics WHERE id IN (
  'topic_wassce_p2_eng_ess', 'topic_wassce_p2_eng_cmp', 'topic_wassce_p2_eng_sum'
);
