-- Prod patch 095: give NSMQ + WASSCE science/math subjects their topic lists.
-- The canonical topics were seeded under legacy subject ids (subj_math,
-- subj_chemistry, subj_physics, subj_biology) which the frontend no longer
-- uses; the current subjects (subj_nsmq_*, subj_wassce_*) had zero topics,
-- so revision sessions for them had empty lesson plans. Cloned with new
-- topic ids; the legacy rows are untouched (questions reference them).

INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at)
SELECT REPLACE(t.id, 'topic_', 'topic_nsmq_math_'), 'subj_nsmq_math',
       CASE WHEN t.parent_id IS NULL THEN NULL ELSE REPLACE(t.parent_id, 'topic_', 'topic_nsmq_math_') END,
       t.name, t.slug || '-nsmq', t.description, t.theory_content, t.key_formulas, t.display_order, t.created_at
FROM topics t WHERE t.subject_id = 'subj_math';

INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at)
SELECT REPLACE(t.id, 'topic_', 'topic_wcoremath_'), 'subj_wassce_core_math',
       CASE WHEN t.parent_id IS NULL THEN NULL ELSE REPLACE(t.parent_id, 'topic_', 'topic_wcoremath_') END,
       t.name, t.slug || '-wassce-core', t.description, t.theory_content, t.key_formulas, t.display_order, t.created_at
FROM topics t WHERE t.subject_id = 'subj_math';

INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at)
SELECT REPLACE(t.id, 'topic_', 'topic_nsmq_chem_'), 'subj_nsmq_chemistry',
       CASE WHEN t.parent_id IS NULL THEN NULL ELSE REPLACE(t.parent_id, 'topic_', 'topic_nsmq_chem_') END,
       t.name, t.slug || '-nsmq', t.description, t.theory_content, t.key_formulas, t.display_order, t.created_at
FROM topics t WHERE t.subject_id = 'subj_chemistry';

INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at)
SELECT REPLACE(t.id, 'topic_', 'topic_nsmq_phys_'), 'subj_nsmq_physics',
       CASE WHEN t.parent_id IS NULL THEN NULL ELSE REPLACE(t.parent_id, 'topic_', 'topic_nsmq_phys_') END,
       t.name, t.slug || '-nsmq', t.description, t.theory_content, t.key_formulas, t.display_order, t.created_at
FROM topics t WHERE t.subject_id = 'subj_physics';

INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at)
SELECT REPLACE(t.id, 'topic_', 'topic_nsmq_bio_'), 'subj_nsmq_biology',
       CASE WHEN t.parent_id IS NULL THEN NULL ELSE REPLACE(t.parent_id, 'topic_', 'topic_nsmq_bio_') END,
       t.name, t.slug || '-nsmq', t.description, t.theory_content, t.key_formulas, t.display_order, t.created_at
FROM topics t WHERE t.subject_id = 'subj_biology';

INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at)
SELECT REPLACE(t.id, 'topic_', 'topic_wchem_'), 'subj_wassce_chemistry',
       CASE WHEN t.parent_id IS NULL THEN NULL ELSE REPLACE(t.parent_id, 'topic_', 'topic_wchem_') END,
       t.name, t.slug || '-wassce', t.description, t.theory_content, t.key_formulas, t.display_order, t.created_at
FROM topics t WHERE t.subject_id = 'subj_chemistry';

INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at)
SELECT REPLACE(t.id, 'topic_', 'topic_wphys_'), 'subj_wassce_physics',
       CASE WHEN t.parent_id IS NULL THEN NULL ELSE REPLACE(t.parent_id, 'topic_', 'topic_wphys_') END,
       t.name, t.slug || '-wassce', t.description, t.theory_content, t.key_formulas, t.display_order, t.created_at
FROM topics t WHERE t.subject_id = 'subj_physics';

INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at)
SELECT REPLACE(t.id, 'topic_', 'topic_wbio_'), 'subj_wassce_biology',
       CASE WHEN t.parent_id IS NULL THEN NULL ELSE REPLACE(t.parent_id, 'topic_', 'topic_wbio_') END,
       t.name, t.slug || '-wassce', t.description, t.theory_content, t.key_formulas, t.display_order, t.created_at
FROM topics t WHERE t.subject_id = 'subj_biology';
