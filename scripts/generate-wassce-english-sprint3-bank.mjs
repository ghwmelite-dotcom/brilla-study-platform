import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeQuestionText, validateQuestionBatch } from './question-content-lib.mjs';

const sourceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputRootArgument = process.argv.indexOf('--output-root');
if (outputRootArgument >= 0 && !process.argv[outputRootArgument + 1]) throw new Error('--output-root requires a path');
const outputRoot = outputRootArgument >= 0 ? resolve(process.argv[outputRootArgument + 1]) : sourceRoot;
const generatedAt = '2026-09-09T14:00:00Z';
const labels = ['A', 'B', 'C', 'D'];
const batchId = 'wassce-english-sprint3-001';
const contentLabel = 'Original BrillaPrep curriculum-aligned WASSCE English Language practice questions; not official WAEC (West African Examinations Council) examination material. Use the enabled feedback channel to report corrections.';
const structuredContentLabel = 'Original BrillaPrep curriculum-aligned WASSCE English Language practice; not official WAEC (West African Examinations Council) examination material. Use the enabled feedback channel to report corrections.';
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

// Topic ids are the prod-canonical rows for subj_wassce_english (verified
// read-only against brilla-db on 2026-09-09: SELECT id, name FROM topics
// WHERE subject_id = 'subj_wassce_english' ORDER BY id). The three
// topic_wassce_p2_eng_* rows (created by migration 363) hold the biggest
// unfilled coverage cells in artifacts/sprint3/cells-english.json; the
// topic_wassce_english_* rows are the sprint-1 set plus lexis and oral.
// Migration 570 re-asserts every row with INSERT OR IGNORE, which no-ops on
// prod and on fresh baselines (prod patch 096 + migrations 363 and 422).
// Range note: the batch was first allocated 573-582, but comprehension MCQs
// embed their full passage twice (guard + insert) and 40 questions needed 9
// parts at the 19.2 KB budget; the free 570-572 slots were folded in, giving
// 570-582 (foundation + up to 11 parts + final guard).
const topics = [
  ['P2-CMP', 'topic_wassce_p2_eng_cmp', 'Comprehension',
    'Read unseen passages closely and answer literal, inferential and vocabulary-in-context questions on them.'],
  ['P2-ESS', 'topic_wassce_p2_eng_ess', 'Essay writing',
    'Plan and compose narrative, descriptive, expository and argumentative essays with correct register and organisation.'],
  ['P2-SUM', 'topic_wassce_p2_eng_sum', 'Summary writing',
    'Identify the required points in a passage and condense them into concise grammatical sentences in the candidate\'s own words.'],
  ['ENG3-SUM', 'topic_wassce_english_summary', 'Summary Writing',
    'Identify main points and condense passages into concise sentences in the candidate\'s own words.'],
  ['ENG3-ESS', 'topic_wassce_english_essay', 'Essay Writing',
    'Plan and compose narrative, descriptive, expository and argumentative essays.'],
  ['ENG3-LET', 'topic_wassce_english_letter', 'Letter and Report Writing',
    'Apply the formats and registers of formal and informal letters, speeches, articles and reports.'],
  ['ENG3-LEX', 'topic_wassce_english_lexis', 'Lexis and Structure',
    'Apply vocabulary knowledge — synonyms, antonyms and phrasal verbs — to sentence completion items.'],
  ['ENG3-GRAM', 'topic_wassce_english_grammar', 'Grammar and Usage',
    'Apply the rules of concord, tense, voice and sentence transformation.'],
  ['ENG3-ORAL', 'topic_wassce_english_oral', 'Oral English',
    'Identify syllables, word stress and intonation patterns tested in the Test of Orals.'],
  ['ENG3-LIT', 'topic_wassce_english_literary_devices', 'Literary Devices',
    'Identify and interpret figurative language such as simile, metaphor, personification and hyperbole.'],
];

// Rows re-asserted by the foundation migration with INSERT OR IGNORE using the
// exact prod id/name pairs, so the statements no-op on prod and on fresh
// baselines. Slugs are derived from the canonical id (not copied from prod) so
// a legacy seed row owning a human slug cannot collide with
// UNIQUE(subject_id, slug) on scratch baselines that lack the patches.
const canonicalTopicRows = [
  ['topic_wassce_p2_eng_cmp', 'Comprehension', 'Read an unseen passage closely and answer literal, inferential and vocabulary questions on it.', 'Comprehension questions test close reading: literal recall, inference, and the meaning of words and expressions as used in a passage.', '["Main idea vs supporting detail", "Inference = conclusion from evidence", "Vocabulary in context"]', 1],
  ['topic_wassce_p2_eng_ess', 'Essay writing', 'Compose sustained, well-organized essays in the register and format each essay type demands.', 'Essay writing covers the four main WASSCE types: narrative, descriptive, expository and argumentative, each with its own purpose and register.', '["Narrative = story", "Descriptive = senses", "Expository = explain", "Argumentative = persuade"]', 2],
  ['topic_wassce_p2_eng_sum', 'Summary writing', 'Distil a passage into concise sentences that capture the required points without distortion.', 'Summary writing requires identifying the main points of a passage and expressing them briefly in the candidate\'s own words, without lifting phrases.', '["Own words, no lifting", "One sentence where required", "Main points only"]', 3],
  ['topic_wassce_english_summary', 'Summary Writing', 'Identifying topic sentences and condensing passages into concise sentences', 'Summary answers keep only the required substance: repetitions, examples and decorative detail are trimmed, and the question\'s sentence limit is obeyed.', '["Own words, no lifting", "Obey the sentence limit", "Main points only"]', 4],
  ['topic_wassce_english_essay', 'Essay Writing', 'Narrative, descriptive, expository and argumentative essays', 'Strong essays are planned: a thesis-driven introduction, body paragraphs of one main idea each linked by transitions, and a decisive conclusion.', '["Plan before writing", "One main idea per paragraph", "Formal register: no contractions or slang"]', 5],
  ['topic_wassce_english_letter', 'Letter and Report Writing', 'Formal and informal letters, reports, articles and speeches', 'Letter and report writing tests format and register: addresses, salutations, headings, subscriptions, and the impersonal structure of official reports.', '["Formal: two addresses + heading", "Yours faithfully pairs with Dear Sir/Madam", "Reports: title, sections, facts"]', 6],
  ['topic_wassce_english_lexis', 'Lexis and Structure', 'Vocabulary, collocations, sentence structure and completion items', 'Lexis and structure items test vocabulary in context: nearest and opposite meanings, collocations and the particles of phrasal verbs.', '["Synonym = nearest in meaning", "Antonym = opposite in meaning", "Phrasal verb = verb + particle"]', 7],
  ['topic_wassce_english_grammar', 'Grammar and Usage', 'Parts of speech, concord, tenses, active and passive voice', 'Grammar and usage covers concord, tense sequence, voice, and the correction and transformation of sentences.', '["Singular subject takes singular verb", "Past perfect for the earlier of two past actions", "Passive: object becomes subject"]', 8],
  ['topic_wassce_english_oral', 'Oral English', 'Vowels, consonants, stress, rhythm and intonation (Test of Orals)', 'Oral English tests the sound system: counting syllables, placing word stress, and reading meaning from rising and falling intonation.', '["Syllable = one vowel sound", "Two-syllable verbs often stress the second syllable", "Rising intonation signals a yes-no question"]', 9],
  ['topic_wassce_english_literary_devices', 'Literary Devices', 'Metaphor, simile, personification, hyperbole, alliteration and irony', 'Literary devices are figures of speech and sound patterns writers use for effect; candidates must identify and interpret them in context.', '["Simile uses like/as", "Metaphor states identity", "Personification gives human qualities", "Onomatopoeia imitates sound"]', 10],
];

const topicId = (code) => topics.find(([topicCode]) => topicCode === code)[1];
for (const [code, id, title] of topics) {
  const row = canonicalTopicRows.find(([topicRowId]) => topicRowId === id);
  if (!row) throw new Error(`${code}: topic id ${id} is not a prod-verified canonical WASSCE English topic`);
  if (row[1] !== title) throw new Error(`${code}: topic id ${id} is named "${row[1]}" on prod, not "${title}"`);
}

const mcq = (topicCode, difficulty, prompt, correct, wrong, solution, commandWord = 'Choose', assessmentObjective = 'AO2', timeLimit = 45) =>
  ({ topicCode, type: 'multiple_choice', difficulty, prompt, correct, wrong, solution, commandWord, assessmentObjective, timeLimit });
const sa = (topicCode, difficulty, prompt, answer, solution, commandWord = 'State', assessmentObjective = 'AO2') =>
  ({ topicCode, type: 'short_answer', difficulty, prompt, answer, solution, commandWord, assessmentObjective });
const stq = (topicCode, prompt, parts, guide, commandWord = 'Answer') =>
  ({ topicCode, type: 'structured', prompt, parts, guide, commandWord });

// --- Question content ---------------------------------------------------------
// Sprint 3 targets the unfilled Paper 2 gap topics (essay, comprehension,
// summary) with easy/medium/hard MCQs, plus single completion items for the
// sprint-1 topics' remaining cells. Passages C and D are new; nothing here
// reuses the sprint-1 passages or items.
const passageC = 'When the pipe-borne water failed in Nkwanta, the women rose before dawn to queue at the only borehole. Efua carried two jerrycans on her head and her baby on her back. Then the assemblyman had a second borehole drilled, and the queues grew shorter. "Water is life," Efua said, "but so is the time we lose fetching it."';
const passageD = 'Zebilla Senior High reached the regional debating finals. Coach Adongo insisted that facts must be clothed in courtesy. On the day, their opponents spoke louder, but Zebilla spoke better: every claim was supported, every rebuttal polite. The verdict was unanimous, and the trophy rode home on the captain\'s knees like a baby.';

const questions = [
  // --- Comprehension (topic_wassce_p2_eng_cmp): 4 easy, 4 medium, 2 hard MCQ
  mcq('P2-CMP', 'easy', `Read the passage, then answer. — "${passageC}" Why did the women of Nkwanta rise before dawn?`,
    'to queue at the only borehole', ['to sell wares at the market', 'to attend assembly at the school', 'to fetch firewood for cooking'],
    'The first sentence says the women "rose before dawn to queue at the only borehole" when the pipe-borne water failed; the market, an assembly and firewood are never mentioned.',
    'Identify', 'AO1', 60),
  mcq('P2-CMP', 'easy', `Read the passage, then answer. — "${passageC}" What did Efua carry on her head?`,
    'two jerrycans', ['her baby', 'a basket of wares', 'a bundle of firewood'],
    'Efua carried "two jerrycans on her head and her baby on her back", so the baby was on her back, not her head; no basket or firewood is mentioned.',
    'Identify', 'AO1', 60),
  mcq('P2-CMP', 'easy', `Read the passage, then answer. — "${passageC}" Who had the second borehole drilled?`,
    'the assemblyman', ['Efua', 'the headmistress', 'the women of the town'],
    'The passage states that "the assemblyman had a second borehole drilled"; Efua, a headmistress and the women themselves are not credited with it.',
    'Identify', 'AO1', 60),
  mcq('P2-CMP', 'easy', `Read the passage, then answer. — "${passageC}" The queues grew shorter because`,
    'a second borehole was drilled', ['the pipe-borne water was restored', 'the women stopped fetching water', 'the rains came'],
    'The shorter queues follow the new borehole directly: it was drilled "and the queues grew shorter"; no restoration, boycott or rain is mentioned.',
    'Identify', 'AO1', 60),
  mcq('P2-CMP', 'medium', `Read the passage, then answer. — "${passageC}" When Efua says "but so is the time we lose fetching it", she means that`,
    'the hours spent fetching water are as precious as water itself', ['fetching water is a pleasant pastime', 'water is far more valuable than time', 'time passes quickly at the borehole'],
    'The parallel "so is" gives the lost time the same worth as water: both are "life". Efua does not call fetching pleasant or time cheap.',
    'Interpret', 'AO2', 60),
  mcq('P2-CMP', 'medium', `Read the passage, then answer. — "${passageC}" The passage suggests the water shortage burdened mainly`,
    'the women, who did the fetching', ['the schoolchildren', 'the assemblyman', 'the lorry drivers'],
    'It is the women who rise before dawn to queue, and Efua fetches while carrying her baby; schoolchildren, the assemblyman and drivers are not shown bearing the load.',
    'Infer', 'AO2', 60),
  mcq('P2-CMP', 'medium', `Read the passage, then answer. — "${passageD}" Coach Adongo's rule that "facts must be clothed in courtesy" means that`,
    'arguments should be sound and expressed politely', ['debaters must dress well for contests', 'politeness can replace facts', 'facts should be hidden from opponents'],
    'To clothe facts in courtesy is to dress sound arguments in polite language, as the team did. Dress, substitution and concealment miss the figurative sense.',
    'Interpret', 'AO2', 60),
  mcq('P2-CMP', 'medium', `Read the passage, then answer. — "${passageD}" Zebilla won the finals mainly because`,
    'their claims were supported and their rebuttals polite', ['their opponents failed to turn up', 'they spoke louder than their opponents', 'the judges came from Zebilla'],
    'Their opponents "spoke louder, but Zebilla spoke better", and the verdict was unanimous; no absence, greater volume or local judges is mentioned.',
    'Identify', 'AO2', 60),
  mcq('P2-CMP', 'hard', `Read the passage, then answer. — "${passageD}" The trophy "rode home on the captain's knees like a baby". This simile suggests the trophy was`,
    'handled with great care and pride', ['too heavy for one person to lift', 'damaged on the journey home', 'of little value to the team'],
    'Holding the trophy "like a baby" conveys tenderness and pride: the team treasured it. Nothing suggests it was too heavy, damaged or unvalued.',
    'Interpret', 'AO3', 60),
  mcq('P2-CMP', 'hard', `Read the passage, then answer. — "${passageD}" The statement "their opponents spoke louder, but Zebilla spoke better" implies that in debating`,
    'the quality of argument matters more than volume', ['the loudest team always wins', 'judges prefer quiet contestants', 'opponents should not be heard'],
    'The contrast sets loudness against merit: Zebilla\'s supported claims and polite rebuttals — quality, not volume — carried the day, as the unanimous verdict confirms.',
    'Infer', 'AO3', 60),

  // --- Essay writing (topic_wassce_p2_eng_ess): 4 easy, 4 medium, 2 hard MCQ
  mcq('P2-ESS', 'easy', 'An essay written to explain a process or give information is called',
    'an expository essay', ['a narrative essay', 'an argumentative essay', 'a descriptive essay'],
    'Expository essays explain or inform; narrative essays tell a story, argumentative essays persuade and descriptive essays paint word pictures.',
    'Identify', 'AO1'),
  mcq('P2-ESS', 'easy', 'The concluding paragraph of an essay is expected to',
    'draw the discussion to a satisfying close', ['introduce a completely new argument', 'list the writer\'s sources', 'repeat the essay title word for word'],
    'The conclusion pulls the discussion together and ends decisively; new arguments belong in the body, source lists in reports, and repeating the title adds nothing.',
    'Identify', 'AO1'),
  mcq('P2-ESS', 'easy', 'Which of the following topics calls for a narrative essay?',
    'Write a story that ends with the words: "I shall never lend money again."',
    ['Explain how cassava is processed into gari.', 'Should students use mobile phones in school?', 'Describe your favourite teacher.'],
    'The instruction "write a story" marks a narrative topic; the gari topic is expository, the phone question argumentative and the teacher topic descriptive.',
    'Classify', 'AO2'),
  mcq('P2-ESS', 'easy', 'The body of an essay is the part in which',
    'the main points are developed in paragraphs', ['the writer\'s address is written', 'the title is repeated', 'the subscription is added'],
    'The body carries the substance: each main point is developed in its own paragraph. Addresses and subscriptions belong to letters, and the title appears once at the top.',
    'Identify', 'AO1'),
  mcq('P2-ESS', 'medium', 'Before writing an essay in the examination hall, a good candidate first',
    'plans the main points and their order', ['copies a memorised essay onto the answer sheet', 'counts the words in the question', 'decorates the answer booklet'],
    'Brief planning — jotting and ordering the main points — keeps the essay relevant and organised; reproducing a memorised essay risks irrelevance, and counting or decorating earns nothing.',
    'Explain', 'AO2'),
  mcq('P2-ESS', 'medium', 'In a formal essay, contractions such as "don\'t" and "can\'t" should be',
    'avoided in favour of the full forms "do not" and "cannot"', ['used as often as possible', 'underlined for emphasis', 'replaced with slang expressions'],
    'Formal essays need a formal register: full forms replace contractions and slang is out of place; contractions signal a chatty tone examiners penalise in formal writing.',
    'Explain', 'AO2'),
  mcq('P2-ESS', 'medium', 'Linking expressions such as "furthermore", "however" and "consequently" are used in an essay to',
    'connect ideas and guide the reader from one point to the next', ['make the sentences longer than necessary', 'replace full stops throughout the essay', 'display difficult vocabulary'],
    'Transitions signal addition, contrast or result, so the reader follows the argument smoothly; they are signposts of coherence, not padding, punctuation substitutes or ornament.',
    'Explain', 'AO2'),
  mcq('P2-ESS', 'medium', 'A candidate is arguing against the motion "Homework should be abolished". Which sentence would best open a body paragraph of the essay?',
    'Homework burdens students who already spend long hours in the classroom.',
    ['Homework is a common English word.', 'Let me tell you about my school.', 'In conclusion, homework should be abolished.'],
    'A body paragraph opens with a clear point supporting the writer\'s side; the correct option states one argument, while the others are empty, irrelevant or a misplaced conclusion.',
    'Evaluate', 'AO2'),
  mcq('P2-ESS', 'hard', 'A candidate writing on "The benefits of volunteering" devotes a whole paragraph to her favourite food. The paragraph chiefly violates the principle of',
    'relevance', ['punctuation', 'legibility', 'pagination'],
    'Every paragraph must serve the topic; a paragraph on food adds nothing to an essay on volunteering, so it fails relevance however correct its punctuation or handwriting may be.',
    'Evaluate', 'AO3'),
  mcq('P2-ESS', 'hard', 'Which approach best demonstrates balance in an argumentative essay?',
    'The writer presents three points for the motion, concedes one opposing point and answers it.',
    ['The writer lists ten points without explaining any of them.', 'The writer ridicules the character of the opposing side.', 'The writer copies the question as the conclusion.'],
    'Balance means engaging the other side: concede the strongest opposing point and rebut it while developing your own case; listing, ridicule and copying the question are faults.',
    'Evaluate', 'AO3'),

  // --- Summary writing (topic_wassce_p2_eng_sum): 4 easy, 4 medium, 2 hard MCQ
  mcq('P2-SUM', 'easy', 'The first step in answering a summary question is to',
    'read the passage carefully to understand it', ['count the words in the passage', 'copy out the first sentence of the passage', 'underline every adjective in the passage'],
    'Understanding comes first: read the passage closely before identifying the required points; counting words, copying the opening and random underlining build no understanding.',
    'Identify', 'AO1'),
  mcq('P2-SUM', 'easy', 'In summary writing, the instruction to use "your own words" means the candidate should',
    'express the writer\'s ideas in different vocabulary', ['change the writer\'s meaning completely', 'answer in a Ghanaian language', 'give a personal opinion on the topic'],
    '"Your own words" means re-expressing the writer\'s points in fresh vocabulary — not altering the meaning, switching languages or importing opinions the passage does not contain.',
    'Identify', 'AO1'),
  mcq('P2-SUM', 'easy', 'A summary answer should normally leave out',
    'figures of speech and decorative detail', ['the main points required by the question', 'grammatical sentence structure', 'capital letters at the start of sentences'],
    'Summaries keep only the required substance; imagery, examples and decorative detail are trimmed, while the main points, sound grammar and capitalisation remain required.',
    'Identify', 'AO1'),
  mcq('P2-SUM', 'easy', 'When the two points required by a summary question come from different paragraphs of the passage, the candidate should',
    'find and combine both points as the question demands', ['answer only the point in the first paragraph', 'skip the question entirely', 'copy both paragraphs in full'],
    'The question, not the paragraph layout, controls the answer: both points must be located wherever they occur and combined; partial answers and copying lose marks.',
    'Identify', 'AO1'),
  mcq('P2-SUM', 'medium', 'Choose the best summary of the following. — "The headmaster closed the school at noon. A leaking gas cylinder had been discovered near the kitchen, and the fire service advised an immediate evacuation."',
    'The school was closed at noon because a leaking gas cylinder made evacuation necessary.',
    ['The fire service closed the school because the kitchen caught fire.', 'The headmaster discovered the gas cylinder after closing the school.', 'The school was evacuated because the fire service leaked gas.'],
    'A correct summary keeps the cause chain: the leaking cylinder led to the closure and the advised evacuation; each wrong option reverses the sequence, invents a fire or blames the fire service.',
    'Summarize', 'AO2'),
  mcq('P2-SUM', 'medium', 'Which of the following is an acceptable shortened form of "the boy who was wearing a red shirt"?',
    'the boy in the red shirt', ['the boy who was wearing a red shirt', 'the boy of red shirt', 'a red shirt of the boy'],
    'Reducing the relative clause "who was wearing" to the phrase "in" keeps the meaning in fewer words — the essence of compression; the other options change nothing or break the grammar.',
    'Summarize', 'AO2'),
  mcq('P2-SUM', 'medium', 'A candidate who copies sentences from the passage word for word into a summary answer is guilty of',
    'lifting', ['paraphrasing', 'editing', 'proofreading'],
    'Lifting — copying the passage verbatim — is penalised because it shows no power of expression; paraphrasing, editing and proofreading rework the text instead of copying it.',
    'Identify', 'AO2'),
  mcq('P2-SUM', 'medium', 'Choose the best summary of the following. — "Although the harvest was good, the farmers earned little, for the middlemen who bought the produce paid very low prices."',
    'Despite a good harvest, the farmers earned little because middlemen paid low prices.',
    ['The middlemen had a good harvest and paid the farmers well.', 'The farmers earned little because the harvest failed.', 'The middlemen earned little although the farmers harvested well.'],
    'The correct option keeps all three ideas — good harvest, low earnings, low prices from the middlemen — in their proper relationships; the others swap the actors or reverse the facts.',
    'Summarize', 'AO2'),
  mcq('P2-SUM', 'hard', 'A summary question asks for "one cause of the strike" from a passage that mentions low pay, poor ventilation and long hours. A candidate writes: "The workers were unhappy about many things." The answer is weak mainly because it',
    'names no specific cause from the passage', ['is too short to earn marks', 'contains a grammatical error', 'uses the candidate\'s own words'],
    'The question demands one identified cause; gesturing at "many things" names neither low pay, poor ventilation nor long hours, so it earns nothing despite being brief and grammatical.',
    'Evaluate', 'AO3'),
  mcq('P2-SUM', 'hard', 'Which single sentence best combines the points "The bridge collapsed" and "The floods had weakened its pillars"?',
    'The bridge collapsed because the floods had weakened its pillars.',
    ['The bridge collapsed and the floods.', 'The floods weakened the pillars after the bridge collapsed.', 'The bridge, the floods and the pillars.'],
    'The correct option links the points causally and keeps the tense order — the weakening came before the collapse; the others are fragments or reverse the sequence of events.',
    'Summarize', 'AO3'),

  // --- Summary Writing (topic_wassce_english_summary): completes the medium
  // MCQ cell (have 3/target 4), the short_answer cell (have 1/target 2) and the
  // structured cell (have 0/target 1).
  mcq('ENG3-SUM', 'medium', 'In a summary question, candidates commonly lose marks by',
    'writing more sentences than the question demands', ['beginning each sentence with a capital letter', 'using complete grammatical sentences', 'reading the passage more than once'],
    'When the question specifies one sentence, extra sentences breach the instruction and are penalised; capitals, complete sentences and careful re-reading are virtues, not faults.',
    'Identify', 'AO2'),
  sa('ENG3-SUM', 'medium', 'Combine the following into one summary sentence without losing the essential meaning: "The bridge was old. Heavy lorries crossed it daily. It finally collapsed in August."',
    'Because the old bridge carried heavy lorries daily, it finally collapsed in August.',
    'The three statements form a cause chain: age plus daily heavy loads led to the August collapse; link all three facts with "because" (or a similar connector) and add nothing.',
    'Summarize'),

  // --- Essay Writing (topic_wassce_english_essay): completes the medium MCQ
  // cell (have 3/target 4).
  mcq('ENG3-ESS', 'medium', 'Which of the following is the best topic sentence for a paragraph on the causes of road accidents in an expository essay?',
    'One major cause of road accidents is over-speeding by drivers.',
    ['Road accidents are terrible events.', 'I once saw an accident near our house.', 'In conclusion, road accidents must stop.'],
    'A topic sentence states the paragraph\'s single controlling idea; the correct option names one cause to develop, while the others are vague, anecdotal or a misplaced conclusion.',
    'Evaluate', 'AO2'),

  // --- Letter and Report Writing (topic_wassce_english_letter): completes the
  // medium MCQ cell (have 3/target 4).
  mcq('ENG3-LET', 'medium', 'In an informal letter to a friend, the date is normally written',
    'at the top of the letter, immediately after the writer\'s address', ['at the very bottom of the letter', 'after the subscription', 'in the middle of the first paragraph'],
    'The conventional informal layout puts the writer\'s address at the top right with the date beneath it; the bottom, after the subscription and mid-paragraph belong to no accepted format.',
    'Identify', 'AO2'),

  // --- Structured cells (have 0/target 1): one structured question each for
  // Paper 2 essay writing, summary, lexis, grammar, oral and literary devices.
  stq('P2-ESS', 'Your school is preparing a debate on the motion: "Boarding school is better than day school for senior high students." Answer the following planning questions.', [
    { label: 'a', text: 'State the two sides a speaker may take on this motion, and write out the vocative opening of a debate speech.', marks: 4, correctAnswer: 'A speaker may speak for or against the motion; the speech opens with a vocative address such as "Mr Chairman, Panel of Judges, fellow students".' },
    { label: 'b', text: 'Write one sentence a speaker for the motion could use to state a first argument.', marks: 6, correctAnswer: 'Boarding school gives students supervised prep time and freedom from long daily journeys, so they can focus fully on their studies.' },
  ], '(a) A motion has exactly two sides — for and against — and debate speeches open with the vocative address; (b) one clear sentence giving one reason for boarding school, with its result attached.', 'Plan'),
  stq('ENG3-SUM', 'Read the passage, then answer both questions. — "Mobile money has changed market trading in Tamale. Traders no longer carry large sums of cash, and buyers can settle even small debts instantly. Yet network failures sometimes strand traders who cannot reach their money, and fraudsters trick the careless into revealing their secret codes."', [
    { label: 'a', text: 'State two benefits of mobile money mentioned in the passage.', marks: 4, correctAnswer: 'Traders no longer carry large sums of cash, and buyers can settle even small debts instantly.' },
    { label: 'b', text: 'State two dangers of mobile money mentioned in the passage.', marks: 6, correctAnswer: 'Network failures sometimes strand traders who cannot reach their money, and fraudsters trick the careless into revealing their secret codes.' },
  ], 'Both answers come straight from the passage: (a) the two conveniences and (b) the two risks, stated briefly without adding ideas of your own.', 'Read'),
  stq('ENG3-LEX', 'Answer both questions on vocabulary and usage.', [
    { label: 'a', text: 'Give the word nearest in meaning to "purchase" as used in: "Auntie went to the market to purchase a new cloth."', marks: 3, correctAnswer: 'buy' },
    { label: 'b', text: 'Complete with the correct particle: "The students were advised to look ___ every new word in a dictionary."', marks: 3, correctAnswer: 'up' },
  ], '(a) "purchase" means buy in this everyday context; (b) the phrasal verb "look up" means to search for information in a reference work, so the missing particle is "up".'),
  stq('ENG3-GRAM', 'Answer both questions on grammar and usage.', [
    { label: 'a', text: 'Correct the concord error in this sentence: "Each of the girls have a locker."', marks: 3, correctAnswer: 'Each of the girls has a locker.' },
    { label: 'b', text: 'Rewrite the following sentence in the passive voice: "The prefect rang the bell."', marks: 3, correctAnswer: 'The bell was rung by the prefect.' },
  ], '(a) "each" is singular and takes "has"; "of the girls" only modifies the subject. (b) The object "the bell" becomes the subject of the passive, with "was rung" and the agent introduced by "by".'),
  stq('ENG3-ORAL', 'Answer both questions on oral English.', [
    { label: 'a', text: 'State the number of syllables in the word "committee".', marks: 2, correctAnswer: 'Three syllables (com-mit-tee).' },
    { label: 'b', text: 'A speaker says "You are coming?" with a rising tone. State what the rising intonation shows.', marks: 4, correctAnswer: 'It turns the statement into a yes-no question, showing the speaker is asking for confirmation.' },
  ], '(a) "committee" divides into three syllables: com-mit-tee. (b) Rising intonation on a statement form signals a question expecting a yes or no answer, not a statement of fact.'),
  stq('ENG3-LIT', 'Name the literary device used in each of the following sentences.', [
    { label: 'a', text: '"Opportunity knocked on Kofi\'s door at last."', marks: 3, correctAnswer: 'Personification' },
    { label: 'b', text: '"After the verdict, he drowned in a sea of troubles."', marks: 3, correctAnswer: 'Metaphor' },
  ], '(a) Opportunity is given the human action of knocking — personification. (b) Troubles are called a "sea" without "like" or "as" — a metaphor, not a simile.', 'Name'),
];

// --- Batch assembly -----------------------------------------------------------
const subjectSources = [
  naccaSource('Secondary Education Curriculum — English Language'),
  waecSource('WASSCE English Language syllabus blueprint'),
];

const structuredAnswer = (parts) => parts.map((part) => `(${part.label}) ${part.correctAnswer}`).join(' ');

function buildQuestion(source, sequence, mcqPosition) {
  const id = `q_eng_s3_${String(sequence).padStart(3, '0')}`;
  const base = {
    id,
    original: true,
    topicCode: source.topicCode,
    type: source.type,
    prompt: source.prompt,
    difficulty: source.type === 'structured' ? 'medium' : source.difficulty,
    commandWord: source.commandWord,
    assessmentObjective: source.assessmentObjective ?? 'AO2',
    provenance: subjectSources,
  };
  if (source.type === 'multiple_choice') {
    const correctIndex = mcqPosition % 4;
    const rawOptions = [...source.wrong];
    rawOptions.splice(correctIndex, 0, source.correct);
    return {
      ...base,
      options: rawOptions.map((text, optionIndex) => ({
        label: labels[optionIndex],
        text,
        rationale: optionIndex === correctIndex
          ? `This is the supported answer. ${source.solution}`
          : 'This is a plausible distractor, but the worked solution shows it does not state what the passage says or what the rule requires.',
      })),
      correctAnswer: labels[correctIndex],
      workedSolution: `${source.solution} Therefore the correct answer is ${labels[correctIndex]}: ${source.correct}.`,
      marks: 1,
      points: 3,
      timeLimit: source.timeLimit,
    };
  }
  if (source.type === 'short_answer') {
    return {
      ...base,
      correctAnswer: source.answer,
      workedSolution: source.solution,
      marks: 2,
      points: 4,
      timeLimit: 90,
    };
  }
  const marks = source.parts.reduce((sum, part) => sum + part.marks, 0);
  return {
    ...base,
    correctAnswer: structuredAnswer(source.parts),
    workedSolution: source.guide,
    marks,
    points: marks,
    timeLimit: 300,
    contentLabel: structuredContentLabel,
    markingScheme: null,
    parts: source.parts,
  };
}

const builtQuestions = [];
{
  let mcqPosition = 0;
  questions.forEach((source, index) => {
    builtQuestions.push(buildQuestion(source, index + 1, mcqPosition));
    if (source.type === 'multiple_choice') mcqPosition += 1;
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
    specificationCode: 'BRILLA-WASSCE-ENG-SPRINT3-001',
    sources: subjectSources,
    topics: topics.map(([code, , title, objective]) => ({ code, title, objective })),
    questions: builtQuestions,
  }],
};

// --- Validation ---------------------------------------------------------------
const officialAttributionPattern = /\b(?:official\s+(?:waec|west african examinations council)|(?:waec|west african examinations council)[ -](?:approved|endorsed|authored|issued|certified))\b/i;
const nonOfficialDisclaimerPattern = /\b(?:not|non[- ]?)\s+official\s+(?:waec|west african examinations council)\b/i;
const nonOfficialDisclaimerGlobalPattern = /\b(?:not|non[- ]?)\s+official\s+(?:waec|west african examinations council)\b/gi;

function assertNoFalseOfficialClaim(value, field, errors) {
  const withoutDisclaimer = String(value ?? '').replace(nonOfficialDisclaimerGlobalPattern, '');
  if (officialAttributionPattern.test(withoutDisclaimer)) errors.push(`${field} contains a false official-exam-board claim`);
}

const validation = validateQuestionBatch(batch, { mode: 'production' });

// Coverage mirrors artifacts/sprint3/cells-english.json: the three Paper 2 gap
// topics receive 4 easy + 4 medium + 2 hard MCQs each; the sprint-1 topics
// receive their remaining single-cell completions.
const expectedCells = {
  'P2-CMP': { easyMcq: 4, mediumMcq: 4, hardMcq: 2, sa: 0, st: 0 },
  'P2-ESS': { easyMcq: 4, mediumMcq: 4, hardMcq: 2, sa: 0, st: 1 },
  'P2-SUM': { easyMcq: 4, mediumMcq: 4, hardMcq: 2, sa: 0, st: 0 },
  'ENG3-SUM': { easyMcq: 0, mediumMcq: 1, hardMcq: 0, sa: 1, st: 1 },
  'ENG3-ESS': { easyMcq: 0, mediumMcq: 1, hardMcq: 0, sa: 0, st: 0 },
  'ENG3-LET': { easyMcq: 0, mediumMcq: 1, hardMcq: 0, sa: 0, st: 0 },
  'ENG3-LEX': { easyMcq: 0, mediumMcq: 0, hardMcq: 0, sa: 0, st: 1 },
  'ENG3-GRAM': { easyMcq: 0, mediumMcq: 0, hardMcq: 0, sa: 0, st: 1 },
  'ENG3-ORAL': { easyMcq: 0, mediumMcq: 0, hardMcq: 0, sa: 0, st: 1 },
  'ENG3-LIT': { easyMcq: 0, mediumMcq: 0, hardMcq: 0, sa: 0, st: 1 },
};

function inHouseValidation(errors) {
  if (batch.review.automatedChecksAt !== generatedAt) errors.push('review.automatedChecksAt mismatch');
  if (batch.release.channel !== 'beta') errors.push('release.channel must be beta');
  if (typeof batch.release.contentLabel !== 'string' || batch.release.contentLabel.trim().length < 40) errors.push('release.contentLabel too short');
  if (!nonOfficialDisclaimerPattern.test(batch.release.contentLabel)) errors.push('release.contentLabel must explicitly state the content is not official WAEC material');
  if (batch.release.officialExamBoardContent !== false) errors.push('release.officialExamBoardContent must be false');
  if (batch.release.feedbackEnabled !== true) errors.push('release.feedbackEnabled must be true');
  assertNoFalseOfficialClaim(batch.release.contentLabel, 'release.contentLabel', errors);

  const letterCounts = { A: 0, B: 0, C: 0, D: 0 };
  const perTopic = new Map(topics.map(([code]) => [code, { easyMcq: 0, mediumMcq: 0, hardMcq: 0, sa: 0, st: 0 }]));
  for (const subject of batch.subjects) {
    for (const question of subject.questions) {
      const cell = perTopic.get(question.topicCode);
      if (!cell) { errors.push(`${question.id}: unknown topicCode ${question.topicCode}`); continue; }
      if (question.type === 'multiple_choice') {
        if (question.difficulty === 'easy') cell.easyMcq += 1;
        else if (question.difficulty === 'medium') cell.mediumMcq += 1;
        else if (question.difficulty === 'hard') cell.hardMcq += 1;
        if (question.marks !== 1) errors.push(`${question.id}: MCQ marks must be 1`);
        if (question.points !== 3) errors.push(`${question.id}: MCQ points must be 3`);
        if (![45, 60].includes(question.timeLimit)) errors.push(`${question.id}: MCQ timeLimit must be 45 or 60`);
        letterCounts[question.correctAnswer] += 1;
        for (const option of question.options ?? []) assertNoFalseOfficialClaim(option.text, `${question.id}.options`, errors);
      } else if (question.type === 'short_answer') {
        cell.sa += 1;
        if (question.marks !== 2 || question.points !== 4 || question.timeLimit !== 90) errors.push(`${question.id}: short-answer scoring fields wrong`);
        if (question.options != null) errors.push(`${question.id}: short-answer must not have options`);
      } else if (question.type === 'structured') {
        cell.st += 1;
        if (question.options != null) errors.push(`${question.id}: structured must not have options`);
        if (!Array.isArray(question.parts) || question.parts.length < 2) errors.push(`${question.id}: structured needs at least two parts`);
        if (question.parts?.reduce((sum, part) => sum + part.marks, 0) !== question.marks) errors.push(`${question.id}: part marks must sum to marks`);
        if (question.points !== question.marks) errors.push(`${question.id}: structured points must equal marks`);
        if (question.timeLimit !== 300) errors.push(`${question.id}: structured timeLimit must be 300`);
        if (!nonOfficialDisclaimerPattern.test(question.contentLabel ?? '')) errors.push(`${question.id}: structured contentLabel must disclaim official status`);
      } else {
        errors.push(`${question.id}: unexpected type ${question.type}`);
      }
      if (!Array.isArray(question.provenance) || question.provenance[0]?.use !== 'curriculum_blueprint_only') errors.push(`${question.id}: per-item provenance missing`);
      assertNoFalseOfficialClaim(question.prompt, `${question.id}.prompt`, errors);
      assertNoFalseOfficialClaim(question.workedSolution, `${question.id}.workedSolution`, errors);
    }
  }
  for (const [code, expected] of Object.entries(expectedCells)) {
    const actual = perTopic.get(code);
    if (!actual) { errors.push(`${code}: no questions found`); continue; }
    if (actual.easyMcq !== expected.easyMcq || actual.mediumMcq !== expected.mediumMcq
      || actual.hardMcq !== expected.hardMcq || actual.sa !== expected.sa || actual.st !== expected.st) {
      errors.push(`${code}: expected ${JSON.stringify(expected)}, found ${JSON.stringify(actual)}`);
    }
  }
  const expectedLetters = { A: 9, B: 8, C: 8, D: 8 };
  for (const label of labels) {
    if (letterCounts[label] !== expectedLetters[label]) errors.push(`correct answer letter ${label} should appear ${expectedLetters[label]} times, found ${letterCounts[label]}`);
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
const duplicatePrompts = batch.subjects.flatMap((subject) => subject.questions)
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
  return {
    topic_id: topicId(question.topicCode),
    subject_id: 'subj_wassce_english',
    exam_type_id: 'exam_wassce',
    paper_type_id: null,
    past_paper_id: null,
    question_text: question.prompt,
    question_type: question.type,
    round_type: null,
    options: question.options
      ? JSON.stringify(question.options.map(({ label, text }) => `${label}. ${text}`))
      : null,
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

// Per-question SQL lines are split into a guard half and an insert half so the
// part packer can measure each question's byte contribution on its own.
function questionGuardLines(guardTable, question) {
  const values = questionValues(question);
  const lines = [`INSERT INTO ${guardTable}(valid) SELECT CASE WHEN NOT EXISTS (SELECT 1 FROM questions q WHERE q.id = ${sql(question.id)} AND NOT (${canonicalMatch('q', values)})) AND NOT EXISTS (SELECT 1 FROM question_content_releases r WHERE r.question_id = ${sql(question.id)} AND NOT (${releaseMatch('r')})) THEN 1 ELSE 0 END;`];
  if (question.type === 'structured') {
    for (const [index, part] of question.parts.entries()) {
      const values = partValues(question, part, index);
      lines.push(`INSERT INTO ${guardTable}(valid) SELECT CASE WHEN NOT EXISTS (SELECT 1 FROM structured_question_parts sp WHERE sp.id = ${sql(values.id)} AND NOT (${partMatch('sp', values)})) THEN 1 ELSE 0 END;`);
    }
  }
  return lines;
}

function questionInsertLines(question) {
  const values = questionValues(question);
  const lines = [`INSERT OR IGNORE INTO questions (id, ${canonicalQuestionFields.join(', ')}) VALUES (${sql(question.id)}, ${canonicalQuestionFields.map((field) => sql(values[field])).join(', ')});`];
  if (question.type === 'structured') {
    for (const [index, part] of question.parts.entries()) {
      const values = partValues(question, part, index);
      lines.push(`INSERT OR IGNORE INTO structured_question_parts (id, question_id, part_label, part_text, marks, correct_answer, explanation, answer_type, display_order) VALUES (${sql(values.id)}, ${sql(values.question_id)}, ${sql(values.part_label)}, ${sql(values.part_text)}, ${values.marks}, ${sql(values.correct_answer)}, NULL, 'text', ${index});`);
    }
  }
  return lines;
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
    ...partQuestions.flatMap((question) => questionGuardLines(guardTable, question)),
    ...partQuestions.flatMap((question) => questionInsertLines(question)),
    `INSERT OR IGNORE INTO question_content_releases (question_id, batch_id, quality_assurance, release_channel, content_label, source_url, official_exam_board_content, feedback_enabled) SELECT id, '${batchId}', 'automated_beta', 'beta', ${sql(contentLabel)}, ${sql(releaseSourceUrl)}, 0, 1 FROM questions WHERE id IN (${ids.map(sql).join(', ')});`,
    `DELETE FROM ${guardTable};`,
    `INSERT INTO ${guardTable}(valid) SELECT CASE WHEN (SELECT COUNT(*) FROM questions WHERE id IN (${ids.map(sql).join(', ')})) = ${ids.length} AND (SELECT COUNT(*) FROM question_content_releases r WHERE r.question_id IN (${ids.map(sql).join(', ')}) AND ${releaseMatch('r')}) = ${ids.length} THEN 1 ELSE 0 END;`,
    `DROP TABLE ${guardTable};`,
  ];
  return lines;
}

// Exact CRLF byte size of a migration file built from the given questions,
// including the d1_migrations ledger line wrangler appends.
function migrationBytes(migrationNumber, partQuestions) {
  const heading = 'Original BrillaPrep WASSCE English Language sprint 3 beta questions, part 8 of 8 (batch wassce-english-sprint3-001).';
  const lines = questionMigrationLines(migrationNumber, partQuestions, heading);
  const crlf = `${lines.join('\n')}\n`.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
  const ledger = `\r\nINSERT INTO "d1_migrations" (name) values ('588_wassce_english_sprint3_part_8.sql');`;
  return Buffer.byteLength(crlf + ledger, 'utf8');
}

let migrationNumber = 570;
{
  const name = `${migrationNumber}_wassce_english_sprint3_foundation.sql`;
  const allTopicIds = topics.map(([, id]) => id);
  const lines = [
    `-- ${migrationNumber}: Foundation guard for WASSCE English Language sprint 3 beta batch (wassce-english-sprint3-001).`,
    '-- Original BrillaPrep practice content; not official WAEC examination material.',
    '-- Re-asserts the prod-canonical topic rows for subj_wassce_english on scratch',
    '-- baselines; INSERT OR IGNORE no-ops on prod and on fresh baselines where the',
    '-- rows already exist (prod patch 096 and migrations 363 and 422).',
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
    ...canonicalTopicRows.map(([id, topicName, description, theoryContent, keyFormulas, displayOrder]) =>
      // Slug derived from the canonical id so legacy seed/patch rows keep their
      // human slugs; topics is UNIQUE(subject_id, slug). On prod and on fresh
      // baselines the ids already exist and these INSERT OR IGNORE statements no-op.
      `INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES (${sql(id)}, 'subj_wassce_english', NULL, ${sql(topicName)}, ${sql(id.slice(6).replaceAll('_', '-'))}, ${sql(description)}, ${sql(theoryContent)}, ${sql(keyFormulas)}, ${displayOrder}, '2026-08-04T00:00:00.000Z');`),
    `CREATE TABLE IF NOT EXISTS _migration_${migrationNumber}_guard (valid INTEGER NOT NULL CHECK (valid = 1));`,
    `DELETE FROM _migration_${migrationNumber}_guard;`,
    `INSERT INTO _migration_${migrationNumber}_guard(valid) SELECT CASE WHEN EXISTS (SELECT 1 FROM exam_types WHERE id = 'exam_wassce') AND EXISTS (SELECT 1 FROM subjects WHERE id = 'subj_wassce_english' AND exam_type_id = 'exam_wassce') AND (SELECT COUNT(*) FROM topics t JOIN subjects s ON s.id = t.subject_id WHERE t.id IN (${allTopicIds.map(sql).join(', ')}) AND t.subject_id = 'subj_wassce_english' AND s.exam_type_id = 'exam_wassce') = ${allTopicIds.length} THEN 1 ELSE 0 END;`,
    `DROP TABLE _migration_${migrationNumber}_guard;`,
  ];
  await emitMigration(name, lines);
  migrationNumber += 1;
}

const allQuestions = batch.subjects[0].questions;
// Comprehension MCQs embed the full passage in each prompt (duplicated across
// the guard and the insert), so fixed-size chunks breach the remote D1 query
// limit. Pack first-fit decreasing on exact per-part bytes; never exceed 11
// parts so the batch stays inside the allocated 570-582 range together with
// its foundation and final guard.
const partBudgetBytes = 19_200;
const packedParts = [];
{
  const sized = allQuestions
    .map((question) => ({ question, bytes: migrationBytes(574, [question]) }))
    .sort((a, b) => b.bytes - a.bytes || a.question.id.localeCompare(b.question.id));
  const bins = [];
  for (const { question } of sized) {
    let placed = false;
    for (const bin of bins) {
      if (migrationBytes(574, [...bin, question]) < partBudgetBytes) {
        bin.push(question);
        placed = true;
        break;
      }
    }
    if (!placed) bins.push([question]);
  }
  for (const bin of bins) packedParts.push(bin.sort((a, b) => a.id.localeCompare(b.id)));
}
if (process.env.ENG_S3_DEBUG) {
  packedParts.forEach((partQuestions, index) => {
    console.error(`part ${index + 1}: ${migrationBytes(574 + index, partQuestions)} bytes -> ${partQuestions.map((question) => question.id).join(',')}`);
  });
}
if (packedParts.length > 11) throw new Error(`packed ${packedParts.length} parts; the 570-582 range allows at most 11`);
const partCount = packedParts.length;
for (let part = 1; part <= partCount; part += 1) {
  const name = `${migrationNumber}_wassce_english_sprint3_part_${part}.sql`;
  const heading = `Original BrillaPrep WASSCE English Language sprint 3 beta questions, part ${part} of ${partCount} (batch wassce-english-sprint3-001).`;
  await emitMigration(name, questionMigrationLines(migrationNumber, packedParts[part - 1], heading));
  migrationNumber += 1;
}

{
  const allIds = allQuestions.map((question) => question.id);
  const mcqIds = allQuestions.filter((question) => question.type === 'multiple_choice').map((question) => question.id);
  const saIds = allQuestions.filter((question) => question.type === 'short_answer').map((question) => question.id);
  const stIds = allQuestions.filter((question) => question.type === 'structured').map((question) => question.id);
  const totalParts = allQuestions.filter((question) => question.type === 'structured').reduce((sum, question) => sum + question.parts.length, 0);
  const easyCount = allQuestions.filter((question) => question.difficulty === 'easy').length;
  const mediumCount = allQuestions.filter((question) => question.difficulty === 'medium').length;
  const hardCount = allQuestions.filter((question) => question.difficulty === 'hard').length;
  const name = `${migrationNumber}_wassce_english_sprint3_final_guard.sql`;
  const guardTable = `_migration_${migrationNumber}_guard`;
  const lines = [
    `-- ${migrationNumber}: Final exact-set and relationship guard for WASSCE English Language sprint 3 beta batch (wassce-english-sprint3-001).`,
    'PRAGMA foreign_keys = ON;',
    `CREATE TABLE IF NOT EXISTS ${guardTable} (valid INTEGER NOT NULL CHECK (valid = 1));`,
    `DELETE FROM ${guardTable};`,
    `INSERT INTO ${guardTable}(valid) SELECT CASE WHEN (SELECT COUNT(*) FROM questions q JOIN topics t ON t.id = q.topic_id JOIN question_content_releases r ON r.question_id = q.id WHERE q.id IN (${allIds.map(sql).join(', ')}) AND q.subject_id = t.subject_id AND q.subject_id = 'subj_wassce_english' AND q.exam_type_id = 'exam_wassce' AND q.round_type IS NULL AND length(q.explanation) >= 80 AND r.batch_id = '${batchId}' AND r.quality_assurance = 'automated_beta' AND r.release_channel = 'beta' AND r.official_exam_board_content = 0 AND r.feedback_enabled = 1) = ${allIds.length} AND (SELECT COUNT(*) FROM questions q WHERE q.id IN (${mcqIds.map(sql).join(', ')}) AND q.question_type = 'multiple_choice' AND json_valid(q.options) AND json_array_length(q.options) = 4 AND q.correct_answer IN ('A', 'B', 'C', 'D') AND q.points = 3 AND q.marks = 1 AND q.time_limit IN (45, 60)) = ${mcqIds.length} AND (SELECT COUNT(*) FROM questions q WHERE q.id IN (${saIds.map(sql).join(', ')}) AND q.question_type = 'short_answer' AND q.options IS NULL AND length(q.correct_answer) >= 1 AND q.points = 4 AND q.marks = 2 AND q.time_limit = 90) = ${saIds.length} AND (SELECT COUNT(*) FROM questions q WHERE q.id IN (${stIds.map(sql).join(', ')}) AND q.question_type = 'structured' AND q.options IS NULL AND q.points = q.marks AND q.time_limit = 300) = ${stIds.length} AND (SELECT COUNT(*) FROM structured_question_parts sp JOIN questions q ON q.id = sp.question_id WHERE q.id IN (${stIds.map(sql).join(', ')})) = ${totalParts} AND (SELECT COUNT(*) FROM question_content_releases WHERE batch_id = '${batchId}') = ${allIds.length} AND (SELECT COUNT(*) FROM questions WHERE id IN (${allIds.map(sql).join(', ')}) AND difficulty = 'easy') = ${easyCount} AND (SELECT COUNT(*) FROM questions WHERE id IN (${allIds.map(sql).join(', ')}) AND difficulty = 'medium') = ${mediumCount} AND (SELECT COUNT(*) FROM questions WHERE id IN (${allIds.map(sql).join(', ')}) AND difficulty = 'hard') = ${hardCount} THEN 1 ELSE 0 END;`,
    `DROP TABLE ${guardTable};`,
  ];
  await emitMigration(name, lines);
  migrationNumber += 1;
}

if (migrationNumber > 583) throw new Error(`migrations 570-582 allocated, generator produced up to ${migrationNumber - 1}`);

console.log(JSON.stringify({ validation, outBatch, migrations: migrationPaths }, null, 2));
