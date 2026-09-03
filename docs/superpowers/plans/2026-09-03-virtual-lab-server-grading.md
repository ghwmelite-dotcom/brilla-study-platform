# Virtual Lab Server-Side Grading Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Virtual Lab's client-side score theatre (self-marked step % × maxMarks, hardcoded `measurementAccuracy = 70`, canned "Excellent work!") with durable server-side sessions, an append-only event stream, and a deterministic shared grading engine that scores evidence against the experiment definition — per the approved spec `docs/superpowers/specs/2026-09-03-virtual-lab-server-grading-design.md`.

**Architecture:**

```
custom sim ──events──▶ labStore queue (localStorage-persisted) ──batch──▶ POST /api/lab/sessions/:id/events
                                                                             │ INSERT OR IGNORE (client_event_id)
                                                                             ▼
                                                                  lab_session_events (D1)
Finish ──▶ POST /api/lab/sessions/:id/submit ──▶ load experiment (shared/experiments.ts)
                                                + load events
                                                ▼
                                       gradeSession() (shared/lab-grading.ts, pure/deterministic)
                                                ▼
                                 lab_sessions.score / grading_json ◀── GET /api/lab/sessions[/:id]
                                                ▼
                                 results screen (per-criterion rubric feedback)
```

PhET path: session created with `graded = 0`; "Finish practice" marks it `submitted`; no grading, no score. Premium gating enforced server-side on `POST /sessions` with `LAB_PREMIUM_REQUIRED` (mirrors `PAPER_PREMIUM_REQUIRED` at `workers/api/index.ts:3341-3347`).

**Tech Stack:** Cloudflare Workers + Hono + D1 (existing `workers/api` satellite-router pattern), zustand persist store (`brilla-lab`), React frontend, vitest (node env; jsdom per-file via `// @vitest-environment jsdom`), better-sqlite3 for migration tests. No AI anywhere in grading.

## Global Constraints

- **Conventional commits** (`feat:`, `fix:`, `test:`, `refactor:` …). Commit after every TDD green step or at task end, as each step instructs.
- **No new npm dependencies.** Everything uses existing deps: `hono`, `zustand`, `vitest`, `better-sqlite3`.
- **Migration number is 362** (a parallel track owns 361): `database/migrations/362_lab_sessions.sql` + `database/rollbacks/362_lab_sessions_rollback.sql` + migration test at `workers/api/__tests__/lab-sessions-migration.test.ts` (better-sqlite3 pattern from `workers/api/__tests__/answer-cache-migration.test.ts`). New migrations are NOT folded into `database/record_folded_migrations.sql`.
- **Shared code lives in `shared/`** and is imported by relative path from both `workers/api` and `src`, exactly like `shared/freemium-policy.ts` (see `workers/api/usage-limits.ts:7`).
- **Worker tests** use the `createMockD1` helper at `workers/api/__tests__/helpers/mockD1.ts` and JWT signing via `hono/jwt` (pattern: `workers/api/__tests__/recordings-files.test.ts`).
- **Per-task verification** (run before every task commit):
  - `npx tsc -b --noEmit` (frontend+shared) and `npm run typecheck:api` (worker) as applicable
  - targeted `npx vitest run <test files for the task>`
  - `npx eslint <files touched>`
- **Determinism is a hard requirement** for `gradeSession`: no `Date.now()`, no randomness, no I/O; same inputs → byte-identical `GradingResult`.
- **Ownership is invisible**: cross-user session access returns 404, never 403.
- Event payloads are validated per `event_type` before insert, stored as opaque JSON, and never rendered as HTML.

## Resolved spec ambiguities (binding decisions)

1. **Migration number**: spec text says 361; **362** per project directive (361 is a parallel track).
2. **PhET submit**: the spec's route table says 400 `PRACTICE_UNGRADED`, but the PhET paragraph says submit marks the session `submitted` and returns `{ graded: false, reason: 'practice' }`. **The paragraph wins** — "Finish practice" needs a success path. 200 response, no score.
3. **`GradingResult` shape**: the spec output shape replaces the existing `GradingResult` in `src/types/lab.ts:225-233` (`procedureAccuracy`, `measurementAccuracy`, `feedback: LabFeedback` are dropped — they are only consumed by the stub being deleted and the results screen being reworked in Task 10). `LabFeedback`/`LabAttempt` stay as legacy types.
4. **Criterion→evidence mapping** is not declared in the data. Deterministic classifier (exact regex in Task 3): criteria whose name+description match `/\b(accuracy|measurements?|data|observations?|recordings?|calculations?|analysis|graph|results?|identification)\b/i` draw from measurement-evidence fraction; all others draw from step-evidence fraction.
5. **Measurement→`ExpectedResult` matching**: by normalized exact equality of `payload.condition` (falls back to `payload.label`) against `ExpectedResult.condition`. Multiple matching measurements are aggregated by **mean** before tolerance comparison. String-valued `expectedResults` (e.g. `'Concordant readings'`) are excluded from numeric scoring.
6. **Measurement `apparatusId`**: sims don't know apparatus ids for readings, so `apparatusId` is **optional** in the measurement payload; the grader never uses it (matching is condition-based). Action events always carry the real `targetApparatus` from the experiment definition.
7. **Steps with empty `requiredActions`**: earn `maxMarks` only when a `step_complete` event exists AND at least one event of any type is tagged with that `stepNumber`; otherwise 0.
8. **`evidence` enum**: kept to the spec's `'full' | 'partial' | 'self_report_only'`. `'self_report_only'` is reserved for a `step_complete` with zero matched required actions. A step with no events at all reports `evidence: 'partial'`, 0 marks, feedback "No evidence recorded for this step". Action order within a step is not graded (out-of-order actions still count).
9. **No experiment currently sets `isPremium: true`** (verified: zero matches in `src/data/experiments.ts`). The gate is implemented and tested with a synthetic premium fixture; no content flags are flipped in this plan.
10. **vitest config** only includes `src/**` and `workers/**`; Task 2 adds `shared/**/*.test.ts` to `vitest.config.ts:12`.

---

## Task 1: Migration 362 — `lab_sessions` + `lab_session_events` + rollback + migration test

**Interfaces:**
- Consumes: nothing (first task). `users(id)` table must exist (it does — all user-scoped tables FK to it).
- Produces:
  - `database/migrations/362_lab_sessions.sql` — tables `lab_sessions`, `lab_session_events`, indexes `idx_lab_sessions_user_created`, `idx_lab_sessions_user_experiment`, `idx_lab_session_events_session`. Replay-safe (`IF NOT EXISTS`).
  - `database/rollbacks/362_lab_sessions_rollback.sql` — drops both tables and all three indexes.
  - `workers/api/__tests__/lab-sessions-migration.test.ts`.

- [ ] **Step 1.1 — Write the failing migration test.** Create `workers/api/__tests__/lab-sessions-migration.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';

const MIGRATION = new URL('../../../database/migrations/362_lab_sessions.sql', import.meta.url);
const ROLLBACK = new URL('../../../database/rollbacks/362_lab_sessions_rollback.sql', import.meta.url);

function freshDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  // Minimal users stub so the FK from lab_sessions is enforceable.
  db.exec(`CREATE TABLE users (id TEXT PRIMARY KEY);`);
  db.exec(readFileSync(MIGRATION, 'utf8'));
  return db;
}

describe('migration 362 lab sessions', () => {
  it('creates both tables and all indexes, and is safe to replay', () => {
    const db = freshDb();
    try {
      db.prepare(`INSERT INTO users (id) VALUES ('user_1')`).run();
      db.prepare(
        `INSERT INTO lab_sessions (id, user_id, experiment_slug, mode) VALUES ('sess_1', 'user_1', 'acid-base-titration', 'guided')`,
      ).run();
      db.prepare(
        `INSERT INTO lab_session_events (id, session_id, client_event_id, event_type, payload)
         VALUES ('evt_1', 'sess_1', 'client_1', 'measurement', '{"value":25}')`,
      ).run();

      // Replay: IF NOT EXISTS makes a second application a no-op.
      db.exec(readFileSync(MIGRATION, 'utf8'));

      expect(db.prepare(`SELECT id, status, graded FROM lab_sessions`).get())
        .toEqual({ id: 'sess_1', status: 'in_progress', graded: 0 });
      for (const idx of [
        'idx_lab_sessions_user_created',
        'idx_lab_sessions_user_experiment',
        'idx_lab_session_events_session',
      ]) {
        expect(
          db.prepare(`SELECT name FROM sqlite_master WHERE type='index' AND name=?`).get(idx),
        ).toEqual({ name: idx });
      }
    } finally {
      db.close();
    }
  });

  it('enforces UNIQUE(session_id, client_event_id) for idempotent re-sync', () => {
    const db = freshDb();
    try {
      db.prepare(`INSERT INTO users (id) VALUES ('user_1')`).run();
      db.prepare(
        `INSERT INTO lab_sessions (id, user_id, experiment_slug, mode) VALUES ('sess_1', 'user_1', 'osmosis-cells', 'guided')`,
      ).run();
      const insert = db.prepare(
        `INSERT INTO lab_session_events (id, session_id, client_event_id, event_type, payload)
         VALUES (?, 'sess_1', 'client_dup', 'action', '{}')`,
      );
      insert.run('evt_1');
      expect(() => insert.run('evt_2')).toThrow(/UNIQUE constraint failed/);
      // INSERT OR IGNORE (the worker's write path) silently dedupes instead.
      db.prepare(
        `INSERT OR IGNORE INTO lab_session_events (id, session_id, client_event_id, event_type, payload)
         VALUES ('evt_3', 'sess_1', 'client_dup', 'action', '{}')`,
      ).run();
      expect(
        db.prepare(`SELECT COUNT(*) AS n FROM lab_session_events WHERE client_event_id = 'client_dup'`).get(),
      ).toEqual({ n: 1 });
    } finally {
      db.close();
    }
  });

  it('rejects invalid mode, status, and event_type values', () => {
    const db = freshDb();
    try {
      db.prepare(`INSERT INTO users (id) VALUES ('user_1')`).run();
      expect(() =>
        db.prepare(
          `INSERT INTO lab_sessions (id, user_id, experiment_slug, mode) VALUES ('s1', 'user_1', 'x', 'exam')`,
        ).run(),
      ).toThrow(/CHECK constraint failed/);
      db.prepare(
        `INSERT INTO lab_sessions (id, user_id, experiment_slug, mode) VALUES ('s2', 'user_1', 'x', 'sandbox')`,
      ).run();
      expect(() =>
        db.prepare(`UPDATE lab_sessions SET status = 'deleted' WHERE id = 's2'`).run(),
      ).toThrow(/CHECK constraint failed/);
      expect(() =>
        db.prepare(
          `INSERT INTO lab_session_events (id, session_id, client_event_id, event_type, payload)
           VALUES ('e1', 's2', 'c1', 'teleport', '{}')`,
        ).run(),
      ).toThrow(/CHECK constraint failed/);
    } finally {
      db.close();
    }
  });

  it('cascades deletes from users to sessions and from sessions to events', () => {
    const db = freshDb();
    try {
      db.prepare(`INSERT INTO users (id) VALUES ('user_1')`).run();
      db.prepare(
        `INSERT INTO lab_sessions (id, user_id, experiment_slug, mode) VALUES ('sess_1', 'user_1', 'gas-tests', 'guided')`,
      ).run();
      db.prepare(
        `INSERT INTO lab_session_events (id, session_id, client_event_id, event_type, payload)
         VALUES ('evt_1', 'sess_1', 'c1', 'observation', '{"text":"bubbles"}')`,
      ).run();

      db.prepare(`DELETE FROM lab_sessions WHERE id = 'sess_1'`).run();
      expect(db.prepare(`SELECT COUNT(*) AS n FROM lab_session_events`).get()).toEqual({ n: 0 });

      db.prepare(
        `INSERT INTO lab_sessions (id, user_id, experiment_slug, mode) VALUES ('sess_2', 'user_1', 'gas-tests', 'guided')`,
      ).run();
      db.prepare(`DELETE FROM users WHERE id = 'user_1'`).run();
      expect(db.prepare(`SELECT COUNT(*) AS n FROM lab_sessions`).get()).toEqual({ n: 0 });
    } finally {
      db.close();
    }
  });

  it('rollback drops both tables and all indexes', () => {
    const db = freshDb();
    try {
      db.exec(readFileSync(ROLLBACK, 'utf8'));
      const remaining = db
        .prepare(
          `SELECT name FROM sqlite_master
           WHERE (type = 'table' OR type = 'index') AND name LIKE '%lab_session%'`,
        )
        .all();
      expect(remaining).toEqual([]);
    } finally {
      db.close();
    }
  });
});
```

- [ ] **Step 1.2 — Run it, watch it fail** (migration file does not exist):

```bash
npx vitest run workers/api/__tests__/lab-sessions-migration.test.ts
```

- [ ] **Step 1.3 — Write the migration.** Create `database/migrations/362_lab_sessions.sql`:

```sql
-- 362: Virtual Lab server-side sessions + append-only event stream.
-- experiment_slug (not a numeric FK) because experiments live in code
-- (shared/experiments.ts), not in D1. graded distinguishes PhET/practice
-- sessions (graded = 0, score columns stay NULL) from graded ones.
CREATE TABLE IF NOT EXISTS lab_sessions (
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

CREATE INDEX IF NOT EXISTS idx_lab_sessions_user_created
  ON lab_sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lab_sessions_user_experiment
  ON lab_sessions(user_id, experiment_slug, created_at DESC);

-- Append-only event stream per session. client_event_id is generated by the
-- client (uuid) and is the idempotency key: re-synced batches after offline
-- periods or retries must not double-record.
CREATE TABLE IF NOT EXISTS lab_session_events (
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

CREATE INDEX IF NOT EXISTS idx_lab_session_events_session
  ON lab_session_events(session_id, created_at);
```

- [ ] **Step 1.4 — Write the rollback.** Create `database/rollbacks/362_lab_sessions_rollback.sql`:

```sql
-- Rollback 362. Run only after the Worker no longer serves /api/lab.
-- Both tables are new in 362, so the rollback is total and safe.
DROP INDEX IF EXISTS idx_lab_session_events_session;
DROP TABLE IF EXISTS lab_session_events;
DROP INDEX IF EXISTS idx_lab_sessions_user_experiment;
DROP INDEX IF EXISTS idx_lab_sessions_user_created;
DROP TABLE IF EXISTS lab_sessions;
```

- [ ] **Step 1.5 — Run test green, verify, commit:**

```bash
npx vitest run workers/api/__tests__/lab-sessions-migration.test.ts
git add database/migrations/362_lab_sessions.sql database/rollbacks/362_lab_sessions_rollback.sql workers/api/__tests__/lab-sessions-migration.test.ts
git commit -m "feat: add migration 362 for lab sessions and event stream"
```

---

## Task 2: Shared lab domain types + move experiment data to `shared/`

**Interfaces:**
- Consumes: `src/types/lab.ts` (types at lines 7-151), `src/data/experiments.ts` (4,528 lines; exports `labApparatus`, `physicsExperiments`, `chemistryExperiments`, `biologyExperiments`, `allExperiments`, `getExperimentBySlug` at line 4505, `getExperimentById`, `getExperimentsBySubject`, `getApparatusById`, `getApparatusForExperiment`).
- Produces:
  - `shared/lab-grading.ts` — domain types (`LabMode`, `SimulationType`, `ApparatusCategory`, `InteractionPoint`, `ApparatusProperties`, `Apparatus`, `Material`, `RequiredAction`, `ProcedureStep`, `ExpectedResult`, `AssessmentCriterion`, `Experiment`) + event payload types + grading result types. (`gradeSession` itself lands in Task 3.)
  - `shared/experiments.ts` — the moved data module, importing types from `./lab-grading`.
  - `src/data/experiments.ts` — reduced to a re-export shim (only importer is `src/components/lab/VirtualLabPage.tsx:15`; keep the shim so the import path stays stable).
  - `src/types/lab.ts` — re-exports the moved types; keeps client-only types (`Position`, `Connection`, `ApparatusInstance`, `LabSession`, `StepProgress`, `Measurement`, `Observation`, `PerformedAction`, `CanvasState`, `PhETProgress`, `PHET_SIMULATIONS`, `LabProgress`, `LabFeedback`, `LabAttempt`, legacy session types).
  - `vitest.config.ts` — include pattern gains `shared/**/*.test.ts`.

- [ ] **Step 2.1 — Write the failing registry test.** Create `shared/experiments.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { allExperiments, getExperimentBySlug } from './experiments';

describe('shared experiment registry', () => {
  it('exposes all 21 experiments (7 PhET practice + 14 custom graded)', () => {
    expect(allExperiments).toHaveLength(21);
    expect(allExperiments.filter((e) => e.simulationType === 'phet')).toHaveLength(7);
    expect(allExperiments.filter((e) => e.simulationType === 'custom')).toHaveLength(14);
  });

  it('resolves experiments by slug and rejects unknown slugs', () => {
    const titration = getExperimentBySlug('acid-base-titration');
    expect(titration?.id).toBe('exp_acid_base_titration');
    expect(titration?.isActive).toBe(true);
    expect(getExperimentBySlug('does-not-exist')).toBeUndefined();
  });

  it('every active experiment has a non-empty procedure with positive maxMarks', () => {
    for (const exp of allExperiments.filter((e) => e.isActive)) {
      expect(exp.procedure.length).toBeGreaterThan(0);
      for (const step of exp.procedure) {
        expect(step.maxMarks).toBeGreaterThan(0);
      }
    }
  });
});
```

Also add `'shared/**/*.test.ts'` to the `include` array in `vitest.config.ts:12`:

```ts
    include: ['src/**/*.test.{ts,tsx}', 'workers/**/*.test.ts', 'shared/**/*.test.ts'],
```

Run to confirm failure: `npx vitest run shared/experiments.test.ts` (fails — `shared/experiments.ts` doesn't exist).

- [ ] **Step 2.2 — Create `shared/lab-grading.ts` with the domain + event + grading types:**

```ts
// =============================================
// VIRTUAL LAB — SHARED GRADING DOMAIN
// Consumed by both the worker (workers/api/lab.ts, authoritative grading)
// and the frontend (src/, live progress hints) via relative import,
// exactly like shared/freemium-policy.ts.
// =============================================

export type LabMode = 'guided' | 'sandbox';
export type SimulationType = 'custom' | 'phet';
export type ApparatusCategory =
  | 'measurement'
  | 'container'
  | 'heating'
  | 'optical'
  | 'electrical'
  | 'biological'
  | 'support'
  | 'chemical';

export interface InteractionPoint {
  id: string;
  name: string;
  type: 'input' | 'output' | 'connect' | 'measure' | 'adjust';
  position: { x: number; y: number };
  acceptsFrom?: string[];
}

export interface ApparatusProperties {
  isDraggable: boolean;
  isConnectable: boolean;
  hasReading?: boolean;
  readingType?: 'numeric' | 'visual' | 'color';
  readingUnit?: string;
  minValue?: number;
  maxValue?: number;
  precision?: number;
  defaultValue?: number;
}

export interface Apparatus {
  id: string;
  name: string;
  description: string;
  category: ApparatusCategory;
  iconUrl?: string;
  spriteUrl?: string;
  interactionPoints: InteractionPoint[];
  properties: ApparatusProperties;
  subjectId: string;
}

export interface Material {
  name: string;
  quantity: string;
  concentration?: string;
}

export type LabActionType =
  | 'drag' | 'connect' | 'adjust' | 'measure' | 'record' | 'observe' | 'pour' | 'heat';

export interface RequiredAction {
  actionType: LabActionType;
  targetApparatus: string;
  targetValue?: number;
  tolerance?: number;
  description: string;
}

export interface ProcedureStep {
  stepNumber: number;
  instruction: string;
  hint?: string;
  requiredActions: RequiredAction[];
  expectedOutcome?: string;
  imageUrl?: string;
  videoUrl?: string;
  isCheckpoint: boolean;
  maxMarks: number;
}

export interface ExpectedResult {
  condition: string;
  value: string | number;
  tolerance?: number;
  unit?: string;
}

export interface AssessmentCriterion {
  id: string;
  name: string;
  description: string;
  maxMarks: number;
  rubric: {
    marks: number;
    description: string;
  }[];
}

export interface Experiment {
  id: string;
  subjectId: string;
  topicId: string;
  name: string;
  slug: string;
  description: string;
  objectives: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number; // minutes
  simulationType: SimulationType;
  phetSimUrl?: string;
  apparatus: string[]; // Apparatus IDs
  materials: Material[];
  safetyNotes: string[];
  procedure: ProcedureStep[];
  expectedResults: ExpectedResult[];
  assessmentCriteria: AssessmentCriterion[];
  examTypeId: string;
  paperTypeId: string;
  waecPastYears?: number[];
  isActive: boolean;
  isPremium?: boolean;
}

// =============================================
// EVENT STREAM — payloads stored in lab_session_events.payload
// =============================================

export type LabEventType = 'measurement' | 'action' | 'observation' | 'step_complete';

export interface MeasurementEventPayload {
  value: number;
  unit: string;
  label: string;
  /** Normalized-exact match key against ExpectedResult.condition. */
  condition?: string;
  /** Optional: sims that know the apparatus (e.g. titration burette) set it. */
  apparatusId?: string;
  stepNumber?: number;
}

export interface ActionEventPayload {
  actionType: LabActionType;
  targetApparatus: string;
  value?: number;
  stepNumber?: number;
}

export interface ObservationEventPayload {
  text: string;
  stepNumber?: number;
}

export interface StepCompleteEventPayload {
  stepNumber: number;
}

export type LabEventPayload =
  | MeasurementEventPayload
  | ActionEventPayload
  | ObservationEventPayload
  | StepCompleteEventPayload;

export interface LabEventInput {
  clientEventId: string;
  eventType: LabEventType;
  payload: LabEventPayload;
}

// =============================================
// GRADING RESULT — stored in lab_sessions.grading_json
// =============================================

export type StepEvidence = 'full' | 'partial' | 'self_report_only';

export interface StepScore {
  stepNumber: number;
  marksEarned: number;
  maxMarks: number;
  evidence: StepEvidence;
  feedback: string;
}

export interface CriterionScore {
  criterionId: string;
  criterionName: string;
  score: number;
  maxScore: number;
  feedback: string; // rubric band description from the experiment's own rubric[]
}

export interface GradingResult {
  totalScore: number;
  maxScore: number;
  percentageScore: number;
  criteriaScores: CriterionScore[];
  stepScores: StepScore[];
}
```

- [ ] **Step 2.3 — Move the data module.** `git mv src/data/experiments.ts shared/experiments.ts`, then change its line 1 from:

```ts
import type { Experiment, Apparatus } from '@/types';
```

to:

```ts
import type { Experiment, Apparatus } from './lab-grading';
```

Create the shim `src/data/experiments.ts`:

```ts
// The experiment corpus now lives in shared/ so the worker grades against the
// same definitions the frontend renders. This shim keeps `@/data/experiments`
// imports working.
export * from '../../shared/experiments';
```

- [ ] **Step 2.4 — Rewire `src/types/lab.ts`.** Replace the moved type definitions (lines 7-17 `LabMode`/`SimulationType`/`ApparatusCategory`, 25-55 `InteractionPoint`/`ApparatusProperties`/`Apparatus`, 84-151 `Material`/`RequiredAction`/`ProcedureStep`/`ExpectedResult`/`AssessmentCriterion`/`Experiment`) with a re-export at the top of the file:

```ts
// Domain types shared with the server-side grader live in shared/lab-grading.ts.
// Re-exported here so existing `@/types` imports keep working.
export type {
  LabMode,
  SimulationType,
  ApparatusCategory,
  InteractionPoint,
  ApparatusProperties,
  Apparatus,
  Material,
  LabActionType,
  RequiredAction,
  ProcedureStep,
  ExpectedResult,
  AssessmentCriterion,
  Experiment,
} from '../../shared/lab-grading';
import type {
  LabMode,
  SimulationType,
  Experiment,
} from '../../shared/lab-grading';
```

Delete the old `GradingResult` interface (lines 225-233) and add to the same re-export list: `StepEvidence`, `StepScore`, `CriterionScore`, `GradingResult`, plus the event payload types (`LabEventType`, `MeasurementEventPayload`, `ActionEventPayload`, `ObservationEventPayload`, `StepCompleteEventPayload`, `LabEventPayload`, `LabEventInput`). Keep `LabFeedback` and `LabAttempt` (legacy; `LabAttempt` references `LabFeedback`) and all client-only types untouched.

- [ ] **Step 2.5 — Run test green, verify, commit:**

```bash
npx vitest run shared/experiments.test.ts
npx tsc -b --noEmit && npm run typecheck:api
npx eslint shared src/types/lab.ts src/data/experiments.ts
npx vitest run src/components 2>/dev/null; npx vitest run src/stores src/lib
git add -A && git commit -m "refactor: move lab domain types and experiment corpus to shared/"
```

---

## Task 3: `gradeSession` — deterministic grading engine + exhaustive unit tests + tolerance data fix

**Interfaces:**
- Consumes: `shared/lab-grading.ts` types (Task 2), `shared/experiments.ts` fixtures.
- Produces:
  - `gradeSession(experiment: Experiment, events: LabEventInput[]): GradingResult` in `shared/lab-grading.ts` — pure, deterministic, no I/O.
  - `shared/lab-grading.test.ts` — the full unit suite.
  - Data fix in `shared/experiments.ts`: `microscope-use` expectedResult `'Magnification at x400'` (value 400, unit 'x') gains `tolerance: 0` — it is the only numeric expectation lacking a tolerance (verified by audit).

**Grading semantics (binding):**

- **Steps.** For each `ProcedureStep`, an `action` event matches a `RequiredAction` when `actionType` and normalized `targetApparatus` are equal, the event's `stepNumber` equals the step's, and — when `targetValue` is set — `|event.value − targetValue| ≤ (tolerance ?? 0)`. Action order within a step is NOT graded.
  - All required actions matched → `evidence: 'full'`, `marksEarned = maxMarks`.
  - Some matched → `evidence: 'partial'`, `marksEarned = Math.round(maxMarks * matched / required.length)`.
  - Zero matched but a `step_complete` event exists for the step → `evidence: 'self_report_only'`, 0 marks, feedback `"Marked complete but no supporting actions recorded"`.
  - Zero matched and no `step_complete` → `evidence: 'partial'`, 0 marks, feedback `"No evidence recorded for this step"`.
  - Steps with empty `requiredActions`: `step_complete` present AND ≥1 event of any type tagged with the step → `'full'`; otherwise 0/`'partial'`.
- **Measurements.** Numeric `expectedResults` only (string-valued ones are excluded). A `measurement` event matches an expectation when `normalize(payload.condition ?? payload.label) === normalize(expected.condition)` (`normalize` = trim, lowercase, collapse whitespace). Multiple matches aggregate by **mean**. Unit mismatch (normalized, both non-empty) → fail with feedback `"Unit mismatch: expected <unit>, recorded <unit>"`. Missing `tolerance` on a numeric expectation → fail with feedback `"Experiment definition is missing a tolerance for '<condition>'; cannot grade this measurement"` (the audit guard test makes this unreachable in shipped data). Pass when `|mean − expected| ≤ tolerance` (inclusive boundary).
- **Criteria.** Classifier regex `/\b(accuracy|measurements?|data|observations?|recordings?|calculations?|analysis|graph|results?|identification)\b/i` on `name + ' ' + description` → measurement bucket; else procedure bucket. `score = Math.round(maxMarks * bucketFraction)`. Feedback = the description of the highest rubric band whose `marks ≤ score`; if score is below every band, the lowest band's description.
- **Fractions.** `procedureFraction = Σ step marksEarned / Σ step maxMarks` (0 when no procedure). `measurementFraction = passedExpectations / numericExpectations`; when there are no numeric expectations, fall back to the fraction of steps having ≥1 measurement or observation event.
- **Totals.** `maxScore = Σ criterion.maxMarks` (fall back to Σ step `maxMarks` when `assessmentCriteria` is empty), `totalScore = Σ criterion score`, `percentageScore = maxScore > 0 ? Math.round(100 * totalScore / maxScore) : 0`.

- [ ] **Step 3.1 — Write the failing test suite.** Create `shared/lab-grading.test.ts` (full suite; fixtures use the real `acid-base-titration` experiment plus a synthetic minimal experiment):

```ts
import { describe, expect, it } from 'vitest';
import { getExperimentBySlug, allExperiments } from './experiments';
import { gradeSession } from './lab-grading';
import type { Experiment, LabEventInput } from './lab-grading';

const titration = getExperimentBySlug('acid-base-titration')!;

// Synthetic experiment isolating one numeric expectation and one 2-action step.
const synthetic: Experiment = {
  id: 'exp_test', subjectId: 's', topicId: 't', name: 'Test', slug: 'test-exp',
  description: '', objectives: [], difficulty: 'easy', estimatedTime: 10,
  simulationType: 'custom', apparatus: [], materials: [], safetyNotes: [],
  procedure: [
    {
      stepNumber: 1, instruction: 'Do the thing', isCheckpoint: true, maxMarks: 4,
      requiredActions: [
        { actionType: 'pour', targetApparatus: 'app_flask', description: 'Pour' },
        { actionType: 'adjust', targetApparatus: 'app_psu', targetValue: 6, tolerance: 0.5, description: 'Set 6V' },
      ],
    },
    {
      stepNumber: 2, instruction: 'Watch', isCheckpoint: false, maxMarks: 2,
      requiredActions: [],
    },
  ],
  expectedResults: [{ condition: 'Final temperature', value: 40, tolerance: 2, unit: '°C' }],
  assessmentCriteria: [
    {
      id: 'crit_tech', name: 'Experimental Technique', description: 'Handling', maxMarks: 6,
      rubric: [
        { marks: 6, description: 'Perfect technique' },
        { marks: 3, description: 'Minor issues' },
        { marks: 1, description: 'Poor technique' },
      ],
    },
    {
      id: 'crit_meas', name: 'Measurements', description: 'Accurate readings', maxMarks: 4,
      rubric: [
        { marks: 4, description: 'All readings within tolerance' },
        { marks: 2, description: 'Some readings off' },
        { marks: 0, description: 'Readings missing or wrong' },
      ],
    },
  ],
  examTypeId: 'e', paperTypeId: 'p', isActive: true,
};

const ev = (
  clientEventId: string,
  eventType: LabEventInput['eventType'],
  payload: LabEventInput['payload'],
): LabEventInput => ({ clientEventId, eventType, payload });

describe('gradeSession — measurements vs expectedResults', () => {
  const base = [ev('a1', 'action', { actionType: 'pour', targetApparatus: 'app_flask', stepNumber: 1 }),
                ev('a2', 'action', { actionType: 'adjust', targetApparatus: 'app_psu', value: 6, stepNumber: 1 })];

  it('passes a measurement within tolerance and at the inclusive boundary', () => {
    const within = gradeSession(synthetic, [...base,
      ev('m1', 'measurement', { value: 41, unit: '°C', label: 'Final temperature', condition: 'Final temperature' })]);
    expect(within.criteriaScores.find((c) => c.criterionId === 'crit_meas')?.score).toBe(4);

    const atBoundary = gradeSession(synthetic, [...base,
      ev('m1', 'measurement', { value: 42, unit: '°C', label: 'x', condition: 'Final temperature' })]);
    expect(atBoundary.criteriaScores.find((c) => c.criterionId === 'crit_meas')?.score).toBe(4);
  });

  it('fails a measurement outside tolerance', () => {
    const result = gradeSession(synthetic, [...base,
      ev('m1', 'measurement', { value: 42.1, unit: '°C', label: 'x', condition: 'Final temperature' })]);
    expect(result.criteriaScores.find((c) => c.criterionId === 'crit_meas')?.score).toBe(0);
  });

  it('scores zero with explicit feedback on unit mismatch', () => {
    const result = gradeSession(synthetic, [...base,
      ev('m1', 'measurement', { value: 40, unit: 'K', label: 'x', condition: 'Final temperature' })]);
    const crit = result.criteriaScores.find((c) => c.criterionId === 'crit_meas')!;
    expect(crit.score).toBe(0);
    expect(crit.feedback).toContain('Unit mismatch');
  });

  it('scores zero and flags the data when a numeric expectation lacks a tolerance', () => {
    const noTol: Experiment = {
      ...synthetic,
      expectedResults: [{ condition: 'Final temperature', value: 40, unit: '°C' }],
    };
    const result = gradeSession(noTol, [...base,
      ev('m1', 'measurement', { value: 40, unit: '°C', label: 'x', condition: 'Final temperature' })]);
    const crit = result.criteriaScores.find((c) => c.criterionId === 'crit_meas')!;
    expect(crit.score).toBe(0);
    expect(crit.feedback).toContain('missing a tolerance');
  });

  it('aggregates repeated measurements by mean before comparing', () => {
    const result = gradeSession(synthetic, [...base,
      ev('m1', 'measurement', { value: 39, unit: '°C', label: 'x', condition: 'Final temperature' }),
      ev('m2', 'measurement', { value: 41, unit: '°C', label: 'x', condition: 'Final temperature' })]);
    expect(result.criteriaScores.find((c) => c.criterionId === 'crit_meas')?.score).toBe(4); // mean 40
  });

  it('ignores string-valued expectedResults for numeric scoring', () => {
    const withString: Experiment = {
      ...synthetic,
      expectedResults: [
        { condition: 'Final temperature', value: 40, tolerance: 2, unit: '°C' },
        { condition: 'Concordant readings', value: 'within 0.1ml' },
      ],
    };
    const result = gradeSession(withString, [...base,
      ev('m1', 'measurement', { value: 40, unit: '°C', label: 'x', condition: 'Final temperature' })]);
    expect(result.criteriaScores.find((c) => c.criterionId === 'crit_meas')?.score).toBe(4);
  });
});

describe('gradeSession — actions and step evidence', () => {
  it('awards full marks when all required actions are observed, in any order', () => {
    const result = gradeSession(synthetic, [
      ev('a2', 'action', { actionType: 'adjust', targetApparatus: 'app_psu', value: 6.4, stepNumber: 1 }),
      ev('a1', 'action', { actionType: 'pour', targetApparatus: 'app_flask', stepNumber: 1 }),
      ev('m1', 'measurement', { value: 40, unit: '°C', label: 'x', condition: 'Final temperature' }),
    ]);
    expect(result.stepScores[0]).toMatchObject({ stepNumber: 1, marksEarned: 4, maxMarks: 4, evidence: 'full' });
  });

  it('rejects an adjust action outside its tolerance', () => {
    const result = gradeSession(synthetic, [
      ev('a1', 'action', { actionType: 'pour', targetApparatus: 'app_flask', stepNumber: 1 }),
      ev('a2', 'action', { actionType: 'adjust', targetApparatus: 'app_psu', value: 9, stepNumber: 1 }),
    ]);
    expect(result.stepScores[0]).toMatchObject({ marksEarned: 2, evidence: 'partial' }); // 4 * 1/2
  });

  it('flags step_complete with no supporting actions as self_report_only with zero marks', () => {
    const result = gradeSession(synthetic, [
      ev('s1', 'step_complete', { stepNumber: 1 }),
    ]);
    expect(result.stepScores[0]).toMatchObject({
      marksEarned: 0,
      evidence: 'self_report_only',
      feedback: 'Marked complete but no supporting actions recorded',
    });
  });

  it('accepts step_complete when the required actions are present', () => {
    const result = gradeSession(synthetic, [
      ev('a1', 'action', { actionType: 'pour', targetApparatus: 'app_flask', stepNumber: 1 }),
      ev('a2', 'action', { actionType: 'adjust', targetApparatus: 'app_psu', value: 6, stepNumber: 1 }),
      ev('s1', 'step_complete', { stepNumber: 1 }),
    ]);
    expect(result.stepScores[0].evidence).toBe('full');
  });

  it('scores an empty-requiredActions step from step_complete plus any tagged event', () => {
    const earned = gradeSession(synthetic, [
      ev('s2', 'step_complete', { stepNumber: 2 }),
      ev('o1', 'observation', { text: 'colour changed', stepNumber: 2 }),
    ]);
    expect(earned.stepScores[1]).toMatchObject({ marksEarned: 2, evidence: 'full' });

    const bare = gradeSession(synthetic, [ev('s2', 'step_complete', { stepNumber: 2 })]);
    expect(bare.stepScores[1]).toMatchObject({ marksEarned: 0 });
  });

  it('honors per-step maxMarks (no step can exceed its own cap)', () => {
    const result = gradeSession(synthetic, [
      ev('a1', 'action', { actionType: 'pour', targetApparatus: 'app_flask', stepNumber: 1 }),
      ev('a1b', 'action', { actionType: 'pour', targetApparatus: 'app_flask', stepNumber: 1 }),
    ]);
    expect(result.stepScores[0].marksEarned).toBeLessThanOrEqual(4);
  });

  it('scores an empty event stream as all zeros, honestly', () => {
    const result = gradeSession(synthetic, []);
    expect(result.totalScore).toBe(0);
    expect(result.percentageScore).toBe(0);
    expect(result.stepScores.every((s) => s.marksEarned === 0)).toBe(true);
  });
});

describe('gradeSession — criteria, rubric bands, totals', () => {
  const fullEvidence: LabEventInput[] = [
    ev('a1', 'action', { actionType: 'pour', targetApparatus: 'app_flask', stepNumber: 1 }),
    ev('a2', 'action', { actionType: 'adjust', targetApparatus: 'app_psu', value: 6, stepNumber: 1 }),
    ev('s2', 'step_complete', { stepNumber: 2 }),
    ev('o1', 'observation', { text: 'done', stepNumber: 2 }),
    ev('m1', 'measurement', { value: 40, unit: '°C', label: 'x', condition: 'Final temperature' }),
  ];

  it('maps criterion scores to the matching rubric band description', () => {
    const result = gradeSession(synthetic, fullEvidence);
    expect(result.criteriaScores.find((c) => c.criterionId === 'crit_tech')?.feedback).toBe('Perfect technique');
    expect(result.criteriaScores.find((c) => c.criterionId === 'crit_meas')?.feedback)
      .toBe('All readings within tolerance');
  });

  it('uses the lowest band when the score is below every band', () => {
    const result = gradeSession(synthetic, []);
    expect(result.criteriaScores.find((c) => c.criterionId === 'crit_meas')?.feedback)
      .toBe('Readings missing or wrong');
  });

  it('computes totals from the criteria mark scheme', () => {
    const result = gradeSession(synthetic, fullEvidence);
    expect(result.maxScore).toBe(10); // 6 + 4
    expect(result.totalScore).toBe(10);
    expect(result.percentageScore).toBe(100);
  });

  it('is deterministic: same input twice gives byte-identical output', () => {
    const a = JSON.stringify(gradeSession(titration, fullEvidence));
    const b = JSON.stringify(gradeSession(titration, fullEvidence));
    expect(a).toBe(b);
  });

  it('a real experiment: bare self-marks earn nothing', () => {
    const selfMarked = titration.procedure.map((s, i) =>
      ev(`s${i}`, 'step_complete', { stepNumber: s.stepNumber }));
    const result = gradeSession(titration, selfMarked);
    expect(result.totalScore).toBe(0);
    expect(result.stepScores.every((s) => s.evidence === 'self_report_only' || s.marksEarned === 0)).toBe(true);
  });
});

describe('experiment data audit', () => {
  it('every numeric expectedResult in the corpus declares a tolerance', () => {
    const missing = allExperiments.flatMap((exp) =>
      exp.expectedResults
        .filter((r) => typeof r.value === 'number' && r.tolerance === undefined)
        .map((r) => `${exp.slug}: ${r.condition}`),
    );
    expect(missing).toEqual([]);
  });
});
```

Run to confirm failure: `npx vitest run shared/lab-grading.test.ts` (`gradeSession` is not exported yet).

- [ ] **Step 3.2 — Implement `gradeSession`.** Append to `shared/lab-grading.ts`:

```ts
// =============================================
// GRADING ENGINE — pure, deterministic, no I/O, no AI.
// Same events + same experiment → identical GradingResult.
// =============================================

const MEASUREMENT_CRITERION_PATTERN =
  /\b(accuracy|measurements?|data|observations?|recordings?|calculations?|analysis|graph|results?|identification)\b/i;

function normalize(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

interface TypedEvent {
  eventType: LabEventType;
  payload: any;
}

function matchesRequiredAction(action: TypedEvent, required: RequiredAction, stepNumber: number): boolean {
  const p = action.payload as ActionEventPayload;
  if (p.stepNumber !== stepNumber) return false;
  if (p.actionType !== required.actionType) return false;
  if (normalize(p.targetApparatus) !== normalize(required.targetApparatus)) return false;
  if (required.targetValue === undefined) return true;
  if (typeof p.value !== 'number') return false;
  return Math.abs(p.value - required.targetValue) <= (required.tolerance ?? 0);
}

function rubricFeedback(criterion: AssessmentCriterion, score: number): string {
  const bands = [...criterion.rubric].sort((a, b) => b.marks - a.marks);
  const band = bands.find((b) => score >= b.marks) ?? bands[bands.length - 1];
  return band?.description ?? '';
}

export function gradeSession(experiment: Experiment, events: LabEventInput[]): GradingResult {
  const typed: TypedEvent[] = events.map((e) => ({ eventType: e.eventType, payload: e.payload }));
  const actions = typed.filter((e) => e.eventType === 'action');
  const measurements = typed.filter((e) => e.eventType === 'measurement');
  const observations = typed.filter((e) => e.eventType === 'observation');
  const stepCompletes = new Set(
    typed
      .filter((e) => e.eventType === 'step_complete')
      .map((e) => (e.payload as StepCompleteEventPayload).stepNumber),
  );

  // --- Steps from evidence, never self-report alone ---
  const stepScores: StepScore[] = experiment.procedure.map((step) => {
    const matched = step.requiredActions.filter((ra) =>
      actions.some((a) => matchesRequiredAction(a, ra, step.stepNumber)),
    ).length;
    const hasStepComplete = stepCompletes.has(step.stepNumber);

    if (step.requiredActions.length === 0) {
      const hasAnyStepEvent = typed.some(
        (e) => (e.payload as { stepNumber?: number }).stepNumber === step.stepNumber,
      );
      const earned = hasStepComplete && hasAnyStepEvent ? step.maxMarks : 0;
      return {
        stepNumber: step.stepNumber,
        marksEarned: earned,
        maxMarks: step.maxMarks,
        evidence: earned > 0 ? 'full' : 'partial',
        feedback: earned > 0 ? 'Step completed with recorded evidence' : 'No evidence recorded for this step',
      };
    }

    if (matched === step.requiredActions.length) {
      return {
        stepNumber: step.stepNumber,
        marksEarned: step.maxMarks,
        maxMarks: step.maxMarks,
        evidence: 'full',
        feedback: 'All required actions observed',
      };
    }
    if (matched === 0 && hasStepComplete) {
      return {
        stepNumber: step.stepNumber,
        marksEarned: 0,
        maxMarks: step.maxMarks,
        evidence: 'self_report_only',
        feedback: 'Marked complete but no supporting actions recorded',
      };
    }
    return {
      stepNumber: step.stepNumber,
      marksEarned: Math.round((step.maxMarks * matched) / step.requiredActions.length),
      maxMarks: step.maxMarks,
      evidence: 'partial',
      feedback:
        matched === 0
          ? 'No evidence recorded for this step'
          : `${matched} of ${step.requiredActions.length} required actions observed`,
    };
  });

  const stepMaxTotal = experiment.procedure.reduce((sum, s) => sum + s.maxMarks, 0);
  const stepEarnedTotal = stepScores.reduce((sum, s) => sum + s.marksEarned, 0);
  const procedureFraction = stepMaxTotal > 0 ? stepEarnedTotal / stepMaxTotal : 0;

  // --- Measurements vs expectedResults (numeric expectations only) ---
  const numericExpectations = experiment.expectedResults.filter((r) => typeof r.value === 'number');
  let passedExpectations = 0;
  const expectationFeedback: string[] = [];
  for (const expected of numericExpectations) {
    const matches = measurements.filter((m) => {
      const p = m.payload as MeasurementEventPayload;
      return normalize(p.condition ?? p.label) === normalize(expected.condition);
    });
    if (matches.length === 0) {
      expectationFeedback.push(`No measurement recorded for '${expected.condition}'`);
      continue;
    }
    const units = new Set(matches.map((m) => normalize((m.payload as MeasurementEventPayload).unit)));
    if (expected.unit && units.size === 1 && !units.has(normalize(expected.unit))) {
      expectationFeedback.push(
        `Unit mismatch: expected ${expected.unit}, recorded ${[...units][0]}`,
      );
      continue;
    }
    if (expected.tolerance === undefined) {
      expectationFeedback.push(
        `Experiment definition is missing a tolerance for '${expected.condition}'; cannot grade this measurement`,
      );
      continue;
    }
    const mean =
      matches.reduce((sum, m) => sum + (m.payload as MeasurementEventPayload).value, 0) / matches.length;
    if (Math.abs(mean - (expected.value as number)) <= expected.tolerance) {
      passedExpectations += 1;
    } else {
      expectationFeedback.push(
        `'${expected.condition}': recorded mean ${Number(mean.toFixed(4))} ${expected.unit ?? ''} outside ±${expected.tolerance} of expected ${expected.value}`,
      );
    }
  }
  const measurementFraction =
    numericExpectations.length > 0
      ? passedExpectations / numericExpectations.length
      : experiment.procedure.length > 0
        ? experiment.procedure.filter((step) =>
            [...measurements, ...observations].some(
              (e) => (e.payload as { stepNumber?: number }).stepNumber === step.stepNumber,
            ),
          ).length / experiment.procedure.length
        : 0;

  // --- Criteria map onto evidence; feedback is authored rubric text ---
  let criteriaScores: CriterionScore[] = experiment.assessmentCriteria.map((criterion) => {
    const isMeasurement = MEASUREMENT_CRITERION_PATTERN.test(
      `${criterion.name} ${criterion.description}`,
    );
    const fraction = isMeasurement ? measurementFraction : procedureFraction;
    const score = Math.round(criterion.maxMarks * fraction);
    const base = rubricFeedback(criterion, score);
    const problems =
      isMeasurement && score < criterion.maxMarks && expectationFeedback.length > 0
        ? `${base} (${expectationFeedback.join('; ')})`
        : base;
    return {
      criterionId: criterion.id,
      criterionName: criterion.name,
      score,
      maxScore: criterion.maxMarks,
      feedback: problems,
    };
  });

  // Fall back to the procedure mark scheme when no criteria are authored.
  if (criteriaScores.length === 0) {
    criteriaScores = [
      {
        criterionId: 'crit_procedure',
        criterionName: 'Procedure',
        score: stepEarnedTotal,
        maxScore: stepMaxTotal,
        feedback: 'Scored from recorded step evidence',
      },
    ];
  }

  const totalScore = criteriaScores.reduce((sum, c) => sum + c.score, 0);
  const maxScore = criteriaScores.reduce((sum, c) => sum + c.maxScore, 0);
  return {
    totalScore,
    maxScore,
    percentageScore: maxScore > 0 ? Math.round((100 * totalScore) / maxScore) : 0,
    criteriaScores,
    stepScores,
  };
}
```

- [ ] **Step 3.3 — Fix the one tolerance gap in the data.** In `shared/experiments.ts`, the `microscope-use` experiment's expectedResults contain `{ condition: 'Magnification at x400', value: 400, unit: 'x' }`. Change it to:

```ts
      { condition: 'Magnification at x400', value: 400, tolerance: 0, unit: 'x' },
```

(Verified by audit: this is the only numeric expectation in the corpus without a tolerance.)

- [ ] **Step 3.4 — Run green, verify, commit:**

```bash
npx vitest run shared/lab-grading.test.ts shared/experiments.test.ts
npx tsc -b --noEmit && npm run typecheck:api
npx eslint shared
git add shared && git commit -m "feat: deterministic virtual lab grading engine in shared/lab-grading"
```

---

## Task 4: `workers/api/lab.ts` — session routes + API tests

**Interfaces:**
- Consumes: `shared/lab-grading.ts` (`gradeSession`, `LabEventInput`, payload types), `shared/experiments.ts` (`getExperimentBySlug`), `workers/api/auth-middleware.ts` (`requireAuth`), `workers/api/rate-limit.ts` (`checkRateLimit`, `RATE_LIMITS`), `workers/api/http.ts` (`parseLimit`, `parseBoundedJsonBody`), `workers/api/usage-limits.ts` (`isPremiumUser(userId, db)`), migration 362 tables.
- Produces: `labApp` (default-mounted at `/api/lab` in Task 5) with routes:
  - `POST /sessions` — body `{ experimentSlug: string, mode: 'guided' | 'sandbox' }` → 201 `{ success, data: { sessionId, graded, experimentSlug, mode } }`; 400 unknown slug / 403 `LAB_PREMIUM_REQUIRED`.
  - `POST /sessions/:id/events` — body `{ events: LabEventInput[] }` (≤200, each payload ≤8KB serialized) → 200 `{ success, data: { accepted, duplicates } }`; 404 cross-user; 409 when session not `in_progress`.
  - `POST /sessions/:id/submit` → 200 `{ success, data: { graded: true, grading: GradingResult } }` or `{ success, data: { graded: false, reason: 'practice' } }`; 400 `SANDBOX_NOT_GRADABLE`; idempotent re-submit returns stored `grading_json`.
  - `GET /sessions?limit=` → `{ success, data: { sessions: [...] } }`.
  - `GET /sessions/:id` → `{ success, data: { session, events, grading } }`; 404 cross-user.
- Test file: `workers/api/__tests__/lab.test.ts`.

- [ ] **Step 4.1 — Write the failing API test suite.** Create `workers/api/__tests__/lab.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { sign } from 'hono/jwt';
import { labApp } from '../lab';
import { createMockD1, type MockD1 } from './helpers/mockD1';

const JWT_SECRET = 'test-secret-that-is-long-enough';

async function auth(userId = 'student_1') {
  const now = Math.floor(Date.now() / 1000);
  const token = await sign({ userId, role: 'student', sessionVersion: 0, iat: now, exp: now + 3600 }, JWT_SECRET);
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

interface SessionRow {
  id: string;
  user_id: string;
  experiment_slug: string;
  mode: string;
  status: string;
  graded: number;
  score: number | null;
  max_score: number | null;
  grading_json: string | null;
}

function dbWith(opts: {
  premium?: boolean;
  session?: SessionRow | null;
  events?: unknown[];
  eventChanges?: number;
  submitChanges?: number;
}): MockD1 {
  return createMockD1([
    {
      // requireAuth per-request user re-check
      match: /SELECT role, status, is_active, session_version FROM users WHERE id = \?/,
      first: () => ({ role: 'student', status: 'approved', is_active: 1, session_version: 0 }),
    },
    {
      // isPremiumUser
      match: /SELECT role, subscription_tier_id, subscription_expires_at, trial_expires_at/,
      first: () =>
        opts.premium
          ? { role: 'teacher', subscription_tier_id: null, subscription_expires_at: null, trial_expires_at: null }
          : { role: 'student', subscription_tier_id: null, subscription_expires_at: null, trial_expires_at: null },
    },
    {
      // checkRateLimit INSERT ... RETURNING
      match: /INSERT INTO rate_limits/,
      first: () => ({ request_count: 1, total_requests: 1 }),
    },
    { match: /INSERT INTO lab_sessions/, run: () => ({ success: true, meta: { changes: 1 } }) },
    {
      match: /SELECT \* FROM lab_sessions WHERE id = \?/,
      first: () => opts.session ?? null,
    },
    {
      // Submit's fall-through reload after a lost concurrent guarded update
      match: /SELECT grading_json FROM lab_sessions WHERE id = \?/,
      first: () => ({
        grading_json: JSON.stringify({
          totalScore: 0, maxScore: 20, percentageScore: 0, criteriaScores: [], stepScores: [],
        }),
      }),
    },
    {
      match: /INSERT OR IGNORE INTO lab_session_events/,
      run: () => ({ success: true, meta: { changes: opts.eventChanges ?? 1 } }),
    },
    {
      match: /SELECT .* FROM lab_session_events WHERE session_id = \?/,
      all: () => ({ results: opts.events ?? [] }),
    },
    {
      match: /UPDATE lab_sessions SET status = 'submitted'/,
      run: () => ({ success: true, meta: { changes: 1 } }) ,
    },
    {
      match: /UPDATE lab_sessions SET[\s\S]*WHERE id = \? AND status = 'in_progress'/,
      run: () => ({ success: true, meta: { changes: opts.submitChanges ?? 1 } }),
    },
    {
      match: /SELECT .* FROM lab_sessions WHERE user_id = \?/,
      all: () => ({ results: [] }),
    },
  ]);
}

const env = (db: MockD1) => ({ DB: db, JWT_SECRET });

const guidedSession: SessionRow = {
  id: 'sess_1', user_id: 'student_1', experiment_slug: 'acid-base-titration',
  mode: 'guided', status: 'in_progress', graded: 1, score: null, max_score: null, grading_json: null,
};

const seededEvents = [
  { event_type: 'action', payload: JSON.stringify({ actionType: 'pour', targetApparatus: 'app_burette', stepNumber: 1 }) },
  { event_type: 'measurement', payload: JSON.stringify({ value: 25, unit: 'ml', label: 'Titre', condition: 'Average titre value', stepNumber: 7 }) },
];

describe('POST /sessions', () => {
  it('requires auth', async () => {
    const res = await labApp.request('/sessions', { method: 'POST', body: '{}' }, env(dbWith({})));
    expect(res.status).toBe(401);
  });

  it('rejects an unknown experiment slug', async () => {
    const res = await labApp.request(
      '/sessions',
      { method: 'POST', headers: await auth(), body: JSON.stringify({ experimentSlug: 'nope', mode: 'guided' }) },
      env(dbWith({})),
    );
    expect(res.status).toBe(400);
  });

  it('403 LAB_PREMIUM_REQUIRED for a free user starting a premium experiment', async () => {
    // Synthetic premium flag: the corpus ships no premium experiments yet, so
    // the route exposes an internal test hook — see TEST_PREMIUM_SLUG in lab.ts.
    const res = await labApp.request(
      '/sessions',
      { method: 'POST', headers: await auth(), body: JSON.stringify({ experimentSlug: '__test_premium__', mode: 'guided' }) },
      env(dbWith({ premium: false })),
    );
    expect(res.status).toBe(403);
    expect((await res.json() as any).code).toBe('LAB_PREMIUM_REQUIRED');
  });

  it('creates a guided session for a free experiment and stamps graded=1', async () => {
    const db = dbWith({});
    const res = await labApp.request(
      '/sessions',
      { method: 'POST', headers: await auth(), body: JSON.stringify({ experimentSlug: 'acid-base-titration', mode: 'guided' }) },
      env(db),
    );
    expect(res.status).toBe(201);
    const body = await res.json() as any;
    expect(body.data.graded).toBe(1);
    expect(typeof body.data.sessionId).toBe('string');
  });

  it('creates a PhET session with graded=0 (practice mode)', async () => {
    const res = await labApp.request(
      '/sessions',
      { method: 'POST', headers: await auth(), body: JSON.stringify({ experimentSlug: 'ohms-law', mode: 'guided' }) },
      env(dbWith({})),
    );
    expect(res.status).toBe(201);
    expect((await res.json() as any).data.graded).toBe(0);
  });
});

describe('POST /sessions/:id/events', () => {
  const batch = {
    events: [
      { clientEventId: 'c1', eventType: 'action', payload: { actionType: 'pour', targetApparatus: 'app_burette', stepNumber: 1 } },
      { clientEventId: 'c2', eventType: 'measurement', payload: { value: 25.1, unit: 'ml', label: 'Titre', condition: 'Average titre value', stepNumber: 7 } },
    ],
  };

  it('accepts a batch and reports counts', async () => {
    const res = await labApp.request(
      '/sessions/sess_1/events',
      { method: 'POST', headers: await auth(), body: JSON.stringify(batch) },
      env(dbWith({ session: guidedSession })),
    );
    expect(res.status).toBe(200);
    expect((await res.json() as any).data).toEqual({ accepted: 2, duplicates: 0 });
  });

  it('is idempotent: re-sent batch reports duplicates, no new rows', async () => {
    const res = await labApp.request(
      '/sessions/sess_1/events',
      { method: 'POST', headers: await auth(), body: JSON.stringify(batch) },
      env(dbWith({ session: guidedSession, eventChanges: 0 })),
    );
    expect((await res.json() as any).data).toEqual({ accepted: 0, duplicates: 2 });
  });

  it('404s a session owned by another user (no existence leak)', async () => {
    const res = await labApp.request(
      '/sessions/sess_1/events',
      { method: 'POST', headers: await auth('student_2'), body: JSON.stringify(batch) },
      env(dbWith({ session: guidedSession })),
    );
    expect(res.status).toBe(404);
  });

  it('409s when the session is no longer in_progress', async () => {
    const res = await labApp.request(
      '/sessions/sess_1/events',
      { method: 'POST', headers: await auth(), body: JSON.stringify(batch) },
      env(dbWith({ session: { ...guidedSession, status: 'graded' } })),
    );
    expect(res.status).toBe(409);
  });

  it('400s on unknown event types and oversized batches', async () => {
    const headers = await auth();
    const bad = await labApp.request(
      '/sessions/sess_1/events',
      { method: 'POST', headers, body: JSON.stringify({ events: [{ clientEventId: 'x', eventType: 'teleport', payload: {} }] }) },
      env(dbWith({ session: guidedSession })),
    );
    expect(bad.status).toBe(400);

    const tooMany = await labApp.request(
      '/sessions/sess_1/events',
      { method: 'POST', headers, body: JSON.stringify({ events: Array.from({ length: 201 }, (_, i) => ({ clientEventId: `c${i}`, eventType: 'observation', payload: { text: 'x' } })) }) },
      env(dbWith({ session: guidedSession })),
    );
    expect(tooMany.status).toBe(400);
  });
});

describe('POST /sessions/:id/submit', () => {
  it('grades deterministically against seeded events', async () => {
    const db = dbWith({ session: guidedSession, events: seededEvents });
    const res = await labApp.request('/sessions/sess_1/submit', { method: 'POST', headers: await auth() }, env(db));
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.data.graded).toBe(true);
    expect(body.data.grading.maxScore).toBeGreaterThan(0);
    // The guarded UPDATE carries the grading breakdown.
    const write = db.calls.find((c) => /UPDATE lab_sessions SET[\s\S]*status = 'graded'/.test(c.sql));
    expect(write).toBeDefined();
    expect(JSON.parse(String(write!.binds[2]))).toEqual(body.data.grading);
  });

  it('re-submit returns the stored result without re-grading', async () => {
    const graded: SessionRow = {
      ...guidedSession, status: 'graded', score: 12, max_score: 20,
      grading_json: JSON.stringify({ totalScore: 12, maxScore: 20, percentageScore: 60, criteriaScores: [], stepScores: [] }),
    };
    const db = dbWith({ session: graded });
    const res = await labApp.request('/sessions/sess_1/submit', { method: 'POST', headers: await auth() }, env(db));
    const body = await res.json() as any;
    expect(body.data.grading.totalScore).toBe(12);
    expect(db.calls.some((c) => /INSERT INTO lab_sessions/.test(c.sql))).toBe(false);
  });

  it('falls through to the stored result when a concurrent submit wins the guarded update', async () => {
    const db = dbWith({ session: guidedSession, events: seededEvents, submitChanges: 0 });
    const res = await labApp.request('/sessions/sess_1/submit', { method: 'POST', headers: await auth() }, env(db));
    expect(res.status).toBe(200); // returns reloaded stored row, not an error
  });

  it('PhET session submit marks submitted and returns practice semantics', async () => {
    const phet: SessionRow = { ...guidedSession, experiment_slug: 'ohms-law', graded: 0 };
    const res = await labApp.request('/sessions/sess_1/submit', { method: 'POST', headers: await auth() }, env(dbWith({ session: phet })));
    expect(res.status).toBe(200);
    expect((await res.json() as any).data).toEqual({ graded: false, reason: 'practice' });
  });

  it('sandbox sessions cannot be submitted', async () => {
    const sandbox: SessionRow = { ...guidedSession, mode: 'sandbox' };
    const res = await labApp.request('/sessions/sess_1/submit', { method: 'POST', headers: await auth() }, env(dbWith({ session: sandbox })));
    expect(res.status).toBe(400);
    expect((await res.json() as any).code).toBe('SANDBOX_NOT_GRADABLE');
  });

  it('404s a cross-user submit', async () => {
    const res = await labApp.request('/sessions/sess_1/submit', { method: 'POST', headers: await auth('student_2') }, env(dbWith({ session: guidedSession })));
    expect(res.status).toBe(404);
  });
});

describe('GET /sessions and /sessions/:id', () => {
  it('lists only the caller\'s sessions', async () => {
    const db = dbWith({});
    await labApp.request('/sessions', { headers: await auth() }, env(db));
    const listCall = db.calls.find((c) => /FROM lab_sessions WHERE user_id = \?/.test(c.sql) && /ORDER BY created_at DESC/.test(c.sql));
    expect(listCall?.binds[0]).toBe('student_1');
  });

  it('returns detail with events and stored grading; 404 cross-user', async () => {
    const ok = await labApp.request('/sessions/sess_1', { headers: await auth() }, env(dbWith({ session: guidedSession, events: seededEvents })));
    expect(ok.status).toBe(200);
    expect(((await ok.json()) as any).data.events).toHaveLength(2);

    const denied = await labApp.request('/sessions/sess_1', { headers: await auth('student_2') }, env(dbWith({ session: guidedSession })));
    expect(denied.status).toBe(404);
  });
});
```

Run to confirm failure: `npx vitest run workers/api/__tests__/lab.test.ts`.

- [ ] **Step 4.2 — Implement `workers/api/lab.ts`:**

```ts
import { Hono } from 'hono';
import { requireAuth } from './auth-middleware';
import type { AuthPayload } from './auth-middleware';
import { checkRateLimit } from './rate-limit';
import type { RateLimitResult } from './rate-limit';
import { parseLimit, parseBoundedJsonBody } from './http';
import { isPremiumUser } from './usage-limits';
import { getExperimentBySlug } from '../../shared/experiments';
import { gradeSession } from '../../shared/lab-grading';
import type {
  Experiment,
  LabEventInput,
  LabEventType,
  GradingResult,
} from '../../shared/lab-grading';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

interface AuthVars {
  userId: string;
  userRole: string;
  user: AuthPayload;
}

const MAX_EVENTS_PER_BATCH = 200;
const MAX_EVENT_PAYLOAD_BYTES = 8 * 1024;
const MAX_EVENTS_BODY_BYTES = 2 * 1024 * 1024;

interface LabSessionRow {
  id: string;
  user_id: string;
  experiment_slug: string;
  mode: 'guided' | 'sandbox';
  status: 'in_progress' | 'submitted' | 'graded';
  graded: 0 | 1;
  score: number | null;
  max_score: number | null;
  grading_json: string | null;
  started_at: string;
  submitted_at: string | null;
  created_at: string;
}

function generateId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

function rateLimited(c: any, result: RateLimitResult) {
  return c.json(
    { success: false, error: 'Too many requests. Please slow down.', retryAfter: result.retryAfter },
    429,
  );
}

const EVENT_TYPES: readonly LabEventType[] = ['measurement', 'action', 'observation', 'step_complete'];

/** Strict per-type payload validation. Unknown shapes never reach the DB. */
function isValidEventPayload(eventType: LabEventType, payload: unknown): boolean {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return false;
  const p = payload as Record<string, unknown>;
  const optStep = p.stepNumber === undefined || Number.isInteger(p.stepNumber);
  if (!optStep) return false;
  switch (eventType) {
    case 'measurement':
      return (
        typeof p.value === 'number' && Number.isFinite(p.value) &&
        typeof p.unit === 'string' && p.unit.length <= 32 &&
        typeof p.label === 'string' && p.label.length > 0 && p.label.length <= 200 &&
        (p.condition === undefined || typeof p.condition === 'string') &&
        (p.apparatusId === undefined || typeof p.apparatusId === 'string')
      );
    case 'action':
      return (
        typeof p.actionType === 'string' &&
        ['drag', 'connect', 'adjust', 'measure', 'record', 'observe', 'pour', 'heat'].includes(p.actionType) &&
        typeof p.targetApparatus === 'string' && p.targetApparatus.length <= 100 &&
        (p.value === undefined || typeof p.value === 'number')
      );
    case 'observation':
      return typeof p.text === 'string' && p.text.length > 0 && p.text.length <= 2000;
    case 'step_complete':
      return Number.isInteger(p.stepNumber);
  }
}

async function loadOwnedSession(
  db: D1Database,
  sessionId: string,
  userId: string,
): Promise<LabSessionRow | null> {
  const row = await db
    .prepare(`SELECT * FROM lab_sessions WHERE id = ?`)
    .bind(sessionId)
    .first<LabSessionRow>();
  // Ownership is invisible: cross-user access looks exactly like "not found".
  if (!row || row.user_id !== userId) return null;
  return row;
}

export const labApp = new Hono<{ Bindings: Env; Variables: AuthVars }>();

labApp.use('*', requireAuth);

// Test hook: the corpus ships no premium experiments yet, so this synthetic
// slug exercises the gate in unit tests. It is not a real experiment.
const TEST_PREMIUM_SLUG = '__test_premium__';
const TEST_PREMIUM_EXPERIMENT: Experiment = {
  ...getExperimentBySlug('acid-base-titration')!,
  id: 'exp_test_premium',
  slug: TEST_PREMIUM_SLUG,
  isPremium: true,
};

function resolveExperiment(slug: string): Experiment | undefined {
  if (slug === TEST_PREMIUM_SLUG) return TEST_PREMIUM_EXPERIMENT;
  const exp = getExperimentBySlug(slug);
  return exp && exp.isActive ? exp : undefined;
}

// --- POST /sessions ---------------------------------------------------------
labApp.post('/sessions', async (c) => {
  const userId = c.get('userId');
  const limit = await checkRateLimit(c.env.DB, userId, 'lab-session-start');
  if (!limit.allowed) return rateLimited(c, limit);

  const body = await c.req.json().catch(() => null);
  const slug = typeof body?.experimentSlug === 'string' ? body.experimentSlug : '';
  const mode = body?.mode;
  if (mode !== 'guided' && mode !== 'sandbox') {
    return c.json({ success: false, error: 'mode must be guided or sandbox' }, 400);
  }
  const experiment = resolveExperiment(slug);
  if (!experiment) {
    return c.json({ success: false, error: 'Unknown experiment' }, 400);
  }

  if (experiment.isPremium && !(await isPremiumUser(userId, c.env.DB))) {
    return c.json(
      {
        success: false,
        error: 'This experiment requires an active premium plan.',
        code: 'LAB_PREMIUM_REQUIRED',
      },
      403,
    );
  }

  const sessionId = generateId('lab_sess');
  // PhET/practice sessions are tracked but never graded.
  const graded = experiment.simulationType === 'phet' ? 0 : 1;
  await c.env.DB.prepare(
    `INSERT INTO lab_sessions (id, user_id, experiment_slug, mode, graded) VALUES (?, ?, ?, ?, ?)`,
  )
    .bind(sessionId, userId, experiment.slug, mode, graded)
    .run();

  return c.json(
    { success: true, data: { sessionId, graded, experimentSlug: experiment.slug, mode } },
    201,
  );
});

// --- POST /sessions/:id/events ----------------------------------------------
labApp.post('/sessions/:id/events', async (c) => {
  const userId = c.get('userId');
  const limit = await checkRateLimit(c.env.DB, userId, 'lab-events');
  if (!limit.allowed) return rateLimited(c, limit);

  const session = await loadOwnedSession(c.env.DB, c.req.param('id'), userId);
  if (!session) return c.json({ success: false, error: 'Session not found' }, 404);
  if (session.status !== 'in_progress') {
    return c.json({ success: false, error: 'Session is no longer in progress' }, 409);
  }

  const parsed = await parseBoundedJsonBody(c, MAX_EVENTS_BODY_BYTES);
  if (!parsed.ok) return c.json({ success: false, error: 'Invalid request body' }, 400);
  const events = (parsed.body as { events?: unknown }).events;
  if (!Array.isArray(events) || events.length === 0 || events.length > MAX_EVENTS_PER_BATCH) {
    return c.json({ success: false, error: `events must be an array of 1-${MAX_EVENTS_PER_BATCH}` }, 400);
  }

  const valid: LabEventInput[] = [];
  for (const raw of events) {
    const e = raw as Partial<LabEventInput>;
    if (
      typeof e?.clientEventId !== 'string' || e.clientEventId.length === 0 || e.clientEventId.length > 100 ||
      typeof e?.eventType !== 'string' || !EVENT_TYPES.includes(e.eventType as LabEventType) ||
      !isValidEventPayload(e.eventType as LabEventType, e.payload) ||
      JSON.stringify(e.payload).length > MAX_EVENT_PAYLOAD_BYTES
    ) {
      return c.json({ success: false, error: 'Invalid event in batch' }, 400);
    }
    valid.push(e as LabEventInput);
  }

  // INSERT OR IGNORE on UNIQUE(session_id, client_event_id): retries and
  // offline re-syncs are naturally idempotent.
  const statements = valid.map((e) =>
    c.env.DB.prepare(
      `INSERT OR IGNORE INTO lab_session_events (id, session_id, client_event_id, event_type, payload)
       VALUES (?, ?, ?, ?, ?)`,
    ).bind(generateId('lab_evt'), session.id, e.clientEventId, e.eventType, JSON.stringify(e.payload)),
  );
  const results = await c.env.DB.batch(statements);
  const accepted = results.reduce(
    (sum, r) => sum + (((r as { meta?: { changes?: number } }).meta?.changes ?? 0) > 0 ? 1 : 0),
    0,
  );

  return c.json({ success: true, data: { accepted, duplicates: valid.length - accepted } });
});

// --- POST /sessions/:id/submit -----------------------------------------------
labApp.post('/sessions/:id/submit', async (c) => {
  const userId = c.get('userId');
  const limit = await checkRateLimit(c.env.DB, userId, 'lab-submit');
  if (!limit.allowed) return rateLimited(c, limit);

  const session = await loadOwnedSession(c.env.DB, c.req.param('id'), userId);
  if (!session) return c.json({ success: false, error: 'Session not found' }, 404);

  const experiment = resolveExperiment(session.experiment_slug);
  if (!experiment) return c.json({ success: false, error: 'Unknown experiment' }, 400);

  // PhET practice: finish marks the session submitted, never graded.
  if (experiment.simulationType === 'phet') {
    if (session.status === 'in_progress') {
      await c.env.DB.prepare(
        `UPDATE lab_sessions SET status = 'submitted', submitted_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
      ).bind(session.id).run();
    }
    return c.json({ success: true, data: { graded: false, reason: 'practice' } });
  }

  if (session.mode === 'sandbox') {
    return c.json(
      { success: false, error: 'Sandbox sessions are not graded.', code: 'SANDBOX_NOT_GRADABLE' },
      400,
    );
  }

  // Idempotent re-submit: return the stored breakdown, never re-grade.
  if (session.status === 'graded' && session.grading_json) {
    return c.json({
      success: true,
      data: { graded: true, grading: JSON.parse(session.grading_json) as GradingResult },
    });
  }

  const { results: eventRows } = await c.env.DB.prepare(
    `SELECT client_event_id, event_type, payload FROM lab_session_events WHERE session_id = ? ORDER BY created_at`,
  ).bind(session.id).all<{ client_event_id: string; event_type: LabEventType; payload: string }>();

  const events: LabEventInput[] = eventRows.map((r) => ({
    clientEventId: r.client_event_id,
    eventType: r.event_type,
    payload: JSON.parse(r.payload),
  }));
  const grading = gradeSession(experiment, events);

  // Guarded transition: a concurrent submit affects zero rows and falls
  // through to returning the stored result.
  const write = await c.env.DB.prepare(
    `UPDATE lab_sessions
     SET status = 'graded', score = ?, max_score = ?, grading_json = ?,
         submitted_at = datetime('now'), updated_at = datetime('now')
     WHERE id = ? AND status = 'in_progress'`,
  )
    .bind(grading.totalScore, grading.maxScore, JSON.stringify(grading), session.id)
    .run();

  if (write.meta.changes === 0) {
    const stored = await c.env.DB.prepare(
      `SELECT grading_json FROM lab_sessions WHERE id = ?`,
    ).bind(session.id).first<{ grading_json: string | null }>();
    if (stored?.grading_json) {
      return c.json({
        success: true,
        data: { graded: true, grading: JSON.parse(stored.grading_json) as GradingResult },
      });
    }
    return c.json({ success: false, error: 'Session is not gradable in its current state' }, 409);
  }

  return c.json({ success: true, data: { graded: true, grading } });
});

// --- GET /sessions ------------------------------------------------------------
labApp.get('/sessions', async (c) => {
  const userId = c.get('userId');
  const limit = await checkRateLimit(c.env.DB, userId, 'lab-read');
  if (!limit.allowed) return rateLimited(c, limit);

  const take = parseLimit(c, 20, 100);
  const { results } = await c.env.DB.prepare(
    `SELECT id, experiment_slug, mode, status, graded, score, max_score, started_at, submitted_at, created_at
     FROM lab_sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
  ).bind(userId, take).all();
  const sessions = results.map((r: any) => ({
    ...r,
    experimentName: resolveExperiment(r.experiment_slug)?.name ?? r.experiment_slug,
  }));
  return c.json({ success: true, data: { sessions } });
});

// --- GET /sessions/:id ---------------------------------------------------------
labApp.get('/sessions/:id', async (c) => {
  const userId = c.get('userId');
  const limit = await checkRateLimit(c.env.DB, userId, 'lab-read');
  if (!limit.allowed) return rateLimited(c, limit);

  const session = await loadOwnedSession(c.env.DB, c.req.param('id'), userId);
  if (!session) return c.json({ success: false, error: 'Session not found' }, 404);

  const { results: events } = await c.env.DB.prepare(
    `SELECT client_event_id, event_type, payload, created_at FROM lab_session_events WHERE session_id = ? ORDER BY created_at`,
  ).bind(session.id).all();

  return c.json({
    success: true,
    data: {
      session,
      events,
      grading: session.grading_json ? JSON.parse(session.grading_json) : null,
    },
  });
});
```

- [ ] **Step 4.3 — Run green, verify, commit:**

```bash
npx vitest run workers/api/__tests__/lab.test.ts
npm run typecheck:api
npx eslint workers/api/lab.ts workers/api/__tests__/lab.test.ts
git add workers/api/lab.ts workers/api/__tests__/lab.test.ts
git commit -m "feat: lab session API with idempotent event ingestion and server-side grading"
```

---

## Task 5: Mount `/api/lab`, rate-limit entries, frontend API client methods

**Interfaces:**
- Consumes: `labApp` (Task 4); `workers/api/index.ts` satellite mount block at lines 12200-12266; `workers/api/rate-limit.ts` `RATE_LIMITS` (line 28); `src/lib/api.ts` `ApiClient` class.
- Produces:
  - `RATE_LIMITS` entries: `lab-session-start` (20/hour), `lab-events` (120/min, `failureMode: 'closed'`), `lab-submit` (10/hour), `lab-read` (60/min).
  - `app.route('/api/lab', labApp)` in `index.ts`.
  - Typed methods on `api` in `src/lib/api.ts`.

- [ ] **Step 5.1 — Add rate-limit entries** in `workers/api/rate-limit.ts` after the `"question-attempt-write"` entry (line 87):

```ts
  "lab-session-start": {
    maxRequests: 20,
    windowMs: 60 * 60 * 1000, // 20 new lab sessions per user per hour
    failureMode: "closed",
  },
  "lab-events": {
    maxRequests: 120,
    windowMs: 60 * 1000, // event bursts during active sim use
    failureMode: "closed",
  },
  "lab-submit": {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 10 submits per user per hour
    failureMode: "closed",
  },
  "lab-read": {
    maxRequests: 60,
    windowMs: 60 * 1000, // history/detail reads
  },
```

- [ ] **Step 5.2 — Mount the router** in `workers/api/index.ts`. Add the import near the other router imports (~line 75), and the mount after `app.route('/api/recordings', recordingsApp);` (line 12227):

```ts
import { labApp } from './lab';
```

```ts
app.route('/api/recordings', recordingsApp);
app.route('/api/lab', labApp);
```

- [ ] **Step 5.3 — Add API client methods** in `src/lib/api.ts` inside `ApiClient` (before the closing brace at line 309), importing the shared types at the top of the file:

```ts
import type { GradingResult, LabEventInput, LabMode } from '../../shared/lab-grading';
```

```ts
  // =============================================
  // VIRTUAL LAB ENDPOINTS
  // =============================================

  async startLabSession(experimentSlug: string, mode: LabMode) {
    return this.post<{ sessionId: string; graded: 0 | 1; experimentSlug: string; mode: LabMode }>(
      '/lab/sessions',
      { experimentSlug, mode },
    );
  }

  async appendLabEvents(sessionId: string, events: LabEventInput[]) {
    return this.post<{ accepted: number; duplicates: number }>(
      `/lab/sessions/${sessionId}/events`,
      { events },
    );
  }

  async submitLabSession(sessionId: string) {
    return this.post<
      | { graded: true; grading: GradingResult }
      | { graded: false; reason: 'practice' }
    >(`/lab/sessions/${sessionId}/submit`);
  }

  async getLabSessions(limit = 20) {
    return this.get<{ sessions: LabSessionSummary[] }>(`/lab/sessions?limit=${limit}`);
  }

  async getLabSession(sessionId: string) {
    return this.get<{ session: LabSessionSummary; events: unknown[]; grading: GradingResult | null }>(
      `/lab/sessions/${sessionId}`,
    );
  }
```

and add the DTO near the other client types:

```ts
export interface LabSessionSummary {
  id: string;
  experiment_slug: string;
  experimentName?: string;
  mode: 'guided' | 'sandbox';
  status: 'in_progress' | 'submitted' | 'graded';
  graded: 0 | 1;
  score: number | null;
  max_score: number | null;
  started_at: string;
  submitted_at: string | null;
  created_at: string;
}
```

- [ ] **Step 5.4 — Verify and commit:**

```bash
npm run typecheck:api && npx tsc -b --noEmit
npx vitest run workers/api/__tests__/lab.test.ts workers/api/__tests__/atomic-rate-limit.test.ts src/lib
npx eslint workers/api/index.ts workers/api/rate-limit.ts src/lib/api.ts
git add workers/api/index.ts workers/api/rate-limit.ts src/lib/api.ts
git commit -m "feat: mount /api/lab router with per-user rate limits and lab API client"
```

---

## Task 6: labStore rework — event queue, batched sync, offline retry, honest submit

**Interfaces:**
- Consumes: `api.startLabSession` / `appendLabEvents` / `submitLabSession` (Task 5); shared `LabEventInput`, `GradingResult`.
- Produces (changed/new members on `useLabStore`):
  - State: `serverSessionId: string | null`, `eventQueue: LabEventInput[]`, `syncStatus: 'idle' | 'syncing' | 'retry_scheduled'`, `submitPending: boolean`.
  - `startSession(experiment: Experiment, mode: LabMode): Promise<void>` (now async — see below).
  - `recordMeasurement(value: number, unit: string, label: string, condition?: string, apparatusId?: string): void` — **signature change** (old: `(apparatusId, value, unit)`; the only caller is the data-table UI inside `LabWorkspace.tsx`, updated in Task 7).
  - `recordAction(actionType: LabActionType, targetApparatus: string, value?: number): void` — **signature change** (old: `(action: PerformedAction)`; no callers outside labStore today — verified by grep).
  - `recordObservation(text: string): void` — new; `addObservation(text)` keeps its signature and additionally enqueues.
  - `completeStep()` additionally enqueues a `step_complete` event.
  - `flushEventQueue(): Promise<void>` — public for submit; auto-flush at ≥20 queued events and on a 15s timer.
  - `submitExperiment(): Promise<GradingResult>` — now a server call; throws on failure (UI shows "grading pending").
  - `finishPractice(): Promise<void>` — PhET path.
  - **Deleted:** the `measurementAccuracy = 70` stub (old line 517), the canned `'Excellent work! …'` / `'Good work!'` / `'Needs improvement'` feedback strings (old lines 533-546), and the self-report percentage scoring (old lines 512-522).

- [ ] **Step 6.1 — Write the failing store tests.** Create `src/stores/__tests__/labStore.sync.test.ts`:

```ts
// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api';
import { useLabStore } from '../labStore';
import { getExperimentBySlug } from '@/data/experiments';

vi.mock('@/lib/api', () => ({
  api: {
    startLabSession: vi.fn(),
    appendLabEvents: vi.fn(),
    submitLabSession: vi.fn(),
  },
}));

const titration = getExperimentBySlug('acid-base-titration')!;
const phet = getExperimentBySlug('ohms-law')!;

const okStart = { success: true, data: { sessionId: 'srv_1', graded: 1, experimentSlug: titration.slug, mode: 'guided' } };

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  useLabStore.getState().reset();
  (api.startLabSession as any).mockResolvedValue(okStart);
  // Echo the batch size: the store drops exactly the events the server
  // acknowledged (accepted + duplicates).
  (api.appendLabEvents as any).mockImplementation((_id: string, events: unknown[]) =>
    Promise.resolve({ success: true, data: { accepted: events.length, duplicates: 0 } }),
  );
});

afterEach(() => {
  vi.useRealTimers();
});

describe('labStore server sync', () => {
  it('startSession creates a server session and keeps the returned id', async () => {
    await useLabStore.getState().startSession(titration, 'guided');
    expect(api.startLabSession).toHaveBeenCalledWith('acid-base-titration', 'guided');
    expect(useLabStore.getState().serverSessionId).toBe('srv_1');
  });

  it('queued events carry stable clientEventIds and persist via the store snapshot', async () => {
    await useLabStore.getState().startSession(titration, 'guided');
    useLabStore.getState().recordMeasurement(25.1, 'ml', 'Titre value 1', 'Average titre value');
    const queue = useLabStore.getState().eventQueue;
    expect(queue).toHaveLength(1);
    expect(queue[0]).toMatchObject({ eventType: 'measurement' });
    expect(typeof queue[0].clientEventId).toBe('string');

    // The queue must be in the persisted (partialized) snapshot.
    const persisted = JSON.parse(localStorage.getItem('brilla-lab')!);
    expect(persisted.state.eventQueue).toHaveLength(1);
  });

  it('auto-flushes at 20 queued events', async () => {
    await useLabStore.getState().startSession(titration, 'guided');
    for (let i = 0; i < 20; i++) {
      useLabStore.getState().recordObservation(`note ${i}`);
    }
    await vi.waitFor(() => expect(api.appendLabEvents).toHaveBeenCalled());
    const [, events] = (api.appendLabEvents as any).mock.calls[0];
    expect(events).toHaveLength(20);
    expect(useLabStore.getState().eventQueue).toHaveLength(0);
  });

  it('a failed flush retains the queue and retries without duplicating clientEventIds', async () => {
    vi.useFakeTimers();
    (api.appendLabEvents as any).mockRejectedValueOnce(new Error('offline'));
    await useLabStore.getState().startSession(titration, 'guided');
    useLabStore.getState().recordObservation('bubbles');
    await useLabStore.getState().flushEventQueue();
    expect(useLabStore.getState().eventQueue).toHaveLength(1); // retained

    const firstIds = useLabStore.getState().eventQueue.map((e) => e.clientEventId);
    await useLabStore.getState().flushEventQueue(); // retry succeeds
    const sentIds = (api.appendLabEvents as any).mock.calls[1][1].map((e: any) => e.clientEventId);
    expect(sentIds).toEqual(firstIds); // same ids — server dedupes via INSERT OR IGNORE
    expect(useLabStore.getState().eventQueue).toHaveLength(0);
  });

  it('submitExperiment flushes, posts submit, and stores the server grading breakdown', async () => {
    const grading = {
      totalScore: 12, maxScore: 20, percentageScore: 60,
      criteriaScores: [{ criterionId: 'c', criterionName: 'Technique', score: 12, maxScore: 20, feedback: 'Good technique with minor issues' }],
      stepScores: [{ stepNumber: 1, marksEarned: 2, maxMarks: 2, evidence: 'full', feedback: 'All required actions observed' }],
    };
    (api.submitLabSession as any).mockResolvedValue({ success: true, data: { graded: true, grading } });
    await useLabStore.getState().startSession(titration, 'guided');
    const result = await useLabStore.getState().submitExperiment();
    expect(result).toEqual(grading);
    expect(useLabStore.getState().lastAttemptResult).toEqual(grading);
  });

  it('submitExperiment failure sets an honest pending state — no fabricated score', async () => {
    (api.submitLabSession as any).mockResolvedValue({ success: false, error: 'Network error.' });
    await useLabStore.getState().startSession(titration, 'guided');
    await expect(useLabStore.getState().submitExperiment()).rejects.toThrow();
    expect(useLabStore.getState().lastAttemptResult).toBeNull();
    expect(useLabStore.getState().submitPending).toBe(true);
  });

  it('finishPractice marks PhET sessions submitted with no score', async () => {
    (api.startLabSession as any).mockResolvedValue({ ...okStart, data: { ...okStart.data, graded: 0 } });
    (api.submitLabSession as any).mockResolvedValue({ success: true, data: { graded: false, reason: 'practice' } });
    await useLabStore.getState().startSession(phet, 'guided');
    await useLabStore.getState().finishPractice();
    expect(api.submitLabSession).toHaveBeenCalledWith('srv_1');
    expect(useLabStore.getState().lastAttemptResult).toBeNull();
  });

  it('LAB_PREMIUM_REQUIRED surfaces as an error and rolls back the local session', async () => {
    (api.startLabSession as any).mockResolvedValue({
      success: false, error: 'This experiment requires an active premium plan.', code: 'LAB_PREMIUM_REQUIRED',
    });
    await useLabStore.getState().startSession(titration, 'guided');
    expect(useLabStore.getState().error).toBe('LAB_PREMIUM_REQUIRED');
    expect(useLabStore.getState().currentSession).toBeNull();
  });
});
```

Run to confirm failure: `npx vitest run src/stores/__tests__/labStore.sync.test.ts`.

- [ ] **Step 6.2 — Rework `src/stores/labStore.ts`.** Key edits (apply on top of the existing file; keep apparatus/canvas/timer actions untouched):

Add imports and state:

```ts
import { api } from '@/lib/api';
import type { LabEventInput, LabActionType } from '@/types';
```

Add to `LabState` interface and `initialState`:

```ts
  // Server sync
  serverSessionId: string | null;
  eventQueue: LabEventInput[];
  syncStatus: 'idle' | 'syncing' | 'retry_scheduled';
  submitPending: boolean;
```

```ts
// initialState additions:
  serverSessionId: null,
  eventQueue: [],
  syncStatus: 'idle' as const,
  submitPending: false,
```

Module-scope flush timer helpers (above the store creation):

```ts
const FLUSH_BATCH_SIZE = 20;
const FLUSH_INTERVAL_MS = 15_000;
const RETRY_DELAYS_MS = [15_000, 30_000, 60_000];

let flushTimer: ReturnType<typeof setInterval> | null = null;
let retryCount = 0;
```

Change the action signatures in the interface:

```ts
  startSession: (experiment: Experiment, mode: LabMode) => Promise<void>;
  recordMeasurement: (value: number, unit: string, label: string, condition?: string, apparatusId?: string) => void;
  recordAction: (actionType: LabActionType, targetApparatus: string, value?: number) => void;
  recordObservation: (text: string) => void;
  flushEventQueue: () => Promise<void>;
  finishPractice: () => Promise<void>;
```

Implement `startSession` (replace the sync version at lines 173-211; local state is set optimistically, then the server session is created — on `LAB_PREMIUM_REQUIRED` the local session is rolled back):

```ts
      startSession: async (experiment, mode) => {
        const user = getCurrentUser();
        const userId = user?.id || 'anonymous';

        const session: LabSession = {
          id: `lab_${Date.now()}`,
          userId,
          experimentId: experiment.id,
          mode,
          status: 'in_progress',
          currentStepIndex: 0,
          startedAt: new Date().toISOString(),
          timeSpent: 0,
          stepProgress: experiment.procedure.map((step) => ({
            stepNumber: step.stepNumber,
            isCompleted: false,
            actionsPerformed: [],
            marksEarned: 0,
          })),
          measurements: [],
          observations: [],
        };

        set({
          currentSession: session,
          currentExperiment: experiment,
          mode,
          currentStepIndex: 0,
          stepCompletionStatus: new Array(experiment.procedure.length).fill(false),
          activeApparatus: [],
          connections: [],
          measurements: [],
          observations: [],
          timeSpent: 0,
          isTimerRunning: true,
          isProcedurePanelOpen: true,
          lastAttemptResult: null,
          serverSessionId: null,
          eventQueue: [],
          submitPending: false,
          error: null,
        });

        // Start the periodic flush for this session.
        if (flushTimer) clearInterval(flushTimer);
        retryCount = 0;
        flushTimer = setInterval(() => {
          void get().flushEventQueue();
        }, FLUSH_INTERVAL_MS);

        const res = await api.startLabSession(experiment.slug, mode);
        if (!res.success || !res.data) {
          if (flushTimer) { clearInterval(flushTimer); flushTimer = null; }
          set({ ...initialState, error: res.code ?? res.error ?? 'Failed to start lab session' });
          return;
        }
        set({ serverSessionId: res.data.sessionId });
      },
```

Add the queue machinery:

```ts
      enqueueEvent: (eventType, payload) => {
        const event: LabEventInput = {
          clientEventId: crypto.randomUUID(),
          eventType,
          payload,
        };
        set((state) => ({ eventQueue: [...state.eventQueue, event] }));
        if (get().eventQueue.length >= FLUSH_BATCH_SIZE) {
          void get().flushEventQueue();
        }
      },

      flushEventQueue: async () => {
        const { eventQueue, serverSessionId, syncStatus } = get();
        if (!serverSessionId || eventQueue.length === 0 || syncStatus === 'syncing') return;

        const batch = eventQueue.slice(0, 200);
        set({ syncStatus: 'syncing' });
        try {
          const res = await api.appendLabEvents(serverSessionId, batch);
          if (!res.success) throw new Error(res.error ?? 'flush failed');
          // Only drop events the server accepted or explicitly deduped.
          const acknowledged = (res.data?.accepted ?? 0) + (res.data?.duplicates ?? 0);
          set((state) => ({
            eventQueue: state.eventQueue.slice(acknowledged),
            syncStatus: 'idle',
          }));
          retryCount = 0;
        } catch {
          // Offline resilience: the queue persists in localStorage and retries
          // with backoff; server-side idempotency makes re-sends safe.
          retryCount = Math.min(retryCount + 1, RETRY_DELAYS_MS.length);
          set({ syncStatus: 'retry_scheduled' });
          setTimeout(() => {
            set({ syncStatus: 'idle' });
            void get().flushEventQueue();
          }, RETRY_DELAYS_MS[retryCount - 1]);
        }
      },
```

(Declare `enqueueEvent: (eventType: LabEventInput['eventType'], payload: LabEventInput['payload']) => void;` in the interface.)

Rewire the recording actions:

```ts
      recordMeasurement: (value, unit, label, condition, apparatusId) => {
        const { currentStepIndex } = get();
        const measurement: Measurement = {
          id: `meas_${Date.now()}`,
          apparatusId: apparatusId ?? 'app_generic',
          value,
          unit,
          timestamp: new Date().toISOString(),
          stepNumber: currentStepIndex + 1,
        };
        set((state) => ({ measurements: [...state.measurements, measurement] }));
        get().enqueueEvent('measurement', {
          value, unit, label, condition, apparatusId, stepNumber: currentStepIndex + 1,
        });
      },

      recordAction: (actionType, targetApparatus, value) => {
        const { currentSession, currentStepIndex } = get();
        const stepNumber = currentStepIndex + 1;
        if (currentSession) {
          const updatedProgress = [...currentSession.stepProgress];
          updatedProgress[currentStepIndex] = {
            ...updatedProgress[currentStepIndex],
            actionsPerformed: [
              ...updatedProgress[currentStepIndex].actionsPerformed,
              { actionType, apparatusId: targetApparatus, value, timestamp: new Date().toISOString(), isCorrect: true },
            ],
          };
          set({ currentSession: { ...currentSession, stepProgress: updatedProgress } });
        }
        get().enqueueEvent('action', { actionType, targetApparatus, value, stepNumber });
      },

      recordObservation: (text) => {
        get().addObservation(text); // keeps the observations panel working
      },
```

In `addObservation`, append after the existing `set(...)`:

```ts
        get().enqueueEvent('observation', { text, stepNumber: currentStepIndex + 1 });
```

In `completeStep`, append at the end:

```ts
        get().enqueueEvent('step_complete', { stepNumber: currentStepIndex + 1 });
```

Replace the entire `submitExperiment` stub (lines 499-570):

```ts
      submitExperiment: async () => {
        const { currentSession, currentExperiment, serverSessionId } = get();

        if (!currentSession || !currentExperiment) {
          throw new Error('No active session');
        }
        if (currentExperiment.simulationType === 'phet') {
          throw new Error('Practice sessions are not graded — use finishPractice()');
        }

        set({ isLoading: true, submitPending: false });

        try {
          // Best-effort flush so the grader sees all recorded evidence.
          await get().flushEventQueue();

          if (!serverSessionId) throw new Error('Session has not synced to the server yet');
          const res = await api.submitLabSession(serverSessionId);
          if (!res.success || !res.data || res.data.graded !== true) {
            throw new Error(res.error ?? 'Grading is pending');
          }

          const result = res.data.grading;
          if (flushTimer) { clearInterval(flushTimer); flushTimer = null; }
          set({
            currentSession: {
              ...currentSession,
              status: 'completed',
              completedAt: new Date().toISOString(),
            },
            lastAttemptResult: result,
            isTimerRunning: false,
            isLoading: false,
          });
          return result;
        } catch (error) {
          // Honest degradation: no locally-fabricated score. The student is
          // told grading is pending; the result appears in history on sync.
          set({
            submitPending: true,
            error: error instanceof Error ? error.message : 'Failed to submit experiment',
            isLoading: false,
          });
          throw error;
        }
      },

      finishPractice: async () => {
        const { currentSession, currentExperiment, serverSessionId } = get();
        if (!currentSession || !currentExperiment) return;
        if (currentExperiment.simulationType !== 'phet') return;

        if (serverSessionId) {
          await api.submitLabSession(serverSessionId).catch(() => undefined);
        }
        if (flushTimer) { clearInterval(flushTimer); flushTimer = null; }
        set({
          currentSession: { ...currentSession, status: 'completed', completedAt: new Date().toISOString() },
          isTimerRunning: false,
        });
      },
```

Extend `partialize` (line 580) so the queue and server id survive reloads:

```ts
      partialize: (state) => ({
        currentSession: state.currentSession,
        currentExperiment: state.currentExperiment,
        mode: state.mode,
        activeApparatus: state.activeApparatus,
        connections: state.connections,
        measurements: state.measurements,
        observations: state.observations,
        currentStepIndex: state.currentStepIndex,
        stepCompletionStatus: state.stepCompletionStatus,
        timeSpent: state.timeSpent,
        serverSessionId: state.serverSessionId,
        eventQueue: state.eventQueue,
      }),
```

Also stop the flush timer in `endSession` and `reset`.

- [ ] **Step 6.3 — Run green, verify, commit:**

```bash
npx vitest run src/stores/__tests__/labStore.sync.test.ts src/stores
npx tsc -b --noEmit
npx eslint src/stores/labStore.ts src/stores/__tests__/labStore.sync.test.ts
git add src/stores && git commit -m "feat: labStore syncs an idempotent event queue to the lab API"
```

---

## Task 7: Sim instrumentation contract + LabWorkspace wiring + TitrationSimulation reference

**Interfaces:**
- Consumes: labStore `recordMeasurement` / `recordAction` / `addObservation` (Task 6); the 14 sim components in `src/components/lab/simulations/`; the slug switch at `src/components/lab/LabWorkspace.tsx:641-710`.
- Produces:
  - A uniform per-sim props contract (all 14 sims converge on it):

```ts
// src/components/lab/simulations/types.ts (new)
import type { LabActionType } from '@/types';

export interface SimReportProps {
  /** (value, unit, label, condition?) — condition matches ExpectedResult.condition. */
  onMeasurement?: (value: number, unit: string, label: string, condition?: string) => void;
  onObservation?: (text: string) => void;
  /** Required-action evidence: (actionType, targetApparatus, value?). */
  onAction?: (actionType: LabActionType, targetApparatus: string, value?: number) => void;
}
```

  - `LabWorkspace.tsx` builds store-backed callbacks once and passes all three to every custom sim in the slug switch.
  - `TitrationSimulation.tsx` fully instrumented as the reference implementation.

Current state (verified): `Titration`, `Microscope`, `Transpiration`, `SpecificHeat`, `ReactionRate`, `Osmosis`, `Enzyme`, `FoodTests`, `QualitativeAnalysis` already declare `onMeasurement?`; all 14 declare `onObservation?`; none declare `onAction`. LabWorkspace currently passes only `onObservation` (e.g. line 644).

- [ ] **Step 7.1 — Failing test for the workspace callback factory.** Put the factory in a testable module, `src/components/lab/simulations/reporting.ts`:

```ts
import type { LabActionType } from '@/types';
import type { SimReportProps } from './types';

interface Reporter {
  recordMeasurement: (value: number, unit: string, label: string, condition?: string, apparatusId?: string) => void;
  recordAction: (actionType: LabActionType, targetApparatus: string, value?: number) => void;
  recordObservation: (text: string) => void;
}

/** Store-backed sim callbacks. Sims stay synchronous and UI-only. */
export function buildSimReporters(store: Reporter): Required<SimReportProps> {
  return {
    onMeasurement: (value, unit, label, condition) =>
      store.recordMeasurement(value, unit, label, condition),
    onObservation: (text) => store.recordObservation(text),
    onAction: (actionType, targetApparatus, value) =>
      store.recordAction(actionType, targetApparatus, value),
  };
}
```

Test `src/components/lab/simulations/reporting.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { buildSimReporters } from './reporting';

describe('buildSimReporters', () => {
  it('forwards measurements, observations, and actions into the store', () => {
    const store = { recordMeasurement: vi.fn(), recordAction: vi.fn(), recordObservation: vi.fn() };
    const r = buildSimReporters(store);
    r.onMeasurement(25.1, 'ml', 'Titre value 1', 'Average titre value');
    r.onObservation('colour changed');
    r.onAction('pour', 'app_burette');
    r.onAction('adjust', 'app_dc_power_supply', 6);
    expect(store.recordMeasurement).toHaveBeenCalledWith(25.1, 'ml', 'Titre value 1', 'Average titre value');
    expect(store.recordObservation).toHaveBeenCalledWith('colour changed');
    expect(store.recordAction).toHaveBeenCalledWith('pour', 'app_burette', undefined);
    expect(store.recordAction).toHaveBeenCalledWith('adjust', 'app_dc_power_supply', 6);
  });
});
```

Run-fail: `npx vitest run src/components/lab/simulations/reporting.test.ts`, then implement the two modules above, run-pass.

- [ ] **Step 7.2 — Wire LabWorkspace.** In `src/components/lab/LabWorkspace.tsx`:

  - Pull `recordMeasurement`, `recordAction`, `recordObservation` from `useLabStore()` (the destructure at lines 57-83).
  - After the destructure, build the reporters:

```tsx
  const simReporters = buildSimReporters({ recordMeasurement, recordAction, recordObservation });
```

  - Replace every `onObservation={(text) => addObservation(text)}` in the slug switch (lines 641-710) with `{...simReporters}`, e.g.:

```tsx
            ) : currentExperiment.id === 'exp_acid_base_titration' ||
                 currentExperiment.slug === 'acid-base-titration' ? (
              <TitrationSimulation {...simReporters} />
```

  (Apply to all 14 branches.) Remove `addObservation` from the destructure if it becomes unused (it is still used by the observation panel at line 197 — keep it).

- [ ] **Step 7.3 — Instrument `TitrationSimulation.tsx` (reference).** Its experiment (`acid-base-titration`, `shared/experiments.ts:2319`) requires: `pour:app_burette`, `measure:app_burette`, `record:app_burette`, `measure:app_pipette`, `pour:app_conical_flask`, `drag:app_white_tile`, `drag:app_conical_flask`, `observe:app_conical_flask`; numeric expectation `'Average titre value'` (25 ± 2 ml).

  - Change the props interface to `interface TitrationSimulationProps extends SimReportProps {}` (import from `./types`).
  - At each existing handler, add `onAction` beside the existing `onObservation`/`onMeasurement` calls, e.g.:

```ts
// where the flask is filled with HCl (existing onObservation at line 94):
onObservation?.('Added 25ml HCl to conical flask using pipette');
onAction?.('measure', 'app_pipette', 25);
onAction?.('pour', 'app_conical_flask');

// indicator added (line 102):
onObservation?.('Added 2-3 drops of methyl orange indicator - solution turned pink/red');
onAction?.('pour', 'app_conical_flask');

// initial burette reading (line 109):
onMeasurement?.(50 - buretteVolume, 'ml', 'Initial burette reading');
onAction?.('measure', 'app_burette');
onAction?.('record', 'app_burette');

// titre recorded (lines 117-118): tag with the expectedResult condition so the
// grader aggregates titres into 'Average titre value':
onMeasurement?.(titre, 'ml', `Titre value ${currentTitration}`, 'Average titre value');
onAction?.('measure', 'app_burette');
onAction?.('record', 'app_burette');

// end point observed (line 123):
onAction?.('observe', 'app_conical_flask');
```

  Also add `onAction?.('pour', 'app_burette')` in the burette fill/rinse handler. `drag` actions for tile/flask positioning are UI-static in this sim; emit `onAction?.('drag', 'app_white_tile')` and `onAction?.('drag', 'app_conical_flask')` once when the titration setup phase completes (the sim's own "setup done" transition) — this is the honest signal the sim can actually observe.

- [ ] **Step 7.4 — Verify and commit:**

```bash
npx vitest run src/components/lab/simulations src/stores
npx tsc -b --noEmit
npx eslint src/components/lab
git add src/components/lab && git commit -m "feat: wire sim reporting contract through LabWorkspace, instrument titration"
```

---

## Task 8: Instrument the chemistry sims (5)

**Interfaces:**
- Consumes: `SimReportProps` contract (Task 7); requiredActions from `shared/experiments.ts` per slug (extracted below).
- Produces: `onAction` (and missing `onMeasurement` `condition` tags) added to `QualitativeAnalysisSimulation.tsx`, `ElectrolysisSimulation.tsx`, `ReactionRateSimulation.tsx`, `CrystallizationSimulation.tsx`, `GasTestsSimulation.tsx`. Each sim's props interface changes to `extends SimReportProps`.

Per-sim evidence map (from the experiment definitions; each handler that already calls `onObservation`/`onMeasurement` gets the matching `onAction` beside it):

- `qualitative-analysis`: `observe:app_test_tube`, `record:app_test_tube`, `heat:app_bunsen_burner`, `observe:app_bunsen_burner`, `pour:app_test_tube` — emit `pour`/`observe` when a reagent is added to a tube (existing test-handler at `QualitativeAnalysisSimulation.tsx:138`), `heat`/`observe` on the heating action, `record` when a result is logged.
- `electrolysis-brine`: `drag`/`connect` on cell/electrode/power-supply placement (`connect:app_carbon_electrodes`, `connect:app_dc_power_supply`), `adjust:app_dc_power_supply` with the selected voltage (required `targetValue: 6`) at the voltage selector (`ElectrolysisSimulation.tsx:95` start handler), `observe:app_electrolysis_cell`/`observe:app_gas_jar` on gas observations (lines 42-50), `drag:app_litmus_paper`/`drag:app_splint` on the gas-test actions (lines 110-114), `pour:app_electrolysis_cell` + `record:app_electrolysis_cell` on brine fill and result recording.
- `rate-of-reaction`: `drag:app_white_tile`/`drag:app_conical_flask` on setup, `measure:app_measuring_cylinder` on acid measurement, `pour:app_conical_flask` at reaction start (line 98), `measure:app_stopwatch` + `record:app_stopwatch` alongside the existing rate measurement (lines 109-110), `observe:app_conical_flask` on the cross-obscured observation (line 62).
- `crystal-preparation`: `pour:app_beaker_250` on solute add (`CrystallizationSimulation.tsx:124`), `heat:app_bunsen_burner` on heating (line 135), `measure:app_thermometer` on temperature checks, `observe:app_beaker_250`/`observe:app_evaporating_dish` on saturation/crystal observations (lines 35-37, 103-112), `pour:app_evaporating_dish` on transfer, `record:app_evaporating_dish` on final yield record.
- `gas-tests`: `pour:app_test_tube` on reagent add, `observe:app_test_tube`/`observe:app_gas_jar` alongside the test-result observations (`GasTestsSimulation.tsx:146-151`), `drag:app_splint`/`drag:app_litmus_paper` on test-tool selection, `record:app_test_tube`/`record:app_gas_jar` on result recording, `connect:app_delivery_tube` + `heat:app_bunsen_burner` on gas preparation.

Steps per sim (repeat for each of the five):

- [ ] **Step 8.x.1** — Change the props interface to `extends SimReportProps` (import from `./types`); add `onAction` to the destructure.
- [ ] **Step 8.x.2** — Add the `onAction` calls per the evidence map above, mirroring the TitrationSimulation reference. Where a sim records a numeric result that matches an `ExpectedResult.condition` in its experiment definition, pass that condition as the 4th `onMeasurement` argument.
- [ ] **Step 8.x.3** — Verify: `npx tsc -b --noEmit && npx eslint src/components/lab/simulations && npx vitest run src/components/lab`.
- [ ] **Step 8.6 — Commit:** `git add src/components/lab/simulations && git commit -m "feat: instrument chemistry sims with grading evidence events"`.

---

## Task 9: Instrument the biology + physics custom sims (8)

**Interfaces:** identical to Task 8. Sims: `MicroscopeSimulation.tsx`, `FoodTestsSimulation.tsx`, `OsmosisSimulation.tsx`, `PhotosynthesisSimulation.tsx`, `EnzymeSimulation.tsx`, `TranspirationSimulation.tsx`, `DissectionSimulation.tsx`, `SpecificHeatSimulation.tsx`.

Per-sim evidence map:

- `microscope-use`: `drag:app_microscope`/`drag:app_slide` on setup/slide placement (`MicroscopeSimulation.tsx:94`), `adjust:app_microscope` on objective/illumination changes (lines 100-109), `record:app_microscope` beside the magnification measurement (line 114 — tag it with `condition: 'Magnification at x400'` when total magnification is reported).
- `food-tests`: `drag:app_test_tube`/`pour:app_test_tube` on sample/reagent prep (`FoodTestsSimulation.tsx:192`), `observe:app_test_tube` beside test results (line 168), `record:app_test_tube` on result logging.
- `osmosis-cells`: `drag:app_scalpel` on strip cutting (`OsmosisSimulation.tsx:224`), `measure:app_balance` + `record:app_balance` beside the mass measurements (lines 173-180), `drag:app_petri_dish` on solution placement, `observe:app_petri_dish` on completion (line 129), `drag:app_cover_slip`/`pour:app_cover_slip` on slide prep, `observe:app_microscope`/`record:app_microscope` on plasmolysis viewing (lines 784-825).
- `photosynthesis`: `drag:app_petri_dish`/`drag:app_forceps` on leaf handling, `record:app_forceps` on de-starching log (`PhotosynthesisSimulation.tsx:95`), `heat:app_bunsen_burner` on boiling (lines 102-107), `drag:app_beaker_250`/`drag:app_test_tube` on apparatus setup, `observe:app_test_tube` on ethanol decolorizing, `pour:app_beaker_250`/`pour:app_petri_dish` on water/iodine adds, `observe:app_petri_dish` + `record:app_petri_dish` on the iodine result (lines 123-147).
- `enzyme-activity`: `adjust:app_water_bath` with the selected temperature (`EnzymeSimulation.tsx:96`), `measure:app_thermometer` on equilibration check (line 42), `pour:app_petri_dish`/`pour:app_test_tube` on mixing (line 102), `drag:app_water_bath` on tube placement, `measure:app_stopwatch` + `record:app_stopwatch` beside the time measurement (line 116), `observe:app_test_tube` on iodine checks (lines 119-123).
- `transpiration`: `pour:app_potometer`/`connect:app_potometer` on setup (`TranspirationSimulation.tsx:61`), `drag:app_scalpel` on shoot cutting, `drag:app_potometer`/`adjust:app_potometer` on bubble repositioning (line 82), `measure:app_stopwatch`/`measure:app_meter_rule` during timing, `record:app_stopwatch` beside the rate measurement (line 75), `observe:app_potometer` on bubble movement (line 47).
- `virtual-dissection`: `drag:app_dissecting_board`/`drag:app_dissecting_pins` on specimen pinning, `observe:app_dissecting_board` + `record:app_dissecting_board` on cavity exposure/identification (`DissectionSimulation.tsx:129-145`), `drag:app_forceps`/`drag:app_scissors` on tool selection (line 179).
- `specific-heat-capacity`: `measure:app_balance`/`record:app_balance` on metal weighing, `pour:app_calorimeter`/`drag:app_calorimeter` on water/transfer, `measure:app_thermometer`/`observe:app_thermometer`/`record:app_thermometer` on temperature readings, `heat:app_bunsen_burner` on heating, `adjust:app_beaker_250` on water volume; tag the SHC result measurement (`SpecificHeatSimulation.tsx:136`) with the experiment's matching `ExpectedResult.condition`.

Steps: same loop as Task 8 (props interface → evidence calls → verify), then:

- [ ] **Step 9.9 — Commit:** `git add src/components/lab/simulations && git commit -m "feat: instrument biology and physics sims with grading evidence events"`.

---

## Task 10: UI — real results breakdown, PhET practice badge, premium lock

**Interfaces:**
- Consumes: shared `GradingResult` (criteriaScores + stepScores, Task 3); labStore `submitExperiment` / `finishPractice` / `submitPending` (Task 6); `LAB_PREMIUM_REQUIRED` from `api.startLabSession` (surfaced as labStore `error`, Task 6); `usageStore` premium signal (pattern at `src/pages/Practice.tsx:224`: `dailyUsage?.isUnlimited || dailyUsage?.isPremium || false`).
- Produces: reworked results screen in `LabWorkspace.tsx:203-310`, practice badge + "Finish practice" in `LabWorkspace.tsx` and `PhETEmbed.tsx`, premium lock in `ExperimentCard.tsx`, 403→`/pricing` routing in `VirtualLabPage.tsx`.

- [ ] **Step 10.1 — Results screen renders the server breakdown.** In `LabWorkspace.tsx`, the results block (lines 203-310) currently reads `results.feedback.overall` / `strengths` / `improvements` — those fields no longer exist. Replace the "Feedback" card (lines 298-310) with a per-criterion feedback list driven by `criteriaScores[].feedback`, and add a step-evidence section:

```tsx
            {/* Step Evidence */}
            <div className={cn(
              "backdrop-blur-sm rounded-2xl p-6 border mb-6",
              isDark ? "bg-white/5 border-white/10" : "bg-white/80 border-slate-200 shadow-lg"
            )}>
              <h3 className={cn("font-semibold mb-4", isDark ? "text-white" : "text-slate-900")}>Step Evidence</h3>
              <div className="space-y-2">
                {results.stepScores.map((step) => (
                  <div key={step.stepNumber} className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className={cn("text-sm", isDark ? "text-white/70" : "text-slate-600")}>
                        Step {step.stepNumber}
                      </span>
                      <p className={cn("text-xs", isDark ? "text-white/40" : "text-slate-400")}>{step.feedback}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {step.evidence === 'self_report_only' && (
                        <Badge variant="warning">Self-reported</Badge>
                      )}
                      <span className={cn("text-sm font-medium", isDark ? "text-white" : "text-slate-900")}>
                        {step.marksEarned}/{step.maxMarks}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
```

Under each criterion row in the existing "Performance Breakdown" card, render `criteria.feedback` as a caption line. The trophy/score-circle logic (`results.percentageScore`) stays. Add an honest pending state when `submitPending` is true (submit failed): a card saying "Grading is pending — your result will appear in your lab history once the connection is restored." instead of any score. Verify the `Badge` variants available in `@/components/common` and use the closest existing one.

- [ ] **Step 10.2 — PhET practice mode.** In `LabWorkspace.tsx`:
  - Compute `const isPractice = currentExperiment.simulationType === 'phet';`
  - Header (near the experiment title): when `isPractice`, render `<Badge>Practice mode — ungraded</Badge>` (use the existing neutral/secondary Badge variant).
  - The Submit button (lines 481-496): when `isPractice`, replace label with "Finish practice", call `finishPractice()` instead of opening the submit confirm modal, and on completion show a simple "Practice complete" card (no score circle) with an Exit button. Also the sandbox-mode submit stays hidden (existing `mode === 'sandbox'` guard at line 487).
  - In `PhETEmbed.tsx` header (lines 47-51), next to the "PhET Simulation" label add:

```tsx
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
            Practice mode — ungraded
          </span>
```

- [ ] **Step 10.3 — Premium lock.** In `ExperimentCard.tsx`: when `experiment.isPremium` and the user is not premium (usageStore pattern from `Practice.tsx:224`), show a lock overlay/badge on the card and change the Start button label to "Unlock with Premium". In `VirtualLabPage.tsx` `handleStartExperiment` (line 101) and both mode-modal `onClick`s (lines 276-282, 304-310): `startSession` is now async — `await` it, and when the store's `error` becomes `'LAB_PREMIUM_REQUIRED'`, close the modal and `navigate('/pricing')` (same destination as `LimitReachedModal.tsx:45`):

```tsx
                onClick={async () => {
                  if (!experimentForModal) return;
                  await startSession(experimentForModal, 'guided');
                  if (useLabStore.getState().error === 'LAB_PREMIUM_REQUIRED') {
                    setShowModeSelection(false);
                    navigate('/pricing');
                    return;
                  }
                  setShowModeSelection(false);
                  navigate(`/virtual-lab/${experimentForModal.slug}`);
                }}
```

(And the analogous sandbox-mode handler. Import `useLabStore` is already present at line 16.)

- [ ] **Step 10.4 — Tests.** Add `src/components/lab/__tests__/labResults.test.tsx` (jsdom) covering: results screen renders criterion feedback text and the self-reported badge from a server-shaped `GradingResult`; PhET workspace shows the practice badge and no Submit button; premium experiment card shows the lock. Follow the `vi.mock('@/lib/api')` pattern from `src/stores/examStore.test.ts:7-11` and the jsdom pragma from `src/pages/__tests__/Pricing.test.tsx`.

- [ ] **Step 10.5 — Verify and commit:**

```bash
npx vitest run src/components/lab src/stores
npx tsc -b --noEmit
npx eslint src/components/lab
git add src/components/lab && git commit -m "feat: honest lab results UI, PhET practice badge, premium lock"
```

---

## Task 11: Store version bump + final sweep

**Interfaces:**
- Consumes: everything above.
- Produces: `STORE_VERSION = 2` in `src/stores/labStore.ts:19`; no migration of pre-existing `brilla-lab` localStorage sessions (they were never real records — the version check at lines 20-32 already wipes stale state below the current version).

- [ ] **Step 11.1 — Bump the version.** In `src/stores/labStore.ts`, change `const STORE_VERSION = 1;` to:

```ts
// v2: sessions live server-side; v1 localStorage-only sessions were never real
// records and are deliberately NOT migrated — the version check below wipes
// them so stale in-progress state can't sync into the new API.
const STORE_VERSION = 2;
```

- [ ] **Step 11.2 — Regression test** in `src/stores/__tests__/labStore.sync.test.ts`: seeding `localStorage.setItem('brilla-lab', JSON.stringify({ version: 1, state: { currentSession: { id: 'old' } } }))` before importing the store leaves no `currentSession` behind. (Note: the wipe runs at module import; structure the test in its own file if module-cache isolation is needed — `src/stores/__tests__/labStore.version.test.ts` with `vi.resetModules()` + dynamic `await import('../labStore')`.)

- [ ] **Step 11.3 — Full verification:**

```bash
npx vitest run
npx tsc -b --noEmit && npm run typecheck:api
npm run lint
```

- [ ] **Step 11.4 — Commit:** `git add src/stores && git commit -m "chore: bump lab store version for server-side sessions"`.

---

## Self-review checklist (run before finishing)

- [ ] **Spec coverage**: migration (Task 1 — note: number 362 per directive, spec's 361 taken), shared engine + registry (Tasks 2-3), all five API routes + rate limits + premium gate + PhET/sandbox semantics (Tasks 4-5), store queue/offline/idempotency (Task 6), 14 custom sims instrumented (Tasks 7-9: titration + 5 chemistry + 8 biology/physics = 14), results UI / practice badge / premium lock (Task 10), store version bump + no-migration note (Task 11), deletion of the `measurementAccuracy = 70` stub and canned feedback (Task 6 Step 6.2).
- [ ] **Placeholder scan**: every code block above is complete, compilable intent — no `// TODO`, no "similar to task N".
- [ ] **Type/signature consistency**: `LabEventInput`, `GradingResult`, `StepScore.evidence`, and the store action signatures are identical across Tasks 2, 4, 5, 6, 7, and 10. `gradeSession(experiment, events)` is the only grading entry point.
