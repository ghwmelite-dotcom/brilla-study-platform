import { describe, it, expect, vi } from 'vitest';
import worker from '../index';

// The unauthenticated public read endpoints (leaderboard, papers, houses,
// subjects, exam-types, /flashcards/public) previously had no rate limiting
// at all. They now share a per-IP D1-backed 'public-read' bucket
// (300 req/min). The mock simulates the rate_limits rolling-window counter
// semantics of checkRateLimit's atomic INSERT ... WHERE total < max ...
// RETURNING: a row while under the limit, null (blocked) once reached.

const JWT_SECRET = 'test-secret-that-is-long-enough';

function makeDb() {
  const totals = new Map<string, number>();
  const rateLimitFirst = (binds: unknown[]) => {
    const max = binds[6] as number;
    const key = `${binds[0]}|${binds[1]}`;
    const total = totals.get(key) ?? 0;
    if (total >= max) return Promise.resolve(null);
    totals.set(key, total + 1);
    return Promise.resolve({ request_count: 1, total_requests: total + 1 });
  };
  const makeStatement = (sql: string, binds: unknown[]) => ({
    first: vi.fn().mockImplementation(() =>
      sql.includes('WITH usage(total_requests)') ? rateLimitFirst(binds) : Promise.resolve(null),
    ),
    all: vi.fn().mockResolvedValue({ results: [] }),
    run: vi.fn().mockResolvedValue({ success: true }),
  });
  const db = {
    prepare: vi.fn((sql: string) => ({
      ...makeStatement(sql, []),
      bind: (...binds: unknown[]) => makeStatement(sql, binds),
    })),
  } as unknown as D1Database;
  return db;
}

const IP_A = { 'CF-Connecting-IP': '9.9.9.1' };
const IP_B = { 'CF-Connecting-IP': '9.9.9.2' };

describe('public read endpoint rate limiting', () => {
  it('GET /api/leaderboard allows 300 requests per IP per minute, then 429', async () => {
    const db = makeDb();
    for (let i = 0; i < 300; i++) {
      const res = await worker.fetch(new Request('http://x/api/leaderboard', { headers: IP_A }), {
        DB: db,
        JWT_SECRET,
      });
      expect(res.status).toBe(200);
    }
    const res = await worker.fetch(new Request('http://x/api/leaderboard', { headers: IP_A }), {
      DB: db,
      JWT_SECRET,
    });
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).not.toBeNull();
    expect(await res.json()).toMatchObject({ success: false, code: 'RATE_LIMITED' });
  });

  it('shares the per-IP bucket across public read paths', async () => {
    const db = makeDb();
    for (let i = 0; i < 300; i++) {
      await worker.fetch(new Request('http://x/api/subjects', { headers: IP_A }), {
        DB: db,
        JWT_SECRET,
      });
    }
    // Same IP, different public read path: already over the shared budget.
    const res = await worker.fetch(new Request('http://x/api/houses', { headers: IP_A }), {
      DB: db,
      JWT_SECRET,
    });
    expect(res.status).toBe(429);
    // The bare /papers list (exact-pattern registration) is throttled too.
    const papers = await worker.fetch(new Request('http://x/api/papers', { headers: IP_A }), {
      DB: db,
      JWT_SECRET,
    });
    expect(papers.status).toBe(429);
    // A different IP still has its own budget.
    const other = await worker.fetch(new Request('http://x/api/houses', { headers: IP_B }), {
      DB: db,
      JWT_SECRET,
    });
    expect(other.status).toBe(200);
  });
});
