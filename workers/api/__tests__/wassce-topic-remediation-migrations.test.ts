import { describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const SUBJECT_ID='subj_wassce_elect_math';
const migrationNames=['249_wassce_topic_elective_math_part_1.sql','250_wassce_topic_elective_math_part_2.sql','251_wassce_elective_math_content_corrections.sql'] as const;
const migrations=migrationNames.map((name)=>readFileSync(new URL(`../../../database/migrations/${name}`,import.meta.url),'utf8'));
const rollbacks=migrationNames.map((name)=>readFileSync(new URL(`../../../database/rollbacks/${name}`,import.meta.url),'utf8'));
const schema=readFileSync(new URL('../../../database/schema.sql',import.meta.url),'utf8');
const seed=readFileSync(new URL('../../../database/seed.sql',import.meta.url),'utf8');
const topicSeed=readFileSync(new URL('../../../database/prod-patches/096_seed_topics_for_empty_subjects.sql',import.meta.url),'utf8');
const prerequisites=['100_question_bank_integrity.sql','101_atomic_question_allowance.sql','102_nsmq_question_alignment.sql','103_exact_question_deduplication.sql','224_bece_topic_taxonomy.sql','225_bece_topic_bdt.sql','226_bece_topic_english_part_1.sql','227_bece_topic_english_part_2.sql','228_bece_topic_french.sql','229_bece_topic_ict.sql','230_bece_topic_math_part_1.sql','231_bece_topic_math_part_2.sql','232_bece_topic_rme.sql','233_bece_topic_science_part_1.sql','234_bece_topic_science_part_2.sql','235_bece_topic_social_part_1.sql','236_bece_topic_social_part_2.sql'].map((name)=>readFileSync(new URL(`../../../database/migrations/${name}`,import.meta.url),'utf8'));
const preflight=readFileSync(new URL('../../../database/preflight/249_250_wassce_elective_math_topic_remediation.sql',import.meta.url),'utf8');
const manifest=JSON.parse(readFileSync(new URL('../../../database/manifests/249_250_wassce_elective_math_topic_mapping.json',import.meta.url),'utf8')) as Manifest;
const require=createRequire(import.meta.url);
const generator=require('../../../scripts/generate-wassce-elective-math-topic-remediation.cjs') as {buildManifest:()=>Manifest;buildMappings:()=>Mapping[]};

type Change={field:'options'|'explanation';oldValue:string;newValue:string};
type Correction={questionId:string;evidence:string;answerOptionAssertion:{answer:string;optionIndex:number;optionValue:string};changes:Change[]};
type Manifest={subjectId:string;expectedLiveQuestionCount:number;expectedNullTopicCount:number;mappedQuestionCount:number;exceptionCount:number;migrationBatches:Array<{migration:string;expectedCount:number}>;contentCorrectionMigration:string;classificationSourceCounts:Record<string,number>;topicCounts:Record<string,number>;mappingGroups:Array<{topicId:string;evidence:string;questionIds:string[]}>;exceptions:unknown[];contentCorrections:Correction[];contentReviewWarnings:unknown[]};
type Mapping={questionId:string;topicId:string;migration:string;classificationSource:string};
type QuestionRow=Record<string,unknown>&{id:string;subject_id:string;topic_id:string|null;question_text:string;question_type:string;options:string;correct_answer:string;explanation:string};
const mappings=generator.buildMappings();
const targetIds=new Set(mappings.map((row)=>row.questionId));
const correctionsById=new Map(manifest.contentCorrections.map((row)=>[row.questionId,row]));

function createFixture(){const db=new Database(':memory:');db.pragma('foreign_keys = ON');db.exec(schema);db.exec(seed);db.exec(topicSeed);for(const sql of prerequisites)db.exec(sql);return db;}
function applyAll(db:Database.Database){for(const sql of migrations)db.exec(sql);}
function scalar(db:Database.Database,sql:string,...params:unknown[]){return (db.prepare(sql).get(...params) as {count:number}).count;}
function rows(db:Database.Database){return db.prepare('SELECT * FROM questions ORDER BY id').all() as QuestionRow[];}
function scopeSnapshot(input:QuestionRow[]){return input.map((row)=>{const copy:Record<string,unknown>={...row};delete copy.topic_id;for(const change of correctionsById.get(row.id)?.changes??[])delete copy[change.field];return copy;});}
function collisions(input:QuestionRow[]){const groups=new Map<string,string[]>();for(const row of input){const key=row.question_text.toLowerCase().replace(/\s+/g,' ').trim();groups.set(key,[...(groups.get(key)??[]),row.id]);}return [...groups.values()].filter((ids)=>ids.length>1).map((ids)=>ids.sort()).sort((a,b)=>a[0].localeCompare(b[0]));}
function correctionState(db:Database.Database,value:'oldValue'|'newValue'){for(const correction of manifest.contentCorrections){const row=db.prepare('SELECT options,correct_answer,explanation FROM questions WHERE id=?').get(correction.questionId) as Record<string,string>;for(const change of correction.changes)expect(row[change.field]).toBe(change[value]);if(value==='newValue'){expect(row.correct_answer).toBe(correction.answerOptionAssertion.answer);expect(JSON.parse(row.options)[correction.answerOptionAssertion.optionIndex]).toBe(correction.answerOptionAssertion.optionValue);}}}
function gcd(left:number,right:number){let a=Math.abs(left);let b=Math.abs(right);while(b!==0){[a,b]=[b,a%b];}return a;}
function normalizedFraction(value:string){const stripped=value.trim().replace(/^[A-D]\.\s*/i,'');const match=/^(-?\d+)\s*\/\s*(-?\d+)$/.exec(stripped);if(!match)return null;let numerator=Number(match[1]);let denominator=Number(match[2]);if(denominator===0)return null;if(denominator<0){numerator=-numerator;denominator=-denominator;}const divisor=gcd(numerator,denominator);return `${numerator/divisor}/${denominator/divisor}`;}
function duplicateOptionFindings(db:Database.Database){const findings:string[]=[];for(const row of db.prepare("SELECT id,options FROM questions WHERE subject_id=? AND question_type='multiple_choice' ORDER BY id").all(SUBJECT_ID) as Array<{id:string;options:string}>){const options=JSON.parse(row.options) as string[];const exact=options.map((option)=>option.trim().toLowerCase());if(new Set(exact).size!==exact.length)findings.push(`${row.id}:exact`);const fractions=options.map(normalizedFraction).filter((value):value is string=>value!==null);if(new Set(fractions).size!==fractions.length)findings.push(`${row.id}:fraction`);}return findings;}
function cloneQuestion(db:Database.Database,sourceId:string,newId:string,topicId:string|null){const columns=(db.prepare('PRAGMA table_info(questions)').all() as Array<{name:string}>).map((row)=>row.name);const select=columns.map((column)=>column==='id'?'?':column==='topic_id'?'?':`"${column}"`).join(',');db.prepare(`INSERT INTO questions (${columns.map((column)=>`"${column}"`).join(',')}) SELECT ${select} FROM questions WHERE id=?`).run(newId,topicId,sourceId);}

describe('WASSCE Elective Mathematics remediation 249-251',()=>{
 it.each(migrationNames.map((name,index)=>[name,migrations[index]]))('keeps %s D1-safe',(name,sql)=>{const crlf=sql.replace(/\r\n/g,'\n').replace(/\n/g,'\r\n');expect(Buffer.byteLength(`${crlf}\r\nINSERT INTO "d1_migrations" (name) values ('${name}');`,'utf8')).toBeLessThan(19_500);});

 it('keeps the checked manifest identical to the generator',()=>{expect(manifest).toEqual(generator.buildManifest());expect(manifest.expectedLiveQuestionCount).toBe(204);expect(manifest.expectedNullTopicCount).toBe(122);expect(mappings).toHaveLength(122);expect(manifest.exceptions).toEqual([]);expect(manifest.contentCorrections).toHaveLength(6);expect(manifest.contentCorrections.flatMap((row)=>row.changes)).toHaveLength(9);expect(manifest.contentReviewWarnings).toEqual([]);});

 it('applies exact topics/content, preserves scope and passes content scans idempotently',()=>{const db=createFixture();const before=rows(db);const beforeCollisions=collisions(before);expect(scalar(db,'SELECT COUNT(*) count FROM questions WHERE subject_id=?',SUBJECT_ID)).toBe(204);expect(scalar(db,'SELECT COUNT(*) count FROM questions WHERE subject_id=? AND topic_id IS NULL',SUBJECT_ID)).toBe(122);correctionState(db,'oldValue');applyAll(db);const after=rows(db);expect(after).toHaveLength(before.length);expect(scopeSnapshot(after)).toEqual(scopeSnapshot(before));expect(collisions(after)).toEqual(beforeCollisions);for(const mapping of mappings)expect((db.prepare('SELECT topic_id FROM questions WHERE id=?').get(mapping.questionId) as {topic_id:string}).topic_id).toBe(mapping.topicId);expect(scalar(db,'SELECT COUNT(*) count FROM questions WHERE subject_id=? AND topic_id IS NULL',SUBJECT_ID)).toBe(0);correctionState(db,'newValue');expect(duplicateOptionFindings(db)).toEqual([]);expect((db.prepare("SELECT id FROM questions WHERE subject_id=? AND (instr(lower(explanation),'jean')>0 OR instr(lower(explanation),'closest option')>0 OR instr(lower(explanation),'let me recalculate')>0)").all(SUBJECT_ID))).toEqual([]);expect(db.pragma('foreign_key_check')).toEqual([]);expect(scalar(db,'SELECT COUNT(*) count FROM question_bank_remediation_log WHERE migration_id IN (?,?,?)',...migrationNames.map((name)=>name.replace(/\.sql$/,'')))).toBe(131);db.exec(preflight);db.close();});

 it('is idempotent at each exact migration state',()=>{const db=createFixture();db.exec(migrations[0]);db.exec(migrations[0]);expect(scalar(db,'SELECT COUNT(*) count FROM questions WHERE subject_id=? AND topic_id IS NULL',SUBJECT_ID)).toBe(22);db.exec(migrations[1]);db.exec(migrations[1]);expect(scalar(db,'SELECT COUNT(*) count FROM questions WHERE subject_id=? AND topic_id IS NULL',SUBJECT_ID)).toBe(0);db.exec(migrations[2]);db.exec(migrations[2]);expect(scalar(db,'SELECT COUNT(*) count FROM question_bank_remediation_log WHERE migration_id IN (?,?,?)',...migrationNames.map((name)=>name.replace(/\.sql$/,'')))).toBe(131);db.close();});

 it('restores every question exactly in strict reverse order',()=>{const db=createFixture();const before=rows(db);applyAll(db);for(let index=rollbacks.length-1;index>=0;index-=1)db.exec(rollbacks[index]);expect(rows(db)).toEqual(before);expect(db.pragma('foreign_key_check')).toEqual([]);db.close();});

 it('blocks rollback 250 while 251 remains active',()=>{const db=createFixture();applyAll(db);expect(()=>db.exec(rollbacks[1])).toThrow();expect(scalar(db,"SELECT COUNT(*) count FROM questions WHERE subject_id=? AND topic_id IS NULL",SUBJECT_ID)).toBe(0);db.close();});

 it('fails 249 on an unexpected added null row',()=>{const db=createFixture();cloneQuestion(db,'q_em_001','q_unexpected_null',null);expect(()=>db.exec(migrations[0])).toThrow();expect(scalar(db,"SELECT COUNT(*) count FROM question_bank_remediation_log WHERE migration_id='249_wassce_topic_elective_math_part_1'")).toBe(0);db.close();});
 it('fails 249 on an unexpected added mapped row',()=>{const db=createFixture();cloneQuestion(db,'q_em_001','q_unexpected_mapped','topic_wassce_em_algebra');expect(()=>db.exec(migrations[0])).toThrow();db.close();});
 it('fails 249 when a non-target subject row was deleted',()=>{const db=createFixture();expect(targetIds.has('q_em_001')).toBe(false);db.prepare('DELETE FROM questions WHERE id=?').run('q_em_001');expect(()=>db.exec(migrations[0])).toThrow();db.close();});
 it('fails 250 unless 249 is in the exact applied state',()=>{const db=createFixture();expect(()=>db.exec(migrations[1])).toThrow();db.close();});
 it('fails 251 unless the subject is exactly complete',()=>{const db=createFixture();db.exec(migrations[0]);db.exec(migrations[1]);db.prepare('UPDATE questions SET topic_id=NULL WHERE id=?').run(mappings[0].questionId);expect(()=>db.exec(migrations[2])).toThrow();db.close();});
 it('fails before content mutation on exact-prior drift',()=>{const db=createFixture();db.exec(migrations[0]);db.exec(migrations[1]);db.prepare('UPDATE questions SET explanation=? WHERE id=?').run('drift','q_wassce_emath_2023_50');expect(()=>db.exec(migrations[2])).toThrow();expect((db.prepare('SELECT options FROM questions WHERE id=?').get('q_wassce_emath_2024_09') as {options:string}).options).toBe('["-2", "0", "2", "4"]');db.close();});
});



