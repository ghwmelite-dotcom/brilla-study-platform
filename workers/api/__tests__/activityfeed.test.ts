import { describe, expect, it, vi } from 'vitest';
import { sign } from 'hono/jwt';
import { activityFeedApp } from '../activityfeed';

const JWT_SECRET = 'test-secret-that-is-long-enough';

describe('activity feed canonical user name join', () => {
  it('returns an empty friend feed for a fresh user without querying a nonexistent users.display_name column', async () => {
    const preparedSql: string[] = [];
    const db = {
      prepare: vi.fn((sql: string) => {
        preparedSql.push(sql);
        if (sql.includes('FROM users')) {
          const statement = {
            bind: vi.fn(),
            first: vi.fn().mockResolvedValue({ role: 'student', status: 'approved', is_active: 1 }),
          };
          statement.bind.mockReturnValue(statement);
          return statement;
        }
        if (sql.includes('FROM activity_feed')) {
          const statement = {
            bind: vi.fn(),
            all: vi.fn().mockResolvedValue({ results: [] }),
          };
          statement.bind.mockReturnValue(statement);
          return statement;
        }
        throw new Error(`Unexpected SQL: ${sql}`);
      }),
    } as unknown as D1Database;
    const token = await sign(
      { userId: 'student_fresh', role: 'student', exp: Math.floor(Date.now() / 1000) + 3600 },
      JWT_SECRET,
    );

    const response = await activityFeedApp.fetch(
      new Request('http://worker.test/friends', {
        headers: { Authorization: `Bearer ${token}` },
      }),
      { DB: db, JWT_SECRET },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: { activities: [] },
    });
    const activitySql = preparedSql.find((sql) => sql.includes('FROM activity_feed'));
    expect(activitySql).toContain('u.name as user_name');
    expect(activitySql).not.toContain('u.display_name');
  });
});
