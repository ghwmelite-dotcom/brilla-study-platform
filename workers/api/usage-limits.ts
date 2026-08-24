/**
 * Freemium Usage Limits Module
 * Handles daily question limits for free/demo users
 */

import type { D1Database } from '@cloudflare/workers-types';
import { CORE_SUBJECTS, isFreeSubject } from '../../shared/freemium-policy';

export { CORE_SUBJECTS, INTERNATIONAL_FREE_EXAMS } from '../../shared/freemium-policy';

// Constants
export const DAILY_QUESTION_LIMIT = 10;

export interface DailyUsageInfo {
  used: number;
  limit: number;
  remaining: number;
  resetsAt: string; // ISO timestamp for next midnight UTC
  isPremium: boolean;
  isUnlimited: boolean;
}

export interface UsageCheckResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  reason?: string;
}

/**
 * Get today's date in YYYY-MM-DD format (UTC)
 */
function getTodayUTC(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get the next midnight UTC as ISO string
 */
function getNextMidnightUTC(): string {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  return tomorrow.toISOString();
}

/**
 * Check if a user is premium (has active subscription, trial, or privileged role)
 */
export async function isPremiumUser(
  userId: string,
  db: D1Database
): Promise<boolean> {
  const user = await db
    .prepare(`
      SELECT role, subscription_tier_id, subscription_expires_at, trial_expires_at
      FROM users WHERE id = ?
    `)
    .bind(userId)
    .first<{
      role: string;
      subscription_tier_id: string | null;
      subscription_expires_at: string | null;
      trial_expires_at: string | null;
    }>();

  if (!user) return false;

  // Admins and teachers always have unlimited access
  if (user.role === 'admin' || user.role === 'teacher') {
    return true;
  }

  const now = new Date().toISOString();

  // Check active paid subscription
  if (
    user.subscription_tier_id &&
    user.subscription_tier_id !== 'tier_free' &&
    user.subscription_expires_at &&
    user.subscription_expires_at > now
  ) {
    return true;
  }

  // Check active trial
  if (user.trial_expires_at && user.trial_expires_at > now) {
    return true;
  }

  return false;
}

/**
 * Get daily usage info for a user
 */
export async function getDailyUsage(
  userId: string,
  db: D1Database
): Promise<DailyUsageInfo> {
  const premium = await isPremiumUser(userId, db);

  if (premium) {
    return {
      used: 0,
      limit: -1,
      remaining: -1,
      resetsAt: getNextMidnightUTC(),
      isPremium: true,
      isUnlimited: true,
    };
  }

  const today = getTodayUTC();

  const usage = await db
    .prepare(`
      SELECT question_count FROM daily_usage
      WHERE user_id = ? AND usage_date = ?
    `)
    .bind(userId, today)
    .first<{ question_count: number }>();

  const used = usage?.question_count || 0;
  const remaining = Math.max(0, DAILY_QUESTION_LIMIT - used);

  return {
    used,
    limit: DAILY_QUESTION_LIMIT,
    remaining,
    resetsAt: getNextMidnightUTC(),
    isPremium: false,
    isUnlimited: false,
  };
}

/**
 * Check if user can answer a question (has remaining quota)
 */
export async function checkCanAnswer(
  userId: string,
  db: D1Database
): Promise<UsageCheckResult> {
  const usage = await getDailyUsage(userId, db);

  if (usage.isUnlimited) {
    return {
      allowed: true,
      remaining: -1,
      limit: -1,
    };
  }

  if (usage.remaining <= 0) {
    return {
      allowed: false,
      remaining: 0,
      limit: usage.limit,
      reason: 'daily_limit_reached',
    };
  }

  return {
    allowed: true,
    remaining: usage.remaining,
    limit: usage.limit,
  };
}

// Daily AI interaction allowance for the revision classroom (free tier).
// Counted from the revision_ai_interactions audit table — no schema change.
export const DAILY_AI_INTERACTION_LIMIT = 10;

export interface AiAllowanceResult {
  allowed: boolean;
  remaining: number; // -1 = unlimited (premium)
  limit: number; // -1 = unlimited (premium)
}

/**
 * Count today's AI teaching interactions (teach phases, student questions,
 * checkpoint generations). Whiteboard interactions are excluded — the
 * whiteboard is premium-gated separately.
 */
export async function getDailyAiInteractions(
  userId: string,
  db: D1Database
): Promise<number> {
  const row = await db
    .prepare(`
      SELECT COUNT(*) AS count FROM revision_ai_interactions
      WHERE user_id = ?
        AND (interaction_type LIKE 'teach_%' OR interaction_type IN ('student_question', 'checkpoint'))
        AND date(created_at) = date('now')
    `)
    .bind(userId)
    .first<{ count: number }>();

  return row?.count || 0;
}

/**
 * Check whether a user may consume another classroom AI interaction today.
 */
export async function checkAiAllowance(
  userId: string,
  db: D1Database
): Promise<AiAllowanceResult> {
  if (await isPremiumUser(userId, db)) {
    return { allowed: true, remaining: -1, limit: -1 };
  }

  const used = await getDailyAiInteractions(userId, db);
  const remaining = Math.max(0, DAILY_AI_INTERACTION_LIMIT - used);

  return {
    allowed: remaining > 0,
    remaining,
    limit: DAILY_AI_INTERACTION_LIMIT,
  };
}

/**
 * Increment the daily usage count for a user
 */
export async function incrementUsage(
  userId: string,
  db: D1Database
): Promise<{ used: number; remaining: number }> {
  const premium = await isPremiumUser(userId, db);

  if (premium) {
    return { used: 0, remaining: -1 };
  }

  const today = getTodayUTC();
  const id = `usage_${userId}_${today}`;

  // Upsert: insert or update the count
  await db
    .prepare(`
      INSERT INTO daily_usage (id, user_id, usage_date, question_count, updated_at)
      VALUES (?, ?, ?, 1, datetime('now'))
      ON CONFLICT(user_id, usage_date) DO UPDATE SET
        question_count = question_count + 1,
        updated_at = datetime('now')
    `)
    .bind(id, userId, today)
    .run();

  // Get updated count
  const usage = await db
    .prepare(`
      SELECT question_count FROM daily_usage
      WHERE user_id = ? AND usage_date = ?
    `)
    .bind(userId, today)
    .first<{ question_count: number }>();

  const used = usage?.question_count || 1;
  const remaining = Math.max(0, DAILY_QUESTION_LIMIT - used);

  return { used, remaining };
}

/** Prepare one free-tier allowance increment for an atomic D1 batch. */
export function prepareQuestionAllowance(
  userId: string,
  db: D1Database,
): D1PreparedStatement {
  const today = getTodayUTC();
  const id = `usage_${userId}_${today}`;

  return db.prepare(`
    INSERT INTO daily_usage (id, user_id, usage_date, question_count, updated_at)
    VALUES (?, ?, ?, 1, datetime('now'))
    ON CONFLICT(user_id, usage_date) DO UPDATE SET
      question_count = daily_usage.question_count + 1,
      updated_at = datetime('now')
    RETURNING question_count
  `).bind(id, userId, today);
}

/** Atomically consume one free-tier question allowance. */
export async function consumeQuestionAllowance(
  userId: string,
  db: D1Database,
): Promise<UsageCheckResult & { used: number }> {
  if (await isPremiumUser(userId, db)) {
    return { allowed: true, used: 0, remaining: -1, limit: -1 };
  }

  const today = getTodayUTC();
  const id = `usage_${userId}_${today}`;
  const row = await db.prepare(`
    INSERT INTO daily_usage (id, user_id, usage_date, question_count, updated_at)
    VALUES (?, ?, ?, 1, datetime('now'))
    ON CONFLICT(user_id, usage_date) DO UPDATE SET
      question_count = daily_usage.question_count + 1,
      updated_at = datetime('now')
    WHERE daily_usage.question_count < ?
    RETURNING question_count
  `).bind(id, userId, today, DAILY_QUESTION_LIMIT).first<{ question_count: number }>();

  if (!row) {
    return {
      allowed: false,
      used: DAILY_QUESTION_LIMIT,
      remaining: 0,
      limit: DAILY_QUESTION_LIMIT,
      reason: 'daily_limit_reached',
    };
  }

  const used = Number(row.question_count);
  return {
    allowed: true,
    used,
    remaining: Math.max(0, DAILY_QUESTION_LIMIT - used),
    limit: DAILY_QUESTION_LIMIT,
  };
}
/**
 * Check if a subject is a core subject for an exam type
 */
export function isCoreSubject(examType: string, subjectSlug: string): boolean {
  return isFreeSubject(examType, subjectSlug);
}

/**
 * Get list of core subject slugs for an exam type
 */
export function getCoreSubjects(examType: string): string[] {
  return [...(CORE_SUBJECTS[examType.toLowerCase()] || [])];
}

/**
 * Check if user can access a subject
 */
export async function canAccessSubject(
  userId: string,
  examType: string,
  subjectSlug: string,
  db: D1Database
): Promise<boolean> {
  const premium = await isPremiumUser(userId, db);

  if (premium) {
    return true; // Premium users can access all subjects
  }

  return isCoreSubject(examType, subjectSlug);
}

/**
 * Clean up old daily usage records (older than 30 days)
 * Should be called periodically via cron
 */
export async function cleanupOldUsage(db: D1Database): Promise<number> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const cutoffDate = thirtyDaysAgo.toISOString().split('T')[0];

  const result = await db
    .prepare(`DELETE FROM daily_usage WHERE usage_date < ?`)
    .bind(cutoffDate)
    .run();

  return result.meta.changes || 0;
}
