# Mock Exams "Real Marking" — Design Spec (Project A)

**Date:** 2026-09-03
**Status:** Approved design (codebase-exploration verified; all sections reviewed by the product owner)
**Scope:** v1 — full theory marking, grades, and analytics for mock exams, on the existing paper engine

---

## 1. What we are building

Mock exams today are **real past papers with a broken promise**: the student sits a
full timed paper, submits, and only the objective section is scored. Every essay,
structured, and short-answer response is stored and then silently scored **0**
(`workers/api/index.ts:5309` — submit grades only `multiple_choice`/`true_false`).
A WASSCE Paper 2 is *entirely* theory, so the headline feature of the platform —
"take a real mock exam" — returns a meaningless result for exactly the papers that
matter most.

Project A makes mock marking real:

1. **Every theory answer is AI-marked at submit**, against the examiner-style
   marking schemes the schema already provides for, with per-marking-point scores
   and feedback persisted on the answer row.
2. **A real grade lands on the attempt** (`paper_attempts.grade` — column exists,
   never set), using `grade_boundaries` where populated and WAEC percentage bands
   as the deterministic fallback.
3. **Mock results feed the learning brain**: per-topic outcomes write into
   `topic_mastery` / `user_progress`, so Counselor Brie, the learning path, and
   exam readiness all reflect mock performance.
4. **The AI plumbing is unified on Workers AI.** The essay-grading pipeline is the
   last Anthropic holdout (`callClaudeAPI`, `ANTHROPIC_API_KEY`); it migrates to
   `env.AI.run` with per-task model routing, adding a dedicated marking model
   (`@cf/openai/gpt-oss-120b`).

### The core technical decision: extend the paper engine, no parallel mock system

Mock exams are not a separate product surface. They are hardcoded configs in
`src/pages/MockExams.tsx` mapping exam slugs to `past_papers` IDs, and
`/mock-exams/:paperId` renders the same `TakePaper` component as past papers
(`src/App.tsx:389-396`). Every capability in this spec — theory marking, grades,
analytics, time enforcement — is built **into the existing paper flow**
(`GET /papers/:id`, `POST /papers/:id/attempt`, `PUT /papers/attempts/:id/answer`,
`POST /papers/attempts/:id/submit`, `workers/api/index.ts:5274`). Past papers get
the same real marking for free; there is no mock-specific endpoint, table, or
grading path to keep in sync.

### Decisions locked

| Decision | Choice |
|---|---|
| Architecture | Extend the existing paper engine; mocks stay config-only |
| Marking transport | Workers AI (`env.AI.run`) via shared `callTextModel()`; Anthropic removed |
| Marking model | `@cf/openai/gpt-oss-120b` (128k ctx, reasoning), routed via new `getMarkingModel()` / `AI_MODEL_MARKING` |
| When marking runs | Synchronously fan-out at submit, bounded; failures retryable via `/remark` |
| Credits | One `ai_grading_credits` unit per theory answer, consumed atomically at submit; retries of failed markings are free |
| Grades | `grade_boundaries` where a matching row exists, else fixed WAEC percentage bands |
| Analytics | Reuse the existing mastery pipeline; mock answers write `topic_mastery` / `user_progress` at submit |
| Timer | Server-side enforcement at submit: reject `time_used > time_allowed + 5min` grace |

---

## 2. Goals / non-goals

### Goals

- Submitting a mixed or all-theory paper returns a real score, per-answer
  feedback, and a grade — not 0 for everything non-objective.
- One marking implementation shared by mock exams, past papers, and the existing
  standalone essay practice flow.
- Zero Anthropic dependency: one AI provider (Workers AI), one routing module,
  one secret story.
- Mock performance visibly moves the student's learning path and readiness.

### Non-goals (v1)

- **Multi-paper combined exam sessions** (e.g. Paper 1 + Paper 2 as one sitting
  with an aggregate grade). Papers are still taken individually.
- **A scheduled-exams tab** (school-style exam timetabling).
- **Offline papers** (download/print and later upload).
- **Paper 3 practicals** — no practical/Specimen content, no image-based marking.
- **Teacher manual marking of mocks** — the assessments module already has
  teacher marking; extending it to mocks is out of scope.
- **Re-marking of successfully graded answers** on student dispute — `/remark`
  only retries `pending`/`marking_failed` answers (see §5). A dispute flow is a
  future spec.

---

## 3. Current state (verified 2026-09-03)

- **Submit grading gap:** `POST /papers/attempts/:attemptId/submit`
  (`index.ts:5274`) loops answers and `continue`s on anything not
  `multiple_choice`/`true_false` (`index.ts:5309`). Theory answers persist with
  `marks_earned = 0` and `is_correct = NULL` on `paper_attempt_answers`
  (`schema.sql:4271`).
- **Timer is client-side only** (`TakePaper.tsx:242-269`); submit's only bound is
  a 24h sanity check (`index.ts:5281`). `paper_attempts.time_allowed` is set at
  attempt creation (`index.ts:5165-5169`) and never enforced.
- **Essay AI grading exists but is Anthropic-only:** `POST /essays/submit`
  (`index.ts:5421`) consumes one credit against
  `subscription_tiers.ai_grading_quota` + `users.ai_grading_credits`
  (`index.ts:5435-5479`); `POST /essays/:attemptId/grade` (`index.ts:5498`) has a
  proper IDOR guard and atomic `pending → grading` claim, prompts as a WAEC
  examiner with `UNTRUSTED_AI_DATA_INSTRUCTION` fencing, and normalizes output via
  `workers/api/ai-safety.ts` — but calls `callClaudeAPI` (`index.ts:832`,
  `index.ts:5571`). Explanation endpoints at `index.ts:5643` and `index.ts:5711`
  and `workers/api/counselor.ts:166` / `:950` share the same Anthropic path.
- **The schema is ahead of the code:** `essay_questions`
  (`schema.sql:4217-4235`: `marking_scheme`, `marking_rubric`, `model_answer`,
  `required_points`/`optional_points`, sample answers) and
  `structured_question_parts` (`schema.sql:4291`) exist but hold no content.
  `essay_attempts.paper_attempt_id` (`schema.sql:4242`) exists and is never
  populated. `questions.question_type` already allows
  `essay`/`structured`/`practical`/`calculation` etc. (`schema.sql:3903`), and
  `section`/`question_number`/`is_compulsory`/`marks` columns are in place.
- **Grades and analytics are wired for nothing:** `grade_boundaries`
  (`schema.sql:3462`) is unused; `paper_attempts.status` CHECK allows
  `'in_progress'|'submitted'|'graded'|'abandoned'` (`schema.sql:3715`) but no
  code sets `graded`; `paper_attempts.grade` is never written. `topic_mastery`
  (`schema.sql:2999`), `user_progress`, `exam_readiness`, and the
  `workers/api/learningpath.ts` weak-topic engine exist, but
  `paper_attempt_answers` never feed them.
- **Known breakage folded into this project:** the IGCSE and Cambridge A-Level
  entries in `mockExamConfigs` reference paper IDs that do not exist in the DB
  (the paper page 404s); `EssayPractice.tsx:89` calls `/essays/attempts?limit=20`,
  which does not exist — the real route is `/api/essays/history`
  (`index.ts:3827`).
- **Content pipeline:** `content/batches/*.json` validated by
  `scripts/validate-question-batch.mjs` against
  `content/schemas/question-batch.schema.json`; provenance labeling ("not
  official WAEC examination material") is enforced convention via
  `question_content_releases` (`schema.sql:3931`).
- **Model routing convention:** `workers/api/ai-models.ts` resolves per-task
  models from env (`getChatModel`/`getGenerationModel`/…, `ai-models.ts:22-47`)
  with `unwrapAiText` (`ai-models.ts:61`) handling Workers AI's parsed-JSON
  response shape. Model IDs are never hardcoded at call sites.

---

## 4. Workers AI migration (land first, behavior-neutral)

This is a transport swap, deployed and verified **before** the marking feature so
the feature never touches Anthropic code.

- **Shared helper** in `ai-models.ts`:
  `callTextModel(env, { model, system, user, maxTokens?, temperature? })` →
  `unwrapAiText(await env.AI.run(model, { messages: [...] }))`. All converted
  call sites go through it; none parse `env.AI.run` results raw (the
  parsed-JSON-response trap documented at `ai-models.ts:55-60`).
- **New routing accessor:** `getMarkingModel(env)` →
  `env.AI_MODEL_MARKING || '@cf/openai/gpt-oss-120b'`. Deliberately does **not**
  fall back to `AI_MODEL` (same reasoning as `getVisionModel`, `ai-models.ts:38-42`):
  marking wants a reasoning-class model, and the generic var may hold a small
  chat model. `AI_MODEL_MARKING` added to the `ModelEnv` interface and
  `.dev.vars.example`.
- **Call-site conversions:**
  - `POST /essays/:attemptId/grade` (`index.ts:5498-5600`) → `callTextModel`
    with `getMarkingModel` (routing upgrade: was `getGenerationModel`).
  - Explanation endpoints (`index.ts:5643`, `index.ts:5711`) → `callTextModel`
    with `getGenerationModel` (routing unchanged).
  - `counselor.ts:166` (chat) → `getChatModel`; `counselor.ts:950` (reports) →
    `getGenerationModel`.
- **`callClaudeAPI` deleted** (`index.ts:832`); `ANTHROPIC_API_KEY` removed from
  both Env interfaces (`index.ts:83`, `counselor.ts:22`) and from
  `.dev.vars.example:11`. The 503 "temporarily unavailable" branch on a missing
  key (`index.ts:5524-5526`) goes away — Workers AI is a binding, always present.
- Prompts, `ai-safety.ts` fencing, credit logic, and the atomic claim are
  untouched. Output normalization already handles the models' variance
  (`normalizeAiScore` clamps to `[0, maxScore]`; `normalizeAiGradingFeedback`
  coerces the feedback shape, `ai-safety.ts:20-38`).

**Rollout note:** after this deploy is verified live, the `ANTHROPIC_API_KEY`
wrangler secret is deleted from both environments.

---

## 5. Theory marking at submit

### 5.1 `gradeTheoryAnswer()` — one shared marker

A new function (in `workers/api/index.ts`, beside the submit handler; extracted
to a module only if a second caller materializes) marks a single theory answer:

- **Inputs:** the question row (`question_type`, `question_text`, `marks`,
  `subject`), the student's `user_answer`, and — when present — the
  `essay_questions` row (marking scheme/rubric/required+optional points) or the
  question's `structured_question_parts` (per-part `correct_answer` + `marks`).
- **Prompt:** the existing WAEC-examiner system prompt shape from the essay
  grader, with every content field — marking scheme, model answer, and the
  student answer — wrapped via `formatUntrustedAiData` under
  `UNTRUSTED_AI_DATA_INSTRUCTION`. The marking scheme is content data, never
  instructions. Prompt variants per question type: `essay` (scheme + rubric),
  `structured` (per-part marking points, scores returned per part),
  `short_answer`/`calculation` (expected answer + acceptable alternatives).
- **Output contract:** strict JSON
  `{ score, maxScore, perPoint: [{point, awarded, maxMarks, comment}], feedback, strengths, improvements }`,
  parsed with JSON-extraction-from-text fallback, then
  `normalizeAiScore`/`normalizeAiGradingFeedback`. Unparseable output = marking
  failure, not a guessed score.
- **Model:** `getMarkingModel(env)` via `callTextModel`.

### 5.2 Schema migration `361_mock_real_marking.sql`

(next number after `360_role_neutral_marketing_consent.sql`; rollback
`database/rollbacks/361_mock_real_marking_rollback.sql` per repo convention)

- `ALTER TABLE paper_attempt_answers ADD COLUMN ai_score REAL` — marks awarded by
  the marker (objective answers keep using `marks_earned`; on theory answers the
  two are reconciled so `marks_earned = ai_score`, keeping one total-score read
  path).
- `ADD COLUMN ai_feedback TEXT` — the normalized feedback JSON.
- `ADD COLUMN marking_status TEXT DEFAULT NULL CHECK (marking_status IN
  ('pending','graded','marking_failed'))` — NULL for objective questions;
  lifecycle `pending → graded | marking_failed`.
- Relax `paper_attempts.status` CHECK to add `'partially_graded'` (D1/SQLite:
  table rebuild per the pattern used by earlier CHECK-relaxing migrations).

### 5.3 Submit flow (extended, same endpoint)

`POST /papers/attempts/:attemptId/submit` gains, in order:

1. **Time enforcement.** Reject with 400 `time_limit_exceeded` when
   `time_used > time_allowed + 300` (5-minute grace for submission latency). The
   attempt stays `in_progress` so a legitimate resubmit inside the bound still
   lands; TakePaper already auto-submits at 0:00, so honest users never see this.
2. **Objective grading** — exactly as today.
3. **Credit check.** Count theory answers with content; require
   `ai_grading_quota > 0` (tier-gated, as essays are). Atomically deduct
   `min(theoryCount, ai_grading_credits)` in one
   `UPDATE users SET ai_grading_credits = ai_grading_credits - ? WHERE id = ? AND
   ai_grading_credits >= ?` and verify `changes === 1`. If credits cover only
   part, mark as many as paid for in question order; the rest stay `pending`
   (never silently dropped, never marked for free).
4. **Theory fan-out.** Mark all paid theory answers in parallel with
   `Promise.allSettled` (concurrency capped at 4 to stay inside Worker subrequest
   and CPU budgets; longest WASSCE Paper 2 theory load is ~8 answers). Each
   answer's row is updated to `graded` (score + feedback) or `marking_failed`.
   The whole fan-out is bounded: per-call timeout, and the submit response does
   not wait forever — answers still in flight at the response deadline are left
   `pending` and finished via `c.executionCtx.waitUntil`.
5. **Totals + grade** (§6) computed from objective `marks_earned` + theory
   `ai_score` for `graded` answers.
6. **Attempt status:** `graded` when every theory answer is `graded`;
   `partially_graded` when any are `pending`/`marking_failed`. The submit
   response carries `markingStatus` so the frontend can show "3 of 5 essays
   marked — retry the rest" honestly instead of a fake complete result.

### 5.4 Retry: `POST /papers/attempts/:attemptId/remark`

- Owner-or-admin guard (same IDOR pattern as the essay grader), attempt must be
  `graded`/`partially_graded`.
- Re-marks answers in `marking_failed` **free** (already paid at submit);
  re-marks `pending` answers only after consuming credits for them (same atomic
  deduction). Never touches `graded` answers.
- On completion, recomputes totals/grade and flips the attempt to `graded` when
  nothing remains unmarked. Idempotent: a concurrent double-call finds no
  `marking_failed`/`pending` rows and returns the current state.

### 5.5 Adopting the existing essay pipeline

The standalone essay flow keeps its endpoints and credit semantics, with two
convergences: its grading body is replaced by `gradeTheoryAnswer()` (one marker,
two entry points), and when an essay is answered inside a paper attempt the
marker also upserts an `essay_attempts` row with `paper_attempt_id` populated —
finally using the column added at `schema.sql:4242`, and giving EssayPractice's
history view mock-sit essays.

---

## 6. Grades & analytics

- **Grade at submit.** After totals: look up `grade_boundaries` by the paper's
  specification/session/year where such a row exists; otherwise apply the fixed
  WAEC percentage bands (A1 ≥ 75, B2 ≥ 70, B3 ≥ 65, C4 ≥ 60, C5 ≥ 55, C6 ≥ 50,
  D7 ≥ 45, E8 ≥ 40, F9 < 40). Result written to `paper_attempts.grade`. For
  `partially_graded` attempts the grade is computed on marked answers and
  recomputed by `/remark`.
- **Topic analytics.** Each graded answer (objective at submit, theory as it
  grades) writes its per-topic outcome through the same mastery-update path the
  practice flow uses — upserting `topic_mastery` and `user_progress` — so
  `learningpath.ts` weak-topic ordering, Counselor Brie's readiness, and
  `exam_readiness` reflect mocks with no consumer changes. Writes are batched
  with the grading updates; an analytics write failure never fails the submit
  (logged, marking result stands).
- **Frontend surfaces (minimal):** TakePaper's results view already renders
  score/percentage; it gains per-answer `ai_feedback` display for theory
  questions, the `grade` badge, and the `partially_graded` retry affordance.
  `MockExams.tsx` is unchanged except §7's config fix.

---

## 7. Fixes folded in

1. **Broken mock configs.** Remove the `igcse` and `cambridge-a-level` entries
   from `mockExamConfigs` in `MockExams.tsx` (they reference nonexistent paper
   IDs and 404 today); re-add later only with real papers. Add
   `scripts/verify-mock-configs.cjs` — reads the configs, asserts every
   `paperId` exists in the DB — wired into the existing preflight flow so a
   stale config fails loudly instead of 404ing a student.
2. **EssayPractice history route.** `EssayPractice.tsx:89` →
   `GET /essays/history`, mapping that route's actual response shape
   (`index.ts:3827`) instead of the nonexistent `/essays/attempts?limit=20`.
3. **Server-side time enforcement** at submit (§5.3.1) — the client timer stays
   as UX, the server becomes the authority.

---

## 8. Content plan

Real marking needs real marking schemes; the tables are empty today.

- **WASSCE core-subject Paper 2 theory batches** (English, Mathematics, Integrated
  Science, Social Studies first) authored as `content/batches/*.json` and run
  through the standard pipeline: `scripts/validate-question-batch.mjs` against
  `content/schemas/question-batch.schema.json`, provenance label "not official
  WAEC examination material", release tracked in `question_content_releases`.
- **Population migrations** (numbered after 361, e.g.
  `362_wassce_paper2_essay_schemes_part_1.sql`, …) insert `essay_questions` rows
  (marking scheme, required/optional points, model answer, sample answers) and
  `structured_question_parts` rows for the new theory questions, each with a
  paired rollback in `database/rollbacks/` per repo convention.
- Content is staged to the staging D1 first (existing wrangler-staging pattern)
  and marking is smoke-tested against it before prod population.
- A theory question **without** a scheme still gets marked — the prompt falls
  back to the question text + marks with generic WAEC criteria — but the batch
  acceptance bar is that every shipped Paper 2 question carries a scheme.

---

## 9. Error handling principles

- Marking failures degrade honestly: an answer is `marking_failed` with a retry
  path, never a fabricated score. Unparseable model output is a failure, not a 0.
- No money-for-nothing: credits are deducted only for answers actually sent to
  the marker; failed markings retry free.
- Submit never fails because marking did: objective results, totals on what
  graded, and `partially_graded` are always returnable.
- All AI input (student answer, scheme, model answer) is untrusted data via
  `ai-safety.ts`; all AI output is normalized and clamped before it touches the
  DB.
- AI feedback is advisory UX labeled as AI marking, never presented as official
  WAEC results (same convention as the whiteboard verdicts).

## 10. Data flow (submit, mixed paper)

```
TakePaper auto-submit → POST /papers/attempts/:id/submit { timeUsed }
  ├─ 400 if time_used > time_allowed + 300
  ├─ grade objective answers (sync, as today)
  ├─ count theory answers → atomic credit deduction
  ├─ fan out gradeTheoryAnswer × N (cap 4, per-call timeout)
  │    ├─ ok  → paper_attempt_answers: marking_status=graded, ai_score, ai_feedback
  │    └─ err → marking_status=marking_failed   (stragglers: pending + waitUntil)
  ├─ totals + grade (grade_boundaries → WAEC band fallback) → paper_attempts
  ├─ per-topic writes → topic_mastery / user_progress (best-effort)
  └─ status = graded | partially_graded → response incl. markingStatus
POST /papers/attempts/:id/remark  → retries marking_failed (free) / pending (credits)
```

## 11. Testing & rollout

- **Migration tests:** apply 361 + content migrations and their rollbacks on a
  scratch D1 (`wrangler d1 migrations apply --local`); assert new columns, the
  relaxed status CHECK accepts/rejects the right values, and rollback restores
  the prior shape.
- **Unit (vitest, established patterns):** JSON extraction + normalization of
  marker output (clean JSON, fenced JSON, prose-wrapped, garbage → failure;
  `normalizeAiScore` clamping), WAEC band fallback math incl. boundaries,
  credit-count and partial-coverage selection logic, time-limit check
  (boundary at exactly +300s).
- **Integration (mocked D1 + AI binding):** mixed-paper submit end-to-end
  (objective + essay + structured → totals, grade, statuses); credit
  insufficiency → partial marking + `partially_graded`; `/remark` free-retry of
  failed answers and credit-gated retry of pending ones, idempotent double-call;
  analytics writes land in `topic_mastery`; over-time submit → 400 and attempt
  stays resubmittable.
- **Live probe:** `scripts/verify-mock-marking.cjs` (probe style of
  `verify-guidance.cjs`) — seed a theory paper on staging, run submit →
  `graded`, force a marking failure → `partially_graded` → `/remark` → `graded`;
  plus `verify-mock-configs.cjs` in preflight.
- **Rollout order:** (1) Workers AI migration deploy — behavior-neutral, verify
  essay grading/explanations/counselor live, then delete the Anthropic secret;
  (2) migration 361 + marking deploy (additive columns, no flag needed — papers
  without theory content are objectively graded exactly as today); (3) content
  batches staged → smoke-marked → prod; (4) frontend deploy (config fix,
  EssayPractice fix, results view). Each step is independently revertible.

---

## 12. Reusable assets inventory (from codebase exploration, 2026-09-03)

- Existing essay-grading guardrails to adopt verbatim: IDOR owner-or-admin
  check, atomic `pending → grading` claim, credit deduction shape
  (`index.ts:5421-5560`).
- `ai-safety.ts`: `UNTRUSTED_AI_DATA_INSTRUCTION`, `formatUntrustedAiData`,
  `normalizeAiScore`, `normalizeAiGradingFeedback`.
- `ai-models.ts` routing + `unwrapAiText`; the `getVisionModel` no-generic-fallback
  precedent for `getMarkingModel`.
- Schema already provisioned: `essay_questions`, `structured_question_parts`,
  `essay_attempts.paper_attempt_id`, `grade_boundaries`, `paper_attempts.grade`,
  `time_allowed` set at attempt creation.
- Mastery pipeline: `topic_mastery`, `user_progress`, `exam_readiness`,
  `learningpath.ts` weak-topic engine.
- Content pipeline: batch schema + validator, `question_content_releases`
  provenance convention, staging-first DB pattern.
- `paper_attempts.status` already includes `'graded'` — the state machine has a
  home for this feature's output.
