import { describe, it, expect, vi, afterEach } from 'vitest';
import { oauthApp } from '../oauth';

// Tests the OAuth register role/status hardening in the /google/callback
// handler: caller-supplied roles are whitelisted, and non-student roles
// register as 'pending' instead of 'approved'.
//
// Approach: full callback test — global fetch is stubbed to fake Google's
// token exchange (the ID token payload is decoded without signature
// verification by the handler), and D1 is mocked with per-SQL routing so the
// INSERT INTO users bind arguments can be captured and asserted.

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
};

function makeStateRow(role: string | null) {
  return {
    id: 'oauth_state_1',
    state: 'test-state',
    code_verifier: 'verifier',
    intent: 'register',
    role,
    registration_data: null,
  };
}

interface Captured {
  usersInsertArgs: unknown[] | null;
}

// Statement shape returned by the mocked prepare().bind() below. The register
// flow batches its writes via DB.batch(), so the mock's batch() replays each
// statement's run() to keep the existing bind-capture assertions working.
interface MockStatement {
  run: () => Promise<unknown>;
}

function makeDb(stateRow: unknown, captured: Captured) {
  return {
    prepare: vi.fn((sql: string) => ({
      bind: vi.fn((...args: unknown[]) => ({
        first: vi.fn().mockResolvedValue(
          sql.includes('FROM oauth_states') ? stateRow : null,
        ),
        run: vi.fn().mockImplementation(() => {
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

function makeEnv(stateRow: unknown, captured: Captured) {
  return {
    DB: makeDb(stateRow, captured),
    JWT_SECRET,
    ENVIRONMENT: 'test',
    GOOGLE_CLIENT_ID: 'client-id',
    GOOGLE_CLIENT_SECRET: 'client-secret',
  };
}

function stubGoogleTokenExchange() {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
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
    ),
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
    const captured: Captured = { usersInsertArgs: null };
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
    const captured: Captured = { usersInsertArgs: null };
    const res = await oauthApp.fetch(
      callbackRequest(),
      makeEnv(makeStateRow('teacher'), captured),
    );
    expect(res.status).toBe(200);
    // INSERT INTO users bind order: id, email, name, role, status, ...
    expect(captured.usersInsertArgs?.[3]).toBe('teacher');
    expect(captured.usersInsertArgs?.[4]).toBe('pending');
  });

  it("inserts role: 'student' with status 'approved'", async () => {
    stubGoogleTokenExchange();
    const captured: Captured = { usersInsertArgs: null };
    const res = await oauthApp.fetch(
      callbackRequest(),
      makeEnv(makeStateRow('student'), captured),
    );
    expect(res.status).toBe(200);
    expect(captured.usersInsertArgs?.[3]).toBe('student');
    expect(captured.usersInsertArgs?.[4]).toBe('approved');
  });
});
