import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

// Real platform counts from GET /api/public/stats (spec 1.5). On any failure
// the hook returns null and callers render their static fallback strings.

export interface PublicStats {
  students: number;
  questions: number;
  subjectsWithQuestions: number;
  chatRooms: number;
  studyGroups: number;
  pastPapers: number;
}

// Rounded-down marketing format: 4,567 -> "4,500+", 47 (step 10) -> "40+",
// 7 (step 10) -> "7" (exact when below the step — never "0+").
export function formatStatCount(value: number, step: number): string {
  if (!Number.isFinite(value) || value < 0) return '0';
  if (value < step) return String(value);
  return `${(Math.floor(value / step) * step).toLocaleString()}+`;
}

// Hero stats row: real question/subject counts, static fallbacks.
export function heroStatsText(stats: PublicStats | null): { questions: string; subjects: string } {
  return {
    questions: stats ? formatStatCount(stats.questions, 100) : '4,000+',
    subjects: stats ? formatStatCount(stats.subjectsWithQuestions, 10) : '60+',
  };
}

// Community stats row: real student/group/room counts. On fetch failure fall
// back to non-numeric words rather than invented counts.
export function communityStatsText(stats: PublicStats | null): {
  students: string;
  studyGroups: string;
  chatRooms: string;
} {
  return {
    students: stats ? formatStatCount(stats.students, 100) : 'Growing',
    studyGroups: stats ? formatStatCount(stats.studyGroups, 10) : 'Open',
    chatRooms: stats ? formatStatCount(stats.chatRooms, 10) : 'Open',
  };
}

export function usePublicStats(): PublicStats | null {
  const [stats, setStats] = useState<PublicStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.get<PublicStats>('/public/stats')
      .then((response) => {
        if (!cancelled && response.success && response.data) {
          setStats(response.data);
        }
      })
      .catch(() => {
        // Keep the static fallback copy.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return stats;
}
