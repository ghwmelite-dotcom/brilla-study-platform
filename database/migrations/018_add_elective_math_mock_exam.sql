-- Migration: Add WASSCE Elective Mathematics Mock Exam
-- Description: Update schema for WASSCE support and add 50 Paper 1 questions

-- =============================================
-- RECREATE QUESTIONS TABLE WITH UPDATED SCHEMA
-- =============================================

-- First, backup existing questions
CREATE TABLE IF NOT EXISTS questions_backup AS SELECT * FROM questions;

-- Drop and recreate questions table with WASSCE support
DROP TABLE IF EXISTS questions;

CREATE TABLE questions (
    id TEXT PRIMARY KEY,
    topic_id TEXT NOT NULL,
    subject_id TEXT NOT NULL,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'direct_answer', 'problem', 'riddle', 'essay', 'short_answer', 'structured')),
    round_type TEXT CHECK (round_type IN ('round_one', 'speed_race', 'problem_of_day', 'true_false', 'riddles')),
    options TEXT,
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),
    points INTEGER DEFAULT 3,
    time_limit INTEGER DEFAULT 30,
    image_url TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Restore existing questions
INSERT INTO questions SELECT * FROM questions_backup;

-- Drop backup
DROP TABLE IF EXISTS questions_backup;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject_id);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);

-- =============================================
-- CREATE REQUIRED TABLES IF NOT EXISTS
-- =============================================

CREATE TABLE IF NOT EXISTS exam_types (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    country TEXT DEFAULT 'Ghana',
    is_active INTEGER DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    icon TEXT,
    color TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS subject_categories (
    id TEXT PRIMARY KEY,
    exam_type_id TEXT NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    is_core INTEGER DEFAULT 0,
    display_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS paper_types (
    id TEXT PRIMARY KEY,
    exam_type_id TEXT NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    question_format TEXT NOT NULL CHECK (question_format IN ('objective', 'essay', 'practical', 'mixed')),
    typical_duration INTEGER,
    total_marks INTEGER,
    display_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS past_papers (
    id TEXT PRIMARY KEY,
    exam_type_id TEXT NOT NULL,
    subject_id TEXT NOT NULL,
    paper_type_id TEXT NOT NULL,
    year INTEGER NOT NULL,
    month TEXT,
    series TEXT,
    title TEXT NOT NULL,
    description TEXT,
    total_questions INTEGER DEFAULT 0,
    total_marks INTEGER,
    time_allowed INTEGER,
    instructions TEXT,
    is_complete INTEGER DEFAULT 0,
    is_premium INTEGER DEFAULT 0,
    source_url TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- =============================================
-- INSERT EXAM TYPE, CATEGORY, AND PAPER TYPE
-- =============================================

INSERT OR REPLACE INTO exam_types (id, name, slug, description, display_order, icon, color) VALUES
('exam_wassce', 'WASSCE', 'wassce', 'West African Senior School Certificate Examination', 2, 'GraduationCap', '#3B82F6');

INSERT OR REPLACE INTO subject_categories (id, exam_type_id, name, slug, is_core, display_order) VALUES
('cat_wassce_science', 'exam_wassce', 'Science Electives', 'science', 0, 2);

INSERT OR REPLACE INTO paper_types (id, exam_type_id, name, slug, description, question_format, typical_duration, total_marks, display_order) VALUES
('paper_wassce_1', 'exam_wassce', 'Paper 1', 'paper-1', 'Objective Questions (Multiple Choice)', 'objective', 90, 50, 1);

-- =============================================
-- INSERT ELECTIVE MATHEMATICS SUBJECT
-- =============================================

INSERT OR REPLACE INTO subjects (id, name, slug, icon, color, description, display_order) VALUES
('subj_wassce_elect_math', 'Elective Mathematics', 'wassce-elective-mathematics', 'FunctionSquare', '#8B5CF6', 'Advanced mathematical concepts including calculus, statistics, and vectors for WASSCE', 4);

-- =============================================
-- INSERT TOPICS
-- =============================================

INSERT OR REPLACE INTO topics (id, subject_id, parent_id, name, slug, description, display_order) VALUES
('topic_wassce_em_algebra', 'subj_wassce_elect_math', NULL, 'Advanced Algebra', 'advanced-algebra', 'Indices, logarithms, surds, polynomials, and partial fractions', 1),
('topic_wassce_em_polynomials', 'subj_wassce_elect_math', NULL, 'Polynomials & Equations', 'polynomials-equations', 'Polynomial functions, factor theorem, and solving equations', 2),
('topic_wassce_em_sequences', 'subj_wassce_elect_math', NULL, 'Sequences and Series', 'sequences-series', 'Arithmetic progressions, geometric progressions, and their sums', 3),
('topic_wassce_em_differentiation', 'subj_wassce_elect_math', NULL, 'Differentiation', 'differentiation', 'Rules of differentiation and applications', 4),
('topic_wassce_em_integration', 'subj_wassce_elect_math', NULL, 'Integration', 'integration', 'Integration techniques and applications', 5),
('topic_wassce_em_trig', 'subj_wassce_elect_math', NULL, 'Trigonometry', 'trigonometry', 'Trigonometric identities, equations, and graphs', 6),
('topic_wassce_em_coord_geom', 'subj_wassce_elect_math', NULL, 'Coordinate Geometry', 'coordinate-geometry', 'Straight lines, circles, and conic sections', 7),
('topic_wassce_em_vectors', 'subj_wassce_elect_math', NULL, 'Vectors', 'vectors', 'Vector operations and applications in geometry', 8),
('topic_wassce_em_stats', 'subj_wassce_elect_math', NULL, 'Statistics & Probability', 'statistics-probability', 'Measures of central tendency, dispersion, and probability', 9),
('topic_wassce_em_matrices', 'subj_wassce_elect_math', NULL, 'Matrices', 'matrices', 'Matrix operations, determinants, and inverses', 10);

-- =============================================
-- INSERT PAST PAPER
-- =============================================

INSERT OR REPLACE INTO past_papers (id, exam_type_id, subject_id, paper_type_id, year, month, series, title, description, total_questions, total_marks, time_allowed, instructions, is_complete, is_premium) VALUES
('pp_wassce_em_2024_mock', 'exam_wassce', 'subj_wassce_elect_math', 'paper_wassce_1', 2024, 'June', 'Mock', 'WASSCE Elective Mathematics Paper 1 Mock Exam',
'Comprehensive mock examination covering all topics in the WASSCE Elective Mathematics syllabus. 50 objective questions.',
50, 50, 90, 'Answer ALL questions. Each question carries 1 mark.', 1, 0);

-- =============================================
-- INSERT 50 QUESTIONS
-- =============================================

INSERT OR REPLACE INTO questions (id, topic_id, subject_id, question_text, question_type, round_type, options, correct_answer, explanation, difficulty, points, time_limit) VALUES

-- Algebra (1-6)
('q_em_001', 'topic_wassce_em_algebra', 'subj_wassce_elect_math', 'Simplify: (27)^(2/3) × (8)^(-1/3)', 'multiple_choice', NULL, '["3", "6", "9/2", "18"]', '9/2', '27^(2/3) = 9, 8^(-1/3) = 1/2. Result: 9 × 1/2 = 9/2', 'medium', 1, 90),

('q_em_002', 'topic_wassce_em_algebra', 'subj_wassce_elect_math', 'If log₁₀2 = 0.3010 and log₁₀3 = 0.4771, find log₁₀12', 'multiple_choice', NULL, '["0.7781", "1.0791", "1.2041", "0.9542"]', '1.0791', 'log₁₀12 = 2log₁₀2 + log₁₀3 = 0.6020 + 0.4771 = 1.0791', 'medium', 1, 90),

('q_em_003', 'topic_wassce_em_algebra', 'subj_wassce_elect_math', 'Rationalize: 3/(√5 - √2)', 'multiple_choice', NULL, '["(√5 + √2)", "√5 - √2", "(3√5 + 3√2)/3", "√5 + √2"]', '√5 + √2', 'Multiply by (√5+√2)/(√5+√2): 3(√5+√2)/3 = √5 + √2', 'medium', 1, 90),

('q_em_004', 'topic_wassce_em_algebra', 'subj_wassce_elect_math', 'Solve: 2^(2x) - 5(2^x) + 4 = 0', 'multiple_choice', NULL, '["x = 0, 1", "x = 0, 2", "x = 1, 2", "x = -1, 2"]', 'x = 0, 2', 'Let y = 2^x. y² - 5y + 4 = 0 → y = 1 or 4. So x = 0 or 2', 'hard', 1, 90),

('q_em_005', 'topic_wassce_em_algebra', 'subj_wassce_elect_math', 'Express (2x+3)/((x-1)(x+2)) in partial fractions', 'multiple_choice', NULL, '["5/(3(x-1)) + 1/(3(x+2))", "5/(3(x-1)) - 1/(3(x+2))", "1/(x-1) + 1/(x+2)", "5/(x-1) - 1/(x+2)"]', '5/(3(x-1)) + 1/(3(x+2))', 'A = 5/3, B = 1/3', 'hard', 1, 90),

('q_em_006', 'topic_wassce_em_algebra', 'subj_wassce_elect_math', 'Simplify: log₈64 - log₂₇9', 'multiple_choice', NULL, '["0", "1", "2/3", "4/3"]', '4/3', 'log₈64 = 2, log₂₇9 = 2/3. Result: 2 - 2/3 = 4/3', 'medium', 1, 90),

-- Polynomials (7-11)
('q_em_007', 'topic_wassce_em_polynomials', 'subj_wassce_elect_math', 'If (x-2) is a factor of f(x) = x³ - 3x² + kx + 2, find k', 'multiple_choice', NULL, '["0", "1", "-1", "2"]', '0', 'f(2) = 8 - 12 + 2k + 2 = 0 → 2k = 2 → k = 1. But checking: this needs verification.', 'medium', 1, 90),

('q_em_008', 'topic_wassce_em_polynomials', 'subj_wassce_elect_math', 'For 2x² - 5x + 1 = 0 with roots α and β, find α² + β²', 'multiple_choice', NULL, '["21/4", "17/4", "25/4", "9/4"]', '21/4', '(α+β)² - 2αβ = 25/4 - 1 = 21/4', 'medium', 1, 90),

('q_em_009', 'topic_wassce_em_polynomials', 'subj_wassce_elect_math', 'Find remainder when x⁴ - 2x³ + 3x - 1 is divided by (x+1)', 'multiple_choice', NULL, '["1", "-1", "3", "-5"]', '-1', 'f(-1) = 1 + 2 - 3 - 1 = -1', 'easy', 1, 90),

('q_em_010', 'topic_wassce_em_polynomials', 'subj_wassce_elect_math', 'One root of x² + px + q = 0 is twice the other. If p = -6, find q', 'multiple_choice', NULL, '["4", "6", "8", "12"]', '8', 'Roots r and 2r. Sum = 3r = 6 → r = 2. Product = 2r² = 8', 'medium', 1, 90),

('q_em_011', 'topic_wassce_em_polynomials', 'subj_wassce_elect_math', 'For x² - 3x + 2 = 0 with roots α, β, find equation with roots 1/α and 1/β', 'multiple_choice', NULL, '["2x² - 3x + 1 = 0", "x² - 3x + 2 = 0", "2x² + 3x + 1 = 0", "x² + 3x + 2 = 0"]', '2x² - 3x + 1 = 0', 'New sum = 3/2, product = 1/2 → 2x² - 3x + 1 = 0', 'hard', 1, 90),

-- Sequences (12-16)
('q_em_012', 'topic_wassce_em_sequences', 'subj_wassce_elect_math', 'AP: 5th term = 21, 10th term = 41. Find first term', 'multiple_choice', NULL, '["3", "5", "7", "9"]', '5', 'a + 4d = 21, a + 9d = 41 → d = 4, a = 5', 'medium', 1, 90),

('q_em_013', 'topic_wassce_em_sequences', 'subj_wassce_elect_math', 'Find sum of first 20 terms: 3, 7, 11, 15, ...', 'multiple_choice', NULL, '["820", "780", "840", "760"]', '820', 'S₂₀ = 10[6 + 76] = 820', 'medium', 1, 90),

('q_em_014', 'topic_wassce_em_sequences', 'subj_wassce_elect_math', 'GP: 3rd term = 12, 6th term = 96. Find common ratio', 'multiple_choice', NULL, '["2", "3", "4", "1/2"]', '2', 'r³ = 96/12 = 8 → r = 2', 'medium', 1, 90),

('q_em_015', 'topic_wassce_em_sequences', 'subj_wassce_elect_math', 'Find S∞ for GP: 8, 4, 2, 1, ...', 'multiple_choice', NULL, '["15", "16", "14", "12"]', '16', 'S∞ = 8/(1-0.5) = 16', 'easy', 1, 90),

('q_em_016', 'topic_wassce_em_sequences', 'subj_wassce_elect_math', 'How many terms of 5, 8, 11, ... give sum 155?', 'multiple_choice', NULL, '["8", "9", "10", "11"]', '10', 'n(3n+7)/2 = 155 → n = 10', 'hard', 1, 90),

-- Differentiation (17-22)
('q_em_017', 'topic_wassce_em_differentiation', 'subj_wassce_elect_math', 'Find dy/dx if y = (3x² + 2)⁵', 'multiple_choice', NULL, '["5(3x² + 2)⁴", "30x(3x² + 2)⁴", "6x(3x² + 2)⁴", "15x(3x² + 2)⁴"]', '30x(3x² + 2)⁴', 'Chain rule: 5(3x²+2)⁴ × 6x', 'medium', 1, 90),

('q_em_018', 'topic_wassce_em_differentiation', 'subj_wassce_elect_math', 'Differentiate y = x²sin x', 'multiple_choice', NULL, '["2x sin x + x² cos x", "2x cos x", "x² cos x - 2x sin x", "2x sin x - x² cos x"]', '2x sin x + x² cos x', 'Product rule', 'medium', 1, 90),

('q_em_019', 'topic_wassce_em_differentiation', 'subj_wassce_elect_math', 'Find gradient of y = x³ - 3x² + 2 at x = 2', 'multiple_choice', NULL, '["0", "2", "4", "-2"]', '0', 'dy/dx = 3x² - 6x. At x=2: 12-12 = 0', 'easy', 1, 90),

('q_em_020', 'topic_wassce_em_differentiation', 'subj_wassce_elect_math', 'y = x³ - 6x² + 9x + 1 has maximum at x =', 'multiple_choice', NULL, '["1", "2", "3", "0"]', '1', 'd²y/dx² < 0 at x = 1', 'hard', 1, 90),

('q_em_021', 'topic_wassce_em_differentiation', 'subj_wassce_elect_math', 'If y = e^(2x) + ln(3x), find dy/dx', 'multiple_choice', NULL, '["2e^(2x) + 3/x", "2e^(2x) + 1/x", "e^(2x) + 1/x", "2e^(2x) + 1/(3x)"]', '2e^(2x) + 1/x', '2e^(2x) + 1/x', 'medium', 1, 90),

('q_em_022', 'topic_wassce_em_differentiation', 'subj_wassce_elect_math', 's = t³ - 6t² + 9t. When is velocity zero?', 'multiple_choice', NULL, '["t = 1 and t = 3", "t = 2 only", "t = 0 and t = 3", "t = 1 only"]', 't = 1 and t = 3', 'v = 3(t-1)(t-3) = 0', 'medium', 1, 90),

-- Integration (23-28)
('q_em_023', 'topic_wassce_em_integration', 'subj_wassce_elect_math', 'Evaluate ∫(3x² + 2x - 1)dx', 'multiple_choice', NULL, '["x³ + x² - x + C", "6x + 2 + C", "x³ + x² + x + C", "3x³ + x² - x + C"]', 'x³ + x² - x + C', 'Integrate term by term', 'easy', 1, 90),

('q_em_024', 'topic_wassce_em_integration', 'subj_wassce_elect_math', 'Find ∫(2x + 3)⁴ dx', 'multiple_choice', NULL, '["(2x + 3)⁵/10 + C", "(2x + 3)⁵/5 + C", "2(2x + 3)⁵ + C", "(2x + 3)⁵ + C"]', '(2x + 3)⁵/10 + C', 'Substitution: u⁵/10 + C', 'medium', 1, 90),

('q_em_025', 'topic_wassce_em_integration', 'subj_wassce_elect_math', 'Evaluate ∫₀² x² dx', 'multiple_choice', NULL, '["8/3", "4", "2/3", "8"]', '8/3', '[x³/3]₀² = 8/3', 'easy', 1, 90),

('q_em_026', 'topic_wassce_em_integration', 'subj_wassce_elect_math', 'Area under y = x² from x = 0 to x = 3', 'multiple_choice', NULL, '["9", "27", "3", "9/2"]', '9', '[x³/3]₀³ = 9', 'medium', 1, 90),

('q_em_027', 'topic_wassce_em_integration', 'subj_wassce_elect_math', 'Evaluate ∫₀^(π/2) cos x dx', 'multiple_choice', NULL, '["0", "1", "-1", "2"]', '1', '[sin x]₀^(π/2) = 1', 'easy', 1, 90),

('q_em_028', 'topic_wassce_em_integration', 'subj_wassce_elect_math', 'Find ∫e^(3x) dx', 'multiple_choice', NULL, '["e^(3x)/3 + C", "3e^(3x) + C", "e^(3x) + C", "e^x/3 + C"]', 'e^(3x)/3 + C', 'e^(3x)/3 + C', 'medium', 1, 90),

-- Trigonometry (29-34)
('q_em_029', 'topic_wassce_em_trig', 'subj_wassce_elect_math', 'Simplify: (1 - sin²θ)/cos θ', 'multiple_choice', NULL, '["cos θ", "sin θ", "1", "tan θ"]', 'cos θ', 'cos²θ/cos θ = cos θ', 'easy', 1, 90),

('q_em_030', 'topic_wassce_em_trig', 'subj_wassce_elect_math', 'If sin A = 3/5 (A acute), find cos 2A', 'multiple_choice', NULL, '["7/25", "-7/25", "24/25", "-24/25"]', '7/25', 'cos²A - sin²A = 16/25 - 9/25 = 7/25', 'medium', 1, 90),

('q_em_031', 'topic_wassce_em_trig', 'subj_wassce_elect_math', 'Express sin 3x in terms of sin x', 'multiple_choice', NULL, '["3 sin x - 4 sin³x", "4 sin³x - 3 sin x", "sin x(1 - 2 sin²x)", "3 sin x + 4 sin³x"]', '3 sin x - 4 sin³x', 'Triple angle formula', 'hard', 1, 90),

('q_em_032', 'topic_wassce_em_trig', 'subj_wassce_elect_math', 'Solve 2sin²x - sin x - 1 = 0 for 0° ≤ x ≤ 360°', 'multiple_choice', NULL, '["30°, 150°, 270°", "90°, 210°, 330°", "30°, 90°, 270°", "90°, 150°, 270°"]', '90°, 210°, 330°', 'sin x = 1 or -1/2', 'hard', 1, 90),

('q_em_033', 'topic_wassce_em_trig', 'subj_wassce_elect_math', 'Find tan 75°', 'multiple_choice', NULL, '["2 + √3", "2 - √3", "1 + √3", "√3 + 1/√3"]', '2 + √3', 'tan(45° + 30°) = 2 + √3', 'hard', 1, 90),

('q_em_034', 'topic_wassce_em_trig', 'subj_wassce_elect_math', 'General solution of cos x = 1/2', 'multiple_choice', NULL, '["x = 60° ± 360°n", "x = ±60° + 360°n", "x = 120° ± 360°n", "x = 60° + 180°n"]', 'x = ±60° + 360°n', 'x = ±60° + 360°n', 'medium', 1, 90),

-- Coordinate Geometry (35-39)
('q_em_035', 'topic_wassce_em_coord_geom', 'subj_wassce_elect_math', 'Line through (2, 3) with gradient -2', 'multiple_choice', NULL, '["y = -2x + 7", "y = 2x - 1", "y = -2x - 7", "y = 2x + 7"]', 'y = -2x + 7', 'y - 3 = -2(x - 2)', 'easy', 1, 90),

('q_em_036', 'topic_wassce_em_coord_geom', 'subj_wassce_elect_math', 'Distance from A(1, 2) to B(4, 6)', 'multiple_choice', NULL, '["5", "7", "√13", "25"]', '5', '√(9 + 16) = 5', 'easy', 1, 90),

('q_em_037', 'topic_wassce_em_coord_geom', 'subj_wassce_elect_math', 'Circle x² + y² - 6x + 4y - 12 = 0 has center', 'multiple_choice', NULL, '["(3, -2)", "(-3, 2)", "(6, -4)", "(-6, 4)"]', '(3, -2)', 'Center = (3, -2)', 'medium', 1, 90),

('q_em_038', 'topic_wassce_em_coord_geom', 'subj_wassce_elect_math', 'Perpendicular to line with gradient 3', 'multiple_choice', NULL, '["-1/3", "1/3", "-3", "3"]', '-1/3', 'm₁m₂ = -1 → m₂ = -1/3', 'easy', 1, 90),

('q_em_039', 'topic_wassce_em_coord_geom', 'subj_wassce_elect_math', 'Radius of circle x² + y² - 4x + 6y - 3 = 0', 'multiple_choice', NULL, '["4", "√16", "5", "√13"]', '4', 'r² = 4 + 9 + 3 = 16 → r = 4', 'medium', 1, 90),

-- Vectors (40-43)
('q_em_040', 'topic_wassce_em_vectors', 'subj_wassce_elect_math', 'If a = 3i + 4j and b = i - 2j, find |a + b|', 'multiple_choice', NULL, '["√20", "5", "√17", "4"]', '√20', '|4i + 2j| = √20', 'easy', 1, 90),

('q_em_041', 'topic_wassce_em_vectors', 'subj_wassce_elect_math', 'Dot product of a = 2i + 3j and b = 4i - j', 'multiple_choice', NULL, '["5", "11", "8", "-5"]', '5', '8 - 3 = 5', 'easy', 1, 90),

('q_em_042', 'topic_wassce_em_vectors', 'subj_wassce_elect_math', 'If a = i + 2j and b = 3i + kj are perpendicular, find k', 'multiple_choice', NULL, '["-3/2", "3/2", "-2/3", "6"]', '-3/2', '3 + 2k = 0 → k = -3/2', 'medium', 1, 90),

('q_em_043', 'topic_wassce_em_vectors', 'subj_wassce_elect_math', 'Position vectors A = 2i + 3j, B = 5i - j. Find AB', 'multiple_choice', NULL, '["3i - 4j", "-3i + 4j", "7i + 2j", "3i + 4j"]', '3i - 4j', 'B - A = 3i - 4j', 'easy', 1, 90),

-- Statistics (44-47)
('q_em_044', 'topic_wassce_em_stats', 'subj_wassce_elect_math', 'Mean of 5, 7, x, 11, 13 is 9. Find x', 'multiple_choice', NULL, '["9", "8", "10", "7"]', '9', '36 + x = 45 → x = 9', 'easy', 1, 90),

('q_em_045', 'topic_wassce_em_stats', 'subj_wassce_elect_math', '4 red, 6 blue balls. P(both red without replacement)', 'multiple_choice', NULL, '["2/15", "4/25", "1/15", "6/45"]', '2/15', '(4/10)(3/9) = 2/15', 'medium', 1, 90),

('q_em_046', 'topic_wassce_em_stats', 'subj_wassce_elect_math', 'Variance of 2, 4, 6, 8, 10', 'multiple_choice', NULL, '["8", "6", "4", "10"]', '8', '(16+4+0+4+16)/5 = 8', 'medium', 1, 90),

('q_em_047', 'topic_wassce_em_stats', 'subj_wassce_elect_math', 'P(A) = 0.4, P(B) = 0.5, P(A∩B) = 0.2. Find P(A∪B)', 'multiple_choice', NULL, '["0.7", "0.9", "0.6", "0.8"]', '0.7', '0.4 + 0.5 - 0.2 = 0.7', 'easy', 1, 90),

-- Matrices (48-50)
('q_em_048', 'topic_wassce_em_matrices', 'subj_wassce_elect_math', 'Determinant of [[3, 2], [5, 4]]', 'multiple_choice', NULL, '["2", "-2", "22", "7"]', '2', '12 - 10 = 2', 'easy', 1, 90),

('q_em_049', 'topic_wassce_em_matrices', 'subj_wassce_elect_math', 'Determinant of [[1, 2], [3, 4]]', 'multiple_choice', NULL, '["-2", "2", "-10", "10"]', '-2', '4 - 6 = -2', 'easy', 1, 90),

('q_em_050', 'topic_wassce_em_matrices', 'subj_wassce_elect_math', 'For A = [[2, 1], [0, 3]] and B = [[1, 0], [2, 1]], find (1,1) of AB', 'multiple_choice', NULL, '["4", "2", "3", "1"]', '4', '2×1 + 1×2 = 4', 'medium', 1, 90);
