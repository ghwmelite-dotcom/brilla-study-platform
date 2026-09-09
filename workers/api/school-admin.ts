/**
 * School self-serve dashboard API — Phase 2 (spec:
 * docs/plans/2026-09-08-school-subscriptions.md).
 *
 * Authenticated via the school_admin role (migration 633). Like the phase-1
 * admin sub-app, this app carries its own authz — Hono sub-apps do not
 * inherit parent use() middleware. requireAuth runs first, then a role gate
 * (403 unless role === 'school_admin'; platform admins are NOT school
 * admins), then every route scopes to the caller's users.school_id (403 when
 * the account has no school assigned).
 *
 *   mount: app.route('/api/school-admin', schoolAdminApp)
 *
 * Routes:
 *   GET  /overview                      seat usage + drift + renewal state
 *   GET  /seats                         active seat-holders (+ consent flag)
 *   POST /seat-code/regenerate          rotate the school's own seat code
 *   GET  /students/:studentId/progress  read-only analytics, consent-gated
 *   POST /billing/renew                 self-serve renewal checkout (Paystack)
 */

import { Hono } from 'hono';
import type { Context, Next } from 'hono';
import { requireAuth } from './auth-middleware';
import { parseJsonBody } from './http';
import { generateSeatCode, SCHOOL_TIER_SEATS } from './school-seats';
import { generateReference, initializeTransaction } from './payments';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  PAYSTACK_SECRET_KEY: string;
  APP_URL: string;
}

interface SchoolAdminVariables {
  userId: string;
  userRole: string;
}

type SchoolAdminContext = Context<{ Bindings: Env; Variables: SchoolAdminVariables }>;

export const schoolAdminApp = new Hono<{
  Bindings: Env;
  Variables: SchoolAdminVariables;
}>();

schoolAdminApp.use('*', requireAuth);

// Role gate: school_admin only. Runs after requireAuth, which re-reads the
// role fresh from the users table on every request.
const requireSchoolAdmin = async (c: SchoolAdminContext, next: Next): Promise<Response | void> => {
  if (c.req.method === 'OPTIONS') {
    return next();
  }
  if (c.get('userRole') !== 'school_admin') {
    return c.json({ success: false, error: 'School admin access required' }, 403);
  }
  await next();
};
schoolAdminApp.use('*', requireSchoolAdmin);

interface CallerSchoolRow {
  id: string;
  name: string;
  status: string;
  seat_tier_id: string | null;
  seat_expires_at: string | null;
  seat_code: string | null;
  seat_code_uses: number;
  seat_cap: number;
  seat_credit: number;
  renewal_reminded_at: string | null;
}

type CallerSchool = { ok: true; school: CallerSchoolRow } | { ok: false; response: Response };

/**
 * Resolve the caller's school. Every route funnels through this so
 * cross-school access is impossible by construction: the school id always
 * comes from the caller's own users.school_id, never from the request.
 */
async function callerSchool(c: SchoolAdminContext): Promise<CallerSchool> {
  const membership = await c.env.DB.prepare(`
    SELECT school_id FROM users WHERE id = ?
  `).bind(c.get('userId') as string).first<{ school_id: string | null }>();
  if (!membership?.school_id) {
    return { ok: false, response: c.json({ success: false, error: 'No school assigned to this account' }, 403) };
  }

  const school = await c.env.DB.prepare(`
    SELECT id, name, status, seat_tier_id, seat_expires_at, seat_code,
           seat_code_uses, seat_cap, seat_credit, renewal_reminded_at
    FROM schools WHERE id = ?
  `).bind(membership.school_id).first<CallerSchoolRow>();
  if (!school) {
    return { ok: false, response: c.json({ success: false, error: 'Assigned school not found' }, 404) };
  }
  return { ok: true, school };
}

const DAY_MS = 24 * 60 * 60 * 1000;

// Dashboard overview: package state, usage counts, reconcile-on-read drift
// (same signal as the admin seat list), and renewal state.
schoolAdminApp.get('/overview', async (c) => {
  try {
    const caller = await callerSchool(c);
    if (!caller.ok) return caller.response;
    const school = caller.school;

    const counts = await c.env.DB.prepare(`
      SELECT
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_count,
        SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) AS expired_count,
        SUM(CASE WHEN status = 'revoked' THEN 1 ELSE 0 END) AS revoked_count
      FROM school_seats WHERE school_id = ?
    `).bind(school.id).first<{
      active_count: number | null;
      expired_count: number | null;
      revoked_count: number | null;
    }>();

    const activeCount = counts?.active_count ?? 0;
    const expiredCount = counts?.expired_count ?? 0;
    const revokedCount = counts?.revoked_count ?? 0;
    const daysRemaining = school.seat_expires_at
      ? Math.max(0, Math.ceil((Date.parse(school.seat_expires_at) - Date.now()) / DAY_MS))
      : null;

    return c.json({
      success: true,
      data: {
        school: {
          id: school.id,
          name: school.name,
          status: school.status,
          seatTierId: school.seat_tier_id,
          seatExpiresAt: school.seat_expires_at,
          seatCode: school.seat_code,
        },
        usage: {
          cap: school.seat_cap,
          codeUses: school.seat_code_uses,
          activeCount,
          expiredCount,
          revokedCount,
          // Drift signal: redemption counter vs real active rows.
          drift: school.seat_code_uses - activeCount,
        },
        daysRemaining,
        seatCredit: school.seat_credit,
        renewal: {
          renewalRemindedAt: school.renewal_reminded_at,
          renewalDue: daysRemaining !== null && daysRemaining <= 7,
        },
      },
    });
  } catch (error) {
    console.error('School admin overview error:', error);
    return c.json({ success: false, error: 'Failed to load school overview' }, 500);
  }
});

// Active seat-holders with their analytics consent flag.
schoolAdminApp.get('/seats', async (c) => {
  try {
    const caller = await callerSchool(c);
    if (!caller.ok) return caller.response;
    const school = caller.school;

    const { results: seats } = await c.env.DB.prepare(`
      SELECT ss.user_id, ss.granted_at, ss.analytics_opted_out,
             u.name AS full_name, u.email AS username
      FROM school_seats ss
      JOIN users u ON u.id = ss.user_id
      WHERE ss.school_id = ? AND ss.status = 'active'
      ORDER BY ss.granted_at DESC
      LIMIT 500
    `).bind(school.id).all<{
      user_id: string;
      granted_at: string;
      analytics_opted_out: number;
      full_name: string;
      username: string;
    }>();

    return c.json({
      success: true,
      data: seats.map((s) => ({
        userId: s.user_id,
        fullName: s.full_name,
        username: s.username,
        grantedAt: s.granted_at,
        analyticsOptedOut: s.analytics_opted_out === 1,
      })),
    });
  } catch (error) {
    console.error('School admin list seats error:', error);
    return c.json({ success: false, error: 'Failed to list seats' }, 500);
  }
});

// Rotate the school's own seat code. Granted seats are unaffected; only
// outstanding (not-yet-redeemed) copies of the old code die.
schoolAdminApp.post('/seat-code/regenerate', async (c) => {
  try {
    const caller = await callerSchool(c);
    if (!caller.ok) return caller.response;
    const school = caller.school;

    let code = '';
    let saved = false;
    for (let attempt = 0; attempt < 3 && !saved; attempt++) {
      code = generateSeatCode();
      try {
        await c.env.DB.prepare(
          'UPDATE schools SET seat_code = ? WHERE id = ?'
        ).bind(code, school.id).run();
        saved = true;
      } catch (error) {
        if (!String(error).includes('UNIQUE')) throw error;
      }
    }
    if (!saved) {
      return c.json({ success: false, error: 'Could not allocate a unique seat code' }, 500);
    }

    return c.json({ success: true, data: { schoolId: school.id, seatCode: code } });
  } catch (error) {
    console.error('School admin regenerate seat code error:', error);
    return c.json({ success: false, error: 'Failed to regenerate seat code' }, 500);
  }
});

// Read-only per-student analytics, gated on the phase-2 consent flag
// (school_seats.analytics_opted_out, flippable by SHS students). Query shape
// mirrors the parents progress endpoint (GET /api/parents/students/:id/progress);
// the authorization boundary is the ACTIVE seat at the caller's school.
schoolAdminApp.get('/students/:studentId/progress', async (c) => {
  try {
    const caller = await callerSchool(c);
    if (!caller.ok) return caller.response;
    const school = caller.school;
    const studentId = c.req.param('studentId');

    const seat = await c.env.DB.prepare(`
      SELECT id, analytics_opted_out FROM school_seats
      WHERE school_id = ? AND user_id = ? AND status = 'active'
    `).bind(school.id, studentId).first<{ id: string; analytics_opted_out: number }>();
    if (!seat) {
      return c.json({ success: false, error: 'Student does not hold an active seat at your school' }, 404);
    }
    if (seat.analytics_opted_out === 1) {
      return c.json({ success: false, error: 'This student has opted out of school analytics' }, 403);
    }

    const student = await c.env.DB.prepare(`
      SELECT id, name, avatar_url, school_level, year_group, house,
             xp_points, level, streak_days, last_activity_date
      FROM users WHERE id = ?
    `).bind(studentId).first<Record<string, unknown>>();
    if (!student) {
      return c.json({ success: false, error: 'Student not found' }, 404);
    }

    const { results: stats } = await c.env.DB.prepare(`
      SELECT COUNT(*) as total_attempted, SUM(is_correct) as total_correct
      FROM question_attempts WHERE user_id = ?
    `).bind(studentId).all();
    const attemptStats = stats[0] as { total_attempted: number; total_correct: number } | undefined;

    const { results: topicProgress } = await c.env.DB.prepare(`
      SELECT up.*, t.name as topic_name, s.name as subject_name
      FROM user_progress up
      JOIN topics t ON up.topic_id = t.id
      JOIN subjects s ON t.subject_id = s.id
      WHERE up.user_id = ?
      ORDER BY up.mastery_level DESC
    `).bind(studentId).all();

    const strengths = topicProgress.filter((t: any) => t.mastery_level >= 70).slice(0, 5);
    const weaknesses = topicProgress.filter((t: any) => t.mastery_level < 50 && t.questions_attempted >= 5).slice(0, 5);

    const { results: achievements } = await c.env.DB.prepare(`
      SELECT ua.*, a.name, a.description, a.icon
      FROM user_achievements ua
      JOIN achievements a ON ua.achievement_id = a.id
      WHERE ua.user_id = ?
      ORDER BY ua.unlocked_at DESC
      LIMIT 5
    `).bind(studentId).all();

    const userRecord = await c.env.DB.prepare(`
      SELECT MAX(streak_days) as longest_streak FROM users WHERE id = ?
    `).bind(studentId).first<{ longest_streak: number | null }>();

    return c.json({
      success: true,
      data: {
        studentId: student.id,
        studentName: student.name,
        studentAvatar: student.avatar_url,
        schoolLevel: student.school_level,
        yearGroup: student.year_group,
        house: student.house,
        xpPoints: (student.xp_points as number) || 0,
        level: (student.level as number) || 1,
        streakDays: (student.streak_days as number) || 0,
        longestStreak: userRecord?.longest_streak || (student.streak_days as number) || 0,
        totalQuestionsAttempted: attemptStats?.total_attempted || 0,
        totalCorrect: attemptStats?.total_correct || 0,
        overallAccuracy: attemptStats?.total_attempted
          ? Math.round((attemptStats.total_correct / attemptStats.total_attempted) * 100)
          : 0,
        topicsStarted: topicProgress.length,
        topicsMastered: topicProgress.filter((t: any) => t.mastery_level >= 80).length,
        strengthAreas: strengths.map((t: any) => ({
          topicId: t.topic_id,
          topicName: t.topic_name,
          subjectName: t.subject_name,
          mastery: t.mastery_level,
          questionsAttempted: t.questions_attempted,
          questionsCorrect: t.questions_correct,
        })),
        weakAreas: weaknesses.map((t: any) => ({
          topicId: t.topic_id,
          topicName: t.topic_name,
          subjectName: t.subject_name,
          mastery: t.mastery_level,
          questionsAttempted: t.questions_attempted,
          questionsCorrect: t.questions_correct,
        })),
        recentAchievements: achievements.map((a: any) => ({
          id: a.achievement_id,
          name: a.name,
          description: a.description,
          icon: a.icon,
          unlockedAt: a.unlocked_at,
        })),
        lastActiveAt: student.last_activity_date,
      },
    });
  } catch (error) {
    console.error('School admin student progress error:', error);
    return c.json({ success: false, error: 'Failed to fetch student progress' }, 500);
  }
});

// Self-serve renewal checkout for the school's CURRENT seat tier (or a larger
// one). Mirrors payments.ts POST /initialize for school tiers: the amount
// comes from the tier row, schools.seat_credit discounts it, and the
// payment_transactions metadata carries school_id + seats so settlement
// converges through settleSchoolSeatPayment (which also burns the consumed
// credit). The first purchase stays admin-led — a school without
// seat_tier_id cannot check out here.
schoolAdminApp.post('/billing/renew', async (c) => {
  try {
    const body = await parseJsonBody(c);
    if (!body) {
      return c.json({ success: false, error: 'Invalid JSON body' }, 400);
    }
    const billingCycle = body.billingCycle === 'yearly' ? 'yearly' : body.billingCycle === 'monthly' ? 'monthly' : null;
    if (!billingCycle) {
      return c.json({ success: false, error: 'billingCycle (monthly|yearly) is required' }, 400);
    }

    const caller = await callerSchool(c);
    if (!caller.ok) return caller.response;
    const school = caller.school;
    if (!school.seat_tier_id) {
      return c.json({ success: false, error: 'No seat package to renew — the first purchase is handled by Brilla' }, 400);
    }

    const targetTierId = typeof body.tierId === 'string' && body.tierId.trim()
      ? body.tierId.trim()
      : school.seat_tier_id;

    // Renewal is same-tier or an upgrade; a smaller package is a seat
    // reduction (admin-led, POST /api/admin/schools/:id/seats/reduce).
    const currentSeats = SCHOOL_TIER_SEATS[school.seat_tier_id] ?? null;
    const targetSeats = SCHOOL_TIER_SEATS[targetTierId] ?? null;
    if (targetTierId !== school.seat_tier_id) {
      if (!targetSeats) {
        return c.json({ success: false, error: 'Unknown or custom school tier — contact Brilla' }, 400);
      }
      if (currentSeats && targetSeats < currentSeats) {
        return c.json({ success: false, error: 'Cannot renew into a smaller package — ask Brilla to reduce seats instead' }, 400);
      }
    }

    const tier = await c.env.DB.prepare(`
      SELECT id, price_monthly, price_yearly, is_active FROM subscription_tiers
      WHERE id = ? AND user_type = 'school'
    `).bind(targetTierId).first<{
      id: string;
      price_monthly: number;
      price_yearly: number;
      is_active: number;
    }>();
    if (!tier || !tier.is_active) {
      return c.json({ success: false, error: 'Unknown or inactive school tier' }, 400);
    }

    const originalAmount = billingCycle === 'yearly' ? tier.price_yearly : tier.price_monthly;
    // tier_school_custom is priced 0 — negotiated tiers never self-checkout.
    if (!originalAmount || originalAmount <= 0) {
      return c.json({ success: false, error: 'This tier cannot be renewed self-serve — contact Brilla' }, 400);
    }

    const credit = school.seat_credit ?? 0;
    if (credit >= originalAmount) {
      return c.json({ success: false, error: 'Your seat credit covers this renewal — contact Brilla to apply it' }, 400);
    }
    const creditApplied = Math.min(credit, originalAmount);
    const amount = originalAmount - creditApplied;

    const user = await c.env.DB.prepare(`
      SELECT id, email, name FROM users WHERE id = ?
    `).bind(c.get('userId') as string).first<{ id: string; email: string; name: string }>();
    if (!user) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    // SUB_ prefix keeps the charge on the standard webhook settlement path.
    const reference = generateReference('SUB');
    const transactionId = `pay_${crypto.randomUUID()}`;
    const metadata = JSON.stringify({
      school_id: school.id,
      seats: targetSeats,
      renewal: true,
      credit_applied: creditApplied,
      original_amount: originalAmount,
    });

    await c.env.DB.prepare(`
      INSERT INTO payment_transactions (
        id, user_id, reference, amount, currency, plan_id, plan_type, billing_cycle, status, metadata
      ) VALUES (?, ?, ?, ?, 'GHS', ?, 'school', ?, 'pending', ?)
    `).bind(transactionId, user.id, reference, amount, targetTierId, billingCycle, metadata).run();

    const callbackUrl = `${c.env.APP_URL}/payment/callback?reference=${reference}`;
    const result = await initializeTransaction(
      c.env.PAYSTACK_SECRET_KEY,
      user.email,
      amount * 100, // pesewas
      reference,
      callbackUrl,
      {
        userId: user.id,
        planId: targetTierId,
        billingCycle,
        transactionId,
        schoolId: school.id,
        renewal: true,
      },
    );

    if (!result.status || !result.data) {
      await c.env.DB.prepare(`
        UPDATE payment_transactions
        SET status = 'failed', paystack_response = ?
        WHERE reference = ? AND status = 'pending'
      `).bind(JSON.stringify({ status: 'initialization_failed' }), reference).run();
      return c.json({ success: false, error: result.message || 'Failed to initialize payment' }, 500);
    }

    if (result.data.reference !== reference) {
      await c.env.DB.prepare(`
        UPDATE payment_transactions
        SET status = 'failed', paystack_response = ?
        WHERE reference = ? AND status = 'pending'
      `).bind(JSON.stringify({ status: 'initialization_reference_mismatch' }), reference).run();
      return c.json({ success: false, error: 'Payment provider reference mismatch' }, 502);
    }

    return c.json({
      success: true,
      data: {
        authorizationUrl: result.data.authorization_url,
        reference: result.data.reference,
        accessCode: result.data.access_code,
        amount,
        originalAmount,
        creditApplied,
      },
    });
  } catch (error) {
    console.error('School renewal checkout error:', error);
    return c.json({ success: false, error: 'Failed to initialize renewal' }, 500);
  }
});
