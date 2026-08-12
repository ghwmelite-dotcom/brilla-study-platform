-- Migration 039: BECE Social Studies Questions
-- 40 questions each for 2024 and 2023 Paper 1

INSERT OR REPLACE INTO questions (id, subject_id, exam_type_id, paper_type_id, past_paper_id, question_text, question_type, options, correct_answer, explanation, difficulty, marks, question_number) VALUES

-- BECE Social Studies 2024 Paper 1
('q_bece_soc_2024_001', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2024_1', 'The capital of Ghana is:', 'multiple_choice', '["A. Kumasi", "B. Accra", "C. Tamale", "D. Cape Coast"]', 'B', 'Accra is the capital city of Ghana.', 'easy', 1, 1),

('q_bece_soc_2024_002', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2024_1', 'Ghana gained independence in:', 'multiple_choice', '["A. 1960", "B. 1963", "C. 1957", "D. 1966"]', 'C', 'Ghana gained independence on 6th March, 1957.', 'easy', 1, 2),

('q_bece_soc_2024_003', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2024_1', 'Who was the first President of Ghana?', 'multiple_choice', '["A. J.J. Rawlings", "B. Kwame Nkrumah", "C. J.A. Kufuor", "D. Kofi Busia"]', 'B', 'Dr. Kwame Nkrumah was Ghana''s first President.', 'easy', 1, 3),

('q_bece_soc_2024_004', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2024_1', 'How many regions does Ghana have?', 'multiple_choice', '["A. 10", "B. 12", "C. 16", "D. 20"]', 'C', 'Ghana currently has 16 administrative regions.', 'easy', 1, 4),

('q_bece_soc_2024_005', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2024_1', 'The main cash crop of Ghana is:', 'multiple_choice', '["A. Rice", "B. Maize", "C. Cocoa", "D. Groundnut"]', 'C', 'Cocoa is Ghana''s main cash crop.', 'easy', 1, 5),

('q_bece_soc_2024_006', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2024_1', 'The symbol on the Ghana coat of arms that represents agriculture is:', 'multiple_choice', '["A. Eagle", "B. Cocoa tree", "C. Gold bar", "D. Black star"]', 'B', 'The cocoa tree represents agriculture.', 'easy', 1, 6),

('q_bece_soc_2024_007', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2024_1', 'The three arms of government are:', 'multiple_choice', '["A. Police, Army, Navy", "B. President, Parliament, Courts", "C. Executive, Legislature, Judiciary", "D. Chiefs, Elders, Youth"]', 'C', 'Executive, Legislature, and Judiciary are the three arms.', 'easy', 1, 7),

('q_bece_soc_2024_008', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2024_1', 'A nuclear family consists of:', 'multiple_choice', '["A. Father, mother, and their children", "B. Grandparents and grandchildren", "C. All relatives", "D. Father and children only"]', 'A', 'A nuclear family includes parents and their children.', 'easy', 1, 8),

('q_bece_soc_2024_009', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2024_1', 'The minimum voting age in Ghana is:', 'multiple_choice', '["A. 16 years", "B. 18 years", "C. 21 years", "D. 25 years"]', 'B', 'Citizens 18 years and above can vote in Ghana.', 'easy', 1, 9),

('q_bece_soc_2024_010', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2024_1', 'A person who loves his country is called a:', 'multiple_choice', '["A. Patriot", "B. Traitor", "C. Rebel", "D. Criminal"]', 'A', 'A patriot loves and supports their country.', 'easy', 1, 10),

('q_bece_soc_2024_011', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2024_1', 'Which of the following is an example of a social problem?', 'multiple_choice', '["A. Economic growth", "B. Drug abuse", "C. Good health", "D. Education"]', 'B', 'Drug abuse is a social problem in society.', 'easy', 1, 11),

('q_bece_soc_2024_012', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2024_1', 'The national pledge promotes:', 'multiple_choice', '["A. Division", "B. Corruption", "C. Unity and patriotism", "D. Violence"]', 'C', 'The national pledge promotes love for country and unity.', 'easy', 1, 12),

('q_bece_soc_2024_013', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2024_1', 'Puberty is a period when:', 'multiple_choice', '["A. Children learn to walk", "B. Physical and emotional changes occur", "C. People retire from work", "D. Babies are born"]', 'B', 'Puberty involves physical and emotional changes as children mature.', 'easy', 1, 13),

('q_bece_soc_2024_014', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2024_1', 'An example of a renewable resource is:', 'multiple_choice', '["A. Coal", "B. Gold", "C. Forest", "D. Diamond"]', 'C', 'Forests are renewable as trees can be replanted.', 'easy', 1, 14),

('q_bece_soc_2024_015', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2024_1', 'The Lake Volta was created for:', 'multiple_choice', '["A. Fishing only", "B. Swimming", "C. Generating electricity", "D. Boat racing"]', 'C', 'Lake Volta was created for hydroelectric power generation.', 'easy', 1, 15),

('q_bece_soc_2024_016', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2024_1', 'Deforestation leads to:', 'multiple_choice', '["A. More rain", "B. Climate change and soil erosion", "C. Cooler temperatures", "D. Cleaner air"]', 'B', 'Cutting down trees causes climate change and erosion.', 'easy', 1, 16),

('q_bece_soc_2024_017', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2024_1', 'HIV/AIDS can be prevented by:', 'multiple_choice', '["A. Sharing needles", "B. Abstinence and faithfulness", "C. Ignoring the disease", "D. Avoiding vaccination"]', 'B', 'Abstinence and faithfulness help prevent HIV transmission.', 'easy', 1, 17),

('q_bece_soc_2024_018', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2024_1', 'Child labor is wrong because:', 'multiple_choice', '["A. Children should work for free", "B. It denies children education and childhood", "C. Children are too strong to work", "D. Children don''t need money"]', 'B', 'Child labor deprives children of education and proper development.', 'easy', 1, 18),

('q_bece_soc_2024_019', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2024_1', 'The Ghana National Fire Service helps to:', 'multiple_choice', '["A. Arrest criminals", "B. Fight fires and educate about fire safety", "C. Build roads", "D. Collect taxes"]', 'B', 'The Fire Service fights fires and promotes fire prevention.', 'easy', 1, 19),

('q_bece_soc_2024_020', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2024_1', 'A responsible citizen should:', 'multiple_choice', '["A. Evade taxes", "B. Obey the laws of the land", "C. Litter everywhere", "D. Ignore elections"]', 'B', 'Good citizens obey laws and fulfill civic duties.', 'easy', 1, 20),

('q_bece_soc_2024_021', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2024_1', 'Tourism is important because it:', 'multiple_choice', '["A. Destroys culture", "B. Brings foreign exchange and creates jobs", "C. Causes pollution only", "D. Has no benefits"]', 'B', 'Tourism generates income and employment opportunities.', 'easy', 1, 21),

('q_bece_soc_2024_022', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2024_1', 'The role of the Police is to:', 'multiple_choice', '["A. Teach in schools", "B. Maintain law and order", "C. Treat patients", "D. Build houses"]', 'B', 'Police maintain peace and enforce laws.', 'easy', 1, 22),

('q_bece_soc_2024_023', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2024_1', 'Independence Day in Ghana is celebrated on:', 'multiple_choice', '["A. 1st July", "B. 6th March", "C. 25th December", "D. 1st May"]', 'B', 'Independence Day is March 6th.', 'easy', 1, 23),

('q_bece_soc_2024_024', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2024_1', 'Peer pressure can lead to:', 'multiple_choice', '["A. Only positive outcomes", "B. Both positive and negative outcomes", "C. Only negative outcomes", "D. No effect at all"]', 'B', 'Peer pressure can be positive or negative.', 'easy', 1, 24),

('q_bece_soc_2024_025', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2024_1', 'The main function of the Legislature is to:', 'multiple_choice', '["A. Enforce laws", "B. Make laws", "C. Interpret laws", "D. Collect taxes"]', 'B', 'The Legislature (Parliament) makes laws.', 'easy', 1, 25),

('q_bece_soc_2024_026', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2024_1', 'A map shows:', 'multiple_choice', '["A. Only mountains", "B. Only rivers", "C. Features of an area on a flat surface", "D. Only roads"]', 'C', 'Maps represent areas and their features on a flat surface.', 'easy', 1, 26),

('q_bece_soc_2024_027', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2024_1', 'Sanitation involves:', 'multiple_choice', '["A. Littering", "B. Proper waste disposal and cleanliness", "C. Open defecation", "D. Burning refuse in public"]', 'B', 'Good sanitation means proper hygiene and waste management.', 'easy', 1, 27),

('q_bece_soc_2024_028', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2024_1', 'The continent on which Ghana is located is:', 'multiple_choice', '["A. Europe", "B. Asia", "C. Africa", "D. North America"]', 'C', 'Ghana is in West Africa.', 'easy', 1, 28),

('q_bece_soc_2024_029', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2024_1', 'Democracy means:', 'multiple_choice', '["A. Rule by one person", "B. Government by the people", "C. Rule by the military", "D. Rule by chiefs only"]', 'B', 'Democracy is government of, by, and for the people.', 'easy', 1, 29),

('q_bece_soc_2024_030', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2024_1', 'Which is NOT a right of a child?', 'multiple_choice', '["A. Right to education", "B. Right to health", "C. Right to vote", "D. Right to food"]', 'C', 'Children cannot vote until they are 18 years old.', 'easy', 1, 30),

('q_bece_soc_2024_031', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2024_1', 'ECOWAS stands for:', 'multiple_choice', '["A. European Community of West African States", "B. Economic Community of West African States", "C. Eastern Community of West African States", "D. Educational Community of West African States"]', 'B', 'ECOWAS is the Economic Community of West African States.', 'medium', 1, 31),

('q_bece_soc_2024_032', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2024_1', 'Culture includes:', 'multiple_choice', '["A. Only food", "B. Beliefs, customs, and way of life", "C. Only language", "D. Only clothing"]', 'B', 'Culture includes all aspects of a people''s way of life.', 'easy', 1, 32),

('q_bece_soc_2024_033', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2024_1', 'The largest lake in Ghana is:', 'multiple_choice', '["A. Lake Bosumtwi", "B. Lake Volta", "C. Lake Chad", "D. Lake Victoria"]', 'B', 'Lake Volta is the largest artificial lake in Ghana.', 'easy', 1, 33),

('q_bece_soc_2024_034', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2024_1', 'One effect of teenage pregnancy is:', 'multiple_choice', '["A. Better education", "B. School dropout", "C. Higher income", "D. More freedom"]', 'B', 'Teenage pregnancy often leads to school dropout.', 'easy', 1, 34),

('q_bece_soc_2024_035', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2024_1', 'A scale on a map shows:', 'multiple_choice', '["A. The color of land", "B. The relationship between map distance and actual distance", "C. The direction of north", "D. The name of the map"]', 'B', 'Scale shows how map distance relates to real distance.', 'easy', 1, 35),

('q_bece_soc_2024_036', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2024_1', 'The body that conducts elections in Ghana is:', 'multiple_choice', '["A. Parliament", "B. The Judiciary", "C. Electoral Commission", "D. Police Service"]', 'C', 'The Electoral Commission organizes elections.', 'easy', 1, 36),

('q_bece_soc_2024_037', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2024_1', 'Migration means:', 'multiple_choice', '["A. Staying in one place", "B. Movement of people from one place to another", "C. Building houses", "D. Farming"]', 'B', 'Migration is movement from one area to another.', 'easy', 1, 37),

('q_bece_soc_2024_038', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2024_1', 'The head of a district is called:', 'multiple_choice', '["A. President", "B. Chief Executive", "C. District Chief Executive", "D. Minister"]', 'C', 'The DCE heads a district assembly.', 'easy', 1, 38),

('q_bece_soc_2024_039', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2024_1', 'Respecting the elderly is:', 'multiple_choice', '["A. A waste of time", "B. A good cultural value", "C. Only for some people", "D. Outdated"]', 'B', 'Respecting elders is an important cultural value.', 'easy', 1, 39),

('q_bece_soc_2024_040', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2024_1', 'The black star on Ghana''s flag represents:', 'multiple_choice', '["A. Darkness", "B. Freedom of Africa", "C. Sadness", "D. Night time"]', 'B', 'The black star symbolizes African freedom and emancipation.', 'easy', 1, 40),

-- BECE Social Studies 2023 Paper 1
('q_bece_soc_2023_001', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2023_1', 'Ghana is located in:', 'multiple_choice', '["A. East Africa", "B. West Africa", "C. North Africa", "D. Southern Africa"]', 'B', 'Ghana is in West Africa.', 'easy', 1, 1),

('q_bece_soc_2023_002', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2023_1', 'The colors of the Ghana flag are:', 'multiple_choice', '["A. Blue, white, green", "B. Red, gold, green with black star", "C. Red, white, blue", "D. Green, white, orange"]', 'B', 'Ghana''s flag has red, gold, green with a black star.', 'easy', 1, 2),

('q_bece_soc_2023_003', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2023_1', 'The extended family includes:', 'multiple_choice', '["A. Parents and children only", "B. Grandparents, uncles, aunts, and cousins", "C. Friends and neighbors", "D. Teachers and students"]', 'B', 'Extended family includes relatives beyond parents and children.', 'easy', 1, 3),

('q_bece_soc_2023_004', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2023_1', 'Ghana was formerly known as:', 'multiple_choice', '["A. Ivory Coast", "B. Gold Coast", "C. Slave Coast", "D. Pepper Coast"]', 'B', 'Ghana was called Gold Coast before independence.', 'easy', 1, 4),

('q_bece_soc_2023_005', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2023_1', 'A good citizen should:', 'multiple_choice', '["A. Pay taxes", "B. Litter the streets", "C. Avoid voting", "D. Disobey laws"]', 'A', 'Good citizens pay taxes and obey laws.', 'easy', 1, 5),

('q_bece_soc_2023_006', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2023_1', 'The major religion(s) in Ghana include:', 'multiple_choice', '["A. Christianity only", "B. Islam only", "C. Christianity, Islam, and Traditional religion", "D. Buddhism only"]', 'C', 'Ghana has Christians, Muslims, and traditional believers.', 'easy', 1, 6),

('q_bece_soc_2023_007', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2023_1', 'Environmental pollution can be caused by:', 'multiple_choice', '["A. Planting trees", "B. Industrial waste and littering", "C. Cleaning rivers", "D. Recycling"]', 'B', 'Industrial waste and littering cause pollution.', 'easy', 1, 7),

('q_bece_soc_2023_008', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2023_1', 'Republic Day in Ghana is celebrated on:', 'multiple_choice', '["A. March 6", "B. July 1", "C. December 25", "D. January 1"]', 'B', 'Republic Day is July 1st.', 'medium', 1, 8),

('q_bece_soc_2023_009', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2023_1', 'Adolescence is the period between:', 'multiple_choice', '["A. Birth and age 5", "B. Childhood and adulthood", "C. Age 40 and 60", "D. Age 60 and above"]', 'B', 'Adolescence is the transition from childhood to adulthood.', 'easy', 1, 9),

('q_bece_soc_2023_010', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2023_1', 'The main duty of the Judiciary is to:', 'multiple_choice', '["A. Make laws", "B. Interpret laws", "C. Enforce laws", "D. Change laws"]', 'B', 'The Judiciary interprets laws and administers justice.', 'easy', 1, 10),

('q_bece_soc_2023_011', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2023_1', 'Gender equality means:', 'multiple_choice', '["A. Women are better than men", "B. Men are better than women", "C. Equal rights for all genders", "D. No difference exists"]', 'C', 'Gender equality ensures equal opportunities for all.', 'easy', 1, 11),

('q_bece_soc_2023_012', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2023_1', 'The main occupation in rural areas of Ghana is:', 'multiple_choice', '["A. Banking", "B. Farming", "C. Manufacturing", "D. Mining"]', 'B', 'Farming is the main occupation in rural Ghana.', 'easy', 1, 12),

('q_bece_soc_2023_013', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2023_1', 'Corruption is bad because it:', 'multiple_choice', '["A. Helps development", "B. Hinders national development", "C. Makes people rich", "D. Is good for society"]', 'B', 'Corruption prevents proper development of a nation.', 'easy', 1, 13),

('q_bece_soc_2023_014', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2023_1', 'The compass direction opposite to North is:', 'multiple_choice', '["A. East", "B. West", "C. South", "D. Northeast"]', 'C', 'South is opposite to North.', 'easy', 1, 14),

('q_bece_soc_2023_015', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2023_1', 'Self-confidence means:', 'multiple_choice', '["A. Being proud and boastful", "B. Believing in your own abilities", "C. Thinking you are always right", "D. Ignoring others"]', 'B', 'Self-confidence is believing in your own capabilities.', 'easy', 1, 15),

('q_bece_soc_2023_016', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2023_1', 'Family planning helps to:', 'multiple_choice', '["A. Increase population rapidly", "B. Control family size", "C. Encourage early marriage", "D. Have many children"]', 'B', 'Family planning helps couples plan number of children.', 'easy', 1, 16),

('q_bece_soc_2023_017', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2023_1', 'One natural resource of Ghana is:', 'multiple_choice', '["A. Manufactured goods", "B. Gold", "C. Computers", "D. Electricity"]', 'B', 'Gold is a natural resource found in Ghana.', 'easy', 1, 17),

('q_bece_soc_2023_018', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2023_1', 'The key on a map shows:', 'multiple_choice', '["A. Direction", "B. Distance", "C. Symbols and what they represent", "D. Title"]', 'C', 'The key/legend explains map symbols.', 'easy', 1, 18),

('q_bece_soc_2023_019', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2023_1', 'Religious tolerance means:', 'multiple_choice', '["A. Forcing others to join your religion", "B. Respecting different religious beliefs", "C. Having no religion", "D. Fighting for your religion"]', 'B', 'Religious tolerance means accepting different faiths.', 'easy', 1, 19),

('q_bece_soc_2023_020', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2023_1', 'Population growth can be affected by:', 'multiple_choice', '["A. Only births", "B. Births, deaths, and migration", "C. Only deaths", "D. Only migration"]', 'B', 'Population changes due to births, deaths, and migration.', 'easy', 1, 20),

('q_bece_soc_2023_021', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2023_1', 'CHRAJ stands for:', 'multiple_choice', '["A. Chiefs and Human Rights Authority of Justice", "B. Commission on Human Rights and Administrative Justice", "C. Committee for Human Rights and Judicial Affairs", "D. Council for Human Resources and Justice Administration"]', 'B', 'CHRAJ is Commission on Human Rights and Administrative Justice.', 'medium', 1, 21),

('q_bece_soc_2023_022', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2023_1', 'A market is a place where:', 'multiple_choice', '["A. People sleep", "B. Goods are bought and sold", "C. People worship", "D. Students learn"]', 'B', 'Markets are for buying and selling goods.', 'easy', 1, 22),

('q_bece_soc_2023_023', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2023_1', 'The process of removing trees from the forest is called:', 'multiple_choice', '["A. Afforestation", "B. Deforestation", "C. Reforestation", "D. Conservation"]', 'B', 'Deforestation is cutting down forests.', 'easy', 1, 23),

('q_bece_soc_2023_024', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2023_1', 'Honesty means:', 'multiple_choice', '["A. Telling lies", "B. Being truthful", "C. Cheating", "D. Stealing"]', 'B', 'Honesty is being truthful and sincere.', 'easy', 1, 24),

('q_bece_soc_2023_025', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2023_1', 'The coast of Ghana is along the:', 'multiple_choice', '["A. Atlantic Ocean", "B. Pacific Ocean", "C. Indian Ocean", "D. Arctic Ocean"]', 'A', 'Ghana''s coast is on the Gulf of Guinea (Atlantic Ocean).', 'easy', 1, 25),

('q_bece_soc_2023_026', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2023_1', 'The national anthem promotes:', 'multiple_choice', '["A. Division", "B. Love for country and unity", "C. Tribalism", "D. Violence"]', 'B', 'National anthems promote patriotism and unity.', 'easy', 1, 26),

('q_bece_soc_2023_027', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2023_1', 'Which of the following is a pull factor of migration?', 'multiple_choice', '["A. War", "B. Famine", "C. Job opportunities", "D. Drought"]', 'C', 'Pull factors attract people to new places.', 'easy', 1, 27),

('q_bece_soc_2023_028', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2023_1', 'Our traditional rulers are called:', 'multiple_choice', '["A. Presidents", "B. Chiefs", "C. Ministers", "D. Teachers"]', 'B', 'Chiefs are traditional rulers in Ghana.', 'easy', 1, 28),

('q_bece_soc_2023_029', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2023_1', 'The Executive arm of government is headed by the:', 'multiple_choice', '["A. Chief Justice", "B. Speaker of Parliament", "C. President", "D. Vice President"]', 'C', 'The President heads the Executive branch.', 'easy', 1, 29),

('q_bece_soc_2023_030', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2023_1', 'One way to prevent the spread of diseases is:', 'multiple_choice', '["A. Not washing hands", "B. Drinking dirty water", "C. Regular handwashing", "D. Sharing toothbrushes"]', 'C', 'Handwashing prevents spread of germs.', 'easy', 1, 30),

('q_bece_soc_2023_031', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2023_1', 'The United Nations was formed in:', 'multiple_choice', '["A. 1918", "B. 1939", "C. 1945", "D. 1960"]', 'C', 'The UN was established in 1945.', 'medium', 1, 31),

('q_bece_soc_2023_032', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2023_1', 'A taboo is:', 'multiple_choice', '["A. A type of food", "B. Something forbidden by culture or tradition", "C. A dance", "D. A musical instrument"]', 'B', 'Taboos are cultural or traditional prohibitions.', 'easy', 1, 32),

('q_bece_soc_2023_033', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2023_1', 'Savings can help an individual to:', 'multiple_choice', '["A. Waste money", "B. Plan for the future", "C. Borrow more", "D. Spend carelessly"]', 'B', 'Savings help prepare for future needs.', 'easy', 1, 33),

('q_bece_soc_2023_034', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2023_1', 'The currency of Ghana is:', 'multiple_choice', '["A. Dollar", "B. Cedi", "C. Euro", "D. Pound"]', 'B', 'The Ghana Cedi is Ghana''s currency.', 'easy', 1, 34),

('q_bece_soc_2023_035', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2023_1', 'Conflict can be resolved through:', 'multiple_choice', '["A. Fighting", "B. Dialogue and negotiation", "C. Violence", "D. Ignoring the problem"]', 'B', 'Dialogue and negotiation help resolve conflicts peacefully.', 'easy', 1, 35),

('q_bece_soc_2023_036', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2023_1', 'Which neighboring country is to the east of Ghana?', 'multiple_choice', '["A. Ivory Coast", "B. Burkina Faso", "C. Togo", "D. Mali"]', 'C', 'Togo borders Ghana to the east.', 'easy', 1, 36),

('q_bece_soc_2023_037', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2023_1', 'Community service involves:', 'multiple_choice', '["A. Helping only yourself", "B. Working for the benefit of others without pay", "C. Being paid to work", "D. Staying at home"]', 'B', 'Community service is voluntary work to help others.', 'easy', 1, 37),

('q_bece_soc_2023_038', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2023_1', 'The Ghana Police motto is:', 'multiple_choice', '["A. Service with Integrity", "B. Forward Ever, Backward Never", "C. Unity is Strength", "D. Peace and Justice"]', 'A', 'The Ghana Police motto is "Service with Integrity."', 'medium', 1, 38),

('q_bece_soc_2023_039', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2023_1', 'An example of a landmark in Ghana is:', 'multiple_choice', '["A. Eiffel Tower", "B. Statue of Liberty", "C. Kwame Nkrumah Mausoleum", "D. Big Ben"]', 'C', 'The Kwame Nkrumah Mausoleum is a famous Ghana landmark.', 'easy', 1, 39),

('q_bece_soc_2023_040', 'subj_bece_social', 'exam_bece', 'paper_bece_1', 'pp_bece_soc_2023_1', 'Road safety rules help to:', 'multiple_choice', '["A. Cause accidents", "B. Prevent accidents and save lives", "C. Block roads", "D. Make driving difficult"]', 'B', 'Road safety rules prevent accidents.', 'easy', 1, 40);
