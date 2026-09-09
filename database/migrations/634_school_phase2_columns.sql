-- Migration 634: school subscriptions phase 2 columns (spec:
-- docs/plans/2026-09-08-school-subscriptions.md).
-- - school_seats.analytics_opted_out(+_at): SHS-student consent gate for
--   school-side per-student analytics (mirrors the parent student_opted_out
--   precedent).
-- - schools.seat_credit: GHS proration credits from mid-cycle seat
--   reductions, consumed as a discount on renewal checkout.
-- - schools.renewal_reminded_at: idempotency guard for the renewal-reminder
--   cron.
-- - subscription_tiers.paystack_plan_code: maps a Paystack recurring plan
--   back to a tier so recurring charges can settle (NULL until plans exist).

ALTER TABLE school_seats ADD COLUMN analytics_opted_out INTEGER NOT NULL DEFAULT 0;
ALTER TABLE school_seats ADD COLUMN analytics_opted_out_at TEXT;

ALTER TABLE schools ADD COLUMN seat_credit INTEGER NOT NULL DEFAULT 0;
ALTER TABLE schools ADD COLUMN renewal_reminded_at TEXT;

ALTER TABLE subscription_tiers ADD COLUMN paystack_plan_code TEXT;
