import { describe, it, expect, vi } from 'vitest';

// Stub the '@/utils' barrel so the helper under test stays isolated from it.
// (The barrel no longer re-exports pdfExtractor — that eager pdfjs-dist chain
// was removed — so the stub is now just lightweight isolation.)
vi.mock('@/utils', () => ({
  hasLatex: () => false,
  extractLatex: () => [],
}));

import { formulaFallbackHtml } from '@/utils/formulaFallback';

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
