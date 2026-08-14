function hasControlOrBackslash(value: string): boolean {
  return value.includes('\\') || Array.from(value).some((character) => {
    const code = character.charCodeAt(0);
    return code <= 31 || code === 127;
  });
}

/**
 * Accept only same-origin application paths from database or API data.
 * Reject protocol-relative URLs, schemes, backslashes and control characters.
 */
export function toSafeInternalPath(value: unknown, fallback = '/'): string {
  if (typeof value !== 'string') return fallback;
  const candidate = value.trim();
  if (!candidate.startsWith('/') || candidate.startsWith('//') || hasControlOrBackslash(candidate)) {
    return fallback;
  }

  try {
    const base = new URL('https://brillaprep.org');
    const parsed = new URL(candidate, base);
    if (parsed.origin !== base.origin) return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
