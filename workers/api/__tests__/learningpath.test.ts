import { describe, it, expect } from 'vitest';
import { sign } from 'hono/jwt';
import worker from '../index';
import { createMockD1, type MockHandler } from './helpers/mockD1';

// Regression tests for Phase 3 Task 5: mastery must be computed from the real
// question_attempts table — user_questions exists nowhere in the schema, and
// the subjects lookup must join exam_types by slug (no s.exam_type column).

const JWT_SECRET = 'test-secret-that-is-long-enough';
const STUDENT = { role: 'student', status: 'approved', is_active: 1 };

async function token(payload: object) {
  return sign(
    { ...payload, exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000) },
    JWT_SECRET,
  );
}

function makeDb(extra: MockHandler[] = []) {
  return createMockD1([
    { match: /FROM users WHERE id/, first: () => STUDENT },
    ...extra,
    // Catch-all: any other query returns empty results / successful writes.
    {
      match: /[\s\S]/,
      first: () => null,
      all: () => ({ results: [] }),
      run: () => ({ success: true, meta: { changes: 1 } }),
    },
  ]);
}

function assertMasterySql(sqls: string[]) {
  // No query may reference the nonexistent user_questions table or the
  // nonexistent s.exam_type column.
  expect(sqls.some((s) => s.includes('user_questions'))).toBe(false);
  expect(sqls.some((s) => s.includes('s.exam_type ='))).toBe(false);
  // Every mastery query (joins questions) must source attempts from
  // question_attempts.
  const masteryQueries = sqls.filter((s) => /(FROM|JOIN) questions q/.test(s));
  expect(masteryQueries.length).toBeGreaterThan(0);
  for (const s of masteryQueries) {
    expect(s).toContain('question_attempts');
  }
}

describe('learningpath question_attempts migration', () => {
  it('GET /api/learning/recommendations computes mastery from question_attempts', async () => {
    const db = makeDb();
    const t = await token({ userId: 'user_1', role: 'student' });
    const res = await worker.fetch(
      new Request('http://x/api/learning/recommendations', {
        headers: { Authorization: `Bearer ${t}` },
      }),
      { DB: db, JWT_SECRET },
    );
    expect(res.status).toBe(200);
    assertMasterySql(db.calls.map((c) => c.sql));
  });

  it('GET /api/learning/exam-readiness/:examType uses one grouped mastery query', async () => {
    const subjects = [
      { id: 'sub_1', name: 'Mathematics', icon: 'math' },
      { id: 'sub_2', name: 'English', icon: 'eng' },
    ];
    const db = makeDb([
      { match: /LEFT JOIN exam_types et/, all: () => ({ results: subjects }) },
      {
        match: /GROUP BY s\.id/,
        all: () => ({
          results: [
            { subject_id: 'sub_1', total_topics: 5, mastered_topics: 2, avg_mastery: 40 },
          ],
        }),
      },
      {
        match: /FROM topics t/,
        all: () => ({
          results: [{ subject_id: 'sub_1', id: 't1', name: 'Algebra', mastery: 30 }],
        }),
      },
    ]);
    const t = await token({ userId: 'user_1', role: 'student' });
    const res = await worker.fetch(
      new Request('http://x/api/learning/exam-readiness/wassce', {
        headers: { Authorization: `Bearer ${t}` },
      }),
      { DB: db, JWT_SECRET },
    );
    expect(res.status).toBe(200);

    const body = (await res.json()) as any;
    expect(body.data.subjects).toHaveLength(2);
    expect(body.data.subjects[0].readinessScore).toBe(40);
    // sub_2 has no grouped row → zeroed mastery.
    expect(body.data.subjects[1].readinessScore).toBe(0);

    assertMasterySql(db.calls.map((c) => c.sql));

    // The per-subject mastery loop is collapsed: exactly one grouped query,
    // bound with the user id plus every subject id from the subjects result.
    const grouped = db.calls.filter((c) => c.sql.includes('GROUP BY s.id'));
    expect(grouped).toHaveLength(1);
    expect(grouped[0].binds).toEqual(['user_1', 'sub_1', 'sub_2']);

    // Task 16: the per-subject weak/strong topic loop is collapsed too —
    // exactly one grouped topics query over all subject ids, stitched in JS.
    const topicsQueries = db.calls.filter((c) => /FROM topics t/.test(c.sql));
    expect(topicsQueries).toHaveLength(1);
    expect(topicsQueries[0].sql).toMatch(/t\.subject_id IN \(/);
    expect(topicsQueries[0].binds).toEqual(['user_1', 'sub_1', 'sub_2']);

    // Topic rows are stitched back onto the right subject.
    expect(body.data.subjects[0].weakTopics).toEqual([
      { id: 't1', name: 'Algebra', mastery: 30 },
    ]);
    expect(body.data.subjects[0].strongTopics).toEqual([]);
    expect(body.data.subjects[1].weakTopics).toEqual([]);
  });

  it('POST /api/learning/study-plan/generate sources weak topics from question_attempts', async () => {
    const db = makeDb();
    const t = await token({ userId: 'user_1', role: 'student' });
    const res = await worker.fetch(
      new Request('http://x/api/learning/study-plan/generate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ examType: 'wassce' }),
      }),
      { DB: db, JWT_SECRET },
    );
    expect(res.status).toBe(200);
    assertMasterySql(db.calls.map((c) => c.sql));
  });
});
