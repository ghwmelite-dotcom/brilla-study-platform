# Growth Loop Implementation Plan

> **Sub-skill:** execute with `superpowers:subagent-driven-development` — each task below is an
> independently-approvable unit; dispatch in dependency order, review between tasks.

Source design: `C:/Users/USER/.gstack/projects/ghwmelite-dotcom-brilla-study-platform/ozzy-main-design-20260812-073217.md` (approved, Approach A + C's houses graft). Where this plan and the design doc disagree with the code, the code wins — see "Design-doc corrections" at the end.

## Goal

Ship the pilot growth loop: (1) a `points_ledger` fed by one shared `awardPoints` helper retrofitted onto the 8 existing XP write sites, (2) a weekly school/platform-scoped points race with cron-driven open/crown, (3) referral-code-at-registration with invite mode + request-a-code flow, (4) `referral_paid_conversion` points via the existing exactly-once `processAffiliateCommission` path, (5) house standings kept consistent with race points through the same helper.

## Architecture

- **Points foundation**: new `workers/api/points.ts` exports `awardPoints(db, input)` — the only function allowed to increment `users.xp_points` for earning events. It writes the ledger row (weighted), enforces daily anti-farm caps, stamps the active race cycle, records first target crossings, and mirrors to `house_points` when the user has a house.
- **Race engine**: new `workers/api/race.ts` (Hono router at `/api/race`) + `runRaceCycleMaintenance(db)` called from the existing `scheduled` cron handler in `workers/api/index.ts` (no new cron trigger; the 6-hourly cron runs idempotent maintenance).
- **Registration referral**: extend `POST /api/auth/register` in `workers/api/index.ts` with a `referralCode` field, `REGISTRATION_MODE=invite` gating, and immediate `status='approved'` for valid codes. Attribution reuses a function extracted from `affiliates.ts`'s `/process-referral`, which becomes a no-op when `users.referred_by` is already set.
- **Affiliate points**: `payments.ts` `processAffiliateCommission` calls `awardPoints(..., 'referral_paid_conversion')` after its existing exactly-once guards pass.
- **Frontend**: registration is a modal (`src/components/auth/AuthModal.tsx`); the referral field + request-a-code UI live there. Race UI is a new tab on `src/pages/Leaderboard.tsx` + a compact card on `src/pages/Dashboard.tsx`. Code issuing is a new tab on `src/pages/AdminAffiliates.tsx`.

## Tech stack

Vite + React 18 + TS (src/), Hono on Cloudflare Workers (workers/api/), D1 SQLite, Zustand stores, vitest with `workers/api/__tests__/helpers/mockD1.ts`, node:sqlite generators (`scripts/build-canonical-schema.cjs`, `scripts/build-seed.cjs`).

## Global Constraints

- Every task ends with a verifiable command + expected output.
- Commits only with user's explicit approval.
- Gates after every task: `npx vitest run` all pass; `npm run build` green; `npx tsc -p workers/tsconfig.json` error count must not exceed 130 (record the actual baseline in Task 1 step 1 and use it); `npm run db:verify` 18/18 green.
- No `wrangler --remote` commands — all prod operations are user-gated (see Prod Apply Runbook).
- Identity from JWT context only (`c.get('userId')` / `c.get('user')`); never trust body-supplied user IDs.
- Every new write path considers farming abuse: weighted sources, daily caps, `status='approved'` gating, admin-verified school membership.
- New tables/columns must keep both generators byte-stable on re-run (Task 1 defines exactly how).
- Response envelope convention: `{ success: true, data: ... }` / `{ success: false, error: string }`.

---

## Task 1 — Schema: migration 090 + canonical-schema fold-in

**Files:**
- `database/migrations/090_growth_loop.sql` (new)
- `scripts/build-canonical-schema.cjs` (edit: live-DDL inclusion)
- `database/schema.sql` (regenerated, committed result)
- `scripts/build-seed.cjs` (NO edit — 090 is DDL-only, so the seed replay is unaffected)

**Interfaces:** table names `schools`, `race_cycles`, `race_crossings`, `points_ledger`, `referral_code_requests`; new column `users.school_id`; new columns `house_points.is_demo_data` / `house_points.expires_at`.

**Steps:**

- [ ] Record the tsc baseline: `npx tsc -p workers/tsconfig.json 2>&1 | grep -c "error TS"` — expected ~130; use the measured number as the gate ceiling.
- [ ] Create `database/migrations/090_growth_loop.sql` with exactly this DDL (note: `house_points` gains the two demo columns — this also fixes a latent bug: `workers/api/index.ts:3798` already inserts `is_demo_data`/`expires_at` into `house_points`, but no migration ever added them):

```sql
-- 090_growth_loop.sql — growth loop: points ledger, race cycles, schools, code requests
CREATE TABLE IF NOT EXISTS schools (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS race_cycles (
    id TEXT PRIMARY KEY,
    scope TEXT NOT NULL CHECK (scope IN ('platform', 'school')),
    school_id TEXT REFERENCES schools(id),
    target_points INTEGER NOT NULL,
    starts_at TEXT NOT NULL,
    ends_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'crowned', 'closed')),
    winner_user_id TEXT REFERENCES users(id),
    target_hit_at TEXT,
    crowned_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS race_crossings (
    cycle_id TEXT NOT NULL REFERENCES race_cycles(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    crossed_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (cycle_id, user_id)
);

CREATE TABLE IF NOT EXISTS points_ledger (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    source TEXT NOT NULL CHECK (source IN (
        'question_correct', 'battle_win', 'streak_day', 'quest_claim',
        'tutor_session', 'essay_graded', 'referral_signup',
        'referral_paid_conversion', 'house_contribution'
    )),
    source_ref TEXT,
    cycle_id TEXT REFERENCES race_cycles(id),
    is_demo_data INTEGER DEFAULT 0,
    expires_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS referral_code_requests (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    contact TEXT NOT NULL,
    school_name TEXT,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'rejected')),
    issued_code TEXT,
    fulfilled_by TEXT REFERENCES users(id),
    fulfilled_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

ALTER TABLE users ADD COLUMN school_id TEXT REFERENCES schools(id);
ALTER TABLE house_points ADD COLUMN is_demo_data INTEGER DEFAULT 0;
ALTER TABLE house_points ADD COLUMN expires_at TEXT;

CREATE INDEX IF NOT EXISTS idx_points_ledger_user_day ON points_ledger(user_id, source, created_at);
CREATE INDEX IF NOT EXISTS idx_points_ledger_cycle ON points_ledger(cycle_id);
CREATE INDEX IF NOT EXISTS idx_race_cycles_status ON race_cycles(status, scope);
CREATE INDEX IF NOT EXISTS idx_referral_code_requests_status ON referral_code_requests(status);
```

- [ ] Edit `scripts/build-canonical-schema.cjs` following the existing `BANNER_TRAILING_FILES` / `LIVE_REPLAY_FILES` (build-seed) pattern — an explicit list, not a directory scan (a scan would pull in `089_baseline_marker.sql`, whose `schema_baseline` INSERT the canonical schema deliberately excludes):
  - After the `MIGRATIONS_DIR` const add: `const LIVE_MIGRATIONS_DIR = path.join(DB_DIR, 'migrations');` and `const LIVE_DDL_FILES = ['090_growth_loop.sql']; // live DDL folded into the canonical schema (data-only 088/088a and the 089 baseline marker stay out)`.
  - After the archive `for (const f of migrationFiles)` loop, add a second loop: `for (const f of LIVE_DDL_FILES) { fileStats.push({ file: f, ...processFile(path.join(LIVE_MIGRATIONS_DIR, f), `migrations/${f}`) }); }` — the ALTER merges for `users.school_id` / `house_points.*` then flow through the existing `applyAlter` machinery.
  - Banner: append `...LIVE_DDL_FILES` to the banner list expression `[...migrationFiles, ...BANNER_TRAILING_FILES]` → `[...migrationFiles, ...BANNER_TRAILING_FILES, ...LIVE_DDL_FILES]`.
  - Do NOT touch the `migrationUniqueCount !== 178` check (it counts archive files only; unchanged).
  - Do NOT add 090 to `expectedTables` manually — parity only fails on *missing* tables, and 090's tables are created by the processing loop itself.
- [ ] Regenerate: `node scripts/build-canonical-schema.cjs > database/schema.sql.new 2> /tmp/canon-diag.txt && mv database/schema.sql.new database/schema.sql` — diagnostics on stderr must show zero `MISSING` tables and zero new warnings beyond the pre-existing set.
- [ ] Prove byte-stability: run the generator twice more and `diff` — outputs must be identical.
- [ ] Prove the seed is untouched: `node scripts/build-seed.cjs` then `git diff --stat database/seed.sql` — expected: no diff (090 has no data statements; replaying is unchanged).
- [ ] **Verify:** `npm run db:verify` → `✅ db:verify PASSED — 18 checks clean`; plus full gate suite from Global Constraints.

---

## Task 2 — Points helper + tests (TDD)

**Files:**
- `workers/api/points.ts` (new)
- `workers/api/__tests__/points.test.ts` (new)

**Interfaces (relied on by Tasks 3–6):**

```ts
export type PointSource =
  | 'question_correct' | 'battle_win' | 'streak_day' | 'quest_claim'
  | 'tutor_session' | 'essay_graded'
  | 'referral_signup' | 'referral_paid_conversion' | 'house_contribution';

export const SOURCE_WEIGHTS: Record<PointSource, number>;
export const DAILY_SOURCE_CAPS: Partial<Record<PointSource, number>>;

export interface AwardInput {
  userId: string;
  points: number;            // raw XP — users.xp_points increment (display XP, unchanged semantics)
  source: PointSource;
  sourceRef?: string | null;
  isDemoData?: number;       // 0|1 from getDemoDataFlags()
  expiresAt?: string | null; // from getDemoDataFlags()
}

export interface ActiveCycle { id: string; target_points: number; starts_at: string; ends_at: string; }

export function getActiveCycleForUser(db: D1Database, userId: string): Promise<ActiveCycle | null>;
export function awardPoints(db: D1Database, input: AwardInput): Promise<{ awarded: number; capped: boolean }>;
```

**Steps:**

- [ ] Write `points.test.ts` first using `createMockD1` (pattern: `workers/api/__tests__/quickplay-submit.test.ts`): (a) XP update always uses raw points; (b) ledger row uses weighted points (`question_correct` weight 0.2 → 10 XP = 2 race pts); (c) daily cap clamps (`question_correct` cap: after 100 weighted pts today, further awards write XP but no ledger row, `capped: true`); (d) user with `house` set gets a `house_points` row with mapped source; user without house gets none; (e) active school cycle preferred over platform cycle for `cycle_id` stamp; (f) crossing recorded via `INSERT OR IGNORE INTO race_crossings` when cycle score ≥ target.
- [ ] Implement `workers/api/points.ts`. Load-bearing code:

```ts
import type { D1Database } from '@cloudflare/workers-types';

// Anti-farm: farmable sources are down-weighted AND capped per UTC day;
// social/verified sources (battle_win, referral_*, tutor_session) stay uncapped.
export const SOURCE_WEIGHTS: Record<PointSource, number> = {
  question_correct: 0.2,
  battle_win: 1,
  streak_day: 1,
  quest_claim: 0.5,
  tutor_session: 1,
  essay_graded: 0.5,
  referral_signup: 1,
  referral_paid_conversion: 1,
  house_contribution: 1,
};

export const DAILY_SOURCE_CAPS: Partial<Record<PointSource, number>> = {
  question_correct: 100, // weighted race points per UTC day
  quest_claim: 50,
  essay_graded: 50,
};

// house_points.source CHECK is ('practice','battle','competition','achievement','bonus')
const HOUSE_SOURCE_MAP: Partial<Record<PointSource, string>> = {
  question_correct: 'practice',
  battle_win: 'battle',
  quest_claim: 'achievement',
  streak_day: 'achievement',
  essay_graded: 'achievement',
  tutor_session: 'achievement',
  referral_signup: 'bonus',
  referral_paid_conversion: 'bonus',
  house_contribution: 'bonus',
};

// house_points.period convention copied from index.ts /houses/points (YYYY-WW, week-of-month)
function currentPeriod(): string {
  const now = new Date();
  const weekNum = Math.ceil((now.getDate() - now.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

export async function getActiveCycleForUser(db: D1Database, userId: string): Promise<ActiveCycle | null> {
  // Tightest scope wins: the user's school cycle if any, else the platform cycle.
  return db.prepare(`
    SELECT rc.id, rc.target_points, rc.starts_at, rc.ends_at FROM race_cycles rc
    LEFT JOIN users u ON u.id = ?
    WHERE rc.status = 'active'
      AND (rc.scope = 'platform' OR (rc.scope = 'school' AND rc.school_id = u.school_id))
    ORDER BY CASE WHEN rc.scope = 'school' THEN 0 ELSE 1 END
    LIMIT 1
  `).bind(userId).first<ActiveCycle>();
}

async function maybeRecordCrossing(db: D1Database, cycle: ActiveCycle, userId: string): Promise<void> {
  const row = await db.prepare(`
    SELECT COALESCE(SUM(points), 0) AS score FROM points_ledger
    WHERE user_id = ? AND created_at >= ? AND created_at < ? AND is_demo_data = 0
  `).bind(userId, cycle.starts_at, cycle.ends_at).first<{ score: number }>();
  if ((row?.score ?? 0) >= cycle.target_points) {
    await db.prepare(
      `INSERT OR IGNORE INTO race_crossings (cycle_id, user_id) VALUES (?, ?)`
    ).bind(cycle.id, userId).run();
    await db.prepare(
      `UPDATE race_cycles SET target_hit_at = COALESCE(target_hit_at, datetime('now')) WHERE id = ?`
    ).bind(cycle.id).run();
  }
}

export async function awardPoints(db: D1Database, input: AwardInput): Promise<{ awarded: number; capped: boolean }> {
  const weight = SOURCE_WEIGHTS[input.source];
  let weighted = Math.round(input.points * weight);
  let capped = false;

  const cap = DAILY_SOURCE_CAPS[input.source];
  if (cap !== undefined && weighted > 0) {
    const row = await db.prepare(`
      SELECT COALESCE(SUM(points), 0) AS today FROM points_ledger
      WHERE user_id = ? AND source = ? AND date(created_at) = date('now')
    `).bind(input.userId, input.source).first<{ today: number }>();
    const used = row?.today ?? 0;
    if (used >= cap) { weighted = 0; capped = true; }
    else if (used + weighted > cap) { weighted = cap - used; capped = true; }
  }

  // 1. Display XP — raw points, exactly the semantics the retrofitted sites have today.
  await db.prepare('UPDATE users SET xp_points = xp_points + ? WHERE id = ?')
    .bind(input.points, input.userId).run();

  if (weighted > 0) {
    // 2. Race ledger (weighted), stamped with the user's tightest active cycle.
    const cycle = await getActiveCycleForUser(db, input.userId);
    await db.prepare(`
      INSERT INTO points_ledger (id, user_id, points, source, source_ref, cycle_id, is_demo_data, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(`pl_${crypto.randomUUID()}`, input.userId, weighted, input.source,
            input.sourceRef ?? null, cycle?.id ?? null,
            input.isDemoData ?? 0, input.expiresAt ?? null).run();
    if (cycle) await maybeRecordCrossing(db, cycle, input.userId);

    // 3. House consistency: race score and house contribution can never visibly disagree.
    const houseSource = HOUSE_SOURCE_MAP[input.source];
    if (houseSource) {
      const u = await db.prepare('SELECT house FROM users WHERE id = ?')
        .bind(input.userId).first<{ house: string | null }>();
      if (u?.house) {
        await db.prepare(`
          INSERT INTO house_points (id, house_id, user_id, points, source, source_id, period, is_demo_data, expires_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(`hp_${crypto.randomUUID()}`, u.house, input.userId, weighted, houseSource,
                input.sourceRef ?? null, currentPeriod(),
                input.isDemoData ?? 0, input.expiresAt ?? null).run();
      }
    }
  }
  return { awarded: weighted, capped };
}
```

- [ ] **Verify:** `npx vitest run workers/api/__tests__/points.test.ts` → all new tests pass; then full gate suite.

---

## Task 3 — Retrofit the 8 XP write sites onto `awardPoints`

**Files (each replaces its raw `UPDATE users SET xp_points = xp_points + ?` award with `awardPoints`):**
- `workers/api/engagement.ts:345` — comeback challenge complete → source `quest_claim`
- `workers/api/events.ts:208` — seasonal event XP reward → source `quest_claim`
- `workers/api/quickplay.ts:269` — quickplay session XP → source `question_correct`
- `workers/api/rewards.ts:151` — mystery chest XP → source `quest_claim`
- `workers/api/rewards.ts:338` — lucky wheel XP → source `quest_claim`
- `workers/api/subscriptions.ts:381` — trial task XP → source `quest_claim`
- `workers/api/index.ts:2290` — quest claim (already in a `db.batch`; collect the XP update + ledger via helper called before the batch, or move both into the batch — see step) → source `quest_claim`
- `workers/api/index.ts:2481` — streak milestone → source `streak_day`
- `workers/api/__tests__/xp-awards.test.ts`, `quest-claim.test.ts`, `quickplay-submit.test.ts` — update SQL-match expectations to the helper's emitted statements

**Interfaces:** consumes `awardPoints` from Task 2. No new exports.

**Steps:**

- [ ] In each satellite router add `import { awardPoints } from './points';` and replace the raw award with e.g. `await awardPoints(c.env.DB, { userId: user.userId, points: totalXp, source: 'question_correct', sourceRef: sessionId, ...getDemoDataFlags-equivalent })`. Satellite routers don't have `getDemoDataFlags` (it lives in `index.ts`/`demoUtils.ts`) — import `getDemoDataFlags` from `./demoUtils` and pass `isDemoData`/`expiresAt`.
- [ ] **Excluded on purpose:** `events.ts:301` (tournament entry-fee debit), `events.ts:328` (tournament refund), `cosmetics.ts:349` (purchase debit) — debits/reversals are not earning events and must NOT create ledger rows.
- [ ] `index.ts:2290` (quest claim) currently batches `UPDATE users xp` + `INSERT quest_completions` atomically. Keep atomicity: call `awardPoints` for the XP+ledger writes first, then run the remaining `quest_completions` insert in the batch, and update `quest-claim.test.ts` accordingly. Add a comment noting the trade-off (helper does its own reads for caps/cycles, so it can't join the caller's batch).
- [ ] For demo users pass the flags: in `index.ts` use the local `getDemoDataFlags(userId)`; in satellites `import { getDemoDataFlags } from './demoUtils'`.
- [ ] Update the three existing tests whose regexes assert the raw `UPDATE users SET xp_points` SQL: the helper still emits that exact statement, so most assertions hold; adjust any assertion about statement *order* or call counts (ledger/cap reads add calls).
- [ ] **Verify:** `npx vitest run` → all pass, incl. updated XP tests; full gate suite.

---

## Task 4 — Race engine: endpoints + cron crowning

**Files:**
- `workers/api/race.ts` (new)
- `workers/api/index.ts` (edit: mount router, extend `scheduled` handler, add `REGISTRATION_MODE`/`RACE_TARGET_POINTS` to `Env` interface at ~line 55-70)
- `workers/api/__tests__/race.test.ts` (new)

**Interfaces:** `export const raceApp: Hono<{ Bindings: Env }>`; `export async function runRaceCycleMaintenance(db: D1Database): Promise<{ opened: number; crowned: number }>`.

**Endpoints:**
- `GET /api/race/current` (requireAuth) → `{ success, data: { cycle: { id, scope, schoolId, targetPoints, startsAt, endsAt, targetHitAt } | null, top: [{ rank, userId, name, avatarUrl, score }], me: { rank, score } | null } }`
- `GET /api/race/cycles?limit=10` (public) → `{ success, data: { cycles: [{ id, scope, schoolId, targetPoints, startsAt, endsAt, status, winnerName, crownedAt }] } }`
- `PATCH /api/admin/race/cycles/:id` (adminApp in index.ts) body `{ targetPoints?, endsAt? }` → `{ success, data: { id } }` — minimal founder knob for tuning the pilot target.

**Steps:**

- [ ] TDD `race.test.ts` first: (a) maintenance opens a platform cycle when none active (target from `RACE_TARGET_POINTS` env or default 1000; week = Monday 00:00 UTC → next Monday); (b) maintenance is idempotent — second run opens nothing; (c) crown: cycle with a crossing → earliest `crossed_at` wins, `status='crowned'`, `winner_user_id`/`crowned_at` set; (d) crown with no crossing → highest window score wins; (e) empty cycle → `status='closed'`, no winner; (f) school cycles only open for `schools.status='active'` rows and only score users with matching `users.school_id` and `status='approved'`.
- [ ] Implement crown logic in `race.ts`:

```ts
export async function crownCycle(db: D1Database, cycle: {
  id: string; scope: string; school_id: string | null; starts_at: string; ends_at: string;
}): Promise<string | null> {
  // First crossing wins the cycle outright (ties impossible: PRIMARY KEY + INSERT OR IGNORE,
  // earliest crossed_at is unique per user; if somehow tied, earlier crossing still wins).
  const crossing = await db.prepare(`
    SELECT user_id FROM race_crossings WHERE cycle_id = ? ORDER BY crossed_at ASC LIMIT 1
  `).bind(cycle.id).first<{ user_id: string }>();

  let winnerId: string | null = crossing?.user_id ?? null;

  if (!winnerId) {
    // Target never hit: highest weighted score inside the cycle window.
    const scopeClause = cycle.scope === 'school' ? 'AND u.school_id = ?' : '';
    const binds: unknown[] = [cycle.starts_at, cycle.ends_at];
    if (cycle.scope === 'school') binds.push(cycle.school_id);
    const top = await db.prepare(`
      SELECT pl.user_id, SUM(pl.points) AS score
      FROM points_ledger pl
      JOIN users u ON u.id = pl.user_id
      WHERE pl.created_at >= ? AND pl.created_at < ?
        AND pl.is_demo_data = 0 AND u.status = 'approved' ${scopeClause}
      GROUP BY pl.user_id
      ORDER BY score DESC, MIN(pl.created_at) ASC
      LIMIT 1
    `).bind(...binds).first<{ user_id: string }>();
    winnerId = top?.user_id ?? null;
  }

  await db.prepare(`
    UPDATE race_cycles
    SET status = ?, winner_user_id = ?, crowned_at = datetime('now')
    WHERE id = ? AND status = 'active'
  `).bind(winnerId ? 'crowned' : 'closed', winnerId, cycle.id).run();
  return winnerId;
}
```

- [ ] Implement `runRaceCycleMaintenance(db)`: (1) crown every `status='active'` cycle with `ends_at <= datetime('now')` via `crownCycle`; (2) open next week's cycle for platform + each `schools.status='active'` school that has no active cycle (`INSERT ... SELECT ... WHERE NOT EXISTS (SELECT 1 FROM race_cycles WHERE scope=? AND school_id IS ? AND status='active')`). Default window: previous Monday 00:00 UTC → next Monday 00:00 UTC; target from a `targetPoints` parameter (cron passes `Number(env.RACE_TARGET_POINTS) || 1000`).
- [ ] Implement `GET /current` — identity from JWT: resolve the caller's tightest active cycle via `getActiveCycleForUser` (Task 2 import), compute `top` with the window-score query from `crownCycle` (LIMIT 20, plus per-user rank via `COUNT(*)+1` of higher scores), and `me` from the caller's own sum. `me: null` when the caller has no points this cycle.
- [ ] Wire cron in `index.ts` `scheduled` handler (after the paper-attempts cleanup block, same try/catch style):

```ts
    // Growth loop: crown ended race cycles, open next week's cycles
    try {
      const race = await runRaceCycleMaintenance(env.DB);
      console.log(`Race maintenance: ${race.crowned} crowned, ${race.opened} opened`);
    } catch (error) {
      console.error('Race cycle maintenance failed:', error);
    }
```

- [ ] Mount in `index.ts` next to the other router mounts: `app.route('/api/race', raceApp);` and add `import { raceApp, runRaceCycleMaintenance } from './race';`. Register `GET /current` and `GET /cycles` on `raceApp` with `requireAuth` only on `/current`; keep param-free paths so no Hono shadowing issues arise (the file documents several first-registered-wins traps — do not add `/:id` routes to raceApp).
- [ ] **Verify:** `npx vitest run workers/api/__tests__/race.test.ts` → pass; `npm run build` green; full gate suite.

---

## Task 5 — Registration referral + request-a-code (backend)

**Files:**
- `workers/api/index.ts` (edit: `/auth/register` handler at line 858; `Env` interface; adminApp code-request routes near line 6398)
- `workers/api/affiliates.ts` (edit: export `isValidReferralCode`; extract + export `attributeReferral`; `/process-referral` no-op; new `GET /validate-code/:code`)
- `workers/api/rate-limit.ts` (edit: add `'code-request'` config)
- `workers/api/__tests__/register-referral.test.ts` (new), `workers/api/__tests__/affiliates-process-referral.test.ts` (edit: add no-op case)

**Interfaces:** `export function isValidReferralCode(code: string): boolean` and `export async function attributeReferral(db: D1Database, affiliate: { id: string; user_id: string }, newUserId: string, code: string): Promise<string /* referralId */>` from `affiliates.ts`.

**New endpoints:**
- `GET /api/affiliates/validate-code/:code` (public, in-memory rate limit like `/ref/:code`) → `{ success, data: { valid: boolean, schoolName: string | null } }` (schoolName from the affiliate's `users.school_name`, for UI reassurance).
- `POST /api/referral-code-requests` (public on publicApp, DB-backed `checkRateLimit(db, clientIp, 'code-request')`) body `{ name, contact, schoolName?, message? }` → `{ success, data: { id } }`; inserts into `referral_code_requests`, notifies admins via the existing `createNotification` pattern (link `/admin/affiliates`).
- `GET /api/admin/referral-code-requests?status=pending` (adminApp) → `{ success, data: { requests: [...], total } }`.
- `POST /api/admin/referral-code-requests/:id/fulfill` (adminApp) body `{ code }` → validates code exists in `affiliate_profiles`, sets `status='fulfilled', issued_code, fulfilled_by=<JWT admin id>, fulfilled_at=datetime('now')` → `{ success, data: { id, issuedCode } }`.
- `POST /api/admin/referral-code-requests/:id/reject` (adminApp) → `{ success, data: { id } }`.

**Steps:**

- [ ] TDD `register-referral.test.ts` (patterns from `register.test.ts` + `mockD1`): (a) invite mode + no code → 400 with `data.codeRequired === true`; (b) invite mode + bad format → 400; (c) invite mode + unknown code → 400 `Invalid referral code`; (d) valid code → user INSERT carries `status='approved'` and `referred_by=<CODE>` and attribution batch runs; (e) open mode + no code → unchanged `pending` flow; (f) open mode + valid code → `approved` + attribution; (g) ordering: code validation happens after Turnstile, before the email-exists check.
- [ ] In `affiliates.ts`: add `export` to `isValidReferralCode`; extract the batch body of `/process-referral` (referral insert + `total_referrals` bump + `referred_by` set + `affiliate_xp + 50`, lines 966-983) into exported `attributeReferral(db, affiliate, newUserId, code)` returning `referralId`; `/process-referral` calls it. Add the no-op guard at the top of `/process-referral` after the self-referral checks:

```ts
    // Single attribution path: register-time code sets referred_by directly.
    // If it's already set, this endpoint has nothing to do (no double attribution).
    const current = await c.env.DB.prepare(
      'SELECT referred_by FROM users WHERE id = ?'
    ).bind(newUserId).first<{ referred_by: string | null }>();
    if (current?.referred_by) {
      return c.json({ success: true, data: { alreadyAttributed: true } });
    }
```

- [ ] In `index.ts` `/auth/register`, after the Turnstile block (line ~907) and before `validateRegistration`:

```ts
    // Growth loop: referral code gate. Validated BEFORE any other field/user check —
    // an invalid code is a 400 before the email-exists lookup or user creation.
    const inviteMode = c.env.REGISTRATION_MODE === 'invite';
    let referralAffiliate: { id: string; user_id: string; referral_code: string } | null = null;
    if (referralCode) {
      if (!isValidReferralCode(referralCode)) {
        return c.json({ success: false, error: 'Invalid referral code format' }, 400);
      }
      referralAffiliate = await c.env.DB.prepare(`
        SELECT id, user_id, referral_code FROM affiliate_profiles
        WHERE referral_code = ? AND is_active = 1
      `).bind(String(referralCode).toUpperCase()).first();
      if (!referralAffiliate) {
        return c.json({ success: false, error: 'Invalid referral code' }, 400);
      }
    } else if (inviteMode) {
      return c.json({
        success: false,
        error: 'An invite code is required to register. Request one below.',
        data: { codeRequired: true },
      }, 400);
    }
```

  Add `referralCode` to the destructured body fields and `REGISTRATION_MODE?: string` to `Env`.
- [ ] In the same handler: `const initialStatus = referralAffiliate ? 'approved' : 'pending';` — use it in the INSERT (the code IS the approval for pilot students) and add `referred_by` to the INSERT column list/binds when `referralAffiliate` is set (bind `referralAffiliate.referral_code`, else NULL — keep a single INSERT shape with `referred_by` always in the column list).
- [ ] After `await c.env.DB.batch(statements)`: if `referralAffiliate`, call `await attributeReferral(c.env.DB, referralAffiliate, id, referralAffiliate.referral_code)` (import from `./affiliates`) — note it re-sets `referred_by` to the same value, harmlessly — then `await awardPoints(c.env.DB, { userId: referralAffiliate.user_id, points: 100, source: 'referral_signup', sourceRef: id })` (referred account is immediately approved, so the signup points fire now; 100 = default, tune with pilot data).
- [ ] Open-mode attribution gap: a user who registers with a code in open mode goes to `pending`, so their referrer's `referral_signup` points must wait for approval (the design's free anti-alt gate). In `adminApp.post('/users/:id/approve')` (index.ts:6510), after the status update succeeds, look up the user's `referred_by`; if set and no `affiliate_referrals` row exists yet for this user, resolve the affiliate and call `attributeReferral` + the `referral_signup` `awardPoints` there instead. Guard the register-time award with `if (referralAffiliate && inviteMode)` so the points fire exactly once in either flow. (Implementation detail to settle in review: simplest correct rule is "award on approval only" — i.e., register stores `referred_by` + creates the `affiliate_referrals` row, and BOTH modes award `referral_signup` in the approve handler; invite-mode auto-approval then calls the same small helper inline.)
- [ ] Update the success response: `data.status` reflects `initialStatus`; when `approved`, message = "Your account is ready — you can log in now."
- [ ] Add `'code-request': { maxRequests: 3, windowMs: 60 * 60 * 1000 }` to `RATE_LIMITS` in `rate-limit.ts`.
- [ ] OAuth gap (must not be skipped): Google self-registration in `workers/api/oauth.ts` bypasses `/auth/register`. Add the same invite-mode rejection to the OAuth register path (find it via `workers/api/__tests__/oauth-register-role.test.ts`): when `REGISTRATION_MODE=invite` and no referral code was captured, reject with the same `codeRequired` envelope.
- [ ] **Verify:** `npx vitest run workers/api/__tests__/register-referral.test.ts workers/api/__tests__/affiliates-process-referral.test.ts workers/api/__tests__/register.test.ts` → pass; full gate suite.

---

## Task 6 — Affiliate paid-conversion points

**Files:**
- `workers/api/payments.ts` (edit: `processAffiliateCommission`, line 533)
- `workers/api/__tests__/affiliate-conversion-points.test.ts` (new; model on `payments.verify.test.ts`)

**Interfaces:** consumes `awardPoints` (Task 2). New export `export const REFERRAL_PAID_CONVERSION_POINTS = 500;` in `payments.ts`.

**Steps:**

- [ ] TDD: (a) a verified referred payment produces exactly one `points_ledger` insert with `source='referral_paid_conversion'`, `points=500`, `user_id=<affiliate user>`; (b) a repeat verify (claim-first `changes=0` path) produces no ledger insert; (c) a referral already `converted` produces none.
- [ ] In `processAffiliateCommission`, immediately after the `UPDATE affiliate_referrals SET status='converted' ...` (line ~640) add:

```ts
    // Growth loop: race points ride the existing exactly-once path — this line is
    // unreachable for duplicate verifies (claim-first at payments.ts:437) and for
    // already-converted referrals (guard above), so the 500 pts can never double-fire.
    await awardPoints(db, {
      userId: affiliate.user_id as string,
      points: REFERRAL_PAID_CONVERSION_POINTS,
      source: 'referral_paid_conversion',
      sourceRef: referral.id as string,
    });
```

- [ ] **Verify:** new test file passes; `npx vitest run` all pass; full gate suite.

---

## Task 7 — Frontend: registration referral UI

**Files:**
- `src/components/auth/AuthModal.tsx` (edit: register form step ~line 653-760; submit handler ~line 314)
- `src/stores/authStore.ts` (edit: `RegisterData` interface line 154, `register` body line 266)
- `src/lib/api.ts` (edit: `RegisterData` interface line 342)

**Interfaces:** `RegisterData.referralCode?: string` (both `authStore.ts` and `api.ts`).

**Steps:**

- [ ] Add a "Referral / Invite Code" input to the register step of `AuthModal`, after Confirm Password, matching the existing field styling (`pl-10` icon input, `formErrors.referralCode` pattern). Prefill from the URL: `const params = new URLSearchParams(window.location.search); params.get('ref')` — the `/api/affiliates/ref/:code` redirect already lands users on `/register?ref=CODE`, and `/register` redirects to `/?register=true` (preserve the `ref` param through that redirect in `src/App.tsx` `RegisterPage`: `Navigate to={\`/?register=true${ref ? \`&ref=${encodeURIComponent(ref)}\` : ''}\`}`).
- [ ] Live validation on blur: `api.get('/affiliates/validate-code/<CODE>')` → show a green check + the affiliate's school name, or the error text. Skip the call for empty input.
- [ ] "Don't have a code? Request one" link under the field toggles an inline request form (name, contact, school name) posting `{ name, contact, schoolName }` to `/referral-code-requests` via `api.post`; on `{ success: true }` show "We'll review your request and send a code." Rate-limit (429/`-`retry) errors surface via the existing error rendering.
- [ ] Submit: include `referralCode` (trimmed, uppercased) in the `register({...})` call in `AuthModal` (~line 315) and in the `api.post('/auth/register', {...})` body in `authStore.ts`. On a 400 whose response carries `data.codeRequired`, open the request form automatically with the error message shown (envelope: `api.post` throws on `success:false` — catch and inspect the thrown error message; simplest: match on `'invite code is required'` and toggle the form).
- [ ] On `data.status === 'approved'` response, show "Your account is ready — log in" and switch the modal to login mode instead of the pending-approval copy.
- [ ] Hide the `GoogleSignInButton` in register mode when the backend says invite mode (mirror the backend rejection: attempt without code → the `codeRequired` error path toggles the request form; no separate config endpoint needed for the pilot).
- [ ] **Verify:** `npm run build` green; `npx vitest run` pass; manual smoke via `npm run dev:all` — register with a seeded code, without a code in dev (open mode), and submit a code request.

---

## Task 8 — Frontend: race + leaderboard UI

**Files:**
- `src/stores/raceStore.ts` (new; model on `src/stores/leaderboardStore.ts`)
- `src/pages/Leaderboard.tsx` (edit: add "Weekly Race" tab)
- `src/pages/Dashboard.tsx` (edit: compact race card)
- `src/App.tsx` (no route change needed — the tab lives on `/leaderboard`)

**Interfaces:** `useRaceStore` with `{ current: RaceCurrent | null; fetchCurrent: () => Promise<void> }` where `RaceCurrent = { cycle: {...} | null; top: RaceEntry[]; me: { rank: number; score: number } | null }` mirroring `GET /api/race/current`.

**Steps:**

- [ ] `raceStore.ts`: `fetchCurrent` calls `api.get('/race/current')`, stores `response.data`, same error-shape handling as `leaderboardStore`.
- [ ] `Leaderboard.tsx`: add a tab switcher (existing page already has period controls ~line 277-320 — match its styling): "XP Leaders" (current content) | "Weekly Race". Race tab shows: target progress bar (`top[0].score / cycle.targetPoints`), countdown to `endsAt`, top-20 list with rank/name/score, and the caller's rank chip ("You're #N — M points to the target"). Empty state: "The next race starts Monday."
- [ ] `Dashboard.tsx`: compact card linking to `/leaderboard` — current cycle target, caller's score/rank, progress bar. Reuse `useRaceStore`; fetch on mount alongside existing dashboard fetches.
- [ ] House standings stay where they are (`src/pages/HouseCup.tsx` reads `/houses` — unchanged; the helper's `house_points` writes keep them consistent with race scores by construction).
- [ ] **Verify:** `npm run build` green; manual smoke of both pages against `npm run dev:all`.

---

## Task 9 — Admin code-issue UI

**Files:**
- `src/pages/AdminAffiliates.tsx` (edit: third tab; current tabs at lines 61/249-270)
- `src/stores/affiliateStore.ts` (edit or local component state — match existing pattern in `AdminAffiliates.tsx`)

**Interfaces:** consumes `GET /api/admin/referral-code-requests`, `POST .../fulfill`, `POST .../reject` from Task 5.

**Steps:**

- [ ] Add `'requests'` to the `activeTab` union and a "Code Requests" tab button (copy the existing tab markup).
- [ ] Requests table: name, contact, school, message, requested date, status; actions on `pending` rows: "Issue code" (inline input for the ambassador code, e.g. the `STJOHNS` ambassador profile code, POSTs to `.../fulfill`) and "Reject".
- [ ] Fulfill success shows the issued code with a copy-to-clipboard button (staff send it via their own channel — no email send in this iteration).
- [ ] **Verify:** `npm run build` green; manual smoke: request created in Task 7 appears in the tab; fulfill marks it and stores `issued_code`.

---

## Task 10 — Final gate

**Steps:**

- [ ] `npx vitest run` → all pass.
- [ ] `npm run build` → green.
- [ ] `npx tsc -p workers/tsconfig.json 2>&1 | grep -c "error TS"` → ≤ baseline recorded in Task 1 (expected 130).
- [ ] `npm run db:verify` → `✅ db:verify PASSED — 18 checks clean`.
- [ ] Generator byte-stability: `node scripts/build-canonical-schema.cjs > /tmp/a.sql && node scripts/build-canonical-schema.cjs > /tmp/b.sql && diff /tmp/a.sql /tmp/b.sql` → no output; `diff /tmp/a.sql database/schema.sql` → no output. `node scripts/build-seed.cjs && git diff --quiet database/seed.sql` → exit 0.
- [ ] `git status` review: only the files listed in this plan changed.

## Verification

Full gate list (also after every task): vitest all green; `npm run build` green; workers tsc errors ≤ 130; `npm run db:verify` 18/18; canonical-schema generator byte-stable on re-run and equal to committed `database/schema.sql`; seed generator byte-stable and `database/seed.sql` unchanged.

## Out of scope

- Race admin polish (full cycle management console, award tracking, analytics).
- National/cross-school leaderboard (school-scoped only for the pilot; `/api/affiliates/leaderboard/schools` already exists for affiliate stats).
- Parent/tutor race tracks (open question in the design doc).
- Auto-issued codes toggle (staff-issued only during the pilot).
- Emailing issued codes to requesters (manual staff follow-up for the pilot).
- Anti-farm analytics/forensics beyond weights + caps + approval gating.

## Prod Apply Runbook (user-gated — agent never runs these)

1. Backup: `npm run db:backup` (runs `wrangler d1 export`, user executes).
2. Apply 090: `wrangler d1 migrations apply brilla-db --remote` — the 089 baseline marker means wrangler applies only 090.
3. Provision the pilot (one-off SQL via `wrangler d1 execute brilla-db --remote --command=...`):
   - `INSERT INTO schools (id, name, slug) VALUES ('sch_stjohns', 'St John''s Grammar School', 'stjohns');`
   - Create the ambassador user (role `student`, status `approved`) + `affiliate_profiles` row with a chosen `referral_code` (e.g. `STJOHNS`); codes issued from the admin UI are minted against this profile.
   - Set pilot students' `users.school_id = 'sch_stjohns'` (admin-verified membership — never self-declared; `school_name` free text never drives race scope).
4. First cycle: maintenance opens cycles automatically on the next cron tick; optionally insert the first `race_cycles` row manually with the tuned target.
5. Flip invite mode at pilot start: add `REGISTRATION_MODE = "invite"` to `[vars]` in `wrangler.toml` and redeploy (and optionally `RACE_TARGET_POINTS`). Remove it to return to open registration.
6. Rollback: 090 is additive-only (new tables + nullable columns); rollback = remove `REGISTRATION_MODE`, redeploy previous worker.

## Design-doc corrections (verified against the code while planning)

- The design's "code validated first, before anything else" is implemented as: after IP rate-limit + Turnstile (which necessarily run first, index.ts:867-907), before `validateRegistration` and the email-exists check.
- Registration is a modal (`AuthModal.tsx` via `/?register=true`), not a standalone page — `/register` redirects (`src/App.tsx:179-189`). The "same screen" requirement lands in the modal.
- No frontend code calls `/affiliates/process-referral` today (grep over `src/` finds none) — making register-time capture the single attribution path requires no client retirement, only the server-side no-op guard.
- `house_points` lacks `is_demo_data`/`expires_at` in every migration and the canonical schema, yet `index.ts:3798` inserts them — a latent bug in the existing `/houses/points` endpoint, fixed by 090's two ALTERs.
- The design's "weekly cron" rides the existing 6-hourly cron (`wrangler.toml` `crons = ["0 */6 * * *"]`) via idempotent maintenance; no new trigger.
- "~8 scattered XP write sites" confirmed exactly: `engagement.ts:345`, `events.ts:208`, `quickplay.ts:269`, `rewards.ts:151`, `rewards.ts:338`, `subscriptions.ts:381`, `index.ts:2290`, `index.ts:2481` (plus three debits/refunds correctly excluded).
