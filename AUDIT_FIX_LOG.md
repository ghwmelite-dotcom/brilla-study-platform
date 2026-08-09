# AUDIT FIX LOG

Consolidated execution log for the 2026-08-03 full-site audit remediation, branch `fix/audit-remediation`.
Per-task detail lives in `.superpowers/sdd/` ledgers; this file is the phase-level record.

Legend: ✅ complete · 🔧 fix round(s) required · ⏸ parked/deferred

## Phase 0 — Environment & Test Baseline (12/12 ✅)

Vitest harness (frontend + worker smoke tests), workers typecheck (316-error baseline ratchet) + lint coverage (256-problem baseline), security dep bumps: hono ^4.13.0, fabric ^7.4.0, react-router-dom ^6.30.4, npm audit fix (24→12, remainder breaking-only majors). jose removed, `warning` declared, wrangler `[env.dev]` + observability + 8-secret docs + `.dev.vars.example`.

⏸ Parked: react-router v7 migration (unpatchable v6 advisory), wrangler 3→4 major, compatibility_date bump, README jose mention.

## Phase 1 — Auth Unification (19 tasks + gate fix ✅)

P0 closed: shared JWT middleware (`workers/api/auth-middleware.ts`, verified JWT + per-request DB role/status/is_active re-check) mounted on ALL routers incl. satellites; `x-user-id`/`x-user-role` header auth deleted worker-wide + frontend; demo tokens deleted worker-wide; IDOR cluster (houses/battles/papers/progress/essays/usage) closed — identity only from JWT context; OAuth self-serve-admin closed (role whitelist, non-students pending); `/auth/setup` hardened (SETUP_KEY, one-shot, rate-limited, no overwrite, no admin creation); exam-boards seed gated behind admin; CORS allowlist; email HTML escaping; Turnstile exemption narrowed to 3 explicit emails; onError generic; 24h JWT expiry.

🔧 Task 9 fix round: battle-history response shape regression restored server-side. Gate fix: 4 shadowed routes found & fixed (battles/history, papers/attempts, essays/history, questions/bank) + houses standings/activity reorder. Final review fix wave: `userAuth` per-route middleware stopped overwriting DB-fresh role (I-1).

⏸ Parked: refresh tokens (24h access tokens for now), requireAdmin migration for in-handler role checks, /houses/points recipient semantics (product decision).

## Phase 2 — Money Paths (5/5 ✅, 1 fix round)

P0 closed: Paystack webhook fails closed when secret unset (unsigned events never processed); verify endpoint ownership-404 + idempotent claim-first + amount/currency validation + status-guarded claim (double-credit race killed); admin revenue reads `status='success'` (was reading zero); ISO datetime canonicalization at 5 sites + migration `088_normalize_datetime_to_iso.sql`; AI 50/user/day quota (rate-limit.ts extracted) on explain/chat/counselor.

🔧 Task 2 fix round: status-guarded atomic claim prevents concurrent-verify double-credit.

⏸ Parked: `user_subscriptions.expires_at` format unverified (untouched deliberately), write-side legacy `started_at`, counselor /reports/generate ungated AI (staff-only), tutoring payouts separate surface (fixed in Phase 3 Task 10b).

## Phase 3 — Runtime Feature Fixes (16/22 so far)

✅ T1 batch-aware mockD1 helper. ✅ T2 phantom `users.xp`/`streak` columns → `xp_points`/`streak_days` (🔧 fix round: /streak/rescue missed site). ✅ T3 phantom coin economy removed (client-side fiction documented). ✅ T4-T5 learningpath revived (exam_types JOIN, mastery off question_attempts, readiness N+1 collapsed). ✅ T6 quest claim atomic (conditional UPDATE + batch). ✅ T7 tournament join TOCTOU closed (conditional debit + INSERT...SELECT + refund). ✅ T8-T9 registration + OAuth registration batched. ✅ T10 affiliate referral batched. ✅ T10b (amendment): referral commission hijack closed (JWT identity), tutoring verify claim-first. ✅ T11 chat /rooms single-query. ✅ T12 quickplay IN-query grading + payload validation. ✅ T13 teacher bonuses O(1) grouped. ✅ T14 parseLimit caps (38 sites). ✅ T15 admin/users pagination + trial chunk (🔧 fix round: D1 batch headroom, loadAllUsers paging). ✅ T16 N+1 sweep (5 sites incl. user-search fold-in).

⏸ Parked: parseOffset/parsePage helpers, created_at tie-mixing in correlated subqueries, claim→batch D1 two-unit seams, real UI pagination in UserManagement, counselor.ts:848 phantom `user_streaks` table.

Pending: T17 recording upload cap, T18 recording R2 delete, T19 dead code dedupe, T20 health envelope, T21 register 500/JSON guards.

## Phases 4-6 — Pending

- Phase 4: Frontend hardening (XSS, API client consolidation, 401s, ErrorBoundary, demo-auth removal, polling).
- Phase 5: Database reckoning (canonical schema squash, 724 numeric-answer fixes, seed rework, prod runbook with 089_baseline_marker).
- Phase 6: Headers & hygiene (CSP/HSTS, compat-date bump, CSPRNG invites, validation).
