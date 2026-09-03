import { describe, expect, it } from 'vitest';
import { buildStagingManifest, normalizeQuestionText, validateQuestionBatch } from '../../../scripts/question-content-lib.mjs';

function validBatch() {
  return {
    batchId: 'pilot-001', status: 'approved_for_beta', examTypeId: 'edexcel_igcse',
    provenance: [{ publisher: 'Pearson', title: 'Official specification', url: 'https://example.com/spec.pdf', use: 'curriculum_blueprint_only' }],
    review: { authoringMethod: 'original_curriculum_aligned', qualityAssurance: 'automated_beta', automatedChecksAt: '2026-08-24T00:00:00Z' },
    release: { channel: 'beta', contentLabel: 'Original BrillaPrep practice content aligned to the published syllabus; not official Pearson material.', officialExamBoardContent: false, feedbackEnabled: true },
    subjects: [{ subjectId: 'subject-1', specificationCode: 'TEST1',
      topics: [{ code: 'T1', title: 'Test topic', objective: 'Apply the declared concept accurately in a new context.' }],
      questions: [{ id: 'question-1', original: true, topicCode: 'T1', type: 'multiple_choice',
        prompt: 'Which option correctly applies the stated relationship to this new example?',
        options: [
          { label: 'A', text: 'First result', rationale: 'This applies the wrong relationship to the supplied values.' },
          { label: 'B', text: 'Second result', rationale: 'This correctly applies the relationship to the supplied values.' },
          { label: 'C', text: 'Third result', rationale: 'This reverses the relationship and therefore gives the wrong result.' },
          { label: 'D', text: 'Fourth result', rationale: 'This ignores one of the quantities given in the question.' },
        ], correctAnswer: 'B',
        workedSolution: 'Identify the required relationship, substitute each supplied value, and simplify carefully. The resulting value is the second option, while the other choices each reflect a specific calculation error.',
        difficulty: 'medium', marks: 2, commandWord: 'Calculate', assessmentObjective: 'AO2' }],
    }],
  };
}

describe('question content validation', () => {
  it('normalizes punctuation and spacing for duplicate detection', () => expect(normalizeQuestionText('  Energy—TRANSFER! ')).toBe('energy transfer'));
  it('accepts a well-formed staging batch', () => expect(validateQuestionBatch(validBatch())).toMatchObject({ valid: true, metrics: { subjects: 1, questions: 1 } }));
  it('rejects duplicate text and production content without automated beta controls', () => {
    const batch = validBatch();
    batch.status = 'approved_for_production';
    batch.review.automatedChecksAt = null;
    batch.release.feedbackEnabled = false;
    batch.subjects[0].questions.push({ ...batch.subjects[0].questions[0], id: 'question-2' });
    const result = validateQuestionBatch(batch, { mode: 'production' });
    expect(result.valid).toBe(false);
    expect(result.errors.join('\n')).toContain('duplicates');
    expect(result.errors.join('\n')).toContain('automatedChecksAt');
    expect(result.errors.join('\n')).toContain('feedbackEnabled');
    expect(result.errors.join('\n')).toContain('at least 40');
  });
  it('refuses an import manifest from an unapproved draft', () => {
    const batch = validBatch();
    batch.status = 'draft_automated_qa';
    expect(() => buildStagingManifest(batch)).toThrow('approved_for_beta');
  });
});

describe('theory question validation', () => {
  const DISCLAIMER = 'Original BrillaPrep practice content aligned to the published WASSCE syllabus; not official WAEC material.';

  function essayQuestion(overrides = {}) {
    return {
      id: 'essay-1', original: true, topicCode: 'T1', type: 'essay',
      prompt: 'Discuss the factors that influence rainfall distribution in West Africa, supporting your answer with relevant examples.',
      workedSolution: 'A strong answer identifies relief, latitude, ocean currents and wind belts, explains how each factor shapes rainfall, and anchors every point in a named West African example.',
      commandWord: 'Discuss',
      marks: 20,
      contentLabel: DISCLAIMER,
      markingScheme: {
        points: [
          { point: 'Identifies at least three factors that influence rainfall', marks: 6 },
          { point: 'Explains the mechanism by which each factor acts', marks: 8 },
          { point: 'Supports explanations with named West African examples', marks: 6 },
        ],
      },
      modelAnswer: 'Rainfall in West Africa is shaped by latitude, relief, ocean currents and prevailing wind belts. '.repeat(5),
      ...overrides,
    };
  }

  function structuredQuestion(overrides = {}) {
    return {
      id: 'structured-1', original: true, topicCode: 'T1', type: 'structured',
      prompt: 'A trader records daily sales over one market week and wants to analyse the pattern of demand.',
      workedSolution: 'Part (a) requires reading values from the record, part (b) requires computing the mean from the listed values, and part (c) requires interpreting the result in the market context.',
      commandWord: 'Calculate',
      marks: 10,
      contentLabel: DISCLAIMER,
      parts: [
        { label: 'a', text: 'State the highest daily sale recorded in the week.', marks: 2, correctAnswer: 'The highest daily sale is read directly from the record.' },
        { label: 'b', text: 'Calculate the mean daily sale for the week.', marks: 5, correctAnswer: 'Sum the daily sales and divide by seven.' },
        { label: 'c', text: 'Explain what the mean tells the trader about demand.', marks: 3, correctAnswer: 'The mean summarises typical daily demand across the week.' },
      ],
      ...overrides,
    };
  }

  function theoryBatch(question) {
    const batch = validBatch();
    batch.subjects[0].questions = [question];
    return batch;
  }

  it('accepts an essay question whose marking scheme points sum to its marks', () => {
    const result = validateQuestionBatch(theoryBatch(essayQuestion()));
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it('rejects an essay question whose scheme points do not sum to marks', () => {
    const question = essayQuestion({ markingScheme: { points: [{ point: 'Only one point', marks: 5 }] } });
    const result = validateQuestionBatch(theoryBatch(question));
    expect(result.valid).toBe(false);
    expect(result.errors.join('\n')).toMatch(/questions\[0\].*must sum to marks/);
  });

  it('rejects an essay question without a marking scheme', () => {
    const question = essayQuestion();
    delete question.markingScheme;
    const result = validateQuestionBatch(theoryBatch(question));
    expect(result.valid).toBe(false);
    expect(result.errors.join('\n')).toContain('markingScheme');
  });

  it('accepts a structured question whose parts sum to its marks', () => {
    const result = validateQuestionBatch(theoryBatch(structuredQuestion()));
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it('rejects a structured question with fewer than two parts', () => {
    const question = structuredQuestion({
      marks: 2,
      parts: [{ label: 'a', text: 'Single part only.', marks: 2, correctAnswer: 'One answer.' }],
    });
    const result = validateQuestionBatch(theoryBatch(question));
    expect(result.valid).toBe(false);
    expect(result.errors.join('\n')).toContain('at least 2 parts');
  });

  it('rejects a theory question without the non-official disclaimer label', () => {
    const question = essayQuestion({ contentLabel: 'Authentic WAEC past paper question.' });
    const result = validateQuestionBatch(theoryBatch(question));
    expect(result.valid).toBe(false);
    expect(result.errors.join('\n')).toContain('not official WAEC');
  });

  it('allows a production theory subject below the 40-question objective-bank minimum', () => {
    const result = validateQuestionBatch(theoryBatch(essayQuestion()), { mode: 'production' });
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });
});
