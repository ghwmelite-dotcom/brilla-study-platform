-- Seed exam preferences for demo users to include all exam types (WASSCE, NSMQ, BECE)
-- This ensures demo users can see all exam modes when viewing the platform

-- Demo Student - add BECE if missing (WASSCE and NSMQ already exist)
INSERT INTO user_exam_preferences (id, user_id, exam_type_id, is_primary, created_at, updated_at)
VALUES ('pref_student_bece', 'student_1766327981521', 'exam_bece', 0, datetime('now'), datetime('now'))
ON CONFLICT(id) DO NOTHING;

-- Demo Teacher - ensure all three exam types exist
INSERT INTO user_exam_preferences (id, user_id, exam_type_id, is_primary, created_at, updated_at)
VALUES
  ('pref_teacher_wassce', 'teacher_1766327981453', 'exam_wassce', 1, datetime('now'), datetime('now')),
  ('pref_teacher_nsmq', 'teacher_1766327981453', 'exam_nsmq', 0, datetime('now'), datetime('now')),
  ('pref_teacher_bece', 'teacher_1766327981453', 'exam_bece', 0, datetime('now'), datetime('now'))
ON CONFLICT(id) DO NOTHING;

-- Admin does not need preferences (they see all exam types by default when preferences are empty)
-- Parent user (parent_1) is only created locally in demo mode, not in production database
