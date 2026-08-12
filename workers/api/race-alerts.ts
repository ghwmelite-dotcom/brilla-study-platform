import {
  notifyUser,
  notifySchoolChannel,
  notifyPlatformChannel,
  telegramApi,
  type TelegramEnv,
} from './telegram';
import { checkRateLimit, type RateLimitConfig } from './rate-limit';

// Telegram community alerts, fired from the cron after race maintenance.
// Every send goes through the never-throw helpers in telegram.ts and all state
// is recovered by query (dedup columns / flag bits), so a cron rerun — or a
// full Telegram outage — never double-posts and never fails the cron.

// race_alert_state.alerted_flags bits.
export const ALERT_FLAG_POSITION_PASSED = 1;
export const ALERT_FLAG_ENDING_SOON = 2;

// Streak-rescue gets its own 1/day bucket ('notify-streak') on top of the
// shared 'notify' DM budget enforced inside notifyUser.
export const STREAK_RESCUE_LIMIT: RateLimitConfig = { maxRequests: 1, windowMs: 24 * 60 * 60 * 1000 };

const ENDING_SOON_MS = 12 * 60 * 60 * 1000;

interface CrownedCycle {
  id: string;
  scope: string;
  school_id: string | null;
  winner_name: string | null;
  winner_user_id: string | null;
}

interface OpenedCycle {
  id: string;
  scope: string;
  school_id: string | null;
  starts_at: string;
  ends_at: string;
}

interface ActiveCycle extends OpenedCycle {
  target_points: number;
}

interface RankedUser {
  user_id: string;
  score: number;
}

interface AlertState {
  last_rank: number | null;
  last_score: number | null;
  alerted_flags: number;
}

// Window-score ranking — same shape as race.ts /current (SCORE_FROM).
const SCORE_FROM = `
  FROM points_ledger pl
  JOIN users u ON u.id = pl.user_id
  WHERE pl.created_at >= ? AND pl.created_at < ?
    AND pl.is_demo_data = 0 AND u.status = 'approved'
`;

export async function runTelegramRaceAlerts(
  db: D1Database,
  env: TelegramEnv,
  now = new Date(),
): Promise<{ posts: number; dms: number }> {
  let posts = 0, dms = 0;

  // 1. Winner announcements (crowned since last cron pass; 6h cron → 7h lookback).
  const crowned = await db.prepare(`
    SELECT rc.id, rc.scope, rc.school_id, u.name AS winner_name, rc.winner_user_id
    FROM race_cycles rc LEFT JOIN users u ON u.id = rc.winner_user_id
    WHERE rc.status = 'crowned' AND rc.winner_announced_at IS NULL
      AND rc.crowned_at >= datetime('now', '-7 hours')
  `).bind().all<CrownedCycle>();

  for (const cy of crowned.results) {
    const isSchool = cy.scope === 'school' && !!cy.school_id;
    // The post — and therefore the getChatMember name gate — targets the school
    // channel for school-scope cycles, the platform channel otherwise. Gating
    // against the platform channel while posting to the school channel would
    // name non-members and DM winners to join the wrong channel.
    let targetChannel: string | null = env.TELEGRAM_PLATFORM_CHANNEL_ID ?? null;
    if (isSchool) {
      const ch = await db.prepare('SELECT channel_id FROM school_channels WHERE school_id = ? AND broken = 0')
        .bind(cy.school_id).first<{ channel_id: string }>();
      targetChannel = ch?.channel_id ?? null;
      if (!targetChannel) {
        // No school channel configured: skip the post entirely (a school-race
        // winner does not belong on the platform channel). Still mark announced
        // so setting the channel up later doesn't emit a stale winner post.
        await db.prepare("UPDATE race_cycles SET winner_announced_at = datetime('now') WHERE id = ?").bind(cy.id).run();
        continue;
      }
    }
    let named = false;
    if (cy.winner_user_id && targetChannel) {
      const link = await db.prepare('SELECT chat_id FROM telegram_links WHERE user_id = ? AND stale = 0')
        .bind(cy.winner_user_id).first<{ chat_id: string }>();
      if (link) {
        const member = await telegramApi(env, 'getChatMember', {
          chat_id: targetChannel, user_id: link.chat_id,
        });
        named = member.ok;
        if (!named) {
          const dmText = isSchool
            ? "🏆 You won the weekly race! Join your school's Telegram channel to see your win announced."
            : '🏆 You won the weekly race! Join the BrillaPrep community channel to see your win announced.';
          if (await notifyUser(db, env, cy.winner_user_id, dmText)) dms++;
        }
      }
    }
    const text = named && cy.winner_name
      ? `🏆 This week's race winner: ${cy.winner_name}! Congratulations!`
      : `🏆 This week's race has a winner! Check the leaderboard on BrillaPrep.`;
    const sent = isSchool
      ? await notifySchoolChannel(db, env, cy.school_id!, text)
      : await notifyPlatformChannel(env, text);
    if (sent) posts++;
    // Mark announced regardless of send outcome: a Telegram outage must not
    // cause a catch-up storm of stale winner posts on the next pass.
    await db.prepare("UPDATE race_cycles SET winner_announced_at = datetime('now') WHERE id = ?").bind(cy.id).run();
  }

  // 2. Cycle-start posts (same lookback pattern on created_at + start_announced_at).
  const opened = await db.prepare(`
    SELECT rc.id, rc.scope, rc.school_id, rc.starts_at, rc.ends_at
    FROM race_cycles rc
    WHERE rc.status = 'active' AND rc.start_announced_at IS NULL
      AND rc.created_at >= datetime('now', '-7 hours')
  `).bind().all<OpenedCycle>();

  for (const cy of opened.results) {
    const text = cy.scope === 'school'
      ? '🚦 A new weekly race has started for your school on BrillaPrep — earn XP before Monday to win!'
      : '🚦 A new weekly race has started on BrillaPrep — earn XP before Monday to win!';
    const sent = cy.scope === 'school' && cy.school_id
      ? await notifySchoolChannel(db, env, cy.school_id, text)
      : await notifyPlatformChannel(env, text);
    if (sent) posts++;
    // Same rationale as winner_announced_at: never queue stale start posts.
    await db.prepare("UPDATE race_cycles SET start_announced_at = datetime('now') WHERE id = ?").bind(cy.id).run();
  }

  // 3. Position-passed / ending-soon DMs per active cycle. Rankings are
  //    recomputed from points_ledger; race_alert_state carries last_rank and
  //    the one-shot alert flags. A DM only fires when its flag bit flips
  //    from 0, and the bit is only set when the DM actually went out.
  const active = await db.prepare(`
    SELECT rc.id, rc.scope, rc.school_id, rc.starts_at, rc.ends_at, rc.target_points
    FROM race_cycles rc
    WHERE rc.status = 'active'
  `).bind().all<ActiveCycle>();

  for (const cy of active.results) {
    const scopeClause = cy.scope === 'school' ? 'AND u.school_id = ?' : '';
    const binds: unknown[] = [cy.starts_at, cy.ends_at];
    if (cy.scope === 'school') binds.push(cy.school_id);
    const ranked = await db.prepare(`
      SELECT pl.user_id, SUM(pl.points) AS score
      ${SCORE_FROM} ${scopeClause}
      GROUP BY pl.user_id
      ORDER BY score DESC, MIN(pl.created_at) ASC
    `).bind(...binds).all<RankedUser>();

    const msLeft = new Date(cy.ends_at).getTime() - now.getTime();
    const endingSoon = msLeft > 0 && msLeft <= ENDING_SOON_MS;

    for (let i = 0; i < ranked.results.length; i++) {
      const { user_id, score } = ranked.results[i];
      const rank = i + 1;
      const state = await db.prepare(
        'SELECT last_rank, last_score, alerted_flags FROM race_alert_state WHERE user_id = ? AND cycle_id = ?'
      ).bind(user_id, cy.id).first<AlertState>();

      let flags = state?.alerted_flags ?? 0;

      if (state?.last_rank != null && rank > state.last_rank && !(flags & ALERT_FLAG_POSITION_PASSED)) {
        if (await notifyUser(db, env, user_id,
          `📉 You've been overtaken in the BrillaPrep weekly race — you're now #${rank}. Answer questions to climb back!`)) {
          flags |= ALERT_FLAG_POSITION_PASSED;
          dms++;
        }
      }

      if (endingSoon && !(flags & ALERT_FLAG_ENDING_SOON)) {
        if (await notifyUser(db, env, user_id,
          `⏰ The weekly race ends in under 12 hours — you're #${rank}. Final push!`)) {
          flags |= ALERT_FLAG_ENDING_SOON;
          dms++;
        }
      }

      await db.prepare(`
        INSERT INTO race_alert_state (user_id, cycle_id, last_rank, last_score, alerted_flags)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(user_id, cycle_id) DO UPDATE SET
          last_rank = excluded.last_rank,
          last_score = excluded.last_score,
          alerted_flags = excluded.alerted_flags
      `).bind(user_id, cy.id, rank, score, flags).run();
    }
  }

  // 4. Streak rescue: one nudge per day ('notify-streak' bucket) on top of the
  //    shared 'notify' budget that notifyUser enforces internally.
  const atRisk = await db.prepare(`
    SELECT u.id, u.streak_days FROM users u
    JOIN telegram_links tl ON tl.user_id = u.id AND tl.stale = 0
    WHERE u.streak_days > 0 AND u.status = 'approved'
      AND datetime(u.streak_last_activity) < datetime('now', '-22 hours')
  `).bind().all<{ id: string; streak_days: number }>();
  for (const u of atRisk.results) {
    const once = await checkRateLimit(db, u.id, 'notify-streak', STREAK_RESCUE_LIMIT);
    if (!once.allowed) continue;
    if (await notifyUser(db, env, u.id,
      `🔥 Your ${u.streak_days}-day streak is about to expire — answer one question to save it!`)) dms++;
  }

  return { posts, dms };
}
