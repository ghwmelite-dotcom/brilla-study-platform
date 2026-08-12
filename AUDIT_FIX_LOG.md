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

## Phase 3 — Runtime Feature Fixes (22/22 ✅, 2 fix rounds)

✅ T1 batch-aware mockD1 helper. ✅ T2 phantom `users.xp`/`streak` columns → `xp_points`/`streak_days` (🔧 fix round: /streak/rescue missed site). ✅ T3 phantom coin economy removed (client-side fiction documented). ✅ T4-T5 learningpath revived (exam_types JOIN, mastery off question_attempts, readiness N+1 collapsed). ✅ T6 quest claim atomic (conditional UPDATE + batch). ✅ T7 tournament join TOCTOU closed (conditional debit + INSERT...SELECT + refund). ✅ T8-T9 registration + OAuth registration batched. ✅ T10 affiliate referral batched. ✅ T10b (amendment): referral commission hijack closed (JWT identity), tutoring verify claim-first. ✅ T11 chat /rooms single-query. ✅ T12 quickplay IN-query grading + payload validation. ✅ T13 teacher bonuses O(1) grouped. ✅ T14 parseLimit caps (38 sites). ✅ T15 admin/users pagination + trial chunk (🔧 fix round: D1 batch headroom, loadAllUsers paging). ✅ T16 N+1 sweep (5 sites incl. user-search fold-in). ✅ T17 recording upload 100MB cap + compensating R2 delete. ✅ T18 R2 objects deleted on recording delete. ✅ T19 /exam-types dedupe + demo cleanup unified on 33-table superset. ✅ T20 /health envelope standardized. ✅ T21 register 500 + guarded JSON parsing (parseJsonBody in http.ts).

⏸ Parked: parseOffset/parsePage helpers, created_at tie-mixing in correlated subqueries, D1 two-unit seams, learningpath UPSERT loop, counselor.ts:526 **and** :848 phantom `user_streaks` table (TWO sites, both 500 when hit), demo-flag dedupe, ~43 unguarded JSON parses (set/forgot/reset-password the main public ones), real UI pagination in UserManagement, R2 orphan sweeper.

## Phase 4 — Frontend Hardening (11 tasks + 1 addendum ✅, 2 fix rounds)

✅ T1 XSS closed (escape-before-regex in AiMessage; MathText fallback escaped). ✅ T2 lib/api hardened (401 handler + redirect, JSON guard, no logging). ✅ T3-T4 three API clients consolidated into lib/api + lib/services (32 consumer migrations; latent bugs fixed: usageStore always-defaults, Analytics, ContentManagement stats, recordings upload token-key). ✅ T5 ErrorBoundary + lazyWithRetry on 72 lazy pages. ✅ T6 client demo auth removed, prod bundle verified credential-free (🔧 fix round: AuthModal gated). ✅ T7 visibility-aware polling on 6 sites (🔧 fix round: jsdom declared). ✅ T8 StrictMode double-fire guards. ✅ T9 real mastery wiring on Topics. ✅ T10 SW banner + console sweep + a11y landmark. ✅ T11 12 orphan files deleted. ✅ T12 (addendum): user_progress write path on question attempts (mastery was unwritable before).

⏸ Parked: raw-fetch stores bypass 401 redirect (chat silently falls back), user_progress NULL-exam_type unique-index race, Header/ObservingSessionPanel polling sites, SubjectCatalog stub progress, pdfjs/DOMMatrix test-env, authService dead routes.

## Phase 5 — Database Reckoning (6/6 ✅, 1 fix round + 1 fix wave)

✅ T1 db:verify CI gate (node:sqlite, zero deps, 18 checks incl. malformed-JSON options gate). ✅ T2 canonical schema regenerated (203 tables, deterministic generator, ALTER/DROP/RENAME folding). ✅ T3 088a_data_fixes.sql (724 numeric answers converted with anti-corruption guards, subject ID reconciliation, 082/084 collision, 8 bad rows). ✅ T4 idempotent 4,545-question seed (🔧 fix round: deterministic generator + created_at preservation). ✅ T5 baseline strategy (108 files archived; migrations_dir = 088+088a+089; q_em_007 drift fixed). ✅ T6 updated_at trigger replacement (14/14 UPDATEs) + docs. 🔧 Final fix wave: user_streaks phantom repointed, generators repointed post-archive, runbook corrected.

⏸ Parked: questions_new DROP migration; prod reconciliation proof pending prod apply.

## Phase 6 — Headers & Hygiene (11/11 ✅, 2 fix rounds + 1 fix wave)

✅ T1 inline scripts externalized (KaTeX SRI verified). ✅ T2 public/_headers with CSP (no unsafe-inline in script-src) + HSTS (🔧 fix round: PhET frame-src + mixkit media-src). ✅ T3 pitch-site headers. ✅ T4 og-image + theme color unified. ✅ T5 workers/package.json deleted. ✅ T6 compat date 2024-01-01→2026-05-12 + env.production dedupe. ✅ T7 CSPRNG invite codes. ✅ T8 constant-time password compare. ✅ T9 avatar magic-byte sniffing + nosniff (🔧 fix round: size check before buffering). ✅ T10 registration validation. ✅ T11 stable React keys. 🔧 Fix wave: CSPRNG room codes (study-rooms, tutor-classroom).

⏸ Parked: library upload file.type trust, admin POST /users validation, wrangler 3→4, env.dev duplication.

## ROADMAP COMPLETE (all 7 phases, 2026-08-12)

Final state: 200/200 tests green (40 files), frontend tsc 0 errors, workers tsc 130 (from 316 baseline — ratcheted), lint 246 (from 256), npm audit 12 (all breaking-major-only), db:verify 18/18, wrangler bundles clean, prod bundle credential-free.

## DEPLOYED (2026-08-12)

- Merged to main (`c99c265`, +2 prod-patch commits), pushed.
- Prod D1: backup `backups/pre-squash-20260812-022533.sql` (6.3 MB); 088/088a/089 applied; prod patches 088b (subjects column reconcile — prod had lost 4 columns to the 018/028-era rebuilds) and 088c (orphan refs: 100 phantom-subject + 962 phantom-topic questions) applied. Verified: 0 orphan refs, baseline recorded, 87 all-digit answers (expected 88−1 for the q_em_007 letter fix), `subj_wassce_bus_mgmt` canonical with metadata.
- Worker deployed (`brilla-api`, compat 2026-05-12): /api/health new envelope; header-auth and demo-token attempts → 401.
- Site deployed to Pages: HSTS + CSP live on brillaprep.org (script-src no unsafe-inline, PhET/mixkit allowed), og-image 200, app-bootstrap 200. Pitch site deployed with HSTS+strict CSP.
- Rehearsal: full fresh-env flow proven on throwaway D1 (deleted after); schema apply is idempotent (IF NOT EXISTS everywhere).

## POST-DEPLOY FOLLOW-UPS LANDED (2026-08-12)

- wrangler 3.114 → 4.121 (npm audit 12 → 7; remaining are vitest-3/vite-6 and react-router-7 majors). Pushed; prod worker still on the wrangler-3-built bundle (rides the next worker deploy).
- Raw-fetch 401 parity: `fetchWithAuth` in `src/lib/api.ts` (shared handleUnauthorized incl. auth-page loop guard + FormData handling); 70 raw auth fetches migrated across 10 stores/pages; houseStore mutations (previously always-401, sending no auth) now authenticate. Bonus fix: Settings.tsx avatar upload's `brilla-token` typo (always-empty Bearer) repaired by the migration. Site redeployed.

PENDING USER ACTIONS:
1. Set 3 missing secrets: `wrangler secret put PAYSTACK_SECRET_KEY`, `PAYSTACK_WEBHOOK_SECRET`, `SETUP_KEY` (with `CLOUDFLARE_ACCOUNT_ID=ea2eb3a9813660dfca2a60e594858538`). Without PAYSTACK_SECRET_KEY all Paystack calls fail; without the webhook secret, webhooks 500 BY DESIGN.
2. Rotate JWT_SECRET on a quiet day (invalidates all sessions; forces re-login; closes the old-secret exposure question) + change the admin password from anything default-shaped.
3. Browser smoke: login (Turnstile), one AI call, one D1 read, avatar upload (real + fake PNG), KaTeX question, PDF paper, PhET embed, ambient audio, one previously-unanswerable question (065/066/067 topic, 037 BECE, q_alevel_maths_*).
4. Watch Workers Logs for 48h (observability now on).

## PROD VERIFICATION SWEEP (2026-08-12, post-deploy)

Live QA matrix: 28/29 PASS. Fixed the one FAIL + two safety items found along the way:
- `/api/essays/history` 500 → root cause: prod was missing 15 tables (legacy migration chain partially failed years ago: essay_*, tutor-classroom set, chat moderation, structured_question_parts, etc.). Prod patch 088d created the 14 real ones (questions_new scratch excluded). Endpoint now 200.
- `/auth/reset-demo-passwords` was live and unauthenticated (a probe reset both demo accounts). Now 404 outside development; worker redeployed. Demo account passwords should be rotated by the owner (they're repo-known: Teacher123!/Student123!).
- Prod was missing the 40 A-level maths questions (082/084 PK collision's silent OR IGNORE loss). Prod patch 088e restored them — prod now has all 4,545 questions, matching the gate-verified seed.
- Worker tail sample: zero exceptions during live traffic.
- CORS verified: evil.com gets no ACAO; brillaprep.org echoed. /auth/setup 404. Admin routes 401/403 correctly.

Remaining USER ACTIONS: rotate JWT_SECRET + demo/admin passwords; browser smoke list above; SETUP_KEY optional.
