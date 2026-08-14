import { Hono } from 'hono';
import { requireAuth } from './auth-middleware';
import { awardPoints } from './points';
import { getDemoDataFlags } from './demoUtils';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

interface UserPayload {
  userId: string;
  email: string;
  role: string;
}

interface UserRewardStatsRow {
  weekly_wheel_spins: number;
  week_start: string | null;
  last_wheel_spin: string | null;
  total_chests_opened: number;
  total_wheel_spins: number;
  surprise_challenges_completed: number;
}

const rewardsApp = new Hono<{ Bindings: Env; Variables: { user: UserPayload } }>();

// All rewards routes require a verified JWT (sets user on context).
rewardsApp.use('*', requireAuth);

const generateId = () => `rwd_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

// Chest configurations
const chestConfig = {
  bronze: { minXp: 25, maxXp: 75, cosmeticChance: 0.05, protectionChance: 0.1 },
  silver: { minXp: 50, maxXp: 150, cosmeticChance: 0.15, protectionChance: 0.2 },
  gold: { minXp: 100, maxXp: 300, cosmeticChance: 0.3, protectionChance: 0.3 },
  diamond: { minXp: 200, maxXp: 500, cosmeticChance: 0.5, protectionChance: 0.4 },
};

// Wheel segments
const wheelSegments = [
  { id: 1, type: 'xp', value: 50, label: '50 XP', probability: 0.25 },
  { id: 2, type: 'xp', value: 100, label: '100 XP', probability: 0.2 },
  { id: 3, type: 'xp', value: 200, label: '200 XP', probability: 0.1 },
  { id: 4, type: 'multiplier', value: 1.5, label: '1.5x Multiplier', probability: 0.15 },
  { id: 5, type: 'multiplier', value: 2.0, label: '2x Multiplier', probability: 0.1 },
  { id: 6, type: 'protection', value: 1, label: 'Streak Shield', probability: 0.1 },
  { id: 7, type: 'chest', value: 'silver', label: 'Silver Chest', probability: 0.07 },
  { id: 8, type: 'chest', value: 'gold', label: 'Gold Chest', probability: 0.03 },
];

// =============================================
// REWARDS ENDPOINTS
// =============================================

// Get daily multiplier
rewardsApp.get('/daily-multiplier', async (c) => {
  try {
    const user = c.get('user');
    const today = new Date().toISOString().split('T')[0];

    let multiplier = await c.env.DB.prepare(
      'SELECT * FROM daily_multipliers WHERE user_id = ? AND date = ?'
    ).bind(user.userId, today).first();

    // Generate new multiplier if none exists
    if (!multiplier) {
      // Random multiplier between 1.5 and 10
      const multiplierValue = Math.random() < 0.7
        ? 1.5 + Math.random() * 0.5 // 70% chance: 1.5-2x
        : Math.random() < 0.9
          ? 2 + Math.random() * 1 // 27% chance: 2-3x
          : 3 + Math.random() * 7; // 3% chance: 3-10x

      const roundedMultiplier = Math.round(multiplierValue * 10) / 10;
      const expiresAt = new Date();
      expiresAt.setHours(23, 59, 59, 999);

      await c.env.DB.prepare(`
        INSERT INTO daily_multipliers (id, user_id, multiplier, date, expires_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(generateId(), user.userId, roundedMultiplier, today, expiresAt.toISOString()).run();

      multiplier = await c.env.DB.prepare(
        'SELECT * FROM daily_multipliers WHERE user_id = ? AND date = ?'
      ).bind(user.userId, today).first();
    }

    return c.json({
      success: true,
      data: {
        multiplier: multiplier?.multiplier,
        appliesTo: multiplier?.applies_to || 'all',
        targetId: multiplier?.target_id,
        used: !!multiplier?.used,
        expiresAt: multiplier?.expires_at,
      },
    });
  } catch (error) {
    console.error('Error fetching daily multiplier:', error);
    return c.json({ success: false, error: 'Failed to fetch multiplier' }, 500);
  }
});

// Get available chests
rewardsApp.get('/chests', async (c) => {
  try {
    const user = c.get('user');

    const chests = await c.env.DB.prepare(`
      SELECT * FROM mystery_chests
      WHERE user_id = ? AND status = 'available'
      ORDER BY
        CASE chest_type
          WHEN 'diamond' THEN 1
          WHEN 'gold' THEN 2
          WHEN 'silver' THEN 3
          ELSE 4
        END
    `).bind(user.userId).all();

    return c.json({
      success: true,
      data: {
        chests: chests.results.map((chest: any) => ({
          id: chest.id,
          chestType: chest.chest_type,
          source: chest.source,
          expiresAt: chest.expires_at,
          createdAt: chest.created_at,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching chests:', error);
    return c.json({ success: false, error: 'Failed to fetch chests' }, 500);
  }
});

// Open a chest
rewardsApp.post('/chests/:chestId/open', async (c) => {
  try {
    const user = c.get('user');
    const chestId = c.req.param('chestId');

    const chest = await c.env.DB.prepare(
      'SELECT * FROM mystery_chests WHERE id = ? AND user_id = ? AND status = \'available\''
    ).bind(chestId, user.userId).first();

    if (!chest) {
      return c.json({ success: false, error: 'Chest not found or already opened' }, 404);
    }

    const config = chestConfig[chest.chest_type as keyof typeof chestConfig];
    const rewards: any[] = [];

    // Always give XP
    const xpAmount = Math.floor(Math.random() * (config.maxXp - config.minXp + 1)) + config.minXp;
    rewards.push({ type: 'xp', amount: xpAmount });
    const demoFlags = getDemoDataFlags(user.userId);
    await awardPoints(c.env.DB, {
      userId: user.userId,
      points: xpAmount,
      source: 'quest_claim',
      sourceRef: chestId,
      isDemoData: demoFlags.is_demo_data,
      expiresAt: demoFlags.expires_at,
    });

    // Chance for cosmetic
    if (Math.random() < config.cosmeticChance) {
      // Get random unlockable cosmetic
      const cosmetic = await c.env.DB.prepare(`
        SELECT c.id, c.name, c.rarity FROM cosmetics c
        WHERE c.is_active = 1
          AND c.id NOT IN (SELECT cosmetic_id FROM user_cosmetics WHERE user_id = ?)
        ORDER BY RANDOM()
        LIMIT 1
      `).bind(user.userId).first();

      if (cosmetic) {
        await c.env.DB.prepare(`
          INSERT INTO user_cosmetics (id, user_id, cosmetic_id, acquired_method)
          VALUES (?, ?, ?, 'chest')
        `).bind(generateId(), user.userId, cosmetic.id).run();

        rewards.push({
          type: 'cosmetic',
          id: cosmetic.id,
          name: cosmetic.name,
          rarity: cosmetic.rarity,
        });
      }
    }

    // Chance for streak protection
    if (Math.random() < config.protectionChance) {
      await c.env.DB.prepare(
        'UPDATE users SET streak_protections = streak_protections + 1 WHERE id = ?'
      ).bind(user.userId).run();
      rewards.push({ type: 'protection', amount: 1 });
    }

    // Update chest
    await c.env.DB.prepare(`
      UPDATE mystery_chests
      SET status = 'opened', opened_at = datetime('now'),
          reward_xp = ?, reward_protection = ?
      WHERE id = ?
    `).bind(
      xpAmount,
      rewards.find(r => r.type === 'protection')?.amount || 0,
      chestId
    ).run();

    // Update stats
    await c.env.DB.prepare(`
      INSERT INTO user_reward_stats (id, user_id, total_chests_opened)
      VALUES (?, ?, 1)
      ON CONFLICT(user_id) DO UPDATE SET
        total_chests_opened = total_chests_opened + 1,
        updated_at = datetime('now')
    `).bind(generateId(), user.userId).run();

    return c.json({
      success: true,
      data: {
        chestType: chest.chest_type,
        rewards,
      },
    });
  } catch (error) {
    console.error('Error opening chest:', error);
    return c.json({ success: false, error: 'Failed to open chest' }, 500);
  }
});

// Grant a chest (internal use - called after achievements, etc.)
rewardsApp.post('/chests/grant', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const { chestType, source, sourceId } = body;

    if (!['bronze', 'silver', 'gold', 'diamond'].includes(chestType)) {
      return c.json({ success: false, error: 'Invalid chest type' }, 400);
    }

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    const chestId = generateId();
    await c.env.DB.prepare(`
      INSERT INTO mystery_chests (id, user_id, chest_type, source, source_id, expires_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(chestId, user.userId, chestType, source, sourceId || null, expiresAt).run();

    return c.json({
      success: true,
      data: { chestId, chestType, expiresAt },
    });
  } catch (error) {
    console.error('Error granting chest:', error);
    return c.json({ success: false, error: 'Failed to grant chest' }, 500);
  }
});

// Get wheel spin availability
rewardsApp.get('/wheel/status', async (c) => {
  try {
    const user = c.get('user');

    const stats = await c.env.DB.prepare(
      'SELECT * FROM user_reward_stats WHERE user_id = ?'
    ).bind(user.userId).first<UserRewardStatsRow>();

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    let weeklySpins = stats?.weekly_wheel_spins || 0;
    let canSpin = weeklySpins < 3;

    // Reset weekly spins if new week
    if (stats?.week_start && new Date(stats.week_start as string) < weekStart) {
      weeklySpins = 0;
      canSpin = true;
    }

    return c.json({
      success: true,
      data: {
        canSpin,
        weeklySpins,
        maxWeeklySpins: 3,
        lastSpin: stats?.last_wheel_spin,
        segments: wheelSegments.map(s => ({
          id: s.id,
          type: s.type,
          label: s.label,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching wheel status:', error);
    return c.json({ success: false, error: 'Failed to fetch wheel status' }, 500);
  }
});

// Spin the wheel
rewardsApp.post('/wheel/spin', async (c) => {
  try {
    const user = c.get('user');

    // Check eligibility
    const stats = await c.env.DB.prepare(
      'SELECT * FROM user_reward_stats WHERE user_id = ?'
    ).bind(user.userId).first<UserRewardStatsRow>();

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    let weeklySpins = stats?.weekly_wheel_spins || 0;

    // Reset if new week
    if (stats?.week_start && new Date(stats.week_start as string) < weekStart) {
      weeklySpins = 0;
    }

    if (weeklySpins >= 3) {
      return c.json({ success: false, error: 'No spins remaining this week' }, 400);
    }

    // Weighted random selection
    const totalProb = wheelSegments.reduce((sum, s) => sum + s.probability, 0);
    let random = Math.random() * totalProb;
    let selectedSegment = wheelSegments[0];

    for (const segment of wheelSegments) {
      random -= segment.probability;
      if (random <= 0) {
        selectedSegment = segment;
        break;
      }
    }

    // Apply reward
    const rewardValue: number | string = selectedSegment.value;

    if (selectedSegment.type === 'xp') {
      const demoFlags = getDemoDataFlags(user.userId);
      await awardPoints(c.env.DB, {
        userId: user.userId,
        points: selectedSegment.value as number,
        source: 'quest_claim',
        sourceRef: `wheel_segment_${selectedSegment.id}`,
        isDemoData: demoFlags.is_demo_data,
        expiresAt: demoFlags.expires_at,
      });
    } else if (selectedSegment.type === 'multiplier') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(23, 59, 59, 999);

      await c.env.DB.prepare(`
        INSERT INTO daily_multipliers (id, user_id, multiplier, date, expires_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(user_id, date) DO UPDATE SET multiplier = ?
      `).bind(
        generateId(),
        user.userId,
        selectedSegment.value,
        tomorrow.toISOString().split('T')[0],
        tomorrow.toISOString(),
        selectedSegment.value
      ).run();
    } else if (selectedSegment.type === 'protection') {
      await c.env.DB.prepare(
        'UPDATE users SET streak_protections = streak_protections + ? WHERE id = ?'
      ).bind(selectedSegment.value, user.userId).run();
    } else if (selectedSegment.type === 'chest') {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      await c.env.DB.prepare(`
        INSERT INTO mystery_chests (id, user_id, chest_type, source, expires_at)
        VALUES (?, ?, ?, 'wheel', ?)
      `).bind(generateId(), user.userId, selectedSegment.value, expiresAt).run();
    }

    // Log spin
    await c.env.DB.prepare(`
      INSERT INTO lucky_wheel_spins (id, user_id, spin_date, reward_type, reward_value, wheel_segment)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      generateId(),
      user.userId,
      now.toISOString().split('T')[0],
      selectedSegment.type,
      JSON.stringify({ value: selectedSegment.value, label: selectedSegment.label }),
      selectedSegment.id
    ).run();

    // Update stats
    await c.env.DB.prepare(`
      INSERT INTO user_reward_stats (id, user_id, total_wheel_spins, weekly_wheel_spins, last_wheel_spin, week_start)
      VALUES (?, ?, 1, 1, datetime('now'), ?)
      ON CONFLICT(user_id) DO UPDATE SET
        total_wheel_spins = total_wheel_spins + 1,
        weekly_wheel_spins = CASE
          WHEN week_start < ? THEN 1
          ELSE weekly_wheel_spins + 1
        END,
        last_wheel_spin = datetime('now'),
        week_start = CASE
          WHEN week_start < ? THEN ?
          ELSE week_start
        END,
        updated_at = datetime('now')
    `).bind(
      generateId(),
      user.userId,
      weekStart.toISOString(),
      weekStart.toISOString(),
      weekStart.toISOString(),
      weekStart.toISOString()
    ).run();

    return c.json({
      success: true,
      data: {
        segment: selectedSegment.id,
        type: selectedSegment.type,
        value: rewardValue,
        label: selectedSegment.label,
        spinsRemaining: 2 - weeklySpins,
      },
    });
  } catch (error) {
    console.error('Error spinning wheel:', error);
    return c.json({ success: false, error: 'Failed to spin wheel' }, 500);
  }
});

// Get reward stats
rewardsApp.get('/stats', async (c) => {
  try {
    const user = c.get('user');

    const stats = await c.env.DB.prepare(
      'SELECT * FROM user_reward_stats WHERE user_id = ?'
    ).bind(user.userId).first<UserRewardStatsRow>();

    return c.json({
      success: true,
      data: {
        totalChestsOpened: stats?.total_chests_opened || 0,
        totalWheelSpins: stats?.total_wheel_spins || 0,
        surpriseChallengesCompleted: stats?.surprise_challenges_completed || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching reward stats:', error);
    return c.json({ success: false, error: 'Failed to fetch stats' }, 500);
  }
});

export { rewardsApp };
