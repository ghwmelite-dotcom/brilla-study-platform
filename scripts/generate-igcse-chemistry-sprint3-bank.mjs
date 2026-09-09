import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeQuestionText, validateQuestionBatch } from './question-content-lib.mjs';

const sourceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputRootArgument = process.argv.indexOf('--output-root');
if (outputRootArgument >= 0 && !process.argv[outputRootArgument + 1]) throw new Error('--output-root requires a path');
const outputRoot = outputRootArgument >= 0 ? resolve(process.argv[outputRootArgument + 1]) : sourceRoot;
const generatedAt = '2026-09-10T09:00:00Z';
const labels = ['A', 'B', 'C', 'D'];
const batchId = 'igcse-chemistry-sprint3-001';
const subjectId = 'subj_igcse_chemistry';
const examTypeId = 'igcse';
const examBoardId = 'board_cambridge';
const contentLabel = 'Original BrillaPrep practice content aligned to the published Cambridge IGCSE Chemistry (0620) syllabus; not official Cambridge International, WAEC or NSMQ examination material. Use the enabled feedback channel to report corrections.';
// Per-item label for structured (theory) items: question-content-lib requires
// theory items to carry a label that explicitly states "not official WAEC".
const itemContentLabel = 'Original BrillaPrep practice material aligned to the published Cambridge IGCSE Chemistry (0620) syllabus; not official Cambridge International material and not official WAEC material. Use the enabled feedback channel to report corrections.';
const releaseSourceUrl = 'https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-igcse-chemistry-0620/';

const cambridgeSource = {
  publisher: 'Cambridge International Education',
  title: 'Cambridge IGCSE Chemistry (0620) syllabus',
  url: releaseSourceUrl,
  use: 'curriculum_blueprint_only',
};

// Topic ids are the prod-canonical rows for subj_igcse_chemistry (verified
// read-only against brilla-db on 2026-09-10). All ten rows exist on prod and
// on fresh baselines (prod patch 096). Migration 593 re-asserts every row with
// INSERT OR IGNORE. Distribution follows artifacts/sprint3/cells-igcse-chemistry.json:
// all ten have:0 easy/medium MCQ cells are filled completely (40 items), then
// the assignment-emphasis topics (stoichiometry, electrolysis, organic,
// energetics/reactions) receive their have:0 hard-MCQ cells, plus one
// calculation for periodic/acids and one structured item for atomic, bonding,
// metals, analysis and reactions.
const topics = [
  ['IGC-ATO', 'topic_igcse_chem_atomic', 'Matter and Atomic Structure',
    'Describe particles, atomic structure, isotopes and electron arrangements for the first twenty elements.'],
  ['IGC-PER', 'topic_igcse_chem_periodic', 'The Periodic Table',
    'Relate group and period position to electron arrangement and describe trends in Groups I and VII and the noble gases.'],
  ['IGC-BON', 'topic_igcse_chem_bonding', 'Chemical Bonding',
    'Distinguish ionic, covalent and metallic bonding and link structure to physical properties.'],
  ['IGC-STO', 'topic_igcse_chem_stoichiometry', 'Stoichiometry',
    'Use the mole concept, relative formula mass and balanced equations to calculate reacting masses and concentrations.'],
  ['IGC-REA', 'topic_igcse_chem_reactions', 'Reactions, Rates and Energetics',
    'Explain rates of reaction using collision theory, interpret reversible reactions and calculate enthalpy changes.'],
  ['IGC-ACI', 'topic_igcse_chem_acids', 'Acids, Bases and Salts',
    'Describe acid and alkali properties, neutralisation reactions and the preparation of pure salts.'],
  ['IGC-MET', 'topic_igcse_chem_metals', 'Metals and Reactivity',
    'Use the reactivity series to predict reactions of metals, their extraction methods and corrosion.'],
  ['IGC-ORG', 'topic_igcse_chem_organic', 'Organic Chemistry',
    'Identify homologous series, functional groups and reactions of alkanes, alkenes, alcohols, acids and polymers.'],
  ['IGC-ELE', 'topic_igcse_chem_electrolysis', 'Electrolysis',
    'Predict the products of electrolysing molten and aqueous ionic compounds using inert electrodes.'],
  ['IGC-ANA', 'topic_igcse_chem_analysis', 'Experimental Techniques and Chemical Analysis',
    'Select tests to identify gases, cations and anions and interpret chromatography results.'],
];

const q = (topicCode, difficulty, prompt, correct, wrong, solution, commandWord, assessmentObjective) =>
  ({ topicCode, type: 'multiple_choice', difficulty, prompt, correct, wrong, solution, commandWord, assessmentObjective });
const calc = (topicCode, difficulty, prompt, answer, solution, commandWord, assessmentObjective) =>
  ({ topicCode, type: 'calculation', difficulty, prompt, answer, solution, commandWord, assessmentObjective });
const struct = (topicCode, difficulty, prompt, parts, summary, solution, commandWord, assessmentObjective) =>
  ({ topicCode, type: 'structured', difficulty, prompt, parts, summary, solution, commandWord, assessmentObjective });

const questions = [
  // --- Matter and Atomic Structure (topic_igcse_chem_atomic): 4 medium MCQ (have:0 cell) + 1 structured
  q('IGC-ATO', 'medium', 'An atom of carbon-14 has proton number 6 and nucleon number 14. How many neutrons does the atom contain?', '8', ['6', '14', '20'],
    'Number of neutrons = nucleon number − proton number = 14 − 6 = 8. (6 is the number of protons; 14 is the nucleon number; 20 adds the numbers instead of subtracting.)', 'Determine', 'AO2'),
  q('IGC-ATO', 'medium', 'An element X has atomic number 12. What is the electronic configuration of an atom of X?', '2,8,2', ['2,8,8', '8,2,2', '2,10'],
    'An atom of X has 12 electrons. The first shell holds 2 electrons and the second holds 8, leaving 2 in the third shell: 2,8,2. (2,8,8 is argon with 18 electrons; 8,2,2 fills the shells in the wrong order.)', 'Determine', 'AO2'),
  q('IGC-ATO', 'medium', 'Which sub-atomic particle has a charge of −1 and a negligible mass?', 'Electron', ['Proton', 'Neutron', 'Alpha particle'],
    'The electron has a relative charge of −1 and a relative mass of about 1/1840, which is negligible. (A proton has charge +1 and relative mass 1; a neutron is neutral with relative mass 1; an alpha particle is a helium nucleus of charge +2.)', 'State', 'AO1'),
  q('IGC-ATO', 'medium', 'Magnesium has atomic number 12. How many electrons are there in one Mg²⁺ ion?', '10', ['12', '14', '8'],
    'A neutral magnesium atom has 12 electrons. The Mg²⁺ ion forms when the atom loses its two outer-shell electrons, leaving 12 − 2 = 10 electrons. (14 wrongly adds the charge; 12 ignores it; 8 is only the second-shell population.)', 'Determine', 'AO2'),
  struct('IGC-ATO', 'medium',
    'Chlorine exists naturally as two isotopes, ³⁵Cl and ³⁷Cl. Answer the following questions about these isotopes.',
    [
      { label: '(a)', text: 'Define the term isotope.', correctAnswer: 'Atoms of the same element that have the same number of protons but different numbers of neutrons.', marks: 1 },
      { label: '(b)', text: 'State the numbers of protons, neutrons and electrons in one atom of ³⁷Cl.', correctAnswer: '17 protons, 20 neutrons and 17 electrons.', marks: 2 },
      { label: '(c)', text: 'Explain why ³⁵Cl and ³⁷Cl have identical chemical properties.', correctAnswer: 'Chemical properties depend on the electron arrangement; both isotopes have 17 electrons and the same arrangement, so they react identically.', marks: 1 },
    ],
    '(a) atoms of the same element with different numbers of neutrons; (b) 17 protons, 20 neutrons, 17 electrons; (c) identical electron arrangements give identical chemical properties.',
    '(a) Isotopes are atoms of the same element (same proton number) with different nucleon numbers because they contain different numbers of neutrons. (b) Chlorine has proton number 17, so every chlorine atom has 17 protons and, being neutral, 17 electrons; neutrons = 37 − 17 = 20. (c) Chemical reactions involve only the outer electrons; both isotopes have the configuration 2,8,7, so they behave identically. The extra neutrons change only the mass.',
    'Define', 'AO1'),

  // --- The Periodic Table (topic_igcse_chem_periodic): 4 easy MCQ (have:0 cell) + 1 calculation
  q('IGC-PER', 'easy', 'Which statement about the elements in Group I of the Periodic Table is correct?', 'They are soft metals whose reactivity increases down the group.', ['They are unreactive gases with full outer shells.', 'Their reactivity decreases down the group.', 'They form ions with a 2− charge.'],
    'Group I elements are the alkali metals: soft, with one outer electron. Down the group the outer electron is lost more easily, so reactivity increases from lithium to potassium. (Full outer shells describe Group 0 noble gases; Group I atoms form 1+ ions, not 2−.)', 'Identify', 'AO1'),
  q('IGC-PER', 'easy', 'Which halogen is a green gas at room temperature?', 'Chlorine', ['Bromine', 'Iodine', 'Astatine'],
    'Chlorine is a green gas at room temperature. (Bromine is a red-brown liquid and iodine a grey-black solid; astatine is a dark solid at the bottom of Group VII.)', 'State', 'AO1'),
  q('IGC-PER', 'easy', 'Elements in the same group of the Periodic Table have similar chemical properties. This is because the atoms have the same number of…', 'electrons in their outer shell.', ['electron shells.', 'protons in the nucleus.', 'neutrons in the nucleus.'],
    'Chemical behaviour is governed by the outer-shell electrons, and a group collects elements with the same number of outer electrons. (Atoms in the same period share the number of shells; the proton number is unique to each element; neutron number varies even between isotopes.)', 'State', 'AO1'),
  q('IGC-PER', 'easy', 'Which of the following elements is a noble gas?', 'Argon', ['Nitrogen', 'Chlorine', 'Sodium'],
    'Argon is in Group 0 (Group 18), the noble gases, with a full outer shell of electrons. (Nitrogen and chlorine are reactive non-metals; sodium is an alkali metal.)', 'Identify', 'AO1'),
  calc('IGC-PER', 'medium', 'A sample of chlorine contains 75% of the isotope ³⁵Cl and 25% of the isotope ³⁷Cl. Calculate the relative atomic mass of the chlorine in the sample.', '35.5',
    'Relative atomic mass = (percentage × mass number) for each isotope, summed, divided by 100: (75 × 35 + 25 × 37) ÷ 100 = (2,625 + 925) ÷ 100 = 3,550 ÷ 100 = 35.5. Answer: the relative atomic mass is 35.5.', 'Calculate', 'AO2'),

  // --- Chemical Bonding (topic_igcse_chem_bonding): 4 medium MCQ (have:0 cell) + 1 structured
  q('IGC-BON', 'medium', 'Which substance contains only covalent bonds?', 'Methane, CH₄', ['Sodium chloride, NaCl', 'Magnesium oxide, MgO', 'Calcium fluoride, CaF₂'],
    'Methane contains a non-metal bonded to a non-metal, so its atoms share electrons covalently. (NaCl, MgO and CaF₂ are metal–non-metal compounds with ionic bonding.)', 'Identify', 'AO2'),
  q('IGC-BON', 'medium', 'Solid sodium chloride does not conduct electricity, but molten sodium chloride does. Which statement explains this?', 'The ions are free to move in the molten state.', ['Electrons flow through the molten lattice.', 'The ions gain extra electrons when the solid melts.', 'Sodium chloride becomes a metal when it melts.'],
    'Ionic solids conduct only when their charged ions can move. Melting breaks up the lattice so the ions become mobile and carry the current. (Ionic compounds conduct by moving ions, not electrons; melting supplies energy, not electrons.)', 'Explain', 'AO2'),
  q('IGC-BON', 'medium', 'Graphite conducts electricity. Which feature of its structure explains this?', 'It contains delocalised electrons that can move between the layers.', ['It contains freely moving ions.', 'Its layers are held together by strong covalent bonds.', 'Each carbon atom forms only two covalent bonds.'],
    'In graphite each carbon atom bonds to three others, leaving one delocalised electron per atom that can move along the layers and carry a current. (Graphite has no ions; the bonds within layers are covalent but the layers themselves attract weakly; each carbon forms three bonds, not two.)', 'Explain', 'AO2'),
  q('IGC-BON', 'medium', 'How many shared pairs of electrons are there in one molecule of methane, CH₄?', '4', ['1', '2', '8'],
    'The carbon atom shares one pair of electrons with each of the four hydrogen atoms, giving 4 shared pairs. (8 counts the individual shared electrons rather than the pairs; 2 would satisfy only two hydrogen atoms.)', 'Determine', 'AO2'),
  struct('IGC-BON', 'medium',
    'Sodium reacts with chlorine to form sodium chloride, NaCl. Answer the following questions about the bonding and properties of sodium chloride.',
    [
      { label: '(a)', text: 'Describe, in terms of electrons, how a sodium atom becomes a sodium ion.', correctAnswer: 'A sodium atom (2,8,1) loses its one outer-shell electron to form a Na⁺ ion with the full outer shell 2,8.', marks: 1 },
      { label: '(b)', text: 'State the type of bonding present in sodium chloride.', correctAnswer: 'Ionic bonding — the electrostatic attraction between oppositely charged Na⁺ and Cl⁻ ions.', marks: 1 },
      { label: '(c)', text: 'Explain why sodium chloride has a high melting point.', correctAnswer: 'It forms a giant ionic lattice with strong electrostatic attractions between ions in all directions; a large amount of energy is needed to overcome these attractions.', marks: 2 },
    ],
    '(a) the sodium atom loses its outer electron to form Na⁺; (b) ionic bonding; (c) strong electrostatic attractions throughout the giant lattice need much energy to overcome.',
    '(a) Sodium has the electron arrangement 2,8,1; losing the single outer electron leaves the stable arrangement 2,8 and the ion Na⁺. (b) The transfer of electrons from sodium to chlorine produces oppositely charged ions, so the bonding is ionic. (c) In the solid lattice every ion is surrounded by oppositely charged ions; the strong attractions extend in all directions, so a lot of heat energy is required to separate the ions, giving a high melting point.',
    'Explain', 'AO2'),

  // --- Stoichiometry (topic_igcse_chem_stoichiometry): 4 easy MCQ (have:0 cell) + 1 hard MCQ
  q('IGC-STO', 'easy', 'What is the relative formula mass, Mr, of calcium carbonate, CaCO₃? (Ar: Ca = 40, C = 12, O = 16)', '100', ['68', '56', '96'],
    'Mr = 40 + 12 + (3 × 16) = 40 + 12 + 48 = 100. (68 uses only one oxygen atom; 56 is the Mr of CaO; 96 doubles the oxygen contribution incorrectly.)', 'Calculate', 'AO2'),
  q('IGC-STO', 'easy', 'How many moles are there in 8 g of methane, CH₄? (Ar: C = 12, H = 1)', '0.5 mol', ['2 mol', '8 mol', '16 mol'],
    'Mr of CH₄ = 12 + (4 × 1) = 16, so moles = mass ÷ Mr = 8 ÷ 16 = 0.5 mol. (2 mol inverts the division; 16 g, not 8 g, would be 1 mole.)', 'Calculate', 'AO2'),
  q('IGC-STO', 'easy', 'How many particles are there in one mole of any substance?', '6.02 × 10²³', ['6.02 × 10²²', '1.60 × 10⁻¹⁹', '12'],
    'One mole contains the Avogadro constant of particles: 6.02 × 10²³. (6.02 × 10²² is a tenth of a mole; 1.60 × 10⁻¹⁹ is the charge on an electron in coulombs; 12 g is the mass of one mole of carbon-12, not a particle count.)', 'State', 'AO1'),
  q('IGC-STO', 'easy', 'When the equation CH₄ + O₂ → CO₂ + H₂O is correctly balanced, what is the coefficient of O₂?', '2', ['1', '3', '4'],
    'Balancing gives CH₄ + 2O₂ → CO₂ + 2H₂O: one carbon and four hydrogens on each side, and 2 × 2 = 4 oxygens on the left matching 2 + 2 = 4 on the right. The coefficient of O₂ is therefore 2.', 'Determine', 'AO2'),
  q('IGC-STO', 'hard', 'Calcium carbonate decomposes on heating: CaCO₃ → CaO + CO₂. What mass of calcium oxide is formed when 50 g of calcium carbonate is completely decomposed? (Ar: Ca = 40, C = 12, O = 16)', '28 g', ['22 g', '56 g', '25 g'],
    'Mr(CaCO₃) = 100, so 50 g is 50 ÷ 100 = 0.5 mol. The equation shows a 1 : 1 mole ratio, so 0.5 mol of CaO forms. Mr(CaO) = 40 + 16 = 56, giving a mass of 0.5 × 56 = 28 g. (22 g is the mass of the CO₂ released, 0.5 × 44; 56 g assumes 1 mol of CaO; 25 g simply halves the starting mass.)', 'Calculate', 'AO3'),

  // --- Acids, Bases and Salts (topic_igcse_chem_acids): 4 medium MCQ (have:0 cell) + 1 calculation
  q('IGC-ACI', 'medium', 'Which ion is responsible for the acidic properties of aqueous solutions of acids?', 'The hydrogen ion, H⁺(aq)', ['The hydroxide ion, OH⁻(aq)', 'The oxide ion, O²⁻', 'The hydronium-free metal cation'],
    'Acids produce hydrogen ions, H⁺(aq), in aqueous solution, and it is these ions that give acids their characteristic reactions. (OH⁻ is responsible for alkaline behaviour; oxide ions act as bases.)', 'State', 'AO1'),
  q('IGC-ACI', 'medium', 'What colour is universal indicator in a solution of pH 2?', 'Red', ['Green', 'Purple', 'Blue'],
    'Universal indicator is red in strongly acidic solutions (pH 1–2). (Green indicates a neutral solution of pH 7; blue and purple indicate increasingly alkaline solutions.)', 'State', 'AO1'),
  q('IGC-ACI', 'medium', 'Which type of reaction takes place when dilute hydrochloric acid reacts with aqueous sodium hydroxide?', 'Neutralisation', ['Oxidation', 'Thermal decomposition', 'Displacement'],
    'An acid reacting with an alkali (a soluble base) to form a salt and water is a neutralisation: HCl + NaOH → NaCl + H₂O. (No element changes oxidation state, nothing is broken down by heat, and no element displaces another.)', 'Identify', 'AO1'),
  q('IGC-ACI', 'medium', 'Pure copper(II) sulfate crystals are prepared by adding excess copper(II) oxide to warm dilute sulfuric acid, filtering and crystallising the filtrate. Why is the copper(II) oxide added in excess?', 'To make sure that all of the sulfuric acid has reacted.', ['To make the reaction go faster.', 'To act as a catalyst for the reaction.', 'To increase the amount of sulfuric acid available.'],
    'Copper(II) oxide is insoluble, so any unreacted excess is simply removed by filtration; using an excess guarantees that no acid remains to contaminate the salt solution. (The oxide is a reactant, not a catalyst, and it cannot create more acid.)', 'Explain', 'AO2'),
  calc('IGC-ACI', 'medium', '25.0 cm³ of 0.100 mol/dm³ sodium hydroxide solution exactly neutralises 20.0 cm³ of hydrochloric acid. NaOH + HCl → NaCl + H₂O. Calculate the concentration of the hydrochloric acid in mol/dm³.', '0.125 mol/dm³',
    'Moles of NaOH = 0.100 × (25.0 ÷ 1,000) = 0.00250 mol. The equation shows a 1 : 1 ratio, so moles of HCl = 0.00250 mol in 20.0 cm³. Concentration = 0.00250 ÷ (20.0 ÷ 1,000) = 0.00250 ÷ 0.0200 = 0.125 mol/dm³. Answer: 0.125 mol/dm³.', 'Calculate', 'AO3'),

  // --- Metals and Reactivity (topic_igcse_chem_metals): 4 medium MCQ (have:0 cell) + 1 structured
  q('IGC-MET', 'medium', 'Which metal reacts steadily with cold water, producing hydrogen gas?', 'Calcium', ['Copper', 'Zinc', 'Iron'],
    'Calcium reacts with cold water to give calcium hydroxide and hydrogen. (Zinc and iron react only with steam when red-hot; copper does not react with water at all.)', 'Identify', 'AO2'),
  q('IGC-MET', 'medium', 'An iron nail is placed in blue copper(II) sulfate solution and a brown-pink solid forms on the nail. What is the correct explanation?', 'Iron is more reactive than copper and displaces copper from the solution.', ['Copper is more reactive than iron and dissolves the nail.', 'The nail has begun to rust.', 'Copper(II) sulfate decomposes iron on contact.'],
    'A more reactive metal displaces a less reactive one from its salt solution: Fe + CuSO₄ → FeSO₄ + Cu, and the brown-pink solid is copper. (The reactivity series puts iron above copper; rusting needs oxygen and water, not copper sulfate.)', 'Explain', 'AO2'),
  q('IGC-MET', 'medium', 'Which two substances are both needed for iron to rust?', 'Oxygen and water', ['Oxygen and carbon dioxide', 'Water and salt', 'Nitrogen and water'],
    'Rusting requires both oxygen and water. (Carbon dioxide and nitrogen are not involved; salt only speeds rusting up — it is not essential.)', 'State', 'AO1'),
  q('IGC-MET', 'medium', 'In the blast furnace, iron is extracted from iron(III) oxide. Which substance reduces the iron(III) oxide to iron?', 'Carbon monoxide', ['Oxygen', 'Nitrogen', 'Calcium carbonate'],
    'Carbon monoxide, formed from the burning coke, is the reducing agent: Fe₂O₃ + 3CO → 2Fe + 3CO₂. (Oxygen would oxidise, not reduce; nitrogen is inert here; calcium carbonate removes sandy impurities as slag but does not reduce the ore.)', 'Identify', 'AO2'),
  struct('IGC-MET', 'medium',
    'A student investigates the reactivity of magnesium, zinc, iron and copper by adding a small piece of each metal to separate samples of dilute hydrochloric acid.',
    [
      { label: '(a)', text: 'State what is observed when magnesium is added to dilute hydrochloric acid.', correctAnswer: 'Rapid effervescence (bubbles of hydrogen gas); the magnesium dissolves and the test-tube gets warm.', marks: 1 },
      { label: '(b)', text: 'Write the balanced symbol equation, with state symbols, for the reaction of zinc with dilute hydrochloric acid.', correctAnswer: 'Zn(s) + 2HCl(aq) → ZnCl₂(aq) + H₂(g)', marks: 2 },
      { label: '(c)', text: 'The student observes no reaction with copper. Place all four metals in order of reactivity, most reactive first.', correctAnswer: 'Magnesium > zinc > iron > copper.', marks: 1 },
    ],
    '(a) rapid effervescence as the magnesium dissolves; (b) Zn + 2HCl → ZnCl₂ + H₂; (c) magnesium, zinc, iron, copper.',
    '(a) Magnesium is high in the reactivity series, so it reacts vigorously with the acid, giving bubbles of hydrogen and heat. (b) Zinc forms zinc chloride and hydrogen: Zn(s) + 2HCl(aq) → ZnCl₂(aq) + H₂(g); the 2 balances the chlorine and hydrogen atoms. (c) Vigour of reaction gives magnesium > zinc > iron, and copper, which shows no reaction, is the least reactive of the four.',
    'Describe', 'AO2'),

  // --- Organic Chemistry (topic_igcse_chem_organic): 3 medium MCQ + 2 hard MCQ (have:0 hard cell)
  q('IGC-ORG', 'medium', 'What is the general formula of the alkenes?', 'CₙH₂ₙ', ['CₙH₂ₙ₊₂', 'CₙH₂ₙ₋₂', 'CₙH₂ₙ₊₁OH'],
    'Alkenes contain one C=C double bond, so they have two fewer hydrogen atoms than the corresponding alkane: CₙH₂ₙ. (CₙH₂ₙ₊₂ is the alkane series; CₙH₂ₙ₋₂ would have two degrees of unsaturation; CₙH₂ₙ₊₁OH describes an alcohol.)', 'State', 'AO1'),
  q('IGC-ORG', 'medium', 'Which functional group is present in every molecule of ethanol?', 'The hydroxyl group, –OH', ['The carboxyl group, –COOH', 'The carbon-to-carbon double bond, C=C', 'The ester linkage, –COO–'],
    'Ethanol, C₂H₅OH, is an alcohol, and the alcohol functional group is the hydroxyl group –OH. (–COOH is found in carboxylic acids such as ethanoic acid; C=C is found in alkenes; –COO– is found in esters.)', 'Identify', 'AO1'),
  q('IGC-ORG', 'medium', 'Which monomer is used to manufacture poly(ethene)?', 'Ethene', ['Ethane', 'Ethyne', 'Chloroethene'],
    'Poly(ethene) forms by the addition polymerisation of ethene monomers, whose C=C double bonds open up and link together. (Ethane is saturated and cannot polymerise by addition; chloroethene gives poly(chloroethene), PVC.)', 'Identify', 'AO2'),
  q('IGC-ORG', 'hard', 'Ethanol reacts with ethanoic acid in the presence of a few drops of concentrated sulfuric acid as a catalyst. What are the products of this esterification reaction?', 'Ethyl ethanoate and water', ['Ethyl methanoate and water', 'Ethene and water', 'Ethyl ethanoate and hydrogen'],
    'An alcohol and a carboxylic acid react to form an ester and water: C₂H₅OH + CH₃COOH → CH₃COOC₂H₅ + H₂O. The ester from ethanol and ethanoic acid is ethyl ethanoate. (Ethyl methanoate would need methanoic acid; ethene and water come from dehydrating ethanol; hydrogen is not a product of condensation.)', 'Deduce', 'AO3'),
  q('IGC-ORG', 'hard', 'During cracking, one molecule of decane, C₁₀H₂₂, produces one molecule of octane, C₈H₁₈, and one molecule of X. What is X?', 'Ethene, C₂H₄', ['Ethane, C₂H₆', 'Methane, CH₄', 'Propene, C₃H₆'],
    'The atoms must balance: C₁₀H₂₂ − C₈H₁₈ leaves C₂H₄, which is ethene. Cracking always produces at least one alkene. (C₂H₆ would make the hydrogen count 24, not 22; CH₄ would leave only 9 carbons accounted for; C₃H₆ would need 11 carbons in total.)', 'Deduce', 'AO3'),

  // --- Electrolysis (topic_igcse_chem_electrolysis): 4 easy MCQ (have:0 cell) + 1 hard MCQ
  q('IGC-ELE', 'easy', 'Molten lead(II) bromide is electrolysed using inert electrodes. What is formed at the cathode?', 'Lead', ['Bromine', 'Oxygen', 'Hydrogen'],
    'The cathode is the negative electrode, attracting the positive Pb²⁺ ions, which gain electrons and are discharged as molten lead: Pb²⁺ + 2e⁻ → Pb. (Bromine forms at the anode; there is no oxygen or hydrogen in the melt.)', 'State', 'AO1'),
  q('IGC-ELE', 'easy', 'During electrolysis, which electrode is the anode?', 'The positive electrode', ['The negative electrode', 'The electrode where reduction occurs', 'The electrode at which metals are always deposited'],
    'The anode is defined as the positive electrode, where anions are attracted and oxidation takes place. (The negative electrode is the cathode; reduction occurs at the cathode; metals deposit at the cathode, not the anode.)', 'State', 'AO1'),
  q('IGC-ELE', 'easy', 'Why must an ionic compound be molten, or dissolved in water, before it can be electrolysed?', 'So that its ions are free to move and carry the electric current.', ['So that electrons can flow through the liquid.', 'To increase the voltage of the power supply.', 'To prevent the compound reacting with the electrodes.'],
    'In the solid lattice the ions are locked in fixed positions. Melting or dissolving frees the ions to move to the electrodes, which is how the current is carried through the electrolyte. (Electrolytes conduct by moving ions, not electrons; the voltage comes from the supply.)', 'Explain', 'AO1'),
  q('IGC-ELE', 'easy', 'Which material is commonly used to make inert electrodes for electrolysis?', 'Graphite', ['Copper', 'Iron', 'Aluminium'],
    'Graphite (and platinum) conduct electricity yet are unreactive, so they do not take part in the electrolysis — they are inert. (Copper, iron and aluminium are active electrodes that can themselves oxidise and dissolve at the anode.)', 'State', 'AO1'),
  q('IGC-ELE', 'hard', 'Concentrated aqueous sodium chloride is electrolysed using inert electrodes. What are the products at the cathode and at the anode?', 'Hydrogen at the cathode and chlorine at the anode.', ['Sodium at the cathode and chlorine at the anode.', 'Hydrogen at the cathode and oxygen at the anode.', 'Chlorine at the cathode and hydrogen at the anode.'],
    'At the cathode hydrogen is discharged because hydrogen is less reactive than sodium: 2H⁺ + 2e⁻ → H₂. At the anode, the high chloride concentration means Cl⁻ is discharged rather than OH⁻: 2Cl⁻ → Cl₂ + 2e⁻. (Sodium is never discharged from aqueous solution; oxygen forms at the anode only when the chloride is dilute; the products are never swapped between electrodes.)', 'Predict', 'AO3'),

  // --- Experimental Techniques and Chemical Analysis (topic_igcse_chem_analysis): 4 medium MCQ (have:0 cell) + 1 structured
  q('IGC-ANA', 'medium', 'A solution is acidified with dilute nitric acid, then aqueous silver nitrate is added. A white precipitate forms. Which ion is present in the solution?', 'Chloride, Cl⁻', ['Sulfate, SO₄²⁻', 'Nitrate, NO₃⁻', 'Carbonate, CO₃²⁻'],
    'A white precipitate of silver chloride after acidifying with dilute nitric acid confirms chloride ions. (Sulfate is tested with barium nitrate solution; the nitric acid destroys any carbonate, which would otherwise give a precipitate that dissolves in acid; nitrate gives no precipitate.)', 'Identify', 'AO2'),
  q('IGC-ANA', 'medium', 'What colour does a sodium compound produce in a flame test?', 'Yellow', ['Lilac', 'Brick-red', 'Green'],
    'Sodium compounds give a bright yellow flame. (Lilac is potassium; brick-red is calcium; green is copper(II) or barium.)', 'State', 'AO1'),
  q('IGC-ANA', 'medium', 'Which statement correctly describes the test for ammonia gas?', 'It turns damp red litmus paper blue.', ['It relights a glowing splint.', 'It gives a squeaky pop with a lighted splint.', 'It turns limewater milky.'],
    'Ammonia is the only common alkaline gas, so it turns damp red litmus paper blue. (Relighting a glowing splint is the oxygen test; a squeaky pop indicates hydrogen; milky limewater indicates carbon dioxide.)', 'State', 'AO1'),
  q('IGC-ANA', 'medium', 'In paper chromatography, a spot travels 6.0 cm while the solvent front travels 8.0 cm. What is the Rf value of the spot?', '0.75', ['1.33', '0.60', '0.80'],
    'Rf = distance travelled by the substance ÷ distance travelled by the solvent = 6.0 ÷ 8.0 = 0.75. (1.33 inverts the ratio, and Rf values can never exceed 1; 0.60 and 0.80 come from misreading the two distances.)', 'Calculate', 'AO2'),
  struct('IGC-ANA', 'medium',
    'X is a white solid compound containing one cation and one anion. Answer the following questions about identifying X.',
    [
      { label: '(a)', text: 'A flame test on X gives a lilac flame. Identify the cation present in X.', correctAnswer: 'The potassium ion, K⁺.', marks: 1 },
      { label: '(b)', text: 'Describe a chemical test to show that X contains carbonate ions, and state the observation that confirms a positive result.', correctAnswer: 'Add dilute hydrochloric acid to X; effervescence occurs and the gas evolved turns limewater milky, confirming carbon dioxide and therefore carbonate ions.', marks: 2 },
      { label: '(c)', text: 'Use your answers to (a) and (b) to suggest the identity of X.', correctAnswer: 'Potassium carbonate, K₂CO₃.', marks: 1 },
    ],
    '(a) potassium ions, K⁺; (b) add dilute acid — the gas evolved turns limewater milky; (c) potassium carbonate, K₂CO₃.',
    '(a) A lilac flame is characteristic of potassium compounds. (b) Carbonates react with dilute acids to release carbon dioxide: CO₃²⁻ + 2H⁺ → H₂O + CO₂; bubbling the gas through limewater turns it milky as insoluble calcium carbonate forms. (c) Combining a potassium cation with a carbonate anion gives potassium carbonate, K₂CO₃.',
    'Identify', 'AO2'),

  // --- Reactions, Rates and Energetics (topic_igcse_chem_reactions): 1 easy MCQ, 1 medium MCQ, 2 hard MCQ (have:0 hard cell) + 1 structured
  q('IGC-REA', 'easy', 'Which change increases the rate of the reaction between marble chips and dilute hydrochloric acid?', 'Using powdered marble chips instead of large lumps.', ['Using larger marble chips.', 'Cooling the acid before use.', 'Diluting the acid with more water.'],
    'Powdering the marble increases its surface area, so more particles are exposed to the acid and collisions are more frequent. (Larger chips reduce the surface area; cooling and diluting both slow the reaction.)', 'Identify', 'AO1'),
  q('IGC-REA', 'medium', 'How does a catalyst increase the rate of a chemical reaction?', 'It provides an alternative reaction pathway with a lower activation energy.', ['It increases the temperature of the reactants.', 'It is used up during the reaction.', 'It increases the concentration of the reactants.'],
    'A catalyst works by offering a route of lower activation energy, so a greater proportion of collisions are successful. It is chemically unchanged at the end and does not alter temperature or concentration. (A catalyst that was used up could not, by definition, be a catalyst.)', 'Explain', 'AO2'),
  q('IGC-REA', 'hard', 'For the reaction H₂ + Cl₂ → 2HCl the bond energies are H–H = 436 kJ/mol, Cl–Cl = 243 kJ/mol and H–Cl = 432 kJ/mol. What is the enthalpy change, ΔH, of the reaction?', '−185 kJ/mol', ['+185 kJ/mol', '−247 kJ/mol', '+1,111 kJ/mol'],
    'Energy taken in to break bonds = 436 + 243 = 679 kJ. Energy released forming two H–Cl bonds = 2 × 432 = 864 kJ. ΔH = 679 − 864 = −185 kJ/mol, so the reaction is exothermic. (+185 reverses the sign; −247 forms only one H–Cl bond; +1,111 adds the two energies instead of subtracting.)', 'Calculate', 'AO3'),
  q('IGC-REA', 'hard', 'In the Haber process, N₂(g) + 3H₂(g) ⇌ 2NH₃(g), the forward reaction is exothermic. Which change increases the yield of ammonia at equilibrium?', 'Increasing the pressure', ['Increasing the temperature', 'Adding more iron catalyst', 'Decreasing the pressure'],
    'There are 4 moles of gas on the left and 2 on the right, so increasing the pressure shifts the equilibrium towards the fewer moles — the ammonia side. (The forward reaction is exothermic, so raising the temperature lowers the yield; a catalyst speeds up attainment of equilibrium but does not change the yield; decreasing the pressure favours the reactant side.)', 'Deduce', 'AO3'),
  struct('IGC-REA', 'medium',
    'A student adds 2 g of marble chips (calcium carbonate) to 50 cm³ of dilute hydrochloric acid and measures the volume of carbon dioxide produced every 30 seconds.',
    [
      { label: '(a)', text: 'Write the balanced symbol equation for the reaction between calcium carbonate and hydrochloric acid.', correctAnswer: 'CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂', marks: 2 },
      { label: '(b)', text: 'State two changes the student could make to increase the rate of this reaction.', correctAnswer: 'Use powdered marble chips (greater surface area) and use a more concentrated (or warmer) acid.', marks: 1 },
      { label: '(c)', text: 'Explain, in terms of particles, why increasing the temperature increases the rate of reaction.', correctAnswer: 'The particles have more kinetic energy, so they collide more frequently and a greater proportion of collisions have energy at least equal to the activation energy.', marks: 1 },
    ],
    '(a) CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂; (b) powder the marble chips and use more concentrated or warmer acid; (c) particles move faster and collide more often with enough energy to react.',
    '(a) Calcium carbonate neutralises hydrochloric acid to give calcium chloride, water and carbon dioxide; the 2 in front of HCl balances the chlorine and hydrogen atoms. (b) Crushing the chips raises the surface area exposed to the acid, and a more concentrated or warmer acid gives more frequent, more energetic collisions. (c) At higher temperature the particles move faster, so collisions are both more frequent and more often energetic enough to break bonds and react.',
    'Explain', 'AO2'),
];

// --- Batch assembly ---------------------------------------------------------
function buildQuestion(source, sequence, mcqPosition) {
  const id = `q_igcse_chem_s3_${String(sequence).padStart(3, '0')}`;
  const base = {
    id,
    original: true,
    topicCode: source.topicCode,
    type: source.type,
    prompt: source.prompt,
    difficulty: source.difficulty,
    commandWord: source.commandWord,
    assessmentObjective: source.assessmentObjective,
    provenance: [cambridgeSource],
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
          : 'This is a plausible misconception, but it does not follow from the chemistry in the worked solution.',
      })),
      correctAnswer: labels[correctIndex],
      workedSolution: `${source.solution} Therefore the correct answer is ${labels[correctIndex]}: ${source.correct}.`,
      marks: 1,
      points: 1,
      timeLimit: 90,
    };
  }
  if (source.type === 'structured') {
    return {
      ...base,
      contentLabel: itemContentLabel,
      parts: source.parts,
      correctAnswer: source.summary,
      workedSolution: source.solution,
      marks: source.parts.reduce((sum, part) => sum + part.marks, 0),
      points: 4,
      timeLimit: 300,
    };
  }
  return {
    ...base,
    correctAnswer: source.answer,
    workedSolution: source.solution,
    marks: 2,
    points: 4,
    timeLimit: 120,
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
    specificationCode: 'BRILLA-IGCSE-CHEM0620-S3-001',
    sources: [cambridgeSource],
    topics: topics.map(([code, , title, objective]) => ({ code, title, objective })),
    questions: builtQuestions,
  }],
};

// --- Validation -------------------------------------------------------------
const officialAttributionPattern = /\b(?:official\s+(?:cambridge|cambridge international|caie|waec|west african examinations council|nsmq)|(?:cambridge|cambridge international|caie|waec|west african examinations council|nsmq)[ -](?:approved|endorsed|authored|issued|certified))\b/i;
const nonOfficialDisclaimerPattern = /\b(?:not|non[- ]?)\s+official\s+(?:cambridge|cambridge international|caie|waec|west african examinations council|nsmq)\b/i;
const nonOfficialDisclaimerGlobalPattern = /\b(?:not|non[- ]?)\s+official\s+(?:cambridge|cambridge international|caie|waec|west african examinations council|nsmq)\b/gi;

function assertNoFalseOfficialClaim(value, field, errors) {
  const withoutDisclaimer = String(value ?? '').replace(nonOfficialDisclaimerGlobalPattern, '');
  if (officialAttributionPattern.test(withoutDisclaimer)) errors.push(`${field} contains a false official-exam-board claim`);
}

const validation = validateQuestionBatch(batch, { mode: 'production' });

// Cell targets mirrored from artifacts/sprint3/cells-igcse-chemistry.json (see
// the topic-table comment above for the distribution rationale).
const expectedCells = {
  'IGC-ATO': { easyMcq: 0, mediumMcq: 4, hardMcq: 0, calc: 0, structured: 1 },
  'IGC-PER': { easyMcq: 4, mediumMcq: 0, hardMcq: 0, calc: 1, structured: 0 },
  'IGC-BON': { easyMcq: 0, mediumMcq: 4, hardMcq: 0, calc: 0, structured: 1 },
  'IGC-STO': { easyMcq: 4, mediumMcq: 0, hardMcq: 1, calc: 0, structured: 0 },
  'IGC-REA': { easyMcq: 1, mediumMcq: 1, hardMcq: 2, calc: 0, structured: 1 },
  'IGC-ACI': { easyMcq: 0, mediumMcq: 4, hardMcq: 0, calc: 1, structured: 0 },
  'IGC-MET': { easyMcq: 0, mediumMcq: 4, hardMcq: 0, calc: 0, structured: 1 },
  'IGC-ORG': { easyMcq: 0, mediumMcq: 3, hardMcq: 2, calc: 0, structured: 0 },
  'IGC-ELE': { easyMcq: 4, mediumMcq: 0, hardMcq: 1, calc: 0, structured: 0 },
  'IGC-ANA': { easyMcq: 0, mediumMcq: 4, hardMcq: 0, calc: 0, structured: 1 },
};

function inHouseValidation(errors) {
  if (batch.review.automatedChecksAt !== generatedAt) errors.push('review.automatedChecksAt mismatch');
  if (batch.release.channel !== 'beta') errors.push('release.channel must be beta');
  if (typeof batch.release.contentLabel !== 'string' || batch.release.contentLabel.trim().length < 40) errors.push('release.contentLabel too short');
  if (!nonOfficialDisclaimerPattern.test(batch.release.contentLabel)) errors.push('release.contentLabel must explicitly state the content is not official exam-board material');
  if (batch.release.officialExamBoardContent !== false) errors.push('release.officialExamBoardContent must be false');
  if (batch.release.feedbackEnabled !== true) errors.push('release.feedbackEnabled must be true');
  assertNoFalseOfficialClaim(batch.release.contentLabel, 'release.contentLabel', errors);

  const letterCounts = { A: 0, B: 0, C: 0, D: 0 };
  const perTopic = new Map(topics.map(([code]) => [code, { easyMcq: 0, mediumMcq: 0, hardMcq: 0, calc: 0, structured: 0 }]));
  for (const subject of batch.subjects) {
    for (const question of subject.questions) {
      const cell = perTopic.get(question.topicCode);
      if (!cell) { errors.push(`${question.id}: unknown topicCode ${question.topicCode}`); continue; }
      if (question.type === 'multiple_choice') {
        if (question.difficulty === 'easy') cell.easyMcq += 1;
        else if (question.difficulty === 'medium') cell.mediumMcq += 1;
        else if (question.difficulty === 'hard') cell.hardMcq += 1;
        if (question.marks !== 1) errors.push(`${question.id}: MCQ marks must be 1`);
        if (question.points !== 1) errors.push(`${question.id}: MCQ points must be 1`);
        if (question.timeLimit !== 90) errors.push(`${question.id}: MCQ timeLimit must be 90`);
        letterCounts[question.correctAnswer] += 1;
        for (const option of question.options ?? []) assertNoFalseOfficialClaim(option.text, `${question.id}.options`, errors);
      } else if (question.type === 'calculation') {
        cell.calc += 1;
        if (question.marks !== 2 || question.points !== 4 || question.timeLimit !== 120) errors.push(`${question.id}: calculation scoring fields wrong`);
        if (question.options != null) errors.push(`${question.id}: calculation must not have options`);
        if (typeof question.correctAnswer !== 'string' || !question.correctAnswer.length) errors.push(`${question.id}: calculation needs an answer`);
        if (!/\d/.test(question.workedSolution)) errors.push(`${question.id}: calculation needs a worked numerical solution`);
      } else if (question.type === 'structured') {
        cell.structured += 1;
        if (question.marks !== 4 || question.points !== 4 || question.timeLimit !== 300) errors.push(`${question.id}: structured scoring fields wrong`);
        if (question.options != null) errors.push(`${question.id}: structured must not have options`);
        if (!Array.isArray(question.parts) || question.parts.length < 2) errors.push(`${question.id}: structured needs at least two parts`);
        if (question.parts.reduce((sum, part) => sum + part.marks, 0) !== question.marks) errors.push(`${question.id}: part marks must sum to marks`);
        if (!nonOfficialDisclaimerPattern.test(question.contentLabel ?? '')) errors.push(`${question.id}: per-item contentLabel must state the content is not official exam-board material`);
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
    if (actual.easyMcq !== expected.easyMcq || actual.mediumMcq !== expected.mediumMcq || actual.hardMcq !== expected.hardMcq || actual.calc !== expected.calc || actual.structured !== expected.structured) {
      errors.push(`${code}: expected ${JSON.stringify(expected)}, found ${JSON.stringify(actual)}`);
    }
  }
  // 43 MCQs with a rotating correct-answer slot: A, B and C get 11, D gets 10.
  const expectedLetters = { A: 11, B: 11, C: 11, D: 10 };
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

// --- SQL emission -----------------------------------------------------------
const sql = (value) => value == null ? 'NULL' : `'${String(value).replaceAll("'", "''")}'`;
const topicId = (code) => topics.find(([topicCode]) => topicCode === code)[1];
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
    subject_id: subjectId,
    exam_type_id: examTypeId,
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
    assessment_objective: question.assessmentObjective,
    source_paper_code: null,
    source_question_number: null,
    exam_board_id: examBoardId,
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

let migrationNumber = 593;
{
  // Canonical topic rows: on prod and on fresh baselines (prod patch 096 seeds
  // them for subj_igcse_chemistry) every id already exists, so these no-op.
  // They exist so a scratch baseline without the patch still has the bindings.
  // The slug is derived from the canonical id rather than copied from the
  // legacy row: legacy patch rows own the human slugs on fresh baselines and
  // topics is UNIQUE(subject_id, slug).
  const canonicalTopicRows = [
    ['topic_igcse_chem_atomic', 'Matter and Atomic Structure', 'Particles, atomic structure, isotopes and electron arrangement.', 'Atomic structure covers protons, neutrons and electrons, the meaning of proton and nucleon numbers, isotopes, and the electron arrangements of the first twenty elements.', '["neutrons = nucleon number − proton number", "Group number = outer-shell electrons", "Period number = occupied shells"]', 1],
    ['topic_igcse_chem_periodic', 'The Periodic Table', 'Groups, periods, trends and transition elements.', 'The Periodic Table arranges elements by proton number; group trends cover the alkali metals, the halogens and the noble gases, and position predicts electron arrangement and reactivity.', '["Reactivity of Group I increases down the group", "Reactivity of Group VII decreases down the group", "Ar = Σ(% abundance × mass number)/100"]', 2],
    ['topic_igcse_chem_bonding', 'Chemical Bonding', 'Ionic, covalent and metallic bonding, structure and properties.', 'Bonding explains how atoms achieve full outer shells by transferring or sharing electrons, and how giant ionic, simple molecular, giant covalent and metallic structures determine physical properties.', '["Ionic: metal + non-metal, electrons transferred", "Covalent: non-metal + non-metal, electrons shared", "Giant lattices have high melting points"]', 3],
    ['topic_igcse_chem_stoichiometry', 'Stoichiometry', 'The mole, reacting masses, concentrations and gas volumes.', 'Stoichiometry uses the mole to relate masses, concentrations and gas volumes through balanced equations: moles = mass ÷ Mr, and the coefficients of an equation give the reacting mole ratios.', '["n = m/Mr", "concentration = moles/volume (dm³)", "1 mole of gas = 24 dm³ at r.t.p."]', 4],
    ['topic_igcse_chem_reactions', 'Reactions, Rates and Energetics', 'Rate of reaction, reversible reactions and energy changes.', 'Collision theory explains how concentration, pressure, surface area, temperature and catalysts change the rate of reaction; energetics compares the energy taken in to break bonds with the energy released when new bonds form.', '["ΔH = energy in (bonds broken) − energy out (bonds formed)", "Rate ∝ frequency of successful collisions", "Catalyst lowers the activation energy"]', 5],
    ['topic_igcse_chem_acids', 'Acids, Bases and Salts', 'Properties, neutralisation and preparation of salts.', 'Acids release H⁺(aq) ions and bases neutralise them to form salts; the pH scale measures acidity, and pure soluble or insoluble salts are prepared by neutralisation, titration or precipitation.', '["acid + alkali → salt + water", "acid + metal → salt + hydrogen", "acid + carbonate → salt + water + carbon dioxide"]', 6],
    ['topic_igcse_chem_metals', 'Metals and Reactivity', 'Reactivity series, extraction, corrosion and alloys.', 'The reactivity series orders metals by their reactions with water, steam and acids; it predicts displacement reactions, the extraction method (electrolysis or carbon reduction) and resistance to corrosion.', '["K > Na > Ca > Mg > Al > Zn > Fe > Pb > Cu > Ag", "More reactive metal displaces less reactive from its salt", "Rusting requires oxygen and water"]', 7],
    ['topic_igcse_chem_organic', 'Organic Chemistry', 'Alkanes, alkenes, alcohols, acids and polymers.', 'Organic chemistry studies carbon compounds in homologous series: alkanes, alkenes, alcohols and carboxylic acids, their characteristic reactions, and the addition polymerisation of alkenes.', '["Alkanes CₙH₂ₙ₊₂; alkenes CₙH₂ₙ", "Alcohol + carboxylic acid → ester + water", "Cracking: long alkane → shorter alkane + alkene"]', 8],
    ['topic_igcse_chem_electrolysis', 'Electrolysis', 'Products of electrolysis of molten and aqueous ionic compounds.', 'Electrolysis decomposes an ionic compound, molten or in aqueous solution, using a direct current: cations move to the cathode (reduction) and anions to the anode (oxidation); in aqueous solution the reactivity series and concentration decide which ions discharge.', '["Cathode: negative electrode, reduction", "Anode: positive electrode, oxidation", "Concentrated aqueous NaCl → H₂ + Cl₂"]', 9],
    ['topic_igcse_chem_analysis', 'Experimental Techniques and Chemical Analysis', 'Tests for gases, cations and anions, and chromatography.', 'Chemical analysis identifies substances with flame tests for cations, precipitation tests for anions, chemical tests for gases, and paper chromatography with Rf values for coloured mixtures.', '["Rf = distance by substance ÷ distance by solvent", "Cl⁻: white precipitate with AgNO₃ after dilute HNO₃", "Na⁺ yellow, K⁺ lilac, Ca²⁺ brick-red flames"]', 10],
  ];
  const allTopicIds = canonicalTopicRows.map(([id]) => id);
  const name = `${migrationNumber}_igcse_chemistry_sprint3_foundation.sql`;
  const lines = [
    `-- ${migrationNumber}: Foundation guard for Cambridge IGCSE Chemistry (0620) sprint 3 beta batch (igcse-chemistry-sprint3-001).`,
    '-- Original BrillaPrep practice content; not official Cambridge International, WAEC or NSMQ examination material.',
    '-- Re-asserts the prod-canonical topic rows for subj_igcse_chemistry on scratch',
    '-- baselines; INSERT OR IGNORE no-ops on prod and on fresh baselines where the',
    '-- rows already exist (prod patch 096).',
    'PRAGMA foreign_keys = ON;',
    `INSERT OR IGNORE INTO exam_boards (id, name, code, full_name, region, website_url, is_active, display_order) VALUES ('board_cambridge', 'Cambridge International', 'CAIE', 'Cambridge International Education', 'International', 'https://www.cambridgeinternational.org/', 1, 2);`,
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
      `INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES (${sql(id)}, 'subj_igcse_chemistry', NULL, ${sql(topicName)}, ${sql(id.slice(6).replaceAll('_', '-'))}, ${sql(description)}, ${sql(theoryContent)}, ${sql(keyFormulas)}, ${displayOrder}, '2026-08-13T00:00:00.000Z');`),
    `CREATE TABLE IF NOT EXISTS _migration_${migrationNumber}_guard (valid INTEGER NOT NULL CHECK (valid = 1));`,
    `DELETE FROM _migration_${migrationNumber}_guard;`,
    `INSERT INTO _migration_${migrationNumber}_guard(valid) SELECT CASE WHEN EXISTS (SELECT 1 FROM exam_types WHERE id = 'igcse') AND EXISTS (SELECT 1 FROM exam_boards WHERE id = 'board_cambridge') AND EXISTS (SELECT 1 FROM subjects WHERE id = 'subj_igcse_chemistry' AND exam_type_id = 'igcse') AND (SELECT COUNT(*) FROM topics t JOIN subjects s ON s.id = t.subject_id WHERE t.id IN (${allTopicIds.map(sql).join(', ')}) AND t.subject_id = 'subj_igcse_chemistry' AND s.exam_type_id = 'igcse') = ${allTopicIds.length} THEN 1 ELSE 0 END;`,
    `DROP TABLE _migration_${migrationNumber}_guard;`,
  ];
  await emitMigration(name, lines);
  migrationNumber += 1;
}

const allQuestions = batch.subjects[0].questions;
const questionsPerPart = 4;
const partCount = Math.ceil(allQuestions.length / questionsPerPart);
for (let part = 1; part <= partCount; part += 1) {
  const partQuestions = allQuestions.slice((part - 1) * questionsPerPart, part * questionsPerPart);
  const ids = partQuestions.map((question) => question.id);
  const guardTable = `_migration_${migrationNumber}_guard`;
  const name = `${migrationNumber}_igcse_chemistry_sprint3_part_${part}.sql`;
  const lines = [
    `-- ${migrationNumber}: Original BrillaPrep Cambridge IGCSE Chemistry (0620) sprint 3 beta questions, part ${part} of ${partCount} (batch igcse-chemistry-sprint3-001).`,
    '-- Curriculum-aligned practice content; not official Cambridge International, WAEC or NSMQ examination material.',
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
  const allIds = allQuestions.map((question) => question.id);
  const mcqIds = allQuestions.filter((question) => question.type === 'multiple_choice').map((question) => question.id);
  const calcIds = allQuestions.filter((question) => question.type === 'calculation').map((question) => question.id);
  const structuredIds = allQuestions.filter((question) => question.type === 'structured').map((question) => question.id);
  const name = `${migrationNumber}_igcse_chemistry_sprint3_final_guard.sql`;
  const guardTable = `_migration_${migrationNumber}_guard`;
  const lines = [
    `-- ${migrationNumber}: Final exact-set and relationship guard for Cambridge IGCSE Chemistry (0620) sprint 3 beta batch (igcse-chemistry-sprint3-001).`,
    'PRAGMA foreign_keys = ON;',
    `CREATE TABLE IF NOT EXISTS ${guardTable} (valid INTEGER NOT NULL CHECK (valid = 1));`,
    `DELETE FROM ${guardTable};`,
    `INSERT INTO ${guardTable}(valid) SELECT CASE WHEN (SELECT COUNT(*) FROM questions q JOIN topics t ON t.id = q.topic_id JOIN question_content_releases r ON r.question_id = q.id WHERE q.id IN (${allIds.map(sql).join(', ')}) AND q.subject_id = t.subject_id AND q.subject_id = 'subj_igcse_chemistry' AND q.exam_type_id = 'igcse' AND q.exam_board_id = 'board_cambridge' AND q.round_type IS NULL AND length(q.explanation) >= 80 AND r.batch_id = '${batchId}' AND r.quality_assurance = 'automated_beta' AND r.release_channel = 'beta' AND r.official_exam_board_content = 0 AND r.feedback_enabled = 1) = 50 AND (SELECT COUNT(*) FROM questions q WHERE q.id IN (${mcqIds.map(sql).join(', ')}) AND q.question_type = 'multiple_choice' AND json_valid(q.options) AND json_array_length(q.options) = 4 AND q.correct_answer IN ('A', 'B', 'C', 'D') AND q.points = 1 AND q.marks = 1 AND q.time_limit = 90) = ${mcqIds.length} AND (SELECT COUNT(*) FROM questions q WHERE q.id IN (${calcIds.map(sql).join(', ')}) AND q.question_type = 'calculation' AND q.options IS NULL AND length(q.correct_answer) >= 1 AND q.points = 4 AND q.marks = 2 AND q.time_limit = 120) = ${calcIds.length} AND (SELECT COUNT(*) FROM questions q WHERE q.id IN (${structuredIds.map(sql).join(', ')}) AND q.question_type = 'structured' AND q.options IS NULL AND length(q.correct_answer) >= 1 AND q.points = 4 AND q.marks = 4 AND q.time_limit = 300) = ${structuredIds.length} AND (SELECT COUNT(*) FROM question_content_releases WHERE batch_id = '${batchId}') = 50 AND (SELECT COUNT(*) FROM questions WHERE id IN (${allIds.map(sql).join(', ')}) AND difficulty = 'easy') = 13 AND (SELECT COUNT(*) FROM questions WHERE id IN (${allIds.map(sql).join(', ')}) AND difficulty = 'medium') = 31 AND (SELECT COUNT(*) FROM questions WHERE id IN (${allIds.map(sql).join(', ')}) AND difficulty = 'hard') = 6 THEN 1 ELSE 0 END;`,
    `DROP TABLE ${guardTable};`,
  ];
  await emitMigration(name, lines);
  migrationNumber += 1;
}

console.log(JSON.stringify({ validation, outBatch, migrations: migrationPaths }, null, 2));
