import { describe, it, expect } from 'vitest';
import { sign } from 'hono/jwt';
import worker from '../index';
import { createMockD1, type MockHandler } from './helpers/mockD1';

// Whiteboard Phase B Task 3: global per-topic content cache for
// POST /api/revision-classroom/lessons/:lessonId/whiteboard-teach.
// (Expectations updated for the Task 4 progressive protocol: outline
// requests return { outline, totalSteps, step, stepIndex: 0, ... }.)
//
// (a) cache hit -> 200 with cached:true, no AI call, no cache writes;
// (b) cache miss -> generates; in this harness env.AI is undefined so the
//     generators catch and return fallback outline/step
//     (fallback:true) -> 200 with fallback:true, cached:false;
// (c) fallback content is NEVER written to revision_ai_interactions, so a
//     second call still misses the cache;
// (d) progressive { outline, steps } cache rows are served as outline +
//     step 0;
// (e) corrupt/unparseable cache rows are treated as a miss;
// (f) the premium gate still runs before the cache lookup.

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
  match: /SELECT role, subscription_tier_id, subscription_expires_at, trial_expires_at\s*FROM users/,
  first: () => ({
    role: 'student',
    subscription_tier_id: 'tier_premium',
    subscription_expires_at: '2099-01-01T00:00:00.000Z',
    trial_expires_at: null,
  }),
};

const lessonHandler: MockHandler = {
  match: /FROM revision_lessons rl/,
  first: () => ({
    id: 'lesson_1',
    topic_id: 'topic_1',
    topic_name: 'Photosynthesis',
    subject_name: 'Integrated Science',
    exam_type: 'wassce',
    user_id: 'user_1',
  }),
};

const cacheMissHandler: MockHandler = {
  match: /FROM revision_ai_interactions rai/,
  first: () => null,
};

const cacheHitHandler = (content: unknown): MockHandler => ({
  match: /FROM revision_ai_interactions rai/,
  first: () => ({ id: 'wb_row_1', ai_message: JSON.stringify(content) }),
});

const writeHandler: MockHandler = {
  match: /INSERT INTO revision_ai_interactions|UPDATE revision_ai_interactions/,
};

const validStep = (n: number, duration: number) => ({
  stepNumber: n,
  explanation: `Step ${n}`,
  duration,
  commands: [
    {
      type: 'text',
      id: `t${n}`,
      props: { left: 100, top: 50, text: `Step ${n}`, fontSize: 24, fill: '#1e40af' },
    },
  ],
});

const cachedWholeLesson = {
  title: 'Photosynthesis Basics',
  topic: 'Photosynthesis',
  totalDuration: 10,
  canvasSize: { width: 1200, height: 800 },
  backgroundColor: '#ffffff',
  steps: [validStep(1, 10)],
  summary: 'Plants make food from light.',
};

async function teach(db: unknown) {
  const t = await token({ userId: 'user_1', role: 'student' });
  return worker.fetch(
    new Request('http://x/api/revision-classroom/lessons/lesson_1/whiteboard-teach', {
      method: 'POST',
      headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonType: 'step-by-step' }),
    }),
    { DB: db as D1Database, JWT_SECRET },
  );
}

const writeCalls = (db: { calls: { sql: string; binds: unknown[] }[] }) =>
  db.calls.filter((c) => /INSERT INTO revision_ai_interactions|UPDATE revision_ai_interactions/.test(c.sql));

const cacheLookups = (db: { calls: { sql: string; binds: unknown[] }[] }) =>
  db.calls.filter((c) => /FROM revision_ai_interactions rai/.test(c.sql));

describe('POST /lessons/:lessonId/whiteboard-teach content cache', () => {
  it('serves a legacy whole-lesson cache hit with cached:true and performs no writes', async () => {
    const db = createMockD1([
      authHandler,
      premiumHandler,
      lessonHandler,
      cacheHitHandler(cachedWholeLesson),
      writeHandler,
    ]);

    const res = await teach(db);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      success: boolean;
      data: {
        outline: string[];
        totalSteps: number;
        step: { commands: { id: string }[] };
        stepIndex: number;
        fallback: boolean;
        cached: boolean;
      };
    };
    expect(body.success).toBe(true);
    expect(body.data.cached).toBe(true);
    expect(body.data.fallback).toBe(false);
    expect(body.data.stepIndex).toBe(0);
    // Legacy rows carry no outline — titles are synthesized, and command ids
    // gain the per-step prefix on the way out.
    expect(body.data.outline).toEqual(['Step 1']);
    expect(body.data.totalSteps).toBe(1);
    expect(body.data.step.commands[0].id).toBe('s0-t1');

    // Cache hits are free: no interaction row is written.
    expect(writeCalls(db)).toHaveLength(0);

    // The lookup scoped to the lesson's topic and lesson type.
    const lookup = cacheLookups(db);
    expect(lookup).toHaveLength(1);
    expect(lookup[0].binds).toEqual(['topic_1', 'whiteboard_step-by-step']);
  });

  it('on miss generates content (fallback in this harness) and does NOT cache fallback', async () => {
    const db = createMockD1([
      authHandler,
      premiumHandler,
      lessonHandler,
      cacheMissHandler,
      writeHandler,
    ]);

    const res = await teach(db);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      success: boolean;
      data: { outline: string[]; fallback: boolean; cached: boolean };
    };
    expect(body.success).toBe(true);
    // env.AI is undefined in tests, so generation falls back.
    expect(body.data.fallback).toBe(true);
    expect(body.data.cached).toBe(false);
    expect(body.data.outline).toEqual(['Introduction', 'Core concepts', 'Worked example', 'Practice tips', 'Summary']);

    // Fallback content must never enter the cache.
    expect(writeCalls(db)).toHaveLength(0);
  });

  it('a second call after a fallback miss still misses the cache', async () => {
    const db = createMockD1([
      authHandler,
      premiumHandler,
      lessonHandler,
      cacheMissHandler,
      writeHandler,
    ]);

    const first = await teach(db);
    expect(first.status).toBe(200);
    const second = await teach(db);
    expect(second.status).toBe(200);
    const body = (await second.json()) as { data: { fallback: boolean; cached: boolean } };
    expect(body.data.fallback).toBe(true);
    expect(body.data.cached).toBe(false);

    // Both calls looked the cache up; neither wrote a fallback row.
    expect(cacheLookups(db)).toHaveLength(2);
    expect(writeCalls(db)).toHaveLength(0);
  });

  it('serves outline + step 0 from a progressive { outline, steps } cache row', async () => {
    const progressive = {
      outline: ['Intro', 'Details'],
      steps: [validStep(1, 5), validStep(2, 7)],
    };
    const db = createMockD1([
      authHandler,
      premiumHandler,
      lessonHandler,
      cacheHitHandler(progressive),
      writeHandler,
    ]);

    const res = await teach(db);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: {
        cached: boolean;
        outline: string[];
        totalSteps: number;
        step: unknown;
        stepIndex: number;
      };
    };
    expect(body.data.cached).toBe(true);
    // Progressive rows are served as stored (ids were prefixed at write time).
    expect(body.data.outline).toEqual(['Intro', 'Details']);
    expect(body.data.totalSteps).toBe(2);
    expect(body.data.stepIndex).toBe(0);
    expect(body.data.step).toEqual(validStep(1, 5));
    expect(writeCalls(db)).toHaveLength(0);
  });

  it('treats an unparseable cache row as a miss', async () => {
    const db = createMockD1([
      authHandler,
      premiumHandler,
      lessonHandler,
      { match: /FROM revision_ai_interactions rai/, first: () => ({ id: 'wb_row_1', ai_message: '{not json' }) },
      writeHandler,
    ]);

    const res = await teach(db);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { fallback: boolean; cached: boolean } };
    expect(body.data.cached).toBe(false);
    expect(body.data.fallback).toBe(true);
    expect(writeCalls(db)).toHaveLength(0);
  });

  it('rejects non-premium users before any cache lookup', async () => {
    const db = createMockD1([
      authHandler,
      {
        match: /SELECT role, subscription_tier_id, subscription_expires_at, trial_expires_at\s*FROM users/,
        first: () => ({
          role: 'student',
          subscription_tier_id: 'tier_free',
          subscription_expires_at: null,
          trial_expires_at: null,
        }),
      },
      lessonHandler,
      cacheHitHandler(cachedWholeLesson),
      writeHandler,
    ]);

    const res = await teach(db);
    expect(res.status).toBe(403);
    const body = (await res.json()) as { success: boolean; upgradeRequired: boolean };
    expect(body.success).toBe(false);
    expect(body.upgradeRequired).toBe(true);

    // The gate runs first: no cache lookup, no writes.
    expect(cacheLookups(db)).toHaveLength(0);
    expect(writeCalls(db)).toHaveLength(0);
  });
});
