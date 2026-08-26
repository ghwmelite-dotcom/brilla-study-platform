# BrillaPrep content expansion batch 1 research

Date: 2026-08-26

## Executive summary

Batch 1 makes two currently empty, current-or-transitional WASSCE subjects usable: Islamic Religious Studies and Applied Electricity. Each bank contains 40 original BrillaPrep multiple-choice questions across eight topics, exact topic and internal blueprint bindings, worked explanations, source provenance, and an automated-beta label. The content does not reproduce WAEC past-paper wording and is not represented as official WAEC material.

Commerce was removed from the batch after catalogue reconciliation. Although a WAEC-hosted Commerce syllabus exists, Commerce is absent from the current WAEC Ghana school-candidate subject catalogue and the 2026 timetable. The authoritative subject coverage record therefore remains `retire`; material from another examination route must not make that WASSCE subject appear available.

Applied Electricity is retained only as a transitional bank. WAEC Ghana's 2026 timetable includes Applied Electricity papers 1, 2 and 3 for the outgoing track and separately includes Applied Technology III (Electrical and Electronic Technology) for the new curriculum. The bank and internal metadata explicitly state that it is not the new Applied Technology III bank.

The generic BECE `Ghanaian Language` subject must not receive a shared question bank. WAEC assesses distinct Ghanaian languages, so a shared bank could serve learners the wrong language. The language phase remains separate, with language-specific source and orthography validation.

The 3,492 existing questions without `topic_id` remain a separate remediation stream. Only 90 have a `syllabus_topic_id`, and the production aggregate found zero exact deterministic title matches. Bulk assignment would guess, so every new batch-1 question is topic-bound while legacy rows remain unchanged.

## Source-backed scope

### Islamic Religious Studies

Current-subject and curriculum evidence:

- WAEC Ghana WASSCE for School Candidates subject catalogue: https://waecgh.org/home/wassce-school/
- WAEC Islamic Studies e-learning index: https://www.waeconline.org.ng/e-learning/Islamic/IRKmain.html
- WAEC Ghana 2021 Humanities chief examiner report: https://waecgh.org/wp-content/uploads/2023/03/Humanities21.pdf
- WAEC Ghana 2020 Humanities chief examiner report: https://waecgh.org/wp-content/uploads/2023/03/Humanities20.pdf
- NaCCA Religious and Moral Education curriculum: https://nacca.gov.gh/wp-content/uploads/2025/04/RELIGIOUS-AND-MORAL-EDUCATION-Curriculum.pdf

The bank covers the Qur'an and revelation; Hadith and Sunnah; the life of Prophet Muhammad; beliefs and pillars; worship and purification; Shari'ah and family/community life; early Islamic leadership and scholarship; and ethics and social responsibility. Questions avoid sectarian adjudication and unsupported personal legal advice.

### Applied Electricity — transitional track

Current and transition evidence:

- WAEC Ghana 2026 final timetable: https://waecgh.org/wp-content/uploads/2026/03/FINAL-TIMETABLE-FOR-WASSCE-SC-2026-GHANA-ONLY-NEW-TAD.pdf
- WAEC Ghana WASSCE for School Candidates subject catalogue: https://waecgh.org/home/wassce-school/
- NaCCA Applied Technology curriculum: https://nacca.gov.gh/wp-content/uploads/2025/04/Applied-Technology-Curriculum.pdf
- WAEC Ghana Applied Electricity chief examiner evidence: https://waecgh.org/wp-content/uploads/2023/12/Technical17.pdf
- Ghana Energy Commission electricity regulations: https://www.energycom.gov.gh/index.php/documents/category/40-electricity-regulations?download=162%3Aelectricity-regulations

The timetable simultaneously lists the outgoing Applied Electricity papers and the new Applied Technology III electrical/electronic papers. The transitional bank covers safety and quantities; d.c. circuits; capacitance and a.c. principles; magnetism and transformers; machines and generation; instruments and measurements; semiconductor electronics; and installation, protection and distribution. Ghana nominal low-voltage teaching uses 400 V phase-to-phase and 230 V phase-to-neutral.

## Metadata and release controls

- `subject_specifications` rows are explicitly internal BrillaPrep evidence blueprints. They use `BRILLA-*` codes, not invented WAEC syllabus codes.
- Unknown official specification year, validity date and paper count remain `NULL`, `NULL` and `0`; evidence pages are not presented as formal syllabus specifications.
- Every question has four JSON-valid options, one A-D answer, a worked explanation, difficulty, marks, assessment objective, topic, syllabus topic, exam type and board.
- `question_content_releases` marks every row `automated_beta`, `beta`, feedback-enabled, and explicitly not official exam-board content.
- Stable-ID preflight guards compare all canonical question fields and release provenance. A pre-existing mismatched row aborts rather than inheriting trusted batch provenance.
- The generator rejects exact normalised prompt duplicates against existing checked-in batches and canonical seed SQL.
- Tests regenerate JSON and all migrations into a temporary directory and require byte-for-byte parity with committed artifacts.
- Production application remains a separate approval gate after review, the full suite, typechecks, lint, production build and authenticated learner QA pass.

## Deferred work

1. Author Applied Technology III as a distinct new-curriculum bank; do not silently merge it with transitional Applied Electricity.
2. Add explicit language selection and author language-specific Ghanaian banks with orthography validation.
3. Populate the next verified current subjects in controlled clusters, beginning with a source-complete technical or language bank.
4. Remediate legacy topic gaps only through reviewed deterministic mappings; do not infer topics from loose keyword matching.
5. Address short legacy explanations and duplicate groups in subject-scoped, reversible migrations.
