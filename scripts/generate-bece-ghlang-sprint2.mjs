import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeQuestionText, validateQuestionBatch } from './question-content-lib.mjs';

const sourceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputRootArgument = process.argv.indexOf('--output-root');
if (outputRootArgument >= 0 && !process.argv[outputRootArgument + 1]) throw new Error('--output-root requires a path');
const outputRoot = outputRootArgument >= 0 ? resolve(process.argv[outputRootArgument + 1]) : sourceRoot;
const generatedAt = '2026-09-09T12:30:00Z';
const labels = ['A', 'B', 'C', 'D'];
const batchId = 'bece-ghlang-sprint2-001';
const subjectId = 'subj_bece_gh_lang';
const examTypeId = 'exam_bece';
const examBoardId = 'board_waec';
const contentLabel = "Original BrillaPrep practice content aligned to Ghana's published NaCCA Common Core Programme Ghanaian Language curriculum; not official WAEC or NaCCA examination material. Use the enabled feedback channel to report corrections.";
const releaseSourceUrl = 'https://nacca.gov.gh/common-core-programme-ccp/';

const naccaSource = {
  publisher: 'National Council for Curriculum and Assessment (NaCCA), Ghana',
  title: 'Common Core Programme Curriculum — Ghanaian Language (Basic 7–10)',
  url: releaseSourceUrl,
  use: 'curriculum_blueprint_only',
};

const mcq = (topicCode, difficulty, prompt, correct, wrong, solution, commandWord, assessmentObjective) => ({ topicCode, type: 'multiple_choice', difficulty, prompt, correct, wrong, solution, commandWord, assessmentObjective });

const topics = [
  {
    key: 'greetings',
    topicId: 'topic_bece_ghlang_greetings',
    code: 'GHL-GREET',
    title: 'Greetings and Forms of Address',
    objective: 'Use Akan (Twi) greetings, farewells, polite expressions and respectful titles appropriate to the time of day and the person addressed.',
    questions: [
      mcq('GHL-GREET', 'easy', 'In Twi, the greeting “Maakye” is used at which time of day?', 'In the morning', ['In the afternoon', 'In the evening', 'At midnight'],
        'Maakye is the Akan morning greeting, used from dawn until about midday. The afternoon greeting is “Maaha” and the evening greeting is “Maadwo”, so the other options belong to different parts of the day.', 'Identify', 'AO1'),
      mcq('GHL-GREET', 'easy', 'What does the Twi expression “Akwaaba” mean?', 'Welcome', ['Goodbye', 'Thank you', 'I am sorry'],
        'Akwaaba means “welcome” and is said to a person who has just arrived. A farewell is “Nante yie” and thanks is “Medaase”, so those options describe different expressions.', 'State', 'AO1'),
      mcq('GHL-GREET', 'easy', 'After receiving a gift, Kofi says “Medaase” to the giver. What has Kofi said?', 'Thank you', ['Good morning', 'Welcome', 'How are you?'],
        'Medaase (me da wo ase) is the Akan way of saying “thank you”. “Good morning” is Maakye, “welcome” is Akwaaba and “how are you?” is Ɛte sɛn?, so none of the distractors expresses gratitude.', 'Identify', 'AO1'),
      mcq('GHL-GREET', 'medium', 'A pupil answers a greeting with the respectful reply “Yaa agya”. To whom is the pupil most likely responding?', 'An elderly man', ['An elderly woman', 'A chief or grandparent', 'A younger sibling'],
        '“Yaa agya” is the respectful greeting response given to an elderly man (agya means father). An elderly woman receives “Yaa ɛna”, and a chief or grandparent receives “Yaa nana”; a younger sibling is addressed without these honorific replies.', 'Determine', 'AO2'),
      mcq('GHL-GREET', 'medium', 'What is the appropriate response to the Twi question “Ɛte sɛn?”', '“Me ho yɛ” (I am fine)', ['“Nante yie” (farewell)', '“Akwaaba” (welcome)', '“Maadwo” (good evening)'],
        'Ɛte sɛn? means “How are you?”, and the usual reply is “Me ho yɛ” — I am fine. Nante yie is a farewell, Akwaaba means welcome and Maadwo is the evening greeting, so they answer different situations.', 'Determine', 'AO2'),
      mcq('GHL-GREET', 'medium', 'What does the Twi farewell “Nante yie” literally mean?', '“Walk well” — a farewell wish', ['“Sleep well”', '“Eat well”', '“Come back soon”'],
        'Nante yie literally means “walk well” and is said when people part, wishing the traveller a safe journey. It is a farewell expression, not a wish about sleeping, eating or returning.', 'State', 'AO1'),
      mcq('GHL-GREET', 'hard', 'Which Akan title is correctly used to address or refer to a traditional ruler or a grandparent?', 'Nana', ['Sewaa', 'Wɔfa', 'Onua'],
        'Nana is the honorific title for a chief, a king or a grandparent. Sewaa is a paternal aunt (father’s sister), wɔfa is a maternal uncle (mother’s brother) and onua is a sibling, so none of those titles fits a ruler or grandparent.', 'Identify', 'AO2'),
      mcq('GHL-GREET', 'hard', 'Which Twi expression is used to say “please” when making a polite request?', '“Me pa wo kyɛw”', ['“Meda wo ase”', '“Nante yie”', '“Maakye”'],
        'Me pa wo kyɛw (often heard as mepaakyɛw) literally means “I beg you” and is the polite way to say “please” in Twi. Meda wo ase expresses thanks, Nante yie is a farewell and Maakye is a morning greeting.', 'Identify', 'AO2'),
    ],
  },
  {
    key: 'alphabet',
    topicId: 'topic_bece_ghlang_alphabet',
    code: 'GHL-ALPHA',
    title: 'Alphabet and Phonetics',
    objective: 'Identify the letters, special vowels, digraphs and tonal features of the Akan (Twi) writing system.',
    questions: [
      mcq('GHL-ALPHA', 'easy', 'How many vowels does the Akan (Twi) alphabet have?', '7', ['5', '6', '10'],
        'The Twi alphabet has seven vowels: a, e, ɛ, i, o, ɔ and u. English has five basic vowel letters, which is why 5 is a tempting but wrong answer for Twi.', 'State', 'AO1'),
      mcq('GHL-ALPHA', 'easy', 'Which letter does NOT appear in the Twi alphabet?', 'c', ['ɛ', 'ɔ', 'y'],
        'The Twi alphabet does not contain the letters c, j, q, v, x or z. The special vowels ɛ and ɔ and the consonant y are all genuine Twi letters, so c is the only option that is excluded.', 'Identify', 'AO1'),
      mcq('GHL-ALPHA', 'easy', 'Which of the following is a vowel in the Twi alphabet?', 'ɔ', ['b', 't', 's'],
        'Ɔ (open o) is one of the seven Twi vowels — a, e, ɛ, i, o, ɔ, u. The letters b, t and s are consonants, so they cannot be vowel sounds.', 'Identify', 'AO1'),
      mcq('GHL-ALPHA', 'medium', 'In Twi spelling, “hw” in the word “hwɛ” (look) is an example of what?', 'A digraph — two letters written together to represent a single sound', ['A diphthong — two vowels gliding together', 'A tone mark placed above a syllable', 'A pair of silent letters'],
        'Twi uses digraphs such as dw, gw, hw, kw, ky, nw, ny and tw, where two letters together spell one consonant sound. Since h and w are consonants, “hw” cannot be a diphthong, and both letters are pronounced.', 'Identify', 'AO2'),
      mcq('GHL-ALPHA', 'medium', 'Twi is described as a tonal language. What does this mean?', 'The pitch at which a syllable is spoken can change the meaning of a word', ['Every sentence must be sung to a fixed melody', 'Words are stressed only by making them louder', 'Words are written with musical notes'],
        'In a tonal language, high and low pitch distinguish words that otherwise have the same letters — for example “papa” can mean “good” or “fan” depending on the tones. Tone is about pitch, not loudness or singing, and it is normally not written in everyday Twi spelling.', 'Explain', 'AO2'),
      mcq('GHL-ALPHA', 'medium', 'Which two special vowels does the Twi alphabet add to the basic Latin vowels?', 'ɛ and ɔ', ['ɑ and ə', 'ë and ö', 'æ and œ'],
        'Twi writing adds ɛ (open e) and ɔ (open o) to the five Latin vowels, giving the seven-vowel set a, e, ɛ, i, o, ɔ, u. The pairs ɑ/ə, ë/ö and æ/œ do not belong to the standard Twi alphabet.', 'Identify', 'AO1'),
      mcq('GHL-ALPHA', 'hard', 'How many letters are there in the full Akan (Twi) alphabet?', '22', ['21', '24', '26'],
        'The Twi alphabet has 22 letters: 15 consonants (b, d, f, g, h, k, l, m, n, p, r, s, t, w, y) and 7 vowels (a, e, ɛ, i, o, ɔ, u). The English alphabet has 26 letters, which makes 26 a common wrong guess.', 'State', 'AO2'),
      mcq('GHL-ALPHA', 'hard', 'Which of these words begins with a Twi digraph?', 'Hwɛ (look)', ['Hene (chief)', 'Wura (owner)', 'Ase (under)'],
        'Hwɛ begins with the digraph “hw”, two letters spelling one consonant sound. Hene begins with the single letter h, wura with w, and ase with the vowel a, so none of them starts with a digraph.', 'Identify', 'AO3'),
    ],
  },
  {
    key: 'numbers',
    topicId: 'topic_bece_ghlang_numbers',
    code: 'GHL-NUM',
    title: 'Numbers and Counting',
    objective: 'Use Akan (Twi) cardinal and ordinal numbers correctly and explain how compound numerals are built.',
    questions: [
      mcq('GHL-NUM', 'easy', 'What does the Twi numeral “baako” mean?', 'One', ['Two', 'Three', 'Ten'],
        'Baako means one. Two is mmienu, three is mmiɛnsa and ten is du, so the other options are different numerals.', 'State', 'AO1'),
      mcq('GHL-NUM', 'easy', 'A trader sells “du” oranges to a customer. How many oranges did the customer buy?', 'Ten', ['Five', 'Twenty', 'One hundred'],
        'Du means ten in Twi. Five is enum, twenty is aduonu and one hundred is ɔha, so only ten matches the numeral in the sentence.', 'Determine', 'AO1'),
      mcq('GHL-NUM', 'easy', 'Which Twi numeral means “two”?', 'Mmienu', ['Mmiɛnsa', 'Enum', 'Nson'],
        'Mmienu means two. Mmiɛnsa is three, enum is five and nson is seven, so they are all distractors from the basic counting list.', 'Identify', 'AO1'),
      mcq('GHL-NUM', 'medium', 'The numeral “aduonu” in Twi stands for which number?', 'Twenty', ['Twelve', 'Thirty', 'Two hundred'],
        'Aduonu is built from adu- (tens) and -nu (two): two lots of ten, which is 2 × 10 = 20. Twelve is dumienu, thirty is aduasa and two hundred is ahaenu, so twenty is the only match.', 'Determine', 'AO2'),
      mcq('GHL-NUM', 'medium', 'How do you say “fifteen” in Twi?', 'Dunum', ['Dunan', 'Aduonum', 'Enum'],
        'Dunum joins du (ten) and num (five): 10 + 5 = 15. Dunan is fourteen (10 + 4), aduonum is fifty (5 × 10) and enum is simply five, so they do not give fifteen.', 'Determine', 'AO2'),
      mcq('GHL-NUM', 'medium', 'What number is “ɔha” in Akan counting?', 'One hundred', ['One thousand', 'Ten', 'Sixty'],
        'Ɔha means one hundred. One thousand is apem, ten is du and sixty is aduosia, so those options name other counting milestones.', 'State', 'AO1'),
      mcq('GHL-NUM', 'hard', 'The Twi numeral “aduasa” represents which number?', 'Thirty', ['Thirteen', 'Three', 'Three hundred'],
        'Aduasa is a compound numeral: adu- (tens) plus -sa (three) gives 3 × 10 = 30. Thirteen is dumiɛnsa (10 + 3), three alone is mmiɛnsa and three hundred is ahasa, so only thirty fits.', 'Determine', 'AO3'),
      mcq('GHL-NUM', 'hard', 'How are ordinal numbers such as “second” and “third” formed in Akan?', 'By placing “ɔto so” before the cardinal number, as in “ɔto so mmienu” (second)', ['By adding “fo” after the cardinal number', 'By repeating the cardinal number twice', 'By adding “de” before the cardinal number'],
        'Akan forms ordinals with the pattern “ɔto so” plus the cardinal number: ɔto so mmienu is second and ɔto so mmiɛnsa is third. “First” is the exception and is expressed with “a ɔdi kan” (the one that leads).', 'Explain', 'AO3'),
    ],
  },
  {
    key: 'family',
    topicId: 'topic_bece_ghlang_family',
    code: 'GHL-FAM',
    title: 'Family and Kinship',
    objective: 'Use Akan kinship terms correctly and describe how family membership is traced in the matrilineal system.',
    questions: [
      mcq('GHL-FAM', 'easy', 'In Twi, “agya” refers to which family member?', 'Father', ['Mother', 'Uncle', 'Grandfather'],
        'Agya means father. Mother is ɛna, a (maternal) uncle is wɔfa and a grandfather is nanabarima or nana, so the distractors are different relatives.', 'Identify', 'AO1'),
      mcq('GHL-FAM', 'easy', 'What does the Twi word “ɛna” mean?', 'Mother', ['Sister', 'Grandmother', 'Aunt'],
        'Ɛna means mother. A sister is nua ɔbaa, a grandmother is nana and a paternal aunt is sewaa, so none of the other options matches.', 'Identify', 'AO1'),
      mcq('GHL-FAM', 'easy', 'The Akan word “abusua” refers to what?', 'The extended family or clan', ['The nuclear household only', 'A group of close friends', 'People of the same age group'],
        'Abusua is the extended family or clan — among the Akan it is the matrilineal family group traced through the mother. It goes far beyond the parents-and-children household, and it is defined by blood descent, not friendship or age.', 'State', 'AO1'),
      mcq('GHL-FAM', 'medium', 'In Akan kinship, your “wɔfa” is which relative?', 'Your mother’s brother (maternal uncle)', ['Your father’s brother', 'Your sister’s husband', 'Your grandfather'],
        'Wɔfa is the maternal uncle — the mother’s brother — who plays an important role in the matrilineal family. A father’s brother is regarded as another “father” (agya), and a sister’s husband and grandfather have different terms.', 'Identify', 'AO2'),
      mcq('GHL-FAM', 'medium', '“Sewaa” in Akan kinship refers to which relative?', 'One’s father’s sister (paternal aunt)', ['One’s mother’s brother', 'One’s grandmother', 'One’s stepmother'],
        'Sewaa is the paternal aunt — the father’s sister. The mother’s brother is wɔfa, a grandmother is nana, and a stepmother is described differently, so only the father’s sister is correct.', 'Identify', 'AO2'),
      mcq('GHL-FAM', 'medium', 'The word “onua” refers to which family member?', 'A sibling — a brother or a sister', ['A cousin only', 'A parent', 'A grandchild'],
        'Onua means a sibling. When the sex must be specified, Akan says nua barima (brother) or nua ɔbaa (sister). Parents are agya and ɛna, so onua cannot mean a parent or grandchild.', 'Identify', 'AO1'),
      mcq('GHL-FAM', 'hard', 'Among the Akan, a child traditionally inherits abusua (clan) membership from which side of the family?', 'The mother’s line', ['The father’s line', 'Both parents equally', 'The chief’s lineage'],
        'The Akan practise matrilineal descent: abusua membership and inheritance pass through the mother, which is why the wɔfa (mother’s brother) is so important. Descent through the father’s line is patrilineal, the opposite system.', 'Explain', 'AO2'),
      mcq('GHL-FAM', 'hard', 'Kofi calls little Adjoa his “wɔfase”. What is their most likely relationship?', 'Kofi is Adjoa’s maternal uncle — she is his sister’s child', ['Adjoa is Kofi’s own daughter', 'Kofi is Adjoa’s paternal uncle', 'Adjoa is Kofi’s cousin'],
        'Wɔfase is the nephew or niece of a wɔfa (maternal uncle) — that is, the sister’s child, who belongs to the same matrilineal abusua. A man’s own daughter belongs to her mother’s clan, not his, so she would not be his wɔfase.', 'Determine', 'AO3'),
    ],
  },
  {
    key: 'grammar',
    topicId: 'topic_bece_ghlang_grammar',
    code: 'GHL-GRAM',
    title: 'Grammar and Sentence Structure',
    objective: 'Identify Akan pronouns, question words, plural formation, word order and the prefixes that mark tense and negation.',
    questions: [
      mcq('GHL-GRAM', 'easy', 'In Twi, the pronoun “me” means what?', 'I / me', ['You', 'He or she', 'We'],
        'Me is the first-person singular pronoun (I/me). The basic set is me (I), wo (you), ɔno (he/she), yɛn (we), mo (you plural) and wɔn (they), so the other options are different pronouns.', 'Identify', 'AO1'),
      mcq('GHL-GRAM', 'easy', 'In the sentence “Wɔn reba” (they are coming), what does “wɔn” mean?', 'They', ['We', 'You (plural)', 'He'],
        'Wɔn is the third-person plural pronoun “they”. “We” is yɛn, “you” plural is mo and “he” is ɔno, so they cannot fit the translation “they are coming”.', 'Identify', 'AO1'),
      mcq('GHL-GRAM', 'easy', 'What is the basic word order of a simple Twi sentence such as “Kwame di aduane” (Kwame eats food)?', 'Subject – verb – object', ['Verb – subject – object', 'Object – verb – subject', 'Subject – object – verb'],
        'Twi, like English, uses subject – verb – object order: Kwame (subject) di (verb) aduane (object). Placing the verb or object first would produce an unusual or ungrammatical simple sentence.', 'Identify', 'AO1'),
      mcq('GHL-GRAM', 'medium', 'In “Ama redidi” (Ama is eating), what does the prefix “re-” on the verb show?', 'That the action is happening now (progressive)', ['That the action is completed', 'That the action will happen tomorrow', 'That the action is a command'],
        'The prefix re- marks the progressive aspect — an action in progress: Ama redidi means “Ama is eating”. A completed action would take the a- prefix (Ama adidi — Ama has eaten), so “completed” is the opposite of what re- shows.', 'Explain', 'AO2'),
      mcq('GHL-GRAM', 'medium', 'Which Twi question word means “who”?', 'Hena', ['Dɛn', 'Hen', 'Sɛn'],
        'Hena asks “who”. Dɛn means “what”, hen means “where” and sɛn means “how”, so each distractor asks a different kind of question.', 'Identify', 'AO1'),
      mcq('GHL-GRAM', 'medium', 'What is the plural of “ɔbarima” (man) in Twi?', 'Mmarima', ['Mbarima', 'Ɔbarimafo', 'Mmarimafo'],
        'Many Akan nouns form the plural by changing the singular a/ɔ-class prefix to the m(m)-class prefix: ɔbarima becomes mmarima, just as abɔfra (child) becomes mmɔfra (children). The other forms are not valid plurals.', 'Determine', 'AO2'),
      mcq('GHL-GRAM', 'hard', 'In “Kofi akɔ sukuu” (Kofi has gone to school), the prefix “a-” on the verb “kɔ” indicates what?', 'A completed action (perfective past)', ['An action still in progress', 'A future action', 'A negative action'],
        'The a- prefix marks a completed (perfective) action: akɔ means “has gone”. An action in progress would use re- (Kofi rekɔ — Kofi is going), and negation uses the n- prefix, so a- cannot show progress or negation.', 'Explain', 'AO3'),
      mcq('GHL-GRAM', 'hard', 'The “n” inside “mennim” (I do not know) marks which grammatical feature?', 'Negation', ['The future tense', 'A question', 'The plural'],
        'Menim means “I know”; inserting the negative prefix n- gives mennim, “I do not know”. Negation in Akan is shown by this n- prefix on the verb, not by a separate word for “not”.', 'Explain', 'AO3'),
    ],
  },
  {
    key: 'proverbs',
    topicId: 'topic_bece_ghlang_proverbs',
    code: 'GHL-PROV',
    title: 'Proverbs and Idioms',
    objective: 'Interpret common Akan proverbs and idioms and explain the wisdom they teach.',
    questions: [
      mcq('GHL-PROV', 'easy', 'What is an “abɛ” in Akan speech?', 'A proverb — a short, wise saying', ['A folktale about Ananse', 'A funeral dirge', 'A praise song'],
        'Abɛ is the Akan word for a proverb, a short traditional saying that carries wisdom. Folktales are anansesem, while dirges and praise songs are performed pieces, not proverbs.', 'Identify', 'AO1'),
      mcq('GHL-PROV', 'easy', 'The proverb “Tikoro nko agyina” teaches which lesson?', 'One person alone cannot hold council — unity and cooperation are needed', ['It is best to stand alone in every matter', 'A leader needs no advice from anyone', 'Meetings are a waste of time'],
        'Tikoro nko agyina literally means “one head does not go into council”: important decisions need more than one mind. It teaches the value of cooperation and consultation, the opposite of standing alone.', 'Explain', 'AO1'),
      mcq('GHL-PROV', 'easy', 'Why do Akan speakers value proverbs in everyday speech?', 'They pass on wisdom and advice in a memorable, indirect way', ['They make speech longer without adding meaning', 'They are used only to insult listeners', 'They completely replace ordinary greetings'],
        'Proverbs package the community’s wisdom into short, memorable sayings, allowing speakers to advise or correct others politely and indirectly. Skilful use of proverbs is a mark of a good speaker in Akan culture.', 'Explain', 'AO1'),
      mcq('GHL-PROV', 'medium', '“Woforo dua pa a, na yɛpia wo” means what?', 'If you climb a good tree, we give you a push — society supports a worthy cause', ['Never climb trees without permission', 'Good trees belong only to the elders', 'You should never ask anyone for help'],
        'The proverb says that when you climb a good tree, people push you up: when a person pursues a good and worthy goal, the community rallies to support them. It encourages worthwhile effort rather than forbidding climbing or help.', 'Explain', 'AO2'),
      mcq('GHL-PROV', 'medium', 'The saying behind Sankofa — “Sɛ wo were fi na wosan kɔ fa a, yɛnkyiri” — teaches that...', 'It is not wrong to go back for what you have forgotten — we should learn from the past', ['The past must be forgotten completely', 'You should never turn back on a journey', 'Old things are always useless'],
        'The Sankofa saying means “it is not taboo to go back and fetch what you forgot”: revisiting the past to recover wisdom is honourable, not shameful. This is why the Sankofa bird looks backwards, and it is the opposite of forgetting the past.', 'Explain', 'AO2'),
      mcq('GHL-PROV', 'medium', '“Aboa bi bɛka wo a, na ofiri wo ntoma mu” warns that...', 'Danger or betrayal can come from people who are very close to you', ['Insects like hiding inside clothes', 'Only strangers can ever hurt you', 'You should never wear other people’s clothes'],
        'Literally, “the insect that will bite you comes from your own cloth”: the people closest to us are often the ones in a position to harm or betray us. The cloth and the insect are images, so the literal readings are distractors.', 'Explain', 'AO2'),
      mcq('GHL-PROV', 'hard', 'The proverb “Obi nkyere abɔfra Nyame” (no one points out God to a child) suggests what?', 'Some truths are so evident that they need no explanation', ['Children must never be taught about religion', 'God reveals Himself only to adults', 'Children always know more than elders'],
        'The proverb means that no one has to show God to a child, because the evidence of God in creation is plain for all to see: some truths are self-evident. It does not forbid religious teaching or claim children know more than elders.', 'Explain', 'AO3'),
      mcq('GHL-PROV', 'hard', 'How does an idiom (nsɛnkyerɛnne) differ from a proverb?', 'An idiom is a fixed phrase whose meaning cannot be worked out from its individual words, while a proverb is a complete wise saying', ['An idiom is always longer than a proverb', 'Idioms are used only in written Twi', 'There is no difference between the two'],
        'An idiom is a fixed expression with a figurative meaning that its separate words do not reveal, whereas a proverb is a full traditional saying that states a piece of wisdom. Both are used freely in spoken Twi, and length is not what separates them.', 'Explain', 'AO3'),
    ],
  },
  {
    key: 'culture',
    topicId: 'topic_bece_ghlang_culture',
    code: 'GHL-CULT',
    title: 'Oral Literature and Culture',
    objective: 'Describe Akan oral literature, day names, festivals, libation and the roles of the okyeame and talking drums.',
    questions: [
      mcq('GHL-CULT', 'easy', '“Anansesem” are traditional Akan stories that usually feature which character?', 'Kwaku Ananse, the spider', ['The lion, king of the forest', 'The crocodile of the river', 'A magical talking drum'],
        'Anansesem are folktales built around Kwaku Ananse, the clever and tricky spider whose exploits teach moral lessons. Lions, crocodiles and drums appear in some tales, but the central character of anansesem is the spider.', 'Identify', 'AO1'),
      mcq('GHL-CULT', 'easy', 'What is “mpaebo” in Akan custom?', 'The pouring of libation — offering drink with prayers to God and the ancestors', ['A naming ceremony for a baby', 'A funeral dance', 'A harvest meal'],
        'Mpaebo is the pouring of libation: drink is poured while prayers are said to God (Onyankopɔn), the earth and the ancestors to open important occasions. A naming ceremony is abadinto, so that option belongs to a different rite.', 'Identify', 'AO1'),
      mcq('GHL-CULT', 'easy', 'A boy born on a Monday among the Akan is commonly given which day-name?', 'Kwadwo', ['Kwabena', 'Kofi', 'Kwame'],
        'Monday-born boys are called Kwadwo (and girls Adwoa). Kwabena is Tuesday, Kofi is Friday and Kwame is Saturday, so the other names belong to different days.', 'Identify', 'AO1'),
      mcq('GHL-CULT', 'medium', 'A girl born on a Sunday among the Akan is commonly named...', 'Akosua', ['Adwoa', 'Yaa', 'Ama'],
        'Sunday-born girls are Akosua (boys are Kwesi). Adwoa is Monday, Yaa is Thursday and Ama is Saturday, so those names belong to other days of the week.', 'Identify', 'AO2'),
      mcq('GHL-CULT', 'medium', 'The Aboakyer festival of the Effutu people of Winneba is famous for what?', 'The hunt for a live deer, which is offered to their god', ['Hooting at hunger with sprinkled mashed food', 'The first eating of the new yam', 'A canoe race on the sea'],
        'At Aboakyer, two warrior groups compete to catch a live deer and present it to the god Penkye Otu. Hooting at hunger describes the Ga Homowo festival, so that distractor belongs to a different celebration.', 'Identify', 'AO2'),
      mcq('GHL-CULT', 'medium', '“Homowo”, the festival whose name means “hooting at hunger”, belongs to which people?', 'The Ga people', ['The Asante people', 'The Ewe people', 'The Dagomba people'],
        'Homowo is the festival of the Ga people of Accra, celebrating the end of a historic famine: kpokpoi (a special dish) is sprinkled while hunger is hooted at and mocked. The Asante celebrate Adae, so the other peoples are distractors.', 'Identify', 'AO2'),
      mcq('GHL-CULT', 'hard', 'What is the role of the “okyeame” in an Akan chief’s court?', 'The linguist who relays, polishes and speaks on behalf of the chief', ['The lead drummer of the atumpan drums', 'The chief’s eldest son and heir', 'The priest who pours libation'],
        'The okyeame is the chief’s linguist and spokesperson: visitors speak through him, and he repeats and adorns the chief’s words with proverbs. Drumming, succession and libation belong to other office holders in the court.', 'Identify', 'AO3'),
      mcq('GHL-CULT', 'hard', 'Why are the atumpan called “talking drums”?', 'Their tones imitate the pitch patterns of speech, so skilled drummers can send messages and praise names', ['They have recorded human voices hidden inside them', 'They are beaten only at funeral dances', 'They can be heard by everyone over long distances'],
        'Because Akan is a tonal language, the high and low tones of the atumpan can mirror the pitch of spoken phrases, allowing drummers to “speak” proverbs, praise names and announcements. The drums contain no voices, and being loud alone would not make them “talk”.', 'Explain', 'AO3'),
    ],
  },
];

// Prod-canonical BECE Ghanaian Language topic rows (verified against prod D1 on 2026-09-09;
// identical to prod-patch 096 rows, so INSERT OR IGNORE no-ops on prod and fresh baselines).
// [id, subjectId, parentId, name, slug, description, theoryContent, keyFormulas, displayOrder, createdAt]
const canonicalTopicRows = [
  ['topic_bece_ghlang_greetings', subjectId, null, 'Greetings and Forms of Address', 'greetings-and-forms-of-address', 'Greetings, titles and respectful forms of address', null, null, 1, '2026-08-13T00:00:00.000Z'],
  ['topic_bece_ghlang_alphabet', subjectId, null, 'Alphabet and Phonetics', 'alphabet-and-phonetics', 'Letters, sounds and tone in Ghanaian languages', null, null, 2, '2026-08-13T00:00:00.000Z'],
  ['topic_bece_ghlang_numbers', subjectId, null, 'Numbers and Counting', 'numbers-and-counting', 'Cardinal and ordinal numbers, counting and basic arithmetic terms', null, null, 3, '2026-08-13T00:00:00.000Z'],
  ['topic_bece_ghlang_family', subjectId, null, 'Family and Kinship', 'family-and-kinship', 'Kinship terms, family structure and relationships', null, null, 4, '2026-08-13T00:00:00.000Z'],
  ['topic_bece_ghlang_grammar', subjectId, null, 'Grammar and Sentence Structure', 'grammar-and-sentence-structure', 'Word classes, sentence formation and usage', null, null, 5, '2026-08-13T00:00:00.000Z'],
  ['topic_bece_ghlang_proverbs', subjectId, null, 'Proverbs and Idioms', 'proverbs-and-idioms', 'Common proverbs, idioms and their meanings', null, null, 6, '2026-08-13T00:00:00.000Z'],
  ['topic_bece_ghlang_culture', subjectId, null, 'Oral Literature and Culture', 'oral-literature-and-culture', 'Folktales, songs, festivals and cultural practices', null, null, 7, '2026-08-13T00:00:00.000Z'],
];

for (const topic of topics) {
  const row = canonicalTopicRows.find(([topicId]) => topicId === topic.topicId);
  if (!row) throw new Error(`${topic.key}: topic id ${topic.topicId} is not a prod-verified canonical topic`);
  if (row[1] !== subjectId) throw new Error(`${topic.key}: topic id ${topic.topicId} belongs to ${row[1]}, not ${subjectId}`);
  for (const question of topic.questions) {
    if (question.topicCode !== topic.code) throw new Error(`${topic.key}: question uses undeclared topic code ${question.topicCode}`);
  }
}

// --- Batch assembly ----------------------------------------------------------
const officialAttributionPattern = /\b(?:official\s+(?:waec|west african examinations council|nacca|cambridge)|(?:waec|nacca|cambridge)[ -](?:approved|endorsed|authored|issued|certified))\b/i;
const nonOfficialDisclaimerGlobalPattern = /\b(?:not|non[- ]?)\s+official\s+(?:waec|west african examinations council|nacca|cambridge(?:\s+international)?)\b/gi;
function assertNoFalseOfficialClaim(value, field) {
  const withoutDisclaimer = String(value).replace(nonOfficialDisclaimerGlobalPattern, '');
  if (officialAttributionPattern.test(withoutDisclaimer)) throw new Error(`${field} contains a false official-exam-board claim`);
}

let mcqCounter = 0;
function buildMcq(topic, question, index) {
  const correctIndex = mcqCounter++ % 4;
  const rawOptions = [...question.wrong];
  rawOptions.splice(correctIndex, 0, question.correct);
  const options = rawOptions.map((text, optionIndex) => ({
    label: labels[optionIndex],
    text,
    rationale: optionIndex === correctIndex
      ? `This is the supported answer. ${question.solution}`
      : 'This option is a plausible misconception, but it conflicts with the explanation established in the worked solution.',
  }));
  return {
    id: `q_bghl_${topic.key}_s2_${String(index + 1).padStart(3, '0')}`,
    original: true,
    topicCode: question.topicCode,
    type: 'multiple_choice',
    prompt: question.prompt,
    options,
    correctAnswer: labels[correctIndex],
    workedSolution: `${question.solution} Therefore the correct answer is ${labels[correctIndex]}: ${question.correct}.`,
    difficulty: question.difficulty,
    marks: 1,
    points: question.difficulty === 'hard' ? 4 : question.difficulty === 'medium' ? 3 : 2,
    timeLimit: question.difficulty === 'hard' ? 120 : question.difficulty === 'medium' ? 90 : 60,
    commandWord: question.commandWord,
    assessmentObjective: question.assessmentObjective,
    provenance: [naccaSource],
  };
}

const batch = {
  batchId,
  status: 'approved_for_beta',
  examTypeId,
  provenance: [naccaSource],
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
    subjectId,
    specificationCode: 'BRILLA-NACCA-CCP-GHL-S2-001',
    sources: [naccaSource],
    topics: topics.map(({ code, title, objective }) => ({ code, title, objective })),
    questions: topics.flatMap((topic) => topic.questions.map((question, index) => buildMcq(topic, question, index))),
  }],
};

// --- Validation --------------------------------------------------------------
const validation = validateQuestionBatch(batch, { mode: 'draft' });

function inHouseValidation(errors) {
  if (batch.review.automatedChecksAt !== generatedAt) errors.push('review.automatedChecksAt mismatch');
  if (batch.release.channel !== 'beta') errors.push('release.channel must be beta');
  if (typeof batch.release.contentLabel !== 'string' || batch.release.contentLabel.trim().length < 40) errors.push('release.contentLabel too short');
  if (!/not official/i.test(batch.release.contentLabel)) errors.push('release.contentLabel must disclaim official status');
  if (batch.release.officialExamBoardContent !== false) errors.push('release.officialExamBoardContent must be false');
  if (batch.release.feedbackEnabled !== true) errors.push('release.feedbackEnabled must be true');

  const letterCounts = { A: 0, B: 0, C: 0, D: 0 };
  const difficultyCounts = { easy: 0, medium: 0, hard: 0 };
  const topicCounts = new Map();
  for (const question of batch.subjects[0].questions) {
    topicCounts.set(question.topicCode, (topicCounts.get(question.topicCode) ?? 0) + 1);
    if (!Array.isArray(question.provenance) || question.provenance[0]?.use !== 'curriculum_blueprint_only') errors.push(`${question.id}: per-item provenance missing`);
    assertNoFalseOfficialClaim(question.prompt, `${question.id}.prompt`);
    if (question.type !== 'multiple_choice') errors.push(`${question.id}: unexpected type ${question.type}`);
    letterCounts[question.correctAnswer] += 1;
    difficultyCounts[question.difficulty] += 1;
    if (question.options?.length !== 4) errors.push(`${question.id}: MCQ needs exactly 4 options`);
    if (question.marks !== 1) errors.push(`${question.id}: MCQ marks must be 1`);
  }
  const total = batch.subjects[0].questions.length;
  if (total !== 56) errors.push(`expected 56 MCQs, found ${total}`);
  for (const topic of topics) {
    if (topicCounts.get(topic.code) !== 8) errors.push(`${topic.key}: expected 8 questions, found ${topicCounts.get(topic.code) ?? 0}`);
  }
  for (const [letter, count] of Object.entries(letterCounts)) {
    if (count < 8) errors.push(`correct-answer letter ${letter} appears only ${count} times (must vary)`);
  }
  for (const [difficulty, count] of Object.entries(difficultyCounts)) {
    if (count === 0) errors.push(`no ${difficulty} questions present`);
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
const duplicatePrompts = batch.subjects[0].questions
  .map((question) => ({ id: question.id, source: existingContent.get(normalizeQuestionText(question.prompt)) }))
  .filter(({ source }) => source);
if (duplicatePrompts.length) {
  throw new Error(`Generated content duplicates existing rows:\n${duplicatePrompts.map(({ id, source }) => `${id}: ${source}`).join('\n')}`);
}

// --- SQL emission ------------------------------------------------------------
const sql = (value) => value == null ? 'NULL' : `'${String(value).replaceAll("'", "''")}'`;
const topicId = (code) => topics.find((topic) => topic.code === code).topicId;
const canonicalQuestionFields = [
  'topic_id', 'subject_id', 'exam_type_id', 'paper_type_id', 'past_paper_id',
  'question_text', 'question_type', 'round_type', 'options', 'correct_answer',
  'explanation', 'difficulty', 'points', 'marks', 'time_limit', 'question_number',
  'section', 'is_compulsory', 'image_url', 'syllabus_topic_id', 'command_word',
  'assessment_objective', 'source_paper_code', 'source_question_number', 'exam_board_id',
];

function questionValues(question) {
  const options = JSON.stringify(question.options.map(({ label, text }) => `${label}. ${text}`));
  return {
    topic_id: topicId(question.topicCode),
    subject_id: subjectId,
    exam_type_id: examTypeId,
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
    assessment_objective: question.assessmentObjective,
    source_paper_code: null,
    source_question_number: null,
    exam_board_id: examBoardId,
  };
}

// Each topic migration stages its rows once in scratch tables (_migration_N_expected)
// and both inserts and fail-closed checks read from them, so repeated field values
// never push a file over the remote D1 query limit.
const numericQuestionFields = new Set(['points', 'marks', 'time_limit', 'question_number', 'is_compulsory']);

function expectedTableDDL(table) {
  const columns = ['id TEXT PRIMARY KEY', ...canonicalQuestionFields.map((field) => `${field} ${numericQuestionFields.has(field) ? 'INTEGER' : 'TEXT'}`)];
  return `CREATE TABLE ${table} (${columns.join(', ')});`;
}

function canonicalMatchExpected(questionAlias, expectedAlias) {
  return canonicalQuestionFields.map((field) => `${questionAlias}.${field} IS ${expectedAlias}.${field}`).join(' AND ');
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

let migrationNumber = 502;
{
  const name = `${migrationNumber}_bece_ghlang_sprint2_foundation.sql`;
  const allTopicIds = topics.map((topic) => topic.topicId);
  const lines = [
    `-- ${migrationNumber}: Foundation guard for BECE Ghanaian Language content sprint 2 (batch ${batchId}).`,
    '-- Original BrillaPrep practice content; not official WAEC or NaCCA material.',
    '-- Also seeds the prod-canonical BECE Ghanaian Language topic rows and the WAEC',
    '-- exam-board row for fresh baselines; INSERT OR IGNORE no-ops on prod where',
    '-- every row already exists.',
    'PRAGMA foreign_keys = ON;',
    `INSERT OR IGNORE INTO exam_boards (id, name, code, full_name, region, website_url, is_active, display_order) VALUES ('board_waec', 'WAEC', 'WAEC', 'West African Examinations Council', 'West Africa', 'https://waecgh.org/', 1, 1);`,
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
    ...canonicalTopicRows.map(([id, topicSubjectId, parentId, topicName, slug, description, theoryContent, keyFormulas, displayOrder, createdAt]) =>
      `INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES (${sql(id)}, ${sql(topicSubjectId)}, ${sql(parentId)}, ${sql(topicName)}, ${sql(slug)}, ${sql(description)}, ${sql(theoryContent)}, ${sql(keyFormulas)}, ${displayOrder}, ${sql(createdAt)});`),
    `CREATE TABLE IF NOT EXISTS _migration_${migrationNumber}_guard (valid INTEGER NOT NULL CHECK (valid = 1));`,
    `DELETE FROM _migration_${migrationNumber}_guard;`,
    `INSERT INTO _migration_${migrationNumber}_guard(valid) SELECT CASE WHEN EXISTS (SELECT 1 FROM exam_types WHERE id = '${examTypeId}') AND EXISTS (SELECT 1 FROM exam_boards WHERE id = '${examBoardId}') AND EXISTS (SELECT 1 FROM subjects WHERE id = '${subjectId}' AND exam_type_id = '${examTypeId}') AND (SELECT COUNT(*) FROM topics WHERE id IN (${allTopicIds.map(sql).join(', ')}) AND subject_id = '${subjectId}') = ${allTopicIds.length} THEN 1 ELSE 0 END;`,
    `DROP TABLE _migration_${migrationNumber}_guard;`,
  ];
  await emitMigration(name, lines);
  migrationNumber += 1;
}

const allQuestions = batch.subjects[0].questions;
for (const topic of topics) {
  const topicQuestions = allQuestions.filter((question) => question.topicCode === topic.code);
  const ids = topicQuestions.map((question) => question.id);
  const expectedTable = `_migration_${migrationNumber}_expected`;
  const guardTable = `_migration_${migrationNumber}_guard`;
  const name = `${migrationNumber}_bece_ghlang_${topic.key}.sql`;
  const lines = [
    `-- ${migrationNumber}: Original BrillaPrep BECE Ghanaian Language (Akan/Twi, NaCCA CCP) ${topic.title} practice questions (batch ${batchId}).`,
    '-- Curriculum-aligned practice content; not official WAEC or NaCCA material.',
    'PRAGMA foreign_keys = ON;',
    expectedTableDDL(expectedTable),
    `INSERT INTO ${expectedTable} (id, ${canonicalQuestionFields.join(', ')}) VALUES ${topicQuestions.map((question) => {
      const values = questionValues(question);
      return `(${sql(question.id)}, ${canonicalQuestionFields.map((field) => sql(values[field])).join(', ')})`;
    }).join(',\n')};`,
    `CREATE TABLE IF NOT EXISTS ${guardTable} (valid INTEGER NOT NULL CHECK (valid = 1));`,
    `DELETE FROM ${guardTable};`,
  ];
  const preflightChecks = [
    `NOT EXISTS (SELECT 1 FROM ${expectedTable} e JOIN questions q ON q.id = e.id WHERE NOT (${canonicalMatchExpected('q', 'e')}))`,
    `NOT EXISTS (SELECT 1 FROM ${expectedTable} e JOIN question_content_releases r ON r.question_id = e.id WHERE NOT (${releaseMatch('r')}))`,
  ];
  lines.push(`INSERT INTO ${guardTable}(valid) SELECT CASE WHEN ${preflightChecks.join(' AND ')} THEN 1 ELSE 0 END;`);
  lines.push(`INSERT INTO questions (id, ${canonicalQuestionFields.join(', ')}) SELECT id, ${canonicalQuestionFields.join(', ')} FROM ${expectedTable} e WHERE NOT EXISTS (SELECT 1 FROM questions q WHERE q.id = e.id);`);
  lines.push(`INSERT INTO question_content_releases (question_id, batch_id, quality_assurance, release_channel, content_label, source_url, official_exam_board_content, feedback_enabled) SELECT e.id, '${batchId}', 'automated_beta', 'beta', ${sql(contentLabel)}, ${sql(releaseSourceUrl)}, 0, 1 FROM ${expectedTable} e WHERE NOT EXISTS (SELECT 1 FROM question_content_releases r WHERE r.question_id = e.id);`);
  lines.push(`DELETE FROM ${guardTable};`);
  lines.push(`INSERT INTO ${guardTable}(valid) SELECT CASE WHEN (SELECT COUNT(*) FROM questions q JOIN ${expectedTable} e ON e.id = q.id AND ${canonicalMatchExpected('q', 'e')}) = ${ids.length} AND (SELECT COUNT(*) FROM question_content_releases r JOIN ${expectedTable} e ON e.id = r.question_id WHERE ${releaseMatch('r')}) = ${ids.length} AND (SELECT COUNT(*) FROM questions q JOIN topics t ON t.id = q.topic_id AND t.subject_id = q.subject_id JOIN ${expectedTable} e ON e.id = q.id) = ${ids.length} AND (SELECT COUNT(*) FROM questions q JOIN subjects s ON s.id = q.subject_id AND s.exam_type_id = q.exam_type_id JOIN ${expectedTable} e ON e.id = q.id) = ${ids.length} THEN 1 ELSE 0 END;`);
  lines.push(`DROP TABLE ${guardTable};`);
  lines.push(`DROP TABLE ${expectedTable};`);
  await emitMigration(name, lines);
  migrationNumber += 1;
}

{
  const name = `${migrationNumber}_bece_ghlang_sprint2_final_guard.sql`;
  const guardTable = `_migration_${migrationNumber}_guard`;
  const allIds = allQuestions.map((question) => question.id);
  const lines = [
    `-- ${migrationNumber}: Final exact-set and relationship guard for BECE Ghanaian Language sprint 2 (batch ${batchId}).`,
    'PRAGMA foreign_keys = ON;',
    `CREATE TABLE IF NOT EXISTS ${guardTable} (valid INTEGER NOT NULL CHECK (valid = 1));`,
    `DELETE FROM ${guardTable};`,
    `INSERT INTO ${guardTable}(valid) SELECT CASE WHEN (SELECT COUNT(*) FROM questions q JOIN topics t ON t.id = q.topic_id JOIN question_content_releases r ON r.question_id = q.id WHERE q.id IN (${allIds.map(sql).join(', ')}) AND q.subject_id = '${subjectId}' AND q.subject_id = t.subject_id AND q.exam_type_id = '${examTypeId}' AND q.exam_board_id = '${examBoardId}' AND length(q.explanation) >= 80 AND r.batch_id = '${batchId}' AND r.quality_assurance = 'automated_beta' AND r.release_channel = 'beta' AND r.official_exam_board_content = 0 AND r.feedback_enabled = 1) = ${allIds.length} AND (SELECT COUNT(*) FROM questions q WHERE q.id IN (${allIds.map(sql).join(', ')}) AND q.question_type = 'multiple_choice' AND json_valid(q.options) AND json_array_length(q.options) = 4 AND q.correct_answer IN ('A','B','C','D')) = ${allIds.length} AND (SELECT COUNT(*) FROM question_content_releases WHERE batch_id = '${batchId}') = ${allIds.length} THEN 1 ELSE 0 END;`,
    `DROP TABLE ${guardTable};`,
  ];
  await emitMigration(name, lines);
  migrationNumber += 1;
}

console.log(JSON.stringify({ validation: { valid: validation.valid, warnings: validation.warnings, metrics: validation.metrics }, outBatch, migrations: migrationPaths }, null, 2));
