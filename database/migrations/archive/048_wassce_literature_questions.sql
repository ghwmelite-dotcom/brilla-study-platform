-- Migration 048: WASSCE Literature in English Questions
-- 100 questions for 2024 and 2023 Paper 1 (Objectives)

-- First, add the past paper entries for Literature
INSERT OR IGNORE INTO past_papers (id, exam_type_id, subject_id, paper_type_id, year, month, total_questions, total_marks, time_allowed, is_complete)
VALUES ('pp_wassce_lit_2024_1', 'exam_wassce', 'subj_wassce_literature', 'paper_wassce_1', 2024, 'May-June', 50, 50, 60, 1);

INSERT OR IGNORE INTO past_papers (id, exam_type_id, subject_id, paper_type_id, year, month, total_questions, total_marks, time_allowed, is_complete)
VALUES ('pp_wassce_lit_2023_1', 'exam_wassce', 'subj_wassce_literature', 'paper_wassce_1', 2023, 'May-June', 50, 50, 60, 1);

-- Literature Questions for 2024 Paper 1
INSERT OR REPLACE INTO questions (id, subject_id, exam_type_id, paper_type_id, past_paper_id, question_text, question_type, options, correct_answer, explanation, difficulty, marks, question_number) VALUES

-- Literary Terms and Devices (Q1-15)
('q_lit_2024_001', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2024_1', 'A figure of speech that compares two unlike things using "like" or "as" is called:', 'multiple_choice', '["A. Metaphor", "B. Simile", "C. Personification", "D. Hyperbole"]', 'B', 'A simile is a comparison using "like" or "as". Example: "He runs like the wind."', 'easy', 1, 1),

('q_lit_2024_002', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2024_1', 'The main character in a literary work is called the:', 'multiple_choice', '["A. Antagonist", "B. Protagonist", "C. Narrator", "D. Foil"]', 'B', 'The protagonist is the main character around whom the story revolves.', 'easy', 1, 2),

('q_lit_2024_003', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2024_1', 'When an author gives hints about what will happen later in the story, it is called:', 'multiple_choice', '["A. Flashback", "B. Foreshadowing", "C. Irony", "D. Suspense"]', 'B', 'Foreshadowing provides clues about future events in a narrative.', 'medium', 1, 3),

('q_lit_2024_004', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2024_1', 'A fourteen-line poem with a specific rhyme scheme is called a:', 'multiple_choice', '["A. Ballad", "B. Ode", "C. Sonnet", "D. Elegy"]', 'C', 'A sonnet is a 14-line poem, typically in iambic pentameter with a specific rhyme scheme.', 'easy', 1, 4),

('q_lit_2024_005', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2024_1', 'The use of words that imitate sounds is called:', 'multiple_choice', '["A. Alliteration", "B. Assonance", "C. Onomatopoeia", "D. Consonance"]', 'C', 'Onomatopoeia uses words that imitate sounds, like "buzz," "hiss," or "bang."', 'easy', 1, 5),

('q_lit_2024_006', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2024_1', 'The repetition of initial consonant sounds is:', 'multiple_choice', '["A. Rhyme", "B. Alliteration", "C. Assonance", "D. Meter"]', 'B', 'Alliteration is the repetition of consonant sounds at the beginning of words, e.g., "Peter Piper picked."', 'easy', 1, 6),

('q_lit_2024_007', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2024_1', 'A statement that appears contradictory but contains a truth is:', 'multiple_choice', '["A. Paradox", "B. Oxymoron", "C. Irony", "D. Pun"]', 'A', 'A paradox seems contradictory but reveals truth, e.g., "Less is more."', 'medium', 1, 7),

('q_lit_2024_008', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2024_1', 'The time and place in which a story occurs is called:', 'multiple_choice', '["A. Plot", "B. Theme", "C. Setting", "D. Mood"]', 'C', 'Setting refers to the time, place, and social environment where the story takes place.', 'easy', 1, 8),

('q_lit_2024_009', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2024_1', 'A long narrative poem celebrating heroic deeds is called:', 'multiple_choice', '["A. Lyric", "B. Epic", "C. Ballad", "D. Elegy"]', 'B', 'An epic is a long narrative poem about heroic deeds, like Homer''s Iliad and Odyssey.', 'easy', 1, 9),

('q_lit_2024_010', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2024_1', 'The central message or insight of a literary work is its:', 'multiple_choice', '["A. Plot", "B. Setting", "C. Theme", "D. Conflict"]', 'C', 'Theme is the central idea or message that the author conveys through the work.', 'easy', 1, 10),

('q_lit_2024_011', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2024_1', 'Giving human qualities to non-human things is:', 'multiple_choice', '["A. Simile", "B. Metaphor", "C. Personification", "D. Allegory"]', 'C', 'Personification attributes human characteristics to animals, objects, or ideas.', 'easy', 1, 11),

('q_lit_2024_012', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2024_1', 'A play that ends in disaster for the main character is a:', 'multiple_choice', '["A. Comedy", "B. Tragedy", "C. Farce", "D. Melodrama"]', 'B', 'A tragedy is a serious drama that ends with the downfall or death of the protagonist.', 'easy', 1, 12),

('q_lit_2024_013', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2024_1', 'The emotional atmosphere created in a literary work is called:', 'multiple_choice', '["A. Tone", "B. Mood", "C. Style", "D. Voice"]', 'B', 'Mood is the emotional atmosphere that pervades a literary work and affects the reader.', 'medium', 1, 13),

('q_lit_2024_014', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2024_1', 'A brief reference to a person, place, or event from history or literature is:', 'multiple_choice', '["A. Allegory", "B. Allusion", "C. Analogy", "D. Anecdote"]', 'B', 'An allusion is an indirect reference to something outside the text that the reader is expected to know.', 'medium', 1, 14),

('q_lit_2024_015', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2024_1', 'The author''s attitude toward the subject is called:', 'multiple_choice', '["A. Mood", "B. Tone", "C. Style", "D. Theme"]', 'B', 'Tone reflects the author''s attitude toward the subject matter or audience.', 'medium', 1, 15),

-- Drama and Play Elements (Q16-25)
('q_lit_2024_016', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2024_1', 'A speech in a play where a character speaks alone on stage is:', 'multiple_choice', '["A. Dialogue", "B. Monologue", "C. Aside", "D. Epilogue"]', 'B', 'A monologue is a long speech by one character, often revealing inner thoughts.', 'easy', 1, 16),

('q_lit_2024_017', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2024_1', 'A remark made by a character that only the audience hears is:', 'multiple_choice', '["A. Monologue", "B. Soliloquy", "C. Aside", "D. Prologue"]', 'C', 'An aside is a brief remark to the audience that other characters on stage cannot hear.', 'medium', 1, 17),

('q_lit_2024_018', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2024_1', 'The highest point of tension in a play is the:', 'multiple_choice', '["A. Exposition", "B. Rising action", "C. Climax", "D. Resolution"]', 'C', 'The climax is the turning point and moment of greatest tension in a narrative.', 'easy', 1, 18),

('q_lit_2024_019', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2024_1', 'The introduction of a play that gives background information is:', 'multiple_choice', '["A. Prologue", "B. Exposition", "C. Epilogue", "D. Denouement"]', 'B', 'Exposition provides background information about characters, setting, and prior events.', 'medium', 1, 19),

('q_lit_2024_020', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2024_1', 'A character who contrasts with another to highlight qualities is a:', 'multiple_choice', '["A. Protagonist", "B. Antagonist", "C. Foil", "D. Hero"]', 'C', 'A foil is a character whose qualities contrast with another character to highlight their traits.', 'medium', 1, 20),

('q_lit_2024_021', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2024_1', 'Stage directions in a play indicate:', 'multiple_choice', '["A. Only dialogue", "B. Actions, movements, and settings", "C. Character thoughts", "D. Audience reactions"]', 'B', 'Stage directions describe actors'' movements, gestures, scenery, and props.', 'easy', 1, 21),

('q_lit_2024_022', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2024_1', 'The final resolution of a play''s conflict is called:', 'multiple_choice', '["A. Climax", "B. Rising action", "C. Denouement", "D. Exposition"]', 'C', 'Denouement is the final outcome where conflicts are resolved and loose ends tied up.', 'medium', 1, 22),

('q_lit_2024_023', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2024_1', 'A drama that mocks human follies through humor is:', 'multiple_choice', '["A. Tragedy", "B. Satire", "C. Romance", "D. Melodrama"]', 'B', 'Satire uses humor, irony, and exaggeration to criticize human vices and follies.', 'medium', 1, 23),

('q_lit_2024_024', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2024_1', 'The main division of a play is called:', 'multiple_choice', '["A. Scene", "B. Act", "C. Episode", "D. Chapter"]', 'B', 'An act is the major division of a play; acts are further divided into scenes.', 'easy', 1, 24),

('q_lit_2024_025', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2024_1', 'A tragic flaw in a character is called:', 'multiple_choice', '["A. Catharsis", "B. Hamartia", "C. Hubris", "D. Nemesis"]', 'B', 'Hamartia is the tragic flaw or error that leads to the protagonist''s downfall.', 'hard', 1, 25),

-- Prose Fiction Elements (Q26-35)
('q_lit_2024_026', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2024_1', 'A story told from "I" perspective uses:', 'multiple_choice', '["A. Third person point of view", "B. First person point of view", "C. Omniscient point of view", "D. Objective point of view"]', 'B', 'First person point of view uses "I" and tells the story from the narrator''s perspective.', 'easy', 1, 26),

('q_lit_2024_027', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2024_1', 'A narrator who knows everything about all characters uses:', 'multiple_choice', '["A. Limited omniscient", "B. First person", "C. Omniscient point of view", "D. Objective"]', 'C', 'Omniscient point of view gives the narrator complete knowledge of all characters'' thoughts and actions.', 'medium', 1, 27),

('q_lit_2024_028', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2024_1', 'The struggle between opposing forces in a story is:', 'multiple_choice', '["A. Theme", "B. Plot", "C. Conflict", "D. Resolution"]', 'C', 'Conflict is the struggle between opposing forces that drives the plot.', 'easy', 1, 28),

('q_lit_2024_029', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2024_1', 'A character who does not change throughout the story is:', 'multiple_choice', '["A. Dynamic character", "B. Static character", "C. Round character", "D. Stock character"]', 'B', 'A static character remains unchanged in personality or outlook throughout the story.', 'medium', 1, 29),

('q_lit_2024_030', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2024_1', 'A short fictional prose work is called:', 'multiple_choice', '["A. Novel", "B. Novella", "C. Short story", "D. Essay"]', 'C', 'A short story is a brief work of fiction that focuses on a single incident or character.', 'easy', 1, 30),

('q_lit_2024_031', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2024_1', 'A return to earlier events in a narrative is:', 'multiple_choice', '["A. Foreshadowing", "B. Flashback", "C. Flash forward", "D. Retrospection"]', 'B', 'A flashback interrupts the chronological sequence to show past events.', 'easy', 1, 31),

('q_lit_2024_032', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2024_1', 'The sequence of events in a story is called:', 'multiple_choice', '["A. Theme", "B. Plot", "C. Setting", "D. Style"]', 'B', 'Plot is the sequence of events that make up a story.', 'easy', 1, 32),

('q_lit_2024_033', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2024_1', 'External conflict involves a struggle between:', 'multiple_choice', '["A. A character and their conscience", "B. A character and outside forces", "C. Ideas within a character", "D. Themes within the plot"]', 'B', 'External conflict involves a character struggling against outside forces like nature, society, or others.', 'medium', 1, 33),

('q_lit_2024_034', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2024_1', 'A novel that focuses on a character''s moral and psychological growth is:', 'multiple_choice', '["A. Gothic novel", "B. Picaresque novel", "C. Bildungsroman", "D. Epistolary novel"]', 'C', 'A Bildungsroman is a coming-of-age story focusing on the protagonist''s development.', 'hard', 1, 34),

('q_lit_2024_035', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2024_1', 'Direct characterization involves:', 'multiple_choice', '["A. Showing character through actions", "B. Author explicitly stating traits", "C. Revealing character through dialogue", "D. Implying traits through thoughts"]', 'B', 'Direct characterization is when the author explicitly tells the reader about a character''s traits.', 'medium', 1, 35),

-- Poetry Elements (Q36-45)
('q_lit_2024_036', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2024_1', 'A poem mourning the death of someone is:', 'multiple_choice', '["A. Ode", "B. Elegy", "C. Sonnet", "D. Ballad"]', 'B', 'An elegy is a poem of lamentation, typically mourning the death of a person.', 'easy', 1, 36),

('q_lit_2024_037', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2024_1', 'A group of lines in a poem is called:', 'multiple_choice', '["A. Verse", "B. Stanza", "C. Couplet", "D. Quatrain"]', 'B', 'A stanza is a group of lines in a poem, similar to a paragraph in prose.', 'easy', 1, 37),

('q_lit_2024_038', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2024_1', 'Two consecutive rhyming lines are called:', 'multiple_choice', '["A. Quatrain", "B. Tercet", "C. Couplet", "D. Octave"]', 'C', 'A couplet consists of two consecutive lines that rhyme.', 'easy', 1, 38),

('q_lit_2024_039', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2024_1', 'The rhythmic pattern of a poem is its:', 'multiple_choice', '["A. Rhyme scheme", "B. Meter", "C. Stanza", "D. Verse"]', 'B', 'Meter is the rhythmic pattern created by stressed and unstressed syllables.', 'medium', 1, 39),

('q_lit_2024_040', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2024_1', 'A poem with no regular rhyme or meter is:', 'multiple_choice', '["A. Blank verse", "B. Free verse", "C. Heroic couplet", "D. Sonnet"]', 'B', 'Free verse has no regular meter or rhyme scheme.', 'medium', 1, 40),

('q_lit_2024_041', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2024_1', 'An ode is typically:', 'multiple_choice', '["A. A sad poem about death", "B. A poem praising someone or something", "C. A narrative poem", "D. A comic poem"]', 'B', 'An ode is a lyric poem that addresses and celebrates a person, place, thing, or idea.', 'medium', 1, 41),

('q_lit_2024_042', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2024_1', 'The speaker in a poem is called the:', 'multiple_choice', '["A. Author", "B. Narrator", "C. Persona", "D. Protagonist"]', 'C', 'The persona is the speaker or voice in a poem, not necessarily the poet.', 'medium', 1, 42),

('q_lit_2024_043', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2024_1', 'Repetition of vowel sounds in poetry is:', 'multiple_choice', '["A. Alliteration", "B. Assonance", "C. Consonance", "D. Rhyme"]', 'B', 'Assonance is the repetition of vowel sounds within words, e.g., "hear the bells."', 'medium', 1, 43),

('q_lit_2024_044', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2024_1', 'A stanza of four lines is called:', 'multiple_choice', '["A. Couplet", "B. Tercet", "C. Quatrain", "D. Sestet"]', 'C', 'A quatrain is a stanza of four lines.', 'easy', 1, 44),

('q_lit_2024_045', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2024_1', 'Iambic pentameter has how many stressed syllables per line?', 'multiple_choice', '["A. Three", "B. Four", "C. Five", "D. Six"]', 'C', 'Iambic pentameter has five iambic feet (pairs), thus five stressed syllables per line.', 'medium', 1, 45),

-- African Literature (Q46-50)
('q_lit_2024_046', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2024_1', 'Chinua Achebe''s "Things Fall Apart" is set in:', 'multiple_choice', '["A. South Africa", "B. Nigeria", "C. Kenya", "D. Ghana"]', 'B', 'Things Fall Apart is set in Igbo villages in Nigeria before and during colonial rule.', 'easy', 1, 46),

('q_lit_2024_047', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2024_1', 'The main character in "Things Fall Apart" is:', 'multiple_choice', '["A. Obierika", "B. Unoka", "C. Okonkwo", "D. Nwoye"]', 'C', 'Okonkwo is the tragic protagonist of Things Fall Apart.', 'easy', 1, 47),

('q_lit_2024_048', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2024_1', 'Wole Soyinka won the Nobel Prize for Literature in:', 'multiple_choice', '["A. 1984", "B. 1986", "C. 1988", "D. 1990"]', 'B', 'Wole Soyinka became the first African to win the Nobel Prize for Literature in 1986.', 'medium', 1, 48),

('q_lit_2024_049', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2024_1', 'The Negritude movement originated in:', 'multiple_choice', '["A. Nigeria", "B. France", "C. South Africa", "D. Kenya"]', 'B', 'Negritude was a literary movement started by French-speaking African and Caribbean writers in France.', 'medium', 1, 49),

('q_lit_2024_050', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2024_1', 'Ngugi wa Thiong''o is from:', 'multiple_choice', '["A. Nigeria", "B. South Africa", "C. Kenya", "D. Ghana"]', 'C', 'Ngugi wa Thiong''o is a renowned Kenyan writer known for works like "Weep Not, Child."', 'easy', 1, 50),

-- Literature 2023 Questions - Literary Terms (Q1-15)
('q_lit_2023_001', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2023_1', 'A direct comparison without "like" or "as" is:', 'multiple_choice', '["A. Simile", "B. Metaphor", "C. Personification", "D. Analogy"]', 'B', 'A metaphor is a direct comparison stating one thing is another, e.g., "Life is a journey."', 'easy', 1, 1),

('q_lit_2023_002', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2023_1', 'Exaggeration for emphasis or effect is:', 'multiple_choice', '["A. Litotes", "B. Hyperbole", "C. Euphemism", "D. Irony"]', 'B', 'Hyperbole is deliberate exaggeration for emphasis, e.g., "I''ve told you a million times."', 'easy', 1, 2),

('q_lit_2023_003', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2023_1', 'A mild expression substituted for a harsh one is:', 'multiple_choice', '["A. Hyperbole", "B. Litotes", "C. Euphemism", "D. Oxymoron"]', 'C', 'A euphemism replaces an offensive term with a milder one, e.g., "passed away" for "died."', 'medium', 1, 3),

('q_lit_2023_004', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2023_1', 'A combination of contradictory terms is:', 'multiple_choice', '["A. Paradox", "B. Oxymoron", "C. Irony", "D. Pun"]', 'B', 'An oxymoron combines contradictory terms, e.g., "deafening silence."', 'medium', 1, 4),

('q_lit_2023_005', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2023_1', 'A play on words with similar sounds but different meanings is:', 'multiple_choice', '["A. Irony", "B. Sarcasm", "C. Pun", "D. Satire"]', 'C', 'A pun plays on words that sound alike but have different meanings.', 'easy', 1, 5),

('q_lit_2023_006', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2023_1', 'When the opposite of what is expected happens, it is:', 'multiple_choice', '["A. Dramatic irony", "B. Situational irony", "C. Verbal irony", "D. Cosmic irony"]', 'B', 'Situational irony occurs when the outcome differs from expectations.', 'medium', 1, 6),

('q_lit_2023_007', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2023_1', 'When the audience knows something characters don''t, it is:', 'multiple_choice', '["A. Verbal irony", "B. Situational irony", "C. Dramatic irony", "D. Cosmic irony"]', 'C', 'Dramatic irony occurs when the audience knows more than the characters.', 'medium', 1, 7),

('q_lit_2023_008', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2023_1', 'A story in which characters represent abstract ideas is:', 'multiple_choice', '["A. Fable", "B. Allegory", "C. Parable", "D. Myth"]', 'B', 'An allegory is a narrative where characters and events symbolize abstract concepts.', 'medium', 1, 8),

('q_lit_2023_009', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2023_1', 'A short story with animals as characters teaching a moral is:', 'multiple_choice', '["A. Allegory", "B. Parable", "C. Fable", "D. Legend"]', 'C', 'A fable uses animals as characters to teach moral lessons.', 'easy', 1, 9),

('q_lit_2023_010', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2023_1', 'The use of symbols to represent ideas is:', 'multiple_choice', '["A. Allegory", "B. Symbolism", "C. Imagery", "D. Metaphor"]', 'B', 'Symbolism is the use of symbols to represent ideas or qualities.', 'easy', 1, 10),

('q_lit_2023_011', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2023_1', 'Language that appeals to the senses is:', 'multiple_choice', '["A. Symbolism", "B. Imagery", "C. Diction", "D. Syntax"]', 'B', 'Imagery is descriptive language that appeals to sight, sound, taste, touch, or smell.', 'easy', 1, 11),

('q_lit_2023_012', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2023_1', 'The word choice of an author is called:', 'multiple_choice', '["A. Syntax", "B. Style", "C. Diction", "D. Tone"]', 'C', 'Diction refers to the author''s choice of words.', 'easy', 1, 12),

('q_lit_2023_013', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2023_1', 'The arrangement of words in sentences is:', 'multiple_choice', '["A. Diction", "B. Syntax", "C. Style", "D. Grammar"]', 'B', 'Syntax refers to the arrangement of words and phrases to create sentences.', 'medium', 1, 13),

('q_lit_2023_014', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2023_1', 'Understatement for ironic effect is:', 'multiple_choice', '["A. Hyperbole", "B. Euphemism", "C. Litotes", "D. Meiosis"]', 'C', 'Litotes is an understatement, often using a negative to express a positive, e.g., "not bad."', 'hard', 1, 14),

('q_lit_2023_015', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2023_1', 'Addressing someone absent or something non-human is:', 'multiple_choice', '["A. Personification", "B. Apostrophe", "C. Invocation", "D. Soliloquy"]', 'B', 'Apostrophe is addressing an absent person or abstract concept as if present.', 'medium', 1, 15),

-- Prose and Drama (Q16-30)
('q_lit_2023_016', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2023_1', 'A character with complex personality traits is:', 'multiple_choice', '["A. Flat character", "B. Round character", "C. Static character", "D. Stock character"]', 'B', 'A round character has a complex personality with multiple traits.', 'medium', 1, 16),

('q_lit_2023_017', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2023_1', 'A one-dimensional character with few traits is:', 'multiple_choice', '["A. Round character", "B. Flat character", "C. Dynamic character", "D. Protagonist"]', 'B', 'A flat character has limited traits and is not fully developed.', 'easy', 1, 17),

('q_lit_2023_018', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2023_1', 'A character who changes throughout the story is:', 'multiple_choice', '["A. Static", "B. Flat", "C. Dynamic", "D. Stock"]', 'C', 'A dynamic character undergoes significant internal change.', 'easy', 1, 18),

('q_lit_2023_019', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2023_1', 'The character who opposes the main character is:', 'multiple_choice', '["A. Protagonist", "B. Antagonist", "C. Foil", "D. Narrator"]', 'B', 'The antagonist is the character who opposes the protagonist.', 'easy', 1, 19),

('q_lit_2023_020', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2023_1', 'Internal conflict occurs within:', 'multiple_choice', '["A. A character''s mind", "B. Between characters", "C. Between man and nature", "D. Between man and society"]', 'A', 'Internal conflict is a struggle within a character''s mind or conscience.', 'easy', 1, 20),

('q_lit_2023_021', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2023_1', 'A soliloquy reveals a character''s:', 'multiple_choice', '["A. Actions", "B. Inner thoughts", "C. Past history", "D. Future plans"]', 'B', 'A soliloquy is a speech revealing a character''s inner thoughts while alone on stage.', 'medium', 1, 21),

('q_lit_2023_022', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2023_1', 'Comic relief in a tragedy serves to:', 'multiple_choice', '["A. End the play", "B. Introduce new characters", "C. Provide temporary break from tension", "D. Explain the plot"]', 'C', 'Comic relief provides a temporary break from dramatic tension.', 'medium', 1, 22),

('q_lit_2023_023', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2023_1', 'The emotional release experienced by the audience is:', 'multiple_choice', '["A. Hamartia", "B. Hubris", "C. Catharsis", "D. Nemesis"]', 'C', 'Catharsis is the emotional release or purification the audience experiences.', 'medium', 1, 23),

('q_lit_2023_024', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2023_1', 'Excessive pride that leads to downfall is:', 'multiple_choice', '["A. Hamartia", "B. Hubris", "C. Nemesis", "D. Catharsis"]', 'B', 'Hubris is excessive pride or arrogance that leads to the hero''s downfall.', 'medium', 1, 24),

('q_lit_2023_025', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2023_1', 'The introduction at the beginning of a play is:', 'multiple_choice', '["A. Epilogue", "B. Prologue", "C. Exposition", "D. Climax"]', 'B', 'A prologue is an introductory section of a play or literary work.', 'easy', 1, 25),

('q_lit_2023_026', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2023_1', 'A section at the end of a play providing closure is:', 'multiple_choice', '["A. Prologue", "B. Epilogue", "C. Climax", "D. Exposition"]', 'B', 'An epilogue is a section at the end that provides additional information or closure.', 'easy', 1, 26),

('q_lit_2023_027', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2023_1', 'Actions that happen before the main story begins are:', 'multiple_choice', '["A. Rising action", "B. Falling action", "C. Backstory", "D. Resolution"]', 'C', 'Backstory refers to events that occurred before the main narrative.', 'easy', 1, 27),

('q_lit_2023_028', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2023_1', 'Events after the climax that lead to resolution are:', 'multiple_choice', '["A. Rising action", "B. Falling action", "C. Exposition", "D. Conflict"]', 'B', 'Falling action consists of events after the climax that lead to the resolution.', 'medium', 1, 28),

('q_lit_2023_029', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2023_1', 'A novel told through letters is called:', 'multiple_choice', '["A. Picaresque novel", "B. Gothic novel", "C. Epistolary novel", "D. Historical novel"]', 'C', 'An epistolary novel is written as a series of letters or documents.', 'medium', 1, 29),

('q_lit_2023_030', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2023_1', 'Indirect characterization shows character through:', 'multiple_choice', '["A. Author''s direct statements", "B. Character''s actions and speech", "C. Narrator''s comments", "D. Title of the work"]', 'B', 'Indirect characterization reveals character through actions, dialogue, and thoughts.', 'medium', 1, 30),

-- Poetry (Q31-40)
('q_lit_2023_031', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2023_1', 'A narrative poem that tells a story with a refrain is:', 'multiple_choice', '["A. Ode", "B. Ballad", "C. Sonnet", "D. Lyric"]', 'B', 'A ballad is a narrative poem, often with a repeated refrain, traditionally sung.', 'easy', 1, 31),

('q_lit_2023_032', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2023_1', 'A lyric poem expresses:', 'multiple_choice', '["A. A story", "B. Personal emotions", "C. Heroic deeds", "D. A dialogue"]', 'B', 'A lyric poem expresses personal emotions or feelings of the speaker.', 'easy', 1, 32),

('q_lit_2023_033', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2023_1', 'The pattern of rhymes at the end of lines is:', 'multiple_choice', '["A. Meter", "B. Rhythm", "C. Rhyme scheme", "D. Stanza pattern"]', 'C', 'Rhyme scheme is the pattern of end rhymes in a poem, often noted with letters (ABAB).', 'easy', 1, 33),

('q_lit_2023_034', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2023_1', 'Blank verse is unrhymed:', 'multiple_choice', '["A. Free verse", "B. Iambic pentameter", "C. Heroic couplet", "D. Ballad meter"]', 'B', 'Blank verse is unrhymed iambic pentameter.', 'medium', 1, 34),

('q_lit_2023_035', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2023_1', 'A Shakespearean sonnet has how many lines?', 'multiple_choice', '["A. 8", "B. 12", "C. 14", "D. 16"]', 'C', 'A Shakespearean sonnet has 14 lines with a specific rhyme scheme.', 'easy', 1, 35),

('q_lit_2023_036', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2023_1', 'An eight-line stanza is called:', 'multiple_choice', '["A. Sestet", "B. Octave", "C. Quatrain", "D. Couplet"]', 'B', 'An octave is an eight-line stanza, often the first part of a Petrarchan sonnet.', 'medium', 1, 36),

('q_lit_2023_037', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2023_1', 'A six-line stanza is called:', 'multiple_choice', '["A. Octave", "B. Sestet", "C. Quatrain", "D. Tercet"]', 'B', 'A sestet is a six-line stanza or the last six lines of a Petrarchan sonnet.', 'medium', 1, 37),

('q_lit_2023_038', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2023_1', 'The continuation of a sentence beyond one line is:', 'multiple_choice', '["A. End-stop", "B. Caesura", "C. Enjambment", "D. Meter"]', 'C', 'Enjambment is when a sentence continues beyond the line break without punctuation.', 'medium', 1, 38),

('q_lit_2023_039', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2023_1', 'A pause within a line of poetry is:', 'multiple_choice', '["A. End-stop", "B. Caesura", "C. Enjambment", "D. Run-on"]', 'B', 'A caesura is a pause within a line of poetry, usually indicated by punctuation.', 'medium', 1, 39),

('q_lit_2023_040', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2023_1', 'A three-line stanza is called:', 'multiple_choice', '["A. Tercet", "B. Quatrain", "C. Couplet", "D. Sestet"]', 'A', 'A tercet is a three-line stanza or group of three lines.', 'easy', 1, 40),

-- African and World Literature (Q41-50)
('q_lit_2023_041', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2023_1', 'Leopold Sedar Senghor was from:', 'multiple_choice', '["A. Nigeria", "B. Senegal", "C. Kenya", "D. Ghana"]', 'B', 'Leopold Sedar Senghor was a Senegalese poet and president, a founder of the Negritude movement.', 'medium', 1, 41),

('q_lit_2023_042', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2023_1', 'Aime Cesaire was from:', 'multiple_choice', '["A. Senegal", "B. Nigeria", "C. Martinique", "D. Ghana"]', 'C', 'Aime Cesaire was a Martinican poet and politician, a co-founder of Negritude.', 'medium', 1, 42),

('q_lit_2023_043', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2023_1', '"Weep Not, Child" was written by:', 'multiple_choice', '["A. Chinua Achebe", "B. Wole Soyinka", "C. Ngugi wa Thiong''o", "D. Ayi Kwei Armah"]', 'C', 'Weep Not, Child was written by Kenyan author Ngugi wa Thiong''o.', 'easy', 1, 43),

('q_lit_2023_044', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2023_1', '"The Lion and the Jewel" was written by:', 'multiple_choice', '["A. Chinua Achebe", "B. Wole Soyinka", "C. J.P. Clark", "D. Ama Ata Aidoo"]', 'B', 'The Lion and the Jewel is a play by Nigerian author Wole Soyinka.', 'easy', 1, 44),

('q_lit_2023_045', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2023_1', '"The Beautiful Ones Are Not Yet Born" was written by:', 'multiple_choice', '["A. Ngugi wa Thiong''o", "B. Ayi Kwei Armah", "C. Chinua Achebe", "D. Buchi Emecheta"]', 'B', 'The Beautiful Ones Are Not Yet Born was written by Ghanaian author Ayi Kwei Armah.', 'medium', 1, 45),

('q_lit_2023_046', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2023_1', 'William Shakespeare wrote in the:', 'multiple_choice', '["A. Victorian era", "B. Elizabethan era", "C. Romantic era", "D. Modern era"]', 'B', 'Shakespeare wrote during the Elizabethan era (late 16th to early 17th century).', 'easy', 1, 46),

('q_lit_2023_047', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2023_1', '"Hamlet" is a play by:', 'multiple_choice', '["A. Christopher Marlowe", "B. William Shakespeare", "C. Ben Jonson", "D. John Milton"]', 'B', 'Hamlet is one of Shakespeare''s most famous tragedies.', 'easy', 1, 47),

('q_lit_2023_048', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2023_1', '"Arrow of God" was written by:', 'multiple_choice', '["A. Wole Soyinka", "B. Chinua Achebe", "C. Flora Nwapa", "D. Cyprian Ekwensi"]', 'B', 'Arrow of God is a novel by Nigerian author Chinua Achebe.', 'easy', 1, 48),

('q_lit_2023_049', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2023_1', 'The setting of "The River Between" by Ngugi is:', 'multiple_choice', '["A. Nigeria", "B. Kenya", "C. Ghana", "D. South Africa"]', 'B', 'The River Between is set in Kenya among the Kikuyu people.', 'medium', 1, 49),

('q_lit_2023_050', 'subj_wassce_literature', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_lit_2023_1', '"A Man of the People" addresses:', 'multiple_choice', '["A. Colonialism", "B. Political corruption", "C. Traditional culture", "D. Religious conflict"]', 'B', 'A Man of the People by Chinua Achebe satirizes political corruption in post-independence Africa.', 'medium', 1, 50);
