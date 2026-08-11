-- Migration: Complete WASSCE Subject Categories and Subjects
-- This migration adds missing WASSCE subject categories, subjects, topics, and questions

-- =============================================
-- STEP 1: Add missing WASSCE subject categories
-- =============================================

INSERT OR IGNORE INTO subject_categories (id, exam_type_id, name, slug, description, is_core, display_order, created_at)
VALUES
  ('cat_wassce_core', 'exam_wassce', 'Core Subjects', 'core', 'Compulsory subjects for all WASSCE candidates', 1, 1, datetime('now')),
  ('cat_wassce_business', 'exam_wassce', 'Business', 'business', 'Business and commercial subjects', 0, 3, datetime('now')),
  ('cat_wassce_arts', 'exam_wassce', 'Arts & Humanities', 'arts', 'Arts, humanities, and social science electives', 0, 4, datetime('now')),
  ('cat_wassce_technical', 'exam_wassce', 'Technical & Vocational', 'technical', 'Technical and vocational subjects', 0, 5, datetime('now')),
  ('cat_wassce_languages', 'exam_wassce', 'Languages', 'languages', 'Ghanaian and foreign languages', 0, 6, datetime('now'));

-- =============================================
-- STEP 2: Add missing WASSCE subjects
-- =============================================

-- Business subjects
INSERT OR IGNORE INTO subjects (id, name, slug, icon, color, description, display_order, created_at)
VALUES
  ('subj_wassce_business_mgt', 'Business Management', 'business-management', 'Briefcase', '#F97316', 'Management principles, marketing, business organization', 3, datetime('now')),
  ('subj_wassce_cost_accounting', 'Cost Accounting', 'cost-accounting', 'PiggyBank', '#EC4899', 'Cost analysis, budgeting, cost control', 4, datetime('now'));

-- Arts subjects
INSERT OR IGNORE INTO subjects (id, name, slug, icon, color, description, display_order, created_at)
VALUES
  ('subj_wassce_history', 'History', 'history', 'Clock', '#78716C', 'West African history, world history, historical analysis', 3, datetime('now'));

-- Technical subjects
INSERT OR IGNORE INTO subjects (id, name, slug, icon, color, description, display_order, created_at)
VALUES
  ('subj_wassce_ict', 'ICT', 'ict', 'Monitor', '#06B6D4', 'Computer fundamentals, programming, applications', 1, datetime('now')),
  ('subj_wassce_tech_drawing', 'Technical Drawing', 'technical-drawing', 'Ruler', '#475569', 'Engineering drawing, projections, CAD basics', 2, datetime('now')),
  ('subj_wassce_foods', 'Foods and Nutrition', 'foods-nutrition', 'UtensilsCrossed', '#EA580C', 'Nutrition, food preparation, meal planning', 3, datetime('now'));

-- Language subjects
INSERT OR IGNORE INTO subjects (id, name, slug, icon, color, description, display_order, created_at)
VALUES
  ('subj_wassce_french', 'French', 'french', 'Globe2', '#2563EB', 'French language and culture', 1, datetime('now')),
  ('subj_wassce_twi', 'Twi (Asante)', 'twi', 'MessageCircle', '#059669', 'Twi language, literature, and culture', 2, datetime('now'));

-- =============================================
-- STEP 3: Add topics for Business Management
-- =============================================

INSERT OR IGNORE INTO topics (id, subject_id, name, slug, description, display_order, created_at)
VALUES
  ('topic_bm_intro', 'subj_wassce_business_mgt', 'Introduction to Business', 'introduction-to-business', 'Nature of business, types of business organizations', 1, datetime('now')),
  ('topic_bm_management', 'subj_wassce_business_mgt', 'Management Principles', 'management-principles', 'Planning, organizing, leading, and controlling', 2, datetime('now')),
  ('topic_bm_marketing', 'subj_wassce_business_mgt', 'Marketing', 'marketing', 'Marketing mix, market research, consumer behavior', 3, datetime('now')),
  ('topic_bm_hr', 'subj_wassce_business_mgt', 'Human Resource Management', 'human-resource-management', 'Recruitment, training, motivation, compensation', 4, datetime('now')),
  ('topic_bm_finance', 'subj_wassce_business_mgt', 'Business Finance', 'business-finance', 'Sources of finance, working capital management', 5, datetime('now')),
  ('topic_bm_production', 'subj_wassce_business_mgt', 'Production Management', 'production-management', 'Production planning, quality control, inventory management', 6, datetime('now')),
  ('topic_bm_office', 'subj_wassce_business_mgt', 'Office Practice', 'office-practice', 'Office organization, communication, filing systems', 7, datetime('now')),
  ('topic_bm_ethics', 'subj_wassce_business_mgt', 'Business Ethics', 'business-ethics', 'Corporate social responsibility, ethical decision making', 8, datetime('now'));

-- =============================================
-- STEP 4: Add topics for Cost Accounting
-- =============================================

INSERT OR IGNORE INTO topics (id, subject_id, name, slug, description, display_order, created_at)
VALUES
  ('topic_ca_intro', 'subj_wassce_cost_accounting', 'Introduction to Cost Accounting', 'introduction-to-cost-accounting', 'Nature and scope of cost accounting', 1, datetime('now')),
  ('topic_ca_elements', 'subj_wassce_cost_accounting', 'Elements of Cost', 'elements-of-cost', 'Materials, labor, and overhead costs', 2, datetime('now')),
  ('topic_ca_materials', 'subj_wassce_cost_accounting', 'Material Costing', 'material-costing', 'Material control, pricing methods, stock valuation', 3, datetime('now')),
  ('topic_ca_labor', 'subj_wassce_cost_accounting', 'Labor Costing', 'labor-costing', 'Wage systems, labor turnover, efficiency ratios', 4, datetime('now')),
  ('topic_ca_overhead', 'subj_wassce_cost_accounting', 'Overhead Costing', 'overhead-costing', 'Allocation, apportionment, absorption of overheads', 5, datetime('now')),
  ('topic_ca_budgeting', 'subj_wassce_cost_accounting', 'Budgeting', 'budgeting', 'Budget preparation, flexible budgets, variance analysis', 6, datetime('now')),
  ('topic_ca_costing', 'subj_wassce_cost_accounting', 'Costing Methods', 'costing-methods', 'Job costing, process costing, marginal costing', 7, datetime('now'));

-- =============================================
-- STEP 5: Add topics for History
-- =============================================

INSERT OR IGNORE INTO topics (id, subject_id, name, slug, description, display_order, created_at)
VALUES
  ('topic_hist_wa_precolonial', 'subj_wassce_history', 'Pre-Colonial West Africa', 'pre-colonial-west-africa', 'Major kingdoms, empires, and societies before European contact', 1, datetime('now')),
  ('topic_hist_wa_colonial', 'subj_wassce_history', 'Colonial Period', 'colonial-period', 'European imperialism, colonial administration, resistance movements', 2, datetime('now')),
  ('topic_hist_nationalism', 'subj_wassce_history', 'African Nationalism', 'african-nationalism', 'Rise of nationalism, independence movements, key leaders', 3, datetime('now')),
  ('topic_hist_ghana', 'subj_wassce_history', 'History of Ghana', 'history-of-ghana', 'Gold Coast to Ghana, political developments, notable figures', 4, datetime('now')),
  ('topic_hist_nigeria', 'subj_wassce_history', 'History of Nigeria', 'history-of-nigeria', 'Nigerian history from pre-colonial to independence', 5, datetime('now')),
  ('topic_hist_postcolonial', 'subj_wassce_history', 'Post-Colonial Africa', 'post-colonial-africa', 'Challenges of independence, coups, democratization', 6, datetime('now')),
  ('topic_hist_world1', 'subj_wassce_history', 'World History: WWI & WWII', 'world-history-wars', 'Causes and effects of World Wars, African involvement', 7, datetime('now')),
  ('topic_hist_world2', 'subj_wassce_history', 'World History: Cold War', 'world-history-cold-war', 'Cold War impact on Africa, Non-Aligned Movement', 8, datetime('now')),
  ('topic_hist_ecowas', 'subj_wassce_history', 'ECOWAS and Regional Integration', 'ecowas-regional-integration', 'Formation of ECOWAS, regional cooperation, challenges', 9, datetime('now')),
  ('topic_hist_au', 'subj_wassce_history', 'OAU/African Union', 'oau-african-union', 'Pan-Africanism, OAU formation, transition to AU', 10, datetime('now'));

-- =============================================
-- STEP 6: Add topics for ICT
-- =============================================

INSERT OR IGNORE INTO topics (id, subject_id, name, slug, description, display_order, created_at)
VALUES
  ('topic_ict_fundamentals', 'subj_wassce_ict', 'Computer Fundamentals', 'computer-fundamentals', 'Computer components, types, generations of computers', 1, datetime('now')),
  ('topic_ict_software', 'subj_wassce_ict', 'Software Concepts', 'software-concepts', 'System software, application software, software development', 2, datetime('now')),
  ('topic_ict_hardware', 'subj_wassce_ict', 'Computer Hardware', 'computer-hardware', 'Input, output, storage devices, processors', 3, datetime('now')),
  ('topic_ict_networking', 'subj_wassce_ict', 'Networking', 'networking', 'Network types, protocols, internet basics', 4, datetime('now')),
  ('topic_ict_internet', 'subj_wassce_ict', 'Internet and Web', 'internet-and-web', 'Web browsing, email, online services, cybersecurity', 5, datetime('now')),
  ('topic_ict_wordproc', 'subj_wassce_ict', 'Word Processing', 'word-processing', 'Document creation, formatting, mail merge', 6, datetime('now')),
  ('topic_ict_spreadsheet', 'subj_wassce_ict', 'Spreadsheets', 'spreadsheets', 'Data entry, formulas, charts, data analysis', 7, datetime('now')),
  ('topic_ict_database', 'subj_wassce_ict', 'Database Management', 'database-management', 'Database concepts, queries, data organization', 8, datetime('now'));

-- =============================================
-- STEP 7: Add topics for Technical Drawing
-- =============================================

INSERT OR IGNORE INTO topics (id, subject_id, name, slug, description, display_order, created_at)
VALUES
  ('topic_td_basics', 'subj_wassce_tech_drawing', 'Drawing Basics', 'drawing-basics', 'Equipment, lettering, lines, scales', 1, datetime('now')),
  ('topic_td_geometry', 'subj_wassce_tech_drawing', 'Geometric Constructions', 'geometric-constructions', 'Angles, polygons, circles, tangents', 2, datetime('now')),
  ('topic_td_orthographic', 'subj_wassce_tech_drawing', 'Orthographic Projection', 'orthographic-projection', 'First and third angle projection, views', 3, datetime('now')),
  ('topic_td_isometric', 'subj_wassce_tech_drawing', 'Pictorial Drawing', 'pictorial-drawing', 'Isometric, oblique, perspective drawings', 4, datetime('now')),
  ('topic_td_sections', 'subj_wassce_tech_drawing', 'Sections and Developments', 'sections-and-developments', 'Sectional views, surface development', 5, datetime('now')),
  ('topic_td_building', 'subj_wassce_tech_drawing', 'Building Drawing', 'building-drawing', 'Floor plans, elevations, foundation plans', 6, datetime('now')),
  ('topic_td_machine', 'subj_wassce_tech_drawing', 'Machine Drawing', 'machine-drawing', 'Threads, fasteners, machine elements', 7, datetime('now'));

-- =============================================
-- STEP 8: Add topics for Foods and Nutrition
-- =============================================

INSERT OR IGNORE INTO topics (id, subject_id, name, slug, description, display_order, created_at)
VALUES
  ('topic_fn_nutrients', 'subj_wassce_foods', 'Nutrients', 'nutrients', 'Carbohydrates, proteins, fats, vitamins, minerals, water', 1, datetime('now')),
  ('topic_fn_digestion', 'subj_wassce_foods', 'Digestion and Absorption', 'digestion-absorption', 'Digestive system, nutrient absorption, metabolism', 2, datetime('now')),
  ('topic_fn_meal_planning', 'subj_wassce_foods', 'Meal Planning', 'meal-planning', 'Balanced diet, meal patterns, menu planning', 3, datetime('now')),
  ('topic_fn_food_prep', 'subj_wassce_foods', 'Food Preparation', 'food-preparation', 'Cooking methods, food processing, preservation', 4, datetime('now')),
  ('topic_fn_food_safety', 'subj_wassce_foods', 'Food Safety and Hygiene', 'food-safety-hygiene', 'Food contamination, storage, kitchen hygiene', 5, datetime('now')),
  ('topic_fn_special_diets', 'subj_wassce_foods', 'Special Diets', 'special-diets', 'Dietary needs for different age groups and conditions', 6, datetime('now')),
  ('topic_fn_food_science', 'subj_wassce_foods', 'Food Science', 'food-science', 'Food additives, food laws, food technology', 7, datetime('now')),
  ('topic_fn_catering', 'subj_wassce_foods', 'Catering', 'catering', 'Types of catering, equipment, service styles', 8, datetime('now'));

-- =============================================
-- STEP 9: Add topics for French
-- =============================================

INSERT OR IGNORE INTO topics (id, subject_id, name, slug, description, display_order, created_at)
VALUES
  ('topic_fr_grammar', 'subj_wassce_french', 'French Grammar', 'french-grammar', 'Articles, pronouns, verb conjugations, tenses', 1, datetime('now')),
  ('topic_fr_vocabulary', 'subj_wassce_french', 'Vocabulary', 'vocabulary', 'Common words, expressions, thematic vocabulary', 2, datetime('now')),
  ('topic_fr_reading', 'subj_wassce_french', 'Reading Comprehension', 'reading-comprehension', 'Text analysis, comprehension questions', 3, datetime('now')),
  ('topic_fr_writing', 'subj_wassce_french', 'Writing', 'writing', 'Letters, essays, compositions in French', 4, datetime('now')),
  ('topic_fr_culture', 'subj_wassce_french', 'French Culture', 'french-culture', 'Francophone countries, customs, traditions', 5, datetime('now')),
  ('topic_fr_oral', 'subj_wassce_french', 'Oral Communication', 'oral-communication', 'Dialogues, conversations, pronunciation', 6, datetime('now'));

-- =============================================
-- STEP 10: Add topics for Twi
-- =============================================

INSERT OR IGNORE INTO topics (id, subject_id, name, slug, description, display_order, created_at)
VALUES
  ('topic_twi_grammar', 'subj_wassce_twi', 'Twi Grammar', 'twi-grammar', 'Sentence structure, tenses, agreement', 1, datetime('now')),
  ('topic_twi_vocabulary', 'subj_wassce_twi', 'Twi Vocabulary', 'twi-vocabulary', 'Common words, idioms, proverbs', 2, datetime('now')),
  ('topic_twi_comprehension', 'subj_wassce_twi', 'Comprehension', 'comprehension', 'Reading and understanding Twi texts', 3, datetime('now')),
  ('topic_twi_composition', 'subj_wassce_twi', 'Composition', 'composition', 'Writing essays, letters, stories in Twi', 4, datetime('now')),
  ('topic_twi_culture', 'subj_wassce_twi', 'Akan Culture', 'akan-culture', 'Traditions, customs, festivals, naming practices', 5, datetime('now'));

-- =============================================
-- STEP 11: Add sample questions for new subjects
-- Note: Using question_text column (not question)
-- =============================================

-- Business Management questions
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at)
VALUES
  ('q_bm_001', 'subj_wassce_business_mgt', 'topic_bm_intro', 'Which of the following is NOT a type of business organization?', '["Sole proprietorship", "Partnership", "Corporation", "Legislation"]', 'Legislation', 'Legislation refers to laws, not a business type. Sole proprietorship, partnership, and corporation are all types of business organizations.', 'easy', 'multiple_choice', datetime('now')),
  ('q_bm_002', 'subj_wassce_business_mgt', 'topic_bm_management', 'The four main functions of management are:', '["Plan, Organize, Lead, Control", "Plan, Direct, Staff, Budget", "Hire, Fire, Train, Pay", "Market, Sell, Produce, Deliver"]', 'Plan, Organize, Lead, Control', 'The four primary management functions are Planning, Organizing, Leading (or Directing), and Controlling.', 'easy', 'multiple_choice', datetime('now')),
  ('q_bm_003', 'subj_wassce_business_mgt', 'topic_bm_marketing', 'The 4Ps of marketing mix are:', '["Product, Price, Place, Promotion", "People, Process, Physical, Planning", "Profit, Production, Placement, Pricing", "Package, Present, Promote, Profit"]', 'Product, Price, Place, Promotion', 'The marketing mix consists of Product, Price, Place (distribution), and Promotion.', 'easy', 'multiple_choice', datetime('now')),
  ('q_bm_004', 'subj_wassce_business_mgt', 'topic_bm_hr', 'Which is NOT a function of Human Resource Management?', '["Recruitment", "Training", "Manufacturing", "Compensation"]', 'Manufacturing', 'Manufacturing is a production function. HRM deals with recruitment, training, and compensation of employees.', 'medium', 'multiple_choice', datetime('now')),
  ('q_bm_005', 'subj_wassce_business_mgt', 'topic_bm_finance', 'Which is an internal source of business finance?', '["Bank loan", "Retained earnings", "Share capital", "Debentures"]', 'Retained earnings', 'Retained earnings are profits kept in the business, making them an internal source. Others are external sources.', 'medium', 'multiple_choice', datetime('now'));

-- Cost Accounting questions
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at)
VALUES
  ('q_ca_001', 'subj_wassce_cost_accounting', 'topic_ca_intro', 'Cost accounting is primarily concerned with:', '["Preparation of financial statements", "Determining product costs", "Tax calculation", "Auditing"]', 'Determining product costs', 'Cost accounting focuses on calculating and analyzing costs of products and services for managerial decision-making.', 'easy', 'multiple_choice', datetime('now')),
  ('q_ca_002', 'subj_wassce_cost_accounting', 'topic_ca_elements', 'The three elements of cost are:', '["Fixed, Variable, Semi-variable", "Direct, Indirect, Overhead", "Materials, Labor, Overheads", "Prime cost, Factory cost, Total cost"]', 'Materials, Labor, Overheads', 'The three main elements of cost are Materials, Labor, and Overheads (expenses).', 'easy', 'multiple_choice', datetime('now')),
  ('q_ca_003', 'subj_wassce_cost_accounting', 'topic_ca_materials', 'FIFO stands for:', '["First In, First Out", "Final Input, Final Output", "Fixed In, Fixed Out", "Free Input, Free Output"]', 'First In, First Out', 'FIFO (First In, First Out) is an inventory valuation method where oldest stock is used first.', 'easy', 'multiple_choice', datetime('now')),
  ('q_ca_004', 'subj_wassce_cost_accounting', 'topic_ca_overhead', 'Factory overhead costs include:', '["Direct materials", "Direct labor", "Indirect expenses", "Sales commission"]', 'Indirect expenses', 'Factory overheads are indirect costs incurred in production. Direct materials and labor are not overheads.', 'medium', 'multiple_choice', datetime('now')),
  ('q_ca_005', 'subj_wassce_cost_accounting', 'topic_ca_budgeting', 'A variance in cost accounting refers to:', '["The difference between budgeted and actual costs", "The average cost", "The total cost", "The fixed cost"]', 'The difference between budgeted and actual costs', 'Variance analysis compares budgeted/standard costs with actual costs to identify differences.', 'medium', 'multiple_choice', datetime('now'));

-- History questions
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at)
VALUES
  ('q_hist_001', 'subj_wassce_history', 'topic_hist_wa_precolonial', 'The Ghana Empire was famous for its trade in:', '["Spices and silk", "Gold and salt", "Diamonds and oil", "Coffee and cocoa"]', 'Gold and salt', 'The ancient Ghana Empire (not modern Ghana) was a major trading empire known for controlling gold and salt trade routes.', 'easy', 'multiple_choice', datetime('now')),
  ('q_hist_002', 'subj_wassce_history', 'topic_hist_ghana', 'Ghana gained independence from Britain in:', '["1947", "1957", "1960", "1963"]', '1957', 'Ghana became the first sub-Saharan African country to gain independence on March 6, 1957, under Kwame Nkrumah.', 'easy', 'multiple_choice', datetime('now')),
  ('q_hist_003', 'subj_wassce_history', 'topic_hist_nationalism', 'Who was the first President of Ghana?', '["J.B. Danquah", "Kwame Nkrumah", "Kofi Busia", "Jerry Rawlings"]', 'Kwame Nkrumah', 'Dr. Kwame Nkrumah was the first Prime Minister and later first President of Ghana.', 'easy', 'multiple_choice', datetime('now')),
  ('q_hist_004', 'subj_wassce_history', 'topic_hist_ecowas', 'ECOWAS was established in:', '["1965", "1975", "1985", "1995"]', '1975', 'The Economic Community of West African States (ECOWAS) was established in Lagos, Nigeria in 1975.', 'medium', 'multiple_choice', datetime('now')),
  ('q_hist_005', 'subj_wassce_history', 'topic_hist_wa_colonial', 'The Berlin Conference of 1884-1885 led to:', '["African independence", "The partition of Africa", "End of slavery", "Formation of OAU"]', 'The partition of Africa', 'The Berlin Conference established rules for European colonization and partition of Africa among European powers.', 'medium', 'multiple_choice', datetime('now'));

-- ICT questions
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at)
VALUES
  ('q_ict_001', 'subj_wassce_ict', 'topic_ict_fundamentals', 'The brain of the computer is called:', '["RAM", "Hard disk", "CPU", "Monitor"]', 'CPU', 'The Central Processing Unit (CPU) is called the brain of the computer as it processes all instructions.', 'easy', 'multiple_choice', datetime('now')),
  ('q_ict_002', 'subj_wassce_ict', 'topic_ict_software', 'Which is an example of system software?', '["Microsoft Word", "Operating System", "Adobe Photoshop", "Calculator"]', 'Operating System', 'An Operating System is system software that manages computer hardware and provides services for programs.', 'easy', 'multiple_choice', datetime('now')),
  ('q_ict_003', 'subj_wassce_ict', 'topic_ict_hardware', 'Which is an input device?', '["Monitor", "Printer", "Keyboard", "Speaker"]', 'Keyboard', 'A keyboard is an input device used to enter data into a computer. Monitor, printer, and speaker are output devices.', 'easy', 'multiple_choice', datetime('now')),
  ('q_ict_004', 'subj_wassce_ict', 'topic_ict_networking', 'LAN stands for:', '["Large Area Network", "Local Area Network", "Long Area Network", "Light Area Network"]', 'Local Area Network', 'LAN (Local Area Network) is a computer network that connects devices in a limited geographical area.', 'easy', 'multiple_choice', datetime('now')),
  ('q_ict_005', 'subj_wassce_ict', 'topic_ict_internet', 'HTTP stands for:', '["Hyper Text Transfer Protocol", "High Transfer Text Protocol", "Hyper Technical Transfer Process", "High Text Transfer Protocol"]', 'Hyper Text Transfer Protocol', 'HTTP (Hypertext Transfer Protocol) is the foundation of data communication on the World Wide Web.', 'medium', 'multiple_choice', datetime('now'));

-- Technical Drawing questions
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at)
VALUES
  ('q_td_001', 'subj_wassce_tech_drawing', 'topic_td_basics', 'The standard size of an A4 paper is:', '["210mm x 297mm", "297mm x 420mm", "148mm x 210mm", "420mm x 594mm"]', '210mm x 297mm', 'A4 paper measures 210mm by 297mm, which is the most common paper size for technical drawings.', 'easy', 'multiple_choice', datetime('now')),
  ('q_td_002', 'subj_wassce_tech_drawing', 'topic_td_orthographic', 'First angle projection is standard in:', '["USA", "UK and Ghana", "Japan", "Australia"]', 'UK and Ghana', 'First angle projection is the standard in European countries, UK, and most African countries including Ghana.', 'medium', 'multiple_choice', datetime('now')),
  ('q_td_003', 'subj_wassce_tech_drawing', 'topic_td_isometric', 'In isometric drawing, all axes are at:', '["90 degrees", "120 degrees", "45 degrees", "60 degrees"]', '120 degrees', 'In isometric projection, the three axes are equally spaced at 120 degrees from each other.', 'medium', 'multiple_choice', datetime('now')),
  ('q_td_004', 'subj_wassce_tech_drawing', 'topic_td_geometry', 'A pentagon has how many sides?', '["4", "5", "6", "7"]', '5', 'A pentagon is a five-sided polygon. The prefix "penta" means five.', 'easy', 'multiple_choice', datetime('now')),
  ('q_td_005', 'subj_wassce_tech_drawing', 'topic_td_building', 'A floor plan shows the view from:', '["Above", "Front", "Side", "Behind"]', 'Above', 'A floor plan is a birds-eye view (from above) showing the layout of rooms and spaces in a building.', 'easy', 'multiple_choice', datetime('now'));

-- Foods and Nutrition questions
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at)
VALUES
  ('q_fn_001', 'subj_wassce_foods', 'topic_fn_nutrients', 'Which nutrient provides the most energy per gram?', '["Carbohydrates", "Proteins", "Fats", "Vitamins"]', 'Fats', 'Fats provide 9 kilocalories per gram, while carbohydrates and proteins provide 4 kilocalories per gram.', 'easy', 'multiple_choice', datetime('now')),
  ('q_fn_002', 'subj_wassce_foods', 'topic_fn_nutrients', 'Vitamin C is also known as:', '["Retinol", "Thiamine", "Ascorbic acid", "Calciferol"]', 'Ascorbic acid', 'Vitamin C is chemically known as ascorbic acid. It is found in citrus fruits and vegetables.', 'easy', 'multiple_choice', datetime('now')),
  ('q_fn_003', 'subj_wassce_foods', 'topic_fn_food_safety', 'The danger zone for bacterial growth is:', '["0-4°C", "4-60°C", "60-100°C", "Below 0°C"]', '4-60°C', 'The danger zone is 4°C to 60°C where bacteria multiply rapidly. Food should not be left in this range for too long.', 'medium', 'multiple_choice', datetime('now')),
  ('q_fn_004', 'subj_wassce_foods', 'topic_fn_digestion', 'Protein digestion begins in the:', '["Mouth", "Stomach", "Small intestine", "Large intestine"]', 'Stomach', 'Protein digestion begins in the stomach with the enzyme pepsin, which is activated by hydrochloric acid.', 'medium', 'multiple_choice', datetime('now')),
  ('q_fn_005', 'subj_wassce_foods', 'topic_fn_meal_planning', 'A balanced diet should contain:', '["Only proteins", "Only carbohydrates", "All essential nutrients in correct proportions", "Only vitamins"]', 'All essential nutrients in correct proportions', 'A balanced diet includes all food groups in the right proportions to meet nutritional needs.', 'easy', 'multiple_choice', datetime('now'));

-- French questions
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at)
VALUES
  ('q_fr_001', 'subj_wassce_french', 'topic_fr_grammar', 'The French word for "book" is:', '["livre", "cahier", "stylo", "table"]', 'livre', 'Livre means book. Cahier is notebook, stylo is pen, and table is table.', 'easy', 'multiple_choice', datetime('now')),
  ('q_fr_002', 'subj_wassce_french', 'topic_fr_grammar', '"Je suis" means:', '["I have", "I am", "I go", "I want"]', 'I am', 'Je suis is the first person singular of être (to be), meaning "I am."', 'easy', 'multiple_choice', datetime('now')),
  ('q_fr_003', 'subj_wassce_french', 'topic_fr_vocabulary', 'Comment dit-on "thank you" en français?', '["Bonjour", "Au revoir", "Merci", "Sil vous plaît"]', 'Merci', 'Merci means thank you. Bonjour is hello, Au revoir is goodbye, Sil vous plaît is please.', 'easy', 'multiple_choice', datetime('now')),
  ('q_fr_004', 'subj_wassce_french', 'topic_fr_culture', 'The capital of France is:', '["Lyon", "Marseille", "Paris", "Nice"]', 'Paris', 'Paris is the capital and largest city of France, located in northern France on the River Seine.', 'easy', 'multiple_choice', datetime('now')),
  ('q_fr_005', 'subj_wassce_french', 'topic_fr_grammar', 'The plural of "le livre" is:', '["la livre", "les livres", "des livre", "un livres"]', 'les livres', 'In French, the plural of "le" is "les" and most nouns add "s" in plural form.', 'medium', 'multiple_choice', datetime('now'));

-- Twi questions
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at)
VALUES
  ('q_twi_001', 'subj_wassce_twi', 'topic_twi_vocabulary', '"Akwaaba" means:', '["Goodbye", "Welcome", "Thank you", "Please"]', 'Welcome', 'Akwaaba is the traditional Akan greeting meaning welcome.', 'easy', 'multiple_choice', datetime('now')),
  ('q_twi_002', 'subj_wassce_twi', 'topic_twi_vocabulary', 'The Twi word for "water" is:', '["Edziban", "Nsuo", "Aduro", "Ahoma"]', 'Nsuo', 'Nsuo means water in Twi. Edziban is food, Aduro is medicine.', 'easy', 'multiple_choice', datetime('now')),
  ('q_twi_003', 'subj_wassce_twi', 'topic_twi_culture', 'Adinkra symbols originated from the:', '["Ga people", "Ewe people", "Akan people", "Dagomba people"]', 'Akan people', 'Adinkra symbols are visual symbols from the Akan people of Ghana, representing concepts and aphorisms.', 'easy', 'multiple_choice', datetime('now')),
  ('q_twi_004', 'subj_wassce_twi', 'topic_twi_grammar', '"Ɔkɔ sukuu" means:', '["She/He goes to school", "She/He is at school", "She/He left school", "She/He likes school"]', 'She/He goes to school', 'Ɔkɔ (he/she goes) + sukuu (school) means he/she goes to school.', 'medium', 'multiple_choice', datetime('now')),
  ('q_twi_005', 'subj_wassce_twi', 'topic_twi_culture', 'The Akwasidae festival is celebrated by the:', '["Gas", "Ewes", "Ashantis", "Fantes"]', 'Ashantis', 'Akwasidae is an important Ashanti festival celebrated every six weeks to honor ancestors and the Asantehene.', 'medium', 'multiple_choice', datetime('now'));

-- =============================================
-- STEP 12: Fix Elective Mathematics ID mismatch
-- Database has 'elect_math', frontend expects 'elective_math'
-- =============================================

-- First, update questions that reference the old ID
UPDATE questions SET subject_id = 'subj_wassce_elective_math' WHERE subject_id = 'subj_wassce_elect_math';

-- Update topics that reference the old ID
UPDATE topics SET subject_id = 'subj_wassce_elective_math' WHERE subject_id = 'subj_wassce_elect_math';

-- Create new subject with correct ID if it doesn't exist
INSERT OR IGNORE INTO subjects (id, name, slug, icon, color, description, display_order, created_at)
SELECT 'subj_wassce_elective_math', name, 'elective-mathematics', icon, color, description, display_order, datetime('now')
FROM subjects WHERE id = 'subj_wassce_elect_math';

-- Delete old subject
DELETE FROM subjects WHERE id = 'subj_wassce_elect_math';
