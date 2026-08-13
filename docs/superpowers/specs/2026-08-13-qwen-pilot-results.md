# Qwen3-30B vs Llama-3.3-70B — AI_MODEL_CHAT Quality Pilot

**Date:** 2026-08-13
**Endpoint:** `POST /api/admin/ai-compare` (admin-only, live production worker `brilla-api`)
**Candidates:** `@cf/qwen/qwen3-30b-a3b-fp8` vs `@cf/meta/llama-3.3-70b-instruct-fp8-fast`
**Pilot script:** `scripts/ai-model-pilot.cjs` (raw run log: `scripts/.pilot-output.txt`)
**Prompts:** 6 representative chat workloads — teach hook, teach explain, ask, checkpoint MCQ, whiteboard step JSON, off-topic guard.

## Headline metrics

| Metric | qwen3-30b-a3b-fp8 | llama-3.3-70b-instruct-fp8-fast |
|---|---|---|
| Success rate | 6/6 | 6/6 |
| Mean latency | **9549 ms** | **5028 ms** |
| Mean tokens used | **791** | **247** |
| Whiteboard JSON valid | **0/1** | **1/1** |

Per-prompt:

| Prompt | Qwen latency / tokens | Llama latency / tokens |
|---|---|---|
| teach-hook | 8669 ms / 804 | 6304 ms / 174 |
| teach-explain | 11522 ms / 1064 | 8080 ms / 204 |
| ask (mitosis vs meiosis) | 7368 ms / 770 | 1356 ms / 142 |
| checkpoint (Ohm's law MCQ) | 14264 ms / 818 | 1727 ms / 154 |
| whiteboard-json | 13774 ms / 1086 | 11903 ms / 695 |
| off-topic-guard | 1697 ms / 203 | 795 ms / 113 |

## Critical finding: Qwen's visible output was truncated or empty — hidden reasoning is the strongly-indicated cause

Qwen3-30B is a reasoning model, and the strongly-indicated explanation for what follows is that it spent most of its token budget on hidden internal reasoning before emitting the final answer (we did not inspect reasoning traces directly, so this is inference from token counts and output shape, not a proven mechanism). Two of six outputs were **unusable in production** despite `ok: true`:

1. **teach-explain** — 1064 tokens used, but the entire visible output was:
   > `To solve $x^2 + 5x + 6 = 0$ by`

   Consistent with hidden reasoning consuming the completion budget, the answer was cut off mid-sentence.
2. **whiteboard-json** — 1086 tokens used, **output was empty/null** (`jsonValid=false`). For the whiteboard feature — the whole point of routing chat to a strong model — Qwen returned nothing parseable.

Every Qwen output also began with stray leading blank lines (artifact of the reasoning-then-answer format).

Llama returned complete, usable output on all 6 prompts, and its whiteboard JSON parsed with all required keys (`stepNumber, explanation, voiceOver, duration, commands[]`).

## Quality read (where both models produced output)

- **Teaching tone / Ghana-context:** Both are good. Qwen's hook ("maximize the space for your family's farm with limited fencing") is tight and locally grounded. Llama's hook is also Ghana-appropriate ("trajectory of a football kicked by a Black Stars player or the growth of a cocoa farm") but ran long — one run-on "sentence", weaker instruction-following on the 2-sentence limit.
- **Factual accuracy:** No errors from either. Llama's factorisation (x = -2, -3 via grouping), mitosis/meiosis contrast, and Ohm's law MCQ (I = 12V/4Ω = 3A) are all correct and WASSCE-level appropriate.
- **Instruction-following:** Llama respected the 120-word explain limit (~60 words) and the 60-word off-topic limit. Qwen's off-topic guard answer was good ("let's focus on waves! … sound and light waves instead"), but its explain answer truncated before ever demonstrating instruction-following.
- **Off-topic guard:** Both redirected to waves gracefully; Llama added a light pun ("'ride the wave' of success") that fits a friendly tutor persona.
- **JSON-only compliance:** Qwen failed outright (empty output). Llama wrapped the JSON in a ```` ```json ```` fence despite "JSON only" — a minor blemish, but the fenced payload parses and the fence is trivially strippable.

## Cost/latency

Qwen was ~1.9x slower on average (9549 ms vs 5028 ms) and consumed ~3.2x the tokens (791 vs 247) — much of that spend apparently invisible reasoning that users never see. On a latency-sensitive chat surface for SHS students on mobile connections, this is a material regression.

## Methodology caveat

All ai-compare calls ran with `max_tokens: 1024` (hardcoded in `workers/api/index.ts` for both the Anthropic-proxy path and the Workers AI path). This is the **same budget the production chat endpoints use** — the teach/ask flows in `workers/api/revision-classroom.ts` also run at `max_tokens: 1024` — so the pilot measured fitness under real production configuration, and the verdict stands operationally regardless of mechanism. However:

- A 1024-token budget structurally disadvantages reasoning-mode models like qwen3-30b-a3b, which (by design) spend tokens on hidden reasoning before producing visible output. With a larger budget, Qwen's truncated/empty outputs might have completed.
- A retest of Qwen with a raised `max_tokens` budget, or with a non-reasoning Qwen variant, remains a legitimate option if chat quality ever needs revisiting. Such a retest would need a corresponding production-config change to be decision-relevant.
- The hidden-reasoning explanation for Qwen's truncated outputs is the strongly-indicated reading of the token counts and output shapes observed; we did not inspect reasoning traces, so it is not a proven mechanism.

## Verdict

**REVERT to llama-3.3-70b-instruct-fp8-fast as AI_MODEL_CHAT.**

Under the production 1024-token budget, Qwen3-30B produced truncated/empty completions (with hidden reasoning-token consumption the strongly-indicated explanation), broke the whiteboard JSON workload entirely, and roughly doubles latency at ~3x token cost. Llama is complete, accurate, faster, cheaper, and produced valid whiteboard JSON. Qwen's hook-writing was arguably the best single output, but that does not offset two production-blocking failures.

Action taken: `AI_MODEL_CHAT` set back to `@cf/meta/llama-3.3-70b-instruct-fp8-fast` in `wrangler.toml` (both `[vars]` and `[env.dev.vars]`) and redeployed (Version ID `44fc0d23-a56d-4aa5-86ed-12e2ece9585d`). The env-var routing machinery and `/api/admin/ai-compare` endpoint remain in place, so a future retry of Qwen (e.g. with a raised max-tokens budget or a non-reasoning Qwen variant) is a one-line config change plus a re-run of `scripts/ai-model-pilot.cjs`.
