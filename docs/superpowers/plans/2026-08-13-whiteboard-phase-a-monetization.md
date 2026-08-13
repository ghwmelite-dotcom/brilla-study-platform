# AI Whiteboard Phase A — Monetization + Stabilization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put the AI whiteboard behind the paid wall, meter free-tier classroom chat to 10 AI interactions/day, give admins a real set-tier action, and fix the whiteboard playback bugs — with zero database schema changes.

**Architecture:** All gating uses the existing `isPremiumUser()` helper; the free AI allowance is counted from the existing `revision_ai_interactions` audit table. Admin actions follow the existing `extend-trial`/`add-credits` pattern (validation + `logAudit`). Frontend learns entitlements from the existing `GET /api/subscriptions/features` endpoint, extended with two fields.

**Tech Stack:** Cloudflare Worker (Hono) + D1, React 18 + Zustand + fabric.js, Vitest with `workers/api/__tests__/helpers/mockD1`.

**Spec:** `docs/superpowers/specs/2026-08-13-whiteboard-monetization-and-wow-design.md` (Phase B gets its own plan after Phase A ships — its tasks depend on the post-A state of these files.)

## Global Constraints

- No DB schema changes. The allowance is computed from `revision_ai_interactions` (`interaction_type` values: `teach_<phase>`, `student_question`, `checkpoint`, `whiteboard_<lessonType>`).
- Free-tier daily AI allowance is exactly **10** (`DAILY_AI_INTERACTION_LIMIT`), counted per UTC day (`date(created_at) = date('now')`); premium = unlimited (`remaining: -1`).
- Premium = `isPremiumUser()` (admin/teacher role, active paid tier, or active trial). All paid tiers get the whiteboard.
- 403 bodies carry machine flags — `upgradeRequired: true` (whiteboard) or `aiLimitReached: true` (chat cap) — the frontend never parses English.
- Worker test pattern: `workers/api/__tests__/quickplay-submit.test.ts` (hono `sign` for JWT, `createMockD1` handlers, `worker.fetch`).
- Commit after every task. Do not push.
- `cd C:/dev/Projects/brilla-study-platform` for all commands.

---

### Task 1: AI allowance helpers in usage-limits.ts

**Files:**
- Modify: `workers/api/usage-limits.ts` (append after `checkCanAnswer`, ~line 174)
- Test: `workers/api/__tests__/ai-allowance.test.ts` (create)

**Interfaces:**
- Consumes: `isPremiumUser(userId, db)` (same file, line 55).
- Produces:
  - `DAILY_AI_INTERACTION_LIMIT: 10`
  - `getDailyAiInteractions(userId: string, db: D1Database): Promise<number>`
  - `checkAiAllowance(userId: string, db: D1Database): Promise<{ allowed: boolean; remaining: number; limit: number }>`
  - Later tasks import these from `./usage-limits` (worker) — Tasks 2 and 3.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { createMockD1 } from './helpers/mockD1';
import {
  checkAiAllowance,
  getDailyAiInteractions,
  DAILY_AI_INTERACTION_LIMIT,
} from '../usage-limits';

const premiumUserHandler = {
  match: /SELECT role, subscription_tier_id, subscription_expires_at, trial_expires_at\s+FROM users/,
  first: () => ({
    role: 'student',
    subscription_tier_id: 'tier_student_monthly',
    subscription_expires_at: new Date(Date.now() + 86400000).toISOString(),
    trial_expires_at: null,
  }),
};

const freeUserHandler = {
  match: /SELECT role, subscription_tier_id, subscription_expires_at, trial_expires_at\s+FROM users/,
  first: () => ({
    role: 'student',
    subscription_tier_id: 'tier_free',
    subscription_expires_at: null,
    trial_expires_at: null,
  }),
};

const aiCountHandler = (count: number) => ({
  match: /SELECT COUNT\(\*\) AS count FROM revision_ai_interactions/,
  first: () => ({ count }),
});

describe('AI allowance (revision classroom free tier)', () => {
  it('counts only teaching interactions from today', async () => {
    const db = createMockD1([aiCountHandler(7)]);
    const used = await getDailyAiInteractions('user_1', db as any);
    expect(used).toBe(7);
    const call = db.calls.find((c) => /revision_ai_interactions/.test(c.sql));
    expect(call!.sql).toMatch(/interaction_type LIKE 'teach_%'/);
    expect(call!.sql).toMatch(/'student_question'/);
    expect(call!.sql).toMatch(/date\(created_at\) = date\('now'\)/);
  });

  it('premium users are always allowed with unlimited remaining', async () => {
    const db = createMockD1([premiumUserHandler]);
    const r = await checkAiAllowance('user_1', db as any);
    expect(r).toEqual({ allowed: true, remaining: -1, limit: -1 });
    // premium short-circuits: no count query issued
    expect(db.calls.some((c) => /revision_ai_interactions/.test(c.sql))).toBe(false);
  });

  it('free user under the cap is allowed with correct remaining', async () => {
    const db = createMockD1([freeUserHandler, aiCountHandler(3)]);
    const r = await checkAiAllowance('user_1', db as any);
    expect(r).toEqual({ allowed: true, remaining: 7, limit: DAILY_AI_INTERACTION_LIMIT });
  });

  it('free user at the cap is rejected', async () => {
    const db = createMockD1([freeUserHandler, aiCountHandler(10)]);
    const r = await checkAiAllowance('user_1', db as any);
    expect(r.allowed).toBe(false);
    expect(r.remaining).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run workers/api/__tests__/ai-allowance.test.ts`
Expected: FAIL — `DAILY_AI_INTERACTION_LIMIT` is not exported.

- [ ] **Step 3: Implement the helpers**

Append to `workers/api/usage-limits.ts` after `checkCanAnswer` (line 173):

```ts
// Daily AI interaction allowance for the revision classroom (free tier).
// Counted from the revision_ai_interactions audit table — no schema change.
export const DAILY_AI_INTERACTION_LIMIT = 10;

export interface AiAllowanceResult {
  allowed: boolean;
  remaining: number; // -1 = unlimited (premium)
  limit: number; // -1 = unlimited (premium)
}

/**
 * Count today's AI teaching interactions (teach phases, student questions,
 * checkpoint generations). Whiteboard interactions are excluded — the
 * whiteboard is premium-gated separately.
 */
export async function getDailyAiInteractions(
  userId: string,
  db: D1Database
): Promise<number> {
  const row = await db
    .prepare(`
      SELECT COUNT(*) AS count FROM revision_ai_interactions
      WHERE user_id = ?
        AND (interaction_type LIKE 'teach_%' OR interaction_type IN ('student_question', 'checkpoint'))
        AND date(created_at) = date('now')
    `)
    .bind(userId)
    .first<{ count: number }>();

  return row?.count || 0;
}

/**
 * Check whether a user may consume another classroom AI interaction today.
 */
export async function checkAiAllowance(
  userId: string,
  db: D1Database
): Promise<AiAllowanceResult> {
  if (await isPremiumUser(userId, db)) {
    return { allowed: true, remaining: -1, limit: -1 };
  }

  const used = await getDailyAiInteractions(userId, db);
  const remaining = Math.max(0, DAILY_AI_INTERACTION_LIMIT - used);

  return {
    allowed: remaining > 0,
    remaining,
    limit: DAILY_AI_INTERACTION_LIMIT,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run workers/api/__tests__/ai-allowance.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add workers/api/usage-limits.ts workers/api/__tests__/ai-allowance.test.ts
git commit -m "feat(usage): daily AI interaction allowance helpers for revision classroom"
```

---

### Task 2: Gate and meter the revision-classroom AI endpoints

**Files:**
- Modify: `workers/api/revision-classroom.ts` (imports ~line 4; teach handler line 838; checkpoint/generate line 938; ask line 1020; generateWhiteboardContent line 1851; whiteboard-teach line 2142)
- Test: `workers/api/__tests__/revision-gating.test.ts` (create)

**Interfaces:**
- Consumes: `isPremiumUser`, `checkAiAllowance` from Task 1.
- Produces:
  - `POST /lessons/:lessonId/whiteboard-teach` → 403 `{ success:false, error, upgradeRequired:true }` for non-premium. Success body gains `data.fallback: boolean`.
  - `POST /lessons/:lessonId/teach` and `/ask` and `/checkpoint/generate` → 403 `{ success:false, error, aiLimitReached:true, remaining:0 }` when a free user is at the cap. Success bodies gain `data.remainingFreeToday: number` (-1 for premium).
  - `generateWhiteboardContent` now returns `Promise<{ content: WhiteboardTeachingContent; usedFallback: boolean; tokensUsed: number | null }>` (was `Promise<WhiteboardTeachingContent>`).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { sign } from 'hono/jwt';
import worker from '../index';
import { createMockD1, type MockHandler } from './helpers/mockD1';

const JWT_SECRET = 'test-secret-that-is-long-enough';

async function token(payload: object) {
  return sign(
    { ...payload, exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000) },
    JWT_SECRET,
  );
}

const authHandler: MockHandler = {
  match: /SELECT role, status, is_active FROM users/,
  first: () => ({ role: 'student', status: 'approved', is_active: 1 }),
};

const lessonHandler: MockHandler = {
  match: /FROM revision_lessons rl/,
  first: () => ({
    id: 'lesson_1', session_id: 'session_1', topic_id: 'topic_1',
    topic_name: 'Algebra', subject_name: 'Mathematics', exam_type: 'nsmq', user_id: 'user_1',
  }),
};

const premiumHandler: MockHandler = {
  match: /SELECT role, subscription_tier_id, subscription_expires_at, trial_expires_at\s+FROM users/,
  first: () => ({
    role: 'student', subscription_tier_id: 'tier_student_monthly',
    subscription_expires_at: new Date(Date.now() + 86400000).toISOString(), trial_expires_at: null,
  }),
};

const freeHandler: MockHandler = {
  match: /SELECT role, subscription_tier_id, subscription_expires_at, trial_expires_at\s+FROM users/,
  first: () => ({
    role: 'student', subscription_tier_id: 'tier_free',
    subscription_expires_at: null, trial_expires_at: null,
  }),
};

const cappedHandler: MockHandler = {
  match: /SELECT COUNT\(\*\) AS count FROM revision_ai_interactions/,
  first: () => ({ count: 10 }),
};

function post(path: string, db: unknown, body: object) {
  return token({ userId: 'user_1', role: 'student' }).then((t) =>
    worker.fetch(
      new Request(`http://x/api/revision-classroom${path}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
      { DB: db as D1Database, JWT_SECRET },
    ),
  );
}

describe('whiteboard-teach premium gate', () => {
  it('rejects free users with 403 upgradeRequired before any AI work', async () => {
    const db = createMockD1([authHandler, lessonHandler, freeHandler]);
    const res = await post('/lessons/lesson_1/whiteboard-teach', db, { lessonType: 'diagram' });
    expect(res.status).toBe(403);
    const body = (await res.json()) as { success: boolean; upgradeRequired?: boolean };
    expect(body.success).toBe(false);
    expect(body.upgradeRequired).toBe(true);
    // no interaction recorded for a rejected request
    expect(db.calls.some((c) => /INSERT INTO revision_ai_interactions/.test(c.sql))).toBe(false);
  });
});

describe('teach daily AI allowance', () => {
  it('rejects a capped free user with 403 aiLimitReached', async () => {
    const db = createMockD1([authHandler, lessonHandler, freeHandler, cappedHandler]);
    const res = await post('/lessons/lesson_1/teach', db, { phase: 'hook', previousMessages: [] });
    expect(res.status).toBe(403);
    const body = (await res.json()) as { aiLimitReached?: boolean; remaining?: number };
    expect(body.aiLimitReached).toBe(true);
    expect(body.remaining).toBe(0);
  });
});
```

(The premium-path 200 cases need a mocked `env.AI` binding, which the existing test harness does not provide — premium happy-path is verified by the prod probe in Task 10, not unit tests.)

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run workers/api/__tests__/revision-gating.test.ts`
Expected: FAIL — whiteboard-teach returns non-403 (runs generation → 500 without `env.AI`), teach does not return `aiLimitReached`.

- [ ] **Step 3: Implement**

1. Imports at the top of `workers/api/revision-classroom.ts` (after line 4):

```ts
import { isPremiumUser, checkAiAllowance } from './usage-limits';
```

2. In `whiteboard-teach` (line 2142), immediately after the `if (!lesson) ... 404` block (line 2168), insert:

```ts
    // Premium-only feature — reject before any AI generation cost is incurred.
    if (!(await isPremiumUser(user.userId, c.env.DB))) {
      return c.json({
        success: false,
        error: 'The AI Whiteboard is a premium feature. Upgrade to watch the teacher draw and explain.',
        upgradeRequired: true,
      }, 403);
    }
```

3. Change `generateWhiteboardContent` (line 1851) to report fallback + tokens. New signature and body changes:

```ts
async function generateWhiteboardContent(
  env: Env,
  topic: string,
  subject: string,
  examType: string,
  lessonType: 'diagram' | 'step-by-step' | 'problem-solving' | 'concept-map' = 'step-by-step'
): Promise<{ content: WhiteboardTeachingContent; usedFallback: boolean; tokensUsed: number | null }> {
```

Keep everything through the prompt building unchanged. Replace the `try` body after `env.AI.run(...)` with:

```ts
    const responseText = typeof result === 'object' && result !== null && 'response' in result
      ? (result as { response: string }).response
      : String(result);

    const tokensUsed =
      typeof result === 'object' && result !== null && 'usage' in result
        ? ((result as { usage?: { total_tokens?: number } }).usage?.total_tokens ?? null)
        : null;

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as WhiteboardTeachingContent;
      if (isValidWhiteboardContent(parsed)) {
        return { content: parsed, usedFallback: false, tokensUsed };
      }
      console.error('Whiteboard content failed validation — using fallback');
    }

    throw new Error('Failed to parse whiteboard content');
  } catch (error) {
    console.error('Error generating whiteboard content:', error);
    // Return fallback content — flagged so the UI can be honest about it
    return { content: getDefaultWhiteboardContent(topic, subject, examType), usedFallback: true, tokensUsed: null };
  }
}
```

Add the validator directly above `generateWhiteboardContent`:

```ts
// Structural validation of AI-generated whiteboard content. The model's JSON
// is untrusted: it must have the fields the renderer dereferences, every
// command must be a known type, and every numeric prop must be finite.
const WHITEBOARD_COMMAND_TYPES = new Set(['rect', 'circle', 'line', 'arrow', 'text', 'path', 'polygon']);

function isValidWhiteboardContent(c: unknown): c is WhiteboardTeachingContent {
  if (!c || typeof c !== 'object') return false;
  const content = c as Partial<WhiteboardTeachingContent>;
  if (typeof content.title !== 'string') return false;
  if (!content.canvasSize || typeof content.canvasSize.width !== 'number' || typeof content.canvasSize.height !== 'number') return false;
  if (typeof content.backgroundColor !== 'string') return false;
  if (!Array.isArray(content.steps) || content.steps.length === 0) return false;
  for (const step of content.steps) {
    if (!step || typeof step.explanation !== 'string' || typeof step.duration !== 'number') return false;
    if (!Array.isArray(step.commands) || step.commands.length === 0) return false;
    for (const cmd of step.commands) {
      if (!cmd || typeof cmd.id !== 'string' || !WHITEBOARD_COMMAND_TYPES.has(cmd.type)) return false;
      if (!cmd.props || typeof cmd.props !== 'object') return false;
      for (const v of Object.values(cmd.props)) {
        if (typeof v === 'number' && !Number.isFinite(v)) return false;
      }
    }
  }
  return true;
}
```

4. In `whiteboard-teach`, replace the generation + interaction + response (lines 2174-2203) with:

```ts
    // Generate whiteboard content
    const { content: whiteboardContent, usedFallback, tokensUsed } = await generateWhiteboardContent(
      c.env,
      topicName,
      subjectName,
      examType,
      lessonType
    );

    // Record the interaction
    const interactionId = generateId('wb_interaction');
    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      INSERT INTO revision_ai_interactions (
        id, lesson_id, user_id, interaction_type, ai_message, tokens_used, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      interactionId, lessonId, user.userId, `whiteboard_${lessonType}`,
      JSON.stringify(whiteboardContent), tokensUsed, now
    ).run();

    return c.json({
      success: true,
      data: {
        whiteboardContent,
        interactionId,
        lessonType,
        fallback: usedFallback,
      },
    });
```

5. In `teach` (line 838), immediately after the `if (!lesson) ... 404` block (line 880), insert:

```ts
    // Free-tier daily AI allowance (premium = unlimited)
    const allowance = await checkAiAllowance(user.userId, c.env.DB);
    if (!allowance.allowed) {
      return c.json({
        success: false,
        error: "You've used today's free AI explanations. Upgrade for unlimited access, or come back tomorrow.",
        aiLimitReached: true,
        remaining: 0,
      }, 403);
    }
```

In the same handler's success `c.json` (line 917), add one field to `data`:

```ts
        remainingFreeToday: allowance.remaining === -1 ? -1 : allowance.remaining - 1,
```

6. In `ask` (line 1020): same allowance insert after its 404 block (line 1051), and add the same `remainingFreeToday` field to its success `data` (the `c.json` after the interaction insert, ~line 1115).

7. In `checkpoint/generate` (line 938): same allowance insert after its 404 block (line 962). Then record the interaction so it counts — immediately after the `INSERT INTO revision_checkpoints ... .run();` (line 1001), add:

```ts
    await c.env.DB.prepare(`
      INSERT INTO revision_ai_interactions (
        id, lesson_id, user_id, interaction_type, ai_message, created_at
      ) VALUES (?, ?, ?, 'checkpoint', ?, ?)
    `).bind(
      generateId('interaction'), lessonId, user.userId, checkpoint.question, now
    ).run();
```

And add `remainingFreeToday` to its success `data` (line 1005 block) the same way.

- [ ] **Step 4: Run tests**

Run: `npx vitest run workers/api/__tests__/revision-gating.test.ts workers/api/__tests__/ai-allowance.test.ts`
Expected: PASS. Then the full suite: `npx vitest run workers/api` — all 289+ tests PASS.

- [ ] **Step 5: Commit**

```bash
git add workers/api/revision-classroom.ts workers/api/__tests__/revision-gating.test.ts
git commit -m "feat(revision): premium-gate whiteboard, daily AI allowance, honest fallback flag"
```

---

### Task 3: Expose whiteboard + dailyAiLimit in /subscriptions/features

**Files:**
- Modify: `workers/api/subscriptions.ts` (import line 4; features object line 576)
- Test: `workers/api/__tests__/subscription-features.test.ts` (create)

**Interfaces:**
- Consumes: `DAILY_AI_INTERACTION_LIMIT` from Task 1.
- Produces: `/features` response `features` object gains `whiteboard: boolean` (true when `hasAccess`) and `dailyAiLimit: number` (`-1` premium, `10` free). Task 5/6 read these.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { sign } from 'hono/jwt';
import worker from '../index';
import { createMockD1, type MockHandler } from './helpers/mockD1';

const JWT_SECRET = 'test-secret-that-is-long-enough';

async function token(payload: object) {
  return sign(
    { ...payload, exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000) },
    JWT_SECRET,
  );
}

const authHandler: MockHandler = {
  match: /SELECT role, status, is_active FROM users/,
  first: () => ({ role: 'student', status: 'approved', is_active: 1 }),
};

function featuresReq(db: unknown) {
  return token({ userId: 'user_1', role: 'student' }).then((t) =>
    worker.fetch(
      new Request('http://x/api/subscriptions/features', {
        headers: { Authorization: `Bearer ${t}` },
      }),
      { DB: db as D1Database, JWT_SECRET },
    ),
  );
}

const userRowHandler = (tierId: string, expiresAt: string | null): MockHandler => ({
  match: /u\.subscription_tier_id,\s*u\.subscription_expires_at,\s*u\.trial_expires_at/,
  first: () => ({
    subscription_tier_id: tierId,
    subscription_expires_at: expiresAt,
    trial_expires_at: null,
    features: '[]',
    ai_grading_quota: 0,
  }),
});

describe('GET /api/subscriptions/features', () => {
  it('free user: whiteboard false, dailyAiLimit 10', async () => {
    const db = createMockD1([authHandler, userRowHandler('tier_free', null)]);
    const res = await featuresReq(db);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { features: Record<string, unknown> } };
    expect(body.data.features.whiteboard).toBe(false);
    expect(body.data.features.dailyAiLimit).toBe(10);
  });

  it('paid user: whiteboard true, dailyAiLimit -1', async () => {
    const db = createMockD1([
      authHandler,
      userRowHandler('tier_student_monthly', new Date(Date.now() + 86400000).toISOString()),
    ]);
    const res = await featuresReq(db);
    const body = (await res.json()) as { data: { features: Record<string, unknown> } };
    expect(body.data.features.whiteboard).toBe(true);
    expect(body.data.features.dailyAiLimit).toBe(-1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run workers/api/__tests__/subscription-features.test.ts`
Expected: FAIL — `whiteboard`/`dailyAiLimit` are undefined.

- [ ] **Step 3: Implement**

In `workers/api/subscriptions.ts` line 4, extend the import:

```ts
import { DAILY_QUESTION_LIMIT, DAILY_AI_INTERACTION_LIMIT, CORE_SUBJECTS } from './usage-limits';
```

In the `features` object (line 576), add two entries after `coreSubjectsList: CORE_SUBJECTS,`:

```ts
      // AI revision classroom
      whiteboard: hasAccess, // AI whiteboard is premium-only
      dailyAiLimit: hasAccess ? -1 : DAILY_AI_INTERACTION_LIMIT, // free chat allowance per day
```

- [ ] **Step 4: Run test to verify it passes**, then full suite.

Run: `npx vitest run workers/api/__tests__/subscription-features.test.ts` then `npx vitest run workers/api`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add workers/api/subscriptions.ts workers/api/__tests__/subscription-features.test.ts
git commit -m "feat(subscriptions): expose whiteboard entitlement + daily AI limit in /features"
```

---

### Task 4: Admin set-tier endpoint + fix broken subscription-details endpoint

**Files:**
- Modify: `workers/api/index.ts` (new endpoint after add-credits, line 7550; rewrite subscription endpoint lines 7553-7631)
- Test: `workers/api/__tests__/admin-set-tier.test.ts` (create)

**Interfaces:**
- Consumes: existing `logAudit({ db, userId, userEmail, userRole, action, actionCategory, targetType, targetId, targetDetails, ...clientInfo })` and `getClientInfo(c)` patterns from extend-trial (lines 7402-7490).
- Produces:
  - `POST /api/admin/users/:id/set-tier` — body `{ tierId: string, durationDays: number }` (1–3650). Response `{ success:true, data:{ message, tierId, tierName, expiresAt, creditsAdded } }`.
  - `GET /api/admin/users/:id/subscription` — unchanged response shape (matches `UserSubscriptionDetails` in `src/stores/authStore.ts:128`), but sourced from `users` + `subscription_tiers` (the `user_subscriptions` table does not exist).
  - Task 9's frontend calls both.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { sign } from 'hono/jwt';
import worker from '../index';
import { createMockD1, type MockHandler } from './helpers/mockD1';

const JWT_SECRET = 'test-secret-that-is-long-enough';

async function adminToken() {
  return sign(
    { userId: 'admin_1', role: 'admin', email: 'admin@test.com', exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000) },
    JWT_SECRET,
  );
}

const authHandler: MockHandler = {
  match: /SELECT role, status, is_active FROM users/,
  first: () => ({ role: 'admin', status: 'approved', is_active: 1 }),
};

const tierHandler: MockHandler = {
  match: /FROM subscription_tiers WHERE id = \? AND is_active = 1/,
  first: () => ({ id: 'tier_student_monthly', name: 'Student Monthly', slug: 'student-monthly', ai_grading_quota: 50 }),
};

const targetUserHandler: MockHandler = {
  match: /SELECT id, email, subscription_tier_id FROM users WHERE id = \?/,
  first: () => ({ id: 'user_1', email: 'student@test.com', subscription_tier_id: 'tier_free' }),
};

function setTier(db: unknown, body: object) {
  return adminToken().then((t) =>
    worker.fetch(
      new Request('http://x/api/admin/users/user_1/set-tier', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
      { DB: db as D1Database, JWT_SECRET },
    ),
  );
}

describe('POST /api/admin/users/:id/set-tier', () => {
  it('rejects invalid durationDays', async () => {
    const db = createMockD1([authHandler]);
    const res = await setTier(db, { tierId: 'tier_student_monthly', durationDays: 0 });
    expect(res.status).toBe(400);
  });

  it('rejects unknown tier', async () => {
    const db = createMockD1([authHandler, { match: /FROM subscription_tiers/, first: () => null }]);
    const res = await setTier(db, { tierId: 'tier_nope', durationDays: 30 });
    expect(res.status).toBe(404);
  });

  it('sets tier, expiry and grading-credit top-up, and writes an audit row', async () => {
    const db = createMockD1([authHandler, tierHandler, targetUserHandler]);
    const res = await setTier(db, { tierId: 'tier_student_monthly', durationDays: 30 });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { tierName: string; expiresAt: string; creditsAdded: number } };
    expect(body.data.tierName).toBe('Student Monthly');
    expect(new Date(body.data.expiresAt).getTime()).toBeGreaterThan(Date.now() + 29 * 86400000);
    expect(body.data.creditsAdded).toBe(50);

    const update = db.calls.find((c) => /UPDATE users SET\s+subscription_tier_id/.test(c.sql));
    expect(update).toBeDefined();
    expect(update!.binds[0]).toBe('tier_student_monthly');

    const credits = db.calls.find((c) => /ai_grading_credits = COALESCE/.test(c.sql));
    expect(credits!.binds[0]).toBe(50);

    expect(db.calls.some((c) => /INSERT INTO audit_log/.test(c.sql))).toBe(true);
  });
});

describe('GET /api/admin/users/:id/subscription', () => {
  it('never queries the nonexistent user_subscriptions table', async () => {
    const userRow: MockHandler = {
      match: /FROM users u\s+LEFT JOIN subscription_tiers/,
      first: () => ({
        id: 'user_1', email: 'student@test.com', name: 'Student', role: 'student',
        ai_grading_credits: 50, trial_started_at: null, trial_expires_at: null,
        subscription_tier_id: 'tier_student_monthly',
        subscription_expires_at: new Date(Date.now() + 15 * 86400000).toISOString(),
        plan_name: 'Student Monthly', plan_slug: 'student-monthly',
        ai_grading_quota: 50, price_monthly: 50, price_yearly: 480,
      }),
    };
    const trialRow: MockHandler = { match: /FROM user_trials WHERE user_id = \?/, first: () => null };
    const db = createMockD1([authHandler, userRow, trialRow]);

    const t = await adminToken();
    const res = await worker.fetch(
      new Request('http://x/api/admin/users/user_1/subscription', { headers: { Authorization: `Bearer ${t}` } }),
      { DB: db as D1Database, JWT_SECRET },
    );
    expect(res.status).toBe(200);
    expect(db.calls.some((c) => /user_subscriptions/.test(c.sql))).toBe(false);
    const body = (await res.json()) as { data: { subscription: { planName: string; status: string } } };
    expect(body.data.subscription.planName).toBe('Student Monthly');
    expect(body.data.subscription.status).toBe('active');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run workers/api/__tests__/admin-set-tier.test.ts`
Expected: FAIL — 404 on set-tier (route missing); subscription endpoint still queries `user_subscriptions`.

- [ ] **Step 3: Implement**

1. New endpoint, inserted after the add-credits handler (after line 7550):

```ts
// Manually set a user's subscription tier (admin comp/upgrade)
adminApp.post('/users/:id/set-tier', async (c) => {
  const userId = c.req.param('id');
  const { tierId, durationDays } = await c.req.json();
  const adminUser = c.get('user') as UserPayload;
  const clientInfo = getClientInfo(c);

  if (!tierId || typeof tierId !== 'string') {
    return c.json({ success: false, error: 'tierId is required' }, 400);
  }
  if (typeof durationDays !== 'number' || !Number.isInteger(durationDays) || durationDays < 1 || durationDays > 3650) {
    return c.json({ success: false, error: 'durationDays must be an integer between 1 and 3650' }, 400);
  }

  try {
    const tier = await c.env.DB.prepare(
      'SELECT id, name, slug, ai_grading_quota FROM subscription_tiers WHERE id = ? AND is_active = 1'
    ).bind(tierId).first();

    if (!tier) {
      return c.json({ success: false, error: 'Tier not found or inactive' }, 404);
    }

    const user = await c.env.DB.prepare(
      'SELECT id, email, subscription_tier_id FROM users WHERE id = ?'
    ).bind(userId).first();

    if (!user) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

    await c.env.DB.prepare(`
      UPDATE users SET
        subscription_tier_id = ?,
        subscription_expires_at = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(tierId, expiresAt, userId).run();

    // Top up grading credits per tier quota (mirrors payment crediting)
    const quota = (tier.ai_grading_quota as number) || 0;
    let creditsAdded = 0;
    if (quota > 0) {
      creditsAdded = quota;
      await c.env.DB.prepare(`
        UPDATE users SET
          ai_grading_credits = COALESCE(ai_grading_credits, 0) + ?,
          updated_at = datetime('now')
        WHERE id = ?
      `).bind(quota, userId).run();
    }

    await logAudit({
      db: c.env.DB,
      userId: adminUser.userId,
      userEmail: adminUser.email,
      userRole: adminUser.role,
      action: 'set_subscription_tier',
      actionCategory: 'user_management',
      targetType: 'user',
      targetId: userId,
      targetDetails: `Set tier ${tier.name} (${tierId}) for ${user.email} (was ${user.subscription_tier_id || 'none'}). Expires: ${expiresAt.split('T')[0]} (+${durationDays}d). Credits added: ${creditsAdded}`,
      ...clientInfo,
    });

    return c.json({
      success: true,
      data: {
        message: `Subscription set to ${tier.name} for ${durationDays} days`,
        tierId,
        tierName: tier.name,
        expiresAt,
        creditsAdded,
      },
    });
  } catch (error) {
    console.error('Set tier error:', error);
    return c.json({ success: false, error: 'Failed to set subscription tier' }, 500);
  }
});
```

2. Rewrite `GET /users/:id/subscription` (lines 7553-7631): replace the user query and delete the `user_subscriptions` query. The replacement handler:

```ts
// Get user subscription/trial details (admin view)
adminApp.get('/users/:id/subscription', async (c) => {
  const userId = c.req.param('id');

  try {
    // There is no user_subscriptions table — the tier lives on the user row.
    const user = await c.env.DB.prepare(`
      SELECT
        u.id, u.email, u.name, u.role, u.ai_grading_credits,
        u.trial_started_at, u.trial_expires_at,
        u.subscription_tier_id, u.subscription_expires_at,
        st.name as plan_name, st.slug as plan_slug,
        st.ai_grading_quota, st.price_monthly, st.price_yearly
      FROM users u
      LEFT JOIN subscription_tiers st ON u.subscription_tier_id = st.id
      WHERE u.id = ?
    `).bind(userId).first();

    if (!user) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    const trial = await c.env.DB.prepare(`
      SELECT id, started_at, expires_at, status, tasks_completed, discount_percent
      FROM user_trials WHERE user_id = ?
    `).bind(userId).first();

    const now = new Date();

    let trialDaysRemaining = 0;
    if (trial && trial.status === 'active') {
      const expiresAt = new Date(trial.expires_at as string);
      trialDaysRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    }

    const hasPaidTier = user.subscription_tier_id && user.subscription_tier_id !== 'tier_free';
    const subExpiresAt = user.subscription_expires_at ? new Date(user.subscription_expires_at as string) : null;
    const subActive = hasPaidTier && subExpiresAt ? subExpiresAt > now : false;
    const subscriptionDaysRemaining = subExpiresAt
      ? Math.max(0, Math.ceil((subExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    return c.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          aiGradingCredits: user.ai_grading_credits || 0,
        },
        trial: trial ? {
          id: trial.id,
          status: trial.status,
          startedAt: trial.started_at,
          expiresAt: trial.expires_at,
          daysRemaining: trialDaysRemaining,
          tasksCompleted: JSON.parse((trial.tasks_completed as string) || '[]').length,
        } : null,
        subscription: hasPaidTier ? {
          planName: user.plan_name || user.subscription_tier_id,
          status: subActive ? 'active' : 'expired',
          billingCycle: (user.plan_slug as string || '').endsWith('yearly') ? 'yearly' : 'monthly',
          expiresAt: user.subscription_expires_at,
          daysRemaining: subscriptionDaysRemaining,
          aiGradingQuota: user.ai_grading_quota || 0,
        } : null,
      }
    });
  } catch (error) {
    console.error('Get user subscription error:', error);
    return c.json({ success: false, error: 'Failed to get subscription details' }, 500);
  }
});
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run workers/api/__tests__/admin-set-tier.test.ts` then `npx vitest run workers/api`
Expected: PASS (note: if an existing test asserts the old broken endpoint behavior, update that test to the corrected contract — do not preserve a query against a nonexistent table).

- [ ] **Step 5: Commit**

```bash
git add workers/api/index.ts workers/api/__tests__/admin-set-tier.test.ts
git commit -m "feat(admin): set-tier endpoint; fix subscription details (user_subscriptions does not exist)"
```

---

### Task 5: Store plumbing — entitlement + limit state

**Files:**
- Modify: `src/stores/subscriptionStore.ts:34-39` (getFeatureAccess return type)
- Modify: `src/stores/revisionClassroomStore.ts` (state ~line 380-420; `requestAITeaching` line 775+; `askQuestion` ~line 990-1040; `requestWhiteboardTeaching` line 1049)

**Interfaces:**
- Produces (Task 6 consumes all of these):
  - `getFeatureAccess()` resolves `features` including `whiteboard?: boolean` and `dailyAiLimit?: number`.
  - revisionClassroomStore state: `whiteboardLocked: boolean` (default `false`), `whiteboardFallback: boolean` (default `false`), `aiLimitReached: boolean` (default `false`), `freeAiRemaining: number | null` (default `null`; -1 = premium/unlimited).
  - `partialize` unchanged (these stay session-only).

- [ ] **Step 1: subscriptionStore type**

In `src/stores/subscriptionStore.ts` (line 34), change the getFeatureAccess signature to:

```ts
  getFeatureAccess: () => Promise<{
    isSubscribed: boolean;
    isTrial: boolean;
    hasAccess: boolean;
    isPremium?: boolean;
    features: Record<string, boolean | number> & {
      whiteboard?: boolean;
      dailyAiLimit?: number;
    };
  }>;
```

(No runtime change — the endpoint already returns these after Task 3.)

- [ ] **Step 2: revisionClassroomStore state + wiring**

In the state interface (near line 185 where `isWhiteboardLoading` is declared), add:

```ts
  whiteboardLocked: boolean;
  whiteboardFallback: boolean;
  aiLimitReached: boolean;
  freeAiRemaining: number | null; // -1 = unlimited; null = unknown
```

In the initial state (near line 402 where `isWhiteboardLoading: false` sits), add:

```ts
      whiteboardLocked: false,
      whiteboardFallback: false,
      aiLimitReached: false,
      freeAiRemaining: null,
```

In `requestWhiteboardTeaching` (line 1049), replace the `if (!response.success || !response.data)` block and success `set` with:

```ts
          if (!response.success || !response.data) {
            if ((response as { upgradeRequired?: boolean }).upgradeRequired) {
              set({ whiteboardLocked: true, isWhiteboardLoading: false });
              return;
            }
            throw new Error(response.error || 'Failed to generate whiteboard content');
          }

          set({
            whiteboardContent: response.data.whiteboardContent,
            whiteboardFallback: (response.data as { fallback?: boolean }).fallback === true,
            isWhiteboardLoading: false,
          });
```

In `requestAITeaching` (line 775) and `askQuestion`: after each `const response = await api.post<...>(...)`, replace the `if (!response.success || !response.data)` guard with:

```ts
          if (!response.success || !response.data) {
            if ((response as { aiLimitReached?: boolean }).aiLimitReached) {
              set({
                aiLimitReached: true,
                freeAiRemaining: 0,
                aiTeachingState: { ...get().aiTeachingState, isThinking: false, isTeaching: false },
              });
              return;
            }
            throw new Error(response.error || 'Failed to get AI response');
          }
```

(In `askQuestion` adjust the message/state field names to its local ones — same pattern.)

On success in both, capture the remaining count alongside the existing `set`:

```ts
          const remaining = (response.data as { remainingFreeToday?: number }).remainingFreeToday;
          if (remaining !== undefined) set({ freeAiRemaining: remaining });
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc -b --noEmit 2>&1 | head -20` (or `npm run build` later — typecheck only here)
Expected: no new errors in these two files.

- [ ] **Step 4: Commit**

```bash
git add src/stores/subscriptionStore.ts src/stores/revisionClassroomStore.ts
git commit -m "feat(frontend): store state for whiteboard lock, AI allowance, fallback flag"
```

---

### Task 6: RevisionClassroom gating UI

**Files:**
- Modify: `src/pages/RevisionClassroom.tsx` (imports line 23-45; toggle ~line 1066-1090; whiteboard render line 1148-1154; header area ~line 1060)
- Modify: `src/components/whiteboard/AIWhiteboardTeacher.tsx:76-81` (props) — add `fallback?: boolean`

**Interfaces:**
- Consumes: `getFeatureAccess` (Task 5), store fields `whiteboardLocked`, `whiteboardFallback`, `aiLimitReached`, `freeAiRemaining` (Task 5).
- Produces: free users see a lock badge on the Whiteboard toggle and an upgrade card in whiteboard mode; a "N free explanations left today" pill; an inline limit-reached banner; a fallback notice on generic whiteboard content.

- [ ] **Step 1: Load entitlements**

In the main `RevisionClassroom` component (near other hooks, ~line 542-560):

```ts
  const { getFeatureAccess } = useSubscriptionStore();
  const [whiteboardAllowed, setWhiteboardAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) return;
    getFeatureAccess().then((access) => {
      setWhiteboardAllowed(access.features.whiteboard === true);
    });
  }, [user, getFeatureAccess]);
```

Add `useSubscriptionStore` to the imports from `@/stores/subscriptionStore`, and pull `whiteboardLocked`, `aiLimitReached`, `freeAiRemaining` from `useRevisionClassroomStore()` (where the other store fields are destructured, ~line 542).

Derived: `const whiteboardAccessible = whiteboardAllowed === true && !whiteboardLocked;`

- [ ] **Step 2: Lock badge on the toggle**

In the Chat/Whiteboard toggle (~line 1078-1088), on the Whiteboard button, add a lock badge when `!whiteboardAccessible`:

```tsx
              <button
                onClick={() => !whiteboardMode && toggleWhiteboardMode()}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  whiteboardMode
                    ? 'bg-white text-violet-600 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Presentation className="w-4 h-4" />
                <span className="hidden sm:inline">Whiteboard</span>
                {!whiteboardAccessible && <Lock className="w-3 h-3 text-amber-500" />}
              </button>
```

Add `Lock` to the lucide-react import.

- [ ] **Step 3: Upgrade card in whiteboard mode**

Replace the whiteboard branch (line 1148-1154) with:

```tsx
            whiteboardMode ? (
              !whiteboardAccessible ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4">
                    <Presentation className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900 mb-2">AI Whiteboard Teacher</h3>
                  <p className="text-neutral-600 max-w-md mb-6">
                    Watch the AI teacher draw diagrams, worked examples and concept maps while
                    explaining your topic — a premium feature.
                  </p>
                  <div className="grid grid-cols-2 gap-3 w-full max-w-md mb-6 opacity-50 pointer-events-none" aria-hidden="true">
                    {['Labeled Diagram', 'Step-by-Step', 'Worked Example', 'Concept Map'].map((name) => (
                      <div key={name} className="flex items-center justify-center gap-2 p-3 rounded-xl bg-neutral-100 text-neutral-500 text-sm font-medium">
                        <Lock className="w-4 h-4" /> {name}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => navigate('/pricing')}
                    className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-medium hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg"
                  >
                    Upgrade to unlock
                  </button>
                </div>
              ) : (
                <AIWhiteboardTeacher
                  content={whiteboardContent || undefined}
                  isLoading={isWhiteboardLoading}
                  onRequestContent={requestWhiteboardTeaching}
                  fallback={whiteboardFallback}
                  className="h-full"
                />
              )
            ) : (
```

- [ ] **Step 4: Fallback banner in AIWhiteboardTeacher**

In `src/components/whiteboard/AIWhiteboardTeacher.tsx`, add `fallback?: boolean` to `AIWhiteboardTeacherProps` and destructure it. Render a notice directly under the header (after the header `</div>`, ~line 564):

```tsx
      {fallback && (
        <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Custom visual unavailable for this lesson — showing a generic overview instead.
          </p>
        </div>
      )}
```

- [ ] **Step 5: Free-allowance pill + limit banner**

In the header row near the lesson counter (~line 1060-1063), add for free users:

```tsx
            {freeAiRemaining !== null && freeAiRemaining >= 0 && (
              <span className="hidden md:inline text-xs text-neutral-500 bg-neutral-100 px-2 py-1 rounded-full">
                {freeAiRemaining} free explanations left today
              </span>
            )}
```

Above the teaching display (chat branch), when `aiLimitReached`:

```tsx
              {aiLimitReached && (
                <div className="p-4 bg-amber-50 border-b border-amber-200 flex items-center justify-between gap-3">
                  <p className="text-sm text-amber-800">
                    You've used today's 10 free AI explanations. Upgrade for unlimited, or come back tomorrow.
                  </p>
                  <button
                    onClick={() => navigate('/pricing')}
                    className="text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 px-3 py-1.5 rounded-lg"
                  >
                    Upgrade
                  </button>
                </div>
              )}
```

- [ ] **Step 6: Build**

Run: `npm run build`
Expected: clean (tsc + vite).

- [ ] **Step 7: Commit**

```bash
git add src/pages/RevisionClassroom.tsx src/components/whiteboard/AIWhiteboardTeacher.tsx
git commit -m "feat(revision-ui): whiteboard upgrade card, lock badge, AI allowance notices"
```

---

### Task 7: Fix whiteboard playback (auto-advance loop, dedupe, TTS, highlights)

**Files:**
- Modify: `src/components/whiteboard/AIWhiteboardTeacher.tsx` (state line 124; drawStep 303-348; goToStep 367-403; auto-advance effect 427-457; new unmount cleanup)

**Interfaces:**
- Consumes: nothing new.
- Produces: same component API. `drawnObjects` React state is replaced by a ref (`drawnObjectsRef`); no external consumer references it.

Root cause (verified): the auto-advance effect depends on `drawStep`, which depends on `drawnObjects` state; every draw creates a new Map → new `drawStep` identity → effect cleanup clears the pending advance timeout → the same step redraws (duplicate fabric objects, TTS stutter) and playback never advances.

- [ ] **Step 1: Replace state with ref + idempotent drawStep**

Delete `const [drawnObjects, setDrawnObjects] = useState<Map<string, fabric.Object>>(new Map());` (line 124) and add near the other refs (line 127):

```tsx
  const drawnObjectsRef = useRef<Map<string, fabric.Object>>(new Map());
```

Rewrite `drawStep` as a plain function (not `useCallback`, lines 302-348):

```tsx
  // Draw a step — idempotent: each command id is added at most once.
  const drawStep = (stepIndex: number) => {
    if (!fabricRef.current || !content) return;

    const step = content.steps[stepIndex];
    if (!step) return;

    const canvas = fabricRef.current;

    if (step.clearPrevious) {
      canvas.clear();
      canvas.backgroundColor = content.backgroundColor;
      drawnObjectsRef.current = new Map();
    }

    step.commands.forEach((command) => {
      if (drawnObjectsRef.current.has(command.id)) return;
      const obj = createObject(command);
      if (obj) {
        canvas.add(obj);
        drawnObjectsRef.current.set(command.id, obj);
      }
    });

    applyHighlights(step);
    canvas.renderAll();
  };
```

Add the shared highlight helper (used by drawStep and goToStep):

```tsx
  // Apply a step's highlight glow, clearing highlights from other objects.
  const applyHighlights = (step: WhiteboardStep) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.getObjects().forEach((obj: fabric.Object) => {
      const customId = (obj as any).customId;
      if (step.highlights && step.highlights.includes(customId)) {
        obj.set('shadow', new fabric.Shadow({
          color: 'rgba(59, 130, 246, 0.5)',
          blur: 20,
          offsetX: 0,
          offsetY: 0,
        }));
      } else {
        obj.set('shadow', null);
      }
    });
  };
```

- [ ] **Step 2: Fix goToStep to reset the ref and apply highlights**

In `goToStep` (line 367), replace `setDrawnObjects(new Map());` with `drawnObjectsRef.current = new Map();`, populate `drawnObjectsRef.current.set(command.id, obj)` inside the redraw loop (instead of only `canvas.add`), and after the loop add `applyHighlights(content.steps[clampedIndex]);` before `renderAll()`.

- [ ] **Step 3: Rewrite the auto-advance effect with stable deps**

Replace the effect (lines 427-457) with:

```tsx
  // Auto-advance steps when playing. Deps are stable primitives only —
  // drawStep is called imperatively so re-renders never cancel the timer.
  useEffect(() => {
    if (!isPlaying || !content) return;

    const step = content.steps[currentStep];
    if (!step) {
      setIsPlaying(false);
      return;
    }

    drawStep(currentStep);
    if (step.voiceOver) {
      speak(step.voiceOver);
    }

    playTimeoutRef.current = setTimeout(() => {
      if (currentStep < content.steps.length - 1) {
        setCurrentStep((prev) => prev + 1);
        setProgress(((currentStep + 2) / content.steps.length) * 100);
      } else {
        setIsPlaying(false);
      }
    }, step.duration * 1000);

    return () => {
      if (playTimeoutRef.current) {
        clearTimeout(playTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, currentStep, content, speak]);
```

- [ ] **Step 4: TTS + timer cleanup on unmount, and content-arrival sizing**

Add near the other effects:

```tsx
  // Cancel speech and timers on unmount (e.g. toggling back to Chat mid-sentence)
  useEffect(() => {
    return () => {
      if (playTimeoutRef.current) clearTimeout(playTimeoutRef.current);
      if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
    };
  }, []);

  // Apply content canvas size/background when content arrives after mount
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas || !content) return;
    canvas.backgroundColor = content.backgroundColor;
    canvas.setDimensions({ width: content.canvasSize.width, height: content.canvasSize.height });
    canvas.renderAll();
  }, [content]);
```

- [ ] **Step 5: Build + manual sanity**

Run: `npm run build`
Expected: clean. (Playback is verified in the browser in Task 10.)

- [ ] **Step 6: Commit**

```bash
git add src/components/whiteboard/AIWhiteboardTeacher.tsx
git commit -m "fix(whiteboard): stable auto-advance, idempotent drawing, TTS/timer cleanup"
```

---

### Task 8: Immersive mode — remove AI-drawing theater, fix touch crash

**Files:**
- Modify: `src/components/immersive/ImmersiveClassroom.tsx:355-363` (stop passing the fake indicator)
- Modify: `src/components/immersive/ImmersiveWhiteboard.tsx:196-215, 280-285, 297-303`

**Interfaces:**
- Consumes: nothing new.
- Produces: no API changes. `isAiDrawing` prop becomes unused-by-parent (kept optional for Phase C).

- [ ] **Step 1: Stop the theater**

In `ImmersiveClassroom.tsx` (line 355-363), remove the `isAiDrawing={aiTeachingState.isThinking}` prop and add a comment:

```tsx
          {/* isAiDrawing intentionally not passed: the AI canvas layer receives
              no data yet (Phase C) — showing the indicator would be theater. */}
```

- [ ] **Step 2: Fix the touchend crash**

In `ImmersiveWhiteboard.tsx`, remove `onTouchEnd={handleDoubleTap as any}` from the container div (line 302) — at `touchend`, `e.touches` is empty and `e.touches[0].clientX` throws. Double-tap stays mouse-driven via `onDoubleClick`.

Replace the two-finger-tap branch in the window `touchend` listener (lines 280-285) with a start-flagged version. In `handleTouchStart` (line 259-262) add tracking:

```ts
    let twoFingerTapCenter: { x: number; y: number } | null = null;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      // Two fingers down together = question-mark tap (record center now;
      // changedTouches at touchend only holds the lifted finger).
      if (e.touches.length === 2) {
        twoFingerTapCenter = {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        };
      }
    };
```

In `handleTouchEnd`, replace the `e.changedTouches.length === 2` block with:

```ts
      // Fire the recorded two-finger tap
      if (twoFingerTapCenter) {
        addQuestionMark(twoFingerTapCenter.x, twoFingerTapCenter.y);
        twoFingerTapCenter = null;
      }
```

Also fix `handleDoubleTap` (line 204): `'touches' in e` branch must read `e.changedTouches[0]` (safe at both touchstart-style and mouse events that carry touches).

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/components/immersive/ImmersiveClassroom.tsx src/components/immersive/ImmersiveWhiteboard.tsx
git commit -m "fix(immersive): drop fake AI-drawing indicator, fix touchend crashes"
```

---

### Task 9: Admin UI — set tier in the subscription modal

**Files:**
- Modify: `src/stores/authStore.ts` (interface line 124 area; actions after addUserCredits line 855)
- Modify: `src/pages/UserManagement.tsx` (state line 60-67; handlers after handleAddCredits line 192; the subscription modal JSX)

**Interfaces:**
- Consumes: `POST /api/admin/users/:id/set-tier` (Task 4); tier list from `GET /api/subscriptions/plans` (existing, `subscriptions.ts:58` — returns `{ success, data: { plans/tiers } }`; inspect its response shape before wiring the dropdown).
- Produces: `setUserTier(userId: string, tierId: string, durationDays: number): Promise<{ tierName: string; expiresAt: string; creditsAdded: number }>` on the auth store.

- [ ] **Step 1: authStore action**

Add to the interface (after line 124's getUserSubscriptionDetails entry):

```ts
  setUserTier: (userId: string, tierId: string, durationDays: number) => Promise<{ tierName: string; expiresAt: string; creditsAdded: number }>;
```

Add the action after `addUserCredits` (line 855):

```ts
      setUserTier: async (userId: string, tierId: string, durationDays: number) => {
        const { user } = get();
        if (!user || user.role !== 'admin') {
          throw new Error('Only admins can set subscription tiers');
        }

        try {
          const response = await api.post<{ tierName: string; expiresAt: string; creditsAdded: number }>(
            `/admin/users/${userId}/set-tier`,
            { tierId, durationDays }
          );

          if (!response.success || !response.data) {
            throw new Error(response.error || 'Failed to set subscription tier');
          }

          return response.data;
        } catch (error) {
          throw error instanceof Error ? error : new Error('Failed to set subscription tier');
        }
      },
```

- [ ] **Step 2: UserManagement modal UI**

Add state near line 65:

```ts
  const [selectedTierId, setSelectedTierId] = useState('tier_student_monthly');
  const [tierDuration, setTierDuration] = useState('30');
  const [availableTiers, setAvailableTiers] = useState<{ id: string; name: string }[]>([]);
```

Destructure `setUserTier` from `useAuthStore()` (line 45-48 block). Fetch tiers when the modal opens (inside `openSubscriptionModal`, after `setActionSuccess(null)`):

```ts
    api.get<{ plans?: { id: string; name: string }[]; tiers?: { id: string; name: string }[] }>('/subscriptions/plans')
      .then((r) => {
        const list = r.data?.plans || r.data?.tiers || [];
        setAvailableTiers(list.map((t) => ({ id: t.id, name: t.name })));
      })
      .catch(() => setAvailableTiers([]));
```

(Adjust `plans` vs `tiers` key to the actual response of `GET /api/subscriptions/plans` — read `subscriptions.ts:58-107` first.)

Add the handler after `handleAddCredits`:

```ts
  const handleSetTier = async () => {
    if (!subscriptionUser) return;
    const days = parseInt(tierDuration);
    if (isNaN(days) || days < 1 || days > 3650) return;

    setSubscriptionLoading(true);
    try {
      const result = await setUserTier(subscriptionUser.id, selectedTierId, days);
      setActionSuccess(`Tier set to ${result.tierName} (${days} days)!`);
      const details = await getUserSubscriptionDetails(subscriptionUser.id);
      setSubscriptionDetails(details);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (error) {
      console.error('Failed to set tier:', error);
    } finally {
      setSubscriptionLoading(false);
    }
  };
```

In the subscription modal JSX (next to the Extend Trial and Add Credits sections), add a "Set Subscription Tier" section styled like its neighbors: a `<select>` bound to `selectedTierId` rendering `availableTiers`, a duration `<select>` with presets 30 / 90 / 365 / 3650 ("Comp — 10 years"), and an Apply button calling `handleSetTier`, disabled while `subscriptionLoading`.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/stores/authStore.ts src/pages/UserManagement.tsx
git commit -m "feat(admin-ui): set subscription tier from the user management modal"
```

---

### Task 10: Full verification + production deploy + live probes

**Files:**
- Create: `scripts/probe-whiteboard-gating.cjs`

**Interfaces:**
- Consumes: everything above.
- Produces: deployed worker + Pages build; probe evidence.

- [ ] **Step 1: Full test suite + build**

Run: `npx vitest run workers/api && npm run build`
Expected: all tests PASS (289 prior + new), build clean.

- [ ] **Step 2: Deploy worker and frontend**

```bash
npx wrangler deploy
npx wrangler pages deploy dist --project-name=brilla-study-platform
```

- [ ] **Step 3: Live gating probe**

Write `scripts/probe-whiteboard-gating.cjs` following the existing login pattern in `scripts/probe-revision-all-exams.cjs` (Turnstile login via puppeteer, token from `localStorage.brilla_token`, then direct `fetch` calls to `https://brilla-api.ghwmelite.workers.dev/api`). As **johndoe@gmail.com** (free tier):

1. `GET /subscriptions/features` → expect `features.whiteboard === false`, `dailyAiLimit === 10`.
2. Create a session (`POST /revision-classroom/sessions`, `subj_nsmq_math`), take the first lesson id.
3. `POST /lessons/:id/whiteboard-teach` → expect **403** with `upgradeRequired: true`.
4. `POST /lessons/:id/teach` (phase hook) → expect 200 with `remainingFreeToday: 9` (or lower if earlier probes consumed allowance — just assert the field exists and is >= 0).

Then as **admintest@brillaprep.org** (admin):

5. `POST /admin/users/:johndoeId/set-tier` `{ tierId: 'tier_student_monthly', durationDays: 1 }` → expect 200, `creditsAdded: 50`. (Get johndoe's id from the johndoe login response `user.id`.)
6. Re-login as johndoe (token is still valid; tier is read per-request) → `GET /subscriptions/features` → `whiteboard === true`; `POST whiteboard-teach` → expect 200 with real content and `fallback` boolean present.
7. Restore: `POST /admin/users/:id/set-tier` `{ tierId: 'tier_free', durationDays: 1 }` → expect 200. (tier_free has `ai_grading_quota: 0`, so no credit change; johndoe returns to free.)
8. `GET /admin/users/:johndoeId/subscription` → expect 200 (not 500) with `subscription.planName` present.

Run: `node scripts/probe-whiteboard-gating.cjs`
Expected: every step prints its expected status.

- [ ] **Step 4: Browser smoke test**

Extend/reuse `scripts/repro-revision-classroom.cjs`: login as johndoe → revision-classroom → Whiteboard tab shows the upgrade card (free) — screenshot. After step 3's temporary upgrade, whiteboard shows the lesson-type picker. (Reuse the set-tier calls in the probe to toggle between the two states.)

- [ ] **Step 5: Commit**

```bash
git add scripts/probe-whiteboard-gating.cjs
git commit -m "test(scripts): live probe for whiteboard gating + admin set-tier"
```

---

## Self-Review Notes (completed)

- Spec coverage: A1 → Tasks 2,3,5,6; A2 → Tasks 1,2,3,5,6; A3 → Tasks 4,9; A4 → Tasks 2 (validation/fallback), 7, 8; A5 → test steps in every task + Task 10.
- `remainingFreeToday` is deliberately `-1` for premium so the pill hides itself (`>= 0` check).
- `set-tier` on `tier_free` records expiry +1 day — harmless: `isPremiumUser` ignores `tier_free` regardless of expiry.
- The `subscription/plans` response key (`plans` vs `tiers`) must be read from `subscriptions.ts:58` during Task 9 — both handled.
- Phase B (progressive generation, animation, KaTeX, primitives, TTS, caching) is NOT in this plan; it gets its own plan against the post-A codebase.
