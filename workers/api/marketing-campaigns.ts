import { Hono } from 'hono';
import type { Context } from 'hono';
import { requireAdmin, requireAuth, constantTimeEqual } from './auth-middleware';
import { parseBoundedJsonBody } from './http';

const CONSENT_VERSION = 'referral-rewards-explicit-opt-in-2026-08-29';
const RESEND_API_BASE = 'https://api.resend.com';
const RESEND_USER_AGENT = 'BrillaPrep-Worker/1.0 (+https://brillaprep.org)';
const MAX_BODY_BYTES = 16_384;
const WEBHOOK_TOLERANCE_SECONDS = 300;

interface MarketingEnv {
  DB: D1Database;
  JWT_SECRET: string;
  RESEND_API_KEY?: string;
  RESEND_WEBHOOK_SECRET?: string;
  RESEND_REFERRAL_TOPIC_ID?: string;
  APP_URL?: string;
  FROM_EMAIL?: string;
}

interface MarketingVariables {
  userId: string;
  userRole: string;
  user: { userId: string; email?: string; role?: string };
}

type MarketingContext = Context<{ Bindings: MarketingEnv; Variables: MarketingVariables }>;

interface MarketingUser {
  id: string;
  name: string;
  email: string;
  email_verified: number;
  status: string;
  is_active: number;
  is_demo: number;
}

interface PreferenceRow {
  referral_rewards_opt_in: number;
  consent_version: string | null;
  consented_at: string | null;
  consent_source: string | null;
  eligibility_basis: string;
  unsubscribed_at: string | null;
  provider_sync_status: string;
  provider_synced_at: string | null;
}

interface CampaignRow {
  id: string;
  name: string;
  subject: string;
  preview_text: string;
  message: string;
  pilot_percent: number;
  status: string;
  audience_count: number;
  provider_segment_id: string | null;
  provider_broadcast_id: string | null;
  created_at: string;
  updated_at: string;
}

interface CampaignDispatchRow {
  campaign_id: string;
  status: 'preparing' | 'queued' | 'sent' | 'failed';
  expected_recipient_count: number;
  provider_send_id: string | null;
  provider_status: string | null;
  failure_code: string | null;
  requested_at: string;
  completed_at: string | null;
  updated_at: string;
}

interface ResendBroadcast {
  id: string;
  segment_id: string;
  subject: string;
  status: 'draft' | 'scheduled' | 'queued' | 'sent';
  topic_id: string | null;
  scheduled_at: string | null;
  sent_at: string | null;
}

interface EligibleRecipient {
  id: string;
  name: string;
  email: string;
  referral_code: string;
  consent_version: string;
  eligibility_basis: string;
}

interface ResendContact {
  id: string;
  email: string;
  unsubscribed: boolean;
}

interface ResendContactList {
  data: ResendContact[];
  has_more: boolean;
}

export const marketingCampaignsApp = new Hono<{
  Bindings: MarketingEnv;
  Variables: MarketingVariables;
}>();

function now(): string {
  return new Date().toISOString();
}

function isNonEmptyString(value: unknown, maxLength: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= maxLength;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
function isDeliverableEmail(email: string): boolean {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}


async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function stableScore(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function getUserId(c: MarketingContext): string {
  return c.get('userId');
}

async function getMarketingUser(db: D1Database, userId: string): Promise<MarketingUser | null> {
  return db.prepare(`
    SELECT id, name, email, email_verified, status, is_active, COALESCE(is_demo, 0) AS is_demo
    FROM users
    WHERE id = ?
  `).bind(userId).first<MarketingUser>();
}

async function resendRequest<T>(
  env: MarketingEnv,
  path: string,
  options: { method?: string; body?: Record<string, unknown> } = {},
): Promise<{ ok: true; data: T } | { ok: false; status: number; error: string }> {
  if (!env.RESEND_API_KEY) {
    return { ok: false, status: 503, error: 'Resend marketing integration is not configured' };
  }

  const response = await fetch(`${RESEND_API_BASE}${path}`, {
    method: options.method || 'GET',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      'User-Agent': RESEND_USER_AGENT,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const responseText = await response.text();
  let responseData: unknown = {};
  if (responseText) {
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = {};
    }
  }

  if (!response.ok) {
    const candidate = responseData as { message?: unknown; error?: unknown };
    const providerMessage = typeof candidate.message === 'string'
      ? candidate.message
      : typeof candidate.error === 'string' ? candidate.error : 'Provider request failed';
    console.error('Resend marketing request failed', { path, status: response.status, providerMessage });
    return { ok: false, status: response.status, error: providerMessage };
  }

  return { ok: true, data: responseData as T };
}

async function getResendContact(env: MarketingEnv, email: string) {
  return resendRequest<ResendContact>(env, `/contacts/${encodeURIComponent(email)}`);
}

async function getResendBroadcast(env: MarketingEnv, broadcastId: string) {
  return resendRequest<ResendBroadcast>(env, `/broadcasts/${encodeURIComponent(broadcastId)}`);
}

async function getResendSegmentContacts(
  env: MarketingEnv,
  segmentId: string,
): Promise<{ ok: true; data: ResendContact[] } | { ok: false }> {
  const contacts: ResendContact[] = [];
  let after: string | null = null;
  for (let page = 0; page < 50; page += 1) {
    const cursor: string = after ? `&after=${encodeURIComponent(after)}` : '';
    const response: Awaited<ReturnType<typeof resendRequest<ResendContactList>>> = await resendRequest<ResendContactList>(
      env,
      `/segments/${encodeURIComponent(segmentId)}/contacts?limit=100${cursor}`,
    );
    if (!response.ok) return { ok: false };
    contacts.push(...response.data.data);
    if (!response.data.has_more) return { ok: true, data: contacts };
    const lastContact: ResendContact | undefined = response.data.data.at(-1);
    if (!lastContact) return { ok: false };
    after = lastContact.id;
  }
  return { ok: false };
}

async function syncExplicitPreference(
  env: MarketingEnv,
  user: MarketingUser,
  optIn: boolean,
): Promise<{ status: 'synced' | 'suppressed' | 'not_synced' | 'failed'; contactId: string | null }> {
  if (!env.RESEND_API_KEY) return { status: 'not_synced', contactId: null };

  const email = normalizeEmail(user.email);
  const existing = await getResendContact(env, email);

  if (existing.ok) {
    const updated = await resendRequest<{ id: string }>(env, `/contacts/${encodeURIComponent(email)}`, {
      method: 'PATCH',
      body: {
        unsubscribed: !optIn,
      },
    });
    if (!updated.ok) return { status: 'failed', contactId: existing.data.id };

    if (env.RESEND_REFERRAL_TOPIC_ID) {
      const topicsUpdated = await resendRequest<{ id: string }>(
        env,
        `/contacts/${encodeURIComponent(email)}/topics`,
        {
          method: 'PATCH',
          body: {
            topics: [{
              id: env.RESEND_REFERRAL_TOPIC_ID,
              subscription: optIn ? 'opt_in' : 'opt_out',
            }],
          },
        },
      );
      if (!topicsUpdated.ok) return { status: 'failed', contactId: existing.data.id };
    }

    return { status: optIn ? 'synced' : 'suppressed', contactId: existing.data.id };
  }

  if (existing.status !== 404) return { status: 'failed', contactId: null };

  const names = user.name.trim().split(/\s+/);
  const created = await resendRequest<{ id: string }>(env, '/contacts', {
    method: 'POST',
    body: {
      email,
      first_name: names[0] || 'Student',
      last_name: names.slice(1).join(' '),
      unsubscribed: !optIn,
      ...(optIn && env.RESEND_REFERRAL_TOPIC_ID ? {
        topics: [{ id: env.RESEND_REFERRAL_TOPIC_ID, subscription: 'opt_in' }],
      } : {}),
    },
  });

  return created.ok
    ? { status: optIn ? 'synced' : 'suppressed', contactId: created.data.id }
    : { status: 'failed', contactId: null };
}

async function readBoundedText(c: MarketingContext, maxBytes: number): Promise<string | null> {
  const declared = c.req.header('content-length');
  if (declared && /^\d+$/.test(declared) && Number(declared) > maxBytes) return null;
  const body = await c.req.arrayBuffer();
  if (body.byteLength > maxBytes) return null;
  return new TextDecoder().decode(body);
}

function decodeBase64(value: string): Uint8Array | null {
  try {
    const decoded = atob(value);
    return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
  } catch {
    return null;
  }
}

async function verifyResendWebhook(
  secret: string,
  svixId: string,
  svixTimestamp: string,
  signatureHeader: string,
  rawBody: string,
): Promise<boolean> {
  const timestamp = Number(svixTimestamp);
  if (!Number.isSafeInteger(timestamp)) return false;
  const currentSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(currentSeconds - timestamp) > WEBHOOK_TOLERANCE_SECONDS) return false;

  const encodedSecret = secret.startsWith('whsec_') ? secret.slice(6) : secret;
  const keyBytes = decodeBase64(encodedSecret);
  if (!keyBytes) return false;

  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signedPayload = `${svixId}.${svixTimestamp}.${rawBody}`;
  const expectedBytes = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload)));

  return signatureHeader.split(' ').some((candidate) => {
    const [version, encoded] = candidate.split(',', 2);
    if (version !== 'v1' || !encoded) return false;
    const receivedBytes = decodeBase64(encoded);
    if (!receivedBytes) return false;
    const expected = Array.from(expectedBytes, (byte) => String.fromCharCode(byte)).join('');
    const received = Array.from(receivedBytes, (byte) => String.fromCharCode(byte)).join('');
    return constantTimeEqual(expected, received);
  });
}

// D1 does not expose a sha256 SQL function. The eligibility query above is
// therefore implemented with a pre-filter plus a hash suppression pass here.
async function getEligibleRecipients(db: D1Database): Promise<EligibleRecipient[]> {
  const result = await db.prepare(`
    SELECT
      u.id,
      u.name,
      lower(trim(u.email)) AS email,
      ap.referral_code,
      mp.consent_version,
      mp.eligibility_basis
    FROM users u
    JOIN marketing_email_preferences mp ON mp.user_id = u.id
    JOIN affiliate_profiles ap ON ap.user_id = u.id
    WHERE u.status = 'approved'
      AND u.is_active = 1
      AND COALESCE(u.is_demo, 0) = 0
      AND u.email_verified = 1
      AND mp.referral_rewards_opt_in = 1
      AND mp.unsubscribed_at IS NULL
      AND mp.consent_version IS NOT NULL
      AND mp.eligibility_basis IN ('explicit_opt_in', 'guardian_confirmed')
      AND ap.referral_code IS NOT NULL
      AND trim(ap.referral_code) <> ''
    ORDER BY u.id
  `).all<EligibleRecipient>();

  if (result.results.length === 0) return [];
  const suppressions = await db.prepare(`
    SELECT email_hash
    FROM marketing_email_suppressions
    WHERE expires_at IS NULL OR datetime(expires_at) > datetime('now')
  `).all<{ email_hash: string }>();
  const suppressionSet = new Set(suppressions.results.map((row) => row.email_hash));
  const filtered: EligibleRecipient[] = [];
  for (const recipient of result.results) {
    if (isDeliverableEmail(recipient.email) && !suppressionSet.has(await sha256Hex(recipient.email))) {
      filtered.push(recipient);
    }
  }
  return filtered;
}

function campaignHtml(campaign: CampaignRow, appUrl: string): string {
  const affiliateUrl = `${appUrl.replace(/\/$/, '')}/affiliate`;
  return `<!doctype html>
<html lang="en"><body style="margin:0;background:#f6f8fb;font-family:Arial,sans-serif;color:#132238">
<div style="display:none;max-height:0;overflow:hidden">${escapeHtml(campaign.preview_text)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:24px">
<table role="presentation" width="100%" style="max-width:620px;background:#fff;border:1px solid #e5e9f0;border-radius:16px" cellspacing="0" cellpadding="0">
<tr><td style="padding:32px">
<p style="margin:0 0 16px;font-size:16px">Hi {{{contact.first_name|there}}},</p>
<h1 style="margin:0 0 16px;font-size:28px;line-height:1.25">Help a friend prepare. Earn eligible Brilla rewards.</h1>
<p style="margin:0 0 24px;font-size:16px;line-height:1.6">${escapeHtml(campaign.message)}</p>
<p style="margin:0 0 28px"><a href="${escapeHtml(affiliateUrl)}" style="display:inline-block;background:#047857;color:#fff;text-decoration:none;padding:14px 22px;border-radius:10px;font-weight:700">Open my referral dashboard</a></p>
<p style="margin:0 0 16px;color:#5c6678;font-size:13px;line-height:1.5">Rewards depend on qualifying referral activity and the current programme terms. Earnings are not guaranteed.</p>
<p style="margin:0;color:#5c6678;font-size:12px;line-height:1.5">You received this because you opted in to referral and rewards emails. <a href="{{{RESEND_UNSUBSCRIBE_URL}}}">Unsubscribe</a> at any time.</p>
</td></tr></table></td></tr></table></body></html>`;
}

function campaignText(campaign: CampaignRow, appUrl: string): string {
  return `Hi there,\n\nHelp a friend prepare. Earn eligible Brilla rewards.\n\n${campaign.message}\n\nOpen your referral dashboard: ${appUrl.replace(/\/$/, '')}/affiliate\n\nRewards depend on qualifying referral activity and the current programme terms. Earnings are not guaranteed.\n\nUnsubscribe: {{{RESEND_UNSUBSCRIBE_URL}}}`;
}

marketingCampaignsApp.post('/webhooks/resend', async (c) => {
  if (!c.env.RESEND_WEBHOOK_SECRET) {
    return c.json({ success: false, error: 'Webhook is not configured' }, 503);
  }

  const svixId = c.req.header('svix-id') || '';
  const svixTimestamp = c.req.header('svix-timestamp') || '';
  const svixSignature = c.req.header('svix-signature') || '';
  if (!svixId || !svixTimestamp || !svixSignature) {
    return c.json({ success: false, error: 'Missing webhook signature' }, 400);
  }

  const rawBody = await readBoundedText(c, MAX_BODY_BYTES);
  if (rawBody === null) return c.json({ success: false, error: 'Webhook body is too large' }, 413);
  if (!await verifyResendWebhook(c.env.RESEND_WEBHOOK_SECRET, svixId, svixTimestamp, svixSignature, rawBody)) {
    return c.json({ success: false, error: 'Invalid webhook signature' }, 401);
  }

  let event: { type?: unknown; created_at?: unknown; data?: Record<string, unknown> };
  try {
    event = JSON.parse(rawBody) as typeof event;
  } catch {
    return c.json({ success: false, error: 'Invalid webhook payload' }, 400);
  }

  const eventType = typeof event.type === 'string' ? event.type : 'unknown';
  const createdAt = typeof event.created_at === 'string' ? event.created_at : null;
  const data = event.data || {};
  const statements: D1PreparedStatement[] = [
    c.env.DB.prepare(`
      INSERT OR IGNORE INTO marketing_webhook_events (svix_id, event_type, event_created_at)
      VALUES (?, ?, ?)
    `).bind(svixId, eventType, createdAt),
  ];

  const emails: Array<{ email: string; reason: 'provider_unsubscribe' | 'hard_bounce' | 'complaint' }> = [];
  if (eventType === 'contact.updated' && data.unsubscribed === true && typeof data.email === 'string') {
    emails.push({ email: normalizeEmail(data.email), reason: 'provider_unsubscribe' });
  }
  if (eventType === 'email.bounced' || eventType === 'email.complained') {
    const recipients = Array.isArray(data.to) ? data.to : [];
    for (const recipient of recipients) {
      if (typeof recipient === 'string') {
        emails.push({
          email: normalizeEmail(recipient),
          reason: eventType === 'email.bounced' ? 'hard_bounce' : 'complaint',
        });
      }
    }
  }

  for (const item of emails) {
    const user = await c.env.DB.prepare('SELECT id FROM users WHERE lower(trim(email)) = ?')
      .bind(item.email)
      .first<{ id: string }>();
    const emailHash = await sha256Hex(item.email);
    statements.push(c.env.DB.prepare(`
      INSERT INTO marketing_email_suppressions (id, user_id, email_hash, reason, source)
      VALUES (?, ?, ?, ?, 'resend_webhook')
      ON CONFLICT(email_hash) DO UPDATE SET
        user_id = excluded.user_id,
        reason = excluded.reason,
        source = excluded.source,
        expires_at = NULL
    `).bind(crypto.randomUUID(), user?.id || null, emailHash, item.reason));

    if (user) {
      statements.push(c.env.DB.prepare(`
        INSERT INTO marketing_email_preferences (
          user_id, referral_rewards_opt_in, unsubscribed_at, provider_sync_status, updated_at
        ) VALUES (?, 0, ?, 'suppressed', ?)
        ON CONFLICT(user_id) DO UPDATE SET
          referral_rewards_opt_in = 0,
          unsubscribed_at = excluded.unsubscribed_at,
          provider_sync_status = 'suppressed',
          updated_at = excluded.updated_at
      `).bind(user.id, now(), now()));
      statements.push(c.env.DB.prepare(`
        INSERT OR IGNORE INTO marketing_consent_events (
          id, user_id, action, source, consent_version, eligibility_basis
        ) VALUES (?, ?, 'provider_unsubscribe', 'resend_webhook', ?, 'unknown')
      `).bind(`resend-${svixId}-${user.id}`, user.id, CONSENT_VERSION));
    }
  }

  await c.env.DB.batch(statements);
  return c.json({ success: true });
});

marketingCampaignsApp.use('/preferences', requireAuth);
marketingCampaignsApp.use('/preferences/*', requireAuth);

marketingCampaignsApp.get('/preferences', async (c) => {
  const user = await getMarketingUser(c.env.DB, getUserId(c));
  if (!user) return c.json({ success: false, error: 'User not found' }, 404);
  const preference = await c.env.DB.prepare(`
    SELECT referral_rewards_opt_in, consent_version, consented_at, consent_source,
      eligibility_basis, unsubscribed_at, provider_sync_status, provider_synced_at
    FROM marketing_email_preferences WHERE user_id = ?
  `).bind(user.id).first<PreferenceRow>();

  return c.json({
    success: true,
    data: {
      referralRewardsOptIn: preference?.referral_rewards_opt_in === 1,
      consentVersion: preference?.consent_version || null,
      consentedAt: preference?.consented_at || null,
      consentSource: preference?.consent_source || null,
      eligibilityBasis: preference?.eligibility_basis || 'unknown',
      providerSyncStatus: preference?.provider_sync_status || 'not_synced',
      emailVerified: user.email_verified === 1,
      consentCopyVersion: CONSENT_VERSION,
    },
  });
});

marketingCampaignsApp.put('/preferences', async (c) => {
  const parsed = await parseBoundedJsonBody(c, MAX_BODY_BYTES);
  if (!parsed.ok) {
    return c.json({ success: false, error: parsed.reason === 'too_large' ? 'Request is too large' : 'Invalid request body' }, parsed.reason === 'too_large' ? 413 : 400);
  }
  const optIn = parsed.body.referralRewardsOptIn;
  const requestedSource = parsed.body.consentSource;
  const allowedSources = new Set(['settings', 'student_onboarding', 'affiliate_dashboard']);
  if (typeof optIn !== 'boolean' ||
      (requestedSource !== undefined &&
        (typeof requestedSource !== 'string' || !allowedSources.has(requestedSource)))) {
    return c.json({ success: false, error: 'Invalid preference values' }, 400);
  }
  const consentSource = typeof requestedSource === 'string' ? requestedSource : 'settings';

  const user = await getMarketingUser(c.env.DB, getUserId(c));
  if (!user) return c.json({ success: false, error: 'User not found' }, 404);
  const timestamp = now();
  const emailHash = await sha256Hex(normalizeEmail(user.email));

  if (optIn) {
    if (user.email_verified !== 1) {
      return c.json({ success: false, error: 'Confirm your email address before opting in' }, 409);
    }
    if (user.is_demo === 1) {
      return c.json({ success: false, error: 'Demo accounts cannot join marketing lists' }, 409);
    }

    const blockingSuppression = await c.env.DB.prepare(`
      SELECT reason FROM marketing_email_suppressions
      WHERE email_hash = ? AND reason IN ('hard_bounce', 'complaint', 'admin')
        AND (expires_at IS NULL OR datetime(expires_at) > datetime('now'))
    `).bind(emailHash).first<{ reason: string }>();
    if (blockingSuppression) {
      return c.json({ success: false, error: 'This email address cannot currently receive marketing email' }, 409);
    }

    const basis = 'explicit_opt_in';
    await c.env.DB.batch([
      c.env.DB.prepare(`
        DELETE FROM marketing_email_suppressions
        WHERE email_hash = ? AND reason IN ('user_opt_out', 'provider_unsubscribe')
      `).bind(emailHash),
      c.env.DB.prepare(`
        INSERT INTO marketing_email_preferences (
          user_id, referral_rewards_opt_in, consent_version, consented_at, consent_source,
          eligibility_basis, consent_actor_user_id, unsubscribed_at, provider_sync_status, updated_at
        ) VALUES (?, 1, ?, ?, ?, ?, ?, NULL, 'pending', ?)
        ON CONFLICT(user_id) DO UPDATE SET
          referral_rewards_opt_in = 1,
          consent_version = excluded.consent_version,
          consented_at = excluded.consented_at,
          consent_source = excluded.consent_source,
          eligibility_basis = excluded.eligibility_basis,
          consent_actor_user_id = excluded.consent_actor_user_id,
          unsubscribed_at = NULL,
          provider_sync_status = 'pending',
          updated_at = excluded.updated_at
      `).bind(user.id, CONSENT_VERSION, timestamp, consentSource, basis, user.id, timestamp),
      c.env.DB.prepare(`
        INSERT INTO marketing_consent_events (
          id, user_id, action, actor_user_id, source, consent_version, eligibility_basis
        ) VALUES (?, ?, 'opt_in', ?, ?, ?, ?)
      `).bind(crypto.randomUUID(), user.id, user.id, consentSource, CONSENT_VERSION, basis),
    ]);

    const sync = await syncExplicitPreference(c.env, user, true);
    await c.env.DB.prepare(`
      UPDATE marketing_email_preferences SET
        provider_contact_id = COALESCE(?, provider_contact_id),
        provider_sync_status = ?,
        provider_synced_at = CASE WHEN ? = 'synced' THEN ? ELSE provider_synced_at END,
        updated_at = ?
      WHERE user_id = ?
    `).bind(sync.contactId, sync.status, sync.status, timestamp, timestamp, user.id).run();

    return c.json({
      success: true,
      data: {
        referralRewardsOptIn: true,
        providerSyncStatus: sync.status,
        consentVersion: CONSENT_VERSION,
      },
    });
  }

  await c.env.DB.batch([
    c.env.DB.prepare(`
      INSERT INTO marketing_email_preferences (
        user_id, referral_rewards_opt_in, eligibility_basis, unsubscribed_at,
        provider_sync_status, updated_at
      ) VALUES (?, 0, 'unknown', ?, 'suppressed', ?)
      ON CONFLICT(user_id) DO UPDATE SET
        referral_rewards_opt_in = 0,
        eligibility_basis = 'unknown',
        unsubscribed_at = excluded.unsubscribed_at,
        provider_sync_status = 'suppressed',
        updated_at = excluded.updated_at
    `).bind(user.id, timestamp, timestamp),
    c.env.DB.prepare(`
      INSERT INTO marketing_email_suppressions (id, user_id, email_hash, reason, source)
      VALUES (?, ?, ?, 'user_opt_out', ?)
      ON CONFLICT(email_hash) DO UPDATE SET
        user_id = excluded.user_id,
        reason = 'user_opt_out',
        source = excluded.source,
        expires_at = NULL
    `).bind(crypto.randomUUID(), user.id, emailHash, consentSource),
    c.env.DB.prepare(`
      INSERT INTO marketing_consent_events (
        id, user_id, action, actor_user_id, source, consent_version, eligibility_basis
      ) VALUES (?, ?, 'opt_out', ?, ?, ?, 'unknown')
    `).bind(crypto.randomUUID(), user.id, user.id, consentSource, CONSENT_VERSION),
  ]);

  const sync = await syncExplicitPreference(c.env, user, false);
  return c.json({
    success: true,
    data: {
      referralRewardsOptIn: false,
      providerSyncStatus: sync.status === 'failed' ? 'suppressed' : sync.status,
      consentVersion: CONSENT_VERSION,
    },
  });
});

marketingCampaignsApp.use('/admin', requireAdmin);
marketingCampaignsApp.use('/admin/*', requireAdmin);

marketingCampaignsApp.get('/admin/overview', async (c) => {
  const [activeVerified, consented, eligibleRecipients, suppressed, campaigns, dispatches] = await Promise.all([
    c.env.DB.prepare(`
      SELECT COUNT(*) AS count FROM users
      WHERE status = 'approved' AND is_active = 1 AND COALESCE(is_demo, 0) = 0 AND email_verified = 1
    `).first<{ count: number }>(),
    c.env.DB.prepare(`
      SELECT COUNT(*) AS count FROM marketing_email_preferences
      WHERE referral_rewards_opt_in = 1 AND unsubscribed_at IS NULL
    `).first<{ count: number }>(),
    getEligibleRecipients(c.env.DB),
    c.env.DB.prepare(`
      SELECT COUNT(*) AS count FROM marketing_email_suppressions
      WHERE expires_at IS NULL OR datetime(expires_at) > datetime('now')
    `).first<{ count: number }>(),
    c.env.DB.prepare(`
      SELECT id, name, subject, preview_text, message, pilot_percent, status,
        audience_count, provider_segment_id, provider_broadcast_id, created_at, updated_at
      FROM marketing_campaigns ORDER BY created_at DESC LIMIT 25
    `).all<CampaignRow>(),
    c.env.DB.prepare(`
      SELECT campaign_id, status, expected_recipient_count, provider_send_id, provider_status,
        failure_code, requested_at, completed_at, updated_at
      FROM marketing_campaign_dispatches ORDER BY requested_at DESC LIMIT 25
    `).all<CampaignDispatchRow>(),
  ]);

  const dispatchByCampaign = new Map(dispatches.results.map((dispatch) => [dispatch.campaign_id, dispatch]));

  return c.json({
    success: true,
    data: {
      audience: {
        activeVerified: activeVerified?.count || 0,
        explicitlyConsented: consented?.count || 0,
        eligible: eligibleRecipients.length,
        suppressed: suppressed?.count || 0,
      },
      provider: {
        apiConfigured: Boolean(c.env.RESEND_API_KEY),
        webhookConfigured: Boolean(c.env.RESEND_WEBHOOK_SECRET),
        topicConfigured: Boolean(c.env.RESEND_REFERRAL_TOPIC_ID),
      },
      campaigns: campaigns.results.map((campaign) => {
        const dispatch = dispatchByCampaign.get(campaign.id);
        return {
          id: campaign.id,
          name: campaign.name,
          subject: campaign.subject,
          previewText: campaign.preview_text,
          message: campaign.message,
          pilotPercent: campaign.pilot_percent,
          status: campaign.status,
          audienceCount: campaign.audience_count,
          providerDraftCreated: Boolean(campaign.provider_broadcast_id),
          dispatch: dispatch ? {
            status: dispatch.status,
            expectedRecipientCount: dispatch.expected_recipient_count,
            providerStatus: dispatch.provider_status,
            failureCode: dispatch.failure_code,
            requestedAt: dispatch.requested_at,
            completedAt: dispatch.completed_at,
          } : null,
          createdAt: campaign.created_at,
          updatedAt: campaign.updated_at,
        };
      }),
      safety: {
        sendEndpointAvailable: true,
        note: 'Sending requires a consent recheck, an immutable provider draft, and a typed campaign confirmation. Each campaign can be dispatched only once.',
      },
    },
  });
});

marketingCampaignsApp.post('/admin/campaigns', async (c) => {
  const parsed = await parseBoundedJsonBody(c, MAX_BODY_BYTES);
  if (!parsed.ok) return c.json({ success: false, error: 'Invalid request body' }, parsed.reason === 'too_large' ? 413 : 400);

  const { name, subject, previewText, message, pilotPercent } = parsed.body;
  if (!isNonEmptyString(name, 100) || !isNonEmptyString(subject, 150) ||
      !isNonEmptyString(previewText, 180) || !isNonEmptyString(message, 800) ||
      !Number.isInteger(pilotPercent) || Number(pilotPercent) < 1 || Number(pilotPercent) > 10) {
    return c.json({ success: false, error: 'Campaign fields are invalid. Pilot size must be between 1% and 10%.' }, 400);
  }

  const id = crypto.randomUUID();
  const timestamp = now();
  await c.env.DB.prepare(`
    INSERT INTO marketing_campaigns (
      id, name, subject, preview_text, message, pilot_percent, created_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    name.trim(),
    subject.trim(),
    previewText.trim(),
    message.trim(),
    Number(pilotPercent),
    getUserId(c),
    timestamp,
    timestamp,
  ).run();

  return c.json({ success: true, data: { id, status: 'draft' } }, 201);
});

marketingCampaignsApp.post('/admin/campaigns/:id/build-audience', async (c) => {
  const campaignId = c.req.param('id');
  const campaign = await c.env.DB.prepare(`
    SELECT id, name, subject, preview_text, message, pilot_percent, status,
      audience_count, provider_segment_id, provider_broadcast_id, created_at, updated_at
    FROM marketing_campaigns WHERE id = ?
  `).bind(campaignId).first<CampaignRow>();
  if (!campaign) return c.json({ success: false, error: 'Campaign not found' }, 404);
  if (campaign.status !== 'draft' && campaign.status !== 'audience_ready') {
    return c.json({ success: false, error: 'Provider drafts have immutable audience snapshots' }, 409);
  }

  const eligible = await getEligibleRecipients(c.env.DB);
  const targetSize = eligible.length === 0
    ? 0
    : Math.max(1, Math.ceil((eligible.length * campaign.pilot_percent) / 100));
  const selected = [...eligible]
    .sort((left, right) => stableScore(`${campaign.id}:${left.id}`) - stableScore(`${campaign.id}:${right.id}`))
    .slice(0, targetSize);
  const timestamp = now();
  const statements: D1PreparedStatement[] = [
    c.env.DB.prepare('DELETE FROM marketing_campaign_recipients WHERE campaign_id = ?').bind(campaign.id),
  ];
  for (const recipient of selected) {
    statements.push(c.env.DB.prepare(`
      INSERT INTO marketing_campaign_recipients (
        campaign_id, user_id, referral_code, consent_version, eligibility_basis, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      campaign.id,
      recipient.id,
      recipient.referral_code,
      recipient.consent_version,
      recipient.eligibility_basis,
      timestamp,
      timestamp,
    ));
  }
  statements.push(c.env.DB.prepare(`
    UPDATE marketing_campaigns
    SET status = 'audience_ready', audience_count = ?, updated_at = ?
    WHERE id = ?
  `).bind(selected.length, timestamp, campaign.id));
  await c.env.DB.batch(statements);

  return c.json({
    success: true,
    data: {
      eligiblePool: eligible.length,
      pilotPercent: campaign.pilot_percent,
      audienceCount: selected.length,
      containsPersonalData: false,
    },
  });
});

marketingCampaignsApp.post('/admin/campaigns/:id/provider-draft', async (c) => {
  const campaignId = c.req.param('id');
  const campaign = await c.env.DB.prepare(`
    SELECT id, name, subject, preview_text, message, pilot_percent, status,
      audience_count, provider_segment_id, provider_broadcast_id, created_at, updated_at
    FROM marketing_campaigns WHERE id = ?
  `).bind(campaignId).first<CampaignRow>();
  if (!campaign) return c.json({ success: false, error: 'Campaign not found' }, 404);
  if (campaign.status !== 'audience_ready') {
    return c.json({ success: false, error: 'Build the consent-filtered audience before creating a provider draft' }, 409);
  }
  if (campaign.provider_broadcast_id) {
    return c.json({ success: false, error: 'A provider draft already exists for this campaign' }, 409);
  }
  if (!c.env.RESEND_API_KEY) {
    return c.json({ success: false, error: 'Resend marketing integration is not configured' }, 503);
  }

  const recipientRows = await c.env.DB.prepare(`
    SELECT u.id, u.name, lower(trim(u.email)) AS email, mcr.referral_code,
      mcr.consent_version, mcr.eligibility_basis
    FROM marketing_campaign_recipients mcr
    JOIN users u ON u.id = mcr.user_id
    JOIN marketing_email_preferences mp ON mp.user_id = u.id
    WHERE mcr.campaign_id = ?
      AND mcr.status IN ('planned', 'provider_synced', 'provider_failed')
      AND u.status = 'approved'
      AND u.is_active = 1
      AND COALESCE(u.is_demo, 0) = 0
      AND u.email_verified = 1
      AND mp.referral_rewards_opt_in = 1
      AND mp.unsubscribed_at IS NULL
  `).bind(campaign.id).all<EligibleRecipient>();
  if (recipientRows.results.length === 0) {
    return c.json({ success: false, error: 'No eligible recipients remain in this audience snapshot' }, 409);
  }

  const segment = await resendRequest<{ id: string }>(c.env, '/segments', {
    method: 'POST',
    body: { name: `Brilla pilot ${campaign.name} ${campaign.id.slice(0, 8)}` },
  });
  if (!segment.ok) return c.json({ success: false, error: 'Failed to create the isolated provider segment' }, 502);

  let synced = 0;
  let suppressed = 0;
  let failed = 0;
  const timestamp = now();
  for (const recipient of recipientRows.results) {
    const emailHash = await sha256Hex(recipient.email);
    const suppression = await c.env.DB.prepare(`
      SELECT reason FROM marketing_email_suppressions
      WHERE email_hash = ? AND (expires_at IS NULL OR datetime(expires_at) > datetime('now'))
    `).bind(emailHash).first<{ reason: string }>();
    if (suppression) {
      suppressed += 1;
      await c.env.DB.prepare(`
        UPDATE marketing_campaign_recipients SET status = 'provider_suppressed', updated_at = ?
        WHERE campaign_id = ? AND user_id = ?
      `).bind(timestamp, campaign.id, recipient.id).run();
      continue;
    }

    const existing = await getResendContact(c.env, recipient.email);
    if (existing.ok && existing.data.unsubscribed) {
      suppressed += 1;
      await c.env.DB.batch([
        c.env.DB.prepare(`
          INSERT INTO marketing_email_suppressions (id, user_id, email_hash, reason, source)
          VALUES (?, ?, ?, 'provider_unsubscribe', 'resend_webhook')
          ON CONFLICT(email_hash) DO UPDATE SET reason = 'provider_unsubscribe', source = 'resend_webhook', expires_at = NULL
        `).bind(crypto.randomUUID(), recipient.id, emailHash),
        c.env.DB.prepare(`
          UPDATE marketing_email_preferences SET referral_rewards_opt_in = 0,
            unsubscribed_at = ?, provider_sync_status = 'suppressed', updated_at = ? WHERE user_id = ?
        `).bind(timestamp, timestamp, recipient.id),
        c.env.DB.prepare(`
          UPDATE marketing_campaign_recipients SET status = 'provider_suppressed', updated_at = ?
          WHERE campaign_id = ? AND user_id = ?
        `).bind(timestamp, campaign.id, recipient.id),
      ]);
      continue;
    }

    let contactId: string | null = null;
    let contactReady = false;
    if (existing.ok) {
      contactId = existing.data.id;
      const added = await resendRequest<{ id: string }>(
        c.env,
        `/contacts/${encodeURIComponent(existing.data.id)}/segments/${encodeURIComponent(segment.data.id)}`,
        { method: 'POST' },
      );
      contactReady = added.ok;
    } else if (existing.status === 404) {
      const names = recipient.name.trim().split(/\s+/);
      const created = await resendRequest<{ id: string }>(c.env, '/contacts', {
        method: 'POST',
        body: {
          email: recipient.email,
          first_name: names[0] || 'Student',
          last_name: names.slice(1).join(' '),
          unsubscribed: false,
          segments: [{ id: segment.data.id }],
          ...(c.env.RESEND_REFERRAL_TOPIC_ID ? {
            topics: [{ id: c.env.RESEND_REFERRAL_TOPIC_ID, subscription: 'opt_in' }],
          } : {}),
        },
      });
      if (created.ok) {
        contactId = created.data.id;
        contactReady = true;
      }
    }

    if (contactReady) {
      synced += 1;
      await c.env.DB.batch([
        c.env.DB.prepare(`
          UPDATE marketing_campaign_recipients SET status = 'provider_synced', updated_at = ?
          WHERE campaign_id = ? AND user_id = ?
        `).bind(timestamp, campaign.id, recipient.id),
        c.env.DB.prepare(`
          UPDATE marketing_email_preferences SET provider_contact_id = COALESCE(?, provider_contact_id),
            provider_sync_status = 'synced', provider_synced_at = ?, updated_at = ? WHERE user_id = ?
        `).bind(contactId, timestamp, timestamp, recipient.id),
      ]);
    } else {
      failed += 1;
      await c.env.DB.prepare(`
        UPDATE marketing_campaign_recipients SET status = 'provider_failed', updated_at = ?
        WHERE campaign_id = ? AND user_id = ?
      `).bind(timestamp, campaign.id, recipient.id).run();
    }
  }

  if (synced === 0) {
    return c.json({
      success: false,
      error: 'No recipients were safely synchronized; no provider broadcast draft was created',
      data: { synced, suppressed, failed },
    }, 409);
  }

  const appUrl = c.env.APP_URL || 'https://brillaprep.org';
  const broadcast = await resendRequest<{ id: string }>(c.env, '/broadcasts', {
    method: 'POST',
    body: {
      segment_id: segment.data.id,
      from: c.env.FROM_EMAIL || 'BrillaPrep <noreply@brillaprep.org>',
      name: `DRAFT - ${campaign.name}`,
      subject: campaign.subject,
      preview_text: campaign.preview_text,
      html: campaignHtml(campaign, appUrl),
      text: campaignText(campaign, appUrl),
      ...(c.env.RESEND_REFERRAL_TOPIC_ID ? { topic_id: c.env.RESEND_REFERRAL_TOPIC_ID } : {}),
      send: false,
    },
  });
  if (!broadcast.ok) {
    return c.json({ success: false, error: 'Contacts were synchronized, but provider draft creation failed' }, 502);
  }

  await c.env.DB.prepare(`
    UPDATE marketing_campaigns SET status = 'provider_draft', provider_segment_id = ?,
      provider_broadcast_id = ?, audience_count = ?, updated_at = ? WHERE id = ?
  `).bind(segment.data.id, broadcast.data.id, synced, timestamp, campaign.id).run();

  return c.json({
    success: true,
    data: {
      status: 'provider_draft',
      synced,
      suppressed,
      failed,
      sendEndpointAvailable: false,
      message: 'Draft created in Resend. Nothing was sent or scheduled.',
    },
  });
});

marketingCampaignsApp.post('/admin/campaigns/:id/send', async (c) => {
  const campaignId = c.req.param('id');
  const parsed = await parseBoundedJsonBody(c, MAX_BODY_BYTES);
  if (!parsed.ok) {
    return c.json({ success: false, error: 'Invalid request body' }, parsed.reason === 'too_large' ? 413 : 400);
  }

  const campaign = await c.env.DB.prepare(`
    SELECT id, name, subject, preview_text, message, pilot_percent, status,
      audience_count, provider_segment_id, provider_broadcast_id, created_at, updated_at
    FROM marketing_campaigns WHERE id = ?
  `).bind(campaignId).first<CampaignRow>();
  if (!campaign) return c.json({ success: false, error: 'Campaign not found' }, 404);

  const expectedConfirmation = `SEND ${campaign.id}`;
  if (parsed.body.confirmation !== expectedConfirmation) {
    return c.json({ success: false, error: `Type ${expectedConfirmation} to confirm this one-time dispatch` }, 400);
  }
  if (campaign.status !== 'provider_draft' || !campaign.provider_segment_id || !campaign.provider_broadcast_id) {
    return c.json({ success: false, error: 'An immutable provider draft is required before sending' }, 409);
  }
  if (!c.env.RESEND_API_KEY || !c.env.RESEND_REFERRAL_TOPIC_ID) {
    return c.json({ success: false, error: 'Resend API and referral topic configuration are required' }, 503);
  }

  const recipients = await c.env.DB.prepare(`
    SELECT u.id, u.name, lower(trim(u.email)) AS email, mcr.referral_code,
      mcr.consent_version, mcr.eligibility_basis
    FROM marketing_campaign_recipients mcr
    JOIN users u ON u.id = mcr.user_id
    JOIN marketing_email_preferences mp ON mp.user_id = u.id
    JOIN affiliate_profiles ap ON ap.user_id = u.id
    WHERE mcr.campaign_id = ?
      AND mcr.status = 'provider_synced'
      AND u.status = 'approved'
      AND u.is_active = 1
      AND COALESCE(u.is_demo, 0) = 0
      AND u.email_verified = 1
      AND mp.referral_rewards_opt_in = 1
      AND mp.unsubscribed_at IS NULL
      AND mp.provider_sync_status = 'synced'
      AND mp.consent_version = mcr.consent_version
      AND mp.eligibility_basis = mcr.eligibility_basis
      AND mp.eligibility_basis IN ('explicit_opt_in', 'guardian_confirmed')
      AND ap.referral_code = mcr.referral_code
  `).bind(campaign.id).all<EligibleRecipient>();

  let unsuppressedCount = 0;
  for (const recipient of recipients.results) {
    if (!isDeliverableEmail(recipient.email)) continue;
    const emailHash = await sha256Hex(recipient.email);
    const suppression = await c.env.DB.prepare(`
      SELECT 1 AS suppressed FROM marketing_email_suppressions
      WHERE email_hash = ? AND (expires_at IS NULL OR datetime(expires_at) > datetime('now'))
    `).bind(emailHash).first<{ suppressed: number }>();
    if (!suppression) unsuppressedCount += 1;
  }

  if (campaign.audience_count <= 0 || unsuppressedCount !== campaign.audience_count) {
    return c.json({
      success: false,
      error: 'Audience consent or suppression state changed after the draft was built. Create a new campaign snapshot.',
    }, 409);
  }

  const providerContacts = await getResendSegmentContacts(c.env, campaign.provider_segment_id);
  if (!providerContacts.ok) {
    return c.json({ success: false, error: 'Unable to verify the isolated provider segment' }, 502);
  }
  const expectedEmails = new Set(recipients.results.map((recipient) => normalizeEmail(recipient.email)));
  const providerEmails = new Set(providerContacts.data.map((contact) => normalizeEmail(contact.email)));
  if (providerContacts.data.some((contact) => contact.unsubscribed) ||
      providerEmails.size !== expectedEmails.size ||
      [...expectedEmails].some((email) => !providerEmails.has(email))) {
    return c.json({ success: false, error: 'Provider segment membership no longer matches the consented audience snapshot' }, 409);
  }

  const providerDraft = await getResendBroadcast(c.env, campaign.provider_broadcast_id);
  if (!providerDraft.ok) {
    return c.json({ success: false, error: 'Unable to verify the provider draft' }, 502);
  }
  if (providerDraft.data.status !== 'draft' ||
      providerDraft.data.segment_id !== campaign.provider_segment_id ||
      providerDraft.data.topic_id !== c.env.RESEND_REFERRAL_TOPIC_ID ||
      providerDraft.data.subject !== campaign.subject) {
    return c.json({ success: false, error: 'Provider draft no longer matches the reviewed campaign snapshot' }, 409);
  }

  const timestamp = now();
  const reserved = await c.env.DB.prepare(`
    INSERT OR IGNORE INTO marketing_campaign_dispatches (
      campaign_id, status, expected_recipient_count, requested_by, requested_at, updated_at
    ) VALUES (?, 'preparing', ?, ?, ?, ?)
  `).bind(campaign.id, campaign.audience_count, getUserId(c), timestamp, timestamp).run();
  if ((reserved.meta.changes || 0) !== 1) {
    return c.json({ success: false, error: 'This campaign already has a dispatch record and will not be sent again' }, 409);
  }

  const sent = await resendRequest<{ id: string }>(
    c.env,
    `/broadcasts/${encodeURIComponent(campaign.provider_broadcast_id)}/send`,
    { method: 'POST', body: {} },
  );
  if (!sent.ok) {
    await c.env.DB.prepare(`
      UPDATE marketing_campaign_dispatches
      SET status = 'failed', failure_code = ?, updated_at = ? WHERE campaign_id = ?
    `).bind(`provider_${sent.status}`, now(), campaign.id).run();
    return c.json({
      success: false,
      error: 'Provider dispatch failed. Automatic retry is disabled to prevent duplicate email.',
    }, 502);
  }

  await c.env.DB.prepare(`
    UPDATE marketing_campaign_dispatches
    SET status = 'queued', provider_send_id = ?, provider_status = 'queued', updated_at = ?
    WHERE campaign_id = ?
  `).bind(sent.data.id, now(), campaign.id).run();

  return c.json({
    success: true,
    data: {
      status: 'queued',
      recipientCount: campaign.audience_count,
      duplicateSendProtected: true,
    },
  });
});

marketingCampaignsApp.post('/admin/campaigns/:id/refresh-dispatch', async (c) => {
  const campaignId = c.req.param('id');
  const campaign = await c.env.DB.prepare(`
    SELECT id, name, subject, preview_text, message, pilot_percent, status,
      audience_count, provider_segment_id, provider_broadcast_id, created_at, updated_at
    FROM marketing_campaigns WHERE id = ?
  `).bind(campaignId).first<CampaignRow>();
  if (!campaign?.provider_broadcast_id) return c.json({ success: false, error: 'Provider draft not found' }, 404);

  const dispatch = await c.env.DB.prepare(`
    SELECT campaign_id, status, expected_recipient_count, provider_send_id, provider_status,
      failure_code, requested_at, completed_at, updated_at
    FROM marketing_campaign_dispatches WHERE campaign_id = ?
  `).bind(campaign.id).first<CampaignDispatchRow>();
  if (!dispatch) return c.json({ success: false, error: 'Campaign has not been dispatched' }, 409);

  const provider = await getResendBroadcast(c.env, campaign.provider_broadcast_id);
  if (!provider.ok) return c.json({ success: false, error: 'Unable to retrieve provider dispatch status' }, 502);

  const terminal = provider.data.status === 'sent';
  const localStatus = terminal ? 'sent' : dispatch.status === 'preparing' ? 'preparing' : 'queued';
  const timestamp = now();
  await c.env.DB.prepare(`
    UPDATE marketing_campaign_dispatches SET status = ?, provider_status = ?,
      completed_at = CASE WHEN ? = 1 THEN COALESCE(completed_at, ?) ELSE completed_at END,
      updated_at = ? WHERE campaign_id = ?
  `).bind(localStatus, provider.data.status, terminal ? 1 : 0, provider.data.sent_at || timestamp, timestamp, campaign.id).run();

  return c.json({
    success: true,
    data: {
      status: localStatus,
      providerStatus: provider.data.status,
      recipientCount: dispatch.expected_recipient_count,
    },
  });
});
