-- Add Cambridge AS Level Specifications
-- AS Level uses the first year papers of the full A-Level

INSERT OR IGNORE INTO subject_specifications (id, exam_board_id, subject_id, exam_type_id, syllabus_code, syllabus_name, specification_year, valid_from, valid_to, total_papers, assessment_info) VALUES
('spec_as_physics_2023', 'board_cambridge', 'subj_alevel_physics', 'cambridge_as', '9702', 'Physics', '2023-2025', '2023-01-01', '2025-12-31', 2, '{"as_only": true, "papers": [1, 2]}'),
('spec_as_chemistry_2023', 'board_cambridge', 'subj_alevel_chemistry', 'cambridge_as', '9701', 'Chemistry', '2023-2025', '2023-01-01', '2025-12-31', 2, '{"as_only": true, "papers": [1, 2]}'),
('spec_as_biology_2023', 'board_cambridge', 'subj_alevel_biology', 'cambridge_as', '9700', 'Biology', '2023-2025', '2023-01-01', '2025-12-31', 2, '{"as_only": true, "papers": [1, 2]}'),
('spec_as_math_2023', 'board_cambridge', 'subj_alevel_math', 'cambridge_as', '9709', 'Mathematics', '2023-2025', '2023-01-01', '2025-12-31', 2, '{"as_only": true, "papers": [1, 2]}'),
('spec_as_further_math_2023', 'board_cambridge', 'subj_alevel_further_math', 'cambridge_as', '9231', 'Further Mathematics', '2023-2025', '2023-01-01', '2025-12-31', 2, '{"as_only": true, "papers": [1, 2]}');

-- Add Edexcel AS Level Specifications
INSERT OR IGNORE INTO subject_specifications (id, exam_board_id, subject_id, exam_type_id, syllabus_code, syllabus_name, specification_year, valid_from, valid_to, total_papers, assessment_info) VALUES
('spec_edexcel_as_physics', 'board_edexcel', 'subj_edexcel_igcse_physics', 'edexcel_as', 'WPH11', 'Physics', '2023-2025', '2023-01-01', '2025-12-31', 2, '{"as_only": true}'),
('spec_edexcel_as_chemistry', 'board_edexcel', 'subj_edexcel_igcse_chemistry', 'edexcel_as', 'WCH11', 'Chemistry', '2023-2025', '2023-01-01', '2025-12-31', 2, '{"as_only": true}'),
('spec_edexcel_as_biology', 'board_edexcel', 'subj_edexcel_igcse_biology', 'edexcel_as', 'WBI11', 'Biology', '2023-2025', '2023-01-01', '2025-12-31', 2, '{"as_only": true}'),
('spec_edexcel_as_math', 'board_edexcel', 'subj_edexcel_igcse_math', 'edexcel_as', 'WMA11', 'Mathematics', '2023-2025', '2023-01-01', '2025-12-31', 2, '{"as_only": true}');

-- Add Edexcel A-Level Specifications
INSERT OR IGNORE INTO subject_specifications (id, exam_board_id, subject_id, exam_type_id, syllabus_code, syllabus_name, specification_year, valid_from, valid_to, total_papers, assessment_info) VALUES
('spec_edexcel_alevel_physics', 'board_edexcel', 'subj_edexcel_igcse_physics', 'edexcel_a2', 'WPH11-WPH14', 'Physics', '2023-2025', '2023-01-01', '2025-12-31', 3, '{"full_alevel": true}'),
('spec_edexcel_alevel_chemistry', 'board_edexcel', 'subj_edexcel_igcse_chemistry', 'edexcel_a2', 'WCH11-WCH14', 'Chemistry', '2023-2025', '2023-01-01', '2025-12-31', 3, '{"full_alevel": true}'),
('spec_edexcel_alevel_biology', 'board_edexcel', 'subj_edexcel_igcse_biology', 'edexcel_a2', 'WBI11-WBI14', 'Biology', '2023-2025', '2023-01-01', '2025-12-31', 3, '{"full_alevel": true}'),
('spec_edexcel_alevel_math', 'board_edexcel', 'subj_edexcel_igcse_math', 'edexcel_a2', 'WMA11-WMA14', 'Mathematics', '2023-2025', '2023-01-01', '2025-12-31', 3, '{"full_alevel": true}');
