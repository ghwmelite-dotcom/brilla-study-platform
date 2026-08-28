import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const Database = require("better-sqlite3");
const generated = require("../../../scripts/generate-nsmq-pre278-reconciliation.cjs");
const { plan, fingerprint } = generated.model();
const files = generated.renderFiles() as Map<string, string>;
const byName = (name: string) => [...files].find(([file]) => file.replaceAll("\\", "/").endsWith(name))![1];

function database(mode: "legacy" | "post278" = "legacy") {
  const db = new Database(":memory:");
  db.exec(`PRAGMA foreign_keys=ON;
    CREATE TABLE subjects(id TEXT PRIMARY KEY,exam_type_id TEXT NOT NULL,is_active INTEGER NOT NULL);
    CREATE TABLE topics(id TEXT PRIMARY KEY,subject_id TEXT NOT NULL REFERENCES subjects(id));
    CREATE TABLE questions(id TEXT PRIMARY KEY,subject_id TEXT NOT NULL REFERENCES subjects(id),round_type TEXT NOT NULL,topic_id TEXT REFERENCES topics(id));
    CREATE TABLE d1_migrations(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL UNIQUE);
    CREATE TABLE question_bank_remediation_log(id INTEGER PRIMARY KEY AUTOINCREMENT,migration_id TEXT NOT NULL,entity_type TEXT NOT NULL,entity_id TEXT NOT NULL,field_name TEXT NOT NULL,old_value TEXT,new_value TEXT,UNIQUE(migration_id,entity_type,entity_id,field_name));`);
  for (const name of generated.PRE278_LEDGER) db.prepare("INSERT INTO d1_migrations(name) VALUES (?)").run(name);
  if (mode === "post278") for (const name of generated.POST278_LEDGER) db.prepare("INSERT INTO d1_migrations(name) VALUES (?)").run(name);
  for (const [migration,count] of [["267_nsmq_topic_remediation_part_1",103],["268_nsmq_topic_remediation_part_2",100],["269_nsmq_topic_remediation_part_3",100],["270_nsmq_topic_remediation_part_4",73]] as const)
    for (let i=0;i<count;i++) db.prepare("INSERT INTO question_bank_remediation_log VALUES (NULL,?,'question',?,'topic_id',NULL,'prior')").run(migration,`${migration}_${i}`);
  const subjects = new Set([...plan.mappings,...plan.quarantines].map((x:any)=>x.subjectId));
  for (const subject of subjects) db.prepare("INSERT INTO subjects VALUES (?,'exam_nsmq',1)").run(subject);
  const canonical = plan.mappings.filter((x:any)=>x.questionId!==generated.QUESTION_ID).slice(0,183);
  const canonicalIds = new Set(canonical.map((x:any)=>x.questionId));
  const topics = new Map<string,string>();
  for (const row of plan.mappings) topics.set(row.topicId,row.subjectId);
  topics.set(generated.LEGACY_TOPIC,"subj_nsmq_chemistry");
  for (const row of plan.mappings) if (!canonicalIds.has(row.questionId) && row.questionId!==generated.QUESTION_ID) topics.set(`legacy_${row.questionId}`,row.subjectId);
  for (const [topic,subject] of topics) db.prepare("INSERT INTO topics VALUES (?,?)").run(topic,subject);
  for (const row of plan.mappings) {
    const oldTopic = row.questionId===generated.QUESTION_ID ? generated.LEGACY_TOPIC : canonicalIds.has(row.questionId) ? row.topicId : `legacy_${row.questionId}`;
    const current = mode === "post278" ? row.topicId : oldTopic;
    db.prepare("INSERT INTO questions VALUES (?,?,?,?)").run(row.questionId,row.subjectId,row.roundType,current);
    if (row.questionId!==generated.QUESTION_ID) {
      db.prepare("INSERT INTO question_bank_remediation_log VALUES (NULL,'100_question_bank_integrity','question',?,'topic_id','before100',?)").run(row.questionId,oldTopic);
      db.prepare("INSERT INTO question_bank_remediation_log VALUES (NULL,'102_nsmq_question_alignment','question',?,'topic_id','before102',?)").run(row.questionId,oldTopic);
    } else db.prepare("INSERT INTO question_bank_remediation_log VALUES (NULL,'102_nsmq_question_alignment','question',?,'topic_id','topic_wchem_atomic',?)").run(row.questionId,generated.LEGACY_TOPIC);
    if (mode === "post278") db.prepare("INSERT INTO question_bank_remediation_log VALUES (NULL,?,'question',?,'topic_id',NULL,?)").run(row.migrationId,row.questionId,row.topicId);
  }
  for (const row of plan.quarantines) db.prepare("INSERT INTO questions VALUES (?,?,?,NULL)").run(row.questionId,row.subjectId,row.roundType);
  return db;
}
const apply=(db:any,name:string)=>db.exec(byName(name));
const load=(db:any)=>generated.LOADER_FILES.forEach((n:string)=>apply(db,`/nsmq-pre278/${n}`));
const act=(db:any)=>generated.ACTION_FILES.forEach((n:string)=>apply(db,`/nsmq-pre278/${n}`));
const forward=(db:any)=>{load(db);act(db)};

describe("NSMQ pre-278 full-scope reconciliation",()=>{
  it("contains no explicit transaction control in generated action and rollback SQL",()=>{
    for (const name of [...generated.ACTION_FILES,"rollback/01_restore_legacy_topics.sql"]) {
      expect(byName(`/nsmq-pre278/${name}`)).not.toMatch(/\\b(?:BEGIN(?:\\s+IMMEDIATE)?|COMMIT|ROLLBACK)\\b/i);
    }
  });
  it("backs up, audits, and nulls exactly all 268 provenance-bound rows atomically",()=>{
    const db=database(); forward(db);
    expect(db.prepare("SELECT count(*) c FROM questions q JOIN _npr_expected_m e ON e.q=q.id WHERE q.topic_id IS NULL").get().c).toBe(268);
    expect(db.prepare("SELECT count(*) c FROM nsmq_pre278_reconcile_backup").get().c).toBe(268);
    expect(db.prepare("SELECT count(*) c FROM nsmq_pre278_reconcile_audit").get().c).toBe(268);
    expect(db.prepare("SELECT mode,status,expected_count,manifest_fingerprint FROM nsmq_pre278_reconcile_state").get()).toEqual({mode:"legacy",status:"completed",expected_count:268,manifest_fingerprint:fingerprint});
    act(db);
    apply(db,"/rollback/01_restore_legacy_topics.sql");
    expect(db.prepare("SELECT count(*) c FROM questions q JOIN _npr_expected_m e ON e.q=q.id WHERE q.topic_id IS NOT NULL").get().c).toBe(268);
    db.close();
  });
  it("accepts the real 183 canonical and 85 differing post-102 shape, then unchanged 278",()=>{
    const db=database(); forward(db);
    const migration=readFileSync(new URL("../../../database/migrations/278_nsmq_legacy_null_topic_part_1.sql",import.meta.url),"utf8");
    db.exec(migration); db.prepare("INSERT INTO d1_migrations(name) VALUES ('278_nsmq_legacy_null_topic_part_1.sql')").run();
    expect(db.prepare("SELECT count(*) c FROM questions q JOIN _npr_expected_m e ON e.q=q.id WHERE e.m='278_nsmq_legacy_null_topic_part_1' AND q.topic_id=e.t").get().c).toBe(90);
    db.close();
  });
  it("is a post-278 no-op with zero backup/audit rows",()=>{
    const db=database("post278"); forward(db);
    expect(db.prepare("SELECT mode,status FROM nsmq_pre278_reconcile_state").get()).toEqual({mode:"reviewed_noop",status:"completed"});
    expect(db.prepare("SELECT count(*) c FROM nsmq_pre278_reconcile_backup").get().c).toBe(0);
    act(db); db.close();
  });
  it.each([
    ["provenance",(db:any)=>db.prepare("DELETE FROM question_bank_remediation_log WHERE migration_id='100_question_bank_integrity' LIMIT 1").run()],
    ["owner",(db:any)=>db.prepare("UPDATE subjects SET is_active=0 WHERE id='subj_nsmq_chemistry'").run()],
    ["topic",(db:any)=>db.prepare("UPDATE questions SET topic_id=? WHERE id=?").run(plan.mappings[0].topicId,plan.mappings[1].questionId)],
    ["count",(db:any)=>db.prepare("DELETE FROM questions WHERE id=?").run(plan.mappings[1].questionId)],
  ])("fails closed on wrong %s",(_label,corrupt)=>{const db=database();corrupt(db);load(db);expect(()=>act(db)).toThrow();expect(db.prepare("SELECT count(*) c FROM nsmq_pre278_reconcile_state").get().c).toBe(0); expect(db.prepare("SELECT count(*) c FROM nsmq_pre278_reconcile_backup").get().c).toBe(0);db.close()});
  it("rejects interrupted scratch and runner never recreates a retained pair",()=>{
    const db=database(); apply(db,"/nsmq-pre278/00_expected_part_1.sql"); expect(()=>apply(db,"/nsmq-pre278/03_preflight.sql")).toThrow(); db.close();
    const runner=byName("/run-flight.cjs");
    expect(runner).toContain("Interrupted expected scratch"); expect(runner).toContain("files=actions");
    expect(byName("/nsmq-pre278/00_expected_part_1.sql")).not.toContain("IF NOT EXISTS");
    expect(byName("/nsmq-pre278/00_expected_part_1.sql")).not.toContain("DELETE FROM _npr_expected");
  });
  it("rejects same-count retained scratch t/m swaps by fixed manifest fingerprint",()=>{
    const db=database(); load(db);
    const a=plan.mappings[0], b=plan.mappings.find((x:any)=>x.subjectId===a.subjectId&&x.topicId!==a.topicId)!;
    db.prepare("UPDATE _npr_expected_m SET t=?,m=? WHERE q=?").run(b.topicId,b.migrationId,a.questionId);
    expect(()=>act(db)).toThrow(); expect(db.prepare("SELECT count(*) c FROM nsmq_pre278_reconcile_state").get().c).toBe(0); db.close();
  });
  it("rejects a current valid-owner topic/log mutation",()=>{
    const db=database(); const row=plan.mappings.find((x:any)=>x.questionId!==generated.QUESTION_ID)!;
    db.prepare("INSERT INTO topics VALUES (?,?)").run("valid_owner_drift",row.subjectId);
    db.prepare("UPDATE questions SET topic_id=? WHERE id=?").run("valid_owner_drift",row.questionId);
    db.prepare("UPDATE question_bank_remediation_log SET new_value=? WHERE migration_id='102_nsmq_question_alignment' AND entity_id=? AND field_name='topic_id'").run("valid_owner_drift",row.questionId);
    load(db); expect(()=>act(db)).toThrow(); db.close();
  });
  it("rejects retained backup or stored backup fingerprint corruption",()=>{
    for(const corrupt of [(db:any)=>db.prepare("UPDATE nsmq_pre278_reconcile_backup SET old_topic_id=target_topic_id WHERE question_id=?").run(generated.QUESTION_ID),(db:any)=>db.prepare("UPDATE nsmq_pre278_reconcile_fingerprint SET a=a+1").run()]) {
      const db=database(); forward(db); corrupt(db); expect(()=>act(db)).toThrow(); db.close();
    }
  });
  it("pins targets/order, budgets, and immutable 278",()=>{
    expect(generated.FLIGHT_FILES).toEqual([...generated.LOADER_FILES,...generated.ACTION_FILES]);
    const runner=byName("/run-flight.cjs"); expect(runner).toContain("aa806d65-d3dd-4cf9-9cac-e3ddd252f937"); expect(runner).not.toContain("99_cleanup_after_release.sql");
    const runnerPath=[...files.keys()].find((x)=>x.endsWith("run-flight.cjs"))!;
    expect(spawnSync(process.execPath,[runnerPath,"--env","production","--confirm","production:wrong"],{encoding:"utf8"}).status).not.toBe(0);
    for(const [file,content] of [...files].filter(([x])=>x.endsWith(".sql"))) expect(Buffer.byteLength(content.replaceAll("\n","\r\n")),file).toBeLessThan(19_500);
    const canonical=readFileSync(new URL("../../../database/migrations/278_nsmq_legacy_null_topic_part_1.sql",import.meta.url),"utf8");
    expect(canonical.replaceAll("\r\n","\n")).toBe(execFileSync("git",["show","HEAD:database/migrations/278_nsmq_legacy_null_topic_part_1.sql"],{encoding:"utf8"}).replaceAll("\r\n","\n"));
  });
});