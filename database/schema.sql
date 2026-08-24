-- ============================================================================
-- BRILLA STUDY PLATFORM — CANONICAL DATABASE SCHEMA
-- ============================================================================
-- GENERATED FILE — DO NOT EDIT BY HAND.
-- Regenerate with: node scripts/build-canonical-schema.cjs > database/schema.sql.new
-- (see .superpowers/sdd/2026-08-03-fix-05-database-reckoning/task-2-brief.md)
--
-- Squash of the legacy database/schema.sql plus all migrations below, with
-- last-definition-wins collision resolution, ALTER TABLE ADD COLUMN folding,
-- scratch-table removal, and the task-2 override map (questions /
-- subscription_tiers / past_papers / parent-link tables / 087 triggers).
--
-- Sources (in application order):
--   database/schema.sql (legacy)
--   database/migrations/001_add_user_verification.sql
--   database/migrations/002_add_parent_system.sql
--   database/migrations/003_add_audit_system.sql
--   database/migrations/004_add_assessment_system.sql
--   database/migrations/005_add_quests_system.sql
--   database/migrations/006_add_streak_protection.sql
--   database/migrations/007_add_reminders_system.sql
--   database/migrations/008_add_elibrary_system.sql
--   database/migrations/009_add_ai_counselor.sql
--   database/migrations/010_add_counselor_reports.sql
--   database/migrations/011_add_downloadable_field.sql
--   database/migrations/012_add_notification_system.sql
--   database/migrations/013_add_ai_tutor.sql
--   database/migrations/014_add_chat_system.sql
--   database/migrations/015_add_moderation_system.sql
--   database/migrations/016_add_parent_counselor_messaging.sql
--   database/migrations/016_fix_parent_counselor_messaging.sql
--   database/migrations/017_add_reminder_settings.sql
--   database/migrations/018_add_elective_math_mock_exam.sql
--   database/migrations/019_add_demo_data_isolation.sql
--   database/migrations/020_add_demo_data_isolation_extended.sql
--   database/migrations/021_subscription_affiliate_system.sql
--   database/migrations/022_add_selected_tier_preference.sql
--   database/migrations/023_add_subscription_columns.sql
--   database/migrations/024_add_rate_limiting.sql
--   database/migrations/025_add_whiteboard_recordings.sql
--   database/migrations/026_add_whiteboards.sql
--   database/migrations/027_teacher_bonus_tutoring.sql
--   database/migrations/028_add_paper_columns.sql
--   database/migrations/028_seed_past_papers_fixed.sql
--   database/migrations/028_seed_past_papers_questions.sql
--   database/migrations/029_bece_subjects_and_questions.sql
--   database/migrations/029_wassce_math_questions.sql
--   database/migrations/030_bece_math_questions.sql
--   database/migrations/030_wassce_english_questions.sql
--   database/migrations/031_bece_english_questions.sql
--   database/migrations/031_wassce_science_questions.sql
--   database/migrations/032_bece_science_questions.sql
--   database/migrations/032_wassce_social_questions.sql
--   database/migrations/033_bece_social_questions.sql
--   database/migrations/033_wassce_physics_questions.sql
--   database/migrations/034_link_bece_questions_to_papers.sql
--   database/migrations/034_wassce_chemistry_questions.sql
--   database/migrations/035_wassce_biology_2023.sql
--   database/migrations/035_wassce_biology_questions.sql
--   database/migrations/036_bece_math_questions.sql
--   database/migrations/036_wassce_chemistry_2023.sql
--   database/migrations/037_bece_english_questions.sql
--   database/migrations/037_wassce_physics_2023.sql
--   database/migrations/038_bece_science_questions.sql
--   database/migrations/038_wassce_elective_math_2023.sql
--   database/migrations/039_bece_social_questions.sql
--   database/migrations/039_wassce_elective_math_2024.sql
--   database/migrations/040_nsmq_round_one.sql
--   database/migrations/041_nsmq_speed_race.sql
--   database/migrations/042_more_speed_race_questions.sql
--   database/migrations/042_nsmq_problem_of_day.sql
--   database/migrations/043_link_speed_race_to_topics.sql
--   database/migrations/043_nsmq_true_false.sql
--   database/migrations/044_flashcard_system.sql
--   database/migrations/044_nsmq_riddles.sql
--   database/migrations/045_wassce_economics_questions.sql
--   database/migrations/046_wassce_government_questions.sql
--   database/migrations/047_wassce_geography_questions.sql
--   database/migrations/048_wassce_literature_questions.sql
--   database/migrations/049_wassce_accounting_questions.sql
--   database/migrations/050_bece_rme_questions.sql
--   database/migrations/051_bece_ict_questions.sql
--   database/migrations/052_wassce_crs_questions.sql
--   database/migrations/053_bece_french_questions.sql
--   database/migrations/054_bece_bdt_questions.sql
--   database/migrations/055_add_missing_subjects.sql
--   database/migrations/056_wassce_biology_2023.sql
--   database/migrations/057_wassce_chemistry_2023.sql
--   database/migrations/058_wassce_physics_2023.sql
--   database/migrations/059_wassce_elective_math_2023.sql
--   database/migrations/060_wassce_economics_2023.sql
--   database/migrations/061_add_missing_past_papers.sql
--   database/migrations/062_engagement_features.sql
--   database/migrations/063_complete_wassce_subjects.sql
--   database/migrations/064_add_missing_wassce_topics.sql
--   database/migrations/065_add_comprehensive_questions.sql
--   database/migrations/066_comprehensive_topic_questions.sql
--   database/migrations/067_fix_topic_questions.sql
--   database/migrations/068_final_topic_questions.sql
--   database/migrations/069_seed_demo_exam_preferences.sql
--   database/migrations/070_freemium_daily_limits.sql
--   database/migrations/071_add_oauth_providers.sql
--   database/migrations/072_o_a_level_system.sql
--   database/migrations/073_seed_o_a_level_data.sql
--   database/migrations/073_seed_o_a_level_data_fixed.sql
--   database/migrations/074_add_edexcel_specs.sql
--   database/migrations/075_add_as_level_specs.sql
--   database/migrations/076_add_cambridge_as_specs.sql
--   database/migrations/077_seed_oalevel_questions.sql
--   database/migrations/078_more_biology_questions.sql
--   database/migrations/079_more_chemistry_questions.sql
--   database/migrations/080_more_maths_questions.sql
--   database/migrations/081_alevel_physics_questions.sql
--   database/migrations/082_alevel_chemistry_questions.sql
--   database/migrations/082_alevel_mathematics_questions.sql
--   database/migrations/083_alevel_biology_questions.sql
--   database/migrations/083_igcse_add_math_questions.sql
--   database/migrations/084_alevel_further_math_questions.sql
--   database/migrations/084_alevel_maths_questions.sql
--   database/migrations/085_ai_revision_classroom.sql
--   database/migrations/086_multiplayer_study_rooms.sql
--   database/migrations/087_tutor_ai_classroom_integration.sql
--   database/migrations/088_normalize_datetime_to_iso.sql
--   database/migrations/seed_chat_rooms.sql
--   database/migrations/090_growth_loop.sql
--   database/migrations/091_telegram_community.sql
--
-- PRAGMA foreign_keys = ON;  -- enforced by db:verify and D1; a schema file
-- cannot set PRAGMAs on D1, so this is documented here as a comment.
-- ============================================================================


-- =============================================
-- TABLES (dependency order: parents before children)
-- =============================================

-- Source: schema.sql
CREATE TABLE IF NOT EXISTS achievements (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    requirement_type TEXT NOT NULL CHECK (requirement_type IN ('questions_answered', 'streak_days', 'mastery_level', 'xp_earned', 'competitions_won', 'perfect_rounds', 'speed_record')),
    requirement_value INTEGER NOT NULL,
    xp_reward INTEGER DEFAULT 100,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Source: schema.sql
CREATE TABLE IF NOT EXISTS houses (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    icon TEXT DEFAULT 'shield',
    description TEXT,
    is_default INTEGER DEFAULT 0,
    school_id TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Source: migrations/003_add_audit_system.sql
CREATE TABLE IF NOT EXISTS login_attempts (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    success INTEGER DEFAULT 0,
    failure_reason TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Source: migrations/006_add_streak_protection.sql
CREATE TABLE IF NOT EXISTS streak_milestones (
    id TEXT PRIMARY KEY,
    days INTEGER NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    xp_reward INTEGER NOT NULL DEFAULT 0,
    protection_reward INTEGER DEFAULT 0,
    badge_id TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Source: migrations/009_add_ai_counselor.sql
CREATE TABLE IF NOT EXISTS counselor_resources (
    id TEXT PRIMARY KEY,
    counselor_type TEXT NOT NULL CHECK (counselor_type IN ('academic', 'career', 'wellbeing', 'general')),
    resource_type TEXT NOT NULL CHECK (resource_type IN ('article', 'video', 'exercise', 'tip', 'external_link')),
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,
    url TEXT,
    display_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Source: migrations/018_add_elective_math_mock_exam.sql
CREATE TABLE IF NOT EXISTS subject_categories (
    id TEXT PRIMARY KEY,
    exam_type_id TEXT NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    is_core INTEGER DEFAULT 0,
    display_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Source: migrations/018_add_elective_math_mock_exam.sql
CREATE TABLE IF NOT EXISTS paper_types (
    id TEXT PRIMARY KEY,
    exam_type_id TEXT NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    question_format TEXT NOT NULL CHECK (question_format IN ('objective', 'essay', 'practical', 'mixed')),
    typical_duration INTEGER,
    total_marks INTEGER,
    display_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Source: override: schema.sql:193-204 + 021 user_type + 070 daily_question_limit (task-2 brief)
CREATE TABLE IF NOT EXISTS subscription_tiers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    price_monthly REAL DEFAULT 0,
    price_yearly REAL DEFAULT 0,
    currency TEXT DEFAULT 'GHS',
    ai_grading_quota INTEGER DEFAULT 0,
    features TEXT,
    user_type TEXT DEFAULT 'student', -- from 021_subscription_affiliate_system.sql:20 (API expects it)
    daily_question_limit INTEGER DEFAULT -1, -- from 070_freemium_daily_limits.sql:21 (-1 = unlimited)
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Source: migrations/021_subscription_affiliate_system.sql
CREATE TABLE IF NOT EXISTS affiliate_tiers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  min_referrals INTEGER NOT NULL,
  max_referrals INTEGER,
  commission_rate REAL NOT NULL,
  badge_icon TEXT,
  badge_color TEXT,
  xp_bonus INTEGER DEFAULT 0,
  perks TEXT DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now'))
);

-- Source: migrations/021_subscription_affiliate_system.sql
CREATE TABLE IF NOT EXISTS affiliate_challenges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT NOT NULL CHECK(challenge_type IN ('daily', 'weekly', 'monthly', 'milestone', 'seasonal')),
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  xp_reward INTEGER DEFAULT 0,
  cash_bonus REAL DEFAULT 0,
  badge_icon TEXT,
  badge_color TEXT,
  is_active INTEGER DEFAULT 1,
  start_date TEXT,
  end_date TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Source: migrations/021_subscription_affiliate_system.sql
CREATE TABLE IF NOT EXISTS school_affiliate_standings (
  id TEXT PRIMARY KEY,
  school_name TEXT NOT NULL,
  period TEXT NOT NULL CHECK(period IN ('monthly', 'yearly', 'all_time')),
  period_value TEXT,
  total_affiliates INTEGER DEFAULT 0,
  total_referrals INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  total_earnings REAL DEFAULT 0,
  rank INTEGER,
  prize_won TEXT,
  prize_claimed INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(school_name, period, period_value)
);

-- Source: migrations/021_subscription_affiliate_system.sql
CREATE TABLE IF NOT EXISTS affiliate_campaigns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  campaign_type TEXT CHECK(campaign_type IN ('back_to_school', 'exam_season', 'holiday', 'special')),
  commission_multiplier REAL DEFAULT 1.0,
  bonus_xp_multiplier REAL DEFAULT 1.0,
  bonus_per_referral REAL DEFAULT 0,
  min_referrals_for_bonus INTEGER DEFAULT 0,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  banner_image TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Source: migrations/024_add_rate_limiting.sql
CREATE TABLE IF NOT EXISTS rate_limits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    identifier TEXT NOT NULL,           -- IP address or email
    endpoint TEXT NOT NULL,             -- e.g., 'login', 'register', 'forgot-password'
    request_count INTEGER DEFAULT 1,
    window_start TEXT NOT NULL,         -- ISO timestamp of window start
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Source: migrations/027_teacher_bonus_tutoring.sql
CREATE TABLE IF NOT EXISTS teacher_bonus_config (
  id TEXT PRIMARY KEY,
  year INTEGER NOT NULL,
  min_students INTEGER NOT NULL,
  max_students INTEGER, -- NULL means unlimited
  bonus_percentage REAL NOT NULL, -- Percentage of student payments
  min_active_months INTEGER DEFAULT 3, -- Minimum months student must be active to qualify
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(year, min_students)
);

-- Source: migrations/062_engagement_features.sql
CREATE TABLE IF NOT EXISTS seasonal_events (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    theme TEXT NOT NULL CHECK (theme IN ('wassce_prep', 'house_cup', 'subject_week', 'holiday', 'special')),
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    xp_multiplier REAL DEFAULT 1.0,
    accent_color TEXT DEFAULT '#8B5CF6',
    banner_image TEXT,
    rewards TEXT, -- JSON array of rewards
    quests TEXT, -- JSON array of event quests
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Source: migrations/062_engagement_features.sql
CREATE TABLE IF NOT EXISTS cosmetics (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    cosmetic_type TEXT NOT NULL CHECK (cosmetic_type IN (
        'avatar_frame', 'title', 'profile_theme', 'badge_style', 'name_effect'
    )),
    rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    unlock_method TEXT NOT NULL CHECK (unlock_method IN ('level', 'achievement', 'purchase', 'event', 'streak', 'default')),
    unlock_requirement TEXT, -- JSON with unlock details
    preview_data TEXT, -- JSON with visual data (colors, animations, etc.)
    xp_cost INTEGER DEFAULT 0,
    is_premium INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Source: migrations/070_freemium_daily_limits.sql
CREATE TABLE IF NOT EXISTS daily_usage (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    usage_date TEXT NOT NULL,  -- YYYY-MM-DD format (UTC)
    question_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, usage_date)
);

-- Source: migrations/101_atomic_question_allowance.sql
CREATE TRIGGER IF NOT EXISTS trg_daily_usage_question_limit_insert
BEFORE INSERT ON daily_usage
WHEN NEW.question_count < 0 OR NEW.question_count > 10
BEGIN
  SELECT RAISE(ABORT, 'DAILY_QUESTION_LIMIT_EXCEEDED');
END;

-- Source: migrations/101_atomic_question_allowance.sql
CREATE TRIGGER IF NOT EXISTS trg_daily_usage_question_limit_update
BEFORE UPDATE OF question_count ON daily_usage
WHEN NEW.question_count < 0 OR NEW.question_count > 10
BEGIN
  SELECT RAISE(ABORT, 'DAILY_QUESTION_LIMIT_EXCEEDED');
END;

-- Source: migrations/071_add_oauth_providers.sql
CREATE TABLE IF NOT EXISTS oauth_states (
    id TEXT PRIMARY KEY,
    state TEXT UNIQUE NOT NULL,
    code_verifier TEXT NOT NULL,
    intent TEXT CHECK (intent IN ('login', 'register', 'link')),
    user_id TEXT,
    role TEXT,
    registration_data TEXT,
    ip_address TEXT,
    user_agent TEXT,
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Source: migrations/072_o_a_level_system.sql
CREATE TABLE IF NOT EXISTS exam_boards (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    full_name TEXT,
    region TEXT DEFAULT 'International',
    website_url TEXT,
    logo_url TEXT,
    is_active INTEGER DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Source: migrations/090_growth_loop.sql
CREATE TABLE IF NOT EXISTS schools (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TEXT DEFAULT (datetime('now'))
);

-- Source: schema.sql
CREATE TABLE IF NOT EXISTS house_standings (
    id TEXT PRIMARY KEY,
    house_id TEXT NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
    period TEXT NOT NULL CHECK (period IN ('weekly', 'monthly', 'yearly', 'all_time')),
    period_value TEXT NOT NULL,
    total_points INTEGER DEFAULT 0,
    member_count INTEGER DEFAULT 0,
    rank INTEGER,
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(house_id, period, period_value)
);

-- Source: migrations/018_add_elective_math_mock_exam.sql
CREATE TABLE IF NOT EXISTS exam_types (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    country TEXT DEFAULT 'Ghana',
    is_active INTEGER DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    icon TEXT,
    color TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    -- added by migrations/072_o_a_level_system.sql
    exam_board_id TEXT REFERENCES exam_boards(id),
    -- added by migrations/072_o_a_level_system.sql
    level TEXT CHECK (level IN ('GCSE', 'IGCSE', 'AS', 'A2', 'A-Level', 'O-Level', NULL)),
    -- added by migrations/072_o_a_level_system.sql
    grading_scale TEXT CHECK (grading_scale IN ('A*-G', '9-1', 'A*-E', 'A*-U', NULL))
);

-- Source: migrations/021_subscription_affiliate_system.sql
CREATE TABLE IF NOT EXISTS affiliate_achievements (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  xp_reward INTEGER DEFAULT 0,
  cash_bonus REAL DEFAULT 0,
  tier_unlock TEXT REFERENCES affiliate_tiers(id),
  is_secret INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Source: migrations/072_o_a_level_system.sql
CREATE TABLE IF NOT EXISTS command_words (
    id TEXT PRIMARY KEY,
    word TEXT NOT NULL,
    definition TEXT NOT NULL,
    marks_guidance TEXT,
    example_usage TEXT,
    typical_marks_range TEXT,
    exam_board_id TEXT REFERENCES exam_boards(id) ON DELETE SET NULL,
    subject_area TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(word, exam_board_id)
);

-- Source: migrations/091_telegram_community.sql
CREATE TABLE IF NOT EXISTS school_channels (
    school_id TEXT PRIMARY KEY REFERENCES schools(id) ON DELETE CASCADE,
    channel_id TEXT NOT NULL,
    channel_name TEXT,
    broken INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Source: schema.sql
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin', 'parent')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),

    -- Email verification
    email_verified INTEGER DEFAULT 0,
    verification_token TEXT,
    verification_token_expires_at TEXT,
    password_reset_token TEXT,
    password_reset_expires_at TEXT,

    -- Account status
    is_active INTEGER DEFAULT 1,
    last_login_at TEXT,
    session_version INTEGER NOT NULL DEFAULT 0,
    created_by TEXT REFERENCES users(id),
    approved_by TEXT REFERENCES users(id),
    approved_at TEXT,
    rejection_reason TEXT,

    -- Student fields
    house TEXT,
    year_group INTEGER,
    -- school_level CHECK deliberately kept at (jhs, shs): O/A-level students store NULL
    -- here; O/A-level values live on exam_types.level (src/lib/api.ts:193).

    school_level TEXT CHECK (school_level IN ('jhs', 'shs')),
    school_name TEXT,

    -- Teacher fields
    teacher_license_number TEXT,
    subjects_taught TEXT, -- JSON array
    years_experience TEXT,
    qualifications TEXT,

    -- Progress & gamification
    xp_points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    streak_days INTEGER DEFAULT 0,
    last_activity_date TEXT,
    avatar_url TEXT,

    -- Subscription
    primary_exam_type_id TEXT REFERENCES exam_types(id),
    subscription_tier_id TEXT REFERENCES subscription_tiers(id) DEFAULT 'tier_free',
    subscription_expires_at TEXT,
    ai_grading_credits INTEGER DEFAULT 0,

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    -- added by migrations/006_add_streak_protection.sql
    streak_protections INTEGER DEFAULT 0,
    -- added by migrations/006_add_streak_protection.sql
    streak_protection_used_at TEXT,
    -- added by migrations/006_add_streak_protection.sql
    streak_freeze_active INTEGER DEFAULT 0,
    -- added by migrations/006_add_streak_protection.sql
    streak_last_activity TEXT,
    -- added by migrations/019_add_demo_data_isolation.sql
    is_demo INTEGER DEFAULT 0,
    -- added by migrations/021_subscription_affiliate_system.sql
    trial_started_at TEXT,
    -- added by migrations/021_subscription_affiliate_system.sql
    trial_expires_at TEXT,
    -- added by migrations/021_subscription_affiliate_system.sql
    referred_by TEXT,
    -- added by migrations/021_subscription_affiliate_system.sql
    is_affiliate INTEGER DEFAULT 0,
    -- added by migrations/021_subscription_affiliate_system.sql
    affiliate_xp INTEGER DEFAULT 0,
    -- added by migrations/022_add_selected_tier_preference.sql
    selected_tier_id TEXT REFERENCES subscription_tiers(id),
    -- added by migrations/090_growth_loop.sql
    school_id TEXT REFERENCES schools(id)
);

-- Source: schema.sql
CREATE TABLE IF NOT EXISTS subjects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    exam_type_id TEXT REFERENCES exam_types(id),
    category_id TEXT REFERENCES subject_categories(id),
    waec_code TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Source: migrations/100_question_bank_integrity.sql
CREATE TABLE IF NOT EXISTS question_bank_remediation_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    migration_id TEXT NOT NULL,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('subject', 'question')),
    entity_id TEXT NOT NULL,
    field_name TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    changed_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (migration_id, entity_type, entity_id, field_name)
);
CREATE INDEX IF NOT EXISTS idx_question_bank_remediation_log_release
    ON question_bank_remediation_log(migration_id, entity_type, entity_id);

-- Source: schema.sql
CREATE TABLE IF NOT EXISTS user_exam_preferences (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exam_type_id TEXT NOT NULL REFERENCES exam_types(id) ON DELETE CASCADE,
    is_primary INTEGER DEFAULT 0,
    target_year INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, exam_type_id)
);

-- Source: schema.sql
CREATE TABLE IF NOT EXISTS user_subject_selections (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exam_type_id TEXT NOT NULL REFERENCES exam_types(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    is_selected INTEGER DEFAULT 1,
    priority INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, exam_type_id, subject_id)
);

-- Source: schema.sql
CREATE TABLE IF NOT EXISTS ai_grading_limits (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    period_start TEXT NOT NULL,
    period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),
    usage_count INTEGER DEFAULT 0,
    limit_count INTEGER NOT NULL,
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, period_start, period_type)
);

-- Source: schema.sql
CREATE TABLE IF NOT EXISTS topics (
    id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    parent_id TEXT REFERENCES topics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    theory_content TEXT,
    key_formulas TEXT, -- JSON array of formulas
    display_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(subject_id, slug)
);

-- Source: schema.sql
CREATE TABLE IF NOT EXISTS riddles (
    id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    answer TEXT NOT NULL,
    clue_1 TEXT NOT NULL,
    clue_2 TEXT NOT NULL,
    clue_3 TEXT NOT NULL,
    clue_4 TEXT,
    clue_5 TEXT,
    difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),
    created_at TEXT DEFAULT (datetime('now'))
);

-- Source: schema.sql
CREATE TABLE IF NOT EXISTS user_achievements (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id TEXT NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, achievement_id)
);

-- Source: schema.sql
CREATE TABLE IF NOT EXISTS leaderboard (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'all_time')),
    score INTEGER NOT NULL DEFAULT 0,
    rank INTEGER,
    updated_at TEXT DEFAULT (datetime('now')),
    -- added by migrations/019_add_demo_data_isolation.sql
    is_demo_data INTEGER DEFAULT 0,

    -- added by migrations/019_add_demo_data_isolation.sql
    expires_at TEXT,


    UNIQUE(user_id, period)
);

-- Source: schema.sql
CREATE TABLE IF NOT EXISTS competitions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'completed')),
    current_round INTEGER DEFAULT 1,
    school_data TEXT, -- JSON with school names and scores
    created_by TEXT REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now')),
    started_at TEXT,
    completed_at TEXT
);

-- Source: schema.sql
CREATE TABLE IF NOT EXISTS house_points (
    id TEXT PRIMARY KEY,
    house_id TEXT NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    source TEXT NOT NULL CHECK (source IN ('practice', 'battle', 'competition', 'achievement', 'bonus')),
    source_id TEXT,
    period TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    -- added by migrations/090_growth_loop.sql
    is_demo_data INTEGER DEFAULT 0,
    -- added by migrations/090_growth_loop.sql
    expires_at TEXT
);

-- Source: schema.sql
CREATE TABLE IF NOT EXISTS battles (
    id TEXT PRIMARY KEY,
    challenger_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    opponent_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'completed', 'cancelled')),
    subject_id TEXT REFERENCES subjects(id),
    difficulty TEXT DEFAULT 'medium',
    question_count INTEGER DEFAULT 10,
    questions TEXT,
    challenger_score INTEGER DEFAULT 0,
    opponent_score INTEGER DEFAULT 0,
    current_question INTEGER DEFAULT 0,
    winner_id TEXT REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now')),
    started_at TEXT,
    completed_at TEXT
);

-- Source: schema.sql
CREATE TABLE IF NOT EXISTS chat_teacher_assignments (
    id TEXT PRIMARY KEY,
    teacher_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    assigned_by TEXT NOT NULL REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(teacher_id, subject_id)
);

-- Source: migrations/002_add_parent_system.sql
-- LEGACY parent-link table (schema.sql / 002_add_parent_system.sql:11): kept because
-- workers/api/index.ts still references it. Candidate for a future data-merge
-- migration into student_parent_links (out of scope for the reckoning).
CREATE TABLE IF NOT EXISTS parent_student_links (
    id TEXT PRIMARY KEY,
    -- Nullable: the student generates the invite before any parent exists;
    -- parent_id is filled in when the parent redeems the code.
    parent_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invite_code TEXT UNIQUE,
    invite_code_expires_at TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'revoked', 'expired')),
    relationship_type TEXT DEFAULT 'parent' CHECK (relationship_type IN ('parent', 'guardian')),
    student_opted_out INTEGER DEFAULT 0,
    opted_out_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    verified_at TEXT,
    UNIQUE(parent_id, student_id)
);

-- Source: migrations/002_add_parent_system.sql
CREATE TABLE IF NOT EXISTS parent_notifications (
    id TEXT PRIMARY KEY,
    parent_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN (
        'achievement_unlocked',
        'streak_milestone',
        'topic_mastered',
        'low_performance',
        'weekly_summary',
        'link_request',
        'student_opted_out',
        'link_confirmed'
    )),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data TEXT, -- JSON for additional context
    is_read INTEGER DEFAULT 0,
    email_sent INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    -- added by migrations/020_add_demo_data_isolation_extended.sql
    is_demo_data INTEGER DEFAULT 0,
    -- added by migrations/020_add_demo_data_isolation_extended.sql
    expires_at TEXT
);

-- Source: migrations/002_add_parent_system.sql
CREATE TABLE IF NOT EXISTS parent_notification_preferences (
    id TEXT PRIMARY KEY,
    parent_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_alerts INTEGER DEFAULT 1,
    streak_alerts INTEGER DEFAULT 1,
    low_performance_alerts INTEGER DEFAULT 1,
    weekly_summary INTEGER DEFAULT 1,
    email_notifications INTEGER DEFAULT 1,
    low_performance_threshold INTEGER DEFAULT 40, -- percentage below which to alert
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(parent_id)
);

-- Source: migrations/002_add_parent_system.sql
CREATE TABLE IF NOT EXISTS parent_activity_log (
    id TEXT PRIMARY KEY,
    parent_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN (
        'view_progress',
        'view_activity',
        'view_topics',
        'view_achievements',
        'link_student',
        'unlink_student'
    )),
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    -- added by migrations/020_add_demo_data_isolation_extended.sql
    is_demo_data INTEGER DEFAULT 0,
    -- added by migrations/020_add_demo_data_isolation_extended.sql
    expires_at TEXT
);

-- Source: migrations/003_add_audit_system.sql
CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY,

    -- Who performed the action
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    user_email TEXT,
    user_role TEXT,

    -- What action was performed
    action TEXT NOT NULL,
    action_category TEXT NOT NULL CHECK (action_category IN (
        'auth',           -- Login, logout, password changes
        'user_management', -- Registration, approval, role changes
        'content',        -- Questions, topics, subjects
        'practice',       -- Practice sessions, attempts
        'parent',         -- Parent linking, monitoring
        'admin',          -- Admin actions
        'settings',       -- User/system settings changes
        'api',            -- API access, rate limiting
        'security'        -- Security events, suspicious activity
    )),

    -- What was affected
    target_type TEXT,     -- 'user', 'question', 'topic', 'session', etc.
    target_id TEXT,
    target_details TEXT,  -- Additional context (e.g., user email, question title)

    -- Request context
    ip_address TEXT,
    user_agent TEXT,
    request_path TEXT,
    request_method TEXT,

    -- Outcome
    status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failure', 'warning')),
    error_message TEXT,

    -- Additional data (JSON)
    metadata TEXT,        -- JSON blob for action-specific data

    -- Timestamps
    created_at TEXT DEFAULT (datetime('now'))
);

-- Source: migrations/003_add_audit_system.sql
CREATE TABLE IF NOT EXISTS security_events (
    id TEXT PRIMARY KEY,

    -- Event details
    event_type TEXT NOT NULL CHECK (event_type IN (
        'failed_login',
        'account_locked',
        'password_reset',
        'suspicious_activity',
        'rate_limit_exceeded',
        'unauthorized_access',
        'permission_escalation',
        'data_export',
        'bulk_operation',
        'api_key_usage'
    )),
    severity TEXT DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),

    -- Who/what triggered it
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    user_email TEXT,
    ip_address TEXT,
    user_agent TEXT,

    -- Details
    description TEXT NOT NULL,
    metadata TEXT,        -- JSON for additional context

    -- Resolution
    is_resolved INTEGER DEFAULT 0,
    resolved_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TEXT,
    resolution_notes TEXT,

    -- Timestamps
    created_at TEXT DEFAULT (datetime('now'))
);

-- Source: migrations/003_add_audit_system.sql
CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,  -- Hash of JWT for validation
    ip_address TEXT,
    user_agent TEXT,
    device_info TEXT,
    is_active INTEGER DEFAULT 1,
    last_activity_at TEXT DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Source: migrations/003_add_audit_system.sql
CREATE TABLE IF NOT EXISTS data_change_log (
    id TEXT PRIMARY KEY,

    -- What was changed
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),

    -- Who made the change
    changed_by TEXT REFERENCES users(id) ON DELETE SET NULL,

    -- What changed (for updates)
    old_values TEXT,      -- JSON of previous values
    new_values TEXT,      -- JSON of new values
    changed_fields TEXT,  -- JSON array of field names that changed

    -- Context
    reason TEXT,          -- Optional reason for the change

    -- Timestamp
    created_at TEXT DEFAULT (datetime('now'))
);

-- Source: migrations/004_add_assessment_system.sql
CREATE TABLE IF NOT EXISTS classes (
    id TEXT PRIMARY KEY,
    teacher_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    school_level TEXT CHECK (school_level IN ('jhs', 'shs')),
    year_group INTEGER,
    subject_id TEXT REFERENCES subjects(id) ON DELETE SET NULL,
    academic_year TEXT,
    is_active INTEGER DEFAULT 1,
    color TEXT DEFAULT '#3B82F6',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Source: migrations/004_add_assessment_system.sql
CREATE TABLE IF NOT EXISTS assessments (
    id TEXT PRIMARY KEY,
    teacher_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    instructions TEXT,
    assessment_type TEXT NOT NULL CHECK (assessment_type IN ('quiz', 'homework', 'mock_exam')),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived', 'closed')),

    -- Subject/Topic targeting
    subject_id TEXT REFERENCES subjects(id) ON DELETE SET NULL,
    topic_ids TEXT, -- JSON array of topic IDs
    exam_type_id TEXT REFERENCES exam_types(id) ON DELETE SET NULL,

    -- Timing configuration
    time_limit INTEGER, -- in minutes (null = untimed)
    start_date TEXT, -- when assessment becomes available
    end_date TEXT, -- deadline
    late_submission_allowed INTEGER DEFAULT 0,
    late_penalty_percent INTEGER DEFAULT 0, -- e.g., 10 = 10% deduction per day

    -- Grading configuration
    total_marks INTEGER NOT NULL DEFAULT 0,
    passing_score INTEGER,
    show_correct_answers INTEGER DEFAULT 1, -- show answers after submission
    show_score_immediately INTEGER DEFAULT 1,

    -- Question configuration
    shuffle_questions INTEGER DEFAULT 0,
    shuffle_options INTEGER DEFAULT 0,
    one_question_per_page INTEGER DEFAULT 0,
    allow_review INTEGER DEFAULT 1, -- allow students to review before submit

    -- Attempt limits
    max_attempts INTEGER DEFAULT 1, -- null = unlimited

    -- Metadata
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    published_at TEXT,
    archived_at TEXT
);

-- Source: migrations/004_add_assessment_system.sql
CREATE TABLE IF NOT EXISTS assessment_templates (
    id TEXT PRIMARY KEY,
    teacher_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    assessment_type TEXT NOT NULL CHECK (assessment_type IN ('quiz', 'homework', 'mock_exam')),
    subject_id TEXT REFERENCES subjects(id) ON DELETE SET NULL,
    settings TEXT NOT NULL, -- JSON with default settings
    is_shared INTEGER DEFAULT 0, -- share with other teachers
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Source: migrations/005_add_quests_system.sql
CREATE TABLE IF NOT EXISTS quest_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT DEFAULT 'target',
    quest_type TEXT NOT NULL CHECK (quest_type IN ('daily', 'weekly', 'special')),
    requirement_type TEXT NOT NULL CHECK (requirement_type IN (
        'answer_questions', 'correct_answers', 'complete_topics',
        'earn_xp', 'maintain_streak', 'win_battles', 'perfect_quiz',
        'study_time', 'help_others'
    )),
    requirement_value INTEGER NOT NULL,
    xp_reward INTEGER NOT NULL DEFAULT 50,
    coin_reward INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    subject_id TEXT REFERENCES subjects(id),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Source: migrations/005_add_quests_system.sql
CREATE TABLE IF NOT EXISTS weekly_challenges (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT DEFAULT 'trophy',
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    requirement_type TEXT NOT NULL,
    requirement_value INTEGER NOT NULL,
    xp_reward INTEGER NOT NULL DEFAULT 500,
    bonus_reward TEXT,
    is_active INTEGER DEFAULT 1,
    subject_id TEXT REFERENCES subjects(id),
    created_at TEXT DEFAULT (datetime('now'))
);

-- Source: migrations/006_add_streak_protection.sql
CREATE TABLE IF NOT EXISTS streak_protection_log (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('earned', 'used', 'purchased', 'expired')),
    amount INTEGER NOT NULL DEFAULT 1,
    reason TEXT,
    streak_before INTEGER,
    streak_after INTEGER,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Source: migrations/006_add_streak_protection.sql
CREATE TABLE IF NOT EXISTS user_streak_milestones (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    milestone_id TEXT NOT NULL REFERENCES streak_milestones(id),
    claimed_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, milestone_id)
);

-- Source: migrations/007_add_reminders_system.sql
CREATE TABLE IF NOT EXISTS reminder_log (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reminder_type TEXT NOT NULL CHECK (reminder_type IN ('daily_goal', 'streak_warning', 'quest_expiring', 'inactivity', 'custom')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    sent_at TEXT DEFAULT (datetime('now')),
    clicked INTEGER DEFAULT 0,
    clicked_at TEXT
);

-- Source: migrations/007_add_reminders_system.sql
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    last_used TEXT,
    UNIQUE(user_id, endpoint)
);

-- Source: migrations/007_add_reminders_system.sql
CREATE TABLE IF NOT EXISTS friendships (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
    created_at TEXT DEFAULT (datetime('now')),
    accepted_at TEXT,
    UNIQUE(user_id, friend_id)
);

-- Source: migrations/007_add_reminders_system.sql
CREATE TABLE IF NOT EXISTS friend_challenges (
    id TEXT PRIMARY KEY,
    challenger_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    challenged_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    challenge_type TEXT NOT NULL CHECK (challenge_type IN ('quiz_battle', 'xp_race', 'streak_challenge', 'topic_mastery')),
    subject_id TEXT REFERENCES subjects(id),
    topic_id TEXT,
    target_value INTEGER,
    duration_hours INTEGER DEFAULT 24,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'active', 'completed', 'expired')),
    challenger_progress INTEGER DEFAULT 0,
    challenged_progress INTEGER DEFAULT 0,
    winner_id TEXT REFERENCES users(id),
    xp_wager INTEGER DEFAULT 50,
    created_at TEXT DEFAULT (datetime('now')),
    started_at TEXT,
    ends_at TEXT,
    completed_at TEXT
);

-- Source: migrations/007_add_reminders_system.sql
CREATE TABLE IF NOT EXISTS xp_events (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    multiplier REAL NOT NULL DEFAULT 2.0,
    event_type TEXT NOT NULL CHECK (event_type IN ('global', 'subject', 'topic', 'house', 'personal')),
    subject_id TEXT REFERENCES subjects(id),
    house_id TEXT,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Source: migrations/007_add_reminders_system.sql
CREATE TABLE IF NOT EXISTS study_groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT 'users',
    color TEXT DEFAULT '#3B82F6',
    owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id TEXT REFERENCES subjects(id),
    is_public INTEGER DEFAULT 1,
    max_members INTEGER DEFAULT 20,
    weekly_goal_xp INTEGER DEFAULT 1000,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Source: migrations/008_add_elibrary_system.sql
CREATE TABLE IF NOT EXISTS library_collections (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_public INTEGER DEFAULT 0,
    color TEXT DEFAULT '#3B82F6',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Source: migrations/009_add_ai_counselor.sql
CREATE TABLE IF NOT EXISTS counselor_conversations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    counselor_type TEXT NOT NULL CHECK (counselor_type IN ('academic', 'career', 'wellbeing', 'general')),
    title TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'flagged')),
    message_count INTEGER DEFAULT 0,
    last_message_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    -- added by migrations/020_add_demo_data_isolation_extended.sql
    is_demo_data INTEGER DEFAULT 0,
    -- added by migrations/020_add_demo_data_isolation_extended.sql
    expires_at TEXT
);

-- Source: migrations/009_add_ai_counselor.sql
CREATE TABLE IF NOT EXISTS wellbeing_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    log_date TEXT NOT NULL,
    stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 5),
    study_satisfaction INTEGER CHECK (study_satisfaction >= 1 AND study_satisfaction <= 5),
    energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 5),
    mood TEXT CHECK (mood IN ('great', 'good', 'okay', 'low', 'stressed')),
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    -- added by migrations/020_add_demo_data_isolation_extended.sql
    is_demo_data INTEGER DEFAULT 0,

    -- added by migrations/020_add_demo_data_isolation_extended.sql
    expires_at TEXT,


    UNIQUE(user_id, log_date)
);

-- Source: migrations/010_add_counselor_reports.sql
CREATE TABLE IF NOT EXISTS counselor_reports (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    generated_by TEXT NOT NULL CHECK (generated_by IN ('system', 'counselor', 'parent_request')),
    report_type TEXT NOT NULL CHECK (report_type IN ('weekly', 'monthly', 'semester', 'custom', 'concern')),
    report_period_start TEXT NOT NULL,
    report_period_end TEXT NOT NULL,

    -- Overall Summary
    summary TEXT NOT NULL,
    key_insights TEXT, -- JSON array of key insights

    -- Academic Section
    academic_summary TEXT,
    academic_strengths TEXT, -- JSON array
    academic_challenges TEXT, -- JSON array
    study_patterns TEXT, -- JSON object with study time, peak hours, consistency
    subject_performance TEXT, -- JSON object with per-subject analysis

    -- Wellbeing Section
    wellbeing_summary TEXT,
    mood_trend TEXT CHECK (mood_trend IN ('improving', 'stable', 'declining', 'fluctuating')),
    stress_indicators TEXT, -- JSON array of observed stress patterns
    wellbeing_score INTEGER CHECK (wellbeing_score >= 1 AND wellbeing_score <= 100),

    -- Engagement Section
    engagement_summary TEXT,
    platform_usage_hours REAL,
    counselor_sessions_count INTEGER DEFAULT 0,
    topics_discussed TEXT, -- JSON array

    -- Goals & Progress
    goals_set TEXT, -- JSON array of goals
    goals_achieved TEXT, -- JSON array of achieved goals
    goals_in_progress TEXT, -- JSON array

    -- Recommendations
    recommendations TEXT, -- JSON array of actionable recommendations
    parent_action_items TEXT, -- JSON array of things parents can do
    follow_up_needed INTEGER DEFAULT 0,
    follow_up_reason TEXT,

    -- Flags and Concerns
    concern_level TEXT DEFAULT 'none' CHECK (concern_level IN ('none', 'low', 'medium', 'high', 'urgent')),
    concern_areas TEXT, -- JSON array of concern areas
    professional_referral_suggested INTEGER DEFAULT 0,
    referral_type TEXT, -- e.g., 'academic_support', 'counseling', 'medical'

    -- Metadata
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    is_read_by_parent INTEGER DEFAULT 0,
    read_at TEXT,
    parent_feedback TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Source: migrations/010_add_counselor_reports.sql
-- LIVE parent-link table: used by workers/api/counselor.ts (~lines 1018-1500).
CREATE TABLE IF NOT EXISTS student_parent_links (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    relationship TEXT DEFAULT 'parent' CHECK (relationship IN ('parent', 'guardian', 'other')),
    is_primary INTEGER DEFAULT 0,
    notification_preferences TEXT DEFAULT '{"email": true, "inApp": true, "reports": true}',
    is_verified INTEGER DEFAULT 0,
    verified_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(student_id, parent_id)
);

-- Source: migrations/010_add_counselor_reports.sql
CREATE TABLE IF NOT EXISTS wellbeing_alerts (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('stress', 'mood_decline', 'inactivity', 'concerning_content', 'academic_struggle')),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'urgent')),
    title TEXT,
    description TEXT NOT NULL,
    triggered_by TEXT, -- What triggered the alert (e.g., 'conversation_analysis', 'wellbeing_log', 'pattern_detection')
    source_id TEXT, -- Reference to the source (conversation_id, wellbeing_log_id, etc.)

    -- Notification status
    parent_notified INTEGER DEFAULT 0,
    notified_at TEXT,
    notification_method TEXT, -- 'email', 'in_app', 'both'

    -- Resolution
    is_resolved INTEGER DEFAULT 0,
    resolved_at TEXT,
    resolution_notes TEXT,
    resolved_by TEXT REFERENCES users(id),

    created_at TEXT DEFAULT (datetime('now')),
    -- added by migrations/020_add_demo_data_isolation_extended.sql
    is_demo_data INTEGER DEFAULT 0,
    -- added by migrations/020_add_demo_data_isolation_extended.sql
    expires_at TEXT
);

-- Source: migrations/012_add_notification_system.sql
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('achievement', 'streak', 'xp', 'challenge', 'content', 'system', 'reminder', 'social')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    icon TEXT,
    link TEXT,
    metadata TEXT, -- JSON for additional data
    is_read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    read_at TEXT,
    -- added by migrations/020_add_demo_data_isolation_extended.sql
    is_demo_data INTEGER DEFAULT 0,
    -- added by migrations/020_add_demo_data_isolation_extended.sql
    expires_at TEXT
);

-- Source: migrations/012_add_notification_system.sql
CREATE TABLE IF NOT EXISTS streak_history (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    activity_count INTEGER DEFAULT 1,
    xp_earned INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, date)
);

-- Source: migrations/012_add_notification_system.sql
CREATE TABLE IF NOT EXISTS xp_transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('quiz', 'practice', 'streak', 'achievement', 'challenge', 'daily_bonus', 'library', 'essay', 'other')),
    description TEXT,
    reference_id TEXT, -- ID of related quiz, achievement, etc.
    created_at TEXT DEFAULT (datetime('now'))
);

-- Source: migrations/013_add_ai_tutor.sql
CREATE TABLE IF NOT EXISTS tutor_usage_stats (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    date TEXT NOT NULL, -- YYYY-MM-DD
    messages_sent INTEGER DEFAULT 0,
    explanations_requested INTEGER DEFAULT 0,
    hints_requested INTEGER DEFAULT 0,
    total_tokens_used INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, date),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Source: migrations/014_add_chat_system.sql
CREATE TABLE IF NOT EXISTS chat_rooms (
    id TEXT PRIMARY KEY,
    name TEXT,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('dm', 'public', 'private', 'subject')),
    subject_id TEXT,
    exam_type_id TEXT,
    avatar_url TEXT,
    is_archived INTEGER DEFAULT 0,
    max_members INTEGER DEFAULT 500,
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Source: migrations/014_add_chat_system.sql
CREATE TABLE IF NOT EXISTS chat_user_blocks (
    id TEXT PRIMARY KEY,
    blocker_id TEXT NOT NULL,
    blocked_id TEXT NOT NULL,
    reason TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(blocker_id, blocked_id),
    FOREIGN KEY (blocker_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (blocked_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Source: migrations/015_add_moderation_system.sql
CREATE TABLE IF NOT EXISTS chat_filtered_words (
    id TEXT PRIMARY KEY,
    word TEXT NOT NULL UNIQUE,
    severity TEXT DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high')),
    replacement TEXT,
    is_active INTEGER DEFAULT 1,
    added_by TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (added_by) REFERENCES users(id)
);

-- Source: migrations/015_add_moderation_system.sql
CREATE TABLE IF NOT EXISTS moderation_audit_log (
    id TEXT PRIMARY KEY,
    action_type TEXT NOT NULL,
    target_type TEXT NOT NULL CHECK (target_type IN ('user', 'message', 'room', 'report', 'filter')),
    target_id TEXT NOT NULL,
    moderator_id TEXT NOT NULL,
    details TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (moderator_id) REFERENCES users(id)
);

-- Source: migrations/016_fix_parent_counselor_messaging.sql
CREATE TABLE IF NOT EXISTS report_schedules (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    parent_id TEXT NOT NULL,
    report_type TEXT NOT NULL CHECK (report_type IN ('weekly_summary', 'monthly_progress', 'semester')),
    frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
    next_scheduled_at TEXT NOT NULL,
    last_generated_at TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (parent_id) REFERENCES users(id)
);

-- Source: migrations/017_add_reminder_settings.sql
CREATE TABLE IF NOT EXISTS reminder_settings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    enabled INTEGER DEFAULT 1,
    daily_goal_reminder INTEGER DEFAULT 1,
    streak_reminder INTEGER DEFAULT 1,
    quest_reminder INTEGER DEFAULT 1,
    study_time TEXT DEFAULT '18:00',
    timezone TEXT DEFAULT 'UTC',
    days_of_week TEXT DEFAULT '0,1,2,3,4,5,6',
    push_enabled INTEGER DEFAULT 0,
    email_enabled INTEGER DEFAULT 0,
    last_reminder_sent_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Source: migrations/017_add_reminder_settings.sql
CREATE TABLE IF NOT EXISTS reminder_history (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    reminder_type TEXT NOT NULL CHECK (reminder_type IN ('daily_goal', 'streak', 'quest', 'custom')),
    channel TEXT NOT NULL CHECK (channel IN ('push', 'email', 'in_app')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    sent_at TEXT NOT NULL DEFAULT (datetime('now')),
    opened_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Source: migrations/021_subscription_affiliate_system.sql
CREATE TABLE IF NOT EXISTS user_trials (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  converted_at TEXT,
  discount_code TEXT,
  discount_percent INTEGER,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'expired', 'converted')),
  tasks_completed TEXT DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now'))
);

-- Source: migrations/021_subscription_affiliate_system.sql
CREATE TABLE IF NOT EXISTS payment_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reference TEXT NOT NULL UNIQUE,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'GHS',
  plan_id TEXT,
  plan_type TEXT NOT NULL,
  billing_cycle TEXT CHECK(billing_cycle IN ('monthly', 'yearly')),
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'success', 'failed', 'refunded')),
  paystack_response TEXT,
  paystack_customer_code TEXT,
  paystack_subscription_code TEXT,
  metadata TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  verified_at TEXT,
  refunded_at TEXT,
  settlement_applied_at TEXT,
  settlement_source TEXT,
  reconciliation_checked_at TEXT,
  affiliate_processed_at TEXT
);

-- Source: migrations/021_subscription_affiliate_system.sql
CREATE TABLE IF NOT EXISTS affiliate_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL UNIQUE,
  tier_id TEXT REFERENCES affiliate_tiers(id) DEFAULT 'tier_scout',
  total_referrals INTEGER DEFAULT 0,
  successful_conversions INTEGER DEFAULT 0,
  total_earnings REAL DEFAULT 0,
  pending_earnings REAL DEFAULT 0,
  available_earnings REAL DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  mobile_money_number TEXT,
  mobile_money_provider TEXT CHECK(mobile_money_provider IN ('mtn', 'vodafone', 'airteltigo')),
  joined_at TEXT DEFAULT (datetime('now')),
  last_referral_at TEXT,
  last_payout_at TEXT
);

-- Source: migrations/021_subscription_affiliate_system.sql
CREATE TABLE IF NOT EXISTS user_affiliate_challenges (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id TEXT NOT NULL REFERENCES affiliate_challenges(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'claimed', 'expired')),
  started_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT,
  claimed_at TEXT,
  xp_earned INTEGER DEFAULT 0,
  cash_earned REAL DEFAULT 0,
  UNIQUE(user_id, challenge_id)
);

-- Source: migrations/021_subscription_affiliate_system.sql
CREATE TABLE IF NOT EXISTS user_affiliate_achievements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES affiliate_achievements(id) ON DELETE CASCADE,
  unlocked_at TEXT DEFAULT (datetime('now')),
  notified INTEGER DEFAULT 0,
  UNIQUE(user_id, achievement_id)
);

-- Source: migrations/025_add_whiteboard_recordings.sql
CREATE TABLE IF NOT EXISTS whiteboard_recordings (
  id TEXT PRIMARY KEY,
  teacher_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL DEFAULT 0,  -- Duration in milliseconds

  -- Recording asset URLs (R2 storage)
  thumbnail_url TEXT,
  canvas_events_url TEXT NOT NULL,      -- JSON file with canvas events
  audio_url TEXT,                        -- WebM audio file
  webcam_url TEXT,                       -- WebM video file

  -- Canvas metadata
  canvas_width INTEGER DEFAULT 1200,
  canvas_height INTEGER DEFAULT 800,
  initial_canvas_json TEXT,             -- Starting state of canvas

  -- Organization
  subject_id TEXT,
  topic_id TEXT,

  -- Status
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'archived', 'deleted')),
  is_public INTEGER DEFAULT 0,          -- Whether recording is publicly accessible
  view_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Source: migrations/026_add_whiteboards.sql
CREATE TABLE IF NOT EXISTS whiteboards (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  canvas_json TEXT NOT NULL, -- Fabric.js canvas JSON
  thumbnail TEXT, -- Base64 or R2 URL
  canvas_width INTEGER DEFAULT 1200,
  canvas_height INTEGER DEFAULT 800,
  subject_id TEXT,
  topic_id TEXT,
  is_template INTEGER DEFAULT 0, -- Can be used as a template
  is_public INTEGER DEFAULT 0, -- Publicly viewable
  status TEXT DEFAULT 'active', -- active, archived, deleted
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Source: migrations/027_teacher_bonus_tutoring.sql
CREATE TABLE IF NOT EXISTS teacher_directory_profiles (
  id TEXT PRIMARY KEY,
  teacher_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- Profile display info
  display_name TEXT NOT NULL,
  bio TEXT, -- Detailed description
  profile_photo_url TEXT,
  banner_image_url TEXT,
  tagline TEXT, -- Short intro line (max 100 chars)

  -- Professional info
  teaching_style TEXT, -- e.g., 'Interactive', 'Lecture-based', 'Problem-solving focused'
  education_background TEXT, -- JSON array of degrees/certifications

  -- Subjects taught (JSON array with details)
  -- Format: [{"subjectId": "...", "subjectName": "...", "level": "beginner|intermediate|advanced", "description": "..."}]
  subjects TEXT NOT NULL,

  -- Session offerings
  -- JSON array: ['video', 'chat', 'whiteboard']
  session_types TEXT NOT NULL,
  hourly_rate REAL NOT NULL, -- GHS per hour
  currency TEXT DEFAULT 'GHS',

  -- Availability schedule
  -- JSON format: {"monday": [{"start": "09:00", "end": "17:00"}], ...}
  availability TEXT,
  timezone TEXT DEFAULT 'Africa/Accra',

  -- Directory approval status (separate from user account approval)
  directory_status TEXT DEFAULT 'pending' CHECK(directory_status IN ('pending', 'approved', 'rejected', 'suspended')),
  approved_by TEXT REFERENCES users(id),
  approved_at TEXT,
  rejection_reason TEXT,
  suspended_reason TEXT,
  suspended_at TEXT,

  -- Visibility controls
  is_visible INTEGER DEFAULT 0, -- Only visible after approval
  is_featured INTEGER DEFAULT 0, -- Featured on homepage/top of directory
  feature_order INTEGER DEFAULT 0, -- Order among featured teachers

  -- Cached stats (updated after each session/review)
  total_sessions INTEGER DEFAULT 0,
  completed_sessions INTEGER DEFAULT 0,
  total_hours REAL DEFAULT 0,
  average_rating REAL DEFAULT 0, -- 1-5 stars
  rating_count INTEGER DEFAULT 0,
  response_rate REAL DEFAULT 100, -- Percentage of requests responded to
  response_time_hours REAL, -- Average response time in hours
  repeat_student_rate REAL DEFAULT 0, -- Percentage of students who book again

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Source: migrations/027_teacher_bonus_tutoring.sql
CREATE TABLE IF NOT EXISTS teacher_earnings (
  id TEXT PRIMARY KEY,
  teacher_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- Tutoring earnings
  total_tutoring_earnings REAL DEFAULT 0, -- All-time tutoring earnings
  pending_tutoring REAL DEFAULT 0, -- Awaiting session completion/payout

  -- Bonus earnings
  total_bonus_earnings REAL DEFAULT 0, -- All-time bonus earnings
  pending_bonus REAL DEFAULT 0, -- Approved but not yet paid

  -- Affiliate earnings (synced from affiliate_profiles)
  total_affiliate_earnings REAL DEFAULT 0,

  -- Available for withdrawal
  available_balance REAL DEFAULT 0,

  -- Payout info (same as affiliate system)
  mobile_money_number TEXT,
  mobile_money_provider TEXT CHECK(mobile_money_provider IS NULL OR mobile_money_provider IN ('mtn', 'vodafone', 'airteltigo')),
  bank_account_number TEXT,
  bank_name TEXT,
  bank_account_name TEXT,
  preferred_payout_method TEXT DEFAULT 'mobile_money' CHECK(preferred_payout_method IN ('mobile_money', 'bank_transfer')),

  -- Lifetime stats
  total_paid_out REAL DEFAULT 0,
  last_payout_at TEXT,
  payout_count INTEGER DEFAULT 0,

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Source: migrations/062_engagement_features.sql
CREATE TABLE IF NOT EXISTS daily_challenges (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL UNIQUE,
    subject_id TEXT REFERENCES subjects(id),
    difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    question_ids TEXT NOT NULL, -- JSON array of question IDs
    xp_reward INTEGER DEFAULT 50,
    time_limit INTEGER DEFAULT 120, -- seconds
    created_at TEXT DEFAULT (datetime('now'))
);

-- Source: migrations/062_engagement_features.sql
CREATE TABLE IF NOT EXISTS quick_play_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_type TEXT NOT NULL CHECK (game_type IN ('speed_blitz', 'brain_teaser', 'subject_dash', 'daily_challenge')),
    subject_id TEXT REFERENCES subjects(id),
    questions_answered INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    score INTEGER DEFAULT 0,
    time_taken INTEGER, -- milliseconds
    xp_earned INTEGER DEFAULT 0,
    multiplier_applied REAL DEFAULT 1.0,
    started_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Source: migrations/062_engagement_features.sql
CREATE TABLE IF NOT EXISTS subject_streaks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES subjects(id),
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date TEXT,
    total_days_studied INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, subject_id)
);

-- Source: migrations/062_engagement_features.sql
CREATE TABLE IF NOT EXISTS streak_rescues (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rescue_type TEXT NOT NULL CHECK (rescue_type IN ('main', 'subject')),
    subject_id TEXT REFERENCES subjects(id),
    streak_before INTEGER NOT NULL,
    streak_after INTEGER NOT NULL,
    rescue_date TEXT DEFAULT (datetime('now')),
    created_at TEXT DEFAULT (datetime('now'))
);

-- Source: migrations/062_engagement_features.sql
CREATE TABLE IF NOT EXISTS exam_readiness (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exam_type TEXT NOT NULL CHECK (exam_type IN (
        'wassce', 'bece', 'nsmq', 'igcse', 'cambridge_as', 'cambridge_a2',
        'edexcel_igcse', 'edexcel_as', 'edexcel_a2'
    )),
    subject_id TEXT REFERENCES subjects(id),
    readiness_score REAL DEFAULT 0, -- 0-100
    topics_mastered INTEGER DEFAULT 0,
    topics_total INTEGER DEFAULT 0,
    weak_topics TEXT, -- JSON array of topic IDs
    strong_topics TEXT, -- JSON array of topic IDs
    last_calculated TEXT DEFAULT (datetime('now')),
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, exam_type, subject_id)
);

-- Source: migrations/094_guidance.sql
CREATE TABLE IF NOT EXISTS user_goals (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exam_type TEXT NOT NULL CHECK (exam_type IN (
        'wassce', 'bece', 'nsmq', 'igcse', 'cambridge_as', 'cambridge_a2',
        'edexcel_igcse', 'edexcel_as', 'edexcel_a2'
    )),
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    target_grade TEXT,
    exam_year INTEGER,
    exam_month INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, exam_type, subject_id),
    CHECK (exam_year IS NULL OR exam_year BETWEEN 2020 AND 2100),
    CHECK (exam_month IS NULL OR exam_month BETWEEN 1 AND 12)
);

-- Source: migrations/094_guidance.sql
CREATE TABLE IF NOT EXISTS guidance_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exam_type TEXT NOT NULL CHECK (exam_type IN (
        'wassce', 'bece', 'nsmq', 'igcse', 'cambridge_as', 'cambridge_a2',
        'edexcel_igcse', 'edexcel_as', 'edexcel_a2'
    )),
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'in_progress'
        CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
    algorithm_version TEXT NOT NULL,
    questions TEXT NOT NULL DEFAULT '{}',
    readiness_score REAL,
    completed_early INTEGER NOT NULL DEFAULT 0 CHECK (completed_early IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    completed_at TEXT
);

-- Source: migrations/094_guidance.sql
CREATE TABLE IF NOT EXISTS guidance_session_answers (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES guidance_sessions(id) ON DELETE CASCADE,
    ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
    question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
    user_answer TEXT NOT NULL,
    is_correct INTEGER NOT NULL CHECK (is_correct IN (0, 1)),
    time_taken INTEGER NOT NULL DEFAULT 0 CHECK (time_taken >= 0),
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),
    topic_id TEXT REFERENCES topics(id) ON DELETE SET NULL,
    idempotency_key TEXT NOT NULL,
    question_attempt_id TEXT NOT NULL UNIQUE REFERENCES question_attempts(id) ON DELETE RESTRICT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(session_id, ordinal),
    UNIQUE(session_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_user_goals_user
    ON user_goals(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_guidance_sessions_user
    ON guidance_sessions(user_id, subject_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_guidance_sessions_one_active
    ON guidance_sessions(user_id, exam_type, subject_id)
    WHERE status = 'in_progress';
CREATE INDEX IF NOT EXISTS idx_guidance_answers_session
    ON guidance_session_answers(session_id, ordinal);

-- Source: migrations/098_ai_answer_cache.sql
CREATE TABLE IF NOT EXISTS ai_answer_cache (
    id TEXT PRIMARY KEY,
    topic_id TEXT NOT NULL,
    subject_id TEXT,
    exam_type TEXT,
    question_text TEXT NOT NULL,
    answer_text TEXT NOT NULL,
    model TEXT,
    embedding_id TEXT,
    hit_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    last_hit_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_ai_answer_cache_topic
    ON ai_answer_cache(topic_id);

-- Source: migrations/062_engagement_features.sql
CREATE TABLE IF NOT EXISTS study_plans (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_type TEXT DEFAULT 'weekly' CHECK (plan_type IN ('daily', 'weekly', 'custom')),
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    items TEXT NOT NULL, -- JSON array of study plan items
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Source: migrations/062_engagement_features.sql
CREATE TABLE IF NOT EXISTS activity_feed (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK (activity_type IN (
        'achievement', 'level_up', 'streak', 'battle_win', 'high_score',
        'friend_added', 'quest_complete', 'event_join', 'cosmetic_unlock'
    )),
    title TEXT NOT NULL,
    description TEXT,
    metadata TEXT, -- JSON with additional data
    is_public INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Source: migrations/062_engagement_features.sql
CREATE TABLE IF NOT EXISTS user_event_progress (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id TEXT NOT NULL REFERENCES seasonal_events(id) ON DELETE CASCADE,
    quests_completed TEXT DEFAULT '[]', -- JSON array of completed quest IDs
    xp_earned INTEGER DEFAULT 0,
    rewards_claimed TEXT DEFAULT '[]', -- JSON array of claimed reward IDs
    joined_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, event_id)
);

-- Source: migrations/062_engagement_features.sql
CREATE TABLE IF NOT EXISTS tournaments (
    id TEXT PRIMARY KEY,
    event_id TEXT REFERENCES seasonal_events(id),
    name TEXT NOT NULL,
    description TEXT,
    tournament_type TEXT NOT NULL CHECK (tournament_type IN ('bracket', 'leaderboard', 'team')),
    subject_id TEXT REFERENCES subjects(id),
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    max_participants INTEGER,
    entry_fee INTEGER DEFAULT 0, -- XP cost to enter
    prizes TEXT NOT NULL, -- JSON array of prizes
    rules TEXT, -- JSON rules config
    status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),
    created_at TEXT DEFAULT (datetime('now'))
);

-- Source: migrations/062_engagement_features.sql
CREATE TABLE IF NOT EXISTS user_cosmetics (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cosmetic_id TEXT NOT NULL REFERENCES cosmetics(id) ON DELETE CASCADE,
    is_equipped INTEGER DEFAULT 0,
    equipped_slot TEXT, -- for multiple equip slots
    acquired_at TEXT DEFAULT (datetime('now')),
    acquired_method TEXT, -- how it was obtained
    UNIQUE(user_id, cosmetic_id)
);

-- Source: migrations/062_engagement_features.sql
CREATE TABLE IF NOT EXISTS user_cosmetic_settings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    equipped_frame TEXT REFERENCES cosmetics(id),
    equipped_title TEXT REFERENCES cosmetics(id),
    equipped_theme TEXT REFERENCES cosmetics(id),
    equipped_badge_style TEXT REFERENCES cosmetics(id),
    equipped_name_effect TEXT REFERENCES cosmetics(id),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Source: migrations/062_engagement_features.sql
CREATE TABLE IF NOT EXISTS daily_multipliers (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    multiplier REAL NOT NULL,
    applies_to TEXT DEFAULT 'all' CHECK (applies_to IN ('all', 'subject', 'quiz_type', 'quick_play')),
    target_id TEXT, -- subject_id or quiz_type if not 'all'
    date TEXT NOT NULL,
    used INTEGER DEFAULT 0,
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, date)
);

-- Source: migrations/062_engagement_features.sql
CREATE TABLE IF NOT EXISTS mystery_chests (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chest_type TEXT NOT NULL CHECK (chest_type IN ('bronze', 'silver', 'gold', 'diamond')),
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'opened', 'expired')),
    source TEXT NOT NULL, -- 'achievement', 'streak', 'level_up', 'event'
    source_id TEXT, -- ID of achievement/event that triggered this
    reward_xp INTEGER,
    reward_cosmetic_id TEXT REFERENCES cosmetics(id),
    reward_protection INTEGER DEFAULT 0,
    opened_at TEXT,
    expires_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Source: migrations/062_engagement_features.sql
CREATE TABLE IF NOT EXISTS lucky_wheel_spins (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    spin_date TEXT NOT NULL,
    reward_type TEXT NOT NULL CHECK (reward_type IN ('xp', 'multiplier', 'cosmetic', 'protection', 'chest')),
    reward_value TEXT NOT NULL, -- JSON with reward details
    wheel_segment INTEGER, -- which segment it landed on
    created_at TEXT DEFAULT (datetime('now'))
);

-- Source: migrations/062_engagement_features.sql
CREATE TABLE IF NOT EXISTS user_reward_stats (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    total_chests_opened INTEGER DEFAULT 0,
    total_wheel_spins INTEGER DEFAULT 0,
    last_wheel_spin TEXT,
    weekly_wheel_spins INTEGER DEFAULT 0,
    week_start TEXT,
    surprise_challenges_completed INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Source: migrations/062_engagement_features.sql
CREATE TABLE IF NOT EXISTS comeback_challenges (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    xp_reward INTEGER DEFAULT 500,
    tasks TEXT NOT NULL, -- JSON array of tasks
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'expired')),
    days_inactive INTEGER NOT NULL,
    accepted_at TEXT,
    completed_at TEXT,
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Source: migrations/062_engagement_features.sql
CREATE TABLE IF NOT EXISTS engagement_nudges (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nudge_type TEXT NOT NULL CHECK (nudge_type IN (
        'streak_warning', 'friend_activity', 'missed_goal', 'comeback',
        'achievement_close', 'friend_challenge', 'event_reminder'
    )),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_label TEXT,
    action_link TEXT,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    dismissed INTEGER DEFAULT 0,
    dismissed_at TEXT,
    expires_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Source: migrations/062_engagement_features.sql
CREATE TABLE IF NOT EXISTS user_engagement_metrics (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    days_since_last_activity INTEGER DEFAULT 0,
    avg_session_length INTEGER DEFAULT 0, -- seconds
    avg_questions_per_day REAL DEFAULT 0,
    streak_at_risk INTEGER DEFAULT 0,
    engagement_score REAL DEFAULT 100, -- 0-100
    risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    last_nudge_sent TEXT,
    comeback_modal_shown INTEGER DEFAULT 0,
    last_calculated TEXT DEFAULT (datetime('now')),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Source: migrations/071_add_oauth_providers.sql
CREATE TABLE IF NOT EXISTS user_oauth_providers (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('google')),
    provider_user_id TEXT NOT NULL,
    provider_email TEXT,
    provider_name TEXT,
    provider_avatar_url TEXT,
    linked_at TEXT DEFAULT (datetime('now')),
    last_used_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(provider, provider_user_id),
    UNIQUE(user_id, provider)
);

-- Source: migrations/072_o_a_level_system.sql
CREATE TABLE IF NOT EXISTS subject_specifications (
    id TEXT PRIMARY KEY,
    exam_board_id TEXT NOT NULL REFERENCES exam_boards(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    exam_type_id TEXT NOT NULL REFERENCES exam_types(id) ON DELETE CASCADE,
    syllabus_code TEXT NOT NULL,
    syllabus_name TEXT NOT NULL,
    specification_year TEXT,
    valid_from TEXT,
    valid_to TEXT,
    syllabus_pdf_url TEXT,
    specimen_papers_url TEXT,
    total_papers INTEGER DEFAULT 0,
    assessment_info TEXT,
    is_active INTEGER DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(exam_board_id, syllabus_code, specification_year)
);

-- Source: migrations/085_ai_revision_classroom.sql
CREATE TABLE IF NOT EXISTS revision_schedules (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    exam_type TEXT NOT NULL,
    subject_id TEXT NOT NULL,
    target_exam_date TEXT, -- When the exam is
    schedule_type TEXT DEFAULT 'auto', -- 'auto', 'custom'

    -- Schedule Details
    topics_to_cover TEXT NOT NULL, -- JSON array of topic IDs
    estimated_hours INTEGER,
    daily_time_minutes INTEGER DEFAULT 30, -- Preferred daily revision time
    preferred_days TEXT, -- JSON array of preferred days

    -- Progress
    topics_completed TEXT, -- JSON array of completed topic IDs
    current_topic_id TEXT,
    on_track INTEGER DEFAULT 1, -- Boolean: is student on schedule?
    days_ahead INTEGER DEFAULT 0, -- Positive = ahead, negative = behind

    -- Status
    status TEXT DEFAULT 'active', -- 'active', 'paused', 'completed'
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id)
);

-- Source: migrations/087_tutor_ai_classroom_integration.sql
CREATE TABLE IF NOT EXISTS tutor_availability (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tutor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Availability settings
  accepting_handoffs INTEGER DEFAULT 1,
  accepting_observation INTEGER DEFAULT 1,
  max_observed_sessions INTEGER DEFAULT 5,

  -- Real-time status (updated via polling/heartbeat)
  is_online INTEGER DEFAULT 0,
  current_session_count INTEGER DEFAULT 0,
  last_heartbeat TEXT DEFAULT CURRENT_TIMESTAMP,

  -- Matching preferences
  preferred_subjects TEXT, -- JSON array of subject IDs
  preferred_exam_types TEXT, -- JSON array: ['WASSCE', 'BECE', 'IGCSE', 'NSMQ']
  preferred_difficulty_levels TEXT, -- JSON array: ['beginner', 'intermediate', 'advanced']

  -- Notification preferences
  notify_on_handoff_request INTEGER DEFAULT 1,
  notify_on_high_struggle INTEGER DEFAULT 1,
  min_struggle_score_notify INTEGER DEFAULT 70,

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(tutor_id)
);

-- Source: migrations/090_growth_loop.sql
CREATE TABLE IF NOT EXISTS race_cycles (
    id TEXT PRIMARY KEY,
    scope TEXT NOT NULL CHECK (scope IN ('platform', 'school')),
    school_id TEXT REFERENCES schools(id),
    target_points INTEGER NOT NULL,
    starts_at TEXT NOT NULL,
    ends_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'crowned', 'closed')),
    winner_user_id TEXT REFERENCES users(id),
    target_hit_at TEXT,
    crowned_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    -- added by migrations/091_telegram_community.sql
    start_announced_at TEXT,
    -- added by migrations/091_telegram_community.sql
    winner_announced_at TEXT
);

-- Source: migrations/090_growth_loop.sql
CREATE TABLE IF NOT EXISTS referral_code_requests (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    contact TEXT NOT NULL,
    school_name TEXT,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'rejected')),
    issued_code TEXT,
    fulfilled_by TEXT REFERENCES users(id),
    fulfilled_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Source: migrations/091_telegram_community.sql
CREATE TABLE IF NOT EXISTS telegram_links (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    chat_id TEXT NOT NULL UNIQUE,
    username TEXT,
    linked_at TEXT NOT NULL DEFAULT (datetime('now')),
    stale INTEGER NOT NULL DEFAULT 0
);

-- Source: migrations/091_telegram_community.sql
CREATE TABLE IF NOT EXISTS telegram_link_tokens (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL,
    used_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Source: schema.sql
CREATE TABLE IF NOT EXISTS user_progress (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    exam_type_id TEXT REFERENCES exam_types(id),
    questions_attempted INTEGER DEFAULT 0,
    questions_correct INTEGER DEFAULT 0,
    mastery_level INTEGER DEFAULT 0, -- 0-100
    last_attempt_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    -- added by migrations/019_add_demo_data_isolation.sql
    is_demo_data INTEGER DEFAULT 0,

    -- added by migrations/019_add_demo_data_isolation.sql
    expires_at TEXT,


    UNIQUE(user_id, topic_id, exam_type_id)
);

-- Source: schema.sql
CREATE TABLE IF NOT EXISTS battle_answers (
    id TEXT PRIMARY KEY,
    battle_id TEXT NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_index INTEGER NOT NULL,
    answer TEXT,
    is_correct INTEGER,
    time_taken INTEGER,
    points_earned INTEGER DEFAULT 0,
    answered_at TEXT DEFAULT (datetime('now'))
);

-- Source: schema.sql
CREATE TABLE IF NOT EXISTS chat_rate_limits (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    room_id TEXT REFERENCES chat_rooms(id) ON DELETE CASCADE,
    message_count INTEGER DEFAULT 0,
    window_start TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, room_id)
);

-- Source: schema.sql
CREATE TABLE IF NOT EXISTS chat_student_moderators (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    room_id TEXT NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    assigned_by TEXT NOT NULL REFERENCES users(id),
    expires_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, room_id)
);

-- Source: migrations/004_add_assessment_system.sql
CREATE TABLE IF NOT EXISTS class_members (
    id TEXT PRIMARY KEY,
    class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TEXT DEFAULT (datetime('now')),
    is_active INTEGER DEFAULT 1,
    UNIQUE(class_id, student_id)
);

-- Source: migrations/004_add_assessment_system.sql
CREATE TABLE IF NOT EXISTS assessment_assignments (
    id TEXT PRIMARY KEY,
    assessment_id TEXT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    assignment_type TEXT NOT NULL CHECK (assignment_type IN ('individual', 'class', 'school_level')),

    -- Target (one of these will be set based on assignment_type)
    student_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    class_id TEXT REFERENCES classes(id) ON DELETE CASCADE,
    school_level TEXT CHECK (school_level IS NULL OR school_level IN ('jhs', 'shs')),
    year_group INTEGER,

    assigned_at TEXT DEFAULT (datetime('now')),
    assigned_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Override dates for this specific assignment
    custom_start_date TEXT,
    custom_end_date TEXT
);

-- Source: migrations/004_add_assessment_system.sql
CREATE TABLE IF NOT EXISTS assessment_attempts (
    id TEXT PRIMARY KEY,
    assessment_id TEXT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    attempt_number INTEGER NOT NULL DEFAULT 1,

    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'graded', 'late')),

    -- Timing
    started_at TEXT DEFAULT (datetime('now')),
    submitted_at TEXT,
    time_taken INTEGER, -- in seconds

    -- Scores
    auto_score INTEGER DEFAULT 0, -- points from auto-graded questions
    manual_score INTEGER DEFAULT 0, -- points from manually graded questions
    total_score INTEGER DEFAULT 0, -- auto + manual
    max_score INTEGER NOT NULL,
    percentage REAL,
    grade TEXT,

    -- Late submission
    is_late INTEGER DEFAULT 0,
    late_penalty_applied INTEGER DEFAULT 0,

    -- Grading status
    grading_status TEXT DEFAULT 'pending' CHECK (grading_status IN ('pending', 'partial', 'complete')),
    graded_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    graded_at TEXT,

    -- Feedback
    teacher_feedback TEXT,

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),

    -- added by migrations/020_add_demo_data_isolation_extended.sql
    is_demo_data INTEGER DEFAULT 0,


    -- added by migrations/020_add_demo_data_isolation_extended.sql
    expires_at TEXT,



    UNIQUE(assessment_id, student_id, attempt_number)
);

-- Source: migrations/005_add_quests_system.sql
CREATE TABLE IF NOT EXISTS user_quests (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quest_template_id TEXT NOT NULL REFERENCES quest_templates(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0,
    target INTEGER NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired', 'claimed')),
    started_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT,
    claimed_at TEXT,
    expires_at TEXT NOT NULL,
    UNIQUE(user_id, quest_template_id, expires_at)
);

-- Source: migrations/005_add_quests_system.sql
CREATE TABLE IF NOT EXISTS quest_completions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quest_template_id TEXT NOT NULL REFERENCES quest_templates(id),
    xp_earned INTEGER NOT NULL,
    completed_at TEXT DEFAULT (datetime('now')),
    quest_type TEXT NOT NULL
);

-- Source: migrations/005_add_quests_system.sql
CREATE TABLE IF NOT EXISTS user_weekly_challenges (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    challenge_id TEXT NOT NULL REFERENCES weekly_challenges(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'claimed')),
    completed_at TEXT,
    claimed_at TEXT,
    UNIQUE(user_id, challenge_id)
);

-- Source: migrations/007_add_reminders_system.sql
CREATE TABLE IF NOT EXISTS study_group_members (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    weekly_xp_contribution INTEGER DEFAULT 0,
    joined_at TEXT DEFAULT (datetime('now')),
    last_active TEXT,
    UNIQUE(group_id, user_id)
);

-- Source: migrations/007_add_reminders_system.sql
CREATE TABLE IF NOT EXISTS study_group_messages (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'achievement', 'milestone', 'challenge')),
    created_at TEXT DEFAULT (datetime('now'))
);

-- Source: migrations/008_add_elibrary_system.sql
CREATE TABLE IF NOT EXISTS library_resources (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    resource_type TEXT NOT NULL CHECK (resource_type IN ('pdf', 'video', 'audio', 'document', 'interactive', 'link')),
    content_url TEXT NOT NULL,
    thumbnail_url TEXT,
    file_size INTEGER,
    duration INTEGER,
    subject_id TEXT REFERENCES subjects(id),
    topic_id TEXT REFERENCES topics(id),
    school_level TEXT CHECK (school_level IN ('jhs', 'shs', 'both')),
    access_level TEXT DEFAULT 'free' CHECK (access_level IN ('free', 'basic', 'premium')),
    tags TEXT,
    uploaded_by TEXT NOT NULL REFERENCES users(id),
    is_featured INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    views INTEGER DEFAULT 0,
    downloads INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    -- added by migrations/011_add_downloadable_field.sql
    is_downloadable INTEGER DEFAULT 1,
    -- added by migrations/020_add_demo_data_isolation_extended.sql
    is_demo_data INTEGER DEFAULT 0,
    -- added by migrations/020_add_demo_data_isolation_extended.sql
    expires_at TEXT
);

-- Source: migrations/009_add_ai_counselor.sql
CREATE TABLE IF NOT EXISTS counselor_messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES counselor_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'counselor', 'system')),
    content TEXT NOT NULL,
    thinking TEXT,
    sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'concerned', 'urgent')),
    suggested_resources TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    -- added by migrations/020_add_demo_data_isolation_extended.sql
    is_demo_data INTEGER DEFAULT 0,
    -- added by migrations/020_add_demo_data_isolation_extended.sql
    expires_at TEXT
);

-- Source: migrations/010_add_counselor_reports.sql
CREATE TABLE IF NOT EXISTS counselor_session_summaries (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES counselor_conversations(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES users(id),
    session_date TEXT NOT NULL,
    duration_minutes INTEGER,

    -- AI-generated summary
    brief_summary TEXT NOT NULL,
    main_topics TEXT, -- JSON array
    emotional_state TEXT CHECK (emotional_state IN ('positive', 'neutral', 'stressed', 'anxious', 'sad', 'angry', 'mixed')),
    key_concerns TEXT, -- JSON array
    breakthroughs TEXT, -- JSON array of positive developments

    -- Action items
    student_action_items TEXT, -- JSON array
    recommended_resources TEXT, -- JSON array

    -- Flags
    requires_attention INTEGER DEFAULT 0,
    attention_reason TEXT,

    created_at TEXT DEFAULT (datetime('now'))
);

-- Source: migrations/013_add_ai_tutor.sql
CREATE TABLE IF NOT EXISTS tutor_conversations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    context TEXT, -- 'general', 'question_help', 'topic_study', 'exam_prep'
    exam_type TEXT, -- 'nsmq', 'wassce', 'bece'
    subject_id TEXT,
    topic_id TEXT,
    title TEXT,
    is_archived INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    -- added by migrations/020_add_demo_data_isolation_extended.sql
    is_demo_data INTEGER DEFAULT 0,

    -- added by migrations/020_add_demo_data_isolation_extended.sql
    expires_at TEXT,


    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    FOREIGN KEY (topic_id) REFERENCES topics(id)
);

-- Source: migrations/014_add_chat_system.sql
CREATE TABLE IF NOT EXISTS chat_room_members (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'moderator', 'member')),
    nickname TEXT,
    is_muted INTEGER DEFAULT 0,
    muted_until TEXT,
    joined_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_read_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(room_id, user_id),
    FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Source: migrations/014_add_chat_system.sql
CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    content TEXT NOT NULL,
    content_type TEXT DEFAULT 'text' CHECK (content_type IN ('text', 'image', 'file', 'system')),
    file_url TEXT,
    file_name TEXT,
    file_size INTEGER,
    reply_to_id TEXT,
    is_edited INTEGER DEFAULT 0,
    is_deleted INTEGER DEFAULT 0,
    deleted_by TEXT,
    deleted_reason TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    -- added by migrations/020_add_demo_data_isolation_extended.sql
    is_demo_data INTEGER DEFAULT 0,

    -- added by migrations/020_add_demo_data_isolation_extended.sql
    expires_at TEXT,


    FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (reply_to_id) REFERENCES chat_messages(id),
    FOREIGN KEY (deleted_by) REFERENCES users(id)
);

-- Source: migrations/014_add_chat_system.sql
CREATE TABLE IF NOT EXISTS chat_typing_indicators (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    started_at TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL,
    UNIQUE(room_id, user_id),
    FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Source: migrations/015_add_moderation_system.sql
CREATE TABLE IF NOT EXISTS chat_moderation_actions (
    id TEXT PRIMARY KEY,
    room_id TEXT,
    user_id TEXT NOT NULL,
    moderator_id TEXT NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('warn', 'mute', 'unmute', 'kick', 'ban', 'unban')),
    reason TEXT,
    duration INTEGER,
    expires_at TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (room_id) REFERENCES chat_rooms(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (moderator_id) REFERENCES users(id)
);

-- Source: migrations/016_fix_parent_counselor_messaging.sql
CREATE TABLE IF NOT EXISTS parent_counselor_messages (
    id TEXT PRIMARY KEY,
    report_id TEXT,
    student_id TEXT,
    parent_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    content TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    read_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (report_id) REFERENCES counselor_reports(id),
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (parent_id) REFERENCES users(id),
    FOREIGN KEY (sender_id) REFERENCES users(id)
);

-- Source: migrations/016_fix_parent_counselor_messaging.sql
CREATE TABLE IF NOT EXISTS report_access_logs (
    id TEXT PRIMARY KEY,
    report_id TEXT NOT NULL,
    accessed_by TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('read', 'download', 'share')),
    accessed_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (report_id) REFERENCES counselor_reports(id),
    FOREIGN KEY (accessed_by) REFERENCES users(id)
);

-- Source: migrations/021_subscription_affiliate_system.sql
CREATE TABLE IF NOT EXISTS affiliate_referrals (
  id TEXT PRIMARY KEY,
  affiliate_id TEXT NOT NULL REFERENCES affiliate_profiles(id) ON DELETE CASCADE,
  referred_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'trial', 'converted', 'churned')),
  signup_at TEXT DEFAULT (datetime('now')),
  trial_started_at TEXT,
  converted_at TEXT,
  churned_at TEXT,
  first_payment_id TEXT REFERENCES payment_transactions(id),
  lifetime_value REAL DEFAULT 0,
  UNIQUE(affiliate_id, referred_user_id)
);

-- Source: migrations/021_subscription_affiliate_system.sql
CREATE TABLE IF NOT EXISTS affiliate_payouts (
  id TEXT PRIMARY KEY,
  affiliate_id TEXT NOT NULL REFERENCES affiliate_profiles(id) ON DELETE CASCADE,
  amount REAL NOT NULL,
  payment_method TEXT DEFAULT 'mobile_money',
  mobile_money_number TEXT NOT NULL,
  mobile_money_provider TEXT NOT NULL CHECK(mobile_money_provider IN ('mtn', 'vodafone', 'airteltigo')),
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'failed')),
  paystack_transfer_code TEXT,
  paystack_recipient_code TEXT,
  failure_reason TEXT,
  refund_applied_at TEXT,
  requested_at TEXT DEFAULT (datetime('now')),
  processed_at TEXT,
  admin_notes TEXT
);

-- Source: migrations/096_atomic_failed_transfer_refunds.sql
CREATE TABLE IF NOT EXISTS payment_webhook_receipts (
  transaction_reference TEXT,
  outcome TEXT,
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  event_key TEXT NOT NULL UNIQUE,
  transfer_code TEXT,
  processed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_payment_webhook_receipts_transfer
ON payment_webhook_receipts(transfer_code, event_type);

-- Source: migrations/021_subscription_affiliate_system.sql
CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id TEXT PRIMARY KEY,
  affiliate_id TEXT NOT NULL REFERENCES affiliate_profiles(id) ON DELETE CASCADE,
  ip_hash TEXT,
  user_agent TEXT,
  referrer_url TEXT,
  landing_page TEXT,
  converted INTEGER DEFAULT 0,
  clicked_at TEXT DEFAULT (datetime('now'))
);

-- Source: migrations/021_subscription_affiliate_system.sql
CREATE TABLE IF NOT EXISTS affiliate_leaderboard (
  id TEXT PRIMARY KEY,
  affiliate_id TEXT NOT NULL REFERENCES affiliate_profiles(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period TEXT NOT NULL CHECK(period IN ('daily', 'weekly', 'monthly', 'all_time')),
  period_value TEXT,
  referrals_count INTEGER DEFAULT 0,
  conversions_count INTEGER DEFAULT 0,
  earnings REAL DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  rank INTEGER,
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(affiliate_id, period, period_value)
);

-- Source: migrations/025_add_whiteboard_recordings.sql
CREATE TABLE IF NOT EXISTS recording_views (
  id TEXT PRIMARY KEY,
  recording_id TEXT NOT NULL,
  viewer_id TEXT,                        -- NULL for anonymous views
  viewed_at TEXT DEFAULT CURRENT_TIMESTAMP,
  watch_duration INTEGER DEFAULT 0,      -- How long they watched in ms
  completed INTEGER DEFAULT 0,           -- Whether they watched to the end

  FOREIGN KEY (recording_id) REFERENCES whiteboard_recordings(id) ON DELETE CASCADE,
  FOREIGN KEY (viewer_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Source: migrations/025_add_whiteboard_recordings.sql
CREATE TABLE IF NOT EXISTS recording_shares (
  id TEXT PRIMARY KEY,
  recording_id TEXT NOT NULL,
  share_token TEXT NOT NULL UNIQUE,      -- Unique token for sharing
  created_by TEXT NOT NULL,
  expires_at TEXT,                       -- Optional expiration date
  max_views INTEGER,                     -- Optional view limit
  current_views INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (recording_id) REFERENCES whiteboard_recordings(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Source: migrations/026_add_whiteboards.sql
CREATE TABLE IF NOT EXISTS whiteboard_collaborators (
  id TEXT PRIMARY KEY,
  whiteboard_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  permission TEXT DEFAULT 'view', -- view, edit, admin
  added_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (whiteboard_id) REFERENCES whiteboards(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(whiteboard_id, user_id)
);

-- Source: migrations/027_teacher_bonus_tutoring.sql
CREATE TABLE IF NOT EXISTS tutoring_requests (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  teacher_profile_id TEXT NOT NULL REFERENCES teacher_directory_profiles(id) ON DELETE CASCADE,

  -- Request details
  subject_id TEXT NOT NULL REFERENCES subjects(id),
  topic_description TEXT, -- What the student wants to learn
  session_type TEXT NOT NULL CHECK(session_type IN ('video', 'chat', 'whiteboard')),

  -- Proposed schedule
  proposed_datetime TEXT NOT NULL, -- ISO datetime
  proposed_duration INTEGER NOT NULL DEFAULT 60, -- Minutes (30, 60, 90, 120)
  alternative_datetime TEXT, -- Optional second choice

  -- Student's message to teacher
  message TEXT,

  -- Pricing snapshot (at time of request)
  hourly_rate REAL NOT NULL,
  estimated_cost REAL NOT NULL, -- hourly_rate * (duration / 60)

  -- Status workflow
  status TEXT DEFAULT 'pending' CHECK(status IN (
    'pending',      -- Awaiting teacher response
    'accepted',     -- Teacher accepted, awaiting payment
    'declined',     -- Teacher declined
    'expired',      -- No response within 48 hours
    'cancelled',    -- Cancelled by student
    'paid',         -- Payment completed, session scheduled
    'completed'     -- Session completed
  )),

  -- Teacher response
  teacher_response TEXT, -- Message when accepting/declining
  responded_at TEXT,

  -- Confirmed schedule (may differ from proposed)
  confirmed_datetime TEXT,
  confirmed_duration INTEGER,

  -- Auto-expiry
  expires_at TEXT, -- Default: 48 hours after creation

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Source: migrations/044_flashcard_system.sql
CREATE TABLE IF NOT EXISTS flashcard_decks (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    subject_id TEXT REFERENCES subjects(id),
    topic_id TEXT REFERENCES topics(id),
    is_public INTEGER DEFAULT 0,
    card_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    is_demo_data INTEGER DEFAULT 0,
    expires_at TEXT
);

-- Source: migrations/062_engagement_features.sql
CREATE TABLE IF NOT EXISTS learning_recommendations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic_id TEXT NOT NULL REFERENCES topics(id),
    subject_id TEXT NOT NULL REFERENCES subjects(id),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    reason TEXT NOT NULL, -- 'weak_area', 'not_started', 'review_needed', 'exam_frequent'
    mastery_score REAL DEFAULT 0,
    estimated_time INTEGER DEFAULT 30, -- minutes
    is_completed INTEGER DEFAULT 0,
    dismissed INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Source: migrations/062_engagement_features.sql
CREATE TABLE IF NOT EXISTS tournament_participants (
    id TEXT PRIMARY KEY,
    tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER DEFAULT 0,
    rank INTEGER,
    matches_played INTEGER DEFAULT 0,
    matches_won INTEGER DEFAULT 0,
    joined_at TEXT DEFAULT (datetime('now')),
    UNIQUE(tournament_id, user_id)
);

-- Source: migrations/062_engagement_features.sql
CREATE TABLE IF NOT EXISTS team_battles (
    id TEXT PRIMARY KEY,
    subject_id TEXT REFERENCES subjects(id),
    topic_id TEXT REFERENCES topics(id),
    status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'ready', 'active', 'completed', 'cancelled')),
    team1_score INTEGER DEFAULT 0,
    team2_score INTEGER DEFAULT 0,
    current_question INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 10,
    question_ids TEXT, -- JSON array
    time_per_question INTEGER DEFAULT 30, -- seconds
    winner_team INTEGER, -- 1 or 2
    xp_reward INTEGER DEFAULT 200,
    started_at TEXT,
    completed_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Source: migrations/062_engagement_features.sql
CREATE TABLE IF NOT EXISTS comeback_task_progress (
    id TEXT PRIMARY KEY,
    challenge_id TEXT NOT NULL REFERENCES comeback_challenges(id) ON DELETE CASCADE,
    task_id TEXT NOT NULL,
    progress INTEGER DEFAULT 0,
    target INTEGER NOT NULL,
    completed INTEGER DEFAULT 0,
    completed_at TEXT,
    UNIQUE(challenge_id, task_id)
);

-- Source: migrations/072_o_a_level_system.sql
CREATE TABLE IF NOT EXISTS paper_components (
    id TEXT PRIMARY KEY,
    specification_id TEXT NOT NULL REFERENCES subject_specifications(id) ON DELETE CASCADE,
    paper_number INTEGER NOT NULL,
    paper_name TEXT NOT NULL,
    paper_code TEXT,
    duration_minutes INTEGER,
    total_marks INTEGER,
    weighting_percent REAL,
    question_format TEXT CHECK (question_format IN ('mcq', 'structured', 'essay', 'practical', 'coursework', 'mixed')),
    is_compulsory INTEGER DEFAULT 1,
    tier TEXT CHECK (tier IN ('core', 'extended', 'foundation', 'higher', NULL)),
    description TEXT,
    notes TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(specification_id, paper_number)
);

-- Source: migrations/072_o_a_level_system.sql
CREATE TABLE IF NOT EXISTS syllabus_topics (
    id TEXT PRIMARY KEY,
    specification_id TEXT NOT NULL REFERENCES subject_specifications(id) ON DELETE CASCADE,
    parent_id TEXT REFERENCES syllabus_topics(id) ON DELETE CASCADE,
    topic_code TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    learning_objectives TEXT,
    assessment_objectives TEXT,
    command_words TEXT,
    tier TEXT CHECK (tier IN ('core', 'extended', 'both', NULL)),
    hours_recommended REAL,
    display_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(specification_id, topic_code)
);

-- Source: migrations/072_o_a_level_system.sql
CREATE TABLE IF NOT EXISTS user_target_grades (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    specification_id TEXT NOT NULL REFERENCES subject_specifications(id) ON DELETE CASCADE,
    target_grade TEXT NOT NULL,
    current_predicted TEXT,
    exam_session TEXT,
    exam_year INTEGER,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, specification_id)
);

-- Source: migrations/072_o_a_level_system.sql
CREATE TABLE IF NOT EXISTS user_specification_selections (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    specification_id TEXT NOT NULL REFERENCES subject_specifications(id) ON DELETE CASCADE,
    is_active INTEGER DEFAULT 1,
    priority INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, specification_id)
);

-- Source: migrations/085_ai_revision_classroom.sql
CREATE TABLE IF NOT EXISTS revision_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    exam_type TEXT NOT NULL, -- 'bece', 'wassce', 'nsmq', 'igcse', 'cambridge_as', 'cambridge_a2', 'edexcel_as', 'edexcel_a2'
    subject_id TEXT NOT NULL,
    topic_id TEXT, -- Optional: specific topic focus
    session_type TEXT NOT NULL DEFAULT 'full_revision', -- 'full_revision', 'topic_review', 'quick_recap', 'exam_prep'
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'paused', 'completed', 'abandoned'
    progress_percentage INTEGER DEFAULT 0,
    current_lesson_id TEXT,
    lessons_completed INTEGER DEFAULT 0,
    total_lessons INTEGER DEFAULT 0,
    mastery_score REAL DEFAULT 0, -- 0-100 mastery level
    time_spent_minutes INTEGER DEFAULT 0,
    started_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_activity_at TEXT NOT NULL DEFAULT (datetime('now')),
    completed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    FOREIGN KEY (topic_id) REFERENCES topics(id)
);

-- Source: migrations/085_ai_revision_classroom.sql
CREATE TABLE IF NOT EXISTS topic_mastery (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    topic_id TEXT NOT NULL,
    exam_type TEXT NOT NULL,

    -- Mastery Metrics
    mastery_level REAL DEFAULT 0, -- 0-100
    confidence_level TEXT DEFAULT 'low', -- 'low', 'medium', 'high', 'mastered'
    lessons_completed INTEGER DEFAULT 0,
    practice_questions_attempted INTEGER DEFAULT 0,
    practice_questions_correct INTEGER DEFAULT 0,
    revision_count INTEGER DEFAULT 0, -- How many times revised

    -- Spaced Repetition
    last_revised_at TEXT,
    next_revision_due TEXT, -- When to suggest revisiting
    retention_strength REAL DEFAULT 1.0, -- Decay factor for spaced repetition

    -- Exam Board Specific
    exam_board_tips TEXT, -- JSON: exam board specific tips
    common_mistakes TEXT, -- JSON: common mistakes for this topic
    high_yield_points TEXT, -- JSON: frequently examined points

    -- Progress Over Time
    initial_assessment_score REAL,
    current_assessment_score REAL,
    improvement_percentage REAL DEFAULT 0,

    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, topic_id, exam_type),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (topic_id) REFERENCES topics(id)
);

-- Source: migrations/085_ai_revision_classroom.sql
CREATE TABLE IF NOT EXISTS exam_board_intelligence (
    id TEXT PRIMARY KEY,
    exam_type TEXT NOT NULL,
    exam_board TEXT, -- 'waec', 'cambridge', 'edexcel'
    subject_id TEXT NOT NULL,
    topic_id TEXT,

    -- Intelligence Data
    frequency_score INTEGER DEFAULT 0, -- How often this topic appears (1-10)
    typical_marks INTEGER, -- Typical marks allocated
    question_styles TEXT, -- JSON: common question formats
    marking_scheme_tips TEXT, -- JSON: how examiners mark
    common_mistakes TEXT, -- JSON: frequent student errors
    model_answers TEXT, -- JSON: example answers
    examiner_comments TEXT, -- JSON: past examiner feedback
    key_formulas TEXT, -- JSON: must-know formulas

    -- Historical Data
    appeared_in_years TEXT, -- JSON: years this topic appeared
    last_appeared TEXT,

    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(exam_type, subject_id, topic_id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    FOREIGN KEY (topic_id) REFERENCES topics(id)
);

-- Source: migrations/085_ai_revision_classroom.sql
CREATE TABLE IF NOT EXISTS revision_achievements (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    achievement_type TEXT NOT NULL, -- 'topic_mastered', 'streak', 'subject_complete', 'quick_learner', 'persistent'
    achievement_name TEXT NOT NULL,
    achievement_description TEXT,
    exam_type TEXT,
    subject_id TEXT,
    topic_id TEXT,
    xp_earned INTEGER DEFAULT 0,
    earned_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    FOREIGN KEY (topic_id) REFERENCES topics(id)
);

-- Source: migrations/086_multiplayer_study_rooms.sql
CREATE TABLE IF NOT EXISTS study_sessions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  owner_id TEXT NOT NULL,
  room_code TEXT UNIQUE, -- Short joinable code like "ABC123"

  -- Session Details
  title TEXT NOT NULL,
  description TEXT,
  subject_id TEXT,
  topic_id TEXT,
  exam_type TEXT, -- 'BECE', 'WASSCE', 'IGCSE', 'A-Level'

  -- Capacity
  max_participants INTEGER DEFAULT 5,

  -- Features Enabled
  voice_enabled INTEGER DEFAULT 1,
  whiteboard_enabled INTEGER DEFAULT 1,
  ai_tutor_enabled INTEGER DEFAULT 1,
  recording_enabled INTEGER DEFAULT 0,

  -- Privacy
  is_public INTEGER DEFAULT 0, -- Can be discovered in lobby
  requires_approval INTEGER DEFAULT 0, -- Host must approve joins
  password_hash TEXT, -- Optional password protection

  -- Status
  status TEXT DEFAULT 'waiting', -- 'waiting', 'active', 'paused', 'ended'
  started_at TEXT,
  ended_at TEXT,

  -- AI Teaching State (shared across room)
  current_lesson_id TEXT,
  current_teaching_phase TEXT,
  shared_whiteboard_state TEXT, -- JSON canvas state

  -- Metadata
  tags TEXT, -- JSON array: ['algebra', 'exam_prep']
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id),
  FOREIGN KEY (topic_id) REFERENCES topics(id)
);

-- Source: migrations/090_growth_loop.sql
CREATE TABLE IF NOT EXISTS race_crossings (
    cycle_id TEXT NOT NULL REFERENCES race_cycles(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    crossed_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (cycle_id, user_id)
);

-- Source: migrations/091_telegram_community.sql
CREATE TABLE IF NOT EXISTS race_alert_state (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cycle_id TEXT NOT NULL REFERENCES race_cycles(id) ON DELETE CASCADE,
    last_rank INTEGER,
    last_score INTEGER,
    alerted_flags INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, cycle_id)
);

-- Source: migrations/091_telegram_community.sql (renamed from points_ledger_new)
CREATE TABLE IF NOT EXISTS points_ledger (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    source TEXT NOT NULL CHECK (source IN (
        'question_correct', 'battle_win', 'streak_day', 'quest_claim',
        'tutor_session', 'essay_graded', 'referral_signup',
        'referral_paid_conversion', 'house_contribution',
        'notification_subscribe'
    )),
    source_ref TEXT,
    cycle_id TEXT REFERENCES race_cycles(id),
    is_demo_data INTEGER DEFAULT 0,
    expires_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Source: migrations/008_add_elibrary_system.sql
CREATE TABLE IF NOT EXISTS library_collection_items (
    id TEXT PRIMARY KEY,
    collection_id TEXT NOT NULL REFERENCES library_collections(id) ON DELETE CASCADE,
    resource_id TEXT NOT NULL REFERENCES library_resources(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    added_at TEXT DEFAULT (datetime('now')),
    UNIQUE(collection_id, resource_id)
);

-- Source: migrations/008_add_elibrary_system.sql
CREATE TABLE IF NOT EXISTS library_ratings (
    id TEXT PRIMARY KEY,
    resource_id TEXT NOT NULL REFERENCES library_resources(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(resource_id, user_id)
);

-- Source: migrations/008_add_elibrary_system.sql
CREATE TABLE IF NOT EXISTS library_access_logs (
    id TEXT PRIMARY KEY,
    resource_id TEXT NOT NULL REFERENCES library_resources(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('view', 'download', 'complete')),
    progress INTEGER DEFAULT 0,
    accessed_at TEXT DEFAULT (datetime('now'))
);

-- Source: migrations/008_add_elibrary_system.sql
CREATE TABLE IF NOT EXISTS library_progress (
    id TEXT PRIMARY KEY,
    resource_id TEXT NOT NULL REFERENCES library_resources(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    progress_percent INTEGER DEFAULT 0,
    last_position TEXT,
    completed INTEGER DEFAULT 0,
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(resource_id, user_id)
);

-- Source: migrations/009_add_ai_counselor.sql
CREATE TABLE IF NOT EXISTS counselor_feedback (
    id TEXT PRIMARY KEY,
    message_id TEXT NOT NULL REFERENCES counselor_messages(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback_type TEXT CHECK (feedback_type IN ('helpful', 'not_helpful', 'inappropriate')),
    comment TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    -- added by migrations/020_add_demo_data_isolation_extended.sql
    is_demo_data INTEGER DEFAULT 0,
    -- added by migrations/020_add_demo_data_isolation_extended.sql
    expires_at TEXT
);

-- Source: migrations/014_add_chat_system.sql
CREATE TABLE IF NOT EXISTS chat_message_reactions (
    id TEXT PRIMARY KEY,
    message_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    emoji TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    -- added by migrations/020_add_demo_data_isolation_extended.sql
    is_demo_data INTEGER DEFAULT 0,

    -- added by migrations/020_add_demo_data_isolation_extended.sql
    expires_at TEXT,


    UNIQUE(message_id, user_id, emoji),
    FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Source: migrations/015_add_moderation_system.sql
CREATE TABLE IF NOT EXISTS chat_reports (
    id TEXT PRIMARY KEY,
    reporter_id TEXT NOT NULL,
    reported_user_id TEXT NOT NULL,
    message_id TEXT,
    room_id TEXT,
    reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'hate_speech', 'threats', 'other')),
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
    reviewed_by TEXT,
    review_notes TEXT,
    resolution TEXT CHECK (resolution IN ('warning', 'mute', 'ban', 'message_deleted', 'no_action', NULL)),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    reviewed_at TEXT,
    FOREIGN KEY (reporter_id) REFERENCES users(id),
    FOREIGN KEY (reported_user_id) REFERENCES users(id),
    FOREIGN KEY (message_id) REFERENCES chat_messages(id),
    FOREIGN KEY (room_id) REFERENCES chat_rooms(id),
    FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

-- Source: override: schema.sql:52-72 + 072 columns + extended UNIQUE (task-2 brief)
CREATE TABLE IF NOT EXISTS past_papers (
    id TEXT PRIMARY KEY,
    exam_type_id TEXT NOT NULL REFERENCES exam_types(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    paper_type_id TEXT NOT NULL REFERENCES paper_types(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month TEXT,
    series TEXT,
    title TEXT NOT NULL,
    description TEXT,
    total_questions INTEGER DEFAULT 0,
    total_marks INTEGER,
    time_allowed INTEGER,
    instructions TEXT,
    is_complete INTEGER DEFAULT 0,
    is_premium INTEGER DEFAULT 0,
    source_url TEXT,
    -- O/A-level columns (072_o_a_level_system.sql:224-231)
    exam_board_id TEXT REFERENCES exam_boards(id),
    specification_id TEXT REFERENCES subject_specifications(id),
    paper_component_id TEXT REFERENCES paper_components(id),
    variant TEXT,
    session TEXT,
    tier TEXT CHECK (tier IN ('core', 'extended', 'foundation', 'higher', NULL)),
    has_mark_scheme INTEGER DEFAULT 0,
    has_examiner_report INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    -- variant/session added to close the duplicate-paper hole for O/A-level rows.
    -- SQLite treats NULLs as distinct in UNIQUE, so the NULL-month hole persists;
    -- accepted: enforcement moves to db:verify + application upserts.
    UNIQUE(exam_type_id, subject_id, paper_type_id, year, month, variant, session)
);

-- Source: migrations/021_subscription_affiliate_system.sql
CREATE TABLE IF NOT EXISTS affiliate_commissions (
  id TEXT PRIMARY KEY,
  affiliate_id TEXT NOT NULL REFERENCES affiliate_profiles(id) ON DELETE CASCADE,
  referral_id TEXT NOT NULL REFERENCES affiliate_referrals(id) ON DELETE CASCADE,
  transaction_id TEXT REFERENCES payment_transactions(id),
  amount REAL NOT NULL,
  commission_rate REAL NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'paid', 'cancelled')),
  created_at TEXT DEFAULT (datetime('now')),
  approved_at TEXT,
  paid_at TEXT,
  payout_id TEXT REFERENCES affiliate_payouts(id),
  effects_applied_at TEXT
);

-- Source: migrations/027_teacher_bonus_tutoring.sql
CREATE TABLE IF NOT EXISTS teacher_year_end_bonuses (
  id TEXT PRIMARY KEY,
  teacher_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  affiliate_profile_id TEXT REFERENCES affiliate_profiles(id),
  year INTEGER NOT NULL,

  -- Student tracking
  total_referred_students INTEGER DEFAULT 0,
  active_students INTEGER DEFAULT 0, -- Students with 3+ months active subscription

  -- Financial calculations
  total_student_payments REAL DEFAULT 0, -- Gross payments from referred students in GHS
  bonus_percentage REAL DEFAULT 0, -- Applied percentage based on tier
  bonus_amount REAL DEFAULT 0, -- Calculated bonus amount in GHS

  -- Status workflow
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'calculated', 'approved', 'paid', 'rejected')),
  calculation_date TEXT,

  -- Review/Approval
  reviewed_by TEXT REFERENCES users(id),
  reviewed_at TEXT,
  review_notes TEXT,

  -- Payout details (reuses affiliate payout infrastructure)
  payout_id TEXT REFERENCES affiliate_payouts(id),
  paid_at TEXT,

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(teacher_id, year)
);

-- Source: migrations/027_teacher_bonus_tutoring.sql
CREATE TABLE IF NOT EXISTS tutoring_sessions (
  id TEXT PRIMARY KEY,
  request_id TEXT REFERENCES tutoring_requests(id),
  student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  teacher_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  teacher_profile_id TEXT NOT NULL REFERENCES teacher_directory_profiles(id),

  -- Session details
  subject_id TEXT NOT NULL REFERENCES subjects(id),
  topic_description TEXT,
  session_type TEXT NOT NULL CHECK(session_type IN ('video', 'chat', 'whiteboard')),

  -- Schedule
  scheduled_datetime TEXT NOT NULL,
  scheduled_duration INTEGER NOT NULL, -- Minutes

  -- Actual session times
  started_at TEXT,
  ended_at TEXT,
  actual_duration INTEGER, -- Actual minutes

  -- Session status
  status TEXT DEFAULT 'scheduled' CHECK(status IN (
    'scheduled',           -- Upcoming session
    'in_progress',         -- Session currently active
    'completed',           -- Session finished normally
    'cancelled_by_student',
    'cancelled_by_teacher',
    'no_show_student',     -- Student didn't show up
    'no_show_teacher',     -- Teacher didn't show up
    'rescheduled'          -- Moved to a new time
  )),
  cancellation_reason TEXT,
  cancelled_at TEXT,
  rescheduled_to TEXT, -- New session ID if rescheduled

  -- Session resources (linked to existing systems)
  chat_room_id TEXT, -- References chat_rooms(id) for chat sessions
  whiteboard_id TEXT, -- References whiteboards(id) for whiteboard sessions
  recording_id TEXT, -- References whiteboard_recordings(id) if recorded
  video_room_url TEXT, -- External video call URL (Zoom/Meet link)
  video_room_id TEXT, -- If using internal video system

  -- Session notes
  teacher_notes TEXT, -- Private notes for teacher
  session_summary TEXT, -- Shared summary visible to student
  homework_assigned TEXT, -- Optional homework or follow-up tasks

  -- Billing (15% platform commission, 85% to teacher)
  hourly_rate REAL NOT NULL,
  session_cost REAL NOT NULL, -- Total cost to student
  platform_fee REAL NOT NULL, -- 15% of session_cost
  teacher_earnings REAL NOT NULL, -- 85% of session_cost

  -- Review tracking
  student_reviewed INTEGER DEFAULT 0,
  review_reminder_sent INTEGER DEFAULT 0,

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Source: migrations/044_flashcard_system.sql
CREATE TABLE IF NOT EXISTS flashcards (
    id TEXT PRIMARY KEY,
    deck_id TEXT NOT NULL REFERENCES flashcard_decks(id) ON DELETE CASCADE,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    image_url TEXT,
    hint TEXT,
    difficulty INTEGER DEFAULT 1 CHECK (difficulty IN (1, 2, 3, 4, 5)),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Source: migrations/062_engagement_features.sql
CREATE TABLE IF NOT EXISTS team_battle_members (
    id TEXT PRIMARY KEY,
    battle_id TEXT NOT NULL REFERENCES team_battles(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team_number INTEGER NOT NULL CHECK (team_number IN (1, 2)),
    is_captain INTEGER DEFAULT 0,
    score INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    joined_at TEXT DEFAULT (datetime('now')),
    UNIQUE(battle_id, user_id)
);

-- Source: migrations/062_engagement_features.sql
CREATE TABLE IF NOT EXISTS team_battle_invites (
    id TEXT PRIMARY KEY,
    battle_id TEXT NOT NULL REFERENCES team_battles(id) ON DELETE CASCADE,
    inviter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invitee_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team_number INTEGER NOT NULL CHECK (team_number IN (1, 2)),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    created_at TEXT DEFAULT (datetime('now')),
    expires_at TEXT,
    UNIQUE(battle_id, invitee_id)
);

-- Source: migrations/072_o_a_level_system.sql
CREATE TABLE IF NOT EXISTS topic_syllabus_mapping (
    id TEXT PRIMARY KEY,
    topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    syllabus_topic_id TEXT NOT NULL REFERENCES syllabus_topics(id) ON DELETE CASCADE,
    coverage_level TEXT DEFAULT 'full' CHECK (coverage_level IN ('full', 'partial', 'introduces')),
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(topic_id, syllabus_topic_id)
);

-- Source: migrations/072_o_a_level_system.sql
CREATE TABLE IF NOT EXISTS grade_boundaries (
    id TEXT PRIMARY KEY,
    specification_id TEXT NOT NULL REFERENCES subject_specifications(id) ON DELETE CASCADE,
    paper_component_id TEXT REFERENCES paper_components(id) ON DELETE SET NULL,
    session TEXT NOT NULL,
    year INTEGER NOT NULL,
    grade TEXT NOT NULL,
    raw_mark INTEGER NOT NULL,
    ums_mark INTEGER,
    percentage REAL,
    is_overall INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(specification_id, paper_component_id, session, year, grade)
);

-- Source: migrations/072_o_a_level_system.sql
CREATE TABLE IF NOT EXISTS user_syllabus_progress (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    syllabus_topic_id TEXT NOT NULL REFERENCES syllabus_topics(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'needs_review')),
    confidence_level INTEGER DEFAULT 0 CHECK (confidence_level >= 0 AND confidence_level <= 100),
    questions_attempted INTEGER DEFAULT 0,
    questions_correct INTEGER DEFAULT 0,
    last_practiced_at TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, syllabus_topic_id)
);

-- Source: migrations/085_ai_revision_classroom.sql
CREATE TABLE IF NOT EXISTS revision_lessons (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    topic_id TEXT NOT NULL,
    lesson_order INTEGER NOT NULL, -- Order in the revision sequence
    title TEXT NOT NULL,
    description TEXT,
    lesson_type TEXT NOT NULL DEFAULT 'concept', -- 'concept', 'example', 'practice', 'assessment'
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'skipped'

    -- AI Teaching Content
    hook_content TEXT, -- Engaging intro/hook
    explanation_content TEXT, -- Main teaching content
    visual_aids TEXT, -- JSON array of visual aid descriptions/references
    examples TEXT, -- JSON array of worked examples
    key_points TEXT, -- JSON array of key takeaways

    -- Student Progress
    understanding_level INTEGER DEFAULT 0, -- 0-5 scale from AI assessment
    questions_attempted INTEGER DEFAULT 0,
    questions_correct INTEGER DEFAULT 0,
    time_spent_seconds INTEGER DEFAULT 0,

    -- Timestamps
    started_at TEXT,
    completed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (session_id) REFERENCES revision_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (topic_id) REFERENCES topics(id)
);

-- Source: migrations/086_multiplayer_study_rooms.sql
CREATE TABLE IF NOT EXISTS study_session_participants (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  session_id TEXT NOT NULL,
  user_id TEXT NOT NULL,

  -- Role & Permissions
  role TEXT DEFAULT 'participant', -- 'host', 'co-host', 'participant'
  can_draw INTEGER DEFAULT 1,
  can_speak INTEGER DEFAULT 1,
  can_control_ai INTEGER DEFAULT 0, -- Can trigger AI teaching

  -- Presence
  joined_at TEXT DEFAULT CURRENT_TIMESTAMP,
  left_at TEXT,
  is_active INTEGER DEFAULT 1,
  last_heartbeat TEXT DEFAULT CURRENT_TIMESTAMP,

  -- Media State
  mic_enabled INTEGER DEFAULT 0,
  is_speaking INTEGER DEFAULT 0,
  hand_raised INTEGER DEFAULT 0,

  -- Drawing State
  cursor_x REAL,
  cursor_y REAL,
  drawing_color TEXT DEFAULT '#8b5cf6',

  UNIQUE(session_id, user_id),
  FOREIGN KEY (session_id) REFERENCES study_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Source: migrations/086_multiplayer_study_rooms.sql
CREATE TABLE IF NOT EXISTS study_session_events (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  session_id TEXT NOT NULL,
  user_id TEXT,

  -- Event Details
  event_type TEXT NOT NULL, -- 'draw', 'erase', 'cursor_move', 'chat', 'ai_request', 'voice_start', 'voice_end', 'hand_raise', 'reaction'
  event_data TEXT NOT NULL, -- JSON payload

  -- Ordering
  sequence_num INTEGER, -- For ordering events
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (session_id) REFERENCES study_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Source: migrations/086_multiplayer_study_rooms.sql
CREATE TABLE IF NOT EXISTS study_session_messages (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  session_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,

  -- Message Content
  message_type TEXT DEFAULT 'text', -- 'text', 'question', 'ai_response', 'system', 'voice_transcript'
  content TEXT NOT NULL,

  -- Voice Message Support
  audio_url TEXT,
  audio_duration_seconds INTEGER,
  transcript TEXT, -- STT transcript if voice message

  -- Metadata
  is_pinned INTEGER DEFAULT 0,
  reply_to_id TEXT, -- For threaded replies
  reactions TEXT, -- JSON: {"👍": ["user1", "user2"], "❤️": ["user3"]}

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (session_id) REFERENCES study_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reply_to_id) REFERENCES study_session_messages(id)
);

-- Source: migrations/086_multiplayer_study_rooms.sql
CREATE TABLE IF NOT EXISTS study_session_drawings (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  session_id TEXT NOT NULL,
  user_id TEXT NOT NULL,

  -- Drawing Data
  object_id TEXT NOT NULL, -- Fabric.js object ID
  object_type TEXT NOT NULL, -- 'path', 'rect', 'circle', 'text', 'line', 'arrow'
  object_data TEXT NOT NULL, -- JSON serialized Fabric.js object

  -- Metadata
  layer INTEGER DEFAULT 0, -- For z-ordering
  is_deleted INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (session_id) REFERENCES study_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Source: migrations/086_multiplayer_study_rooms.sql
CREATE TABLE IF NOT EXISTS study_session_recordings (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  session_id TEXT NOT NULL,

  -- Recording Info
  title TEXT,
  duration_seconds INTEGER,
  file_size_bytes INTEGER,

  -- Storage
  video_url TEXT,
  audio_url TEXT,
  whiteboard_events_url TEXT, -- JSON file of all drawing events
  transcript_url TEXT,

  -- Processing Status
  status TEXT DEFAULT 'recording', -- 'recording', 'processing', 'ready', 'failed'

  -- Metadata
  started_at TEXT NOT NULL,
  ended_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (session_id) REFERENCES study_sessions(id) ON DELETE CASCADE
);

-- Source: migrations/087_tutor_ai_classroom_integration.sql
CREATE TABLE IF NOT EXISTS ai_classroom_sessions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  revision_session_id TEXT REFERENCES revision_sessions(id) ON DELETE CASCADE,

  -- Student info
  student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_name TEXT,
  student_avatar_url TEXT,

  -- Session context
  subject_id TEXT REFERENCES subjects(id),
  subject_name TEXT,
  topic_id TEXT REFERENCES topics(id),
  topic_name TEXT,
  exam_type TEXT,

  -- Current teaching state (synced from revision classroom)
  current_phase TEXT DEFAULT 'hook', -- hook, explain, check, practice, confirm, connect
  current_lesson_id TEXT,
  lesson_title TEXT,
  lesson_progress_percent INTEGER DEFAULT 0,

  -- Struggle detection signals
  struggle_score REAL DEFAULT 0, -- 0-100, computed from signals below
  consecutive_wrong_answers INTEGER DEFAULT 0,
  time_stuck_seconds INTEGER DEFAULT 0,
  repeated_questions_count INTEGER DEFAULT 0,
  clarification_requests_count INTEGER DEFAULT 0,
  last_activity_at TEXT DEFAULT CURRENT_TIMESTAMP,

  -- Handoff state
  handoff_status TEXT DEFAULT 'none', -- none, suggested, requested, pending, connected, declined
  handoff_reason TEXT,
  handoff_suggested_at TEXT,
  handoff_requested_at TEXT,

  -- Connected tutor (if any)
  tutor_id TEXT REFERENCES users(id),
  tutor_name TEXT,
  tutor_avatar_url TEXT,
  tutor_joined_at TEXT,
  tutor_mode TEXT DEFAULT 'observe', -- observe, co_teach, takeover

  -- Session state
  is_active INTEGER DEFAULT 1,
  visibility TEXT DEFAULT 'public', -- public (visible to tutors), private

  -- AI conversation context (for tutor reference)
  ai_messages_summary TEXT, -- Brief summary of AI conversation
  last_ai_message TEXT,
  last_student_response TEXT,

  -- Whiteboard state reference
  whiteboard_state TEXT, -- JSON serialized Fabric.js state

  started_at TEXT DEFAULT CURRENT_TIMESTAMP,
  ended_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Source: schema.sql
CREATE TABLE IF NOT EXISTS paper_attempts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    paper_id TEXT NOT NULL REFERENCES past_papers(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'graded', 'abandoned')),
    started_at TEXT DEFAULT (datetime('now')),
    time_allowed INTEGER,
    time_used INTEGER,
    submitted_at TEXT,
    total_score INTEGER,
    max_score INTEGER,
    percentage REAL,
    grade TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    -- added by migrations/020_add_demo_data_isolation_extended.sql
    is_demo_data INTEGER DEFAULT 0,
    -- added by migrations/020_add_demo_data_isolation_extended.sql
    expires_at TEXT
);

-- Source: schema.sql
CREATE TABLE IF NOT EXISTS practice_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mode TEXT NOT NULL CHECK (mode IN ('topic_drill', 'speed_race', 'flashcard', 'competition_sim', 'past_paper', 'essay_practice')),
    exam_type_id TEXT REFERENCES exam_types(id),
    paper_type_id TEXT REFERENCES paper_types(id),
    past_paper_id TEXT REFERENCES past_papers(id),
    subject_id TEXT REFERENCES subjects(id),
    topic_id TEXT REFERENCES topics(id),
    questions_count INTEGER DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    total_time INTEGER DEFAULT 0, -- seconds
    score INTEGER DEFAULT 0,
    started_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT,
    -- added by migrations/019_add_demo_data_isolation.sql
    is_demo_data INTEGER DEFAULT 0,
    -- added by migrations/019_add_demo_data_isolation.sql
    expires_at TEXT
);

-- Source: migrations/027_teacher_bonus_tutoring.sql
CREATE TABLE IF NOT EXISTS teacher_bonus_students (
  id TEXT PRIMARY KEY,
  bonus_id TEXT NOT NULL REFERENCES teacher_year_end_bonuses(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referral_id TEXT REFERENCES affiliate_referrals(id),

  -- Subscription tracking for the year
  first_subscription_date TEXT,
  active_months INTEGER DEFAULT 0, -- Months with active paid subscription
  total_payments REAL DEFAULT 0, -- Total payments made by this student in the year (GHS)

  -- Qualification status
  is_qualified INTEGER DEFAULT 0, -- Has 3+ active months
  qualification_date TEXT,

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(bonus_id, student_id)
);

-- Source: migrations/027_teacher_bonus_tutoring.sql
CREATE TABLE IF NOT EXISTS teacher_reviews (
  id TEXT PRIMARY KEY,
  teacher_profile_id TEXT NOT NULL REFERENCES teacher_directory_profiles(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id TEXT REFERENCES tutoring_sessions(id), -- Optional link to specific session

  -- Overall rating (required)
  rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),

  -- Review content
  title TEXT, -- Optional headline
  review_text TEXT, -- Detailed review

  -- Specific aspect ratings (optional, 1-5)
  knowledge_rating INTEGER CHECK(knowledge_rating IS NULL OR (knowledge_rating >= 1 AND knowledge_rating <= 5)),
  communication_rating INTEGER CHECK(communication_rating IS NULL OR (communication_rating >= 1 AND communication_rating <= 5)),
  punctuality_rating INTEGER CHECK(punctuality_rating IS NULL OR (punctuality_rating >= 1 AND punctuality_rating <= 5)),
  patience_rating INTEGER CHECK(patience_rating IS NULL OR (patience_rating >= 1 AND patience_rating <= 5)),

  -- Teacher response
  teacher_response TEXT,
  teacher_responded_at TEXT,

  -- Moderation
  is_approved INTEGER DEFAULT 1, -- Auto-approved by default
  is_flagged INTEGER DEFAULT 0,
  flagged_reason TEXT,
  moderated_by TEXT REFERENCES users(id),
  moderated_at TEXT,

  -- Helpful votes
  helpful_count INTEGER DEFAULT 0,

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Source: migrations/027_teacher_bonus_tutoring.sql
CREATE TABLE IF NOT EXISTS tutoring_payments (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES tutoring_sessions(id) ON DELETE CASCADE,
  request_id TEXT REFERENCES tutoring_requests(id),
  student_id TEXT NOT NULL REFERENCES users(id),
  teacher_id TEXT NOT NULL REFERENCES users(id),

  -- Payment amounts (in GHS)
  amount REAL NOT NULL, -- Total paid by student
  currency TEXT DEFAULT 'GHS',
  platform_fee REAL NOT NULL, -- 15% to platform
  teacher_payout REAL NOT NULL, -- 85% to teacher

  -- Paystack integration
  payment_reference TEXT UNIQUE,
  paystack_response TEXT, -- JSON response from Paystack
  paystack_authorization_code TEXT, -- For recurring payments

  -- Payment status
  status TEXT DEFAULT 'pending' CHECK(status IN (
    'pending',       -- Awaiting payment
    'processing',    -- Payment being processed
    'paid',          -- Successfully paid
    'failed',        -- Payment failed
    'refunded',      -- Fully refunded
    'partial_refund',-- Partially refunded
    'disputed'       -- Under dispute
  )),
  paid_at TEXT,

  -- Teacher payout status
  teacher_payout_status TEXT DEFAULT 'pending' CHECK(teacher_payout_status IN (
    'pending',      -- Awaiting session completion
    'processing',   -- Payout being processed
    'completed',    -- Paid to teacher
    'failed',       -- Payout failed
    'held'          -- Held due to dispute or issue
  )),
  teacher_payout_id TEXT REFERENCES affiliate_payouts(id), -- Reuse payout infrastructure
  teacher_paid_at TEXT,

  -- Refund tracking
  refund_amount REAL,
  refund_reason TEXT,
  refunded_at TEXT,
  refund_reference TEXT,

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Source: migrations/027_teacher_bonus_tutoring.sql
CREATE TABLE IF NOT EXISTS session_reminders (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES tutoring_sessions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK(reminder_type IN ('24h', '1h', '15m', 'start')),
  scheduled_for TEXT NOT NULL,
  sent INTEGER DEFAULT 0,
  sent_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(session_id, user_id, reminder_type)
);

-- Source: override: 028 rebuild shape + 072 columns + schema.sql FKs (task-2 brief)
CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    -- topic_id deliberately NULLABLE (FK restored from legacy schema.sql:317 without
    -- NOT NULL): ~600 migrated rows have no topic. Do NOT add NOT NULL here.
    topic_id TEXT REFERENCES topics(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    exam_type_id TEXT REFERENCES exam_types(id),
    paper_type_id TEXT REFERENCES paper_types(id),
    past_paper_id TEXT REFERENCES past_papers(id),
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL CHECK (question_type IN (
        'multiple_choice', 'true_false', 'direct_answer', 'problem', 'riddle',
        'essay', 'short_answer', 'structured', 'practical', 'calculation', 'diagram', 'comprehension'
    )),
    round_type TEXT CHECK (round_type IN ('round_one', 'speed_race', 'problem_of_day', 'true_false', 'riddles')),
    options TEXT, -- JSON array for multiple choice options
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),
    points INTEGER DEFAULT 3,
    marks INTEGER DEFAULT 1,
    time_limit INTEGER DEFAULT 30, -- seconds
    question_number INTEGER,
    section TEXT,
    is_compulsory INTEGER DEFAULT 1,
    image_url TEXT,
    -- O/A-level columns (072_o_a_level_system.sql:238-243)
    syllabus_topic_id TEXT REFERENCES syllabus_topics(id),
    command_word TEXT,
    assessment_objective TEXT,
    source_paper_code TEXT,
    source_question_number TEXT,
    exam_board_id TEXT REFERENCES exam_boards(id),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Source: migrations/028_seed_past_papers_questions.sql
-- LEFTOVER scratch table from 028_seed_past_papers_questions.sql:6 (an aborted
-- table-rebuild: created and INSERTed into, never renamed or dropped). It does not
-- match the task-2 scratch regex /(_backup|_v2|_old|_tmp)$/ so table-set parity
-- requires keeping it; no code references it. Candidate for a future DROP migration.
CREATE TABLE IF NOT EXISTS questions_new (
    id TEXT PRIMARY KEY,
    topic_id TEXT REFERENCES topics(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    exam_type_id TEXT REFERENCES exam_types(id),
    paper_type_id TEXT REFERENCES paper_types(id),
    past_paper_id TEXT REFERENCES past_papers(id),
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL CHECK (question_type IN (
        'multiple_choice', 'true_false', 'direct_answer', 'problem', 'riddle',
        'essay', 'short_answer', 'structured', 'practical', 'calculation', 'diagram', 'comprehension'
    )),
    round_type TEXT CHECK (round_type IN ('round_one', 'speed_race', 'problem_of_day', 'true_false', 'riddles')),
    options TEXT,
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),
    points INTEGER DEFAULT 3,
    marks INTEGER DEFAULT 1,
    time_limit INTEGER DEFAULT 30,
    question_number INTEGER,
    section TEXT,
    is_compulsory INTEGER DEFAULT 1,
    image_url TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Source: migrations/044_flashcard_system.sql
CREATE TABLE IF NOT EXISTS flashcard_reviews (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    flashcard_id TEXT NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
    deck_id TEXT NOT NULL REFERENCES flashcard_decks(id) ON DELETE CASCADE,
    ease_rating INTEGER CHECK (ease_rating IN (1, 2, 3, 4, 5)),
    ease_factor REAL DEFAULT 2.5,
    interval_days INTEGER DEFAULT 1,
    repetitions INTEGER DEFAULT 0,
    next_review_at TEXT,
    reviewed_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, flashcard_id, reviewed_at)
);

-- Source: migrations/072_o_a_level_system.sql
CREATE TABLE IF NOT EXISTS past_paper_files (
    id TEXT PRIMARY KEY,
    past_paper_id TEXT NOT NULL REFERENCES past_papers(id) ON DELETE CASCADE,
    file_type TEXT NOT NULL CHECK (file_type IN ('question_paper', 'mark_scheme', 'examiner_report', 'specimen', 'insert', 'grade_thresholds')),
    file_url TEXT NOT NULL,
    file_name TEXT,
    file_size INTEGER,
    page_count INTEGER,
    is_premium INTEGER DEFAULT 0,
    uploaded_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(past_paper_id, file_type)
);

-- Source: migrations/085_ai_revision_classroom.sql
CREATE TABLE IF NOT EXISTS revision_checkpoints (
    id TEXT PRIMARY KEY,
    lesson_id TEXT NOT NULL,
    checkpoint_type TEXT NOT NULL, -- 'quick_check', 'concept_check', 'application', 'exam_style'
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL, -- 'multiple_choice', 'short_answer', 'true_false', 'fill_blank'
    options TEXT, -- JSON array for MCQ
    correct_answer TEXT NOT NULL,
    explanation TEXT NOT NULL,
    difficulty TEXT DEFAULT 'medium', -- 'easy', 'medium', 'hard'
    points INTEGER DEFAULT 1,
    order_index INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (lesson_id) REFERENCES revision_lessons(id) ON DELETE CASCADE
);

-- Source: migrations/085_ai_revision_classroom.sql
CREATE TABLE IF NOT EXISTS revision_ai_interactions (
    id TEXT PRIMARY KEY,
    lesson_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    interaction_type TEXT NOT NULL, -- 'teaching', 'question', 'clarification', 'encouragement', 'summary'
    ai_message TEXT NOT NULL,
    user_response TEXT,
    sentiment TEXT, -- 'confused', 'understanding', 'confident', 'struggling'
    tokens_used INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (lesson_id) REFERENCES revision_lessons(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Source: migrations/086_multiplayer_study_rooms.sql
CREATE TABLE IF NOT EXISTS voice_interactions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  session_id TEXT, -- Optional: if part of study session
  lesson_id TEXT, -- Optional: if part of revision classroom

  -- Audio Input
  audio_input_url TEXT,
  audio_input_duration_seconds REAL,

  -- Speech-to-Text
  stt_transcript TEXT,
  stt_confidence REAL,
  stt_provider TEXT, -- 'web_speech', 'whisper', 'deepgram'
  stt_processing_ms INTEGER,

  -- AI Response
  ai_response_text TEXT,
  ai_response_tokens INTEGER,
  ai_processing_ms INTEGER,

  -- Text-to-Speech
  audio_output_url TEXT,
  audio_output_duration_seconds REAL,
  tts_provider TEXT, -- 'web_speech', 'elevenlabs', 'openai'
  tts_voice_id TEXT,

  -- Metadata
  interaction_type TEXT DEFAULT 'question', -- 'question', 'answer', 'clarification', 'continuation'
  context_messages TEXT, -- JSON array of previous messages for context

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES study_sessions(id) ON DELETE SET NULL,
  FOREIGN KEY (lesson_id) REFERENCES revision_lessons(id) ON DELETE SET NULL
);

-- Source: migrations/086_multiplayer_study_rooms.sql
CREATE TABLE IF NOT EXISTS whiteboard_student_annotations (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  whiteboard_step INTEGER NOT NULL, -- Which step of the AI lesson

  -- Annotation Data
  annotation_type TEXT NOT NULL, -- 'highlight', 'circle', 'question_mark', 'checkmark', 'freehand', 'text_note'
  annotation_data TEXT NOT NULL, -- JSON Fabric.js object

  -- AI Response (if AI acknowledged the annotation)
  ai_acknowledged INTEGER DEFAULT 0,
  ai_response TEXT,

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (lesson_id) REFERENCES revision_lessons(id) ON DELETE CASCADE
);

-- Source: migrations/087_tutor_ai_classroom_integration.sql
CREATE TABLE IF NOT EXISTS tutor_classroom_events (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  ai_session_id TEXT NOT NULL REFERENCES ai_classroom_sessions(id) ON DELETE CASCADE,
  tutor_id TEXT REFERENCES users(id),
  student_id TEXT REFERENCES users(id),

  -- Event details
  event_type TEXT NOT NULL,
  -- Types: observe_start, observe_end, handoff_suggest, handoff_request, handoff_accept,
  --        handoff_decline, co_teach_start, takeover_start, message_sent, annotation_added,
  --        encouragement_sent, ai_guidance_sent, mode_change, session_end

  event_data TEXT, -- JSON payload with event-specific data

  -- For messages/annotations
  content TEXT,
  content_type TEXT, -- text, voice_transcript, whiteboard_annotation, ai_prompt, encouragement

  -- For annotations
  annotation_type TEXT, -- highlight, circle, arrow, text_note, correction, star, checkmark
  annotation_data TEXT, -- JSON Fabric.js object
  annotation_color TEXT DEFAULT '#10b981', -- Tutor color (emerald)

  -- Visibility
  is_visible_to_student INTEGER DEFAULT 1,

  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Source: migrations/087_tutor_ai_classroom_integration.sql
CREATE TABLE IF NOT EXISTS tutor_observations (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tutor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ai_session_id TEXT NOT NULL REFERENCES ai_classroom_sessions(id) ON DELETE CASCADE,

  -- Observation state
  is_active INTEGER DEFAULT 1,
  started_at TEXT DEFAULT CURRENT_TIMESTAMP,
  ended_at TEXT,

  -- Last sync point (for polling)
  last_event_id TEXT,
  last_poll_at TEXT DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(tutor_id, ai_session_id)
);

-- Source: migrations/087_tutor_ai_classroom_integration.sql
CREATE TABLE IF NOT EXISTS scheduled_classroom_sessions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),

  -- Link to tutoring marketplace session (optional, extends it)
  tutoring_session_id TEXT REFERENCES tutoring_sessions(id) ON DELETE SET NULL,

  -- Participants
  tutor_id TEXT NOT NULL REFERENCES users(id),
  student_id TEXT NOT NULL REFERENCES users(id),

  -- Session details
  subject_id TEXT REFERENCES subjects(id),
  subject_name TEXT,
  topic_id TEXT REFERENCES topics(id),
  topic_name TEXT,
  exam_type TEXT,
  title TEXT,
  description TEXT,
  objectives TEXT, -- JSON array of learning objectives

  -- Scheduling
  scheduled_datetime TEXT NOT NULL,
  scheduled_duration_minutes INTEGER DEFAULT 60,
  timezone TEXT DEFAULT 'Africa/Accra',

  -- Join info
  room_code TEXT UNIQUE,
  join_url TEXT,

  -- AI co-pilot settings
  ai_copilot_enabled INTEGER DEFAULT 1,
  ai_copilot_mode TEXT DEFAULT 'assistant', -- assistant (suggests), silent (only when asked), disabled

  -- Features
  whiteboard_enabled INTEGER DEFAULT 1,
  voice_enabled INTEGER DEFAULT 1,
  recording_enabled INTEGER DEFAULT 0,
  screen_share_enabled INTEGER DEFAULT 1,

  -- Reminders
  reminder_24h_sent INTEGER DEFAULT 0,
  reminder_1h_sent INTEGER DEFAULT 0,
  reminder_15m_sent INTEGER DEFAULT 0,

  -- Status
  status TEXT DEFAULT 'scheduled', -- scheduled, waiting, active, completed, cancelled, no_show
  started_at TEXT,
  ended_at TEXT,
  actual_duration_minutes INTEGER,

  -- Session notes
  tutor_notes TEXT,
  session_summary TEXT,
  homework_assigned TEXT,

  -- AI assistance metrics (for tutor/student review)
  ai_suggestions_given INTEGER DEFAULT 0,
  ai_explanations_requested INTEGER DEFAULT 0,
  ai_problems_generated INTEGER DEFAULT 0,

  -- Rating (post-session)
  student_rating INTEGER, -- 1-5
  student_feedback TEXT,

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Source: schema.sql
CREATE TABLE IF NOT EXISTS essay_questions (
    id TEXT PRIMARY KEY,
    question_id TEXT UNIQUE NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    word_limit_min INTEGER,
    word_limit_max INTEGER,
    requires_introduction INTEGER DEFAULT 1,
    requires_conclusion INTEGER DEFAULT 1,
    marking_scheme TEXT NOT NULL,
    model_answer TEXT,
    marking_rubric TEXT,
    required_points TEXT,
    optional_points TEXT,
    ai_grading_enabled INTEGER DEFAULT 0,
    sample_answer_excellent TEXT,
    sample_answer_good TEXT,
    sample_answer_poor TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Source: schema.sql
CREATE TABLE IF NOT EXISTS essay_attempts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    paper_attempt_id TEXT REFERENCES paper_attempts(id) ON DELETE SET NULL,
    answer_text TEXT NOT NULL,
    word_count INTEGER,
    time_taken INTEGER,
    grading_type TEXT CHECK (grading_type IN ('ai', 'manual', 'self', 'peer')),
    grading_status TEXT DEFAULT 'pending' CHECK (grading_status IN ('pending', 'grading', 'completed', 'failed')),
    ai_score INTEGER,
    ai_feedback TEXT,
    ai_criteria_scores TEXT,
    ai_graded_at TEXT,
    ai_model_used TEXT,
    ai_confidence REAL,
    manual_score INTEGER,
    manual_feedback TEXT,
    graded_by TEXT REFERENCES users(id),
    manually_graded_at TEXT,
    final_score INTEGER,
    marks_earned REAL,
    is_premium_graded INTEGER DEFAULT 0,
    flagged_for_review INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    -- added by migrations/020_add_demo_data_isolation_extended.sql
    is_demo_data INTEGER DEFAULT 0,
    -- added by migrations/020_add_demo_data_isolation_extended.sql
    expires_at TEXT
);

-- Source: schema.sql
CREATE TABLE IF NOT EXISTS paper_attempt_answers (
    id TEXT PRIMARY KEY,
    paper_attempt_id TEXT NOT NULL REFERENCES paper_attempts(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    user_answer TEXT,
    is_correct INTEGER,
    time_taken INTEGER,
    marks_earned INTEGER DEFAULT 0,
    answered_at TEXT DEFAULT (datetime('now')),
    -- added by migrations/020_add_demo_data_isolation_extended.sql
    is_demo_data INTEGER DEFAULT 0,

    -- added by migrations/020_add_demo_data_isolation_extended.sql
    expires_at TEXT,


    UNIQUE(paper_attempt_id, question_id)
);

-- Source: schema.sql
CREATE TABLE IF NOT EXISTS structured_question_parts (
    id TEXT PRIMARY KEY,
    question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    part_label TEXT NOT NULL,
    part_text TEXT NOT NULL,
    marks INTEGER NOT NULL DEFAULT 1,
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    answer_type TEXT DEFAULT 'text' CHECK (answer_type IN ('text', 'calculation', 'diagram', 'table', 'graph')),
    display_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Source: schema.sql
CREATE TABLE IF NOT EXISTS question_attempts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    user_answer TEXT NOT NULL,
    is_correct INTEGER NOT NULL, -- 0 or 1
    time_taken INTEGER NOT NULL, -- seconds
    points_earned INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    -- added by migrations/019_add_demo_data_isolation.sql
    is_demo_data INTEGER DEFAULT 0,
    -- added by migrations/019_add_demo_data_isolation.sql
    expires_at TEXT
);

-- Source: migrations/004_add_assessment_system.sql
CREATE TABLE IF NOT EXISTS assessment_questions (
    id TEXT PRIMARY KEY,
    assessment_id TEXT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    question_id TEXT REFERENCES questions(id) ON DELETE SET NULL, -- null if custom question

    -- Custom question data (if not linked to existing question)
    custom_question_text TEXT,
    custom_question_type TEXT CHECK (custom_question_type IS NULL OR custom_question_type IN (
        'multiple_choice', 'true_false', 'direct_answer', 'essay', 'short_answer', 'calculation'
    )),
    custom_options TEXT, -- JSON array for multiple choice options
    custom_correct_answer TEXT,
    custom_explanation TEXT,
    custom_image_url TEXT,

    -- Question configuration
    marks INTEGER NOT NULL DEFAULT 1,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_required INTEGER DEFAULT 1,

    created_at TEXT DEFAULT (datetime('now'))
);

-- Source: migrations/013_add_ai_tutor.sql
CREATE TABLE IF NOT EXISTS tutor_messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'chat', -- 'chat', 'explanation', 'hint', 'step_by_step'
    question_id TEXT, -- Reference to question being discussed
    hint_level INTEGER, -- 1, 2, or 3 for progressive hints
    tokens_used INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    -- added by migrations/020_add_demo_data_isolation_extended.sql
    is_demo_data INTEGER DEFAULT 0,

    -- added by migrations/020_add_demo_data_isolation_extended.sql
    expires_at TEXT,


    FOREIGN KEY (conversation_id) REFERENCES tutor_conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id)
);

-- Source: migrations/027_teacher_bonus_tutoring.sql
CREATE TABLE IF NOT EXISTS review_helpful_votes (
  id TEXT PRIMARY KEY,
  review_id TEXT NOT NULL REFERENCES teacher_reviews(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(review_id, user_id)
);

-- Source: migrations/062_engagement_features.sql
CREATE TABLE IF NOT EXISTS brain_teasers (
    id TEXT PRIMARY KEY,
    question_id TEXT NOT NULL REFERENCES questions(id),
    hint_1 TEXT,
    hint_2 TEXT,
    hint_3 TEXT,
    base_xp INTEGER DEFAULT 50,
    hint_penalty INTEGER DEFAULT 10, -- XP deducted per hint used
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Source: migrations/085_ai_revision_classroom.sql
CREATE TABLE IF NOT EXISTS checkpoint_responses (
    id TEXT PRIMARY KEY,
    checkpoint_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    user_answer TEXT NOT NULL,
    is_correct INTEGER NOT NULL,
    time_taken_seconds INTEGER,
    ai_feedback TEXT, -- Personalized feedback from AI
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (checkpoint_id) REFERENCES revision_checkpoints(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES revision_sessions(id) ON DELETE CASCADE
);

-- Source: migrations/087_tutor_ai_classroom_integration.sql
CREATE TABLE IF NOT EXISTS session_ai_interactions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  scheduled_session_id TEXT NOT NULL REFERENCES scheduled_classroom_sessions(id) ON DELETE CASCADE,

  -- Who requested
  requested_by TEXT NOT NULL, -- tutor_id or student_id
  requester_role TEXT NOT NULL, -- tutor, student

  -- Request details
  request_type TEXT NOT NULL, -- explain_concept, generate_problem, check_answer, provide_hint, summarize, suggest_next
  request_context TEXT, -- JSON with topic, difficulty, etc.
  request_prompt TEXT,

  -- AI response
  ai_response TEXT,
  response_type TEXT, -- text, whiteboard_content, problem_set

  -- Usage
  was_helpful INTEGER, -- 1 = yes, 0 = no, null = not rated

  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Source: migrations/004_add_assessment_system.sql
CREATE TABLE IF NOT EXISTS assessment_attempt_answers (
    id TEXT PRIMARY KEY,
    attempt_id TEXT NOT NULL REFERENCES assessment_attempts(id) ON DELETE CASCADE,
    assessment_question_id TEXT NOT NULL REFERENCES assessment_questions(id) ON DELETE CASCADE,

    -- Answer data
    answer_text TEXT,
    answer_options TEXT, -- JSON array for multiple selection

    -- Auto-grading
    is_correct INTEGER, -- null for essay/short answer
    auto_marks INTEGER DEFAULT 0,

    -- Manual grading
    manual_marks INTEGER,
    teacher_comment TEXT,
    graded_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    graded_at TEXT,

    -- Timing
    time_taken INTEGER, -- seconds spent on this question
    answered_at TEXT DEFAULT (datetime('now')),

    -- added by migrations/020_add_demo_data_isolation_extended.sql
    is_demo_data INTEGER DEFAULT 0,


    -- added by migrations/020_add_demo_data_isolation_extended.sql
    expires_at TEXT,



    UNIQUE(attempt_id, assessment_question_id)
);

-- Source: migrations/013_add_ai_tutor.sql
CREATE TABLE IF NOT EXISTS tutor_feedback (
    id TEXT PRIMARY KEY,
    message_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback_type TEXT, -- 'helpful', 'not_helpful', 'incorrect', 'confusing', 'too_long', 'too_short'
    feedback_text TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    -- added by migrations/020_add_demo_data_isolation_extended.sql
    is_demo_data INTEGER DEFAULT 0,

    -- added by migrations/020_add_demo_data_isolation_extended.sql
    expires_at TEXT,


    FOREIGN KEY (message_id) REFERENCES tutor_messages(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_houses_default ON houses(is_default);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created ON login_attempts(created_at);
CREATE INDEX IF NOT EXISTS idx_counselor_resources_type ON counselor_resources(counselor_type);
CREATE INDEX IF NOT EXISTS idx_subject_categories_exam ON subject_categories(exam_type_id);
CREATE INDEX IF NOT EXISTS idx_paper_types_exam ON paper_types(exam_type_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_challenges_type ON affiliate_challenges(challenge_type);
CREATE INDEX IF NOT EXISTS idx_affiliate_challenges_active ON affiliate_challenges(is_active);
CREATE INDEX IF NOT EXISTS idx_school_standings_period ON school_affiliate_standings(period, period_value);
CREATE INDEX IF NOT EXISTS idx_school_standings_rank ON school_affiliate_standings(rank);
CREATE INDEX IF NOT EXISTS idx_affiliate_campaigns_active ON affiliate_campaigns(is_active);
CREATE INDEX IF NOT EXISTS idx_affiliate_campaigns_dates ON affiliate_campaigns(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup
ON rate_limits(identifier, endpoint, window_start);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window
ON rate_limits(window_start);
CREATE INDEX IF NOT EXISTS idx_events_active ON seasonal_events(is_active, start_date);
CREATE INDEX IF NOT EXISTS idx_cosmetics_type ON cosmetics(cosmetic_type, rarity);
CREATE INDEX IF NOT EXISTS idx_daily_usage_user_date ON daily_usage(user_id, usage_date);
CREATE INDEX IF NOT EXISTS idx_daily_usage_date ON daily_usage(usage_date);
CREATE INDEX IF NOT EXISTS idx_oauth_state ON oauth_states(state);
CREATE INDEX IF NOT EXISTS idx_oauth_state_expires ON oauth_states(expires_at);
CREATE INDEX IF NOT EXISTS idx_exam_boards_code ON exam_boards(code);
CREATE INDEX IF NOT EXISTS idx_exam_boards_active ON exam_boards(is_active);
CREATE INDEX IF NOT EXISTS idx_house_standings_period ON house_standings(period, period_value);
CREATE INDEX IF NOT EXISTS idx_exam_types_active ON exam_types(is_active);
CREATE INDEX IF NOT EXISTS idx_command_words_word ON command_words(word);
CREATE INDEX IF NOT EXISTS idx_command_words_board ON command_words(exam_board_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_demo ON users(is_demo);
CREATE INDEX IF NOT EXISTS idx_users_selected_tier ON users(selected_tier_id);
CREATE INDEX IF NOT EXISTS idx_subjects_exam_type ON subjects(exam_type_id);
CREATE INDEX IF NOT EXISTS idx_subjects_category ON subjects(category_id);
CREATE INDEX IF NOT EXISTS idx_subjects_active ON subjects(is_active);
CREATE INDEX IF NOT EXISTS idx_user_exam_prefs_user ON user_exam_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_exam_prefs_primary ON user_exam_preferences(is_primary);
CREATE INDEX IF NOT EXISTS idx_user_subject_sel_user ON user_subject_selections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subject_sel_exam ON user_subject_selections(exam_type_id);
CREATE INDEX IF NOT EXISTS idx_ai_grading_limits_user ON ai_grading_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_topics_subject ON topics(subject_id);
CREATE INDEX IF NOT EXISTS idx_topics_parent ON topics(parent_id);
CREATE INDEX IF NOT EXISTS idx_riddles_subject ON riddles(subject_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_period ON leaderboard(period);
CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard(score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_demo ON leaderboard(is_demo_data, expires_at);
CREATE INDEX IF NOT EXISTS idx_house_points_house ON house_points(house_id);
CREATE INDEX IF NOT EXISTS idx_house_points_user ON house_points(user_id);
CREATE INDEX IF NOT EXISTS idx_house_points_period ON house_points(period);
CREATE INDEX IF NOT EXISTS idx_battles_status ON battles(status);
CREATE INDEX IF NOT EXISTS idx_battles_challenger ON battles(challenger_id);
CREATE INDEX IF NOT EXISTS idx_battles_opponent ON battles(opponent_id);
CREATE INDEX IF NOT EXISTS idx_chat_teacher_assignments_teacher ON chat_teacher_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_chat_teacher_assignments_subject ON chat_teacher_assignments(subject_id);
CREATE INDEX IF NOT EXISTS idx_parent_links_parent ON parent_student_links(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_links_student ON parent_student_links(student_id);
CREATE INDEX IF NOT EXISTS idx_parent_links_code ON parent_student_links(invite_code);
CREATE INDEX IF NOT EXISTS idx_parent_links_status ON parent_student_links(status);
CREATE INDEX IF NOT EXISTS idx_parent_links_active ON parent_student_links(status, student_opted_out);
CREATE INDEX IF NOT EXISTS idx_parent_links_access ON parent_student_links(parent_id, student_id, status, student_opted_out);
CREATE INDEX IF NOT EXISTS idx_parent_notifications_parent ON parent_notifications(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_notifications_student ON parent_notifications(student_id);
CREATE INDEX IF NOT EXISTS idx_parent_notifications_unread ON parent_notifications(parent_id, is_read);
CREATE INDEX IF NOT EXISTS idx_parent_notifications_type ON parent_notifications(type);
CREATE INDEX IF NOT EXISTS idx_parent_notifications_created ON parent_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_parent_notifications_demo ON parent_notifications(is_demo_data, expires_at);
CREATE INDEX IF NOT EXISTS idx_parent_activity_parent ON parent_activity_log(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_activity_student ON parent_activity_log(student_id);
CREATE INDEX IF NOT EXISTS idx_parent_activity_created ON parent_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_parent_activity_log_demo ON parent_activity_log(is_demo_data, expires_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_category ON audit_log(action_category);
CREATE INDEX IF NOT EXISTS idx_audit_log_target ON audit_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_status ON audit_log(status);
CREATE INDEX IF NOT EXISTS idx_audit_log_ip ON audit_log(ip_address);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_user ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_unresolved ON security_events(is_resolved, severity);
CREATE INDEX IF NOT EXISTS idx_security_events_created ON security_events(created_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_data_change_table ON data_change_log(table_name);
CREATE INDEX IF NOT EXISTS idx_data_change_record ON data_change_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_data_change_user ON data_change_log(changed_by);
CREATE INDEX IF NOT EXISTS idx_data_change_created ON data_change_log(created_at);
CREATE INDEX IF NOT EXISTS idx_classes_teacher ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_active ON classes(is_active);
CREATE INDEX IF NOT EXISTS idx_classes_subject ON classes(subject_id);
CREATE INDEX IF NOT EXISTS idx_classes_level ON classes(school_level, year_group);
CREATE INDEX IF NOT EXISTS idx_assessments_teacher ON assessments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assessments_status ON assessments(status);
CREATE INDEX IF NOT EXISTS idx_assessments_type ON assessments(assessment_type);
CREATE INDEX IF NOT EXISTS idx_assessments_dates ON assessments(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_assessments_subject ON assessments(subject_id);
CREATE INDEX IF NOT EXISTS idx_assessments_teacher_status ON assessments(teacher_id, status);
CREATE INDEX IF NOT EXISTS idx_assessment_templates_teacher ON assessment_templates(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assessment_templates_type ON assessment_templates(assessment_type);
CREATE INDEX IF NOT EXISTS idx_assessment_templates_shared ON assessment_templates(is_shared);
CREATE INDEX IF NOT EXISTS idx_streak_protection_log_user ON streak_protection_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_streak_milestones_user ON user_streak_milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_user ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend ON friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friend_challenges_challenger ON friend_challenges(challenger_id);
CREATE INDEX IF NOT EXISTS idx_friend_challenges_challenged ON friend_challenges(challenged_id);
CREATE INDEX IF NOT EXISTS idx_xp_events_active ON xp_events(is_active, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_study_groups_owner ON study_groups(owner_id);
CREATE INDEX IF NOT EXISTS idx_library_collections_owner ON library_collections(owner_id);
CREATE INDEX IF NOT EXISTS idx_counselor_conversations_user ON counselor_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_counselor_conversations_type ON counselor_conversations(counselor_type);
CREATE INDEX IF NOT EXISTS idx_counselor_conversations_status ON counselor_conversations(status);
CREATE INDEX IF NOT EXISTS idx_counselor_conversations_demo ON counselor_conversations(is_demo_data, expires_at);
CREATE INDEX IF NOT EXISTS idx_wellbeing_logs_user ON wellbeing_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_wellbeing_logs_date ON wellbeing_logs(log_date);
CREATE INDEX IF NOT EXISTS idx_wellbeing_logs_demo ON wellbeing_logs(is_demo_data, expires_at);
CREATE INDEX IF NOT EXISTS idx_counselor_reports_student ON counselor_reports(student_id);
CREATE INDEX IF NOT EXISTS idx_counselor_reports_status ON counselor_reports(status);
CREATE INDEX IF NOT EXISTS idx_counselor_reports_period ON counselor_reports(report_period_start, report_period_end);
CREATE INDEX IF NOT EXISTS idx_student_parent_links_student ON student_parent_links(student_id);
CREATE INDEX IF NOT EXISTS idx_student_parent_links_parent ON student_parent_links(parent_id);
CREATE INDEX IF NOT EXISTS idx_wellbeing_alerts_student ON wellbeing_alerts(student_id);
CREATE INDEX IF NOT EXISTS idx_wellbeing_alerts_unresolved ON wellbeing_alerts(is_resolved, severity);
CREATE INDEX IF NOT EXISTS idx_wellbeing_alerts_demo ON wellbeing_alerts(is_demo_data, expires_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_demo ON notifications(is_demo_data, expires_at);
CREATE INDEX IF NOT EXISTS idx_streak_history_user ON streak_history(user_id);
CREATE INDEX IF NOT EXISTS idx_streak_history_date ON streak_history(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_user ON xp_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_created ON xp_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tutor_usage_user_date ON tutor_usage_stats(user_id, date);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_type ON chat_rooms(type);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_subject ON chat_rooms(subject_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_exam_type ON chat_rooms(exam_type_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_created_by ON chat_rooms(created_by);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_archived ON chat_rooms(is_archived);
CREATE INDEX IF NOT EXISTS idx_chat_user_blocks_blocker ON chat_user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_chat_user_blocks_blocked ON chat_user_blocks(blocked_id);
CREATE INDEX IF NOT EXISTS idx_chat_blocks_blocker ON chat_user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_chat_blocks_blocked ON chat_user_blocks(blocked_id);
CREATE INDEX IF NOT EXISTS idx_filtered_words_active ON chat_filtered_words(is_active);
CREATE INDEX IF NOT EXISTS idx_audit_log_moderator ON moderation_audit_log(moderator_id);
CREATE INDEX IF NOT EXISTS idx_report_schedules_student ON report_schedules(student_id);
CREATE INDEX IF NOT EXISTS idx_report_schedules_parent ON report_schedules(parent_id);
CREATE INDEX IF NOT EXISTS idx_report_schedules_next ON report_schedules(next_scheduled_at);
CREATE INDEX IF NOT EXISTS idx_report_schedules_active ON report_schedules(is_active);
CREATE INDEX IF NOT EXISTS idx_reminder_settings_user ON reminder_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_reminder_settings_enabled ON reminder_settings(enabled);
CREATE INDEX IF NOT EXISTS idx_reminder_history_user ON reminder_history(user_id);
CREATE INDEX IF NOT EXISTS idx_reminder_history_type ON reminder_history(reminder_type);
CREATE INDEX IF NOT EXISTS idx_reminder_history_sent ON reminder_history(sent_at);
CREATE INDEX IF NOT EXISTS idx_user_trials_user ON user_trials(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_reconcile
ON payment_transactions(status, reconciliation_checked_at, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_affiliate_commissions_transaction_unique
ON affiliate_commissions(transaction_id)
WHERE transaction_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payment_webhook_receipts_transaction
ON payment_webhook_receipts(transaction_reference, event_type);

CREATE INDEX IF NOT EXISTS idx_user_trials_status ON user_trials(status);
CREATE INDEX IF NOT EXISTS idx_user_trials_expires ON user_trials(expires_at);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_reference ON payment_transactions(reference);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_profiles_user ON affiliate_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_profiles_code ON affiliate_profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_profiles_tier ON affiliate_profiles(tier_id);
CREATE INDEX IF NOT EXISTS idx_user_affiliate_challenges_user ON user_affiliate_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_affiliate_challenges_status ON user_affiliate_challenges(status);
CREATE INDEX IF NOT EXISTS idx_user_affiliate_achievements_user ON user_affiliate_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_whiteboard_recordings_teacher ON whiteboard_recordings(teacher_id);
CREATE INDEX IF NOT EXISTS idx_whiteboard_recordings_status ON whiteboard_recordings(status);
CREATE INDEX IF NOT EXISTS idx_whiteboard_recordings_created ON whiteboard_recordings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whiteboard_recordings_subject ON whiteboard_recordings(subject_id);
CREATE INDEX IF NOT EXISTS idx_whiteboards_user_id ON whiteboards(user_id);
CREATE INDEX IF NOT EXISTS idx_whiteboards_status ON whiteboards(status);
CREATE INDEX IF NOT EXISTS idx_whiteboards_updated_at ON whiteboards(updated_at);
CREATE INDEX IF NOT EXISTS idx_directory_profiles_teacher ON teacher_directory_profiles(teacher_id);
CREATE INDEX IF NOT EXISTS idx_directory_profiles_status ON teacher_directory_profiles(directory_status);
CREATE INDEX IF NOT EXISTS idx_directory_profiles_visible ON teacher_directory_profiles(is_visible);
CREATE INDEX IF NOT EXISTS idx_directory_profiles_featured ON teacher_directory_profiles(is_featured);
CREATE INDEX IF NOT EXISTS idx_directory_profiles_rating ON teacher_directory_profiles(average_rating DESC);
CREATE INDEX IF NOT EXISTS idx_directory_profiles_sessions ON teacher_directory_profiles(total_sessions DESC);
CREATE INDEX IF NOT EXISTS idx_teacher_earnings_teacher ON teacher_earnings(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_earnings_balance ON teacher_earnings(available_balance DESC);
CREATE INDEX IF NOT EXISTS idx_daily_challenges_date ON daily_challenges(date);
CREATE INDEX IF NOT EXISTS idx_quick_play_user ON quick_play_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_quick_play_date ON quick_play_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_subject_streaks_user ON subject_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_subject_streaks_subject ON subject_streaks(subject_id);
CREATE INDEX IF NOT EXISTS idx_exam_readiness_user ON exam_readiness(user_id);
CREATE INDEX IF NOT EXISTS idx_study_plans_user ON study_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_user ON activity_feed(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_type ON activity_feed(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created ON activity_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_event_progress ON user_event_progress(user_id, event_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status, start_date);
CREATE INDEX IF NOT EXISTS idx_user_cosmetics ON user_cosmetics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_cosmetics_equipped ON user_cosmetics(user_id, is_equipped);
CREATE INDEX IF NOT EXISTS idx_daily_multipliers_user ON daily_multipliers(user_id, date);
CREATE INDEX IF NOT EXISTS idx_mystery_chests_user ON mystery_chests(user_id, status);
CREATE INDEX IF NOT EXISTS idx_lucky_wheel_user ON lucky_wheel_spins(user_id, spin_date);
CREATE INDEX IF NOT EXISTS idx_comeback_challenges_user ON comeback_challenges(user_id, status);
CREATE INDEX IF NOT EXISTS idx_engagement_nudges_user ON engagement_nudges(user_id, dismissed);
CREATE INDEX IF NOT EXISTS idx_engagement_metrics_risk ON user_engagement_metrics(risk_level);
CREATE INDEX IF NOT EXISTS idx_oauth_provider_lookup ON user_oauth_providers(provider, provider_user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_user_id ON user_oauth_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_specifications_board ON subject_specifications(exam_board_id);
CREATE INDEX IF NOT EXISTS idx_specifications_subject ON subject_specifications(subject_id);
CREATE INDEX IF NOT EXISTS idx_specifications_exam_type ON subject_specifications(exam_type_id);
CREATE INDEX IF NOT EXISTS idx_specifications_code ON subject_specifications(syllabus_code);
CREATE INDEX IF NOT EXISTS idx_specifications_active ON subject_specifications(is_active);
CREATE INDEX IF NOT EXISTS idx_revision_schedules_user ON revision_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_tutor_availability_online
  ON tutor_availability(is_online, accepting_handoffs);
CREATE INDEX IF NOT EXISTS idx_tutor_availability_tutor
  ON tutor_availability(tutor_id);
CREATE INDEX IF NOT EXISTS idx_race_cycles_status ON race_cycles(status, scope);
CREATE INDEX IF NOT EXISTS idx_referral_code_requests_status ON referral_code_requests(status);
CREATE INDEX IF NOT EXISTS idx_telegram_link_tokens_user ON telegram_link_tokens(user_id, used_at);
CREATE INDEX IF NOT EXISTS idx_user_progress_user ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_topic ON user_progress(topic_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_exam ON user_progress(exam_type_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_demo ON user_progress(is_demo_data, expires_at);
CREATE INDEX IF NOT EXISTS idx_battle_answers_battle ON battle_answers(battle_id);
CREATE INDEX IF NOT EXISTS idx_chat_rate_limits_user ON chat_rate_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_student_mods_user ON chat_student_moderators(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_student_mods_room ON chat_student_moderators(room_id);
CREATE INDEX IF NOT EXISTS idx_class_members_class ON class_members(class_id);
CREATE INDEX IF NOT EXISTS idx_class_members_student ON class_members(student_id);
CREATE INDEX IF NOT EXISTS idx_class_members_active ON class_members(class_id, is_active);
CREATE INDEX IF NOT EXISTS idx_class_members_student_active ON class_members(student_id, is_active, class_id);
CREATE INDEX IF NOT EXISTS idx_assessment_assignments_assessment ON assessment_assignments(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_assignments_student ON assessment_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_assessment_assignments_class ON assessment_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_assessment_assignments_level ON assessment_assignments(school_level, year_group);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_assessment ON assessment_attempts(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_student ON assessment_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_grading ON assessment_attempts(grading_status);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_status ON assessment_attempts(status);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_student_assessment ON assessment_attempts(student_id, assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_demo ON assessment_attempts(is_demo_data, expires_at);
CREATE INDEX IF NOT EXISTS idx_user_quests_user ON user_quests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quests_status ON user_quests(status);
CREATE INDEX IF NOT EXISTS idx_user_quests_expires ON user_quests(expires_at);
CREATE INDEX IF NOT EXISTS idx_quest_completions_user ON quest_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_weekly_challenges_user ON user_weekly_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_study_group_members_group ON study_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_study_group_members_user ON study_group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_library_resources_type ON library_resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_library_resources_subject ON library_resources(subject_id);
CREATE INDEX IF NOT EXISTS idx_library_resources_topic ON library_resources(topic_id);
CREATE INDEX IF NOT EXISTS idx_library_resources_level ON library_resources(school_level);
CREATE INDEX IF NOT EXISTS idx_library_resources_featured ON library_resources(is_featured);
CREATE INDEX IF NOT EXISTS idx_library_resources_active ON library_resources(is_active);
CREATE INDEX IF NOT EXISTS idx_library_resources_demo ON library_resources(is_demo_data, expires_at);
CREATE INDEX IF NOT EXISTS idx_counselor_messages_conversation ON counselor_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_counselor_messages_role ON counselor_messages(role);
CREATE INDEX IF NOT EXISTS idx_counselor_messages_demo ON counselor_messages(is_demo_data, expires_at);
CREATE INDEX IF NOT EXISTS idx_counselor_session_summaries_student ON counselor_session_summaries(student_id);
CREATE INDEX IF NOT EXISTS idx_counselor_session_summaries_date ON counselor_session_summaries(session_date);
CREATE INDEX IF NOT EXISTS idx_tutor_conversations_user ON tutor_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_tutor_conversations_context ON tutor_conversations(context);
CREATE INDEX IF NOT EXISTS idx_tutor_conversations_subject ON tutor_conversations(subject_id);
CREATE INDEX IF NOT EXISTS idx_tutor_conversations_demo ON tutor_conversations(is_demo_data, expires_at);
CREATE INDEX IF NOT EXISTS idx_chat_room_members_room ON chat_room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_room_members_user ON chat_room_members(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_room_members_role ON chat_room_members(role);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_reply ON chat_messages(reply_to_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_deleted ON chat_messages(is_deleted);
CREATE INDEX IF NOT EXISTS idx_chat_messages_demo ON chat_messages(is_demo_data, expires_at);
CREATE INDEX IF NOT EXISTS idx_chat_typing_room ON chat_typing_indicators(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_typing_expires ON chat_typing_indicators(expires_at);
CREATE INDEX IF NOT EXISTS idx_chat_moderation_user ON chat_moderation_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_moderation_room ON chat_moderation_actions(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_moderation_active ON chat_moderation_actions(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_chat_moderation_type ON chat_moderation_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_user ON chat_moderation_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_room ON chat_moderation_actions(room_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_type ON chat_moderation_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_active ON chat_moderation_actions(is_active);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_expires ON chat_moderation_actions(expires_at);
CREATE INDEX IF NOT EXISTS idx_parent_messages_parent ON parent_counselor_messages(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_messages_student ON parent_counselor_messages(student_id);
CREATE INDEX IF NOT EXISTS idx_parent_messages_sender ON parent_counselor_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_parent_messages_report ON parent_counselor_messages(report_id);
CREATE INDEX IF NOT EXISTS idx_parent_messages_created ON parent_counselor_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_report_access_logs_report ON report_access_logs(report_id);
CREATE INDEX IF NOT EXISTS idx_report_access_logs_user ON report_access_logs(accessed_by);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_affiliate ON affiliate_referrals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_referred ON affiliate_referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_status ON affiliate_referrals(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_affiliate ON affiliate_payouts(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_status ON affiliate_payouts(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_affiliate_payouts_transfer_code
ON affiliate_payouts(paystack_transfer_code) WHERE paystack_transfer_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_affiliate ON affiliate_clicks(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_date ON affiliate_clicks(clicked_at);
CREATE INDEX IF NOT EXISTS idx_affiliate_leaderboard_period ON affiliate_leaderboard(period, period_value);
CREATE INDEX IF NOT EXISTS idx_affiliate_leaderboard_rank ON affiliate_leaderboard(rank);
CREATE INDEX IF NOT EXISTS idx_recording_views_recording ON recording_views(recording_id);
CREATE INDEX IF NOT EXISTS idx_recording_views_viewer ON recording_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_recording_shares_token ON recording_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_recording_shares_recording ON recording_shares(recording_id);
CREATE INDEX IF NOT EXISTS idx_whiteboard_collaborators_whiteboard ON whiteboard_collaborators(whiteboard_id);
CREATE INDEX IF NOT EXISTS idx_whiteboard_collaborators_user ON whiteboard_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_tutoring_requests_student ON tutoring_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_tutoring_requests_teacher ON tutoring_requests(teacher_profile_id);
CREATE INDEX IF NOT EXISTS idx_tutoring_requests_status ON tutoring_requests(status);
CREATE INDEX IF NOT EXISTS idx_tutoring_requests_datetime ON tutoring_requests(proposed_datetime);
CREATE INDEX IF NOT EXISTS idx_tutoring_requests_expires ON tutoring_requests(expires_at);
CREATE INDEX IF NOT EXISTS idx_flashcard_decks_user ON flashcard_decks(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_decks_subject ON flashcard_decks(subject_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_decks_topic ON flashcard_decks(topic_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_decks_public ON flashcard_decks(is_public);
CREATE INDEX IF NOT EXISTS idx_learning_rec_user ON learning_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_team_battles_status ON team_battles(status);
CREATE INDEX IF NOT EXISTS idx_paper_components_spec ON paper_components(specification_id);
CREATE INDEX IF NOT EXISTS idx_paper_components_format ON paper_components(question_format);
CREATE INDEX IF NOT EXISTS idx_syllabus_topics_spec ON syllabus_topics(specification_id);
CREATE INDEX IF NOT EXISTS idx_syllabus_topics_parent ON syllabus_topics(parent_id);
CREATE INDEX IF NOT EXISTS idx_syllabus_topics_code ON syllabus_topics(topic_code);
CREATE INDEX IF NOT EXISTS idx_user_targets_user ON user_target_grades(user_id);
CREATE INDEX IF NOT EXISTS idx_user_targets_spec ON user_target_grades(specification_id);
CREATE INDEX IF NOT EXISTS idx_user_targets_session ON user_target_grades(exam_session);
CREATE INDEX IF NOT EXISTS idx_user_spec_sel_user ON user_specification_selections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_spec_sel_spec ON user_specification_selections(specification_id);
CREATE INDEX IF NOT EXISTS idx_user_spec_sel_active ON user_specification_selections(is_active);
CREATE INDEX IF NOT EXISTS idx_revision_sessions_user ON revision_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_revision_sessions_exam ON revision_sessions(exam_type);
CREATE INDEX IF NOT EXISTS idx_revision_sessions_subject ON revision_sessions(subject_id);
CREATE INDEX IF NOT EXISTS idx_revision_sessions_status ON revision_sessions(status);
CREATE INDEX IF NOT EXISTS idx_topic_mastery_user ON topic_mastery(user_id);
CREATE INDEX IF NOT EXISTS idx_topic_mastery_topic ON topic_mastery(topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_mastery_exam ON topic_mastery(exam_type);
CREATE INDEX IF NOT EXISTS idx_exam_board_intelligence_exam ON exam_board_intelligence(exam_type);
CREATE INDEX IF NOT EXISTS idx_revision_achievements_user ON revision_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_owner ON study_sessions(owner_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_status ON study_sessions(status);
CREATE INDEX IF NOT EXISTS idx_study_sessions_room_code ON study_sessions(room_code);
CREATE INDEX IF NOT EXISTS idx_study_sessions_public ON study_sessions(is_public, status);
CREATE INDEX IF NOT EXISTS idx_race_alert_state_cycle ON race_alert_state(cycle_id);
CREATE INDEX IF NOT EXISTS idx_points_ledger_user_day ON points_ledger(user_id, source, created_at);
CREATE INDEX IF NOT EXISTS idx_points_ledger_cycle ON points_ledger(cycle_id);
CREATE INDEX IF NOT EXISTS idx_library_collection_items_collection ON library_collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_library_ratings_resource ON library_ratings(resource_id);
CREATE INDEX IF NOT EXISTS idx_library_ratings_user ON library_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_library_access_logs_resource ON library_access_logs(resource_id);
CREATE INDEX IF NOT EXISTS idx_library_access_logs_user ON library_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_library_progress_user ON library_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_library_progress_resource ON library_progress(resource_id);
CREATE INDEX IF NOT EXISTS idx_counselor_feedback_message ON counselor_feedback(message_id);
CREATE INDEX IF NOT EXISTS idx_counselor_feedback_user ON counselor_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_counselor_feedback_demo ON counselor_feedback(is_demo_data, expires_at);
CREATE INDEX IF NOT EXISTS idx_chat_reactions_message ON chat_message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_reactions_user ON chat_message_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_message_reactions_demo ON chat_message_reactions(is_demo_data, expires_at);
CREATE INDEX IF NOT EXISTS idx_chat_reports_status ON chat_reports(status);
CREATE INDEX IF NOT EXISTS idx_chat_reports_reported ON chat_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_chat_reports_reporter ON chat_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_chat_reports_created ON chat_reports(created_at);
CREATE INDEX IF NOT EXISTS idx_past_papers_exam ON past_papers(exam_type_id);
CREATE INDEX IF NOT EXISTS idx_past_papers_subject ON past_papers(subject_id);
CREATE INDEX IF NOT EXISTS idx_past_papers_paper_type ON past_papers(paper_type_id);
CREATE INDEX IF NOT EXISTS idx_past_papers_year ON past_papers(year DESC);
CREATE INDEX IF NOT EXISTS idx_past_papers_composite ON past_papers(exam_type_id, year DESC, subject_id);
CREATE INDEX IF NOT EXISTS idx_past_papers_board ON past_papers(exam_board_id);
CREATE INDEX IF NOT EXISTS idx_past_papers_spec ON past_papers(specification_id);
CREATE INDEX IF NOT EXISTS idx_past_papers_component ON past_papers(paper_component_id);
CREATE INDEX IF NOT EXISTS idx_past_papers_session ON past_papers(session);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_affiliate ON affiliate_commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_status ON affiliate_commissions(status);
CREATE INDEX IF NOT EXISTS idx_teacher_bonuses_teacher ON teacher_year_end_bonuses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_bonuses_year ON teacher_year_end_bonuses(year);
CREATE INDEX IF NOT EXISTS idx_teacher_bonuses_status ON teacher_year_end_bonuses(status);
CREATE INDEX IF NOT EXISTS idx_tutoring_sessions_student ON tutoring_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_tutoring_sessions_teacher ON tutoring_sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_tutoring_sessions_profile ON tutoring_sessions(teacher_profile_id);
CREATE INDEX IF NOT EXISTS idx_tutoring_sessions_status ON tutoring_sessions(status);
CREATE INDEX IF NOT EXISTS idx_tutoring_sessions_datetime ON tutoring_sessions(scheduled_datetime);
CREATE INDEX IF NOT EXISTS idx_tutoring_sessions_request ON tutoring_sessions(request_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_deck ON flashcards(deck_id);
CREATE INDEX IF NOT EXISTS idx_team_battle_members ON team_battle_members(battle_id, team_number);
CREATE INDEX IF NOT EXISTS idx_team_battle_invites_user ON team_battle_invites(invitee_id, status);
CREATE INDEX IF NOT EXISTS idx_topic_syllabus_map_topic ON topic_syllabus_mapping(topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_syllabus_map_syllabus ON topic_syllabus_mapping(syllabus_topic_id);
CREATE INDEX IF NOT EXISTS idx_grade_boundaries_spec ON grade_boundaries(specification_id);
CREATE INDEX IF NOT EXISTS idx_grade_boundaries_year ON grade_boundaries(year DESC);
CREATE INDEX IF NOT EXISTS idx_grade_boundaries_session ON grade_boundaries(session);
CREATE INDEX IF NOT EXISTS idx_grade_boundaries_grade ON grade_boundaries(grade);
CREATE INDEX IF NOT EXISTS idx_user_syllabus_prog_user ON user_syllabus_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_syllabus_prog_topic ON user_syllabus_progress(syllabus_topic_id);
CREATE INDEX IF NOT EXISTS idx_user_syllabus_prog_status ON user_syllabus_progress(status);
CREATE INDEX IF NOT EXISTS idx_revision_lessons_session ON revision_lessons(session_id);
CREATE INDEX IF NOT EXISTS idx_revision_lessons_topic ON revision_lessons(topic_id);
CREATE INDEX IF NOT EXISTS idx_study_participants_session ON study_session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_study_participants_user ON study_session_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_study_participants_active ON study_session_participants(session_id, is_active);
CREATE INDEX IF NOT EXISTS idx_study_events_session ON study_session_events(session_id);
CREATE INDEX IF NOT EXISTS idx_study_events_sequence ON study_session_events(session_id, sequence_num);
CREATE INDEX IF NOT EXISTS idx_study_messages_session ON study_session_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_study_messages_pinned ON study_session_messages(session_id, is_pinned);
CREATE INDEX IF NOT EXISTS idx_study_drawings_session ON study_session_drawings(session_id);
CREATE INDEX IF NOT EXISTS idx_study_drawings_object ON study_session_drawings(session_id, object_id);
CREATE INDEX IF NOT EXISTS idx_ai_classroom_active
  ON ai_classroom_sessions(is_active, visibility);
CREATE INDEX IF NOT EXISTS idx_ai_classroom_student
  ON ai_classroom_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_ai_classroom_tutor
  ON ai_classroom_sessions(tutor_id);
CREATE INDEX IF NOT EXISTS idx_ai_classroom_struggle
  ON ai_classroom_sessions(struggle_score DESC) WHERE is_active = 1;
CREATE INDEX IF NOT EXISTS idx_ai_classroom_handoff
  ON ai_classroom_sessions(handoff_status) WHERE handoff_status != 'none';
CREATE INDEX IF NOT EXISTS idx_ai_classroom_subject
  ON ai_classroom_sessions(subject_id, exam_type);
CREATE INDEX IF NOT EXISTS idx_paper_attempts_user ON paper_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_paper_attempts_paper ON paper_attempts(paper_id);
CREATE INDEX IF NOT EXISTS idx_paper_attempts_status ON paper_attempts(status);
CREATE INDEX IF NOT EXISTS idx_paper_attempts_demo ON paper_attempts(is_demo_data, expires_at);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_exam ON practice_sessions(exam_type_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_paper ON practice_sessions(past_paper_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_demo ON practice_sessions(is_demo_data, expires_at);
CREATE INDEX IF NOT EXISTS idx_bonus_students_bonus ON teacher_bonus_students(bonus_id);
CREATE INDEX IF NOT EXISTS idx_bonus_students_student ON teacher_bonus_students(student_id);
CREATE INDEX IF NOT EXISTS idx_bonus_students_qualified ON teacher_bonus_students(is_qualified);
CREATE INDEX IF NOT EXISTS idx_teacher_reviews_profile ON teacher_reviews(teacher_profile_id);
CREATE INDEX IF NOT EXISTS idx_teacher_reviews_student ON teacher_reviews(student_id);
CREATE INDEX IF NOT EXISTS idx_teacher_reviews_session ON teacher_reviews(session_id);
CREATE INDEX IF NOT EXISTS idx_teacher_reviews_rating ON teacher_reviews(rating DESC);
CREATE INDEX IF NOT EXISTS idx_teacher_reviews_approved ON teacher_reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_teacher_reviews_flagged ON teacher_reviews(is_flagged);
CREATE UNIQUE INDEX IF NOT EXISTS idx_teacher_reviews_session_unique
ON teacher_reviews(teacher_profile_id, student_id, session_id)
WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tutoring_payments_session ON tutoring_payments(session_id);
CREATE INDEX IF NOT EXISTS idx_tutoring_payments_student ON tutoring_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_tutoring_payments_teacher ON tutoring_payments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_tutoring_payments_status ON tutoring_payments(status);
CREATE INDEX IF NOT EXISTS idx_tutoring_payments_teacher_payout ON tutoring_payments(teacher_payout_status);
CREATE INDEX IF NOT EXISTS idx_tutoring_payments_reference ON tutoring_payments(payment_reference);
CREATE INDEX IF NOT EXISTS idx_session_reminders_session ON session_reminders(session_id);
CREATE INDEX IF NOT EXISTS idx_session_reminders_scheduled ON session_reminders(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_session_reminders_pending ON session_reminders(sent) WHERE sent = 0;
CREATE INDEX IF NOT EXISTS idx_questions_past_paper ON questions(past_paper_id);
CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject_id);
CREATE INDEX IF NOT EXISTS idx_questions_exam_type ON questions(exam_type_id);
CREATE INDEX IF NOT EXISTS idx_questions_syllabus_topic ON questions(syllabus_topic_id);
CREATE INDEX IF NOT EXISTS idx_questions_command_word ON questions(command_word);
CREATE INDEX IF NOT EXISTS idx_questions_ao ON questions(assessment_objective);
CREATE INDEX IF NOT EXISTS idx_questions_board ON questions(exam_board_id);
CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_questions_round ON questions(round_type);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_paper_type ON questions(paper_type_id);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(question_type);
-- Durable question-bank relationship invariants. These prevent future imports
-- from recreating the repaired cross-subject topic or exam mismatches.
CREATE TRIGGER IF NOT EXISTS trg_questions_subject_exam_insert
BEFORE INSERT ON questions
WHEN NEW.exam_type_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM subjects s
    WHERE s.id = NEW.subject_id AND s.exam_type_id IS NEW.exam_type_id
  )
BEGIN
  SELECT RAISE(ABORT, 'QUESTION_SUBJECT_EXAM_MISMATCH');
END;

CREATE TRIGGER IF NOT EXISTS trg_questions_subject_exam_update
BEFORE UPDATE OF subject_id, exam_type_id ON questions
WHEN NEW.exam_type_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM subjects s
    WHERE s.id = NEW.subject_id AND s.exam_type_id IS NEW.exam_type_id
  )
BEGIN
  SELECT RAISE(ABORT, 'QUESTION_SUBJECT_EXAM_MISMATCH');
END;

CREATE TRIGGER IF NOT EXISTS trg_questions_subject_topic_insert
BEFORE INSERT ON questions
WHEN NEW.topic_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM topics t
    WHERE t.id = NEW.topic_id AND t.subject_id = NEW.subject_id
  )
BEGIN
  SELECT RAISE(ABORT, 'QUESTION_SUBJECT_TOPIC_MISMATCH');
END;

CREATE TRIGGER IF NOT EXISTS trg_questions_subject_topic_update
BEFORE UPDATE OF subject_id, topic_id ON questions
WHEN NEW.topic_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM topics t
    WHERE t.id = NEW.topic_id AND t.subject_id = NEW.subject_id
  )
BEGIN
  SELECT RAISE(ABORT, 'QUESTION_SUBJECT_TOPIC_MISMATCH');
END;

CREATE TRIGGER IF NOT EXISTS trg_subject_exam_update_with_questions
BEFORE UPDATE OF exam_type_id ON subjects
WHEN EXISTS (
  SELECT 1 FROM questions q
  WHERE q.subject_id = OLD.id
    AND q.exam_type_id IS NOT NULL
    AND q.exam_type_id IS NOT NEW.exam_type_id
)
BEGIN
  SELECT RAISE(ABORT, 'SUBJECT_EXAM_HAS_MISMATCHED_QUESTIONS');
END;

CREATE TRIGGER IF NOT EXISTS trg_topic_subject_update_with_questions
BEFORE UPDATE OF subject_id ON topics
WHEN EXISTS (
  SELECT 1 FROM questions q
  WHERE q.topic_id = OLD.id AND q.subject_id IS NOT NEW.subject_id
)
BEGIN
  SELECT RAISE(ABORT, 'TOPIC_SUBJECT_HAS_MISMATCHED_QUESTIONS');
END;
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_user ON flashcard_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_next ON flashcard_reviews(user_id, next_review_at);
CREATE INDEX IF NOT EXISTS idx_paper_files_paper ON past_paper_files(past_paper_id);
CREATE INDEX IF NOT EXISTS idx_paper_files_type ON past_paper_files(file_type);
CREATE INDEX IF NOT EXISTS idx_paper_files_premium ON past_paper_files(is_premium);
CREATE INDEX IF NOT EXISTS idx_revision_checkpoints_lesson ON revision_checkpoints(lesson_id);
CREATE INDEX IF NOT EXISTS idx_revision_ai_interactions_lesson ON revision_ai_interactions(lesson_id);
CREATE INDEX IF NOT EXISTS idx_voice_interactions_user ON voice_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_interactions_session ON voice_interactions(session_id);
CREATE INDEX IF NOT EXISTS idx_whiteboard_annotations_lesson ON whiteboard_student_annotations(lesson_id);
CREATE INDEX IF NOT EXISTS idx_whiteboard_annotations_user ON whiteboard_student_annotations(user_id);
CREATE INDEX IF NOT EXISTS idx_tutor_events_session
  ON tutor_classroom_events(ai_session_id);
CREATE INDEX IF NOT EXISTS idx_tutor_events_tutor
  ON tutor_classroom_events(tutor_id);
CREATE INDEX IF NOT EXISTS idx_tutor_events_created
  ON tutor_classroom_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tutor_observations_tutor
  ON tutor_observations(tutor_id, is_active);
CREATE INDEX IF NOT EXISTS idx_tutor_observations_session
  ON tutor_observations(ai_session_id, is_active);
CREATE INDEX IF NOT EXISTS idx_scheduled_classroom_tutor
  ON scheduled_classroom_sessions(tutor_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_classroom_student
  ON scheduled_classroom_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_classroom_datetime
  ON scheduled_classroom_sessions(scheduled_datetime);
CREATE INDEX IF NOT EXISTS idx_scheduled_classroom_status
  ON scheduled_classroom_sessions(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_classroom_room
  ON scheduled_classroom_sessions(room_code);
CREATE INDEX IF NOT EXISTS idx_essay_questions_question ON essay_questions(question_id);
CREATE INDEX IF NOT EXISTS idx_essay_questions_ai ON essay_questions(ai_grading_enabled);
CREATE INDEX IF NOT EXISTS idx_essay_attempts_user ON essay_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_essay_attempts_question ON essay_attempts(question_id);
CREATE INDEX IF NOT EXISTS idx_essay_attempts_status ON essay_attempts(grading_status);
CREATE INDEX IF NOT EXISTS idx_essay_attempts_demo ON essay_attempts(is_demo_data, expires_at);
CREATE INDEX IF NOT EXISTS idx_paper_attempt_answers_attempt ON paper_attempt_answers(paper_attempt_id);
CREATE INDEX IF NOT EXISTS idx_paper_attempt_answers_demo ON paper_attempt_answers(is_demo_data, expires_at);
CREATE INDEX IF NOT EXISTS idx_structured_parts_question ON structured_question_parts(question_id);
CREATE INDEX IF NOT EXISTS idx_question_attempts_user ON question_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_question_attempts_question ON question_attempts(question_id);
CREATE INDEX IF NOT EXISTS idx_question_attempts_demo ON question_attempts(is_demo_data, expires_at);
CREATE INDEX IF NOT EXISTS idx_assessment_questions_assessment ON assessment_questions(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_questions_question ON assessment_questions(question_id);
CREATE INDEX IF NOT EXISTS idx_assessment_questions_order ON assessment_questions(assessment_id, display_order);
CREATE INDEX IF NOT EXISTS idx_tutor_messages_conversation ON tutor_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_tutor_messages_question ON tutor_messages(question_id);
CREATE INDEX IF NOT EXISTS idx_tutor_messages_created ON tutor_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_tutor_messages_demo ON tutor_messages(is_demo_data, expires_at);
CREATE INDEX IF NOT EXISTS idx_review_votes_review ON review_helpful_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_checkpoint_responses_user ON checkpoint_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_session_ai_interactions_session
  ON session_ai_interactions(scheduled_session_id);
CREATE INDEX IF NOT EXISTS idx_attempt_answers_attempt ON assessment_attempt_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_attempt_answers_question ON assessment_attempt_answers(assessment_question_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempt_answers_demo ON assessment_attempt_answers(is_demo_data, expires_at);
CREATE INDEX IF NOT EXISTS idx_tutor_feedback_message ON tutor_feedback(message_id);
CREATE INDEX IF NOT EXISTS idx_tutor_feedback_user ON tutor_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_tutor_feedback_demo ON tutor_feedback(is_demo_data, expires_at);
