# Question Bank Integrity Remediation

Status: STAGING RE-VERIFIED THROUGH MIGRATION 101; PRODUCTION RELEASE AUTHORIZED
Owner: BrillaPrep
Branch: `codex/remediate-question-bank-integrity`
Date: 2026-08-23

## Outcome

Show every active subject truthfully, prevent zero-content practice journeys, keep limited banks usable, and repair only relationships proven by current data. Inventory is not curriculum certification.

## Verified Production Baseline

- 77 active subjects: 40 populated, 37 empty.
- 4,545 questions; all have non-empty answers/explanations; 121 explanations are shorter than 20 characters.
- 3,487 questions have no topic; 2,185 have no exam type.
- 443 topic links cross subjects: 395 have one deterministic same-name target; 48 are ambiguous or unmatched.
- 18 subjects lack exam assignment; ten populated rows contain 495 questions.
- Cost Accounting and Technical Drawing each have one populated legacy row and one empty duplicate.
- 192 normalized duplicate-text groups contain 210 extra rows.

## Public Availability Contract

All active subjects remain in `GET /api/subjects`.

| Live questions | Status | Behavior |
|---:|---|---|
| 0 | `unavailable` | “Not yet available”; never a practice link or upgrade prompt |
| 1–19 | `limited` | Usable with repetition warning |
| 20+ | `available` | Usable and labelled available |

Availability is evaluated before premium access. The additive DTO preserves `success`, `data`, and snake_case fields, and adds camelCase counts/IDs, `availabilityStatus`, `availabilityReason`, and `contentReviewStatus: legacy_unreviewed`.

Stable reasons are `question_bank_empty`, `question_bank_below_operational_floor`, and `question_bank_meets_operational_floor`. `topicCount` means all subject-owned topics.

## Migration 100

The migration aborts unless the exact expected pre-state exists:

- five `subj_igcse_*` IDs and their Cambridge IGCSE exam/categories;
- five `subj_alevel_*` IDs and their Cambridge A-Level exam/categories;
- four `subj_edexcel_igcse_*` IDs and their Edexcel exam/categories;
- the four duplicate source/canonical subject rows;
- zero non-null question/subject exam conflicts.

No name heuristic assigns an exam or category.

`question_bank_remediation_log` is a persistent, release-scoped ledger of every changed subject/question field, exact old/new value, entity ID, migration ID, and timestamp. Its uniqueness key makes reruns idempotent.

Duplicate slug sequence:

1. ledger the empty duplicate slug/active state;
2. rename it to a unique `--retired-100` slug;
3. deactivate it;
4. preserve the populated ID/slug;
5. copy only required WASSCE exam/category/code metadata.

Question exam types are copied from the subject only when null. Existing non-null values are preserved.

Topic normalization is exactly `lower(trim(name))`. A cross-subject topic is remapped only when the question’s subject contains exactly one normalized-name candidate. Zero or multiple candidates are ledgered and set to null; fuzzy or arbitrary matching is forbidden.

## Runtime Enforcement

- Subject list/detail require active subjects and use separate grouped question/topic aggregates to prevent count multiplication.
- Topic list/detail join through active subjects.
- `GET /api/questions?subject=...` preflights active inventory.
- Unknown/inactive subject returns 404 `SUBJECT_NOT_FOUND`.
- Active empty subject returns 409 `SUBJECT_UNAVAILABLE`.
- Limited/available subjects continue normally.
- Question detail only returns rows owned by active subjects.
- Student question and paper reads require authentication and redact correct answers, explanations, and option correctness until an authorized attempt is submitted.
- Paper answers are scoped to the attempt's paper, in-progress results expose resume-safe fields only, and canonical answer columns are graded atomically at submission.
- The shared freemium policy understands canonical exam-prefixed slugs and fails closed for unknown exam metadata; migration 101 enforces the daily free-tier ceiling inside the same atomic batch as the attempt and progress writes.
- Catalogue and `/topics/:subjectSlug` share the same unavailable/limited meaning.

## Frontend Source of Truth

The exam store fetches live catalogue data. Local metadata supplies placeholder names/icons/colors only, with `availabilityStatus: unknown` and no fabricated counts. A request version ignores stale responses after rapid exam switching. Loading, retained placeholders, retry errors, and live availability summaries are explicit.

## Read-only Audit

`npm run db:audit:questions -- --environment staging|production`:

- requires an explicit environment;
- pins database name and ID against `config/deployments.json` and `wrangler.toml`;
- adds `--env staging` for staging;
- executes SELECT statements only;
- fails on missing/malformed Wrangler JSON rather than reporting missing data as zero;
- reports catalogue, integrity, duplicates, per-subject state, exam totals, and question types.

## Required Automated Evidence

- Exact 5 + 5 + 4 mapping and fail-closed drift rejection.
- Null-only exam backfill; non-null preservation.
- Collision-safe duplicate slug sequence.
- Exact-one, zero, and ambiguous topic mapping.
- 0/1/19/20 availability boundaries.
- Additive old-client API contract and non-inflated counts.
- Inactive/empty direct-route denial and limited-bank journey.
- Availability-before-premium UI.
- Mapper coercion, truthful placeholder/error/loading states, and stale-response suppression.
- Migration twice is idempotent.
- Forward then rollback restores every affected field exactly.
- `foreign_key_check` and `integrity_check` pass.

## Staging Gate

1. Export a staging D1 snapshot and verify pinned resource IDs.
2. Apply migrations 100 and 101 to staging only.
3. Run the read-only audit, route tests, UI smoke tests, integrity checks, and query plans.
4. Restore a snapshot copy, execute forward then rollback, and prove exact affected-row equivalence.
5. Reapply migration 100 to the restored staging copy and repeat the audit.
6. Obtain explicit production authorization.

Production release authorization was granted on 2026-08-23. The production sequence remains gated on merge, a fresh production backup, pinned-resource verification, and preflight evidence.

## Staging Evidence - 2026-08-23

- Pinned D1: `brilla-db-staging` / `1faeca41-2233-4a0b-a273-0d3aadba9c96`.
- Authenticated staging QA: 47/47 checks passed, including student/teacher registration boundaries, authentication, anonymous paper denial, answer-key redaction, paper membership isolation, resume-safe in-progress results, canonical answer persistence and grading, atomic free-tier usage, premium/free subject gates, guidance/Counselor authorization, study plans, uncached Workers AI, first-party browser smoke, and synthetic-record cleanup.
- Live read-only audit: 71 active subjects; 40 available, 4 limited, 27 unavailable; 4,545 questions; zero missing answers, explanations, exam types, or cross-subject topic links.
- Remaining editorial debt is explicitly non-blocking for integrity: 3,871 unmatched/null topic links, 118 short explanations, and 235 duplicate-text groups. These are not presented as curriculum-certified content.
- Saved staging pre/post snapshots replayed in memory with the final migration file: forward state matched staging, rerun was idempotent, rollback restored every affected subject/question field exactly, `integrity_check` returned `ok`, `foreign_key_check` returned zero rows, and the release ledger contained 2,647 entries.
- Automated verification: 133 test files and 707 tests passed; frontend/API TypeScript checks, zero-warning ESLint, production and staging builds, and bundle budgets passed.
- Final staging replay installed all six durable question relationship triggers, and migration 101 installed two daily-allowance ceiling triggers; exam/topic mismatches and foreign-key violations remained zero. Cloudflare remote `PRAGMA quick_check` returned provider `SQLITE_NOMEM`, so it is explicitly unavailable rather than recorded as a pass; the local snapshot replay still returned `integrity_check = ok`.
- Verified staging deployment: Worker `1f753322-00d4-4b1d-8a1b-42b6682231ce`; Pages `47ea4f02`; the stable `whiteboard-staging` alias resolves to the new Pages deployment. Staging email and Telegram non-secret variables were made explicit because Wrangler environments do not inherit top-level `vars`.
- Staging query-plan verification used idx_questions_subject, idx_topics_subject, and idx_subjects_active; the exact raw plan is preserved in the evidence artifact and the read-only D1 execution reported changed_db: false, zero rows written, and 0.4564 ms SQL duration.
## Production Sequence After Authorization

1. Confirm fresh production backup and exact source commit.
2. Re-run fail-closed preflight.
3. Apply migrations 100 and 101 in order.
4. Run audit/integrity checks.
5. Deploy Worker, then Pages.
6. Perform authenticated available/limited/unavailable student/admin QA.
7. Observe errors and usage under the release freeze.

## Rollback

Runtime rollback redeploys the prior verified Worker/Pages source. Data rollback executes `database/rollbacks/101_atomic_question_allowance.sql` and then `database/rollbacks/100_question_bank_integrity.sql`, restores ledgered question topic/exam and subject exam/category/code/slug/active fields in collision-safe order, then runs equality/FK/integrity/direct-route checks. The ledger remains; backup is disaster recovery, not the normal rollback mechanism.

## Later Content Releases

NSMQ core sciences/mathematics, BECE languages split by supported language, underfilled WASSCE subjects, and international boards ship separately. Each requires provenance, curriculum mapping, answer/explanation review, duplicate/type balance checks, and human academic sign-off. Twenty questions is an operational floor, not a quality claim.

## Not in Scope

Bulk AI publication, deleting populated IDs/questions, guessing topics, claiming curriculum completeness from counts, or redesigning the authoring CMS.

<!-- AUTONOMOUS DECISION LOG -->
## Decision Audit Trail

| Phase | Decision | Rationale |
|---|---|---|
| CEO | Integrity before content expansion; count separate from quality | Coverage is unreliable while relationships are wrong |
| Design | All active subjects use available/limited/unavailable states | Preserves discovery without dead ends |
| Design | Availability precedes premium | Payment cannot unlock missing content |
| Eng | Exact allowlist and pre-state guards | Prevents heuristic mutation |
| Eng | Topic candidate count must equal one | Ambiguity fails closed |
| Eng | Persistent ledger and executable rollback | Recovery must be provable |
| Eng | Live API replaces fabricated counts | One source of truth |

## GSTACK REVIEW REPORT

| Review | Result | Incorporated |
|---|---|---|
| CEO | CLEAR WITH CONDITIONS | Count/quality separation, demand preservation, immutable rollback |
| Design | MODIFY, ADDRESSED | Three states, non-link empty cards, limited warnings, availability-before-premium |
| Engineering | MODIFY, ADDRESSED | Exact allowlist, collision-safe duplicates, exact-one topic mapping, direct-route enforcement, rollback equality |
| Primary Codex | CLEAR | 707 tests, frontend/API typechecks, zero-warning lint, 47/47 authenticated staging checks, staging D1 audit/snapshot replay, production and staging builds, and bundle budgets passed |

**VERDICT:** Implementation and staging gates are complete. Proceed only through the authorized backup-first production sequence.

NO UNRESOLVED DECISIONS
