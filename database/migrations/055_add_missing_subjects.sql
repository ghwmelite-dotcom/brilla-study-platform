-- Add missing subjects to subjects table
-- These subjects have questions but were not in the subjects table

-- BECE Subjects
INSERT OR IGNORE INTO subjects (id, name, slug, icon, color, description, display_order) VALUES
('subj_bece_rme', 'BECE RME', 'bece-rme', 'Heart', '#EC4899', 'Religious and Moral Education for BECE', 5),
('subj_bece_ict', 'BECE ICT', 'bece-ict', 'Monitor', '#6366F1', 'Information and Communication Technology for BECE', 6),
('subj_bece_french', 'BECE French', 'bece-french', 'Languages', '#F59E0B', 'French Language for BECE', 7),
('subj_bece_bdt', 'BECE BDT', 'bece-bdt', 'Hammer', '#8B5CF6', 'Basic Design and Technology for BECE', 8);

-- WASSCE Subjects
INSERT OR IGNORE INTO subjects (id, name, slug, icon, color, description, display_order) VALUES
('subj_wassce_economics', 'Economics', 'wassce-economics', 'TrendingUp', '#10B981', 'WASSCE Economics - Business/General Arts', 10),
('subj_wassce_government', 'Government', 'wassce-government', 'Building', '#3B82F6', 'WASSCE Government - General Arts', 11),
('subj_wassce_geography', 'Geography', 'wassce-geography', 'Globe', '#F97316', 'WASSCE Geography - General Arts/Science', 12),
('subj_wassce_literature', 'Literature in English', 'wassce-literature', 'BookOpen', '#A855F7', 'WASSCE Literature in English - General Arts', 13),
('subj_wassce_accounting', 'Financial Accounting', 'wassce-accounting', 'Calculator', '#14B8A6', 'WASSCE Financial Accounting - Business', 14),
('subj_wassce_crs', 'Christian Religious Studies', 'wassce-crs', 'Cross', '#EC4899', 'WASSCE Christian Religious Studies', 15);
