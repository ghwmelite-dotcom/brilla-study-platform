import { describe, expect, it } from 'vitest';
import { sign } from 'hono/jwt';
import worker from '../index';

interface QueryCall {
  sql: string;
  args: unknown[];
}

const JWT_SECRET = 'test-secret-that-is-long-enough';
const PENDING_USER = {
  id: 'user_pending',
  email: 'pending@example.com',
  name: 'Pending Student',
  role: 'student',
  status: 'pending',
  referred_by: 'ABC123XY',
  selected_tier_id: null,
};

function createDb(options: { approvalChanges?: number; existingAward?: boolean } = {}) {
  const calls: QueryCall[] = [];
  const approvalChanges = options.approvalChanges ?? 1;

  const db = {
    prepare(sql: string) {
      return {
        bind(...args: unknown[]) {
          calls.push({ sql, args });
          return {
            first: async () => {
              if (sql.includes('role, status, is_active, session_version FROM users')) {
                return { role: 'admin', status: 'approved', is_active: 1 };
              }
              if (sql.includes("SELECT * FROM users WHERE id = ? AND status = 'pending'")) {
                return PENDING_USER;
              }
              if (sql.includes('FROM affiliate_referrals ar')) {
                return { id: 'ref_1', affiliate_user_id: 'user_referrer' };
              }
              if (sql.includes('FROM points_ledger')) {
                return options.existingAward ? { id: 'pl_existing' } : null;
              }
              return null;
            },
            all: async () => ({ results: [] }),
            run: async () => ({
              success: true,
              meta: {
                changes: sql.includes("WHERE id = ? AND status = 'pending'")
                  ? approvalChanges
                  : 1,
              },
            }),
          };
        },
        first: async () => null,
        all: async () => ({ results: [] }),
        run: async () => ({ success: true, meta: { changes: 1 } }),
      };
    },
  } as unknown as D1Database;

  return { db, calls };
}

async function approvalRequest(db: D1Database) {
  const token = await sign(
    {
      userId: 'admin_1',
      email: 'admin@example.com',
      role: 'admin',
      exp: Math.floor(Date.now() / 1000) + 3600,
    },
    JWT_SECRET,
  );

  return worker.fetch(
    new Request('http://x/api/admin/users/user_pending/approve', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),
    { DB: db, JWT_SECRET },
  );
}

describe('admin registration approval referral boundary', () => {
  it('awards referral signup points only after winning the pending-to-approved transition', async () => {
    const { db, calls } = createDb();
    const response = await approvalRequest(db);

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true });
    expect(calls.some((call) =>
      call.sql.includes("WHERE id = ? AND status = 'pending'"),
    )).toBe(true);

    const ledgerWrites = calls.filter((call) => call.sql.includes('INSERT INTO points_ledger'));
    expect(ledgerWrites).toHaveLength(1);
    expect(ledgerWrites[0].args[1]).toBe('user_referrer');
    expect(ledgerWrites[0].args[2]).toBe(100);
    expect(ledgerWrites[0].args[3]).toBe('referral_signup');
    expect(ledgerWrites[0].args[4]).toBe('user_pending');
  });

  it('does not run referral or trial side effects when another request already approved the user', async () => {
    const { db, calls } = createDb({ approvalChanges: 0 });
    const response = await approvalRequest(db);

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      success: false,
      error: 'User is no longer pending approval',
    });
    expect(calls.some((call) => call.sql.includes('INSERT INTO points_ledger'))).toBe(false);
  });

  it('does not duplicate a referral reward already recorded for the referred user', async () => {
    const { db, calls } = createDb({ existingAward: true });
    const response = await approvalRequest(db);

    expect(response.status).toBe(200);
    expect(calls.some((call) => call.sql.includes('INSERT INTO points_ledger'))).toBe(false);
    expect(calls.some((call) =>
      call.sql.includes('UPDATE users SET xp_points'),
    )).toBe(false);
  });
});
