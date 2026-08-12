-- PROD-ONLY patch (2026-08-12): completely remove demo accounts.
-- Deletes the 6 demo users (teacher@/student@brillaprep.org, demo_teacher_1,
-- demo_demo_admin, bece.student/bece.teacher@brillaprep.org). The real admin
-- (admin_prod_001 / admin@brillaprep.org) is NOT touched.
-- Order matters: reassign/delete dependent rows first (no cascade on these FKs),
-- users last. Idempotent; safe to re-run.

-- 1. Reassign demo-owned chat rooms to the real admin (rooms have real members).
UPDATE chat_rooms SET created_by = 'admin_prod_001'
WHERE created_by IN (
  'teacher_1766327981453','student_1766327981521','demo_teacher_1',
  'demo_demo_admin_1766670386194','bece_student_demo_001','bece_teacher_demo_001'
);

-- 2. Remove demo messages and memberships (no ON DELETE CASCADE on these FKs).
DELETE FROM chat_messages
WHERE sender_id IN (
  'teacher_1766327981453','student_1766327981521','demo_teacher_1',
  'demo_demo_admin_1766670386194','bece_student_demo_001','bece_teacher_demo_001'
);
DELETE FROM chat_room_members
WHERE user_id IN (
  'teacher_1766327981453','student_1766327981521','demo_teacher_1',
  'demo_demo_admin_1766670386194','bece_student_demo_001','bece_teacher_demo_001'
);

-- 3. Anonymize the demo accounts (replaces hard delete: they hold 41 payment
--    transaction rows that must be preserved for the financial audit trail).
--    Login becomes impossible: password_hash NULL (verify fails), is_active=0
--    (requireAuth 403s), email/name scrubbed.
UPDATE users
SET email = 'deleted_' || id || '@deleted.invalid',
    name = 'Deleted demo user',
    password_hash = 'disabled_' || id,
    is_active = 0,
    status = 'suspended',
    avatar_url = NULL,
    verification_token = NULL,
    verification_token_expires_at = NULL,
    password_reset_token = NULL,
    password_reset_expires_at = NULL
WHERE id IN (
  'teacher_1766327981453','student_1766327981521','demo_teacher_1',
  'demo_demo_admin_1766670386194','bece_student_demo_001','bece_teacher_demo_001'
);
