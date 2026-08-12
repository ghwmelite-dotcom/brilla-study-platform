-- PROD-ONLY patch (2026-08-12) — do NOT move into database/migrations/.
-- Fresh deploys get these columns from the canonical schema.sql; this file
-- reconciles the EXISTING production DB, whose subjects table lost
-- exam_type_id/category_id/waec_code/is_active to the 018/028-era rebuilds.
-- Apply manually AFTER the pre-squash backup and BEFORE migrations apply:
--   wrangler d1 execute brilla-db --remote --file=database/prod-patches/088b_reconcile_subjects_columns.sql
-- Not idempotent by construction (SQLite has no ADD COLUMN IF NOT EXISTS) —
-- run exactly once against prod.

ALTER TABLE subjects ADD COLUMN exam_type_id TEXT REFERENCES exam_types(id);
ALTER TABLE subjects ADD COLUMN category_id TEXT REFERENCES subject_categories(id);
ALTER TABLE subjects ADD COLUMN waec_code TEXT;
ALTER TABLE subjects ADD COLUMN is_active INTEGER DEFAULT 1;

-- The metadata backfill for subj_wassce_bus_mgmt lives at the end of 088a's
-- section 3b (it must run AFTER 088a's insert, which migrations apply does).
-- ORDER MATTERS: this file must run BEFORE `wrangler d1 migrations apply`,
-- or 088a's backfill will fail on the missing columns.
