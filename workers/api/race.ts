import { Hono } from 'hono';
import { requireAuth } from './auth-middleware';
import { getActiveCycleForUser } from './points';
import { parseLimit } from './http';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

export const raceApp = new Hono<{ Bindings: Env; Variables: { userId: string } }>();

export interface CrownableCycle {
  id: string;
  scope: string;
  school_id: string | null;
  starts_at: string;
  ends_at: string;
}

interface CycleRow extends CrownableCycle {
  target_points: number;
  status: string;
  winner_user_id: string | null;
  target_hit_at: string | null;
  crowned_at: string | null;
}

// 'YYYY-MM-DD HH:MM:SS' — same shape as SQLite's datetime('now') defaults.
function fmt(d: Date): string {
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

// Current week window: most recent Monday 00:00 UTC -> next Monday 00:00 UTC.
export function weekWindow(now: Date): { startsAt: string; endsAt: string } {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 7);
  return { startsAt: fmt(start), endsAt: fmt(end) };
}

export async function crownCycle(db: D1Database, cycle: CrownableCycle): Promise<string | null> {
  // First crossing wins the cycle outright (ties impossible: PRIMARY KEY + INSERT OR IGNORE,
  // earliest crossed_at is unique per user; if somehow tied, earlier crossing still wins).
  const crossing = await db.prepare(`
    SELECT user_id FROM race_crossings WHERE cycle_id = ? ORDER BY crossed_at ASC LIMIT 1
  `).bind(cycle.id).first<{ user_id: string }>();

  let winnerId: string | null = crossing?.user_id ?? null;

  if (!winnerId) {
    // Target never hit: highest weighted score inside the cycle window.
    const scopeClause = cycle.scope === 'school' ? 'AND u.school_id = ?' : '';
    const binds: unknown[] = [cycle.starts_at, cycle.ends_at];
    if (cycle.scope === 'school') binds.push(cycle.school_id);
    const top = await db.prepare(`
      SELECT pl.user_id, SUM(pl.points) AS score
      FROM points_ledger pl
      JOIN users u ON u.id = pl.user_id
      WHERE pl.created_at >= ? AND pl.created_at < ?
        AND pl.is_demo_data = 0 AND u.status = 'approved' ${scopeClause}
      GROUP BY pl.user_id
      ORDER BY score DESC, MIN(pl.created_at) ASC
      LIMIT 1
    `).bind(...binds).first<{ user_id: string }>();
    winnerId = top?.user_id ?? null;
  }

  await db.prepare(`
    UPDATE race_cycles
    SET status = ?, winner_user_id = ?, crowned_at = datetime('now')
    WHERE id = ? AND status = 'active'
  `).bind(winnerId ? 'crowned' : 'closed', winnerId, cycle.id).run();
  return winnerId;
}

/**
 * Cron entrypoint. Crowns every cycle whose window has ended, then opens the
 * current week's cycle for the platform and every active school. The
 * INSERT ... WHERE NOT EXISTS guard makes reruns idempotent.
 * `crowned` counts only cycles that produced a winner (empty cycles close).
 */
export async function runRaceCycleMaintenance(
  db: D1Database,
  targetPoints = 1000,
  now = new Date(),
): Promise<{ opened: number; crowned: number }> {
  // 1. Crown every active cycle whose window has ended.
  const ended = await db.prepare(`
    SELECT id, scope, school_id, starts_at, ends_at FROM race_cycles
    WHERE status = 'active' AND ends_at <= datetime('now')
  `).bind().all<CrownableCycle>();

  let crowned = 0;
  for (const cycle of ended.results) {
    if (await crownCycle(db, cycle)) crowned++;
  }

  // 2. Open this week's cycle for the platform + each active school.
  const { startsAt, endsAt } = weekWindow(now);
  const schools = await db.prepare(`SELECT id FROM schools WHERE status = 'active'`)
    .bind().all<{ id: string }>();
  const scopes: { scope: string; schoolId: string | null }[] = [{ scope: 'platform', schoolId: null }];
  for (const s of schools.results) scopes.push({ scope: 'school', schoolId: s.id });

  let opened = 0;
  for (const { scope, schoolId } of scopes) {
    const res = await db.prepare(`
      INSERT INTO race_cycles (id, scope, school_id, target_points, starts_at, ends_at)
      SELECT ?, ?, ?, ?, ?, ?
      WHERE NOT EXISTS (
        SELECT 1 FROM race_cycles WHERE scope = ? AND school_id IS ? AND status = 'active'
      )
    `).bind(`cyc_${crypto.randomUUID()}`, scope, schoolId, targetPoints, startsAt, endsAt,
            scope, schoolId).run();
    opened += res.meta.changes;
  }

  return { opened, crowned };
}

// Window-score leaderboard shared by /current (top + caller rank).
const SCORE_FROM = `
  FROM points_ledger pl
  JOIN users u ON u.id = pl.user_id
  WHERE pl.created_at >= ? AND pl.created_at < ?
    AND pl.is_demo_data = 0 AND u.status = 'approved'
`;

// =============================================
// RACE ENDPOINTS
// Paths stay param-free on purpose: Hono resolves first-registered-wins, and
// a `/:id` route here would shadow these fixed paths (and vice versa).
// =============================================

// GET /api/race/current — the caller's tightest active cycle + leaderboard.
raceApp.get('/current', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const db = c.env.DB;

    const active = await getActiveCycleForUser(db, userId);
    if (!active) {
      return c.json({ success: true, data: { cycle: null, top: [], me: null } });
    }

    const cycle = await db.prepare('SELECT * FROM race_cycles WHERE id = ?')
      .bind(active.id).first<CycleRow>();
    if (!cycle) {
      return c.json({ success: true, data: { cycle: null, top: [], me: null } });
    }

    const scopeClause = cycle.scope === 'school' ? 'AND u.school_id = ?' : '';
    const binds: unknown[] = [cycle.starts_at, cycle.ends_at];
    if (cycle.scope === 'school') binds.push(cycle.school_id);

    const topRows = await db.prepare(`
      SELECT pl.user_id, u.name, u.avatar_url, SUM(pl.points) AS score
      ${SCORE_FROM} ${scopeClause}
      GROUP BY pl.user_id
      ORDER BY score DESC, MIN(pl.created_at) ASC
      LIMIT 20
    `).bind(...binds).all<{ user_id: string; name: string; avatar_url: string | null; score: number }>();

    const top = topRows.results.map((r, i) => ({
      rank: i + 1,
      userId: r.user_id,
      name: r.name,
      avatarUrl: r.avatar_url,
      score: r.score,
    }));

    // Caller standing: null when they have no points this cycle.
    let me: { rank: number; score: number } | null = null;
    const myRow = await db.prepare(`
      SELECT COALESCE(SUM(points), 0) AS score FROM points_ledger
      WHERE user_id = ? AND created_at >= ? AND created_at < ? AND is_demo_data = 0
    `).bind(userId, cycle.starts_at, cycle.ends_at).first<{ score: number }>();

    if (myRow && myRow.score > 0) {
      const higher = await db.prepare(`
        SELECT COUNT(*) + 1 AS rank FROM (
          SELECT SUM(pl.points) AS s
          ${SCORE_FROM} ${scopeClause}
          GROUP BY pl.user_id
          HAVING s > ?
        )
      `).bind(...binds, myRow.score).first<{ rank: number }>();
      me = { rank: higher?.rank ?? 1, score: myRow.score };
    }

    return c.json({
      success: true,
      data: {
        cycle: {
          id: cycle.id,
          scope: cycle.scope,
          schoolId: cycle.school_id,
          targetPoints: cycle.target_points,
          startsAt: cycle.starts_at,
          endsAt: cycle.ends_at,
          targetHitAt: cycle.target_hit_at,
        },
        top,
        me,
      },
    });
  } catch (error) {
    console.error('Race current error:', error);
    return c.json({ success: false, error: 'Failed to load race' }, 500);
  }
});

// GET /api/race/cycles?limit=10 — public cycle history.
raceApp.get('/cycles', async (c) => {
  try {
    const limit = parseLimit(c, 10, 50);
    const rows = await c.env.DB.prepare(`
      SELECT rc.id, rc.scope, rc.school_id, rc.target_points, rc.starts_at, rc.ends_at,
             rc.status, rc.crowned_at, u.name AS winner_name
      FROM race_cycles rc
      LEFT JOIN users u ON u.id = rc.winner_user_id
      ORDER BY rc.starts_at DESC
      LIMIT ?
    `).bind(limit).all<{
      id: string; scope: string; school_id: string | null; target_points: number;
      starts_at: string; ends_at: string; status: string;
      crowned_at: string | null; winner_name: string | null;
    }>();

    return c.json({
      success: true,
      data: {
        cycles: rows.results.map((r) => ({
          id: r.id,
          scope: r.scope,
          schoolId: r.school_id,
          targetPoints: r.target_points,
          startsAt: r.starts_at,
          endsAt: r.ends_at,
          status: r.status,
          winnerName: r.winner_name,
          crownedAt: r.crowned_at,
        })),
      },
    });
  } catch (error) {
    console.error('Race cycles error:', error);
    return c.json({ success: false, error: 'Failed to load race cycles' }, 500);
  }
});
