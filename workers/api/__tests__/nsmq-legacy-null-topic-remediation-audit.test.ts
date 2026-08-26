import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

type SourceRow = {
  id: string;
  subject_id: string;
  round_type: string;
  question_text: string;
  correct_answer: string;
  explanation: string | null;
};

type Mapping = {
  questionId: string;
  subjectId: string;
  roundType: string;
  topicId: string;
  evidenceCode: string;
  evidence: string;
  sourceContentFingerprint: string;
  migrationId: string;
};

type Quarantine = {
  questionId: string;
  subjectId: string;
  roundType: string;
  reasonCode: string;
  reviewNote: string;
  sourceContentFingerprint: string;
};

type Plan = {
  authoritativeNullTopicCount: number;
  mappingCount: number;
  quarantineCount: number;
  unresolvedCount: number;
  chunkSizes: number[];
  migrationIds: string[];
  sourceInventoryHash: string;
  subjectTotals: Record<string, number>;
  topicCounts: Record<string, number>;
  evidenceDefinitions: Record<string, string>;
  mappings: Mapping[];
  quarantines: Quarantine[];
};

const require = createRequire(import.meta.url);
const generator = require(
  "../../../scripts/generate-nsmq-legacy-null-topic-remediation.cjs",
) as {
  auditArtifacts: () => {
    ok: boolean;
    dispositions: number;
    mappings: number;
    quarantines: number;
    unresolved: number;
    problems: string[];
  };
  buildPlan: () => Plan & { parts: Array<{ rows: Mapping[] }> };
  loadArchiveRows: () => SourceRow[];
  renderFiles: (plan: Plan) => Map<string, string>;
};

const manifestPath = new URL(
  "../../../database/manifests/nsmq-topic-remediation/legacy-null-topic-plan-278-280.json",
  import.meta.url,
);
const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Plan;

function fingerprint(row: SourceRow): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        id: row.id,
        subjectId: row.subject_id,
        roundType: row.round_type,
        questionText: row.question_text,
        correctAnswer: row.correct_answer,
        explanation: row.explanation,
      }),
    )
    .digest("hex");
}

describe("legacy NSMQ null-topic remediation audit", () => {
  it("has one exact disposition for all 270 staging-verified identities", () => {
    expect(manifest).toMatchObject({
      authoritativeNullTopicCount: 270,
      mappingCount: 268,
      quarantineCount: 2,
      unresolvedCount: 0,
      chunkSizes: [90, 90, 88],
      migrationIds: [
        "278_nsmq_legacy_null_topic_part_1",
        "279_nsmq_legacy_null_topic_part_2",
        "280_nsmq_legacy_null_topic_part_3",
      ],
      subjectTotals: {
        subj_nsmq_biology: 75,
        subj_nsmq_chemistry: 75,
        subj_nsmq_math: 69,
        subj_nsmq_physics: 51,
      },
    });

    const dispositions = [
      ...manifest.mappings.map((row) => row.questionId),
      ...manifest.quarantines.map((row) => row.questionId),
    ];
    expect(dispositions).toHaveLength(270);
    expect(new Set(dispositions).size).toBe(270);
    expect(manifest.mappings).toHaveLength(268);
    expect(manifest.mappings.every((row) => row.roundType === "speed_race")).toBe(
      true,
    );
  });

  it("quarantines only the two reviewed non-subject riddles", () => {
    expect(manifest.quarantines).toEqual([
      expect.objectContaining({
        questionId: "nsmq_phy_rid_001",
        subjectId: "subj_nsmq_physics",
        roundType: "riddles",
        reasonCode: "MISCLASSIFIED_NON_SUBJECT_CONTENT",
      }),
      expect.objectContaining({
        questionId: "nsmq_phy_rid_003",
        subjectId: "subj_nsmq_physics",
        roundType: "riddles",
        reasonCode: "MISCLASSIFIED_NON_SUBJECT_CONTENT",
      }),
    ]);
    expect(
      manifest.quarantines.every(
        (row) => row.reviewNote.length > 20 && row.sourceContentFingerprint.length === 64,
      ),
    ).toBe(true);
  });

  it("binds every disposition to the reviewed archived source fingerprint", () => {
    const sourceById = new Map(
      generator.loadArchiveRows().map((row) => [row.id, fingerprint(row)]),
    );
    for (const row of [...manifest.mappings, ...manifest.quarantines]) {
      expect(row.sourceContentFingerprint).toBe(sourceById.get(row.questionId));
    }
  });

  it("keeps the public manifest free of question-bank content", () => {
    const forbidden = new Set([
      "questionText",
      "question_text",
      "correctAnswer",
      "correct_answer",
      "explanation",
      "options",
    ]);
    for (const row of [...manifest.mappings, ...manifest.quarantines]) {
      expect(Object.keys(row).filter((key) => forbidden.has(key))).toEqual([]);
    }
    expect(
      manifest.mappings.every(
        (row) =>
          row.evidence.length > 20 &&
          manifest.evidenceDefinitions[row.evidenceCode] === row.evidence,
      ),
    ).toBe(true);
  });

  it("renders deterministic artifacts and passes the generator audit", () => {
    const renderedPlan = generator.buildPlan();
    const renderedFiles = generator.renderFiles(renderedPlan);
    for (const [target, content] of renderedFiles) {
      expect(readFileSync(target, "utf8")).toBe(content);
    }
    expect(generator.auditArtifacts()).toEqual({
      ok: true,
      dispositions: 270,
      mappings: 268,
      quarantines: 2,
      unresolved: 0,
      problems: [],
    });
  });
});
