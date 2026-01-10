-- Add Cambridge AS Level Specifications with distinct syllabus codes

INSERT OR IGNORE INTO subject_specifications (id, exam_board_id, subject_id, exam_type_id, syllabus_code, syllabus_name, specification_year, valid_from, valid_to, total_papers, assessment_info) VALUES
('spec_cambridge_as_physics', 'board_cambridge', 'subj_alevel_physics', 'cambridge_as', '9702-AS', 'Physics', '2023-2025', '2023-01-01', '2025-12-31', 2, '{"as_only": true, "papers": [1, 2]}'),
('spec_cambridge_as_chemistry', 'board_cambridge', 'subj_alevel_chemistry', 'cambridge_as', '9701-AS', 'Chemistry', '2023-2025', '2023-01-01', '2025-12-31', 2, '{"as_only": true, "papers": [1, 2]}'),
('spec_cambridge_as_biology', 'board_cambridge', 'subj_alevel_biology', 'cambridge_as', '9700-AS', 'Biology', '2023-2025', '2023-01-01', '2025-12-31', 2, '{"as_only": true, "papers": [1, 2]}'),
('spec_cambridge_as_math', 'board_cambridge', 'subj_alevel_math', 'cambridge_as', '9709-AS', 'Mathematics', '2023-2025', '2023-01-01', '2025-12-31', 2, '{"as_only": true, "papers": [1, 2]}'),
('spec_cambridge_as_further_math', 'board_cambridge', 'subj_alevel_further_math', 'cambridge_as', '9231-AS', 'Further Mathematics', '2023-2025', '2023-01-01', '2025-12-31', 2, '{"as_only": true, "papers": [1, 2]}');
