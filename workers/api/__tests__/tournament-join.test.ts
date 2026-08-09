import { describe, it, expect } from 'vitest';
import { sign } from 'hono/jwt';
import worker from '../index';
import { createMockD1, type MockD1 } from './helpers/mockD1';

// Phase 3 Task 7: tournament join must close the capacity/fee TOCTOU. The
// fee debit is a conditional UPDATE (WHERE xp_points >= fee) and the join is
// a conditional INSERT...SELECT enforcing uniqueness AND capacity in one
// statement; each SQLite statement executes atomically, so concurrent joins
// cannot double-join or exceed max_participants, and a failed insert refunds
// the debit.

const JWT_SECRET = 'test-secret-that-is-long-enough';
const STUDENT = { role: 'student', status: 'approved', is_active: 1 };

async function token(payload: object) {
  return sign(
    { ...payload, exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000) },
    JWT_SECRET,
  );
}

interface MockState {
  db: MockD1;
  participants: string[];
  balance: () => number;
  inserts: () => number;
}

// Stateful mock: `participants` and the user's xp balance behave like real
// D1 rows. The INSERT...SELECT handler mirrors in JS the NOT EXISTS + COUNT
// semantics of the SQL — it models the per-statement atomicity the DB
// provides in production. The fast-path "already joined" SELECT deliberately
// always misses, as it would for the race the conditional INSERT guards.
function makeDb(opts: { xp: number; maxParticipants: number | null; entryFee: number }): MockState {
  const participants: string[] = [];
  let xp = opts.xp;
  let inserts = 0;
  const tournament = {
    id: 't1',
    status: 'active',
    max_participants: opts.maxParticipants,
    entry_fee: opts.entryFee,
  };

  const db = createMockD1([
    // requireAuth user lookup
    { match: /role, status, is_active FROM users/, first: () => STUDENT },
    { match: /SELECT \* FROM tournaments/, first: () => tournament },
    // Fast-path membership check: always misses (models the race; the
    // conditional INSERT is the real guard).
    { match: /SELECT id FROM tournament_participants/, first: () => null },
    // Conditional fee debit: UPDATE ... WHERE id = ? AND xp_points >= ?
    { match: /UPDATE users SET xp_points = xp_points -/, run: (b) => {
        const fee = b[0] as number;
        if (xp < fee) return { success: true, meta: { changes: 0 } };
        xp -= fee;
        return { success: true, meta: { changes: 1 } };
      } },
    // Refund: UPDATE users SET xp_points = xp_points + ?
    { match: /UPDATE users SET xp_points = xp_points \+/, run: (b) => {
        xp += b[0] as number;
        return { success: true, meta: { changes: 1 } };
      } },
    // Conditional INSERT...SELECT: NOT EXISTS (duplicate) AND COUNT < max.
    { match: /INSERT INTO tournament_participants/, run: (b) => {
        const userId = b[2] as string;
        const max = b[6] as number;
        if (participants.includes(userId)) return { success: true, meta: { changes: 0 } };
        if (participants.length >= max) return { success: true, meta: { changes: 0 } };
        participants.push(userId);
        inserts += 1;
        return { success: true, meta: { changes: 1 } };
      } },
  ]);

  return { db, participants, balance: () => xp, inserts: () => inserts };
}

async function join(t: string, db: MockD1) {
  return worker.fetch(
    new Request('http://x/api/events/tournaments/t1/join', {
      method: 'POST',
      headers: { Authorization: `Bearer ${t}` },
    }),
    { DB: db, JWT_SECRET },
  );
}

describe('tournament join atomicity', () => {
  it('rejects a duplicate join, refunding the entry fee exactly once', async () => {
    const { db, participants, balance } = makeDb({ xp: 500, maxParticipants: 10, entryFee: 100 });
    const t = await token({ userId: 'u1', role: 'student' });

    const first = await join(t, db);
    expect(first.status).toBe(200);
    expect(participants).toEqual(['u1']);
    expect(balance()).toBe(400);

    // Second join: fast-path read misses (race), conditional INSERT flips
    // nothing, fee is refunded.
    const second = await join(t, db);
    expect(second.status).toBe(400);
    const body = (await second.json()) as { success: boolean; error: string };
    expect(body.success).toBe(false);
    expect(body.error).toBe('Tournament is full or already joined');

    expect(participants).toEqual(['u1']);
    expect(balance()).toBe(400); // debited once, refunded once
  });

  it('rejects joins beyond max_participants with a refund, never overfilling', async () => {
    const { db, participants, balance, inserts } = makeDb({ xp: 1000, maxParticipants: 2, entryFee: 50 });
    const joinAs = async (userId: string) => join(await token({ userId, role: 'student' }), db);

    expect((await joinAs('u1')).status).toBe(200);
    expect((await joinAs('u2')).status).toBe(200);
    expect(participants).toEqual(['u1', 'u2']);

    // Tournament full: conditional INSERT flips nothing, fee refunded.
    const third = await joinAs('u3');
    expect(third.status).toBe(400);
    const body = (await third.json()) as { success: boolean; error: string };
    expect(body.error).toBe('Tournament is full or already joined');

    expect(participants).toEqual(['u1', 'u2']);
    expect(inserts()).toBeLessThanOrEqual(2);
    // All three users were debited from the shared mock balance path; u3 was refunded.
    expect(balance()).toBe(1000 - 50 - 50 - 50 + 50);
  });

  it('rejects join when balance is insufficient without touching participants', async () => {
    const { db, participants, balance } = makeDb({ xp: 30, maxParticipants: 10, entryFee: 100 });
    const t = await token({ userId: 'u1', role: 'student' });

    const res = await join(t, db);
    expect(res.status).toBe(400);
    const body = (await res.json()) as { success: boolean; error: string };
    expect(body.error).toBe('Not enough XP for entry fee');

    expect(participants).toEqual([]);
    expect(balance()).toBe(30);
  });
});
