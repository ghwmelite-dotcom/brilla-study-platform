export const SUBJECT_AVAILABLE_QUESTION_FLOOR = 20;

export type SubjectAvailabilityStatus = 'available' | 'limited' | 'unavailable';

export type SubjectAvailabilityReason =
  | 'question_bank_meets_operational_floor'
  | 'question_bank_below_operational_floor'
  | 'question_bank_empty';

export interface SubjectAvailability {
  availabilityStatus: SubjectAvailabilityStatus;
  availabilityReason: SubjectAvailabilityReason;
}

function toNonNegativeInteger(value: unknown): number {
  const numeric = typeof value === 'number' ? value : Number(value ?? 0);
  if (!Number.isFinite(numeric) || numeric <= 0) return 0;
  return Math.floor(numeric);
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export function getSubjectAvailability(questionCount: number): SubjectAvailability {
  if (questionCount <= 0) {
    return {
      availabilityStatus: 'unavailable',
      availabilityReason: 'question_bank_empty',
    };
  }

  if (questionCount < SUBJECT_AVAILABLE_QUESTION_FLOOR) {
    return {
      availabilityStatus: 'limited',
      availabilityReason: 'question_bank_below_operational_floor',
    };
  }

  return {
    availabilityStatus: 'available',
    availabilityReason: 'question_bank_meets_operational_floor',
  };
}

export function mapSubjectCatalogRow(row: Record<string, unknown>): Record<string, unknown> {
  const questionCount = toNonNegativeInteger(row.question_count);
  const topicCount = toNonNegativeInteger(row.topic_count);
  const availability = getSubjectAvailability(questionCount);

  return {
    ...row,
    question_count: questionCount,
    topic_count: topicCount,
    examTypeId: optionalString(row.exam_type_id),
    categoryId: optionalString(row.category_id),
    waecCode: optionalString(row.waec_code),
    isActive: Number(row.is_active ?? 0) === 1,
    displayOrder: toNonNegativeInteger(row.display_order),
    questionCount,
    topicCount,
    ...availability,
    contentReviewStatus: questionCount > 0 ? 'legacy_unreviewed' : undefined,
  };
}
