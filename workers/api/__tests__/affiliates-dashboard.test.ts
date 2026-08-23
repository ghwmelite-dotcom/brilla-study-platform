import { describe, expect, it } from 'vitest';
import { sign } from 'hono/jwt';
import { affiliatesApp } from '../affiliates';
import { createMockD1 } from './helpers/mockD1';

const JWT_SECRET = 'test-secret-that-is-long-enough';

async function authorization(userId = 'student_1') {
  const now = Math.floor(Date.now() / 1000);
  const token = await sign({ userId, role: 'student', iat: now, exp: now + 3600 }, JWT_SECRET);
  return { Authorization: `Bearer ${token}` };
}

function dashboardDb() {
  const db = createMockD1([
    {
      match: /role, status, is_active, session_version FROM users/,
      first: () => ({ role: 'student', status: 'approved', is_active: 1, session_version: 0 }),
    },
    {
      match: /SELECT ap\.\*, u\.role, u\.school_name/,
      first: () => ({
        id: 'affiliate_1',
        user_id: 'student_1',
        referral_code: 'AMA123XY',
        tier_id: 'tier_scout',
        total_referrals: 8,
        successful_conversions: 3,
        total_clicks: 21,
        total_earnings: 84,
        pending_earnings: 24,
        available_earnings: 60,
        role: 'student',
      }),
    },
    {
      match: /referrals_this_month/,
      first: () => ({
        referrals_this_month: 4,
        conversions_this_month: 2,
        pending: 2,
        trial: 2,
        converted: 3,
        churned: 1,
      }),
    },
    { match: /COUNT\(\*\) as clicks_this_week/, first: () => ({ clicks_this_week: 7 }) },
    { match: /SUM\(amount\) as earnings_this_month/, first: () => ({ earnings_this_month: 36 }) },
    { match: /COUNT\(\*\) \+ 1 as rank/, first: () => ({ rank: 5 }) },
    { match: /COUNT\(\*\) as total[\s\S]*FROM affiliate_profiles/, first: () => ({ total: 40 }) },
    {
      match: /FROM affiliate_referrals ar/,
      all: () => ({
        results: [{
          id: 'referral_1',
          name: 'Private Student',
          role: 'student',
          status: 'pending',
          signup_at: '2026-08-23T00:00:00.000Z',
        }],
      }),
    },
    {
      match: /SELECT \* FROM affiliate_tiers WHERE id/,
      first: () => ({
        id: 'tier_scout',
        name: 'scout',
        title: 'Scout',
        commission_rate: 0.25,
        badge_icon: 'compass',
        badge_color: 'green',
      }),
    },
    { match: /FROM affiliate_campaigns/, all: () => ({ results: [] }) },
  ]);

  // This route has two legitimate unbound D1 reads. The shared lightweight
  // mock normally exposes operations after bind(), so adapt those calls here.
  const prepare = db.prepare.bind(db);
  db.prepare = ((sql: string) => {
    const statement = prepare(sql);
    return Object.assign(statement, {
      first: () => statement.bind().first(),
      all: () => statement.bind().all(),
    });
  }) as typeof db.prepare;

  return db;
}

describe('GET /dashboard — student Scout summary', () => {
  it('requires authentication', async () => {
    const response = await affiliatesApp.request('/dashboard', {}, {
      DB: dashboardDb(),
      JWT_SECRET,
      APP_URL: 'https://brillaprep.org',
    });

    expect(response.status).toBe(401);
  });

  it('returns own aggregate network statuses and keeps the user id server-derived', async () => {
    const db = dashboardDb();
    const response = await affiliatesApp.request('/dashboard?summary=1', {
      headers: await authorization(),
    }, {
      DB: db,
      JWT_SECRET,
      APP_URL: 'https://brillaprep.org',
    });

    expect(response.status).toBe(200);
    const body = await response.json() as {
      success: boolean;
      data: {
        networkStatus: { pending: number; trial: number; converted: number; churned: number };
        referralCode: string;
        referralLink: string;
      };
    };

    expect(body).toMatchObject({
      success: true,
      data: {
        networkStatus: { pending: 2, trial: 2, converted: 3, churned: 1 },
        referralCode: 'AMA123XY',
        referralLink: 'https://brillaprep.org/ref/AMA123XY',
      },
    });

    const profileLookup = db.calls.find((call) => call.sql.includes('SELECT ap.*'));
    const statusLookup = db.calls.find((call) => call.sql.includes('referrals_this_month'));
    expect(profileLookup?.binds).toEqual(['student_1']);
    expect(statusLookup?.binds[2]).toBe('affiliate_1');
    expect(db.calls.some((call) => call.sql.includes('JOIN users u ON ar.referred_user_id'))).toBe(false);
    expect(body.data).not.toHaveProperty('recentReferrals.0.name');
  });
});
