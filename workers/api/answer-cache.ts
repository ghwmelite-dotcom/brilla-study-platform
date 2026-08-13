/**
 * Semantic answer cache for classroom AI questions (Phase B7).
 *
 * A question that has already been answered well is embedded and indexed in
 * Vectorize (binding ANSWERS_INDEX) with its answer stored in the D1 table
 * `ai_answer_cache` (prod patch 097). Later semantically-similar questions on
 * the SAME topic hit the cache: no AI generation, no allowance spent, no
 * interaction row.
 *
 * The cache is ALWAYS optional: every failure is logged and swallowed so the
 * ask endpoint degrades to plain generation whenever the cache misbehaves.
 */

import { getEmbeddingModel, getCacheThreshold } from './ai-models';

export interface AnswerCacheEnv {
  DB: D1Database;
  AI?: Ai;
  ANSWERS_INDEX?: VectorizeIndex;
  AI_MODEL?: string;
  AI_MODEL_EMBEDDING?: string;
  AI_CACHE_THRESHOLD?: string;
}

export interface CachedAnswer {
  id: string;
  answerText: string;
}

/** Lowercase, collapse whitespace, strip trailing punctuation. */
export function normalizeQuestion(q: string): string {
  return q
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[\s?.!…:;]+$/g, '');
}

/**
 * Embed a single text via Workers AI. Handles both response forms Workers AI
 * returns for embedding models ({ data: number[][] } and
 * { data: { shape, data } }). Returns null on ANY failure — callers treat a
 * null embedding as "cache unavailable".
 */
export async function embedQuestion(env: AnswerCacheEnv, text: string): Promise<number[] | null> {
  try {
    if (!env.AI) return null;
    const result = (await env.AI.run(getEmbeddingModel(env), { text: [text] })) as unknown;
    const data = (result as { data?: unknown })?.data;

    // Form 1: { data: number[][] } — one row per input text
    if (Array.isArray(data) && Array.isArray(data[0])) {
      return data[0] as number[];
    }
    // Form 2: { data: { shape: [n, dims], data: number[] } } — flattened tensor
    if (
      data &&
      !Array.isArray(data) &&
      Array.isArray((data as { data?: unknown }).data) &&
      Array.isArray((data as { shape?: unknown }).shape)
    ) {
      const flat = (data as { data: number[] }).data;
      const shape = (data as { shape: number[] }).shape;
      const dims = shape.length > 1 ? shape[shape.length - 1] : flat.length;
      return flat.slice(0, dims);
    }
    // Form 3: { data: number[] } — a single flat vector
    if (Array.isArray(data) && typeof data[0] === 'number') {
      return data as number[];
    }
    console.error('answer-cache: unexpected embedding response shape');
    return null;
  } catch (error) {
    console.error('answer-cache: embedQuestion failed:', error);
    return null;
  }
}

/**
 * Look up a cached answer for `question` within `topicId`. Accepts the first
 * Vectorize match whose D1 row belongs to the same topic AND whose similarity
 * score clears getCacheThreshold(env). On accept, bumps hit_count/last_hit_at.
 * Returns null on any miss or failure.
 */
export async function lookupAnswer(
  env: AnswerCacheEnv,
  topicId: string | null | undefined,
  question: string,
): Promise<CachedAnswer | null> {
  try {
    if (!env.ANSWERS_INDEX || !topicId) return null;
    const vector = await embedQuestion(env, normalizeQuestion(question));
    if (!vector) return null;

    const threshold = getCacheThreshold(env);
    const result = await env.ANSWERS_INDEX.query(vector, { topK: 3 });
    const matches = result?.matches ?? [];

    for (const match of matches) {
      if (typeof match.score !== 'number' || match.score < threshold) continue;
      const row = await env.DB.prepare(
        `SELECT id, topic_id, answer_text FROM ai_answer_cache WHERE id = ?`,
      )
        .bind(match.id)
        .first<{ id: string; topic_id: string; answer_text: string }>();
      // Topic post-filter is mandatory: a high-similarity answer from another
      // topic is never served.
      if (!row || row.topic_id !== topicId) continue;

      try {
        await env.DB.prepare(
          `UPDATE ai_answer_cache SET hit_count = COALESCE(hit_count, 0) + 1, last_hit_at = datetime('now') WHERE id = ?`,
        )
          .bind(row.id)
          .run();
      } catch (error) {
        console.error('answer-cache: hit_count update failed:', error);
      }
      return { id: row.id, answerText: row.answer_text };
    }
    return null;
  } catch (error) {
    console.error('answer-cache: lookupAnswer failed:', error);
    return null;
  }
}

/**
 * Store a generated answer into the cache (D1 row + Vectorize vector, keyed by
 * the same id). Best-effort: every failure is logged and swallowed.
 */
export async function storeAnswer(
  env: AnswerCacheEnv,
  topicId: string | null | undefined,
  subjectId: string | null | undefined,
  examType: string | null | undefined,
  question: string,
  answer: string,
  model: string | null | undefined,
): Promise<void> {
  try {
    if (!env.ANSWERS_INDEX || !topicId || !answer || answer.trim() === '') return;
    const vector = await embedQuestion(env, normalizeQuestion(question));
    if (!vector) return; // embedding failed — nothing to index; skip silently

    const id = `anscache_${crypto.randomUUID()}`;
    await env.DB.prepare(
      `INSERT INTO ai_answer_cache (
        id, topic_id, subject_id, exam_type, question_text, answer_text, model, embedding_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(id, topicId, subjectId ?? null, examType ?? null, question, answer, model ?? null, id)
      .run();
    await env.ANSWERS_INDEX.upsert([
      { id, values: vector, metadata: { topic_id: topicId } },
    ]);
  } catch (error) {
    console.error('answer-cache: storeAnswer failed:', error);
  }
}
