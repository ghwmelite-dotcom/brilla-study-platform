import { describe, it, expect, vi, afterEach } from 'vitest';
import { oauthApp } from '../oauth';

// Tests the OAuth register role/status hardening in the /google/callback
// handler: caller-supplied roles are whitelisted and every self-serve role
// registers as pending without receiving an authentication token.
//
// Approach: full callback test — global fetch is stubbed to fake Google's
// token exchange and tokeninfo verification endpoints (the handler delegates
// the ID token signature check to tokeninfo server-to-server), and D1 is
// mocked with per-SQL routing so the INSERT INTO users bind arguments can be
// captured and asserted.

const JWT_SECRET = 'test-secret-that-is-long-enough';

function fakeIdToken(payload: object): string {
  const b64url = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${b64url({ alg: 'RS256' })}.${b64url(payload)}.fakesig`;
}

const GOOGLE_USER = {
  sub: 'google-sub-123',
  email: 'new.user@example.com',
  email_verified: true,
  name: 'New User',
  // Claims the handler now asserts before trusting the ID token.
  aud: 'client-id',
  iss: 'https://accounts.google.com',
  exp: Math.floor(Date.now() / 1000) + 3600,
};

function makeStateRow(role: string | null, registrationData?: Record<string, unknown>) {
  return {
    id: 'oauth_state_1',
    state: 'test-state',
    code_verifier: 'verifier',
    intent: 'register',
    role,
    registration_data: registrationData ? JSON.stringify(registrationData) : null,
  };
}

interface Captured {
  usersInsertArgs: unknown[] | null;
  runs: { sql: string; args: unknown[] }[];
}

// Statement shape returned by the mocked prepare().bind() below. The register
// flow batches its writes via DB.batch(), so the mock's batch() replays each
// statement's run() to keep the existing bind-capture assertions working.
interface MockStatement {
  run: () => Promise<unknown>;
}

interface DbOptions {
  // Row returned for the affiliate_profiles referral-code lookup (null =
  // unknown/inactive code).
  affiliateRow?: unknown;
}

function makeDb(stateRow: unknown, captured: Captured, { affiliateRow = null }: DbOptions = {}) {
  return {
    prepare: vi.fn((sql: string) => ({
      bind: vi.fn((...args: unknown[]) => ({
        first: vi.fn().mockImplementation(() => {
          // D1-backed rate limiter (oauth-google-callback bucket): allow.
          if (sql.includes('WITH usage(total_requests)')) {
            return Promise.resolve({ request_count: 1, total_requests: 1 });
          }
          if (sql.includes('FROM oauth_states')) return Promise.resolve(stateRow);
          if (sql.includes('FROM affiliate_profiles') && sql.includes('referral_code = ?')) {
            return Promise.resolve(
              args[0] === AFFILIATE.referral_code ? affiliateRow : null,
            );
          }
          return Promise.resolve(null);
        }),
        run: vi.fn().mockImplementation(() => {
          captured.runs.push({ sql, args });
          if (sql.includes('INSERT INTO users')) {
            captured.usersInsertArgs = args;
          }
          return Promise.resolve({ success: true });
        }),
        all: vi.fn().mockResolvedValue({ results: [] }),
      })),
    })),
    batch: vi.fn((statements: MockStatement[]) =>
      Promise.all(statements.map((stmt) => stmt.run())),
    ),
  } as unknown as D1Database;
}

function makeEnv(stateRow: unknown, captured: Captured, opts: DbOptions & { registrationMode?: string } = {}) {
  return {
    DB: makeDb(stateRow, captured, opts),
    JWT_SECRET,
    ENVIRONMENT: 'test',
    GOOGLE_CLIENT_ID: 'client-id',
    GOOGLE_CLIENT_SECRET: 'client-secret',
    ...(opts.registrationMode ? { REGISTRATION_MODE: opts.registrationMode } : {}),
  };
}

function stubGoogleTokenExchange() {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string) => {
      // tokeninfo: Google's server-to-server ID token verification endpoint
      if (String(url).includes('tokeninfo')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              aud: 'client-id',
              iss: 'https://accounts.google.com',
              sub: GOOGLE_USER.sub,
              email_verified: String(GOOGLE_USER.email_verified),
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
        );
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({
            access_token: 'access-token',
            id_token: fakeIdToken(GOOGLE_USER),
            expires_in: 3600,
            token_type: 'Bearer',
            scope: 'openid email profile',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      );
    }),
  );
}

function callbackRequest() {
  return new Request('http://x/google/callback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: 'auth-code', state: 'test-state' }),
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('OAuth register role hardening', () => {
  it("rejects role: 'admin' with 400", async () => {
    stubGoogleTokenExchange();
    const captured: Captured = { usersInsertArgs: null, runs: [] };
    const res = await oauthApp.fetch(
      callbackRequest(),
      makeEnv(makeStateRow('admin'), captured),
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ success: false, error: 'Invalid role' });
    expect(captured.usersInsertArgs).toBeNull();
  });

  it("inserts role: 'teacher' with status 'pending'", async () => {
    stubGoogleTokenExchange();
    const captured: Captured = { usersInsertArgs: null, runs: [] };
    const res = await oauthApp.fetch(
      callbackRequest(),
      makeEnv(makeStateRow('teacher'), captured),
    );
    expect(res.status).toBe(200);
    // INSERT INTO users bind order: id, email, name, role, status, ...
    expect(captured.usersInsertArgs?.[3]).toBe('teacher');
    expect(captured.usersInsertArgs?.[4]).toBe('pending');
  });

  it("approves a verified Google student and returns a session plus share code", async () => {
    stubGoogleTokenExchange();
    const captured: Captured = { usersInsertArgs: null, runs: [] };
    const res = await oauthApp.fetch(
      callbackRequest(),
      makeEnv(makeStateRow('student'), captured),
    );
    expect(res.status).toBe(200);
    expect(captured.usersInsertArgs?.[3]).toBe('student');
    expect(captured.usersInsertArgs?.[4]).toBe('approved');
    const body = await res.json();
    expect(body.data.requiresApproval).toBe(false);
    expect(typeof body.data.token).toBe('string');
    expect(typeof body.data.referralCode).toBe('string');
    expect(body.data.user.xpPoints).toBe(100);
    expect(captured.usersInsertArgs?.[18]).toBe(100);
    const verificationReward = captured.runs.find((r) =>
      r.sql.includes('INSERT OR IGNORE INTO xp_transactions'),
    );
    expect(verificationReward?.args.slice(1)).toEqual([
      captured.usersInsertArgs?.[0],
      100,
      'email_verification',
      captured.usersInsertArgs?.[0],
    ]);
    expect(captured.runs.some((r) => r.sql.includes('INSERT INTO affiliate_profiles'))).toBe(true);
    expect(captured.runs.some((r) => r.sql.includes('last_login_at'))).toBe(true);
  });
});

// Growth loop (Task 5, fix round 1): the OAuth register path must validate a
// client-supplied referralCode exactly like /auth/register — previously any
// non-empty string previously bypassed invite-mode validation. The callback
// now validates codes and still leaves every new account pending.
const AFFILIATE = { id: 'aff_1', user_id: 'user_AFF', referral_code: 'ABC123XY' };

describe('OAuth register — invite-mode referral code validation', () => {
  it('rejects a malformed code with 400, no user created', async () => {
    stubGoogleTokenExchange();
    const captured: Captured = { usersInsertArgs: null, runs: [] };
    const res = await oauthApp.fetch(
      callbackRequest(),
      makeEnv(makeStateRow('student', { referralCode: 'x' }), captured, {
        registrationMode: 'invite',
      }),
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ success: false, error: 'Invalid referral code format' });
    expect(captured.usersInsertArgs).toBeNull();
  });

  it('rejects an unknown code with 400, no user created', async () => {
    stubGoogleTokenExchange();
    const captured: Captured = { usersInsertArgs: null, runs: [] };
    const res = await oauthApp.fetch(
      callbackRequest(),
      makeEnv(makeStateRow('student', { referralCode: 'ZZZ999ZZ' }), captured, {
        registrationMode: 'invite',
        affiliateRow: null,
      }),
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ success: false, error: 'Invalid referral code' });
    expect(captured.usersInsertArgs).toBeNull();
  });

  it('allows a codeless student in invite mode', async () => {
    stubGoogleTokenExchange();
    const captured: Captured = { usersInsertArgs: null, runs: [] };
    const res = await oauthApp.fetch(
      callbackRequest(),
      makeEnv(makeStateRow('student'), captured, { registrationMode: 'invite' }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.requiresApproval).toBe(false);
    expect(typeof body.data.token).toBe('string');
  });

  it('still rejects a codeless teacher in invite mode', async () => {
    stubGoogleTokenExchange();
    const captured: Captured = { usersInsertArgs: null, runs: [] };
    const res = await oauthApp.fetch(
      callbackRequest(),
      makeEnv(makeStateRow('teacher'), captured, { registrationMode: 'invite' }),
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({
      success: false,
      data: { codeRequired: true },
    });
    expect(captured.usersInsertArgs).toBeNull();
  });

  it('valid code → approved student, attribution and signup points', async () => {
    stubGoogleTokenExchange();
    const captured: Captured = { usersInsertArgs: null, runs: [] };
    const res = await oauthApp.fetch(
      callbackRequest(),
      makeEnv(makeStateRow('student', { referralCode: 'abc123xy' }), captured, {
        registrationMode: 'invite',
        affiliateRow: AFFILIATE,
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.requiresApproval).toBe(false);
    expect(typeof body.data.token).toBe('string');
    expect(typeof body.data.referralCode).toBe('string');

    // referred_by remains attribution; is_affiliate marks the generated profile.
    expect(captured.usersInsertArgs).not.toBeNull();
    expect(captured.usersInsertArgs![16]).toBe('ABC123XY');

    // attributeReferral batch ran for the new user under the affiliate.
    const referralInsert = captured.runs.find((r) => r.sql.includes('INSERT INTO affiliate_referrals'));
    expect(referralInsert).toBeDefined();
    expect(referralInsert!.args[1]).toBe('aff_1');
    expect(referralInsert!.args[2]).toBe(captured.usersInsertArgs![0]); // new user id

    expect(captured.runs.some((r) => r.sql.includes('INSERT INTO points_ledger'))).toBe(true);
  });
});
