-- Migration 046: WASSCE Government Questions
-- 100 questions for 2024 and 2023 Paper 1 (Objectives)

-- First, add the past paper entries for Government
INSERT OR IGNORE INTO past_papers (id, exam_type_id, subject_id, paper_type_id, year, month, total_questions, total_marks, time_allowed, is_complete)
VALUES ('pp_wassce_gov_2024_1', 'exam_wassce', 'subj_wassce_government', 'paper_wassce_1', 2024, 'May-June', 50, 50, 60, 1);

INSERT OR IGNORE INTO past_papers (id, exam_type_id, subject_id, paper_type_id, year, month, total_questions, total_marks, time_allowed, is_complete)
VALUES ('pp_wassce_gov_2023_1', 'exam_wassce', 'subj_wassce_government', 'paper_wassce_1', 2023, 'May-June', 50, 50, 60, 1);

-- Government Questions for 2024 Paper 1
INSERT OR REPLACE INTO questions (id, subject_id, exam_type_id, paper_type_id, past_paper_id, question_text, question_type, options, correct_answer, explanation, difficulty, marks, question_number) VALUES

-- Political Concepts and Theories (Q1-10)
('q_gov_2024_001', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2024_1', 'Which of the following is a characteristic of sovereignty?', 'multiple_choice', '["A. Divisibility", "B. Permanence", "C. Flexibility", "D. Temporariness"]', 'B', 'Sovereignty is permanent and continues as long as the state exists. It does not change with governments.', 'medium', 1, 1),

('q_gov_2024_002', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2024_1', 'The theory of separation of powers was propounded by:', 'multiple_choice', '["A. John Locke", "B. Montesquieu", "C. Jean Bodin", "D. Thomas Hobbes"]', 'B', 'Baron de Montesquieu developed the theory of separation of powers, dividing government into executive, legislative, and judicial branches.', 'easy', 1, 2),

('q_gov_2024_003', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2024_1', 'Which arm of government is responsible for interpreting laws?', 'multiple_choice', '["A. Executive", "B. Legislature", "C. Judiciary", "D. Civil Service"]', 'C', 'The judiciary is responsible for interpreting laws and ensuring justice is administered.', 'easy', 1, 3),

('q_gov_2024_004', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2024_1', 'A political party is primarily formed to:', 'multiple_choice', '["A. Entertain citizens", "B. Contest for power", "C. Organize protests", "D. Collect taxes"]', 'B', 'The primary objective of political parties is to contest for political power through elections.', 'easy', 1, 4),

('q_gov_2024_005', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2024_1', 'The concept of rule of law was popularized by:', 'multiple_choice', '["A. A.V. Dicey", "B. Karl Marx", "C. Max Weber", "D. Aristotle"]', 'A', 'A.V. Dicey, a British jurist, popularized the concept of rule of law in his book "Introduction to the Study of the Law of the Constitution."', 'medium', 1, 5),

('q_gov_2024_006', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2024_1', 'Which of the following is NOT a feature of federalism?', 'multiple_choice', '["A. Written constitution", "B. Division of powers", "C. Supremacy of the central government", "D. Independent judiciary"]', 'C', 'In federalism, power is shared between federal and state governments. Neither has absolute supremacy over the other.', 'medium', 1, 6),

('q_gov_2024_007', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2024_1', 'Pressure groups differ from political parties in that they:', 'multiple_choice', '["A. Contest elections", "B. Have permanent membership", "C. Seek to influence government policies", "D. Form governments"]', 'C', 'Pressure groups seek to influence government policies without necessarily seeking political office.', 'medium', 1, 7),

('q_gov_2024_008', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2024_1', 'The principle of checks and balances ensures that:', 'multiple_choice', '["A. One arm of government dominates others", "B. All arms of government cooperate only", "C. Each arm of government controls the others", "D. Government operates without oversight"]', 'C', 'Checks and balances ensure that each arm of government can monitor and limit the powers of the other arms.', 'medium', 1, 8),

('q_gov_2024_009', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2024_1', 'Which of the following is a disadvantage of multi-party system?', 'multiple_choice', '["A. It promotes healthy competition", "B. It may lead to political instability", "C. It offers voters many choices", "D. It promotes democratic values"]', 'B', 'Multi-party systems can lead to political instability when no party wins a clear majority, requiring coalition governments.', 'medium', 1, 9),

('q_gov_2024_010', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2024_1', 'Public opinion is best formed through:', 'multiple_choice', '["A. Military force", "B. Mass media", "C. Dictatorship", "D. Aristocracy"]', 'B', 'Mass media plays a crucial role in forming and shaping public opinion through news, discussions, and information dissemination.', 'easy', 1, 10),

-- Political Institutions and Systems (Q11-20)
('q_gov_2024_011', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2024_1', 'In a presidential system of government, the president:', 'multiple_choice', '["A. Is chosen by parliament", "B. Is both head of state and government", "C. Has ceremonial powers only", "D. Can be removed by simple vote"]', 'B', 'In a presidential system, the president serves as both the head of state and head of government.', 'easy', 1, 11),

('q_gov_2024_012', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2024_1', 'The cabinet in a parliamentary system is responsible to:', 'multiple_choice', '["A. The president", "B. The parliament", "C. The judiciary", "D. The military"]', 'B', 'In a parliamentary system, the cabinet is collectively responsible to parliament and can be dismissed through a vote of no confidence.', 'medium', 1, 12),

('q_gov_2024_013', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2024_1', 'Which of the following is a feature of unitary government?', 'multiple_choice', '["A. Division of powers", "B. Single central government", "C. Dual citizenship", "D. Multiple constitutions"]', 'B', 'A unitary government has a single central government that holds all powers, which may delegate some to local units.', 'easy', 1, 13),

('q_gov_2024_014', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2024_1', 'A constitutional monarchy is one in which the king:', 'multiple_choice', '["A. Has absolute powers", "B. Rules according to the constitution", "C. Is elected by the people", "D. Is the head of government"]', 'B', 'In a constitutional monarchy, the monarch''s powers are limited by a constitution or laws.', 'easy', 1, 14),

('q_gov_2024_015', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2024_1', 'The supremacy of the constitution means that:', 'multiple_choice', '["A. Parliament can override it", "B. It is the highest law of the land", "C. The president interprets it", "D. It can be easily amended"]', 'B', 'Constitutional supremacy means the constitution is the highest law and all other laws must conform to it.', 'easy', 1, 15),

('q_gov_2024_016', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2024_1', 'A bicameral legislature consists of:', 'multiple_choice', '["A. One house", "B. Two houses", "C. Three houses", "D. Four houses"]', 'B', 'A bicameral legislature consists of two chambers, typically an upper and lower house.', 'easy', 1, 16),

('q_gov_2024_017', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2024_1', 'The main function of the legislature is to:', 'multiple_choice', '["A. Interpret laws", "B. Make laws", "C. Implement laws", "D. Punish offenders"]', 'B', 'The primary function of the legislature is to make laws for the governance of the country.', 'easy', 1, 17),

('q_gov_2024_018', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2024_1', 'Delegated legislation refers to laws made by:', 'multiple_choice', '["A. Parliament directly", "B. Bodies authorized by parliament", "C. The judiciary", "D. Traditional rulers"]', 'B', 'Delegated legislation refers to laws made by subordinate bodies that have been authorized by parliament to do so.', 'medium', 1, 18),

('q_gov_2024_019', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2024_1', 'A vote of no confidence is used to:', 'multiple_choice', '["A. Impeach the president", "B. Remove the cabinet", "C. Dissolve the judiciary", "D. Elect new members"]', 'B', 'A vote of no confidence is a parliamentary procedure to remove a government or cabinet from power.', 'medium', 1, 19),

('q_gov_2024_020', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2024_1', 'The executive arm of government is headed by:', 'multiple_choice', '["A. The Speaker", "B. The Chief Justice", "C. The President or Prime Minister", "D. The Attorney General"]', 'C', 'The executive is headed by the President (in presidential systems) or Prime Minister (in parliamentary systems).', 'easy', 1, 20),

-- Elections and Political Participation (Q21-30)
('q_gov_2024_021', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2024_1', 'Universal adult suffrage means:', 'multiple_choice', '["A. Only the educated can vote", "B. All adults have the right to vote", "C. Only property owners can vote", "D. Voting is compulsory"]', 'B', 'Universal adult suffrage is the right of all adult citizens to vote regardless of race, sex, belief, or social status.', 'easy', 1, 21),

('q_gov_2024_022', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2024_1', 'A by-election is held when:', 'multiple_choice', '["A. General elections are conducted", "B. A seat becomes vacant", "C. The president dies", "D. Parliament is dissolved"]', 'B', 'A by-election is held to fill a vacancy that occurs between general elections.', 'easy', 1, 22),

('q_gov_2024_023', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2024_1', 'Gerrymandering refers to:', 'multiple_choice', '["A. Voter registration", "B. Manipulation of electoral boundaries", "C. Vote counting", "D. Campaign financing"]', 'B', 'Gerrymandering is the manipulation of electoral constituency boundaries to favor a particular party.', 'medium', 1, 23),

('q_gov_2024_024', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2024_1', 'The secret ballot ensures:', 'multiple_choice', '["A. Public accountability", "B. Voter anonymity", "C. Quick vote counting", "D. Higher voter turnout"]', 'B', 'The secret ballot protects voters'' privacy and allows them to vote without fear or intimidation.', 'easy', 1, 24),

('q_gov_2024_025', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2024_1', 'In a first-past-the-post system, the winner is determined by:', 'multiple_choice', '["A. Proportional representation", "B. Simple majority", "C. Absolute majority", "D. Electoral college"]', 'B', 'In first-past-the-post, the candidate with the most votes wins, even without an absolute majority.', 'medium', 1, 25),

('q_gov_2024_026', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2024_1', 'An independent electoral commission helps to ensure:', 'multiple_choice', '["A. Single party dominance", "B. Free and fair elections", "C. Military intervention", "D. Executive control"]', 'B', 'An independent electoral commission ensures elections are conducted freely and fairly without government interference.', 'easy', 1, 26),

('q_gov_2024_027', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2024_1', 'Political apathy refers to:', 'multiple_choice', '["A. Active political participation", "B. Lack of interest in politics", "C. Military rule", "D. Electoral fraud"]', 'B', 'Political apathy is the lack of interest or indifference towards political affairs and participation.', 'easy', 1, 27),

('q_gov_2024_028', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2024_1', 'Proportional representation ensures that:', 'multiple_choice', '["A. Winner takes all", "B. Parties get seats proportional to votes", "C. Only two parties exist", "D. Voting is direct"]', 'B', 'Proportional representation allocates legislative seats in proportion to the votes each party receives.', 'medium', 1, 28),

('q_gov_2024_029', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2024_1', 'A referendum is used to:', 'multiple_choice', '["A. Elect the president", "B. Seek public opinion on important issues", "C. Appoint judges", "D. Dissolve parliament"]', 'B', 'A referendum is a direct vote in which the entire electorate is asked to vote on a particular proposal.', 'easy', 1, 29),

('q_gov_2024_030', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2024_1', 'The right to vote can be limited for persons who are:', 'multiple_choice', '["A. Women", "B. Illiterate", "C. Mentally incapacitated", "D. Poor"]', 'C', 'Voting rights are typically limited for persons who are mentally incapacitated and cannot make informed decisions.', 'medium', 1, 30),

-- Human Rights and Citizenship (Q31-40)
('q_gov_2024_031', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2024_1', 'Fundamental human rights are:', 'multiple_choice', '["A. Privileges granted by government", "B. Inherent rights of all persons", "C. Rights for citizens only", "D. Rights for adults only"]', 'B', 'Fundamental human rights are inherent to all human beings regardless of nationality, sex, origin, or any other status.', 'easy', 1, 31),

('q_gov_2024_032', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2024_1', 'Citizenship by naturalization is acquired through:', 'multiple_choice', '["A. Birth", "B. Marriage only", "C. Legal process after meeting requirements", "D. Inheritance"]', 'C', 'Naturalization is a legal process by which a person acquires citizenship after meeting certain requirements.', 'easy', 1, 32),

('q_gov_2024_033', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2024_1', 'The right to life can be limited in cases of:', 'multiple_choice', '["A. Theft", "B. Lawful execution of court sentence", "C. Unemployment", "D. Political opposition"]', 'B', 'The right to life may be limited in cases of lawful execution following due process of law.', 'medium', 1, 33),

('q_gov_2024_034', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2024_1', 'Freedom of speech does NOT include the right to:', 'multiple_choice', '["A. Express political views", "B. Criticize the government", "C. Incite violence", "D. Publish newspapers"]', 'C', 'Freedom of speech does not protect speech that incites violence, hatred, or causes public disorder.', 'medium', 1, 34),

('q_gov_2024_035', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2024_1', 'Civic responsibility includes:', 'multiple_choice', '["A. Paying taxes", "B. Evading the law", "C. Political violence", "D. Corruption"]', 'A', 'Paying taxes is a civic responsibility that enables government to provide public services.', 'easy', 1, 35),

('q_gov_2024_036', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2024_1', 'The Universal Declaration of Human Rights was adopted in:', 'multiple_choice', '["A. 1945", "B. 1948", "C. 1960", "D. 1963"]', 'B', 'The Universal Declaration of Human Rights was adopted by the UN General Assembly on December 10, 1948.', 'medium', 1, 36),

('q_gov_2024_037', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2024_1', 'Which of the following is a political right?', 'multiple_choice', '["A. Right to education", "B. Right to vote", "C. Right to work", "D. Right to health"]', 'B', 'The right to vote is a political right that enables citizens to participate in governance.', 'easy', 1, 37),

('q_gov_2024_038', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2024_1', 'Dual citizenship means:', 'multiple_choice', '["A. Having citizenship of two countries", "B. Living in two countries", "C. Speaking two languages", "D. Having two passports only"]', 'A', 'Dual citizenship is when a person is a citizen of two countries simultaneously.', 'easy', 1, 38),

('q_gov_2024_039', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2024_1', 'The Ombudsman is responsible for:', 'multiple_choice', '["A. Making laws", "B. Investigating citizens'' complaints against government", "C. Leading the military", "D. Collecting taxes"]', 'B', 'The Ombudsman investigates complaints by citizens against government officials and agencies.', 'medium', 1, 39),

('q_gov_2024_040', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2024_1', 'A state of emergency may result in:', 'multiple_choice', '["A. Enhanced rights", "B. Suspension of some rights", "C. Permanent dictatorship", "D. Judicial independence"]', 'B', 'During a state of emergency, some constitutional rights may be temporarily suspended for national security.', 'medium', 1, 40),

-- International Organizations and Relations (Q41-50)
('q_gov_2024_041', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2024_1', 'The African Union (AU) replaced the OAU in:', 'multiple_choice', '["A. 2000", "B. 2002", "C. 2004", "D. 2006"]', 'B', 'The African Union was established in 2002, replacing the Organization of African Unity (OAU).', 'medium', 1, 41),

('q_gov_2024_042', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2024_1', 'ECOWAS was established in:', 'multiple_choice', '["A. 1963", "B. 1975", "C. 1980", "D. 1991"]', 'B', 'The Economic Community of West African States (ECOWAS) was established on May 28, 1975.', 'medium', 1, 42),

('q_gov_2024_043', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2024_1', 'The headquarters of the United Nations is located in:', 'multiple_choice', '["A. Geneva", "B. New York", "C. London", "D. Paris"]', 'B', 'The United Nations headquarters is located in New York City, United States.', 'easy', 1, 43),

('q_gov_2024_044', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2024_1', 'The Security Council of the UN has how many permanent members?', 'multiple_choice', '["A. Three", "B. Five", "C. Seven", "D. Ten"]', 'B', 'The UN Security Council has five permanent members: USA, UK, France, Russia, and China.', 'easy', 1, 44),

('q_gov_2024_045', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2024_1', 'Which organ of the UN deals with international disputes?', 'multiple_choice', '["A. General Assembly", "B. International Court of Justice", "C. Security Council", "D. Secretariat"]', 'B', 'The International Court of Justice (ICJ) is the principal judicial organ of the UN for settling legal disputes.', 'medium', 1, 45),

('q_gov_2024_046', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2024_1', 'Non-alignment refers to:', 'multiple_choice', '["A. Joining military alliances", "B. Neutrality during Cold War", "C. Supporting communism", "D. Supporting capitalism"]', 'B', 'Non-alignment was a policy of not aligning with either the Western or Eastern bloc during the Cold War.', 'medium', 1, 46),

('q_gov_2024_047', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2024_1', 'The Commonwealth of Nations is headed by:', 'multiple_choice', '["A. The British Prime Minister", "B. The British Monarch", "C. The UN Secretary General", "D. An elected president"]', 'B', 'The Commonwealth of Nations is headed by the British Monarch as the symbolic head.', 'easy', 1, 47),

('q_gov_2024_048', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2024_1', 'Ghana gained independence in:', 'multiple_choice', '["A. 1957", "B. 1960", "C. 1963", "D. 1966"]', 'A', 'Ghana became the first sub-Saharan African country to gain independence on March 6, 1957.', 'easy', 1, 48),

('q_gov_2024_049', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2024_1', 'The first president of Ghana was:', 'multiple_choice', '["A. J.B. Danquah", "B. Kwame Nkrumah", "C. Kofi Busia", "D. Jerry Rawlings"]', 'B', 'Kwame Nkrumah became the first President of Ghana when it became a republic in 1960.', 'easy', 1, 49),

('q_gov_2024_050', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2024_1', 'A coup d''etat is:', 'multiple_choice', '["A. A peaceful transfer of power", "B. An illegal seizure of power", "C. A democratic election", "D. A referendum"]', 'B', 'A coup d''etat is the sudden, illegal, and often violent overthrow of a government.', 'easy', 1, 50),

-- Government 2023 Questions - Political Concepts (Q1-10)
('q_gov_2023_001', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2023_1', 'Power in a democracy is derived from:', 'multiple_choice', '["A. The military", "B. The people", "C. Traditional rulers", "D. Foreign powers"]', 'B', 'In a democracy, political power is derived from the people who are the ultimate source of authority.', 'easy', 1, 1),

('q_gov_2023_002', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2023_1', 'Which of the following is NOT an organ of government?', 'multiple_choice', '["A. Executive", "B. Legislature", "C. Judiciary", "D. Political party"]', 'D', 'Political parties are not organs of government. The three organs are executive, legislature, and judiciary.', 'easy', 1, 2),

('q_gov_2023_003', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2023_1', 'The concept of legitimacy refers to:', 'multiple_choice', '["A. Legal authority", "B. Popular acceptance of authority", "C. Military power", "D. Economic strength"]', 'B', 'Legitimacy refers to the popular acceptance of a government as being rightfully in power.', 'medium', 1, 3),

('q_gov_2023_004', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2023_1', 'Authority differs from power in that it is:', 'multiple_choice', '["A. Based on force", "B. Recognized as legitimate", "C. Always absolute", "D. Never challenged"]', 'B', 'Authority is power that is recognized as legitimate and rightful by those subject to it.', 'medium', 1, 4),

('q_gov_2023_005', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2023_1', 'A totalitarian state is characterized by:', 'multiple_choice', '["A. Limited government", "B. Complete state control", "C. Free press", "D. Multi-party system"]', 'B', 'A totalitarian state exercises complete control over all aspects of public and private life.', 'easy', 1, 5),

('q_gov_2023_006', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2023_1', 'Which political ideology advocates for government ownership of production?', 'multiple_choice', '["A. Capitalism", "B. Socialism", "C. Fascism", "D. Anarchism"]', 'B', 'Socialism advocates for collective or government ownership of the means of production.', 'easy', 1, 6),

('q_gov_2023_007', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2023_1', 'Communism was developed by:', 'multiple_choice', '["A. Adam Smith", "B. Karl Marx", "C. John Locke", "D. Plato"]', 'B', 'Karl Marx developed the theory of communism along with Friedrich Engels.', 'easy', 1, 7),

('q_gov_2023_008', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2023_1', 'A constitution serves to:', 'multiple_choice', '["A. Limit government power", "B. Give absolute power", "C. Eliminate opposition", "D. Reduce democracy"]', 'A', 'A constitution serves to define and limit the powers of government while protecting citizens'' rights.', 'easy', 1, 8),

('q_gov_2023_009', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2023_1', 'Rigid constitutions are difficult to:', 'multiple_choice', '["A. Understand", "B. Amend", "C. Implement", "D. Write"]', 'B', 'Rigid constitutions require special procedures and often supermajorities to amend.', 'easy', 1, 9),

('q_gov_2023_010', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2023_1', 'An unwritten constitution relies heavily on:', 'multiple_choice', '["A. Statutes and conventions", "B. Single document", "C. Military decrees", "D. Foreign laws"]', 'A', 'Unwritten constitutions are based on statutes, conventions, and judicial decisions rather than a single document.', 'medium', 1, 10),

-- Government Institutions (Q11-20)
('q_gov_2023_011', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2023_1', 'The civil service is expected to be:', 'multiple_choice', '["A. Partisan", "B. Neutral", "C. Elected", "D. Military-based"]', 'B', 'The civil service is expected to be politically neutral and serve any government in power.', 'easy', 1, 11),

('q_gov_2023_012', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2023_1', 'Which of these is a function of the legislature?', 'multiple_choice', '["A. Executing laws", "B. Making laws", "C. Judging cases", "D. Appointing ministers"]', 'B', 'The primary function of the legislature is law-making.', 'easy', 1, 12),

('q_gov_2023_013', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2023_1', 'The Speaker of Parliament is responsible for:', 'multiple_choice', '["A. Executing laws", "B. Presiding over debates", "C. Leading the majority party", "D. Appointing judges"]', 'B', 'The Speaker presides over parliamentary debates and maintains order in the house.', 'easy', 1, 13),

('q_gov_2023_014', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2023_1', 'Judicial review is the power to:', 'multiple_choice', '["A. Make laws", "B. Review laws for constitutionality", "C. Execute judgments", "D. Elect judges"]', 'B', 'Judicial review is the power of courts to examine laws and government actions for constitutionality.', 'medium', 1, 14),

('q_gov_2023_015', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2023_1', 'An independent judiciary is important for:', 'multiple_choice', '["A. Partisan politics", "B. Protecting rights", "C. Military control", "D. Executive dominance"]', 'B', 'An independent judiciary is crucial for protecting citizens'' rights and upholding the rule of law.', 'easy', 1, 15),

('q_gov_2023_016', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2023_1', 'Local government exists to:', 'multiple_choice', '["A. Replace central government", "B. Bring government closer to the people", "C. Eliminate democracy", "D. Control the military"]', 'B', 'Local government brings governance closer to the people and addresses local needs.', 'easy', 1, 16),

('q_gov_2023_017', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2023_1', 'The chief executive of a local council is called:', 'multiple_choice', '["A. President", "B. Chief Executive Officer", "C. Governor", "D. Paramount Chief"]', 'B', 'In Ghana, the head of a Metropolitan, Municipal, or District Assembly is called the Chief Executive.', 'medium', 1, 17),

('q_gov_2023_018', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2023_1', 'Public corporations are established to:', 'multiple_choice', '["A. Make private profit", "B. Provide essential services", "C. Replace government", "D. Reduce employment"]', 'B', 'Public corporations are established to provide essential services to citizens.', 'easy', 1, 18),

('q_gov_2023_019', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2023_1', 'The term "red tape" refers to:', 'multiple_choice', '["A. Government efficiency", "B. Bureaucratic delays", "C. Quick service", "D. Military rule"]', 'B', 'Red tape refers to excessive bureaucracy and administrative procedures that cause delays.', 'easy', 1, 19),

('q_gov_2023_020', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2023_1', 'Decentralization involves:', 'multiple_choice', '["A. Concentrating power at center", "B. Distributing power to lower levels", "C. Military takeover", "D. Eliminating local government"]', 'B', 'Decentralization is the transfer of authority and responsibility from central to local government.', 'easy', 1, 20),

-- Electoral Systems and Political Parties (Q21-30)
('q_gov_2023_021', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2023_1', 'A one-party state is characterized by:', 'multiple_choice', '["A. Multiple parties", "B. Single legal party", "C. No government", "D. Foreign rule"]', 'B', 'A one-party state allows only one political party to hold power.', 'easy', 1, 21),

('q_gov_2023_022', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2023_1', 'The main disadvantage of a two-party system is:', 'multiple_choice', '["A. Political stability", "B. Limited voter choice", "C. Strong government", "D. Clear mandate"]', 'B', 'A two-party system limits voter choice to essentially two political options.', 'medium', 1, 22),

('q_gov_2023_023', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2023_1', 'A coalition government is formed when:', 'multiple_choice', '["A. One party wins majority", "B. Parties combine to form government", "C. Military takes over", "D. Elections are cancelled"]', 'B', 'A coalition government is formed when no single party has a majority and parties combine.', 'easy', 1, 23),

('q_gov_2023_024', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2023_1', 'The electoral commission is responsible for:', 'multiple_choice', '["A. Making laws", "B. Organizing elections", "C. Judging cases", "D. Forming government"]', 'B', 'The electoral commission is responsible for organizing and conducting elections.', 'easy', 1, 24),

('q_gov_2023_025', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2023_1', 'Voter registration is important because it:', 'multiple_choice', '["A. Prevents elections", "B. Ensures eligible persons vote", "C. Reduces turnout", "D. Eliminates parties"]', 'B', 'Voter registration ensures that only eligible citizens participate in elections.', 'easy', 1, 25),

('q_gov_2023_026', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2023_1', 'Election rigging undermines:', 'multiple_choice', '["A. Military rule", "B. Democratic principles", "C. One-party states", "D. Traditional authority"]', 'B', 'Election rigging undermines the democratic principles of free and fair elections.', 'easy', 1, 26),

('q_gov_2023_027', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2023_1', 'A plebiscite is similar to:', 'multiple_choice', '["A. General election", "B. Referendum", "C. By-election", "D. Primary election"]', 'B', 'A plebiscite is similar to a referendum as both involve direct voting on specific issues.', 'medium', 1, 27),

('q_gov_2023_028', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2023_1', 'The primary election is used to:', 'multiple_choice', '["A. Elect the president", "B. Select party candidates", "C. Form government", "D. Dissolve parliament"]', 'B', 'Primary elections are used to select candidates who will represent the party in general elections.', 'easy', 1, 28),

('q_gov_2023_029', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2023_1', 'An absolute majority means:', 'multiple_choice', '["A. 50% plus one vote", "B. Simple majority", "C. Two-thirds majority", "D. Unanimous vote"]', 'A', 'An absolute majority is more than half of all votes cast (50% plus one).', 'easy', 1, 29),

('q_gov_2023_030', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2023_1', 'The opposition in parliament functions to:', 'multiple_choice', '["A. Support all government policies", "B. Criticize and provide alternatives", "C. Obstruct all legislation", "D. Form the government"]', 'B', 'The opposition''s role is to scrutinize government, criticize policies, and offer alternatives.', 'easy', 1, 30),

-- Nigerian and Ghanaian Political History (Q31-40)
('q_gov_2023_031', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2023_1', 'The first military coup in Ghana occurred in:', 'multiple_choice', '["A. 1960", "B. 1966", "C. 1972", "D. 1979"]', 'B', 'The first military coup in Ghana occurred on February 24, 1966, overthrowing Nkrumah.', 'medium', 1, 31),

('q_gov_2023_032', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2023_1', 'The Fourth Republic of Ghana began in:', 'multiple_choice', '["A. 1979", "B. 1981", "C. 1992", "D. 2000"]', 'C', 'Ghana''s Fourth Republic began in 1992 under the new constitution.', 'easy', 1, 32),

('q_gov_2023_033', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2023_1', 'Nigeria gained independence in:', 'multiple_choice', '["A. 1957", "B. 1960", "C. 1963", "D. 1966"]', 'B', 'Nigeria gained independence from Britain on October 1, 1960.', 'easy', 1, 33),

('q_gov_2023_034', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2023_1', 'The Biafran War in Nigeria occurred between:', 'multiple_choice', '["A. 1960-1963", "B. 1967-1970", "C. 1975-1979", "D. 1983-1985"]', 'B', 'The Nigerian Civil War (Biafran War) lasted from 1967 to 1970.', 'medium', 1, 34),

('q_gov_2023_035', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2023_1', 'The Convention People''s Party was founded by:', 'multiple_choice', '["A. J.B. Danquah", "B. Kwame Nkrumah", "C. Kofi Busia", "D. William Ofori-Atta"]', 'B', 'Kwame Nkrumah founded the Convention People''s Party (CPP) in 1949.', 'easy', 1, 35),

('q_gov_2023_036', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2023_1', 'Ghana''s "Big Six" were:', 'multiple_choice', '["A. Military leaders", "B. Nationalist leaders", "C. Traditional chiefs", "D. Colonial governors"]', 'B', 'The Big Six were the six Ghanaian nationalist leaders who led the independence movement.', 'easy', 1, 36),

('q_gov_2023_037', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2023_1', 'Indirect rule was practiced mostly in:', 'multiple_choice', '["A. Northern Nigeria", "B. Southern Nigeria", "C. Ghana only", "D. Liberia"]', 'A', 'Indirect rule was most successfully practiced in Northern Nigeria through traditional rulers.', 'medium', 1, 37),

('q_gov_2023_038', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2023_1', 'The Preventive Detention Act in Ghana was used to:', 'multiple_choice', '["A. Protect citizens", "B. Detain political opponents", "C. Promote democracy", "D. Hold elections"]', 'B', 'The Preventive Detention Act was used by Nkrumah''s government to detain political opponents without trial.', 'medium', 1, 38),

('q_gov_2023_039', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2023_1', 'The 1979 constitution of Ghana established:', 'multiple_choice', '["A. One-party state", "B. Multi-party democracy", "C. Military rule", "D. Monarchy"]', 'B', 'The 1979 constitution established a multi-party democratic system in Ghana.', 'easy', 1, 39),

('q_gov_2023_040', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2023_1', 'The National Democratic Congress in Ghana was founded by:', 'multiple_choice', '["A. J.A. Kufuor", "B. Jerry Rawlings", "C. Kofi Busia", "D. Nana Akufo-Addo"]', 'B', 'The National Democratic Congress (NDC) was founded by Jerry John Rawlings in 1992.', 'easy', 1, 40),

-- International Relations (Q41-50)
('q_gov_2023_041', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2023_1', 'Diplomacy is primarily used to:', 'multiple_choice', '["A. Wage war", "B. Resolve conflicts peacefully", "C. Expand territory", "D. Control other nations"]', 'B', 'Diplomacy is the art of conducting negotiations between nations to resolve issues peacefully.', 'easy', 1, 41),

('q_gov_2023_042', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2023_1', 'An ambassador is:', 'multiple_choice', '["A. A military officer", "B. A diplomatic representative", "C. A trade officer", "D. A spy"]', 'B', 'An ambassador is the highest-ranking diplomatic representative of one country to another.', 'easy', 1, 42),

('q_gov_2023_043', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2023_1', 'Diplomatic immunity means diplomats:', 'multiple_choice', '["A. Are above the law", "B. Cannot be prosecuted in host country", "C. Have no privileges", "D. Must obey all local laws"]', 'B', 'Diplomatic immunity protects diplomats from prosecution under the host country''s laws.', 'medium', 1, 43),

('q_gov_2023_044', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2023_1', 'The AU''s headquarters is located in:', 'multiple_choice', '["A. Lagos", "B. Nairobi", "C. Addis Ababa", "D. Cairo"]', 'C', 'The African Union headquarters is located in Addis Ababa, Ethiopia.', 'easy', 1, 44),

('q_gov_2023_045', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2023_1', 'ECOWAS promotes:', 'multiple_choice', '["A. Military alliance", "B. Economic integration", "C. Cultural isolation", "D. Political division"]', 'B', 'ECOWAS was established to promote economic integration among West African states.', 'easy', 1, 45),

('q_gov_2023_046', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2023_1', 'The veto power in the UN Security Council:', 'multiple_choice', '["A. Can be used by any member", "B. Is reserved for permanent members", "C. Has been abolished", "D. Applies to all UN organs"]', 'B', 'The veto power is exclusive to the five permanent members of the Security Council.', 'medium', 1, 46),

('q_gov_2023_047', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2023_1', 'WHO is responsible for:', 'multiple_choice', '["A. International trade", "B. Global health", "C. Peacekeeping", "D. Education"]', 'B', 'The World Health Organization (WHO) is the UN agency responsible for international public health.', 'easy', 1, 47),

('q_gov_2023_048', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2023_1', 'Pan-Africanism advocates for:', 'multiple_choice', '["A. European unity", "B. African unity", "C. Asian cooperation", "D. American integration"]', 'B', 'Pan-Africanism is a movement advocating for the unity and solidarity of African peoples.', 'easy', 1, 48),

('q_gov_2023_049', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2023_1', 'Colonialism in Africa ended mainly:', 'multiple_choice', '["A. Through peaceful means only", "B. Through armed struggle only", "C. Through various means", "D. Has not ended"]', 'C', 'African independence was achieved through various means including negotiations and armed struggles.', 'easy', 1, 49),

('q_gov_2023_050', 'subj_wassce_government', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_gov_2023_1', 'Neo-colonialism refers to:', 'multiple_choice', '["A. New form of direct rule", "B. Indirect control of former colonies", "C. End of colonialism", "D. African unity"]', 'B', 'Neo-colonialism refers to the continued economic and political control of former colonies by former colonial powers.', 'medium', 1, 50);
