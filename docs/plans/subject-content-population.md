# Subject content population gate

## Outcome

The post-migration production audit contains 27 active catalogue records with no questions. They are now classified as 24 valid existing population targets, one BECE record that must split into 11 language-specific banks, and two WASSCE records that should be retired rather than populated.

The machine-readable decision record is `content/subject-coverage-matrix.json`.

## Non-negotiable release gates

1. Use official WAEC, NaCCA or Pearson specifications as the topic blueprint.
2. Author original question wording. Do not copy past-paper or specimen questions.
3. Bind every question to an exact exam, subject, specification and syllabus topic.
4. Require a worked explanation and plausible distractors for every multiple-choice item.
5. Reject normalized duplicates, missing topic assignments, ambiguous answers and incorrect option shapes automatically.
6. Require the automated beta release contract: deterministic validation, answer integrity, source provenance, duplicate rejection, a visible non-official-content label and an enabled learner correction channel.
7. Keep a subject unavailable until approved content reaches the operational floor and topic coverage gate.

## Catalogue corrections

- Retire WASSCE Commerce. It is absent from the current WAEC Ghana school-candidate catalogue and 2026 timetable; Pearson IGCSE Commerce and GBCE Commerce are different qualifications.
- Retire the generic WASSCE Visual Arts record as a selectable subject. Visual Arts is a programme; named disciplines such as Picture Making, Basketry, Leatherwork and Sculpture are the examined subjects.
- Split generic BECE Ghanaian Language into Dagaare, Dagbani, Dangme, Ewe, Fante, Ga, Gonja, Kasem, Nzema, Twi (Akuapem) and Twi (Asante). A generic mixed-language question bank is unsafe.

## Delivery sequence

1. Pilot the pipeline on Pearson Edexcel International GCSE Mathematics A, Biology, Chemistry and Physics because the official specifications are explicit and current.
2. Pass automated content QA, load the beta batch into a non-production D1 database and run learner-path QA.
3. Expand WASSCE subjects in curriculum clusters: technical, visual arts, languages, religious studies, home economics and music.
4. Keep the 11 BECE language banks deferred until their language-specific source and validation rules are implemented; never mix languages into a generic bank.
5. Promote only automated-beta-approved batches, then rerun the full question-bank audit and authenticated learner QA.

## Definition of ready

A subject is not “populated” merely because it has a few rows. Ready means the beta bank meets all configured floors, covers the declared syllabus blueprint, passes automatic integrity checks, is clearly labelled as original BrillaPrep practice content rather than official exam-board material, exposes a correction path, and passes authenticated learner-path QA.
