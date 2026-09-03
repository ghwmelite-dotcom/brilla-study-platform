/**
 * Central per-task model routing. Model ids are NEVER hardcoded at call
 * sites — they resolve from env vars so models can be swapped by config.
 */

const DEFAULT_MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
const DEFAULT_EMBEDDING_MODEL = '@cf/qwen/qwen3-embedding-0.6b';
const DEFAULT_TTS_MODEL = '@cf/deepgram/aura-2-en';
const DEFAULT_VISION_MODEL = '@cf/meta/llama-3.2-11b-vision-instruct';
const DEFAULT_MARKING_MODEL = '@cf/openai/gpt-oss-120b';
const DEFAULT_CACHE_THRESHOLD = 0.92;

interface ModelEnv {
  AI_MODEL?: string;
  AI_MODEL_CHAT?: string;
  AI_MODEL_GENERATION?: string;
  AI_MODEL_EMBEDDING?: string;
  AI_MODEL_TTS?: string;
  AI_MODEL_VISION?: string;
  AI_MODEL_MARKING?: string;
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

/**
 * Vision model routing deliberately does NOT fall back to AI_MODEL — that var
 * holds a text-only model which would fail on image input. Chain: var →
 * built-in vision default only.
 */
export function getVisionModel(env: ModelEnv): string {
  return env.AI_MODEL_VISION || DEFAULT_VISION_MODEL;
}

/**
 * Marking model routing deliberately does NOT fall back to AI_MODEL — that
 * var may hold a small chat model, while marking wants a reasoning-class
 * model. Chain: var → built-in marking default only (same precedent as
 * getVisionModel above).
 */
export function getMarkingModel(env: ModelEnv): string {
  return env.AI_MODEL_MARKING || DEFAULT_MARKING_MODEL;
}

export function getCacheThreshold(env: ModelEnv): number {
  const parsed = parseFloat(env.AI_CACHE_THRESHOLD || '');
  return Number.isFinite(parsed) && parsed > 0 && parsed <= 1 ? parsed : DEFAULT_CACHE_THRESHOLD;
}

/**
 * Unwrap a Workers AI text-generation result to a string. The binding usually
 * returns `{ response: string }`, but returns `response` as ALREADY-PARSED JSON
 * (object/array) when the model output is bare valid JSON — observed live with
 * `@cf/meta/llama-3.3-70b-instruct-fp8-fast` (whiteboard Phase B verification).
 * Any caller that string-processes the result (`.match`, `.trim`, …) MUST go
 * through this; a raw cast throws `TypeError` on parsed-JSON responses and the
 * surrounding catch then silently serves fallback content.
 */
export function unwrapAiText(result: unknown): string {
  const raw =
    typeof result === 'object' && result !== null && 'response' in result
      ? (result as { response: unknown }).response
      : result;
  if (raw === null || raw === undefined) return '';
  return typeof raw === 'string' ? raw : JSON.stringify(raw);
}

export interface TextModelRequest {
  model: string;
  system: string;
  user: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Shared Workers AI text-call helper. Every converted call site goes through
 * this; none parse env.AI.run results raw (the parsed-JSON-response trap
 * documented above unwrapAiText).
 */
export async function callTextModel(
  env: ModelEnv & { AI: Ai },
  { model, system, user, history = [], maxTokens, temperature }: TextModelRequest,
): Promise<string> {
  const result: unknown = await env.AI.run(model as never, {
    messages: [
      { role: 'system', content: system },
      ...history,
      { role: 'user', content: user },
    ],
    ...(maxTokens !== undefined ? { max_tokens: maxTokens } : {}),
    ...(temperature !== undefined ? { temperature } : {}),
  } as never);
  return unwrapAiText(result);
}
