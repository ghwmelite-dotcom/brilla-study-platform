import { notifyUser, type TelegramEnv } from './telegram';

// Weekly parent progress digest, fired from the Monday 06:00 UTC cron
// (wrangler.toml "0 6 * * 1"). For each parent with at least one active,
// non-opted-out student link, a per-child summary (questions attempted,
// accuracy, study time, streak, weakest topic) is built from the same tables
// the /parents/students/:id/progress endpoint reads, then:
//   1. an in-app parent_notifications row (type 'weekly_summary') is written
//      per child — regardless of Telegram linkage, and
//   2. a Telegram DM is attempted via notifyUser when the parent has a live
//      (non-stale) telegram_links row.
// The digest shares the 3 DM/day 'notify' budget with race alerts; a skipped
// DM is logged, never fatal, and the in-app notification has already landed.

export interface ChildDigestInput {
  name: string;
  questionsAttempted: number;
  questionsCorrect: number;
  studySeconds: number;
  streakDays: number;
  weakestTopic: string | null;
}

export interface ChildDigest extends ChildDigestInput {
  accuracyPct: number | null; // null when the child attempted nothing
  studyMinutes: number;
}

export function buildChildDigest(input: ChildDigestInput): ChildDigest {
  const accuracyPct = input.questionsAttempted > 0
    ? Math.round((input.questionsCorrect / input.questionsAttempted) * 100)
    : null;
  return {
    ...input,
    accuracyPct,
    studyMinutes: Math.round(input.studySeconds / 60),
  };
}

function formatStudyTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// In-app notification body for one child.
export function formatChildNotification(digest: ChildDigest): string {
  if (digest.questionsAttempted === 0) {
    return `${digest.name} didn't answer any questions this week. Current streak: ${digest.streakDays} days.`;
  }
  const parts = [
    `${digest.name} answered ${digest.questionsAttempted} questions this week with ${digest.accuracyPct}% accuracy.`,
  ];
  if (digest.studyMinutes > 0) parts.push(`Study time: ${formatStudyTime(digest.studyMinutes)}.`);
  parts.push(`Current streak: ${digest.streakDays} days.`);
  if (digest.weakestTopic) parts.push(`Focus area: ${digest.weakestTopic}.`);
  return parts.join(' ');
}

// Telegram DM: one block per child.
export function formatWeeklyDigest(children: ChildDigest[]): string {
  const blocks = children.map((c) => {
    const lines = [`👤 ${c.name}`];
    if (c.questionsAttempted === 0) {
      lines.push('• No questions answered this week');
    } else {
      lines.push(`• ${c.questionsAttempted} questions answered (${c.accuracyPct}% correct)`);
    }
    if (c.studyMinutes > 0) lines.push(`• Study time: ${formatStudyTime(c.studyMinutes)}`);
    lines.push(`• Streak: ${c.streakDays} days${c.streakDays >= 3 ? ' 🔥' : ''}`);
    if (c.weakestTopic) lines.push(`• Focus area: ${c.weakestTopic}`);
    return lines.join('\n');
  });
  return `📊 Weekly BrillaPrep progress report\n\n${blocks.join('\n\n')}\n\nOpen BrillaPrep for the full breakdown.`;
}

export interface DigestRunResult {
  parents: number;
  digestsSent: number;
  digestsSkipped: number;
  notificationsWritten: number;
}

export async function runWeeklyParentDigests(
  db: D1Database,
  env: TelegramEnv,
  now = new Date(),
): Promise<DigestRunResult> {
  const result: DigestRunResult = { parents: 0, digestsSent: 0, digestsSkipped: 0, notificationsWritten: 0 };

  // Parents with at least one active, non-opted-out student link. The
  // weekly_summary preference (parent_notification_preferences, exposed in
  // ParentSettings) is the digest opt-out; it defaults to on when no
  // preference row exists.
  const parents = await db.prepare(`
    SELECT DISTINCT psl.parent_id
    FROM parent_student_links psl
    JOIN users p ON p.id = psl.parent_id
    LEFT JOIN parent_notification_preferences pnp ON pnp.parent_id = psl.parent_id
    WHERE psl.status = 'active' AND psl.student_opted_out = 0
      AND p.status = 'approved' AND p.is_active = 1 AND p.is_demo = 0
      AND COALESCE(pnp.weekly_summary, 1) = 1
  `).bind().all<{ parent_id: string }>();

  for (const { parent_id } of parents.results) {
    const children = await db.prepare(`
      SELECT u.id, u.name, u.streak_days
      FROM parent_student_links psl
      JOIN users u ON u.id = psl.student_id
      WHERE psl.parent_id = ? AND psl.status = 'active' AND psl.student_opted_out = 0
        AND u.is_active = 1 AND u.is_demo = 0
    `).bind(parent_id).all<{ id: string; name: string; streak_days: number | null }>();

    if (children.results.length === 0) continue;
    result.parents++;

    const digests: ChildDigest[] = [];
    for (const child of children.results) {
      // Bounded to the trailing 7 days; demo attempts never reach parents.
      const stats = await db.prepare(`
        SELECT COUNT(*) AS attempted,
               COALESCE(SUM(is_correct), 0) AS correct,
               COALESCE(SUM(time_taken), 0) AS study_seconds
        FROM question_attempts
        WHERE user_id = ? AND is_demo_data = 0
          AND created_at >= datetime('now', '-7 days')
      `).bind(child.id).first<{ attempted: number; correct: number; study_seconds: number }>();

      // Weakest topic with a meaningful sample this week (>= 3 attempts).
      const weak = await db.prepare(`
        SELECT t.name AS topic_name, s.name AS subject_name
        FROM question_attempts qa
        JOIN questions q ON q.id = qa.question_id
        JOIN topics t ON t.id = q.topic_id
        LEFT JOIN subjects s ON s.id = t.subject_id
        WHERE qa.user_id = ? AND qa.is_demo_data = 0
          AND qa.created_at >= datetime('now', '-7 days')
        GROUP BY t.id
        HAVING COUNT(*) >= 3
        ORDER BY (CAST(SUM(qa.is_correct) AS REAL) / COUNT(*)) ASC, COUNT(*) DESC
        LIMIT 1
      `).bind(child.id).first<{ topic_name: string; subject_name: string | null }>();

      const digest = buildChildDigest({
        name: child.name,
        questionsAttempted: stats?.attempted ?? 0,
        questionsCorrect: stats?.correct ?? 0,
        studySeconds: stats?.study_seconds ?? 0,
        streakDays: child.streak_days ?? 0,
        weakestTopic: weak
          ? (weak.subject_name ? `${weak.topic_name} (${weak.subject_name})` : weak.topic_name)
          : null,
      });
      digests.push(digest);

      // In-app record per child, regardless of Telegram linkage.
      await db.prepare(`
        INSERT INTO parent_notifications (id, parent_id, student_id, type, title, message)
        VALUES (?, ?, ?, 'weekly_summary', 'Weekly Progress Report', ?)
      `).bind(`pn_${now.getTime()}_${child.id}`, parent_id, child.id, formatChildNotification(digest)).run();
      result.notificationsWritten++;
    }

    // Telegram DM only when the parent has a live (non-stale) link — checked
    // here so "no Telegram linked" is not conflated with a budget skip.
    // notifyUser enforces the shared 3 DM/day budget internally.
    const link = await db.prepare('SELECT chat_id FROM telegram_links WHERE user_id = ? AND stale = 0')
      .bind(parent_id).first<{ chat_id: string }>();
    if (!link) continue;

    const sent = await notifyUser(db, env, parent_id, formatWeeklyDigest(digests));
    if (sent) {
      result.digestsSent++;
    } else {
      result.digestsSkipped++;
      console.error('weekly digest: Telegram DM skipped (daily DM budget exhausted or send failed); in-app notification already written');
    }
  }

  return result;
}
