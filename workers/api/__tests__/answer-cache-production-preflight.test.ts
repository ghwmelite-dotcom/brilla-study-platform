import { describe, expect, it } from 'vitest';
import {
  EXPECTED_AI_ANSWER_CACHE_COLUMNS,
  validateAnswerCacheSchema,
} from '../../../scripts/verify-ai-answer-cache-production.mjs';

function validPayload() {
  return [
    { success: true, results: structuredClone(EXPECTED_AI_ANSWER_CACHE_COLUMNS) },
    {
      success: true,
      results: [
        { seq: 0, name: 'idx_ai_answer_cache_topic', unique: 0, origin: 'c', partial: 0 },
        { seq: 1, name: 'sqlite_autoindex_ai_answer_cache_1', unique: 1, origin: 'pk', partial: 0 },
      ],
    },
    { success: true, results: [{ seqno: 0, cid: 1, name: 'topic_id' }] },
    { success: true, results: [{ row_count: 7 }] },
  ];
}

describe('production ai_answer_cache preflight', () => {
  it('accepts the exact migration 098 schema and preserves the observed row count', () => {
    expect(validateAnswerCacheSchema(validPayload())).toEqual({ rowCount: 7 });
  });

  it.each([
    ['column shape', (payload: ReturnType<typeof validPayload>) => { payload[0].results[1].notnull = 0; }],
    ['index uniqueness', (payload: ReturnType<typeof validPayload>) => { payload[1].results[0].unique = 1; }],
    ['index columns', (payload: ReturnType<typeof validPayload>) => { payload[2].results[0].name = 'subject_id'; }],
    ['query success', (payload: ReturnType<typeof validPayload>) => { payload[3].success = false; }],
  ])('fails closed on %s drift', (_label, mutate) => {
    const payload = validPayload();
    mutate(payload);
    expect(() => validateAnswerCacheSchema(payload)).toThrow();
  });
});
