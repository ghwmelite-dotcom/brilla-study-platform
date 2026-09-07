import type { D1Database } from '@cloudflare/workers-types';

// Win-streak bonus: +10 XP per consecutive win, capped at +50 (streak 5+).
export const BATTLE_WIN_STREAK_CAP = 5;

export function battleWinStreakBonus(streak: number): number {
  return Math.min(Math.max(streak, 0), BATTLE_WIN_STREAK_CAP) * 10;
}

interface StreakOutcome {
  at: string;
  won: boolean;
}

/**
 * A user's current consecutive-win streak across BOTH battle modes (1v1
 * `battles` and `team_battles` membership), most recent first; a loss or a
 * draw breaks the run. Reads the last 10 of each — enough to resolve the
 * capped bonus (5) with margin.
 */
export async function computeBattleWinStreak(db: D1Database, userId: string): Promise<number> {
  const solo = await db.prepare(`
    SELECT winner_id, completed_at FROM battles
    WHERE (challenger_id = ? OR opponent_id = ?) AND status = 'completed'
    ORDER BY completed_at DESC LIMIT 10
  `).bind(userId, userId).all();

  const team = await db.prepare(`
    SELECT tb.winner_team, tb.completed_at, tbm.team_number
    FROM team_battles tb
    JOIN team_battle_members tbm ON tb.id = tbm.battle_id AND tbm.user_id = ?
    WHERE tb.status = 'completed'
    ORDER BY tb.completed_at DESC LIMIT 10
  `).bind(userId).all();

  const outcomes: StreakOutcome[] = [
    ...solo.results.map((row) => {
      const r = row as { winner_id: string | null; completed_at: string | null };
      return { at: r.completed_at ?? '', won: r.winner_id === userId };
    }),
    ...team.results.map((row) => {
      const r = row as { winner_team: number | null; completed_at: string | null; team_number: number };
      return { at: r.completed_at ?? '', won: r.winner_team !== null && r.winner_team === r.team_number };
    }),
  ].sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));

  let streak = 0;
  for (const outcome of outcomes) {
    if (!outcome.won) break;
    streak++;
  }
  return streak;
}
