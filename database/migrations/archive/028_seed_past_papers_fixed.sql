-- Migration 028 (Fixed): Seed past papers using existing subjects
-- This migration populates past papers for WASSCE exams

-- Step 1: Insert Paper Types if not exist
INSERT OR IGNORE INTO paper_types (id, exam_type_id, name, slug, description, question_format, typical_duration, total_marks, display_order) VALUES
('paper_wassce_1', 'exam_wassce', 'Paper 1 - Objectives', 'paper-1', 'Multiple choice questions', 'objective', 60, 50, 1),
('paper_wassce_2', 'exam_wassce', 'Paper 2 - Essay/Theory', 'paper-2', 'Essay and structured questions', 'essay', 180, 100, 2),
('paper_bece_1', 'exam_bece', 'Paper 1 - Objectives', 'paper-1', 'Multiple choice questions', 'objective', 60, 40, 1),
('paper_bece_2', 'exam_bece', 'Paper 2 - Essay', 'paper-2', 'Essay and structured questions', 'essay', 90, 60, 2);

-- Step 2: Insert Past Papers using existing subject IDs
INSERT OR REPLACE INTO past_papers (id, exam_type_id, subject_id, paper_type_id, year, month, series, title, description, total_questions, total_marks, time_allowed, instructions, is_complete, is_premium) VALUES
-- WASSCE Mathematics (using existing subj_math)
('pp_wassce_math_2024_1', 'exam_wassce', 'subj_math', 'paper_wassce_1', 2024, 'May-June', 'WASSCE', 'Core Mathematics Paper 1 (2024)', 'WASSCE Core Mathematics Objective Questions', 50, 50, 90, 'Answer ALL questions. Each question carries 1 mark.', 1, 0),
('pp_wassce_math_2023_1', 'exam_wassce', 'subj_math', 'paper_wassce_1', 2023, 'May-June', 'WASSCE', 'Core Mathematics Paper 1 (2023)', 'WASSCE Core Mathematics Objective Questions', 50, 50, 90, 'Answer ALL questions. Each question carries 1 mark.', 1, 0),

-- WASSCE Physics (using existing subj_physics)
('pp_wassce_phy_2024_1', 'exam_wassce', 'subj_physics', 'paper_wassce_1', 2024, 'May-June', 'WASSCE', 'Physics Paper 1 (2024)', 'WASSCE Physics Objective Questions', 50, 50, 60, 'Answer ALL questions. Each question carries 1 mark.', 1, 0),
('pp_wassce_phy_2023_1', 'exam_wassce', 'subj_physics', 'paper_wassce_1', 2023, 'May-June', 'WASSCE', 'Physics Paper 1 (2023)', 'WASSCE Physics Objective Questions', 50, 50, 60, 'Answer ALL questions. Each question carries 1 mark.', 1, 0),

-- WASSCE Chemistry (using existing subj_chemistry)
('pp_wassce_chem_2024_1', 'exam_wassce', 'subj_chemistry', 'paper_wassce_1', 2024, 'May-June', 'WASSCE', 'Chemistry Paper 1 (2024)', 'WASSCE Chemistry Objective Questions', 50, 50, 60, 'Answer ALL questions. Each question carries 1 mark.', 1, 0),
('pp_wassce_chem_2023_1', 'exam_wassce', 'subj_chemistry', 'paper_wassce_1', 2023, 'May-June', 'WASSCE', 'Chemistry Paper 1 (2023)', 'WASSCE Chemistry Objective Questions', 50, 50, 60, 'Answer ALL questions. Each question carries 1 mark.', 1, 0),

-- WASSCE Biology (using existing subj_biology)
('pp_wassce_bio_2024_1', 'exam_wassce', 'subj_biology', 'paper_wassce_1', 2024, 'May-June', 'WASSCE', 'Biology Paper 1 (2024)', 'WASSCE Biology Objective Questions', 50, 50, 50, 'Answer ALL questions. Each question carries 1 mark.', 1, 0),
('pp_wassce_bio_2023_1', 'exam_wassce', 'subj_biology', 'paper_wassce_1', 2023, 'May-June', 'WASSCE', 'Biology Paper 1 (2023)', 'WASSCE Biology Objective Questions', 50, 50, 50, 'Answer ALL questions. Each question carries 1 mark.', 1, 0),

-- WASSCE Elective Mathematics (using existing subj_wassce_elect_math)
('pp_wassce_emath_2024_1', 'exam_wassce', 'subj_wassce_elect_math', 'paper_wassce_1', 2024, 'May-June', 'WASSCE', 'Elective Mathematics Paper 1 (2024)', 'WASSCE Elective Mathematics Objective Questions', 50, 50, 90, 'Answer ALL questions. Each question carries 1 mark.', 1, 0),
('pp_wassce_emath_2023_1', 'exam_wassce', 'subj_wassce_elect_math', 'paper_wassce_1', 2023, 'May-June', 'WASSCE', 'Elective Mathematics Paper 1 (2023)', 'WASSCE Elective Mathematics Objective Questions', 50, 50, 90, 'Answer ALL questions. Each question carries 1 mark.', 1, 0);
