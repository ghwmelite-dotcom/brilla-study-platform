import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const generator = require('../../../scripts/generate-cambridge-topic-remediation.cjs') as {
  buildArtifacts: () => Record<string, FamilyManifest | ExceptionLedger>;
};
const auditor = require('../../../scripts/audit-cambridge-topic-remediation.cjs') as {
  audit: () => AuditResult;
};

type MappingGroup = { topicId: string; questionIds: string[]; sourceFiles: string[]; evidence: string };
type SubjectManifest = {
  subjectId: string;
  expectedQuestionCount: number;
  mappedQuestionCount: number;
  exceptionCount: number;
  mappedQuestionIds: string[];
  exceptionQuestionIds: string[];
  mappingGroups: MappingGroup[];
};
type FamilyManifest = {
  examFamily: string;
  expectedNullTopicCohort: number;
  mappedQuestionCount: number;
  exceptionCount: number;
  subjects: SubjectManifest[];
};
type ExceptionRow = {
  questionId: string;
  examFamily: string;
  subjectId: string;
  reasonCode: string;
  missingConcept: string;
  reviewStatus: string;
  requiredTaxonomyAction: string;
};
type ExceptionLedger = { expectedExceptionCount: number; familyCounts: Record<string, number>; exceptions: ExceptionRow[] };
type AuditResult = {
  totalSourceQuestions: number;
  totalMappedQuestions: number;
  totalExceptions: number;
  families: Array<{
    examFamily: string;
    sourceQuestionCount: number;
    mappedQuestionCount: number;
    exceptionCount: number;
    subjects: Array<{ subjectId: string; sourceQuestionCount: number; mappedQuestionCount: number; exceptionCount: number }>;
  }>;
};

const artifacts = generator.buildArtifacts();
const igcse = artifacts['database/manifests/cambridge_igcse_topic_mapping.json'] as FamilyManifest;
const alevel = artifacts['database/manifests/cambridge_alevel_topic_mapping.json'] as FamilyManifest;
const exceptions = artifacts['database/manifests/cambridge_topic_mapping_exceptions.json'] as ExceptionLedger;

describe('Cambridge null-topic audit artifacts', () => {
  it('covers the exact requested source cohorts once, without producing migrations', () => {
    const result = auditor.audit();
    expect(result.totalSourceQuestions).toBe(455);
    expect(result.totalMappedQuestions).toBe(401);
    expect(result.totalExceptions).toBe(54);
    expect(result.families).toEqual([
      {
        examFamily: 'cambridge-igcse',
        sourceQuestionCount: 225,
        mappedQuestionCount: 203,
        exceptionCount: 22,
        subjects: [
          { subjectId: 'subj_igcse_physics', sourceQuestionCount: 50, mappedQuestionCount: 50, exceptionCount: 0 },
          { subjectId: 'subj_igcse_chemistry', sourceQuestionCount: 40, mappedQuestionCount: 34, exceptionCount: 6 },
          { subjectId: 'subj_igcse_biology', sourceQuestionCount: 40, mappedQuestionCount: 32, exceptionCount: 8 },
          { subjectId: 'subj_igcse_math', sourceQuestionCount: 40, mappedQuestionCount: 40, exceptionCount: 0 },
          { subjectId: 'subj_igcse_add_math', sourceQuestionCount: 55, mappedQuestionCount: 47, exceptionCount: 8 },
        ],
      },
      {
        examFamily: 'cambridge-a-level',
        sourceQuestionCount: 230,
        mappedQuestionCount: 198,
        exceptionCount: 32,
        subjects: [
          { subjectId: 'subj_alevel_physics', sourceQuestionCount: 40, mappedQuestionCount: 33, exceptionCount: 7 },
          { subjectId: 'subj_alevel_chemistry', sourceQuestionCount: 40, mappedQuestionCount: 40, exceptionCount: 0 },
          { subjectId: 'subj_alevel_biology', sourceQuestionCount: 40, mappedQuestionCount: 35, exceptionCount: 5 },
          { subjectId: 'subj_alevel_math', sourceQuestionCount: 55, mappedQuestionCount: 53, exceptionCount: 2 },
          { subjectId: 'subj_alevel_further_math', sourceQuestionCount: 55, mappedQuestionCount: 37, exceptionCount: 18 },
        ],
      },
    ]);
    expect(Object.keys(artifacts).some((file) => /database\/migrations/i.test(file))).toBe(false);
  });

  it('keeps mapping and reviewed-exception sets disjoint and exhaustive', () => {
    for (const manifest of [igcse, alevel]) {
      const mapped = manifest.subjects.flatMap((subject) => subject.mappedQuestionIds);
      const unresolved = manifest.subjects.flatMap((subject) => subject.exceptionQuestionIds);
      expect(new Set(mapped).size).toBe(mapped.length);
      expect(new Set(unresolved).size).toBe(unresolved.length);
      expect(mapped.filter((id) => new Set(unresolved).has(id))).toEqual([]);
      expect(mapped.length + unresolved.length).toBe(manifest.expectedNullTopicCohort);
    }
    expect(exceptions.exceptions).toHaveLength(54);
    expect(exceptions.familyCounts).toEqual({ 'cambridge-igcse': 22, 'cambridge-a-level': 32 });
  });

  it('fails closed on concepts missing from the current same-subject taxonomy', () => {
    expect(exceptions.exceptions.every((row) => row.reasonCode === 'taxonomy-gap')).toBe(true);
    expect(exceptions.exceptions.every((row) => row.reviewStatus === 'reviewed-unmapped')).toBe(true);
    expect(exceptions.exceptions.every((row) => row.requiredTaxonomyAction.startsWith('Add and review'))).toBe(true);
    expect(exceptions.exceptions.find((row) => row.questionId === 'q_igcse_chem_031')?.missingConcept).toBe('electrolysis');
    expect(exceptions.exceptions.find((row) => row.questionId === 'q_igcse_bio_034')?.missingConcept).toBe('coordination and response');
    expect(exceptions.exceptions.find((row) => row.questionId === 'q_alevel_phy_036')?.missingConcept).toBe('particle physics');
    expect(exceptions.exceptions.find((row) => row.questionId === 'q_alevel_fm_051')?.missingConcept).toBe('Maclaurin series and advanced integration techniques');
  });

  it('uses the canonical 55-row Mathematics source and excludes the separate plural-ID patch cohort', () => {
    const ids = alevel.subjects.flatMap((subject) => [...subject.mappedQuestionIds, ...subject.exceptionQuestionIds]);
    expect(ids.filter((id) => id.startsWith('q_alevel_math_'))).toHaveLength(55);
    expect(ids.some((id) => id.startsWith('q_alevel_maths_'))).toBe(false);
  });

  it('records source provenance and an evidence statement for every mapping group', () => {
    for (const manifest of [igcse, alevel]) {
      for (const subject of manifest.subjects) {
        for (const group of subject.mappingGroups) {
          expect(group.sourceFiles.length).toBeGreaterThan(0);
          expect(group.evidence.length).toBeGreaterThanOrEqual(40);
          expect(group.questionIds.length).toBeGreaterThan(0);
        }
      }
    }
  });
});
