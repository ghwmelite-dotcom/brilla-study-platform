import { beforeEach, describe, expect, it } from 'vitest';
import worker, { resetPublicStatsCacheForTests } from '../index';
import { createMockD1, type MockHandler } from './helpers/mockD1';

// GET /api/public/stats: real COUNT(*)s for the landing page, cached
// in-module for 5 minutes per isolate (reset between tests here).

const JWT_SECRET = 'test-secret-that-is-long-enough';

function rateLimitHandler(): MockHandler {
  return {
    match: /usage\(total_requests\)/,
    first: () => ({ request_count: 1, total_requests: 1 }),
  };
}

function catchAll(): MockHandler {
  return {
    match: /./,
    first: () => null,
    all: () => ({ results: [] }),
    run: () => ({ success: true, meta: { changes: 1 } }),
  };
}

const env = (db: unknown) => ({ DB: db as D1Database, JWT_SECRET, ENVIRONMENT: 'test' });

function makeStatsDb(opts: { studyGroupsThrow?: boolean } = {}) {
  return createMockD1([
    rateLimitHandler(),
    { match: /FROM users WHERE role = 'student' AND status = 'approved' AND is_demo = 0/, first: () => ({ c: 4567 }) },
    { match: /SELECT COUNT\(\*\) as c FROM questions/, first: () => ({ c: 4812 }) },
    { match: /COUNT\(DISTINCT subject_id\)/, first: () => ({ c: 44 }) },
    { match: /FROM chat_rooms/, first: () => ({ c: 12 }) },
    {
      match: /FROM study_groups/,
      first: () => {
        if (opts.studyGroupsThrow) throw new Error('no such table: study_groups');
        return { c: 87 };
      },
    },
    { match: /FROM past_papers/, first: () => ({ c: 46 }) },
    catchAll(),
  ]);
}

describe('GET /api/public/stats', () => {
  beforeEach(() => {
    resetPublicStatsCacheForTests();
  });

  it('returns real counts without auth', async () => {
    const db = makeStatsDb();
    const res = await worker.fetch(new Request('http://x/api/public/stats'), env(db));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean; data: Record<string, number> };
    expect(body.success).toBe(true);
    expect(body.data).toEqual({
      students: 4567,
      questions: 4812,
      subjectsWithQuestions: 44,
      chatRooms: 12,
      studyGroups: 87,
      pastPapers: 46,
    });
  });

  it('degrades studyGroups to 0 when the table is missing', async () => {
    const db = makeStatsDb({ studyGroupsThrow: true });
    const res = await worker.fetch(new Request('http://x/api/public/stats'), env(db));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: Record<string, number> };
    expect(body.data.studyGroups).toBe(0);
    expect(body.data.questions).toBe(4812);
  });

  it('serves the in-module cache on repeat requests (no repeat COUNT queries)', async () => {
    const db = makeStatsDb();
    const first = await worker.fetch(new Request('http://x/api/public/stats'), env(db));
    expect(first.status).toBe(200);
    const callsAfterFirst = db.calls.length;

    const second = await worker.fetch(new Request('http://x/api/public/stats'), env(db));
    expect(second.status).toBe(200);
    const body = (await second.json()) as { data: Record<string, number> };
    expect(body.data.students).toBe(4567);

    // Cache hit: no new COUNT queries (the rate limiter may still run).
    const newCalls = db.calls.slice(callsAfterFirst);
    expect(newCalls.some((c) => c.sql.includes('COUNT'))).toBe(false);
  });
});
