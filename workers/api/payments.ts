import { Hono } from 'hono';
import { requireAuth } from './auth-middleware';
import { parseLimit } from './http';

// Types for Cloudflare bindings
interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  PAYSTACK_SECRET_KEY: string;
  PAYSTACK_PUBLIC_KEY: string;
  PAYSTACK_WEBHOOK_SECRET?: string;
  APP_URL: string;
}

// Paystack API base URL
const PAYSTACK_API = 'https://api.paystack.co';

// =============================================
// PAYSTACK UTILITY FUNCTIONS
// =============================================

// Initialize a Paystack transaction
async function initializeTransaction(
  secretKey: string,
  email: string,
  amount: number, // in pesewas (100 pesewas = 1 GHS)
  reference: string,
  callbackUrl: string,
  metadata?: Record<string, unknown>
): Promise<{ status: boolean; data?: { authorization_url: string; reference: string; access_code: string }; message?: string }> {
  try {
    const response = await fetch(`${PAYSTACK_API}/transaction/initialize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount,
        reference,
        callback_url: callbackUrl,
        currency: 'GHS',
        channels: ['mobile_money', 'card', 'bank'],
        metadata,
      }),
    });

    return await response.json();
  } catch (error) {
    console.error('Paystack initialize error:', error);
    return { status: false, message: 'Failed to initialize transaction' };
  }
}

// Verify a Paystack transaction
async function verifyTransaction(
  secretKey: string,
  reference: string
): Promise<{ status: boolean; data?: { status: string; amount: number; currency: string; customer: { email: string }; metadata?: Record<string, unknown> }; message?: string }> {
  try {
    const response = await fetch(`${PAYSTACK_API}/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
      },
    });

    return await response.json();
  } catch (error) {
    console.error('Paystack verify error:', error);
    return { status: false, message: 'Failed to verify transaction' };
  }
}

// Create a transfer recipient (for affiliate payouts)
async function createTransferRecipient(
  secretKey: string,
  name: string,
  accountNumber: string,
  bankCode: string,
  type: 'mobile_money' | 'nuban' = 'mobile_money'
): Promise<{ status: boolean; data?: { recipient_code: string }; message?: string }> {
  try {
    const response = await fetch(`${PAYSTACK_API}/transferrecipient`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        name,
        account_number: accountNumber,
        bank_code: bankCode,
        currency: 'GHS',
      }),
    });

    return await response.json();
  } catch (error) {
    console.error('Paystack create recipient error:', error);
    return { status: false, message: 'Failed to create transfer recipient' };
  }
}

// Initiate a transfer (for affiliate payouts)
async function initiateTransfer(
  secretKey: string,
  amount: number, // in pesewas
  recipientCode: string,
  reason: string,
  reference?: string
): Promise<{ status: boolean; data?: { transfer_code: string; status: string }; message?: string }> {
  try {
    const response = await fetch(`${PAYSTACK_API}/transfer`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: 'balance',
        amount,
        recipient: recipientCode,
        reason,
        reference,
        currency: 'GHS',
      }),
    });

    return await response.json();
  } catch (error) {
    console.error('Paystack transfer error:', error);
    return { status: false, message: 'Failed to initiate transfer' };
  }
}

// Mobile money bank codes for Ghana
const MOBILE_MONEY_CODES: Record<string, string> = {
  'mtn': 'MTN', // MTN Mobile Money
  'vodafone': 'VOD', // Vodafone Cash
  'airteltigo': 'ATL', // AirtelTigo Money
};

// Generate unique reference
function generateReference(prefix: string = 'BRL'): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${randomPart}`.toUpperCase();
}

// SECURITY: Verify Paystack webhook signature using HMAC SHA512
async function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): Promise<boolean> {
  if (!signature || !secret) {
    return false;
  }

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-512' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(body)
    );

    const computedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Constant-time comparison to prevent timing attacks
    if (computedSignature.length !== signature.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < computedSignature.length; i++) {
      result |= computedSignature.charCodeAt(i) ^ signature.charCodeAt(i);
    }

    return result === 0;
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    return false;
  }
}

// SECURITY: Fraud detection thresholds
const FRAUD_THRESHOLDS = {
  MAX_COMMISSION_AMOUNT: 500, // Maximum commission that can be auto-approved (GHS)
  MIN_SIGNUP_TO_CONVERSION_HOURS: 1, // Minimum time between signup and conversion
  MAX_CONVERSIONS_PER_DAY: 10, // Maximum conversions per affiliate per day
};

// =============================================
// PAYMENTS API
// =============================================

export const paymentsApp = new Hono<{ Bindings: Env }>();

// Get subscription plans
// PUBLIC (no requireAuth): the pricing page lists plans pre-login. Mirrors the
// public /api/subscriptions/plans route.
paymentsApp.get('/plans', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT
        id,
        name,
        description,
        price_monthly,
        price_yearly,
        features,
        ai_grading_quota,
        is_active
      FROM subscription_tiers
      WHERE is_active = 1
      ORDER BY price_monthly ASC
    `).all();

    // Parse features JSON
    const plans = results.map((plan: Record<string, unknown>) => ({
      ...plan,
      features: JSON.parse((plan.features as string) || '[]'),
    }));

    return c.json({ success: true, data: plans });
  } catch (error) {
    console.error('Fetch plans error:', error);
    return c.json({ success: false, error: 'Failed to fetch plans' }, 500);
  }
});

// Initialize payment
paymentsApp.post('/initialize', requireAuth, async (c) => {
  try {
    const userId = c.get('userId') as string;
    const { planId, billingCycle } = await c.req.json();

    if (!planId || !billingCycle) {
      return c.json({ success: false, error: 'Plan ID and billing cycle required' }, 400);
    }

    // Get user details
    const user = await c.env.DB.prepare(`
      SELECT id, email, name, role FROM users WHERE id = ?
    `).bind(userId).first();

    if (!user) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    // Get plan details
    const plan = await c.env.DB.prepare(`
      SELECT * FROM subscription_tiers WHERE id = ?
    `).bind(planId).first();

    if (!plan) {
      return c.json({ success: false, error: 'Plan not found' }, 404);
    }

    // Calculate amount based on billing cycle
    const amount = billingCycle === 'yearly'
      ? (plan.price_yearly as number)
      : (plan.price_monthly as number);

    if (!amount || amount <= 0) {
      return c.json({ success: false, error: 'Invalid plan price' }, 400);
    }

    // Convert to pesewas (Paystack uses smallest currency unit)
    const amountInPesewas = amount * 100;

    // Generate unique reference
    const reference = generateReference('SUB');

    // Check for early bird discount
    let discountPercent = 0;
    let discountedAmount = amountInPesewas;

    const trial = await c.env.DB.prepare(`
      SELECT * FROM user_trials WHERE user_id = ? AND status = 'active'
    `).bind(userId).first();

    if (trial) {
      const trialStart = new Date(trial.started_at as string);
      const daysSinceTrial = Math.floor((Date.now() - trialStart.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSinceTrial <= 7) {
        discountPercent = 25; // 25% off in first 7 days
      } else if (daysSinceTrial <= 14) {
        discountPercent = 15; // 15% off in days 8-14
      }

      if (discountPercent > 0) {
        discountedAmount = Math.round(amountInPesewas * (1 - discountPercent / 100));
      }
    }

    // Create payment record
    const transactionId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO payment_transactions (
        id, user_id, reference, amount, currency, plan_id, plan_type, billing_cycle, status, metadata
      ) VALUES (?, ?, ?, ?, 'GHS', ?, ?, ?, 'pending', ?)
    `).bind(
      transactionId,
      userId,
      reference,
      discountedAmount / 100, // Store in GHS
      planId,
      user.role,
      billingCycle,
      JSON.stringify({ discountPercent, originalAmount: amount })
    ).run();

    // Initialize Paystack transaction
    const callbackUrl = `${c.env.APP_URL}/payment/callback?reference=${reference}`;

    const result = await initializeTransaction(
      c.env.PAYSTACK_SECRET_KEY,
      user.email as string,
      discountedAmount,
      reference,
      callbackUrl,
      {
        userId,
        planId,
        billingCycle,
        transactionId,
        discountPercent,
      }
    );

    if (!result.status || !result.data) {
      return c.json({ success: false, error: result.message || 'Failed to initialize payment' }, 500);
    }

    return c.json({
      success: true,
      data: {
        authorizationUrl: result.data.authorization_url,
        reference: result.data.reference,
        accessCode: result.data.access_code,
        amount: discountedAmount / 100,
        originalAmount: amount,
        discountPercent,
      },
    });
  } catch (error) {
    console.error('Initialize payment error:', error);
    return c.json({ success: false, error: 'Failed to initialize payment' }, 500);
  }
});

// Verify payment
paymentsApp.get('/verify/:reference', requireAuth, async (c) => {
  try {
    const userId = c.get('userId') as string;
    const reference = c.req.param('reference');

    if (!reference) {
      return c.json({ success: false, error: 'Reference required' }, 400);
    }

    // Get transaction record
    const transaction = await c.env.DB.prepare(`
      SELECT * FROM payment_transactions WHERE reference = ?
    `).bind(reference).first();

    if (!transaction) {
      return c.json({ success: false, error: 'Transaction not found' }, 404);
    }

    // SECURITY: ownership check — 404 (not 403) to avoid leaking which references exist
    if (transaction.user_id !== userId) {
      return c.json({ success: false, error: 'Transaction not found' }, 404);
    }

    // IDEMPOTENCY: already verified — never credit twice. Returns before ANY
    // crediting side-effect (grading credits, subscription, trial conversion,
    // affiliate commission).
    if (transaction.status === 'success') {
      return c.json({
        success: true,
        data: { reference, status: 'success', alreadyVerified: true },
      });
    }

    // Verify with Paystack
    const result = await verifyTransaction(c.env.PAYSTACK_SECRET_KEY, reference);

    if (!result.status || !result.data) {
      return c.json({ success: false, error: result.message || 'Failed to verify payment' }, 500);
    }

    const paymentStatus = result.data.status;

    if (paymentStatus === 'success') {
      // SECURITY: validate Paystack's amount/currency against what we recorded at initialize.
      // Paystack amount is in pesewas; payment_transactions.amount is in GHS.
      const paidAmountGhs = (result.data.amount as number) / 100;
      const expectedAmountGhs = transaction.amount as number;
      const currencyMatches = result.data.currency === (transaction.currency as string || 'GHS');
      const amountMatches = Math.abs(paidAmountGhs - expectedAmountGhs) < 0.01;

      if (!currencyMatches || !amountMatches) {
        console.error('Payment amount/currency mismatch', {
          reference, expectedAmountGhs, paidAmountGhs,
          expectedCurrency: transaction.currency, paidCurrency: result.data.currency,
        });
        // Status-guarded: a concurrent verify that already succeeded (or vice
        // versa) must not be flipped back to failed.
        await c.env.DB.prepare(`
          UPDATE payment_transactions
          SET status = 'failed', paystack_response = ?
          WHERE reference = ? AND status != 'success'
        `).bind(JSON.stringify(result.data), reference).run();
        return c.json({ success: false, error: 'Payment amount mismatch' }, 400);
      }

      // CLAIM FIRST, before any crediting side-effect: the status-guarded UPDATE
      // atomically claims the transaction. If changes = 0, a concurrent request
      // already verified it — exit as alreadyVerified and credit nothing.
      const claim = await c.env.DB.prepare(`
        UPDATE payment_transactions
        SET status = 'success', verified_at = datetime('now'), paystack_response = ?
        WHERE reference = ? AND status != 'success'
      `).bind(JSON.stringify(result.data), reference).run();

      if (!claim.meta?.changes) {
        return c.json({
          success: true,
          data: { reference, status: 'success', alreadyVerified: true },
        });
      }

      // Get plan details for subscription duration
      const plan = await c.env.DB.prepare(`
        SELECT * FROM subscription_tiers WHERE id = ?
      `).bind(transaction.plan_id).first();

      // Calculate subscription expiry
      const billingCycle = transaction.billing_cycle as string;
      const expiryDate = new Date();
      if (billingCycle === 'yearly') {
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      } else {
        expiryDate.setMonth(expiryDate.getMonth() + 1);
      }

      // Update user subscription
      await c.env.DB.prepare(`
        UPDATE users
        SET subscription_tier_id = ?,
            subscription_expires_at = ?,
            ai_grading_credits = CASE
              WHEN ? = -1 THEN -1
              ELSE COALESCE(ai_grading_credits, 0) + ?
            END
        WHERE id = ?
      `).bind(
        transaction.plan_id,
        expiryDate.toISOString(),
        plan?.ai_grading_quota || 0,
        plan?.ai_grading_quota || 0,
        transaction.user_id
      ).run();

      // Update trial status if exists
      await c.env.DB.prepare(`
        UPDATE user_trials
        SET status = 'converted', converted_at = datetime('now')
        WHERE user_id = ? AND status = 'active'
      `).bind(transaction.user_id).run();

      // Check if user was referred - process affiliate commission
      const user = await c.env.DB.prepare(`
        SELECT referred_by FROM users WHERE id = ?
      `).bind(transaction.user_id).first();

      if (user?.referred_by) {
        await processAffiliateCommission(
          c.env.DB,
          user.referred_by as string,
          transaction.user_id as string,
          transaction.id as string,
          (transaction.amount as number)
        );
      }

      return c.json({
        success: true,
        data: {
          status: 'success',
          planId: transaction.plan_id,
          expiresAt: expiryDate.toISOString(),
        },
      });
    } else {
      // Update transaction as failed
      await c.env.DB.prepare(`
        UPDATE payment_transactions
        SET status = 'failed', paystack_response = ?
        WHERE reference = ?
      `).bind(JSON.stringify(result.data), reference).run();

      return c.json({
        success: false,
        error: 'Payment was not successful',
        data: { status: paymentStatus },
      });
    }
  } catch (error) {
    console.error('Verify payment error:', error);
    return c.json({ success: false, error: 'Failed to verify payment' }, 500);
  }
});

// Process affiliate commission helper with fraud detection
async function processAffiliateCommission(
  db: D1Database,
  referralCode: string,
  referredUserId: string,
  transactionId: string,
  amount: number
): Promise<void> {
  try {
    // SECURITY: Validate inputs
    if (!referralCode || !referredUserId || !transactionId || amount <= 0) {
      console.error('Invalid commission processing inputs');
      return;
    }

    // Get affiliate profile
    const affiliate = await db.prepare(`
      SELECT ap.*, u.role as user_role, u.email as affiliate_email, at.commission_rate
      FROM affiliate_profiles ap
      JOIN users u ON ap.user_id = u.id
      JOIN affiliate_tiers at ON ap.tier_id = at.id
      WHERE ap.referral_code = ? AND ap.is_active = 1
    `).bind(referralCode.toUpperCase()).first();

    if (!affiliate) return;

    // Get referral record
    const referral = await db.prepare(`
      SELECT * FROM affiliate_referrals
      WHERE affiliate_id = ? AND referred_user_id = ?
    `).bind(affiliate.id, referredUserId).first();

    if (!referral) return;

    // SECURITY: Check for duplicate commission (prevent double processing)
    const existingCommission = await db.prepare(`
      SELECT id FROM affiliate_commissions
      WHERE referral_id = ? AND transaction_id = ?
    `).bind(referral.id, transactionId).first();

    if (existingCommission) {
      console.log('Commission already exists for this referral/transaction');
      return;
    }

    // SECURITY: Check if referral is already converted
    if (referral.status === 'converted') {
      console.log('Referral already converted');
      return;
    }

    // SECURITY: Check minimum time between signup and conversion
    const signupTime = new Date(referral.signup_at as string).getTime();
    const currentTime = Date.now();
    const hoursSinceSignup = (currentTime - signupTime) / (1000 * 60 * 60);

    let isSuspicious = false;
    let suspiciousReason = '';

    if (hoursSinceSignup < FRAUD_THRESHOLDS.MIN_SIGNUP_TO_CONVERSION_HOURS) {
      isSuspicious = true;
      suspiciousReason = `Conversion too fast: ${hoursSinceSignup.toFixed(2)} hours since signup`;
    }

    // SECURITY: Check daily conversion limit
    const dailyConversions = await db.prepare(`
      SELECT COUNT(*) as count FROM affiliate_commissions
      WHERE affiliate_id = ? AND created_at > datetime('now', '-1 day')
    `).bind(affiliate.id).first();

    if ((dailyConversions?.count as number) >= FRAUD_THRESHOLDS.MAX_CONVERSIONS_PER_DAY) {
      isSuspicious = true;
      suspiciousReason = `Daily conversion limit exceeded: ${dailyConversions?.count}`;
    }

    // Calculate commission
    const commissionRate = affiliate.commission_rate as number;
    const commissionAmount = amount * commissionRate;

    // SECURITY: Flag high-value commissions for manual review
    if (commissionAmount > FRAUD_THRESHOLDS.MAX_COMMISSION_AMOUNT) {
      isSuspicious = true;
      suspiciousReason = `High commission amount: ${commissionAmount} GHS`;
    }

    // Create commission record
    const commissionId = crypto.randomUUID();
    const initialStatus = isSuspicious ? 'pending' : 'pending';

    await db.prepare(`
      INSERT INTO affiliate_commissions (
        id, affiliate_id, referral_id, transaction_id, amount, commission_rate, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      commissionId,
      affiliate.id,
      referral.id,
      transactionId,
      commissionAmount,
      commissionRate,
      initialStatus
    ).run();

    // Update referral status
    await db.prepare(`
      UPDATE affiliate_referrals
      SET status = 'converted', converted_at = datetime('now'), first_payment_id = ?
      WHERE id = ?
    `).bind(transactionId, referral.id).run();

    // Update affiliate stats
    await db.prepare(`
      UPDATE affiliate_profiles
      SET
        successful_conversions = successful_conversions + 1,
        pending_earnings = pending_earnings + ?,
        last_referral_at = datetime('now')
      WHERE id = ?
    `).bind(commissionAmount, affiliate.id).run();

    // Only auto-approve if not suspicious
    if (!isSuspicious) {
      await db.prepare(`
        UPDATE affiliate_commissions
        SET status = 'approved', approved_at = datetime('now')
        WHERE id = ?
      `).bind(commissionId).run();

      // Move to available earnings
      await db.prepare(`
        UPDATE affiliate_profiles
        SET
          pending_earnings = pending_earnings - ?,
          available_earnings = available_earnings + ?,
          total_earnings = total_earnings + ?
        WHERE id = ?
      `).bind(commissionAmount, commissionAmount, commissionAmount, affiliate.id).run();
    } else {
      // Log suspicious activity for admin review
      console.warn(`SUSPICIOUS COMMISSION FLAGGED: ${commissionId} - ${suspiciousReason}`);
    }

    // Check for tier upgrade
    await checkAffiliateTierUpgrade(db, affiliate.id as string, affiliate.user_role as string);

  } catch (error) {
    console.error('Process affiliate commission error:', error);
  }
}

// Check and upgrade affiliate tier
async function checkAffiliateTierUpgrade(
  db: D1Database,
  affiliateId: string,
  userRole: string
): Promise<void> {
  try {
    const affiliate = await db.prepare(`
      SELECT ap.*, u.role FROM affiliate_profiles ap
      JOIN users u ON ap.user_id = u.id
      WHERE ap.id = ?
    `).bind(affiliateId).first();

    if (!affiliate) return;

    // Calculate effective referrals (teachers get 1.5x)
    let effectiveReferrals = affiliate.successful_conversions as number;
    if (userRole === 'teacher') {
      effectiveReferrals = Math.floor(effectiveReferrals * 1.5);
    }

    // Find appropriate tier
    const newTier = await db.prepare(`
      SELECT * FROM affiliate_tiers
      WHERE min_referrals <= ?
      AND (max_referrals IS NULL OR max_referrals >= ?)
      ORDER BY min_referrals DESC
      LIMIT 1
    `).bind(effectiveReferrals, effectiveReferrals).first();

    if (newTier && newTier.id !== affiliate.tier_id) {
      // Upgrade tier
      await db.prepare(`
        UPDATE affiliate_profiles SET tier_id = ? WHERE id = ?
      `).bind(newTier.id, affiliateId).run();

      // Award tier bonus XP
      if (newTier.xp_bonus) {
        await db.prepare(`
          UPDATE users SET affiliate_xp = affiliate_xp + ? WHERE id = ?
        `).bind(newTier.xp_bonus, affiliate.user_id).run();
      }
    }
  } catch (error) {
    console.error('Check tier upgrade error:', error);
  }
}

// Paystack webhook handler with proper signature verification
// PUBLIC (no requireAuth): Paystack servers call this with no JWT; it
// authenticates via the x-paystack-signature HMAC below. Fails closed: a
// missing PAYSTACK_WEBHOOK_SECRET is a 500 and nothing is processed.
paymentsApp.post('/webhook', async (c) => {
  try {
    const signature = c.req.header('x-paystack-signature');
    const body = await c.req.text();

    // SECURITY: Never process unsigned financial webhooks.
    // Missing secret is a misconfiguration = hard fail, no processing, no DB writes.
    if (!c.env.PAYSTACK_WEBHOOK_SECRET) {
      console.error('ALERT: PAYSTACK_WEBHOOK_SECRET is not configured — refusing to process webhook');
      return c.json({ success: false, error: 'Webhook not configured' }, 500);
    }

    const isValid = await verifyWebhookSignature(body, signature || '', c.env.PAYSTACK_WEBHOOK_SECRET);
    if (!isValid) {
      console.error('Webhook signature verification failed');
      return c.json({ success: false, error: 'Invalid signature' }, 401);
    }

    let event;
    try {
      event = JSON.parse(body);
    } catch {
      return c.json({ success: false, error: 'Invalid JSON body' }, 400);
    }

    // SECURITY: Validate event structure
    if (!event || typeof event.event !== 'string' || !event.data) {
      return c.json({ success: false, error: 'Invalid event structure' }, 400);
    }

    switch (event.event) {
      case 'charge.success':
        // Payment successful - already handled in verify endpoint
        console.log('Webhook: charge.success', event.data.reference);
        break;

      case 'transfer.success':
        // Payout successful
        const transferCode = event.data.transfer_code;
        if (transferCode && typeof transferCode === 'string') {
          await c.env.DB.prepare(`
            UPDATE affiliate_payouts
            SET status = 'completed', processed_at = datetime('now')
            WHERE paystack_transfer_code = ? AND status = 'processing'
          `).bind(transferCode).run();
        }
        break;

      case 'transfer.failed':
        // Payout failed - refund the affiliate's balance
        const failedTransferCode = event.data.transfer_code;
        if (failedTransferCode && typeof failedTransferCode === 'string') {
          // Get payout details
          const payout = await c.env.DB.prepare(`
            SELECT * FROM affiliate_payouts
            WHERE paystack_transfer_code = ? AND status = 'processing'
          `).bind(failedTransferCode).first();

          if (payout) {
            // Refund the balance
            await c.env.DB.prepare(`
              UPDATE affiliate_profiles
              SET available_earnings = available_earnings + ?
              WHERE id = ?
            `).bind(payout.amount, payout.affiliate_id).run();

            // Update payout status
            await c.env.DB.prepare(`
              UPDATE affiliate_payouts
              SET status = 'failed', failure_reason = ?
              WHERE paystack_transfer_code = ?
            `).bind(event.data.reason || 'Transfer failed', failedTransferCode).run();
          }
        }
        break;

      default:
        console.log('Unhandled webhook event:', event.event);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return c.json({ success: false }, 500);
  }
});

// Get user's payment history
paymentsApp.get('/history', requireAuth, async (c) => {
  try {
    const userId = c.get('userId') as string;
    const limit = parseLimit(c, 20);
    const offset = parseInt(c.req.query('offset') || '0');

    const { results } = await c.env.DB.prepare(`
      SELECT
        pt.*,
        st.name as plan_name,
        st.description as plan_description
      FROM payment_transactions pt
      LEFT JOIN subscription_tiers st ON pt.plan_id = st.id
      WHERE pt.user_id = ?
      ORDER BY pt.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(userId, limit, offset).all();

    return c.json({ success: true, data: results });
  } catch (error) {
    console.error('Fetch payment history error:', error);
    return c.json({ success: false, error: 'Failed to fetch payment history' }, 500);
  }
});

// Request affiliate payout with enhanced security
paymentsApp.post('/payout/request', requireAuth, async (c) => {
  try {
    const userId = c.get('userId') as string;
    const { amount } = await c.req.json();

    // SECURITY: Validate amount is a number
    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      return c.json({ success: false, error: 'Invalid amount' }, 400);
    }

    // SECURITY: Validate amount is not unreasonably large
    if (amount > 10000) {
      return c.json({ success: false, error: 'Amount exceeds maximum payout limit' }, 400);
    }

    // Get affiliate profile with explicit user ownership check
    const affiliate = await c.env.DB.prepare(`
      SELECT * FROM affiliate_profiles WHERE user_id = ? AND is_active = 1
    `).bind(userId).first();

    if (!affiliate) {
      return c.json({ success: false, error: 'Affiliate profile not found' }, 404);
    }

    // SECURITY: Double-check ownership - ensure affiliate.user_id matches authenticated userId
    if (affiliate.user_id !== userId) {
      console.error(`Payout ownership mismatch: affiliate.user_id=${affiliate.user_id}, userId=${userId}`);
      return c.json({ success: false, error: 'Unauthorized' }, 403);
    }

    // Check available balance (with exact comparison to avoid floating point issues)
    const availableEarnings = Number(affiliate.available_earnings) || 0;
    if (availableEarnings < amount) {
      return c.json({ success: false, error: 'Insufficient balance' }, 400);
    }

    // Check minimum payout (100 GHS)
    if (amount < 100) {
      return c.json({ success: false, error: 'Minimum payout is 100 GHS' }, 400);
    }

    // Check if mobile money details are set
    if (!affiliate.mobile_money_number || !affiliate.mobile_money_provider) {
      return c.json({ success: false, error: 'Please set up your mobile money details first' }, 400);
    }

    // SECURITY: Check for pending payout to prevent double requests
    const pendingPayout = await c.env.DB.prepare(`
      SELECT id FROM affiliate_payouts
      WHERE affiliate_id = ? AND status IN ('pending', 'processing')
    `).bind(affiliate.id).first();

    if (pendingPayout) {
      return c.json({ success: false, error: 'You already have a pending payout request' }, 400);
    }

    // SECURITY: Rate limit payout requests (max 3 per day)
    const dailyPayouts = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM affiliate_payouts
      WHERE affiliate_id = ? AND requested_at > datetime('now', '-1 day')
    `).bind(affiliate.id).first();

    if ((dailyPayouts?.count as number) >= 3) {
      return c.json({ success: false, error: 'Maximum payout requests per day exceeded' }, 429);
    }

    // Create payout request
    const payoutId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO affiliate_payouts (
        id, affiliate_id, amount, mobile_money_number, mobile_money_provider, status
      ) VALUES (?, ?, ?, ?, ?, 'pending')
    `).bind(
      payoutId,
      affiliate.id,
      amount,
      affiliate.mobile_money_number,
      affiliate.mobile_money_provider
    ).run();

    // Deduct from available earnings
    await c.env.DB.prepare(`
      UPDATE affiliate_profiles
      SET available_earnings = available_earnings - ?
      WHERE id = ?
    `).bind(amount, affiliate.id).run();

    // Process payout via Paystack Transfer
    const bankCode = MOBILE_MONEY_CODES[affiliate.mobile_money_provider as string];

    // Create transfer recipient
    const user = await c.env.DB.prepare(`
      SELECT name FROM users WHERE id = ?
    `).bind(userId).first();

    const recipientResult = await createTransferRecipient(
      c.env.PAYSTACK_SECRET_KEY,
      user?.name as string || 'Brilla Affiliate',
      affiliate.mobile_money_number as string,
      bankCode
    );

    if (!recipientResult.status || !recipientResult.data) {
      // Revert balance deduction
      await c.env.DB.prepare(`
        UPDATE affiliate_profiles
        SET available_earnings = available_earnings + ?
        WHERE id = ?
      `).bind(amount, affiliate.id).run();

      await c.env.DB.prepare(`
        UPDATE affiliate_payouts SET status = 'failed', failure_reason = ?
        WHERE id = ?
      `).bind(recipientResult.message || 'Failed to create recipient', payoutId).run();

      return c.json({ success: false, error: 'Failed to process payout' }, 500);
    }

    // Initiate transfer
    const transferRef = generateReference('PAY');
    const transferResult = await initiateTransfer(
      c.env.PAYSTACK_SECRET_KEY,
      amount * 100, // Convert to pesewas
      recipientResult.data.recipient_code,
      `Brilla Affiliate Payout - ${payoutId}`,
      transferRef
    );

    if (!transferResult.status || !transferResult.data) {
      // Revert balance deduction
      await c.env.DB.prepare(`
        UPDATE affiliate_profiles
        SET available_earnings = available_earnings + ?
        WHERE id = ?
      `).bind(amount, affiliate.id).run();

      await c.env.DB.prepare(`
        UPDATE affiliate_payouts SET status = 'failed', failure_reason = ?
        WHERE id = ?
      `).bind(transferResult.message || 'Failed to initiate transfer', payoutId).run();

      return c.json({ success: false, error: 'Failed to process payout' }, 500);
    }

    // Update payout with transfer details
    await c.env.DB.prepare(`
      UPDATE affiliate_payouts
      SET
        status = 'processing',
        paystack_transfer_code = ?,
        paystack_recipient_code = ?
      WHERE id = ?
    `).bind(
      transferResult.data.transfer_code,
      recipientResult.data.recipient_code,
      payoutId
    ).run();

    return c.json({
      success: true,
      data: {
        payoutId,
        amount,
        status: 'processing',
        message: 'Your payout is being processed',
      },
    });
  } catch (error) {
    console.error('Payout request error:', error);
    return c.json({ success: false, error: 'Failed to process payout request' }, 500);
  }
});

// Get payout history
paymentsApp.get('/payouts', requireAuth, async (c) => {
  try {
    const userId = c.get('userId') as string;

    // Get affiliate profile
    const affiliate = await c.env.DB.prepare(`
      SELECT id FROM affiliate_profiles WHERE user_id = ?
    `).bind(userId).first();

    if (!affiliate) {
      return c.json({ success: true, data: [] });
    }

    const { results } = await c.env.DB.prepare(`
      SELECT * FROM affiliate_payouts
      WHERE affiliate_id = ?
      ORDER BY requested_at DESC
    `).bind(affiliate.id).all();

    return c.json({ success: true, data: results });
  } catch (error) {
    console.error('Fetch payouts error:', error);
    return c.json({ success: false, error: 'Failed to fetch payouts' }, 500);
  }
});

// Update mobile money details
paymentsApp.put('/mobile-money', requireAuth, async (c) => {
  try {
    const userId = c.get('userId') as string;
    const { mobileMoneyNumber, mobileMoneyProvider } = await c.req.json();

    if (!mobileMoneyNumber || !mobileMoneyProvider) {
      return c.json({ success: false, error: 'Mobile money number and provider required' }, 400);
    }

    if (!['mtn', 'vodafone', 'airteltigo'].includes(mobileMoneyProvider)) {
      return c.json({ success: false, error: 'Invalid mobile money provider' }, 400);
    }

    // Validate phone number format (Ghana)
    const phoneRegex = /^0[235][0-9]{8}$/;
    if (!phoneRegex.test(mobileMoneyNumber)) {
      return c.json({ success: false, error: 'Invalid phone number format' }, 400);
    }

    await c.env.DB.prepare(`
      UPDATE affiliate_profiles
      SET mobile_money_number = ?, mobile_money_provider = ?
      WHERE user_id = ?
    `).bind(mobileMoneyNumber, mobileMoneyProvider, userId).run();

    return c.json({ success: true, message: 'Mobile money details updated' });
  } catch (error) {
    console.error('Update mobile money error:', error);
    return c.json({ success: false, error: 'Failed to update mobile money details' }, 500);
  }
});

export default paymentsApp;
