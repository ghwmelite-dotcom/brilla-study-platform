import { describe, expect, it } from 'vitest';
import { applyFailedTransferRefund } from '../payment-webhooks';

interface BoundStatement {
  sql: string;
  binds: unknown[];
  run(): Promise<D1Result>;
}

function createSerializedRefundDb() {
  let payoutStatus = 'processing';
  let refundApplied = false;
  let balance = 0;
  let receipts = 0;
  let lock = Promise.resolve();
  const prepared: Array<{ sql: string; binds: unknown[] }> = [];

  const db = {
    prepare(sql: string) {
      return {
        bind(...binds: unknown[]) {
          prepared.push({ sql, binds });
          return { sql, binds, run: async () => ({ success: true, meta: { changes: 0 } }) };
        },
      };
    },
    batch(statements: BoundStatement[]) {
      const execute = async () => {
        const eligible = payoutStatus === 'processing' && !refundApplied;
        const results: D1Result[] = [];
        for (const statement of statements) {
          if (statement.sql.includes('UPDATE affiliate_profiles')) {
            if (eligible) balance += 100;
            results.push({ success: true, meta: { changes: eligible ? 1 : 0 } } as D1Result);
          } else if (statement.sql.includes('UPDATE affiliate_payouts')) {
            if (eligible) {
              payoutStatus = 'failed';
              refundApplied = true;
            }
            results.push({ success: true, meta: { changes: eligible ? 1 : 0 } } as D1Result);
          } else {
            if (receipts === 0) receipts = 1;
            results.push({ success: true, meta: { changes: receipts === 1 ? 1 : 0 } } as D1Result);
          }
        }
        return results;
      };
      const result = lock.then(execute);
      lock = result.then(() => undefined);
      return result;
    },
  } as unknown as D1Database;

  return {
    db,
    prepared,
    snapshot: () => ({ payoutStatus, refundApplied, balance, receipts }),
  };
}

describe('atomic failed-transfer refund', () => {
  it('credits exactly once under 20 concurrent duplicate deliveries', async () => {
    const state = createSerializedRefundDb();
    const results = await Promise.all(Array.from({ length: 20 }, () =>
      applyFailedTransferRefund(state.db, 'TRF_duplicate', 'Transfer failed')));

    expect(results.filter((result) => result.refunded)).toHaveLength(1);
    expect(state.snapshot()).toEqual({
      payoutStatus: 'failed',
      refundApplied: true,
      balance: 100,
      receipts: 1,
    });
  });

  it('derives the amount and affiliate from the guarded payout row', async () => {
    const state = createSerializedRefundDb();
    await applyFailedTransferRefund(state.db, 'TRF_real', 'Provider rejected transfer');
    const credit = state.prepared.find((statement) => statement.sql.includes('UPDATE affiliate_profiles'))!;
    expect(credit.sql).toMatch(/SELECT ap\.amount/);
    expect(credit.sql).toMatch(/ap\.status = 'processing'/);
    expect(credit.sql).toMatch(/ap\.refund_applied_at IS NULL/);
    expect(credit.binds).toEqual(['TRF_real', 'TRF_real']);
  });
});
