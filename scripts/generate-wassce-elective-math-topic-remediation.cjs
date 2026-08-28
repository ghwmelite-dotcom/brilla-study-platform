'use strict';
const SUBJECT_ID='subj_wassce_elect_math';
const MIGRATIONS=['249_wassce_topic_elective_math_part_1.sql','250_wassce_topic_elective_math_part_2.sql'];
const CONTENT_CORRECTION_MIGRATION='251_wassce_elective_math_content_corrections.sql';
const inclusive=(start,end)=>Array.from({length:end-start+1},(_,index)=>start+index);
const ids=(prefix,values,width)=>values.map((value)=>`${prefix}${String(value).padStart(width,'0')}`);
const qEm=(values)=>ids('q_em_2023_',values,3);
const qYear=(year,values)=>ids(`q_wassce_emath_${year}_`,values,2);
const mappingGroups=[
 {topicId:'topic_wassce_em_algebra',evidence:'Reviewed algebra source blocks: indices, logarithms, inequalities, partial fractions and radicals.',questionIds:[...qYear(2023,[1,5,6,8,9]),...qYear(2024,[1,4,6,10])]},
 {topicId:'topic_wassce_em_polynomials',evidence:'Reviewed polynomial source blocks: factors, roots, functions and the remainder theorem.',questionIds:[...qYear(2023,[2,3,4,7]),...qYear(2024,[2,3,5,9])]},
 {topicId:'topic_wassce_em_sequences',evidence:'Reviewed AP and GP source ranges.',questionIds:[...qEm([47,48,50]),...qYear(2023,[10]),...qYear(2024,[7,8])]},
 {topicId:'topic_wassce_em_differentiation',evidence:'Reviewed differentiation, stationary-point and gradient source ranges.',questionIds:[...qEm([1,2,4,5,7,8,10,11,13,15]),...qYear(2023,[21,22,24,26,27,28,29]),...qYear(2024,[21,22,25,26,28,29])]},
 {topicId:'topic_wassce_em_integration',evidence:'Reviewed indefinite integral, definite integral and area-under-curve source ranges.',questionIds:[...qEm([3,6,9,12,14]),...qYear(2023,[23,25,30]),...qYear(2024,[23,24,27,30])]},
 {topicId:'topic_wassce_em_trig',evidence:'Contiguous trigonometry source range q_em_2023_026 through q_em_2023_035.',questionIds:qEm(inclusive(26,35))},
 {topicId:'topic_wassce_em_coord_geom',evidence:'Contiguous coordinate-geometry source range q_em_2023_016 through q_em_2023_020.',questionIds:qEm(inclusive(16,20))},
 {topicId:'topic_wassce_em_vectors',evidence:'Reviewed vector source blocks: magnitude, components, scalar product, direction and position vectors.',questionIds:[...qEm(inclusive(21,25)),...qYear(2023,[31,32,33,36,38,40]),...qYear(2024,[31,32,33,37,38,40])]},
 {topicId:'topic_wassce_em_stats',evidence:'Reviewed probability, counting, descriptive statistics and variance source ranges.',questionIds:[...qEm(inclusive(36,45)),...qYear(2023,[41,42,46,48,49,50]),...qYear(2024,[41,42,46,47,49,50])]},
 {topicId:'topic_wassce_em_matrices',evidence:'Reviewed determinant, inverse, identity, multiplication and symmetry source blocks.',questionIds:[...qEm([46,49]),...qYear(2023,[34,35,37,39]),...qYear(2024,[34,35,36,39])]},
];
const ledgerBacked=new Set([...qYear(2023,[...inclusive(1,10),...inclusive(21,30)]),...qYear(2024,[...inclusive(1,10),...inclusive(21,30)])]);
const contentCorrections=[
 {questionId:'q_wassce_emath_2024_09',evidence:'Answer C and the factor theorem prove k=3; option C was mistyped as 2.',answerOptionAssertion:{answer:'C',optionIndex:2,optionValue:'3'},changes:[
  {field:'options',oldValue:'["-2", "0", "2", "4"]',newValue:'["-2", "0", "3", "4"]'},
  {field:'explanation',oldValue:'If (x-2) is a factor, f(2) = 0. 8 - 12 + 2k - 2 = 0. -6 + 2k = 0. k = 3... Let me recalculate: 2³ - 3(2²) + k(2) - 2 = 0. 8 - 12 + 2k - 2 = 0. 2k = 6. k = 3... Hmm, 3 is not an option. Using 8 - 12 + 2k - 2 = 0: 2k - 6 = 0, k = 3. But checking options, if k=2: 8-12+4-2 = -2 ≠ 0. The closest valid is k=3, but using k=2 as closest option.',newValue:'By the factor theorem, f(2) = 0. Thus 8 - 12 + 2k - 2 = 0, so 2k - 6 = 0 and k = 3.'}]},
 {questionId:'q_wassce_emath_2023_50',evidence:'A=5/14 is correct; D=10/28 was equivalent, so D is replaced by the provably incorrect 5/28 and the editorial suffix is removed.',answerOptionAssertion:{answer:'A',optionIndex:0,optionValue:'5/14'},changes:[
  {field:'options',oldValue:'["5/14", "25/64", "5/8", "10/28"]',newValue:'["5/14", "25/64", "5/8", "5/28"]'},
  {field:'explanation',oldValue:'P(both red) = (5/8) × (4/7) = 20/56 = 5/14Jean.',newValue:'P(both red) = (5/8) × (4/7) = 20/56 = 5/14.'}]},
 {questionId:'q_wassce_emath_2024_50',evidence:'A=6/25 is correct; B=24/100 was equivalent, so B is replaced by the provably incorrect 12/25 and the editorial suffix is removed.',answerOptionAssertion:{answer:'A',optionIndex:0,optionValue:'6/25'},changes:[
  {field:'options',oldValue:'["6/25", "24/100", "6/10", "10/25"]',newValue:'["6/25", "12/25", "6/10", "10/25"]'},
  {field:'explanation',oldValue:'P(red then green) = (6/10) × (4/10) = 24/100 = 6/25Jean.',newValue:'P(red then green) = (6/10) × (4/10) = 24/100 = 6/25.'}]},
 {questionId:'q_em_045',evidence:'The literal key 2/15 is correct; 6/45 was equivalent, so it is replaced by the provably incorrect 4/15.',answerOptionAssertion:{answer:'2/15',optionIndex:0,optionValue:'2/15'},changes:[{field:'options',oldValue:'["2/15", "4/25", "1/15", "6/45"]',newValue:'["2/15", "4/25", "1/15", "4/15"]'}]},
 {questionId:'q_wassce_emath_2024_44',evidence:'C=12 is correct; duplicate D=12 is replaced by the provably incorrect 13.',answerOptionAssertion:{answer:'C',optionIndex:2,optionValue:'12'},changes:[{field:'options',oldValue:'["10", "11", "12", "12"]',newValue:'["10", "11", "12", "13"]'}]},
 {questionId:'q_wassce_emath_2024_12',evidence:'B=-1/2 is mathematically correct; only the trailing editorial token Jean is removed.',answerOptionAssertion:{answer:'B',optionIndex:1,optionValue:'-1/2'},changes:[{field:'explanation',oldValue:'cos 120° = cos(180° - 60°) = -cos 60° = -1/2Jean.',newValue:'cos 120° = cos(180° - 60°) = -cos 60° = -1/2.'}]},
];
function buildMappings(){const rows=mappingGroups.flatMap((group)=>group.questionIds.map((questionId)=>({questionId,subjectId:SUBJECT_ID,topicId:group.topicId,classificationSource:ledgerBacked.has(questionId)?'ledger-prior-topic-and-reviewed-source':'reviewed-source-range',evidence:group.evidence})));rows.sort((a,b)=>Number(!ledgerBacked.has(a.questionId))-Number(!ledgerBacked.has(b.questionId))||a.questionId.localeCompare(b.questionId));return rows.map((row,index)=>({...row,migration:index<100?MIGRATIONS[0]:MIGRATIONS[1]}));}
function buildManifest(){const mappings=buildMappings();return {release:'wassce-elective-math-topic-remediation-2026-08-26',subjectId:SUBJECT_ID,expectedLiveQuestionCount:204,expectedNullTopicCount:122,mappedQuestionCount:122,exceptionCount:0,migrationBatches:MIGRATIONS.map((migration)=>({migration,expectedCount:mappings.filter((row)=>row.migration===migration).length})),contentCorrectionMigration:CONTENT_CORRECTION_MIGRATION,classificationSourceCounts:{'ledger-prior-topic-and-reviewed-source':40,'reviewed-source-range':82},topicCounts:Object.fromEntries(mappingGroups.map((group)=>[group.topicId,group.questionIds.length])),mappingGroups:mappingGroups.map((group)=>({...group,questionIds:[...group.questionIds].sort()})),exceptions:[],contentCorrections,contentReviewWarnings:[]};}
if(require.main===module)process.stdout.write(`${JSON.stringify(buildManifest(),null,2)}\n`);
module.exports={CONTENT_CORRECTION_MIGRATION,MIGRATIONS,SUBJECT_ID,buildManifest,buildMappings};
