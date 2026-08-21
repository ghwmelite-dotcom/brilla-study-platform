-- Migration 099: exactly-once subscription settlement and provider reconciliation.
ALTER TABLE payment_transactions ADD COLUMN settlement_applied_at TEXT;
ALTER TABLE payment_transactions ADD COLUMN settlement_source TEXT;
ALTER TABLE payment_transactions ADD COLUMN reconciliation_checked_at TEXT;
ALTER TABLE payment_transactions ADD COLUMN affiliate_processed_at TEXT;

ALTER TABLE affiliate_commissions ADD COLUMN effects_applied_at TEXT;
ALTER TABLE payment_webhook_receipts ADD COLUMN transaction_reference TEXT;
ALTER TABLE payment_webhook_receipts ADD COLUMN outcome TEXT;

-- Existing successful payments and commissions already passed through the legacy
-- side-effect path. Backfill them as applied so migration cannot re-credit them.
UPDATE payment_transactions
SET settlement_applied_at = COALESCE(verified_at, created_at),
    settlement_source = 'legacy',
    reconciliation_checked_at = COALESCE(verified_at, created_at),
    affiliate_processed_at = COALESCE(verified_at, created_at)
WHERE status = 'success';

UPDATE affiliate_commissions
SET effects_applied_at = COALESCE(approved_at, created_at)
WHERE transaction_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_affiliate_commissions_transaction_unique
ON affiliate_commissions(transaction_id)
WHERE transaction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payment_transactions_reconcile
ON payment_transactions(status, reconciliation_checked_at, created_at);

CREATE INDEX IF NOT EXISTS idx_payment_webhook_receipts_transaction
ON payment_webhook_receipts(transaction_reference, event_type);
