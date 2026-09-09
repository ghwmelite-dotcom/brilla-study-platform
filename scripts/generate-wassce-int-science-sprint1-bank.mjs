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
const batchId = 'wassce-int-science-sprint1-001';
const contentLabel = 'Original BrillaPrep curriculum-aligned WASSCE Integrated Science practice; not official WAEC examination material.';
const releaseSourceUrl = 'https://nacca.gov.gh/secondary-education-curriculum/';

const iscSource = (title) => ({
  publisher: 'National Council for Curriculum and Assessment, Ghana',
  title,
  url: releaseSourceUrl,
  use: 'curriculum_blueprint_only',
});

const subjectSource = iscSource('Secondary Education Curriculum — Integrated Science');

// Prod-canonical topic rows for subj_wassce_int_science, verified against the
// live production database on 2026-09-09 (SELECT id, name FROM topics WHERE
// subject_id = 'subj_wassce_int_science'). Questions may bind ONLY these ids.
// The intsci rows are seeded by prod-patch 096 and the p2 rows by migration
// 365, so both families exist on prod and on the fresh baseline; the
// foundation migration re-inserts them with INSERT OR IGNORE for safety.
const canonicalTopicRows = [
  // [code, id, name, description, displayOrder]
  ['WASSCE-ISC-ECO', 'topic_wassce_p2_sci_eco', 'Ecosystems', 'Describe ecosystem components and construct food chains that show energy flow between organisms.', 1],
  ['WASSCE-ISC-MAT', 'topic_wassce_p2_sci_mat', 'Matter and mixtures', 'Select and justify physical separation techniques for the components of common mixtures.', 2],
  ['WASSCE-ISC-ENR', 'topic_wassce_p2_sci_enr', 'Electricity and energy', 'Analyse simple series circuits, relating current, resistance and lamp brightness quantitatively.', 3],
  ['WASSCE-ISC-BIO', 'topic_wassce_p2_sci_bio', 'Human digestion', 'Explain the stages of human digestion, naming the enzymes and organs responsible at each stage.', 4],
  ['WASSCE-ISC-HLT', 'topic_wassce_p2_sci_hlt', 'Disease and health', 'Explain the transmission, symptoms and prevention of common communicable diseases in Ghana.', 6],
  ['WASSCE-ISC-REP', 'topic_wassce_intsci_reproduction', 'Reproduction and Heredity', 'Reproduction in plants and animals, growth and basic genetics', 3],
];

const SUBJECT_ID = 'subj_wassce_int_science';

// Content gap cells targeted (artifacts/content-coverage-latest.json,
// 2026-09-09): the p2 topics had 0 easy and 0 medium MCQs each, reproduction
// had 0 medium MCQs and 0 hard, and the calculation/short-answer cell was
// empty for electricity/energy. Counts below fill those cells to
// the matrix quota (4 easy + 4 medium MCQ, 4 medium + 2 hard MCQ, 2 calc).
const expectedCounts = {
  'WASSCE-ISC-ECO': { mcq: 8, calc: 0 },
  'WASSCE-ISC-MAT': { mcq: 8, calc: 0 },
  'WASSCE-ISC-ENR': { mcq: 8, calc: 2 },
  'WASSCE-ISC-BIO': { mcq: 8, calc: 0 },
  'WASSCE-ISC-HLT': { mcq: 8, calc: 0 },
  'WASSCE-ISC-REP': { mcq: 6, calc: 0 },
};

// position = index (0-3) where the correct option lands, so correct-answer
// letters vary across the batch instead of clustering on A/B.
const mcq = (topicCode, difficulty, prompt, correct, wrong, solution, position, commandWord = 'Identify', assessmentObjective = 'AO2') => ({
  kind: 'mcq', topicCode, difficulty, prompt, correct, wrong, solution, position, commandWord, assessmentObjective,
});
const calc = (topicCode, difficulty, prompt, answer, solution) => ({
  kind: 'calc', topicCode, difficulty, prompt, answer, solution, commandWord: 'Calculate', assessmentObjective: 'AO2',
});

const sources = [
  // --- Ecosystems (topic_wassce_p2_sci_eco) --------------------------------
  mcq('WASSCE-ISC-ECO', 'easy', 'Which of the following is an abiotic component of a pond ecosystem?',
    'Sunlight', ['Algae', 'Tadpoles', 'Pond snails'],
    'Abiotic factors are the non-living parts of an ecosystem, such as sunlight, water and temperature. Algae, tadpoles and pond snails are all living (biotic) components of the pond.',
    2, 'Identify', 'AO1'),
  mcq('WASSCE-ISC-ECO', 'easy', 'In a food chain, the organisms that make their own food by photosynthesis are called:',
    'Producers', ['Herbivores', 'Decomposers', 'Secondary consumers'],
    'Producers (green plants and algae) make their own food by photosynthesis. Herbivores and secondary consumers eat other organisms, and decomposers feed on dead organic matter.',
    0, 'Identify', 'AO1'),
  mcq('WASSCE-ISC-ECO', 'easy', 'The place where an organism lives and obtains its food and shelter is its:',
    'Habitat', ['Niche', 'Population', 'Biome'],
    'A habitat is the physical place where an organism lives and finds food and shelter. A niche is the organism’s role in the ecosystem, and a population is a group of one species.',
    3, 'Identify', 'AO1'),
  mcq('WASSCE-ISC-ECO', 'easy', 'Which group of organisms breaks down dead plants and animals, returning nutrients to the soil?',
    'Decomposers', ['Producers', 'Primary consumers', 'Predators'],
    'Decomposers (bacteria and fungi) break down dead organisms, releasing nutrients such as nitrates into the soil for producers to use. Predators and primary consumers do not recycle nutrients.',
    1, 'Identify', 'AO1'),
  mcq('WASSCE-ISC-ECO', 'medium', 'Consider the food chain: maize → grasshopper → lizard → hawk. The secondary consumer in this chain is the:',
    'Lizard', ['Maize', 'Grasshopper', 'Hawk'],
    'Maize is the producer, the grasshopper eating it is the primary consumer, the lizard eating the grasshopper is the secondary consumer, and the hawk is the tertiary consumer.',
    2, 'Identify', 'AO2'),
  mcq('WASSCE-ISC-ECO', 'medium', 'In an energy pyramid for a savanna ecosystem, the greatest amount of energy is found at the level of the:',
    'Producers', ['Top carnivores', 'Primary consumers', 'Secondary consumers'],
    'Only about 10% of the energy passes from one trophic level to the next; the rest is lost as heat. Producers trap all the incoming solar energy, so they hold the greatest amount.',
    0, 'Identify', 'AO2'),
  mcq('WASSCE-ISC-ECO', 'medium', 'A grassland ecosystem traps 50 000 kJ of energy at the producer level. If only about 10% of the energy is transferred to the next trophic level, the energy reaching the primary consumers is approximately:',
    '5 000 kJ', ['500 kJ', '50 kJ', '45 000 kJ'],
    'Energy transferred = 10% of 50 000 kJ = 0.1 × 50 000 = 5 000 kJ. The other 45 000 kJ is lost through respiration, heat, uneaten material and waste.',
    3, 'Calculate', 'AO2'),
  mcq('WASSCE-ISC-ECO', 'medium', 'Natural food chains rarely have more than four or five trophic levels mainly because:',
    'Most of the energy is lost at each transfer, leaving too little for higher levels',
    ['Top carnivores are always hunted by humans', 'Producers stop growing after a certain height', 'Decomposers attack organisms at higher trophic levels'],
    'About 90% of the energy is lost as heat, in respiration and in waste at each level, so after four or five transfers too little energy remains to support a viable population at another level.',
    1, 'Explain', 'AO2'),

  // --- Matter and mixtures (topic_wassce_p2_sci_mat) ------------------------
  mcq('WASSCE-ISC-MAT', 'easy', 'The best method for obtaining solid salt from seawater is:',
    'Evaporation', ['Filtration', 'Use of a magnet', 'Decantation'],
    'Salt is dissolved in seawater, so it passes through filter paper with the water. Evaporation removes the water and leaves solid salt; magnets and decantation cannot separate dissolved solids.',
    1, 'Identify', 'AO1'),
  mcq('WASSCE-ISC-MAT', 'easy', 'Filtration is the method used to separate:',
    'An insoluble solid from a liquid', ['Two miscible liquids', 'Dissolved salt from water', 'A mixture of two gases'],
    'The pores of filter paper let the liquid and dissolved particles through but trap insoluble solid particles as the residue. Miscible liquids need distillation and dissolved salts need evaporation.',
    3, 'Identify', 'AO1'),
  mcq('WASSCE-ISC-MAT', 'easy', 'Which of the following is a mixture?',
    'Air', ['Distilled water', 'Gold', 'Oxygen gas'],
    'Air is a physical mixture of nitrogen, oxygen, carbon dioxide and other gases. Distilled water is a pure compound, while gold and oxygen gas are pure elements.',
    0, 'Identify', 'AO1'),
  mcq('WASSCE-ISC-MAT', 'easy', 'A magnet would be most useful for separating a mixture of:',
    'Iron filings and sand', ['Salt and sand', 'Ethanol and water', 'Oil and water'],
    'Iron is magnetic and sand is not, so a magnet pulls out the filings. Salt and sand need dissolving and filtering; ethanol and water need distillation; oil and water need a separating funnel.',
    2, 'Identify', 'AO1'),
  mcq('WASSCE-ISC-MAT', 'medium', 'The different coloured dyes in a sample of black ink can best be separated and identified by:',
    'Paper chromatography', ['Simple distillation', 'Sieving', 'Crystallisation'],
    'In paper chromatography the dyes dissolve in the solvent and travel up the paper at different rates, separating into distinct spots. Distillation, sieving and crystallisation cannot separate dissolved dyes.',
    3, 'Identify', 'AO2'),
  mcq('WASSCE-ISC-MAT', 'medium', 'Ethanol (boiling point 78 °C) and water (boiling point 100 °C) mix completely with each other. The most suitable method for separating the two liquids is:',
    'Fractional distillation', ['Filtration', 'Evaporation to dryness', 'Use of a separating funnel'],
    'The miscible liquids boil at different temperatures, so ethanol vaporises first and is condensed and collected separately. A separating funnel works only for immiscible liquids; filtration cannot separate liquids.',
    0, 'Identify', 'AO2'),
  mcq('WASSCE-ISC-MAT', 'medium', 'A student dissolves salt in water and then filters the solution. The filtrate still contains the salt because:',
    'Dissolved salt particles are small enough to pass through the filter paper pores',
    ['The salt reacted chemically with the filter paper', 'The water dissolved the filter paper', 'The salt turned into a gas during filtration'],
    'Dissolved salt particles are far smaller than the pores of filter paper, so they pass through with the water; only undissolved solids are trapped. The salt can be recovered by evaporating the filtrate.',
    2, 'Explain', 'AO2'),
  mcq('WASSCE-ISC-MAT', 'medium', 'Which property distinguishes a pure substance from a mixture?',
    'A pure substance melts at a sharp, definite temperature',
    ['A pure substance always separates into two visible layers', 'A pure substance contains more than one kind of atom', 'A pure substance is always a solid at room temperature'],
    'A pure substance has a fixed composition and melts and boils at sharp, definite temperatures, whereas a mixture melts or boils over a range because its composition can vary.',
    1, 'Identify', 'AO2'),

  // --- Electricity and energy (topic_wassce_p2_sci_enr) ---------------------
  mcq('WASSCE-ISC-ENR', 'easy', 'The SI unit of electric current is the:',
    'Ampere', ['Volt', 'Ohm', 'Watt'],
    'Electric current is the rate of flow of electric charge and is measured in amperes (A). The volt measures potential difference, the ohm resistance, and the watt power.',
    2, 'Identify', 'AO1'),
  mcq('WASSCE-ISC-ENR', 'easy', 'The instrument used to measure the electric current flowing in a circuit is the:',
    'Ammeter', ['Voltmeter', 'Ohmmeter', 'Wattmeter'],
    'An ammeter is connected in series so that the circuit current flows through it. A voltmeter measures potential difference, an ohmmeter resistance, and a wattmeter electrical power.',
    3, 'Identify', 'AO1'),
  mcq('WASSCE-ISC-ENR', 'easy', 'When a dry cell powers a torch, the energy transformation that takes place is:',
    'Chemical energy to electrical energy', ['Electrical energy to chemical energy', 'Heat energy to electrical energy', 'Mechanical energy to electrical energy'],
    'A dry cell stores chemical energy and releases it as electrical energy in the circuit. The reverse change (electrical to chemical) occurs while charging a rechargeable cell.',
    1, 'Identify', 'AO1'),
  mcq('WASSCE-ISC-ENR', 'easy', 'In a series circuit containing a battery and two lamps, the electric current is:',
    'The same at every point in the circuit', ['Greater near the positive terminal of the battery', 'Permanently stored inside each lamp', 'Zero when the two lamps are identical'],
    'In a series circuit there is only one path, so the same charge passes every point each second; current is the same everywhere and is not used up by the lamps.',
    0, 'Identify', 'AO1'),
  mcq('WASSCE-ISC-ENR', 'medium', 'A 12 V battery is connected across a 4 Ω resistor. The current flowing through the resistor is:',
    '3 A', ['48 A', '0.33 A', '8 A'],
    'By Ohm’s law, I = V ÷ R = 12 V ÷ 4 Ω = 3 A. Multiplying the values (48 A) or inverting the division (0.33 A) misapplies the formula.',
    2, 'Calculate', 'AO2'),
  mcq('WASSCE-ISC-ENR', 'medium', 'A third identical lamp is added in series to a circuit containing a battery and two lamps. All the lamps become dimmer because:',
    'The total resistance increases, so the current decreases',
    ['The battery produces a lower voltage for series lamps', 'The current is permanently used up by the lamps', 'The connecting wires stop the current'],
    'Series resistances add, so the third lamp raises the total resistance; by I = V ÷ R the current falls and each lamp converts less power to light.',
    1, 'Explain', 'AO2'),
  mcq('WASSCE-ISC-ENR', 'medium', 'Which of the following is an advantage of connecting household lamps in parallel rather than in series?',
    'Each lamp receives the full supply voltage and can be switched independently',
    ['Parallel lamps always use less wire than series lamps', 'The total resistance of the circuit becomes very large', 'The current is the same through every lamp'],
    'In parallel, each branch connects across the supply, so every lamp gets the full mains voltage and a switch or fault in one branch does not affect the others.',
    3, 'Explain', 'AO2'),
  mcq('WASSCE-ISC-ENR', 'medium', 'Metals such as copper are good conductors of electricity mainly because:',
    'They contain free electrons that can drift through the metal',
    ['Their atoms are packed loosely with large spaces', 'Their protons are free to move through the lattice', 'Their nuclei vibrate when a battery is connected'],
    'Free (delocalised) electrons drift through the metal lattice when a voltage is applied; this flow of charge is the current. Protons and nuclei stay fixed in the lattice.',
    0, 'Explain', 'AO2'),

  // --- Human digestion (topic_wassce_p2_sci_bio) ----------------------------
  mcq('WASSCE-ISC-BIO', 'easy', 'In humans, the digestion of starch begins in the:',
    'Mouth', ['Stomach', 'Small intestine', 'Large intestine'],
    'Saliva contains salivary amylase (ptyalin), which begins breaking starch into maltose while food is chewed. The stomach digests proteins; starch digestion continues in the small intestine.',
    3, 'Identify', 'AO1'),
  mcq('WASSCE-ISC-BIO', 'easy', 'The enzyme present in saliva that acts on cooked starch is:',
    'Amylase', ['Pepsin', 'Lipase', 'Trypsin'],
    'Salivary amylase digests starch into maltose. Pepsin and trypsin digest proteins in the stomach and small intestine respectively, and lipase digests fats, so none of them acts on starch.',
    1, 'Identify', 'AO1'),
  mcq('WASSCE-ISC-BIO', 'easy', 'Most digested food is absorbed into the bloodstream in the:',
    'Small intestine', ['Stomach', 'Large intestine', 'Oesophagus'],
    'The villi of the small intestine give a very large surface area with thin walls and a rich blood supply, so digested food molecules diffuse quickly into the blood. The large intestine absorbs mainly water.',
    2, 'Identify', 'AO1'),
  mcq('WASSCE-ISC-BIO', 'easy', 'Bile, the substance that acts on fats during digestion, is produced by the:',
    'Liver', ['Pancreas', 'Gall bladder', 'Stomach'],
    'Bile is made by the liver; the gall bladder only stores it and releases it into the small intestine. The pancreas produces digestive enzymes such as lipase, and the stomach produces gastric juice.',
    0, 'Identify', 'AO1'),
  mcq('WASSCE-ISC-BIO', 'medium', 'Pepsin begins the digestion of proteins in the stomach. Pepsin works effectively there because the stomach provides:',
    'An acidic medium from hydrochloric acid', ['An alkaline medium from bile', 'A neutral medium from saliva', 'An alkaline medium from pancreatic juice'],
    'The stomach lining secretes hydrochloric acid, giving the low pH that pepsin needs to work. Bile and pancreatic juice are alkaline but act in the small intestine, and saliva is nearly neutral.',
    1, 'Explain', 'AO2'),
  mcq('WASSCE-ISC-BIO', 'medium', 'Apart from providing the acidic conditions needed by pepsin, another important function of the hydrochloric acid in the stomach is to:',
    'Kill most of the bacteria taken in with food', ['Digest starch into glucose', 'Emulsify fats into tiny droplets', 'Absorb water from the food'],
    'The strong acid kills many of the micro-organisms swallowed with food, protecting the body from infection. Bile emulsifies fats, and water is absorbed mainly in the large intestine.',
    2, 'Explain', 'AO2'),
  mcq('WASSCE-ISC-BIO', 'medium', 'Bile helps the digestion of fats by:',
    'Emulsifying the fats — breaking large fat globules into smaller droplets', ['Chemically breaking fat molecules into fatty acids and glycerol', 'Neutralising all the acid produced in the stomach', 'Converting fats into glucose for easy absorption'],
    'Bile salts break large fat globules into small droplets (emulsification), increasing the surface area for lipase to act. Bile contains no enzyme; lipase does the chemical breakdown of fats.',
    3, 'Explain', 'AO2'),
  mcq('WASSCE-ISC-BIO', 'medium', 'The end product of protein digestion that is absorbed into the blood is:',
    'Amino acids', ['Glucose', 'Fatty acids and glycerol', 'Maltose'],
    'Proteins are digested by pepsin, trypsin and peptidases into amino acids, which are small and soluble enough to be absorbed. Glucose comes from carbohydrates; fatty acids and glycerol come from fats.',
    0, 'Identify', 'AO1'),

  // --- Disease and health (topic_wassce_p2_sci_hlt) --------------------------
  mcq('WASSCE-ISC-HLT', 'easy', 'Malaria is transmitted to humans through the bite of an infected:',
    'Female Anopheles mosquito', ['Male Culex mosquito', 'Tsetse fly', 'Housefly'],
    'Only female mosquitoes take blood meals, and the female Anopheles mosquito carries the Plasmodium parasite. The tsetse fly transmits sleeping sickness and houseflies spread diarrhoeal diseases.',
    2, 'Identify', 'AO1'),
  mcq('WASSCE-ISC-HLT', 'easy', 'Cholera is commonly spread when people:',
    'Drink water or eat food contaminated with faeces', ['Are bitten by infected mosquitoes', 'Inhale droplets from a coughing patient', 'Touch the skin of an infected person'],
    'Cholera bacteria pass out in the faeces of patients and contaminate drinking water or food, infecting the next person who swallows them. Cholera is not spread by mosquitoes, droplets or casual contact.',
    3, 'Identify', 'AO1'),
  mcq('WASSCE-ISC-HLT', 'easy', 'Which of the following is a non-communicable disease?',
    'Diabetes mellitus', ['Tuberculosis', 'Measles', 'Cholera'],
    'Diabetes mellitus results from the body failing to control blood glucose properly and cannot pass from person to person. Tuberculosis, measles and cholera are communicable diseases caused by pathogens.',
    0, 'Identify', 'AO1'),
  mcq('WASSCE-ISC-HLT', 'easy', 'Vaccination protects a person against a disease mainly by:',
    'Stimulating the body to produce antibodies before infection occurs', ['Instantly killing all the germs in the blood', 'Replacing infected blood with healthy blood', 'Making the skin completely germ-proof'],
    'A vaccine introduces a harmless form of the pathogen (or part of it), so the immune system makes antibodies and memory cells that respond rapidly if the real pathogen arrives later.',
    1, 'Explain', 'AO1'),
  mcq('WASSCE-ISC-HLT', 'medium', 'Clearing stagnant water from around homes helps to control malaria because it:',
    'Destroys the breeding sites where mosquito larvae develop', ['Kills the Plasmodium parasite directly', 'Stops mosquitoes from feeding at night', 'Makes the air too dry for adult mosquitoes to fly'],
    'Mosquitoes lay eggs in stagnant water where the larvae develop; draining or covering such water breaks the life cycle, so fewer adult mosquitoes emerge to transmit the parasite.',
    2, 'Explain', 'AO2'),
  mcq('WASSCE-ISC-HLT', 'medium', 'The most immediate danger to a person suffering from cholera is:',
    'Severe dehydration from the rapid loss of water and salts through diarrhoea',
    ['High fever causing brain damage', 'The bacteria invading the lungs', 'Permanent damage to the eyesight'],
    'Cholera causes profuse watery diarrhoea and vomiting; rapid loss of water and salts leads to fatal dehydration within hours, so oral rehydration solution is the key first treatment.',
    3, 'Explain', 'AO2'),
  mcq('WASSCE-ISC-HLT', 'medium', 'Tuberculosis is mainly spread when:',
    'Droplets coughed or sneezed by an infected person are inhaled',
    ['Contaminated food is eaten', 'An infected mosquito bites a healthy person', 'Open wounds come into contact with soil'],
    'Tuberculosis is an airborne disease: a patient releases bacteria-laden droplets when coughing, sneezing or speaking, and people nearby inhale them into their lungs.',
    0, 'Identify', 'AO2'),
  mcq('WASSCE-ISC-HLT', 'medium', 'Community pipe-borne water is treated with chlorine mainly to:',
    'Kill disease-causing micro-organisms in the water', ['Give the water a salty taste', 'Remove all dissolved minerals from the water', 'Increase the oxygen content of the water'],
    'Chlorination disinfects water by killing bacteria, viruses and other pathogens, preventing water-borne diseases such as cholera and typhoid.',
    1, 'Explain', 'AO2'),

  // --- Reproduction and Heredity (topic_wassce_intsci_reproduction) ----------
  mcq('WASSCE-ISC-REP', 'medium', 'Which of the following is an example of asexual reproduction?',
    'Budding in yeast', ['Fertilisation in humans', 'Pollination in maize', 'Cross-breeding of cattle'],
    'Budding involves a single parent and no fusion of gametes, so it is asexual reproduction. Fertilisation, pollination (leading to fertilisation) and cross-breeding all involve gametes from two parents.',
    3, 'Identify', 'AO1'),
  mcq('WASSCE-ISC-REP', 'medium', 'In flowering plants, pollination is best described as the:',
    'Transfer of pollen grains from the anther to the stigma', ['Fusion of the male and female gametes', 'Development of the ovule into a seed', 'Release of seeds from a ripe fruit'],
    'Pollination is the transfer of pollen (carrying the male gametes) from anther to stigma by wind, insects or other agents. The fusion of gametes that follows is fertilisation, a separate event.',
    1, 'Identify', 'AO2'),
  mcq('WASSCE-ISC-REP', 'medium', 'In humans, fertilisation of the egg normally takes place in the:',
    'Oviduct (fallopian tube)', ['Ovary', 'Uterus', 'Vagina'],
    'After ovulation the egg travels along the oviduct, where it may meet sperm and be fertilised; the embryo then implants in the uterus. The ovary releases the egg but is not the site of fertilisation.',
    2, 'Identify', 'AO1'),
  mcq('WASSCE-ISC-REP', 'medium', 'In genetics, an allele is:',
    'An alternative form of a gene', ['A chromosome found only in males', 'The physical appearance of an organism', 'A cell that carries gametes'],
    'Alleles are alternative versions of the same gene, for example T (tall) and t (short) in pea plants. The physical appearance produced by the alleles is the phenotype, which is a different concept.',
    0, 'Identify', 'AO1'),
  mcq('WASSCE-ISC-REP', 'hard', 'Two heterozygous tall pea plants (Tt × Tt) are crossed, where the allele T for tallness is dominant over t for shortness. The expected genotypic ratio of the offspring is:',
    '1 TT : 2 Tt : 1 tt', ['3 tall : 1 short', '1 Tt : 1 tt', 'All Tt'],
    'A Punnett square for Tt × Tt gives TT, Tt, Tt and tt, a genotypic ratio of 1 : 2 : 1. The 3 : 1 ratio is the phenotypic ratio (three tall to one short), which describes appearance, not genotype.',
    1, 'Calculate', 'AO2'),
  mcq('WASSCE-ISC-REP', 'hard', 'In humans, the sex of a child is determined by:',
    'Whether the fertilising sperm carries an X or a Y chromosome', ['Whether the egg carries an X or a Y chromosome', 'The number of chromosomes in the mother’s blood', 'The age of the mother at conception'],
    'Every egg carries an X chromosome, while each sperm carries either X or Y. An X-carrying sperm gives an XX (female) zygote and a Y-carrying sperm an XY (male) zygote, so the sperm determines sex.',
    2, 'Explain', 'AO2'),

  // --- Calculations ----------------------------------------------------------
  calc('WASSCE-ISC-ENR', 'medium', 'A 6 Ω resistor is connected across a 12 V battery. Calculate (a) the current flowing through the resistor and (b) the power dissipated by the resistor.',
    '(a) 2 A (b) 24 W',
    '(a) By Ohm’s law, current I = V ÷ R = 12 V ÷ 6 Ω = 2 A. (b) Power P = V × I = 12 V × 2 A = 24 W (equivalently P = I²R = (2 A)² × 6 Ω = 24 W). Both parts must carry the correct units to earn full marks.'),
  calc('WASSCE-ISC-ENR', 'medium', 'An electric kettle is rated at 2 000 W. Calculate the electrical energy it consumes when it is used for 5 minutes, giving your answer in joules.',
    '600 000 J (600 kJ)',
    'Energy E = power × time, with time in seconds: t = 5 × 60 = 300 s. So E = 2 000 W × 300 s = 600 000 J = 600 kJ. A common error is to multiply 2 000 by 5 (giving 10 000 J), forgetting to convert minutes to seconds.'),
];

// --- Batch assembly -----------------------------------------------------------
const topicByCode = new Map(canonicalTopicRows.map((row) => [row[0], row]));

function buildQuestion(source, topicSequence) {
  const [, topicId] = topicByCode.get(source.topicCode);
  const topicSlug = topicId.replace(/^topic_wassce_(p2_sci|intsci)_/, '');
  const id = `q_wisc_${topicSlug}_b001_${String(topicSequence).padStart(3, '0')}`;
  const base = {
    id,
    original: true,
    topicCode: source.topicCode,
    prompt: source.prompt,
    workedSolution: source.solution,
    difficulty: source.difficulty,
    commandWord: source.commandWord,
    assessmentObjective: source.assessmentObjective,
    provenance: [subjectSource],
  };
  if (source.kind === 'mcq') {
    const rawOptions = [...source.wrong];
    rawOptions.splice(source.position, 0, source.correct);
    return {
      ...base,
      type: 'multiple_choice',
      marks: 1,
      points: 3,
      timeLimit: 45,
      correctAnswer: labels[source.position],
      options: rawOptions.map((text, optionIndex) => ({
        label: labels[optionIndex],
        text,
        rationale: optionIndex === source.position
          ? `This is the supported answer. ${source.solution}`
          : 'This option reflects a common misconception; the worked explanation shows why it does not apply here.',
      })),
    };
  }
  return {
    ...base,
    type: 'calculation',
    marks: 2,
    points: 4,
    timeLimit: 120,
    correctAnswer: source.answer,
  };
}

const questions = [];
{
  const sequences = new Map();
  for (const source of sources) {
    const next = (sequences.get(source.topicCode) ?? 0) + 1;
    sequences.set(source.topicCode, next);
    questions.push(buildQuestion(source, next));
  }
}

const batch = {
  batchId,
  status: 'approved_for_beta',
  examTypeId: 'exam_wassce',
  provenance: [iscSource('Secondary Education Curriculum (SHS core Integrated Science)')],
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
  subjects: [
    {
      subjectId: SUBJECT_ID,
      specificationCode: 'BRILLA-WASSCE-ISC-SPRINT1-001',
      sources: [subjectSource],
      topics: canonicalTopicRows.map(([code, , title, objective]) => ({ code, title, objective })),
      questions,
    },
  ],
};

// --- Validation -------------------------------------------------------------
const validation = validateQuestionBatch(batch, { mode: 'draft' });

function inHouseValidation(errors) {
  if (batch.review.automatedChecksAt !== generatedAt) errors.push('review.automatedChecksAt mismatch');
  if (batch.release.channel !== 'beta') errors.push('release.channel must be beta');
  if (typeof batch.release.contentLabel !== 'string' || batch.release.contentLabel.trim().length < 40) errors.push('release.contentLabel too short');
  if (!/not official/i.test(batch.release.contentLabel)) errors.push('release.contentLabel must disclaim official status');
  if (batch.release.officialExamBoardContent !== false) errors.push('release.officialExamBoardContent must be false');
  if (batch.release.feedbackEnabled !== true) errors.push('release.feedbackEnabled must be true');

  const difficulties = new Set(['easy', 'medium', 'hard']);
  const counts = new Map();
  const letters = new Set();
  for (const question of questions) {
    if (!topicByCode.has(question.topicCode)) { errors.push(`${question.id}: unknown topicCode`); continue; }
    const entry = counts.get(question.topicCode) ?? { mcq: 0, calc: 0 };
    if (question.type === 'multiple_choice') {
      entry.mcq += 1;
      letters.add(question.correctAnswer);
      if (question.marks !== 1 || question.points !== 3 || question.timeLimit !== 45) errors.push(`${question.id}: MCQ scoring fields wrong`);
    } else if (question.type === 'calculation') {
      entry.calc += 1;
      if (question.marks !== 2 || question.points !== 4 || question.timeLimit !== 120) errors.push(`${question.id}: calculation scoring fields wrong`);
      if (question.options != null) errors.push(`${question.id}: calculation must not carry options`);
    } else {
      errors.push(`${question.id}: unexpected type`);
    }
    counts.set(question.topicCode, entry);
    if (!difficulties.has(question.difficulty)) errors.push(`${question.id}: difficulty invalid`);
    if (!Array.isArray(question.provenance) || question.provenance[0]?.use !== 'curriculum_blueprint_only') errors.push(`${question.id}: per-item provenance missing`);
  }
  for (const [code, expected] of Object.entries(expectedCounts)) {
    const actual = counts.get(code) ?? { mcq: 0, calc: 0 };
    if (actual.mcq !== expected.mcq || actual.calc !== expected.calc) {
      errors.push(`${code}: expected ${expected.mcq} MCQ + ${expected.calc} calculation, found ${actual.mcq} + ${actual.calc}`);
    }
  }
  if (letters.size < 4) errors.push('correct-answer letters must cover A, B, C and D');

  // Prod-style integrity: every question's topic must belong to its subject.
  for (const question of questions) {
    const row = topicByCode.get(question.topicCode);
    if (!row) continue;
    const [, topicId] = row;
    if (!/^topic_wassce_(p2_sci|intsci)_/.test(topicId)) errors.push(`${question.id}: topic ${topicId} is not a prod-canonical Integrated Science topic`);
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

// --- SQL emission -----------------------------------------------------------
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
    topic_id: topicByCode.get(question.topicCode)[1],
    subject_id: SUBJECT_ID,
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
    assessment_objective: question.assessmentObjective,
    source_paper_code: null,
    source_question_number: null,
    exam_board_id: null,
  };
}

function canonicalMatch(alias, values) {
  return canonicalQuestionFields.map((field) => `${alias}.${field} IS ${sql(values[field])}`).join(' AND ');
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

let migrationNumber = 412;
{
  const name = `${migrationNumber}_wassce_int_science_sprint1_foundation.sql`;
  const allTopicIds = canonicalTopicRows.map(([, id]) => id);
  const lines = [
    `-- ${migrationNumber}: Foundation guard for WASSCE Integrated Science content sprint 1 batch 001.`,
    '-- Original BrillaPrep practice content; not official WAEC examination material.',
    '-- Re-asserts the prod-canonical topic rows (from prod-patch 096 and migration 365) with',
    '-- INSERT OR IGNORE so fresh baselines and prod both satisfy the question FK/trigger checks.',
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
    ...canonicalTopicRows.map(([, id, topicName, description, displayOrder]) =>
      // The slug is derived from the canonical id rather than copied from the
      // owning migration/patch row: those rows already hold their human slugs
      // ('reproduction-and-heredity', 'acids-bases-and-salts', ...) and topics is
      // UNIQUE(subject_id, slug). On prod and on the fresh baseline the rows
      // exist already, so INSERT OR IGNORE no-ops on the id conflict.
      `INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES (${sql(id)}, ${sql(SUBJECT_ID)}, NULL, ${sql(topicName)}, ${sql(id.slice(6).replaceAll('_', '-'))}, ${sql(description)}, NULL, NULL, ${displayOrder}, '2026-08-04T00:00:00.000Z');`),
    `CREATE TABLE IF NOT EXISTS _migration_${migrationNumber}_guard (valid INTEGER NOT NULL CHECK (valid = 1));`,
    `DELETE FROM _migration_${migrationNumber}_guard;`,
    `INSERT INTO _migration_${migrationNumber}_guard(valid) SELECT CASE WHEN EXISTS (SELECT 1 FROM exam_types WHERE id = 'exam_wassce') AND EXISTS (SELECT 1 FROM subjects WHERE id = ${sql(SUBJECT_ID)} AND exam_type_id = 'exam_wassce') AND (SELECT COUNT(*) FROM topics t JOIN subjects s ON s.id = t.subject_id WHERE t.id IN (${allTopicIds.map(sql).join(', ')}) AND s.id = ${sql(SUBJECT_ID)} AND s.exam_type_id = 'exam_wassce') = ${allTopicIds.length} THEN 1 ELSE 0 END;`,
    `DROP TABLE _migration_${migrationNumber}_guard;`,
  ];
  await emitMigration(name, lines);
  migrationNumber += 1;
}

// Question parts: sequential chunks of the batch (6 per part keeps every
// migration under the remote D1 query limit), then a final counts guard.
const PART_SIZE = 6;
const partCount = Math.ceil(questions.length / PART_SIZE);
for (let part = 0; part < partCount; part += 1) {
  const partQuestions = questions.slice(part * PART_SIZE, (part + 1) * PART_SIZE);
  const ids = partQuestions.map((question) => question.id);
  const guardTable = `_migration_${migrationNumber}_guard`;
  const name = `${migrationNumber}_wassce_int_science_sprint1_part_${part + 1}.sql`;
  const lines = [
    `-- ${migrationNumber}: Original BrillaPrep WASSCE Integrated Science beta questions, part ${part + 1} of ${partCount} (sprint 1 batch 001).`,
    '-- Curriculum-aligned practice content; not official WAEC examination material.',
    'PRAGMA foreign_keys = ON;',
    `CREATE TABLE IF NOT EXISTS ${guardTable} (valid INTEGER NOT NULL CHECK (valid = 1));`,
    `DELETE FROM ${guardTable};`,
  ];
  for (const question of partQuestions) {
    const values = questionValues(question);
    lines.push(`INSERT INTO ${guardTable}(valid) SELECT CASE WHEN NOT EXISTS (SELECT 1 FROM questions q WHERE q.id = ${sql(question.id)} AND NOT (${canonicalMatch('q', values)})) AND NOT EXISTS (SELECT 1 FROM question_content_releases r WHERE r.question_id = ${sql(question.id)} AND NOT (${releaseMatch('r')})) THEN 1 ELSE 0 END;`);
  }
  for (const question of partQuestions) {
    const values = questionValues(question);
    lines.push(`INSERT OR IGNORE INTO questions (id, ${canonicalQuestionFields.join(', ')}) VALUES (${sql(question.id)}, ${canonicalQuestionFields.map((field) => sql(values[field])).join(', ')});`);
  }
  lines.push(`INSERT OR IGNORE INTO question_content_releases (question_id, batch_id, quality_assurance, release_channel, content_label, source_url, official_exam_board_content, feedback_enabled) SELECT id, '${batchId}', 'automated_beta', 'beta', ${sql(contentLabel)}, ${sql(releaseSourceUrl)}, 0, 1 FROM questions WHERE id IN (${ids.map(sql).join(', ')});`);
  lines.push(`DELETE FROM ${guardTable};`);
  lines.push(`INSERT INTO ${guardTable}(valid) SELECT CASE WHEN (SELECT COUNT(*) FROM questions WHERE id IN (${ids.map(sql).join(', ')})) = ${ids.length} AND (SELECT COUNT(*) FROM question_content_releases r WHERE r.question_id IN (${ids.map(sql).join(', ')}) AND ${releaseMatch('r')}) = ${ids.length} THEN 1 ELSE 0 END;`);
  lines.push(`DROP TABLE ${guardTable};`);
  await emitMigration(name, lines);
  migrationNumber += 1;
}

{
  const name = `${migrationNumber}_wassce_int_science_sprint1_final_guard.sql`;
  const guardTable = `_migration_${migrationNumber}_guard`;
  const allIds = questions.map((question) => question.id);
  const mcqIds = questions.filter((question) => question.type === 'multiple_choice').map((question) => question.id);
  const calcIds = questions.filter((question) => question.type === 'calculation').map((question) => question.id);
  const lines = [
    `-- ${migrationNumber}: Final exact-set and relationship guard for WASSCE Integrated Science sprint 1 batch 001.`,
    'PRAGMA foreign_keys = ON;',
    `CREATE TABLE IF NOT EXISTS ${guardTable} (valid INTEGER NOT NULL CHECK (valid = 1));`,
    `DELETE FROM ${guardTable};`,
    `INSERT INTO ${guardTable}(valid) SELECT CASE WHEN (SELECT COUNT(*) FROM questions q JOIN topics t ON t.id = q.topic_id JOIN question_content_releases r ON r.question_id = q.id WHERE q.id IN (${allIds.map(sql).join(', ')}) AND q.subject_id = ${sql(SUBJECT_ID)} AND q.subject_id = t.subject_id AND q.exam_type_id = 'exam_wassce' AND length(q.explanation) >= 80 AND r.batch_id = '${batchId}' AND r.quality_assurance = 'automated_beta' AND r.release_channel = 'beta' AND r.official_exam_board_content = 0 AND r.feedback_enabled = 1) = ${allIds.length} AND (SELECT COUNT(*) FROM questions q WHERE q.id IN (${mcqIds.map(sql).join(', ')}) AND q.question_type = 'multiple_choice' AND json_valid(q.options) AND json_array_length(q.options) = 4 AND q.correct_answer IN ('A','B','C','D')) = ${mcqIds.length} AND (SELECT COUNT(*) FROM questions q WHERE q.id IN (${calcIds.map(sql).join(', ')}) AND q.question_type = 'calculation' AND q.options IS NULL AND length(q.correct_answer) >= 1) = ${calcIds.length} AND (SELECT COUNT(*) FROM question_content_releases WHERE batch_id = '${batchId}') = ${allIds.length} THEN 1 ELSE 0 END;`,
    `DROP TABLE ${guardTable};`,
  ];
  await emitMigration(name, lines);
  migrationNumber += 1;
}

console.log(JSON.stringify({ validation: { valid: validation.valid, metrics: validation.metrics }, outBatch, migrations: migrationPaths }, null, 2));
