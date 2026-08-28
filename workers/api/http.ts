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

export type BoundedJsonBodyResult =
  | { ok: true; body: Record<string, unknown> }
  | { ok: false; reason: 'invalid_json' | 'too_large' };

/**
 * Read a JSON object without buffering more than maxBytes. Content-Length is
 * only an early rejection hint; the streamed byte count is authoritative so a
 * missing or forged header cannot bypass the limit.
 */
export async function parseBoundedJsonBody(
  c: Context,
  maxBytes: number,
): Promise<BoundedJsonBodyResult> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) {
    throw new Error('maxBytes must be a positive safe integer');
  }

  const declaredLengthHeader = c.req.header('content-length');
  if (declaredLengthHeader && /^\d+$/.test(declaredLengthHeader)) {
    const declaredLength = Number(declaredLengthHeader);
    if (Number.isSafeInteger(declaredLength) && declaredLength > maxBytes) {
      return { ok: false, reason: 'too_large' };
    }
  }

  const stream = c.req.raw.body;
  if (!stream) return { ok: false, reason: 'invalid_json' };

  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      await reader.cancel().catch(() => undefined);
      return { ok: false, reason: 'too_large' };
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { ok: false, reason: 'invalid_json' };
    }
    return { ok: true, body: parsed as Record<string, unknown> };
  } catch {
    return { ok: false, reason: 'invalid_json' };
  }
}
