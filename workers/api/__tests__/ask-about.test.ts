import { describe, it, expect } from 'vitest';
import { sign } from 'hono/jwt';
import worker from '../index';
import { createMockD1, type MockHandler } from './helpers/mockD1';

// Whiteboard Phase C Task 4: POST /api/revision-classroom/lessons/:lessonId/ask-about
// — point-and-ask: the student taps a spot on the whiteboard and the vision
// model answers about what is there.
//
// Covered here:
// (a) premium gate FIRST: free user -> 403 with upgradeRequired:true;
// (b) 413 when imageBase64 exceeds 700_000 chars; 400 when missing/not a string;
// (c) 400 when x/y are missing, not numbers, or non-finite; out-of-bounds
//     values are clamped, not rejected;
// (d) fallback path: no AI binding -> vision call throws -> 200 with
//     fallback:true and the honest "couldn't make out that spot" answer;
// (e) success path: a valid model response is returned with clamped
//     coordinates + annot- prefixed id, and the request uses the
//     spike-verified openai-image-url shape with guided_json;
// (f) invalid model output -> honest fallback payload (200, fallback:true).

const JWT_SECRET = 'test-secret-that-is-long-enough';

async function token(payload: object) {
  return sign(
    { ...payload, exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000) },
    JWT_SECRET,
  );
}

const authHandler: MockHandler = {
  match: /SELECT role, status, is_active, session_version FROM users/,
  first: () => ({ role: 'student', status: 'approved', is_active: 1, session_version: 0 }),
};

const premiumHandler: MockHandler = {
  match: /SELECT role, subscription_tier_id, subscription_expires_at, trial_expires_at\s*FROM users/,
  first: () => ({
    role: 'student',
    subscription_tier_id: 'tier_premium',
    subscription_expires_at: '2099-01-01T00:00:00.000Z',
    trial_expires_at: null,
  }),
};

const freeHandler: MockHandler = {
  match: /SELECT role, subscription_tier_id, subscription_expires_at, trial_expires_at\s*FROM users/,
  first: () => ({
    role: 'student',
    subscription_tier_id: 'tier_free',
    subscription_expires_at: null,
    trial_expires_at: null,
  }),
};

const lessonHandler: MockHandler = {
  match: /FROM revision_lessons rl/,
  first: () => ({
    id: 'lesson_1',
    topic_id: 'topic_1',
    topic_name: 'Linear Equations',
    subject_name: 'Core Mathematics',
    exam_type: 'wassce',
    user_id: 'user_1',
  }),
};

async function askAbout(db: unknown, body: object, ai?: unknown) {
  const t = await token({ userId: 'user_1', role: 'student' });
  return worker.fetch(
    new Request('http://x/api/revision-classroom/lessons/lesson_1/ask-about', {
      method: 'POST',
      headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
    { DB: db as D1Database, JWT_SECRET, ...(ai ? { AI: ai as Ai } : {}) },
  );
}

describe('ask-about endpoint', () => {
  it('rejects free users with 403 upgradeRequired before anything else', async () => {
    const db = createMockD1([authHandler, freeHandler, lessonHandler]);

    const res = await askAbout(db, { imageBase64: 'aW1hZ2U=', x: 100, y: 200 });
    expect(res.status).toBe(403);
    const body = (await res.json()) as { success: boolean; upgradeRequired?: boolean };
    expect(body.success).toBe(false);
    expect(body.upgradeRequired).toBe(true);

    // Gate runs first: no lesson lookup.
    expect(db.calls.filter((c) => /revision_lessons/.test(c.sql))).toHaveLength(0);
  });

  it('returns 413 for oversized imageBase64 and 400 for missing/invalid body', async () => {
    const db = createMockD1([authHandler, premiumHandler, lessonHandler]);

    const oversized = await askAbout(db, { imageBase64: 'x'.repeat(700_001), x: 1, y: 1 });
    expect(oversized.status).toBe(413);

    const missing = await askAbout(db, { x: 1, y: 1 });
    expect(missing.status).toBe(400);

    const wrongType = await askAbout(db, { imageBase64: 12345, x: 1, y: 1 });
    expect(wrongType.status).toBe(400);

    // Exactly at the limit passes validation (fails later at the vision call
    // -> honest fallback, since there is no AI binding here).
    const atLimit = await askAbout(db, { imageBase64: 'x'.repeat(700_000), x: 1, y: 1 });
    expect(atLimit.status).toBe(200);
  });

  it('returns 400 when x/y are missing, not numbers, or non-finite', async () => {
    const db = createMockD1([authHandler, premiumHandler, lessonHandler]);

    const missingX = await askAbout(db, { imageBase64: 'aW1hZ2U=', y: 100 });
    expect(missingX.status).toBe(400);

    const missingY = await askAbout(db, { imageBase64: 'aW1hZ2U=', x: 100 });
    expect(missingY.status).toBe(400);

    const stringX = await askAbout(db, { imageBase64: 'aW1hZ2U=', x: '100', y: 100 });
    expect(stringX.status).toBe(400);

    const nullY = await askAbout(db, { imageBase64: 'aW1hZ2U=', x: 100, y: null });
    expect(nullY.status).toBe(400);
  });

  it('returns the honest fallback payload (200, fallback:true) when the vision call fails', async () => {
    const db = createMockD1([authHandler, premiumHandler, lessonHandler]);

    const res = await askAbout(db, { imageBase64: 'aW1hZ2U=', x: 300, y: 200 });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      success: boolean;
      data: { answer: string; annotation: unknown; fallback: boolean };
    };
    expect(body.success).toBe(true);
    expect(body.data.fallback).toBe(true);
    expect(body.data.answer).toContain("couldn't make out that spot");
    expect(body.data.annotation).toBeNull();
  });

  it('answers via the vision model (spike contract), clamps coords, prefixes the annotation id', async () => {
    const image = 'dGFwLXNwb3Q=';
    let captured: { model: string; opts: Record<string, unknown> } | null = null;
    const mockAi = {
      run: async (model: string, opts: Record<string, unknown>) => {
        captured = { model, opts };
        return {
          response: JSON.stringify({
            answer: 'That is the equals sign — it means both sides have the same value.',
            annotation: {
              type: 'circle',
              id: 'tap-highlight',
              // left is out of bounds — must be clamped to 1200, not rejected.
              props: { left: 5000, top: 200, radius: 60, stroke: '#7c3aed' },
            },
          }),
        };
      },
    };
    const db = createMockD1([authHandler, premiumHandler, lessonHandler]);

    const res = await askAbout(db, { imageBase64: image, x: 300.6, y: 200.2 }, mockAi);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: {
        answer: string;
        annotation: { type: string; id: string; props: Record<string, unknown> } | null;
        fallback: boolean;
      };
    };
    expect(body.data.fallback).toBe(false);
    expect(body.data.answer).toContain('equals sign');
    expect(body.data.annotation).not.toBeNull();
    // Clamped, not rejected; id is server-prefixed for the transient layer.
    expect(body.data.annotation!.props.left).toBe(1200);
    expect(body.data.annotation!.id).toBe('annot-tap-highlight');

    // Spike contract: openai-image-url content parts + guided_json.
    expect(captured).not.toBeNull();
    const { model, opts } = captured!;
    expect(model).toBe('@cf/meta/llama-3.2-11b-vision-instruct');
    expect(opts.guided_json).toMatchObject({
      additionalProperties: false,
      properties: {
        answer: { minLength: 1, maxLength: 4000 },
        annotation: {
          additionalProperties: false,
          properties: {
            props: {
              additionalProperties: false,
              required: ['left', 'top', 'radius'],
            },
          },
        },
      },
    });
    const messages = opts.messages as { role: string; content: { type: string; text?: string; image_url?: { url: string } }[] }[];
    expect(messages).toHaveLength(1);
    expect(messages[0].role).toBe('user');
    expect(messages[0].content[0].type).toBe('text');
    expect(messages[0].content[1]).toEqual({
      type: 'image_url',
      image_url: { url: `data:image/png;base64,${image}` },
    });
    // Prompt carries the (rounded) tap point, the topic and the default question.
    const promptText = messages[0].content[0].text!;
    expect(promptText).toContain('(301, 200)');
    expect(promptText).toContain('Linear Equations');
    expect(promptText).toContain('what does this part mean?');
  });

  it('passes the student question through and clamps out-of-bounds taps instead of rejecting them', async () => {
    let capturedPrompt = '';
    const mockAi = {
      run: async (_model: string, opts: Record<string, unknown>) => {
        capturedPrompt = (opts.messages as { content: { text?: string }[] }[])[0].content[0].text!;
        return { response: JSON.stringify({ answer: 'It labels the y-axis.' }) };
      },
    };
    const db = createMockD1([authHandler, premiumHandler, lessonHandler]);

    const res = await askAbout(
      db,
      { imageBase64: 'aW1hZ2U=', x: -50, y: 9999, question: 'what is this label?' },
      mockAi,
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { answer: string; annotation: unknown; fallback: boolean } };
    expect(body.data.fallback).toBe(false);
    expect(body.data.annotation).toBeNull();
    expect(capturedPrompt).toContain('(0, 800)');
    expect(capturedPrompt).toContain('what is this label?');
  });

  it('retries one malformed annotation and returns a valid second answer', async () => {
    let aiCalls = 0;
    const retryAi = {
      run: async () => {
        aiCalls++;
        return {
          response: JSON.stringify(
            aiCalls === 1
              ? {
                  answer: 'Malformed first response',
                  annotation: {
                    type: 'circle',
                    id: 'bad',
                    props: { left: [10], top: 20, radius: 30 },
                  },
                }
              : { answer: 'That point marks the value on the number line.' },
          ),
        };
      },
    };
    const db = createMockD1([authHandler, premiumHandler, lessonHandler]);

    const res = await askAbout(
      db,
      { imageBase64: 'aW1hZ2U=', x: 100, y: 200 },
      retryAi,
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { answer: string; fallback: boolean } };
    expect(body.data.fallback).toBe(false);
    expect(body.data.answer).toContain('number line');
    expect(aiCalls).toBe(2);
  });
  it('keeps a validated answer after both optional annotations are malformed', async () => {
    let aiCalls = 0;
    const mockAi = {
      run: async () => {
        aiCalls++;
        return {
          response: JSON.stringify({
            answer: 'This step divides both sides by two.',
            annotation: {
              type: 'circle',
              id: 'bad-annotation',
              props: { left: 'not-a-number', top: 20, radius: 30 },
            },
          }),
        };
      },
    };
    const db = createMockD1([authHandler, premiumHandler, lessonHandler]);

    const res = await askAbout(
      db,
      { imageBase64: 'aW1hZ2U=', x: 100, y: 200 },
      mockAi,
    );
    const body = (await res.json()) as {
      data: { answer: string; annotation: unknown; fallback: boolean };
    };

    expect(aiCalls).toBe(2);
    expect(body.data.fallback).toBe(false);
    expect(body.data.answer).toContain('divides both sides');
    expect(body.data.annotation).toBeNull();
  });

  it('returns the honest fallback when the model output fails validation', async () => {
    const mockAi = {
      run: async () => ({ response: 'I cannot help with that.' }),
    };
    const db = createMockD1([authHandler, premiumHandler, lessonHandler]);

    const res = await askAbout(db, { imageBase64: 'aW1hZ2U=', x: 10, y: 10 }, mockAi);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { answer: string; fallback: boolean } };
    expect(body.data.fallback).toBe(true);
    expect(body.data.answer).toContain("couldn't make out that spot");
  });
});
