# Drift: chat_messages demo-data columns missing in prod (repaired 2026-09-08)

## Symptom

Every chat message send in production failed with HTTP 500. Surfaced by the
wave-2 team-battle chat feature (`POST /api/team-battles/:id/chat`), but the
same root cause broke the regular `POST /api/chat/rooms/:id/messages` path —
prod `chat_messages` had exactly 1 row despite 10 chat rooms, i.e. chat sends
had been silently broken in prod for some time.

## Root cause

`database/schema.sql` carries `is_demo_data INTEGER NOT NULL DEFAULT 0` and
`expires_at TEXT` on `chat_messages` (plus `idx_chat_messages_demo`), and three
insert sites write them (`workers/api/chat.ts:854`,
`workers/api/teambattles.ts` chat POST, and system-message inserts use the
narrow column list so were unaffected). The deployed prod database predates
those columns and no migration ever added them there. Staging already had them
(recreated more recently), so tests (schema.sql-based mock D1) and staging were
green while prod 500'd.

## Repair

`database/migrations/371_chat_messages_demo_columns.sql` applied to prod
(`brilla-db`) on 2026-09-08: adds both columns + the index. Staging needed no
change (column already present; ALTER would fail on duplicate).

## Remaining dormant drift (documented, not repaired)

These tables have demo columns in schema.sql that are absent in prod, but **no
code path inserts demo flags into them** (audited 2026-09-08 via grep of all
INSERT sites), so the drift is dormant:

- assessment_attempt_answers, assessment_attempts
- counselor_conversations, counselor_feedback, counselor_messages
- library_resources, notifications
- parent_activity_log, parent_notifications
- tutor_conversations, tutor_feedback, tutor_messages
- users, wellbeing_alerts, wellbeing_logs
- chat_message_reactions (insert site uses the narrow column list)

`cleanupExpiredDemoData` skips tables without the columns (prod cron logs no
errors). If any future feature writes demo rows into these tables, add the
columns via migration first.

Related prior drift: `2026-09-06-users-password-hash-notnull-drift.md`.
