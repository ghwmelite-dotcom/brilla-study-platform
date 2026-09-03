-- ============================================================================
-- FRESH-ENVIRONMENT BASELINE — record folded migrations as applied
-- ============================================================================
-- database/schema.sql already contains the DDL of the ten migrations listed
-- below (folded into the canonical squash; each fold is marked in schema.sql
-- with a "-- Source: migrations/..." / "-- added by migrations/..." comment).
-- Those files are NOT idempotent, so on a fresh database `wrangler d1
-- migrations apply` would fail on them with "duplicate column" errors. A fresh
-- environment therefore records them as applied BEFORE running
-- `npm run db:baseline`, which then continues with the rest of the chain.
--
-- FRESH DATABASES ONLY. Never needed on databases where the chain was applied
-- for real (production/staging already have these rows; the INSERT OR IGNOREs
-- would no-op, but do not run this there anyway).
--
-- The d1_migrations DDL below matches wrangler's own bookkeeping table
-- (getCreateMigrationsTableQuery in wrangler), so `migrations apply` picks the
-- rows up transparently and skips these files.
--
-- scripts/verify-fresh-bootstrap.cjs (wired into `npm run db:verify` and CI)
-- derives its expected list from THIS file and proves that (a) every migration
-- listed here still fails to apply on the schema.sql baseline — i.e. it is
-- genuinely folded — and (b) every migration NOT listed here applies cleanly.
--
-- Idempotent folds (094, 098, 100, 101, 103, 113, 358) are deliberately NOT
-- listed: their files apply cleanly as no-ops on fresh databases and are
-- recorded by wrangler itself when `migrations apply` runs them.
-- ============================================================================
CREATE TABLE IF NOT EXISTS d1_migrations(
	id         INTEGER PRIMARY KEY AUTOINCREMENT,
	name       TEXT UNIQUE,
	applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

INSERT OR IGNORE INTO d1_migrations (name) VALUES
  ('090_growth_loop.sql'),
  ('091_telegram_community.sql'),
  ('092_users_parent_role.sql'),
  ('095_counselor_authorization.sql'),
  ('096_atomic_failed_transfer_refunds.sql'),
  ('097_session_version_invalidation.sql'),
  ('099_payment_reconciliation.sql'),
  ('276_practice_session_integrity.sql'),
  ('277_answer_attempt_integrity.sql'),
  ('282_battle_demo_data_integrity.sql');
