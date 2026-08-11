-- ============================================================================
-- Migration 089: Baseline marker (database reckoning, Phase 5 Task 5)
--
-- The chain 001-087 was squashed into database/schema.sql + database/seed.sql
-- on 2026-08-11. The old files are kept for history under
-- database/migrations/archive/ (outside migrations_dir, so wrangler ignores
-- them). This marker exists only so `wrangler d1 migrations apply` records a
-- baseline row in d1_migrations on both fresh and pre-squash databases.
--
-- Remaining migrations_dir chain (lexical order):
--   088_normalize_datetime_to_iso.sql  (pending on prod)
--   088a_data_fixes.sql                (pending on prod)
--   089_baseline_marker.sql            (this file)
--
-- FRESH-ENVIRONMENT FLOW (full docs land in Task 6):
--   1. wrangler d1 execute brilla-db --local --file=database/schema.sql
--   2. wrangler d1 execute brilla-db --local --file=database/seed.sql
--   3. wrangler d1 execute brilla-db --local --file=database/seeds/seed_chat_rooms.sql
--   4. wrangler d1 migrations apply brilla-db --local   (records 088, 088a, 089)
--   Note: `db:migrate` (schema.sql) is for FRESH databases only — it is not
--   idempotent against an existing populated database. Existing/production
--   databases follow the runbook in
--   docs/superpowers/plans/2026-08-03-fix-05-database-reckoning.md.
--
-- Idempotent: CREATE TABLE IF NOT EXISTS + INSERT OR IGNORE.
-- ============================================================================
CREATE TABLE IF NOT EXISTS schema_baseline (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    squashed_at TEXT DEFAULT (datetime('now')),
    note TEXT
);
INSERT OR IGNORE INTO schema_baseline (id, note) VALUES (1, 'squash of migrations 001-087');
