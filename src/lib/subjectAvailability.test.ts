import { describe, expect, it } from 'vitest';
import type { Subject } from '@/types';
import { getPracticeSubjectOption, getQuestionBankError } from './subjectAvailability';

const subject: Subject = {
  id: 'subject-1',
  name: 'Mathematics',
  slug: 'mathematics',
  icon: 'calculator',
  color: '#2563eb',
  isActive: true,
  displayOrder: 1,
};

describe('practice subject availability', () => {
  it('disables an unavailable bank before considering premium entitlement', () => {
    expect(getPracticeSubjectOption({
      ...subject,
      availabilityStatus: 'unavailable',
      questionCount: 0,
    }, true)).toEqual({
      value: 'mathematics',
      label: 'Mathematics - Not yet available',
      disabled: true,
    });
  });

  it('keeps a limited bank usable and labels reduced coverage', () => {
    expect(getPracticeSubjectOption({
      ...subject,
      availabilityStatus: 'limited',
      questionCount: 19,
    }, false)).toEqual({
      value: 'mathematics',
      label: 'Mathematics - Limited question bank',
      disabled: false,
    });
  });

  it('explains premium entitlement separately for a limited bank', () => {
    expect(getPracticeSubjectOption({
      ...subject,
      availabilityStatus: 'limited',
      questionCount: 19,
    }, true)).toEqual({
      value: 'mathematics',
      label: 'Mathematics - Limited question bank - Premium',
      disabled: true,
    });
  });

  it('labels legacy question banks as pending academic review', () => {
    expect(getPracticeSubjectOption({
      ...subject,
      availabilityStatus: 'available',
      questionCount: 20,
      contentReviewStatus: 'legacy_unreviewed',
    }, false)).toEqual({
      value: 'mathematics',
      label: 'Mathematics - Academic review pending',
      disabled: false,
    });
  });

  it('labels automated syllabus-aligned content as a beta practice bank', () => {
    expect(getPracticeSubjectOption({
      ...subject,
      availabilityStatus: 'available',
      questionCount: 40,
      contentReviewStatus: 'automated_beta',
    }, false)).toEqual({
      value: 'mathematics',
      label: 'Mathematics - Beta practice bank',
      disabled: false,
    });
  });
  it('preserves the stable unavailable-bank API message', () => {
    expect(getQuestionBankError({
      code: 'SUBJECT_UNAVAILABLE',
      error: 'This subject does not have practice questions yet.',
    }, 'No questions found')).toBe('This subject does not have practice questions yet.');
  });

  it('applies premium locking only after an available bank is confirmed', () => {    expect(getPracticeSubjectOption({
      ...subject,
      availabilityStatus: 'available',
      questionCount: 20,
    }, true)).toEqual({
      value: 'mathematics',
      label: 'Mathematics - Premium',
      disabled: true,
    });
  });
});
