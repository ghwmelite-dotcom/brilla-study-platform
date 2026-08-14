# Counselor Brie — Design Spec

**Date:** 2026-08-14
**Status:** Approved design (all sections reviewed and approved by the product owner during brainstorming)
**Scope:** v1 — assessment → level → personalized learning plan, for all users

---

## 1. What we are building

**Counselor Brie** is the platform's personal academic counselor: a warm, personified
guide who, within a few seconds to ~2 minutes, understands a student's current level and
recommends the right learning plan to reach their target.

Brie is a **persona**, not a feature label. Her voice runs through the whole experience —
the welcome, the quiz encouragement, the plan reveal, and the weekly check-ins — so
students feel accompanied, not processed. ("We need the warmth in there for users to
freely unburden to her." — product owner)

### The two entry points (one counselor, two doors)

1. **First-run (onboarding moment).** Every new signup — and any existing user who adds
   a new exam type with no attempt history — meets Brie before the dashboard. She
   captures the goal, runs the level check, and reveals the plan. This replaces the
   current passive feature-tour `OnboardingModal` as the primary first-run experience
   (the tour becomes secondary, skippable content).
2. **Permanent home ("Counselor Brie" / `MyPlan`).** The same experience lives at a
   dedicated route. Returning users with attempt history skip the quiz entirely —
   readiness computes from existing mastery data in seconds. Re-assessment is always
   one tap away.

### Decisions locked during brainstorming

| Decision | Choice |
|---|---|
| Entry points | Both — onboarding moment + permanent home (one component, two entry points) |
| Assessment | Hybrid: ~20s goal intake + adaptive mini-quiz from the real question bank + AI narrative |
| Plan output | Goal-driven roadmap (ordered topic path) + "this week" slice — no per-day schedule |
| Gating | Counselor is free for all users (top-of-funnel); premium stays on AI follow-through |
| Architecture | Adopt-and-finish: complete the orphaned `/api/learning` layer, feed the existing mastery pipeline |
| Name | **Counselor Brie** (warm, personified, female persona) |

---

## 2. Why this shape (rationale)

- **The platform currently asks nothing about goals at onboarding** — WASSCE/BECE students
  have `target_year` only; target grade and exam date are uncomputable. Brie's intake
  fixes the data gap that makes "plan to achieve their goal" possible at all.
- **No diagnostic exists today.** The closest thing to "current level" is derived mastery
  from `question_attempts`. Brie's quiz creates that signal for new users and feeds the
  same pipeline, so assessment answers are never thrown away.
- **`/api/learning/*` is orphaned** — backend endpoints and tables (`study_plans`,
  `exam_readiness`) exist with no live frontend consumer; `learningPathStore.ts`
  computes locally. Brie finishes this layer instead of building a parallel one.
- **Free counselor as funnel.** `study_plans` is currently Premium-tier. Making Brie
  free for all users turns the counselor into the upgrade engine: free users see the
  full plan and hit premium features exactly where the plan recommends them
  (whiteboard teaching, check-my-work), in context.
- **Name collision handled:** the existing `/counselor` AI chat (academic/career/
  wellbeing personas) stays untouched. Brie is the academic-path counselor. A future
  merge (Brie becoming the chat's persona) is a deliberate non-goal for v1.

---

## 3. Experience flow

### 3.1 First-run wizard (`CounselorBrieWizard`)

1. **Welcome & goal intake (~20s).** "Let's find your starting point — no wrong answers
   here." Student picks: exam (pre-filled from signup exam preference), target grade
   (A1–F9 for WASSCE; BECE grade scale; O/A-level reuses its existing target-grade
   flow), and exam date (month/year picker, defaulting to `target_year`).
2. **The level check (~60–90s).** 8–10 adaptive questions, one per screen, gentle
   progress ring ("Question 4 of ~9"), no hard timer. Real past-exam questions from the
   tagged bank. Brie encourages between questions in-character.
3. **The reveal.** Readiness score animates in; strengths/gaps map onto topics; Brie
   writes a 2–3 sentence personal narrative ("You're strongest in… your fastest route
   to A1 runs through…"). One tap — "Start my route" — lands in the first recommended
   lesson. Cold-start honesty: with 8–10 questions the estimate is coarse, and Brie
   says so ("here's my first read — it'll sharpen as we work together").

### 3.2 Permanent home (`/my-plan`)

- **Goal card:** target grade + exam-date countdown.
- **Readiness gauge:** 0–100, per subject.
- **Roadmap:** vertical node path — topic → mastery % → priority badge → deep-link into
  revision classroom or practice. Ordered weakest-first, prerequisite-aware.
- **This week:** the roadmap's front edge (top 2–3 nodes). Not a separate schedule.
- **Retake level check:** always available.

### 3.3 Deliberate omissions (v1 non-goals)

- No per-day schedule (guilt-trip avoidance; the route is the product).
- No IRT-grade psychometrics, no AI-generated quiz questions (bank only).
- No merging of the two counselors; no teacher-authored diagnostics.
- No per-question hard timer (a 2-minute soft cap flags suspicious runs, never blocks).

---

## 4. Adaptive engine & level model

### 4.1 Quiz mechanics

- Server-side session: `POST /api/guidance/assessment/start` creates a
  `guidance_sessions` row and returns the first question.
- Sampling: 8–10 questions spread across the subject's **core topics** (every topic
  gets signal), drawn from `questions` filtered by `subject_id` + `topic_id` +
  `difficulty`. Must tolerate the ~600 untagged questions (subject-level fallback).
- **CAT-lite stepping:** first question `medium`; correct → step up, wrong → step down;
  capped at `easy`/`expert`.
- `POST /api/guidance/assessment/:sessionId/answer` records the answer **and writes into
  the existing `question_attempts` pipeline** (the assessment instantly becomes mastery
  data), then returns `{ correct, nextQuestion | done, runningEstimate }`.
- Integrity: questions drawn server-side; correct answers never reach the client before
  submission; sessions are resumable (abandoned → resumed, not duplicated).

### 4.2 Level estimate

- Per-topic accuracy **weighted by difficulty** (a correct `hard` outranks a correct
  `easy`), blended into subject readiness 0–100 — the same scale `exam_readiness`
  already uses. Brie's result upserts into that table directly.
- **Returning-user skip:** when `question_attempts` already has ≥ 20 answers in the
  subject, the quiz is skipped and readiness computes from `topic_mastery` instantly.

---

## 5. Data model

One additive migration (`database/migrations/094_guidance.sql` — next number after
`093_parent_links_nullable_parent.sql`); no changes to existing table shapes.

- **`user_goals`** — `id, user_id, exam_type, subject_id, target_grade, exam_year,
  exam_month, created_at, updated_at`. Fills the WASSCE/BECE goal gap. (O/A-level
  keeps `user_target_grades`; Brie reads both.)
- **`guidance_sessions`** — `id, user_id, exam_type, subject_id,
  status ('in_progress'|'completed'|'abandoned'), questions TEXT (JSON: ids asked,
  answers, difficulty path), readiness_score REAL, created_at, completed_at`.
- **Relax `exam_readiness.exam_type` CHECK** to include O/A-level exam types
  (half-built item #5 from exploration).
- **Drop `learning_recommendations`** — dead table, zero code references (documented
  in the migration).

---

## 6. API surface — `workers/api/guidance.ts`, mounted at `/api/guidance`

| Endpoint | Auth | Description |
|---|---|---|
| `POST /goals` | user | Save goal intake (validates grade enum per exam type; `exam_year` between current year and +5, `exam_month` 1–12) |
| `GET /goals` | user | Read back goals for the goal card |
| `POST /assessment/start` | user | `{ sessionId, firstQuestion }` or `{ skip: true, readiness }` for returning users |
| `POST /assessment/:sessionId/answer` | user | `{ correct, nextQuestion \| done, runningEstimate }` |
| `GET /plan` | user | Full Brie payload: goal, readiness, roadmap, this-week, narrative |
| `POST /plan/regenerate` | **premium** | Weekly check-ins / on-demand refresh |

Conventions (established in Phase A–C): `requireAuth`, `isPremiumUser`, model routing
via `ai-models.ts` (never hardcoded), `unwrapAiText`, the shared `'ai'` rate bucket
(50 calls/user/24h), honest fallbacks — never a fabricated plan.

**Brie's narrative** (the only AI call in the free path): 2–3 sentences generated at
plan reveal, cached per user + readiness band (band = `floor(score/10)*10`, so a student
at 63 and one at 68 share a cached narrative; semantic answer cache pattern, threshold
0.92). One call per plan generation. Regeneration is premium-gated; free users get the
initial narrative + automatic refresh on re-assessment.

**Adopting the orphaned layer:** `GET /plan` internally completes the
`/api/learning/recommendations` + `exam-readiness` logic (weakest-first ordering,
prerequisite-aware sequencing via topic `display_order`) rather than duplicating it.
`learningPathStore.ts` is rewired to call the API (ending its local-compute drift).

---

## 7. Frontend

- **`src/components/guidance/CounselorBrieWizard.tsx`** — goal intake → quiz → reveal.
  Full-screen, warm, animation-forward (framer-motion, already in the stack): progress
  ring, readiness gauge animation, narrative type-in.
- **`src/pages/MyPlan.tsx`** — route `/my-plan`, nav label "Counselor Brie". Goal card,
  readiness gauge, roadmap, this-week, retake.
- **`src/stores/guidanceStore.ts`** — wizard state, quiz session, plan cache; talks to
  `/api/guidance` via the existing `api` client.
- **Touchpoints, not intrusions:** roadmap "Start" buttons deep-link into the existing
  revision classroom and practice flows — no new lesson machinery. Premium prompts
  appear contextually at those hand-offs.
- **Parents:** read-only goal/readiness line via the existing parent progress endpoints
  (`/parents/students/:studentId/progress`).
- The wizard **replaces** the feature-tour `OnboardingModal` as first-run (single
  component swap — trivially revertible).

---

## 8. Testing & rollout

- **Unit (vitest, established patterns):** adaptive stepping (correct→harder,
  wrong→easier, caps, topic spread, untagged-question fallback), readiness math
  (difficulty-weighted, ≥20-answer skip threshold), goal validation (grade enums per
  exam type, date sanity), premium gate on regenerate, no answer leakage pre-submission.
- **Integration:** full session against mocked D1/AI (start → 9 answers → done → plan
  payload shape); abandoned-session resume idempotency.
- **Live probe:** `scripts/verify-guidance.cjs` (Phase B/C probe style) — free user gets
  the full flow (200s), regenerate 403s free / 200s premium, readiness lands in
  `exam_readiness`, state restored + cleanup on exit.
- **Visual QA:** headful-Chrome wizard run. Lesson carried over from Phase C: seed
  `brilla-guide-storage` in fresh browser contexts so the old tour modal can't clobber
  the wizard.
- **Rollout:** additive migration → `wrangler deploy` → `pages deploy`. No feature flag
  for v1 (additive endpoints + new routes); the wizard swap is the only replace and is
  trivially revertible.

---

## 9. Reusable assets inventory (from codebase exploration, 2026-08-14)

- Tagged question bank (`questions.difficulty IN easy|medium|hard|expert`, `topic_id`,
  `subject_id`) — ~600 rows untagged, tolerate via subject-level fallback.
- `question_attempts` → `user_progress.mastery_level` / `topic_mastery` pipeline.
- Orphaned `/api/learning/*` endpoints + `study_plans` / `exam_readiness` tables.
- `user_exam_preferences` (`target_year`), O/A-level `user_target_grades`.
- AI conventions: `ai-models.ts` routing, `unwrapAiText`, `'ai'` rate bucket, semantic
  answer cache (0.92), premium gating via `isPremiumUser`.
- Existing `/counselor` chat (untouched; future persona-merge option noted).
- Parent progress endpoints for the read-only parent line.
