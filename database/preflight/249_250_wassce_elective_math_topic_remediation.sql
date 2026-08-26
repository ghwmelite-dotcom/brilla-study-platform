-- Read-only post-migration checks for WASSCE Elective Mathematics remediation 249-251.
SELECT 'subject_total' check_name,COUNT(*) actual,204 expected FROM questions WHERE subject_id='subj_wassce_elect_math';
SELECT 'subject_null_topics' check_name,COUNT(*) actual,0 expected FROM questions WHERE subject_id='subj_wassce_elect_math' AND topic_id IS NULL;
SELECT 'same_subject_links' check_name,COUNT(*) actual,204 expected FROM questions q JOIN topics t ON t.id=q.topic_id WHERE q.subject_id='subj_wassce_elect_math' AND t.subject_id=q.subject_id;
SELECT 'migration_249_ledger' check_name,COUNT(*) actual,100 expected FROM question_bank_remediation_log WHERE migration_id='249_wassce_topic_elective_math_part_1';
SELECT 'migration_250_ledger' check_name,COUNT(*) actual,22 expected FROM question_bank_remediation_log WHERE migration_id='250_wassce_topic_elective_math_part_2';
SELECT 'migration_251_ledger' check_name,COUNT(*) actual,9 expected FROM question_bank_remediation_log WHERE migration_id='251_wassce_elective_math_content_corrections';
SELECT 'corrected_answer_options' check_name,COUNT(*) actual,6 expected FROM questions WHERE
 (id='q_wassce_emath_2024_09' AND correct_answer='C' AND json_extract(options,'$[2]')='3') OR
 (id='q_wassce_emath_2023_50' AND correct_answer='A' AND json_extract(options,'$[0]')='5/14') OR
 (id='q_wassce_emath_2024_50' AND correct_answer='A' AND json_extract(options,'$[0]')='6/25') OR
 (id='q_em_045' AND correct_answer='2/15' AND json_extract(options,'$[0]')='2/15') OR
 (id='q_wassce_emath_2024_44' AND correct_answer='C' AND json_extract(options,'$[2]')='12') OR
 (id='q_wassce_emath_2024_12' AND correct_answer='B' AND json_extract(options,'$[1]')='-1/2');
SELECT 'suspicious_editorial_tokens' check_name,COUNT(*) actual,0 expected FROM questions
WHERE subject_id='subj_wassce_elect_math' AND (instr(lower(explanation),'jean')>0 OR instr(lower(explanation),'closest option')>0 OR instr(lower(explanation),'let me recalculate')>0);
SELECT 'exact_duplicate_options' check_name,COUNT(*) actual,0 expected FROM questions q,json_each(q.options) a,json_each(q.options) b
WHERE q.subject_id='subj_wassce_elect_math' AND q.question_type='multiple_choice' AND a.key<b.key AND trim(lower(a.value))=trim(lower(b.value));
SELECT 'global_cross_subject_links' check_name,COUNT(*) actual,0 expected FROM questions q JOIN topics t ON t.id=q.topic_id WHERE q.topic_id IS NOT NULL AND q.subject_id IS NOT t.subject_id;
PRAGMA foreign_key_check;
