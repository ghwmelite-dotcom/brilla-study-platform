import { Hono } from 'hono';
import { requireAuth } from './auth-middleware';
import type { AuthPayload } from './auth-middleware';
import { checkRateLimit } from './rate-limit';
import type { RateLimitResult } from './rate-limit';
import { parseLimit, parseBoundedJsonBody } from './http';
import { isPremiumUser } from './usage-limits';
import { getExperimentBySlug } from '../../shared/experiments';
import { gradeSession } from '../../shared/lab-grading';
import type {
  Experiment,
  LabEventInput,
  LabEventType,
  GradingResult,
} from '../../shared/lab-grading';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

interface AuthVars {
  userId: string;
  userRole: string;
  user: AuthPayload;
}

const MAX_EVENTS_PER_BATCH = 200;
const MAX_EVENT_PAYLOAD_BYTES = 8 * 1024;
const MAX_EVENTS_BODY_BYTES = 2 * 1024 * 1024;

interface LabSessionRow {
  id: string;
  user_id: string;
  experiment_slug: string;
  mode: 'guided' | 'sandbox';
  status: 'in_progress' | 'submitted' | 'graded';
  graded: 0 | 1;
  score: number | null;
  max_score: number | null;
  grading_json: string | null;
  started_at: string;
  submitted_at: string | null;
  created_at: string;
}

function generateId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

function rateLimited(c: any, result: RateLimitResult) {
  return c.json(
    { success: false, error: 'Too many requests. Please slow down.', retryAfter: result.retryAfter },
    429,
  );
}

const EVENT_TYPES: readonly LabEventType[] = ['measurement', 'action', 'observation', 'step_complete'];

/** Strict per-type payload validation. Unknown shapes never reach the DB. */
function isValidEventPayload(eventType: LabEventType, payload: unknown): boolean {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return false;
  const p = payload as Record<string, unknown>;
  const optStep = p.stepNumber === undefined || Number.isInteger(p.stepNumber);
  if (!optStep) return false;
  switch (eventType) {
    case 'measurement':
      return (
        typeof p.value === 'number' && Number.isFinite(p.value) &&
        typeof p.unit === 'string' && p.unit.length <= 32 &&
        typeof p.label === 'string' && p.label.length > 0 && p.label.length <= 200 &&
        (p.condition === undefined || typeof p.condition === 'string') &&
        (p.apparatusId === undefined || typeof p.apparatusId === 'string')
      );
    case 'action':
      return (
        typeof p.actionType === 'string' &&
        ['drag', 'connect', 'adjust', 'measure', 'record', 'observe', 'pour', 'heat'].includes(p.actionType) &&
        typeof p.targetApparatus === 'string' && p.targetApparatus.length <= 100 &&
        (p.value === undefined || typeof p.value === 'number')
      );
    case 'observation':
      return typeof p.text === 'string' && p.text.length > 0 && p.text.length <= 2000;
    case 'step_complete':
      return Number.isInteger(p.stepNumber);
  }
}

async function loadOwnedSession(
  db: D1Database,
  sessionId: string,
  userId: string,
): Promise<LabSessionRow | null> {
  const row = await db
    .prepare(`SELECT * FROM lab_sessions WHERE id = ?`)
    .bind(sessionId)
    .first<LabSessionRow>();
  // Ownership is invisible: cross-user access looks exactly like "not found".
  if (!row || row.user_id !== userId) return null;
  return row;
}

export const labApp = new Hono<{ Bindings: Env; Variables: AuthVars }>();

labApp.use('*', requireAuth);

// Test hook: the corpus ships no premium experiments yet, so this synthetic
// slug exercises the gate in unit tests. It is not a real experiment.
const TEST_PREMIUM_SLUG = '__test_premium__';
const TEST_PREMIUM_EXPERIMENT: Experiment = {
  ...getExperimentBySlug('acid-base-titration')!,
  id: 'exp_test_premium',
  slug: TEST_PREMIUM_SLUG,
  isPremium: true,
};

function resolveExperiment(slug: string): Experiment | undefined {
  if (slug === TEST_PREMIUM_SLUG) return TEST_PREMIUM_EXPERIMENT;
  const exp = getExperimentBySlug(slug);
  return exp && exp.isActive ? exp : undefined;
}

// --- POST /sessions ---------------------------------------------------------
labApp.post('/sessions', async (c) => {
  const userId = c.get('userId');
  const limit = await checkRateLimit(c.env.DB, userId, 'lab-session-start');
  if (!limit.allowed) return rateLimited(c, limit);

  const body = await c.req.json().catch(() => null);
  const slug = typeof body?.experimentSlug === 'string' ? body.experimentSlug : '';
  const mode = body?.mode;
  if (mode !== 'guided' && mode !== 'sandbox') {
    return c.json({ success: false, error: 'mode must be guided or sandbox' }, 400);
  }
  const experiment = resolveExperiment(slug);
  if (!experiment) {
    return c.json({ success: false, error: 'Unknown experiment' }, 400);
  }

  if (experiment.isPremium && !(await isPremiumUser(userId, c.env.DB))) {
    return c.json(
      {
        success: false,
        error: 'This experiment requires an active premium plan.',
        code: 'LAB_PREMIUM_REQUIRED',
      },
      403,
    );
  }

  const sessionId = generateId('lab_sess');
  // PhET/practice sessions are tracked but never graded.
  const graded = experiment.simulationType === 'phet' ? 0 : 1;
  await c.env.DB.prepare(
    `INSERT INTO lab_sessions (id, user_id, experiment_slug, mode, graded) VALUES (?, ?, ?, ?, ?)`,
  )
    .bind(sessionId, userId, experiment.slug, mode, graded)
    .run();

  return c.json(
    { success: true, data: { sessionId, graded, experimentSlug: experiment.slug, mode } },
    201,
  );
});

// --- POST /sessions/:id/events ----------------------------------------------
labApp.post('/sessions/:id/events', async (c) => {
  const userId = c.get('userId');
  const limit = await checkRateLimit(c.env.DB, userId, 'lab-events');
  if (!limit.allowed) return rateLimited(c, limit);

  const session = await loadOwnedSession(c.env.DB, c.req.param('id'), userId);
  if (!session) return c.json({ success: false, error: 'Session not found' }, 404);
  if (session.status !== 'in_progress') {
    return c.json({ success: false, error: 'Session is no longer in progress' }, 409);
  }

  const parsed = await parseBoundedJsonBody(c, MAX_EVENTS_BODY_BYTES);
  if (!parsed.ok) return c.json({ success: false, error: 'Invalid request body' }, 400);
  const events = (parsed.body as { events?: unknown }).events;
  if (!Array.isArray(events) || events.length === 0 || events.length > MAX_EVENTS_PER_BATCH) {
    return c.json({ success: false, error: `events must be an array of 1-${MAX_EVENTS_PER_BATCH}` }, 400);
  }

  const valid: LabEventInput[] = [];
  for (const raw of events) {
    const e = raw as Partial<LabEventInput>;
    if (
      typeof e?.clientEventId !== 'string' || e.clientEventId.length === 0 || e.clientEventId.length > 100 ||
      typeof e?.eventType !== 'string' || !EVENT_TYPES.includes(e.eventType as LabEventType) ||
      !isValidEventPayload(e.eventType as LabEventType, e.payload) ||
      JSON.stringify(e.payload).length > MAX_EVENT_PAYLOAD_BYTES
    ) {
      return c.json({ success: false, error: 'Invalid event in batch' }, 400);
    }
    valid.push(e as LabEventInput);
  }

  // INSERT OR IGNORE on UNIQUE(session_id, client_event_id): retries and
  // offline re-syncs are naturally idempotent.
  const statements = valid.map((e) =>
    c.env.DB.prepare(
      `INSERT OR IGNORE INTO lab_session_events (id, session_id, client_event_id, event_type, payload)
       VALUES (?, ?, ?, ?, ?)`,
    ).bind(generateId('lab_evt'), session.id, e.clientEventId, e.eventType, JSON.stringify(e.payload)),
  );
  const results = await c.env.DB.batch(statements);
  const accepted = results.reduce(
    (sum, r) => sum + (((r as { meta?: { changes?: number } }).meta?.changes ?? 0) > 0 ? 1 : 0),
    0,
  );

  return c.json({ success: true, data: { accepted, duplicates: valid.length - accepted } });
});

// --- POST /sessions/:id/submit -----------------------------------------------
labApp.post('/sessions/:id/submit', async (c) => {
  const userId = c.get('userId');
  const limit = await checkRateLimit(c.env.DB, userId, 'lab-submit');
  if (!limit.allowed) return rateLimited(c, limit);

  const session = await loadOwnedSession(c.env.DB, c.req.param('id'), userId);
  if (!session) return c.json({ success: false, error: 'Session not found' }, 404);

  const experiment = resolveExperiment(session.experiment_slug);
  if (!experiment) return c.json({ success: false, error: 'Unknown experiment' }, 400);

  // PhET practice: finish marks the session submitted, never graded.
  if (experiment.simulationType === 'phet') {
    if (session.status === 'in_progress') {
      await c.env.DB.prepare(
        `UPDATE lab_sessions SET status = 'submitted', submitted_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
      ).bind(session.id).run();
    }
    return c.json({ success: true, data: { graded: false, reason: 'practice' } });
  }

  if (session.mode === 'sandbox') {
    return c.json(
      { success: false, error: 'Sandbox sessions are not graded.', code: 'SANDBOX_NOT_GRADABLE' },
      400,
    );
  }

  // Idempotent re-submit: return the stored breakdown, never re-grade.
  if (session.status === 'graded' && session.grading_json) {
    return c.json({
      success: true,
      data: { graded: true, grading: JSON.parse(session.grading_json) as GradingResult },
    });
  }

  const { results: eventRows } = await c.env.DB.prepare(
    `SELECT client_event_id, event_type, payload FROM lab_session_events WHERE session_id = ? ORDER BY created_at`,
  ).bind(session.id).all<{ client_event_id: string; event_type: LabEventType; payload: string }>();

  const events: LabEventInput[] = eventRows.map((r) => ({
    clientEventId: r.client_event_id,
    eventType: r.event_type,
    payload: JSON.parse(r.payload),
  }));
  const grading = gradeSession(experiment, events);

  // Guarded transition: a concurrent submit affects zero rows and falls
  // through to returning the stored result.
  const write = await c.env.DB.prepare(
    `UPDATE lab_sessions SET status = 'graded', score = ?, max_score = ?, grading_json = ?,
         submitted_at = datetime('now'), updated_at = datetime('now')
     WHERE id = ? AND status = 'in_progress'`,
  )
    .bind(grading.totalScore, grading.maxScore, JSON.stringify(grading), session.id)
    .run();

  if (write.meta.changes === 0) {
    const stored = await c.env.DB.prepare(
      `SELECT grading_json FROM lab_sessions WHERE id = ?`,
    ).bind(session.id).first<{ grading_json: string | null }>();
    if (stored?.grading_json) {
      return c.json({
        success: true,
        data: { graded: true, grading: JSON.parse(stored.grading_json) as GradingResult },
      });
    }
    return c.json({ success: false, error: 'Session is not gradable in its current state' }, 409);
  }

  return c.json({ success: true, data: { graded: true, grading } });
});

// --- GET /sessions ------------------------------------------------------------
labApp.get('/sessions', async (c) => {
  const userId = c.get('userId');
  const limit = await checkRateLimit(c.env.DB, userId, 'lab-read');
  if (!limit.allowed) return rateLimited(c, limit);

  const take = parseLimit(c, 20, 100);
  const { results } = await c.env.DB.prepare(
    `SELECT id, experiment_slug, mode, status, graded, score, max_score, started_at, submitted_at, created_at
     FROM lab_sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
  ).bind(userId, take).all();
  const sessions = results.map((r: any) => ({
    ...r,
    experimentName: resolveExperiment(r.experiment_slug)?.name ?? r.experiment_slug,
  }));
  return c.json({ success: true, data: { sessions } });
});

// --- GET /sessions/:id ---------------------------------------------------------
labApp.get('/sessions/:id', async (c) => {
  const userId = c.get('userId');
  const limit = await checkRateLimit(c.env.DB, userId, 'lab-read');
  if (!limit.allowed) return rateLimited(c, limit);

  const session = await loadOwnedSession(c.env.DB, c.req.param('id'), userId);
  if (!session) return c.json({ success: false, error: 'Session not found' }, 404);

  const { results: events } = await c.env.DB.prepare(
    `SELECT client_event_id, event_type, payload, created_at FROM lab_session_events WHERE session_id = ? ORDER BY created_at`,
  ).bind(session.id).all();

  return c.json({
    success: true,
    data: {
      session,
      events,
      grading: session.grading_json ? JSON.parse(session.grading_json) : null,
    },
  });
});
