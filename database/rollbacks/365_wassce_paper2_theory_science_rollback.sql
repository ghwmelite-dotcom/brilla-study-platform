-- Rollback 365. Run only after the Worker no longer serves the WASSCE
-- Integrated Science Paper 2 theory practice paper inserted by migration 365.
-- Deletes the paper, its questions, marking schemes, structured parts and
-- release rows. Student attempts on the paper would orphan — do not run once
-- the paper has live attempts.

DELETE FROM question_content_releases WHERE question_id IN (
  'q_sci_2024_2_001', 'q_sci_2024_2_002', 'q_sci_2024_2_003', 'q_sci_2024_2_004',
  'q_sci_2024_2_005', 'q_sci_2024_2_006', 'q_sci_2024_2_007', 'q_sci_2024_2_008'
);
DELETE FROM structured_question_parts WHERE question_id IN (
  'q_sci_2024_2_001', 'q_sci_2024_2_002', 'q_sci_2024_2_003', 'q_sci_2024_2_004',
  'q_sci_2024_2_005', 'q_sci_2024_2_006', 'q_sci_2024_2_007', 'q_sci_2024_2_008'
);
DELETE FROM essay_questions WHERE question_id IN (
  'q_sci_2024_2_001', 'q_sci_2024_2_002', 'q_sci_2024_2_003', 'q_sci_2024_2_004',
  'q_sci_2024_2_005', 'q_sci_2024_2_006', 'q_sci_2024_2_007', 'q_sci_2024_2_008'
);
DELETE FROM questions WHERE id IN (
  'q_sci_2024_2_001', 'q_sci_2024_2_002', 'q_sci_2024_2_003', 'q_sci_2024_2_004',
  'q_sci_2024_2_005', 'q_sci_2024_2_006', 'q_sci_2024_2_007', 'q_sci_2024_2_008'
);
DELETE FROM past_papers WHERE id = 'pp_wassce_sci_2024_2';
