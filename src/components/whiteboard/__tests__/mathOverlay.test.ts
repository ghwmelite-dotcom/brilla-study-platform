import { describe, it, expect } from 'vitest';
import { validateLatex, renderLatex } from '../mathUtils';

// validateLatex / renderLatex are pure string operations (KaTeX
// renderToString builds HTML without touching the DOM), so the default
// node environment is fine here.
describe('validateLatex', () => {
  it('accepts a well-formed fraction', () => {
    expect(validateLatex('\\frac{3}{4}')).toBe(true);
  });

  it('rejects an unclosed group', () => {
    expect(validateLatex('\\frac{3')).toBe(false);
  });

  it('accepts text-mode formatting', () => {
    expect(validateLatex('\\textbf{x}')).toBe(true);
  });

  it('rejects an unknown command', () => {
    expect(validateLatex('\\notarealcommand{x}')).toBe(false);
  });

  it('rejects a non-string / empty-ish input without throwing', () => {
    expect(validateLatex('')).toBe(true); // KaTeX renders empty input as empty
    expect(validateLatex('\\')).toBe(false);
  });
});

describe('renderLatex', () => {
  it('returns KaTeX markup for valid input', () => {
    const html = renderLatex('\\frac{3}{4}');
    expect(html).toContain('katex');
  });

  it('never throws on invalid input (throwOnError: false)', () => {
    expect(() => renderLatex('\\frac{3')).not.toThrow();
    expect(renderLatex('\\frac{3')).toContain('katex-error');
  });
});
