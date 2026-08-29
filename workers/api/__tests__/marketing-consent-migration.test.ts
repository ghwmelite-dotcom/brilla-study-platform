import { readFileSync } from 'node:fs';
import Database from 'better-sqlite3';
import { afterEach, describe, expect, it } from 'vitest';

const migrationSql = readFileSync(
  'database/migrations/358_referral_marketing_consent.sql',
  'utf8',
);

let database: Database.Database | null = null;

function createDatabase() {
  database = new Database(':memory:');
  database.pragma('foreign_keys = ON');
  database.exec(`
    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'approved',
      is_active INTEGER NOT NULL DEFAULT 1,
      is_demo INTEGER NOT NULL DEFAULT 0,
      email_verified INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE affiliate_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE REFERENCES users(id),
      referral_code TEXT NOT NULL UNIQUE
    );
  `);
  return database;
}

afterEach(() => {
  database?.close();
  database = null;
});

describe('migration 358 referral marketing consent', () => {
  it('creates the campaign foundation without opting existing users in', () => {
    const db = createDatabase();
    db.prepare(`
      INSERT INTO users (id, email, name, role, email_verified)
      VALUES ('student-1', 'student@example.com', 'Student One', 'student', 1)
    `).run();

    db.exec(migrationSql);

    const preferenceCount = db.prepare(
      'SELECT COUNT(*) AS count FROM marketing_email_preferences',
    ).get() as { count: number };
    expect(preferenceCount.count).toBe(0);

    const tables = db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type = 'table' AND name LIKE 'marketing_%'
      ORDER BY name
    `).all() as Array<{ name: string }>;
    expect(tables.map((table) => table.name)).toEqual([
      'marketing_campaign_recipients',
      'marketing_campaigns',
      'marketing_consent_events',
      'marketing_email_preferences',
      'marketing_email_suppressions',
      'marketing_webhook_events',
    ]);
  });

  it('rejects an opt-in that lacks auditable consent and eligibility', () => {
    const db = createDatabase();
    db.prepare(`
      INSERT INTO users (id, email, name, role, email_verified)
      VALUES ('student-1', 'student@example.com', 'Student One', 'student', 1)
    `).run();
    db.exec(migrationSql);

    expect(() => db.prepare(`
      INSERT INTO marketing_email_preferences (user_id, referral_rewards_opt_in)
      VALUES ('student-1', 1)
    `).run()).toThrow();

    expect(() => db.prepare(`
      INSERT INTO marketing_email_preferences (
        user_id, referral_rewards_opt_in, consent_version, consented_at,
        consent_source, eligibility_basis, consent_actor_user_id
      ) VALUES (
        'student-1', 1, 'referral-rewards-2026-08-29', datetime('now'),
        'settings', 'adult_self_attested', 'student-1'
      )
    `).run()).not.toThrow();
  });

  it('enforces one suppression record per normalized email hash', () => {
    const db = createDatabase();
    db.exec(migrationSql);
    const insert = db.prepare(`
      INSERT INTO marketing_email_suppressions (id, email_hash, reason, source)
      VALUES (?, 'same-hash', 'user_opt_out', 'settings')
    `);
    insert.run('suppression-1');
    expect(() => insert.run('suppression-2')).toThrow();
  });
});
