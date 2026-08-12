import { describe, it, expect } from 'vitest';
import { createMockD1 } from './mockD1';

describe('createMockD1', () => {
  it('routes prepare/bind to the matching handler among multiple handlers (incl. the auth lookup)', async () => {
    const db = createMockD1([
      // requireAuth per-request users lookup (Phase 1 auth unification):
      // 'SELECT role, status, is_active FROM users WHERE id = ?'
      {
        match: /role, status, is_active FROM users/,
        first: (binds) => ({ role: 'student', status: 'approved', is_active: 1, id: binds[0] }),
      },
      // A route query that must NOT be swallowed by the auth handler above.
      // (Matches both the SELECT and the status-guarded claim UPDATE.)
      {
        match: /payment_transactions/,
        first: () => ({ id: 'tx_1', status: 'pending' }),
        run: () => ({ success: true, meta: { changes: 0 } }), // race loser: claim matched 0 rows
      },
    ]);

    const user = await db
      .prepare('SELECT role, status, is_active FROM users WHERE id = ?')
      .bind('user_1')
      .first();
    expect(user).toEqual({ role: 'student', status: 'approved', is_active: 1, id: 'user_1' });

    const tx = await db
      .prepare('SELECT * FROM payment_transactions WHERE reference = ?')
      .bind('SUB_ref_1')
      .first();
    expect(tx).toEqual({ id: 'tx_1', status: 'pending' });

    const claim = await db
      .prepare("UPDATE payment_transactions SET status = 'success' WHERE id = ? AND status != 'success'")
      .bind('tx_1')
      .run();
    expect(claim.meta.changes).toBe(0);

    // Every executed statement was recorded with its binds.
    expect(db.calls).toHaveLength(3);
    expect(db.calls[0]).toEqual({
      sql: 'SELECT role, status, is_active FROM users WHERE id = ?',
      binds: ['user_1'],
    });
  });

  it('batch([a, b]) runs both statements and returns both results in order', async () => {
    const db = createMockD1([
      { match: /UPDATE a/, run: () => ({ success: true, meta: { changes: 1 } }) },
      { match: /UPDATE b/, run: () => ({ success: true, meta: { changes: 3 } }) },
    ]);

    const a = db.prepare('UPDATE a SET x = ?').bind(1);
    const b = db.prepare('UPDATE b SET y = ?').bind(2);
    const results = await db.batch([a, b]);

    expect(results).toEqual([
      { success: true, meta: { changes: 1 } },
      { success: true, meta: { changes: 3 } },
    ]);
    expect(db.calls).toHaveLength(2);
  });

  it('throws on unmatched SQL', () => {
    const db = createMockD1([{ match: /FROM users/, first: () => null }]);
    expect(() => db.prepare('DELETE FROM sessions').bind()).toThrow(/no handler for SQL/);
  });
});
