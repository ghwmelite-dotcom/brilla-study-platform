# Phase 5 — Database Reckoning

**Goal:** Collapse the broken two-path database bootstrap (`schema.sql` vs 109-file migration chain) into one canonical schema + one idempotent seed + one baseline marker migration; repair all known data corruption (715+ unanswerable questions, phantom subject IDs, PK collisions, 8 individually bad rows); and add a CI-style `db:verify` gate that proves the whole thing on every run.

**Architecture — the squash decision:** Option **(a) single canonical schema + baseline marker**, chosen over (b) "keep chain, fix idempotency":

- The chain is not repairable as a chain: `001` and `023` ALTER columns that `schema.sql` already has (verified: `001_add_user_verification.sql:5-24` duplicates `schema.sql:230-257`; `023_add_subscription_columns.sql:6-7` duplicates `schema.sql:268-269`), and `018`/`028` DROP+rebuild `questions`, destroying FKs, 5 of 8 indexes, and `NOT NULL` constraints. Making 109 files individually idempotent would still leave the destructive rebuilds in history.
- New canonical layout:
  - `database/schema.sql` — regenerated to contain **every** table the API touches (58 current + ~147 migration-only names, incl. scratch tables to be filtered out) with all conflicts resolved.
  - `database/seed.sql` — rewritten idempotent (upserts, no `DELETE FROM`), absorbing all question/subject/topic data fixes.
  - `database/migrations/088_baseline_marker.sql` — the ONLY file left in `migrations_dir`; a no-op marker so `wrangler d1 migrations apply` records the baseline in `d1_migrations` on both fresh and existing databases.
  - Old migrations 001–087 + duplicates move to `database/migrations/archive/` (outside `migrations_dir`) for forensic reference.
- Existing production DBs are already at end-of-chain state (modulo the silent `INSERT OR IGNORE` losses this phase fixes via targeted `UPDATE`s), so they need only the data-fix migration + baseline marker — no rebuild.

**Tech stack:** Cloudflare D1 (SQLite), wrangler 3.99, Node 24 (`node:sqlite` — verified available on v24.14.0; `better-sqlite3` is NOT in either `package.json`, so we use the built-in and add zero dependencies), plain `.cjs` scripts matching `scripts/generate-pwa-*.cjs` style.

## Global Constraints

- **No production D1 command runs without explicit user confirmation.**
- **Backup before any destructive operation** (`wrangler d1 export` first, always).
- **Every task ends with a verifiable command and expected output.**
- **Commits only with user's explicit approval.**
- Phases 0–4 code fixes must stay compatible with the squashed schema; do not change any column name, table name, or ID that `workers/api/**` or `src/**` references without grepping first.
- The canonical `questions.topic_id` must be **nullable** (028's rebuild dropped `NOT NULL`; 037–039, 050–054 insert without `topic_id`; `082` inserts explicit `NULL`). Do not "restore" `schema.sql:317`'s `NOT NULL` — that would break ~600 real rows.
- Grading code is law: `workers/api/index.ts:110-136` (`transformQuestionOptions`, positional letters A–F + first-char match + full-text match) and `:145-175` (`normalizeAnswerForComparison`) define the only answer formats that work. All data must conform to: single letter `A`–`F`, or exact full option text (whose first letter must NOT collide with a different option's positional letter), or free text for non-MCQ types.

---

## Task 1 — `db:verify` gate (do first — it proves every later task)

**Files:**
- `scripts/verify-db.cjs` (new)
- `package.json` (add one script line)

**Steps:**

- [ ] Write `scripts/verify-db.cjs` in the style of `scripts/generate-pwa-assets.cjs` (CommonJS, no deps, console progress output). Use `node:sqlite` (`const { DatabaseSync } = require('node:sqlite')`). Behavior:
  1. Open an in-memory DB, `PRAGMA foreign_keys = ON`.
  2. Apply `database/schema.sql` then `database/seed.sql` (split on `;\s*\n` statement boundaries is insufficient for triggers — but the canonical schema has NO triggers, see Task 2; use `db.exec()` on the whole file).
  3. **Assert zero errors** applying both files (any throw = fail).
  4. **Answer-format check** over `SELECT id, question_type, options, correct_answer FROM questions`:
     - Reject pure-numeric `correct_answer` on `multiple_choice` rows (`/^\d+$/`) — expected count 0 after Task 3.
     - Every single-letter answer must be within the options array range (A–F, index < `json_array_length`).
     - Every full-text answer on an MCQ row must exactly equal one option AND its first letter must not match the positional letter of a *different* option (the q_em_029/q_ca_001 class of bug).
     - Skip rows with `options IS NULL` (direct_answer/calculation/short_answer free text is legal — e.g. `084` q_alevel_math_007 answer `'820'`).
  5. **Referential check:** every `questions.subject_id` resolves in `subjects`, every non-NULL `topic_id` resolves in `topics`, every `past_paper_id`/`exam_type_id`/`paper_type_id` resolves. Also `topics.subject_id`, `past_papers.subject_id`, `flashcard_decks.subject_id`, `user_exam_preferences.user_id`.
  6. **Duplicate-detection check:** no two `subjects` rows with the same `slug` family for Business Management (`subj_wassce_bus_mgmt` XOR `subj_wassce_business_mgt` present, not both); no two A-Level math subject IDs (`subj_alevel_math` only).
  7. Print a summary table (counts per check) and `process.exit(1)` on any failure.
- [ ] Add to root `package.json` scripts: `"db:verify": "node scripts/verify-db.cjs"`.

**Verification:**

```
npm run db:verify
```
Expected at this stage: **FAIL** with non-zero counts for numeric answers (~724), unresolved subject IDs (`subj_math`, `subj_chemistry`, `subj_physics`, `subj_biology`, `subj_wassce_business_mgt`, `subj_alevel_maths`, `alevel`), and the 6 first-letter collisions. This failing baseline is the proof the gate works. (Run it against the *current* files first and record the numbers — they become the before/after evidence.)

**Commit:** `feat(db): add db:verify CI gate (node:sqlite, zero deps)` — only with user approval.

---

## Task 2 — Regenerate `database/schema.sql` as the single canonical schema

**Files:**
- `scripts/build-canonical-schema.cjs` (new, one-off generator kept for reproducibility)
- `database/schema.sql` (rewritten)

**Generation method (exact, not a placeholder):**

- [ ] Write `scripts/build-canonical-schema.cjs`:
  1. Parse `database/schema.sql` for its 58 `CREATE TABLE`/`CREATE INDEX` statements.
  2. Walk `database/migrations/*.sql` in lexical order, regex-extract `CREATE TABLE [IF NOT EXISTS] <name> ... ;` and `CREATE [UNIQUE] INDEX ... ;` statements (state machine that tracks paren depth; migrations contain no triggers after Task 2 step below, and no `;` inside table bodies except none observed — validate by comparing extracted table count to the 178 unique names found by `grep -oiE "CREATE TABLE( IF NOT EXISTS)? [a-z_0-9]+"`).
  3. **Last-definition-wins** for name collisions (this automatically resolves `parent_counselor_messages`/`report_schedules` in favor of `016_fix_parent_counselor_messaging.sql:10,27` — the shape `workers/api/counselor.ts:1509,1667` requires — and `questions` in favor of 028's rebuild shape).
  4. Discard scratch tables: `questions_backup`, `questions_v2`, and anything matching `/(_backup|_v2|_old|_tmp)$/`.
  5. Apply the explicit **override map** (hardcoded in the generator, each with a comment citing evidence):
     - `questions`: start from 028's shape, then add 072's six columns (`syllabus_topic_id`, `command_word`, `assessment_objective`, `source_paper_code`, `source_question_number`, `exam_board_id` — `072_o_a_level_system.sql:238-243`), restore the FK clauses from `schema.sql:317-321` but keep `topic_id` **nullable**, and restore all 8 indexes (topic, subject, difficulty, past_paper, exam_type + any others in schema.sql).
     - `subscription_tiers`: merge `schema.sql:193-204` with `021_subscription_affiliate_system.sql:10-24`'s `user_type TEXT DEFAULT 'student'` column (API expects it). Never include 021:361's `DELETE FROM subscription_tiers`.
     - `past_papers`: extend the `UNIQUE(exam_type_id, subject_id, paper_type_id, year, month)` (`schema.sql:71`, month nullable → NULL hole) to also include `variant` and `session` (columns from `072:227-228`). Document: SQLite treats NULLs as distinct in UNIQUE, so the hole persists for NULL months; acceptable — enforcement moves to `db:verify` + application upserts.
     - Parent-link tables: keep **both** `parent_student_links` (schema.sql/`002:11`) and `student_parent_links` (`010:102`) — `counselor.ts:1018-1500` uses the latter, other code may use the former. Add a header comment: `student_parent_links` is the live one; `parent_student_links` is legacy, candidate for a future data-merge migration (out of scope).
     - `users.school_level`: keep `CHECK (school_level IN ('jhs','shs'))` (`schema.sql:250`). Verified: no code or data writes `'olevel'`/`'alevel'` to `users.school_level` (`src/lib/api.ts:193` types it `'jhs'|'shs'`; 072's level values live on `exam_types.level`, a different column). O/A-level students store NULL. No change needed — but add a comment noting the deliberate decision.
     - **Drop** the three `CREATE TRIGGER` statements from `087:299-311` (rejected by hosted D1). Follow-up recorded in Task 6: application code must set `updated_at`; verified `workers/api/tutor-classroom.ts:130-140` already does for the main `tutor_availability` update, but `:191` (heartbeat) and `:441` (`ai_classroom_sessions`) do not — patch those two UPDATEs to include `updated_at = CURRENT_TIMESTAMP` (or `last_heartbeat` only, documented).
  6. Emit: header banner (generated, do-not-edit, source list, date), `PRAGMA foreign_keys=ON;` comment, all tables in dependency-safe order (parents before children — topological sort on `REFERENCES`, falling back to lexical), then all indexes.
- [ ] **Validation diff process:**
  1. `node scripts/build-canonical-schema.cjs > database/schema.sql.new`
  2. Table-set parity: `node:sqlite` script asserts the new schema's table list ⊇ union of (old schema.sql tables ∪ non-scratch migration tables). Print any missing — must be none.
  3. Column parity spot-check on the load-bearing tables: `PRAGMA table_info(questions)` must list the union of `schema.sql:315-341` columns + 028 paper columns + 072's six; same for `users`, `past_papers`, `subscription_tiers`.
  4. Best-effort legacy replay comparison: apply old `schema.sql` + each migration wrapped in savepoint-rollback-on-error to a scratch DB (this is what the audit did), then compare `questions` column sets and per-table row counts achievable; document that the canonical schema is a superset.
  5. `mv database/schema.sql.new database/schema.sql` only after Task 1's gate runs clean on schema alone (seed will still fail until Task 4).

**Verification:**

```
node scripts/build-canonical-schema.cjs > database/schema.sql.new && node -e "const{DatabaseSync}=require('node:sqlite');const fs=require('fs');const db=new DatabaseSync(':memory:');db.exec('PRAGMA foreign_keys=ON');db.exec(fs.readFileSync('database/schema.sql.new','utf8'));const t=db.prepare(\"SELECT count(*) c FROM sqlite_master WHERE type='table'\").get();console.log('tables:',t.c);db.prepare('PRAGMA foreign_key_check').all().forEach(r=>console.log(r));"
```
Expected: no exception; `tables:` ≥ 190; empty `foreign_key_check` output.

**Commit:** `refactor(db): regenerate canonical schema.sql (squash of 001-087)` — only with user approval.

---

## Task 3 — Data fixes (applied inside the squashed seed AND as the prod data-fix migration)

Produce one file `database/migrations/088a_data_fixes.sql` used in two ways: its contents are folded into the new `seed.sql` for fresh deploys, and the file itself (idempotent form) is what runs against production. Keep it strictly idempotent (pure `UPDATE`s with `WHERE` guards; no `INSERT` that isn't `INSERT OR IGNORE`/`ON CONFLICT DO NOTHING`).

**Files:**
- `database/migrations/088a_data_fixes.sql` (new; folded into seed in Task 4)

### 3a. Numeric `correct_answer` → option text (715–724 rows)

Verified counts (grep `', N, '`): 065=165, 066=376, 067=143, 064=30, 068=10 (audit said 373/137 for 066/067 — minor drift; the gate counts exactly). All are 0-based indexes into the row's `options` JSON, invisible to `transformQuestionOptions`.

- [ ] Emit this conversion SQL (D1 has JSON1; verified the column is TEXT so integers read back as digit strings):

```sql
-- Convert 0-based numeric correct_answer to the option text it indexes.
UPDATE questions
SET correct_answer = json_extract(options, '$[' || correct_answer || ']')
WHERE question_type = 'multiple_choice'
  AND options IS NOT NULL
  AND correct_answer GLOB '[0-9]*'
  AND correct_answer NOT GLOB '*[^0-9]*'
  AND CAST(correct_answer AS INTEGER) < json_array_length(options);
```

- [ ] Verification SQL (must return 0):

```sql
SELECT count(*) FROM questions
WHERE question_type='multiple_choice' AND options IS NOT NULL
  AND correct_answer GLOB '[0-9]*' AND correct_answer NOT GLOB '*[^0-9]*';
```

- [ ] Spot-check 5 converted rows — expected: each `correct_answer` now equals exactly one array element:

```sql
SELECT id, correct_answer, json_extract(options,'$[' || 0 || ']') FROM questions
WHERE id IN ('q_acc_bank_001','q_bm_intro_002','q_chem_elec_001', /* + any 2 from 064/068 */ );
-- q_acc_bank_001: 2 -> 'Direct credits not yet recorded'
-- q_bm_intro_002: 2 -> 'Sole proprietorship'
-- q_chem_elec_001: 0 -> 'Using electricity to cause a chemical reaction'
```

### 3b. Subject ID reconciliation

Verified facts (correcting audit drift): `subj_chemistry` is **never created anywhere** (truly phantom). `subj_wassce_business_mgt` **is** created by `063:23` — the real problem is a **duplicate**: `seed.sql:116` creates `subj_wassce_bus_mgmt` with full metadata, and 063 creates topics `topic_bm_*` under its own ID. Legacy IDs `subj_math`/`subj_physics`/`subj_biology` are also phantoms, used far beyond the seeds the audit cited: `035–039` and `056–060` (WASSCE 2023 paper questions, ~815 total references across 12 files). Canonical targets all exist via `028_seed_past_papers_questions.sql:43-50`.

```sql
UPDATE questions   SET subject_id='subj_wassce_core_math' WHERE subject_id='subj_math';
UPDATE questions   SET subject_id='subj_wassce_physics'   WHERE subject_id='subj_physics';
UPDATE questions   SET subject_id='subj_wassce_chemistry' WHERE subject_id='subj_chemistry';
UPDATE questions   SET subject_id='subj_wassce_biology'   WHERE subject_id='subj_biology';
UPDATE past_papers SET subject_id='subj_wassce_core_math' WHERE subject_id='subj_math';
UPDATE past_papers SET subject_id='subj_wassce_physics'   WHERE subject_id='subj_physics';
UPDATE past_papers SET subject_id='subj_wassce_chemistry' WHERE subject_id='subj_chemistry';
UPDATE past_papers SET subject_id='subj_wassce_biology'   WHERE subject_id='subj_biology';
UPDATE flashcard_decks SET subject_id='subj_wassce_core_math' WHERE subject_id='subj_math';
UPDATE flashcard_decks SET subject_id='subj_wassce_physics'   WHERE subject_id='subj_physics';
UPDATE flashcard_decks SET subject_id='subj_wassce_chemistry' WHERE subject_id='subj_chemistry';
UPDATE flashcard_decks SET subject_id='subj_wassce_biology'   WHERE subject_id='subj_biology';

-- Business Management duplicate: canonical = subj_wassce_bus_mgmt (seed.sql:116 has full metadata)
UPDATE topics    SET subject_id='subj_wassce_bus_mgmt' WHERE subject_id='subj_wassce_business_mgt';
UPDATE questions SET subject_id='subj_wassce_bus_mgmt' WHERE subject_id='subj_wassce_business_mgt';
DELETE FROM subjects WHERE id='subj_wassce_business_mgt';

-- Elective Math: canonical = subj_wassce_elect_math (seed.sql:109, 018:123); reverse 063:242-253's rename
UPDATE questions SET subject_id='subj_wassce_elect_math' WHERE subject_id='subj_wassce_elective_math';
UPDATE topics    SET subject_id='subj_wassce_elect_math' WHERE subject_id='subj_wassce_elective_math';
DELETE FROM subjects WHERE id='subj_wassce_elective_math';

-- A-Level maths: canonical = subj_alevel_math (073_seed_o_a_level_data_fixed.sql:46); subj_alevel_maths never created
UPDATE questions SET subject_id='subj_alevel_math' WHERE subject_id='subj_alevel_maths';
-- 084's exam_type_id 'alevel' is also phantom; canonical exam_types id is 'cambridge_a2' (073_fixed:20)
UPDATE questions SET exam_type_id='cambridge_a2' WHERE exam_type_id='alevel';
```

### 3c. 082 vs 084 PK collision — **decision: keep both, renumber 084**

Verified: collision is **40 PKs** (`q_alevel_math_001..040`), not 60 — `082` has 55 questions (001–055), `084` has 40. Content is genuinely different (082 = Cambridge 9709 set with prefixed options; 084 = different 40 questions carrying `exam_board_id`/`command_word` metadata). `INSERT OR IGNORE` silently discarded all 40 of 084's.

Basis for keeping 082's IDs and renumbering 084: 082 ran first, uses the canonical subject ID `subj_alevel_math`, and has the larger set; 084 additionally needs its phantom subject/exam_type fixed anyway, so it's already being edited.

```sql
-- Renumber 084's set (applied to seed source; for prod these rows were never inserted, so this is INSERT-only there)
UPDATE questions SET id='q_alevel_maths_' || substr(id, length('q_alevel_math_')+1)
WHERE id IN (SELECT id FROM questions WHERE id GLOB 'q_alevel_math_0*' AND subject_id='subj_alevel_maths');
-- (in the squashed seed, 084's INSERTs are rewritten to q_alevel_maths_001..040 directly)
```

### 3d. The 8 individually bad rows

First-letter collisions (full-text answer whose first char marks a second option correct at `index.ts:122-124`) — convert to letter form, verified against each row's options array:

```sql
UPDATE questions SET correct_answer='A' WHERE id='q_em_029';   -- 'cos θ' is option 0; was marking C ('1') too
UPDATE questions SET correct_answer='B' WHERE id='q_ca_001';   -- 'Determining product costs' is option 1; was marking D ('Auditing') too
UPDATE questions SET correct_answer='C' WHERE id='q_fn_002';   -- 'Ascorbic acid' is option 2; was marking A ('Retinol') too
UPDATE questions SET correct_answer='C' WHERE id='q_fn_005';   -- 'All essential nutrients...' is option 2; was marking A too
UPDATE questions SET correct_answer='C' WHERE id='q_twi_003';  -- 'Akan people' is option 2; was marking A ('Ga people') too
UPDATE questions SET correct_answer='C' WHERE id='q_twi_005';  -- 'Ashantis' is option 2; was marking A ('Gas') too
```

Mathematically wrong answer (`018:170`, explanation itself says "needs verification"; f(2)=8−12+2k+2=0 ⇒ k=1):

```sql
UPDATE questions SET correct_answer='1',
       explanation='f(2) = 8 - 12 + 2k + 2 = 0 → 2k = 2 → k = 1.'
WHERE id='q_em_007';
```

Grading-convention decision (finding 8): the audit's claim that 037/038/039 use non-prefixed options is **inaccurate** — verified their options are prefixed (`["A. Tissue", ...]`), which is the safe convention. Decision: **accept letter-answer + prefixed-options as the platform convention**; do NOT normalize 150 rows. The `db:verify` first-letter-collision check guards the non-prefixed minority permanently.

**Verification:** `npm run db:verify` — numeric-answer count 0, zero unresolved subject/exam_type refs, zero first-letter collisions; plus the 3a spot-check output above.

**Commit:** `fix(db): repair 715+ numeric answers, phantom subject IDs, 082/084 collision, 8 bad rows` — only with user approval.

---

## Task 4 — Seed rework

**Files:**
- `database/seed.sql` (rewritten)
- `database/migrations/seed_chat_rooms.sql` → `database/seeds/seed_chat_rooms.sql` (moved OUT of `migrations_dir`)
- `workers/package.json` (`db:seed` path unchanged; verify)

**Steps:**

- [ ] Remove the destructive prologue (`seed.sql:9-20`: `DELETE FROM riddles/questions/topics/houses/achievements/users/subscription_tiers/past_papers/paper_types/subjects/subject_categories/exam_types`). Replace with a header guard:

```sql
-- Brilla Study Platform Seed Data (IDEMPOTENT — safe to re-run)
-- NEVER run this file against production casually. It writes demo users
-- (admin_1, teacher_1, student_1) and reference content. For production,
-- run only database/migrations/088a_data_fixes.sql.
```

- [ ] Convert every `INSERT INTO` to `INSERT INTO ... ON CONFLICT(id) DO NOTHING` (D1/SQLite upsert syntax). Convert `INSERT OR REPLACE` (037–039, 050–054 — `OR REPLACE` deletes the row and cascades `ON DELETE CASCADE` into `question_attempts`; verified present) to `ON CONFLICT(id) DO UPDATE SET` of the mutable columns only.
- [ ] Fold in all migration-seeded reference data (subjects/topics from 028/029/055/063/073, questions from 018/029-068/073-084, past papers) with Task 3's fixes applied at the source (numeric answers converted, subject IDs canonical, 084 renumbered).
- [ ] Fix `069_seed_demo_exam_preferences.sql:6-14` dev-machine user IDs → `student_1`/`teacher_1` (verified stable in `seed.sql:456-458`).
- [ ] Move `seed_chat_rooms.sql` out of `migrations_dir` to `database/seeds/`, and fix `created_by 'admin_prod_001'` → `'admin_1'` (`seed.sql:456`); keep its `ON CONFLICT(id) DO NOTHING`.
- [ ] Fix `044_flashcard_system.sql:74-77` legacy deck subject IDs (covered by 3b remaps for prod; fixed at source in seed).
- [ ] Fold 021's tier catalog (`021:363+`) in as `INSERT ... ON CONFLICT(id) DO UPDATE` — never its `DELETE FROM subscription_tiers` (`021:361`), which breaks the `users.subscription_tier_id` FK.

**Verification:**

```
npm run db:verify          # full gate green on fresh in-memory DB
# idempotency proof:
node -e "const{DatabaseSync}=require('node:sqlite');const fs=require('fs');const db=new DatabaseSync(':memory:');db.exec(fs.readFileSync('database/schema.sql','utf8'));const s=fs.readFileSync('database/seed.sql','utf8');db.exec(s);db.exec(s);db.exec(s);const q=db.prepare('SELECT count(*) c FROM questions').get();console.log('questions after 3x seed:',q.c);"
```
Expected: gate green; triple-seed runs without error and the count equals the single-seed count (no duplicates).

**Commit:** `refactor(db): idempotent seed, stable demo IDs, chat rooms out of migrations_dir` — only with user approval.

---

## Task 5 — Baseline migration strategy

**Files:**
- `database/migrations/088_baseline_marker.sql` (new, only file left in `migrations_dir`)
- `database/migrations/088a_data_fixes.sql` (from Task 3)
- `database/migrations/archive/` (receives 001–087 + old seed_chat_rooms)
- `workers/package.json` (scripts)

**Steps:**

- [ ] `git mv database/migrations/0*.sql database/migrations/archive/` (keeps history; archive is outside `migrations_dir` so wrangler ignores it).
- [ ] Write `088_baseline_marker.sql`:

```sql
-- Baseline marker. The chain 001-087 was squashed into database/schema.sql + seed.sql
-- on 2026-08-XX. This file exists only so `wrangler d1 migrations apply` records a
-- baseline row in d1_migrations on both fresh and pre-squash databases.
CREATE TABLE IF NOT EXISTS schema_baseline (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    squashed_at TEXT DEFAULT (datetime('now')),
    note TEXT
);
INSERT OR IGNORE INTO schema_baseline (id, note) VALUES (1, 'squash of migrations 001-087');
```

- [ ] Update `workers/package.json`:
  - `"db:migrate": "wrangler d1 execute brilla-db --file=../database/schema.sql"` — keep, but add `--local` variants and document it is for **fresh** databases only.
  - Add `"db:baseline": "wrangler d1 migrations apply brilla-db"` and `"db:backup": "wrangler d1 export brilla-db --output=backups/brilla-db-$(date +%Y%m%d-%H%M%S).sql"`.
- [ ] Fresh-environment flow (documented in README/AGENTS.md update):
  1. `wrangler d1 execute brilla-db --local --file=database/schema.sql`
  2. `wrangler d1 execute brilla-db --local --file=database/seed.sql`
  3. `wrangler d1 execute brilla-db --local --file=database/seeds/seed_chat_rooms.sql`
  4. `wrangler d1 migrations apply brilla-db --local` (records 088)
- [ ] Existing-DB flow: see Production runbook below.

**Verification:**

```
wrangler d1 migrations list brilla-db --local
```
Expected: only `088_baseline_marker.sql` listed.

**Commit:** `refactor(db): squash migrations 001-087 into canonical schema + 088 baseline` — only with user approval.

---

## Task 6 — Follow-ups and docs

- [ ] Patch `workers/api/tutor-classroom.ts:191` and `:441` UPDATEs to set `updated_at = CURRENT_TIMESTAMP` (trigger replacement; verified `:130-140` already does).
- [ ] Update `README.md` and `docs/BRILLA_PLATFORM_DOCUMENTATION.md` database sections: single bootstrap path, `db:verify` gate, archive location.
- [ ] Add `npm run db:verify` to CI if a CI workflow exists (check `.github/workflows`; none observed at planning time — note in docs instead).

**Verification:** `npx tsc -b` passes; grep confirms no remaining reference to `migrations/0` paths in code or docs.

**Commit:** `chore(db): updated_at follow-ups + docs` — only with user approval.

---

## Verification

Whole-phase gate, in order:

1. `npm run db:verify` — green (schema + seed apply clean with `foreign_keys=ON`; 0 numeric MCQ answers; all letter answers in range; 0 first-letter collisions; every FK reference resolves; no duplicate subjects).
2. Triple-seed idempotency check (Task 4) — no error, stable row counts.
3. `wrangler d1 migrations list brilla-db --local` — only 088.
4. `npm run build` (tsc + vite) — green, proving Phases 0–4 code still typechecks against the squashed schema's assumptions.
5. Manual smoke: `npm run dev:all`, load one question each from a 065/066/067 topic (previously unanswerable), one 037 BECE paper question, and one renumbered `q_alevel_maths_*` question; answer each correctly and confirm grading accepts it.

## Production runbook

**One-way door. Every step that touches prod waits for explicit user confirmation.**

GO/NO-GO checklist (all must be YES):

- [ ] `npm run db:verify` green locally.
- [ ] Full flow rehearsed on a throwaway D1 (`wrangler d1 create brilla-db-rehearsal`, run fresh-environment flow, delete after).
- [ ] Data-fix file reviewed line-by-line against prod export sample.
- [ ] Backup completed and its file size is plausible (> previous backup, non-zero).
- [ ] Rollback steps below read and understood.
- [ ] User has typed explicit GO for the prod commands.

Ordered commands:

```bash
# 1. BACKUP (mandatory, before anything else)
mkdir -p backups
wrangler d1 export brilla-db --remote --output=backups/pre-squash-$(date +%Y%m%d-%H%M%S).sql
# verify the backup: file exists, non-trivial size, tail shows COMMIT;

# 2. Apply data fixes (idempotent; safe to re-run)
wrangler d1 execute brilla-db --remote --file=database/migrations/088a_data_fixes.sql

# 3. Record baseline
wrangler d1 migrations apply brilla-db --remote

# 4. Verify prod state
wrangler d1 execute brilla-db --remote --command="SELECT count(*) FROM questions WHERE question_type='multiple_choice' AND options IS NOT NULL AND correct_answer GLOB '[0-9]*' AND correct_answer NOT GLOB '*[^0-9]*';"
# expected: 0
wrangler d1 execute brilla-db --remote --command="SELECT count(*) FROM questions q LEFT JOIN subjects s ON q.subject_id=s.id WHERE s.id IS NULL;"
# expected: 0
wrangler d1 execute brilla-db --remote --command="SELECT count(*) FROM schema_baseline;"
# expected: 1

# 5. Deploy worker (phases 0-4 code) only after 1-4 are green
npm run dev:api -- --dry-run   # sanity
cd workers && npm run deploy
```

## Rollback

- Data-fix rollback: 088a is UPDATE-only; restore from the pre-squash export for any table it touched:
  ```bash
  wrangler d1 execute brilla-db --remote --file=backups/pre-squash-<timestamp>.sql
  ```
  (Full-file restore; D1 import replaces content. Acceptable because no writes should occur during the maintenance window — announce one.)
- Baseline marker rollback: `wrangler d1 execute brilla-db --remote --command="DROP TABLE IF EXISTS schema_baseline;"` and remove the 088 row from `d1_migrations` if present.
- If anything fails mid-runbook: STOP, do not retry blind, restore from backup, post-mortem against the export.
- The archive (`database/migrations/archive/`) preserves the old chain untouched for forensic diffing.

## Out of scope

- Merging `parent_student_links` ↔ `student_parent_links` data (schema keeps both; future migration).
- Normalizing the accepted letter-answer + prefixed-option convention (150 rows in 037–039 etc. — verified safe; guarded by `db:verify` instead).
- Fixing `src/types/index.ts:269` `SchoolLevel = 'jss' | 'shs'` typo vs CHECK's `'jhs'` (frontend type bug, Phase 0–4 territory).
- Adding triggers back via any D1-supported mechanism; `updated_at` is application-maintained.
- Re-hosting or reformatting question content beyond the enumerated fixes.
- Any change to R2 buckets, AI bindings, or cron triggers in `wrangler.toml`.
