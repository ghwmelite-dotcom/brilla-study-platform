import { describe, expect, it } from 'vitest';
import { MAX_ESSAY_CHARACTERS, parseEssaySubmission } from '../essay-content';

describe('parseEssaySubmission', () => {
  it('normalizes a valid plain-text essay and counts words', () => {
    expect(parseEssaySubmission({
      questionId: 'essay_1',
      answerText: '  Ghana is home.\r\nWe learn here.  ',
      gradingType: 'ai',
    })).toEqual({
      questionId: 'essay_1',
      answerText: 'Ghana is home.\nWe learn here.',
      gradingType: 'ai',
      wordCount: 6,
    });
  });

  it.each([
    null,
    {},
    { questionId: 'essay_1', answerText: '<img src=x onerror=alert(1)>' },
    { questionId: 'essay_1', answerText: '<script>alert(1)</script>' },
    { questionId: 'essay_1', answerText: 'x', gradingType: 'unexpected' },
    { questionId: 'essay_1', answerText: 'x'.repeat(MAX_ESSAY_CHARACTERS + 1) },
  ])('rejects malformed or HTML-bearing input', (input) => {
    expect(parseEssaySubmission(input)).toBeNull();
  });
});
