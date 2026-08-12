import { describe, it, expect } from 'vitest';

// NOTE: mounting protectedApp from index.ts requires the Phase 0/1 harness.
// This test targets the rate-limit primitive directly; the endpoint wiring
// is verified by the compile + manual smoke step (5.6).
import { checkRateLimit, RATE_LIMITS, DAILY_AI_CALL_LIMIT } from '../rate-limit';

function createCountingDb() {
  const calls: { identifier: string; endpoint: string }[] = [];
  const db = {
    prepare(sql: string) {
      const normalized = sql.trim();
      return {
        bind(...params: unknown[]) {
          const [identifier, endpoint] = params as [string, string, ...unknown[]];
          if (normalized.startsWith('SELECT SUM')) {
            const total = calls.filter(
              (c) => c.identifier === identifier && c.endpoint === endpoint,
            ).length;
            return {
              first: async () => ({ total_requests: total, last_request: null }),
              all: async () => ({ results: [] }),
              run: async () => ({ meta: { changes: 1 } }),
            };
          }
          if (normalized.startsWith('SELECT id, request_count')) {
            return { first: async () => null, all: async () => ({ results: [] }), run: async () => ({ meta: { changes: 1 } }) };
          }
          if (normalized.startsWith('INSERT')) {
            calls.push({ identifier, endpoint });
          }
          return { first: async () => null, all: async () => ({ results: [] }), run: async () => ({ meta: { changes: 1 } }) };
        },
      };
    },
  } as unknown as D1Database;
  return { db, calls };
}

describe('AI daily quota', () => {
  it('allows up to DAILY_AI_CALL_LIMIT calls then blocks the next one', async () => {
    expect(DAILY_AI_CALL_LIMIT).toBe(50);
    expect(RATE_LIMITS['ai'].maxRequests).toBe(DAILY_AI_CALL_LIMIT);

    const { db } = createCountingDb();
    for (let i = 0; i < DAILY_AI_CALL_LIMIT; i++) {
      const r = await checkRateLimit(db, 'user_1', 'ai');
      expect(r.allowed).toBe(true);
    }
    const blocked = await checkRateLimit(db, 'user_1', 'ai');
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });

  it('caps are per-user, not global', async () => {
    const { db } = createCountingDb();
    for (let i = 0; i < DAILY_AI_CALL_LIMIT; i++) {
      await checkRateLimit(db, 'user_1', 'ai');
    }
    const other = await checkRateLimit(db, 'user_2', 'ai');
    expect(other.allowed).toBe(true);
  });
});
