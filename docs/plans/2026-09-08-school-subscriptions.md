# School Subscription Packages — Implementation Spec

**Date:** 2026-09-08 · **Status:** For build (decisions locked by owner) · **Scope:** schools buy student seat packages; Brilla admins operate everything via adminApp. Phase 1 = admin-operated; Phase 2 = school self-serve.

## Decisions (locked)

| # | Decision | Rejected alternative | Why |
|---|---|---|---|
| 1 | Student seat packages only; new `subscription_tiers` rows with `user_type='school'` | Separate school-billing table | Teachers are already premium by role; checkout stays DB-driven (`payments.ts:245` reads the tier row), zero payment-path fork |
| 2 | Propagate by writing each seat-holder's `users` row; record linkage in `school_seats` | Derive premium from `school_id` at gate time | Zero changes to `isPremiumUser` (usage-limits.ts:51) or any gating; downgrade is a precise write, not a gate redesign |
| 3 | No new role in phase 1; extend adminApp schools routes | `school_admin` role now | users.role CHECK needs a users-rebuild migration (pattern: `092_users_parent_role.sql`); admin ops already cover school CRUD |
| 4 | Onboarding via seat codes modeled on `parent_student_links`: **one code per school with N uses** | N single-use codes per school | One code = one invite string for a whole school (matches the ambassador referral-code pattern); cap enforced by counter + `school_seats` count. State machine (pending/active/revoked/expired) and audit reuse the proven shape |
| 5 | One-time Paystack charge, manual renewal; settlement grants seats to the school | Paystack plan codes / recurring | Matches individual billing today; no recurring infra exists |
| 6 | Conflict: school seat sets tier/expiry only if it EXTENDS coverage; prior values stored on the `school_seats` row and restored on lapse | Overwrite blindly | Individual paid subs must survive school lapse; restore-from-snapshot is cheap and exact |
| 7 | Nightly cron expiry mirroring the trial-expiry job (subscriptions.ts ~471); member-leaves-school releases the seat | Real-time checks / lazy expiry | Existing batch pattern; seat release on leave keeps the cap honest |
| 8 | Phase 1 data scope: school sees seat usage counts only | Any per-student analytics now | Analytics need the parent-consent precedent (`student_opted_out`); out of phase 1 |

## Pricing (proposed — owner sign-off before seed)

| Seats | GHS/seat/mo | Package/mo | Package/yr (10×) | Tier id |
|---|---|---|---|---|
| 25 | 35 | 875 | 8,750 | `tier_school_25` |
| 50 | 30 | 1,500 | 15,000 | `tier_school_50` |
| 100 | 25 | 2,500 | 25,000 | `tier_school_100` |
| 250 | 20 | 5,000 | 50,000 | `tier_school_250` |
| 250+ custom | negotiated | — | — | `tier_school_custom` (admin-set price on the payment row, tier row price = 0) |

Top-ups: same per-seat rate as the school's active tier; expiry aligned to the school's current `seat_expires_at` (prorate by remaining days, rounded down to the nearest GHS).

## Phase 1 build spec

### Migrations (372+, one file each)

- **372_subscription_tiers_school.sql** — insert the 5 school tier rows (`user_type='school'`, `is_active=1`; `tier_school_custom` inactive until priced).
- **373_schools_seat_columns.sql** — `schools` + `seat_tier_id TEXT` (FK subscription_tiers), `seat_expires_at TEXT`, `seat_code TEXT UNIQUE`, `seat_code_uses INTEGER DEFAULT 0`, `seat_cap INTEGER DEFAULT 0`, `school_expires_at TEXT` NOT needed separately — `seat_expires_at` is the school expiry.
- **374_school_seats.sql** — `school_seats(id, school_id FK, user_id FK, granted_at, source_payment_ref, status CHECK('active','revoked','expired'), prior_tier_id TEXT, prior_expires_at TEXT, UNIQUE(school_id, user_id, status) via partial index on status='active')`.

### Backend

- **Payment settlement hook** (`payment-settlement.ts`): if the payment's tier row has `user_type='school'`, settle onto the **school** (metadata carries `school_id`): set `seat_tier_id`, `seat_expires_at` (+1mo/+1yr or aligned extension on top-up), `seat_cap += package seats`, mint/regenerate `seat_code`. Do NOT touch the payer's users row. Store `school_id` + seat count in `payment_transactions.metadata`.
- **Admin routes** (extend adminApp schools block):
  - `POST /api/admin/schools/:id/seats/purchase` — record an offline/manual purchase (builds the payment_transactions row + runs the same settlement path, so online and manual converge).
  - `POST /api/admin/schools/:id/seat-code/regenerate` — rotate code (invalidates outstanding claims only, not granted seats).
  - `GET /api/admin/schools/:id/seats` — list `school_seats` + usage (active count / cap / expiry).
  - `DELETE /api/admin/schools/:id/seats/:userId` — revoke one seat: restore prior tier/expiry, mark row revoked, decrement usage.
- **Redeem endpoint**: `POST /api/schools/redeem-code` (authed) — validates code + school status + cap (`seat_code_uses < seat_cap`), runs inside a transaction: insert `school_seats` (snapshot prior tier/expiry), set `users.school_id`, and **only if school expiry > user's current effective premium expiry** write `users.subscription_tier_id = seat_tier_id`, `subscription_expires_at = seat_expires_at`; increment `seat_code_uses`. Redeem in registration (optional code field) and Settings → School ("Join a school" card).
- **Expiry cron** (extend the existing scheduled handler alongside the trial-expiry job): schools where `seat_expires_at < now` → for each active `school_seats` row restore `prior_tier_id`/`prior_expires_at` onto the users row, set status='expired'. Idempotent (only touches rows still status='active').
- **Member leaves school** (admin `DELETE /api/admin/schools/:id/students` or student leaves in Settings): same restore + status='revoked'; seat returns to the pool.

### Edge cases (must be handled, not deferred)

- Code at cap → 409 with clear message; no partial state.
- Re-redeem by same student (new code, same school) → no-op success, no duplicate active row.
- Student in school A redeems school B code → block unless first released (no silent school-hop).
- School tier expired but seat-holders mid-month → cron restores prior individual entitlement exactly (including free users: prior_tier_id='tier_free', prior_expires_at=NULL).
- Top-up before expiry → cap and expiry extend, existing seat-holders untouched.
- `seat_code_uses` and active `school_seats` count drift (failed transactions) → admin seat list shows both; cron logs mismatch.

## Phase 2 (built)

- **`school_admin` role + school self-serve dashboard** — migration `633_users_school_admin_role.sql` (092-style users rebuild with the full 53-column shape; `PRAGMA defer_foreign_keys` + drop/same-name-recreate so it replays inside the bootstrap verifier's per-file transactions) adds the role CHECK value. New module `workers/api/school-admin.ts` mounted at `/api/school-admin` with its own requireAuth + school_admin gate + users.school_id scoping: `GET /overview` (usage, drift, days remaining, credit, renewal state), `GET /seats`, `POST /seat-code/regenerate`, `POST /billing/renew` (Paystack checkout at the tier price minus `schools.seat_credit`; metadata carries school_id + seats + credit_applied so settlement converges through `settleSchoolSeatPayment`, which burns the credit atomically).
- **Consent-gated per-student analytics** — migration `634_school_phase2_columns.sql` adds `school_seats.analytics_opted_out(+_at)`; `GET /api/school-admin/students/:studentId/progress` reuses the parents progress query shape (403 on opt-out, active-seat required); SHS-only student flips via `POST /api/schools/seat/analytics-opt-out|opt-in` (mirrors the parent-link school_level precedent).
- **Paystack recurring enablement + renewal reminders** — `634` adds `subscription_tiers.paystack_plan_code` and `schools.renewal_reminded_at`; the webhook tolerates charge.success payloads with plan/subscription objects and settles mapped school-plan recurring charges (`settleRecurringSchoolPlanCharge` in payment-settlement.ts, idempotent by reference, unknown plan codes ignored); `sendSchoolRenewalReminders` runs in the every-6-hours cron (Telegram school channel + email + in-app notification per school_admin, idempotent via the reminded_at guard).
- **Prorated mid-cycle seat reductions** — `POST /api/admin/schools/:id/seats/reduce` drops the cap (409 when active seats exceed the new cap) and credits `floor(perSeatRate × seats × remainingDays / periodDays)` to `schools.seat_credit` (per-seat rate from the tier row; cycle inferred from the school's latest successful payment, default monthly). School-admin assign/demote: `POST|DELETE /api/admin/schools/:id/school-admins[/:userId]` (409 cross-school, platform admins refused, demote restores teacher role when teacher-profile fields exist).

## Acceptance criteria & mandatory tests

| Feature | Acceptance | Mandatory tests |
|---|---|---|
| School tier settlement | Paystack webhook (or admin purchase) for a school tier updates the schools row only; payer's users row untouched | Settlement idempotency: replaying the same webhook ref changes nothing (pattern: existing payment tests) |
| Code redemption | Valid code under cap grants seat, sets school_id, extends tier/expiry only when beneficial; cap hit → 409 | Code state-machine tests (valid/unknown/capped/rotated code); seat-cap concurrency test (two redeems race for last seat) |
| Conflict rule | Student with individual sub keeps it; on school lapse their exact prior tier/expiry is restored | Downgrade-restores-individual-sub test (paid prior + free prior + trial prior) |
| Expiry cron | Lapsed school → all active seats restored + expired; second cron run is a no-op | Cron idempotency + fan-out test |
| Leave/revoke | Seat released, cap freed, user restored | Revoke + reassign-to-another-student test |
| Admin routes | All seat admin routes require admin role | IDOR/authz tests (pattern: houses-battles-idor.test.ts) |

## Ships sales-led before any code

No code is needed to start selling: admin creates the school (existing POST /api/admin/schools), collects payment manually, and comps each student individually via POST /api/admin/users/:id/set-tier (index.ts:9784); the ambassador system-user pattern (POST /:id/ambassador) already gives the school an invite code. This spec automates exactly that manual loop.

## Riskiest open questions

1. **Seat-cap accounting under races:** `seat_code_uses` vs active `school_seats` count can drift on partial transaction failure — needs the reconcile-on-read admin view or a CHECK-enforced invariant; decision deferred to implementation.
2. **Restore semantics for lapsed schools with mixed seat-holders:** restoring `prior_tier_id` per row is exact, but a seat-holder who *upgraded individually after* joining the school gets restored to the stale snapshot — needs a "keep the better of snapshot vs current" comparison at downgrade time.
3. **Top-up proration rounding:** aligning expiry while adding seats at a per-seat rate can produce fractional-day credits; rounding down favors Brilla but must be disclosed on the invoice copy, or schools will dispute.
