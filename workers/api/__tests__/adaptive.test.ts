import { describe, it, expect } from 'vitest';
import { sign } from 'hono/jwt';
import {
  adaptiveApp,
  computeTopicWeights,
  selectAdaptiveQuestions,
  weightedSample,
  ADAPTIVE_BASE_WEIGHT,
} from '../adaptive';
import { createMockD1, type MockHandler } from './helpers/mockD1';

const JWT_SECRET = 'adaptive-test-secret-that-is-long-enough';
const USER_ID = 'student_adaptive';
const SUBJECT_ID = 'sub_1';

const authHandler: MockHandler = {
  match: /SELECT role, status, is_active, session_version FROM users WHERE id = \?/,
  first: () => ({ role: 'student', status: 'approved', is_active: 1, session_version: 0 }),
};

const subjectHandler: MockHandler = {
  match: /SELECT id FROM subjects WHERE id = \? AND is_active = 1/,
  first: () => ({ id: SUBJECT_ID }),
};

const masteryHandler = (rows: unknown[]): MockHandler => ({
  match: /FROM topic_mastery/,
  all: () => ({ results: rows }),
});

const questionPoolHandler = (rows: unknown[]): MockHandler => ({
  match: /FROM questions q/,
  all: () => ({ results: rows }),
});

function questionRow(topicId: string, n: number): Record<string, unknown> {
  return {
    id: `q_${topicId}_${n}`,
    topic_id: topicId,
    subject_id: SUBJECT_ID,
    question_text: `Question ${n} for ${topicId}`,
    question_type: 'multiple_choice',
    round_type: 'practice',
    options: JSON.stringify(['A. 2', 'B. 3', 'C. 4', 'D. 10']),
    correct_answer: 'B',
    explanation: 'Because maths',
    difficulty: 'medium',
    points: 1,
    marks: 1,
    time_limit: 60,
    image_url: null,
  };
}

function poolFor(topics: string[], perTopic: number): Record<string, unknown>[] {
  return topics.flatMap((topicId) =>
    Array.from({ length: perTopic }, (_, i) => questionRow(topicId, i)),
  );
}

async function authToken(userId = USER_ID) {
  const now = Math.floor(Date.now() / 1000);
  return sign({ userId, role: 'student', sessionVersion: 0, iat: now, exp: now + 3600 }, JWT_SECRET);
}

function authedReq(path: string, token: string | null) {
  return new Request(`http://x${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

const env = (db: unknown) => ({ DB: db as D1Database, JWT_SECRET });

describe('adaptive router auth', () => {
  it('returns 401 without a bearer token', async () => {
    const db = createMockD1([authHandler]);
    const res = await adaptiveApp.fetch(
      authedReq(`/practice-set?subjectId=${SUBJECT_ID}&count=5`, null),
      env(db),
    );
    expect(res.status).toBe(401);
  });

  it('returns 401 for focus-areas without a bearer token', async () => {
    const db = createMockD1([authHandler]);
    const res = await adaptiveApp.fetch(
      authedReq(`/focus-areas?subjectId=${SUBJECT_ID}`, null),
      env(db),
    );
    expect(res.status).toBe(401);
  });
});

describe('practice-set validation', () => {
  it('rejects a missing subjectId', async () => {
    const db = createMockD1([authHandler]);
    const res = await adaptiveApp.fetch(authedReq('/practice-set?count=5', await authToken()), env(db));
    expect(res.status).toBe(400);
  });

  it('returns 404 for an unknown subject', async () => {
    const db = createMockD1([
      authHandler,
      { match: /SELECT id FROM subjects WHERE id = \? AND is_active = 1/, first: () => null },
    ]);
    const res = await adaptiveApp.fetch(
      authedReq(`/practice-set?subjectId=${SUBJECT_ID}&count=5`, await authToken()),
      env(db),
    );
    expect(res.status).toBe(404);
  });
});

describe('practice-set cold start', () => {
  it('falls back to the plain random draw when the user has no mastery rows', async () => {
    const questions = poolFor(['topic_a'], 3);
    const db = createMockD1([
      authHandler,
      subjectHandler,
      masteryHandler([]),
      questionPoolHandler(questions),
    ]);
    const res = await adaptiveApp.fetch(
      authedReq(`/practice-set?subjectId=${SUBJECT_ID}&count=3`, await authToken()),
      env(db),
    );
    expect(res.status).toBe(200);
    const body = await res.json() as {
      success: boolean;
      data: { questions: Record<string, unknown>[]; focusAreas: unknown[]; adaptive: boolean };
    };
    expect(body.success).toBe(true);
    expect(body.data.adaptive).toBe(false);
    expect(body.data.focusAreas).toEqual([]);
    expect(body.data.questions).toHaveLength(3);

    // The cold-start draw must be today's draw: RANDOM() ordered, LIMIT = count
    // (not the widened adaptive pool limit).
    const poolCall = db.calls.find(({ sql }) => /FROM questions q/.test(sql));
    expect(poolCall).toBeDefined();
    expect(poolCall!.sql).toContain('ORDER BY RANDOM() LIMIT ?');
    expect(poolCall!.binds).toEqual([SUBJECT_ID, 3]);
  });

  it('never leaks correct answers or explanations', async () => {
    const questions = poolFor(['topic_a'], 2);
    const db = createMockD1([
      authHandler,
      subjectHandler,
      masteryHandler([]),
      questionPoolHandler(questions),
    ]);
    const res = await adaptiveApp.fetch(
      authedReq(`/practice-set?subjectId=${SUBJECT_ID}&count=2`, await authToken()),
      env(db),
    );
    const body = await res.json() as {
      data: { questions: Array<Record<string, unknown> & { options: Array<Record<string, unknown>> }> };
    };
    for (const question of body.data.questions) {
      expect(question).not.toHaveProperty('correct_answer');
      expect(question).not.toHaveProperty('explanation');
      for (const option of question.options) {
        expect(option).not.toHaveProperty('isCorrect');
        expect(Object.keys(option).sort()).toEqual(['id', 'text']);
      }
    }
  });
});

describe('selectAdaptiveQuestions weighting', () => {
  it('overrepresents weak topics across draws', async () => {
    const topics = ['topic_weak', 'topic_b', 'topic_c', 'topic_d', 'topic_e'];
    const pool = poolFor(topics, 10);
    const masteryRows = [
      { topic_id: 'topic_weak', mastery_level: 5, next_revision_due: null, topic_name: 'Weak' },
      ...topics.slice(1).map((topicId) => ({
        topic_id: topicId,
        mastery_level: 95,
        next_revision_due: null,
        topic_name: topicId,
      })),
    ];
    const db = createMockD1([masteryHandler(masteryRows), questionPoolHandler(pool)]);

    const draws = 200;
    let weakPicks = 0;
    let totalPicks = 0;
    for (let i = 0; i < draws; i++) {
      const { questions, adaptive } = await selectAdaptiveQuestions(db as never, {
        userId: USER_ID,
        subjectId: SUBJECT_ID,
        count: 5,
      });
      expect(adaptive).toBe(true);
      weakPicks += questions.filter((q) => q.topic_id === 'topic_weak').length;
      totalPicks += questions.length;
    }

    // Uniform random would give ~20%; weighting expects ~48%. 32% is >10 sigma
    // above uniform at this sample size, so this cannot flake.
    expect(weakPicks / totalPicks).toBeGreaterThan(0.32);
  });

  it('prioritizes topics due for revision over equally-mastered topics', async () => {
    const past = new Date(Date.now() - 86_400_000).toISOString();
    const masteryRows = [
      { topic_id: 'topic_due', mastery_level: 90, next_revision_due: past, topic_name: 'Due' },
      { topic_id: 'topic_fresh', mastery_level: 90, next_revision_due: null, topic_name: 'Fresh' },
    ];
    const pool = poolFor(['topic_due', 'topic_fresh'], 10);
    const db = createMockD1([masteryHandler(masteryRows), questionPoolHandler(pool)]);

    const draws = 200;
    let duePicks = 0;
    let totalPicks = 0;
    for (let i = 0; i < draws; i++) {
      const { questions } = await selectAdaptiveQuestions(db as never, {
        userId: USER_ID,
        subjectId: SUBJECT_ID,
        count: 4,
      });
      duePicks += questions.filter((q) => q.topic_id === 'topic_due').length;
      totalPicks += questions.length;
    }

    // Due weight 3 vs fresh weight 1 → ~75% expected; 58% is far above uniform (50%).
    expect(duePicks / totalPicks).toBeGreaterThan(0.58);
  });

  it('still explores unseen topics', async () => {
    // topic_unseen has no mastery row; it must still appear sometimes.
    const masteryRows = [
      { topic_id: 'topic_weak', mastery_level: 2, next_revision_due: null, topic_name: 'Weak' },
    ];
    const pool = poolFor(['topic_weak', 'topic_unseen'], 10);
    const db = createMockD1([masteryHandler(masteryRows), questionPoolHandler(pool)]);

    let unseenPicks = 0;
    let totalPicks = 0;
    for (let i = 0; i < 100; i++) {
      const { questions } = await selectAdaptiveQuestions(db as never, {
        userId: USER_ID,
        subjectId: SUBJECT_ID,
        count: 5,
      });
      unseenPicks += questions.filter((q) => q.topic_id === 'topic_unseen').length;
      totalPicks += questions.length;
    }
    expect(unseenPicks).toBeGreaterThan(0);
    expect(unseenPicks / totalPicks).toBeGreaterThan(0.05);
  });
});

describe('computeTopicWeights', () => {
  it('keeps a base weight for strong topics and boosts weak/due topics', () => {
    const now = Date.now();
    const weights = computeTopicWeights([
      { topic_id: 'strong', mastery_level: 100, next_revision_due: null },
      { topic_id: 'weak', mastery_level: 0, next_revision_due: null },
      { topic_id: 'due', mastery_level: 90, next_revision_due: new Date(now - 1000).toISOString() },
      { topic_id: 'not_due', mastery_level: 90, next_revision_due: new Date(now + 86_400_000).toISOString() },
    ], now);
    const byId = new Map(weights.map((w) => [w.topicId, w]));

    expect(byId.get('strong')!.weight).toBe(ADAPTIVE_BASE_WEIGHT);
    expect(byId.get('weak')!.weight).toBeGreaterThan(byId.get('strong')!.weight);
    expect(byId.get('due')!.weight).toBeGreaterThan(byId.get('not_due')!.weight);
    expect(byId.get('due')!.dueForRevision).toBe(true);
    expect(byId.get('not_due')!.dueForRevision).toBe(false);
  });

  it('treats mastery outside 0-100 as clamped and null dates as not due', () => {
    const weights = computeTopicWeights([
      { topic_id: 'over', mastery_level: 250, next_revision_due: 'not-a-date' },
      { topic_id: 'null', mastery_level: null, next_revision_due: null },
    ], Date.now());
    const byId = new Map(weights.map((w) => [w.topicId, w]));
    expect(byId.get('over')!.weight).toBe(ADAPTIVE_BASE_WEIGHT);
    expect(byId.get('over')!.dueForRevision).toBe(false);
    expect(byId.get('null')!.masteryLevel).toBe(0);
  });
});

describe('weightedSample', () => {
  it('samples without replacement and never exceeds the pool', () => {
    const items = ['a', 'b', 'c'];
    const picked = weightedSample(items, () => 1, 10);
    expect(picked).toHaveLength(3);
    expect(new Set(picked).size).toBe(3);
  });
});

describe('focus-areas', () => {
  it('returns weakest topics first with due flags', async () => {
    const past = new Date(Date.now() - 86_400_000).toISOString();
    const masteryRows = [
      { topic_id: 'topic_strong', mastery_level: 95, next_revision_due: null, topic_name: 'Strong' },
      { topic_id: 'topic_mid', mastery_level: 55, next_revision_due: null, topic_name: 'Mid' },
      { topic_id: 'topic_weak', mastery_level: 10, next_revision_due: past, topic_name: 'Weak' },
    ];
    const db = createMockD1([authHandler, masteryHandler(masteryRows)]);
    const res = await adaptiveApp.fetch(
      authedReq(`/focus-areas?subjectId=${SUBJECT_ID}`, await authToken()),
      env(db),
    );
    expect(res.status).toBe(200);
    const body = await res.json() as {
      data: {
        hasMasteryData: boolean;
        focusAreas: Array<{ topicId: string; topicName: string; masteryLevel: number; dueForRevision: boolean }>;
      };
    };
    expect(body.data.hasMasteryData).toBe(true);
    // Strong topic (95, not due) is not a focus area; weakest first.
    expect(body.data.focusAreas.map((f) => f.topicId)).toEqual(['topic_weak', 'topic_mid']);
    expect(body.data.focusAreas[0]).toMatchObject({
      topicName: 'Weak',
      masteryLevel: 10,
      dueForRevision: true,
    });
  });

  it('reports hasMasteryData false on cold start', async () => {
    const db = createMockD1([authHandler, masteryHandler([])]);
    const res = await adaptiveApp.fetch(
      authedReq(`/focus-areas?subjectId=${SUBJECT_ID}`, await authToken()),
      env(db),
    );
    const body = await res.json() as { data: { hasMasteryData: boolean; focusAreas: unknown[] } };
    expect(body.data.hasMasteryData).toBe(false);
    expect(body.data.focusAreas).toEqual([]);
  });
});
