import { Hono } from 'hono';
import { requireAdmin, requireAuth } from './auth-middleware';
import { parseBoundedJsonBody } from './http';

const MAX_BODY_BYTES = 24_576;
const MAX_AUDIENCE_IDS = 50;
const MAX_EMAIL_BATCH_SIZE = 100;
const MAX_EMAIL_RECIPIENTS_PER_DISPATCH = 5_000;
const RESEND_BATCH_URL = 'https://api.resend.com/emails/batch';
const RESEND_USER_AGENT = 'BrillaPrep-Worker/1.0 (+https://brillaprep.org)';

type AudienceType = 'all' | 'exam' | 'school' | 'tier' | 'chatrooms';

interface AnnouncementEnv {
  DB: D1Database;
  JWT_SECRET: string;
  RESEND_API_KEY?: string;
  APP_URL?: string;
  FROM_EMAIL?: string;
}

interface AnnouncementVariables {
  userId: string;
  userRole: string;
  user: { userId: string; email?: string; role?: string };
}

interface AnnouncementPayload {
  title: string;
  message: string;
  link: string | null;
  audienceType: AudienceType;
  audienceIds: string[];
  sendInApp: boolean;
  sendEmail: boolean;
  postToChatrooms: boolean;
}

interface AnnouncementRow {
  id: string;
  title: string;
  message: string;
  link: string | null;
  audience_type: AudienceType;
  audience_ids: string;
  send_in_app: number;
  send_email: number;
  post_to_chatrooms: number;
  status: 'draft' | 'dispatching' | 'sent' | 'partial' | 'failed';
  matched_users: number;
  in_app_sent: number;
  email_queued: number;
  email_skipped: number;
  email_failed: number;
  chatrooms_posted: number;
  created_by: string;
  created_at: string;
  dispatched_at: string | null;
  updated_at: string;
}

interface EmailRecipient {
  user_id: string;
  name: string;
  email: string;
}

interface DeliveryCounts {
  matched_users: number;
  in_app_sent: number;
  email_queued: number;
  email_skipped: number;
  email_failed: number;
  chatrooms_posted: number;
  chatrooms_failed: number;
}

export const announcementsApp = new Hono<{
  Bindings: AnnouncementEnv;
  Variables: AnnouncementVariables;
}>();

function placeholders(count: number): string {
  return Array.from({ length: count }, () => '?').join(',');
}

function uniqueStringIds(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length > MAX_AUDIENCE_IDS) return null;
  const ids: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string') return null;
    const id = item.trim();
    if (!id || id.length > 120 || !/^[A-Za-z0-9_.:-]+$/.test(id)) return null;
    if (!ids.includes(id)) ids.push(id);
  }
  return ids;
}

function isSafeLink(value: string): boolean {
  if (value.startsWith('/') && !value.startsWith('//')) return true;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function parseAnnouncementPayload(body: Record<string, unknown>): AnnouncementPayload | null {
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const linkValue = typeof body.link === 'string' ? body.link.trim() : '';
  const audienceType = body.audienceType;
  const audienceIds = uniqueStringIds(body.audienceIds);
  const sendInApp = body.sendInApp === true;
  const sendEmail = body.sendEmail === true;
  const postToChatrooms = body.postToChatrooms === true;

  if (!title || title.length > 120 || !message || message.length > 3_000) return null;
  if (linkValue.length > 500 || (linkValue && !isSafeLink(linkValue))) return null;
  if (!['all', 'exam', 'school', 'tier', 'chatrooms'].includes(String(audienceType))) return null;
  if (!audienceIds) return null;
  if (audienceType === 'all' && audienceIds.length !== 0) return null;
  if (audienceType !== 'all' && audienceIds.length === 0) return null;
  if (postToChatrooms && audienceType !== 'chatrooms') return null;
  if (!sendInApp && !sendEmail && !postToChatrooms) return null;

  return {
    title,
    message,
    link: linkValue || null,
    audienceType: audienceType as AudienceType,
    audienceIds,
    sendInApp,
    sendEmail,
    postToChatrooms,
  };
}

/**
 * The base audience deliberately does not filter on users.is_active. Inactive
 * approved accounts are included, while suspended/rejected/pending, demo, and
 * administrator accounts remain outside customer communications.
 */
export function buildAudienceFilter(
  audienceType: AudienceType,
  audienceIds: string[],
): { sql: string; params: string[] } {
  const base = `u.status = 'approved' AND COALESCE(u.is_demo, 0) = 0 AND u.role <> 'admin'`;
  if (audienceType === 'all') return { sql: base, params: [] };

  const inClause = placeholders(audienceIds.length);
  if (audienceType === 'exam') {
    return { sql: `${base} AND u.primary_exam_type_id IN (${inClause})`, params: audienceIds };
  }
  if (audienceType === 'school') {
    return { sql: `${base} AND u.school_id IN (${inClause})`, params: audienceIds };
  }
  if (audienceType === 'tier') {
    return { sql: `${base} AND COALESCE(u.subscription_tier_id, 'tier_free') IN (${inClause})`, params: audienceIds };
  }
  return {
    sql: `${base} AND EXISTS (
      SELECT 1 FROM chat_room_members target_membership
      WHERE target_membership.user_id = u.id
        AND target_membership.room_id IN (${inClause})
    )`,
    params: audienceIds,
  };
}

function isDeliverableEmail(email: string): boolean {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function absoluteAppLink(appUrl: string, link: string | null): string {
  if (!link) return `${appUrl.replace(/\/$/, '')}/community`;
  if (link.startsWith('/')) return `${appUrl.replace(/\/$/, '')}${link}`;
  return link;
}

function announcementEmailHtml(
  recipientName: string,
  announcement: AnnouncementRow,
  appUrl: string,
): string {
  const firstName = recipientName.trim().split(/\s+/)[0] || 'there';
  const link = absoluteAppLink(appUrl, announcement.link);
  const settingsUrl = `${appUrl.replace(/\/$/, '')}/settings?tab=notifications`;
  const body = escapeHtml(announcement.message).replaceAll('\n', '<br>');
  return `<!doctype html>
<html lang="en"><body style="margin:0;background:#f6f8fb;font-family:Arial,sans-serif;color:#132238">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:24px">
<table role="presentation" width="100%" style="max-width:620px;background:#fff;border:1px solid #e5e9f0;border-radius:16px" cellspacing="0" cellpadding="0">
<tr><td style="padding:32px">
<p style="margin:0 0 16px;font-size:16px">Hello ${escapeHtml(firstName)},</p>
<h1 style="margin:0 0 16px;font-size:26px;line-height:1.25">${escapeHtml(announcement.title)}</h1>
<p style="margin:0 0 24px;font-size:16px;line-height:1.65">${body}</p>
<p style="margin:0 0 28px"><a href="${escapeHtml(link)}" style="display:inline-block;background:#047857;color:#fff;text-decoration:none;padding:14px 22px;border-radius:10px;font-weight:700">Open Brilla</a></p>
<p style="margin:0;color:#5c6678;font-size:12px;line-height:1.5">This non-promotional platform message was sent to your registered Brilla email address. <a href="${escapeHtml(settingsUrl)}">Manage communication preferences</a>.</p>
</td></tr></table></td></tr></table></body></html>`;
}

function announcementEmailText(
  recipientName: string,
  announcement: AnnouncementRow,
  appUrl: string,
): string {
  const firstName = recipientName.trim().split(/\s+/)[0] || 'there';
  const link = absoluteAppLink(appUrl, announcement.link);
  const settingsUrl = `${appUrl.replace(/\/$/, '')}/settings?tab=notifications`;
  return `Hello ${firstName},\n\n${announcement.title}\n\n${announcement.message}\n\nOpen Brilla: ${link}\n\nManage communication preferences: ${settingsUrl}`;
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function previewAudience(
  db: D1Database,
  audienceType: AudienceType,
  audienceIds: string[],
) {
  const filter = buildAudienceFilter(audienceType, audienceIds);
  const row = await db.prepare(`
    SELECT
      COUNT(DISTINCT u.id) AS matched_users,
      COUNT(DISTINCT CASE WHEN u.is_active = 1 THEN u.id END) AS active_users,
      COUNT(DISTINCT CASE WHEN u.is_active <> 1 THEN u.id END) AS inactive_users,
      COUNT(DISTINCT CASE
        WHEN u.email_verified = 1
          AND COALESCE(preferences.email_enabled, 1) = 1
          AND length(trim(u.email)) BETWEEN 3 AND 254
          AND instr(u.email, '@') > 1
        THEN u.id END
      ) AS email_candidates
    FROM users u
    LEFT JOIN platform_communication_preferences preferences ON preferences.user_id = u.id
    WHERE ${filter.sql}
  `).bind(...filter.params).first<{
    matched_users: number;
    active_users: number;
    inactive_users: number;
    email_candidates: number;
  }>();

  const roomCount = audienceType === 'chatrooms'
    ? await db.prepare(`
        SELECT COUNT(*) AS count FROM chat_rooms
        WHERE is_archived = 0 AND type <> 'dm' AND id IN (${placeholders(audienceIds.length)})
      `).bind(...audienceIds).first<{ count: number }>()
    : null;

  return {
    matchedUsers: Number(row?.matched_users || 0),
    activeUsers: Number(row?.active_users || 0),
    inactiveUsers: Number(row?.inactive_users || 0),
    emailCandidates: Number(row?.email_candidates || 0),
    selectedChatrooms: Number(roomCount?.count || 0),
  };
}

async function createRecipientSnapshot(
  db: D1Database,
  announcement: AnnouncementRow,
): Promise<void> {
  const audienceIds = JSON.parse(announcement.audience_ids) as string[];
  const filter = buildAudienceFilter(announcement.audience_type, audienceIds);
  await db.prepare(`
    INSERT OR IGNORE INTO admin_announcement_recipients (
      announcement_id, user_id, in_app_status, email_status, email_reason
    )
    SELECT
      ?,
      u.id,
      CASE WHEN ? = 1 THEN 'pending' ELSE 'skipped' END,
      CASE
        WHEN ? <> 1 THEN 'skipped'
        WHEN u.email_verified <> 1 THEN 'skipped'
        WHEN COALESCE(preferences.email_enabled, 1) <> 1 THEN 'skipped'
        WHEN length(trim(u.email)) NOT BETWEEN 3 AND 254 OR instr(u.email, '@') <= 1 THEN 'skipped'
        ELSE 'pending'
      END,
      CASE
        WHEN ? <> 1 THEN 'channel_disabled'
        WHEN u.email_verified <> 1 THEN 'email_unverified'
        WHEN COALESCE(preferences.email_enabled, 1) <> 1 THEN 'user_opted_out'
        WHEN length(trim(u.email)) NOT BETWEEN 3 AND 254 OR instr(u.email, '@') <= 1 THEN 'invalid_email'
        ELSE NULL
      END
    FROM users u
    LEFT JOIN platform_communication_preferences preferences ON preferences.user_id = u.id
    WHERE ${filter.sql}
  `).bind(
    announcement.id,
    announcement.send_in_app,
    announcement.send_email,
    announcement.send_email,
    ...filter.params,
  ).run();

  if (announcement.audience_type === 'chatrooms' && announcement.post_to_chatrooms === 1) {
    await db.prepare(`
      INSERT OR IGNORE INTO admin_announcement_chatrooms (announcement_id, room_id)
      SELECT ?, id FROM chat_rooms
      WHERE is_archived = 0 AND type <> 'dm' AND id IN (${placeholders(audienceIds.length)})
    `).bind(announcement.id, ...audienceIds).run();
  }
}

async function deliverInApp(db: D1Database, announcement: AnnouncementRow): Promise<void> {
  if (announcement.send_in_app !== 1) return;
  const metadata = JSON.stringify({ announcementId: announcement.id });
  await db.batch([
    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, icon, link, metadata)
      SELECT
        'notif_' || lower(hex(randomblob(16))),
        recipients.user_id,
        'announcement',
        ?, ?, 'megaphone', ?, ?
      FROM admin_announcement_recipients recipients
      WHERE recipients.announcement_id = ? AND recipients.in_app_status = 'pending'
    `).bind(announcement.title, announcement.message, announcement.link || '/community', metadata, announcement.id),
    db.prepare(`
      UPDATE admin_announcement_recipients
      SET in_app_status = 'sent', updated_at = datetime('now')
      WHERE announcement_id = ? AND in_app_status = 'pending'
    `).bind(announcement.id),
  ]);
}

async function deliverChatrooms(db: D1Database, announcement: AnnouncementRow): Promise<void> {
  if (announcement.post_to_chatrooms !== 1) return;
  const rooms = await db.prepare(`
    SELECT room_id FROM admin_announcement_chatrooms
    WHERE announcement_id = ? AND status IN ('pending', 'failed')
    ORDER BY room_id
  `).bind(announcement.id).all<{ room_id: string }>();
  for (const room of rooms.results) {
    const messageId = `msg_announcement_${crypto.randomUUID()}`;
    try {
      await db.batch([
        db.prepare(`
          INSERT INTO chat_messages (
            id, room_id, sender_id, content, content_type, created_at, updated_at
          ) VALUES (?, ?, ?, ?, 'text', datetime('now'), datetime('now'))
        `).bind(
          messageId,
          room.room_id,
          announcement.created_by,
          `[Announcement] ${announcement.title}\n\n${announcement.message}`,
        ),
        db.prepare(`UPDATE chat_rooms SET updated_at = datetime('now') WHERE id = ?`).bind(room.room_id),
        db.prepare(`
          UPDATE admin_announcement_chatrooms
          SET message_id = ?, status = 'posted', updated_at = datetime('now')
          WHERE announcement_id = ? AND room_id = ?
        `).bind(messageId, announcement.id, room.room_id),
      ]);
    } catch (error) {
      console.error('Announcement chatroom delivery failed', {
        announcementId: announcement.id,
        roomId: room.room_id,
        error: error instanceof Error ? error.message : 'unknown',
      });
      await db.prepare(`
        UPDATE admin_announcement_chatrooms SET status = 'failed', updated_at = datetime('now')
        WHERE announcement_id = ? AND room_id = ?
      `).bind(announcement.id, room.room_id).run();
    }
  }
}

async function setRecipientEmailStatus(
  db: D1Database,
  announcementId: string,
  userIds: string[],
  status: 'queued' | 'skipped' | 'failed',
  reason: string | null,
): Promise<void> {
  if (userIds.length === 0) return;
  await db.prepare(`
    UPDATE admin_announcement_recipients
    SET email_status = ?, email_reason = ?, updated_at = datetime('now')
    WHERE announcement_id = ? AND user_id IN (${placeholders(userIds.length)})
  `).bind(status, reason, announcementId, ...userIds).run();
}

async function deliverEmail(env: AnnouncementEnv, announcement: AnnouncementRow): Promise<void> {
  if (announcement.send_email !== 1) return;
  if (!env.RESEND_API_KEY) throw new Error('RESEND_NOT_CONFIGURED');

  const recipients = await env.DB.prepare(`
    SELECT recipients.user_id, u.name, lower(trim(u.email)) AS email
    FROM admin_announcement_recipients recipients
    JOIN users u ON u.id = recipients.user_id
    WHERE recipients.announcement_id = ?
      AND recipients.email_status IN ('pending', 'failed')
    ORDER BY recipients.user_id
    LIMIT ?
  `).bind(announcement.id, MAX_EMAIL_RECIPIENTS_PER_DISPATCH + 1).all<EmailRecipient>();

  if (recipients.results.length > MAX_EMAIL_RECIPIENTS_PER_DISPATCH) {
    throw new Error('EMAIL_AUDIENCE_TOO_LARGE');
  }

  const suppressionRows = await env.DB.prepare(`
    SELECT email_hash FROM marketing_email_suppressions
    WHERE expires_at IS NULL OR datetime(expires_at) > datetime('now')
  `).all<{ email_hash: string }>();
  const suppressions = new Set(suppressionRows.results.map((row) => row.email_hash));
  const eligible: EmailRecipient[] = [];
  const suppressedIds: string[] = [];
  for (const recipient of recipients.results) {
    if (!isDeliverableEmail(recipient.email)) {
      suppressedIds.push(recipient.user_id);
      continue;
    }
    const emailHash = await sha256Hex(recipient.email);
    if (suppressions.has(emailHash)) {
      suppressedIds.push(recipient.user_id);
    } else {
      eligible.push(recipient);
    }
  }
  await setRecipientEmailStatus(env.DB, announcement.id, suppressedIds, 'skipped', 'provider_suppression');

  const appUrl = env.APP_URL || 'https://brillaprep.org';
  const from = env.FROM_EMAIL || 'Brilla Study Platform <noreply@brillaprep.org>';
  for (let offset = 0; offset < eligible.length; offset += MAX_EMAIL_BATCH_SIZE) {
    const batch = eligible.slice(offset, offset + MAX_EMAIL_BATCH_SIZE);
    const batchFingerprint = await sha256Hex(batch.map((recipient) => recipient.user_id).join('|'));
    const response = await fetch(RESEND_BATCH_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `brilla-announcement/${announcement.id}/${batchFingerprint}`,
        'User-Agent': RESEND_USER_AGENT,
      },
      body: JSON.stringify(batch.map((recipient) => ({
        from,
        to: [recipient.email],
        subject: announcement.title,
        html: announcementEmailHtml(recipient.name, announcement, appUrl),
        text: announcementEmailText(recipient.name, announcement, appUrl),
      }))),
    });

    const userIds = batch.map((recipient) => recipient.user_id);
    if (response.ok) {
      await setRecipientEmailStatus(env.DB, announcement.id, userIds, 'queued', null);
    } else {
      console.error('Resend announcement batch failed', {
        announcementId: announcement.id,
        status: response.status,
        recipientCount: batch.length,
      });
      await setRecipientEmailStatus(
        env.DB,
        announcement.id,
        userIds,
        'failed',
        `provider_${response.status}`,
      );
    }
  }
}

async function readDeliveryCounts(db: D1Database, announcementId: string): Promise<DeliveryCounts> {
  const recipients = await db.prepare(`
    SELECT
      COUNT(*) AS matched_users,
      SUM(CASE WHEN in_app_status = 'sent' THEN 1 ELSE 0 END) AS in_app_sent,
      SUM(CASE WHEN email_status = 'queued' THEN 1 ELSE 0 END) AS email_queued,
      SUM(CASE WHEN email_status = 'skipped' THEN 1 ELSE 0 END) AS email_skipped,
      SUM(CASE WHEN email_status = 'failed' THEN 1 ELSE 0 END) AS email_failed
    FROM admin_announcement_recipients WHERE announcement_id = ?
  `).bind(announcementId).first<Omit<DeliveryCounts, 'chatrooms_posted' | 'chatrooms_failed'>>();
  const rooms = await db.prepare(`
    SELECT
      SUM(CASE WHEN status = 'posted' THEN 1 ELSE 0 END) AS chatrooms_posted,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS chatrooms_failed
    FROM admin_announcement_chatrooms WHERE announcement_id = ?
  `).bind(announcementId).first<Pick<DeliveryCounts, 'chatrooms_posted' | 'chatrooms_failed'>>();
  return {
    matched_users: Number(recipients?.matched_users || 0),
    in_app_sent: Number(recipients?.in_app_sent || 0),
    email_queued: Number(recipients?.email_queued || 0),
    email_skipped: Number(recipients?.email_skipped || 0),
    email_failed: Number(recipients?.email_failed || 0),
    chatrooms_posted: Number(rooms?.chatrooms_posted || 0),
    chatrooms_failed: Number(rooms?.chatrooms_failed || 0),
  };
}

function mapAnnouncement(row: AnnouncementRow) {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    link: row.link,
    audienceType: row.audience_type,
    audienceIds: JSON.parse(row.audience_ids) as string[],
    channels: {
      inApp: row.send_in_app === 1,
      email: row.send_email === 1,
      chatrooms: row.post_to_chatrooms === 1,
    },
    status: row.status,
    results: {
      matchedUsers: row.matched_users,
      inAppSent: row.in_app_sent,
      emailQueued: row.email_queued,
      emailSkipped: row.email_skipped,
      emailFailed: row.email_failed,
      chatroomsPosted: row.chatrooms_posted,
    },
    createdAt: row.created_at,
    dispatchedAt: row.dispatched_at,
    updatedAt: row.updated_at,
  };
}

announcementsApp.use('/preferences', requireAuth);

announcementsApp.get('/preferences', async (c) => {
  const userId = c.get('userId');
  const row = await c.env.DB.prepare(`
    SELECT email_enabled FROM platform_communication_preferences WHERE user_id = ?
  `).bind(userId).first<{ email_enabled: number }>();
  return c.json({ success: true, data: { emailEnabled: row?.email_enabled !== 0 } });
});

announcementsApp.put('/preferences', async (c) => {
  const parsed = await parseBoundedJsonBody(c, MAX_BODY_BYTES);
  if (!parsed.ok || typeof parsed.body.emailEnabled !== 'boolean') {
    return c.json({ success: false, error: 'Invalid communication preference' }, 400);
  }
  const enabled = parsed.body.emailEnabled ? 1 : 0;
  await c.env.DB.prepare(`
    INSERT INTO platform_communication_preferences (user_id, email_enabled, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(user_id) DO UPDATE SET
      email_enabled = excluded.email_enabled,
      updated_at = excluded.updated_at
  `).bind(c.get('userId'), enabled).run();
  return c.json({ success: true, data: { emailEnabled: enabled === 1 } });
});

announcementsApp.use('/admin/*', requireAdmin);

announcementsApp.get('/admin/overview', async (c) => {
  const [announcements, examTypes, schools, tiers, chatrooms] = await Promise.all([
    c.env.DB.prepare(`
      SELECT id, title, message, link, audience_type, audience_ids,
        send_in_app, send_email, post_to_chatrooms, status, matched_users,
        in_app_sent, email_queued, email_skipped, email_failed, chatrooms_posted,
        created_by, created_at, dispatched_at, updated_at
      FROM admin_announcements ORDER BY created_at DESC LIMIT 50
    `).all<AnnouncementRow>(),
    c.env.DB.prepare(`SELECT id, name FROM exam_types WHERE is_active = 1 ORDER BY display_order, name`).all<{ id: string; name: string }>(),
    c.env.DB.prepare(`SELECT id, name FROM schools ORDER BY name`).all<{ id: string; name: string }>(),
    c.env.DB.prepare(`SELECT id, name FROM subscription_tiers WHERE is_active = 1 ORDER BY price_monthly, name`).all<{ id: string; name: string }>(),
    c.env.DB.prepare(`
      SELECT rooms.id, rooms.name, rooms.type, COUNT(members.user_id) AS member_count
      FROM chat_rooms rooms
      LEFT JOIN chat_room_members members ON members.room_id = rooms.id
      WHERE rooms.is_archived = 0 AND rooms.type <> 'dm'
      GROUP BY rooms.id, rooms.name, rooms.type
      ORDER BY rooms.name
    `).all<{ id: string; name: string; type: string; member_count: number }>(),
  ]);

  return c.json({
    success: true,
    data: {
      provider: { emailConfigured: Boolean(c.env.RESEND_API_KEY) },
      options: {
        examTypes: examTypes.results,
        schools: schools.results,
        tiers: tiers.results,
        chatrooms: chatrooms.results.map((room) => ({
          id: room.id,
          name: room.name,
          type: room.type,
          memberCount: Number(room.member_count || 0),
        })),
      },
      announcements: announcements.results.map(mapAnnouncement),
    },
  });
});

announcementsApp.post('/admin/preview', async (c) => {
  const parsed = await parseBoundedJsonBody(c, MAX_BODY_BYTES);
  if (!parsed.ok) return c.json({ success: false, error: 'Invalid request body' }, 400);
  const audienceType = parsed.body.audienceType;
  const audienceIds = uniqueStringIds(parsed.body.audienceIds);
  if (!['all', 'exam', 'school', 'tier', 'chatrooms'].includes(String(audienceType)) || !audienceIds) {
    return c.json({ success: false, error: 'Invalid audience selection' }, 400);
  }
  if ((audienceType === 'all' && audienceIds.length > 0) || (audienceType !== 'all' && audienceIds.length === 0)) {
    return c.json({ success: false, error: 'Invalid audience selection' }, 400);
  }
  const preview = await previewAudience(c.env.DB, audienceType as AudienceType, audienceIds);
  return c.json({ success: true, data: preview });
});

announcementsApp.post('/admin/announcements', async (c) => {
  const parsed = await parseBoundedJsonBody(c, MAX_BODY_BYTES);
  if (!parsed.ok) {
    return c.json({ success: false, error: 'Invalid request body' }, parsed.reason === 'too_large' ? 413 : 400);
  }
  const payload = parseAnnouncementPayload(parsed.body);
  if (!payload) return c.json({ success: false, error: 'Announcement fields are invalid' }, 400);

  const id = crypto.randomUUID();
  await c.env.DB.prepare(`
    INSERT INTO admin_announcements (
      id, title, message, link, audience_type, audience_ids,
      send_in_app, send_email, post_to_chatrooms, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    payload.title,
    payload.message,
    payload.link,
    payload.audienceType,
    JSON.stringify(payload.audienceIds),
    payload.sendInApp ? 1 : 0,
    payload.sendEmail ? 1 : 0,
    payload.postToChatrooms ? 1 : 0,
    c.get('userId'),
  ).run();

  return c.json({ success: true, data: { id, status: 'draft' } }, 201);
});

announcementsApp.post('/admin/announcements/:id/send', async (c) => {
  const announcementId = c.req.param('id');
  const parsed = await parseBoundedJsonBody(c, MAX_BODY_BYTES);
  if (!parsed.ok || parsed.body.confirmation !== `SEND ${announcementId}`) {
    return c.json({ success: false, error: `Type SEND ${announcementId} to confirm dispatch` }, 400);
  }

  const announcement = await c.env.DB.prepare(`
    SELECT id, title, message, link, audience_type, audience_ids,
      send_in_app, send_email, post_to_chatrooms, status, matched_users,
      in_app_sent, email_queued, email_skipped, email_failed, chatrooms_posted,
      created_by, created_at, dispatched_at, updated_at
    FROM admin_announcements WHERE id = ?
  `).bind(announcementId).first<AnnouncementRow>();
  if (!announcement) return c.json({ success: false, error: 'Announcement not found' }, 404);
  if (announcement.status === 'sent') {
    return c.json({ success: false, error: 'This announcement has already been fully dispatched' }, 409);
  }
  if (announcement.send_email === 1 && !c.env.RESEND_API_KEY) {
    return c.json({ success: false, error: 'Resend email delivery is not configured' }, 503);
  }

  await c.env.DB.prepare(`
    UPDATE admin_announcements SET status = 'dispatching', updated_at = datetime('now')
    WHERE id = ? AND status <> 'sent'
  `).bind(announcement.id).run();

  try {
    await createRecipientSnapshot(c.env.DB, announcement);
    await deliverInApp(c.env.DB, announcement);
    await deliverChatrooms(c.env.DB, announcement);
    await deliverEmail(c.env, announcement);
  } catch (error) {
    const code = error instanceof Error ? error.message : 'DELIVERY_FAILED';
    const counts = await readDeliveryCounts(c.env.DB, announcement.id);
    await c.env.DB.prepare(`
      UPDATE admin_announcements SET
        status = 'failed', matched_users = ?, in_app_sent = ?, email_queued = ?,
        email_skipped = ?, email_failed = ?, chatrooms_posted = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      counts.matched_users,
      counts.in_app_sent,
      counts.email_queued,
      counts.email_skipped,
      counts.email_failed,
      counts.chatrooms_posted,
      announcement.id,
    ).run();
    console.error('Announcement dispatch failed', { announcementId: announcement.id, code });
    const status = code === 'EMAIL_AUDIENCE_TOO_LARGE' ? 413 : 500;
    return c.json({ success: false, error: code, data: counts }, status);
  }

  const counts = await readDeliveryCounts(c.env.DB, announcement.id);
  const isPartial = counts.email_failed > 0 || counts.chatrooms_failed > 0;
  const finalStatus = isPartial ? 'partial' : 'sent';
  await c.env.DB.prepare(`
    UPDATE admin_announcements SET
      status = ?, matched_users = ?, in_app_sent = ?, email_queued = ?,
      email_skipped = ?, email_failed = ?, chatrooms_posted = ?,
      dispatched_at = COALESCE(dispatched_at, datetime('now')), updated_at = datetime('now')
    WHERE id = ?
  `).bind(
    finalStatus,
    counts.matched_users,
    counts.in_app_sent,
    counts.email_queued,
    counts.email_skipped,
    counts.email_failed,
    counts.chatrooms_posted,
    announcement.id,
  ).run();

  return c.json({
    success: true,
    data: {
      status: finalStatus,
      matchedUsers: counts.matched_users,
      inAppSent: counts.in_app_sent,
      emailQueued: counts.email_queued,
      emailSkipped: counts.email_skipped,
      emailFailed: counts.email_failed,
      chatroomsPosted: counts.chatrooms_posted,
      duplicateSendProtected: true,
    },
  });
});
