import type { Context } from 'hono';

/** Parse a ?limit query param, clamped to [1, max]. */
export function parseLimit(c: Context, fallback = 20, max = 100): number {
  const raw = parseInt(c.req.query('limit') || String(fallback), 10);
  if (!Number.isFinite(raw) || raw < 1) return fallback;
  return Math.min(raw, max);
}

/**
 * Parse a JSON request body without throwing. Returns null on malformed JSON
 * so callers can answer 400 instead of letting a SyntaxError escape to the
 * global onError as a 500. Lives here (not index.ts) because index.ts mounts
 * oauthApp — importing it from index would create a module cycle.
 */
export async function parseJsonBody(c: Context): Promise<Record<string, any> | null> {
  try {
    return await c.req.json();
  } catch {
    return null;
  }
}

