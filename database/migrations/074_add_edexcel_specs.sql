-- Add Edexcel IGCSE Specifications

INSERT OR IGNORE INTO subject_specifications (id, exam_board_id, subject_id, exam_type_id, syllabus_code, syllabus_name, specification_year, valid_from, valid_to, total_papers, assessment_info) VALUES
('spec_edexcel_igcse_physics', 'board_edexcel', 'subj_edexcel_igcse_physics', 'edexcel_igcse', '4PH1', 'Physics', '2023-2025', '2023-01-01', '2025-12-31', 2, '{"papers": [1, 2]}'),
('spec_edexcel_igcse_chemistry', 'board_edexcel', 'subj_edexcel_igcse_chemistry', 'edexcel_igcse', '4CH1', 'Chemistry', '2023-2025', '2023-01-01', '2025-12-31', 2, '{"papers": [1, 2]}'),
('spec_edexcel_igcse_biology', 'board_edexcel', 'subj_edexcel_igcse_biology', 'edexcel_igcse', '4BI1', 'Biology', '2023-2025', '2023-01-01', '2025-12-31', 2, '{"papers": [1, 2]}'),
('spec_edexcel_igcse_math', 'board_edexcel', 'subj_edexcel_igcse_math', 'edexcel_igcse', '4MA1', 'Mathematics A', '2023-2025', '2023-01-01', '2025-12-31', 2, '{"papers": [1, 2]}');

-- Add Edexcel IGCSE Paper Components
INSERT OR IGNORE INTO paper_components (id, specification_id, paper_number, paper_name, paper_code, duration_minutes, total_marks, weighting_percent, question_format, is_compulsory, description, display_order) VALUES
('comp_edexcel_physics_p1', 'spec_edexcel_igcse_physics', 1, 'Paper 1', '4PH1/1P', 120, 110, 61.1, 'structured', 1, 'Multiple choice and short/extended answer questions', 1),
('comp_edexcel_physics_p2', 'spec_edexcel_igcse_physics', 2, 'Paper 2', '4PH1/2P', 75, 70, 38.9, 'structured', 1, 'Short/extended answer questions including experimental', 2),
('comp_edexcel_chem_p1', 'spec_edexcel_igcse_chemistry', 1, 'Paper 1', '4CH1/1C', 120, 110, 61.1, 'structured', 1, 'Multiple choice and short/extended answer questions', 1),
('comp_edexcel_chem_p2', 'spec_edexcel_igcse_chemistry', 2, 'Paper 2', '4CH1/2C', 75, 70, 38.9, 'structured', 1, 'Short/extended answer questions including experimental', 2),
('comp_edexcel_bio_p1', 'spec_edexcel_igcse_biology', 1, 'Paper 1', '4BI1/1B', 120, 110, 61.1, 'structured', 1, 'Multiple choice and short/extended answer questions', 1),
('comp_edexcel_bio_p2', 'spec_edexcel_igcse_biology', 2, 'Paper 2', '4BI1/2B', 75, 70, 38.9, 'structured', 1, 'Short/extended answer questions including experimental', 2),
('comp_edexcel_math_p1', 'spec_edexcel_igcse_math', 1, 'Paper 1', '4MA1/1H', 120, 100, 50, 'structured', 1, 'Calculator paper - Higher tier', 1),
('comp_edexcel_math_p2', 'spec_edexcel_igcse_math', 2, 'Paper 2', '4MA1/2H', 120, 100, 50, 'structured', 1, 'Calculator paper - Higher tier', 2);
