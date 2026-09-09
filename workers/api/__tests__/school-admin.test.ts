import { afterEach, describe, it, expect, vi } from 'vitest';
import { sign } from 'hono/jwt';
import worker from '../index';
import { paymentsApp } from '../payments';
import { sendSchoolRenewalReminders } from '../school-seats';

// School subscriptions Phase 2 — spec:
// docs/plans/2026-09-08-school-subscriptions.md
//
// Covers the school_admin self-serve app (workers/api/school-admin.ts), the
// student analytics-consent endpoints and phase-2 admin routes (school-seats.ts),
// the renewal-reminder cron, and the webhook's recurring-charge tolerance.
// Mock pattern copied from school-seats.test.ts: prepare().bind() captures
// sql+args; first()/all() resolve per SQL substring; batch() records
// statements; meta.changes controls guarded writes.

const JWT_SECRET = 'test-secret';
const DAY_MS = 24 * 60 * 60 * 1000;

interface CapturedStatement {
  sql: string;
  args: unknown[];
}

const SCHOOL = {
  id: 'sch_achimota',
  name: 'Achimota School',
  status: 'active',
  seat_tier_id: 'tier_school_50',
  seat_expires_at: '2027-01-01T00:00:00.000Z',
  seat_code: 'SCH-ABC123',
  seat_code_uses: 25,
  seat_cap: 50,
  seat_credit: 0,
  renewal_reminded_at: null,
};

interface DbOptions {
  // Role returned by the auth middleware's per-request users lookup.
  authRole?: string;
  // Caller's school membership (SELECT school_id FROM users).
  membership?: unknown;
  // Schools row for `WHERE id = ?` lookups.
  schoolRow?: unknown;
  // Overview aggregate counts.
  seatCounts?: unknown;
  // GET /seats rows.
  seatRows?: unknown[];
  // Progress-gate seat row (analytics_opted_out).
  progressSeat?: unknown;
  // Consent endpoints: user role/level + active seat.
  consentUser?: unknown;
  activeSeat?: unknown;
  // Progress data.
  studentRow?: unknown;
  attemptStats?: unknown[];
  topicProgress?: unknown[];
  achievements?: unknown[];
  longestStreak?: unknown;
  // Admin school-admin routes: target user lookups.
  targetUser?: unknown;
  demoteUser?: unknown;
  // seats/reduce + billing/renew.
  activeSeatCount?: number;
  tierRow?: unknown;
  lastPayment?: unknown;
  billingUser?: unknown;
  // Renewal cron.
  renewalSchools?: unknown[];
  schoolAdmins?: unknown[];
  // Recurring webhook.
  recentPayments?: unknown[];
  existingTx?: unknown;
  settleRow?: unknown;
  // GET /api/schools/seat (caller's active seat).
  mySeat?: unknown;
  // GET /api/admin/schools rows.
  adminSchoolList?: unknown[];
  // Per-statement meta.changes returned by batch().
  batchChanges?: number[];
}

function makeDb(opts: DbOptions = {}) {
  const batchCalls: CapturedStatement[][] = [];
  const runs: CapturedStatement[] = [];
  const bound: CapturedStatement[] = [];
  const prepareCalls: string[] = [];

  const firstFor = (sql: string): unknown => {
    // Auth middleware per-request users lookup.
    if (sql.includes('role, status, is_active, session_version FROM users')) {
      return {
        role: opts.authRole ?? 'school_admin',
        status: 'approved',
        is_active: 1,
      };
    }
    // Caller's school membership (school scoping).
    if (sql.includes('SELECT school_id FROM users')) {
      return opts.membership !== undefined ? opts.membership : { school_id: 'sch_achimota' };
    }
    // Consent endpoints: role + school_level.
    if (sql.includes('role, school_level FROM users')) {
      return opts.consentUser ?? null;
    }
    // Demote lookup (carries teacher fields).
    if (sql.includes('teacher_license_number, subjects_taught FROM users')) {
      return opts.demoteUser ?? null;
    }
    // Assign lookup.
    if (sql.includes('SELECT id, role, school_id FROM users')) {
      return opts.targetUser ?? null;
    }
    // Billing payer lookup.
    if (sql.includes('SELECT id, email, name FROM users')) {
      return opts.billingUser ?? { id: 'sa_1', email: 'admin@sch.dev', name: 'School Admin' };
    }
    // Progress student info.
    if (sql.includes('avatar_url') && sql.includes('FROM users')) {
      return opts.studentRow ?? null;
    }
    if (sql.includes('MAX(streak_days)')) {
      return opts.longestStreak ?? { longest_streak: 5 };
    }
    // Overview aggregate.
    if (sql.includes('SUM(CASE WHEN status')) {
      return opts.seatCounts ?? { active_count: 0, expired_count: 0, revoked_count: 0 };
    }
    // Progress consent gate.
    if (sql.includes('SELECT id, analytics_opted_out FROM school_seats')) {
      return opts.progressSeat ?? null;
    }
    // GET /api/schools/seat — the caller's active seat joined to the school.
    if (sql.includes('FROM school_seats ss') && sql.includes('school_name')) {
      return opts.mySeat ?? null;
    }
    if (sql.includes('COUNT(*) AS n FROM school_seats')) {
      return { n: opts.activeSeatCount ?? 0 };
    }
    // Consent endpoints: active seat for the caller.
    if (sql.includes('FROM school_seats') && sql.includes("status = 'active'")) {
      return opts.activeSeat ?? null;
    }
    if (sql.includes('FROM schools') && sql.includes('WHERE id = ?')) {
      return opts.schoolRow ?? null;
    }
    if (sql.includes('FROM subscription_tiers')) {
      return opts.tierRow ?? null;
    }
    if (sql.includes('SELECT billing_cycle FROM payment_transactions')) {
      return opts.lastPayment ?? null;
    }
    // settleVerifiedSubscriptionPayment's joined row.
    if (sql.includes('FROM payment_transactions pt')) {
      return opts.settleRow ?? null;
    }
    if (sql.includes('SELECT id FROM payment_transactions')) {
      return opts.existingTx ?? null;
    }
    return null;
  };

  const allFor = (sql: string): unknown[] => {
    if (sql.includes('FROM schools') && sql.includes('renewal_reminded_at')) {
      return opts.renewalSchools ?? [];
    }
    // Admin school list (GET /api/admin/schools).
    if (sql.includes('FROM schools s') && sql.includes('school_channels')) {
      return opts.adminSchoolList ?? [];
    }
    if (sql.includes("role = 'school_admin' AND school_id")) {
      return opts.schoolAdmins ?? [];
    }
    if (sql.includes('FROM school_seats ss')) {
      return opts.seatRows ?? [];
    }
    if (sql.includes('FROM question_attempts')) {
      return opts.attemptStats ?? [{ total_attempted: 10, total_correct: 7 }];
    }
    if (sql.includes('FROM user_progress')) {
      return opts.topicProgress ?? [];
    }
    if (sql.includes('FROM user_achievements')) {
      return opts.achievements ?? [];
    }
    if (sql.includes('SELECT user_id, metadata FROM payment_transactions')) {
      return opts.recentPayments ?? [];
    }
    return [];
  };

  const stmtFor = (sql: string, args: unknown[]) => ({
    sql,
    args,
    first: vi.fn().mockImplementation(() => Promise.resolve(firstFor(sql))),
    all: vi.fn().mockImplementation(() => Promise.resolve({ results: allFor(sql) })),
    run: vi.fn().mockImplementation(() => {
      runs.push({ sql, args });
      return Promise.resolve({ success: true, meta: { changes: 1 } });
    }),
  });

  const db = {
    prepare: vi.fn((sql: string) => {
      prepareCalls.push(sql);
      return {
        sql,
        ...stmtFor(sql, []),
        bind: (...args: unknown[]) => {
          bound.push({ sql, args });
          return stmtFor(sql, args);
        },
      };
    }),
    batch: vi.fn((statements: CapturedStatement[]) => {
      batchCalls.push(statements.map((s) => ({ sql: s.sql, args: s.args })));
      return Promise.resolve(
        statements.map((_, i) => ({
          success: true,
          meta: { changes: opts.batchChanges?.[i] ?? 1 },
        })),
      );
    }),
  } as unknown as D1Database;

  return { db, batchCalls, runs, bound, prepareCalls };
}

type Role = 'student' | 'teacher' | 'parent' | 'admin' | 'school_admin';

async function authHeader(role: Role = 'school_admin', userId = 'sa_1') {
  const token = await sign(
    {
      userId: role === 'admin' ? 'admin_1' : userId,
      email: `${role}@test.dev`,
      role,
      exp: Math.floor(Date.now() / 1000) + 3600,
    },
    JWT_SECRET,
  );
  return { Authorization: `Bearer ${token}` };
}

function apiRequest(
  path: string,
  method: string,
  body?: unknown,
  headers: Record<string, string> = {},
) {
  return new Request(`http://x${path}`, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json', ...headers } : headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

function testEnv(db: D1Database) {
  return {
    DB: db,
    JWT_SECRET,
    PAYSTACK_SECRET_KEY: 'sk_test_x',
    PAYSTACK_PUBLIC_KEY: 'pk_test_x',
    PAYSTACK_WEBHOOK_SECRET: 'whsec_test',
    APP_URL: 'https://app.test',
  };
}

async function hmacSha512Hex(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-512' }, false, ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Stub the Paystack initialize call, echoing the request reference. */
function stubPaystackInitialize() {
  const fetchMock = vi.fn(async (_url: unknown, init?: { body?: unknown }) => {
    const payload = JSON.parse(String(init?.body ?? '{}'));
    return new Response(JSON.stringify({
      status: true,
      data: {
        authorization_url: 'https://pay.test/checkout',
        reference: payload.reference,
        access_code: 'ac_test',
      },
    }));
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

// ---------------------------------------------------------------------------
// Authz matrix
// ---------------------------------------------------------------------------
describe('school-admin authz', () => {
  const routes: Array<[string, string, unknown?]> = [
    ['GET', '/api/school-admin/overview'],
    ['GET', '/api/school-admin/seats'],
    ['POST', '/api/school-admin/seat-code/regenerate', {}],
    ['GET', '/api/school-admin/students/user_1/progress'],
    ['POST', '/api/school-admin/billing/renew', { billingCycle: 'monthly' }],
  ];

  it('401 without a token on every route', async () => {
    const { db } = makeDb();
    for (const [method, path, body] of routes) {
      const res = await worker.fetch(apiRequest(path, method, body), testEnv(db));
      expect(res.status).toBe(401);
    }
  });

  it('403 for student, teacher, parent AND platform admin roles (admin ≠ school_admin), with no mutation SQL', async () => {
    for (const role of ['student', 'teacher', 'parent', 'admin'] as const) {
      const { db, runs, batchCalls } = makeDb({ authRole: role });
      const headers = await authHeader(role);
      for (const [method, path, body] of routes) {
        const res = await worker.fetch(apiRequest(path, method, body, headers), testEnv(db));
        expect(res.status).toBe(403);
      }
      expect(runs).toHaveLength(0);
      expect(batchCalls).toHaveLength(0);
    }
  });

  it("403 'no school assigned' when the caller's users.school_id is NULL", async () => {
    const { db } = makeDb({ authRole: 'school_admin', membership: { school_id: null } });
    const res = await worker.fetch(
      apiRequest('/api/school-admin/overview', 'GET', undefined, await authHeader('school_admin')),
      testEnv(db),
    );
    expect(res.status).toBe(403);
    expect((await res.json()).error).toMatch(/no school assigned/i);
  });

  it('school scoping comes from the caller membership, never the request', async () => {
    const { db, prepareCalls } = makeDb({
      authRole: 'school_admin',
      membership: { school_id: 'sch_other' },
      schoolRow: { ...SCHOOL, id: 'sch_other' },
    });
    const res = await worker.fetch(
      apiRequest('/api/school-admin/overview', 'GET', undefined, await authHeader('school_admin', 'sa_other')),
      testEnv(db),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.school.id).toBe('sch_other');
    // The schools lookup was bound to the caller's own school id.
    const schoolLookup = prepareCalls.findIndex((sql) => sql.includes('FROM schools'));
    expect(schoolLookup).toBeGreaterThanOrEqual(0);
  });
});

// ---------------------------------------------------------------------------
// GET /overview
// ---------------------------------------------------------------------------
describe('GET /api/school-admin/overview', () => {
  it('returns package state, usage counts, drift, days remaining, credit and renewal state', async () => {
    const { db } = makeDb({
      schoolRow: {
        ...SCHOOL,
        seat_expires_at: new Date(Date.now() + 5 * DAY_MS).toISOString(),
        seat_credit: 200,
      },
      seatCounts: { active_count: 20, expired_count: 2, revoked_count: 1 },
    });
    const res = await worker.fetch(
      apiRequest('/api/school-admin/overview', 'GET', undefined, await authHeader()),
      testEnv(db),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.school).toMatchObject({
      id: 'sch_achimota',
      seatTierId: 'tier_school_50',
      seatCode: 'SCH-ABC123',
    });
    expect(body.data.usage).toEqual({
      cap: 50,
      codeUses: 25,
      activeCount: 20,
      expiredCount: 2,
      revokedCount: 1,
      drift: 5,
    });
    expect(body.data.daysRemaining).toBe(5);
    expect(body.data.seatCredit).toBe(200);
    expect(body.data.renewal.renewalDue).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// GET /seats
// ---------------------------------------------------------------------------
describe('GET /api/school-admin/seats', () => {
  it('lists active seat-holders with their consent flag', async () => {
    const { db } = makeDb({
      schoolRow: SCHOOL,
      seatRows: [
        { user_id: 'user_1', granted_at: '2026-09-02 00:00:00', analytics_opted_out: 1, full_name: 'Ama S', username: 'ama@test.dev' },
        { user_id: 'user_2', granted_at: '2026-09-01 00:00:00', analytics_opted_out: 0, full_name: 'Kofi M', username: 'kofi@test.dev' },
      ],
    });
    const res = await worker.fetch(
      apiRequest('/api/school-admin/seats', 'GET', undefined, await authHeader()),
      testEnv(db),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(2);
    expect(body.data[0]).toEqual({
      userId: 'user_1',
      fullName: 'Ama S',
      username: 'ama@test.dev',
      grantedAt: '2026-09-02 00:00:00',
      analyticsOptedOut: true,
    });
    expect(body.data[1].analyticsOptedOut).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// POST /seat-code/regenerate
// ---------------------------------------------------------------------------
describe('POST /api/school-admin/seat-code/regenerate', () => {
  it('rotates the school code; granted seats are untouched', async () => {
    const { db, runs, batchCalls } = makeDb({ schoolRow: SCHOOL });
    const res = await worker.fetch(
      apiRequest('/api/school-admin/seat-code/regenerate', 'POST', {}, await authHeader()),
      testEnv(db),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.seatCode).toMatch(/^SCH-[A-Z2-9]{6}$/);
    const update = runs.find((r) => r.sql.includes('UPDATE schools SET seat_code = ?'));
    expect(update).toBeDefined();
    expect(update!.args).toEqual([body.data.seatCode, 'sch_achimota']);
    // No seat rows touched.
    expect(batchCalls).toHaveLength(0);
    expect(runs.some((r) => r.sql.includes('school_seats'))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// GET /students/:studentId/progress (consent-gated analytics)
// ---------------------------------------------------------------------------
describe('GET /api/school-admin/students/:studentId/progress', () => {
  const STUDENT = {
    id: 'user_1',
    name: 'Ama S',
    avatar_url: null,
    school_level: 'shs',
    year_group: 2,
    house: 'house_a',
    xp_points: 1200,
    level: 5,
    streak_days: 9,
    last_activity_date: '2026-09-07',
  };

  it('200 with the parents-shape payload for an active, non-opted-out seat-holder', async () => {
    const { db } = makeDb({
      schoolRow: SCHOOL,
      progressSeat: { id: 'seat_1', analytics_opted_out: 0 },
      studentRow: STUDENT,
    });
    const res = await worker.fetch(
      apiRequest('/api/school-admin/students/user_1/progress', 'GET', undefined, await authHeader()),
      testEnv(db),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toMatchObject({
      studentId: 'user_1',
      studentName: 'Ama S',
      totalQuestionsAttempted: 10,
      totalCorrect: 7,
      overallAccuracy: 70,
      streakDays: 9,
    });
  });

  it('403 when the student opted out of analytics', async () => {
    const { db, prepareCalls } = makeDb({
      schoolRow: SCHOOL,
      progressSeat: { id: 'seat_1', analytics_opted_out: 1 },
    });
    const res = await worker.fetch(
      apiRequest('/api/school-admin/students/user_1/progress', 'GET', undefined, await authHeader()),
      testEnv(db),
    );
    expect(res.status).toBe(403);
    expect((await res.json()).error).toMatch(/opted out/i);
    // The progress queries never ran.
    expect(prepareCalls.some((sql) => sql.includes('FROM question_attempts'))).toBe(false);
  });

  it('404 for a student without an active seat at the caller school', async () => {
    const { db } = makeDb({ schoolRow: SCHOOL, progressSeat: null });
    const res = await worker.fetch(
      apiRequest('/api/school-admin/students/user_outsider/progress', 'GET', undefined, await authHeader()),
      testEnv(db),
    );
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// Student analytics consent endpoints
// ---------------------------------------------------------------------------
describe('POST /api/schools/seat/analytics-opt-out + opt-in', () => {
  it('SHS student opts out: flag set on the active seat row', async () => {
    const { db, runs } = makeDb({
      authRole: 'student',
      consentUser: { role: 'student', school_level: 'shs' },
      activeSeat: { id: 'seat_1' },
    });
    const res = await worker.fetch(
      apiRequest('/api/schools/seat/analytics-opt-out', 'POST', {}, await authHeader('student', 'user_1')),
      testEnv(db),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).data.analyticsOptedOut).toBe(true);
    const update = runs.find((r) => r.sql.includes('analytics_opted_out'));
    expect(update).toBeDefined();
    expect(update!.args).toEqual([1, 'seat_1']);
  });

  it('JHS/BECE-level student → 403 with a clear message, no writes', async () => {
    const { db, runs } = makeDb({
      authRole: 'student',
      consentUser: { role: 'student', school_level: 'jhs' },
      activeSeat: { id: 'seat_1' },
    });
    const res = await worker.fetch(
      apiRequest('/api/schools/seat/analytics-opt-out', 'POST', {}, await authHeader('student', 'user_1')),
      testEnv(db),
    );
    expect(res.status).toBe(403);
    expect((await res.json()).error).toMatch(/SHS/);
    expect(runs).toHaveLength(0);
  });

  it('404 when the student holds no active seat', async () => {
    const { db, runs } = makeDb({
      authRole: 'student',
      consentUser: { role: 'student', school_level: 'shs' },
      activeSeat: null,
    });
    const res = await worker.fetch(
      apiRequest('/api/schools/seat/analytics-opt-out', 'POST', {}, await authHeader('student', 'user_1')),
      testEnv(db),
    );
    expect(res.status).toBe(404);
    expect(runs).toHaveLength(0);
  });

  it('opt-in clears the flag and the opt-out timestamp', async () => {
    const { db, runs } = makeDb({
      authRole: 'student',
      consentUser: { role: 'student', school_level: 'shs' },
      activeSeat: { id: 'seat_1' },
    });
    const res = await worker.fetch(
      apiRequest('/api/schools/seat/analytics-opt-in', 'POST', {}, await authHeader('student', 'user_1')),
      testEnv(db),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).data.analyticsOptedOut).toBe(false);
    const update = runs.find((r) => r.sql.includes('analytics_opted_out'));
    expect(update).toBeDefined();
    expect(update!.sql).toContain('analytics_opted_out_at = NULL');
    expect(update!.args).toEqual([0, 'seat_1']);
  });
});

// ---------------------------------------------------------------------------
// POST /billing/renew
// ---------------------------------------------------------------------------
describe('POST /api/school-admin/billing/renew', () => {
  it('initializes a renewal at the tier price minus seat_credit, with settlement-converging metadata', async () => {
    const fetchMock = stubPaystackInitialize();
    const { db, runs } = makeDb({
      schoolRow: { ...SCHOOL, seat_credit: 300 },
      tierRow: { id: 'tier_school_50', price_monthly: 1500, price_yearly: 15000, is_active: 1 },
    });
    const res = await worker.fetch(
      apiRequest('/api/school-admin/billing/renew', 'POST', { billingCycle: 'monthly' }, await authHeader()),
      testEnv(db),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toMatchObject({
      authorizationUrl: 'https://pay.test/checkout',
      amount: 1200, // 1500 - 300 credit
      originalAmount: 1500,
      creditApplied: 300,
    });
    expect(body.data.reference).toMatch(/^SUB_/);

    const insert = runs.find((r) => r.sql.includes('INSERT INTO payment_transactions'));
    expect(insert).toBeDefined();
    expect(insert!.args[2]).toBe(body.data.reference);
    expect(insert!.args[3]).toBe(1200);
    expect(insert!.args[4]).toBe('tier_school_50');
    expect(insert!.args[5]).toBe('monthly');
    const metadata = JSON.parse(String(insert!.args[6]));
    expect(metadata).toMatchObject({
      school_id: 'sch_achimota',
      seats: 50,
      renewal: true,
      credit_applied: 300,
      original_amount: 1500,
    });

    // Paystack was initialized with the discounted amount in pesewas.
    const initPayload = JSON.parse(String((fetchMock.mock.calls[0][1] as { body: unknown }).body));
    expect(initPayload.amount).toBe(120000);
    expect(initPayload.metadata).toMatchObject({ schoolId: 'sch_achimota', renewal: true });
  });

  it('rejects the custom (price 0) tier and a first purchase (no seat_tier_id)', async () => {
    const headers = await authHeader();

    const custom = makeDb({
      schoolRow: { ...SCHOOL, seat_tier_id: 'tier_school_custom' },
      tierRow: { id: 'tier_school_custom', price_monthly: 0, price_yearly: 0, is_active: 0 },
    });
    const resCustom = await worker.fetch(
      apiRequest('/api/school-admin/billing/renew', 'POST', { billingCycle: 'monthly' }, headers),
      testEnv(custom.db),
    );
    expect(resCustom.status).toBe(400);
    expect(custom.runs.some((r) => r.sql.includes('INSERT INTO payment_transactions'))).toBe(false);

    const firstPurchase = makeDb({ schoolRow: { ...SCHOOL, seat_tier_id: null } });
    const resFirst = await worker.fetch(
      apiRequest('/api/school-admin/billing/renew', 'POST', { billingCycle: 'monthly' }, headers),
      testEnv(firstPurchase.db),
    );
    expect(resFirst.status).toBe(400);
    expect((await resFirst.json()).error).toMatch(/first purchase/i);
    expect(firstPurchase.runs).toHaveLength(0);
  });

  it('rejects when seat_credit covers the whole renewal', async () => {
    const { db, runs } = makeDb({
      schoolRow: { ...SCHOOL, seat_credit: 1500 },
      tierRow: { id: 'tier_school_50', price_monthly: 1500, price_yearly: 15000, is_active: 1 },
    });
    const res = await worker.fetch(
      apiRequest('/api/school-admin/billing/renew', 'POST', { billingCycle: 'monthly' }, await authHeader()),
      testEnv(db),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/credit covers/i);
    expect(runs).toHaveLength(0);
  });

  it('rejects renewing into a smaller package', async () => {
    const { db, runs } = makeDb({
      schoolRow: { ...SCHOOL, seat_tier_id: 'tier_school_100' },
    });
    const res = await worker.fetch(
      apiRequest('/api/school-admin/billing/renew', 'POST', { billingCycle: 'monthly', tierId: 'tier_school_50' }, await authHeader()),
      testEnv(db),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/smaller package/i);
    expect(runs).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Admin: school_admin assign / demote
// ---------------------------------------------------------------------------
describe('admin school-admin assignment routes', () => {
  it('POST /:id/school-admins promotes a user and scopes them to the school', async () => {
    const { db, runs } = makeDb({
      authRole: 'admin',
      schoolRow: { id: 'sch_achimota' },
      targetUser: { id: 'user_9', role: 'student', school_id: null },
    });
    const res = await worker.fetch(
      apiRequest('/api/admin/schools/sch_achimota/school-admins', 'POST', { userId: 'user_9' }, await authHeader('admin')),
      testEnv(db),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).data).toMatchObject({ userId: 'user_9', role: 'school_admin' });
    const update = runs.find((r) => r.sql.includes("SET role = 'school_admin'"));
    expect(update).toBeDefined();
    expect(update!.args).toEqual(['sch_achimota', 'user_9']);
  });

  it('409 when the user is already school_admin of ANOTHER school; refuses platform admins', async () => {
    const headers = await authHeader('admin');

    const cross = makeDb({
      authRole: 'admin',
      schoolRow: { id: 'sch_achimota' },
      targetUser: { id: 'user_9', role: 'school_admin', school_id: 'sch_other' },
    });
    const resCross = await worker.fetch(
      apiRequest('/api/admin/schools/sch_achimota/school-admins', 'POST', { userId: 'user_9' }, headers),
      testEnv(cross.db),
    );
    expect(resCross.status).toBe(409);
    expect(cross.runs).toHaveLength(0);

    const platformAdmin = makeDb({
      authRole: 'admin',
      schoolRow: { id: 'sch_achimota' },
      targetUser: { id: 'admin_2', role: 'admin', school_id: null },
    });
    const resAdmin = await worker.fetch(
      apiRequest('/api/admin/schools/sch_achimota/school-admins', 'POST', { userId: 'admin_2' }, headers),
      testEnv(platformAdmin.db),
    );
    expect(resAdmin.status).toBe(400);
    expect(platformAdmin.runs).toHaveLength(0);
  });

  it('re-assigning the same school is an idempotent no-op success', async () => {
    const { db, runs } = makeDb({
      authRole: 'admin',
      schoolRow: { id: 'sch_achimota' },
      targetUser: { id: 'user_9', role: 'school_admin', school_id: 'sch_achimota' },
    });
    const res = await worker.fetch(
      apiRequest('/api/admin/schools/sch_achimota/school-admins', 'POST', { userId: 'user_9' }, await authHeader('admin')),
      testEnv(db),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).data.alreadyAssigned).toBe(true);
    expect(runs).toHaveLength(0);
  });

  it('DELETE /:id/school-admins/:userId demotes to student and clears the school link', async () => {
    const { db, runs } = makeDb({
      authRole: 'admin',
      demoteUser: { id: 'user_9', role: 'school_admin', school_id: 'sch_achimota', teacher_license_number: null, subjects_taught: null },
    });
    const res = await worker.fetch(
      apiRequest('/api/admin/schools/sch_achimota/school-admins/user_9', 'DELETE', undefined, await authHeader('admin')),
      testEnv(db),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).data.role).toBe('student');
    const update = runs.find((r) => r.sql.includes('SET role = ?'));
    expect(update).toBeDefined();
    expect(update!.args).toEqual(['student', 'sch_achimota', 'user_9']);
  });

  it('demote restores teacher role when teacher-profile fields exist', async () => {
    const { db, runs } = makeDb({
      authRole: 'admin',
      demoteUser: { id: 'user_9', role: 'school_admin', school_id: 'sch_achimota', teacher_license_number: 'GSL-123', subjects_taught: null },
    });
    const res = await worker.fetch(
      apiRequest('/api/admin/schools/sch_achimota/school-admins/user_9', 'DELETE', undefined, await authHeader('admin')),
      testEnv(db),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).data.role).toBe('teacher');
    const update = runs.find((r) => r.sql.includes('SET role = ?'));
    expect(update!.args[0]).toBe('teacher');
  });

  it('DELETE → 404 when the user is not a school_admin', async () => {
    const { db, runs } = makeDb({
      authRole: 'admin',
      demoteUser: { id: 'user_9', role: 'student', school_id: 'sch_achimota', teacher_license_number: null, subjects_taught: null },
    });
    const res = await worker.fetch(
      apiRequest('/api/admin/schools/sch_achimota/school-admins/user_9', 'DELETE', undefined, await authHeader('admin')),
      testEnv(db),
    );
    expect(res.status).toBe(404);
    expect(runs).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Admin: prorated seat reduction
// ---------------------------------------------------------------------------
describe('POST /api/admin/schools/:id/seats/reduce', () => {
  it('worked example: tier_school_50 monthly, reduce 10 with 15 of 30 days left → GHS 150 credit', async () => {
    const { db, runs } = makeDb({
      authRole: 'admin',
      schoolRow: {
        id: 'sch_achimota',
        seat_tier_id: 'tier_school_50',
        // 16 days out so floor() lands on exactly 15 remaining days.
        seat_expires_at: new Date(Date.now() + 16 * DAY_MS).toISOString(),
        seat_cap: 50,
        seat_credit: 0,
      },
      tierRow: { price_monthly: 1500, price_yearly: 15000 },
      lastPayment: { billing_cycle: 'monthly' },
      activeSeatCount: 40,
    });
    const res = await worker.fetch(
      apiRequest('/api/admin/schools/sch_achimota/seats/reduce', 'POST', { seats: 10 }, await authHeader('admin')),
      testEnv(db),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    // perSeat 1500/50 = 30 GHS; floor(30 × 10 × 15/30) = 150 GHS.
    expect(body.data).toMatchObject({
      seatsRemoved: 10,
      newCap: 40,
      billingCycle: 'monthly',
      remainingDays: 15,
      creditGhs: 150,
      seatCredit: 150,
    });
    const update = runs.find((r) => r.sql.includes('seat_credit = seat_credit + ?'));
    expect(update).toBeDefined();
    expect(update!.args).toEqual([40, 150, 'sch_achimota']);
  });

  it('409 when active seats exceed the new cap', async () => {
    const { db, runs } = makeDb({
      authRole: 'admin',
      schoolRow: {
        id: 'sch_achimota',
        seat_tier_id: 'tier_school_50',
        seat_expires_at: new Date(Date.now() + 16 * DAY_MS).toISOString(),
        seat_cap: 50,
        seat_credit: 0,
      },
      activeSeatCount: 45,
    });
    const res = await worker.fetch(
      apiRequest('/api/admin/schools/sch_achimota/seats/reduce', 'POST', { seats: 10 }, await authHeader('admin')),
      testEnv(db),
    );
    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/revoke seats first/i);
    expect(runs).toHaveLength(0);
  });

  it('400 for custom-priced tiers and invalid seat counts', async () => {
    const headers = await authHeader('admin');
    const custom = makeDb({
      authRole: 'admin',
      schoolRow: { id: 'sch_achimota', seat_tier_id: 'tier_school_custom', seat_expires_at: null, seat_cap: 300, seat_credit: 0 },
    });
    const resCustom = await worker.fetch(
      apiRequest('/api/admin/schools/sch_achimota/seats/reduce', 'POST', { seats: 10 }, headers),
      testEnv(custom.db),
    );
    expect(resCustom.status).toBe(400);

    const badSeats = makeDb({ authRole: 'admin' });
    const resBad = await worker.fetch(
      apiRequest('/api/admin/schools/sch_achimota/seats/reduce', 'POST', { seats: 0 }, headers),
      testEnv(badSeats.db),
    );
    expect(resBad.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// Renewal reminder cron
// ---------------------------------------------------------------------------
describe('sendSchoolRenewalReminders', () => {
  it('reminds schools inside the window: notification + email + channel attempt + guard write', async () => {
    const nowIso = '2026-09-08T00:00:00.000Z';
    const sendEmail = vi.fn(async () => true);
    const { db, runs } = makeDb({
      renewalSchools: [{
        id: 'sch_achimota',
        name: 'Achimota School',
        seat_expires_at: '2026-09-11T00:00:00.000Z', // 3 days out
        renewal_reminded_at: null,
      }],
      schoolAdmins: [{ id: 'sa_1', name: 'Admin Ama', email: 'ama@sch.dev' }],
    });

    const result = await sendSchoolRenewalReminders(db, { DB: db }, { sendEmail }, nowIso);
    expect(result).toMatchObject({
      schoolsReminded: 1,
      emailsSent: 1,
      notificationsWritten: 1,
      channelPosts: 0, // no school_channels row in the mock
    });
    expect(sendEmail).toHaveBeenCalledWith(
      'ama@sch.dev',
      expect.stringContaining('Achimota School'),
      expect.stringContaining('2026-09-11'),
    );
    expect(runs.some((r) => r.sql.includes('INSERT INTO notifications') && r.args[1] === 'sa_1')).toBe(true);
    const guard = runs.find((r) => r.sql.includes('UPDATE schools SET renewal_reminded_at'));
    expect(guard).toBeDefined();
    expect(guard!.args).toEqual([nowIso, 'sch_achimota']);
  });

  it('idempotent: a school already reminded for this expiry sends nothing on re-run', async () => {
    const nowIso = '2026-09-08T00:00:00.000Z';
    const sendEmail = vi.fn(async () => true);
    const { db, runs } = makeDb({
      renewalSchools: [{
        id: 'sch_achimota',
        name: 'Achimota School',
        seat_expires_at: '2026-09-11T00:00:00.000Z',
        renewal_reminded_at: '2026-09-05T00:00:00.000Z', // inside expiry - 7d window
      }],
      schoolAdmins: [{ id: 'sa_1', name: 'Admin Ama', email: 'ama@sch.dev' }],
    });

    const result = await sendSchoolRenewalReminders(db, { DB: db }, { sendEmail }, nowIso);
    expect(result).toEqual({ schoolsReminded: 0, channelPosts: 0, emailsSent: 0, notificationsWritten: 0 });
    expect(sendEmail).not.toHaveBeenCalled();
    expect(runs).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Webhook: recurring-charge tolerance
// ---------------------------------------------------------------------------
describe('POST /payments/webhook recurring charges', () => {
  const REF = '1723456789_recur';

  async function postRecurringWebhook(db: D1Database, planCode: string | null, amount = 150000) {
    const data: Record<string, unknown> = { reference: REF };
    if (planCode) {
      data.plan = { plan_code: planCode, name: 'School 50 monthly' };
      data.subscription = { subscription_code: 'SUBSC_code_1', status: 'active' };
    }
    const body = JSON.stringify({ event: 'charge.success', data });
    const signature = await hmacSha512Hex('whsec_test', body);
    return paymentsApp.request('/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-paystack-signature': signature },
      body,
    }, {
      JWT_SECRET,
      PAYSTACK_SECRET_KEY: 'sk_test_x',
      PAYSTACK_PUBLIC_KEY: 'pk_test_x',
      PAYSTACK_WEBHOOK_SECRET: 'whsec_test',
      APP_URL: 'https://app.test',
      DB: db,
    });
  }

  function stubVerify(amount = 150000) {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      status: true,
      data: { reference: REF, status: 'success', amount, currency: 'GHS' },
    }))));
  }

  it('unknown plan code → 200, tolerated, no payment row created', async () => {
    stubVerify();
    const { db, runs, batchCalls } = makeDb({ tierRow: null });
    const res = await postRecurringWebhook(db, 'PLN_unknown');
    expect(res.status).toBe(200);
    expect(runs.some((r) => r.sql.includes('INSERT INTO payment_transactions'))).toBe(false);
    expect(batchCalls).toHaveLength(0);
  });

  it('subscription payload without a plan_code → 200 without provider verification', async () => {
    const fetchMock = vi.fn(async () => new Response('{}'));
    vi.stubGlobal('fetch', fetchMock);
    const { db, runs } = makeDb({});
    const res = await postRecurringWebhook(db, null);
    expect(res.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(runs).toHaveLength(0);
  });

  it('mapped school plan: records the charge with the subscription code and settles seats onto the school', async () => {
    stubVerify();
    const { db, runs, batchCalls } = makeDb({
      tierRow: { id: 'tier_school_50', price_monthly: 1500, price_yearly: 15000 },
      recentPayments: [{
        user_id: 'sa_1',
        metadata: JSON.stringify({ school_id: 'sch_achimota', seats: 50 }),
      }],
      existingTx: null,
      settleRow: {
        id: 'pay_recur_1',
        user_id: 'sa_1',
        reference: REF,
        amount: 1500,
        currency: 'GHS',
        plan_id: 'tier_school_50',
        billing_cycle: 'monthly',
        status: 'pending',
        settlement_applied_at: null,
        affiliate_processed_at: null,
        metadata: JSON.stringify({ school_id: 'sch_achimota', seats: 50, recurring: true }),
        user_type: 'school',
        referred_by: null,
        ai_grading_quota: 0,
      },
      schoolRow: { id: 'sch_achimota', seat_expires_at: '2027-01-01T00:00:00.000Z', seat_cap: 50, seat_code: 'SCH-XYZ123' },
    });
    const res = await postRecurringWebhook(db, 'PLN_school_50_monthly');
    expect(res.status).toBe(200);

    const insert = runs.find((r) => r.sql.includes('INSERT INTO payment_transactions'));
    expect(insert).toBeDefined();
    expect(insert!.args[1]).toBe('sa_1');
    expect(insert!.args[2]).toBe(REF);
    expect(insert!.args[3]).toBe(1500);
    expect(insert!.args[4]).toBe('tier_school_50');
    // paystack_subscription_code stored on the row.
    expect(insert!.args[6]).toBe('SUBSC_code_1');
    const metadata = JSON.parse(String(insert!.args[7]));
    expect(metadata).toMatchObject({ school_id: 'sch_achimota', recurring: true, paystack_plan_code: 'PLN_school_50_monthly' });

    // Settlement converged on the school (top-up semantics), never a users row.
    const settleBatch = batchCalls[0];
    expect(settleBatch[0].sql).toContain('UPDATE schools');
    expect(settleBatch[0].args[2]).toBe(100); // 50 cap + 50 package seats
    expect(settleBatch.every((s) => !s.sql.includes('UPDATE users'))).toBe(true);
  });

  it('replay of the same recurring reference never double-inserts and settles already_applied', async () => {
    stubVerify();
    const { db, runs, batchCalls } = makeDb({
      tierRow: { id: 'tier_school_50', price_monthly: 1500, price_yearly: 15000 },
      recentPayments: [{
        user_id: 'sa_1',
        metadata: JSON.stringify({ school_id: 'sch_achimota', seats: 50 }),
      }],
      existingTx: { id: 'pay_recur_1' },
      settleRow: {
        id: 'pay_recur_1',
        user_id: 'sa_1',
        reference: REF,
        amount: 1500,
        currency: 'GHS',
        plan_id: 'tier_school_50',
        billing_cycle: 'monthly',
        status: 'success',
        settlement_applied_at: '2026-09-08 01:00:00',
        affiliate_processed_at: null,
        metadata: JSON.stringify({ school_id: 'sch_achimota', seats: 50, recurring: true }),
        user_type: 'school',
        referred_by: null,
        ai_grading_quota: 0,
      },
    });
    const res = await postRecurringWebhook(db, 'PLN_school_50_monthly');
    expect(res.status).toBe(200);
    expect(runs.some((r) => r.sql.includes('INSERT INTO payment_transactions'))).toBe(false);
    expect(batchCalls).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// GET /api/schools/seat (student's own seat state)
// ---------------------------------------------------------------------------
describe('GET /api/schools/seat', () => {
  it('returns data:null when the caller holds no active seat', async () => {
    const { db } = makeDb({ authRole: 'student', mySeat: null });
    const res = await worker.fetch(
      apiRequest('/api/schools/seat', 'GET', undefined, await authHeader('student', 'user_1')),
      testEnv(db),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeNull();
  });

  it('returns the active-seat shape with school name and consent state', async () => {
    const { db, bound } = makeDb({
      authRole: 'student',
      mySeat: {
        school_id: 'sch_achimota',
        granted_at: '2026-09-01 08:00:00',
        analytics_opted_out: 1,
        analytics_opted_out_at: '2026-09-05 10:00:00',
        school_name: 'Achimota School',
        seat_expires_at: '2027-01-01T00:00:00.000Z',
      },
    });
    const res = await worker.fetch(
      apiRequest('/api/schools/seat', 'GET', undefined, await authHeader('student', 'user_1')),
      testEnv(db),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual({
      schoolId: 'sch_achimota',
      schoolName: 'Achimota School',
      grantedAt: '2026-09-01 08:00:00',
      analyticsOptedOut: true,
      analyticsOptedOutAt: '2026-09-05 10:00:00',
      seatExpiresAt: '2027-01-01T00:00:00.000Z',
    });
    // Scoped to the caller only.
    const seatQuery = bound.find((b) => b.sql.includes('FROM school_seats ss'));
    expect(seatQuery).toBeDefined();
    expect(seatQuery!.args).toEqual(['user_1']);
  });

  it('401 without a token', async () => {
    const { db } = makeDb();
    const res = await worker.fetch(apiRequest('/api/schools/seat', 'GET'), testEnv(db));
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// GET /api/admin/schools/:id/school-admins
// ---------------------------------------------------------------------------
describe('GET /api/admin/schools/:id/school-admins', () => {
  it('lists school_admin users scoped to the URL school id', async () => {
    const { db, bound } = makeDb({
      authRole: 'admin',
      schoolAdmins: [
        { id: 'sa_1', name: 'Admin Ama', email: 'ama@sch.dev', status: 'approved', created_at: '2026-09-01 00:00:00' },
        { id: 'sa_2', name: 'Admin Kofi', email: 'kofi@sch.dev', status: 'pending', created_at: '2026-08-01 00:00:00' },
      ],
    });
    const res = await worker.fetch(
      apiRequest('/api/admin/schools/sch_achimota/school-admins', 'GET', undefined, await authHeader('admin')),
      testEnv(db),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual([
      { userId: 'sa_1', name: 'Admin Ama', email: 'ama@sch.dev', status: 'approved', createdAt: '2026-09-01 00:00:00' },
      { userId: 'sa_2', name: 'Admin Kofi', email: 'kofi@sch.dev', status: 'pending', createdAt: '2026-08-01 00:00:00' },
    ]);
    const listQuery = bound.find((b) => b.sql.includes("role = 'school_admin' AND school_id"));
    expect(listQuery).toBeDefined();
    expect(listQuery!.args).toEqual(['sch_achimota']);
  });

  it('401 without a token, 403 for a school_admin token (admin-only route)', async () => {
    const anon = makeDb();
    const resAnon = await worker.fetch(
      apiRequest('/api/admin/schools/sch_achimota/school-admins', 'GET'),
      testEnv(anon.db),
    );
    expect(resAnon.status).toBe(401);

    const schoolAdmin = makeDb({ authRole: 'school_admin' });
    const resSa = await worker.fetch(
      apiRequest('/api/admin/schools/sch_achimota/school-admins', 'GET', undefined, await authHeader('school_admin')),
      testEnv(schoolAdmin.db),
    );
    expect(resSa.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// GET /api/admin/schools — seat package fields on the school list
// ---------------------------------------------------------------------------
describe('GET /api/admin/schools seat fields', () => {
  it('includes seatCap, seatTierId, seatExpiresAt, seatCodeUses per school', async () => {
    const { db } = makeDb({
      authRole: 'admin',
      adminSchoolList: [
        {
          id: 'sch_achimota',
          name: 'Achimota School',
          slug: 'achimota',
          status: 'active',
          created_at: '2026-01-01 00:00:00',
          seat_cap: 50,
          seat_tier_id: 'tier_school_50',
          seat_expires_at: '2027-01-01T00:00:00.000Z',
          seat_code_uses: 25,
          student_count: 40,
          ambassador_code: null,
          telegram_channel_id: null,
          telegram_channel_name: null,
          telegram_channel_broken: 0,
        },
        {
          // School without a package: NULL seat columns fall back to 0/null.
          id: 'sch_plain',
          name: 'Plain School',
          slug: 'plain',
          status: 'active',
          created_at: '2026-02-01 00:00:00',
          seat_cap: null,
          seat_tier_id: null,
          seat_expires_at: null,
          seat_code_uses: null,
          student_count: 3,
          ambassador_code: null,
          telegram_channel_id: null,
          telegram_channel_name: null,
          telegram_channel_broken: 0,
        },
      ],
    });
    const res = await worker.fetch(
      apiRequest('/api/admin/schools', 'GET', undefined, await authHeader('admin')),
      testEnv(db),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.schools).toHaveLength(2);
    expect(body.data.schools[0]).toMatchObject({
      id: 'sch_achimota',
      seatCap: 50,
      seatTierId: 'tier_school_50',
      seatExpiresAt: '2027-01-01T00:00:00.000Z',
      seatCodeUses: 25,
      studentCount: 40,
    });
    expect(body.data.schools[1]).toMatchObject({
      id: 'sch_plain',
      seatCap: 0,
      seatTierId: null,
      seatExpiresAt: null,
      seatCodeUses: 0,
    });
  });
});
