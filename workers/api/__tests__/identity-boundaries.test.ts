import { describe, expect, it, vi } from 'vitest';
import { sign } from 'hono/jwt';
import { libraryApp } from '../library';
import { oauthApp } from '../oauth';

const JWT_SECRET = `${crypto.randomUUID()}-${crypto.randomUUID()}`;

async function bearer(userId: string, role: string): Promise<string> {
  const token = await sign({
    userId,
    role,
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
  }, JWT_SECRET);
  return `Bearer ${token}`;
}

function suspendedDb() {
  const sql: string[] = [];
  const DB = {
    prepare: vi.fn((query: string) => {
      sql.push(query);
      return {
        bind: vi.fn(() => ({
          first: vi.fn().mockResolvedValue({ role: 'teacher', status: 'suspended', is_active: 1 }),
          all: vi.fn().mockResolvedValue({ results: [] }),
          run: vi.fn().mockResolvedValue({ meta: { changes: 1 } }),
        })),
      };
    }),
  } as unknown as D1Database;
  return { DB, sql };
}

describe('fresh account identity boundaries', () => {
  for (const [method, path] of [
    ['GET', '/providers'],
    ['DELETE', '/unlink/google'],
    ['POST', '/google/link/init'],
  ] as const) {
    it(`${method} ${path} rejects a suspended bearer before provider access`, async () => {
      const { DB, sql } = suspendedDb();
      const response = await oauthApp.fetch(new Request(`http://x${path}`, {
        method,
        headers: { Authorization: await bearer('user_suspended', 'teacher') },
      }), {
        DB,
        JWT_SECRET,
        ENVIRONMENT: 'test',
        GOOGLE_CLIENT_ID: 'client-id',
        GOOGLE_CLIENT_SECRET: 'client-secret',
      });

      expect(response.status).toBe(403);
      expect(sql).toHaveLength(1);
      expect(sql[0]).toContain('FROM users WHERE id = ?');
      expect(sql[0]).not.toContain('user_oauth_providers');
    });
  }

  it('fails a library upload closed when the exact JWT subject disappears', async () => {
    const prepared: string[] = [];
    const runs: string[] = [];
    const DB = {
      prepare: vi.fn((sql: string) => {
        prepared.push(sql);
        return {
          bind: vi.fn(() => ({
            first: vi.fn().mockImplementation(() => {
              if (sql.includes('SELECT role, status, is_active')) {
                return Promise.resolve({ role: 'teacher', status: 'approved', is_active: 1 });
              }
              if (sql.includes('SELECT id FROM users WHERE id = ?')) return Promise.resolve(null);
              return Promise.resolve(null);
            }),
            run: vi.fn().mockImplementation(() => {
              runs.push(sql);
              return Promise.resolve({ meta: { changes: 1 } });
            }),
          })),
        };
      }),
    } as unknown as D1Database;

    const form = new FormData();
    form.set('title', 'Safe resource');
    form.set('resourceType', 'link');
    form.set('contentUrl', 'https://example.com/resource');

    const response = await libraryApp.fetch(new Request('http://x/upload', {
      method: 'POST',
      headers: { Authorization: await bearer('teacher_deleted', 'teacher') },
      body: form,
    }), { DB, JWT_SECRET });

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ error: 'Authenticated user not found' });
    expect(prepared.some((sql) => sql.includes('WHERE role = ? LIMIT 1'))).toBe(false);
    expect(runs.some((sql) => sql.includes('INSERT INTO library_resources'))).toBe(false);
  });
});
