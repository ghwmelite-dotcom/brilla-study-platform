// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { sanitizeRichTextHtml } from '../richText';

describe('sanitizeRichTextHtml', () => {
  it('preserves basic essay formatting', () => {
    expect(sanitizeRichTextHtml('<p>Hello <strong>Brilla</strong></p>'))
      .toBe('<p>Hello <strong>Brilla</strong></p>');
  });

  it('removes executable tags, event handlers and unsafe URLs', () => {
    const result = sanitizeRichTextHtml(
      '<img src=x onerror=alert(1)><p onclick=alert(2)>Safe</p><a href="javascript:alert(3)">link</a><script>alert(4)</script>',
    );
    expect(result).not.toMatch(/img|script|onerror|onclick|javascript:/i);
    expect(result).toContain('<p>Safe</p>');
    expect(result).toContain('<a>link</a>');
  });

  it('hardens allowed external links', () => {
    expect(sanitizeRichTextHtml('<a href="https://example.com/x">source</a>'))
      .toContain('rel="noopener noreferrer"');
  });
});
