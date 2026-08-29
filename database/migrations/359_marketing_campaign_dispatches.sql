-- Auditable, fail-closed dispatch state for consent-filtered Resend broadcasts.
-- One campaign may be dispatched at most once. Ambiguous failures require
-- provider reconciliation rather than an automatic retry.

CREATE TABLE IF NOT EXISTS marketing_campaign_dispatches (
  campaign_id TEXT PRIMARY KEY REFERENCES marketing_campaigns(id) ON DELETE RESTRICT,
  status TEXT NOT NULL CHECK (status IN ('preparing', 'queued', 'sent', 'failed')),
  expected_recipient_count INTEGER NOT NULL CHECK (expected_recipient_count > 0),
  provider_send_id TEXT,
  provider_status TEXT,
  failure_code TEXT,
  requested_by TEXT NOT NULL REFERENCES users(id),
  requested_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_marketing_campaign_dispatches_status
  ON marketing_campaign_dispatches(status, requested_at DESC);
