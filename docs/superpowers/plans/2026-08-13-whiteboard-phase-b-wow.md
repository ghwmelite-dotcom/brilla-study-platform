# AI Whiteboard Phase B — Wow Pass + Model Cost Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the AI whiteboard genuinely impressive — progressive generation, draw-on animation, real math, reliable visual primitives, a real voice — while cutting AI cost via per-task model routing, a global content cache, and a semantic answer cache.

**Architecture:** Per-feature model selection via wrangler vars. The whiteboard moves from one blocking 4096-token generation to an outline + per-step progressive protocol, with completed lessons cached globally (D1 lookup, zero schema change) and voiceover audio cached in R2. Student questions get a semantic cache: D1 `ai_answer_cache` rows + a Vectorize index; high-similarity questions skip the LLM entirely.

**Tech Stack:** Cloudflare Workers (Hono), Workers AI (llama-3.3-70b, qwen3-30b-a3b-fp8, qwen3-embedding-0.6b, deepgram aura-2-en), D1, Vectorize, R2, React + fabric.js + KaTeX, Vitest + mockD1.

**Spec:** `docs/superpowers/specs/2026-08-13-whiteboard-monetization-and-wow-design.md` (Phase B sections, incl. the 2026-08-13 amendments B0/B7).

## Global Constraints

- Model ids come from env vars with these defaults — never hardcode a model id at a call site:
  - `AI_MODEL_GENERATION` default `@cf/meta/llama-3.3-70b-instruct-fp8-fast` (whiteboard, essay grading)
  - `AI_MODEL_CHAT` default `@cf/qwen/qwen3-30b-a3b-fp8` (teach, ask, checkpoint, tutor-chat class endpoints)
  - `AI_MODEL_EMBEDDING` default `@cf/qwen/qwen3-embedding-0.6b`
  - `AI_MODEL_TTS` default `@cf/deepgram/aura-2-en`
  - Existing `AI_MODEL` stays as the final fallback (= current behavior for anything not yet routed).
- Semantic cache: cosine similarity threshold from env `AI_CACHE_THRESHOLD` default `0.92`; cache hits consume **no** daily AI allowance and record **no** `revision_ai_interactions` row; only one additive DB object (patch 097, `ai_answer_cache`) and one Vectorize index (`brilla-answers`, 1024 dims, cosine) are created — no changes to existing tables.
- Whiteboard gating from Phase A stays exactly as-is: `whiteboard-teach` and the new `/tts` endpoint are premium-only (`isPremiumUser`); teach/ask/checkpoint keep the daily-allowance check.
- AI output remains untrusted: the Phase A validator is extended (new command types `math`, `primitive`), never weakened.
- The frontend must never break when steps arrive progressively: render what exists, prefetch ahead, show honest per-step loading.
- Worker tests use the existing mockD1 harness; no `env.AI` in unit tests — AI-calling code is isolated behind small functions that tests stub by mocking only the DB and (where needed) the Vectorize binding shape.
- Commit after every task. Do not push. `cd C:/dev/Projects/brilla-study-platform` for all commands.

---

### Task 1: Model routing module + wrangler vars + admin A/B compare endpoint

**Files:**
- Create: `workers/api/ai-models.ts`
- Modify: `wrangler.toml` ([vars] and [env.dev.vars])
- Modify: `workers/api/index.ts` (new admin endpoint, near the other admin AI tools)
- Modify: `workers/api/revision-classroom.ts` (teach/ask/checkpoint use the chat model; whiteboard uses the generation model)
- Test: `workers/api/__tests__/ai-models.test.ts` (create)

**Interfaces:**
- Produces (all later tasks consume):
  - `getChatModel(env): string` — `env.AI_MODEL_CHAT || env.AI_MODEL || '@cf/meta/llama-3.3-70b-instruct-fp8-fast'`
  - `getGenerationModel(env): string` — `env.AI_MODEL_GENERATION || env.AI_MODEL || '@cf/meta/llama-3.3-70b-instruct-fp8-fast'`
  - `getEmbeddingModel(env): string` — `env.AI_MODEL_EMBEDDING || '@cf/qwen/qwen3-embedding-0.6b'`
  - `getTtsModel(env): string` — `env.AI_MODEL_TTS || '@cf/deepgram/aura-2-en'`
  - `getCacheThreshold(env): number` — `parseFloat(env.AI_CACHE_THRESHOLD) || 0.92`
  - Admin endpoint `POST /api/admin/ai-compare` — body `{ prompt: string, systemPrompt?: string, models?: string[] }`; runs the prompt on each model (default: current chat model vs generation model), returns `{ success, data: { results: [{ model, ok, latencyMs, output, tokensUsed, error? }] } }`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import {
  getChatModel, getGenerationModel, getEmbeddingModel, getTtsModel, getCacheThreshold,
} from '../ai-models';

describe('model routing', () => {
  it('uses per-feature vars when set', () => {
    const env = {
      AI_MODEL_CHAT: '@cf/qwen/qwen3-30b-a3b-fp8',
      AI_MODEL_GENERATION: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
      AI_MODEL_EMBEDDING: '@cf/qwen/qwen3-embedding-0.6b',
      AI_MODEL_TTS: '@cf/deepgram/aura-2-en',
      AI_CACHE_THRESHOLD: '0.95',
    } as any;
    expect(getChatModel(env)).toBe('@cf/qwen/qwen3-30b-a3b-fp8');
    expect(getGenerationModel(env)).toBe('@cf/meta/llama-3.3-70b-instruct-fp8-fast');
    expect(getEmbeddingModel(env)).toBe('@cf/qwen/qwen3-embedding-0.6b');
    expect(getTtsModel(env)).toBe('@cf/deepgram/aura-2-en');
    expect(getCacheThreshold(env)).toBe(0.95);
  });

  it('falls back: feature var → AI_MODEL → built-in default', () => {
    expect(getChatModel({ AI_MODEL: 'x' } as any)).toBe('x');
    expect(getChatModel({} as any)).toBe('@cf/meta/llama-3.3-70b-instruct-fp8-fast');
    expect(getGenerationModel({} as any)).toBe('@cf/meta/llama-3.3-70b-instruct-fp8-fast');
    expect(getEmbeddingModel({} as any)).toBe('@cf/qwen/qwen3-embedding-0.6b');
    expect(getCacheThreshold({} as any)).toBe(0.92);
    expect(getCacheThreshold({ AI_CACHE_THRESHOLD: 'garbage' } as any)).toBe(0.92);
  });
});
```

- [ ] **Step 2: Run test to verify it fails** — `npx vitest run workers/api/__tests__/ai-models.test.ts` (module missing).

- [ ] **Step 3: Implement `workers/api/ai-models.ts`**

```ts
/**
 * Central per-task model routing. Model ids are NEVER hardcoded at call
 * sites — they resolve from env vars so models can be swapped by config.
 */

const DEFAULT_MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
const DEFAULT_EMBEDDING_MODEL = '@cf/qwen/qwen3-embedding-0.6b';
const DEFAULT_TTS_MODEL = '@cf/deepgram/aura-2-en';
const DEFAULT_CACHE_THRESHOLD = 0.92;

interface ModelEnv {
  AI_MODEL?: string;
  AI_MODEL_CHAT?: string;
  AI_MODEL_GENERATION?: string;
  AI_MODEL_EMBEDDING?: string;
  AI_MODEL_TTS?: string;
  AI_CACHE_THRESHOLD?: string;
}

export function getChatModel(env: ModelEnv): string {
  return env.AI_MODEL_CHAT || env.AI_MODEL || DEFAULT_MODEL;
}

export function getGenerationModel(env: ModelEnv): string {
  return env.AI_MODEL_GENERATION || env.AI_MODEL || DEFAULT_MODEL;
}

export function getEmbeddingModel(env: ModelEnv): string {
  return env.AI_MODEL_EMBEDDING || DEFAULT_EMBEDDING_MODEL;
}

export function getTtsModel(env: ModelEnv): string {
  return env.AI_MODEL_TTS || DEFAULT_TTS_MODEL;
}

export function getCacheThreshold(env: ModelEnv): number {
  const parsed = parseFloat(env.AI_CACHE_THRESHOLD || '');
  return Number.isFinite(parsed) && parsed > 0 && parsed <= 1 ? parsed : DEFAULT_CACHE_THRESHOLD;
}
```

- [ ] **Step 4: Wire the vars + call sites**

In `wrangler.toml` `[vars]` and `[env.dev.vars]`, after the existing `AI_MODEL` line add:

```toml
AI_MODEL_CHAT = "@cf/qwen/qwen3-30b-a3b-fp8"
AI_MODEL_GENERATION = "@cf/meta/llama-3.3-70b-instruct-fp8-fast"
AI_MODEL_EMBEDDING = "@cf/qwen/qwen3-embedding-0.6b"
AI_MODEL_TTS = "@cf/deepgram/aura-2-en"
AI_CACHE_THRESHOLD = "0.92"
```

In `workers/api/revision-classroom.ts`: replace every `c.env.AI_MODEL || '@cf/meta/llama-3.3-70b-instruct-fp8-fast'` / `env.AI_MODEL || '...'` occurrence — chat-class calls (`generateTeachingContent`, the ask handler, `generateCheckpointQuestion`) use `getChatModel(env)`; whiteboard generation (`generateWhiteboardContent`) uses `getGenerationModel(env)`. Import from './ai-models'. Do the same for `workers/api/tutor.ts` chat calls (chat model) and the essay grading call in `workers/api/index.ts:4594` (generation model). Grep for `AI_MODEL` when done — only `ai-models.ts` defaults and wrangler.toml should remain as id sources.

- [ ] **Step 5: Admin A/B endpoint**

In `workers/api/index.ts`, near the other admin endpoints (after set-tier, ~line 7660):

```ts
// Compare AI models side by side (admin eval tool)
adminApp.post('/ai-compare', async (c) => {
  const { prompt, systemPrompt, models } = await c.req.json();

  if (!prompt || typeof prompt !== 'string' || prompt.length > 8000) {
    return c.json({ success: false, error: 'prompt is required (max 8000 chars)' }, 400);
  }

  const modelList: string[] = Array.isArray(models) && models.length > 0
    ? models.slice(0, 3).filter((m: unknown) => typeof m === 'string' && m.startsWith('@cf/'))
    : [getChatModel(c.env), getGenerationModel(c.env)];

  const results = await Promise.all(modelList.map(async (model: string) => {
    const started = Date.now();
    try {
      const messages = [
        ...(systemPrompt ? [{ role: 'system' as const, content: String(systemPrompt).slice(0, 4000) }] : []),
        { role: 'user' as const, content: prompt },
      ];
      const result = await c.env.AI.run(model as BaseAiTextGenerationModels, {
        messages, max_tokens: 1024, temperature: 0.7,
      });
      const output = typeof result === 'object' && result !== null && 'response' in result
        ? (result as { response: string }).response
        : String(result);
      const tokensUsed = typeof result === 'object' && result !== null && 'usage' in result
        ? ((result as { usage?: { total_tokens?: number } }).usage?.total_tokens ?? null)
        : null;
      return { model, ok: true, latencyMs: Date.now() - started, output, tokensUsed };
    } catch (error) {
      return { model, ok: false, latencyMs: Date.now() - started, output: '', tokensUsed: null, error: error instanceof Error ? error.message : String(error) };
    }
  }));

  return c.json({ success: true, data: { results } });
});
```

Add `import { getChatModel, getGenerationModel } from './ai-models';` to index.ts's imports (check the existing import block placement). `BaseAiTextGenerationModels` type import mirrors revision-classroom.ts.

- [ ] **Step 6: Tests + full suite**

`npx vitest run workers/api/__tests__/ai-models.test.ts` passes; `npx vitest run workers/api` all green.

- [ ] **Step 7: Commit**

```bash
git add workers/api/ai-models.ts workers/api/__tests__/ai-models.test.ts workers/api/revision-classroom.ts workers/api/tutor.ts workers/api/index.ts wrangler.toml
git commit -m "feat(ai): per-task model routing + admin ai-compare eval endpoint"
```

---

### Task 2: Qwen pilot — A/B quality evidence via the live endpoint

**Files:**
- Create: `scripts/ai-model-pilot.cjs`

**Interfaces:**
- Consumes: Task 1's deployed `/api/admin/ai-compare`.
- Produces: a pilot report (committed) driving the keep-or-revert decision on `AI_MODEL_CHAT`.

- [ ] **Step 1: Deploy Task 1** — `npx wrangler deploy`.

- [ ] **Step 2: Write the pilot script**

`scripts/ai-model-pilot.cjs`: logs in as admintest@brillaprep.org (pattern from `scripts/probe-revision-all-exams.cjs`), then POSTs `/api/admin/ai-compare` with `models: ['@cf/qwen/qwen3-30b-a3b-fp8', '@cf/meta/llama-3.3-70b-instruct-fp8-fast']` for each of these 6 prompts:

1. teach hook: "You are an expert WASSCE math teacher. Write a 2-sentence hook introducing Quadratic Equations to a Ghanaian SHS student."
2. teach explain: "Explain the factorisation method for solving x² + 5x + 6 = 0, step by step, max 120 words."
3. ask: "What is the difference between mitosis and meiosis? (WASSCE biology, concise)"
4. checkpoint: "Write one multiple-choice question testing understanding of Ohm's law, with 4 options A-D and the correct answer marked."
5. whiteboard step JSON: "Output JSON only: a whiteboard step object with keys stepNumber, explanation, voiceOver, duration, commands (array of {type,id,props}) drawing the fraction 3/4 as a labeled bar. Canvas 1200x800."
6. off-topic guard: "A student asked during a WASSCE physics revision lesson on waves: 'who will win the champions league?' Answer helpfully but guide back to the topic, max 60 words."

For each: record per-model `ok`, `latencyMs`, `tokensUsed`, output. Compute per-model: success rate, mean latency, mean tokens. For prompt 5 additionally validate the JSON parses and has the required keys (jsonValid true/false).

- [ ] **Step 3: Run the pilot and write the report**

`node scripts/ai-model-pilot.cjs > scripts/.pilot-output.txt` — then write `docs/superpowers/specs/2026-08-13-qwen-pilot-results.md` summarizing: per-model success/latency/tokens, JSON validity for prompt 5, and a quality read of the 6 outputs (teaching tone, accuracy, Ghana-context appropriateness) with 2-3 verbatim output excerpts. End with a clear verdict: **keep qwen3-30b as AI_MODEL_CHAT** or **revert to llama-3.3-70b** (revert = set `AI_MODEL_CHAT` to the llama id in wrangler.toml).

- [ ] **Step 4: Commit**

```bash
git add scripts/ai-model-pilot.cjs docs/superpowers/specs/2026-08-13-qwen-pilot-results.md wrangler.toml
git commit -m "test(ai): qwen3-30b vs llama-70b pilot results + AI_MODEL_CHAT decision"
```

---

### Task 3: Whiteboard content cache (global, per topic + lesson type)

**Files:**
- Modify: `workers/api/revision-classroom.ts` (whiteboard-teach handler, ~line 2221; new helper functions near generateWhiteboardContent)
- Test: `workers/api/__tests__/whiteboard-cache.test.ts` (create)

**Interfaces:**
- Produces:
  - `getCachedWhiteboard(db, topicId, lessonType): Promise<WhiteboardTeachingContent | null>` — reads the newest `revision_ai_interactions` row of type `whiteboard_<lessonType>` joined to the lesson's topic; parses `ai_message` JSON; returns null on miss/parse failure.
  - whiteboard-teach response gains `cached: boolean`.
  - Cache is written ONLY for validated, non-fallback content (fallback content never enters the cache).

Implementation notes:
- The whiteboard-teach handler currently joins `revision_lessons → topics` (topic_id is on the lesson row). The cache lookup:

```ts
async function getCachedWhiteboard(
  db: D1Database,
  topicId: string,
  lessonType: string
): Promise<WhiteboardTeachingContent | null> {
  const row = await db.prepare(`
    SELECT rai.ai_message
    FROM revision_ai_interactions rai
    JOIN revision_lessons rl ON rai.lesson_id = rl.id
    WHERE rl.topic_id = ? AND rai.interaction_type = ?
    ORDER BY rai.created_at DESC
    LIMIT 1
  `).bind(topicId, `whiteboard_${lessonType}`).first<{ ai_message: string }>();

  if (!row?.ai_message) return null;
  try {
    const parsed = JSON.parse(row.ai_message);
    return isValidWhiteboardContent(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
```

- In the handler: after the premium gate, if the lesson has a topic_id, try the cache; on hit return `{ success:true, data:{ whiteboardContent: cached, interactionId: null, lessonType, fallback: false, cached: true } }` (no interaction insert — cache hits are free). On miss: generate as today; only insert the interaction row when `!usedFallback`.
- Tests (mockD1): cache hit path returns cached:true without any AI or insert; miss path generates (AI absent in harness → 500 on generation is fine — assert the cache-miss query ran and the handler attempted generation); fallback content is not written (simulate by... the AI-less harness always falls to catch → fallback; assert no INSERT INTO revision_ai_interactions with whiteboard_ prefix when fallback occurred).

- [ ] **Steps:** TDD per Tasks 1's pattern (failing test → implement → full suite → commit).

```bash
git commit -m "feat(whiteboard): global per-topic content cache; fallback never cached"
```

---

### Task 4: Progressive per-step generation protocol

**Files:**
- Modify: `workers/api/revision-classroom.ts` (whiteboard-teach handler + two new generator functions; the prompt builders)
- Modify: `src/stores/revisionClassroomStore.ts` (`requestWhiteboardTeaching` rewrite; new `fetchNextWhiteboardStep`)
- Modify: `src/components/whiteboard/AIWhiteboardTeacher.tsx` (progressive rendering)
- Test: `workers/api/__tests__/whiteboard-progressive.test.ts` (create)

**Interfaces:**
- New worker contract for `POST /lessons/:lessonId/whiteboard-teach`:
  - Body `{ lessonType, stepIndex?: number, outline?: string[] }`.
  - `stepIndex` omitted or 0 (and no `outline`) ⇒ worker generates an outline (array of 4-6 step titles, one small AI call) AND step 0; response:
    `{ success, data: { outline: string[], totalSteps: number, step: WhiteboardStep, stepIndex: 0, fallback: boolean, cached: boolean } }`
  - `stepIndex: n > 0` with `outline` ⇒ worker generates step n guided by the outline; response `{ success, data: { step, stepIndex: n, totalSteps, fallback } }`.
  - Cache integration (Task 3): the cache stores `{ outline, steps: WhiteboardStep[] }` progressively — on step requests, serve from cache when `cachedSteps[stepIndex]` exists; after generating a step, upsert the cache row so the lesson completes over time. (Store the partial lesson as one interaction row per topic+lessonType whose ai_message holds `{ outline, steps }` — update the same row as steps fill in; the Task 3 single-row lookup keeps working.)
- New store actions:
  - `requestWhiteboardTeaching(lessonType)` — posts `{ lessonType }`; sets `whiteboardOutline: string[]`, `whiteboardSteps: WhiteboardStep[]` (initially [step0]), `whiteboardTotalSteps: number`, `isWhiteboardLoading: false`, `whiteboardStepLoading: false`.
  - `fetchNextWhiteboardStep(nextIndex: number)` — posts `{ lessonType, stepIndex: nextIndex, outline: whiteboardOutline }`; appends the returned step at `whiteboardSteps[nextIndex]`; guards duplicate/in-flight fetches with a `Set<number>` ref in the store.
  - New state: `whiteboardOutline: string[] | null`, `whiteboardSteps: WhiteboardStep[]`, `whiteboardTotalSteps: number`, `whiteboardStepLoading: boolean`. The old `whiteboardContent` field is retired from this flow (keep the field for ImmersiveClassroom compat if referenced — grep first; remove only if unreferenced).
- Component: `AIWhiteboardTeacher` props become `{ outline, steps, totalSteps, isLoading, stepLoading, onRequestContent, onNeedStep, fallback, className }`. It renders `steps[currentStep]`; when the user/planning advances to a step index ≥ steps.length, it calls `onNeedStep(index)` and shows an inline "Preparing next step…" indicator in the canvas area. Progress bar uses `totalSteps`.

Worker generation split:

```ts
// Generates just the lesson outline — small, fast call.
async function generateWhiteboardOutline(env, topic, subject, examType, lessonType): Promise<string[]>
// Generates ONE step, guided by the outline and its position.
async function generateWhiteboardStep(env, topic, subject, examType, lessonType, outline, stepIndex): Promise<WhiteboardStep>
```

- Outline prompt: "List 4-6 step titles for a <lessonType> whiteboard lesson on <topic> (<subject>, <EXAM>). JSON array of strings only." max_tokens 300. Validate: array of 4-6 non-empty strings; else fallback outline `['Introduction','Core concepts','Worked example','Practice tips','Summary']` (mark fallback).
- Step prompt: system = WHITEBOARD_TEACHING_PROMPT + lesson-type instructions + "You are writing step {i+1} of {n}: '{outline[i]}'. Full outline: {outline}. Output ONE JSON step object {stepNumber, explanation, voiceOver, duration, commands[]} only. Canvas 1200x800. Keep commands under 12." max_tokens 1200. Validate with a per-step validator (same rules as isValidWhiteboardContent but for one step); on failure return a minimal generic step with `fallback: true` for THAT step only.
- Step ids must be unique across the lesson: prefix generated command ids server-side with `s{stepIndex}-` before returning (guarantees the frontend idempotency map never collides across steps).

- [ ] **Steps:** TDD for the worker (outline validation fallbacks; stepIndex contract; id prefixing; cache upsert called) → store rewrite → component rewrite → `npm run build` → full suite → commit:

```bash
git commit -m "feat(whiteboard): progressive per-step generation with client-driven prefetch"
```

---

### Task 5: Visual primitives engine

**Files:**
- Create: `src/components/whiteboard/whiteboardPrimitives.ts`
- Modify: `src/components/whiteboard/AIWhiteboardTeacher.tsx` (createObject gains 'primitive' + dispatch)
- Modify: `workers/api/revision-classroom.ts` (WHITEBOARD_TEACHING_PROMPT gains the primitive catalog; validator accepts `primitive` + `math`)
- Test: `src/components/whiteboard/__tests__/whiteboardPrimitives.test.ts` (create; vitest jsdom not required — pure geometry)

**Interfaces:**
- Produces:
  - `renderPrimitive(name: string, params: Record<string, unknown>): fabric.Object[]` — returns an empty array for unknown name/invalid params (never throws).
  - Primitive catalog (all coordinates computed internally from a bounding box `{ left, top, width, height }`):
    - `axes` — `{ left, top, width, height, xLabel?, yLabel?, xMin?, xMax?, yMin?, yMax? }` → two arrowed axis lines + tick marks + labels.
    - `functionPlot` — axes params + `{ fn: string, color? }`; `fn` supports polynomials like `2x^2 - 3x + 1`, `sin(x)`, `cos(x)`, `tan(x)`; implement a tiny recursive-descent parser (no eval): tokenize → shunting-yard → evaluate per sample; sample 100 points, emit a `fabric.Polyline`; clamp y to the box; invalid fn ⇒ [].
    - `numberLine` — `{ left, top, width, min, max, marks?: number[] }` → line + ticks + dots at marks.
    - `fractionBar` — `{ left, top, width, height, numerator, denominator, color? }` → outer rect, `denominator` equal cells, first `numerator` shaded, label `n/d` below. denominator 1-12, 0 ≤ numerator ≤ denominator.
    - `triangleFigure` — `{ left, top, width, height, labels?: { angles?: [string,string,string], sides?: [string,string,string] } }` → triangle polygon + label texts.
    - `tableGrid` — `{ left, top, width, height, rows: string[][] }` → rect grid + cell texts, font auto-shrinks to fit.
- Worker prompt addition (compact catalog text listing the six primitives with params) + instruction: "Prefer primitives over raw shapes whenever one fits. Math expressions go in `math` commands with LaTeX."
- Validator: command type whitelist gains `'primitive'` and `'math'`; `primitive` commands require `props.name` (string) + `props.params` (object); `math` requires `props.latex` (string, ≤ 200 chars).

- [ ] **Steps:** TDD with real geometry assertions — e.g. fractionBar(3/4) returns rect group with exactly 4 cells and 3 shaded; functionPlot('x^2') returns a Polyline whose points all satisfy |y - x²| ≤ epsilon after axis mapping; unknown name ⇒ []; denominator 0 ⇒ []. Then wire createObject + prompt + validator. `npm run build` + `npx vitest run` → commit:

```bash
git commit -m "feat(whiteboard): visual primitives engine (axes, plots, number line, fraction bar, triangle, table)"
```

---

### Task 6: KaTeX math commands

**Files:**
- Modify: `package.json` (add `katex`, `@types/katex` — run `npm install katex @types/katex`)
- Modify: `src/components/whiteboard/AIWhiteboardTeacher.tsx` (math overlay layer)
- Test: `src/components/whiteboard/__tests__/mathOverlay.test.ts` (create — validateLatex helper)

**Interfaces:**
- Produces:
  - `validateLatex(latex: string): boolean` in a new `src/components/whiteboard/mathUtils.ts` — `katex.renderToString(latex, { throwOnError: true })` in try/catch.
  - Command type `math { id, props: { latex, left, top, fontSize?, color? } }` rendered as an absolutely-positioned HTML div over the canvas (a sibling layer, `position:absolute; inset:0; pointer-events:none`), transform-synced with the canvas zoom (read `fabricRef.current.viewportTransform` and apply the same scale/offset to overlay divs; recompute on renderAll via `canvas.on('after:render', syncOverlay)`).
  - `import 'katex/dist/katex.min.css'` in the component file.
  - Invalid LaTeX ⇒ rendered as plain `fabric.Text` fallback (degrade, never crash).
- Worker side: prompt instruction (Task 5 added it) + validator already accepts `math` (Task 5). This task is frontend + dependency only.

- [ ] **Steps:** `npm install katex @types/katex` → TDD validateLatex (valid `\\frac{3}{4}` true; `\\frac{3` false; `\\textbf{x}` true) → overlay implementation → build → commit:

```bash
git commit -m "feat(whiteboard): KaTeX math overlay commands with safe fallback"
```

---

### Task 7: Draw-on animation (WhiteboardAnimator)

**Files:**
- Create: `src/components/whiteboard/whiteboardAnimator.ts`
- Modify: `src/components/whiteboard/AIWhiteboardTeacher.tsx` (drawStep drives the animator; step timer waits for animation)
- Test: `src/components/whiteboard/__tests__/whiteboardAnimator.test.ts` (create)

**Interfaces:**
- Produces:
  - `animateObjectIn(obj: fabric.Object, canvas: fabric.Canvas, opts?: { durationMs?: number }): Promise<void>` — resolves when the entrance animation completes; respects a module-level `motionEnabled` flag (when false, adds instantly and resolves).
  - `animateStep(commands: fabric.Object[], canvas, stepDurationMs): Promise<void>` — animates each object in sequence, distributing the step duration (each object gets `stepDurationMs / (commands.length + 1)` ms, min 150ms, max 1200ms).
  - Animation styles by object type: `fabric.Line`/arrow groups → draw-on via animated `strokeDashOffset` (set `strokeDashArray` to total length, animate offset length→0); `fabric.Text` → opacity+dy fade-up (fabric's `animate` on `opacity` 0→1 and `top` +12→original); other shapes → scale-in from center (`scaleX/scaleY` 0.6→1 with opacity).
  - Cancel support: `cancelAnimations()` — when the user pauses/skips mid-step, in-flight `fabric.util.animate` registrations are cancelled and objects jump to their final state.
- Component integration: `drawStep` becomes async-aware — collect created objects, call `animateStep`, and the auto-advance effect waits `max(remaining step duration, animation time)` before advancing (extend the existing timeout, don't add a second timer). Manual `goToStep` skips animation (instant render). `motionEnabled` toggles off automatically when `window.matchMedia('(prefers-reduced-motion: reduce)')` matches.
- Tests: stub canvas minimal (fabric works headless in vitest with node — the repo already imports fabric in tests? if not, test only the timing/cancel logic with fake objects exposing `set`/`animate`): animateStep resolves; cancelAnimations jumps to final state; reduced-motion flag short-circuits to instant.

- [ ] **Steps:** TDD → integrate → build → manual visual check deferred to Task 9 → commit:

```bash
git commit -m "feat(whiteboard): stroke-by-stroke draw-on animation with reduced-motion support"
```

---

### Task 8: TTS voice endpoint + audio playback (aura-2-en, R2-cached)

**Files:**
- Modify: `workers/api/revision-classroom.ts` (new `POST /revision-classroom/tts`)
- Modify: `src/components/whiteboard/AIWhiteboardTeacher.tsx` (voice playback prefers server audio)
- Modify: `src/stores/revisionClassroomStore.ts` (prefetch per-step audio alongside steps)
- Create: `scripts/spike-tts.cjs`
- Test: `workers/api/__tests__/tts-endpoint.test.ts` (create)

**Interfaces:**
- Spike first (Step 1, blocking): confirm `env.AI.run('@cf/deepgram/aura-2-en', { text, speaker: 'luna', encoding: 'mp3' })` response shape on our account. Do this via a temporary route or the ai-compare-style harness — simplest: the spike script calls a **temporary** admin endpoint `POST /api/admin/tts-spike` `{ text }` that runs the TTS call and returns `{ contentType, byteLength, isBase64, firstBytes }`. Add that endpoint in this task, use it from `scripts/spike-tts.cjs`, and KEEP it (admin-only, useful).
- `POST /revision-classroom/tts` (premium gate per Global Constraints):
  - Body `{ text: string }` (≤ 1500 chars; 400 above).
  - Cache key: sha-256 of `${model}|luna|${text}` (Web Crypto, hex). Check `RECORDINGS_BUCKET.get('tts/<hash>.mp3')` first; on hit stream it with `audio/mpeg`.
  - Miss: call the TTS model, store bytes to R2, return audio.
  - Response headers: `Content-Type: audio/mpeg`, `X-TTS-Cache: hit|miss`.
  - Errors: 502 `{ success:false, error:'TTS unavailable', ttsUnavailable:true }` — frontend falls back to speechSynthesis.
- Frontend: when a step has voiceOver, the component first tries `api`-fetched audio (`POST /revision-classroom/tts`, blob → `URL.createObjectURL` → `Audio`). Play it instead of speechSynthesis; on any failure (non-200, play() rejection) fall back to `speak()`. Mute button pauses whichever is active; unmount cleanup stops audio + revokes object URLs. Prefetch: when step N starts, prefetch audio for step N+1's voiceOver (fire-and-forget, failures ignored).
- Tests: premium gate 403 for free users (mockD1, no AI needed); text length 400; cache-hit path with a mocked R2 binding object `{ get: async () => ({ body: new Uint8Array([1,2,3]) }) }` returns the bytes with `X-TTS-Cache: hit` and never touches env.AI.

- [ ] **Steps:** spike → TDD endpoint → frontend integration → build + suite → deploy worker (Task 9 does full probes) → commit:

```bash
git commit -m "feat(whiteboard): aura-2 TTS voice with R2 caching + speechSynthesis fallback"
```

---

### Task 9: Semantic answer cache (ai_answer_cache + Vectorize)

**Files:**
- Create: `database/prod-patches/097_ai_answer_cache.sql`
- Create: `workers/api/answer-cache.ts`
- Modify: `workers/api/revision-classroom.ts` (ask handler wires the cache)
- Modify: `wrangler.toml` (Vectorize binding)
- Test: `workers/api/__tests__/answer-cache.test.ts` (create)

**Interfaces:**
- Patch 097 (additive, idempotent):

```sql
-- Prod patch 097: semantic answer cache for classroom AI questions (Phase B7).
CREATE TABLE IF NOT EXISTS ai_answer_cache (
  id TEXT PRIMARY KEY,
  topic_id TEXT NOT NULL,
  subject_id TEXT,
  exam_type TEXT,
  question_text TEXT NOT NULL,
  answer_text TEXT NOT NULL,
  model TEXT,
  embedding_id TEXT,
  hit_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  last_hit_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_ai_answer_cache_topic ON ai_answer_cache(topic_id);
```

- `wrangler.toml` (both root and `[env.dev]`):

```toml
[[vectorize]]
binding = "ANSWERS_INDEX"
index_name = "brilla-answers"
```

- `workers/api/answer-cache.ts` exports:
  - `normalizeQuestion(q: string): string` — lowercase, collapse whitespace, strip trailing punctuation.
  - `embedQuestion(env, text): Promise<number[] | null>` — `env.AI.run(getEmbeddingModel(env), { text: [text] })`; adapter handles both `{ data: number[][] }` and `{ data: { shape, data } }` response forms; returns null on any failure (cache is always optional — never break ask).
  - `lookupAnswer(env, topicId, question): Promise<{ answerText: string, id: string } | null>` — embed → `env.ANSWERS_INDEX.query(vector, { topK: 3 })` → for each match id, load the D1 row; accept the first row whose `topic_id` matches AND `match.score >= getCacheThreshold(env)`; on accept: `hit_count = hit_count + 1, last_hit_at = datetime('now')`.
  - `storeAnswer(env, topicId, subjectId, examType, question, answer, model): Promise<void>` — embed, insert D1 row (`embedding_id` = row id), upsert vector. All failures logged and swallowed.
- ask handler integration (after the allowance check, before generation):
  1. `const cached = await lookupAnswer(env, lesson.topic_id, question)` — on hit: return `{ success:true, data:{ content: cached.answerText, cached: true, remainingFreeToday: allowance.remaining } }` (no interaction insert, no AI call; remaining is NOT decremented).
  2. On the normal path after a successful generation + interaction insert: `c.waitUntil(storeAnswer(...))` (or plain await if waitUntil unavailable in context — use `c.executionCtx.waitUntil`).
  3. Response gains `cached: boolean` on both paths (false on miss).
- Frontend: none required (the answer renders identically). Optional: a tiny "instant answer" flair is out of scope.
- Tests (mockD1 + fake ANSWERS_INDEX object): hit at/above threshold returns cached:true, performs no env.AI generation call and no interaction insert; below-threshold/miss passes through; topic mismatch is rejected even at high score; storeAnswer swallows embedding failure.
- Ops steps (part of this task, run by the implementer):
  1. `npx wrangler vectorize create brilla-answers --dimensions=1024 --metric=cosine`
  2. Apply patch 097: `npx wrangler d1 execute brilla-db --remote --file=database/prod-patches/097_ai_answer_cache.sql`
  3. Deploy worker.
  4. Verify embedding dims live: a probe call to the embedding model — if the actual dimension is not 1024, recreate the index with the correct dimension and record it in the report.

- [ ] **Steps:** TDD module + wiring → ops (index + patch + deploy) → live probe: ask "what is photosynthesis?" twice on a premium test session (second call must return cached:true, faster, and johndoe's allowance unchanged) → commit:

```bash
git commit -m "feat(ai): semantic answer cache (Vectorize + ai_answer_cache); cache hits are free"
```

---

### Task 10: Final verification, visual QA, deploy

**Files:**
- Create: `scripts/verify-whiteboard-phase-b.cjs`

**Interfaces:** consumes everything above.

- [ ] **Step 1: Full gates** — `npx vitest run` (whole repo) + `npm run build` clean.
- [ ] **Step 2: Deploy** — worker (`npx wrangler deploy`) + Pages (`npx wrangler pages deploy dist --project-name=brilla-study-platform`).
- [ ] **Step 3: Live probe** — `scripts/verify-whiteboard-phase-b.cjs` (pattern from prior probes; premium test account via admin set-tier on johndoe, restored after):
  1. Start NSMQ math session → whiteboard → step-by-step. Assert: first step arrives with `outline` + `totalSteps` ≥ 4; time-to-first-step < 5s; subsequent step fetches 200; at least one `math` or `primitive` command renders across the lesson (inspect the step JSON); no `Something went wrong`; fallback banner only if `fallback: true`.
  2. Re-request the same lesson type for the same topic → second run serves `cached: true` (Task 3) or fully cached steps (Task 4 cache upsert).
  3. TTS: POST /tts with a sample sentence → 200 audio/mpeg, second call `X-TTS-Cache: hit`.
  4. ask twice ("what is algebra?") → second returns `cached: true`.
  5. Restore johndoe to tier_free in a `finally`.
- [ ] **Step 4: Visual QA** — capture 3 screenshots (math worked example with fractions, a diagram lesson, a concept map) as johndoe-premium; attach to the report; eyeball for: animation visible mid-step, KaTeX fractions rendered (not ASCII), primitives used for axes/fraction bars, no overlapping text disasters.
- [ ] **Step 5: Commit**

```bash
git add scripts/verify-whiteboard-phase-b.cjs
git commit -m "test(scripts): Phase B live verification probe (progressive whiteboard, caches, TTS)"
```

---

## Self-Review Notes (completed)

- Spec coverage: B0 → Tasks 1-2; B1 → Task 4; B2 → Task 7; B3 → Task 6; B4 → Task 5; B5 → Task 8; B6 → Task 3 (extended by Task 4's progressive upsert); B7 → Task 9; B8 tests → per-task tests + Task 10.
- Ordering rationale: primitives catalog (Task 5) ships before animation (Task 7) but after progressive generation (Task 4) — the per-step prompt from Task 4 references "commands" generically, and Task 5 extends the validator/prompt; each intermediate state is deployable and valid.
- Task 5 lands the prompt catalog for `math` before Task 6 renders it — a `math` command arriving before Task 6 deploys would be dropped by the frontend `createObject` switch (no case) — acceptable transient (worker+frontend deploy together in practice).
- `whiteboardContent` retirement (Task 4): implementer must grep for references before removing (ImmersiveClassroom may still consume it); if referenced, keep both fields during the transition.
- The `revision_ai_interactions`-based cache rows from Phase A (whole-lesson JSON) remain readable by Task 3's validator — old-format hits still work; progressive rows store `{ outline, steps }` and the Task 3/4 lookup prefers the new shape, falling back to legacy whole-lesson JSON when `steps` is a valid array of steps (both satisfy "renderable content").
- Vectorize dims: 1024 assumed for qwen3-embedding-0.6b (MRL default max); Task 9 verifies live and recreates the index if the model emits a different size.
