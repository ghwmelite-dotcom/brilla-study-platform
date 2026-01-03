-- Seed public chat rooms for Community feature
INSERT INTO chat_rooms (id, name, description, type, exam_type_id, max_members, created_by, created_at, updated_at) VALUES
('room_wassce_general', 'WASSCE General', 'General discussion for WASSCE preparation', 'public', 'exam_wassce', 1000, 'admin_prod_001', datetime('now'), datetime('now')),
('room_wassce_math', 'Mathematics Help', 'Get help with WASSCE Mathematics questions', 'subject', 'exam_wassce', 500, 'admin_prod_001', datetime('now'), datetime('now')),
('room_wassce_science', 'Science Corner', 'Discuss Physics, Chemistry, and Biology topics', 'subject', 'exam_wassce', 500, 'admin_prod_001', datetime('now'), datetime('now')),
('room_bece_general', 'BECE General', 'General discussion for BECE preparation', 'public', 'exam_bece', 1000, 'admin_prod_001', datetime('now'), datetime('now')),
('room_nsmq_practice', 'NSMQ Speed Drills', 'Practice speed quizzes with fellow competitors', 'public', 'exam_nsmq', 500, 'admin_prod_001', datetime('now'), datetime('now'))
ON CONFLICT(id) DO NOTHING;
