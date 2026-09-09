import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeQuestionText, validateQuestionBatch } from './question-content-lib.mjs';

const sourceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputRootArgument = process.argv.indexOf('--output-root');
if (outputRootArgument >= 0 && !process.argv[outputRootArgument + 1]) throw new Error('--output-root requires a path');
const outputRoot = outputRootArgument >= 0 ? resolve(process.argv[outputRootArgument + 1]) : sourceRoot;
const generatedAt = '2026-09-09T14:30:00Z';
const labels = ['A', 'B', 'C', 'D'];
const batchId = 'wassce-int-science-sprint3-001';
const subjectId = 'subj_wassce_int_science';
const examTypeId = 'exam_wassce';
const contentLabel = 'Original BrillaPrep curriculum-aligned WASSCE Integrated Science practice questions; not official WAEC (West African Examinations Council) examination material. Use the enabled feedback channel to report corrections.';
const theoryContentLabel = 'Original BrillaPrep curriculum-aligned WASSCE Integrated Science practice content; not official WAEC (West African Examinations Council) examination material. Use the enabled feedback channel to report corrections.';
const releaseSourceUrl = 'https://nacca.gov.gh/secondary-education-curriculum/';

const naccaSource = {
  publisher: 'National Council for Curriculum and Assessment (NaCCA), Ghana',
  title: 'Secondary Education Curriculum — Integrated Science',
  url: releaseSourceUrl,
  use: 'curriculum_blueprint_only',
};

const mcq = (topicCode, difficulty, prompt, correct, wrong, solution, commandWord = 'Identify', assessmentObjective = 'AO2') => ({ topicCode, type: 'multiple_choice', difficulty, prompt, correct, wrong, solution, commandWord, assessmentObjective });
const calc = (topicCode, difficulty, prompt, answer, solution, assessmentObjective = 'AO2') => ({ topicCode, type: 'calculation', difficulty, prompt, answer, solution, commandWord: 'Calculate', assessmentObjective });
const st = (topicCode, prompt, parts, commandWord = 'Describe') => ({ topicCode, type: 'structured', difficulty: 'medium', prompt, parts, commandWord, assessmentObjective: 'AO2' });
const part = (label, text, marks, correctAnswer) => ({ label, text, marks, correctAnswer });

// Sprint 3 focus (artifacts/sprint3/cells-int-science-wassce.json): fill every
// remaining MCQ cell on the intsci topics (agric easy/medium/hard, health
// medium/hard, cells medium/hard, body hard, energy hard, waves easy/hard,
// matter hard), one calculation for each of the twelve "calculation or
// short_answer" cells, and one structured question for each of the nine
// structured cells. The second calculation slot on each topic is deferred to a
// later sprint to keep this batch at ~45 items.
const topics = [
  {
    key: 'agric',
    topicId: 'topic_wassce_intsci_agric',
    code: 'WASSCE-ISC-AGRIC',
    title: 'Agriculture and Ecosystems',
    objective: 'Apply soil-, crop- and ecosystem-science principles to Ghanaian farming and natural habitats.',
    questions: [
      mcq('WASSCE-ISC-AGRIC', 'easy', 'Which of the following farming practices best conserves soil moisture during the dry season?',
        'Mulching the soil with plant residues', ['Burning the stubble after harvest', 'Ploughing the field along the slope', 'Removing all vegetation between crops'],
        'Mulching covers the soil with dry grass or crop residues, reducing direct evaporation and keeping the soil moist for longer. Burning stubble destroys organic matter and exposes the soil, ploughing along the slope encourages erosion, and removing vegetation leaves the soil bare to the sun.',
        'Identify', 'AO1'),
      mcq('WASSCE-ISC-AGRIC', 'easy', 'Which organism lives in the root nodules of legumes and improves soil fertility by fixing atmospheric nitrogen?',
        'Rhizobium bacterium', ['Earthworm', 'Mushroom fungus', 'Termite'],
        'Rhizobium bacteria live symbiotically in the root nodules of legumes such as cowpea and groundnut, converting atmospheric nitrogen into nitrates the plant can use. Earthworms only improve soil aeration and drainage, while mushrooms and termites are decomposers that do not fix nitrogen.',
        'Identify', 'AO1'),
      mcq('WASSCE-ISC-AGRIC', 'easy', 'In the food chain grass → grasshopper → lizard → hawk, the hawk is a',
        'tertiary consumer', ['producer', 'primary consumer', 'secondary consumer'],
        'Grass is the producer, the grasshopper that eats it is the primary consumer, the lizard that eats the grasshopper is the secondary consumer, and the hawk that eats the lizard is the tertiary consumer — the fourth trophic level.',
        'Identify', 'AO1'),
      mcq('WASSCE-ISC-AGRIC', 'medium', 'A maize farmer observes that the older leaves of his plants are turning yellow and growth is stunted. Which soil nutrient is most likely deficient?',
        'Nitrogen', ['Phosphorus', 'Potassium', 'Calcium'],
        'Nitrogen is needed for proteins and chlorophyll, and because it is mobile in the plant, deficiency shows first as yellowing (chlorosis) of the older leaves with stunted growth. Phosphorus deficiency gives poor root development and purplish leaves, while potassium deficiency scorches leaf edges.',
        'Identify', 'AO2'),
      mcq('WASSCE-ISC-AGRIC', 'medium', 'Which of the following is an important advantage of including a legume in a crop rotation programme?',
        'It restores nitrogen to the soil for the following crop', ['It removes all weeds from the field', 'It increases the salinity of the soil', 'It prevents all soil erosion'],
        'Legumes such as cowpea and groundnut host Rhizobium bacteria that fix atmospheric nitrogen into the soil, reducing the fertilizer needs of the next crop. Rotation cannot remove all weeds or prevent all erosion, and it does not increase soil salinity.',
        'Identify', 'AO2'),
      mcq('WASSCE-ISC-AGRIC', 'medium', 'The process by which plants lose water vapour through their leaves to the atmosphere is called',
        'transpiration', ['guttation', 'photosynthesis', 'respiration'],
        'Transpiration is the loss of water vapour mainly through the stomata of leaves, and it drives the upward movement of water from the roots. Guttation is the loss of liquid water droplets at leaf edges, while photosynthesis makes food and respiration releases energy.',
        'Identify', 'AO2'),
      mcq('WASSCE-ISC-AGRIC', 'hard', 'In any ecosystem, the largest amount of energy is available to the',
        'producers', ['primary consumers', 'secondary consumers', 'decomposers'],
        'Energy enters the ecosystem through producers (green plants) by photosynthesis, and only about 10% of the energy at each trophic level is transferred to the next — the rest is lost as heat and in life processes — so energy decreases up the food chain and producers hold the largest share.',
        'Explain', 'AO3'),
      mcq('WASSCE-ISC-AGRIC', 'hard', 'Bush burning is discouraged as a land-clearing method mainly because it',
        'destroys soil organic matter and kills beneficial soil organisms', ['adds excess nitrogen to the soil', 'makes the soil too fertile for crops', 'increases the humus content of the soil'],
        'Bush burning destroys humus and kills earthworms, microbes and other beneficial organisms, lowering soil fertility and structure; the ash gives only a short-lived mineral boost. It removes rather than adds nitrogen, since nitrogen compounds escape into the air as gases during burning.',
        'Explain', 'AO3'),
      calc('WASSCE-ISC-AGRIC', 'medium', 'A rectangular maize farm measures 120 m by 80 m. Calculate the area of the farm in hectares. (1 hectare = 10,000 m²)',
        '0.96 hectares',
        'Area = length × width = 120 m × 80 m = 9,600 m². Converting to hectares: 9,600 ÷ 10,000 = 0.96. Answer: the farm covers 0.96 hectares.'),
      st('WASSCE-ISC-AGRIC', 'A school farm keeps a small grassland plot as a study site.', [
        part('a', 'Define the term ecosystem.', 2,
          'An ecosystem is a community of living organisms interacting with one another and with their non-living physical environment, such as soil, water and air.'),
        part('b', 'Construct a food chain with three trophic levels using organisms found in the grassland.', 2,
          'For example, grass → grasshopper → lizard (or grass → grasscutter → hawk); the arrows point from the organism being eaten to the eater, showing the direction of energy flow.'),
        part('c', 'State the role of decomposers in the ecosystem.', 2,
          'Decomposers such as bacteria and fungi break down dead organisms and waste products, releasing nutrients back into the soil for producers to reuse.'),
      ]),
    ],
  },
  {
    key: 'health',
    topicId: 'topic_wassce_intsci_health',
    code: 'WASSCE-ISC-HLTH',
    title: 'Environmental Health',
    objective: 'Evaluate community water, sanitation and pollution-control practices that protect public health.',
    questions: [
      mcq('WASSCE-ISC-HLTH', 'medium', 'Which of the following methods is most reliable for killing disease-causing micro-organisms in drinking water at home?',
        'Boiling the water', ['Decanting the water', 'Sieving the water through cloth', 'Leaving the water to settle'],
        'Boiling kills the bacteria, viruses and other pathogens in water. Decanting, sieving and settling only remove suspended particles; they do not kill the micro-organisms that cause diseases such as cholera and typhoid.',
        'Identify', 'AO2'),
      mcq('WASSCE-ISC-HLTH', 'medium', 'Which of the following diseases is commonly spread by houseflies?',
        'Cholera', ['Malaria', 'Tuberculosis', 'Measles'],
        'Houseflies carry germs from faeces and refuse onto food, spreading intestinal diseases such as cholera, typhoid and dysentery. Malaria is spread by mosquitoes, tuberculosis by air-borne droplets, and measles by coughing and sneezing.',
        'Identify', 'AO2'),
      mcq('WASSCE-ISC-HLTH', 'medium', 'The most effective way to control the breeding of mosquitoes in a community is to',
        'drain or cover all stagnant water around homes', ['plant more flowers around houses', 'burn firewood every evening', 'keep water containers uncovered'],
        'Mosquitoes lay their eggs in stagnant water, so draining puddles and covering water-storage containers removes their breeding sites. Flowers do not affect breeding, smoke from firewood gives only temporary relief, and uncovered containers create even more breeding sites.',
        'Identify', 'AO2'),
      mcq('WASSCE-ISC-HLTH', 'hard', 'Chlorine is added to public water supplies mainly because it',
        'kills disease-causing micro-organisms in the water', ['removes suspended solids from the water', 'softens the hard water', 'improves the colour of the water'],
        'Chlorination disinfects water: chlorine destroys bacteria and viruses, making the treated water safe to drink. Suspended solids are removed earlier by coagulation, sedimentation and filtration, and chlorine neither softens hard water nor changes its colour.',
        'Explain', 'AO3'),
      mcq('WASSCE-ISC-HLTH', 'hard', 'Depletion of the ozone layer is caused mainly by the release of',
        'chlorofluorocarbons from old refrigerants and aerosols', ['carbon dioxide from burning fossil fuels', 'sulphur dioxide from factories', 'smoke from bushfires'],
        'Chlorofluorocarbons (CFCs) rise into the stratosphere, where ultraviolet radiation breaks them down and the chlorine released destroys ozone molecules. Carbon dioxide drives global warming rather than ozone depletion, and sulphur dioxide causes acid rain — common confusions.',
        'Explain', 'AO3'),
      calc('WASSCE-ISC-HLTH', 'medium', 'A water treatment plant adds 0.5 g of chlorine for every 100 litres of water. Calculate the mass of chlorine needed to treat 4,000 litres of water.',
        '20 g',
        'Each 100 litres needs 0.5 g, and 4,000 litres contains 4,000 ÷ 100 = 40 units of 100 litres. Mass of chlorine = 40 × 0.5 g = 20 g. Answer: 20 g of chlorine is needed.'),
      st('WASSCE-ISC-HLTH', 'Water for a rural community comes from a shallow well.', [
        part('a', 'State two ways in which the well water may become contaminated.', 2,
          'Any two of: runoff carrying refuse or faeces into the well; animals drinking directly from the well; buckets and ropes handled with dirty hands; pit latrines sited too close to the well.'),
        part('b', 'Describe two methods of purifying the water for drinking.', 2,
          'Any two of: boiling the water to kill germs; adding chlorine (for example WaterGuard) at the correct dose; filtering and then disinfecting; solar disinfection in clear bottles exposed to sunlight.'),
        part('c', 'State one reason why water must be purified before drinking.', 1,
          'To kill or remove germs that cause water-borne diseases such as cholera, typhoid and dysentery.'),
      ]),
    ],
  },
  {
    key: 'cells',
    topicId: 'topic_wassce_intsci_cells',
    code: 'WASSCE-ISC-CELL',
    title: 'Cells and Living Things',
    objective: 'Relate cell structure to function and classify organisms by their cellular organisation.',
    questions: [
      mcq('WASSCE-ISC-CELL', 'medium', 'Which part of a living cell regulates the passage of substances across its boundary?',
        'Cell membrane', ['Cell wall', 'Nucleus', 'Cytoplasm'],
        'The cell membrane is partially permeable, allowing some substances to pass while blocking others. The cell wall is fully permeable and only gives support, the nucleus controls the activities of the cell, and the cytoplasm is the site of chemical reactions.',
        'Identify', 'AO2'),
      mcq('WASSCE-ISC-CELL', 'medium', 'Which of the following organisms is made up of only one cell?',
        'Amoeba', ['Hydra', 'Earthworm', 'Spirogyra'],
        'Amoeba is a unicellular organism that carries out all life processes within a single cell. Hydra, the earthworm and Spirogyra are multicellular organisms made of many specialised cells.',
        'Identify', 'AO2'),
      mcq('WASSCE-ISC-CELL', 'hard', 'Which of the following correctly distinguishes a plant cell from an animal cell?',
        'The plant cell has a cellulose cell wall and chloroplasts; the animal cell has neither', ['The animal cell has a cell wall; the plant cell does not', 'The plant cell has no nucleus; the animal cell has one', 'Both cells contain chloroplasts for making food'],
        'Plant cells are surrounded by a cellulose cell wall and contain chloroplasts with chlorophyll for photosynthesis; animal cells lack both. All plant and animal cells have a nucleus, and only plant cells can photosynthesise.',
        'Distinguish', 'AO3'),
      mcq('WASSCE-ISC-CELL', 'hard', 'A plant cell placed in a concentrated salt solution loses water. The process by which the water leaves the cell is',
        'osmosis', ['active transport', 'transpiration', 'imbibition'],
        'Water moves from the dilute cell sap through the partially permeable membrane into the concentrated external solution by osmosis, so the cell shrinks (plasmolysis). Active transport moves substances against a gradient using energy, transpiration is water loss from leaves, and imbibition is water uptake by dry materials.',
        'Identify', 'AO3'),
      calc('WASSCE-ISC-CELL', 'medium', 'A microscope has an eyepiece lens of magnification ×10 and an objective lens of magnification ×40. Calculate the total magnification of the microscope.',
        '×400',
        'Total magnification = eyepiece magnification × objective magnification = 10 × 40 = 400. Answer: the total magnification of the microscope is ×400.'),
      st('WASSCE-ISC-CELL', 'A student observes plant cells and animal cells under a light microscope.', [
        part('a', 'State two differences between the plant cells and the animal cells the student observes.', 2,
          'Any two of: plant cells have a cellulose cell wall, animal cells do not; plant cells contain chloroplasts, animal cells do not; plant cells have a large central vacuole, animal cells have small temporary vacuoles; plant cells have a regular shape, animal cells are irregular.'),
        part('b', 'Name two organelles found in both types of cell and state the function of each.', 4,
          'Any two of: nucleus — controls the activities of the cell and carries the genetic material; mitochondrion — releases energy from food during respiration; cell membrane — controls the movement of substances into and out of the cell; cytoplasm — site of most chemical reactions of the cell.'),
      ]),
    ],
  },
  {
    key: 'body',
    topicId: 'topic_wassce_intsci_body',
    code: 'WASSCE-ISC-BODY',
    title: 'Human Body Systems',
    objective: 'Explain how the circulatory, nervous, skeletal and other body systems sustain the human body.',
    questions: [
      mcq('WASSCE-ISC-BODY', 'hard', 'Oxygenated blood returns from the lungs to the left atrium of the heart through the',
        'Pulmonary vein', ['Pulmonary artery', 'Vena cava', 'Aorta'],
        'The pulmonary vein returns oxygenated blood from the lungs to the left atrium of the heart. The pulmonary artery carries deoxygenated blood from the heart to the lungs, the vena cava brings deoxygenated blood from the body to the heart, and the aorta distributes oxygenated blood from the heart to the body.',
        'Identify', 'AO3'),
      mcq('WASSCE-ISC-BODY', 'hard', 'The part of the brain responsible for balance and the coordination of body movement is the',
        'cerebellum', ['cerebrum', 'medulla oblongata', 'spinal cord'],
        'The cerebellum, at the back of the brain, coordinates muscular movement and maintains balance and posture. The cerebrum handles thought and voluntary actions, the medulla oblongata controls involuntary actions such as heartbeat and breathing, and the spinal cord is not part of the brain.',
        'Identify', 'AO3'),
      calc('WASSCE-ISC-BODY', 'medium', "A student's heart beats 72 times per minute. Calculate the total number of heartbeats during a 2-hour examination.",
        '8,640 beats',
        'Two hours is 2 × 60 = 120 minutes. Number of beats = 72 × 120 = 8,640. Answer: the heart beats 8,640 times during the examination.'),
      st('WASSCE-ISC-BODY', 'The human skeleton and circulatory system work together to support and sustain the body.', [
        part('a', 'State two functions of the human skeleton.', 2,
          'Any two of: supports the body and gives it shape; protects delicate organs such as the brain, heart and lungs; provides surfaces for muscle attachment to allow movement; produces blood cells in the bone marrow.'),
        part('b', 'Describe the path taken by oxygenated blood from the lungs to the rest of the body.', 3,
          'Oxygenated blood flows from the lungs through the pulmonary vein into the left atrium, passes into the left ventricle, and is then pumped out through the aorta to all parts of the body.'),
      ]),
    ],
  },
  {
    key: 'reproduction',
    topicId: 'topic_wassce_intsci_reproduction',
    code: 'WASSCE-ISC-REP',
    title: 'Reproduction and Heredity',
    objective: 'Compare modes of reproduction and predict inheritance patterns using simple genetic crosses.',
    questions: [
      calc('WASSCE-ISC-REP', 'hard', 'In guinea pigs, black fur (B) is dominant over white fur (b). Two heterozygous guinea pigs (Bb) are crossed. What fraction of the offspring is expected to have white fur?',
        '1/4 (25%)',
        'The cross Bb × Bb gives the genotypes BB, Bb, Bb and bb in equal proportions. Since black is dominant, the BB and Bb offspring are black and only the bb offspring are white — 1 out of 4. Answer: 1/4, or 25%, of the offspring are expected to have white fur.',
        'AO3'),
      st('WASSCE-ISC-REP', 'Living things increase their numbers by reproduction.', [
        part('a', 'Distinguish between asexual reproduction and sexual reproduction.', 2,
          'Asexual reproduction involves one parent and produces offspring that are genetically identical to that parent, while sexual reproduction involves the fusion of male and female gametes, usually from two parents, and produces offspring that show variation.'),
        part('b', 'State one advantage of each type of reproduction.', 2,
          'Asexual reproduction allows rapid multiplication when conditions are favourable; sexual reproduction produces variation, which helps the species adapt to changing conditions and resist disease.'),
      ]),
    ],
  },
  {
    key: 'matter',
    topicId: 'topic_wassce_intsci_matter',
    code: 'WASSCE-ISC-MTR',
    title: 'Matter and Materials',
    objective: 'Distinguish physical from chemical change and relate particle behaviour to the states of matter.',
    questions: [
      mcq('WASSCE-ISC-MTR', 'hard', 'Which of the following is an example of a chemical change?',
        'Rusting of an iron roofing sheet', ['Melting of candle wax', 'Dissolving salt in water', 'Magnetising a steel needle'],
        'Rusting forms a new substance, hydrated iron(III) oxide, and cannot easily be reversed, so it is a chemical change. Melting wax, dissolving salt and magnetising steel produce no new substance and are reversible physical changes.',
        'Identify', 'AO3'),
      calc('WASSCE-ISC-MTR', 'medium', 'A metal block has a mass of 270 g and a volume of 100 cm³. Calculate the density of the metal.',
        '2.7 g/cm³',
        'Density = mass ÷ volume = 270 g ÷ 100 cm³ = 2.7 g/cm³. Answer: the density of the metal is 2.7 g/cm³.'),
      st('WASSCE-ISC-MTR', 'A student is given samples of candle wax, water and air to investigate.', [
        part('a', 'State the three states of matter.', 3,
          'Solid, liquid and gas.'),
        part('b', 'Describe how the arrangement and movement of particles differ between a solid and a gas.', 2,
          'In a solid the particles are closely packed in fixed positions and can only vibrate, while in a gas the particles are far apart and move freely and rapidly in all directions.'),
      ]),
    ],
  },
  {
    key: 'energy',
    topicId: 'topic_wassce_intsci_energy',
    code: 'WASSCE-ISC-ENGY',
    title: 'Energy and Electricity',
    objective: 'Analyse series circuits and apply the relationships between energy, power, current, voltage and resistance.',
    questions: [
      mcq('WASSCE-ISC-ENGY', 'hard', 'Three resistors of 2 Ω, 3 Ω and 5 Ω are connected in series in a circuit. What is their total resistance?',
        '10 Ω', ['30 Ω', '5 Ω', '0.97 Ω'],
        'Resistors in series simply add: R = 2 + 3 + 5 = 10 Ω. (30 Ω comes from multiplying the values, and 0.97 Ω is the parallel combination 1 ÷ (½ + ⅓ + ⅕) — a common confusion between series and parallel rules.)',
        'Calculate', 'AO3'),
      mcq('WASSCE-ISC-ENGY', 'hard', 'Two identical lamps are connected in series in a circuit. If one lamp blows, the other lamp will',
        'go out because the circuit is now broken', ['shine brighter than before', 'stay on with the same brightness', 'become dimmer but remain lit'],
        'In a series circuit there is only one path for the current. A blown lamp creates a gap, so the current stops completely and the second lamp goes out. Only lamps in parallel are unaffected when one branch fails — a common misconception.',
        'Explain', 'AO3'),
      calc('WASSCE-ISC-ENGY', 'medium', 'An electric iron is rated at 1,000 W. Calculate the energy it consumes when used for 30 minutes, giving your answer in joules.',
        '1,800,000 J (1.8 × 10⁶ J)',
        'Energy = power × time, with time in seconds: 30 minutes = 30 × 60 = 1,800 s. Energy = 1,000 W × 1,800 s = 1,800,000 J = 1.8 × 10⁶ J. Answer: the iron consumes 1.8 × 10⁶ J of energy.'),
      st('WASSCE-ISC-ENGY', 'A student sets up a simple circuit containing a battery, an ammeter and a resistor.', [
        part('a', "State Ohm's law.", 2,
          'The current flowing through a metallic conductor is directly proportional to the potential difference across its ends, provided temperature and other physical conditions remain constant (V = IR).'),
        part('b', 'The ammeter reads 2 A and the resistor has a resistance of 6 Ω. Calculate the potential difference across the resistor.', 2,
          'V = I × R = 2 A × 6 Ω = 12 V.'),
      ]),
    ],
  },
  {
    key: 'waves',
    topicId: 'topic_wassce_intsci_waves',
    code: 'WASSCE-ISC-WAV',
    title: 'Waves, Light and Sound',
    objective: 'Apply the properties and wave equation of light and sound to reflection and wave-motion problems.',
    questions: [
      mcq('WASSCE-ISC-WAV', 'easy', 'The image formed by a plane mirror is always',
        'virtual, upright and the same size as the object', ['real, inverted and diminished', 'virtual, inverted and magnified', 'real, upright and the same size as the object'],
        'A plane mirror forms an image that is virtual (the rays only appear to come from behind the mirror), upright, the same size as the object and laterally inverted. It is never real or upside down.',
        'Identify', 'AO1'),
      mcq('WASSCE-ISC-WAV', 'hard', 'Sound waves cannot travel through a vacuum because sound',
        'requires a material medium to transmit its vibrations', ['travels too fast to pass through empty space', 'is an electromagnetic wave', 'is completely absorbed by any empty space'],
        'Sound is a mechanical wave: it travels by vibrating the particles of a medium such as air, water or metal, so in a vacuum there is nothing to carry the vibration. Light is electromagnetic and does travel through a vacuum — confusing the two kinds of wave is a common error.',
        'Explain', 'AO3'),
      mcq('WASSCE-ISC-WAV', 'hard', 'A light ray strikes a plane mirror at an angle of incidence of 35°. What is the angle between the incident ray and the reflected ray?',
        '70°', ['35°', '55°', '90°'],
        'By the law of reflection the angle of reflection equals the angle of incidence, so both are 35° measured from the normal. The angle between the two rays is 35° + 35° = 70°. (55° is the angle between a ray and the mirror surface — measuring from the surface instead of the normal is the common slip.)',
        'Calculate', 'AO3'),
      calc('WASSCE-ISC-WAV', 'medium', 'A wave on water has a frequency of 50 Hz and a wavelength of 4 m. Calculate the speed of the wave.',
        '200 m/s',
        'Wave speed = frequency × wavelength: v = fλ = 50 Hz × 4 m = 200 m/s. Answer: the wave travels at 200 m/s.'),
      st('WASSCE-ISC-WAV', 'Light and sound are both forms of wave motion.', [
        part('a', 'State two differences between light waves and sound waves.', 2,
          'Any two of: light travels through a vacuum but sound cannot; light travels much faster than sound (about 3 × 10⁸ m/s versus about 340 m/s in air); light is a transverse electromagnetic wave while sound is a longitudinal mechanical wave.'),
        part('b', 'A sound wave travels 1,700 m through air in 5 s. Calculate the speed of sound in air.', 2,
          'Speed = distance ÷ time = 1,700 m ÷ 5 s = 340 m/s.'),
      ]),
    ],
  },
  {
    key: 'acids',
    topicId: 'topic_wassce_intsci_acids',
    code: 'WASSCE-ISC-ACD',
    title: 'Acids, Bases and Salts',
    objective: 'Use indicators and neutralisation reactions to relate acids, bases and salts to everyday life.',
    questions: [
      st('WASSCE-ISC-ACD', 'A student tests lemon juice and a dilute sodium hydroxide solution in the laboratory.', [
        part('a', 'State the colour change observed when blue litmus paper is dipped into the lemon juice.', 1,
          'The blue litmus paper turns red, showing that lemon juice is acidic.'),
        part('b', 'Name the salt formed when hydrochloric acid reacts completely with sodium hydroxide, and name the other product of the reaction.', 2,
          'Sodium chloride (common salt) and water: HCl + NaOH → NaCl + H₂O.'),
        part('c', 'State one everyday application of neutralisation.', 1,
          'Any one of: treating acid indigestion with an antacid; adding lime to acidic soil; using toothpaste to neutralise acid produced on teeth.'),
      ]),
    ],
  },
  {
    key: 'eco',
    topicId: 'topic_wassce_p2_sci_eco',
    code: 'WASSCE-ISC-ECO',
    title: 'Ecosystems',
    objective: 'Estimate population sizes from quadrat samples and interpret energy flow in ecosystems.',
    questions: [
      calc('WASSCE-ISC-ECO', 'medium', 'In an ecological survey, a 1 m² quadrat thrown at random on a school field contained an average of 12 grass plants per throw. Estimate the total number of grass plants in the 500 m² field.',
        '6,000 plants',
        'Estimated density = 12 plants per m². Total population = density × total area = 12 × 500 = 6,000. Answer: the field contains about 6,000 grass plants.'),
    ],
  },
  {
    key: 'mat',
    topicId: 'topic_wassce_p2_sci_mat',
    code: 'WASSCE-ISC-MAT',
    title: 'Matter and mixtures',
    objective: 'Calculate the composition of solutions and justify separation techniques for common mixtures.',
    questions: [
      calc('WASSCE-ISC-MAT', 'medium', 'A student dissolves 25 g of salt in 100 g of water. Calculate the percentage by mass of salt in the resulting solution.',
        '20%',
        'Total mass of solution = 25 g + 100 g = 125 g. Percentage by mass of salt = (25 ÷ 125) × 100 = 20%. Answer: the solution is 20% salt by mass. (Using 25/100 = 25% wrongly divides by the mass of water instead of the mass of the whole solution.)'),
    ],
  },
  {
    key: 'bio',
    topicId: 'topic_wassce_p2_sci_bio',
    code: 'WASSCE-ISC-BIO',
    title: 'Human digestion',
    objective: 'Relate the products of digestion to the energy the body obtains from food.',
    questions: [
      calc('WASSCE-ISC-BIO', 'medium', 'A serving of boiled yam contains 40 g of carbohydrate. If 1 g of carbohydrate releases 17 kJ of energy when fully digested, calculate the energy the body obtains from the serving.',
        '680 kJ',
        'Energy = mass of carbohydrate × energy released per gram = 40 g × 17 kJ/g = 680 kJ. Answer: the body obtains 680 kJ of energy from the serving.'),
    ],
  },
  {
    key: 'hlt',
    topicId: 'topic_wassce_p2_sci_hlt',
    code: 'WASSCE-ISC-HLT',
    title: 'Disease and health',
    objective: 'Quantify the spread of communicable diseases and evaluate control measures.',
    questions: [
      calc('WASSCE-ISC-HLT', 'medium', 'During a cholera outbreak in a village of 2,000 people, 150 people were infected. Calculate the percentage of the population that was infected.',
        '7.5%',
        'Percentage infected = (number infected ÷ total population) × 100 = (150 ÷ 2,000) × 100 = 0.075 × 100 = 7.5%. Answer: 7.5% of the population was infected.'),
    ],
  },
];

// Prod-canonical topic rows for subj_wassce_int_science, verified read-only
// against brilla-db on 2026-09-09. The intsci rows are seeded by prod-patch 096
// and the p2 rows by migration 365, so every row exists on prod and on the
// fresh baseline; the foundation migration re-inserts them with INSERT OR
// IGNORE using id-derived slugs so scratch baselines satisfy the question
// FK/trigger checks without UNIQUE(subject_id, slug) collisions.
const canonicalTopicRows = [
  // [id, name, description, displayOrder]
  ['topic_wassce_intsci_agric', 'Agriculture and Ecosystems', 'Soil, crop production, ecosystems and nutrient cycles', 8],
  ['topic_wassce_intsci_health', 'Environmental Health', 'Water and sanitation, diseases, pollution and conservation', 9],
  ['topic_wassce_intsci_cells', 'Cells and Living Things', 'Cell structure, classification and diversity of living organisms', 1],
  ['topic_wassce_intsci_body', 'Human Body Systems', 'Digestive, circulatory, respiratory, nervous and excretory systems', 2],
  ['topic_wassce_intsci_reproduction', 'Reproduction and Heredity', 'Reproduction in plants and animals, growth and basic genetics', 3],
  ['topic_wassce_intsci_matter', 'Matter and Materials', 'States of matter, elements, mixtures, metals and non-metals', 4],
  ['topic_wassce_intsci_energy', 'Energy and Electricity', 'Forms and sources of energy, simple circuits and magnetism', 6],
  ['topic_wassce_intsci_waves', 'Waves, Light and Sound', 'Properties of waves, reflection, refraction and sound', 7],
  ['topic_wassce_intsci_acids', 'Acids, Bases and Salts', 'Properties, indicators, neutralisation and everyday applications', 5],
  ['topic_wassce_p2_sci_eco', 'Ecosystems', 'Describe ecosystem components and construct food chains that show energy flow between organisms.', 1],
  ['topic_wassce_p2_sci_mat', 'Matter and mixtures', 'Select and justify physical separation techniques for the components of common mixtures.', 2],
  ['topic_wassce_p2_sci_bio', 'Human digestion', 'Explain the stages of human digestion, naming the enzymes and organs responsible at each stage.', 4],
  ['topic_wassce_p2_sci_hlt', 'Disease and health', 'Explain the transmission, symptoms and prevention of common communicable diseases in Ghana.', 6],
];

for (const topic of topics) {
  const row = canonicalTopicRows.find(([topicId]) => topicId === topic.topicId);
  if (!row) throw new Error(`${topic.key}: topic id ${topic.topicId} is not a prod-verified canonical topic`);
  for (const question of topic.questions) {
    if (question.topicCode !== topic.code) throw new Error(`${topic.key}: question uses undeclared topic code ${question.topicCode}`);
  }
}

// --- Batch assembly ----------------------------------------------------------
const officialAttributionPattern = /\b(?:official\s+(?:waec|west african examinations council)|(?:waec|west african examinations council)[ -](?:approved|endorsed|authored|issued|certified))\b/i;
const nonOfficialDisclaimerPattern = /\b(?:not|non[- ]?)\s+official\s+(?:waec|west african examinations council)\b/i;
const nonOfficialDisclaimerGlobalPattern = /\b(?:not|non[- ]?)\s+official\s+(?:waec|west african examinations council)\b/gi;
function assertNoFalseOfficialClaim(value, field) {
  const withoutDisclaimer = String(value ?? '').replace(nonOfficialDisclaimerGlobalPattern, '');
  if (officialAttributionPattern.test(withoutDisclaimer)) throw new Error(`${field} contains a false official-exam-board claim`);
}

const topicByCode = new Map(topics.map((topic) => [topic.code, topic]));
const topicSlug = (topic) => topic.topicId.replace(/^topic_wassce_(p2_sci|intsci)_/, '');

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
      : 'This option reflects a common misconception; the worked explanation shows why it does not apply here.',
  }));
  return {
    id: `q_wisc_${topicSlug(topic)}_b003_${String(index + 1).padStart(3, '0')}`,
    original: true,
    topicCode: question.topicCode,
    type: 'multiple_choice',
    prompt: question.prompt,
    options,
    correctAnswer: labels[correctIndex],
    workedSolution: `${question.solution} Therefore the correct answer is ${labels[correctIndex]}: ${question.correct}.`,
    difficulty: question.difficulty,
    marks: 1,
    points: 3,
    timeLimit: 45,
    commandWord: question.commandWord,
    assessmentObjective: question.assessmentObjective,
    provenance: [naccaSource],
  };
}

function buildCalculation(topic, question, index) {
  return {
    id: `q_wisc_${topicSlug(topic)}_b003_${String(index + 1).padStart(3, '0')}`,
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
    provenance: [naccaSource],
  };
}

function structuredAnswer(question) {
  return question.parts.map((entry) => `(${entry.label}) ${entry.correctAnswer}`).join(' ');
}

function buildStructured(topic, question, index) {
  const marks = question.parts.reduce((total, entry) => total + entry.marks, 0);
  return {
    id: `q_wisc_${topicSlug(topic)}_b003_${String(index + 1).padStart(3, '0')}`,
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
    specificationCode: 'BRILLA-WASSCE-ISC-S3-001',
    sources: [naccaSource],
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

const expectedTopicCounts = {
  'WASSCE-ISC-AGRIC': 10,
  'WASSCE-ISC-HLTH': 7,
  'WASSCE-ISC-CELL': 6,
  'WASSCE-ISC-BODY': 4,
  'WASSCE-ISC-REP': 2,
  'WASSCE-ISC-MTR': 3,
  'WASSCE-ISC-ENGY': 4,
  'WASSCE-ISC-WAV': 5,
  'WASSCE-ISC-ACD': 1,
  'WASSCE-ISC-ECO': 1,
  'WASSCE-ISC-MAT': 1,
  'WASSCE-ISC-BIO': 1,
  'WASSCE-ISC-HLT': 1,
};
const expectedDifficultyCounts = { easy: 4, medium: 28, hard: 14 };

function inHouseValidation(errors) {
  if (batch.review.automatedChecksAt !== generatedAt) errors.push('review.automatedChecksAt mismatch');
  if (batch.release.channel !== 'beta') errors.push('release.channel must be beta');
  if (typeof batch.release.contentLabel !== 'string' || batch.release.contentLabel.trim().length < 40) errors.push('release.contentLabel too short');
  if (!nonOfficialDisclaimerPattern.test(batch.release.contentLabel)) errors.push('release.contentLabel must explicitly state the content is not official WAEC material');
  if (batch.release.officialExamBoardContent !== false) errors.push('release.officialExamBoardContent must be false');
  if (batch.release.feedbackEnabled !== true) errors.push('release.feedbackEnabled must be true');
  if (!/feedback channel/i.test(batch.release.contentLabel)) errors.push('release.contentLabel must mention the feedback channel');
  assertNoFalseOfficialClaim(batch.release.contentLabel, 'release.contentLabel');

  const letterCounts = { A: 0, B: 0, C: 0, D: 0 };
  const typeCounts = { multiple_choice: 0, calculation: 0, structured: 0 };
  const difficultyCounts = { easy: 0, medium: 0, hard: 0 };
  const topicCounts = new Map();
  for (const question of batch.subjects[0].questions) {
    typeCounts[question.type] += 1;
    difficultyCounts[question.difficulty] += 1;
    topicCounts.set(question.topicCode, (topicCounts.get(question.topicCode) ?? 0) + 1);
    if (!Array.isArray(question.provenance) || question.provenance[0]?.use !== 'curriculum_blueprint_only') errors.push(`${question.id}: per-item provenance missing`);
    if (question.workedSolution.length < 80) errors.push(`${question.id}: worked solution under 80 characters`);
    assertNoFalseOfficialClaim(question.prompt, `${question.id}.prompt`);
    assertNoFalseOfficialClaim(question.workedSolution, `${question.id}.workedSolution`);
    if (question.type === 'multiple_choice') {
      letterCounts[question.correctAnswer] += 1;
      if (question.options?.length !== 4) errors.push(`${question.id}: MCQ needs exactly 4 options`);
      if (question.marks !== 1 || question.points !== 3 || question.timeLimit !== 45) errors.push(`${question.id}: MCQ scoring fields wrong`);
      for (const option of question.options ?? []) assertNoFalseOfficialClaim(option.text, `${question.id}.options`);
    } else if (question.type === 'calculation') {
      if (question.options != null) errors.push(`${question.id}: calculation must not have options`);
      if (typeof question.correctAnswer !== 'string' || !question.correctAnswer.length) errors.push(`${question.id}: calculation needs an answer`);
      if (question.marks !== 2 || question.points !== 4 || question.timeLimit !== 120) errors.push(`${question.id}: calculation scoring fields wrong`);
      if (!/[=]|\d/.test(question.workedSolution)) errors.push(`${question.id}: calculation needs a worked numerical solution`);
    } else if (question.type === 'structured') {
      const sum = question.parts.reduce((total, entry) => total + entry.marks, 0);
      if (sum !== question.marks) errors.push(`${question.id}: part marks (${sum}) must sum to marks (${question.marks})`);
      if (!/\bnot\s+official\s+waec\b/i.test(question.contentLabel)) errors.push(`${question.id}: structured contentLabel must disclaim official WAEC status`);
      for (const entry of question.parts) assertNoFalseOfficialClaim(entry.text, `${question.id} part ${entry.label}`);
    } else {
      errors.push(`${question.id}: unexpected type ${question.type}`);
    }
  }
  if (typeCounts.multiple_choice !== 25) errors.push(`expected 25 MCQs, found ${typeCounts.multiple_choice}`);
  if (typeCounts.calculation !== 12) errors.push(`expected 12 calculations, found ${typeCounts.calculation}`);
  if (typeCounts.structured !== 9) errors.push(`expected 9 structured questions, found ${typeCounts.structured}`);
  for (const [code, expected] of Object.entries(expectedTopicCounts)) {
    if (topicCounts.get(code) !== expected) errors.push(`${code}: expected ${expected} questions, found ${topicCounts.get(code) ?? 0}`);
  }
  for (const [difficulty, expected] of Object.entries(expectedDifficultyCounts)) {
    if (difficultyCounts[difficulty] !== expected) errors.push(`expected ${expected} ${difficulty} questions, found ${difficultyCounts[difficulty]}`);
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
    topic_id: topicByCode.get(question.topicCode).topicId,
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
    exam_board_id: null,
  };
}

const partId = (question, entry) => `sqp_${question.id}_${entry.label}`;

// Each migration stages its rows once in scratch tables (_migration_N_expected*)
// and both inserts and fail-closed checks read from them, keeping every file
// under the remote D1 query limit even with long worked solutions. The batch is
// split into sequential part files in question order.
const MAX_QUESTIONS_PER_MIGRATION = 6;
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

let migrationNumber = 583;
{
  const name = `${migrationNumber}_wassce_int_science_sprint3_foundation.sql`;
  const allTopicIds = canonicalTopicRows.map(([id]) => id);
  const lines = [
    `-- ${migrationNumber}: Foundation guard for WASSCE Integrated Science content sprint 3 (batch ${batchId}).`,
    '-- Original BrillaPrep practice content; not official WAEC examination material.',
    '-- Re-asserts the prod-canonical topic rows (from prod-patch 096 and migration 365) with',
    '-- INSERT OR IGNORE and id-derived slugs so fresh baselines and prod both satisfy the',
    '-- question FK/trigger checks without UNIQUE(subject_id, slug) collisions.',
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
    ...canonicalTopicRows.map(([id, topicName, description, displayOrder]) =>
      `INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES (${sql(id)}, ${sql(subjectId)}, NULL, ${sql(topicName)}, ${sql(id.slice(6).replaceAll('_', '-'))}, ${sql(description)}, NULL, NULL, ${displayOrder}, '2026-08-04T00:00:00.000Z');`),
    `CREATE TABLE IF NOT EXISTS _migration_${migrationNumber}_guard (valid INTEGER NOT NULL CHECK (valid = 1));`,
    `DELETE FROM _migration_${migrationNumber}_guard;`,
    `INSERT INTO _migration_${migrationNumber}_guard(valid) SELECT CASE WHEN EXISTS (SELECT 1 FROM exam_types WHERE id = '${examTypeId}') AND EXISTS (SELECT 1 FROM subjects WHERE id = ${sql(subjectId)} AND exam_type_id = '${examTypeId}') AND (SELECT COUNT(*) FROM topics t JOIN subjects s ON s.id = t.subject_id WHERE t.id IN (${allTopicIds.map(sql).join(', ')}) AND s.id = ${sql(subjectId)} AND s.exam_type_id = '${examTypeId}') = ${allTopicIds.length} THEN 1 ELSE 0 END;`,
    `DROP TABLE _migration_${migrationNumber}_guard;`,
  ];
  await emitMigration(name, lines);
  migrationNumber += 1;
}

const allQuestions = batch.subjects[0].questions;
async function emitQuestionMigration(name, title, chunkQuestions) {
  const ids = chunkQuestions.map((question) => question.id);
  const expectedTable = `_migration_${migrationNumber}_expected`;
  const expectedPartsTable = `_migration_${migrationNumber}_expected_parts`;
  const guardTable = `_migration_${migrationNumber}_guard`;
  const structuredRows = chunkQuestions
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
    `-- ${migrationNumber}: Original BrillaPrep WASSCE Integrated Science ${title} practice questions (batch ${batchId}).`,
    '-- Curriculum-aligned practice content; not official WAEC examination material.',
    'PRAGMA foreign_keys = ON;',
    expectedTableDDL(expectedTable),
    `INSERT INTO ${expectedTable} (id, ${canonicalQuestionFields.join(', ')}) VALUES ${chunkQuestions.map((question) => {
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

const partCount = Math.ceil(allQuestions.length / MAX_QUESTIONS_PER_MIGRATION);
for (let part = 1; part <= partCount; part += 1) {
  const chunk = allQuestions.slice((part - 1) * MAX_QUESTIONS_PER_MIGRATION, part * MAX_QUESTIONS_PER_MIGRATION);
  const name = `${migrationNumber}_wassce_int_science_sprint3_part_${part}.sql`;
  await emitQuestionMigration(name, `sprint 3, part ${part} of ${partCount},`, chunk);
}

{
  const name = `${migrationNumber}_wassce_int_science_sprint3_final_guard.sql`;
  const guardTable = `_migration_${migrationNumber}_guard`;
  const allIds = allQuestions.map((question) => question.id);
  const mcqIds = allQuestions.filter((question) => question.type === 'multiple_choice').map((question) => question.id);
  const calcIds = allQuestions.filter((question) => question.type === 'calculation').map((question) => question.id);
  const structuredIds = allQuestions.filter((question) => question.type === 'structured').map((question) => question.id);
  const structuredPartTotal = allQuestions
    .filter((question) => question.type === 'structured')
    .reduce((total, question) => total + question.parts.length, 0);
  const lines = [
    `-- ${migrationNumber}: Final exact-set and relationship guard for WASSCE Integrated Science sprint 3 (batch ${batchId}).`,
    'PRAGMA foreign_keys = ON;',
    `CREATE TABLE IF NOT EXISTS ${guardTable} (valid INTEGER NOT NULL CHECK (valid = 1));`,
    `DELETE FROM ${guardTable};`,
    `INSERT INTO ${guardTable}(valid) SELECT CASE WHEN (SELECT COUNT(*) FROM questions q JOIN topics t ON t.id = q.topic_id JOIN question_content_releases r ON r.question_id = q.id WHERE q.id IN (${allIds.map(sql).join(', ')}) AND q.subject_id = '${subjectId}' AND q.subject_id = t.subject_id AND q.exam_type_id = '${examTypeId}' AND length(q.explanation) >= 80 AND r.batch_id = '${batchId}' AND r.quality_assurance = 'automated_beta' AND r.release_channel = 'beta' AND r.official_exam_board_content = 0 AND r.feedback_enabled = 1) = ${allIds.length} AND (SELECT COUNT(*) FROM questions q WHERE q.id IN (${mcqIds.map(sql).join(', ')}) AND q.question_type = 'multiple_choice' AND json_valid(q.options) AND json_array_length(q.options) = 4 AND q.correct_answer IN ('A','B','C','D')) = ${mcqIds.length} AND (SELECT COUNT(*) FROM questions q WHERE q.id IN (${calcIds.map(sql).join(', ')}) AND q.question_type = 'calculation' AND q.options IS NULL AND length(q.correct_answer) >= 1) = ${calcIds.length} AND (SELECT COUNT(*) FROM questions q WHERE q.id IN (${structuredIds.map(sql).join(', ')}) AND q.question_type = 'structured') = ${structuredIds.length} AND (SELECT COUNT(*) FROM structured_question_parts WHERE question_id IN (${allIds.map(sql).join(', ')})) = ${structuredPartTotal} AND (SELECT COUNT(*) FROM question_content_releases WHERE batch_id = '${batchId}') = ${allIds.length} AND (SELECT COUNT(*) FROM questions WHERE id IN (${allIds.map(sql).join(', ')}) AND difficulty = 'easy') = ${expectedDifficultyCounts.easy} AND (SELECT COUNT(*) FROM questions WHERE id IN (${allIds.map(sql).join(', ')}) AND difficulty = 'medium') = ${expectedDifficultyCounts.medium} AND (SELECT COUNT(*) FROM questions WHERE id IN (${allIds.map(sql).join(', ')}) AND difficulty = 'hard') = ${expectedDifficultyCounts.hard} THEN 1 ELSE 0 END;`,
    `DROP TABLE ${guardTable};`,
  ];
  await emitMigration(name, lines);
  migrationNumber += 1;
}

console.log(JSON.stringify({ validation: { valid: validation.valid, warnings: validation.warnings, metrics: validation.metrics }, outBatch, migrations: migrationPaths }, null, 2));
