/**
 * Freemium Configuration
 * Defines daily limits and core subjects for free users
 */

import type { ExamTypeSlug, GhanaExamTypeSlug } from '@/types';

// Daily question limit for free users
export const DAILY_QUESTION_LIMIT = 10;

// Core subjects per exam type - free users can only access these
// Note: International exams (O/A Levels) use the exam board system for subject management
export const CORE_SUBJECTS: Record<GhanaExamTypeSlug, string[]> = {
  bece: ['mathematics', 'english', 'integrated-science', 'social-studies'],
  wassce: ['core-mathematics', 'english-language', 'integrated-science', 'social-studies'],
  nsmq: ['mathematics', 'physics', 'chemistry', 'biology'], // All are core for NSMQ
};

/**
 * Check if a subject is a core subject for an exam type
 */
export function isCoreSubject(examType: ExamTypeSlug, subjectSlug: string): boolean {
  // International exams (O/A Levels) don't use core subject restrictions
  if (!isGhanaExamType(examType)) return true;

  const coreSubjects = CORE_SUBJECTS[examType];
  if (!coreSubjects) return true; // If exam type unknown, allow all
  return coreSubjects.some(core =>
    subjectSlug.toLowerCase().includes(core.toLowerCase()) ||
    core.toLowerCase().includes(subjectSlug.toLowerCase())
  );
}

/**
 * Get list of core subject slugs for an exam type
 */
export function getCoreSubjects(examType: ExamTypeSlug): string[] {
  if (!isGhanaExamType(examType)) return [];
  return CORE_SUBJECTS[examType] || [];
}

/**
 * Type guard for Ghana exam types
 */
function isGhanaExamType(examType: ExamTypeSlug): examType is GhanaExamTypeSlug {
  return ['nsmq', 'wassce', 'bece'].includes(examType);
}

/**
 * Get the next midnight UTC timestamp
 */
export function getNextMidnightUTC(): Date {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  return tomorrow;
}

/**
 * Format time remaining until reset
 */
export function formatTimeUntilReset(resetsAt: string | Date): string {
  const resetTime = typeof resetsAt === 'string' ? new Date(resetsAt) : resetsAt;
  const now = new Date();
  const diffMs = resetTime.getTime() - now.getTime();

  if (diffMs <= 0) return 'Resetting now...';

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `Resets in ${hours}h ${minutes}m`;
  }
  return `Resets in ${minutes}m`;
}
