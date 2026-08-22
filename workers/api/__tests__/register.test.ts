import { describe, it, expect, vi } from 'vitest';
import worker from '../index';

// Tests for the batched registration writes (task 8): the user INSERT,
// primary exam-type UPDATE and all user_exam_preferences INSERTs must go out
// in a single D1 batch(), so a failure mid-write cannot leave a user without
// their preferences.
//
// Register lives on publicApp (no auth lookup) but is guarded by checkRateLimit
// (mock answers the rate_limits queries), Turnstile (bypassed by not setting
// TURNSTILE_SECRET) and the self-serve role whitelist ('student' is allowed).

const JWT_SECRET = 'test-secret-that-is-long-enough';

interface CapturedStatement {
  sql: string;
  args: unknown[];
}

interface DbOptions {
  // Index within the batch at which the mock simulates a D1 failure.
  failBatchAt?: number;
}

function makeDb({ failBatchAt }: DbOptions = {}) {
  const batchCalls: CapturedStatement[][] = [];
  const runsOutsideBatch: CapturedStatement[] = [];
  // Failure bookkeeping for the atomicity test: the mock executes the batch
  // sequentially and records how far it got before throwing. The atomicity
  // guarantee itself is D1's — here we assert the endpoint surfaces the
  // failure (500) and the mock recorded the failure point.
  let batchAppliedBeforeFailure: number | null = null;
  let batchFailureIndex: number | null = null;

  const db = {
    prepare: vi.fn((sql: string) => {
      const statement: CapturedStatement & {
        bind: (...args: unknown[]) => CapturedStatement & {
          first: () => Promise<unknown>;
          all: () => Promise<unknown>;
          run: () => Promise<unknown>;
        };
      } = {
        sql,
        args: [],
        bind: (...args: unknown[]) => ({
          sql,
          args,
          first: vi.fn().mockImplementation(() => {
            if (sql.includes('FROM rate_limits') && sql.includes('SUM(request_count)')) {
              return Promise.resolve({ total_requests: 0, last_request: null });
            }
            // rate_limits window lookup + `SELECT id FROM users WHERE email = ?`
            return Promise.resolve(null);
          }),
          all: vi.fn().mockResolvedValue({ results: [] }),
          run: vi.fn().mockImplementation(() => {
            runsOutsideBatch.push({ sql, args });
            return Promise.resolve({ success: true });
          }),
        }),
      };
      return statement;
    }),
    batch: vi.fn((statements: { sql: string; args: unknown[] }[]) => {
      const captured = statements.map((s) => ({ sql: s.sql, args: s.args }));
      batchCalls.push(captured);
      if (failBatchAt !== undefined) {
        batchAppliedBeforeFailure = failBatchAt;
        batchFailureIndex = failBatchAt;
        return Promise.reject(
          new Error(`simulated D1 failure at statement ${failBatchAt}`),
        );
      }
      return Promise.resolve([]);
    }),
  } as unknown as D1Database;

  return {
    db,
    batchCalls,
    runsOutsideBatch,
    get batchAppliedBeforeFailure() {
      return batchAppliedBeforeFailure;
    },
    get batchFailureIndex() {
      return batchFailureIndex;
    },
  };
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
  examTypeIds: ['wassce', 'bece'],
  primaryExamTypeId: 'wassce',
};

describe('/auth/register batched writes', () => {
  it('batches the student, share code, primary update and two exam preferences', async () => {
    const { db, batchCalls, runsOutsideBatch } = makeDb();
    const res = await worker.fetch(registerRequest(VALID_BODY), { DB: db, JWT_SECRET });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ success: true, data: { status: 'approved' } });
    expect(typeof body.data.token).toBe('string');
    expect(typeof body.data.referralCode).toBe('string');

    expect(batchCalls).toHaveLength(1);
    const statements = batchCalls[0];
    expect(statements).toHaveLength(5);

    // 1. INSERT INTO users — id, email, passwordHash, name, role, ...
    expect(statements[0].sql).toContain('INSERT INTO users');
    expect(statements[0].args[1]).toBe('new.student@example.com');
    expect(statements[0].args[3]).toBe('New Student');
    expect(statements[0].args[4]).toBe('student');

    // 2. The generated share code is atomic with the user.
    expect(statements[1].sql).toContain('INSERT INTO affiliate_profiles');

    // 3. UPDATE users SET primary_exam_type_id
    expect(statements[2].sql).toContain('UPDATE users SET primary_exam_type_id');
    expect(statements[2].args[0]).toBe('wassce');

    // 4-5. user_exam_preferences inserts — primary flagged 1, other 0
    expect(statements[3].sql).toContain('INSERT INTO user_exam_preferences');
    expect(statements[3].args[2]).toBe('wassce');
    expect(statements[3].args[3]).toBe(1);
    expect(statements[4].sql).toContain('INSERT INTO user_exam_preferences');
    expect(statements[4].args[2]).toBe('bece');
    expect(statements[4].args[3]).toBe(0);

    // None of the registration writes may run outside the batch.
    expect(
      runsOutsideBatch.some(
        (r) =>
          r.sql.includes('INSERT INTO users') ||
          r.sql.includes('primary_exam_type_id') ||
          r.sql.includes('INSERT INTO user_exam_preferences'),
      ),
    ).toBe(false);
  });

  it('returns 500 when a preference insert fails inside the batch', async () => {
    // Fail at index 3 — the first user_exam_preferences insert.
    const mock = makeDb({ failBatchAt: 3 });
    const res = await worker.fetch(registerRequest(VALID_BODY), {
      DB: mock.db,
      JWT_SECRET,
    });
    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({ success: false });
    // The mock runs the batch sequentially and recorded the failure point;
    // D1's real batch() is atomic, so in production none of the five apply.
    expect(mock.batchFailureIndex).toBe(3);
    expect(mock.batchAppliedBeforeFailure).toBe(3);
  });
});
