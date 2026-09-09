import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import { ttsApp } from '../tts';
import { createMockD1, type MockHandler } from './helpers/mockD1';

const JWT_SECRET = 'test-secret-that-is-long-enough';

// ttsApp is mounted on a local app here; index.ts wiring is done separately.
const app = new Hono();
app.route('/api/tts', ttsApp);

async function token(payload: object) {
  return sign(
    { ...payload, exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000) },
    JWT_SECRET,
  );
}

const authHandler: MockHandler = {
  match: /SELECT role, status, is_active, session_version FROM users/,
  first: () => ({ role: 'student', status: 'approved', is_active: 1 }),
};

const premiumHandler: MockHandler = {
  match: /SELECT role, subscription_tier_id, subscription_expires_at, trial_expires_at\s+FROM users/,
  first: () => ({
    role: 'student', subscription_tier_id: 'tier_student_monthly',
    subscription_expires_at: new Date(Date.now() + 86400000).toISOString(), trial_expires_at: null,
  }),
};

const freeHandler: MockHandler = {
  match: /SELECT role, subscription_tier_id, subscription_expires_at, trial_expires_at\s+FROM users/,
  first: () => ({
    role: 'student', subscription_tier_id: 'tier_free',
    subscription_expires_at: null, trial_expires_at: null,
  }),
};

interface FakeBucket {
  get(key: string): Promise<unknown>;
  put?(key: string, value: unknown, opts?: unknown): Promise<unknown>;
}

interface FakeAi {
  run(model: string, opts: unknown): Promise<unknown>;
}

interface EnvOverrides {
  bucket?: FakeBucket;
  ai?: FakeAi;
}

function buildEnv(db: unknown, { bucket, ai }: EnvOverrides = {}) {
  return {
    DB: db as D1Database,
    JWT_SECRET,
    RECORDINGS_BUCKET: bucket as unknown as R2Bucket,
    AI: ai as unknown as Ai,
  };
}

async function post(db: unknown, body: object, overrides: EnvOverrides = {}, withAuth = true) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (withAuth) {
    headers.Authorization = `Bearer ${await token({ userId: 'user_1', role: 'student' })}`;
  }
  return app.fetch(
    new Request('http://x/api/tts/speak', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    }),
    buildEnv(db, overrides),
  );
}

describe('tts /speak auth', () => {
  it('rejects unauthenticated requests with 401', async () => {
    const db = createMockD1([authHandler, premiumHandler]);
    const res = await post(db, { text: 'Hello' }, {}, false);
    expect(res.status).toBe(401);
    const body = (await res.json()) as { success: boolean };
    expect(body.success).toBe(false);
  });
});

describe('tts /speak tier gating', () => {
  it('rejects free users with 403 before any TTS work', async () => {
    const db = createMockD1([authHandler, freeHandler]);
    let bucketTouched = false;
    let aiCalls = 0;
    const bucket = {
      get: async () => { bucketTouched = true; return null; },
    };
    const ai = {
      run: async () => { aiCalls++; return new Uint8Array([1]); },
    };
    const res = await post(db, { text: 'Hello world' }, { bucket, ai });
    expect(res.status).toBe(403);
    const body = (await res.json()) as { success: boolean };
    expect(body.success).toBe(false);
    expect(bucketTouched).toBe(false);
    expect(aiCalls).toBe(0);
  });
});

describe('tts /speak validation', () => {
  it('rejects text over 2000 chars with 400', async () => {
    const db = createMockD1([authHandler, premiumHandler]);
    const res = await post(db, { text: 'a'.repeat(2001) });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { success: boolean };
    expect(body.success).toBe(false);
  });

  it('accepts text at exactly 2000 chars', async () => {
    const db = createMockD1([authHandler, premiumHandler]);
    const bucket = { get: async () => ({ body: new Uint8Array([4, 5, 6]) }) };
    const res = await post(db, { text: 'a'.repeat(2000) }, { bucket });
    expect(res.status).toBe(200);
  });

  it('rejects missing text with 400', async () => {
    const db = createMockD1([authHandler, premiumHandler]);
    const res = await post(db, {});
    expect(res.status).toBe(400);
  });
});

describe('tts /speak R2 cache', () => {
  it('serves a cache hit from R2 with X-TTS-Cache: hit and never calls env.AI', async () => {
    const db = createMockD1([authHandler, premiumHandler]);
    let getKey = '';
    let aiCalls = 0;
    const bucket = {
      get: async (key: string) => {
        getKey = key;
        return { body: new Uint8Array([1, 2, 3]) };
      },
    };
    const ai = {
      run: async () => { aiCalls++; return new Uint8Array([9]); },
    };
    const res = await post(db, { text: 'Magnets attract iron.' }, { bucket, ai });
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('audio/mpeg');
    expect(res.headers.get('X-TTS-Cache')).toBe('hit');
    expect(getKey).toMatch(/^tts\/[0-9a-f]{64}\.mp3$/);
    const bytes = Array.from(new Uint8Array(await res.arrayBuffer()));
    expect(bytes).toEqual([1, 2, 3]);
    expect(aiCalls).toBe(0);
  });

  it('caches a miss in R2 so a second identical call does not re-invoke the model', async () => {
    const db = createMockD1([authHandler, premiumHandler]);
    let aiCalls = 0;
    const store = new Map<string, Uint8Array>();
    const bucket = {
      get: async (key: string) => {
        const bytes = store.get(key);
        return bytes ? { body: bytes } : null;
      },
      put: async (key: string, value: unknown) => {
        store.set(key, value as Uint8Array);
        return null;
      },
    };
    const ai = {
      run: async () => { aiCalls++; return new Uint8Array([9, 8, 7]); },
    };

    const first = await post(db, { text: 'Photosynthesis needs light.' }, { bucket, ai });
    expect(first.status).toBe(200);
    expect(first.headers.get('X-TTS-Cache')).toBe('miss');
    expect(Array.from(new Uint8Array(await first.arrayBuffer()))).toEqual([9, 8, 7]);
    expect(aiCalls).toBe(1);

    const second = await post(db, { text: 'Photosynthesis needs light.' }, { bucket, ai });
    expect(second.status).toBe(200);
    expect(second.headers.get('X-TTS-Cache')).toBe('hit');
    expect(aiCalls).toBe(1);
  });

  it('keys the cache by voice: a different voice misses while an invalid voice reuses the default', async () => {
    const db = createMockD1([authHandler, premiumHandler]);
    const keys: string[] = [];
    const bucket = {
      get: async (key: string) => { keys.push(key); return { body: new Uint8Array([1]) }; },
    };
    await post(db, { text: 'Same text.' }, { bucket });
    await post(db, { text: 'Same text.', voice: 'asteria' }, { bucket });
    await post(db, { text: 'Same text.', voice: 'not-a-voice' }, { bucket });
    expect(keys).toHaveLength(3);
    expect(keys[0]).not.toBe(keys[1]);
    expect(keys[0]).toBe(keys[2]);
  });

  it('fails closed with 502 ttsUnavailable when the AI binding is missing (miss path)', async () => {
    const db = createMockD1([authHandler, premiumHandler]);
    const bucket = { get: async () => null };
    const res = await post(db, { text: 'No AI binding here.' }, { bucket });
    expect(res.status).toBe(502);
    const body = (await res.json()) as { success: boolean; error: string; ttsUnavailable?: boolean };
    expect(body.success).toBe(false);
    expect(body.error).toBe('TTS unavailable');
    expect(body.ttsUnavailable).toBe(true);
  });
});
