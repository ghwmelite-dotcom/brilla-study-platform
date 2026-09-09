-- 386: Recompute card_count from actual rows and guard batch flashcards-beta-001.
-- card_count is maintained app-side on card add/delete (no trigger), so the seed-written
-- static values are reconciled here against the actual card rows.
PRAGMA foreign_keys = ON;
UPDATE flashcard_decks SET card_count = (SELECT COUNT(*) FROM flashcards f WHERE f.deck_id = flashcard_decks.id), updated_at = datetime('now') WHERE id IN ('deck_sys_topic_algebra', 'deck_sys_topic_trigonometry', 'deck_sys_topic_mechanics', 'deck_sys_topic_electricity', 'deck_sys_topic_atomic', 'deck_sys_topic_stoichiometry', 'deck_sys_topic_cells', 'deck_sys_topic_genetics', 'deck_literature_devices', 'deck_int_science_human_biology', 'deck_core_math_trigonometry', 'deck_social_governance');
CREATE TABLE IF NOT EXISTS _migration_386_guard (valid INTEGER NOT NULL CHECK (valid = 1));
DELETE FROM _migration_386_guard;
INSERT INTO _migration_386_guard(valid) SELECT CASE WHEN (SELECT COUNT(*) FROM flashcards WHERE id LIKE 'fc_b001_%') = 120 AND (SELECT COUNT(*) FROM flashcard_decks d WHERE d.id IN ('deck_sys_topic_algebra', 'deck_sys_topic_trigonometry', 'deck_sys_topic_mechanics', 'deck_sys_topic_electricity', 'deck_sys_topic_atomic', 'deck_sys_topic_stoichiometry', 'deck_sys_topic_cells', 'deck_sys_topic_genetics', 'deck_literature_devices', 'deck_int_science_human_biology', 'deck_core_math_trigonometry', 'deck_social_governance') AND d.card_count = 10 AND (SELECT COUNT(*) FROM flashcards f WHERE f.deck_id = d.id) = 10) = 12 THEN 1 ELSE 0 END;
DROP TABLE _migration_386_guard;
