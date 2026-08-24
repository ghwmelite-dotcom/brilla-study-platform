-- Enforce the free-tier daily question ceiling inside the same D1 transaction
-- that records the answer and progress. This closes concurrent over-consumption
-- and guarantees a failed downstream write rolls the allowance back.

DROP TRIGGER IF EXISTS trg_daily_usage_question_limit_insert;
CREATE TRIGGER trg_daily_usage_question_limit_insert
BEFORE INSERT ON daily_usage
WHEN NEW.question_count < 0 OR NEW.question_count > 10
BEGIN
  SELECT RAISE(ABORT, 'DAILY_QUESTION_LIMIT_EXCEEDED');
END;

DROP TRIGGER IF EXISTS trg_daily_usage_question_limit_update;
CREATE TRIGGER trg_daily_usage_question_limit_update
BEFORE UPDATE OF question_count ON daily_usage
WHEN NEW.question_count < 0 OR NEW.question_count > 10
BEGIN
  SELECT RAISE(ABORT, 'DAILY_QUESTION_LIMIT_EXCEEDED');
END;
