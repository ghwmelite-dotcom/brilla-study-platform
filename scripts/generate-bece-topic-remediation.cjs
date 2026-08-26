'use strict';

const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const DB = path.join(ROOT, 'database');
const POST_SEED = [
  '../prod-patches/096_seed_topics_for_empty_subjects.sql',
  '100_question_bank_integrity.sql',
  '101_atomic_question_allowance.sql',
  '102_nsmq_question_alignment.sql',
  '103_exact_question_deduplication.sql',
];

const ID_PREFIX_RULES = [
  [/^q_bece_comp_/, 'topic_bece_english_comprehension'],
  [/^q_bece_voc_/, 'topic_bece_english_vocabulary'],
  [/^q_bece_stat_/, 'topic_bece_math_statistics'],
  [/^q_bece_econ_/, 'topic_bece_social_economy'],
];

const RULES = {
  subj_bece_math: [
    rule('topic_bece_math_sets', /\bsets?\b|\bunion\b|\bintersection\b|venn|universal set|subset/),
    rule('topic_bece_math_statistics', /\bmean\b|\bmedian\b|\bmode\b|\brange\b|probabil|pie chart|bar (?:chart|graph)|frequency|data (?:set|table)|\bdie\b|\bdice\b|\bcoin\b/),
    rule('topic_bece_math_mensuration', /\barea\b|\bperimeter\b|\bvolume\b|surface area|circumference|capacity|\b(?:cm|m|km|mm)[²³]\b/),
    rule('topic_bece_math_geometry', /\bangle\b|triangle|quadrilateral|polygon|parallel|perpendicular|symmetr|bearing|compass|protractor|circle|straight line|complete turn/),
    rule('topic_bece_math_equations', /solve (?:for )?[a-z]|\bequations?\b|inequalit|find (?:the value of )?[a-z] if|what is [a-z]\?|[0-9][a-z]\s*[+\-]/),
    rule('topic_bece_math_algebra', /algebra|simplif(?:y|ication).*\b[a-z]\b|factori[sz]e|expand|coefficient|substitut|\b[a-z][²³]\b|like terms|expression/),
    rule('topic_bece_math_ratio', /\bratio\b|proportion|\brate\b|\bspeed\b|share.*(?:ratio|proportion)|direct variation|inverse variation/),
    rule('topic_bece_math_fractions', /\bfraction\b|\bdecimal\b|percent|\bprofit\b|\bloss\b|discount|interest|\bof\b.*\/|\d+\/\d+/),
    rule('topic_bece_math_number', /prime|factor|multiple|hcf|lcm|integer|whole number|place value|square root|cube root|indices|index form|standard form|odd number|even number|\bvalue of \d+[²³]\b|negative number/),
  ],
  subj_bece_english: [
    rule('topic_bece_english_summary', /summar|main points|key points|condense/),
    rule('topic_bece_english_letter', /\bletter\b|salutation|yours faithfully|yours sincerely|sender.?s address|recipient.?s address|dear sir|dear madam|complaint/),
    rule('topic_bece_english_literature', /\bpoem\b|\bstanza\b|\bprotagonist\b|\bmetaphor\b|\bsimile\b|personification|alliteration|figure of speech|\btheme\b|\bplot\b|\bcharacter\b|fairy tale|\bmoral\b|\bfiction\b|\bdrama\b|\bnovel\b|oral literature/),
    rule('topic_bece_english_composition', /\bessay\b|narrative writing|descriptive writing|argumentative writing|expository writing|\bparagraph\b|\bintroduction\b|\bconclusion\b|topic sentence/),
    rule('topic_bece_english_comprehension', /\bpassage\b|main idea|according to|infer|reading comprehension|what did .* (?:first|next)|author.?s purpose/),
    rule('topic_bece_english_vocabulary', /synonym|antonym|opposite of|same meaning|means:|means \"|meaning of|spelled|spelling|word means|dictionary|\bvocabulary\b|idiom/),
    rule('topic_bece_english_grammar', /\bnoun\b|\bverb\b|adjective|adverb|pronoun|preposition|conjunction|tense|plural|singular|comparative|superlative|passive voice|active voice|punctuat|article|subject.verb|sentence|prefix|suffix|syllable|rhymes?|contraction|feminine|masculine|possessive|collective noun|interrogative|exclamatory/),
  ],
  subj_bece_science: [
    rule('topic_bece_science_earth_space', /planet|moon|solar system|atmosphere|ozone|weathering|water cycle|earth.?s (?:core|crust|mantle)|center of the earth|centre of the earth/),
    rule('topic_bece_science_methods', /scientific method|hypothesis|experiment|variable|control|technology|microscope|telescope|internet/),
    rule('topic_bece_science_electricity', /electric|circuit|current|voltage|battery|cell.*terminal|conductor|insulator|magnet|electromagnet|fuse|switch/),
    rule('topic_bece_science_machines', /\bforce\b|\bwork\b|simple machine|\blever\b|\bpulley\b|inclined plane|wheel and axle|\bfriction\b|pressure|mechanical advantage|load and effort/),
    rule('topic_bece_science_energy', /\benergy\b|\bheat\b|\blight\b|\bsound\b|renewable|non-renewable|solar|kinetic|potential|temperature|conduction|convection|radiation/),
    rule('topic_bece_science_matter', /\bmatter\b|solid|liquid|gas|atom|element|compound|mixture|solution|evaporation|condensation|melting|freezing|boiling|separation|acid|base|neutral|chemical|physical change/),
    rule('topic_bece_science_body', /digest|circulat|respirat|reproduct|excret|nervous system|\bheart\b|\blung\b|\bkidney\b|\bblood\b|\borgan\b|\bteeth\b|\btooth\b|fertili[sz]ation|puberty/),
    rule('topic_bece_science_agric', /\bsoil\b|\bcrop\b|\bfarm\b|agric|fertili[sz]er|livestock|poultry|food production|food preservation|irrigation|weed|pest/),
    rule('topic_bece_science_health', /disease|hygiene|sanitation|pollution|environment|ecosystem|habitat|conservation|waste|malaria|hiv|aids|pathogen|infection|balanced diet|nutrition|deficien|health/),
    rule('topic_bece_science_cells', /\bcell\b|living organism|characteristics of living|photosynthesis|chlorophyll|plant.*animal|classification|microorganism|growth|germination/),
  ],
  subj_bece_social: [
    rule('topic_bece_social_peace', /\bconflict\b|peace|mediat|arbitrat|security|war|dispute|crime prevention/),
    rule('topic_bece_social_population', /\bpopulation\b|migration|settlement|rural.urban|birth rate|death rate|census|urbanisation|urbanization/),
    rule('topic_bece_social_economy', /\beconom|money|bank|saving|trade|export|import|production|consumer|manufactur|industry|tourism|employment|inflation|entrepreneur|currency|cash crop|cocoa/),
    rule('topic_bece_social_environment', /environment|resource|deforestation|erosion|pollution|climate|weather|river|lake|mountain|coast|season|latitude|longitude|map|scale|region|location|gulf|ocean|vegetation/),
    rule('topic_bece_social_citizenship', /\bcitizen|citizenship|human rights|right of a child|responsibilit|patriot|national anthem|national pledge|independence day|coat of arms|national flag/),
    rule('topic_bece_social_governance', /government|president|parliament|legislature|executive|judiciary|constitution|democra|election|electoral|chraj|rule of law|leadership|district assembly|ecowas|united nations/),
    rule('topic_bece_social_family', /\bfamily\b|sociali[sz]ation|parent|marriage|adolescen|gender equality|self-confidence|peer pressure/),
    rule('topic_bece_social_culture', /\bculture\b|festival|tradition|identity|ethnic|kente|adinkra|before independence|gold coast|capital of ghana|capital city|black star|national symbol|ghana gained independence|founder of ghana/),
  ],
  subj_bece_bdt: [
    rule('topic_bece_bdt_electricals', /electric|circuit|wiring|fuse|voltage|current|resistor|solder/),
    rule('topic_bece_bdt_construction', /building|foundation|structure|brick|blockwork|concrete|roof|wall|construction/),
    rule('topic_bece_bdt_entrepreneurship', /entrepreneur|business|market|profit|customer|pricing|enterprise/),
    rule('topic_bece_bdt_food', /food|nutrient|vitamin|protein|carbohydrate|balanced diet|kwashiorkor|cooking|thaw|preserv|contamination|kitchen/),
    rule('topic_bece_bdt_clothing', /fabric|fibre|fiber|cotton|wool|silk|sew|stitch|seam|textile|garment|hemming|thimble|selvage|iron.*delicate/),
    rule('topic_bece_bdt_design', /design|drawing|colour|color|primary colors|secondary colors|tint|shade|sculpture|weaving|mosaic|texture|balance|calabash|appliqu|batik|tie and dye|printmaking|adinkra|compass.*(?:circle|arc)|art/),
    rule('topic_bece_bdt_materials', /wood|metal|tool|hammer|saw|screwdriver|plywood|alloy|brass|rust|caliper|joint|seasoning|sandpaper|punch|weld|hacksaw/),
  ],
  subj_bece_ict: [
    rule('topic_bece_ict_ethics', /virus|antivirus|password|cyber|copyright|piracy|eye strain|phishing|social media|privacy|malware|hacking|ergonomic|safety/),
    rule('topic_bece_ict_internet', /internet|world wide web|\bwww\b|email|web browser|chrome|search engine|\burl\b|\bhttp\b|\bisp\b|wi-fi|wifi|network/),
    rule('topic_bece_ict_spreadsheets', /spreadsheet|excel|cell reference|formula|worksheet|workbook|chart|row and column/),
    rule('topic_bece_ict_word', /microsoft word|word processing|powerpoint|presentation|document|font|bold|italic|underline|save.*ctrl|ctrl \+ [spcvx]|slide/),
    rule('topic_bece_ict_files', /file management|\bfile\b|\bfolder\b|extension|storage device|save as|recycle bin/),
    rule('topic_bece_ict_hardware', /hardware|software|operating system|input device|output device|storage|keyboard|mouse|monitor|printer|scanner|cpu|ram|rom|processor|motherboard|device/),
    rule('topic_bece_ict_intro', /computer is|types? of computer|generation of computer|uses? of computer|data.*information|information.*data/),
  ],
  subj_bece_french: [
    rule('topic_bece_french_vocabulary', /colour|color|adjective|description|means|how do you say|french word|vocabulary/),
    rule('topic_bece_french_greetings', /greeting|introduc|bonjour|bonsoir|salut|merci|s.?appelle|comment allez|au revoir|polite/),
    rule('topic_bece_french_numbers', /number|date|time|heure|jour|mois|semaine|année|today|tomorrow|yesterday|monday|mardi|janvier|combien.*(?:ans|heure)/),
    rule('topic_bece_french_family', /family|father|mother|brother|sister|parent|ami|amie|père|mère|frère|sœur|oncle|tante|cousin/),
    rule('topic_bece_french_school', /school|classroom|teacher|student|subject|timetable|école|classe|professeur|élève|livre|cahier|stylo/),
    rule('topic_bece_french_food', /food|drink|meal|restaurant|eat|boire|manger|pain|riz|eau|lait|poulet|petit déjeuner|déjeuner|dîner/),
    rule('topic_bece_french_places', /place|shopping|direction|town|market|shop|where is|où est|à gauche|à droite|devant|derrière|marché|magasin|ville|village|acheter|prix/),
    rule('topic_bece_french_routine', /daily|routine|verb|present tense|aller|avoir|être|faire|lever|coucher|matin|soir|conjugat|je .*e$|nous .*ons/),
  ],
  subj_bece_rme: [
    rule('topic_bece_rme_festivals', /festival|christmas|easter|eid|odwira|homowo|hogbetsotso|ramadan/),
    rule('topic_bece_rme_rites', /rite|naming ceremony|puberty|marriage|funeral|courtship|outdooring/),
    rule('topic_bece_rme_leaders', /religious leader|founder|jesus|muhammad|prophet|abraham|moses|buddha|imam|priest|pastor/),
    rule('topic_bece_rme_god', /\bgod\b|creation|creator|attribute|omnipotent|omniscient|monothe|ancestor/),
    rule('topic_bece_rme_worship', /worship|prayer|pray|zakat|fasting|pilgrimage|bible|qur.?an|scripture/),
    rule('topic_bece_rme_community', /family|friend|parent|teacher|elderly|community|citizen|national unity|human rights|parenting|relationship|peaceful coexistence/),
    rule('topic_bece_rme_morals', /honest|humility|tolerance|integrity|contentment|kindness|forgive|fairness|respect|obedien|hard work|gambling|cyberbullying|money should|abstinence|hiv|aids|patriotism|moral|virtue/),
  ],
};

const T = {
  bdt: { materials: 'topic_bece_bdt_materials', food: 'topic_bece_bdt_food', clothing: 'topic_bece_bdt_clothing', design: 'topic_bece_bdt_design' },
  english: { grammar: 'topic_bece_english_grammar', vocabulary: 'topic_bece_english_vocabulary', comprehension: 'topic_bece_english_comprehension', letter: 'topic_bece_english_letter', composition: 'topic_bece_english_composition', summary: 'topic_bece_english_summary', literature: 'topic_bece_english_literature' },
  french: { greetings: 'topic_bece_french_greetings', numbers: 'topic_bece_french_numbers', family: 'topic_bece_french_family', school: 'topic_bece_french_school', food: 'topic_bece_french_food', routine: 'topic_bece_french_routine', places: 'topic_bece_french_places', vocabulary: 'topic_bece_french_vocabulary' },
  ict: { intro: 'topic_bece_ict_intro', hardware: 'topic_bece_ict_hardware', word: 'topic_bece_ict_word', spreadsheets: 'topic_bece_ict_spreadsheets', internet: 'topic_bece_ict_internet', files: 'topic_bece_ict_files', ethics: 'topic_bece_ict_ethics' },
  math: { number: 'topic_bece_math_number', fractions: 'topic_bece_math_fractions', ratio: 'topic_bece_math_ratio', algebra: 'topic_bece_math_algebra', equations: 'topic_bece_math_equations', sets: 'topic_bece_math_sets', geometry: 'topic_bece_math_geometry', mensuration: 'topic_bece_math_mensuration', statistics: 'topic_bece_math_statistics' },
  rme: { god: 'topic_bece_rme_god', worship: 'topic_bece_rme_worship', festivals: 'topic_bece_rme_festivals', rites: 'topic_bece_rme_rites', morals: 'topic_bece_rme_morals', leaders: 'topic_bece_rme_leaders', community: 'topic_bece_rme_community' },
  science: { cells: 'topic_bece_science_cells', body: 'topic_bece_science_body', matter: 'topic_bece_science_matter', energy: 'topic_bece_science_energy', electricity: 'topic_bece_science_electricity', machines: 'topic_bece_science_machines', agriculture: 'topic_bece_science_agric', health: 'topic_bece_science_health', methods: 'topic_bece_science_methods', earth: 'topic_bece_science_earth_space' },
  social: { family: 'topic_bece_social_family', culture: 'topic_bece_social_culture', governance: 'topic_bece_social_governance', citizenship: 'topic_bece_social_citizenship', population: 'topic_bece_social_population', environment: 'topic_bece_social_environment', economy: 'topic_bece_social_economy', peace: 'topic_bece_social_peace' },
};

const MANUAL_OVERRIDES = {
  q_bece_eng_2023_020: T.english.vocabulary,
  q_bece_eng_2023_023: T.english.grammar,
  q_bece_eng_2023_026: T.english.vocabulary,
  q_bece_eng_2023_028: T.english.vocabulary,
  q_bece_eng_2023_032: T.english.vocabulary,
  q_bece_eng_2023_038: T.english.vocabulary,
  q_bece_eng_2023_26: T.english.comprehension,
  q_bece_eng_2023_31: T.english.comprehension,
  q_bece_eng_2023_33: T.english.literature,
  q_bece_eng_2024_009: T.english.grammar,
  q_bece_eng_2024_031: T.english.grammar,
  q_bece_eng_2024_033: T.english.vocabulary,
  q_bece_eng_2024_040: T.english.vocabulary,
  q_bece_eng_2024_27: T.english.vocabulary,
  q_bece_comp_003: T.english.summary,
  q_bece_eng_2024_28: T.english.literature,
  q_bece_eng_2024_31: T.english.literature,
  q_bece_essay_005: T.english.composition,
  q_bece_french_2024_031: T.french.school,
  q_bece_french_2024_035: T.french.food,
  q_bece_french_2024_036: T.french.vocabulary,
  q_bece_french_2024_037: T.french.vocabulary,
  q_bece_french_2024_038: T.french.vocabulary,
  q_bece_french_2024_039: T.french.vocabulary,
};

function assignOverrides(topicId, ids) {
  for (const id of ids) {
    const existing = MANUAL_OVERRIDES[id];
    if (existing && existing !== topicId) {
      throw new Error(`Conflicting manual override for ${id}: ${existing} vs ${topicId}`);
    }
    MANUAL_OVERRIDES[id] = topicId;
  }
}

assignOverrides(T.french.food, ['q_bece_french_2024_033']);
assignOverrides(T.ict.hardware, ['q_bece_ict_2023_006']);
assignOverrides(T.ict.files, ['q_bece_ict_2024_019']);
assignOverrides(T.ict.word, ['q_bece_ict_2023_016', 'q_bece_ict_2024_016']);

assignOverrides(T.math.number, [
  'q_bece_math_2023_001', 'q_bece_math_2023_009', 'q_bece_math_2023_016', 'q_bece_math_2023_019', 'q_bece_math_2023_021', 'q_bece_math_2023_028',
  'q_bece_math_2023_03', 'q_bece_math_2023_06', 'q_bece_math_2023_09',
  'q_bece_math_2024_001', 'q_bece_math_2024_010', 'q_bece_math_2024_014', 'q_bece_math_2024_018', 'q_bece_math_2024_025',
  'q_bece_math_2024_05', 'q_bece_math_2024_06', 'q_bece_math_2024_10', 'q_bece_num_003',
]);
assignOverrides(T.math.fractions, ['q_bece_math_2023_002', 'q_bece_num_004']);
assignOverrides(T.math.ratio, ['q_bece_math_2024_024']);
assignOverrides(T.math.algebra, [
  'q_bece_alg_005', 'q_bece_math_2023_018', 'q_bece_math_2023_15', 'q_bece_math_2023_16', 'q_bece_math_2023_18', 'q_bece_math_2023_19',
  'q_bece_math_2024_012', 'q_bece_math_2024_017', 'q_bece_math_2024_033', 'q_bece_math_2024_037', 'q_bece_math_2024_040', 'q_bece_math_2024_09', 'q_bece_math_2024_12', 'q_bece_math_2024_17',
]);
assignOverrides(T.math.equations, [
  'q_bece_alg_004', 'q_bece_math_2023_011', 'q_bece_math_2023_11', 'q_bece_math_2023_14', 'q_bece_math_2023_20',
  'q_bece_math_2024_015', 'q_bece_math_2024_028', 'q_bece_math_2024_15',
]);
assignOverrides(T.math.geometry, [
  'q_bece_math_2023_015', 'q_bece_math_2023_040', 'q_bece_math_2023_25', 'q_bece_math_2023_26',
  'q_bece_math_2024_031', 'q_bece_math_2024_27', 'q_bece_math_2024_29',
]);
assignOverrides(T.math.mensuration, [
  'q_bece_geo_004', 'q_bece_math_2023_008', 'q_bece_math_2023_017', 'q_bece_math_2023_032', 'q_bece_math_2023_24', 'q_bece_math_2023_27', 'q_bece_math_2024_009', 'q_bece_math_2024_023',
  'q_bece_math_2024_24', 'q_bece_math_2024_28', 'q_bece_math_2024_30',
]);
assignOverrides(T.math.statistics, ['q_bece_math_2023_039']);

assignOverrides(T.rme.god, ['q_rme_2024_002']);
assignOverrides(T.rme.rites, ['q_rme_2023_007']);
assignOverrides(T.rme.morals, [
  'q_rme_2023_028', 'q_rme_2023_033', 'q_rme_2023_038', 'q_rme_2024_030', 'q_rme_2024_032', 'q_rme_2024_033',
]);
assignOverrides(T.rme.community, [
  'q_rme_2023_022', 'q_rme_2023_024', 'q_rme_2023_025', 'q_rme_2023_026', 'q_rme_2023_032', 'q_rme_2023_034', 'q_rme_2023_039',
  'q_rme_2024_027', 'q_rme_2024_028', 'q_rme_2024_034', 'q_rme_2024_039',
]);

assignOverrides(T.science.cells, [
  'q_bece_liv_004', 'q_bece_liv_005', 'q_bece_sci_2023_001', 'q_bece_sci_2023_009', 'q_bece_sci_2023_011', 'q_bece_sci_2023_016', 'q_bece_sci_2023_018', 'q_bece_sci_2023_02', 'q_bece_sci_2023_024', 'q_bece_sci_2023_025', 'q_bece_sci_2023_030', 'q_bece_sci_2023_033',
  'q_bece_sci_2023_10', 'q_bece_sci_2023_18', 'q_bece_sci_2023_26', 'q_bece_sci_2024_009', 'q_bece_sci_2024_015', 'q_bece_sci_2024_025', 'q_bece_sci_2024_03', 'q_bece_sci_2024_035', 'q_bece_sci_2024_06', 'q_bece_sci_2024_09', 'q_bece_sci_2024_10',
]);
assignOverrides(T.science.body, [
  'q_bece_sci_2023_039', 'q_bece_sci_2023_08', 'q_bece_sci_2023_25',
  'q_bece_sci_2024_018', 'q_bece_sci_2024_021', 'q_bece_sci_2024_029', 'q_bece_sci_2024_039',
]);
assignOverrides(T.science.matter, [
  'q_bece_sci_2023_005', 'q_bece_sci_2023_010', 'q_bece_sci_2023_020', 'q_bece_sci_2023_13', 'q_bece_sci_2023_21',
  'q_bece_sci_2024_002', 'q_bece_sci_2024_030', 'q_bece_sci_2024_033',
]);
assignOverrides(T.science.energy, ['q_bece_sci_2023_014', 'q_bece_sci_2023_31', 'q_bece_sci_2023_37']);
assignOverrides(T.science.electricity, ['q_bece_sci_2023_17', 'q_bece_sci_2023_19', 'q_bece_sci_2024_40']);
assignOverrides(T.science.machines, ['q_bece_sci_2023_023', 'q_bece_sci_2023_16', 'q_bece_sci_2023_33', 'q_bece_sci_2024_13', 'q_bece_sci_2024_15', 'q_bece_sci_2024_20']);
assignOverrides(T.science.health, [
  'q_bece_sci_2023_09', 'q_bece_sci_2023_40',
  'q_bece_sci_2024_034', 'q_bece_sci_2024_23', 'q_bece_sci_2024_24', 'q_bece_sci_2024_26', 'q_bece_sci_2024_28', 'q_bece_sci_2024_29',
]);
assignOverrides(T.science.earth, [
  'q_bece_sci_2023_015', 'q_bece_sci_2023_034', 'q_bece_sci_2023_037', 'q_bece_sci_2023_28', 'q_bece_sci_2023_39',
  'q_bece_sci_2024_031', 'q_bece_sci_2024_040', 'q_bece_sci_2024_21',
]);
assignOverrides(T.science.methods, [
  'q_bece_sci_2023_32', 'q_bece_sci_2024_31', 'q_bece_sci_2024_33', 'q_bece_sci_2024_34', 'q_bece_sci_2024_37', 'q_bece_sci_2024_39',
  'q_bece_tech_001', 'q_bece_tech_002', 'q_bece_tech_003', 'q_bece_tech_004',
]);
assignOverrides(T.social.environment, [
  'q_bece_geog_003', 'q_bece_geog_004', 'q_bece_gha_005', 'q_bece_soc_2023_001', 'q_bece_soc_2023_014', 'q_bece_soc_2023_030', 'q_bece_soc_2023_036',
  'q_bece_soc_2024_027', 'q_bece_soc_2024_028', 'q_bece_soc_2024_04', 'q_bece_soc_2024_06', 'q_bece_soc_2024_31', 'q_bece_soc_2024_33', 'q_bece_soc_2024_38',
]);
assignOverrides(T.social.culture, [
  'q_bece_soc_2024_039', 'q_bece_soc_2023_004', 'q_bece_soc_2023_008', 'q_bece_soc_2023_02', 'q_bece_soc_2023_03', 'q_bece_soc_2023_039',
  'q_bece_soc_2023_04', 'q_bece_soc_2023_06', 'q_bece_soc_2023_07', 'q_bece_soc_2023_08', 'q_bece_soc_2023_09',
  'q_bece_soc_2024_02', 'q_bece_soc_2024_08',
]);
assignOverrides(T.social.economy, ['q_bece_soc_2023_012', 'q_bece_soc_2023_022', 'q_bece_soc_2024_10', 'q_bece_soc_2024_40']);
assignOverrides(T.social.governance, ['q_bece_soc_2023_013', 'q_bece_soc_2023_14', 'q_bece_soc_2024_07']);
assignOverrides(T.social.citizenship, ['q_bece_civ_003', 'q_bece_soc_2023_024', 'q_bece_soc_2023_037', 'q_bece_soc_2023_15', 'q_bece_soc_2023_19', 'q_bece_soc_2024_13', 'q_bece_soc_2024_018']);
assignOverrides(T.social.peace, ['q_bece_soc_2023_019', 'q_bece_soc_2023_038', 'q_bece_soc_2023_040', 'q_bece_soc_2023_20', 'q_bece_soc_2024_011', 'q_bece_soc_2024_019']);
assignOverrides(T.social.family, ['q_bece_soc_2024_013', 'q_bece_soc_2024_017', 'q_bece_soc_2024_034']);
assignOverrides(T.social.population, ['q_bece_soc_2023_35']);
function numericSuffix(question) {
  const match = question.id.match(/_(\d+)$/);
  return match ? { number: Number(match[1]), width: match[1].length } : {};
}

function allowedTopics(question) {
  const { number, width } = numericSuffix(question);
  if (question.subject_id === 'subj_bece_bdt' && width === 3) {
    if (number <= 15) return [T.bdt.materials];
    if (number <= 23) return [T.bdt.food];
    if (number <= 30) return [T.bdt.clothing];
    return [T.bdt.design];
  }
  if (question.subject_id === 'subj_bece_ict' && width === 3) {
    if (number <= 10) return [T.ict.intro, T.ict.hardware];
    if (number <= 20) return [T.ict.hardware, T.ict.word, T.ict.spreadsheets, T.ict.files];
    if (number <= 30) return [T.ict.internet];
    return [T.ict.ethics];
  }
  if (question.subject_id === 'subj_bece_french' && width === 3) {
    if (question.id.includes('_2024_')) {
      if (number <= 10) return [T.french.greetings];
      if (number <= 18) return [T.french.numbers];
      if (number <= 25) return [T.french.family];
      if (number <= 32) return [T.french.school, T.french.routine];
      return [T.french.food, T.french.vocabulary];
    }
    if (number <= 10) return [T.french.vocabulary];
    if (number <= 18) return [T.french.numbers];
    if (number <= 26) return [T.french.places];
    if (number <= 34) return [T.french.routine];
    return [T.french.vocabulary];
  }
  if (question.subject_id === 'subj_bece_rme' && width === 3) {
    if (number <= 10) return [T.rme.god, T.rme.worship, T.rme.festivals, T.rme.leaders, T.rme.rites];
    if (number <= 20) return [T.rme.morals];
    if (number <= 30) return [T.rme.community, T.rme.morals, T.rme.rites];
    return [T.rme.morals, T.rme.community];
  }
  if (question.subject_id === 'subj_bece_math' && width === 2) {
    if (number <= 10) return [T.math.number, T.math.fractions];
    if (number <= 20) return [T.math.algebra, T.math.equations];
    if (number <= 30) return [T.math.geometry, T.math.mensuration];
    return [T.math.statistics];
  }
  if (question.subject_id === 'subj_bece_english' && width === 2) {
    if (number <= 15) return [T.english.grammar];
    if (number <= 25) return [T.english.vocabulary];
    if (number <= 35) return [T.english.comprehension, T.english.letter, T.english.composition, T.english.summary, T.english.literature];
    return [T.english.composition, T.english.letter];
  }
  if (question.subject_id === 'subj_bece_science' && width === 2) {
    if (number <= 10) return [T.science.cells, T.science.body];
    if (number <= 20) return [T.science.matter, T.science.energy];
    if (number <= 30) return [T.science.health, T.science.agriculture, T.science.earth];
    return [T.science.energy, T.science.electricity, T.science.machines, T.science.earth];
  }
  if (question.subject_id === 'subj_bece_social' && width === 2) {
    if (number <= 10) return [T.social.culture, T.social.family];
    if (number <= 20) return [T.social.governance, T.social.citizenship, T.social.peace];
    if (number <= 30) return [T.social.economy];
    return [T.social.environment, T.social.population];
  }
  if (/^q_bece_comp_/.test(question.id)) return [T.english.comprehension];
  if (/^q_bece_voc_/.test(question.id)) return [T.english.vocabulary];
  if (/^q_bece_stat_/.test(question.id)) return [T.math.statistics];
  if (/^q_bece_alg_/.test(question.id)) return [T.math.algebra, T.math.equations, T.math.sets];
  if (/^q_bece_num_/.test(question.id)) return [T.math.number, T.math.fractions, T.math.ratio];
  if (/^q_bece_env_/.test(question.id)) return [T.science.health];
  if (/^q_bece_tech_/.test(question.id)) return [T.science.energy, T.science.electricity, T.science.machines];
  if (/^q_bece_econ_/.test(question.id)) return [T.social.economy];
  if (/^q_bece_civ_/.test(question.id)) return [T.social.governance, T.social.citizenship, T.social.peace];
  if (/^q_bece_geog_/.test(question.id)) return [T.social.environment, T.social.population];
  if (/^q_bece_gha_/.test(question.id)) return [T.social.culture, T.social.governance, T.social.citizenship];
  return (RULES[question.subject_id] ?? []).map(({ topicId }) => topicId);
}

function matchingTopics(question, blob, allowed) {
  return (RULES[question.subject_id] ?? [])
    .filter(({ topicId, patterns }) => allowed.includes(topicId) && patterns.some((pattern) => new RegExp(pattern.source, pattern.flags).test(blob)))
    .map(({ topicId }) => topicId);
}

function correctOptionText(question) {
  try {
    const options = JSON.parse(question.options ?? '[]');
    const index = 'ABCD'.indexOf(String(question.correct_answer ?? '').trim().charAt(0).toUpperCase());
    return index >= 0 ? String(options[index] ?? '').replace(/^[A-D]\.\s*/, '') : String(question.correct_answer ?? '');
  } catch {
    return String(question.correct_answer ?? '');
  }
}
function rule(topicId, ...patterns) {
  return { topicId, patterns };
}

function loadDb() {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec(fs.readFileSync(path.join(DB, 'schema.sql'), 'utf8'));
  db.exec(fs.readFileSync(path.join(DB, 'seed.sql'), 'utf8'));
  for (const migration of POST_SEED) {
    db.exec(fs.readFileSync(path.join(DB, 'migrations', migration), 'utf8'));
  }
  return db;
}

function classify(question) {
  const manualTopicId = MANUAL_OVERRIDES[question.id];
  if (manualTopicId) return { status: 'mapped', topicId: manualTopicId, source: 'manual-override', candidates: [{ topicId: manualTopicId, score: 1 }] };
  const allowed = allowedTopics(question);
  if (allowed.length === 1) return { status: 'mapped', topicId: allowed[0], source: 'source-range', candidates: [{ topicId: allowed[0], score: 1 }] };

  const stages = [
    ['question-text', question.question_text],
    ['explanation', `${question.question_text}\n${question.explanation ?? ''}`],
    ['correct-option', correctOptionText(question)],
  ];
  const evidence = {};
  for (const [source, text] of stages) {
    const candidates = [...new Set(matchingTopics(question, text.toLowerCase(), allowed))];
    evidence[source] = candidates;
    if (candidates.length === 1) return { status: 'mapped', topicId: candidates[0], source, candidates: [{ topicId: candidates[0], score: 1 }] };
  }
  const ambiguous = Object.values(evidence).some((candidates) => candidates.length > 1);
  return { status: ambiguous ? 'ambiguous' : 'unmatched', candidates: [], allowed, evidence };
}
function collectMappings(subjectFilter = null) {
  const db = loadDb();
  try {
    const questions = db.prepare(`
      SELECT q.id, q.topic_id, q.subject_id, q.question_text, q.options, q.correct_answer, q.explanation
      FROM questions q
      JOIN subjects s ON s.id = q.subject_id
      WHERE s.exam_type_id = 'exam_bece' AND q.topic_id IS NULL
      ORDER BY q.subject_id, q.id
    `).all().filter((question) => !subjectFilter || question.subject_id === subjectFilter);
    const mapped = [];
    const unresolved = [];
    for (const question of questions) {
      const result = classify(question);
      if (result.status === 'mapped') mapped.push({ ...question, ...result });
      else unresolved.push({ ...question, ...result });
    }
    return { questions, mapped, unresolved };
  } finally {
    db.close();
  }
}

function buildReport(subjectFilter = null, showAll = false) {
  const { questions, mapped, unresolved } = collectMappings(subjectFilter);
  const bySubject = {};
  for (const question of questions) {
    const bucket = bySubject[question.subject_id] ??= { total: 0, mapped: 0, unresolved: 0, topics: {} };
    bucket.total++;
  }
  for (const row of mapped) {
    const bucket = bySubject[row.subject_id];
    bucket.mapped++;
    bucket.topics[row.topicId] = (bucket.topics[row.topicId] ?? 0) + 1;
  }
  for (const row of unresolved) bySubject[row.subject_id].unresolved++;

  return {
    total: questions.length,
    mapped: mapped.length,
    unresolved: unresolved.length,
    bySubject,
    unresolvedQuestions: unresolved.map((row) => ({
      id: row.id,
      subjectId: row.subject_id,
      status: row.status,
      questionText: row.question_text,
      candidates: row.candidates.slice(0, 4),
    })),
    mappedQuestions: showAll ? mapped.map((row) => ({
      id: row.id,
      subjectId: row.subject_id,
      source: row.source,
      topicId: row.topicId,
      questionText: row.question_text,
      candidates: row.candidates.slice(0, 4),
    })) : undefined,
  };
}

function main() {
  const args = process.argv.slice(2);
  const subjectArg = args.indexOf('--subject');
  const subjectFilter = subjectArg >= 0 ? args[subjectArg + 1] : null;
  console.log(JSON.stringify(buildReport(subjectFilter, args.includes('--all')), null, 2));
}

if (require.main === module) main();

module.exports = { ROOT, DB, T, buildReport, classify, collectMappings, loadDb };