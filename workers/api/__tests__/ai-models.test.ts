import { describe, it, expect } from 'vitest';
import {
  getChatModel, getGenerationModel, getEmbeddingModel, getTtsModel, getVisionModel, getCacheThreshold,
} from '../ai-models';

describe('model routing', () => {
  it('uses per-feature vars when set', () => {
    const env = {
      AI_MODEL_CHAT: '@cf/qwen/qwen3-30b-a3b-fp8',
      AI_MODEL_GENERATION: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
      AI_MODEL_EMBEDDING: '@cf/qwen/qwen3-embedding-0.6b',
      AI_MODEL_TTS: '@cf/deepgram/aura-2-en',
      AI_MODEL_VISION: '@cf/meta/llama-3.2-11b-vision-instruct',
      AI_CACHE_THRESHOLD: '0.95',
    } as any;
    expect(getChatModel(env)).toBe('@cf/qwen/qwen3-30b-a3b-fp8');
    expect(getGenerationModel(env)).toBe('@cf/meta/llama-3.3-70b-instruct-fp8-fast');
    expect(getEmbeddingModel(env)).toBe('@cf/qwen/qwen3-embedding-0.6b');
    expect(getTtsModel(env)).toBe('@cf/deepgram/aura-2-en');
    expect(getVisionModel(env)).toBe('@cf/meta/llama-3.2-11b-vision-instruct');
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

  it('vision: var → built-in default, NEVER AI_MODEL (text model)', () => {
    expect(getVisionModel({ AI_MODEL_VISION: '@cf/meta/llama-3.2-11b-vision-instruct' } as any))
      .toBe('@cf/meta/llama-3.2-11b-vision-instruct');
    expect(getVisionModel({} as any)).toBe('@cf/meta/llama-4-scout-17b-16e-instruct');
    // AI_MODEL alone must NOT be picked up — it is a text model, not vision-capable
    expect(getVisionModel({ AI_MODEL: '@cf/meta/llama-3.3-70b-instruct-fp8-fast' } as any))
      .toBe('@cf/meta/llama-4-scout-17b-16e-instruct');
  });
});
