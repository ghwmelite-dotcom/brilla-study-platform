import { describe, expect, it } from 'vitest';
import { toSafeInternalPath } from '../navigation';

describe('toSafeInternalPath', () => {
  it('keeps application paths, queries and fragments', () => {
    expect(toSafeInternalPath('/my-plan?week=2#today')).toBe('/my-plan?week=2#today');
  });

  it.each([
    'https://evil.example/phish',
    '//evil.example/phish',
    'javascript:alert(1)',
    '/\\evil.example',
    '/safe\nunsafe',
  ])('rejects unsafe navigation value %s', (value) => {
    expect(toSafeInternalPath(value, '/notifications')).toBe('/notifications');
  });
});
