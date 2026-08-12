import { describe, it, expect, vi } from 'vitest';
import { sign } from 'hono/jwt';
import worker from '../index';

// Pilot schools admin endpoints (Task 1).
//
// Cases (from the task brief):
// (a) create school → INSERT row + 400 on duplicate slug (pre-check and
//     UNIQUE-constraint fallback)
// (b) ambassador provisioning → user + affiliate profile in ONE batch, code
//     uppercased, 409 on second ambassador / taken code
// (c) bulk assign — mixed list (valid unassigned / unknown email /
//     already-assigned) → correct assigned/skipped split, never reassigns
// (d) individual assign + force reassign + unassign
// (e) all routes 401 without a token, 403 with a student-role token
//
// Mock pattern copied from register-referral.test.ts: prepare().bind()
// captures sql+args, batch() records each batch's statements, run() calls
// outside batches are logged in `runs`.

const JWT_SECRET = 'test-secret';

interface CapturedStatement {
  sql: string;
  args: unknown[];
}

const SCHOOL = {
  id: 'sch_achimota',
  name: 'Achimota School',
  slug: 'achimota',
  status: 'active',
  created_at: '2026-08-01 00:00:00',
};

interface DbOptions {
  // Role returned for the requireAdmin per-request users lookup.
  authRole?: 'admin' | 'student';
  // Rows for the GET /schools list query (.all()).
  schoolsList?: unknown[];
  // Row for `SELECT id FROM schools WHERE slug = ?` (duplicate-slug pre-check).
  slugRow?: unknown;
  // Row for `SELECT ... FROM schools WHERE id = ?`.
  schoolRow?: unknown;
  // Row for the existing-ambassador lookup (users with @ambassador.brilla).
  ambassadorRow?: unknown;
  // Row for `SELECT id FROM affiliate_profiles WHERE referral_code = ?`.
  codeRow?: unknown;
  // Users found by the bulk-assign `WHERE email IN (...)` select.
  usersByEmail?: Record<string, { id: string; school_id: string | null }>;
  // Row for `SELECT id, school_id FROM users WHERE id = ?` (individual assign).
  userRow?: unknown;
  // meta.changes returned by run().
  runChanges?: number;
  // Error thrown by run() for INSERT INTO schools (UNIQUE fallback path).
  insertError?: Error;
}

function makeDb(opts: DbOptions = {}) {
  const batchCalls: CapturedStatement[][] = [];
  const allCalls: CapturedStatement[] = [];
  const runs: CapturedStatement[] = [];

  const stmtFor = (sql: string, args: unknown[]) => ({
    sql,
    args,
    first: vi.fn().mockImplementation(() => {
      if (sql.includes('role, status, is_active FROM users')) {
        return Promise.resolve(
          (opts.authRole ?? 'admin') === 'admin'
            ? { role: 'admin', status: 'approved', is_active: 1 }
            : { role: 'student', status: 'approved', is_active: 1 },
        );
      }
      if (sql.includes('FROM schools') && sql.includes('slug = ?')) {
        return Promise.resolve(opts.slugRow ?? null);
      }
      if (sql.includes('FROM schools') && sql.includes('id = ?')) {
        return Promise.resolve(opts.schoolRow ?? null);
      }
      if (sql.includes('@ambassador.brilla')) {
        return Promise.resolve(opts.ambassadorRow ?? null);
      }
      if (sql.includes('FROM affiliate_profiles') && sql.includes('referral_code = ?')) {
        return Promise.resolve(opts.codeRow ?? null);
      }
      if (sql.includes('FROM users') && sql.includes('WHERE id = ?')) {
        return Promise.resolve(opts.userRow ?? null);
      }
      return Promise.resolve(null);
    }),
    all: vi.fn().mockImplementation(() => {
      if (sql.includes('FROM schools')) {
        return Promise.resolve({ results: opts.schoolsList ?? [] });
      }
      if (sql.includes('FROM users') && sql.includes('email IN')) {
        const rows = Object.entries(opts.usersByEmail ?? {})
          .filter(([email]) => args.includes(email))
          .map(([email, u]) => ({ id: u.id, email, school_id: u.school_id }));
        return Promise.resolve({ results: rows });
      }
      return Promise.resolve({ results: [] });
    }),
    run: vi.fn().mockImplementation(() => {
      runs.push({ sql, args });
      if (opts.insertError && sql.includes('INSERT INTO schools')) {
        return Promise.reject(opts.insertError);
      }
      return Promise.resolve({ success: true, meta: { changes: opts.runChanges ?? 1 } });
    }),
  });

  const db = {
    prepare: vi.fn((sql: string) => ({
      sql,
      ...stmtFor(sql, []),
      bind: (...args: unknown[]) => {
        allCalls.push({ sql, args });
        return stmtFor(sql, args);
      },
    })),
    batch: vi.fn((statements: CapturedStatement[]) => {
      batchCalls.push(statements.map((s) => ({ sql: s.sql, args: s.args })));
      return Promise.resolve([]);
    }),
  } as unknown as D1Database;

  return { db, batchCalls, allCalls, runs };
}

async function authHeader(role: 'admin' | 'student' = 'admin') {
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

function adminRequest(
  path: string,
  method: string,
  body?: unknown,
  headers: Record<string, string> = {},
) {
  return new Request(`http://x/api/admin${path}`, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json', ...headers } : headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

describe('admin pilot-schools endpoints (Task 1)', () => {
  it('(a) POST /schools inserts a row with id sch_<slug> and returns it', async () => {
    const { db, runs } = makeDb();
    const res = await worker.fetch(
      adminRequest('/schools', 'POST', { name: 'Achimota School', slug: 'achimota' }, await authHeader()),
      { DB: db, JWT_SECRET },
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ success: true, data: { id: 'sch_achimota' } });

    const insert = runs.find((r) => r.sql.includes('INSERT INTO schools'));
    expect(insert).toBeDefined();
    expect(insert!.args).toEqual(['sch_achimota', 'Achimota School', 'achimota']);
  });

  it('(a) POST /schools → 400 on duplicate slug (pre-check), no insert attempted', async () => {
    const { db, runs } = makeDb({ slugRow: { id: 'sch_achimota' } });
    const res = await worker.fetch(
      adminRequest('/schools', 'POST', { name: 'Achimota School', slug: 'achimota' }, await authHeader()),
      { DB: db, JWT_SECRET },
    );
    expect(res.status).toBe(400);
    expect((await res.json()).success).toBe(false);
    expect(runs.some((r) => r.sql.includes('INSERT INTO schools'))).toBe(false);
  });

  it('(a) POST /schools → 400 when the INSERT hits the UNIQUE constraint (race fallback)', async () => {
    const { db } = makeDb({
      insertError: new Error('UNIQUE constraint failed: schools.slug'),
    });
    const res = await worker.fetch(
      adminRequest('/schools', 'POST', { name: 'Achimota School', slug: 'achimota' }, await authHeader()),
      { DB: db, JWT_SECRET },
    );
    expect(res.status).toBe(400);
    expect((await res.json()).success).toBe(false);
  });

  it('(a) POST /schools validates name (2-100) and slug (/^[a-z0-9-]{2,40}$/)', async () => {
    const { db, runs } = makeDb();
    const headers = await authHeader();

    const badSlug = await worker.fetch(
      adminRequest('/schools', 'POST', { name: 'Valid Name', slug: 'Bad Slug!' }, headers),
      { DB: db, JWT_SECRET },
    );
    expect(badSlug.status).toBe(400);

    const shortName = await worker.fetch(
      adminRequest('/schools', 'POST', { name: 'X', slug: 'valid-slug' }, headers),
      { DB: db, JWT_SECRET },
    );
    expect(shortName.status).toBe(400);

    expect(runs.some((r) => r.sql.includes('INSERT INTO schools'))).toBe(false);
  });

  it('(b) POST /schools/:id/ambassador batches the user + affiliate profile and uppercases the code', async () => {
    const { db, batchCalls } = makeDb({ schoolRow: SCHOOL });
    const res = await worker.fetch(
      adminRequest('/schools/sch_achimota/ambassador', 'POST', { code: 'achim26' }, await authHeader()),
      { DB: db, JWT_SECRET },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.code).toBe('ACHIM26');
    expect(typeof body.data.userId).toBe('string');

    // Both writes in ONE batch.
    expect(batchCalls).toHaveLength(1);
    const batch = batchCalls[0];
    expect(batch).toHaveLength(2);

    // Ambassador user: ambassador_<slug>@ambassador.brilla, disabled password
    // sentinel, "<School> Ambassador", approved/active/verified, school bound.
    const userInsert = batch[0];
    expect(userInsert.sql).toContain('INSERT INTO users');
    expect(userInsert.sql).toContain("'approved'");
    expect(userInsert.args[1]).toBe('ambassador_achimota@ambassador.brilla');
    expect(userInsert.args[2]).toMatch(/^disabled_ambassador_/);
    expect(userInsert.args[3]).toBe('Achimota School Ambassador');
    expect(userInsert.args[userInsert.args.length - 1]).toBe('sch_achimota');

    // Affiliate profile: uppercased referral code, ambassador user_id.
    const profileInsert = batch[1];
    expect(profileInsert.sql).toContain('INSERT INTO affiliate_profiles');
    expect(profileInsert.args[1]).toBe(body.data.userId);
    expect(profileInsert.args[2]).toBe('ACHIM26');
  });

  it('(b) POST /schools/:id/ambassador → 409 when the school already has an ambassador', async () => {
    const { db, batchCalls } = makeDb({ schoolRow: SCHOOL, ambassadorRow: { id: 'user_existing' } });
    const res = await worker.fetch(
      adminRequest('/schools/sch_achimota/ambassador', 'POST', { code: 'NEWCODE1' }, await authHeader()),
      { DB: db, JWT_SECRET },
    );
    expect(res.status).toBe(409);
    expect((await res.json()).success).toBe(false);
    expect(batchCalls).toHaveLength(0);
  });

  it('(b) POST /schools/:id/ambassador → 409 on a taken code, 400 on a bad format, 404 on unknown school', async () => {
    const headers = await authHeader();

    const taken = makeDb({ schoolRow: SCHOOL, codeRow: { id: 'aff_1' } });
    const resTaken = await worker.fetch(
      adminRequest('/schools/sch_achimota/ambassador', 'POST', { code: 'TAKEN123' }, headers),
      { DB: taken.db, JWT_SECRET },
    );
    expect(resTaken.status).toBe(409);
    expect(taken.batchCalls).toHaveLength(0);

    const badFmt = makeDb({ schoolRow: SCHOOL });
    const resBad = await worker.fetch(
      adminRequest('/schools/sch_achimota/ambassador', 'POST', { code: 'bad!' }, headers),
      { DB: badFmt.db, JWT_SECRET },
    );
    expect(resBad.status).toBe(400);
    expect(badFmt.batchCalls).toHaveLength(0);

    const noSchool = makeDb({ schoolRow: null });
    const res404 = await worker.fetch(
      adminRequest('/schools/sch_ghost/ambassador', 'POST', { code: 'VALID123' }, headers),
      { DB: noSchool.db, JWT_SECRET },
    );
    expect(res404.status).toBe(404);
    expect(noSchool.batchCalls).toHaveLength(0);
  });

  it('(c) POST /schools/:id/students splits assigned/skipped and never reassigns', async () => {
    const { db, batchCalls } = makeDb({
      schoolRow: SCHOOL,
      usersByEmail: {
        'free@test.dev': { id: 'user_free', school_id: null },
        'taken@test.dev': { id: 'user_taken', school_id: 'sch_other' },
      },
    });
    const res = await worker.fetch(
      adminRequest(
        '/schools/sch_achimota/students',
        'POST',
        { emails: ['free@test.dev', 'ghost@test.dev', 'taken@test.dev'] },
        await authHeader(),
      ),
      { DB: db, JWT_SECRET },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.assigned).toBe(1);
    expect(body.data.skipped).toEqual(
      expect.arrayContaining([
        { email: 'ghost@test.dev', reason: 'not_found' },
        { email: 'taken@test.dev', reason: 'already_assigned' },
      ]),
    );
    expect(body.data.skipped).toHaveLength(2);

    // One batch, containing only the unassigned user's UPDATE — the
    // already-assigned user is never re-binded.
    expect(batchCalls).toHaveLength(1);
    const batch = batchCalls[0];
    expect(batch).toHaveLength(1);
    expect(batch[0].sql).toContain('UPDATE users SET school_id = ?');
    expect(batch[0].sql).toContain('school_id IS NULL');
    expect(batch[0].args).toEqual(['sch_achimota', 'free@test.dev']);
  });

  it('(c) POST /schools/:id/students rejects >500 emails and non-array bodies', async () => {
    const { db } = makeDb({ schoolRow: SCHOOL });
    const headers = await authHeader();

    const tooMany = await worker.fetch(
      adminRequest('/schools/sch_achimota/students', 'POST', { emails: Array(501).fill('a@b.co') }, headers),
      { DB: db, JWT_SECRET },
    );
    expect(tooMany.status).toBe(400);

    const notArray = await worker.fetch(
      adminRequest('/schools/sch_achimota/students', 'POST', { emails: 'a@b.co' }, headers),
      { DB: db, JWT_SECRET },
    );
    expect(notArray.status).toBe(400);
  });

  it('(d) POST /schools/:id/students/:userId assigns an unassigned user', async () => {
    const { db, runs } = makeDb({
      schoolRow: SCHOOL,
      userRow: { id: 'user_1', school_id: null },
    });
    const res = await worker.fetch(
      adminRequest('/schools/sch_achimota/students/user_1', 'POST', {}, await authHeader()),
      { DB: db, JWT_SECRET },
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      success: true,
      data: { userId: 'user_1', schoolId: 'sch_achimota' },
    });

    const update = runs.find((r) => r.sql.includes('UPDATE users SET school_id = ?'));
    expect(update).toBeDefined();
    expect(update!.args).toEqual(['sch_achimota', 'user_1']);
  });

  it('(d) POST /schools/:id/students/:userId → 409 on reassignment without force, 200 with force', async () => {
    const headers = await authHeader();

    const noForce = makeDb({ schoolRow: SCHOOL, userRow: { id: 'user_1', school_id: 'sch_other' } });
    const res409 = await worker.fetch(
      adminRequest('/schools/sch_achimota/students/user_1', 'POST', {}, headers),
      { DB: noForce.db, JWT_SECRET },
    );
    expect(res409.status).toBe(409);
    expect(noForce.runs.some((r) => r.sql.includes('UPDATE users SET school_id'))).toBe(false);

    const forced = makeDb({ schoolRow: SCHOOL, userRow: { id: 'user_1', school_id: 'sch_other' } });
    const res200 = await worker.fetch(
      adminRequest('/schools/sch_achimota/students/user_1', 'POST', { force: true }, headers),
      { DB: forced.db, JWT_SECRET },
    );
    expect(res200.status).toBe(200);
    expect(await res200.json()).toMatchObject({
      success: true,
      data: { userId: 'user_1', schoolId: 'sch_achimota' },
    });
  });

  it('(d) DELETE /schools/:id/students/:userId unassigns (school_id → NULL)', async () => {
    const { db, runs } = makeDb({ schoolRow: SCHOOL });
    const res = await worker.fetch(
      adminRequest('/schools/sch_achimota/students/user_1', 'DELETE', undefined, await authHeader()),
      { DB: db, JWT_SECRET },
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ success: true, data: { userId: 'user_1' } });

    const update = runs.find(
      (r) => r.sql.includes('UPDATE users SET school_id = NULL') && r.sql.includes('school_id = ?'),
    );
    expect(update).toBeDefined();
    expect(update!.args).toEqual(['user_1', 'sch_achimota']);
  });

  it('(d) assign/unassign → 404 when the school, user, or assignment does not exist', async () => {
    const headers = await authHeader();

    const noSchool = makeDb({ schoolRow: null });
    const res404School = await worker.fetch(
      adminRequest('/schools/sch_ghost/students/user_1', 'POST', {}, headers),
      { DB: noSchool.db, JWT_SECRET },
    );
    expect(res404School.status).toBe(404);

    const noUser = makeDb({ schoolRow: SCHOOL, userRow: null });
    const res404User = await worker.fetch(
      adminRequest('/schools/sch_achimota/students/user_ghost', 'POST', {}, headers),
      { DB: noUser.db, JWT_SECRET },
    );
    expect(res404User.status).toBe(404);

    const noAssignment = makeDb({ schoolRow: SCHOOL, runChanges: 0 });
    const res404Unassign = await worker.fetch(
      adminRequest('/schools/sch_achimota/students/user_1', 'DELETE', undefined, headers),
      { DB: noAssignment.db, JWT_SECRET },
    );
    expect(res404Unassign.status).toBe(404);
  });

  it('GET /schools returns the mapped envelope with studentCount and ambassadorCode', async () => {
    const { db } = makeDb({
      schoolsList: [
        { ...SCHOOL, student_count: 3, ambassador_code: 'ACHIM26' },
        {
          id: 'sch_mfantsipim',
          name: 'Mfantsipim School',
          slug: 'mfantsipim',
          status: 'active',
          created_at: '2026-08-02 00:00:00',
          student_count: 0,
          ambassador_code: null,
        },
      ],
    });
    const res = await worker.fetch(
      adminRequest('/schools', 'GET', undefined, await authHeader()),
      { DB: db, JWT_SECRET },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.schools).toEqual([
      {
        id: 'sch_achimota',
        name: 'Achimota School',
        slug: 'achimota',
        status: 'active',
        studentCount: 3,
        ambassadorCode: 'ACHIM26',
        createdAt: '2026-08-01 00:00:00',
      },
      {
        id: 'sch_mfantsipim',
        name: 'Mfantsipim School',
        slug: 'mfantsipim',
        status: 'active',
        studentCount: 0,
        ambassadorCode: null,
        createdAt: '2026-08-02 00:00:00',
      },
    ]);
  });

  it('(e) all routes → 401 without a token, 403 with a student-role token', async () => {
    const routes: Array<[string, string, unknown?]> = [
      ['GET', '/schools'],
      ['POST', '/schools', { name: 'Achimota School', slug: 'achimota' }],
      ['POST', '/schools/sch_achimota/ambassador', { code: 'ACHIM26' }],
      ['POST', '/schools/sch_achimota/students', { emails: ['a@b.co'] }],
      ['POST', '/schools/sch_achimota/students/user_1', {}],
      ['DELETE', '/schools/sch_achimota/students/user_1'],
    ];

    // No token → 401.
    const anon = makeDb();
    for (const [method, path, body] of routes) {
      const res = await worker.fetch(adminRequest(path, method, body), { DB: anon.db, JWT_SECRET });
      expect(res.status).toBe(401);
    }

    // Student token → 403 (role re-checked from the users table).
    const student = makeDb({ authRole: 'student' });
    const headers = await authHeader('student');
    for (const [method, path, body] of routes) {
      const res = await worker.fetch(adminRequest(path, method, body, headers), {
        DB: student.db,
        JWT_SECRET,
      });
      expect(res.status).toBe(403);
    }
  });
});
