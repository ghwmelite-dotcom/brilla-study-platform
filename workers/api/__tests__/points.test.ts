import { describe, it, expect } from 'vitest';
import { awardPoints, getActiveCycleForUser } from '../points';
import { createMockD1, type MockHandler } from './helpers/mockD1';

// Task 2 (growth loop): shared awardPoints helper.
// (a) XP update always uses raw points;
// (b) ledger row uses weighted points (question_correct 0.2 -> 10 XP = 2 race pts);
// (c) daily cap clamps (after 100 weighted pts today: XP still written, no ledger
//     row, capped: true);
// (d) user with house gets a house_points row with mapped source; no house -> none;
// (e) school cycle preferred over platform cycle for the cycle_id stamp;
// (f) crossing recorded via INSERT OR IGNORE when cycle score >= target.

const PLATFORM_CYCLE = {
  id: 'cyc_platform',
  target_points: 500,
  starts_at: '2026-08-01 00:00:00',
  ends_at: '2026-09-01 00:00:00',
};
const SCHOOL_CYCLE = { ...PLATFORM_CYCLE, id: 'cyc_school' };

const xpUpdate: MockHandler = { match: /UPDATE users SET xp_points = xp_points \+/ };
const ledgerInsert: MockHandler = { match: /INSERT INTO points_ledger/ };
const houseSelectNull: MockHandler = { match: /SELECT house FROM users/, first: () => ({ house: null }) };
const noCapToday: MockHandler = { match: /AS today FROM points_ledger/, first: () => ({ today: 0 }) };

function dbOf(handlers: MockHandler[]) {
  return createMockD1(handlers) as unknown as D1Database & { calls: { sql: string; binds: unknown[] }[] };
}

describe('awardPoints', () => {
  it('(a) always increments users.xp_points by the raw points', async () => {
    const db = dbOf([
      noCapToday,
      xpUpdate,
      { match: /FROM race_cycles rc/, first: () => null },
      ledgerInsert,
      houseSelectNull,
    ]);

    await awardPoints(db, { userId: 'u1', points: 10, source: 'question_correct' });

    const xp = db.calls.find((c) => /UPDATE users SET xp_points/.test(c.sql));
    expect(xp).toBeDefined();
    expect(xp!.binds).toEqual([10, 'u1']);
  });

  it('(b) writes the ledger row with weighted points (10 XP * 0.2 = 2)', async () => {
    const db = dbOf([
      noCapToday,
      xpUpdate,
      { match: /FROM race_cycles rc/, first: () => null },
      ledgerInsert,
      houseSelectNull,
    ]);

    const res = await awardPoints(db, { userId: 'u1', points: 10, source: 'question_correct' });

    expect(res).toEqual({ awarded: 2, capped: false });
    const ledger = db.calls.find((c) => /INSERT INTO points_ledger/.test(c.sql));
    expect(ledger).toBeDefined();
    // binds: id, user_id, points, source, source_ref, cycle_id, is_demo_data, expires_at
    expect(ledger!.binds[1]).toBe('u1');
    expect(ledger!.binds[2]).toBe(2);
    expect(ledger!.binds[3]).toBe('question_correct');
    expect(ledger!.binds[5]).toBeNull(); // no active cycle -> null cycle_id
  });

  it('(c) clamps at the daily cap: XP still written, no ledger row, capped: true', async () => {
    const db = dbOf([
      { match: /AS today FROM points_ledger/, first: () => ({ today: 100 }) },
      xpUpdate,
    ]);

    const res = await awardPoints(db, { userId: 'u1', points: 10, source: 'question_correct' });

    expect(res).toEqual({ awarded: 0, capped: true });
    expect(db.calls.some((c) => /UPDATE users SET xp_points/.test(c.sql))).toBe(true);
    expect(db.calls.some((c) => /INSERT INTO points_ledger/.test(c.sql))).toBe(false);
    expect(db.calls.some((c) => /INSERT INTO house_points/.test(c.sql))).toBe(false);
  });

  it('(c2) partially clamps at the daily cap: ledger row gets only the remaining headroom', async () => {
    // 95 of 100 weighted pts used today; awarding 50 XP * 0.2 = 10 weighted
    // leaves room for exactly 5. Display XP still gets the raw 50.
    const db = dbOf([
      { match: /AS today FROM points_ledger/, first: () => ({ today: 95 }) },
      xpUpdate,
      { match: /FROM race_cycles rc/, first: () => null },
      ledgerInsert,
      houseSelectNull,
    ]);

    const res = await awardPoints(db, { userId: 'u1', points: 50, source: 'question_correct' });

    expect(res).toEqual({ awarded: 5, capped: true });
    const xp = db.calls.find((c) => /UPDATE users SET xp_points/.test(c.sql));
    expect(xp!.binds).toEqual([50, 'u1']); // raw display XP is never clamped
    const ledger = db.calls.find((c) => /INSERT INTO points_ledger/.test(c.sql));
    expect(ledger).toBeDefined();
    expect(ledger!.binds[2]).toBe(5);
  });

  it('(d) writes house_points with mapped source for housed users only', async () => {
    const housed = dbOf([
      noCapToday,
      xpUpdate,
      { match: /FROM race_cycles rc/, first: () => null },
      ledgerInsert,
      { match: /SELECT house FROM users/, first: () => ({ house: 'house_lion' }) },
      { match: /INSERT INTO house_points/ },
    ]);
    await awardPoints(housed, { userId: 'u1', points: 10, source: 'question_correct' });

    const hp = housed.calls.find((c) => /INSERT INTO house_points/.test(c.sql));
    expect(hp).toBeDefined();
    // binds: id, house_id, user_id, points, source, source_id, period, is_demo_data, expires_at
    expect(hp!.binds[1]).toBe('house_lion');
    expect(hp!.binds[3]).toBe(2); // weighted points, consistent with the ledger
    expect(hp!.binds[4]).toBe('practice'); // question_correct -> practice
    expect(hp!.binds[6]).toMatch(/^\d{4}-W\d{2}$/); // YYYY-WW period

    const unhoused = dbOf([
      noCapToday,
      xpUpdate,
      { match: /FROM race_cycles rc/, first: () => null },
      ledgerInsert,
      houseSelectNull,
    ]);
    await awardPoints(unhoused, { userId: 'u2', points: 10, source: 'question_correct' });
    expect(unhoused.calls.some((c) => /INSERT INTO house_points/.test(c.sql))).toBe(false);
  });

  it('(e) stamps the ledger with the school cycle when one is active', async () => {
    // The query orders school scope first; the mock returns what the DB would
    // pick, so we also pin the ordering SQL itself.
    const db = dbOf([
      noCapToday,
      xpUpdate,
      { match: /FROM race_cycles rc/, first: () => SCHOOL_CYCLE },
      ledgerInsert,
      { match: /AS score FROM points_ledger/, first: () => ({ score: 0 }) },
      houseSelectNull,
    ]);

    await awardPoints(db, { userId: 'u1', points: 10, source: 'question_correct' });

    const cycleQuery = db.calls.find((c) => /FROM race_cycles rc/.test(c.sql));
    expect(cycleQuery!.sql).toMatch(/ORDER BY CASE WHEN rc\.scope = 'school' THEN 0 ELSE 1 END/);
    const ledger = db.calls.find((c) => /INSERT INTO points_ledger/.test(c.sql));
    expect(ledger!.binds[5]).toBe('cyc_school');
  });

  it('(f) records the crossing once the cycle score reaches the target', async () => {
    const db = dbOf([
      noCapToday,
      xpUpdate,
      { match: /FROM race_cycles rc/, first: () => PLATFORM_CYCLE },
      ledgerInsert,
      { match: /AS score FROM points_ledger/, first: () => ({ score: 500 }) },
      { match: /INSERT OR IGNORE INTO race_crossings/ },
      { match: /UPDATE race_cycles SET target_hit_at/ },
      houseSelectNull,
    ]);

    await awardPoints(db, { userId: 'u1', points: 10, source: 'question_correct' });

    const crossing = db.calls.find((c) => /INSERT OR IGNORE INTO race_crossings/.test(c.sql));
    expect(crossing).toBeDefined();
    expect(crossing!.binds).toEqual(['cyc_platform', 'u1']);
    const hit = db.calls.find((c) => /UPDATE race_cycles SET target_hit_at/.test(c.sql));
    expect(hit).toBeDefined();
    expect(hit!.binds).toEqual(['cyc_platform']);
  });

  it('(f2) does not record a crossing below the target', async () => {
    const db = dbOf([
      noCapToday,
      xpUpdate,
      { match: /FROM race_cycles rc/, first: () => PLATFORM_CYCLE },
      ledgerInsert,
      { match: /AS score FROM points_ledger/, first: () => ({ score: 499 }) },
      houseSelectNull,
    ]);

    await awardPoints(db, { userId: 'u1', points: 10, source: 'question_correct' });

    expect(db.calls.some((c) => /race_crossings/.test(c.sql))).toBe(false);
    expect(db.calls.some((c) => /UPDATE race_cycles SET target_hit_at/.test(c.sql))).toBe(false);
  });
});

describe('getActiveCycleForUser', () => {
  it('returns null when no active cycle exists', async () => {
    const db = dbOf([{ match: /FROM race_cycles rc/, first: () => null }]);
    await expect(getActiveCycleForUser(db, 'u1')).resolves.toBeNull();
  });
});
