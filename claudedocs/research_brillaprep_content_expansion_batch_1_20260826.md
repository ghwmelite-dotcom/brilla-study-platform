# BrillaPrep content expansion batch 1 research

Date: 2026-08-26

## Executive summary

Batch 1 should make three currently empty WASSCE subjects usable: Commerce, Islamic Religious Studies, and Applied Electricity. Each bank will contain 40 original BrillaPrep multiple-choice questions, topic and syllabus-topic bindings, worked explanations, WAEC provenance metadata, and an automated-beta label. The questions must not reproduce WAEC past-paper wording.

The generic BECE `Ghanaian Language` subject must not receive a shared question bank. NaCCA recognises multiple approved Ghanaian languages, while BrillaPrep currently exposes the item as one undifferentiated subject. A shared bank would serve the wrong language to some learners. The correct next language phase is separate Ewe, Fante, and Ga banks (and an explicit language choice for BECE), with language-specific orthography checks.

The 3,492 existing questions without `topic_id` also require a separate remediation stream. Only 90 have a `syllabus_topic_id`, and a production aggregate query found zero exact title-based deterministic topic matches. Automatic bulk assignment would therefore guess and is excluded from this batch. All new questions will be fully topic-bound.

Confidence: high for Commerce and Applied Electricity coverage; medium-high for Islamic Religious Studies because the current official evidence is distributed across WAEC examination resources and reports rather than a single Ghana-hosted subject syllabus; high that the generic Ghanaian Language bank must be split before authoring.

## Source-backed scope

### Commerce

Primary blueprint: WAEC Ghana, Commerce detailed syllabus: https://waecgh.org/wp-content/uploads/2024/07/COMMERCE.pdf

The published syllabus begins with the meaning and scope of commerce, production, division of labour, business organisations, and location of industry, and continues across trade and its aids. WAEC's official e-learning index and chief examiner material confirm that assessment expects broad syllabus coverage and application rather than rote recall:

- https://www.waeconline.org.ng/e-learning/Commerce/Commmain.html
- https://waeconline.org.ng/e-learning/Commerce/comm240mc.html

Batch blueprint: foundations and production; business organisations; trade and distribution; transport, warehousing and communication; banking and finance; insurance and risk; marketing and consumer protection; e-commerce and the business environment.

### Islamic Religious Studies

Primary evidence:

- WAEC official Islamic Studies e-learning index: https://www.waeconline.org.ng/e-learning/Islamic/IRKmain.html
- WAEC Ghana 2021 Humanities chief examiner report: https://waecgh.org/wp-content/uploads/2023/03/Humanities21.pdf
- WAEC Ghana 2020 Humanities report: https://waecgh.org/wp-content/uploads/2023/03/Humanities20.pdf
- NaCCA Religious and Moral Education curriculum: https://nacca.gov.gh/wp-content/uploads/2025/04/RELIGIOUS-AND-MORAL-EDUCATION-Curriculum.pdf

WAEC evidence explicitly identifies Qur'anic interpretation and moral lessons, Hadith terminology and collections, Hadith versus Sunnah, the Five Pillars, the Prophet's life, Hudaybiyyah, Tayammum, Shari'ah, family law, and Islamic history as assessed areas. The bank will use original questions across those domains and avoid sectarian adjudication or unsupported legal advice.

Batch blueprint: Qur'an and revelation; Hadith and Sunnah; life of Prophet Muhammad; beliefs and pillars; worship and purification; Shari'ah and family/community life; early Islamic leadership and scholarship; ethics and social responsibility.

### Applied Electricity

Primary evidence:

- NaCCA Applied Technology curriculum: https://nacca.gov.gh/wp-content/uploads/2025/04/Applied-Technology-Curriculum.pdf
- WAEC Ghana Applied Electricity chief examiner evidence: https://waecgh.org/wp-content/uploads/2023/12/Technical17.pdf
- WAEC Ghana current timetable page confirming the continuing subject/paper structure: https://waecgh.org/timetable/

The official evidence covers electrical safety, generation/transmission/distribution, d.c. power and energy, R-C networks and impedance, electronics, transistor configurations, and practical work. The beta bank will focus on principles, safe practice and short calculations that can be represented reliably in text.

Batch blueprint: safety and quantities; d.c. circuits; capacitance and a.c. principles; magnetism and transformers; machines and generation; instruments and measurements; semiconductor electronics; installation, protection and distribution.

## Release controls

- Stable IDs and `INSERT OR IGNORE` make every migration re-applicable.
- Each subject receives eight topic rows, eight syllabus-topic rows, and 40 questions.
- Every question has four JSON-valid options, one letter answer, a worked explanation, difficulty, marks, assessment objective, topic, syllabus topic, exam type and board.
- `question_content_releases` marks every row `automated_beta`, `beta`, feedback-enabled, and explicitly not official exam-board content.
- Integrity tests verify exact counts, foreign keys, duplicate-normalised prompts, provenance and migration size below the remote D1 limit.
- Production application remains a separate approval gate after local tests, full suite, typechecks and production build pass.

## Deferred work

1. Add explicit language selection for BECE Ghanaian Language and author separate Ewe, Fante and Ga banks with orthography validation.
2. Remediate legacy missing topic assignments only where a reviewed deterministic mapping can be established; do not infer topics from loose keyword matching.
3. Address short legacy explanations and conflicting normalised duplicates in subject-scoped, reversible migrations.
