import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const generator = require('../../../scripts/generate-cambridge-topic-taxonomy-proposals.cjs') as {
  buildProposalManifest: () => ProposalManifest;
};
const auditor = require('../../../scripts/audit-cambridge-topic-taxonomy-proposals.cjs') as {
  audit: () => AuditResult;
};

type ProposedTopic = {
  proposedTopicId: string;
  subjectId: string;
  examFamily: string;
  syllabusSection: string;
  sourceDocument: string;
  questionIds: string[];
  contentGateQuestionIds: string[];
};
type ProposedMapping = {
  questionId: string;
  subjectId: string;
  proposedTopicId: string;
  status: string;
};
type RetainedException = { questionId: string; classification: string; rationale: string };
type Correction = {
  questionId: string;
  defect: string;
  before: Record<string, string>;
  after: Record<string, string>;
  proof: string;
};
type ProposalManifest = {
  status: string;
  baseline: { sourceQuestionCount: number; mappedQuestionCount: number; exceptionCount: number };
  proposal: {
    topicCount: number;
    mappingCount: number;
    readyAfterTaxonomyApprovalCount: number;
    contentGatedMappingCount: number;
    retainedExceptionCount: number;
    projectedMappedAfterApprovalAndCorrections: number;
    projectedExceptionCount: number;
  };
  sourceDocuments: Record<string, { title: string; url: string }>;
  proposedTopics: ProposedTopic[];
  proposedMappings: ProposedMapping[];
  retainedExceptions: RetainedException[];
  contentCorrectionProposals: Correction[];
};
type AuditResult = Pick<ProposalManifest, 'status' | 'baseline' | 'proposal'> & {
  retainedQuestionIds: string[];
  contentCorrectionQuestionIds: string[];
};

describe('Cambridge taxonomy proposals', () => {
  const manifest = generator.buildProposalManifest();

  it('reduces the reviewed 54-row exception cohort to five explicit retained exceptions without a migration', () => {
    const result = auditor.audit();
    expect(result.status).toBe('proposal-only-no-migration');
    expect(result.baseline).toEqual({ sourceQuestionCount: 455, mappedQuestionCount: 401, exceptionCount: 54 });
    expect(result.proposal).toEqual({
      topicCount: 15,
      mappingCount: 49,
      readyAfterTaxonomyApprovalCount: 48,
      contentGatedMappingCount: 1,
      retainedExceptionCount: 5,
      projectedMappedAfterApprovalAndCorrections: 450,
      projectedExceptionCount: 5,
    });
    expect(result.retainedQuestionIds).toEqual([
      'q_alevel_bio_028',
      'q_alevel_bio_029',
      'q_alevel_fm_051',
      'q_alevel_fm_052',
      'q_alevel_fm_053',
    ]);
  });

  it('uses only bounded official same-subject Cambridge syllabus topics', () => {
    expect(manifest.proposedTopics).toHaveLength(15);
    expect(manifest.proposedMappings).toHaveLength(49);
    for (const topic of manifest.proposedTopics) {
      expect(topic.syllabusSection).toMatch(/^\d+(?:\.\d+)?\s/);
      expect(manifest.sourceDocuments[topic.sourceDocument]?.url).toMatch(/^https:\/\/www\.cambridgeinternational\.org\/Images\//);
      expect(topic.questionIds.length).toBeGreaterThan(0);
      expect(topic.proposedTopicId).toMatch(/^topic_(igcse|alevel)_/);
    }
    expect(manifest.retainedExceptions.every((row) => row.classification.startsWith('out-of-current-syllabus-'))).toBe(true);
    expect(manifest.retainedExceptions.every((row) => row.rationale.length >= 100)).toBe(true);
  });

  it('content-gates the incorrect vector answer and proposes exact before/after corrections', () => {
    const mapping = manifest.proposedMappings.find((row) => row.questionId === 'q_alevel_fm_050');
    const correction = manifest.contentCorrectionProposals.find((row) => row.questionId === 'q_alevel_fm_050');
    expect(mapping?.status).toBe('blocked-content-correction');
    expect(correction).toMatchObject({
      defect: 'incorrect-correct-answer',
      before: { correctAnswer: '1 unit' },
      after: { correctAnswer: '1/3 unit' },
    });
    expect(correction?.proof).toContain('= 1/3, not 1');
  });

  it('records the equivalent-option defect in the retained Maclaurin question', () => {
    const correction = manifest.contentCorrectionProposals.find((row) => row.questionId === 'q_alevel_fm_051');
    expect(correction).toMatchObject({
      defect: 'duplicate-equivalent-options',
      before: {
        optionA: 'A. 1 + x + x²/2 + x³/6',
        optionD: 'D. 1 + x + x²/2! + x³/3!',
      },
      after: { optionD: 'D. 1 + x + x²/2 + x³/3', correctAnswer: 'A' },
    });
    expect(correction?.proof).toContain('2! = 2 and 3! = 6');
  });

  it('does not silently apply source corrections or create numbered migrations', () => {
    expect(manifest.contentCorrectionProposals.map((row) => row.questionId).sort()).toEqual(['q_alevel_fm_050', 'q_alevel_fm_051']);
    expect(manifest.status).toBe('proposal-only-no-migration');
  });
});
