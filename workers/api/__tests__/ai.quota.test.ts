import { describe, expect, it } from "vitest";

// NOTE: mounting protectedApp from index.ts requires the Phase 0/1 harness.
// This test targets the rate-limit primitive directly; the endpoint wiring
// is verified by the compile + manual smoke step (5.6).
import {
  checkRateLimit,
  DAILY_AI_CALL_LIMIT,
  RATE_LIMITS,
} from "../rate-limit";

function createCountingDb() {
  const calls: { identifier: string; endpoint: string }[] = [];
  const db = {
    prepare() {
      return {
        bind(...params: unknown[]) {
          const [identifier, endpoint] = params as [
            string,
            string,
            ...unknown[],
          ];
          const maxRequests = Number(params[6]);
          return {
            first: async () => {
              const total = calls.filter(
                (call) =>
                  call.identifier === identifier && call.endpoint === endpoint,
              ).length;
              if (total >= maxRequests) return null;
              calls.push({ identifier, endpoint });
              return { request_count: total + 1, total_requests: total + 1 };
            },
          };
        },
      };
    },
  } as unknown as D1Database;
  return { db, calls };
}

describe("AI daily quota", () => {
  it("allows up to DAILY_AI_CALL_LIMIT calls then blocks the next one", async () => {
    expect(DAILY_AI_CALL_LIMIT).toBe(50);
    expect(RATE_LIMITS["ai"].maxRequests).toBe(DAILY_AI_CALL_LIMIT);

    const { db } = createCountingDb();
    for (let i = 0; i < DAILY_AI_CALL_LIMIT; i++) {
      const result = await checkRateLimit(db, "user_1", "ai");
      expect(result.allowed).toBe(true);
    }
    const blocked = await checkRateLimit(db, "user_1", "ai");
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });

  it("caps are per-user, not global", async () => {
    const { db } = createCountingDb();
    for (let i = 0; i < DAILY_AI_CALL_LIMIT; i++) {
      await checkRateLimit(db, "user_1", "ai");
    }
    const other = await checkRateLimit(db, "user_2", "ai");
    expect(other.allowed).toBe(true);
  });
});
