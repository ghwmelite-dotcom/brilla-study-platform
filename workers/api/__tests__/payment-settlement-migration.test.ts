import Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('migration 099 subscription payment reconciliation', () => {
  it('preserves rows, backfills completed effects, and enforces commission idempotency', () => {
    const db = new Database(':memory:');

    try {
      db.exec(`
        CREATE TABLE payment_transactions (
          id TEXT PRIMARY KEY,
          reference TEXT NOT NULL UNIQUE,
          status TEXT NOT NULL,
          created_at TEXT,
          verified_at TEXT
        );
        CREATE TABLE payment_webhook_receipts (
          id TEXT PRIMARY KEY,
          event_type TEXT NOT NULL,
          event_key TEXT NOT NULL UNIQUE,
          transfer_code TEXT,
          processed_at TEXT
        );
        CREATE TABLE affiliate_commissions (
          id TEXT PRIMARY KEY,
          transaction_id TEXT,
          created_at TEXT,
          approved_at TEXT
        );
        INSERT INTO payment_transactions
          (id, reference, status, created_at, verified_at)
        VALUES
          ('tx_success', 'SUB_SUCCESS', 'success', '2026-08-01 10:00:00', '2026-08-01 10:01:00'),
          ('tx_pending', 'SUB_PENDING', 'pending', '2026-08-01 11:00:00', NULL);
        INSERT INTO affiliate_commissions
          (id, transaction_id, created_at, approved_at)
        VALUES ('commission_1', 'tx_success', '2026-08-01 10:01:00', '2026-08-01 10:02:00');
      `);

      const migration = readFileSync(
        new URL('../../../database/migrations/099_payment_reconciliation.sql', import.meta.url),
        'utf8',
      );
      db.exec(migration);

      expect(db.prepare(`
        SELECT settlement_applied_at, settlement_source, affiliate_processed_at
        FROM payment_transactions WHERE id = 'tx_success'
      `).get()).toEqual({
        settlement_applied_at: '2026-08-01 10:01:00',
        settlement_source: 'legacy',
        affiliate_processed_at: '2026-08-01 10:01:00',
      });

      expect(db.prepare(`
        SELECT settlement_applied_at, reconciliation_checked_at
        FROM payment_transactions WHERE id = 'tx_pending'
      `).get()).toEqual({
        settlement_applied_at: null,
        reconciliation_checked_at: null,
      });

      expect(db.prepare(`
        SELECT effects_applied_at FROM affiliate_commissions WHERE id = 'commission_1'
      `).get()).toEqual({ effects_applied_at: '2026-08-01 10:02:00' });

      expect(() => db.prepare(`
        INSERT INTO affiliate_commissions
          (id, transaction_id, created_at)
        VALUES ('commission_2', 'tx_success', datetime('now'))
      `).run()).toThrow(/UNIQUE/);

      const receiptColumns = db.prepare('PRAGMA table_info(payment_webhook_receipts)').all()
        .map((column) => (column as { name: string }).name);
      expect(receiptColumns).toContain('transaction_reference');
    } finally {
      db.close();
    }
  });
});

