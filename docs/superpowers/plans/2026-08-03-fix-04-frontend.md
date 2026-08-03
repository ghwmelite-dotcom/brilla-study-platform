# Phase 4 — Frontend Hardening

**Goal:** Close the frontend security holes (XSS, client-side demo auth, token leakage in logs), consolidate the three divergent API clients into one, add an error boundary around the ~60 lazy routes, make all polling visibility-aware, and remove dead UI/code — so the frontend is safe to ship against the Phase 1 backend (which no longer accepts `x-user-id` headers or `demo_*` tokens).

**Depends on:**
- Phase 0 — vitest + `@testing-library` not required; tests in this phase are pure-function/store tests runnable under plain vitest. `react-router-dom` bumped to `^6.30.4` (current: `^6.28.0`).
- Phase 1 — backend rejects `x-user-id` / `x-user-role` headers and `demo_*` tokens. The frontend must stop sending/relying on both (see Tasks 2, 4, 6).

**Architecture (what survives this phase):**
- **ONE API client: `src/lib/api.ts`** (envelope `{success, data, error}`, never throws, token key `brilla_token`). Verified importer counts: `lib/api` 33 files, `services/api` 25 files, `utils/api` 7 files — `lib/api` is the most common shape and already owns auth + token management used by `authStore`. `src/services/api.ts` and `src/utils/api.ts` are deleted (Task 4).
- **Named service objects** (`examService`, `recordingsService`, `tutoringService`, etc.) move to a new thin wrapper module **`src/lib/services.ts`** preserving their old unwrap-and-throw semantics so their 10 consumer files only change an import path.
- **Polling helper: `src/utils/polling.ts`** (`createPoller`, visibility-aware) + **`src/hooks/usePolling.ts`** (React wrapper), applied to all six polling sites.
- **Error boundary: `src/components/common/ErrorBoundary.tsx`** + chunk-retry wrapper **`src/lib/lazyWithRetry.ts`**.
- **HTML escaping: `src/utils/html.ts`** (`escapeHtml`, `formatInline`) — see Task 1 for why DOMPurify was rejected.

**Tech stack:** Vite 5 + React 18 + TypeScript, zustand v5 (with `persist`), react-router-dom v6, Tailwind, vitest (from Phase 0). No new runtime dependencies are added in this phase.

## Global Constraints

- No `dangerouslySetInnerHTML` without escaping (sole allowed exceptions: KaTeX `renderToString` output, which KaTeX sanitizes).
- No `console.log` in shipped code (`console.error`/`console.warn` in genuine error paths are acceptable).
- Minimal diff; match existing Tailwind/zustand patterns.
- Every task ends with a verifiable command and expected output.
- Commits only with user's explicit approval.
- Do not reintroduce `x-user-id` / `x-user-role` headers or `demo_*` tokens anywhere — Phase 1 backend ignores/rejects them.
- This phase touches `src/**`, `index.html`, and (optionally, Task 10) one backend route in `workers/api/index.ts`. Nothing else.

---

## Task 1 — Fix XSS in AiMessage and MathText (SECURITY — do first)

**Files:**
- `src/components/ai/AiMessage.tsx` (`formatContent()` at :89-117; `dangerouslySetInnerHTML` at :101, :106, :112 — applies to BOTH user and AI messages via :207)
- `src/components/questions/MathText.tsx` (`Formula` fallback at :82 interpolates raw `formula` into an HTML string)
- NEW `src/utils/html.ts`
- NEW `src/utils/html.test.ts`
- NEW `src/components/ai/formatContent.test.ts` (or fold into `html.test.ts`)

**Decision (documented):** Manual escaping, NOT DOMPurify. The markdown subset is exactly two inline features (`**bold**`, `` `code` ``) plus list detection, so a 12-line `escapeHtml` before the regex passes is sufficient and adds zero bundle weight (DOMPurify is ~20 kB gzip and is not currently a dependency — verified absent from `package.json`).

**Interfaces (exported names other tasks rely on):**
- `escapeHtml(input: string): string` — from `src/utils/html.ts`
- `formatInline(line: string): string` — from `src/utils/html.ts` (escape → bold/code regex → HTML string, safe for injection)

**Steps:**

- [ ] Create `src/utils/html.ts`:

```ts
// HTML escaping + safe inline "markdown" for chat messages.
// Escape FIRST, then apply formatting regexes on the escaped text so
// user-supplied HTML can never reach dangerouslySetInnerHTML.

const ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (ch) => ESCAPE_MAP[ch]);
}

/**
 * Escape a line of message text, then apply the supported inline
 * formatting (**bold**, `code`). The returned string is safe to inject
 * because every character that could open a tag/attribute was escaped
 * before any tag we generate was introduced.
 */
export function formatInline(line: string): string {
  let formatted = escapeHtml(line);
  formatted = formatted.replace(
    /\*\*(.*?)\*\*/g,
    '<strong class="font-semibold">$1</strong>'
  );
  formatted = formatted.replace(
    /`(.*?)`/g,
    '<code class="bg-neutral-200/50 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>'
  );
  return formatted;
}
```

- [ ] In `src/components/ai/AiMessage.tsx`, replace the body of `formatContent` (:89-117) so it imports `formatInline` from `@/utils/html` and uses `let formatted = formatInline(line);` in place of the two inline regex passes. Keep the list/paragraph structure, keys, and class names identical. (The three `dangerouslySetInnerHTML` call sites stay — they now receive escaped HTML.)
- [ ] In `src/components/questions/MathText.tsx:82`, change the catch fallback to escape the formula:

```ts
} catch (error) {
  console.error('KaTeX error:', error);
  return `<span class="text-red-500">${escapeHtml(formula)}</span>`;
}
```

(import `escapeHtml` from `@/utils/html`.)

- [ ] Create `src/utils/html.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { escapeHtml, formatInline } from './html';

describe('escapeHtml', () => {
  it('escapes all HTML-significant characters', () => {
    expect(escapeHtml(`<img src=x onerror=alert(1)>`)).toBe(
      '&lt;img src=x onerror=alert(1)&gt;'
    );
    expect(escapeHtml(`"><script>alert(1)</script>`)).toBe(
      '&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;'
    );
    expect(escapeHtml(`a & b's "c"`)).toBe('a &amp; b&#39;s &quot;c&quot;');
  });
});

describe('formatInline', () => {
  it('renders bold and code', () => {
    expect(formatInline('**bold** and `code`')).toBe(
      '<strong class="font-semibold">bold</strong> and <code class="bg-neutral-200/50 px-1.5 py-0.5 rounded text-sm font-mono">code</code>'
    );
  });

  it('renders an img/onerror payload completely inert', () => {
    const out = formatInline('<img src=x onerror=alert(document.cookie)>');
    expect(out).not.toContain('<img');
    expect(out).toContain('&lt;img src=x onerror=alert(document.cookie)&gt;');
  });

  it('renders a script payload inert even inside **bold**', () => {
    const out = formatInline('**<script>alert(1)</script>**');
    expect(out).not.toContain('<script>');
    expect(out).toBe(
      '<strong class="font-semibold">&lt;script&gt;alert(1)&lt;/script&gt;</strong>'
    );
  });

  it('does not let a crafted payload break out of the code span', () => {
    const out = formatInline('`</code><img src=x onerror=alert(1)>`');
    expect(out).not.toContain('<img');
    expect(out).not.toContain('</code><');
  });
});
```

- [ ] Add a `Formula` fallback test (pure string check; KaTeX throws only with `throwOnError: true`, so test `escapeHtml` usage indirectly or export a tiny helper `formulaFallbackHtml(formula)` from `MathText.tsx` and assert it contains no raw `<`).

**Verification:**
```bash
npx vitest run src/utils/html.test.ts
```
Expected: all suites pass (6+ tests), including the `<img src=x onerror=...>` inertness tests.
```bash
grep -rn "dangerouslySetInnerHTML" src --include='*.tsx' | grep -v MathText | grep -v AiMessage
```
Expected: no output (no other injection sinks).

**Commit step:** `fix(security): escape HTML before markdown formatting in chat messages` (only with user's explicit approval).

---

## Task 2 — Harden the surviving client `src/lib/api.ts`

Do this before any migration: every later task builds on this client.

**Files:**
- `src/lib/api.ts` (full rewrite of the `request` internals; public method signatures unchanged)

**Interfaces (exact exported names other tasks rely on):**
- `api` (singleton `ApiClient`) — unchanged name; methods `get/post/put/patch/delete` still return `Promise<ApiResponse<T>>` and never throw.
- NEW `api.upload<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>>` — absorbs `utils/api.ts`'s `upload` (Task 4).
- NEW `api.uploadBlob<T>(endpoint: string, blob: Blob, contentType: string): Promise<ApiResponse<T>>` — absorbs the recording-upload raw `fetch` with the wrong `token` key (Task 3).
- NEW `getAuthHeaders(): Record<string, string>` — token-only replacement for `utils/api.ts`'s version (NO `x-user-id`/`x-user-role`).
- `getApiUrl(path?: string): string` — re-exported here so `utils/api.ts` consumers have a drop-in (move the implementation verbatim from `src/utils/api.ts:224-232`).

**Steps:**

- [ ] Rewrite `request<T>()` (currently :36-68) to:

```ts
private async request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (this.token) {
    headers['Authorization'] = `Bearer ${this.token}`;
  }

  try {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      handleUnauthorized();
      return { success: false, error: 'Your session has expired. Please sign in again.' };
    }

    // Guard: non-JSON or empty bodies must not crash the caller
    const text = await response.text();
    let data: ApiResponse<T>;
    try {
      data = text ? JSON.parse(text) : { success: false, error: 'Empty response from server' };
    } catch {
      data = { success: false, error: 'Invalid response from server' };
    }

    if (!response.ok && data.success !== false) {
      return { success: false, error: data.error || `Request failed (${response.status})` };
    }
    return data;
  } catch (error) {
    console.error('API request failed:', error);
    return { success: false, error: 'Network error. Please check your connection.' };
  }
}
```

- [ ] Add the module-level 401 handler (fixes finding 5; guards against redirect loops on the login page):

```ts
function handleUnauthorized() {
  localStorage.removeItem('brilla_token');
  localStorage.removeItem('brilla-auth');
  // Guard: don't redirect if already on an auth page (prevents loop)
  const path = window.location.pathname;
  if (path !== '/login' && path !== '/register' && !path.startsWith('/oauth')) {
    window.location.href = '/login';
  }
}
```

- [ ] Delete the three `console.log` calls at :51, :57, :59 (keep `console.error` in the catch).
- [ ] Add `upload` and `uploadBlob` methods (mirror the FormData/`PUT` logic from `src/utils/api.ts:162-217` and `src/services/api.ts:388-404`, but: token from `this.token`, no `x-user-id` headers, same text-then-parse JSON guard, same 401 handling, no logging).
- [ ] Add `getAuthHeaders()` and `getApiUrl()` exports (token-only; copy `getApiUrl` verbatim from `src/utils/api.ts`).
- [ ] Change `verifyToken` (:116-118) from GET-with-query to POST-with-body — **coordinate with Task 10 step for the backend route**; if the backend POST route is not added in this phase, leave the GET in place and mark the step deferred (current backend: `workers/api/index.ts:1477` registers only `GET /auth/verify-token`).

**Verification:**
```bash
npx tsc -b --noEmit 2>&1 | head -20
```
Expected: no new errors in `src/lib/api.ts`.
```bash
grep -n "console.log" src/lib/api.ts
```
Expected: no output.

**Commit step:** `refactor(api): harden lib/api client — 401 handling, JSON guard, no logging` (only with approval).

---

## Task 3 — Create `src/lib/services.ts` and migrate all 25 `services/api` consumers

**Files:**
- NEW `src/lib/services.ts` — all named service objects from `src/services/api.ts` (`authService`, `examService`, `questionsService`, `subjectsService`, `topicsService`, `progressService`, `leaderboardService`, `achievementsService`, `competitionService`, `recordingsService`, `whiteboardsService`, `tutoringService`, `teacherBonusService`) plus the exported types `RecordingData`, `RecordingUploadInfo`, `WhiteboardData`.
- `src/stores/usageStore.ts` (example migration below — also fixes the confirmed always-defaults bug)
- The 24 other consumers listed below.

**Interfaces (exact exported names):** every named export of `src/services/api.ts` is re-created with the SAME name and SAME call signature in `src/lib/services.ts`, so consumers change only their import path. Semantics preserved: unwrap `data.data ?? data`, throw `Error` with `.status` set on failure. Implement via one private helper:

```ts
// src/lib/services.ts
import { api, type ... } from './api';
import type { ApiResponse } from './api'; // export this type from lib/api if not already

export class ServiceError extends Error {
  status: number;
  constructor(message: string, status = 0) {
    super(message);
    this.name = 'ServiceError';
    this.status = status;
  }
}

/** Adapt the never-throws envelope client to the old throw/unwrap semantics. */
async function call<T>(p: Promise<ApiResponse<T>>): Promise<T> {
  const res = await p;
  if (!res.success) throw new ServiceError(res.error || 'Request failed');
  return res.data as T;
}
```

Each service method becomes e.g. `getExamTypes: () => call(api.get<ExamType[]>('/exam-types'))`.

**Steps:**

- [ ] Create `src/lib/services.ts` with the `call` adapter + all 13 service objects + 3 type exports. `recordingsService.uploadFile` becomes `api.uploadBlob(`/recordings/upload/${recordingId}/${fileType}`, file, contentType)` — this fixes finding 3 (the old code at `src/services/api.ts:393` read `localStorage.getItem('token')`; the real key is `brilla_token`, so every recording upload sent an empty Bearer and got a 401).
- [ ] Migrate `usageStore.ts` (this fixes the confirmed bug — it currently imports the unwrap-style `api` but tests `response.success`, so the usage meter always shows defaults):

```diff
-import { api } from '@/services/api';
+import { api } from '@/lib/api';
...
-          const response = await api.get('/usage/daily') as {
-            success: boolean;
-            data: DailyUsage;
-          };
+          const response = await api.get<DailyUsage>('/usage/daily');
```

(The surrounding `if (response && response.success && response.data)` logic then works unchanged.)

- [ ] Migrate the 14 remaining generic-`api` consumers. For each: switch the import to `@/lib/api` and adapt call sites from unwrapped/throwing to envelope checks (`const res = await api.get<T>(...); if (res.success && res.data) { ... }`):
  - `src/hooks/useQuestions.ts:3`
  - `src/stores/tutoringStore.ts:2`
  - `src/pages/Analytics.tsx:12`
  - `src/pages/Competition.tsx:22`
  - `src/pages/ContentManagement.tsx:22`
  - `src/pages/ExamModePractice.tsx:6`
  - `src/pages/EssayPractice.tsx:19`
  - `src/pages/MockExams.tsx:22`
  - `src/pages/PaperResults.tsx:16`
  - `src/pages/PastPapers.tsx:16`
  - `src/pages/Practice.tsx:24`
  - `src/pages/RecordingViewer.tsx:16`
  - `src/pages/TakePaper.tsx:25`
  - `src/pages/Topics.tsx:18`
- [ ] Migrate the 10 named-service consumers — import-path-only change (`@/services/api` → `@/lib/services`):
  - `src/components/admin/EditUserModal.tsx:26` (`examService`)
  - `src/stores/examPreferencesStore.ts:3` (`examService`)
  - `src/components/tutoring/ReviewForm.tsx:3` (`tutoringService`)
  - `src/pages/admin/AdminTutoringDirectory.tsx:18` (`tutoringService`)
  - `src/pages/admin/AdminTeacherBonuses.tsx:16` (`teacherBonusService`)
  - `src/pages/TeacherBonusStatus.tsx:17` (`teacherBonusService`)
  - `src/pages/TutoringSessions.tsx:18` (`tutoringService`)
  - `src/stores/whiteboardStore.ts:10` (`whiteboardsService`, type `WhiteboardData`)
  - `src/pages/WhiteboardEditor.tsx:22` (`recordingsService`)
  - `src/pages/WhiteboardList.tsx:20` (`recordingsService`, type `RecordingData`)

**Verification:**
```bash
grep -rn "services/api" src --include='*.ts' --include='*.tsx'
```
Expected: no output.
```bash
npm run build
```
Expected: builds green (tsc + vite).

**Commit step:** `refactor(api): consolidate services/api consumers onto lib/api + lib/services` (only with approval).

---

## Task 4 — Migrate `utils/api` consumers, delete the two dead clients

**Files:**
- `src/stores/aiTutorStore.ts:3`, `src/stores/chatStore.ts:10`, `src/stores/moderationStore.ts:9` — use `getApiUrl` + `getAuthHeaders` for raw `fetch`; switch imports to `@/lib/api` (new exports from Task 2). Verify each raw fetch: drop any `x-user-id`/`x-user-role` headers (Phase 1 rejects them); keep Bearer only.
- `src/stores/counselorStore.ts:3`, `src/stores/counselorReportsStore.ts:3`, `src/stores/libraryStore.ts:3`, `src/stores/reminderStore.ts:4` — use the envelope-throwing `api`/`ApiError`; switch to `@/lib/api` envelope style (`.success` checks) or to a `@/lib/services` wrapper if one exists for their endpoints.
- DELETE `src/utils/api.ts`, `src/services/api.ts`, and `src/services/index.ts` (barrel re-exporting the deleted client; verified zero importers).

**Steps:**

- [ ] Migrate the 7 files above; grep afterward for leftovers.
- [ ] Confirm the token/response logging in `utils/api.ts` (:166-181, incl. the Bearer-token-bearing headers dump at :181) is gone with the file.
- [ ] Delete the three files.
- [ ] `getAuthHeaders` / `getApiUrl` / `ApiError` / `ApiResponse` must have no remaining references to `@/utils/api` or `../utils/api`.

**Verification:**
```bash
grep -rn "utils/api\|services/api" src --include='*.ts' --include='*.tsx'
```
Expected: no output.
```bash
grep -rn "x-user-id\|x-user-role" src --include='*.ts' --include='*.tsx'
```
Expected: no output.
```bash
npm run build
```
Expected: green.

**Commit step:** `refactor(api): delete services/api and utils/api; single client in lib/api` (only with approval).

---

## Task 5 — Error boundary + chunk-load recovery

**Files:**
- NEW `src/components/common/ErrorBoundary.tsx`
- NEW `src/lib/lazyWithRetry.ts`
- `src/components/common/index.ts` (barrel — check it exists and export `ErrorBoundary`; `PageLoader` is already exported from `@/components/common` per `src/App.tsx:7`)
- `src/App.tsx` (wrap routes; convert `lazy()` calls)

**Interfaces:**
- `ErrorBoundary` — class component, default + named export from `src/components/common/ErrorBoundary.tsx`.
- `lazyWithRetry<T extends ComponentType<unknown>>(factory: () => Promise<{ default: T }>): LazyExoticComponent<T>` — from `src/lib/lazyWithRetry.ts`.

**Steps:**

- [ ] Create `src/components/common/ErrorBoundary.tsx` (full code):

```tsx
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Uncaught render error:', error, info.componentStack);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <main className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
          <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-card text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-ghana flex items-center justify-center">
              <span className="text-white font-bold text-2xl">B</span>
            </div>
            <h1 className="text-2xl font-display font-bold text-neutral-900 mb-2">
              Something went wrong
            </h1>
            <p className="text-neutral-500 mb-6">
              An unexpected error occurred. Your progress is saved — try reloading the page.
            </p>
            <div className="space-y-3">
              <button
                onClick={this.handleReload}
                className="w-full py-3 px-4 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark active:scale-[0.98] transition-all shadow-md"
              >
                Reload page
              </button>
              <button
                onClick={this.handleGoHome}
                className="w-full py-3 px-4 bg-neutral-100 text-neutral-700 rounded-lg font-medium hover:bg-neutral-200 transition-all"
              >
                Go to home
              </button>
            </div>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

(Classes `bg-gradient-ghana`, `shadow-card`, `font-display`, `bg-primary` match the existing login page in `src/App.tsx:170-214`.)

- [ ] Create `src/lib/lazyWithRetry.ts`:

```ts
import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

const RELOAD_FLAG = 'brilla_chunk_reload_attempted';

/**
 * Wraps React.lazy: retries the dynamic import once, and if the chunk
 * still fails (stale deploy), force one full reload to pick up new
 * assets — guarded by sessionStorage so we never reload-loop.
 */
export function lazyWithRetry<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      return await factory();
    } catch (firstError) {
      try {
        return await factory();
      } catch {
        const alreadyReloaded = sessionStorage.getItem(RELOAD_FLAG);
        if (!alreadyReloaded) {
          sessionStorage.setItem(RELOAD_FLAG, '1');
          window.location.reload();
          // Never resolves; page is reloading anyway
          return new Promise<{ default: T }>(() => {});
        }
        sessionStorage.removeItem(RELOAD_FLAG);
        throw firstError;
      }
    }
  });
}
```

- [ ] In `src/App.tsx`: import `ErrorBoundary`; wrap the `<Routes>` block (:405-…, inside `<BrowserRouter>`) with `<ErrorBoundary>`. Replace `lazy(` with `lazyWithRetry(` for the lazy page declarations (mechanical, ~50 sites; keep `LazyPage`/Suspense unchanged — `lazyWithRetry` returns a normal lazy component).

**Verification:**
```bash
npm run build
```
Expected: green; no type errors on `lazyWithRetry` conversions.
Manual smoke: `npm run dev`, open a lazy route (e.g. `/topics`), then in DevTools throttle "Offline" + click another lazy route → single reload attempt, then the ErrorBoundary fallback renders instead of a white screen.

**Commit step:** `feat(app): add ErrorBoundary around routes and chunk-load retry for lazy pages` (only with approval).

---

## Task 6 — Remove client-side demo auth (SECURITY)

**Files:**
- `src/stores/authStore.ts`
- `src/App.tsx` (login page demo buttons)

**Steps:**

- [ ] Delete from `authStore.ts`: `hashPassword` (:194-197), `getDefaultUsers` (:246-324 — includes `admin@brillaprep.org`/`Admin123!`), `loadAllUsersFromStorage`/`saveAllUsersToStorage` (:210-242), `PENDING_USERS_KEY`/`ALL_USERS_KEY`/`DEMO_USERS_VERSION_KEY` constants (:188-191), and `loadPendingUsersFromStorage` (:200-207).
- [ ] Delete the demo-mode login fallback in `login` (:394-425 — issues fake `demo_${Date.now()}_${btoa(email)}` tokens). On network error, surface "Network error. Please check your connection." instead of falling back.
- [ ] Delete the localStorage fallbacks in `loadPendingUsers` (:522-533) and `loadAllUsers` (:586-591, :621-626); on API failure set empty arrays + `error` state instead.
- [ ] Delete dead store methods `verifyToken` (:812-829) and `setPassword` (:831-867) — verified unused: `SetPasswordPage.tsx:57,91` calls `api.verifyToken`/`api.setPassword` from `@/lib/api`, not the store. Also delete their declarations in the `AuthState` interface.
- [ ] Delete the stray `console.log` at :218 and :395 and the `console.log('✅ Password set…')` at :866.
- [ ] In `src/App.tsx`, gate the entire demo-login section behind `import.meta.env.DEV`: wrap `handleDemoLogin`'s usage — the "or use demo accounts" divider (:195-202), the buttons block (:204-252), and the "Demo Mode" info box (:254-260) — in `{import.meta.env.DEV && (…)}`. Vite statically replaces `import.meta.env.DEV`, so the buttons (and their hardcoded credentials at :141-146) are tree-shaken out of production builds while remaining for local dev.

**Verification:**
```bash
grep -n "demo_\|hashPassword\|getDefaultUsers\|brilla-all-users\|Admin123" src/stores/authStore.ts
```
Expected: no output.
```bash
npm run build && grep -c "Sign In as Admin" dist/assets/*.js
```
Expected: build green; `0` matches in the production bundle (grep exits 1 with "0" counts per file — confirm no file contains the string).
```bash
grep -rn "verifyToken\|setPassword" src/stores/authStore.ts
```
Expected: no output.

**Commit step:** `fix(security): remove client-side demo auth and gate demo login buttons to dev builds` (only with approval).

---

## Task 7 — Visibility-aware polling helper + apply to all six sites

**Files:**
- NEW `src/utils/polling.ts`
- NEW `src/utils/polling.test.ts`
- NEW `src/hooks/usePolling.ts`
- `src/stores/studyRoomStore.ts` (:366-382, 2 s, no double-start guard)
- `src/stores/chatStore.ts` (:822-839, 3 s — already has a guard; keep semantics)
- `src/stores/battleStore.ts` (:256-269, 2 s)
- `src/stores/tutorClassroomStore.ts` (:722-749, `POLLING_INTERVAL = 3000` at :290)
- `src/components/battle/BattleLobby.tsx` (:29-33, 5 s)
- `src/components/admin/layout/AdminHeader.tsx` (:28-32, 30 s)

**Interfaces:**
- `createPoller(callback: () => void | Promise<void>, intervalMs: number): { start: () => void; stop: () => void; isRunning: () => boolean }` — from `src/utils/polling.ts`. `start()` is idempotent (dedupes double-start); polling pauses while `document.hidden` and resumes (with an immediate tick) on `visibilitychange` back to visible; `stop()` removes the listener.
- `usePolling(callback, intervalMs, active?: boolean): void` — React hook wrapper for component sites.

**Steps:**

- [ ] Create `src/utils/polling.ts`:

```ts
export interface Poller {
  start: () => void;
  stop: () => void;
  isRunning: () => boolean;
}

/**
 * Visibility-aware interval poller.
 * - start() is idempotent: calling it twice never creates two intervals.
 * - Pauses while document.hidden (saves battery/CPU on low-end devices).
 * - On return to visible, fires one immediate tick then resumes the interval.
 */
export function createPoller(
  callback: () => void | Promise<void>,
  intervalMs: number
): Poller {
  let intervalId: ReturnType<typeof setInterval> | null = null;

  const tick = () => {
    // Fire-and-forget; callbacks handle their own errors
    void callback();
  };

  const arm = () => {
    if (intervalId === null) {
      intervalId = setInterval(tick, intervalMs);
    }
  };

  const disarm = () => {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  const onVisibilityChange = () => {
    if (intervalId === null && !started) return;
    if (document.hidden) {
      disarm();
    } else {
      tick(); // catch up immediately
      arm();
    }
  };

  let started = false;

  return {
    start() {
      if (started) return; // dedupe double-start
      started = true;
      document.addEventListener('visibilitychange', onVisibilityChange);
      if (!document.hidden) arm();
    },
    stop() {
      started = false;
      disarm();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    },
    isRunning() {
      return started;
    },
  };
}
```

- [ ] Create `src/hooks/usePolling.ts`:

```ts
import { useEffect, useRef } from 'react';
import { createPoller } from '../utils/polling';

/**
 * usePolling(callback, intervalMs, active)
 * Runs `callback` every `intervalMs` while `active` and the tab is visible.
 */
export function usePolling(
  callback: () => void | Promise<void>,
  intervalMs: number,
  active = true
): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!active) return;
    const poller = createPoller(() => callbackRef.current(), intervalMs);
    poller.start();
    return () => poller.stop();
  }, [intervalMs, active]);
}
```

- [ ] Create `src/utils/polling.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createPoller } from './polling';

function setHidden(hidden: boolean) {
  Object.defineProperty(document, 'hidden', { value: hidden, configurable: true });
  document.dispatchEvent(new Event('visibilitychange'));
}

describe('createPoller', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setHidden(false);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('ticks on the interval', () => {
    const cb = vi.fn();
    const p = createPoller(cb, 1000);
    p.start();
    vi.advanceTimersByTime(3000);
    expect(cb).toHaveBeenCalledTimes(3);
    p.stop();
  });

  it('start() is idempotent (no double interval)', () => {
    const cb = vi.fn();
    const p = createPoller(cb, 1000);
    p.start();
    p.start();
    p.start();
    vi.advanceTimersByTime(1000);
    expect(cb).toHaveBeenCalledTimes(1);
    p.stop();
  });

  it('pauses while hidden and resumes with an immediate tick', () => {
    const cb = vi.fn();
    const p = createPoller(cb, 1000);
    p.start();
    vi.advanceTimersByTime(1000);
    expect(cb).toHaveBeenCalledTimes(1);

    setHidden(true);
    vi.advanceTimersByTime(5000);
    expect(cb).toHaveBeenCalledTimes(1); // paused

    setHidden(false);
    expect(cb).toHaveBeenCalledTimes(2); // immediate catch-up tick
    vi.advanceTimersByTime(2000);
    expect(cb).toHaveBeenCalledTimes(4);
    p.stop();
  });

  it('stop() prevents further ticks and removes the listener', () => {
    const cb = vi.fn();
    const p = createPoller(cb, 1000);
    p.start();
    p.stop();
    vi.advanceTimersByTime(5000);
    expect(cb).not.toHaveBeenCalled();
    expect(p.isRunning()).toBe(false);
  });
});
```

- [ ] Apply to the four zustand stores: replace each `startPolling` body's `setInterval(...)` with a module-level (or state-held) poller. Pattern per store (keeps the existing `pollingInterval` state shape if other code reads it — check `stopPolling` callers; otherwise store the `Poller` in a module-level `let`):

```ts
// studyRoomStore.ts
import { createPoller, type Poller } from '@/utils/polling';
let poller: Poller | null = null;
...
      startPolling: () => {
        if (!poller) {
          poller = createPoller(() => get().pollForUpdates(), 2000);
        }
        poller.start(); // idempotent
      },
      stopPolling: () => {
        poller?.stop();
      },
```

- [ ] Apply to the two component sites via `usePolling`:
  - `BattleLobby.tsx:29-33` → `usePolling(fetchAvailableBattles, 5000);` (replacing the `useEffect`/`setInterval`).
  - `AdminHeader.tsx:28-32` → keep the initial `fetchUnreadCount()` effect, replace the interval with `usePolling(fetchUnreadCount, 30000);`.

**Verification:**
```bash
npx vitest run src/utils/polling.test.ts
```
Expected: 4 tests pass.
```bash
grep -rn "setInterval" src/stores/studyRoomStore.ts src/stores/chatStore.ts src/stores/battleStore.ts src/stores/tutorClassroomStore.ts src/components/battle/BattleLobby.tsx src/components/admin/layout/AdminHeader.tsx
```
Expected: no output.

**Commit step:** `perf(polling): visibility-aware shared poller applied to all polling sites` (only with approval).

---

## Task 8 — Guard one-time-code exchanges against StrictMode double-fire

**Files:**
- `src/pages/OAuthCallback.tsx` (:22-85 — the `useEffect` can fire twice under `<StrictMode>` in `src/main.tsx:18-22`, exchanging the one-time `code` twice)
- `src/pages/PaymentCallback.tsx` (:18-46 — same for the payment `reference`)

**Steps:**

- [ ] `OAuthCallback.tsx`: add `const hasExchanged = useRef(false);` and at the top of the effect:

```ts
useEffect(() => {
  if (hasExchanged.current) return;
  hasExchanged.current = true;
  ...
```

(add `useRef` to the React import.)

- [ ] `PaymentCallback.tsx`: same guard before the `verify()` call.

**Verification:**
```bash
npm run build
```
Expected: green. Manual: `npm run dev`, load `/payment/callback?reference=test123` with React DevTools — network tab shows exactly ONE `pay/verify` request.

**Commit step:** `fix(auth,payments): guard one-time code exchange against StrictMode double effects` (only with approval).

---

## Task 9 — Stop showing fake data as real

**Files:**
- `src/pages/Topics.tsx` (:198 and :204 hardcode `mastery: 0` with `// TODO`; :486 hardcodes `avgMastery = 0` — students see 0% mastery everywhere)
- `src/pages/ParentReports.tsx` (:96-99 dead PDF `onDownload`, :334-337 dead alert `onViewDetails`)

**Decision (documented):** WIRE, don't hide. The backend already exposes real mastery: `GET /progress` (`workers/api/index.ts:3329-3363`) returns `data.topicProgress` rows from the `user_progress` table, which has `mastery_level INTEGER 0-100` (`database/schema.sql:365`). ⚠️ Dependency note: that route currently derives the user from `?userId=` with a `'user_demo'` fallback (:3330) — if Phase 1 did not change it to derive from the Bearer token, open a Phase 1 follow-up; the frontend wiring below is correct regardless.

**Steps:**

- [ ] In `Topics.tsx`, fetch `progressService.getProgress()` (now from `@/lib/services`, Task 3) alongside topics; build `Map<topic_id, mastery_level>` from `topicProgress`; set `mastery` per topic/subtopic from the map (default `0` only when the user has genuinely no attempts); compute `avgMastery` as the mean of that subject's topic masteries.
- [ ] `ParentReports.tsx`: remove the dead PDF `onDownload` handler — either hide the download button in `ReportDetail` (minimal: don't pass `onDownload`) or pass nothing and delete the `console.log`. Remove the dead `onViewDetails` alert handler the same way (don't pass the prop; delete the TODO + `console.log`).

**Verification:**
```bash
grep -n "TODO\|console.log" src/pages/Topics.tsx src/pages/ParentReports.tsx
```
Expected: no output.
```bash
npm run build
```
Expected: green. Manual: log in as a student with attempts, open `/topics` — non-zero mastery percentages render.

**Commit step:** `fix(topics,parent): wire real mastery data; remove dead PDF/alert buttons` (only with approval).

---

## Task 10 — Misc lows

**Files:**
- `index.html` (:379-406 SW script, :131 `<main id="main-content">`)
- `src/components/layout/Layout.tsx` (:59-63)
- `src/App.tsx` (:265)
- 16 files with `console.log` (45 total — exact list below)
- `workers/api/index.ts` (:1477 — coordination step only)

**Steps:**

- [ ] Replace the blocking `confirm()` SW update flow (`index.html:387-399`) with a non-blocking banner injected by the inline script (no framework needed):

```html
<script>
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (!newWorker) return;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                const banner = document.createElement('div');
                banner.setAttribute('role', 'status');
                banner.style.cssText =
                  'position:fixed;bottom:16px;left:50%;transform:translateX(-50%);' +
                  'background:#002B19;color:#fff;padding:12px 20px;border-radius:8px;' +
                  'font:500 14px Inter,system-ui,sans-serif;z-index:10001;' +
                  'box-shadow:0 4px 12px rgba(0,0,0,0.3);display:flex;gap:12px;align-items:center;';
                banner.innerHTML =
                  '<span>A new version is available.</span>' +
                  '<button id="sw-update-btn" style="background:#FCD116;color:#002B19;border:0;' +
                  'border-radius:6px;padding:6px 14px;font-weight:600;cursor:pointer;">Reload</button>';
                document.body.appendChild(banner);
                document.getElementById('sw-update-btn').addEventListener('click', () => {
                  window.location.reload();
                });
              }
            });
          });
        })
        .catch(() => { /* SW registration failed — app still works */ });
    });
  }
</script>
```

- [ ] Remove the `console.log` at `index.html:384` and `:402` (done by the replacement above).
- [ ] Fix the duplicate `id="main-content"`: the skip link (`index.html:102-110`) targets `#main-content`, but BOTH `index.html:131` and `Layout.tsx:59-63` render one. Remove the `<main id="main-content">` wrapper from `index.html` (keep `<div id="root">`), keeping the single landmark in `Layout.tsx`. Verify pages that render WITHOUT `Layout` (login/register/legal/exam routes) still have a `<main>` — `App.tsx` `LoginPage` already uses `<main>` (:170); spot-check `RegisterPage` and the legal pages.
- [ ] `src/App.tsx:265`: replace `<a href="/register">` with `<Link to="/register">` (add `Link` to the `react-router-dom` import).
- [ ] Sweep the 45 `console.log` calls across these 16 files (verified counts): `src/components/common/Turnstile.tsx` (7), `src/pages/WhiteboardEditor.tsx` (7), `src/stores/examBoardStore.ts` (4), `src/lib/api.ts` (3 — done in Task 2), `src/utils/api.ts` (3 — deleted in Task 4), `src/stores/authStore.ts` (3 — done in Task 6), `src/pages/Practice.tsx` (3), `src/stores/libraryStore.ts` (2), `src/pages/ExamModePractice.tsx` (2), `src/pages/ParentReports.tsx` (2 — done in Task 9), `src/pages/RevisionClassroom.tsx` (2), `src/components/immersive/ImmersiveClassroom.tsx` (2), `src/components/immersive/AmbientSounds.tsx` (2), `src/pages/Affiliate.tsx` (1), `src/stores/quickPlayStore.ts` (1), `src/stores/quizStore.ts` (1). Delete genuinely-debug logs; downgrade the rest to `console.error` only where they sit in a real error path.
- [ ] Reset-token method (coordination): backend currently exposes ONLY `GET /auth/verify-token` (`workers/api/index.ts:1477`). If adding `POST /auth/verify-token` (body `{ token }`) to the worker is approved as part of this phase, flip `lib/api.ts` `verifyToken` to POST (Task 2 step). Otherwise mark deferred — do NOT leave a broken call.

**Verification:**
```bash
grep -rn "console.log" src index.html
```
Expected: no output.
```bash
grep -c 'id="main-content"' index.html; grep -n 'id="main-content"' src/components/layout/Layout.tsx
```
Expected: `0` for index.html; one match in Layout.tsx.
```bash
npm run build
```
Expected: green.

**Commit step:** `chore: non-blocking SW update banner, console.log sweep, a11y landmark fix` (only with approval).

---

## Task 11 — Delete verified-orphan dead code

**Files (all re-verified zero-importer on 2026-08-03):**
- `src/pages/index.ts`, `src/services/index.ts` (already deleted in Task 4), `src/lib/index.ts`
- `src/components/achievements/index.ts`, `src/components/cosmetics/index.ts`, `src/components/parent/index.ts`, `src/components/reminders/index.ts`, `src/components/streak/index.ts`, `src/components/tutoring/index.ts`, `src/components/ui/index.ts`, `src/components/xp/index.ts`
- `src/components/streak/StreakPanel.tsx` (only self-reference; the barrel exports `StreakTypesPanel`/`StreakRescueModal`, not it)
- `src/types/competition.ts` (`src/types/index.ts:628` defines its own `Competition`; nothing imports `./competition`)

⚠️ Do NOT delete `src/utils/index.ts` — it is live (`MathText.tsx:3` imports `hasLatex`/`extractLatex` from `@/utils`).

**Steps:**

- [ ] Re-run the import-graph verification BEFORE deleting (the audit's method):

```bash
for f in pages services lib; do
  echo "=== $f/index ==="
  grep -rn "from '@/$f'" src --include='*.ts' --include='*.tsx'
done
for d in achievements cosmetics parent reminders streak tutoring ui xp; do
  echo "=== components/$d barrel ==="
  grep -rln "components/$d'" src --include='*.ts' --include='*.tsx' | grep -v "components/$d/"
done
grep -rln "StreakPanel" src --include='*.ts' --include='*.tsx' | grep -v "streak/StreakPanel.tsx"
grep -rn "types/competition\|from './competition'" src --include='*.ts' --include='*.tsx'
```

Expected: all sections empty (`src/services/index.ts` check is moot after Task 4).

- [ ] Delete the files, then build.

**Verification:**
```bash
npm run build && npm run lint
```
Expected: green; no unresolved-import errors.

**Commit step:** `chore: delete orphaned barrel files and dead components` (only with approval).

---

## Verification (phase-level gate)

```bash
npm run build      # tsc -b && vite build — green
npx vitest run     # html.test.ts + polling.test.ts (+ any Phase 0 tests) — all pass
npm run lint       # green
grep -rn "console.log\|x-user-id\|demo_" src index.html   # no output
grep -rn "services/api\|utils/api" src                    # no output
```

Expected: all five commands clean. Final manual smoke (`npm run dev`): login with a real account, open `/topics`, `/practice`, a battle lobby, and a recording upload — no 401 storms, no fake data, uploads succeed.

## Out of scope

- Backend changes beyond the optional `POST /auth/verify-token` coordination step (Task 10) — everything else backend is Phase 1's.
- The `/progress` route's `userId` query-param/`'user_demo'` fallback (`workers/api/index.ts:3330`) — flagged as a Phase 1 follow-up, not fixed here.
- Replacing polling with WebSockets/SSE (architectural change; this phase only makes polling polite).
- Refactoring the 33 existing `lib/api` consumers' call sites (they already use the surviving shape).
- `react-router-dom` v7 upgrade (Phase 0 only bumps to `^6.30.4`).
- Visual redesign of the login page, error fallback, or SW banner beyond the minimal Tailwind-matching styles specified.
- Remaining `setInterval` uses that are NOT polling (exam timers, countdowns, cursor blink, recording timers — verified at `useTimer.ts`, `Timer.tsx`, `ExamLayout.tsx`, etc.); they tick UI state, not the network.
