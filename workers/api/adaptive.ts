import { Hono } from 'hono';
import { requireAuth } from './auth-middleware';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

interface Variables {
  userId: string;
  userRole: string;
  user: { userId: string; email?: string; role?: string };
}

// Minimal D1 surface so the selection helpers stay unit-testable without the
// full Workers types.
export interface AdaptiveDb {
  prepare(sql: string): {
    bind(...binds: unknown[]): {
      all<T = unknown>(): Promise<{ results: T[] }>;
    };
  };
}

export interface TopicMasteryRow {
  topic_id: string;
  mastery_level: number | null;
  next_revision_due: string | null;
  topic_name?: string | null;
}

export interface TopicWeight {
  topicId: string;
  topicName: string | null;
  masteryLevel: number;
  dueForRevision: boolean;
  weight: number;
}

export interface AdaptiveFocusArea {
  topicId: string;
  topicName: string | null;
  masteryLevel: number;
  dueForRevision: boolean;
}

export const ADAPTIVE_BASE_WEIGHT = 1;
// Extra weight (multiplied by how far below the threshold mastery is) for
// weak topics. A topic at 0 mastery gets BASE + WEAK_BOOST total weight.
export const ADAPTIVE_WEAK_BOOST = 3;
// Flat extra weight for topics whose spaced-repetition revision is due.
export const ADAPTIVE_DUE_BOOST = 2;
// mastery_level below this counts as "weak".
export const ADAPTIVE_WEAK_THRESHOLD = 60;
export const ADAPTIVE_POOL_MULTIPLIER = 10;
export const ADAPTIVE_POOL_MAX = 400;
export const ADAPTIVE_MAX_COUNT = 30;
export const ADAPTIVE_FOCUS_AREA_LIMIT = 5;

const ADAPTIVE_DIFFICULTIES = new Set(['easy', 'medium', 'hard', 'expert']);
const SAFE_ID = /^[A-Za-z0-9_-]{1,128}$/;

const clampMastery = (value: number | null | undefined): number => {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return Math.min(100, Math.max(0, n));
};

/**
 * Map topic_mastery rows to sampling weights. Every topic keeps a base weight
 * of 1 (exploration floor, so unseen/average topics still appear); weak topics
 * get a boost proportional to how far below ADAPTIVE_WEAK_THRESHOLD they are,
 * and topics due for revision get a flat extra boost.
 */
export function computeTopicWeights(rows: TopicMasteryRow[], now: number): TopicWeight[] {
  return rows.map((row) => {
    const masteryLevel = clampMastery(row.mastery_level);
    const dueForRevision = !!row.next_revision_due
      && !Number.isNaN(new Date(row.next_revision_due).getTime())
      && new Date(row.next_revision_due).getTime() <= now;
    let weight = ADAPTIVE_BASE_WEIGHT;
    if (masteryLevel < ADAPTIVE_WEAK_THRESHOLD) {
      weight += ADAPTIVE_WEAK_BOOST * (1 - masteryLevel / ADAPTIVE_WEAK_THRESHOLD);
    }
    if (dueForRevision) {
      weight += ADAPTIVE_DUE_BOOST;
    }
    return {
      topicId: row.topic_id,
      topicName: row.topic_name ?? null,
      masteryLevel,
      dueForRevision,
      weight,
    };
  });
}

/**
 * Weighted random sample WITHOUT replacement: repeatedly draw one item with
 * probability proportional to its weight, remove it, and continue.
 */
export function weightedSample<T>(
  items: T[],
  weightOf: (item: T) => number,
  count: number,
  rng: () => number = Math.random,
): T[] {
  const pool = items.slice();
  const picked: T[] = [];
  while (picked.length < count && pool.length > 0) {
    const total = pool.reduce((sum, item) => sum + Math.max(0, weightOf(item)), 0);
    if (total <= 0) {
      // All remaining weights are zero — fall back to uniform draw.
      const index = Math.floor(rng() * pool.length);
      picked.push(pool.splice(index, 1)[0]);
      continue;
    }
    let roll = rng() * total;
    let index = pool.length - 1;
    for (let i = 0; i < pool.length; i++) {
      roll -= Math.max(0, weightOf(pool[i]));
      if (roll <= 0) {
        index = i;
        break;
      }
    }
    picked.push(pool.splice(index, 1)[0]);
  }
  return picked;
}

const toFocusArea = (weight: TopicWeight): AdaptiveFocusArea => ({
  topicId: weight.topicId,
  topicName: weight.topicName,
  masteryLevel: weight.masteryLevel,
  dueForRevision: weight.dueForRevision,
});

export function pickFocusAreas(weights: TopicWeight[]): AdaptiveFocusArea[] {
  return weights
    .filter((w) => w.masteryLevel < ADAPTIVE_WEAK_THRESHOLD || w.dueForRevision)
    .sort((a, b) => a.masteryLevel - b.masteryLevel)
    .slice(0, ADAPTIVE_FOCUS_AREA_LIMIT)
    .map(toFocusArea);
}

export interface SelectAdaptiveOptions {
  userId: string;
  subjectId: string;
  count: number;
  difficulty?: string | null;
  now?: number;
  rng?: () => number;
}

export interface SelectAdaptiveResult {
  questions: Record<string, unknown>[];
  focusAreas: AdaptiveFocusArea[];
  adaptive: boolean;
}

const MASTERY_QUERY = `
  SELECT tm.topic_id, tm.mastery_level, tm.next_revision_due, t.name AS topic_name
  FROM topic_mastery tm
  JOIN topics t ON t.id = tm.topic_id
  WHERE tm.user_id = ? AND t.subject_id = ?
`;

// Same FROM/JOIN guards the public /questions practice draw uses today.
const POOL_QUERY = `
  SELECT q.*
  FROM questions q
  JOIN subjects s ON s.id = q.subject_id AND s.is_active = 1
  JOIN topics question_topic
    ON question_topic.id = q.topic_id AND question_topic.subject_id = q.subject_id
  WHERE q.subject_id = ?
`;

/**
 * Adaptive item selection on top of topic_mastery.
 *
 * Cold start (no mastery rows for this subject): returns the exact random
 * draw the practice flow uses today (ORDER BY RANDOM() LIMIT count).
 *
 * Otherwise: draw a random candidate pool from the subject, then weighted-
 * sample `count` questions where each question's weight comes from its topic's
 * mastery (weak/due topics overrepresented, unseen topics keep a base weight
 * so exploration never stops).
 */
export async function selectAdaptiveQuestions(
  db: AdaptiveDb,
  options: SelectAdaptiveOptions,
): Promise<SelectAdaptiveResult> {
  const { userId, subjectId, difficulty } = options;
  const count = Math.max(1, Math.min(ADAPTIVE_MAX_COUNT, Math.floor(options.count) || 10));
  const now = options.now ?? Date.now();
  const rng = options.rng ?? Math.random;

  const { results: masteryRows } = await db
    .prepare(MASTERY_QUERY)
    .bind(userId, subjectId)
    .all<TopicMasteryRow>();

  const difficultyClause = difficulty ? ' AND q.difficulty = ?' : '';
  const baseBinds: unknown[] = difficulty ? [subjectId, difficulty] : [subjectId];

  // Cold start: identical to today's random draw.
  if (masteryRows.length === 0) {
    const { results } = await db
      .prepare(`${POOL_QUERY}${difficultyClause} ORDER BY RANDOM() LIMIT ?`)
      .bind(...baseBinds, count)
      .all<Record<string, unknown>>();
    return { questions: results, focusAreas: [], adaptive: false };
  }

  const weights = computeTopicWeights(masteryRows, now);
  const weightByTopic = new Map(weights.map((w) => [w.topicId, w.weight]));

  const poolLimit = Math.min(ADAPTIVE_POOL_MAX, count * ADAPTIVE_POOL_MULTIPLIER);
  const { results: pool } = await db
    .prepare(`${POOL_QUERY}${difficultyClause} ORDER BY RANDOM() LIMIT ?`)
    .bind(...baseBinds, poolLimit)
    .all<Record<string, unknown>>();

  const questions = weightedSample(
    pool,
    (question) => weightByTopic.get(String(question.topic_id)) ?? ADAPTIVE_BASE_WEIGHT,
    count,
    rng,
  );

  return { questions, focusAreas: pickFocusAreas(weights), adaptive: true };
}

// --- Sanitization (mirrors the practice flow's sanitizeQuestionForStudent in
// index.ts; index.ts does not export it, so the same logic is kept here, as
// ranked.ts already does for its own serving path) ---

function transformQuestionOptions(
  options: unknown,
  correctAnswer: string | null | undefined,
): Array<{ id: string; text: string; isCorrect: boolean }> | null {
  if (!options) return null;

  let optionsArray: unknown[];
  if (typeof options === 'string') {
    try {
      optionsArray = JSON.parse(options);
    } catch {
      return null;
    }
  } else if (Array.isArray(options)) {
    optionsArray = options;
  } else {
    return null;
  }

  if (optionsArray.length > 0 && typeof optionsArray[0] === 'object' && optionsArray[0] !== null) {
    const firstOption = optionsArray[0] as Record<string, unknown>;
    if ('id' in firstOption && 'text' in firstOption) {
      return optionsArray as Array<{ id: string; text: string; isCorrect: boolean }>;
    }
  }

  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
  return optionsArray.map((option, index) => {
    const optionText = String(option);
    const letterId = letters[index] || String.fromCharCode(65 + index);

    let isCorrect = false;
    if (correctAnswer) {
      const trimmedAnswer = correctAnswer.trim();
      const answerLetter = trimmedAnswer.charAt(0).toUpperCase();
      isCorrect = letterId === answerLetter;
      if (!isCorrect && optionText.toLowerCase() === trimmedAnswer.toLowerCase()) {
        isCorrect = true;
      }
    }

    return { id: letterId, text: optionText, isCorrect };
  });
}

export function sanitizeAdaptiveQuestion(question: Record<string, unknown>): Record<string, unknown> {
  const sanitized = { ...question };
  delete sanitized.correct_answer;
  delete sanitized.explanation;
  const options = transformQuestionOptions(question.options, null);
  sanitized.options = options?.map(({ id, text }) => ({ id, text })) ?? null;
  return sanitized;
}

// --- Router ---

export const adaptiveApp = new Hono<{ Bindings: Env; Variables: Variables }>();

adaptiveApp.use('*', requireAuth);

const readSubjectParam = (c: { req: { query: (name: string) => string | undefined } }) => {
  const subjectId = c.req.query('subjectId');
  return subjectId && SAFE_ID.test(subjectId) ? subjectId : null;
};

adaptiveApp.get('/practice-set', async (c) => {
  const userId = c.get('userId');
  const subjectId = readSubjectParam(c);
  if (!subjectId) {
    return c.json({ success: false, error: 'A valid subjectId is required' }, 400);
  }

  const rawCount = parseInt(c.req.query('count') || '10', 10);
  const count = Number.isSafeInteger(rawCount) && rawCount > 0
    ? Math.min(ADAPTIVE_MAX_COUNT, rawCount)
    : 10;
  const rawDifficulty = c.req.query('difficulty');
  const difficulty = rawDifficulty && ADAPTIVE_DIFFICULTIES.has(rawDifficulty) ? rawDifficulty : null;

  try {
    const subject = await c.env.DB.prepare(
      'SELECT id FROM subjects WHERE id = ? AND is_active = 1',
    ).bind(subjectId).first();
    if (!subject) {
      return c.json({ success: false, error: 'Subject not found' }, 404);
    }

    const { questions, focusAreas, adaptive } = await selectAdaptiveQuestions(c.env.DB, {
      userId,
      subjectId,
      count,
      difficulty,
    });

    return c.json({
      success: true,
      data: {
        questions: questions.map((question) => sanitizeAdaptiveQuestion(question)),
        focusAreas,
        adaptive,
      },
    });
  } catch (error) {
    console.error('Error building adaptive practice set:', error);
    return c.json({ success: false, error: 'Failed to build adaptive practice set' }, 500);
  }
});

adaptiveApp.get('/focus-areas', async (c) => {
  const userId = c.get('userId');
  const subjectId = readSubjectParam(c);
  if (!subjectId) {
    return c.json({ success: false, error: 'A valid subjectId is required' }, 400);
  }

  try {
    const { results: masteryRows } = await c.env.DB
      .prepare(MASTERY_QUERY)
      .bind(userId, subjectId)
      .all<TopicMasteryRow>();

    const weights = computeTopicWeights(masteryRows, Date.now());
    return c.json({
      success: true,
      data: {
        focusAreas: pickFocusAreas(weights),
        hasMasteryData: masteryRows.length > 0,
      },
    });
  } catch (error) {
    console.error('Error fetching adaptive focus areas:', error);
    return c.json({ success: false, error: 'Failed to fetch focus areas' }, 500);
  }
});
