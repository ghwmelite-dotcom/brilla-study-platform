-- Rollback 364. Run only after the Worker no longer serves the WASSCE Core
-- Mathematics Paper 2 theory practice paper inserted by migration 364.
-- Deletes the paper, its questions, structured parts and release rows.
-- Student attempts on the paper would orphan — do not run once the paper has
-- live attempts.

DELETE FROM question_content_releases WHERE question_id IN (
  'q_math_2024_2_001', 'q_math_2024_2_002', 'q_math_2024_2_003', 'q_math_2024_2_004',
  'q_math_2024_2_005', 'q_math_2024_2_006', 'q_math_2024_2_007', 'q_math_2024_2_008',
  'q_math_2024_2_009', 'q_math_2024_2_010'
);
DELETE FROM structured_question_parts WHERE question_id IN (
  'q_math_2024_2_001', 'q_math_2024_2_002', 'q_math_2024_2_003', 'q_math_2024_2_004',
  'q_math_2024_2_005', 'q_math_2024_2_006', 'q_math_2024_2_007', 'q_math_2024_2_008',
  'q_math_2024_2_009', 'q_math_2024_2_010'
);
DELETE FROM essay_questions WHERE question_id IN (
  'q_math_2024_2_001', 'q_math_2024_2_002', 'q_math_2024_2_003', 'q_math_2024_2_004',
  'q_math_2024_2_005', 'q_math_2024_2_006', 'q_math_2024_2_007', 'q_math_2024_2_008',
  'q_math_2024_2_009', 'q_math_2024_2_010'
);
DELETE FROM questions WHERE id IN (
  'q_math_2024_2_001', 'q_math_2024_2_002', 'q_math_2024_2_003', 'q_math_2024_2_004',
  'q_math_2024_2_005', 'q_math_2024_2_006', 'q_math_2024_2_007', 'q_math_2024_2_008',
  'q_math_2024_2_009', 'q_math_2024_2_010'
);
DELETE FROM past_papers WHERE id = 'pp_wassce_math_2024_2';
