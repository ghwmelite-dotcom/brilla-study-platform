-- Admin announcements: immutable audience snapshots with independent channel delivery.

CREATE TABLE IF NOT EXISTS platform_communication_preferences (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  email_enabled INTEGER NOT NULL DEFAULT 1 CHECK (email_enabled IN (0, 1)),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS admin_announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  audience_type TEXT NOT NULL CHECK (audience_type IN ('all', 'exam', 'school', 'tier', 'chatrooms')),
  audience_ids TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(audience_ids)),
  send_in_app INTEGER NOT NULL DEFAULT 1 CHECK (send_in_app IN (0, 1)),
  send_email INTEGER NOT NULL DEFAULT 0 CHECK (send_email IN (0, 1)),
  post_to_chatrooms INTEGER NOT NULL DEFAULT 0 CHECK (post_to_chatrooms IN (0, 1)),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'dispatching', 'sent', 'partial', 'failed')),
  matched_users INTEGER NOT NULL DEFAULT 0,
  in_app_sent INTEGER NOT NULL DEFAULT 0,
  email_queued INTEGER NOT NULL DEFAULT 0,
  email_skipped INTEGER NOT NULL DEFAULT 0,
  email_failed INTEGER NOT NULL DEFAULT 0,
  chatrooms_posted INTEGER NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  dispatched_at TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS admin_announcement_recipients (
  announcement_id TEXT NOT NULL REFERENCES admin_announcements(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  in_app_status TEXT NOT NULL DEFAULT 'pending' CHECK (in_app_status IN ('pending', 'sent', 'skipped', 'failed')),
  email_status TEXT NOT NULL DEFAULT 'pending' CHECK (email_status IN ('pending', 'queued', 'skipped', 'failed')),
  email_reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (announcement_id, user_id)
);

CREATE TABLE IF NOT EXISTS admin_announcement_chatrooms (
  announcement_id TEXT NOT NULL REFERENCES admin_announcements(id) ON DELETE CASCADE,
  room_id TEXT NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  message_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'posted', 'failed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (announcement_id, room_id)
);

CREATE INDEX IF NOT EXISTS idx_admin_announcements_status_created
  ON admin_announcements(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_announcement_recipients_user
  ON admin_announcement_recipients(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_announcement_recipients_email
  ON admin_announcement_recipients(announcement_id, email_status, user_id);
CREATE INDEX IF NOT EXISTS idx_admin_announcement_chatrooms_status
  ON admin_announcement_chatrooms(announcement_id, status);
