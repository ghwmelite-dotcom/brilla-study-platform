# Telegram Community Notifications — Implementation Plan

> **Sub-skill:** execute with `superpowers:subagent-driven-development` — each task below is a self-contained unit with verifiable gates; run tasks in order, checkpoint after each.

**Design source:** `C:/Users/USER/.gstack/projects/ghwmelite-dotcom-brilla-study-platform/ozzy-main-design-20260812-telegram-v2.md` (approved v2). Where this plan deviates from the design doc, the deviation is called out inline and summarized at the end.

## Goal

Ship Telegram as the platform's external notification + community channel: a verified link-token handshake that awards 100 pts once, an unauthenticated-but-secret-validated bot webhook, fire-and-forget outbound helpers (user DM / school channel / platform channel) with stale/broken lifecycle handling, cron-driven race + streak alerts with dedup, and the Settings connect card, race-tab community banner, and admin school-channel field.

## Architecture

- **Migration 091** adds `telegram_links`, `telegram_link_tokens`, `school_channels`, `race_alert_state`; rebuilds `points_ledger` to extend the `source` CHECK with `notification_subscribe`; adds announcement-dedup columns on `race_cycles` (plan addition — see Task 1).
- **`workers/api/telegram.ts`** (new): Bot API client, token mint/verify, webhook Hono app (mounted at `/api/telegram`, no `requireAuth`, secret-token header check), outbound notifier helpers.
- **`workers/api/notifications.ts`** (extend): authed link/status/community endpoints under `/api/notifications/telegram/*` (inherits the router's `requireAuth('*')`).
- **`workers/api/race-alerts.ts`** (new): `runTelegramRaceAlerts(db, env)` called from the existing 6-hourly cron via `ctx.waitUntil` — cycle-start/winner channel posts, position-passed/ending-soon/streak-rescue DMs.
- **`workers/api/index.ts`**: mount webhook app, wire cron alerts, extend admin schools list + add `PUT /admin/schools/:id/channel`.
- **Frontend**: `src/pages/Settings.tsx` connect card (notifications tab), `src/pages/Leaderboard.tsx` race-tab banner, `src/pages/admin/AdminSchools.tsx` channel field.

## Tech Stack

Existing only — Hono on Cloudflare Workers, D1 (SQLite), vitest + `workers/api/__tests__/helpers/mockD1.ts`, React + `@/lib/api` `api.get/post`. No new dependencies. Telegram Bot API via plain `fetch`.

## Global Constraints

- Every task lists a **verifiable command + expected output**. Run it before marking the task done.
- **Commits approved** (one per task is fine; do not push).
- **Gates** (must all hold at every task boundary, re-checked fully in Task 7):
  - `npx vitest run` — all pass.
  - `npm run build` — green (`tsc -b && vite build`).
  - `npx tsc -p workers/tsconfig.json 2>&1 | grep -c "error TS"` — **≤ 130** (current baseline is exactly 130; do not increase).
  - `npm run db:verify` — **18 checks clean** (current baseline 18/18; new tables add no checks).
  - `node scripts/build-canonical-schema.cjs > database/schema.sql.new && diff database/schema.sql database/schema.sql.new` — byte-stable (after Task 1 folds 091 in, regenerate and commit the new schema.sql; thereafter stable).
  - **No `wrangler --remote` / prod mutation in any task** — all prod steps live in `## Prod Apply Runbook` and are user-gated.
- **Telegram calls are fire-and-forget**: every outbound path catches and logs; a Telegram outage must never throw into a user request or fail the cron. Cron "success" no longer implies delivery success (semantics change) — log delivery failures loudly.
- Migration 091 is **DDL-only** (plus one `INSERT ... SELECT` table-copy): it is NOT added to `scripts/build-seed.cjs` `LIVE_REPLAY_FILES` (verified: that list is only for data mutations 088/088a; 090 is likewise absent).

---

## Task 1 — Migration 091 + canonical fold-in + points enum

**Files:**
- `database/migrations/091_telegram_community.sql` (new)
- `scripts/build-canonical-schema.cjs` (add to `LIVE_DDL_FILES`, line 44)
- `database/schema.sql` (regenerated, committed)
- `workers/api/points.ts` (PointSource / SOURCE_WEIGHTS / HOUSE_SOURCE_MAP)

**Interfaces (relied on by later tasks):**
- Tables: `telegram_links(user_id PK, chat_id TEXT UNIQUE NOT NULL, username TEXT, linked_at, stale INTEGER DEFAULT 0)`; `telegram_link_tokens(token TEXT PK, user_id NOT NULL, expires_at NOT NULL, used_at)`; `school_channels(school_id PK REFERENCES schools, channel_id NOT NULL, channel_name, broken INTEGER DEFAULT 0)`; `race_alert_state(user_id, cycle_id, last_rank, last_score, alerted_flags INTEGER DEFAULT 0, PRIMARY KEY(user_id, cycle_id))`.
- `race_cycles` gains `start_announced_at TEXT` and `winner_announced_at TEXT` (**plan addition**: design doc lists no channel-post dedup state; `race_alert_state` is per-user and cannot dedup channel posts. These two nullable columns make cron reruns idempotent).
- `points_ledger.source` CHECK extended with `'notification_subscribe'`.
- `workers/api/points.ts`: `PointSource` union gains `'notification_subscribe'`; `SOURCE_WEIGHTS.notification_subscribe = 1`; `HOUSE_SOURCE_MAP.notification_subscribe = 'bonus'`; no entry in `DAILY_SOURCE_CAPS` (one-time award, uncapped).

**Steps:**

- [ ] Write `database/migrations/091_telegram_community.sql`. Load-bearing content (the `points_ledger` rebuild — SQLite cannot ALTER a CHECK, so create-copy-drop-rename):

```sql
-- 091_telegram_community.sql — Telegram community notifications + connect points

CREATE TABLE IF NOT EXISTS telegram_links (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    chat_id TEXT NOT NULL UNIQUE,
    username TEXT,
    linked_at TEXT NOT NULL DEFAULT (datetime('now')),
    stale INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS telegram_link_tokens (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL,
    used_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS school_channels (
    school_id TEXT PRIMARY KEY REFERENCES schools(id) ON DELETE CASCADE,
    channel_id TEXT NOT NULL,
    channel_name TEXT,
    broken INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS race_alert_state (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cycle_id TEXT NOT NULL REFERENCES race_cycles(id) ON DELETE CASCADE,
    last_rank INTEGER,
    last_score INTEGER,
    alerted_flags INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, cycle_id)
);

-- Channel-post dedup (one post per event even if cron reruns).
ALTER TABLE race_cycles ADD COLUMN start_announced_at TEXT;
ALTER TABLE race_cycles ADD COLUMN winner_announced_at TEXT;

-- points_ledger CHECK rebuild: SQLite cannot ALTER a CHECK constraint.
-- IMPORTANT: DROP TABLE also drops idx_points_ledger_user_day and
-- idx_points_ledger_cycle (both in real SQLite AND in the canonical
-- generator's drop simulation) — they MUST be recreated below.
CREATE TABLE points_ledger_new (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    source TEXT NOT NULL CHECK (source IN (
        'question_correct', 'battle_win', 'streak_day', 'quest_claim',
        'tutor_session', 'essay_graded', 'referral_signup',
        'referral_paid_conversion', 'house_contribution',
        'notification_subscribe'
    )),
    source_ref TEXT,
    cycle_id TEXT REFERENCES race_cycles(id),
    is_demo_data INTEGER DEFAULT 0,
    expires_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

INSERT INTO points_ledger_new (id, user_id, points, source, source_ref, cycle_id, is_demo_data, expires_at, created_at)
    SELECT id, user_id, points, source, source_ref, cycle_id, is_demo_data, expires_at, created_at FROM points_ledger;

DROP TABLE points_ledger;
ALTER TABLE points_ledger_new RENAME TO points_ledger;

CREATE INDEX IF NOT EXISTS idx_points_ledger_user_day ON points_ledger(user_id, source, created_at);
CREATE INDEX IF NOT EXISTS idx_points_ledger_cycle ON points_ledger(cycle_id);
CREATE INDEX IF NOT EXISTS idx_telegram_link_tokens_user ON telegram_link_tokens(user_id, used_at);
CREATE INDEX IF NOT EXISTS idx_race_alert_state_cycle ON race_alert_state(cycle_id);
```

  (Temp table is named `points_ledger_new`, deliberately avoiding the generator's scratch regex `/(_backup|_v2|_old|_tmp)$/i`; the RENAME removes it from the final table set anyway. The `INSERT ... SELECT` is a data statement — the generator ignores it, which is correct.)

- [ ] `scripts/build-canonical-schema.cjs` line 44: `const LIVE_DDL_FILES = ['090_growth_loop.sql', '091_telegram_community.sql'];`
- [ ] Regenerate: `node scripts/build-canonical-schema.cjs > database/schema.sql.new` — inspect stderr diagnostics: expect `DROPs: points_ledger`, `RENAMEs: points_ledger_new -> points_ledger`, no new MISSING tables, parity + 178-count checks pass. Then `mv database/schema.sql.new database/schema.sql`.
- [ ] Verify the regenerated `database/schema.sql` contains `'notification_subscribe'` in the points_ledger CHECK AND still contains both `idx_points_ledger_user_day` and `idx_points_ledger_cycle` (this is the regression the rebuild can silently introduce).
- [ ] `workers/api/points.ts`: extend the three structures (lines 3-6 union, `SOURCE_WEIGHTS` line 10, `HOUSE_SOURCE_MAP` line 29 — note `HOUSE_SOURCE_MAP` is module-private, not exported; no export change needed):

```ts
export type PointSource =
  | 'question_correct' | 'battle_win' | 'streak_day' | 'quest_claim'
  | 'tutor_session' | 'essay_graded'
  | 'referral_signup' | 'referral_paid_conversion' | 'house_contribution'
  | 'notification_subscribe';
// SOURCE_WEIGHTS += notification_subscribe: 1,
// HOUSE_SOURCE_MAP += notification_subscribe: 'bonus',
```

- [ ] Apply 091 locally to prove it runs on a populated DB: `node -e "const{DatabaseSync}=require('node:sqlite');const fs=require('fs');const db=new DatabaseSync(':memory:');db.exec(fs.readFileSync('database/schema.sql','utf8'));db.exec(fs.readFileSync('database/migrations/091_telegram_community.sql','utf8'));console.log('091 applies cleanly:',db.prepare(\"SELECT name FROM sqlite_master WHERE name IN ('telegram_links','telegram_link_tokens','school_channels','race_alert_state')\").all().length===4)"` — expected: `091 applies cleanly: true`.
- [ ] Verify command: `npm run db:verify` → `✅ db:verify PASSED — 18 checks clean`; generator diff byte-stable on second run; `npx vitest run workers/api/__tests__/points.test.ts` → pass; commit.

---

## Task 2 — Telegram core module: bot client + webhook + token handshake + link/status endpoints (TDD)

**Files:**
- `workers/api/telegram.ts` (new)
- `workers/api/notifications.ts` (extend — 3 authed endpoints)
- `workers/api/index.ts` (mount webhook app before `protectedApp`, near line 10825)
- `workers/api/__tests__/telegram.test.ts` (new)

**Interfaces (relied on by later tasks):**

```ts
// workers/api/telegram.ts
export interface TelegramEnv {
  DB: D1Database;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_WEBHOOK_SECRET?: string;
  TELEGRAM_PLATFORM_CHANNEL_ID?: string;
  TELEGRAM_COMMUNITY_URL?: string;
  TELEGRAM_BOT_USERNAME?: string; // plan addition: needed to build t.me/<bot>?start= links
}
export const telegramWebhookApp: Hono;              // POST /webhook — NO requireAuth
export async function telegramApi(env, method: string, payload: unknown): Promise<{ ok: boolean; status?: number; result?: unknown }>;
export function mintLinkToken(): string;            // [A-Za-z0-9_-]{22}
export const CONNECT_POINTS = 100;
export const LINK_TOKEN_TTL_MS = 10 * 60 * 1000;
```

Endpoints (envelopes follow the house style `{ success, data }` / `{ success, error }`):
- `POST /api/telegram/webhook` — unauthenticated, header-validated. Always 200 to Telegram after secret check (prevents redelivery storms); 401 on bad secret.
- `POST /api/notifications/telegram/link` (authed, in `notifications.ts`) → `{ success: true, data: { startUrl: 'https://t.me/<bot>?start=<token>', expiresAt } }`. 503 if `TELEGRAM_BOT_USERNAME` unset.
- `GET /api/notifications/telegram/status` (authed) → `{ success: true, data: { linked: boolean, username: string | null, stale: boolean } }`.
- `GET /api/notifications/telegram/community` (authed) → `{ success: true, data: { url: string | null } }` from `TELEGRAM_COMMUNITY_URL`.

**Steps (TDD — write `telegram.test.ts` first, watch fail, then implement):**

- [ ] Test cases (mock D1 via `createMockD1`, stub bot API via `vi.stubGlobal('fetch', ...)`):
  (a) webhook 401 when `X-Telegram-Bot-Api-Secret-Token` missing/wrong; 200 when correct.
  (b) `/start <valid-token>`: token row exists + unexpired + unused → guarded `UPDATE ... SET used_at ... WHERE used_at IS NULL` returns `meta.changes = 1` → `INSERT ... ON CONFLICT(user_id) DO UPDATE` on telegram_links → `awardPoints` called with `source: 'notification_subscribe', points: 100` (assert the `INSERT INTO points_ledger` SQL + binds) → confirmation `sendMessage` fetch fired.
  (c) replayed `/start` (guarded update `meta.changes = 0`) → no second award, still 200 + "already verified" reply.
  (d) expired token → polite failure reply, no award.
  (e) `chat_id` already held by a DIFFERENT user (SELECT on telegram_links by chat_id returns another user_id) → no upsert, no award, reply says the Telegram account is already linked.
  (f) relink same user (existing telegram_links row for user_id) → upsert refreshes `chat_id/username/stale=0`, NO second award (award gated on "no prior row for user").
  (g) `POST /notifications/telegram/link` 401 without JWT (inherits `requireAuth('*')` — follow the pattern in `notifications-auth.test.ts`); with JWT → mints `/^[A-Za-z0-9_-]{22}$/` token, persists with ~10-min expiry, returns `startUrl` containing `?start=<token>`.
  (h) `status` → `{linked:false}` without row; `{linked:true, stale:true}` with stale row. `community` → `{url:null}` when var unset.
- [ ] Implement `workers/api/telegram.ts`. Load-bearing pieces:

```ts
import { Hono } from 'hono';
import { constantTimeEqual } from './auth-middleware';
import { awardPoints } from './points';

export const CONNECT_POINTS = 100;
export const LINK_TOKEN_TTL_MS = 10 * 60 * 1000;
const TOKEN_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

export function mintLinkToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(22));
  return [...bytes].map((b) => TOKEN_ALPHABET[b % 64]).join('');
}

export async function telegramApi(env: TelegramEnv, method: string, payload: unknown) {
  if (!env.TELEGRAM_BOT_TOKEN) return { ok: false };
  try {
    const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return { ok: res.ok, status: res.status, result: await res.json().catch(() => null) };
  } catch (e) {
    console.error(`telegramApi ${method} failed:`, e);
    return { ok: false };
  }
}

export const telegramWebhookApp = new Hono<{ Bindings: TelegramEnv }>();

telegramWebhookApp.post('/webhook', async (c) => {
  const secret = c.req.header('X-Telegram-Bot-Api-Secret-Token') ?? '';
  if (!c.env.TELEGRAM_WEBHOOK_SECRET || !constantTimeEqual(secret, c.env.TELEGRAM_WEBHOOK_SECRET)) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }
  const update = await c.req.json().catch(() => null);
  const msg = update?.message;
  const text: string = msg?.text ?? '';
  const chatId = msg?.chat?.id != null ? String(msg.chat.id) : null;
  if (!msg || !chatId || !text.startsWith('/start')) return c.json({ ok: true });

  const token = text.slice(6).trim();
  const reply = (t: string) => telegramApi(c.env, 'sendMessage', { chat_id: chatId, text: t });
  if (!/^[A-Za-z0-9_-]{22}$/.test(token)) {
    await reply('Invalid link code. Generate a new one from Settings → Notifications in BrillaPrep.');
    return c.json({ ok: true });
  }

  const db = c.env.DB;
  const row = await db.prepare(
    'SELECT token, user_id, expires_at, used_at FROM telegram_link_tokens WHERE token = ?'
  ).bind(token).first<{ user_id: string; expires_at: string; used_at: string | null }>();

  const expired = !row || new Date(row.expires_at) < new Date();
  if (expired) { await reply('That link code expired. Generate a new one in Settings.'); return c.json({ ok: true }); }

  // Idempotent consume: Telegram redelivers webhooks at least once. Only the
  // first delivery flips used_at (meta.changes === 1).
  const consumed = await db.prepare(
    'UPDATE telegram_link_tokens SET used_at = datetime(\'now\') WHERE token = ? AND used_at IS NULL'
  ).bind(token).run();
  if (consumed.meta.changes === 0) {
    await reply('This link code was already used. Your Telegram is connected ✅');
    return c.json({ ok: true });
  }

  // chat_id UNIQUE: one Telegram account can only ever earn connect points once.
  const holder = await db.prepare('SELECT user_id FROM telegram_links WHERE chat_id = ?')
    .bind(chatId).first<{ user_id: string }>();
  if (holder && holder.user_id !== row.user_id) {
    await reply('This Telegram account is already linked to a different BrillaPrep account.');
    return c.json({ ok: true });
  }

  const existing = await db.prepare('SELECT user_id FROM telegram_links WHERE user_id = ?')
    .bind(row.user_id).first();
  await db.prepare(`
    INSERT INTO telegram_links (user_id, chat_id, username, linked_at, stale)
    VALUES (?, ?, ?, datetime('now'), 0)
    ON CONFLICT(user_id) DO UPDATE SET chat_id = excluded.chat_id,
      username = excluded.username, linked_at = excluded.linked_at, stale = 0
  `).bind(row.user_id, chatId, msg.from?.username ?? null).run();

  if (!existing) {
    await awardPoints(db, {
      userId: row.user_id,
      points: CONNECT_POINTS,
      source: 'notification_subscribe',
      sourceRef: chatId,
    });
    await reply(`Connected! +${CONNECT_POINTS} XP added to your race score 🎉`);
  } else {
    await reply('Telegram reconnected ✅');
  }
  return c.json({ ok: true });
});
```

- [ ] `notifications.ts`: add the three endpoints (router already has `requireAuth('*')` at line 18 — do NOT add the webhook here). `link` handler core:

```ts
notificationsApp.post('/telegram/link', async (c) => {
  const userId = c.get('userId')!;
  if (!c.env.TELEGRAM_BOT_USERNAME) {
    return c.json({ success: false, error: 'Telegram linking is not configured' }, 503);
  }
  const token = mintLinkToken();
  const expiresAt = new Date(Date.now() + LINK_TOKEN_TTL_MS).toISOString();
  await c.env.DB.prepare(
    'INSERT INTO telegram_link_tokens (token, user_id, expires_at) VALUES (?, ?, ?)'
  ).bind(token, userId, expiresAt).run();
  return c.json({
    success: true,
    data: { startUrl: `https://t.me/${c.env.TELEGRAM_BOT_USERNAME}?start=${token}`, expiresAt },
  });
});
```

  (`notifications.ts`'s `Env` interface gains the optional `TELEGRAM_*` keys — extend its local `Env`, or import `TelegramEnv`.)
- [ ] `index.ts`: `import { telegramWebhookApp } from './telegram';` and `app.route('/api/telegram', telegramWebhookApp);` immediately after the `raceApp` mount (line 10825), before `protectedApp`. Add a comment: webhook is deliberately unauthenticated; guarded by `TELEGRAM_WEBHOOK_SECRET`.
- [ ] Verify: `npx vitest run workers/api/__tests__/telegram.test.ts workers/api/__tests__/notifications-auth.test.ts workers/api/__tests__/route-shadowing.test.ts` → all pass; full `npx vitest run` → pass; `npx tsc -p workers/tsconfig.json` error count ≤ 130; commit.

---

## Task 3 — Outbound notifier helpers + stale/broken lifecycle

**Files:**
- `workers/api/telegram.ts` (extend)
- `workers/api/__tests__/telegram-notify.test.ts` (new)

**Interfaces (relied on by Task 4):**

```ts
// workers/api/telegram.ts
export const NOTIFY_DM_LIMIT: RateLimitConfig = { maxRequests: 3, windowMs: 24 * 60 * 60 * 1000 };
export async function notifyUser(db: D1Database, env: TelegramEnv, userId: string, text: string): Promise<boolean>;
export async function notifySchoolChannel(db: D1Database, env: TelegramEnv, schoolId: string, text: string): Promise<boolean>;
export async function notifyPlatformChannel(env: TelegramEnv, text: string): Promise<boolean>;
```

Semantics: all three NEVER throw (catch + `console.error`); return whether a message was actually sent. `notifyUser` no-ops (false) when unlinked or `stale = 1`. Rate limit uses the existing custom-config path: `checkRateLimit(db, userId, 'notify', NOTIFY_DM_LIMIT)` — the call itself records the send when allowed (rate-limit.ts lines 76-161), so one call = check + consume.

**Steps (TDD):**

- [ ] Tests (`telegram-notify.test.ts`, same mockD1 + fetch-stub pattern):
  (a) `notifyUser` unlinked → false, no fetch. (b) linked → fetch `sendMessage` to the stored chat_id, true, and a `rate_limits` insert/update for endpoint `'notify'` was recorded. (c) 4th DM in 24h (rate_limits sum = 3) → false, no fetch. (d) fetch returns 403 → `UPDATE telegram_links SET stale = 1`, false. (e) `notifySchoolChannel` 400/403 → `UPDATE school_channels SET broken = 1` AND `createNotification` INSERT for each admin user with link `/admin/schools`. (f) `notifyPlatformChannel` with unset var → false, no fetch; fetch throws → false, no throw.
- [ ] Implement in `telegram.ts`:

```ts
import { checkRateLimit, type RateLimitConfig } from './rate-limit';
import { createNotification } from './notifications';

export const NOTIFY_DM_LIMIT: RateLimitConfig = { maxRequests: 3, windowMs: 24 * 60 * 60 * 1000 };

export async function notifyUser(db: D1Database, env: TelegramEnv, userId: string, text: string): Promise<boolean> {
  try {
    const link = await db.prepare('SELECT chat_id FROM telegram_links WHERE user_id = ? AND stale = 0')
      .bind(userId).first<{ chat_id: string }>();
    if (!link) return false;
    const budget = await checkRateLimit(db, userId, 'notify', NOTIFY_DM_LIMIT);
    if (!budget.allowed) return false;
    const res = await telegramApi(env, 'sendMessage', { chat_id: link.chat_id, text });
    if (!res.ok) {
      if (res.status === 403) {
        await db.prepare('UPDATE telegram_links SET stale = 1 WHERE user_id = ?').bind(userId).run();
        console.error(`notifyUser: user ${userId} blocked the bot — marked stale`);
      } else {
        console.error(`notifyUser: sendMessage failed for ${userId} (status ${res.status})`);
      }
      return false;
    }
    return true;
  } catch (e) { console.error('notifyUser failed:', e); return false; }
}

export async function notifySchoolChannel(db: D1Database, env: TelegramEnv, schoolId: string, text: string): Promise<boolean> {
  try {
    const ch = await db.prepare('SELECT channel_id FROM school_channels WHERE school_id = ? AND broken = 0')
      .bind(schoolId).first<{ channel_id: string }>();
    if (!ch) return false;
    const res = await telegramApi(env, 'sendMessage', { chat_id: ch.channel_id, text });
    if (!res.ok) {
      if (res.status === 400 || res.status === 403) {
        await db.prepare('UPDATE school_channels SET broken = 1 WHERE school_id = ?').bind(schoolId).run();
        const admins = await db.prepare("SELECT id FROM users WHERE role = 'admin' AND is_active = 1")
          .bind().all<{ id: string }>();
        for (const a of admins.results) {
          await createNotification(db, a.id, 'system', 'Telegram school channel broken',
            `The Telegram channel for school ${schoolId} rejected a post. Re-add the bot as admin, then re-save the channel.`, // see Task 6
            { icon: 'alert-triangle', link: '/admin/schools' });
        }
      }
      console.error(`notifySchoolChannel: post failed for ${schoolId} (status ${res.status})`);
      return false;
    }
    return true;
  } catch (e) { console.error('notifySchoolChannel failed:', e); return false; }
}

export async function notifyPlatformChannel(env: TelegramEnv, text: string): Promise<boolean> {
  try {
    if (!env.TELEGRAM_PLATFORM_CHANNEL_ID) return false;
    const res = await telegramApi(env, 'sendMessage', { chat_id: env.TELEGRAM_PLATFORM_CHANNEL_ID, text });
    if (!res.ok) console.error(`notifyPlatformChannel: post failed (status ${res.status})`);
    return res.ok;
  } catch (e) { console.error('notifyPlatformChannel failed:', e); return false; }
}
```

  Callers (Task 4 / cron) wrap fan-out in `ctx.waitUntil`; the helpers themselves stay sync-awaitable for tests.
- [ ] Verify: `npx vitest run workers/api/__tests__/telegram-notify.test.ts` → pass; full suite + tsc gates; commit.

---

## Task 4 — Cron alert wiring (cycle start / winner / position / ending-soon / streak-rescue)

**Files:**
- `workers/api/race-alerts.ts` (new)
- `workers/api/index.ts` (scheduled handler, lines 10884-10890)
- `workers/api/__tests__/race-alerts.test.ts` (new)

**Interfaces:**

```ts
// workers/api/race-alerts.ts
export const ALERT_FLAG_POSITION_PASSED = 1;
export const ALERT_FLAG_ENDING_SOON = 2;
export const STREAK_RESCUE_LIMIT: RateLimitConfig = { maxRequests: 1, windowMs: 24 * 60 * 60 * 1000 }; // 'notify-streak' endpoint bucket
export async function runTelegramRaceAlerts(db: D1Database, env: TelegramEnv, now?: Date): Promise<{ posts: number; dms: number }>;
```

`runRaceCycleMaintenance` signature is UNTOUCHED (returns `{opened, crowned}`; race.test.ts keeps passing). Alert state is recovered by query: crowning/opening happened in the same cron pass, and dedup columns/flags make reruns safe.

**Steps (TDD):**

- [ ] Tests: (a) newly crowned platform cycle with `winner_announced_at IS NULL` → platform channel post names winner when `getChatMember` fetch ok; sets `winner_announced_at`; second run → no post. (b) winner NOT a channel member (`getChatMember` 400) → channel post omits the name, winner gets DM "join the channel to see your win announced". (c) school-scoped crowned cycle with `school_channels` row → school channel post; without row → skipped. (d) cycle opened in the window with `start_announced_at IS NULL` → start post; set. (e) position-passed: `race_alert_state.last_rank = 3`, current rank 5 → DM + flags |= 1; already flagged → no DM. (f) ending-soon: `ends_at` within 12h, flag unset → DM + flag. (g) streak-rescue: `users.streak_days > 0 AND streak_last_activity < now-22h`, linked → DM gated by both `checkRateLimit(db, userId, 'notify', NOTIFY_DM_LIMIT)` and `checkRateLimit(db, userId, 'notify-streak', STREAK_RESCUE_LIMIT)`. (h) Telegram fetch throws everywhere → function still resolves, returns counts of 0, logs.
- [ ] Implement `race-alerts.ts`. Load-bearing structure:

```ts
import { notifyUser, notifySchoolChannel, notifyPlatformChannel, telegramApi, type TelegramEnv } from './telegram';
import { checkRateLimit, type RateLimitConfig } from './rate-limit';

export const ALERT_FLAG_POSITION_PASSED = 1;
export const ALERT_FLAG_ENDING_SOON = 2;
export const STREAK_RESCUE_LIMIT: RateLimitConfig = { maxRequests: 1, windowMs: 24 * 60 * 60 * 1000 };

export async function runTelegramRaceAlerts(db: D1Database, env: TelegramEnv, now = new Date()) {
  let posts = 0, dms = 0;
  // 1. Winner announcements (crowned since last cron pass; 6h cron → 7h lookback).
  const crowned = await db.prepare(`
    SELECT rc.id, rc.scope, rc.school_id, u.name AS winner_name, rc.winner_user_id
    FROM race_cycles rc LEFT JOIN users u ON u.id = rc.winner_user_id
    WHERE rc.status = 'crowned' AND rc.winner_announced_at IS NULL
      AND rc.crowned_at >= datetime('now', '-7 hours')
  `).bind().all<{ id: string; scope: string; school_id: string | null; winner_name: string | null; winner_user_id: string | null }>();

  for (const cy of crowned.results) {
    let named = false;
    if (cy.winner_user_id && env.TELEGRAM_PLATFORM_CHANNEL_ID) {
      const link = await db.prepare('SELECT chat_id FROM telegram_links WHERE user_id = ? AND stale = 0')
        .bind(cy.winner_user_id).first<{ chat_id: string }>();
      if (link) {
        const member = await telegramApi(env, 'getChatMember', {
          chat_id: env.TELEGRAM_PLATFORM_CHANNEL_ID, user_id: link.chat_id,
        });
        named = member.ok;
        if (!named) {
          if (await notifyUser(db, env, cy.winner_user_id,
            '🏆 You won the weekly race! Join the BrillaPrep community channel to see your win announced.')) dms++;
        }
      }
    }
    const text = named && cy.winner_name
      ? `🏆 This week's race winner: ${cy.winner_name}! Congratulations!`
      : `🏆 This week's race has a winner! Check the leaderboard on BrillaPrep.`;
    const sent = cy.scope === 'school' && cy.school_id
      ? await notifySchoolChannel(db, env, cy.school_id, text)
      : await notifyPlatformChannel(env, text);
    if (sent) posts++;
    // Mark announced regardless of send outcome: a Telegram outage must not
    // cause a catch-up storm of stale winner posts on the next pass.
    await db.prepare("UPDATE race_cycles SET winner_announced_at = datetime('now') WHERE id = ?").bind(cy.id).run();
  }

  // 2. Cycle-start posts (same lookback pattern on created_at + start_announced_at).
  // 3. Position-passed / ending-soon DMs per active cycle: compute ranks
  //    (reuse the SCORE_FROM ranking query shape from race.ts /current),
  //    upsert race_alert_state with INSERT ... ON CONFLICT(user_id, cycle_id),
  //    DM only when a flag bit flips from 0.
  // 4. Streak rescue:
  const atRisk = await db.prepare(`
    SELECT u.id, u.streak_days FROM users u
    JOIN telegram_links tl ON tl.user_id = u.id AND tl.stale = 0
    WHERE u.streak_days > 0 AND u.status = 'approved'
      AND datetime(u.streak_last_activity) < datetime('now', '-22 hours')
  `).bind().all<{ id: string; streak_days: number }>();
  for (const u of atRisk.results) {
    const once = await checkRateLimit(db, u.id, 'notify-streak', STREAK_RESCUE_LIMIT);
    if (!once.allowed) continue;
    if (await notifyUser(db, env, u.id, `🔥 Your ${u.streak_days}-day streak is about to expire — answer one question to save it!`)) dms++;
  }
  return { posts, dms };
}
```

  (Fill in sections 2-3 following the same query-then-flag-then-send pattern; every send awaited inside the function, the whole call is wrapped in `ctx.waitUntil` by the cron.)
- [ ] `index.ts` scheduled handler — after the race maintenance block (line 10890), add:

```ts
    // Telegram community alerts: fire-and-forget. Cron "success" no longer
    // implies delivery success — failures log loudly but never fail the cron.
    ctx.waitUntil(
      runTelegramRaceAlerts(env.DB, env)
        .then((r) => console.log(`Telegram alerts: ${r.posts} posts, ${r.dms} DMs`))
        .catch((e) => console.error('Telegram race alerts failed:', e))
    );
```

  (`Env` in index.ts gains the optional `TELEGRAM_*` keys.)
- [ ] Verify: `npx vitest run workers/api/__tests__/race-alerts.test.ts workers/api/__tests__/race.test.ts` → pass; full gates; commit.

---

## Task 5 — Frontend: Settings connect card + race-tab community banner

**Files:**
- `src/pages/Settings.tsx` (notifications tab, around line 792)
- `src/pages/Leaderboard.tsx` (`RacePanel`, line 289)

**Interfaces (from Task 2):** `POST /api/notifications/telegram/link` → `{ startUrl, expiresAt }`; `GET /api/notifications/telegram/status` → `{ linked, username, stale }`; `GET /api/notifications/telegram/community` → `{ url }`.

**Steps:**

- [ ] `Settings.tsx`: in the `notifications` tab, above "Notification Preferences", add a "Connect Telegram" card. State: `const [tg, setTg] = useState<{ linked: boolean; username: string | null; stale: boolean } | null>(null)`; on tab activate, `api.get<{ linked: boolean; username: string | null; stale: boolean }>('/notifications/telegram/status')`. Three render states:
  - not linked → "Connect Telegram" button + "Get 100 XP and race alerts on Telegram" note; onClick: `api.post('/notifications/telegram/link')` then `window.open(res.data.startUrl, '_blank')`; poll status once after 15s (`setTimeout` + refetch) to pick up the completed handshake.
  - linked & !stale → "Connected as @username" with a subtle re-link link.
  - stale → warning state "Telegram disconnected — reconnect" (same connect flow).
  Match existing card styling (`bg-white rounded-2xl border border-neutral-200`, same toggle-row paddings already used at lines 810-860). Reuse the existing `api` import (line 26). Use `Send` or `MessageCircle` from lucide-react for the icon.
- [ ] `Leaderboard.tsx` `RacePanel`: above the "Target Progress" card (line 342), fetch `api.get<{ url: string | null }>('/notifications/telegram/community')` once on mount; when `url` is non-null render a banner: "Join the BrillaPrep community channel — winners announced there every week" with an `<a href={url} target="_blank" rel="noreferrer">` join button. Indigo gradient chip style consistent with the rank chip (lines 370-392). Render nothing when `url` is null or the call errors.
- [ ] Verify: `npm run build` → green (includes `tsc -b`); manual smoke optional (`npm run dev`); commit.

---

## Task 6 — Admin: school Telegram channel field

**Files:**
- `workers/api/index.ts` (`adminApp` schools routes, lines 7661-7737)
- `src/pages/admin/AdminSchools.tsx`
- `workers/api/__tests__/admin-schools.test.ts` (extend)

**Interfaces:**
- `GET /api/admin/schools` rows gain `telegramChannelId: string | null`, `telegramChannelName: string | null`, `telegramChannelBroken: boolean` (LEFT JOIN `school_channels`).
- `PUT /api/admin/schools/:id/channel` (requireAdmin via adminApp) body `{ channelId: string, channelName?: string }` → upsert `school_channels` with `broken = 0` (re-saving after fixing the bot clears the flag); empty `channelId` → DELETE the row. Response `{ success: true, data: { schoolId } }`; 400 on missing/oversized channelId (max 64 chars), 404 on unknown school.

**Steps:**

- [ ] Extend `admin-schools.test.ts`: (a) GET list includes channel fields when a `school_channels` row exists (null otherwise); (b) PUT upserts with `broken = 0`; (c) PUT with empty channelId deletes; (d) PUT 401 without token / 403 student (pattern already in that file); (e) 404 unknown school.
- [ ] Backend: extend the GET query (line 7667) with `LEFT JOIN school_channels sc ON sc.school_id = s.id` selecting `sc.channel_id, sc.channel_name, sc.broken`; map into the row objects. Add the PUT route after `POST /schools` (line 7737), validating school existence first (`SELECT id FROM schools WHERE id = ?`), then `INSERT INTO school_channels (school_id, channel_id, channel_name, broken) VALUES (?, ?, ?, 0) ON CONFLICT(school_id) DO UPDATE SET channel_id = excluded.channel_id, channel_name = excluded.channel_name, broken = 0`.
- [ ] Frontend `AdminSchools.tsx`: extend `SchoolRow` (line 20) with the three fields; add a "Telegram channel" card in the selected-school panel (next to the ambassador card, ~line 426): channel ID + display name inputs, Save button calling `api.put`, and when `telegramChannelBroken` a red "channel broken — re-add bot as admin and re-save" badge. Refetch list after save.
- [ ] Verify: `npx vitest run workers/api/__tests__/admin-schools.test.ts` → pass; `npm run build` green; commit.

---

## Task 7 — Final gate

- [ ] `npx vitest run` → **all pass** (including the 3 new test files).
- [ ] `npm run build` → green.
- [ ] `npx tsc -p workers/tsconfig.json 2>&1 | grep -c "error TS"` → **≤ 130**.
- [ ] `npm run db:verify` → **18 checks clean**.
- [ ] `node scripts/build-canonical-schema.cjs > database/schema.sql.new && diff database/schema.sql database/schema.sql.new` → no diff (byte-stable); `rm database/schema.sql.new`.
- [ ] `node scripts/build-seed.cjs` untouched-by-091 proof: `git diff --stat database/seed.sql` → empty (091 was never added to `LIVE_REPLAY_FILES`).
- [ ] Diff review: no `--remote` commands anywhere; webhook route not under any `requireAuth` router; every Telegram fetch wrapped in try/catch.
- [ ] Final commit.

---

## Prod Apply Runbook (USER-GATED — do not execute from tasks)

1. **Apply 091 to prod D1:**
   `npx wrangler d1 execute brilla-db --remote --file=database/migrations/091_telegram_community.sql`
   (Take a backup first, matching house practice: `backups/` holds the last pre-change dump.)
2. **Bot setup (Telegram app):** BotFather → create bot → token; create the BrillaPrep community channel + St John's channel; add the bot as **admin** in both.
3. **Secrets:** `npx wrangler secret put TELEGRAM_BOT_TOKEN` and `npx wrangler secret put TELEGRAM_WEBHOOK_SECRET` (generate: `openssl rand -hex 32`).
4. **Vars** (`wrangler.toml` `[vars]`, also `[env.dev.vars]` with dev values): `TELEGRAM_PLATFORM_CHANNEL_ID` (e.g. `@brillaprep` or the numeric id), `TELEGRAM_COMMUNITY_URL` (public invite link), `TELEGRAM_BOT_USERNAME` (bot username without `@`). Then deploy the worker.
5. **One-time webhook registration:**
   ```bash
   curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
     -d "url=https://brilla-api.ghwmelite.workers.dev/api/telegram/webhook" \
     -d "secret_token=$TELEGRAM_WEBHOOK_SECRET"
   ```
   Confirm with `getWebhookInfo` (url matches, `pending_update_count` low). The webhook URL must target the **Worker API origin** (`https://brilla-api.ghwmelite.workers.dev` — the value of `VITE_API_URL`), NOT same-origin `brillaprep.org`: the site is a static Pages deploy, so `/api/*` there just returns `index.html` and Telegram updates would be silently dropped.
6. **End-to-end verification:** log in as a test user → Settings → Notifications → Connect Telegram → complete `/start` in Telegram → expect: confirmation DM, +100 XP (`points_ledger` row with `source='notification_subscribe'`), `GET /api/notifications/telegram/status` → `{linked:true, stale:false}`. Then set the St John's channel in /admin/schools and wait for (or force) the next cron pass; check worker logs for the `Telegram alerts:` line.

---

## Verification

- Per-task commands above, re-run as a block in Task 7. The feature-level acceptance checks are the Task 2 webhook handshake tests (b)-(f), Task 3 lifecycle tests (d)-(e), Task 4 dedup tests (a), (e)-(g), and the runbook step 6 end-to-end.

## Out of scope

- WhatsApp transport (transport-swap decision deferred to the student-survey result).
- Parent/tutor DM tracks.
- Scheduled digest posts (daily/weekly summaries).
- Channel moderation tooling (admin bot commands, spam control).

---

## Design-doc deviations found during codebase verification

1. **Channel-post dedup state missing from design.** `race_alert_state` is per-(user, cycle) and cannot dedup platform/school channel posts. Plan adds `race_cycles.start_announced_at` / `winner_announced_at` via two ALTERs in 091.
2. **`TELEGRAM_BOT_USERNAME` var not in the design's dependency list**, but required to build `t.me/<bot>?start=<token>` server-side. Added to vars.
3. **points_ledger index loss risk not mentioned in design.** `DROP TABLE points_ledger` drops `idx_points_ledger_user_day` + `idx_points_ledger_cycle` (true in SQLite and in the canonical generator's drop simulation). 091 explicitly recreates both; Task 1 verifies their presence in the regenerated schema.
4. **Winner-announcement marking**: plan marks `winner_announced_at` even when the send fails (Telegram outage), to avoid a catch-up storm of stale posts — design says "failures log only" but doesn't specify; this is the chosen interpretation.
5. **"Target-hit moments" platform channel post — descoped, never built.** The design called for a platform-channel celebration post when a user crosses the race target. It was not implemented; the shipped channel posts are cycle-start and winner announcements only. Recorded here as an explicit descope. If revisited, the hooks already exist: `awardPoints` stamps target crossings via `maybeRecordCrossing` (`race_crossings` insert + `race_cycles.target_hit_at`, points.ts), so a cron pass could post on fresh `target_hit_at` rows.
6. Everything else verified accurate: `awardPoints` stamps the active cycle (points.ts:106-115); `HOUSE_SOURCE_MAP` maps to house `source` CHECK values but is module-private; cron handler awaits inline and ignores `ctx` (index.ts:10853-10891); `notificationsApp.use('*', requireAuth)` (notifications.ts:18); `checkRateLimit` custom-config path (rate-limit.ts:76-82); `constantTimeEqual` (auth-middleware.ts:123); `LIVE_DDL_FILES = ['090_growth_loop.sql']` (build-canonical-schema.cjs:44); seed replay list excludes DDL-only migrations (build-seed.cjs:652); db:verify = 18 checks; workers tsc baseline = exactly 130 errors.
