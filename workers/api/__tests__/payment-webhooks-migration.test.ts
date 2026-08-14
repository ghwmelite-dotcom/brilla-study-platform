import { readFileSync } from 'node:fs';
import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';

describe('migration 096 failed-transfer refund invariants', () => {
  it('preserves payouts and enforces one transfer code and one webhook receipt', () => {
    const db = new Database(':memory:');
    try {
      db.exec(`
        CREATE TABLE affiliate_payouts (
          id TEXT PRIMARY KEY,
          affiliate_id TEXT NOT NULL,
          amount REAL NOT NULL,
          status TEXT,
          paystack_transfer_code TEXT,
          failure_reason TEXT,
          processed_at TEXT
        );
        INSERT INTO affiliate_payouts
          (id, affiliate_id, amount, status, paystack_transfer_code)
        VALUES ('payout_1', 'affiliate_1', 100, 'processing', 'TRF_one');
      `);
      const migration = readFileSync(
        new URL('../../../database/migrations/096_atomic_failed_transfer_refunds.sql', import.meta.url),
        'utf8',
      );
      db.exec(migration);

      expect(db.prepare('SELECT id, refund_applied_at FROM affiliate_payouts').get())
        .toEqual({ id: 'payout_1', refund_applied_at: null });
      expect(() => db.prepare(`
        INSERT INTO affiliate_payouts
          (id, affiliate_id, amount, status, paystack_transfer_code)
        VALUES ('payout_2', 'affiliate_2', 50, 'processing', 'TRF_one')
      `).run()).toThrow();

      db.prepare(`
        INSERT INTO payment_webhook_receipts (id, event_type, event_key, transfer_code)
        VALUES ('receipt_1', 'transfer.failed', 'transfer.failed:TRF_one', 'TRF_one')
      `).run();
      expect(() => db.prepare(`
        INSERT INTO payment_webhook_receipts (id, event_type, event_key, transfer_code)
        VALUES ('receipt_2', 'transfer.failed', 'transfer.failed:TRF_one', 'TRF_one')
      `).run()).toThrow();
    } finally {
      db.close();
    }
  });
});
