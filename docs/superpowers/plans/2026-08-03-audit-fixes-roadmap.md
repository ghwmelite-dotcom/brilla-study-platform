# Audit Fixes — Master Roadmap

> **For agentic workers:** Execute phases strictly in order using superpowers:subagent-driven-development or superpowers:executing-plans, one phase plan at a time. Do not start a phase until the previous phase's `## Verification` gate passes.

**Goal:** Fix all findings from the 2026-08-03 full-site audit (11 CRITICAL clusters, 24 HIGH, 31 MEDIUM, 27 LOW) in a sequence that closes the compromise chain first and the one-way doors last.

**Source:** audit performed 2026-08-03 across five tracks (API security, API correctness, frontend, config/infra, database). All findings were re-verified against the code during plan writing; corrections are recorded inside each phase plan.

## Phases

| # | Plan file | Tasks | Theme | Depends on |
|---|-----------|-------|-------|------------|
| 0 | `2026-08-03-fix-00-environment-baseline.md` | 12 | Install, green build/lint baseline, vitest, workers typecheck+lint, security dep bumps (hono, fabric, react-router-dom) | — |
| 1 | `2026-08-03-fix-01-auth-unification.md` | 18 | Shared JWT middleware everywhere; kill header auth, demo tokens, IDORs, setup/seed endpoints, CORS, email XSS | 0 |
| 2 | `2026-08-03-fix-02-money-paths.md` | 5 | Webhook fail-closed, payment verify ownership/idempotency, revenue status fix, datetime canonicalization, AI quotas | 0, 1 |
| 3 | `2026-08-03-fix-03-runtime-features.md` | 21 | xp_points standardization, learningpath, atomicity/TOCTOU, N+1, pagination, recordings, dead code | 0, 1 |
| 4 | `2026-08-03-fix-04-frontend.md` | 11 | XSS escaping, API client consolidation (3 → 1), 401 handling, ErrorBoundary, demo-auth removal, polling, dead code | 0, 1 |
| 5 | `2026-08-03-fix-05-database-reckoning.md` | 6 | Canonical schema squash, 724 numeric-answer fixes, seed rework, baseline migration, prod runbook | 0–3, schema handoff from 3 |
| 6 | `2026-08-03-fix-06-headers-hygiene.md` | 11 | `public/_headers` + CSP, compat-date bump, CSPRNG invites, timing-safe compares, avatar sniffing, validation | 0, 4 |

Total: 84 tasks. Sequential as requested; phases 2, 3, 4 are mutually independent and MAY run in parallel after Phase 1 if speed matters more than simplicity.

## Cross-phase reconciliation (read before executing)

- **Test runner:** Phase 0 installs vitest and owns the convention (`npm test`). Phase 6's plan independently chose `node --test` to avoid a new dependency — **Phase 0's choice wins**; adapt Phase 6's test steps to vitest when executing.
- **Phase 2** assumed `npm test` + `workers/api/__tests__/` and adds `better-sqlite3` as a devDependency for real-SQLite datetime tests. Confirm against Phase 0's actual setup first.
- **Phase 3 → Phase 5 handoff:** Phase 3 makes NO schema changes; its `## Schema-change handoff to Phase 5` section (5 items, incl. `users.affiliate_xp`/`referred_by` from migration 021 and a phantom `users.streak` column read in cosmetics.ts) must be folded into Phase 5's canonical schema.
- **Phase 4 → Phase 1 follow-up:** `/progress` still derives user from `?userId=` with a `'user_demo'` fallback (index.ts:3330) — confirm Phase 1's IDOR tasks closed it; Phase 4 wires Topics mastery against the fixed route.
- **verify-token GET→POST:** backend route (index.ts:1477) is GET-only. Phase 4 flips the frontend to POST only if the backend route is extended — coordinate during Phase 4; deferring is acceptable.
- **Demo-token sweep:** Phase 1 found demo-token acceptance in MORE modules than the audit listed (payments, affiliates, teacher-bonuses, tutoring too). Phase gate: `grep -r "_demo_token" workers/` must return zero matches before Phase 1 closes.
- **Frontend header sweep:** `x-user-id` senders exist in api.ts (3), chatStore.ts (11), aiTutorStore.ts (5) — all removed in Phase 1 Task 18.

## Decision log (made during planning, revisit only with cause)

- OAuth registrations: students auto-approved, teachers/parents pending, admin rejected. Intentional divergence from register's all-pending; flagged for product review.
- Coin economy: removed (was never credited; echoed phantom values). XP standardizes on `users.xp_points`.
- DB squash: single canonical `schema.sql` + `089_baseline_marker`; old migration chain archived to `database/migrations/archive/`.
- 082 vs 084 A-level questions: keep both; 084 renumbered to `q_alevel_maths_001..040` and its phantom subject/exam-type IDs fixed.
- CSP: inline scripts + `onload=` handlers externalized to `public/app-bootstrap.js` (hashes rejected); theme color unified to `#006B3F`; `workers/package.json` deleted.
- Frontend client consolidation: `lib/api.ts` envelope shape survives; consumers: lib 33, services 25, utils 7 (65 total).

## One-way doors (require explicit user confirmation at execution time)

1. Phase 5 production D1 baseline application (backup via `wrangler d1 export` first; GO/NO-GO checklist in the plan).
2. Phase 5 archive of the old migration chain (reversible in git, but changes deploy behavior).
3. Any `git commit` — per house rules, every commit step in every plan runs only with explicit user approval.
4. Dependency major-version surprises: each bump task in Phase 0 starts with `npm view` and stays in-major; anything requiring a major bump (e.g. react-router v7, Vite 7) is out of scope.

## Known limitations

- Build/lint/typecheck could not be run during audit (no node_modules); Phase 0 establishes the true baseline. Any pre-existing tsc/eslint errors discovered there are recorded as baseline metrics, not fixed ad hoc.
- Plan line references were verified on 2026-08-03; they will drift as phases land. Each phase's tasks cite symbols, not just lines.
- The audit was report-only; runtime behavior of the Workers API (e.g. whether prod D1 was hand-patched with `xp`/`coins`) is unverified. Phase 3 Task 1 includes the `PRAGMA table_info(users)` check against the real DB.

## Definition of done (whole roadmap)

- `npm run build`, `npm test`, `npm run lint`, `npm run typecheck:api` all green.
- `npm run db:verify` green (fresh SQLite apply + answer-format gate).
- `grep -r "_demo_token" workers/` → 0 matches; `grep -rn "x-user-id" src/ workers/` → 0 auth-relevant matches.
- `npm audit --omit=dev` → 0 high/critical.
- `curl -sI https://brillaprep.org` shows CSP, HSTS, XFO, Referrer-Policy (post-deploy, Phase 6).
- Production D1 baselined on canonical schema; old chain archived.
