import { describe, expect, it } from 'vitest';
import { sign } from 'hono/jwt';
import { revisionClassroomApp } from '../revision-classroom';
import { createMockD1 } from './helpers/mockD1';

const JWT_SECRET = 'test-secret-that-is-long-enough';

describe('revision classroom Counselor Brie deep links', () => {
  it('rejects a topic that does not belong to the selected subject before session creation', async () => {
    const db = createMockD1([
      {
        match: /SELECT role, status, is_active, session_version FROM users/,
        first: () => ({ role: 'student', status: 'approved', is_active: 1 }),
      },
      { match: /SELECT id FROM subjects WHERE id/, first: () => ({ id: 'subject_1' }) },
      {
        match: /SELECT id, name, display_order[\s\S]*FROM topics/,
        all: () => ({
          results: [{ id: 'topic_good', name: 'Algebra', display_order: 1 }],
        }),
      },
    ]);
    const now = Math.floor(Date.now() / 1000);
    const token = await sign(
      { userId: 'student_1', role: 'student', iat: now, exp: now + 3600 },
      JWT_SECRET,
    );

    const response = await revisionClassroomApp.request('http://x/sessions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        examType: 'wassce',
        subjectId: 'subject_1',
        sessionType: 'topic_review',
        topicId: 'topic_other',
      }),
    }, {
      DB: db as unknown as D1Database,
      JWT_SECRET,
    } as never);

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: 'This topic is not available for the selected subject.',
    });
    expect(db.calls.some((call) => /INSERT INTO revision_sessions/.test(call.sql))).toBe(false);
  });
});
