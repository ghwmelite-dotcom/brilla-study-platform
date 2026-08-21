const PAYSTACK_API = 'https://api.paystack.co';
const DEFAULT_RECONCILIATION_LIMIT = 25;
const MAX_RECONCILIATION_LIMIT = 50;
const TERMINAL_FAILURE_STATUSES = new Set([
  'abandoned',
  'cancelled',
  'failed',
  'reversed',
]);


export type SettlementSource = 'callback' | 'webhook' | 'reconciliation';

export interface ProviderTransaction {
  reference?: unknown;
  status?: unknown;
  amount?: unknown;
  currency?: unknown;
  [key: string]: unknown;
}

export interface SanitizedProviderTransaction {
  reference: string | null;
  status: string | null;
  amount: number | null;
  currency: string | null;
}

export interface SettledPaymentContext {
  transactionId: string;
  userId: string;
  referralCode: string | null;
  amountGhs: number;
  reference: string;
}

export type SettlementOutcome =
  | 'applied'
  | 'already_applied'
  | 'mismatch'
  | 'not_found'
  | 'not_success'
  | 'refunded';

export interface SettlementResult {
  outcome: SettlementOutcome;
  context?: SettledPaymentContext;
  planId?: string;
  expiresAt?: string;
}

export interface ReconciliationResult {
  checked: number;
  settled: number;
  failed: number;
  stillPending: number;
  providerErrors: number;
  affiliateRepairs: number;
}

interface PaymentSettlementRow {
  id: string;
  user_id: string;
  reference: string;
  amount: number;
  currency: string;
  plan_id: string;
  billing_cycle: 'monthly' | 'yearly';
  status: string;
  settlement_applied_at: string | null;
  affiliate_processed_at: string | null;
  ai_grading_quota: number;
  referred_by: string | null;
}

interface PaystackVerificationResult {
  ok: boolean;
  data?: ProviderTransaction;
}

export type SettlementFollowUp = (context: SettledPaymentContext) => Promise<boolean>;

function asTrimmedString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

export function sanitizeProviderTransaction(
  transaction: ProviderTransaction,
): SanitizedProviderTransaction {
  const amount = typeof transaction.amount === 'number' && Number.isFinite(transaction.amount)
    ? transaction.amount
    : null;

  return {
    reference: asTrimmedString(transaction.reference),
    status: asTrimmedString(transaction.status)?.toLowerCase() ?? null,
    amount,
    currency: asTrimmedString(transaction.currency)?.toUpperCase() ?? null,
  };
}

function serializeProviderSummary(transaction: ProviderTransaction): string {
  return JSON.stringify(sanitizeProviderTransaction(transaction));
}

export async function verifyPaystackTransaction(
  secretKey: string,
  reference: string,
  fetchImpl: typeof fetch = fetch,
): Promise<PaystackVerificationResult> {
  if (!secretKey || !reference || reference.length > 200) {
    return { ok: false };
  }

  try {
    const response = await fetchImpl(
      `${PAYSTACK_API}/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${secretKey}` },
      },
    );

    if (!response.ok) return { ok: false };

    const payload = await response.json() as { status?: unknown; data?: unknown };
    if (payload.status !== true || !payload.data || typeof payload.data !== 'object') {
      return { ok: false };
    }

    return { ok: true, data: payload.data as ProviderTransaction };
  } catch {
    return { ok: false };
  }
}

function paymentContext(row: PaymentSettlementRow): SettledPaymentContext {
  return {
    transactionId: row.id,
    userId: row.user_id,
    referralCode: row.referred_by,
    amountGhs: row.amount,
    reference: row.reference,
  };
}

function calculateExpiry(billingCycle: 'monthly' | 'yearly'): string {
  const expiry = new Date();
  if (billingCycle === 'yearly') expiry.setFullYear(expiry.getFullYear() + 1);
  else expiry.setMonth(expiry.getMonth() + 1);
  return expiry.toISOString();
}

async function recordChargeReceipt(
  db: D1Database,
  reference: string,
  outcome: string,
): Promise<void> {
  await db.prepare(`
    INSERT OR IGNORE INTO payment_webhook_receipts
      (id, event_type, event_key, transaction_reference, outcome, processed_at)
    VALUES (?, 'charge.success', ?, ?, ?, datetime('now'))
  `).bind(
    `wh_${crypto.randomUUID()}`,
    `charge.success:${reference}`,
    reference,
    outcome,
  ).run();
}

export async function settleVerifiedSubscriptionPayment(
  db: D1Database,
  providerTransaction: ProviderTransaction,
  source: SettlementSource,
): Promise<SettlementResult> {
  const provider = sanitizeProviderTransaction(providerTransaction);
  if (provider.status !== 'success') return { outcome: 'not_success' };
  if (!provider.reference) return { outcome: 'not_found' };

  const row = await db.prepare(`
    SELECT
      pt.id, pt.user_id, pt.reference, pt.amount, pt.currency, pt.plan_id,
      pt.billing_cycle, pt.status, pt.settlement_applied_at,
      pt.affiliate_processed_at, st.ai_grading_quota, u.referred_by
    FROM payment_transactions pt
    JOIN users u ON u.id = pt.user_id
    JOIN subscription_tiers st ON st.id = pt.plan_id
    WHERE pt.reference = ?
  `).bind(provider.reference).first<PaymentSettlementRow>();

  if (!row) {
    if (source === 'webhook') await recordChargeReceipt(db, provider.reference, 'not_found');
    return { outcome: 'not_found' };
  }

  const context = paymentContext(row);
  if (row.status === 'refunded') {
    if (source === 'webhook') await recordChargeReceipt(db, row.reference, 'refunded');
    return { outcome: 'refunded', context };
  }

  const paidAmountGhs = provider.amount === null ? Number.NaN : provider.amount / 100;
  const amountMatches = Number.isFinite(paidAmountGhs)
    && Math.abs(paidAmountGhs - row.amount) < 0.01;
  const currencyMatches = provider.currency === row.currency.toUpperCase();
  const referenceMatches = provider.reference === row.reference;

  if (!amountMatches || !currencyMatches || !referenceMatches) {
    await db.prepare(`
      UPDATE payment_transactions
      SET status = 'failed', paystack_response = ?, reconciliation_checked_at = datetime('now')
      WHERE reference = ?
        AND settlement_applied_at IS NULL
        AND status NOT IN ('success', 'refunded')
    `).bind(serializeProviderSummary(providerTransaction), row.reference).run();
    if (source === 'webhook') await recordChargeReceipt(db, row.reference, 'mismatch');
    return { outcome: 'mismatch', context };
  }

  if (row.settlement_applied_at || row.status === 'success') {
    if (source === 'webhook') await recordChargeReceipt(db, row.reference, 'already_applied');
    return { outcome: 'already_applied', context, planId: row.plan_id };
  }

  const expiresAt = calculateExpiry(row.billing_cycle);
  const guard = `
    EXISTS (
      SELECT 1 FROM payment_transactions guard_tx
      WHERE guard_tx.reference = ?
        AND guard_tx.settlement_applied_at IS NULL
        AND guard_tx.status NOT IN ('success', 'refunded')
    )
  `;

  const statements: D1PreparedStatement[] = [
    db.prepare(`
      UPDATE users
      SET subscription_tier_id = ?,
          subscription_expires_at = ?,
          ai_grading_credits = CASE
            WHEN ? = -1 THEN -1
            ELSE COALESCE(ai_grading_credits, 0) + ?
          END
      WHERE id = ? AND ${guard}
    `).bind(
      row.plan_id,
      expiresAt,
      row.ai_grading_quota,
      row.ai_grading_quota,
      row.user_id,
      row.reference,
    ),
    db.prepare(`
      UPDATE user_trials
      SET status = 'converted', converted_at = datetime('now')
      WHERE user_id = ? AND status = 'active' AND ${guard}
    `).bind(row.user_id, row.reference),
    db.prepare(`
      UPDATE payment_transactions
      SET status = 'success',
          verified_at = COALESCE(verified_at, datetime('now')),
          paystack_response = ?,
          settlement_applied_at = datetime('now'),
          settlement_source = ?,
          reconciliation_checked_at = datetime('now')
      WHERE reference = ?
        AND settlement_applied_at IS NULL
        AND status NOT IN ('success', 'refunded')
    `).bind(serializeProviderSummary(providerTransaction), source, row.reference),
  ];

  if (source === 'webhook') {
    statements.push(db.prepare(`
      INSERT OR IGNORE INTO payment_webhook_receipts
        (id, event_type, event_key, transaction_reference, outcome, processed_at)
      VALUES (?, 'charge.success', ?, ?, 'applied', datetime('now'))
    `).bind(
      `wh_${crypto.randomUUID()}`,
      `charge.success:${row.reference}`,
      row.reference,
    ));
  }

  const results = await db.batch(statements);
  const settlementWrite = results[2] as D1Result;
  if (!settlementWrite.meta?.changes) {
    if (source === 'webhook') await recordChargeReceipt(db, row.reference, 'already_applied');
    return { outcome: 'already_applied', context, planId: row.plan_id };
  }

  return {
    outcome: 'applied',
    context,
    planId: row.plan_id,
    expiresAt,
  };
}

async function markReconciliationChecked(
  db: D1Database,
  reference: string,
  provider?: ProviderTransaction,
): Promise<void> {
  await db.prepare(`
    UPDATE payment_transactions
    SET reconciliation_checked_at = datetime('now'),
        paystack_response = COALESCE(?, paystack_response)
    WHERE reference = ? AND status = 'pending' AND settlement_applied_at IS NULL
  `).bind(provider ? serializeProviderSummary(provider) : null, reference).run();
}

export function isTerminalProviderFailure(status: string | null): boolean {
  return status !== null && TERMINAL_FAILURE_STATUSES.has(status);
}

async function markProviderFailure(
  db: D1Database,
  reference: string,
  provider: ProviderTransaction,
): Promise<boolean> {
  const result = await db.prepare(`
    UPDATE payment_transactions
    SET status = 'failed',
        paystack_response = ?,
        reconciliation_checked_at = datetime('now')
    WHERE reference = ? AND status = 'pending' AND settlement_applied_at IS NULL
  `).bind(serializeProviderSummary(provider), reference).run();
  return (result.meta?.changes ?? 0) === 1;
}

export async function reconcilePendingSubscriptionPayments(
  db: D1Database,
  secretKey: string,
  requestedLimit = DEFAULT_RECONCILIATION_LIMIT,
  followUp?: SettlementFollowUp,
): Promise<ReconciliationResult> {
  const limit = Math.max(1, Math.min(MAX_RECONCILIATION_LIMIT, Math.trunc(requestedLimit)));
  const pending = await db.prepare(`
    SELECT reference
    FROM payment_transactions
    WHERE status = 'pending'
      AND settlement_applied_at IS NULL
      AND reference LIKE 'SUB_%'
      AND datetime(created_at) <= datetime('now', '-15 minutes')
    ORDER BY COALESCE(reconciliation_checked_at, '1970-01-01 00:00:00'), created_at
    LIMIT ?
  `).bind(limit).all<{ reference: string }>();

  const aggregate: ReconciliationResult = {
    checked: 0,
    settled: 0,
    failed: 0,
    stillPending: 0,
    providerErrors: 0,
    affiliateRepairs: 0,
  };

  for (const item of pending.results) {
    aggregate.checked += 1;
    const verification = await verifyPaystackTransaction(secretKey, item.reference);
    if (!verification.ok || !verification.data) {
      aggregate.providerErrors += 1;
      await markReconciliationChecked(db, item.reference);
      continue;
    }

    const provider = sanitizeProviderTransaction(verification.data);
    if (provider.status === 'success') {
      const settlement = await settleVerifiedSubscriptionPayment(
        db,
        verification.data,
        'reconciliation',
      );
      if (settlement.outcome === 'applied' || settlement.outcome === 'already_applied') {
        aggregate.settled += 1;
        if (followUp && settlement.context && await followUp(settlement.context)) {
          aggregate.affiliateRepairs += 1;
        }
      } else if (settlement.outcome === 'mismatch') {
        aggregate.failed += 1;
      }
      continue;
    }

    if (isTerminalProviderFailure(provider.status)) {
      if (await markProviderFailure(db, item.reference, verification.data)) {
        aggregate.failed += 1;
      }
      continue;
    }

    aggregate.stillPending += 1;
    await markReconciliationChecked(db, item.reference, verification.data);
  }

  if (followUp) {
    const incomplete = await db.prepare(`
      SELECT
        pt.id AS transactionId,
        pt.user_id AS userId,
        u.referred_by AS referralCode,
        pt.amount AS amountGhs,
        pt.reference
      FROM payment_transactions pt
      JOIN users u ON u.id = pt.user_id
      WHERE pt.status = 'success'
        AND pt.settlement_applied_at IS NOT NULL
        AND pt.affiliate_processed_at IS NULL
      ORDER BY pt.verified_at
      LIMIT ?
    `).bind(limit).all<SettledPaymentContext>();

    for (const context of incomplete.results) {
      if (await followUp(context)) aggregate.affiliateRepairs += 1;
    }
  }

  return aggregate;
}
