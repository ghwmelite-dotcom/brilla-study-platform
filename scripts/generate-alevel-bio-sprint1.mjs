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
const batchId = 'alevel-bio-sprint1-001';
const subjectId = 'subj_alevel_biology';
const examTypeId = 'cambridge_a2';
const examBoardId = 'board_cambridge';
const contentLabel = "Original BrillaPrep practice content aligned to the published Cambridge International AS & A Level Biology (9700) syllabus; not official Cambridge International or WAEC examination material. Use the enabled feedback channel to report corrections.";
const theoryContentLabel = 'Original BrillaPrep curriculum-aligned A-Level Biology practice content; not official WAEC or Cambridge International examination material.';
const releaseSourceUrl = 'https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-international-as-and-a-level-biology-9700/';

const cambridgeSource = {
  publisher: 'Cambridge International Education',
  title: 'Cambridge International AS & A Level Biology (9700) syllabus',
  url: releaseSourceUrl,
  use: 'curriculum_blueprint_only',
};

const mcq = (topicCode, difficulty, prompt, correct, wrong, solution, commandWord, assessmentObjective) => ({ topicCode, type: 'multiple_choice', difficulty, prompt, correct, wrong, solution, commandWord, assessmentObjective });
const calc = (topicCode, difficulty, prompt, answer, solution, assessmentObjective = 'AO2') => ({ topicCode, type: 'calculation', difficulty, prompt, answer, solution, commandWord: 'Calculate', assessmentObjective });
const st = (topicCode, difficulty, prompt, parts, commandWord = 'Describe') => ({ topicCode, type: 'structured', difficulty, prompt, parts, commandWord, assessmentObjective: 'AO2' });
const part = (label, text, marks, correctAnswer) => ({ label, text, marks, correctAnswer });

const topics = [
  {
    key: 'cells',
    topicId: 'topic_alevel_bio_cells',
    code: '9700-CELLS',
    title: 'Cells and Biological Molecules',
    objective: 'Apply knowledge of cell ultrastructure and the chemistry of carbohydrates, lipids, proteins and nucleic acids.',
    questions: [
      mcq('9700-CELLS', 'easy', 'Which level of protein structure refers to the sequence of amino acids in a polypeptide chain?', 'Primary structure', ['Secondary structure', 'Tertiary structure', 'Quaternary structure'],
        'The primary structure is the linear sequence of amino acids joined by peptide bonds. Secondary structure is local folding into alpha-helices and beta-pleated sheets held by hydrogen bonds, tertiary structure is the overall three-dimensional fold of one chain, and quaternary structure requires more than one polypeptide subunit.', 'Identify', 'AO1'),
      mcq('9700-CELLS', 'easy', 'Which organelle is the site of protein synthesis (translation) in a eukaryotic cell?', 'Ribosome', ['Lysosome', 'Golgi apparatus', 'Smooth endoplasmic reticulum'],
        'Ribosomes bind messenger RNA and assemble amino acids into polypeptides during translation. Lysosomes contain hydrolytic enzymes for digestion, the Golgi apparatus modifies and packages proteins, and the smooth endoplasmic reticulum synthesises lipids rather than proteins.', 'Identify', 'AO1'),
      mcq('9700-CELLS', 'medium', 'A plant cell is placed in pure water. Which statement describes what happens?', 'Water enters by osmosis and the cell becomes turgid but does not burst', ['Water leaves by osmosis and the cell becomes flaccid', 'Water enters by active transport and the cell bursts', 'There is no net movement of water in either direction'],
        'Pure water has a higher (less negative) water potential than the cell sap, so water moves into the cell by osmosis across the partially permeable membrane. The inelastic cellulose cell wall resists expansion and builds up pressure potential, so the cell becomes turgid rather than bursting.', 'Explain', 'AO2'),
      mcq('9700-CELLS', 'medium', "Which reagent and result confirm the presence of a reducing sugar in a food sample?", "Benedict's reagent, heated, giving a brick-red precipitate", ['Biuret reagent, giving a purple colour', 'Iodine solution, giving a blue-black colour', 'Ethanol followed by water, giving a milky emulsion'],
        "Reducing sugars reduce the blue copper(II) sulfate in Benedict's reagent to brick-red copper(I) oxide when heated. Biuret reagent detects peptide bonds in protein, iodine detects starch, and the ethanol emulsion test detects lipids.", 'Identify', 'AO1'),
      mcq('9700-CELLS', 'hard', 'In a sample of double-stranded DNA, 22% of the bases are adenine. What percentage of the bases are cytosine?', '28%', ['22%', '44%', '56%'],
        "By Chargaff's base-pairing rules A = T, so thymine is also 22% and A + T together make 44%. The remaining 56% is shared equally between guanine and cytosine because G = C, so cytosine is 28%.", 'Calculate', 'AO2'),
      st('9700-CELLS', 'medium', 'A student investigates the biochemical composition of food samples and how amino acids are joined together.', [
        part('a', 'Describe how the student would test a sample for the presence of lipid, including the expected positive result.', 2,
          'Shake the sample with ethanol to dissolve any lipid, then pour the ethanol into water. A cloudy (milky-white) emulsion is a positive result, because the lipid comes out of solution as tiny droplets when diluted.'),
        part('b', 'State the procedure and positive result for testing a sample for a non-reducing sugar.', 2,
          "Boil the sample with dilute hydrochloric acid to hydrolyse the disaccharide, neutralise it, then heat with Benedict's reagent; a brick-red (orange-red) precipitate is the positive result."),
        part('c', 'Explain why the formation of a peptide bond between two amino acids is described as a condensation reaction.', 2,
          'The carboxyl group of one amino acid reacts with the amino group of the other and a molecule of water is released as the peptide bond forms; reactions that join two molecules with the loss of water are called condensation reactions.'),
      ]),
    ],
  },
  {
    key: 'membranes',
    topicId: 'topic_alevel_bio_membranes',
    code: '9700-MEMB',
    title: 'Membranes and Transport',
    objective: 'Explain membrane structure and the mechanisms that move substances into and out of cells.',
    questions: [
      mcq('9700-MEMB', 'easy', "In the fluid mosaic model of the cell surface membrane, what does the word 'mosaic' describe?", 'Protein molecules scattered within the phospholipid bilayer', ['Phospholipids arranged in a single layer', 'Cholesterol molecules forming a rigid frame', 'Carbohydrate chains covering the entire outer surface'],
        'The mosaic is the patchwork of intrinsic and extrinsic proteins embedded in, or attached to, the fluid phospholipid bilayer. Phospholipids form a bilayer rather than a single layer, cholesterol modulates fluidity rather than forming a frame, and carbohydrate chains occur only on some proteins and lipids.', 'Identify', 'AO1'),
      mcq('9700-MEMB', 'easy', 'Facilitated diffusion differs from simple diffusion across a membrane because facilitated diffusion requires...', 'transport proteins such as channel or carrier proteins', ['ATP hydrolysed by carrier proteins', 'vesicles formed from the membrane', 'movement of molecules against their gradient'],
        'Facilitated diffusion moves polar molecules or ions down their concentration gradient through specific channel or carrier proteins; it is passive, so no ATP is needed. Vesicles mediate endocytosis, and moving substances against their gradient is active transport.', 'Identify', 'AO1'),
      mcq('9700-MEMB', 'medium', "A red blood cell is placed in a solution with a lower (more negative) water potential than the cell's cytoplasm. Which outcome is most likely?", 'Water leaves the cell by osmosis and the cell shrinks (crenation)', ['Water enters the cell and it bursts (haemolysis)', 'Water enters by active transport and the cell swells', 'No water movement occurs because the membrane is impermeable to water'],
        'Water moves from the higher water potential inside the cell to the lower water potential outside, across the partially permeable membrane by osmosis. Red blood cells have no cell wall, so the loss of water makes them shrink and develop a spiky, crenated appearance.', 'Explain', 'AO2'),
      mcq('9700-MEMB', 'medium', 'Which process requires both a carrier protein and a supply of ATP?', 'Active transport of mineral ions into root hair cells', ['Facilitated diffusion of glucose into a red blood cell', 'Osmosis of water into a plant cell', 'Simple diffusion of oxygen into an alveolar cell'],
        'Active transport moves substances against their concentration (electrochemical) gradient using carrier proteins powered by ATP, as when root hair cells absorb mineral ions from very dilute soil water. Facilitated diffusion and osmosis follow gradients and need no ATP, and oxygen crosses membranes by simple diffusion.', 'Identify', 'AO1'),
      mcq('9700-MEMB', 'hard', 'The sodium–potassium pump moves three Na⁺ ions out of a neurone and two K⁺ ions in for each ATP hydrolysed. What is the direct consequence of this stoichiometry?', 'The inside of the cell becomes more negative relative to the outside (the pump is electrogenic)', ['The membrane potential across the membrane is abolished', 'Equal numbers of positive charges move in each direction', 'Sodium ions diffuse back into the cell through the pump'],
        'Each cycle of the pump moves a net one positive charge out of the cell (three Na⁺ out versus two K⁺ in), so the pump directly makes the inside more negative and contributes to the resting potential. The stoichiometry is fixed at 3:2, and the pump does not allow sodium to diffuse back through it.', 'Explain', 'AO3'),
      st('9700-MEMB', 'medium', 'A student investigates how substances cross cell surface membranes.', [
        part('a', 'Define the term osmosis.', 2,
          'Osmosis is the net movement of water molecules from a region of higher (less negative) water potential to a region of lower (more negative) water potential across a partially permeable membrane, down the water potential gradient.'),
        part('b', 'Explain why active transport requires a supply of ATP.', 2,
          'Active transport moves substances against their concentration (electrochemical) gradient. Carrier proteins must change shape to move the substance across the membrane, and this shape change is driven by energy released when ATP is hydrolysed to ADP and inorganic phosphate.'),
        part('c', 'Describe the role of cholesterol in the cell surface membrane when the temperature falls.', 2,
          'Cholesterol sits between the phospholipid molecules and, at low temperatures, prevents the phospholipid tails packing too closely together, maintaining fluidity; it therefore buffers the membrane against temperature change and helps stabilise it.'),
      ]),
    ],
  },
  {
    key: 'metabolism',
    topicId: 'topic_alevel_bio_metabolism',
    code: '9700-METAB',
    title: 'Metabolism: Respiration and Photosynthesis',
    objective: 'Analyse the stages of aerobic and anaerobic respiration and of photosynthesis, including ATP synthesis.',
    questions: [
      mcq('9700-METAB', 'easy', 'Which molecule acts as the immediate universal energy currency of cells?', 'ATP', ['DNA', 'Glucose', 'NAD'],
        'ATP (adenosine triphosphate) is hydrolysed to ADP and inorganic phosphate to release energy directly for processes such as active transport and muscle contraction. Glucose and NAD store or carry energy, but that energy must be transferred to ATP during respiration before it can drive cellular work.', 'Identify', 'AO1'),
      mcq('9700-METAB', 'easy', 'In which part of a eukaryotic cell does glycolysis take place?', 'Cytoplasm (cytosol)', ['Mitochondrial matrix', 'Inner mitochondrial membrane', 'Chloroplast stroma'],
        'Glycolysis, the breakdown of glucose to pyruvate with a net gain of two ATP, occurs in the cytoplasm. The link reaction and Krebs cycle occur in the mitochondrial matrix, oxidative phosphorylation on the inner mitochondrial membrane, and the Calvin cycle in the chloroplast stroma.', 'Identify', 'AO1'),
      mcq('9700-METAB', 'medium', 'During the link reaction, each pyruvate molecule is converted into which product?', 'Acetyl coenzyme A', ['Lactate', 'Oxaloacetate', 'Citrate'],
        'In the link reaction, pyruvate is decarboxylated (loses carbon dioxide) and dehydrogenated (reducing NAD), and the resulting two-carbon acetyl group combines with coenzyme A to form acetyl coenzyme A, which then enters the Krebs cycle.', 'Identify', 'AO1'),
      mcq('9700-METAB', 'medium', 'Which enzyme catalyses the fixation of carbon dioxide in the Calvin cycle?', 'RuBisCO (ribulose bisphosphate carboxylase)', ['ATP synthase', 'Amylase', 'DNA polymerase'],
        'RuBisCO catalyses the carboxylation of ribulose bisphosphate (RuBP) with carbon dioxide in the chloroplast stroma, producing two molecules of glycerate-3-phosphate. ATP synthase makes ATP, amylase digests starch, and DNA polymerase replicates DNA.', 'Identify', 'AO1'),
      mcq('9700-METAB', 'hard', 'A metabolic poison allows protons to leak across the inner mitochondrial membrane without passing through ATP synthase, but does not block the electron transport chain. Predict the effect on respiration.', 'Oxygen consumption continues but much less ATP is synthesised', ['Oxygen consumption and ATP synthesis both stop immediately', 'Oxygen consumption stops but ATP synthesis increases', 'Glycolysis stops because NAD cannot be regenerated'],
        'The leak uncouples oxidative phosphorylation: electrons still flow along the transport chain to oxygen, the final electron acceptor, so oxygen consumption continues. However, the proton gradient is dissipated without driving ATP synthase, so ATP yield falls sharply while glycolysis still regenerates NAD.', 'Explain', 'AO3'),
      st('9700-METAB', 'medium', 'A student compares aerobic and anaerobic respiration in yeast and in mammalian muscle.', [
        part('a', 'State the net yield of ATP molecules from glycolysis per molecule of glucose, showing how the figure is obtained.', 2,
          'Net gain of two ATP per glucose: four ATP are produced by substrate-level phosphorylation, but two ATP are consumed phosphorylating glucose and fructose phosphate early in the pathway.'),
        part('b', 'Describe the role of NAD in glycolysis and the link reaction.', 2,
          'NAD is a coenzyme that accepts hydrogen (protons and electrons) removed in dehydrogenation reactions, becoming reduced NAD; the reduced NAD then carries the hydrogen to the electron transport chain, where its energy drives ATP synthesis by oxidative phosphorylation.'),
        part('c', 'Explain why anaerobic respiration releases much less energy per glucose molecule than aerobic respiration.', 2,
          'Without oxygen as the final electron acceptor the electron transport chain stops, so only glycolysis operates, giving a net two ATP; pyruvate is converted to lactate, or to ethanol and carbon dioxide, simply to regenerate NAD, leaving most of the energy locked in those products.'),
      ]),
    ],
  },
];
topics.push(
  {
    key: 'genetics',
    topicId: 'topic_alevel_bio_genetics',
    code: '9700-GEN',
    title: 'Genetics, Inheritance and Evolution',
    objective: 'Apply Mendelian and molecular genetics, including monohybrid crosses and Hardy-Weinberg calculations.',
    questions: [
      mcq('9700-GEN', 'easy', 'What term describes the different versions of a gene found at the same locus on homologous chromosomes?', 'Alleles', ['Chromatids', 'Codons', 'Operons'],
        'Alleles are alternative forms of a gene occupying the same locus on homologous chromosomes, such as the T and t alleles for height in pea plants. Chromatids are the copies of a replicated chromosome, codons are triplets of mRNA bases, and operons are clusters of prokaryotic genes.', 'Identify', 'AO1'),
      mcq('9700-GEN', 'easy', 'In a DNA molecule, which base always pairs with adenine?', 'Thymine', ['Guanine', 'Cytosine', 'Uracil'],
        'In double-stranded DNA, adenine forms two hydrogen bonds with thymine, while guanine forms three hydrogen bonds with cytosine; this complementary base pairing underlies semi-conservative replication. Uracil replaces thymine in RNA and does not occur in DNA.', 'Identify', 'AO1'),
      mcq('9700-GEN', 'medium', 'Two heterozygous tall pea plants (Tt × Tt) are crossed. What proportion of the offspring are expected to be short?', '1/4', ['1/2', '3/4', 'All of them'],
        'A Punnett square for Tt × Tt gives genotypes 1 TT : 2 Tt : 1 tt. Because the tall allele T is dominant, only the homozygous recessive tt genotype expresses the short phenotype, so one in four offspring (25%) is expected to be short.', 'Calculate', 'AO2'),
      mcq('9700-GEN', 'medium', 'Which statement correctly contrasts transcription and translation?', 'Transcription synthesises mRNA from a DNA template in the nucleus; translation assembles a polypeptide at a ribosome', ['Transcription occurs at ribosomes; translation occurs in the nucleus', 'Both processes produce identical copies of the DNA molecule', 'Translation synthesises mRNA; transcription joins amino acids together'],
        'Transcription uses RNA polymerase to build a complementary mRNA copy of a gene in the nucleus. Translation then reads that mRNA codon by codon at ribosomes in the cytoplasm, where transfer RNAs deliver amino acids that are joined by peptide bonds into a polypeptide.', 'Explain', 'AO2'),
      mcq('9700-GEN', 'hard', 'In a population in Hardy–Weinberg equilibrium, the frequency of the dominant allele A is 0.6. What proportion of the population is expected to be heterozygous?', '48%', ['36%', '24%', '16%'],
        'The allele frequency p = 0.6, so q = 1 − p = 0.4. The heterozygote frequency is 2pq = 2 × 0.6 × 0.4 = 0.48, so 48% of the population are heterozygous; the homozygous genotypes are p² = 36% (AA) and q² = 16% (aa).', 'Calculate', 'AO3'),
      st('9700-GEN', 'medium', 'A student studies how a gene is expressed as a polypeptide and how mutations can affect it.', [
        part('a', 'Outline the role of messenger RNA (mRNA) in protein synthesis.', 2,
          'mRNA carries a complementary copy of the base sequence of a gene from the DNA in the nucleus to a ribosome in the cytoplasm; its sequence of codons is then read during translation to determine the order of amino acids in the polypeptide.'),
        part('b', 'Describe the role of transfer RNA (tRNA) during translation.', 2,
          'Each tRNA molecule carries a specific amino acid and has an anticodon complementary to an mRNA codon; tRNAs bind to the ribosome in sequence so that their amino acids are joined by peptide bonds in the order specified by the mRNA.'),
        part('c', 'Explain why a base substitution mutation in a gene does not always change the amino acid sequence of the polypeptide.', 2,
          'The genetic code is degenerate: most amino acids are coded for by more than one codon, so a substitution can produce a different codon that still specifies the same amino acid (a silent mutation), leaving the polypeptide sequence unchanged.'),
      ]),
    ],
  },
  {
    key: 'homeostasis',
    topicId: 'topic_alevel_bio_homeostasis',
    code: '9700-HOME',
    title: 'Control and Homeostasis',
    objective: 'Explain negative feedback control of blood glucose and water potential, including hormonal mechanisms.',
    questions: [
      mcq('9700-HOME', 'easy', 'Which hormone lowers the concentration of glucose in the blood?', 'Insulin', ['Glucagon', 'Adrenaline', 'Antidiuretic hormone (ADH)'],
        'Insulin, secreted by the beta cells of the islets of Langerhans in the pancreas, increases glucose uptake by cells and the conversion of glucose to glycogen in the liver, lowering blood glucose. Glucagon and adrenaline raise blood glucose, and ADH regulates water reabsorption in the kidney.', 'Identify', 'AO1'),
      mcq('9700-HOME', 'easy', 'What is the term for the maintenance of a constant internal environment in the body?', 'Homeostasis', ['Osmoregulation', 'Excretion', 'Thermoregulation'],
        'Homeostasis is the general term for keeping internal conditions such as blood glucose concentration, core temperature and water potential within narrow limits. Osmoregulation and thermoregulation are specific examples of homeostasis, while excretion is the removal of metabolic waste.', 'Identify', 'AO1'),
      mcq('9700-HOME', 'medium', 'A rise in blood glucose concentration after a meal is detected by the pancreas. Which events follow?', 'Beta cells secrete insulin, increasing glucose uptake and glycogen synthesis', ['Alpha cells secrete glucagon, stimulating glycogen breakdown', 'The liver converts glycogen back into glucose', 'ADH release increases water reabsorption in the kidney'],
        'High blood glucose stimulates the beta cells of the islets of Langerhans to release insulin. Insulin increases cellular uptake of glucose and promotes its conversion to glycogen and fat in the liver, returning blood glucose towards the set point — an example of negative feedback.', 'Explain', 'AO2'),
      mcq('9700-HOME', 'medium', 'In which region of the nephron is essentially all filtered glucose normally reabsorbed into the blood?', 'Proximal convoluted tubule', ['Loop of Henle', 'Distal convoluted tubule', 'Collecting duct'],
        'Glucose is small enough to pass into the filtrate at the glomerulus, but all of it is reabsorbed by co-transport with sodium ions and active transport in the proximal convoluted tubule, so the urine of a healthy person contains no glucose.', 'Identify', 'AO1'),
      mcq('9700-HOME', 'hard', 'How does antidiuretic hormone (ADH) increase water reabsorption from the collecting duct?', 'It causes vesicles containing aquaporins to fuse with the cell surface membranes of collecting duct cells', ['It makes the loop of Henle shorter', 'It increases the rate of glomerular filtration', 'It blocks sodium reabsorption in the proximal tubule'],
        'ADH binds to receptors on collecting duct cells, triggering vesicles carrying aquaporin water channels to fuse with their cell surface membranes. This raises the permeability of the duct to water, so more water leaves by osmosis into the concentrated tissue fluid of the medulla.', 'Explain', 'AO3'),
      st('9700-HOME', 'medium', 'A student investigates how the body regulates blood glucose concentration and core temperature.', [
        part('a', 'State what is meant by negative feedback in homeostasis.', 2,
          'A change in an internal factor away from its set point is detected by receptors and triggers responses by effectors that reverse the change, returning the factor towards normal; the response is then switched off once the set point is restored.'),
        part('b', 'Describe the role of glucagon when blood glucose concentration falls below the set point.', 2,
          'Glucagon, secreted by the alpha cells of the islets of Langerhans, acts on liver cells to stimulate the breakdown of glycogen to glucose (glycogenolysis) and the formation of glucose from other compounds (gluconeogenesis), raising blood glucose concentration.'),
        part('c', 'Explain how vasoconstriction of arterioles near the skin surface helps to reduce heat loss.', 2,
          'Constriction of the arterioles diverts blood away from the surface capillaries of the skin, so less warm blood flows close to the body surface; less heat is therefore transferred to the surroundings by radiation, conserving core temperature.'),
      ]),
    ],
  },
  {
    key: 'biodiversity',
    topicId: 'topic_alevel_bio_biodiversity',
    code: '9700-BIODIV',
    title: 'Biodiversity and Conservation',
    objective: 'Classify organisms, measure biodiversity quantitatively and evaluate conservation strategies.',
    questions: [
      mcq('9700-BIODIV', 'easy', 'In the Linnaean hierarchy, which taxonomic rank comes immediately below kingdom?', 'Phylum', ['Class', 'Order', 'Domain'],
        'The hierarchy runs domain, kingdom, phylum, class, order, family, genus, species, so the rank directly below kingdom is phylum. A domain is a higher rank introduced in the three-domain classification system.', 'Identify', 'AO1'),
      mcq('9700-BIODIV', 'easy', 'In the binomial system, the scientific name of a species such as Panthera leo consists of...', 'the genus name followed by the species name', ['the family name followed by the genus name', 'the species name followed by the phylum name', 'two species names joined together'],
        'Binomial nomenclature gives every species a two-part Latinised name: the genus name (with a capital letter) followed by the species name (lower case), both written in italics, for example Panthera leo for the lion.', 'Identify', 'AO1'),
      mcq('9700-BIODIV', 'medium', 'Which statement about the three-domain classification system is correct?', 'Archaea are prokaryotes that are genetically and biochemically distinct from bacteria', ['Archaea are eukaryotes because they can live in extreme environments', 'Bacteria have membrane-bound nuclei', 'The three domains are plants, animals and fungi'],
        'The three domains are Bacteria, Archaea and Eukarya. Archaea are prokaryotes like bacteria, but they differ in ribosomal RNA sequences, membrane lipids and cell wall chemistry, which justifies placing them in a separate domain.', 'Identify', 'AO1'),
      mcq('9700-BIODIV', 'medium', 'What does in situ conservation involve?', 'Protecting species within their natural habitats, for example in national parks or reserves', ['Breeding endangered species in zoos', 'Storing seeds in seed banks', 'Maintaining plant collections in botanic gardens'],
        'In situ conservation maintains species in the wild, for example in protected areas such as national parks and nature reserves, so populations continue to live and evolve within their ecosystems. Zoo breeding programmes, seed banks and botanic gardens are ex situ methods carried out away from the natural habitat.', 'Identify', 'AO1'),
      mcq('9700-BIODIV', 'hard', 'Why is a population bottleneck expected to reduce the genetic diversity of a population?', 'Only a small, often non-representative sample of the original alleles survives in the few remaining individuals', ['Mutation rates always increase after a bottleneck', 'Bottlenecks increase gene flow between populations', 'Larger populations always have lower genetic diversity'],
        'When a population crashes in size, much of its genetic variation is lost because the few survivors carry only a subset of the original alleles. Genetic drift then acts strongly on the small population, and inbreeding among related survivors can reduce heterozygosity still further.', 'Explain', 'AO3'),
      calc('9700-BIODIV', 'medium', "A student sampled a grassland plot and counted three plant species: species P = 20 individuals, species Q = 15 individuals and species R = 5 individuals. Calculate Simpson's Index of Diversity, D = 1 − Σ(n/N)², for this community, giving your answer to two decimal places.", '0.59',
        'N = 20 + 15 + 5 = 40. For each species n/N is 0.5, 0.375 and 0.125, so Σ(n/N)² = 0.25 + 0.140625 + 0.015625 = 0.40625. Therefore D = 1 − 0.40625 = 0.59375, which rounds to 0.59, a moderate diversity value on the 0 to 1 scale.'),
      calc('9700-BIODIV', 'hard', 'In a mark–release–recapture study of woodlice, 60 animals were caught, marked and released. Two days later, 50 animals were caught, of which 12 were marked. Use the Lincoln index, N = (m × n) / r, to estimate the population size.', '250',
        'm = 60 animals marked at first capture, n = 50 animals caught in the second sample and r = 12 marked recaptures. N = (60 × 50) / 12 = 3000 / 12 = 250. The estimate assumes the marks persist, marked animals mix randomly back into the population, and there is no significant immigration, emigration, birth or death between the samples.', 'AO3'),
      st('9700-BIODIV', 'medium', 'A student is asked about the classification and conservation of organisms.', [
        part('a', 'State two features of their cells that place an organism in the kingdom Prokaryotae.', 2,
          'Any two of: no true nucleus (circular DNA lies free in the cytoplasm); no membrane-bound organelles such as mitochondria; smaller 70S ribosomes; a cell wall made of peptidoglycan (murein).'),
        part('b', 'Explain why viruses are not classified in any kingdom.', 2,
          'Viruses are acellular particles of nucleic acid inside a protein coat and cannot carry out metabolism or reproduce independently — they must hijack a host cell — so they are not regarded as living organisms and fall outside the classification of cellular life.'),
        part('c', 'Describe one advantage of in situ conservation compared with ex situ conservation.', 2,
          'Any one developed point, for example: the species remains in its natural ecosystem, so it continues to interact and co-evolve with other species, and the whole community and habitat are protected at once rather than a single species in isolation.'),
      ]),
    ],
  },
  {
    key: 'biotech',
    topicId: 'topic_alevel_bio_biotech',
    code: '9700-BIOTECH',
    title: 'Biotechnology and Gene Technology',
    objective: 'Explain the tools of gene technology — restriction enzymes, PCR and vectors — and their applications.',
    questions: [
      mcq('9700-BIOTECH', 'easy', 'Which enzyme cuts DNA at specific recognition sequences during genetic engineering?', 'Restriction endonuclease', ['DNA ligase', 'DNA polymerase', 'Reverse transcriptase'],
        'Restriction endonucleases recognise short, specific base sequences and cut the DNA backbone there, often leaving sticky ends. DNA ligase joins fragments together, DNA polymerase synthesises new strands, and reverse transcriptase makes DNA from an RNA template.', 'Identify', 'AO1'),
      mcq('9700-BIOTECH', 'easy', 'What does the abbreviation PCR stand for?', 'Polymerase chain reaction', ['Protein chain replication', 'Polymerase copying of RNA', 'Primer-controlled replication'],
        'PCR, the polymerase chain reaction, amplifies a chosen region of DNA exponentially through repeated cycles of denaturation, primer annealing and extension by a thermostable DNA polymerase such as Taq polymerase.', 'Identify', 'AO1'),
      mcq('9700-BIOTECH', 'medium', 'In PCR, why is the extension step carried out at about 72 °C?', 'Taq DNA polymerase is thermostable and works close to its optimum temperature at 72 °C', ['72 °C is needed to separate the two DNA strands', 'Primers can only anneal to the template at 72 °C', 'The DNA template denatures completely at 72 °C'],
        'Taq polymerase, isolated from the thermophilic bacterium Thermus aquaticus, survives the roughly 95 °C denaturation step and extends primers fastest near its optimum of about 72 °C. Strands separate at about 95 °C and primers anneal at about 55 °C.', 'Explain', 'AO2'),
      mcq('9700-BIOTECH', 'medium', 'Which vector is commonly used to transfer genes into plant cells?', 'The Ti plasmid of Agrobacterium tumefaciens', ['The protein coat of a bacteriophage', 'Ribosomes from the host plant', 'Plasmids isolated from human gut bacteria'],
        'Agrobacterium tumefaciens naturally transfers part of its Ti (tumour-inducing) plasmid, the T-DNA, into plant cells, where it integrates into the plant genome. Replacing the tumour-causing genes with a desired gene turns the Ti plasmid into a plant transformation vector.', 'Identify', 'AO1'),
      mcq('9700-BIOTECH', 'hard', 'Bacteria containing an inserted human insulin gene produce functional human insulin. Which feature of the genetic code makes this possible?', 'The genetic code is universal — the same codons specify the same amino acids in bacteria and humans', ['Bacteria are able to read the code backwards', 'Human genes contain bacterial promoter sequences', 'Insulin is not made of amino acids'],
        'Because the genetic code is (almost) universal, a bacterial ribosome translates human mRNA codons into exactly the same amino acid sequence as a human cell would, so the protein produced by the engineered bacteria is genuine human insulin.', 'Explain', 'AO3'),
      st('9700-BIOTECH', 'medium', 'A student outlines how bacteria are genetically engineered to produce human insulin.', [
        part('a', 'State the role of reverse transcriptase in obtaining the human insulin gene.', 2,
          'Reverse transcriptase synthesises a complementary DNA (cDNA) copy of the insulin gene from the mature mRNA extracted from pancreatic beta cells; this cDNA contains the coding sequence without introns, which bacteria cannot remove.'),
        part('b', 'Describe the role of DNA ligase in forming a recombinant plasmid.', 2,
          'DNA ligase joins the sugar–phosphate backbones of the insulin gene and the cut plasmid by catalysing the formation of phosphodiester bonds between their complementary sticky ends, sealing the gene into the plasmid to make recombinant DNA.'),
        part('c', 'Explain one advantage of producing insulin from genetically modified bacteria rather than extracting it from animal pancreases.', 2,
          'Any one developed point, for example: the product is exact human insulin, so it is less likely to trigger an immune response than pig or cow insulin; or GM bacteria grow rapidly in fermenters, giving large, reliable and cheaper supplies without the use of animals.'),
      ]),
    ],
  },
  {
    key: 'immunity',
    topicId: 'topic_alevel_bio_immunity',
    code: '9700-IMM',
    title: 'Immunity',
    objective: 'Explain the specific immune response, the types of immunity and the basis of vaccination.',
    questions: [
      mcq('9700-IMM', 'easy', 'Which cells synthesise and secrete antibodies?', 'Plasma cells (activated B-lymphocytes)', ['T-killer cells', 'Macrophages', 'Neutrophils'],
        'When a B-lymphocyte whose surface antibody matches an antigen is activated (with help from T-helper cells), it divides by mitosis and differentiates into plasma cells, which mass-produce and secrete that antibody. Macrophages and neutrophils are phagocytes, and T-killer cells destroy infected cells.', 'Identify', 'AO1'),
      mcq('9700-IMM', 'easy', 'Which statement best defines an antigen?', 'A molecule, usually on the surface of a pathogen, that triggers a specific immune response', ['An antibody produced by plasma cells', 'A drug that kills bacteria', 'A type of white blood cell'],
        'Antigens are molecules — typically proteins or polysaccharides on the surface of pathogens — that are recognised as non-self by receptors on lymphocytes, triggering antibody production or a cell-mediated response directed specifically against them.', 'Identify', 'AO1'),
      mcq('9700-IMM', 'medium', "A person is injected with a harmless form of a pathogen's antigens and later makes their own antibodies and memory cells. What type of immunity is this?", 'Artificial active immunity', ['Artificial passive immunity', 'Natural passive immunity', 'Natural active immunity'],
        'The antigens were deliberately introduced by vaccination (artificial), and the person’s own immune system responded by producing antibodies and memory cells (active). Passive immunity instead delivers ready-made antibodies, as in an antiserum injection or transfer across the placenta.', 'Identify', 'AO1'),
      mcq('9700-IMM', 'medium', 'Which lymphocyte directly destroys body cells infected with a virus?', 'T-killer (cytotoxic T) cell', ['T-helper cell', 'B-memory cell', 'Plasma cell'],
        'Cytotoxic (T-killer) cells recognise viral antigens presented on the surface of infected cells and release substances such as perforin that kill those cells. T-helper cells coordinate the response by secreting cytokines, and plasma cells secrete antibodies into the blood.', 'Identify', 'AO1'),
      mcq('9700-IMM', 'hard', 'Why must new influenza vaccines be developed on a regular basis?', "Antigenic variability — mutation changes the virus's surface antigens, so existing memory cells and antibodies no longer match", ['Influenza viruses stop expressing antigens after each season', 'Vaccines lose all of their activity within a few months in the body', 'Memory cells permanently destroy the viral antigens'],
        "Influenza has an RNA genome that mutates readily (antigenic drift, and occasionally antigenic shift), altering its haemagglutinin and neuraminidase surface antigens. Memory cells from an earlier vaccination then fail to recognise the new variants, so vaccines are reformulated each season to match circulating strains.", 'Explain', 'AO3'),
      st('9700-IMM', 'medium', 'A student compares the different ways in which the body is protected against infectious disease.', [
        part('a', 'Distinguish between active and passive immunity.', 2,
          "In active immunity the person's own lymphocytes respond to an antigen and produce antibodies and memory cells, giving long-lasting protection; in passive immunity ready-made antibodies are received, for example across the placenta or in an antiserum, giving immediate but short-lived protection without memory cells."),
        part('b', 'Describe the role of memory cells in the secondary immune response.', 2,
          'Memory B- and T-lymphocytes persist after a first infection; on re-exposure to the same antigen they clone rapidly and differentiate into plasma cells and effector T cells, so the antibody concentration rises faster and to a higher level than in the primary response.'),
        part('c', 'Explain why antibiotics are ineffective against viral diseases.', 2,
          'Antibiotics target structures or processes unique to bacteria, such as peptidoglycan cell wall synthesis or 70S ribosomes; viruses lack these targets and replicate inside host cells using the host’s machinery, so antibiotics cannot act on them.'),
      ]),
    ],
  },
);

// Prod-canonical A-Level Biology topic rows (verified against prod D1 on 2026-09-09).
// Seven exist on fresh baselines via prod-patch 096; topic_alevel_bio_immunity exists
// only in prod, so the foundation migration INSERT OR IGNOREs all eight. On prod
// every id already exists, so the inserts no-op.
// [id, subjectId, parentId, name, slug, description, theoryContent, keyFormulas, displayOrder, createdAt]
const canonicalTopicRows = [
  ['topic_alevel_bio_cells', subjectId, null, 'Cells and Biological Molecules', 'cells-and-biological-molecules', 'Ultrastructure, microscopy and the chemistry of life', null, null, 1, '2026-08-13T00:00:00.000Z'],
  ['topic_alevel_bio_membranes', subjectId, null, 'Membranes and Transport', 'membranes-and-transport', 'Membrane structure, transport mechanisms and gas exchange', null, null, 2, '2026-08-13T00:00:00.000Z'],
  ['topic_alevel_bio_metabolism', subjectId, null, 'Metabolism: Respiration and Photosynthesis', 'metabolism-respiration-photosynthesis', 'ATP, respiration pathways and photosynthesis', null, null, 3, '2026-08-13T00:00:00.000Z'],
  ['topic_alevel_bio_genetics', subjectId, null, 'Genetics, Inheritance and Evolution', 'genetics-inheritance-evolution', 'DNA, protein synthesis, inheritance patterns and selection', null, null, 4, '2026-08-13T00:00:00.000Z'],
  ['topic_alevel_bio_homeostasis', subjectId, null, 'Control and Homeostasis', 'control-and-homeostasis', 'Nervous and hormonal control, kidney function and homeostasis', null, null, 5, '2026-08-13T00:00:00.000Z'],
  ['topic_alevel_bio_biodiversity', subjectId, null, 'Biodiversity and Conservation', 'biodiversity-and-conservation', 'Classification, biodiversity and conservation strategies', null, null, 6, '2026-08-13T00:00:00.000Z'],
  ['topic_alevel_bio_biotech', subjectId, null, 'Biotechnology and Gene Technology', 'biotechnology-and-gene-technology', 'Genetic engineering, PCR and applications of biotechnology', null, null, 7, '2026-08-13T00:00:00.000Z'],
  ['topic_alevel_bio_immunity', subjectId, null, 'Immunity', 'immunity', 'Antigens, immune responses, memory cells and vaccination', null, null, 8, '2026-08-26T00:00:00.000Z'],
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
const officialAttributionPattern = /\b(?:official\s+(?:cambridge|waec|west african examinations council)|(?:cambridge|waec)[ -](?:approved|endorsed|authored|issued|certified))\b/i;
const nonOfficialDisclaimerGlobalPattern = /\b(?:not|non[- ]?)\s+official\s+(?:waec|west african examinations council|cambridge(?:\s+international)?)\b/gi;
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
    id: `q_albio_${topic.key}_s1_${String(index + 1).padStart(3, '0')}`,
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

function buildCalculation(topic, question, index) {
  return {
    id: `q_albio_${topic.key}_s1_${String(index + 1).padStart(3, '0')}`,
    original: true,
    topicCode: question.topicCode,
    type: 'calculation',
    prompt: question.prompt,
    correctAnswer: question.answer,
    workedSolution: question.solution,
    difficulty: question.difficulty,
    marks: 3,
    points: 5,
    timeLimit: 240,
    commandWord: question.commandWord,
    assessmentObjective: question.assessmentObjective,
    provenance: [cambridgeSource],
  };
}

function structuredAnswer(question) {
  return question.parts.map((entry) => `(${entry.label}) ${entry.correctAnswer}`).join(' ');
}

function buildStructured(topic, question, index) {
  const marks = question.parts.reduce((total, entry) => total + entry.marks, 0);
  return {
    id: `q_albio_${topic.key}_s1_${String(index + 1).padStart(3, '0')}`,
    original: true,
    topicCode: question.topicCode,
    type: 'structured',
    prompt: question.prompt,
    parts: question.parts,
    correctAnswer: structuredAnswer(question),
    workedSolution: structuredAnswer(question),
    difficulty: question.difficulty,
    marks,
    points: marks,
    timeLimit: null,
    commandWord: question.commandWord,
    assessmentObjective: question.assessmentObjective,
    contentLabel: theoryContentLabel,
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
    specificationCode: 'BRILLA-9700-ALBIO-S1-001',
    sources: [cambridgeSource],
    topics: topics.map(({ code, title, objective }) => ({ code, title, objective })),
    questions: topics.flatMap((topic) => topic.questions.map((question, index) => {
      if (question.type === 'multiple_choice') return buildMcq(topic, question, index);
      if (question.type === 'calculation') return buildCalculation(topic, question, index);
      return buildStructured(topic, question, index);
    })),
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
  const typeCounts = { multiple_choice: 0, calculation: 0, structured: 0 };
  const topicCounts = new Map();
  for (const question of batch.subjects[0].questions) {
    typeCounts[question.type] += 1;
    topicCounts.set(question.topicCode, (topicCounts.get(question.topicCode) ?? 0) + 1);
    if (!Array.isArray(question.provenance) || question.provenance[0]?.use !== 'curriculum_blueprint_only') errors.push(`${question.id}: per-item provenance missing`);
    assertNoFalseOfficialClaim(question.prompt, `${question.id}.prompt`);
    if (question.type === 'multiple_choice') {
      letterCounts[question.correctAnswer] += 1;
      if (question.options?.length !== 4) errors.push(`${question.id}: MCQ needs exactly 4 options`);
      if (question.marks !== 1) errors.push(`${question.id}: MCQ marks must be 1`);
    } else if (question.type === 'calculation') {
      if (question.options != null) errors.push(`${question.id}: calculation must not have options`);
      if (typeof question.correctAnswer !== 'string' || !question.correctAnswer.length) errors.push(`${question.id}: calculation needs an answer`);
      if (!/[=×÷²]|Σ|\d/.test(question.workedSolution)) errors.push(`${question.id}: calculation needs a worked numerical solution`);
    } else if (question.type === 'structured') {
      const sum = question.parts.reduce((total, entry) => total + entry.marks, 0);
      if (sum !== question.marks) errors.push(`${question.id}: part marks (${sum}) must sum to marks (${question.marks})`);
      if (!/\bnot\s+official\s+waec\b/i.test(question.contentLabel)) errors.push(`${question.id}: structured contentLabel must disclaim official WAEC status`);
      for (const entry of question.parts) assertNoFalseOfficialClaim(entry.text, `${question.id} part ${entry.label}`);
    } else {
      errors.push(`${question.id}: unexpected type ${question.type}`);
    }
  }
  if (typeCounts.multiple_choice !== 40) errors.push(`expected 40 MCQs, found ${typeCounts.multiple_choice}`);
  if (typeCounts.calculation !== 2) errors.push(`expected 2 calculations, found ${typeCounts.calculation}`);
  if (typeCounts.structured !== 8) errors.push(`expected 8 structured questions, found ${typeCounts.structured}`);
  for (const topic of topics) {
    const expected = topic.key === 'biodiversity' ? 8 : 6;
    if (topicCounts.get(topic.code) !== expected) errors.push(`${topic.key}: expected ${expected} questions, found ${topicCounts.get(topic.code) ?? 0}`);
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
  const options = question.type === 'multiple_choice'
    ? JSON.stringify(question.options.map(({ label, text }) => `${label}. ${text}`))
    : null;
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

const partId = (question, entry) => `sqp_${question.id}_${entry.label}`;

// Each topic migration stages its rows once in scratch tables (_migration_N_expected*)
// and both inserts and fail-closed checks read from them: A-Level explanations are too
// long for the NSMQ pattern (which repeats every field value in the preflight match AND
// the INSERT) to fit a 6-8-question topic under the remote D1 query limit.
const numericQuestionFields = new Set(['points', 'marks', 'time_limit', 'question_number', 'is_compulsory']);
const expectedPartsFields = ['id', 'question_id', 'part_label', 'part_text', 'marks', 'correct_answer', 'display_order'];

function expectedTableDDL(table) {
  const columns = ['id TEXT PRIMARY KEY', ...canonicalQuestionFields.map((field) => `${field} ${numericQuestionFields.has(field) ? 'INTEGER' : 'TEXT'}`)];
  return `CREATE TABLE ${table} (${columns.join(', ')});`;
}

function expectedPartsTableDDL(table) {
  return `CREATE TABLE ${table} (id TEXT PRIMARY KEY, question_id TEXT NOT NULL, part_label TEXT NOT NULL, part_text TEXT NOT NULL, marks INTEGER NOT NULL, correct_answer TEXT NOT NULL, display_order INTEGER NOT NULL);`;
}

function canonicalMatchExpected(questionAlias, expectedAlias) {
  return canonicalQuestionFields.map((field) => `${questionAlias}.${field} IS ${expectedAlias}.${field}`).join(' AND ');
}

function partMatchExpected(partAlias, expectedAlias) {
  return expectedPartsFields.map((field) => `${partAlias}.${field} IS ${expectedAlias}.${field}`).join(' AND ');
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

let migrationNumber = 432;
{
  const name = `${migrationNumber}_alevel_bio_sprint1_foundation.sql`;
  const allTopicIds = topics.map((topic) => topic.topicId);
  const lines = [
    `-- ${migrationNumber}: Foundation guard for Cambridge A-Level Biology (9700) content sprint 1 (batch ${batchId}).`,
    '-- Original BrillaPrep practice content; not official Cambridge International or WAEC material.',
    '-- Also seeds the prod-canonical A-Level Biology topic rows for fresh baselines',
    '-- (topic_alevel_bio_immunity is absent from prod-patch 096); INSERT OR IGNORE',
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
  const expectedPartsTable = `_migration_${migrationNumber}_expected_parts`;
  const guardTable = `_migration_${migrationNumber}_guard`;
  const name = `${migrationNumber}_alevel_bio_${topic.key}.sql`;
  const structuredRows = topicQuestions
    .filter((question) => question.type === 'structured')
    .flatMap((question) => question.parts.map((entry, index) => ({
      id: partId(question, entry),
      question_id: question.id,
      part_label: entry.label,
      part_text: entry.text,
      marks: entry.marks,
      correct_answer: entry.correctAnswer,
      display_order: index + 1,
    })));
  const lines = [
    `-- ${migrationNumber}: Original BrillaPrep Cambridge A-Level Biology (9700) ${topic.title} practice questions (batch ${batchId}).`,
    '-- Curriculum-aligned practice content; not official Cambridge International or WAEC material.',
    'PRAGMA foreign_keys = ON;',
    expectedTableDDL(expectedTable),
    `INSERT INTO ${expectedTable} (id, ${canonicalQuestionFields.join(', ')}) VALUES ${topicQuestions.map((question) => {
      const values = questionValues(question);
      return `(${sql(question.id)}, ${canonicalQuestionFields.map((field) => sql(values[field])).join(', ')})`;
    }).join(',\n')};`,
    expectedPartsTableDDL(expectedPartsTable),
  ];
  if (structuredRows.length) {
    lines.push(`INSERT INTO ${expectedPartsTable} (${expectedPartsFields.join(', ')}) VALUES ${structuredRows.map((row) => `(${expectedPartsFields.map((field) => sql(row[field])).join(', ')})`).join(',\n')};`);
  }
  lines.push(
    `CREATE TABLE IF NOT EXISTS ${guardTable} (valid INTEGER NOT NULL CHECK (valid = 1));`,
    `DELETE FROM ${guardTable};`,
  );
  const preflightChecks = [
    `NOT EXISTS (SELECT 1 FROM ${expectedTable} e JOIN questions q ON q.id = e.id WHERE NOT (${canonicalMatchExpected('q', 'e')}))`,
    `NOT EXISTS (SELECT 1 FROM ${expectedTable} e JOIN question_content_releases r ON r.question_id = e.id WHERE NOT (${releaseMatch('r')}))`,
  ];
  if (structuredRows.length) {
    preflightChecks.push(`NOT EXISTS (SELECT 1 FROM ${expectedPartsTable} p JOIN structured_question_parts sp ON sp.id = p.id WHERE NOT (${partMatchExpected('sp', 'p')}))`);
  }
  lines.push(`INSERT INTO ${guardTable}(valid) SELECT CASE WHEN ${preflightChecks.join(' AND ')} THEN 1 ELSE 0 END;`);
  lines.push(`INSERT INTO questions (id, ${canonicalQuestionFields.join(', ')}) SELECT id, ${canonicalQuestionFields.join(', ')} FROM ${expectedTable} e WHERE NOT EXISTS (SELECT 1 FROM questions q WHERE q.id = e.id);`);
  if (structuredRows.length) {
    lines.push(`INSERT INTO structured_question_parts (id, question_id, part_label, part_text, marks, correct_answer, explanation, answer_type, display_order) SELECT p.id, p.question_id, p.part_label, p.part_text, p.marks, p.correct_answer, NULL, 'text', p.display_order FROM ${expectedPartsTable} p WHERE NOT EXISTS (SELECT 1 FROM structured_question_parts sp WHERE sp.id = p.id);`);
  }
  lines.push(`INSERT INTO question_content_releases (question_id, batch_id, quality_assurance, release_channel, content_label, source_url, official_exam_board_content, feedback_enabled) SELECT e.id, '${batchId}', 'automated_beta', 'beta', ${sql(contentLabel)}, ${sql(releaseSourceUrl)}, 0, 1 FROM ${expectedTable} e WHERE NOT EXISTS (SELECT 1 FROM question_content_releases r WHERE r.question_id = e.id);`);
  lines.push(`DELETE FROM ${guardTable};`);
  lines.push(`INSERT INTO ${guardTable}(valid) SELECT CASE WHEN (SELECT COUNT(*) FROM questions q JOIN ${expectedTable} e ON e.id = q.id AND ${canonicalMatchExpected('q', 'e')}) = ${ids.length} AND (SELECT COUNT(*) FROM question_content_releases r JOIN ${expectedTable} e ON e.id = r.question_id WHERE ${releaseMatch('r')}) = ${ids.length} AND (SELECT COUNT(*) FROM questions q JOIN topics t ON t.id = q.topic_id AND t.subject_id = q.subject_id JOIN ${expectedTable} e ON e.id = q.id) = ${ids.length} AND (SELECT COUNT(*) FROM structured_question_parts sp JOIN ${expectedPartsTable} p ON p.id = sp.id AND ${partMatchExpected('sp', 'p')}) = ${structuredRows.length} THEN 1 ELSE 0 END;`);
  lines.push(`DROP TABLE ${guardTable};`);
  lines.push(`DROP TABLE ${expectedTable};`);
  lines.push(`DROP TABLE ${expectedPartsTable};`);
  await emitMigration(name, lines);
  migrationNumber += 1;
}

{
  const name = `${migrationNumber}_alevel_bio_sprint1_final_guard.sql`;
  const guardTable = `_migration_${migrationNumber}_guard`;
  const allIds = allQuestions.map((question) => question.id);
  const structuredPartTotal = allQuestions
    .filter((question) => question.type === 'structured')
    .reduce((total, question) => total + question.parts.length, 0);
  const lines = [
    `-- ${migrationNumber}: Final exact-set and relationship guard for Cambridge A-Level Biology sprint 1 (batch ${batchId}).`,
    'PRAGMA foreign_keys = ON;',
    `CREATE TABLE IF NOT EXISTS ${guardTable} (valid INTEGER NOT NULL CHECK (valid = 1));`,
    `DELETE FROM ${guardTable};`,
    `INSERT INTO ${guardTable}(valid) SELECT CASE WHEN (SELECT COUNT(*) FROM questions q JOIN topics t ON t.id = q.topic_id JOIN question_content_releases r ON r.question_id = q.id WHERE q.id IN (${allIds.map(sql).join(', ')}) AND q.subject_id = '${subjectId}' AND q.subject_id = t.subject_id AND q.exam_type_id = '${examTypeId}' AND q.exam_board_id = '${examBoardId}' AND length(q.explanation) >= 80 AND r.batch_id = '${batchId}' AND r.quality_assurance = 'automated_beta' AND r.release_channel = 'beta' AND r.official_exam_board_content = 0 AND r.feedback_enabled = 1) = 50 AND (SELECT COUNT(*) FROM questions q WHERE q.id IN (${allIds.map(sql).join(', ')}) AND q.question_type = 'multiple_choice' AND json_valid(q.options) AND json_array_length(q.options) = 4 AND q.correct_answer IN ('A','B','C','D')) = 40 AND (SELECT COUNT(*) FROM questions q WHERE q.id IN (${allIds.map(sql).join(', ')}) AND q.question_type = 'calculation' AND q.options IS NULL) = 2 AND (SELECT COUNT(*) FROM questions q WHERE q.id IN (${allIds.map(sql).join(', ')}) AND q.question_type = 'structured') = 8 AND (SELECT COUNT(*) FROM structured_question_parts WHERE question_id IN (${allIds.map(sql).join(', ')})) = ${structuredPartTotal} AND (SELECT COUNT(*) FROM question_content_releases WHERE batch_id = '${batchId}') = 50 THEN 1 ELSE 0 END;`,
    `DROP TABLE ${guardTable};`,
  ];
  await emitMigration(name, lines);
  migrationNumber += 1;
}

console.log(JSON.stringify({ validation: { valid: validation.valid, warnings: validation.warnings, metrics: validation.metrics }, outBatch, migrations: migrationPaths }, null, 2));
