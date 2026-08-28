import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import type { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";

type Question = Record<string, string | number | null> & { id: string; subject_id: string };
type DriftRow = { id: string; subjectId: string; differingFields: string[]; legacyContentHash: { id: string; n: number; a: number; b: number } };
type Flight = { model: { parts: string[][]; auditCount: number }; artifacts: Record<string,string> };

const require = createRequire(import.meta.url);
const topic = require("../../../scripts/generate-cambridge-topic-release.cjs") as {
  buildModel: () => { states: Question[][] };
  buildArtifacts: () => { model: { batches: Array<{migrationId:string}> }; artifacts: Record<string,string> };
  fixture: () => DatabaseSync;
  rowsFingerprint: (rows: Question[], fields: string[]) => number[];
  fingerprint: (payload: string) => number[];
};
const legacyRelease = require("../../../scripts/generate-cambridge-legacy-topic-release.cjs") as { buildArtifacts: () => { artifacts: Record<string,string> }; MIGRATION_FILE: string };
const reconciliation = require("../../../scripts/generate-cambridge-content-reconciliation.cjs") as {
  buildArtifacts: (options?: Record<string,unknown>) => Flight;
  CONTENT_FIELDS: string[];
  SCOPE_SQL: string;
  RELEASE: string;
};
const manifest = JSON.parse(readFileSync(new URL("../../../database/manifests/cambridge_production_drift_hashes.json", import.meta.url), "utf8")) as {rows:DriftRow[]};

function synthetic(): { flight: Flight; db: DatabaseSync; legacyFingerprint: number[] } {
  const model = topic.buildModel();
  const reviewed = model.states[0].map((row) => ({...row}));
  const legacy = reviewed.map((row) => ({...row}));
  const byId = new Map(legacy.map((row) => [row.id,row]));
  for (const drift of manifest.rows) {
    const row = byId.get(drift.id)!;
    for (const field of drift.differingFields) {
      const value = row[field];
      row[field] = typeof value === "number" ? value + 17 : field === "question_type" ? (value === "multiple_choice" ? "direct_answer" : "multiple_choice") : field === "difficulty" ? (value === "hard" ? "easy" : "hard") : field === "options" ? '["legacy"]' : `legacy:${value ?? "NULL"}`;
    }
  }
  const sorted = [...legacy].sort((a,b) => a.id.localeCompare(b.id));
  const legacyFingerprint = topic.rowsFingerprint(sorted, reconciliation.CONTENT_FIELDS);
  const driftIds = new Set(manifest.rows.map((row) => row.id));
  const backup = sorted.filter((row) => driftIds.has(row.id));
  const syntheticRows=manifest.rows.map((item)=>{const row=byId.get(item.id)!;const [n,a,b]=topic.fingerprint(JSON.stringify(reconciliation.CONTENT_FIELDS.map((field)=>row[field]??null)));return {...item,legacyContentHash:{id:item.id,n,a,b}};});
  const syntheticManifest = {
    scopeCount:455, driftRowCount:144,
    legacyContentFingerprint:legacyFingerprint,
    reviewedContentFingerprint:topic.rowsFingerprint(reviewed,reconciliation.CONTENT_FIELDS),
    legacyBackupFingerprint:topic.rowsFingerprint(backup,reconciliation.CONTENT_FIELDS),
    rows:syntheticRows,
  };
  const flight = reconciliation.buildArtifacts({manifest:syntheticManifest});
  const db = topic.fixture();
  const update = db.prepare(`UPDATE questions SET question_text=?,question_type=?,options=?,correct_answer=?,explanation=?,difficulty=?,points=?,marks=?,time_limit=? WHERE id=?`);
  for (const row of backup) update.run(row.question_text,row.question_type,row.options,row.correct_answer,row.explanation,row.difficulty,row.points,row.marks,row.time_limit,row.id);
  return {flight,db,legacyFingerprint};
}

function flightFiles(flight: Flight): string[] {
  return Object.keys(flight.artifacts).filter((file) => file.endsWith(".sql") && !file.includes("/rollback/") && !file.endsWith("99_cleanup_after_release.sql"));
}
function rollbackFiles(flight: Flight): string[] { return Object.keys(flight.artifacts).filter((file) => file.includes("/rollback/") && file.endsWith(".sql")); }
function atomic(db: DatabaseSync, sql: string): void {
  db.exec("SAVEPOINT ccr_file");
  try { db.exec(sql); db.exec("RELEASE ccr_file"); }
  catch (error) { db.exec("ROLLBACK TO ccr_file"); db.exec("RELEASE ccr_file"); throw error; }
}
async function atomicFiles(db: DatabaseSync, flight: Flight, files: string[]): Promise<void> {
  for (const file of files) {
    atomic(db,flight.artifacts[file]);
    await new Promise<void>((resolve) => setImmediate(resolve));
  }
}
function contentFingerprint(db: DatabaseSync): number[] {
  const rows = db.prepare(`SELECT ${reconciliation.CONTENT_FIELDS.join(",")} FROM questions WHERE (${reconciliation.SCOPE_SQL}) ORDER BY id`).all() as Question[];
  return topic.rowsFingerprint(rows,reconciliation.CONTENT_FIELDS);
}
function counts(db: DatabaseSync): {backup:number;state:number;audit:number} {
  return {
    backup:Number((db.prepare("SELECT count(*) n FROM cambridge_content_reconciliation_backup").get() as {n:number}).n),
    state:Number((db.prepare("SELECT count(*) n FROM cambridge_content_reconciliation_state").get() as {n:number}).n),
    audit:Number((db.prepare("SELECT count(*) n FROM cambridge_content_reconciliation_audit").get() as {n:number}).n),
  };
}

describe("Cambridge content reconciliation pre-271 flight", () => {
  it("renders deterministic size-safe ordered artifacts without changing 271", () => {
    const {flight,db} = synthetic(); db.close();
    expect(flight.model.parts.flat()).toHaveLength(144);
    expect(new Set(flight.model.parts.flat()).size).toBe(144);
    for (const [file,sql] of Object.entries(flight.artifacts)) {
      if (file.endsWith(".sql")) expect(Buffer.byteLength(sql)).toBeLessThan(19_500);
    }
    expect(flight.artifacts["database/reconciliation/cambridge-content/RUNBOOK.md"]).toContain("stopping on the first failure");
    const runner=flight.artifacts["database/reconciliation/cambridge-content/run-flight.cjs"];
    expect(runner).toContain("aa806d65-d3dd-4cf9-9cac-e3ddd252f937");
    expect(runner).toContain("1faeca41-2233-4a0b-a273-0d3aadba9c96");
    expect(runner).toContain("confirm!==env+':'+database");
    expect(runner).not.toContain("99_cleanup_after_release.sql");
    expect(runner).not.toContain("rollback_part");
  }, 60_000);

  it("reconciles exact synthetic legacy, retains bounded backup, replays, and rolls back strictly", async () => {
    const {flight,db,legacyFingerprint}=synthetic();
    await atomicFiles(db,flight,flightFiles(flight));
    expect(counts(db)).toEqual({backup:144,state:1,audit:manifest.rows.reduce((n,row)=>n+row.differingFields.length,0)});
    const reviewed=topic.rowsFingerprint(topic.buildModel().states[0],reconciliation.CONTENT_FIELDS);
    expect(contentFingerprint(db)).toEqual(reviewed);
    const replay=flightFiles(flight);
    await atomicFiles(db,flight,[replay[0],replay[1],replay[2],replay.at(-1)!]);
    expect(contentFingerprint(db)).toEqual(reviewed);
    await atomicFiles(db,flight,rollbackFiles(flight));
    expect(contentFingerprint(db)).toEqual(legacyFingerprint);
    expect(counts(db).backup).toBe(144);
    db.close();
  },300_000);

  it("stops on first and mid-flight failures, then recovers from the same file", async () => {
    const first=synthetic(); const files=flightFiles(first.flight);
    first.db.exec("UPDATE questions SET subject_id='subj_igcse_math' WHERE id='q_alevel_math_001'");
    expect(()=>atomic(first.db,first.flight.artifacts[files[0]])).toThrow();
    first.db.close();

    const mid=synthetic();
    await atomicFiles(mid.db,mid.flight,files.slice(0,5));
    const target=mid.flight.model.parts[3][0],field=manifest.rows.find((row)=>row.id===target)!.differingFields[0];
    mid.db.exec(`UPDATE questions SET ${field}='unexpected drift' WHERE id='${target}'`);
    expect(()=>atomic(mid.db,mid.flight.artifacts[files[5]])).toThrow();
    mid.db.exec(`UPDATE questions SET ${field}=(SELECT ${field} FROM cambridge_content_reconciliation_backup WHERE release_id='${reconciliation.RELEASE}' AND id='${target}') WHERE id='${target}'`);
    atomic(mid.db,mid.flight.artifacts[files[5]]);
    await atomicFiles(mid.db,mid.flight,files.slice(6));
    expect(contentFingerprint(mid.db)).toEqual(topic.rowsFingerprint(topic.buildModel().states[0],reconciliation.CONTENT_FIELDS));
    mid.db.close();
  },300_000);

  it("is a no-op for exact reviewed pre-271 and reviewed post-271 shapes", async () => {
    const base=synthetic(); const flight=base.flight; base.db.close();
    for(const stage of [0,1,2]) {
      const db=topic.fixture();
      if(stage>0){const release=topic.buildArtifacts();for(const batch of release.model.batches)db.exec(release.artifacts[`database/migrations/${batch.migrationId}.sql`]);}
      if(stage===2){const release=legacyRelease.buildArtifacts();db.exec(release.artifacts[legacyRelease.MIGRATION_FILE]);}
      const before=contentFingerprint(db),files=flightFiles(flight);
      await atomicFiles(db,flight,[files[0],files[1],files[2],files.at(-1)!]);
      expect(contentFingerprint(db)).toEqual(before);
      expect(counts(db)).toEqual({backup:0,state:0,audit:0});
      db.close();
    }
  },300_000);

  it("rejects wrong IDs, subjects and fingerprints", () => {
    for(const mutation of [
      "UPDATE questions SET id='q_alevel_math_999' WHERE id='q_alevel_math_001'",
      "UPDATE questions SET subject_id='subj_igcse_math' WHERE id='q_alevel_math_001'",
      "UPDATE questions SET explanation='fingerprint drift' WHERE id='q_alevel_math_001'",
    ]){
      const {flight,db}=synthetic(); db.exec(mutation);
      expect(()=>atomic(db,flight.artifacts["database/reconciliation/cambridge-content/00_preflight.sql"])).toThrow();
      db.close();
    }
  },300_000);
  it("drops empty reviewed-noop reconciliation tables only through explicit cleanup", () => {
    const base=synthetic(),db=topic.fixture(),files=flightFiles(base.flight);
    atomic(db,base.flight.artifacts[files[0]]);atomic(db,base.flight.artifacts[files[1]]);
    atomic(db,base.flight.artifacts["database/reconciliation/cambridge-content/99_cleanup_after_release.sql"]);
    const names=(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'cambridge_content_reconciliation_%'").all() as Array<{name:string}>).map((row)=>row.name);
    expect(names).toEqual([]);db.close();base.db.close();
  },300_000);
});
