import { describe, it, expect } from 'vitest';
import { sign } from 'hono/jwt';
import worker from '../index';
import { createMockD1, type MockHandler } from './helpers/mockD1';

const JWT_SECRET = 'test-secret-that-is-long-enough';

async function token(payload: object) {
  return sign(
    { ...payload, exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000) },
    JWT_SECRET,
  );
}

const authHandler: MockHandler = {
  match: /SELECT role, status, is_active FROM users/,
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

function post(db: unknown, body: object, bucket?: FakeBucket) {
  return token({ userId: 'user_1', role: 'student' }).then((t) =>
    worker.fetch(
      new Request('http://x/api/revision-classroom/tts', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
      // env.AI stays undefined: the miss path must fail closed (502), and the
      // hit path must never touch it.
      { DB: db as D1Database, JWT_SECRET, RECORDINGS_BUCKET: bucket as unknown as R2Bucket },
    ),
  );
}

describe('revision-classroom /tts premium gate', () => {
  it('rejects free users with 403 before any TTS work', async () => {
    const db = createMockD1([authHandler, freeHandler]);
    let bucketTouched = false;
    const bucket = {
      get: async () => { bucketTouched = true; return null; },
    };
    const res = await post(db, { text: 'Hello world' }, bucket);
    expect(res.status).toBe(403);
    const body = (await res.json()) as { success: boolean };
    expect(body.success).toBe(false);
    expect(bucketTouched).toBe(false);
  });
});

describe('revision-classroom /tts validation', () => {
  it('rejects text over 1500 chars with 400', async () => {
    const db = createMockD1([authHandler, premiumHandler]);
    const res = await post(db, { text: 'a'.repeat(1501) });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { success: boolean };
    expect(body.success).toBe(false);
  });

  it('rejects missing text with 400', async () => {
    const db = createMockD1([authHandler, premiumHandler]);
    const res = await post(db, {});
    expect(res.status).toBe(400);
  });
});

describe('revision-classroom /tts R2 cache', () => {
  it('serves a cache hit from R2 with X-TTS-Cache: hit and never calls env.AI', async () => {
    const db = createMockD1([authHandler, premiumHandler]);
    let getKey = '';
    const bucket = {
      get: async (key: string) => {
        getKey = key;
        return { body: new Uint8Array([1, 2, 3]) };
      },
    };
    const res = await post(db, { text: 'Magnets attract iron.' }, bucket);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('audio/mpeg');
    expect(res.headers.get('X-TTS-Cache')).toBe('hit');
    expect(getKey).toMatch(/^tts\/[0-9a-f]{64}\.mp3$/);
    const bytes = Array.from(new Uint8Array(await res.arrayBuffer()));
    expect(bytes).toEqual([1, 2, 3]);
  });

  it('fails closed with 502 ttsUnavailable when the AI binding is missing (miss path)', async () => {
    const db = createMockD1([authHandler, premiumHandler]);
    const bucket = { get: async () => null };
    const res = await post(db, { text: 'No AI binding here.' }, bucket);
    expect(res.status).toBe(502);
    const body = (await res.json()) as { success: boolean; error: string; ttsUnavailable?: boolean };
    expect(body.success).toBe(false);
    expect(body.error).toBe('TTS unavailable');
    expect(body.ttsUnavailable).toBe(true);
  });
});
