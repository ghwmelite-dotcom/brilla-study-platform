# Phase 6 — Headers & Hygiene

**Goal:** Ship the production app with a real security-header set (CSP, HSTS, XFO, nosniff, Referrer-Policy, Permissions-Policy), extend the pitch site's headers, and clear the low-severity API/frontend leftovers from the audit.

**Architecture:** Vite React SPA (`index.html` + `public/`) deployed to Cloudflare Pages-style static hosting (`public/_redirects` present, `public/_headers` missing); Hono API worker (`workers/api/index.ts`, monolith, plus `workers/api/library.ts` router) configured by root `wrangler.toml`; separate static pitch site in `lynx-pitch/` with its own `_headers`.

**Tech stack:** Vite 5, React 18, TypeScript 5.6, Hono 4, Cloudflare Workers (D1, R2, Workers AI), Node v24 (built-in `node:test` with native TS type-stripping — no test framework needed).

**Runs last:** CSP depends on Phase 4 (frontend inline-script work) and Phase 0 (dep bumps). Verified at planning time: Phase 4 did **not** externalize the inline service-worker script — it is still inline at `index.html:379-406`, so this phase externalizes it (see Task 1).

## Global Constraints

- **script-src must not contain 'unsafe-inline'** (style-src may keep it — two inline `<style>` blocks and many `style=` attributes in `index.html` make it unavoidable without a rewrite; documented tradeoff, styles cannot exfiltrate data the way scripts can).
- Minimal diff.
- Every task ends with a verifiable command and expected output.
- Commits only with user's explicit approval.
- CSP hashes were rejected for the inline SW script: hashes do not cover the two inline `onload=` event-handler attributes (`index.html:86,92`), so `'unsafe-hashes'` would also be needed — externalization is strictly better. **Decision: externalize in this phase.**
- Paystack needs **no** CSP entry: payments are full-page redirects to `authorizationUrl` (`src/pages/Pricing.tsx:58`, `src/pages/TutoringSessions.tsx:233`); top-level navigation is not CSP-gated.
- CSP must include (verified against source): `https://challenges.cloudflare.com` in script-src + frame-src (Turnstile, `src/components/common/Turnstile.tsx:176`), `https://unpkg.com` in worker-src (react-pdf worker, `src/utils/pdfExtractor.ts:5`, `src/components/library/PDFViewer.tsx:17`), `https://fonts.googleapis.com` (style-src), `https://fonts.gstatic.com` (font-src), `https://cdn.jsdelivr.net` (style-src + font-src for KaTeX CSS/fonts, `index.html:92`), `https://brilla-api.ghwmelite.workers.dev` (connect-src + img-src for avatars).

---

## Task 1 — Externalize inline scripts/handlers in index.html (CSP prerequisite)

**Files:** `index.html`, `public/app-bootstrap.js` (new)

- [ ] Create `public/app-bootstrap.js` with exactly this content:

```js
// Loaded with `defer` from index.html. Replaces the inline SW-registration
// script and the two inline `onload=` handler attributes so that
// Content-Security-Policy script-src can drop 'unsafe-inline'.

// Async stylesheet swaps (previously inline onload attributes)
var fontLink = document.getElementById('google-fonts');
if (fontLink) {
  fontLink.addEventListener('load', function () { fontLink.media = 'all'; });
}
var katexLink = document.getElementById('katex-css');
if (katexLink) {
  katexLink.addEventListener('load', function () { katexLink.rel = 'stylesheet'; });
}

// Service Worker Registration (moved verbatim from the old inline script)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js')
      .then(function (registration) {
        console.log('SW registered:', registration.scope);
        registration.addEventListener('updatefound', function () {
          var newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', function () {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                if (confirm('New version available! Reload to update?')) {
                  window.location.reload();
                }
              }
            });
          }
        });
      })
      .catch(function (error) {
        console.log('SW registration failed:', error);
      });
  });
}
```

- [ ] `index.html:86` — remove `onload="this.media='all'"` and add `id="google-fonts"`:
  `<link id="google-fonts" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@600;700;800&display=swap" rel="stylesheet" media="print" />`
- [ ] `index.html:92` — remove `onload="this.onload=null;this.rel='stylesheet'"` and add `id="katex-css"`:
  `<link id="katex-css" rel="preload" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" as="style" />`
- [ ] `index.html:378-406` — replace the whole `<!-- Service Worker Registration -->` inline `<script>` block with:
  `<script src="/app-bootstrap.js" defer></script>`
- [ ] Add SRI to the KaTeX stylesheet (jsdelivr sends CORS headers, so this is feasible). Compute the hash:
  `curl -s https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css | openssl dgst -sha384 -binary | openssl base64 -A`
  Then add `integrity="sha384-<hash>" crossorigin="anonymous"` to **both** the preload link (line 92) and the `<noscript>` fallback link (line 94). If the fetch is blocked in the executor's environment, skip SRI and leave a `<!-- TODO: add SRI hash -->` comment — do not guess a hash.
- [ ] Verify: `npm run build && grep -c "onload=" dist/index.html && grep -c "<script>" dist/index.html` — expected output: `0` then `0` (first grep exits 1 on no match; that is success). Also confirm `dist/app-bootstrap.js` exists and `dist/index.html` contains `/app-bootstrap.js`.
- [ ] Manual smoke: `npm run preview`, open the app — fonts load, loader renders, SW registers (DevTools → Application → Service Workers shows `/sw.js` activated), no CSP errors yet (headers not yet added).
- [ ] Commit (only with user's explicit approval): `feat: externalize inline bootstrap script for CSP`

---

## Task 2 — Create public/_headers

**Files:** `public/_headers` (new)

- [ ] Create `public/_headers` with exactly this content (CSP must be a single line):

```
/*
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()
  Content-Security-Policy: default-src 'self'; script-src 'self' https://challenges.cloudflare.com https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net; img-src 'self' data: blob: https://brilla-api.ghwmelite.workers.dev; connect-src 'self' https://brilla-api.ghwmelite.workers.dev https://challenges.cloudflare.com; worker-src 'self' https://unpkg.com; frame-src https://challenges.cloudflare.com; manifest-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'

/index.html
  Cache-Control: public, max-age=0, must-revalidate

/sw.js
  Cache-Control: public, max-age=0, must-revalidate

/assets/*
  Cache-Control: public, max-age=31536000, immutable
```

- [ ] Verify build copies it: `npm run build && cat dist/_headers | head -3` — expected: the `/*` block starting with `Strict-Transport-Security`.
- [ ] Verify post-deploy (requires deployment):
  `curl -sI https://brillaprep.org | grep -i strict-transport` — expected: `strict-transport-security: max-age=63072000; includeSubDomains; preload`
  `curl -sI https://brillaprep.org | grep -iE "content-security-policy|x-frame-options|x-content-type"` — expected: all three headers present, CSP contains `script-src 'self'` and does **not** contain `unsafe-inline` in script-src.
- [ ] Functional smoke post-deploy (CSP regressions show in the browser console as `Refused to load...`): login page renders, Turnstile widget loads, a KaTeX-rendered question renders, a PDF past-paper loads (react-pdf/unpkg worker), avatar image displays.
- [ ] Commit (only with user's explicit approval): `feat: add Cloudflare _headers with CSP and HSTS`

---

## Task 3 — Extend lynx-pitch/_headers

**Files:** `lynx-pitch/_headers`

Verified: pitch site has external `script.js`/`styles.css`, Google Fonts, no inline event handlers, no inline `style=` attributes (`grep -c` returned 0 for both). CSP can be strict.

- [ ] Replace `lynx-pitch/_headers` with exactly this content:

```
/*
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'

/*.html
  Cache-Control: public, max-age=0, must-revalidate

/*.css
  Cache-Control: public, max-age=31536000, immutable

/*.js
  Cache-Control: public, max-age=31536000, immutable
```

- [ ] Verify post-deploy: `curl -sI https://lynx-presentation.pages.dev | grep -iE "strict-transport|content-security"` — expected: both headers present.
- [ ] Open the pitch site; confirm animations/scroll-reveal (`script.js`) still run and fonts render.
- [ ] Commit (only with user's explicit approval): `feat: add CSP and HSTS to pitch site headers`

---

## Task 4 — og-image, theme color, .gitignore cleanup

**Files:** `public/og-image.png` (new), `public/manifest.json`, `index.html`, `public/browserconfig.xml`, `.gitignore`

Decisions (verified): `public/branding/storefront-banner.png` is a 1200×628 PNG — effectively the 1200×630 OG standard, use it as the og-image source. Theme color: **#006B3F** — it is the brand primary (`tailwind.config.js:12`), the loader gradient color, and the skip-link color; the audit's other candidates (#fcd116 gold = secondary accent, #1e3a8a blue = only in the storefront banner gradient) lose. Align manifest, index.html meta tags, and browserconfig to it.

- [ ] `cp public/branding/storefront-banner.png public/og-image.png` (fixes `index.html:19,26` referencing a nonexistent `/og-image.png`).
- [ ] `public/manifest.json:8` — change `"theme_color": "#fcd116"` → `"theme_color": "#006B3F"`.
- [ ] `index.html:29` — `<meta name="theme-color" content="#1e3a8a" />` → `content="#006B3F"`.
- [ ] `index.html:35` — `<meta name="msapplication-TileColor" content="#1e3a8a" />` → `content="#006B3F"`.
- [ ] `public/browserconfig.xml:9` — `<TileColor>#1e3a8a</TileColor>` → `<TileColor>#006B3F</TileColor>`.
- [ ] `.gitignore:54` — delete the stray `nul` line (last line of file; a Windows-accident entry).
- [ ] Verify: `npm run build && file dist/og-image.png && grep -h "theme.color\|TileColor" dist/index.html dist/browserconfig.xml dist/manifest.json | grep -c 006B3F` — expected: `PNG image data, 1200 x 628` and count `4`.
- [ ] Verify post-deploy: `curl -sI https://brillaprep.org/og-image.png | grep -i "200\|content-type"` — expected: `HTTP/2 200` and `content-type: image/png`.
- [ ] Commit (only with user's explicit approval): `fix: add og-image, unify theme color to brand green, clean gitignore`

---

## Task 5 — package.json cleanup (root + workers/)

**Files:** `package.json`, `workers/package.json` (delete)

Verified: `package.json:13` `api:secret` runs `wrangler secret put ANTHROPIC_API_KEY`, but `wrangler.toml:7` declares `AI_PROVIDER = "workers-ai"` with an `[ai]` binding — the Anthropic secret is never read. Root package.json already has `dev:api`/`dev:all` and pins `wrangler ^3.99.0`; there is no `workers/node_modules`, and `workers/package.json`'s `db:migrate` points at `../database/schema.sql` while `wrangler.toml:38` uses `migrations_dir = "database/migrations"`. **Decision: delete `workers/package.json` entirely; add nothing to root.**

- [ ] `package.json` — remove line 13 (`"api:secret": "wrangler secret put ANTHROPIC_API_KEY"`) and the trailing comma after `"preview": "vite preview"` on line 12. Result: `"preview": "vite preview"` is the last script.
- [ ] Delete `workers/package.json`.
- [ ] Verify: `node -e "JSON.parse(require('fs').readFileSync('package.json','utf8'))" && echo OK` — expected: `OK`. `ls workers/` — expected: only `api/` remains. `npm run dev:api -- --help >/dev/null 2>&1; echo $?` — expected: `0` (wrangler still resolves from root node_modules).
- [ ] Commit (only with user's explicit approval): `chore: remove stale api:secret script and dead workers/package.json`

---

## Task 6 — wrangler.toml: bump compatibility_date, dedupe env.production

**Files:** `wrangler.toml`

Verified: `compatibility_date = "2024-01-01"` (~19 months stale) and the `[env.production.*]` blocks duplicate the top-level vars/ai/d1/r2/triggers verbatim. Named environments inherit top-level bindings and vars in wrangler, so the duplication is pure drift risk. Keep shared config at top level; delete the env blocks.

- [ ] Set `compatibility_date = "2025-06-01"` — executor must first check the current date (`date`) and the latest Workers docs/changelog (`https://developers.cloudflare.com/workers/configuration/compatibility-dates/`); if the platform's current default is newer than 2025-06-01, use a date within the last 3 months instead and record the chosen date in the commit message.
- [ ] Delete lines 44-77: the entire `# Production environment` section (`[env.production.vars]`, `[env.production.ai]`, both `[[env.production.d1_databases]]`/`[[env.production.r2_buckets]]` blocks, `[env.production.triggers]`). Keep top-level `[vars]`, `[ai]`, `[[r2_buckets]]`×2, `[[d1_databases]]`, `[dev]`, `[triggers]`.
- [ ] Note for executor: confirm how production deploys are invoked. Plain `wrangler deploy` uses top-level config (unchanged behavior). If anything deploys with `--env production`, it now inherits top-level config — bindings/vars are identical post-dedup, so behavior is unchanged; but search CI/docs for `--env production` first (`grep -rn "env production" .github docs/ package.json 2>/dev/null`) and if found, flag it to the user before deploying.
- [ ] Verify config parses: `npx wrangler deploy --dry-run 2>&1 | tail -5` — expected: no TOML errors, dry-run succeeds, shows bindings DB, LIBRARY_BUCKET, RECORDINGS_BUCKET, AI.
- [ ] **Required smoke-test checklist after the compat-date bump + deploy** (compat bumps can change runtime behavior):
  1. Login — POST `/api/auth/login` with a known test account returns `{ "success": true, ... }`.
  2. One AI call — trigger one AI-tutor/chat request; expect a non-error completion (Workers AI binding unaffected).
  3. One D1 read — GET a public endpoint backed by D1 (e.g. exam types/subjects list) returns data.
  4. File upload — upload a small avatar image via `/api/users/me/avatar`; expect `success: true` and a working `avatarUrl` (also exercises Task 9).
- [ ] Commit (only with user's explicit approval): `chore: bump workers compatibility_date, dedupe env.production config`

---

## Task 7 — Invite codes: crypto.getRandomValues

**Files:** `workers/api/index.ts` (function at lines 5066-5074)

- [ ] Replace `generateInviteCode()` with:

```ts
// Generate 6-character invite code for student
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 32 chars, excludes confusing ones
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  // 256 % 32 === 0, so the modulo introduces no bias
  return Array.from(bytes, (b) => chars.charAt(b % chars.length)).join('');
}
```

- [ ] Verify: `npx tsc -b --noEmit 2>&1 | head -5` — expected: no new errors referencing `generateInviteCode`. Then exercise it: `wrangler dev`, call the parent invite-code endpoint, confirm a 6-char code from the alphabet is returned.
- [ ] Commit (only with user's explicit approval): `fix: use CSPRNG for parent invite codes`

---

## Task 8 — Constant-time password-hash comparison

**Files:** `workers/api/index.ts` (lines 234-236)

Current code uses `hashBytes.every(...)` which short-circuits on the first differing byte. Replace with an XOR-accumulating loop (works on every Workers runtime regardless of compat date; `crypto.subtle.timingSafeEqual` would be an alternative only after the Task 6 bump, but the loop is dependency-free — keep the loop).

- [ ] Replace:

```ts
    const hashBytes = new Uint8Array(hash);
    if (hashBytes.length !== storedHashBytes.length) return false;
    return hashBytes.every((byte, i) => byte === storedHashBytes[i]);
```

with:

```ts
    const hashBytes = new Uint8Array(hash);
    // Constant-time comparison: no early exit on first mismatch.
    // Length difference is folded into the accumulator; the modulo index
    // keeps the loop bounded when lengths differ.
    let diff = hashBytes.length ^ storedHashBytes.length;
    for (let i = 0; i < hashBytes.length; i++) {
      diff |= hashBytes[i] ^ storedHashBytes[i % storedHashBytes.length];
    }
    return diff === 0;
```

- [ ] Verify: `wrangler dev`, log in with a correct password (succeeds) and a wrong password (fails with the same 401 shape as before). `npx tsc -b --noEmit` shows no new errors.
- [ ] Commit (only with user's explicit approval): `fix: constant-time password hash comparison`

---

## Task 9 — Avatar upload: magic-byte sniffing + safe serving

**Files:** `workers/api/index.ts` (upload handler at lines 4797-4867), `workers/api/library.ts` (serving route at lines 114-139)

Verified problems: upload trusts client `file.type` (`index.ts:4816-4819`) and the client filename extension (`index.ts:4846`); the serving route (`library.ts:131`) replays the stored content type with no `nosniff`.

Magic-byte table:

| Type | Signature (hex) | Offset |
|---|---|---|
| PNG | `89 50 4E 47 0D 0A 1A 0A` | 0 |
| JPEG | `FF D8 FF` | 0 |
| GIF | `47 49 46 38` ("GIF8") | 0 |
| WebP | `52 49 46 46` ("RIFF") at 0 + `57 45 42 50` ("WEBP") at 8 | 0/8 |

- [ ] Add near the upload handler in `workers/api/index.ts`:

```ts
// Sniff image magic bytes — never trust client-supplied file.type/extension
function sniffImageType(bytes: Uint8Array): 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp' | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) return 'image/gif';
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return 'image/webp';
  return null;
}

const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
};
```

- [ ] In the avatar handler, replace the `file.type` check (lines 4815-4819) and the extension derivation (line 4846) with:

```ts
    // Read the file and sniff its real type from magic bytes
    const buffer = new Uint8Array(await file.arrayBuffer());
    const sniffedType = sniffImageType(buffer);
    if (!sniffedType) {
      return c.json({ success: false, error: 'Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.' }, 400);
    }
```

  (keep the existing 5MB size check; `file.size` still works), then:

```ts
    // Generate unique file key — extension comes from the sniffed type, not the client filename
    const fileKey = `avatars/${user.userId}_${Date.now()}.${IMAGE_EXTENSIONS[sniffedType]}`;

    // Upload to R2
    await c.env.LIBRARY_BUCKET.put(fileKey, buffer, {
      httpMetadata: {
        contentType: sniffedType,
      },
    });
```

- [ ] In `workers/api/library.ts:130-132`, add one line after the existing `Content-Type` header:
  `headers.set('X-Content-Type-Options', 'nosniff');`
- [ ] Verify: `wrangler dev`; upload a real PNG → success, returned URL serves `content-type: image/png` and `x-content-type-options: nosniff` (`curl -sI <avatarUrl> | grep -i "content-type"`). Upload a `.png` that is actually a text file (`echo notanimage > fake.png`) → expect `400` with "Invalid file type".
- [ ] Commit (only with user's explicit approval): `fix: sniff avatar magic bytes, serve uploads with nosniff`

---

## Task 10 — Registration input validation + tests

**Files:** `workers/api/validation.ts` (new), `workers/api/validation.test.ts` (new), `workers/api/index.ts` (register handler at lines 1065-1128), `package.json`

Verified: `/auth/register` binds `email`/`password`/`name` straight from the body into the query/hash with no format validation (`index.ts:1066-1128`). No test runner exists in the repo; Node v24 runs TypeScript tests natively via `node --test` (type stripping), so no new dependency.

- [ ] Create `workers/api/validation.ts` (pure functions, erasable TS syntax only — no enums/namespaces, so `node --test` can run it):

```ts
// Pure validation helpers for auth routes. Kept dependency-free so they can
// be unit-tested with Node's built-in test runner.

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: unknown): email is string {
  return typeof email === 'string' && email.length <= 254 && EMAIL_RE.test(email);
}

export function validatePassword(password: unknown): password is string {
  return typeof password === 'string' && password.length >= 8 && password.length <= 128;
}

export function validateName(name: unknown): name is string {
  return typeof name === 'string' && name.trim().length >= 2 && name.trim().length <= 100;
}

/** Returns an error message, or null when the input is valid. */
export function validateRegistration(body: { email?: unknown; password?: unknown; name?: unknown }): string | null {
  if (!validateEmail(body.email)) return 'A valid email address is required.';
  if (!validatePassword(body.password)) return 'Password must be at least 8 characters long.';
  if (!validateName(body.name)) return 'Name must be between 2 and 100 characters.';
  return null;
}
```

- [ ] Create `workers/api/validation.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateRegistration, validateEmail, validatePassword, validateName } from './validation.ts';

test('validateEmail', () => {
  assert.equal(validateEmail('student@example.com'), true);
  assert.equal(validateEmail('a@b.co'), true);
  assert.equal(validateEmail('not-an-email'), false);
  assert.equal(validateEmail('missing@tld'), false);
  assert.equal(validateEmail(''), false);
  assert.equal(validateEmail(undefined), false);
  assert.equal(validateEmail(42), false);
  assert.equal(validateEmail(`${'a'.repeat(250)}@b.co`), false); // >254 chars
});

test('validatePassword', () => {
  assert.equal(validatePassword('12345678'), true);
  assert.equal(validatePassword('1234567'), false); // too short
  assert.equal(validatePassword(''), false);
  assert.equal(validatePassword(undefined), false);
  assert.equal(validatePassword('x'.repeat(129)), false); // too long
});

test('validateName', () => {
  assert.equal(validateName('Kofi Mensah'), true);
  assert.equal(validateName('Ab'), true);
  assert.equal(validateName('A'), false); // too short
  assert.equal(validateName('   '), false); // whitespace-only
  assert.equal(validateName('x'.repeat(101)), false); // too long
  assert.equal(validateName(null), false);
});

test('validateRegistration returns first error or null', () => {
  assert.equal(validateRegistration({ email: 'a@b.co', password: '12345678', name: 'Ab' }), null);
  assert.match(validateRegistration({ email: 'bad', password: '12345678', name: 'Ab' })!, /email/i);
  assert.match(validateRegistration({ email: 'a@b.co', password: 'short', name: 'Ab' })!, /8 characters/i);
  assert.match(validateRegistration({ email: 'a@b.co', password: '12345678', name: '' })!, /Name/i);
});
```

- [ ] In `workers/api/index.ts`, import `validateRegistration` from `./validation` and, in the register handler immediately after the rate-limit/Turnstile checks and before the existing-email query (before line 1117's `try` block contents run — i.e. as the first statement inside `try {` at line 1115), add:

```ts
    const validationError = validateRegistration({ email, password, name });
    if (validationError) {
      return c.json({ success: false, error: validationError }, 400);
    }
```

- [ ] `package.json` — add script: `"test": "node --test workers/api/validation.test.ts"`.
- [ ] Verify: `npm test` — expected: `pass 4`, `fail 0`. Also `wrangler dev` + POST `/api/auth/register` with `{"email":"bad","password":"x","name":""}` → expect HTTP 400 with "A valid email address is required."
- [ ] Commit (only with user's explicit approval): `fix: validate registration email/password/name, add node:test coverage`

---

## Task 11 — Frontend key={index} audit

**Files:** `src/components/chat/ChatInput.tsx`, `src/components/essay/EssayFeedback.tsx` (optionally `src/components/events/TournamentCard.tsx`)

Verified verdicts per site:

- `ChatInput.tsx:123` — **real bug**: attachments are a mutable list (items are appended and individually removable), `AttachmentPreview` (`ChatInput.tsx:8-11`) has no stable id.
- `EssayFeedback.tsx:223,241,263` — display-only AI-feedback lists, never reordered; index keys are harmless but text-derived keys are trivially available.
- `TournamentCard.tsx:126` — prizes rendered via `slice(0, 3)` with `rank={index + 1}`; the list is positional (rank **is** the identity) and never reorders. Only change if the `prize` object has a unique field; otherwise leave it and add a comment.
- `ProfileCustomizer.tsx:362` — **audit claim inaccurate**: that line is `key={i}` over the static literal `[1, 2, 3]` (a fixed 3-dot preview); the surrounding dynamic list already keys on `style.id` (`ProfileCustomizer.tsx:348`). **Skip — no change.**

Steps:

- [ ] `ChatInput.tsx` — add `id: string` to `AttachmentPreview`; at the creation site (the file-input handler that calls `setAttachments((prev) => [...prev, ...])`), set `id: crypto.randomUUID()` per new attachment; change `key={index}` → `key={attachment.id}` at line 123.
- [ ] `EssayFeedback.tsx` — line 223: `key={strength}`; line 241: `key={improvement}`; line 263: `key={`${error.position.start}-${error.text}`}`.
- [ ] `TournamentCard.tsx` — inspect the `prize` type; if it has a unique `id`/`label`, key on it; otherwise add `// positional list: rank is the stable identity` above the map and leave `key={index}`.
- [ ] Verify: `npm run lint 2>&1 | grep -E "ChatInput|EssayFeedback|TournamentCard|ProfileCustomizer"` — expected: no output (no new warnings). `npm run build` succeeds. Chat UI: attach two files, remove the first, confirm the correct preview remains.
- [ ] Commit (only with user's explicit approval): `fix: stable React keys for dynamic lists`

---

## Verification

Run in order after all tasks:

1. `npm test` → `pass 4`, `fail 0` (validation suite).
2. `npm run lint` → no new warnings in touched files.
3. `npm run build` → succeeds; `dist/_headers`, `dist/og-image.png`, `dist/app-bootstrap.js` all present; `grep -c "<script>" dist/index.html` → `0`.
4. `npx wrangler deploy --dry-run` → parses, shows all four bindings.
5. Post-deploy header checks:
   - `curl -sI https://brillaprep.org | grep -i strict-transport` → `max-age=63072000; includeSubDomains; preload`
   - `curl -sI https://brillaprep.org | grep -i content-security-policy` → present; `script-src 'self'` without `unsafe-inline`
   - `curl -sI https://brillaprep.org/og-image.png` → `200`, `image/png`
   - `curl -sI https://lynx-presentation.pages.dev | grep -iE "strict-transport|content-security"` → both present
6. Post-deploy smoke checklist (from Task 6): login, one AI call, one D1 read, avatar upload (real image accepted, fake image 400s).
7. Browser console on the deployed app: zero `Refused to load` / CSP violation messages across login (Turnstile), a KaTeX question, a PDF past paper, and the dashboard.

## Out of scope

- Phase 4 frontend work and Phase 0 dependency bumps (prerequisites, owned by earlier phases).
- Removing `'unsafe-inline'` from style-src (requires rewriting the inline `<style>` blocks / `style=` attributes in `index.html`; accepted tradeoff).
- Nonce-based CSP (not supported by static `_headers`; would require moving header emission into a Worker).
- HSTS preload-list submission to hstspreload.org (header meets the requirements; submission is a manual, user-owned step).
- Refactoring the `workers/api/index.ts` monolith, broader rate-limit/auth redesign, or any other audit findings assigned to Phases 0-5.
- Paystack CSP entries — unnecessary (full-page redirects only, verified).
