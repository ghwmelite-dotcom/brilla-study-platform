-- Prod patch 096: seed syllabus-aligned topics for subjects that had none.
-- These 22 subjects exist in prod with question banks attached directly
-- (questions.topic_id IS NULL) but zero topic rows, so the revision classroom
-- could not build a lesson plan (400 "content being prepared"). The classroom
-- generates teaching + checkpoint content via AI from topic/subject/exam names
-- only (workers/api/revision-classroom.ts never reads the questions table),
-- so topic rows alone unblock it. Idempotent (INSERT OR IGNORE).

-- ============ WASSCE ============
INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES
('topic_wassce_english_comprehension', 'subj_wassce_english', NULL, 'Comprehension', 'comprehension', 'Reading passages, identifying main ideas, inference and vocabulary in context', NULL, NULL, 1, '2026-08-13T00:00:00.000Z'),
('topic_wassce_english_summary', 'subj_wassce_english', NULL, 'Summary Writing', 'summary-writing', 'Identifying topic sentences and condensing passages into concise sentences', NULL, NULL, 2, '2026-08-13T00:00:00.000Z'),
('topic_wassce_english_lexis', 'subj_wassce_english', NULL, 'Lexis and Structure', 'lexis-and-structure', 'Vocabulary, collocations, sentence structure and completion items', NULL, NULL, 3, '2026-08-13T00:00:00.000Z'),
('topic_wassce_english_grammar', 'subj_wassce_english', NULL, 'Grammar and Usage', 'grammar-and-usage', 'Parts of speech, concord, tenses, active and passive voice', NULL, NULL, 4, '2026-08-13T00:00:00.000Z'),
('topic_wassce_english_essay', 'subj_wassce_english', NULL, 'Essay Writing', 'essay-writing', 'Narrative, descriptive, expository and argumentative essays', NULL, NULL, 5, '2026-08-13T00:00:00.000Z'),
('topic_wassce_english_letter', 'subj_wassce_english', NULL, 'Letter and Report Writing', 'letter-and-report-writing', 'Formal and informal letters, reports, articles and speeches', NULL, NULL, 6, '2026-08-13T00:00:00.000Z'),
('topic_wassce_english_oral', 'subj_wassce_english', NULL, 'Oral English', 'oral-english', 'Vowels, consonants, stress, rhythm and intonation (Test of Orals)', NULL, NULL, 7, '2026-08-13T00:00:00.000Z');

INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES
('topic_wassce_intsci_cells', 'subj_wassce_int_science', NULL, 'Cells and Living Things', 'cells-and-living-things', 'Cell structure, classification and diversity of living organisms', NULL, NULL, 1, '2026-08-13T00:00:00.000Z'),
('topic_wassce_intsci_body', 'subj_wassce_int_science', NULL, 'Human Body Systems', 'human-body-systems', 'Digestive, circulatory, respiratory, nervous and excretory systems', NULL, NULL, 2, '2026-08-13T00:00:00.000Z'),
('topic_wassce_intsci_reproduction', 'subj_wassce_int_science', NULL, 'Reproduction and Heredity', 'reproduction-and-heredity', 'Reproduction in plants and animals, growth and basic genetics', NULL, NULL, 3, '2026-08-13T00:00:00.000Z'),
('topic_wassce_intsci_matter', 'subj_wassce_int_science', NULL, 'Matter and Materials', 'matter-and-materials', 'States of matter, elements, mixtures, metals and non-metals', NULL, NULL, 4, '2026-08-13T00:00:00.000Z'),
('topic_wassce_intsci_acids', 'subj_wassce_int_science', NULL, 'Acids, Bases and Salts', 'acids-bases-and-salts', 'Properties, indicators, neutralisation and everyday applications', NULL, NULL, 5, '2026-08-13T00:00:00.000Z'),
('topic_wassce_intsci_energy', 'subj_wassce_int_science', NULL, 'Energy and Electricity', 'energy-and-electricity', 'Forms and sources of energy, simple circuits and magnetism', NULL, NULL, 6, '2026-08-13T00:00:00.000Z'),
('topic_wassce_intsci_waves', 'subj_wassce_int_science', NULL, 'Waves, Light and Sound', 'waves-light-and-sound', 'Properties of waves, reflection, refraction and sound', NULL, NULL, 7, '2026-08-13T00:00:00.000Z'),
('topic_wassce_intsci_agric', 'subj_wassce_int_science', NULL, 'Agriculture and Ecosystems', 'agriculture-and-ecosystems', 'Soil, crop production, ecosystems and nutrient cycles', NULL, NULL, 8, '2026-08-13T00:00:00.000Z'),
('topic_wassce_intsci_health', 'subj_wassce_int_science', NULL, 'Environmental Health', 'environmental-health', 'Water and sanitation, diseases, pollution and conservation', NULL, NULL, 9, '2026-08-13T00:00:00.000Z');

INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES
('topic_wassce_social_self', 'subj_wassce_social', NULL, 'Self Development', 'self-development', 'Self-identity, self-esteem, goal setting and managing adolescence', NULL, NULL, 1, '2026-08-13T00:00:00.000Z'),
('topic_wassce_social_culture', 'subj_wassce_social', NULL, 'Socialization and Culture', 'socialization-and-culture', 'Agents of socialization, culture, national identity and nation-building', NULL, NULL, 2, '2026-08-13T00:00:00.000Z'),
('topic_wassce_social_governance', 'subj_wassce_social', NULL, 'Governance and Democracy', 'governance-and-democracy', 'Systems of government, the 1992 Constitution and democratic participation', NULL, NULL, 3, '2026-08-13T00:00:00.000Z'),
('topic_wassce_social_citizenship', 'subj_wassce_social', NULL, 'Citizenship and Human Rights', 'citizenship-and-human-rights', 'Rights and responsibilities of citizens and human rights protection', NULL, NULL, 4, '2026-08-13T00:00:00.000Z'),
('topic_wassce_social_population', 'subj_wassce_social', NULL, 'Population and Migration', 'population-and-migration', 'Population structure, growth, migration and their effects on development', NULL, NULL, 5, '2026-08-13T00:00:00.000Z'),
('topic_wassce_social_environment', 'subj_wassce_social', NULL, 'Environment and Sustainability', 'environment-and-sustainability', 'Environmental degradation, resource management and sustainable development', NULL, NULL, 6, '2026-08-13T00:00:00.000Z'),
('topic_wassce_social_economy', 'subj_wassce_social', NULL, 'Economic Development', 'economic-development', 'Economic activities, work ethics, entrepreneurship and financial literacy', NULL, NULL, 7, '2026-08-13T00:00:00.000Z'),
('topic_wassce_social_peace', 'subj_wassce_social', NULL, 'Peace and Conflict Resolution', 'peace-and-conflict-resolution', 'Sources of conflict, mediation, arbitration and peace-building', NULL, NULL, 8, '2026-08-13T00:00:00.000Z');

-- ============ BECE ============
INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES
('topic_bece_english_comprehension', 'subj_bece_english', NULL, 'Comprehension', 'comprehension', 'Reading passages and answering literal and inferential questions', NULL, NULL, 1, '2026-08-13T00:00:00.000Z'),
('topic_bece_english_grammar', 'subj_bece_english', NULL, 'Grammar and Usage', 'grammar-and-usage', 'Parts of speech, tenses, concord and sentence structure', NULL, NULL, 2, '2026-08-13T00:00:00.000Z'),
('topic_bece_english_vocabulary', 'subj_bece_english', NULL, 'Vocabulary and Word Usage', 'vocabulary-and-word-usage', 'Synonyms, antonyms, idioms and registers', NULL, NULL, 3, '2026-08-13T00:00:00.000Z'),
('topic_bece_english_composition', 'subj_bece_english', NULL, 'Composition Writing', 'composition-writing', 'Narrative, descriptive and expository compositions', NULL, NULL, 4, '2026-08-13T00:00:00.000Z'),
('topic_bece_english_letter', 'subj_bece_english', NULL, 'Letter Writing', 'letter-writing', 'Formal and informal letters with correct format', NULL, NULL, 5, '2026-08-13T00:00:00.000Z'),
('topic_bece_english_summary', 'subj_bece_english', NULL, 'Summary Writing', 'summary-writing', 'Extracting main points and writing concise summaries', NULL, NULL, 6, '2026-08-13T00:00:00.000Z'),
('topic_bece_english_literature', 'subj_bece_english', NULL, 'Literature', 'literature', 'Set prose, poetry and drama: plot, character and theme', NULL, NULL, 7, '2026-08-13T00:00:00.000Z');

INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES
('topic_bece_math_number', 'subj_bece_math', NULL, 'Number Operations', 'number-operations', 'Whole numbers, integers, factors, multiples, HCF and LCM', NULL, NULL, 1, '2026-08-13T00:00:00.000Z'),
('topic_bece_math_fractions', 'subj_bece_math', NULL, 'Fractions, Decimals and Percentages', 'fractions-decimals-percentages', 'Operations and conversions between fractions, decimals and percentages', NULL, NULL, 2, '2026-08-13T00:00:00.000Z'),
('topic_bece_math_ratio', 'subj_bece_math', NULL, 'Ratio, Proportion and Rates', 'ratio-proportion-and-rates', 'Sharing in ratios, direct and inverse proportion, rates and speed', NULL, NULL, 3, '2026-08-13T00:00:00.000Z'),
('topic_bece_math_algebra', 'subj_bece_math', NULL, 'Algebraic Expressions', 'algebraic-expressions', 'Simplifying expressions, substitution and expansion', NULL, NULL, 4, '2026-08-13T00:00:00.000Z'),
('topic_bece_math_equations', 'subj_bece_math', NULL, 'Linear Equations and Inequalities', 'linear-equations-and-inequalities', 'Solving linear equations, inequalities and word problems', NULL, NULL, 5, '2026-08-13T00:00:00.000Z'),
('topic_bece_math_sets', 'subj_bece_math', NULL, 'Sets', 'sets', 'Set notation, union, intersection and Venn diagrams', NULL, NULL, 6, '2026-08-13T00:00:00.000Z'),
('topic_bece_math_geometry', 'subj_bece_math', NULL, 'Geometry and Constructions', 'geometry-and-constructions', 'Angles, polygons, circle theorems and geometric constructions', NULL, NULL, 7, '2026-08-13T00:00:00.000Z'),
('topic_bece_math_mensuration', 'subj_bece_math', NULL, 'Mensuration', 'mensuration', 'Perimeter, area, surface area and volume of common shapes', NULL, NULL, 8, '2026-08-13T00:00:00.000Z'),
('topic_bece_math_statistics', 'subj_bece_math', NULL, 'Statistics and Probability', 'statistics-and-probability', 'Data collection, averages, charts and simple probability', NULL, NULL, 9, '2026-08-13T00:00:00.000Z');

INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES
('topic_bece_science_cells', 'subj_bece_science', NULL, 'Cells and Living Organisms', 'cells-and-living-organisms', 'Cell structure, classification and characteristics of living things', NULL, NULL, 1, '2026-08-13T00:00:00.000Z'),
('topic_bece_science_body', 'subj_bece_science', NULL, 'Human Body Systems', 'human-body-systems', 'Digestive, circulatory, respiratory and reproductive systems', NULL, NULL, 2, '2026-08-13T00:00:00.000Z'),
('topic_bece_science_matter', 'subj_bece_science', NULL, 'Matter and Its States', 'matter-and-its-states', 'Particles, states of matter, elements, mixtures and separation', NULL, NULL, 3, '2026-08-13T00:00:00.000Z'),
('topic_bece_science_energy', 'subj_bece_science', NULL, 'Energy and Its Forms', 'energy-and-its-forms', 'Forms, sources, transformation and conservation of energy', NULL, NULL, 4, '2026-08-13T00:00:00.000Z'),
('topic_bece_science_electricity', 'subj_bece_science', NULL, 'Electricity and Magnetism', 'electricity-and-magnetism', 'Simple circuits, conductors, insulators and magnets', NULL, NULL, 5, '2026-08-13T00:00:00.000Z'),
('topic_bece_science_machines', 'subj_bece_science', NULL, 'Force, Work and Machines', 'force-work-and-machines', 'Types of forces, work, energy and simple machines', NULL, NULL, 6, '2026-08-13T00:00:00.000Z'),
('topic_bece_science_agric', 'subj_bece_science', NULL, 'Agriculture and Food Production', 'agriculture-and-food-production', 'Soil, crops, farm animals and food preservation', NULL, NULL, 7, '2026-08-13T00:00:00.000Z'),
('topic_bece_science_health', 'subj_bece_science', NULL, 'Health, Sanitation and Environment', 'health-sanitation-and-environment', 'Personal hygiene, diseases, waste management and ecosystems', NULL, NULL, 8, '2026-08-13T00:00:00.000Z');

INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES
('topic_bece_social_family', 'subj_bece_social', NULL, 'Family and Socialization', 'family-and-socialization', 'Types of family, socialization and responsible parenthood', NULL, NULL, 1, '2026-08-13T00:00:00.000Z'),
('topic_bece_social_culture', 'subj_bece_social', NULL, 'Culture and National Identity', 'culture-and-national-identity', 'Elements of culture, festivals, symbols and national unity', NULL, NULL, 2, '2026-08-13T00:00:00.000Z'),
('topic_bece_social_governance', 'subj_bece_social', NULL, 'Governance and Leadership', 'governance-and-leadership', 'Levels of government, leadership styles and rule of law', NULL, NULL, 3, '2026-08-13T00:00:00.000Z'),
('topic_bece_social_citizenship', 'subj_bece_social', NULL, 'Citizenship and Rights', 'citizenship-and-rights', 'Rights, duties and responsibilities of citizens', NULL, NULL, 4, '2026-08-13T00:00:00.000Z'),
('topic_bece_social_population', 'subj_bece_social', NULL, 'Population and Settlement', 'population-and-settlement', 'Population growth, distribution, migration and settlement types', NULL, NULL, 5, '2026-08-13T00:00:00.000Z'),
('topic_bece_social_environment', 'subj_bece_social', NULL, 'Environment and Resources', 'environment-and-resources', 'Natural resources, environmental problems and conservation', NULL, NULL, 6, '2026-08-13T00:00:00.000Z'),
('topic_bece_social_economy', 'subj_bece_social', NULL, 'Economic Activities', 'economic-activities', 'Production, trade, money, banking and entrepreneurship', NULL, NULL, 7, '2026-08-13T00:00:00.000Z'),
('topic_bece_social_peace', 'subj_bece_social', NULL, 'Peace and Security', 'peace-and-security', 'Conflict, conflict resolution and promoting national peace', NULL, NULL, 8, '2026-08-13T00:00:00.000Z');

INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES
('topic_bece_rme_god', 'subj_bece_rme', NULL, 'God, Creation and Attributes', 'god-creation-and-attributes', 'Nature and attributes of God and the creation accounts', NULL, NULL, 1, '2026-08-13T00:00:00.000Z'),
('topic_bece_rme_worship', 'subj_bece_rme', NULL, 'Worship and Prayer', 'worship-and-prayer', 'Forms of worship and prayer in the major religions of Ghana', NULL, NULL, 2, '2026-08-13T00:00:00.000Z'),
('topic_bece_rme_festivals', 'subj_bece_rme', NULL, 'Religious Festivals', 'religious-festivals', 'Christian, Islamic and traditional festivals and their significance', NULL, NULL, 3, '2026-08-13T00:00:00.000Z'),
('topic_bece_rme_rites', 'subj_bece_rme', NULL, 'Rites of Passage', 'rites-of-passage', 'Naming, puberty, marriage and funeral rites', NULL, NULL, 4, '2026-08-13T00:00:00.000Z'),
('topic_bece_rme_morals', 'subj_bece_rme', NULL, 'Moral Values and Virtues', 'moral-values-and-virtues', 'Honesty, obedience, respect, hard work and their rewards', NULL, NULL, 5, '2026-08-13T00:00:00.000Z'),
('topic_bece_rme_leaders', 'subj_bece_rme', NULL, 'Religious Leaders and Founders', 'religious-leaders-and-founders', 'Lives and teachings of founders and leaders of the major religions', NULL, NULL, 6, '2026-08-13T00:00:00.000Z'),
('topic_bece_rme_community', 'subj_bece_rme', NULL, 'Family and Community Life', 'family-and-community-life', 'Relationships, responsibilities and peaceful coexistence', NULL, NULL, 7, '2026-08-13T00:00:00.000Z');

INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES
('topic_bece_bdt_design', 'subj_bece_bdt', NULL, 'Design and Drawing', 'design-and-drawing', 'The design process, sketching and working drawings', NULL, NULL, 1, '2026-08-13T00:00:00.000Z'),
('topic_bece_bdt_materials', 'subj_bece_bdt', NULL, 'Materials and Tools', 'materials-and-tools', 'Properties of materials and safe use of hand tools and equipment', NULL, NULL, 2, '2026-08-13T00:00:00.000Z'),
('topic_bece_bdt_construction', 'subj_bece_bdt', NULL, 'Construction and Structures', 'construction-and-structures', 'Building materials, foundations and simple structures', NULL, NULL, 3, '2026-08-13T00:00:00.000Z'),
('topic_bece_bdt_electricals', 'subj_bece_bdt', NULL, 'Electrical and Electronic Systems', 'electrical-and-electronic-systems', 'Basic circuits, domestic wiring and safety', NULL, NULL, 4, '2026-08-13T00:00:00.000Z'),
('topic_bece_bdt_food', 'subj_bece_bdt', NULL, 'Food and Nutrition', 'food-and-nutrition', 'Nutrients, balanced diets and food preparation', NULL, NULL, 5, '2026-08-13T00:00:00.000Z'),
('topic_bece_bdt_clothing', 'subj_bece_bdt', NULL, 'Clothing and Textiles', 'clothing-and-textiles', 'Fibres, fabric construction and garment care', NULL, NULL, 6, '2026-08-13T00:00:00.000Z'),
('topic_bece_bdt_entrepreneurship', 'subj_bece_bdt', NULL, 'Entrepreneurship', 'entrepreneurship', 'Business opportunities, planning and marketing products', NULL, NULL, 7, '2026-08-13T00:00:00.000Z');

INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES
('topic_bece_ict_intro', 'subj_bece_ict', NULL, 'Introduction to Computers', 'introduction-to-computers', 'Definition, types, generations and uses of computers', NULL, NULL, 1, '2026-08-13T00:00:00.000Z'),
('topic_bece_ict_hardware', 'subj_bece_ict', NULL, 'Hardware and Software', 'hardware-and-software', 'Input, output, storage devices and types of software', NULL, NULL, 2, '2026-08-13T00:00:00.000Z'),
('topic_bece_ict_word', 'subj_bece_ict', NULL, 'Word Processing and Presentation', 'word-processing-and-presentation', 'Creating, formatting and presenting documents and slides', NULL, NULL, 3, '2026-08-13T00:00:00.000Z'),
('topic_bece_ict_spreadsheets', 'subj_bece_ict', NULL, 'Spreadsheets and Data', 'spreadsheets-and-data', 'Cells, formulas, charts and basic data handling', NULL, NULL, 4, '2026-08-13T00:00:00.000Z'),
('topic_bece_ict_internet', 'subj_bece_ict', NULL, 'The Internet and Email', 'the-internet-and-email', 'Browsing, searching, email and online communication', NULL, NULL, 5, '2026-08-13T00:00:00.000Z'),
('topic_bece_ict_files', 'subj_bece_ict', NULL, 'File Management', 'file-management', 'Files, folders, storage and organization of data', NULL, NULL, 6, '2026-08-13T00:00:00.000Z'),
('topic_bece_ict_ethics', 'subj_bece_ict', NULL, 'ICT Ethics and Safety', 'ict-ethics-and-safety', 'Responsible use, cyber safety, health and ergonomic practices', NULL, NULL, 7, '2026-08-13T00:00:00.000Z');

INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES
('topic_bece_french_greetings', 'subj_bece_french', NULL, 'Greetings and Introductions', 'greetings-and-introductions', 'Salutations, introducing oneself and others, polite expressions', NULL, NULL, 1, '2026-08-13T00:00:00.000Z'),
('topic_bece_french_numbers', 'subj_bece_french', NULL, 'Numbers, Dates and Time', 'numbers-dates-and-time', 'Counting, days, months, dates and telling the time', NULL, NULL, 2, '2026-08-13T00:00:00.000Z'),
('topic_bece_french_family', 'subj_bece_french', NULL, 'Family and Friends', 'family-and-friends', 'Family members, relationships and describing people', NULL, NULL, 3, '2026-08-13T00:00:00.000Z'),
('topic_bece_french_school', 'subj_bece_french', NULL, 'School Life', 'school-life', 'Classroom objects, subjects, timetable and school activities', NULL, NULL, 4, '2026-08-13T00:00:00.000Z'),
('topic_bece_french_food', 'subj_bece_french', NULL, 'Food and Drinks', 'food-and-drinks', 'Meals, ordering food and expressing preferences', NULL, NULL, 5, '2026-08-13T00:00:00.000Z'),
('topic_bece_french_routine', 'subj_bece_french', NULL, 'Daily Routine and Verbs', 'daily-routine-and-verbs', 'Present tense of regular and common irregular verbs, daily activities', NULL, NULL, 6, '2026-08-13T00:00:00.000Z'),
('topic_bece_french_places', 'subj_bece_french', NULL, 'Places, Shopping and Directions', 'places-shopping-and-directions', 'Town vocabulary, asking the way and shopping dialogues', NULL, NULL, 7, '2026-08-13T00:00:00.000Z');

INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES
('topic_bece_ghlang_greetings', 'subj_bece_gh_lang', NULL, 'Greetings and Forms of Address', 'greetings-and-forms-of-address', 'Greetings, titles and respectful forms of address', NULL, NULL, 1, '2026-08-13T00:00:00.000Z'),
('topic_bece_ghlang_alphabet', 'subj_bece_gh_lang', NULL, 'Alphabet and Phonetics', 'alphabet-and-phonetics', 'Letters, sounds and tone in Ghanaian languages', NULL, NULL, 2, '2026-08-13T00:00:00.000Z'),
('topic_bece_ghlang_numbers', 'subj_bece_gh_lang', NULL, 'Numbers and Counting', 'numbers-and-counting', 'Cardinal and ordinal numbers, counting and basic arithmetic terms', NULL, NULL, 3, '2026-08-13T00:00:00.000Z'),
('topic_bece_ghlang_family', 'subj_bece_gh_lang', NULL, 'Family and Kinship', 'family-and-kinship', 'Kinship terms, family structure and relationships', NULL, NULL, 4, '2026-08-13T00:00:00.000Z'),
('topic_bece_ghlang_grammar', 'subj_bece_gh_lang', NULL, 'Grammar and Sentence Structure', 'grammar-and-sentence-structure', 'Word classes, sentence formation and usage', NULL, NULL, 5, '2026-08-13T00:00:00.000Z'),
('topic_bece_ghlang_proverbs', 'subj_bece_gh_lang', NULL, 'Proverbs and Idioms', 'proverbs-and-idioms', 'Common proverbs, idioms and their meanings', NULL, NULL, 6, '2026-08-13T00:00:00.000Z'),
('topic_bece_ghlang_culture', 'subj_bece_gh_lang', NULL, 'Oral Literature and Culture', 'oral-literature-and-culture', 'Folktales, songs, festivals and cultural practices', NULL, NULL, 7, '2026-08-13T00:00:00.000Z');

-- ============ Cambridge IGCSE ============
INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES
('topic_igcse_math_number', 'subj_igcse_math', NULL, 'Number', 'number', 'Integers, fractions, decimals, percentages, ratio and standard form', NULL, NULL, 1, '2026-08-13T00:00:00.000Z'),
('topic_igcse_math_algebra', 'subj_igcse_math', NULL, 'Algebra', 'algebra', 'Expressions, equations, inequalities, sequences and variation', NULL, NULL, 2, '2026-08-13T00:00:00.000Z'),
('topic_igcse_math_functions', 'subj_igcse_math', NULL, 'Functions and Graphs', 'functions-and-graphs', 'Function notation, graphs of linear, quadratic and reciprocal functions', NULL, NULL, 3, '2026-08-13T00:00:00.000Z'),
('topic_igcse_math_geometry', 'subj_igcse_math', NULL, 'Geometry', 'geometry', 'Angles, polygons, circle theorems, congruence and similarity', NULL, NULL, 4, '2026-08-13T00:00:00.000Z'),
('topic_igcse_math_mensuration', 'subj_igcse_math', NULL, 'Mensuration', 'mensuration', 'Perimeter, area, surface area and volume', NULL, NULL, 5, '2026-08-13T00:00:00.000Z'),
('topic_igcse_math_trig', 'subj_igcse_math', NULL, 'Trigonometry', 'trigonometry', 'Right-angled and non-right-angled triangles, bearings and graphs', NULL, NULL, 6, '2026-08-13T00:00:00.000Z'),
('topic_igcse_math_vectors', 'subj_igcse_math', NULL, 'Vectors and Transformations', 'vectors-and-transformations', 'Vector arithmetic, translations, reflections, rotations and enlargements', NULL, NULL, 7, '2026-08-13T00:00:00.000Z'),
('topic_igcse_math_stats', 'subj_igcse_math', NULL, 'Statistics and Probability', 'statistics-and-probability', 'Averages, charts, cumulative frequency and probability', NULL, NULL, 8, '2026-08-13T00:00:00.000Z');

INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES
('topic_igcse_addmath_functions', 'subj_igcse_add_math', NULL, 'Functions', 'functions', 'Domain, range, composite and inverse functions, modulus functions', NULL, NULL, 1, '2026-08-13T00:00:00.000Z'),
('topic_igcse_addmath_quadratics', 'subj_igcse_add_math', NULL, 'Quadratics and Inequalities', 'quadratics-and-inequalities', 'Quadratic functions, discriminants, inequalities and simultaneous equations', NULL, NULL, 2, '2026-08-13T00:00:00.000Z'),
('topic_igcse_addmath_logs', 'subj_igcse_add_math', NULL, 'Logarithms and Exponentials', 'logarithms-and-exponentials', 'Laws of logarithms, exponential equations and graphs', NULL, NULL, 3, '2026-08-13T00:00:00.000Z'),
('topic_igcse_addmath_trig', 'subj_igcse_add_math', NULL, 'Trigonometry and Radians', 'trigonometry-and-radians', 'Radian measure, identities, equations and graphs of trig functions', NULL, NULL, 4, '2026-08-13T00:00:00.000Z'),
('topic_igcse_addmath_coord', 'subj_igcse_add_math', NULL, 'Coordinate Geometry', 'coordinate-geometry', 'Straight lines, circles and related geometry problems', NULL, NULL, 5, '2026-08-13T00:00:00.000Z'),
('topic_igcse_addmath_differentiation', 'subj_igcse_add_math', NULL, 'Differentiation', 'differentiation', 'Derivatives, tangents, stationary points and rates of change', NULL, NULL, 6, '2026-08-13T00:00:00.000Z'),
('topic_igcse_addmath_integration', 'subj_igcse_add_math', NULL, 'Integration', 'integration', 'Indefinite and definite integrals, areas under curves', NULL, NULL, 7, '2026-08-13T00:00:00.000Z');

INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES
('topic_igcse_physics_mechanics', 'subj_igcse_physics', NULL, 'Motion, Forces and Energy', 'motion-forces-and-energy', 'Speed, acceleration, Newton''s laws, work, energy and power', NULL, NULL, 1, '2026-08-13T00:00:00.000Z'),
('topic_igcse_physics_thermal', 'subj_igcse_physics', NULL, 'Thermal Physics', 'thermal-physics', 'Kinetic model, temperature, specific heat capacity and transfer', NULL, NULL, 2, '2026-08-13T00:00:00.000Z'),
('topic_igcse_physics_waves', 'subj_igcse_physics', NULL, 'Waves', 'waves', 'Properties of waves, light, sound and the electromagnetic spectrum', NULL, NULL, 3, '2026-08-13T00:00:00.000Z'),
('topic_igcse_physics_electricity', 'subj_igcse_physics', NULL, 'Electricity and Magnetism', 'electricity-and-magnetism', 'Circuits, resistance, electromagnetism, motors and transformers', NULL, NULL, 4, '2026-08-13T00:00:00.000Z'),
('topic_igcse_physics_nuclear', 'subj_igcse_physics', NULL, 'Nuclear Physics', 'nuclear-physics', 'Atomic structure, radioactivity, fission and fusion', NULL, NULL, 5, '2026-08-13T00:00:00.000Z'),
('topic_igcse_physics_space', 'subj_igcse_physics', NULL, 'Space Physics', 'space-physics', 'The Solar System, stars, galaxies and the expanding universe', NULL, NULL, 6, '2026-08-13T00:00:00.000Z');

INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES
('topic_igcse_chem_atomic', 'subj_igcse_chemistry', NULL, 'Matter and Atomic Structure', 'matter-and-atomic-structure', 'Particles, atomic structure, isotopes and electron arrangement', NULL, NULL, 1, '2026-08-13T00:00:00.000Z'),
('topic_igcse_chem_periodic', 'subj_igcse_chemistry', NULL, 'The Periodic Table', 'the-periodic-table', 'Groups, periods, trends and transition elements', NULL, NULL, 2, '2026-08-13T00:00:00.000Z'),
('topic_igcse_chem_bonding', 'subj_igcse_chemistry', NULL, 'Chemical Bonding', 'chemical-bonding', 'Ionic, covalent and metallic bonding, structure and properties', NULL, NULL, 3, '2026-08-13T00:00:00.000Z'),
('topic_igcse_chem_stoichiometry', 'subj_igcse_chemistry', NULL, 'Stoichiometry', 'stoichiometry', 'The mole, reacting masses, concentrations and gas volumes', NULL, NULL, 4, '2026-08-13T00:00:00.000Z'),
('topic_igcse_chem_reactions', 'subj_igcse_chemistry', NULL, 'Reactions, Rates and Energetics', 'reactions-rates-and-energetics', 'Rate of reaction, reversible reactions and energy changes', NULL, NULL, 5, '2026-08-13T00:00:00.000Z'),
('topic_igcse_chem_acids', 'subj_igcse_chemistry', NULL, 'Acids, Bases and Salts', 'acids-bases-and-salts', 'Properties, neutralisation and preparation of salts', NULL, NULL, 6, '2026-08-13T00:00:00.000Z'),
('topic_igcse_chem_metals', 'subj_igcse_chemistry', NULL, 'Metals and Reactivity', 'metals-and-reactivity', 'Reactivity series, extraction, corrosion and alloys', NULL, NULL, 7, '2026-08-13T00:00:00.000Z'),
('topic_igcse_chem_organic', 'subj_igcse_chemistry', NULL, 'Organic Chemistry', 'organic-chemistry', 'Alkanes, alkenes, alcohols, acids and polymers', NULL, NULL, 8, '2026-08-13T00:00:00.000Z');

INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES
('topic_igcse_bio_cells', 'subj_igcse_biology', NULL, 'Cells and Microscopy', 'cells-and-microscopy', 'Cell structure, specialised cells and microscope use', NULL, NULL, 1, '2026-08-13T00:00:00.000Z'),
('topic_igcse_bio_molecules', 'subj_igcse_biology', NULL, 'Biological Molecules and Enzymes', 'biological-molecules-and-enzymes', 'Carbohydrates, proteins, lipids and enzyme action', NULL, NULL, 2, '2026-08-13T00:00:00.000Z'),
('topic_igcse_bio_nutrition', 'subj_igcse_biology', NULL, 'Nutrition and Digestion', 'nutrition-and-digestion', 'Human and plant nutrition, the digestive system', NULL, NULL, 3, '2026-08-13T00:00:00.000Z'),
('topic_igcse_bio_transport', 'subj_igcse_biology', NULL, 'Transport in Plants and Animals', 'transport-in-plants-and-animals', 'Xylem, phloem, the heart and circulatory system', NULL, NULL, 4, '2026-08-13T00:00:00.000Z'),
('topic_igcse_bio_respiration', 'subj_igcse_biology', NULL, 'Respiration and Gas Exchange', 'respiration-and-gas-exchange', 'Aerobic and anaerobic respiration, breathing and gas exchange', NULL, NULL, 5, '2026-08-13T00:00:00.000Z'),
('topic_igcse_bio_reproduction', 'subj_igcse_biology', NULL, 'Reproduction and Development', 'reproduction-and-development', 'Asexual and sexual reproduction in plants and humans', NULL, NULL, 6, '2026-08-13T00:00:00.000Z'),
('topic_igcse_bio_genetics', 'subj_igcse_biology', NULL, 'Genetics and Inheritance', 'genetics-and-inheritance', 'DNA, genes, monohybrid inheritance and variation', NULL, NULL, 7, '2026-08-13T00:00:00.000Z'),
('topic_igcse_bio_ecology', 'subj_igcse_biology', NULL, 'Ecology and Ecosystems', 'ecology-and-ecosystems', 'Food chains, nutrient cycles and human impacts', NULL, NULL, 8, '2026-08-13T00:00:00.000Z');

-- ============ Cambridge A-Level ============
INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES
('topic_alevel_math_algebra', 'subj_alevel_math', NULL, 'Algebra and Functions', 'algebra-and-functions', 'Quadratics, functions, transformations, modulus and partial fractions', NULL, NULL, 1, '2026-08-13T00:00:00.000Z'),
('topic_alevel_math_coord', 'subj_alevel_math', NULL, 'Coordinate Geometry', 'coordinate-geometry', 'Straight lines, circles and parametric equations', NULL, NULL, 2, '2026-08-13T00:00:00.000Z'),
('topic_alevel_math_sequences', 'subj_alevel_math', NULL, 'Sequences and Series', 'sequences-and-series', 'Arithmetic and geometric progressions, binomial expansions', NULL, NULL, 3, '2026-08-13T00:00:00.000Z'),
('topic_alevel_math_trig', 'subj_alevel_math', NULL, 'Trigonometry', 'trigonometry', 'Identities, equations, radians and trigonometric graphs', NULL, NULL, 4, '2026-08-13T00:00:00.000Z'),
('topic_alevel_math_logs', 'subj_alevel_math', NULL, 'Exponentials and Logarithms', 'exponentials-and-logarithms', 'Laws of logarithms, exponential growth and decay', NULL, NULL, 5, '2026-08-13T00:00:00.000Z'),
('topic_alevel_math_calculus', 'subj_alevel_math', NULL, 'Differentiation and Integration', 'differentiation-and-integration', 'Chain, product and quotient rules; integration methods and applications', NULL, NULL, 6, '2026-08-13T00:00:00.000Z'),
('topic_alevel_math_vectors', 'subj_alevel_math', NULL, 'Vectors', 'vectors', 'Vector algebra, scalar product and vector equations of lines', NULL, NULL, 7, '2026-08-13T00:00:00.000Z'),
('topic_alevel_math_mechanics', 'subj_alevel_math', NULL, 'Mechanics', 'mechanics', 'Kinematics, forces, Newton''s laws and momentum', NULL, NULL, 8, '2026-08-13T00:00:00.000Z'),
('topic_alevel_math_stats', 'subj_alevel_math', NULL, 'Probability and Statistics', 'probability-and-statistics', 'Data representation, probability, discrete random variables and the normal distribution', NULL, NULL, 9, '2026-08-13T00:00:00.000Z');

INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES
('topic_alevel_fmath_complex', 'subj_alevel_further_math', NULL, 'Complex Numbers', 'complex-numbers', 'Argand diagrams, modulus-argument form and De Moivre''s theorem', NULL, NULL, 1, '2026-08-13T00:00:00.000Z'),
('topic_alevel_fmath_matrices', 'subj_alevel_further_math', NULL, 'Matrices and Linear Transformations', 'matrices-and-linear-transformations', 'Matrix algebra, determinants, inverses and transformations', NULL, NULL, 2, '2026-08-13T00:00:00.000Z'),
('topic_alevel_fmath_diffeq', 'subj_alevel_further_math', NULL, 'Differential Equations', 'differential-equations', 'First and second order differential equations and applications', NULL, NULL, 3, '2026-08-13T00:00:00.000Z'),
('topic_alevel_fmath_polar', 'subj_alevel_further_math', NULL, 'Polar Coordinates and Hyperbolic Functions', 'polar-coordinates-and-hyperbolic-functions', 'Polar curves, areas and hyperbolic identities', NULL, NULL, 4, '2026-08-13T00:00:00.000Z'),
('topic_alevel_fmath_mechanics', 'subj_alevel_further_math', NULL, 'Further Mechanics', 'further-mechanics', 'Circular motion, elasticity, projectiles and moments of inertia', NULL, NULL, 5, '2026-08-13T00:00:00.000Z'),
('topic_alevel_fmath_stats', 'subj_alevel_further_math', NULL, 'Further Probability and Statistics', 'further-probability-and-statistics', 'Continuous distributions, sampling, estimation and hypothesis tests', NULL, NULL, 6, '2026-08-13T00:00:00.000Z');

INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES
('topic_alevel_phys_mechanics', 'subj_alevel_physics', NULL, 'Mechanics and Materials', 'mechanics-and-materials', 'Kinematics, dynamics, momentum, deformation of solids', NULL, NULL, 1, '2026-08-13T00:00:00.000Z'),
('topic_alevel_phys_thermal', 'subj_alevel_physics', NULL, 'Thermal Physics', 'thermal-physics', 'Ideal gases, kinetic theory and thermodynamics', NULL, NULL, 2, '2026-08-13T00:00:00.000Z'),
('topic_alevel_phys_waves', 'subj_alevel_physics', NULL, 'Oscillations and Waves', 'oscillations-and-waves', 'Simple harmonic motion, superposition and interference', NULL, NULL, 3, '2026-08-13T00:00:00.000Z'),
('topic_alevel_phys_fields', 'subj_alevel_physics', NULL, 'Electric and Gravitational Fields', 'electric-and-gravitational-fields', 'Field strength, potential and orbits', NULL, NULL, 4, '2026-08-13T00:00:00.000Z'),
('topic_alevel_phys_em', 'subj_alevel_physics', NULL, 'Capacitance and Electromagnetism', 'capacitance-and-electromagnetism', 'Capacitors, magnetic fields and electromagnetic induction', NULL, NULL, 5, '2026-08-13T00:00:00.000Z'),
('topic_alevel_phys_quantum', 'subj_alevel_physics', NULL, 'Quantum and Nuclear Physics', 'quantum-and-nuclear-physics', 'Photoelectric effect, energy levels, radioactivity and binding energy', NULL, NULL, 6, '2026-08-13T00:00:00.000Z');

INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES
('topic_alevel_chem_atomic', 'subj_alevel_chemistry', NULL, 'Atomic Structure and Chemical Bonding', 'atomic-structure-and-chemical-bonding', 'Electron configuration, ionisation energies, bonding and shapes of molecules', NULL, NULL, 1, '2026-08-13T00:00:00.000Z'),
('topic_alevel_chem_physical', 'subj_alevel_chemistry', NULL, 'Energetics, Kinetics and Equilibria', 'energetics-kinetics-and-equilibria', 'Enthalpy changes, reaction rates, equilibrium constants and pH', NULL, NULL, 2, '2026-08-13T00:00:00.000Z'),
('topic_alevel_chem_redox', 'subj_alevel_chemistry', NULL, 'Redox and Electrochemistry', 'redox-and-electrochemistry', 'Oxidation numbers, electrode potentials and electrolysis', NULL, NULL, 3, '2026-08-13T00:00:00.000Z'),
('topic_alevel_chem_inorganic', 'subj_alevel_chemistry', NULL, 'Periodicity and Transition Metals', 'periodicity-and-transition-metals', 'Group trends, Group 2 and 17 chemistry and transition element complexes', NULL, NULL, 4, '2026-08-13T00:00:00.000Z'),
('topic_alevel_chem_organic', 'subj_alevel_chemistry', NULL, 'Organic Synthesis and Mechanisms', 'organic-synthesis-and-mechanisms', 'Functional group chemistry, mechanisms and synthetic routes', NULL, NULL, 5, '2026-08-13T00:00:00.000Z'),
('topic_alevel_chem_analysis', 'subj_alevel_chemistry', NULL, 'Spectroscopy and Analysis', 'spectroscopy-and-analysis', 'Mass spectrometry, IR and NMR spectroscopy, chromatography', NULL, NULL, 6, '2026-08-13T00:00:00.000Z');

INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES
('topic_alevel_bio_cells', 'subj_alevel_biology', NULL, 'Cells and Biological Molecules', 'cells-and-biological-molecules', 'Ultrastructure, microscopy and the chemistry of life', NULL, NULL, 1, '2026-08-13T00:00:00.000Z'),
('topic_alevel_bio_membranes', 'subj_alevel_biology', NULL, 'Membranes and Transport', 'membranes-and-transport', 'Membrane structure, transport mechanisms and gas exchange', NULL, NULL, 2, '2026-08-13T00:00:00.000Z'),
('topic_alevel_bio_metabolism', 'subj_alevel_biology', NULL, 'Metabolism: Respiration and Photosynthesis', 'metabolism-respiration-photosynthesis', 'ATP, respiration pathways and photosynthesis', NULL, NULL, 3, '2026-08-13T00:00:00.000Z'),
('topic_alevel_bio_genetics', 'subj_alevel_biology', NULL, 'Genetics, Inheritance and Evolution', 'genetics-inheritance-evolution', 'DNA, protein synthesis, inheritance patterns and selection', NULL, NULL, 4, '2026-08-13T00:00:00.000Z'),
('topic_alevel_bio_homeostasis', 'subj_alevel_biology', NULL, 'Control and Homeostasis', 'control-and-homeostasis', 'Nervous and hormonal control, kidney function and homeostasis', NULL, NULL, 5, '2026-08-13T00:00:00.000Z'),
('topic_alevel_bio_biodiversity', 'subj_alevel_biology', NULL, 'Biodiversity and Conservation', 'biodiversity-and-conservation', 'Classification, biodiversity and conservation strategies', NULL, NULL, 6, '2026-08-13T00:00:00.000Z'),
('topic_alevel_bio_biotech', 'subj_alevel_biology', NULL, 'Biotechnology and Gene Technology', 'biotechnology-and-gene-technology', 'Genetic engineering, PCR and applications of biotechnology', NULL, NULL, 7, '2026-08-13T00:00:00.000Z');
