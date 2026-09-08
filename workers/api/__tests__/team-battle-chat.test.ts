import { describe, it, expect } from 'vitest';
import { sign } from 'hono/jwt';
import worker from '../index';
import { createMockD1, type MockHandler } from './helpers/mockD1';

// Spec 1.4c: battle-scoped team chat for 3v3 team battles. The channel reuses
// chat_messages with room_id = 'team_battle:<battleId>'; membership comes from
// team_battle_members, never chat_room_members.

const JWT_SECRET = 'test-secret-that-is-long-enough';

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

function get(url: string, t: string) {
  return new Request(url, { headers: { Authorization: `Bearer ${t}` } });
}

const env = (db: unknown) => ({ DB: db as D1Database, JWT_SECRET, ENVIRONMENT: 'test' });

// members maps "<battleId>:<userId>" -> team_number for the membership gate.
function chatDb(opts: {
  battleExists?: boolean;
  members?: Record<string, number>;
  messageRows?: Record<string, unknown>[];
} = {}) {
  const members = opts.members ?? { 'tb_1:u1': 1 };
  return createMockD1([
    authHandler(),
    {
      match: /SELECT id FROM team_battles WHERE id = \?/,
      first: (binds) => (opts.battleExists === false ? null : { id: binds[0] }),
    },
    {
      match: /SELECT team_number FROM team_battle_members WHERE battle_id = \? AND user_id = \?/,
      first: (binds) => {
        const team = members[`${binds[0]}:${binds[1]}`];
        return team ? { team_number: team } : null;
      },
    },
    {
      match: /FROM chat_messages cm/,
      all: () => ({ results: opts.messageRows ?? [] }),
    },
    {
      match: /SELECT id, name, avatar_url FROM users WHERE id = \?/,
      first: (binds) => ({ id: binds[0], name: 'Player One', avatar_url: null }),
    },
    catchAll(),
  ]);
}

describe('POST /api/team-battles/:id/chat', () => {
  it('lets a member post to the battle channel', async () => {
    const db = chatDb();
    const t = await token('u1');
    const res = await worker.fetch(
      post('http://x/api/team-battles/tb_1/chat', { message: '  push mid!  ' }, t),
      env(db),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      success: boolean;
      data: { message: { id: string; senderId: string; senderName: string; content: string; createdAt: string } };
    };
    expect(body.success).toBe(true);
    expect(body.data.message.content).toBe('push mid!');
    expect(body.data.message.senderId).toBe('u1');
    expect(body.data.message.senderName).toBe('Player One');

    // Message lands in chat.ts's table, scoped to this battle's channel.
    const insert = db.calls.find((c) => c.sql.includes('INSERT INTO chat_messages'));
    expect(insert).toBeDefined();
    expect(insert!.binds[1]).toBe('team_battle:tb_1');
    expect(insert!.binds[3]).toBe('push mid!');

    // The backing chat_rooms row is materialized lazily (room_id FK).
    expect(db.calls.some((c) => c.sql.includes('INSERT OR IGNORE INTO chat_rooms'))).toBe(true);
  });

  it('rejects non-members with 403 and writes nothing', async () => {
    const db = chatDb();
    const t = await token('outsider');
    const res = await worker.fetch(
      post('http://x/api/team-battles/tb_1/chat', { message: 'hello' }, t),
      env(db),
    );
    expect(res.status).toBe(403);
    expect(db.calls.some((c) => c.sql.includes('INSERT INTO chat_messages'))).toBe(false);
  });

  it('returns 404 for a battle that does not exist', async () => {
    const db = chatDb({ battleExists: false });
    const t = await token('u1');
    const res = await worker.fetch(
      post('http://x/api/team-battles/tb_ghost/chat', { message: 'hello' }, t),
      env(db),
    );
    expect(res.status).toBe(404);
  });

  it('rejects empty or whitespace-only messages', async () => {
    const db = chatDb();
    const t = await token('u1');
    for (const message of ['', '   ']) {
      const res = await worker.fetch(
        post('http://x/api/team-battles/tb_1/chat', { message }, t),
        env(db),
      );
      expect(res.status).toBe(400);
    }
    expect(db.calls.some((c) => c.sql.includes('INSERT INTO chat_messages'))).toBe(false);
  });

  it('enforces the length cap (1000 chars after trim)', async () => {
    const db = chatDb();
    const t = await token('u1');

    const tooLong = await worker.fetch(
      post('http://x/api/team-battles/tb_1/chat', { message: 'x'.repeat(1001) }, t),
      env(db),
    );
    expect(tooLong.status).toBe(400);

    const atCap = await worker.fetch(
      post('http://x/api/team-battles/tb_1/chat', { message: 'x'.repeat(1000) }, t),
      env(db),
    );
    expect(atCap.status).toBe(200);
  });
});

describe('GET /api/team-battles/:id/chat', () => {
  const rows = [
    // Query orders DESC; the endpoint must serve chronological order.
    { id: 'msg_2', sender_id: 'u2', content: 'second', created_at: '2026-09-06 12:00:02', sender_name: 'Two', sender_avatar: null },
    { id: 'msg_1', sender_id: 'u1', content: 'first', created_at: '2026-09-06 12:00:01', sender_name: 'One', sender_avatar: null },
  ];

  it('lets a member read the channel, camelCase and chronological', async () => {
    const db = chatDb({ messageRows: rows });
    const t = await token('u1');
    const res = await worker.fetch(get('http://x/api/team-battles/tb_1/chat', t), env(db));
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      success: boolean;
      data: { messages: { id: string; senderId: string; senderName: string; content: string; createdAt: string }[] };
    };
    expect(body.data.messages.map((m) => m.id)).toEqual(['msg_1', 'msg_2']);
    expect(body.data.messages[0]).toMatchObject({
      senderId: 'u1',
      senderName: 'One',
      content: 'first',
      createdAt: '2026-09-06T12:00:01Z',
    });
  });

  it('rejects non-members with 403', async () => {
    const db = chatDb();
    const t = await token('outsider');
    const res = await worker.fetch(get('http://x/api/team-battles/tb_1/chat', t), env(db));
    expect(res.status).toBe(403);
  });

  it('returns 404 for a battle that does not exist', async () => {
    const db = chatDb({ battleExists: false });
    const t = await token('u1');
    const res = await worker.fetch(get('http://x/api/team-battles/tb_ghost/chat', t), env(db));
    expect(res.status).toBe(404);
  });

  it('scopes the query to this battle channel (battle A invisible to battle B)', async () => {
    // The mock only returns rows when the query binds battle A's room id —
    // exactly what the SQL does with a real FK-scoped room_id.
    const db = createMockD1([
      authHandler(),
      { match: /SELECT id FROM team_battles WHERE id = \?/, first: (binds) => ({ id: binds[0] }) },
      {
        match: /SELECT team_number FROM team_battle_members WHERE battle_id = \? AND user_id = \?/,
        first: () => ({ team_number: 1 }),
      },
      {
        match: /FROM chat_messages cm/,
        all: (binds) => ({
          results: binds[0] === 'team_battle:tb_A' ? rows : [],
        }),
      },
      catchAll(),
    ]);
    const t = await token('u1');

    const a = await worker.fetch(get('http://x/api/team-battles/tb_A/chat', t), env(db));
    const aBody = (await a.json()) as { data: { messages: unknown[] } };
    expect(aBody.data.messages).toHaveLength(2);

    const b = await worker.fetch(get('http://x/api/team-battles/tb_B/chat', t), env(db));
    const bBody = (await b.json()) as { data: { messages: unknown[] } };
    expect(bBody.data.messages).toHaveLength(0);

    const query = db.calls.find((c) => c.sql.includes('FROM chat_messages cm'));
    expect(query!.sql).toContain('cm.room_id = ?');
  });

  it('applies since filtering with a normalized SQL-UTC bind', async () => {
    const db = chatDb();
    const t = await token('u1');
    const res = await worker.fetch(
      get('http://x/api/team-battles/tb_1/chat?since=2026-09-06T12%3A00%3A01.500Z', t),
      env(db),
    );
    expect(res.status).toBe(200);
    const query = db.calls.find((c) => c.sql.includes('FROM chat_messages cm'));
    expect(query!.sql).toContain('cm.created_at >= ?');
    // datetime('now') values are "YYYY-MM-DD HH:MM:SS" — the ISO param must be
    // normalized or the lexicographic compare would silently match nothing.
    expect(query!.binds[1]).toBe('2026-09-06 12:00:01');
  });

  it('rejects an unparseable since parameter', async () => {
    const db = chatDb();
    const t = await token('u1');
    const res = await worker.fetch(
      get('http://x/api/team-battles/tb_1/chat?since=not-a-date', t),
      env(db),
    );
    expect(res.status).toBe(400);
  });
});
