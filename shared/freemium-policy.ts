export const CORE_SUBJECTS: Readonly<Record<string, readonly string[]>> = {
  bece: ['mathematics', 'english-language', 'integrated-science', 'social-studies'],
  wassce: ['core-mathematics', 'english-language', 'integrated-science', 'social-studies'],
  nsmq: ['mathematics', 'physics', 'chemistry', 'biology'],
};

export const INTERNATIONAL_FREE_EXAMS = [
  'igcse',
  'cambridge-as',
  'cambridge-a-level',
  'edexcel-igcse',
  'edexcel-as',
  'edexcel-a-level',
] as const;

const INTERNATIONAL_EXAMS = new Set<string>(INTERNATIONAL_FREE_EXAMS);

export function isFreeSubject(examType: string, subjectSlug: string): boolean {
  if (typeof examType !== 'string' || typeof subjectSlug !== 'string') return false;
  const normalizedExam = examType.trim().toLowerCase();
  const normalizedSlug = subjectSlug.trim().toLowerCase();
  if (!normalizedExam || !normalizedSlug) return false;
  const coreSubjects = CORE_SUBJECTS[normalizedExam];
  if (!coreSubjects) return INTERNATIONAL_EXAMS.has(normalizedExam);

  const examPrefix = `${normalizedExam}-`;
  const canonicalSlug = normalizedSlug.startsWith(examPrefix)
    ? normalizedSlug.slice(examPrefix.length)
    : normalizedSlug;
  return coreSubjects.includes(canonicalSlug);
}
