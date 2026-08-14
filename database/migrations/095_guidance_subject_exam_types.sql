-- Backfill canonical exam associations used by Counselor Brie.
--
-- Historical production rebuilds retained these subject rows but lost their
-- exam_type_id metadata. The UI catalog still exposes the same canonical IDs,
-- so guidance validation correctly failed closed. Keep this repair explicit
-- and idempotent: only known UI subjects with a NULL association are updated.

UPDATE subjects
SET exam_type_id = 'exam_wassce'
WHERE exam_type_id IS NULL
  AND id IN (
    'subj_wassce_english',
    'subj_wassce_core_math',
    'subj_wassce_int_science',
    'subj_wassce_social',
    'subj_wassce_physics',
    'subj_wassce_chemistry',
    'subj_wassce_biology',
    'subj_wassce_elect_math',
    'subj_wassce_accounting',
    'subj_wassce_economics',
    'subj_wassce_bus_mgmt',
    'subj_wassce_cost_accounting',
    'subj_wassce_literature',
    'subj_wassce_government',
    'subj_wassce_history',
    'subj_wassce_geography',
    'subj_wassce_crs',
    'subj_wassce_ict',
    'subj_wassce_tech_drawing',
    'subj_wassce_foods',
    'subj_wassce_french',
    'subj_wassce_twi'
  );

UPDATE subjects
SET exam_type_id = 'exam_bece'
WHERE exam_type_id IS NULL
  AND id IN (
    'subj_bece_english',
    'subj_bece_math',
    'subj_bece_science',
    'subj_bece_social',
    'subj_bece_rme',
    'subj_bece_bdt',
    'subj_bece_ict',
    'subj_bece_french',
    'subj_bece_gh_lang'
  );