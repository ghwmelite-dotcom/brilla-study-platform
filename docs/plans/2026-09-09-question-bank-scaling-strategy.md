# Question Bank Scaling Strategy — Efficient Mass Expansion

**Date:** 2026-09-09 · **Status:** For decision · **Source:** owner request after the 2026-09-08 content batches (NSMQ +48q, flashcards +120 cards) proved the parallel-authoring pattern.

## Where we are

- Prod bank: ~5,600 questions, 67 subjects with questions (41 WASSCE, 8 BECE, 9 IGCSE, 5 A-Level, 4 NSMQ).
- Pipeline (proven, no new infra needed): generator script with inline authored content + provenance → `content/batches/*.json` + numbered idempotent migrations → validator + parity test + fresh-bootstrap gate → staging apply → owner approval → prod apply.
- Governance (hard rules): original content only, official exams as blueprints, `official_exam_board_content = 0`, beta channel first.
- 2026-09-08 evidence: three content streams ran in parallel with strict migration-range allocation (380–386, 387–401) and all gates green. This is the template.

## The efficiency levers (in priority order)

### 1. Syllabus-driven quota generation (build once, use forever)
Today each batch hand-picks topics. Instead, generate the work plan FROM the database:
`syllabus_topics`/`subject_specifications` + current per-topic question counts → a coverage-gap report that outputs exactly which (subject, topic, difficulty, question_type) cells are under-filled. A new `scripts/content-coverage-report.mjs` (~100 lines) turns "what should we write?" into a checklist. The coverage matrix (`content/subject-coverage-matrix.json`) already tracks the intent — wire it to live counts.

### 2. Parallel swarm authoring (proven today)
One agent per (subject × batch) with pre-allocated migration ranges. Throughput measured today: ~50–120 validated items per agent pass. With 5–6 parallel agents: **~400–600 questions/day**, gates included. Strict rules that made it work: migration ranges reserved up front, no two agents on the same file, parent integrates + applies.

### 3. Systematic difficulty/type matrix per topic
Per topic, author to a fixed matrix instead of ad-hoc: e.g. 4 easy MCQ + 4 medium MCQ + 2 hard MCQ + 2 calculation/short-answer + 1 structured. Generators already enforce shapes and difficulty vocab; a matrix makes batches interchangeable and review predictable, and it feeds the adaptive engine (shipped 2026-09-08) which needs depth per topic to actually adapt.

### 4. Automated answer verification (kill the human bottleneck safely)
Human academic review doesn't scale to thousands of questions. Two-machine check instead:
- **Self-consistency solve**: a second, independent pass solves each question without seeing the key; mismatches get flagged for human review. Catches wrong keys, the #1 trust risk.
- Keep the existing mechanical validators (duplicates, caps, provenance) + beta channel + in-app feedback (`feedbackEnabled`) as the long tail.
- Humans then review a 10% sample + flagged mismatches only.

### 5. Near-duplicate detection at scale
Current guard is exact/normalized-prompt match. As the bank grows past ~10k, add similarity-based detection (embedding or token-overlap) so paraphrased duplicates don't accumulate. Net-new but small; defer until the bank actually approaches that size.

### 6. Author where students struggle
`topic_mastery` + `question_attempts` now show live weakness distribution. Feed the bottom-20 topics by accuracy into the coverage report (lever 1) so new content lands where it changes outcomes, not where it's easy to write.

## Proposed operating rhythm ("content sprint")

1. Run coverage report → pick 5–6 subjects/rounds with the biggest gaps.
2. Allocate migration ranges; dispatch one authoring agent per subject with the matrix quotas.
3. Gates per batch (validator, parity, fresh-bootstrap) → staging apply.
4. Self-consistency solve pass; flagged items fixed or dropped.
5. Owner approval → prod apply; landing/comms copy updated only for what shipped (honesty rule from Tier 0).

## What this unlocks, mapped to open plans

- Past papers 2015–2022 (~9,600 questions full ask): Phases 1–3 of `2026-09-08-past-papers-2015-2022-plan.md` become 2–3 content sprints each once the `generate-past-paper-bank.mjs` variant exists.
- NSMQ to 200+: one more sprint (batch 2) using today's generator as-is.
- Flashcards to ~500: two more sprints (remaining 15 NSMQ shells + BECE decks).
- BECE depth (8 subjects, currently thin): sprint candidate with the highest exam-year urgency.

## Risks

- **Accuracy at scale** is the existential risk — mitigated by lever 4 + beta channel + honest labeling. Never let throughput pressure waive the governance rules.
- **Migration range collisions** under parallelism — the 2026-09-08 collision (flashcards vs NSMQ) was caught by re-verifying `database/migrations/` before generation; keep that step mandatory.
- **Prod topic-id drift** (the NSMQ canonical-id fix) — generators must resolve topic bindings against prod-canonical ids; the `nsmq-topic-identity-resolver.cjs` pattern should be generalized per exam type before WASSCE-scale batches.
