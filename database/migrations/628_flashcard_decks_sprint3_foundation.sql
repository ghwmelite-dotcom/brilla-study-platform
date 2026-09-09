-- 628: Foundation for sprint 3 flashcard batch flashcard-decks-sprint3-001.
-- Original BrillaPrep revision content; not official WAEC or NaCCA material.
-- Re-asserts the 5 empty public deck_sys_topic_* shells with their prod-canonical
-- ids, names and subject/topic bindings; INSERT OR IGNORE no-ops where the rows
-- already exist (prod, and fresh baselines seeded from database/seed.sql).
PRAGMA foreign_keys = ON;
INSERT OR IGNORE INTO flashcard_decks (id, user_id, name, description, subject_id, topic_id, is_public, card_count) VALUES ('deck_sys_topic_biochemistry', NULL, 'Biochemistry - Key Concepts', 'Important formulas and concepts for Biochemistry', 'subj_wassce_biology', 'topic_biochemistry', 1, 0);
INSERT OR IGNORE INTO flashcard_decks (id, user_id, name, description, subject_id, topic_id, is_public, card_count) VALUES ('deck_sys_topic_calculus', NULL, 'Calculus - Key Concepts', 'Important formulas and concepts for Calculus', 'subj_wassce_core_math', 'topic_calculus', 1, 0);
INSERT OR IGNORE INTO flashcard_decks (id, user_id, name, description, subject_id, topic_id, is_public, card_count) VALUES ('deck_sys_topic_electrochemistry', NULL, 'Electrochemistry - Key Concepts', 'Important formulas and concepts for Electrochemistry', 'subj_wassce_chemistry', 'topic_electrochemistry', 1, 0);
INSERT OR IGNORE INTO flashcard_decks (id, user_id, name, description, subject_id, topic_id, is_public, card_count) VALUES ('deck_sys_topic_equilibrium', NULL, 'Chemical Equilibrium - Key Concepts', 'Important formulas and concepts for Chemical Equilibrium', 'subj_wassce_chemistry', 'topic_equilibrium', 1, 0);
INSERT OR IGNORE INTO flashcard_decks (id, user_id, name, description, subject_id, topic_id, is_public, card_count) VALUES ('deck_sys_topic_thermodynamics', NULL, 'Thermodynamics - Key Concepts', 'Important formulas and concepts for Thermodynamics', 'subj_wassce_physics', 'topic_thermodynamics', 1, 0);
