import { describe, expect, it, vi } from 'vitest';
import { sign } from 'hono/jwt';
import { studyRoomsApp } from '../study-rooms';
import tutorClassroom from '../tutor-classroom';
import { hashRoomPassword } from '../room-access';
import { createMockD1, type MockHandler } from './helpers/mockD1';

const JWT_SECRET = `${crypto.randomUUID()}-${crypto.randomUUID()}`;
const authHandler: MockHandler = {
  match: /SELECT role, status, is_active, session_version FROM users/,
  first: () => ({ role: 'student', status: 'approved', is_active: 1, session_version: 0 }),
};

async function bearer() {
  const value = await sign(
    { userId: 'student_1', role: 'student', sessionVersion: 0, exp: Math.floor(Date.now() / 1000) + 3600 },
    JWT_SECRET,
  );
  return { Authorization: `Bearer ${value}`, 'Content-Type': 'application/json' };
}

describe('classroom row-level authorization', () => {
  it('does not let a non-participant invoke scheduled-session AI assistance', async () => {
    const membership: MockHandler = {
      match: /FROM scheduled_classroom_sessions\s+WHERE id = \? AND \(tutor_id = \? OR student_id = \?\)/,
      first: () => null,
    };
    const db = createMockD1([authHandler, membership]);
    const ai = { run: vi.fn() };
    const res = await tutorClassroom.fetch(new Request('http://x/scheduled-sessions/session_1/ai-assist', {
      method: 'POST', headers: await bearer(), body: JSON.stringify({ request_type: 'provide_hint' }),
    }), { DB: db as unknown as D1Database, JWT_SECRET, AI: ai as unknown as Ai } as never);

    expect(res.status).toBe(404);
    expect(ai.run).not.toHaveBeenCalled();
    expect(db.calls[1].binds).toEqual(['session_1', 'student_1', 'student_1']);
  });

  it('does not let an authenticated non-member post into a study room', async () => {
    const membership: MockHandler = {
      match: /JOIN study_session_participants ssp[\s\S]*ssp\.user_id = \?[\s\S]*ss\.room_code = \?/,
      first: () => null,
    };
    const db = createMockD1([authHandler, membership]);
    const res = await studyRoomsApp.fetch(new Request('http://x/ROOM01/messages', {
      method: 'POST', headers: await bearer(), body: JSON.stringify({ content: 'intrusion' }),
    }), { DB: db as unknown as D1Database, JWT_SECRET } as never);

    expect(res.status).toBe(404);
    expect(db.calls.some((call) => call.sql.includes('INSERT INTO study_session_messages'))).toBe(false);
  });

  it('enforces the stored private-room password before creating membership', async () => {
    const passwordHash = await hashRoomPassword('valid-room-password');
    const room: MockHandler = {
      match: /FROM study_sessions ss[\s\S]*WHERE ss\.room_code = \?/,
      first: () => ({ id: 'room_1', status: 'waiting', password_hash: passwordHash, participant_count: 1, max_participants: 5 }),
    };
    const db = createMockD1([authHandler, room]);
    const res = await studyRoomsApp.fetch(new Request('http://x/ROOM01/join', {
      method: 'POST', headers: await bearer(), body: JSON.stringify({ password: 'wrong-password' }),
    }), { DB: db as unknown as D1Database, JWT_SECRET } as never);

    expect(res.status).toBe(403);
    expect(db.calls.some((call) => call.sql.includes('INSERT INTO study_session_participants'))).toBe(false);
  });
});
