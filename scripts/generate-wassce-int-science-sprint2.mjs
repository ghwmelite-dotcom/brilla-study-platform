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
const batchId = 'wassce-int-science-sprint2-001';
const subjectId = 'subj_wassce_int_science';
const examTypeId = 'exam_wassce';
const contentLabel = 'Original BrillaPrep curriculum-aligned WASSCE Integrated Science practice; not official WAEC examination material.';
const theoryContentLabel = 'Original BrillaPrep curriculum-aligned WASSCE Integrated Science practice content; not official WAEC examination material.';
const releaseSourceUrl = 'https://nacca.gov.gh/secondary-education-curriculum/';

const naccaSource = {
  publisher: 'National Council for Curriculum and Assessment (NaCCA), Ghana',
  title: 'Secondary Education Curriculum — Integrated Science',
  url: releaseSourceUrl,
  use: 'curriculum_blueprint_only',
};

const mcq = (topicCode, difficulty, prompt, correct, wrong, solution, commandWord = 'Identify', assessmentObjective = 'AO2') => ({ topicCode, type: 'multiple_choice', difficulty, prompt, correct, wrong, solution, commandWord, assessmentObjective });
const calc = (topicCode, difficulty, prompt, answer, solution, assessmentObjective = 'AO2') => ({ topicCode, type: 'calculation', difficulty, prompt, answer, solution, commandWord: 'Calculate', assessmentObjective });
const st = (topicCode, difficulty, prompt, parts, commandWord = 'Describe') => ({ topicCode, type: 'structured', difficulty, prompt, parts, commandWord, assessmentObjective: 'AO2' });
const part = (label, text, marks, correctAnswer) => ({ label, text, marks, correctAnswer });

// Sprint 2 focus (artifacts/content-coverage-latest.json, regenerated
// 2026-09-09 after sprint 1 landed): the p2 topics sprint 1 never touched
// (agr = Soil and crop production, wst = Waste management, env = Water and
// pollution, all at zero in every cell), the acids/bases calculation cell,
// and the remaining mcq_hard cells on sprint-1 topics (eco, mat, enr, bio,
// hlt each needed 2 hard MCQs).
const topics = [
  {
    key: 'agr',
    topicId: 'topic_wassce_p2_sci_agr',
    code: 'WASSCE-ISC-AGR',
    title: 'Soil and crop production',
    objective: 'Explain soil properties and apply crop-production practices used by Ghanaian farmers.',
    questions: [
      mcq('WASSCE-ISC-AGR', 'easy', 'Which mineral soil particles are the largest and feel gritty when rubbed between the fingers?',
        'Sand', ['Clay', 'Silt', 'Humus'],
        'Sand particles are the largest mineral particles in soil and feel gritty; silt feels smooth and floury, clay is the finest and becomes sticky when wet, and humus is decomposed organic matter rather than a mineral particle at all.'),
      mcq('WASSCE-ISC-AGR', 'easy', 'Which of the following crops is a legume commonly included in crop rotation in Ghana?',
        'Cowpea', ['Maize', 'Cassava', 'Plantain'],
        'Cowpea is a legume whose root nodules host Rhizobium bacteria that fix atmospheric nitrogen into the soil, so it restores fertility for the next crop; maize, cassava and plantain are not legumes and cannot fix nitrogen.'),
      mcq('WASSCE-ISC-AGR', 'easy', 'The dark, decomposed organic matter in topsoil that improves soil fertility is called',
        'humus', ['laterite', 'loam', 'gravel'],
        'Humus is the stable product of microbial decomposition of plant and animal remains; it darkens topsoil, improves water retention and slowly releases nutrients. Loam is a balanced soil texture, laterite is an iron-rich subsoil, and gravel is coarse rock fragments.'),
      mcq('WASSCE-ISC-AGR', 'easy', 'Which simple tool is most appropriate for weeding a small school garden?',
        'Hoe', ['Tractor', 'Combine harvester', 'Boom sprayer'],
        'A hoe is a simple hand tool suited to uprooting weeds on small plots; a tractor is used for large-scale land preparation, a combine harvester for harvesting grain, and a boom sprayer for applying agrochemicals, none of which suit a small garden.'),
      mcq('WASSCE-ISC-AGR', 'medium', 'On a fertilizer bag labelled NPK 15-15-15, the letters N, P and K stand for',
        'nitrogen, phosphorus and potassium', ['sodium, phosphorus and potassium', 'nitrogen, iron and calcium', 'potassium, nitrogen and phosphorus'],
        'NPK lists the three primary macronutrients in the fixed order nitrogen (promotes leafy growth), phosphorus (root and seed development) and potassium (disease resistance and water regulation); sodium, iron and calcium are not the primary nutrients named by the NPK grade.',
        'State'),
      mcq('WASSCE-ISC-AGR', 'medium', 'Why do Ghanaian farmers often grow groundnut or cowpea in rotation with maize?',
        'The legumes fix nitrogen that later benefits the maize crop', ['The legumes shade the maize from excessive sunlight', 'The legumes release chemicals that repel all maize pests', 'The legumes dry the soil so maize roots grow deeper'],
        'Legume root nodules contain Rhizobium bacteria which convert inert atmospheric nitrogen into nitrates that remain in the soil after harvest; the following maize crop absorbs this nitrogen, cutting fertilizer costs. The other claims are not the agronomic reason for rotating with legumes.'),
      mcq('WASSCE-ISC-AGR', 'medium', 'The gradual washing away of dissolved mineral nutrients from the topsoil by percolating rainwater is called',
        'leaching', ['erosion', 'mulching', 'capillarity'],
        'Leaching is the downward movement of soluble nutrients such as nitrates in percolating water, carrying them below the reach of crop roots. Erosion is the physical removal of topsoil particles, mulching is covering the soil surface, and capillarity is the upward movement of water.'),
      mcq('WASSCE-ISC-AGR', 'medium', 'Ploughing along the contour lines of a sloping field mainly helps to',
        'reduce soil erosion by slowing run-off water', ['increase the temperature of the topsoil', 'raise the pH of acidic soil', 'kill soil-borne pests before planting'],
        'Contour ridges act as small barriers across the slope; they slow surface run-off so rainwater soaks into the soil instead of rushing downhill and carrying the fertile topsoil away. Contour ploughing does not change soil temperature, pH or pest populations.'),
      mcq('WASSCE-ISC-AGR', 'hard', 'A soil test on a farm reads pH 4.8 and the crops grow poorly. Which treatment is most appropriate, and why?',
        'Apply agricultural lime such as calcium hydroxide to raise the soil pH', ['Apply ammonium sulfate fertilizer to supply more nitrogen', 'Water the field continuously to dilute the acidity', 'Add only fresh acidic compost to feed the crops'],
        'Acidic soils are corrected by liming: calcium hydroxide neutralises excess hydrogen ions and raises the pH toward the range of about 5.5 to 7 that most food crops prefer. Ammonium sulfate is acid-forming and would worsen the problem, and dilution by watering cannot remove the reserve acidity held on clay and humus particles.',
        'Apply', 'AO3'),
      mcq('WASSCE-ISC-AGR', 'hard', 'In a waterlogged clay soil, crop roots often die mainly because',
        'the air spaces fill with water, so roots cannot obtain oxygen for respiration', ['the standing water makes the soil too cold for enzymes', 'the excess water dissolves all the humus immediately', 'the roots absorb dangerously large amounts of nitrogen'],
        'Roots respire aerobically, taking oxygen from soil air spaces. When water fills those spaces, oxygen diffusion to the roots stops; the roots switch to anaerobic respiration, accumulate toxic products and die, so the shoot wilts even though water is abundant. Cold, instant humus loss and nitrogen overload are not the cause.',
        'Explain', 'AO3'),
      calc('WASSCE-ISC-AGR', 'medium', 'A school maize plot measures 40 m by 25 m. Maize is planted at a spacing of 1 m between rows and 0.5 m between plants within a row. Calculate the expected plant population on the plot.',
        '2 000 plants',
        'Area per plant = spacing between rows x spacing within a row = 1 m x 0.5 m = 0.5 square metres. Plot area = 40 m x 25 m = 1 000 square metres. Plant population = plot area / area per plant = 1 000 / 0.5 = 2 000 plants.'),
      calc('WASSCE-ISC-AGR', 'medium', 'A farmer applies one 50 kg bag of NPK 15-15-15 fertilizer to a field. Calculate the mass of nitrogen contained in the bag.',
        '7.5 kg',
        'The grade 15-15-15 means the fertilizer contains 15% nitrogen by mass. Mass of nitrogen = (15 / 100) x 50 kg = 0.15 x 50 = 7.5 kg. The same bag also contains 7.5 kg of P2O5 equivalent and 7.5 kg of K2O equivalent.'),
    ],
  },
  {
    key: 'wst',
    topicId: 'topic_wassce_p2_sci_wst',
    code: 'WASSCE-ISC-WST',
    title: 'Waste management',
    objective: 'Classify waste and evaluate safe methods of reducing, reusing, recycling and disposing of refuse.',
    questions: [
      mcq('WASSCE-ISC-WST', 'easy', 'Which of the following waste items is biodegradable?',
        'Banana peel', ['Plastic sachet', 'Glass bottle', 'Aluminium can'],
        'A banana peel is broken down by micro-organisms within weeks, so it is biodegradable; plastic sachets, glass bottles and aluminium cans resist microbial attack and persist in the environment for decades or even centuries.'),
      mcq('WASSCE-ISC-WST', 'easy', 'The three Rs of waste management are',
        'Reduce, Reuse and Recycle', ['Read, Repair and Recycle', 'Reduce, Remove and Rot', 'Reuse, Repackage and Release'],
        'Waste management hierarchy starts with reducing what we consume, then reusing items where possible, and finally recycling materials into new products; only what remains after the three Rs should be disposed of in a controlled way.'),
      mcq('WASSCE-ISC-WST', 'easy', 'Converting kitchen and garden waste into manure through controlled decomposition is called',
        'composting', ['incineration', 'landfilling', 'leaching'],
        'Composting is the managed aerobic decomposition of organic waste by micro-organisms into a humus-like material used as manure; incineration burns waste, landfilling buries it, and leaching is the washing out of dissolved substances.'),
      mcq('WASSCE-ISC-WST', 'easy', 'The safest first step in managing household refuse is to',
        'separate biodegradable from non-biodegradable waste', ['burn all the waste in the backyard', 'dump the waste into the nearest gutter', 'bury all plastics in the garden'],
        'Separating waste at source keeps recyclables clean and makes organic matter available for composting. Open burning of plastics releases toxic fumes, dumping in gutters blocks drains and causes floods and disease, and buried plastics do not decompose.'),
      mcq('WASSCE-ISC-WST', 'medium', 'Why is the open burning of plastic waste strongly discouraged?',
        'It releases toxic fumes such as dioxins that damage health', ['It releases extra oxygen into the atmosphere', 'It makes the plastics biodegradable', 'It sterilises the soil for farming'],
        'Incomplete combustion of plastics emits carbon monoxide, dioxins and fine particulates linked to respiratory disease and cancer; the fumes settle on soil and crops. Burning does not make plastics biodegradable, nor does it sterilise or improve soil.'),
      mcq('WASSCE-ISC-WST', 'medium', 'The main difference between a sanitary landfill and an open refuse dump is that a sanitary landfill',
        'is lined and the waste is covered with soil each day to control leachate and pests', ['is always sited in the centre of town for easy access', 'burns all incoming waste on arrival', 'accepts only liquid waste from factories'],
        'An engineered sanitary landfill uses an impermeable liner to stop leachate reaching groundwater and compacts and covers the waste with soil daily to control flies, rodents and odours; an open dump leaves waste exposed to scavengers, wind and rain.'),
      mcq('WASSCE-ISC-WST', 'medium', 'Which of the following is classified as hazardous household waste?',
        'Used dry-cell batteries', ['Eggshells', 'Paper wrappers', 'Grass cuttings'],
        'Used dry-cell batteries contain heavy metals such as lead, cadmium and mercury which leach into soil and water and poison organisms, so they need special collection; eggshells, paper and grass cuttings are ordinary biodegradable or recyclable waste.'),
      mcq('WASSCE-ISC-WST', 'medium', 'Recycling aluminium cans conserves resources mainly because',
        'remelting scrap aluminium uses far less energy than extracting new aluminium from bauxite', ['aluminium cans cannot rust in the environment', 'recycled aluminium is magnetic and easy to sort', 'new aluminium can no longer be mined in Ghana'],
        'Producing aluminium from bauxite is extremely energy-intensive; remelting scrap uses only a small fraction of that energy and also conserves the ore. Rusting and magnetism are irrelevant here, and bauxite mining continues, so recycling is an energy and resource saving, not a necessity.'),
      mcq('WASSCE-ISC-WST', 'hard', 'The greatest long-term environmental danger at informal e-waste burning sites such as Agbogbloshie is that',
        'heavy metals such as lead and mercury leach into soil and groundwater and enter food chains', ['the smoke produces an unpleasant smell over the city', 'the noise from the site disturbs nearby residents', 'the land becomes unavailable for growing vegetables'],
        'Burning cables and circuit boards releases lead, mercury and cadmium; these metals persist for decades, leach into soil and groundwater, and bioaccumulate in crops, fish and people, causing neurological and kidney damage long after burning stops. Smell, noise and land loss are real but short-term local nuisances by comparison.',
        'Evaluate', 'AO3'),
      mcq('WASSCE-ISC-WST', 'hard', 'Methane produced by decomposing refuse in landfills is a concern mainly because it',
        'is a potent greenhouse gas and can form explosive mixtures in enclosed spaces', ['gives refuse its characteristic sweet smell', 'reacts with rainwater to form acid rain directly', 'attracts mosquitoes that spread malaria'],
        'Anaerobic decomposition of organic waste releases methane, which traps far more heat per molecule than carbon dioxide and can accumulate to explosive concentrations in buildings or pipes near landfills; modern sites therefore vent or capture it. It is odourless, does not form acid rain directly and does not attract mosquitoes.',
        'Explain', 'AO3'),
      calc('WASSCE-ISC-WST', 'medium', 'A community of 400 households generates an average of 2.5 kg of refuse per household per day. Calculate the mass of refuse generated in the community per week, and the number of trips a 5-tonne truck must make per week to remove it. (1 tonne = 1 000 kg)',
        '7 000 kg per week; 2 trips',
        'Daily refuse = 400 x 2.5 kg = 1 000 kg. Weekly refuse = 1 000 kg x 7 = 7 000 kg = 7 tonnes. Number of trips = 7 / 5 = 1.4, so the truck must make 2 trips per week (a fraction of a trip still requires a full journey).'),
      calc('WASSCE-ISC-WST', 'medium', 'A school collects 250 kg of waste every week. If 60% of the waste is organic material suitable for composting, calculate the mass of organic waste available for the school compost heap each week.',
        '150 kg',
        'Organic fraction = 60% of 250 kg = (60 / 100) x 250 = 0.6 x 250 = 150 kg. So 150 kg of organic waste goes to the compost heap weekly, leaving 100 kg of non-organic waste for recycling or disposal.'),
      st('WASSCE-ISC-WST', 'medium', 'A household in Accra produces mixed refuse every day. Describe how the household can manage its waste safely from generation to final disposal.', [
        part('a', 'State two ways the household should separate its waste at source.', 2,
          'Separate biodegradable waste such as food scraps from non-biodegradable waste such as plastics, glass and metals into different covered bins; keep hazardous items such as used batteries and broken bulbs apart for special collection.'),
        part('b', 'Describe one beneficial way of disposing of the organic fraction of the waste.', 2,
          'Compost it: place the organic waste in a pit or bin, keep it moist and turn it regularly so that micro-organisms decompose it aerobically into compost manure that can be used on a garden or farm.'),
        part('c', 'State two dangers of dumping refuse into gutters instead of using a waste container.', 2,
          'Refuse blocks the gutters so rainwater cannot flow, causing flooding; the dump also breeds mosquitoes, flies and rats and can contaminate water, spreading diseases such as malaria and cholera.'),
      ]),
    ],
  },
  {
    key: 'env',
    topicId: 'topic_wassce_p2_sci_env',
    code: 'WASSCE-ISC-ENV',
    title: 'Water and pollution',
    objective: 'Describe water treatment and purification and explain the causes and effects of water pollution.',
    questions: [
      mcq('WASSCE-ISC-ENV', 'easy', 'Which of the following is the safest source of drinking water for a community?',
        'Treated pipe-borne water', ['Stream water', 'Pond water', 'Flood water'],
        'Treated pipe-borne water has been filtered and disinfected before distribution, so it is the safest source; streams, ponds and flood water are exposed to faecal contamination, parasites and chemical pollutants and must be treated before drinking.'),
      mcq('WASSCE-ISC-ENV', 'easy', 'Boiling drinking water for several minutes makes it safe mainly by',
        'killing germs as heat destroys their enzymes and proteins', ['adding chlorine to the water', 'removing all dissolved minerals', 'increasing the oxygen content of the water'],
        'Boiling denatures the enzymes and structural proteins of bacteria, viruses and parasite cysts, killing them without any chemical additive; it does not add chlorine, remove dissolved minerals or meaningfully change the oxygen content.'),
      mcq('WASSCE-ISC-ENV', 'easy', 'Which of the following is a common pollutant of river water in Ghana?',
        'Untreated sewage', ['Clean rainwater', 'Distilled water', 'Spring water from a protected source'],
        'Untreated sewage introduces disease-causing organisms and excess nutrients into rivers; clean rainwater, distilled water and protected spring water contain few impurities and are not pollutants.'),
      mcq('WASSCE-ISC-ENV', 'easy', 'The process of adding chlorine to kill bacteria during water treatment is called',
        'chlorination', ['filtration', 'sedimentation', 'aeration'],
        'Chlorination is the disinfection stage of water treatment in which a controlled dose of chlorine kills remaining bacteria and viruses; filtration removes suspended solids, sedimentation lets heavy particles settle, and aeration adds air to improve taste.'),
      mcq('WASSCE-ISC-ENV', 'medium', 'Fertilizer run-off from farms enters a lake and causes rapid growth of algae. This process is known as',
        'eutrophication', ['evaporation', 'sedimentation', 'neutralisation'],
        'Nitrates and phosphates from fertilizer are plant nutrients that are normally scarce in natural waters; their sudden input feeds an algal bloom, a process called eutrophication. Evaporation, sedimentation and neutralisation are unrelated physical or chemical processes.'),
      mcq('WASSCE-ISC-ENV', 'medium', 'Which sequence shows the stages of municipal water treatment in the correct order?',
        'Screening, coagulation and sedimentation, filtration, chlorination', ['Chlorination, filtration, sedimentation, screening', 'Filtration, screening, chlorination, sedimentation', 'Sedimentation, chlorination, screening, filtration'],
        'Raw water is first screened to remove large debris, then alum is added so fine particles clump and settle (coagulation and sedimentation), then sand filters remove remaining solids, and finally chlorine disinfects the clear water before distribution.'),
      mcq('WASSCE-ISC-ENV', 'medium', 'Cholera outbreaks in Ghanaian communities are most strongly linked to water that has been polluted by',
        'faecal matter from poor sanitation and open defecation', ['dissolved oxygen from fast-flowing streams', 'harmless clay particles after heavy rain', 'chlorine added during treatment'],
        'Cholera is caused by Vibrio cholerae, which spreads through water contaminated with human faeces; prevention relies on proper latrines, handwashing and boiling or chlorinating drinking water. Dissolved oxygen, clay turbidity and correct chlorination do not transmit cholera.'),
      mcq('WASSCE-ISC-ENV', 'medium', 'Turbidity in a water sample refers to its',
        'cloudiness caused by suspended particles', ['temperature measured in the shade', 'hardness caused by dissolved salts', 'acidity measured with litmus paper'],
        'Turbidity is the scattering of light by suspended clay, silt and organic particles, which makes water look cloudy; high turbidity can shield microbes from disinfectants, so it is removed by sedimentation and filtration before chlorination.'),
      mcq('WASSCE-ISC-ENV', 'hard', 'After an algal bloom dies in a polluted lake, fish often die in large numbers mainly because',
        'bacteria decomposing the dead algae use up the dissolved oxygen, so the fish suffocate', ['the dead algae release chlorine into the water', 'the algae physically trap the fish in thick mats', 'the water becomes too clear for fish to hide'],
        'Dead algae are decomposed by aerobic bacteria whose multiplication consumes dissolved oxygen faster than it is replaced, so the water becomes hypoxic and fish die of suffocation. Algae do not release chlorine, and physical entrapment or water clarity are not the cause of the mass deaths.',
        'Explain', 'AO3'),
      mcq('WASSCE-ISC-ENV', 'hard', 'Hard water does not lather easily with soap because it contains dissolved',
        'calcium and magnesium ions', ['sodium chloride crystals', 'chlorine gas', 'nitrate fertilizers only'],
        'Dissolved calcium and magnesium ions react with soap to form an insoluble scum instead of lather, wasting soap; boiling removes temporary hardness and washing soda or ion exchange removes permanent hardness. Sodium chloride, chlorine and nitrates do not cause hardness.',
        'Explain', 'AO3'),
      calc('WASSCE-ISC-ENV', 'medium', 'A water treatment plant doses water with 0.5 mg of chlorine per litre. Calculate the mass of chlorine, in grams, needed to treat 20 000 litres of water.',
        '10 g',
        'Mass of chlorine = dose x volume = 0.5 mg per litre x 20 000 litres = 10 000 mg. Converting to grams: 10 000 mg / 1 000 = 10 g of chlorine.'),
      calc('WASSCE-ISC-ENV', 'medium', 'A household uses 150 litres of water per day. Calculate the total volume of water the household uses in June (30 days), and the cost if the water company charges GHS 0.02 per litre.',
        '4 500 litres; GHS 90',
        'Volume for June = 150 litres x 30 days = 4 500 litres. Cost = 4 500 litres x GHS 0.02 per litre = GHS 90.'),
      st('WASSCE-ISC-ENV', 'medium', 'A family in a rural community collects its drinking water from a river. Describe how the family can make the water safe for drinking and keep it safe during storage.', [
        part('a', 'Describe how the family can remove the suspended particles from the river water.', 2,
          'Allow the water to stand so the heavy particles settle, decant the clearer water, then filter it through a clean cloth or a sand filter to remove the remaining suspended particles.'),
        part('b', 'Describe one method the family can use to kill the germs in the filtered water.', 2,
          'Boil the filtered water for several minutes so that the heat kills bacteria, viruses and parasite cysts; alternatively add the correct dose of chlorine tablets and wait the recommended time before drinking.'),
        part('c', 'State two precautions the family should take when storing the treated water.', 2,
          'Keep the water in a clean container with a tight cover, and draw it with a clean ladle or tap rather than dipping cups or hands into it; store the container off the ground and away from animals and chemicals.'),
      ]),
    ],
  },
  {
    key: 'acids',
    topicId: 'topic_wassce_intsci_acids',
    code: 'WASSCE-ISC-ACD',
    title: 'Acids, Bases and Salts',
    objective: 'Apply acid-base reactions and carry out simple mole and concentration calculations.',
    questions: [
      mcq('WASSCE-ISC-ACD', 'easy', 'Blue litmus paper dipped into dilute hydrochloric acid turns',
        'red', ['white', 'green', 'deeper blue'],
        'Acids turn blue litmus paper red, and hydrochloric acid is a strong acid, so the paper turns red at once; it does not bleach to white, turn green or remain blue, which is the colour litmus keeps in neutral or alkaline solutions.'),
      mcq('WASSCE-ISC-ACD', 'medium', 'When dilute hydrochloric acid reacts completely with sodium hydroxide solution, the products are',
        'sodium chloride and water', ['sodium chloride and hydrogen gas', 'hydrogen gas and oxygen gas', 'sodium metal and chlorine gas'],
        'An acid plus a base gives a salt and water: HCl + NaOH produce NaCl + H2O. This neutralisation does not release hydrogen or oxygen gases, and it certainly cannot produce free sodium metal or chlorine gas from aqueous solution.'),
      mcq('WASSCE-ISC-ACD', 'medium', 'Dilute hydrochloric acid is added to zinc granules. The gas evolved and its correct test are',
        'hydrogen, which gives a pop sound with a lighted splint', ['oxygen, which relights a glowing splint', 'carbon dioxide, which turns limewater milky', 'chlorine, which bleaches damp litmus paper'],
        'Zinc + hydrochloric acid give zinc chloride and hydrogen: Zn + 2HCl produce ZnCl2 + H2. Hydrogen burns with a pop at a lighted splint; the glowing-splint, limewater and bleaching tests belong to oxygen, carbon dioxide and chlorine respectively.'),
      mcq('WASSCE-ISC-ACD', 'medium', 'Which of the following is a weak acid commonly found in the kitchen?',
        'Ethanoic acid in vinegar', ['Hydrochloric acid', 'Sodium hydroxide', 'Sodium chloride'],
        'Vinegar is a dilute solution of ethanoic acid, which ionises only partially in water and is therefore a weak acid. Hydrochloric acid is a strong mineral acid, sodium hydroxide is a base, and sodium chloride is a neutral salt.'),
      mcq('WASSCE-ISC-ACD', 'hard', 'The difference between a strong acid and a concentrated acid is that',
        'strength describes the degree of ionisation while concentration describes the amount of acid per unit volume', ['the two terms always mean exactly the same thing', 'a strong acid is one that contains more water', 'a concentrated acid is always fully ionised'],
        'Strength is about how completely the acid ionises: hydrochloric acid is strong even when very dilute because it ionises fully. Concentration is about moles per unit volume: ethanoic acid can be highly concentrated yet weak because only a small fraction of its molecules ionise.',
        'Distinguish', 'AO3'),
      mcq('WASSCE-ISC-ACD', 'hard', 'Which of the following salts forms an acidic solution when dissolved in water?',
        'Ammonium chloride', ['Sodium chloride', 'Sodium carbonate', 'Potassium nitrate'],
        'Ammonium chloride is the salt of a weak base (ammonia) and a strong acid (hydrochloric acid); the ammonium ion hydrolyses in water to release hydroxonium ions, so the solution is acidic. Sodium chloride and potassium nitrate give neutral solutions, while sodium carbonate solution is alkaline.',
        'Apply', 'AO3'),
      calc('WASSCE-ISC-ACD', 'hard', 'In a titration, 25.0 cubic centimetres of 0.10 mol per cubic decimetre hydrochloric acid exactly neutralise 20.0 cubic centimetres of sodium hydroxide solution. Calculate the concentration of the sodium hydroxide solution in mol per cubic decimetre.',
        '0.125 mol per cubic decimetre',
        'Moles of HCl = concentration x volume = 0.10 x 25.0/1000 = 0.0025 mol. The equation HCl + NaOH produce NaCl + H2O shows a 1:1 mole ratio, so moles of NaOH = 0.0025 mol. Concentration of NaOH = moles / volume = 0.0025 / (20.0/1000) = 0.0025 / 0.020 = 0.125 mol per cubic decimetre.'),
      calc('WASSCE-ISC-ACD', 'medium', 'Calculate the mass of sodium hydroxide, NaOH, needed to prepare 500 cubic centimetres of a 0.20 mol per cubic decimetre solution. (Relative atomic masses: Na = 23, O = 16, H = 1)',
        '4.0 g',
        'Moles of NaOH = concentration x volume = 0.20 x 500/1000 = 0.20 x 0.5 = 0.10 mol. Molar mass of NaOH = 23 + 16 + 1 = 40 g per mol. Mass = moles x molar mass = 0.10 x 40 = 4.0 g.'),
    ],
  },
  {
    key: 'eco_hard',
    topicId: 'topic_wassce_p2_sci_eco',
    code: 'WASSCE-ISC-ECO',
    title: 'Ecosystems',
    objective: 'Analyse energy flow and nutrient cycling in ecosystems.',
    questions: [
      mcq('WASSCE-ISC-ECO', 'hard', 'In the food chain grass to grasscutter to hawk, only about 10% of the energy passes from one level to the next mainly because',
        'most of the energy is lost as heat in respiration and in undigested remains at each level', ['hawks refuse to eat weak grasscutters', 'grass uses up all the sunlight before animals can graze', 'energy increases as it moves up the food chain'],
        'At each trophic level organisms use most of their energy in respiration, movement and reproduction, and some energy is lost in faeces and unconsumed parts; only roughly 10% is stored as biomass that the next level can eat, which is why food chains rarely exceed four or five levels.',
        'Explain', 'AO3'),
      mcq('WASSCE-ISC-ECO', 'hard', 'Decomposers such as fungi and bacteria are essential to an ecosystem because they',
        'release nutrients from dead organisms back into the soil for producers to absorb', ['produce oxygen for animals by photosynthesis', 'control the population of hawks and other top predators', 'convert sunlight directly into chemical energy'],
        'Decomposers break down dead plants and animals and mineralise the organic matter, returning nitrates, phosphates and other ions to the soil where producers absorb them again; without decomposers, nutrients would stay locked in corpses and the nutrient cycle would halt. They neither photosynthesise nor control predators.',
        'Explain', 'AO3'),
    ],
  },
  {
    key: 'mat_hard',
    topicId: 'topic_wassce_p2_sci_mat',
    code: 'WASSCE-ISC-MAT',
    title: 'Matter and mixtures',
    objective: 'Select and justify separation techniques for mixtures.',
    questions: [
      mcq('WASSCE-ISC-MAT', 'hard', 'The best method for separating a mixture of ethanol (boiling point 78 degrees Celsius) and water is',
        'fractional distillation', ['paper filtration', 'evaporation to dryness', 'paper chromatography'],
        'Ethanol and water are miscible liquids with different but close boiling points, so a fractionating column is used to separate them cleanly as their vapours condense at different heights; filtration cannot separate dissolved or miscible components, evaporation to dryness loses both liquids, and chromatography suits small samples of coloured mixtures, not bulk liquids.',
        'Select', 'AO3'),
      mcq('WASSCE-ISC-MAT', 'hard', 'In paper chromatography, a component of a mixture moves furthest up the paper when it',
        'is most soluble in the solvent and least strongly adsorbed onto the paper', ['has the largest and heaviest molecules in the mixture', 'is the most abundant component of the mixture', 'has the deepest colour of all the components'],
        'Each component partitions between the moving solvent and the stationary paper: a substance that dissolves readily in the solvent and clings weakly to the paper travels furthest. Molecular size alone, abundance and colour depth do not determine the distance moved.',
        'Explain', 'AO3'),
    ],
  },
  {
    key: 'enr_hard',
    topicId: 'topic_wassce_p2_sci_enr',
    code: 'WASSCE-ISC-ENR',
    title: 'Electricity and energy',
    objective: 'Analyse circuits and electrical safety devices.',
    questions: [
      mcq('WASSCE-ISC-ENR', 'hard', 'Lamps in a house are wired in parallel rather than in series because in parallel',
        'each lamp receives the full mains voltage and can be switched on or off independently', ['the lamps share the current equally and so shine brighter', 'a burnt-out lamp makes all the other lamps brighter', 'the total resistance of the circuit becomes very large'],
        'In parallel each lamp is connected directly across the 240 V mains, so every lamp gets full voltage and its own switch controls only its branch; in series the voltage is divided between the lamps, they glow dimly, and one failed lamp breaks the whole circuit.',
        'Explain', 'AO3'),
      mcq('WASSCE-ISC-ENR', 'hard', 'A fuse protects an electrical circuit by',
        'melting to break the circuit when the current exceeds a safe value', ['increasing the voltage supplied to the appliances', 'storing charge for use during a power cut', 'converting alternating current into direct current'],
        'A fuse contains a thin wire with a low melting point; when the current exceeds the rated value, the heating effect of the current melts the wire and opens the circuit before the cables can overheat and start a fire. It neither boosts voltage, stores energy nor converts current type.',
        'Explain', 'AO3'),
    ],
  },
  {
    key: 'bio_hard',
    topicId: 'topic_wassce_p2_sci_bio',
    code: 'WASSCE-ISC-BIO',
    title: 'Human digestion',
    objective: 'Analyse the enzymes and adaptations of the human alimentary canal.',
    questions: [
      mcq('WASSCE-ISC-BIO', 'hard', 'The digestion of starch begins in the mouth because saliva contains the enzyme',
        'amylase', ['pepsin', 'lipase', 'bile'],
        'Salivary amylase (ptyalin) in saliva hydrolyses starch into maltose as food is chewed. Pepsin digests protein in the stomach, lipase digests fats further down the gut, and bile is not an enzyme at all but an emulsifier made by the liver.',
        'Explain', 'AO3'),
      mcq('WASSCE-ISC-BIO', 'hard', 'Most digested food is absorbed into the blood in the ileum because its inner surface',
        'bears numerous villi that give a very large surface area with a rich blood supply', ['secretes the strongest acid in the digestive system', 'stores food for the longest time before absorption', 'produces the greatest number of digestive enzymes'],
        'The ileum is folded and covered with millions of finger-like villi and microvilli, multiplying the surface area; each villus contains blood capillaries and a lacteal, so digested nutrients cross quickly into the circulation. Acid secretion belongs to the stomach, and storage time and enzyme output are not the reason for absorption.',
        'Explain', 'AO3'),
    ],
  },
  {
    key: 'hlt_hard',
    topicId: 'topic_wassce_p2_sci_hlt',
    code: 'WASSCE-ISC-HLT',
    title: 'Disease and health',
    objective: 'Distinguish pathogens from vectors and evaluate disease-control measures.',
    questions: [
      mcq('WASSCE-ISC-HLT', 'hard', 'In malaria, the pathogen and its vector are respectively',
        'Plasmodium and the female Anopheles mosquito', ['the Anopheles mosquito and Plasmodium', 'a virus and the housefly', 'a bacterium and the tsetse fly'],
        'Malaria is caused by Plasmodium, a protozoan parasite; the female Anopheles mosquito is only the vector that carries it between people when taking blood meals. Reversing the two confuses cause with carrier, and the housefly and tsetse fly transmit other diseases.',
        'Distinguish', 'AO3'),
      mcq('WASSCE-ISC-HLT', 'hard', 'Antibiotics do not cure the common cold mainly because',
        'colds are caused by viruses, and antibiotics act only against bacteria', ['cold viruses multiply too slowly for drugs to find them', 'antibiotics are always destroyed by stomach acid', 'colds are inherited and cannot be treated'],
        'Antibiotics attack bacterial structures such as cell walls and bacterial ribosomes; viruses have no such targets and replicate inside host cells using host machinery, so antibiotics are useless against colds. Taking them anyway encourages antibiotic-resistant bacteria, which is a serious public-health danger.',
        'Explain', 'AO3'),
    ],
  },
];

// Prod-canonical topic rows for subj_wassce_int_science, verified against the
// live production database on 2026-09-09. The intsci rows are seeded by
// prod-patch 096 and the p2 rows by migration 365, so every row exists on
// prod and on the fresh baseline; the foundation migration re-inserts them
// with INSERT OR IGNORE using id-derived slugs so fresh baselines satisfy the
// question FK/trigger checks without UNIQUE(subject_id, slug) collisions.
const canonicalTopicRows = [
  // [id, name, description, displayOrder]
  ['topic_wassce_p2_sci_agr', 'Soil and crop production', 'Describe soil properties and apply crop-production practices including rotation and fertilizer use.', 5],
  ['topic_wassce_p2_sci_wst', 'Waste management', 'Classify waste and apply safe reduction, reuse, recycling and disposal methods.', 7],
  ['topic_wassce_p2_sci_env', 'Water and pollution', 'Describe water treatment and purification and explain the causes and effects of pollution.', 8],
  ['topic_wassce_intsci_acids', 'Acids, Bases and Salts', 'Properties and reactions of acids and bases, indicators, neutralisation and salts', 5],
  ['topic_wassce_p2_sci_eco', 'Ecosystems', 'Describe ecosystem components and construct food chains that show energy flow between organisms.', 1],
  ['topic_wassce_p2_sci_mat', 'Matter and mixtures', 'Select and justify physical separation techniques for the components of common mixtures.', 2],
  ['topic_wassce_p2_sci_enr', 'Electricity and energy', 'Analyse simple series circuits, relating current, resistance and lamp brightness quantitatively.', 3],
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
const officialAttributionPattern = /\b(?:official\s+(?:waec|west african examinations council)|waec[ -](?:approved|endorsed|authored|issued|certified))\b/i;
const nonOfficialDisclaimerGlobalPattern = /\b(?:not|non[- ]?)\s+official\s+(?:waec|west african examinations council)\b/gi;
function assertNoFalseOfficialClaim(value, field) {
  const withoutDisclaimer = String(value).replace(nonOfficialDisclaimerGlobalPattern, '');
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
    id: `q_wisc_${topicSlug(topic)}_b002_${String(index + 1).padStart(3, '0')}`,
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
    id: `q_wisc_${topicSlug(topic)}_b002_${String(index + 1).padStart(3, '0')}`,
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
    id: `q_wisc_${topicSlug(topic)}_b002_${String(index + 1).padStart(3, '0')}`,
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
    specificationCode: 'BRILLA-WASSCE-ISC-S2-001',
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
  'WASSCE-ISC-AGR': 12,
  'WASSCE-ISC-WST': 13,
  'WASSCE-ISC-ENV': 13,
  'WASSCE-ISC-ACD': 8,
  'WASSCE-ISC-ECO': 2,
  'WASSCE-ISC-MAT': 2,
  'WASSCE-ISC-ENR': 2,
  'WASSCE-ISC-BIO': 2,
  'WASSCE-ISC-HLT': 2,
};

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
    if (question.workedSolution.length < 80) errors.push(`${question.id}: worked solution under 80 characters`);
    assertNoFalseOfficialClaim(question.prompt, `${question.id}.prompt`);
    if (question.type === 'multiple_choice') {
      letterCounts[question.correctAnswer] += 1;
      if (question.options?.length !== 4) errors.push(`${question.id}: MCQ needs exactly 4 options`);
      if (question.marks !== 1) errors.push(`${question.id}: MCQ marks must be 1`);
    } else if (question.type === 'calculation') {
      if (question.options != null) errors.push(`${question.id}: calculation must not have options`);
      if (typeof question.correctAnswer !== 'string' || !question.correctAnswer.length) errors.push(`${question.id}: calculation needs an answer`);
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
  if (typeCounts.multiple_choice !== 46) errors.push(`expected 46 MCQs, found ${typeCounts.multiple_choice}`);
  if (typeCounts.calculation !== 8) errors.push(`expected 8 calculations, found ${typeCounts.calculation}`);
  if (typeCounts.structured !== 2) errors.push(`expected 2 structured questions, found ${typeCounts.structured}`);
  for (const [code, expected] of Object.entries(expectedTopicCounts)) {
    if (topicCounts.get(code) !== expected) errors.push(`${code}: expected ${expected} questions, found ${topicCounts.get(code) ?? 0}`);
  }
  for (const [letter, count] of Object.entries(letterCounts)) {
    if (count < 9) errors.push(`correct-answer letter ${letter} appears only ${count} times (must vary)`);
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
// under the remote D1 query limit even with long worked solutions. Topic
// groups larger than MAX_QUESTIONS_PER_MIGRATION are split into part files.
const MAX_QUESTIONS_PER_MIGRATION = 8;
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

let migrationNumber = 457;
{
  const name = `${migrationNumber}_wassce_int_science_sprint2_foundation.sql`;
  const allTopicIds = canonicalTopicRows.map(([id]) => id);
  const lines = [
    `-- ${migrationNumber}: Foundation guard for WASSCE Integrated Science content sprint 2 (batch ${batchId}).`,
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

for (const topic of topics) {
  const topicQuestions = allQuestions.filter((question) => question.topicCode === topic.code);
  const chunks = [];
  for (let start = 0; start < topicQuestions.length; start += MAX_QUESTIONS_PER_MIGRATION) {
    chunks.push(topicQuestions.slice(start, start + MAX_QUESTIONS_PER_MIGRATION));
  }
  for (const [chunkIndex, chunk] of chunks.entries()) {
    const suffix = chunks.length > 1 ? `_part_${chunkIndex + 1}` : '';
    const name = `${migrationNumber}_wassce_int_science_sprint2_${topic.key}${suffix}.sql`;
    await emitQuestionMigration(name, topic.title, chunk);
  }
}

{
  const name = `${migrationNumber}_wassce_int_science_sprint2_final_guard.sql`;
  const guardTable = `_migration_${migrationNumber}_guard`;
  const allIds = allQuestions.map((question) => question.id);
  const mcqIds = allQuestions.filter((question) => question.type === 'multiple_choice').map((question) => question.id);
  const calcIds = allQuestions.filter((question) => question.type === 'calculation').map((question) => question.id);
  const structuredIds = allQuestions.filter((question) => question.type === 'structured').map((question) => question.id);
  const structuredPartTotal = allQuestions
    .filter((question) => question.type === 'structured')
    .reduce((total, question) => total + question.parts.length, 0);
  const lines = [
    `-- ${migrationNumber}: Final exact-set and relationship guard for WASSCE Integrated Science sprint 2 (batch ${batchId}).`,
    'PRAGMA foreign_keys = ON;',
    `CREATE TABLE IF NOT EXISTS ${guardTable} (valid INTEGER NOT NULL CHECK (valid = 1));`,
    `DELETE FROM ${guardTable};`,
    `INSERT INTO ${guardTable}(valid) SELECT CASE WHEN (SELECT COUNT(*) FROM questions q JOIN topics t ON t.id = q.topic_id JOIN question_content_releases r ON r.question_id = q.id WHERE q.id IN (${allIds.map(sql).join(', ')}) AND q.subject_id = '${subjectId}' AND q.subject_id = t.subject_id AND q.exam_type_id = '${examTypeId}' AND length(q.explanation) >= 80 AND r.batch_id = '${batchId}' AND r.quality_assurance = 'automated_beta' AND r.release_channel = 'beta' AND r.official_exam_board_content = 0 AND r.feedback_enabled = 1) = ${allIds.length} AND (SELECT COUNT(*) FROM questions q WHERE q.id IN (${mcqIds.map(sql).join(', ')}) AND q.question_type = 'multiple_choice' AND json_valid(q.options) AND json_array_length(q.options) = 4 AND q.correct_answer IN ('A','B','C','D')) = ${mcqIds.length} AND (SELECT COUNT(*) FROM questions q WHERE q.id IN (${calcIds.map(sql).join(', ')}) AND q.question_type = 'calculation' AND q.options IS NULL AND length(q.correct_answer) >= 1) = ${calcIds.length} AND (SELECT COUNT(*) FROM questions q WHERE q.id IN (${structuredIds.map(sql).join(', ')}) AND q.question_type = 'structured') = ${structuredIds.length} AND (SELECT COUNT(*) FROM structured_question_parts WHERE question_id IN (${allIds.map(sql).join(', ')})) = ${structuredPartTotal} AND (SELECT COUNT(*) FROM question_content_releases WHERE batch_id = '${batchId}') = ${allIds.length} THEN 1 ELSE 0 END;`,
    `DROP TABLE ${guardTable};`,
  ];
  await emitMigration(name, lines);
  migrationNumber += 1;
}

console.log(JSON.stringify({ validation: { valid: validation.valid, warnings: validation.warnings, metrics: validation.metrics }, outBatch, migrations: migrationPaths }, null, 2));
