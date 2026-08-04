# Phase 0 — Environment & Test Baseline

**Goal:** Establish a green local baseline before any fix phase lands: dependencies installed, a running test harness for both the frontend and the Workers API, security dependency bumps applied one at a time, type-check/lint coverage for `workers/` with recorded baselines, and wrangler hygiene fixes. No pre-existing errors are fixed in this phase — they are measured and ratcheted.

**Architecture:** The frontend is a Vite + React 18 + TS SPA (`src/`, root `tsconfig.json`, `vite.config.ts`). The API is a Hono app on Cloudflare Workers (`workers/api/`, entry `workers/api/index.ts`, 10,370 lines plus ~30 sibling route modules), driven by the **root** `wrangler.toml` and the **root** `node_modules` (root `package.json` owns `hono`, `wrangler`, `@cloudflare/workers-types`; `workers/package.json` exists but is not what root `wrangler dev` resolves against — out of scope). Tests run under plain vitest in a Node environment against pure functions; no Workers pool, no jsdom, no coverage provider.

**Tech stack:** Vite 5, React 18, TypeScript ~5.6, ESLint 9 (flat config), Hono 4, Cloudflare Workers (D1/R2/AI), vitest 2 (new).

## Global Constraints

- Do not fix pre-existing tsc/eslint errors beyond what a task requires. This phase measures baselines and adds ratchets only.
- One dependency bump per task, so a regression is bisectable.
- Every task ends with a verifiable command and expected output, then a commit step.
- Commits are only executed with the user's explicit approval. The commit steps below are prepared, not auto-run.
- Minimal diff, DRY, YAGNI. Match existing code style (no semicolon-less conversions, existing comment density).
- Do NOT adopt `@cloudflare/vitest-pool-workers` — plain vitest with type-only imports from `@cloudflare/workers-types` is sufficient for the smoke tests here.
- Do NOT bump `compatibility_date` in `wrangler.toml` in this phase (see Task 12 note).
- Environment: Windows + Git Bash, Node v24.14.0, npm 11.9.0. `node_modules/` is currently absent.

---

## Task 1: Install dependencies and record the green/red baseline

**Files:**
- Modify: none (installs `node_modules/`, updates nothing tracked)

**Steps:**

- [ ] **Step 1: Clean install from the lockfile**
  ```bash
  npm ci
  ```
  Expected: installs without error; `node_modules/` populated. (If `npm ci` fails on a lockfile mismatch, fall back to `npm install` and note the lockfile diff in the commit message.)

- [ ] **Step 2: Verify the build**
  ```bash
  npm run build
  ```
  (`build` = `tsc -b && vite build`.) Expected: exits 0. If it fails, record the exact error output — that is the baseline, do not fix it here.

- [ ] **Step 3: Record frontend typecheck baseline**
  ```bash
  npx tsc -b 2>&1 | tee /tmp/baseline-tsc.txt; grep -c "error TS" /tmp/baseline-tsc.txt || echo 0
  ```
  Record the count in `## Baseline Metrics` at the bottom of this plan (fill the placeholder).

- [ ] **Step 4: Record lint baseline**
  ```bash
  npm run lint 2>&1 | tee /tmp/baseline-eslint.txt; tail -5 /tmp/baseline-eslint.txt
  ```
  Record the `✖ N problems (X errors, Y warnings)` summary line into `## Baseline Metrics`.

- [ ] **Step 5: Record npm audit baseline**
  ```bash
  npm audit 2>&1 | tail -15
  ```
  Expected: ~6 vulnerabilities per the audit (hono, fabric, react-router-dom, lodash, ws chains). Record the count; fixes come in Tasks 4–7.

**Verification:** `npm run build && npm run lint` runs end-to-end (exit codes and counts recorded).

**Commit:** nothing tracked changed — no commit for this task.

---

## Task 2: Add vitest harness + frontend smoke test

**Files:**
- Create: `vitest.config.ts`
- Create: `src/utils/formatters.test.ts`
- Modify: `package.json` (add `test`/`test:watch` scripts, add `vitest` devDependency)

**Interfaces:** `src/utils/formatters.ts` exports pure functions `formatTime(seconds: number): string`, `formatNumber(num: number): string` — no imports, ideal smoke-test target.

**Steps:**

- [ ] **Step 1: Install vitest (pin to v2 to match Vite 5)**
  ```bash
  npm install -D vitest@^2
  ```
  Do not add `@vitest/coverage-v8` or `jsdom` — not needed for pure-function tests (YAGNI).

- [ ] **Step 2: Create `vitest.config.ts`** (exact content; mirrors the `@` alias from `vite.config.ts:10`):
  ```ts
  import { defineConfig } from 'vitest/config'
  import { fileURLToPath, URL } from 'node:url'

  export default defineConfig({
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    test: {
      environment: 'node',
      include: ['src/**/*.test.{ts,tsx}', 'workers/**/*.test.ts'],
    },
  })
  ```

- [ ] **Step 3: Add scripts to `package.json`** — insert after `"preview"`:
  ```json
  "test": "vitest run",
  "test:watch": "vitest",
  ```

- [ ] **Step 4: Create `src/utils/formatters.test.ts`** (exact content; expectations verified against `formatters.ts` source):
  ```ts
  import { describe, expect, it } from 'vitest'
  import { formatNumber, formatTime } from './formatters'

  describe('formatTime', () => {
    it('formats seconds as MM:SS', () => {
      expect(formatTime(0)).toBe('00:00')
      expect(formatTime(65)).toBe('01:05')
      expect(formatTime(600)).toBe('10:00')
    })
  })

  describe('formatNumber', () => {
    it('formats with K and M suffixes', () => {
      expect(formatNumber(999)).toBe('999')
      expect(formatNumber(1500)).toBe('1.5K')
      expect(formatNumber(2000000)).toBe('2.0M')
    })
  })
  ```

**Verification:** `npm test` → expected output includes `✓ src/utils/formatters.test.ts (2 tests)` and `Test Files  1 passed`.

**Commit:**
```bash
git add package.json package-lock.json vitest.config.ts src/utils/formatters.test.ts
git commit -m "chore: add vitest harness with frontend smoke test"
```

---

## Task 3: Worker smoke test (proves the workers/ harness)

**Files:**
- Create: `workers/api/usage-limits.test.ts`
- Modify: none (no changes to worker source needed)

**Interfaces:** `workers/api/usage-limits.ts` exports `DAILY_QUESTION_LIMIT = 10` (line 9), `CORE_SUBJECTS` (line 12), pure functions `isCoreSubject(examType, subjectSlug): boolean` (line 221 — returns `true` for unknown exam types, "allow all") and `getCoreSubjects(examType): string[]` (line 230 — returns `[]` for unknown exam types). Its only import is `import type { D1Database } from '@cloudflare/workers-types'` (type-only, erased at runtime), so plain vitest runs it with zero mocks. This replaces the audit's `hashPassword` suggestion: `hashPassword` (`workers/api/index.ts:178-205`) is not exported, and importing `index.ts` would construct the whole 30-router Hono app at module load — testing `usage-limits.ts` is the minimal, robust proof of the harness.

**Steps:**

- [ ] **Step 1: Create `workers/api/usage-limits.test.ts`** (exact content; semantics verified against source):
  ```ts
  import { describe, expect, it } from 'vitest'
  import { CORE_SUBJECTS, DAILY_QUESTION_LIMIT, getCoreSubjects, isCoreSubject } from './usage-limits'

  describe('usage-limits', () => {
    it('exposes the daily question limit', () => {
      expect(DAILY_QUESTION_LIMIT).toBe(10)
    })

    it('identifies core subjects per exam type', () => {
      expect(isCoreSubject('bece', 'mathematics')).toBe(true)
      expect(isCoreSubject('bece', 'physics')).toBe(false)
      expect(isCoreSubject('wassce', 'core-mathematics')).toBe(true)
    })

    it('allows all subjects for unknown exam types', () => {
      expect(isCoreSubject('unknown-exam', 'anything')).toBe(true)
      expect(getCoreSubjects('unknown-exam')).toEqual([])
    })

    it('lists NSMQ core subjects', () => {
      expect(CORE_SUBJECTS.nsmq).toEqual(['mathematics', 'physics', 'chemistry', 'biology'])
    })
  })
  ```

**Verification:** `npm test` → expected `✓ workers/api/usage-limits.test.ts (4 tests)` and `Test Files  2 passed`.

**Commit:**
```bash
git add workers/api/usage-limits.test.ts
git commit -m "test: add worker usage-limits smoke test"
```

---

## Task 4: Security bump — hono

**Files:**
- Modify: `package.json` (dependency `hono`), `package-lock.json`

**Steps:**

- [ ] **Step 1: Check the real latest 4.x version** (the audit cited "4.12.34+" — verify, do not trust):
  ```bash
  npm view hono versions --json | tail -20; npm view hono version
  ```

- [ ] **Step 2: Bump within major 4** (currently `^4.11.1` at `package.json:19`):
  ```bash
  npm install hono@^4
  ```

- [ ] **Step 3: Rebuild and re-test**
  ```bash
  npm run build && npm test
  ```
  Expected: build exits 0, 2 test files pass.

- [ ] **Step 4: Smoke the API locally** — start `npm run dev:api`, then:
  ```bash
  curl -s http://localhost:8787/api/health || curl -s -o /dev/null -w "%{http_code}" http://localhost:8787/
  ```
  Expected: a 2xx/404 JSON response from Hono (proves the app boots on the new version). Kill the dev server after.

**Verification:** `npm run build && npm test` green; worker boots under `wrangler dev`.

**Commit:**
```bash
git add package.json package-lock.json
git commit -m "fix(deps): bump hono to latest 4.x (JWT/CORS advisories)"
```

---

## Task 5: Security bump — fabric

**Files:**
- Modify: `package.json` (dependency `fabric`), `package-lock.json`

**Steps:**

- [ ] **Step 1: Check latest 7.x:**
  ```bash
  npm view fabric version
  ```

- [ ] **Step 2: Bump** (currently `^7.0.0` at `package.json:17`):
  ```bash
  npm install fabric@^7
  ```

- [ ] **Step 3: Rebuild and re-test:**
  ```bash
  npm run build && npm test
  ```
  Expected: green. fabric is used by the whiteboard feature; a full canvas interaction test is out of scope — build green + bundle success is this phase's bar.

**Verification:** `npm run build && npm test` green.

**Commit:**
```bash
git add package.json package-lock.json
git commit -m "fix(deps): bump fabric to latest 7.x (stored XSS advisory)"
```

---

## Task 6: Security bump — react-router-dom

**Files:**
- Modify: `package.json` (dependency `react-router-dom`), `package-lock.json`

**Steps:**

- [ ] **Step 1: Check latest 6.x** (stay on v6 — v7 is a breaking migration and out of scope):
  ```bash
  npm view react-router-dom@6 version
  ```

- [ ] **Step 2: Bump** (currently `^6.28.0` at `package.json:25`; target `^6.30.x` or latest 6.x shown above):
  ```bash
  npm install react-router-dom@^6
  ```

- [ ] **Step 3: Rebuild and re-test:**
  ```bash
  npm run build && npm test
  ```
  Expected: green. Note `vite.config.ts:18` lists `react-router-dom` in `manualChunks` — the chunk name is version-agnostic, no config change needed.

**Verification:** `npm run build && npm test` green.

**Commit:**
```bash
git add package.json package-lock.json
git commit -m "fix(deps): bump react-router-dom to latest 6.x (open redirect advisory)"
```

---

## Task 7: Transitive audit fixes (lodash / ws) and audit re-check

**Files:**
- Modify: `package-lock.json` (possibly `package.json` if npm adds overrides — prefer not to)

**Steps:**

- [ ] **Step 1: Apply non-breaking transitive fixes:**
  ```bash
  npm audit fix
  ```

- [ ] **Step 2: Re-audit:**
  ```bash
  npm audit
  ```
  Expected: 0 vulnerabilities, or only ones requiring `--force` (breaking). If breaking-fix vulnerabilities remain, record them in the commit message and `## Baseline Metrics` — do NOT run `npm audit fix --force` in this phase.

- [ ] **Step 3: Rebuild and re-test:**
  ```bash
  npm run build && npm test
  ```

**Verification:** `npm audit` shows 0 (or only breaking-fix) vulnerabilities; build + tests green.

**Commit:**
```bash
git add package.json package-lock.json
git commit -m "fix(deps): npm audit fix for transitive lodash/ws advisories"
```

---

## Task 8: Type-check the workers/ tree (ratchet, no fixes)

**Files:**
- Create: `workers/tsconfig.json`
- Modify: `package.json` (add `typecheck:api` script)

**Steps:**

- [ ] **Step 1: Create `workers/tsconfig.json`** (exact content; strictness mirrors root `tsconfig.json`, types from `@cloudflare/workers-types` which is already a root devDependency):
  ```json
  {
    "compilerOptions": {
      "target": "ES2022",
      "lib": ["ES2022"],
      "module": "ESNext",
      "moduleResolution": "bundler",
      "types": ["@cloudflare/workers-types"],
      "skipLibCheck": true,
      "isolatedModules": true,
      "moduleDetection": "force",
      "allowImportingTsExtensions": true,
      "noEmit": true,
      "strict": true,
      "noUnusedLocals": true,
      "noUnusedParameters": true,
      "noFallthroughCasesInSwitch": true
    },
    "include": ["api/**/*.ts"],
    "exclude": ["api/**/*.test.ts"]
  }
  ```

- [ ] **Step 2: Add script to `package.json`** after `"lint"`:
  ```json
  "typecheck:api": "tsc -p workers/tsconfig.json",
  ```

- [ ] **Step 3: Run and record the baseline — expect a flood of pre-existing errors; do NOT fix them:**
  ```bash
  npm run typecheck:api 2>&1 | tee /tmp/baseline-tsc-api.txt; grep -c "error TS" /tmp/baseline-tsc-api.txt || echo 0
  ```
  Record the count in `## Baseline Metrics`. This command is informational for now; later phases ratchet it down. Do not add it to `build` yet.

**Verification:** `npm run typecheck:api` executes and prints a stable error list (non-zero exit is acceptable and expected); count recorded.

**Commit:**
```bash
git add workers/tsconfig.json package.json
git commit -m "chore: add workers typecheck (baseline recorded, errors ratcheted)"
```

---

## Task 9: Lint the workers/ tree (ratchet, no fixes)

**Files:**
- Modify: `eslint.config.js`
- Modify: `package.json` (add `lint:api` script)

**Steps:**

- [ ] **Step 1: Remove `'workers'` from the ignores** in `eslint.config.js:8`:
  ```js
  { ignores: ['dist'] },
  ```

- [ ] **Step 2: Add a worker-file override so Node/Workers globals don't flood `no-undef`.** Append a block to the `tseslint.config(...)` call in `eslint.config.js`, after the existing config object:
  ```js
  {
    files: ['workers/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.serviceworker,
      },
    },
    rules: {
      // Ratchet: workers/ has a large pre-existing violation backlog.
      // Phase 0 only measures it; later phases re-enable rules as counts drop.
      '@typescript-eslint/no-explicit-any': 'off',
    },
  }
  ```
  (`globals` is already imported at `eslint.config.js:2`. `no-explicit-any` is turned off only for `workers/` because the API code base uses `any` pervasively; enabling it as an error would make the baseline useless noise. Keep everything else at recommended.)

- [ ] **Step 3: Add script to `package.json`** after `"typecheck:api"`:
  ```json
  "lint:api": "eslint workers",
  ```

- [ ] **Step 4: Run and record the baseline — do NOT fix violations:**
  ```bash
  npm run lint 2>&1 | tee /tmp/baseline-eslint-full.txt; tail -5 /tmp/baseline-eslint-full.txt
  ```
  (`npm run lint` = `eslint .`, which now covers `workers/` too.) Record the `✖ N problems (X errors, Y warnings)` line in `## Baseline Metrics`.

**Verification:** `npm run lint` completes over the whole repo including `workers/` and prints a stable summary; count recorded.

**Commit:**
```bash
git add eslint.config.js package.json
git commit -m "chore: lint workers/ tree (baseline recorded, errors ratcheted)"
```

---

## Task 10: Remove dead dependency `jose`

**Files:**
- Modify: `package.json` (remove devDependency `jose` at line 43), `package-lock.json`

**Steps:**

- [ ] **Step 1: Re-confirm it is unused (verified during planning — zero imports):**
  ```bash
  grep -rn "from 'jose'\|from \"jose\"" src workers --include="*.ts" --include="*.tsx" || echo "no imports"
  ```
  Expected: `no imports`. (The worker uses `hono/jwt` — see `workers/api/index.ts:3`.)

- [ ] **Step 2: Remove:**
  ```bash
  npm uninstall jose
  ```

- [ ] **Step 3: Rebuild and re-test:**
  ```bash
  npm run build && npm test
  ```

**Verification:** build + tests green; `grep jose package.json` empty.

**Commit:**
```bash
git add package.json package-lock.json
git commit -m "chore: remove unused jose devDependency"
```

---

## Task 11: Declare the `warning` dependency used by vite.config.ts

**Files:**
- Modify: `package.json` (add dependency `warning`), `package-lock.json`
- Modify: none in `vite.config.ts` (references stay — see finding below)

**Finding (verified during planning):** `warning` is not imported by any first-party source, but `react-pdf@10.3.0` depends on `warning@^4.0.3` (package-lock `node_modules/react-pdf` → `"warning": "^4.0.0"`, resolved at `node_modules/warning@4.0.3`). The references at `vite.config.ts:43` (`optimizeDeps.include`) and `vite.config.ts:48` (`ssr.noExternal`) exist to handle react-pdf's CJS interop. Dropping them risks breaking the PDF chunk; declaring the package explicitly is the minimal, correct fix — it converts an undeclared transitive reliance into a pinned direct dependency.

**Steps:**

- [ ] **Step 1: Add the dependency at the lockfile's resolved version:**
  ```bash
  npm install warning@^4.0.3
  ```

- [ ] **Step 2: Rebuild and re-test:**
  ```bash
  npm run build && npm test
  ```
  Expected: green; `vendor-pdf` chunk still emitted by `manualChunks` (`vite.config.ts:26`).

**Verification:** `npm run build` green; `npm ls warning` shows a single top-level entry.

**Commit:**
```bash
git add package.json package-lock.json
git commit -m "fix(deps): declare warning dependency referenced by vite config (react-pdf CJS interop)"
```

---

## Task 12: wrangler.toml hygiene + .dev.vars.example

**Files:**
- Modify: `wrangler.toml`
- Create: `.dev.vars.example`

**Steps:**

- [ ] **Step 1: Expand the secrets comment block** in `wrangler.toml` (currently lines 14–18 document only 4 of 8 secrets). Replace that block with:
  ```toml
  # IMPORTANT: Set these secrets using wrangler:
  # wrangler secret put JWT_SECRET               (generate a secure random string)
  # wrangler secret put RESEND_API_KEY           (your Resend API key for emails)
  # wrangler secret put GOOGLE_CLIENT_ID         (from Google Cloud Console)
  # wrangler secret put GOOGLE_CLIENT_SECRET     (from Google Cloud Console)
  # wrangler secret put PAYSTACK_SECRET_KEY      (from Paystack dashboard)
  # wrangler secret put PAYSTACK_WEBHOOK_SECRET  (from Paystack dashboard)
  # wrangler secret put TURNSTILE_SECRET         (from Cloudflare Turnstile)
  # wrangler secret put ANTHROPIC_API_KEY        (from Anthropic console, optional AI fallback)
  ```
  (All 8 names verified against the `Env` interface at `workers/api/index.ts:44-64`.)

- [ ] **Step 2: Add observability** after the `[vars]` block:
  ```toml
  [observability]
  enabled = true
  ```

- [ ] **Step 3: Add a `[env.dev]` named environment so local dev is not "production".** Named environments do not inherit bindings from the top level, so declare the full set (mirroring `[env.production]` at lines 45–69, with `ENVIRONMENT = "development"`):
  ```toml
  # Local development environment (wrangler dev --env dev)
  [env.dev.vars]
  ENVIRONMENT = "development"
  AI_PROVIDER = "workers-ai"
  AI_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast"
  APP_URL = "http://localhost:3000"
  FROM_EMAIL = "Brilla Study Platform <noreply@brillaprep.org>"
  GOOGLE_REDIRECT_URI = "http://localhost:3000/oauth/callback"
  NOTIFICATION_EMAILS = "brillaprepgh@gmail.com"

  [env.dev.ai]
  binding = "AI"

  [[env.dev.d1_databases]]
  binding = "DB"
  database_name = "brilla-db"
  database_id = "aa806d65-d3dd-4cf9-9cac-e3ddd252f937"
  migrations_dir = "database/migrations"

  [[env.dev.r2_buckets]]
  binding = "LIBRARY_BUCKET"
  bucket_name = "brilla-library"

  [[env.dev.r2_buckets]]
  binding = "RECORDINGS_BUCKET"
  bucket_name = "brilla-recordings"
  ```

- [ ] **Step 4: Point the dev script at it** in `package.json` (line 8):
  ```json
  "dev:api": "wrangler dev --env dev",
  ```

- [ ] **Step 5: Create `.dev.vars.example`** (exact content; `.dev.vars` itself is already gitignored via `.gitignore`):
  ```
  # Copy to .dev.vars and fill in real values for local development.
  # Never commit .dev.vars.
  JWT_SECRET=change-me-generate-a-secure-random-string
  RESEND_API_KEY=
  GOOGLE_CLIENT_ID=
  GOOGLE_CLIENT_SECRET=
  PAYSTACK_SECRET_KEY=
  PAYSTACK_WEBHOOK_SECRET=
  TURNSTILE_SECRET=
  ANTHROPIC_API_KEY=
  ```

- [ ] **Step 6: Validate config and boot:**
  ```bash
  npx wrangler dev --env dev --dry-run 2>&1 | head -20 || true
  npm run dev:api & sleep 8; curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8787/; kill %1
  ```
  Expected: wrangler parses the config; the worker serves on :8787.

- **OUT OF SCOPE (flagged follow-up task, separate phase):** bump `compatibility_date = "2024-01-01"` (`wrangler.toml:3`) to a current date. This changes runtime behavior (Node.js compat flags, stream semantics) and requires a full API smoke test against `wrangler dev` plus a staging deploy — do not bundle it into this phase.

**Verification:** `npx wrangler dev --env dev` boots and serves; `wrangler.toml` parses with `[env.dev]`, `[observability]`, and the 8-secret comment block.

**Commit:**
```bash
git add wrangler.toml .dev.vars.example package.json
git commit -m "chore: wrangler dev env, observability, full secrets docs, .dev.vars.example"
```

---

## Verification

Run the full green list at the end of the phase (from repo root):

```bash
npm ci                                  # clean reproducible install
npm run build                           # tsc -b && vite build — exits 0
npm test                                # vitest run — 2 test files pass (frontend + worker)
npm run lint                            # eslint . (now includes workers/) — runs; count recorded
npm run typecheck:api                   # tsc -p workers/tsconfig.json — runs; count recorded
npm audit                               # 0 vulnerabilities (or only breaking-fix ones, recorded)
npx wrangler dev --env dev --dry-run    # wrangler config parses
```

## Baseline Metrics

Filled in by the executor during Tasks 1, 8, 9 (do not delete — later phases ratchet against these):

- Frontend `tsc -b` errors (Task 1): `0`
- Frontend+repo `eslint .` problems before workers/ inclusion (Task 1): `144` (errors: `63`, warnings: `81`)
- `npm audit` vulnerabilities before bumps (Task 1): `24` (1 low, 5 moderate, 16 high, 2 critical)
- `npm audit` vulnerabilities after bumps (Task 7): `12` (breaking-fix-only remainder: `12` — 6 moderate, 5 high, 1 critical; includes 2 parked react-router moderates with no patched 6.x, plus esbuild/vite/vitest, sharp, undici/miniflare, ws chains that all require `npm audit fix --force`)
- `npm run typecheck:api` errors (Task 8): `316`
- `npm run lint` problems after workers/ inclusion (Task 9): `<fill in>` (errors: `<fill in>`, warnings: `<fill in>`)
- hono / fabric / react-router-dom versions after bumps (Tasks 4–6): `<fill in>`
