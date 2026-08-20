import { describe, expect, it } from 'vitest';
import { sign } from 'hono/jwt';
import { counselorApp } from '../counselor';
import { createMockD1 } from './helpers/mockD1';

const JWT_SECRET = 'test-secret-that-is-long-enough';

async function tokenFor(userId: string, role: string): Promise<string> {
  return sign(
    {
      userId,
      role,
      sessionVersion: 0,
      exp: Math.floor(Date.now() / 1000) + 3600,
    },
    JWT_SECRET,
  );
}

function databaseFor(role: string) {
  return createMockD1([
    {
      match: /SELECT role, status, is_active, session_version FROM users/,
      first: () => ({ role, status: 'approved', is_active: 1, session_version: 0 }),
    },
    {
      match: /FROM counselor_conversations/,
      all: () => ({ results: [] }),
    },
  ]);
}

describe('Counselor student-only route boundary', () => {
  it('denies teacher reads and writes before conversation data is accessed', async () => {
    const db = databaseFor('teacher');
    const token = await tokenFor('teacher_1', 'teacher');
    const env = { DB: db as unknown as D1Database, JWT_SECRET };

    const readResponse = await counselorApp.fetch(
      new Request('http://worker.test/conversations', {
        headers: { Authorization: `Bearer ${token}` },
      }),
      env,
    );
    const writeResponse = await counselorApp.fetch(
      new Request('http://worker.test/conversations', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ counselorType: 'academic' }),
      }),
      env,
    );

    expect(readResponse.status).toBe(403);
    expect(writeResponse.status).toBe(403);
    expect(db.calls).toHaveLength(2);
    expect(db.calls.every((call) => call.sql.includes('FROM users'))).toBe(true);
  });

  it('allows a student to read only their own conversation list', async () => {
    const db = databaseFor('student');
    const token = await tokenFor('student_1', 'student');
    const response = await counselorApp.fetch(
      new Request('http://worker.test/conversations', {
        headers: { Authorization: `Bearer ${token}` },
      }),
      { DB: db as unknown as D1Database, JWT_SECRET },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: [],
    });
    expect(db.calls.at(-1)?.binds).toEqual(['student_1']);
  });
});
