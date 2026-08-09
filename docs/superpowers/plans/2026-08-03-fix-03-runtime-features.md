# Phase 3 — Runtime Feature Fixes

**Goal:** Fix features that are broken at runtime (phantom columns, dead queries, 500s mid-handler) or that corrupt data (double XP awards, oversubscribed tournaments, partial multi-writes), without touching the schema — Phase 5 owns the schema squash.

**Architecture:** Hono apps mounted in `workers/api/index.ts` (main app: `publicApp`, `protectedApp`, `adminApp`) plus per-domain sub-apps (`workers/api/quickplay.ts`, `chat.ts`, `learningpath.ts`, `events.ts`, `rewards.ts`, `engagement.ts`, `cosmetics.ts`, `affiliates.ts`, `oauth.ts`, `recordings.ts`, `subscriptions.ts`, `teacher-bonuses.ts`). Persistence is Cloudflare D1 (SQLite) via `c.env.DB`; file storage is R2 via `c.env.RECORDINGS_BUCKET`.

**Tech stack:** TypeScript, Hono ^4.6, Cloudflare Workers + D1 + R2, Vitest (provided by Phase 0).

**Dependencies:** Phase 0 (vitest runner + `npm test` script in `workers/`), Phase 1 (auth context — `getUserId(c)` semantics must not be re-litigated here). Coordinates with Phase 5: **no new migrations in this phase**; see `## Schema-change handoff to Phase 5`.

## Global Constraints

- Fix root cause, not symptom; smallest diff.
- No new migrations — schema changes go to the Phase 5 handoff section.
- Every task ends with a verifiable command and expected output.
- Commits only with user's explicit approval.
- All fixes target the CURRENT schema (`database/schema.sql`: `users.xp_points` at line 260, `users.streak_days` at 262, `subjects.exam_type_id` at ~292, `question_attempts.is_correct` at 373-383, `exam_types.slug` at 10-22). Do not write SQL against columns that only exist in your head — re-grep before editing.
- Tests live under `workers/api/tests/` and run with `cd workers && npx vitest run` (script wiring is Phase 0's job; if the script is absent, invoke `npx vitest run` directly).
- Line numbers below were verified against the working tree on 2026-08-03; expect drift — locate by the quoted SQL/code, not by line number alone.

---

## Task 1 — Batch-aware mock D1 test helper

Several later tasks need a D1 mock that understands `DB.batch()` and can simulate conditional-update races. Build it once, up front.

**Files:** `workers/api/tests/helpers/mockD1.ts` (new)

- [ ] Create `workers/api/tests/helpers/mockD1.ts`:

```ts
// Minimal D1 mock: route SQL by regex, support batch(), count changes.
export interface MockHandler {
  match: RegExp;
  first?: (binds: unknown[]) => unknown;
  all?: (binds: unknown[]) => { results: unknown[] };
  run?: (binds: unknown[]) => { success: boolean; meta: { changes: number } };
}

export interface MockD1 {
  prepare(sql: string): {
    bind(...binds: unknown[]): {
      first<T = unknown>(): Promise<T | null>;
      all<T = unknown>(): Promise<{ results: T[] }>;
      run(): Promise<{ success: boolean; meta: { changes: number } }>;
    };
  };
  batch(stmts: { run(): Promise<unknown> }[]): Promise<unknown[]>;
  calls: { sql: string; binds: unknown[] }[];
}

export function createMockD1(handlers: MockHandler[]): MockD1 {
  const calls: { sql: string; binds: unknown[] }[] = [];
  function prepare(sql: string) {
    return {
      bind(...binds: unknown[]) {
        calls.push({ sql, binds });
        const h = handlers.find((x) => x.match.test(sql));
        if (!h) throw new Error(`mockD1: no handler for SQL: ${sql.slice(0, 120)}`);
        return {
          async first() { return h.first ? h.first(binds) : null; },
          async all() { return h.all ? h.all(binds) : { results: [] }; },
          async run() {
            return h.run ? h.run(binds) : { success: true, meta: { changes: 1 } };
          },
        };
      },
    };
  }
  return {
    prepare,
    // D1 batches are atomic in prod; sequential execution is sufficient for
    // unit tests because no handler in these tests interleaves between stmts.
    async batch(stmts) {
      const out = [];
      for (const s of stmts) out.push(await s.run());
      return out;
    },
    calls,
  };
}
```

- [ ] Smoke-test the helper in `workers/api/tests/helpers/mockD1.test.ts`: prepare/bind/run returns handler result; `batch([a, b])` runs both and returns both results; unmatched SQL throws.

**Verify:** `cd workers && npx vitest run api/tests/helpers/mockD1.test.ts` → 3 passing tests.
**Commit:** `test: add batch-aware mock D1 helper` (only with user's explicit approval).

---

## XP economy

### Task 2 — Replace phantom `users.xp` / `users.streak` with real columns

`users` has `xp_points` and `streak_days`; there is no `xp`, no `coins`, no `streak` column in `schema.sql` or any migration. Every statement below 500s mid-handler, after earlier writes in the same handler have already committed — that is the data corruption. Convert all of them.

**Files:**
- `workers/api/quickplay.ts:252` — `'UPDATE users SET xp = xp + ? WHERE id = ?'`
- `workers/api/rewards.ts:147` and `workers/api/rewards.ts:334` — same statement (mystery chest open, spin wheel)
- `workers/api/engagement.ts:340` — same statement (comeback challenge claim)
- `workers/api/events.ts:203` (event reward), `events.ts:305` (`SELECT xp FROM users`), `events.ts:308` (`userData?.xp`), `events.ts:313` (`UPDATE users SET xp = xp - ?`)
- `workers/api/cosmetics.ts:51` (`SELECT level, xp FROM users`), `cosmetics.ts:336/339/345` (xp-cost purchase path), and — found during verification, audit lines 406/414 were mislabeled — `cosmetics.ts:415/418`: `SELECT streak FROM users` / `userData?.streak` (real column: `streak_days`)

- [ ] In each file, replace column `xp` → `xp_points` inside SQL strings AND the corresponding JS property reads (`userData?.xp as number` → `userData?.xp_points as number`). In `cosmetics.ts` also `streak` → `streak_days` (SQL and `userData?.streak` read).
- [ ] Repo-wide sweep to prove none remain:

```sh
grep -rnE "SET xp |SELECT xp[, ]|, xp |userData\?\.xp\b|SELECT streak FROM users|userData\?\.streak\b" workers/api --include='*.ts' | grep -v xp_points | grep -v streak_days
```

Expected: no output. (Reward-type string literals like `type: 'xp'`, `qt.xp_reward`, `challenge.xp_reward` are fine — those are real columns/enum values.)
- [ ] Add `workers/api/tests/xp-awards.test.ts`: using `createMockD1`, drive the quick-play `/submit` handler (Task 12 rewires its grading; write this test against the post-Task-12 code) and assert the XP statement captured in `db.calls` matches `/UPDATE users SET xp_points = xp_points \+/` and never `/SET xp =/`. Repeat for the events tournament-join path (entry fee deduction matches `/xp_points - \?/`).

**Verify:** the grep above prints nothing; `cd workers && npx vitest run api/tests/xp-awards.test.ts` → passing.
**Commit:** `fix(api): award/deduct xp_points instead of phantom users.xp column` (only with user's explicit approval).

### Task 3 — Remove the phantom coin economy from quest claims

`quest_templates.coin_reward` is SELECTed (`index.ts:2420`) and echoed in the claim response (`index.ts:2456`, `coins: quest.coin_reward || 0`) but **never credited** — there is no `users.coins` column anywhere. Decision (documented, per audit recommendation — YAGNI): remove coins from the response; do not add a column.

**Files:** `workers/api/index.ts` (~2451-2458, claim response)

- [ ] Change the claim response to `{ success: true, data: { xp: xpReward } }`.
- [ ] Leave the `qt.coin_reward` SELECTs in place (harmless, used by quest list UIs) — removing them is Phase 5's call when the column is dropped or wired up.
- [ ] Add a `// NOTE: coin_reward is display-only; no users.coins column exists. See docs/superpowers/plans/2026-08-03-fix-03-runtime-features.md` comment above the response.
- [ ] Record the decision in `## Schema-change handoff to Phase 5` (below).
- [ ] Test in `workers/api/tests/quest-claim.test.ts` (built in Task 6): assert response body has `data.xp === 100` and no `coins` key.

**Verify:** `grep -n "coins:" workers/api/index.ts` → no matches; vitest for quest-claim passes.
**Commit:** `fix(api): drop never-credited coins from quest claim response` (only with user's explicit approval).

---

## Learningpath

### Task 4 — Fix exam-type subject lookup

`learningpath.ts:105` runs `WHERE s.exam_type = ?` binding a slug (`'wassce'`); the column is `subjects.exam_type_id` (FK to `exam_types.id`). The query returns zero rows, so the whole readiness endpoint is dead.

**Files:** `workers/api/learningpath.ts` (~100-108)

- [ ] Rewrite the subjects query to resolve the slug through `exam_types`:

```ts
const subjects = await c.env.DB.prepare(`
  SELECT s.id, s.name, s.icon
  FROM subjects s
  LEFT JOIN exam_types et ON et.id = s.exam_type_id
  WHERE et.slug = ? OR s.exam_type_id IS NULL
  ORDER BY s.name
`).bind(examType).all();
```

(Keep the `IS NULL` fallback: it preserves the existing "shared subjects" semantics.)
- [ ] Also fix the `exam_readiness` upsert at `learningpath.ts:164-166` — verify against the real `exam_readiness` table in `database/schema.sql` whether its exam-type column is `exam_type` or `exam_type_id`, and bind accordingly; if the table itself references the phantom `user_questions`-era shape, flag it in the Phase 5 handoff rather than migrating.

**Verify:** `grep -n "s.exam_type " workers/api/learningpath.ts` → no matches.
**Commit:** `fix(learningpath): resolve exam type slug via exam_types join` (only with user's explicit approval).

### Task 5 — Rewrite mastery queries off the nonexistent `user_questions` table

`user_questions` exists nowhere (schema or migrations). It is referenced 4 times in `learningpath.ts`: ~40 (recommendations), ~124 and ~138 (readiness per-subject loop — also an N+1, one aggregate per subject), ~259 (study plan). The real attempt table is `question_attempts (user_id, question_id, user_answer, is_correct INTEGER, time_taken, points_earned, created_at)` (schema.sql:373).

**Files:** `workers/api/learningpath.ts`

- [ ] Replace every `LEFT JOIN user_questions uq ON uq.question_id = q.id AND uq.user_id = ?` with:

```sql
LEFT JOIN question_attempts qa ON qa.question_id = q.id AND qa.user_id = ?
```

and every `CASE WHEN uq.correct THEN 100 ELSE 0 END` with `CASE WHEN qa.is_correct = 1 THEN 100 ELSE 0 END`; `COUNT(uq.id)` → `COUNT(qa.id)`.
- [ ] Collapse the readiness per-subject loop (~113-155) into one grouped query — compute all subjects' mastery in a single round trip:

```sql
SELECT
  s.id AS subject_id,
  COUNT(DISTINCT t.id) AS total_topics,
  COUNT(DISTINCT CASE WHEN topic_mastery.mastery >= 70 THEN t.id END) AS mastered_topics,
  COALESCE(AVG(topic_mastery.mastery), 0) AS avg_mastery
FROM subjects s
LEFT JOIN topics t ON t.subject_id = s.id
LEFT JOIN (
  SELECT q.topic_id, AVG(CASE WHEN qa.is_correct = 1 THEN 100 ELSE 0 END) AS mastery
  FROM questions q
  LEFT JOIN question_attempts qa ON qa.question_id = q.id AND qa.user_id = ?
  GROUP BY q.topic_id
) topic_mastery ON topic_mastery.topic_id = t.id
WHERE s.id IN (/* subject ids from Task 4 result */)
GROUP BY s.id
```

Iterate over the grouped rows to build `readinessData`; keep the per-subject weak/strong topic query only if it's genuinely per-subject detail (it is — leave it, but it's bounded by subject count; note it in the Task 16 sweep).
- [ ] Add `workers/api/tests/learningpath.test.ts`: with `createMockD1`, assert every captured SQL string contains `question_attempts` and none contains `user_questions` or `s.exam_type =`.

**Verify:** `grep -n "user_questions" workers/api/learningpath.ts` → no matches; vitest passes.
**Commit:** `fix(learningpath): compute mastery from question_attempts, kill dead joins` (only with user's explicit approval).

---

## Atomicity (multi-writes & TOCTOU)

### Task 6 — Quest claim: conditional UPDATE + batch, with double-claim regression test

`index.ts` quest claim (~2408-2464): reads status at ~2429, then unguarded `UPDATE user_quests SET status='claimed'` at ~2436, then XP award, then completion insert. Two concurrent (or retried) claims both pass the read check → double XP.

**Files:** `workers/api/index.ts` (~2415-2464)

- [ ] Keep the initial SELECT (needed for 404 and for reading `xp_reward`/`quest_template_id`), but replace the plain UPDATE with a conditional one and gate on `meta.changes`:

```ts
// Atomic claim transition: only one claimant can flip completed -> claimed
const claim = await c.env.DB.prepare(`
  UPDATE user_quests SET status = 'claimed', claimed_at = datetime('now')
  WHERE id = ? AND user_id = ? AND status = 'completed'
`).bind(questId, userId).run();

if (claim.meta.changes === 0) {
  return c.json({ success: false, error: 'Quest not completed yet or already claimed' }, 400);
}

// Award + record atomically
await c.env.DB.batch([
  c.env.DB.prepare('UPDATE users SET xp_points = xp_points + ? WHERE id = ?')
    .bind(xpReward, userId),
  c.env.DB.prepare(`
    INSERT INTO quest_completions (id, user_id, quest_template_id, xp_earned, quest_type)
    VALUES (?, ?, ?, ?, (SELECT quest_type FROM quest_templates WHERE id = ?))
  `).bind(`qc_${crypto.randomUUID()}`, userId, quest.quest_template_id, xpReward, quest.quest_template_id),
]);
```

- [ ] The pre-claim `quest.status !== 'completed'` 400 check can stay as a fast path for better error messages, but the conditional UPDATE is now the correctness mechanism — make sure the test below would pass even if the fast-path check were deleted.
- [ ] Write `workers/api/tests/quest-claim.test.ts`: stateful mock —

```ts
let questStatus = 'completed';
let xp = 0;
const db = createMockD1([
  { match: /FROM user_quests/, first: () => ({
      id: 'uq1', user_id: 'u1', status: questStatus,
      quest_template_id: 'qt1', xp_reward: 100 }) },
  { match: /UPDATE user_quests SET status = 'claimed'/, run: () => {
      if (questStatus !== 'completed') return { success: true, meta: { changes: 0 } };
      questStatus = 'claimed';
      return { success: true, meta: { changes: 1 } };
    } },
  { match: /UPDATE users SET xp_points = xp_points \+/, run: (b) => {
      xp += b[0] as number; return { success: true, meta: { changes: 1 } }; } },
  { match: /INSERT INTO quest_completions/, run: () => ({ success: true, meta: { changes: 1 } }) },
]);
// Invoke the claim handler twice sequentially via the mounted app
// (protectedApp.request('/quests/uq1/claim', { method: 'POST', headers }, { DB: db }))
// EXPECT: first returns 200, second returns 400, and xp === 100 exactly.
```

Invoke through the Hono app with `app.request(path, init, env)` (Hono supports an env arg); supply whatever auth header/context Phase 1 standardized for `getUserId`.

**Verify:** `cd workers && npx vitest run api/tests/quest-claim.test.ts` → second claim 400, `xp === 100`.
**Commit:** `fix(api): make quest claim atomic; prevent double XP award` (only with user's explicit approval).

### Task 7 — Tournament join: close the capacity/fee TOCTOU

`events.ts` (~291-320): check existing membership → SELECT count → SELECT xp → UPDATE xp → INSERT participant, all separate statements. Concurrent joins can exceed `max_participants` and the balance check can go stale. (XP column names here get fixed by Task 2; this task makes the logic atomic. Also note ~313 binds `tournament.entry_fee` — verify the bind matches the deducted column after Task 2.)

**Files:** `workers/api/events.ts` (~291-320)

- [ ] Replace the deduct-then-insert sequence with conditional single statements (SQLite executes each statement atomically):

```ts
// 1. Conditional fee debit — fails atomically if balance insufficient
if (tournament.entry_fee > 0) {
  const debit = await c.env.DB.prepare(
    'UPDATE users SET xp_points = xp_points - ? WHERE id = ? AND xp_points >= ?'
  ).bind(tournament.entry_fee, user.userId, tournament.entry_fee).run();
  if (debit.meta.changes === 0) {
    return c.json({ success: false, error: 'Not enough XP for entry fee' }, 400);
  }
}

// 2. Conditional insert — enforces uniqueness AND capacity in one statement
const join = await c.env.DB.prepare(`
  INSERT INTO tournament_participants (id, tournament_id, user_id)
  SELECT ?, ?, ?
  WHERE NOT EXISTS (
    SELECT 1 FROM tournament_participants WHERE tournament_id = ? AND user_id = ?
  )
  AND (SELECT COUNT(*) FROM tournament_participants WHERE tournament_id = ?) < ?
`).bind(
  `tp_${crypto.randomUUID()}`, tournamentId, user.userId,
  tournamentId, user.userId,
  tournamentId, tournament.max_participants ?? Number.MAX_SAFE_INTEGER
).run();

if (join.meta.changes === 0) {
  // Refund the fee if we debited it
  if (tournament.entry_fee > 0) {
    await c.env.DB.prepare(
      'UPDATE users SET xp_points = xp_points + ? WHERE id = ?'
    ).bind(tournament.entry_fee, user.userId).run();
  }
  return c.json({ success: false, error: 'Tournament is full or already joined' }, 400);
}
```

- [ ] Remove the now-redundant pre-checks (the SELECT count / SELECT xp blocks); keep the `existing` fast-path 400 only if you keep distinct error messages — the conditional INSERT is the guard.
- [ ] Test `workers/api/tests/tournament-join.test.ts`: mock with a participants array; join twice as same user → second is 400 and XP refunded; fill to `max_participants` → next join 400 with refund; assert at most `max_participants` inserts.

**Verify:** vitest passes; `grep -n "SELECT xp FROM users" workers/api/events.ts` → no matches.
**Commit:** `fix(events): atomic tournament join with capacity + fee guards` (only with user's explicit approval).

### Task 8 — Registration: batch the user + preferences writes

`index.ts` (~1131-1164): INSERT user, UPDATE primary exam type, then N `user_exam_preferences` INSERTs in a loop — a crash mid-loop leaves a user without preferences.

**Files:** `workers/api/index.ts` (~1126-1165)

- [ ] Collect statements and execute with `c.env.DB.batch([...])`:

```ts
const statements = [
  c.env.DB.prepare(`INSERT INTO users (id, email, password_hash, name, role, status, email_verified,
                    school_level, year_group, school_name, house,
                    teacher_license_number, subjects_taught, years_experience, qualifications,
                    selected_tier_id)
    VALUES (?, ?, ?, ?, ?, 'pending', 0, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(id, email, passwordHash, name, userRole,
      schoolLevel || null, yearGroup || null, schoolName || null, house || null,
      teacherLicenseNumber || null,
      subjectsTaught ? JSON.stringify(subjectsTaught) : null,
      yearsExperience || null, qualifications || null,
      selectedTierId || null),
];

if (examTypeIds && Array.isArray(examTypeIds) && examTypeIds.length > 0) {
  const actualPrimaryId = primaryExamTypeId || examTypeIds[0];
  statements.push(
    c.env.DB.prepare('UPDATE users SET primary_exam_type_id = ? WHERE id = ?')
      .bind(actualPrimaryId, id)
  );
  for (const examTypeId of examTypeIds) {
    const prefId = `pref_${id}_${examTypeId}_${Date.now()}`;
    statements.push(
      c.env.DB.prepare(`INSERT INTO user_exam_preferences (id, user_id, exam_type_id, is_primary)
        VALUES (?, ?, ?, ?)`)
        .bind(prefId, id, examTypeId, examTypeId === actualPrimaryId ? 1 : 0)
    );
  }
}

await c.env.DB.batch(statements);
```

- [ ] Leave the admin-notification block outside the batch (it is already best-effort in its own try/catch).
- [ ] Test `workers/api/tests/register.test.ts`: register with 2 exam types → mock sees one `batch()` of 4 statements; simulate a failing pref insert → assert the user INSERT is not visible after the error (mock: throw inside batch, assert no partial state — the mock runs sequentially, so assert the endpoint returns 500 and your mock recorded the failure point; the atomicity guarantee itself is D1's).

**Verify:** vitest passes.
**Commit:** `fix(auth): batch registration user + exam preference writes` (only with user's explicit approval).

### Task 9 — OAuth registration: batch the user + provider + preferences writes

`oauth.ts` (~419-464): INSERT user, INSERT `user_oauth_providers`, loop INSERT prefs. Same partial-write hazard.

**Files:** `workers/api/oauth.ts` (~419-465)

- [ ] Same pattern as Task 8: build `statements[]` (user INSERT, provider INSERT, pref INSERT OR IGNOREs) and run one `c.env.DB.batch(statements)`. Preserve the `INSERT OR IGNORE` on prefs.
- [ ] If the surrounding code creates a session/JWT after the inserts, keep that outside the batch.

**Verify:** `cd workers && npx vitest run` (full suite) passes; manual grep shows a single `.batch(` in the oauth register path.
**Commit:** `fix(oauth): batch Google registration writes` (only with user's explicit approval).

### Task 10 — Affiliate referral: batch the multi-write

`affiliates.ts` (~1030-1075): INSERT referral, UPDATE affiliate stats, UPDATE referred user, UPDATE affiliate XP — ~4 sequential writes.

**Files:** `workers/api/affiliates.ts` (~1030-1062)

- [ ] Batch the four statements (`affiliate_referrals` INSERT, `affiliate_profiles` stats UPDATE, `users.referred_by` UPDATE, `users.affiliate_xp` UPDATE) via `c.env.DB.batch([...])`. NOTE: `referred_by` and `affiliate_xp` exist only via migration `021_subscription_affiliate_system.sql` — flag in Phase 5 handoff.
- [ ] Leave `updateChallengeProgress` and `checkAffiliateAchievements` outside the batch (they are helper subsystems with their own queries; best-effort post-commit).

**Verify:** full vitest suite passes.
**Commit:** `fix(affiliates): batch referral record writes` (only with user's explicit approval).

### Task 10b — Referral attribution identity + tutoring verify claim-first (plan amendment, added 2026-08-04)

Two HIGH follow-ups from the Phase 2 final whole-branch review, same money-path blast radius:

1. **Commission hijack:** `affiliates.ts` `/process-referral` (~:910-980) accepts `newUserId` (and code) from the request body — any authenticated user can attach ANY unattributed user as a referral of ANY valid code, writing `users.referred_by` on the victim; through `processAffiliateCommission` (payments verify path) that hijacks commission on a stranger's payment. Fix: derive the referred user from `c.get('userId')` (never the body); keep `code` from the body (that's the legitimate input). Reject if the user already has `referred_by` set (current behavior — verify). Also `/referral/trial-started` (~:1004-1012): body userId → context identity.
2. **Tutoring double-credit race:** `tutoring.ts` verify flow (~:1713-1768) credits `teacher_earnings.pending_tutoring` after a `status === 'paid'` read-check with no status-guarded claim — the exact race class Phase 2 Task 2 fixed for subscriptions. Apply the Phase 2 pattern: make the tutoring_payments status UPDATE the atomic claim (`WHERE reference = ? AND status != 'paid'` — verify actual status values in the code), check `meta.changes`, and on 0 return the already-processed response BEFORE any earnings credit. Keep its existing ownership + exact-amount checks.

**Files:** `workers/api/affiliates.ts`, `workers/api/tutoring.ts`, tests under `workers/api/__tests__/`
- [ ] `/process-referral`: identity from `c.get('userId')`; test: body `newUserId: 'victim'` + attacker token → referral recorded (or rejected) for the ATTACKER, victim's `referred_by` never written (assert binds).
- [ ] `/referral/trial-started`: identity from context.
- [ ] `tutoring.ts` verify: claim-first status-guarded UPDATE + `meta.changes` early return; test: mock returning `changes: 0` on the claim → already-processed response, zero `teacher_earnings` writes.

**Verify:** full vitest suite passes; `grep -n "newUserId" workers/api/affiliates.ts` → no body-driven writes remain.
**Commit:** `fix(affiliates,tutoring): referral identity from JWT; claim-first tutoring verify` (only with user's explicit approval).

---

## Query performance

### Task 11 — Chat `/rooms`: kill the N+1

`chat.ts` (~59-140): base query (LIMIT 100) then per-room `Promise.all` loop issuing 1 last-message query + 1 other-user query for DMs → up to ~201 queries per request.

**Files:** `workers/api/chat.ts` (~59-140)

- [ ] Extend the existing base query with correlated subqueries (pattern already used for `member_count`/`unread_count` — follow it):

```sql
SELECT
  cr.id, cr.name, cr.description, cr.type, cr.subject_id, cr.avatar_url,
  cr.is_archived, cr.max_members, cr.created_by, cr.created_at, cr.updated_at,
  crm.role as my_role, crm.last_read_at,
  (SELECT COUNT(*) FROM chat_room_members WHERE room_id = cr.id) as member_count,
  (SELECT COUNT(*) FROM chat_messages WHERE room_id = cr.id AND created_at > crm.last_read_at AND sender_id != ?) as unread_count,
  (SELECT cm.content FROM chat_messages cm
    WHERE cm.room_id = cr.id AND cm.is_deleted = 0
    ORDER BY cm.created_at DESC LIMIT 1) as last_message_content,
  (SELECT cm.created_at FROM chat_messages cm
    WHERE cm.room_id = cr.id AND cm.is_deleted = 0
    ORDER BY cm.created_at DESC LIMIT 1) as last_message_at,
  (SELECT u.name FROM chat_messages cm JOIN users u ON u.id = cm.sender_id
    WHERE cm.room_id = cr.id AND cm.is_deleted = 0
    ORDER BY cm.created_at DESC LIMIT 1) as last_message_sender_name,
  (SELECT u.id FROM chat_room_members m JOIN users u ON u.id = m.user_id
    WHERE m.room_id = cr.id AND m.user_id != ? AND cr.type = 'dm' LIMIT 1) as dm_other_id,
  (SELECT u.name FROM chat_room_members m JOIN users u ON u.id = m.user_id
    WHERE m.room_id = cr.id AND m.user_id != ? AND cr.type = 'dm' LIMIT 1) as dm_other_name,
  (SELECT u.avatar_url FROM chat_room_members m JOIN users u ON u.id = m.user_id
    WHERE m.room_id = cr.id AND m.user_id != ? AND cr.type = 'dm' LIMIT 1) as dm_other_avatar
FROM chat_rooms cr
INNER JOIN chat_room_members crm ON cr.id = crm.room_id AND crm.user_id = ?
WHERE cr.is_archived = 0
ORDER BY cr.updated_at DESC
LIMIT 100
```

Bind `(userId, userId, userId, userId, userId)` in order. Reshape rows in JS into the existing response shape (`lastMessage`, `otherUser`) so the client contract is unchanged; delete the `Promise.all` loop.
- [ ] Test `workers/api/tests/chat-rooms.test.ts`: mock counts distinct prepared SQL shapes → exactly 1 query for the route.

**Verify:** vitest passes; code contains no `.map(async` in the `/rooms` handler.
**Commit:** `perf(chat): single-query /rooms with correlated subqueries` (only with user's explicit approval).

### Task 12 — Quick-play grading: one IN-query + input validation

`quickplay.ts` /submit (~173-267): per-answer `SELECT correct_answer ... WHERE id = ?` (audit finding 4), plus `answers` unvalidated (empty array → `correctCount / answers.length` = NaN stored in `score` and activity feed) and `timeTaken` unvalidated (negative → guaranteed speed bonus) (audit finding 6).

**Files:** `workers/api/quickplay.ts` (~173-267)

- [ ] Validate before touching the DB:

```ts
if (!Array.isArray(answers) || answers.length === 0 || answers.length > 100) {
  return c.json({ success: false, error: 'answers must be a non-empty array (max 100)' }, 400);
}
for (const a of answers) {
  if (!a || typeof a.questionId !== 'string' || typeof a.answer !== 'string') {
    return c.json({ success: false, error: 'Invalid answer shape' }, 400);
  }
}
const elapsed = typeof timeTaken === 'number' && Number.isFinite(timeTaken)
  ? Math.min(Math.max(Math.round(timeTaken), 0), 3_600_000) // clamp 0..60min
  : 0;
```

- [ ] Replace the per-answer loop with one query:

```ts
const ids = [...new Set(answers.map((a) => a.questionId))];
const { results: questions } = await c.env.DB.prepare(
  `SELECT id, correct_answer, explanation FROM questions WHERE id IN (${ids.map(() => '?').join(',')})`
).bind(...ids).all();
const byId = new Map((questions as any[]).map((q) => [q.id, q]));

let correctCount = 0;
const results = answers.map((a) => {
  const q = byId.get(a.questionId);
  const isCorrect = q ? q.correct_answer === a.answer : false;
  if (isCorrect) correctCount++;
  return {
    questionId: a.questionId,
    correct: isCorrect,
    correctAnswer: q?.correct_answer ?? null,
    explanation: q?.explanation ?? null,
  };
});
```

- [ ] Use `elapsed` (not raw `timeTaken`) in the speed-bonus computation and the session UPDATE.
- [ ] Tests `workers/api/tests/quickplay-submit.test.ts`: (a) empty `answers: []` → 400, no NaN written; (b) `timeTaken: -5000` → 200 but `speedBonus` excluded (assert bound `time_taken` is `0` and XP equals base+accuracy only); (c) 10 answers → exactly 1 questions query in `db.calls`.

**Verify:** vitest passes.
**Commit:** `fix(quickplay): batch grade answers, validate submit payload` (only with user's explicit approval).

### Task 13 — Teacher bonuses: aggregate across teachers in one pass

`teacher-bonuses.ts` (~498-565): loops over teachers issuing 3+ queries each (qualified students, referral count, tier lookup) plus an upsert.

**Files:** `workers/api/teacher-bonuses.ts` (~490-580)

- [ ] Replace the per-teacher queries with one grouped query for all teachers:

```sql
SELECT
  ap.user_id AS teacher_id,
  ar.referred_user_id AS student_id,
  COUNT(DISTINCT strftime('%Y-%m', pt.verified_at)) AS active_months,
  COALESCE(SUM(pt.amount), 0) AS total_payments
FROM affiliate_referrals ar
JOIN affiliate_profiles ap ON ar.affiliate_id = ap.id
LEFT JOIN payment_transactions pt ON pt.user_id = ar.referred_user_id
  AND pt.status = 'success'
  AND strftime('%Y', pt.verified_at) = ?
WHERE ar.status = 'converted'
GROUP BY ap.user_id, ar.referred_user_id
```

Group rows in JS by `teacher_id`, apply the `active_months >= 3` filter in JS, fetch all active tiers once (`SELECT * FROM teacher_bonus_config WHERE year = ? AND is_active = 1`), pick tiers in JS, and collect all `teacher_year_end_bonuses` upserts into a single `c.env.DB.batch([...])`.
- [ ] The total-referred count per teacher: one grouped query (`GROUP BY ap.user_id`) instead of per-teacher.

**Verify:** `cd workers && npx vitest run` passes; handler contains no `for (const teacher` with awaits inside (query count is now O(1)).
**Commit:** `perf(teacher-bonuses): compute year-end bonuses with grouped queries` (only with user's explicit approval).

### Task 14 — `parseLimit` helper + cap all limit parsing at 100

Verified uncapped `parseInt(c.req.query('limit') || ...)` sites (audit's "~37 sites" / `index.ts:8385` drifted — this is the real list):
`activityfeed.ts:26, 87, 134`; `affiliates.ts:458, 538, 602, 663`; `chat.ts:704`; `events.ts:337`; `index.ts:2000, 2739, 2984, 3004, 3074, 3189, 3372, 3574, 4020, 4054, 4557, 5633, 5721, 10086, 10160`; `learningpath.ts:26`; `library.ts:152, 284, 443, 818`; `moderation.ts:83, 337, 964`; `notifications.ts:32`; `payments.ts:841`; `quickplay.ts:289`. (Already capped: `index.ts:7515, 7635, 7754, 7815, 7880` — leave them.)

**Files:** `workers/api/http.ts` (new) + every file above

- [ ] Create `workers/api/http.ts`:

```ts
import type { Context } from 'hono';

/** Parse a ?limit query param, clamped to [1, max]. */
export function parseLimit(c: Context, fallback = 20, max = 100): number {
  const raw = parseInt(c.req.query('limit') || String(fallback), 10);
  if (!Number.isFinite(raw) || raw < 1) return fallback;
  return Math.min(raw, max);
}
```

- [ ] At each listed site replace `const limit = parseInt(c.req.query('limit') || '20');` with `const limit = parseLimit(c, 20);` (preserve each site's existing default) and add the import.
- [ ] Grep-sweep: `grep -rn "parseInt(c.req.query('limit')" workers/api --include='*.ts'` → only the 5 pre-capped `Math.min` sites remain.

**Verify:** grep sweep clean; full vitest suite passes.
**Commit:** `fix(api): clamp limit query params via parseLimit helper` (only with user's explicit approval).

### Task 15 — Paginate `/admin/users`; chunk trial-expiry job

`index.ts` (~6432): `adminApp.get('/users')` SELECTs the whole users table and `JSON.parse`s per row. `subscriptions.ts` (~476-486): loads ALL expired trials then updates one by one.

**Files:** `workers/api/index.ts` (~6431-6452), `workers/api/subscriptions.ts` (~473-505)

- [ ] `/admin/users`: accept `page`/`limit` via `parseLimit(c, 50)`; run `SELECT ... ORDER BY created_at DESC LIMIT ? OFFSET ?` plus `SELECT COUNT(*) as total FROM users`; return `{ success: true, data: { users, total, page, limit } }`. This is a response-shape change — check the admin UI caller in `src/` and update it in the same commit (grep `src` for `/admin/users`).
- [ ] Trial expiry: add `LIMIT 500` to the expired-trials SELECT (chunk guard), and replace the per-trial `UPDATE user_trials` + `UPDATE users` pairs with one `c.env.DB.batch([...])` of all statements.
- [ ] Test `workers/api/tests/admin-users.test.ts`: request `?limit=1000000` → mock sees `LIMIT 100`; response includes `total`.

**Verify:** vitest passes; `grep -n "FROM users\n      ORDER BY created_at DESC" workers/api/index.ts` region shows a `LIMIT`.
**Commit:** `fix(api): paginate admin user list, chunk+batch trial expiry` (only with user's explicit approval).

### Task 16 — N+1 sweep (remaining sites, enumerated)

Not rewritten individually; fix with the same IN-clause/correlated-subquery patterns as Tasks 11-13. Exact locations verified 2026-08-03:

**Files / sites:**
- [ ] `chat.ts:632-655` — DM list details: per-DM other-user + last-message + unread-count (3N queries). Correlated subqueries as in Task 11.
- [ ] `chat.ts:731-750` — message reactions + reply-to: per-message reaction GROUP query and per-message reply lookup. One `WHERE message_id IN (...)` grouped by `message_id, emoji`, and one `WHERE cm.id IN (...)` for replies; stitch in JS.
- [ ] `affiliates.ts:1154-1180` — `checkAffiliateAchievements`: per-achievement INSERT/UPDATE loop. Bounded by the (small) achievements table — batch the writes with `db.batch([...])`, no query rewrite needed.
- [ ] `learningpath.ts` residual per-subject weak/strong topic query (from Task 5): one grouped query `WHERE t.subject_id IN (...)`, stitch in JS.

**Verify:** `grep -n "\.map(async" workers/api/chat.ts workers/api/learningpath.ts` → no matches in these handlers; full vitest suite passes.
**Commit:** `perf(api): eliminate remaining N+1 loops in chat/learningpath/affiliates` (only with user's explicit approval).

---

## Recordings

### Task 17 — Recording upload: size cap + failure-safe ordering

`recordings.ts` (~540-605): `await c.req.arrayBuffer()` with no size limit → Worker memory blowup; then R2 `put` then DB UPDATE (non-atomic — R2 object can exist with no DB pointer).

**Files:** `workers/api/recordings.ts` (~540-605)

- [ ] Add a named constant near the top of the file: `const MAX_RECORDING_BYTES = 100 * 1024 * 1024; // 100MB`.
- [ ] Before reading the body, check the header; after reading, verify actual size:

```ts
const declared = Number(c.req.header('Content-Length') || 0);
if (declared > MAX_RECORDING_BYTES) {
  return c.json({ success: false, error: 'File exceeds 100MB limit' }, 413);
}
const body = await c.req.arrayBuffer();
if (body.byteLength > MAX_RECORDING_BYTES) {
  return c.json({ success: false, error: 'File exceeds 100MB limit' }, 413);
}
```

- [ ] After the R2 `put`, wrap the DB UPDATE in try/catch: on DB failure, `await c.env.RECORDINGS_BUCKET.delete(path)` (best-effort compensating delete) and log `Orphan risk: failed to link R2 object ${path}` before returning 500.

**Verify:** `grep -n "MAX_RECORDING_BYTES" workers/api/recordings.ts` → 3 matches; vitest suite passes.
**Commit:** `fix(recordings): cap upload size, compensate on DB failure` (only with user's explicit approval).

### Task 18 — Recording delete: actually delete from R2

`recordings.ts` (~708-726): the R2 delete block is commented out ("uncomment if you want hard delete") → every soft-deleted recording leaks R2 objects forever.

**Files:** `workers/api/recordings.ts` (~700-730)

- [ ] Replace the commented block with a real cleanup that runs after the status UPDATE, using `c.executionCtx.waitUntil` so the response isn't blocked, and logs orphans instead of failing the request:

```ts
const filesToDelete = [
  recording.canvas_events_url,
  recording.audio_url,
  recording.webcam_url,
  recording.thumbnail_url,
].filter(Boolean) as string[];

c.executionCtx.waitUntil((async () => {
  for (const url of filesToDelete) {
    const path = url.replace('/api/recordings/files/', '');
    try {
      await c.env.RECORDINGS_BUCKET.delete(path);
    } catch (err) {
      console.error(`Orphaned R2 object ${path}:`, err);
    }
  }
})());
```

- [ ] Ensure the SELECT that loads `recording` includes the four `*_url` columns (check the current SELECT list).

**Verify:** `grep -n "RECORDINGS_BUCKET.delete" workers/api/recordings.ts` → present and uncommented; vitest passes.
**Commit:** `fix(recordings): delete R2 objects when recording is deleted` (only with user's explicit approval).

---

## Cleanup & hygiene

### Task 19 — Dead/duplicate code: `/exam-types`, `getDemoDataSQL`, demo cleanup divergence

Verified: `publicApp.get('/exam-types')` is registered twice — `index.ts:991` (`SELECT *`, first registered → wins in Hono) and `index.ts:1856` (explicit column list, unreachable). `getDemoDataSQL` (`index.ts:888-894`) is dead (grep: only the definition). `demoUtils.ts:65-130` exports the 33-table `DEMO_DATA_TABLES` + `cleanupExpiredDemoData` (imported nowhere — chat/counselor/tutor import only `getDemoDataFlags, isDemoUserId`), while `index.ts:10277-10332` redefines a 26-table list missing `chat_rooms, chat_room_members, counselor_conversations, wellbeing_logs, wellbeing_alerts, tutor_feedback, counselor_feedback` — the cron never cleans those 7 tables.

**Files:** `workers/api/index.ts`, `workers/api/demoUtils.ts`

- [ ] Delete the FIRST `/exam-types` handler (`index.ts:991-1007`, the `SELECT *` one) so the explicit-column handler at ~1856 becomes effective. (`SELECT *` also leaks `country`/`created_at` unnecessarily — the explicit version is the one to keep.)
- [ ] Delete `getDemoDataSQL` (`index.ts:888-894`). Keep `getDemoDataFlags` (used at 7+ sites).
- [ ] In `index.ts`: delete the local `DEMO_DATA_TABLES` (~10277-10303) and local `cleanupExpiredDemoData` (~10307-10332); add `import { cleanupExpiredDemoData } from './demoUtils';` and call it from the `scheduled` handler (~10343) exactly as the local one was called. Single source of truth = the `demoUtils.ts` superset.
- [ ] Confirm no other file defines `DEMO_DATA_TABLES`: `grep -rn "DEMO_DATA_TABLES" workers/api` → only `demoUtils.ts`.

**Verify:** `grep -c "publicApp.get('/exam-types'" workers/api/index.ts` → `1`; the two greps above clean; `npx tsc --noEmit` (if workers tsconfig exists) or full vitest run passes.
**Commit:** `chore(api): dedupe /exam-types, unify demo cleanup on demoUtils superset` (only with user's explicit approval).

### Task 20 — Health endpoint: stop leaking environment, standardize envelope

`index.ts:982-984` returns `{ status: 'ok', environment: c.env.ENVIRONMENT }` — leaks env and breaks the platform's `{ success, data }` envelope.

**Files:** `workers/api/index.ts` (~980-985)

- [ ] Replace with:

```ts
publicApp.get('/health', (c) => {
  return c.json({ success: true, data: { status: 'ok' } });
});
```

- [ ] Grep `src/` and `lynx-pitch/` for anything reading `environment` from `/health` before deleting the field (update the caller in the same commit if found).

**Verify:** `grep -n "ENVIRONMENT" workers/api/index.ts | grep health` → no matches near the health handler.
**Commit:** `fix(api): standardize /health envelope, drop environment leak` (only with user's explicit approval).

### Task 21 — Registration error semantics + guarded JSON parsing

Verified: register catch (`index.ts:1231-1234`) returns HTTP 400 for server errors (DB failures masquerade as client errors). Unguarded `await c.req.json()` outside/before try blocks: register (`index.ts:1069` — audit said 1066, drifted), login (`index.ts:1239`), `oauth.ts:149` (`/google/init`), `oauth.ts:221` (`/google/callback`). A malformed JSON body throws an unhandled 500 HTML error instead of a clean 400.

**Files:** `workers/api/index.ts`, `workers/api/oauth.ts`

- [ ] Registration catch: `return c.json({ success: false, error: 'Registration failed' }, 500);` (keep the `console.error`).
- [ ] Add a tiny helper (top of `index.ts`, export for `oauth.ts`):

```ts
export async function parseJsonBody(c: Context): Promise<Record<string, any> | null> {
  try {
    return await c.req.json();
  } catch {
    return null;
  }
}
```

At each of the 4 sites: `const body = await parseJsonBody(c); if (!body) return c.json({ success: false, error: 'Invalid JSON body' }, 400);` then destructure from `body`. (For login/register keep the existing destructuring, just sourced from the guarded parse.)
- [ ] Test `workers/api/tests/auth-json.test.ts`: POST `/auth/login` with body `not-json` → 400 JSON, not a 500; POST `/auth/register` with forced DB error in mock → 500.

**Verify:** vitest passes; `grep -n "await c.req.json()" workers/api/index.ts workers/api/oauth.ts | grep -v try` sites reduced to guarded ones.
**Commit:** `fix(auth): 500 on server errors, 400 on malformed JSON bodies` (only with user's explicit approval).

---

## Verification

Run after all tasks, from `workers/`:

```sh
# 1. No phantom columns remain anywhere in the API
grep -rnE "SET xp |SELECT xp[, ]|userData\?\.xp\b|SELECT streak FROM users" api --include='*.ts' | grep -vE "xp_points|streak_days"
#    Expected: no output

grep -rn "user_questions" api --include='*.ts'
#    Expected: no output

grep -rn "s\.exam_type =" api --include='*.ts'
#    Expected: no output

# 2. Full test suite (Phase 0 runner)
npx vitest run
#    Expected: all suites green, including quest-claim double-claim,
#    tournament-join capacity, quickplay validation, chat-rooms single-query

# 3. Type check (if workers has a tsconfig; otherwise skip)
npx tsc --noEmit
#    Expected: no errors

# 4. Manual smoke against wrangler dev (optional but recommended)
npm run dev &
curl -s localhost:8787/api/health            # -> {"success":true,"data":{"status":"ok"}}
curl -s localhost:8787/api/exam-types        # -> explicit column list, success envelope
```

## Schema-change handoff to Phase 5

No new migrations are introduced by this phase. Items Phase 5 must account for during the squash:

1. **Coins economy — decision: removed (YAGNI).** Code no longer reports `coins` on quest claim. `quest_templates.coin_reward` still exists and is still SELECTed by quest list endpoints; Phase 5 decides whether to drop the column or build a real coins ledger. If dropped, remove the 5 `qt.coin_reward` SELECT references in `index.ts` (2231, 2278, 2320, 2364, 2420).
2. **`users.affiliate_xp` and `users.referred_by` exist only via migration `021_subscription_affiliate_system.sql` (ALTER TABLE).** Runtime code (affiliates.ts) depends on them; the squashed schema MUST include these columns in the `users` CREATE TABLE or the affiliate system breaks.
3. **Demo-data columns:** `is_demo_data` / `expires_at` are used by `demoUtils.cleanupExpiredDemoData` across 33 tables. The squashed schema must keep these columns on every table in `DEMO_DATA_TABLES` or the cron silently no-ops (it swallows per-table errors by design).
4. **`exam_readiness` upsert (learningpath.ts:164):** verify during the squash whether `exam_readiness.exam_type` stores a slug or an id and reconcile with `subjects.exam_type_id` semantics; flagged in Task 4.
5. Code now relies on `meta.changes` semantics for conditional UPDATEs/INSERT...SELECT (quest claim, tournament join) — D1 guarantees these; nothing to migrate, but don't let the squash change `user_quests.status` enum values (`completed`/`claimed`) or `tournament_participants` uniqueness assumptions.

## Out of scope

- Adding a real coins ledger / virtual currency (decision recorded: removed).
- Any schema change whatsoever (columns, indexes, new tables) — all deferred to Phase 5. Notably: an index supporting the correlated subqueries in Task 11 (`chat_messages(room_id, created_at)`) would help at scale; flag to Phase 5, do not migrate here.
- Fixing auth context semantics (Phase 1) and test-runner setup (Phase 0).
- Frontend pagination UI polish beyond making `/admin/users` callers work with the new envelope.
- Rate-limit policy changes, Turnstile behavior, email notification logic.
- R2 lifecycle rules / orphan reaping jobs (Task 18 logs orphans; a reaper is a separate ops task).
