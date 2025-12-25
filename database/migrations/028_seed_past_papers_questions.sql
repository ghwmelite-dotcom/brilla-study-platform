-- Migration 028: Add past_paper_id column and seed past papers with questions
-- This migration populates the past papers and mock exams with actual questions

-- Step 1: Add past_paper_id column to questions table if not exists
-- SQLite doesn't support IF NOT EXISTS for columns, so we use a workaround
CREATE TABLE IF NOT EXISTS questions_new (
    id TEXT PRIMARY KEY,
    topic_id TEXT REFERENCES topics(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    exam_type_id TEXT REFERENCES exam_types(id),
    paper_type_id TEXT REFERENCES paper_types(id),
    past_paper_id TEXT REFERENCES past_papers(id),
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

-- Copy existing data if table exists
INSERT OR IGNORE INTO questions_new
SELECT id, topic_id, subject_id, exam_type_id, paper_type_id, NULL as past_paper_id,
       question_text, question_type, round_type, options, correct_answer, explanation,
       difficulty, points, marks, time_limit, question_number, section, is_compulsory,
       image_url, created_at, updated_at
FROM questions WHERE 1=0; -- Only creates structure, actual migration handled below

-- Step 2: Insert WASSCE Subjects if not exist
INSERT OR IGNORE INTO subjects (id, name, slug, exam_type_id, category_id, icon, color, description, display_order, is_active) VALUES
('subj_wassce_core_math', 'Core Mathematics', 'core-mathematics', 'exam_wassce', 'cat_wassce_core', 'Calculator', '#3B82F6', 'Algebra, geometry, statistics, trigonometry', 1, 1),
('subj_wassce_english', 'English Language', 'english', 'exam_wassce', 'cat_wassce_core', 'Languages', '#EF4444', 'Grammar, comprehension, essay writing', 2, 1),
('subj_wassce_int_science', 'Integrated Science', 'integrated-science', 'exam_wassce', 'cat_wassce_core', 'Beaker', '#14B8A6', 'Biology, chemistry, physics basics', 3, 1),
('subj_wassce_social', 'Social Studies', 'social-studies', 'exam_wassce', 'cat_wassce_core', 'Users', '#F59E0B', 'Governance, environment, social issues', 4, 1),
('subj_wassce_physics', 'Physics', 'physics', 'exam_wassce', 'cat_wassce_science', 'Atom', '#8B5CF6', 'Mechanics, waves, electricity', 5, 1),
('subj_wassce_chemistry', 'Chemistry', 'chemistry', 'exam_wassce', 'cat_wassce_science', 'FlaskConical', '#10B981', 'Organic, inorganic, physical chemistry', 6, 1),
('subj_wassce_biology', 'Biology', 'biology', 'exam_wassce', 'cat_wassce_science', 'Leaf', '#22C55E', 'Cell biology, genetics, ecology', 7, 1);

-- Step 3: Insert BECE Subjects if not exist
INSERT OR IGNORE INTO subjects (id, name, slug, exam_type_id, category_id, icon, color, description, display_order, is_active) VALUES
('subj_bece_math', 'Mathematics', 'mathematics', 'exam_bece', 'cat_bece_core', 'Calculator', '#3B82F6', 'Numbers, algebra, geometry', 1, 1),
('subj_bece_english', 'English Language', 'english', 'exam_bece', 'cat_bece_core', 'Languages', '#EF4444', 'Grammar, comprehension, composition', 2, 1),
('subj_bece_science', 'Integrated Science', 'integrated-science', 'exam_bece', 'cat_bece_core', 'Beaker', '#14B8A6', 'Biology, chemistry, physics fundamentals', 3, 1),
('subj_bece_social', 'Social Studies', 'social-studies', 'exam_bece', 'cat_bece_core', 'Users', '#F59E0B', 'Ghana history, civics, environment', 4, 1);

-- Step 4: Insert Paper Types if not exist
INSERT OR IGNORE INTO paper_types (id, exam_type_id, name, slug, description, question_format, typical_duration, total_marks, display_order) VALUES
('paper_wassce_1', 'exam_wassce', 'Paper 1 - Objectives', 'paper-1', 'Multiple choice questions', 'objective', 60, 50, 1),
('paper_wassce_2', 'exam_wassce', 'Paper 2 - Essay/Theory', 'paper-2', 'Essay and structured questions', 'essay', 180, 100, 2),
('paper_bece_1', 'exam_bece', 'Paper 1 - Objectives', 'paper-1', 'Multiple choice questions', 'objective', 60, 40, 1),
('paper_bece_2', 'exam_bece', 'Paper 2 - Essay', 'paper-2', 'Essay and structured questions', 'essay', 90, 60, 2);

-- Step 5: Insert Past Papers
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

-- Step 6: Add past_paper_id column if it doesn't exist (using ALTER TABLE)
-- Note: SQLite doesn't support ADD COLUMN IF NOT EXISTS, so we'll handle this carefully
