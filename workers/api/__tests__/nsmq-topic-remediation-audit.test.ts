import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";

type Mapping = {
  questionId: string;
  subjectId: string;
  roundType: string;
  topicId: string;
  contentFingerprint: string;
};
type ExceptionRow = {
  questionId: string;
  subjectId: string;
  roundType: string;
  reasonCode: string;
  reviewNote: string;
  contentFingerprint: string;
};
type SubjectManifest = {
  sourceNullTopicCount: number;
  mappedCount: number;
  exceptionCount: number;
  roundTotals: Record<string, number>;
  mappings: Mapping[];
};
type BuiltAudit = {
  summary: {
    status: string;
    declaredOperationalNullTopicCount: number;
    repositoryReconstructedNullTopicCount: number;
    liveOnlyRowsRecoveredFromBaseSeed: number;
    mappedCount: number;
    exceptionCount: number;
    subjectTotals: Record<
      string,
      {
        sourceNullTopicCount: number;
        mappedCount: number;
        exceptionCount: number;
        roundTotals: Record<string, number>;
      }
    >;
  };
  subjectManifests: Record<string, SubjectManifest>;
  exceptionLedger: { exceptionCount: number; exceptions: ExceptionRow[] };
};
type Correction = {
  questionId: string;
  subjectId: string;
  roundType: string;
  proposedTopicId: string;
  changes: Array<{ field: string; before: string; after: string }>;
};
type Proposal = {
  status: string;
  authoritativeInventoryCount: number;
  existingTopicMappingCount: number;
  currentExceptionCount: number;
  proposedNewTopicCount: number;
  rowsCoveredByProposedTopics: number;
  rowsResolvedByExistingTopicAfterReview: number;
  correctedContentMappingCount: number;
  resolvedWithExceptionCount: number;
  finalDefensibleDispositionCount: number;
  unresolvedDispositionCount: number;
  proposals: Array<{
    subjectId: string;
    proposedTopicId: string;
    affectedQuestionIds: string[];
  }>;
  resolvedWithExceptions: Array<{
    questionId: string;
    subjectId: string;
    reasonCode: string;
    disposition: string;
  }>;
  contentCorrections: Correction[];
  migrationArtifactsCreated: boolean;
  sourceContentMutated: boolean;
};

const require = createRequire(import.meta.url);
const generator =
  require("../../../scripts/generate-nsmq-live-topic-remediation.cjs") as {
    LIVE_ONLY: Array<{
      questionId: string;
      subjectId: string;
      roundType: string;
      topicId: string;
    }>;
    buildLiveAudit: () => BuiltAudit;
  };
const proposalGenerator =
  require("../../../scripts/generate-nsmq-topic-taxonomy-proposals.cjs") as {
    buildProposal: () => Proposal;
    deriveDigitSolutions: () => number[];
  };
const auditTool =
  require("../../../scripts/audit-nsmq-topic-remediation.cjs") as {
    audit: () => {
      ok: boolean;
      problems: string[];
      inventory: number;
      currentMapped: number;
      currentExceptions: number;
      proposedTopicDispositions: number;
      correctedContentMappings: number;
      resolvedWithExceptions: number;
      finalDefensibleDispositions: number;
      unresolvedDispositions: number;
    };
  };
const manifestFiles = [
  "biology.json",
  "chemistry.json",
  "mathematics.json",
  "physics.json",
] as const;
const checkedManifests = Object.fromEntries(
  manifestFiles.map((file) => [
    file,
    JSON.parse(
      readFileSync(
        new URL(
          `../../../database/manifests/nsmq-topic-remediation/${file}`,
          import.meta.url,
        ),
        "utf8",
      ),
    ) as SubjectManifest,
  ]),
);

describe("NSMQ null-topic remediation audit artifacts", () => {
  it("covers the authoritative 375-row inventory exactly once with exact subject/round totals", () => {
    const built = generator.buildLiveAudit();
    const mappings = Object.values(built.subjectManifests).flatMap(
      (manifest) => manifest.mappings,
    );
    const ids = [
      ...mappings.map((row) => row.questionId),
      ...built.exceptionLedger.exceptions.map((row) => row.questionId),
    ];
    expect(ids).toHaveLength(375);
    expect(new Set(ids).size).toBe(375);
    expect(mappings).toHaveLength(360);
    expect(built.exceptionLedger.exceptions).toHaveLength(15);
    expect(built.summary).toMatchObject({
      status: "inventory-reconciled-reviewed-audit-no-migrations",
      declaredOperationalNullTopicCount: 375,
      repositoryReconstructedNullTopicCount: 370,
      liveOnlyRowsRecoveredFromBaseSeed: 5,
    });
    expect(built.summary.subjectTotals).toEqual({
      subj_nsmq_math: {
        sourceNullTopicCount: 92,
        mappedCount: 81,
        exceptionCount: 11,
        roundTotals: {
          problem_of_day: 20,
          riddles: 15,
          round_one: 30,
          speed_race: 7,
          true_false: 20,
        },
      },
      subj_nsmq_physics: {
        sourceNullTopicCount: 111,
        mappedCount: 108,
        exceptionCount: 3,
        roundTotals: {
          problem_of_day: 20,
          riddles: 15,
          round_one: 30,
          speed_race: 26,
          true_false: 20,
        },
      },
      subj_nsmq_chemistry: {
        sourceNullTopicCount: 86,
        mappedCount: 85,
        exceptionCount: 1,
        roundTotals: {
          problem_of_day: 20,
          riddles: 15,
          round_one: 30,
          true_false: 20,
          speed_race: 1,
        },
      },
      subj_nsmq_biology: {
        sourceNullTopicCount: 86,
        mappedCount: 86,
        exceptionCount: 0,
        roundTotals: {
          problem_of_day: 20,
          riddles: 15,
          round_one: 30,
          true_false: 20,
          speed_race: 1,
        },
      },
    });
  });

  it("recovers five live-only rows from explicit base-seed topic bindings", () => {
    const db = new Database(":memory:");
    db.exec(
      readFileSync(
        new URL("../../../database/schema.sql", import.meta.url),
        "utf8",
      ),
    );
    db.exec(
      readFileSync(
        new URL("../../../database/seeds/seed_base.sql", import.meta.url),
        "utf8",
      ),
    );
    for (const expected of generator.LIVE_ONLY)
      expect(
        db
          .prepare(
            "SELECT subject_id, round_type, topic_id FROM questions WHERE id = ?",
          )
          .get(expected.questionId),
      ).toEqual({
        subject_id: expected.subjectId,
        round_type: expected.roundType,
        topic_id: expected.topicId,
      });
    db.close();
  });

  it("keeps manifests deterministic and fingerprints exact source content", () => {
    const built = generator.buildLiveAudit();
    for (const file of manifestFiles)
      expect(checkedManifests[file]).toEqual(built.subjectManifests[file]);
    const mapping = built.subjectManifests["mathematics.json"].mappings.find(
      (row) => row.questionId === "q_speed_002",
    );
    const db = new Database(":memory:");
    db.exec(
      readFileSync(
        new URL("../../../database/schema.sql", import.meta.url),
        "utf8",
      ),
    );
    db.exec(
      readFileSync(
        new URL("../../../database/seed.sql", import.meta.url),
        "utf8",
      ),
    );
    const row = db
      .prepare(
        "SELECT id, subject_id, round_type, question_text, correct_answer, explanation FROM questions WHERE id = ?",
      )
      .get("q_speed_002") as Record<string, string>;
    db.close();
    expect(mapping?.contentFingerprint).toBe(
      createHash("sha256")
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
        .digest("hex"),
    );
  });

  it("derives the complete two-solution correction without mutating source", () => {
    expect(proposalGenerator.deriveDigitSolutions()).toEqual([6542, 9863]);
    const proposal = proposalGenerator.buildProposal();
    const correction = proposal.contentCorrections.find(
      (row) => row.questionId === "nsmq_math_rid_012",
    );
    expect(correction).toMatchObject({
      subjectId: "subj_nsmq_math",
      roundType: "riddles",
      proposedTopicId: "topic_nsmq_math_general_reasoning",
    });
    expect(
      correction?.changes.find((change) => change.field === "correct_answer"),
    ).toEqual({
      field: "correct_answer",
      before: "3624",
      after: "6542 or 9863",
    });
    const db = new Database(":memory:");
    db.exec(
      readFileSync(
        new URL("../../../database/schema.sql", import.meta.url),
        "utf8",
      ),
    );
    db.exec(
      readFileSync(
        new URL("../../../database/seed.sql", import.meta.url),
        "utf8",
      ),
    );
    const source = db
      .prepare(
        "SELECT question_text, correct_answer, explanation FROM questions WHERE id = ?",
      )
      .get("nsmq_math_rid_012") as Record<string, string>;
    db.close();
    for (const change of correction?.changes ?? [])
      expect(source[change.field]).toBe(change.before);
    expect(proposal.sourceContentMutated).toBe(false);
  });

  it("keeps non-Physics riddles as explicit exceptions and closes all dispositions truthfully", () => {
    const proposal = proposalGenerator.buildProposal();
    expect(proposal).toMatchObject({
      status: "proposal-only-final-dispositions-no-migrations",
      authoritativeInventoryCount: 375,
      existingTopicMappingCount: 360,
      currentExceptionCount: 15,
      proposedNewTopicCount: 4,
      rowsCoveredByProposedTopics: 12,
      rowsResolvedByExistingTopicAfterReview: 1,
      correctedContentMappingCount: 1,
      resolvedWithExceptionCount: 2,
      finalDefensibleDispositionCount: 375,
      unresolvedDispositionCount: 0,
      migrationArtifactsCreated: false,
    });
    expect(
      proposal.proposals.some(
        (row) =>
          row.subjectId === "subj_nsmq_physics" &&
          /general.reasoning/i.test(row.proposedTopicId),
      ),
    ).toBe(false);
    expect(proposal.resolvedWithExceptions).toEqual([
      expect.objectContaining({
        questionId: "nsmq_phy_rid_001",
        reasonCode: "misclassified_general_riddle",
        disposition: "pending_separate_general_reasoning_bank",
      }),
      expect.objectContaining({
        questionId: "nsmq_phy_rid_003",
        reasonCode: "misclassified_general_riddle",
        disposition: "pending_separate_general_reasoning_bank",
      }),
    ]);
    expect(
      readdirSync(
        new URL("../../../database/migrations/", import.meta.url),
      ).filter((file) => /nsmq.*topic.*remediation/i.test(file)),
    ).toEqual([
      "267_nsmq_topic_remediation_part_1.sql",
      "268_nsmq_topic_remediation_part_2.sql",
      "269_nsmq_topic_remediation_part_3.sql",
      "270_nsmq_topic_remediation_part_4.sql",
    ]);
    expect(auditTool.audit()).toMatchObject({
      ok: true,
      problems: [],
      inventory: 375,
      currentMapped: 360,
      currentExceptions: 15,
      proposedTopicDispositions: 12,
      correctedContentMappings: 1,
      resolvedWithExceptions: 2,
      finalDefensibleDispositions: 375,
      unresolvedDispositions: 0,
    });
  });
});
