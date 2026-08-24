import type { Subject } from '@/types';

export function getPracticeSubjectOption(subject: Subject, premiumLocked: boolean) {
  const status = subject.availabilityStatus ?? 'unknown';
  const unavailable = status === 'unavailable';
  const checking = status === 'unknown';
  const locked = !unavailable && !checking && premiumLocked;
  let label = subject.name;

  const reviewQualifier = subject.contentReviewStatus === 'legacy_unreviewed'
    ? ['Academic review pending']
    : subject.contentReviewStatus === 'automated_beta'
      ? ['Beta practice bank']
      : [];

  if (unavailable) {
    label = `${subject.name} - ${['Not yet available', ...reviewQualifier].join(' - ')}`;
  } else if (checking) {
    label = `${subject.name} - Checking availability`;
  } else {
    const qualifiers = [
      ...(status === 'limited' ? ['Limited question bank'] : []),
      ...(locked ? ['Premium'] : []),
      ...reviewQualifier,
    ];
    if (qualifiers.length > 0) label = `${subject.name} - ${qualifiers.join(' - ')}`;
  }

  return {
    value: subject.slug,
    label,
    disabled: unavailable || checking || locked,
  };
}
export function getQuestionBankError(
  response: { code?: string; error?: string },
  fallback: string,
): string {
  if (response.code === 'SUBJECT_UNAVAILABLE') {
    return response.error || 'This subject does not have practice questions yet.';
  }
  return response.error || fallback;
}
