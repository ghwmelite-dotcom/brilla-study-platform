import type { Context } from 'hono';

/** Parse a ?limit query param, clamped to [1, max]. */
export function parseLimit(c: Context, fallback = 20, max = 100): number {
  const raw = parseInt(c.req.query('limit') || String(fallback), 10);
  if (!Number.isFinite(raw) || raw < 1) return fallback;
  return Math.min(raw, max);
}
