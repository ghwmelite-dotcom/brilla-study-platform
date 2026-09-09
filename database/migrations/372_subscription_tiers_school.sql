-- Migration 372: school subscription seat packages (spec:
-- docs/plans/2026-09-08-school-subscriptions.md, decision 1 + pricing table).
-- Five new subscription_tiers rows with user_type='school'. Prices are the
-- PACKAGE price (GHS), not per-seat: 25 seats @35/seat = 875/mo, 50 @30 =
-- 1500/mo, 100 @25 = 2500/mo, 250 @20 = 5000/mo; yearly = 10x monthly.
-- tier_school_custom stays inactive (is_active=0) until an admin sets a
-- negotiated price on the payment row; checkout skips it because
-- payments.ts rejects plans priced <= 0.

INSERT INTO subscription_tiers (id, name, slug, description, price_monthly, price_yearly, currency, ai_grading_quota, features, user_type, daily_question_limit, is_active) VALUES
('tier_school_25', 'School Package — 25 Seats', 'school-25', '25 student premium seats (35 GHS/seat/mo). Admin-operated; seat code onboarding.', 875, 8750, 'GHS', 0, '["bulk_student_seats","seat_code_onboarding","admin_managed"]', 'school', -1, 1),
('tier_school_50', 'School Package — 50 Seats', 'school-50', '50 student premium seats (30 GHS/seat/mo). Admin-operated; seat code onboarding.', 1500, 15000, 'GHS', 0, '["bulk_student_seats","seat_code_onboarding","admin_managed"]', 'school', -1, 1),
('tier_school_100', 'School Package — 100 Seats', 'school-100', '100 student premium seats (25 GHS/seat/mo). Admin-operated; seat code onboarding.', 2500, 25000, 'GHS', 0, '["bulk_student_seats","seat_code_onboarding","admin_managed"]', 'school', -1, 1),
('tier_school_250', 'School Package — 250 Seats', 'school-250', '250 student premium seats (20 GHS/seat/mo). Admin-operated; seat code onboarding.', 5000, 50000, 'GHS', 0, '["bulk_student_seats","seat_code_onboarding","admin_managed"]', 'school', -1, 1),
('tier_school_custom', 'School Package — Custom (250+ Seats)', 'school-custom', 'Negotiated 250+ seat package. Price is set on the payment row by an admin; this row stays inactive.', 0, 0, 'GHS', 0, '["bulk_student_seats","seat_code_onboarding","admin_managed","negotiated_pricing"]', 'school', -1, 0);
