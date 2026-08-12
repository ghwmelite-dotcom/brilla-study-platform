import { Hono } from 'hono';
import { constantTimeEqual } from './auth-middleware';
import { awardPoints } from './points';
import { checkRateLimit, type RateLimitConfig } from './rate-limit';
import { createNotification } from './notifications';

// Telegram core module: bot API client + webhook receiver + link-token
// handshake. The webhook is deliberately unauthenticated (Telegram cannot
// hold a user JWT); it is guarded by TELEGRAM_WEBHOOK_SECRET via the
// X-Telegram-Bot-Api-Secret-Token header instead.

export interface TelegramEnv {
  DB: D1Database;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_WEBHOOK_SECRET?: string;
  TELEGRAM_PLATFORM_CHANNEL_ID?: string;
  TELEGRAM_COMMUNITY_URL?: string;
  TELEGRAM_BOT_USERNAME?: string; // needed to build t.me/<bot>?start= links
}

export const CONNECT_POINTS = 100;
export const LINK_TOKEN_TTL_MS = 10 * 60 * 1000;
const TOKEN_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

export function mintLinkToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(22));
  return [...bytes].map((b) => TOKEN_ALPHABET[b % 64]).join('');
}

// Bot API call. Parses the Bot API envelope ({ ok, result, ... }); network
// and HTTP failures collapse to { ok: false } so callers never throw.
export async function telegramApi(
  env: TelegramEnv,
  method: string,
  payload: unknown,
): Promise<{ ok: boolean; status?: number; result?: unknown }> {
  if (!env.TELEGRAM_BOT_TOKEN) return { ok: false };
  try {
    const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return { ok: res.ok, status: res.status, result: await res.json().catch(() => null) };
  } catch (e) {
    console.error(`telegramApi ${method} failed:`, e);
    return { ok: false };
  }
}

export const telegramWebhookApp = new Hono<{ Bindings: TelegramEnv }>();

telegramWebhookApp.post('/webhook', async (c) => {
  const secret = c.req.header('X-Telegram-Bot-Api-Secret-Token') ?? '';
  if (!c.env.TELEGRAM_WEBHOOK_SECRET || !constantTimeEqual(secret, c.env.TELEGRAM_WEBHOOK_SECRET)) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  // Always 200 to Telegram after the secret check (prevents redelivery storms).
  const update = await c.req.json().catch(() => null);
  const msg = update?.message;
  const text: string = msg?.text ?? '';
  const chatId = msg?.chat?.id != null ? String(msg.chat.id) : null;
  if (!msg || !chatId || !text.startsWith('/start')) return c.json({ ok: true });

  const token = text.slice(6).trim();
  const reply = (t: string) => telegramApi(c.env, 'sendMessage', { chat_id: chatId, text: t });
  if (!/^[A-Za-z0-9_-]{22}$/.test(token)) {
    await reply('Invalid link code. Generate a new one from Settings → Notifications in BrillaPrep.');
    return c.json({ ok: true });
  }

  const db = c.env.DB;
  const row = await db.prepare(
    'SELECT token, user_id, expires_at, used_at FROM telegram_link_tokens WHERE token = ?'
  ).bind(token).first<{ user_id: string; expires_at: string; used_at: string | null }>();

  const expired = !row || new Date(row.expires_at) < new Date();
  if (expired) {
    await reply('That link code expired. Generate a new one in Settings.');
    return c.json({ ok: true });
  }

  // Idempotent consume: Telegram redelivers webhooks at least once. Only the
  // first delivery flips used_at (meta.changes === 1).
  const consumed = await db.prepare(
    "UPDATE telegram_link_tokens SET used_at = datetime('now') WHERE token = ? AND used_at IS NULL"
  ).bind(token).run();
  if (consumed.meta.changes === 0) {
    await reply('This link code was already used. Your Telegram is connected ✅');
    return c.json({ ok: true });
  }

  // chat_id UNIQUE: one Telegram account can only ever earn connect points once.
  const holder = await db.prepare('SELECT user_id FROM telegram_links WHERE chat_id = ?')
    .bind(chatId).first<{ user_id: string }>();
  if (holder && holder.user_id !== row.user_id) {
    await reply('This Telegram account is already linked to a different BrillaPrep account.');
    return c.json({ ok: true });
  }

  const existing = await db.prepare('SELECT user_id FROM telegram_links WHERE user_id = ?')
    .bind(row.user_id).first();
  await db.prepare(`
    INSERT INTO telegram_links (user_id, chat_id, username, linked_at, stale)
    VALUES (?, ?, ?, datetime('now'), 0)
    ON CONFLICT(user_id) DO UPDATE SET chat_id = excluded.chat_id,
      username = excluded.username, linked_at = excluded.linked_at, stale = 0
  `).bind(row.user_id, chatId, msg.from?.username ?? null).run();

  // Award gated on "no prior row for user": relinks never double-pay.
  if (!existing) {
    await awardPoints(db, {
      userId: row.user_id,
      points: CONNECT_POINTS,
      source: 'notification_subscribe',
      sourceRef: chatId,
    });
    await reply(`Connected! +${CONNECT_POINTS} XP added to your race score 🎉`);
  } else {
    await reply('Telegram reconnected ✅');
  }
  return c.json({ ok: true });
});

// =============================================
// OUTBOUND NOTIFIERS
// =============================================
// All three helpers never throw (catch + console.error) and return whether a
// message was actually sent, so fan-out callers (Task 4 / cron) can wrap them
// in ctx.waitUntil without defensive try/catch at every call site.

// Max bot DMs per user per rolling 24h. The checkRateLimit call itself records
// the send when allowed, so one call = check + consume.
export const NOTIFY_DM_LIMIT: RateLimitConfig = { maxRequests: 3, windowMs: 24 * 60 * 60 * 1000 };

export async function notifyUser(db: D1Database, env: TelegramEnv, userId: string, text: string): Promise<boolean> {
  try {
    const link = await db.prepare('SELECT chat_id FROM telegram_links WHERE user_id = ? AND stale = 0')
      .bind(userId).first<{ chat_id: string }>();
    if (!link) return false;
    const budget = await checkRateLimit(db, userId, 'notify', NOTIFY_DM_LIMIT);
    if (!budget.allowed) return false;
    const res = await telegramApi(env, 'sendMessage', { chat_id: link.chat_id, text });
    if (!res.ok) {
      if (res.status === 403) {
        await db.prepare('UPDATE telegram_links SET stale = 1 WHERE user_id = ?').bind(userId).run();
        console.error(`notifyUser: user ${userId} blocked the bot — marked stale`);
      } else {
        console.error(`notifyUser: sendMessage failed for ${userId} (status ${res.status})`);
      }
      return false;
    }
    return true;
  } catch (e) { console.error('notifyUser failed:', e); return false; }
}

export async function notifySchoolChannel(db: D1Database, env: TelegramEnv, schoolId: string, text: string): Promise<boolean> {
  try {
    const ch = await db.prepare('SELECT channel_id FROM school_channels WHERE school_id = ? AND broken = 0')
      .bind(schoolId).first<{ channel_id: string }>();
    if (!ch) return false;
    const res = await telegramApi(env, 'sendMessage', { chat_id: ch.channel_id, text });
    if (!res.ok) {
      if (res.status === 400 || res.status === 403) {
        await db.prepare('UPDATE school_channels SET broken = 1 WHERE school_id = ?').bind(schoolId).run();
        const admins = await db.prepare("SELECT id FROM users WHERE role = 'admin' AND is_active = 1")
          .bind().all<{ id: string }>();
        for (const a of admins.results) {
          await createNotification(db, a.id, 'system', 'Telegram school channel broken',
            `The Telegram channel for school ${schoolId} rejected a post. Re-add the bot as admin, then re-save the channel.`,
            { icon: 'alert-triangle', link: '/admin/schools' });
        }
      }
      console.error(`notifySchoolChannel: post failed for ${schoolId} (status ${res.status})`);
      return false;
    }
    return true;
  } catch (e) { console.error('notifySchoolChannel failed:', e); return false; }
}

export async function notifyPlatformChannel(env: TelegramEnv, text: string): Promise<boolean> {
  try {
    if (!env.TELEGRAM_PLATFORM_CHANNEL_ID) return false;
    const res = await telegramApi(env, 'sendMessage', { chat_id: env.TELEGRAM_PLATFORM_CHANNEL_ID, text });
    if (!res.ok) console.error(`notifyPlatformChannel: post failed (status ${res.status})`);
    return res.ok;
  } catch (e) { console.error('notifyPlatformChannel failed:', e); return false; }
}
