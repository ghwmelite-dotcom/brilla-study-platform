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
const batchId = 'igcse-physics-sprint3-001';
const subjectId = 'subj_igcse_physics';
const examTypeId = 'igcse';
const examBoardId = 'board_cambridge';
const contentLabel = "Original BrillaPrep practice content aligned to the published Cambridge IGCSE Physics (0625) syllabus; not official Cambridge International, WAEC or NSMQ examination material. Use the enabled feedback channel to report corrections.";
const theoryContentLabel = 'Original BrillaPrep curriculum-aligned IGCSE Physics practice content; not official WAEC or Cambridge International examination material. Use the enabled feedback channel to report corrections.';
const releaseSourceUrl = 'https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-igcse-physics-0625/';

const cambridgeSource = {
  publisher: 'Cambridge International Education',
  title: 'Cambridge IGCSE Physics (0625) syllabus',
  url: releaseSourceUrl,
  use: 'curriculum_blueprint_only',
};

const mcq = (topicCode, difficulty, prompt, correct, wrong, solution, commandWord, assessmentObjective) => ({ topicCode, type: 'multiple_choice', difficulty, prompt, correct, wrong, solution, commandWord, assessmentObjective });
const calc = (topicCode, difficulty, prompt, answer, solution, assessmentObjective = 'AO2') => ({ topicCode, type: 'calculation', difficulty, prompt, answer, solution, commandWord: 'Calculate', assessmentObjective });
const shortAnswer = (topicCode, difficulty, prompt, answer, solution, commandWord = 'Explain', assessmentObjective = 'AO2') => ({ topicCode, type: 'short_answer', difficulty, prompt, answer, solution, commandWord, assessmentObjective });
const st = (topicCode, difficulty, prompt, parts, commandWord = 'Describe') => ({ topicCode, type: 'structured', difficulty, prompt, parts, commandWord, assessmentObjective: 'AO2' });
const part = (label, text, marks, correctAnswer) => ({ label, text, marks, correctAnswer });

// Cell plan from artifacts/sprint3/cells-igcse-physics.json: every have:0 cell is
// filled first (32 MCQs + 1 calculation + 1 short_answer + 6 structured = 40 items),
// then the two lowest have/target ratio partial cells (waves medium MCQ 1/4 and
// electricity easy MCQ 1/4, 3 items each). Skipped partial cells: mechanics medium
// (2/4), thermal easy (2/4), waves easy (2/4), nuclear easy (3/4) — the sprint-3
// target of ~45 items is exhausted before reaching them.
const topics = [
  {
    key: 'mechanics',
    topicId: 'topic_igcse_physics_mechanics',
    code: '0625-MECH',
    title: 'Motion, Forces and Energy',
    objective: 'Apply knowledge of speed, acceleration, equations of motion and Newton\u2019s laws to moving objects.',
    questions: [
      mcq('0625-MECH', 'hard', 'A car travelling at 20 m/s brakes uniformly to rest in 5.0 s. What distance does the car travel while braking?', '50 m', ['100 m', '8 m', '4 m'],
        'The deceleration is a = Δv ÷ t = 20 ÷ 5.0 = 4.0 m/s². Because the deceleration is uniform, the average velocity while braking is (20 + 0) ÷ 2 = 10 m/s, so the distance is 10 × 5.0 = 50 m (equivalently s = ut + ½at² = 100 − 50 = 50 m). (100 m uses s = vt and ignores the deceleration entirely; 8 m confuses the distance with the quantity 2a.)', 'Calculate', 'AO2'),
      mcq('0625-MECH', 'hard', 'A ball is thrown vertically upwards with an initial velocity of 30 m/s. Taking the gravitational field strength as 10 N/kg and neglecting air resistance, what is the maximum height the ball reaches?', '45 m', ['90 m', '15 m', '3 m'],
        'At maximum height the velocity is zero. Using v² = u² + 2as with a = −g = −10 m/s²: 0 = 30² − 2 × 10 × h, so h = 900 ÷ 20 = 45 m. (90 m omits the factor of 2 in the term 2as; 15 m halves the initial speed instead of squaring it.)', 'Calculate', 'AO2'),
      st('0625-MECH', 'medium', 'A cyclist starts from rest and accelerates along a straight, level road.', [
        part('a', 'Define acceleration.', 1,
          'Acceleration is the rate of change of velocity — the change in velocity divided by the time taken — measured in metres per second squared (m/s²).'),
        part('b', 'The cyclist reaches a velocity of 12 m/s in 6.0 s. Calculate the acceleration of the cyclist.', 2,
          'Acceleration a = (v − u) ÷ t = (12 − 0) ÷ 6.0 = 2.0 m/s².'),
        part('c', 'The total mass of the cyclist and bicycle is 80 kg. Calculate the resultant force producing this acceleration.', 2,
          'Resultant force F = ma = 80 × 2.0 = 160 N.'),
      ]),
    ],
  },
  {
    key: 'thermal',
    topicId: 'topic_igcse_physics_thermal',
    code: '0625-THERM',
    title: 'Thermal Physics',
    objective: 'Apply knowledge of the kinetic model, conduction, convection, radiation, evaporation and specific heat capacity.',
    questions: [
      mcq('0625-THERM', 'medium', 'Thermal energy is conducted through one end of a metal rod to the other. Which statement correctly describes conduction in a solid?', 'Energy is transferred as vibrating particles pass energy to neighbouring particles, without the particles moving through the solid', ['Particles flow from the hot end of the rod to the cold end', 'Energy travels through the rod as infrared waves', 'Hot, less-dense regions of the metal rise towards the cold end'],
        'In conduction the particles at the hot end vibrate more vigorously and pass energy to their neighbours through collisions (in metals, free electrons also carry energy); the particles themselves stay in their fixed positions. A flow of particles or of hot, less-dense material describes convection in a fluid, and infrared waves describe radiation, which needs no medium.', 'Identify', 'AO1'),
      mcq('0625-THERM', 'medium', 'A 0.50 kg aluminium block of specific heat capacity 900 J/(kg °C) is heated from 20 °C to 70 °C. Calculate the thermal energy transferred to the block.', '22,500 J', ['45,000 J', '9,000 J', '31,500 J'],
        'The temperature rise is ΔT = 70 − 20 = 50 °C, so E = mcΔT = 0.50 × 900 × 50 = 22,500 J. (31,500 J uses the final temperature 70 °C instead of the temperature change; 9,000 J uses the initial temperature 20 °C; 45,000 J doubles the mass.)', 'Calculate', 'AO2'),
      mcq('0625-THERM', 'medium', 'Why does evaporation cause the temperature of the remaining liquid to fall?', 'The fastest-moving (most energetic) molecules escape from the surface, so the average kinetic energy of the molecules left behind decreases', ['Evaporation draws cold air from the surroundings into the liquid', 'The slowest molecules leave the liquid first, taking no energy with them', 'Energy is destroyed as the liquid turns into a gas'],
        'Temperature is a measure of the average kinetic energy of the molecules. The molecules with the greatest kinetic energy are the ones that escape from the surface during evaporation, so the average kinetic energy — and hence the temperature — of the remaining liquid falls. The energy is carried away by the vapour (latent heat), not destroyed.', 'Explain', 'AO2'),
      mcq('0625-THERM', 'medium', 'Which surface is the best emitter of infrared radiation?', 'A dull (matt) black surface', ['A shiny black surface', 'A dull white surface', 'A shiny white surface'],
        'Dull black surfaces are the best absorbers and the best emitters of infrared radiation. Shiny surfaces reflect infrared rather than emitting it efficiently, and white or light-coloured surfaces emit less strongly than black ones, so a shiny white surface is the worst emitter of the four.', 'Identify', 'AO1'),
      mcq('0625-THERM', 'hard', 'Calculate the energy needed to convert 2.0 kg of water at 100 °C completely into steam at 100 °C. The specific latent heat of vaporisation of water is 2.3 × 10⁶ J/kg.', '4.6 × 10⁶ J', ['2.3 × 10⁶ J', '4.6 × 10⁵ J', '1.15 × 10⁶ J'],
        'During a change of state the temperature stays constant, so no mcΔT term applies: E = ml = 2.0 × 2.3 × 10⁶ = 4.6 × 10⁶ J. (2.3 × 10⁶ J is the energy for only 1.0 kg; 4.6 × 10⁵ J is a power-of-ten slip; 1.15 × 10⁶ J divides by the mass instead of multiplying.)', 'Calculate', 'AO2'),
      mcq('0625-THERM', 'hard', 'An 800 W immersion heater is placed in 0.20 kg of water. Assuming no thermal energy is lost to the surroundings, calculate the time needed to raise the temperature of the water by 30 °C. (Specific heat capacity of water = 4,200 J/(kg °C).)', '31.5 s', ['3.15 s', '63 s', '10.5 s'],
        'The energy required is E = mcΔT = 0.20 × 4,200 × 30 = 25,200 J. Power is energy per unit time, so t = E ÷ P = 25,200 ÷ 800 = 31.5 s. (3.15 s is a power-of-ten slip; 63 s doubles the energy needed; 10.5 s results from tripling the power by mistake.)', 'Calculate', 'AO3'),
      st('0625-THERM', 'medium', 'A student pours hot water into a beaker and records its temperature as the water cools to room temperature.', [
        part('a', 'Name the three main processes by which thermal energy is transferred from the hot water to the surroundings.', 2,
          'Conduction (through the beaker walls and into the table), convection (in the air above and around the beaker) and infrared radiation (emitted by the hot surfaces).'),
        part('b', 'Explain, in terms of particles, how a convection current forms in the air above the hot water.', 3,
          'Air particles near the hot water gain kinetic energy and move faster; the air expands and its density decreases, so the warm air rises. Cooler, denser air sinks in to take its place, and the cycle repeats as a circulating convection current.'),
        part('c', 'Suggest one change that would reduce the rate at which the water cools, and explain why it works.', 2,
          'Placing a lid on the beaker reduces evaporation and traps the layer of warm air above the water, cutting the energy lost by evaporation and convection (accept: wrapping the beaker in an insulating material reduces conduction through its walls).'),
      ]),
    ],
  },
  {
    key: 'waves',
    topicId: 'topic_igcse_physics_waves',
    code: '0625-WAVE',
    title: 'Waves',
    objective: 'Apply knowledge of wave properties, the wave equation, reflection, refraction, total internal reflection and the electromagnetic spectrum.',
    questions: [
      mcq('0625-WAVE', 'medium', 'A water wave has a frequency of 5.0 Hz and a wavelength of 0.60 m. Calculate the speed of the wave.', '3.0 m/s', ['0.12 m/s', '8.3 m/s', '30 m/s'],
        'The wave equation gives v = fλ = 5.0 × 0.60 = 3.0 m/s. (0.12 m/s divides wavelength by frequency, 8.3 m/s divides frequency by wavelength, and 30 m/s makes a power-of-ten slip when multiplying.)', 'Calculate', 'AO2'),
      mcq('0625-WAVE', 'medium', 'Which region of the electromagnetic spectrum has the longest wavelength?', 'Radio waves', ['Gamma rays', 'Visible light', 'X-rays'],
        'The spectrum runs radio waves → microwaves → infrared → visible light → ultraviolet → X-rays → gamma rays in order of decreasing wavelength and increasing frequency, so radio waves have the longest wavelength and gamma rays the shortest.', 'Recall', 'AO1'),
      mcq('0625-WAVE', 'medium', 'A ray of light travelling in air enters a glass block and bends towards the normal. What is this change of direction called, and why does it occur?', 'Refraction, because light travels more slowly in glass than in air', ['Reflection, because the surface of the glass is smooth', 'Diffraction, because the ray spreads out on entering the block', 'Dispersion, because white light splits into colours inside the glass'],
        'Refraction is the change in direction of a wave when its speed changes at a boundary between two media. Light slows down in the optically denser glass, so the ray bends towards the normal. Reflection is bouncing off the surface, diffraction is spreading through gaps or around edges, and dispersion is the splitting of white light into colours.', 'Identify', 'AO1'),
      mcq('0625-WAVE', 'hard', 'The critical angle for a glass–air boundary is 42°. A ray of light travelling inside the glass strikes the boundary at an angle of incidence of 50°. What happens to the ray?', 'It is totally internally reflected back into the glass', ['It is refracted away from the normal and leaves the glass', 'It passes straight through the boundary without bending', 'It is absorbed by the surface of the glass'],
        'The ray is travelling from a more dense medium towards a less dense one and its angle of incidence (50°) exceeds the critical angle (42°), so no refracted ray can form and all the light is totally internally reflected. Refraction away from the normal occurs only when the angle of incidence is less than the critical angle.', 'Apply', 'AO2'),
      mcq('0625-WAVE', 'hard', 'A student sees a flash of lightning and hears the thunder 6.0 s later. Taking the speed of sound in air as 340 m/s, calculate the distance of the lightning strike from the student.', '2,040 m', ['56.7 m', '346 m', '20.4 m'],
        'Light travels so fast that its journey time is negligible, so the 6.0 s delay is the time taken by the sound: distance = speed × time = 340 × 6.0 = 2,040 m. (56.7 m divides 340 by 6.0 instead of multiplying; 346 m adds the two numbers; 20.4 m is a power-of-ten slip.)', 'Calculate', 'AO2'),
      st('0625-WAVE', 'medium', 'A student uses a ripple tank to investigate the properties of water waves.', [
        part('a', 'Define the terms wavelength and frequency of a wave.', 2,
          'Wavelength is the distance between two adjacent points on the wave that are in phase, such as one crest and the next; frequency is the number of complete waves passing a fixed point per second, measured in hertz (Hz).'),
        part('b', 'A water wave has wavelength 0.040 m and frequency 10 Hz. Calculate the speed of the wave.', 2,
          'Wave speed v = fλ = 10 × 0.040 = 0.40 m/s.'),
        part('c', 'Describe the difference between a transverse wave and a longitudinal wave, giving one example of each.', 3,
          'In a transverse wave the oscillations are perpendicular to the direction in which the wave transfers energy — for example water ripples or light; in a longitudinal wave the oscillations are parallel to the direction of energy transfer, forming a series of compressions and rarefactions — for example sound in air.'),
      ]),
    ],
  },
  {
    key: 'electricity',
    topicId: 'topic_igcse_physics_electricity',
    code: '0625-ELEC',
    title: 'Electricity and Magnetism',
    objective: 'Apply knowledge of current, voltage, resistance, circuits, electromagnets, motors and transformers.',
    questions: [
      mcq('0625-ELEC', 'easy', 'Which quantity is measured in amperes?', 'Electric current', ['Potential difference', 'Resistance', 'Electric charge'],
        'The ampere (A) is the SI unit of electric current, which is the rate of flow of charge: I = Q ÷ t. Potential difference is measured in volts, resistance in ohms, and charge in coulombs.', 'Recall', 'AO1'),
      mcq('0625-ELEC', 'easy', 'Which arrangement is used to measure the potential difference across a fixed resistor in a circuit?', 'A voltmeter connected in parallel with the resistor', ['A voltmeter connected in series with the resistor', 'An ammeter connected in parallel with the resistor', 'An ammeter connected in series with the resistor'],
        'Potential difference is measured across a component, so the voltmeter is connected in parallel with it. An ammeter measures the current through the circuit and must be connected in series; connecting an ammeter in parallel would short-circuit the resistor.', 'Identify', 'AO1'),
      mcq('0625-ELEC', 'easy', 'A current of 2.0 A flows through a resistor when the potential difference across it is 12 V. Calculate the resistance of the resistor.', '6.0 Ω', ['24 Ω', '0.17 Ω', '10 Ω'],
        'From V = IR, the resistance is R = V ÷ I = 12 ÷ 2.0 = 6.0 Ω. (24 Ω multiplies instead of dividing; 0.17 Ω inverts the ratio to I/V; 10 Ω subtracts the current from the voltage.)', 'Calculate', 'AO2'),
      mcq('0625-ELEC', 'medium', 'Two resistors of resistance 4.0 Ω and 6.0 Ω are connected in series across a 20 V supply. Calculate the current in the circuit.', '2.0 A', ['5.0 A', '3.3 A', '0.50 A'],
        'Resistors in series add: R = 4.0 + 6.0 = 10 Ω. The current is I = V ÷ R = 20 ÷ 10 = 2.0 A. (5.0 A uses only the 4.0 Ω resistor and 3.3 A only the 6.0 Ω resistor — both ignore the series combination; 0.50 A inverts V/R.)', 'Calculate', 'AO2'),
      mcq('0625-ELEC', 'medium', 'Which material is most suitable for the core of an electromagnet that must switch on and off rapidly?', 'Soft iron, because it magnetises and demagnetises easily', ['Steel, because it retains its magnetism permanently', 'Copper, because it is a good electrical conductor', 'Aluminium, because it is light and does not rust'],
        'An electromagnet core must be a soft magnetic material: soft iron magnetises strongly while the current flows and loses its magnetism almost as soon as the current is switched off. Steel is a hard magnetic material that retains its magnetism, and copper and aluminium are not magnetic at all.', 'Identify', 'AO1'),
      mcq('0625-ELEC', 'medium', 'A transformer has 500 turns on its primary coil and 100 turns on its secondary coil. The primary voltage is 230 V. Calculate the secondary voltage.', '46 V', ['1,150 V', '23 V', '460 V'],
        'For a transformer, Vs ÷ Vp = Ns ÷ Np, so Vs = 230 × (100 ÷ 500) = 230 × 0.2 = 46 V. (1,150 V inverts the turns ratio, stepping the voltage up instead of down; 23 V divides by 10 unnecessarily; 460 V doubles the correct value.)', 'Calculate', 'AO2'),
      mcq('0625-ELEC', 'medium', 'What is the function of the split-ring commutator in a simple d.c. electric motor?', 'It reverses the direction of the current in the coil every half turn, so the coil keeps rotating in the same direction', ['It increases the current flowing through the coil', 'It prevents the wires from the battery from touching the coil', 'It converts the direct current into alternating current'],
        'When the coil passes the vertical position the split ring swaps the connections to the brushes, reversing the current in the coil every half turn. This keeps the turning force acting in the same sense, so the coil rotates continuously instead of oscillating back and forth.', 'Identify', 'AO1'),
      mcq('0625-ELEC', 'hard', 'Two 12 Ω resistors connected in parallel are joined in series with a 6.0 Ω resistor across a 12 V battery. Calculate the current supplied by the battery.', '1.0 A', ['2.0 A', '0.40 A', '0.67 A'],
        'The parallel pair has resistance (1/12 + 1/12)⁻¹ = 6.0 Ω, so the total resistance is 6.0 + 6.0 = 12 Ω and the battery current is I = V ÷ R = 12 ÷ 12 = 1.0 A. (2.0 A ignores the parallel pair entirely; 0.40 A wrongly adds the two 12 Ω resistors in series to give 30 Ω; 0.67 A uses 18 Ω, keeping one 12 Ω resistor.)', 'Calculate', 'AO3'),
      mcq('0625-ELEC', 'hard', 'An electric kettle rated at 3.0 kW operates on a 230 V mains supply. Calculate the current drawn and select the most suitable fuse rating.', '13 A fuse (current ≈ 13 A)', ['3 A fuse (current ≈ 13 A)', '5 A fuse (current ≈ 13 A)', '30 A fuse (current ≈ 0.08 A)'],
        'The current is I = P ÷ V = 3,000 ÷ 230 ≈ 13.0 A. A fuse should be rated just above the normal operating current, so a 13 A fuse is correct. (3 A and 5 A fuses would melt during normal use; 0.08 A comes from inverting the relation to V/P.)', 'Calculate', 'AO3'),
      st('0625-ELEC', 'hard', 'A student investigates how the current through a fixed resistor varies with the potential difference across it.', [
        part('a', 'Describe the circuit the student should use, naming the meters and stating where each is connected.', 2,
          'A d.c. supply or battery connected in series with an ammeter, a variable resistor (rheostat) and the fixed resistor; a voltmeter is connected in parallel across the fixed resistor to measure the potential difference.'),
        part('b', 'State the relationship between the current and the potential difference for a resistor that obeys Ohm\u2019s law.', 2,
          'The current is directly proportional to the potential difference across the resistor, provided the temperature and other physical conditions remain constant (V = IR with R constant).'),
        part('c', 'The student records a current of 0.40 A when the potential difference is 6.0 V. Calculate the resistance of the resistor, and the current when the potential difference is increased to 9.0 V.', 3,
          'R = V ÷ I = 6.0 ÷ 0.40 = 15 Ω; at 9.0 V the current is I = V ÷ R = 9.0 ÷ 15 = 0.60 A.'),
      ]),
    ],
  },
  {
    key: 'nuclear',
    topicId: 'topic_igcse_physics_nuclear',
    code: '0625-NUCL',
    title: 'Nuclear Physics',
    objective: 'Apply knowledge of atomic structure, isotopes, radioactive decay, half-life, fission and fusion.',
    questions: [
      mcq('0625-NUCL', 'medium', 'Which type of nuclear radiation is the most strongly ionising?', 'Alpha (α) radiation', ['Beta (β) radiation', 'Gamma (γ) radiation', 'X-rays'],
        'Alpha particles are helium nuclei with charge +2 and a relatively large mass, so they collide frequently and ionise matter most strongly — which is also why they are the least penetrating. Beta and gamma ionise progressively less, and X-rays, like gamma rays, are weakly ionising electromagnetic waves.', 'Recall', 'AO1'),
      mcq('0625-NUCL', 'medium', 'A nucleus of uranium is represented as ²³⁵₉₂U. How many neutrons does this nucleus contain?', '143', ['92', '235', '327'],
        'The number of neutrons is the mass (nucleon) number minus the proton number: 235 − 92 = 143. (92 is the number of protons, 235 is the total number of protons and neutrons, and 327 adds the two numbers instead of subtracting.)', 'Calculate', 'AO2'),
      mcq('0625-NUCL', 'medium', 'What is meant by the half-life of a radioactive isotope?', 'The time taken for half of the undecayed nuclei in a sample to decay', ['The time taken for all the nuclei in a sample to decay', 'Half the time taken for the sample to decay completely', 'The time taken for a single nucleus to decay'],
        'Radioactive decay is a random process, so half-life is defined statistically: after one half-life, half of the original undecayed nuclei remain and the activity of the sample has halved. A sample never decays completely in a fixed time, and no single nucleus has its own predictable decay time.', 'Recall', 'AO1'),
      mcq('0625-NUCL', 'medium', 'Which statement about nuclear fusion is correct?', 'Two light nuclei join together to form a heavier nucleus, releasing energy', ['A heavy nucleus splits into two lighter nuclei, releasing energy', 'It takes place only inside nuclear reactors on Earth', 'It is a chemical reaction between hydrogen atoms'],
        'Fusion joins light nuclei such as hydrogen isotopes to form heavier nuclei like helium, converting some mass into energy; it powers the Sun and other stars. Splitting a heavy nucleus is fission, fusion happens naturally in stars rather than only in reactors, and it is a nuclear process — far more energetic than any chemical reaction.', 'Identify', 'AO1'),
      mcq('0625-NUCL', 'hard', 'A radioactive isotope has a half-life of 8 days. A sample of the isotope has an initial activity of 640 Bq. What is the activity of the sample after 24 days?', '80 Bq', ['160 Bq', '213 Bq', '27 Bq'],
        '24 days is 24 ÷ 8 = 3 half-lives, so the activity halves three times: 640 → 320 → 160 → 80 Bq. (160 Bq stops after only two half-lives; 213 Bq simply divides 640 by 3; 27 Bq divides 640 by 24.)', 'Calculate', 'AO2'),
      mcq('0625-NUCL', 'hard', 'In a nuclear fission reactor, what is the function of the moderator?', 'It slows down the fast neutrons so that they can go on to cause further fission', ['It absorbs excess neutrons to control the rate of the reaction', 'It transfers thermal energy from the core to the turbines', 'It prevents radiation from escaping the reactor'],
        'Fission is sustained by slow (thermal) neutrons, so the moderator — graphite or water — slows the fast neutrons released by fission so they can trigger further fission of ²³⁵U. Absorbing excess neutrons is the job of the control rods, transferring thermal energy is the role of the coolant, and containment is provided by the shielding.', 'Identify', 'AO1'),
      st('0625-NUCL', 'medium', 'Radioactive isotopes have many important uses in medicine and industry.', [
        part('a', 'Compare the ionising power and penetrating power of alpha, beta and gamma radiation.', 3,
          'Alpha is the most strongly ionising but least penetrating, stopped by paper or a few centimetres of air; beta is less ionising and more penetrating, stopped by a few millimetres of aluminium; gamma is the least ionising and most penetrating, requiring thick lead or concrete to reduce it significantly.'),
        part('b', 'A medical tracer uses an isotope with a half-life of 6 hours. Explain why a short half-life is an advantage for the patient.', 2,
          'The activity of the tracer falls quickly after the scan, so the patient is exposed to ionising radiation for only a limited time, while the source remains active long enough for a clear image to be obtained.'),
        part('c', 'State one safety precaution that should be taken when handling radioactive sources.', 1,
          'Use tongs to handle the source at a distance (accept: store sources in lead-lined containers, keep exposure time as short as possible, never point a source at anyone).'),
      ]),
    ],
  },
  {
    key: 'space',
    topicId: 'topic_igcse_physics_space',
    code: '0625-SPCE',
    title: 'Space Physics',
    objective: 'Apply knowledge of the Solar System, orbital motion, stars, galaxies and the expanding Universe.',
    questions: [
      mcq('0625-SPCE', 'easy', 'Which planet in the Solar System is closest to the Sun?', 'Mercury', ['Venus', 'Earth', 'Mars'],
        'The order of the planets from the Sun is Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune, so Mercury is closest and experiences the strongest gravitational pull and the shortest orbital period.', 'Recall', 'AO1'),
      mcq('0625-SPCE', 'easy', 'What is the name of the galaxy that contains our Solar System?', 'The Milky Way', ['Andromeda', 'The North Star', 'The Solar Nebula'],
        'The Solar System lies in the Milky Way, a spiral galaxy containing billions of stars. Andromeda is the nearest large galaxy to our own, the North Star (Polaris) is a single star within the Milky Way, and the solar nebula was the cloud from which the Solar System formed, not a galaxy.', 'Recall', 'AO1'),
      mcq('0625-SPCE', 'easy', 'Approximately how long does the Earth take to make one complete orbit of the Sun?', 'One year (about 365 days)', ['One day (24 hours)', 'One month (about 28 days)', 'One decade (10 years)'],
        'The Earth completes one orbit of the Sun in about 365 days — one year. One day is the time for the Earth to rotate once on its own axis, which causes day and night, and about 28 days is the orbital period of the Moon around the Earth.', 'Recall', 'AO1'),
      mcq('0625-SPCE', 'easy', 'Which force keeps the planets in orbit around the Sun?', 'The gravitational attraction between the Sun and each planet', ['The magnetic field of the Sun', 'Friction between the planet and space', 'Electrostatic attraction between charged particles'],
        'Gravity provides the centripetal force that continually pulls each planet towards the Sun, bending its path into an orbit. Space is essentially a vacuum, so there is no friction, and magnetic and electrostatic forces are far too weak to hold planets in orbit.', 'Identify', 'AO1'),
      mcq('0625-SPCE', 'medium', 'Why does the Sun appear to move across the sky from east to west during the day?', 'The Earth rotates on its axis once every 24 hours', ['The Sun orbits the Earth once every day', 'The Earth orbits the Sun once every day', 'The Moon blocks the Sun as it moves across the sky'],
        'The apparent daily motion of the Sun is caused by the Earth spinning eastwards on its axis once every 24 hours, so the Sun appears to rise in the east and set in the west. The Earth\u2019s orbit around the Sun takes a whole year and produces the seasons, not the daily motion.', 'Explain', 'AO2'),
      mcq('0625-SPCE', 'medium', 'What observation provides evidence that the Universe is expanding?', 'Light from distant galaxies is redshifted, and the further away a galaxy is, the greater its redshift', ['Light from all galaxies is blueshifted', 'The number of stars in the Milky Way is increasing', 'The planets are moving further from the Sun each year'],
        'The absorption lines in the spectra of distant galaxies are shifted to longer wavelengths (redshift), showing that the galaxies are receding; the redshift increases with distance, exactly as expected if space itself is expanding. Blueshift would indicate approach, and changes inside our own galaxy or Solar System cannot show the expansion of the Universe.', 'Identify', 'AO2'),
      mcq('0625-SPCE', 'medium', 'A star such as the Sun remains stable for billions of years. Which statement best describes this equilibrium?', 'The inward force of gravity is balanced by the outward pressure of the hot gas and radiation', ['The nuclear reactions switch off the force of gravity', 'The outward pressure from fusion is much greater than gravity, so the star slowly expands', 'The star\u2019s mass is too small for gravity to have any effect'],
        'In a stable star there is a balance (hydrostatic equilibrium): gravity pulls the gas inwards while the pressure of the hot gas and the radiation from nuclear fusion pushes outwards. If gravity were unopposed the star would collapse, and if the pressure were much greater the star would expand.', 'Explain', 'AO2'),
      mcq('0625-SPCE', 'medium', 'Light from the Sun takes about 500 s to reach the Earth. Taking the speed of light as 3.0 × 10⁸ m/s, calculate the distance from the Sun to the Earth.', '1.5 × 10¹¹ m', ['1.5 × 10⁹ m', '6.0 × 10⁵ m', '1.5 × 10¹³ m'],
        'Distance = speed × time = 3.0 × 10⁸ × 500 = 1.5 × 10¹¹ m (about 150 million kilometres). (1.5 × 10⁹ m misreads the 500 s as 5 s; 6.0 × 10⁵ m divides the speed by the time; 1.5 × 10¹³ m is a power-of-ten slip.)', 'Calculate', 'AO2'),
      mcq('0625-SPCE', 'hard', 'An absorption line in the spectrum of a distant galaxy has a wavelength of 500 nm, compared with 400 nm for the same line measured in the laboratory. Taking the speed of light as 3.0 × 10⁸ m/s, what can be concluded about the galaxy?', 'It is moving away from us at about 7.5 × 10⁷ m/s', ['It is moving towards us at about 7.5 × 10⁷ m/s', 'It is moving away from us at about 6.0 × 10⁷ m/s', 'It is not moving relative to the Earth'],
        'The wavelength has increased, so the light is redshifted and the galaxy is receding. The recession speed is v = c × Δλ ÷ λ = 3.0 × 10⁸ × (100 ÷ 400) = 7.5 × 10⁷ m/s. (Approach would produce a blueshift; 6.0 × 10⁷ m/s wrongly uses Δλ ÷ λobserved = 100 ÷ 500.)', 'Apply', 'AO3'),
      mcq('0625-SPCE', 'hard', 'A satellite in a circular orbit around the Earth moves into a lower orbit. What happens to its orbital speed and its orbital period?', 'The speed increases and the period decreases', ['Both the speed and the period decrease', 'The speed decreases and the period increases', 'Both the speed and the period increase'],
        'In a lower orbit the gravitational pull is stronger, so the satellite must travel faster to maintain its circular path; the shorter circumference and higher speed together make the orbital period shorter. This is why low-orbit satellites circle the Earth in about 90 minutes while geostationary satellites, much higher up, take 24 hours.', 'Apply', 'AO3'),
      calc('0625-SPCE', 'medium', 'The Moon orbits the Earth at an average distance of 3.84 × 10⁸ m with an orbital period of 27.3 days. Assuming the orbit is circular, calculate the orbital speed of the Moon. (1 day = 86,400 s.)', 'approximately 1.0 × 10³ m/s',
        'The circumference of the orbit is 2πr = 2 × 3.14 × 3.84 × 10⁸ = 2.41 × 10⁹ m. The period in seconds is T = 27.3 × 86,400 = 2.36 × 10⁶ s. Orbital speed v = distance ÷ time = 2.41 × 10⁹ ÷ 2.36 × 10⁶ ≈ 1.02 × 10³ m/s. Answer: the Moon orbits at approximately 1.0 × 10³ m/s (about 1 km/s).'),
      shortAnswer('0625-SPCE', 'medium', 'Explain why the Sun is classified as a star but Jupiter is not.', 'The Sun releases its own energy by nuclear fusion of hydrogen in its core and emits its own light and heat, while Jupiter is a planet: it is not massive enough for fusion and shines only by reflecting sunlight.',
        'A star is a body massive enough for gravity to compress and heat its core until nuclear fusion begins, so it generates and emits its own energy. Jupiter, although large for a planet, has far too little mass for fusion to start; it produces no light of its own and is visible only because it reflects sunlight. Therefore the Sun is a star and Jupiter is a planet.', 'Explain', 'AO2'),
      st('0625-SPCE', 'hard', 'Astronomers can describe the life cycle of a star such as the Sun.', [
        part('a', 'Describe how a star forms from a nebula.', 2,
          'A cloud of gas and dust (a nebula) collapses under its own gravitational attraction into an increasingly dense protostar; as it contracts it heats up until the core is hot and dense enough for the nuclear fusion of hydrogen to begin.'),
        part('b', 'Describe what happens to a star like the Sun when it runs out of hydrogen fuel.', 3,
          'The star expands and its surface cools to become a red giant; it then sheds its outer layers as a planetary nebula, leaving the hot core behind as a white dwarf, which gradually cools and fades.'),
        part('c', 'State how the final stages differ for a star with a much greater mass than the Sun.', 2,
          'A much more massive star explodes as a supernova, leaving behind a neutron star — or, if the remaining core is massive enough, a black hole — instead of quietly becoming a white dwarf.'),
      ]),
    ],
  },
];

// Prod-canonical IGCSE Physics topic rows (verified read-only against prod D1 on
// 2026-09-09; identical rows ship in prod-patch 096_seed_topics_for_empty_subjects.sql).
// The foundation migration INSERT OR IGNOREs these copies for fresh baselines and
// scratch fixtures; on prod every id already exists, so the inserts no-op.
// [id, subjectId, parentId, name, slug, description, theoryContent, keyFormulas, displayOrder, createdAt]
const canonicalTopicRows = [
  ['topic_igcse_physics_mechanics', subjectId, null, 'Motion, Forces and Energy', 'motion-forces-and-energy', "Speed, acceleration, Newton's laws, work, energy and power", null, null, 1, '2026-08-13T00:00:00.000Z'],
  ['topic_igcse_physics_thermal', subjectId, null, 'Thermal Physics', 'thermal-physics', 'Kinetic model, temperature, specific heat capacity and transfer', null, null, 2, '2026-08-13T00:00:00.000Z'],
  ['topic_igcse_physics_waves', subjectId, null, 'Waves', 'waves', 'Properties of waves, light, sound and the electromagnetic spectrum', null, null, 3, '2026-08-13T00:00:00.000Z'],
  ['topic_igcse_physics_electricity', subjectId, null, 'Electricity and Magnetism', 'electricity-and-magnetism', 'Circuits, resistance, electromagnetism, motors and transformers', null, null, 4, '2026-08-13T00:00:00.000Z'],
  ['topic_igcse_physics_nuclear', subjectId, null, 'Nuclear Physics', 'nuclear-physics', 'Atomic structure, radioactivity, fission and fusion', null, null, 5, '2026-08-13T00:00:00.000Z'],
  ['topic_igcse_physics_space', subjectId, null, 'Space Physics', 'space-physics', 'The Solar System, stars, galaxies and the expanding universe', null, null, 6, '2026-08-13T00:00:00.000Z'],
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
    id: `q_igphy_${topic.key}_s3_${String(index + 1).padStart(3, '0')}`,
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
    contentLabel,
    provenance: [cambridgeSource],
  };
}

function buildCalculation(topic, question, index) {
  return {
    id: `q_igphy_${topic.key}_s3_${String(index + 1).padStart(3, '0')}`,
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
    contentLabel,
    provenance: [cambridgeSource],
  };
}

function buildShortAnswer(topic, question, index) {
  return {
    id: `q_igphy_${topic.key}_s3_${String(index + 1).padStart(3, '0')}`,
    original: true,
    topicCode: question.topicCode,
    type: 'short_answer',
    prompt: question.prompt,
    correctAnswer: question.answer,
    workedSolution: question.solution,
    difficulty: question.difficulty,
    marks: 2,
    points: 3,
    timeLimit: 120,
    commandWord: question.commandWord,
    assessmentObjective: question.assessmentObjective,
    contentLabel,
    provenance: [cambridgeSource],
  };
}

function structuredAnswer(question) {
  return question.parts.map((entry) => `(${entry.label}) ${entry.correctAnswer}`).join(' ');
}

function buildStructured(topic, question, index) {
  const marks = question.parts.reduce((total, entry) => total + entry.marks, 0);
  return {
    id: `q_igphy_${topic.key}_s3_${String(index + 1).padStart(3, '0')}`,
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
    specificationCode: 'BRILLA-0625-IGPHY-S3-001',
    sources: [cambridgeSource],
    topics: topics.map(({ code, title, objective }) => ({ code, title, objective })),
    questions: topics.flatMap((topic) => topic.questions.map((question, index) => {
      if (question.type === 'multiple_choice') return buildMcq(topic, question, index);
      if (question.type === 'calculation') return buildCalculation(topic, question, index);
      if (question.type === 'short_answer') return buildShortAnswer(topic, question, index);
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
  const typeCounts = { multiple_choice: 0, calculation: 0, short_answer: 0, structured: 0 };
  const topicCounts = new Map();
  for (const question of batch.subjects[0].questions) {
    typeCounts[question.type] += 1;
    topicCounts.set(question.topicCode, (topicCounts.get(question.topicCode) ?? 0) + 1);
    if (!Array.isArray(question.provenance) || question.provenance[0]?.use !== 'curriculum_blueprint_only') errors.push(`${question.id}: per-item provenance missing`);
    if (typeof question.contentLabel !== 'string' || !/not official/i.test(question.contentLabel) || !/feedback channel/i.test(question.contentLabel)) errors.push(`${question.id}: per-item contentLabel missing disclaimer or feedback sentence`);
    assertNoFalseOfficialClaim(question.prompt, `${question.id}.prompt`);
    assertNoFalseOfficialClaim(question.workedSolution, `${question.id}.workedSolution`);
    if (question.type === 'multiple_choice') {
      letterCounts[question.correctAnswer] += 1;
      if (question.options?.length !== 4) errors.push(`${question.id}: MCQ needs exactly 4 options`);
      if (question.marks !== 1) errors.push(`${question.id}: MCQ marks must be 1`);
    } else if (question.type === 'calculation' || question.type === 'short_answer') {
      if (question.options != null) errors.push(`${question.id}: ${question.type} must not have options`);
      if (typeof question.correctAnswer !== 'string' || !question.correctAnswer.length) errors.push(`${question.id}: ${question.type} needs an answer`);
    } else if (question.type === 'structured') {
      const sum = question.parts.reduce((total, entry) => total + entry.marks, 0);
      if (sum !== question.marks) errors.push(`${question.id}: part marks (${sum}) must sum to marks (${question.marks})`);
      if (!/\bnot\s+official\s+waec\b/i.test(question.contentLabel)) errors.push(`${question.id}: structured contentLabel must disclaim official WAEC status`);
      for (const entry of question.parts) assertNoFalseOfficialClaim(entry.text, `${question.id} part ${entry.label}`);
    } else {
      errors.push(`${question.id}: unexpected type ${question.type}`);
    }
  }
  if (typeCounts.multiple_choice !== 38) errors.push(`expected 38 MCQs, found ${typeCounts.multiple_choice}`);
  if (typeCounts.calculation !== 1) errors.push(`expected 1 calculation, found ${typeCounts.calculation}`);
  if (typeCounts.short_answer !== 1) errors.push(`expected 1 short answer, found ${typeCounts.short_answer}`);
  if (typeCounts.structured !== 6) errors.push(`expected 6 structured questions, found ${typeCounts.structured}`);
  const expectedTopicCounts = { '0625-MECH': 3, '0625-THERM': 7, '0625-WAVE': 6, '0625-ELEC': 10, '0625-NUCL': 7, '0625-SPCE': 13 };
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
// and both inserts and fail-closed checks read from them: with full worked-solution
// explanations this keeps every migration under the remote D1 query limit.
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

let migrationNumber = 608;
{
  const name = `${migrationNumber}_igcse_physics_sprint3_foundation.sql`;
  const allTopicIds = canonicalTopicRows.map(([id]) => id);
  const lines = [
    `-- ${migrationNumber}: Foundation guard for Cambridge IGCSE Physics (0625) content sprint 3 (batch ${batchId}).`,
    '-- Original BrillaPrep practice content; not official Cambridge International, WAEC or NSMQ material.',
    '-- Re-asserts the prod-canonical IGCSE Physics topic rows (copied verbatim from',
    '-- prod-patch 096_seed_topics_for_empty_subjects.sql) for fresh baselines;',
    '-- INSERT OR IGNORE no-ops on prod where every row already exists.',
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
const maxQuestionsPerMigration = 8;
for (const topic of topics) {
  const topicQuestions = allQuestions.filter((question) => question.topicCode === topic.code);
  const chunkCount = Math.ceil(topicQuestions.length / maxQuestionsPerMigration);
  for (let chunk = 0; chunk < chunkCount; chunk += 1) {
    const chunkQuestions = topicQuestions.slice(chunk * maxQuestionsPerMigration, (chunk + 1) * maxQuestionsPerMigration);
    const ids = chunkQuestions.map((question) => question.id);
    const expectedTable = `_migration_${migrationNumber}_expected`;
    const expectedPartsTable = `_migration_${migrationNumber}_expected_parts`;
    const guardTable = `_migration_${migrationNumber}_guard`;
    const suffix = chunkCount === 1 ? topic.key : `${topic.key}_part_${chunk + 1}`;
    const name = `${migrationNumber}_igcse_physics_${suffix}.sql`;
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
      `-- ${migrationNumber}: Original BrillaPrep Cambridge IGCSE Physics (0625) ${topic.title} practice questions${chunkCount === 1 ? '' : ` (part ${chunk + 1} of ${chunkCount})`} (batch ${batchId}).`,
      '-- Curriculum-aligned practice content; not official Cambridge International, WAEC or NSMQ material.',
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
}

{
  const name = `${migrationNumber}_igcse_physics_sprint3_final_guard.sql`;
  const guardTable = `_migration_${migrationNumber}_guard`;
  const allIds = allQuestions.map((question) => question.id);
  const structuredPartTotal = allQuestions
    .filter((question) => question.type === 'structured')
    .reduce((total, question) => total + question.parts.length, 0);
  const lines = [
    `-- ${migrationNumber}: Final exact-set and relationship guard for Cambridge IGCSE Physics sprint 3 (batch ${batchId}).`,
    'PRAGMA foreign_keys = ON;',
    `CREATE TABLE IF NOT EXISTS ${guardTable} (valid INTEGER NOT NULL CHECK (valid = 1));`,
    `DELETE FROM ${guardTable};`,
    `INSERT INTO ${guardTable}(valid) SELECT CASE WHEN (SELECT COUNT(*) FROM questions q JOIN topics t ON t.id = q.topic_id JOIN question_content_releases r ON r.question_id = q.id WHERE q.id IN (${allIds.map(sql).join(', ')}) AND q.subject_id = '${subjectId}' AND q.subject_id = t.subject_id AND q.exam_type_id = '${examTypeId}' AND q.exam_board_id = '${examBoardId}' AND q.round_type IS NULL AND q.paper_type_id IS NULL AND q.past_paper_id IS NULL AND q.source_paper_code IS NULL AND q.source_question_number IS NULL AND length(q.explanation) >= 80 AND r.batch_id = '${batchId}' AND r.quality_assurance = 'automated_beta' AND r.release_channel = 'beta' AND r.official_exam_board_content = 0 AND r.feedback_enabled = 1) = 46 AND (SELECT COUNT(*) FROM questions q WHERE q.id IN (${allIds.map(sql).join(', ')}) AND q.question_type = 'multiple_choice' AND json_valid(q.options) AND json_array_length(q.options) = 4 AND q.correct_answer IN ('A','B','C','D')) = 38 AND (SELECT COUNT(*) FROM questions q WHERE q.id IN (${allIds.map(sql).join(', ')}) AND q.question_type = 'calculation' AND q.options IS NULL) = 1 AND (SELECT COUNT(*) FROM questions q WHERE q.id IN (${allIds.map(sql).join(', ')}) AND q.question_type = 'short_answer' AND q.options IS NULL) = 1 AND (SELECT COUNT(*) FROM questions q WHERE q.id IN (${allIds.map(sql).join(', ')}) AND q.question_type = 'structured') = 6 AND (SELECT COUNT(*) FROM structured_question_parts WHERE question_id IN (${allIds.map(sql).join(', ')})) = ${structuredPartTotal} AND (SELECT COUNT(*) FROM question_content_releases WHERE batch_id = '${batchId}') = 46 THEN 1 ELSE 0 END;`,
    `DROP TABLE ${guardTable};`,
  ];
  await emitMigration(name, lines);
  migrationNumber += 1;
}

console.log(JSON.stringify({ validation: { valid: validation.valid, warnings: validation.warnings, metrics: validation.metrics }, outBatch, migrations: migrationPaths }, null, 2));
