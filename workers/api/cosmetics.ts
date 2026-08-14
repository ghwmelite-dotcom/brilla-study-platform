import { Hono } from 'hono';
import { requireAuth } from './auth-middleware';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

interface UserPayload {
  userId: string;
  email: string;
  role: string;
}

const cosmeticsApp = new Hono<{ Bindings: Env; Variables: { user: UserPayload } }>();

// All cosmetics routes require a verified JWT (sets user on context).
cosmeticsApp.use('*', requireAuth);

const generateId = () => `cos_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

// =============================================
// COSMETICS ENDPOINTS
// =============================================

// Get all available cosmetics
cosmeticsApp.get('/available', async (c) => {
  try {
    const user = c.get('user');
    const type = c.req.query('type'); // Optional filter

    let query = `
      SELECT
        c.*,
        uc.id as owned_id,
        uc.is_equipped,
        uc.acquired_at
      FROM cosmetics c
      LEFT JOIN user_cosmetics uc ON c.id = uc.cosmetic_id AND uc.user_id = ?
      WHERE c.is_active = 1
    `;
    const params: any[] = [user.userId];

    if (type) {
      query += ` AND c.cosmetic_type = ?`;
      params.push(type);
    }

    query += ` ORDER BY c.rarity DESC, c.name ASC`;

    const cosmetics = await c.env.DB.prepare(query).bind(...params).all();

    // Get user's level and achievements for unlock checking
    const userData = await c.env.DB.prepare(
      'SELECT level, xp_points FROM users WHERE id = ?'
    ).bind(user.userId).first<{ level: number; xp_points: number }>();

    return c.json({
      success: true,
      data: {
        cosmetics: cosmetics.results.map((c: any) => {
          const unlockReq = c.unlock_requirement ? JSON.parse(c.unlock_requirement) : null;
          let canUnlock = false;
          let unlockProgress = 0;

          if (c.unlock_method === 'level' && unlockReq?.level) {
            canUnlock = (userData?.level || 1) >= unlockReq.level;
            unlockProgress = Math.min(100, ((userData?.level || 1) / unlockReq.level) * 100);
          } else if (c.unlock_method === 'default') {
            canUnlock = true;
            unlockProgress = 100;
          }

          return {
            id: c.id,
            name: c.name,
            description: c.description,
            cosmeticType: c.cosmetic_type,
            rarity: c.rarity,
            unlockMethod: c.unlock_method,
            unlockRequirement: unlockReq,
            previewData: c.preview_data ? JSON.parse(c.preview_data) : null,
            xpCost: c.xp_cost,
            isPremium: !!c.is_premium,
            owned: !!c.owned_id,
            equipped: !!c.is_equipped,
            acquiredAt: c.acquired_at,
            canUnlock,
            unlockProgress: Math.round(unlockProgress),
          };
        }),
      },
    });
  } catch (error) {
    console.error('Error fetching cosmetics:', error);
    return c.json({ success: false, error: 'Failed to fetch cosmetics' }, 500);
  }
});

// Get user's owned cosmetics
cosmeticsApp.get('/owned', async (c) => {
  try {
    const user = c.get('user');

    const cosmetics = await c.env.DB.prepare(`
      SELECT
        c.*,
        uc.is_equipped,
        uc.acquired_at,
        uc.acquired_method
      FROM cosmetics c
      JOIN user_cosmetics uc ON c.id = uc.cosmetic_id
      WHERE uc.user_id = ?
      ORDER BY uc.acquired_at DESC
    `).bind(user.userId).all();

    return c.json({
      success: true,
      data: {
        cosmetics: cosmetics.results.map((c: any) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          cosmeticType: c.cosmetic_type,
          rarity: c.rarity,
          previewData: c.preview_data ? JSON.parse(c.preview_data) : null,
          equipped: !!c.is_equipped,
          acquiredAt: c.acquired_at,
          acquiredMethod: c.acquired_method,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching owned cosmetics:', error);
    return c.json({ success: false, error: 'Failed to fetch cosmetics' }, 500);
  }
});

// Get user's equipped cosmetics
cosmeticsApp.get('/equipped', async (c) => {
  try {
    const user = c.get('user');

    const settings = await c.env.DB.prepare(
      'SELECT * FROM user_cosmetic_settings WHERE user_id = ?'
    ).bind(user.userId).first();

    if (!settings) {
      return c.json({
        success: true,
        data: {
          equipped: {
            avatarFrame: null,
            title: null,
            profileTheme: null,
            badgeStyle: null,
            nameEffect: null,
          },
        },
      });
    }

    // Get details for each equipped cosmetic
    const getCosmetic = async (id: string | null) => {
      if (!id) return null;
      const cosmetic = await c.env.DB.prepare(
        'SELECT id, name, cosmetic_type, rarity, preview_data FROM cosmetics WHERE id = ?'
      ).bind(id).first();
      if (!cosmetic) return null;
      return {
        id: cosmetic.id,
        name: cosmetic.name,
        rarity: cosmetic.rarity,
        previewData: cosmetic.preview_data ? JSON.parse(cosmetic.preview_data as string) : null,
      };
    };

    return c.json({
      success: true,
      data: {
        equipped: {
          avatarFrame: await getCosmetic(settings.equipped_frame as string | null),
          title: await getCosmetic(settings.equipped_title as string | null),
          profileTheme: await getCosmetic(settings.equipped_theme as string | null),
          badgeStyle: await getCosmetic(settings.equipped_badge_style as string | null),
          nameEffect: await getCosmetic(settings.equipped_name_effect as string | null),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching equipped cosmetics:', error);
    return c.json({ success: false, error: 'Failed to fetch equipped' }, 500);
  }
});

// Equip a cosmetic
cosmeticsApp.post('/:cosmeticId/equip', async (c) => {
  try {
    const user = c.get('user');
    const cosmeticId = c.req.param('cosmeticId');

    // Verify ownership
    const owned = await c.env.DB.prepare(
      'SELECT id FROM user_cosmetics WHERE user_id = ? AND cosmetic_id = ?'
    ).bind(user.userId, cosmeticId).first();

    if (!owned) {
      return c.json({ success: false, error: 'You do not own this cosmetic' }, 403);
    }

    // Get cosmetic type
    const cosmetic = await c.env.DB.prepare(
      'SELECT cosmetic_type FROM cosmetics WHERE id = ?'
    ).bind(cosmeticId).first();

    if (!cosmetic) {
      return c.json({ success: false, error: 'Cosmetic not found' }, 404);
    }

    // Map type to column
    const typeToColumn: Record<string, string> = {
      avatar_frame: 'equipped_frame',
      title: 'equipped_title',
      profile_theme: 'equipped_theme',
      badge_style: 'equipped_badge_style',
      name_effect: 'equipped_name_effect',
    };

    const column = typeToColumn[cosmetic.cosmetic_type as string];
    if (!column) {
      return c.json({ success: false, error: 'Invalid cosmetic type' }, 400);
    }

    // Unequip previous of same type
    await c.env.DB.prepare(`
      UPDATE user_cosmetics SET is_equipped = 0
      WHERE user_id = ? AND cosmetic_id IN (
        SELECT id FROM cosmetics WHERE cosmetic_type = ?
      )
    `).bind(user.userId, cosmetic.cosmetic_type).run();

    // Equip new
    await c.env.DB.prepare(
      'UPDATE user_cosmetics SET is_equipped = 1 WHERE user_id = ? AND cosmetic_id = ?'
    ).bind(user.userId, cosmeticId).run();

    // Update settings
    await c.env.DB.prepare(`
      INSERT INTO user_cosmetic_settings (id, user_id, ${column}, updated_at)
      VALUES (?, ?, ?, datetime('now'))
      ON CONFLICT(user_id) DO UPDATE SET ${column} = ?, updated_at = datetime('now')
    `).bind(generateId(), user.userId, cosmeticId, cosmeticId).run();

    return c.json({
      success: true,
      data: { equipped: true },
    });
  } catch (error) {
    console.error('Error equipping cosmetic:', error);
    return c.json({ success: false, error: 'Failed to equip cosmetic' }, 500);
  }
});

// Unequip a cosmetic
cosmeticsApp.post('/:cosmeticId/unequip', async (c) => {
  try {
    const user = c.get('user');
    const cosmeticId = c.req.param('cosmeticId');

    // Get cosmetic type
    const cosmetic = await c.env.DB.prepare(
      'SELECT cosmetic_type FROM cosmetics WHERE id = ?'
    ).bind(cosmeticId).first();

    if (!cosmetic) {
      return c.json({ success: false, error: 'Cosmetic not found' }, 404);
    }

    const typeToColumn: Record<string, string> = {
      avatar_frame: 'equipped_frame',
      title: 'equipped_title',
      profile_theme: 'equipped_theme',
      badge_style: 'equipped_badge_style',
      name_effect: 'equipped_name_effect',
    };

    const column = typeToColumn[cosmetic.cosmetic_type as string];

    // Unequip
    await c.env.DB.prepare(
      'UPDATE user_cosmetics SET is_equipped = 0 WHERE user_id = ? AND cosmetic_id = ?'
    ).bind(user.userId, cosmeticId).run();

    // Update settings
    await c.env.DB.prepare(`
      UPDATE user_cosmetic_settings SET ${column} = NULL, updated_at = datetime('now')
      WHERE user_id = ?
    `).bind(user.userId).run();

    return c.json({
      success: true,
      data: { unequipped: true },
    });
  } catch (error) {
    console.error('Error unequipping cosmetic:', error);
    return c.json({ success: false, error: 'Failed to unequip cosmetic' }, 500);
  }
});

// Purchase a cosmetic with XP
cosmeticsApp.post('/:cosmeticId/purchase', async (c) => {
  try {
    const user = c.get('user');
    const cosmeticId = c.req.param('cosmeticId');

    // Check if already owned
    const owned = await c.env.DB.prepare(
      'SELECT id FROM user_cosmetics WHERE user_id = ? AND cosmetic_id = ?'
    ).bind(user.userId, cosmeticId).first();

    if (owned) {
      return c.json({ success: false, error: 'Already owned' }, 400);
    }

    // Get cosmetic
    const cosmetic = await c.env.DB.prepare(
      'SELECT * FROM cosmetics WHERE id = ? AND is_active = 1'
    ).bind(cosmeticId).first();

    if (!cosmetic) {
      return c.json({ success: false, error: 'Cosmetic not found' }, 404);
    }

    if (cosmetic.unlock_method !== 'purchase') {
      return c.json({ success: false, error: 'This cosmetic cannot be purchased' }, 400);
    }

    // Check XP
    const userData = await c.env.DB.prepare(
      'SELECT xp_points FROM users WHERE id = ?'
    ).bind(user.userId).first();

    if ((userData?.xp_points as number) < (cosmetic.xp_cost as number)) {
      return c.json({ success: false, error: 'Not enough XP' }, 400);
    }

    // Deduct XP and grant cosmetic
    await c.env.DB.prepare(
      'UPDATE users SET xp_points = xp_points - ? WHERE id = ?'
    ).bind(cosmetic.xp_cost, user.userId).run();

    await c.env.DB.prepare(`
      INSERT INTO user_cosmetics (id, user_id, cosmetic_id, acquired_method)
      VALUES (?, ?, ?, 'purchase')
    `).bind(generateId(), user.userId, cosmeticId).run();

    // Log activity
    await c.env.DB.prepare(`
      INSERT INTO activity_feed (id, user_id, activity_type, title, description, metadata)
      VALUES (?, ?, 'cosmetic_unlock', ?, ?, ?)
    `).bind(
      generateId(),
      user.userId,
      `Unlocked ${cosmetic.name}`,
      `Purchased a ${cosmetic.rarity} ${cosmetic.cosmetic_type}`,
      JSON.stringify({ cosmeticId, rarity: cosmetic.rarity })
    ).run();

    return c.json({
      success: true,
      data: {
        purchased: true,
        xpSpent: cosmetic.xp_cost,
      },
    });
  } catch (error) {
    console.error('Error purchasing cosmetic:', error);
    return c.json({ success: false, error: 'Failed to purchase cosmetic' }, 500);
  }
});

// Unlock a cosmetic (for level/achievement unlocks)
cosmeticsApp.post('/:cosmeticId/unlock', async (c) => {
  try {
    const user = c.get('user');
    const cosmeticId = c.req.param('cosmeticId');

    // Check if already owned
    const owned = await c.env.DB.prepare(
      'SELECT id FROM user_cosmetics WHERE user_id = ? AND cosmetic_id = ?'
    ).bind(user.userId, cosmeticId).first();

    if (owned) {
      return c.json({ success: false, error: 'Already owned' }, 400);
    }

    // Get cosmetic and check requirements
    const cosmetic = await c.env.DB.prepare(
      'SELECT * FROM cosmetics WHERE id = ? AND is_active = 1'
    ).bind(cosmeticId).first();

    if (!cosmetic) {
      return c.json({ success: false, error: 'Cosmetic not found' }, 404);
    }

    const unlockReq = cosmetic.unlock_requirement ? JSON.parse(cosmetic.unlock_requirement as string) : null;

    // Verify unlock requirements
    if (cosmetic.unlock_method === 'level' && unlockReq?.level) {
      const userData = await c.env.DB.prepare(
        'SELECT level FROM users WHERE id = ?'
      ).bind(user.userId).first();

      if ((userData?.level || 1) < unlockReq.level) {
        return c.json({ success: false, error: `Requires level ${unlockReq.level}` }, 400);
      }
    } else if (cosmetic.unlock_method === 'streak' && unlockReq?.streak) {
      const userData = await c.env.DB.prepare(
        'SELECT streak_days FROM users WHERE id = ?'
      ).bind(user.userId).first();

      if ((userData?.streak_days || 0) < unlockReq.streak) {
        return c.json({ success: false, error: `Requires ${unlockReq.streak} day streak` }, 400);
      }
    } else if (cosmetic.unlock_method !== 'default') {
      return c.json({ success: false, error: 'Cannot unlock this cosmetic directly' }, 400);
    }

    // Grant cosmetic
    await c.env.DB.prepare(`
      INSERT INTO user_cosmetics (id, user_id, cosmetic_id, acquired_method)
      VALUES (?, ?, ?, ?)
    `).bind(generateId(), user.userId, cosmeticId, cosmetic.unlock_method).run();

    return c.json({
      success: true,
      data: { unlocked: true },
    });
  } catch (error) {
    console.error('Error unlocking cosmetic:', error);
    return c.json({ success: false, error: 'Failed to unlock cosmetic' }, 500);
  }
});

export { cosmeticsApp };
