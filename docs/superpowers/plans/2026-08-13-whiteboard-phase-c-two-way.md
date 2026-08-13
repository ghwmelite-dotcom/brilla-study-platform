# AI Whiteboard Phase C — "The Teacher That Sees Your Work" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the whiteboard two-way — students draw on it (or photograph paper work) and the AI sees, marks, and spatially annotates their work via a vision model.

**Architecture:** A separate student-ink fabric layer sits over the lesson canvas. On "Check my work" / "ask about this", the frontend composites lesson + ink layers into a PNG snapshot and posts it to premium-gated worker endpoints that call `@cf/meta/llama-4-scout-17b-16e-instruct` (vision). The model returns verdict + explanation + annotation drawing commands, which flow through the existing Phase B validation/render pipeline.

**Tech Stack:** Cloudflare Workers (Hono) + Workers AI (vision), React + fabric.js, Vitest + mockD1.

**Spec:** `docs/superpowers/specs/2026-08-13-whiteboard-phase-c-two-way-design.md`

## Global Constraints

- Both new endpoints are **premium-only** via `isPremiumUser` (same pattern as whiteboard-teach; 403 `upgradeRequired:true`). No allowance consumption anywhere in Phase C.
- Model id from env: `AI_MODEL_VISION` default `@cf/meta/llama-4-scout-17b-16e-instruct`, resolved via a new `getVisionModel(env)` in `workers/api/ai-models.ts` (fallback chain: var → built-in default; NOT AI_MODEL — vision is a distinct capability).
- Vision responses are unwrapped with `unwrapAiText` (the parsed-JSON bug class is known — never string-cast a response directly) and validated before use.
- Annotation commands: whitelist `circle`, `arrow`, `text`, `rect` only (no `primitive`/`math`/`path`/`polygon` for v1); all numeric props finite and clamped to 1200x800 canvas bounds; ids server-prefixed.
- Image guards: check-work accepts ≤700KB base64 (≈500KB binary, frontend downscales to ≤1024px) → 413 above; ask-about ≤700KB; photo path frontend-downscales to ≤1600px JPEG q0.8 before hitting the same 413 guard.
- No schema changes. Correct-verdict caching reuses `revision_ai_interactions` (interaction_type `checkwork_correct`, `user_response` column stores the image hash; lookup keyed `lesson_id` + type + hash).
- The Phase B lesson renderer, animation, overlay, TTS, and retry machinery must keep working untouched; the ink layer is additive (separate canvas element + store slice).
- Commit after every task. Do not push. `cd C:/dev/Projects/brilla-study-platform` for all commands.

---

### Task 1: Vision spike — model, input shape, handwriting quality gate

**Files:**
- Modify: `workers/api/ai-models.ts` (add `getVisionModel`)
- Modify: `workers/api/index.ts` (new `POST /api/admin/vision-spike`, near tts-spike ~line 6110)
- Modify: `wrangler.toml` (`AI_MODEL_VISION` in both var blocks)
- Create: `scripts/spike-vision.cjs`
- Test: `workers/api/__tests__/ai-models.test.ts` (extend)

**Interfaces:**
- Produces:
  - `getVisionModel(env): string` — `env.AI_MODEL_VISION || '@cf/meta/llama-4-scout-17b-16e-instruct'`.
  - `POST /api/admin/vision-spike` — body `{ imageBase64: string (≤700KB), prompt: string (≤2000 chars), model?: string }`; runs the vision call and returns `{ success, data: { model, ok, latencyMs, rawShape: string, output: string, error? } }` where `rawShape` describes the response's runtime shape (e.g. "string", "object-with-response-string", "object-with-response-object") so the unwrap behavior is observed, and `output` is the `unwrapAiText`-unwrapped text.
  - Spike report documenting: exact image-input request shape that works on our account, whether `guided_json` is honored, latency, and transcription quality on the fixtures — plus the keep-Scout-or-fallback verdict.

- [ ] **Step 1: Extend the ai-models test (failing)** — `getVisionModel` var/default/no-AI_MODEL-fallback cases, mirroring the existing getters' tests.

- [ ] **Step 2: Implement `getVisionModel`** in `workers/api/ai-models.ts`:

```ts
const DEFAULT_VISION_MODEL = '@cf/meta/llama-4-scout-17b-16e-instruct';

interface ModelEnv { /* add */ AI_MODEL_VISION?: string; }

export function getVisionModel(env: ModelEnv): string {
  return env.AI_MODEL_VISION || DEFAULT_VISION_MODEL;
}
```

Add `AI_MODEL_VISION = "@cf/meta/llama-4-scout-17b-16e-instruct"` to both wrangler.toml var blocks.

- [ ] **Step 3: Spike endpoint.** In `workers/api/index.ts` (adminApp, near `/admin/tts-spike`):

```ts
// Vision model spike (admin eval tool — verifies image input shape + quality)
adminApp.post('/vision-spike', async (c) => {
  const { imageBase64, prompt, model } = await c.req.json();

  if (!imageBase64 || typeof imageBase64 !== 'string' || imageBase64.length > 700_000) {
    return c.json({ success: false, error: 'imageBase64 is required (max ~500KB binary)' }, 400);
  }
  if (!prompt || typeof prompt !== 'string' || prompt.length > 2000) {
    return c.json({ success: false, error: 'prompt is required (max 2000 chars)' }, 400);
  }

  const chosenModel = typeof model === 'string' && model.startsWith('@cf/')
    ? model
    : getVisionModel(c.env);
  const started = Date.now();

  try {
    const bytes = Uint8Array.from(atob(imageBase64.replace(/^data:[^,]+,/, '')), (ch) => ch.charCodeAt(0));
    const result = await c.env.AI.run(chosenModel as any, {
      messages: [
        { role: 'user', content: prompt, image: [...bytes] },
      ],
      max_tokens: 1024,
    });
    const rawShape = result === null ? 'null'
      : typeof result === 'string' ? 'string'
      : 'response' in (result as object)
        ? `object-with-response-${typeof (result as any).response}`
        : `object-keys:${Object.keys(result as object).join('|')}`;
    return c.json({
      success: true,
      data: { model: chosenModel, ok: true, latencyMs: Date.now() - started, rawShape, output: unwrapAiText(result) },
    });
  } catch (error) {
    return c.json({
      success: true,
      data: { model: chosenModel, ok: false, latencyMs: Date.now() - started, rawShape: 'error', output: '', error: error instanceof Error ? error.message : String(error) },
    });
  }
});
```

NOTE for the implementer: the `image: [...bytes]` message-field shape above is the leading candidate from Workers AI vision conventions (llama-3.2-11b-vision style). The spike's first job is to CONFIRM or correct it — if it errors, try in order: (a) `image` as base64 string, (b) content-parts form `[{ type:'text', text }, { type:'image', image: [...bytes] }]`. Record which shape works; that shape becomes the contract used by Tasks 3-4. Import `unwrapAiText` and `getVisionModel` from './ai-models'.

- [ ] **Step 4: Spike probe.** `scripts/spike-vision.cjs` (login pattern from `scripts/probe-answer-cache.cjs`, admintest account): build two fixtures client-side in the headless browser — (a) a canvas-rendered "worked solution" image (draw text `x + 2 = 5` then `x = 3` with a deliberate mistake on a third line `x = 4`, plus a stray squiggle), (b) a busy classroom-ish photo is NOT fabricable — use fixture (a) plus a rotated/low-contrast variant of it. For each fixture ask the model to transcribe the work and identify the wrong line. Run for both `@cf/meta/llama-4-scout-17b-16e-instruct` and `@cf/meta/llama-3.2-11b-vision-instruct`. Run in FOREGROUND (300s budget).

- [ ] **Step 5: Verdict + report.** Write `docs/superpowers/specs/2026-08-13-vision-spike-results.md`: winning input shape, per-model transcription accuracy on the fixtures (did it catch that line 3 is wrong?), latency, guided_json behavior (try one call with `guided_json` set to the annotation schema; record whether output conforms). Verdict: **Scout** or **fallback 3.2-11b-vision** — if fallback wins, set `AI_MODEL_VISION` accordingly in both wrangler blocks. Deploy the worker (`npx wrangler deploy`) so the spike endpoint is live for the probe (deploy before Step 4).

- [ ] **Step 6: Commit**

```bash
git add workers/api/ai-models.ts workers/api/index.ts workers/api/__tests__/ai-models.test.ts wrangler.toml scripts/spike-vision.cjs docs/superpowers/specs/2026-08-13-vision-spike-results.md
git commit -m "feat(ai): vision spike — llama-4-scout image input verified, model decision recorded"
```

---

### Task 2: Student ink layer (two-way canvas)

**Files:**
- Create: `src/components/whiteboard/StudentInkLayer.tsx`
- Modify: `src/components/whiteboard/AIWhiteboardTeacher.tsx` (mount the ink layer over the canvas area; ink-mode toolbar)
- Test: `src/components/whiteboard/__tests__/studentInkLayer.test.ts` (create)

**Interfaces:**
- Produces:
  - `<StudentInkLayer>` props: `{ width: number; height: number; zoom: number; stepKey: string | number; enabled: boolean; onStrokesChange?: (stepKey, json) => void; registerSnapshotFn?: (fn: () => string) => void; registerClearFn?: (fn: () => void) => void }`.
  - Per-step persistence: parent keeps `inkByStep: Map<string|number, string>` (fabric JSON); on `stepKey` change the layer saves outgoing strokes (via onStrokesChange) and loads the incoming step's JSON.
  - `registerSnapshotFn` gives the parent a function returning a COMPOSITE base64 PNG (lesson canvas + ink canvas drawn onto a temp canvas at full 1200x800, `image/png`, quality default) — this is what Tasks 3-4 send to the worker.
  - Tools (internal toolbar UI, rendered by the layer): pen (colors: black #1e293b, blue #2563eb, red #dc2626), eraser (background-colored wider pen — visual erase on the white board), undo-last-stroke, clear-all (with confirm). Touch + mouse via fabric freeDrawingBrush.
  - `enabled` toggles pointer-events and toolbar visibility (parent disables ink while the lesson-type selector or upgrade card is showing).
- Parent integration: in AIWhiteboardTeacher's canvas area, the ink layer mounts absolutely over the canvas with the same effective CSS size; its geometry re-syncs whenever `reflowCanvas` runs (subscribe to the same resize/fullscreen chain — read the current component structure and hook in cleanly). A small "Ink" toggle button (PenLine icon) in the whiteboard header controls `enabled`.

Implementation notes:
- fabric canvas config: `isDrawingMode: true` when pen/eraser active; `selection: false`.
- Eraser: `freeDrawingBrush.color = backgroundColor`, width 24 (pen width 3).
- Undo: pop the last object from the ink canvas (`canvas.getObjects().pop()` → remove → renderAll).
- Per-step save: `JSON.stringify(canvas.toJSON())`; load: `canvas.loadFromJSON(json, () => canvas.renderAll())`.
- Snapshot composite: create `document.createElement('canvas')` at 1200x800, `drawImage` the lesson canvas element then the ink canvas element (both at 0,0 full size — account for their backing-store scale via `canvas.lowerCanvasEl`), then `toDataURL('image/png')`. Strip the `data:` prefix before sending (worker expects raw base64).
- Tests (jsdom): per-step save/restore round-trip preserves stroke counts; undo removes exactly one stroke; clear empties; snapshot function returns a non-empty base64 string (mock the two source canvases with real fabric canvases on jsdom-created canvas elements if feasible; otherwise test the compositing helper with stubbed elements and document the gap).

- [ ] **Steps:** TDD → integrate → `npm run build` + `npx vitest run` green → eslint clean on touched files → commit:

```bash
git commit -m "feat(whiteboard): student ink layer with per-step persistence and composite snapshot"
```

---

### Task 3: "Check my work" — vision grading + spatial annotations

**Files:**
- Modify: `workers/api/revision-classroom.ts` (new endpoint + validator)
- Modify: `src/stores/revisionClassroomStore.ts` (`checkMyWork` action + state)
- Modify: `src/components/whiteboard/AIWhiteboardTeacher.tsx` (Check button, annotation rendering, verdict UI)
- Test: `workers/api/__tests__/check-work.test.ts` (create)

**Interfaces:**
- `POST /api/revision-classroom/lessons/:lessonId/check-work` — premium gate FIRST; body `{ imageBase64: string, stepIndex?: number }`; 413 if base64 length > 700_000; 400 if missing/invalid.
  - Lesson lookup (same join as whiteboard-teach; topic/subject/exam from the row; step context from the progressive cache row when available — the current step's explanation is the problem context).
  - Correct-verdict cache (before the vision call): imageHash = sha-256 hex of the base64 string; lookup `revision_ai_interactions WHERE lesson_id = ? AND interaction_type = 'checkwork_correct' AND user_response = ?` — on hit return its parsed `ai_message` with `cached: true`, no AI call.
  - Vision call (model from `getVisionModel(c.env)`, image shape from Task 1's spike): system prompt = expert <examType> teacher marking a student's handwritten work on <topic> (<subject>). "The image shows the student's work. Identify errors precisely. Respond with ONLY JSON: { verdict: 'correct'|'partial'|'incorrect', explanation: string (≤80 words, warm teacher tone), voiceOver: string (≤40 words), annotations: [{ type: 'circle'|'arrow'|'text'|'rect', id: string, props: {...canvas coordinates...} }] }. Annotations must point AT the work: circle the exact wrong term, arrow to the line where the error starts, text labels short (≤4 words). Canvas is 1200x800. 2-6 annotations." max_tokens 1200. If Task 1 confirmed guided_json support, pass the schema; else rely on prompt + validation.
  - Response processing: `unwrapAiText` → extract JSON (regex) → validate with new `isValidAnnotationSet` (verdict enum; explanation/voiceOver strings; annotations 0-8 items, type whitelist, ids non-empty, numeric props finite; THEN clamp all coordinate props to 0..1200/0..800 in place — clamping, not rejection, for out-of-bounds).
  - On valid `verdict: 'correct'`: insert the interaction row (`checkwork_correct`, ai_message = full JSON, user_response = imageHash). Incorrect/partial verdicts are never cached (each wrong attempt is unique).
  - Response: `{ success, data: { verdict, explanation, voiceOver, annotations, cached, fallback } }`; validation/vision failure → 200 with `fallback: true` and a generic honest annotation-free payload `{ verdict: 'unknown', explanation: "I couldn't read the work clearly — try darker ink or a clearer photo of the page.", ... }` (never a fabricated verdict).
- Store: `checkMyWork(stepIndex)` action — calls the snapshot fn, posts, sets state `checkWorkResult: { verdict, explanation, annotations } | null`, `checkWorkLoading: boolean`; 403 upgradeRequired → `whiteboardLocked: true` (reuses Phase A path).
- Component: "Check my work" button (visible when ink layer has strokes or always in ink mode); on result: annotations render onto the LESSON canvas as a transient annotation layer (they're ordinary validated commands — reuse createObject; prefix ids `annot-`; auto-clear on step change or next check); verdict banner (green/amber/red by verdict) + explanation panel text; voiceOver plays through the existing TTS path (server audio with speechSynthesis fallback).
- Tests (mockD1; env.AI undefined → vision call throws → handler must return the `fallback:true` honest payload with 200): premium gate 403 free user; 413 oversized; 400 missing image; fallback path 200 + `fallback:true` + verdict 'unknown'; valid-cache path (seed a checkwork_correct row, matching hash → cached:true, no AI call).

- [ ] **Steps:** TDD worker → store → component → build + suites green → commit:

```bash
git commit -m "feat(whiteboard): check-my-work vision grading with spatial annotations"
```

---

### Task 4: Point-and-ask ("what does THIS mean?")

**Files:**
- Modify: `workers/api/revision-classroom.ts` (new endpoint)
- Modify: `src/components/whiteboard/AIWhiteboardTeacher.tsx` (question-mark tool + tap capture)
- Modify: `src/stores/revisionClassroomStore.ts` (`askAboutPoint` action)
- Test: `workers/api/__tests__/ask-about.test.ts` (create)

**Interfaces:**
- `POST /api/revision-classroom/lessons/:lessonId/ask-about` — premium gate; body `{ imageBase64 (≤700KB), x: number, y: number, question?: string (≤300 chars) }`; x/y validated finite and clamped to canvas bounds.
  - Vision call: same image shape; prompt: "The student tapped point (x,y) on this 1200x800 lesson image about <topic>. Their question: '<question or "what does this part mean?">'. Answer concisely (≤60 words) referencing what is at/near that point. Respond with ONLY JSON: { answer: string, annotation?: { type:'circle', id:'tap-highlight', props:{ left, top, radius, stroke } } }" — annotation optional, centered near (x,y); validate + clamp like Task 3.
  - Response `{ success, data: { answer, annotation, fallback } }`; failures → `fallback:true` with "I couldn't make out that spot — try asking in chat instead."
- Frontend: a "?" tool in the ink toolbar (HelpCircle icon). When armed, the next tap on the canvas area captures (x, y) in canvas coordinates (account for zoom/pan via the canvas viewportTransform inverse), snapshots the composite, and calls `askAboutPoint`. Answer displays in the explanation panel; the annotation (if any) renders as a pulsing circle for ~3s. The tool disarms after one use.
- Tests: premium 403; 413; 400 on bad x/y (NaN, missing); fallback path 200 with fallback:true (env.AI absent).

- [ ] **Steps:** TDD worker → store/component → build + suites green → commit:

```bash
git commit -m "feat(whiteboard): point-and-ask — tap anywhere, ask about that spot"
```

---

### Task 5: Photo-of-paper work

**Files:**
- Modify: `src/components/whiteboard/AIWhiteboardTeacher.tsx` (Snap/Upload button + preview-confirm flow)
- Modify: `src/stores/revisionClassroomStore.ts` (`checkPhotoWork` action — may share logic with checkMyWork)
- Test: extend `workers/api/__tests__/check-work.test.ts` if endpoint behavior differs (it should not — same endpoint)

**Interfaces:**
- Frontend-only feature: a "Snap your work" button (Camera icon) in the whiteboard toolbar. `<input type="file" accept="image/*" capture="environment">` for phones. On select: downscale client-side (canvas resize, longest edge ≤1600px, JPEG q0.8, verify ≤500KB), show a preview modal with "Use this photo" / retake, then POST to the SAME `check-work` endpoint (`{ imageBase64: jpegBase64, stepIndex }`); the response renders identically to Task 3 (verdict banner + annotations on a photo-preview panel instead of the lesson canvas — annotations display over the photo preview image, scaled to fit).
- Client-side only coordinate nuance: annotations from a photo are in the photo's pixel space, not the 1200x800 canvas — the worker prompt for photo inputs must say the image dimensions it receives. Pass `imageWidth`/`imageHeight` in the request body (validated 100..2000) and have the worker prompt say "the image is WxH px; annotate in that coordinate space"; frontend scales annotation coords into the preview display box.
- Tests: jsdom test of the downscale helper (input dimensions → output constraints: longest edge ≤1600, MIME image/jpeg); the preview modal is visual QA (Task 6).

- [ ] **Steps:** implement → tests → build → commit:

```bash
git commit -m "feat(whiteboard): photograph paper work — vision grading of exercise-book photos"
```

---

### Task 6: Cold TTFS fix — fused outline + first step

**Files:**
- Modify: `workers/api/revision-classroom.ts` (outline mode of whiteboard-teach)
- Test: `workers/api/__tests__/whiteboard-progressive.test.ts` (extend)

**Interfaces:**
- Outline mode (no stepIndex) currently does two sequential AI calls (outline, then step 0). Replace with ONE call producing both: prompt asks for `{ outline: string[4-6], firstStep: <step object for outline[0]> }`, max_tokens 1600. Validate both parts (existing outline validation + isValidWhiteboardStep); on partial failure (valid outline, broken step) fall back to generating step 0 with a second call before the legacy fallback; on total failure keep the current generic fallback path (fallback: true, never cached).
- Response contract unchanged (`{ outline, totalSteps, step, stepIndex: 0, fallback, cached }`) — no frontend changes.
- Tests: fused-shape parsing (mock the AI result like prior tests); partial-failure second-call path; contract fields unchanged.
- Live verification folded into Task 7: cold TTFS for a never-cached topic should drop to ≤6s.

- [ ] **Steps:** TDD → full suite → commit:

```bash
git commit -m "perf(whiteboard): fuse outline+first-step generation — halve cold TTFS"
```

---

### Task 7: Final verification, visual QA, deploy

**Files:**
- Create: `scripts/verify-whiteboard-phase-c.cjs`

- [ ] **Step 1: Gates** — full `npx vitest run` + `npm run build` clean.
- [ ] **Step 2: Deploy** — `npx wrangler deploy` then `npx wrangler pages deploy dist --project-name=brilla-study-platform`.
- [ ] **Step 3: Live probe** (johndoe upgraded to premium then restored; run foreground): premium gates on both new endpoints (403 free / 200 premium); check-work with a synthetic canvas-work fixture returns a verdict + valid annotations (or honest fallback — record which); ask-about returns an answer; photo path with a fixture JPEG returns a verdict; cold TTFS on a fresh topic ≤6s.
- [ ] **Step 4: Visual QA** — real browser as premium johndoe: draw ink on a step, Check my work, screenshot the annotation overlay; arm point-and-ask, tap, screenshot the answer; snap-photo flow with a fixture. Inspect screenshots with ReadMediaFile; record honest observations.
- [ ] **Step 5: Commit** the probe.

```bash
git commit -m "test(scripts): Phase C live verification probe (ink, check-work, point-ask, photo)"
```

---

## Self-Review Notes (completed)

- Spec coverage: C1 → Task 2; C2 → Task 3; C3 → Task 4; C4 → Task 5; C5 → Task 6; C6 → Task 1; gating/cost/testing → per-task + Task 7.
- Ordering: spike (1) unblocks the vision contract before endpoints (3,4); ink layer (2) before check-work UI (3); photo (5) reuses 3's endpoint; TTFS (6) is worker-only and independent — placed late because it touches the same handler as 3/4 and benefits from landing after them.
- The eraser-as-background-pen tradeoff (Task 2) is deliberate for v1: avoids the fabric eraser addon; ink lives on a white board so the visual result is identical.
- Photo annotations use photo pixel space (Task 5 passes image dims into the prompt) — this is the one place annotation coordinates are NOT 1200x800; validator clamps to the declared image dims in that path.
- `check-work` caching only correct verdicts: wrong-work feedback is unique per attempt; caching it would serve stale annotations on different mistakes.
- Known deferred (from Phase B final review, folded into ledger for the Phase C final review): waiting-pill visibility during prefetch, per-step fallback banner, WHITEBOARD_TEACHING_PROMPT legacy tail, katex bundle split.
