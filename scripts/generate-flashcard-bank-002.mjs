import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Flashcard bank expansion, batch 2 (flashcards-beta-002).
// Original BrillaPrep revision cards only: fills 10 more empty
// deck_sys_topic_* NSMQ shells (the 8 filled by batch 1 are excluded).
// No new decks are created. Self-validates because the question batch
// validator (question-content-lib.mjs) does not cover flashcards; limits
// mirror workers/api/flashcard-decks.ts. Duplicate-front rejection covers
// seed.sql AND batch 1 (content/batches/flashcards-beta-001.json).

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputRoot = process.argv.includes('--output-root')
  ? resolve(process.argv[process.argv.indexOf('--output-root') + 1])
  : repoRoot;

const generatedAt = '2026-09-09T00:00:00Z';
const batchId = 'flashcards-beta-002';
const contentLabel = 'Original BrillaPrep revision flashcards aligned to Ghana’s published NaCCA curriculum and the WAEC/NSMQ syllabus scope; not official WAEC, NaCCA or NSMQ material.';
const provenance = [
  {
    publisher: 'National Council for Curriculum and Assessment, Ghana',
    title: 'Secondary Education Curriculum (Common Core Programme and SHS subject curricula)',
    url: 'https://nacca.gov.gh/',
    use: 'curriculum_blueprint_only',
  },
  {
    publisher: 'West African Examinations Council, Ghana',
    title: 'WASSCE for School Candidates subject catalogue and syllabus scope',
    url: 'https://waecgh.org/home/wassce-school/',
    use: 'curriculum_blueprint_only',
  },
  {
    publisher: 'Primetime Limited',
    title: 'National Science & Maths Quiz (scope: Ghana SHS science and mathematics syllabi)',
    url: 'https://nsmq.com.gh/',
    use: 'curriculum_blueprint_only',
  },
];

// ---------------------------------------------------------------------------
// Decks. All 10 deck_sys_topic_* rows already exist in seed.sql as empty
// system shells (card_count = 0) and their topic ids exist in prod; this batch
// inserts only cards. Batch-1 shells (algebra, trigonometry, mechanics,
// electricity, atomic, stoichiometry, cells, genetics) are excluded.
// ---------------------------------------------------------------------------
const existingShells = [
  { key: 'geometry', deckId: 'deck_sys_topic_geometry' },
  { key: 'quadratic', deckId: 'deck_sys_topic_quadratic' },
  { key: 'statistics', deckId: 'deck_sys_topic_statistics' },
  { key: 'kinematics', deckId: 'deck_sys_topic_kinematics' },
  { key: 'waves', deckId: 'deck_sys_topic_waves' },
  { key: 'modern_physics', deckId: 'deck_sys_topic_modern_physics' },
  { key: 'bonding', deckId: 'deck_sys_topic_bonding' },
  { key: 'organic', deckId: 'deck_sys_topic_organic' },
  { key: 'ecology', deckId: 'deck_sys_topic_ecology' },
  { key: 'physiology', deckId: 'deck_sys_topic_physiology' },
];

// card(front, back, difficulty, hint?) — hint optional, difficulty 1-5.
const card = (front, back, difficulty, hint = null) => ({ front, back, difficulty, hint });

const cardsByDeck = {
  geometry: [
    card('State the angle in a semicircle theorem.', 'The angle subtended at the circumference by a diameter is a right angle: any angle inscribed in a semicircle equals 90°.', 2),
    card('What is the relationship between a tangent to a circle and the radius drawn to the point of contact?', 'They are perpendicular: the tangent meets the radius at exactly 90° at the point of contact.', 2),
    card('State the alternate segment theorem.', 'The angle between a tangent and a chord drawn through the point of contact equals the angle subtended by that chord in the alternate segment of the circle.', 3),
    card('What do the opposite angles of a cyclic quadrilateral add up to?', '180° — opposite angles of a cyclic quadrilateral are supplementary, since each pair subtends arcs that together make the whole circle.', 2),
    card('State the angle at the centre theorem.', 'The angle subtended by an arc at the centre of a circle is twice the angle subtended by the same arc at the circumference.', 2),
    card('Write the formula for the circumference of a circle of radius r.', 'C = 2πr (equivalently C = πd, where d = 2r is the diameter).', 1),
    card('Write the formula for the volume of a cylinder of radius r and height h.', 'V = πr²h — the base area (πr²) multiplied by the height.', 1),
    card('Write the formula for the volume of a cone of base radius r and perpendicular height h.', 'V = ⅓πr²h — one third of the volume of the cylinder with the same base and height.', 2),
    card('What is the sum of the interior angles of an n-sided polygon?', '(n − 2) × 180°. Each exterior angle of a regular n-gon is 360°/n, and the interior angle is 180° − 360°/n.', 2, 'Split the polygon into triangles from one vertex.'),
    card('What can be said about angles in the same segment of a circle?', 'They are equal: angles subtended by the same arc (or chord) in the same segment of a circle are identical.', 2),
  ],
  quadratic: [
    card('Write the standard form of a quadratic equation.', 'ax² + bx + c = 0, where a, b and c are constants and a ≠ 0 (if a = 0 the equation is linear, not quadratic).', 1),
    card('For ax² + bx + c = 0 with a ≠ 0, write the formula that gives the roots in terms of a, b and c.', 'x = (−b ± √(b² − 4ac)) / 2a — obtained by completing the square on the standard form.', 2),
    card('What is the discriminant of a quadratic, and what does each sign of it tell you?', 'Δ = b² − 4ac. If Δ > 0 there are two distinct real roots; if Δ = 0 there is one repeated real root; if Δ < 0 there are no real roots (a complex conjugate pair).', 3),
    card('What is the sum of the roots of ax² + bx + c = 0?', '−b/a. This follows from writing the equation as a(x − α)(x − β) = 0 and comparing coefficients of x.', 2),
    card('What is the product of the roots of ax² + bx + c = 0?', 'c/a, from the constant term of a(x − α)(x − β) = a[x² − (α + β)x + αβ].', 2),
    card('Solve x² − 5x + 6 = 0 by factorising.', 'x² − 5x + 6 = (x − 2)(x − 3) = 0, so x = 2 or x = 3. The factors come from the pair of numbers with sum −5 and product +6.', 1),
    card('What is the axis of symmetry of the parabola y = ax² + bx + c?', 'The vertical line x = −b/2a. The vertex (turning point) of the parabola lies on this line.', 3),
    card('Complete the square for x² + 6x + 5.', 'x² + 6x + 5 = (x + 3)² − 9 + 5 = (x + 3)² − 4. Hence the minimum value is −4 at x = −3, and the roots are x = −1 and x = −5.', 3, 'Halve the coefficient of x to build the bracket.'),
    card('How does the sign of a affect the graph of y = ax² + bx + c?', 'If a > 0 the parabola opens upward and has a minimum point; if a < 0 it opens downward and has a maximum point.', 1),
    card('Form a quadratic equation with integer coefficients whose roots are 3 and −4.', 'Sum of roots = −1 and product = −12, so the equation is x² − (sum)x + product = 0, i.e. x² + x − 12 = 0.', 3, 'Use x² − (α + β)x + αβ = 0.'),
  ],
  statistics: [
    card('Define the mean of a set of n observations.', 'The arithmetic average: mean = Σx/n, the sum of all values divided by the number of values.', 1),
    card('Define the median of a data set.', 'The middle value when the data are arranged in order of size; for an even number of observations it is the average of the two middle values.', 1),
    card('Define the mode of a data set.', 'The value that occurs most frequently. A data set may have one mode, more than one mode (bimodal), or no mode at all.', 1),
    card('What is the range of a data set?', 'The difference between the largest and smallest values: range = maximum − minimum. It is the simplest measure of spread.', 1),
    card('Write the formula for the variance of a population, and define standard deviation.', 'Variance σ² = Σ(x − μ)²/n, the mean of the squared deviations from the mean μ. The standard deviation σ is the positive square root of the variance.', 3),
    card('State the addition rule of probability for two events A and B.', 'P(A ∪ B) = P(A) + P(B) − P(A ∩ B). If A and B are mutually exclusive, P(A ∩ B) = 0 and the rule reduces to P(A) + P(B).', 3),
    card('State the multiplication rule for two independent events.', 'If A and B are independent, P(A ∩ B) = P(A) × P(B) — the probability of both occurring is the product of their separate probabilities.', 2),
    card('Define the conditional probability P(A|B).', 'P(A|B) = P(A ∩ B)/P(B), provided P(B) > 0: the probability of A given that B has already occurred.', 3),
    card('Within what range must every probability lie, and what do the endpoints mean?', '0 ≤ P(E) ≤ 1 for every event E. P(E) = 0 means the event is impossible; P(E) = 1 means it is certain.', 1),
    card('A fair die is thrown once. What is the probability of obtaining a score greater than 4?', 'The favourable outcomes are 5 and 6, so P = 2/6 = 1/3.', 2, 'Count the favourable faces out of six equally likely faces.'),
  ],
  kinematics: [
    card('Distinguish between distance and displacement.', 'Distance is the total length of the path travelled (a scalar); displacement is the straight-line change in position from start to finish, with direction (a vector).', 1),
    card('Define acceleration and state its SI unit.', 'Acceleration is the rate of change of velocity, a = Δv/Δt; its SI unit is the metre per second squared (m/s²).', 1),
    card('What does the area under a velocity–time graph represent?', 'The displacement of the body over the time interval considered (area above the time axis is positive displacement, below it negative).', 2),
    card('What does the gradient of a displacement–time graph give?', 'The velocity of the body; the gradient at a point gives the instantaneous velocity, ds/dt.', 2, 'Gradient = rate of change.'),
    card('What is free fall?', 'Motion under the influence of gravity alone, with negligible air resistance; near the Earth’s surface the acceleration is g ≈ 9.81 m/s² directed downwards.', 2),
    card('Write the kinematic equation that gives displacement from the average of the initial and final velocities.', 's = ½(u + v)t, valid for uniform (constant) acceleration: displacement equals average velocity multiplied by time.', 2),
    card('What is the acceleration of a body moving with constant velocity?', 'Zero — acceleration is the rate of change of velocity, and a constant velocity (including rest) does not change.', 1),
    card('Write the formula for the horizontal range of a projectile launched with speed u at angle θ to the horizontal.', 'R = u² sin 2θ / g. For a given launch speed the range is greatest when θ = 45°, since sin 2θ is then 1.', 4),
    card('A car starts from rest and accelerates uniformly at 2 m/s² for 5 s. What is its final velocity?', 'v = u + at = 0 + (2)(5) = 10 m/s.', 2, '“Starts from rest” means u = 0.'),
    card('Define instantaneous velocity.', 'The velocity of a body at a particular instant: the limiting value of the average velocity as the time interval shrinks to zero, v = ds/dt.', 3),
  ],
  waves: [
    card('What is a wave?', 'A disturbance that transfers energy from one point to another without any net transfer of matter.', 1),
    card('Distinguish between transverse and longitudinal waves, giving one example of each.', 'In transverse waves the oscillations are perpendicular to the direction of travel (e.g. light, water ripples); in longitudinal waves they are parallel to it (e.g. sound in air).', 2),
    card('How are the period T and the frequency f of a wave related?', 'T = 1/f: the period is the reciprocal of the frequency. T is measured in seconds and f in hertz (Hz).', 1),
    card('State the law of reflection.', 'The angle of incidence equals the angle of reflection, both measured from the normal at the point of incidence, with the incident ray, reflected ray and normal all in one plane.', 2),
    card('Define the refractive index of a medium.', 'n = c/v: the ratio of the speed of light in a vacuum to its speed in the medium. Equivalently, n = sin i / sin r for light entering the medium from air.', 2),
    card('State Snell’s law of refraction.', 'n₁ sin θ₁ = n₂ sin θ₂, where θ₁ and θ₂ are the angles the ray makes with the normal in media of refractive indices n₁ and n₂.', 3),
    card('What is diffraction, and when is it most noticeable?', 'The spreading of waves as they pass through a gap or around an obstacle; it is greatest when the gap or obstacle is comparable in size to the wavelength.', 3),
    card('What is total internal reflection, and under what conditions does it occur?', 'The complete reflection of light back into a denser medium at a boundary with a less dense medium; it occurs only when light travels from the optically denser medium and the angle of incidence exceeds the critical angle.', 3),
    card('Define the critical angle and give its relation to refractive index.', 'The critical angle θc is the angle of incidence in the denser medium for which the angle of refraction is 90°; sin θc = n₂/n₁ where n₁ > n₂ (for a medium into air, sin θc = 1/n).', 4),
    card('State the thin lens formula.', '1/f = 1/u + 1/v, where f is the focal length, u the object distance and v the image distance, using a consistent sign convention.', 3),
  ],
  modern_physics: [
    card('What is the energy of a photon of frequency f?', 'E = hf, where h is Planck’s constant, 6.63 × 10⁻³⁴ J·s. Higher-frequency radiation (e.g. ultraviolet) carries more energy per photon than lower-frequency radiation (e.g. red light).', 2),
    card('What is the photoelectric effect?', 'The emission of electrons from a metal surface when electromagnetic radiation of sufficiently high frequency falls on it; no electrons are emitted below the threshold frequency, however intense the light.', 2),
    card('Write Einstein’s photoelectric equation.', 'hf = φ + ½mv²max: the photon energy hf equals the work function φ plus the maximum kinetic energy of the emitted photoelectrons.', 3),
    card('Define the work function of a metal.', 'The minimum energy needed to liberate an electron from the metal surface: φ = hf₀, where f₀ is the threshold frequency.', 2),
    card('State the mass–energy equivalence relation.', 'E = mc²: a mass m is equivalent to energy E, with c the speed of light; because c² is huge, a small mass converts into an enormous amount of energy (as in nuclear reactions).', 2),
    card('Define the half-life of a radioactive isotope.', 'The time taken for half of the radioactive nuclei in a sample to decay — equivalently, for the activity (count rate) to fall to half its initial value.', 2),
    card('State the Heisenberg uncertainty principle.', 'The position and momentum of a particle cannot both be known exactly at the same time: Δx·Δp ≥ ℏ/2, where ℏ = h/2π. The more precisely one is measured, the less precisely the other is known.', 4),
    card('What is meant by wave–particle duality?', 'Matter and radiation exhibit both wave-like behaviour (interference, diffraction) and particle-like behaviour (photoelectric effect, electron diffraction showing the wave nature of particles).', 3),
    card('Name the three common types of radioactive emission and identify each.', 'Alpha particles — helium nuclei (⁴₂He), strongly ionising, easily stopped; beta particles — fast electrons, moderately penetrating; gamma rays — high-energy electromagnetic radiation, very penetrating.', 2),
    card('What happens to the nucleus of an atom when it undergoes alpha decay?', 'It emits an alpha particle (⁴₂He), so its atomic number decreases by 2 and its mass number decreases by 4, producing a nucleus of a different element.', 2),
  ],
  bonding: [
    card('What is an ionic bond?', 'The strong electrostatic attraction between oppositely charged ions, formed when one atom transfers electron(s) to another — typically metal to non-metal, as in NaCl.', 1),
    card('What is a covalent bond?', 'A shared pair of electrons between two atoms, each atom (usually) contributing one electron — typical between non-metal atoms, as in H₂, Cl₂ and CH₄.', 1),
    card('What is a metallic bond?', 'The attraction between a lattice of positive metal ions and the sea of delocalised electrons surrounding them; it holds metal atoms together and explains metallic properties.', 2),
    card('How does the electronegativity difference between two atoms predict the bond type?', 'A large difference (roughly above 1.7) gives an ionic bond; a small or zero difference gives a non-polar covalent bond; an intermediate difference gives a polar covalent bond.', 3),
    card('Give three characteristic properties of ionic compounds.', 'High melting and boiling points; conduct electricity when molten or in aqueous solution but not when solid; usually soluble in water and brittle as solids.', 2),
    card('Give two characteristic properties of simple molecular covalent substances.', 'Low melting and boiling points (weak intermolecular forces only), and they do not conduct electricity because they contain no free ions or electrons.', 2),
    card('What is a coordinate (dative covalent) bond? Give one example.', 'A covalent bond in which both shared electrons are donated by the same atom — for example, the N→H bond in the ammonium ion NH₄⁺ or the O→H bond in H₃O⁺.', 3),
    card('What is hydrogen bonding, and which elements must be involved?', 'A strong dipole–dipole attraction between a hydrogen atom covalently bonded to nitrogen, oxygen or fluorine and a lone pair on N, O or F of a neighbouring molecule; it explains the unusually high boiling point of water.', 3),
    card('Why do metals conduct electricity?', 'Their delocalised electrons are free to move through the lattice of positive ions, carrying charge when a potential difference is applied.', 2),
    card('What are van der Waals forces?', 'Weak, short-range intermolecular attractions arising from temporary, fluctuating dipoles; present between all molecules and growing stronger as molecular size (number of electrons) increases.', 3),
  ],
  organic: [
    card('Write the general formula of the alkanes and name the simplest member.', 'CₙH₂ₙ₊₂; the simplest member is methane, CH₄ (n = 1). Alkanes are saturated hydrocarbons containing only single bonds.', 1),
    card('Write the general formula of the alkenes.', 'CₙH₂ₙ; alkenes are unsaturated hydrocarbons containing one carbon–carbon double bond, e.g. ethene C₂H₄.', 1),
    card('What is a homologous series?', 'A family of organic compounds with the same functional group and general formula, in which successive members differ by CH₂ and show a gradual trend in physical properties and similar chemical behaviour.', 2),
    card('What is a functional group? Give two examples.', 'The atom or group of atoms responsible for the characteristic chemical reactions of a compound — for example, the hydroxyl group −OH in alcohols, the carboxyl group −COOH in carboxylic acids, or the C=C double bond in alkenes.', 2),
    card('What are structural isomers?', 'Compounds that have the same molecular formula but different structural arrangements of atoms — for example, butane and 2-methylpropane are both C₄H₁₀.', 2),
    card('Name the compound CH₃CH₂CH₂OH.', 'Propan-1-ol: a three-carbon chain (propan-) with the hydroxyl group on carbon 1, making it a primary alcohol.', 2),
    card('Describe the chemical test for carbon–carbon unsaturation.', 'Add bromine water: alkenes and alkynes decolourise it (orange-brown to colourless) as Br₂ adds across the multiple bond; saturated compounds give no change.', 2),
    card('What is esterification?', 'The reaction of a carboxylic acid with an alcohol in the presence of an acid catalyst to form an ester and water — for example, ethanoic acid + ethanol → ethyl ethanoate + water.', 3),
    card('What is addition polymerisation? Give one example.', 'The joining of many unsaturated monomer molecules to form a long-chain polymer with no small molecule eliminated — for example, ethene polymerising to poly(ethene).', 3),
    card('What is cracking in petroleum chemistry?', 'The thermal or catalytic breaking of long-chain alkanes into shorter, more useful alkanes and alkenes; it converts heavy fractions into petrol-range fuels and feedstock alkenes.', 3),
  ],
  ecology: [
    card('Define an ecosystem.', 'A community of living organisms together with the non-living (abiotic) components of their environment, interacting as a functional unit — for example, a pond or a savanna.', 1),
    card('What is a food chain?', 'A linear sequence of organisms through which energy is transferred by feeding, starting with a producer (green plant) and passing through primary, secondary and tertiary consumers.', 1),
    card('What is a trophic level?', 'A feeding level in a food chain or web: producers occupy the first trophic level, herbivores the second, and successive carnivores the higher levels.', 2),
    card('State the 10% rule of energy transfer in ecosystems.', 'Only about 10% of the energy at one trophic level is passed on to the next; the rest is lost as heat from respiration, in waste and in uneaten remains — which is why food chains are short.', 3),
    card('Distinguish between a population and a community.', 'A population is all the individuals of one species living in an area; a community is all the populations of different species living and interacting in that area.', 2),
    card('What is an ecological niche?', 'The role and position of a species within its ecosystem — its habitat, what it eats, how it obtains energy and how it interacts with other organisms.', 3),
    card('Define the carrying capacity of an environment.', 'The maximum population size of a species that the environment can sustain indefinitely, given the available food, water, space and other resources.', 2),
    card('What is the role of decomposers in nutrient cycling?', 'Bacteria and fungi break down dead organisms and waste, releasing mineral nutrients (such as nitrates and phosphates) back into the soil for producers to reuse.', 2),
    card('What is ecological succession?', 'The orderly, directional change in the species composition of a community over time, from pioneer species through intermediate stages to a stable climax community.', 3),
    card('Name the three main types of symbiosis and describe each briefly.', 'Mutualism — both species benefit (e.g. bees and flowering plants); commensalism — one benefits and the other is unaffected; parasitism — one benefits at the expense of the host (e.g. tapeworm in the gut).', 3),
  ],
  physiology: [
    card('What is the cardiac cycle?', 'The sequence of events making up one heartbeat: atrial systole (atria contract, filling the ventricles), ventricular systole (ventricles contract, pumping blood to lungs and body) and diastole (the heart relaxes and refills); it lasts about 0.8 s at rest.', 3),
    card('Describe how a nerve impulse crosses a synapse.', 'The arriving impulse causes vesicles to release neurotransmitter into the synaptic cleft; the transmitter diffuses across, binds to receptors on the post-synaptic membrane and triggers a new impulse there.', 3),
    card('Outline the pathway of a reflex arc.', 'Receptor → sensory neurone → relay neurone in the spinal cord → motor neurone → effector (muscle or gland). The response is fast and involuntary because it does not involve the conscious brain.', 3),
    card('What is the functional unit of the kidney, and what two processes occur in it?', 'The nephron. Ultrafiltration of blood occurs at the glomerulus into the Bowman’s capsule, then selective reabsorption of useful substances (glucose, some water and salts) occurs along the tubule.', 3),
    card('Distinguish between nervous and hormonal control.', 'Nervous control uses electrical impulses along neurones and is fast, short-lived and targeted; hormonal control uses chemical messengers carried in the blood and is slower, longer-lasting and more widespread.', 3),
    card('Which hormone lowers blood glucose, and which organ secretes it?', 'Insulin, secreted by the islets of Langerhans in the pancreas; it stimulates liver and muscle cells to take up glucose and store it as glycogen. (Glucagon, from the same organ, raises blood glucose.)', 2),
    card('State three functions of the liver.', 'Any three of: production of bile for fat emulsification; deamination of excess amino acids (forming urea); detoxification of drugs and alcohol; storage of glucose as glycogen; breakdown of worn-out red blood cells; heat production.', 2),
    card('How does the body respond when the core temperature falls?', 'Arterioles near the skin constrict (vasoconstriction) to reduce heat loss, shivering generates heat through rapid muscle contraction, sweating stops, and hairs are raised to trap an insulating layer of air.', 3),
    card('Summarise the sliding filament theory of muscle contraction.', 'Using energy from ATP, myosin heads attach to actin filaments and pull them towards the centre of the sarcomere, so the actin and myosin filaments slide past each other and the muscle fibre shortens.', 4),
    card('Compare inhalation with exhalation in humans.', 'Inhalation: the diaphragm contracts and flattens and the external intercostal muscles raise the ribs, increasing thoracic volume and lowering pressure so air flows in. Exhalation is largely passive: the muscles relax, volume falls, pressure rises and air flows out.', 3),
  ],
};

// ---------------------------------------------------------------------------
// Self-validation (mirrors workers/api/flashcard-decks.ts field caps).
// ---------------------------------------------------------------------------
const FRONT_MAX = 1000;
const BACK_MAX = 2000;
const HINT_MAX = 500;

const normalize = (value) => value.trim().toLowerCase();

function existingSeedFronts(seedSql) {
  const section = seedSql.match(/INSERT INTO "flashcards"[\s\S]*?ON CONFLICT\(id\) DO NOTHING;/);
  if (!section) throw new Error('Could not locate FLASHCARDS insert in database/seed.sql');
  const fronts = [];
  for (const line of section[0].split('\n')) {
    if (!line.trimStart().startsWith("('fc_")) continue;
    const fields = [...line.matchAll(/'((?:[^']|'')*)'/g)].map((match) => match[1].replaceAll("''", "'"));
    fronts.push(fields[2]); // (id, deck_id, front, ...)
  }
  if (fronts.length !== 40) throw new Error(`Expected 40 seeded flashcard fronts, parsed ${fronts.length}`);
  return fronts;
}

function existingBatch1Fronts(batch1Json) {
  const batch = JSON.parse(batch1Json);
  if (batch.batchId !== 'flashcards-beta-001') throw new Error('Unexpected batchId in flashcards-beta-001.json');
  return batch.decks.flatMap((deck) => deck.cards.map((item) => item.front));
}

function validate() {
  const errors = [];
  const decks = existingShells;
  const seenFronts = new Map();
  let total = 0;

  for (const deck of decks) {
    const cards = cardsByDeck[deck.key];
    if (!cards) errors.push(`Missing cards for deck ${deck.key}`);
    if (cards.length !== 10) errors.push(`Deck ${deck.deckId} has ${cards.length} cards, expected 10`);
    cards.forEach((item, index) => {
      total += 1;
      const where = `${deck.deckId} card ${index + 1}`;
      if (typeof item.front !== 'string' || item.front.trim().length === 0) errors.push(`${where}: front is required`);
      else if (item.front.length > FRONT_MAX) errors.push(`${where}: front exceeds ${FRONT_MAX} chars (${item.front.length})`);
      if (typeof item.back !== 'string' || item.back.trim().length === 0) errors.push(`${where}: back is required`);
      else if (item.back.length > BACK_MAX) errors.push(`${where}: back exceeds ${BACK_MAX} chars (${item.back.length})`);
      if (item.hint !== null && (typeof item.hint !== 'string' || item.hint.length > HINT_MAX || item.hint.trim().length === 0)) {
        errors.push(`${where}: hint must be a non-empty string of at most ${HINT_MAX} chars`);
      }
      if (!Number.isInteger(item.difficulty) || item.difficulty < 1 || item.difficulty > 5) {
        errors.push(`${where}: difficulty must be an integer 1-5, got ${item.difficulty}`);
      }
      const key = normalize(item.front);
      if (seenFronts.has(key)) errors.push(`${where}: duplicate front within batch (also in ${seenFronts.get(key)})`);
      seenFronts.set(key, where);
    });
  }
  if (total !== 100) errors.push(`Expected 100 cards in total, found ${total}`);

  return Promise.all([
    readFile(resolve(repoRoot, 'database/seed.sql'), 'utf8'),
    readFile(resolve(repoRoot, 'content/batches/flashcards-beta-001.json'), 'utf8'),
  ]).then(([seedSql, batch1Json]) => {
    const seeded = new Set(existingSeedFronts(seedSql).map(normalize));
    const batch1 = new Set(existingBatch1Fronts(batch1Json).map(normalize));
    for (const [front, where] of seenFronts) {
      if (seeded.has(front)) errors.push(`${where}: front duplicates an existing seeded card: "${front}"`);
      if (batch1.has(front)) errors.push(`${where}: front duplicates a batch-1 card: "${front}"`);
    }
    return errors;
  });
}

// ---------------------------------------------------------------------------
// Emission.
// ---------------------------------------------------------------------------
const sql = (value) => (value == null ? 'NULL' : `'${String(value).replaceAll("'", "''")}'`);

const decks = existingShells;
const allCards = decks.flatMap((deck) => cardsByDeck[deck.key].map((item, index) => ({
  id: `fc_b002_${deck.key}_${String(index + 1).padStart(2, '0')}`,
  deckId: deck.deckId,
  front: item.front,
  back: item.back,
  hint: item.hint,
  difficulty: item.difficulty,
})));

const cardInsert = (item) => `INSERT OR IGNORE INTO flashcards (id, deck_id, front, back, image_url, hint, difficulty) VALUES (${sql(item.id)}, ${sql(item.deckId)}, ${sql(item.front)}, ${sql(item.back)}, NULL, ${sql(item.hint)}, ${item.difficulty});`;

const errors = await validate();
if (errors.length > 0) throw new Error(`Generated batch failed self-validation:\n${errors.join('\n')}`);

const batch = {
  batchId,
  status: 'automated_beta',
  generatedAt,
  provenance,
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
  decks: decks.map((deck) => ({
    deckId: deck.deckId,
    isNewDeck: false,
    cards: cardsByDeck[deck.key].map((item, index) => ({
      id: `fc_b002_${deck.key}_${String(index + 1).padStart(2, '0')}`,
      front: item.front,
      back: item.back,
      hint: item.hint,
      difficulty: item.difficulty,
    })),
  })),
};

const migrationFiles = [];

const CARDS_PER_PART = 24;
const partCount = Math.ceil(allCards.length / CARDS_PER_PART);
for (let part = 0; part < partCount; part += 1) {
  const number = 532 + part;
  const slice = allCards.slice(part * CARDS_PER_PART, (part + 1) * CARDS_PER_PART);
  migrationFiles.push([`${number}_flashcards_beta2_part_${part + 1}.sql`, [
    `-- ${number}: Original BrillaPrep flashcards, batch flashcards-beta-002, part ${part + 1} of ${partCount}.`,
    '-- Curriculum-aligned revision content; not official WAEC, NaCCA or NSMQ material.',
    'PRAGMA foreign_keys = ON;',
    ...slice.map(cardInsert),
  ]]);
}

const finalNumber = 532 + partCount;
const deckIds = decks.map((deck) => deck.deckId);
const guardName = `_migration_${finalNumber}_guard`;
migrationFiles.push([`${finalNumber}_flashcards_beta2_counts_guard.sql`, [
  `-- ${finalNumber}: Recompute card_count from actual rows and guard batch flashcards-beta-002.`,
  '-- card_count is maintained app-side on card add/delete (no trigger), so the seed-written',
  '-- static values are reconciled here against the actual card rows.',
  'PRAGMA foreign_keys = ON;',
  `UPDATE flashcard_decks SET card_count = (SELECT COUNT(*) FROM flashcards f WHERE f.deck_id = flashcard_decks.id), updated_at = datetime('now') WHERE id IN (${deckIds.map(sql).join(', ')});`,
  `CREATE TABLE IF NOT EXISTS ${guardName} (valid INTEGER NOT NULL CHECK (valid = 1));`,
  `DELETE FROM ${guardName};`,
  `INSERT INTO ${guardName}(valid) SELECT CASE WHEN (SELECT COUNT(*) FROM flashcards WHERE id LIKE 'fc_b002_%') = ${allCards.length} AND (SELECT COUNT(*) FROM flashcard_decks d WHERE d.id IN (${deckIds.map(sql).join(', ')}) AND d.card_count = 10 AND (SELECT COUNT(*) FROM flashcards f WHERE f.deck_id = d.id) = 10) = ${deckIds.length} THEN 1 ELSE 0 END;`,
  `DROP TABLE ${guardName};`,
]]);

await mkdir(resolve(outputRoot, 'content/batches'), { recursive: true });
await mkdir(resolve(outputRoot, 'database/migrations'), { recursive: true });
const outBatch = resolve(outputRoot, `content/batches/${batchId}.json`);
await writeFile(outBatch, `${JSON.stringify(batch, null, 2)}\n`);

const written = [];
for (const [name, lines] of migrationFiles) {
  const content = `${lines.join('\n')}\n`;
  const crlfBytes = Buffer.byteLength(content.replace(/\n/g, '\r\n'), 'utf8');
  if (crlfBytes > 19_000) throw new Error(`Migration ${name} would exceed the remote D1 query limit (${crlfBytes} bytes with CRLF)`);
  const path = resolve(outputRoot, 'database/migrations', name);
  await writeFile(path, content);
  written.push(path);
}

console.log(JSON.stringify({
  batchId,
  cards: allCards.length,
  decks: deckIds,
  outBatch,
  migrations: written,
}, null, 2));
