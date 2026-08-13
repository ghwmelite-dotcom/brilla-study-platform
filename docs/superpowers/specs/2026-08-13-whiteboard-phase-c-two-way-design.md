# Phase C — "The Teacher That Sees Your Work" Design

Date: 2026-08-13
Status: Draft — pending owner review
Author: Kimi + ghwmelite
Builds on: `2026-08-13-whiteboard-monetization-and-wow-design.md` (Phases A + B, shipped)

## Vision

Every AI tutor is a chat box. Phase C makes the Brilla whiteboard **two-way**:
the student works problems on the same canvas the AI teaches on — or snaps a
photo of their exercise book — and the AI *sees* the work, marks it, and points
at the exact line where things went wrong. This is the shareable,
waitlist-building feature; it stands entirely on Phase B's primitives
(validated drawing commands, KaTeX, animation, caches).

## The core technical decision: the AI sees images, not stroke data

Two ways to let the AI perceive student work were considered:

1. **Stroke JSON** (serialize the student's vector strokes as text for the chat
   LLM) — fragile: handwriting/math notation as raw point sequences is hard for
   a text model to spatially reason about, and produces weak "where is the
   mistake" grounding.
2. **Canvas snapshot → vision model (chosen).** The student canvas renders to a
   PNG (`fabric.Canvas.toDataURL`), sent to
   **`@cf/meta/llama-4-scout-17b-16e-instruct`** — vision-capable on Workers AI,
   $0.27/M in, $0.85/M out, 131k context, `guided_json` support
   ([model docs](https://developers.cloudflare.com/workers-ai/models/llama-4-scout-17b-16e-instruct/)).
   The model receives the snapshot + lesson context (topic, step, the problem
   set) and returns **structured spatial feedback**: verdict + explanation +
   annotation commands (`circle`/`arrow`/`text` pinned to canvas coordinates).

Chosen because: handwriting and worked math are inherently visual; the vision
model grounds feedback in pixel positions that map directly onto our existing
validated command renderer. The same pipeline grades on-canvas work AND
uploaded photos of paper work — one mechanism, two magical inputs.

The exact image-input shape for llama-4-scout via `env.AI.run` on our account
(base64 field vs message content parts) is verified by the C1 spike task before
any endpoint is built on it.

## Scope

### C1. Student ink layer (the canvas becomes two-way)

- A student drawing layer over the whiteboard canvas: pen (2-3 colors), eraser,
  clear-my-work, undo. Touch-first (most students are on phones), works with
  mouse.
- The AI lesson keeps playing underneath; student ink is a separate fabric
  layer, never mixed into lesson objects (the Phase B renderer/idempotency
  untouched).
- Ink persists per step: moving between steps preserves what the student wrote
  on each step's working space.

### C2. "Check my work" (the flagship interaction)

- During any step (or a dedicated practice step), the student works the problem
  in ink and taps **Check my work**.
- Worker endpoint `POST /revision-classroom/lessons/:id/check-work`
  (premium-gated like all whiteboard features):
  1. Body: `{ imageBase64, stepIndex }` (PNG snapshot of the student layer,
     downscaled client-side to ≤1024px, ≤500KB — 413 above).
  2. Vision call: snapshot + context (topic, subject, exam, the step's problem)
     → model returns `{ verdict: 'correct'|'partial'|'incorrect',
     explanation, voiceOver, annotations: DrawCommand[] }`.
  3. Annotations pass through the SAME validation pipeline as Phase B commands
     (whitelist, clamped to canvas bounds) — the model can be wrong
     pedagogically but never visually broken.
- Frontend renders the AI's annotations as an animated overlay on top of the
  student's ink (arrow to the line with the dropped negative, a circle around
  the correct final answer) + speaks/plays the explanation.
- Response cached per (topic, problem, imageHash) only when verdict is
  `correct` (wrong-work feedback is unique per attempt — never cache it).

### C3. Point-and-ask ("what does THIS part mean?")

- A question-mark tool: student taps it, then taps any spot on the canvas
  (AI-drawn content or their own ink).
- `POST /revision-classroom/lessons/:id/ask-about` (premium):
  `{ imageBase64, x, y, question? }` → vision model answers referencing the
  tapped region ("that arrow shows the electron flow…") → response text +
  optional highlight annotation at (x, y).
- Distinct from the free chat `ask` (text-only, allowance-metered): this is a
  premium whiteboard interaction, unmetered.

### C4. Photo-of-paper work (same pipeline, bigger magic)

- "Snap your work" button: phone camera / file upload of a page from the
  student's exercise book → same `check-work` endpoint (the snapshot input is
  already just an image).
- This is arguably the most viral artifact in the target market: a student
  photographs their handwritten WASSCE solution and gets teacher-grade marking
  with spatial annotations in seconds.
- Image constraints: ≤5MB upload, client-side downscale to ≤1600px longest
  edge, JPEG q0.8 before upload.

### C5. Cold time-to-first-step fix (carried from Phase B)

- Cold TTFS measured at 8-13s vs the 5s target (two sequential LLM calls:
  outline, then step 0). Fix by fusing: one call returns outline + step 0
  together (outline is 300 tokens; the combined call stays well under the
  truncation threshold), keeping per-step calls for steps 1+.
- Only first-ever generation of a topic is affected (cache makes everything
  else instant), but first impressions are the feature's demo moment.

### C6. Spike: vision input shape (blocks C2-C4)

- Verify llama-4-scout image input on our account via a temporary admin
  endpoint + probe: exact request shape, max image size, latency, output
  quality on a real handwritten-work photo. Also verify `guided_json` support
  for the annotation schema (if supported, use it; else prompt + validate as
  usual).
- Decision gate: if Scout's handwriting reading is poor on real Ghanaian
  exercise-book photos, evaluate `@cf/meta/llama-3.2-11b-vision-instruct`
  (already in the codebase) and report before building C2-C4 on it.

## Gating & cost

- Everything in Phase C is **premium-only** (whiteboard family; Phase A gate
  pattern reused verbatim).
- Cost per check-work call: one vision inference (~1-2k image tokens + ~300
  output tokens ≈ fractions of a pesewa at Scout pricing). No allowance
  consumption (premium interactions are unmetered, as with the whiteboard).
- Free-tier experience is unchanged (chat allowance + cache hits from Phase A/B).

## Error handling principles (carried from A/B)

- Vision failures degrade honestly: "Couldn't read the work — try a clearer
  photo / darker ink" (never a fabricated verdict).
- Annotation coordinates are validated and clamped; unknown commands dropped.
- Image size limits enforced server-side with clear 413 messaging.
- All AI output untrusted; verdicts are advisory UX, never presented as
  official exam marking.

## Testing

- Unit: annotation validator (clamps, whitelist), image size guards, cache-key
  logic, gating on both new endpoints.
- Live probe: draw ink on a canvas programmatically → check-work → verdict +
  annotations render; photo path with a fixture image; free user → 403 on both
  new endpoints.
- Visual QA: real phone-size viewport walkthrough of the ink + check-work loop.

## Explicit non-goals

- Real-time collaborative whiteboard (study rooms) — needs Durable Objects;
  separate future spec.
- Immersive mode rework (its AI layer stays dormant until a dedicated pass).
- Handwriting-to-LaTeX conversion of student work (nice-to-have; the vision
  model reads the image directly).
