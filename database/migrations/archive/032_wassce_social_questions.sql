-- Migration 032: WASSCE Social Studies Questions
-- 50 questions each for 2024 and 2023 Paper 1

-- WASSCE Social Studies 2024 Paper 1
INSERT OR REPLACE INTO questions (id, subject_id, exam_type_id, paper_type_id, past_paper_id, question_text, question_type, options, correct_answer, explanation, difficulty, marks, question_number) VALUES

-- Environment and National Development (Questions 1-15)
('q_soc_2024_001', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2024_1', 'Which of the following is a renewable natural resource?', 'multiple_choice', '["A. Petroleum", "B. Gold", "C. Forests", "D. Coal"]', 'C', 'Forests can regenerate naturally and are therefore renewable resources.', 'easy', 1, 1),

('q_soc_2024_002', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2024_1', 'The process of removing trees from forests without replacement is called:', 'multiple_choice', '["A. Afforestation", "B. Deforestation", "C. Reforestation", "D. Conservation"]', 'B', 'Deforestation is the permanent removal of trees without adequate replanting.', 'easy', 1, 2),

('q_soc_2024_003', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2024_1', 'Which of the following is an effect of global warming?', 'multiple_choice', '["A. Lower sea levels", "B. Rising sea levels", "C. Increased ice caps", "D. Decreased temperatures"]', 'B', 'Global warming causes ice caps to melt, leading to rising sea levels.', 'easy', 1, 3),

('q_soc_2024_004', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2024_1', 'The main greenhouse gas responsible for climate change is:', 'multiple_choice', '["A. Oxygen", "B. Nitrogen", "C. Carbon dioxide", "D. Hydrogen"]', 'C', 'Carbon dioxide is the primary greenhouse gas contributing to climate change.', 'easy', 1, 4),

('q_soc_2024_005', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2024_1', 'Sustainable development means:', 'multiple_choice', '["A. Using all resources now", "B. Development that meets present needs without compromising future generations", "C. Ignoring environmental concerns", "D. Rapid industrialization at any cost"]', 'B', 'Sustainable development balances economic growth with environmental protection.', 'medium', 1, 5),

('q_soc_2024_006', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2024_1', 'Which human activity contributes most to soil erosion?', 'multiple_choice', '["A. Planting trees", "B. Overgrazing", "C. Mulching", "D. Terracing"]', 'B', 'Overgrazing removes vegetation cover, exposing soil to erosion.', 'easy', 1, 6),

('q_soc_2024_007', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2024_1', 'The ozone layer protects the Earth from:', 'multiple_choice', '["A. Rain", "B. Wind", "C. Ultraviolet radiation", "D. Heat"]', 'C', 'The ozone layer absorbs harmful UV radiation from the sun.', 'easy', 1, 7),

('q_soc_2024_008', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2024_1', 'Which of the following is an example of environmental pollution?', 'multiple_choice', '["A. Planting trees", "B. Dumping waste in rivers", "C. Recycling", "D. Conservation"]', 'B', 'Dumping waste in rivers causes water pollution.', 'easy', 1, 8),

('q_soc_2024_009', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2024_1', 'The term "biodiversity" refers to:', 'multiple_choice', '["A. Types of rocks", "B. Variety of life forms", "C. Weather patterns", "D. Soil types"]', 'B', 'Biodiversity is the variety of all living organisms in an ecosystem.', 'medium', 1, 9),

('q_soc_2024_010', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2024_1', 'Ghana''s main cash crop is:', 'multiple_choice', '["A. Rice", "B. Cocoa", "C. Maize", "D. Wheat"]', 'B', 'Cocoa is Ghana''s main cash crop and a major export commodity.', 'easy', 1, 10),

('q_soc_2024_011', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2024_1', 'Which of the following is a method of waste management?', 'multiple_choice', '["A. Open dumping", "B. Recycling", "C. Bush burning", "D. River dumping"]', 'B', 'Recycling is an environmentally friendly waste management method.', 'easy', 1, 11),

('q_soc_2024_012', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2024_1', 'The largest lake in West Africa is:', 'multiple_choice', '["A. Lake Chad", "B. Lake Volta", "C. Lake Victoria", "D. Lake Bosumtwi"]', 'B', 'Lake Volta in Ghana is the largest artificial lake in West Africa by surface area.', 'medium', 1, 12),

('q_soc_2024_013', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2024_1', 'Which sector of the economy deals with extraction of raw materials?', 'multiple_choice', '["A. Primary sector", "B. Secondary sector", "C. Tertiary sector", "D. Quaternary sector"]', 'A', 'The primary sector involves extraction of natural resources like farming and mining.', 'medium', 1, 13),

('q_soc_2024_014', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2024_1', 'Desertification is mainly caused by:', 'multiple_choice', '["A. Planting trees", "B. Overuse of land and drought", "C. Heavy rainfall", "D. Irrigation"]', 'B', 'Desertification results from overgrazing, deforestation, and drought.', 'medium', 1, 14),

('q_soc_2024_015', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2024_1', 'Which international body is concerned with environmental issues?', 'multiple_choice', '["A. IMF", "B. World Bank", "C. UNEP", "D. WTO"]', 'C', 'UNEP (United Nations Environment Programme) focuses on environmental issues.', 'medium', 1, 15),

-- Social and Cultural Issues (Questions 16-30)
('q_soc_2024_016', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2024_1', 'Which of the following is a social problem?', 'multiple_choice', '["A. Good governance", "B. Drug abuse", "C. Economic growth", "D. Education"]', 'B', 'Drug abuse is a social problem affecting individuals and communities.', 'easy', 1, 16),

('q_soc_2024_017', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2024_1', 'Gender equality means:', 'multiple_choice', '["A. Women having more rights than men", "B. Equal rights and opportunities for all genders", "C. Men having more rights than women", "D. Separation of genders"]', 'B', 'Gender equality ensures equal rights and opportunities for all genders.', 'easy', 1, 17),

('q_soc_2024_018', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2024_1', 'The main cause of rural-urban migration is:', 'multiple_choice', '["A. Better healthcare in rural areas", "B. Search for better opportunities in cities", "C. Lower cost of living in cities", "D. Less pollution in cities"]', 'B', 'People migrate to cities seeking better jobs, education, and opportunities.', 'easy', 1, 18),

('q_soc_2024_019', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2024_1', 'Which of the following is a responsibility of a citizen?', 'multiple_choice', '["A. Evading taxes", "B. Obeying the laws", "C. Ignoring elections", "D. Promoting violence"]', 'B', 'Citizens are responsible for obeying the laws of their country.', 'easy', 1, 19),

('q_soc_2024_020', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2024_1', 'Culture is best defined as:', 'multiple_choice', '["A. Only traditional clothing", "B. The total way of life of a people", "C. Only language", "D. Only religion"]', 'B', 'Culture encompasses all aspects of a people''s way of life.', 'easy', 1, 20),

('q_soc_2024_021', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2024_1', 'Socialization is the process by which:', 'multiple_choice', '["A. People learn to hate others", "B. Individuals learn the norms and values of society", "C. People become isolated", "D. Conflicts are created"]', 'B', 'Socialization teaches individuals the norms, values, and behaviors of society.', 'medium', 1, 21),

('q_soc_2024_022', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2024_1', 'The extended family system in Africa:', 'multiple_choice', '["A. Includes only parents and children", "B. Includes grandparents, uncles, aunts, and cousins", "C. Excludes grandparents", "D. Only includes married couples"]', 'B', 'The extended family includes relatives beyond the nuclear family.', 'easy', 1, 22),

('q_soc_2024_023', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2024_1', 'Child labor is harmful because:', 'multiple_choice', '["A. It provides income for families", "B. It deprives children of education and normal development", "C. It helps children learn skills", "D. It reduces unemployment"]', 'B', 'Child labor prevents children from getting proper education and development.', 'easy', 1, 23),

('q_soc_2024_024', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2024_1', 'HIV/AIDS is primarily spread through:', 'multiple_choice', '["A. Mosquito bites", "B. Unprotected sexual contact and blood contact", "C. Sharing food", "D. Handshakes"]', 'B', 'HIV spreads through unprotected sex, blood contact, and mother-to-child transmission.', 'easy', 1, 24),

('q_soc_2024_025', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2024_1', 'A taboo is:', 'multiple_choice', '["A. A law made by government", "B. A cultural prohibition", "C. A type of food", "D. A religious book"]', 'B', 'Taboos are cultural prohibitions against certain actions or behaviors.', 'medium', 1, 25),

('q_soc_2024_026', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2024_1', 'Which of the following is a traditional institution?', 'multiple_choice', '["A. Parliament", "B. Chieftaincy", "C. Supreme Court", "D. Police Service"]', 'B', 'Chieftaincy is a traditional institution in African societies.', 'easy', 1, 26),

('q_soc_2024_027', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2024_1', 'Teenage pregnancy can lead to:', 'multiple_choice', '["A. Better education", "B. School dropout", "C. Higher income", "D. Improved health"]', 'B', 'Teenage pregnancy often leads to school dropout and limited opportunities.', 'easy', 1, 27),

('q_soc_2024_028', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2024_1', 'Patriotism means:', 'multiple_choice', '["A. Hatred for one''s country", "B. Love and devotion to one''s country", "C. Ignoring national issues", "D. Working against national interest"]', 'B', 'Patriotism is love, devotion, and loyalty to one''s country.', 'easy', 1, 28),

('q_soc_2024_029', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2024_1', 'The right to vote is called:', 'multiple_choice', '["A. Suffrage", "B. Referendum", "C. Plebiscite", "D. Franchise"]', 'A', 'Suffrage is the right to vote in political elections. (Franchise is also acceptable)', 'medium', 1, 29),

('q_soc_2024_030', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2024_1', 'Which of the following promotes national unity?', 'multiple_choice', '["A. Tribalism", "B. National festivals and celebrations", "C. Religious conflicts", "D. Political violence"]', 'B', 'National festivals and celebrations bring people together and promote unity.', 'easy', 1, 30),

-- Governance and Civics (Questions 31-50)
('q_soc_2024_031', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2024_1', 'The three arms of government are:', 'multiple_choice', '["A. President, Vice President, Speaker", "B. Executive, Legislature, Judiciary", "C. Army, Police, Navy", "D. Federal, State, Local"]', 'B', 'The three arms are Executive, Legislature, and Judiciary.', 'easy', 1, 31),

('q_soc_2024_032', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2024_1', 'The principle of separation of powers ensures:', 'multiple_choice', '["A. Concentration of power", "B. Prevention of abuse of power", "C. Military rule", "D. One-party system"]', 'B', 'Separation of powers prevents any single branch from having too much power.', 'medium', 1, 32),

('q_soc_2024_033', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2024_1', 'Ghana gained independence in:', 'multiple_choice', '["A. 1957", "B. 1960", "C. 1963", "D. 1966"]', 'A', 'Ghana gained independence from Britain on 6th March, 1957.', 'easy', 1, 33),

('q_soc_2024_034', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2024_1', 'The head of the Judiciary in Ghana is the:', 'multiple_choice', '["A. President", "B. Chief Justice", "C. Speaker of Parliament", "D. Attorney General"]', 'B', 'The Chief Justice heads the Judiciary in Ghana.', 'easy', 1, 34),

('q_soc_2024_035', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2024_1', 'Democracy is based on:', 'multiple_choice', '["A. Military power", "B. Rule of the people", "C. Dictatorship", "D. Hereditary rule"]', 'B', 'Democracy means government by the people, for the people.', 'easy', 1, 35),

('q_soc_2024_036', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2024_1', 'The body responsible for conducting elections in Ghana is:', 'multiple_choice', '["A. Police Service", "B. Electoral Commission", "C. Parliament", "D. Supreme Court"]', 'B', 'The Electoral Commission of Ghana organizes and conducts elections.', 'easy', 1, 36),

('q_soc_2024_037', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2024_1', 'Human rights include:', 'multiple_choice', '["A. Only economic rights", "B. Right to life, liberty, and dignity", "C. Only political rights", "D. Only cultural rights"]', 'B', 'Human rights encompass civil, political, economic, social, and cultural rights.', 'easy', 1, 37),

('q_soc_2024_038', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2024_1', 'Corruption in government leads to:', 'multiple_choice', '["A. Development", "B. Poverty and underdevelopment", "C. Prosperity", "D. Equality"]', 'B', 'Corruption diverts resources and hinders national development.', 'easy', 1, 38),

('q_soc_2024_039', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2024_1', 'The headquarters of the African Union is in:', 'multiple_choice', '["A. Cairo", "B. Addis Ababa", "C. Nairobi", "D. Pretoria"]', 'B', 'The African Union headquarters is located in Addis Ababa, Ethiopia.', 'medium', 1, 39),

('q_soc_2024_040', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2024_1', 'ECOWAS stands for:', 'multiple_choice', '["A. East African Community of West African States", "B. Economic Community of West African States", "C. European Community of West African States", "D. Environmental Community of West African States"]', 'B', 'ECOWAS is the Economic Community of West African States.', 'easy', 1, 40),

('q_soc_2024_041', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2024_1', 'The United Nations was established in:', 'multiple_choice', '["A. 1939", "B. 1945", "C. 1950", "D. 1960"]', 'B', 'The United Nations was established on 24th October, 1945.', 'medium', 1, 41),

('q_soc_2024_042', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2024_1', 'The legislative body in Ghana is called:', 'multiple_choice', '["A. Congress", "B. Parliament", "C. Senate", "D. Assembly"]', 'B', 'Ghana''s legislative body is the Parliament.', 'easy', 1, 42),

('q_soc_2024_043', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2024_1', 'Rule of law means:', 'multiple_choice', '["A. The ruler makes the law", "B. Everyone is equal before the law", "C. Laws apply only to some people", "D. Laws can be ignored"]', 'B', 'Rule of law means everyone is subject to the same laws.', 'medium', 1, 43),

('q_soc_2024_044', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2024_1', 'A constitution is:', 'multiple_choice', '["A. A book about history", "B. The supreme law of a country", "C. A religious text", "D. A political party document"]', 'B', 'A constitution is the supreme law governing a nation.', 'easy', 1, 44),

('q_soc_2024_045', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2024_1', 'Which of the following is a function of political parties?', 'multiple_choice', '["A. Making laws", "B. Educating the public on political issues", "C. Judging cases", "D. Collecting taxes"]', 'B', 'Political parties educate the public and nominate candidates for elections.', 'medium', 1, 45),

('q_soc_2024_046', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2024_1', 'The minimum voting age in Ghana is:', 'multiple_choice', '["A. 16 years", "B. 18 years", "C. 21 years", "D. 25 years"]', 'B', 'Citizens aged 18 and above can vote in Ghana.', 'easy', 1, 46),

('q_soc_2024_047', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2024_1', 'Civil society organizations help to:', 'multiple_choice', '["A. Weaken democracy", "B. Hold government accountable", "C. Promote dictatorship", "D. Reduce citizen participation"]', 'B', 'Civil society organizations monitor government and advocate for citizens.', 'medium', 1, 47),

('q_soc_2024_048', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2024_1', 'Kwame Nkrumah was Ghana''s:', 'multiple_choice', '["A. Second President", "B. First Prime Minister and President", "C. First Chief Justice", "D. Last colonial governor"]', 'B', 'Kwame Nkrumah was Ghana''s first Prime Minister and later first President.', 'easy', 1, 48),

('q_soc_2024_049', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2024_1', 'A by-election is held when:', 'multiple_choice', '["A. The President resigns", "B. A parliamentary seat becomes vacant", "C. Local elections are needed", "D. The government dissolves"]', 'B', 'By-elections fill vacant parliamentary seats between general elections.', 'medium', 1, 49),

('q_soc_2024_050', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2024_1', 'Good governance includes:', 'multiple_choice', '["A. Corruption", "B. Transparency and accountability", "C. Nepotism", "D. Dictatorship"]', 'B', 'Good governance involves transparency, accountability, and participation.', 'easy', 1, 50),

-- WASSCE Social Studies 2023 Paper 1
('q_soc_2023_001', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2023_1', 'The environment consists of:', 'multiple_choice', '["A. Only plants and animals", "B. All living and non-living things around us", "C. Only water and air", "D. Only rocks and soil"]', 'B', 'The environment includes all living and non-living components.', 'easy', 1, 1),

('q_soc_2023_002', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2023_1', 'Population growth rate is the difference between:', 'multiple_choice', '["A. Males and females", "B. Birth rate and death rate", "C. Urban and rural population", "D. Young and old people"]', 'B', 'Population growth rate = Birth rate - Death rate (plus net migration).', 'medium', 1, 2),

('q_soc_2023_003', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2023_1', 'Which of the following is a pull factor of migration?', 'multiple_choice', '["A. War", "B. Famine", "C. Job opportunities", "D. Natural disasters"]', 'C', 'Pull factors attract people to new areas; job opportunities is a pull factor.', 'easy', 1, 3),

('q_soc_2023_004', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2023_1', 'Sanitation refers to:', 'multiple_choice', '["A. Cooking food", "B. Proper disposal of waste", "C. Building houses", "D. Growing crops"]', 'B', 'Sanitation involves proper waste disposal and maintenance of hygiene.', 'easy', 1, 4),

('q_soc_2023_005', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2023_1', 'Which disease is commonly associated with poor sanitation?', 'multiple_choice', '["A. Malaria", "B. Cholera", "C. Diabetes", "D. Asthma"]', 'B', 'Cholera is caused by contaminated water and poor sanitation.', 'easy', 1, 5),

('q_soc_2023_006', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2023_1', 'The main source of water pollution is:', 'multiple_choice', '["A. Rain", "B. Industrial waste", "C. Underground water", "D. Evaporation"]', 'B', 'Industrial waste is a major source of water pollution.', 'easy', 1, 6),

('q_soc_2023_007', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2023_1', 'Land degradation can be prevented by:', 'multiple_choice', '["A. Deforestation", "B. Overgrazing", "C. Afforestation", "D. Bush burning"]', 'C', 'Afforestation (planting trees) helps prevent land degradation.', 'easy', 1, 7),

('q_soc_2023_008', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2023_1', 'The capital city of Ghana is:', 'multiple_choice', '["A. Kumasi", "B. Accra", "C. Tamale", "D. Cape Coast"]', 'B', 'Accra is the capital city of Ghana.', 'easy', 1, 8),

('q_soc_2023_009', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2023_1', 'Tourism contributes to national development by:', 'multiple_choice', '["A. Increasing pollution", "B. Generating foreign exchange", "C. Destroying culture", "D. Reducing employment"]', 'B', 'Tourism brings foreign exchange and creates employment opportunities.', 'easy', 1, 9),

('q_soc_2023_010', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2023_1', 'Energy conservation means:', 'multiple_choice', '["A. Wasting energy", "B. Using energy efficiently", "C. Not using energy", "D. Increasing energy production"]', 'B', 'Energy conservation involves using energy resources efficiently.', 'easy', 1, 10),

('q_soc_2023_011', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2023_1', 'Family planning helps to:', 'multiple_choice', '["A. Increase population rapidly", "B. Control population growth", "C. Promote early marriage", "D. Encourage teenage pregnancy"]', 'B', 'Family planning helps couples control the number and timing of children.', 'easy', 1, 11),

('q_soc_2023_012', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2023_1', 'The nuclear family consists of:', 'multiple_choice', '["A. Parents, children, and grandparents", "B. Parents and their children only", "C. All relatives", "D. Friends and neighbors"]', 'B', 'The nuclear family includes only parents and their children.', 'easy', 1, 12),

('q_soc_2023_013', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2023_1', 'Adolescence is the period:', 'multiple_choice', '["A. From birth to 5 years", "B. Between childhood and adulthood", "C. After retirement", "D. During infancy"]', 'B', 'Adolescence is the transitional stage between childhood and adulthood.', 'easy', 1, 13),

('q_soc_2023_014', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2023_1', 'Which agency protects children''s rights in Ghana?', 'multiple_choice', '["A. Electoral Commission", "B. Department of Social Welfare", "C. Ghana Police Service", "D. Immigration Service"]', 'B', 'The Department of Social Welfare protects children''s rights.', 'medium', 1, 14),

('q_soc_2023_015', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2023_1', 'Substance abuse includes:', 'multiple_choice', '["A. Taking prescribed medicine", "B. Misuse of drugs and alcohol", "C. Drinking water", "D. Eating healthy food"]', 'B', 'Substance abuse is the harmful use of drugs, alcohol, or other substances.', 'easy', 1, 15),

('q_soc_2023_016', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2023_1', 'Peer pressure can lead to:', 'multiple_choice', '["A. Always positive behavior", "B. Both positive and negative behavior", "C. Only academic success", "D. Only good health"]', 'B', 'Peer pressure can influence people positively or negatively.', 'easy', 1, 16),

('q_soc_2023_017', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2023_1', 'Self-esteem refers to:', 'multiple_choice', '["A. How others see you", "B. How you value yourself", "C. Your physical appearance", "D. Your wealth"]', 'B', 'Self-esteem is the value and respect you have for yourself.', 'easy', 1, 17),

('q_soc_2023_018', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2023_1', 'Religious tolerance means:', 'multiple_choice', '["A. Forcing others to convert", "B. Accepting different religious beliefs", "C. Rejecting all religions", "D. Having no religion"]', 'B', 'Religious tolerance means respecting and accepting different religious beliefs.', 'easy', 1, 18),

('q_soc_2023_019', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2023_1', 'A stereotype is:', 'multiple_choice', '["A. An accurate description", "B. An oversimplified generalization about a group", "C. A scientific fact", "D. A type of culture"]', 'B', 'Stereotypes are oversimplified generalizations about groups of people.', 'medium', 1, 19),

('q_soc_2023_020', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2023_1', 'Conflict resolution involves:', 'multiple_choice', '["A. Starting more conflicts", "B. Finding peaceful solutions to disagreements", "C. Ignoring problems", "D. Using violence"]', 'B', 'Conflict resolution seeks peaceful solutions to disputes.', 'easy', 1, 20),

('q_soc_2023_021', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2023_1', 'The main function of the Executive is to:', 'multiple_choice', '["A. Make laws", "B. Implement laws", "C. Interpret laws", "D. Elect leaders"]', 'B', 'The Executive implements and enforces laws.', 'easy', 1, 21),

('q_soc_2023_022', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2023_1', 'The main function of the Legislature is to:', 'multiple_choice', '["A. Make laws", "B. Implement laws", "C. Interpret laws", "D. Punish criminals"]', 'A', 'The Legislature makes laws for the country.', 'easy', 1, 22),

('q_soc_2023_023', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2023_1', 'The main function of the Judiciary is to:', 'multiple_choice', '["A. Make laws", "B. Implement laws", "C. Interpret laws and administer justice", "D. Collect taxes"]', 'C', 'The Judiciary interprets laws and administers justice.', 'easy', 1, 23),

('q_soc_2023_024', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2023_1', 'Ghana has how many regions?', 'multiple_choice', '["A. 10", "B. 14", "C. 16", "D. 20"]', 'C', 'Ghana currently has 16 administrative regions.', 'easy', 1, 24),

('q_soc_2023_025', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2023_1', 'Decentralization involves:', 'multiple_choice', '["A. Centralizing all power", "B. Transferring power to local governments", "C. Removing local governments", "D. Military control"]', 'B', 'Decentralization transfers power and resources to local government units.', 'medium', 1, 25),

('q_soc_2023_026', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2023_1', 'The right to fair trial is a:', 'multiple_choice', '["A. Political right", "B. Civil right", "C. Economic right", "D. Cultural right"]', 'B', 'The right to fair trial is a civil right ensuring due process.', 'medium', 1, 26),

('q_soc_2023_027', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2023_1', 'Freedom of speech allows citizens to:', 'multiple_choice', '["A. Say anything without consequences", "B. Express opinions within the law", "C. Spread false information", "D. Incite violence"]', 'B', 'Freedom of speech allows expression of opinions within legal limits.', 'medium', 1, 27),

('q_soc_2023_028', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2023_1', 'Nationalism means:', 'multiple_choice', '["A. Hatred for other nations", "B. Love and loyalty to one''s nation", "C. Colonialism", "D. International conflict"]', 'B', 'Nationalism is devotion and loyalty to one''s nation.', 'easy', 1, 28),

('q_soc_2023_029', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2023_1', 'Colonialism in Africa refers to:', 'multiple_choice', '["A. African countries ruling Europe", "B. European domination of African territories", "C. African trade with Asia", "D. Independence movements"]', 'B', 'Colonialism was European domination and control of African territories.', 'easy', 1, 29),

('q_soc_2023_030', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2023_1', 'The Organization of African Unity (OAU) is now called:', 'multiple_choice', '["A. United Nations", "B. African Union", "C. ECOWAS", "D. Commonwealth"]', 'B', 'OAU was transformed into the African Union (AU) in 2002.', 'easy', 1, 30),

('q_soc_2023_031', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2023_1', 'Pan-Africanism promotes:', 'multiple_choice', '["A. Division among Africans", "B. Unity and solidarity among Africans", "C. European colonialism", "D. Tribal conflicts"]', 'B', 'Pan-Africanism promotes unity and solidarity among African peoples.', 'easy', 1, 31),

('q_soc_2023_032', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2023_1', 'The slave trade affected Africa by:', 'multiple_choice', '["A. Increasing population", "B. Depleting the workforce and causing instability", "C. Promoting development", "D. Improving education"]', 'B', 'The slave trade depleted Africa''s workforce and caused social instability.', 'medium', 1, 32),

('q_soc_2023_033', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2023_1', 'Which country was never colonized in Africa?', 'multiple_choice', '["A. Nigeria", "B. Ethiopia", "C. Ghana", "D. Kenya"]', 'B', 'Ethiopia was never fully colonized by European powers.', 'medium', 1, 33),

('q_soc_2023_034', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2023_1', 'Globalization refers to:', 'multiple_choice', '["A. Only trade between countries", "B. Increased interconnection of world economies and cultures", "C. Isolation of countries", "D. Only military alliances"]', 'B', 'Globalization is the increasing interconnection of world economies, societies, and cultures.', 'medium', 1, 34),

('q_soc_2023_035', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2023_1', 'A disadvantage of globalization is:', 'multiple_choice', '["A. Increased trade", "B. Cultural erosion", "C. Better communication", "D. Improved technology"]', 'B', 'Globalization can lead to loss of local cultures and traditions.', 'medium', 1, 35),

('q_soc_2023_036', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2023_1', 'The Universal Declaration of Human Rights was adopted in:', 'multiple_choice', '["A. 1945", "B. 1948", "C. 1960", "D. 1975"]', 'B', 'The UDHR was adopted by the UN on December 10, 1948.', 'medium', 1, 36),

('q_soc_2023_037', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2023_1', 'Taxation is important because it:', 'multiple_choice', '["A. Makes citizens poor", "B. Provides revenue for government services", "C. Only benefits the rich", "D. Is voluntary"]', 'B', 'Taxation provides revenue for public services and development.', 'easy', 1, 37),

('q_soc_2023_038', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2023_1', 'Unemployment is a problem because it:', 'multiple_choice', '["A. Increases national income", "B. Leads to poverty and crime", "C. Improves living standards", "D. Creates more jobs"]', 'B', 'Unemployment leads to poverty, crime, and social problems.', 'easy', 1, 38),

('q_soc_2023_039', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2023_1', 'Inflation means:', 'multiple_choice', '["A. Decrease in prices", "B. General increase in prices", "C. Stable prices", "D. No change in economy"]', 'B', 'Inflation is a general rise in the price level of goods and services.', 'easy', 1, 39),

('q_soc_2023_040', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2023_1', 'The Bank of Ghana is responsible for:', 'multiple_choice', '["A. Providing loans to individuals", "B. Regulating the banking sector and monetary policy", "C. Selling goods", "D. Collecting taxes"]', 'B', 'The Bank of Ghana is the central bank responsible for monetary policy.', 'medium', 1, 40),

('q_soc_2023_041', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2023_1', 'Free and fair elections require:', 'multiple_choice', '["A. Military involvement", "B. Independent electoral commission", "C. One-party system", "D. Voter intimidation"]', 'B', 'Free and fair elections require an independent electoral body.', 'easy', 1, 41),

('q_soc_2023_042', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2023_1', 'A referendum is:', 'multiple_choice', '["A. A type of election", "B. A direct vote on a specific issue", "C. A military coup", "D. A court case"]', 'B', 'A referendum is a direct vote by citizens on a specific proposal or issue.', 'medium', 1, 42),

('q_soc_2023_043', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2023_1', 'Public opinion is important because it:', 'multiple_choice', '["A. Can be ignored", "B. Influences government policy", "C. Has no effect", "D. Only matters during elections"]', 'B', 'Public opinion influences government decisions and policies.', 'easy', 1, 43),

('q_soc_2023_044', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2023_1', 'The media plays the role of:', 'multiple_choice', '["A. Making laws", "B. Informing and educating the public", "C. Collecting taxes", "D. Judging cases"]', 'B', 'The media informs, educates, and entertains the public.', 'easy', 1, 44),

('q_soc_2023_045', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2023_1', 'Community development involves:', 'multiple_choice', '["A. Individual efforts only", "B. Collective efforts to improve the community", "C. Government alone", "D. Foreign aid only"]', 'B', 'Community development requires collective action to improve living conditions.', 'easy', 1, 45),

('q_soc_2023_046', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2023_1', 'Entrepreneurship involves:', 'multiple_choice', '["A. Working for government", "B. Starting and managing a business", "C. Only investing money", "D. Only working for wages"]', 'B', 'Entrepreneurship is starting and managing a business venture.', 'easy', 1, 46),

('q_soc_2023_047', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2023_1', 'Poverty can be reduced by:', 'multiple_choice', '["A. Ignoring education", "B. Creating employment opportunities", "C. Reducing healthcare", "D. Increasing corruption"]', 'B', 'Creating jobs and opportunities helps reduce poverty.', 'easy', 1, 47),

('q_soc_2023_048', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2023_1', 'The Sustainable Development Goals (SDGs) aim to:', 'multiple_choice', '["A. Increase poverty", "B. Achieve sustainable development worldwide", "C. Promote inequality", "D. Destroy the environment"]', 'B', 'The SDGs are a universal call to action to end poverty and protect the planet.', 'medium', 1, 48),

('q_soc_2023_049', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2023_1', 'National security involves:', 'multiple_choice', '["A. Only military defense", "B. Protection of citizens and the nation", "C. Only police work", "D. Only border control"]', 'B', 'National security encompasses all measures to protect citizens and the nation.', 'medium', 1, 49),

('q_soc_2023_050', 'subj_wassce_social', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_soc_2023_1', 'Active citizenship involves:', 'multiple_choice', '["A. Ignoring community issues", "B. Participating in civic duties and community development", "C. Only voting", "D. Breaking laws"]', 'B', 'Active citizenship means participating in civic duties and community affairs.', 'easy', 1, 50);
