-- Pre-migration gate for migration 282.
-- Every SELECT must return zero rows before apply.

WITH expected(name) AS (VALUES ('id'),('challenger_id'),('opponent_id'),('status'),('subject_id'),('difficulty'),('question_count'),('questions'),('challenger_score'),('opponent_score'),('current_question'),('winner_id'),('created_at'),('started_at'),('completed_at')) SELECT 'battles.' || expected.name AS missing_column FROM expected LEFT JOIN pragma_table_info('battles') actual ON actual.name = expected.name WHERE actual.name IS NULL;

WITH expected(name) AS (VALUES ('id'),('battle_id'),('user_id'),('question_index'),('answer'),('is_correct'),('time_taken'),('points_earned'),('answered_at')) SELECT 'battle_answers.' || expected.name AS missing_column FROM expected LEFT JOIN pragma_table_info('battle_answers') actual ON actual.name = expected.name WHERE actual.name IS NULL;

SELECT 'battles.' || name AS unexpected_partial_column FROM pragma_table_info('battles') WHERE name IN ('is_demo_data','expires_at') UNION ALL SELECT 'battle_answers.' || name FROM pragma_table_info('battle_answers') WHERE name IN ('is_demo_data','expires_at');

SELECT * FROM pragma_foreign_key_check;
