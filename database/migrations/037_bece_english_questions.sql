-- Migration 037: BECE English Language Questions
-- 40 questions each for 2024 and 2023 Paper 1

INSERT OR REPLACE INTO questions (id, subject_id, exam_type_id, paper_type_id, past_paper_id, question_text, question_type, options, correct_answer, explanation, difficulty, marks, question_number) VALUES

-- BECE English 2024 Paper 1
('q_bece_eng_2024_001', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2024_1', 'Choose the correct word: She _____ to school every day.', 'multiple_choice', '["A. go", "B. goes", "C. going", "D. gone"]', 'B', 'Third person singular (She) takes "goes" in simple present.', 'easy', 1, 1),

('q_bece_eng_2024_002', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2024_1', 'The plural of "child" is:', 'multiple_choice', '["A. childs", "B. childes", "C. children", "D. childrens"]', 'C', 'Child has an irregular plural form: children.', 'easy', 1, 2),

('q_bece_eng_2024_003', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2024_1', 'Which word is a noun?', 'multiple_choice', '["A. Run", "B. Beautiful", "C. Quickly", "D. Happiness"]', 'D', 'Happiness is a noun (abstract noun). Run is a verb, beautiful is an adjective, quickly is an adverb.', 'easy', 1, 3),

('q_bece_eng_2024_004', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2024_1', 'Choose the correct spelling:', 'multiple_choice', '["A. Tommorow", "B. Tomorow", "C. Tomorrow", "D. Tomorro"]', 'C', 'The correct spelling is "tomorrow".', 'easy', 1, 4),

('q_bece_eng_2024_005', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2024_1', 'The opposite of "happy" is:', 'multiple_choice', '["A. Glad", "B. Joyful", "C. Sad", "D. Excited"]', 'C', 'Sad is the opposite (antonym) of happy.', 'easy', 1, 5),

('q_bece_eng_2024_006', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2024_1', 'Choose the correct preposition: The book is _____ the table.', 'multiple_choice', '["A. in", "B. on", "C. at", "D. by"]', 'B', 'We use "on" for surfaces - the book is on the table.', 'easy', 1, 6),

('q_bece_eng_2024_007', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2024_1', 'Which sentence is correct?', 'multiple_choice', '["A. I is a student", "B. I am a student", "C. I are a student", "D. I be a student"]', 'B', '"I" takes "am" as the correct form of the verb "to be".', 'easy', 1, 7),

('q_bece_eng_2024_008', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2024_1', 'The past tense of "eat" is:', 'multiple_choice', '["A. eated", "B. eating", "C. ate", "D. eaten"]', 'C', 'Eat is irregular: eat - ate - eaten.', 'easy', 1, 8),

('q_bece_eng_2024_009', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2024_1', 'Choose the correct word: They have _____ their homework.', 'multiple_choice', '["A. do", "B. did", "C. done", "D. doing"]', 'C', 'Present perfect uses "have" + past participle: have done.', 'easy', 1, 9),

('q_bece_eng_2024_010', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2024_1', 'A word with the same meaning as "big" is:', 'multiple_choice', '["A. Small", "B. Large", "C. Tiny", "D. Little"]', 'B', 'Large is a synonym of big.', 'easy', 1, 10),

('q_bece_eng_2024_011', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2024_1', 'Which word is an adjective?', 'multiple_choice', '["A. Slowly", "B. Beautiful", "C. Jump", "D. Happiness"]', 'B', 'Beautiful describes a noun and is an adjective.', 'easy', 1, 11),

('q_bece_eng_2024_012', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2024_1', 'The article used before "umbrella" is:', 'multiple_choice', '["A. a", "B. an", "C. the", "D. no article"]', 'B', '"An" is used before words beginning with vowel sounds.', 'easy', 1, 12),

('q_bece_eng_2024_013', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2024_1', 'Choose the correctly punctuated sentence:', 'multiple_choice', '["A. where are you going", "B. Where are you going?", "C. Where are you going.", "D. where are you going?"]', 'B', 'Questions start with capital letter and end with question mark.', 'easy', 1, 13),

('q_bece_eng_2024_014', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2024_1', 'The pronoun that replaces "John" is:', 'multiple_choice', '["A. She", "B. It", "C. He", "D. They"]', 'C', 'John is a male name, so "he" is the correct pronoun.', 'easy', 1, 14),

('q_bece_eng_2024_015', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2024_1', 'Which word rhymes with "cat"?', 'multiple_choice', '["A. Cut", "B. Bat", "C. Cot", "D. Kit"]', 'B', 'Cat and bat have the same ending sound (-at).', 'easy', 1, 15),

('q_bece_eng_2024_016', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2024_1', 'The plural of "mouse" is:', 'multiple_choice', '["A. mouses", "B. mices", "C. mice", "D. mousies"]', 'C', 'Mouse has an irregular plural: mice.', 'easy', 1, 16),

('q_bece_eng_2024_017', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2024_1', 'Choose the correct form: Mary is _____ than John.', 'multiple_choice', '["A. tall", "B. taller", "C. tallest", "D. more tall"]', 'B', 'Comparative form for one-syllable adjectives: taller.', 'easy', 1, 17),

('q_bece_eng_2024_018', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2024_1', 'A sentence that gives a command is called:', 'multiple_choice', '["A. Interrogative", "B. Exclamatory", "C. Imperative", "D. Declarative"]', 'C', 'Imperative sentences give commands or make requests.', 'medium', 1, 18),

('q_bece_eng_2024_019', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2024_1', 'Which word is an adverb?', 'multiple_choice', '["A. Quick", "B. Quickly", "C. Quicker", "D. Quickest"]', 'B', 'Quickly (ending in -ly) is an adverb modifying verbs.', 'easy', 1, 19),

('q_bece_eng_2024_020', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2024_1', 'The contraction of "do not" is:', 'multiple_choice', '["A. dont", "B. don''t", "C. do''nt", "D. d''ont"]', 'B', 'Don''t is the correct contraction (apostrophe replaces "o").', 'easy', 1, 20),

('q_bece_eng_2024_021', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2024_1', 'Choose the correct word: _____ book is this?', 'multiple_choice', '["A. Who", "B. Whose", "C. Whom", "D. Which"]', 'B', 'Whose is the possessive form used to ask about ownership.', 'easy', 1, 21),

('q_bece_eng_2024_022', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2024_1', 'The word "unhappy" has the prefix:', 'multiple_choice', '["A. un-", "B. -happy", "C. -un", "D. hap-"]', 'A', '"Un-" is a prefix meaning "not", added to the beginning of happy.', 'easy', 1, 22),

('q_bece_eng_2024_023', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2024_1', 'A group of cows is called a:', 'multiple_choice', '["A. flock", "B. herd", "C. pack", "D. swarm"]', 'B', 'A herd of cows (collective noun).', 'medium', 1, 23),

('q_bece_eng_2024_024', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2024_1', 'Choose the correct sentence:', 'multiple_choice', '["A. The boys is playing", "B. The boys are playing", "C. The boys am playing", "D. The boys was playing"]', 'B', 'Plural subject (boys) takes plural verb (are).', 'easy', 1, 24),

('q_bece_eng_2024_025', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2024_1', 'The feminine of "lion" is:', 'multiple_choice', '["A. lioness", "B. lions", "C. lion girl", "D. female lion"]', 'A', 'Lioness is the feminine form of lion.', 'easy', 1, 25),

('q_bece_eng_2024_026', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2024_1', 'Which sentence is in passive voice?', 'multiple_choice', '["A. The cat chased the mouse", "B. The mouse was chased by the cat", "C. The cat is chasing", "D. The mouse ran away"]', 'B', 'Passive voice: subject receives the action (was chased).', 'medium', 1, 26),

('q_bece_eng_2024_027', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2024_1', 'The suffix in "careful" is:', 'multiple_choice', '["A. care-", "B. -ful", "C. car-", "D. -eful"]', 'B', '"-ful" is a suffix meaning "full of".', 'easy', 1, 27),

('q_bece_eng_2024_028', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2024_1', 'Choose the correct word: She is _____ oldest in the class.', 'multiple_choice', '["A. a", "B. an", "C. the", "D. no article"]', 'C', '"The" is used with superlatives (the oldest).', 'easy', 1, 28),

('q_bece_eng_2024_029', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2024_1', 'Which word is a verb?', 'multiple_choice', '["A. Beautiful", "B. Singing", "C. Beauty", "D. Beautifully"]', 'B', 'Singing is a verb (action word).', 'easy', 1, 29),

('q_bece_eng_2024_030', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2024_1', 'The opposite of "hot" is:', 'multiple_choice', '["A. warm", "B. cool", "C. cold", "D. boiling"]', 'C', 'Cold is the direct opposite of hot.', 'easy', 1, 30),

('q_bece_eng_2024_031', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2024_1', 'Choose the correct word: I have _____ apple.', 'multiple_choice', '["A. a", "B. an", "C. the", "D. some"]', 'B', '"An" is used before words beginning with vowel sounds (apple).', 'easy', 1, 31),

('q_bece_eng_2024_032', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2024_1', 'The past tense of "run" is:', 'multiple_choice', '["A. runned", "B. running", "C. ran", "D. runs"]', 'C', 'Run is irregular: run - ran - run.', 'easy', 1, 32),

('q_bece_eng_2024_033', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2024_1', 'A person who writes books is called an:', 'multiple_choice', '["A. actor", "B. author", "C. artist", "D. athlete"]', 'B', 'An author is someone who writes books.', 'easy', 1, 33),

('q_bece_eng_2024_034', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2024_1', 'Which word has three syllables?', 'multiple_choice', '["A. Book", "B. Happy", "C. Beautiful", "D. Day"]', 'C', 'Beau-ti-ful has three syllables.', 'easy', 1, 34),

('q_bece_eng_2024_035', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2024_1', 'The plural of "tooth" is:', 'multiple_choice', '["A. tooths", "B. teeth", "C. toothes", "D. teeths"]', 'B', 'Tooth has an irregular plural: teeth.', 'easy', 1, 35),

('q_bece_eng_2024_036', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2024_1', 'Choose the correct preposition: The ball rolled _____ the hill.', 'multiple_choice', '["A. up", "B. down", "C. in", "D. at"]', 'B', '"Down" indicates movement from higher to lower position.', 'easy', 1, 36),

('q_bece_eng_2024_037', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2024_1', 'A story that is not true is called:', 'multiple_choice', '["A. fiction", "B. non-fiction", "C. biography", "D. history"]', 'A', 'Fiction refers to made-up stories.', 'easy', 1, 37),

('q_bece_eng_2024_038', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2024_1', 'The superlative of "good" is:', 'multiple_choice', '["A. gooder", "B. more good", "C. better", "D. best"]', 'D', 'Good - better - best (irregular comparison).', 'easy', 1, 38),

('q_bece_eng_2024_039', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2024_1', 'Choose the correct sentence:', 'multiple_choice', '["A. He goed to school", "B. He went to school", "C. He going to school", "D. He go to school"]', 'B', '"Went" is the past tense of "go".', 'easy', 1, 39),

('q_bece_eng_2024_040', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2024_1', 'A person who bakes bread is called a:', 'multiple_choice', '["A. butcher", "B. baker", "C. barber", "D. banker"]', 'B', 'A baker bakes bread and other goods.', 'easy', 1, 40),

-- BECE English 2023 Paper 1
('q_bece_eng_2023_001', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2023_1', 'The past tense of "see" is:', 'multiple_choice', '["A. seed", "B. seen", "C. saw", "D. seeing"]', 'C', 'See is irregular: see - saw - seen.', 'easy', 1, 1),

('q_bece_eng_2023_002', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2023_1', 'Choose the correctly spelled word:', 'multiple_choice', '["A. Recieve", "B. Receive", "C. Recive", "D. Receeve"]', 'B', 'The correct spelling is "receive" (i before e, except after c).', 'easy', 1, 2),

('q_bece_eng_2023_003', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2023_1', 'The plural of "leaf" is:', 'multiple_choice', '["A. leafs", "B. leaves", "C. leafes", "D. leafies"]', 'B', 'Words ending in -f change to -ves: leaf - leaves.', 'easy', 1, 3),

('q_bece_eng_2023_004', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2023_1', 'Choose the correct word: The boys _____ playing football.', 'multiple_choice', '["A. is", "B. am", "C. are", "D. was"]', 'C', 'Plural subject (boys) takes "are".', 'easy', 1, 4),

('q_bece_eng_2023_005', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2023_1', 'A word that means the same as "quick" is:', 'multiple_choice', '["A. slow", "B. fast", "C. lazy", "D. heavy"]', 'B', 'Fast is a synonym of quick.', 'easy', 1, 5),

('q_bece_eng_2023_006', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2023_1', 'Choose the correct preposition: I wake up _____ 6 o''clock.', 'multiple_choice', '["A. in", "B. on", "C. at", "D. by"]', 'C', 'We use "at" with specific times.', 'easy', 1, 6),

('q_bece_eng_2023_007', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2023_1', 'Which word is a pronoun?', 'multiple_choice', '["A. Run", "B. They", "C. Beautiful", "D. Quickly"]', 'B', '"They" is a pronoun that replaces nouns.', 'easy', 1, 7),

('q_bece_eng_2023_008', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2023_1', 'The opposite of "old" is:', 'multiple_choice', '["A. ancient", "B. young", "C. aged", "D. elderly"]', 'B', 'Young is the opposite of old.', 'easy', 1, 8),

('q_bece_eng_2023_009', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2023_1', 'Choose the correct sentence:', 'multiple_choice', '["A. She can sings well", "B. She can sing well", "C. She can singing well", "D. She can sang well"]', 'B', 'Modal verbs (can) are followed by base form of verb (sing).', 'easy', 1, 9),

('q_bece_eng_2023_010', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2023_1', 'The masculine of "queen" is:', 'multiple_choice', '["A. princess", "B. prince", "C. king", "D. duke"]', 'C', 'King is the masculine of queen.', 'easy', 1, 10),

('q_bece_eng_2023_011', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2023_1', 'Which sentence is a question?', 'multiple_choice', '["A. Close the door.", "B. What a beautiful day!", "C. Where is your bag?", "D. I love reading."]', 'C', 'Questions ask for information and end with question marks.', 'easy', 1, 11),

('q_bece_eng_2023_012', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2023_1', 'The word "beautiful" is an:', 'multiple_choice', '["A. noun", "B. verb", "C. adjective", "D. adverb"]', 'C', 'Beautiful describes nouns and is an adjective.', 'easy', 1, 12),

('q_bece_eng_2023_013', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2023_1', 'Choose the correct word: Neither John nor Mary _____ present.', 'multiple_choice', '["A. are", "B. is", "C. were", "D. have"]', 'B', 'With "neither...nor", verb agrees with nearer subject (Mary - singular).', 'medium', 1, 13),

('q_bece_eng_2023_014', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2023_1', 'A group of fish is called a:', 'multiple_choice', '["A. herd", "B. flock", "C. school", "D. pack"]', 'C', 'A school of fish is the correct collective noun.', 'medium', 1, 14),

('q_bece_eng_2023_015', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2023_1', 'The comparative form of "bad" is:', 'multiple_choice', '["A. badder", "B. more bad", "C. worse", "D. baddest"]', 'C', 'Bad - worse - worst (irregular comparison).', 'easy', 1, 15),

('q_bece_eng_2023_016', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2023_1', 'Choose the correctly punctuated sentence:', 'multiple_choice', '["A. john lives in accra", "B. John lives in Accra", "C. john Lives in Accra", "D. John lives in accra"]', 'B', 'Proper nouns (John, Accra) start with capital letters.', 'easy', 1, 16),

('q_bece_eng_2023_017', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2023_1', 'The contraction of "I will" is:', 'multiple_choice', '["A. I''ll", "B. I''d", "C. I''m", "D. I''ve"]', 'A', 'I''ll is the contraction of I will.', 'easy', 1, 17),

('q_bece_eng_2023_018', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2023_1', 'Which word has two syllables?', 'multiple_choice', '["A. Cat", "B. Pencil", "C. Understand", "D. I"]', 'B', 'Pen-cil has two syllables.', 'easy', 1, 18),

('q_bece_eng_2023_019', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2023_1', 'The past tense of "write" is:', 'multiple_choice', '["A. writed", "B. written", "C. wrote", "D. writing"]', 'C', 'Write is irregular: write - wrote - written.', 'easy', 1, 19),

('q_bece_eng_2023_020', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2023_1', 'A person who teaches is called a:', 'multiple_choice', '["A. doctor", "B. nurse", "C. teacher", "D. farmer"]', 'C', 'A teacher is someone who teaches.', 'easy', 1, 20),

('q_bece_eng_2023_021', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2023_1', 'Choose the correct word: She speaks _____.', 'multiple_choice', '["A. loud", "B. loudly", "C. louder", "D. loudest"]', 'B', 'Adverb "loudly" modifies the verb "speaks".', 'easy', 1, 21),

('q_bece_eng_2023_022', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2023_1', 'The plural of "man" is:', 'multiple_choice', '["A. mans", "B. mens", "C. men", "D. manes"]', 'C', 'Man has an irregular plural: men.', 'easy', 1, 22),

('q_bece_eng_2023_023', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2023_1', 'Which word begins with a vowel sound?', 'multiple_choice', '["A. House", "B. Unit", "C. Hour", "D. Yellow"]', 'C', '"Hour" begins with a vowel sound (the H is silent).', 'medium', 1, 23),

('q_bece_eng_2023_024', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2023_1', 'Choose the correct word: This is _____ pen.', 'multiple_choice', '["A. me", "B. I", "C. my", "D. mine"]', 'C', '"My" is a possessive adjective used before a noun.', 'easy', 1, 24),

('q_bece_eng_2023_025', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2023_1', 'The opposite of "early" is:', 'multiple_choice', '["A. soon", "B. late", "C. quick", "D. fast"]', 'B', 'Late is the opposite of early.', 'easy', 1, 25),

('q_bece_eng_2023_026', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2023_1', 'A compound word is:', 'multiple_choice', '["A. Running", "B. Sunflower", "C. Happy", "D. Quickly"]', 'B', 'Sunflower is a compound word (sun + flower).', 'easy', 1, 26),

('q_bece_eng_2023_027', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2023_1', 'Choose the correct word: She is the _____ student in the class.', 'multiple_choice', '["A. clever", "B. cleverer", "C. cleverest", "D. more clever"]', 'C', 'Superlative form is used with "the": the cleverest.', 'easy', 1, 27),

('q_bece_eng_2023_028', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2023_1', 'The young one of a dog is called a:', 'multiple_choice', '["A. kitten", "B. cub", "C. puppy", "D. calf"]', 'C', 'A puppy is a young dog.', 'easy', 1, 28),

('q_bece_eng_2023_029', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2023_1', 'Which sentence is correct?', 'multiple_choice', '["A. He don''t like rice", "B. He doesn''t like rice", "C. He doesn''t likes rice", "D. He not like rice"]', 'B', 'Third person singular uses "doesn''t" + base verb.', 'easy', 1, 29),

('q_bece_eng_2023_030', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2023_1', 'The word "untrue" means:', 'multiple_choice', '["A. very true", "B. not true", "C. sometimes true", "D. always true"]', 'B', 'The prefix "un-" means "not": untrue = not true.', 'easy', 1, 30),

('q_bece_eng_2023_031', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2023_1', 'Choose the correct preposition: The bird flew _____ the window.', 'multiple_choice', '["A. through", "B. at", "C. in", "D. on"]', 'A', '"Through" indicates movement from one side to the other.', 'easy', 1, 31),

('q_bece_eng_2023_032', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2023_1', 'A person who sells meat is called a:', 'multiple_choice', '["A. baker", "B. butcher", "C. barber", "D. builder"]', 'B', 'A butcher sells meat.', 'easy', 1, 32),

('q_bece_eng_2023_033', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2023_1', 'Which word rhymes with "night"?', 'multiple_choice', '["A. Net", "B. Neat", "C. Light", "D. Knit"]', 'C', 'Night and light have the same ending sound (-ight).', 'easy', 1, 33),

('q_bece_eng_2023_034', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2023_1', 'The past tense of "buy" is:', 'multiple_choice', '["A. buyed", "B. buying", "C. bought", "D. buys"]', 'C', 'Buy is irregular: buy - bought - bought.', 'easy', 1, 34),

('q_bece_eng_2023_035', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2023_1', 'Choose the correct sentence:', 'multiple_choice', '["A. There is many books on the table", "B. There are many books on the table", "C. There was many books on the table", "D. There am many books on the table"]', 'B', 'Plural subject (books) requires "are".', 'easy', 1, 35),

('q_bece_eng_2023_036', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2023_1', 'The plural of "hero" is:', 'multiple_choice', '["A. heros", "B. heroes", "C. herose", "D. heroies"]', 'B', 'Words ending in -o often add -es: heroes.', 'easy', 1, 36),

('q_bece_eng_2023_037', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2023_1', 'Which word is an abstract noun?', 'multiple_choice', '["A. Table", "B. Happiness", "C. Dog", "D. River"]', 'B', 'Happiness cannot be perceived through the senses (abstract).', 'medium', 1, 37),

('q_bece_eng_2023_038', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2023_1', 'A place where books are kept is called a:', 'multiple_choice', '["A. hospital", "B. library", "C. laboratory", "D. museum"]', 'B', 'A library is a place for keeping and borrowing books.', 'easy', 1, 38),

('q_bece_eng_2023_039', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2023_1', 'Choose the correct word: I have _____ finished my work.', 'multiple_choice', '["A. yet", "B. still", "C. already", "D. since"]', 'C', '"Already" is used in affirmative sentences with present perfect.', 'easy', 1, 39),

('q_bece_eng_2023_040', 'subj_bece_english', 'exam_bece', 'paper_bece_1', 'pp_bece_eng_2023_1', 'The feminine of "nephew" is:', 'multiple_choice', '["A. aunt", "B. niece", "C. cousin", "D. sister"]', 'B', 'Niece is the feminine of nephew.', 'easy', 1, 40);
