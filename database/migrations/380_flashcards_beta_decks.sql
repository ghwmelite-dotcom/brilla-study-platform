-- 380: Four new public WASSCE flashcard decks (flashcards-beta-001).
-- Original BrillaPrep revision content; not official WAEC or NaCCA material.
-- The 8 deck_sys_topic_* shells already exist in seed.sql; this inserts only new decks.
PRAGMA foreign_keys = ON;
INSERT OR IGNORE INTO flashcard_decks (id, user_id, name, description, subject_id, topic_id, is_public, card_count) VALUES ('deck_literature_devices', NULL, 'Literary Devices', 'Figures of speech and literary techniques for WASSCE Literature in English', 'subj_wassce_literature', NULL, 1, 0);
INSERT OR IGNORE INTO flashcard_decks (id, user_id, name, description, subject_id, topic_id, is_public, card_count) VALUES ('deck_int_science_human_biology', NULL, 'Human Biology Essentials', 'Body systems and life processes for WASSCE Integrated Science', 'subj_wassce_int_science', NULL, 1, 0);
INSERT OR IGNORE INTO flashcard_decks (id, user_id, name, description, subject_id, topic_id, is_public, card_count) VALUES ('deck_core_math_trigonometry', NULL, 'Trigonometry Essentials', 'Ratios, rules and angle problems for WASSCE Core Mathematics', 'subj_wassce_core_math', NULL, 1, 0);
INSERT OR IGNORE INTO flashcard_decks (id, user_id, name, description, subject_id, topic_id, is_public, card_count) VALUES ('deck_social_governance', NULL, 'Governance & Civics', 'Government, rights and citizenship for WASSCE Social Studies', 'subj_wassce_social', NULL, 1, 0);
