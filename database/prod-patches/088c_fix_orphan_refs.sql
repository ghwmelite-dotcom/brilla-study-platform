-- PROD-ONLY patch (2026-08-12) — orphan reference repair.
-- Found during the post-migration verification (Ship-4):
-- 1. 100 questions reference phantom subject 'subj_elective_math' (038/039's
--    ID; canonical 'subj_wassce_elect_math' exists on prod). The seed fixes
--    this at source for fresh deploys; this is the prod equivalent.
-- 2. 962 questions reference phantom topic_ids (077/081-084 IDs that no
--    migration created; the squashed seed nulls them at source). topic_id is
--    nullable in the canonical schema; NULL is the honest value.
-- Idempotent (guarded UPDATEs); safe to re-run.

UPDATE questions SET subject_id = 'subj_wassce_elect_math' WHERE subject_id = 'subj_elective_math';

UPDATE questions SET topic_id = NULL
WHERE topic_id IS NOT NULL
  AND topic_id NOT IN (SELECT id FROM topics);
