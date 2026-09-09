import { describe, it, expect, vi } from 'vitest';
import { sign } from 'hono/jwt';
import worker from '../index';
import {
  settleSchoolSeatPayment,
  expireLapsedSchoolSeats,
  resolveRestoredEntitlement,
  generateSeatCode,
  SCHOOL_TIER_SEATS,
} from '../school-seats';

// School seat packages (Phase 1) — spec:
// docs/plans/2026-09-08-school-subscriptions.md
//
// Mock pattern copied from admin-schools.test.ts: prepare().bind() captures
// sql+args, batch() records each batch's statements and returns per-statement
// results, run() outside batches is logged in `runs`.

const JWT_SECRET = 'test-secret';

interface CapturedStatement {
  sql: string;
  args: unknown[];
}

const SCHOOL = {
  id: 'sch_achimota',
  name: 'Achimota School',
  status: 'active',
  seat_tier_id: 'tier_school_25',
  seat_expires_at: '2027-01-01T00:00:00.000Z',
  seat_code: 'SCH-ABC123',
  seat_code_uses: 3,
  seat_cap: 25,
};

const FREE_STUDENT = {
  id: 'user_1',
  role: 'student',
  school_id: null,
  subscription_tier_id: null,
  subscription_expires_at: null,
  trial_expires_at: null,
};

interface DbOptions {
  authRole?: 'admin' | 'student' | 'teacher';
  // Redeem-path user row (role/school_id/tier/expiry lookup).
  userRow?: unknown;
  // School row for `WHERE seat_code = ?`.
  schoolByCode?: unknown;
  // Existing active seat (redeem re-check).
  existingSeat?: unknown;
  // COUNT(*) of active seats.
  activeSeatCount?: number;
  // meta.changes for the guarded seat_code_uses increment (cap race).
  claimChanges?: number;
  // Generic school row for `WHERE id = ?` lookups.
  schoolRow?: unknown;
  // School tier row for the subscription_tiers lookup (admin purchase).
  tierRow?: unknown;
  // Existing payment_transactions row for `WHERE reference = ?`.
  existingTx?: unknown;
  // Seat list rows (admin GET seats) / cron per-school seat rows.
  seatRows?: unknown[];
  lapsedSeats?: unknown[];
  // Cron: lapsed schools list.
  lapsedSchools?: unknown[];
  // releaseSchoolSeat lookups.
  releaseSeat?: unknown;
  userEntitlement?: unknown;
  schoolSeatFields?: unknown;
  // Per-statement meta.changes returned by batch().
  batchChanges?: number[];
}

function makeDb(opts: DbOptions = {}) {
  const batchCalls: CapturedStatement[][] = [];
  const runs: CapturedStatement[] = [];
  const prepareCalls: string[] = [];

  const stmtFor = (sql: string, args: unknown[]) => ({
    sql,
    args,
    first: vi.fn().mockImplementation(() => {
      // Auth middleware per-request users lookup.
      if (sql.includes('role, status, is_active, session_version FROM users')) {
        return Promise.resolve({
          role: opts.authRole ?? 'student',
          status: 'approved',
          is_active: 1,
        });
      }
      // Redeem-path full user row (has trial_expires_at in the SELECT).
      if (sql.includes('trial_expires_at') && sql.includes('FROM users')) {
        return Promise.resolve(opts.userRow ?? null);
      }
      // Entitlement-only user lookup (release path).
      if (sql.includes('subscription_tier_id, subscription_expires_at FROM users')) {
        return Promise.resolve(opts.userEntitlement ?? null);
      }
      // School by seat code (redeem).
      if (sql.includes('FROM schools') && sql.includes('seat_code = ?')) {
        return Promise.resolve(opts.schoolByCode ?? null);
      }
      // School seat fields (release path).
      if (sql.includes('SELECT seat_tier_id, seat_expires_at FROM schools')) {
        return Promise.resolve(opts.schoolSeatFields ?? null);
      }
      // Any other schools-by-id lookup.
      if (sql.includes('FROM schools') && sql.includes('WHERE id = ?')) {
        return Promise.resolve(opts.schoolRow ?? null);
      }
      // releaseSchoolSeat's active-seat lookup carries prior_tier_id.
      if (sql.includes('FROM school_seats') && sql.includes('prior_tier_id')) {
        return Promise.resolve(opts.releaseSeat ?? null);
      }
      if (sql.includes('COUNT(*) AS n FROM school_seats')) {
        return Promise.resolve({ n: opts.activeSeatCount ?? 0 });
      }
      // Redeem re-check for an existing active seat.
      if (sql.includes('FROM school_seats') && sql.includes("status = 'active'")) {
        return Promise.resolve(opts.existingSeat ?? null);
      }
      if (sql.includes('FROM subscription_tiers')) {
        return Promise.resolve(opts.tierRow ?? null);
      }
      if (sql.includes('FROM payment_transactions')) {
        return Promise.resolve(opts.existingTx ?? null);
      }
      return Promise.resolve(null);
    }),
    all: vi.fn().mockImplementation(() => {
      if (sql.includes('FROM schools') && sql.includes('seat_expires_at IS NOT NULL')) {
        return Promise.resolve({ results: opts.lapsedSchools ?? [] });
      }
      if (sql.includes('FROM school_seats ss') && sql.includes('u.subscription_tier_id')) {
        return Promise.resolve({ results: opts.lapsedSeats ?? [] });
      }
      if (sql.includes('FROM school_seats ss')) {
        return Promise.resolve({ results: opts.seatRows ?? [] });
      }
      return Promise.resolve({ results: [] });
    }),
    run: vi.fn().mockImplementation(() => {
      runs.push({ sql, args });
      const changes = sql.includes('seat_code_uses = seat_code_uses + 1')
        ? (opts.claimChanges ?? 1)
        : 1;
      return Promise.resolve({ success: true, meta: { changes } });
    }),
  });

  const db = {
    prepare: vi.fn((sql: string) => {
      prepareCalls.push(sql);
      return {
        sql,
        ...stmtFor(sql, []),
        bind: (...args: unknown[]) => stmtFor(sql, args),
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

  return { db, batchCalls, runs, prepareCalls };
}

async function authHeader(role: 'admin' | 'student' | 'teacher' = 'student') {
  const token = await sign(
    {
      userId: role === 'admin' ? 'admin_1' : 'user_1',
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

// ---------------------------------------------------------------------------
// Code redemption state machine
// ---------------------------------------------------------------------------
describe('POST /api/schools/redeem-code', () => {
  it('valid code under cap grants the seat, snapshots prior (free) entitlement, extends coverage', async () => {
    const { db, batchCalls, runs } = makeDb({ userRow: FREE_STUDENT, schoolByCode: SCHOOL });
    const res = await worker.fetch(
      apiRequest('/api/schools/redeem-code', 'POST', { code: 'sch-abc123' }, await authHeader('student')),
      { DB: db, JWT_SECRET },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toMatchObject({
      schoolId: 'sch_achimota',
      alreadySeated: false,
      extended: true,
    });

    // Cap was claimed atomically.
    const claim = runs.find((r) => r.sql.includes('seat_code_uses = seat_code_uses + 1'));
    expect(claim).toBeDefined();
    expect(claim!.args[0]).toBe('sch_achimota');

    // One batch: seat insert + users update.
    expect(batchCalls).toHaveLength(1);
    const [seatInsert, userUpdate] = batchCalls[0];
    expect(seatInsert.sql).toContain('INSERT INTO school_seats');
    // Snapshot: free user → tier_free / NULL (spec edge case).
    expect(seatInsert.args[3]).toBe('tier_free');
    expect(seatInsert.args[4]).toBeNull();
    expect(userUpdate.sql).toContain('subscription_tier_id');
    expect(userUpdate.args).toEqual(['sch_achimota', 'tier_school_25', SCHOOL.seat_expires_at, 'user_1']);
  });

  it('unknown code → 404, no claim, no batch', async () => {
    const { db, batchCalls, runs } = makeDb({ userRow: FREE_STUDENT, schoolByCode: null });
    const res = await worker.fetch(
      apiRequest('/api/schools/redeem-code', 'POST', { code: 'SCH-NOPE99' }, await authHeader()),
      { DB: db, JWT_SECRET },
    );
    expect(res.status).toBe(404);
    expect(batchCalls).toHaveLength(0);
    expect(runs.some((r) => r.sql.includes('seat_code_uses'))).toBe(false);
  });

  it('exhausted cap → 409, no claim attempted', async () => {
    const { db, batchCalls, runs } = makeDb({
      userRow: FREE_STUDENT,
      schoolByCode: { ...SCHOOL, seat_code_uses: 25 },
    });
    const res = await worker.fetch(
      apiRequest('/api/schools/redeem-code', 'POST', { code: 'SCH-ABC123' }, await authHeader()),
      { DB: db, JWT_SECRET },
    );
    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/full/);
    expect(runs.some((r) => r.sql.includes('seat_code_uses'))).toBe(false);
    expect(batchCalls).toHaveLength(0);
  });

  it('active-seat count at cap → 409 even when the counter is behind (reconcile-on-write)', async () => {
    const { db, batchCalls } = makeDb({
      userRow: FREE_STUDENT,
      schoolByCode: { ...SCHOOL, seat_code_uses: 3 },
      activeSeatCount: 25,
    });
    const res = await worker.fetch(
      apiRequest('/api/schools/redeem-code', 'POST', { code: 'SCH-ABC123' }, await authHeader()),
      { DB: db, JWT_SECRET },
    );
    expect(res.status).toBe(409);
    expect(batchCalls).toHaveLength(0);
  });

  it('cap race: guarded claim matches 0 rows → 409, no seat written', async () => {
    const { db, batchCalls } = makeDb({
      userRow: FREE_STUDENT,
      schoolByCode: SCHOOL,
      claimChanges: 0,
    });
    const res = await worker.fetch(
      apiRequest('/api/schools/redeem-code', 'POST', { code: 'SCH-ABC123' }, await authHeader()),
      { DB: db, JWT_SECRET },
    );
    expect(res.status).toBe(409);
    expect(batchCalls).toHaveLength(0);
  });

  it('already-seated re-redeem → no-op success, no duplicate row', async () => {
    const { db, batchCalls, runs } = makeDb({
      userRow: { ...FREE_STUDENT, school_id: 'sch_achimota' },
      schoolByCode: SCHOOL,
      existingSeat: { id: 'seat_existing' },
    });
    const res = await worker.fetch(
      apiRequest('/api/schools/redeem-code', 'POST', { code: 'SCH-ABC123' }, await authHeader()),
      { DB: db, JWT_SECRET },
    );
    expect(res.status).toBe(200);
    expect((await res.json()).data.alreadySeated).toBe(true);
    expect(batchCalls).toHaveLength(0);
    expect(runs.some((r) => r.sql.includes('seat_code_uses'))).toBe(false);
  });

  it('non-student (teacher) → 403', async () => {
    const { db, batchCalls } = makeDb({
      authRole: 'teacher',
      userRow: { ...FREE_STUDENT, role: 'teacher' },
      schoolByCode: SCHOOL,
    });
    const res = await worker.fetch(
      apiRequest('/api/schools/redeem-code', 'POST', { code: 'SCH-ABC123' }, await authHeader('teacher')),
      { DB: db, JWT_SECRET },
    );
    expect(res.status).toBe(403);
    expect(batchCalls).toHaveLength(0);
  });

  it('lapsed school package → 410', async () => {
    const { db, batchCalls } = makeDb({
      userRow: FREE_STUDENT,
      schoolByCode: { ...SCHOOL, seat_expires_at: '2020-01-01T00:00:00.000Z' },
    });
    const res = await worker.fetch(
      apiRequest('/api/schools/redeem-code', 'POST', { code: 'SCH-ABC123' }, await authHeader()),
      { DB: db, JWT_SECRET },
    );
    expect(res.status).toBe(410);
    expect(batchCalls).toHaveLength(0);
  });

  it('student linked to another school → 409 (no silent school-hop)', async () => {
    const { db, batchCalls } = makeDb({
      userRow: { ...FREE_STUDENT, school_id: 'sch_other' },
      schoolByCode: SCHOOL,
    });
    const res = await worker.fetch(
      apiRequest('/api/schools/redeem-code', 'POST', { code: 'SCH-ABC123' }, await authHeader()),
      { DB: db, JWT_SECRET },
    );
    expect(res.status).toBe(409);
    expect(batchCalls).toHaveLength(0);
  });

  it('invalid code format → 400 without any DB work beyond auth', async () => {
    const { db, batchCalls, runs } = makeDb({ userRow: FREE_STUDENT });
    const res = await worker.fetch(
      apiRequest('/api/schools/redeem-code', 'POST', { code: 'x' }, await authHeader()),
      { DB: db, JWT_SECRET },
    );
    expect(res.status).toBe(400);
    expect(batchCalls).toHaveLength(0);
    expect(runs).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Conflict rule (decision 6): extend-only + snapshot restore
// ---------------------------------------------------------------------------
describe('conflict rule: individual sub vs school seat', () => {
  it('individual paid student with LATER expiry keeps it — seat granted, tier untouched', async () => {
    const paid = {
      ...FREE_STUDENT,
      subscription_tier_id: 'tier_premium',
      subscription_expires_at: '2028-06-01T00:00:00.000Z', // after school expiry
    };
    const { db, batchCalls } = makeDb({ userRow: paid, schoolByCode: SCHOOL });
    const res = await worker.fetch(
      apiRequest('/api/schools/redeem-code', 'POST', { code: 'SCH-ABC123' }, await authHeader()),
      { DB: db, JWT_SECRET },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.extended).toBe(false);

    const [seatInsert, userUpdate] = batchCalls[0];
    // Snapshot still records the individual entitlement.
    expect(seatInsert.args[3]).toBe('tier_premium');
    expect(seatInsert.args[4]).toBe('2028-06-01T00:00:00.000Z');
    // Users update sets school_id only — no entitlement overwrite.
    expect(userUpdate.sql).not.toContain('subscription_tier_id');
    expect(userUpdate.args).toEqual(['sch_achimota', 'user_1']);
  });

  it('individual paid student with EARLIER expiry is extended, prior values snapshotted', async () => {
    const paid = {
      ...FREE_STUDENT,
      subscription_tier_id: 'tier_premium',
      subscription_expires_at: '2026-10-01T00:00:00.000Z',
    };
    const { db, batchCalls } = makeDb({ userRow: paid, schoolByCode: SCHOOL });
    const res = await worker.fetch(
      apiRequest('/api/schools/redeem-code', 'POST', { code: 'SCH-ABC123' }, await authHeader()),
      { DB: db, JWT_SECRET },
    );
    expect(res.status).toBe(200);
    expect((await res.json()).data.extended).toBe(true);

    const [seatInsert, userUpdate] = batchCalls[0];
    expect(seatInsert.args[3]).toBe('tier_premium');
    expect(seatInsert.args[4]).toBe('2026-10-01T00:00:00.000Z');
    expect(userUpdate.args).toEqual(['sch_achimota', 'tier_school_25', SCHOOL.seat_expires_at, 'user_1']);
  });

  it('active trial counts as effective coverage — a longer trial is not shortened', async () => {
    const trialing = {
      ...FREE_STUDENT,
      trial_expires_at: '2027-06-01T00:00:00.000Z', // after school expiry
    };
    const { db, batchCalls } = makeDb({ userRow: trialing, schoolByCode: SCHOOL });
    const res = await worker.fetch(
      apiRequest('/api/schools/redeem-code', 'POST', { code: 'SCH-ABC123' }, await authHeader()),
      { DB: db, JWT_SECRET },
    );
    expect(res.status).toBe(200);
    expect((await res.json()).data.extended).toBe(false);
    expect(batchCalls[0][1].sql).not.toContain('subscription_tier_id');
  });
});

describe('resolveRestoredEntitlement (better of snapshot vs current)', () => {
  const school = { seat_tier_id: 'tier_school_25', seat_expires_at: '2027-01-01T00:00:00.000Z' };

  it('coverage that IS the seat → restore the snapshot exactly', () => {
    const out = resolveRestoredEntitlement(
      { prior_tier_id: 'tier_premium', prior_expires_at: '2026-10-01T00:00:00.000Z' },
      { subscription_tier_id: 'tier_school_25', subscription_expires_at: '2027-01-01T00:00:00.000Z' },
      school,
    );
    expect(out).toEqual({
      write: true,
      tierId: 'tier_premium',
      expiresAt: '2026-10-01T00:00:00.000Z',
    });
  });

  it('free-user snapshot restores tier_free + NULL', () => {
    const out = resolveRestoredEntitlement(
      { prior_tier_id: 'tier_free', prior_expires_at: null },
      { subscription_tier_id: 'tier_school_25', subscription_expires_at: '2027-01-01T00:00:00.000Z' },
      school,
    );
    expect(out).toEqual({ write: true, tierId: 'tier_free', expiresAt: null });
  });

  it('individually upgraded after joining (later expiry) → keep current, no write', () => {
    const out = resolveRestoredEntitlement(
      { prior_tier_id: 'tier_free', prior_expires_at: null },
      { subscription_tier_id: 'tier_premium', subscription_expires_at: '2028-01-01T00:00:00.000Z' },
      school,
    );
    expect(out.write).toBe(false);
  });

  it('current expiry earlier than snapshot → snapshot wins', () => {
    const out = resolveRestoredEntitlement(
      { prior_tier_id: 'tier_premium', prior_expires_at: '2027-06-01T00:00:00.000Z' },
      { subscription_tier_id: 'tier_premium', subscription_expires_at: '2026-12-01T00:00:00.000Z' },
      school,
    );
    expect(out).toEqual({
      write: true,
      tierId: 'tier_premium',
      expiresAt: '2027-06-01T00:00:00.000Z',
    });
  });
});

// ---------------------------------------------------------------------------
// Lapse cron job
// ---------------------------------------------------------------------------
describe('expireLapsedSchoolSeats', () => {
  it('lapsed school: all active seats restored to snapshot + marked expired', async () => {
    const { db, batchCalls } = makeDb({
      lapsedSchools: [{
        id: 'sch_achimota',
        seat_tier_id: 'tier_school_25',
        seat_expires_at: '2026-09-01T00:00:00.000Z',
        seat_code_uses: 2,
      }],
      lapsedSeats: [
        {
          id: 'seat_1',
          user_id: 'user_paid',
          prior_tier_id: 'tier_premium',
          prior_expires_at: '2026-10-01T00:00:00.000Z',
          subscription_tier_id: 'tier_school_25',
          subscription_expires_at: '2026-09-01T00:00:00.000Z',
        },
        {
          id: 'seat_2',
          user_id: 'user_free',
          prior_tier_id: 'tier_free',
          prior_expires_at: null,
          subscription_tier_id: 'tier_school_25',
          subscription_expires_at: '2026-09-01T00:00:00.000Z',
        },
      ],
    });
    const result = await expireLapsedSchoolSeats(db, '2026-09-08T00:00:00.000Z');
    expect(result.schoolsProcessed).toBe(1);
    expect(result.seatsExpired).toBe(2);
    expect(result.mismatches).toHaveLength(0);

    expect(batchCalls).toHaveLength(1);
    const batch = batchCalls[0];
    // 2 seats × (seat expire + user restore) = 4 statements.
    expect(batch).toHaveLength(4);
    expect(batch[0].sql).toContain("SET status = 'expired'");
    expect(batch[0].args).toEqual(['seat_1']);
    // Paid prior restored exactly.
    expect(batch[1].args).toEqual(['tier_premium', '2026-10-01T00:00:00.000Z', 'user_paid']);
    // Free prior restored as tier_free + NULL.
    expect(batch[3].args).toEqual(['tier_free', null, 'user_free']);
    // Lapse restores entitlement only — membership (school_id) is untouched.
    expect(batch[1].sql).not.toContain('school_id');
  });

  it('seat-holder who upgraded individually after joining keeps the upgrade on lapse', async () => {
    const { db, batchCalls } = makeDb({
      lapsedSchools: [{
        id: 'sch_achimota',
        seat_tier_id: 'tier_school_25',
        seat_expires_at: '2026-09-01T00:00:00.000Z',
        seat_code_uses: 1,
      }],
      lapsedSeats: [{
        id: 'seat_1',
        user_id: 'user_upgraded',
        prior_tier_id: 'tier_free',
        prior_expires_at: null,
        subscription_tier_id: 'tier_premium',
        subscription_expires_at: '2027-05-01T00:00:00.000Z',
      }],
    });
    const result = await expireLapsedSchoolSeats(db, '2026-09-08T00:00:00.000Z');
    expect(result.seatsExpired).toBe(1);
    const batch = batchCalls[0];
    // Only the seat flip — no users write.
    expect(batch).toHaveLength(1);
    expect(batch[0].sql).toContain("SET status = 'expired'");
  });

  it('idempotent: second run finds no lapsed schools → no writes', async () => {
    const { db, batchCalls, runs } = makeDb({ lapsedSchools: [] });
    const result = await expireLapsedSchoolSeats(db, '2026-09-08T00:00:00.000Z');
    expect(result).toEqual({ schoolsProcessed: 0, seatsExpired: 0, mismatches: [] });
    expect(batchCalls).toHaveLength(0);
    expect(runs).toHaveLength(0);
  });

  it('logs seat_code_uses vs active-seat drift (spec risk 1)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { db } = makeDb({
      lapsedSchools: [{
        id: 'sch_achimota',
        seat_tier_id: 'tier_school_25',
        seat_expires_at: '2026-09-01T00:00:00.000Z',
        seat_code_uses: 5,
      }],
      lapsedSeats: [{
        id: 'seat_1',
        user_id: 'user_1',
        prior_tier_id: 'tier_free',
        prior_expires_at: null,
        subscription_tier_id: 'tier_school_25',
        subscription_expires_at: '2026-09-01T00:00:00.000Z',
      }],
    });
    const result = await expireLapsedSchoolSeats(db, '2026-09-08T00:00:00.000Z');
    expect(result.mismatches).toEqual([{ schoolId: 'sch_achimota', codeUses: 5, activeCount: 1 }]);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('mismatch'));
    warn.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// Settlement: school-tier payment grants seats to the SCHOOL, not the payer
// ---------------------------------------------------------------------------
describe('settleSchoolSeatPayment', () => {
  const tx = {
    id: 'pay_1',
    reference: 'MANUAL_TEST_1',
    user_id: 'admin_1',
    amount: 875,
    currency: 'GHS',
    plan_id: 'tier_school_25',
    billing_cycle: 'monthly' as const,
    status: 'pending',
    settlement_applied_at: null,
    metadata: JSON.stringify({ school_id: 'sch_achimota', seats: 25, manual: true }),
  };

  it('applies: updates the schools row only; no users write', async () => {
    const { db, batchCalls } = makeDb({
      schoolRow: { id: 'sch_achimota', seat_expires_at: null, seat_cap: 0, seat_code: null },
    });
    const result = await settleSchoolSeatPayment(db, tx);
    expect(result.outcome).toBe('applied');
    expect(result.schoolId).toBe('sch_achimota');
    expect(result.seatCap).toBe(25);
    expect(typeof result.seatExpiresAt).toBe('string');

    expect(batchCalls).toHaveLength(1);
    const [schoolUpdate, paymentUpdate] = batchCalls[0];
    expect(schoolUpdate.sql).toContain('UPDATE schools');
    expect(schoolUpdate.sql).toContain('seat_cap');
    expect(schoolUpdate.args[0]).toBe('tier_school_25');
    expect(schoolUpdate.args[2]).toBe(25);
    // Code minted on first purchase.
    expect(String(schoolUpdate.args[3])).toMatch(/^SCH-/);
    expect(paymentUpdate.sql).toContain("SET status = 'success'");
    expect(paymentUpdate.sql).toContain('settlement_applied_at');
    // The payer's users row is never touched.
    expect(batchCalls[0].every((s) => !s.sql.includes('UPDATE users'))).toBe(true);
  });

  it('top-up before expiry: cap grows, expiry extends from the current seat_expires_at, code kept', async () => {
    const { db, batchCalls } = makeDb({
      schoolRow: {
        id: 'sch_achimota',
        seat_expires_at: '2027-06-01T00:00:00.000Z',
        seat_cap: 25,
        seat_code: 'SCH-EXISTING',
      },
    });
    const topUp = {
      ...tx,
      reference: 'MANUAL_TEST_2',
      metadata: JSON.stringify({ school_id: 'sch_achimota', seats: 25 }),
    };
    const result = await settleSchoolSeatPayment(db, topUp);
    expect(result.outcome).toBe('applied');
    expect(result.seatCap).toBe(50);
    // +1 month from the existing (future) expiry, not from now.
    expect(result.seatExpiresAt).toBe('2027-07-01T00:00:00.000Z');
    const [schoolUpdate] = batchCalls[0];
    expect(schoolUpdate.sql).toContain('COALESCE(seat_code, ?)');
    expect(schoolUpdate.args[3]).toBe('SCH-EXISTING');
  });

  it('idempotent replay: settled reference → already_applied, zero writes', async () => {
    const { db, batchCalls, runs } = makeDb({});
    const settled = { ...tx, status: 'success', settlement_applied_at: '2026-09-08 01:00:00' };
    const result = await settleSchoolSeatPayment(db, settled);
    expect(result.outcome).toBe('already_applied');
    expect(batchCalls).toHaveLength(0);
    expect(runs).toHaveLength(0);
  });

  it('guard race: settlement UPDATE matches 0 rows → already_applied', async () => {
    const { db } = makeDb({
      schoolRow: { id: 'sch_achimota', seat_expires_at: null, seat_cap: 0, seat_code: null },
      batchChanges: [1, 0],
    });
    const result = await settleSchoolSeatPayment(db, tx);
    expect(result.outcome).toBe('already_applied');
  });

  it('missing school_id in metadata or unknown school → not_found', async () => {
    const noMeta = makeDb({});
    const r1 = await settleSchoolSeatPayment(noMeta.db, { ...tx, metadata: null });
    expect(r1.outcome).toBe('not_found');

    const noSchool = makeDb({ schoolRow: null });
    const r2 = await settleSchoolSeatPayment(noSchool.db, tx);
    expect(r2.outcome).toBe('not_found');
    expect(noSchool.batchCalls).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Admin routes
// ---------------------------------------------------------------------------
describe('admin school seat routes', () => {
  it('POST /seats/purchase records the payment and settles seats onto the school', async () => {
    const { db, batchCalls, runs } = makeDb({
      authRole: 'admin',
      schoolRow: { id: 'sch_achimota', seat_expires_at: null, seat_cap: 0, seat_code: null },
      tierRow: { id: 'tier_school_25', price_monthly: 875, price_yearly: 8750, is_active: 1 },
    });
    const res = await worker.fetch(
      apiRequest('/api/admin/schools/sch_achimota/seats/purchase', 'POST',
        { tierId: 'tier_school_25', billingCycle: 'yearly' }, await authHeader('admin')),
      { DB: db, JWT_SECRET },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toMatchObject({ schoolId: 'sch_achimota', seats: 25, seatCap: 25 });

    // payment_transactions row recorded with school metadata, marked payer = admin.
    const insert = runs.find((r) => r.sql.includes('INSERT INTO payment_transactions'));
    expect(insert).toBeDefined();
    expect(insert!.args[1]).toBe('admin_1');
    expect(insert!.args[3]).toBe(8750); // yearly package price
    expect(insert!.args[4]).toBe('tier_school_25');
    const metadata = JSON.parse(String(insert!.args[6]));
    expect(metadata).toMatchObject({ school_id: 'sch_achimota', seats: 25, manual: true });

    // Settlement batch updated the school, never a user.
    const settleBatch = batchCalls[0];
    expect(settleBatch[0].sql).toContain('UPDATE schools');
    expect(settleBatch.every((s) => !s.sql.includes('UPDATE users'))).toBe(true);
  });

  it('POST /seats/purchase rejects non-school tiers, custom tier without amount/seats, unknown school', async () => {
    const headers = await authHeader('admin');

    const studentTier = makeDb({
      authRole: 'admin',
      schoolRow: { id: 'sch_achimota', seat_expires_at: null, seat_cap: 0, seat_code: null },
      tierRow: null, // user_type != 'school' rows are filtered out by the query
    });
    const resTier = await worker.fetch(
      apiRequest('/api/admin/schools/sch_achimota/seats/purchase', 'POST',
        { tierId: 'tier_premium', billingCycle: 'monthly' }, headers),
      { DB: studentTier.db, JWT_SECRET },
    );
    expect(resTier.status).toBe(400);
    expect(studentTier.runs.some((r) => r.sql.includes('INSERT INTO payment_transactions'))).toBe(false);

    const custom = makeDb({
      authRole: 'admin',
      schoolRow: { id: 'sch_achimota', seat_expires_at: null, seat_cap: 0, seat_code: null },
      tierRow: { id: 'tier_school_custom', price_monthly: 0, price_yearly: 0, is_active: 0 },
    });
    const resCustom = await worker.fetch(
      apiRequest('/api/admin/schools/sch_achimota/seats/purchase', 'POST',
        { tierId: 'tier_school_custom', billingCycle: 'yearly' }, headers),
      { DB: custom.db, JWT_SECRET },
    );
    expect(resCustom.status).toBe(400);

    const noSchool = makeDb({ authRole: 'admin', schoolRow: null });
    const res404 = await worker.fetch(
      apiRequest('/api/admin/schools/sch_ghost/seats/purchase', 'POST',
        { tierId: 'tier_school_25', billingCycle: 'monthly' }, headers),
      { DB: noSchool.db, JWT_SECRET },
    );
    expect(res404.status).toBe(404);
  });

  it('POST /seats/purchase with an already-settled reference is an idempotent no-op', async () => {
    const { db, batchCalls, runs } = makeDb({
      authRole: 'admin',
      schoolRow: { id: 'sch_achimota', seat_expires_at: null, seat_cap: 25, seat_code: 'SCH-ABC123' },
      tierRow: { id: 'tier_school_25', price_monthly: 875, price_yearly: 8750, is_active: 1 },
      existingTx: {
        id: 'pay_1',
        reference: 'MANUAL_REPLAY_1',
        status: 'success',
        settlement_applied_at: '2026-09-08 00:00:00',
      },
    });
    const res = await worker.fetch(
      apiRequest('/api/admin/schools/sch_achimota/seats/purchase', 'POST',
        { tierId: 'tier_school_25', billingCycle: 'monthly', reference: 'MANUAL_REPLAY_1' },
        await authHeader('admin')),
      { DB: db, JWT_SECRET },
    );
    expect(res.status).toBe(200);
    expect((await res.json()).data.alreadyApplied).toBe(true);
    expect(runs.some((r) => r.sql.includes('INSERT INTO payment_transactions'))).toBe(false);
    expect(batchCalls).toHaveLength(0);
  });

  it('POST /seat-code/regenerate rotates the code', async () => {
    const { db, runs } = makeDb({ authRole: 'admin', schoolRow: { id: 'sch_achimota' } });
    const res = await worker.fetch(
      apiRequest('/api/admin/schools/sch_achimota/seat-code/regenerate', 'POST', {}, await authHeader('admin')),
      { DB: db, JWT_SECRET },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.seatCode).toMatch(/^SCH-[A-Z2-9]{6}$/);
    const update = runs.find((r) => r.sql.includes('UPDATE schools SET seat_code = ?'));
    expect(update).toBeDefined();
    expect(update!.args).toEqual([body.data.seatCode, 'sch_achimota']);
  });

  it('GET /seats returns reconcile-on-read usage (codeUses vs activeCount drift)', async () => {
    const { db } = makeDb({
      authRole: 'admin',
      schoolRow: SCHOOL,
      seatRows: [
        { id: 'seat_1', user_id: 'user_1', granted_at: '2026-09-01', status: 'active', source_payment_ref: null, prior_tier_id: 'tier_free', prior_expires_at: null, user_name: 'Ama', user_email: 'ama@test.dev' },
        { id: 'seat_2', user_id: 'user_2', granted_at: '2026-09-02', status: 'revoked', source_payment_ref: null, prior_tier_id: 'tier_free', prior_expires_at: null, user_name: 'Kofi', user_email: 'kofi@test.dev' },
      ],
    });
    const res = await worker.fetch(
      apiRequest('/api/admin/schools/sch_achimota/seats', 'GET', undefined, await authHeader('admin')),
      { DB: db, JWT_SECRET },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.usage).toEqual({
      cap: 25,
      codeUses: 3,
      activeCount: 1,
      expiredCount: 0,
      revokedCount: 1,
      drift: 2,
    });
    expect(body.data.seats).toHaveLength(2);
    expect(body.data.seats[0]).toMatchObject({ userId: 'user_1', status: 'active', priorTierId: 'tier_free' });
  });

  it('DELETE /seats/:userId revokes: restores prior entitlement, frees the seat', async () => {
    const { db, batchCalls } = makeDb({
      authRole: 'admin',
      schoolRow: { id: 'sch_achimota' },
      releaseSeat: { id: 'seat_1', prior_tier_id: 'tier_premium', prior_expires_at: '2026-10-01T00:00:00.000Z' },
      userEntitlement: { subscription_tier_id: 'tier_school_25', subscription_expires_at: '2027-01-01T00:00:00.000Z' },
      schoolSeatFields: { seat_tier_id: 'tier_school_25', seat_expires_at: '2027-01-01T00:00:00.000Z' },
    });
    const res = await worker.fetch(
      apiRequest('/api/admin/schools/sch_achimota/seats/user_1', 'DELETE', undefined, await authHeader('admin')),
      { DB: db, JWT_SECRET },
    );
    expect(res.status).toBe(200);
    expect((await res.json()).data.released).toBe(true);

    expect(batchCalls).toHaveLength(1);
    const batch = batchCalls[0];
    expect(batch).toHaveLength(3);
    expect(batch[0].sql).toContain("SET status = ?");
    expect(batch[0].args).toEqual(['revoked', 'seat_1']);
    // Prior individual entitlement restored; membership cleared.
    expect(batch[1].args).toEqual(['tier_premium', '2026-10-01T00:00:00.000Z', 'user_1']);
    expect(batch[1].sql).toContain('school_id = NULL');
    // Seat freed back into the pool.
    expect(batch[2].sql).toContain('seat_code_uses = MAX(seat_code_uses - 1, 0)');
  });

  it('DELETE /seats/:userId → 404 when no active seat exists', async () => {
    const { db, batchCalls } = makeDb({
      authRole: 'admin',
      schoolRow: { id: 'sch_achimota' },
      releaseSeat: null,
    });
    const res = await worker.fetch(
      apiRequest('/api/admin/schools/sch_achimota/seats/user_1', 'DELETE', undefined, await authHeader('admin')),
      { DB: db, JWT_SECRET },
    );
    expect(res.status).toBe(404);
    expect(batchCalls).toHaveLength(0);
  });

  it('all seat admin routes → 401 without a token, 403 with a student-role token', async () => {
    const routes: Array<[string, string, unknown?]> = [
      ['POST', '/api/admin/schools/sch_achimota/seats/purchase', { tierId: 'tier_school_25', billingCycle: 'monthly' }],
      ['POST', '/api/admin/schools/sch_achimota/seat-code/regenerate', {}],
      ['GET', '/api/admin/schools/sch_achimota/seats'],
      ['DELETE', '/api/admin/schools/sch_achimota/seats/user_1'],
    ];

    const anon = makeDb();
    for (const [method, path, body] of routes) {
      const res = await worker.fetch(apiRequest(path, method, body), { DB: anon.db, JWT_SECRET });
      expect(res.status).toBe(401);
    }

    const student = makeDb({ authRole: 'student' });
    const headers = await authHeader('student');
    for (const [method, path, body] of routes) {
      const res = await worker.fetch(apiRequest(path, method, body, headers), {
        DB: student.db,
        JWT_SECRET,
      });
      expect(res.status).toBe(403);
    }
  });

  it('redeem-code → 401 without a token', async () => {
    const { db } = makeDb();
    const res = await worker.fetch(
      apiRequest('/api/schools/redeem-code', 'POST', { code: 'SCH-ABC123' }),
      { DB: db, JWT_SECRET },
    );
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
describe('seat code + tier table', () => {
  it('generateSeatCode mints SCH-XXXXXX from the unambiguous alphabet', () => {
    for (let i = 0; i < 20; i++) {
      expect(generateSeatCode()).toMatch(/^SCH-[A-HJ-NP-Z2-9]{6}$/);
    }
  });

  it('package sizes match the spec pricing table', () => {
    expect(SCHOOL_TIER_SEATS).toEqual({
      tier_school_25: 25,
      tier_school_50: 50,
      tier_school_100: 100,
      tier_school_250: 250,
    });
  });
});
