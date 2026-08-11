-- Migration 050: BECE Religious and Moral Education (RME) Questions
-- 80 questions for 2024 and 2023 Paper 1 (Objectives)

-- First, add the past paper entries for RME
INSERT OR IGNORE INTO past_papers (id, exam_type_id, subject_id, paper_type_id, year, month, total_questions, total_marks, time_allowed, is_complete)
VALUES ('pp_bece_rme_2024_1', 'exam_bece', 'subj_bece_rme', 'paper_bece_1', 2024, 'June', 40, 40, 45, 1);

INSERT OR IGNORE INTO past_papers (id, exam_type_id, subject_id, paper_type_id, year, month, total_questions, total_marks, time_allowed, is_complete)
VALUES ('pp_bece_rme_2023_1', 'exam_bece', 'subj_bece_rme', 'paper_bece_1', 2023, 'June', 40, 40, 45, 1);

-- RME Questions for 2024 Paper 1
INSERT OR REPLACE INTO questions (id, subject_id, exam_type_id, paper_type_id, past_paper_id, question_text, question_type, options, correct_answer, explanation, difficulty, marks, question_number) VALUES

-- Religion and God (Q1-10)
('q_rme_2024_001', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2024_1', 'The belief in one God is called:', 'multiple_choice', '["A. Polytheism", "B. Monotheism", "C. Atheism", "D. Animism"]', 'B', 'Monotheism is the belief in one God. Christianity, Islam, and Judaism are monotheistic religions.', 'easy', 1, 1),

('q_rme_2024_002', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2024_1', 'Which of the following is NOT a revealed religion?', 'multiple_choice', '["A. Christianity", "B. Islam", "C. Judaism", "D. African Traditional Religion"]', 'D', 'African Traditional Religion developed through ancestral practices, while revealed religions are based on divine revelation through prophets.', 'easy', 1, 2),

('q_rme_2024_003', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2024_1', 'The holy book of Islam is called:', 'multiple_choice', '["A. Bible", "B. Torah", "C. Quran", "D. Vedas"]', 'C', 'The Quran (Koran) is the holy book of Islam, believed to be revealed to Prophet Muhammad.', 'easy', 1, 3),

('q_rme_2024_004', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2024_1', 'In Christianity, the Trinity refers to:', 'multiple_choice', '["A. Three separate gods", "B. Father, Son, and Holy Spirit", "C. Three prophets", "D. Three churches"]', 'B', 'The Trinity is the Christian doctrine of God as three persons: Father, Son, and Holy Spirit.', 'easy', 1, 4),

('q_rme_2024_005', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2024_1', 'In African Traditional Religion, ancestors are believed to:', 'multiple_choice', '["A. Have no power", "B. Be intermediaries between the living and God", "C. Be gods themselves", "D. Have no importance"]', 'B', 'In ATR, ancestors serve as intermediaries between the living and the Supreme Being.', 'medium', 1, 5),

('q_rme_2024_006', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2024_1', 'The five pillars of Islam include all EXCEPT:', 'multiple_choice', '["A. Shahada (declaration of faith)", "B. Salat (prayer)", "C. Baptism", "D. Hajj (pilgrimage)"]', 'C', 'Baptism is a Christian practice. The five pillars are: Shahada, Salat, Zakat, Sawm, and Hajj.', 'medium', 1, 6),

('q_rme_2024_007', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2024_1', 'Jesus was born in:', 'multiple_choice', '["A. Jerusalem", "B. Nazareth", "C. Bethlehem", "D. Galilee"]', 'C', 'According to the Bible, Jesus was born in Bethlehem.', 'easy', 1, 7),

('q_rme_2024_008', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2024_1', 'Prophet Muhammad was born in:', 'multiple_choice', '["A. Medina", "B. Mecca", "C. Jerusalem", "D. Cairo"]', 'B', 'Prophet Muhammad was born in Mecca in 570 CE.', 'easy', 1, 8),

('q_rme_2024_009', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2024_1', 'The Supreme Being in most African Traditional Religions is believed to be:', 'multiple_choice', '["A. Absent and unconcerned", "B. Creator of all things", "C. One of many equal gods", "D. A human ancestor"]', 'B', 'In ATR, the Supreme Being is the creator of all things, though accessed through intermediaries.', 'easy', 1, 9),

('q_rme_2024_010', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2024_1', 'Easter celebrates:', 'multiple_choice', '["A. Birth of Jesus", "B. Resurrection of Jesus", "C. Baptism of Jesus", "D. Ascension of Jesus"]', 'B', 'Easter celebrates the resurrection of Jesus Christ from the dead.', 'easy', 1, 10),

-- Moral Values (Q11-20)
('q_rme_2024_011', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2024_1', 'Honesty means:', 'multiple_choice', '["A. Taking what belongs to others", "B. Telling the truth and being sincere", "C. Hiding the truth", "D. Being selfish"]', 'B', 'Honesty is the quality of being truthful and sincere in one''s words and actions.', 'easy', 1, 11),

('q_rme_2024_012', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2024_1', 'The Golden Rule teaches us to:', 'multiple_choice', '["A. Acquire as much gold as possible", "B. Treat others as we want to be treated", "C. Always be first", "D. Think only of ourselves"]', 'B', 'The Golden Rule: "Do unto others as you would have them do unto you."', 'easy', 1, 12),

('q_rme_2024_013', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2024_1', 'Which of these is a sign of responsibility?', 'multiple_choice', '["A. Blaming others for mistakes", "B. Completing assigned duties", "C. Making excuses", "D. Avoiding work"]', 'B', 'Responsibility means fulfilling one''s duties and obligations without excuses.', 'easy', 1, 13),

('q_rme_2024_014', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2024_1', 'Obedience to parents is important because:', 'multiple_choice', '["A. Parents are always right", "B. It shows respect and helps personal development", "C. It makes life easier", "D. Parents will reward you"]', 'B', 'Obedience to parents shows respect and aids in moral and personal development.', 'easy', 1, 14),

('q_rme_2024_015', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2024_1', 'Humility means:', 'multiple_choice', '["A. Looking down on others", "B. Having a modest view of one''s importance", "C. Always being quiet", "D. Allowing people to cheat you"]', 'B', 'Humility is having a modest view of one''s importance and not being arrogant.', 'easy', 1, 15),

('q_rme_2024_016', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2024_1', 'Tolerance means:', 'multiple_choice', '["A. Accepting everything without question", "B. Respecting differences in others", "C. Ignoring bad behavior", "D. Having no opinion"]', 'B', 'Tolerance is the ability to accept and respect differences in others.', 'easy', 1, 16),

('q_rme_2024_017', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2024_1', 'Self-discipline helps us to:', 'multiple_choice', '["A. Do whatever we want", "B. Control our actions and impulses", "C. Avoid all work", "D. Be lazy"]', 'B', 'Self-discipline is the ability to control one''s feelings and overcome weaknesses.', 'easy', 1, 17),

('q_rme_2024_018', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2024_1', 'Compassion means:', 'multiple_choice', '["A. Feeling superior to others", "B. Feeling concern for others'' suffering", "C. Ignoring those in need", "D. Being selfish"]', 'B', 'Compassion is feeling concern for the sufferings of others and wanting to help.', 'easy', 1, 18),

('q_rme_2024_019', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2024_1', 'Peer pressure is:', 'multiple_choice', '["A. Always positive", "B. Influence from friends to do something", "C. Pressure from parents", "D. Pressure from teachers"]', 'B', 'Peer pressure is the influence from one''s peers to think or behave in a certain way.', 'easy', 1, 19),

('q_rme_2024_020', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2024_1', 'Integrity means:', 'multiple_choice', '["A. Doing right only when being watched", "B. Being honest and having strong moral principles", "C. Changing behavior to please others", "D. Taking advantage of others"]', 'B', 'Integrity is being honest and having strong moral principles consistently.', 'medium', 1, 20),

-- Family and Social Life (Q21-30)
('q_rme_2024_021', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2024_1', 'An extended family includes:', 'multiple_choice', '["A. Only parents and children", "B. Grandparents, uncles, aunts, and cousins", "C. Only husband and wife", "D. Friends and neighbors"]', 'B', 'An extended family includes relatives beyond the nuclear family.', 'easy', 1, 21),

('q_rme_2024_022', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2024_1', 'The nuclear family consists of:', 'multiple_choice', '["A. Grandparents only", "B. Parents and their children", "C. All relatives", "D. Friends"]', 'B', 'A nuclear family consists of parents and their children living together.', 'easy', 1, 22),

('q_rme_2024_023', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2024_1', 'Respect for elders is shown by:', 'multiple_choice', '["A. Talking back to them", "B. Greeting them and listening to their advice", "C. Ignoring them", "D. Making fun of them"]', 'B', 'Respect for elders is shown through polite greetings, listening, and following their guidance.', 'easy', 1, 23),

('q_rme_2024_024', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2024_1', 'Puberty is the stage when:', 'multiple_choice', '["A. A child is born", "B. Physical and emotional changes occur in adolescence", "C. One becomes elderly", "D. One starts school"]', 'B', 'Puberty is the period of physical and emotional changes as a child becomes an adolescent.', 'easy', 1, 24),

('q_rme_2024_025', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2024_1', 'Courtship is:', 'multiple_choice', '["A. Going to court", "B. The period of getting to know a partner before marriage", "C. A type of dance", "D. A legal document"]', 'B', 'Courtship is the period during which a couple develops a romantic relationship before marriage.', 'easy', 1, 25),

('q_rme_2024_026', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2024_1', 'Good parenting involves:', 'multiple_choice', '["A. Neglecting children", "B. Providing love, care, and guidance", "C. Giving children everything they want", "D. Being strict without love"]', 'B', 'Good parenting involves providing love, care, guidance, and discipline.', 'easy', 1, 26),

('q_rme_2024_027', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2024_1', 'Child abuse includes:', 'multiple_choice', '["A. Proper discipline", "B. Physical, emotional, or sexual harm to children", "C. Teaching children", "D. Providing for children"]', 'B', 'Child abuse is any action that causes physical, emotional, or sexual harm to a child.', 'medium', 1, 27),

('q_rme_2024_028', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2024_1', 'Gender equality means:', 'multiple_choice', '["A. Boys and girls are the same", "B. Equal rights and opportunities for both sexes", "C. Girls are better than boys", "D. Boys are better than girls"]', 'B', 'Gender equality means equal rights, opportunities, and treatment for all genders.', 'easy', 1, 28),

('q_rme_2024_029', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2024_1', 'Marriage in most cultures is:', 'multiple_choice', '["A. Only for the rich", "B. A union between partners with rights and responsibilities", "C. Optional for having children", "D. Only religious"]', 'B', 'Marriage is a formal union between partners involving mutual rights and responsibilities.', 'easy', 1, 29),

('q_rme_2024_030', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2024_1', 'Abstinence from sex before marriage is important because:', 'multiple_choice', '["A. It is old-fashioned", "B. It prevents STIs and unwanted pregnancies", "C. It is not important", "D. It is only for religious people"]', 'B', 'Abstinence helps prevent sexually transmitted infections and unwanted pregnancies.', 'medium', 1, 30),

-- Social Issues and Environment (Q31-40)
('q_rme_2024_031', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2024_1', 'HIV/AIDS is spread through all EXCEPT:', 'multiple_choice', '["A. Unprotected sexual contact", "B. Sharing needles", "C. Casual contact like handshaking", "D. Mother to child during birth"]', 'C', 'HIV is not spread through casual contact like handshaking or hugging.', 'easy', 1, 31),

('q_rme_2024_032', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2024_1', 'Drug abuse refers to:', 'multiple_choice', '["A. Taking prescribed medication", "B. Using drugs in harmful ways", "C. Avoiding all drugs", "D. Selling drugs legally"]', 'B', 'Drug abuse is the harmful use of legal or illegal substances.', 'easy', 1, 32),

('q_rme_2024_033', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2024_1', 'Corruption in society leads to:', 'multiple_choice', '["A. Development", "B. Poverty and inequality", "C. Justice", "D. Progress"]', 'B', 'Corruption undermines development and leads to poverty and inequality.', 'easy', 1, 33),

('q_rme_2024_034', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2024_1', 'Environmental protection is important because:', 'multiple_choice', '["A. It is not necessary", "B. It ensures sustainable living for all", "C. It slows development", "D. It is only for scientists"]', 'B', 'Environmental protection ensures that current and future generations have resources for living.', 'easy', 1, 34),

('q_rme_2024_035', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2024_1', 'Patriotism means:', 'multiple_choice', '["A. Hating other countries", "B. Love and devotion to one''s country", "C. Being nationalistic to the extreme", "D. Leaving your country"]', 'B', 'Patriotism is love, support, and devotion to one''s country.', 'easy', 1, 35),

('q_rme_2024_036', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2024_1', 'Human rights are:', 'multiple_choice', '["A. Only for adults", "B. Basic rights and freedoms for all people", "C. Only for citizens", "D. Only for the rich"]', 'B', 'Human rights are basic rights and freedoms that belong to every person.', 'easy', 1, 36),

('q_rme_2024_037', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2024_1', 'Religious tolerance means:', 'multiple_choice', '["A. Following all religions", "B. Respecting others'' religious beliefs", "C. Having no religion", "D. Forcing your beliefs on others"]', 'B', 'Religious tolerance is respecting the right of others to hold different religious beliefs.', 'easy', 1, 37),

('q_rme_2024_038', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2024_1', 'Community service involves:', 'multiple_choice', '["A. Working only for money", "B. Volunteering to help the community", "C. Staying at home", "D. Ignoring community problems"]', 'B', 'Community service is voluntary work to help improve the community.', 'easy', 1, 38),

('q_rme_2024_039', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2024_1', 'Conflict resolution can be achieved through:', 'multiple_choice', '["A. Violence", "B. Dialogue and compromise", "C. Ignoring the problem", "D. Running away"]', 'B', 'Conflict can be resolved through peaceful dialogue, negotiation, and compromise.', 'easy', 1, 39),

('q_rme_2024_040', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2024_1', 'Good citizenship involves:', 'multiple_choice', '["A. Breaking laws", "B. Obeying laws and contributing to society", "C. Only caring about yourself", "D. Avoiding taxes"]', 'B', 'Good citizenship means obeying laws, paying taxes, and contributing positively to society.', 'easy', 1, 40),

-- RME 2023 Questions - Religion (Q1-10)
('q_rme_2023_001', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2023_1', 'Prayer is important because it:', 'multiple_choice', '["A. Is a waste of time", "B. Connects believers with God", "C. Is only for religious leaders", "D. Has no benefits"]', 'B', 'Prayer is a means of communication with God and is central to all religions.', 'easy', 1, 1),

('q_rme_2023_002', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2023_1', 'The first five books of the Bible are called:', 'multiple_choice', '["A. Gospels", "B. Pentateuch", "C. Prophets", "D. Psalms"]', 'B', 'The Pentateuch (Torah) consists of Genesis, Exodus, Leviticus, Numbers, and Deuteronomy.', 'medium', 1, 2),

('q_rme_2023_003', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2023_1', 'Ramadan is:', 'multiple_choice', '["A. A Christian festival", "B. A month of fasting in Islam", "C. An African traditional ceremony", "D. A Jewish holiday"]', 'B', 'Ramadan is the ninth month of the Islamic calendar when Muslims fast from dawn to sunset.', 'easy', 1, 3),

('q_rme_2023_004', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2023_1', 'The Ten Commandments were given to:', 'multiple_choice', '["A. Abraham", "B. Moses", "C. David", "D. Jesus"]', 'B', 'The Ten Commandments were given by God to Moses on Mount Sinai.', 'easy', 1, 4),

('q_rme_2023_005', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2023_1', 'Zakat in Islam is:', 'multiple_choice', '["A. A type of prayer", "B. Giving to the poor", "C. A pilgrimage", "D. Fasting"]', 'B', 'Zakat is the Islamic practice of giving a portion of wealth to those in need.', 'easy', 1, 5),

('q_rme_2023_006', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2023_1', 'In African Traditional Religion, a shrine is:', 'multiple_choice', '["A. A place of worship and offerings", "B. A school", "C. A market", "D. A hospital"]', 'A', 'A shrine is a sacred place where offerings are made to deities or ancestors.', 'easy', 1, 6),

('q_rme_2023_007', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2023_1', 'Baptism in Christianity symbolizes:', 'multiple_choice', '["A. Graduation", "B. Spiritual cleansing and new life", "C. Marriage", "D. Death"]', 'B', 'Baptism symbolizes washing away of sins and beginning a new life in Christ.', 'easy', 1, 7),

('q_rme_2023_008', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2023_1', 'The direction Muslims face when praying is:', 'multiple_choice', '["A. East", "B. Towards Mecca", "C. West", "D. Any direction"]', 'B', 'Muslims face the Kaaba in Mecca (Qibla) when performing salat (prayer).', 'easy', 1, 8),

('q_rme_2023_009', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2023_1', 'Christmas celebrates:', 'multiple_choice', '["A. Death of Jesus", "B. Birth of Jesus", "C. Resurrection of Jesus", "D. Baptism of Jesus"]', 'B', 'Christmas celebrates the birth of Jesus Christ.', 'easy', 1, 9),

('q_rme_2023_010', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2023_1', 'A naming ceremony is important because it:', 'multiple_choice', '["A. Gives the child identity", "B. Has no significance", "C. Is only for fun", "D. Is only for rich families"]', 'A', 'A naming ceremony officially introduces the child to the family and community with a name.', 'easy', 1, 10),

-- Moral Values and Character (Q11-20)
('q_rme_2023_011', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2023_1', 'Contentment means:', 'multiple_choice', '["A. Wanting more always", "B. Being satisfied with what you have", "C. Being greedy", "D. Never working"]', 'B', 'Contentment is being satisfied and happy with what one has.', 'easy', 1, 11),

('q_rme_2023_012', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2023_1', 'Truthfulness is important because it:', 'multiple_choice', '["A. Makes life difficult", "B. Builds trust", "C. Has no benefit", "D. Is old-fashioned"]', 'B', 'Truthfulness builds trust and is essential for good relationships.', 'easy', 1, 12),

('q_rme_2023_013', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2023_1', 'Gratitude means:', 'multiple_choice', '["A. Being ungrateful", "B. Showing appreciation for kindness received", "C. Expecting more", "D. Complaining"]', 'B', 'Gratitude is the quality of being thankful and appreciating kindness.', 'easy', 1, 13),

('q_rme_2023_014', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2023_1', 'Patience means:', 'multiple_choice', '["A. Giving up quickly", "B. Waiting calmly without complaint", "C. Being angry", "D. Rushing everything"]', 'B', 'Patience is the ability to wait calmly or endure difficulties without complaint.', 'easy', 1, 14),

('q_rme_2023_015', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2023_1', 'Kindness involves:', 'multiple_choice', '["A. Being cruel", "B. Helping others without expecting reward", "C. Ignoring people", "D. Being selfish"]', 'B', 'Kindness is being friendly, generous, and considerate to others.', 'easy', 1, 15),

('q_rme_2023_016', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2023_1', 'Forgiveness is:', 'multiple_choice', '["A. Holding grudges", "B. Letting go of anger toward those who wronged us", "C. Getting revenge", "D. Ignoring the wrongdoer"]', 'B', 'Forgiveness is letting go of resentment and anger toward someone who has wronged you.', 'easy', 1, 16),

('q_rme_2023_017', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2023_1', 'Hard work leads to:', 'multiple_choice', '["A. Laziness", "B. Success and achievement", "C. Poverty", "D. Failure"]', 'B', 'Hard work is essential for achieving success and reaching goals.', 'easy', 1, 17),

('q_rme_2023_018', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2023_1', 'Cheating in exams is wrong because:', 'multiple_choice', '["A. It is acceptable sometimes", "B. It is dishonest and unfair", "C. Everyone does it", "D. Teachers don''t care"]', 'B', 'Cheating is dishonest and unfair to those who study and work hard.', 'easy', 1, 18),

('q_rme_2023_019', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2023_1', 'Courage means:', 'multiple_choice', '["A. Being afraid of everything", "B. Facing difficulties bravely", "C. Avoiding challenges", "D. Running from problems"]', 'B', 'Courage is the ability to face difficulties, danger, or pain bravely.', 'easy', 1, 19),

('q_rme_2023_020', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2023_1', 'Fairness means:', 'multiple_choice', '["A. Favoring some people", "B. Treating everyone equally and justly", "C. Being partial", "D. Cheating"]', 'B', 'Fairness is treating people equally, impartially, and justly.', 'easy', 1, 20),

-- Social Relationships (Q21-30)
('q_rme_2023_021', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2023_1', 'Friendship is based on:', 'multiple_choice', '["A. Money only", "B. Trust and mutual respect", "C. Age", "D. Appearance"]', 'B', 'True friendship is based on trust, respect, and genuine care for each other.', 'easy', 1, 21),

('q_rme_2023_022', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2023_1', 'Adolescence is a period of:', 'multiple_choice', '["A. Infancy", "B. Transition from childhood to adulthood", "C. Old age", "D. Early childhood"]', 'B', 'Adolescence is the transitional period between childhood and adulthood.', 'easy', 1, 22),

('q_rme_2023_023', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2023_1', 'Greeting elders is a sign of:', 'multiple_choice', '["A. Weakness", "B. Respect and good upbringing", "C. Fear", "D. Waste of time"]', 'B', 'Greeting elders demonstrates respect and shows good home training.', 'easy', 1, 23),

('q_rme_2023_024', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2023_1', 'Child labor refers to:', 'multiple_choice', '["A. Children doing homework", "B. Work that harms children''s development", "C. Children helping at home", "D. School projects"]', 'B', 'Child labor is work that is harmful to children''s health, education, or development.', 'medium', 1, 24),

('q_rme_2023_025', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2023_1', 'Helping at home is important because it:', 'multiple_choice', '["A. Is punishment", "B. Teaches responsibility and teamwork", "C. Is only for servants", "D. Wastes study time"]', 'B', 'Helping at home teaches responsibility, teamwork, and life skills.', 'easy', 1, 25),

('q_rme_2023_026', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2023_1', 'Respecting teachers involves:', 'multiple_choice', '["A. Talking back", "B. Listening and following instructions", "C. Ignoring them", "D. Making fun of them"]', 'B', 'Respecting teachers means listening, following instructions, and valuing their guidance.', 'easy', 1, 26),

('q_rme_2023_027', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2023_1', 'A good friend will:', 'multiple_choice', '["A. Lead you astray", "B. Support and encourage you", "C. Make fun of you", "D. Ignore you"]', 'B', 'A good friend provides support, encouragement, and positive influence.', 'easy', 1, 27),

('q_rme_2023_028', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2023_1', 'Sharing resources teaches:', 'multiple_choice', '["A. Selfishness", "B. Generosity and concern for others", "C. Greed", "D. Competition"]', 'B', 'Sharing teaches generosity and shows concern for the well-being of others.', 'easy', 1, 28),

('q_rme_2023_029', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2023_1', 'Conflict in the family can be resolved through:', 'multiple_choice', '["A. Fighting", "B. Communication and understanding", "C. Silence", "D. Leaving home"]', 'B', 'Family conflicts are best resolved through open communication and mutual understanding.', 'easy', 1, 29),

('q_rme_2023_030', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2023_1', 'Caring for the elderly is important because:', 'multiple_choice', '["A. They are useless", "B. They deserve respect and have wisdom to share", "C. It is a burden", "D. It is only for the government"]', 'B', 'The elderly deserve respect and care; they have valuable wisdom and experience.', 'easy', 1, 30),

-- Contemporary Issues (Q31-40)
('q_rme_2023_031', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2023_1', 'Gambling is harmful because:', 'multiple_choice', '["A. It is a good way to make money", "B. It can lead to addiction and poverty", "C. It has no effects", "D. It is recommended"]', 'B', 'Gambling can become addictive and lead to financial ruin and family problems.', 'easy', 1, 31),

('q_rme_2023_032', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2023_1', 'Teenage pregnancy is a concern because:', 'multiple_choice', '["A. It has no consequences", "B. It affects education and health", "C. It is encouraged", "D. It is normal"]', 'B', 'Teenage pregnancy can interrupt education and poses health risks for young mothers.', 'easy', 1, 32),

('q_rme_2023_033', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2023_1', 'Substance abuse refers to:', 'multiple_choice', '["A. Using vitamins", "B. Harmful use of alcohol, drugs, or tobacco", "C. Eating healthy food", "D. Drinking water"]', 'B', 'Substance abuse is the harmful use of alcohol, drugs, or other substances.', 'easy', 1, 33),

('q_rme_2023_034', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2023_1', 'Proper disposal of waste helps to:', 'multiple_choice', '["A. Spread disease", "B. Protect the environment and health", "C. Create problems", "D. Nothing"]', 'B', 'Proper waste disposal protects the environment and prevents disease spread.', 'easy', 1, 34),

('q_rme_2023_035', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2023_1', 'Cyberbullying is:', 'multiple_choice', '["A. Using computers for homework", "B. Bullying through electronic means", "C. Playing computer games", "D. Sending emails"]', 'B', 'Cyberbullying is using technology to harass, threaten, or embarrass others.', 'easy', 1, 35),

('q_rme_2023_036', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2023_1', 'Money should be used:', 'multiple_choice', '["A. Only for buying things we want", "B. Wisely for needs and savings", "C. For showing off", "D. To gamble"]', 'B', 'Money should be used wisely for needs, saved for the future, and shared with those in need.', 'easy', 1, 36),

('q_rme_2023_037', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2023_1', 'Respecting public property means:', 'multiple_choice', '["A. Destroying it", "B. Caring for and protecting shared resources", "C. Using it carelessly", "D. Stealing it"]', 'B', 'Public property belongs to everyone and should be protected and used responsibly.', 'easy', 1, 37),

('q_rme_2023_038', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2023_1', 'Time management helps us to:', 'multiple_choice', '["A. Waste time", "B. Use time productively", "C. Procrastinate", "D. Be late always"]', 'B', 'Good time management helps us accomplish more and reduces stress.', 'easy', 1, 38),

('q_rme_2023_039', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2023_1', 'Protecting wildlife is important for:', 'multiple_choice', '["A. Nothing", "B. Maintaining ecological balance", "C. Making money only", "D. Entertainment"]', 'B', 'Wildlife protection is essential for maintaining biodiversity and ecological balance.', 'medium', 1, 39),

('q_rme_2023_040', 'subj_bece_rme', 'exam_bece', 'paper_bece_1', 'pp_bece_rme_2023_1', 'National unity is achieved through:', 'multiple_choice', '["A. Tribalism", "B. Respecting diversity and working together", "C. Discrimination", "D. Fighting"]', 'B', 'National unity is built through respecting differences and working together for common goals.', 'easy', 1, 40);
