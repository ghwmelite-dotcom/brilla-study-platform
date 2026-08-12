import { describe, it, expect } from 'vitest';
import { sign } from 'hono/jwt';
import worker from '../index';
import { createMockD1 } from './helpers/mockD1';

// Regression test for Phase 3 Task 6: quest claim must be atomic. Two
// concurrent/retried claims previously both passed the read-status check and
// awarded XP twice. The conditional UPDATE
// (WHERE id = ? AND user_id = ? AND status = 'completed', gated on
// meta.changes === 0) is now the correctness mechanism; the pre-claim status
// check remains only as a fast path for error messages.
// Growth Loop Task 3: the XP award itself goes through awardPoints, which
// adds a daily-cap read, a race-cycle lookup, and a points_ledger insert on
// top of the same UPDATE users SET xp_points statement.

const JWT_SECRET = 'test-secret-that-is-long-enough';
const STUDENT = { role: 'student', status: 'approved', is_active: 1 };

async function token(payload: object) {
  return sign(
    { ...payload, exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000) },
    JWT_SECRET,
  );
}

describe('quest claim atomicity', () => {
  it('awards XP exactly once across two sequential claims of the same quest', async () => {
    // Stateful mock: the quest row and users.xp_points behave like real D1.
    let questStatus = 'completed';
    let xp = 0;
    const db = createMockD1([
      { match: /FROM users WHERE id/, first: () => STUDENT },
      { match: /FROM user_quests/, first: () => ({
          id: 'uq1', user_id: 'u1', status: questStatus,
          quest_template_id: 'qt1', xp_reward: 100 }) },
      { match: /UPDATE user_quests SET status = 'claimed'/, run: () => {
          if (questStatus !== 'completed') return { success: true, meta: { changes: 0 } };
          questStatus = 'claimed';
          return { success: true, meta: { changes: 1 } };
        } },
      { match: /UPDATE users SET xp_points = xp_points \+/, run: (b) => {
          xp += b[0] as number; return { success: true, meta: { changes: 1 } }; } },
      // awardPoints (quest_claim): daily cap read, cycle lookup, ledger insert.
      // SELECT house FROM users matches the /FROM users WHERE id/ handler above,
      // which returns a row with no `house` key -> no house_points insert.
      { match: /AS today FROM points_ledger/, first: () => ({ today: 0 }) },
      { match: /FROM race_cycles rc/, first: () => null },
      { match: /INSERT INTO points_ledger/, run: () => ({ success: true, meta: { changes: 1 } }) },
      { match: /INSERT INTO quest_completions/, run: () => ({ success: true, meta: { changes: 1 } }) },
    ]);

    const t = await token({ userId: 'u1', role: 'student' });
    const claim = () =>
      worker.fetch(
        new Request('http://x/api/quests/uq1/claim', {
          method: 'POST',
          headers: { Authorization: `Bearer ${t}` },
        }),
        { DB: db, JWT_SECRET },
      );

    // First claim succeeds and awards the XP reward.
    const first = await claim();
    expect(first.status).toBe(200);
    const body = (await first.json()) as { success: boolean; data: Record<string, unknown> };
    expect(body.success).toBe(true);
    expect(body.data.xp).toBe(100);
    // Task 3 contract: coin_reward is display-only, no coins key in the response.
    expect(body.data).not.toHaveProperty('coins');

    // Second claim (retry/double-click/race loser) is rejected.
    const second = await claim();
    expect(second.status).toBe(400);

    // XP was awarded exactly once.
    expect(xp).toBe(100);
  });

  it('rejects a claim when the conditional UPDATE flips nothing (fast path removed scenario)', async () => {
    // The quest is already 'claimed' in the store: even though the fast-path
    // status check fires first, the conditional UPDATE is the mechanism that
    // guarantees no XP award — simulate by starting already claimed.
    let xp = 0;
    const db = createMockD1([
      { match: /FROM users WHERE id/, first: () => STUDENT },
      { match: /FROM user_quests/, first: () => ({
          id: 'uq1', user_id: 'u1', status: 'claimed',
          quest_template_id: 'qt1', xp_reward: 100 }) },
      { match: /UPDATE user_quests SET status = 'claimed'/, run: () =>
          ({ success: true, meta: { changes: 0 } }) },
      { match: /UPDATE users SET xp_points = xp_points \+/, run: (b) => {
          xp += b[0] as number; return { success: true, meta: { changes: 1 } }; } },
      // awardPoints handlers (unused here: the claim is rejected before any
      // award, but the mock throws on unhandled SQL if reached).
      { match: /AS today FROM points_ledger/, first: () => ({ today: 0 }) },
      { match: /FROM race_cycles rc/, first: () => null },
      { match: /INSERT INTO points_ledger/, run: () => ({ success: true, meta: { changes: 1 } }) },
      { match: /INSERT INTO quest_completions/, run: () => ({ success: true, meta: { changes: 1 } }) },
    ]);

    const t = await token({ userId: 'u1', role: 'student' });
    const res = await worker.fetch(
      new Request('http://x/api/quests/uq1/claim', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}` },
      }),
      { DB: db, JWT_SECRET },
    );
    expect(res.status).toBe(400);
    expect(xp).toBe(0);
  });
});
