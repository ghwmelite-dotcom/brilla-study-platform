import { describe, it, expect } from 'vitest';
import { sign } from 'hono/jwt';
import worker from '../index';
import { createMockD1, type MockHandler } from './helpers/mockD1';

// Whiteboard Phase B Task 4: progressive per-step protocol for
// POST /api/revision-classroom/lessons/:lessonId/whiteboard-teach.
// Extended in Phase C Task 6: the cold outline path is a FUSED call
// (max_tokens:1600) returning { outline, firstStep } in one round trip.
//
// Covered here:
// (a) outline request with no AI binding -> fallback outline (5 generic
//     titles) + fallback step 0, flagged fallback:true;
// (b) step request with no AI binding -> minimal valid fallback step whose
//     command ids carry the s{stepIndex}- prefix, flagged fallback:true;
// (c) stepIndex > 0 without a valid outline -> 400, no generation;
// (d) cache-hit step requests are served from the merged row without any AI
//     call and without touching the cache row;
// (e) a successful fused outline request upserts one progressive cache row
//     ({ outline, steps: [step0] }) with server-prefixed command ids, the
//     response contract is exactly
//     { outline, totalSteps, step, stepIndex: 0, fallback, cached }, and
//     exactly ONE AI call is made;
// (f) a successful step request merges the new step into the existing row
//     via UPDATE (never a second row);
// (g) fused partial failure (valid outline, broken firstStep) retries step 0
//     with the dedicated per-step call and still caches on success;
// (h) fused total failure (unparseable output) -> generic fallback outline +
//     fallback step, fallback:true, never cached.

const JWT_SECRET = 'test-secret-that-is-long-enough';

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

const cacheRowHandler = (row: unknown): MockHandler => ({
  match: /FROM revision_ai_interactions rai/,
  first: () => row,
});

const writeHandler: MockHandler = {
  match: /INSERT INTO revision_ai_interactions|UPDATE revision_ai_interactions/,
};

const OUTLINE = ['Introduction', 'Core concepts', 'Worked example', 'Practice tips', 'Summary'];

// Steps stored by the progressive protocol already carry s{n}- prefixed ids.
const storedStep = (n: number) => ({
  stepNumber: n + 1,
  explanation: `Cached step ${n + 1}`,
  duration: 5,
  commands: [
    {
      type: 'text',
      id: `s${n}-cached`,
      props: { left: 100, top: 50, text: `Cached ${n + 1}`, fontSize: 24, fill: '#1e40af' },
    },
  ],
});

// Freshly "generated" steps have raw ids — the server must prefix them.
const generatedStep = (n: number) => ({
  stepNumber: n + 1,
  explanation: `Generated step ${n + 1}`,
  voiceOver: `Voiceover ${n + 1}`,
  duration: 5,
  commands: [
    {
      type: 'text',
      id: `gen-${n}`,
      props: { left: 100, top: 50, text: `Generated ${n + 1}`, fontSize: 24, fill: '#1e40af' },
    },
  ],
  highlights: [`gen-${n}`],
  clearPrevious: false,
});

// Fused cold-path calls use max_tokens:1600 and return { outline, firstStep }
// together; per-step calls use 1200 and return one step object.
const mockAi = {
  run: async (_model: string, opts: { max_tokens?: number }) =>
    opts.max_tokens === 1600
      ? { response: JSON.stringify({ outline: OUTLINE, firstStep: generatedStep(1) }), usage: { total_tokens: 140 } }
      : { response: JSON.stringify(generatedStep(1)), usage: { total_tokens: 120 } },
};

async function teach(db: unknown, body: object, ai?: unknown) {
  const t = await token({ userId: 'user_1', role: 'student' });
  return worker.fetch(
    new Request('http://x/api/revision-classroom/lessons/lesson_1/whiteboard-teach', {
      method: 'POST',
      headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
    { DB: db as D1Database, JWT_SECRET, ...(ai ? { AI: ai as Ai } : {}) },
  );
}

const writeCalls = (db: { calls: { sql: string; binds: unknown[] }[] }) =>
  db.calls.filter((c) => /INSERT INTO revision_ai_interactions|UPDATE revision_ai_interactions/.test(c.sql));

describe('whiteboard-teach progressive protocol', () => {
  it('returns the fallback outline + fallback step 0 when AI is unavailable', async () => {
    const db = createMockD1([authHandler, premiumHandler, lessonHandler, cacheMissHandler, writeHandler]);

    const res = await teach(db, { lessonType: 'step-by-step' });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      success: boolean;
      data: {
        outline: string[];
        totalSteps: number;
        step: { commands: { id: string }[]; explanation: string; duration: number };
        stepIndex: number;
        fallback: boolean;
        cached: boolean;
      };
    };
    expect(body.success).toBe(true);
    expect(body.data.fallback).toBe(true);
    expect(body.data.cached).toBe(false);
    expect(body.data.outline).toEqual(['Introduction', 'Core concepts', 'Worked example', 'Practice tips', 'Summary']);
    expect(body.data.totalSteps).toBe(5);
    expect(body.data.stepIndex).toBe(0);
    expect(body.data.step.commands.length).toBeGreaterThan(0);
    for (const cmd of body.data.step.commands) {
      expect(cmd.id.startsWith('s0-')).toBe(true);
    }

    // Fallback content must never enter the cache.
    expect(writeCalls(db)).toHaveLength(0);
  });

  it('returns a minimal valid fallback step with s{n}- prefixed ids when step generation fails', async () => {
    const db = createMockD1([authHandler, premiumHandler, lessonHandler, cacheMissHandler, writeHandler]);

    const res = await teach(db, { lessonType: 'step-by-step', stepIndex: 2, outline: OUTLINE });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: {
        step: {
          stepNumber: number;
          explanation: string;
          duration: number;
          commands: { id: string; type: string; props: object }[];
        };
        stepIndex: number;
        totalSteps: number;
        fallback: boolean;
        cached: boolean;
      };
    };
    expect(body.data.fallback).toBe(true);
    expect(body.data.cached).toBe(false);
    expect(body.data.stepIndex).toBe(2);
    expect(body.data.totalSteps).toBe(OUTLINE.length);
    expect(typeof body.data.step.explanation).toBe('string');
    expect(typeof body.data.step.duration).toBe('number');
    expect(body.data.step.commands.length).toBeGreaterThan(0);
    for (const cmd of body.data.step.commands) {
      expect(cmd.id.startsWith('s2-')).toBe(true);
    }
    expect(writeCalls(db)).toHaveLength(0);
  });

  it('rejects stepIndex > 0 without an outline (400) before any generation', async () => {
    const db = createMockD1([authHandler, premiumHandler, lessonHandler, cacheMissHandler, writeHandler]);

    for (const body of [
      { lessonType: 'step-by-step', stepIndex: 1 },
      { lessonType: 'step-by-step', stepIndex: 1, outline: [] },
      { lessonType: 'step-by-step', stepIndex: 1, outline: ['ok', ''] },
      { lessonType: 'step-by-step', stepIndex: 5, outline: OUTLINE },
    ]) {
      const res = await teach(db, body);
      expect(res.status).toBe(400);
      const json = (await res.json()) as { success: boolean };
      expect(json.success).toBe(false);
    }

    // Validation runs before the cache lookup and any writes.
    expect(db.calls.filter((c) => /revision_ai_interactions/.test(c.sql))).toHaveLength(0);
  });

  it('serves a cached step without AI and without touching the cache row', async () => {
    const row = {
      id: 'wb_row_1',
      ai_message: JSON.stringify({ outline: OUTLINE, steps: [storedStep(0), storedStep(1)] }),
    };
    const db = createMockD1([authHandler, premiumHandler, lessonHandler, cacheRowHandler(row), writeHandler]);

    const res = await teach(db, { lessonType: 'step-by-step', stepIndex: 1, outline: OUTLINE });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: { step: ReturnType<typeof storedStep>; stepIndex: number; totalSteps: number; fallback: boolean; cached: boolean };
    };
    expect(body.data.cached).toBe(true);
    expect(body.data.fallback).toBe(false);
    expect(body.data.stepIndex).toBe(1);
    expect(body.data.totalSteps).toBe(OUTLINE.length);
    expect(body.data.step).toEqual(storedStep(1));
    expect(writeCalls(db)).toHaveLength(0);
  });

  it('serves outline + step 0 from a progressive cache row', async () => {
    const row = {
      id: 'wb_row_1',
      ai_message: JSON.stringify({ outline: OUTLINE, steps: [storedStep(0), storedStep(1)] }),
    };
    const db = createMockD1([authHandler, premiumHandler, lessonHandler, cacheRowHandler(row), writeHandler]);

    const res = await teach(db, { lessonType: 'step-by-step' });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: { outline: string[]; totalSteps: number; step: unknown; fallback: boolean; cached: boolean };
    };
    expect(body.data.cached).toBe(true);
    expect(body.data.outline).toEqual(OUTLINE);
    expect(body.data.totalSteps).toBe(OUTLINE.length);
    expect(body.data.step).toEqual(storedStep(0));
    expect(writeCalls(db)).toHaveLength(0);
  });

  it('upserts one progressive cache row after a successful outline request (ONE fused AI call)', async () => {
    let aiCalls = 0;
    const countingAi = {
      run: async (model: string, opts: { max_tokens?: number }) => {
        aiCalls++;
        return mockAi.run(model, opts);
      },
    };
    const db = createMockD1([authHandler, premiumHandler, lessonHandler, cacheMissHandler, writeHandler]);

    const res = await teach(db, { lessonType: 'step-by-step' }, countingAi);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: {
        outline: string[];
        step: { commands: { id: string }[]; highlights?: string[] };
        fallback: boolean;
        cached: boolean;
      };
    };
    // The fused cold path makes exactly one AI call (halved TTFS).
    expect(aiCalls).toBe(1);
    // Response contract unchanged: exactly these fields.
    expect(Object.keys(body.data).sort()).toEqual(
      ['cached', 'fallback', 'outline', 'step', 'stepIndex', 'totalSteps'].sort()
    );
    expect(body.data.fallback).toBe(false);
    expect(body.data.cached).toBe(false);
    expect(body.data.outline).toEqual(OUTLINE);
    // Generated ids are prefixed server-side before returning.
    expect(body.data.step.commands[0].id).toBe('s0-gen-1');
    expect(body.data.step.highlights).toEqual(['s0-gen-1']);

    const inserts = writeCalls(db).filter((c) => /INSERT/.test(c.sql));
    expect(inserts).toHaveLength(1);
    // (id, lesson_id, user_id, interaction_type, ai_message, tokens_used, created_at)
    expect(inserts[0].binds[1]).toBe('lesson_1');
    expect(inserts[0].binds[3]).toBe('whiteboard_step-by-step');
    const stored = JSON.parse(inserts[0].binds[4] as string) as {
      outline: string[];
      steps: { commands: { id: string }[] }[];
    };
    expect(stored.outline).toEqual(OUTLINE);
    expect(stored.steps).toHaveLength(1);
    expect(stored.steps[0].commands[0].id).toBe('s0-gen-1');
  });

  it('fused partial failure (valid outline, broken firstStep) retries step 0 with a second call and caches on success', async () => {
    let aiCalls = 0;
    const partialAi = {
      run: async (_model: string, opts: { max_tokens?: number }) => {
        aiCalls++;
        return opts.max_tokens === 1600
          ? { response: JSON.stringify({ outline: OUTLINE, firstStep: { broken: true } }), usage: { total_tokens: 140 } }
          : { response: JSON.stringify(generatedStep(1)), usage: { total_tokens: 120 } };
      },
    };
    const db = createMockD1([authHandler, premiumHandler, lessonHandler, cacheMissHandler, writeHandler]);

    const res = await teach(db, { lessonType: 'step-by-step' }, partialAi);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: { outline: string[]; step: { commands: { id: string }[] }; fallback: boolean; cached: boolean };
    };
    // Two calls: the fused one plus the dedicated step-0 retry.
    expect(aiCalls).toBe(2);
    expect(body.data.fallback).toBe(false);
    expect(body.data.cached).toBe(false);
    expect(body.data.outline).toEqual(OUTLINE);
    expect(body.data.step.commands[0].id).toBe('s0-gen-1');

    // Fully generated (outline from call 1, step from call 2) -> cached.
    const inserts = writeCalls(db).filter((c) => /INSERT/.test(c.sql));
    expect(inserts).toHaveLength(1);
    const stored = JSON.parse(inserts[0].binds[4] as string) as { outline: string[] };
    expect(stored.outline).toEqual(OUTLINE);
  });

  it('fused total failure (unparseable output) falls back generically and is never cached', async () => {
    const garbageAi = {
      run: async () => ({ response: 'Sorry, I cannot plan that lesson.' }),
    };
    const db = createMockD1([authHandler, premiumHandler, lessonHandler, cacheMissHandler, writeHandler]);

    const res = await teach(db, { lessonType: 'step-by-step' }, garbageAi);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: { outline: string[]; step: { commands: { id: string }[] }; fallback: boolean; cached: boolean };
    };
    expect(body.data.fallback).toBe(true);
    expect(body.data.cached).toBe(false);
    expect(body.data.outline).toEqual(['Introduction', 'Core concepts', 'Worked example', 'Practice tips', 'Summary']);
    for (const cmd of body.data.step.commands) {
      expect(cmd.id.startsWith('s0-')).toBe(true);
    }
    expect(writeCalls(db)).toHaveLength(0);
  });

  it('accepts an already-parsed JSON response from the AI binding (live llama fp8-fast behavior)', async () => {
    // Live finding (Phase B verification): when the model output is bare valid
    // JSON, the Workers AI binding returns `response` as parsed JSON, not a
    // string. Outline and step generation must handle both shapes.
    const parsedJsonAi = {
      run: async (_model: string, opts: { max_tokens?: number }) =>
        opts.max_tokens === 1600
          ? { response: { outline: [...OUTLINE], firstStep: generatedStep(1) }, usage: { total_tokens: 140 } }
          : { response: generatedStep(1), usage: { total_tokens: 120 } },
    };
    const db = createMockD1([authHandler, premiumHandler, lessonHandler, cacheMissHandler, writeHandler]);

    const res = await teach(db, { lessonType: 'step-by-step' }, parsedJsonAi);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: { outline: string[]; fallback: boolean; cached: boolean; step: { commands: { id: string }[] } };
    };
    expect(body.data.fallback).toBe(false);
    expect(body.data.cached).toBe(false);
    expect(body.data.outline).toEqual(OUTLINE);
    expect(body.data.step.commands[0].id).toBe('s0-gen-1');
    expect(writeCalls(db).filter((c) => /INSERT/.test(c.sql))).toHaveLength(1);
  });

  it('merges a newly generated step into the existing cache row via UPDATE', async () => {
    const row = {
      id: 'wb_row_1',
      ai_message: JSON.stringify({ outline: OUTLINE, steps: [storedStep(0)] }),
    };
    const db = createMockD1([authHandler, premiumHandler, lessonHandler, cacheRowHandler(row), writeHandler]);

    const res = await teach(db, { lessonType: 'step-by-step', stepIndex: 1, outline: OUTLINE }, mockAi);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { fallback: boolean; cached: boolean; step: { commands: { id: string }[] } } };
    expect(body.data.fallback).toBe(false);
    expect(body.data.cached).toBe(false);
    expect(body.data.step.commands[0].id).toBe('s1-gen-1');

    const writes = writeCalls(db);
    const updates = writes.filter((c) => /UPDATE/.test(c.sql));
    const inserts = writes.filter((c) => /INSERT/.test(c.sql));
    expect(updates).toHaveLength(1);
    expect(inserts).toHaveLength(0);
    // UPDATE ... SET ai_message = ?, tokens_used = ? WHERE id = ?
    expect(updates[0].binds[2]).toBe('wb_row_1');
    const stored = JSON.parse(updates[0].binds[0] as string) as {
      outline: string[];
      steps: ({ commands: { id: string }[] } | null)[];
    };
    expect(stored.outline).toEqual(OUTLINE);
    expect(stored.steps).toHaveLength(2);
    expect(stored.steps[0]?.commands[0].id).toBe('s0-cached');
    expect(stored.steps[1]?.commands[0].id).toBe('s1-gen-1');
  });
});
