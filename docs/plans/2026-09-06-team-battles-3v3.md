# 3v3 Team Battles — Implementation Spec

**Date:** 2026-09-06 · **Status:** Approved to implement · **Depends on:** 1v1 battle hardening (Phase A, in flight)

## Context

The landing page advertises "Battle Solo or Team Up". Solo (1v1) is real. Team battles are not: the
schema and a partial API exist, but the server can never complete a battle, the client store's
contract contradicts the API and silently falls back to fabricated mock battles, and the UI
components are not mounted on any route. This spec finishes the feature properly.

### Current state (verified 2026-09-06)

- Schema ready: `team_battles` (status CHECK includes 'completed', `winner_team`, `xp_reward`,
  `time_per_question`, `current_question`, `started_at`, `completed_at`), `team_battle_members`
  (team_number, is_captain, score, correct_answers, UNIQUE(battle_id, user_id)),
  `team_battle_invites` (5-min expiry supported, status pending/accepted/declined/expired).
- API `workers/api/teambattles.ts` mounted at `/api/team-battles` (all authed): list available,
  create, join (3-per-team cap), invites, captain-only start, answer submission updating member +
  team scores, history. **Missing: any completion path** — `status='completed'` and `winner_team`
  are never set.
- Client: `src/components/battle/TeamBattleLobby.tsx`, `TeamBattleArena.tsx` exist but are routed
  nowhere (`App.tsx` only mounts `/battle`, `/battle/:id`; sidebar links only "1v1 Battle").
- `src/stores/teamBattleStore.ts` contract mismatches: posts to `/team-battles` (server:
  `/team-battles/create`), sends `teamId` (server: `teamNumber`), `questionIndex` (server:
  `questionId`), calls nonexistent `/ready`, `/leave`, `GET /invites`, `/invites/:id/decline`, and
  falls back to `generateMockTeamBattle()` / 3 fabricated battles on any API error.

## Game design (decision)

**Synchronized rounds on a lazy clock** — this is what the schema was designed for:

- Both teams play the same N questions (default 10) simultaneously.
- Round i opens at `started_at + i * time_per_question` (default 30s). `current_question` is
  **derived**, never stored-advanced — no cron needed.
- Each member may answer the current question once, while it is open. When the round closes,
  unanswered members score 0 for it.
- Scoring per correct answer: `question.points || 3` plus the 1v1 speed bonus (+2 ≤5s from round
  open, +1 ≤10s, else 0). Member score and team score (`team{1,2}_score` = Σ member scores) update
  on each answer.
- Battle completes when the final round closes (lazy: first read after `started_at +
  total_questions * time_per_question`). `winner_team` = higher score; tie → lower aggregate answer
  time; still tied → draw (`winner_team = NULL`, status completed, both teams get participation).
- XP on completion: each winning member gets `battle_win` via the points helper (same wiring as
  Phase A 1v1); losers get participation only if a participation source exists in `points.ts`.

## Work items

### B1 — Server completion + round engine (`workers/api/teambattles.ts`)

1. Captain `start`: require both teams equal size, 1–3 members each; sample N questions from the
   real question bank (same sampler as 1v1, `ORDER BY RANDOM()` on the shared bank, optionally
   subject-filtered), store JSON in `question_ids`, set `started_at`, status 'active'.
2. `GET /api/team-battles/:id` (add): return battle + members + derived `current_question` +
   `round_ends_at` + per-member progress (answered count; no opponent answer content). Lazy-complete
   when past the final round.
3. Answer route: reject answers outside the open round window, after completion, or duplicate
   answers (UNIQUE guard on a new `team_battle_answers(battle_id, user_id, question_id)` table —
   migration required; check `database/migrations/` numbering conventions).
4. Completion: set status/winner_team/completed_at, award XP (winners only; never to bots — n/a
   here), return final state.
5. Expiry: `waiting` team battles auto-cancel after 30 min (same lazy-expiry helper as Phase A
   1v1).

### B2 — Store contract fix (`src/stores/teamBattleStore.ts`)

- Align to real endpoints/fields: `POST /team-battles/create`, join with `{ teamNumber }`, answer
  with `{ questionId }`.
- Delete every mock fallback (`generateMockTeamBattle`, fabricated available-battles list). API
  errors surface as honest UI error states.
- Remove calls to nonexistent endpoints (`/ready`, `/leave`, invites GET/decline) — or implement
  `/leave` server-side (decision: implement `POST /team-battles/:id/leave`, waiting-phase only).
- Single 2s poller while active (Phase A fixed the doubled-poller pattern; mirror it).

### B3 — UI routing

- Routes: `/team-battle` and `/team-battle/:id` → `TeamBattlePage` (new thin page mirroring
  `Battle.tsx` phases: lobby / waiting / battle / results, using the fixed stale-closure pattern).
- Sidebar: add "Team Battle (3v3)" under "1v1 Battle" (`src/components/Sidebar.tsx` ~line 85).
- Lobby: create (name, difficulty, question count), join-from-list, join-with-code (reuse Phase A
  code lookup, extended to team battles), invite friends (existing invite API).
- Waiting room: two team rosters with live join updates (poll), captain-only Start button,
  leave button, shareable code.
- Arena: current question + round countdown (client ticks against `round_ends_at`), team scores,
  per-member progress dots, lockout state when a round closes.
- Results: winner announcement, per-member scoreboard, XP earned, rematch/exit.

### B4 — Landing page

Replace the hardcoded 3v3 mock claims once the feature is verified on prod: keep the two-card
layout but bind copy to real rules ("3v3 synchronized rounds", "30s per question", "captain
starts when teams are full"). Remove "Ranked matchmaking", "Team chat", "Seasonal leagues" unless
implemented (they are out of scope here).

## Non-goals (this phase)

Ranked/ELO, team chat, seasonal leagues, cross-school tournaments, bots in team battles.

## Testing

- API tests (`workers/api/__tests__/`): round window enforcement, duplicate-answer rejection,
  equal-size start validation, 3-per-team cap, lazy completion + winner/draw logic + XP,
  waiting expiry, leave-in-waiting.
- Contract test: teamBattleStore calls vs real route shapes (prevent re-drift).
- CI coverage ratchet (functions ≥35%) — new routes must ship with tests.
- Prod QA with the three seeded QA accounts (two battles, six seats): full 3v3 lifecycle, incl.
  a member not answering a round and a draw path.

## Risks

- **Lazy-clock drift**: client countdown uses server-returned `round_ends_at`, never local
  `Date.now()` alone — document in arena component.
- **Answer-route race at round close**: server validates against the DB `started_at`, not client
  timestamps.
- **Coverage ratchet**: B1+B2+B3 are a lot of new frontend lines; component smoke tests needed if
  the global function-coverage dips.
