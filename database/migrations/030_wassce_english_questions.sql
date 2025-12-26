-- Migration 030: WASSCE English Language Questions
-- 50 questions each for 2024 and 2023 Paper 1

-- WASSCE English Language 2024 Paper 1
INSERT OR REPLACE INTO questions (id, subject_id, exam_type_id, paper_type_id, past_paper_id, question_text, question_type, options, correct_answer, explanation, difficulty, marks, question_number) VALUES

-- Comprehension and Summary (Questions 1-15)
('q_eng_2024_001', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2024_1', 'Choose the word that best completes the sentence: The manager''s decision was _____ by all the employees.', 'multiple_choice', '["A. applauded", "B. applaud", "C. applauding", "D. applauds"]', 'A', 'The passive voice requires the past participle "applauded".', 'medium', 1, 1),

('q_eng_2024_002', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2024_1', 'Select the correct option: Neither the teacher nor the students _____ present.', 'multiple_choice', '["A. was", "B. were", "C. is", "D. are"]', 'B', 'When "neither...nor" connects subjects, the verb agrees with the nearer subject (students - plural).', 'medium', 1, 2),

('q_eng_2024_003', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2024_1', 'The word "ubiquitous" means:', 'multiple_choice', '["A. rare", "B. present everywhere", "C. dangerous", "D. beautiful"]', 'B', 'Ubiquitous means being present, appearing, or found everywhere.', 'hard', 1, 3),

('q_eng_2024_004', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2024_1', 'Choose the correct spelling:', 'multiple_choice', '["A. accomodation", "B. acommodation", "C. accommodation", "D. acomodation"]', 'C', 'Accommodation has two c''s and two m''s.', 'easy', 1, 4),

('q_eng_2024_005', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2024_1', 'The opposite of "benevolent" is:', 'multiple_choice', '["A. kind", "B. generous", "C. malevolent", "D. caring"]', 'C', 'Benevolent means well-meaning and kindly; malevolent means having evil intentions.', 'medium', 1, 5),

('q_eng_2024_006', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2024_1', 'Identify the figure of speech: "The wind whispered through the trees."', 'multiple_choice', '["A. Simile", "B. Metaphor", "C. Personification", "D. Hyperbole"]', 'C', 'Personification gives human qualities (whispering) to non-human things (wind).', 'medium', 1, 6),

('q_eng_2024_007', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2024_1', 'Choose the correct form: If I _____ rich, I would travel the world.', 'multiple_choice', '["A. am", "B. was", "C. were", "D. be"]', 'C', 'In conditional sentences expressing hypothetical situations, "were" is used for all subjects.', 'medium', 1, 7),

('q_eng_2024_008', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2024_1', 'The phrase "to burn the midnight oil" means:', 'multiple_choice', '["A. to waste resources", "B. to work late into the night", "C. to start a fire", "D. to cook at night"]', 'B', 'This idiom means to work or study late into the night.', 'easy', 1, 8),

('q_eng_2024_009', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2024_1', 'Which sentence is grammatically correct?', 'multiple_choice', '["A. He don''t know the answer", "B. He doesn''t knows the answer", "C. He doesn''t know the answer", "D. He don''t knows the answer"]', 'C', 'Third person singular requires "doesn''t" + base form of verb.', 'easy', 1, 9),

('q_eng_2024_010', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2024_1', 'A word that sounds the same as another but has different meaning is called:', 'multiple_choice', '["A. Synonym", "B. Antonym", "C. Homophone", "D. Homograph"]', 'C', 'Homophones are words that sound alike but differ in meaning (e.g., "there" and "their").', 'medium', 1, 10),

('q_eng_2024_011', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2024_1', 'Choose the correct preposition: She arrived _____ the airport on time.', 'multiple_choice', '["A. in", "B. at", "C. on", "D. by"]', 'B', 'We use "at" with specific locations like airports, stations, etc.', 'easy', 1, 11),

('q_eng_2024_012', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2024_1', 'The literary device used in "She sells seashells by the seashore" is:', 'multiple_choice', '["A. Assonance", "B. Alliteration", "C. Onomatopoeia", "D. Consonance"]', 'B', 'Alliteration is the repetition of initial consonant sounds (s sounds).', 'medium', 1, 12),

('q_eng_2024_013', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2024_1', 'Which word is an adverb?', 'multiple_choice', '["A. Quick", "B. Quickly", "C. Quicker", "D. Quickest"]', 'B', 'Adverbs typically end in -ly and modify verbs, adjectives, or other adverbs.', 'easy', 1, 13),

('q_eng_2024_014', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2024_1', 'The passive form of "The cat caught the mouse" is:', 'multiple_choice', '["A. The mouse was caught by the cat", "B. The mouse is caught by the cat", "C. The mouse caught the cat", "D. The cat was caught by the mouse"]', 'A', 'In passive voice, the object becomes the subject and the verb becomes "was + past participle".', 'medium', 1, 14),

('q_eng_2024_015', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2024_1', 'Choose the correct word: The news _____ shocking.', 'multiple_choice', '["A. are", "B. were", "C. is", "D. have been"]', 'C', '"News" is an uncountable noun and takes a singular verb.', 'medium', 1, 15),

-- Lexis and Structure (Questions 16-35)
('q_eng_2024_016', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2024_1', 'The word "gregarious" means:', 'multiple_choice', '["A. shy and reserved", "B. fond of company", "C. angry and hostile", "D. lazy and slow"]', 'B', 'Gregarious means enjoying the company of others; sociable.', 'hard', 1, 16),

('q_eng_2024_017', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2024_1', 'Identify the noun clause: "I know what you did last summer."', 'multiple_choice', '["A. I know", "B. what you did", "C. what you did last summer", "D. last summer"]', 'C', 'The noun clause "what you did last summer" functions as the object of "know".', 'hard', 1, 17),

('q_eng_2024_018', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2024_1', 'Choose the word closest in meaning to "candid":', 'multiple_choice', '["A. secretive", "B. frank", "C. hostile", "D. timid"]', 'B', 'Candid means truthful and straightforward; frank.', 'medium', 1, 18),

('q_eng_2024_019', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2024_1', 'The plural of "crisis" is:', 'multiple_choice', '["A. crisises", "B. crises", "C. crisis", "D. crisies"]', 'B', 'Greek-origin words ending in -is change to -es in plural form.', 'medium', 1, 19),

('q_eng_2024_020', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2024_1', 'Which sentence contains an infinitive phrase?', 'multiple_choice', '["A. Running is fun", "B. She wants to dance", "C. He danced beautifully", "D. Dancing makes her happy"]', 'B', '"To dance" is an infinitive phrase (to + base verb).', 'easy', 1, 20),

('q_eng_2024_021', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2024_1', 'The expression "a blessing in disguise" means:', 'multiple_choice', '["A. something bad that seems good", "B. something good that seems bad at first", "C. a hidden treasure", "D. a religious gift"]', 'B', 'A blessing in disguise is something that initially appears negative but turns out to be beneficial.', 'medium', 1, 21),

('q_eng_2024_022', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2024_1', 'Choose the correct sentence:', 'multiple_choice', '["A. Each of the boys have their books", "B. Each of the boys has his book", "C. Each of the boys have his book", "D. Each of the boys has their books"]', 'B', '"Each" is singular and requires "has" and "his" for agreement.', 'hard', 1, 22),

('q_eng_2024_023', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2024_1', 'A "paradox" is:', 'multiple_choice', '["A. a type of poem", "B. a contradictory statement that may be true", "C. a comparison using like", "D. an exaggeration"]', 'B', 'A paradox is a seemingly contradictory statement that reveals a truth upon reflection.', 'hard', 1, 23),

('q_eng_2024_024', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2024_1', 'The word "ameliorate" means:', 'multiple_choice', '["A. to worsen", "B. to improve", "C. to destroy", "D. to ignore"]', 'B', 'Ameliorate means to make something bad better; improve.', 'hard', 1, 24),

('q_eng_2024_025', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2024_1', 'Choose the correct option: The committee _____ divided on the issue.', 'multiple_choice', '["A. is", "B. are", "C. was", "D. All of the above"]', 'D', 'Collective nouns can take singular or plural verbs depending on whether the group acts as one or as individuals.', 'medium', 1, 25),

('q_eng_2024_026', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2024_1', 'Identify the type of sentence: "Although he was tired, he continued working."', 'multiple_choice', '["A. Simple", "B. Compound", "C. Complex", "D. Compound-complex"]', 'C', 'A complex sentence has one independent clause and at least one dependent clause.', 'medium', 1, 26),

('q_eng_2024_027', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2024_1', 'The word "ephemeral" means:', 'multiple_choice', '["A. lasting forever", "B. short-lived", "C. very large", "D. extremely cold"]', 'B', 'Ephemeral means lasting for a very short time.', 'hard', 1, 27),

('q_eng_2024_028', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2024_1', 'Which is a compound word?', 'multiple_choice', '["A. Running", "B. Happiness", "C. Sunflower", "D. Beautiful"]', 'C', 'Sunflower is formed by combining two words: sun + flower.', 'easy', 1, 28),

('q_eng_2024_029', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2024_1', 'Choose the correct relative pronoun: The book _____ I read was interesting.', 'multiple_choice', '["A. who", "B. whom", "C. which", "D. whose"]', 'C', '"Which" is used for things; "who/whom" for people.', 'easy', 1, 29),

('q_eng_2024_030', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2024_1', 'The phrase "to let the cat out of the bag" means:', 'multiple_choice', '["A. to release an animal", "B. to reveal a secret", "C. to open a bag", "D. to catch something"]', 'B', 'This idiom means to accidentally reveal a secret or surprise.', 'easy', 1, 30),

('q_eng_2024_031', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2024_1', 'Identify the adjective clause: "The man who lives next door is a doctor."', 'multiple_choice', '["A. The man", "B. who lives next door", "C. is a doctor", "D. next door"]', 'B', 'The adjective clause "who lives next door" modifies the noun "man".', 'medium', 1, 31),

('q_eng_2024_032', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2024_1', 'The word "taciturn" means:', 'multiple_choice', '["A. talkative", "B. reserved in speech", "C. aggressive", "D. cheerful"]', 'B', 'Taciturn means reserved or uncommunicative in speech; saying little.', 'hard', 1, 32),

('q_eng_2024_033', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2024_1', 'Choose the correctly punctuated sentence:', 'multiple_choice', '["A. Where are you going.", "B. Where are you going?", "C. Where are you going!", "D. Where are you, going"]', 'B', 'Questions require a question mark at the end.', 'easy', 1, 33),

('q_eng_2024_034', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2024_1', 'The figure of speech in "Life is a journey" is:', 'multiple_choice', '["A. Simile", "B. Metaphor", "C. Personification", "D. Hyperbole"]', 'B', 'A metaphor directly compares two unlike things without using "like" or "as".', 'medium', 1, 34),

('q_eng_2024_035', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2024_1', 'Which word is a conjunction?', 'multiple_choice', '["A. Quickly", "B. However", "C. Beautiful", "D. Running"]', 'B', '"However" is a conjunctive adverb used to connect ideas.', 'easy', 1, 35),

-- Oral Forms (Questions 36-50)
('q_eng_2024_036', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2024_1', 'The words "write" and "right" are examples of:', 'multiple_choice', '["A. Synonyms", "B. Antonyms", "C. Homophones", "D. Homographs"]', 'C', 'Homophones sound the same but have different meanings and spellings.', 'easy', 1, 36),

('q_eng_2024_037', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2024_1', 'Which word has the primary stress on the second syllable?', 'multiple_choice', '["A. Beautiful", "B. Computer", "C. Elephant", "D. Saturday"]', 'B', 'Computer is pronounced com-PU-ter with stress on the second syllable.', 'medium', 1, 37),

('q_eng_2024_038', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2024_1', 'The phonetic symbol /θ/ represents the sound in:', 'multiple_choice', '["A. Then", "B. Think", "C. Shoe", "D. Church"]', 'B', '/θ/ is the voiceless dental fricative found in "think", not the voiced /ð/ in "then".', 'hard', 1, 38),

('q_eng_2024_039', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2024_1', 'Which pair of words rhymes?', 'multiple_choice', '["A. love - move", "B. cough - rough", "C. height - weight", "D. bread - head"]', 'D', '"Bread" and "head" both end with the /ed/ sound.', 'medium', 1, 39),

('q_eng_2024_040', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2024_1', 'In the word "photograph", the stressed syllable is:', 'multiple_choice', '["A. pho", "B. to", "C. graph", "D. None of the above"]', 'A', 'PHO-to-graph has stress on the first syllable.', 'medium', 1, 40),

('q_eng_2024_041', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2024_1', 'The sound /ʃ/ is found in the word:', 'multiple_choice', '["A. Measure", "B. Machine", "C. Cheap", "D. Think"]', 'B', '/ʃ/ is the voiceless palato-alveolar fricative sound in "machine" (ma-SHEEN).', 'hard', 1, 41),

('q_eng_2024_042', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2024_1', 'Which word contains a diphthong?', 'multiple_choice', '["A. Bit", "B. Beat", "C. Boy", "D. Book"]', 'C', '"Boy" contains the diphthong /ɔɪ/.', 'hard', 1, 42),

('q_eng_2024_043', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2024_1', 'The words "record" (noun) and "record" (verb) differ in:', 'multiple_choice', '["A. Spelling", "B. Meaning only", "C. Stress pattern", "D. Number of syllables"]', 'C', 'RE-cord (noun) vs re-CORD (verb) - they differ in stress placement.', 'medium', 1, 43),

('q_eng_2024_044', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2024_1', 'How many syllables are in the word "communication"?', 'multiple_choice', '["A. Three", "B. Four", "C. Five", "D. Six"]', 'C', 'Com-mu-ni-ca-tion has five syllables.', 'easy', 1, 44),

('q_eng_2024_045', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2024_1', 'The consonant sound that begins "judge" is:', 'multiple_choice', '["A. /dʒ/", "B. /ʒ/", "C. /tʃ/", "D. /j/"]', 'A', '/dʒ/ is the voiced palato-alveolar affricate sound at the start of "judge".', 'hard', 1, 45),

('q_eng_2024_046', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2024_1', 'Which word has silent letters?', 'multiple_choice', '["A. Cat", "B. Knight", "C. Dog", "D. Run"]', 'B', '"Knight" has silent "k" and silent "gh".', 'easy', 1, 46),

('q_eng_2024_047', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2024_1', 'The main stress in "education" falls on:', 'multiple_choice', '["A. First syllable", "B. Second syllable", "C. Third syllable", "D. Fourth syllable"]', 'C', 'Ed-u-CA-tion has stress on the third syllable.', 'medium', 1, 47),

('q_eng_2024_048', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2024_1', 'Which pair contains the same vowel sound?', 'multiple_choice', '["A. put - but", "B. food - good", "C. sheep - ship", "D. calm - palm"]', 'D', '"Calm" and "palm" both contain the long /ɑː/ sound.', 'medium', 1, 48),

('q_eng_2024_049', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2024_1', 'In connected speech, the phrase "last year" may sound like:', 'multiple_choice', '["A. las-tyear", "B. last year", "C. las year", "D. last-year"]', 'A', 'Assimilation causes the /t/ to blend with /j/ creating a /tʃ/ sound.', 'hard', 1, 49),

('q_eng_2024_050', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2024_1', 'The word with primary stress on the first syllable is:', 'multiple_choice', '["A. Belief", "B. Begin", "C. Brother", "D. Before"]', 'C', 'BRO-ther has stress on the first syllable; the others stress the second.', 'easy', 1, 50),

-- WASSCE English Language 2023 Paper 1
('q_eng_2023_001', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2023_1', 'Choose the word that best completes the sentence: She _____ to school every day.', 'multiple_choice', '["A. walk", "B. walks", "C. walking", "D. walked"]', 'B', 'Third person singular in present simple takes "walks".', 'easy', 1, 1),

('q_eng_2023_002', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2023_1', 'The opposite of "abundant" is:', 'multiple_choice', '["A. plentiful", "B. scarce", "C. excessive", "D. numerous"]', 'B', 'Abundant means plentiful; scarce means lacking or insufficient.', 'medium', 1, 2),

('q_eng_2023_003', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2023_1', 'Identify the figure of speech: "He runs as fast as lightning."', 'multiple_choice', '["A. Metaphor", "B. Simile", "C. Personification", "D. Oxymoron"]', 'B', 'A simile uses "as" or "like" to make a comparison.', 'easy', 1, 3),

('q_eng_2023_004', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2023_1', 'Choose the correctly spelled word:', 'multiple_choice', '["A. Occassion", "B. Occasion", "C. Ocassion", "D. Occation"]', 'B', 'Occasion has one "c" and one "s".', 'easy', 1, 4),

('q_eng_2023_005', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2023_1', 'The word "altruistic" means:', 'multiple_choice', '["A. selfish", "B. selfless and concerned for others", "C. angry", "D. ambitious"]', 'B', 'Altruistic means showing unselfish concern for the welfare of others.', 'hard', 1, 5),

('q_eng_2023_006', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2023_1', 'Choose the correct form: By this time tomorrow, she _____ arrived.', 'multiple_choice', '["A. will have", "B. would have", "C. has", "D. had"]', 'A', 'Future perfect tense uses "will have" + past participle.', 'medium', 1, 6),

('q_eng_2023_007', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2023_1', 'The phrase "to hit the nail on the head" means:', 'multiple_choice', '["A. to cause damage", "B. to say something exactly right", "C. to build something", "D. to make a mistake"]', 'B', 'This idiom means to describe exactly what is causing a situation or problem.', 'medium', 1, 7),

('q_eng_2023_008', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2023_1', 'Which sentence is in passive voice?', 'multiple_choice', '["A. The dog bit the man", "B. The man was bitten by the dog", "C. The man bit the dog", "D. The dog is biting"]', 'B', 'Passive voice: subject receives the action (was bitten).', 'easy', 1, 8),

('q_eng_2023_009', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2023_1', 'The plural of "phenomenon" is:', 'multiple_choice', '["A. phenomenons", "B. phenomena", "C. phenomenas", "D. phenomeni"]', 'B', 'Greek-origin words ending in -on change to -a in plural.', 'medium', 1, 9),

('q_eng_2023_010', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2023_1', 'Choose the word closest in meaning to "diligent":', 'multiple_choice', '["A. lazy", "B. hardworking", "C. careless", "D. slow"]', 'B', 'Diligent means showing care and effort in one''s work.', 'easy', 1, 10),

('q_eng_2023_011', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2023_1', 'Identify the adverbial clause: "When the rain stopped, we went outside."', 'multiple_choice', '["A. When the rain stopped", "B. we went", "C. went outside", "D. the rain stopped"]', 'A', 'The adverbial clause "When the rain stopped" modifies when the action occurred.', 'medium', 1, 11),

('q_eng_2023_012', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2023_1', 'The word "ambiguous" means:', 'multiple_choice', '["A. clear", "B. uncertain or unclear", "C. ambitious", "D. angry"]', 'B', 'Ambiguous means open to more than one interpretation; unclear.', 'medium', 1, 12),

('q_eng_2023_013', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2023_1', 'Choose the correct preposition: He is good _____ mathematics.', 'multiple_choice', '["A. in", "B. at", "C. on", "D. with"]', 'B', 'We say "good at" something, not "good in".', 'easy', 1, 13),

('q_eng_2023_014', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2023_1', 'The literary term for a play on words is:', 'multiple_choice', '["A. Pun", "B. Irony", "C. Satire", "D. Allegory"]', 'A', 'A pun is a joke exploiting different meanings of a word.', 'medium', 1, 14),

('q_eng_2023_015', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2023_1', 'Which word is an abstract noun?', 'multiple_choice', '["A. Table", "B. Happiness", "C. Teacher", "D. Banana"]', 'B', 'Abstract nouns name things that cannot be perceived through the five senses.', 'easy', 1, 15),

('q_eng_2023_016', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2023_1', 'Choose the correct option: Neither John nor his friends _____ coming.', 'multiple_choice', '["A. is", "B. are", "C. was", "D. were"]', 'B', 'With "neither...nor", the verb agrees with the nearer subject (friends - plural).', 'medium', 1, 16),

('q_eng_2023_017', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2023_1', 'The word "meticulous" means:', 'multiple_choice', '["A. careless", "B. very careful and precise", "C. fast", "D. angry"]', 'B', 'Meticulous means showing great attention to detail; thorough.', 'hard', 1, 17),

('q_eng_2023_018', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2023_1', 'The expression "to be in hot water" means:', 'multiple_choice', '["A. to take a bath", "B. to be in trouble", "C. to be comfortable", "D. to feel warm"]', 'B', 'This idiom means to be in a difficult situation or in trouble.', 'easy', 1, 18),

('q_eng_2023_019', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2023_1', 'Identify the type of sentence: "Run!"', 'multiple_choice', '["A. Declarative", "B. Interrogative", "C. Imperative", "D. Exclamatory"]', 'C', 'Imperative sentences give commands or make requests.', 'easy', 1, 19),

('q_eng_2023_020', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2023_1', 'The word "obsolete" means:', 'multiple_choice', '["A. modern", "B. no longer used", "C. popular", "D. expensive"]', 'B', 'Obsolete means no longer produced or used; out of date.', 'medium', 1, 20),

('q_eng_2023_021', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2023_1', 'Which sentence contains a gerund?', 'multiple_choice', '["A. She is running fast", "B. Running is good exercise", "C. She runs daily", "D. She ran yesterday"]', 'B', 'A gerund is a verb form ending in -ing used as a noun. "Running" is the subject here.', 'medium', 1, 21),

('q_eng_2023_022', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2023_1', 'The opposite of "transparent" is:', 'multiple_choice', '["A. clear", "B. opaque", "C. visible", "D. obvious"]', 'B', 'Transparent allows light through; opaque does not.', 'medium', 1, 22),

('q_eng_2023_023', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2023_1', 'Choose the correct sentence:', 'multiple_choice', '["A. Me and him went to school", "B. Him and I went to school", "C. He and I went to school", "D. I and he went to school"]', 'C', 'Subject pronouns (He, I) should be used as subjects of sentences.', 'medium', 1, 23),

('q_eng_2023_024', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2023_1', 'The phrase "crocodile tears" refers to:', 'multiple_choice', '["A. genuine sadness", "B. insincere display of emotion", "C. a reptile crying", "D. tears of joy"]', 'B', 'Crocodile tears mean a false or insincere display of emotion.', 'medium', 1, 24),

('q_eng_2023_025', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2023_1', 'The word "prolific" means:', 'multiple_choice', '["A. producing little", "B. producing much", "C. lazy", "D. quiet"]', 'B', 'Prolific means producing much fruit, foliage, or many offspring; highly productive.', 'hard', 1, 25),

('q_eng_2023_026', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2023_1', 'Identify the compound sentence:', 'multiple_choice', '["A. I went to school", "B. I went to school and studied hard", "C. When I went to school, I studied", "D. I went to school because I wanted to learn"]', 'B', 'A compound sentence has two independent clauses joined by a coordinating conjunction.', 'medium', 1, 26),

('q_eng_2023_027', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2023_1', 'Choose the correct option: The furniture _____ expensive.', 'multiple_choice', '["A. are", "B. is", "C. were", "D. have been"]', 'B', '"Furniture" is an uncountable noun and takes a singular verb.', 'medium', 1, 27),

('q_eng_2023_028', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2023_1', 'The word "verbose" means:', 'multiple_choice', '["A. brief", "B. using too many words", "C. silent", "D. unclear"]', 'B', 'Verbose means using more words than necessary; wordy.', 'hard', 1, 28),

('q_eng_2023_029', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2023_1', 'Choose the correct relative pronoun: The lady _____ bag was stolen reported to the police.', 'multiple_choice', '["A. who", "B. whom", "C. whose", "D. which"]', 'C', '"Whose" shows possession (the lady''s bag).', 'medium', 1, 29),

('q_eng_2023_030', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2023_1', 'The figure of speech in "O Death, where is thy sting?" is:', 'multiple_choice', '["A. Simile", "B. Metaphor", "C. Apostrophe", "D. Hyperbole"]', 'C', 'Apostrophe addresses an absent person, abstract idea, or inanimate object.', 'hard', 1, 30),

('q_eng_2023_031', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2023_1', 'Which pair are synonyms?', 'multiple_choice', '["A. hot - cold", "B. happy - sad", "C. big - large", "D. up - down"]', 'C', 'Synonyms have similar meanings. Big and large mean the same.', 'easy', 1, 31),

('q_eng_2023_032', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2023_1', 'The word "inevitable" means:', 'multiple_choice', '["A. avoidable", "B. certain to happen", "C. unlikely", "D. impossible"]', 'B', 'Inevitable means certain to happen; unavoidable.', 'medium', 1, 32),

('q_eng_2023_033', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2023_1', 'Choose the correct form: She has _____ her homework.', 'multiple_choice', '["A. do", "B. did", "C. done", "D. doing"]', 'C', 'Present perfect uses "has" + past participle (done).', 'easy', 1, 33),

('q_eng_2023_034', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2023_1', 'A "protagonist" is:', 'multiple_choice', '["A. the villain", "B. the main character", "C. the narrator", "D. a minor character"]', 'B', 'The protagonist is the leading character or hero of a story.', 'medium', 1, 34),

('q_eng_2023_035', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2023_1', 'The phrase "once in a blue moon" means:', 'multiple_choice', '["A. frequently", "B. very rarely", "C. at night", "D. monthly"]', 'B', 'This idiom means something that happens very rarely.', 'easy', 1, 35),

('q_eng_2023_036', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2023_1', 'Which word has the primary stress on the first syllable?', 'multiple_choice', '["A. Believe", "B. Receive", "C. Table", "D. Decide"]', 'C', 'TA-ble has stress on the first syllable; others stress the second.', 'easy', 1, 36),

('q_eng_2023_037', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2023_1', 'The phonetic symbol /ŋ/ represents the sound in:', 'multiple_choice', '["A. Not", "B. Sing", "C. Net", "D. Nine"]', 'B', '/ŋ/ is the velar nasal sound found at the end of "sing".', 'hard', 1, 37),

('q_eng_2023_038', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2023_1', 'How many syllables are in "university"?', 'multiple_choice', '["A. Three", "B. Four", "C. Five", "D. Six"]', 'C', 'U-ni-ver-si-ty has five syllables.', 'easy', 1, 38),

('q_eng_2023_039', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2023_1', 'Which word contains a long vowel sound?', 'multiple_choice', '["A. Bit", "B. Beat", "C. Bet", "D. But"]', 'B', '"Beat" contains the long /iː/ sound.', 'medium', 1, 39),

('q_eng_2023_040', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2023_1', 'The main stress in "photographer" falls on:', 'multiple_choice', '["A. First syllable", "B. Second syllable", "C. Third syllable", "D. Fourth syllable"]', 'B', 'Pho-TO-gra-pher has stress on the second syllable.', 'medium', 1, 40),

('q_eng_2023_041', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2023_1', 'Which word begins with a vowel sound?', 'multiple_choice', '["A. House", "B. Hour", "C. Help", "D. Happy"]', 'B', '"Hour" begins with a vowel sound /aʊ/ because the "h" is silent.', 'medium', 1, 41),

('q_eng_2023_042', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2023_1', 'The words "sea" and "see" are:', 'multiple_choice', '["A. Homographs", "B. Homophones", "C. Synonyms", "D. Antonyms"]', 'B', 'They sound the same but have different meanings and spellings.', 'easy', 1, 42),

('q_eng_2023_043', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2023_1', 'Which pair rhymes?', 'multiple_choice', '["A. gone - done", "B. come - home", "C. great - threat", "D. bear - fear"]', 'A', '"Gone" and "done" rhyme with the /ʌn/ sound.', 'medium', 1, 43),

('q_eng_2023_044', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2023_1', 'The consonant cluster in "string" is:', 'multiple_choice', '["A. st", "B. str", "C. tr", "D. ng"]', 'B', 'A consonant cluster is a group of consonants with no vowel between them: str.', 'medium', 1, 44),

('q_eng_2023_045', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2023_1', 'In the word "important", which syllable carries the primary stress?', 'multiple_choice', '["A. im", "B. por", "C. tant", "D. None"]', 'B', 'Im-POR-tant has stress on the second syllable.', 'medium', 1, 45),

('q_eng_2023_046', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2023_1', 'Which word contains the sound /tʃ/?', 'multiple_choice', '["A. Shoe", "B. Chair", "C. Ship", "D. Genre"]', 'B', '/tʃ/ is the voiceless palato-alveolar affricate in "chair".', 'hard', 1, 46),

('q_eng_2023_047', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2023_1', 'The schwa sound /ə/ is found in which syllable of "banana"?', 'multiple_choice', '["A. First only", "B. Second only", "C. Third only", "D. First and third"]', 'D', 'Ba-NA-na: the unstressed first and third syllables contain schwa.', 'hard', 1, 47),

('q_eng_2023_048', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2023_1', 'Which word has a silent "b"?', 'multiple_choice', '["A. Ribbon", "B. Climbing", "C. Rubber", "D. Baby"]', 'B', 'The "b" in "climbing" is silent (it follows "m" at the end).', 'easy', 1, 48),

('q_eng_2023_049', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2023_1', 'The words "export" (noun) and "export" (verb) differ in:', 'multiple_choice', '["A. Spelling", "B. Number of syllables", "C. Stress pattern", "D. Meaning only"]', 'C', 'EX-port (noun) vs ex-PORT (verb) differ in stress placement.', 'medium', 1, 49),

('q_eng_2023_050', 'subj_wassce_english', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eng_2023_1', 'Which word ends with the /z/ sound?', 'multiple_choice', '["A. Books", "B. Cats", "C. Dogs", "D. Maps"]', 'C', 'The plural "s" in "dogs" is pronounced /z/ after voiced consonants.', 'medium', 1, 50);
