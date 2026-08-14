import { describe, it, expect } from 'vitest';
import { sign } from 'hono/jwt';
import { chatApp } from '../chat';
import { createMockD1 } from './helpers/mockD1';

// Phase 3 Task 16 regression: GET /dm, GET /rooms/:id/messages and
// GET /users/search previously issued per-item queries inside
// Promise.all(.map(async ...)) loops. Each route must now issue a constant
// number of queries regardless of row count, keeping the client contract
// unchanged.

const JWT_SECRET = 'test-secret-that-is-long-enough';
const USER_ID = 'user_1';
const AUTH_SQL = /role, status, is_active, session_version FROM users/;

const ACTIVE_USER = { role: 'student', status: 'approved', is_active: 1 };
const authHandler = { match: AUTH_SQL, first: () => ACTIVE_USER };

async function token() {
  return sign(
    {
      userId: USER_ID,
      role: 'student',
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    },
    JWT_SECRET,
  );
}

async function fetchChat(db: unknown, path: string) {
  const t = await token();
  return chatApp.fetch(new Request(`http://x${path}`, { headers: { Authorization: `Bearer ${t}` } }), {
    DB: db as D1Database,
    JWT_SECRET,
  });
}

function routeCalls(db: { calls: { sql: string }[] }) {
  return db.calls.filter((c) => !AUTH_SQL.test(c.sql));
}

// ---------------------------------------------------------------------------
// GET /dm — single query with correlated subqueries
// ---------------------------------------------------------------------------

const DM_SQL = /FROM chat_rooms cr/;

const DM_ROW = {
  id: 'dm_1',
  created_at: '2026-08-01T00:00:00Z',
  updated_at: '2026-08-02T00:00:00Z',
  last_read_at: '2026-08-01T12:00:00Z',
  other_user_id: 'user_2',
  other_user_name: 'Ama',
  other_user_avatar: 'https://x/ama.png',
  last_message_content: 'see you tomorrow',
  last_message_sender_id: 'user_2',
  last_message_at: '2026-08-02T01:00:00Z',
  unread_count: 3,
};

describe('GET /dm single-query (Task 16)', () => {
  it('issues exactly 1 route query (plus the requireAuth lookup)', async () => {
    const db = createMockD1([authHandler, { match: DM_SQL, all: () => ({ results: [DM_ROW] }) }]);
    const res = await fetchChat(db, '/dm');
    expect(res.status).toBe(200);

    const calls = routeCalls(db);
    expect(calls).toHaveLength(1);
    expect(calls[0].sql).toMatch(/other_user_id/);
    expect(calls[0].sql).toMatch(/last_message_sender_id/);
    expect(calls[0].sql).toMatch(/unread_count/);
    // Bind order: other_user id/name/avatar (3), unread_count, join.
    expect(calls[0].binds).toEqual([USER_ID, USER_ID, USER_ID, USER_ID, USER_ID]);
  });

  it('reshapes the flat row into the unchanged client shape', async () => {
    const db = createMockD1([authHandler, { match: DM_SQL, all: () => ({ results: [DM_ROW] }) }]);
    const res = await fetchChat(db, '/dm');
    const body = (await res.json()) as { success: boolean; data: Record<string, unknown>[] };
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);

    const dm = body.data[0];
    expect(dm.roomId).toBe('dm_1');
    expect(dm.otherUser).toEqual({ id: 'user_2', name: 'Ama', avatarUrl: 'https://x/ama.png' });
    expect(dm.lastMessage).toEqual({
      content: 'see you tomorrow',
      isFromMe: false,
      createdAt: '2026-08-02T01:00:00Z',
    });
    expect(dm.unreadCount).toBe(3);
    expect(dm.updatedAt).toBe('2026-08-02T00:00:00Z');
  });

  it('marks own last message isFromMe and nulls missing subquery results', async () => {
    const db = createMockD1([
      authHandler,
      {
        match: DM_SQL,
        all: () => ({
          results: [
            { ...DM_ROW, id: 'dm_2', last_message_sender_id: USER_ID },
            {
              ...DM_ROW,
              id: 'dm_3',
              other_user_id: null,
              other_user_name: null,
              other_user_avatar: null,
              last_message_content: null,
              last_message_sender_id: null,
              last_message_at: null,
              unread_count: 0,
            },
          ],
        }),
      },
    ]);
    const res = await fetchChat(db, '/dm');
    const body = (await res.json()) as { data: Record<string, unknown>[] };

    expect((body.data[0].lastMessage as Record<string, unknown>).isFromMe).toBe(true);
    expect(body.data[1].otherUser).toBeNull();
    expect(body.data[1].lastMessage).toBeNull();
    expect(body.data[1].unreadCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// GET /rooms/:id/messages — one reactions query + one replies query
// ---------------------------------------------------------------------------

const MSG_1 = {
  id: 'msg_1',
  room_id: 'room_1',
  sender_id: 'user_2',
  content: 'hello',
  content_type: 'text',
  file_url: null,
  file_name: null,
  file_size: null,
  reply_to_id: null,
  is_edited: 0,
  is_deleted: 0,
  created_at: '2026-08-02T00:00:00Z',
  updated_at: '2026-08-02T00:00:00Z',
  sender_name: 'Ama',
  sender_avatar: null,
};

const MSG_2 = {
  ...MSG_1,
  id: 'msg_2',
  content: 'hi back',
  reply_to_id: 'msg_1',
  created_at: '2026-08-02T01:00:00Z',
  updated_at: '2026-08-02T01:00:00Z',
};

function messagesDb() {
  return createMockD1([
    authHandler,
    // Membership check
    { match: /FROM chat_room_members WHERE room_id/, first: () => ({ role: 'member' }) },
    // Main messages page (DESC: newest first)
    { match: /WHERE cm\.room_id = \?/, all: () => ({ results: [MSG_2, MSG_1] }) },
    // Batched reactions over all message ids
    {
      match: /FROM chat_message_reactions/,
      all: () => ({
        results: [{ message_id: 'msg_2', emoji: '👍', count: 2, user_ids: 'user_1,user_2' }],
      }),
    },
    // Batched reply-to lookup over distinct reply_to ids
    {
      match: /WHERE cm\.id IN \(/,
      all: () => ({ results: [{ id: 'msg_1', content: 'hello', sender_name: 'Ama' }] }),
    },
    // Last-read update
    { match: /UPDATE chat_room_members/, run: () => ({ success: true, meta: { changes: 1 } }) },
  ]);
}

describe('GET /rooms/:id/messages batched reactions/replies (Task 16)', () => {
  it('issues a constant query count: membership + page + 1 reactions + 1 replies + last-read', async () => {
    const db = messagesDb();
    const res = await fetchChat(db, '/rooms/room_1/messages');
    expect(res.status).toBe(200);

    const calls = routeCalls(db);
    expect(calls).toHaveLength(5);

    const reactions = calls.filter((c) => /FROM chat_message_reactions/.test(c.sql));
    expect(reactions).toHaveLength(1);
    expect(reactions[0].sql).toMatch(/message_id IN \(/);
    expect(reactions[0].sql).toMatch(/GROUP BY message_id, emoji/);
    expect(reactions[0].binds).toEqual(['msg_2', 'msg_1']);

    const replies = calls.filter((c) => /WHERE cm\.id IN \(/.test(c.sql));
    expect(replies).toHaveLength(1);
    expect(replies[0].binds).toEqual(['msg_1']);
  });

  it('stitches reactions and replyTo back per message, chronological order preserved', async () => {
    const db = messagesDb();
    const res = await fetchChat(db, '/rooms/room_1/messages');
    const body = (await res.json()) as { success: boolean; data: Record<string, unknown>[] };
    expect(body.success).toBe(true);

    // Reversed to chronological order: msg_1 first.
    expect(body.data.map((m) => m.id)).toEqual(['msg_1', 'msg_2']);

    const first = body.data[0];
    expect(first.reactions).toEqual([]);
    expect(first.replyTo).toBeNull();

    const second = body.data[1];
    expect(second.replyTo).toEqual({ id: 'msg_1', content: 'hello', senderName: 'Ama' });
    expect(second.reactions).toEqual([
      { emoji: '👍', count: 2, userIds: ['user_1', 'user_2'], hasReacted: true },
    ]);
    expect(second.sender).toEqual({ id: 'user_2', name: 'Ama', avatarUrl: null });
  });

  it('skips the batched lookups entirely when the page is empty', async () => {
    const db = createMockD1([
      authHandler,
      { match: /FROM chat_room_members WHERE room_id/, first: () => ({ role: 'member' }) },
      { match: /WHERE cm\.room_id = \?/, all: () => ({ results: [] }) },
      { match: /UPDATE chat_room_members/, run: () => ({ success: true, meta: { changes: 1 } }) },
    ]);
    const res = await fetchChat(db, '/rooms/room_1/messages');
    expect(res.status).toBe(200);

    const calls = routeCalls(db);
    // membership + page + last-read only; no reactions/replies queries.
    expect(calls).toHaveLength(3);
    expect(calls.some((c) => /chat_message_reactions/.test(c.sql))).toBe(false);
    expect(calls.some((c) => /cm\.id IN \(/.test(c.sql))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// GET /users/search — one batched DM-status lookup
// ---------------------------------------------------------------------------

function searchDb() {
  return createMockD1([
    authHandler,
    {
      match: /u\.name LIKE/,
      all: () => ({
        results: [
          { id: 'user_2', name: 'Ama', avatar_url: 'https://x/ama.png', school_level: 'shs' },
          { id: 'user_3', name: 'Ama Serwaa', avatar_url: null, school_level: 'jhs' },
        ],
      }),
    },
    {
      match: /JOIN chat_room_members crm2/,
      all: () => ({ results: [{ user_id: 'user_2', room_id: 'dm_1' }] }),
    },
  ]);
}

describe('GET /users/search batched DM-status (Task 16)', () => {
  it('issues exactly 2 route queries regardless of candidate count', async () => {
    const db = searchDb();
    const res = await fetchChat(db, '/users/search?q=ama');
    expect(res.status).toBe(200);

    const calls = routeCalls(db);
    expect(calls).toHaveLength(2);

    const dmLookup = calls.find((c) => /JOIN chat_room_members crm2/.test(c.sql));
    expect(dmLookup).toBeDefined();
    expect(dmLookup!.sql).toMatch(/crm2\.user_id IN \(/);
    // Candidate ids first, then the caller id for the membership EXISTS.
    expect(dmLookup!.binds).toEqual(['user_2', 'user_3', USER_ID]);
  });

  it('maps existingDmId per user, null when no DM exists', async () => {
    const db = searchDb();
    const res = await fetchChat(db, '/users/search?q=ama');
    const body = (await res.json()) as { success: boolean; data: Record<string, unknown>[] };
    expect(body.success).toBe(true);
    expect(body.data).toEqual([
      {
        id: 'user_2',
        name: 'Ama',
        avatarUrl: 'https://x/ama.png',
        schoolLevel: 'shs',
        existingDmId: 'dm_1',
      },
      { id: 'user_3', name: 'Ama Serwaa', avatarUrl: null, schoolLevel: 'jhs', existingDmId: null },
    ]);
  });
});
