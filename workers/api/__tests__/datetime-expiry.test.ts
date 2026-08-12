import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

function setup() {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE user_trials (id TEXT, user_id TEXT, expires_at TEXT, status TEXT);
    CREATE TABLE oauth_states (id TEXT, state TEXT, expires_at TEXT);
    CREATE TABLE engagement_nudges (id TEXT, user_id TEXT, expires_at TEXT, dismissed INTEGER DEFAULT 0);
  `);
  return db;
}

// Anchored to 00:00 UTC today: "one hour ago" crosses the UTC day boundary
// during the first hour of the day, which inverts the same-day string-
// comparison semantics this suite documents.
const ISO_ONE_HOUR_AGO = new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z';
const ISO_ONE_HOUR_AHEAD = new Date(Date.now() + 60 * 60 * 1000).toISOString();

describe('ISO datetime expiry semantics', () => {
  it('expires a trial that expired earlier TODAY (same-day expiry works)', () => {
    const db = setup();
    db.prepare(`INSERT INTO user_trials VALUES ('t1', 'u1', ?, 'active')`).run(ISO_ONE_HOUR_AGO);

    // Fixed query (bound JS ISO parameter):
    const rows = db.prepare(
      `SELECT id FROM user_trials WHERE status = 'active' AND expires_at < ?`,
    ).all(new Date().toISOString());
    expect(rows).toHaveLength(1);

    // Documents the old bug: datetime('now') vs ISO never matches same-day expiries:
    const brokenRows = db.prepare(
      `SELECT id FROM user_trials WHERE status = 'active' AND expires_at < datetime('now')`,
    ).all();
    expect(brokenRows).toHaveLength(0);
  });

  it('does not expire a trial that expires later today', () => {
    const db = setup();
    db.prepare(`INSERT INTO user_trials VALUES ('t2', 'u2', ?, 'active')`).run(ISO_ONE_HOUR_AHEAD);
    const rows = db.prepare(
      `SELECT id FROM user_trials WHERE status = 'active' AND expires_at < ?`,
    ).all(new Date().toISOString());
    expect(rows).toHaveLength(0);
  });

  it('rejects an OAuth state older than 10 minutes even on the same UTC day', () => {
    const db = setup();
    const elevenMinutesAgo = new Date(Date.now() - 11 * 60 * 1000).toISOString();
    db.prepare(`INSERT INTO oauth_states VALUES ('s1', 'state_abc', ?)`).run(elevenMinutesAgo);

    // Fixed query (bound JS ISO parameter):
    const rows = db.prepare(
      `SELECT id FROM oauth_states WHERE state = ? AND expires_at > ?`,
    ).all('state_abc', new Date().toISOString());
    expect(rows).toHaveLength(0);
  });

  it('hides expired nudges but keeps unexpired and NULL-expiry ones', () => {
    const db = setup();
    db.prepare(`INSERT INTO engagement_nudges (id, user_id, expires_at) VALUES ('n1', 'u1', ?)`).run(ISO_ONE_HOUR_AGO);
    db.prepare(`INSERT INTO engagement_nudges (id, user_id, expires_at) VALUES ('n2', 'u1', ?)`).run(ISO_ONE_HOUR_AHEAD);
    db.prepare(`INSERT INTO engagement_nudges (id, user_id, expires_at) VALUES ('n3', 'u1', NULL)`).run();

    const rows = db.prepare(
      `SELECT id FROM engagement_nudges
       WHERE user_id = ? AND dismissed = 0 AND (expires_at IS NULL OR expires_at > ?)`,
    ).all('u1', new Date().toISOString());
    expect(rows.map((r) => (r as { id: string }).id).sort()).toEqual(['n2', 'n3']);
  });
});

// Standalone verification of the data-fix migration. The full wrangler
// migration chain is known-broken (Phase 5 owns it), so the migration is
// applied here against an in-memory SQLite with mixed-format rows.
describe('088_normalize_datetime_to_iso.sql', () => {
  const migrationPath = fileURLToPath(
    new URL('../../../database/migrations/088_normalize_datetime_to_iso.sql', import.meta.url),
  );
  const sql = readFileSync(migrationPath, 'utf8');

  function setupLegacy() {
    const db = new Database(':memory:');
    db.exec(`
      CREATE TABLE user_trials (id TEXT, user_id TEXT, started_at TEXT, expires_at TEXT, status TEXT);
      CREATE TABLE users (id TEXT, trial_started_at TEXT, trial_expires_at TEXT, subscription_expires_at TEXT);
      CREATE TABLE oauth_states (id TEXT, state TEXT, expires_at TEXT);
      CREATE TABLE engagement_nudges (id TEXT, user_id TEXT, expires_at TEXT);
      CREATE TABLE comeback_challenges (id TEXT, user_id TEXT, expires_at TEXT);
    `);
    return db;
  }

  it('normalizes legacy space-separated timestamps to ISO and leaves ISO rows untouched', () => {
    const db = setupLegacy();
    db.prepare(`INSERT INTO user_trials VALUES ('t1', 'u1', '2026-08-01 10:00:00', '2026-08-15 10:00:00', 'active')`).run();
    db.prepare(`INSERT INTO user_trials VALUES ('t2', 'u2', '2026-08-01T10:00:00.000Z', '2026-08-15T10:00:00.000Z', 'active')`).run();
    db.prepare(`INSERT INTO users VALUES ('u1', '2026-08-01 10:00:00', '2026-08-15 10:00:00', NULL)`).run();
    db.prepare(`INSERT INTO users VALUES ('u2', NULL, NULL, '2026-09-01 00:00:00')`).run();
    db.prepare(`INSERT INTO oauth_states VALUES ('s1', 'state_abc', '2026-08-09 00:10:00')`).run();
    db.prepare(`INSERT INTO engagement_nudges VALUES ('n1', 'u1', '2026-08-10 08:30:00')`).run();
    db.prepare(`INSERT INTO engagement_nudges VALUES ('n2', 'u1', NULL)`).run();
    db.prepare(`INSERT INTO comeback_challenges VALUES ('c1', 'u1', '2026-08-20 23:59:59')`).run();

    db.exec(sql);

    const t1 = db.prepare(`SELECT started_at, expires_at FROM user_trials WHERE id = 't1'`).get() as { started_at: string; expires_at: string };
    expect(t1.started_at).toBe('2026-08-01T10:00:00.000Z');
    expect(t1.expires_at).toBe('2026-08-15T10:00:00.000Z');

    // Already-ISO rows are untouched (guard: NOT LIKE '%T%')
    const t2 = db.prepare(`SELECT started_at, expires_at FROM user_trials WHERE id = 't2'`).get() as { started_at: string; expires_at: string };
    expect(t2.started_at).toBe('2026-08-01T10:00:00.000Z');
    expect(t2.expires_at).toBe('2026-08-15T10:00:00.000Z');

    const u1 = db.prepare(`SELECT trial_started_at, trial_expires_at FROM users WHERE id = 'u1'`).get() as { trial_started_at: string; trial_expires_at: string };
    expect(u1.trial_started_at).toBe('2026-08-01T10:00:00.000Z');
    expect(u1.trial_expires_at).toBe('2026-08-15T10:00:00.000Z');

    const u2 = db.prepare(`SELECT subscription_expires_at FROM users WHERE id = 'u2'`).get() as { subscription_expires_at: string };
    expect(u2.subscription_expires_at).toBe('2026-09-01T00:00:00.000Z');

    const s1 = db.prepare(`SELECT expires_at FROM oauth_states WHERE id = 's1'`).get() as { expires_at: string };
    expect(s1.expires_at).toBe('2026-08-09T00:10:00.000Z');

    const n1 = db.prepare(`SELECT expires_at FROM engagement_nudges WHERE id = 'n1'`).get() as { expires_at: string };
    expect(n1.expires_at).toBe('2026-08-10T08:30:00.000Z');
    const n2 = db.prepare(`SELECT expires_at FROM engagement_nudges WHERE id = 'n2'`).get() as { expires_at: string | null };
    expect(n2.expires_at).toBeNull();

    const c1 = db.prepare(`SELECT expires_at FROM comeback_challenges WHERE id = 'c1'`).get() as { expires_at: string };
    expect(c1.expires_at).toBe('2026-08-20T23:59:59.000Z');
  });

  it('is idempotent (second application is a no-op)', () => {
    const db = setupLegacy();
    db.prepare(`INSERT INTO user_trials VALUES ('t1', 'u1', '2026-08-01 10:00:00', '2026-08-15 10:00:00', 'active')`).run();

    db.exec(sql);
    const once = db.prepare(`SELECT started_at, expires_at FROM user_trials WHERE id = 't1'`).get();
    db.exec(sql);
    const twice = db.prepare(`SELECT started_at, expires_at FROM user_trials WHERE id = 't1'`).get();
    expect(twice).toEqual(once);
  });
});
