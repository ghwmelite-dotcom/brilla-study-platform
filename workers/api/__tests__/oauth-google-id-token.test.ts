import { describe, it, expect, vi, afterEach } from 'vitest';
import { oauthApp } from '../oauth';

// Regression tests for Google ID token verification in /google/callback:
//  - the decoded claims are NOT trusted on their own: aud must be our client
//    ID, iss must be Google, exp must be in the future;
//  - the signature check is delegated server-to-server to Google's tokeninfo
//    endpoint (the project has no JWKS verifier dependency);
//  - the login-intent auto-link by email additionally requires Google to
//    report email_verified=true, otherwise it is an account-takeover vector.
//
// fetch is stubbed to fake both Google endpoints; D1 is mocked with per-SQL
// routing (rate_limits CTE allowed, oauth_states returns a login state row).

const JWT_SECRET = 'test-secret-that-is-long-enough';

function fakeIdToken(payload: object): string {
  const b64url = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${b64url({ alg: 'RS256' })}.${b64url(payload)}.fakesig`;
}

const VALID_CLAIMS = {
  sub: 'google-sub-123',
  email: 'existing.user@example.com',
  email_verified: true,
  name: 'Existing User',
  aud: 'client-id',
  iss: 'https://accounts.google.com',
  exp: Math.floor(Date.now() / 1000) + 3600,
};

const EXISTING_USER = {
  id: 'user_1',
  email: 'existing.user@example.com',
  name: 'Existing User',
  role: 'student',
  status: 'approved',
  house: null,
  year_group: null,
  school_level: null,
  school_name: null,
  xp_points: 0,
  level: 1,
  streak_days: 0,
  ai_grading_credits: 0,
  session_version: 0,
};

function loginStateRow() {
  return {
    id: 'oauth_state_1',
    state: 'test-state',
    code_verifier: 'verifier',
    intent: 'login',
    role: null,
    registration_data: null,
  };
}

interface Captured {
  runs: { sql: string; args: unknown[] }[];
}

function makeDb(captured: Captured) {
  return {
    prepare: vi.fn((sql: string) => ({
      bind: vi.fn((...args: unknown[]) => ({
        first: vi.fn().mockImplementation(() => {
          // D1-backed rate limiter (oauth-google-callback bucket): allow.
          if (sql.includes('WITH usage(total_requests)')) {
            return Promise.resolve({ request_count: 1, total_requests: 1 });
          }
          if (sql.includes('FROM oauth_states')) return Promise.resolve(loginStateRow());
          // No existing Google link; the email account exists (auto-link path).
          if (sql.includes('FROM user_oauth_providers')) return Promise.resolve(null);
          if (sql.includes('FROM users WHERE email = ?')) return Promise.resolve(EXISTING_USER);
          return Promise.resolve(null);
        }),
        run: vi.fn().mockImplementation(() => {
          captured.runs.push({ sql, args });
          return Promise.resolve({ success: true });
        }),
        all: vi.fn().mockResolvedValue({ results: [] }),
      })),
    })),
  } as unknown as D1Database;
}

function makeEnv(captured: Captured) {
  return {
    DB: makeDb(captured),
    JWT_SECRET,
    ENVIRONMENT: 'test',
    GOOGLE_CLIENT_ID: 'client-id',
    GOOGLE_CLIENT_SECRET: 'client-secret',
  };
}

interface TokeninfoStub {
  ok?: boolean;
  aud?: string;
  sub?: string;
  emailVerified?: boolean;
}

function stubGoogle(claims: object, tokeninfo: TokeninfoStub = {}) {
  const {
    ok = true,
    aud = 'client-id',
    sub = 'google-sub-123',
    emailVerified = true,
  } = tokeninfo;
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string) => {
      if (String(url).includes('tokeninfo')) {
        return Promise.resolve(
          ok
            ? new Response(
                JSON.stringify({
                  aud,
                  iss: 'https://accounts.google.com',
                  sub,
                  email_verified: String(emailVerified),
                }),
                { status: 200, headers: { 'Content-Type': 'application/json' } },
              )
            : new Response('invalid_token', { status: 400 }),
        );
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({
            access_token: 'access-token',
            id_token: fakeIdToken(claims),
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

describe('Google ID token claim verification', () => {
  it('rejects an ID token whose aud is not our client ID', async () => {
    stubGoogle({ ...VALID_CLAIMS, aud: 'attacker-client-id' });
    const captured: Captured = { runs: [] };
    const res = await oauthApp.fetch(callbackRequest(), makeEnv(captured));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({
      success: false,
      error: 'Failed to get user info from Google',
    });
    expect(captured.runs.some((r) => r.sql.includes('INSERT INTO user_oauth_providers'))).toBe(false);
  });

  it('rejects an ID token with a non-Google issuer', async () => {
    stubGoogle({ ...VALID_CLAIMS, iss: 'https://evil.example.com' });
    const captured: Captured = { runs: [] };
    const res = await oauthApp.fetch(callbackRequest(), makeEnv(captured));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({
      success: false,
      error: 'Failed to get user info from Google',
    });
  });

  it('rejects an expired ID token', async () => {
    stubGoogle({ ...VALID_CLAIMS, exp: Math.floor(Date.now() / 1000) - 60 });
    const captured: Captured = { runs: [] };
    const res = await oauthApp.fetch(callbackRequest(), makeEnv(captured));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({
      success: false,
      error: 'Failed to get user info from Google',
    });
  });

  it('rejects when Google tokeninfo rejects the token signature', async () => {
    stubGoogle(VALID_CLAIMS, { ok: false });
    const captured: Captured = { runs: [] };
    const res = await oauthApp.fetch(callbackRequest(), makeEnv(captured));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({
      success: false,
      error: 'Failed to get user info from Google',
    });
  });

  it('rejects when tokeninfo reports a different aud than the claims', async () => {
    stubGoogle(VALID_CLAIMS, { aud: 'attacker-client-id' });
    const captured: Captured = { runs: [] };
    const res = await oauthApp.fetch(callbackRequest(), makeEnv(captured));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({
      success: false,
      error: 'Failed to get user info from Google',
    });
  });
});

describe('login auto-link email_verified gate', () => {
  it('refuses to auto-link when Google reports email_verified=false', async () => {
    stubGoogle(VALID_CLAIMS, { emailVerified: false });
    const captured: Captured = { runs: [] };
    const res = await oauthApp.fetch(callbackRequest(), makeEnv(captured));
    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ success: false, code: 'EMAIL_NOT_VERIFIED' });
    expect(captured.runs.some((r) => r.sql.includes('INSERT INTO user_oauth_providers'))).toBe(false);
  });

  it('auto-links a verified Google email and issues a session', async () => {
    stubGoogle(VALID_CLAIMS);
    const captured: Captured = { runs: [] };
    const res = await oauthApp.fetch(callbackRequest(), makeEnv(captured));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.accountLinked).toBe(true);
    expect(typeof body.data.token).toBe('string');
    expect(captured.runs.some((r) => r.sql.includes('INSERT INTO user_oauth_providers'))).toBe(true);
  });
});
