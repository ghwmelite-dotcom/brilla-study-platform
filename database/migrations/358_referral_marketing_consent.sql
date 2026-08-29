-- Referral marketing consent, suppression, campaign drafting, and audit trail.
-- Existing users remain opted out. No data is backfilled as marketing consent.

CREATE TABLE IF NOT EXISTS marketing_email_preferences (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  referral_rewards_opt_in INTEGER NOT NULL DEFAULT 0 CHECK (referral_rewards_opt_in IN (0, 1)),
  consent_version TEXT,
  consented_at TEXT,
  consent_source TEXT CHECK (consent_source IS NULL OR consent_source IN ('settings', 'guardian_confirmation')),
  eligibility_basis TEXT NOT NULL DEFAULT 'unknown'
    CHECK (eligibility_basis IN ('unknown', 'adult_self_attested', 'guardian_confirmed', 'adult_role')),
  consent_actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  unsubscribed_at TEXT,
  provider_contact_id TEXT,
  provider_sync_status TEXT NOT NULL DEFAULT 'not_synced'
    CHECK (provider_sync_status IN ('not_synced', 'pending', 'synced', 'suppressed', 'failed')),
  provider_synced_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (
    referral_rewards_opt_in = 0 OR (
      consent_version IS NOT NULL AND
      consented_at IS NOT NULL AND
      consent_source IS NOT NULL AND
      eligibility_basis IN ('adult_self_attested', 'guardian_confirmed', 'adult_role') AND
      unsubscribed_at IS NULL
    )
  )
);

CREATE TABLE IF NOT EXISTS marketing_consent_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL DEFAULT 'referral_rewards' CHECK (topic = 'referral_rewards'),
  action TEXT NOT NULL CHECK (action IN ('opt_in', 'opt_out', 'provider_unsubscribe', 'guardian_confirmed')),
  actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  source TEXT NOT NULL CHECK (source IN ('settings', 'guardian_confirmation', 'resend_webhook')),
  consent_version TEXT,
  eligibility_basis TEXT CHECK (
    eligibility_basis IS NULL OR eligibility_basis IN ('unknown', 'adult_self_attested', 'guardian_confirmed', 'adult_role')
  ),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_marketing_consent_events_user_created
  ON marketing_consent_events(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS marketing_email_suppressions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  email_hash TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('user_opt_out', 'provider_unsubscribe', 'hard_bounce', 'complaint', 'admin')),
  source TEXT NOT NULL CHECK (source IN ('settings', 'resend_webhook', 'admin')),
  expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(email_hash)
);

CREATE INDEX IF NOT EXISTS idx_marketing_suppressions_user
  ON marketing_email_suppressions(user_id);

CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  template_key TEXT NOT NULL DEFAULT 'referral_rewards_v1' CHECK (template_key = 'referral_rewards_v1'),
  subject TEXT NOT NULL,
  preview_text TEXT NOT NULL,
  message TEXT NOT NULL,
  pilot_percent INTEGER NOT NULL DEFAULT 10 CHECK (pilot_percent BETWEEN 1 AND 10),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'audience_ready', 'provider_draft', 'cancelled')),
  audience_count INTEGER NOT NULL DEFAULT 0 CHECK (audience_count >= 0),
  provider_segment_id TEXT,
  provider_broadcast_id TEXT,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS marketing_campaign_recipients (
  campaign_id TEXT NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  consent_version TEXT NOT NULL,
  eligibility_basis TEXT NOT NULL
    CHECK (eligibility_basis IN ('adult_self_attested', 'guardian_confirmed', 'adult_role')),
  status TEXT NOT NULL DEFAULT 'planned'
    CHECK (status IN ('planned', 'provider_synced', 'provider_suppressed', 'provider_failed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (campaign_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_marketing_campaign_recipients_status
  ON marketing_campaign_recipients(campaign_id, status);

CREATE TABLE IF NOT EXISTS marketing_webhook_events (
  svix_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  event_created_at TEXT,
  processed_at TEXT NOT NULL DEFAULT (datetime('now'))
);
