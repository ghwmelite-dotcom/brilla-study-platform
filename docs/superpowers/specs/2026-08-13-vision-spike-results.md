# Vision Spike Results — "AI sees student work" (Whiteboard Phase C, Task 1)

Date: 2026-08-13 · Runner: `scripts/spike-vision.cjs` against live prod worker · Raw data: `.superpowers/sdd/2026-08-13-whiteboard-phase-c-two-way/vision-spike-raw.json`

## Verdict: KEEP SCOUT

**Model: `@cf/meta/llama-4-scout-17b-16e-instruct`** (already set as `AI_MODEL_VISION` in both wrangler.toml var blocks).
**Input shape: `openai-image-url`** — OpenAI-style content parts with a base64 data URI.

Scout is the only candidate that honors `guided_json`, which the annotation pipeline (Tasks 3–4) requires for structured output. It reads both synthetic fixtures accurately. The fallback (`llama-3.2-11b-vision-instruct`) has slightly better prose-mode error-line localization but provably ignores `guided_json`, which disqualifies it for this feature.

## Winning request shape (the contract for Tasks 3–4)

```jsonc
// env.AI.run('@cf/meta/llama-4-scout-17b-16e-instruct', <this object>)
{
  "messages": [
    {
      "role": "user",
      "content": [
        { "type": "text", "text": "<prompt>" },
        { "type": "image_url", "image_url": { "url": "data:image/png;base64,<base64>" } }
      ]
    }
  ],
  "max_tokens": 1024,
  // optional, verified working:
  "guided_json": { "type": "object", "properties": { "...": "..." }, "required": ["..."] }
}
```

Response runtime shape: `object-with-response-string` — `{ response: string }`; with `guided_json` the string is schema-conformant JSON. All handling must go through `unwrapAiText` (unchanged behavior).

## Input-shape discovery (the spike's primary job)

Tested per model with a prompt that forces reading the image ("What text is written in this image? Reply with the exact text only"). A shape counts as working only when the output demonstrably reflects image content.

| Shape | Scout | llama-3.2-11b-vision |
|---|---|---|
| `message-image-array` — `{ role, content, image: [...bytes] }` | accepted, image silently dropped ("There is no image.") | accepted, image silently dropped ("There is no image.") |
| `message-image-base64` — `{ role, content, image: "<base64>" }` | accepted, image silently dropped | accepted, image silently dropped |
| `content-parts` — `[{type:'text'},{type:'image', image:[...]}]` | error 8007: "Unsupported chat content part type: 'image'. Supported types: audio_embeds, audio_url, image_…" | error 8001: Invalid input |
| `content-parts-base64` — `[{type:'text'},{type:'image', image:"<b64>"}]` | error 8007 (same) | error 8001: Invalid input |
| `toplevel-array` — `{ prompt, image: [...bytes] }` (no messages) | accepted, image ignored (rambles unrelated text) | **WORKS** — exact read |
| `openai-image-url` — content parts with `image_url` data URI | **WORKS** — exact read | **WORKS** — exact read |

Critical trap for future implementers: the message-level `image` field (the leading candidate from llama-3.2 vision conventions) **fails silently** — the request succeeds and the model answers from text alone. Any vision caller must verify the model actually saw the image, not just that the call returned 200.

The endpoint's default `inputShape` is now `openai-image-url`; the other shapes remain whitelisted on the admin-only spike endpoint for future model evals.

## Fixtures

Both 1024×768 white canvas, drawn in-browser with canvas 2D (`52px "Comic Sans MS", cursive`), slight per-line rotation, plus a stray bezier squiggle:

1. `x + 2 = 5`
2. `x = 5 - 2`
3. `x = 4`  ← deliberately wrong (correct: `x = 3`)

- **clean**: dark ink, no global rotation
- **degraded**: 8° global rotation, low-contrast gray ink

## Transcription accuracy (per model, winning shape)

Prompt: transcribe each line exactly, then identify the wrong line and explain.

| Model | Fixture | L1 `x+2=5` | L2 `x=5-2` | L3 `x=4` | Flags line 3 | Derives x=3 | Latency |
|---|---|---|---|---|---|---|---|
| Scout (openai-image-url) | clean | ✓ | ✓ | ✓ | ✓ ("line 2 and 3" — over-blames line 2) | ✓ | 1725ms |
| Scout (openai-image-url) | degraded | ✓ | ✓ | ✓ | ✗ (blamed line 2 only) | ✓ | 2128ms |
| 3.2-11b-vision (toplevel-array) | clean | ✓ | ✓ | ✓ | ✓ ("mistake is in line 3… get 4 instead of 3") | ✓ | 3169ms |
| 3.2-11b-vision (toplevel-array) | degraded | ✓ | ✓ | ✓ | ✓ ("mistake is in line 3") | ✓ | 2449ms |

Notes:
- Scout wraps math in LaTeX (`$x+2=5$`) — content correct; scoring normalizes formatting.
- Scout's prose-mode blame targeting is imprecise (clean: "line 2 and 3"; degraded: "line 2"). Under `guided_json` (below) it answered `wrongLine: 3` with a correct explanation, so structured prompting materially improves its localization.
- One discovery-mode quirk: Scout once "auto-corrected" line 3 to `x=3` in a terse transcription — it occasionally normalizes what it reads toward the right answer. The annotation prompt/schema must explicitly ask for the *written* text.

## guided_json conformance

Schema: `{ transcription: string[], wrongLine: integer, explanation: string }` (all required).

| Model | Conforms | Detail | Latency |
|---|---|---|---|
| Scout | ✓ (2/2 runs) | Valid schema-conformant JSON. Run 2 parsed: `wrongLine: 3`, explanation "…x = 5 - 2 results in x = 3, not x = 4". Caveat: its `transcription` array auto-corrected line 3 to "x = 3" (normalization quirk above). | 2052ms |
| 3.2-11b-vision | ✗ (0/2 runs) | Ignores `guided_json` entirely; returns prose/markdown tables. | — |

## Latency summary

- Scout: 0.2–2.1s on working calls (a 17s outlier occurred only on the blind `toplevel-array` ramble).
- 3.2-11b-vision: 1.2–3.2s.
- Both well within interactive bounds for the annotation feature.

## Contract carry-over for Tasks 3–4

1. Model: `getVisionModel(env)` → `@cf/meta/llama-4-scout-17b-16e-instruct` (env `AI_MODEL_VISION`, no AI_MODEL fallback).
2. Request: `openai-image-url` shape exactly as above; image ≤ ~500KB binary (endpoint bound: 700KB base64).
3. Response: `{ response: string }`; always `unwrapAiText`.
4. Use `guided_json` for annotation output — verified conformant on Scout; also improves wrong-line localization vs prose mode.
5. Prompt must demand transcription of the *written* work verbatim (Scout tends to auto-correct toward the right answer).
