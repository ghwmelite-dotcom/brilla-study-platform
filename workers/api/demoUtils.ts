// =============================================
// DEMO DATA ISOLATION UTILITIES
// =============================================
// Shared utilities for detecting demo users and managing demo data cleanup

// Demo user email patterns (users with these emails are considered demo users)
export const DEMO_EMAIL_PATTERNS = ['@brillaprep.org'];

// Excluded emails (real accounts that use demo email domain)
export const EXCLUDED_DEMO_EMAILS = ['admin@brillaprep.org'];

// Demo user IDs (explicit list of demo user IDs)
// Note: admin_prod_001 is NOT a demo account - it's the main admin
export const DEMO_USER_IDS = [
  'teacher_1766327981453',
  'student_1766327981521',
  'parent_1',
  'demo_student_1',
  'demo_teacher_1',
  'demo_admin_1',
];

// Excluded user IDs (real accounts)
export const EXCLUDED_DEMO_IDS = ['admin_prod_001'];

/**
 * Check if a user ID belongs to a demo user
 */
export function isDemoUserId(userId: string): boolean {
  if (EXCLUDED_DEMO_IDS.includes(userId)) return false;
  return DEMO_USER_IDS.includes(userId) || userId.startsWith('demo_');
}

/**
 * Check if an email belongs to a demo user
 */
export function isDemoEmail(email: string): boolean {
  if (EXCLUDED_DEMO_EMAILS.includes(email.toLowerCase())) return false;
  return DEMO_EMAIL_PATTERNS.some(pattern => email.endsWith(pattern));
}

/**
 * Get demo data flags for database inserts
 * Returns { is_demo_data: 0|1, expires_at: string|null }
 *
 * Usage:
 * ```ts
 * const demoFlags = getDemoDataFlags(userId);
 * await db.prepare(`
 *   INSERT INTO table_name (id, user_id, ..., is_demo_data, expires_at)
 *   VALUES (?, ?, ..., ?, ?)
 * `).bind(id, userId, ..., demoFlags.is_demo_data, demoFlags.expires_at).run();
 * ```
 */
export function getDemoDataFlags(userId: string): { is_demo_data: number; expires_at: string | null } {
  if (isDemoUserId(userId)) {
    // Demo data expires in 24 hours
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    return { is_demo_data: 1, expires_at: expiresAt };
  }
  return { is_demo_data: 0, expires_at: null };
}

// List of tables that need demo data cleanup
export const DEMO_DATA_TABLES = [
  'user_progress',
  'question_attempts',
  'essay_attempts',
  'paper_attempts',
  'paper_attempt_answers',
  'practice_sessions',
  'user_achievements',
  'battles',
  'battle_answers',
  'house_points',
  'user_exam_preferences',
  'user_subject_selections',
  'chat_rooms',
  'chat_messages',
  'chat_message_reactions',
  'chat_room_members',
  'competitions',
  'leaderboard',
  'assessment_attempts',
  'assessment_attempt_answers',
  'parent_notifications',
  'parent_activity_log',
  'counselor_sessions',
  'counselor_conversations',
  'counselor_messages',
  'tutor_conversations',
  'tutor_messages',
  'library_resources',
  'notifications',
  'wellbeing_logs',
  'wellbeing_alerts',
  'tutor_feedback',
  'counselor_feedback',
];

/**
 * Clean up expired demo data from all tables
 * Should be called from a scheduled cron job
 */
export async function cleanupExpiredDemoData(db: D1Database): Promise<{ tablesProcessed: number; rowsDeleted: number }> {
  const now = new Date().toISOString();
  let totalDeleted = 0;
  let tablesProcessed = 0;

  for (const table of DEMO_DATA_TABLES) {
    try {
      // Delete expired demo data
      const result = await db.prepare(`
        DELETE FROM ${table}
        WHERE is_demo_data = 1 AND expires_at IS NOT NULL AND expires_at < ?
      `).bind(now).run();

      if (result.meta.changes > 0) {
        console.log(`Cleaned up ${result.meta.changes} expired demo records from ${table}`);
        totalDeleted += result.meta.changes;
      }
      tablesProcessed++;
    } catch (error) {
      // Table might not have the columns yet (migration not run) or table doesn't exist
      console.log(`Skipping ${table}: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  }

  return { tablesProcessed, rowsDeleted: totalDeleted };
}
