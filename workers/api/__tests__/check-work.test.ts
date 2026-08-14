import { describe, it, expect } from 'vitest';
import { sign } from 'hono/jwt';
import { createHash } from 'node:crypto';
import worker from '../index';
import { createMockD1, type MockHandler } from './helpers/mockD1';

// Whiteboard Phase C Task 3: POST /api/revision-classroom/lessons/:lessonId/check-work
// — vision grading of the student's ink snapshot with spatial annotations.
//
// Covered here:
// (a) premium gate FIRST: free user -> 403 with upgradeRequired:true;
// (b) 413 when imageBase64 exceeds 700_000 chars; 400 when missing/not a string;
// (c) fallback path: no AI binding -> vision call throws -> 200 with
//     fallback:true, verdict 'unknown', no fabricated verdict;
// (d) correct-verdict cache: a seeded checkwork_correct row whose user_response
//     is the sha-256 hex of the image string is served with cached:true and no
//     AI call (env.AI absent — a call would throw and flip fallback on);
// (e) success path: a valid model response is returned with clamped
//     coordinates + annot- prefixed ids, the request uses the spike-verified
//     openai-image-url shape with guided_json, and the correct verdict is
//     cached (INSERT with user_response = image hash);
// (f) non-correct verdicts are never cached (no INSERT);
// (g) invalid model output -> honest fallback payload (200, fallback:true).

const JWT_SECRET = 'test-secret-that-is-long-enough';

const sha256Hex = (s: string) => createHash('sha256').update(s).digest('hex');

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

// Correct-verdict cache lookup (plain table, no join).
const checkworkCacheHandler = (row: unknown): MockHandler => ({
  match: /FROM revision_ai_interactions\s+WHERE lesson_id/,
  first: () => row,
});

// Progressive whiteboard row used for step context (joined via topic).
const whiteboardRowHandler = (row: unknown): MockHandler => ({
  match: /FROM revision_ai_interactions rai/,
  first: () => row,
});

const writeHandler: MockHandler = {
  match: /INSERT INTO revision_ai_interactions|UPDATE revision_ai_interactions/,
};

async function checkWork(db: unknown, body: object, ai?: unknown) {
  const t = await token({ userId: 'user_1', role: 'student' });
  return worker.fetch(
    new Request('http://x/api/revision-classroom/lessons/lesson_1/check-work', {
      method: 'POST',
      headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
    { DB: db as D1Database, JWT_SECRET, ...(ai ? { AI: ai as Ai } : {}) },
  );
}

const writeCalls = (db: { calls: { sql: string; binds: unknown[] }[] }) =>
  db.calls.filter((c) => /INSERT INTO revision_ai_interactions|UPDATE revision_ai_interactions/.test(c.sql));

const OUTLINE = ['Introduction', 'Core concepts', 'Worked example', 'Practice tips', 'Summary'];
const storedStep = (n: number) => ({
  stepNumber: n + 1,
  explanation: `Cached step ${n + 1} explanation`,
  duration: 5,
  commands: [
    {
      type: 'text',
      id: `s${n}-cached`,
      props: { left: 100, top: 50, text: `Cached ${n + 1}`, fontSize: 24, fill: '#1e40af' },
    },
  ],
});

describe('check-work endpoint', () => {
  it('rejects free users with 403 upgradeRequired before anything else', async () => {
    const db = createMockD1([authHandler, freeHandler, lessonHandler, checkworkCacheHandler(null), whiteboardRowHandler(null), writeHandler]);

    const res = await checkWork(db, { imageBase64: 'aW1hZ2U=', stepIndex: 0 });
    expect(res.status).toBe(403);
    const body = (await res.json()) as { success: boolean; upgradeRequired?: boolean };
    expect(body.success).toBe(false);
    expect(body.upgradeRequired).toBe(true);

    // Gate runs first: no lesson lookup, no cache lookup, no writes.
    expect(db.calls.filter((c) => /revision_lessons|revision_ai_interactions/.test(c.sql))).toHaveLength(0);
  });

  it('returns 413 for oversized imageBase64 and 400 for missing/invalid body', async () => {
    const db = createMockD1([authHandler, premiumHandler, lessonHandler, checkworkCacheHandler(null), whiteboardRowHandler(null), writeHandler]);

    const oversized = await checkWork(db, { imageBase64: 'x'.repeat(700_001) });
    expect(oversized.status).toBe(413);

    const missing = await checkWork(db, {});
    expect(missing.status).toBe(400);

    const wrongType = await checkWork(db, { imageBase64: 12345 });
    expect(wrongType.status).toBe(400);

    // Exactly at the limit passes validation (fails later at the vision call
    // -> honest fallback, since there is no AI binding here).
    const atLimit = await checkWork(db, { imageBase64: 'x'.repeat(700_000) });
    expect(atLimit.status).toBe(200);
  });

  it('returns the honest fallback payload (200, fallback:true, verdict unknown) when the vision call fails', async () => {
    const db = createMockD1([authHandler, premiumHandler, lessonHandler, checkworkCacheHandler(null), whiteboardRowHandler(null), writeHandler]);

    const res = await checkWork(db, { imageBase64: 'aW1hZ2U=', stepIndex: 0 });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      success: boolean;
      data: { verdict: string; explanation: string; voiceOver: string; annotations: unknown[]; cached: boolean; fallback: boolean };
    };
    expect(body.success).toBe(true);
    expect(body.data.fallback).toBe(true);
    expect(body.data.cached).toBe(false);
    expect(body.data.verdict).toBe('unknown');
    expect(body.data.explanation).toContain("couldn't read the work clearly");
    expect(body.data.voiceOver).toBe('');
    expect(body.data.annotations).toEqual([]);
    // Failures are never cached.
    expect(writeCalls(db)).toHaveLength(0);
  });

  it('serves a seeded checkwork_correct row from cache (cached:true) with no AI call', async () => {
    const image = 'Y2FjaGVkLXdvcms=';
    const seededPayload = {
      verdict: 'correct',
      explanation: 'Perfect working — every line follows.',
      voiceOver: 'Great job, that is exactly right.',
      annotations: [
        { type: 'circle', id: 'annot-a1', props: { left: 300, top: 200, radius: 40, stroke: '#16a34a' } },
      ],
    };
    const row = { ai_message: JSON.stringify(seededPayload) };
    const cacheHandler: MockHandler = {
      match: /FROM revision_ai_interactions\s+WHERE lesson_id/,
      // Binds: (lesson_id, user_response=image hash) — the interaction_type
      // is a SQL literal, not a bound parameter.
      first: (binds) => (binds[1] === sha256Hex(image) ? row : null),
    };
    const db = createMockD1([authHandler, premiumHandler, lessonHandler, cacheHandler, whiteboardRowHandler(null), writeHandler]);

    // No AI binding: any vision call would throw and flip fallback on.
    const res = await checkWork(db, { imageBase64: image, stepIndex: 1 });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: { verdict: string; explanation: string; annotations: unknown[]; cached: boolean; fallback: boolean };
    };
    expect(body.data.cached).toBe(true);
    expect(body.data.fallback).toBe(false);
    expect(body.data.verdict).toBe('correct');
    expect(body.data.explanation).toBe(seededPayload.explanation);
    expect(body.data.annotations).toEqual(seededPayload.annotations);
    expect(writeCalls(db)).toHaveLength(0);
  });

  it('grades via the vision model (spike contract), clamps coords, prefixes ids, caches correct verdicts', async () => {
    const image = 'c3R1ZGVudC13b3Jr';
    let captured: { model: string; opts: Record<string, unknown> } | null = null;
    const mockAi = {
      run: async (model: string, opts: Record<string, unknown>) => {
        captured = { model, opts };
        return {
          response: JSON.stringify({
            verdict: 'correct',
            explanation: 'Beautiful work — x = 3 is exactly right.',
            voiceOver: 'Lovely working, well done.',
            annotations: [
              // left is out of bounds — must be clamped to 1200, not rejected.
              { type: 'circle', id: 'a1', props: { left: 5000, top: 200, radius: 40, stroke: '#16a34a' } },
              { type: 'text', id: 'a2', props: { left: 320, top: 160, text: 'Correct!', fontSize: 20, fill: '#16a34a' } },
            ],
          }),
        };
      },
    };
    const wbRow = { id: 'wb_row_1', ai_message: JSON.stringify({ outline: OUTLINE, steps: [storedStep(0)] }) };
    const db = createMockD1([
      authHandler,
      premiumHandler,
      lessonHandler,
      checkworkCacheHandler(null),
      whiteboardRowHandler(wbRow),
      writeHandler,
    ]);

    const res = await checkWork(db, { imageBase64: image, stepIndex: 0 }, mockAi);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: {
        verdict: string;
        explanation: string;
        voiceOver: string;
        annotations: { type: string; id: string; props: Record<string, unknown> }[];
        cached: boolean;
        fallback: boolean;
      };
    };
    expect(body.data.fallback).toBe(false);
    expect(body.data.cached).toBe(false);
    expect(body.data.verdict).toBe('correct');
    expect(body.data.annotations).toHaveLength(2);
    // Clamped, not rejected.
    expect(body.data.annotations[0].props.left).toBe(1200);
    // Ids are server-prefixed for the transient annotation layer.
    expect(body.data.annotations[0].id).toBe('annot-a1');
    expect(body.data.annotations[1].id).toBe('annot-a2');

    // Spike contract: openai-image-url content parts + guided_json + max_tokens 1200.
    expect(captured).not.toBeNull();
    const { model, opts } = captured!;
    expect(model).toBe('@cf/meta/llama-4-scout-17b-16e-instruct');
    expect(opts.max_tokens).toBe(1200);
    expect(opts.guided_json).toBeTruthy();
    const messages = opts.messages as { role: string; content: { type: string; text?: string; image_url?: { url: string } }[] }[];
    expect(messages).toHaveLength(1);
    expect(messages[0].role).toBe('user');
    expect(messages[0].content[0].type).toBe('text');
    expect(messages[0].content[1]).toEqual({
      type: 'image_url',
      image_url: { url: `data:image/png;base64,${image}` },
    });
    // Prompt demands verbatim reading and carries the step context.
    const promptText = messages[0].content[0].text!;
    expect(promptText).toContain('verbatim');
    expect(promptText).toContain('Cached step 1 explanation');
    expect(promptText).toContain('Linear Equations');

    // Correct verdict cached: INSERT with user_response = image hash.
    const inserts = writeCalls(db).filter((c) => /INSERT/.test(c.sql));
    expect(inserts).toHaveLength(1);
    expect(inserts[0].binds[1]).toBe('lesson_1');
    expect(inserts[0].binds[3]).toBe('checkwork_correct');
    const storedPayload = JSON.parse(inserts[0].binds[4] as string) as { verdict: string };
    expect(storedPayload.verdict).toBe('correct');
    expect(inserts[0].binds[5]).toBe(sha256Hex(image));
  });

  it('never caches partial or incorrect verdicts', async () => {
    const mockAi = {
      run: async () => ({
        response: JSON.stringify({
          verdict: 'incorrect',
          explanation: 'Line 3 should give x = 3, not x = 4.',
          voiceOver: 'Check your subtraction on the last line.',
          annotations: [
            { type: 'arrow', id: 'a1', props: { x1: 500, y1: 500, x2: 400, y2: 420, stroke: '#dc2626' } },
          ],
        }),
      }),
    };
    const db = createMockD1([authHandler, premiumHandler, lessonHandler, checkworkCacheHandler(null), whiteboardRowHandler(null), writeHandler]);

    const res = await checkWork(db, { imageBase64: 'd3Jvbmctd29yaw==' }, mockAi);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { verdict: string; fallback: boolean; cached: boolean } };
    expect(body.data.verdict).toBe('incorrect');
    expect(body.data.fallback).toBe(false);
    expect(body.data.cached).toBe(false);
    expect(writeCalls(db)).toHaveLength(0);
  });

  it('returns the honest fallback when the model output fails validation', async () => {
    const mockAi = {
      run: async () => ({ response: 'I cannot help with that.' }),
    };
    const db = createMockD1([authHandler, premiumHandler, lessonHandler, checkworkCacheHandler(null), whiteboardRowHandler(null), writeHandler]);

    const res = await checkWork(db, { imageBase64: 'aW1hZ2U=' }, mockAi);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { verdict: string; fallback: boolean; explanation: string } };
    expect(body.data.fallback).toBe(true);
    expect(body.data.verdict).toBe('unknown');
    expect(body.data.explanation).toContain("couldn't read the work clearly");
    expect(writeCalls(db)).toHaveLength(0);
  });

  // Task 5: photos of paper work declare their own pixel dims; the prompt
  // must name them and annotations clamp to them, not to 1200x800.
  it('photo path: prompt carries the declared dims and annotations clamp to them', async () => {
    let capturedPrompt = '';
    const mockAi = {
      run: async (_model: string, opts: Record<string, unknown>) => {
        capturedPrompt = (opts.messages as { content: { text?: string }[] }[])[0].content[0].text!;
        return {
          response: JSON.stringify({
            verdict: 'partial',
            explanation: 'Good start — check the last line.',
            voiceOver: 'Almost, look at the last line.',
            annotations: [
              // Both coords out of bounds — clamped to the PHOTO dims.
              { type: 'circle', id: 'a1', props: { left: 5000, top: 5000, radius: 40, stroke: '#dc2626' } },
            ],
          }),
        };
      },
    };
    const db = createMockD1([authHandler, premiumHandler, lessonHandler, checkworkCacheHandler(null), whiteboardRowHandler(null), writeHandler]);

    const res = await checkWork(
      db,
      { imageBase64: 'cGhvdG8td29yaw==', stepIndex: 0, imageWidth: 1000, imageHeight: 1400 },
      mockAi,
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: { verdict: string; fallback: boolean; annotations: { props: Record<string, unknown> }[] };
    };
    expect(body.data.fallback).toBe(false);
    expect(body.data.verdict).toBe('partial');
    expect(body.data.annotations[0].props.left).toBe(1000);
    expect(body.data.annotations[0].props.top).toBe(1400);
    expect(capturedPrompt).toContain('1000x1400 px photo');
    expect(capturedPrompt).toContain('The image is 1000x1400 px — annotate in that coordinate space.');
  });

  it('returns 400 for out-of-range or non-integer image dimensions', async () => {
    const db = createMockD1([authHandler, premiumHandler, lessonHandler, checkworkCacheHandler(null), whiteboardRowHandler(null), writeHandler]);

    const tooSmall = await checkWork(db, { imageBase64: 'aW1hZ2U=', imageWidth: 50 });
    expect(tooSmall.status).toBe(400);

    const tooBig = await checkWork(db, { imageBase64: 'aW1hZ2U=', imageHeight: 2001 });
    expect(tooBig.status).toBe(400);

    const wrongType = await checkWork(db, { imageBase64: 'aW1hZ2U=', imageWidth: '1000' });
    expect(wrongType.status).toBe(400);

    const nonInteger = await checkWork(db, { imageBase64: 'aW1hZ2U=', imageWidth: 1000.5 });
    expect(nonInteger.status).toBe(400);

    // Bounds run before the lesson lookup.
    expect(db.calls.filter((c) => /revision_lessons/.test(c.sql))).toHaveLength(0);
  });

  // Regression (live probe): a failing cache lookup must degrade to a fresh
  // grading attempt, never a 500. mockD1 throws on bind() when no handler
  // matches the cache SELECT — standing in for a D1 error.
  it('degrades to fresh grading (never 500) when the cache lookup throws', async () => {
    const mockAi = {
      run: async () => ({
        response: JSON.stringify({
          verdict: 'partial',
          explanation: 'Good start — check the last line.',
          voiceOver: 'Almost there.',
          annotations: [],
        }),
      }),
    };
    // No checkworkCacheHandler: the cache SELECT throws inside bind().
    const db = createMockD1([authHandler, premiumHandler, lessonHandler, whiteboardRowHandler(null), writeHandler]);

    const res = await checkWork(db, { imageBase64: 'aW1hZ2U=', stepIndex: 0 }, mockAi);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { verdict: string; fallback: boolean; cached: boolean } };
    expect(body.data.verdict).toBe('partial');
    expect(body.data.fallback).toBe(false);
    expect(body.data.cached).toBe(false);
  });

  it('serves the honest fallback (never 500) when the cache lookup throws and no AI is bound', async () => {
    const db = createMockD1([authHandler, premiumHandler, lessonHandler, whiteboardRowHandler(null), writeHandler]);

    const res = await checkWork(db, { imageBase64: 'aW1hZ2U=', stepIndex: 0 });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { verdict: string; fallback: boolean } };
    expect(body.data.fallback).toBe(true);
    expect(body.data.verdict).toBe('unknown');
  });
});
