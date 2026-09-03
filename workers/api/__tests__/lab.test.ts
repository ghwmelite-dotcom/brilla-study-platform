import { describe, expect, it } from 'vitest';
import { sign } from 'hono/jwt';
import { labApp } from '../lab';
import { createMockD1, type MockD1 } from './helpers/mockD1';

const JWT_SECRET = 'test-secret-that-is-long-enough';

async function auth(userId = 'student_1') {
  const now = Math.floor(Date.now() / 1000);
  const token = await sign({ userId, role: 'student', sessionVersion: 0, iat: now, exp: now + 3600 }, JWT_SECRET);
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

interface SessionRow {
  id: string;
  user_id: string;
  experiment_slug: string;
  mode: string;
  status: string;
  graded: number;
  score: number | null;
  max_score: number | null;
  grading_json: string | null;
}

function dbWith(opts: {
  premium?: boolean;
  session?: SessionRow | null;
  events?: unknown[];
  eventChanges?: number;
  submitChanges?: number;
}): MockD1 {
  return createMockD1([
    {
      // requireAuth per-request user re-check
      match: /SELECT role, status, is_active, session_version FROM users WHERE id = \?/,
      first: () => ({ role: 'student', status: 'approved', is_active: 1, session_version: 0 }),
    },
    {
      // isPremiumUser
      match: /SELECT role, subscription_tier_id, subscription_expires_at, trial_expires_at/,
      first: () =>
        opts.premium
          ? { role: 'teacher', subscription_tier_id: null, subscription_expires_at: null, trial_expires_at: null }
          : { role: 'student', subscription_tier_id: null, subscription_expires_at: null, trial_expires_at: null },
    },
    {
      // checkRateLimit INSERT ... RETURNING
      match: /INSERT INTO rate_limits/,
      first: () => ({ request_count: 1, total_requests: 1 }),
    },
    { match: /INSERT INTO lab_sessions/, run: () => ({ success: true, meta: { changes: 1 } }) },
    {
      match: /SELECT \* FROM lab_sessions WHERE id = \?/,
      first: () => opts.session ?? null,
    },
    {
      // Submit's fall-through reload after a lost concurrent guarded update
      match: /SELECT grading_json FROM lab_sessions WHERE id = \?/,
      first: () => ({
        grading_json: JSON.stringify({
          totalScore: 0, maxScore: 20, percentageScore: 0, criteriaScores: [], stepScores: [],
        }),
      }),
    },
    {
      match: /INSERT OR IGNORE INTO lab_session_events/,
      run: () => ({ success: true, meta: { changes: opts.eventChanges ?? 1 } }),
    },
    {
      match: /SELECT .* FROM lab_session_events WHERE session_id = \?/,
      all: () => ({ results: opts.events ?? [] }),
    },
    {
      match: /UPDATE lab_sessions SET status = 'submitted'/,
      run: () => ({ success: true, meta: { changes: 1 } }) ,
    },
    {
      match: /UPDATE lab_sessions SET[\s\S]*WHERE id = \? AND status = 'in_progress'/,
      run: () => ({ success: true, meta: { changes: opts.submitChanges ?? 1 } }),
    },
    {
      match: /SELECT .* FROM lab_sessions WHERE user_id = \?/,
      all: () => ({ results: [] }),
    },
  ]);
}

const env = (db: MockD1) => ({ DB: db, JWT_SECRET });

const guidedSession: SessionRow = {
  id: 'sess_1', user_id: 'student_1', experiment_slug: 'acid-base-titration',
  mode: 'guided', status: 'in_progress', graded: 1, score: null, max_score: null, grading_json: null,
};

const seededEvents = [
  { event_type: 'action', payload: JSON.stringify({ actionType: 'pour', targetApparatus: 'app_burette', stepNumber: 1 }) },
  { event_type: 'measurement', payload: JSON.stringify({ value: 25, unit: 'ml', label: 'Titre', condition: 'Average titre value', stepNumber: 7 }) },
];

describe('POST /sessions', () => {
  it('requires auth', async () => {
    const res = await labApp.request('/sessions', { method: 'POST', body: '{}' }, env(dbWith({})));
    expect(res.status).toBe(401);
  });

  it('rejects an unknown experiment slug', async () => {
    const res = await labApp.request(
      '/sessions',
      { method: 'POST', headers: await auth(), body: JSON.stringify({ experimentSlug: 'nope', mode: 'guided' }) },
      env(dbWith({})),
    );
    expect(res.status).toBe(400);
  });

  it('403 LAB_PREMIUM_REQUIRED for a free user starting a premium experiment', async () => {
    // Synthetic premium flag: the corpus ships no premium experiments yet, so
    // the route exposes an internal test hook — see TEST_PREMIUM_SLUG in lab.ts.
    const res = await labApp.request(
      '/sessions',
      { method: 'POST', headers: await auth(), body: JSON.stringify({ experimentSlug: '__test_premium__', mode: 'guided' }) },
      env(dbWith({ premium: false })),
    );
    expect(res.status).toBe(403);
    expect((await res.json() as any).code).toBe('LAB_PREMIUM_REQUIRED');
  });

  it('creates a guided session for a free experiment and stamps graded=1', async () => {
    const db = dbWith({});
    const res = await labApp.request(
      '/sessions',
      { method: 'POST', headers: await auth(), body: JSON.stringify({ experimentSlug: 'acid-base-titration', mode: 'guided' }) },
      env(db),
    );
    expect(res.status).toBe(201);
    const body = await res.json() as any;
    expect(body.data.graded).toBe(1);
    expect(typeof body.data.sessionId).toBe('string');
  });

  it('creates a PhET session with graded=0 (practice mode)', async () => {
    const res = await labApp.request(
      '/sessions',
      { method: 'POST', headers: await auth(), body: JSON.stringify({ experimentSlug: 'ohms-law', mode: 'guided' }) },
      env(dbWith({})),
    );
    expect(res.status).toBe(201);
    expect((await res.json() as any).data.graded).toBe(0);
  });
});

describe('POST /sessions/:id/events', () => {
  const batch = {
    events: [
      { clientEventId: 'c1', eventType: 'action', payload: { actionType: 'pour', targetApparatus: 'app_burette', stepNumber: 1 } },
      { clientEventId: 'c2', eventType: 'measurement', payload: { value: 25.1, unit: 'ml', label: 'Titre', condition: 'Average titre value', stepNumber: 7 } },
    ],
  };

  it('accepts a batch and reports counts', async () => {
    const res = await labApp.request(
      '/sessions/sess_1/events',
      { method: 'POST', headers: await auth(), body: JSON.stringify(batch) },
      env(dbWith({ session: guidedSession })),
    );
    expect(res.status).toBe(200);
    expect((await res.json() as any).data).toEqual({ accepted: 2, duplicates: 0 });
  });

  it('is idempotent: re-sent batch reports duplicates, no new rows', async () => {
    const res = await labApp.request(
      '/sessions/sess_1/events',
      { method: 'POST', headers: await auth(), body: JSON.stringify(batch) },
      env(dbWith({ session: guidedSession, eventChanges: 0 })),
    );
    expect((await res.json() as any).data).toEqual({ accepted: 0, duplicates: 2 });
  });

  it('404s a session owned by another user (no existence leak)', async () => {
    const res = await labApp.request(
      '/sessions/sess_1/events',
      { method: 'POST', headers: await auth('student_2'), body: JSON.stringify(batch) },
      env(dbWith({ session: guidedSession })),
    );
    expect(res.status).toBe(404);
  });

  it('409s when the session is no longer in_progress', async () => {
    const res = await labApp.request(
      '/sessions/sess_1/events',
      { method: 'POST', headers: await auth(), body: JSON.stringify(batch) },
      env(dbWith({ session: { ...guidedSession, status: 'graded' } })),
    );
    expect(res.status).toBe(409);
  });

  it('400s on unknown event types and oversized batches', async () => {
    const headers = await auth();
    const bad = await labApp.request(
      '/sessions/sess_1/events',
      { method: 'POST', headers, body: JSON.stringify({ events: [{ clientEventId: 'x', eventType: 'teleport', payload: {} }] }) },
      env(dbWith({ session: guidedSession })),
    );
    expect(bad.status).toBe(400);

    const tooMany = await labApp.request(
      '/sessions/sess_1/events',
      { method: 'POST', headers, body: JSON.stringify({ events: Array.from({ length: 201 }, (_, i) => ({ clientEventId: `c${i}`, eventType: 'observation', payload: { text: 'x' } })) }) },
      env(dbWith({ session: guidedSession })),
    );
    expect(tooMany.status).toBe(400);
  });
});

describe('POST /sessions/:id/submit', () => {
  it('grades deterministically against seeded events', async () => {
    const db = dbWith({ session: guidedSession, events: seededEvents });
    const res = await labApp.request('/sessions/sess_1/submit', { method: 'POST', headers: await auth() }, env(db));
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.data.graded).toBe(true);
    expect(body.data.grading.maxScore).toBeGreaterThan(0);
    // The guarded UPDATE carries the grading breakdown.
    const write = db.calls.find((c) => /UPDATE lab_sessions SET[\s\S]*status = 'graded'/.test(c.sql));
    expect(write).toBeDefined();
    expect(JSON.parse(String(write!.binds[2]))).toEqual(body.data.grading);
  });

  it('re-submit returns the stored result without re-grading', async () => {
    const graded: SessionRow = {
      ...guidedSession, status: 'graded', score: 12, max_score: 20,
      grading_json: JSON.stringify({ totalScore: 12, maxScore: 20, percentageScore: 60, criteriaScores: [], stepScores: [] }),
    };
    const db = dbWith({ session: graded });
    const res = await labApp.request('/sessions/sess_1/submit', { method: 'POST', headers: await auth() }, env(db));
    const body = await res.json() as any;
    expect(body.data.grading.totalScore).toBe(12);
    expect(db.calls.some((c) => /INSERT INTO lab_sessions/.test(c.sql))).toBe(false);
  });

  it('falls through to the stored result when a concurrent submit wins the guarded update', async () => {
    const db = dbWith({ session: guidedSession, events: seededEvents, submitChanges: 0 });
    const res = await labApp.request('/sessions/sess_1/submit', { method: 'POST', headers: await auth() }, env(db));
    expect(res.status).toBe(200); // returns reloaded stored row, not an error
  });

  it('PhET session submit marks submitted and returns practice semantics', async () => {
    const phet: SessionRow = { ...guidedSession, experiment_slug: 'ohms-law', graded: 0 };
    const res = await labApp.request('/sessions/sess_1/submit', { method: 'POST', headers: await auth() }, env(dbWith({ session: phet })));
    expect(res.status).toBe(200);
    expect((await res.json() as any).data).toEqual({ graded: false, reason: 'practice' });
  });

  it('sandbox sessions cannot be submitted', async () => {
    const sandbox: SessionRow = { ...guidedSession, mode: 'sandbox' };
    const res = await labApp.request('/sessions/sess_1/submit', { method: 'POST', headers: await auth() }, env(dbWith({ session: sandbox })));
    expect(res.status).toBe(400);
    expect((await res.json() as any).code).toBe('SANDBOX_NOT_GRADABLE');
  });

  it('404s a cross-user submit', async () => {
    const res = await labApp.request('/sessions/sess_1/submit', { method: 'POST', headers: await auth('student_2') }, env(dbWith({ session: guidedSession })));
    expect(res.status).toBe(404);
  });
});

describe('GET /sessions and /sessions/:id', () => {
  it('lists only the caller\'s sessions', async () => {
    const db = dbWith({});
    await labApp.request('/sessions', { headers: await auth() }, env(db));
    const listCall = db.calls.find((c) => /FROM lab_sessions WHERE user_id = \?/.test(c.sql) && /ORDER BY created_at DESC/.test(c.sql));
    expect(listCall?.binds[0]).toBe('student_1');
  });

  it('returns detail with events and stored grading; 404 cross-user', async () => {
    const ok = await labApp.request('/sessions/sess_1', { headers: await auth() }, env(dbWith({ session: guidedSession, events: seededEvents })));
    expect(ok.status).toBe(200);
    expect(((await ok.json()) as any).data.events).toHaveLength(2);

    const denied = await labApp.request('/sessions/sess_1', { headers: await auth('student_2') }, env(dbWith({ session: guidedSession })));
    expect(denied.status).toBe(404);
  });
});
