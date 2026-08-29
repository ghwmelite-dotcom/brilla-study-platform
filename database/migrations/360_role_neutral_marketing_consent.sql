-- Replace role-inferred adult eligibility with auditable explicit opt-in.
-- Existing valid opt-ins remain valid: adult_self_attested and adult_role
-- represented an active checkbox choice, so they map to explicit_opt_in.
-- Guardian-confirmed consent remains distinct for a future age-aware flow.

CREATE TABLE marketing_email_preferences_v2 (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  referral_rewards_opt_in INTEGER NOT NULL DEFAULT 0 CHECK (referral_rewards_opt_in IN (0, 1)),
  consent_version TEXT,
  consented_at TEXT,
  consent_source TEXT CHECK (
    consent_source IS NULL OR consent_source IN (
      'settings',
      'student_onboarding',
      'affiliate_dashboard',
      'guardian_confirmation'
    )
  ),
  eligibility_basis TEXT NOT NULL DEFAULT 'unknown'
    CHECK (eligibility_basis IN ('unknown', 'explicit_opt_in', 'guardian_confirmed')),
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
      eligibility_basis IN ('explicit_opt_in', 'guardian_confirmed') AND
      unsubscribed_at IS NULL
    )
  )
);

INSERT INTO marketing_email_preferences_v2 (
  user_id,
  referral_rewards_opt_in,
  consent_version,
  consented_at,
  consent_source,
  eligibility_basis,
  consent_actor_user_id,
  unsubscribed_at,
  provider_contact_id,
  provider_sync_status,
  provider_synced_at,
  created_at,
  updated_at
)
SELECT
  user_id,
  referral_rewards_opt_in,
  consent_version,
  consented_at,
  consent_source,
  CASE
    WHEN referral_rewards_opt_in = 0 THEN 'unknown'
    WHEN eligibility_basis = 'guardian_confirmed' THEN 'guardian_confirmed'
    ELSE 'explicit_opt_in'
  END,
  consent_actor_user_id,
  unsubscribed_at,
  provider_contact_id,
  provider_sync_status,
  provider_synced_at,
  created_at,
  updated_at
FROM marketing_email_preferences;

DROP TABLE marketing_email_preferences;
ALTER TABLE marketing_email_preferences_v2 RENAME TO marketing_email_preferences;

CREATE TABLE marketing_consent_events_v2 (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL DEFAULT 'referral_rewards' CHECK (topic = 'referral_rewards'),
  action TEXT NOT NULL CHECK (action IN ('opt_in', 'opt_out', 'provider_unsubscribe', 'guardian_confirmed')),
  actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  source TEXT NOT NULL CHECK (
    source IN (
      'settings',
      'student_onboarding',
      'affiliate_dashboard',
      'guardian_confirmation',
      'resend_webhook'
    )
  ),
  consent_version TEXT,
  eligibility_basis TEXT CHECK (
    eligibility_basis IS NULL OR eligibility_basis IN ('unknown', 'explicit_opt_in', 'guardian_confirmed')
  ),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO marketing_consent_events_v2 (
  id,
  user_id,
  topic,
  action,
  actor_user_id,
  source,
  consent_version,
  eligibility_basis,
  created_at
)
SELECT
  id,
  user_id,
  topic,
  action,
  actor_user_id,
  source,
  consent_version,
  CASE
    WHEN eligibility_basis IS NULL THEN NULL
    WHEN eligibility_basis = 'unknown' THEN 'unknown'
    WHEN eligibility_basis = 'guardian_confirmed' THEN 'guardian_confirmed'
    ELSE 'explicit_opt_in'
  END,
  created_at
FROM marketing_consent_events;

DROP TABLE marketing_consent_events;
ALTER TABLE marketing_consent_events_v2 RENAME TO marketing_consent_events;

CREATE INDEX idx_marketing_consent_events_user_created
  ON marketing_consent_events(user_id, created_at DESC);

CREATE TABLE marketing_email_suppressions_v2 (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  email_hash TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('user_opt_out', 'provider_unsubscribe', 'hard_bounce', 'complaint', 'admin')),
  source TEXT NOT NULL CHECK (
    source IN ('settings', 'student_onboarding', 'affiliate_dashboard', 'resend_webhook', 'admin')
  ),
  expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(email_hash)
);

INSERT INTO marketing_email_suppressions_v2 (
  id,
  user_id,
  email_hash,
  reason,
  source,
  expires_at,
  created_at
)
SELECT
  id,
  user_id,
  email_hash,
  reason,
  source,
  expires_at,
  created_at
FROM marketing_email_suppressions;

DROP TABLE marketing_email_suppressions;
ALTER TABLE marketing_email_suppressions_v2 RENAME TO marketing_email_suppressions;

CREATE INDEX idx_marketing_suppressions_user
  ON marketing_email_suppressions(user_id);

CREATE TABLE marketing_campaign_recipients_v2 (
  campaign_id TEXT NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  consent_version TEXT NOT NULL,
  eligibility_basis TEXT NOT NULL
    CHECK (eligibility_basis IN ('explicit_opt_in', 'guardian_confirmed')),
  status TEXT NOT NULL DEFAULT 'planned'
    CHECK (status IN ('planned', 'provider_synced', 'provider_suppressed', 'provider_failed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (campaign_id, user_id)
);

INSERT INTO marketing_campaign_recipients_v2 (
  campaign_id,
  user_id,
  referral_code,
  consent_version,
  eligibility_basis,
  status,
  created_at,
  updated_at
)
SELECT
  campaign_id,
  user_id,
  referral_code,
  consent_version,
  CASE
    WHEN eligibility_basis = 'guardian_confirmed' THEN 'guardian_confirmed'
    ELSE 'explicit_opt_in'
  END,
  status,
  created_at,
  updated_at
FROM marketing_campaign_recipients;

DROP TABLE marketing_campaign_recipients;
ALTER TABLE marketing_campaign_recipients_v2 RENAME TO marketing_campaign_recipients;

CREATE INDEX idx_marketing_campaign_recipients_status
  ON marketing_campaign_recipients(campaign_id, status);
