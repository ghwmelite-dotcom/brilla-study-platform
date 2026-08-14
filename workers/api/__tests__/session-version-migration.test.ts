import { readFileSync } from 'node:fs';
import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';

describe('migration 097 session invalidation', () => {
  it('preserves users and initializes the version to zero', () => {
    const db = new Database(':memory:');
    try {
      db.exec(`
        CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT NOT NULL);
        INSERT INTO users (id, email) VALUES ('user_1', 'one@example.com');
      `);
      db.exec(readFileSync(
        new URL('../../../database/migrations/097_session_version_invalidation.sql', import.meta.url),
        'utf8',
      ));

      expect(db.prepare('SELECT id, session_version FROM users').get())
        .toEqual({ id: 'user_1', session_version: 0 });
      expect(() => db.prepare('UPDATE users SET session_version = NULL WHERE id = ?').run('user_1'))
        .toThrow();
    } finally {
      db.close();
    }
  });
});
