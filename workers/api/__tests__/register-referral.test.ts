import { describe, it, expect, vi } from 'vitest';
import worker from '../index';

// Growth loop (Task 5): referral-code gate on /auth/register.
//
// Cases (from the task brief):
// (a) invite mode + no code          → 400 with data.codeRequired === true
// (b) invite mode + bad format       → 400 'Invalid referral code format'
// (c) invite mode + unknown code     → 400 'Invalid referral code'
// (d) invite mode + valid code       → INSERT remains pending; referral is
//                                       attributed; no signup points yet
// (e) open mode + no code            → unchanged 'pending' flow
// (f) open mode + valid code         → pending + attribution; no signup
//                                       points until admin approval
// (g) ordering: code validation happens after Turnstile, before the
//     email-exists check.
//
// Mock pattern copied from register.test.ts: prepare().bind() captures
// sql+args, batch() records each batch's statements, run() outside batches is
// logged in runsOutsideBatch.

const JWT_SECRET = 'test-secret-that-is-long-enough';

interface CapturedStatement {
  sql: string;
  args: unknown[];
}

const AFFILIATE = {
  id: 'aff_1',
  user_id: 'user_AFF',
  referral_code: 'ABC123XY',
};

interface DbOptions {
  // Row returned for the affiliate_profiles referral-code lookup (null =
  // unknown code).
  affiliateRow?: unknown;
  verificationUser?: {
    id: string;
    email_verified: number;
    verification_token_expires_at: string | null;
  } | null;
}

function makeDb({
  affiliateRow = null,
  verificationUser = null,
}: DbOptions = {}) {
  const batchCalls: CapturedStatement[][] = [];
  const runsOutsideBatch: CapturedStatement[] = [];
  const allCalls: CapturedStatement[] = [];

  const db = {
    prepare: vi.fn((sql: string) => ({
      sql,
      // Unbound .all() — used by the admin-notification query in /auth/register.
      all: vi.fn().mockResolvedValue({ results: [] }),
      bind: (...args: unknown[]) => {
        allCalls.push({ sql, args });
        return {
          sql,
          args,
          first: vi.fn().mockImplementation(() => {
            if (sql.includes('FROM rate_limits') && sql.includes('SUM(request_count)')) {
              return Promise.resolve({ total_requests: 0, last_request: null });
            }
            if (sql.includes('WHERE verification_token = ?')) {
              return Promise.resolve(verificationUser);
            }
            if (sql.includes('FROM affiliate_profiles') && sql.includes('referral_code = ?')) {
              return Promise.resolve(
                args[0] === AFFILIATE.referral_code ? affiliateRow : null,
              );
            }
            // rate_limits window lookup, `SELECT id FROM users WHERE email`,
            // awardPoints' race_cycles / house lookups → empty.
            return Promise.resolve(null);
          }),
          all: vi.fn().mockResolvedValue({ results: [] }),
          run: vi.fn().mockImplementation(() => {
            runsOutsideBatch.push({ sql, args });
            return Promise.resolve({ success: true, meta: { changes: 1 } });
          }),
        };
      },
    })),
    batch: vi.fn((statements: CapturedStatement[]) => {
      batchCalls.push(statements.map((s) => ({ sql: s.sql, args: s.args })));
      return Promise.resolve(
        statements.map(() => ({ success: true, meta: { changes: 1 } })),
      );
    }),
  } as unknown as D1Database;

  return { db, batchCalls, runsOutsideBatch, allCalls };
}

function registerRequest(body: unknown) {
  return new Request('http://x/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const VALID_BODY = {
  email: 'new.student@example.com',
  password: 'S3cure!Pass',
  name: 'New Student',
  role: 'student',
};

const INVITE_ENV = { JWT_SECRET, REGISTRATION_MODE: 'invite' };
const OPEN_ENV = { JWT_SECRET };

describe('/auth/register — referral code gate (Task 5)', () => {
  it('(a) invite mode + student without a code is approved and receives a share code', async () => {
    const { db, batchCalls } = makeDb();
    const res = await worker.fetch(registerRequest(VALID_BODY), { ...INVITE_ENV, DB: db });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      success: true,
      data: { status: 'approved', requiresApproval: false },
    });
    expect(typeof body.data.token).toBe('string');
    expect(typeof body.data.referralCode).toBe('string');
    expect(batchCalls[0][1].sql).toContain('INSERT INTO affiliate_profiles');
  });

  it('invite mode still requires a code for teacher registration', async () => {
    const { db, allCalls } = makeDb();
    const res = await worker.fetch(
      registerRequest({ ...VALID_BODY, role: 'teacher' }),
      { ...INVITE_ENV, DB: db },
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({
      success: false,
      data: { codeRequired: true },
    });
    expect(allCalls.some((c) => c.sql.includes('INSERT INTO users'))).toBe(false);
  });

  it('(b) invite mode + bad format → 400 Invalid referral code format, no affiliate lookup', async () => {
    const { db, allCalls } = makeDb();
    const res = await worker.fetch(
      registerRequest({ ...VALID_BODY, referralCode: 'bad!' }),
      { ...INVITE_ENV, DB: db },
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ success: false, error: 'Invalid referral code format' });
    expect(allCalls.some((c) => c.sql.includes('FROM affiliate_profiles'))).toBe(false);
  });

  it('(c) invite mode + unknown code → 400 Invalid referral code', async () => {
    const { db, allCalls } = makeDb({ affiliateRow: null });
    const res = await worker.fetch(
      registerRequest({ ...VALID_BODY, referralCode: 'ZZZ999ZZ' }),
      { ...INVITE_ENV, DB: db },
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ success: false, error: 'Invalid referral code' });
    expect(allCalls.some((c) => c.sql.includes('INSERT INTO users'))).toBe(false);
  });

  it('(d) invite mode + valid code → approved student, attribution and signup points', async () => {
    const { db, batchCalls, runsOutsideBatch } = makeDb({ affiliateRow: AFFILIATE });
    const res = await worker.fetch(
      registerRequest({ ...VALID_BODY, referralCode: 'abc123xy' }), // case-insensitive
      { ...INVITE_ENV, DB: db },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      success: true,
      data: {
        status: 'approved',
        requiresApproval: false,
      },
    });
    expect(typeof body.data.token).toBe('string');
    expect(typeof body.data.referralCode).toBe('string');

    // Registration batch carries the account and its own affiliate profile.
    expect(batchCalls).toHaveLength(2);
    const insert = batchCalls[0][0];
    expect(insert.sql).toContain('INSERT INTO users');
    expect(insert.sql).toContain('referred_by');
    expect(insert.args[5]).toBe('approved');
    expect(insert.args[17]).toBe('ABC123XY');
    expect(insert.args[18]).toBe(1);
    expect(batchCalls[0][1].sql).toContain('INSERT INTO affiliate_profiles');

    // Attribution batch (attributeReferral): referral row + stats + referred_by + xp.
    const attribution = batchCalls[1];
    expect(attribution).toHaveLength(4);
    expect(attribution[0].sql).toContain('INSERT INTO affiliate_referrals');
    expect(attribution[0].args[1]).toBe('aff_1');
    expect(attribution[1].sql).toContain('UPDATE affiliate_profiles');
    expect(attribution[2].sql).toContain('UPDATE users SET referred_by');
    expect(attribution[2].args[0]).toBe('ABC123XY');
    expect(attribution[3].sql).toContain('affiliate_xp');

    expect(runsOutsideBatch.some((c) => c.sql.includes('INSERT INTO points_ledger'))).toBe(true);
  });

  it('(e) open mode + no code → approved with an automatically generated share code', async () => {
    const { db, batchCalls, runsOutsideBatch, allCalls } = makeDb();
    const res = await worker.fetch(registerRequest(VALID_BODY), { ...OPEN_ENV, DB: db });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ success: true, data: { status: 'approved' } });
    expect(typeof body.data.referralCode).toBe('string');

    const insert = batchCalls[0][0];
    expect(insert.args[5]).toBe('approved');
    expect(insert.args[17]).toBeNull();
    expect(batchCalls[0][1].sql).toContain('INSERT INTO affiliate_profiles');

    expect(allCalls.some((c) => c.sql.includes('is_active = 1'))).toBe(false);
    expect(batchCalls).toHaveLength(1);
    expect(runsOutsideBatch.some((c) => c.sql.includes('INSERT INTO points_ledger'))).toBe(false);
  });

  it('(f) open mode + valid code → approved with attribution and signup points', async () => {
    const { db, batchCalls, runsOutsideBatch } = makeDb({ affiliateRow: AFFILIATE });
    const res = await worker.fetch(
      registerRequest({ ...VALID_BODY, referralCode: 'ABC123XY' }),
      { ...OPEN_ENV, DB: db },
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ success: true, data: { status: 'approved' } });

    const insert = batchCalls[0][0];
    expect(insert.args[5]).toBe('approved');
    expect(insert.args[17]).toBe('ABC123XY');

    expect(batchCalls).toHaveLength(2);
    expect(batchCalls[1][0].sql).toContain('INSERT INTO affiliate_referrals');
    expect(runsOutsideBatch.some((c) => c.sql.includes('INSERT INTO points_ledger'))).toBe(true);
  });

  it('verifies a student email without replacing the chosen password', async () => {
    const { db, batchCalls, runsOutsideBatch } = makeDb({
      verificationUser: {
        id: 'user_new',
        email_verified: 0,
        verification_token_expires_at: new Date(Date.now() + 60_000).toISOString(),
      },
    });
    const res = await worker.fetch(
      new Request('http://x/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'verification-token' }),
      }),
      { ...OPEN_ENV, DB: db },
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      success: true,
      data: { xpAwarded: 100 },
    });
    const verificationBatch = batchCalls.at(-1);
    expect(verificationBatch).toHaveLength(2);
    expect(verificationBatch?.[0].sql).toContain('email_verified = 1');
    expect(verificationBatch?.[0].sql).toContain('xp_points = xp_points +');
    expect(verificationBatch?.[0].sql).not.toContain('password_hash');
    expect(verificationBatch?.[1].sql).toContain('INSERT OR IGNORE INTO xp_transactions');
    expect(verificationBatch?.[1].args).toEqual([
      'xp_email_verified_user_new',
      'user_new',
      100,
      'email_verification',
      'user_new',
    ]);
    expect(runsOutsideBatch.some((c) => c.sql.includes('password_hash'))).toBe(false);
  });

  it('rewards an admin-created user when initial password setup verifies their email', async () => {
    const { db, batchCalls } = makeDb({
      verificationUser: {
        id: 'user_setup',
        email_verified: 0,
        verification_token_expires_at: new Date(Date.now() + 60_000).toISOString(),
      },
    });
    const res = await worker.fetch(
      new Request('http://x/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: 'verification-token',
          password: 'N3w!Password123',
        }),
      }),
      { ...OPEN_ENV, DB: db },
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      success: true,
      data: { xpAwarded: 100 },
    });
    const verificationBatch = batchCalls.at(-1);
    expect(verificationBatch).toHaveLength(2);
    expect(verificationBatch?.[0].sql).toContain('password_hash = ?');
    expect(verificationBatch?.[0].sql).toContain('session_version = session_version + 1');
    expect(verificationBatch?.[0].sql).toContain('xp_points = xp_points +');
    expect(verificationBatch?.[1].sql).toContain('INSERT OR IGNORE INTO xp_transactions');
    expect(verificationBatch?.[1].args).toEqual([
      'xp_email_verified_user_setup',
      'user_setup',
      100,
      'email_verification',
      'user_setup',
    ]);
  });

  it('retires the legacy invite request endpoint without writing contact data', async () => {
    const { db, allCalls } = makeDb();
    const res = await worker.fetch(
      new Request('http://x/api/referral-code-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Student', contact: 'student@example.com' }),
      }),
      { ...OPEN_ENV, DB: db },
    );
    expect(res.status).toBe(410);
    expect(await res.json()).toMatchObject({ success: false });
    expect(allCalls.some((c) => c.sql.includes('INSERT INTO referral_code_requests'))).toBe(false);
  });

  it('(g) Turnstile runs before code validation; code validation before email-exists', async () => {
    // Turnstile required but missing → 400 even with a valid code, no affiliate lookup.
    const turnstileMock = makeDb({ affiliateRow: AFFILIATE });
    const res1 = await worker.fetch(
      registerRequest({ ...VALID_BODY, referralCode: 'ABC123XY' }),
      { ...INVITE_ENV, DB: turnstileMock.db, TURNSTILE_SECRET: 'secret' },
    );
    expect(res1.status).toBe(400);
    expect(await res1.json()).toMatchObject({
      success: false,
      error: 'Security verification required.',
    });
    expect(turnstileMock.allCalls.some((c) => c.sql.includes('FROM affiliate_profiles'))).toBe(false);

    // Invalid code → 400 before the email-exists lookup.
    const codeMock = makeDb({ affiliateRow: null });
    const res2 = await worker.fetch(
      registerRequest({ ...VALID_BODY, referralCode: 'ZZZ999ZZ' }),
      { ...INVITE_ENV, DB: codeMock.db },
    );
    expect(res2.status).toBe(400);
    expect(
      codeMock.allCalls.some(
        (c) => c.sql.includes('SELECT id FROM users') && c.sql.includes('email'),
      ),
    ).toBe(false);
  });
});
