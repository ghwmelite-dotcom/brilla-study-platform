import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const Database = require("better-sqlite3");
const generated = require("../../../scripts/generate-nsmq-pre278-reconciliation.cjs");
const { plan } = generated.model();
const files = generated.renderFiles() as Map<string, string>;
const byName = (name: string) => [...files].find(([file]) => file.replaceAll("\\", "/").endsWith(name))![1];

function database(mode: "legacy" | "post278") {
  const db = new Database(":memory:");
  db.exec(`PRAGMA foreign_keys=ON;
    CREATE TABLE subjects(id TEXT PRIMARY KEY,exam_type_id TEXT NOT NULL,is_active INTEGER NOT NULL);
    CREATE TABLE topics(id TEXT PRIMARY KEY,subject_id TEXT NOT NULL REFERENCES subjects(id));
    CREATE TABLE questions(id TEXT PRIMARY KEY,subject_id TEXT NOT NULL REFERENCES subjects(id),round_type TEXT NOT NULL,topic_id TEXT REFERENCES topics(id));
    CREATE TABLE d1_migrations(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL UNIQUE);
    CREATE TABLE question_bank_remediation_log(id INTEGER PRIMARY KEY AUTOINCREMENT,migration_id TEXT NOT NULL,entity_type TEXT NOT NULL,entity_id TEXT NOT NULL,field_name TEXT NOT NULL,old_value TEXT,new_value TEXT,UNIQUE(migration_id,entity_type,entity_id,field_name));`);
  for (const name of generated.PRE278_LEDGER) db.prepare("INSERT INTO d1_migrations(name) VALUES (?)").run(name);
  if (mode === "post278") for (const name of generated.POST278_LEDGER) db.prepare("INSERT INTO d1_migrations(name) VALUES (?)").run(name);
  const priorCounts = [["267_nsmq_topic_remediation_part_1", 103], ["268_nsmq_topic_remediation_part_2", 100], ["269_nsmq_topic_remediation_part_3", 100], ["270_nsmq_topic_remediation_part_4", 73]] as const;
  for (const [migration, count] of priorCounts) for (let index = 0; index < count; index += 1) db.prepare("INSERT INTO question_bank_remediation_log(migration_id,entity_type,entity_id,field_name,old_value,new_value) VALUES (?,'question',?,'topic_id',NULL,'prior')").run(migration, `${migration}_${index}`);  const subjects = new Set([...plan.mappings, ...plan.quarantines].map((row: any) => row.subjectId));
  for (const subject of subjects) db.prepare("INSERT INTO subjects VALUES (?,'exam_nsmq',1)").run(subject);
  const topicOwners = new Map<string, string>();
  for (const row of plan.mappings) topicOwners.set(row.topicId, row.subjectId);
  topicOwners.set(generated.LEGACY_TOPIC, "subj_nsmq_chemistry");
  for (const [topic, subject] of topicOwners) db.prepare("INSERT INTO topics VALUES (?,?)").run(topic, subject);
  for (const row of plan.mappings) {
    const topic = mode === "post278" ? row.topicId : row.questionId === generated.QUESTION_ID ? generated.LEGACY_TOPIC : null;
    db.prepare("INSERT INTO questions VALUES (?,?,?,?)").run(row.questionId, row.subjectId, row.roundType, topic);
    if (mode === "post278") db.prepare("INSERT INTO question_bank_remediation_log(migration_id,entity_type,entity_id,field_name,old_value,new_value) VALUES (?,'question',?,'topic_id',NULL,?)").run(row.migrationId, row.questionId, row.topicId);
  }
  for (const row of plan.quarantines) db.prepare("INSERT INTO questions VALUES (?,?,?,NULL)").run(row.questionId, row.subjectId, row.roundType);
  if (mode === "legacy") db.prepare("INSERT INTO question_bank_remediation_log(migration_id,entity_type,entity_id,field_name,old_value,new_value) VALUES ('102_nsmq_question_alignment','question',?,'topic_id','topic_wchem_atomic',?)").run(generated.QUESTION_ID, generated.LEGACY_TOPIC);
  return db;
}

const apply = (db: any, name: string) => db.transaction(() => db.exec(byName(name)))();
const forward = (db: any) => generated.FLIGHT_FILES.forEach((name: string) => { try { apply(db, `/nsmq-pre278/${name}`); } catch (error) { throw new Error(`${name}: ${String(error)}`); } });

describe("NSMQ pre-278 one-row reconciliation", () => {
  it("corrects only the exact legacy row, retains bounded evidence, replays, and rolls back before 278", () => {
    const db = database("legacy");
    forward(db);
    expect(db.prepare("SELECT topic_id FROM questions WHERE id=?").get(generated.QUESTION_ID).topic_id).toBeNull();
    expect(db.prepare("SELECT mode,status,next_step FROM nsmq_pre278_reconcile_state").get()).toEqual({ mode: "legacy", status: "completed", next_step: 2 });
    expect(db.prepare("SELECT count(*) c FROM nsmq_pre278_reconcile_backup").get().c).toBe(1);
    expect(db.prepare("SELECT count(*) c FROM nsmq_pre278_reconcile_audit").get().c).toBe(1);
    forward(db);
    apply(db, "/rollback/01_restore_legacy_topic.sql");
    expect(db.prepare("SELECT topic_id FROM questions WHERE id=?").get(generated.QUESTION_ID).topic_id).toBe(generated.LEGACY_TOPIC);
    expect(db.prepare("SELECT status FROM nsmq_pre278_reconcile_state").get().status).toBe("rolled_back");
    db.close();
  });

  it("is an exact post-278 no-op and cleanup drops only release-owned tables", () => {
    const db = database("post278");
    forward(db);
    expect(db.prepare("SELECT mode,status FROM nsmq_pre278_reconcile_state").get()).toEqual({ mode: "reviewed_noop", status: "completed" });
    expect(db.prepare("SELECT count(*) c FROM nsmq_pre278_reconcile_backup").get().c).toBe(0);
    expect(db.prepare("SELECT count(*) c FROM nsmq_pre278_reconcile_audit").get().c).toBe(0);
    apply(db, "/99_cleanup_after_release.sql");
    expect(db.prepare("SELECT count(*) c FROM sqlite_master WHERE name LIKE 'nsmq_pre278_reconcile_%'").get().c).toBe(0);
    expect(db.prepare("SELECT count(*) c FROM questions").get().c).toBe(270);
    db.close();
  });

  it.each([
    ["wrong id", (db: any) => db.prepare("UPDATE questions SET id='wrong' WHERE id=?").run(generated.QUESTION_ID)],
    ["wrong subject", (db: any) => db.prepare("UPDATE questions SET subject_id='subj_nsmq_math' WHERE id=?").run(generated.QUESTION_ID)],
    ["wrong round", (db: any) => db.prepare("UPDATE questions SET round_type='riddles' WHERE id=?").run(generated.QUESTION_ID)],
    ["wrong legacy topic", (db: any) => db.prepare("UPDATE questions SET topic_id=NULL WHERE id=?").run(generated.QUESTION_ID)],
    ["missing historical evidence", (db: any) => db.prepare("DELETE FROM question_bank_remediation_log WHERE migration_id='102_nsmq_question_alignment'").run()],
  ])("fails closed for %s", (_label, corrupt) => {
    const db = database("legacy");
    corrupt(db);
    expect(() => forward(db)).toThrow();
    expect(db.prepare("SELECT topic_id FROM questions WHERE id=?").get(generated.QUESTION_ID)?.topic_id).not.toBe(generated.TARGET_TOPIC);
    db.close();
  });

  it.each([
    ["legacy topic ownership", (db: any) => db.prepare("UPDATE topics SET subject_id='subj_nsmq_math' WHERE id=?").run(generated.LEGACY_TOPIC)],
    ["inactive owner", (db: any) => db.prepare("UPDATE subjects SET is_active=0 WHERE id='subj_nsmq_chemistry'").run()],
    ["wrong exam owner", (db: any) => db.prepare("UPDATE subjects SET exam_type_id='exam_wassce' WHERE id='subj_nsmq_chemistry'").run()],
    ["missing migration 270", (db: any) => db.prepare("DELETE FROM d1_migrations WHERE name='270_nsmq_topic_remediation_part_4.sql'").run()],
    ["migration 278 already present on legacy shape", (db: any) => db.prepare("INSERT INTO d1_migrations(name) VALUES ('278_nsmq_legacy_null_topic_part_1.sql')").run()],
  ])("rejects wrong ownership or ledger stage: %s", (_label, corrupt) => {
    const db = database("legacy");
    corrupt(db);
    expect(() => forward(db)).toThrow();
    expect(db.prepare("SELECT count(*) c FROM sqlite_master WHERE name LIKE 'nsmq_pre278_reconcile_%'").get().c).toBe(0);
    expect(db.prepare("SELECT topic_id FROM questions WHERE id=?").get(generated.QUESTION_ID).topic_id).toBe(generated.LEGACY_TOPIC);
    db.close();
  });

  it("allows unchanged canonical migration 278 immediately after the legacy flight", () => {
    const db = database("legacy");
    forward(db);
    const migration278 = readFileSync(new URL("../../../database/migrations/278_nsmq_legacy_null_topic_part_1.sql", import.meta.url), "utf8");
    const marker = "INSERT INTO _nsmq_legacy_278_guard(valid)";
    const markerIndex = migration278.indexOf(marker);
    expect(markerIndex).toBeGreaterThan(0);
    db.exec(migration278.slice(0, markerIndex));
    expect(db.prepare("SELECT count(*) c FROM _nsmq_legacy_278_expected").get().c).toBe(90);
    expect(db.prepare("SELECT count(*) c FROM questions q JOIN _nsmq_legacy_278_expected e ON e.q=q.id WHERE q.topic_id IS NULL").get().c).toBe(90);
    expect(db.prepare("SELECT q,s,k FROM _nsmq_legacy_278_expected WHERE t IS NULL").all()).toEqual([]);
    db.exec(migration278.slice(markerIndex));
    db.prepare("INSERT INTO d1_migrations(name) VALUES ('278_nsmq_legacy_null_topic_part_1.sql')").run();
    expect(db.prepare("SELECT topic_id FROM questions WHERE id=?").get(generated.QUESTION_ID).topic_id).toBe(generated.TARGET_TOPIC);
    expect(db.prepare("SELECT old_value,new_value FROM question_bank_remediation_log WHERE migration_id='278_nsmq_legacy_null_topic_part_1' AND entity_id=?").get(generated.QUESTION_ID)).toEqual({ old_value: null, new_value: generated.TARGET_TOPIC });
    db.close();
  });
  it("stops on a mid-flight state mismatch and recovers only after exact repair", () => {
    const db = database("legacy");
    apply(db, "/00_expected_part_1.sql");
    apply(db, "/01_expected_part_2.sql");
    apply(db, "/02_expected_part_3.sql");
    apply(db, "/03_preflight.sql");
    apply(db, "/04_reconcile.sql");
    db.prepare("UPDATE nsmq_pre278_reconcile_backup SET old_topic_id='corrupt'").run();
    expect(() => apply(db, "/90_postflight.sql")).toThrow();
    db.prepare("UPDATE nsmq_pre278_reconcile_backup SET old_topic_id=?").run(generated.LEGACY_TOPIC);
    apply(db, "/90_postflight.sql");
    db.close();
  });

  it("stops before state change on a missing expected-scope chunk and recovers by exact replay", () => {
    const db = database("legacy");
    apply(db, "/00_expected_part_1.sql");
    apply(db, "/01_expected_part_2.sql");
    expect(() => apply(db, "/03_preflight.sql")).toThrow();
    expect(db.prepare("SELECT count(*) c FROM sqlite_master WHERE name LIKE 'nsmq_pre278_reconcile_%'").get().c).toBe(0);
    expect(db.prepare("SELECT topic_id FROM questions WHERE id=?").get(generated.QUESTION_ID).topic_id).toBe(generated.LEGACY_TOPIC);
    forward(db);
    expect(db.prepare("SELECT topic_id FROM questions WHERE id=?").get(generated.QUESTION_ID).topic_id).toBeNull();
    db.close();
  });

  it("keeps every generated SQL artifact below the conservative remote D1 byte budget", () => {
    const sqlFiles = [...files].filter(([file]) => file.endsWith(".sql"));
    for (const [file, content] of sqlFiles) {
      const crlf = content.replaceAll("\r\n", "\n").replaceAll("\n", "\r\n");
      expect(Buffer.byteLength(crlf, "utf8"), file).toBeLessThan(19_500);
    }
  });
  it("pins runner targets/order and leaves rollback and cleanup outside the flight", () => {
    const runner = byName("/run-flight.cjs");
    expect(generated.FLIGHT_FILES).toEqual(["00_expected_part_1.sql", "01_expected_part_2.sql", "02_expected_part_3.sql", "03_preflight.sql", "04_reconcile.sql", "90_postflight.sql"]);
    expect(runner).toContain("aa806d65-d3dd-4cf9-9cac-e3ddd252f937");
    expect(runner).toContain("1faeca41-2233-4a0b-a273-0d3aadba9c96");
    expect(runner).not.toContain("99_cleanup_after_release.sql\",\"");
    expect(runner).not.toContain("01_restore_legacy_topic.sql\",\"");
    expect(byName("/RUNBOOK.md")).toContain("unchanged canonical migrations 278, 279, 280, 281, and 282");
    const runnerPath = [...files.keys()].find((file) => file.endsWith("run-flight.cjs"))!;
    const rejected = spawnSync(process.execPath, [runnerPath, "--env", "production", "--confirm", "production:wrong"], { encoding: "utf8" });
    expect(rejected.status).not.toBe(0);
    expect(rejected.stderr).toContain("pinned-uuid");
  });

  it("does not modify immutable migration 278", () => {
    const canonical = readFileSync(new URL("../../../database/migrations/278_nsmq_legacy_null_topic_part_1.sql", import.meta.url), "utf8");
    const committed = execFileSync("git", ["show", "HEAD:database/migrations/278_nsmq_legacy_null_topic_part_1.sql"], { encoding: "utf8" });
    expect(canonical.replaceAll("\r\n", "\n")).toBe(committed.replaceAll("\r\n", "\n"));
  });
});
