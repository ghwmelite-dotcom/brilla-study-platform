-- ============================================================================
-- Migration 088a: Data fixes (database reckoning, Phase 5 Task 3)
--
-- One file, two uses:
--   1. Runs against production as an idempotent data-fix migration
--      (user-gated; 088_normalize_datetime_to_iso already landed).
--   2. Its contents fold into the squashed seed.sql for fresh deploys
--      (Task 4 rewrites the affected INSERTs directly where noted).
--
-- STRICTLY IDEMPOTENT: pure UPDATEs with WHERE guards plus guarded DELETEs.
-- Running this file twice is a no-op the second time.
--
-- Fix classes:
--   3a. Numeric (0-based index) correct_answer -> option text   (724 rows)
--   3b. Phantom/duplicate subject & exam_type ID reconciliation
--   3c. 082 vs 084 PK collision: renumber 084's set to q_alevel_maths_*
--   3d. 8 individually bad rows (6 first-letter collisions, 1 math error,
--       1 included in the collision set)
-- ============================================================================

-- ============================================================================
-- 3a. Numeric correct_answer -> option text
--
-- Migrations 064-068 stored correct_answer as a 0-based INTEGER index into
-- the row's options JSON array (724 rows: 064=30, 065=165, 066=376, 067=143,
-- 068=10). transformQuestionOptions cannot map these, so the answer is
-- invisible/ungradeable. Convert each index to the option text it points at.
--
-- Two safety guards beyond the task-3 brief's SQL, both verified against the
-- real migration rows (scripts/tmp-check-numeric-answers.cjs analysis):
--   * json_type(...) = 'text': 029_wassce_math_questions stores options as
--     objects ([{"id":"A","text":"17"},...]); naive index extraction would
--     write a JSON OBJECT into correct_answer. Those 34 digit answers are
--     legitimate answer TEXT (they equal an option's text) and are excluded.
--   * NOT EXISTS (answer is itself an option): 018/063 digit answers are
--     answer TEXT, not indexes. Without this guard q_em_014 ('2' ->
--     options[2] '4'), q_em_020 ('1' -> '2') and q_em_048 ('2' -> '22')
--     would be CORRUPTED. They are left untouched.
-- The 55 pre-existing all-digit TEXT answers (018=18, 063=3, 029=34) are
-- legitimate full-text answers that exactly equal an option; they grade
-- correctly by exact-match and are intentionally preserved. Additionally,
-- 33 of the 724 conversions land on option text that is itself numeric
-- (e.g. index 2 -> "30") — correct, but still all-digit. So on a full prod
-- replay the verification query below returns 88, every one of which equals
-- exactly one of its options (verified in scripts/tmp-test-088a.cjs).
-- Task 4 must account for these when folding questions into the squashed
-- seed (the db:verify numeric check counts any all-digit answer).
-- ============================================================================

UPDATE questions
SET correct_answer = json_extract(options, '$[' || correct_answer || ']')
WHERE question_type = 'multiple_choice'
  AND options IS NOT NULL
  AND correct_answer GLOB '[0-9]*'
  AND correct_answer NOT GLOB '*[^0-9]*'
  AND CAST(correct_answer AS INTEGER) < json_array_length(options)
  AND json_type(options, '$[' || correct_answer || ']') = 'text'
  AND NOT EXISTS (
    SELECT 1 FROM json_each(options)
    WHERE json_each.value = questions.correct_answer
  );

-- Verification (must return 0 on schema+seed+088a; on a full prod replay the
-- residual count is the 55 legitimate text answers documented above):
--   SELECT count(*) FROM questions
--   WHERE question_type='multiple_choice' AND options IS NOT NULL
--     AND correct_answer GLOB '[0-9]*' AND correct_answer NOT GLOB '*[^0-9]*';

-- ============================================================================
-- 3c. 082 vs 084 PK collision — keep both, renumber 084 (runs BEFORE the
-- subj_alevel_maths reconciliation below because it keys on that subject ID)
--
-- 082_alevel_mathematics (55 questions, q_alevel_math_001..055, canonical
-- subject subj_alevel_math) ran first; 084_alevel_maths (40 genuinely
-- different questions, q_alevel_math_001..040, phantom subject
-- subj_alevel_maths) collided on all 40 PKs and its INSERT OR IGNORE rows
-- were silently discarded. Renumber 084's set to q_alevel_maths_001..040.
-- On prod this matches zero rows (084's rows were never inserted) — it is a
-- seed-source fix; Task 4 rewrites 084's INSERTs to the new IDs directly.
-- Idempotent: renumbered IDs no longer match the GLOB pattern.
-- ============================================================================

UPDATE questions
SET id = 'q_alevel_maths_' || substr(id, length('q_alevel_math_') + 1)
WHERE id GLOB 'q_alevel_math_0*'
  AND subject_id = 'subj_alevel_maths';

-- ============================================================================
-- 3b. Subject / exam_type ID reconciliation
--
-- Legacy phantom IDs (subj_math / subj_physics / subj_chemistry /
-- subj_biology) are never created in subjects but referenced by ~815 rows
-- across 028_fixed, 035-037, 040-044, 067 (questions, past_papers,
-- flashcard_decks). Canonical targets all exist in seed.sql.
-- ============================================================================

UPDATE questions        SET subject_id = 'subj_wassce_core_math' WHERE subject_id = 'subj_math';
UPDATE questions        SET subject_id = 'subj_wassce_physics'   WHERE subject_id = 'subj_physics';
UPDATE questions        SET subject_id = 'subj_wassce_chemistry' WHERE subject_id = 'subj_chemistry';
UPDATE questions        SET subject_id = 'subj_wassce_biology'   WHERE subject_id = 'subj_biology';
UPDATE past_papers      SET subject_id = 'subj_wassce_core_math' WHERE subject_id = 'subj_math';
UPDATE past_papers      SET subject_id = 'subj_wassce_physics'   WHERE subject_id = 'subj_physics';
UPDATE past_papers      SET subject_id = 'subj_wassce_chemistry' WHERE subject_id = 'subj_chemistry';
UPDATE past_papers      SET subject_id = 'subj_wassce_biology'   WHERE subject_id = 'subj_biology';
UPDATE flashcard_decks  SET subject_id = 'subj_wassce_core_math' WHERE subject_id = 'subj_math';
UPDATE flashcard_decks  SET subject_id = 'subj_wassce_physics'   WHERE subject_id = 'subj_physics';
UPDATE flashcard_decks  SET subject_id = 'subj_wassce_chemistry' WHERE subject_id = 'subj_chemistry';
UPDATE flashcard_decks  SET subject_id = 'subj_wassce_biology'   WHERE subject_id = 'subj_biology';

-- Business Management duplicate: canonical = subj_wassce_bus_mgmt
-- (seed.sql:116 carries full metadata: exam_type_id, category_id, waec_code).
-- 063:23 created the lookalike subj_wassce_business_mgt and topic_bm_* under
-- it. Repoint and remove the duplicate subject row.
UPDATE topics    SET subject_id = 'subj_wassce_bus_mgmt' WHERE subject_id = 'subj_wassce_business_mgt';
UPDATE questions SET subject_id = 'subj_wassce_bus_mgmt' WHERE subject_id = 'subj_wassce_business_mgt';
DELETE FROM subjects WHERE id = 'subj_wassce_business_mgt';

-- Elective Math: canonical = subj_wassce_elect_math (seed.sql:109, 018:123).
-- Reverse 063:242-253's rename (which pointed everything at a duplicate).
UPDATE questions SET subject_id = 'subj_wassce_elect_math' WHERE subject_id = 'subj_wassce_elective_math';
UPDATE topics    SET subject_id = 'subj_wassce_elect_math' WHERE subject_id = 'subj_wassce_elective_math';
DELETE FROM subjects WHERE id = 'subj_wassce_elective_math';

-- A-Level maths: canonical = subj_alevel_math
-- (073_seed_o_a_level_data_fixed.sql:46); subj_alevel_maths is never created.
UPDATE questions SET subject_id = 'subj_alevel_math' WHERE subject_id = 'subj_alevel_maths';

-- Phantom exam_type 'alevel' (used by 081/082_chem/083_bio/084 question sets,
-- 160 inserted rows on prod) -> canonical exam_types id 'cambridge_a2'
-- (073_seed_o_a_level_data_fixed.sql:21).
UPDATE questions SET exam_type_id = 'cambridge_a2' WHERE exam_type_id = 'alevel';

-- ============================================================================
-- 3d. The 8 individually bad rows
--
-- First-letter collisions: a full-text answer whose first character equals
-- the positional letter of a DIFFERENT option marks that option correct too
-- (workers/api/src/index.ts:122-124). Convert to letter form; letters and
-- option positions verified against each row's options array (063/018).
-- ============================================================================

UPDATE questions SET correct_answer = 'A' WHERE id = 'q_em_029';  -- 'cos θ' is option 0; 'c' was also marking C ('1')
UPDATE questions SET correct_answer = 'B' WHERE id = 'q_ca_001';  -- 'Determining product costs' is option 1; 'D' was also marking D ('Auditing')
UPDATE questions SET correct_answer = 'C' WHERE id = 'q_fn_002';  -- 'Ascorbic acid' is option 2; 'A' was also marking A ('Retinol')
UPDATE questions SET correct_answer = 'C' WHERE id = 'q_fn_005';  -- 'All essential nutrients...' is option 2; 'A' was also marking A
UPDATE questions SET correct_answer = 'C' WHERE id = 'q_twi_003'; -- 'Akan people' is option 2; 'A' was also marking A ('Ga people')
UPDATE questions SET correct_answer = 'C' WHERE id = 'q_twi_005'; -- 'Ashantis' is option 2; 'A' was also marking A ('Gas')

-- Mathematically wrong answer (018:170; old explanation even said
-- "needs verification"). f(2) = 8 - 12 + 2k + 2 = 0 -> 2k = 2 -> k = 1.
-- correct_answer is the letter 'B' (option index 1, text '1'; options
-- ["0","1","-1","2"]), matching the seed.sql fold and the letter convention
-- of the collision fixes above — the option TEXT '1' would trip the
-- db:verify numeric-MCQ check. The 3a guards leave 'B' untouched on re-runs,
-- so applying this file over an already-seeded fresh DB is a no-op here.
UPDATE questions
SET correct_answer = 'B',
    explanation = 'f(2) = 8 - 12 + 2k + 2 = 0 → 2k = 2 → k = 1.'
WHERE id = 'q_em_007';

-- ============================================================================
-- 021 affiliate columns on users — analysis (no backfill needed)
--
-- Canonical schema (schema.sql users table, from 021/022):
--   is_affiliate      INTEGER DEFAULT 0   -> DEFAULT present; SQLite's
--   affiliate_xp      INTEGER DEFAULT 0      ALTER TABLE ADD COLUMN fills
--                                            existing rows with the default,
--                                            so prod rows are already 0.
--   trial_started_at  TEXT  (no DEFAULT)  -> NULL is the CORRECT value for
--   trial_expires_at  TEXT  (no DEFAULT)     users with no trial; backfilling
--   referred_by       TEXT  (no DEFAULT)     a timestamp/referrer would
--                                            fabricate trials/referrals.
--   user_type is a subscription_tiers column (DEFAULT 'student'), not users.
-- Conclusion: no UPDATEs required; documented here so the decision survives.
-- ============================================================================
