import { Hono } from 'hono';
import { requireAuth } from './auth-middleware';
import type { AuthPayload } from './auth-middleware';

// Types for Cloudflare bindings
interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  APP_URL: string;
}

// Context variables set by requireAuth
interface AuthVars {
  userId: string;
  userRole: string;
  user: AuthPayload;
}

// Admin-only middleware
const adminMiddleware = async (c: any, next: any) => {
  const role = c.get('userRole');
  if (role !== 'admin') {
    return c.json({ success: false, error: 'Admin access required' }, 403);
  }
  return next();
};

// Teacher-only middleware
const teacherMiddleware = async (c: any, next: any) => {
  const role = c.get('userRole');
  if (role !== 'teacher' && role !== 'admin') {
    return c.json({ success: false, error: 'Teacher access required' }, 403);
  }
  return next();
};

// Create the router
export const teacherBonusesRouter = new Hono<{ Bindings: Env; Variables: AuthVars }>();

// Apply shared auth middleware to all routes (verified JWT + active DB user)
teacherBonusesRouter.use('*', requireAuth);


// ============================================
// TEACHER ENDPOINTS
// ============================================

/**
 * GET /teacher-bonuses/my-status
 * Get current teacher's bonus status and eligibility
 */
teacherBonusesRouter.get('/my-status', teacherMiddleware, async (c) => {
  const teacherId = c.get('userId');
  const currentYear = new Date().getFullYear();

  try {
    // Get teacher's affiliate profile to count referrals
    const affiliateProfile = await c.env.DB.prepare(`
      SELECT
        ap.id,
        ap.total_referrals,
        ap.successful_conversions
      FROM affiliate_profiles ap
      WHERE ap.user_id = ?
    `).bind(teacherId).first();

    // Count active students (students with 3+ months active subscription this year)
    // This requires joining referrals with payment data
    const activeStudentsResult = await c.env.DB.prepare(`
      SELECT COUNT(DISTINCT ar.referred_user_id) as count
      FROM affiliate_referrals ar
      JOIN affiliate_profiles ap ON ar.affiliate_id = ap.id
      WHERE ap.user_id = ?
        AND ar.status = 'converted'
        AND ar.converted_at >= date('now', 'start of year')
    `).bind(teacherId).first();

    const activeStudents = (activeStudentsResult?.count as number) || 0;

    // Get all bonus tiers for current year
    const tiersResult = await c.env.DB.prepare(`
      SELECT * FROM teacher_bonus_config
      WHERE year = ? AND is_active = 1
      ORDER BY min_students ASC
    `).bind(currentYear).all();

    const tiers = tiersResult.results || [];

    // Find current tier and next tier
    let currentTier = null;
    let nextTier = null;

    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i] as any;
      const minStudents = tier.min_students;
      const maxStudents = tier.max_students;

      if (activeStudents >= minStudents && (maxStudents === null || activeStudents <= maxStudents)) {
        currentTier = {
          id: tier.id,
          year: tier.year,
          minStudents: tier.min_students,
          maxStudents: tier.max_students,
          bonusPercentage: tier.bonus_percentage,
          minActiveMonths: tier.min_active_months,
          isActive: !!tier.is_active
        };
        if (i < tiers.length - 1) {
          const next = tiers[i + 1] as any;
          nextTier = {
            id: next.id,
            year: next.year,
            minStudents: next.min_students,
            maxStudents: next.max_students,
            bonusPercentage: next.bonus_percentage,
            minActiveMonths: next.min_active_months,
            isActive: !!next.is_active
          };
        }
        break;
      } else if (activeStudents < minStudents && !nextTier) {
        nextTier = {
          id: tier.id,
          year: tier.year,
          minStudents: tier.min_students,
          maxStudents: tier.max_students,
          bonusPercentage: tier.bonus_percentage,
          minActiveMonths: tier.min_active_months,
          isActive: !!tier.is_active
        };
      }
    }

    // Calculate students needed for next tier
    const studentsToNextTier = nextTier ? nextTier.minStudents - activeStudents : 0;

    // Get total payments from referred students this year
    const paymentsResult = await c.env.DB.prepare(`
      SELECT COALESCE(SUM(pt.amount), 0) as total
      FROM payment_transactions pt
      JOIN affiliate_referrals ar ON pt.user_id = ar.referred_user_id
      JOIN affiliate_profiles ap ON ar.affiliate_id = ap.id
      WHERE ap.user_id = ?
        AND pt.status = 'success'
        AND pt.verified_at >= date('now', 'start of year')
    `).bind(teacherId).first();

    const totalStudentPayments = ((paymentsResult?.total as number) || 0) / 100; // Convert from pesewas

    // Calculate estimated bonus
    const bonusPercentage = currentTier?.bonusPercentage || 0;
    const estimatedBonus = totalStudentPayments * (bonusPercentage / 100);

    // Get bonus history
    const historyResult = await c.env.DB.prepare(`
      SELECT * FROM teacher_year_end_bonuses
      WHERE teacher_id = ?
      ORDER BY year DESC
      LIMIT 5
    `).bind(teacherId).all();

    const bonusHistory = (historyResult.results || []).map((row: any) => ({
      id: row.id,
      teacherId: row.teacher_id,
      year: row.year,
      totalReferredStudents: row.total_referred_students || 0,
      activeStudents: row.active_students || 0,
      totalStudentPayments: row.total_student_payments || 0,
      bonusPercentage: row.bonus_percentage || 0,
      bonusAmount: row.bonus_amount || 0,
      status: row.status,
      calculationDate: row.calculation_date,
      reviewedBy: row.reviewed_by,
      reviewedAt: row.reviewed_at,
      reviewNotes: row.review_notes,
      paidAt: row.paid_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    return c.json({
      success: true,
      data: {
        currentTier,
        nextTier,
        activeStudents,
        studentsToNextTier: Math.max(0, studentsToNextTier),
        totalReferredStudents: affiliateProfile?.total_referrals || 0,
        totalStudentPayments,
        estimatedBonus,
        bonusHistory
      }
    });
  } catch (error) {
    console.error('Error getting bonus status:', error);
    return c.json({ success: false, error: 'Failed to get bonus status' }, 500);
  }
});


/**
 * GET /teacher-bonuses/my-students/:year
 * Get list of referred students for a specific year
 */
teacherBonusesRouter.get('/my-students/:year', teacherMiddleware, async (c) => {
  const teacherId = c.get('userId');
  const year = parseInt(c.req.param('year'));

  if (isNaN(year) || year < 2020 || year > 2100) {
    return c.json({ success: false, error: 'Invalid year' }, 400);
  }

  try {
    // Get referred students with their subscription info
    const studentsResult = await c.env.DB.prepare(`
      SELECT
        ar.id as referral_id,
        ar.referred_user_id as student_id,
        ar.status as referral_status,
        ar.signup_at,
        ar.converted_at,
        u.name as student_name,
        u.email as student_email,
        (
          SELECT COUNT(DISTINCT strftime('%Y-%m', pt.verified_at))
          FROM payment_transactions pt
          WHERE pt.user_id = ar.referred_user_id
            AND pt.status = 'success'
            AND strftime('%Y', pt.verified_at) = ?
        ) as active_months,
        (
          SELECT COALESCE(SUM(pt.amount), 0)
          FROM payment_transactions pt
          WHERE pt.user_id = ar.referred_user_id
            AND pt.status = 'success'
            AND strftime('%Y', pt.verified_at) = ?
        ) as total_payments
      FROM affiliate_referrals ar
      JOIN affiliate_profiles ap ON ar.affiliate_id = ap.id
      JOIN users u ON ar.referred_user_id = u.id
      WHERE ap.user_id = ?
        AND (
          strftime('%Y', ar.signup_at) = ?
          OR strftime('%Y', ar.converted_at) = ?
        )
      ORDER BY ar.signup_at DESC
    `).bind(
      year.toString(),
      year.toString(),
      teacherId,
      year.toString(),
      year.toString()
    ).all();

    const students = (studentsResult.results || []).map((row: any) => ({
      id: row.referral_id,
      studentId: row.student_id,
      studentName: row.student_name,
      studentEmail: row.student_email,
      referralStatus: row.referral_status,
      signupAt: row.signup_at,
      convertedAt: row.converted_at,
      activeMonths: row.active_months || 0,
      totalPayments: (row.total_payments || 0) / 100, // Convert from pesewas
      isQualified: (row.active_months || 0) >= 3
    }));

    // Summary stats
    const qualifiedCount = students.filter(s => s.isQualified).length;
    const totalPayments = students.reduce((sum, s) => sum + s.totalPayments, 0);

    return c.json({
      success: true,
      data: {
        year,
        students,
        summary: {
          totalStudents: students.length,
          qualifiedStudents: qualifiedCount,
          totalPayments
        }
      }
    });
  } catch (error) {
    console.error('Error getting referred students:', error);
    return c.json({ success: false, error: 'Failed to get referred students' }, 500);
  }
});


/**
 * GET /teacher-bonuses/config
 * Get bonus tier configuration for current/upcoming years
 */
teacherBonusesRouter.get('/config', async (c) => {
  const currentYear = new Date().getFullYear();

  try {
    const result = await c.env.DB.prepare(`
      SELECT * FROM teacher_bonus_config
      WHERE year >= ? AND is_active = 1
      ORDER BY year ASC, min_students ASC
    `).bind(currentYear).all();

    const configs = (result.results || []).map((row: any) => ({
      id: row.id,
      year: row.year,
      minStudents: row.min_students,
      maxStudents: row.max_students,
      bonusPercentage: row.bonus_percentage,
      minActiveMonths: row.min_active_months,
      isActive: !!row.is_active
    }));

    // Group by year
    const byYear: Record<number, any[]> = {};
    for (const config of configs) {
      if (!byYear[config.year]) {
        byYear[config.year] = [];
      }
      byYear[config.year].push(config);
    }

    return c.json({
      success: true,
      data: byYear
    });
  } catch (error) {
    console.error('Error getting bonus config:', error);
    return c.json({ success: false, error: 'Failed to get bonus configuration' }, 500);
  }
});


// ============================================
// ADMIN ENDPOINTS
// ============================================

/**
 * GET /teacher-bonuses/admin/list
 * List all teacher bonuses (for admin review)
 */
teacherBonusesRouter.get('/admin/list', adminMiddleware, async (c) => {
  const year = c.req.query('year') || new Date().getFullYear().toString();
  const status = c.req.query('status');
  const page = parseInt(c.req.query('page') || '1');
  const pageSize = Math.min(parseInt(c.req.query('pageSize') || '20'), 100);
  const offset = (page - 1) * pageSize;

  try {
    let whereClause = 'WHERE tyb.year = ?';
    const params: any[] = [parseInt(year)];

    if (status) {
      whereClause += ' AND tyb.status = ?';
      params.push(status);
    }

    // Count total
    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM teacher_year_end_bonuses tyb
      ${whereClause}
    `).bind(...params).first();

    // Get bonuses with teacher info
    const result = await c.env.DB.prepare(`
      SELECT
        tyb.*,
        u.name as teacher_name,
        u.email as teacher_email
      FROM teacher_year_end_bonuses tyb
      JOIN users u ON tyb.teacher_id = u.id
      ${whereClause}
      ORDER BY tyb.bonus_amount DESC, tyb.active_students DESC
      LIMIT ? OFFSET ?
    `).bind(...params, pageSize, offset).all();

    const bonuses = (result.results || []).map((row: any) => ({
      id: row.id,
      teacherId: row.teacher_id,
      teacherName: row.teacher_name,
      teacherEmail: row.teacher_email,
      year: row.year,
      totalReferredStudents: row.total_referred_students || 0,
      activeStudents: row.active_students || 0,
      totalStudentPayments: row.total_student_payments || 0,
      bonusPercentage: row.bonus_percentage || 0,
      bonusAmount: row.bonus_amount || 0,
      status: row.status,
      calculationDate: row.calculation_date,
      reviewedBy: row.reviewed_by,
      reviewedAt: row.reviewed_at,
      reviewNotes: row.review_notes,
      paidAt: row.paid_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    return c.json({
      success: true,
      data: {
        bonuses,
        pagination: {
          page,
          pageSize,
          total: (countResult?.count as number) || 0,
          hasMore: offset + pageSize < ((countResult?.count as number) || 0)
        }
      }
    });
  } catch (error) {
    console.error('Error listing bonuses:', error);
    return c.json({ success: false, error: 'Failed to list bonuses' }, 500);
  }
});


/**
 * POST /teacher-bonuses/admin/calculate
 * Trigger year-end bonus calculation for all eligible teachers
 */
teacherBonusesRouter.post('/admin/calculate', adminMiddleware, async (c) => {
  const { year } = await c.req.json();
  const targetYear = year || new Date().getFullYear();

  try {
    // Get all teachers with affiliate profiles who have referrals
    const teachersResult = await c.env.DB.prepare(`
      SELECT DISTINCT
        ap.user_id as teacher_id,
        ap.id as affiliate_profile_id,
        u.name as teacher_name
      FROM affiliate_profiles ap
      JOIN users u ON ap.user_id = u.id
      WHERE u.role = 'teacher'
        AND ap.successful_conversions > 0
    `).all();

    const teachers = teachersResult.results || [];
    const results = [];

    // One grouped query: per-teacher, per-student active months and payments
    const studentsResult = await c.env.DB.prepare(`
      SELECT
        ap.user_id AS teacher_id,
        ar.referred_user_id AS student_id,
        COUNT(DISTINCT strftime('%Y-%m', pt.verified_at)) AS active_months,
        COALESCE(SUM(pt.amount), 0) AS total_payments
      FROM affiliate_referrals ar
      JOIN affiliate_profiles ap ON ar.affiliate_id = ap.id
      LEFT JOIN payment_transactions pt ON pt.user_id = ar.referred_user_id
        AND pt.status = 'success'
        AND strftime('%Y', pt.verified_at) = ?
      WHERE ar.status = 'converted'
      GROUP BY ap.user_id, ar.referred_user_id
    `).bind(targetYear.toString()).all();

    // Group student rows in JS by teacher_id, keeping only qualified students
    // (3+ active months with paid subscription)
    const qualifiedByTeacher = new Map<string, any[]>();
    for (const row of (studentsResult.results || []) as any[]) {
      if ((row.active_months || 0) < 3) continue;
      const list = qualifiedByTeacher.get(row.teacher_id) || [];
      list.push(row);
      qualifiedByTeacher.set(row.teacher_id, list);
    }

    // One grouped query: total referred students per teacher for the year
    const totalReferredResult = await c.env.DB.prepare(`
      SELECT
        ap.user_id AS teacher_id,
        COUNT(*) AS count
      FROM affiliate_referrals ar
      JOIN affiliate_profiles ap ON ar.affiliate_id = ap.id
      WHERE (
        strftime('%Y', ar.signup_at) = ?
        OR strftime('%Y', ar.converted_at) = ?
      )
      GROUP BY ap.user_id
    `).bind(targetYear.toString(), targetYear.toString()).all();

    const totalReferredByTeacher = new Map<string, number>();
    for (const row of (totalReferredResult.results || []) as any[]) {
      totalReferredByTeacher.set(row.teacher_id, (row.count as number) || 0);
    }

    // Fetch all active tiers once; pick the matching tier in JS
    const tiersResult = await c.env.DB.prepare(`
      SELECT * FROM teacher_bonus_config
      WHERE year = ? AND is_active = 1
      ORDER BY min_students DESC
    `).bind(targetYear).all();

    const tiers = (tiersResult.results || []) as any[];
    const pickTier = (activeStudents: number) =>
      tiers.find(
        (t) =>
          t.min_students <= activeStudents &&
          (t.max_students === null || t.max_students >= activeStudents)
      );

    // Compute bonuses in JS and collect upserts for a single batch
    const upserts = [];
    for (const teacher of teachers as any[]) {
      const teacherId = teacher.teacher_id;
      const affiliateProfileId = teacher.affiliate_profile_id;

      const qualifiedStudents = qualifiedByTeacher.get(teacherId) || [];
      const activeStudents = qualifiedStudents.length;
      const totalStudentPayments = qualifiedStudents.reduce(
        (sum: number, s: any) => sum + (s.total_payments || 0),
        0
      ) / 100; // Convert from pesewas

      const totalReferredStudents = totalReferredByTeacher.get(teacherId) || 0;

      const tier = pickTier(activeStudents);
      const bonusPercentage = (tier?.bonus_percentage as number) || 0;
      const bonusAmount = totalStudentPayments * (bonusPercentage / 100);

      // Skip if no bonus earned
      if (bonusAmount === 0 && activeStudents === 0) {
        continue;
      }

      // Create or update bonus record
      const bonusId = `bonus_${teacherId}_${targetYear}`;
      upserts.push(
        c.env.DB.prepare(`
          INSERT INTO teacher_year_end_bonuses (
            id, teacher_id, affiliate_profile_id, year,
            total_referred_students, active_students,
            total_student_payments, bonus_percentage, bonus_amount,
            status, calculation_date, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'calculated', datetime('now'), datetime('now'), datetime('now'))
          ON CONFLICT(teacher_id, year) DO UPDATE SET
            total_referred_students = excluded.total_referred_students,
            active_students = excluded.active_students,
            total_student_payments = excluded.total_student_payments,
            bonus_percentage = excluded.bonus_percentage,
            bonus_amount = excluded.bonus_amount,
            status = 'calculated',
            calculation_date = datetime('now'),
            updated_at = datetime('now')
        `).bind(
          bonusId,
          teacherId,
          affiliateProfileId,
          targetYear,
          totalReferredStudents,
          activeStudents,
          totalStudentPayments,
          bonusPercentage,
          bonusAmount
        )
      );

      results.push({
        teacherId,
        teacherName: teacher.teacher_name,
        activeStudents,
        totalStudentPayments,
        bonusPercentage,
        bonusAmount
      });
    }

    if (upserts.length > 0) {
      await c.env.DB.batch(upserts);
    }

    return c.json({
      success: true,
      data: {
        year: targetYear,
        teachersProcessed: results.length,
        results
      }
    });
  } catch (error) {
    console.error('Error calculating bonuses:', error);
    return c.json({ success: false, error: 'Failed to calculate bonuses' }, 500);
  }
});


/**
 * POST /teacher-bonuses/admin/:id/approve
 * Approve a teacher's bonus
 */
teacherBonusesRouter.post('/admin/:id/approve', adminMiddleware, async (c) => {
  const bonusId = c.req.param('id');
  const adminId = c.get('userId');
  const { notes } = await c.req.json().catch(() => ({}));

  try {
    // Get the bonus
    const bonus = await c.env.DB.prepare(`
      SELECT * FROM teacher_year_end_bonuses WHERE id = ?
    `).bind(bonusId).first();

    if (!bonus) {
      return c.json({ success: false, error: 'Bonus not found' }, 404);
    }

    if (bonus.status !== 'calculated' && bonus.status !== 'pending') {
      return c.json({ success: false, error: `Cannot approve bonus with status: ${bonus.status}` }, 400);
    }

    // Update bonus status
    await c.env.DB.prepare(`
      UPDATE teacher_year_end_bonuses
      SET status = 'approved',
          reviewed_by = ?,
          reviewed_at = datetime('now'),
          review_notes = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `).bind(adminId, notes || null, bonusId).run();

    return c.json({
      success: true,
      data: { id: bonusId, status: 'approved' }
    });
  } catch (error) {
    console.error('Error approving bonus:', error);
    return c.json({ success: false, error: 'Failed to approve bonus' }, 500);
  }
});


/**
 * POST /teacher-bonuses/admin/:id/reject
 * Reject a teacher's bonus
 */
teacherBonusesRouter.post('/admin/:id/reject', adminMiddleware, async (c) => {
  const bonusId = c.req.param('id');
  const adminId = c.get('userId');
  const { reason } = await c.req.json();

  if (!reason) {
    return c.json({ success: false, error: 'Rejection reason is required' }, 400);
  }

  try {
    const bonus = await c.env.DB.prepare(`
      SELECT * FROM teacher_year_end_bonuses WHERE id = ?
    `).bind(bonusId).first();

    if (!bonus) {
      return c.json({ success: false, error: 'Bonus not found' }, 404);
    }

    if (bonus.status === 'paid') {
      return c.json({ success: false, error: 'Cannot reject a paid bonus' }, 400);
    }

    await c.env.DB.prepare(`
      UPDATE teacher_year_end_bonuses
      SET status = 'rejected',
          reviewed_by = ?,
          reviewed_at = datetime('now'),
          review_notes = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `).bind(adminId, reason, bonusId).run();

    return c.json({
      success: true,
      data: { id: bonusId, status: 'rejected' }
    });
  } catch (error) {
    console.error('Error rejecting bonus:', error);
    return c.json({ success: false, error: 'Failed to reject bonus' }, 500);
  }
});


/**
 * POST /teacher-bonuses/admin/:id/payout
 * Process payout for an approved bonus
 */
teacherBonusesRouter.post('/admin/:id/payout', adminMiddleware, async (c) => {
  const bonusId = c.req.param('id');

  try {
    const bonus = await c.env.DB.prepare(`
      SELECT
        tyb.*,
        te.mobile_money_number,
        te.mobile_money_provider,
        u.name as teacher_name,
        u.email as teacher_email
      FROM teacher_year_end_bonuses tyb
      JOIN users u ON tyb.teacher_id = u.id
      LEFT JOIN teacher_earnings te ON tyb.teacher_id = te.teacher_id
      WHERE tyb.id = ?
    `).bind(bonusId).first();

    if (!bonus) {
      return c.json({ success: false, error: 'Bonus not found' }, 404);
    }

    if (bonus.status !== 'approved') {
      return c.json({ success: false, error: 'Bonus must be approved before payout' }, 400);
    }

    // Check if teacher has payout details
    if (!bonus.mobile_money_number) {
      return c.json({
        success: false,
        error: 'Teacher has not set up payout details'
      }, 400);
    }

    // Create payout record using affiliate_payouts table
    const payoutId = `payout_bonus_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Get or create teacher's affiliate profile for the payout
    let affiliateProfileId = bonus.affiliate_profile_id;
    if (!affiliateProfileId) {
      // Use teacher earnings record if no affiliate profile
      const teacherEarnings = await c.env.DB.prepare(`
        SELECT id FROM teacher_earnings WHERE teacher_id = ?
      `).bind(bonus.teacher_id).first();

      if (teacherEarnings) {
        affiliateProfileId = teacherEarnings.id;
      }
    }

    // Insert payout record
    await c.env.DB.prepare(`
      INSERT INTO affiliate_payouts (
        id, affiliate_id, amount, payment_method,
        mobile_money_number, mobile_money_provider,
        status, requested_at, admin_notes
      ) VALUES (?, ?, ?, 'mobile_money', ?, ?, 'pending', datetime('now'), ?)
    `).bind(
      payoutId,
      affiliateProfileId || bonus.teacher_id,
      bonus.bonus_amount * 100, // Convert to pesewas
      bonus.mobile_money_number,
      bonus.mobile_money_provider || 'mtn',
      `Year-end bonus for ${bonus.year}`
    ).run();

    // Update bonus record
    await c.env.DB.prepare(`
      UPDATE teacher_year_end_bonuses
      SET status = 'paid',
          payout_id = ?,
          paid_at = datetime('now'),
          updated_at = datetime('now')
      WHERE id = ?
    `).bind(payoutId, bonusId).run();

    // Update teacher earnings
    await c.env.DB.prepare(`
      INSERT INTO teacher_earnings (id, teacher_id, total_bonus_earnings, total_paid_out, last_payout_at, payout_count)
      VALUES (?, ?, ?, ?, datetime('now'), 1)
      ON CONFLICT(teacher_id) DO UPDATE SET
        total_bonus_earnings = total_bonus_earnings + ?,
        total_paid_out = total_paid_out + ?,
        last_payout_at = datetime('now'),
        payout_count = payout_count + 1,
        updated_at = datetime('now')
    `).bind(
      `earnings_${bonus.teacher_id}`,
      bonus.teacher_id,
      bonus.bonus_amount,
      bonus.bonus_amount,
      bonus.bonus_amount,
      bonus.bonus_amount
    ).run();

    return c.json({
      success: true,
      data: {
        bonusId,
        payoutId,
        amount: bonus.bonus_amount,
        status: 'paid',
        message: 'Payout initiated successfully'
      }
    });
  } catch (error) {
    console.error('Error processing payout:', error);
    return c.json({ success: false, error: 'Failed to process payout' }, 500);
  }
});


/**
 * GET /teacher-bonuses/admin/stats
 * Get summary statistics for teacher bonuses
 */
teacherBonusesRouter.get('/admin/stats', adminMiddleware, async (c) => {
  const year = parseInt(c.req.query('year') || new Date().getFullYear().toString());

  try {
    const statsResult = await c.env.DB.prepare(`
      SELECT
        COUNT(*) as total_bonuses,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status = 'calculated' THEN 1 ELSE 0 END) as calculated_count,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_count,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
        COALESCE(SUM(bonus_amount), 0) as total_bonus_amount,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN bonus_amount ELSE 0 END), 0) as paid_amount,
        COALESCE(SUM(CASE WHEN status = 'approved' THEN bonus_amount ELSE 0 END), 0) as pending_payout_amount,
        COALESCE(AVG(active_students), 0) as avg_active_students,
        COALESCE(MAX(active_students), 0) as max_active_students
      FROM teacher_year_end_bonuses
      WHERE year = ?
    `).bind(year).first();

    return c.json({
      success: true,
      data: {
        year,
        totalBonuses: statsResult?.total_bonuses || 0,
        byStatus: {
          pending: statsResult?.pending_count || 0,
          calculated: statsResult?.calculated_count || 0,
          approved: statsResult?.approved_count || 0,
          paid: statsResult?.paid_count || 0,
          rejected: statsResult?.rejected_count || 0
        },
        financials: {
          totalBonusAmount: statsResult?.total_bonus_amount || 0,
          paidAmount: statsResult?.paid_amount || 0,
          pendingPayoutAmount: statsResult?.pending_payout_amount || 0
        },
        averageActiveStudents: Math.round((statsResult?.avg_active_students as number) || 0),
        maxActiveStudents: statsResult?.max_active_students || 0
      }
    });
  } catch (error) {
    console.error('Error getting bonus stats:', error);
    return c.json({ success: false, error: 'Failed to get bonus statistics' }, 500);
  }
});


export default teacherBonusesRouter;
