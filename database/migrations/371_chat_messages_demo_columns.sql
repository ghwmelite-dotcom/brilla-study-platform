-- Migration 371: repair prod/staging drift on chat_messages — the demo-data
-- columns exist in schema.sql and are written by chat.ts and team battle chat
-- (3 insert sites), but were never applied to the deployed databases, causing
-- every chat message send to fail with a 500.
-- (Other tables whose schema.sql demo columns are absent in prod are dormant:
-- no code path inserts demo flags into them. See
-- database/reconciliation/2026-09-08-chat-messages-demo-columns-drift.md.)

ALTER TABLE chat_messages ADD COLUMN is_demo_data INTEGER NOT NULL DEFAULT 0;
ALTER TABLE chat_messages ADD COLUMN expires_at TEXT;

CREATE INDEX IF NOT EXISTS idx_chat_messages_demo ON chat_messages(is_demo_data, expires_at);
