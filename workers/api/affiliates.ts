import { Hono } from 'hono';

// Types for Cloudflare bindings
interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  APP_URL: string;
}

// Generate unique referral code
function generateReferralCode(name: string): string {
  const cleanName = name.replace(/[^a-zA-Z]/g, '').toUpperCase().substring(0, 4);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${cleanName}${random}`;
}

// Hash IP address for privacy
function hashIP(ip: string): string {
  // Simple hash for demo - use proper hashing in production
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// =============================================
// AFFILIATES API
// =============================================

export const affiliatesApp = new Hono<{ Bindings: Env }>();

// Join affiliate program
affiliatesApp.post('/join', async (c) => {
  try {
    const userId = c.get('userId') as string;

    // Check if already an affiliate
    const existing = await c.env.DB.prepare(`
      SELECT id FROM affiliate_profiles WHERE user_id = ?
    `).bind(userId).first();

    if (existing) {
      return c.json({ success: false, error: 'You are already an affiliate' }, 400);
    }

    // Get user info
    const user = await c.env.DB.prepare(`
      SELECT name, email, role, school_name FROM users WHERE id = ?
    `).bind(userId).first();

    if (!user) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    // Generate unique referral code
    let referralCode = generateReferralCode(user.name as string);

    // Ensure uniqueness
    let attempts = 0;
    while (attempts < 10) {
      const codeExists = await c.env.DB.prepare(`
        SELECT id FROM affiliate_profiles WHERE referral_code = ?
      `).bind(referralCode).first();

      if (!codeExists) break;
      referralCode = generateReferralCode(user.name as string);
      attempts++;
    }

    // Create affiliate profile
    const affiliateId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO affiliate_profiles (
        id, user_id, referral_code, tier_id
      ) VALUES (?, ?, ?, 'tier_scout')
    `).bind(affiliateId, userId, referralCode).run();

    // Update user
    await c.env.DB.prepare(`
      UPDATE users SET is_affiliate = 1 WHERE id = ?
    `).bind(userId).run();

    // Get tier info
    const tier = await c.env.DB.prepare(`
      SELECT * FROM affiliate_tiers WHERE id = 'tier_scout'
    `).first();

    return c.json({
      success: true,
      data: {
        affiliateId,
        referralCode,
        referralLink: `${c.env.APP_URL}/ref/${referralCode}`,
        tier: {
          id: tier?.id,
          name: tier?.name,
          title: tier?.title,
          commissionRate: tier?.commission_rate,
          badgeIcon: tier?.badge_icon,
          badgeColor: tier?.badge_color,
        },
      },
    });
  } catch (error) {
    console.error('Join affiliate error:', error);
    return c.json({ success: false, error: 'Failed to join affiliate program' }, 500);
  }
});

// Get affiliate profile
affiliatesApp.get('/profile', async (c) => {
  try {
    const userId = c.get('userId') as string;

    const profile = await c.env.DB.prepare(`
      SELECT
        ap.*,
        u.name, u.email, u.role, u.school_name, u.affiliate_xp,
        at.name as tier_name, at.title as tier_title,
        at.commission_rate, at.badge_icon, at.badge_color,
        at.min_referrals, at.max_referrals, at.perks
      FROM affiliate_profiles ap
      JOIN users u ON ap.user_id = u.id
      JOIN affiliate_tiers at ON ap.tier_id = at.id
      WHERE ap.user_id = ?
    `).bind(userId).first();

    if (!profile) {
      return c.json({ success: false, error: 'Affiliate profile not found' }, 404);
    }

    // Get next tier
    const nextTier = await c.env.DB.prepare(`
      SELECT * FROM affiliate_tiers
      WHERE min_referrals > ?
      ORDER BY min_referrals ASC
      LIMIT 1
    `).bind(profile.min_referrals).first();

    // Calculate effective referrals (teachers get 1.5x)
    let effectiveReferrals = profile.successful_conversions as number;
    if (profile.role === 'teacher') {
      effectiveReferrals = Math.floor(effectiveReferrals * 1.5);
    }

    // Calculate referrals needed for next tier
    let referralsToNextTier = null;
    if (nextTier) {
      referralsToNextTier = (nextTier.min_referrals as number) - effectiveReferrals;
    }

    // Calculate conversion rate
    const conversionRate = profile.total_referrals > 0
      ? ((profile.successful_conversions as number) / (profile.total_referrals as number)) * 100
      : 0;

    return c.json({
      success: true,
      data: {
        id: profile.id,
        userId: profile.user_id,
        referralCode: profile.referral_code,
        referralLink: `${c.env.APP_URL}/ref/${profile.referral_code}`,
        tier: {
          id: profile.tier_id,
          name: profile.tier_name,
          title: profile.tier_title,
          commissionRate: profile.commission_rate,
          badgeIcon: profile.badge_icon,
          badgeColor: profile.badge_color,
          perks: JSON.parse((profile.perks as string) || '[]'),
        },
        stats: {
          totalReferrals: profile.total_referrals,
          successfulConversions: profile.successful_conversions,
          effectiveReferrals,
          totalClicks: profile.total_clicks,
          conversionRate: Math.round(conversionRate * 10) / 10,
          totalEarnings: profile.total_earnings,
          pendingEarnings: profile.pending_earnings,
          availableEarnings: profile.available_earnings,
          affiliateXP: profile.affiliate_xp,
        },
        nextTier: nextTier ? {
          id: nextTier.id,
          name: nextTier.name,
          title: nextTier.title,
          commissionRate: nextTier.commission_rate,
          badgeIcon: nextTier.badge_icon,
          minReferrals: nextTier.min_referrals,
          referralsNeeded: referralsToNextTier,
        } : null,
        isTeacher: profile.role === 'teacher',
        teacherBonus: profile.role === 'teacher' ? 1.5 : 1,
        mobileMoneyNumber: profile.mobile_money_number,
        mobileMoneyProvider: profile.mobile_money_provider,
        joinedAt: profile.joined_at,
        lastReferralAt: profile.last_referral_at,
      },
    });
  } catch (error) {
    console.error('Get affiliate profile error:', error);
    return c.json({ success: false, error: 'Failed to fetch affiliate profile' }, 500);
  }
});

// Get affiliate dashboard stats
affiliatesApp.get('/dashboard', async (c) => {
  try {
    const userId = c.get('userId') as string;

    const profile = await c.env.DB.prepare(`
      SELECT ap.*, u.role, u.school_name
      FROM affiliate_profiles ap
      JOIN users u ON ap.user_id = u.id
      WHERE ap.user_id = ?
    `).bind(userId).first();

    if (!profile) {
      return c.json({ success: false, error: 'Affiliate profile not found' }, 404);
    }

    // Get this month's stats
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const monthStats = await c.env.DB.prepare(`
      SELECT
        COUNT(*) as referrals_this_month,
        SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) as conversions_this_month
      FROM affiliate_referrals
      WHERE affiliate_id = ? AND signup_at >= ?
    `).bind(profile.id, monthStart.toISOString()).first();

    // Get this week's clicks
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekClicks = await c.env.DB.prepare(`
      SELECT COUNT(*) as clicks_this_week
      FROM affiliate_clicks
      WHERE affiliate_id = ? AND clicked_at >= ?
    `).bind(profile.id, weekStart.toISOString()).first();

    // Get earnings this month
    const monthEarnings = await c.env.DB.prepare(`
      SELECT SUM(amount) as earnings_this_month
      FROM affiliate_commissions
      WHERE affiliate_id = ? AND created_at >= ? AND status IN ('approved', 'paid')
    `).bind(profile.id, monthStart.toISOString()).first();

    // Get rank
    const rank = await c.env.DB.prepare(`
      SELECT COUNT(*) + 1 as rank
      FROM affiliate_profiles
      WHERE successful_conversions > ?
    `).bind(profile.successful_conversions).first();

    // Get total affiliates for ranking context
    const totalAffiliates = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM affiliate_profiles WHERE is_active = 1
    `).first();

    // Get recent activity
    const recentReferrals = await c.env.DB.prepare(`
      SELECT
        ar.*,
        u.name, u.role, u.avatar_url
      FROM affiliate_referrals ar
      JOIN users u ON ar.referred_user_id = u.id
      WHERE ar.affiliate_id = ?
      ORDER BY ar.signup_at DESC
      LIMIT 5
    `).bind(profile.id).all();

    // Get tier info
    const tier = await c.env.DB.prepare(`
      SELECT * FROM affiliate_tiers WHERE id = ?
    `).bind(profile.tier_id).first();

    // Get active campaigns
    const campaigns = await c.env.DB.prepare(`
      SELECT * FROM affiliate_campaigns
      WHERE is_active = 1 AND start_date <= datetime('now') AND end_date >= datetime('now')
    `).all();

    return c.json({
      success: true,
      data: {
        stats: {
          totalReferrals: profile.total_referrals,
          referralsThisMonth: monthStats?.referrals_this_month || 0,
          conversionsThisMonth: monthStats?.conversions_this_month || 0,
          successfulConversions: profile.successful_conversions,
          clicksThisWeek: weekClicks?.clicks_this_week || 0,
          totalClicks: profile.total_clicks,
          earningsThisMonth: monthEarnings?.earnings_this_month || 0,
          totalEarnings: profile.total_earnings,
          pendingEarnings: profile.pending_earnings,
          availableEarnings: profile.available_earnings,
          conversionRate: profile.total_referrals > 0
            ? Math.round(((profile.successful_conversions as number) / (profile.total_referrals as number)) * 1000) / 10
            : 0,
        },
        ranking: {
          rank: rank?.rank || 1,
          totalParticipants: totalAffiliates?.total || 1,
          percentile: totalAffiliates?.total
            ? Math.round((1 - ((rank?.rank as number) - 1) / (totalAffiliates.total as number)) * 100)
            : 100,
        },
        tier: tier ? {
          id: tier.id,
          name: tier.name,
          title: tier.title,
          commissionRate: tier.commission_rate,
          badgeIcon: tier.badge_icon,
          badgeColor: tier.badge_color,
        } : null,
        recentReferrals: recentReferrals.results.map((r: Record<string, unknown>) => ({
          id: r.id,
          name: r.name,
          role: r.role,
          avatarUrl: r.avatar_url,
          status: r.status,
          signupAt: r.signup_at,
          convertedAt: r.converted_at,
        })),
        activeCampaigns: campaigns.results.map((c: Record<string, unknown>) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          commissionMultiplier: c.commission_multiplier,
          bonusXPMultiplier: c.bonus_xp_multiplier,
          endDate: c.end_date,
        })),
        referralCode: profile.referral_code,
        referralLink: `${c.env.APP_URL}/ref/${profile.referral_code}`,
      },
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    return c.json({ success: false, error: 'Failed to fetch dashboard' }, 500);
  }
});

// Get referrals list
affiliatesApp.get('/referrals', async (c) => {
  try {
    const userId = c.get('userId') as string;
    const status = c.req.query('status');
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = parseInt(c.req.query('offset') || '0');

    const profile = await c.env.DB.prepare(`
      SELECT id FROM affiliate_profiles WHERE user_id = ?
    `).bind(userId).first();

    if (!profile) {
      return c.json({ success: false, error: 'Affiliate profile not found' }, 404);
    }

    let query = `
      SELECT
        ar.*,
        u.name, u.email, u.role, u.avatar_url, u.school_name,
        ac.amount as commission_amount, ac.status as commission_status
      FROM affiliate_referrals ar
      JOIN users u ON ar.referred_user_id = u.id
      LEFT JOIN affiliate_commissions ac ON ar.id = ac.referral_id
      WHERE ar.affiliate_id = ?
    `;

    const params: unknown[] = [profile.id];

    if (status) {
      query += ` AND ar.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY ar.signup_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const { results } = await c.env.DB.prepare(query).bind(...params).all();

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM affiliate_referrals WHERE affiliate_id = ?`;
    const countParams: unknown[] = [profile.id];
    if (status) {
      countQuery += ` AND status = ?`;
      countParams.push(status);
    }
    const countResult = await c.env.DB.prepare(countQuery).bind(...countParams).first();

    return c.json({
      success: true,
      data: {
        referrals: results.map((r: Record<string, unknown>) => ({
          id: r.id,
          referredUser: {
            id: r.referred_user_id,
            name: r.name,
            email: r.email,
            role: r.role,
            avatarUrl: r.avatar_url,
            schoolName: r.school_name,
          },
          status: r.status,
          signupAt: r.signup_at,
          convertedAt: r.converted_at,
          commission: r.commission_amount ? {
            amount: r.commission_amount,
            status: r.commission_status,
          } : null,
        })),
        total: countResult?.total || 0,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('Get referrals error:', error);
    return c.json({ success: false, error: 'Failed to fetch referrals' }, 500);
  }
});

// Get commission history
affiliatesApp.get('/commissions', async (c) => {
  try {
    const userId = c.get('userId') as string;
    const status = c.req.query('status');
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = parseInt(c.req.query('offset') || '0');

    const profile = await c.env.DB.prepare(`
      SELECT id FROM affiliate_profiles WHERE user_id = ?
    `).bind(userId).first();

    if (!profile) {
      return c.json({ success: false, error: 'Affiliate profile not found' }, 404);
    }

    let query = `
      SELECT
        ac.*,
        u.name as referred_user_name, u.role as referred_user_role,
        pt.plan_type, pt.billing_cycle, pt.amount as transaction_amount
      FROM affiliate_commissions ac
      JOIN affiliate_referrals ar ON ac.referral_id = ar.id
      JOIN users u ON ar.referred_user_id = u.id
      LEFT JOIN payment_transactions pt ON ac.transaction_id = pt.id
      WHERE ac.affiliate_id = ?
    `;

    const params: unknown[] = [profile.id];

    if (status) {
      query += ` AND ac.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY ac.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const { results } = await c.env.DB.prepare(query).bind(...params).all();

    return c.json({
      success: true,
      data: results.map((c: Record<string, unknown>) => ({
        id: c.id,
        referredUserName: c.referred_user_name,
        referredUserRole: c.referred_user_role,
        amount: c.amount,
        commissionRate: c.commission_rate,
        status: c.status,
        transaction: c.transaction_id ? {
          planType: c.plan_type,
          billingCycle: c.billing_cycle,
          amount: c.transaction_amount,
        } : null,
        createdAt: c.created_at,
        approvedAt: c.approved_at,
        paidAt: c.paid_at,
      })),
    });
  } catch (error) {
    console.error('Get commissions error:', error);
    return c.json({ success: false, error: 'Failed to fetch commissions' }, 500);
  }
});

// Get affiliate leaderboard
affiliatesApp.get('/leaderboard', async (c) => {
  try {
    const period = c.req.query('period') || 'monthly';
    const limit = parseInt(c.req.query('limit') || '50');

    // Calculate period value
    let periodValue = '';
    if (period === 'monthly') {
      const now = new Date();
      periodValue = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    } else if (period === 'weekly') {
      const now = new Date();
      const weekNum = Math.ceil((now.getDate() - now.getDay() + 1) / 7);
      periodValue = `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
    }

    const { results } = await c.env.DB.prepare(`
      SELECT
        ap.id, ap.referral_code, ap.successful_conversions, ap.total_earnings,
        u.name, u.avatar_url, u.school_name, u.role,
        at.title as tier_title, at.badge_icon, at.badge_color
      FROM affiliate_profiles ap
      JOIN users u ON ap.user_id = u.id
      JOIN affiliate_tiers at ON ap.tier_id = at.id
      WHERE ap.is_active = 1
      ORDER BY ap.successful_conversions DESC, ap.total_earnings DESC
      LIMIT ?
    `).bind(limit).all();

    // Add rank
    const leaderboard = results.map((entry: Record<string, unknown>, index: number) => ({
      rank: index + 1,
      affiliateId: entry.id,
      name: entry.name,
      avatarUrl: entry.avatar_url,
      schoolName: entry.school_name,
      isTeacher: entry.role === 'teacher',
      tier: {
        title: entry.tier_title,
        badgeIcon: entry.badge_icon,
        badgeColor: entry.badge_color,
      },
      conversions: entry.successful_conversions,
      earnings: entry.total_earnings,
    }));

    return c.json({
      success: true,
      data: {
        period,
        periodValue,
        leaderboard,
      },
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    return c.json({ success: false, error: 'Failed to fetch leaderboard' }, 500);
  }
});

// Get school leaderboard
affiliatesApp.get('/leaderboard/schools', async (c) => {
  try {
    const period = c.req.query('period') || 'monthly';
    const limit = parseInt(c.req.query('limit') || '20');

    const { results } = await c.env.DB.prepare(`
      SELECT
        u.school_name,
        COUNT(DISTINCT ap.id) as total_affiliates,
        SUM(ap.total_referrals) as total_referrals,
        SUM(ap.successful_conversions) as total_conversions,
        SUM(ap.total_earnings) as total_earnings
      FROM affiliate_profiles ap
      JOIN users u ON ap.user_id = u.id
      WHERE ap.is_active = 1 AND u.school_name IS NOT NULL AND u.school_name != ''
      GROUP BY u.school_name
      ORDER BY total_conversions DESC, total_referrals DESC
      LIMIT ?
    `).bind(limit).all();

    const schoolLeaderboard = results.map((entry: Record<string, unknown>, index: number) => ({
      rank: index + 1,
      schoolName: entry.school_name,
      totalAffiliates: entry.total_affiliates,
      totalReferrals: entry.total_referrals,
      totalConversions: entry.total_conversions,
      totalEarnings: entry.total_earnings,
    }));

    return c.json({
      success: true,
      data: {
        period,
        leaderboard: schoolLeaderboard,
      },
    });
  } catch (error) {
    console.error('Get school leaderboard error:', error);
    return c.json({ success: false, error: 'Failed to fetch school leaderboard' }, 500);
  }
});

// Get affiliate challenges
affiliatesApp.get('/challenges', async (c) => {
  try {
    const userId = c.get('userId') as string;

    const profile = await c.env.DB.prepare(`
      SELECT id FROM affiliate_profiles WHERE user_id = ?
    `).bind(userId).first();

    if (!profile) {
      return c.json({ success: false, error: 'Affiliate profile not found' }, 404);
    }

    // Get all active challenges
    const { results: challenges } = await c.env.DB.prepare(`
      SELECT * FROM affiliate_challenges
      WHERE is_active = 1
      AND (start_date IS NULL OR start_date <= datetime('now'))
      AND (end_date IS NULL OR end_date >= datetime('now'))
    `).all();

    // Get user's progress on challenges
    const { results: userProgress } = await c.env.DB.prepare(`
      SELECT * FROM user_affiliate_challenges WHERE user_id = ?
    `).bind(userId).all();

    const progressMap = new Map(
      userProgress.map((p: Record<string, unknown>) => [p.challenge_id, p])
    );

    const challengesWithProgress = challenges.map((challenge: Record<string, unknown>) => {
      const progress = progressMap.get(challenge.id as string);

      return {
        id: challenge.id,
        name: challenge.name,
        description: challenge.description,
        type: challenge.challenge_type,
        requirementType: challenge.requirement_type,
        requirementValue: challenge.requirement_value,
        progress: progress?.progress || 0,
        status: progress?.status || 'active',
        xpReward: challenge.xp_reward,
        cashBonus: challenge.cash_bonus,
        badgeIcon: challenge.badge_icon,
        badgeColor: challenge.badge_color,
        endsAt: challenge.end_date,
      };
    });

    return c.json({
      success: true,
      data: challengesWithProgress,
    });
  } catch (error) {
    console.error('Get challenges error:', error);
    return c.json({ success: false, error: 'Failed to fetch challenges' }, 500);
  }
});

// Claim challenge reward
affiliatesApp.post('/challenges/:challengeId/claim', async (c) => {
  try {
    const userId = c.get('userId') as string;
    const challengeId = c.req.param('challengeId');

    // Get challenge
    const challenge = await c.env.DB.prepare(`
      SELECT * FROM affiliate_challenges WHERE id = ?
    `).bind(challengeId).first();

    if (!challenge) {
      return c.json({ success: false, error: 'Challenge not found' }, 404);
    }

    // Get user progress
    const progress = await c.env.DB.prepare(`
      SELECT * FROM user_affiliate_challenges
      WHERE user_id = ? AND challenge_id = ?
    `).bind(userId, challengeId).first();

    if (!progress) {
      return c.json({ success: false, error: 'Challenge not started' }, 400);
    }

    if (progress.status === 'claimed') {
      return c.json({ success: false, error: 'Reward already claimed' }, 400);
    }

    if ((progress.progress as number) < (challenge.requirement_value as number)) {
      return c.json({ success: false, error: 'Challenge not completed' }, 400);
    }

    // Claim reward
    await c.env.DB.prepare(`
      UPDATE user_affiliate_challenges
      SET status = 'claimed', claimed_at = datetime('now'),
          xp_earned = ?, cash_earned = ?
      WHERE id = ?
    `).bind(challenge.xp_reward, challenge.cash_bonus, progress.id).run();

    // Award XP
    if (challenge.xp_reward) {
      await c.env.DB.prepare(`
        UPDATE users SET affiliate_xp = affiliate_xp + ? WHERE id = ?
      `).bind(challenge.xp_reward, userId).run();
    }

    // Award cash bonus to available earnings
    if (challenge.cash_bonus) {
      await c.env.DB.prepare(`
        UPDATE affiliate_profiles
        SET available_earnings = available_earnings + ?
        WHERE user_id = ?
      `).bind(challenge.cash_bonus, userId).run();
    }

    return c.json({
      success: true,
      data: {
        xpAwarded: challenge.xp_reward,
        cashAwarded: challenge.cash_bonus,
        message: 'Reward claimed successfully!',
      },
    });
  } catch (error) {
    console.error('Claim challenge error:', error);
    return c.json({ success: false, error: 'Failed to claim reward' }, 500);
  }
});

// Get affiliate achievements
affiliatesApp.get('/achievements', async (c) => {
  try {
    const userId = c.get('userId') as string;

    // Get all achievements
    const { results: achievements } = await c.env.DB.prepare(`
      SELECT * FROM affiliate_achievements
      WHERE is_secret = 0
      ORDER BY requirement_value ASC
    `).all();

    // Get user's unlocked achievements
    const { results: unlocked } = await c.env.DB.prepare(`
      SELECT achievement_id, unlocked_at FROM user_affiliate_achievements
      WHERE user_id = ?
    `).bind(userId).all();

    const unlockedMap = new Map(
      unlocked.map((u: Record<string, unknown>) => [u.achievement_id, u.unlocked_at])
    );

    // Get user's current stats for progress
    const profile = await c.env.DB.prepare(`
      SELECT ap.*, u.affiliate_xp
      FROM affiliate_profiles ap
      JOIN users u ON ap.user_id = u.id
      WHERE ap.user_id = ?
    `).bind(userId).first();

    const achievementsWithProgress = achievements.map((ach: Record<string, unknown>) => {
      const isUnlocked = unlockedMap.has(ach.id as string);

      // Calculate progress based on requirement type
      let currentProgress = 0;
      if (profile) {
        switch (ach.requirement_type) {
          case 'referrals':
            currentProgress = profile.total_referrals as number;
            break;
          case 'conversions':
            currentProgress = profile.successful_conversions as number;
            break;
          case 'earnings':
            currentProgress = profile.total_earnings as number;
            break;
        }
      }

      return {
        id: ach.id,
        name: ach.name,
        description: ach.description,
        icon: ach.icon,
        requirementType: ach.requirement_type,
        requirementValue: ach.requirement_value,
        currentProgress: Math.min(currentProgress, ach.requirement_value as number),
        xpReward: ach.xp_reward,
        cashBonus: ach.cash_bonus,
        unlocked: isUnlocked,
        unlockedAt: unlockedMap.get(ach.id as string),
      };
    });

    return c.json({
      success: true,
      data: achievementsWithProgress,
    });
  } catch (error) {
    console.error('Get achievements error:', error);
    return c.json({ success: false, error: 'Failed to fetch achievements' }, 500);
  }
});

// Track referral link click (public endpoint)
affiliatesApp.get('/ref/:code', async (c) => {
  try {
    const code = c.req.param('code');

    // Get affiliate by code
    const affiliate = await c.env.DB.prepare(`
      SELECT id FROM affiliate_profiles WHERE referral_code = ? AND is_active = 1
    `).bind(code).first();

    if (!affiliate) {
      // Redirect to homepage anyway
      return c.redirect(c.env.APP_URL);
    }

    // Track click
    const clickId = crypto.randomUUID();
    const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || '';
    const userAgent = c.req.header('user-agent') || '';
    const referrer = c.req.header('referer') || '';

    await c.env.DB.prepare(`
      INSERT INTO affiliate_clicks (id, affiliate_id, ip_hash, user_agent, referrer_url, landing_page)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      clickId,
      affiliate.id,
      hashIP(ip),
      userAgent.substring(0, 255),
      referrer.substring(0, 500),
      '/register'
    ).run();

    // Update click count
    await c.env.DB.prepare(`
      UPDATE affiliate_profiles SET total_clicks = total_clicks + 1 WHERE id = ?
    `).bind(affiliate.id).run();

    // Redirect to register page with referral code
    return c.redirect(`${c.env.APP_URL}/register?ref=${code}`);
  } catch (error) {
    console.error('Track referral click error:', error);
    return c.redirect(c.env.APP_URL);
  }
});

// Process referral (called during user registration)
affiliatesApp.post('/process-referral', async (c) => {
  try {
    const { referralCode, newUserId } = await c.req.json();

    if (!referralCode || !newUserId) {
      return c.json({ success: false, error: 'Missing required fields' }, 400);
    }

    // Get affiliate by code
    const affiliate = await c.env.DB.prepare(`
      SELECT ap.*, u.role as affiliate_role
      FROM affiliate_profiles ap
      JOIN users u ON ap.user_id = u.id
      WHERE ap.referral_code = ? AND ap.is_active = 1
    `).bind(referralCode).first();

    if (!affiliate) {
      return c.json({ success: false, error: 'Invalid referral code' }, 400);
    }

    // Check if user already referred
    const existing = await c.env.DB.prepare(`
      SELECT id FROM affiliate_referrals WHERE referred_user_id = ?
    `).bind(newUserId).first();

    if (existing) {
      return c.json({ success: false, error: 'User already referred' }, 400);
    }

    // Create referral record
    const referralId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO affiliate_referrals (id, affiliate_id, referred_user_id, status)
      VALUES (?, ?, ?, 'pending')
    `).bind(referralId, affiliate.id, newUserId).run();

    // Update affiliate stats
    await c.env.DB.prepare(`
      UPDATE affiliate_profiles
      SET total_referrals = total_referrals + 1, last_referral_at = datetime('now')
      WHERE id = ?
    `).bind(affiliate.id).run();

    // Update referred user
    await c.env.DB.prepare(`
      UPDATE users SET referred_by = ? WHERE id = ?
    `).bind(referralCode, newUserId).run();

    // Award XP for referral
    await c.env.DB.prepare(`
      UPDATE users SET affiliate_xp = affiliate_xp + 50 WHERE id = ?
    `).bind(affiliate.user_id).run();

    // Update challenge progress
    await updateChallengeProgress(c.env.DB, affiliate.user_id as string, 'referrals', 1);

    // Check achievements
    await checkAffiliateAchievements(c.env.DB, affiliate.user_id as string);

    return c.json({
      success: true,
      data: { referralId },
    });
  } catch (error) {
    console.error('Process referral error:', error);
    return c.json({ success: false, error: 'Failed to process referral' }, 500);
  }
});

// Update referral status when user starts trial
affiliatesApp.post('/referral/trial-started', async (c) => {
  try {
    const { userId } = await c.req.json();

    await c.env.DB.prepare(`
      UPDATE affiliate_referrals
      SET status = 'trial', trial_started_at = datetime('now')
      WHERE referred_user_id = ? AND status = 'pending'
    `).bind(userId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Update referral trial error:', error);
    return c.json({ success: false, error: 'Failed to update referral' }, 500);
  }
});

// Helper function to update challenge progress
async function updateChallengeProgress(
  db: D1Database,
  userId: string,
  requirementType: string,
  incrementBy: number = 1
): Promise<void> {
  try {
    // Get relevant challenges
    const { results: challenges } = await db.prepare(`
      SELECT id, requirement_value FROM affiliate_challenges
      WHERE requirement_type = ? AND is_active = 1
    `).bind(requirementType).all();

    for (const challenge of challenges) {
      // Upsert progress
      await db.prepare(`
        INSERT INTO user_affiliate_challenges (id, user_id, challenge_id, progress, status)
        VALUES (?, ?, ?, ?, 'active')
        ON CONFLICT(user_id, challenge_id) DO UPDATE SET
        progress = progress + ?,
        status = CASE
          WHEN progress + ? >= ? THEN 'completed'
          ELSE status
        END,
        completed_at = CASE
          WHEN progress + ? >= ? AND completed_at IS NULL THEN datetime('now')
          ELSE completed_at
        END
      `).bind(
        crypto.randomUUID(),
        userId,
        challenge.id,
        incrementBy,
        incrementBy,
        incrementBy,
        challenge.requirement_value,
        incrementBy,
        challenge.requirement_value
      ).run();
    }
  } catch (error) {
    console.error('Update challenge progress error:', error);
  }
}

// Helper function to check and unlock achievements
async function checkAffiliateAchievements(
  db: D1Database,
  userId: string
): Promise<void> {
  try {
    // Get user's affiliate stats
    const profile = await db.prepare(`
      SELECT * FROM affiliate_profiles WHERE user_id = ?
    `).bind(userId).first();

    if (!profile) return;

    // Get achievements not yet unlocked
    const { results: achievements } = await db.prepare(`
      SELECT aa.* FROM affiliate_achievements aa
      LEFT JOIN user_affiliate_achievements uaa ON aa.id = uaa.achievement_id AND uaa.user_id = ?
      WHERE uaa.id IS NULL
    `).bind(userId).all();

    for (const ach of achievements) {
      let currentValue = 0;

      switch (ach.requirement_type) {
        case 'referrals':
          currentValue = profile.total_referrals as number;
          break;
        case 'conversions':
          currentValue = profile.successful_conversions as number;
          break;
        case 'earnings':
          currentValue = profile.total_earnings as number;
          break;
      }

      if (currentValue >= (ach.requirement_value as number)) {
        // Unlock achievement
        await db.prepare(`
          INSERT INTO user_affiliate_achievements (id, user_id, achievement_id)
          VALUES (?, ?, ?)
        `).bind(crypto.randomUUID(), userId, ach.id).run();

        // Award XP
        if (ach.xp_reward) {
          await db.prepare(`
            UPDATE users SET affiliate_xp = affiliate_xp + ? WHERE id = ?
          `).bind(ach.xp_reward, userId).run();
        }

        // Award cash bonus
        if (ach.cash_bonus) {
          await db.prepare(`
            UPDATE affiliate_profiles
            SET available_earnings = available_earnings + ?
            WHERE user_id = ?
          `).bind(ach.cash_bonus, userId).run();
        }
      }
    }
  } catch (error) {
    console.error('Check achievements error:', error);
  }
}

export default affiliatesApp;
