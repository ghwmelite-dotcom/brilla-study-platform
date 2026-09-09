import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeQuestionText, validateQuestionBatch } from './question-content-lib.mjs';

const sourceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputRootArgument = process.argv.indexOf('--output-root');
if (outputRootArgument >= 0 && !process.argv[outputRootArgument + 1]) throw new Error('--output-root requires a path');
const outputRoot = outputRootArgument >= 0 ? resolve(process.argv[outputRootArgument + 1]) : sourceRoot;
const generatedAt = '2026-09-09T00:00:00Z';
const labels = ['A', 'B', 'C', 'D'];
const batchId = 'wassce-english-sprint1-001';
const contentLabel = 'Original BrillaPrep WASSCE English practice content; not official WAEC material.';
const structuredContentLabel = 'Original BrillaPrep WASSCE English practice; not official WAEC examination material.';
const releaseSourceUrl = 'https://nacca.gov.gh/secondary-education-curriculum/';

const naccaSource = (title) => ({
  publisher: 'National Council for Curriculum and Assessment, Ghana',
  title,
  url: releaseSourceUrl,
  use: 'curriculum_blueprint_only',
});
const waecSource = (title) => ({
  publisher: 'West African Examinations Council',
  title,
  url: 'https://waecgh.org/',
  use: 'curriculum_blueprint_only',
});

const mcq = (topicCode, difficulty, prompt, correct, wrong, solution, commandWord = 'Choose', assessmentObjective = 'AO2', timeLimit = 45) =>
  ({ topicCode, difficulty, prompt, correct, wrong, solution, commandWord, assessmentObjective, timeLimit });
const sa = (topicCode, difficulty, prompt, answer, solution, commandWord = 'State', assessmentObjective = 'AO2') =>
  ({ topicCode, difficulty, prompt, answer, solution, commandWord, assessmentObjective });
const stq = (topicCode, prompt, parts, guide, commandWord = 'Answer') =>
  ({ topicCode, prompt, parts, guide, commandWord });

// Prod-canonical topic bindings for subj_wassce_english, verified read-only against
// brilla-db on 2026-09-09 (SELECT id, name, slug FROM topics WHERE subject_id = 'subj_wassce_english').
const topics = [
  ['ENG-CMP', 'topic_wassce_english_comprehension', 'Comprehension', 'Read short passages and answer literal, inferential and vocabulary-in-context questions.'],
  ['ENG-SUM', 'topic_wassce_english_summary', 'Summary Writing', "Identify main points and condense passages into concise sentences in the candidate's own words."],
  ['ENG-ESS', 'topic_wassce_english_essay', 'Essay Writing', 'Plan and compose narrative, descriptive, expository and argumentative essays.'],
  ['ENG-LET', 'topic_wassce_english_letter', 'Letter and Report Writing', 'Apply the formats and registers of formal and informal letters, speeches, articles and reports.'],
  ['ENG-LIT', 'topic_wassce_english_literary_devices', 'Literary Devices', 'Identify and interpret figurative language such as simile, metaphor, personification and hyperbole.'],
  ['ENG-GRAM', 'topic_wassce_english_grammar', 'Grammar and Usage', 'Apply the rules of concord, tense, voice and sentence transformation.'],
];

// Rows seeded by the foundation migration so fresh baselines gain the prod-canonical
// topic ids. Prod patch 096 already creates five of them; literary_devices exists only
// on prod, so it is inserted for fresh baselines. Slugs are derived from the id (not
// copied from prod) so a legacy seed row owning the human slug cannot collide with
// UNIQUE(subject_id, slug); on prod every INSERT OR IGNORE no-ops on the id.
const canonicalTopicRows = [
  ['topic_wassce_english_comprehension', 'subj_wassce_english', null, 'Comprehension', 'Reading passages, identifying main ideas, inference and vocabulary in context', 'Comprehension questions test close reading: literal recall, inference, and the meaning of words and expressions as used in a passage.', '["Main idea vs supporting detail", "Inference = conclusion from evidence", "Vocabulary in context"]', 1],
  ['topic_wassce_english_summary', 'subj_wassce_english', null, 'Summary Writing', 'Identifying topic sentences and condensing passages into concise sentences', 'Summary writing requires identifying the main points of a passage and expressing them briefly in the candidate\'s own words, without lifting phrases.', '["Own words, no lifting", "One sentence where required", "Main points only"]', 2],
  ['topic_wassce_english_essay', 'subj_wassce_english', null, 'Essay Writing', 'Narrative, descriptive, expository and argumentative essays', 'Essay writing covers the four main WASSCE types: narrative, descriptive, expository and argumentative, each with its own purpose and register.', '["Narrative = story", "Descriptive = senses", "Expository = explain", "Argumentative = persuade"]', 5],
  ['topic_wassce_english_letter', 'subj_wassce_english', null, 'Letter and Report Writing', 'Formal and informal letters, reports, articles and speeches', 'Letter and report writing tests format and register: addresses, salutations, headings, subscriptions, and the impersonal structure of official reports.', '["Formal: two addresses + heading", "Yours faithfully pairs with Dear Sir/Madam", "Reports: title, sections, facts"]', 6],
  ['topic_wassce_english_literary_devices', 'subj_wassce_english', null, 'Literary Devices', 'Metaphor, simile, personification, hyperbole, alliteration and irony', 'Literary devices are figures of speech and sound patterns writers use for effect; candidates must identify and interpret them in context.', '["Simile uses like/as", "Metaphor states identity", "Personification gives human qualities", "Hyperbole exaggerates"]', 8],
  ['topic_wassce_english_grammar', 'subj_wassce_english', null, 'Grammar and Usage', 'Parts of speech, concord, tenses, active and passive voice', 'Grammar and usage covers concord, tense sequence, voice, and the correction and transformation of sentences.', '["Singular subject takes singular verb", "Past perfect for the earlier of two past actions", "Passive: object becomes subject"]', 4],
];

const topicId = (code) => topics.find(([topicCode]) => topicCode === code)[1];
for (const [code, id] of topics) {
  const row = canonicalTopicRows.find(([topicRowId]) => topicRowId === id);
  if (!row) throw new Error(`${code}: topic id ${id} is not a prod-verified canonical WASSCE English topic`);
  if (row[1] !== 'subj_wassce_english') throw new Error(`${code}: topic id ${id} belongs to ${row[1]}, not subj_wassce_english`);
}

// --- Question content ---------------------------------------------------------
const passageA = 'When the harmattan came, Kofi\'s grandfather was ready. He had sealed the windows with old newspapers and moved his seedlings into the shade of the mango tree. "The wind respects the prepared," he said. When the haze lifted, his was the only garden on the street still green.';
const passageB = 'Mansa\'s school began a silent reading period every morning. At first the students grumbled, but within a term the library\'s borrowing records had doubled and essays had grown longer and richer. "You cannot hear a book," the headmistress said, "until the noise stops." Soon parents asked how to start the habit at home.';

const comprehensionMcq = [
  mcq('ENG-CMP', 'easy', `Read the passage, then answer. — "${passageA}" According to the passage, Kofi's grandfather sealed the windows with what material?`,
    'old newspapers', ['wet towels', 'wooden boards', 'plastic sheets'],
    'The passage states directly that he "had sealed the windows with old newspapers". The other materials are not mentioned anywhere in the passage.',
    'Identify', 'AO1', 60),
  mcq('ENG-CMP', 'easy', `Read the passage, then answer. — "${passageA}" Where did the grandfather move his seedlings?`,
    'into the shade of the mango tree', ['behind the house', 'onto the street', 'into the kitchen'],
    'The passage says he "moved his seedlings into the shade of the mango tree". None of the other locations is mentioned.',
    'Identify', 'AO1', 60),
  mcq('ENG-CMP', 'medium', `Read the passage, then answer. — "${passageA}" The saying "The wind respects the prepared" suggests that`,
    'hardship has less power over people who make ready for it', ['the wind avoids only wealthy households', 'preparation can stop the harmattan from blowing', 'the wind is a person who greets the elders'],
    'The saying is figurative: the prepared suffer less from hardship, as the grandfather\'s intact garden shows. It does not claim the wind is literally a person.',
    'Interpret', 'AO2', 60),
  mcq('ENG-CMP', 'medium', `Read the passage, then answer. — "${passageA}" The grandfather's actions show that he was`,
    'foresighted and careful', ['afraid of his neighbours', 'wasteful with his property', 'indifferent to the weather'],
    'Sealing windows and sheltering seedlings before the wind arrived show planning and care; nothing suggests fear of neighbours, waste, or indifference.',
    'Interpret', 'AO2', 60),
  mcq('ENG-CMP', 'hard', `Read the passage, then answer. — "${passageA}" The last sentence implies that the other people on the street`,
    'had not prepared for the harmattan as well as the grandfather', ['had planted no gardens at all', 'envied the grandfather\'s mango tree', 'had left the street before the harmattan'],
    'His garden was the only one still green, and the passage ties his success to preparation; the implied contrast is that the others had not prepared as well.',
    'Infer', 'AO3', 60),
  mcq('ENG-CMP', 'easy', `Read the passage, then answer. — "${passageB}" How often was the silent reading period held?`,
    'every morning', ['once a week', 'every evening', 'once a term'],
    'The opening sentence says the school "began a silent reading period every morning". Weekly, evening and termly periods are not mentioned.',
    'Identify', 'AO1', 60),
  mcq('ENG-CMP', 'easy', `Read the passage, then answer. — "${passageB}" At first, the students`,
    'grumbled about the reading period', ['borrowed twice as many books', 'wrote longer and richer essays', 'asked their parents for help'],
    '"At first the students grumbled." The doubled borrowing and richer essays came later, so they describe the result, not the first reaction.',
    'Identify', 'AO1', 60),
  mcq('ENG-CMP', 'medium', `Read the passage, then answer. — "${passageB}" Which of the following does the passage give as evidence that the reading period succeeded?`,
    'The library\'s borrowing records had doubled', ['The students stopped grumbling at home', 'The headmistress closed the library', 'The parents bought new books for the school'],
    'The passage names two pieces of evidence: doubled borrowing records and richer essays. Only the first appears among the options.',
    'Identify', 'AO2', 60),
  mcq('ENG-CMP', 'medium', `Read the passage, then answer. — "${passageB}" The headmistress's words "You cannot hear a book until the noise stops" mean that`,
    'reading requires quiet and full attention', ['books make a noise when they are read aloud', 'students should stop reading noisy books', 'the library should be soundproofed'],
    'The saying is figurative: "hearing" a book means absorbing it and "noise" means distraction, so reading needs quiet attention.',
    'Interpret', 'AO2', 60),
  mcq('ENG-CMP', 'hard', `Read the passage, then answer. — "${passageB}" The word "grumbled" as used in the passage means`,
    'complained in a quiet, discontented way', ['rejoiced openly', 'refused to obey', 'read aloud'],
    'Their later benefit shows the first reaction was muted discontent, not refusal: "grumbled" means complained in a low, discontented way.',
    'Interpret', 'AO3', 60),
];

const comprehensionSa = [];

const comprehensionSt = stq('ENG-CMP', 'Read the passage, then answer all the questions. — "Every evening Adjoa sells roasted plantain by the junction. She notes every sale in a small book and sets aside a fifth of her profit for new stock. Customers say her plantain is dearer than her neighbour\'s, yet her tray empties first, because she greets every buyer by name and never serves a burnt piece."', [
  { label: 'a', text: 'What does Adjoa sell, and where does she sell it?', marks: 2, correctAnswer: 'She sells roasted plantain by the junction.' },
  { label: 'b', text: 'State two things Adjoa does to manage her money.', marks: 4, correctAnswer: 'She notes every sale in a small book, and she sets aside a fifth of her profit for new stock.' },
  { label: 'c', text: 'Give two reasons why Adjoa\'s tray empties first although her plantain is dearer.', marks: 4, correctAnswer: 'She greets every buyer by name, and she never serves a burnt piece.' },
], 'All answers must come straight from the passage: (a) names the goods and the place; (b) wants the record book and the saved fifth of the profit; (c) wants the personal greeting and the unburnt pieces.', 'Read');

const summaryMcq = [
  mcq('ENG-SUM', 'easy', 'A good summary of a passage should',
    'state the main points briefly in your own words', ['reproduce every sentence of the passage', 'add your own opinions to the writer\'s ideas', 'copy the longest sentences word for word'],
    'A summary condenses the passage to its main points in the candidate\'s own words; copying sentences or adding opinions defeats the purpose.',
    'Identify', 'AO1'),
  mcq('ENG-SUM', 'easy', 'Which of the following should normally be left out of a summary?',
    'Repetitions and illustrative examples', ['The main idea of each paragraph', 'The writer\'s overall conclusion', 'Important supporting arguments'],
    'Summaries keep main ideas and conclusions but drop repetitions, examples and other illustrative detail that merely supports the main points.',
    'Identify', 'AO1'),
  mcq('ENG-SUM', 'easy', 'The topic sentence of a paragraph usually',
    'states the main idea of the paragraph', ['gives the writer\'s biography', 'is always the longest sentence of the paragraph', 'asks the reader a direct question'],
    'The topic sentence expresses the paragraph\'s controlling idea, which the other sentences develop. It need not be the longest sentence or a question.',
    'Identify', 'AO1'),
  mcq('ENG-SUM', 'easy', 'When a summary question says "in one sentence", the candidate must',
    'combine the required points into a single grammatical sentence', ['write only one word as the answer', 'use exactly one line of the answer sheet', 'quote one sentence from the passage'],
    'The instruction limits the form: the points must be joined into one grammatical sentence, often with conjunctions. Quoting the passage does not satisfy it.',
    'Identify', 'AO1'),
  mcq('ENG-SUM', 'medium', 'Choose the best summary of the following. — "The factory closed in June. More than two hundred workers lost their jobs, and many shops in the town lost their customers."',
    'The factory\'s closure cost many workers their jobs and the shops their customers.',
    ['The factory closed because two hundred workers lost their jobs in June.',
      'Two hundred shops closed when the factory lost its customers.',
      'The town\'s shops closed in June, throwing factory workers out of work.'],
    'A correct summary keeps both effects: job losses and lost customers. Each wrong option reverses the cause or confuses who closed and who lost customers.',
    'Summarize', 'AO2'),
  mcq('ENG-SUM', 'medium', 'Examiners penalise "lifting" whole phrases from the passage in a summary because',
    'it shows the candidate cannot express the ideas in their own words', ['summaries must always be written in pencil', 'the passage is the examiner\'s property', 'lifted phrases always contain wrong ideas'],
    'Summary questions test comprehension and expression, so copied phrases — even correct ones — do not prove the candidate can restate the ideas.',
    'Explain', 'AO2'),
  mcq('ENG-SUM', 'medium', 'Choose the best summary of the following. — "Kofi woke before dawn, swept the store, counted the stock and opened the doors before the first customers arrived."',
    'Kofi completed all his opening duties before the customers arrived.',
    ['Kofi woke before dawn and the customers arrived.',
      'Kofi swept the store because he woke before dawn.',
      'Kofi counts the stock whenever customers arrive early.'],
    'The best option condenses the three duties into "all his opening duties" and keeps the point that they were finished before customers came; the others lose or distort content.',
    'Summarize', 'AO2'),
  mcq('ENG-SUM', 'hard', 'A passage argues that deforestation causes soil erosion and flooding, and that tree planting is the remedy. Which sentence should NOT appear in its summary?',
    'In 1994, one northern village lost its only bridge to a flood.',
    ['Deforestation strips the land of its tree cover.',
      'The loss of tree cover causes soil erosion and flooding.',
      'The tree-planting scheme is intended to reverse the damage.'],
    'The bridge incident is a specific illustration, not a main point. The other sentences capture the argument: the problem, its effects and the remedy.',
    'Evaluate', 'AO3'),
  mcq('ENG-SUM', 'hard', 'A summary requires two points: "The new market has improved trading conditions" and "The new market has created jobs for the youth". Which single sentence combines them best?',
    'The new market has improved trading conditions and created jobs for the youth.',
    ['The new market has improved trading conditions. It has also created jobs for the youth.',
      'Trading conditions have created a new market with jobs for the youth.',
      'The new market improved conditions for the trading jobs of the youth.'],
    'The correct option joins both points in one sentence without distortion; the first wrong option uses two sentences and the others tangle the relationships.',
    'Summarize', 'AO3'),
];

const summarySa = [
  sa('ENG-SUM', 'medium', 'Combine the following into one summary sentence without losing the essential meaning: "The rains failed. The crops withered. The farmers travelled to the city in search of work."',
    'Because the rains failed and the crops withered, the farmers travelled to the city in search of work.',
    'The statements form a cause chain: failed rains withered the crops, so the farmers migrated to the city. Link all three with "because" and add nothing.',
    'Summarize'),
];

const essayMcq = [
  mcq('ENG-ESS', 'easy', 'An essay that tells a story is called',
    'a narrative essay', ['an expository essay', 'an argumentative essay', 'a descriptive essay'],
    'Narrative essays recount events; expository essays explain, argumentative essays persuade and descriptive essays paint pictures with words.',
    'Identify', 'AO1'),
  mcq('ENG-ESS', 'easy', 'The introduction of an essay is expected to',
    'present the topic and indicate the direction the essay will take', ['list all the writer\'s sources of information', 'state the conclusion of the essay in full', 'describe the writer\'s school in detail'],
    'A good introduction presents the topic and shows the line the essay will follow; sources, full conclusions and personal detail do not belong there.',
    'Identify', 'AO1'),
  mcq('ENG-ESS', 'easy', 'A well-developed paragraph normally discusses',
    'one main idea', ['as many ideas as possible', 'only direct quotations', 'the opposite of its topic sentence'],
    'Unity is the rule of paragraphing: one main idea, stated in a topic sentence, is developed by the other sentences.',
    'Identify', 'AO1'),
  mcq('ENG-ESS', 'easy', 'Which of the following topics calls for a descriptive essay?',
    'My hometown on the morning of the annual festival', ['Should corporal punishment be abolished in schools?', 'Write a story that ends with the words: it was all a dream.', 'Explain how to prepare for an examination.'],
    'The festival scene asks the writer to paint a picture of a place and moment — descriptive writing. The others are argumentative, narrative and expository.',
    'Classify', 'AO2'),
  mcq('ENG-ESS', 'medium', 'In an argumentative essay, the writer acknowledges the opposing view in order to',
    'answer it and so strengthen the writer\'s own position', ['confuse the reader deliberately', 'show that both sides are equally right', 'fill up the required number of words'],
    'Anticipating and answering the strongest counter-argument shows the question has been considered fully and makes the chosen position more convincing.',
    'Explain', 'AO2'),
  mcq('ENG-ESS', 'medium', 'Coherence in an essay is achieved mainly through',
    'a logical order of ideas and appropriate linking words', ['long and difficult sentences', 'frequent repetition of the same point', 'the use of as many proverbs as possible'],
    'Coherence means ideas connect smoothly: a logical plan plus transitions such as "however" and "consequently". Length, repetition and proverbs do not create it.',
    'Explain', 'AO2'),
  mcq('ENG-ESS', 'medium', 'Which is the most effective opening thesis statement for an essay on "The importance of discipline in schools"?',
    'Discipline is essential in schools because it creates order, promotes learning and prepares students for adult responsibility.',
    ['Discipline is very important.', 'This essay is about discipline in schools.', 'Many people talk about discipline these days.'],
    'A strong thesis states the position and previews the reasons; the others are vague, merely announce the topic, or make an empty observation.',
    'Evaluate', 'AO2'),
  mcq('ENG-ESS', 'hard', 'Which opening is most appropriate for a speech supporting a motion in a school debate?',
    'Mr Chairman, Panel of Judges, fellow students, I rise to support the motion that...', ['Once upon a time, there lived a great hunter...', 'Dear Sir, I write to inform you that...', 'It was a dark and stormy night when...'],
    'A debate speech opens with the vocative address and a declaration of the speaker\'s side; the other openings belong to tales, letters and narratives.',
    'Evaluate', 'AO3'),
  mcq('ENG-ESS', 'hard', 'A paragraph loses its unity when',
    'a sentence introduces an idea that does not support the topic sentence', ['it begins with a clear topic sentence', 'its sentences are linked by connectives', 'it ends with a summarising sentence'],
    'Unity requires every sentence to develop the one idea in the topic sentence; only an unrelated idea destroys it.',
    'Evaluate', 'AO3'),
];

const essaySt = stq('ENG-ESS', 'You are to write an article for the school magazine on the topic: "Keeping Our School Compound Clean". Answer these planning questions.', [
  { label: 'a', text: 'State the type of composition required and its intended audience.', marks: 3, correctAnswer: 'An expository article for the school magazine, addressed to students and staff.' },
  { label: 'b', text: 'State three features of the format of a magazine article.', marks: 4, correctAnswer: 'A catchy title, a byline with the writer\'s name, and organised paragraphs from introduction to conclusion.' },
  { label: 'c', text: 'Write one suitable topic sentence for a paragraph on how students can help.', marks: 3, correctAnswer: 'Students can keep the compound clean by using the litter bins and joining the weekly clean-up exercise.' },
], 'Match the task: (a) an expository article for the school community; (b) title, byline and organised paragraphs; (c) one clear sentence on how students can help.', 'Plan');

const letterMcq = [
  mcq('ENG-LET', 'easy', 'A formal letter to a public officer must contain',
    'the writer\'s address and the recipient\'s address', ['only the recipient\'s address', 'no address at all', 'only a telephone number'],
    'Formal letters carry two addresses — the writer\'s and the recipient\'s — plus the date; informal letters carry only the writer\'s address.',
    'Identify', 'AO1'),
  mcq('ENG-LET', 'easy', 'The most suitable salutation for a formal letter written to a stranger is',
    'Dear Sir,', ['My dear Kofi,', 'Hello Sir,', 'Dearest friend,'],
    'A stranger in an official position is addressed "Dear Sir" or "Dear Madam"; the other salutations are informal or too casual.',
    'Choose', 'AO1'),
  mcq('ENG-LET', 'easy', 'Which subscription is appropriate for a letter to a close friend?',
    'Yours ever,', ['Yours faithfully,', 'Yours sincerely,', 'Yours obediently,'],
    'Letters to friends close warmly with subscriptions such as "Yours ever"; "faithfully" and "sincerely" belong to formal letters, and "obediently" is servile.',
    'Choose', 'AO1'),
  mcq('ENG-LET', 'easy', 'A report is usually written in order to',
    'present facts and findings to the person or body that asked for them', ['entertain readers with an exciting story', 'describe the writer\'s personal feelings', 'advertise a new product to the public'],
    'A report is commissioned: someone in authority asks for facts, findings and often recommendations on a specific matter.',
    'Identify', 'AO1'),
  mcq('ENG-LET', 'medium', 'In a formal letter, the heading is normally written',
    'in capital letters, and it may be underlined', ['in small letters only', 'in red ink without exception', 'after the subscription at the end'],
    'The heading announces the subject and is conventionally written in capital letters, sometimes underlined, and placed after the salutation.',
    'Identify', 'AO2'),
  mcq('ENG-LET', 'medium', 'The subscription "Yours faithfully" is correctly paired with the salutation',
    'Dear Sir,', ['Dear Mr Mensah,', 'Dear Akosua,', 'My dear Father,'],
    'An unnamed recipient ("Dear Sir") takes "Yours faithfully"; a named recipient ("Dear Mr Mensah") takes "Yours sincerely".',
    'Choose', 'AO2'),
  mcq('ENG-LET', 'medium', 'Which list gives the correct order of the opening parts of a formal letter?',
    'Writer\'s address, date, recipient\'s address, salutation', ['Date, salutation, writer\'s address, recipient\'s address', 'Recipient\'s address, writer\'s address, salutation, date', 'Salutation, writer\'s address, date, recipient\'s address'],
    'The conventional layout is writer\'s address, date, recipient\'s address on the left, then the salutation; every other sequence misplaces a part.',
    'Order', 'AO2'),
  mcq('ENG-LET', 'hard', 'A letter to the editor of a newspaper differs from a letter to a friend chiefly because it',
    'uses a formal register and the full formal-letter format for a public audience', ['is always written entirely in capital letters', 'needs no address or date at all', 'must be written by a professional journalist'],
    'A letter to the editor is a formal public document, so it keeps the full formal format and a restrained register even when the subject is a personal grievance.',
    'Evaluate', 'AO3'),
  mcq('ENG-LET', 'hard', 'In an official report, the section headed "terms of reference" states',
    'what the writer was instructed to investigate and report on', ['the names of all the members of the committee', 'the recommendations of the report', 'the cost of writing the report'],
    'The terms of reference record the mandate: who asked for the report and exactly what it was to cover.',
    'Explain', 'AO3'),
];

const letterSt = stq('ENG-LET', 'The headmistress has asked you, as senior prefect, to write a report on the damage done to classroom furniture during the term. Answer the following questions about the report you would write.', [
  { label: 'a', text: 'State two features of the format of an official report.', marks: 3, correctAnswer: 'A title or heading, and clearly labelled sections such as the introduction, findings and recommendations.' },
  { label: 'b', text: 'Write a suitable title for this report.', marks: 3, correctAnswer: 'Report on the Damage Done to Classroom Furniture During the Term.' },
  { label: 'c', text: 'State two kinds of information the findings section of the report should contain.', marks: 4, correctAnswer: 'A description of the furniture that was damaged, and the extent and possible causes of the damage.' },
], 'The report must suit its official purpose: (a) a title and labelled sections; (b) a title naming the subject of the report; (c) findings describing what was damaged and how badly or why.', 'Plan');

const literaryMcq = [
  mcq('ENG-LIT', 'easy', '"The wind whispered through the trees" is an example of',
    'personification', ['simile', 'hyperbole', 'irony'],
    'The wind is given the human ability to whisper — personification. There is no "like/as" for a simile, no exaggeration for hyperbole, no irony.',
    'Identify', 'AO1'),
  mcq('ENG-LIT', 'easy', '"The soldier fought like a lion" is an example of',
    'simile', ['metaphor', 'personification', 'alliteration'],
    'The comparison is made explicitly with "like", which makes it a simile; a metaphor would state the soldier was a lion.',
    'Identify', 'AO1'),
  mcq('ENG-LIT', 'easy', '"The examination hall was a furnace that afternoon" is an example of',
    'metaphor', ['simile', 'onomatopoeia', 'euphemism'],
    'The hall is said to be a furnace without "like" or "as" — a metaphor. It is not a sound-imitating word or a mild substitute.',
    'Identify', 'AO1'),
];

const literarySa = [
  sa('ENG-LIT', 'medium', 'Name the literary device used in this sentence: "I have warned you a thousand times about that dog."',
    'Hyperbole',
    'No speaker literally issues the same warning a thousand times; the number is a deliberate exaggeration used for emphasis. Exaggeration of this kind is the device called hyperbole or overstatement.',
    'Name', 'AO1'),
  sa('ENG-LIT', 'medium', 'Name the literary device used in this sentence: "The cool, clear current curled round the canoe."',
    'Alliteration',
    'The initial "c" sound is repeated in cool, clear, current, curled and canoe. The repetition of the same consonant sound at the beginning of nearby words is alliteration.',
    'Name', 'AO1'),
];

const grammarSa = [
  sa('ENG-GRAM', 'medium', 'Correct the concord error in this sentence: "Neither of the two boys have paid his fees."',
    'Neither of the two boys has paid his fees.',
    'The subject is "neither", which is singular and takes "has"; "of the two boys" only modifies the subject and does not change its number.',
    'Correct', 'AO2'),
  sa('ENG-GRAM', 'medium', 'Correct the concord error in this sentence: "The quality of the mangoes were poor."',
    'The quality of the mangoes was poor.',
    'The headword of the subject is "quality", which is singular, so the verb must be "was"; "of the mangoes" only qualifies the subject and does not control the verb.',
    'Correct', 'AO2'),
];

// --- Batch assembly -----------------------------------------------------------
const buildMcq = (source, index) => {
  const correctIndex = index % 4;
  const rawOptions = [...source.wrong];
  rawOptions.splice(correctIndex, 0, source.correct);
  const options = rawOptions.map((text, optionIndex) => ({
    label: labels[optionIndex],
    text,
    rationale: optionIndex === correctIndex
      ? `This is the supported answer. ${source.solution}`
      : 'This option is a plausible distractor, but the worked solution shows it does not state what the passage says or what the rule requires.',
  }));
  return { options, correctAnswer: labels[correctIndex] };
};

const structuredAnswer = (parts) => parts.map((part) => `(${part.label}) ${part.correctAnswer}`).join(' ');

const contentGroups = [
  { code: 'ENG-CMP', mcqs: comprehensionMcq, sas: comprehensionSa, sts: [comprehensionSt] },
  { code: 'ENG-SUM', mcqs: summaryMcq, sas: summarySa, sts: [] },
  { code: 'ENG-ESS', mcqs: essayMcq, sas: [], sts: [essaySt] },
  { code: 'ENG-LET', mcqs: letterMcq, sas: [], sts: [letterSt] },
  { code: 'ENG-LIT', mcqs: literaryMcq, sas: literarySa, sts: [] },
  { code: 'ENG-GRAM', mcqs: [], sas: grammarSa, sts: [] },
];

const subjectSources = [
  naccaSource('Secondary Education Curriculum — English Language'),
  waecSource('WASSCE English Language syllabus blueprint'),
];

const questions = [];
for (const group of contentGroups) {
  const slug = group.code.toLowerCase().replace('eng-', '');
  group.mcqs.forEach((source, index) => {
    const built = buildMcq(source, index);
    questions.push({
      id: `q_eng_s1_${slug}_mcq_${String(index + 1).padStart(3, '0')}`,
      original: true,
      topicCode: source.topicCode,
      type: 'multiple_choice',
      prompt: source.prompt,
      options: built.options,
      correctAnswer: built.correctAnswer,
      workedSolution: source.solution,
      difficulty: source.difficulty,
      marks: 1,
      points: 3,
      timeLimit: source.timeLimit,
      commandWord: source.commandWord,
      assessmentObjective: source.assessmentObjective,
      provenance: subjectSources,
    });
  });
  group.sas.forEach((source, index) => {
    questions.push({
      id: `q_eng_s1_${slug}_sa_${String(index + 1).padStart(3, '0')}`,
      original: true,
      topicCode: source.topicCode,
      type: 'short_answer',
      prompt: source.prompt,
      correctAnswer: source.answer,
      workedSolution: source.solution,
      difficulty: source.difficulty,
      marks: 2,
      points: 4,
      timeLimit: 90,
      commandWord: source.commandWord,
      assessmentObjective: source.assessmentObjective,
      provenance: subjectSources,
    });
  });
  group.sts.forEach((source, index) => {
    const marks = source.parts.reduce((sum, part) => sum + part.marks, 0);
    questions.push({
      id: `q_eng_s1_${slug}_st_${String(index + 1).padStart(3, '0')}`,
      original: true,
      topicCode: source.topicCode,
      type: 'structured',
      prompt: source.prompt,
      correctAnswer: structuredAnswer(source.parts),
      workedSolution: source.guide,
      difficulty: 'medium',
      marks,
      points: marks,
      timeLimit: 300,
      commandWord: source.commandWord,
      contentLabel: structuredContentLabel,
      markingScheme: null,
      parts: source.parts,
      provenance: subjectSources,
    });
  });
}

const batch = {
  batchId,
  status: 'approved_for_beta',
  examTypeId: 'exam_wassce',
  provenance: subjectSources,
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
    subjectId: 'subj_wassce_english',
    specificationCode: 'BRILLA-WASSCE-ENG-SPRINT1-001',
    sources: subjectSources,
    topics: topics.map(([code, , title, objective]) => ({ code, title, objective })),
    questions,
  }],
};

// --- Validation ---------------------------------------------------------------
const validation = validateQuestionBatch(batch, { mode: 'draft' });

function inHouseValidation(errors) {
  if (batch.review.automatedChecksAt !== generatedAt) errors.push('review.automatedChecksAt mismatch');
  if (batch.release.channel !== 'beta') errors.push('release.channel must be beta');
  if (typeof batch.release.contentLabel !== 'string' || batch.release.contentLabel.trim().length < 40) errors.push('release.contentLabel too short');
  if (!/not official/i.test(batch.release.contentLabel)) errors.push('release.contentLabel must disclaim official status');
  if (batch.release.officialExamBoardContent !== false) errors.push('release.officialExamBoardContent must be false');
  if (batch.release.feedbackEnabled !== true) errors.push('release.feedbackEnabled must be true');

  const expectedPerTopic = { 'ENG-CMP': 11, 'ENG-SUM': 10, 'ENG-ESS': 10, 'ENG-LET': 10, 'ENG-LIT': 5, 'ENG-GRAM': 2 };
  const difficulties = new Set(['easy', 'medium', 'hard']);
  for (const question of batch.subjects[0].questions) {
    if (!difficulties.has(question.difficulty)) errors.push(`${question.id}: difficulty invalid`);
    if (!Array.isArray(question.provenance) || question.provenance[0]?.use !== 'curriculum_blueprint_only') errors.push(`${question.id}: per-item provenance missing`);
  }
  for (const group of contentGroups) {
    const topicQuestions = questions.filter((question) => question.topicCode === group.code);
    if (topicQuestions.length !== expectedPerTopic[group.code]) {
      errors.push(`${group.code}: expected ${expectedPerTopic[group.code]} questions, found ${topicQuestions.length}`);
    }
    const mcqLetters = new Set(group.mcqs.map((source, index) => labels[index % 4]));
    if (group.mcqs.length >= 4 && mcqLetters.size < 3) errors.push(`${group.code}: MCQ correct-option letters do not vary enough`);
  }
}

const houseErrors = [];
inHouseValidation(houseErrors);
validation.errors.push(...houseErrors);
if (!validation.valid) throw new Error(`Generated batch failed validation:\n${validation.errors.join('\n')}`);

async function collectExistingContent() {
  const existing = new Map();
  const seedSql = await readFile(resolve(sourceRoot, 'database/seed.sql'), 'utf8');
  for (const match of seedSql.matchAll(/'(?:''|[^'])*'/g)) {
    const literal = match[0].slice(1, -1).replaceAll("''", "'");
    const normalized = normalizeQuestionText(literal);
    if (normalized.length >= 18) existing.set(normalized, 'database/seed.sql');
  }
  const batchesDir = resolve(sourceRoot, 'content/batches');
  for (const name of await readdir(batchesDir)) {
    if (!name.endsWith('.json') || name === `${batchId}.json`) continue;
    const candidate = JSON.parse(await readFile(resolve(batchesDir, name), 'utf8'));
    for (const subject of candidate.subjects ?? []) {
      for (const question of subject.questions ?? []) {
        const normalized = normalizeQuestionText(question.prompt);
        if (normalized) existing.set(normalized, `content/batches/${name}`);
      }
    }
  }
  return existing;
}

const existingContent = await collectExistingContent();
const duplicatePrompts = questions
  .map((question) => ({ id: question.id, source: existingContent.get(normalizeQuestionText(question.prompt)) }))
  .filter(({ source }) => source);
if (duplicatePrompts.length) {
  throw new Error(`Generated content duplicates existing rows:\n${duplicatePrompts.map(({ id, source }) => `${id}: ${source}`).join('\n')}`);
}

// --- SQL emission -------------------------------------------------------------
const sql = (value) => value == null ? 'NULL' : `'${String(value).replaceAll("'", "''")}'`;
const canonicalQuestionFields = [
  'topic_id', 'subject_id', 'exam_type_id', 'paper_type_id', 'past_paper_id',
  'question_text', 'question_type', 'round_type', 'options', 'correct_answer',
  'explanation', 'difficulty', 'points', 'marks', 'time_limit', 'question_number',
  'section', 'is_compulsory', 'image_url', 'syllabus_topic_id', 'command_word',
  'assessment_objective', 'source_paper_code', 'source_question_number', 'exam_board_id',
];

function questionValues(question) {
  const options = question.options
    ? JSON.stringify(question.options.map(({ label, text }) => `${label}. ${text}`))
    : null;
  return {
    topic_id: topicId(question.topicCode),
    subject_id: 'subj_wassce_english',
    exam_type_id: 'exam_wassce',
    paper_type_id: null,
    past_paper_id: null,
    question_text: question.prompt,
    question_type: question.type,
    round_type: null,
    options,
    correct_answer: question.correctAnswer,
    explanation: question.workedSolution,
    difficulty: question.difficulty,
    points: question.points,
    marks: question.marks,
    time_limit: question.timeLimit,
    question_number: null,
    section: null,
    is_compulsory: 1,
    image_url: null,
    syllabus_topic_id: null,
    command_word: question.commandWord,
    assessment_objective: question.assessmentObjective ?? null,
    source_paper_code: null,
    source_question_number: null,
    exam_board_id: null,
  };
}

const partValues = (question, part, index) => ({
  id: `sqp_${question.id}_${part.label}`,
  question_id: question.id,
  part_label: part.label,
  part_text: part.text,
  marks: part.marks,
  correct_answer: part.correctAnswer,
  explanation: null,
  answer_type: 'text',
  display_order: index,
});

function canonicalMatch(alias, values) {
  return canonicalQuestionFields.map((field) => `${alias}.${field} IS ${sql(values[field])}`).join(' AND ');
}

function partMatch(alias, values) {
  return Object.keys(values).map((field) => `${alias}.${field} IS ${sql(values[field])}`).join(' AND ');
}

function releaseMatch(alias) {
  return [
    `${alias}.batch_id IS '${batchId}'`,
    `${alias}.quality_assurance IS 'automated_beta'`,
    `${alias}.release_channel IS 'beta'`,
    `${alias}.content_label IS ${sql(contentLabel)}`,
    `${alias}.source_url IS ${sql(releaseSourceUrl)}`,
    `${alias}.official_exam_board_content IS 0`,
    `${alias}.feedback_enabled IS 1`,
  ].join(' AND ');
}

function assertWithinD1Limit(name, lines) {
  const crlf = `${lines.join('\n')}\n`.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
  const ledger = `\r\nINSERT INTO "d1_migrations" (name) values ('${name}');`;
  const bytes = Buffer.byteLength(crlf + ledger, 'utf8');
  if (bytes >= 19_500) throw new Error(`${name} exceeds the remote D1 query limit (${bytes} bytes)`);
}

const outBatch = resolve(outputRoot, `content/batches/${batchId}.json`);
await mkdir(dirname(outBatch), { recursive: true });
await writeFile(outBatch, `${JSON.stringify(batch, null, 2)}\n`);

const migrationPaths = [];
async function emitMigration(name, lines) {
  assertWithinD1Limit(name, lines);
  const output = resolve(outputRoot, `database/migrations/${name}`);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, `${lines.join('\n')}\n`);
  migrationPaths.push(output);
}

function questionMigrationLines(migrationNumber, partQuestions, heading) {
  const guardTable = `_migration_${migrationNumber}_guard`;
  const ids = partQuestions.map((question) => question.id);
  const lines = [
    `-- ${migrationNumber}: ${heading}`,
    '-- Original BrillaPrep curriculum-aligned practice content; not official WAEC material.',
    'PRAGMA foreign_keys = ON;',
    `CREATE TABLE IF NOT EXISTS ${guardTable} (valid INTEGER NOT NULL CHECK (valid = 1));`,
    `DELETE FROM ${guardTable};`,
  ];
  for (const question of partQuestions) {
    const values = questionValues(question);
    lines.push(`INSERT INTO ${guardTable}(valid) SELECT CASE WHEN NOT EXISTS (SELECT 1 FROM questions q WHERE q.id = ${sql(question.id)} AND NOT (${canonicalMatch('q', values)})) AND NOT EXISTS (SELECT 1 FROM question_content_releases r WHERE r.question_id = ${sql(question.id)} AND NOT (${releaseMatch('r')})) THEN 1 ELSE 0 END;`);
    if (question.type === 'structured') {
      for (const [index, part] of question.parts.entries()) {
        const values = partValues(question, part, index);
        lines.push(`INSERT INTO ${guardTable}(valid) SELECT CASE WHEN NOT EXISTS (SELECT 1 FROM structured_question_parts sp WHERE sp.id = ${sql(values.id)} AND NOT (${partMatch('sp', values)})) THEN 1 ELSE 0 END;`);
      }
    }
  }
  for (const question of partQuestions) {
    const values = questionValues(question);
    lines.push(`INSERT OR IGNORE INTO questions (id, ${canonicalQuestionFields.join(', ')}) VALUES (${sql(question.id)}, ${canonicalQuestionFields.map((field) => sql(values[field])).join(', ')});`);
    if (question.type === 'structured') {
      for (const [index, part] of question.parts.entries()) {
        const values = partValues(question, part, index);
        lines.push(`INSERT OR IGNORE INTO structured_question_parts (id, question_id, part_label, part_text, marks, correct_answer, explanation, answer_type, display_order) VALUES (${sql(values.id)}, ${sql(values.question_id)}, ${sql(values.part_label)}, ${sql(values.part_text)}, ${values.marks}, ${sql(values.correct_answer)}, NULL, 'text', ${index});`);
      }
    }
  }
  lines.push(`INSERT OR IGNORE INTO question_content_releases (question_id, batch_id, quality_assurance, release_channel, content_label, source_url, official_exam_board_content, feedback_enabled) SELECT id, '${batchId}', 'automated_beta', 'beta', ${sql(contentLabel)}, ${sql(releaseSourceUrl)}, 0, 1 FROM questions WHERE id IN (${ids.map(sql).join(', ')});`);
  lines.push(`DELETE FROM ${guardTable};`);
  lines.push(`INSERT INTO ${guardTable}(valid) SELECT CASE WHEN (SELECT COUNT(*) FROM questions WHERE id IN (${ids.map(sql).join(', ')})) = ${ids.length} AND (SELECT COUNT(*) FROM question_content_releases r WHERE r.question_id IN (${ids.map(sql).join(', ')}) AND ${releaseMatch('r')}) = ${ids.length} THEN 1 ELSE 0 END;`);
  lines.push(`DROP TABLE ${guardTable};`);
  return lines;
}

let migrationNumber = 422;
{
  const name = `${migrationNumber}_wassce_english_sprint1_foundation.sql`;
  const allTopicIds = topics.map(([, id]) => id);
  const cmpStructured = questions.filter((question) => question.topicCode === 'ENG-CMP' && question.type === 'structured');
  const lines = [
    `-- ${migrationNumber}: Foundation guard for WASSCE English Language sprint 1 batch 001.`,
    '-- Original BrillaPrep practice content; not official WAEC material.',
    '-- Seeds the prod-canonical WASSCE English topic rows for fresh baselines (prod patch 096',
    '-- created five of them; literary_devices exists only on prod). INSERT OR IGNORE no-ops on prod.',
    '-- Also carries the comprehension structured question to keep later migrations under the D1 limit.',
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
    ...canonicalTopicRows.map(([id, subjectId, parentId, topicName, description, theoryContent, keyFormulas, displayOrder]) =>
      // Slug derived from the canonical id so legacy seed-style topic rows keep their human
      // slugs; topics is UNIQUE(subject_id, slug). On prod the ids already exist and these
      // INSERT OR IGNORE statements no-op.
      `INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES (${sql(id)}, ${sql(subjectId)}, ${sql(parentId)}, ${sql(topicName)}, ${sql(id.slice(6).replaceAll('_', '-'))}, ${sql(description)}, ${sql(theoryContent)}, ${sql(keyFormulas)}, ${displayOrder}, '2026-08-04T00:00:00.000Z');`),
    ...questionMigrationLines(migrationNumber, cmpStructured, 'unused').slice(3),
    `CREATE TABLE IF NOT EXISTS _migration_${migrationNumber}_guard (valid INTEGER NOT NULL CHECK (valid = 1));`,
    `DELETE FROM _migration_${migrationNumber}_guard;`,
    `INSERT INTO _migration_${migrationNumber}_guard(valid) SELECT CASE WHEN EXISTS (SELECT 1 FROM exam_types WHERE id = 'exam_wassce') AND EXISTS (SELECT 1 FROM subjects WHERE id = 'subj_wassce_english' AND exam_type_id = 'exam_wassce') AND (SELECT COUNT(*) FROM topics t JOIN subjects s ON s.id = t.subject_id WHERE t.id IN (${allTopicIds.map(sql).join(', ')}) AND s.exam_type_id = 'exam_wassce') = ${allTopicIds.length} THEN 1 ELSE 0 END;`,
    `DROP TABLE _migration_${migrationNumber}_guard;`,
  ];
  await emitMigration(name, lines);
  migrationNumber += 1;
}

const byTopicType = (code, type) => questions.filter((question) => question.topicCode === code && question.type === type);
const cmpMcq = byTopicType('ENG-CMP', 'multiple_choice');
const sumMcq = byTopicType('ENG-SUM', 'multiple_choice');
const essMcq = byTopicType('ENG-ESS', 'multiple_choice');
const letMcq = byTopicType('ENG-LET', 'multiple_choice');
const chunks = [
  ['wassce_english_sprint1_comprehension_mcq_a', cmpMcq.slice(0, 5), 'WASSCE English comprehension multiple-choice set A (batch sprint 1).'],
  ['wassce_english_sprint1_comprehension_mcq_b', cmpMcq.slice(5), 'WASSCE English comprehension multiple-choice set B (batch sprint 1).'],
  ['wassce_english_sprint1_summary_a', [...sumMcq.slice(0, 5), ...byTopicType('ENG-SUM', 'short_answer')], 'WASSCE English summary multiple-choice set A and short-answer question (batch sprint 1).'],
  ['wassce_english_sprint1_summary_b', [...sumMcq.slice(5), ...byTopicType('ENG-GRAM', 'short_answer').slice(0, 1)], 'WASSCE English summary multiple-choice set B and grammar short-answer question (batch sprint 1).'],
  ['wassce_english_sprint1_essay_a', [...essMcq.slice(0, 4), ...byTopicType('ENG-ESS', 'structured')], 'WASSCE English essay-writing multiple-choice set A and structured question (batch sprint 1).'],
  ['wassce_english_sprint1_essay_b', [...essMcq.slice(4), ...byTopicType('ENG-LIT', 'short_answer').slice(0, 1)], 'WASSCE English essay-writing multiple-choice set B and literary-devices short-answer question (batch sprint 1).'],
  ['wassce_english_sprint1_letter_a', [...letMcq.slice(0, 4), ...byTopicType('ENG-LET', 'structured')], 'WASSCE English letter and report writing multiple-choice set A and structured question (batch sprint 1).'],
  ['wassce_english_sprint1_letter_b', letMcq.slice(4), 'WASSCE English letter and report writing multiple-choice set B (batch sprint 1).'],
];

for (const [slug, partQuestions, heading] of chunks) {
  const name = `${migrationNumber}_${slug}.sql`;
  await emitMigration(name, questionMigrationLines(migrationNumber, partQuestions, heading));
  migrationNumber += 1;
}

{
  const finalQuestions = [
    ...questions.filter((question) => question.topicCode === 'ENG-LIT' && question.type === 'multiple_choice'),
    ...questions.filter((question) => question.topicCode === 'ENG-LIT' && question.type === 'short_answer').slice(1),
    ...questions.filter((question) => question.topicCode === 'ENG-GRAM' && question.type === 'short_answer').slice(1),
  ];
  const name = `${migrationNumber}_wassce_english_sprint1_final_guard.sql`;
  const allIds = questions.map((question) => question.id);
  const totalParts = questions.filter((question) => question.type === 'structured').reduce((sum, question) => sum + question.parts.length, 0);
  const guardTable = `_migration_${migrationNumber}_guard`;
  const lines = [
    `-- ${migrationNumber}: Literary-devices MCQ, literary/grammar short-answer questions plus the final exact-set guard for WASSCE English sprint 1 batch 001.`,
    '-- Original BrillaPrep curriculum-aligned practice content; not official WAEC material.',
    'PRAGMA foreign_keys = ON;',
    ...questionMigrationLines(migrationNumber, finalQuestions, 'unused').slice(3),
    `CREATE TABLE IF NOT EXISTS ${guardTable} (valid INTEGER NOT NULL CHECK (valid = 1));`,
    `DELETE FROM ${guardTable};`,
    `INSERT INTO ${guardTable}(valid) SELECT CASE WHEN (SELECT COUNT(*) FROM questions q JOIN topics t ON t.id = q.topic_id JOIN question_content_releases r ON r.question_id = q.id WHERE q.id IN (${allIds.map(sql).join(', ')}) AND q.subject_id = t.subject_id AND q.subject_id = 'subj_wassce_english' AND q.exam_type_id = 'exam_wassce' AND length(q.explanation) >= 80 AND r.batch_id = '${batchId}' AND r.quality_assurance = 'automated_beta' AND r.release_channel = 'beta' AND r.official_exam_board_content = 0 AND r.feedback_enabled = 1) = ${allIds.length} AND (SELECT COUNT(*) FROM questions q WHERE q.id LIKE 'q_eng_s1_%' AND q.question_type = 'multiple_choice' AND json_valid(q.options) AND json_array_length(q.options) = 4 AND q.correct_answer IN ('A','B','C','D')) = 40 AND (SELECT COUNT(*) FROM questions q WHERE q.id LIKE 'q_eng_s1_%' AND q.question_type = 'short_answer' AND q.options IS NULL) = 5 AND (SELECT COUNT(*) FROM questions q WHERE q.id LIKE 'q_eng_s1_%' AND q.question_type = 'structured' AND q.options IS NULL) = 3 AND (SELECT COUNT(*) FROM structured_question_parts sp JOIN questions q ON q.id = sp.question_id WHERE q.id LIKE 'q_eng_s1_%') = ${totalParts} AND (SELECT COUNT(*) FROM question_content_releases WHERE batch_id = '${batchId}') = ${allIds.length} THEN 1 ELSE 0 END;`,
    `DROP TABLE ${guardTable};`,
  ];
  await emitMigration(name, lines);
  migrationNumber += 1;
}

if (migrationNumber !== 432) throw new Error(`expected migrations 422-431, generator produced up to ${migrationNumber - 1}`);

console.log(JSON.stringify({ validation, outBatch, migrations: migrationPaths }, null, 2));
