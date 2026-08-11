-- Seed public chat rooms for Community feature
-- NOT a migration: lives in database/seeds/ (moved out of migrations_dir in
-- Phase 5 Task 4 so `wrangler d1 migrations apply` never picks it up).
-- Apply manually after database/seed.sql, e.g.:
--   wrangler d1 execute brilla-db --file=../database/seeds/seed_chat_rooms.sql
-- created_by references the seed's demo admin (admin_1).
INSERT INTO chat_rooms (id, name, description, type, exam_type_id, max_members, created_by, created_at, updated_at) VALUES
('room_wassce_general', 'WASSCE General', 'General discussion for WASSCE preparation', 'public', 'exam_wassce', 1000, 'admin_1', datetime('now'), datetime('now')),
('room_wassce_math', 'Mathematics Help', 'Get help with WASSCE Mathematics questions', 'subject', 'exam_wassce', 500, 'admin_1', datetime('now'), datetime('now')),
('room_wassce_science', 'Science Corner', 'Discuss Physics, Chemistry, and Biology topics', 'subject', 'exam_wassce', 500, 'admin_1', datetime('now'), datetime('now')),
('room_bece_general', 'BECE General', 'General discussion for BECE preparation', 'public', 'exam_bece', 1000, 'admin_1', datetime('now'), datetime('now')),
('room_nsmq_practice', 'NSMQ Speed Drills', 'Practice speed quizzes with fellow competitors', 'public', 'exam_nsmq', 500, 'admin_1', datetime('now'), datetime('now'))
ON CONFLICT(id) DO NOTHING;
