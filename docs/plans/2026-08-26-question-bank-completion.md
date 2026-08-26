# BrillaPrep Question Bank Completion Plan

**Date:** 2026-08-26  
**Branch:** `codex/question-bank-completion`  
**Production baseline:** migrations through `236`; PR #45 merged  
**Objective:** complete the remaining curriculum coverage safely, repair the full practice-session journey, prove subject isolation and answer confidentiality, and release through staged, reversible gates.

## Verified baseline

- BECE has 1,040 live questions, all topic-linked, with zero cross-subject links and zero foreign-key violations.
- Five topics in populated BECE subjects have no questions: BDT Construction and Structures, BDT Electrical and Electronic Systems, BDT Entrepreneurship, Mathematics Sets, and Science Agriculture and Food Production.
- The generic BECE Ghanaian Language subject has no questions and seven generic topics. It must not receive mixed-language content; it will be replaced by language-specific banks after an explicit language pilot decision.
- Non-BECE has 2,452 live null-topic questions across 31 active subjects: WASSCE 1,622; NSMQ 375; Cambridge IGCSE 225; Cambridge A-Level 230.
- The practice UI and API disagree on the session-save payload shape. The UI can show results even when persistence fails, so this defect is a release blocker.
- Automated-beta content is already topic-linked and is excluded from null-topic remediation. Archived duplicate rows are excluded. Normalized-text collisions are review signals and must not be used as deletion keys.

## Release strategy

This is five bounded releases, not one large production migration.

### Release 1 — Practice-session correctness

1. Align the frontend session payload with the Worker contract, including `topicId`.
2. Require a successful `/practice/sessions` response before navigating to results.
3. Preserve the student’s completed work and present a retryable error if persistence fails.
4. Extend component tests through answer, Next, Finish, confirmation, persistence, and results navigation.
5. Add a non-BECE before/apply/rollback preservation snapshot to the BECE migration suite.

**Gate:** unit tests, API typecheck, database verification, lint, and production build all pass. No content migration is allowed before this gate passes.

### Release 2 — Five empty BECE topic gaps

Create 120 original, curriculum-aligned multiple-choice questions:

- BDT: 40 total — Construction 14, Electrical Systems 13, Entrepreneurship 13.
- Mathematics: Sets 40.
- Science: Agriculture and Food Production 40.

Requirements:

- Official NaCCA documents are curriculum blueprints only; questions, options, explanations, and rationales must be newly authored.
- Every question must have four unique options, one unambiguous answer, an explanation of at least 80 characters, option rationales, provenance, and an exact subject/topic binding.
- Generate immutable 10-row migrations, reverse rollbacks, a remediation ledger, drift/idempotence/same-subject guards, an aggregate preflight, and migration tests.
- Run cross-bank normalized-duplicate review and preserve legitimate subject-specific collisions.

**Tentative migration allocation:** `237–248`, subject-bounded and confirmed again immediately before generation.

**Gate:** 120/120 rows valid; all five topics become available; zero new null topics, cross-subject links, answer leaks, duplicate IDs, or foreign-key violations.

### Release 3 — Deterministic non-BECE topic remediation

Remediate existing questions without rewriting question content:

1. WASSCE Elective Mathematics first, beginning with the 40 ledger-backed rows.
2. NSMQ by subject and round.
3. Cambridge IGCSE by subject, only after reviewed syllabus-to-topic mappings exist.
4. Cambridge A-Level by subject.
5. Remaining WASSCE subjects using immutable source-range mappings from seed and past-paper provenance.

Rules:

- Update topic IDs only where subject identity and source evidence agree.
- Reject non-null drift and any cross-subject mapping.
- Never infer mappings from normalized question text alone.
- Never delete collision rows as part of topic remediation.
- Split statements below the D1 size threshold and supply rollbacks, manifests, ledger entries, preflights, and before/apply/rollback snapshots.

**Tentative migration allocation:** starts at `249` after Release 2; final numbers are allocated serially to prevent branch collisions.

**Gate per exam family:** exact expected mapping count, zero unresolved rows in the released scope, zero cross-subject links, zero unexpected changes outside the scope, idempotence, rollback fidelity, and zero foreign-key violations.

### Release 4 — Ghanaian Language pilot

Do not populate `subj_bece_gh_lang`. Instead:

1. Select one supported Ghanaian language for the pilot using its official NaCCA blueprint and a competent language reviewer.
2. Create a language-specific subject and taxonomy.
3. Author and review a minimum 40-question pilot bank with orthography, tone, dialect, and cultural checks.
4. Update the coverage matrix and catalogue so learners see only their selected language.
5. Repeat the approved pipeline for the remaining languages.

**Gate:** named-language reviewer acceptance, zero mixed-language routing, accessibility and mobile catalogue QA, and rollback verification.

### Release 5 — End-to-end QA and observation

1. Add a synthetic staging journey: catalogue → topic → Practice Drill → answer → Next → Finish → session persistence.
2. Cover all eight populated BECE subjects using topics with at least two questions, plus the five newly populated gaps.
3. Verify initial question responses never expose answers, explanations, or correctness flags.
4. Query the staging database to prove persisted user, subject, topic, score, counts, and timing match the browser run.
5. Clean every synthetic record and require zero residuals.
6. Run one human-assisted headed-Chrome production canary.
7. Start a 24-hour GET-only production observation after deployment; use persisted Worker Logs as the authoritative error source.

**Observation thresholds:** any unauthorized data exposure, answer leak, cross-subject link, migration/version drift, payment/security anomaly, or HTTP 5xx is an immediate stop; two consecutive failures stop the release; availability must be at least 99.5%; p95 must remain at or below 1.5 seconds and maximum at or below 5 seconds.

## Parallel ownership

- **Practice/QA worker:** `src/pages/ExamModePractice.tsx`, its tests, migration preservation tests, and staging journey additions. No content migrations.
- **BECE content worker:** new BECE gap data/generator modules, three batch manifests, migrations/rollbacks/preflight, and BECE gap migration tests. Reuse the shared content library without changing it.
- **Non-BECE remediation worker:** mapping audit/generator/manifest artifacts and the first WASSCE Elective Mathematics slice after confirming migration numbers. No question rewriting or deletion.
- **Root integrator:** plan, migration-number allocation, conflict resolution, full verification, security checks, PR/CI, deployment authorization gates, live QA, and observation closure.

All workers share the repository, must preserve unrelated edits and untracked user directories, and must not revert another worker’s changes.

## Required verification commands

```powershell
npx.cmd vitest run workers/api/__tests__/bece-topic-remediation-migrations.test.ts src/pages/SubjectCatalog.test.tsx src/pages/Topics.test.tsx src/pages/ExamModePractice.test.tsx workers/api/__tests__/subject-catalog.test.ts workers/api/__tests__/attempt-progress.test.ts workers/api/__tests__/user-progress.test.ts
npm.cmd run db:verify
npm.cmd run typecheck:api
npm.cmd run lint -- --quiet
npm.cmd run build
```

Staging and production QA run only after the credential-free gate passes. Production migrations and deployment require a fresh explicit authorization naming the exact migration range.

## Security side gate

The previously exposed Telegram bot token must be revoked through BotFather and replaced through the interactive Cloudflare secret prompt. The token must never be pasted into chat, files, command history, logs, or a command argument. Verify only the secret binding name and bot behavior, never the secret value.

## Definition of done

- The practice journey cannot report success unless the session is persisted correctly.
- All five non-language BECE gaps contain validated original content.
- The selected Ghanaian Language pilot is language-specific and reviewed; the generic mixed-language bank remains unavailable.
- All 2,452 non-BECE null-topic rows are either deterministically mapped or recorded in a reviewed exception ledger with a precise reason; no guessed mapping is accepted.
- All automated gates, synthetic staging journeys, human-assisted production canary, database invariants, and the 24-hour observation pass.
- Deployment evidence records the merge commit, exact migration range, Worker/Pages versions, and read-only post-release metrics.
