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
const batchId = 'bece-int-science-sprint3-001';
const subjectId = 'subj_bece_science';
const examTypeId = 'exam_bece';
const examBoardId = 'board_waec';
const contentLabel = 'Original BrillaPrep curriculum-aligned BECE Integrated Science practice questions; not official WAEC (West African Examinations Council) examination material. Use the enabled feedback channel to report corrections.';
const theoryContentLabel = 'Original BrillaPrep curriculum-aligned BECE Integrated Science practice content; not official WAEC examination material.';
const releaseSourceUrl = 'https://nacca.gov.gh/common-core-programme-ccp/';

const curriculumSource = {
  publisher: 'National Council for Curriculum and Assessment, Ghana',
  title: 'Common Core Programme curricula for Junior High School',
  url: releaseSourceUrl,
  use: 'curriculum_blueprint_only',
};

// Topic ids are the prod-canonical rows for subj_bece_science (verified
// read-only against brilla-db on 2026-09-09; created by prod patches 094/095/096
// and present on every fresh baseline). Migration 618 re-asserts every row with
// INSERT OR IGNORE so a scratch baseline without the patches still has the
// bindings; it no-ops on prod and never renames an existing row.
const topics = [
  { key: 'cells', topicId: 'topic_bece_science_cells', code: 'BECE-CELLS', title: 'Cells and Living Organisms',
    objective: 'Describe cell structure, classification of living things and the movement of substances in and out of cells.' },
  { key: 'body', topicId: 'topic_bece_science_body', code: 'BECE-BODY', title: 'Human Body Systems',
    objective: 'Explain how the digestive, circulatory, respiratory and skeletal systems keep the body working.' },
  { key: 'matter', topicId: 'topic_bece_science_matter', code: 'BECE-MATTER', title: 'Matter and Its States',
    objective: 'Apply the particle theory of matter and separate mixtures using suitable physical methods.' },
  { key: 'energy', topicId: 'topic_bece_science_energy', code: 'BECE-ENERGY', title: 'Energy and Its Forms',
    objective: 'Identify energy forms and transformations and apply the principle of conservation of energy.' },
  { key: 'electricity', topicId: 'topic_bece_science_electricity', code: 'BECE-ELEC', title: 'Electricity and Magnetism',
    objective: 'Connect simple series and parallel circuits, use electrical safety rules and describe magnets and electromagnets.' },
  { key: 'machines', topicId: 'topic_bece_science_machines', code: 'BECE-MACH', title: 'Force, Work and Machines',
    objective: 'Describe forces and friction, calculate work done and explain how levers and inclined planes make work easier.' },
  { key: 'agric', topicId: 'topic_bece_science_agric', code: 'BECE-AGRIC', title: 'Agriculture and Food Production',
    objective: 'Apply good practice in crop production, food processing and farm record keeping.' },
  { key: 'health', topicId: 'topic_bece_science_health', code: 'BECE-HEALTH', title: 'Health, Sanitation and Environment',
    objective: 'Explain how communicable diseases spread and how clean water, sanitation and immunisation protect health.' },
  { key: 'methods', topicId: 'topic_bece_science_methods', code: 'BECE-METHODS', title: 'Scientific Inquiry and Technology',
    objective: 'Use the scientific method, read laboratory instruments accurately and apply technology safely.' },
  { key: 'earth_space', topicId: 'topic_bece_science_earth_space', code: 'BECE-EARTH', title: 'Earth and Space Science',
    objective: 'Describe rocks, the water cycle, weather measurement and the Earth-Moon-Sun system.' },
];
const prodVerifiedTopicIds = new Set(topics.map((topic) => topic.topicId));

const mcq = (topicCode, difficulty, prompt, correct, wrong, solution, commandWord, assessmentObjective) => ({ topicCode, type: 'multiple_choice', difficulty, prompt, correct, wrong, solution, commandWord, assessmentObjective });
const calc = (topicCode, difficulty, prompt, answer, solution, assessmentObjective = 'AO2') => ({ topicCode, type: 'calculation', difficulty, prompt, answer, solution, commandWord: 'Calculate', assessmentObjective });
const sa = (topicCode, difficulty, prompt, answer, solution, commandWord = 'State', assessmentObjective = 'AO1') => ({ topicCode, type: 'short_answer', difficulty, prompt, answer, solution, commandWord, assessmentObjective });
const st = (topicCode, difficulty, prompt, parts, commandWord = 'Explain') => ({ topicCode, type: 'structured', difficulty, prompt, parts, commandWord, assessmentObjective: 'AO2' });
const part = (label, text, marks, correctAnswer) => ({ label, text, marks, correctAnswer });

const questions = [
  // --- Cells and Living Organisms (topic_bece_science_cells): 2 hard MCQ, 1 SA, 1 calculation, 1 structured
  mcq('BECE-CELLS', 'hard', 'A red blood cell bursts when placed in pure water, but a plant cell kept in pure water does not. Which structure explains the difference?',
    'The cellulose cell wall, which resists the extra water pressure',
    ['The nucleus, which pumps water out of the plant cell', 'The chloroplasts, which absorb the extra water', 'The cell membrane, which is thicker in plant cells'],
    'Water enters both cells by osmosis. The plant cell has a tough cellulose cell wall outside its membrane; as water enters, the wall resists the pressure, so the cell becomes firm (turgid) but does not burst. The red blood cell has no wall, so it swells and bursts. (The nucleus controls cell activities but cannot pump out water; chloroplasts make food and do not absorb the inflow; plant and animal cell membranes are similarly thin.)',
    'Explain', 'AO3'),
  mcq('BECE-CELLS', 'hard', 'Pieces of peeled cassava are placed in a concentrated salt solution. After one hour the pieces have become soft and have shrunk slightly. Which statement explains this?',
    'Water moved by osmosis from the cassava cells into the stronger salt solution',
    ['Water moved by osmosis from the salt solution into the cassava cells', 'Salt moved into the cells and dissolved their contents', 'The cassava absorbed salt, which made the cells firm'],
    'Osmosis moves water across a partially permeable membrane from the weaker (more dilute) solution to the stronger (more concentrated) one. The concentrated salt solution draws water out of the cassava cells, so they lose turgor and the pieces go soft. (Water moving in would make the pieces firm, not soft; salt does not dissolve the cell contents.)',
    'Explain', 'AO3'),
  sa('BECE-CELLS', 'medium', 'State two structural differences between a typical plant cell and a typical animal cell.',
    'A plant cell has a cellulose cell wall and chloroplasts (and usually a large central vacuole); an animal cell has none of these structures.',
    'A typical plant cell is surrounded by a cellulose cell wall, contains chloroplasts for photosynthesis and usually has one large central vacuole. An animal cell has only a cell membrane, no chloroplasts and only small temporary vacuoles. Any two of these differences earn the marks. Answer: plant cells have a cell wall and chloroplasts (and a large central vacuole); animal cells do not.',
    'State', 'AO1'),
  calc('BECE-CELLS', 'medium', 'A diagram of a cell measures 45 mm across. The real cell is 0.15 mm across. Calculate the magnification of the diagram.',
    '×300',
    'Magnification = size of image ÷ real size of object = 45 mm ÷ 0.15 mm = 300. The diagram is 300 times larger than the real cell. Answer: ×300.'),
  st('BECE-CELLS', 'medium', 'Ama is studying how substances move into and out of cells.', [
    part('a', 'Define the term diffusion.', 1,
      'Diffusion is the movement of particles from a region of higher concentration to a region of lower concentration until they are evenly spread (1).'),
    part('b', 'State two factors that affect the rate of diffusion.', 2,
      'Any two of: temperature — a higher temperature gives faster diffusion (1); the concentration difference (gradient) between the two regions (1); the distance over which diffusion must occur; the size of the particles (1).'),
    part('c', 'Explain why a tiny organism such as Amoeba does not need a special transport system, but a human being does.', 2,
      'Amoeba is microscopic, so oxygen and nutrients reach every part of its single cell by diffusion over a very short distance (1). A human is large and made of many cells, so diffusion alone would be far too slow; a blood circulatory system is needed to carry materials quickly to all cells (1).'),
  ], 'Explain'),

  // --- Human Body Systems (topic_bece_science_body): 2 hard MCQ, 1 SA, 1 calculation, 1 structured
  mcq('BECE-BODY', 'hard', 'Why does the wall of the left ventricle of the heart have thicker muscle than the wall of the right ventricle?',
    'It must pump blood at higher pressure round the whole body',
    ['It receives blood from both lungs at once', 'It pumps blood a shorter distance to the lungs', 'It contains more valves that need support'],
    'The left ventricle pumps oxygenated blood through the aorta to the entire body, a long distance that needs high pressure, so its muscular wall is the thickest. The right ventricle pumps blood only to the nearby lungs at lower pressure. (Pumping to the lungs is the right side’s job; valves are thin flaps that prevent backflow and do not need thick muscle to support them.)',
    'Explain', 'AO3'),
  mcq('BECE-BODY', 'hard', 'During a game of football, Kofi’s breathing becomes faster and deeper. What is the main reason for this change?',
    'His muscles need more oxygen and produce more carbon dioxide that must be removed',
    ['His lungs are resting, so they work more slowly', 'His body temperature falls and the lungs keep him warm', 'His heart stops, so the lungs take over its work'],
    'Exercise raises the rate of respiration in the muscle cells, using up more oxygen and releasing more carbon dioxide. Faster, deeper breathing supplies the extra oxygen and expels the extra carbon dioxide. (The lungs do not rest during exercise; breathing is not controlled by body temperature falling, and the heart beats faster rather than stopping.)',
    'Explain', 'AO3'),
  sa('BECE-BODY', 'medium', 'State two functions of the human skeleton other than giving the body its shape.',
    'Any two of: it protects delicate organs such as the brain, heart and lungs; it allows movement by providing attachment for muscles; it makes blood cells in the bone marrow; it stores minerals such as calcium.',
    'Besides supporting and shaping the body, the skeleton protects delicate organs (the skull guards the brain and the ribs guard the heart and lungs), provides firm attachment points for muscles so that movement is possible, manufactures red and white blood cells in the bone marrow, and stores minerals such as calcium and phosphorus. Any two of these functions earn the marks.',
    'State', 'AO1'),
  calc('BECE-BODY', 'easy', 'After exercising, Esi counts her pulse 21 times in 15 seconds. Calculate her heart rate in beats per minute.',
    '84 beats per minute',
    'There are 4 × 15 = 60 seconds in one minute, so multiply the 15-second count by 4: 21 × 4 = 84. Answer: her heart rate is 84 beats per minute.'),
  st('BECE-BODY', 'medium', 'Yaw is learning about how the human digestive system deals with a meal of kenkey and fish.', [
    part('a', 'Define digestion.', 1,
      'Digestion is the breakdown of large, insoluble food molecules into small, soluble molecules that can be absorbed into the blood (1).'),
    part('b', 'State the part of the digestive system where (i) digestion of starch begins and (ii) most absorption of digested food takes place.', 2,
      '(i) The mouth, where the enzyme amylase in saliva starts to break down starch (1). (ii) The small intestine (ileum) (1).'),
    part('c', 'Explain how the small intestine is adapted for absorbing digested food.', 2,
      'Its inner surface is folded into many tiny finger-like villi, which give a very large surface area for absorption (1); each villus has thin walls and a rich blood supply, so digested food passes quickly into the blood (1).'),
  ], 'Explain'),

  // --- Matter and Its States (topic_bece_science_matter): 2 hard MCQ, 1 SA, 1 calculation, 1 structured
  mcq('BECE-MATTER', 'hard', 'When 50 cm³ of water is mixed with 50 cm³ of ethanol, the final volume is slightly less than 100 cm³. What does this show about matter?',
    'Particles of matter have spaces between them, so smaller particles fill gaps between larger ones',
    ['Some of the liquid always evaporates during mixing', 'The two liquids react to form a solid', 'Matter is destroyed when liquids are mixed'],
    'The particle theory says matter is made of tiny particles with spaces between them. When water and ethanol mix, some of the smaller particles occupy spaces between the larger ones, so the total volume shrinks slightly. (No measurable evaporation or chemical reaction takes place during the mixing, and matter cannot be destroyed by simply mixing liquids.)',
    'Explain', 'AO3'),
  mcq('BECE-MATTER', 'hard', 'A mixture contains iron filings, sand and common salt. A learner wants a sample of pure salt. Which sequence of separation methods is correct?',
    'Use a magnet, dissolve the rest in water and filter, then evaporate the filtrate',
    ['Evaporate first, then filter, then use a magnet', 'Filter the dry mixture, then dissolve and evaporate', 'Dissolve everything, filter, then use a magnet on the solution'],
    'A magnet first pulls out the magnetic iron filings. Adding water then dissolves only the salt; filtering removes the insoluble sand as the residue. Evaporating (or crystallising) the filtrate finally recovers the dissolved salt. (A dry mixture of solids cannot be filtered, and the magnet must be used before dissolving or the filings end up in the filter paper.)',
    'Sequence', 'AO3'),
  sa('BECE-MATTER', 'medium', 'State two differences between a mixture and a compound.',
    'In a mixture the substances keep their own properties and can be separated by physical methods; in a compound the elements are chemically combined in a fixed ratio and can be separated only by chemical means.',
    'A mixture contains two or more substances that are not chemically joined: each keeps its own properties, the amounts can vary, and the substances can be separated by physical methods such as filtering or evaporation. A compound forms when elements chemically combine in a fixed ratio; it has completely new properties and can be split up only by chemical means. Any two of these differences earn the marks.',
    'State', 'AO1'),
  calc('BECE-MATTER', 'medium', 'A stone has a mass of 54 g. When it is fully immersed, it raises the level of water in a measuring cylinder from 50 cm³ to 70 cm³. Calculate the density of the stone.',
    '2.7 g/cm³',
    'Volume of the stone = 70 cm³ − 50 cm³ = 20 cm³. Density = mass ÷ volume = 54 g ÷ 20 cm³ = 2.7 g/cm³. Answer: the density of the stone is 2.7 g/cm³.'),
  st('BECE-MATTER', 'medium', 'A teacher gives a class a mixture of salt and sand and asks them to obtain pure dry salt from it.', [
    part('a', 'Explain why the mixture is first stirred with warm water.', 1,
      'Warm water dissolves the salt quickly, but sand does not dissolve in water at all (1).'),
    part('b', 'Describe how the sand is then separated from the salt solution.', 2,
      'The mixture is poured through filter paper held in a funnel — this is filtration (1); the insoluble sand stays on the paper as the residue while the salt solution passes through as the filtrate (1).'),
    part('c', 'Describe how pure dry salt is obtained from the filtrate.', 2,
      'The filtrate is heated so that the water evaporates (1); the salt is left behind as solid crystals, which are then dried (1).'),
  ], 'Describe'),

  // --- Energy and Its Forms (topic_bece_science_energy): 2 hard MCQ, 1 SA, 1 calculation, 1 structured
  mcq('BECE-ENERGY', 'hard', 'Which sequence correctly shows the energy transformations in a hydroelectric power station such as Akosombo?',
    'Potential energy of stored water → kinetic energy of moving water → kinetic energy of turbines → electrical energy',
    ['Electrical energy → kinetic energy → potential energy', 'Chemical energy of coal → heat energy → electrical energy', 'Light energy → sound energy → electrical energy'],
    'Water held behind the dam has gravitational potential energy; as it falls through the penstock it gains kinetic energy, which spins the turbines, and the generators convert that movement into electrical energy. (A hydroelectric station burns no coal, and the chain cannot begin with electrical energy, which is the output, not the input.)',
    'Sequence', 'AO3'),
  mcq('BECE-ENERGY', 'hard', 'No machine is 100% efficient. What happens to the input energy that is not converted into useful work?',
    'It is changed into other forms, such as heat and sound, that are not useful',
    ['It is destroyed by the machine', 'It is stored inside the machine forever', 'It changes back into the original fuel'],
    'By the law of conservation of energy, energy cannot be created or destroyed. Friction between moving parts converts some of the input energy into heat and sound, which do no useful work, so the useful output is always less than the input. (Energy is never destroyed, and the wasted heat does not turn back into fuel.)',
    'Explain', 'AO3'),
  sa('BECE-ENERGY', 'medium', 'State the law of conservation of energy, and name the energy transformation that takes place when a torch is switched on.',
    'Energy cannot be created or destroyed; it can only be changed from one form to another. In a torch, chemical energy in the battery changes into electrical energy and then into light (and a little heat).',
    'The law of conservation of energy states that energy cannot be created or destroyed but can only be transformed from one form to another. When a torch is switched on, the chemical energy stored in the battery becomes electrical energy in the circuit, and the bulb converts this into light energy with a small amount of heat.',
    'State', 'AO1'),
  calc('BECE-ENERGY', 'medium', 'A 2 kg bag of rice is lifted from the floor onto a shelf 3 m high. Taking g = 10 m/s², calculate the potential energy gained by the bag.',
    '60 J',
    'Potential energy gained = m × g × h = 2 kg × 10 m/s² × 3 m = 60 J. Answer: the bag gains 60 J of potential energy.'),
  st('BECE-ENERGY', 'medium', 'Ghana needs more sources of electricity for homes and schools.', [
    part('a', 'Explain what is meant by a renewable energy source.', 1,
      'A renewable energy source is one that is naturally replaced and will not run out, such as sunlight, wind or flowing water (1).'),
    part('b', 'Name two renewable energy sources that can be used in Ghana.', 2,
      'Any two of: solar energy (sunlight), wind energy, hydroelectric power (flowing water), biomass (1 each).'),
    part('c', 'State one advantage and one disadvantage of using solar energy.', 2,
      'Advantage: sunlight is free and clean and produces no smoke or greenhouse gases (1). Disadvantage: it works only when the sun shines, so batteries or another source are needed at night or on cloudy days (1).'),
  ], 'Explain'),

  // --- Electricity and Magnetism (topic_bece_science_electricity): 2 medium MCQ (of 4 needed), 2 hard MCQ, 1 SA, 1 calculation, 1 structured
  mcq('BECE-ELEC', 'medium', 'Two lamps are connected in series in a circuit. One lamp blows (its filament breaks). What happens to the other lamp?',
    'It goes out because the circuit is now incomplete',
    ['It becomes brighter because it gets all the current', 'It keeps shining normally', 'It becomes dimmer but stays on'],
    'In a series circuit there is only one path for the current. A broken filament breaks that single path, so no current flows and the second lamp goes out. (In a parallel circuit the second lamp would stay on; a lamp cannot become brighter when the current has stopped completely.)',
    'Predict', 'AO2'),
  mcq('BECE-ELEC', 'medium', 'Which instrument is used to measure the current flowing through a lamp, and how is it connected?',
    'An ammeter, connected in series with the lamp',
    ['A voltmeter, connected in series with the lamp', 'An ammeter, connected in parallel with the lamp', 'A voltmeter, connected across the battery only'],
    'Current is measured with an ammeter, and because the same current must pass through it, the ammeter is connected in series with the lamp. A voltmeter measures potential difference and is connected in parallel across a component. (An ammeter connected in parallel would create a short circuit across the lamp.)',
    'Identify', 'AO2'),
  mcq('BECE-ELEC', 'hard', 'Why are the lamps and sockets in a house wired in parallel rather than in series?',
    'Each appliance then receives the full mains voltage and can be switched on or off independently',
    ['Parallel wiring always uses thinner cables and less copper', 'In series the lamps would burn out immediately', 'Parallel circuits prevent any current from flowing when one lamp fails'],
    'In parallel, each branch is connected directly across the supply, so every appliance receives the full mains voltage, and a fault or switch in one branch does not affect the others. In series the voltage would be shared between the appliances and one fault would switch everything off. (Cable thickness depends on current rating, not on the circuit layout.)',
    'Explain', 'AO3'),
  mcq('BECE-ELEC', 'hard', 'An electromagnet made from a coil of wire around an iron nail picks up only a few paper clips. Which change will make it stronger?',
    'Increase the number of turns of wire on the coil',
    ['Use a wooden core instead of the iron nail', 'Reduce the current flowing through the coil', 'Spread the turns of the coil farther apart'],
    'The strength of an electromagnet increases with more turns of wire, a larger current and a soft-iron core. Adding turns concentrates the magnetic field around the core. (Wood is not magnetic, reducing the current weakens the field, and spreading the turns out weakens it as well.)',
    'Apply', 'AO3'),
  sa('BECE-ELEC', 'medium', 'Explain the difference between an electrical conductor and an insulator, giving one example of each.',
    'A conductor allows electric current to pass through it easily, for example copper wire; an insulator does not allow current to pass through it, for example rubber or plastic.',
    'An electrical conductor is a material that lets charge flow through it easily because it has many free electrons — metals such as copper and aluminium are good conductors, which is why cables have a copper core. An insulator does not allow current to pass through it — rubber, plastic and dry wood are examples, which is why cables are covered with plastic.',
    'Explain', 'AO2'),
  calc('BECE-ELEC', 'medium', 'A resistor of 4 Ω is connected to a battery and a current of 0.5 A flows through it. Calculate the voltage across the resistor.',
    '2 V',
    'Using Ohm’s law, V = I × R = 0.5 A × 4 Ω = 2 V. Answer: the voltage across the resistor is 2 V.'),
  st('BECE-ELEC', 'medium', 'Kofi wants to connect a simple circuit to light a bulb for his study table.', [
    part('a', 'State the function of each of the following in the circuit: (i) the battery, (ii) the switch.', 2,
      '(i) The battery provides the electrical energy (voltage) that pushes current round the circuit (1). (ii) The switch opens or closes the circuit to turn the current off or on (1).'),
    part('b', 'Name the material used to join the components, and state the property that makes it suitable.', 1,
      'Copper wire; copper is a very good conductor of electricity (1).'),
    part('c', 'Explain why a fuse is included in the plug of the table lamp.', 2,
      'If a fault makes the current too large, the thin fuse wire melts and breaks the circuit (1); this protects the lamp and prevents the cable from overheating and causing a fire (1).'),
  ], 'Explain'),

  // --- Force, Work and Machines (topic_bece_science_machines): 2 hard MCQ, 1 SA, 1 calculation, 1 structured
  mcq('BECE-MACH', 'hard', 'A wheelbarrow carries a load of sand placed between the wheel (the pivot) and the gardener’s hands (the effort). Which class of lever is the wheelbarrow?',
    'Second-class lever, because the load is between the pivot and the effort',
    ['First-class lever, because the pivot is between the load and the effort', 'Third-class lever, because the effort is between the pivot and the load', 'It is not a lever at all but a pulley'],
    'In a second-class lever the load lies between the fulcrum and the effort, which gives a large mechanical advantage — a small effort lifts a heavy load. The wheel is the fulcrum, the sand is the load and the hands supply the effort. (First class has the pivot in the middle, like a see-saw; third class has the effort in the middle, like tongs or a fishing rod.)',
    'Classify', 'AO3'),
  mcq('BECE-MACH', 'hard', 'Porters push a heavy drum up a long plank onto a lorry instead of lifting it vertically. Which statement correctly explains why the plank (an inclined plane) helps?',
    'A smaller effort is needed because the load moves over a longer distance',
    ['The plank reduces the weight of the drum', 'The total work done against gravity is reduced', 'The plank removes friction completely'],
    'An inclined plane lets the porters use a smaller force spread over a longer distance. The work done against gravity (weight × vertical height) is the same either way; only the effort needed at each moment is smaller. (The drum’s weight is unchanged, and a rough plank can even add friction — it is never removed completely.)',
    'Explain', 'AO3'),
  sa('BECE-MACH', 'medium', 'State two ways of reducing friction between the moving parts of a machine.',
    'Any two of: lubricating the parts with oil or grease; using ball bearings or rollers; polishing or smoothing the rubbing surfaces; separating the surfaces with a cushion of air.',
    'Friction between moving parts wastes energy and wears the parts out. It can be reduced by lubricating with oil or grease, which keeps the surfaces slightly apart; by fitting ball bearings or rollers so the parts roll instead of slide; by polishing the surfaces to make them smoother; or by separating them with a cushion of air. Any two of these methods earn the marks.',
    'State', 'AO1'),
  calc('BECE-MACH', 'medium', 'A pupil pushes a box along the floor with a steady force of 50 N and moves it 4 m in the direction of the force. Calculate the work done on the box.',
    '200 J',
    'Work done = force × distance moved in the direction of the force = 50 N × 4 m = 200 J. Answer: the work done on the box is 200 J.'),
  st('BECE-MACH', 'medium', 'Abena uses a long spanner to loosen a tight nut on her bicycle.', [
    part('a', 'Name the three main parts of any lever.', 1,
      'The pivot (fulcrum), the effort and the load (all three needed for the mark).'),
    part('b', 'Give one example each of a first-class and a third-class lever used at home.', 2,
      'First class: a pair of scissors, pliers or a see-saw — the pivot is between the load and the effort (1). Third class: tongs, a fishing rod or a broom — the effort is between the pivot and the load (1).'),
    part('c', 'Explain why the long spanner loosens the nut more easily than a short one.', 2,
      'The turning effect (moment) of a force equals the force × the perpendicular distance from the pivot (1); a longer spanner gives a greater distance, so the same effort produces a larger turning effect on the nut (1).'),
  ], 'Explain'),

  // --- Agriculture and Food Production (topic_bece_science_agric): 1 SA, 1 calculation, 1 structured
  sa('BECE-AGRIC', 'medium', 'State two benefits a farmer gets by processing fresh cassava into gari before storage.',
    'Any two of: drying and roasting remove moisture, so the gari keeps much longer without rotting; gari is lighter and easier to transport; processing adds value, so it sells at a higher price; proper processing reduces harmful compounds in fresh cassava.',
    'Fresh cassava roots contain a lot of water and start to rot within a few days. Processing them into gari removes most of the moisture through pressing, fermentation and roasting, so the product stores for months; the dried gari is lighter and cheaper to transport to market; processing adds value and raises the selling price; and proper roasting reduces the harmful cyanide compounds in fresh cassava. Any two of these benefits earn the marks.',
    'State', 'AO2'),
  calc('BECE-AGRIC', 'easy', 'A farmer sows 200 maize seeds and 170 of them germinate. Calculate the germination percentage.',
    '85%',
    'Germination percentage = (number of seeds germinated ÷ number of seeds sown) × 100 = (170 ÷ 200) × 100 = 0.85 × 100 = 85%. Answer: the germination percentage is 85%.'),
  st('BECE-AGRIC', 'medium', 'A JHS class wants to start a small vegetable garden behind the school block.', [
    part('a', 'State two factors the class should consider when choosing the site for the garden.', 2,
      'Any two of: fertile, well-drained soil; a reliable source of water for irrigation; enough sunlight; closeness to the school so the crops are easy to tend and safe from thieves and animals (1 each).'),
    part('b', 'Give one reason why the land is cleared and dug before planting.', 1,
      'Clearing removes weeds that would compete with the vegetables for nutrients, water and light, and digging loosens the soil so that roots, air and water can enter easily (1).'),
    part('c', 'State two reasons for keeping records of the garden activities.', 2,
      'Records of costs and sales show whether the garden is making a profit or a loss (1); records of what was planted and how each crop performed help the class plan better for the next season (1).'),
  ], 'State'),

  // --- Health, Sanitation and Environment (topic_bece_science_health): 2 hard MCQ, 1 SA, 1 calculation, 1 structured
  mcq('BECE-HEALTH', 'hard', 'Health workers advise that pit latrines and refuse dumps should be sited far away from wells and streams. Why is this important?',
    'Germs from the waste can seep into or be washed into the water and cause diseases such as cholera',
    ['Waste near water attracts snakes that bite people', 'The smell of the waste makes the water too salty to drink', 'Pit latrines dug near wells always collapse into the water'],
    'Faeces and refuse contain disease-causing micro-organisms. Rain can wash these germs into streams, and they can seep through the soil into wells; people who drink the contaminated water may suffer from cholera, typhoid or dysentery. (Snakes and smell are not the main health reason for the rule, and the advice concerns contamination, not collapsing pits.)',
    'Explain', 'AO3'),
  mcq('BECE-HEALTH', 'hard', 'Covering water storage containers and draining standing water around the home helps to control malaria mainly because it...',
    'removes the places where mosquitoes lay their eggs and breed',
    ['kills the malaria parasites already inside the mosquitoes', 'stops mosquitoes from flying at night', 'makes the stored water too cold for drinking'],
    'Mosquitoes lay their eggs in stagnant water, where the larvae develop into adults. Removing or covering such water breaks the mosquito life cycle, so fewer adult mosquitoes survive to bite people and spread the malaria parasite. (It does not kill parasites already inside mosquitoes, and adult mosquitoes can still fly at night.)',
    'Explain', 'AO3'),
  sa('BECE-HEALTH', 'medium', 'State two methods a family can use to make unsafe drinking water safe at home.',
    'Any two of: boiling the water; filtering it and then treating it with the recommended amount of chlorine; using solar disinfection in clear bottles left in the sun.',
    'Boiling water for a few minutes kills the germs that cause diseases such as cholera and typhoid. Filtering removes particles, and adding the recommended small amount of chlorine then kills the remaining germs. Solar disinfection — leaving clear bottles of water in bright sunshine for several hours — also kills many germs. Any two of these methods earn the marks.',
    'State', 'AO1'),
  calc('BECE-HEALTH', 'easy', 'In a village, 200 out of 250 children have been immunised against measles. Calculate the percentage of children immunised.',
    '80%',
    'Percentage immunised = (number immunised ÷ total number of children) × 100 = (200 ÷ 250) × 100 = 0.8 × 100 = 80%. Answer: 80% of the children have been immunised.'),
  st('BECE-HEALTH', 'medium', 'There has been an outbreak of cholera in a nearby town, and the school health club is preparing a talk on it.', [
    part('a', 'Explain what is meant by a communicable disease.', 1,
      'A communicable disease is one that can be passed from one person (or animal) to another, for example through water, food, air or body contact (1).'),
    part('b', 'State two ways in which cholera is spread.', 2,
      'Drinking water contaminated with the cholera germs (1); eating food contaminated by dirty hands, flies or contaminated water (1).'),
    part('c', 'State two measures the community can take to control the outbreak.', 2,
      'Any two of: boil or chlorinate drinking water; wash hands with soap after using the toilet and before handling food; dispose of refuse and faeces safely; cover food and keep it away from flies; report cases quickly and treat patients with oral rehydration (1 each).'),
  ], 'Explain'),

  // --- Scientific Inquiry and Technology (topic_bece_science_methods): 2 hard MCQ, 1 SA, 1 calculation, 1 structured
  mcq('BECE-METHODS', 'hard', 'When reading the volume of water in a measuring cylinder, the eye must be level with the bottom of the meniscus. What error does this prevent?',
    'Parallax error, which gives a reading that is too high or too low',
    ['Zero error, which comes from a faulty scale', 'Expansion of the water as it warms up', 'Evaporation of the water during the reading'],
    'If the eye is above or below the meniscus, the line of sight makes the water level appear higher or lower than it really is — a parallax error. Reading with the eye level with the bottom of the meniscus gives the true volume. (Zero error is a fault of the instrument itself, and evaporation is far too slow to affect a single reading.)',
    'Explain', 'AO3'),
  mcq('BECE-METHODS', 'hard', 'A class investigates whether seedlings grow taller with more water. They give one group 50 cm³ of water a day and another group 100 cm³ a day. Which variable must be kept the same for a fair test?',
    'The type and amount of soil in each pot',
    ['The amount of water given to each pot', 'The height the seedlings finally reach', 'The colour of the measuring cylinder'],
    'In a fair test only the variable being investigated — the amount of water — is changed; every other factor that could affect growth, such as the soil, the pot size, the type of seed and the sunlight, must be kept constant. Otherwise no one can tell whether the water or some other difference caused the result. (The final height is the variable being measured, so it is expected to differ, and cylinder colour cannot affect growth.)',
    'Evaluate', 'AO3'),
  sa('BECE-METHODS', 'medium', 'List the first four stages of the scientific method, in the correct order.',
    'Observation of a problem; asking a question and forming a hypothesis; experimenting to test the hypothesis; recording the results and drawing a conclusion.',
    'Scientific investigation begins with careful observation, which raises a question; the investigator then forms a hypothesis — a testable suggested answer; next an experiment is designed and carried out to test the hypothesis; finally the results are recorded and analysed so that a conclusion can be drawn about whether the hypothesis was supported. Answer: observation → hypothesis → experiment → results and conclusion.',
    'Sequence', 'AO2'),
  calc('BECE-METHODS', 'easy', 'A learner measures the length of a leaf three times and gets 5.2 cm, 5.4 cm and 5.3 cm. Calculate the average (mean) length of the leaf.',
    '5.3 cm',
    'Mean = (5.2 + 5.4 + 5.3) cm ÷ 3 = 15.9 cm ÷ 3 = 5.3 cm. Answer: the average length of the leaf is 5.3 cm.'),
  st('BECE-METHODS', 'medium', 'A school is setting up a small science corner with basic instruments and safety rules.', [
    part('a', 'State two safety rules learners must follow when doing experiments.', 2,
      'Any two of: wear eye protection and tie back long hair; never taste chemicals; wash hands after practical work; report any breakage, spill or injury to the teacher at once; handle hot equipment with care (1 each).'),
    part('b', 'Name the instrument used to measure the mass of a stone.', 1,
      'A (beam or electronic) balance (1).'),
    part('c', 'State two ways in which technology helps farmers in Ghana.', 2,
      'Any two of: tractors and other machines prepare land faster than hand tools; mobile phones give weather forecasts and market prices; irrigation pumps water crops in the dry season; improved storage and processing equipment reduce post-harvest losses (1 each).'),
  ], 'State'),

  // --- Earth and Space Science (topic_bece_science_earth_space): 2 hard MCQ, 1 SA, 1 calculation, 1 structured
  mcq('BECE-EARTH', 'hard', 'The Moon shines brightly at night, yet it produces no light of its own. Why can we see the Moon, and why does its shape appear to change through the month?',
    'We see sunlight reflected from the Moon, and the changing amount of its lit half that faces us causes the phases',
    ['The Earth’s shadow covers the Moon a little more every night', 'The Moon burns its fuel slowly, so it dims each month', 'Clouds covering the Moon make it appear to change shape'],
    'The Moon is visible because it reflects sunlight. As it orbits the Earth we see different amounts of its sunlit half, producing the phases from new moon to full moon and back. (The Earth’s shadow causes a lunar eclipse, which is rare — not the monthly phases; the Moon has no fuel to burn, and clouds can hide the Moon but do not cause its phases.)',
    'Explain', 'AO3'),
  mcq('BECE-EARTH', 'hard', 'Places near the equator are generally hotter than places near the poles. Which statement best explains this?',
    'At the equator the Sun’s rays strike the ground almost directly, concentrating their energy on a smaller area',
    ['The equator is much closer to the Sun than the poles', 'The poles reflect all sunlight back into space', 'The Earth stops rotating at the poles, so they receive no heat'],
    'At the equator the Sun’s rays hit the surface nearly at right angles, so their energy is concentrated over a small area and heating is strong. Near the poles the same rays arrive at a slant and spread over a larger area, giving less heating per unit area. (The difference in distance to the Sun is negligible compared with the Earth-Sun distance, and the Earth rotates on its axis everywhere.)',
    'Explain', 'AO3'),
  sa('BECE-EARTH', 'medium', 'State two differences between igneous rocks and sedimentary rocks.',
    'Igneous rocks form when molten magma or lava cools and solidifies; sedimentary rocks form from layers of deposited sediment that are compacted and cemented. Sedimentary rocks often show layers and may contain fossils; igneous rocks do not.',
    'Igneous rocks, such as granite and basalt, form when hot molten rock (magma or lava) cools and hardens. Sedimentary rocks, such as sandstone and limestone, form when layers of sediment are pressed and cemented together over a long time, so they usually show visible layers and may contain fossils; igneous rocks have neither layers nor fossils. Any two of these differences earn the marks.',
    'State', 'AO1'),
  calc('BECE-EARTH', 'easy', 'A rain gauge at a school weather station recorded 12 mm, 18 mm and 15 mm of rain on three days. Calculate the total rainfall and the average daily rainfall.',
    'Total 45 mm; average 15 mm per day',
    'Total rainfall = 12 + 18 + 15 = 45 mm. Average daily rainfall = 45 mm ÷ 3 days = 15 mm per day. Answer: total 45 mm and average 15 mm per day.'),
  st('BECE-EARTH', 'medium', 'A class is studying how water moves between the Earth and the atmosphere.', [
    part('a', 'Define evaporation as it occurs in the water cycle.', 1,
      'Evaporation is the process by which the Sun’s heat turns liquid water from rivers, lakes and the sea into water vapour (1).'),
    part('b', 'State the two processes by which water vapour in the atmosphere returns to the Earth.', 2,
      'Condensation, in which the water vapour cools and forms tiny droplets in clouds (1); precipitation, in which the water falls back to the Earth as rain (or other forms) (1).'),
    part('c', 'Explain two reasons why the water cycle is important to people in Ghana.', 2,
      'It supplies fresh water for drinking, farming and fishing by refilling rivers, streams and wells (1); it supports the rainfall patterns on which food crops and livestock depend (1).'),
  ], 'Explain'),
];

for (const topic of topics) {
  if (!prodVerifiedTopicIds.has(topic.topicId)) throw new Error(`${topic.key}: topic id ${topic.topicId} is not a prod-verified canonical topic`);
}
for (const question of questions) {
  if (!topics.some((topic) => topic.code === question.topicCode)) throw new Error(`question uses undeclared topic code ${question.topicCode}`);
}

// --- Batch assembly ---------------------------------------------------------
const officialAttributionPattern = /\b(?:official\s+(?:waec|west african examinations council|nacca)|(?:waec|west african examinations council|nacca)[ -](?:approved|endorsed|authored|issued|certified))\b/i;
const nonOfficialDisclaimerGlobalPattern = /\b(?:not|non[- ]?)\s+official\s+(?:waec|west african examinations council|nacca)\b/gi;
function assertNoFalseOfficialClaim(value, field) {
  const withoutDisclaimer = String(value).replace(nonOfficialDisclaimerGlobalPattern, '');
  if (officialAttributionPattern.test(withoutDisclaimer)) throw new Error(`${field} contains a false official-exam-board claim`);
}

let mcqCounter = 0;
function buildMcq(question, sequence) {
  const correctIndex = mcqCounter++ % 4;
  const rawOptions = [...question.wrong];
  rawOptions.splice(correctIndex, 0, question.correct);
  return {
    id: `q_bece_intsci_s3_${String(sequence).padStart(3, '0')}`,
    original: true,
    topicCode: question.topicCode,
    type: 'multiple_choice',
    prompt: question.prompt,
    options: rawOptions.map((text, optionIndex) => ({
      label: labels[optionIndex],
      text,
      rationale: optionIndex === correctIndex
        ? `This is the supported answer. ${question.solution}`
        : 'This option is a plausible misconception, but it conflicts with the principle established in the worked solution.',
    })),
    correctAnswer: labels[correctIndex],
    workedSolution: `${question.solution} Therefore the correct answer is ${labels[correctIndex]}: ${question.correct}.`,
    difficulty: question.difficulty,
    marks: 1,
    points: 1,
    timeLimit: 90,
    commandWord: question.commandWord,
    assessmentObjective: question.assessmentObjective,
    provenance: [curriculumSource],
  };
}

function buildCalculation(question, sequence) {
  return {
    id: `q_bece_intsci_s3_${String(sequence).padStart(3, '0')}`,
    original: true,
    topicCode: question.topicCode,
    type: 'calculation',
    prompt: question.prompt,
    correctAnswer: question.answer,
    workedSolution: question.solution,
    difficulty: question.difficulty,
    marks: 2,
    points: 4,
    timeLimit: 120,
    commandWord: question.commandWord,
    assessmentObjective: question.assessmentObjective,
    provenance: [curriculumSource],
  };
}

function buildShortAnswer(question, sequence) {
  return {
    id: `q_bece_intsci_s3_${String(sequence).padStart(3, '0')}`,
    original: true,
    topicCode: question.topicCode,
    type: 'short_answer',
    prompt: question.prompt,
    correctAnswer: question.answer,
    workedSolution: question.solution,
    difficulty: question.difficulty,
    marks: 2,
    points: 2,
    timeLimit: 90,
    commandWord: question.commandWord,
    assessmentObjective: question.assessmentObjective,
    provenance: [curriculumSource],
  };
}

function structuredAnswer(question) {
  return question.parts.map((entry) => `(${entry.label}) ${entry.correctAnswer}`).join(' ');
}

function buildStructured(question, sequence) {
  const marks = question.parts.reduce((total, entry) => total + entry.marks, 0);
  return {
    id: `q_bece_intsci_s3_${String(sequence).padStart(3, '0')}`,
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
    provenance: [curriculumSource],
  };
}

const builtQuestions = [];
{
  let sequence = 0;
  for (const question of questions) {
    sequence += 1;
    if (question.type === 'multiple_choice') builtQuestions.push(buildMcq(question, sequence));
    else if (question.type === 'calculation') builtQuestions.push(buildCalculation(question, sequence));
    else if (question.type === 'short_answer') builtQuestions.push(buildShortAnswer(question, sequence));
    else builtQuestions.push(buildStructured(question, sequence));
  }
}

const batch = {
  batchId,
  status: 'approved_for_beta',
  examTypeId,
  provenance: [curriculumSource],
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
    specificationCode: 'BRILLA-BECE-INTSCI-S3-001',
    sources: [curriculumSource],
    topics: topics.map(({ code, title, objective }) => ({ code, title, objective })),
    questions: builtQuestions,
  }],
};

// --- Validation -------------------------------------------------------------
const validation = validateQuestionBatch(batch, { mode: 'production' });

// Coverage plan against artifacts/sprint3/cells-bece-int-science.json: fills
// every have:0 hard-MCQ cell (2 per topic, 9 topics = 18), every have:0
// calculation/short_answer cell (2 per topic, 10 topics = 20) and every have:0
// structured cell (1 per topic, 10 topics = 10), plus 2 of the 4 have:0
// medium-MCQ questions needed by Electricity and Magnetism (largest single
// gap). The remaining have:1/have:3 medium-MCQ cells and 2 electricity
// medium MCQs are deferred to a later sprint to keep the batch near 50 items.
const expectedCells = {
  'BECE-CELLS': { mediumMcq: 0, hardMcq: 2, calc: 1, shortAnswer: 1, structured: 1 },
  'BECE-BODY': { mediumMcq: 0, hardMcq: 2, calc: 1, shortAnswer: 1, structured: 1 },
  'BECE-MATTER': { mediumMcq: 0, hardMcq: 2, calc: 1, shortAnswer: 1, structured: 1 },
  'BECE-ENERGY': { mediumMcq: 0, hardMcq: 2, calc: 1, shortAnswer: 1, structured: 1 },
  'BECE-ELEC': { mediumMcq: 2, hardMcq: 2, calc: 1, shortAnswer: 1, structured: 1 },
  'BECE-MACH': { mediumMcq: 0, hardMcq: 2, calc: 1, shortAnswer: 1, structured: 1 },
  'BECE-AGRIC': { mediumMcq: 0, hardMcq: 0, calc: 1, shortAnswer: 1, structured: 1 },
  'BECE-HEALTH': { mediumMcq: 0, hardMcq: 2, calc: 1, shortAnswer: 1, structured: 1 },
  'BECE-METHODS': { mediumMcq: 0, hardMcq: 2, calc: 1, shortAnswer: 1, structured: 1 },
  'BECE-EARTH': { mediumMcq: 0, hardMcq: 2, calc: 1, shortAnswer: 1, structured: 1 },
};

function inHouseValidation(errors) {
  if (batch.review.automatedChecksAt !== generatedAt) errors.push('review.automatedChecksAt mismatch');
  if (batch.release.channel !== 'beta') errors.push('release.channel must be beta');
  if (typeof batch.release.contentLabel !== 'string' || batch.release.contentLabel.trim().length < 40) errors.push('release.contentLabel too short');
  if (!/\bnot\s+official\s+waec\b/i.test(batch.release.contentLabel)) errors.push('release.contentLabel must explicitly state the content is not official WAEC material');
  if (batch.release.officialExamBoardContent !== false) errors.push('release.officialExamBoardContent must be false');
  if (batch.release.feedbackEnabled !== true) errors.push('release.feedbackEnabled must be true');

  const letterCounts = { A: 0, B: 0, C: 0, D: 0 };
  const perTopic = new Map(topics.map(({ code }) => [code, { mediumMcq: 0, hardMcq: 0, calc: 0, shortAnswer: 0, structured: 0 }]));
  for (const question of batch.subjects[0].questions) {
    const cell = perTopic.get(question.topicCode);
    if (!cell) { errors.push(`${question.id}: unknown topicCode ${question.topicCode}`); continue; }
    if (!Array.isArray(question.provenance) || question.provenance[0]?.use !== 'curriculum_blueprint_only') errors.push(`${question.id}: per-item provenance missing`);
    assertNoFalseOfficialClaim(question.prompt, `${question.id}.prompt`);
    assertNoFalseOfficialClaim(question.workedSolution, `${question.id}.workedSolution`);
    if (question.type === 'multiple_choice') {
      if (question.difficulty === 'medium') cell.mediumMcq += 1;
      else if (question.difficulty === 'hard') cell.hardMcq += 1;
      else errors.push(`${question.id}: unexpected MCQ difficulty ${question.difficulty}`);
      letterCounts[question.correctAnswer] += 1;
      if (question.options?.length !== 4) errors.push(`${question.id}: MCQ needs exactly 4 options`);
      if (question.marks !== 1 || question.points !== 1 || question.timeLimit !== 90) errors.push(`${question.id}: MCQ scoring fields wrong`);
      for (const option of question.options ?? []) assertNoFalseOfficialClaim(option.text, `${question.id}.options`);
    } else if (question.type === 'calculation') {
      cell.calc += 1;
      if (question.options != null) errors.push(`${question.id}: calculation must not have options`);
      if (typeof question.correctAnswer !== 'string' || !question.correctAnswer.length) errors.push(`${question.id}: calculation needs an answer`);
      if (question.marks !== 2 || question.points !== 4 || question.timeLimit !== 120) errors.push(`${question.id}: calculation scoring fields wrong`);
      if (!/\d/.test(question.workedSolution)) errors.push(`${question.id}: calculation needs a worked numerical solution`);
    } else if (question.type === 'short_answer') {
      cell.shortAnswer += 1;
      if (question.options != null) errors.push(`${question.id}: short answer must not have options`);
      if (typeof question.correctAnswer !== 'string' || question.correctAnswer.length < 20) errors.push(`${question.id}: short answer needs a model answer`);
      if (question.marks !== 2 || question.points !== 2 || question.timeLimit !== 90) errors.push(`${question.id}: short answer scoring fields wrong`);
    } else if (question.type === 'structured') {
      cell.structured += 1;
      const sum = question.parts.reduce((total, entry) => total + entry.marks, 0);
      if (sum !== question.marks) errors.push(`${question.id}: part marks (${sum}) must sum to marks (${question.marks})`);
      if (!/\bnot\s+official\s+waec\b/i.test(question.contentLabel)) errors.push(`${question.id}: structured contentLabel must disclaim official WAEC status`);
      for (const entry of question.parts) {
        assertNoFalseOfficialClaim(entry.text, `${question.id} part ${entry.label}`);
        assertNoFalseOfficialClaim(entry.correctAnswer, `${question.id} part ${entry.label} answer`);
      }
    } else {
      errors.push(`${question.id}: unexpected type ${question.type}`);
    }
  }
  for (const [code, expected] of Object.entries(expectedCells)) {
    const actual = perTopic.get(code);
    if (!actual) { errors.push(`${code}: no questions found`); continue; }
    for (const key of Object.keys(expected)) {
      if (actual[key] !== expected[key]) errors.push(`${code}: expected ${JSON.stringify(expected)}, found ${JSON.stringify(actual)}`);
    }
  }
  for (const label of labels) {
    if (letterCounts[label] !== 5) errors.push(`correct answer letter ${label} should appear 5 times, found ${letterCounts[label]}`);
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

// --- SQL emission -----------------------------------------------------------
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
// and both the inserts and the fail-closed checks read from them, so long
// explanations stay within the remote D1 query limit.
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

let migrationNumber = 618;
{
  // Canonical topic rows: exact prod id/name/slug/description/display_order
  // (verified read-only against brilla-db on 2026-09-09). Prod patches
  // 094/095/096 create them on every fresh baseline, so these no-op there and
  // on prod; they exist so a scratch baseline without the patches still has
  // the bindings. topics is UNIQUE(subject_id, slug), and the existing rows
  // already own these slugs.
  const canonicalTopicRows = [
    ['topic_bece_science_cells', 'Cells and Living Organisms', 'cells-and-living-organisms', 'Cell structure, classification and characteristics of living things', 1],
    ['topic_bece_science_body', 'Human Body Systems', 'human-body-systems', 'Digestive, circulatory, respiratory and reproductive systems', 2],
    ['topic_bece_science_matter', 'Matter and Its States', 'matter-and-its-states', 'Particles, states of matter, elements, mixtures and separation', 3],
    ['topic_bece_science_energy', 'Energy and Its Forms', 'energy-and-its-forms', 'Forms, sources, transformation and conservation of energy', 4],
    ['topic_bece_science_electricity', 'Electricity and Magnetism', 'electricity-and-magnetism', 'Simple circuits, conductors, insulators and magnets', 5],
    ['topic_bece_science_machines', 'Force, Work and Machines', 'force-work-and-machines', 'Types of forces, work, energy and simple machines', 6],
    ['topic_bece_science_agric', 'Agriculture and Food Production', 'agriculture-and-food-production', 'Soil, crops, farm animals and food preservation', 7],
    ['topic_bece_science_health', 'Health, Sanitation and Environment', 'health-sanitation-and-environment', 'Personal hygiene, diseases, waste management and ecosystems', 8],
    ['topic_bece_science_methods', 'Scientific Inquiry and Technology', 'scientific-inquiry-and-technology', 'Scientific method, variables, laboratory instruments and applications of technology', 9],
    ['topic_bece_science_earth_space', 'Earth and Space Science', 'earth-and-space-science', 'Earth structure, rocks, the atmosphere, the water cycle and the Solar System', 10],
  ];
  const allTopicIds = canonicalTopicRows.map(([id]) => id);
  const name = `${migrationNumber}_bece_int_science_sprint3_foundation.sql`;
  const lines = [
    `-- ${migrationNumber}: Foundation guard for BECE Integrated Science sprint 3 beta batch (${batchId}).`,
    '-- Original BrillaPrep practice content; not official WAEC or NaCCA examination material.',
    '-- Re-asserts the prod-canonical topic rows for subj_bece_science on scratch',
    '-- baselines; INSERT OR IGNORE no-ops on prod and on fresh baselines where the',
    '-- rows already exist (prod patches 094/095/096).',
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
    ...canonicalTopicRows.map(([id, topicName, slug, description, displayOrder]) =>
      `INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES (${sql(id)}, '${subjectId}', NULL, ${sql(topicName)}, ${sql(slug)}, ${sql(description)}, NULL, NULL, ${displayOrder}, '2026-08-13T00:00:00.000Z');`),
    `CREATE TABLE IF NOT EXISTS _migration_${migrationNumber}_guard (valid INTEGER NOT NULL CHECK (valid = 1));`,
    `DELETE FROM _migration_${migrationNumber}_guard;`,
    `INSERT INTO _migration_${migrationNumber}_guard(valid) SELECT CASE WHEN EXISTS (SELECT 1 FROM exam_types WHERE id = '${examTypeId}') AND EXISTS (SELECT 1 FROM exam_boards WHERE id = '${examBoardId}') AND EXISTS (SELECT 1 FROM subjects WHERE id = '${subjectId}' AND exam_type_id = '${examTypeId}') AND (SELECT COUNT(*) FROM topics t JOIN subjects s ON s.id = t.subject_id WHERE t.id IN (${allTopicIds.map(sql).join(', ')}) AND t.subject_id = '${subjectId}' AND s.exam_type_id = '${examTypeId}') = ${allTopicIds.length} THEN 1 ELSE 0 END;`,
    `DROP TABLE _migration_${migrationNumber}_guard;`,
  ];
  await emitMigration(name, lines);
  migrationNumber += 1;
}

const allQuestions = batch.subjects[0].questions;
const partSlices = [[0, 7], [7, 14], [14, 20], [20, 26], [26, 32], [32, 38], [38, 44], [44, 50]];
const partCount = partSlices.length;
for (let partNumber = 1; partNumber <= partCount; partNumber += 1) {
  const [start, end] = partSlices[partNumber - 1];
  const partQuestions = allQuestions.slice(start, end);
  const ids = partQuestions.map((question) => question.id);
  const expectedTable = `_migration_${migrationNumber}_expected`;
  const expectedPartsTable = `_migration_${migrationNumber}_expected_parts`;
  const guardTable = `_migration_${migrationNumber}_guard`;
  const name = `${migrationNumber}_bece_int_science_sprint3_part_${partNumber}.sql`;
  const structuredRows = partQuestions
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
    `-- ${migrationNumber}: Original BrillaPrep BECE Integrated Science sprint 3 beta questions, part ${partNumber} of ${partCount} (batch ${batchId}).`,
    '-- Curriculum-aligned practice content; not official WAEC or NaCCA examination material.',
    'PRAGMA foreign_keys = ON;',
    expectedTableDDL(expectedTable),
    `INSERT INTO ${expectedTable} (id, ${canonicalQuestionFields.join(', ')}) VALUES ${partQuestions.map((question) => {
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
  const allIds = allQuestions.map((question) => question.id);
  const mcqIds = allQuestions.filter((question) => question.type === 'multiple_choice').map((question) => question.id);
  const calcIds = allQuestions.filter((question) => question.type === 'calculation').map((question) => question.id);
  const shortAnswerIds = allQuestions.filter((question) => question.type === 'short_answer').map((question) => question.id);
  const structuredIds = allQuestions.filter((question) => question.type === 'structured').map((question) => question.id);
  const structuredPartTotal = allQuestions
    .filter((question) => question.type === 'structured')
    .reduce((total, question) => total + question.parts.length, 0);
  const name = `${migrationNumber}_bece_int_science_sprint3_final_guard.sql`;
  const guardTable = `_migration_${migrationNumber}_guard`;
  const lines = [
    `-- ${migrationNumber}: Final exact-set and relationship guard for BECE Integrated Science sprint 3 beta batch (${batchId}).`,
    'PRAGMA foreign_keys = ON;',
    `CREATE TABLE IF NOT EXISTS ${guardTable} (valid INTEGER NOT NULL CHECK (valid = 1));`,
    `DELETE FROM ${guardTable};`,
    `INSERT INTO ${guardTable}(valid) SELECT CASE WHEN (SELECT COUNT(*) FROM questions q JOIN topics t ON t.id = q.topic_id JOIN question_content_releases r ON r.question_id = q.id WHERE q.id IN (${allIds.map(sql).join(', ')}) AND q.subject_id = '${subjectId}' AND q.subject_id = t.subject_id AND q.exam_type_id = '${examTypeId}' AND q.exam_board_id = '${examBoardId}' AND q.round_type IS NULL AND length(q.explanation) >= 80 AND r.batch_id = '${batchId}' AND r.quality_assurance = 'automated_beta' AND r.release_channel = 'beta' AND r.official_exam_board_content = 0 AND r.feedback_enabled = 1) = 50 AND (SELECT COUNT(*) FROM questions q WHERE q.id IN (${mcqIds.map(sql).join(', ')}) AND q.question_type = 'multiple_choice' AND json_valid(q.options) AND json_array_length(q.options) = 4 AND q.correct_answer IN ('A', 'B', 'C', 'D') AND q.points = 1 AND q.marks = 1 AND q.time_limit = 90) = ${mcqIds.length} AND (SELECT COUNT(*) FROM questions q WHERE q.id IN (${calcIds.map(sql).join(', ')}) AND q.question_type = 'calculation' AND q.options IS NULL AND length(q.correct_answer) >= 1 AND q.points = 4 AND q.marks = 2 AND q.time_limit = 120) = ${calcIds.length} AND (SELECT COUNT(*) FROM questions q WHERE q.id IN (${shortAnswerIds.map(sql).join(', ')}) AND q.question_type = 'short_answer' AND q.options IS NULL AND length(q.correct_answer) >= 20 AND q.points = 2 AND q.marks = 2 AND q.time_limit = 90) = ${shortAnswerIds.length} AND (SELECT COUNT(*) FROM questions q WHERE q.id IN (${structuredIds.map(sql).join(', ')}) AND q.question_type = 'structured' AND q.options IS NULL) = ${structuredIds.length} AND (SELECT COUNT(*) FROM structured_question_parts WHERE question_id IN (${structuredIds.map(sql).join(', ')})) = ${structuredPartTotal} AND (SELECT COUNT(*) FROM question_content_releases WHERE batch_id = '${batchId}') = 50 AND (SELECT COUNT(*) FROM questions WHERE id IN (${allIds.map(sql).join(', ')}) AND difficulty = 'easy') = 5 AND (SELECT COUNT(*) FROM questions WHERE id IN (${allIds.map(sql).join(', ')}) AND difficulty = 'medium') = 27 AND (SELECT COUNT(*) FROM questions WHERE id IN (${allIds.map(sql).join(', ')}) AND difficulty = 'hard') = 18 THEN 1 ELSE 0 END;`,
    `DROP TABLE ${guardTable};`,
  ];
  await emitMigration(name, lines);
  migrationNumber += 1;
}

console.log(JSON.stringify({ validation: { valid: validation.valid, warnings: validation.warnings, metrics: validation.metrics }, outBatch, migrations: migrationPaths }, null, 2));
