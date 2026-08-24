import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateQuestionBatch } from './question-content-lib.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const generatedAt = '2026-08-24T00:00:00Z';
const labels = ['A', 'B', 'C', 'D'];
const difficulties = ['easy', 'medium', 'hard'];
const aos = ['AO1', 'AO2', 'AO3'];

const topics = {
  math: [
    ['4MA1-NUM', 'Number', 'Apply number operations, ratio, percentages, bounds and standard form accurately.'],
    ['4MA1-ALG', 'Algebra', 'Manipulate expressions, solve equations and interpret functions, sequences and graphs.'],
    ['4MA1-GEO', 'Geometry', 'Apply geometric reasoning, mensuration, transformations, vectors and trigonometry.'],
    ['4MA1-STA', 'Statistics', 'Interpret data and calculate statistics and probabilities in unfamiliar contexts.'],
  ],
  biology: [
    ['4BI1-1', 'The nature and variety of living organisms', 'Recognise shared life processes and classify organisms using observable evidence.'],
    ['4BI1-2', 'Structures and functions in living organisms', 'Explain how cells, tissues and organ systems perform and coordinate life processes.'],
    ['4BI1-3', 'Reproduction and inheritance', 'Apply reproductive biology and genetic models to inheritance and variation.'],
    ['4BI1-4', 'Ecology and the environment', 'Analyse ecosystems, cycles, sampling evidence and human environmental impacts.'],
    ['4BI1-5', 'Use of biological resources', 'Evaluate food production, selective breeding, genetic modification and biotechnology.'],
  ],
  chemistry: [
    ['4CH1-1', 'Principles of chemistry', 'Apply particle theory, atomic structure, bonding, calculations and electrolysis.'],
    ['4CH1-2', 'Inorganic chemistry', 'Explain periodic trends, reactivity, extraction, gases and compound tests.'],
    ['4CH1-3', 'Physical chemistry', 'Analyse energetics, rates, equilibria and reversible chemical change.'],
    ['4CH1-4', 'Organic chemistry', 'Identify and explain hydrocarbons, functional groups, reactions and polymers.'],
  ],
  physics: [
    ['4PH1-1', 'Forces and motion', 'Use motion, force, momentum and turning-effect relationships.'],
    ['4PH1-2', 'Electricity', 'Analyse charge, current, voltage, resistance, power and electrical safety.'],
    ['4PH1-3', 'Waves', 'Apply wave relationships and explain optical and electromagnetic phenomena.'],
    ['4PH1-4', 'Energy resources and energy transfers', 'Calculate energy transfers, work, power and efficiency.'],
    ['4PH1-5', 'Solids, liquids and gases', 'Apply density, pressure, temperature and gas-particle models.'],
    ['4PH1-6', 'Magnetism and electromagnetism', 'Explain magnetic fields, motors, induction and transformers.'],
    ['4PH1-7', 'Radioactivity and particles', 'Interpret atomic, nuclear and radioactive-decay evidence safely.'],
    ['4PH1-8', 'Astrophysics', 'Use evidence about gravity, stars, red-shift and the expanding Universe.'],
  ],
};

function item(topicCode, prompt, correct, wrong, explanation) {
  return { topicCode, prompt, correct, wrong, explanation };
}

function mcq(specificationCode, index, source) {
  const correctIndex = index % 4;
  const raw = [...source.wrong];
  raw.splice(correctIndex, 0, source.correct);
  const options = raw.map((text, optionIndex) => ({
    label: labels[optionIndex],
    text,
    rationale: optionIndex === correctIndex
      ? `This is the supported result. ${source.explanation}`
      : 'This is a plausible misconception, but it conflicts with the relationship or evidence established in the worked solution.',
  }));
  return {
    id: `q_edx_${specificationCode.toLowerCase()}_b001_${String(index + 1).padStart(3, '0')}`,
    original: true,
    topicCode: source.topicCode,
    type: 'multiple_choice',
    prompt: source.prompt,
    options,
    correctAnswer: labels[correctIndex],
    workedSolution: `${source.explanation} Therefore the correct answer is ${labels[correctIndex]}: ${source.correct}.`,
    difficulty: difficulties[index % difficulties.length],
    marks: index % 5 === 4 ? 3 : index % 2 === 0 ? 1 : 2,
    commandWord: /calculate|work out|determine/i.test(source.prompt) ? 'Calculate' : /explain|why/i.test(source.prompt) ? 'Explain' : 'Identify',
    assessmentObjective: aos[index % aos.length],
  };
}

const math = [
  item('4MA1-NUM', 'A laptop priced at GHS 2,400 is reduced by 15%. Calculate the sale price.', 'GHS 2,040', ['GHS 2,385', 'GHS 2,160', 'GHS 2,760'], 'Fifteen percent of 2,400 is 360, so subtracting the discount gives 2,400 − 360 = 2,040.'),
  item('4MA1-NUM', 'Share GHS 840 in the ratio 3:4. What is the larger share?', 'GHS 480', ['GHS 360', 'GHS 420', 'GHS 560'], 'There are seven equal parts; each is 840 ÷ 7 = 120, and the larger share is 4 × 120 = 480.'),
  item('4MA1-NUM', 'Write 0.000672 in standard form.', '6.72 × 10⁻⁴', ['6.72 × 10⁻³', '67.2 × 10⁻⁴', '0.672 × 10⁻⁴'], 'Move the decimal point four places right to obtain 6.72, so the compensating power is 10 to the power −4.'),
  item('4MA1-NUM', 'A length is 8.4 cm correct to the nearest 0.1 cm. What is its upper bound?', '8.45 cm', ['8.35 cm', '8.40 cm', '8.50 cm'], 'Half of the rounding unit 0.1 is 0.05, so the interval ends just below 8.45 cm and its upper bound is 8.45 cm.'),
  item('4MA1-NUM', 'Calculate 3/5 + 7/10 and give the answer in simplest form.', '13/10', ['10/15', '1', '7/15'], 'Convert 3/5 to 6/10, then add 6/10 + 7/10 = 13/10, which is already in simplest fractional form.'),
  item('4MA1-NUM', 'A population rises from 12,000 to 13,500. Calculate the percentage increase.', '12.5%', ['11.1%', '15%', '112.5%'], 'The increase is 1,500. Dividing by the original 12,000 and multiplying by 100 gives 12.5%.'),
  item('4MA1-NUM', 'Evaluate (3.6 × 10⁵) ÷ (1.2 × 10²).', '3 × 10³', ['3 × 10⁷', '0.3 × 10³', '3 × 10²'], 'Divide the coefficients to get 3 and subtract the powers, 5 − 2 = 3, giving 3 × 10³.'),
  item('4MA1-NUM', 'The exchange rate is GHS 15.60 to USD 1. How many dollars are received for GHS 1,248?', 'USD 80', ['USD 79', 'USD 81', 'USD 1,263.60'], 'Divide the cedi amount by the cedi-per-dollar rate: 1,248 ÷ 15.60 = 80 dollars.'),
  item('4MA1-NUM', 'A recipe uses flour and sugar in the ratio 5:2. If 350 g of flour is used, calculate the sugar mass.', '140 g', ['70 g', '175 g', '875 g'], 'Each ratio part represents 350 ÷ 5 = 70 g, so sugar requires 2 × 70 = 140 g.'),
  item('4MA1-NUM', 'Calculate the compound value of GHS 2,000 after two years at 5% per year.', 'GHS 2,205', ['GHS 2,100', 'GHS 2,200', 'GHS 2,250'], 'Compound growth multiplies by 1.05 each year: 2,000 × 1.05² = 2,205.'),
  item('4MA1-ALG', 'Solve 5x − 7 = 28.', 'x = 7', ['x = 4.2', 'x = 5', 'x = 9'], 'Add 7 to both sides to obtain 5x = 35, then divide by 5 to obtain x = 7.'),
  item('4MA1-ALG', 'Factorise x² − 9x + 20.', '(x − 4)(x − 5)', ['(x + 4)(x + 5)', '(x − 2)(x − 10)', '(x + 4)(x − 5)'], 'The required numbers multiply to 20 and add to −9; they are −4 and −5, giving the two factors.'),
  item('4MA1-ALG', 'The sequence is 7, 11, 15, 19, ... What is its nth term?', '4n + 3', ['4n + 7', '3n + 4', '7n − 3'], 'The common difference is 4, so start with 4n; matching the first term requires adding 3.'),
  item('4MA1-ALG', 'If f(x) = 3x² − 2, calculate f(−2).', '10', ['−14', '−10', '34'], 'Squaring −2 gives 4; then 3 × 4 − 2 = 12 − 2 = 10.'),
  item('4MA1-ALG', 'Solve the simultaneous equations x + y = 11 and x − y = 3.', 'x = 7, y = 4', ['x = 4, y = 7', 'x = 8, y = 3', 'x = 6, y = 5'], 'Adding the equations gives 2x = 14, so x = 7; substituting into x + y = 11 gives y = 4.'),
  item('4MA1-ALG', 'Expand and simplify 3(2x − 5) − 2(x + 1).', '4x − 17', ['4x − 13', '8x − 17', '4x − 7'], 'Expanding gives 6x − 15 − 2x − 2; collecting like terms gives 4x − 17.'),
  item('4MA1-ALG', 'Make r the subject of A = πr².', 'r = √(A/π)', ['r = A/π', 'r = √A/π', 'r = π/A²'], 'Divide both sides by π to get r² = A/π, then take the positive square root for a radius.'),
  item('4MA1-ALG', 'Solve the inequality 2x + 5 < 17.', 'x < 6', ['x > 6', 'x < 11', 'x > 11'], 'Subtract 5 to get 2x < 12, then divide by positive 2 without reversing the inequality.'),
  item('4MA1-ALG', 'The line has gradient −3 and passes through (0, 5). Which equation represents it?', 'y = −3x + 5', ['y = 3x + 5', 'y = −3x − 5', 'y = 5x − 3'], 'In y = mx + c, the gradient is m = −3 and the y-intercept from (0, 5) is c = 5.'),
  item('4MA1-ALG', 'Solve the equation x² = 49.', 'x = 7 or x = −7', ['x = 7 only', 'x = −7 only', 'x = 24.5'], 'Both 7² and (−7)² equal 49, so a complete solution includes both square roots.'),
  item('4MA1-GEO', 'A right-angled triangle has shorter sides 9 cm and 12 cm. Calculate the hypotenuse.', '15 cm', ['13 cm', '18 cm', '21 cm'], 'Pythagoras gives c² = 9² + 12² = 81 + 144 = 225, so c = 15 cm.'),
  item('4MA1-GEO', 'Calculate the area of a circle of radius 6 cm in terms of π.', '36π cm²', ['12π cm²', '18π cm²', '72π cm²'], 'Circle area is πr², so substituting radius 6 gives π × 6² = 36π cm².'),
  item('4MA1-GEO', 'The exterior angle of a regular polygon is 24°. How many sides does it have?', '15', ['12', '18', '24'], 'Exterior angles sum to 360°, so the number of equal angles is 360 ÷ 24 = 15.'),
  item('4MA1-GEO', 'A prism has cross-sectional area 18 cm² and length 7 cm. Calculate its volume.', '126 cm³', ['25 cm³', '72 cm³', '252 cm³'], 'Prism volume equals cross-sectional area multiplied by length: 18 × 7 = 126 cm³.'),
  item('4MA1-GEO', 'In a right triangle, the side opposite angle θ is 8 cm and the hypotenuse is 10 cm. Calculate sin θ.', '0.8', ['0.6', '1.25', '1.8'], 'Sine equals opposite divided by hypotenuse, so sin θ = 8 ÷ 10 = 0.8.'),
  item('4MA1-GEO', 'A scale drawing uses 1:50. A wall is 8 cm on the drawing. What is its actual length?', '4 m', ['0.16 m', '40 m', '400 m'], 'The actual length is 8 × 50 = 400 cm, which converts to 4 m.'),
  item('4MA1-GEO', 'A cylinder has radius 2 cm and height 9 cm. Calculate its volume in terms of π.', '36π cm³', ['18π cm³', '22π cm³', '72π cm³'], 'Cylinder volume is πr²h, so π × 2² × 9 = 36π cm³.'),
  item('4MA1-GEO', 'Two similar shapes have linear scale factor 3. What is their area scale factor?', '9', ['3', '6', '27'], 'Area changes with the square of the linear scale factor, so 3² = 9.'),
  item('4MA1-GEO', 'What single transformation maps (x, y) to (−x, y)?', 'Reflection in the y-axis', ['Reflection in the x-axis', 'Rotation 90° clockwise', 'Translation left one unit'], 'Changing only the sign of the x-coordinate mirrors every point across the y-axis.'),
  item('4MA1-GEO', 'Vectors a = (3, −1) and b = (2, 4). Calculate a + b.', '(5, 3)', ['(1, −5)', '(6, −4)', '(5, −5)'], 'Add corresponding components: 3 + 2 = 5 and −1 + 4 = 3.'),
  item('4MA1-STA', 'Find the mean of 6, 8, 9, 12 and 15.', '10', ['9', '10.5', '12'], 'The total is 50 and there are five values, so the mean is 50 ÷ 5 = 10.'),
  item('4MA1-STA', 'Find the median of 3, 5, 8, 11, 14 and 19.', '9.5', ['8', '11', '10'], 'With six ordered values, average the third and fourth: (8 + 11) ÷ 2 = 9.5.'),
  item('4MA1-STA', 'A fair die is rolled. What is the probability of obtaining a prime number?', '1/2', ['1/3', '2/3', '5/6'], 'The prime faces are 2, 3 and 5, giving three favourable results out of six equally likely results, or 1/2.'),
  item('4MA1-STA', 'A bag has 4 red, 5 blue and 1 green counter. What is P(not blue)?', '1/2', ['1/5', '2/5', '3/5'], 'Five of the ten counters are not blue, so the probability is 5/10 = 1/2.'),
  item('4MA1-STA', 'A class interval has frequency 18 and width 6. Calculate its frequency density.', '3', ['6', '12', '108'], 'Frequency density is frequency divided by class width, so 18 ÷ 6 = 3.'),
  item('4MA1-STA', 'The probability of rain is 0.35. What is the probability of no rain?', '0.65', ['0.35', '0.55', '1.35'], 'Complementary probabilities total 1, so P(no rain) = 1 − 0.35 = 0.65.'),
  item('4MA1-STA', 'A coin is tossed twice. What is the probability of exactly one head?', '1/2', ['1/4', '3/4', '1'], 'The equally likely outcomes are HH, HT, TH and TT; exactly one head occurs in two of four outcomes.'),
  item('4MA1-STA', 'For the values 4, 7, 7, 9, 13, what is the range?', '9', ['6', '7', '13'], 'Range is maximum minus minimum, so 13 − 4 = 9.'),
  item('4MA1-STA', 'In a survey of 80 students, 28 prefer physics. Estimate the sector angle in a pie chart.', '126°', ['98°', '144°', '252°'], 'The sector is 28/80 of a full turn: 28 ÷ 80 × 360° = 126°.'),
  item('4MA1-STA', 'A scatter graph shows points close to a downward-sloping line. What correlation is shown?', 'Strong negative correlation', ['Strong positive correlation', 'No correlation', 'Perfect positive correlation'], 'A downward trend means one variable tends to decrease as the other increases; closeness to a line makes it strong.'),
];

const biologyFacts = {
  '4BI1-1': [
    ['Which process releases energy from nutrients in all living organisms?', 'Respiration', ['Photosynthesis', 'Excretion', 'Transpiration'], 'Respiration transfers chemical energy from nutrients for cellular activities in organisms.'],
    ['Which feature distinguishes plants from animals at the cellular level?', 'Plant cells have cellulose cell walls', ['Animal cells contain chloroplasts', 'Plant cells lack nuclei', 'Animal cells have cellulose walls'], 'Cellulose cell walls support plant cells; animal cells do not possess these walls.'],
    ['Which organism is a fungus?', 'Yeast', ['Amoeba', 'Lactobacillus', 'Moss'], 'Yeast obtains nutrients heterotrophically and has the cellular organisation characteristic of fungi.'],
    ['Which structure is present in bacteria but not as a membrane-bound organelle?', 'A circular chromosome in the cytoplasm', ['A nucleus', 'Mitochondria', 'Chloroplasts'], 'Bacterial DNA is circular and lies free in the cytoplasm because bacteria have no nucleus.'],
    ['Which statement about viruses is correct?', 'They reproduce only inside living cells', ['They respire independently', 'They are made of many cells', 'They feed by photosynthesis'], 'Viruses depend on host-cell machinery to copy their genetic material and make new particles.'],
    ['Which life process removes metabolic waste from an organism?', 'Excretion', ['Nutrition', 'Growth', 'Sensitivity'], 'Excretion removes toxic materials and products made by metabolism, such as carbon dioxide and urea.'],
    ['Why is binomial naming useful?', 'It gives each species a universal two-part name', ['It measures population size', 'It identifies an organism’s age', 'It shows every evolutionary ancestor'], 'A genus-and-species name lets scientists communicate about the same organism across languages.'],
    ['Which feature is characteristic of protoctists?', 'They are eukaryotic and mostly single-celled', ['They always have cellulose walls', 'They are all multicellular animals', 'They contain no genetic material'], 'Protoctists have nuclei and other eukaryotic features, while many exist as single cells.'],
  ],
  '4BI1-2': [
    ['Which organelle is the main site of aerobic respiration?', 'Mitochondrion', ['Ribosome', 'Vacuole', 'Cell wall'], 'Aerobic respiration occurs mainly in mitochondria, releasing usable energy for cell processes.'],
    ['Why does water enter a plant root hair cell from dilute soil solution?', 'The soil has higher water potential than the cell sap', ['Active transport pumps water outward', 'The cell wall is completely impermeable', 'The soil has lower water potential'], 'Water moves by osmosis from higher to lower water potential across the partially permeable membrane.'],
    ['What is the role of amylase in digestion?', 'It breaks starch into smaller sugars', ['It breaks protein into amino acids', 'It emulsifies lipids', 'It absorbs glucose into blood'], 'Amylase catalyses hydrolysis of starch, producing smaller carbohydrate molecules such as maltose.'],
    ['Which blood vessel carries oxygenated blood from the lungs to the heart?', 'Pulmonary vein', ['Pulmonary artery', 'Vena cava', 'Hepatic portal vein'], 'The pulmonary vein returns oxygen-rich blood from lung capillaries to the left atrium.'],
    ['What causes air to enter the lungs during inhalation?', 'Thoracic volume rises and pressure falls below atmospheric pressure', ['Thoracic pressure rises above atmospheric pressure', 'The diaphragm relaxes upward', 'The ribs move down and inward'], 'Contraction of the diaphragm and external intercostals expands the chest and lowers its pressure.'],
    ['Which response helps lower body temperature?', 'Sweating and skin vasodilation', ['Shivering and vasoconstriction', 'Reduced sweat production', 'Hair erection'], 'Evaporation of sweat removes heat while wider skin arterioles increase heat transfer at the surface.'],
    ['What is the function of xylem vessels?', 'Transport water and mineral ions and provide support', ['Transport sucrose only', 'Carry nerve impulses', 'Produce antibodies'], 'Lignified xylem forms continuous tubes that carry water upward and strengthen the plant.'],
    ['Which hormone lowers blood glucose concentration?', 'Insulin', ['Glucagon', 'Adrenaline', 'Testosterone'], 'Insulin promotes glucose uptake and glycogen formation, reducing the glucose concentration in blood.'],
  ],
  '4BI1-3': [
    ['Where does fertilisation normally occur in the human female reproductive system?', 'Oviduct', ['Uterus', 'Ovary', 'Cervix'], 'An ovum and sperm usually fuse in the oviduct before the early embryo reaches the uterus.'],
    ['Which process produces genetically different gametes?', 'Meiosis', ['Mitosis', 'Binary fission', 'Cloning'], 'Meiosis halves chromosome number and creates variation through independent assortment and crossing over.'],
    ['Two heterozygous parents have genotypes Bb and Bb. What is the chance of bb?', '25%', ['0%', '50%', '75%'], 'The possible offspring genotypes are BB, Bb, Bb and bb, so one of four is bb.'],
    ['In molecular genetics, what is a gene?', 'A length of DNA that codes for a functional product', ['A complete set of chromosomes', 'Any visible characteristic', 'A type of cell membrane'], 'A gene is a nucleotide sequence carrying information used to make a protein or functional RNA.'],
    ['Which change can be inherited by offspring?', 'A mutation in a gamete-producing cell', ['A scar on the skin', 'Increased muscle from exercise', 'A suntan'], 'Only genetic changes that enter gametes can be transmitted through fertilisation to offspring.'],
    ['What is the role of the placenta?', 'It permits exchange between maternal and fetal blood supplies', ['It mixes the two blood supplies directly', 'It produces sperm cells', 'It digests food for the mother'], 'The placenta provides a large exchange surface while keeping maternal and fetal blood separate.'],
    ['Why does sexual reproduction increase variation?', 'Gametes from two parents combine different alleles', ['Every offspring is a clone', 'Mitosis creates identical alleles', 'Only one parent contributes DNA'], 'Meiosis and random fertilisation produce new allele combinations in each sexually produced offspring.'],
    ['Which statement describes a dominant allele?', 'It affects the phenotype when one copy is present', ['It is always the most common allele', 'It can appear only in females', 'It is expressed only with two copies'], 'In a heterozygote, one dominant allele is sufficient to influence the observed characteristic.'],
  ],
  '4BI1-4': [
    ['What is the main purpose of random quadrat sampling?', 'To obtain an unbiased estimate of abundance', ['To count only the largest organisms', 'To eliminate natural variation', 'To measure air pressure'], 'Random placement reduces selection bias, making the sample more representative of the habitat.'],
    ['Which organisms begin most food chains by capturing light energy?', 'Producers', ['Decomposers', 'Secondary consumers', 'Parasites'], 'Photosynthetic producers convert light energy into chemical energy available to other trophic levels.'],
    ['Why is less energy available at each higher trophic level?', 'Energy is lost in respiration, waste and uneaten material', ['Energy is created by predators', 'All biomass is fully digested', 'Consumers stop respiring'], 'Only part of consumed biomass becomes new biomass; much energy is transferred to the surroundings.'],
    ['Which process returns carbon dioxide to the atmosphere?', 'Respiration', ['Photosynthesis', 'Nitrification', 'Protein synthesis'], 'Respiration oxidises organic compounds and releases carbon dioxide as a metabolic product.'],
    ['What is eutrophication commonly caused by?', 'Nitrate or phosphate enrichment of water', ['Removal of all mineral ions', 'Reduced light from an eclipse', 'Increased dissolved oxygen'], 'Nutrient enrichment drives algal growth, followed by decomposition that lowers dissolved oxygen.'],
    ['Which relationship benefits both species?', 'Mutualism', ['Predation', 'Parasitism', 'Competition'], 'In mutualism, each interacting species gains a benefit that can improve survival or reproduction.'],
    ['Why can deforestation increase atmospheric carbon dioxide?', 'Less photosynthesis occurs and stored carbon may be released', ['Trees begin absorbing more carbon', 'Respiration stops everywhere', 'Fossil fuels form immediately'], 'Removing trees reduces carbon fixation, while burning or decay transfers stored carbon to the air.'],
    ['What does a population consist of?', 'Members of one species living in the same area', ['All species on Earth', 'Only producers in a habitat', 'All non-living factors'], 'A population is defined by a single species, a shared location and the same time period.'],
  ],
  '4BI1-5': [
    ['Why are microorganisms used in industrial fermenters?', 'They convert substrates into useful products rapidly', ['They remove every need for sterile conditions', 'They cannot mutate', 'They always photosynthesise'], 'Controlled microbial metabolism can produce enzymes, foods, medicines and other useful substances efficiently.'],
    ['Why must a fermenter be kept sterile?', 'To prevent contamination and competition from unwanted microbes', ['To remove the production organism', 'To stop all enzyme activity', 'To increase mutation rate'], 'Sterility protects product purity and prevents contaminants using nutrients or producing harmful substances.'],
    ['What is selective breeding?', 'Choosing parents with desired phenotypes to reproduce', ['Changing DNA directly in a laboratory', 'Allowing only random mating', 'Cloning every wild organism'], 'Repeatedly breeding selected parents increases the frequency of alleles associated with desired traits.'],
    ['Which is a potential benefit of genetic modification in crops?', 'Introducing a specific pest-resistance gene', ['Guaranteeing zero ecological impact', 'Removing all genetic variation', 'Preventing every plant disease'], 'Genetic engineering can add a defined characteristic, although benefits and risks still require evaluation.'],
    ['Why is mycoprotein production efficient?', 'Fungi can grow rapidly on relatively little land', ['It requires mature cattle', 'It uses no nutrients', 'It produces only cellulose'], 'Fungal biomass grows in fermenters and can provide protein with lower land demand than livestock.'],
    ['What do pectinase enzymes help produce?', 'Clearer fruit juice with higher yield', ['Solid plastic polymers', 'Atmospheric nitrogen', 'Human insulin directly'], 'Pectinase breaks down pectin in plant cell walls, helping release and clarify fruit juice.'],
    ['Which technique makes genetically identical plants quickly?', 'Tissue culture', ['Cross-pollination', 'Natural selection', 'Meiosis'], 'Small explants divide by mitosis under sterile conditions, producing clones of the parent plant.'],
    ['Why are biological controls sometimes preferred to pesticides?', 'They can target a pest with less persistent chemical pollution', ['They always remove every pest instantly', 'They cannot affect food webs', 'They never require monitoring'], 'A carefully assessed natural enemy may reduce pesticide residues, though non-target effects must still be managed.'],
  ],
};

const chemistryFacts = {
  '4CH1-1': [
    ['Which change is physical rather than chemical?', 'Melting pure ice', ['Burning magnesium', 'Rusting iron', 'Neutralising acid'], 'Melting changes state without forming a new substance, and the water molecules remain unchanged.'],
    ['An atom has 17 protons and 18 electrons. What is its charge?', '−1', ['+1', '0', '−17'], 'One more electron than proton gives one additional negative elementary charge overall.'],
    ['Why does molten sodium chloride conduct electricity?', 'Its ions are free to move', ['It contains free neutrons', 'Its ions lose charge', 'It becomes a simple metal'], 'Melting frees charged ions from fixed lattice positions so they can carry current.'],
    ['What type of bonding holds atoms together in methane?', 'Covalent bonding', ['Ionic bonding', 'Metallic bonding', 'Hydrogen ions'], 'Carbon and hydrogen atoms share electron pairs, which is covalent bonding.'],
    ['Calculate the relative formula mass of CO₂ using C = 12 and O = 16.', '44', ['28', '32', '56'], 'One carbon contributes 12 and two oxygens contribute 32, giving 44 in total.'],
    ['How many moles are in 9.0 g of water, Mr = 18?', '0.50 mol', ['2.0 mol', '9.0 mol', '162 mol'], 'Amount in moles equals mass divided by molar mass: 9.0 ÷ 18 = 0.50 mol.'],
    ['What is the empirical formula for equal moles of magnesium and oxygen atoms?', 'MgO', ['Mg₂O', 'MgO₂', 'Mg₂O₃'], 'An equal 1:1 mole ratio gives one magnesium atom for each oxygen atom in the formula.'],
    ['At the cathode during electrolysis, what happens to positive ions?', 'They gain electrons', ['They lose electrons', 'They gain protons', 'They become negative ions'], 'Cations are attracted to the negative cathode and are reduced by accepting electrons.'],
    ['What pH is expected for a neutral aqueous solution at room temperature?', '7', ['0', '5', '14'], 'A neutral solution has equal hydrogen and hydroxide ion concentrations and pH 7 at room temperature.'],
    ['Which apparatus most accurately delivers 25.0 cm³ in a titration?', 'Volumetric pipette', ['Beaker', 'Measuring cylinder', 'Evaporating basin'], 'A volumetric pipette is calibrated to transfer one precise fixed volume.'],
  ],
  '4CH1-2': [
    ['Why do Group 1 metals become more reactive down the group?', 'The outer electron is lost more easily', ['Their nuclei have fewer protons', 'They gain electrons more easily', 'Their atoms become smaller'], 'Increased shielding and distance weaken attraction between the nucleus and the outer electron.'],
    ['What gas forms when a reactive metal reacts with dilute hydrochloric acid?', 'Hydrogen', ['Oxygen', 'Chlorine', 'Carbon dioxide'], 'Metal plus hydrochloric acid produces a chloride salt and hydrogen gas.'],
    ['Which gas turns damp red litmus paper blue?', 'Ammonia', ['Chlorine', 'Carbon dioxide', 'Hydrogen'], 'Ammonia dissolves in water to form an alkaline solution that turns red litmus blue.'],
    ['What flame colour indicates sodium ions?', 'Yellow', ['Lilac', 'Brick red', 'Blue-green'], 'Excited sodium ions emit a characteristic intense yellow light in a flame test.'],
    ['Which metal can be extracted from its oxide using carbon?', 'Iron', ['Potassium', 'Aluminium', 'Magnesium'], 'Iron is below carbon in the reactivity series, so carbon can reduce iron oxide.'],
    ['What observation identifies chloride ions after acidifying with nitric acid?', 'A white precipitate with silver nitrate', ['A blue precipitate with sodium hydroxide', 'A lilac flame', 'A squeaky pop'], 'Silver ions react with chloride ions to form insoluble white silver chloride.'],
    ['Why is aluminium resistant to further corrosion?', 'A protective oxide layer forms', ['It contains no electrons', 'It is completely unreactive', 'It dissolves in water instantly'], 'A thin, adherent aluminium oxide film blocks oxygen and water from the metal beneath.'],
    ['Which gas relights a glowing splint?', 'Oxygen', ['Hydrogen', 'Carbon dioxide', 'Ammonia'], 'Oxygen supports combustion strongly enough to relight a glowing wooden splint.'],
    ['What is oxidation in terms of electrons?', 'Loss of electrons', ['Gain of electrons', 'Sharing neutrons', 'Loss of protons'], 'Oxidation is electron loss, while reduction is electron gain in redox reactions.'],
    ['Why is cryolite used when extracting aluminium?', 'It lowers the operating temperature of electrolysis', ['It supplies carbon dioxide', 'It makes aluminium less conductive', 'It removes every impurity'], 'Dissolving alumina in molten cryolite lowers the melting point and reduces energy demand.'],
  ],
  '4CH1-3': [
    ['What happens to temperature in an exothermic reaction mixture?', 'It increases as energy is transferred to the surroundings', ['It always falls', 'It remains exactly constant', 'It reaches absolute zero'], 'Exothermic reactions release energy, often causing the reaction mixture and surroundings to warm.'],
    ['Why does increasing temperature usually increase reaction rate?', 'Particles collide more often and more exceed activation energy', ['Particles become larger', 'Activation energy becomes zero', 'Concentration always decreases'], 'Higher kinetic energy increases collision frequency and the fraction of successful collisions.'],
    ['How does a catalyst increase reaction rate?', 'It provides a pathway with lower activation energy', ['It increases product energy permanently', 'It is consumed completely', 'It changes the equilibrium constant'], 'A lower-energy route allows a greater fraction of collisions to lead to reaction.'],
    ['For an equilibrium, what does “dynamic” mean?', 'Forward and reverse reactions continue at equal rates', ['All particles stop moving', 'Reactant and product amounts must be equal', 'Only the forward reaction occurs'], 'At dynamic equilibrium both reactions continue, but equal rates keep macroscopic concentrations constant.'],
    ['Increasing pressure favours which side of a gaseous equilibrium?', 'The side with fewer gas molecules', ['The side with more gas molecules', 'The side with more solids', 'Neither side under any condition'], 'The system reduces pressure by shifting toward the side containing fewer moles of gas.'],
    ['What is the effect of increasing concentration of a reactant?', 'More frequent collisions generally increase rate', ['Particles stop colliding', 'Activation energy doubles', 'The reactant becomes a catalyst'], 'More reactant particles per unit volume increases collision frequency and therefore reaction rate.'],
    ['Which bond-energy calculation gives reaction enthalpy?', 'Energy to break bonds minus energy released forming bonds', ['Energy formed minus energy broken', 'All bond energies multiplied', 'Product mass minus reactant mass'], 'Bond breaking absorbs energy and bond formation releases it, so the difference gives the overall change.'],
    ['Why does powdered solid react faster than equal-mass lumps?', 'It has a larger surface area', ['It has fewer particles', 'It lowers product concentration', 'It stops diffusion'], 'Greater exposed surface permits more reactant collisions per second.'],
    ['In the Haber process, why is a compromise temperature used?', 'It balances equilibrium yield and reaction rate', ['It removes the catalyst', 'It makes pressure irrelevant', 'It prevents all reverse reaction'], 'Lower temperature favours ammonia yield but slows reaction, so industry chooses an economic compromise.'],
    ['What does a reaction-profile peak represent?', 'The activation energy barrier', ['The final product mass', 'The catalyst concentration', 'The equilibrium yield'], 'The peak is the high-energy transition region reactant particles must reach for reaction.'],
  ],
  '4CH1-4': [
    ['What is the general formula of an alkane?', 'CₙH₂ₙ₊₂', ['CₙH₂ₙ', 'CₙH₂ₙ₋₂', 'CₙHₙ'], 'Open-chain saturated hydrocarbons have the homologous-series formula CₙH₂ₙ₊₂.'],
    ['Which observation shows an alkene reacted with bromine water?', 'Orange bromine water becomes colourless', ['A white precipitate forms', 'A glowing splint relights', 'The solution turns blue'], 'Bromine adds across the carbon-carbon double bond, removing its orange colour.'],
    ['What are the products of complete hydrocarbon combustion?', 'Carbon dioxide and water', ['Carbon monoxide only', 'Carbon and hydrogen', 'Methane and oxygen'], 'With sufficient oxygen, carbon is fully oxidised to carbon dioxide and hydrogen to water.'],
    ['Which functional group is present in ethanol?', 'Hydroxyl, −OH', ['Carboxyl, −COOH', 'Carbon-carbon double bond', 'Ester link only'], 'Ethanol belongs to the alcohol homologous series because it contains an −OH group.'],
    ['Oxidation of ethanol can produce which carboxylic acid?', 'Ethanoic acid', ['Methanoic acid', 'Propanoic acid', 'Butanoic acid'], 'A two-carbon primary alcohol oxidises to the corresponding two-carbon carboxylic acid.'],
    ['What forms when an alcohol reacts with a carboxylic acid?', 'An ester and water', ['An alkane and hydrogen', 'A metal and oxygen', 'Only carbon dioxide'], 'Esterification is a condensation reaction joining the two molecules and releasing water.'],
    ['What monomer makes poly(ethene)?', 'Ethene', ['Ethane', 'Ethanol', 'Ethanoic acid'], 'Ethene molecules open their double bonds and join in addition polymerisation.'],
    ['What process separates crude oil into useful fractions?', 'Fractional distillation', ['Filtration', 'Neutralisation', 'Electrolysis'], 'Hydrocarbons separate by different boiling ranges in a fractionating column.'],
    ['Why is cracking useful?', 'It converts long hydrocarbons into shorter alkanes and alkenes', ['It removes all carbon atoms', 'It makes only water', 'It joins monomers into proteins'], 'Cracking supplies higher-demand fuels and reactive alkene feedstocks from heavier fractions.'],
    ['What feature defines members of a homologous series?', 'Same functional group and general formula', ['Identical molecular formula', 'Exactly the same boiling point', 'No trend in properties'], 'Members share a functional group and general formula, with successive compounds differing by CH₂.'],
  ],
};

const physicsFacts = {
  '4PH1-1': [
    ['A car changes velocity from 5 m/s to 17 m/s in 4 s. Calculate its acceleration.', '3 m/s²', ['4.25 m/s²', '5.5 m/s²', '12 m/s²'], 'Acceleration is change in velocity divided by time: (17 − 5) ÷ 4 = 3 m/s².'],
    ['A 6 kg object accelerates at 2.5 m/s². Calculate the resultant force.', '15 N', ['2.4 N', '8.5 N', '30 N'], 'Newton’s second law gives F = ma = 6 × 2.5 = 15 newtons.'],
    ['Calculate the momentum of a 900 kg car moving at 20 m/s.', '18,000 kg m/s', ['45 kg m/s', '920 kg m/s', '180,000 kg m/s'], 'Momentum equals mass multiplied by velocity: 900 × 20 = 18,000 kg m/s.'],
    ['A force of 40 N acts 0.25 m from a pivot. Calculate the moment.', '10 N m', ['0.00625 N m', '40.25 N m', '160 N m'], 'Moment equals force multiplied by perpendicular distance: 40 × 0.25 = 10 N m.'],
    ['Why does a parachutist eventually fall at terminal velocity?', 'Drag grows until it equals weight', ['Weight becomes zero', 'Mass is lost continuously', 'Gravity switches off'], 'At terminal velocity upward drag balances downward weight, so resultant force and acceleration are zero.'],
  ],
  '4PH1-2': [
    ['A 12 V supply drives 3 A through a resistor. Calculate its resistance.', '4 Ω', ['0.25 Ω', '9 Ω', '36 Ω'], 'Ohm’s law gives R = V/I = 12 ÷ 3 = 4 ohms.'],
    ['Calculate the charge transferred by a 2.5 A current in 40 s.', '100 C', ['16 C', '42.5 C', '1,000 C'], 'Charge equals current multiplied by time: Q = It = 2.5 × 40 = 100 coulombs.'],
    ['An appliance uses 230 V and 4 A. Calculate its power.', '920 W', ['57.5 W', '234 W', '2,300 W'], 'Electrical power is P = VI = 230 × 4 = 920 watts.'],
    ['Why are domestic appliances connected in parallel?', 'Each receives full supply voltage and works independently', ['Current must be identical in every appliance', 'One switch controls every circuit', 'Total resistance always increases'], 'Parallel branches share the supply potential difference and one open branch does not break the others.'],
    ['What is the purpose of a fuse?', 'It melts and breaks the circuit if current is too high', ['It raises the supply voltage', 'It stores electrical charge permanently', 'It makes live wires safe to touch'], 'Excess current heats the fuse wire until it melts, interrupting the circuit before dangerous overheating.'],
  ],
  '4PH1-3': [
    ['A wave has frequency 50 Hz and wavelength 0.40 m. Calculate its speed.', '20 m/s', ['0.008 m/s', '50.4 m/s', '125 m/s'], 'Wave speed is v = fλ = 50 × 0.40 = 20 m/s.'],
    ['Which electromagnetic wave is commonly used for satellite communication?', 'Microwaves', ['Ultraviolet', 'Gamma rays', 'Visible red only'], 'Selected microwave frequencies pass through the atmosphere and can carry modulated communication signals.'],
    ['What happens to light entering glass from air at an angle?', 'It slows and bends toward the normal', ['It speeds up and bends away', 'Its frequency becomes zero', 'It always reflects completely'], 'Glass has a higher refractive index, so light slows while frequency stays constant and the ray bends toward the normal.'],
    ['What property determines the pitch of a sound?', 'Frequency', ['Amplitude', 'Speed only', 'Wavelength only regardless of speed'], 'Higher-frequency vibrations are heard as higher pitch, while amplitude mainly affects loudness.'],
    ['Which condition is required for total internal reflection?', 'Light travels from higher to lower refractive index above the critical angle', ['Light enters a denser medium below normal', 'Frequency must be zero', 'The surface must absorb all light'], 'Beyond the critical angle in the optically denser medium, no refracted ray emerges.'],
  ],
  '4PH1-4': [
    ['A machine receives 500 J and transfers 350 J usefully. Calculate its efficiency.', '70%', ['30%', '143%', '850%'], 'Efficiency is useful output divided by total input: 350 ÷ 500 × 100 = 70%.'],
    ['A 25 N force moves a box 6 m in its direction. Calculate the work done.', '150 J', ['4.17 J', '31 J', '300 J'], 'Work done equals force times distance moved in the force direction: 25 × 6 = 150 J.'],
    ['Calculate the gravitational potential energy gained by 3 kg raised 5 m, using g = 10 N/kg.', '150 J', ['15 J', '50 J', '600 J'], 'Gravitational potential energy change is mgh = 3 × 10 × 5 = 150 J.'],
    ['A device transfers 1,200 J in 30 s. Calculate its power.', '40 W', ['0.025 W', '36 W', '36,000 W'], 'Power is energy transferred per unit time: 1,200 ÷ 30 = 40 watts.'],
    ['Which energy resource is renewable?', 'Wind', ['Coal', 'Natural gas', 'Uranium fuel'], 'Wind is continually replenished by atmospheric processes, unlike finite fossil or nuclear fuels.'],
  ],
  '4PH1-5': [
    ['A sample has mass 240 g and volume 80 cm³. Calculate its density.', '3 g/cm³', ['0.33 g/cm³', '160 g/cm³', '19,200 g/cm³'], 'Density equals mass divided by volume: 240 ÷ 80 = 3 g/cm³.'],
    ['A force of 600 N acts on 0.20 m². Calculate the pressure.', '3,000 Pa', ['120 Pa', '600.2 Pa', '30,000 Pa'], 'Pressure is force divided by area: 600 ÷ 0.20 = 3,000 pascals.'],
    ['Why does gas pressure rise when a sealed gas is heated at constant volume?', 'Particles move faster and collide more forcefully and often', ['Particles lose all kinetic energy', 'The container volume becomes infinite', 'Gas particles stop hitting walls'], 'Heating raises average kinetic energy, increasing the rate of momentum transfer to container walls.'],
    ['What happens during melting of a pure solid at constant pressure?', 'Temperature stays constant while internal energy increases', ['Temperature rises without limit', 'Particles lose all energy', 'Mass becomes zero'], 'Energy supplied weakens intermolecular bonds during the state change rather than raising temperature.'],
    ['Why does liquid pressure increase with depth?', 'More liquid above produces greater weight per unit area', ['Density becomes zero', 'Gravity acts upward', 'The surface pressure disappears'], 'A deeper point supports a taller column of liquid, so the force per unit area is greater.'],
  ],
  '4PH1-6': [
    ['Which direction is the magnetic field outside a bar magnet?', 'From north pole to south pole', ['From south to north outside', 'Clockwise around every magnet', 'There is no external field'], 'By convention, external magnetic field lines leave north and enter south.'],
    ['What increases the strength of an electromagnet?', 'Increasing current in its coil', ['Removing the coil', 'Using no core and no current', 'Opening the circuit'], 'A larger coil current produces a stronger magnetic field, especially with a soft-iron core.'],
    ['What causes a force on a current-carrying wire in a magnetic field?', 'Interaction between the wire’s field and the external field', ['The wire loses all electrons', 'Gravity becomes stronger', 'The current becomes mass'], 'The two magnetic fields interact, producing a force whose direction follows the motor rule.'],
    ['When is an emf induced in a coil?', 'When magnetic flux through the coil changes', ['Whenever the coil is stationary in an unchanging field', 'Only when resistance is infinite', 'When no field is present'], 'Electromagnetic induction requires a changing magnetic flux linkage through the circuit.'],
    ['An ideal transformer has 200 primary turns, 50 secondary turns and 240 V input. Calculate output voltage.', '60 V', ['15 V', '240 V', '960 V'], 'Vs/Vp = Ns/Np, so Vs = 240 × 50/200 = 60 volts.'],
  ],
  '4PH1-7': [
    ['What is the structure of an alpha particle?', 'Two protons and two neutrons', ['One electron', 'One proton only', 'An electromagnetic wave'], 'An alpha particle is a helium nucleus containing two protons and two neutrons.'],
    ['Which radiation is most penetrating?', 'Gamma', ['Alpha', 'Beta', 'Visible light from the source only'], 'Gamma radiation is highly penetrating and generally requires thick lead or concrete shielding.'],
    ['What does half-life mean?', 'Time for the number of undecayed nuclei or activity to halve', ['Time for every nucleus to decay', 'Time for mass to double', 'Time for temperature to halve'], 'Radioactive decay is random, but a large sample shows a characteristic halving time.'],
    ['Why is background radiation subtracted from a source count?', 'To estimate the count caused by the source alone', ['To increase random error', 'To stop the source decaying', 'To change the detector efficiency'], 'The detector records environmental events as well as the source, so background must be accounted for.'],
    ['What change occurs in beta-minus decay?', 'A neutron changes to a proton and an electron is emitted', ['A proton becomes two neutrons', 'The nucleus emits four nucleons', 'No nuclear change occurs'], 'Beta-minus decay increases atomic number by one while leaving mass number unchanged.'],
  ],
  '4PH1-8': [
    ['What keeps a planet in approximately circular orbit around a star?', 'Gravitational force providing centripetal acceleration', ['No resultant force', 'Magnetic repulsion', 'Air resistance in space'], 'Gravity continuously changes the direction of velocity toward the star, producing orbital acceleration.'],
    ['What is the main sequence stage of a star powered by?', 'Fusion of hydrogen nuclei into helium', ['Chemical burning of coal', 'Fission of iron', 'Reflection of planet light only'], 'Core hydrogen fusion releases energy and provides outward pressure balancing gravity.'],
    ['What does red-shift in distant galaxies indicate?', 'Their light wavelengths are stretched as they recede', ['They are all moving toward Earth', 'Their temperatures are exactly equal', 'Light has stopped travelling'], 'Systematic red-shift is evidence that distant galaxies are generally moving away as space expands.'],
    ['Which evidence supports the Big Bang model?', 'Cosmic microwave background radiation', ['Absence of all background radiation', 'A static unchanging Universe only', 'Every galaxy being blue-shifted'], 'The near-uniform microwave background is interpreted as cooled radiation from the early hot Universe.'],
    ['What final remnant can a Sun-like star form?', 'White dwarf', ['Black hole directly', 'Neutron star after every case', 'New planet only'], 'After a red-giant phase and planetary nebula, the exposed core remains as a white dwarf.'],
  ],
};

function factItems(facts) {
  return Object.entries(facts).flatMap(([topicCode, rows]) => rows.map(([prompt, correct, wrong, explanation]) => item(topicCode, prompt, correct, wrong, explanation)));
}

const subjects = [
  ['subj_edexcel_igcse_math', '4MA1', topics.math, math],
  ['subj_edexcel_igcse_biology', '4BI1', topics.biology, factItems(biologyFacts)],
  ['subj_edexcel_igcse_chemistry', '4CH1', topics.chemistry, factItems(chemistryFacts)],
  ['subj_edexcel_igcse_physics', '4PH1', topics.physics, factItems(physicsFacts)],
].map(([subjectId, specificationCode, subjectTopics, items]) => ({
  subjectId,
  specificationCode,
  topics: subjectTopics.map(([code, title, objective]) => ({ code, title, objective })),
  questions: items.map((source, index) => mcq(specificationCode, index, source)),
}));

const batch = {
  batchId: 'edexcel-igcse-beta-001',
  status: 'approved_for_production',
  examTypeId: 'edexcel_igcse',
  provenance: [
    ['International GCSE Mathematics A (4MA1) specification', 'https://qualifications.pearson.com/content/dam/pdf/International%20GCSE/Mathematics%20A/2016/Specification%20and%20sample%20assessments/international-gcse-in-mathematics-spec-a.pdf'],
    ['International GCSE Biology (4BI1) specification', 'https://qualifications.pearson.com/content/dam/pdf/International%20GCSE/Biology/2017/specification-and-sample-assessments/international-gcse-biology-2017-specification1.pdf'],
    ['International GCSE Chemistry (4CH1) specification', 'https://qualifications.pearson.com/content/dam/pdf/International%20GCSE/Chemistry/2017/specification-and-sample-assessments/international-gcse-chemistry-2017-specification.pdf'],
    ['International GCSE Physics (4PH1) specification', 'https://qualifications.pearson.com/content/dam/pdf/International%20GCSE/Physics/2017/specification-and-sample-assessments/international-gcse-physics-2017-specification.pdf'],
  ].map(([title, url]) => ({ publisher: 'Pearson Edexcel', title, url, use: 'curriculum_blueprint_only' })),
  review: { authoringMethod: 'original_curriculum_aligned', qualityAssurance: 'automated_beta', automatedChecksAt: generatedAt },
  release: {
    channel: 'beta',
    contentLabel: 'Original BrillaPrep practice content aligned to the published Pearson Edexcel syllabus; not official Pearson material.',
    officialExamBoardContent: false,
    feedbackEnabled: true,
  },
  subjects,
};

const validation = validateQuestionBatch(batch, { mode: 'production' });
if (!validation.valid) throw new Error(`Generated batch failed validation:\n${validation.errors.join('\n')}`);

const sql = (value) => value == null ? 'NULL' : `'${String(value).replaceAll("'", "''")}'`;
const topicId = (spec, code) => `topic_edx_${spec.toLowerCase()}_${code.split('-').at(-1).toLowerCase()}`;
const syllabusTopicId = (spec, code) => `st_edx_${spec.toLowerCase()}_${code.split('-').at(-1).toLowerCase()}`;
const specificationIds = { '4MA1': 'spec_edexcel_igcse_math', '4BI1': 'spec_edexcel_igcse_biology', '4CH1': 'spec_edexcel_igcse_chemistry', '4PH1': 'spec_edexcel_igcse_physics' };
const issueMetadata = { '4MA1': 'Issue 2 - November 2017', '4BI1': 'Issue 3 - September 2024', '4CH1': 'Issue 3 - September 2024', '4PH1': 'Issue 4 - September 2024' };

const blueprint = [];
blueprint.push('-- 104: Edexcel International GCSE beta-bank syllabus blueprint.');
blueprint.push('-- Curriculum aligned from official specifications; no past-paper wording or source-paper claims.');
blueprint.push('PRAGMA foreign_keys = ON;');
const questionGroups = [];
for (const subject of batch.subjects) {
  const provenance = batch.provenance.find((entry) => entry.title.includes(subject.specificationCode));
  blueprint.push(`UPDATE subject_specifications SET specification_year = ${sql(issueMetadata[subject.specificationCode])}, valid_to = NULL, syllabus_pdf_url = ${sql(provenance.url)}, updated_at = CURRENT_TIMESTAMP WHERE id = ${sql(specificationIds[subject.specificationCode])} AND subject_id = ${sql(subject.subjectId)} AND exam_type_id = 'edexcel_igcse' AND exam_board_id = 'board_edexcel';`);
  for (const [order, topic] of subject.topics.entries()) {
    const dbTopicId = topicId(subject.specificationCode, topic.code);
    const dbSyllabusTopicId = syllabusTopicId(subject.specificationCode, topic.code);
    blueprint.push(`INSERT OR IGNORE INTO topics (id, subject_id, name, slug, description, display_order) VALUES (${sql(dbTopicId)}, ${sql(subject.subjectId)}, ${sql(topic.title)}, ${sql(topic.code.toLowerCase())}, ${sql(topic.objective)}, ${order + 1});`);
    blueprint.push(`INSERT OR IGNORE INTO syllabus_topics (id, specification_id, topic_code, title, description, assessment_objectives, display_order) VALUES (${sql(dbSyllabusTopicId)}, ${sql(specificationIds[subject.specificationCode])}, ${sql(topic.code)}, ${sql(topic.title)}, ${sql(topic.objective)}, ${sql(JSON.stringify(['AO1', 'AO2', 'AO3']))}, ${order + 1});`);
  }
  const statements = subject.questions.map((question) => {
    const options = JSON.stringify(question.options.map(({ label, text }) => `${label}. ${text}`));
    return `INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, time_limit, syllabus_topic_id, command_word, assessment_objective, exam_board_id) VALUES (${sql(question.id)}, ${sql(topicId(subject.specificationCode, question.topicCode))}, ${sql(subject.subjectId)}, 'edexcel_igcse', ${sql(question.prompt)}, 'multiple_choice', ${sql(options)}, ${sql(question.correctAnswer)}, ${sql(question.workedSolution)}, ${sql(question.difficulty)}, ${question.marks}, ${question.marks}, 90, ${sql(syllabusTopicId(subject.specificationCode, question.topicCode))}, ${sql(question.commandWord)}, ${sql(question.assessmentObjective)}, 'board_edexcel');`;
  });
  questionGroups.push({ specificationCode: subject.specificationCode.toLowerCase(), statements: statements.slice(0, 20), part: 1 });
  questionGroups.push({ specificationCode: subject.specificationCode.toLowerCase(), statements: statements.slice(20), part: 2 });
}

const outBatch = resolve(root, 'content/batches/edexcel-igcse-beta-001.json');
await mkdir(dirname(outBatch), { recursive: true });
await writeFile(outBatch, `${JSON.stringify(batch, null, 2)}\n`);
const migrationOutputs = [];
const blueprintPath = resolve(root, 'database/migrations/104_edexcel_igcse_beta_blueprint.sql');
await writeFile(blueprintPath, `${blueprint.join('\n')}\n`);
migrationOutputs.push(blueprintPath);
for (const [groupIndex, group] of questionGroups.entries()) {
  const number = 105 + groupIndex;
  const name = `${number}_edexcel_igcse_beta_${group.specificationCode}_part_${group.part}.sql`;
  const lines = [
    `-- ${number}: Original BrillaPrep ${group.specificationCode.toUpperCase()} beta questions, part ${group.part}.`,
    '-- Original practice content; not official Pearson questions.',
    'PRAGMA foreign_keys = ON;',
    ...group.statements,
  ];
  if (groupIndex === questionGroups.length - 1) {
    lines.push('CREATE TABLE IF NOT EXISTS _migration_112_guard (valid INTEGER NOT NULL CHECK (valid = 1));');
    lines.push('DELETE FROM _migration_112_guard;');
    lines.push(`INSERT INTO _migration_112_guard(valid) SELECT CASE WHEN (SELECT COUNT(*) FROM questions WHERE id LIKE 'q_edx_%_b001_%') = 160 THEN 1 ELSE 0 END;`);
    lines.push('DROP TABLE _migration_112_guard;');
  }
  const output = resolve(root, `database/migrations/${name}`);
  await writeFile(output, `${lines.join('\n')}\n`);
  migrationOutputs.push(output);
}
console.log(JSON.stringify({ validation, outBatch, migrations: migrationOutputs }, null, 2));
