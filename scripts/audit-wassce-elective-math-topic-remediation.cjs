'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {DatabaseSync}=require('node:sqlite');
const {CONTENT_CORRECTION_MIGRATION,buildManifest,buildMappings}=require('./generate-wassce-elective-math-topic-remediation.cjs');
const ROOT=path.resolve(__dirname,'..');
const read=(relative)=>fs.readFileSync(path.join(ROOT,relative),'utf8');
const manifest=buildManifest();
assert.deepEqual(JSON.parse(read('database/manifests/249_250_wassce_elective_math_topic_mapping.json')),manifest);
const db=new DatabaseSync(':memory:');
for(const sql of ['database/schema.sql','database/seed.sql','database/prod-patches/096_seed_topics_for_empty_subjects.sql'])db.exec(read(sql));
for(const name of ['100_question_bank_integrity.sql','101_atomic_question_allowance.sql','102_nsmq_question_alignment.sql','103_exact_question_deduplication.sql'])db.exec(read(`database/migrations/${name}`));
for(let number=224;number<=236;number+=1){const name=fs.readdirSync(path.join(ROOT,'database/migrations')).find((candidate)=>candidate.startsWith(`${number}_`));assert.ok(name);db.exec(read(`database/migrations/${name}`));}
const mappings=buildMappings();
const nullIds=db.prepare('SELECT id FROM questions WHERE subject_id=? AND topic_id IS NULL ORDER BY id').all(manifest.subjectId).map((row)=>row.id);
assert.equal(db.prepare('SELECT COUNT(*) count FROM questions WHERE subject_id=?').get(manifest.subjectId).count,204);
assert.deepEqual(mappings.map((row)=>row.questionId).sort(),nullIds);
assert.equal(mappings.slice(0,100).filter((row)=>row.classificationSource.startsWith('ledger-')).length,40);
for(const batch of manifest.migrationBatches)db.exec(read(`database/migrations/${batch.migration}`));
db.exec(read(`database/migrations/${CONTENT_CORRECTION_MIGRATION}`));
for(const mapping of mappings)assert.equal(db.prepare('SELECT topic_id FROM questions WHERE id=?').get(mapping.questionId).topic_id,mapping.topicId);
for(const correction of manifest.contentCorrections){const row=db.prepare('SELECT * FROM questions WHERE id=?').get(correction.questionId);for(const change of correction.changes)assert.equal(row[change.field],change.newValue);assert.equal(row.correct_answer,correction.answerOptionAssertion.answer);assert.equal(JSON.parse(row.options)[correction.answerOptionAssertion.optionIndex],correction.answerOptionAssertion.optionValue);}
assert.equal(db.prepare("SELECT COUNT(*) count FROM question_bank_remediation_log WHERE migration_id='251_wassce_elective_math_content_corrections'").get().count,9);
assert.equal(db.prepare("SELECT COUNT(*) count FROM questions WHERE subject_id=? AND topic_id IS NULL").get(manifest.subjectId).count,0);
assert.equal(manifest.contentReviewWarnings.length,0);
process.stdout.write(`${JSON.stringify({subjectId:manifest.subjectId,baselineQuestions:204,baselineNullTopics:nullIds.length,mapped:mappings.length,exceptions:manifest.exceptions.length,contentCorrections:manifest.contentCorrections.length,contentLedgerRows:9,unresolvedContentWarnings:0},null,2)}\n`);
