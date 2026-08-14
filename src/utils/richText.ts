const ALLOWED_TAGS = new Set([
  'A', 'B', 'BLOCKQUOTE', 'BR', 'DIV', 'EM', 'H1', 'H2', 'H3',
  'I', 'LI', 'OL', 'P', 'STRONG', 'U', 'UL',
]);

const DROP_CONTENT_TAGS = new Set(['IFRAME', 'OBJECT', 'SCRIPT', 'STYLE', 'SVG', 'TEMPLATE']);

function safeHref(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.includes('\\')) {
    return trimmed;
  }
  try {
    const url = new URL(trimmed);
    return ['http:', 'https:', 'mailto:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

/** Sanitize editor HTML before it reaches an innerHTML sink or persisted draft. */
export function sanitizeRichTextHtml(value: unknown): string {
  if (typeof value !== 'string' || value.length === 0) return '';

  const document = new DOMParser().parseFromString(value, 'text/html');
  for (const element of Array.from(document.body.querySelectorAll('*')).reverse()) {
    if (!ALLOWED_TAGS.has(element.tagName)) {
      if (DROP_CONTENT_TAGS.has(element.tagName)) element.remove();
      else element.replaceWith(...Array.from(element.childNodes));
      continue;
    }

    const href = element.tagName === 'A' ? safeHref(element.getAttribute('href') || '') : null;
    for (const attribute of Array.from(element.attributes)) element.removeAttribute(attribute.name);
    if (element.tagName === 'A' && href) {
      element.setAttribute('href', href);
      element.setAttribute('target', '_blank');
      element.setAttribute('rel', 'noopener noreferrer');
    }
  }

  return document.body.innerHTML;
}

const BLOCK_TAGS = new Set(['BLOCKQUOTE', 'DIV', 'H1', 'H2', 'H3', 'LI', 'OL', 'P', 'UL']);

/** Convert sanitized editor markup to the plain text accepted by the API. */
export function richTextToPlainText(value: unknown): string {
  const document = new DOMParser().parseFromString(sanitizeRichTextHtml(value), 'text/html');
  const visit = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent || '';
    if (!(node instanceof Element)) return '';
    if (node.tagName === 'BR') return '\n';
    const content = Array.from(node.childNodes).map(visit).join('');
    return BLOCK_TAGS.has(node.tagName) ? `${content}\n` : content;
  };
  return Array.from(document.body.childNodes)
    .map(visit)
    .join('')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
