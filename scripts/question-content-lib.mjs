const VALID_STATUSES = new Set(['draft_automated_qa', 'approved_for_beta', 'approved_for_production']);
const VALID_DIFFICULTIES = new Set(['easy', 'medium', 'hard']);
const VALID_TYPES = new Set(['multiple_choice', 'short_answer', 'calculation']);
const VALID_AOS = new Set(['AO1', 'AO2', 'AO3']);

export function normalizeQuestionText(value) {
  return String(value ?? '').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

export function normalizeOptionText(value) {
  return String(value ?? '').normalize('NFKC').toLowerCase().replace(/\s+/gu, ' ').trim();
}

function requireText(errors, value, path, minimum = 1) {
  if (typeof value !== 'string' || value.trim().length < minimum) {
    errors.push(`${path} must contain at least ${minimum} characters`);
  }
}

export function validateQuestionBatch(batch, { mode = 'draft' } = {}) {
  const errors = [];
  const warnings = [];
  if (!batch || typeof batch !== 'object' || Array.isArray(batch)) {
    return { valid: false, errors: ['batch must be an object'], warnings, metrics: {} };
  }

  requireText(errors, batch.batchId, 'batchId', 4);
  requireText(errors, batch.examTypeId, 'examTypeId', 2);
  if (!VALID_STATUSES.has(batch.status)) errors.push('status is invalid');
  if (!Array.isArray(batch.provenance) || batch.provenance.length === 0) {
    errors.push('provenance must contain at least one official source');
  } else {
    batch.provenance.forEach((source, index) => {
      const path = `provenance[${index}]`;
      requireText(errors, source?.publisher, `${path}.publisher`, 2);
      requireText(errors, source?.title, `${path}.title`, 4);
      if (source?.use !== 'curriculum_blueprint_only') errors.push(`${path}.use must be curriculum_blueprint_only`);
      try {
        const url = new URL(source?.url);
        if (url.protocol !== 'https:') errors.push(`${path}.url must use https`);
      } catch {
        errors.push(`${path}.url must be a valid URL`);
      }
    });
  }

  if (batch.review?.authoringMethod !== 'original_curriculum_aligned') {
    errors.push('review.authoringMethod must be original_curriculum_aligned');
  }
  if (batch.review?.qualityAssurance !== 'automated_beta') {
    errors.push('review.qualityAssurance must be automated_beta');
  }
  const releaseMode = mode === 'production' || batch.status === 'approved_for_production';
  if (releaseMode) {
    requireText(errors, batch.review?.automatedChecksAt, 'review.automatedChecksAt', 10);
    if (batch.release?.channel !== 'beta') errors.push('release.channel must be beta');
    requireText(errors, batch.release?.contentLabel, 'release.contentLabel', 40);
    if (batch.release?.officialExamBoardContent !== false) errors.push('release.officialExamBoardContent must be false');
    if (batch.release?.feedbackEnabled !== true) errors.push('release.feedbackEnabled must be true');
  }
  if (!Array.isArray(batch.subjects) || batch.subjects.length === 0) errors.push('subjects must contain at least one subject');

  const seenSubjectIds = new Set();
  const seenQuestionIds = new Set();
  const seenQuestionText = new Map();
  let questionCount = 0;
  for (const [subjectIndex, subject] of (batch.subjects ?? []).entries()) {
    const subjectPath = `subjects[${subjectIndex}]`;
    requireText(errors, subject?.subjectId, `${subjectPath}.subjectId`, 3);
    requireText(errors, subject?.specificationCode, `${subjectPath}.specificationCode`, 3);
    if (seenSubjectIds.has(subject?.subjectId)) errors.push(`${subjectPath}.subjectId is duplicated`);
    seenSubjectIds.add(subject?.subjectId);

    const topicCodes = new Set();
    if (!Array.isArray(subject?.topics) || subject.topics.length === 0) errors.push(`${subjectPath}.topics must contain at least one topic`);
    for (const [topicIndex, topic] of (subject?.topics ?? []).entries()) {
      const topicPath = `${subjectPath}.topics[${topicIndex}]`;
      requireText(errors, topic?.code, `${topicPath}.code`, 2);
      requireText(errors, topic?.title, `${topicPath}.title`, 4);
      requireText(errors, topic?.objective, `${topicPath}.objective`, 20);
      if (topicCodes.has(topic?.code)) errors.push(`${topicPath}.code is duplicated`);
      topicCodes.add(topic?.code);
    }

    if (!Array.isArray(subject?.questions) || subject.questions.length === 0) errors.push(`${subjectPath}.questions must contain at least one question`);
    if (mode === 'production' && (subject?.questions?.length ?? 0) < 40) errors.push(`${subjectPath} needs at least 40 approved questions for production`);
    const coveredTopics = new Set();
    const difficultyCounts = { easy: 0, medium: 0, hard: 0 };
    for (const [questionIndex, question] of (subject?.questions ?? []).entries()) {
      questionCount += 1;
      const path = `${subjectPath}.questions[${questionIndex}]`;
      requireText(errors, question?.id, `${path}.id`, 4);
      requireText(errors, question?.prompt, `${path}.prompt`, 18);
      requireText(errors, question?.workedSolution, `${path}.workedSolution`, 80);
      requireText(errors, question?.commandWord, `${path}.commandWord`, 3);
      if (question?.original !== true) errors.push(`${path}.original must be true`);
      if (question?.sourcePaperCode || question?.sourceQuestionNumber) errors.push(`${path} must not claim a source paper or source question number`);
      if (seenQuestionIds.has(question?.id)) errors.push(`${path}.id is duplicated`);
      seenQuestionIds.add(question?.id);
      if (!topicCodes.has(question?.topicCode)) errors.push(`${path}.topicCode is not declared`);
      coveredTopics.add(question?.topicCode);
      if (!VALID_TYPES.has(question?.type)) errors.push(`${path}.type is invalid`);
      if (!VALID_DIFFICULTIES.has(question?.difficulty)) errors.push(`${path}.difficulty is invalid`);
      else difficultyCounts[question.difficulty] += 1;
      if (!VALID_AOS.has(question?.assessmentObjective)) errors.push(`${path}.assessmentObjective is invalid`);
      if (!Number.isInteger(question?.marks) || question.marks < 1 || question.marks > 10) errors.push(`${path}.marks must be an integer from 1 to 10`);

      const normalized = normalizeQuestionText(question?.prompt);
      const prior = seenQuestionText.get(normalized);
      if (prior) errors.push(`${path}.prompt duplicates ${prior}`);
      else if (normalized) seenQuestionText.set(normalized, path);

      if (question?.type === 'multiple_choice') {
        if (!Array.isArray(question.options) || question.options.length !== 4) {
          errors.push(`${path}.options must contain exactly four options`);
        } else {
          const labels = new Set();
          const optionTexts = new Set();
          question.options.forEach((option, optionIndex) => {
            const optionPath = `${path}.options[${optionIndex}]`;
            if (!['A', 'B', 'C', 'D'].includes(option?.label)) errors.push(`${optionPath}.label is invalid`);
            requireText(errors, option?.text, `${optionPath}.text`, 1);
            requireText(errors, option?.rationale, `${optionPath}.rationale`, 20);
            labels.add(option?.label);
            optionTexts.add(normalizeOptionText(option?.text));
          });
          if (labels.size !== 4) errors.push(`${path}.options labels must be A, B, C and D once each`);
          if (optionTexts.size !== 4) errors.push(`${path}.options texts must be unique`);
          if (!labels.has(question?.correctAnswer)) errors.push(`${path}.correctAnswer must match an option label`);
        }
      } else {
        requireText(errors, question?.correctAnswer, `${path}.correctAnswer`, 1);
        if (question?.options != null) errors.push(`${path}.options must be omitted for non-MCQ questions`);
      }
    }
    const missingTopics = [...topicCodes].filter((code) => !coveredTopics.has(code));
    if (missingTopics.length) errors.push(`${subjectPath} has uncovered topics: ${missingTopics.join(', ')}`);
    if ((subject?.questions?.length ?? 0) >= 6) {
      for (const difficulty of VALID_DIFFICULTIES) if (difficultyCounts[difficulty] === 0) warnings.push(`${subjectPath} has no ${difficulty} questions`);
    }
  }

  return { valid: errors.length === 0, errors, warnings, metrics: { subjects: seenSubjectIds.size, questions: questionCount, uniqueQuestionTexts: seenQuestionText.size } };
}

export function buildStagingManifest(batch) {
  const validation = validateQuestionBatch(batch, { mode: 'draft' });
  if (!validation.valid) throw new Error(`Cannot build staging manifest:\n${validation.errors.join('\n')}`);
  if (!['approved_for_beta', 'approved_for_production'].includes(batch.status)) {
    throw new Error('Batch must be approved_for_beta before an import manifest can be built');
  }
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    batchId: batch.batchId,
    examTypeId: batch.examTypeId,
    productionEligible: batch.status === 'approved_for_production',
    release: batch.release,
    qualityAssurance: batch.review.qualityAssurance,
    subjects: batch.subjects.map((subject) => ({
      subjectId: subject.subjectId,
      specificationCode: subject.specificationCode,
      topics: subject.topics,
      questions: subject.questions.map((question) => ({ ...question, options: question.options?.map(({ label, text }) => `${label}. ${text}`) ?? null })),
    })),
  };
}
