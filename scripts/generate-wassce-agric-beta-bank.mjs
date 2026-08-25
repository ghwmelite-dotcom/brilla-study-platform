import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateQuestionBatch } from './question-content-lib.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const generatedAt = '2026-08-24T00:00:00Z';
const labels = ['A', 'B', 'C', 'D'];
const difficulties = ['easy', 'medium', 'hard'];
const assessmentObjectives = ['AO1', 'AO2', 'AO3'];
const sourceUrl = 'https://nacca.gov.gh/wp-content/uploads/2025/04/Agricultural-Science-Curriculum.pdf';
const contentLabel = 'Original BrillaPrep practice content aligned to Ghana’s published NaCCA Agricultural Science curriculum; not official WAEC or NaCCA examination material.';

const topics = [
  ['AGSCI-1.1', 'Agriculture and farming prospects', 'Explain the importance, enterprise opportunities and inclusive career prospects of agriculture in Ghana.'],
  ['AGSCI-1.2', 'Emerging technologies in agriculture', 'Apply digital, biological and controlled-environment technologies to agricultural production decisions.'],
  ['AGSCI-1.3', 'Agricultural machinery', 'Select, operate and maintain agricultural tools and machinery using safe and efficient practices.'],
  ['AGSCI-2.1', 'Economic production of crops', 'Plan market-oriented crop production, husbandry, harvesting, post-harvest handling and marketing.'],
  ['AGSCI-2.2', 'Economic production of animals', 'Apply husbandry, nutrition, health, biosecurity and enterprise records to animal production.'],
  ['AGSCI-3.1', 'Land tenure systems for agriculture', 'Compare land tenure arrangements and their effects on access, investment and sustainable farm management.'],
  ['AGSCI-3.2', 'Agricultural support systems', 'Use extension, finance, insurance, farmer organisations and market information to improve farm decisions.'],
  ['AGSCI-4.1', 'Climate variability and agricultural risk', 'Interpret weather and climate evidence and explain effects on yields, pests, water and rural livelihoods.'],
  ['AGSCI-4.2', 'Climate change adaptation', 'Select practical farm adjustments that reduce exposure and vulnerability to climate-related hazards.'],
  ['AGSCI-4.3', 'Climate change mitigation', 'Evaluate agricultural practices that reduce greenhouse-gas emissions or increase long-term carbon storage.'],
];

function item(topicCode, prompt, correct, wrong, explanation) {
  return { topicCode, prompt, correct, wrong, explanation };
}

const facts = [
  item('AGSCI-1.1', 'Which activity belongs to the agricultural value chain rather than only primary production?', 'Processing cassava into packaged gari for sale', ['Clearing land without producing anything', 'Leaving harvested cassava exposed to rain', 'Discarding all farm records'], 'Agriculture includes production, processing, storage, transport and marketing. Turning cassava into packaged gari adds value and can create employment beyond the farm gate.'),
  item('AGSCI-1.1', 'A learner says agriculture is suitable only for men. Which response is most evidence-based?', 'Agricultural enterprises require diverse skills and are open to every gender', ['Only heavy manual work counts as agriculture', 'Women can participate only in retailing', 'Gender determines whether a person can learn agribusiness'], 'Modern agriculture includes science, finance, machinery, marketing and management. Ability, training and access to resources—not gender—determine participation and performance.'),
  item('AGSCI-1.1', 'Before starting a tomato enterprise, what should a student entrepreneur investigate first?', 'Local demand, preferred varieties, prices and likely buyers', ['The colour of every competitor’s clothing', 'Only the size of the available hoe', 'The number of unrelated shops in another region'], 'A market survey identifies customer needs, seasonal prices and sales channels. That evidence guides production scale, variety choice, harvest timing and expected revenue.'),
  item('AGSCI-1.1', 'Why should a small farm keep records of inputs, labour, sales and losses?', 'To calculate performance and make evidence-based enterprise decisions', ['To guarantee that weather will remain favourable', 'To remove every biological risk', 'To replace observation of the farm'], 'Complete records reveal costs, revenue, profit, mortality and yield trends. Comparing those figures helps the farmer correct waste and plan the next production cycle.'),

  item('AGSCI-1.2', 'How can a soil-moisture sensor improve irrigation management?', 'It can trigger watering when measured soil moisture falls below a useful threshold', ['It permanently increases rainfall', 'It identifies crop prices without data', 'It sterilises the soil automatically'], 'A moisture sensor supplies field evidence about water availability. Using that reading prevents unnecessary watering while reducing the risk of crop water stress.'),
  item('AGSCI-1.2', 'What is a key advantage of using GPS guidance for field operations?', 'It reduces overlapping passes and improves placement accuracy', ['It makes fuel unnecessary', 'It guarantees that every seed germinates', 'It replaces all machinery maintenance'], 'GPS guidance helps an operator follow consistent paths. Fewer overlaps can save seed, fertiliser, fuel and time while improving uniform field coverage.'),
  item('AGSCI-1.2', 'Which statement best describes hydroponic crop production?', 'Plants receive water and mineral nutrients without relying on field soil', ['Plants grow without light or nutrients', 'Every crop is raised only in seawater', 'Roots are prevented from absorbing dissolved ions'], 'Hydroponics supplies roots with a managed nutrient solution and support medium where needed. Light, oxygen, water quality and nutrient concentration still require control.'),
  item('AGSCI-1.2', 'Why might a farmer use a drone to inspect a large field?', 'To locate uneven crop growth or stress for targeted ground checks', ['To diagnose every disease with certainty from one photograph', 'To eliminate the need for agronomic knowledge', 'To change soil texture while flying'], 'Aerial images can reveal patterns that are hard to see from the ground. They guide inspection, but findings still need verification before treatment decisions are made.'),

  item('AGSCI-1.3', 'Which implement is mainly used to turn and loosen soil during primary tillage?', 'A plough', ['A knapsack sprayer', 'A milking machine', 'A grain moisture meter'], 'A plough cuts, lifts and turns the soil, helping bury residues and prepare land for later operations. Harrows generally perform finer secondary tillage.'),
  item('AGSCI-1.3', 'Why is planter calibration necessary before sowing a field?', 'To deliver the intended seed rate and spacing', ['To increase tractor mass permanently', 'To make all seeds genetically identical', 'To avoid checking seed size'], 'Calibration relates machine settings, travel distance and seed output. Checking the result reduces waste and supports a plant population appropriate for the crop.'),
  item('AGSCI-1.3', 'What is the safest action before clearing material wrapped around a tractor power take-off shaft?', 'Shut down the engine, isolate power and wait for all movement to stop', ['Pull the material while the shaft rotates slowly', 'Step over the rotating shaft', 'Increase engine speed to throw it off'], 'A rotating power take-off can entangle clothing or limbs within seconds. Isolation and complete stoppage are essential before inspection or clearing.'),
  item('AGSCI-1.3', 'Which maintenance practice most directly reduces rapid wear of moving machine parts?', 'Lubricating specified points at the recommended intervals', ['Leaving soil on metal surfaces after use', 'Operating with loose fasteners', 'Replacing clean oil with water'], 'Correct lubrication reduces friction and heat between moving surfaces. The manufacturer’s schedule and lubricant specification should be followed for reliable operation.'),

  item('AGSCI-2.1', 'Why is crop rotation with a legume useful in a cereal production plan?', 'It can improve soil nitrogen supply and interrupt some pest cycles', ['It guarantees that weeds disappear permanently', 'It removes the need for all soil testing', 'It makes rainfall unnecessary'], 'Legumes can add biologically fixed nitrogen when residues are managed well. Changing crop families can also disrupt organisms that depend on one host crop.'),
  item('AGSCI-2.1', 'What is the first principle of integrated pest management?', 'Monitor the crop and combine suitable controls only when justified', ['Apply the highest pesticide dose every week', 'Destroy all organisms found in the field', 'Ignore economic damage thresholds'], 'Integrated pest management uses identification, monitoring, prevention and compatible biological, cultural or chemical controls. Treatment is based on evidence and risk.'),
  item('AGSCI-2.1', 'A vegetable farmer harvests produce during the coolest part of the morning. What benefit is most likely?', 'Lower field heat can slow water loss and quality deterioration', ['The produce immediately becomes sterile', 'Respiration stops permanently', 'Every bruise repairs itself'], 'Removing field heat and limiting dehydration help preserve fresh produce. Careful handling, shade and timely cooling further reduce post-harvest losses.'),
  item('AGSCI-2.1', 'Which calculation gives gross margin for a crop enterprise?', 'Revenue minus variable costs', ['Total assets minus rainfall', 'Fixed costs plus every household expense', 'Yield divided by the farmer’s age'], 'Gross margin compares enterprise income with costs that change with production, such as seed, fertiliser and hired labour. It supports comparison between enterprise options.'),

  item('AGSCI-2.2', 'Why should newly purchased animals be quarantined before joining an established flock?', 'To observe them and reduce the chance of introducing disease', ['To prevent them from eating forever', 'To make vaccination unnecessary', 'To increase stocking density immediately'], 'Quarantine separates new animals while health checks and required treatments are completed. This lowers the risk of spreading an undetected infection to the resident flock.'),
  item('AGSCI-2.2', 'What makes an animal ration balanced?', 'It supplies required nutrients in suitable amounts and proportions', ['It contains only the cheapest ingredient', 'It provides protein but no water', 'It is identical for every species and age'], 'A balanced ration matches energy, protein, minerals, vitamins, fibre and water needs to the animal’s species, age, production stage and health.'),
  item('AGSCI-2.2', 'Why must a farmer record vaccination dates and batch details?', 'To schedule protection, trace products and investigate health events', ['To prove that no animal can ever become ill', 'To replace correct vaccine storage', 'To avoid observing withdrawal instructions'], 'Accurate health records support timely boosters and traceability. They also help a veterinarian assess failures, reactions and compliance with product directions.'),
  item('AGSCI-2.2', 'In a fish pond, dissolved oxygen falls sharply before dawn. Which response is most appropriate?', 'Increase aeration and check stocking and feeding levels', ['Add more feed immediately', 'Block all water movement', 'Cover the pond completely with an airtight sheet'], 'Respiration continues overnight while photosynthesis stops, so oxygen can reach its daily minimum near dawn. Aeration addresses the immediate risk while management causes are reviewed.'),

  item('AGSCI-3.1', 'What is a leasehold interest in farmland?', 'A right to use land for an agreed period under stated conditions', ['Permanent ownership without any agreement', 'Use of land for one day without consent', 'A guarantee that rent can never change'], 'A lease grants possession and use for a defined term while ownership remains elsewhere. Written terms clarify duration, payment, permitted uses and responsibilities.'),
  item('AGSCI-3.1', 'How can insecure land tenure discourage long-term farm investment?', 'A farmer may fear losing the land before the investment pays back', ['It always increases access to credit', 'It makes trees mature faster', 'It removes every boundary dispute automatically'], 'Irrigation, soil improvement and tree crops may take years to recover their cost. Uncertain rights reduce confidence that the farmer will receive those future benefits.'),
  item('AGSCI-3.1', 'Which action best reduces disputes before cultivating land obtained through customary arrangements?', 'Confirm the authorised grant, boundaries, witnesses and terms in a documented process', ['Rely only on an unverified rumour', 'Move boundary markers secretly', 'Assume unused land has no recognised interests'], 'Customary rights are legitimate but can involve several authorities and interests. Verification and clear documentation protect both the landholder and the farmer.'),
  item('AGSCI-3.1', 'Under sharecropping, how is the landholder commonly compensated?', 'With an agreed share of the farm output or proceeds', ['Only with ownership of all the farmer’s tools', 'By receiving the entire harvest regardless of terms', 'With rainfall measured during the season'], 'Sharecropping arrangements divide output or revenue according to an agreed formula. Clear terms should cover inputs, risk, harvest measurement and each party’s share.'),

  item('AGSCI-3.2', 'What is the central role of an agricultural extension officer?', 'Help farmers evaluate and apply relevant knowledge and technologies', ['Set every market price by law', 'Operate every farm on behalf of owners', 'Replace all farmer experimentation'], 'Extension connects research, local experience and practical advisory support. Participatory approaches help farmers adapt recommendations to their conditions.'),
  item('AGSCI-3.2', 'How can a farmer cooperative improve members’ bargaining position?', 'By pooling demand or produce to negotiate at useful scale', ['By preventing members from keeping records', 'By hiding quality information from buyers', 'By eliminating every production cost'], 'Collective purchasing and marketing can reduce transaction costs and strengthen negotiation. Transparent governance and agreed quality standards remain essential.'),
  item('AGSCI-3.2', 'Why should a farmer compare the effective cost and repayment schedule before taking credit?', 'To confirm expected cash flow can service the loan without undermining the farm', ['Because interest never affects profitability', 'Because all lenders offer identical terms', 'To avoid preparing an enterprise budget'], 'Loan principal, interest, fees and due dates affect working capital. A realistic cash-flow forecast shows whether income is likely to arrive before repayments fall due.'),
  item('AGSCI-3.2', 'What risk does index-based agricultural insurance usually pay against?', 'A measured trigger such as rainfall falling below a defined threshold', ['Every individual loss without a policy condition', 'Changes in the farmer’s preferred crop colour', 'Guaranteed profit regardless of management'], 'Index insurance pays when an agreed external measure crosses a threshold. It can speed settlement, but basis risk exists when the index differs from a farmer’s actual loss.'),

  item('AGSCI-4.1', 'Which statement correctly distinguishes weather from climate?', 'Weather describes short-term conditions, while climate summarises long-term patterns', ['Weather and climate always mean the same day', 'Climate is measured for only one hour', 'Weather cannot include rainfall'], 'Weather records conditions over short periods. Climate uses long-term statistics and patterns, although individual seasons can still differ from the average.'),
  item('AGSCI-4.1', 'How can a prolonged drought reduce crop yield?', 'Water stress limits photosynthesis, nutrient movement and growth', ['It guarantees greater leaf expansion', 'It makes soil water permanently abundant', 'It prevents every pest outbreak'], 'Insufficient water causes stomata to close and reduces cell expansion and nutrient transport. Timing matters because flowering and grain filling can be especially sensitive.'),
  item('AGSCI-4.1', 'Why should a farm analyse rainfall records across many years?', 'To estimate variability and the likelihood of dry or wet periods', ['To predict an exact storm time years ahead', 'To remove all uncertainty from farming', 'To replace current weather forecasts'], 'Long records reveal onset, totals, distribution and extremes. They support risk planning, but forecasts and field observations are still needed for current decisions.'),
  item('AGSCI-4.1', 'Warmer conditions allow a crop pest to complete more generations in a season. What is the likely farm effect?', 'Pest pressure may increase unless monitoring and control adapt', ['The pest must become harmless', 'Crop resistance automatically doubles', 'Temperature can no longer affect insect development'], 'Many insects develop faster within a suitable temperature range. More generations can raise population pressure, so surveillance and integrated management may need adjustment.'),

  item('AGSCI-4.2', 'Which is an adaptation to increasing dry-season water shortages?', 'Harvesting rainwater and using efficient irrigation', ['Burning crop residues after every harvest', 'Removing all soil cover', 'Increasing water losses from leaking pipes'], 'Water storage increases availability, while efficient delivery reduces losses. Together they lower vulnerability without claiming to prevent drought itself.'),
  item('AGSCI-4.2', 'Why might a farmer adjust planting date using a credible seasonal forecast?', 'To better align sensitive crop stages with expected rainfall', ['To guarantee that the forecast cannot be wrong', 'To remove the need for seed selection', 'To make soil preparation irrelevant'], 'Forecasts provide probabilistic guidance rather than certainty. Combining them with local observations, suitable varieties and contingency plans improves the decision.'),
  item('AGSCI-4.2', 'How can drought-tolerant varieties support climate adaptation?', 'They can maintain useful production under limited water better than susceptible varieties', ['They grow without any water', 'They eliminate every crop disease', 'They make good agronomy unnecessary'], 'Tolerance reduces yield loss under defined stress conditions, but performance still depends on suitable soils, planting time, nutrients, pests and available moisture.'),
  item('AGSCI-4.2', 'What adaptation benefit can agroforestry provide on a farm?', 'Trees can moderate microclimate, protect soil and diversify products', ['Trees always increase competition without benefits', 'It removes all need for crop management', 'It guarantees identical yields every season'], 'Well-designed tree–crop systems can supply shade, wind protection, organic matter and additional products. Species, spacing and management determine whether benefits exceed competition.'),

  item('AGSCI-4.3', 'Which practice can increase carbon stored in agricultural soil?', 'Returning compost and maintaining protective organic matter', ['Burning residues openly', 'Leaving soil bare throughout the year', 'Removing every root after harvest'], 'Organic inputs and ground cover can build soil carbon when additions exceed losses. They may also improve structure and water retention under appropriate management.'),
  item('AGSCI-4.3', 'Why does avoiding open burning of crop residues help climate mitigation?', 'It reduces immediate greenhouse-gas and smoke emissions while preserving material for other uses', ['It causes carbon dioxide to disappear from the atmosphere', 'It stops all decomposition permanently', 'It guarantees zero emissions from farming'], 'Open burning rapidly releases carbon and air pollutants. Residues may instead be composted, mulched or otherwise managed according to pest and soil conditions.'),
  item('AGSCI-4.3', 'How can applying nitrogen fertiliser at the correct rate and time reduce emissions?', 'It improves crop uptake and reduces excess nitrogen available for loss', ['It makes nitrogen chemically inactive forever', 'It requires applying the whole annual rate during heavy rain', 'It removes the need to assess soil fertility'], 'Matching application to crop demand improves nitrogen-use efficiency. Avoiding unnecessary or poorly timed inputs can reduce nitrous oxide and leaching losses.'),
  item('AGSCI-4.3', 'Which change can reduce fossil-fuel use for pumping irrigation water?', 'Using an appropriately sized solar-powered pump with efficient water delivery', ['Running an oversized diesel pump continuously', 'Allowing distribution pipes to leak', 'Pumping water when storage is already full'], 'A correctly designed solar system can replace fuel use during operation. Efficiency, maintenance, storage and responsible groundwater abstraction are still necessary.'),
];

function mcq(index, source) {
  const correctIndex = index % 4;
  const rawOptions = [...source.wrong];
  rawOptions.splice(correctIndex, 0, source.correct);
  const options = rawOptions.map((text, optionIndex) => ({
    label: labels[optionIndex],
    text,
    rationale: optionIndex === correctIndex
      ? `This is the supported answer. ${source.explanation}`
      : 'This is a plausible misconception, but it does not follow the agricultural principle or evidence established in the worked solution.',
  }));
  return {
    id: `q_was_agric_b001_${String(index + 1).padStart(3, '0')}`,
    original: true,
    topicCode: source.topicCode,
    type: 'multiple_choice',
    prompt: source.prompt,
    options,
    correctAnswer: labels[correctIndex],
    workedSolution: `${source.explanation} Therefore the correct answer is ${labels[correctIndex]}: ${source.correct}.`,
    difficulty: difficulties[index % difficulties.length],
    marks: index % 5 === 4 ? 3 : index % 2 === 0 ? 1 : 2,
    commandWord: /why|how/i.test(source.prompt) ? 'Explain' : /calculate/i.test(source.prompt) ? 'Calculate' : 'Identify',
    assessmentObjective: assessmentObjectives[index % assessmentObjectives.length],
  };
}

const batch = {
  batchId: 'wassce-agric-beta-001',
  status: 'approved_for_production',
  examTypeId: 'exam_wassce',
  provenance: [{
    publisher: 'National Council for Curriculum and Assessment, Ghana',
    title: 'Agricultural Science Curriculum for Secondary Education',
    url: sourceUrl,
    use: 'curriculum_blueprint_only',
  }],
  review: {
    authoringMethod: 'original_curriculum_aligned',
    qualityAssurance: 'automated_beta',
    automatedChecksAt: generatedAt,
  },
  release: {
    channel: 'beta',
    contentLabel,
    officialExamBoardContent: false,
    feedbackEnabled: true,
  },
  subjects: [{
    subjectId: 'subj_wassce_agric',
    specificationCode: 'NaCCA-SHS-AGSCI-2025',
    topics: topics.map(([code, title, objective]) => ({ code, title, objective })),
    questions: facts.map((source, index) => mcq(index, source)),
  }],
};

const validation = validateQuestionBatch(batch, { mode: 'production' });
if (!validation.valid) throw new Error(`Generated batch failed validation:\n${validation.errors.join('\n')}`);

const sql = (value) => value == null ? 'NULL' : `'${String(value).replaceAll("'", "''")}'`;
const topicId = (code) => `topic_was_agric_${code.split('-').at(-1).replace('.', '_').toLowerCase()}`;
const syllabusTopicId = (code) => `st_was_agric_${code.split('-').at(-1).replace('.', '_').toLowerCase()}`;
const batchId = batch.batchId;

const foundation = [
  '-- 113: Future-proof question release provenance and WASSCE Agricultural Science blueprint.',
  '-- Original practice content only; official sources are curriculum blueprints.',
  'PRAGMA foreign_keys = ON;',
  `CREATE TABLE IF NOT EXISTS question_content_releases (
    question_id TEXT PRIMARY KEY REFERENCES questions(id) ON DELETE CASCADE,
    batch_id TEXT NOT NULL,
    quality_assurance TEXT NOT NULL CHECK (quality_assurance IN ('automated_beta', 'human_reviewed')),
    release_channel TEXT NOT NULL CHECK (release_channel IN ('beta', 'production')),
    content_label TEXT NOT NULL,
    source_url TEXT NOT NULL,
    official_exam_board_content INTEGER NOT NULL DEFAULT 0 CHECK (official_exam_board_content IN (0, 1)),
    feedback_enabled INTEGER NOT NULL DEFAULT 1 CHECK (feedback_enabled IN (0, 1)),
    released_at TEXT NOT NULL DEFAULT (datetime('now'))
  );`,
  'CREATE INDEX IF NOT EXISTS idx_question_content_releases_batch ON question_content_releases(batch_id);',
  `INSERT OR IGNORE INTO question_content_releases (question_id, batch_id, quality_assurance, release_channel, content_label, source_url, official_exam_board_content, feedback_enabled)
   SELECT id, 'edexcel-igcse-beta-001', 'automated_beta', 'beta', 'Original BrillaPrep practice content aligned to the published Pearson Edexcel syllabus; not official Pearson material.', 'https://qualifications.pearson.com/', 0, 1
   FROM questions WHERE id LIKE 'q_edx_%_b001_%';`,
  `INSERT OR IGNORE INTO exam_boards (id, name, code, full_name, region, website_url, is_active, display_order) VALUES ('board_waec', 'WAEC', 'WAEC', 'West African Examinations Council', 'West Africa', 'https://waecgh.org/', 1, 1);`,
  `INSERT OR IGNORE INTO subject_specifications (id, exam_board_id, subject_id, exam_type_id, syllabus_code, syllabus_name, specification_year, valid_from, syllabus_pdf_url, total_papers, assessment_info, is_active, display_order) VALUES ('spec_wassce_agric_nacca_2025', 'board_waec', 'subj_wassce_agric', 'exam_wassce', 'NaCCA-SHS-AGSCI-2025', 'Agricultural Science Curriculum for Secondary Education', '2025 curriculum', '2025-04-01', ${sql(sourceUrl)}, 3, 'Curriculum-aligned BrillaPrep practice blueprint; verify current WAEC paper structure separately.', 1, 1);`,
];

for (const [index, [code, title, objective]] of topics.entries()) {
  foundation.push(`INSERT OR IGNORE INTO topics (id, subject_id, name, slug, description, display_order) VALUES (${sql(topicId(code))}, 'subj_wassce_agric', ${sql(title)}, ${sql(code.toLowerCase().replace('.', '-'))}, ${sql(objective)}, ${index + 1});`);
  foundation.push(`INSERT OR IGNORE INTO syllabus_topics (id, specification_id, topic_code, title, description, assessment_objectives, display_order) VALUES (${sql(syllabusTopicId(code))}, 'spec_wassce_agric_nacca_2025', ${sql(code)}, ${sql(title)}, ${sql(objective)}, ${sql(JSON.stringify(assessmentObjectives))}, ${index + 1});`);
}
foundation.push('CREATE TABLE IF NOT EXISTS _migration_113_guard (valid INTEGER NOT NULL CHECK (valid = 1));');
foundation.push('DELETE FROM _migration_113_guard;');
foundation.push("INSERT INTO _migration_113_guard(valid) SELECT CASE WHEN (SELECT COUNT(*) FROM topics WHERE id LIKE 'topic_was_agric_%') = 10 AND (SELECT COUNT(*) FROM syllabus_topics WHERE specification_id = 'spec_wassce_agric_nacca_2025') = 10 THEN 1 ELSE 0 END;");
foundation.push('DROP TABLE _migration_113_guard;');

const statements = batch.subjects[0].questions.map((question) => {
  const options = JSON.stringify(question.options.map(({ label, text }) => `${label}. ${text}`));
  return `INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, time_limit, syllabus_topic_id, command_word, assessment_objective, exam_board_id) VALUES (${sql(question.id)}, ${sql(topicId(question.topicCode))}, 'subj_wassce_agric', 'exam_wassce', ${sql(question.prompt)}, 'multiple_choice', ${sql(options)}, ${sql(question.correctAnswer)}, ${sql(question.workedSolution)}, ${sql(question.difficulty)}, ${question.marks}, ${question.marks}, 90, ${sql(syllabusTopicId(question.topicCode))}, ${sql(question.commandWord)}, ${sql(question.assessmentObjective)}, 'board_waec');`;
});

const outBatch = resolve(root, 'content/batches/wassce-agric-beta-001.json');
await mkdir(dirname(outBatch), { recursive: true });
await writeFile(outBatch, `${JSON.stringify(batch, null, 2)}\n`);

const migrations = [];
const foundationPath = resolve(root, 'database/migrations/113_wassce_agric_beta_foundation.sql');
await writeFile(foundationPath, `${foundation.join('\n')}\n`);
migrations.push(foundationPath);

for (const part of [1, 2, 3, 4]) {
  const migrationNumber = 113 + part;
  const start = (part - 1) * 10;
  const end = part * 10;
  const firstId = `q_was_agric_b001_${String(start + 1).padStart(3, '0')}`;
  const lastId = `q_was_agric_b001_${String(end).padStart(3, '0')}`;
  const lines = [
    `-- ${migrationNumber}: Original BrillaPrep WASSCE Agricultural Science beta questions, part ${part}.`,
    '-- Curriculum-aligned practice content; not official WAEC or NaCCA examination material.',
    'PRAGMA foreign_keys = ON;',
    ...statements.slice(start, end),
    `INSERT OR IGNORE INTO question_content_releases (question_id, batch_id, quality_assurance, release_channel, content_label, source_url, official_exam_board_content, feedback_enabled) SELECT id, ${sql(batchId)}, 'automated_beta', 'beta', ${sql(contentLabel)}, ${sql(sourceUrl)}, 0, 1 FROM questions WHERE id BETWEEN ${sql(firstId)} AND ${sql(lastId)};`,
  ];
  if (part === 4) {
    lines.push('CREATE TABLE IF NOT EXISTS _migration_117_guard (valid INTEGER NOT NULL CHECK (valid = 1));');
    lines.push('DELETE FROM _migration_117_guard;');
    lines.push("INSERT INTO _migration_117_guard(valid) SELECT CASE WHEN (SELECT COUNT(*) FROM questions WHERE id LIKE 'q_was_agric_b001_%') = 40 AND (SELECT COUNT(*) FROM question_content_releases WHERE batch_id = 'wassce-agric-beta-001') = 40 THEN 1 ELSE 0 END;");
    lines.push('DROP TABLE _migration_117_guard;');
  }
  const output = resolve(root, `database/migrations/${migrationNumber}_wassce_agric_beta_part_${part}.sql`);
  await writeFile(output, `${lines.join('\n')}\n`);
  migrations.push(output);
}
console.log(JSON.stringify({ validation, outBatch, migrations }, null, 2));
