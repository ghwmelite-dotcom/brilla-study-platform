-- 537: Recompute card_count from actual rows and guard batch flashcards-beta-002.
-- card_count is maintained app-side on card add/delete (no trigger), so the seed-written
-- static values are reconciled here against the actual card rows.
PRAGMA foreign_keys = ON;
UPDATE flashcard_decks SET card_count = (SELECT COUNT(*) FROM flashcards f WHERE f.deck_id = flashcard_decks.id), updated_at = datetime('now') WHERE id IN ('deck_sys_topic_geometry', 'deck_sys_topic_quadratic', 'deck_sys_topic_statistics', 'deck_sys_topic_kinematics', 'deck_sys_topic_waves', 'deck_sys_topic_modern_physics', 'deck_sys_topic_bonding', 'deck_sys_topic_organic', 'deck_sys_topic_ecology', 'deck_sys_topic_physiology');
CREATE TABLE IF NOT EXISTS _migration_537_guard (valid INTEGER NOT NULL CHECK (valid = 1));
DELETE FROM _migration_537_guard;
INSERT INTO _migration_537_guard(valid) SELECT CASE WHEN (SELECT COUNT(*) FROM flashcards WHERE id LIKE 'fc_b002_%') = 100 AND (SELECT COUNT(*) FROM flashcard_decks d WHERE d.id IN ('deck_sys_topic_geometry', 'deck_sys_topic_quadratic', 'deck_sys_topic_statistics', 'deck_sys_topic_kinematics', 'deck_sys_topic_waves', 'deck_sys_topic_modern_physics', 'deck_sys_topic_bonding', 'deck_sys_topic_organic', 'deck_sys_topic_ecology', 'deck_sys_topic_physiology') AND d.card_count = 10 AND (SELECT COUNT(*) FROM flashcards f WHERE f.deck_id = d.id) = 10) = 10 THEN 1 ELSE 0 END;
DROP TABLE _migration_537_guard;
