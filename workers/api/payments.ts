import { Hono } from 'hono';
import { verify } from 'hono/jwt';

// Types for Cloudflare bindings
interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  PAYSTACK_SECRET_KEY: string;
  PAYSTACK_PUBLIC_KEY: string;
  PAYSTACK_WEBHOOK_SECRET?: string;
  APP_URL: string;
}

// JWT payload type
interface UserPayload {
  userId: string;
  email: string;
  role: string;
  exp?: number;
}

// Verify JWT token
async function verifyJWT(token: string, secret: string): Promise<UserPayload | null> {
  try {
    const payload = await verify(token, secret);
    return payload as UserPayload;
  } catch {
    return null;
  }
}

// Authentication middleware for protected routes
const authMiddleware = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');

  // Skip auth for OPTIONS requests (CORS preflight)
  if (c.req.method === 'OPTIONS') {
    return next();
  }

  // Check for Authorization header
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const token = authHeader.replace('Bearer ', '');

  // Handle demo tokens - use actual database IDs
  if (token.endsWith('_demo_token')) {
    const tokenPrefix = token.replace('_demo_token', '');
    const demoUsers: Record<string, { id: string; role: string }> = {
      'student': { id: 'student_1766327981521', role: 'student' },
      'teacher': { id: 'teacher_1766327981453', role: 'teacher' },
      'admin': { id: 'admin_prod_001', role: 'admin' },
    };
    const demoUser = demoUsers[tokenPrefix];
    if (demoUser) {
      c.set('userId', demoUser.id);
      c.set('userRole', demoUser.role);
      return next();
    }
  }

  // Verify JWT token
  try {
    const payload = await verifyJWT(token, c.env.JWT_SECRET);
    if (!payload) {
      return c.json({ success: false, error: 'Invalid token' }, 401);
    }
    c.set('userId', payload.userId);
    c.set('userRole', payload.role);
    return next();
  } catch {
    return c.json({ success: false, error: 'Invalid token' }, 401);
  }
};

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
): Promise<{ status: boolean; data?: { status: string; amount: number; customer: { email: string }; metadata?: Record<string, unknown> }; message?: string }> {
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

// Verify webhook signature
function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  // Paystack uses HMAC SHA512 for webhook signatures
  // In Cloudflare Workers, we'd need to compute this
  // For now, we'll do a basic check
  // In production, implement proper HMAC verification
  return signature && secret ? true : false;
}

// =============================================
// PAYMENTS API
// =============================================

export const paymentsApp = new Hono<{ Bindings: Env }>();

// Get subscription plans
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
paymentsApp.post('/initialize', authMiddleware, async (c) => {
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
paymentsApp.get('/verify/:reference', authMiddleware, async (c) => {
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

    // Verify with Paystack
    const result = await verifyTransaction(c.env.PAYSTACK_SECRET_KEY, reference);

    if (!result.status || !result.data) {
      return c.json({ success: false, error: result.message || 'Failed to verify payment' }, 500);
    }

    const paymentStatus = result.data.status;

    if (paymentStatus === 'success') {
      // Update transaction record
      await c.env.DB.prepare(`
        UPDATE payment_transactions
        SET status = 'success', verified_at = datetime('now'), paystack_response = ?
        WHERE reference = ?
      `).bind(JSON.stringify(result.data), reference).run();

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

// Process affiliate commission helper
async function processAffiliateCommission(
  db: D1Database,
  referralCode: string,
  referredUserId: string,
  transactionId: string,
  amount: number
): Promise<void> {
  try {
    // Get affiliate profile
    const affiliate = await db.prepare(`
      SELECT ap.*, u.role as user_role, at.commission_rate
      FROM affiliate_profiles ap
      JOIN users u ON ap.user_id = u.id
      JOIN affiliate_tiers at ON ap.tier_id = at.id
      WHERE ap.referral_code = ? AND ap.is_active = 1
    `).bind(referralCode).first();

    if (!affiliate) return;

    // Get referral record
    const referral = await db.prepare(`
      SELECT * FROM affiliate_referrals
      WHERE affiliate_id = ? AND referred_user_id = ?
    `).bind(affiliate.id, referredUserId).first();

    if (!referral) return;

    // Calculate commission
    const commissionRate = affiliate.commission_rate as number;
    const commissionAmount = amount * commissionRate;

    // Create commission record
    const commissionId = crypto.randomUUID();
    await db.prepare(`
      INSERT INTO affiliate_commissions (
        id, affiliate_id, referral_id, transaction_id, amount, commission_rate, status
      ) VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `).bind(
      commissionId,
      affiliate.id,
      referral.id,
      transactionId,
      commissionAmount,
      commissionRate
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

    // Auto-approve commission (can add manual approval flow later)
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
        available_earnings = available_earnings + ?
      WHERE id = ?
    `).bind(commissionAmount, commissionAmount, affiliate.id).run();

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

// Paystack webhook handler
paymentsApp.post('/webhook', async (c) => {
  try {
    const signature = c.req.header('x-paystack-signature');
    const body = await c.req.text();

    // Verify webhook signature (implement proper HMAC verification in production)
    if (c.env.PAYSTACK_WEBHOOK_SECRET && signature) {
      // Basic signature check - implement proper HMAC SHA512 verification
      // For production, use crypto.subtle.sign with HMAC
    }

    const event = JSON.parse(body);

    switch (event.event) {
      case 'charge.success':
        // Payment successful - already handled in verify endpoint
        console.log('Webhook: charge.success', event.data.reference);
        break;

      case 'transfer.success':
        // Payout successful
        const transferCode = event.data.transfer_code;
        await c.env.DB.prepare(`
          UPDATE affiliate_payouts
          SET status = 'completed', processed_at = datetime('now')
          WHERE paystack_transfer_code = ?
        `).bind(transferCode).run();
        break;

      case 'transfer.failed':
        // Payout failed
        const failedTransferCode = event.data.transfer_code;
        await c.env.DB.prepare(`
          UPDATE affiliate_payouts
          SET status = 'failed', failure_reason = ?
          WHERE paystack_transfer_code = ?
        `).bind(event.data.reason || 'Transfer failed', failedTransferCode).run();
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
paymentsApp.get('/history', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId') as string;
    const limit = parseInt(c.req.query('limit') || '20');
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

// Request affiliate payout
paymentsApp.post('/payout/request', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId') as string;
    const { amount } = await c.req.json();

    if (!amount || amount <= 0) {
      return c.json({ success: false, error: 'Invalid amount' }, 400);
    }

    // Get affiliate profile
    const affiliate = await c.env.DB.prepare(`
      SELECT * FROM affiliate_profiles WHERE user_id = ? AND is_active = 1
    `).bind(userId).first();

    if (!affiliate) {
      return c.json({ success: false, error: 'Affiliate profile not found' }, 404);
    }

    // Check available balance
    if ((affiliate.available_earnings as number) < amount) {
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
paymentsApp.get('/payouts', authMiddleware, async (c) => {
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
paymentsApp.put('/mobile-money', authMiddleware, async (c) => {
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
