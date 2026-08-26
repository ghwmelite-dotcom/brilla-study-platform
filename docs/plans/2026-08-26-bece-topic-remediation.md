# BECE Topic Remediation Plan

## Objective

Assign BECE questions to valid, same-subject syllabus topics without changing question text, answers, explanations, subjects, exams, attempts, payments, users, or authentication data.

## Safety contract

- Work from `codex/bece-topic-remediation`, based on production `main`.
- Treat production as read-only until the pull request, migration preflight, rollback, and tests pass and production application is explicitly authorized.
- Never export the full production database. Use aggregate queries and scoped, non-personal BECE metadata only.
- Preserve every changed `topic_id` in `question_bank_remediation_log`.
- Fail closed if the expected BECE subjects, topic taxonomy, source question set, or current null-topic baseline has drifted.
- Never guess an ambiguous topic. Curate and record explicit overrides only when the question semantics are unambiguous; otherwise leave the row unmapped and report it.
- Require `PRAGMA foreign_key_check` and zero cross-subject topic links after migration and rollback.

## Execution batches

### Batch 1A: source-backed mappings

1. Recover the 2023/2024 two-digit BECE Mathematics, English, Integrated Science, and Social Studies mappings from archived source migrations.
2. Map the subject-specific supplemental IDs (`q_bece_alg_*`, `q_bece_num_*`, `q_bece_stat_*`, `q_bece_comp_*`, `q_bece_voc_*`, `q_bece_env_*`, `q_bece_tech_*`, `q_bece_civ_*`, `q_bece_econ_*`, `q_bece_geog_*`, `q_bece_gha_*`) from their explicit source prefixes.
3. Translate retired topic IDs to the current canonical BECE taxonomy.

### Batch 1B: deterministic subject rules

1. Classify remaining BECE questions using subject-specific, deterministic rules over stable IDs and question content.
2. Require exactly one matching topic; route zero-match and multi-match questions to an ambiguity report.
3. Convert accepted mappings into immutable migration values. Do not execute classifiers in production.

### Validation and release

1. Add migration-size, idempotence, drift-guard, forward-integrity, rollback-exactness, and ambiguity tests.
2. Run the migration against the canonical schema and seed plus all required post-seed migrations.
3. Compare expected counts with scoped production aggregates.
4. Run full unit tests, lint, API typecheck, and database verification.
5. Open a pull request with before/after counts and residual ambiguity.
6. Capture a D1 Time Travel bookmark and apply only after explicit production authorization.

## Acceptance criteria

- No question receives a topic owned by another subject.
- No existing non-null BECE topic is overwritten unless its old value is logged and explicitly included in the mapping.
- All source-backed rows map exactly.
- Deterministic rows have exactly one accepted mapping.
- Every changed row is reversible through the remediation ledger.
- Missing answers, missing explanations, exam mismatches, and exact-clone counts do not regress.
- Empty subjects remain honestly unavailable.
## Implemented release package

- `224_bece_topic_taxonomy.sql` adds three missing canonical topics: French general vocabulary, Scientific Inquiry and Technology, and Earth and Space Science.
- `225` through `236` contain immutable question-to-topic values in subject-bounded chunks of at most 100 rows.
- The reviewed manifest contains exactly 1,040 unique mappings and zero unresolved rows.
- Mapping evidence is retained per row as source range, question text, explanation, correct option, or curated manual override.
- Every question migration accepts only the exact all-null starting state or its own exact completed state; missing questions, different existing topics, cross-subject topics, and ledger drift fail closed.
- Reverse-order rollbacks restore all 1,040 question `topic_id` values to NULL and remove only the three topics introduced by migration 224. Remediation ledger rows remain as immutable audit history.

## Honest zero-coverage topics

The reviewed corpus contains no question that genuinely tests Mathematics Sets or Agriculture and Food Production. Both canonical topics remain available with zero questions rather than receiving unrelated content merely to inflate coverage. Content expansion for those topics is a separate authored-question release.

## Validation evidence

- Classifier: 1,040 mapped, 0 unresolved, 0 cross-subject mappings.
- Targeted migration suite: 18/18 passed.
- Full repository suite: 148 files and 934 tests passed.
- API typecheck: passed.
- ESLint for all changed executable/test files: passed.
- Database verifier: 25/25 checks passed.
- Production-target build and bundle budgets: passed.
- Every migration plus CRLF conversion and D1 ledger statement is below 19,500 bytes.
