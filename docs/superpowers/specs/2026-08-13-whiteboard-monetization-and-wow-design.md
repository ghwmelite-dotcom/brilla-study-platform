# AI Whiteboard — Monetization (Phase A) + Wow Pass (Phase B) Design

Date: 2026-08-13
Status: Approved direction; pending spec review
Author: Kimi + ghwmelite

## Context

The revision classroom's AI whiteboard is a scripted-slideshow renderer:
`POST /revision-classroom/lessons/:id/whiteboard-teach` prompts Workers AI
(Llama 3.3 70B) for a typed JSON drawing script; the frontend
(`src/components/AIWhiteboardTeacher.tsx`) replays it on a fabric.js canvas
with browser `speechSynthesis` voiceover.

Audit findings driving this design:

- The whiteboard endpoint is **ungated** — any authenticated free user can call it.
- Playback has a **broken auto-advance** (`useEffect` depends on a callback whose
  identity changes every render → the pending step timeout is cleared each cycle).
- Invalid/truncated AI JSON (common at `max_tokens: 4096` for a whole lesson)
  **silently** swaps in a hardcoded fallback lesson with literal "Key Concept 1" text.
- No math typesetting (ASCII fractions), no draw-on animation, one blocking
  generation call, no content reuse (every view = full LLM call).
- Free-tier chat AI endpoints (`teach`, `ask`, `checkpoint/generate`) are unlimited;
  `tokens_used` is recorded in `revision_ai_interactions` but never enforced.
- Admin can only grant premium indirectly via `extend-trial`;
  `GET /admin/users/:id/subscription` 500s (queries nonexistent `user_subscriptions`).
- Immersive mode's "AI is drawing…" indicator is wired to nothing (theater), and
  its mobile double-tap handler throws on `touchend`.

Existing infrastructure reused (do not rebuild):

- `isPremiumUser(userId, db)` — `workers/api/usage-limits.ts:55` (paid tier w/ valid
  expiry, active trial, or admin/teacher role ⇒ premium).
- `revision_ai_interactions` — already logs every teach/ask/whiteboard call with
  `user_id`, `interaction_type`, `tokens_used`, `created_at`.
- Tier storage — `users.subscription_tier_id` / `subscription_expires_at`
  (+ `trial_expires_at`); tiers in `subscription_tiers`.
- Entitlement descriptor — `GET /api/subscriptions/features`
  (`workers/api/subscriptions.ts:530`).
- Admin patterns — `POST /admin/users/:id/extend-trial` (`index.ts:7402`) and
  `/add-credits` (`index.ts:7493`): validation + `logAudit` + UI modal in
  `src/pages/UserManagement.tsx` + actions in `src/stores/authStore.ts`.
- 403 upgrade pattern — essays submit (`index.ts:4524-4547`) returns
  `{ success:false, error, upgradeRequired:true }`.

## Goals

Phase A (monetize + stabilize):
1. Whiteboard generation is premium-only; free users see a polished upgrade card.
2. Free users get a daily allowance of AI chat interactions in the revision
   classroom; premium users are unlimited.
3. Admins can set a user's subscription tier + expiry directly (and the broken
   subscription-details endpoint works).
4. Playback bugs that make the current whiteboard embarrassing are fixed.

Phase B (wow pass):
5. Lessons render stroke-by-stroke with a real voice, real math typesetting,
   and instant load for repeat views.
6. AI output is structurally validated and composed from reliable visual
   primitives — quality is no longer at the mercy of raw coordinate guessing.

Non-goals (Phase C, explicitly deferred): student-draws/AI-sees two-way
interactivity, point-and-ask, embedded live checkpoints, real-time study-room
collaboration (needs Durable Objects), immersive-mode AI layer wiring.

## Decisions (confirmed with user)

- Free chat allowance: **daily cap**, 10 AI interactions/day, resets at UTC
  midnight (mirrors the existing `DAILY_QUESTION_LIMIT = 10` pattern).
- Whiteboard access: **all paid tiers** (student monthly/yearly, teacher
  monthly/yearly) plus active trials — i.e. exactly `isPremiumUser()`.
- Sequencing: A ships first, B immediately after; both precede any C work.

---

## Phase A — Gate, Tokenize, Admin, Stabilize

### A1. Paywall the whiteboard

Worker (`workers/api/revision-classroom.ts`):

- `POST /lessons/:lessonId/whiteboard-teach` — after auth/lesson lookup, call
  `isPremiumUser(c.get('user').userId, c.env.DB)`. Non-premium ⇒
  `403 { success:false, error:'The AI Whiteboard is a premium feature.', upgradeRequired:true }`.
- Also record `tokens_used` on this endpoint (currently omitted) so usage
  accounting stays complete.
- `GET /whiteboard-types` stays open (metadata only; the frontend uses it to
  render the locked teaser).

Entitlement descriptor (`workers/api/subscriptions.ts` `/features` response):
add `whiteboard: boolean` (= premium) and `dailyAiLimit: number` (10 for free,
-1 for premium) so the frontend has one source of truth.

Frontend:

- `src/stores/subscriptionStore.ts` — extend `FeatureAccess` type with the two
  new fields.
- `src/pages/RevisionClassroom.tsx` whiteboard mode: if `!features.whiteboard`,
  render an upgrade card in place of `AIWhiteboardTeacher` — short pitch
  ("Watch the AI teacher draw and explain — premium"), the 4 lesson-type icons
  greyed as a teaser, CTA → `/pricing`. If the API still returns
  `upgradeRequired` (race/tampering), swap to the same card.
- The Chat/Whiteboard toggle stays visible; the Whiteboard button shows a small
  lock badge for free users (discoverable, not hidden).

### A2. Tokenized free chat (daily AI allowance)

Worker:

- New helpers in `workers/api/usage-limits.ts`:
  `getDailyAiInteractions(userId, db)` — `SELECT COUNT(*) FROM revision_ai_interactions
  WHERE user_id = ? AND (interaction_type LIKE 'teach_%' OR interaction_type IN ('student_question','checkpoint'))
  AND date(created_at) = date('now')`
  (reuses the existing audit table; **no schema change**), and
  `checkAiAllowance(userId, db)` → `{ allowed, remaining }` where premium ⇒
  `{ true, -1 }`, else remaining = 10 − count.
- Enforce in `revision-classroom.ts` on `POST .../teach`, `POST .../ask`,
  `POST .../checkpoint/generate`: when not allowed ⇒
  `403 { success:false, error:"You've used today's free AI explanations. Upgrade for unlimited, or come back tomorrow.", aiLimitReached:true, remaining:0 }`.
  (`whiteboard-teach` needs no metering — it is premium-only.)
- Interaction types recorded today: teach writes `teach_<phase>`
  (`revision-classroom.ts:906`), ask writes `student_question` (`:1111`).
  `checkpoint/generate` records nothing today — add an interaction insert there
  with type `checkpoint` so it is counted too. Whiteboard interactions
  (`whiteboard_*`, `:2192`) are excluded (premium-gated anyway).

Frontend:

- Classroom header shows a subtle counter for free users: "N free explanations
  left today" (from `/features` `dailyAiLimit` minus a count returned with each
  teach/ask response — add `remainingFreeToday` to those responses).
- On `aiLimitReached`, replace the chat input with an inline upgrade/come-back
  state (not a crash, not a silent failure).

### A3. Admin manual upgrade

Worker (`workers/api/index.ts`):

- New `POST /api/admin/users/:id/set-tier`, body `{ tierId, durationDays }`:
  - Validate tier exists and `is_active`; validate duration is an integer 1–3650
    days (the UI offers 30/90/365/3650 presets; 3650 = "Comp — 10 years" stands
    in for lifetime, since `isPremiumUser` requires a future expiry).
  - Set `users.subscription_tier_id`, `subscription_expires_at`
    (now + durationDays).
  - If the tier's `ai_grading_quota > 0`, top up `ai_grading_credits` by that
    quota (mirrors payment crediting, `payments.ts:469-484`).
  - `logAudit` with old tier → new tier + duration, same as extend-trial.
- Fix `GET /api/admin/users/:id/subscription`: read `users.subscription_tier_id`/
  `subscription_expires_at` joined to `subscription_tiers`, latest `user_trials`
  row, and latest `payment_transactions` rows. Delete the `user_subscriptions`
  query (table does not exist).

Frontend:

- `src/pages/UserManagement.tsx` subscription modal: add tier dropdown +
  duration input (or "No expiry") + Apply, next to Extend Trial / Add Credits.
- `src/stores/authStore.ts`: `setUserTier(userId, tierId, durationDays)` action
  following the existing extend/add-credits pattern; refresh the modal's
  subscription details after applying.

### A4. Whiteboard stabilization fixes

- **Play loop** (`AIWhiteboardTeacher.tsx:427-457`): make the auto-advance effect
  depend only on `[isPlaying, currentStepIndex]`; schedule the next step with a
  single timeout; draw imperatively without a state-derived callback in the dep
  array. Dedupe: `drawStep` must not append duplicate fabric objects on re-run.
- **Honest fallback**: worker validates parsed JSON (must have non-empty `steps`;
  each step non-empty `commands`; command `type` in whitelist; numeric props
  clamped to canvas bounds). On failure it still returns default content but with
  `fallback: true`; the frontend shows "Custom visual unavailable — showing a
  generic overview" instead of presenting canned content as tailored.
- **TTS hygiene**: cancel `speechSynthesis` on unmount and on Chat/Whiteboard
  mode toggle.
- **Canvas sizing**: apply content `canvasSize`/`backgroundColor` when content
  arrives after mount (re-init or setDimensions), not only at first mount.
- **`goToStep` highlights**: apply the step's highlights on manual navigation and
  clear stale glow when leaving a step.
- **Immersive theater removal** (cheap, credibility-critical): hide the "AI is
  drawing…" indicator in `ImmersiveClassroom.tsx` until the layer is real, and
  fix the `touchend` double-tap crash (`e.touches` is empty at touchend — read
  `changedTouches`).

### A5. Phase A tests

- Worker unit tests (pattern: `workers/api/__tests__/quickplay-submit.test.ts`
  with mocked env/DB):
  - whiteboard-teach: free ⇒ 403 `upgradeRequired`; premium ⇒ 200.
  - teach/ask: free under cap ⇒ 200; at cap ⇒ 403 `aiLimitReached`; premium ⇒ 200.
  - set-tier: invalid tier ⇒ 400; valid ⇒ row updated + audit row written;
    non-admin ⇒ 403.
- Frontend: build clean; manual/probe E2E against prod (existing
  `scripts/probe-*.cjs` pattern): free test account sees upgrade card + cap
  enforcement; premium sees whiteboard; admin sets a tier and the account flips.

---

## Phase B — Wow Pass

### B1. Progressive per-step generation (replaces one-shot blocking call)

- Change the contract: `POST .../whiteboard-teach` takes `{ lessonType, stepIndex }`
  and returns **one step** (plus `totalSteps` from a tiny plan call). The frontend
  requests step 1, starts playback immediately, and prefetches step N+1 while
  step N plays.
- Kills the 4096-token truncation class entirely (each call is small), removes
  the spinner-then-maybe-fallback experience, and makes "time to first drawing"
  ~2s instead of ~15s.
- The worker keeps a per-lesson outline in the first call's response
  (`{ outline: [step titles] }`) so later steps stay coherent; outline is passed
  back with each step request (stateless worker, client-carried context like the
  existing `previousMessages` pattern).

### B2. Draw-on animation

- Every command gets an animated entrance instead of popping in:
  - `line`/`arrow`/`path`: progressive point reveal (fabric clip-path or
    stroke-dash animation).
  - `text`: word-by-word typewriter, paced to the step's `duration`.
  - shapes: quick draw/scale-in.
- One `WhiteboardAnimator` module owns timing; the step player drives it and
  waits for animation completion before starting voiceover-advance logic, so
  drawing and narration stay in sync.

### B3. Real math typesetting (KaTeX)

- Add `katex` dependency. New command type `math { latex, x, y, fontSize, color }`,
  rendered as an absolutely-positioned HTML overlay layer above the canvas
  (divs positioned from canvas coordinates; moved/scaled with canvas zoom).
- Worker prompt updated: all mathematics must be emitted as `math` commands with
  LaTeX, never as plain text. Validation: `katex.renderToString` in a try/catch —
  invalid LaTeX degrades to a text command, never a crash.

### B4. Visual primitives engine

New frontend module `whiteboardPrimitives.ts`: parametrized, always-correct
components the AI composes instead of hand-placing raw shapes:

- `axes` (with ticks/labels) + `functionPlot` (samples a parsed function —
  small in-house parser for polynomials/trig/rationals, no eval).
- `numberLine` (range, marked points).
- `fractionBar` (shaded n/d model).
- `angleFigure` / `triangle` (sides/angles labeled).
- `tableGrid` (rows×cols with cell text).

New command type `primitive { name, params }`. The worker prompt is rewritten to
prefer primitives, with a compact catalog and JSON-schema-ish parameter docs.
Validation layer: unknown primitive/params ⇒ drop the command with a logged
warning; all coordinates clamped to canvas bounds. This is the quality floor:
the model can be *wrong pedagogically* but never *visually broken*.

### B5. Real voice (TTS)

- Replace browser `speechSynthesis` with server-generated audio. First task is a
  spike: verify a TTS model available to this account via Workers AI
  (e.g. Deepgram Aura class) and its latency/cost.
- Endpoint `POST /revision-classroom/tts` (premium-only) → audio bytes;
  frontend plays via `Audio`, highlighting the active step.
- `speechSynthesis` remains as automatic fallback if TTS is unavailable/fails.
- If the spike shows no viable TTS on our stack, B5 degrades to: best-available
  neural browser voice + tuned rate/pitch, and the real-voice item moves to C.

### B6. Whiteboard content cache

- Before generating, look up the most recent `revision_ai_interactions` row of
  type `whiteboard_<lessonType>` for this topic (`ai_message` holds the JSON).
  Reuse across users; regenerate only on miss. Same lookup for TTS audio hashes
  if B5 lands (audio cached in R2 keyed by content hash).
- Effect: repeat views are instant and free; AI cost per *new* topic/lesson-type
  is paid once globally, not per student.

### B7. Phase B tests

- Unit: command validator (whitelist, clamps, math fallback), primitive
  renderers (params → expected fabric object counts), progressive step
  endpoint (outline coherence, per-step 200).
- E2E probe (prod): start session → whiteboard → time-to-first-drawing < 3s,
  all steps render, no console errors, fallback banner appears only when forced.
- Visual QA pass on 3 representative lessons (math with fractions, physics
  diagram, biology concept map) before ship.

---

## Error handling principles (both phases)

- Every failure state is **honest and styled**: upgrade card, daily-cap notice,
  fallback banner. No silent generic content, no raw toasts for expected states.
- Worker 4xx bodies carry machine flags (`upgradeRequired`, `aiLimitReached`,
  `fallback`) so the frontend never parses English.
- AI output is untrusted: parse, validate shape, clamp numbers, whitelist types.

## Rollout & verification

1. Phase A: tests → build → worker deploy → Pages deploy → prod probes as
   free/premium/admin accounts (extend the existing `scripts/` drivers).
2. Phase B: same pipeline + the visual QA pass.
3. Each phase ships independently behind no flags (gating itself is the flag
   for whiteboard access).

## Risks / open items

- **TTS availability** on our Cloudflare account is unverified (B5 spike first).
- **`revision_ai_interactions` count query** per AI call adds a read; table is
  small today. If it grows hot, add `(user_id, created_at)` index via prod patch
  (canonical schema is generator-owned — fold later, as with patches 094-096).
- **KaTeX overlay vs canvas zoom/fullscreen**: overlay positions must track
  canvas transforms; covered by B3 implementation + QA, but it is the most
  fiddly frontend piece in B.
- Canonical schema drift: this design deliberately makes **zero schema changes**
  (allowance reuses `revision_ai_interactions`; set-tier uses existing columns).
