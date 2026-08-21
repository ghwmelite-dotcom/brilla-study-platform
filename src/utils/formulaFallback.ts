import { escapeHtml } from './html';

// The formula is escaped before interpolation so a malformed or
// handler-bearing formula can never inject markup.
export function formulaFallbackHtml(formula: string): string {
  return '<span class="text-red-500">' + escapeHtml(formula) + '</span>';
}
