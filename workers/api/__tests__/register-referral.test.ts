import { describe, it, expect, vi } from 'vitest';
import worker from '../index';

// Growth loop (Task 5): referral-code gate on /auth/register.
//
// Cases (from the task brief):
// (a) invite mode + no code          → 400 with data.codeRequired === true
// (b) invite mode + bad format       → 400 'Invalid referral code format'
// (c) invite mode + unknown code     → 400 'Invalid referral code'
// (d) invite mode + valid code       → INSERT carries status='approved' +
//                                       referred_by=<CODE>; attribution batch
//                                       runs; referral_signup points fire
// (e) open mode + no code            → unchanged 'pending' flow
// (f) open mode + valid code         → approved + attribution + signup points
//                                       (a valid code IS the approval in
//                                       either mode; the approve-handler
//                                       backstop can't double-award because
//                                       the referral row exists)
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
}

function makeDb({ affiliateRow = null }: DbOptions = {}) {
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
            if (sql.includes('FROM affiliate_profiles') && sql.includes('referral_code = ?')) {
              return Promise.resolve(affiliateRow);
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
      return Promise.resolve([]);
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
  it('(a) invite mode + no code → 400 with data.codeRequired === true', async () => {
    const { db, allCalls } = makeDb();
    const res = await worker.fetch(registerRequest(VALID_BODY), { ...INVITE_ENV, DB: db });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.data?.codeRequired).toBe(true);
    // No user insert attempted.
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

  it('(d) invite mode + valid code → approved INSERT + referred_by + attribution + signup points', async () => {
    const { db, batchCalls, runsOutsideBatch } = makeDb({ affiliateRow: AFFILIATE });
    const res = await worker.fetch(
      registerRequest({ ...VALID_BODY, referralCode: 'abc123xy' }), // case-insensitive
      { ...INVITE_ENV, DB: db },
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      success: true,
      data: {
        status: 'approved',
        message: 'Your account is ready — you can log in now.',
      },
    });

    // Registration batch: INSERT INTO users carries status + referred_by.
    expect(batchCalls.length).toBeGreaterThanOrEqual(2);
    const insert = batchCalls[0][0];
    expect(insert.sql).toContain('INSERT INTO users');
    expect(insert.sql).toContain('referred_by');
    // Bind order: id, email, hash, name, role, status, ...9 optionals..., referred_by
    expect(insert.args[5]).toBe('approved');
    expect(insert.args[insert.args.length - 1]).toBe('ABC123XY');

    // Attribution batch (attributeReferral): referral row + stats + referred_by + xp.
    const attribution = batchCalls[1];
    expect(attribution).toHaveLength(4);
    expect(attribution[0].sql).toContain('INSERT INTO affiliate_referrals');
    expect(attribution[0].args[1]).toBe('aff_1');
    expect(attribution[1].sql).toContain('UPDATE affiliate_profiles');
    expect(attribution[2].sql).toContain('UPDATE users SET referred_by');
    expect(attribution[2].args[0]).toBe('ABC123XY');
    expect(attribution[3].sql).toContain('affiliate_xp');

    // Invite-mode auto-approval fires referral_signup points immediately.
    const ledger = runsOutsideBatch.find((c) => c.sql.includes('INSERT INTO points_ledger'));
    expect(ledger).toBeDefined();
    expect(ledger!.args[1]).toBe('user_AFF'); // referrer earns, not the new user
    expect(ledger!.args[2]).toBe(100);
    expect(ledger!.args[3]).toBe('referral_signup');
  });

  it('(e) open mode + no code → unchanged pending flow', async () => {
    const { db, batchCalls, runsOutsideBatch, allCalls } = makeDb();
    const res = await worker.fetch(registerRequest(VALID_BODY), { ...OPEN_ENV, DB: db });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ success: true, data: { status: 'pending' } });

    const insert = batchCalls[0][0];
    expect(insert.args[5]).toBe('pending');
    expect(insert.args[insert.args.length - 1]).toBeNull(); // referred_by NULL

    // No affiliate lookup, no attribution batch, no points.
    expect(allCalls.some((c) => c.sql.includes('FROM affiliate_profiles'))).toBe(false);
    expect(batchCalls).toHaveLength(1);
    expect(runsOutsideBatch.some((c) => c.sql.includes('INSERT INTO points_ledger'))).toBe(false);
  });

  it('(f) open mode + valid code → approved + attribution + signup points', async () => {
    const { db, batchCalls, runsOutsideBatch } = makeDb({ affiliateRow: AFFILIATE });
    const res = await worker.fetch(
      registerRequest({ ...VALID_BODY, referralCode: 'ABC123XY' }),
      { ...OPEN_ENV, DB: db },
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ success: true, data: { status: 'approved' } });

    const insert = batchCalls[0][0];
    expect(insert.args[5]).toBe('approved');
    expect(insert.args[insert.args.length - 1]).toBe('ABC123XY');

    // Attribution runs in both modes…
    expect(batchCalls).toHaveLength(2);
    expect(batchCalls[1][0].sql).toContain('INSERT INTO affiliate_referrals');

    // …and so does the referral_signup award: the code IS the approval.
    const ledger = runsOutsideBatch.find(
      (c) => c.sql.includes('INSERT INTO points_ledger') && c.args[3] === 'referral_signup',
    );
    expect(ledger).toBeDefined();
    expect(ledger!.args[1]).toBe('user_AFF');
    expect(ledger!.args[2]).toBe(100);
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
