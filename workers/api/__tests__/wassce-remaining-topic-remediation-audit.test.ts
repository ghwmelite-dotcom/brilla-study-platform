import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

type MappingGroup = {
  topicId: string;
  evidenceBasis: string;
  evidence: string;
  questionIds: string[];
};
type ExceptionGroup = {
  reasonCode: string;
  reason: string;
  evidenceBasis: string;
  evidence: string;
  questionIds: string[];
};
type SubjectManifest = {
  release: string;
  subjectId: string;
  subjectName: string;
  expectedNullTopicCount: number;
  mappedQuestionCount: number;
  exceptionCount: number;
  mappingGroups: MappingGroup[];
  reviewedExceptions: ExceptionGroup[];
};
type TaxonomyProposal = {
  proposedTopicCount: number;
  proposedQuestionCount: number;
  residualExceptionCount: number;
  liveInventoryOverlay: {
    repositoryFixtureNullTopicCount: number;
    authoritativeProductionNullTopicCount: number;
    excludedRepoOnlyCount: number;
    excludedRepoOnlyQuestionIds: string[];
  };
  topics: Array<{
    topicId: string;
    subjectId: string;
    officialSources: Array<{
      authority: string;
      title: string;
      url: string;
    }>;
    questionIds: string[];
  }>;
};
type ExceptionLedger = {
  totalExpectedNullTopicCount: number;
  totalMappedQuestionCount: number;
  totalExceptionCount: number;
  subjects: Array<{
    subjectId: string;
    exceptionCount: number;
    reviewedExceptions: ExceptionGroup[];
  }>;
};

const require = createRequire(import.meta.url);
const generator =
  require("../../../scripts/generate-wassce-remaining-topic-remediation.cjs") as {
    OUTPUT_DIR: string;
    REPO_ONLY_EXCLUDED_IDS: string[];
    buildSubjectManifests: () => SubjectManifest[];
    buildExceptionLedger: (manifests?: SubjectManifest[]) => ExceptionLedger;
    buildTaxonomyProposal: (manifests?: SubjectManifest[]) => TaxonomyProposal;
  };

const expectedCounts: Record<string, [number, number, number]> = {
  subj_wassce_accounting: [105, 105, 0],
  subj_wassce_biology: [130, 130, 0],
  subj_wassce_chemistry: [150, 150, 0],
  subj_wassce_core_math: [100, 100, 0],
  subj_wassce_crs: [105, 105, 0],
  subj_wassce_economics: [115, 115, 0],
  subj_wassce_english: [100, 100, 0],
  subj_wassce_foods: [20, 20, 0],
  subj_wassce_geography: [115, 115, 0],
  subj_wassce_government: [110, 110, 0],
  subj_wassce_history: [25, 25, 0],
  subj_wassce_ict: [5, 5, 0],
  subj_wassce_int_science: [100, 100, 0],
  subj_wassce_literature: [105, 105, 0],
  subj_wassce_physics: [115, 115, 0],
  subj_wassce_social: [100, 100, 0],
};

describe("remaining WASSCE null-topic audit artifacts", () => {
  it("keeps deterministic subject-bounded totals and excludes Elective Mathematics", () => {
    const manifests = generator.buildSubjectManifests();
    expect(manifests).toHaveLength(16);
    expect(manifests.map((manifest) => manifest.subjectId)).not.toContain(
      "subj_wassce_elect_math",
    );
    for (const manifest of manifests) {
      expect([
        manifest.expectedNullTopicCount,
        manifest.mappedQuestionCount,
        manifest.exceptionCount,
      ]).toEqual(expectedCounts[manifest.subjectId]);
      expect(manifest.mappedQuestionCount + manifest.exceptionCount).toBe(
        manifest.expectedNullTopicCount,
      );
    }
  });

  it("keeps checked JSON artifacts identical to the generator", () => {
    const manifests = generator.buildSubjectManifests();
    const filenames = readdirSync(generator.OUTPUT_DIR)
      .filter((name) => name.endsWith(".json"))
      .sort();
    expect(filenames).toHaveLength(18);
    for (const manifest of manifests) {
      const filename = `${manifest.subjectId.replace(/^subj_wassce_/, "")}.json`;
      expect(
        JSON.parse(readFileSync(`${generator.OUTPUT_DIR}/${filename}`, "utf8")),
      ).toEqual(manifest);
    }
    expect(
      JSON.parse(
        readFileSync(
          `${generator.OUTPUT_DIR}/reviewed-exceptions.json`,
          "utf8",
        ),
      ),
    ).toEqual(generator.buildExceptionLedger(manifests));
    expect(
      JSON.parse(
        readFileSync(`${generator.OUTPUT_DIR}/taxonomy-proposals.json`, "utf8"),
      ),
    ).toEqual(generator.buildTaxonomyProposal(manifests));
  });

  it("reconciles the authoritative live overlay and eliminates avoidable exceptions", () => {
    const ledger = generator.buildExceptionLedger();
    expect(ledger.totalExpectedNullTopicCount).toBe(1500);
    expect(ledger.totalMappedQuestionCount).toBe(1500);
    expect(ledger.totalExceptionCount).toBe(0);
    expect(ledger.subjects).toEqual([]);

    expect(generator.REPO_ONLY_EXCLUDED_IDS).toHaveLength(69);
    expect(new Set(generator.REPO_ONLY_EXCLUDED_IDS)).toHaveProperty(
      "size",
      69,
    );

    const proposal = generator.buildTaxonomyProposal();
    expect(proposal.proposedTopicCount).toBe(20);
    expect(proposal.proposedQuestionCount).toBe(536);
    expect(proposal.residualExceptionCount).toBe(0);
    expect(proposal.liveInventoryOverlay).toMatchObject({
      repositoryFixtureNullTopicCount: 1569,
      authoritativeProductionNullTopicCount: 1500,
      excludedRepoOnlyCount: 69,
    });
    expect(proposal.topics).toHaveLength(20);
    const questionIds = proposal.topics.flatMap((topic) => topic.questionIds);
    expect(questionIds).toHaveLength(536);
    expect(new Set(questionIds).size).toBe(536);
    for (const topic of proposal.topics) {
      expect(topic.officialSources.length).toBeGreaterThan(0);
      for (const source of topic.officialSources) {
        expect(source.url).toMatch(
          /^https:\/\/(?:www\.)?(?:nacca\.gov\.gh|waecgh\.org|waeconline\.org\.ng)\//,
        );
      }
    }
  });

  it("passes the independent repository fixture audit", () => {
    const output = execFileSync(
      process.execPath,
      ["scripts/audit-wassce-remaining-topic-remediation.cjs"],
      {
        cwd: new URL("../../..", import.meta.url),
        encoding: "utf8",
      },
    );
    const result = JSON.parse(output) as {
      total: number;
      mapped: number;
      exceptions: number;
      proposedTopics: number;
      proposedQuestionMappings: number;
      subjects: unknown[];
    };
    expect(result).toMatchObject({
      repositoryFixtureTotal: 1569,
      excludedRepoOnly: 69,
      total: 1500,
      mapped: 1500,
      exceptions: 0,
      proposedTopics: 20,
      proposedQuestionMappings: 536,
    });
    expect(result.subjects).toHaveLength(16);
  });

  it("does not allocate numbered migration artifacts in this audit slice", () => {
    const source = readFileSync(
      new URL(
        "../../../scripts/generate-wassce-remaining-topic-remediation.cjs",
        import.meta.url,
      ),
      "utf8",
    );
    expect(source).not.toMatch(/database[\\/]migrations/);
    expect(source).not.toMatch(/database[\\/]rollbacks/);
  });
});
