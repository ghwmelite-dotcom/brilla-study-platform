-- Migration 096: idempotent Paystack transfer.failed processing.
ALTER TABLE affiliate_payouts ADD COLUMN refund_applied_at TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_affiliate_payouts_transfer_code
ON affiliate_payouts(paystack_transfer_code)
WHERE paystack_transfer_code IS NOT NULL;

CREATE TABLE IF NOT EXISTS payment_webhook_receipts (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  event_key TEXT NOT NULL UNIQUE,
  transfer_code TEXT,
  processed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_payment_webhook_receipts_transfer
ON payment_webhook_receipts(transfer_code, event_type);
