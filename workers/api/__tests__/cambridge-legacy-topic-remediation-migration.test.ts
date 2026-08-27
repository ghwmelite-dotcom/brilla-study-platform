import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import type { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";

type Generator = {
  buildArtifacts: () => {
    model: {
      mappings: Array<{ questionId: string; subjectId: string; topicId: string }>;
      corrections: unknown[];
      source: unknown[];
      target: Array<{ topic_id: string | null }>;
      topics: unknown[];
      logs: unknown[];
    };
    artifacts: Record<string, string>;
  };
  fixture: () => DatabaseSync;
  MIGRATION_FILE: string;
  ROLLBACK_FILE: string;
  PREFLIGHT_FILE: string;
  POSTFLIGHT_FILE: string;
  MANIFEST_FILE: string;
};

const require = createRequire(import.meta.url);
const generator = require(
  "../../../scripts/generate-cambridge-legacy-topic-release.cjs",
) as Generator;
const audit = require(
  "../../../scripts/audit-cambridge-legacy-topic-remediation.cjs",
) as { audit: () => Record<string, unknown> };

const scratchPattern = /^_(?:m281|t281|g281|qf281|tf281|lf281)$/;
function scratchTables(db: DatabaseSync): string[] {
  return (db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all() as Array<{ name: string }>)
    .map((row) => row.name)
    .filter((name) => scratchPattern.test(name));
}

function snapshot(db: DatabaseSync): string {
  return JSON.stringify({
    questions: db.prepare(
      "SELECT id,topic_id,correct_answer,explanation FROM questions WHERE id LIKE 'q_alevel_maths_%' OR id IN ('q_alevel_bio_028','q_alevel_bio_029','q_alevel_fm_051','q_alevel_fm_052','q_alevel_fm_053') ORDER BY id",
    ).all(),
    topics: db.prepare("SELECT * FROM topics ORDER BY id").all(),
    logs: db.prepare("SELECT * FROM question_bank_remediation_log ORDER BY migration_id,entity_id,field_name").all(),
  });
}

function expectCambridgeCatalogueCountsMatch(db: DatabaseSync): void {
  const rows = db.prepare(`
    SELECT s.id,
           (SELECT COUNT(*) FROM questions q WHERE q.subject_id=s.id) raw_count,
           (SELECT COUNT(*) FROM questions q JOIN topics t ON t.id=q.topic_id WHERE q.subject_id=s.id AND t.subject_id=s.id) topic_summed_count
    FROM subjects s
    WHERE s.exam_type_id IN ('igcse','cambridge_a2')
    ORDER BY s.id
  `).all() as Array<{ id: string; raw_count: number; topic_summed_count: number }>;
  expect(rows.length).toBeGreaterThan(0);
  expect(rows.filter((row) => row.raw_count !== row.topic_summed_count)).toEqual([]);
}

describe("migration 281 Cambridge legacy topic remediation", () => {
  it("keeps canonical artifacts deterministic, regular-table-only and under D1 limits", () => {
    const { model, artifacts } = generator.buildArtifacts();
    expect(model.source).toHaveLength(45);
    expect(model.mappings).toHaveLength(45);
    expect(model.mappings.filter((row) => row.questionId.startsWith("q_alevel_maths_"))).toHaveLength(40);
    expect(model.mappings.filter((row) => !row.questionId.startsWith("q_alevel_maths_"))).toHaveLength(5);
    expect(model.target.every((row) => row.topic_id !== null)).toBe(true);
    expect(model.topics).toHaveLength(2);
    expect(model.corrections).toHaveLength(2);
    expect(model.logs).toHaveLength(49);

    for (const [file, content] of Object.entries(artifacts)) {
      expect(readFileSync(new URL(`../../../${file}`, import.meta.url), "utf8")).toBe(content);
      if (file.includes("281_cambridge_legacy_topic_remediation")) {
        expect(content).not.toMatch(/CREATE TEMP/i);
        expect(content).not.toMatch(/CREATE TEMP TABLE\s+\S+\s+AS/i);
      }
    }
    expect(Buffer.byteLength(artifacts[generator.MIGRATION_FILE], "utf8")).toBeLessThan(19_500);
    expect(Buffer.byteLength(artifacts[generator.ROLLBACK_FILE], "utf8")).toBeLessThan(19_500);
  }, 60_000);

  it("passes manifest audit and resolves every reviewed row without a catalogue filter", () => {
    expect(audit.audit()).toEqual({
      release: "cambridge-legacy-topic-remediation-2026-08-26",
      sourceQuestions: 45,
      legacyMathematicsMapped: 40,
      priorExceptionsResolved: 5,
      retainedExceptions: 0,
      newTopics: 2,
      contentCorrections: 2,
      exactLedgerRows: 49,
      catalogueFilterRequired: false,
    });
  }, 30_000);

  it("applies and replays exactly, aligns raw and usable Cambridge counts, and leaves no scratch", () => {
    const { artifacts } = generator.buildArtifacts();
    const db = generator.fixture();
    db.exec(artifacts[generator.PREFLIGHT_FILE]);
    expect(scratchTables(db)).toEqual([]);
    db.exec(artifacts[generator.MIGRATION_FILE]);
    expect(scratchTables(db)).toEqual([]);
    db.exec(artifacts[generator.MIGRATION_FILE]);
    expect(scratchTables(db)).toEqual([]);
    db.exec(artifacts[generator.POSTFLIGHT_FILE]);
    expect(scratchTables(db)).toEqual([]);
    expectCambridgeCatalogueCountsMatch(db);
    expect(db.prepare("SELECT COUNT(*) count FROM questions WHERE subject_id IN ('subj_alevel_math','subj_alevel_biology','subj_alevel_further_math') AND topic_id IS NULL").get()).toEqual({ count: 0 });
    expect(db.prepare("SELECT COUNT(*) count FROM question_bank_remediation_log WHERE migration_id='281_cambridge_legacy_topic_remediation'").get()).toEqual({ count: 49 });
    expect(db.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
    db.close();
  }, 120_000);

  it("rolls back and replays the rollback exactly without residue", () => {
    const { artifacts } = generator.buildArtifacts();
    const db = generator.fixture();
    const before = snapshot(db);
    db.exec(artifacts[generator.MIGRATION_FILE]);
    db.exec(artifacts[generator.ROLLBACK_FILE]);
    expect(snapshot(db)).toBe(before);
    expect(scratchTables(db)).toEqual([]);
    db.exec(artifacts[generator.ROLLBACK_FILE]);
    expect(snapshot(db)).toBe(before);
    expect(scratchTables(db)).toEqual([]);
    expect(db.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
    db.close();
  }, 120_000);

  it("fails closed on content drift and scratch-name collisions", () => {
    const { artifacts } = generator.buildArtifacts();
    const drift = generator.fixture();
    drift.prepare("UPDATE questions SET explanation='tampered' WHERE id='q_alevel_maths_001'").run();
    expect(() => drift.exec(artifacts[generator.PREFLIGHT_FILE])).toThrow();
    drift.close();

    const collision = generator.fixture();
    collision.exec("CREATE TABLE _m281(id TEXT)");
    expect(() => collision.exec(artifacts[generator.MIGRATION_FILE])).toThrow();
    collision.close();
  }, 30_000);
});
