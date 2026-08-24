import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import Database from 'better-sqlite3';
import { afterEach, describe, expect, it } from 'vitest';

const migration = readFileSync(
  resolve(process.cwd(), 'database/migrations/101_atomic_question_allowance.sql'),
  'utf8',
);
const rollback = readFileSync(
  resolve(process.cwd(), 'database/rollbacks/101_atomic_question_allowance.sql'),
  'utf8',
);

describe('migration 101 atomic question allowance', () => {
  const databases: Database.Database[] = [];

  afterEach(() => {
    for (const database of databases.splice(0)) database.close();
  });

  it('is rerunnable, enforces the inclusive 0..10 ceiling, and has an executable rollback', () => {
    const database = new Database(':memory:');
    databases.push(database);
    database.exec(`
      CREATE TABLE daily_usage (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        usage_date TEXT NOT NULL,
        question_count INTEGER DEFAULT 0,
        UNIQUE(user_id, usage_date)
      );
    `);

    database.exec(migration);
    database.exec(migration);
    expect(database.prepare(`
      SELECT COUNT(*) AS count
      FROM sqlite_master
      WHERE type = 'trigger' AND name LIKE 'trg_daily_usage_question_limit_%'
    `).get()).toEqual({ count: 2 });

    database.prepare(`
      INSERT INTO daily_usage (id, user_id, usage_date, question_count)
      VALUES ('usage_1', 'user_1', '2026-08-24', 10)
    `).run();
    expect(() => database.prepare(`
      UPDATE daily_usage SET question_count = 11 WHERE id = 'usage_1'
    `).run()).toThrow(/DAILY_QUESTION_LIMIT_EXCEEDED/);
    expect(database.prepare('SELECT question_count FROM daily_usage').get()).toEqual({ question_count: 10 });

    database.exec(rollback);
    database.prepare(`UPDATE daily_usage SET question_count = 11 WHERE id = 'usage_1'`).run();
    expect(database.prepare('SELECT question_count FROM daily_usage').get()).toEqual({ question_count: 11 });
  });
});
