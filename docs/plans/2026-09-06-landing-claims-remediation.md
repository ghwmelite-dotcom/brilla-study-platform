# Landing Page Claims — Remediation & Build Spec

**Date:** 2026-09-06 · **Status:** For decision · **Source:** full-claims audit of `src/pages/Landing.tsx` vs the codebase (65 claims classified REAL / EXAGGERATED / FICTION; evidence per claim in the audit report).

## How to read this

- **Tier 0** — copy/config fixes: the claim is wrong or unverifiable; correct copy costs almost nothing. Ship first.
- **Tier 1** — build specs for fiction worth building (each has a real subsystem to hang off).
- **Tier 2** — large/content-heavy items; schedule deliberately.
- **Broken-now** — shipped UI calling a nonexistent backend. Users can hit this today.

---

## ⚠️ Broken-now (users can hit these)

### B-0. Study Groups card → dead API
`src/stores/studyGroupStore.ts` calls `/api/study-groups/*`; **no such routes exist** (tables exist in
schema only). The Community section advertises it and the UI is reachable.
**Decision needed:** hide the UI until built (S) — or build per Tier 1.1 (M). Recommended: hide now, build next.

### B-1. Pricing contradiction (revenue-critical)
Landing `PRICING_CONFIG`: Student GHS 50/mo (480/yr), Teacher GHS 75/mo (720/yr).
Billing DB (`seed_base.sql:78`, what `payments.ts` actually charges): Basic GHS 15/mo, Premium GHS 35/mo, School GHS 500/mo.
**Fix (S):** align `src/config/landing.ts` PRICING_CONFIG + pricing section copy to the DB tiers, or run a DB price
migration if the landing prices are the intended ones. Owner decision: which price list is real?

---

## Tier 0 — honest-copy fixes (S each, ship as one PR)

| Claim today | Replace with |
|---|---|
| "Ghana's #1 Exam Prep Platform" | "Built for Ghanaian students" (drop "#1") |
| "Trusted by Schools" trust chip | "Free to start" |
| "7-Day Free Trial" (TRIAL_CONFIG) | **"14-Day Free Trial"** — code already grants 14 days (`subscriptions.ts:243`); copy under-sells |
| "∞ Voice Conversations" | "Unlimited on Premium" |
| "Past Papers (2015–2024)" | "Past Papers (2023–2024)" (46 papers exist) until Tier 2 content lands |
| IGCSE/A-Level "160 questions / 320 total / 100% Cambridge Aligned" | Live counts from DB (actuals exceed claims: 225 + 270 = 495); drop "100%" |
| "Live availability shown for each subject" | Fetch counts from `exam-boards` API or drop "live" |
| "500+ Pre-made Cards" / "95% Retention Rate" | "Pre-made decks for core subjects" / drop retention number (40 cards exist) |
| "Create custom flashcards / ∞ Custom Cards" | drop until Tier 1.3 ships |
| Battle section: "Ranked matchmaking", "Win streaks bonus", "Team chat", "Seasonal leagues", "School rankings" | "Challenge any student", "Weekly races", "House rankings" (House Cup is real) |
| "Real-time / Live" battles | "Live score updates" (it's 2s polling) |
| "50+ Chat Rooms" / "142 online" / "10K+ Active Students" / "500+ Study Groups" | "Subject chat rooms" / drop presence numbers / wire real COUNT(*)s |
| "Moderated 24/7" | "Moderated community" |
| "GHS 50–200/hour typical" (tutoring) | "Set your own rates" |
| "AI-powered score prediction", "B2 with 72% confidence" mock copy | "Grade estimate based on your accuracy" |
| "Smart Practice — adaptive questions" | "Mastery tracking with smart recommendations" |
| Tutoring "Video Calls with screen sharing" | "Video via Zoom/Meet link" |
| Parents "Weekly performance reports in your inbox" | "AI counselor reports in your dashboard" until Tier 1.2 ships |
| Teachers "School dashboard for your whole department" | "Class dashboard" |
| "50+ Subjects Covered" | Recount prod (Aug dump: 44 with questions of 73 rows) and state the real number |
| Testimonials (invented quotes naming real schools: Presec, Wesley Girls, Mfantsipim) | Remove until real ones are collected |
| Year-End Bonus | Add "min. 3 active months" (exists in config, undisclosed) |

---

## Tier 1 — build specs (fiction worth building)

### 1.1 Study Groups (M) — fixes B-0
Schema tables already exist. Build: `workers/api/study-groups.ts` — CRUD, membership (join/leave/invite),
group message feed (reuse chat.ts message shape), per-group question-set sharing.
UI: `studyGroupStore.ts` already targets `/api/study-groups/*` — align it to the new routes; Community page cards.
Acceptance: create group → invite 2 users → post message → all members see it (2s poll); group list per user.
Tests: route tests + membership caps; store contract test.

### 1.2 Weekly parent email reports (M)
Cron entry (existing scheduled handler) weekly Mon 06:00 UTC: for each parent with linked active students,
generate summary (questions attempted, accuracy, streak, study time, weakest topic) from existing progress
queries; send via the existing email infra (`marketing-campaigns.ts` has send plumbing); log to
`parent_notifications`. Unsubscribe/preference toggle in ParentSettings.
Acceptance: cron fires in staging, email lands, in-app copy + landing copy flip to "weekly email reports".
Tests: summary-builder unit tests; cron dry-run test.

### 1.3 Custom flashcard decks (S–M)
`flashcard_decks.user_id` column exists unused. Add POST/PUT/DELETE `/flashcards/decks[/:id]` + card CRUD
(owner-only), "My Decks" tab + create/edit form in Flashcards page. Then re-enable the landing claim.
Tests: ownership/IDOR tests mandatory (pattern: houses-battles-idor.test.ts).

### 1.4 Battle extras (each S–M, independent)
- **Win-streak bonus (S):** on battle completion, count recent consecutive wins; +10 XP per streak step
  (cap +50); surface in results. Keeps the landing claim cheaply.
- **Ranked matchmaking (M):** `battle_rating` column (ELO, K=32), "Ranked match" queue endpoint matching
  nearest rating waiting <60s, rating delta on completion, leaderboard tab.
- **Team chat (M):** battle-scoped channel in team battles reusing chat.ts message table with a
  `scope='team_battle:<id>'`; arena side panel; poll with battle fetch.
- **School rankings (M):** school-scoped XP leaderboard (users.school_name rollup); Leaderboard page tab.

### 1.5 Real community counts (S)
Wire the community stats row to real COUNTs (users, rooms, groups after 1.1, online = last-15-min activity).
Drop presence theater until then.

---

## Tier 2 — large / content-heavy (schedule deliberately)

| Item | Gap | Cost |
|---|---|---|
| Past papers 2015–2022 | only 2023–2024 (46 papers) exist | L — content sourcing/OCR/authoring pipeline |
| Seasonal leagues | weekly race cycles exist; no seasons/promotion | L |
| Real-time battles | 2s HTTP polling; true realtime = Durable Objects/WebSocket | L |
| AI score prediction | current: client arithmetic heuristic | M — needs real model or honest rebrand (Tier 0 does the rebrand) |
| Adaptive question serving | mastery tracked; serving not adaptive | M — item-selection engine on topic_mastery |
| In-platform tutoring video | Zoom/Meet link field today | L — Daily/Twilio/WebRTC |
| Neural TTS voice | browser speechSynthesis today | M — Workers AI TTS spike exists admin-side |
| Flashcard content + retention metric | 40 cards; no retention computation | M — author ~500 cards + per-user retention from reviews |
| NSMQ bank depth | 36 questions + 10 riddles | M — content authoring |

---

## Suggested sequencing

1. **This week:** Tier 0 copy PR + hide Study Groups UI + fix pricing contradiction (B-1). All S.
2. **Next sprint:** 1.1 Study Groups, 1.3 custom decks, 1.4 win-streak bonus, 1.5 real counts.
3. **Then:** 1.2 weekly parent emails, 1.4 ranked matchmaking.
4. **Deliberate scheduling:** Tier 2.

Every build item ships with tests (CI coverage ratchet) and a prod verification pass with the QA accounts,
per the established Phase A/B pattern.
