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
