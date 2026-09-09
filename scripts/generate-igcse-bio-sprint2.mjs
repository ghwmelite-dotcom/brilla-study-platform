import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeQuestionText, validateQuestionBatch } from './question-content-lib.mjs';

const sourceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputRootArgument = process.argv.indexOf('--output-root');
if (outputRootArgument >= 0 && !process.argv[outputRootArgument + 1]) throw new Error('--output-root requires a path');
const outputRoot = outputRootArgument >= 0 ? resolve(process.argv[outputRootArgument + 1]) : sourceRoot;
const generatedAt = '2026-09-09T12:00:00Z';
const labels = ['A', 'B', 'C', 'D'];
const batchId = 'igcse-bio-sprint2-001';
const subjectId = 'subj_igcse_biology';
const examTypeId = 'igcse';
const examBoardId = 'board_cambridge';
const contentLabel = "Original BrillaPrep practice content aligned to the published Cambridge IGCSE Biology (0610) syllabus; not official Cambridge International, WAEC or NSMQ examination material. Use the enabled feedback channel to report corrections.";
const releaseSourceUrl = 'https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-igcse-biology-0610/';

const cambridgeSource = {
  publisher: 'Cambridge International Education',
  title: 'Cambridge IGCSE Biology (0610) syllabus',
  url: releaseSourceUrl,
  use: 'curriculum_blueprint_only',
};

const mcq = (topicCode, difficulty, prompt, correct, wrong, solution, commandWord, assessmentObjective) => ({ topicCode, type: 'multiple_choice', difficulty, prompt, correct, wrong, solution, commandWord, assessmentObjective });

const topics = [
  {
    key: 'cells',
    topicId: 'topic_igcse_bio_cells',
    code: '0610-CELLS',
    title: 'Cells and Microscopy',
    objective: 'Apply knowledge of cell structure, specialised cells and magnification calculations with the light microscope.',
    questions: [
      mcq('0610-CELLS', 'easy', 'Which cell structure is present in a plant cell but absent from an animal cell?', 'Cell wall', ['Cell membrane', 'Cytoplasm', 'Mitochondrion'],
        'Plant cells have a cellulose cell wall, chloroplasts and a large permanent vacuole in addition to the structures they share with animal cells. The cell membrane, cytoplasm and mitochondria are found in both cell types, so none of them can distinguish a plant cell from an animal cell.', 'Identify', 'AO1'),
      mcq('0610-CELLS', 'easy', "A student's drawing of a cell is 45 mm long. The actual cell is 0.15 mm long. What is the magnification of the drawing?", '×300', ['×30', '×6.75', '×3000'],
        'Magnification = image size ÷ actual size = 45 mm ÷ 0.15 mm = 300, so the drawing is ×300 the size of the real cell. ×30 comes from a slip in the division, ×6.75 results from multiplying instead of dividing (45 × 0.15), and ×3000 comes from misplacing the decimal point.', 'Calculate', 'AO2'),
      mcq('0610-CELLS', 'medium', 'A microscope has an eyepiece lens of ×10 and objective lenses of ×4, ×10 and ×40. Which combination gives a total magnification of ×400?', 'Eyepiece ×10 with objective ×40', ['Eyepiece ×10 with objective ×4', 'Eyepiece ×10 with objective ×10', 'Objective ×40 alone without the eyepiece'],
        'Total magnification = eyepiece magnification × objective magnification = 10 × 40 = 400. The ×4 objective gives only ×40 and the ×10 objective gives ×100, and a light microscope image is always viewed through the eyepiece, so the objective cannot be used alone.', 'Apply', 'AO2'),
      mcq('0610-CELLS', 'medium', 'A student viewing a slide under high power finds the image blurry. Which part of the microscope should the student adjust to make the image sharp?', 'The fine adjustment knob', ['The coarse adjustment knob', 'The mirror, to admit more light', 'The eyepiece, changing it for a higher-power lens'],
        'At high power only the fine adjustment knob should be used to focus, because the objective lens is very close to the slide and the coarse knob could drive the lens into the slide. The mirror or lamp changes brightness rather than sharpness, and swapping the eyepiece changes magnification without focusing the image.', 'Apply', 'AO2'),
      mcq('0610-CELLS', 'medium', 'Root hair cells absorb water from the soil efficiently. Which feature of a root hair cell increases the surface area available for absorption?', 'A long hair-like projection extending into the soil', ['A thick cellulose cell wall', 'A large number of chloroplasts', 'A permanent vacuole filled with starch grains'],
        'The root hair is a slender extension of the cell that greatly increases the surface area to volume ratio for the absorption of water and mineral ions. Root hair cells grow underground so they contain no chloroplasts, their cell wall stays thin to let water pass, and the vacuole holds cell sap rather than starch grains.', 'Apply', 'AO2'),
      mcq('0610-CELLS', 'medium', 'Which row correctly matches a specialised animal cell with its adaptation?', 'Ciliated cell — has cilia that beat to move mucus along the airways', ['Red blood cell — has a large nucleus to store more DNA', 'Muscle cell — contains chloroplasts to release energy', 'Nerve cell — has a thick cell wall for protection'],
        'Ciliated cells line the trachea and bronchi, and their beating cilia move mucus carrying trapped particles away from the lungs. Red blood cells lose their nucleus so they can carry more haemoglobin, animal cells never contain chloroplasts, and cell walls occur in plant cells, not in nerve cells.', 'Identify', 'AO1'),
    ],
  },
  {
    key: 'molecules',
    topicId: 'topic_igcse_bio_molecules',
    code: '0610-MOLEC',
    title: 'Biological Molecules and Enzymes',
    objective: 'Apply knowledge of food tests, biological molecules and enzyme action, specificity and denaturation.',
    questions: [
      mcq('0610-MOLEC', 'easy', 'Which reagent is used to test a food sample for starch?', 'Iodine solution', ["Benedict's solution", 'Biuret solution', 'Ethanol'],
        "Iodine solution turns from yellow-brown to blue-black when starch is present. Benedict's solution tests for reducing sugars, the Biuret test detects protein, and ethanol is used in the emulsion test for lipids, so only iodine detects starch.", 'Identify', 'AO1'),
      mcq('0610-MOLEC', 'easy', 'Which chemical element is present in all proteins but absent from carbohydrates and fats?', 'Nitrogen', ['Carbon', 'Hydrogen', 'Oxygen'],
        'Proteins always contain nitrogen in the amino groups of their amino acids, whereas carbohydrates and fats contain only carbon, hydrogen and oxygen. Carbon, hydrogen and oxygen are each found in all three food groups, so they cannot be the distinguishing element.', 'Identify', 'AO1'),
      mcq('0610-MOLEC', 'medium', "A food sample is heated with Benedict's solution and the mixture changes from blue to brick-red. What does this result show?", 'A reducing sugar is present in the sample', ['Starch is present in the sample', 'Protein is present in the sample', 'The sample contains no sugar of any kind'],
        "When heated, reducing sugars such as glucose and maltose reduce the blue copper(II) ions in Benedict's solution to a brick-red precipitate of copper(I) oxide. Starch is a non-reducing sugar and gives no colour change with Benedict's, protein is detected by the Biuret test, and the brick-red colour itself proves that a sugar is present.", 'Apply', 'AO2'),
      mcq('0610-MOLEC', 'medium', 'Amylase in human saliva works best at about 37 °C. Why does the enzyme stop working when it is boiled?', 'The high temperature changes the shape of the active site so the substrate no longer fits', ['The enzyme molecules are used up by the reaction', 'Boiling changes the substrate into a different molecule', 'The enzyme works fastest at 100 °C so the reaction runs out of substrate'],
        'Boiling denatures the enzyme: the bonds holding the protein in its shape break, the active site changes shape and the substrate can no longer bind to it. Enzymes are catalysts and are not used up by the reaction, boiling the enzyme does not alter the starch substrate, and enzymes are denatured rather than accelerated at 100 °C.', 'Explain', 'AO2'),
      mcq('0610-MOLEC', 'medium', 'Which enzyme digests protein in the stomach?', 'Pepsin (a protease)', ['Amylase', 'Lipase', 'Maltase'],
        'The stomach lining secretes the protease pepsin, which works well in the acidic conditions of the stomach and breaks proteins into shorter polypeptides. Amylase digests starch, lipase digests fats and maltase digests maltose, so none of them can act on protein.', 'Identify', 'AO1'),
      mcq('0610-MOLEC', 'medium', 'Which statement best explains why an enzyme catalyses only one reaction?', 'The shape of the active site is complementary to only one substrate molecule', ['Enzymes are destroyed after catalysing one reaction', 'Each enzyme works equally well at any temperature and pH', 'All substrate molecules have exactly the same shape'],
        "Each enzyme's active site has a shape that fits only its own substrate, like a lock and key, so the enzyme catalyses only one reaction. Enzymes remain unchanged after the reaction, each enzyme has its own narrow optimum temperature and pH, and substrates differ in shape, which is exactly why specificity arises.", 'Explain', 'AO2'),
    ],
  },
  {
    key: 'nutrition',
    topicId: 'topic_igcse_bio_nutrition',
    code: '0610-NUTR',
    title: 'Nutrition and Digestion',
    objective: 'Apply knowledge of photosynthesis, leaf structure, the human digestive system and a balanced diet.',
    questions: [
      mcq('0610-NUTR', 'easy', 'Which gas do plants take in for photosynthesis?', 'Carbon dioxide', ['Oxygen', 'Nitrogen', 'Hydrogen'],
        'During photosynthesis plants take in carbon dioxide and water and, using light energy trapped by chlorophyll, produce glucose and oxygen. Oxygen is a product rather than a reactant, and nitrogen and hydrogen gases play no direct part in the process.', 'Recall', 'AO1'),
      mcq('0610-NUTR', 'easy', 'In which part of a leaf does most photosynthesis take place?', 'Palisade mesophyll cells', ['Lower epidermis', 'Guard cells', 'Spongy mesophyll air spaces'],
        'Palisade mesophyll cells lie near the upper surface of the leaf, are packed with chloroplasts and receive the most light, so they carry out most photosynthesis. The lower epidermis contains few chloroplasts, guard cells mainly control the stomatal pore, and the air spaces allow gases to circulate rather than photosynthesise.', 'Identify', 'AO1'),
      mcq('0610-NUTR', 'easy', 'Which organ produces saliva containing amylase to begin the digestion of starch?', 'Salivary glands', ['Stomach', 'Liver', 'Large intestine'],
        'The salivary glands secrete saliva containing salivary amylase, which starts breaking starch down into maltose in the mouth. The stomach digests protein with pepsin, the liver makes bile, and the large intestine absorbs water; none of these organs secretes amylase.', 'Identify', 'AO1'),
      mcq('0610-NUTR', 'easy', 'Which nutrient group is the main source of energy in the human diet?', 'Carbohydrates', ['Vitamins', 'Mineral ions', 'Fibre (roughage)'],
        'Carbohydrates such as starch and sugars are broken down to glucose, which is respired to release energy, making them the main energy source in the diet. Vitamins and mineral ions are needed in small amounts to keep tissues healthy, and fibre cannot be digested and only aids peristalsis.', 'Recall', 'AO1'),
      mcq('0610-NUTR', 'medium', 'A pondweed is exposed to increasing light intensity while carbon dioxide concentration and temperature are kept constant. What happens to the rate of photosynthesis?', 'It increases and then levels off', ['It increases without limit', 'It stays exactly the same', 'It decreases steadily'],
        'Light is the limiting factor at first, so the rate rises as light intensity increases, but once another factor such as carbon dioxide concentration becomes limiting, the rate levels off. The rate cannot rise forever while other factors are fixed, cannot stay unchanged while light is limiting, and does not fall when more light becomes available.', 'Apply', 'AO2'),
      mcq('0610-NUTR', 'medium', 'Which vessels transport dissolved sugars from the leaves to the rest of the plant?', 'Phloem', ['Xylem', 'Root hair cells', 'Guard cells'],
        'The phloem transports sucrose and amino acids from sources such as the leaves to sinks such as roots and fruits by translocation. Xylem carries water and mineral ions upwards, root hair cells absorb water from the soil, and guard cells open and close stomata; none of these transports sugar.', 'Identify', 'AO1'),
    ],
  },
  {
    key: 'movement',
    topicId: 'topic_igcse_bio_cell_transport',
    code: '0610-MOVE',
    title: 'Movement into and out of Cells',
    objective: 'Apply knowledge of diffusion, osmosis and active transport across partially permeable membranes.',
    questions: [
      mcq('0610-MOVE', 'easy', 'Diffusion is the net movement of particles from a region of…', 'higher concentration to a region of lower concentration', ['lower concentration to a region of higher concentration', 'high temperature to a region of low temperature', 'high pressure to a region of low pressure'],
        'Diffusion is the net movement of particles down their concentration gradient, from a region of higher concentration to a region of lower concentration, as a result of their random motion. Movement from low to high concentration is active transport, and temperature or pressure differences are not part of the definition of diffusion.', 'Recall', 'AO1'),
      mcq('0610-MOVE', 'easy', 'By which process does water move into a root hair cell from the soil?', 'Osmosis', ['Active transport', 'Transpiration', 'Diffusion of mineral ions'],
        'The soil water has a higher water potential than the cell sap, so water moves across the partially permeable cell membrane into the root hair cell by osmosis. Active transport moves mineral ions rather than water, transpiration is the loss of water vapour from leaves, and the diffusion of mineral ions does not describe the movement of water.', 'Identify', 'AO1'),
      mcq('0610-MOVE', 'easy', 'Active transport moves particles…', 'against their concentration gradient, using energy from respiration', ['down their concentration gradient without using energy', 'only when the concentrations are equal on both sides', 'only across fully permeable membranes'],
        'Active transport moves particles from a region of lower concentration to a region of higher concentration, against the gradient, using energy released by respiration and carrier proteins in the membrane. Movement down the gradient without energy is diffusion, equal concentrations give no net useful transport, and fully permeable membranes cannot control which particles move.', 'Recall', 'AO1'),
      mcq('0610-MOVE', 'easy', 'Which gas diffuses out of a leaf during the day when photosynthesis is faster than respiration?', 'Oxygen', ['Carbon dioxide', 'Nitrogen', 'Glucose'],
        'In bright light photosynthesis produces more oxygen than respiration uses, so the excess oxygen diffuses out of the leaf down its concentration gradient. Carbon dioxide diffuses into the leaf as a raw material for photosynthesis, nitrogen is not exchanged by the leaf, and glucose is a dissolved sugar, not a gas.', 'Apply', 'AO2'),
      mcq('0610-MOVE', 'medium', 'A bag made of partially permeable membrane containing a concentrated sugar solution is weighed, then placed in pure water for 30 minutes. What happens to the mass of the bag, and why?', 'It increases because water enters the bag by osmosis', ['It decreases because sugar leaves the bag by osmosis', 'It stays the same because water cannot cross the membrane', 'It decreases because water leaves the bag by diffusion'],
        'The pure water outside the bag has a higher water potential than the sugar solution inside, so water moves into the bag across the partially permeable membrane by osmosis and the mass rises. Sugar molecules are too large to cross the membrane, water crosses the membrane readily, and osmosis drives water into the more concentrated solution, not out of it.', 'Apply', 'AO2'),
      mcq('0610-MOVE', 'medium', 'The concentration of nitrate ions is lower in the soil than inside a root hair cell, yet the cell continues to absorb nitrate ions. Which process is responsible?', 'Active transport', ['Diffusion', 'Osmosis', 'Transpiration'],
        'The nitrate ions are moving from a region of lower concentration to a region of higher concentration, against their gradient, so energy from respiration is required and the process is active transport. Diffusion would move the ions the opposite way, osmosis moves only water, and transpiration is the evaporation of water from leaves.', 'Apply', 'AO2'),
    ],
  },
  {
    key: 'respiration',
    topicId: 'topic_igcse_bio_respiration',
    code: '0610-RESP',
    title: 'Respiration and Gas Exchange',
    objective: 'Apply knowledge of aerobic and anaerobic respiration, the breathing system and alveolar gas exchange.',
    questions: [
      mcq('0610-RESP', 'easy', 'Which gas is released as a waste product of aerobic respiration?', 'Carbon dioxide', ['Oxygen', 'Nitrogen', 'Methane'],
        'Aerobic respiration breaks down glucose using oxygen, releasing energy and producing carbon dioxide and water; the carbon dioxide diffuses into the blood and is exhaled from the lungs. Oxygen is a reactant rather than a product, nitrogen passes through the lungs unchanged, and methane is not produced by human cells.', 'Recall', 'AO1'),
      mcq('0610-RESP', 'easy', 'Where does gas exchange between the air and the blood take place in the lungs?', 'In the alveoli', ['In the trachea', 'In the bronchi', 'In the larynx'],
        'The alveoli are tiny air sacs with thin walls, a moist surface, a rich blood supply and a huge surface area, which makes them the site of gas exchange. The trachea, bronchi and larynx are conducting airways with thick walls, and no significant gas exchange occurs across them.', 'Identify', 'AO1'),
      mcq('0610-RESP', 'medium', "Why does a person's breathing rate increase during vigorous exercise?", 'To supply more oxygen to the muscles and remove the extra carbon dioxide produced by respiration', ['To cool the body by blowing out warm air', 'To pump blood faster around the body', 'To help the stomach digest food more quickly'],
        'During exercise the muscle cells respire faster, using more oxygen and releasing more carbon dioxide, so faster and deeper breathing brings in extra oxygen and expels the extra carbon dioxide to keep the blood gases balanced. Breathing is not a cooling mechanism, the heart rather than the lungs pumps blood faster, and the breathing rate does not affect digestion.', 'Explain', 'AO2'),
      mcq('0610-RESP', 'medium', 'Which word equation summarises anaerobic respiration in yeast?', 'Glucose → alcohol + carbon dioxide', ['Glucose → lactic acid', 'Glucose + oxygen → carbon dioxide + water', 'Carbon dioxide + water → glucose + oxygen'],
        'In yeast, anaerobic respiration (fermentation) converts glucose to alcohol (ethanol) and carbon dioxide, releasing a small amount of energy without using oxygen. Glucose → lactic acid is anaerobic respiration in human muscle, glucose + oxygen → carbon dioxide + water is aerobic respiration, and carbon dioxide + water → glucose + oxygen is photosynthesis.', 'Identify', 'AO1'),
      mcq('0610-RESP', 'medium', 'Which feature of the alveoli shortens the diffusion distance for gases?', 'Walls that are only one cell thick', ['A thick layer of cartilage around each alveolus', 'A dry inner surface', 'A small total surface area'],
        'The alveolar wall and the surrounding capillary wall are each only one cell thick, so oxygen and carbon dioxide have a very short distance to diffuse between the air and the blood. Cartilage supports the larger airways and would slow diffusion, the alveolar surface is moist so gases can dissolve, and the total surface area of the alveoli is very large rather than small.', 'Identify', 'AO1'),
      mcq('0610-RESP', 'medium', 'What happens to the diaphragm and the rib cage when a person breathes in?', 'The diaphragm contracts and flattens, and the ribs move up and out', ['The diaphragm relaxes and domes upwards, and the ribs move up and out', 'The diaphragm contracts and flattens, and the ribs move down and in', 'The diaphragm relaxes and domes upwards, and the ribs move down and in'],
        'Breathing in (inhalation) is driven by the diaphragm contracting and flattening while the external intercostal muscles pull the ribs up and out, increasing the volume of the thorax so air is drawn in. A relaxing, domed diaphragm with the ribs moving down and in describes breathing out, and the mixed combinations cannot produce the volume increase needed for inhalation.', 'Apply', 'AO2'),
    ],
  },
  {
    key: 'reproduction',
    topicId: 'topic_igcse_bio_reproduction',
    code: '0610-REPRO',
    title: 'Reproduction and Development',
    objective: 'Apply knowledge of mitosis and meiosis, flower structure, pollination, fertilisation and human development.',
    questions: [
      mcq('0610-REPRO', 'easy', 'Which type of cell division produces two genetically identical daughter cells for growth and repair?', 'Mitosis', ['Meiosis', 'Fertilisation', 'Mutation'],
        'Mitosis produces two daughter cells with the same chromosome number and identical genes as the parent cell, which is essential for growth and the repair of damaged tissues. Meiosis produces genetically varied gametes, fertilisation is the fusion of gametes rather than a division, and mutation is a change in DNA, not a cell division process.', 'Recall', 'AO1'),
      mcq('0610-REPRO', 'easy', 'In an insect-pollinated flower, where are the male gametes made?', 'In the anthers, inside pollen grains', ['In the stigma', 'In the ovary wall', 'In the sepals'],
        'The anthers produce pollen grains, and each pollen grain contains the male gametes. The stigma receives pollen during pollination, the ovary contains the female ovules, and the sepals protect the flower bud, so none of these structures produces male gametes.', 'Identify', 'AO1'),
      mcq('0610-REPRO', 'medium', 'Which statement about asexual reproduction is correct?', 'It produces offspring that are genetically identical to the single parent', ['It requires two parents and the fusion of gametes', 'It produces offspring showing wide genetic variation', 'It occurs only in flowering plants'],
        'Asexual reproduction involves one parent and no fusion of gametes, so the offspring are clones that are genetically identical to the parent. Two parents and gamete fusion describe sexual reproduction, which is also the process that generates wide variation, and asexual reproduction occurs in bacteria, fungi and animals as well as in plants.', 'Identify', 'AO1'),
      mcq('0610-REPRO', 'medium', 'After pollination and fertilisation in a flowering plant, which structure develops into a seed?', 'The ovule', ['The ovary', 'The petal', 'The stigma'],
        'Once the male gamete fuses with the female gamete inside the ovule, the fertilised ovule develops into the seed, while the whole ovary develops into the fruit around it. The ovary forms the fruit rather than the seed, and the petals and stigma wither and die after fertilisation.', 'Apply', 'AO2'),
      mcq('0610-REPRO', 'medium', 'What is one advantage of cross-pollination over self-pollination?', 'It increases genetic variation in the offspring', ['It guarantees that every flower is pollinated', 'It does not require wind or insects', 'It produces offspring identical to the parent'],
        'Cross-pollination mixes gametes from two different plants, increasing genetic variation and giving the population a better chance of surviving environmental change. Cross-pollination is actually less reliable than self-pollination, still depends on wind or insects, and produces varied offspring rather than identical ones.', 'Explain', 'AO2'),
      mcq('0610-REPRO', 'medium', 'What is the main function of the amniotic fluid that surrounds a developing fetus?', 'It cushions and protects the fetus from mechanical damage', ['It supplies oxygen to the fetus', 'It digests food for the fetus', 'It produces the hormones of pregnancy'],
        'The amniotic sac and its fluid act as a shock absorber, supporting the fetus and protecting it from bumps and sudden pressure changes. Oxygen and nutrients diffuse across the placenta, the fetus does not digest food before birth, and pregnancy hormones are secreted by the ovary and placenta rather than by the fluid.', 'Identify', 'AO1'),
    ],
  },
  {
    key: 'genetics',
    topicId: 'topic_igcse_bio_genetics',
    code: '0610-GEN',
    title: 'Genetics and Inheritance',
    objective: 'Apply knowledge of genes and chromosomes, monohybrid crosses, mutation and patterns of variation.',
    questions: [
      mcq('0610-GEN', 'easy', 'Which statement correctly defines a gene?', 'A length of DNA that codes for a specific protein', ['A whole chromosome found in the nucleus', 'A protein that carries oxygen in the blood', 'A type of cell found in the gametes'],
        'A gene is a section of a DNA molecule whose base sequence codes for the amino acid sequence of a particular protein. A chromosome carries many genes, an oxygen-carrying protein such as haemoglobin is the product of a gene rather than the gene itself, and genes are lengths of DNA, not cells.', 'Recall', 'AO1'),
      mcq('0610-GEN', 'easy', 'How many chromosomes are there in a normal human sperm cell?', '23', ['46', '22', '44'],
        'Gametes are produced by meiosis and contain half the diploid number — one set of 23 chromosomes — so that the diploid number of 46 is restored at fertilisation. 46 is the number in a body cell, 22 counts only the autosomes and omits the sex chromosome, and 44 is double the autosome number.', 'Recall', 'AO1'),
      mcq('0610-GEN', 'medium', 'Two heterozygous tall pea plants (Tt) are crossed. What is the expected ratio of tall to short plants in the offspring?', '3 tall : 1 short', ['1 tall : 1 short', 'All tall', '1 tall : 2 heterozygous : 1 short'],
        'The cross Tt × Tt gives genotypes 1 TT : 2 Tt : 1 tt, and the TT and Tt plants are all tall because T is dominant, so the phenotype ratio is 3 tall to 1 short. The 1 : 1 ratio comes from a Tt × tt test cross, all tall offspring would require at least one TT parent, and 1 : 2 : 1 is the genotype ratio rather than the phenotype ratio.', 'Apply', 'AO2'),
      mcq('0610-GEN', 'medium', 'Which factors are known to increase the rate of mutation?', 'Ionising radiation and certain chemicals', ['Antibiotics and vaccines', 'A balanced diet and regular exercise', 'High altitude and low humidity'],
        'Ionising radiation such as X-rays and ultraviolet light, together with certain chemicals called mutagens, damage DNA and increase the rate of mutation. Antibiotics and vaccines act on pathogens and the immune system rather than on DNA, diet and exercise affect the phenotype without altering base sequences, and altitude and humidity have no known mutagenic effect.', 'Recall', 'AO1'),
      mcq('0610-GEN', 'medium', 'Which statement about a dominant allele is correct?', 'It is expressed in the phenotype when only one copy is present', ['It is always the most common allele in a population', 'It must be inherited from both parents to have an effect', 'It is carried only on the X chromosome'],
        'A dominant allele shows its effect in a heterozygote, so only one copy is needed for the trait to appear in the phenotype. Dominance concerns expression rather than frequency, so a dominant allele can be rare, one copy is sufficient rather than two, and dominant alleles occur on every chromosome, not only the X chromosome.', 'Identify', 'AO1'),
      mcq('0610-GEN', 'medium', 'Which human characteristic shows continuous variation?', 'Height', ['Blood group', 'Ability to roll the tongue', 'Sex'],
        'Height can take any value within a range and is influenced by many genes together with environmental factors such as diet, so it shows continuous variation. Blood group, tongue-rolling ability and sex each fall into distinct categories with no intermediates, which is discontinuous variation.', 'Apply', 'AO2'),
    ],
  },
  {
    key: 'ecology',
    topicId: 'topic_igcse_bio_ecology',
    code: '0610-ECOL',
    title: 'Ecology and Ecosystems',
    objective: 'Apply knowledge of food chains, energy flow, the carbon and nitrogen cycles and human impacts on ecosystems.',
    questions: [
      mcq('0610-ECOL', 'easy', 'Which organisms feed on dead organic material and release nutrients back into the soil?', 'Decomposers such as bacteria and fungi', ['Producers such as green plants', 'Herbivores such as caterpillars', 'Carnivores such as hawks'],
        'Decomposers — mainly bacteria and fungi — secrete enzymes onto dead matter, digest it and release mineral ions such as nitrates back into the soil for plants to reuse. Producers make their own food by photosynthesis, while herbivores and carnivores eat living or freshly killed organisms rather than decomposing dead material.', 'Recall', 'AO1'),
      mcq('0610-ECOL', 'easy', 'Which process removes carbon dioxide from the atmosphere in the carbon cycle?', 'Photosynthesis', ['Respiration', 'Combustion of fossil fuels', 'Decomposition'],
        'Green plants, algae and phytoplankton take in carbon dioxide for photosynthesis and lock the carbon into organic molecules such as glucose. Respiration, combustion and decomposition all release carbon dioxide back into the atmosphere rather than removing it.', 'Recall', 'AO1'),
      mcq('0610-ECOL', 'medium', 'In the food chain grass → grasshopper → frog → hawk, what happens to the amount of energy available at each successive trophic level?', 'It decreases because energy is lost in respiration, movement and waste', ['It increases because each animal eats more than the last', 'It stays exactly the same at every level', 'It decreases only at the final trophic level'],
        'At each transfer much of the energy is used for respiration and movement or lost in waste and uneaten material, so only a small fraction passes on and the available energy decreases at every level. Energy cannot increase along a food chain, transfer is never completely efficient, and the losses happen at every step rather than only at the last.', 'Apply', 'AO2'),
      mcq('0610-ECOL', 'medium', 'Nitrate fertiliser is washed from a field into a lake. Which sequence of events is most likely to follow?', 'Algal bloom → death of algae → bacterial decomposition → oxygen depletion in the water', ['Clearer water → more underwater plants → more fish', 'Immediate death of all fish from nitrate poisoning', 'Less plant growth because nitrates are toxic to algae'],
        'The extra nitrate triggers rapid algal growth (an algal bloom); when the algae die, decomposer bacteria multiply and respire, using up the dissolved oxygen so fish and other aquatic animals suffocate. Nitrates are nutrients rather than fast-acting poisons, they promote rather than prevent algal growth, and the outcome is oxygen loss rather than clearer water.', 'Apply', 'AO2'),
      mcq('0610-ECOL', 'medium', 'Which process in the nitrogen cycle returns nitrogen gas to the atmosphere?', 'Denitrification by bacteria that convert nitrates to nitrogen gas', ['Nitrogen fixation by lightning', 'Nitrification by nitrifying bacteria', 'Absorption of nitrates by plant roots'],
        'Denitrifying bacteria in waterlogged soils convert nitrates back into nitrogen gas, which escapes into the atmosphere. Nitrogen fixation and nitrification move nitrogen in the opposite direction — from nitrogen gas or ammonium compounds towards nitrates — and the absorption of nitrates by roots removes nitrate from the soil rather than returning nitrogen to the atmosphere.', 'Identify', 'AO1'),
      mcq('0610-ECOL', 'medium', 'A lake contains pike, perch, water fleas and algae, together with the water, dissolved minerals and sunlight. Which term describes this whole system?', 'An ecosystem', ['A population', 'A community, with no abiotic factors', 'A single food chain'],
        'The system includes all the living organisms interacting with one another and with the non-living factors such as water, minerals and light, which together make up an ecosystem. A population is the members of one species only, a community is all the living organisms without the non-living environment, and a food chain describes just one feeding relationship.', 'Recall', 'AO1'),
    ],
  },
];

// Prod-verified topic rows (queried from prod D1 on 2026-09-09; the display_order
// 1-8 rows match prod-patch 096_seed_topics_for_empty_subjects.sql and the
// display_order 9 row matches migration 271_cambridge_topic_remediation_part_1.sql).
// The foundation migration
// INSERT OR IGNOREs these copies for fresh baselines and scratch tests; on prod
// every id already exists, so the inserts no-op. This is also the allowlist of
// prod-verified topic ids for this batch.
// [id, subjectId, parentId, name, slug, description, theoryContent, keyFormulas, displayOrder, createdAt]
const canonicalTopicRows = [
  ['topic_igcse_bio_cells', subjectId, null, 'Cells and Microscopy', 'cells-and-microscopy', 'Cell structure, specialised cells and microscope use', null, null, 1, '2026-08-13T00:00:00.000Z'],
  ['topic_igcse_bio_molecules', subjectId, null, 'Biological Molecules and Enzymes', 'biological-molecules-and-enzymes', 'Carbohydrates, proteins, lipids and enzyme action', null, null, 2, '2026-08-13T00:00:00.000Z'],
  ['topic_igcse_bio_nutrition', subjectId, null, 'Nutrition and Digestion', 'nutrition-and-digestion', 'Human and plant nutrition, the digestive system', null, null, 3, '2026-08-13T00:00:00.000Z'],
  ['topic_igcse_bio_transport', subjectId, null, 'Transport in Plants and Animals', 'transport-in-plants-and-animals', 'Xylem, phloem, the heart and circulatory system', null, null, 4, '2026-08-13T00:00:00.000Z'],
  ['topic_igcse_bio_respiration', subjectId, null, 'Respiration and Gas Exchange', 'respiration-and-gas-exchange', 'Aerobic and anaerobic respiration, breathing and gas exchange', null, null, 5, '2026-08-13T00:00:00.000Z'],
  ['topic_igcse_bio_reproduction', subjectId, null, 'Reproduction and Development', 'reproduction-and-development', 'Asexual and sexual reproduction in plants and humans', null, null, 6, '2026-08-13T00:00:00.000Z'],
  ['topic_igcse_bio_genetics', subjectId, null, 'Genetics and Inheritance', 'genetics-and-inheritance', 'DNA, genes, monohybrid inheritance and variation', null, null, 7, '2026-08-13T00:00:00.000Z'],
  ['topic_igcse_bio_ecology', subjectId, null, 'Ecology and Ecosystems', 'ecology-and-ecosystems', 'Food chains, nutrient cycles and human impacts', null, null, 8, '2026-08-13T00:00:00.000Z'],
  ['topic_igcse_bio_cell_transport', subjectId, null, 'Movement into and out of Cells', 'movement-into-and-out-of-cells', 'Diffusion, osmosis and active transport across cell membranes', null, null, 9, '2026-08-26T00:00:00.000Z'],
];

const usedTopicIds = new Set(topics.map((topic) => topic.topicId));
const usedCanonicalRows = canonicalTopicRows.filter(([id]) => usedTopicIds.has(id));

for (const topic of topics) {
  const row = canonicalTopicRows.find(([topicId]) => topicId === topic.topicId);
  if (!row) throw new Error(`${topic.key}: topic id ${topic.topicId} is not a prod-verified canonical topic`);
  if (row[1] !== subjectId) throw new Error(`${topic.key}: topic id ${topic.topicId} belongs to ${row[1]}, not ${subjectId}`);
  for (const question of topic.questions) {
    if (question.topicCode !== topic.code) throw new Error(`${topic.key}: question uses undeclared topic code ${question.topicCode}`);
  }
}

// --- Batch assembly ----------------------------------------------------------
const officialAttributionPattern = /\b(?:official\s+(?:cambridge|waec|west african examinations council|nsmq)|(?:cambridge|waec|nsmq)[ -](?:approved|endorsed|authored|issued|certified))\b/i;
const nonOfficialDisclaimerGlobalPattern = /\b(?:not|non[- ]?)\s+official\s+(?:waec|west african examinations council|cambridge(?:\s+international)?|nsmq)\b/gi;
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
      : 'This option is a plausible misconception, but it conflicts with the principle established in the worked solution.',
  }));
  return {
    id: `q_igbio_${topic.key}_s2_${String(index + 1).padStart(3, '0')}`,
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
    provenance: [cambridgeSource],
  };
}

const batch = {
  batchId,
  status: 'approved_for_beta',
  examTypeId,
  provenance: [cambridgeSource],
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
    specificationCode: 'BRILLA-0610-IGBIO-S2-001',
    sources: [cambridgeSource],
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
  const topicCounts = new Map();
  for (const question of batch.subjects[0].questions) {
    topicCounts.set(question.topicCode, (topicCounts.get(question.topicCode) ?? 0) + 1);
    if (!Array.isArray(question.provenance) || question.provenance[0]?.use !== 'curriculum_blueprint_only') errors.push(`${question.id}: per-item provenance missing`);
    assertNoFalseOfficialClaim(question.prompt, `${question.id}.prompt`);
    if (question.type !== 'multiple_choice') errors.push(`${question.id}: unexpected type ${question.type}`);
    letterCounts[question.correctAnswer] += 1;
    if (question.options?.length !== 4) errors.push(`${question.id}: MCQ needs exactly 4 options`);
    if (question.marks !== 1) errors.push(`${question.id}: MCQ marks must be 1`);
  }
  const total = batch.subjects[0].questions.length;
  if (total !== 48) errors.push(`expected 48 MCQs, found ${total}`);
  for (const topic of topics) {
    if (topicCounts.get(topic.code) !== 6) errors.push(`${topic.key}: expected 6 questions, found ${topicCounts.get(topic.code) ?? 0}`);
  }
  for (const [letter, count] of Object.entries(letterCounts)) {
    if (count < 6) errors.push(`correct-answer letter ${letter} appears only ${count} times (must vary)`);
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

// Each topic migration stages its rows once in a scratch table (_migration_N_expected)
// and both inserts and fail-closed checks read from it, keeping every migration under
// the remote D1 query limit even with full worked-solution explanations.
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

let migrationNumber = 487;
{
  const name = `${migrationNumber}_igcse_bio_sprint2_foundation.sql`;
  const allTopicIds = usedCanonicalRows.map(([id]) => id);
  const lines = [
    `-- ${migrationNumber}: Foundation guard for Cambridge IGCSE Biology (0610) content sprint 2 (batch ${batchId}).`,
    '-- Original BrillaPrep practice content; not official Cambridge International, WAEC or NSMQ material.',
    '-- Also seeds the prod-canonical IGCSE Biology topic rows (copied from prod-patch',
    '-- 096_seed_topics_for_empty_subjects.sql) for fresh baselines; INSERT OR IGNORE',
    '-- no-ops on prod where every row already exists.',
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
    ...usedCanonicalRows.map(([id, topicSubjectId, parentId, topicName, slug, description, theoryContent, keyFormulas, displayOrder, createdAt]) =>
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
  const name = `${migrationNumber}_igcse_bio_${topic.key}.sql`;
  const lines = [
    `-- ${migrationNumber}: Original BrillaPrep Cambridge IGCSE Biology (0610) ${topic.title} practice questions (batch ${batchId}).`,
    '-- Curriculum-aligned practice content; not official Cambridge International, WAEC or NSMQ material.',
    'PRAGMA foreign_keys = ON;',
    expectedTableDDL(expectedTable),
    `INSERT INTO ${expectedTable} (id, ${canonicalQuestionFields.join(', ')}) VALUES ${topicQuestions.map((question) => {
      const values = questionValues(question);
      return `(${sql(question.id)}, ${canonicalQuestionFields.map((field) => sql(values[field])).join(', ')})`;
    }).join(',\n')};`,
    `CREATE TABLE IF NOT EXISTS ${guardTable} (valid INTEGER NOT NULL CHECK (valid = 1));`,
    `DELETE FROM ${guardTable};`,
    `INSERT INTO ${guardTable}(valid) SELECT CASE WHEN NOT EXISTS (SELECT 1 FROM ${expectedTable} e JOIN questions q ON q.id = e.id WHERE NOT (${canonicalMatchExpected('q', 'e')})) AND NOT EXISTS (SELECT 1 FROM ${expectedTable} e JOIN question_content_releases r ON r.question_id = e.id WHERE NOT (${releaseMatch('r')})) THEN 1 ELSE 0 END;`,
    `INSERT INTO questions (id, ${canonicalQuestionFields.join(', ')}) SELECT id, ${canonicalQuestionFields.join(', ')} FROM ${expectedTable} e WHERE NOT EXISTS (SELECT 1 FROM questions q WHERE q.id = e.id);`,
    `INSERT INTO question_content_releases (question_id, batch_id, quality_assurance, release_channel, content_label, source_url, official_exam_board_content, feedback_enabled) SELECT e.id, '${batchId}', 'automated_beta', 'beta', ${sql(contentLabel)}, ${sql(releaseSourceUrl)}, 0, 1 FROM ${expectedTable} e WHERE NOT EXISTS (SELECT 1 FROM question_content_releases r WHERE r.question_id = e.id);`,
    `DELETE FROM ${guardTable};`,
    `INSERT INTO ${guardTable}(valid) SELECT CASE WHEN (SELECT COUNT(*) FROM questions q JOIN ${expectedTable} e ON e.id = q.id AND ${canonicalMatchExpected('q', 'e')}) = ${ids.length} AND (SELECT COUNT(*) FROM question_content_releases r JOIN ${expectedTable} e ON e.id = r.question_id WHERE ${releaseMatch('r')}) = ${ids.length} AND (SELECT COUNT(*) FROM questions q JOIN topics t ON t.id = q.topic_id AND t.subject_id = q.subject_id JOIN ${expectedTable} e ON e.id = q.id) = ${ids.length} THEN 1 ELSE 0 END;`,
    `DROP TABLE ${guardTable};`,
    `DROP TABLE ${expectedTable};`,
  ];
  await emitMigration(name, lines);
  migrationNumber += 1;
}

{
  const name = `${migrationNumber}_igcse_bio_sprint2_final_guard.sql`;
  const guardTable = `_migration_${migrationNumber}_guard`;
  const allIds = allQuestions.map((question) => question.id);
  const lines = [
    `-- ${migrationNumber}: Final exact-set and relationship guard for Cambridge IGCSE Biology sprint 2 (batch ${batchId}).`,
    'PRAGMA foreign_keys = ON;',
    `CREATE TABLE IF NOT EXISTS ${guardTable} (valid INTEGER NOT NULL CHECK (valid = 1));`,
    `DELETE FROM ${guardTable};`,
    `INSERT INTO ${guardTable}(valid) SELECT CASE WHEN (SELECT COUNT(*) FROM questions q JOIN topics t ON t.id = q.topic_id JOIN question_content_releases r ON r.question_id = q.id WHERE q.id IN (${allIds.map(sql).join(', ')}) AND q.subject_id = '${subjectId}' AND q.subject_id = t.subject_id AND q.exam_type_id = '${examTypeId}' AND q.exam_board_id = '${examBoardId}' AND length(q.explanation) >= 80 AND r.batch_id = '${batchId}' AND r.quality_assurance = 'automated_beta' AND r.release_channel = 'beta' AND r.official_exam_board_content = 0 AND r.feedback_enabled = 1) = 48 AND (SELECT COUNT(*) FROM questions q WHERE q.id IN (${allIds.map(sql).join(', ')}) AND q.question_type = 'multiple_choice' AND json_valid(q.options) AND json_array_length(q.options) = 4 AND q.correct_answer IN ('A','B','C','D')) = 48 AND (SELECT COUNT(*) FROM question_content_releases WHERE batch_id = '${batchId}') = 48 THEN 1 ELSE 0 END;`,
    `DROP TABLE ${guardTable};`,
  ];
  await emitMigration(name, lines);
  migrationNumber += 1;
}

console.log(JSON.stringify({ validation: { valid: validation.valid, warnings: validation.warnings, metrics: validation.metrics }, outBatch, migrations: migrationPaths }, null, 2));
