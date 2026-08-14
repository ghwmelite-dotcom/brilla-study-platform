import { subjects as examSubjects } from '@/data/examData';
import type { ExamTypeSlug } from '@/types';

export type GuidanceExamType =
  | 'wassce'
  | 'bece'
  | 'nsmq'
  | 'igcse'
  | 'cambridge_as'
  | 'cambridge_a2'
  | 'edexcel_igcse'
  | 'edexcel_as'
  | 'edexcel_a2';

export interface GuidanceSubject {
  id: string;
  name: string;
  slug: string;
  examTypeId: string;
}

interface GuidanceExamDefinition {
  apiId: GuidanceExamType;
  label: string;
  grades: readonly string[];
  subjectSourceIds: readonly string[];
}

const A_STAR_TO_G = ['A*', 'A', 'B', 'C', 'D', 'E', 'F', 'G'] as const;
const A_STAR_TO_E = ['A*', 'A', 'B', 'C', 'D', 'E'] as const;
const NINE_TO_ONE = ['9', '8', '7', '6', '5', '4', '3', '2', '1'] as const;

export const GUIDANCE_EXAM_CATALOG: Record<ExamTypeSlug, GuidanceExamDefinition> = {
  nsmq: {
    apiId: 'nsmq',
    label: 'NSMQ',
    grades: [],
    subjectSourceIds: ['exam_nsmq'],
  },
  wassce: {
    apiId: 'wassce',
    label: 'WASSCE',
    grades: ['A1', 'B2', 'B3', 'C4', 'C5', 'C6', 'D7', 'E8', 'F9'],
    subjectSourceIds: ['exam_wassce'],
  },
  bece: {
    apiId: 'bece',
    label: 'BECE',
    grades: ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
    subjectSourceIds: ['exam_bece'],
  },
  igcse: {
    apiId: 'igcse',
    label: 'Cambridge IGCSE',
    grades: A_STAR_TO_G,
    subjectSourceIds: ['igcse'],
  },
  'cambridge-as': {
    apiId: 'cambridge_as',
    label: 'Cambridge AS Level',
    grades: A_STAR_TO_E,
    // AS specifications share the A-Level subject rows in the current catalog.
    subjectSourceIds: ['cambridge_as', 'cambridge_a2'],
  },
  'cambridge-a-level': {
    apiId: 'cambridge_a2',
    label: 'Cambridge A Level',
    grades: A_STAR_TO_E,
    subjectSourceIds: ['cambridge_a2'],
  },
  'edexcel-igcse': {
    apiId: 'edexcel_igcse',
    label: 'Edexcel International GCSE',
    grades: NINE_TO_ONE,
    subjectSourceIds: ['edexcel_igcse'],
  },
  'edexcel-as': {
    apiId: 'edexcel_as',
    label: 'Edexcel AS Level',
    grades: A_STAR_TO_E,
    // Edexcel AS/A2 specifications currently share the IGCSE subject rows.
    subjectSourceIds: ['edexcel_as', 'edexcel_igcse'],
  },
  'edexcel-a-level': {
    apiId: 'edexcel_a2',
    label: 'Edexcel A Level',
    grades: A_STAR_TO_E,
    subjectSourceIds: ['edexcel_a2', 'edexcel_igcse'],
  },
};

const SUPPLEMENTAL_SUBJECTS: readonly GuidanceSubject[] = [
  { id: 'subj_edexcel_igcse_math', name: 'Mathematics A', slug: 'edexcel-igcse-math', examTypeId: 'edexcel_igcse' },
  { id: 'subj_edexcel_igcse_physics', name: 'Physics', slug: 'edexcel-igcse-physics', examTypeId: 'edexcel_igcse' },
  { id: 'subj_edexcel_igcse_chemistry', name: 'Chemistry', slug: 'edexcel-igcse-chemistry', examTypeId: 'edexcel_igcse' },
  { id: 'subj_edexcel_igcse_biology', name: 'Biology', slug: 'edexcel-igcse-biology', examTypeId: 'edexcel_igcse' },
];

export const GUIDANCE_EXAM_OPTIONS = (Object.entries(GUIDANCE_EXAM_CATALOG) as Array<
  [ExamTypeSlug, GuidanceExamDefinition]
>).map(([slug, definition]) => ({
  slug,
  apiId: definition.apiId,
  label: definition.label,
}));

export function toGuidanceExamType(slug: ExamTypeSlug): GuidanceExamType {
  return GUIDANCE_EXAM_CATALOG[slug].apiId;
}

export function fromGuidanceExamType(examType: GuidanceExamType): ExamTypeSlug {
  const match = GUIDANCE_EXAM_OPTIONS.find((exam) => exam.apiId === examType);
  if (!match) throw new Error(`Unsupported guidance exam type: ${examType}`);
  return match.slug;
}

export function getGuidanceGradeScale(slug: ExamTypeSlug): readonly string[] {
  return GUIDANCE_EXAM_CATALOG[slug].grades;
}

export function getGuidanceSubjects(slug: ExamTypeSlug): GuidanceSubject[] {
  const sourceIds = GUIDANCE_EXAM_CATALOG[slug].subjectSourceIds;
  const combined = [...examSubjects, ...SUPPLEMENTAL_SUBJECTS];
  const seen = new Set<string>();

  return combined
    .filter(
      (subject): subject is typeof subject & { examTypeId: string } =>
        typeof subject.examTypeId === 'string' && sourceIds.includes(subject.examTypeId)
    )
    .filter((subject) => {
      if (seen.has(subject.id)) return false;
      seen.add(subject.id);
      return true;
    })
    .map(({ id, name, slug: subjectSlug, examTypeId }) => ({
      id,
      name,
      slug: subjectSlug,
      examTypeId,
    }));
}

export const BRIE_DISMISSAL_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

export function getBrieCooldownKey(
  userId: string,
  examType: GuidanceExamType,
  subjectId: string
): string {
  return `brie_wizard_dismissed:${userId}:${examType}:${subjectId}`;
}

export function isBrieDismissalCoolingDown(
  userId: string,
  examType: GuidanceExamType,
  subjectId: string,
  now = Date.now()
): boolean {
  if (typeof window === 'undefined') return false;
  const raw = window.localStorage.getItem(getBrieCooldownKey(userId, examType, subjectId));
  if (!raw) return false;
  const dismissedAt = Number(raw);
  return Number.isFinite(dismissedAt) && now - dismissedAt < BRIE_DISMISSAL_COOLDOWN_MS;
}

export function markBrieDismissed(
  userId: string,
  examType: GuidanceExamType,
  subjectId: string,
  now = Date.now()
): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(getBrieCooldownKey(userId, examType, subjectId), String(now));
}
