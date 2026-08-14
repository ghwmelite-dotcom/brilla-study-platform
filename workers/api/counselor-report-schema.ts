type ConcernLevel = 'none' | 'low' | 'medium' | 'high' | 'urgent';

export interface CounselorReportContent {
  summary: string;
  academicPerformance: Record<string, unknown>;
  wellbeingAssessment: Record<string, unknown>;
  keyInsights: string[];
  recommendations: Array<Record<string, unknown>>;
  goals: Array<Record<string, unknown>>;
  concernLevel: ConcernLevel;
}

const CONCERN_LEVELS = new Set<ConcernLevel>(['none', 'low', 'medium', 'high', 'urgent']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringArray(value: unknown, maxItems: number, maxLength: number): string[] | null {
  if (!Array.isArray(value) || value.length > maxItems) return null;
  const strings = value.filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
  if (strings.length !== value.length || strings.some((item) => item.length > maxLength)) return null;
  return strings;
}

function recordArray(value: unknown, maxItems: number): Array<Record<string, unknown>> | null {
  if (!Array.isArray(value) || value.length > maxItems || !value.every(isRecord)) return null;
  return value;
}

/** Rejects malformed or oversized model output before it reaches persistent storage. */
export function parseCounselorReportContent(value: unknown): CounselorReportContent | null {
  if (!isRecord(value)) return null;

  const summary = typeof value.summary === 'string' ? value.summary.trim() : '';
  const keyInsights = stringArray(value.keyInsights, 20, 1000);
  const recommendations = recordArray(value.recommendations, 20);
  const goals = recordArray(value.goals, 20);
  const concernLevel = value.concernLevel;

  if (!summary || summary.length > 4000
    || !isRecord(value.academicPerformance)
    || !isRecord(value.wellbeingAssessment)
    || !keyInsights
    || !recommendations
    || !goals
    || typeof concernLevel !== 'string'
    || !CONCERN_LEVELS.has(concernLevel as ConcernLevel)) {
    return null;
  }

  return {
    summary,
    academicPerformance: value.academicPerformance,
    wellbeingAssessment: value.wellbeingAssessment,
    keyInsights,
    recommendations,
    goals,
    concernLevel: concernLevel as ConcernLevel,
  };
}
