import { describe, expect, it } from 'vitest';
import { createMockD1 } from './helpers/mockD1';
import { prepareAttemptProgress, recordAttemptProgress } from '../attempt-progress';

describe('shared attempt-progress pipeline', () => {
  it('prepares an atomic attempt plus keyed progress upsert', async () => {
    const db = createMockD1([
      { match: /INSERT INTO question_attempts/ },
      { match: /INSERT INTO user_progress/ },
    ]);

    const prepared = await prepareAttemptProgress(db as unknown as D1Database, {
      attemptId: 'attempt_1',
      userId: 'user_1',
      questionId: 'q_1',
      topicId: 'topic_1',
      examTypeId: 'exam_wassce',
      userAnswer: 'A',
      isCorrect: true,
      timeTaken: 12,
      points: 3,
      now: '2026-08-14T12:00:00.000Z',
    });

    expect(prepared.attemptId).toBe('attempt_1');
    expect(prepared.statements).toHaveLength(2);
    expect(db.calls[0].sql).toContain('INSERT INTO question_attempts');
    expect(db.calls[1].sql).toContain('ON CONFLICT(user_id, topic_id, exam_type_id) DO UPDATE SET');
  });

  it('uses the explicit NULL-exam lookup path and batches both writes', async () => {
    const db = createMockD1([
      { match: /SELECT id FROM user_progress/, first: () => null },
      { match: /INSERT INTO question_attempts/ },
      { match: /INSERT INTO user_progress/ },
    ]);

    await recordAttemptProgress(db as unknown as D1Database, {
      attemptId: 'attempt_2',
      userId: 'user_1',
      questionId: 'q_2',
      topicId: 'topic_2',
      examTypeId: null,
      userAnswer: 'False',
      isCorrect: false,
      timeTaken: 4,
      points: 5,
      now: '2026-08-14T12:00:00.000Z',
    });

    expect(db.calls.some((call) => /exam_type_id IS NULL/.test(call.sql))).toBe(true);
    const attempt = db.calls.find((call) => /INSERT INTO question_attempts/.test(call.sql));
    expect(attempt?.binds[4]).toBe(0);
    expect(attempt?.binds[6]).toBe(0);
  });
});
