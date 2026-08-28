-- Rollback 282. Run only after the Worker no longer reads or writes battle demo-data fields.
-- Rows and all pre-282 battle columns remain intact.
DROP INDEX IF EXISTS idx_battle_answers_demo;
DROP INDEX IF EXISTS idx_battles_demo;
ALTER TABLE battle_answers DROP COLUMN expires_at;
ALTER TABLE battle_answers DROP COLUMN is_demo_data;
ALTER TABLE battles DROP COLUMN expires_at;
ALTER TABLE battles DROP COLUMN is_demo_data;
