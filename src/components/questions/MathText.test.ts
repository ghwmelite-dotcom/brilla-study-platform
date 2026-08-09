import { describe, it, expect, vi } from 'vitest';

// The '@/utils' barrel re-exports pdfExtractor, which pulls in pdfjs-dist and
// crashes under the node test environment (DOMMatrix undefined). The fallback
// helper under test does not use the barrel, so stub it out.
vi.mock('@/utils', () => ({
  hasLatex: () => false,
  extractLatex: () => [],
}));

import { formulaFallbackHtml } from './MathText';

describe('formulaFallbackHtml', () => {
  it('escapes the formula so it cannot inject markup', () => {
    const out = formulaFallbackHtml('<img src=x onerror=alert(1)>');
    expect(out).not.toContain('<img');
    expect(out).toBe(
      '<span class="text-red-500">&lt;img src=x onerror=alert(1)&gt;</span>'
    );
  });

  it('escapes attribute-breaking payloads', () => {
    const out = formulaFallbackHtml('"><script>alert(1)</script>');
    expect(out).not.toContain('<script>');
    expect(out).toContain('&quot;&gt;&lt;script&gt;');
  });
});
