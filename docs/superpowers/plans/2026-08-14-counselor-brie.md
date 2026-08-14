# Counselor Brie Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Counselor Brie — a warm, personified academic counselor who captures each student's goal (exam, target grade, exam date), measures their level with an 8–10 question adaptive quiz from the real question bank (or existing mastery data for returning users), and reveals a readiness score + goal-driven roadmap — free for all users as the top-of-funnel upgrade engine.

**Architecture:** A new `workers/api/guidance.ts` Hono router (mounted at `/api/guidance`) adopts the orphaned `/api/learning/*` logic (weakest-first recommendations, `exam_readiness` upserts). Assessment answers write into the existing `question_attempts` pipeline so nothing is thrown away. The single AI call in the free path (Brie's 2–3 sentence narrative) goes through model routing + the semantic answer cache (banded). Frontend: a first-run wizard (replacing the feature-tour `OnboardingModal` in one revertible swap) and a permanent `/my-plan` home; `learningPathStore.ts` is rewired from local compute to the API.

**Tech Stack:** Cloudflare Workers (Hono) + D1 + Workers AI + Vectorize, React + zustand + framer-motion, Vitest + mockD1.

**Spec:** `docs/superpowers/specs/2026-08-14-counselor-brie-design.md`

## Global Constraints

- **Gating:** everything is **free for all authenticated users** EXCEPT `POST /api/guidance/plan/regenerate`, which is premium-only via `isPremiumUser` (403 `{ success:false, upgradeRequired:true }`, same pattern as `whiteboard-teach`). `GET /plan` is free INCLUDING one AI narrative per band.
- **Grade enums** (validated server-side in `POST /goals`): wassce → `['A1','B2','B3','C4','C5','C6','D7','E8','F9']`; bece → `['1','2','3','4','5','6','7','8','9']`; igcse → `['A*','A','B','C','D','E','F','G']`; cambridge-a-level → `['A*','A','B','C','D','E']`; edexcel-as/edexcel-a-level → `['9','8','7','6','5','4','3','2','1']`; nsmq → `target_grade` optional (NULL — competition, no grade scale). `exam_year` integer in `[currentYear, currentYear+5]`, `exam_month` integer 1–12 (both optional).
- **Quiz mechanics:** target **9 questions** (spec range 8–10; finish early with an honesty flag if the bank runs dry below 8). Start `medium`; correct → step up, wrong → step down; capped at `easy`/`expert`. One question per topic where possible, topics walked in `display_order` ASC (syllabus progression). Must tolerate ~600 untagged questions via subject-level fallback (`topic_id IS NULL` or exhausted topic → any unused question in the subject).
- **Returning-user skip:** ≥ **20** `question_attempts` in the subject → no quiz; readiness computes from `topic_mastery` (`AVG(mastery_level)` over the subject's topics, COALESCE 0).
- **Readiness math:** difficulty weights `easy=1, medium=2, hard=3, expert=4`; score = `round(100 * Σ(weight_i × correct_i) / Σ(weight_i))` over assessed questions, 0–100 — the same scale `exam_readiness` already uses; result upserts into `exam_readiness` on completion.
- **Narrative cache:** band = `floor(score/10)*10`; cache key question string `brie-narrative|<examType>|<subjectId>|<band>` via the semantic answer cache (`lookupAnswer`/`storeAnswer`, threshold **0.92**) under synthetic topic `brie|<subjectId>` — so all students in the same band share one narrative. One AI call per plan generation, inside the shared `'ai'` rate bucket (50 calls/user/24h via `checkRateLimit`). AI/cache failure → deterministic template narrative with `fallback: true` (never a fabricated AI narrative, never an error).
- **Migration number 094** (`database/migrations/094_guidance.sql`): new `user_goals` + `guidance_sessions`; relax `exam_readiness.exam_type` CHECK to `('wassce','bece','nsmq','igcse','cambridge_as','cambridge_a2','edexcel_as','edexcel_a2')` (the slug set `revision_sessions` already uses; table rebuild per the 093 pattern); DROP dead `learning_recommendations`. No other changes to existing table shapes. `database/schema.sql` is synced in the same task.
- **Routes/Endpoints:** frontend route `/my-plan` (nav label "Counselor Brie"); API mounted at `/api/guidance` — `POST /goals`, `GET /goals`, `POST /assessment/start`, `POST /assessment/:sessionId/answer`, `GET /plan`, `POST /plan/regenerate`.
- **Conventions (Phase A–C):** `requireAuth` on the whole router; model routing via `ai-models.ts` (`getChatModel(env)` — never hardcoded); `unwrapAiText` on every AI response; D1 ids via `generateId('prefix')`; the check-work endpoint in `workers/api/revision-classroom.ts` (~line 2481) is the house endpoint pattern; `workers/api/__tests__/check-work.test.ts` is the test-file template (mockD1 + mocked env.AI).
- **Integrity:** correct answers never reach the client before submission (server-held session state); sessions resumable (abandoned `in_progress` session is resumed, never duplicated); the `/counselor` chat page stays untouched; `OnboardingModal` removal is a single revertible swap in `src/App.tsx` (the tour stays accessible from the Help Center's existing "start tour" button).
- Commit after every task. Do not push. `cd C:/dev/Projects/brilla-study-platform` for all commands.

---

### Task 1: Migration 094 — guidance tables + exam_readiness CHECK relaxation

**Files:**
- Create: `database/migrations/094_guidance.sql`
- Modify: `database/schema.sql` (sync canonical schema)

**Interfaces:**
- Produces:
  - `user_goals(id, user_id, exam_type, subject_id, target_grade NULL, exam_year NULL, exam_month NULL, created_at, updated_at, UNIQUE(user_id, exam_type, subject_id))` — the UNIQUE enables `POST /goals` upsert (spec lists columns only; upsert is required for idempotent goal edits).
  - `guidance_sessions(id, user_id, exam_type, subject_id, status CHECK ('in_progress','completed','abandoned'), questions TEXT DEFAULT '[]' (JSON array of `{ questionId, topicId, difficulty, userAnswer, isCorrect, timeTaken }`), readiness_score REAL NULL, created_at, completed_at NULL)`.
  - `exam_readiness.exam_type` CHECK relaxed to `('wassce','bece','nsmq','igcse','cambridge_as','cambridge_a2','edexcel_as','edexcel_a2')` — existing rows preserved via rebuild.
  - `learning_recommendations` dropped (dead: zero code references — verified by repo-wide grep).

- [ ] **Step 1: Write `database/migrations/094_guidance.sql`:**

```sql
-- Migration 094: Counselor Brie guidance layer.
-- New user_goals + guidance_sessions; relax exam_readiness.exam_type CHECK to
-- the O/A-level-inclusive slug set revision_sessions already uses (rebuild
-- follows the proven 093 pattern); DROP dead learning_recommendations (zero
-- code references).

CREATE TABLE IF NOT EXISTS user_goals (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exam_type TEXT NOT NULL,
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    target_grade TEXT,
    exam_year INTEGER,
    exam_month INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, exam_type, subject_id)
);

CREATE TABLE IF NOT EXISTS guidance_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exam_type TEXT NOT NULL,
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    questions TEXT NOT NULL DEFAULT '[]',
    readiness_score REAL,
    created_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT
);

CREATE INDEX idx_user_goals_user ON user_goals(user_id);
CREATE INDEX idx_guidance_sessions_user ON guidance_sessions(user_id, subject_id, status);

PRAGMA foreign_keys = OFF;

CREATE TABLE exam_readiness_new (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exam_type TEXT NOT NULL CHECK (exam_type IN ('wassce', 'bece', 'nsmq', 'igcse', 'cambridge_as', 'cambridge_a2', 'edexcel_as', 'edexcel_a2')),
    subject_id TEXT REFERENCES subjects(id),
    readiness_score REAL DEFAULT 0,
    topics_mastered INTEGER DEFAULT 0,
    topics_total INTEGER DEFAULT 0,
    weak_topics TEXT,
    strong_topics TEXT,
    last_calculated TEXT DEFAULT (datetime('now')),
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, exam_type, subject_id)
);

INSERT INTO exam_readiness_new SELECT * FROM exam_readiness;

DROP TABLE exam_readiness;

ALTER TABLE exam_readiness_new RENAME TO exam_readiness;

DROP TABLE IF EXISTS learning_recommendations;

PRAGMA foreign_keys = ON;
```

- [ ] **Step 2: Apply locally and verify shape** (wrangler local D1; `--local` never touches prod):

```bash
npx wrangler d1 execute brilla-db --local --file=database/migrations/094_guidance.sql
npx wrangler d1 execute brilla-db --local --command "SELECT sql FROM sqlite_master WHERE name IN ('user_goals','guidance_sessions','exam_readiness')"
```

Verify: `user_goals`/`guidance_sessions` exist; `exam_readiness` CHECK lists the 8 slugs; `learning_recommendations` gone (`SELECT name FROM sqlite_master WHERE name='learning_recommendations'` → empty). Also verify the relaxed table accepts an O/A-level row and rejects junk:

```bash
npx wrangler d1 execute brilla-db --local --command "INSERT INTO exam_readiness (id, user_id, exam_type, subject_id) VALUES ('t094a','u1','igcse',NULL)"  # must succeed
npx wrangler d1 execute brilla-db --local --command "INSERT INTO exam_readiness (id, user_id, exam_type, subject_id) VALUES ('t094b','u1','bogus',NULL)"   # must FAIL (CHECK)
npx wrangler d1 execute brilla-db --local --command "DELETE FROM exam_readiness WHERE id='t094a'"
```

- [ ] **Step 3: Sync `database/schema.sql`** — replace the `exam_readiness` block (~line 1756) with the relaxed CHECK, delete the `learning_recommendations` block (~line 2671), append the two new table definitions with a `-- Source: migrations/094_guidance.sql` comment header, matching the file's existing comment conventions.

- [ ] **Step 4: Commit**

```bash
git add database/migrations/094_guidance.sql database/schema.sql
git commit -m "feat(db): migration 094 — guidance tables, exam_readiness O/A-level CHECK, drop learning_recommendations"
```

---

### Task 2: Guidance module scaffold + goals endpoints

**Files:**
- Create: `workers/api/guidance.ts`
- Modify: `workers/api/index.ts` (import + mount, next to `app.route('/api/learning', learningPathApp)` ~line 11189)
- Test: `workers/api/__tests__/guidance.test.ts` (create — goals section)

**Interfaces:**
- Consumes: `requireAuth` (sets `c.get('user')` = `{ userId, email, role }`), `Env { DB, JWT_SECRET, AI?, ANSWERS_INDEX?, AI_MODEL?, AI_MODEL_CHAT?, AI_MODEL_EMBEDDING?, AI_CACHE_THRESHOLD? }`.
- Produces:
  - `export const guidanceApp` — Hono router, `guidanceApp.use('*', requireAuth)`.
  - `POST /api/guidance/goals` — body `{ examType: string, subjectId: string, targetGrade?: string, examYear?: number, examMonth?: number }` → upserts `user_goals` → `200 { success, data: { goal: UserGoal } }`; 400 with a specific message on: unknown examType, missing/empty subjectId, targetGrade not in the exam's enum, examYear outside `[currentYear, currentYear+5]`, examMonth outside 1–12, non-integer numbers, nsmq WITH a targetGrade (reject — grade-less exam).
  - `GET /api/guidance/goals` → `200 { success, data: { goals: UserGoal[] } }` (all of the user's goals, newest first).
  - `UserGoal = { id, examType, subjectId, targetGrade: string|null, examYear: number|null, examMonth: number|null, updatedAt: string }` (snake_case row mapped to camelCase).
  - `TARGET_GRADES: Record<string, string[]>` and `validateGoalBody(body): { ok: true, value } | { ok: false, error }` exported for tests.

Scaffold + goals implementation (complete — assessment/plan land in later tasks):

```ts
import { Hono } from 'hono';
import { requireAuth } from './auth-middleware';
import { isPremiumUser } from './usage-limits';
import { checkRateLimit } from './rate-limit';
import { getChatModel, unwrapAiText } from './ai-models';
import { lookupAnswer, storeAnswer } from './answer-cache';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  AI?: Ai;
  ANSWERS_INDEX?: VectorizeIndex;
  AI_MODEL?: string;
  AI_MODEL_CHAT?: string;
  AI_MODEL_EMBEDDING?: string;
  AI_CACHE_THRESHOLD?: string;
}

interface UserPayload {
  userId: string;
  email: string;
  role: string;
}

const guidanceApp = new Hono<{ Bindings: Env; Variables: { user: UserPayload } }>();
guidanceApp.use('*', requireAuth);

const generateId = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

// =============================================
// GOALS — target grade + exam date per exam/subject
// =============================================

// Grade scales per exam type (Global Constraints). nsmq has no grades —
// target_grade must be omitted for it.
const TARGET_GRADES: Record<string, string[]> = {
  wassce: ['A1', 'B2', 'B3', 'C4', 'C5', 'C6', 'D7', 'E8', 'F9'],
  bece: ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
  igcse: ['A*', 'A', 'B', 'C', 'D', 'E', 'F', 'G'],
  'cambridge-a-level': ['A*', 'A', 'B', 'C', 'D', 'E'],
  'edexcel-as': ['9', '8', '7', '6', '5', '4', '3', '2', '1'],
  'edexcel-a-level': ['9', '8', '7', '6', '5', '4', '3', '2', '1'],
};

interface GoalInput {
  examType: string;
  subjectId: string;
  targetGrade: string | null;
  examYear: number | null;
  examMonth: number | null;
}

export function validateGoalBody(body: any): { ok: true; value: GoalInput } | { ok: false; error: string } {
  const examType = typeof body?.examType === 'string' ? body.examType.trim() : '';
  if (!TARGET_GRADES[examType] && examType !== 'nsmq') {
    return { ok: false, error: `Unknown examType (expected one of: nsmq, ${Object.keys(TARGET_GRADES).join(', ')})` };
  }
  const subjectId = typeof body?.subjectId === 'string' ? body.subjectId.trim() : '';
  if (!subjectId) return { ok: false, error: 'subjectId is required' };

  let targetGrade: string | null = null;
  if (body?.targetGrade !== undefined && body.targetGrade !== null) {
    if (typeof body.targetGrade !== 'string' || body.targetGrade.trim().length === 0) {
      return { ok: false, error: 'targetGrade must be a non-empty string' };
    }
    targetGrade = body.targetGrade.trim();
    if (examType === 'nsmq') return { ok: false, error: 'nsmq has no grade scale — omit targetGrade' };
    if (!TARGET_GRADES[examType].includes(targetGrade)) {
      return { ok: false, error: `targetGrade must be one of: ${TARGET_GRADES[examType].join(', ')}` };
    }
  }

  const thisYear = new Date().getUTCFullYear();
  let examYear: number | null = null;
  if (body?.examYear !== undefined && body.examYear !== null) {
    if (!Number.isInteger(body.examYear) || body.examYear < thisYear || body.examYear > thisYear + 5) {
      return { ok: false, error: `examYear must be an integer between ${thisYear} and ${thisYear + 5}` };
    }
    examYear = body.examYear;
  }
  let examMonth: number | null = null;
  if (body?.examMonth !== undefined && body.examMonth !== null) {
    if (!Number.isInteger(body.examMonth) || body.examMonth < 1 || body.examMonth > 12) {
      return { ok: false, error: 'examMonth must be an integer between 1 and 12' };
    }
    examMonth = body.examMonth;
  }
  return { ok: true, value: { examType, subjectId, targetGrade, examYear, examMonth } };
}

function mapGoalRow(row: any) {
  return {
    id: row.id,
    examType: row.exam_type,
    subjectId: row.subject_id,
    targetGrade: row.target_grade ?? null,
    examYear: row.exam_year ?? null,
    examMonth: row.exam_month ?? null,
    updatedAt: row.updated_at,
  };
}

guidanceApp.post('/goals', async (c) => {
  const user = c.get('user');
  const body = await c.req.json().catch(() => null);
  const parsed = validateGoalBody(body);
  if (!parsed.ok) return c.json({ success: false, error: parsed.error }, 400);
  const g = parsed.value;

  const id = generateId('goal');
  await c.env.DB.prepare(`
    INSERT INTO user_goals (id, user_id, exam_type, subject_id, target_grade, exam_year, exam_month, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    ON CONFLICT(user_id, exam_type, subject_id) DO UPDATE SET
      target_grade = excluded.target_grade,
      exam_year = excluded.exam_year,
      exam_month = excluded.exam_month,
      updated_at = datetime('now')
  `).bind(id, user.userId, g.examType, g.subjectId, g.targetGrade, g.examYear, g.examMonth).run();

  const row = await c.env.DB.prepare(
    'SELECT * FROM user_goals WHERE user_id = ? AND exam_type = ? AND subject_id = ?'
  ).bind(user.userId, g.examType, g.subjectId).first();
  return c.json({ success: true, data: { goal: mapGoalRow(row) } });
});

guidanceApp.get('/goals', async (c) => {
  const user = c.get('user');
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM user_goals WHERE user_id = ? ORDER BY updated_at DESC'
  ).bind(user.userId).all();
  return c.json({ success: true, data: { goals: results.map(mapGoalRow) } });
});

export { guidanceApp };
```

Mount in `workers/api/index.ts` (next to the learningPath mount):

```ts
import { guidanceApp } from './guidance';
// ...
app.route('/api/guidance', guidanceApp);
```

- [ ] **Step 1: Write the failing test** — `workers/api/__tests__/guidance.test.ts`, goals describe-block, using the check-work test template (JWT sign, `authHandler`, mockD1). Handlers needed: `authHandler` (`/SELECT role, status, is_active FROM users/`), `goalWrite` (`/INSERT INTO user_goals/`), `goalRead` (`/FROM user_goals/`). Cases: (a) valid wassce goal upserts and returns the mapped goal (assert INSERT binds: userId, 'wassce', subject, 'A1', year, month); (b) second POST same exam+subject → ON CONFLICT upsert (still one INSERT statement kind, no error); (c) 400 on bad grade ('A2' for wassce), bad examType, missing subjectId, examYear 2010, examYear currentYear+6, examMonth 13, examMonth 2.5, nsmq with targetGrade; (d) nsmq without targetGrade → 200 with targetGrade null; (e) GET /goals returns the user's rows mapped to camelCase. 400s must run BEFORE any INSERT (assert no `INSERT INTO user_goals` in `db.calls`).

- [ ] **Step 2: Run — see it fail** (`npx vitest run workers/api/__tests__/guidance.test.ts` — module doesn't exist).

- [ ] **Step 3: Implement** the scaffold above + mount in index.ts.

- [ ] **Step 4: Run — see it pass; `npx tsc -b` clean; commit**

```bash
git add workers/api/guidance.ts workers/api/index.ts workers/api/__tests__/guidance.test.ts
git commit -m "feat(guidance): Counselor Brie module — goals intake endpoints"
```

---

### Task 3: Adaptive engine + assessment endpoints (quiz flow)

**Files:**
- Modify: `workers/api/guidance.ts` (assessment section)
- Test: `workers/api/__tests__/guidance.test.ts` (extend — assessment describe-block)

**Interfaces:**
- Produces (exported pure helpers — unit-tested directly):
  - `export const DIFFICULTY_ORDER = ['easy', 'medium', 'hard', 'expert'] as const;`
  - `export const DIFFICULTY_WEIGHTS: Record<string, number> = { easy: 1, medium: 2, hard: 3, expert: 4 };`
  - `export const ASSESSMENT_TARGET = 9;` (8–10 per spec; finish early below 8 only when the bank is exhausted)
  - `export function stepDifficulty(current: string, wasCorrect: boolean): string` — index ±1, clamped to `[0, 3]` (caps `easy`/`expert`).
  - `export function computeWeightedReadiness(answers: { difficulty: string; isCorrect: number }[]): number` — `round(100 * Σ(w·correct) / Σ(w))`; 0 answers → 0.
  - `export function isAnswerCorrect(correctAnswer: string, userAnswer: string, optionsJson: string | null): boolean` — normalize (trim, collapse whitespace, lowercase); for `multiple_choice` match either the option letter (`'b'` vs option index) or the normalized full option text; `true_false` and direct answers match the normalized string.
- Endpoints:
  - `POST /assessment/start` — body `{ examType: string, subjectId: string }` →
    - returning-user check (Task 4 wires the mastery computation; this task returns the skip SHAPE with readiness computed by Task 4's helper — implement `getMasteryReadiness` now, it's small): attempts-in-subject ≥ 20 → `200 { success, data: { skip: true, readiness, source: 'mastery' } }`;
    - existing `in_progress` session for user+subject → resume: `200 { success, data: { sessionId, nextQuestion, askedSoFar, target: 9 } }` (never a duplicate session);
    - else create `guidance_sessions` row → `200 { success, data: { sessionId, nextQuestion, askedSoFar: 0, target: 9 } }`.
  - `POST /assessment/:sessionId/answer` — body `{ questionId: string, answer: string, timeTaken?: number }` → validates session ownership + `in_progress` + `questionId` is the session's pending question (409 on stale/out-of-order) → grades → INSERT into `question_attempts` → appends to session `questions` JSON → `200 { success, data: { correct, explanation, runningEstimate, askedSoFar, nextQuestion? , done? } }` where `done: { readiness }` appears at target count instead of `nextQuestion`.
  - `PublicQuestion = { id, questionText, questionType, options: string[] | null, difficulty, topicName: string | null }` — **never** includes `correct_answer` or `explanation`. `explanation` is returned only AFTER that question is answered.
- Question selection (server-side, in `nextQuestionFor(session, topicQueue)`): walk subject topics `display_order` ASC (queue stored in the session row as `topicQueue` inside the `questions` JSON envelope — store envelope `{ asked: [...], topicQueue: string[], currentDifficulty: string, pendingQuestionId: string | null }` in the `questions` column); for the next topic pick an unused question at `currentDifficulty` → fallback same topic ANY difficulty (prefer closest by DIFFICULTY_ORDER distance) → fallback subject-level ANY unused question (covers ~600 untagged rows); topic exhausted → advance the queue; bank exhausted below 8 asked → `done` early with `completedEarly: true`.

- [ ] **Step 1: Failing tests** — assessment describe-block. Handlers: attempts-count (`/COUNT(\*\).*FROM question_attempts.*JOIN questions/` → 0), topic list (`/FROM topics t WHERE t.subject_id/` — mockD1 `all`), question pick (`/FROM questions/` — `first` keyed on binds), session write/read (`/INSERT INTO guidance_sessions|UPDATE guidance_sessions/`, `/FROM guidance_sessions/`), attempt write (`/INSERT INTO question_attempts/`). Cases:
  - (a) `stepDifficulty`: medium+correct→hard, hard+correct→expert, expert+correct→expert (cap), easy+wrong→easy (cap), medium+wrong→easy (direct unit import).
  - (b) `computeWeightedReadiness([{difficulty:'easy',isCorrect:1},{difficulty:'expert',isCorrect:0}])` → `round(100*1/5)` = 20; empty → 0.
  - (c) start creates a session and returns question 1 at `medium` with NO `correct_answer`/`explanation` in the payload (JSON.stringify assert) and an INSERT with 9-bound envelope containing `topicQueue`.
  - (d) start with an existing in_progress session returns the SAME sessionId and no INSERT (resume idempotency).
  - (e) answer: correct MC answer graded `correct: true`, one `INSERT INTO question_attempts` with `(user_id, question_id, user_answer, is_correct=1, time_taken)`, session UPDATE appends the answer, next question returned; wrong answer steps difficulty DOWN on the following pick (assert the next pick's binds carry the easier difficulty).
  - (f) answer with stale questionId → 409, no writes.
  - (g) 9th answer → `done.readiness` equals the hand-computed weighted score for the scripted path, session UPDATE sets `status='completed'`.
  - (h) untagged fallback: topic query returns null → subject-level query is issued (assert SQL sequence in `db.calls`).

- [ ] **Step 2–4: fail → implement → pass.** Implementation notes: grade with `isAnswerCorrect`; `runningEstimate` = `computeWeightedReadiness(asked)`; write `question_attempts` as `(id, user_id, question_id, user_answer, is_correct, time_taken, points_earned)` with `points_earned = is_correct ? (points from question row, default 3) : 0`; session envelope UPDATE on every answer (`questions = JSON.stringify(envelope)`); the pending question id lives ONLY in the envelope (that's the no-leak integrity boundary). `npx tsc -b` clean → commit:

```bash
git commit -m "feat(guidance): adaptive level check — CAT-lite quiz from the question bank"
```

---

### Task 4: Readiness engine — returning-user skip + exam_readiness upsert

**Files:**
- Modify: `workers/api/guidance.ts`
- Test: `workers/api/__tests__/guidance.test.ts` (extend)

**Interfaces:**
- Produces (exported for tests):
  - `export async function getSubjectAttemptCount(db: D1Database, userId: string, subjectId: string): Promise<number>`
  - `export async function getMasteryReadiness(db: D1Database, userId: string, subjectId: string): Promise<number>` — `round(AVG(mastery_level))` over `topic_mastery` joined to the subject's topics (rows may not exist → 0); `export const SKIP_THRESHOLD = 20;`
  - `export async function upsertExamReadiness(db, userId, examType, subjectId, score): Promise<void>` — INSERT ... ON CONFLICT(user_id, exam_type, subject_id) DO UPDATE, `topics_total` = subject topic count, `topics_mastered` = count of topics with mastery ≥ 70 (from `topic_mastery`), `weak_topics`/`strong_topics` = JSON id arrays (< 50 / ≥ 70 — same thresholds as learningpath).
- Behavior changes:
  - `/assessment/start` skip path now also upserts `exam_readiness` before returning `{ skip: true, readiness, source: 'mastery' }`.
  - Quiz completion (`done`) upserts `exam_readiness` with the final weighted score and stamps the session `readiness_score` + `completed_at`.

- [ ] **Step 1: Failing tests** — (a) boundary: attempts count 19 → quiz offered; 20 → `{ skip: true }` with NO session INSERT; (b) skip readiness = `round(AVG(mastery_level))` of the mocked topic_mastery rows; (c) skip path issues the exam_readiness upsert (assert SQL + binds: user, examType, subject, score); (d) quiz completion upserts with the weighted score and `topics_mastered` computed from the mocked rows; (e) `upsertExamReadiness` ON CONFLICT shape matches Task 1's UNIQUE(user_id, exam_type, subject_id).

- [ ] **Step 2–4: fail → implement → pass → commit**

```bash
git commit -m "feat(guidance): readiness engine — mastery skip path + exam_readiness upsert"
```

---

### Task 5: GET /plan — roadmap adoption + this-week slice

**Files:**
- Modify: `workers/api/guidance.ts`
- Test: `workers/api/__tests__/guidance.test.ts` (extend)

**Interfaces:**
- `GET /plan?examType=&subjectId=` → `200 { success, data: BriePlan }`; 400 when params missing.
- `BriePlan = { goal: UserGoal | null, readiness: number, readinessSource: 'assessment' | 'mastery' | 'none', readinessBand: number, roadmap: RoadmapNode[], thisWeek: RoadmapNode[], narrative: string, narrativeCached: boolean, fallback: boolean }`.
- `RoadmapNode = { topicId, topicName, masteryScore, questionsAttempted, priority: 'critical'|'high'|'medium'|'low', reason: 'weak_area'|'not_started'|'review_needed'|'maintain', estimatedTime, href }` where `href = /revision-classroom?exam=<examType>&subject=<subjectId>&topic=<topicId>`.
- Roadmap computation — ADOPTED from `learningpath.ts` `/recommendations`, subject-scoped: one grouped query over the subject's topics (LEFT JOIN questions + question_attempts for this user) yielding per-topic mastery + attempt counts; priority mapping identical to learningpath (0 attempts → `high`/`not_started`; `<30` → `critical`/`weak_area`; `<50` → `high`/`weak_area`; `<70` → `medium`/`review_needed`; else `low`/`maintain`); `estimatedTime` 45 below 50 mastery else 30. Ordering: priority rank (`critical` 0 → `low` 3) ASC, then `display_order` ASC (prerequisite-aware: syllabus progression is never violated within a priority band). `thisWeek = roadmap.slice(0, 3)`.
- `readinessSource`: latest completed `guidance_sessions` score for user+subject → `'assessment'`; else topic_mastery average when attempts ≥ 20 → `'mastery'`; else 0/`'none'`.
- Narrative in this task: the DETERMINISTIC TEMPLATE (real shipped behavior, `fallback: true`, `narrativeCached: false`) — Task 6 layers the AI narrative on top without changing the payload shape:

```ts
function templateNarrative(goal: UserGoal | null, readiness: number, strongest: string | null, weakest: string | null): string {
  const grade = goal?.targetGrade ? ` toward ${goal.targetGrade}` : '';
  const strong = strongest ? `You're strongest in ${strongest}` : 'You have a clean slate';
  const weak = weakest ? `your fastest route${grade} runs through ${weakest}` : `we'll build your route${grade} step by step`;
  return `${strong} — ${weak}. Here's my first read (${readiness}/100); it'll sharpen as we work together. — Brie`;
}
```

- [ ] **Step 1: Failing tests** — (a) full payload shape with seeded goal + attempts: goal mapped, readiness from the completed session, band = floor(score/10)*10, `thisWeek` = first 3 roadmap nodes, hrefs carry exam/subject/topic params, template narrative present with `fallback: true`; (b) ordering: seeded masteries produce critical-before-high, and display_order breaks ties within a priority (assert exact topicId sequence); (c) no goal row → `goal: null`, still 200; (d) `readinessSource` transitions: session row wins over mastery, mastery only when attempts ≥ 20, else `'none'`; (e) 400 without query params.

- [ ] **Step 2–4: fail → implement → pass → commit**

```bash
git commit -m "feat(guidance): GET /plan — adopted weakest-first roadmap + this-week slice"
```

---

### Task 6: Brie's narrative — AI generation, band cache, premium regenerate

**Files:**
- Modify: `workers/api/guidance.ts`
- Test: `workers/api/__tests__/guidance.test.ts` (extend)

**Interfaces:**
- `getBrieNarrative(c: Context, ctx: { examType, subjectId, subjectName, goal, readiness, band, strongest, weakest }): Promise<{ text: string; cached: boolean; fallback: boolean }>`:
  1. Build cache question `brie-narrative|<examType>|<subjectId>|<band>` and call `lookupAnswer(c.env, `brie|<subjectId>`, question)` → hit: `{ text, cached: true, fallback: false }`.
  2. Miss: `checkRateLimit(c.env.DB, userId, 'ai')` → 429-shaped skip (serve template, `fallback: true`) when exhausted — never block the plan on the narrative.
  3. Generate: `getChatModel(c.env)`, max_tokens 200, temperature 0.7; prompt (Brie persona, warm Ghanaian-counselor voice, 2–3 sentences, names strongest/weakest topics, mentions target grade when set, ends with the cold-start honesty line). `unwrapAiText` → trimmed non-empty string required, else template fallback.
  4. `storeAnswer(c.env, `brie|<subjectId>`, subjectId, examType, question, text, model)` (best-effort — helper already swallows failures).
- `POST /plan/regenerate` — body `{ examType, subjectId }` → **premium gate FIRST** (`isPremiumUser`, 403 `{ success:false, upgradeRequired:true }`, message in Brie's voice) → recomputes readiness/roadmap exactly like GET /plan but SKIPS the narrative cache (force-generate, then `storeAnswer` to refresh the band entry) → `200 { success, data: BriePlan }` (same payload shape as GET /plan).
- GET /plan gains the AI narrative path from Task 6 (cache-first; the Task 5 template remains the `fallback: true` path).

- [ ] **Step 1: Failing tests** — (a) cache hit (seed `lookupAnswer` path via mockD1 `ai_answer_cache` row + stubbed `ANSWERS_INDEX.query` returning score 0.99 with matching id) → `narrativeCached: true`, NO `env.AI.run` call; (b) same band shared: band computation for scores 63 and 68 both → 60 (unit-assert the band formula via two GET /plan calls sharing one cache row); (c) cache miss + mock AI returning prose → narrative = prose, `storeAnswer` INSERT into `ai_answer_cache` with topic `brie|<subjectId>` and the banded question string; (d) AI throws → template narrative, `fallback: true`, 200; (e) regenerate as free user → 403 `upgradeRequired: true` BEFORE any AI/cache work (mockD1 free-tier handler; assert no `ai_answer_cache` INSERT and no AI call); (f) regenerate as premium → 200, AI called even with a cache row present (skip-cache), fresh narrative stored.

- [ ] **Step 2–4: fail → implement → pass → commit**

```bash
git commit -m "feat(guidance): Brie narrative — banded semantic cache + premium regenerate"
```

---

### Task 7: guidanceStore (frontend state)

**Files:**
- Create: `src/stores/guidanceStore.ts`
- Modify: `src/stores/index.ts` (export)
- Test: none (thin API client; covered by Task 8/9 component tests and the Task 11 probe)

**Interfaces:**
- Produces `useGuidanceStore` (NOT persisted — session-only state):

```ts
import { create } from 'zustand';
import { api } from '@/lib/api';

export interface UserGoal {
  id: string;
  examType: string;
  subjectId: string;
  targetGrade: string | null;
  examYear: number | null;
  examMonth: number | null;
  updatedAt: string;
}

export interface PublicQuestion {
  id: string;
  questionText: string;
  questionType: string;
  options: string[] | null;
  difficulty: string;
  topicName: string | null;
}

export interface RoadmapNode {
  topicId: string;
  topicName: string;
  masteryScore: number;
  questionsAttempted: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  reason: 'weak_area' | 'not_started' | 'review_needed' | 'maintain';
  estimatedTime: number;
  href: string;
}

export interface BriePlan {
  goal: UserGoal | null;
  readiness: number;
  readinessSource: 'assessment' | 'mastery' | 'none';
  readinessBand: number;
  roadmap: RoadmapNode[];
  thisWeek: RoadmapNode[];
  narrative: string;
  narrativeCached: boolean;
  fallback: boolean;
}

interface AnswerResult {
  correct: boolean;
  explanation: string | null;
  runningEstimate: number;
  askedSoFar: number;
  nextQuestion?: PublicQuestion;
  done?: { readiness: number };
}

interface GuidanceState {
  goals: UserGoal[];
  plan: BriePlan | null;
  // Wizard / quiz session
  wizardOpen: boolean;
  sessionId: string | null;
  currentQuestion: PublicQuestion | null;
  askedSoFar: number;
  target: number;
  lastAnswer: { correct: boolean; explanation: string | null } | null;
  skipped: boolean;
  isLoading: boolean;
  error: string | null;
  // Actions
  fetchGoals: () => Promise<UserGoal[]>;
  saveGoal: (goal: { examType: string; subjectId: string; targetGrade?: string; examYear?: number; examMonth?: number }) => Promise<boolean>;
  startAssessment: (examType: string, subjectId: string) => Promise<'quiz' | 'skip'>;
  submitAnswer: (questionId: string, answer: string, timeTaken: number) => Promise<AnswerResult | null>;
  fetchPlan: (examType: string, subjectId: string) => Promise<void>;
  regeneratePlan: (examType: string, subjectId: string) => Promise<'ok' | 'premium_required' | 'error'>;
  openWizard: () => void;
  closeWizard: () => void;
  resetQuiz: () => void;
}
```

Implementation notes: every action uses `api.get/post` (existing `src/lib/api.ts` client — check its exact method names and use those); errors set `error` and return the documented failure value (`false`/`null`/`'error'`); `regeneratePlan` maps 403 `upgradeRequired` → `'premium_required'` (the UI shows the upgrade prompt); `submitAnswer` stores `lastAnswer` and advances `currentQuestion`/`askedSoFar`, sets `skipped:false`; on `done` it clears `currentQuestion` so the wizard moves to reveal; `startAssessment` returns `'skip'` (and sets `skipped: true`) when the server returns `{ skip: true }`.

- [ ] **Steps:** implement → `npx tsc -b` clean → `npm run build` succeeds → commit:

```bash
git commit -m "feat(guidance): guidanceStore — wizard/plan state over /api/guidance"
```

---

### Task 8: CounselorBrieWizard + first-run swap

**Files:**
- Create: `src/components/guidance/CounselorBrieWizard.tsx`
- Create: `src/components/guidance/CounselorBrieTrigger.tsx`
- Modify: `src/App.tsx` (replace the two global guide mounts ~lines 875-876)
- Test: `src/components/guidance/__tests__/counselorBrieWizard.test.ts` (create, jsdom — local `cn` helper, the StudentInkLayer pattern: do NOT import `@/utils`, its barrel pulls in pdfjs which crashes jsdom)

**Interfaces:**
- `<CounselorBrieWizard>` — full-screen modal (`fixed inset-0 z-[100]`, backdrop like OnboardingModal). Three screens driven by guidanceStore:
  1. **Goal intake** (`'intake'`): exam select (pre-filled from `useExamStore().currentExamType`), subject select (subjects for that exam from `src/data/examData` `examSubjects`, same source the revision classroom selector uses), target grade select (options from the same TARGET_GRADES map — duplicate it in `src/components/guidance/gradeScales.ts` and export; the server remains the authority), month/year pickers (month 1–12, year current→+5, year defaulting to `useExamPreferencesStore` targetYear when set). CTA "Let's find your starting point" → `saveGoal` → `startAssessment` → quiz (or reveal when `'skip'`).
  2. **Quiz** (`'quiz'`): one question per screen, progress text "Question {askedSoFar + 1} of ~{target}", `PublicQuestion` rendering (MC option buttons / true-false / text input for direct answers), submit → show `lastAnswer.correct` feedback + explanation briefly → next. Brie encouragement line per question (static rotation, in-character). No timer.
  3. **Reveal** (`'reveal'`): readiness number animates 0 → score (framer-motion `animate`), narrative with type-in effect, roadmap top-3 preview, CTA "Start my route" → `navigate(thisWeek[0].href)` + `closeWizard()`.
- `<CounselorBrieTrigger>` — mirrors `OnboardingTrigger`: when `isAuthenticated` AND wizard closed AND (after `fetchGoals`) the user has NO goal for their current exam type AND no completed/skipped flag in `sessionStorage` (`brie_wizard_dismissed_<userId>`), open the wizard after a 500ms delay. "Maybe later" sets the sessionStorage flag (per browser session — the wizard re-offers on next login; deliberate).
- `src/App.tsx` swap (the ONLY replace — revert = restore these two lines):

```tsx
{/* Global Guide Components */}
<CounselorBrieTrigger />
<CounselorBrieWizard />
<FeatureTour />
```

(`OnboardingTrigger`/`OnboardingModal` unmount; the tour stays reachable from the Help Center's existing replay button — verify `src/pages/HelpCenter.tsx:317` still mounts `startOnboarding` against the guide store directly.)

- Test (jsdom, render the intake screen with a stubbed guidanceStore via `useGuidanceStore.setState`): (a) intake renders exam/subject/grade controls and pre-fills exam from examStore; (b) nsmq selection hides the grade select; (c) submit calls `saveGoal` then `startAssessment` with the picked values; (d) quiz screen renders the current question's options and hides any `correctAnswer` field (payload contract guard); (e) reveal screen shows the readiness number and the narrative text.

- [ ] **Steps:** failing component test → implement wizard + trigger + App.tsx swap → test passes → `npx tsc -b` + `npm run build` clean → ESLint no new issues on touched files → commit:

```bash
git commit -m "feat(guidance): Counselor Brie first-run wizard — replaces feature tour as primary onboarding"
```

---

### Task 9: /my-plan home + routing + deep-links + learningPathStore rewiring

**Files:**
- Create: `src/pages/MyPlan.tsx`
- Modify: `src/App.tsx` (lazy route `/my-plan`, next to `/counselor` ~line 542)
- Modify: `src/components/layout/Sidebar.tsx` (nav item in `resourcesNavItems` ~line 99: `{ path: '/my-plan', label: 'Counselor Brie', icon: Compass, auth: true, badge: 'NEW', highlight: true }` — Compass from lucide-react)
- Modify: `src/pages/RevisionClassroom.tsx` (query-param auto-start)
- Modify: `src/stores/learningPathStore.ts` (rewire to API)
- Test: `src/pages/__tests__/myPlan.test.tsx` (create, jsdom smoke render with stubbed guidanceStore)

**Interfaces:**
- `MyPlan` page sections (all from `useGuidanceStore().plan` after `fetchPlan(examType, subjectId)`; exam/subject from examStore + page-level subject selector when multiple goals exist):
  - **Goal card:** target grade + countdown (`examYear`/`examMonth` → days remaining; hidden when both null).
  - **Readiness gauge:** 0–100 arc (framer-motion), `readinessSource` caption ("from your level check" / "from your practice history" / "take the level check").
  - **Roadmap:** vertical node list — topic name, mastery %, priority badge (colors: critical red / high amber / medium blue / low green), "Start" button → `navigate(node.href)`.
  - **This week:** the plan's `thisWeek` nodes as cards at top.
  - **Retake level check** button → `openWizard()` (straight to quiz via `startAssessment`).
  - **Regenerate** button → `regeneratePlan`; `'premium_required'` → inline upgrade prompt linking `/pricing`.
- RevisionClassroom deep-link (additive effect in `src/pages/RevisionClassroom.tsx`; the store's `startRevisionSession` already accepts `topicId`/`topicName`):

```tsx
const [searchParams] = useSearchParams();
const deepLinkFiredRef = useRef(false);
useEffect(() => {
  if (deepLinkFiredRef.current || currentSession || !user) return;
  const subjectId = searchParams.get('subject');
  if (!subjectId) return;
  deepLinkFiredRef.current = true;
  const exam = searchParams.get('exam');
  if (exam && exam !== currentExamType) useExamStore.getState().setExamType(exam as ExamTypeSlug);
  handleSelectSubject(subjectId, searchParams.get('subjectName') || 'Revision');
}, [searchParams, currentSession, user]);
```

(Guard ref prevents double-fire on re-renders/StrictMode; when the store exposes `topicId` start, pass `searchParams.get('topic')` through to `startRevisionSession`'s optional `topicId` arg — check the store signature at implementation time and wire it if the param exists there, else note the deviation.)

- learningPathStore rewiring (public interface unchanged — `RecommendedNext`, `ExamReadinessGauge`, `StudyPlanWidget` keep working):
  - `generateRecommendations` → `api.get('/learning/recommendations?limit=10')`, map rows into `RecommendedTopic` (reasonText from reason; drop the local BECE/WASSCE topic tables usage in this action).
  - `calculateExamReadiness(examType)` → `api.get(`/learning/exam-readiness/${examType}`)`, map to `ExamReadiness` (subjects → `SubjectReadiness[]`, overallReadiness; keep `predictedScore` derived as before or drop to a flat band — keep the existing derived shape so the gauge doesn't change).
  - `generateStudyPlan` → `api.post('/learning/study-plan/generate', { examType })` and map `items`; `markTopicComplete` → `api.patch(`/learning/study-plan/${planId}/item/${itemId}`, { completed: true })` then local update.
  - Delete the now-dead local subject-topic data tables ONLY where nothing else references them; otherwise leave them (minimal diff wins).

- [ ] **Step 1: Failing smoke test** (`myPlan.test.tsx`): stub guidanceStore plan; assert goal card, readiness %, 3 this-week cards, roadmap nodes with priority badges and hrefs, retake button present.
- [ ] **Step 2–4: fail → implement → pass → build + full `npx vitest run` green → commit**

```bash
git commit -m "feat(guidance): /my-plan home — goal card, readiness gauge, roadmap deep-links; learningPathStore rewired to API"
```

---

### Task 10: Parent read-only goal/readiness line

**Files:**
- Modify: `workers/api/index.ts` (`GET /parents/students/:studentId/progress` ~line 5696)
- Modify: `src/stores/parentStore.ts` (type + mapping)
- Modify: `src/pages/ParentDashboard.tsx` (one read-only line in the student progress panel)
- Test: `workers/api/__tests__/guidance.test.ts` (extend — parent block) or the existing parent test file if one covers the progress endpoint (check `workers/api/__tests__/` for `parent*.test.ts` first and extend THAT instead)

**Interfaces:**
- Progress response gains `data.guidance: { examType, subjectId, targetGrade: string|null, examYear: number|null, examMonth: number|null, readinessScore: number|null, lastCalculated: string|null } | null` — the student's most-recently-updated `user_goals` row LEFT JOIN `exam_readiness` on (user, exam_type, subject_id). Null when no goal exists. Read-only; the parent activity log (`view_progress`) already covers the access.
- ParentDashboard renders, under the student header: "Goal: A1 WASSCE · May 2027 · Readiness 63/100" (only fields that are non-null; nothing rendered when `guidance` is null).

- [ ] **Step 1: Failing test** — seeded goal + readiness rows → 200 includes the mapped guidance block; no goal → `guidance: null`; non-parent role → 403 (existing behavior, guard against regression).

- [ ] **Step 2–4: fail → implement → pass → build → commit**

```bash
git commit -m "feat(parents): read-only Counselor Brie goal + readiness line in student progress"
```

---

### Task 11: Final verification — migration, deploy, live probe, visual QA

**Files:**
- Create: `scripts/verify-guidance.cjs`
- Create: `scripts/qa-guidance.cjs`

- [ ] **Step 1: Gates** — full `npx vitest run` + `npx tsc -b` + `npm run build` clean; ESLint on all touched files shows no NEW issues vs HEAD baseline (use the stash-compare technique: `git stash -q && npx eslint <files> | tail; git stash pop -q`).
- [ ] **Step 2: Migration + deploy** — `npx wrangler d1 execute brilla-db --remote --file=database/migrations/094_guidance.sql` (verify with the Task 1 Step 2 SELECT against `--remote`), then `npx wrangler deploy` and `npx wrangler pages deploy dist --project-name=brilla-study-platform`.
- [ ] **Step 3: Live probe** — `scripts/verify-guidance.cjs` in the Phase B/C probe style (uiLogin with turnstile wait as johndoe/admintest, `api()` helper, `check()`/failures, NONCE tagging, idempotent, exits non-zero on FAIL). Assert in order:
  1. Free flow as johndoe BEFORE any upgrade: `POST /goals` (wassce, subj_wassce_core_math, A1, valid year/month) → 200; `GET /goals` → contains it; 400 on a bad grade.
  2. `POST /assessment/start` → 200; if johndoe has ≥20 attempts the probe gets `{ skip: true }` — ACCEPT EITHER but record which (make the probe tolerant: if skip, assert readiness is 0–100 and jump to step 4; if quiz, answer all questions to completion — answers are guessable client-side ONLY by picking option A each time; the probe must NOT know correct answers — assert `done.readiness` arrives within 9 answers and that no start response ever contained `correct_answer`).
  3. `GET /plan` → 200: payload has goal, readiness 0–100, roadmap array with hrefs, thisWeek ≤ 3, narrative non-empty, `readinessBand = floor(readiness/10)*10`.
  4. `POST /plan/regenerate` as free → 403 `upgradeRequired: true`.
  5. Admin upgrades johndoe (tier_student_monthly, 30 days) → `POST /plan/regenerate` → 200 with a narrative.
  6. Readiness landed in `exam_readiness`: `GET /api/learning/exam-readiness/wassce` → 200 and the core-math subject entry's score matches the plan's readiness (or ≥ 0 with a note when the skip path computed it).
  7. Narrative band cache: second `GET /plan` → `narrativeCached: true` (same band).
  8. `finally`: restore johndoe to tier_free (durationDays 1); cleanup via `npx wrangler d1 execute brilla-db --remote --command "DELETE FROM user_goals WHERE user_id='user_johndoe2'; DELETE FROM guidance_sessions WHERE user_id='user_johndoe2'; DELETE FROM ai_answer_cache WHERE topic_id LIKE 'brie|%'"` (johndoe's id confirmed in earlier probes — resolve it from the JWT at runtime instead of hardcoding).
- [ ] **Step 4: Visual QA** — `scripts/qa-guidance.cjs` (headful Chrome, evidence-gathering, screenshots to `qa-shots/`): seed `brilla-guide-storage` (`hasCompletedOnboarding: true` — the Phase C lesson: the old tour modal's backdrop swallows trusted clicks), seed `brilla-auth` + `brilla_token` from one temp login (no second turnstile round), upgrade to premium first, then load the app FRESH with the guide storage seeded to onboarding-INCOMPLETE (`{ state: { hasCompletedOnboarding: false }, version: 0 }`) so the first-run wizard fires — screenshot intake, answer 2–3 quiz questions (screenshots), reveal (screenshot), then `/my-plan` (screenshot). Console-error listener; dead-end screenshots on any selector timeout; restore tier_free in `finally` REUSING the run's initial tokens (turnstile rate-limits repeated logins).
- [ ] **Step 5: Commit the probe + QA scripts**

```bash
git commit -m "test(scripts): Counselor Brie live verification probe + wizard visual QA"
```

---

## Self-Review Notes (completed)

- **Spec coverage map:** §1–2 (persona, two doors, decisions) → Tasks 8–9 + Global Constraints; §3.1 wizard → Task 8; §3.2 /my-plan → Task 9; §3.3 omissions → enforced by scope (no schedule, no IRT, no AI questions — Global Constraints); §4.1 quiz mechanics → Task 3; §4.2 level model + skip → Task 4; §5 data model → Task 1; §6 API surface → Tasks 2–6; §6 narrative + caching → Task 6; §7 frontend → Tasks 7–9 (+10 parents); §8 testing/rollout → per-task TDD + Task 11; §9 reusable assets → adopted in Tasks 3–6 (question bank, question_attempts pipeline, orphaned learningpath logic, ai conventions).
- **Ordering rationale:** migration first (every later task writes the new tables); goals before assessment (the wizard saves a goal before the quiz, and /plan reads it); quiz engine before readiness (the skip path and completion upsert share `upsertExamReadiness`); /plan before narrative (the template narrative is the shipped fallback baseline, so Task 6 is purely additive — no placeholder ever ships); store → wizard → page (each consumes the previous task's interfaces); rewiring + parent line last among features (consumers of the finished API); probe/QA last (needs deploy).
- **Ambiguities resolved while planning:** (1) nsmq has no grade scale — `target_grade` nullable, nsmq goals accepted grade-less, nsmq+grade rejected; (2) exam_readiness CHECK relaxation uses the 8-slug set `revision_sessions` already documents (frontend slugs like `cambridge-a-level` map to DB slugs at the guidance boundary — the wizard writes DB slugs); (3) narrative "cached per user + readiness band" implemented as GLOBAL band cache (a student at 63 and one at 68 sharing a narrative only works cross-user) via synthetic topic `brie|<subjectId>` — `ai_answer_cache.topic_id` is a plain TEXT cache key (no FK, per the prod-patch table), so the synthetic key is safe; (4) quiz target fixed at 9 (spec's 8–10 range midpoint) with `completedEarly` honesty below 8; (5) MC grading accepts option letter OR full option text (bank options formats vary); (6) `user_goals` gained `UNIQUE(user_id, exam_type, subject_id)` for upsert — spec lists columns only, but `POST /goals` must be idempotent.
- **Known risks:** (a) untagged-question fallback may pull off-topic-feeling questions for sparse subjects — mitigated by topic-first selection and the early-completion honesty flag; watch probe output; (b) the exam_readiness rebuild copies existing rows under FK OFF — a prod row with an exam_type outside the new CHECK would fail the INSERT; the relaxed set is a superset of the old one, so only corrupted rows could break it (verify row count before/after in Task 11 Step 2); (c) wizard/tour swap revert path = restore the two removed lines in `src/App.tsx` (documented in Task 8); the tour remains reachable from Help Center; (d) `topic_mastery` may be sparse where `user_progress` is the table actually maintained — the skip path reads `topic_mastery` per spec; if the probe shows zero readiness for active users, revisit whether to blend `user_progress.mastery_level` (flagged for the post-probe review, not pre-optimized); (e) first-run wizard firing for EXISTING users without goals (not just new signups) is intentional per spec §1 but will surprise long-time users once — "Maybe later" + per-session dismissal keeps it polite.
