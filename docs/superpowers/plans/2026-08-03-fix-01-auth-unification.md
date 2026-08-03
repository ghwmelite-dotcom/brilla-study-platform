# Phase 1 — Auth Unification

**Goal:** Eliminate every authentication bypass in the worker API by routing ALL authenticated endpoints through one shared JWT middleware, deleting header-based identity fallbacks and demo-token acceptance backend-wide, fixing the IDOR cluster on `protectedApp`, and hardening the auth-adjacent endpoints (`/auth/setup`, OAuth register, seed-questions, CORS, email templates, Turnstile skip, error handler).

**Architecture:** A single new module, `workers/api/auth-middleware.ts`, exports `requireAuth` / `requireAdmin` middleware and a `constantTimeEqual` helper. Every satellite router and both index.ts sub-apps (`protectedApp`, `adminApp`) mount it; identity (`userId`, `userRole`, `user`) is set ONLY from a signature-verified JWT, with a per-request `status`/`is_active` re-check against D1. Satellite modules delete their local auth helpers/middleware and read `c.get('userId')` / `c.get('userRole')` / `c.get('user')`.

**Tech stack:** Hono 4 on Cloudflare Workers, `hono/jwt` (`sign`/`verify`), D1 (`c.env.DB`), vitest (Phase 0 baseline — assumed landed; worker handlers testable with mocked `c.env`/`DB`).

**Verified line references** below are against the code as of 2026-08-03; treat them as anchors and re-locate by the quoted code if they drift.

## Global Constraints

- **Identity is derived only from verified JWT context — never request headers/body/query.**
- Minimal diff; no unrelated refactors.
- Every task ends with a verifiable command and expected output.
- Commits only with user's explicit approval.
- Demo-token acceptance is removed from ALL worker code paths (backend side of demo mode dies here; the frontend demo fallback is Phase 4's job). Demo accounts (`teacher@brillaprep.org` / `Teacher123!`, `student@brillaprep.org` / `Student123!`) still work via real `/auth/login` → real JWT.
- Error envelope standard: `{ success: false, error: string }`.
- Test runner: `cd workers && npx vitest run` (confirm exact Phase 0 script name before starting; if Phase 0 registered `npm test` in `workers/package.json`, use that).

---

## Task 1 — Shared auth middleware + tests (TDD)

Create `workers/api/auth-middleware.ts` and its test file FIRST. Tests must fail before the file exists.

- [ ] Write `workers/api/__tests__/auth-middleware.test.ts` (path per Phase 0 convention):

```ts
import { describe, it, expect, vi } from 'vitest';
import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import { requireAuth, requireAdmin, constantTimeEqual } from '../auth-middleware';

const JWT_SECRET = 'test-secret-that-is-long-enough';

const ACTIVE_USER = { role: 'student', status: 'approved', is_active: 1 };

function makeDb(userRow: unknown) {
  return {
    prepare: vi.fn(() => ({
      bind: vi.fn(() => ({ first: vi.fn().mockResolvedValue(userRow) })),
    })),
  } as unknown as D1Database;
}

function makeApp(userRow: unknown, middleware = requireAuth) {
  const app = new Hono();
  app.use('*', middleware);
  app.get('/probe', (c) =>
    c.json({ success: true, userId: c.get('userId'), userRole: c.get('userRole') }),
  );
  return { app, env: { DB: makeDb(userRow), JWT_SECRET } };
}

async function token(payload: object, secret = JWT_SECRET, expOffset = 3600) {
  return sign(
    { ...payload, exp: Math.floor(Date.now() / 1000) + expOffset, iat: Math.floor(Date.now() / 1000) },
    secret,
  );
}

describe('requireAuth', () => {
  it('accepts a valid token and sets context', async () => {
    const { app, env } = makeApp(ACTIVE_USER);
    const t = await token({ userId: 'user_1', email: 's@x.com', role: 'student' });
    const res = await app.fetch(
      new Request('http://x/probe', { headers: { Authorization: `Bearer ${t}` } }), env,
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ userId: 'user_1', userRole: 'student' });
  });

  it('rejects an expired token with 401', async () => {
    const { app, env } = makeApp(ACTIVE_USER);
    const t = await token({ userId: 'user_1', role: 'student' }, JWT_SECRET, -60);
    const res = await app.fetch(
      new Request('http://x/probe', { headers: { Authorization: `Bearer ${t}` } }), env,
    );
    expect(res.status).toBe(401);
  });

  it('rejects a forged token (wrong secret) with 401', async () => {
    const { app, env } = makeApp(ACTIVE_USER);
    const t = await token({ userId: 'user_1', role: 'admin' }, 'attacker-secret');
    const res = await app.fetch(
      new Request('http://x/probe', { headers: { Authorization: `Bearer ${t}` } }), env,
    );
    expect(res.status).toBe(401);
  });

  it('rejects a missing token with 401', async () => {
    const { app, env } = makeApp(ACTIVE_USER);
    const res = await app.fetch(new Request('http://x/probe'), env);
    expect(res.status).toBe(401);
  });

  it('rejects header-spoof attempts: x-user-id/x-user-role are ignored without a token', async () => {
    const { app, env } = makeApp(ACTIVE_USER);
    const res = await app.fetch(
      new Request('http://x/probe', { headers: { 'x-user-id': 'admin_prod_001', 'x-user-role': 'admin' } }),
      env,
    );
    expect(res.status).toBe(401);
  });

  it('rejects a demo token with 401', async () => {
    const { app, env } = makeApp(ACTIVE_USER);
    const res = await app.fetch(
      new Request('http://x/probe', { headers: { Authorization: 'Bearer admin_demo_token' } }), env,
    );
    expect(res.status).toBe(401);
  });

  it('rejects a suspended user (is_active = 0) with 403', async () => {
    const { app, env } = makeApp({ role: 'student', status: 'approved', is_active: 0 });
    const t = await token({ userId: 'user_1', role: 'student' });
    const res = await app.fetch(
      new Request('http://x/probe', { headers: { Authorization: `Bearer ${t}` } }), env,
    );
    expect(res.status).toBe(403);
  });

  it('rejects a pending user with 403', async () => {
    const { app, env } = makeApp({ role: 'student', status: 'pending', is_active: 1 });
    const t = await token({ userId: 'user_1', role: 'student' });
    const res = await app.fetch(
      new Request('http://x/probe', { headers: { Authorization: `Bearer ${t}` } }), env,
    );
    expect(res.status).toBe(403);
  });

  it('uses the DB role, not the frozen JWT role (role escalation after issue is neutralized)', async () => {
    const { app, env } = makeApp({ role: 'student', status: 'approved', is_active: 1 });
    const t = await token({ userId: 'user_1', role: 'admin' }); // token claims admin
    const res = await app.fetch(
      new Request('http://x/probe', { headers: { Authorization: `Bearer ${t}` } }), env,
    );
    expect(await res.json()).toMatchObject({ userRole: 'student' });
  });
});

describe('requireAdmin', () => {
  it('rejects a non-admin with 403', async () => {
    const { app, env } = makeApp(ACTIVE_USER, requireAdmin);
    const t = await token({ userId: 'user_1', role: 'student' });
    const res = await app.fetch(
      new Request('http://x/probe', { headers: { Authorization: `Bearer ${t}` } }), env,
    );
    expect(res.status).toBe(403);
  });

  it('accepts an admin', async () => {
    const { app, env } = makeApp({ role: 'admin', status: 'approved', is_active: 1 }, requireAdmin);
    const t = await token({ userId: 'admin_1', role: 'admin' });
    const res = await app.fetch(
      new Request('http://x/probe', { headers: { Authorization: `Bearer ${t}` } }), env,
    );
    expect(res.status).toBe(200);
  });
});

describe('constantTimeEqual', () => {
  it('returns true for equal strings and false otherwise', () => {
    expect(constantTimeEqual('abc', 'abc')).toBe(true);
    expect(constantTimeEqual('abc', 'abd')).toBe(false);
    expect(constantTimeEqual('abc', 'abcd')).toBe(false);
  });
});
```

- [ ] Create `workers/api/auth-middleware.ts`:

```ts
import { verify } from 'hono/jwt';
import type { Context, Next } from 'hono';

export interface AuthPayload {
  userId: string;
  email?: string;
  role?: string;
}

interface AuthBindings {
  DB: D1Database;
  JWT_SECRET: string;
}

/**
 * Shared JWT authentication middleware.
 * Identity is derived ONLY from a signature-verified JWT plus a fresh
 * users-table lookup. Request headers/body/query are never trusted.
 *
 * Sets on context: userId, userRole (fresh from DB), user (JWT payload).
 */
export const requireAuth = async (
  c: Context<{ Bindings: AuthBindings }>,
  next: Next,
): Promise<Response | void> => {
  // CORS preflight passes through; the cors() middleware handles it.
  if (c.req.method === 'OPTIONS') {
    return next();
  }

  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const token = authHeader.slice(7);

  let payload: AuthPayload;
  try {
    payload = (await verify(token, c.env.JWT_SECRET)) as unknown as AuthPayload;
  } catch {
    return c.json({ success: false, error: 'Invalid or expired token' }, 401);
  }

  if (!payload?.userId) {
    return c.json({ success: false, error: 'Invalid token' }, 401);
  }

  // Per-request re-check: role/status/is_active are NOT trusted from the JWT.
  const user = await c.env.DB.prepare(
    'SELECT role, status, is_active FROM users WHERE id = ?',
  )
    .bind(payload.userId)
    .first<{ role: string; status: string; is_active: number }>();

  if (!user || user.is_active !== 1 || user.status !== 'approved') {
    return c.json({ success: false, error: 'Account is not active' }, 403);
  }

  c.set('userId', payload.userId);
  c.set('userRole', user.role);
  c.set('user', { ...payload, role: user.role });
  await next();
};

/** requireAuth + admin role check (role read fresh from DB). */
export const requireAdmin = async (
  c: Context<{ Bindings: AuthBindings }>,
  next: Next,
): Promise<Response | void> => {
  // Run the base check first by composing manually.
  if (c.req.method === 'OPTIONS') {
    return next();
  }

  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const token = authHeader.slice(7);

  let payload: AuthPayload;
  try {
    payload = (await verify(token, c.env.JWT_SECRET)) as unknown as AuthPayload;
  } catch {
    return c.json({ success: false, error: 'Invalid or expired token' }, 401);
  }

  if (!payload?.userId) {
    return c.json({ success: false, error: 'Invalid token' }, 401);
  }

  const user = await c.env.DB.prepare(
    'SELECT role, status, is_active FROM users WHERE id = ?',
  )
    .bind(payload.userId)
    .first<{ role: string; status: string; is_active: number }>();

  if (!user || user.is_active !== 1 || user.status !== 'approved') {
    return c.json({ success: false, error: 'Account is not active' }, 403);
  }

  if (user.role !== 'admin') {
    return c.json({ success: false, error: 'Admin access required' }, 403);
  }

  c.set('userId', payload.userId);
  c.set('userRole', user.role);
  c.set('user', { ...payload, role: user.role });
  await next();
};

/** Constant-time string comparison for secret comparisons. */
export function constantTimeEqual(a: string, b: string): boolean {
  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);
  if (aBytes.length !== bBytes.length) return false;
  let diff = 0;
  for (let i = 0; i < aBytes.length; i++) {
    diff |= aBytes[i] ^ bBytes[i];
  }
  return diff === 0;
}
```

- [ ] Note for the `users` table: `status` and `is_active` columns exist (`database/schema.sql:224` `users` table; `is_active` at schema line 240 area). The re-check query hits the `users.id` PRIMARY KEY — no new index needed.

**Verify:** `cd workers && npx vitest run __tests__/auth-middleware.test.ts` — expect all 13 tests pass.
**Commit (with approval):** `feat(api): add shared JWT auth middleware with per-request status check`

---

## Task 2 — Rewire index.ts core auth (protectedApp + adminAuth), kill demo tokens, 24h JWT

- [ ] `workers/api/index.ts`: add `import { requireAuth, requireAdmin, constantTimeEqual } from './auth-middleware';` to the import block (top of file, near `import { cors } from 'hono/cors';` at line 2).
- [ ] Replace the entire `protectedApp.use('*', ...)` body at `workers/api/index.ts:911-965` with `protectedApp.use('*', requireAuth);`. This deletes the `_demo_token` acceptance block at :927-947.
- [ ] Delete the local `adminAuth` function at `workers/api/index.ts:5903-5943` and change `adminApp.use('*', adminAuth);` (:5947) to `adminApp.use('*', requireAdmin);`. This deletes the second demo-token block at :5911-5927. NOTE: `adminAuth` previously set `c.set('user', payload)` — `requireAdmin` also sets `user`, so admin handlers reading `c.get('user')` keep working.
- [ ] Neuter the header-fallback helpers at `workers/api/index.ts:972-979` (keep the functions — 42 call sites — but delete the header fallback so they are pure context reads):

```ts
// Identity comes only from verified JWT context (set by requireAuth).
function getUserId(c: { get: (key: string) => string | undefined }): string | undefined {
  return c.get('userId');
}

function getUserRole(c: { get: (key: string) => string | undefined }): string | undefined {
  return c.get('userRole');
}
```

- [ ] Reduce access-token lifetime: `workers/api/index.ts:253` change `(7 * 24 * 60 * 60), // 7 days` to `(24 * 60 * 60), // 24 hours`. Same change in `workers/api/oauth.ts:86`.
- [ ] `users.status` middleware re-check means suspended users are cut off within the request, not after 7 days — covered by Task 1 middleware.
- [ ] Add a smoke test `workers/api/__tests__/index-auth.test.ts`: mount nothing new; import the worker's `app` default export if Phase 0 made it importable, otherwise cover via the satellite-module tests in Tasks 3-8. Assert `GET /api/progress` with only `x-user-id` header returns 401. (If importing `index.ts` in vitest proves too heavy — 10k lines, many bindings — note it and rely on satellite tests + manual `wrangler dev` curl check.)

**Verify:** `cd workers && npx vitest run` — all tests pass; `grep -n "_demo_token" workers/api/index.ts` returns nothing; `grep -n "x-user-id" workers/api/index.ts` returns nothing.
**Commit (with approval):** `fix(api): unify protectedApp/adminApp on shared JWT middleware; drop demo tokens; 24h JWT expiry`

---

## Task 3 — Satellite conversion recipe (full example: chat.ts) + tutor.ts, counselor.ts

These three modules have no middleware of their own; they rely on the mount plus a local `getUserId` helper that falls back to `x-user-id`. Repeatable recipe:

1. Add `chatApp.use('*', requireAuth)` (import from `./auth-middleware`).
2. Reduce the local `getUserId`/`getUserRole` helpers to pure context reads.
3. Verify no route still reads `c.req.header('x-user-id'`.

- [ ] `workers/api/chat.ts` full conversion:
  - Top of file: `import { requireAuth } from './auth-middleware';`
  - After the `chatApp` Hono construction, add:

```ts
chatApp.use('*', requireAuth);
```

  - Replace `workers/api/chat.ts:47-49`:

```ts
function getUserId(c: Context): string | undefined {
  return c.get('userId');
}
```

- [ ] `workers/api/tutor.ts`: same recipe. Mount `tutorApp.use('*', requireAuth);`; replace helper at `workers/api/tutor.ts:139-141` with `return c.get('userId');`.
- [ ] `workers/api/counselor.ts`: same recipe. Mount `counselorApp.use('*', requireAuth);`; replace helpers at `workers/api/counselor.ts:128-134`:

```ts
function getUserId(c: Context): string | undefined {
  return c.get('userId');
}

function getUserRole(c: Context): string | undefined {
  return c.get('userRole');
}
```

- [ ] Type check: these modules declare their own `Env` interfaces; `requireAuth` only needs `{ DB, JWT_SECRET }` which all of them satisfy structurally. If TS complains about `c.set('userId')` on an untyped Hono instance, the `Variables` generic must include `userId: string; userRole: string` — add to the module's Hono type param (e.g. moderation.ts already does this at `moderation.ts:4-9`).
- [ ] Add one integration-style test per module pattern (example `workers/api/__tests__/chat-auth.test.ts`): build `chatApp`, fetch with `x-user-id` header only → expect 401; fetch with valid signed token (mocked DB user row) → expect non-401.

**Verify:** `cd workers && npx vitest run`; `grep -n "x-user-id\|x-user-role" workers/api/chat.ts workers/api/tutor.ts workers/api/counselor.ts` — no matches.
**Commit (with approval):** `fix(api): JWT-only auth for chat, tutor, counselor routers`

---

## Task 4 — friends.ts, recordings.ts, library.ts, whiteboards.ts (manual verify + demo tokens)

All four contain: a hand-rolled JWT verify using `atob`/`crypto.subtle` (friends.ts:20-45, recordings.ts:~45-75, library.ts:~25-50, whiteboards.ts:~75-108), a `_demo_token` acceptance block (friends.ts:54-65, recordings.ts:96-107, library.ts:65-76, whiteboards.ts:84-99), and `x-user-id`/`x-user-role` fallbacks (friends.ts:81-94, recordings.ts:123-141, library.ts:93-106 plus route-level fallbacks at library.ts:862, 1010, 1084, 1134).

Recipe per module:

1. Delete the hand-rolled verify helper AND the demo-token block entirely.
2. Mount `appName.use('*', requireAuth);` immediately after the Hono app is constructed.
3. Reduce local `getUserId`/`getUserRole` helpers to pure `c.get(...)` reads.
4. Fix route-level header reads (library.ts:862, 1010, 1084, 1134) to `c.get('userRole')`.
5. Delete now-unused imports (`atob`-based helpers, demo user maps).

- [ ] `workers/api/friends.ts`: delete lines ~20-65 (manual verify + demo block) and the header fallback at :81-87; mount `friendsApp.use('*', requireAuth);`; helper at :93-95 → `return c.get('userId');`.
- [ ] `workers/api/recordings.ts`: delete ~:45-107 (manual verify + demo block) and fallbacks at :123-129; mount middleware; helpers at :135-142 → context-only.
- [ ] `workers/api/library.ts`: delete ~:25-76 and fallback at :93-99; mount middleware; helper at :105-107 → context-only; fix the four route-level `c.req.header('x-user-role')` reads (:862, :1010, :1084, :1134) to `c.get('userRole')`.
- [ ] `workers/api/whiteboards.ts`: delete demo block :83-99 and its local verify path :101-107, keeping ONLY the shared middleware: replace the whole middleware at ~:70-111 with `whiteboardsApp.use('*', requireAuth);`.

**Verify:** `cd workers && npx vitest run`; `grep -n "_demo_token\|x-user-id\|x-user-role\|atob" workers/api/friends.ts workers/api/recordings.ts workers/api/library.ts workers/api/whiteboards.ts` — no matches.
**Commit (with approval):** `fix(api): JWT-only auth for friends, recordings, library, whiteboards`

---

## Task 5 — subscriptions.ts, payments.ts, affiliates.ts, teacher-bonuses.ts, tutoring.ts (own middleware + demo tokens)

Each of these has its own auth middleware containing a `_demo_token` block mapping `admin_demo_token` → real admin `admin_prod_001` (subscriptions.ts:13-17 + 54-63 — NO environment check; payments.ts:49-67, affiliates.ts:67+, teacher-bonuses.ts:44+, tutoring.ts:45+ — env-gated but still deleted).

Recipe per module: delete the ENTIRE local middleware function and the local `demoUsers` map; replace with `appName.use('*', requireAuth);`.

- [ ] `workers/api/subscriptions.ts`: delete `demoUsers` (:13-17) and middleware (:44-75); add `subscriptionsApp.use('*', requireAuth);`.
- [ ] `workers/api/payments.ts`: delete local `authMiddleware` (:33-81) and its local `verifyJWT` helper if now unused; mount shared middleware where the local one was applied.
- [ ] `workers/api/affiliates.ts`: same — delete demo block at :67+ and local middleware; mount shared.
- [ ] `workers/api/teacher-bonuses.ts`: same — demo block at :44+.
- [ ] `workers/api/tutoring.ts`: same — demo block at :45+.
- [ ] Check each module for `c.get('user')` vs `c.get('userId')` usage after the swap; shared middleware sets all three context keys, so no route-body changes should be needed — confirm with typecheck.

**Verify:** `cd workers && npx vitest run`; `grep -rn "_demo_token" workers/api/` — no matches anywhere in the worker.
**Commit (with approval):** `fix(api): remove demo-token acceptance from all remaining routers`

---

## Task 6 — moderation.ts + notifications.ts

- [ ] `workers/api/moderation.ts`: replace the header-only middleware at :14-33 with `moderationApp.use('*', requireAuth);` (import from `./auth-middleware`). The module's `ModerationContext` Variables type (:4-9) already matches.
- [ ] `workers/api/moderation.ts`: wrap all 19 routes (listed at :75-1001: `/reports` x4, `/actions` x7, `/filters` x4, `/check-content`, `/user/:id/history`, `/audit-log`, `/stats`) in try/catch returning `{ success: false, error: '<op> failed' }` on error. Standardize every error response from `{ error }` to `{ success: false, error }` — grep `c.json({ error` in the file and convert each.
- [ ] Role enforcement: routes currently call `isAdmin(role)`/`isModerator(role)` (:36-43) with the role from context — unchanged; the role is now fresh-from-DB via the middleware.
- [ ] `workers/api/notifications.ts`: delete the `getUserId` helper at :7-18 (raw `atob` of JWT payload WITHOUT signature verification). Mount `notificationsApp.use('*', requireAuth);` after app construction (:4). Replace every `const userId = getUserId(c);` + `if (!userId) return 401` pair with `const userId = c.get('userId')!;` (middleware guarantees presence). Add `Variables: { userId: string; userRole: string }` to the Hono generic at :4.
- [ ] Add test `workers/api/__tests__/notifications-auth.test.ts`: request with a token whose payload was tampered (re-encoded with different `sub`, same invalid signature) → 401 (proves signature is now checked); valid token → 200.

**Verify:** `cd workers && npx vitest run`; `grep -n "atob\|x-user-id" workers/api/moderation.ts workers/api/notifications.ts` — no matches; `grep -c "c.json({ error" workers/api/moderation.ts` → 0.
**Commit (with approval):** `fix(api): verified-JWT auth for moderation and notifications; standardize error envelopes`

---

## Task 7 — Orphan routers: quickplay, teambattles, events, cosmetics, rewards, engagement, learningpath, activityfeed

These eight are mounted bare (`workers/api/index.ts:10241-10248`) with NO middleware, yet read `c.get('user')` (e.g. quickplay.ts:26, :88) — currently `undefined`, so every route 500s through the leaky global onError. They were also unreachable-as-intended: nothing ever set their context.

Recipe per module: add `import { requireAuth } from './auth-middleware';` and `<app>.use('*', requireAuth);` immediately after the Hono construction. No route-body changes — shared middleware sets `c.set('user', payload)` which is exactly what they read. Each module's local `Env` interface includes `DB` and `JWT_SECRET` (verified quickplay.ts:3-6) — structurally compatible.

- [ ] `workers/api/quickplay.ts` — app constructed at :14; add use at :15.
- [ ] `workers/api/teambattles.ts` — same pattern (UserPayload at :9).
- [ ] `workers/api/events.ts`.
- [ ] `workers/api/cosmetics.ts`.
- [ ] `workers/api/rewards.ts` (UserPayload at :9).
- [ ] `workers/api/engagement.ts`.
- [ ] `workers/api/learningpath.ts`.
- [ ] `workers/api/activityfeed.ts`.
- [ ] Add one test per the pattern (example quickplay): unauthenticated `GET /daily-challenge` → 401 (previously 500); with valid token + mocked DB → 200/JSON.
- [ ] NOTE for review: `events.ts` may contain genuinely public endpoints (event listing). Spot-check each router for endpoints that must stay public; if any exist, mount `requireAuth` only on the protected path prefix (e.g. `eventsApp.use('/rsvp/*', requireAuth)`) instead of `'*'`. Document the decision in the commit message. Default: protect everything — these are engagement features that all write user-scoped rows.

**Verify:** `cd workers && npx vitest run`; manual: `curl -i https://<dev>/api/quickplay/daily-challenge` → 401 (not 500).
**Commit (with approval):** `fix(api): mount JWT middleware on engagement/activity routers`

---

## Task 8 — exam-boards.ts: shared middleware + seed-questions admin gate + batch insert

- [ ] Replace the local `/user/*` JWT middleware at `workers/api/exam-boards.ts:24-47` with `examBoardsApp.use('/user/*', requireAuth);` (keeps public endpoints public — this module intentionally has them at :49+). `c.get('user')` consumers (:632 etc.) still work.
- [ ] Gate `POST /seed-questions` (:589-628) behind `requireAdmin` instead of the `secretKey !== c.env.JWT_SECRET` check (:595-597): change the route registration to `examBoardsApp.post('/seed-questions', requireAdmin, async (c) => { ... })` and delete the `secretKey` destructure/check (:592, :594-597).
- [ ] Batch the insert loop (:604-621) with `c.env.DB.batch`:

```ts
const stmts = questions.map((q) =>
  db.prepare(`
    INSERT OR IGNORE INTO questions (
      id, topic_id, subject_id, exam_type_id, question_text, question_type,
      options, correct_answer, explanation, difficulty, points, marks,
      syllabus_topic_id, exam_board_id, command_word
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    q.id, q.topic_id, q.subject_id, q.exam_type_id, q.question_text, q.question_type,
    q.options || null, q.correct_answer, q.explanation, q.difficulty, q.points || 3, q.marks || 1,
    q.syllabus_topic_id || null, q.exam_board_id || null, q.command_word || null,
  ),
);
const results = await db.batch(stmts);
const inserted = results.reduce((n, r) => n + (r.meta.changes || 0), 0);
```

- [ ] Add test: `POST /seed-questions` with a valid non-admin token → 403; with body `{ secretKey: <JWT_SECRET> }` and no token → 401.

**Verify:** `cd workers && npx vitest run`; `grep -n "secretKey" workers/api/exam-boards.ts` — no matches.
**Commit (with approval):** `fix(api): admin-gate exam-boards seed endpoint; batch question inserts`

---

## Task 9 — IDOR: houses + battles family (index.ts)

Pattern for every fix: delete `userId` from the destructured request body/query; use `const userId = c.get('userId')!;`. Where admin-acting-on-another-user is legitimate, check `c.get('userRole') === 'admin'` explicitly.

- [ ] `workers/api/index.ts:3689-3712` `POST /houses`: remove `userId` from body destructure (:3690); admin check via `c.get('userRole') !== 'admin'` → 403 (replaces the DB role lookup against a caller-supplied id at :3694-3700).
- [ ] `workers/api/index.ts:3715-3735` `POST /houses/points`: use JWT `userId`. This endpoint lets a caller award arbitrary points — restrict: either (a) require admin role, or (b) clamp to self + trusted `source` values. Decision: require `c.get('userRole')` to be `admin` or `teacher` (points are teacher/system-awarded); students must not self-award. Document choice in commit.
- [ ] `workers/api/index.ts:3738-3751` `PUT /users/:id/house`: allow when `c.get('userId') === c.req.param('id')` OR `c.get('userRole') === 'admin'`; else 403.
- [ ] `workers/api/index.ts:3758-3759` `POST /battles`: JWT `userId`.
- [ ] `workers/api/index.ts:3833-3835` `POST /battles/:id/join`: JWT `userId`.
- [ ] `workers/api/index.ts:3883-3885` `POST /battles/:id/answer`: JWT `userId`; keep the participant check that already exists downstream.
- [ ] `workers/api/index.ts:3983-3985` `POST /battles/:id/cancel`: JWT `userId`.
- [ ] `workers/api/index.ts:4018-4024` `GET /battles/history` (protectedApp): replace query `userId` with JWT `userId`; the `if (!userId) 400` branch becomes unreachable — delete it.
- [ ] `workers/api/index.ts:3048-3072` `GET /battles/history` (publicApp duplicate — note there are TWO history routes; the publicApp one at :3048 shadows nothing since protectedApp is mounted at `/api` too — confirm route precedence during implementation: `app.route('/api', publicApp)` at :3219 runs before `app.route('/api', protectedApp)` at :10258, so the public one wins). Fix: DELETE the publicApp `/battles/history` route entirely (:3047-~3130) so the protected one (now JWT-derived) serves the request.
- [ ] Tests: for `POST /houses/points` — student token → 403. For `POST /battles` — body containing `userId: 'victim'` + attacker token → row inserted with attacker id (assert bound param).

**Verify:** `cd workers && npx vitest run`; `grep -n "const { userId" workers/api/index.ts` — only routes that legitimately accept an admin-targeted id remain (none in this family).
**Commit (with approval):** `fix(api): derive identity from JWT in houses/battles endpoints (IDOR)`

---

## Task 10 — IDOR: papers + progress family (index.ts)

- [ ] `workers/api/index.ts:3329-3330` `GET /progress`: replace `c.req.query('userId') || 'user_demo'` with `const userId = c.get('userId')!;` (also kills the `'user_demo'` default).
- [ ] `workers/api/index.ts:4052-4053` `GET /papers/attempts`: delete the `c.req.query('userId') ||` half; keep `c.get('userId')`.
- [ ] `workers/api/index.ts:4114-4116` `POST /papers/:id/attempt`: JWT `userId`.
- [ ] `workers/api/index.ts:4175-4177` `POST /papers/:id/abandon`: JWT `userId`.
- [ ] `workers/api/index.ts:4194-4196` `PUT /papers/attempts/:attemptId/answer`: JWT `userId` (ownership query at :4200-4202 already scopes by it).
- [ ] `workers/api/index.ts:4236-4238` `POST /papers/attempts/:attemptId/submit`: JWT `userId`.
- [ ] `workers/api/index.ts:4313-4315` `GET /papers/attempts/:attemptId/results`: JWT `userId`; allow `c.get('userRole') === 'admin'` to pass an explicit `?userId=` for support lookups (query the attempt by id only, no user scoping) — implement only if an admin UI needs it; otherwise just scope to self. Default: scope to self; note the decision.
- [ ] Tests: `GET /progress?userId=victim` with attacker token → returns attacker's rows (assert mocked DB bind value is the attacker's id).

**Verify:** `cd workers && npx vitest run`; `grep -n "req.query('userId')" workers/api/index.ts` — no matches outside an explicitly-documented admin branch.
**Commit (with approval):** `fix(api): derive identity from JWT in progress/papers endpoints (IDOR)`

---

## Task 11 — IDOR: essays family (index.ts)

- [ ] `workers/api/index.ts:4357-4358` `POST /essays/submit`: JWT `userId` — closes "spend another user's AI grading credits" (:4408-4412 deducts from the body-supplied id today).
- [ ] `workers/api/index.ts:4429-4448` `POST /essays/:attemptId/grade`: currently grades ANY attempt by id with no ownership check. Add after fetching the attempt: `if (attempt.user_id !== c.get('userId') && c.get('userRole') !== 'admin') return c.json({ success: false, error: 'Forbidden' }, 403);` — select `ea.user_id` in the existing query (:4436-4444 selects `ea.*`, so it's already available).
- [ ] `workers/api/index.ts:4555-4561` `GET /essays/history`: JWT `userId`; delete the `if (!userId) 400` branch. If admins need other users' history, allow `?userId=` only when `c.get('userRole') === 'admin'`; default: self only.
- [ ] Tests: submit with body `userId: 'victim'` + attacker token → attempt row bound with attacker id; grade someone else's attemptId → 403.

**Verify:** `cd workers && npx vitest run`; `grep -n "const { userId" workers/api/index.ts` — no remaining IDOR sites.
**Commit (with approval):** `fix(api): derive identity from JWT in essay endpoints (IDOR)`

---

## Task 12 — /auth/setup hardening + constant-time secret comparisons

`workers/api/index.ts:1739-1796`.

- [ ] Add a `SETUP_KEY` secret to the `Env` interface and `wrangler.toml` docs/`.dev.vars` handling (separate from `JWT_SECRET`). If `c.env.SETUP_KEY` is unset → endpoint returns 404 (disabled).
- [ ] Compare with `constantTimeEqual(setupKey, c.env.SETUP_KEY)` (imported from `./auth-middleware`) — replaces `setupKey !== c.env.JWT_SECRET` at :1744.
- [ ] Rate limit: add a `'setup'` bucket to `RATE_LIMITS` (:288-326): `{ maxRequests: 5, windowMs: 60 * 60 * 1000 }`; call `checkRateLimit(c.env.DB, clientIp, 'setup')` at the top, mirroring the `demo-reset` pattern at :1801-1807.
- [ ] One-shot guard: before doing anything, `SELECT COUNT(*) as n FROM users WHERE role = 'admin'` — if `n > 0`, return 403 `Setup has already been completed`.
- [ ] Never overwrite: delete the `if (existing) UPDATE users SET password_hash` branch (:1766-1772); if the email exists, push `{ email, action: 'skipped_exists' }`.
- [ ] Role clamp: when processing a caller-supplied `users` array, reject any entry whose `role` is not in `['teacher', 'student', 'parent']` with 400 — admins come only from the built-in default list. Also drop the default-list passwords: generate a random password per default user (`generateToken()`-style) and return the plaintext ONCE in the response, or require the caller to supply passwords for the defaults. Decision: caller MUST supply the full users array in production (no defaults with weak passwords); the `Admin123!/Teacher123!/Student123!` defaults at :1752-1756 are deleted. Document in commit.
- [ ] Fix error leak at :1794: return generic `Setup failed` (keep `console.error`).
- [ ] Same constant-time treatment for `/auth/test-notification` at :1640-1645 — better: gate it with `requireAdmin` inline (`publicApp.post('/auth/test-notification', requireAdmin, ...)`) and delete the `adminKey` check entirely. This removes the last `!== JWT_SECRET` comparison (:1643).
- [ ] Tests: wrong key → 401; right key + existing admin → 403; right key + array containing `role: 'admin'` → 400; 6th attempt in window → 429.

**Verify:** `cd workers && npx vitest run`; `grep -n "JWT_SECRET" workers/api/index.ts | grep -v "c.env.JWT_SECRET)"` — no comparison usages remain (only passing the secret to sign/verify).
**Commit (with approval):** `fix(api): harden /auth/setup (SETUP_KEY, one-shot, rate limit, no overwrite, no admin creation)`

---

## Task 13 — OAuth + public register role hardening

- [ ] `workers/api/oauth.ts:398`: replace `const userRole = role || 'student';` with a whitelist:

```ts
const ALLOWED_SELF_SERVE_ROLES = ['student', 'teacher', 'parent'] as const;
if (role && !ALLOWED_SELF_SERVE_ROLES.includes(role)) {
  return c.json({ success: false, error: 'Invalid role' }, 400);
}
const userRole = role || 'student';
```

  (Same check at the `/google/init` handler :148-154 is optional defense-in-depth; enforce at account creation where it matters.)
- [ ] `workers/api/oauth.ts:412-413`: replace unconditional `const status = 'approved';` with:

```ts
// Students are auto-approved (Google has verified their email);
// teachers/parents require admin approval, matching the pending-approval model.
const status = userRole === 'student' ? 'approved' : 'pending';
```

  **Decision (documented):** students auto-approved on OAuth despite `/auth/register` marking students `'pending'` (`index.ts:1136`) — blocking Google-verified students would break the OAuth onboarding funnel; teachers/parents go pending. Divergence from the password-register flow is intentional; flag for product review.
- [ ] Fold-in (small, same blast radius): `/auth/register` at `workers/api/index.ts:1128` also trusts caller `role` (`const userRole = role || 'student'`) — status is forced `'pending'` so it's not directly exploitable, but add the same `ALLOWED_SELF_SERVE_ROLES` whitelist there as defense-in-depth. **This is folded IN, not deferred.**
- [ ] Tests: OAuth register with `role: 'admin'` → 400; with `role: 'teacher'` → user row inserted with `status = 'pending'`; with `role: 'student'` → `status = 'approved'`.

**Verify:** `cd workers && npx vitest run`.
**Commit (with approval):** `fix(api): whitelist self-serve roles; pending status for non-student OAuth registrations`

---

## Task 14 — CORS allowlist

- [ ] `workers/api/index.ts:899` replace `app.use('*', cors())` with:

```ts
app.use('*', cors({
  origin: (origin, c) => {
    const allowed = ['https://brillaprep.org', 'https://www.brillaprep.org'];
    if (c.env.ENVIRONMENT === 'development' || c.env.ENVIRONMENT === 'dev') {
      allowed.push('http://localhost:5173', 'http://127.0.0.1:5173');
    }
    return allowed.includes(origin) ? origin : '';
  },
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
}));
```

  NOTE: `x-user-id`/`x-user-role` deliberately NOT in `allowHeaders`.
- [ ] Check `Env` includes `ENVIRONMENT` (it does — used at :928, :983).
- [ ] Manual verify: `curl -i -H "Origin: https://evil.com" https://<api>/api/health` → no `Access-Control-Allow-Origin: *`; with `Origin: https://brillaprep.org` → header echoes the origin.

**Verify:** `cd workers && npx vitest run` + the curl checks above.
**Commit (with approval):** `fix(api): restrict CORS to brillaprep.org origins`

---

## Task 15 — Email HTML escaping

- [ ] Add helper in `workers/api/index.ts` near the email templates (:507):

```ts
function escapeHtml(value: string): string {
  return String(value).replace(/[&<>"']/g, (ch) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch] as string,
  );
}
```

- [ ] Apply at the interpolation sites:
  - `getVerificationEmailHTML` :522 — `Hello <strong>${escapeHtml(name)}</strong>`.
  - `getPasswordResetEmailHTML` :550 — same.
  - `getApprovalEmailHTML` :585 — `${escapeHtml(userName)}`.
  - `getRejectionEmailHTML` (:600+, interpolates `userName` AND `reason`) — escape both (audit missed `reason`; it is admin-entered but still user-visible content).
  - `getNewRegistrationEmailHTML` :650-652 — escape `userName`, `userEmail`, `userRole`.
  - `getSecurityAlertEmailHTML` (:677+) — escape `targetEmail`, `userAgent`, `country` interpolations (userAgent is attacker-controlled).
- [ ] Sweep: `grep -n '\${' workers/api/index.ts` within the email template functions (:507-~830) — every interpolation of user/request-derived data escaped.
- [ ] Test: call `getNewRegistrationEmailHTML('<img src=x onerror=alert(1)>', ...)` → output contains `&lt;img`, not `<img`. (If template fns aren't exported, export them or test via the register route with mocked Resend fetch.)

**Verify:** `cd workers && npx vitest run`.
**Commit (with approval):** `fix(api): escape user data in outbound email HTML`

---

## Task 16 — Turnstile skip narrowing

- [ ] `workers/api/index.ts:1282-1293`: the login Turnstile check is skipped for any `isDemoEmail(email)` — and `DEMO_EMAIL_PATTERNS = ['@brillaprep.org']` (:844) means ANY staff account on the company domain skips bot protection. Replace the domain check with an explicit allowlist:

```ts
// Explicit demo accounts allowed to skip Turnstile (never a domain-wide pattern)
const TURNSTILE_EXEMPT_EMAILS = new Set([
  'teacher@brillaprep.org',
  'student@brillaprep.org',
  'parent@brillaprep.org',
]);
```

  and `const isDemo = TURNSTILE_EXEMPT_EMAILS.has((email || '').toLowerCase());`
- [ ] Do NOT change `isDemoEmail`/`DEMO_EMAIL_PATTERNS` themselves — they drive demo-data isolation (`getDemoDataFlags` :878+), which is a separate concern; only the Turnstile skip narrows. (Also note `demoUtils.ts:7` duplicates the pattern list — leave for the demo-cleanup phase.)
- [ ] Test: login as `admin@brillaprep.org` without `turnstileToken` (and `TURNSTILE_SECRET` set) → 400 `Security verification required`; login as `student@brillaprep.org` without token → passes the Turnstile gate.

**Verify:** `cd workers && npx vitest run`.
**Commit (with approval):** `fix(api): narrow Turnstile skip to explicit demo accounts`

---

## Task 17 — Global onError generic message

- [ ] `workers/api/index.ts:10266-10270`:

```ts
app.onError((err, c) => {
  console.error('Unhandled error:', err); // detail stays in logs
  return c.json({ success: false, error: 'Internal server error' }, 500);
});
```

- [ ] Test: route that throws `new Error('db connection string xyz')` → response body is exactly `{ success: false, error: 'Internal server error' }`.

**Verify:** `cd workers && npx vitest run`.
**Commit (with approval):** `fix(api): stop leaking internal error details in 500 responses`

---

## Task 18 — Frontend: stop sending identity headers

Backend no longer accepts `x-user-id`/`x-user-role`; the frontend must stop sending them (they're a spoofing signal and dead weight). JWT in `Authorization` is already sent everywhere via `getAuthHeaders()`/`request()`.

- [ ] `src/utils/api.ts`: delete header injection at :107-113 (`request()`), :174-179 (`upload()`), and :245-250 (`getAuthHeaders()`). If `getUserInfo()` (:46-61) becomes unused, delete it too.
- [ ] `src/stores/chatStore.ts`: delete `'x-user-id': user.id` from fetch headers at :274, :323, :374, :437, :469, :503, :624, :688, :722, :814, :856 (11 sites — all already spread `getAuthHeaders()` which carries the JWT).
- [ ] `src/stores/aiTutorStore.ts`: delete `'x-user-id': userId` at :350, :508, :624, :690, :765 (5 sites — the audit missed this file).
- [ ] Sweep: `grep -rn "x-user-id\|x-user-role" src/` → no matches.
- [ ] Verify the app still works on JWT alone: `npm run build` succeeds; spot-check one chat action and one tutor action against `wrangler dev` locally (or rely on Phase 2+ QA — note which).

**Verify:** `npm run build` (root) succeeds; `grep -rn "x-user" src/` — no matches; `cd workers && npx vitest run` still green.
**Commit (with approval):** `fix(web): stop sending spoofable x-user-id/x-user-role headers`

---

## Verification

Full gate before declaring the phase done:

1. `cd workers && npx vitest run` — ALL tests pass (middleware suite + per-module auth tests + IDOR regression tests + hardening tests).
2. `grep -rn "_demo_token\|x-user-id\|x-user-role" workers/api/ src/` — zero matches.
3. `grep -n "atob" workers/api/notifications.ts workers/api/friends.ts workers/api/library.ts workers/api/recordings.ts` — zero matches.
4. Typecheck: `npx tsc --noEmit` for the worker project (use the tsconfig Phase 0 established for `workers/`; fallback smoke check: `npx wrangler deploy --dry-run` compiles cleanly) and root `npm run build`.
5. Lint: `npx eslint src/ workers/api/ --max-warnings 0` (or the project's configured lint script).
6. Manual smoke against `wrangler dev`:
   - `curl -i /api/chat/rooms` with only `x-user-id: admin_prod_001` → 401.
   - `curl -i /api/quickplay/daily-challenge` no auth → 401 (not 500).
   - `curl -i -H "Authorization: Bearer admin_demo_token" /api/subscriptions/...` → 401.
   - `POST /api/auth/setup` with JWT_SECRET as key → 401.
   - Valid login → real JWT works across chat, library, battles, essays, progress.

## Out of scope

- **Refresh tokens** — future work. 24h access tokens + per-request status re-check mitigate the 7-day frozen-role problem; a refresh-token flow is a separate phase.
- **Frontend demo fallback removal** — Phase 4. This phase kills the BACKEND side; the frontend demo-mode UI will get 401s on demo tokens until Phase 4 lands (acceptable — demo accounts still work via real login).
- **`/auth/register` role whitelist** — FOLDED IN (Task 13), small and same blast radius as the OAuth fix.
- **Demo-data isolation machinery** (`getDemoDataFlags`, `isDemoUserId`, cron cleanup, `demoUtils.ts`, `/auth/reset-demo-passwords`) — untouched here; reviewed in the demo-cleanup phase. Note `demoUtils.ts` duplicates the demo email/ID lists from index.ts — consolidation deferred.
- **Payments webhooks / Paystack signature verification** — separate audit finding, separate phase.
- **Rate limiting on all remaining public endpoints** — only `/auth/setup` gets a new bucket here; broader rate-limit coverage is its own phase.
