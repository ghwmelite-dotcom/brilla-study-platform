import katex from 'katex';

// KaTeX helpers for whiteboard `math` commands. Both functions NEVER throw —
// the whiteboard must degrade gracefully on whatever LaTeX the AI emits.

/**
 * True when KaTeX can parse `latex` (strict mode). Used to decide between the
 * HTML overlay renderer and the plain fabric.Text fallback.
 */
export function validateLatex(latex: string): boolean {
  try {
    katex.renderToString(latex, { throwOnError: true });
    return true;
  } catch {
    return false;
  }
}

/**
 * Render LaTeX to an HTML string. throwOnError is false so even invalid input
 * yields KaTeX's red error markup instead of an exception; callers that want
 * the plain-text fallback should gate on validateLatex first.
 */
export function renderLatex(latex: string): string {
  return katex.renderToString(latex, { throwOnError: false });
}
