# Pilot Schools Admin Feature — Implementation Plan

> **Sub-skill:** execute with `superpowers:subagent-driven-development` — dispatch tasks in order, review between tasks.

**Goal:** Give the founder a sleek admin-portal surface for pilot provisioning — create schools, provision a per-school ambassador account + referral code, and assign students to schools individually or in bulk — replacing the manual SQL runbook steps.

**Architecture:** New admin endpoints on `adminApp` (workers/api/index.ts) + one new admin page `src/pages/admin/AdminSchools.tsx` (matching the existing admin design system: AdminHeader/AdminButton/AdminInput patterns used by AdminAffiliates.tsx). All endpoints behind `requireAdmin`. Identity from JWT context only.

**Tech stack:** Hono/D1, React + Tailwind, vitest + mockD1.

## Global Constraints

- Gates after every task: `npx vitest run` all pass; `npm run build` green; `npx tsc -p workers/tsconfig.json | grep -c "error TS"` ≤ 130; `npm run db:verify` 18/18.
- Commits only with the standing approval for this session's task commits.
- No wrangler --remote commands.
- Every mutation validates input (name/slug/email lists); idempotent where re-runnable.
- Envelope convention: `{ success: true, data }` / `{ success: false, error }`.

---

## Task 1 — Backend: pilot admin endpoints

**Files:**
- `workers/api/index.ts` (new routes on adminApp, near the race PATCH at ~:7599)
- `workers/api/__tests__/admin-schools.test.ts` (new)

**Endpoints:**

- `GET /api/admin/schools` → `{ success, data: { schools: [{ id, name, slug, status, studentCount, ambassadorCode, createdAt }] } }` — studentCount = COUNT(users WHERE school_id), ambassadorCode = the referral_code of the affiliate profile whose owner user has school_id = the school AND email LIKE '%@ambassador.brilla' (see Task 1 step below).
- `POST /api/admin/schools` body `{ name, slug }` → validates (name 2-100, slug `/^[a-z0-9-]{2,40}$/`), `INSERT INTO schools` → 400 on duplicate slug → `{ success, data: { id } }` with id `sch_<slug>`.
- `POST /api/admin/schools/:id/ambassador` body `{ code }` → code validated via `isValidReferralCode` (affiliates.ts export), must not already exist in affiliate_profiles. Creates: user `ambassador_<school.slug>@ambassador.brilla` (name "<School> Ambassador", role 'student', status 'approved', is_active 1, email_verified 1, school_id = the school, password_hash = `crypto.randomUUID()`-based unusable sentinel 'disabled_ambassador_<uuid>'), plus affiliate_profiles row (referral_code = code uppercased, user_id = the ambassador, tier default). All writes in ONE `c.env.DB.batch`. 409 if the school already has an ambassador. → `{ success, data: { userId, code } }`.
- `POST /api/admin/schools/:id/students` body `{ emails: string[] }` (max 500) → for each valid email: `UPDATE users SET school_id = ? WHERE email = ? AND school_id IS NULL` (never reassign without force); collect `{ assigned: [...], skipped: [{ email, reason }] }` (reasons: not_found, already_assigned). Run as one batch → `{ success, data: { assigned: number, skipped: [...] } }`.
- `POST /api/admin/schools/:id/students/:userId` body `{ force?: boolean }` → individual assign; force=true allows reassignment → `{ success, data: { userId, schoolId } }`.
- `DELETE /api/admin/schools/:id/students/:userId` → unassign (set school_id NULL) → `{ success, data: { userId } }`.

**Steps:**

- [ ] TDD the test file first: (a) create school → row + 400 on dupe slug; (b) ambassador provisioning → user + affiliate profile batched, code uppercase, 409 on second ambassador; (c) bulk assign — mixed list (valid unassigned / unknown email / already-assigned) → correct assigned/skipped split, never reassigns without force; (d) individual assign + force reassign + unassign; (e) all routes 401/403 without admin token (mock users lookup role student).
- [ ] Implement the routes on adminApp. Reuse `isValidReferralCode` from `./affiliates`.
- [ ] Gates per Global Constraints.

**Commit:** `feat(api): admin pilot-schools endpoints (schools, ambassador, bulk assign)`

---

## Task 2 — Frontend: AdminSchools page

**Files:**
- `src/pages/admin/AdminSchools.tsx` (new)
- `src/App.tsx` (route + lazy import; admin routes are protected — find the admin route block)
- `src/components/admin/layout/AdminSidebar.tsx` or equivalent nav (add "Pilot Schools" entry — find the admin nav)

**Steps:**

- [ ] Page layout matching AdminAffiliates/AdminDashboard conventions (header, cards, tables).
- [ ] **Schools list card**: table (name, slug, students, ambassador code, status) + "New school" inline form (name, slug auto-suggested from name).
- [ ] **Ambassador card per school**: "Provision ambassador" with code input (e.g. STJOHNS) → on success shows the code prominently with copy-to-clipboard + the shareable link `https://brillaprep.org/?register=true&ref=<CODE>` with its own copy button. If ambassador exists, just show the code + link.
- [ ] **Bulk assign card**: textarea (one email per line) → parses, POSTs, shows results: "N assigned" + skipped table with reasons. Optional CSV file input that reads the file and extracts the email column (first column or a column named email).
- [ ] **Individual assign**: student search input (by email) + assign/unassign buttons using the single-student endpoints.
- [ ] All errors surface inline (400/409 envelopes).
- [ ] Route + nav entry; verify the page is admin-gated by the existing admin route protection.
- [ ] Gates per Global Constraints.

**Commit:** `feat(web): admin pilot-schools page (schools, ambassador codes, bulk assign)`

---

## Task 3 — Final gate + deploy

- [ ] Full gate suite (vitest, build, tsc ≤130, db:verify 18/18, wrangler dry-run).
- [ ] Controller deploys (worker + site) after review.

## Verification

Full gate list from Global Constraints + reviewer pass.

## Out of scope

- Invite-mode flip (wrangler var, founder action), race target tuning UI (PATCH endpoint exists), school deletion, editing school names, student-facing school pages.
