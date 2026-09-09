# Deferred Work Register

**Purpose:** every parked workstream, captured with enough context (spec paths, pipeline patterns, gotchas) that any future session can pick it up from a single instruction. To resume an item, paste its **Invoke** line into a new or current session.

**Convention:** content/database work takes the next free migration numbers at dispatch time — always check `ls database/migrations/ | sed 's/_.*//' | sort -n | tail -3` first rather than trusting any number written here.

---

## 1. Content sprint 4 (question-bank gaps)

**State:** Pattern proven across sprints 1–3 (1,008 items shipped). Coverage report: `node scripts/content-coverage-report.mjs` → `artifacts/content-coverage-latest.json`. Known remaining gaps: Social Studies medium/hard + structured cells (largest), WASSCE core-subject structured/short-answer cells sprints 2–3 deliberately deferred, IGCSE Chemistry/Physics remainder, A-Level Maths/Further Maths/Physics/Chemistry MCQ cells, BECE subject remainder (French, RME, Social Studies, ICT, English, Math, BDT, Ghanaian Language), NSMQ Mathematics.

**Pipeline (use exactly):** generate per-subject cell specs into `artifacts/`; dispatch one coder subagent per subject via AgentSwarm; each agent models on `scripts/generate-wassce-core-math-sprint2-bank.mjs` + a same-sprint parity test in `workers/api/__tests__/`, does a read-only prod topic pre-flight, beta-labels (`automated_beta`, `official_exam_board_content=0`), and runs the 5 gates (generator, `validate-question-batch.mjs --mode=production`, parity vitest, `verify-fresh-bootstrap.cjs`, `typecheck:api`). Parent then: independently re-runs all parity suites, commits per batch, runs the migration-glob check (`git ls-files --error-unmatch` every migration in range) before push, applies to staging then prod by number range, verifies release-row counts, watches CI.

**Gotchas:** keep every migration <19.5 KB CRLF (scratch-table staging); passage-heavy English-style content packs ~40 questions per 9 parts — allocate generous ranges; never let agents commit or write to any database.

**Invoke:** `Run content sprint N: regenerate the coverage report, pick the highest-need subjects, and run the established authoring-swarm pipeline.`

---

## 2. Past papers 2015–2022, phase 1

**State:** Full 5-phase plan at `docs/plans/2026-09-08-past-papers-2015-2022-plan.md`. Phase 1 = 4 core WASSCE subjects × 2019–2022 (~800 questions). Blocked on authoring `scripts/generate-past-paper-bank.mjs` (does not exist yet) — model it on the sprint generators but with `past_paper_id` / `paper_type_id` / `source_paper_code` bindings per the plan.

**Invoke:** `Implement past-papers phase 1 per docs/plans/2026-09-08-past-papers-2015-2022-plan.md, starting with scripts/generate-past-paper-bank.mjs.`

---

## 3. Academic review of beta content (promotion gate)

**State:** All sprint/beta content ships as `automated_beta` with disclaimers. Promotion out of beta is an owner decision pending academic review; review-council playbook exists at `docs/2026-08-13-assessment-review-council-recruitment-playbook.md`. Promotion = flip `quality_assurance`/`release_channel` on `question_content_releases` per batch after sign-off (write a small migration per batch; do not bulk-flip unreviewed content).

**Invoke:** `Promote batch <batch-id> out of beta after academic sign-off.`

---

## 4. Seasonal leagues / real-time battles / in-platform tutoring video

**State:** Deliberately cut from landing claims; marked DEFERRED in `docs/plans/2026-09-06-landing-claims-remediation.md` (read it first — it defines the honest-copy contract each feature must satisfy before landing-page claims can be restored). Battle system foundation (1v1 + 3v3 + matchmaking + ELO) is live; real-time battles need a Durable Objects / WebSocket design (`durable-objects` skill applies).

**Invoke:** `Spec and build <seasonal leagues | real-time battles | in-platform tutoring video> per the DEFERRED notes in docs/plans/2026-09-06-landing-claims-remediation.md.`

---

## 5. Question-bank scaling strategy

**State:** Strategy doc at `docs/plans/2026-09-09-question-bank-scaling-strategy.md` (how to massively and efficiently grow the bank beyond hand-authored sprints). Owner reviewed the strategy; execution not yet scheduled.

**Invoke:** `Execute the next step of docs/plans/2026-09-09-question-bank-scaling-strategy.md.`

---

## 6. BECE virtual lab

**State:** Tracked as GitHub issue #62. SHS virtual lab is live (13 simulations, browser-QA'd); BECE-level simulations not yet scoped.

**Invoke:** `Pick up GitHub issue #62 (BECE virtual lab): scope the simulation list and implement.`

---

## 7. PhET per-step simInstruction overrides

**State:** Virtual-lab polish item identified during the lab's world-class pass; guide steps currently share generic instructions for PhET embeds. Low effort, UX-only.

**Invoke:** `Implement per-step simInstruction overrides for PhET simulations in the virtual lab.`

---

## 8. QA account cleanup

**State:** Prod QA accounts (qa-prod-lab-002/003, qa-prod-verify @brillaprep.org) are premium test users; deletion deferred. Tokens cached in `.gstack/` (gitignored). Keep until the next full QA cycle, then delete via admin user routes and remove `.gstack/qa-*` probe scripts' references.

**Invoke:** `Delete the prod QA accounts and clean up the .gstack probe scripts.`
