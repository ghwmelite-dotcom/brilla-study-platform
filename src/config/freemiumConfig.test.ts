import { describe, expect, it } from 'vitest';
import { isCoreSubject } from './freemiumConfig';

describe('canonical free-subject policy', () => {
  it.each([
    ['wassce', 'wassce-core-mathematics'],
    ['wassce', 'wassce-english-language'],
    ['wassce', 'wassce-integrated-science'],
    ['wassce', 'wassce-social-studies'],
    ['bece', 'bece-mathematics'],
    ['bece', 'bece-english-language'],
    ['bece', 'bece-integrated-science'],
    ['bece', 'bece-social-studies'],
    ['nsmq', 'nsmq-mathematics'],
    ['nsmq', 'nsmq-physics'],
    ['nsmq', 'nsmq-chemistry'],
    ['nsmq', 'nsmq-biology'],
    ['igcse', 'igcse-physics'],
    ['cambridge-a-level', 'alevel-mathematics'],
  ] as const)('allows %s / %s', (examType, slug) => {
    expect(isCoreSubject(examType, slug)).toBe(true);
  });

  it.each([
    ['wassce', 'wassce-physics'],
    ['wassce', 'wassce-elective-mathematics'],
    ['bece', 'bece-french'],
  ] as const)('keeps %s / %s premium', (examType, slug) => {
    expect(isCoreSubject(examType, slug)).toBe(false);
  });

  it('fails closed for missing or unknown exam metadata', () => {
    expect(isCoreSubject('unknown' as never, 'mathematics')).toBe(false);
    expect(isCoreSubject('' as never, 'mathematics')).toBe(false);
  });
});
