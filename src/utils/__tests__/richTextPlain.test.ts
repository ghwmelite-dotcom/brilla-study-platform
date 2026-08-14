// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { richTextToPlainText } from '../richText';

describe('richTextToPlainText', () => {
  it('preserves paragraph boundaries while removing markup', () => {
    expect(richTextToPlainText('<p>First <strong>point</strong>.</p><p>Second point.</p>'))
      .toBe('First point.\nSecond point.');
  });

  it('does not emit executable markup', () => {
    expect(richTextToPlainText('<img src=x onerror=alert(1)><p>Essay</p><script>alert(2)</script>'))
      .toBe('Essay');
  });
});
