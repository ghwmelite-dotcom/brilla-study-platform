import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('subject coverage matrix', () => {
  it('is internally consistent and references only declared official sources', async () => {
    const matrix = JSON.parse(await readFile(resolve('content/subject-coverage-matrix.json'), 'utf8')) as {
      officialSources: Array<{ id: string; url: string }>;
      subjects: Array<{ id: string; decision: string; sources: string[]; replacementSubjects?: Array<{ id: string }> }>;
      summary: Record<string, number>;
    };
    const sourceIds = new Set(matrix.officialSources.map((source) => source.id));
    const subjectIds = matrix.subjects.map((subject) => subject.id);
    expect(new Set(subjectIds).size).toBe(subjectIds.length);
    expect(matrix.officialSources.every((source) => source.url.startsWith('https://'))).toBe(true);
    expect(matrix.subjects.flatMap((subject) => subject.sources).every((source) => sourceIds.has(source))).toBe(true);

    const populate = matrix.subjects.filter((subject) => subject.decision === 'populate');
    const split = matrix.subjects.filter((subject) => subject.decision === 'split');
    const retire = matrix.subjects.filter((subject) => subject.decision === 'retire');
    const languageBanks = split.flatMap((subject) => subject.replacementSubjects ?? []);
    expect(populate).toHaveLength(matrix.summary.populateExisting);
    expect(split).toHaveLength(matrix.summary.splitExisting);
    expect(retire).toHaveLength(matrix.summary.retireExisting);
    expect(languageBanks).toHaveLength(matrix.summary.languageBanksAfterSplit);
    expect(populate.length + languageBanks.length).toBe(matrix.summary.validTargetBanksAfterCatalogueCorrection);
  });
});
