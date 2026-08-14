import { describe, it, expect } from 'vitest';
import { sign } from 'hono/jwt';
import { chatApp } from '../chat';
import { createMockD1 } from './helpers/mockD1';

// Phase 3 Task 11 regression: GET /rooms previously issued 1 base query plus
// 2 queries per room (last message + DM other user) via a Promise.all loop.
// It must now issue exactly 1 route query (single SELECT with correlated
// subqueries) and reshape rows in JS, keeping the client contract unchanged.

const JWT_SECRET = 'test-secret-that-is-long-enough';
const USER_ID = 'user_1';
const AUTH_SQL = /role, status, is_active, session_version FROM users/;
const ROOMS_SQL = /FROM chat_rooms cr/;

const ACTIVE_USER = { role: 'student', status: 'approved', is_active: 1 };

const ROOM_ROW = {
  id: 'room_1',
  name: null,
  description: null,
  type: 'dm',
  subject_id: null,
  avatar_url: null,
  is_archived: 0,
  max_members: 2,
  created_by: USER_ID,
  created_at: '2026-08-01T00:00:00Z',
  updated_at: '2026-08-02T00:00:00Z',
  my_role: 'member',
  last_read_at: '2026-08-01T12:00:00Z',
  member_count: 2,
  unread_count: 3,
  last_message_content: 'see you tomorrow',
  last_message_at: '2026-08-02T01:00:00Z',
  last_message_sender_name: 'Ama',
  dm_other_id: 'user_2',
  dm_other_name: 'Ama',
  dm_other_avatar: 'https://x/ama.png',
};

function makeDb(roomsResults: unknown[]) {
  return createMockD1([
    // requireAuth per-request users lookup (Phase 1 auth unification).
    { match: AUTH_SQL, first: () => ACTIVE_USER },
    { match: ROOMS_SQL, all: () => ({ results: roomsResults }) },
  ]);
}

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

async function fetchRooms(db: ReturnType<typeof makeDb>) {
  const t = await token();
  return chatApp.fetch(
    new Request('http://x/rooms', { headers: { Authorization: `Bearer ${t}` } }),
    { DB: db as unknown as D1Database, JWT_SECRET },
  );
}

describe('GET /rooms single-query (Task 11)', () => {
  it('issues exactly 1 route query (plus the requireAuth lookup)', async () => {
    const db = makeDb([ROOM_ROW]);
    const res = await fetchRooms(db);
    expect(res.status).toBe(200);

    const authCalls = db.calls.filter((c) => AUTH_SQL.test(c.sql));
    const routeCalls = db.calls.filter((c) => !AUTH_SQL.test(c.sql));
    expect(authCalls).toHaveLength(1);
    expect(routeCalls).toHaveLength(1);

    // Distinct prepared SQL shapes for the route: exactly one.
    const shapes = new Set(routeCalls.map((c) => c.sql));
    expect(shapes.size).toBe(1);
    const [sql] = [...shapes];
    expect(sql).toMatch(/last_message_content/);
    expect(sql).toMatch(/dm_other_id/);

    // Bind order: unread_count, dm_other_id, dm_other_name, dm_other_avatar, join.
    expect(routeCalls[0].binds).toEqual([USER_ID, USER_ID, USER_ID, USER_ID, USER_ID]);
  });

  it('reshapes the flat row into the unchanged client shape (lastMessage, otherUser)', async () => {
    const db = makeDb([ROOM_ROW]);
    const res = await fetchRooms(db);
    const body = (await res.json()) as { success: boolean; data: Record<string, unknown>[] };
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);

    const room = body.data[0];
    expect(room.id).toBe('room_1');
    expect(room.myRole).toBe('member');
    expect(room.memberCount).toBe(2);
    expect(room.unreadCount).toBe(3);
    expect(room.lastMessage).toEqual({
      content: 'see you tomorrow',
      senderName: 'Ama',
      createdAt: '2026-08-02T01:00:00Z',
    });
    expect(room.otherUser).toEqual({
      id: 'user_2',
      name: 'Ama',
      avatarUrl: 'https://x/ama.png',
    });
  });

  it('returns null lastMessage/otherUser when the subqueries yield nothing', async () => {
    const db = makeDb([
      {
        ...ROOM_ROW,
        type: 'subject',
        last_message_content: null,
        last_message_at: null,
        last_message_sender_name: null,
        dm_other_id: null,
        dm_other_name: null,
        dm_other_avatar: null,
      },
    ]);
    const res = await fetchRooms(db);
    const body = (await res.json()) as { data: Record<string, unknown>[] };
    expect(body.data[0].lastMessage).toBeNull();
    expect(body.data[0].otherUser).toBeNull();
  });
});
