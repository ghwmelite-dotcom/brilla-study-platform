# Phase 2 — Money Paths

**Date:** 2026-08-03
**Repo:** `C:/dev/Projects/brilla-study-platform`
**Depends on:** Phase 0 (vitest baseline landed — assumed: `npm test` runs vitest, tests live in `workers/api/__tests__/`; adjust paths below if Phase 0 chose a different convention) and Phase 1 (auth context is trustworthy — `c.get('userId')` is the verified identity).

## Goal

Close the five verified money-path holes from the full-site audit:

1. Paystack webhook processes unsigned events when `PAYSTACK_WEBHOOK_SECRET` is unset (fail-open) — forged `transfer.failed` = affiliate payout double-spend.
2. `GET /payments/verify/:reference` has no ownership check, no idempotency guard (re-verifying re-credits `ai_grading_credits`), and no amount/currency validation.
3. Admin revenue dashboards read `payment_transactions.status = 'completed'` but payments write `'success'` — revenue always reads zero.
4. ISO-8601 timestamps compared with SQLite `datetime('now')` — same-day expiries never trigger (trials, OAuth states, nudges, admin stats).
5. AI endpoints (`/ai/explain`, `/ai/chat`, counselor chat) have no quota — any authenticated user can burn Anthropic credits.

## Architecture

Hono on Cloudflare Workers. Entry `workers/api/index.ts` mounts sub-apps (`paymentsApp` from `workers/api/payments.ts`, `subscriptionsApp`, `oauthApp`, `engagementApp`, `counselorApp`, etc.). D1 SQLite via `c.env.DB` (`wrangler.toml` binding `DB`, migrations in `database/migrations/`). Paystack for payments (initialize/verify/webhook/transfer). Anthropic API (`ANTHROPIC_API_KEY`) for AI endpoints. Existing reusable infrastructure: `checkRateLimit`/`RATE_LIMITS` + `rate_limits` table (migration 024, `workers/api/index.ts:286-424`), `checkCanAnswer`/`daily_usage` pattern (`workers/api/usage-limits.ts`).

## Tech Stack

TypeScript, Hono 4, Cloudflare Workers + D1, Paystack API, Anthropic API, vitest (Phase 0), hono/jwt (already a transitive dep, used by `payments.ts:2`).

## Global Constraints

- **Never process unsigned financial webhooks.** No secret configured = hard-fail, no DB writes.
- **Crediting operations must be idempotent.** Re-deliveries and re-verifications must not re-credit.
- **Minimal diff.** Fix the hole, don't refactor the neighborhood.
- **Every task ends with a verifiable command and expected output.**
- **Commits only with user's explicit approval.** The commit step in each task is gated on that approval.
- Phase 0/1 are assumed landed; do not re-do their work. If a referenced test helper doesn't exist, create it in the task that first needs it and note the deviation.
- Datetime convention (from Task 4 onward, mandatory for all touched code): **store ISO-8601 with `Z` via `new Date().toISOString()`; compare against bound JS ISO parameters; never use `datetime('now')` against ISO-format columns.**

## Verified audit corrections (line drift found while writing this plan)

- Webhook handler is `workers/api/payments.ts:751-835`; fail-open block at **757-766** (exact), `transfer.failed` at **798-824**, HMAC helper at **222-266**.
- Verify endpoint at `payments.ts:435-...`; ownership gap at **445-451** (exact); the re-crediting `UPDATE users ... ai_grading_credits` is at **485-500** (audit said 489-492 — that's just the CASE expression).
- Admin `'completed'` reads confirmed at `index.ts:5968`, `6144-6145`, `6199-6200`. `teacher-bonuses.ts` uses `'success'` at **:514** (audit said 512).
- Admin trial-count datetime bug is at `index.ts:5967` (audit said 5965); a second identical one exists at **`index.ts:6197`** (not in the audit list — included in Task 4).
- Amount validation must compare against **`transaction.amount`** (GHS, already discount-adjusted — see `payments.ts:349-350,374,388`), NOT the plan list price. Paystack returns `amount` in pesewas; compare `result.data.amount / 100` to `transaction.amount`. Comparing to the plan price would break the early-bird discount flow (`payments.ts:355-376`).
- `engagement.ts:195` is the comeback-challenge INSERT (stores ISO at :193); the actual broken comparison is `engagement.ts:91` (nudges). `comeback_challenges.expires_at` is stored ISO but **never compared in SQL** (only returned to the client at :119) — no SQL fix needed there, only data normalization in the migration.
- OAuth also stores ISO states at `oauth.ts:747` (account-link flow); both flows share the single broken read at `oauth.ts:229`.
- No `.dev.vars.example` exists anywhere; `wrangler.toml` has no Paystack secret comments at all (also missing `PAYSTACK_SECRET_KEY`/`PAYSTACK_PUBLIC_KEY`).
- `/ai/explain` (`index.ts:4591`) and `/ai/chat` (`index.ts:4641`) take `userId` from the **request body**, not auth context — quota fix must also switch these to `c.get('userId')` (spoofing fix, enabled by Phase 1).
- `checkRateLimit` fails open on DB error (`index.ts:404-412`). Acceptable for this phase; noted as follow-up.

---

## Task 1 — Webhook fails closed + secret declared

**Files:**
- `workers/api/payments.ts` (edit :756-766)
- `wrangler.toml` (edit comments at :14-18)
- `.dev.vars.example` (new, repo root — wrangler reads `.dev.vars` from the project root)

**Steps:**

- [ ] 1.1 Write the failing test first: `workers/api/__tests__/payments.webhook.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { paymentsApp } from '../payments';

type Query = { sql: string; params: unknown[] };

// Minimal D1 stub: records every query; returns the provided row for first()/all().
function createMockDb(row: Record<string, unknown> | null = null) {
  const queries: Query[] = [];
  const db = {
    prepare(sql: string) {
      return {
        bind(...params: unknown[]) {
          queries.push({ sql, params });
          return {
            first: async () => row,
            all: async () => ({ results: row ? [row] : [] }),
            run: async () => ({ meta: { changes: 1 } }),
          };
        },
      };
    },
  } as unknown as D1Database;
  return { db, queries };
}

async function hmacSha512Hex(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-512' }, false, ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

const baseEnv = {
  JWT_SECRET: 'test-secret',
  PAYSTACK_SECRET_KEY: 'sk_test_x',
  PAYSTACK_PUBLIC_KEY: 'pk_test_x',
  APP_URL: 'https://brillaprep.org',
};

describe('POST /payments/webhook', () => {
  it('refuses to process when PAYSTACK_WEBHOOK_SECRET is unset: 5xx and zero DB writes', async () => {
    const { db, queries } = createMockDb();
    const env = { ...baseEnv, DB: db }; // deliberately no PAYSTACK_WEBHOOK_SECRET
    const body = JSON.stringify({
      event: 'transfer.failed',
      data: { transfer_code: 'TRF_forged', reason: 'forged' },
    });

    const res = await paymentsApp.request('/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-paystack-signature': 'deadbeef' },
      body,
    }, env);

    expect(res.status).toBeGreaterThanOrEqual(500);
    expect(res.status).toBeLessThan(600);
    expect(queries).toHaveLength(0); // no DB write of any kind
  });

  it('rejects a bad signature with 401 and zero DB writes', async () => {
    const { db, queries } = createMockDb();
    const env = { ...baseEnv, DB: db, PAYSTACK_WEBHOOK_SECRET: 'whsec_test' };
    const body = JSON.stringify({ event: 'transfer.failed', data: { transfer_code: 'TRF_x' } });

    const res = await paymentsApp.request('/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-paystack-signature': 'wrong' },
      body,
    }, env);

    expect(res.status).toBe(401);
    expect(queries).toHaveLength(0);
  });

  it('processes a validly-signed transfer.failed and refunds available_earnings', async () => {
    const payout = { id: 'po_1', affiliate_id: 'ap_1', amount: 100, status: 'processing' };
    const { db, queries } = createMockDb(payout);
    const secret = 'whsec_test';
    const env = { ...baseEnv, DB: db, PAYSTACK_WEBHOOK_SECRET: secret };
    const body = JSON.stringify({
      event: 'transfer.failed',
      data: { transfer_code: 'TRF_real', reason: 'Insufficient balance' },
    });
    const signature = await hmacSha512Hex(secret, body);

    const res = await paymentsApp.request('/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-paystack-signature': signature },
      body,
    }, env);

    expect(res.status).toBe(200);
    const refund = queries.find((q) => q.sql.includes('affiliate_profiles') && q.sql.includes('available_earnings'));
    expect(refund).toBeDefined();
    expect(refund!.params).toEqual([100, 'ap_1']);
  });
});
```

- [ ] 1.2 Run it, watch the first test fail (current code processes the forged webhook):
  `npx vitest run workers/api/__tests__/payments.webhook.test.ts`
  Expected: test 1 fails (status 200, queries > 0); tests 2-3 pass.

- [ ] 1.3 Replace the fail-open block at `workers/api/payments.ts:756-766` with fail-closed (keep the existing constant-time HMAC helper at :222-266 untouched):

```ts
    // SECURITY: Never process unsigned financial webhooks.
    // Missing secret is a misconfiguration = hard fail, no processing, no DB writes.
    if (!c.env.PAYSTACK_WEBHOOK_SECRET) {
      console.error('ALERT: PAYSTACK_WEBHOOK_SECRET is not configured — refusing to process webhook');
      return c.json({ success: false, error: 'Webhook not configured' }, 500);
    }

    const isValid = await verifyWebhookSignature(body, signature || '', c.env.PAYSTACK_WEBHOOK_SECRET);
    if (!isValid) {
      console.error('Webhook signature verification failed');
      return c.json({ success: false, error: 'Invalid signature' }, 401);
    }
```

- [ ] 1.4 Add the Paystack secrets to `wrangler.toml` comments (extend the block at :14-18):

```toml
# wrangler secret put PAYSTACK_SECRET_KEY    (Paystack dashboard > Settings > API Keys)
# wrangler secret put PAYSTACK_PUBLIC_KEY    (Paystack dashboard > Settings > API Keys)
# wrangler secret put PAYSTACK_WEBHOOK_SECRET (Paystack dashboard > Settings > API Keys > Webhook secret)
#                                            REQUIRED: /payments/webhook returns 500 and processes nothing without it
```

- [ ] 1.5 Create `.dev.vars.example` at repo root:

```
# Copy to .dev.vars for local dev (never commit .dev.vars)
JWT_SECRET=dev-only-secret-change-me
PAYSTACK_SECRET_KEY=sk_test_xxx
PAYSTACK_PUBLIC_KEY=pk_test_xxx
PAYSTACK_WEBHOOK_SECRET=whsec_xxx
APP_URL=http://localhost:5173
```

- [ ] 1.6 Verification: `npx vitest run workers/api/__tests__/payments.webhook.test.ts`
  Expected: `✓ 3 passed` — including "refuses to process when PAYSTACK_WEBHOOK_SECRET is unset".

- [ ] 1.7 Commit (ONLY with explicit user approval):
  `git add workers/api/payments.ts wrangler.toml .dev.vars.example workers/api/__tests__/payments.webhook.test.ts && git commit -m "fix(payments): fail closed on unsigned Paystack webhooks"`

---

## Task 2 — Verify endpoint: ownership + idempotency + amount validation

**Files:**
- `workers/api/payments.ts` (edit the `/verify/:reference` handler at :435-520)
- `workers/api/__tests__/payments.verify.test.ts` (new)

**Interfaces:** Paystack `verifyTransaction` returns `result.data.amount` in **pesewas**; `payment_transactions.amount` is stored in **GHS**, already discount-adjusted (`payments.ts:388`). Validate `result.data.amount / 100 ≈ transaction.amount` and `result.data.currency === 'GHS'`.

**Steps:**

- [ ] 2.1 Write the failing tests: `workers/api/__tests__/payments.verify.test.ts`

```ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { sign } from 'hono/jwt';
import { paymentsApp } from '../payments';

type Query = { sql: string; params: unknown[] };

// D1 stub routing each query through a handler so different SELECTs return different rows.
function createMockDb(handler: (sql: string, params: unknown[]) => unknown) {
  const queries: Query[] = [];
  const db = {
    prepare(sql: string) {
      return {
        bind(...params: unknown[]) {
          queries.push({ sql, params });
          const value = handler(sql, params);
          return {
            first: async () => value ?? null,
            all: async () => ({ results: Array.isArray(value) ? value : value ? [value] : [] }),
            run: async () => ({ meta: { changes: 1 } }),
          };
        },
      };
    },
  } as unknown as D1Database;
  return { db, queries };
}

const JWT_SECRET = 'test-secret';
const baseEnv = {
  JWT_SECRET,
  PAYSTACK_SECRET_KEY: 'sk_test_x',
  PAYSTACK_PUBLIC_KEY: 'pk_test_x',
  APP_URL: 'https://brillaprep.org',
};

async function authHeader(userId: string) {
  const token = await sign(
    { userId, email: `${userId}@test.dev`, role: 'student', exp: Math.floor(Date.now() / 1000) + 3600 },
    JWT_SECRET,
  );
  return { Authorization: `Bearer ${token}` };
}

// Paystack says: success, GHS 25.00 (= 2500 pesewas)
function stubPaystackVerify(amountPesewas = 2500, currency = 'GHS', status = 'success') {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
    status: true,
    data: { status, amount: amountPesewas, currency, reference: 'SUB_ref_1' },
  }))));
}

afterEach(() => vi.unstubAllGlobals());

const pendingTx = {
  id: 'tx_1', user_id: 'user_1', reference: 'SUB_ref_1',
  amount: 25, currency: 'GHS', plan_id: 'tier_pro', plan_type: 'student',
  billing_cycle: 'monthly', status: 'pending',
};

describe('GET /payments/verify/:reference', () => {
  it('returns 404 when the transaction belongs to a different user (no ownership leak)', async () => {
    stubPaystackVerify();
    const { db, queries } = createMockDb((sql) =>
      sql.includes('FROM payment_transactions') ? pendingTx : null);
    const env = { ...baseEnv, DB: db };

    const res = await paymentsApp.request('/verify/SUB_ref_1', {
      headers: await authHeader('user_ATTACKER'),
    }, env);

    expect(res.status).toBe(404);
    expect(queries.some((q) => q.sql.includes('ai_grading_credits'))).toBe(false);
  });

  it('does not re-credit ai_grading_credits when transaction is already success', async () => {
    stubPaystackVerify();
    const { db, queries } = createMockDb((sql) =>
      sql.includes('FROM payment_transactions')
        ? { ...pendingTx, status: 'success' }
        : null);
    const env = { ...baseEnv, DB: db };

    const res = await paymentsApp.request('/verify/SUB_ref_1', {
      headers: await authHeader('user_1'),
    }, env);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.alreadyVerified).toBe(true);
    expect(queries.some((q) => q.sql.includes('ai_grading_credits'))).toBe(false);
  });

  it('rejects when Paystack amount does not match the recorded transaction amount', async () => {
    stubPaystackVerify(5000, 'GHS'); // tx says GHS 25.00, Paystack says GHS 50.00
    const { db, queries } = createMockDb((sql) =>
      sql.includes('FROM payment_transactions') ? pendingTx : null);
    const env = { ...baseEnv, DB: db };

    const res = await paymentsApp.request('/verify/SUB_ref_1', {
      headers: await authHeader('user_1'),
    }, env);

    expect(res.status).toBe(400);
    expect(queries.some((q) => q.sql.includes('ai_grading_credits'))).toBe(false);
  });

  it('credits exactly once for the legitimate owner with matching amount', async () => {
    stubPaystackVerify(2500, 'GHS');
    const { db, queries } = createMockDb((sql) => {
      if (sql.includes('FROM payment_transactions')) return pendingTx;
      if (sql.includes('FROM subscription_tiers')) return { id: 'tier_pro', ai_grading_quota: 10 };
      if (sql.includes('referred_by')) return { referred_by: null };
      return null;
    });
    const env = { ...baseEnv, DB: db };

    const res = await paymentsApp.request('/verify/SUB_ref_1', {
      headers: await authHeader('user_1'),
    }, env);

    expect(res.status).toBe(200);
    const creditWrites = queries.filter((q) => q.sql.includes('ai_grading_credits'));
    expect(creditWrites).toHaveLength(1);
  });
});
```

- [ ] 2.2 Run, watch tests 1-3 fail:
  `npx vitest run workers/api/__tests__/payments.verify.test.ts`

- [ ] 2.3 Implement the fix in `workers/api/payments.ts`. After the transaction lookup (:445-451), insert the ownership and idempotency guards:

```ts
    if (!transaction) {
      return c.json({ success: false, error: 'Transaction not found' }, 404);
    }

    // SECURITY: ownership check — 404 (not 403) to avoid leaking which references exist
    if (transaction.user_id !== userId) {
      return c.json({ success: false, error: 'Transaction not found' }, 404);
    }

    // IDEMPOTENCY: already verified — never credit twice
    if (transaction.status === 'success') {
      return c.json({
        success: true,
        data: { reference, status: 'success', alreadyVerified: true },
      });
    }
```

Then, inside the `if (paymentStatus === 'success')` block, BEFORE the `UPDATE payment_transactions ... SET status = 'success'` (currently :464-468), validate amount + currency against the recorded transaction (NOT the plan list price — the recorded amount already includes early-bird discounts):

```ts
      // SECURITY: validate Paystack's amount/currency against what we recorded at initialize.
      // Paystack amount is in pesewas; payment_transactions.amount is in GHS.
      const paidAmountGhs = (result.data.amount as number) / 100;
      const expectedAmountGhs = transaction.amount as number;
      const currencyMatches = result.data.currency === (transaction.currency as string || 'GHS');
      const amountMatches = Math.abs(paidAmountGhs - expectedAmountGhs) < 0.01;

      if (!currencyMatches || !amountMatches) {
        console.error('Payment amount/currency mismatch', {
          reference, expectedAmountGhs, paidAmountGhs,
          expectedCurrency: transaction.currency, paidCurrency: result.data.currency,
        });
        await c.env.DB.prepare(`
          UPDATE payment_transactions
          SET status = 'failed', paystack_response = ?
          WHERE reference = ?
        `).bind(JSON.stringify(result.data), reference).run();
        return c.json({ success: false, error: 'Payment amount mismatch' }, 400);
      }
```

- [ ] 2.4 Verification: `npx vitest run workers/api/__tests__/payments.verify.test.ts`
  Expected: `✓ 4 passed`.

- [ ] 2.5 Commit (ONLY with explicit user approval):
  `git add workers/api/payments.ts workers/api/__tests__/payments.verify.test.ts && git commit -m "fix(payments): ownership, idempotency and amount checks on verify endpoint"`

---

## Task 3 — Admin revenue reads use the real status value

**Files:**
- `workers/api/index.ts` (edit :5968, :6144-6145, :6199-6200)
- `workers/api/__tests__/admin.revenue.test.ts` (new)

**Context:** writes use `'success'` (`payments.ts:466`); CHECK constraint at `database/migrations/021_subscription_affiliate_system.sql:53` allows `pending/success/failed/refunded` — `'completed'` matches nothing, so every admin revenue figure is 0. `teacher-bonuses.ts:514` already uses `'success'` correctly.

**Steps:**

- [ ] 3.1 Write the test: `workers/api/__tests__/admin.revenue.test.ts`. Assert the SQL issued by the dashboard-stats and analytics endpoints filters on `'success'`. (Mounting the full `adminApp` from `index.ts` requires the Phase 0/1 test harness; if index.ts is not importable in isolation yet, use the grep-based verification in 3.3 as primary and keep this test for the dashboard endpoint only if the harness supports it.)

```ts
import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

// Regression guard: payment revenue reads must use status = 'success'
// (writes use 'success' — payments.ts; CHECK constraint migration 021).
describe('admin revenue status regression guard', () => {
  it('no payment_transactions revenue read filters on status = completed', () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, '..', 'index.ts'), 'utf8',
    );
    const revenueReads = src.match(
      /payment_transactions[^`]*status\s*=\s*'completed'/g,
    );
    expect(revenueReads).toBeNull();
  });

  it('revenue aggregations filter on status = success', () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, '..', 'index.ts'), 'utf8',
    );
    const matches = src.match(
      /SUM\(amount\)[^`]*payment_transactions[^`]*status\s*=\s*'success'/g,
    ) || [];
    expect(matches.length).toBeGreaterThanOrEqual(3); // dashboard + analytics(2x) + subscriptions(2x)
  });
});
```

- [ ] 3.2 In `workers/api/index.ts`, change `status = 'completed'` to `status = 'success'` in exactly these four statements:
  - :5968 (dashboard `totalRevenue`)
  - :6144 (`revenueThisMonth`), :6145 (`revenueLastMonth`)
  - :6199 (`revenueThis`), :6200 (`revenueLast`)

  Do not touch any other `'completed'` occurrences — e.g. `affiliate_payouts.status = 'completed'` (webhook, `payments.ts:792`) and `comeback_challenges.status = 'completed'` are correct values in their own domains.

- [ ] 3.3 Verification:
  `npx vitest run workers/api/__tests__/admin.revenue.test.ts`
  Expected: `✓ 2 passed`.
  Cross-check: `grep -n "status = 'completed'" workers/api/index.ts` → expected: no output (exit 1).

- [ ] 3.4 Commit (ONLY with explicit user approval):
  `git add workers/api/index.ts workers/api/__tests__/admin.revenue.test.ts && git commit -m "fix(admin): read payment revenue with status='success'"`

---

## Task 4 — Datetime canonicalization (trial expiry, OAuth states, nudges, admin stats)

**Files:**
- `workers/api/subscriptions.ts` (edit :477-480)
- `workers/api/oauth.ts` (edit :228-230)
- `workers/api/engagement.ts` (edit :88-101)
- `workers/api/index.ts` (edit :5967, :6197)
- `database/migrations/030_normalize_datetime_to_iso.sql` (new)
- `workers/api/__tests__/datetime-expiry.test.ts` (new)

**Canonical convention (mandatory):** store ISO-8601 with `Z` via `new Date().toISOString()`; compare against bound JS ISO string parameters; never `datetime('now')` against ISO columns. Lexicographic comparison makes `'2026-08-03T20:00:00.000Z' < '2026-08-03 21:00:00'` false (`'T' > ' '`), so same-day expiries never trigger — a 10-minute OAuth state stays valid for the rest of the UTC day.

**Steps:**

- [ ] 4.1 Add `better-sqlite3` as a devDependency for SQL-semantics tests (real SQLite = real lexicographic behavior; a stub D1 cannot catch this class of bug). If Phase 0 already installed `@cloudflare/vitest-pool-workers` or another real-SQLite harness, use that instead — do not install both:
  `npm install -D better-sqlite3 @types/better-sqlite3`

- [ ] 4.2 Write the failing tests: `workers/api/__tests__/datetime-expiry.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import Database from 'better-sqlite3';

function setup() {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE user_trials (id TEXT, user_id TEXT, expires_at TEXT, status TEXT);
    CREATE TABLE oauth_states (id TEXT, state TEXT, expires_at TEXT);
    CREATE TABLE engagement_nudges (id TEXT, user_id TEXT, expires_at TEXT, dismissed INTEGER DEFAULT 0);
  `);
  return db;
}

const ISO_ONE_HOUR_AGO = new Date(Date.now() - 60 * 60 * 1000).toISOString();
const ISO_ONE_HOUR_AHEAD = new Date(Date.now() + 60 * 60 * 1000).toISOString();

describe('ISO datetime expiry semantics', () => {
  it('expires a trial that expired earlier TODAY (same-day expiry works)', () => {
    const db = setup();
    db.prepare(`INSERT INTO user_trials VALUES ('t1', 'u1', ?, 'active')`).run(ISO_ONE_HOUR_AGO);

    // Fixed query (bound JS ISO parameter):
    const rows = db.prepare(
      `SELECT id FROM user_trials WHERE status = 'active' AND expires_at < ?`,
    ).all(new Date().toISOString());
    expect(rows).toHaveLength(1);

    // Documents the old bug: datetime('now') vs ISO never matches same-day expiries:
    const brokenRows = db.prepare(
      `SELECT id FROM user_trials WHERE status = 'active' AND expires_at < datetime('now')`,
    ).all();
    expect(brokenRows).toHaveLength(0);
  });

  it('does not expire a trial that expires later today', () => {
    const db = setup();
    db.prepare(`INSERT INTO user_trials VALUES ('t2', 'u2', ?, 'active')`).run(ISO_ONE_HOUR_AHEAD);
    const rows = db.prepare(
      `SELECT id FROM user_trials WHERE status = 'active' AND expires_at < ?`,
    ).all(new Date().toISOString());
    expect(rows).toHaveLength(0);
  });

  it('rejects an OAuth state older than 10 minutes even on the same UTC day', () => {
    const db = setup();
    const elevenMinutesAgo = new Date(Date.now() - 11 * 60 * 1000).toISOString();
    db.prepare(`INSERT INTO oauth_states VALUES ('s1', 'state_abc', ?)`).run(elevenMinutesAgo);

    // Fixed query (bound JS ISO parameter):
    const rows = db.prepare(
      `SELECT id FROM oauth_states WHERE state = ? AND expires_at > ?`,
    ).all('state_abc', new Date().toISOString());
    expect(rows).toHaveLength(0);
  });

  it('hides expired nudges but keeps unexpired and NULL-expiry ones', () => {
    const db = setup();
    db.prepare(`INSERT INTO engagement_nudges (id, user_id, expires_at) VALUES ('n1', 'u1', ?)`).run(ISO_ONE_HOUR_AGO);
    db.prepare(`INSERT INTO engagement_nudges (id, user_id, expires_at) VALUES ('n2', 'u1', ?)`).run(ISO_ONE_HOUR_AHEAD);
    db.prepare(`INSERT INTO engagement_nudges (id, user_id, expires_at) VALUES ('n3', 'u1', NULL)`).run();

    const rows = db.prepare(
      `SELECT id FROM engagement_nudges
       WHERE user_id = ? AND dismissed = 0 AND (expires_at IS NULL OR expires_at > ?)`,
    ).all('u1', new Date().toISOString());
    expect(rows.map((r) => (r as { id: string }).id).sort()).toEqual(['n2', 'n3']);
  });
});
```

- [ ] 4.3 Run, watch tests 1 and 3 fail against the current queries if you inline the old SQL (the fixed-query assertions pass in isolation — the real failing proof is the broken-query assertions showing the old behavior; for the endpoint-level proof, the `alreadyVerified`-style harness tests are in 4.6). Keep this test file as the semantics contract.

- [ ] 4.4 Fix the four code sites (bind a JS ISO `now`; do not change stored formats — they already store ISO):

`workers/api/subscriptions.ts` (:477-480):

```ts
    const nowIso = new Date().toISOString();
    const { results: expiredTrials } = await c.env.DB.prepare(`
      SELECT id, user_id FROM user_trials
      WHERE status = 'active' AND expires_at < ?
    `).bind(nowIso).all();
```

`workers/api/oauth.ts` (:228-230):

```ts
  const storedState = await c.env.DB.prepare(`
    SELECT * FROM oauth_states WHERE state = ? AND expires_at > ?
  `).bind(state, new Date().toISOString()).first();
```

`workers/api/engagement.ts` (:88-101) — add `const nowIso = new Date().toISOString();` before the query and change the predicate to:

```sql
        AND (expires_at IS NULL OR expires_at > ?)
```
with `.bind(user.userId, nowIso)`.

`workers/api/index.ts` :5967 and :6197 — both are `user_trials ... expires_at > datetime('now')` inside `Promise.all` blocks. Compute `const nowIso = new Date().toISOString();` at the top of each handler (:5950 dashboard/stats already builds `today`/`weekAgo` — add `nowIso` there; same for :6193 subscriptions/stats) and change both to `expires_at > ?` with `.bind(nowIso)`.

- [ ] 4.5 Data-fix migration for existing mixed-format rows: `database/migrations/030_normalize_datetime_to_iso.sql`

```sql
-- Normalize legacy 'YYYY-MM-DD HH:MM:SS' timestamps to ISO-8601 ('YYYY-MM-DDTHH:MM:SS.SSSZ')
-- so lexicographic comparison against bound ISO parameters is correct.
-- strftime() parses both formats; rows already in ISO (contain 'T') are untouched.

UPDATE user_trials
SET expires_at = strftime('%Y-%m-%dT%H:%M:%fZ', expires_at)
WHERE expires_at IS NOT NULL AND expires_at NOT LIKE '%T%';

UPDATE user_trials
SET started_at = strftime('%Y-%m-%dT%H:%M:%fZ', started_at)
WHERE started_at IS NOT NULL AND started_at NOT LIKE '%T%';

UPDATE users
SET trial_expires_at = strftime('%Y-%m-%dT%H:%M:%fZ', trial_expires_at)
WHERE trial_expires_at IS NOT NULL AND trial_expires_at NOT LIKE '%T%';

UPDATE users
SET trial_started_at = strftime('%Y-%m-%dT%H:%M:%fZ', trial_started_at)
WHERE trial_started_at IS NOT NULL AND trial_started_at NOT LIKE '%T%';

UPDATE users
SET subscription_expires_at = strftime('%Y-%m-%dT%H:%M:%fZ', subscription_expires_at)
WHERE subscription_expires_at IS NOT NULL AND subscription_expires_at NOT LIKE '%T%';

UPDATE oauth_states
SET expires_at = strftime('%Y-%m-%dT%H:%M:%fZ', expires_at)
WHERE expires_at IS NOT NULL AND expires_at NOT LIKE '%T%';

UPDATE engagement_nudges
SET expires_at = strftime('%Y-%m-%dT%H:%M:%fZ', expires_at)
WHERE expires_at IS NOT NULL AND expires_at NOT LIKE '%T%';

UPDATE comeback_challenges
SET expires_at = strftime('%Y-%m-%dT%H:%M:%fZ', expires_at)
WHERE expires_at IS NOT NULL AND expires_at NOT LIKE '%T%';
```

**Rollback notes:** take a backup first — `wrangler d1 export brilla-db --output backup-pre-030.sql`. Reverse migration (only valid together with a code revert, since post-fix code convention is ISO everywhere): `UPDATE <table> SET <col> = strftime('%Y-%m-%d %H:%M:%S', <col>) WHERE <col> LIKE '%T%';` per column above. Both formats parse to the same instant, so the migration is non-destructive; the risk is only format-mixing if code and data conventions diverge again.

- [ ] 4.6 Endpoint-level regression test (uses the Phase 0/1 harness; skip only if the harness cannot mount `subscriptionsApp` yet and note the deviation). Otherwise, at minimum re-run 4.2 plus:

```ts
// workers/api/__tests__/trial-expiry.test.ts (sketch — adapt to Phase 0 harness)
// POST /trial/check-expiry with a trial expiring 1 hour ago (same UTC day)
// → response data.expiredCount === 1 and the trial row's status UPDATE was issued.
```

- [ ] 4.7 Verification:
  - `npx vitest run workers/api/__tests__/datetime-expiry.test.ts` → Expected: `✓ 4 passed`.
  - `npx wrangler d1 migrations apply brilla-db --local` → Expected: `030_normalize_datetime_to_iso.sql` listed as applied, no errors.
  - `grep -rn "datetime('now')" workers/api/subscriptions.ts workers/api/oauth.ts` → Expected: only write-side usages remain (`converted_at`, `last_used_at`, etc.), no `expires_at` comparisons.

- [ ] 4.8 Commit (ONLY with explicit user approval):
  `git add workers/api/subscriptions.ts workers/api/oauth.ts workers/api/engagement.ts workers/api/index.ts database/migrations/030_normalize_datetime_to_iso.sql workers/api/__tests__/datetime-expiry.test.ts package.json package-lock.json && git commit -m "fix: canonical ISO datetime comparisons for expiry checks"`

---

## Task 5 — AI call quota (50/user/day) on explain/chat/counselor

**Files:**
- `workers/api/rate-limit.ts` (new — extracted from `index.ts`)
- `workers/api/index.ts` (edit :286-424 to import instead of define; edit `/ai/explain` :4591-4638 and `/ai/chat` :4641-4698)
- `workers/api/counselor.ts` (edit the message-send handler before its Anthropic call — call site at :144/:172, handler ~:520-575; verify exact lines when editing)
- `workers/api/__tests__/ai.quota.test.ts` (new)

**Interfaces:** reuse the migration-024 infrastructure. `checkRateLimit(db, identifier, endpoint, config?)` at `index.ts:328-413` is currently file-private; extract it verbatim (with `RateLimitConfig`, `RateLimitResult`, `RATE_LIMITS`, `cleanupRateLimits`) into `rate-limit.ts` so `counselor.ts` can import it without a circular dependency. New named constant `DAILY_AI_CALL_LIMIT = 50` (per user per rolling 24 h) and a new `RATE_LIMITS['ai']` entry. Identifier = `userId`, so the cap is per-user, not per-IP.

**Steps:**

- [ ] 5.1 Write the failing test: `workers/api/__tests__/ai.quota.test.ts`

```ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { sign } from 'hono/jwt';

// NOTE: mounting protectedApp from index.ts requires the Phase 0/1 harness.
// This test targets the rate-limit primitive directly; the endpoint wiring
// is verified by the compile + manual smoke step (5.6).
import { checkRateLimit, RATE_LIMITS, DAILY_AI_CALL_LIMIT } from '../rate-limit';

function createCountingDb() {
  const calls: { identifier: string; endpoint: string }[] = [];
  const db = {
    prepare(sql: string) {
      return {
        bind(...params: unknown[]) {
          const [identifier, endpoint] = params as [string, string, ...unknown[]];
          if (sql.startsWith('SELECT SUM')) {
            const total = calls.filter(
              (c) => c.identifier === identifier && c.endpoint === endpoint,
            ).length;
            return {
              first: async () => ({ total_requests: total, last_request: null }),
              all: async () => ({ results: [] }),
              run: async () => ({ meta: { changes: 1 } }),
            };
          }
          if (sql.startsWith('SELECT id, request_count')) {
            return { first: async () => null, all: async () => ({ results: [] }), run: async () => ({ meta: { changes: 1 } }) };
          }
          if (sql.startsWith('INSERT')) {
            calls.push({ identifier, endpoint });
          }
          return { first: async () => null, all: async () => ({ results: [] }), run: async () => ({ meta: { changes: 1 } }) };
        },
      };
    },
  } as unknown as D1Database;
  return { db, calls };
}

describe('AI daily quota', () => {
  it('allows up to DAILY_AI_CALL_LIMIT calls then blocks the next one', async () => {
    expect(DAILY_AI_CALL_LIMIT).toBe(50);
    expect(RATE_LIMITS['ai'].maxRequests).toBe(DAILY_AI_CALL_LIMIT);

    const { db } = createCountingDb();
    for (let i = 0; i < DAILY_AI_CALL_LIMIT; i++) {
      const r = await checkRateLimit(db, 'user_1', 'ai');
      expect(r.allowed).toBe(true);
    }
    const blocked = await checkRateLimit(db, 'user_1', 'ai');
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });

  it('caps are per-user, not global', async () => {
    const { db } = createCountingDb();
    for (let i = 0; i < DAILY_AI_CALL_LIMIT; i++) {
      await checkRateLimit(db, 'user_1', 'ai');
    }
    const other = await checkRateLimit(db, 'user_2', 'ai');
    expect(other.allowed).toBe(true);
  });
});
```

- [ ] 5.2 Extract into `workers/api/rate-limit.ts` (move — do not copy-edit — `RateLimitConfig`, `RateLimitResult`, `RATE_LIMITS`, `checkRateLimit`, `cleanupRateLimits` from `index.ts:286-424`, each gaining `export`), adding:

```ts
// Named constant: max AI calls per user per rolling 24h (explain + chat + counselor)
export const DAILY_AI_CALL_LIMIT = 50;
```

and adding to `RATE_LIMITS`:

```ts
  'ai': {
    maxRequests: DAILY_AI_CALL_LIMIT,
    windowMs: 24 * 60 * 60 * 1000, // 50 AI calls per user per rolling 24 hours
  },
```

In `index.ts`, delete the moved block and import:

```ts
import { checkRateLimit, cleanupRateLimits, RATE_LIMITS, DAILY_AI_CALL_LIMIT } from './rate-limit';
```

(Keep any other `index.ts` references — e.g. login/register call sites — working unchanged.)

- [ ] 5.3 Wire the quota + trustworthy identity into `/ai/explain` (`index.ts:4591`) and `/ai/chat` (`index.ts:4641`). Remove `userId` from the body destructuring (it is currently client-supplied — spoofable) and use the Phase 1 auth context:

```ts
protectedApp.post('/ai/explain', async (c) => {
  const { question, userAnswer, correctAnswer, isCorrect, context } = await c.req.json();
  const userId = c.get('userId') as string;
  if (!userId) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  // COST CONTROL: per-user daily AI quota
  const quota = await checkRateLimit(c.env.DB, userId, 'ai');
  if (!quota.allowed) {
    return c.json({
      success: false,
      error: 'Daily AI limit reached. Try again tomorrow.',
      code: 'AI_LIMIT_REACHED',
      retryAfter: quota.retryAfter,
    }, 429);
  }
  // ... rest unchanged
```

Apply the identical guard to `/ai/chat` (dropping `userId` from its body destructure the same way).

- [ ] 5.4 In `workers/api/counselor.ts`, import `checkRateLimit` from `./rate-limit` and add the same 429 guard in the conversation message handler, immediately before the Anthropic call path (the handler that inserts the user message ~:542 and calls the AI via :144/:172). Use the handler's existing authenticated `userId` (verify it comes from auth context, not the body, when editing — if it comes from the body, switch it to `c.get('userId')` the same way).

- [ ] 5.5 Verification:
  - `npx vitest run workers/api/__tests__/ai.quota.test.ts` → Expected: `✓ 2 passed`.
  - `npx tsc --noEmit -p tsconfig.node.json` (or the repo's typecheck for workers code) → Expected: no errors (proves the extraction didn't break `index.ts`/`counselor.ts` imports).
  - `grep -n "async function checkRateLimit" workers/api/index.ts` → Expected: no output (moved, not duplicated).

- [ ] 5.6 Manual smoke (local): `npm run dev:api`, call `POST /ai/chat` 51 times with a valid JWT → Expected: first 50 return 200, 51st returns 429 with `code: "AI_LIMIT_REACHED"`. (Record result; if local Anthropic key is absent the mock fallback still exercises the quota path.)

- [ ] 5.7 Commit (ONLY with explicit user approval):
  `git add workers/api/rate-limit.ts workers/api/index.ts workers/api/counselor.ts workers/api/__tests__/ai.quota.test.ts && git commit -m "fix(ai): per-user daily quota on AI endpoints"`

---

## Verification

Run in order after all tasks:

1. `npm test` (or `npx vitest run`) — Expected: all suites pass, including `payments.webhook`, `payments.verify`, `admin.revenue`, `datetime-expiry`, `ai.quota`.
2. `npx tsc --noEmit -p tsconfig.node.json` — Expected: no type errors.
3. `npx wrangler d1 migrations apply brilla-db --local` — Expected: `030_normalize_datetime_to_iso.sql` applies cleanly.
4. `grep -n "status = 'completed'" workers/api/index.ts` — Expected: no output.
5. `grep -n "PAYSTACK_WEBHOOK_SECRET" workers/api/payments.ts` — Expected: the fail-closed `500` path present, no `console.warn` skip.
6. Forged-webhook proof (from Task 1 tests): webhook POST with no secret configured → 5xx, zero DB queries recorded.

Deploy-gated checks (require user action, do not perform autonomously): `wrangler secret put PAYSTACK_WEBHOOK_SECRET` in production; apply migration 030 to production D1 after taking `wrangler d1 export` backup.

## Out of scope

- Tutoring payouts' own Paystack verify flow (`workers/api/tutoring.ts:1699-1766`) — separate surface, needs its own audit task.
- `checkRateLimit` failing open on DB errors (`index.ts:404-412` pre-extraction) — hardening candidate, not changed here.
- The broader ~238 `datetime('now')` usages that are write-side (`updated_at = datetime('now')` etc.) — harmless; only comparisons against ISO-stored columns were fixed.
- Essay AI grading credit logic (`index.ts:4373-4412`) — already has a quota/credit check; untouched.
- Frontend changes, plan pricing changes, Paystack subscription (recurring) flows.
- Any git commit/push — every commit step above is gated on explicit user approval.
