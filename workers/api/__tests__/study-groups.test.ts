import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import { studyGroupsApp } from '../study-groups';
import { createMockD1, type MockHandler } from './helpers/mockD1';

// Route tests for the study-groups sub-app: CRUD, join/leave, group feed,
// membership enforcement, and IDOR (identity always from the verified JWT).

const JWT_SECRET = 'test-secret-that-is-long-enough';

const app = new Hono();
app.route('/api/study-groups', studyGroupsApp);

const authUser = { role: 'student', status: 'approved', is_active: 1, session_version: 0 };

function authHandler(): MockHandler {
  return {
    match: /SELECT role, status, is_active, session_version FROM users/,
    first: () => authUser,
  };
}

function catchAll(): MockHandler {
  return {
    match: /./,
    first: () => null,
    all: () => ({ results: [] }),
    run: () => ({ success: true, meta: { changes: 1 } }),
  };
}

async function token(userId: string) {
  return sign(
    { userId, role: 'student', exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000) },
    JWT_SECRET,
  );
}

function post(url: string, body: unknown, t: string) {
  return new Request(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function get(url: string, t?: string) {
  return new Request(url, t ? { headers: { Authorization: `Bearer ${t}` } } : {});
}

const env = (db: unknown) => ({ DB: db as D1Database, JWT_SECRET, ENVIRONMENT: 'test' });

const publicGroup = {
  id: 'sg_1',
  name: 'Math Masters',
  description: null,
  icon: 'users',
  color: '#3B82F6',
  owner_id: 'owner_1',
  subject_id: null,
  is_public: 1,
  max_members: 20,
  weekly_goal_xp: 1000,
  created_at: '2026-09-01 10:00:00',
};

describe('study-groups auth', () => {
  it('returns 401 without a token', async () => {
    const db = createMockD1([authHandler(), catchAll()]);
    const res = await app.fetch(get('http://x/api/study-groups/my'), env(db));
    expect(res.status).toBe(401);
  });

  it('ignores spoofed x-user-* headers', async () => {
    const db = createMockD1([authHandler(), catchAll()]);
    const res = await app.fetch(
      new Request('http://x/api/study-groups/my', {
        headers: { 'x-user-id': 'student_1', 'x-user-role': 'student' },
      }),
      env(db),
    );
    expect(res.status).toBe(401);
  });
});

describe('GET /api/study-groups/my', () => {
  it('returns only groups the JWT user belongs to', async () => {
    const db = createMockD1([
      authHandler(),
      {
        match: /JOIN study_group_members me ON me\.group_id = g\.id AND me\.user_id = \?/,
        all: () => ({ results: [{ ...publicGroup, member_count: 3, weekly_progress: 120 }] }),
      },
      catchAll(),
    ]);
    const t = await token('user_1');
    const res = await app.fetch(get('http://x/api/study-groups/my', t), env(db));
    expect(res.status).toBe(200);

    const listCall = db.calls.find((c) => c.sql.includes('JOIN study_group_members me'));
    expect(listCall!.binds).toEqual(['user_1']);

    const body = (await res.json()) as { success: boolean; data: { groups: unknown[] } };
    expect(body.success).toBe(true);
    expect(body.data.groups).toHaveLength(1);
  });
});

describe('GET /api/study-groups/public', () => {
  it('lists only public groups with a clamped limit', async () => {
    const db = createMockD1([
      authHandler(),
      {
        match: /WHERE g\.is_public = 1/,
        all: () => ({ results: [{ ...publicGroup, member_count: 3, weekly_progress: 0 }] }),
      },
      catchAll(),
    ]);
    const t = await token('user_1');
    const res = await app.fetch(get('http://x/api/study-groups/public?limit=9999', t), env(db));
    expect(res.status).toBe(200);

    const listCall = db.calls.find((c) => c.sql.includes('WHERE g.is_public = 1'));
    expect(listCall!.binds).toEqual([100]);
  });
});

describe('POST /api/study-groups', () => {
  function makeCreateDb() {
    return createMockD1([authHandler(), catchAll()]);
  }

  it('creates the group and an owner membership, bound to the JWT identity', async () => {
    const db = makeCreateDb();
    const t = await token('creator_1');
    const res = await app.fetch(
      post(
        'http://x/api/study-groups',
        { name: 'WASSCE Bio Crew', description: 'Bio grinders', is_public: true, max_members: 10 },
        t,
      ),
      env(db),
    );
    expect(res.status).toBe(200);

    const insertGroup = db.calls.find((c) => c.sql.includes('INSERT INTO study_groups'));
    expect(insertGroup).toBeDefined();
    expect(insertGroup!.binds[1]).toBe('WASSCE Bio Crew');
    expect(insertGroup!.binds[3]).toBe('creator_1'); // owner_id from JWT
    expect(insertGroup!.binds[5]).toBe(1); // is_public
    expect(insertGroup!.binds[6]).toBe(10); // max_members

    const insertMember = db.calls.find((c) => c.sql.includes('INSERT INTO study_group_members'));
    expect(insertMember).toBeDefined();
    expect(insertMember!.sql).toContain("'owner'");
    expect(insertMember!.binds[2]).toBe('creator_1');

    const body = (await res.json()) as { success: boolean; data: { group_id: string } };
    expect(body.data.group_id).toMatch(/^sg_/);
  });

  it('rejects a missing/short name with 400 and writes nothing', async () => {
    const db = makeCreateDb();
    const t = await token('creator_1');
    const res = await app.fetch(post('http://x/api/study-groups', { name: 'x' }, t), env(db));
    expect(res.status).toBe(400);
    expect(db.calls.some((c) => c.sql.includes('INSERT INTO study_groups'))).toBe(false);
  });

  it('rejects out-of-range max_members', async () => {
    const db = makeCreateDb();
    const t = await token('creator_1');
    const res = await app.fetch(
      post('http://x/api/study-groups', { name: 'Valid Name', max_members: 5000 }, t),
      env(db),
    );
    expect(res.status).toBe(400);
  });

  it('rejects malformed JSON with 400', async () => {
    const db = makeCreateDb();
    const t = await token('creator_1');
    const res = await app.fetch(
      new Request('http://x/api/study-groups', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: '{not json',
      }),
      env(db),
    );
    expect(res.status).toBe(400);
  });
});

describe('POST /api/study-groups/:id/join', () => {
  function makeJoinDb(opts: {
    group?: Record<string, unknown> | null;
    existing?: { id: string; role: string } | null;
    memberCount?: number;
  }) {
    return createMockD1([
      authHandler(),
      { match: /FROM study_groups WHERE id = \?/, first: () => (opts.group === undefined ? publicGroup : opts.group) },
      { match: /SELECT id, role FROM study_group_members/, first: () => opts.existing ?? null },
      { match: /SELECT COUNT\(\*\) AS cnt/, first: () => ({ cnt: opts.memberCount ?? 1 }) },
      catchAll(),
    ]);
  }

  it('joins a public group as the JWT user', async () => {
    const db = makeJoinDb({});
    const t = await token('joiner_1');
    const res = await app.fetch(post('http://x/api/study-groups/sg_1/join', {}, t), env(db));
    expect(res.status).toBe(200);

    const insert = db.calls.find((c) => c.sql.includes('INSERT INTO study_group_members'));
    expect(insert).toBeDefined();
    expect(insert!.binds[1]).toBe('sg_1');
    expect(insert!.binds[2]).toBe('joiner_1');
  });

  it('is idempotent for existing members', async () => {
    const db = makeJoinDb({ existing: { id: 'sgm_1', role: 'member' } });
    const t = await token('joiner_1');
    const res = await app.fetch(post('http://x/api/study-groups/sg_1/join', {}, t), env(db));
    expect(res.status).toBe(200);
    expect(db.calls.some((c) => c.sql.includes('INSERT INTO study_group_members'))).toBe(false);
  });

  it('rejects joining a private group with 403', async () => {
    const db = makeJoinDb({ group: { ...publicGroup, is_public: 0 } });
    const t = await token('joiner_1');
    const res = await app.fetch(post('http://x/api/study-groups/sg_1/join', {}, t), env(db));
    expect(res.status).toBe(403);
  });

  it('rejects joining a full group with 409', async () => {
    const db = makeJoinDb({ memberCount: 20 });
    const t = await token('joiner_1');
    const res = await app.fetch(post('http://x/api/study-groups/sg_1/join', {}, t), env(db));
    expect(res.status).toBe(409);
  });

  it('returns 404 for an unknown group', async () => {
    const db = makeJoinDb({ group: null });
    const t = await token('joiner_1');
    const res = await app.fetch(post('http://x/api/study-groups/sg_nope/join', {}, t), env(db));
    expect(res.status).toBe(404);
  });
});

describe('POST /api/study-groups/:id/leave', () => {
  function makeLeaveDb(membership: { id: string; role: string } | null) {
    return createMockD1([
      authHandler(),
      { match: /SELECT id, role FROM study_group_members/, first: () => membership },
      catchAll(),
    ]);
  }

  it('lets a member leave', async () => {
    const db = makeLeaveDb({ id: 'sgm_1', role: 'member' });
    const t = await token('member_1');
    const res = await app.fetch(post('http://x/api/study-groups/sg_1/leave', {}, t), env(db));
    expect(res.status).toBe(200);
    const del = db.calls.find((c) => c.sql.includes('DELETE FROM study_group_members'));
    expect(del!.binds).toEqual(['sgm_1']);
  });

  it('blocks the owner from leaving', async () => {
    const db = makeLeaveDb({ id: 'sgm_1', role: 'owner' });
    const t = await token('owner_1');
    const res = await app.fetch(post('http://x/api/study-groups/sg_1/leave', {}, t), env(db));
    expect(res.status).toBe(400);
    expect(db.calls.some((c) => c.sql.includes('DELETE FROM study_group_members'))).toBe(false);
  });

  it('returns 404 for a non-member', async () => {
    const db = makeLeaveDb(null);
    const t = await token('outsider_1');
    const res = await app.fetch(post('http://x/api/study-groups/sg_1/leave', {}, t), env(db));
    expect(res.status).toBe(404);
  });
});

describe('GET /api/study-groups/:id', () => {
  function makeDetailDb(opts: {
    group?: Record<string, unknown> | null;
    membership?: { id: string; role: string } | null;
  }) {
    return createMockD1([
      authHandler(),
      { match: /FROM study_groups WHERE id = \?/, first: () => (opts.group === undefined ? publicGroup : opts.group) },
      { match: /SELECT id, role FROM study_group_members/, first: () => opts.membership ?? null },
      {
        match: /FROM study_group_members m\s+JOIN users u/,
        all: () => ({
          results: [
            {
              id: 'sgm_1',
              group_id: 'sg_1',
              user_id: 'owner_1',
              user_name: 'Owner One',
              user_avatar: null,
              role: 'owner',
              weekly_xp_contribution: 50,
              joined_at: '2026-09-01 10:00:00',
              last_active: null,
            },
          ],
        }),
      },
      catchAll(),
    ]);
  }

  it('serves a public group detail to a non-member', async () => {
    const db = makeDetailDb({});
    const t = await token('outsider_1');
    const res = await app.fetch(get('http://x/api/study-groups/sg_1', t), env(db));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { group: { id: string }; members: unknown[] } };
    expect(body.data.group.id).toBe('sg_1');
    expect(body.data.members).toHaveLength(1);
  });

  it('hides a private group from non-members (404, no leak)', async () => {
    const db = makeDetailDb({ group: { ...publicGroup, is_public: 0 } });
    const t = await token('outsider_1');
    const res = await app.fetch(get('http://x/api/study-groups/sg_1', t), env(db));
    expect(res.status).toBe(404);
  });

  it('serves a private group to a member', async () => {
    const db = makeDetailDb({
      group: { ...publicGroup, is_public: 0 },
      membership: { id: 'sgm_9', role: 'member' },
    });
    const t = await token('member_1');
    const res = await app.fetch(get('http://x/api/study-groups/sg_1', t), env(db));
    expect(res.status).toBe(200);
  });
});

describe('study group messages', () => {
  function makeMessagesDb(membership: { id: string; role: string } | null) {
    return createMockD1([
      authHandler(),
      { match: /SELECT id, role FROM study_group_members/, first: () => membership },
      {
        match: /FROM study_group_messages m\s+JOIN users u/,
        all: () => ({
          results: [
            {
              id: 'sgmsg_1',
              group_id: 'sg_1',
              user_id: 'member_1',
              user_name: 'Member One',
              user_avatar: null,
              message: 'hello',
              message_type: 'text',
              created_at: '2026-09-02 10:00:00',
            },
          ],
        }),
      },
      catchAll(),
    ]);
  }

  it('GET /:id/messages requires membership (403 for non-members)', async () => {
    const db = makeMessagesDb(null);
    const t = await token('outsider_1');
    const res = await app.fetch(get('http://x/api/study-groups/sg_1/messages', t), env(db));
    expect(res.status).toBe(403);
  });

  it('GET /:id/messages returns the feed for members', async () => {
    const db = makeMessagesDb({ id: 'sgm_1', role: 'member' });
    const t = await token('member_1');
    const res = await app.fetch(get('http://x/api/study-groups/sg_1/messages', t), env(db));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { messages: { message: string }[] } };
    expect(body.data.messages[0].message).toBe('hello');
  });

  it('POST /:id/messages stores the JWT identity and forces message_type text', async () => {
    const db = makeMessagesDb({ id: 'sgm_1', role: 'member' });
    const t = await token('member_1');
    const res = await app.fetch(
      post('http://x/api/study-groups/sg_1/messages', { message: 'hi', message_type: 'achievement' }, t),
      env(db),
    );
    expect(res.status).toBe(200);

    const insert = db.calls.find((c) => c.sql.includes('INSERT INTO study_group_messages'));
    expect(insert).toBeDefined();
    expect(insert!.sql).toContain("'text'");
    expect(insert!.binds[1]).toBe('sg_1');
    expect(insert!.binds[2]).toBe('member_1');
    expect(insert!.binds[3]).toBe('hi');
  });

  it('POST /:id/messages rejects non-members with 403', async () => {
    const db = makeMessagesDb(null);
    const t = await token('outsider_1');
    const res = await app.fetch(
      post('http://x/api/study-groups/sg_1/messages', { message: 'hi' }, t),
      env(db),
    );
    expect(res.status).toBe(403);
    expect(db.calls.some((c) => c.sql.includes('INSERT INTO study_group_messages'))).toBe(false);
  });

  it('POST /:id/messages rejects empty and oversized messages', async () => {
    const db = makeMessagesDb({ id: 'sgm_1', role: 'member' });
    const t = await token('member_1');
    const empty = await app.fetch(
      post('http://x/api/study-groups/sg_1/messages', { message: '   ' }, t),
      env(db),
    );
    expect(empty.status).toBe(400);
    const huge = await app.fetch(
      post('http://x/api/study-groups/sg_1/messages', { message: 'a'.repeat(2001) }, t),
      env(db),
    );
    expect(huge.status).toBe(400);
  });
});

describe('PUT/DELETE /api/study-groups/:id', () => {
  function makeManageDb(opts: { group?: Record<string, unknown> | null; role?: string | null }) {
    return createMockD1([
      authHandler(),
      { match: /FROM study_groups WHERE id = \?/, first: () => (opts.group === undefined ? publicGroup : opts.group) },
      {
        match: /SELECT id, role FROM study_group_members/,
        first: () => (opts.role ? { id: 'sgm_1', role: opts.role } : null),
      },
      { match: /SELECT COUNT\(\*\) AS cnt/, first: () => ({ cnt: 2 }) },
      catchAll(),
    ]);
  }

  it('PUT updates allowed fields for an owner', async () => {
    const db = makeManageDb({ role: 'owner' });
    const t = await token('owner_1');
    const res = await app.fetch(
      new Request('http://x/api/study-groups/sg_1', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Name', weekly_goal_xp: 2000 }),
      }),
      env(db),
    );
    expect(res.status).toBe(200);
    const update = db.calls.find((c) => c.sql.includes('UPDATE study_groups SET'));
    expect(update!.sql).toContain('name = ?');
    expect(update!.sql).toContain('weekly_goal_xp = ?');
    expect(update!.binds).toEqual(['New Name', 2000, 'sg_1']);
  });

  it('PUT rejects plain members with 403', async () => {
    const db = makeManageDb({ role: 'member' });
    const t = await token('member_1');
    const res = await app.fetch(
      new Request('http://x/api/study-groups/sg_1', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Hijacked' }),
      }),
      env(db),
    );
    expect(res.status).toBe(403);
    expect(db.calls.some((c) => c.sql.includes('UPDATE study_groups SET'))).toBe(false);
  });

  it('PUT rejects max_members below the current member count', async () => {
    const db = createMockD1([
      authHandler(),
      { match: /FROM study_groups WHERE id = \?/, first: () => publicGroup },
      { match: /SELECT id, role FROM study_group_members/, first: () => ({ id: 'sgm_1', role: 'owner' }) },
      { match: /SELECT COUNT\(\*\) AS cnt/, first: () => ({ cnt: 5 }) },
      catchAll(),
    ]);
    const t = await token('owner_1');
    const res = await app.fetch(
      new Request('http://x/api/study-groups/sg_1', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ max_members: 3 }),
      }),
      env(db),
    );
    expect(res.status).toBe(400);
    expect(db.calls.some((c) => c.sql.includes('UPDATE study_groups SET'))).toBe(false);
  });

  it('DELETE is owner-only and cascades members/messages', async () => {
    const db = makeManageDb({});
    const t = await token('owner_1');
    const res = await app.fetch(
      new Request('http://x/api/study-groups/sg_1', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${t}` },
      }),
      env(db),
    );
    expect(res.status).toBe(200);
    expect(db.calls.some((c) => c.sql.includes('DELETE FROM study_group_messages'))).toBe(true);
    expect(db.calls.some((c) => c.sql.includes('DELETE FROM study_group_members'))).toBe(true);
    expect(db.calls.some((c) => c.sql.includes('DELETE FROM study_groups WHERE id = ?'))).toBe(true);
  });

  it('DELETE rejects a non-owner with 403', async () => {
    const db = makeManageDb({ group: { ...publicGroup, owner_id: 'owner_1' } });
    const t = await token('attacker_1');
    const res = await app.fetch(
      new Request('http://x/api/study-groups/sg_1', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${t}` },
      }),
      env(db),
    );
    expect(res.status).toBe(403);
    expect(db.calls.some((c) => c.sql.includes('DELETE FROM study_groups'))).toBe(false);
  });
});
