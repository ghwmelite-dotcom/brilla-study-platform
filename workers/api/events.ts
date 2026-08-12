import { Hono } from 'hono';
import { requireAuth } from './auth-middleware';
import { parseLimit } from './http';
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

const eventsApp = new Hono<{ Bindings: Env; Variables: { user: UserPayload } }>();

// All event routes require a verified JWT (sets user on context).
eventsApp.use('*', requireAuth);

const generateId = () => `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

// =============================================
// EVENTS & TOURNAMENTS ENDPOINTS
// =============================================

// Get active events
eventsApp.get('/active', async (c) => {
  try {
    const now = new Date().toISOString();

    const events = await c.env.DB.prepare(`
      SELECT * FROM seasonal_events
      WHERE is_active = 1
        AND start_date <= ?
        AND end_date >= ?
      ORDER BY start_date ASC
    `).bind(now, now).all();

    return c.json({
      success: true,
      data: {
        events: events.results.map((e: any) => ({
          id: e.id,
          name: e.name,
          description: e.description,
          theme: e.theme,
          startDate: e.start_date,
          endDate: e.end_date,
          xpMultiplier: e.xp_multiplier,
          accentColor: e.accent_color,
          bannerImage: e.banner_image,
          rewards: e.rewards ? JSON.parse(e.rewards) : [],
          quests: e.quests ? JSON.parse(e.quests) : [],
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching active events:', error);
    return c.json({ success: false, error: 'Failed to fetch events' }, 500);
  }
});

// Get event details with user progress
eventsApp.get('/:eventId', async (c) => {
  try {
    const user = c.get('user');
    const eventId = c.req.param('eventId');

    const event = await c.env.DB.prepare(
      'SELECT * FROM seasonal_events WHERE id = ?'
    ).bind(eventId).first();

    if (!event) {
      return c.json({ success: false, error: 'Event not found' }, 404);
    }

    // Get user's progress
    const progress = await c.env.DB.prepare(
      'SELECT * FROM user_event_progress WHERE user_id = ? AND event_id = ?'
    ).bind(user.userId, eventId).first();

    const quests = event.quests ? JSON.parse(event.quests as string) : [];
    const completedQuests = progress?.quests_completed ? JSON.parse(progress.quests_completed as string) : [];
    const claimedRewards = progress?.rewards_claimed ? JSON.parse(progress.rewards_claimed as string) : [];

    return c.json({
      success: true,
      data: {
        event: {
          id: event.id,
          name: event.name,
          description: event.description,
          theme: event.theme,
          startDate: event.start_date,
          endDate: event.end_date,
          xpMultiplier: event.xp_multiplier,
          accentColor: event.accent_color,
          bannerImage: event.banner_image,
          rewards: event.rewards ? JSON.parse(event.rewards as string) : [],
          quests: quests.map((q: any) => ({
            ...q,
            completed: completedQuests.includes(q.id),
          })),
        },
        progress: progress ? {
          joined: true,
          joinedAt: progress.joined_at,
          xpEarned: progress.xp_earned,
          questsCompleted: completedQuests,
          rewardsClaimed: claimedRewards,
        } : {
          joined: false,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    return c.json({ success: false, error: 'Failed to fetch event' }, 500);
  }
});

// Join an event
eventsApp.post('/:eventId/join', async (c) => {
  try {
    const user = c.get('user');
    const eventId = c.req.param('eventId');

    const event = await c.env.DB.prepare(
      'SELECT * FROM seasonal_events WHERE id = ? AND is_active = 1'
    ).bind(eventId).first();

    if (!event) {
      return c.json({ success: false, error: 'Event not found or inactive' }, 404);
    }

    // Check if already joined
    const existing = await c.env.DB.prepare(
      'SELECT id FROM user_event_progress WHERE user_id = ? AND event_id = ?'
    ).bind(user.userId, eventId).first();

    if (existing) {
      return c.json({ success: false, error: 'Already joined this event' }, 400);
    }

    // Join event
    await c.env.DB.prepare(`
      INSERT INTO user_event_progress (id, user_id, event_id)
      VALUES (?, ?, ?)
    `).bind(generateId(), user.userId, eventId).run();

    // Log activity
    await c.env.DB.prepare(`
      INSERT INTO activity_feed (id, user_id, activity_type, title, description, metadata)
      VALUES (?, ?, 'event_join', ?, ?, ?)
    `).bind(
      generateId(),
      user.userId,
      `Joined ${event.name}`,
      event.description,
      JSON.stringify({ eventId, eventName: event.name })
    ).run();

    return c.json({
      success: true,
      data: { joined: true },
    });
  } catch (error) {
    console.error('Error joining event:', error);
    return c.json({ success: false, error: 'Failed to join event' }, 500);
  }
});

// Claim event reward
eventsApp.post('/:eventId/claim/:rewardId', async (c) => {
  try {
    const user = c.get('user');
    const eventId = c.req.param('eventId');
    const rewardId = c.req.param('rewardId');

    const progress = await c.env.DB.prepare(
      'SELECT * FROM user_event_progress WHERE user_id = ? AND event_id = ?'
    ).bind(user.userId, eventId).first();

    if (!progress) {
      return c.json({ success: false, error: 'Not joined this event' }, 400);
    }

    const claimedRewards = progress.rewards_claimed ? JSON.parse(progress.rewards_claimed as string) : [];
    if (claimedRewards.includes(rewardId)) {
      return c.json({ success: false, error: 'Reward already claimed' }, 400);
    }

    const event = await c.env.DB.prepare(
      'SELECT rewards FROM seasonal_events WHERE id = ?'
    ).bind(eventId).first();

    const rewards = event?.rewards ? JSON.parse(event.rewards as string) : [];
    const reward = rewards.find((r: any) => r.id === rewardId);

    if (!reward) {
      return c.json({ success: false, error: 'Reward not found' }, 404);
    }

    // Grant reward based on type
    if (reward.type === 'xp') {
      const demoFlags = getDemoDataFlags(user.userId);
      await awardPoints(c.env.DB, {
        userId: user.userId,
        points: reward.amount,
        source: 'quest_claim',
        sourceRef: `${eventId}/${rewardId}`,
        isDemoData: demoFlags.is_demo_data,
        expiresAt: demoFlags.expires_at,
      });
    } else if (reward.type === 'cosmetic') {
      await c.env.DB.prepare(`
        INSERT OR IGNORE INTO user_cosmetics (id, user_id, cosmetic_id, acquired_method)
        VALUES (?, ?, ?, 'event')
      `).bind(generateId(), user.userId, reward.cosmeticId).run();
    }

    // Update claimed rewards
    claimedRewards.push(rewardId);
    await c.env.DB.prepare(
      'UPDATE user_event_progress SET rewards_claimed = ? WHERE user_id = ? AND event_id = ?'
    ).bind(JSON.stringify(claimedRewards), user.userId, eventId).run();

    return c.json({
      success: true,
      data: { reward, claimedRewards },
    });
  } catch (error) {
    console.error('Error claiming reward:', error);
    return c.json({ success: false, error: 'Failed to claim reward' }, 500);
  }
});

// Get active tournaments
eventsApp.get('/tournaments/active', async (c) => {
  try {
    const now = new Date().toISOString();

    const tournaments = await c.env.DB.prepare(`
      SELECT t.*, se.name as event_name
      FROM tournaments t
      LEFT JOIN seasonal_events se ON t.event_id = se.id
      WHERE t.status IN ('upcoming', 'active')
        AND t.start_date <= datetime(?, '+7 days')
      ORDER BY t.start_date ASC
    `).bind(now).all();

    return c.json({
      success: true,
      data: {
        tournaments: tournaments.results.map((t: any) => ({
          id: t.id,
          eventId: t.event_id,
          eventName: t.event_name,
          name: t.name,
          description: t.description,
          tournamentType: t.tournament_type,
          subjectId: t.subject_id,
          startDate: t.start_date,
          endDate: t.end_date,
          maxParticipants: t.max_participants,
          entryFee: t.entry_fee,
          prizes: t.prizes ? JSON.parse(t.prizes) : [],
          status: t.status,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    return c.json({ success: false, error: 'Failed to fetch tournaments' }, 500);
  }
});

// Join tournament
eventsApp.post('/tournaments/:tournamentId/join', async (c) => {
  try {
    const user = c.get('user');
    const tournamentId = c.req.param('tournamentId');

    const tournament = await c.env.DB.prepare(
      'SELECT * FROM tournaments WHERE id = ? AND status IN (\'upcoming\', \'active\')'
    ).bind(tournamentId).first();

    if (!tournament) {
      return c.json({ success: false, error: 'Tournament not found or not active' }, 404);
    }

    // Fast path for a distinct error message; the conditional INSERT below
    // is the actual guard against duplicate joins.
    const existing = await c.env.DB.prepare(
      'SELECT id FROM tournament_participants WHERE tournament_id = ? AND user_id = ?'
    ).bind(tournamentId, user.userId).first();

    if (existing) {
      return c.json({ success: false, error: 'Already joined this tournament' }, 400);
    }

    // 1. Conditional fee debit — fails atomically if balance is insufficient
    // (no separate balance SELECT, which could go stale between check and debit).
    if ((tournament.entry_fee as number) > 0) {
      const debit = await c.env.DB.prepare(
        'UPDATE users SET xp_points = xp_points - ? WHERE id = ? AND xp_points >= ?'
      ).bind(tournament.entry_fee, user.userId, tournament.entry_fee).run();
      if (debit.meta.changes === 0) {
        return c.json({ success: false, error: 'Not enough XP for entry fee' }, 400);
      }
    }

    // 2. Conditional insert — enforces uniqueness AND capacity in one
    // statement (SQLite executes each statement atomically, so concurrent
    // joins cannot exceed max_participants or double-join).
    const join = await c.env.DB.prepare(`
      INSERT INTO tournament_participants (id, tournament_id, user_id)
      SELECT ?, ?, ?
      WHERE NOT EXISTS (
        SELECT 1 FROM tournament_participants WHERE tournament_id = ? AND user_id = ?
      )
      AND (SELECT COUNT(*) FROM tournament_participants WHERE tournament_id = ?) < ?
    `).bind(
      `tp_${crypto.randomUUID()}`, tournamentId, user.userId,
      tournamentId, user.userId,
      tournamentId, tournament.max_participants ?? Number.MAX_SAFE_INTEGER
    ).run();

    if (join.meta.changes === 0) {
      // Refund the fee if we debited it
      if ((tournament.entry_fee as number) > 0) {
        await c.env.DB.prepare(
          'UPDATE users SET xp_points = xp_points + ? WHERE id = ?'
        ).bind(tournament.entry_fee, user.userId).run();
      }
      return c.json({ success: false, error: 'Tournament is full or already joined' }, 400);
    }

    return c.json({
      success: true,
      data: { joined: true },
    });
  } catch (error) {
    console.error('Error joining tournament:', error);
    return c.json({ success: false, error: 'Failed to join tournament' }, 500);
  }
});

// Get tournament leaderboard
eventsApp.get('/tournaments/:tournamentId/leaderboard', async (c) => {
  try {
    const tournamentId = c.req.param('tournamentId');
    const limit = parseLimit(c, 50);

    const participants = await c.env.DB.prepare(`
      SELECT
        tp.*,
        u.display_name,
        u.avatar_url
      FROM tournament_participants tp
      JOIN users u ON tp.user_id = u.id
      WHERE tp.tournament_id = ?
      ORDER BY tp.score DESC, tp.matches_won DESC
      LIMIT ?
    `).bind(tournamentId, limit).all();

    return c.json({
      success: true,
      data: {
        leaderboard: participants.results.map((p: any, index: number) => ({
          rank: index + 1,
          userId: p.user_id,
          displayName: p.display_name,
          avatarUrl: p.avatar_url,
          score: p.score,
          matchesPlayed: p.matches_played,
          matchesWon: p.matches_won,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return c.json({ success: false, error: 'Failed to fetch leaderboard' }, 500);
  }
});

export { eventsApp };
