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
