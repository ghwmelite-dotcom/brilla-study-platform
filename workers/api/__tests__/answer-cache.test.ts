import { describe, it, expect } from 'vitest';
import { sign } from 'hono/jwt';
import worker from '../index';
import { createMockD1, type MockHandler } from './helpers/mockD1';
import { embedQuestion, storeAnswer, normalizeQuestion } from '../answer-cache';

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

const lessonHandler: MockHandler = {
  match: /FROM revision_lessons rl/,
  first: () => ({
    id: 'lesson_1', session_id: 'session_1', topic_id: 'topic_1', subject_id: 'subj_1',
    topic_name: 'Algebra', subject_name: 'Mathematics', exam_type: 'nsmq', user_id: 'user_1',
  }),
};

// Free user with 5 of 10 daily interactions used → remaining 5.
const freeHandler: MockHandler = {
  match: /SELECT role, subscription_tier_id, subscription_expires_at, trial_expires_at\s+FROM users/,
  first: () => ({
    role: 'student', subscription_tier_id: 'tier_free',
    subscription_expires_at: null, trial_expires_at: null,
  }),
};

const countHandler = (count: number): MockHandler => ({
  match: /SELECT COUNT\(\*\) AS count FROM revision_ai_interactions/,
  first: () => ({ count }),
});

const cachedRowHandler = (topicId: string): MockHandler => ({
  match: /SELECT id, topic_id, answer_text FROM ai_answer_cache/,
  first: () => ({ id: 'cache_1', topic_id: topicId, answer_text: 'Cached answer text' }),
});

const cacheUpdateHandler: MockHandler = {
  match: /UPDATE ai_answer_cache SET hit_count/,
  run: () => ({ success: true, meta: { changes: 1 } }),
};

const interactionInsertHandler: MockHandler = {
  match: /INSERT INTO revision_ai_interactions/,
  run: () => ({ success: true, meta: { changes: 1 } }),
};

const cacheInsertHandler: MockHandler = {
  match: /INSERT INTO ai_answer_cache/,
  run: () => ({ success: true, meta: { changes: 1 } }),
};

interface AiCall { model: string; payload: Record<string, unknown> }

function makeAi(aiCalls: AiCall[], opts: { embedThrows?: boolean } = {}) {
  return {
    run: async (model: string, payload: Record<string, unknown>) => {
      aiCalls.push({ model, payload });
      if (payload.text) {
        if (opts.embedThrows) throw new Error('embedding model down');
        return { data: [[0.1, 0.2, 0.3]] };
      }
      return { response: 'Generated answer text' };
    },
  };
}

function makeIndex(matches: { id: string; score: number }[], upserts: unknown[] = []) {
  return {
    query: async (_vector: number[], _opts: unknown) => ({ matches }),
    upsert: async (rows: unknown) => {
      upserts.push(rows);
    },
  };
}

function ask(db: unknown, extraEnv: Record<string, unknown>) {
  return token({ userId: 'user_1', role: 'student' }).then((t) =>
    worker.fetch(
      new Request('http://x/api/revision-classroom/lessons/lesson_1/ask', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: 'What is photosynthesis?' }),
      }),
      { DB: db as D1Database, JWT_SECRET, ...extraEnv },
    ),
  );
}

describe('semantic answer cache — ask endpoint', () => {
  it('hit at/above threshold on same topic: cached:true, no AI generation, no interaction, allowance untouched', async () => {
    const db = createMockD1([authHandler, lessonHandler, freeHandler, countHandler(5), cachedRowHandler('topic_1'), cacheUpdateHandler]);
    const aiCalls: AiCall[] = [];
    const res = await ask(db, {
      AI: makeAi(aiCalls),
      ANSWERS_INDEX: makeIndex([{ id: 'cache_1', score: 0.95 }]),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      success: boolean;
      data: { answer: string; cached: boolean; remainingFreeToday: number };
    };
    expect(body.success).toBe(true);
    expect(body.data.cached).toBe(true);
    expect(body.data.answer).toBe('Cached answer text');
    // allowance NOT decremented: free user with 5 used keeps remaining 5
    expect(body.data.remainingFreeToday).toBe(5);
    // no AI generation call (embedding call is allowed, chat is not)
    expect(aiCalls.some((c) => c.payload.messages)).toBe(false);
    // no interaction row inserted
    expect(db.calls.some((c) => /INSERT INTO revision_ai_interactions/.test(c.sql))).toBe(false);
    // hit_count / last_hit_at update fired
    expect(db.calls.some((c) => /UPDATE ai_answer_cache SET hit_count/.test(c.sql))).toBe(true);
  });

  it('capped free user WITH a cache hit is served (owner decision 2026-08-13: cache hits bypass the daily cap)', async () => {
    const db = createMockD1([authHandler, lessonHandler, freeHandler, countHandler(10), cachedRowHandler('topic_1'), cacheUpdateHandler]);
    const aiCalls: AiCall[] = [];
    const res = await ask(db, {
      AI: makeAi(aiCalls),
      ANSWERS_INDEX: makeIndex([{ id: 'cache_1', score: 0.95 }]),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      success: boolean;
      data: { answer: string; cached: boolean; remainingFreeToday: number };
    };
    expect(body.success).toBe(true);
    expect(body.data.cached).toBe(true);
    expect(body.data.answer).toBe('Cached answer text');
    // allowance reported (0 remaining) but never incremented/decremented
    expect(body.data.remainingFreeToday).toBe(0);
    expect(aiCalls.some((c) => c.payload.messages)).toBe(false);
    expect(db.calls.some((c) => /INSERT INTO revision_ai_interactions/.test(c.sql))).toBe(false);
  });

  it('capped free user with a cache MISS still gets 403 aiLimitReached', async () => {
    // no ANSWERS_INDEX binding → lookupAnswer returns null → miss path → gate
    const db = createMockD1([authHandler, lessonHandler, freeHandler, countHandler(10)]);
    const aiCalls: AiCall[] = [];
    const res = await ask(db, { AI: makeAi(aiCalls) });
    expect(res.status).toBe(403);
    const body = (await res.json()) as { aiLimitReached?: boolean; remaining?: number };
    expect(body.aiLimitReached).toBe(true);
    expect(body.remaining).toBe(0);
    expect(aiCalls.some((c) => c.payload.messages)).toBe(false);
  });

  it('below-threshold match is a miss: generates, records interaction, stores answer', async () => {
    const db = createMockD1([
      authHandler, lessonHandler, freeHandler, countHandler(5),
      cachedRowHandler('topic_1'), cacheUpdateHandler,
      interactionInsertHandler, cacheInsertHandler,
    ]);
    const aiCalls: AiCall[] = [];
    const upserts: unknown[] = [];
    const res = await ask(db, {
      AI: makeAi(aiCalls),
      ANSWERS_INDEX: makeIndex([{ id: 'cache_1', score: 0.5 }], upserts),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { answer: string; cached: boolean; remainingFreeToday: number } };
    expect(body.data.cached).toBe(false);
    expect(body.data.answer).toBe('Generated answer text');
    // normal path decrements the displayed remaining count
    expect(body.data.remainingFreeToday).toBe(4);
    expect(aiCalls.some((c) => c.payload.messages)).toBe(true);
    expect(db.calls.some((c) => /INSERT INTO revision_ai_interactions/.test(c.sql))).toBe(true);
    // storeAnswer ran (via await fallback — no executionCtx in tests)
    expect(db.calls.some((c) => /INSERT INTO ai_answer_cache/.test(c.sql))).toBe(true);
    expect(upserts.length).toBe(1);
    // no hit recorded on a rejected match
    expect(db.calls.some((c) => /UPDATE ai_answer_cache SET hit_count/.test(c.sql))).toBe(false);
  });

  it('topic mismatch is rejected even at score 0.99', async () => {
    const db = createMockD1([
      authHandler, lessonHandler, freeHandler, countHandler(5),
      cachedRowHandler('other_topic'), cacheUpdateHandler,
      interactionInsertHandler, cacheInsertHandler,
    ]);
    const aiCalls: AiCall[] = [];
    const res = await ask(db, {
      AI: makeAi(aiCalls),
      ANSWERS_INDEX: makeIndex([{ id: 'cache_1', score: 0.99 }]),
    });
    const body = (await res.json()) as { data: { cached: boolean; answer: string } };
    expect(body.data.cached).toBe(false);
    expect(body.data.answer).toBe('Generated answer text');
    expect(aiCalls.some((c) => c.payload.messages)).toBe(true);
    expect(db.calls.some((c) => /UPDATE ai_answer_cache SET hit_count/.test(c.sql))).toBe(false);
  });

  it('cache failure (index query throws) never breaks ask', async () => {
    const db = createMockD1([
      authHandler, lessonHandler, freeHandler, countHandler(5),
      cachedRowHandler('topic_1'), cacheUpdateHandler,
      interactionInsertHandler, cacheInsertHandler,
    ]);
    const aiCalls: AiCall[] = [];
    const res = await ask(db, {
      AI: makeAi(aiCalls),
      ANSWERS_INDEX: {
        query: async () => {
          throw new Error('vectorize down');
        },
        upsert: async () => {},
      },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { cached: boolean } };
    expect(body.data.cached).toBe(false);
    expect(aiCalls.some((c) => c.payload.messages)).toBe(true);
  });
});

describe('answer-cache module', () => {
  it('storeAnswer swallows embedding failure (no row, no throw)', async () => {
    const db = createMockD1([cacheInsertHandler]);
    const env = {
      DB: db as unknown as D1Database,
      AI: { run: async () => { throw new Error('embedding model down'); } },
      ANSWERS_INDEX: makeIndex([]),
    };
    await expect(
      storeAnswer(env as never, 'topic_1', 'subj_1', 'nsmq', 'Q?', 'A', 'model'),
    ).resolves.toBeUndefined();
    expect(db.calls.some((c) => /INSERT INTO ai_answer_cache/.test(c.sql))).toBe(false);
  });

  it('embedQuestion handles the { shape, data } tensor form', async () => {
    const env = {
      AI: {
        run: async () => ({ data: { shape: [1, 3], data: [0.1, 0.2, 0.3] } }),
      },
    };
    await expect(embedQuestion(env as never, 'hello')).resolves.toEqual([0.1, 0.2, 0.3]);
  });

  it('embedQuestion returns null on a malformed response', async () => {
    const env = { AI: { run: async () => ({ unexpected: true }) } };
    await expect(embedQuestion(env as never, 'hello')).resolves.toBeNull();
  });

  it('normalizeQuestion lowercases, collapses whitespace, strips trailing punctuation', () => {
    expect(normalizeQuestion('  What is   PHOTOSYNTHESIS?! ')).toBe('what is photosynthesis');
  });
});
