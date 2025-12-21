-- Brilla Study Platform Seed Data
-- Sample data for development and testing
-- Supports: NSMQ, WASSCE, BECE

-- =============================================
-- CLEAR EXISTING DATA (for re-seeding)
-- =============================================
-- Delete in reverse order of dependencies
DELETE FROM riddles;
DELETE FROM questions;
DELETE FROM topics;
DELETE FROM houses;
DELETE FROM achievements;
DELETE FROM users;
DELETE FROM subscription_tiers;
DELETE FROM past_papers;
DELETE FROM paper_types;
DELETE FROM subjects;
DELETE FROM subject_categories;
DELETE FROM exam_types;

-- =============================================
-- EXAM TYPES
-- =============================================
INSERT INTO exam_types (id, name, slug, description, display_order, icon, color) VALUES
('exam_nsmq', 'National Science & Maths Quiz', 'nsmq', 'Ghana''s premier inter-school science competition for SHS students', 1, 'Trophy', '#F59E0B'),
('exam_wassce', 'WASSCE', 'wassce', 'West African Senior School Certificate Examination for SHS students', 2, 'GraduationCap', '#3B82F6'),
('exam_bece', 'BECE', 'bece', 'Basic Education Certificate Examination for JHS students', 3, 'BookOpen', '#10B981');

-- =============================================
-- SUBJECT CATEGORIES
-- =============================================

-- NSMQ Categories (all subjects are core)
INSERT INTO subject_categories (id, exam_type_id, name, slug, is_core, display_order) VALUES
('cat_nsmq_core', 'exam_nsmq', 'NSMQ Subjects', 'nsmq-subjects', 1, 1);

-- WASSCE Categories
INSERT INTO subject_categories (id, exam_type_id, name, slug, is_core, display_order) VALUES
('cat_wassce_core', 'exam_wassce', 'Core Subjects', 'core', 1, 1),
('cat_wassce_science', 'exam_wassce', 'Science Electives', 'science', 0, 2),
('cat_wassce_business', 'exam_wassce', 'Business Electives', 'business', 0, 3),
('cat_wassce_arts', 'exam_wassce', 'Arts & Humanities', 'arts', 0, 4),
('cat_wassce_technical', 'exam_wassce', 'Technical & Vocational', 'technical', 0, 5),
('cat_wassce_languages', 'exam_wassce', 'Languages', 'languages', 0, 6);

-- BECE Categories
INSERT INTO subject_categories (id, exam_type_id, name, slug, is_core, display_order) VALUES
('cat_bece_core', 'exam_bece', 'Core Subjects', 'core', 1, 1),
('cat_bece_elective', 'exam_bece', 'Elective Subjects', 'electives', 0, 2);

-- =============================================
-- PAPER TYPES
-- =============================================

-- WASSCE Paper Types
INSERT INTO paper_types (id, exam_type_id, name, slug, description, question_format, typical_duration, total_marks, display_order) VALUES
('paper_wassce_1', 'exam_wassce', 'Paper 1', 'paper-1', 'Objective Questions (Multiple Choice)', 'objective', 90, 50, 1),
('paper_wassce_2', 'exam_wassce', 'Paper 2', 'paper-2', 'Theory/Essay Questions', 'essay', 180, 100, 2),
('paper_wassce_3', 'exam_wassce', 'Paper 3', 'paper-3', 'Practical/Alternative to Practical', 'practical', 180, 50, 3);

-- BECE Paper Types
INSERT INTO paper_types (id, exam_type_id, name, slug, description, question_format, typical_duration, total_marks, display_order) VALUES
('paper_bece_1', 'exam_bece', 'Paper 1', 'paper-1', 'Objective Questions', 'objective', 60, 40, 1),
('paper_bece_2', 'exam_bece', 'Paper 2', 'paper-2', 'Essay Questions', 'essay', 90, 60, 2);

-- NSMQ Round Types (as paper types for consistency)
INSERT INTO paper_types (id, exam_type_id, name, slug, description, question_format, typical_duration, total_marks, display_order) VALUES
('paper_nsmq_r1', 'exam_nsmq', 'Round 1 - Fundamentals', 'round-1', 'Direct answer questions by subject', 'mixed', 30, 48, 1),
('paper_nsmq_r2', 'exam_nsmq', 'Round 2 - Speed Race', 'round-2', 'Buzzer speed questions', 'mixed', 15, 24, 2),
('paper_nsmq_r3', 'exam_nsmq', 'Round 3 - Problem of the Day', 'round-3', 'Multi-part problem solving', 'essay', 10, 10, 3),
('paper_nsmq_r4', 'exam_nsmq', 'Round 4 - True or False', 'round-4', 'True/False statements with bonuses', 'mixed', 15, 16, 4),
('paper_nsmq_r5', 'exam_nsmq', 'Round 5 - Riddles', 'round-5', 'Science riddles with clues', 'mixed', 15, 15, 5);

-- =============================================
-- SUBSCRIPTION TIERS
-- =============================================
INSERT INTO subscription_tiers (id, name, slug, description, price_monthly, price_yearly, ai_grading_quota, features) VALUES
('tier_free', 'Free', 'free', 'Access to questions and model answers', 0, 0, 0, '["unlimited_questions", "model_answers", "basic_analytics", "leaderboards"]'),
('tier_basic', 'Basic', 'basic', 'AI grading for essays with detailed feedback', 15, 120, 30, '["ai_grading", "detailed_feedback", "progress_tracking", "past_papers"]'),
('tier_premium', 'Premium', 'premium', 'Unlimited AI grading and advanced features', 35, 300, -1, '["unlimited_ai_grading", "advanced_analytics", "study_plans", "teacher_review", "priority_support"]'),
('tier_school', 'School', 'school', 'For schools and institutions', 500, 4500, -1, '["all_premium_features", "admin_dashboard", "student_management", "bulk_reports", "custom_branding"]');

-- =============================================
-- NSMQ SUBJECTS
-- =============================================
INSERT INTO subjects (id, name, slug, icon, color, description, display_order, exam_type_id, category_id) VALUES
('subj_nsmq_math', 'Mathematics', 'nsmq-mathematics', 'Calculator', '#3B82F6', 'Master mathematical concepts from algebra to calculus', 1, 'exam_nsmq', 'cat_nsmq_core'),
('subj_nsmq_physics', 'Physics', 'nsmq-physics', 'Atom', '#8B5CF6', 'Explore the fundamental laws of the universe', 2, 'exam_nsmq', 'cat_nsmq_core'),
('subj_nsmq_chemistry', 'Chemistry', 'nsmq-chemistry', 'FlaskConical', '#10B981', 'Discover the science of matter and its interactions', 3, 'exam_nsmq', 'cat_nsmq_core'),
('subj_nsmq_biology', 'Biology', 'nsmq-biology', 'Dna', '#F59E0B', 'Study life and living organisms', 4, 'exam_nsmq', 'cat_nsmq_core');

-- =============================================
-- WASSCE SUBJECTS (50+ subjects)
-- =============================================

-- WASSCE Core Subjects (4)
INSERT INTO subjects (id, name, slug, icon, color, description, display_order, exam_type_id, category_id, waec_code, is_active) VALUES
('subj_wassce_english', 'English Language', 'wassce-english-language', 'Languages', '#3B82F6', 'Develop proficiency in English comprehension, grammar, and composition', 1, 'exam_wassce', 'cat_wassce_core', 'ENG', 1),
('subj_wassce_core_math', 'Core Mathematics', 'wassce-core-mathematics', 'Calculator', '#8B5CF6', 'Essential mathematical skills for everyday problem-solving', 2, 'exam_wassce', 'cat_wassce_core', 'MTH', 1),
('subj_wassce_int_science', 'Integrated Science', 'wassce-integrated-science', 'Microscope', '#10B981', 'Interdisciplinary approach to understanding scientific concepts', 3, 'exam_wassce', 'cat_wassce_core', 'ISC', 1),
('subj_wassce_social', 'Social Studies', 'wassce-social-studies', 'Globe', '#F59E0B', 'Understanding Ghanaian society, governance, and global issues', 4, 'exam_wassce', 'cat_wassce_core', 'SST', 1);

-- WASSCE Science Electives (5)
INSERT INTO subjects (id, name, slug, icon, color, description, display_order, exam_type_id, category_id, waec_code, is_active) VALUES
('subj_wassce_physics', 'Physics', 'wassce-physics', 'Atom', '#6366F1', 'Study of matter, energy, and their interactions', 1, 'exam_wassce', 'cat_wassce_science', 'PHY', 1),
('subj_wassce_chemistry', 'Chemistry', 'wassce-chemistry', 'FlaskConical', '#14B8A6', 'Study of substances, their properties, and reactions', 2, 'exam_wassce', 'cat_wassce_science', 'CHM', 1),
('subj_wassce_biology', 'Biology', 'wassce-biology', 'Dna', '#22C55E', 'Study of living organisms and life processes', 3, 'exam_wassce', 'cat_wassce_science', 'BIO', 1),
('subj_wassce_elect_math', 'Elective Mathematics', 'wassce-elective-mathematics', 'FunctionSquare', '#8B5CF6', 'Advanced mathematical concepts including calculus and statistics', 4, 'exam_wassce', 'cat_wassce_science', 'EMA', 1),
('subj_wassce_agric', 'Agricultural Science', 'wassce-agricultural-science', 'Wheat', '#84CC16', 'Scientific principles of crop and animal production', 5, 'exam_wassce', 'cat_wassce_science', 'AGS', 1);

-- WASSCE Business Electives (7)
INSERT INTO subjects (id, name, slug, icon, color, description, display_order, exam_type_id, category_id, waec_code, is_active) VALUES
('subj_wassce_accounting', 'Financial Accounting', 'wassce-financial-accounting', 'Receipt', '#059669', 'Principles of recording, summarizing, and reporting financial transactions', 1, 'exam_wassce', 'cat_wassce_business', 'ACC', 1),
('subj_wassce_economics', 'Economics', 'wassce-economics', 'TrendingUp', '#0EA5E9', 'Study of production, distribution, and consumption of goods and services', 2, 'exam_wassce', 'cat_wassce_business', 'ECO', 1),
('subj_wassce_bus_mgmt', 'Business Management', 'wassce-business-management', 'Briefcase', '#6366F1', 'Principles of planning, organizing, and managing business operations', 3, 'exam_wassce', 'cat_wassce_business', 'BMT', 1),
('subj_wassce_cost_acct', 'Cost Accounting', 'wassce-cost-accounting', 'Calculator', '#10B981', 'Recording and analyzing costs for business decision-making', 4, 'exam_wassce', 'cat_wassce_business', 'CAC', 1),
('subj_wassce_commerce', 'Commerce', 'wassce-commerce', 'Store', '#F59E0B', 'Study of trade, buying, selling, and distribution of goods', 5, 'exam_wassce', 'cat_wassce_business', 'COM', 1),
('subj_wassce_clerical', 'Clerical Office Duties', 'wassce-clerical-office-duties', 'FileText', '#64748B', 'Office procedures, filing systems, and administrative tasks', 6, 'exam_wassce', 'cat_wassce_business', 'COD', 1),
('subj_wassce_typewriting', 'Typewriting', 'wassce-typewriting', 'Keyboard', '#94A3B8', 'Keyboard skills and document preparation', 7, 'exam_wassce', 'cat_wassce_business', 'TYP', 1);

-- WASSCE Arts & Humanities (13)
INSERT INTO subjects (id, name, slug, icon, color, description, display_order, exam_type_id, category_id, waec_code, is_active) VALUES
('subj_wassce_literature', 'Literature in English', 'wassce-literature-in-english', 'BookOpen', '#EC4899', 'Study of prose, poetry, and drama in English', 1, 'exam_wassce', 'cat_wassce_arts', 'LIT', 1),
('subj_wassce_government', 'Government', 'wassce-government', 'Landmark', '#EF4444', 'Study of political systems, governance, and citizenship', 2, 'exam_wassce', 'cat_wassce_arts', 'GOV', 1),
('subj_wassce_history', 'History', 'wassce-history', 'Clock', '#F97316', 'Study of past events, particularly West African and world history', 3, 'exam_wassce', 'cat_wassce_arts', 'HIS', 1),
('subj_wassce_crs', 'Christian Religious Studies', 'wassce-christian-religious-studies', 'Church', '#8B5CF6', 'Study of Christian beliefs, practices, and the Bible', 4, 'exam_wassce', 'cat_wassce_arts', 'CRS', 1),
('subj_wassce_irs', 'Islamic Religious Studies', 'wassce-islamic-religious-studies', 'Moon', '#059669', 'Study of Islamic beliefs, practices, and the Quran', 5, 'exam_wassce', 'cat_wassce_arts', 'IRS', 1),
('subj_wassce_geography', 'Geography', 'wassce-geography', 'Map', '#0EA5E9', 'Study of Earth''s physical features and human activities', 6, 'exam_wassce', 'cat_wassce_arts', 'GEO', 1),
('subj_wassce_french', 'French', 'wassce-french', 'Languages', '#3B82F6', 'Proficiency in French language and culture', 7, 'exam_wassce', 'cat_wassce_arts', 'FRE', 1),
('subj_wassce_music', 'Music', 'wassce-music', 'Music', '#A855F7', 'Theory and practice of music, including African and Western traditions', 8, 'exam_wassce', 'cat_wassce_arts', 'MUS', 1),
('subj_wassce_visual_arts', 'Visual Arts', 'wassce-visual-arts', 'Palette', '#F43F5E', 'Drawing, painting, sculpture, and artistic expression', 9, 'exam_wassce', 'cat_wassce_arts', 'VIA', 1),
('subj_wassce_twi', 'Twi', 'wassce-twi', 'MessageCircle', '#84CC16', 'Akan language spoken in Ghana', 10, 'exam_wassce', 'cat_wassce_languages', 'TWI', 1),
('subj_wassce_fante', 'Fante', 'wassce-fante', 'MessageCircle', '#22C55E', 'Akan language spoken in coastal Ghana', 11, 'exam_wassce', 'cat_wassce_languages', 'FAN', 1),
('subj_wassce_ga', 'Ga', 'wassce-ga', 'MessageCircle', '#14B8A6', 'Language spoken in Greater Accra region', 12, 'exam_wassce', 'cat_wassce_languages', 'GA', 1),
('subj_wassce_ewe', 'Ewe', 'wassce-ewe', 'MessageCircle', '#0EA5E9', 'Language spoken in Volta region', 13, 'exam_wassce', 'cat_wassce_languages', 'EWE', 1);

-- WASSCE Technical & Vocational (15)
INSERT INTO subjects (id, name, slug, icon, color, description, display_order, exam_type_id, category_id, waec_code, is_active) VALUES
('subj_wassce_tech_draw', 'Technical Drawing', 'wassce-technical-drawing', 'Ruler', '#6366F1', 'Technical graphics, engineering drawing, and design', 1, 'exam_wassce', 'cat_wassce_technical', 'TED', 1),
('subj_wassce_metalwork', 'Metalwork', 'wassce-metalwork', 'Hammer', '#64748B', 'Working with metals: forging, welding, and fabrication', 2, 'exam_wassce', 'cat_wassce_technical', 'MWK', 1),
('subj_wassce_woodwork', 'Woodwork', 'wassce-woodwork', 'TreeDeciduous', '#92400E', 'Carpentry, joinery, and woodcraft skills', 3, 'exam_wassce', 'cat_wassce_technical', 'WWK', 1),
('subj_wassce_electronics', 'Electronics', 'wassce-electronics', 'Cpu', '#0EA5E9', 'Electronic circuits, components, and systems', 4, 'exam_wassce', 'cat_wassce_technical', 'ELC', 1),
('subj_wassce_auto_mech', 'Auto Mechanics', 'wassce-auto-mechanics', 'Car', '#EF4444', 'Automotive systems, maintenance, and repair', 5, 'exam_wassce', 'cat_wassce_technical', 'AMC', 1),
('subj_wassce_building', 'Building Construction', 'wassce-building-construction', 'Building', '#F97316', 'Construction methods, materials, and techniques', 6, 'exam_wassce', 'cat_wassce_technical', 'BLD', 1),
('subj_wassce_elect_app', 'Applied Electricity', 'wassce-applied-electricity', 'Zap', '#FBBF24', 'Electrical installations, wiring, and maintenance', 7, 'exam_wassce', 'cat_wassce_technical', 'AEL', 1),
('subj_wassce_home_mgmt', 'Management in Living', 'wassce-management-in-living', 'Home', '#EC4899', 'Home economics and household management', 8, 'exam_wassce', 'cat_wassce_technical', 'MIL', 1),
('subj_wassce_foods', 'Foods and Nutrition', 'wassce-foods-and-nutrition', 'UtensilsCrossed', '#F43F5E', 'Food science, nutrition, and meal planning', 9, 'exam_wassce', 'cat_wassce_technical', 'FAN', 1),
('subj_wassce_textiles', 'Clothing and Textiles', 'wassce-clothing-and-textiles', 'Shirt', '#A855F7', 'Textile science, garment construction, and fashion', 10, 'exam_wassce', 'cat_wassce_technical', 'CTX', 1),
('subj_wassce_ict', 'Information & Comm. Technology', 'wassce-ict', 'Monitor', '#3B82F6', 'Computer literacy, programming, and digital skills', 11, 'exam_wassce', 'cat_wassce_technical', 'ICT', 1),
('subj_wassce_picture_making', 'Picture Making', 'wassce-picture-making', 'Camera', '#8B5CF6', 'Photography, graphic design, and visual communication', 12, 'exam_wassce', 'cat_wassce_technical', 'PMK', 1),
('subj_wassce_basketry', 'Basketry', 'wassce-basketry', 'Package', '#92400E', 'Traditional weaving and basket making crafts', 13, 'exam_wassce', 'cat_wassce_technical', 'BSK', 1),
('subj_wassce_leatherwork', 'Leatherwork', 'wassce-leatherwork', 'Wallet', '#78350F', 'Leather crafting and product design', 14, 'exam_wassce', 'cat_wassce_technical', 'LWK', 1),
('subj_wassce_sculpture', 'Sculpture', 'wassce-sculpture', 'Box', '#6B7280', 'Three-dimensional art and sculptural techniques', 15, 'exam_wassce', 'cat_wassce_technical', 'SCL', 1);

-- =============================================
-- BECE SUBJECTS (9 subjects)
-- =============================================

-- BECE Core Subjects (5)
INSERT INTO subjects (id, name, slug, icon, color, description, display_order, exam_type_id, category_id, waec_code, is_active) VALUES
('subj_bece_english', 'English Language', 'bece-english-language', 'Languages', '#3B82F6', 'Foundation in English reading, writing, and communication', 1, 'exam_bece', 'cat_bece_core', 'ENG', 1),
('subj_bece_math', 'Mathematics', 'bece-mathematics', 'Calculator', '#8B5CF6', 'Fundamental mathematical concepts and problem-solving', 2, 'exam_bece', 'cat_bece_core', 'MTH', 1),
('subj_bece_science', 'Integrated Science', 'bece-integrated-science', 'Microscope', '#10B981', 'Basic scientific principles and inquiry skills', 3, 'exam_bece', 'cat_bece_core', 'ISC', 1),
('subj_bece_social', 'Social Studies', 'bece-social-studies', 'Globe', '#F59E0B', 'Understanding Ghanaian society and civic responsibilities', 4, 'exam_bece', 'cat_bece_core', 'SST', 1),
('subj_bece_rme', 'Religious & Moral Education', 'bece-religious-moral-education', 'Heart', '#EC4899', 'Study of religious and moral values', 5, 'exam_bece', 'cat_bece_core', 'RME', 1);

-- BECE Elective Subjects (4)
INSERT INTO subjects (id, name, slug, icon, color, description, display_order, exam_type_id, category_id, waec_code, is_active) VALUES
('subj_bece_gh_lang', 'Ghanaian Language', 'bece-ghanaian-language', 'MessageCircle', '#22C55E', 'Study of a Ghanaian language (Twi, Fante, Ga, Ewe, etc.)', 1, 'exam_bece', 'cat_bece_elective', 'GHL', 1),
('subj_bece_ict', 'Information & Comm. Technology', 'bece-ict', 'Monitor', '#3B82F6', 'Basic computer literacy and digital skills', 2, 'exam_bece', 'cat_bece_elective', 'ICT', 1),
('subj_bece_bdt', 'Basic Design & Technology', 'bece-basic-design-technology', 'Ruler', '#6366F1', 'Creative design, technical skills, and problem-solving', 3, 'exam_bece', 'cat_bece_elective', 'BDT', 1),
('subj_bece_french', 'French', 'bece-french', 'Languages', '#0EA5E9', 'Introduction to French language and culture', 4, 'exam_bece', 'cat_bece_elective', 'FRE', 1);

-- Insert Topics for NSMQ Mathematics
INSERT INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order) VALUES
('topic_algebra', 'subj_nsmq_math', NULL, 'Algebra', 'algebra', 'Fundamental algebraic concepts and operations',
'Algebra is the branch of mathematics dealing with symbols and the rules for manipulating those symbols. It includes solving equations, working with polynomials, and understanding functions.',
'["ax + b = c → x = (c-b)/a", "(a+b)² = a² + 2ab + b²", "(a-b)² = a² - 2ab + b²", "a² - b² = (a+b)(a-b)"]', 1),

('topic_quadratic', 'subj_nsmq_math', 'topic_algebra', 'Quadratic Equations', 'quadratic-equations', 'Solving and graphing quadratic equations',
'A quadratic equation has the standard form ax² + bx + c = 0. Solutions can be found using factoring, completing the square, or the quadratic formula.',
'["x = (-b ± √(b²-4ac)) / 2a", "Sum of roots = -b/a", "Product of roots = c/a", "Discriminant Δ = b² - 4ac"]', 1),

('topic_geometry', 'subj_nsmq_math', NULL, 'Geometry', 'geometry', 'Study of shapes, sizes, and properties of space',
'Geometry deals with the properties, measurement, and relationships of points, lines, angles, surfaces, and solids.',
'["Area of circle = πr²", "Circumference = 2πr", "Area of triangle = ½bh", "Pythagorean theorem: a² + b² = c²"]', 2),

('topic_trigonometry', 'subj_nsmq_math', NULL, 'Trigonometry', 'trigonometry', 'Study of triangles and trigonometric functions',
'Trigonometry studies relationships between side lengths and angles of triangles. The main functions are sine, cosine, and tangent.',
'["sin²θ + cos²θ = 1", "tan θ = sin θ / cos θ", "sin 2θ = 2 sin θ cos θ", "cos 2θ = cos²θ - sin²θ"]', 3),

('topic_calculus', 'subj_nsmq_math', NULL, 'Calculus', 'calculus', 'Study of rates of change and accumulation',
'Calculus is the mathematical study of continuous change. It has two major branches: differential calculus and integral calculus.',
'["d/dx(xⁿ) = nxⁿ⁻¹", "∫xⁿdx = xⁿ⁺¹/(n+1) + C", "d/dx(sin x) = cos x", "d/dx(eˣ) = eˣ"]', 4),

('topic_statistics', 'subj_nsmq_math', NULL, 'Statistics & Probability', 'statistics-probability', 'Analysis of data and chance',
'Statistics involves collecting, analyzing, and interpreting data. Probability measures the likelihood of events occurring.',
'["Mean = Σx/n", "Variance = Σ(x-μ)²/n", "P(A∪B) = P(A) + P(B) - P(A∩B)", "P(A|B) = P(A∩B)/P(B)"]', 5);

-- Insert Topics for Physics
INSERT INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order) VALUES
('topic_mechanics', 'subj_nsmq_physics', NULL, 'Mechanics', 'mechanics', 'Study of motion and forces',
'Mechanics is the branch of physics dealing with motion and the forces that produce motion. It includes kinematics, dynamics, and statics.',
'["v = u + at", "s = ut + ½at²", "v² = u² + 2as", "F = ma"]', 1),

('topic_kinematics', 'subj_nsmq_physics', 'topic_mechanics', 'Kinematics', 'kinematics', 'Description of motion without considering forces',
'Kinematics describes motion using concepts of displacement, velocity, and acceleration without reference to the forces causing the motion.',
'["Average velocity = Δs/Δt", "Instantaneous velocity = ds/dt", "Acceleration = dv/dt", "Range = u²sin2θ/g"]', 1),

('topic_electricity', 'subj_nsmq_physics', NULL, 'Electricity & Magnetism', 'electricity-magnetism', 'Study of electric charges and magnetic fields',
'This branch covers electric charges, electric fields, magnetic fields, and electromagnetic interactions.',
'["V = IR (Ohm''s Law)", "P = IV = I²R", "F = qE", "F = BIL"]', 2),

('topic_waves', 'subj_nsmq_physics', NULL, 'Waves & Optics', 'waves-optics', 'Study of wave motion and light',
'Waves transfer energy without transferring matter. Optics is the study of light behavior including reflection, refraction, and diffraction.',
'["v = fλ", "n = c/v", "n₁sinθ₁ = n₂sinθ₂ (Snell''s Law)", "1/f = 1/u + 1/v"]', 3),

('topic_thermodynamics', 'subj_nsmq_physics', NULL, 'Thermodynamics', 'thermodynamics', 'Study of heat and energy transfer',
'Thermodynamics studies the relationships between heat, work, temperature, and energy in physical systems.',
'["Q = mcΔT", "PV = nRT", "W = PΔV", "Efficiency = W/Q_in"]', 4),

('topic_modern_physics', 'subj_nsmq_physics', NULL, 'Modern Physics', 'modern-physics', 'Quantum mechanics and relativity',
'Modern physics covers theories developed in the 20th century including quantum mechanics, special relativity, and atomic physics.',
'["E = mc²", "E = hf", "λ = h/mv", "ΔxΔp ≥ ℏ/2"]', 5);

-- Insert Topics for Chemistry
INSERT INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order) VALUES
('topic_atomic', 'subj_nsmq_chemistry', NULL, 'Atomic Structure', 'atomic-structure', 'Structure of atoms and electron configuration',
'Atoms consist of protons, neutrons, and electrons. Understanding electron configuration is key to predicting chemical behavior.',
'["Mass number A = Z + N", "E = -13.6/n² eV (hydrogen)", "λ = h/mv (de Broglie)"]', 1),

('topic_bonding', 'subj_nsmq_chemistry', NULL, 'Chemical Bonding', 'chemical-bonding', 'How atoms combine to form compounds',
'Chemical bonds form when atoms share or transfer electrons. Main types include ionic, covalent, and metallic bonds.',
'["Bond order = (bonding e⁻ - antibonding e⁻)/2", "Electronegativity difference determines bond type"]', 2),

('topic_stoichiometry', 'subj_nsmq_chemistry', NULL, 'Stoichiometry', 'stoichiometry', 'Quantitative relationships in chemical reactions',
'Stoichiometry involves calculating the quantities of reactants and products in chemical reactions using balanced equations.',
'["n = m/M", "Molarity M = n/V", "PV = nRT", "% yield = (actual/theoretical) × 100"]', 3),

('topic_equilibrium', 'subj_nsmq_chemistry', NULL, 'Chemical Equilibrium', 'chemical-equilibrium', 'Balance in reversible reactions',
'Chemical equilibrium occurs when the rates of forward and reverse reactions are equal. Le Chatelier''s principle predicts equilibrium shifts.',
'["Kc = [products]/[reactants]", "Kp = Kc(RT)^Δn", "ΔG = -RT ln K"]', 4),

('topic_organic', 'subj_nsmq_chemistry', NULL, 'Organic Chemistry', 'organic-chemistry', 'Chemistry of carbon compounds',
'Organic chemistry studies carbon-containing compounds. It covers nomenclature, reactions, and properties of organic molecules.',
'["CₙH₂ₙ₊₂ (alkanes)", "CₙH₂ₙ (alkenes)", "CₙH₂ₙ₋₂ (alkynes)"]', 5),

('topic_electrochemistry', 'subj_nsmq_chemistry', NULL, 'Electrochemistry', 'electrochemistry', 'Chemical reactions involving electricity',
'Electrochemistry studies the relationship between electrical energy and chemical changes, including batteries and electrolysis.',
'["E°cell = E°cathode - E°anode", "ΔG = -nFE°", "Faraday''s laws"]', 6);

-- Insert Topics for Biology
INSERT INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order) VALUES
('topic_cells', 'subj_nsmq_biology', NULL, 'Cell Biology', 'cell-biology', 'Structure and function of cells',
'The cell is the basic unit of life. Understanding cell structure and organelle functions is fundamental to biology.',
'["Cell theory", "Prokaryotic vs Eukaryotic", "Organelle functions"]', 1),

('topic_genetics', 'subj_nsmq_biology', NULL, 'Genetics', 'genetics', 'Study of heredity and variation',
'Genetics studies how traits are passed from parents to offspring through genes and DNA.',
'["Mendel''s laws", "Punnett squares", "DNA structure: A-T, G-C"]', 2),

('topic_ecology', 'subj_nsmq_biology', NULL, 'Ecology', 'ecology', 'Study of organisms and their environment',
'Ecology examines the relationships between organisms and their environment, including ecosystems and biodiversity.',
'["Food chains/webs", "Energy flow (10% rule)", "Population dynamics"]', 3),

('topic_physiology', 'subj_nsmq_biology', NULL, 'Human Physiology', 'human-physiology', 'Functions of the human body',
'Human physiology studies how the body''s organ systems work together to maintain life and health.',
'["Homeostasis", "Nervous system", "Circulatory system", "Respiratory system"]', 4),

('topic_biochemistry', 'subj_nsmq_biology', NULL, 'Biochemistry', 'biochemistry', 'Chemical processes in living organisms',
'Biochemistry explores the chemical reactions that occur within living cells, including metabolism and enzyme function.',
'["ATP → ADP + P + energy", "Photosynthesis: 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂", "Cellular respiration"]', 5);

-- Insert Sample Questions for Mathematics (Round 1 - Fundamentals)
INSERT INTO questions (id, topic_id, subject_id, question_text, question_type, round_type, options, correct_answer, explanation, difficulty, points, time_limit) VALUES
('q_math_001', 'topic_quadratic', 'subj_nsmq_math', 'Solve for x: x² - 5x + 6 = 0', 'direct_answer', 'round_one', NULL, 'x = 2 or x = 3', 'Factoring: (x-2)(x-3) = 0, so x = 2 or x = 3', 'easy', 3, 30),

('q_math_002', 'topic_quadratic', 'subj_nsmq_math', 'What is the discriminant of 2x² + 3x - 5 = 0?', 'direct_answer', 'round_one', NULL, '49', 'Δ = b² - 4ac = 9 - 4(2)(-5) = 9 + 40 = 49', 'medium', 3, 30),

('q_math_003', 'topic_geometry', 'subj_nsmq_math', 'A circle has radius 7 cm. What is its area?', 'direct_answer', 'round_one', NULL, '49π cm² or approximately 153.94 cm²', 'Area = πr² = π(7)² = 49π ≈ 153.94 cm²', 'easy', 3, 30),

('q_math_004', 'topic_trigonometry', 'subj_nsmq_math', 'If sin θ = 3/5, what is cos θ? (θ is acute)', 'direct_answer', 'round_one', NULL, '4/5', 'Using sin²θ + cos²θ = 1: cos²θ = 1 - 9/25 = 16/25, so cos θ = 4/5', 'medium', 3, 30),

('q_math_005', 'topic_calculus', 'subj_nsmq_math', 'Find d/dx(x³ + 2x² - 5x + 3)', 'direct_answer', 'round_one', NULL, '3x² + 4x - 5', 'Applying power rule: d/dx(xⁿ) = nxⁿ⁻¹', 'medium', 3, 30);

-- Insert Sample Questions for Physics (Round 1)
INSERT INTO questions (id, topic_id, subject_id, question_text, question_type, round_type, options, correct_answer, explanation, difficulty, points, time_limit) VALUES
('q_phys_001', 'topic_kinematics', 'subj_nsmq_physics', 'A car accelerates from rest at 2 m/s² for 5 seconds. What is its final velocity?', 'direct_answer', 'round_one', NULL, '10 m/s', 'Using v = u + at: v = 0 + (2)(5) = 10 m/s', 'easy', 3, 30),

('q_phys_002', 'topic_mechanics', 'subj_nsmq_physics', 'A 10 kg object experiences a net force of 20 N. What is its acceleration?', 'direct_answer', 'round_one', NULL, '2 m/s²', 'Using F = ma: a = F/m = 20/10 = 2 m/s²', 'easy', 3, 30),

('q_phys_003', 'topic_electricity', 'subj_nsmq_physics', 'A 12V battery is connected to a 4Ω resistor. What current flows?', 'direct_answer', 'round_one', NULL, '3 A', 'Using Ohm''s Law V = IR: I = V/R = 12/4 = 3 A', 'easy', 3, 30),

('q_phys_004', 'topic_waves', 'subj_nsmq_physics', 'Light travels from air (n=1) into glass (n=1.5) at 30°. What is the angle of refraction?', 'direct_answer', 'round_one', NULL, '19.5° (approximately)', 'Using Snell''s Law: sin30°/sin r = 1.5, sin r = 0.333, r ≈ 19.5°', 'medium', 3, 30),

('q_phys_005', 'topic_thermodynamics', 'subj_nsmq_physics', 'How much heat is needed to raise 2 kg of water by 10°C? (c = 4200 J/kg°C)', 'direct_answer', 'round_one', NULL, '84,000 J or 84 kJ', 'Q = mcΔT = 2 × 4200 × 10 = 84,000 J', 'medium', 3, 30);

-- Insert Sample Questions for Chemistry (Round 1)
INSERT INTO questions (id, topic_id, subject_id, question_text, question_type, round_type, options, correct_answer, explanation, difficulty, points, time_limit) VALUES
('q_chem_001', 'topic_atomic', 'subj_nsmq_chemistry', 'How many protons, neutrons, and electrons are in ²³Na (sodium-23)?', 'direct_answer', 'round_one', NULL, '11 protons, 12 neutrons, 11 electrons', 'Na has atomic number 11, so 11 protons and electrons. Neutrons = 23 - 11 = 12', 'easy', 3, 30),

('q_chem_002', 'topic_stoichiometry', 'subj_nsmq_chemistry', 'What is the molar mass of H₂SO₄?', 'direct_answer', 'round_one', NULL, '98 g/mol', 'H₂SO₄: 2(1) + 32 + 4(16) = 2 + 32 + 64 = 98 g/mol', 'easy', 3, 30),

('q_chem_003', 'topic_bonding', 'subj_nsmq_chemistry', 'What type of bond forms between sodium and chlorine?', 'direct_answer', 'round_one', NULL, 'Ionic bond', 'Sodium (metal) transfers an electron to chlorine (non-metal), forming Na⁺ and Cl⁻ ions', 'easy', 3, 30),

('q_chem_004', 'topic_equilibrium', 'subj_nsmq_chemistry', 'For the reaction N₂ + 3H₂ ⇌ 2NH₃, write the expression for Kc', 'direct_answer', 'round_one', NULL, 'Kc = [NH₃]²/([N₂][H₂]³)', 'Products over reactants, each raised to their stoichiometric coefficient', 'medium', 3, 30),

('q_chem_005', 'topic_organic', 'subj_nsmq_chemistry', 'What is the IUPAC name of CH₃CH₂CH₂OH?', 'direct_answer', 'round_one', NULL, 'Propan-1-ol or 1-propanol', '3-carbon alcohol with OH on carbon 1', 'medium', 3, 30);

-- Insert Sample Questions for Biology (Round 1)
INSERT INTO questions (id, topic_id, subject_id, question_text, question_type, round_type, options, correct_answer, explanation, difficulty, points, time_limit) VALUES
('q_bio_001', 'topic_cells', 'subj_nsmq_biology', 'What organelle is responsible for ATP production in eukaryotic cells?', 'direct_answer', 'round_one', NULL, 'Mitochondria', 'Mitochondria are the powerhouse of the cell, producing ATP through cellular respiration', 'easy', 3, 30),

('q_bio_002', 'topic_genetics', 'subj_nsmq_biology', 'In humans, what is the diploid chromosome number?', 'direct_answer', 'round_one', NULL, '46', 'Humans have 23 pairs of chromosomes, totaling 46 chromosomes in diploid cells', 'easy', 3, 30),

('q_bio_003', 'topic_genetics', 'subj_nsmq_biology', 'If a pea plant with genotype Tt is crossed with tt, what percentage of offspring will be tall?', 'direct_answer', 'round_one', NULL, '50%', 'Tt × tt gives Tt and tt in 1:1 ratio, so 50% will be tall (Tt)', 'medium', 3, 30),

('q_bio_004', 'topic_ecology', 'subj_nsmq_biology', 'What percentage of energy is typically transferred between trophic levels?', 'direct_answer', 'round_one', NULL, '10%', 'The 10% rule states that only about 10% of energy is passed to the next trophic level', 'easy', 3, 30),

('q_bio_005', 'topic_biochemistry', 'subj_nsmq_biology', 'What is the net ATP yield from glycolysis?', 'direct_answer', 'round_one', NULL, '2 ATP', 'Glycolysis produces 4 ATP but uses 2 ATP, giving a net yield of 2 ATP', 'medium', 3, 30);

-- Insert Speed Race Questions (Round 2)
INSERT INTO questions (id, topic_id, subject_id, question_text, question_type, round_type, options, correct_answer, explanation, difficulty, points, time_limit) VALUES
('q_speed_001', 'topic_algebra', 'subj_nsmq_math', 'What is 15² ?', 'direct_answer', 'speed_race', NULL, '225', '15 × 15 = 225', 'easy', 3, 10),
('q_speed_002', 'topic_algebra', 'subj_nsmq_math', 'Simplify: √144 + √81', 'direct_answer', 'speed_race', NULL, '21', '12 + 9 = 21', 'easy', 3, 10),
('q_speed_003', 'topic_mechanics', 'subj_nsmq_physics', 'What is the SI unit of force?', 'direct_answer', 'speed_race', NULL, 'Newton (N)', 'Force is measured in Newtons', 'easy', 3, 10),
('q_speed_004', 'topic_atomic', 'subj_nsmq_chemistry', 'What is the chemical symbol for gold?', 'direct_answer', 'speed_race', NULL, 'Au', 'From Latin "aurum"', 'easy', 3, 10),
('q_speed_005', 'topic_cells', 'subj_nsmq_biology', 'What is the process by which plants make food using sunlight?', 'direct_answer', 'speed_race', NULL, 'Photosynthesis', 'Plants use light energy to convert CO₂ and H₂O into glucose', 'easy', 3, 10),
('q_speed_006', 'topic_trigonometry', 'subj_nsmq_math', 'What is sin 30°?', 'direct_answer', 'speed_race', NULL, '0.5 or 1/2', 'sin 30° = 1/2', 'easy', 3, 10),
('q_speed_007', 'topic_waves', 'subj_nsmq_physics', 'What is the speed of light in vacuum?', 'direct_answer', 'speed_race', NULL, '3 × 10⁸ m/s or 300,000 km/s', 'Light travels at approximately 3 × 10⁸ m/s', 'easy', 3, 10),
('q_speed_008', 'topic_stoichiometry', 'subj_nsmq_chemistry', 'What is Avogadro''s number?', 'direct_answer', 'speed_race', NULL, '6.02 × 10²³', 'One mole contains 6.02 × 10²³ particles', 'easy', 3, 10);

-- Insert True/False Questions (Round 4)
INSERT INTO questions (id, topic_id, subject_id, question_text, question_type, round_type, options, correct_answer, explanation, difficulty, points, time_limit) VALUES
('q_tf_001', 'topic_geometry', 'subj_nsmq_math', 'The sum of interior angles of a hexagon is 720°', 'true_false', 'true_false', NULL, 'True', 'Sum = (n-2) × 180° = (6-2) × 180° = 720°', 'easy', 2, 30),
('q_tf_002', 'topic_calculus', 'subj_nsmq_math', 'The derivative of e^x is e^x', 'true_false', 'true_false', NULL, 'True', 'd/dx(eˣ) = eˣ is a unique property of the exponential function', 'easy', 2, 10),
('q_tf_003', 'topic_electricity', 'subj_nsmq_physics', 'In a series circuit, the current is the same through all components', 'true_false', 'true_false', NULL, 'True', 'Current is constant in series; voltage divides', 'easy', 2, 10),
('q_tf_004', 'topic_thermodynamics', 'subj_nsmq_physics', 'Heat always flows from cold to hot objects', 'true_false', 'true_false', NULL, 'False', 'Heat naturally flows from hot to cold; the reverse requires work', 'easy', 2, 10),
('q_tf_005', 'topic_bonding', 'subj_nsmq_chemistry', 'Ionic compounds conduct electricity when dissolved in water', 'true_false', 'true_false', NULL, 'True', 'When dissolved, ions are free to move and carry charge', 'easy', 2, 10),
('q_tf_006', 'topic_organic', 'subj_nsmq_chemistry', 'All organic compounds must contain carbon and hydrogen only', 'true_false', 'true_false', NULL, 'False', 'Organic compounds contain carbon but can also have O, N, S, etc.', 'easy', 2, 10),
('q_tf_007', 'topic_genetics', 'subj_nsmq_biology', 'DNA replication is semi-conservative', 'true_false', 'true_false', NULL, 'True', 'Each new DNA molecule contains one original strand and one new strand', 'easy', 2, 10),
('q_tf_008', 'topic_ecology', 'subj_nsmq_biology', 'Producers form the base of all food chains', 'true_false', 'true_false', NULL, 'True', 'Producers (autotrophs) convert energy and form the first trophic level', 'easy', 2, 10);

-- Insert Riddles (Round 5)
INSERT INTO riddles (id, subject_id, answer, clue_1, clue_2, clue_3, clue_4, clue_5, difficulty) VALUES
('riddle_001', 'subj_nsmq_math', 'Pi (π)',
'I am a number that never ends and never repeats',
'I am the ratio of a circle''s circumference to its diameter',
'My first digits are 3.14159...',
'I am named after a Greek letter',
'I am approximately 22/7',
'medium'),

('riddle_002', 'subj_nsmq_physics', 'Black hole',
'I am a region in space from which nothing can escape',
'I am formed when massive stars collapse',
'Light cannot escape my grasp',
'I have an event horizon',
'Stephen Hawking studied me extensively',
'medium'),

('riddle_003', 'subj_nsmq_chemistry', 'Oxygen',
'I am essential for combustion',
'I make up about 21% of Earth''s atmosphere',
'I was discovered by Joseph Priestley',
'I am produced by photosynthesis',
'My atomic number is 8',
'easy'),

('riddle_004', 'subj_nsmq_biology', 'DNA',
'I am a double helix',
'I carry genetic information',
'Watson and Crick discovered my structure',
'I am found in the nucleus of cells',
'I am made of nucleotides containing A, T, G, and C',
'easy'),

('riddle_005', 'subj_nsmq_math', 'Zero',
'I am neither positive nor negative',
'I am the additive identity',
'Any number multiplied by me gives me',
'I was invented in ancient India',
'Division by me is undefined',
'easy'),

('riddle_006', 'subj_nsmq_physics', 'Gravity',
'I am one of the four fundamental forces',
'I am the weakest of these forces',
'I keep planets in orbit',
'Newton described me with an apple story',
'Einstein explained me as curved spacetime',
'easy'),

('riddle_007', 'subj_nsmq_chemistry', 'Water',
'I am called the universal solvent',
'I have a bent molecular shape',
'I am densest at 4°C',
'My chemical formula has three atoms',
'I am essential for all known life',
'easy'),

('riddle_008', 'subj_nsmq_biology', 'Mitochondria',
'I am known as the powerhouse of the cell',
'I have my own DNA',
'I produce ATP through cellular respiration',
'I have a double membrane',
'I may have once been a free-living bacterium',
'medium'),

('riddle_009', 'subj_nsmq_math', 'Fibonacci sequence',
'I am a sequence where each number is the sum of the two preceding ones',
'I start with 0 and 1',
'I appear in nature in spiral patterns',
'I was introduced to Europe by an Italian mathematician',
'My ratio approaches the golden ratio',
'hard'),

('riddle_010', 'subj_nsmq_physics', 'Photon',
'I am a quantum of light',
'I have no mass but carry energy',
'I travel at the fastest speed possible in the universe',
'Einstein explained the photoelectric effect using me',
'I exhibit wave-particle duality',
'medium');

-- Insert Achievements
INSERT INTO achievements (id, name, description, icon, requirement_type, requirement_value, xp_reward) VALUES
('ach_first_steps', 'First Steps', 'Answer your first question', 'Footprints', 'questions_answered', 1, 50),
('ach_scholar', 'Scholar', 'Answer 100 questions', 'GraduationCap', 'questions_answered', 100, 200),
('ach_master', 'Quiz Master', 'Answer 500 questions', 'Crown', 'questions_answered', 500, 500),
('ach_streak_3', 'Getting Started', 'Maintain a 3-day streak', 'Flame', 'streak_days', 3, 100),
('ach_streak_7', 'Week Warrior', 'Maintain a 7-day streak', 'Flame', 'streak_days', 7, 250),
('ach_streak_30', 'Monthly Master', 'Maintain a 30-day streak', 'Flame', 'streak_days', 30, 1000),
('ach_mastery_1', 'Topic Explorer', 'Master your first topic (80%+)', 'Star', 'mastery_level', 1, 150),
('ach_mastery_10', 'Knowledge Seeker', 'Master 10 topics', 'Stars', 'mastery_level', 10, 500),
('ach_xp_1000', 'Rising Star', 'Earn 1000 XP', 'TrendingUp', 'xp_earned', 1000, 100),
('ach_xp_10000', 'Superstar', 'Earn 10000 XP', 'Award', 'xp_earned', 10000, 500),
('ach_perfect', 'Perfectionist', 'Get a perfect round (all correct)', 'Target', 'perfect_rounds', 1, 300),
('ach_speed_demon', 'Speed Demon', 'Answer 10 speed questions in under 5 seconds each', 'Zap', 'speed_record', 10, 400);

-- Insert default Houses
INSERT INTO houses (id, name, color, icon, description, is_default) VALUES
('house_blue', 'Blue House', '#3B82F6', 'shield', 'The house of wisdom and intellect', 1),
('house_red', 'Red House', '#EF4444', 'shield', 'The house of courage and determination', 1),
('house_green', 'Green House', '#22C55E', 'shield', 'The house of growth and harmony', 1),
('house_yellow', 'Yellow House', '#EAB308', 'shield', 'The house of energy and optimism', 1);

-- Insert demo users for testing
-- Note: Password hashes need to be generated at runtime using the API's hashPassword function
-- Run the /api/admin/setup endpoint after deployment to create these users with proper hashes
-- Or use: INSERT INTO users ... with password_hash set to NULL, then use set-password flow

-- Demo users placeholder (passwords will be set via the setup endpoint)
INSERT OR IGNORE INTO users (id, email, password_hash, name, role, status, is_active, email_verified, xp_points, level, streak_days, ai_grading_credits) VALUES
('admin_1', 'admin@brillaprep.org', NULL, 'System Admin', 'admin', 'approved', 1, 1, 0, 1, 0, 100),
('teacher_1', 'teacher@brillaprep.org', NULL, 'Demo Teacher', 'teacher', 'approved', 1, 1, 0, 1, 0, 50),
('student_1', 'student@brillaprep.org', NULL, 'Demo Student', 'student', 'approved', 1, 1, 1500, 5, 7, 10),
('parent_1', 'parent@brillaprep.org', NULL, 'Demo Parent', 'parent', 'approved', 1, 1, 0, 1, 0, 0);
