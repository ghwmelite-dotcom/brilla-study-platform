import { describe, it, expect, vi } from 'vitest';
import {
  getChatModel, getGenerationModel, getEmbeddingModel, getTtsModel, getVisionModel, getCacheThreshold,
  callTextModel, getMarkingModel,
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
    expect(getVisionModel({} as any)).toBe('@cf/meta/llama-3.2-11b-vision-instruct');
    // AI_MODEL alone must NOT be picked up — it is a text model, not vision-capable
    expect(getVisionModel({ AI_MODEL: '@cf/meta/llama-3.3-70b-instruct-fp8-fast' } as any))
      .toBe('@cf/meta/llama-3.2-11b-vision-instruct');
  });
});

describe('marking model routing', () => {
  it('var → built-in marking default, NEVER AI_MODEL (may be a small chat model)', () => {
    expect(getMarkingModel({ AI_MODEL_MARKING: '@cf/openai/gpt-oss-120b' } as any))
      .toBe('@cf/openai/gpt-oss-120b');
    expect(getMarkingModel({} as any)).toBe('@cf/openai/gpt-oss-120b');
    expect(getMarkingModel({ AI_MODEL: '@cf/meta/llama-3.3-70b-instruct-fp8-fast' } as any))
      .toBe('@cf/openai/gpt-oss-120b');
  });
});

describe('callTextModel', () => {
  const makeAi = (result: unknown) => ({
    run: vi.fn(async (_model: string, _req: unknown) => result),
  });

  it('sends system+user messages and unwraps { response: string }', async () => {
    const AI = makeAi({ response: 'marked.' });
    const text = await callTextModel({ AI } as any, {
      model: '@cf/openai/gpt-oss-120b', system: 'sys', user: 'usr', maxTokens: 512, temperature: 0.2,
    });
    expect(text).toBe('marked.');
    expect(AI.run).toHaveBeenCalledWith('@cf/openai/gpt-oss-120b', {
      messages: [{ role: 'system', content: 'sys' }, { role: 'user', content: 'usr' }],
      max_tokens: 512, temperature: 0.2,
    });
  });

  it('stringifies an already-parsed JSON response (the unwrapAiText trap)', async () => {
    const AI = makeAi({ response: { score: 4 } });
    const text = await callTextModel({ AI } as any, { model: 'm', system: 's', user: 'u' });
    expect(text).toBe('{"score":4}');
    expect(AI.run).toHaveBeenCalledWith('m', {
      messages: [{ role: 'system', content: 's' }, { role: 'user', content: 'u' }],
    });
  });

  it('inserts history between system and user messages', async () => {
    const AI = makeAi({ response: 'ok' });
    await callTextModel({ AI } as any, {
      model: 'm', system: 's', user: 'u2',
      history: [{ role: 'user', content: 'u1' }, { role: 'assistant', content: 'a1' }],
    });
    expect(AI.run).toHaveBeenCalledWith('m', {
      messages: [
        { role: 'system', content: 's' },
        { role: 'user', content: 'u1' },
        { role: 'assistant', content: 'a1' },
        { role: 'user', content: 'u2' },
      ],
    });
  });
});
