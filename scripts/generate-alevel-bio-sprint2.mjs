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
const batchId = 'alevel-bio-sprint2-001';
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
    key: 'ecology',
    topicId: 'topic_alevel_bio_ecology',
    code: '9700-ECOL',
    title: 'Ecology and Nutrient Cycles',
    objective: 'Apply knowledge of energy flow through ecosystems, productivity, nutrient cycling and population sampling to ecological problems.',
    questions: [
      mcq('9700-ECOL', 'easy', 'In the nitrogen cycle, which process is carried out by Rhizobium bacteria living in the root nodules of legumes such as cowpea and groundnut?', 'Conversion of atmospheric nitrogen gas into ammonia (nitrogen fixation)', ['Oxidation of ammonium ions to nitrite ions', 'Oxidation of nitrite ions to nitrate ions', 'Conversion of nitrate ions into nitrogen gas'],
        'Rhizobium is a mutualistic nitrogen-fixing bacterium: inside root nodules it uses the enzyme nitrogenase to reduce inert atmospheric nitrogen gas to ammonia, which the host plant uses to make amino acids, while the plant supplies the bacteria with carbohydrates. Oxidising ammonium to nitrite and nitrite to nitrate is nitrification (carried out by Nitrosomonas and Nitrobacter), and converting nitrate back to nitrogen gas is denitrification, carried out by bacteria such as Pseudomonas in anaerobic, waterlogged soils.', 'Identify', 'AO1'),
      mcq('9700-ECOL', 'easy', 'In the food chain grass → grasshopper → lizard → hawk, which organism is the secondary consumer?', 'Lizard', ['Grasshopper', 'Hawk', 'Grass'],
        'Trophic levels count from the producer: grass (producer) is eaten by the grasshopper (primary consumer, a herbivore), which is eaten by the lizard (secondary consumer, the first carnivore), which is eaten by the hawk (tertiary consumer). A common error is to label the grasshopper as the secondary consumer by counting the producer as the first consumer, but consumers are numbered only from the herbivore level.', 'Identify', 'AO1'),
      mcq('9700-ECOL', 'easy', 'What name is given to all the populations of different species living and interacting in the same area at the same time?', 'A community', ['A population', 'An ecosystem', 'A habitat'],
        'A community is all the biotic components — every population of every species living and interacting in one area at one time. A population is the members of a single species only; an ecosystem includes the community together with the non-living (abiotic) environment; a habitat is simply the place where an organism lives, not the set of organisms itself.', 'State', 'AO1'),
      mcq('9700-ECOL', 'easy', 'Which equation correctly relates gross primary productivity (GPP), respiration losses (R) and net primary productivity (NPP)?', 'NPP = GPP − R', ['NPP = GPP + R', 'GPP = NPP − R', 'NPP = R − GPP'],
        'Gross primary productivity is the total chemical energy that producers fix in photosynthesis. Producers respire, releasing some of that energy as heat, so the energy left available for growth, reproduction and transfer to herbivores is net primary productivity: NPP = GPP − R. Adding respiration back, or rearranging the equation so that GPP loses NPP, confuses the direction of the relationship — respiration is a loss from GPP, never an addition to NPP.', 'Identify', 'AO1'),
      mcq('9700-ECOL', 'medium', 'Which statement best explains why only about 10% of the energy at one trophic level is typically transferred to the next?', 'Most of the energy is lost as heat from respiration, and some remains in parts that are not eaten or cannot be digested, or is lost in excretory products', ['Decomposers directly absorb 90% of the energy before herbivores can feed', 'Predators deliberately consume only about 10% of the prey population', 'About 90% of the energy is destroyed during digestion inside the consumer'],
        'Energy transfer is inefficient because consumers use much of the energy they assimilate in respiration, which is lost as heat that cannot re-enter the food chain, while energy in bones, cellulose and other indigestible or uneaten material, and in urea and faeces, passes to decomposers rather than to the next trophic level. Energy is never destroyed — that would violate the conservation of energy — and the 10% figure is an ecological average, not a behavioural rule about how much predators choose to eat.', 'Explain', 'AO2'),
      mcq('9700-ECOL', 'medium', 'Which sequence correctly describes nitrification in the soil?', 'Nitrosomonas oxidises ammonium ions to nitrite ions, then Nitrobacter oxidises nitrite ions to nitrate ions', ['Nitrobacter oxidises ammonium ions to nitrite ions, then Nitrosomonas oxidises nitrite ions to nitrate ions', 'Rhizobium oxidises ammonium ions directly to nitrate ions in root nodules', 'Nitrosomonas converts nitrogen gas to ammonium ions, then Nitrobacter converts ammonium ions to nitrate ions'],
        'Nitrification is a two-step oxidation carried out by different soil bacteria: Nitrosomonas oxidises ammonium ions (NH4+) to nitrite ions (NO2−), then Nitrobacter oxidises nitrite ions to nitrate ions (NO3−), the form most plants absorb. Swapping the two genera or the two ions confuses the steps. Rhizobium fixes atmospheric nitrogen gas in legume root nodules and plays no part in nitrification, and the conversion of nitrogen gas to ammonium ions is nitrogen fixation, not the first step of nitrification.', 'Describe', 'AO1'),
      mcq('9700-ECOL', 'medium', 'In a eutrophic lake, which event is the direct cause of large-scale fish deaths?', 'Depletion of dissolved oxygen by the respiration of huge populations of decomposer bacteria feeding on dead algae', ['Direct poisoning of fish tissues by nitrate ions from the fertiliser', 'Algal cells physically blocking the gills of the fish', 'Decomposer bacteria feeding directly on the living fish'],
        'Nitrate enrichment triggers an algal bloom; when the algae die, saprotrophic bacteria multiply and respire aerobically as they decompose the biomass, stripping dissolved oxygen from the water (a high biological oxygen demand) until fish suffocate. Nitrate at these concentrations is not acutely toxic to fish, gill blockage by algal cells is not the mechanism, and decomposers feed on dead organic matter, not on living fish.', 'Explain', 'AO2'),
      mcq('9700-ECOL', 'medium', 'Why do persistent pesticides such as DDT reach their highest concentrations in top carnivores?', 'DDT is fat-soluble and cannot be broken down or excreted, so it accumulates in body fat and its concentration increases at each successive trophic level', ['Top carnivores drink more contaminated water than organisms at lower trophic levels', 'DDT becomes progressively more water-soluble as it passes up the food chain', 'The faster metabolism of top carnivores manufactures DDT from harmless precursors'],
        'Persistent organic pollutants such as DDT resist biodegradation and dissolve in lipids rather than water, so an organism stores every dose it ever consumes in its fatty tissues. Because each trophic level must eat many organisms from the level below, the stored dose is passed up and concentrated — biomagnification — leaving top carnivores such as fish eagles with the highest tissue concentrations. DDT is not manufactured by any animal, and it does not become more soluble as it moves up the chain.', 'Explain', 'AO2'),
      mcq('9700-ECOL', 'hard', 'In an oak woodland, the pyramid of numbers is inverted because one tree supports thousands of aphids, yet the pyramid of energy for the same community is never inverted. Which statement explains this?', 'Energy is always lost from the ecosystem between trophic levels, mainly as respiratory heat, so the rate of energy flow through each level must decrease regardless of the size or number of individual organisms', ['Large producers such as trees are excluded from pyramids of energy', 'Insects do not respire, so their energy is not counted in the pyramid', 'The pyramid of energy is inverted whenever the pyramid of numbers is inverted'],
        'Pyramids of numbers count individuals and ignore size, so a single large producer can support many small consumers and invert the pattern. A pyramid of energy plots the rate of energy flow (kJ m⁻² yr⁻¹) through each trophic level; because respiration, excretion and undigested material always remove energy between levels, each bar must be smaller than the one below, so the pyramid can never be inverted. Insects respire like all animals, trees supply the energy that defines the base bar, and the two pyramids describe different quantities that need not share a shape.', 'Explain', 'AO2'),
      mcq('9700-ECOL', 'hard', 'In a mark–release–recapture study of a tilapia population, some of the marks wear off before the second sample is taken. How will this affect the population estimate?', 'The estimate will be too high, because fewer marked fish are recaptured than expected, reducing the denominator in N = (n1 × n2) ÷ m', ['The estimate will be too low, because fewer marked fish are recaptured', 'The estimate is unaffected, because the marks are irrelevant after release', 'The estimate will be too high, because more unmarked fish are caught in the second sample'],
        'The Lincoln index assumes marks are not lost between samples. If marks wear off, m (the number of marked fish in the second sample) is smaller than it should be; since m is the denominator of N = (n1 × n2) ÷ m, dividing by too small a value inflates the estimate. The number of unmarked fish caught does not compensate in the formula, and the marks certainly remain relevant after release — the whole method depends on recognising them.', 'Analyse', 'AO2'),
      mcq('9700-ECOL', 'hard', 'A farmer ploughs a cowpea crop into the soil as green manure. Which sequence correctly explains the rise in soil nitrate over the following months?', 'Decomposers break down the plant proteins and release ammonium ions (ammonification), then nitrifying bacteria oxidise the ammonium ions to nitrate', ['Rhizobium in the dead nodules continues to fix nitrogen gas directly into nitrate', 'Denitrifying bacteria convert the organic nitrogen straight into nitrate', 'The living legume roots excrete nitrate ions after the crop is ploughed in'],
        'Once ploughed in, the crop — including its nitrogen-rich root nodules — is dead organic matter. Saprotrophic bacteria and fungi decompose its proteins, releasing ammonium ions (ammonification); Nitrosomonas and Nitrobacter then oxidise the ammonium ions to nitrite and nitrate (nitrification), enriching the soil for the next crop. Nitrogen fixation stops when the nodules die, denitrification removes nitrate from the soil rather than producing it, and dead roots excrete nothing.', 'Explain', 'AO2'),
      calc('9700-ECOL', 'medium', 'In a grassland survey, students caught and marked 96 grasshoppers, then released them. The next day they caught a second sample of 84 grasshoppers, of which 12 were marked. Using the Lincoln index, estimate the size of the grasshopper population.', '672 grasshoppers',
        'The Lincoln index is N = (n1 × n2) ÷ m, where n1 = number caught, marked and released = 96, n2 = number caught in the second sample = 84, and m = marked individuals recaptured = 12. Substituting: N = (96 × 84) ÷ 12 = 8064 ÷ 12 = 672. The estimated population is therefore 672 grasshoppers. The estimate assumes that no births, deaths, immigration or emigration occurred between the samples, that the marks were not lost, and that marked individuals mixed randomly and were just as likely to be caught as unmarked ones.'),
      calc('9700-ECOL', 'hard', 'In a lake ecosystem, the producers fix 9.0 × 10⁴ kJ m⁻² yr⁻¹ as gross primary productivity and lose 5.4 × 10⁴ kJ m⁻² yr⁻¹ in respiration. The primary consumers assimilate 4.32 × 10³ kJ m⁻² yr⁻¹. Calculate the net primary productivity of the producers and the percentage efficiency of energy transfer from the producers to the primary consumers.', 'NPP = 3.6 × 10⁴ kJ m⁻² yr⁻¹; transfer efficiency = 12%',
        'Net primary productivity is gross primary productivity minus respiration losses: NPP = (9.0 × 10⁴) − (5.4 × 10⁴) = 3.6 × 10⁴ kJ m⁻² yr⁻¹. Transfer efficiency = (energy assimilated by primary consumers ÷ NPP) × 100 = (4.32 × 10³ ÷ 3.6 × 10⁴) × 100 = 0.12 × 100 = 12%. The efficiency must be calculated against NPP, not GPP, because only net production is available to herbivores; using GPP would wrongly give 4.8%.'),
      st('9700-ECOL', 'medium', 'A student studies the nitrogen cycle in the soil of a maize farm in northern Ghana.', [
        part('a', 'State what is meant by nitrogen fixation.', 2, 'The conversion of inert atmospheric nitrogen gas (N₂) into ammonia or ammonium compounds that plants can use (1); carried out by nitrogen-fixing bacteria such as Rhizobium in legume root nodules and free-living bacteria such as Azotobacter, or industrially in the Haber process (1).'),
        part('b', 'Describe how ammonium ions in the soil are converted into nitrate ions that the maize plants can absorb, naming the bacteria involved.', 3, 'The process is nitrification (1): Nitrosomonas oxidises ammonium ions to nitrite ions (1); Nitrobacter then oxidises nitrite ions to nitrate ions (1). Accept a correct two-step description without genus names for a maximum of 2 marks.'),
        part('c', 'The field becomes waterlogged after heavy rain. Explain why the concentration of nitrate ions in the waterlogged soil falls.', 2, 'Waterlogging fills the soil air spaces with water, so conditions become anaerobic (1); denitrifying bacteria such as Pseudomonas then use nitrate in place of oxygen for respiration and convert it to nitrogen gas, which escapes to the atmosphere — denitrification (1).'),
      ], 'Explain'),
      st('9700-ECOL', 'medium', 'Fertiliser is washed from fields into a lake near an intensive poultry farm.', [
        part('a', 'State what is meant by eutrophication.', 2, 'The enrichment of a body of water with nutrients, especially nitrate and phosphate ions (1), leading to excessive growth of producers such as algae (1).'),
        part('b', 'Describe the sequence of events that links the algal bloom to the death of fish in the lake.', 4, 'The algae multiply until they block light, so submerged plants and deeper algae die (1); decomposer (saprotrophic) bacteria multiply as they break down the dead organic matter (1); the bacteria respire aerobically and remove dissolved oxygen from the water, raising the biological oxygen demand (1); fish and other aerobic animals suffocate and die from the lack of dissolved oxygen (1).'),
        part('c', 'Suggest one farming practice that would reduce the nutrient run-off responsible for eutrophication.', 1, 'Any one of: applying fertiliser only at recommended rates and times, and not just before heavy rain; using slow-release organic manure instead of soluble inorganic fertiliser; planting vegetated buffer strips along the lake edge; fencing livestock away from the water (1).'),
      ], 'Describe'),
      st('9700-ECOL', 'hard', 'A student investigates energy flow through a savanna grassland ecosystem.', [
        part('a', 'Distinguish between gross primary productivity and net primary productivity.', 2, 'Gross primary productivity (GPP) is the total rate at which producers convert light energy into chemical energy in photosynthesis (1); net primary productivity (NPP) is GPP minus the energy the producers lose in respiration (NPP = GPP − R), the energy available for growth and for transfer to consumers (1).'),
        part('b', 'Explain why food chains rarely have more than four or five trophic levels.', 3, 'Only about 10% of the energy at each level is transferred to the next (1); energy is lost as heat in respiration, in excretory products and in uneaten or undigested material (1); so after four or five transfers too little energy remains to support a viable breeding population of top consumers (1).'),
        part('c', 'Explain why a pyramid of energy for an ecosystem is never inverted.', 2, 'A pyramid of energy shows the rate of energy flow through each trophic level over a fixed period (1); because energy is always lost between levels and cannot flow back from consumers to producers, each successive level receives less energy, so the bars must always decrease upwards (1).'),
      ], 'Explain'),
    ],
  },
  {
    key: 'cells',
    topicId: 'topic_alevel_bio_cells',
    code: '9700-CELLS',
    title: 'Cells and Biological Molecules',
    objective: 'Apply knowledge of cell ultrastructure and the chemistry of carbohydrates, lipids, proteins and nucleic acids.',
    questions: [
      mcq('9700-CELLS', 'easy', 'Which type of bond joins adjacent amino acids together in a polypeptide chain?', 'Peptide bond', ['Hydrogen bond', 'Glycosidic bond', 'Phosphodiester bond'],
        'Amino acids are joined by condensation reactions between the amino group of one and the carboxyl group of the next, forming covalent peptide bonds and releasing water. Hydrogen bonds stabilise secondary structure such as alpha-helices and beta-pleated sheets but do not link the residues of the backbone; glycosidic bonds join monosaccharides in carbohydrates; phosphodiester bonds join nucleotides in nucleic acids.', 'Identify', 'AO1'),
      mcq('9700-CELLS', 'medium', 'A student adds Biuret reagent (sodium hydroxide solution followed by dilute copper(II) sulfate solution) to an egg-white extract. Which result confirms that protein is present?', 'The solution turns lilac (violet)', ['A brick-red precipitate forms', 'The solution turns blue-black', 'A white emulsion forms'],
        'The Biuret test detects peptide bonds: in alkaline solution, copper(II) ions form a lilac or violet complex with the peptide bonds of protein. A brick-red precipitate is the positive Benedict’s result for a reducing sugar on heating; blue-black is iodine in potassium iodide detecting starch; a white emulsion is the ethanol-and-water test for lipids.', 'Identify', 'AO1'),
      mcq('9700-CELLS', 'medium', 'A pancreatic cell that secretes large quantities of protein digestive enzymes would be expected to contain particularly large amounts of which organelles?', 'Rough endoplasmic reticulum and Golgi apparatus', ['Smooth endoplasmic reticulum and lysosomes', 'Chloroplasts and large vacuoles', 'Centrioles and peroxisomes'],
        'Secreted proteins are synthesised on ribosomes bound to the rough endoplasmic reticulum, which folds and transports them, then they are modified, packaged and dispatched in vesicles by the Golgi apparatus — so secretory cells are rich in both. Smooth endoplasmic reticulum synthesises lipids and would dominate in steroid-producing cells; chloroplasts and large vacuoles are plant organelles; centrioles organise the spindle in dividing animal cells and are not linked to secretion.', 'Apply', 'AO2'),
      mcq('9700-CELLS', 'hard', 'Which statement correctly explains why an electron microscope can resolve much finer detail than a light microscope?', 'Electrons have a much shorter wavelength than visible light, and the resolving power of a microscope is limited by the wavelength of the radiation used', ['The electron microscope simply provides a much higher magnification than the light microscope', 'Electrons travel faster than light, so they detect smaller objects', 'Heavy-metal stains used in electron microscopy make small structures physically larger'],
        'Resolution (resolving power) is the ability to distinguish two points as separate, and it cannot exceed roughly half the wavelength of the imaging radiation. Electron beams have wavelengths far shorter than visible light, so electron microscopes resolve structures down to about 0.5 nm, versus about 200 nm for light microscopes. Magnification alone is useless without resolution — enlarging a blurred image only gives a bigger blurred image — and stains improve contrast, not resolution.', 'Explain', 'AO2'),
    ],
  },
  {
    key: 'membranes',
    topicId: 'topic_alevel_bio_membranes',
    code: '9700-MEMB',
    title: 'Membranes and Transport',
    objective: 'Apply knowledge of membrane structure and transport mechanisms to explain movement of substances into and out of cells.',
    questions: [
      mcq('9700-MEMB', 'easy', 'Which property of phospholipid molecules causes them to form a bilayer in water?', 'They are amphipathic, with a hydrophilic phosphate head and hydrophobic fatty acid tails', ['They are fully hydrophilic, so they dissolve in the cell sap', 'They are polymers built from glucose monomers', 'They contain peptide bonds that cross-link the two layers'],
        'Phospholipids have a polar, hydrophilic phosphate head and non-polar, hydrophobic fatty acid tails. In water the heads face the aqueous solutions on each side while the tails avoid water and point inwards, so a bilayer forms spontaneously. Phospholipids are lipids, not glucose polymers, and contain no peptide bonds; a fully hydrophilic molecule would dissolve rather than form a membrane.', 'Identify', 'AO1'),
      mcq('9700-MEMB', 'easy', 'Which statement correctly defines osmosis?', 'The net movement of water molecules across a partially permeable membrane from a region of higher (less negative) water potential to a region of lower (more negative) water potential', ['The movement of solute molecules from a dilute solution to a concentrated solution', 'The active transport of water molecules against their water potential gradient', 'The diffusion of water from a region of lower water potential to a region of higher water potential'],
        'Osmosis concerns water, not solute: water moves by diffusion across a partially permeable membrane down its own water potential gradient — from higher (less negative) to lower (more negative) water potential. No ATP is involved, so osmosis cannot be active transport, and water cannot diffuse up its own potential gradient.', 'State', 'AO1'),
      mcq('9700-MEMB', 'medium', 'Which change would increase the rate of simple diffusion of oxygen across a cell surface membrane?', 'Increasing the concentration gradient of oxygen across the membrane', ['Decreasing the temperature of the cell', 'Increasing the thickness of the membrane', 'Decreasing the surface area of the membrane'],
        'Fick’s law states that the rate of diffusion is proportional to (surface area × concentration gradient) ÷ thickness of the exchange surface. A steeper concentration gradient therefore speeds diffusion, while a thicker membrane, a smaller surface area or a lower temperature (which slows molecular motion) all reduce the rate. Oxygen is small and non-polar, so it dissolves through the phospholipid bilayer and needs no carrier protein.', 'Apply', 'AO2'),
      mcq('9700-MEMB', 'medium', 'Which statement correctly describes the role of cholesterol in the cell surface membrane?', 'It sits between the phospholipids and regulates fluidity, restraining phospholipid movement to give the membrane mechanical stability', ['It forms channels that allow ions to cross the membrane by facilitated diffusion', 'It acts as an energy store that is respired when ATP runs low', 'It acts as the main receptor molecule for hormone recognition'],
        'Cholesterol is a small lipid that inserts between the phospholipid tails, with its hydroxyl group held near the heads. It buffers fluidity: at higher temperatures it restrains phospholipid movement, and at lower temperatures it stops the tails packing too closely, while also reducing permeability to small water-soluble molecules. Transport channels are proteins, energy storage is not a membrane role of cholesterol, and hormone receptors are glycoproteins or glycolipids.', 'Describe', 'AO1'),
      mcq('9700-MEMB', 'hard', 'Glucose is absorbed from the small intestine into epithelial cells even when its concentration in the gut lumen is lower than inside the cells. Which mechanism makes this possible?', 'Cotransport, in which sodium ions move down their electrochemical gradient through a carrier protein that simultaneously carries glucose in against its gradient', ['Simple diffusion of glucose through the phospholipid bilayer', 'Facilitated diffusion of glucose down its own concentration gradient', 'Exocytosis of glucose-containing vesicles into the epithelial cells'],
        'This is secondary active transport: the sodium–potassium pump keeps the sodium concentration low inside the epithelial cell, so sodium ions flow back in down their gradient through a cotransporter protein, dragging glucose with them even against the glucose gradient. Glucose is polar and cannot cross the bilayer by simple diffusion; facilitated diffusion can only move glucose down, not against, its gradient; and exocytosis exports material from cells in vesicles — it does not absorb glucose.', 'Explain', 'AO2'),
    ],
  },
  {
    key: 'metabolism',
    topicId: 'topic_alevel_bio_metabolism',
    code: '9700-METAB',
    title: 'Metabolism: Respiration and Photosynthesis',
    objective: 'Apply knowledge of respiration and photosynthesis pathways, including the sites and carriers involved in ATP synthesis.',
    questions: [
      mcq('9700-METAB', 'easy', 'Which gas is released when water molecules are split during the light-dependent reactions of photosynthesis?', 'Oxygen', ['Carbon dioxide', 'Nitrogen', 'Hydrogen'],
        'Photolysis of water at photosystem II splits water into oxygen, protons and electrons: 2H₂O → O₂ + 4H⁺ + 4e⁻. The oxygen is released as a gas, while the protons and electrons reduce NADP and replace the electrons lost from the photosystems. Carbon dioxide is fixed later in the Calvin cycle, not released by photolysis, and hydrogen is transferred to NADP rather than released as a gas.', 'Identify', 'AO1'),
      mcq('9700-METAB', 'medium', 'In a eukaryotic cell carrying out aerobic respiration, where is most of the ATP produced?', 'At ATP synthase enzymes on the inner mitochondrial membrane during oxidative phosphorylation', ['In the cytoplasm during glycolysis', 'In the mitochondrial matrix during the Krebs cycle', 'On the outer mitochondrial membrane'],
        'The bulk of ATP — around 30 or more molecules per glucose — comes from oxidative phosphorylation: the electron transport chain pumps protons across the inner mitochondrial membrane and the resulting chemiosmotic gradient drives ATP synthase on the cristae. Glycolysis in the cytoplasm nets only 2 ATP, and the Krebs cycle in the matrix yields little ATP directly; its main job is producing reduced NAD and reduced FAD to feed the electron transport chain. The outer membrane plays no part in ATP synthesis.', 'Identify', 'AO1'),
      mcq('9700-METAB', 'hard', 'In the Calvin cycle, which molecule directly supplies the hydrogen that reduces glycerate-3-phosphate (GP) to triose phosphate (TP)?', 'Reduced NADP', ['ATP', 'Reduced NAD', 'Reduced FAD'],
        'The reduction of GP to TP uses reduced NADP (NADPH) as the reducing agent, with ATP supplying the energy for the reaction — both are products of the light-dependent reactions. ATP carries energy but no hydrogen, so it cannot reduce GP. NAD and FAD are the hydrogen carriers of respiration, not photosynthesis; the chloroplast light reactions reduce NADP, not NAD.', 'Identify', 'AO2'),
    ],
  },
  {
    key: 'genetics',
    topicId: 'topic_alevel_bio_genetics',
    code: '9700-GEN',
    title: 'Genetics, Inheritance and Evolution',
    objective: 'Apply knowledge of genes, inheritance patterns and mutations to genetic problems.',
    questions: [
      mcq('9700-GEN', 'easy', 'Which statement best defines a gene?', 'A sequence of DNA nucleotides at a particular locus on a chromosome that codes for a specific polypeptide', ['An entire chromosome inherited from one parent', 'A sequence of three amino acids that codes for a nucleotide', 'A protein that switches other proteins on and off'],
        'A gene is a length of DNA occupying a fixed position (locus) that carries the coded instructions for making one polypeptide. A chromosome is a whole DNA molecule carrying many genes, so a gene cannot be a whole chromosome; the coding relationship runs from nucleotide triplets (codons) to amino acids, not the reverse; and regulatory proteins are gene products, not the definition of a gene itself.', 'State', 'AO1'),
      mcq('9700-GEN', 'medium', 'In shorthorn cattle, coat colour shows codominance: the genotype RR gives a red coat, WW gives a white coat and RW gives a roan (mixed red-and-white) coat. Two roan cattle are crossed. What phenotypic ratio is expected among their offspring?', '1 red : 2 roan : 1 white', ['3 red : 1 white', '1 red : 1 white', 'All roan'],
        'The cross is RW × RW, giving genotypes 1 RR : 2 RW : 1 WW. Because the alleles are codominant, the heterozygote has its own distinct roan phenotype rather than blending or full dominance, so the phenotypic ratio matches the genotypic ratio: 1 red : 2 roan : 1 white. The classic 3 : 1 ratio appears only when one allele is fully dominant, and 1 : 1 is a test-cross ratio.', 'Apply', 'AO2'),
      mcq('9700-GEN', 'hard', 'Sickle cell anaemia is caused by a mutation in the β-globin gene in which one DNA base is substituted, replacing the amino acid glutamic acid with valine at position 6 of the polypeptide. Which type of mutation is this?', 'A missense mutation — a base substitution that changes one codon and therefore one amino acid', ['A frameshift mutation caused by a base deletion', 'A nonsense mutation that creates a premature stop codon', 'A silent mutation that leaves the amino acid sequence unchanged'],
        'Substituting one base (A for T in the sixth codon, changing GAG to GTG) changes a single codon so that a different amino acid — valine instead of glutamic acid — is inserted; this is a missense point mutation. No bases are added or removed, so the reading frame is preserved and it cannot be a frameshift; the new codon still specifies an amino acid, so it is not a nonsense mutation; and because the amino acid changes, it is by definition not silent.', 'Analyse', 'AO2'),
    ],
  },
  {
    key: 'homeostasis',
    topicId: 'topic_alevel_bio_homeostasis',
    code: '9700-HOME',
    title: 'Control and Homeostasis',
    objective: 'Apply knowledge of hormonal control, osmoregulation and feedback mechanisms to homeostatic regulation.',
    questions: [
      mcq('9700-HOME', 'easy', 'Which region of the brain contains the osmoreceptors and thermoreceptors that monitor the water potential and the temperature of the blood?', 'The hypothalamus', ['The cerebellum', 'The medulla oblongata', 'The pituitary gland'],
        'The hypothalamus is the body’s homeostatic control centre: its osmoreceptors detect changes in the water potential of the blood and trigger ADH release, and its thermoregulatory centre monitors blood temperature. The cerebellum coordinates movement and balance, and the medulla controls heart rate and breathing. The pituitary gland is the classic misconception — it releases ADH into the blood, but the hormone is made in, and its release is controlled by, the hypothalamus.', 'Identify', 'AO1'),
      mcq('9700-HOME', 'easy', 'Which cells of the islets of Langerhans in the pancreas secrete insulin?', 'Beta (β) cells', ['Alpha (α) cells', 'Delta (δ) cells', 'Acinar cells'],
        'The beta cells of the islets of Langerhans detect a rise in blood glucose and secrete insulin, which stimulates cells to absorb glucose and the liver and muscles to store it as glycogen. Alpha cells secrete glucagon, which raises blood glucose — the two hormones are antagonistic and easily confused. Delta cells secrete somatostatin, and acinar cells secrete digestive enzymes into the pancreatic duct, not hormones into the blood.', 'Identify', 'AO1'),
      mcq('9700-HOME', 'hard', 'Why is the control of blood glucose concentration described as a negative feedback mechanism?', 'A rise in glucose triggers insulin release, which lowers glucose back towards the set point, and this fall then reduces further insulin secretion, preventing overshoot', ['Because insulin always has a negative (harmful) effect on body cells', 'Because blood glucose concentration is always falling in a healthy person', 'Because the pancreas permanently inhibits the liver from releasing glucose'],
        'In negative feedback, the output of a process counteracts the original stimulus: the response to high glucose (insulin driving glucose uptake and glycogenesis) removes the stimulus itself, so insulin secretion falls again as glucose returns to the set point. This self-limiting loop keeps the concentration oscillating narrowly around a norm instead of overshooting into hypoglycaemia. “Negative” refers to the direction of correction, not to any harmful effect, and the pancreas and liver cooperate rather than the pancreas permanently inhibiting the liver.', 'Explain', 'AO2'),
    ],
  },
  {
    key: 'biodiversity',
    topicId: 'topic_alevel_bio_biodiversity',
    code: '9700-BIODIV',
    title: 'Biodiversity and Conservation',
    objective: 'Apply knowledge of species concepts, diversity measurement and conservation strategies.',
    questions: [
      mcq('9700-BIODIV', 'easy', 'Which statement best defines a species?', 'A group of similar organisms that can interbreed to produce fertile offspring', ['All the organisms living in the same habitat', 'Organisms that share completely identical DNA', 'All the organisms placed in the same genus'],
        'The biological species concept defines a species by reproductive compatibility: members can interbreed in nature and produce fertile offspring, whereas hybrids between different species (such as the mule) are sterile. Occupying the same habitat describes a community, not a species; individuals of a species vary genetically, so identical DNA is neither possible nor required; and a genus is a taxonomic rank that may contain many species.', 'State', 'AO1'),
      mcq('9700-BIODIV', 'easy', 'Which of the following is an example of ex situ conservation?', 'Storing seeds in a seed bank away from the species’ natural habitat', ['Establishing a national park to protect a savanna ecosystem', 'Declaring a forest reserve where logging is banned', 'Restoring a degraded wetland so that native species recolonise it'],
        'Ex situ means “out of place”: conservation outside the natural habitat, such as seed banks, botanic gardens, zoos and captive breeding programmes. National parks, forest reserves and habitat restoration all protect species within their natural environment, which is in situ conservation — the distinction between the two strategies is a favourite examination target.', 'Identify', 'AO1'),
      mcq('9700-BIODIV', 'medium', 'Which change in a habitat would increase the value of Simpson’s index of diversity (D)?', 'A greater number of species, with individuals more evenly distributed among those species', ['One species becoming strongly dominant over all the others', 'A fall in the total number of species present', 'An increase in the physical area of the habitat alone'],
        'Simpson’s index rises with both species richness (more species) and evenness (similar abundances), because the formula D = 1 − Σ(n/N)² penalises communities dominated by a few species. Strong dominance by one species or a fall in species number lowers D. A larger area may allow more species to exist, but area by itself does not enter the calculation, so it is not a direct cause of a higher index.', 'Apply', 'AO2'),
      mcq('9700-BIODIV', 'medium', 'Why is maintaining genetic diversity within a species important for its long-term survival?', 'Genetic variation gives natural selection raw material with which to adapt the population to changing conditions such as new diseases or a shifting climate', ['Genetic diversity directly increases the mutation rate of the population', 'Genetically diverse populations are guaranteed to grow larger', 'Genetic diversity is only important for species kept in captivity'],
        'A population with high genetic diversity is likely to contain some individuals whose alleles suit new selection pressures, so the population can evolve rather than go extinct when the environment changes. Diversity does not raise the mutation rate — it reflects variation already present; it improves resilience rather than guaranteeing population growth; and it matters for wild populations just as much as captive ones, as bottlenecked species such as the cheetah illustrate.', 'Explain', 'AO2'),
      mcq('9700-BIODIV', 'hard', 'Scientists compare the amino acid sequences of the respiratory protein cytochrome c in different species. Species with more similar cytochrome c sequences are interpreted as being…', '…more closely related, having diverged from a common ancestor more recently, because fewer mutations have accumulated since their lineages split', ['…adapted to more similar habitats, because the environment determines the protein sequence', '…possessing the same number of chromosomes, since sequence similarity fixes the karyotype', '…products of convergent evolution, because similar proteins must arise independently'],
        'Cytochrome c performs the same conserved function in aerobic respiration across species, so differences in its sequence accumulate largely by mutation over time. The fewer the differences between two species, the more recently their lineages shared a common ancestor — the basis of molecular phylogenetics. Habitat similarity does not directly write protein sequences, chromosome number is unrelated to the sequence of a single protein, and shared ancestry — not convergence — is the correct inference for such a conserved molecule.', 'Analyse', 'AO2'),
    ],
  },
  {
    key: 'biotech',
    topicId: 'topic_alevel_bio_biotech',
    code: '9700-BIOTECH',
    title: 'Biotechnology and Gene Technology',
    objective: 'Apply knowledge of genetic engineering, PCR and DNA analysis to biotechnological applications.',
    questions: [
      mcq('9700-BIOTECH', 'easy', 'What is the role of the enzyme DNA ligase in genetic engineering?', 'It joins DNA fragments together by forming phosphodiester bonds in the sugar–phosphate backbone', ['It cuts DNA at specific recognition sequences', 'It separates the two strands of DNA by breaking hydrogen bonds', 'It synthesises a complementary DNA copy from an mRNA template'],
        'After a restriction endonuclease cuts both the plasmid vector and the donor DNA to give complementary sticky ends, DNA ligase seals the sugar–phosphate backbone by catalysing the formation of phosphodiester bonds, producing recombinant DNA. Cutting is the job of restriction enzymes; strand separation is achieved by heat in PCR or by helicase in living cells; and copying mRNA into DNA is the role of reverse transcriptase.', 'Identify', 'AO1'),
      mcq('9700-BIOTECH', 'easy', 'Which feature makes bacteria such as Escherichia coli useful as hosts for producing human proteins?', 'They contain plasmids that can be modified as vectors, and they reproduce rapidly so large quantities of the gene product are made quickly', ['They contain no DNA of their own, so the human gene is the only DNA present', 'They are eukaryotes, so they process proteins exactly as human cells do', 'They lack ribosomes, so no unwanted bacterial proteins are made'],
        'Bacteria carry small circular plasmids that are easy to cut, modify with a foreign gene and reinsert, and they divide as often as every 20 minutes in fermenters, amplifying the gene and its protein product at industrial scale. Bacteria certainly have their own DNA; they are prokaryotes — a genuine limitation, because they cannot always add the carbohydrate groups found on human glycoproteins; and they must have ribosomes to translate the human gene at all.', 'Identify', 'AO1'),
      mcq('9700-BIOTECH', 'medium', 'In the polymerase chain reaction, why must two short DNA primers be added to the reaction mixture?', 'DNA polymerase can only add nucleotides to an existing strand, so the primers anneal to the template and mark the two ends of the region to be copied', ['The primers cut the template DNA into fragments that are easier to copy', 'The primers supply the energy needed for DNA synthesis', 'The primers sterilise the mixture by binding any contaminating DNA'],
        'Taq DNA polymerase needs a free 3′ end to extend, and the two primers — complementary to sequences flanking the target region on opposite strands — provide those starting points and define exactly which stretch of DNA is amplified. Primers are not enzymes, so they cannot cut DNA; the energy for synthesis comes from the nucleotide triphosphates themselves; and specificity comes from choosing primer sequences unique to the target, not from binding contaminants.', 'Explain', 'AO2'),
      mcq('9700-BIOTECH', 'medium', 'Which statement correctly states an advantage of producing human insulin from genetically engineered bacteria rather than extracting insulin from pigs or cattle?', 'The bacterial product is identical to human insulin, so it is less likely to trigger an immune response and can be produced in large, pure quantities', ['Animal insulin works faster than human insulin because it is a stronger molecule', 'Bacterial insulin does not need to be purified before medical use', 'GM bacteria produce insulin only when patients need it, avoiding storage'],
        'Animal insulins differ from human insulin by a few amino acids, so some patients developed allergic reactions and antibody resistance; recombinant human insulin has exactly the human amino acid sequence, avoiding this, and fermenters yield unlimited, consistent and ethically uncontroversial supplies. Animal insulin is not “stronger”; every pharmaceutical protein must be rigorously purified from the bacterial culture; and the bacteria produce insulin during fermentation, not in response to patient demand.', 'Explain', 'AO2'),
      mcq('9700-BIOTECH', 'hard', 'In gel electrophoresis of DNA, why do the fragments migrate towards the positive electrode (anode), and why do the smallest fragments travel furthest?', 'DNA is negatively charged because of its phosphate groups, so it is attracted to the anode, and shorter fragments move through the pores of the agarose gel faster than longer ones', ['DNA is positively charged because of its nitrogenous bases, and longer fragments carry more charge so move faster', 'Fragments move by simple diffusion, so the distance travelled is random and unrelated to size', 'DNA is repelled by the negative electrode because the gel itself is positively charged'],
        'Every phosphate group in the DNA backbone carries a negative charge, so all fragments — regardless of length — are drawn towards the anode when the electric field is applied. The agarose gel acts as a molecular sieve: short fragments thread through its pores more easily and travel further in a given time, separating the sample by size. Charge per unit length is the same for all fragments, movement is driven by the field rather than random diffusion, and the gel matrix is neutral.', 'Explain', 'AO2'),
    ],
  },
  {
    key: 'immunity',
    topicId: 'topic_alevel_bio_immunity',
    code: '9700-IMM',
    title: 'Immunity',
    objective: 'Apply knowledge of immune responses, types of immunity and immunological memory to defence against disease.',
    questions: [
      mcq('9700-IMM', 'easy', 'A breastfed baby receives antibodies against intestinal infections in its mother’s milk. Which type of immunity does this give the baby?', 'Natural passive immunity', ['Artificial passive immunity', 'Natural active immunity', 'Artificial active immunity'],
        'The baby receives ready-made antibodies rather than making its own, so the immunity is passive; it happens naturally through breast milk (or across the placenta), not by medical injection, so it is natural. Artificial passive immunity is an injection of antibodies such as antivenom; active immunity — natural or artificial — means the person’s own lymphocytes respond to antigen and produce antibodies and memory cells, which gives longer-lasting protection.', 'Identify', 'AO1'),
      mcq('9700-IMM', 'medium', 'A helper T cell recognises antigen presented on the surface of a macrophage. Which events then follow?', 'The helper T cell clones itself and secretes cytokines that stimulate B cells to become plasma cells and that activate cytotoxic T cells and macrophages', ['The helper T cell immediately secretes large quantities of antibody', 'The helper T cell engulfs the macrophage by phagocytosis', 'The helper T cell converts directly into a plasma cell'],
        'Helper T cells are the coordinators of the specific immune response: once activated by an antigen-presenting cell they proliferate and release cytokines that drive B-cell clonal selection and differentiation into antibody-secreting plasma cells, stimulate cytotoxic (killer) T cells, and enhance macrophage activity. Only plasma cells derived from B cells secrete antibody — the commonest confusion at this level; T cells are not phagocytes and cannot become plasma cells.', 'Describe', 'AO2'),
      mcq('9700-IMM', 'medium', 'Why is the secondary immune response to a previously encountered pathogen faster, and why does it produce a higher antibody concentration, than the primary response?', 'Memory B cells and memory T cells made during the first exposure proliferate rapidly on re-exposure, producing many plasma cells at once', ['High levels of antibody from the first infection remain in the blood for life', 'The pathogen is weaker the second time it infects the body', 'Antibodies from the first infection mutate to match the pathogen better'],
        'The primary response leaves long-lived memory cells; on re-infection these are already specific for the pathogen, so clonal expansion begins immediately, the antibody concentration rises steeply within hours rather than days, and it peaks far higher. Antibody from the first infection actually falls to low levels within months — that is the misconception this question targets; the pathogen is not weaker, and existing antibodies do not mutate — the new antibody comes from newly generated plasma cells.', 'Explain', 'AO2'),
      mcq('9700-IMM', 'hard', 'HIV destroys helper T cells, eventually causing AIDS. Why does the loss of helper T cells make patients vulnerable to opportunistic infections?', 'Helper T cells coordinate both the humoral and the cell-mediated responses, so without them B cells cannot be properly activated and cytotoxic T cells cannot be stimulated, crippling defence against many pathogens', ['HIV directly attacks and kills every type of body cell, including skin and nerve cells', 'HIV destroys the bone marrow, so no blood cells of any kind are produced', 'The patient’s antibodies attack their own tissues once helper T cells are gone'],
        'Helper T cells sit at the hub of specific immunity: their cytokines are required for full B-cell activation and antibody production, for activating the cytotoxic T cells that kill virus-infected cells, and for boosting macrophage activity. As HIV depletes them, the whole network fails, so normally harmless organisms cause severe opportunistic infections. HIV does not kill skin or nerve cells directly, does not destroy the bone marrow, and AIDS is immune collapse, not autoimmunity.', 'Explain', 'AO2'),
    ],
  },
];

// Prod-canonical A-Level Biology topic ids (verified against prod D1 on 2026-09-09).
// The eight sprint-1 topics are seeded on fresh baselines by migration 432; only
// topic_alevel_bio_ecology exists in prod but on no fresh baseline, so the
// foundation migration INSERT OR IGNOREs it. On prod every id already exists, so
// the insert no-ops.
const ecologyTopicRow = ['topic_alevel_bio_ecology', subjectId, null, 'Ecology and Nutrient Cycles', 'ecology-and-nutrient-cycles', 'Energy flow, productivity, nutrient cycles and population sampling', null, null, 9, '2026-09-09T00:00:00.000Z'];
const prodVerifiedTopicIds = [
  'topic_alevel_bio_cells',
  'topic_alevel_bio_membranes',
  'topic_alevel_bio_metabolism',
  'topic_alevel_bio_genetics',
  'topic_alevel_bio_homeostasis',
  'topic_alevel_bio_biodiversity',
  'topic_alevel_bio_biotech',
  'topic_alevel_bio_immunity',
  'topic_alevel_bio_ecology',
];

for (const topic of topics) {
  if (!prodVerifiedTopicIds.includes(topic.topicId)) throw new Error(`${topic.key}: topic id ${topic.topicId} is not a prod-verified canonical topic`);
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
    id: `q_albio_${topic.key}_s2_${String(index + 1).padStart(3, '0')}`,
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
    id: `q_albio_${topic.key}_s2_${String(index + 1).padStart(3, '0')}`,
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
    id: `q_albio_${topic.key}_s2_${String(index + 1).padStart(3, '0')}`,
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
    specificationCode: 'BRILLA-9700-ALBIO-S2-001',
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
  if (typeCounts.multiple_choice !== 43) errors.push(`expected 43 MCQs, found ${typeCounts.multiple_choice}`);
  if (typeCounts.calculation !== 2) errors.push(`expected 2 calculations, found ${typeCounts.calculation}`);
  if (typeCounts.structured !== 3) errors.push(`expected 3 structured questions, found ${typeCounts.structured}`);
  const expectedTopicCounts = {
    ecology: 16,
    cells: 4,
    membranes: 5,
    metabolism: 3,
    genetics: 3,
    homeostasis: 3,
    biodiversity: 5,
    biotech: 5,
    immunity: 4,
  };
  for (const topic of topics) {
    if (topicCounts.get(topic.code) !== expectedTopicCounts[topic.key]) errors.push(`${topic.key}: expected ${expectedTopicCounts[topic.key]} questions, found ${topicCounts.get(topic.code) ?? 0}`);
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

// Each migration stages its rows once in scratch tables (_migration_N_expected*)
// and both inserts and fail-closed checks read from them: A-Level explanations are too
// long for the NSMQ pattern (which repeats every field value in the preflight match AND
// the INSERT) to fit a topic migration under the remote D1 query limit.
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

let migrationNumber = 472;
{
  const name = `${migrationNumber}_alevel_bio_sprint2_foundation.sql`;
  const allTopicIds = topics.map((topic) => topic.topicId);
  const lines = [
    `-- ${migrationNumber}: Foundation guard for Cambridge A-Level Biology (9700) content sprint 2 (batch ${batchId}).`,
    '-- Original BrillaPrep practice content; not official Cambridge International or WAEC material.',
    '-- Seeds the prod-canonical topic_alevel_bio_ecology row, which exists in prod but',
    '-- on no fresh baseline (prod-patch 096 and migration 432 predate it); INSERT OR',
    '-- IGNORE no-ops on prod where the row already exists.',
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
    `INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES (${ecologyTopicRow.map(sql).join(', ')});`,
    `CREATE TABLE IF NOT EXISTS _migration_${migrationNumber}_guard (valid INTEGER NOT NULL CHECK (valid = 1));`,
    `DELETE FROM _migration_${migrationNumber}_guard;`,
    `INSERT INTO _migration_${migrationNumber}_guard(valid) SELECT CASE WHEN EXISTS (SELECT 1 FROM exam_types WHERE id = '${examTypeId}') AND EXISTS (SELECT 1 FROM exam_boards WHERE id = '${examBoardId}') AND EXISTS (SELECT 1 FROM subjects WHERE id = '${subjectId}' AND exam_type_id = '${examTypeId}') AND (SELECT COUNT(*) FROM topics WHERE id IN (${allTopicIds.map(sql).join(', ')}) AND subject_id = '${subjectId}') = ${allTopicIds.length} THEN 1 ELSE 0 END;`,
    `DROP TABLE _migration_${migrationNumber}_guard;`,
  ];
  await emitMigration(name, lines);
  migrationNumber += 1;
}

const allQuestions = batch.subjects[0].questions;
const ecologyMcqs = allQuestions.filter((question) => question.topicCode === '9700-ECOL' && question.type === 'multiple_choice');
const ecologyCalcs = allQuestions.filter((question) => question.topicCode === '9700-ECOL' && question.type === 'calculation');
const ecologyStructured = allQuestions.filter((question) => question.topicCode === '9700-ECOL' && question.type === 'structured');
const migrationGroups = [
  { key: 'ecology_mcq_a', title: 'Ecology and Nutrient Cycles multiple-choice questions (part 1)', questions: ecologyMcqs.slice(0, 6) },
  { key: 'ecology_mcq_b', title: 'Ecology and Nutrient Cycles multiple-choice questions (part 2)', questions: ecologyMcqs.slice(6) },
  { key: 'ecology_calculations', title: 'Ecology and Nutrient Cycles calculation questions', questions: ecologyCalcs },
  { key: 'ecology_structured', title: 'Ecology and Nutrient Cycles structured questions', questions: ecologyStructured },
  ...topics.slice(1).map((topic) => ({
    key: topic.key,
    title: `${topic.title} questions`,
    questions: allQuestions.filter((question) => question.topicCode === topic.code),
  })),
];

for (const group of migrationGroups) {
  const groupQuestions = group.questions;
  const ids = groupQuestions.map((question) => question.id);
  const expectedTable = `_migration_${migrationNumber}_expected`;
  const expectedPartsTable = `_migration_${migrationNumber}_expected_parts`;
  const guardTable = `_migration_${migrationNumber}_guard`;
  const name = `${migrationNumber}_alevel_bio_sprint2_${group.key}.sql`;
  const structuredRows = groupQuestions
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
    `-- ${migrationNumber}: Original BrillaPrep Cambridge A-Level Biology (9700) ${group.title} (batch ${batchId}).`,
    '-- Curriculum-aligned practice content; not official Cambridge International or WAEC material.',
    'PRAGMA foreign_keys = ON;',
    expectedTableDDL(expectedTable),
    `INSERT INTO ${expectedTable} (id, ${canonicalQuestionFields.join(', ')}) VALUES ${groupQuestions.map((question) => {
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
  const name = `${migrationNumber}_alevel_bio_sprint2_final_guard.sql`;
  const guardTable = `_migration_${migrationNumber}_guard`;
  const allIds = allQuestions.map((question) => question.id);
  const structuredPartTotal = allQuestions
    .filter((question) => question.type === 'structured')
    .reduce((total, question) => total + question.parts.length, 0);
  const lines = [
    `-- ${migrationNumber}: Final exact-set and relationship guard for Cambridge A-Level Biology sprint 2 (batch ${batchId}).`,
    'PRAGMA foreign_keys = ON;',
    `CREATE TABLE IF NOT EXISTS ${guardTable} (valid INTEGER NOT NULL CHECK (valid = 1));`,
    `DELETE FROM ${guardTable};`,
    `INSERT INTO ${guardTable}(valid) SELECT CASE WHEN (SELECT COUNT(*) FROM questions q JOIN topics t ON t.id = q.topic_id JOIN question_content_releases r ON r.question_id = q.id WHERE q.id IN (${allIds.map(sql).join(', ')}) AND q.subject_id = '${subjectId}' AND q.subject_id = t.subject_id AND q.exam_type_id = '${examTypeId}' AND q.exam_board_id = '${examBoardId}' AND length(q.explanation) >= 80 AND r.batch_id = '${batchId}' AND r.quality_assurance = 'automated_beta' AND r.release_channel = 'beta' AND r.official_exam_board_content = 0 AND r.feedback_enabled = 1) = 48 AND (SELECT COUNT(*) FROM questions q WHERE q.id IN (${allIds.map(sql).join(', ')}) AND q.question_type = 'multiple_choice' AND json_valid(q.options) AND json_array_length(q.options) = 4 AND q.correct_answer IN ('A','B','C','D')) = 43 AND (SELECT COUNT(*) FROM questions q WHERE q.id IN (${allIds.map(sql).join(', ')}) AND q.question_type = 'calculation' AND q.options IS NULL) = 2 AND (SELECT COUNT(*) FROM questions q WHERE q.id IN (${allIds.map(sql).join(', ')}) AND q.question_type = 'structured') = 3 AND (SELECT COUNT(*) FROM structured_question_parts WHERE question_id IN (${allIds.map(sql).join(', ')})) = ${structuredPartTotal} AND (SELECT COUNT(*) FROM question_content_releases WHERE batch_id = '${batchId}') = 48 THEN 1 ELSE 0 END;`,
    `DROP TABLE ${guardTable};`,
  ];
  await emitMigration(name, lines);
  migrationNumber += 1;
}

console.log(JSON.stringify({ validation: { valid: validation.valid, warnings: validation.warnings, metrics: validation.metrics }, outBatch, migrations: migrationPaths }, null, 2));
