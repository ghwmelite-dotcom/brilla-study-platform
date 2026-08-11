-- Migration 061: Add missing past_papers entries
-- These past papers are referenced by questions but don't exist in the past_papers table

-- =============================================
-- BECE Missing Past Papers
-- =============================================

-- BECE RME (Religious and Moral Education)
INSERT OR IGNORE INTO past_papers (id, exam_type_id, subject_id, paper_type_id, year, month, title, total_questions, total_marks, time_allowed, is_complete)
VALUES
  ('pp_bece_rme_2024_1', 'exam_bece', 'subj_bece_rme', 'paper_bece_1', 2024, 'June', 'BECE RME 2024 Paper 1', 40, 40, 45, 1),
  ('pp_bece_rme_2023_1', 'exam_bece', 'subj_bece_rme', 'paper_bece_1', 2023, 'June', 'BECE RME 2023 Paper 1', 40, 40, 45, 1);

-- BECE ICT (Information and Communication Technology)
INSERT OR IGNORE INTO past_papers (id, exam_type_id, subject_id, paper_type_id, year, month, title, total_questions, total_marks, time_allowed, is_complete)
VALUES
  ('pp_bece_ict_2024_1', 'exam_bece', 'subj_bece_ict', 'paper_bece_1', 2024, 'June', 'BECE ICT 2024 Paper 1', 40, 40, 45, 1),
  ('pp_bece_ict_2023_1', 'exam_bece', 'subj_bece_ict', 'paper_bece_1', 2023, 'June', 'BECE ICT 2023 Paper 1', 40, 40, 45, 1);

-- BECE French
INSERT OR IGNORE INTO past_papers (id, exam_type_id, subject_id, paper_type_id, year, month, title, total_questions, total_marks, time_allowed, is_complete)
VALUES
  ('pp_bece_french_2024_1', 'exam_bece', 'subj_bece_french', 'paper_bece_1', 2024, 'June', 'BECE French 2024 Paper 1', 40, 40, 45, 1),
  ('pp_bece_french_2023_1', 'exam_bece', 'subj_bece_french', 'paper_bece_1', 2023, 'June', 'BECE French 2023 Paper 1', 40, 40, 45, 1);

-- BECE BDT (Basic Design and Technology)
INSERT OR IGNORE INTO past_papers (id, exam_type_id, subject_id, paper_type_id, year, month, title, total_questions, total_marks, time_allowed, is_complete)
VALUES
  ('pp_bece_bdt_2024_1', 'exam_bece', 'subj_bece_bdt', 'paper_bece_1', 2024, 'June', 'BECE BDT 2024 Paper 1', 40, 40, 45, 1),
  ('pp_bece_bdt_2023_1', 'exam_bece', 'subj_bece_bdt', 'paper_bece_1', 2023, 'June', 'BECE BDT 2023 Paper 1', 40, 40, 45, 1);

-- =============================================
-- WASSCE Missing Past Papers
-- =============================================

-- WASSCE Economics
INSERT OR IGNORE INTO past_papers (id, exam_type_id, subject_id, paper_type_id, year, month, title, total_questions, total_marks, time_allowed, is_complete)
VALUES
  ('pp_wassce_eco_2024_1', 'exam_wassce', 'subj_wassce_economics', 'paper_wassce_1', 2024, 'May-June', 'WASSCE Economics 2024 Paper 1', 50, 50, 60, 1),
  ('pp_wassce_eco_2023_1', 'exam_wassce', 'subj_wassce_economics', 'paper_wassce_1', 2023, 'May-June', 'WASSCE Economics 2023 Paper 1', 50, 50, 60, 1);

-- WASSCE Government
INSERT OR IGNORE INTO past_papers (id, exam_type_id, subject_id, paper_type_id, year, month, title, total_questions, total_marks, time_allowed, is_complete)
VALUES
  ('pp_wassce_gov_2024_1', 'exam_wassce', 'subj_wassce_government', 'paper_wassce_1', 2024, 'May-June', 'WASSCE Government 2024 Paper 1', 50, 50, 60, 1),
  ('pp_wassce_gov_2023_1', 'exam_wassce', 'subj_wassce_government', 'paper_wassce_1', 2023, 'May-June', 'WASSCE Government 2023 Paper 1', 50, 50, 60, 1);

-- WASSCE Geography
INSERT OR IGNORE INTO past_papers (id, exam_type_id, subject_id, paper_type_id, year, month, title, total_questions, total_marks, time_allowed, is_complete)
VALUES
  ('pp_wassce_geo_2024_1', 'exam_wassce', 'subj_wassce_geography', 'paper_wassce_1', 2024, 'May-June', 'WASSCE Geography 2024 Paper 1', 50, 50, 60, 1),
  ('pp_wassce_geo_2023_1', 'exam_wassce', 'subj_wassce_geography', 'paper_wassce_1', 2023, 'May-June', 'WASSCE Geography 2023 Paper 1', 50, 50, 60, 1);

-- WASSCE Literature in English
INSERT OR IGNORE INTO past_papers (id, exam_type_id, subject_id, paper_type_id, year, month, title, total_questions, total_marks, time_allowed, is_complete)
VALUES
  ('pp_wassce_lit_2024_1', 'exam_wassce', 'subj_wassce_literature', 'paper_wassce_1', 2024, 'May-June', 'WASSCE Literature in English 2024 Paper 1', 50, 50, 60, 1),
  ('pp_wassce_lit_2023_1', 'exam_wassce', 'subj_wassce_literature', 'paper_wassce_1', 2023, 'May-June', 'WASSCE Literature in English 2023 Paper 1', 50, 50, 60, 1);

-- WASSCE Financial Accounting
INSERT OR IGNORE INTO past_papers (id, exam_type_id, subject_id, paper_type_id, year, month, title, total_questions, total_marks, time_allowed, is_complete)
VALUES
  ('pp_wassce_acc_2024_1', 'exam_wassce', 'subj_wassce_accounting', 'paper_wassce_1', 2024, 'May-June', 'WASSCE Financial Accounting 2024 Paper 1', 50, 50, 60, 1),
  ('pp_wassce_acc_2023_1', 'exam_wassce', 'subj_wassce_accounting', 'paper_wassce_1', 2023, 'May-June', 'WASSCE Financial Accounting 2023 Paper 1', 50, 50, 60, 1);

-- WASSCE Christian Religious Studies
INSERT OR IGNORE INTO past_papers (id, exam_type_id, subject_id, paper_type_id, year, month, title, total_questions, total_marks, time_allowed, is_complete)
VALUES
  ('pp_wassce_crs_2024_1', 'exam_wassce', 'subj_wassce_crs', 'paper_wassce_1', 2024, 'May-June', 'WASSCE CRS 2024 Paper 1', 50, 50, 60, 1),
  ('pp_wassce_crs_2023_1', 'exam_wassce', 'subj_wassce_crs', 'paper_wassce_1', 2023, 'May-June', 'WASSCE CRS 2023 Paper 1', 50, 50, 60, 1);

-- WASSCE Elective Mathematics (2023 - using pp_wassce_em_2023_1 format used in questions)
INSERT OR IGNORE INTO past_papers (id, exam_type_id, subject_id, paper_type_id, year, month, title, total_questions, total_marks, time_allowed, is_complete)
VALUES
  ('pp_wassce_em_2023_1', 'exam_wassce', 'subj_wassce_elect_math', 'paper_wassce_1', 2023, 'May-June', 'WASSCE Elective Mathematics 2023 Paper 1', 50, 50, 60, 1);
