import type { D1Database } from '@cloudflare/workers-types';

export type PointSource =
  | 'question_correct' | 'battle_win' | 'streak_day' | 'quest_claim'
  | 'tutor_session' | 'essay_graded'
  | 'referral_signup' | 'referral_paid_conversion' | 'house_contribution'
  | 'notification_subscribe';

// Anti-farm: farmable sources are down-weighted AND capped per UTC day;
// social/verified sources (battle_win, referral_*, tutor_session) stay uncapped.
export const SOURCE_WEIGHTS: Record<PointSource, number> = {
  question_correct: 0.2,
  battle_win: 1,
  streak_day: 1,
  quest_claim: 0.5,
  tutor_session: 1,
  essay_graded: 0.5,
  referral_signup: 1,
  referral_paid_conversion: 1,
  house_contribution: 1,
  notification_subscribe: 1,
};

export const DAILY_SOURCE_CAPS: Partial<Record<PointSource, number>> = {
  question_correct: 100, // weighted race points per UTC day
  quest_claim: 50,
  essay_graded: 50,
};

// house_points.source CHECK is ('practice','battle','competition','achievement','bonus')
const HOUSE_SOURCE_MAP: Partial<Record<PointSource, string>> = {
  question_correct: 'practice',
  battle_win: 'battle',
  quest_claim: 'achievement',
  streak_day: 'achievement',
  essay_graded: 'achievement',
  tutor_session: 'achievement',
  referral_signup: 'bonus',
  referral_paid_conversion: 'bonus',
  house_contribution: 'bonus',
  notification_subscribe: 'bonus',
};

// house_points.period convention copied from index.ts /houses/points (YYYY-WW, week-of-month)
function currentPeriod(): string {
  const now = new Date();
  const weekNum = Math.ceil((now.getDate() - now.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

export interface AwardInput {
  userId: string;
  points: number;            // raw XP — users.xp_points increment (display XP, unchanged semantics)
  source: PointSource;
  sourceRef?: string | null;
  isDemoData?: number;       // 0|1 from getDemoDataFlags()
  expiresAt?: string | null; // from getDemoDataFlags()
}

export interface ActiveCycle { id: string; target_points: number; starts_at: string; ends_at: string; }

export async function getActiveCycleForUser(db: D1Database, userId: string): Promise<ActiveCycle | null> {
  // Tightest scope wins: the user's school cycle if any, else the platform cycle.
  return db.prepare(`
    SELECT rc.id, rc.target_points, rc.starts_at, rc.ends_at FROM race_cycles rc
    LEFT JOIN users u ON u.id = ?
    WHERE rc.status = 'active'
      AND (rc.scope = 'platform' OR (rc.scope = 'school' AND rc.school_id = u.school_id))
    ORDER BY CASE WHEN rc.scope = 'school' THEN 0 ELSE 1 END
    LIMIT 1
  `).bind(userId).first<ActiveCycle>();
}

export async function recordRaceCrossingIfReached(db: D1Database, cycle: ActiveCycle, userId: string): Promise<void> {
  const row = await db.prepare(`
    SELECT COALESCE(SUM(points), 0) AS score FROM points_ledger
    WHERE user_id = ? AND created_at >= ? AND created_at < ? AND is_demo_data = 0
  `).bind(userId, cycle.starts_at, cycle.ends_at).first<{ score: number }>();
  if ((row?.score ?? 0) >= cycle.target_points) {
    await db.prepare(
      `INSERT OR IGNORE INTO race_crossings (cycle_id, user_id) VALUES (?, ?)`
    ).bind(cycle.id, userId).run();
    await db.prepare(
      `UPDATE race_cycles SET target_hit_at = COALESCE(target_hit_at, datetime('now')) WHERE id = ?`
    ).bind(cycle.id).run();
  }
}

export async function awardPoints(db: D1Database, input: AwardInput): Promise<{ awarded: number; capped: boolean }> {
  const weight = SOURCE_WEIGHTS[input.source];
  let weighted = Math.round(input.points * weight);
  let capped = false;

  const cap = DAILY_SOURCE_CAPS[input.source];
  if (cap !== undefined && weighted > 0) {
    const row = await db.prepare(`
      SELECT COALESCE(SUM(points), 0) AS today FROM points_ledger
      WHERE user_id = ? AND source = ? AND date(created_at) = date('now')
    `).bind(input.userId, input.source).first<{ today: number }>();
    const used = row?.today ?? 0;
    if (used >= cap) { weighted = 0; capped = true; }
    else if (used + weighted > cap) { weighted = cap - used; capped = true; }
  }

  // 1. Display XP — raw points, exactly the semantics the retrofitted sites have today.
  await db.prepare('UPDATE users SET xp_points = xp_points + ? WHERE id = ?')
    .bind(input.points, input.userId).run();

  if (weighted > 0) {
    // 2. Race ledger (weighted), stamped with the user's tightest active cycle.
    const cycle = await getActiveCycleForUser(db, input.userId);
    await db.prepare(`
      INSERT INTO points_ledger (id, user_id, points, source, source_ref, cycle_id, is_demo_data, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(`pl_${crypto.randomUUID()}`, input.userId, weighted, input.source,
            input.sourceRef ?? null, cycle?.id ?? null,
            input.isDemoData ?? 0, input.expiresAt ?? null).run();
    if (cycle) await recordRaceCrossingIfReached(db, cycle, input.userId);

    // 3. House consistency: race score and house contribution can never visibly disagree.
    const houseSource = HOUSE_SOURCE_MAP[input.source];
    if (houseSource) {
      const u = await db.prepare('SELECT house FROM users WHERE id = ?')
        .bind(input.userId).first<{ house: string | null }>();
      if (u?.house) {
        await db.prepare(`
          INSERT INTO house_points (id, house_id, user_id, points, source, source_id, period, is_demo_data, expires_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(`hp_${crypto.randomUUID()}`, u.house, input.userId, weighted, houseSource,
                input.sourceRef ?? null, currentPeriod(),
                input.isDemoData ?? 0, input.expiresAt ?? null).run();
      }
    }
  }
  return { awarded: weighted, capped };
}
