export interface FailedTransferRefundResult {
  refunded: boolean;
}

/**
 * Applies a failed-transfer refund as one D1 transaction. The balance update
 * derives both affiliate and amount from the still-processing payout row; no
 * webhook-supplied amount is trusted. Concurrent/replayed batches serialize,
 * and only the first transaction can match the processing/refund-null guard.
 */
export async function applyFailedTransferRefund(
  db: D1Database,
  transferCode: string,
  reason: string,
): Promise<FailedTransferRefundResult> {
  const refundBalance = db.prepare(`
    UPDATE affiliate_profiles
    SET available_earnings = available_earnings + (
      SELECT ap.amount
      FROM affiliate_payouts ap
      WHERE ap.paystack_transfer_code = ?
        AND ap.status = 'processing'
        AND ap.refund_applied_at IS NULL
    )
    WHERE id = (
      SELECT ap.affiliate_id
      FROM affiliate_payouts ap
      WHERE ap.paystack_transfer_code = ?
        AND ap.status = 'processing'
        AND ap.refund_applied_at IS NULL
    )
  `).bind(transferCode, transferCode);

  const finalizePayout = db.prepare(`
    UPDATE affiliate_payouts
    SET status = 'failed',
        failure_reason = ?,
        refund_applied_at = datetime('now'),
        processed_at = datetime('now')
    WHERE paystack_transfer_code = ?
      AND status = 'processing'
      AND refund_applied_at IS NULL
  `).bind(reason, transferCode);

  const recordReceipt = db.prepare(`
    INSERT OR IGNORE INTO payment_webhook_receipts
      (id, event_type, event_key, transfer_code, processed_at)
    VALUES (?, 'transfer.failed', ?, ?, datetime('now'))
  `).bind(
    `wh_${crypto.randomUUID()}`,
    `transfer.failed:${transferCode}`,
    transferCode,
  );

  const results = await db.batch([refundBalance, finalizePayout, recordReceipt]);
  const refundResult = results[0] as D1Result;
  return { refunded: (refundResult.meta?.changes || 0) === 1 };
}
