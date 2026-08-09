// HTML escaping + safe inline "markdown" for chat messages.
// Escape FIRST, then apply formatting regexes on the escaped text so
// user-supplied HTML can never reach dangerouslySetInnerHTML.

const ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (ch) => ESCAPE_MAP[ch]);
}

/**
 * Escape a line of message text, then apply the supported inline
 * formatting (**bold**, `code`). The returned string is safe to inject
 * because every character that could open a tag/attribute was escaped
 * before any tag we generate was introduced.
 */
export function formatInline(line: string): string {
  let formatted = escapeHtml(line);
  formatted = formatted.replace(
    /\*\*(.*?)\*\*/g,
    '<strong class="font-semibold">$1</strong>'
  );
  formatted = formatted.replace(
    /`(.*?)`/g,
    '<code class="bg-neutral-200/50 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>'
  );
  return formatted;
}
