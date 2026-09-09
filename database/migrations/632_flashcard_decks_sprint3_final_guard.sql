-- 632: Recompute card_count from actual rows and guard batch flashcard-decks-sprint3-001.
-- card_count is maintained app-side on card add/delete (no trigger), so the seed-written
-- static values are reconciled here against the actual card rows.
PRAGMA foreign_keys = ON;
UPDATE flashcard_decks SET card_count = (SELECT COUNT(*) FROM flashcards f WHERE f.deck_id = flashcard_decks.id), updated_at = datetime('now') WHERE id IN ('deck_sys_topic_biochemistry', 'deck_sys_topic_calculus', 'deck_sys_topic_electrochemistry', 'deck_sys_topic_equilibrium', 'deck_sys_topic_thermodynamics');
CREATE TABLE IF NOT EXISTS _migration_632_guard (valid INTEGER NOT NULL CHECK (valid = 1));
DELETE FROM _migration_632_guard;
INSERT INTO _migration_632_guard(valid) SELECT CASE WHEN (SELECT COUNT(*) FROM flashcards WHERE id LIKE 'fc_s3_%') = 60 AND (SELECT COUNT(*) FROM flashcard_decks d WHERE d.id IN ('deck_sys_topic_biochemistry', 'deck_sys_topic_calculus', 'deck_sys_topic_electrochemistry', 'deck_sys_topic_equilibrium', 'deck_sys_topic_thermodynamics') AND d.card_count = 12 AND (SELECT COUNT(*) FROM flashcards f WHERE f.deck_id = d.id) = 12) = 5 THEN 1 ELSE 0 END;
DROP TABLE _migration_632_guard;
