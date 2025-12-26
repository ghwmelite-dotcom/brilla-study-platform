-- Migration 028: Add past paper columns to questions table
-- This adds the columns needed to link questions to past papers

-- Add columns to questions table if they don't exist
-- Using a workaround since SQLite doesn't support ADD COLUMN IF NOT EXISTS

-- First, let's add the columns (will fail silently if they exist)
-- We need to recreate the table with the new columns

-- Create new table with all needed columns
CREATE TABLE IF NOT EXISTS questions_v2 (
    id TEXT PRIMARY KEY,
    topic_id TEXT,
    subject_id TEXT NOT NULL,
    exam_type_id TEXT,
    paper_type_id TEXT,
    past_paper_id TEXT,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL CHECK (question_type IN (
        'multiple_choice', 'true_false', 'direct_answer', 'problem', 'riddle',
        'essay', 'short_answer', 'structured', 'practical', 'calculation', 'diagram', 'comprehension'
    )),
    round_type TEXT CHECK (round_type IN ('round_one', 'speed_race', 'problem_of_day', 'true_false', 'riddles')),
    options TEXT,
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),
    points INTEGER DEFAULT 3,
    marks INTEGER DEFAULT 1,
    time_limit INTEGER DEFAULT 30,
    question_number INTEGER,
    section TEXT,
    is_compulsory INTEGER DEFAULT 1,
    image_url TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Copy existing data
INSERT OR IGNORE INTO questions_v2 (id, topic_id, subject_id, question_text, question_type, round_type, options, correct_answer, explanation, difficulty, points, time_limit, image_url, created_at, updated_at)
SELECT id, topic_id, subject_id, question_text, question_type, round_type, options, correct_answer, explanation, difficulty, points, time_limit, image_url, created_at, updated_at
FROM questions;

-- Drop old table
DROP TABLE IF EXISTS questions;

-- Rename new table
ALTER TABLE questions_v2 RENAME TO questions;

-- Create index for past_paper_id lookups
CREATE INDEX IF NOT EXISTS idx_questions_past_paper ON questions(past_paper_id);
CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject_id);
CREATE INDEX IF NOT EXISTS idx_questions_exam_type ON questions(exam_type_id);

-- Insert WASSCE subjects
INSERT OR IGNORE INTO subjects (id, name, slug, icon, color, description, display_order) VALUES
('subj_wassce_core_math', 'Core Mathematics', 'core-mathematics-wassce', 'Calculator', '#3B82F6', 'WASSCE Core Mathematics', 1),
('subj_wassce_english', 'English Language', 'english-wassce', 'Languages', '#EF4444', 'WASSCE English Language', 2),
('subj_wassce_int_science', 'Integrated Science', 'integrated-science-wassce', 'Beaker', '#14B8A6', 'WASSCE Integrated Science', 3),
('subj_wassce_social', 'Social Studies', 'social-studies-wassce', 'Users', '#F59E0B', 'WASSCE Social Studies', 4),
('subj_wassce_physics', 'Physics', 'physics-wassce', 'Atom', '#8B5CF6', 'WASSCE Physics', 5),
('subj_wassce_chemistry', 'Chemistry', 'chemistry-wassce', 'FlaskConical', '#10B981', 'WASSCE Chemistry', 6),
('subj_wassce_biology', 'Biology', 'biology-wassce', 'Leaf', '#22C55E', 'WASSCE Biology', 7);

-- Insert BECE subjects
INSERT OR IGNORE INTO subjects (id, name, slug, icon, color, description, display_order) VALUES
('subj_bece_math', 'Mathematics', 'mathematics-bece', 'Calculator', '#3B82F6', 'BECE Mathematics', 8),
('subj_bece_english', 'English Language', 'english-bece', 'Languages', '#EF4444', 'BECE English Language', 9),
('subj_bece_science', 'Integrated Science', 'integrated-science-bece', 'Beaker', '#14B8A6', 'BECE Integrated Science', 10),
('subj_bece_social', 'Social Studies', 'social-studies-bece', 'Users', '#F59E0B', 'BECE Social Studies', 11);

-- Ensure exam types exist
INSERT OR IGNORE INTO exam_types (id, name, slug, description, country, icon, color, display_order) VALUES
('exam_wassce', 'WASSCE', 'wassce', 'West African Senior School Certificate Examination', 'Ghana', 'GraduationCap', '#3B82F6', 1),
('exam_bece', 'BECE', 'bece', 'Basic Education Certificate Examination', 'Ghana', 'School', '#22C55E', 2);

-- Ensure paper types exist
INSERT OR IGNORE INTO paper_types (id, exam_type_id, name, slug, description, question_format, typical_duration, total_marks, display_order) VALUES
('paper_wassce_1', 'exam_wassce', 'Paper 1 - Objectives', 'paper-1', 'Multiple choice questions', 'objective', 60, 50, 1),
('paper_wassce_2', 'exam_wassce', 'Paper 2 - Essay/Theory', 'paper-2', 'Essay and structured questions', 'essay', 180, 100, 2),
('paper_bece_1', 'exam_bece', 'Paper 1 - Objectives', 'paper-1', 'Multiple choice questions', 'objective', 60, 40, 1),
('paper_bece_2', 'exam_bece', 'Paper 2 - Essay', 'paper-2', 'Essay and structured questions', 'essay', 90, 60, 2);

-- Insert Past Papers
INSERT OR REPLACE INTO past_papers (id, exam_type_id, subject_id, paper_type_id, year, month, series, title, description, total_questions, total_marks, time_allowed, instructions, is_complete, is_premium) VALUES
-- WASSCE Core Mathematics
('pp_wassce_math_2024_1', 'exam_wassce', 'subj_wassce_core_math', 'paper_wassce_1', 2024, 'May-June', 'WASSCE', 'Core Mathematics Paper 1 (2024)', 'WASSCE Core Mathematics Objective Questions', 50, 50, 90, 'Answer ALL questions. Each question carries 1 mark.', 1, 0),
('pp_wassce_math_2023_1', 'exam_wassce', 'subj_wassce_core_math', 'paper_wassce_1', 2023, 'May-June', 'WASSCE', 'Core Mathematics Paper 1 (2023)', 'WASSCE Core Mathematics Objective Questions', 50, 50, 90, 'Answer ALL questions. Each question carries 1 mark.', 1, 0),
-- WASSCE English Language
('pp_wassce_eng_2024_1', 'exam_wassce', 'subj_wassce_english', 'paper_wassce_1', 2024, 'May-June', 'WASSCE', 'English Language Paper 1 (2024)', 'WASSCE English Language Objective Questions', 50, 50, 60, 'Answer ALL questions. Each question carries 1 mark.', 1, 0),
('pp_wassce_eng_2023_1', 'exam_wassce', 'subj_wassce_english', 'paper_wassce_1', 2023, 'May-June', 'WASSCE', 'English Language Paper 1 (2023)', 'WASSCE English Language Objective Questions', 50, 50, 60, 'Answer ALL questions. Each question carries 1 mark.', 1, 0),
-- WASSCE Integrated Science
('pp_wassce_sci_2024_1', 'exam_wassce', 'subj_wassce_int_science', 'paper_wassce_1', 2024, 'May-June', 'WASSCE', 'Integrated Science Paper 1 (2024)', 'WASSCE Integrated Science Objective Questions', 50, 50, 60, 'Answer ALL questions. Each question carries 1 mark.', 1, 0),
('pp_wassce_sci_2023_1', 'exam_wassce', 'subj_wassce_int_science', 'paper_wassce_1', 2023, 'May-June', 'WASSCE', 'Integrated Science Paper 1 (2023)', 'WASSCE Integrated Science Objective Questions', 50, 50, 60, 'Answer ALL questions. Each question carries 1 mark.', 1, 0),
-- WASSCE Social Studies
('pp_wassce_soc_2024_1', 'exam_wassce', 'subj_wassce_social', 'paper_wassce_1', 2024, 'May-June', 'WASSCE', 'Social Studies Paper 1 (2024)', 'WASSCE Social Studies Objective Questions', 50, 50, 60, 'Answer ALL questions. Each question carries 1 mark.', 1, 0),
('pp_wassce_soc_2023_1', 'exam_wassce', 'subj_wassce_social', 'paper_wassce_1', 2023, 'May-June', 'WASSCE', 'Social Studies Paper 1 (2023)', 'WASSCE Social Studies Objective Questions', 50, 50, 60, 'Answer ALL questions. Each question carries 1 mark.', 1, 0),
-- WASSCE Physics
('pp_wassce_phy_2024_1', 'exam_wassce', 'subj_wassce_physics', 'paper_wassce_1', 2024, 'May-June', 'WASSCE', 'Physics Paper 1 (2024)', 'WASSCE Physics Objective Questions', 50, 50, 60, 'Answer ALL questions. Each question carries 1 mark.', 1, 0),
-- WASSCE Chemistry
('pp_wassce_chem_2024_1', 'exam_wassce', 'subj_wassce_chemistry', 'paper_wassce_1', 2024, 'May-June', 'WASSCE', 'Chemistry Paper 1 (2024)', 'WASSCE Chemistry Objective Questions', 50, 50, 60, 'Answer ALL questions. Each question carries 1 mark.', 1, 0),
-- WASSCE Biology
('pp_wassce_bio_2024_1', 'exam_wassce', 'subj_wassce_biology', 'paper_wassce_1', 2024, 'May-June', 'WASSCE', 'Biology Paper 1 (2024)', 'WASSCE Biology Objective Questions', 50, 50, 50, 'Answer ALL questions. Each question carries 1 mark.', 1, 0),
-- BECE Mathematics
('pp_bece_math_2024_1', 'exam_bece', 'subj_bece_math', 'paper_bece_1', 2024, 'June', 'BECE', 'Mathematics Paper 1 (2024)', 'BECE Mathematics Objective Questions', 40, 40, 60, 'Answer ALL questions. Each question carries 1 mark.', 1, 0),
('pp_bece_math_2023_1', 'exam_bece', 'subj_bece_math', 'paper_bece_1', 2023, 'June', 'BECE', 'Mathematics Paper 1 (2023)', 'BECE Mathematics Objective Questions', 40, 40, 60, 'Answer ALL questions. Each question carries 1 mark.', 1, 0),
-- BECE English
('pp_bece_eng_2024_1', 'exam_bece', 'subj_bece_english', 'paper_bece_1', 2024, 'June', 'BECE', 'English Language Paper 1 (2024)', 'BECE English Language Objective Questions', 40, 40, 45, 'Answer ALL questions. Each question carries 1 mark.', 1, 0),
('pp_bece_eng_2023_1', 'exam_bece', 'subj_bece_english', 'paper_bece_1', 2023, 'June', 'BECE', 'English Language Paper 1 (2023)', 'BECE English Language Objective Questions', 40, 40, 45, 'Answer ALL questions. Each question carries 1 mark.', 1, 0),
-- BECE Integrated Science
('pp_bece_sci_2024_1', 'exam_bece', 'subj_bece_science', 'paper_bece_1', 2024, 'June', 'BECE', 'Integrated Science Paper 1 (2024)', 'BECE Integrated Science Objective Questions', 40, 40, 45, 'Answer ALL questions. Each question carries 1 mark.', 1, 0),
('pp_bece_sci_2023_1', 'exam_bece', 'subj_bece_science', 'paper_bece_1', 2023, 'June', 'BECE', 'Integrated Science Paper 1 (2023)', 'BECE Integrated Science Objective Questions', 40, 40, 45, 'Answer ALL questions. Each question carries 1 mark.', 1, 0),
-- BECE Social Studies
('pp_bece_soc_2024_1', 'exam_bece', 'subj_bece_social', 'paper_bece_1', 2024, 'June', 'BECE', 'Social Studies Paper 1 (2024)', 'BECE Social Studies Objective Questions', 40, 40, 45, 'Answer ALL questions. Each question carries 1 mark.', 1, 0),
('pp_bece_soc_2023_1', 'exam_bece', 'subj_bece_social', 'paper_bece_1', 2023, 'June', 'BECE', 'Social Studies Paper 1 (2023)', 'BECE Social Studies Objective Questions', 40, 40, 45, 'Answer ALL questions. Each question carries 1 mark.', 1, 0);
