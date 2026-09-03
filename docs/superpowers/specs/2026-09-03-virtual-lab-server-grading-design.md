# Virtual Lab — Server-Side Sessions + Honest Grading Design

Date: 2026-09-03
Status: Approved — ready for implementation planning
Author: Kimi + ghwmelite
Project: B (Virtual Lab server-side sessions + honest grading)

## Vision

The Virtual Lab currently *looks* like a graded practical exam but is a client-side
theatre: the score is the percentage of steps the student self-marked complete,
`measurementAccuracy` is a hardcoded 70, and the carefully-authored
`requiredActions`, tolerances, and `assessmentCriteria` in the experiment data are
never evaluated. A student can click every step's "mark complete" checkbox without
touching the simulation and receive "Excellent work!".

This project makes the lab honest: sessions live on the server, every measurement
and action is recorded as an event, and a deterministic grading engine on the
worker scores the evidence against the experiment definition — the same definition
the frontend already renders. No AI is involved in grading; a WASSCE practical has
objective expected results, and we grade against them exactly.

## Current state (verified in codebase)

- **Content is fully client-side.** All 21 experiments are hardcoded in
  `src/data/experiments.ts` (4,528 lines): 7 PhET iframe embeds
  (`simulationType: 'phet'`) and 14 custom-built simulations. Types in
  `src/types/lab.ts:128-151` define the full grading vocabulary —
  `procedure` steps with `requiredActions` (`actionType`/`target`/`tolerance`),
  `maxMarks` per step, `assessmentCriteria`, `expectedResults`, `safetyNotes`,
  `waecPastYears`, and an `isPremium` flag.
- **UI flow.** `src/components/lab/VirtualLabPage.tsx` (filter/search) → mode
  modal (guided/sandbox) → `LabWorkspace.tsx`, which dispatches custom sims via a
  slug switch (`LabWorkspace.tsx:642-707`) or renders `PhETEmbed.tsx` (a plain
  iframe).
- **State is local-only.** `src/stores/labStore.ts` (zustand, persisted to
  localStorage key `brilla-lab`). `saveSession` writes localStorage only
  (`labStore.ts:484-497`).
- **Scoring is a stub.** `submitExperiment` (`labStore.ts:499-570`) carries a
  `TODO: Replace with API call when backend is ready`. Score = % of steps
  self-marked complete × `maxMarks`; `measurementAccuracy` is hardcoded to 70;
  `requiredActions`/tolerances are never validated; the 14 custom sims don't
  report anything into labStore at all.
- **Zero server-side footprint.** No lab tables in `database/schema.sql`, no lab
  routes in `workers/api`.

## Goals

1. **Honest grading.** The server scores evidence (measurement/action/observation
   events) against the experiment definition. Self-reported step completion is an
   input of last resort, never the score.
2. **Durable sessions.** Lab work survives device changes, cache clears, and
   offline periods. History is visible to the student.
3. **Enforced premium gating.** `Experiment.isPremium` exists in the data but is
   unenforced; the server becomes the enforcement point.
4. **Honest PhET labeling.** PhET iframes cannot report student data into our
   page (cross-origin, no postMessage telemetry contract), so PhET experiments
   become explicitly-labeled **"Practice mode — ungraded"** rather than
   pretend-graded.
5. **Shared, deterministic grading code.** One grading module usable by both the
   worker (authoritative) and the frontend (live progress hints), unit-testable
   with no network or AI dependency.

## Explicit non-goals

- **Teacher lab assignment/review workflows** (assign an experiment to a class,
  review submissions) — a future spec; the schema deliberately stores
  user-scoped sessions only.
- **PhET data extraction** — no iframe introspection, no postMessage bridge to
  PhET internals, no forked sims. Practice mode is the whole answer for PhET.
- **New simulation content** — the 21 existing experiments are the corpus; no new
  experiments, no changes to experiment pedagogy.
- **Lab XP / points / economy integration** — graded lab scores do not feed the
  points system, streaks, or leaderboards in this project.

## Schema — migration 361

Next free migration number after `360_role_neutral_marketing_consent.sql` is
**361**: `database/migrations/361_lab_sessions.sql`. Per project convention, new
migrations are *not* folded into `database/record_folded_migrations.sql` (that
file records the pre-squash baseline only), so no special handling there. A
matching rollback ships at `database/rollbacks/361_lab_sessions_rollback.sql`.

```sql
-- Lab sessions: one row per student attempt at an experiment.
CREATE TABLE lab_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  experiment_slug TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('guided', 'sandbox')),
  status TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'submitted', 'graded')),
  graded INTEGER NOT NULL DEFAULT 0 CHECK (graded IN (0, 1)),
  score REAL,
  max_score REAL,
  grading_json TEXT,          -- per-criterion breakdown returned by the grader
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  submitted_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_lab_sessions_user_created
  ON lab_sessions(user_id, created_at DESC);
CREATE INDEX idx_lab_sessions_user_experiment
  ON lab_sessions(user_id, experiment_slug, created_at DESC);

-- Append-only event stream per session. client_event_id is generated by the
-- client (uuid) and is the idempotency key: re-synced batches after offline
-- periods or retries must not double-record.
CREATE TABLE lab_session_events (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES lab_sessions(id) ON DELETE CASCADE,
  client_event_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'measurement', 'action', 'observation', 'step_complete'
  )),
  payload TEXT NOT NULL,      -- JSON, validated per event_type
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(session_id, client_event_id)
);

CREATE INDEX idx_lab_session_events_session
  ON lab_session_events(session_id, created_at);
```

Design notes:

- `experiment_slug` (not a numeric FK) because experiments live in code
  (`src/data/experiments.ts`), not in D1. The worker validates the slug against
  the shared experiment registry before creating a session.
- `graded` distinguishes PhET/practice sessions (`graded = 0`, score columns stay
  NULL) from graded ones. `status` is a lifecycle; `graded` is a property of the
  experiment type. A PhET session can be `submitted` (student finished) but is
  never `graded`.
- `grading_json` stores the full per-criterion breakdown so history/detail views
  render without re-grading.
- Events are append-only; sandbox-mode sessions still record events but `submit`
  is not offered for them (see API).

Rollback (`361_lab_sessions_rollback.sql`): `DROP TABLE lab_session_events; DROP
TABLE lab_sessions;` — both tables are new, so the rollback is total and safe.

## API — `workers/api/lab.ts`

A new Hono module following the `recordings.ts`/`library.ts` pattern: its own
`Env`/`AuthVars` types, `requireAuth` on every route, mounted in `index.ts` as
`app.route('/api/lab', labApp)`. All routes are rate-limited via
`checkRateLimit` (`workers/api/rate-limit.ts`) with entries added to the
`RATE_LIMITS` map, keyed on the authenticated user id.

| Route | Purpose | Limits / gating |
|---|---|---|
| `POST /sessions` | Start a session `{ experimentSlug, mode }`. Validates slug, resolves experiment from the shared registry, rejects unknown/inactive experiments. | Premium-gated: if `experiment.isPremium` and not `isPremiumUser(userId, db)` → 403 with `code: 'LAB_PREMIUM_REQUIRED'` (mirrors the `PAPER_PREMIUM_REQUIRED` pattern at `index.ts:3341`). Rate limit ~20/hour. |
| `POST /sessions/:id/events` | Append a batch of events `{ events: [{ clientEventId, eventType, payload }] }` (max 200 per batch, payload ≤ 8KB each). Ownership check (session belongs to caller, else 404 — don't leak existence). Session must be `in_progress`, else 409. Each event inserted with `INSERT OR IGNORE` on the `(session_id, client_event_id)` unique key → retries and offline re-syncs are naturally idempotent. Response reports `accepted`/`duplicates` counts. | Rate limit ~120/min (event bursts during active sim use). |
| `POST /sessions/:id/submit` | Grade and finalize. Loads the experiment definition + all session events, runs the grading engine, writes `score`, `max_score`, `grading_json`, `status = 'graded'`, `submitted_at`. Returns the full per-criterion breakdown. Re-submit of an already-graded session returns the stored result (idempotent), not a re-grade. Rejected for sandbox-mode sessions (400 `SANDBOX_NOT_GRADABLE`) and for PhET experiments (400 `PRACTICE_UNGRADED`). | Rate limit ~10/hour. |
| `GET /sessions` | Student's history: paginated list (experiment slug/name, mode, status, score, dates) via `parseLimit` from `http.ts`. | Standard. |
| `GET /sessions/:id` | Full detail: session row + events + stored `grading_json`. Ownership-checked. | Standard. |

PhET handling is explicit: `POST /sessions` **allows** PhET experiments (we still
want session history and completion tracking) but stamps `graded = 0`; `submit`
on a PhET session marks it `submitted` with no score and returns
`{ graded: false, reason: 'practice' }`. The client shows the Practice badge from
the session's `graded` flag, not from its own hardcoded list.

## Grading engine — `shared/lab-grading.ts`

One module under `shared/` (imported via relative path from both `workers/api`
and `src`, exactly like `shared/freemium-policy.ts` is today). It contains:

1. **Shared experiment types.** The grading-relevant types currently in
   `src/types/lab.ts` (`ProcedureStep`, `RequiredAction`, `ExpectedResult`,
   `AssessmentCriterion`) are moved to (or re-exported from) `shared/lab-grading.ts`
   so the worker grades against the same structures the frontend renders.
   `src/types/lab.ts` re-exports them to keep existing imports working.
2. **An experiment registry accessor.** The worker can't import the 4,528-line
   `experiments.ts` data module blindly; the shared module exposes
   `getExperimentBySlug(slug)` with the experiment data either colocated in
   `shared/` or imported through a thin module both bundles can consume. (The
   data is static JSON-shaped TypeScript; moving `experiments.ts` under
   `shared/` is the simplest honest option.)
3. **`gradeSession(experiment, events): GradingResult`** — pure, deterministic,
   no I/O, no AI:

   - **Measurements vs `expectedResults`.** Each `measurement` event (apparatus
     id, value, unit) is matched to an `ExpectedResult` by condition/apparatus.
     Numeric expectations pass when `|observed − expected| ≤ tolerance` (a
     missing tolerance means exact match is not assumed — the criterion scores
     zero and the spec flags the experiment data as needing a tolerance; see
     Testing). Unit mismatch scores zero with explicit feedback.
   - **Actions vs `requiredActions`.** Each procedure step's `requiredActions`
     (`actionType` + `target` + `tolerance`) are checked against `action` events
     recorded while that step was active. A step earns its `maxMarks` only from
     evidence: all required actions observed within tolerance.
   - **Steps from evidence, not self-report.** `step_complete` events are
     accepted only when that step's required actions are present in the event
     stream. A bare `step_complete` with no supporting actions earns the
     step nothing and is flagged in feedback ("marked complete but no
     supporting measurements recorded").
   - **Per-criterion breakdown.** `assessmentCriteria` map onto the evidence:
     criteria tied to procedure draw from step marks; criteria tied to data
     quality draw from measurement accuracy; each returned criterion score
     carries the rubric band description from the experiment's own
     `rubric[]`, so feedback text is authored content, not generated boilerplate.
   - **Output shape** (stored in `grading_json`, returned to the client):
     `{ totalScore, maxScore, percentageScore, criteriaScores: [{ criterionId,
     criterionName, score, maxScore, feedback }], stepScores: [{ stepNumber,
     marksEarned, maxMarks, evidence: 'full' | 'partial' | 'self_report_only',
     feedback }] }`.

   Determinism is a hard requirement: same events + same experiment → identical
   `GradingResult`, which makes the unit tests trivial assertions and lets the
   frontend run the same function for live progress hints without trust issues
   (the server result remains authoritative).

The grading engine **deletes** the two dishonest stubs: the
`measurementAccuracy = 70` constant and the canned "Excellent work!" feedback
strings in `submitExperiment`.

## Frontend changes

1. **Instrument the 14 custom sims.** Today no custom sim reports into labStore.
   Each sim's interaction handlers (measurement taken, apparatus adjusted,
   observation logged) call new labStore actions (`recordMeasurement`,
   `recordAction`, `recordObservation`) that append to an in-memory event queue
   with a client-generated `client_event_id`. This is the largest frontend work
   item and is purely additive per sim.
2. **labStore syncs to the API.** On session start (guided mode): `POST
   /sessions`, keep the returned `sessionId`. The event queue flushes to `POST
   /sessions/:id/events` in batches (size- or time-triggered, e.g. every 20
   events or 15s). **Offline resilience:** the queue persists in localStorage
   (same zustand persist key family); failed flushes stay queued and retry with
   backoff; server-side idempotency on `client_event_id` makes re-sends safe.
3. **Submit shows the real result.** `submitExperiment` becomes a `POST
   /sessions/:id/submit` call; the results screen renders the server-returned
   per-criterion breakdown and step evidence. If the submit call fails after
   retries, the student is told honestly that grading is pending and the result
   appears in history when sync succeeds — never a locally-fabricated score.
4. **PhET practice badge.** `PhETEmbed.tsx` / the workspace header show
   "Practice mode — ungraded" for `simulationType === 'phet'`, and the submit
   button is replaced with "Finish practice". No score screen for PhET.
5. **Premium gating UI.** Experiments with `isPremium` show the lock state in
   `VirtualLabPage.tsx`; on `LAB_PREMIUM_REQUIRED` 403 the user is routed to the
   upgrade flow (same UX as premium past papers). The client gate is cosmetic —
   the server is the enforcement point.

## Data flow

```
custom sim ──events──▶ labStore queue ──batch──▶ POST /lab/sessions/:id/events
                          │                           │ INSERT OR IGNORE
                          │ (offline: queue stays     ▼
                          │  in localStorage,    lab_session_events
                          │  retries)                 │
Finish ──▶ POST /sessions/:id/submit ──▶ load experiment (shared registry)
                                       + load events
                                       ▼
                              gradeSession() (shared/lab-grading.ts)
                                       ▼
                        lab_sessions.score/grading_json ◀── GET detail/history
                                       ▼
                        results screen (per-criterion feedback)
```

PhET path: session created with `graded = 0`; no event instrumentation; "Finish
practice" sets `submitted`; no grading, no score.

## Error handling principles

- **Honest degradation.** If grading can't run (missing events, malformed
  payloads), the affected criterion scores zero *with an explanation*, never a
  fabricated pass. If submit fails server-side, the session stays `in_progress`
  and the client can retry — submit is idempotent.
- **Ownership is invisible.** Cross-user session access returns 404, not 403.
- **Payload hygiene.** Event payloads are validated per `event_type` against a
  strict schema before insert; unknown event types → 400. Payloads are stored
  as opaque JSON and never rendered as HTML (XSS surface on the results screen).
- **Rate limits are per-user** via `checkRateLimit`; the events endpoint limit
  is generous enough for active sim use but caps runaway clients.
- **Concurrent submits.** The `status` transition `in_progress → graded` is a
  guarded `UPDATE ... WHERE status = 'in_progress'`; a second concurrent submit
  affects zero rows and falls through to returning the stored result.

## Testing

- **Grading engine unit tests** (`shared/` test, vitest): measurement within/at
  boundary/outside tolerance (inclusive boundary), missing-tolerance criterion,
  unit mismatch, required action present/absent/out-of-order, `step_complete`
  with and without supporting actions, per-step `maxMarks` honored, criteria
  mapping to rubric bands, determinism (same input → byte-identical output
  twice). Fixtures: 2-3 real experiments from `experiments.ts` plus synthetic
  edge cases. Run as part of authoring: every experiment with numeric
  `expectedResults` lacking tolerances is enumerated and fixed in the data.
- **Migration test** (`workers/api/__tests__/lab-sessions-migration.test.ts`,
  better-sqlite3 pattern like `answer-cache-migration.test.ts`): migration
  applies, is replay-safe, unique `(session_id, client_event_id)` enforced, FK
  cascade from `users` and `lab_sessions`, rollback drops both tables.
- **API tests** (`workers/api/__tests__/lab.test.ts`): auth required on all
  routes; premium gate (free user + premium experiment → 403
  `LAB_PREMIUM_REQUIRED`; free user + free experiment → 201); ownership 404;
  event batch idempotency (same batch twice → same `accepted` result, one set of
  rows); events rejected after submit (409); submit grades deterministically
  against seeded events; re-submit returns stored result; PhET submit →
  `graded: false`; sandbox submit → 400; rate-limit behavior on the events
  endpoint.
- **Store/sync tests** (frontend): queue persists across store rehydration,
  failed flush retains events, retry after recovery sends without duplicates,
  submit flow renders server breakdown, PhET UI shows practice badge, premium
  403 routes to upgrade.

## Rollout

Direct ship, gated by the existing premium flag — no feature flag, no soft-launch
cohort. Rationale: the lab today produces scores that are *wrong*; there is no
legacy behavior worth preserving or A/B-ing. Free users keep access to the
non-premium experiments with real grading; premium experiments flip from
"silently free and fake-graded" to "gated and honestly graded". The PhET
practice badge ships in the same release so no experiment ever presents a score
that wasn't earned. Pre-existing localStorage-only sessions (`brilla-lab`) are
not migrated — they were never real records; the store version key is bumped so
stale in-progress client state doesn't sync into the new API.
