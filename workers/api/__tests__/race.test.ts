import { describe, it, expect } from 'vitest';
import { crownCycle, runRaceCycleMaintenance } from '../race';
import { createMockD1, type MockHandler } from './helpers/mockD1';

// Task 4 (growth loop): race engine — weekly cycle maintenance + crowning.
// (a) maintenance opens a platform cycle when none active (target from
//     RACE_TARGET_POINTS or default 1000; week = Monday 00:00 UTC -> next Monday);
// (b) maintenance is idempotent — second run opens nothing;
// (c) crown: cycle with a crossing -> earliest crossed_at wins, status='crowned',
//     winner_user_id/crowned_at set;
// (d) crown with no crossing -> highest window score wins;
// (e) empty cycle -> status='closed', no winner;
// (f) school cycles only open for schools.status='active' rows and only score
//     users with matching users.school_id and status='approved'.

// A Wednesday — the surrounding week is Mon 2026-08-10 -> Mon 2026-08-17 UTC.
const NOW = new Date('2026-08-12T15:00:00Z');
const WEEK_START = '2026-08-10 00:00:00';
const WEEK_END = '2026-08-17 00:00:00';

const ENDED_CYCLE = {
  id: 'cyc_ended',
  scope: 'platform',
  school_id: null,
  starts_at: '2026-08-03 00:00:00',
  ends_at: '2026-08-10 00:00:00',
};

// SQL-routing regexes (mutually exclusive against race.ts statements).
const endedCycles: MockHandler = {
  match: /SELECT id, scope, school_id, starts_at, ends_at FROM race_cycles/,
  all: () => ({ results: [] }),
};
const noActiveSchools: MockHandler = {
  match: /FROM schools/,
  all: () => ({ results: [] }),
};
const noCrossing: MockHandler = { match: /FROM race_crossings/, first: () => null };

function dbOf(handlers: MockHandler[]) {
  return createMockD1(handlers) as unknown as D1Database & { calls: { sql: string; binds: unknown[] }[] };
}

describe('runRaceCycleMaintenance', () => {
  it('(a) opens a platform cycle for the current week when none is active', async () => {
    const db = dbOf([endedCycles, noActiveSchools, { match: /INSERT INTO race_cycles/ }]);

    // targetPoints omitted -> default 1000 (cron passes Number(env.RACE_TARGET_POINTS) || 1000)
    const res = await runRaceCycleMaintenance(db, undefined, NOW);

    expect(res).toEqual({ opened: 1, crowned: 0 });
    const insert = db.calls.find((c) => /INSERT INTO race_cycles/.test(c.sql));
    expect(insert).toBeDefined();
    // Idempotency guard lives in the SQL itself.
    expect(insert!.sql).toMatch(/WHERE NOT EXISTS/);
    expect(insert!.sql).toMatch(/school_id IS \?/);
    // binds: id, scope, school_id, target_points, starts_at, ends_at, scope, school_id
    expect(insert!.binds[1]).toBe('platform');
    expect(insert!.binds[2]).toBeNull();
    expect(insert!.binds[3]).toBe(1000);
    expect(insert!.binds[4]).toBe(WEEK_START); // Monday 00:00 UTC
    expect(insert!.binds[5]).toBe(WEEK_END);   // next Monday 00:00 UTC
  });

  it('(a2) uses the targetPoints parameter when provided', async () => {
    const db = dbOf([endedCycles, noActiveSchools, { match: /INSERT INTO race_cycles/ }]);

    await runRaceCycleMaintenance(db, 2500, NOW);

    const insert = db.calls.find((c) => /INSERT INTO race_cycles/.test(c.sql));
    expect(insert!.binds[3]).toBe(2500);
  });

  it('(b) is idempotent — a second run opens nothing', async () => {
    // Simulates D1: the NOT EXISTS guard makes the second insert a no-op.
    let opened = false;
    const guardedInsert: MockHandler = {
      match: /INSERT INTO race_cycles/,
      run: () => {
        const changes = opened ? 0 : 1;
        opened = true;
        return { success: true, meta: { changes } };
      },
    };
    const db = dbOf([endedCycles, noActiveSchools, guardedInsert]);

    const first = await runRaceCycleMaintenance(db, 1000, NOW);
    const second = await runRaceCycleMaintenance(db, 1000, NOW);

    expect(first.opened).toBe(1);
    expect(second.opened).toBe(0);
  });

  it('(c) crowns the earliest crossing when the target was hit', async () => {
    const db = dbOf([
      { match: endedCycles.match, all: () => ({ results: [ENDED_CYCLE] }) },
      { match: /FROM race_crossings/, first: () => ({ user_id: 'u_early' }) },
      { match: /UPDATE race_cycles[\s\S]*SET status/ },
      noActiveSchools,
      { match: /INSERT INTO race_cycles/ },
    ]);

    const res = await runRaceCycleMaintenance(db, 1000, NOW);

    expect(res.crowned).toBe(1);
    const crossingQuery = db.calls.find((c) => /FROM race_crossings/.test(c.sql));
    expect(crossingQuery!.sql).toMatch(/ORDER BY crossed_at ASC/);
    const update = db.calls.find((c) => /UPDATE race_cycles[\s\S]*SET status/.test(c.sql));
    expect(update!.binds).toEqual(['crowned', 'u_early', 'cyc_ended']);
    expect(update!.sql).toMatch(/crowned_at = datetime\('now'\)/);
    // No fallback score query should run once a crossing exists.
    expect(db.calls.some((c) => /SUM\(pl\.points\) AS score/.test(c.sql))).toBe(false);
  });

  it('(d) falls back to the highest window score when nobody crossed', async () => {
    const db = dbOf([
      noCrossing,
      { match: /SUM\(pl\.points\) AS score/, first: () => ({ user_id: 'u_top' }) },
      { match: /UPDATE race_cycles[\s\S]*SET status/ },
    ]);

    const winner = await crownCycle(db, ENDED_CYCLE);

    expect(winner).toBe('u_top');
    const top = db.calls.find((c) => /SUM\(pl\.points\) AS score/.test(c.sql));
    expect(top!.sql).toMatch(/is_demo_data = 0/);
    expect(top!.sql).toMatch(/u\.status = 'approved'/);
    expect(top!.binds).toEqual([ENDED_CYCLE.starts_at, ENDED_CYCLE.ends_at]);
    const update = db.calls.find((c) => /UPDATE race_cycles[\s\S]*SET status/.test(c.sql));
    expect(update!.binds).toEqual(['crowned', 'u_top', 'cyc_ended']);
  });

  it('(e) closes an empty cycle with no winner', async () => {
    const db = dbOf([
      noCrossing,
      { match: /SUM\(pl\.points\) AS score/, first: () => null },
      { match: /UPDATE race_cycles[\s\S]*SET status/ },
    ]);

    const winner = await crownCycle(db, ENDED_CYCLE);

    expect(winner).toBeNull();
    const update = db.calls.find((c) => /UPDATE race_cycles[\s\S]*SET status/.test(c.sql));
    expect(update!.binds).toEqual(['closed', null, 'cyc_ended']);
  });

  it('(f) opens school cycles only for active schools and scopes scores to the school', async () => {
    // Opening: schools query filters on status='active'; one insert per school.
    const db = dbOf([
      endedCycles,
      { match: /FROM schools/, all: () => ({ results: [{ id: 'sch_active' }] }) },
      { match: /INSERT INTO race_cycles/ },
    ]);

    const res = await runRaceCycleMaintenance(db, 1000, NOW);

    expect(res.opened).toBe(2); // platform + one active school
    const schoolsQuery = db.calls.find((c) => /FROM schools/.test(c.sql));
    expect(schoolsQuery!.sql).toMatch(/status = 'active'/);
    const schoolInsert = db.calls.find(
      (c) => /INSERT INTO race_cycles/.test(c.sql) && c.binds[1] === 'school',
    );
    expect(schoolInsert).toBeDefined();
    expect(schoolInsert!.binds[2]).toBe('sch_active');
    expect(schoolInsert!.binds[7]).toBe('sch_active'); // NOT EXISTS guard is school-scoped too

    // Crowning a school cycle: fallback score query is restricted to that
    // school's approved users.
    const schoolCycle = { ...ENDED_CYCLE, id: 'cyc_school', scope: 'school', school_id: 'sch_active' };
    const crownDb = dbOf([
      noCrossing,
      { match: /SUM\(pl\.points\) AS score/, first: () => ({ user_id: 'u_school' }) },
      { match: /UPDATE race_cycles[\s\S]*SET status/ },
    ]);

    const winner = await crownCycle(crownDb, schoolCycle);

    expect(winner).toBe('u_school');
    const top = crownDb.calls.find((c) => /SUM\(pl\.points\) AS score/.test(c.sql));
    expect(top!.sql).toMatch(/AND u\.school_id = \?/);
    expect(top!.sql).toMatch(/u\.status = 'approved'/);
    expect(top!.binds).toEqual([schoolCycle.starts_at, schoolCycle.ends_at, 'sch_active']);
  });
});
