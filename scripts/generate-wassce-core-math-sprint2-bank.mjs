import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeQuestionText, validateQuestionBatch } from './question-content-lib.mjs';

const sourceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputRootArgument = process.argv.indexOf('--output-root');
if (outputRootArgument >= 0 && !process.argv[outputRootArgument + 1]) throw new Error('--output-root requires a path');
const outputRoot = outputRootArgument >= 0 ? resolve(process.argv[outputRootArgument + 1]) : sourceRoot;
const generatedAt = '2026-09-09T13:00:00Z';
const labels = ['A', 'B', 'C', 'D'];
const batchId = 'wassce-core-math-sprint2-001';
const contentLabel = 'Original BrillaPrep curriculum-aligned WASSCE Core Mathematics practice questions; not official WAEC (West African Examinations Council) examination material. Use the enabled feedback channel to report corrections.';
const releaseSourceUrl = 'https://nacca.gov.gh/secondary-education-curriculum/';

const curriculumSource = {
  publisher: 'National Council for Curriculum and Assessment, Ghana',
  title: 'Secondary Education Curriculum — Core Mathematics',
  url: releaseSourceUrl,
  use: 'curriculum_blueprint_only',
};

// Topic ids are the prod-canonical rows for subj_wassce_core_math (verified
// read-only against brilla-db on 2026-09-09). The six topic_wcoremath_* and
// topic_wassce_p2_math_num rows are the sprint-1 set; topic_wassce_p2_math_men,
// topic_wassce_p2_math_rat and topic_wassce_p2_math_prb are the highest-priority
// NEW gap topics from artifacts/content-coverage-latest.json (topic_wcoremath_calculus
// is skipped: calculus is not in the WASSCE Core Mathematics syllabus).
// Migration 442 re-asserts every row with INSERT OR IGNORE.
const topics = [
  ['WCM-ALG', 'topic_wcoremath_algebra', 'Algebra',
    'Simplify expressions, solve linear and simultaneous equations and rearrange formulae accurately.'],
  ['WCM-QDR', 'topic_wcoremath_quadratic', 'Quadratic Equations',
    'Factorise and solve quadratic equations and analyse their roots using the discriminant.'],
  ['WCM-GEO', 'topic_wcoremath_geometry', 'Geometry',
    'Apply angle, triangle, polygon and circle properties to calculate unknown measures.'],
  ['WCM-TRG', 'topic_wcoremath_trigonometry', 'Trigonometry',
    'Use trigonometric ratios and Pythagoras to solve right-angled triangle problems.'],
  ['WCM-STA', 'topic_wcoremath_statistics', 'Statistics & Probability',
    'Compute measures of central tendency and the probabilities of simple events.'],
  ['WCM-NUM', 'topic_wassce_p2_math_num', 'Number and numeration',
    'Apply fractions, percentages, ratio, approximation and commercial arithmetic to everyday problems.'],
  ['WCM-MEN', 'topic_wassce_p2_math_men', 'Mensuration',
    'Calculate perimeters, areas, surface areas and volumes of plane figures and solids.'],
  ['WCM-RAT', 'topic_wassce_p2_math_rat', 'Ratio and proportion',
    'Simplify ratios, share quantities in a given ratio and solve direct and inverse proportion problems.'],
  ['WCM-PRB', 'topic_wassce_p2_math_prb', 'Probability',
    'Compute probabilities of single and compound events with and without replacement.'],
];

const q = (topicCode, difficulty, prompt, correct, wrong, solution, commandWord, assessmentObjective) =>
  ({ topicCode, type: 'multiple_choice', difficulty, prompt, correct, wrong, solution, commandWord, assessmentObjective });
const calc = (topicCode, difficulty, prompt, answer, solution, commandWord, assessmentObjective) =>
  ({ topicCode, type: 'calculation', difficulty, prompt, answer, solution, commandWord, assessmentObjective });

const questions = [
  // --- Algebra (topic_wcoremath_algebra): 1 medium MCQ, 1 hard MCQ, 2 calculation
  q('WCM-ALG', 'medium', 'Solve the equation 2x + 3 = x + 9.', 'x = 6', ['x = 3', 'x = 4', 'x = 12'],
    'Subtract x from both sides: x + 3 = 9. Then subtract 3 from both sides: x = 6. Check: 2(6) + 3 = 15 and 6 + 9 = 15, as required.', 'Solve', 'AO2'),
  q('WCM-ALG', 'hard', 'Solve the equation (2x − 1)/3 + (x + 4)/2 = 4.', 'x = 2', ['x = 4', 'x = 14', 'x = 3'],
    'Multiply every term by 6, the LCM of 3 and 2: 2(2x − 1) + 3(x + 4) = 24, so 4x − 2 + 3x + 12 = 24. Hence 7x + 10 = 24, giving 7x = 14 and x = 2.', 'Solve', 'AO3'),
  calc('WCM-ALG', 'medium', 'Solve the simultaneous equations 2x + 3y = 12 and x + y = 5.', 'x = 3 and y = 2',
    'From the second equation, x = 5 − y. Substituting into the first: 2(5 − y) + 3y = 12, so 10 − 2y + 3y = 12, giving y = 2. Then x = 5 − 2 = 3. Check: 2(3) + 3(2) = 6 + 6 = 12, as required. Answer: x = 3 and y = 2.', 'Solve', 'AO2'),
  calc('WCM-ALG', 'hard', 'Make x the subject of the formula y = (3x − 2)/(x + 5).', 'x = (5y + 2)/(3 − y)',
    'Multiply both sides by (x + 5): y(x + 5) = 3x − 2, so xy + 5y = 3x − 2. Collect the terms in x: xy − 3x = −2 − 5y, so x(y − 3) = −(5y + 2). Dividing both sides by (y − 3) gives x = −(5y + 2)/(y − 3), which simplifies to x = (5y + 2)/(3 − y). Answer: x = (5y + 2)/(3 − y).', 'Rearrange', 'AO3'),

  // --- Quadratic Equations (topic_wcoremath_quadratic): 1 medium MCQ, 1 hard MCQ, 2 calculation
  q('WCM-QDR', 'medium', 'Find the product of the roots of the equation x² + 2x − 15 = 0.', '−15', ['15', '−2', '2'],
    'For ax² + bx + c = 0 the product of the roots is c/a. Here c = −15 and a = 1, so the product is −15. (−2 is the sum of the roots, −b/a = −2 — a common confusion.)', 'Find', 'AO2'),
  q('WCM-QDR', 'hard', 'The roots of 2x² − 3x − 5 = 0 are α and β. Find the value of 1/α + 1/β.', '−3/5', ['3/5', '−5/3', '−3/10'],
    'The sum of the roots is α + β = −(−3)/2 = 3/2 and the product is αβ = −5/2. Then 1/α + 1/β = (α + β)/(αβ) = (3/2) ÷ (−5/2) = (3/2) × (−2/5) = −3/5.', 'Find', 'AO3'),
  calc('WCM-QDR', 'medium', 'Solve the equation x² + 4x − 5 = 0 by completing the square.', 'x = 1 or x = −5',
    'Complete the square: x² + 4x − 5 = (x + 2)² − 4 − 5 = (x + 2)² − 9 = 0. So (x + 2)² = 9, giving x + 2 = ±3. Hence x = 3 − 2 = 1 or x = −3 − 2 = −5. Check by factorising: (x − 1)(x + 5) = 0 gives the same roots. Answer: x = 1 or x = −5.', 'Solve', 'AO2'),
  calc('WCM-QDR', 'hard', 'Find the set of values of k for which the equation x² + 4x + k = 0 has real roots.', 'k ≤ 4',
    'Real roots require the discriminant to be non-negative: b² − 4ac ≥ 0. Here a = 1 and b = 4, so 4² − 4(1)(k) ≥ 0, giving 16 − 4k ≥ 0, hence 4k ≤ 16 and k ≤ 4. Answer: k ≤ 4.', 'Find', 'AO3'),

  // --- Geometry (topic_wcoremath_geometry): 1 medium MCQ, 1 hard MCQ, 2 calculation
  q('WCM-GEO', 'medium', 'The angles of a triangle are x°, 2x° and 3x°. Find the size of the largest angle.', '90°', ['30°', '60°', '120°'],
    'The angles of a triangle sum to 180°: x + 2x + 3x = 6x = 180, so x = 30. The largest angle is 3x = 3 × 30 = 90°. (30° is only the smallest angle.)', 'Find', 'AO2'),
  q('WCM-GEO', 'hard', 'Each interior angle of a regular polygon is 156°. How many sides does the polygon have?', '15', ['12', '18', '20'],
    'Each exterior angle is 180° − 156° = 24°. The exterior angles of any polygon sum to 360°, so the number of sides is 360 ÷ 24 = 15.', 'Find', 'AO3'),
  calc('WCM-GEO', 'medium', 'O is the centre of a circle; A, B and C are points on its circumference with C on the major arc AB. If angle AOB = 130°, calculate angle ACB.', '65°',
    'The angle subtended at the centre of a circle is twice the angle subtended at the circumference by the same arc. Since C lies on the major arc, angle ACB = 130° ÷ 2 = 65°. Answer: 65°.', 'Calculate', 'AO2'),
  calc('WCM-GEO', 'hard', 'The sum of the interior angles of a polygon is 1,260°. Calculate the number of sides of the polygon.', '9 sides',
    'A polygon with n sides has interior-angle sum (n − 2) × 180°. Setting (n − 2) × 180 = 1,260 gives n − 2 = 1,260 ÷ 180 = 7, so n = 9. Check: (9 − 2) × 180 = 7 × 180 = 1,260°, as required. Answer: the polygon has 9 sides.', 'Calculate', 'AO3'),

  // --- Trigonometry (topic_wcoremath_trigonometry): 1 medium MCQ, 1 hard MCQ, 2 calculation
  q('WCM-TRG', 'medium', 'A right-angled triangle has a hypotenuse of 13 cm and one side of 5 cm. Find the length of the third side.', '12 cm', ['8 cm', '18 cm', '√194 cm'],
    'By the theorem of Pythagoras, the third side is √(13² − 5²) = √(169 − 25) = √144 = 12 cm. (√194 cm comes from adding the squares, which applies only when both given sides are the shorter ones.)', 'Find', 'AO2'),
  q('WCM-TRG', 'hard', 'A ladder 10 m long leans against a vertical wall, making an angle of 60° with the horizontal ground. How far is the foot of the ladder from the wall?', '5 m', ['8.7 m', '10 m', '5√3 m'],
    'The distance from the wall is the side adjacent to the 60° angle, with the ladder as hypotenuse: 10 × cos 60° = 10 × 0.5 = 5 m. (10 sin 60° ≈ 8.7 m is the height reached up the wall, not the distance asked for.)', 'Calculate', 'AO3'),
  calc('WCM-TRG', 'medium', 'A kite is at the end of a taut string 50 m long that makes an angle of 30° with the horizontal. Calculate the height of the kite above the ground.', '25 m',
    'The height is the side opposite the 30° angle in the right-angled triangle, with the string as hypotenuse: h = 50 × sin 30° = 50 × 0.5 = 25 m. Answer: the kite is 25 m above the ground.', 'Calculate', 'AO2'),
  calc('WCM-TRG', 'hard', 'From the top of a cliff 40 m high, the angle of depression of a boat at sea is 30°. Calculate the distance of the boat from the foot of the cliff, leaving your answer in surd form.', '40√3 m',
    'The angle of depression from the top equals the angle of elevation from the boat (alternate angles). In the right-angled triangle, tan 30° = 40/d, so d = 40 ÷ tan 30° = 40 ÷ (1/√3) = 40√3 m. Answer: the boat is 40√3 m from the foot of the cliff.', 'Calculate', 'AO3'),

  // --- Statistics & Probability (topic_wcoremath_statistics): 1 medium MCQ, 1 hard MCQ, 2 calculation
  q('WCM-STA', 'medium', 'The mean of five numbers is 8. Four of the numbers are 6, 9, 7 and 12. Find the fifth number.', '6', ['8', '8.5', '4'],
    'The five numbers total 5 × 8 = 40. The four known numbers total 6 + 9 + 7 + 12 = 34, so the fifth number is 40 − 34 = 6. (8.5 is the mean of the four given numbers only.)', 'Find', 'AO2'),
  q('WCM-STA', 'hard', 'A fair die is thrown twice. What is the probability that the two scores add up to 9?', '1/9', ['1/6', '1/12', '5/36'],
    'There are 6 × 6 = 36 equally likely outcomes. The outcomes totalling 9 are (3, 6), (4, 5), (5, 4) and (6, 3) — four of them — so the probability is 4/36 = 1/9.', 'Calculate', 'AO3'),
  calc('WCM-STA', 'medium', 'The marks of eight students in a test are 5, 6, 8, 8, 9, 10, 12 and 14. Calculate the mean mark.', '9',
    'The sum of the marks is 5 + 6 + 8 + 8 + 9 + 10 + 12 + 14 = 72. Dividing the total by the number of students gives the mean: 72 ÷ 8 = 9. Answer: the mean mark is 9.', 'Calculate', 'AO2'),
  calc('WCM-STA', 'hard', 'A box contains 3 green balls and 5 yellow balls. Two balls are picked at random, one after the other, without replacement. Find the probability that they are of different colours.', '15/28',
    'P(green then yellow) = (3/8) × (5/7) = 15/56, and P(yellow then green) = (5/8) × (3/7) = 15/56. The two cases are mutually exclusive, so add them: 15/56 + 15/56 = 30/56 = 15/28. Answer: 15/28.', 'Find', 'AO3'),

  // --- Number and numeration (topic_wassce_p2_math_num): 1 medium MCQ, 1 hard MCQ, 2 calculation
  q('WCM-NUM', 'medium', 'Express 2.5% as a fraction in its lowest terms.', '1/40', ['1/4', '1/25', '1/400'],
    '2.5% = 2.5/100 = 25/1000. Dividing the numerator and denominator by 25 gives 1/40. (1/400 would be 0.25%, ten times smaller.)', 'Express', 'AO2'),
  q('WCM-NUM', 'hard', 'A trader buys a bicycle for GH₵400.00 and sells it at a loss of 15%. Find the selling price.', 'GH₵340.00', ['GH₵60.00', 'GH₵385.00', 'GH₵460.00'],
    'The loss is 15% of 400 = (15/100) × 400 = GH₵60.00, so the selling price is 400 − 60 = GH₵340.00. (GH₵60.00 is the loss itself, not the selling price.)', 'Find', 'AO3'),
  calc('WCM-NUM', 'medium', 'Calculate the compound interest on GH₵5,000.00 invested at 10% per annum for 2 years.', 'GH₵1,050.00',
    'After the first year the amount is 5,000 × 1.10 = GH₵5,500.00. After the second year it is 5,500 × 1.10 = GH₵6,050.00. The compound interest is 6,050 − 5,000 = GH₵1,050.00. Answer: GH₵1,050.00.', 'Calculate', 'AO2'),
  calc('WCM-NUM', 'hard', 'A machine valued at GH₵8,000.00 depreciates by 25% each year. Calculate its value after 2 years.', 'GH₵4,500.00',
    'Each year the value is multiplied by (100 − 25)/100 = 0.75. After the first year: 8,000 × 0.75 = GH₵6,000.00. After the second year: 6,000 × 0.75 = GH₵4,500.00. Equivalently, 8,000 × 0.75² = 8,000 × 0.5625 = GH₵4,500.00. Answer: GH₵4,500.00.', 'Calculate', 'AO3'),

  // --- Mensuration (topic_wassce_p2_math_men) — NEW gap topic: 4 easy, 4 medium MCQ
  q('WCM-MEN', 'easy', 'Calculate the area of a rectangle with length 14 cm and width 6 cm.', '84 cm²', ['20 cm²', '40 cm²', '168 cm²'],
    'Area of a rectangle = length × width = 14 × 6 = 84 cm². (40 cm is the perimeter 2(14 + 6), a common mix-up.)', 'Calculate', 'AO1'),
  q('WCM-MEN', 'easy', 'Taking π = 22/7, calculate the circumference of a circle of radius 7 cm.', '44 cm', ['22 cm', '154 cm', '88 cm'],
    'Circumference = 2πr = 2 × (22/7) × 7 = 2 × 22 = 44 cm. (154 cm² is πr², the area, not the circumference.)', 'Calculate', 'AO1'),
  q('WCM-MEN', 'easy', 'Find the area of a triangle with base 8 cm and height 9 cm.', '36 cm²', ['72 cm²', '17 cm²', '40 cm²'],
    'Area of a triangle = ½ × base × height = ½ × 8 × 9 = 36 cm². (72 cm² forgets the ½, treating the triangle as a rectangle.)', 'Find', 'AO1'),
  q('WCM-MEN', 'easy', 'A cuboid has length 10 cm, width 6 cm and volume 240 cm³. Find its height.', '4 cm', ['24 cm', '40 cm', '16 cm'],
    'Volume = length × width × height, so height = volume ÷ (length × width) = 240 ÷ (10 × 6) = 240 ÷ 60 = 4 cm.', 'Find', 'AO1'),
  q('WCM-MEN', 'medium', 'Taking π = 22/7, calculate the area of a circle of radius 14 cm.', '616 cm²', ['88 cm²', '308 cm²', '1,232 cm²'],
    'Area = πr² = (22/7) × 14² = (22/7) × 196 = 22 × 28 = 616 cm². (88 cm is the circumference 2πr, and 308 cm² uses r = 7 instead of r² = 14².)', 'Calculate', 'AO2'),
  q('WCM-MEN', 'medium', 'A cylinder has radius 7 cm and height 5 cm. Taking π = 22/7, calculate its volume.', '770 cm³', ['110 cm³', '220 cm³', '1,540 cm³'],
    'Volume = πr²h = (22/7) × 7² × 5 = 22 × 7 × 5 = 770 cm³. (220 cm² is 2πrh, the curved surface area, not the volume.)', 'Calculate', 'AO2'),
  q('WCM-MEN', 'medium', 'Calculate the total surface area of a cube of edge 3 cm.', '54 cm²', ['27 cm²', '9 cm²', '36 cm²'],
    'Each face of the cube has area 3 × 3 = 9 cm², and a cube has 6 identical faces, so the total surface area is 6 × 9 = 54 cm². (27 is the volume 3³ in cm³, the wrong measure.)', 'Calculate', 'AO2'),
  q('WCM-MEN', 'medium', 'A trapezium has parallel sides of lengths 8 cm and 12 cm, and the perpendicular distance between them is 5 cm. Calculate its area.', '50 cm²', ['100 cm²', '40 cm²', '60 cm²'],
    'Area = ½ × (sum of parallel sides) × height = ½ × (8 + 12) × 5 = ½ × 20 × 5 = 50 cm². (100 cm² omits the ½.)', 'Calculate', 'AO2'),

  // --- Ratio and proportion (topic_wassce_p2_math_rat) — NEW gap topic: 4 easy, 4 medium MCQ
  q('WCM-RAT', 'easy', 'Express the ratio 15 : 25 in its simplest form.', '3 : 5', ['5 : 3', '1 : 2', '3 : 4'],
    'Divide both parts by their highest common factor, 5: 15 ÷ 5 = 3 and 25 ÷ 5 = 5, giving 3 : 5.', 'Express', 'AO1'),
  q('WCM-RAT', 'easy', 'GH₵60.00 is shared between two people in the ratio 1 : 2. How much is the smaller share?', 'GH₵20.00', ['GH₵40.00', 'GH₵30.00', 'GH₵12.00'],
    'Total parts = 1 + 2 = 3, so one part is 60 ÷ 3 = GH₵20.00. The smaller share is one part: GH₵20.00. (GH₵40.00 is the larger share.)', 'Calculate', 'AO1'),
  q('WCM-RAT', 'easy', 'Three identical pencils cost GH₵4.50 altogether. What is the cost of one pencil?', 'GH₵1.50', ['GH₵13.50', 'GH₵1.25', 'GH₵7.50'],
    'Unit cost = total cost ÷ quantity = 4.50 ÷ 3 = GH₵1.50. (GH₵13.50 multiplies by 3 instead of dividing.)', 'Calculate', 'AO1'),
  q('WCM-RAT', 'easy', 'On a map of scale 1 : 50,000, two towns are 4 cm apart. Find the actual distance between the towns in kilometres.', '2 km', ['20 km', '200 km', '0.2 km'],
    'Actual distance = 4 × 50,000 = 200,000 cm. Converting: 200,000 cm ÷ 100 = 2,000 m, and 2,000 m ÷ 1,000 = 2 km.', 'Find', 'AO1'),
  q('WCM-RAT', 'medium', 'The ratio of boys to girls in a class is 4 : 5. If there are 36 students in the class, how many are girls?', '20', ['16', '18', '24'],
    'Total parts = 4 + 5 = 9, so one part represents 36 ÷ 9 = 4 students. Girls take 5 parts: 5 × 4 = 20. (16 is the number of boys.)', 'Calculate', 'AO2'),
  q('WCM-RAT', 'medium', 'Three friends share GH₵540.00 in the ratio 2 : 3 : 4. Find the largest share.', 'GH₵240.00', ['GH₵180.00', 'GH₵120.00', 'GH₵60.00'],
    'Total parts = 2 + 3 + 4 = 9, so one part is 540 ÷ 9 = GH₵60.00. The largest share is 4 × 60 = GH₵240.00. (GH₵60.00 is only the value of one part.)', 'Find', 'AO2'),
  q('WCM-RAT', 'medium', 'Eight workers can build a wall in 15 days. Working at the same rate, how many days will it take 12 workers to build the same wall?', '10 days', ['22.5 days', '20 days', '8 days'],
    'The job needs 8 × 15 = 120 worker-days. With 12 workers the time is 120 ÷ 12 = 10 days. (22.5 days wrongly uses direct proportion; more workers means fewer days.)', 'Calculate', 'AO2'),
  q('WCM-RAT', 'medium', 'A car uses 12 litres of petrol to travel 150 km. At the same rate, how many litres are needed to travel 400 km?', '32 litres', ['36 litres', '28 litres', '40 litres'],
    'Petrol per kilometre = 12 ÷ 150 = 0.08 litres, so for 400 km the car needs 0.08 × 400 = 32 litres. Equivalently, 12 × (400/150) = 32 litres.', 'Calculate', 'AO2'),

  // --- Probability (topic_wassce_p2_math_prb) — NEW gap topic: 4 easy, 4 medium MCQ
  q('WCM-PRB', 'easy', 'A fair coin is tossed once. What is the probability of obtaining a tail?', '1/2', ['1', '1/3', '1/4'],
    'A fair coin has two equally likely outcomes, head and tail, so P(tail) = 1/2.', 'Calculate', 'AO1'),
  q('WCM-PRB', 'easy', 'A bag contains 3 red balls and 7 blue balls. One ball is picked at random. What is the probability that it is red?', '3/10', ['3/7', '7/10', '1/3'],
    'There are 3 red balls out of 3 + 7 = 10 equally likely balls, so P(red) = 3/10. (3/7 wrongly compares red to blue instead of red to the total; 7/10 is the probability of blue.)', 'Calculate', 'AO1'),
  q('WCM-PRB', 'easy', 'A letter is chosen at random from the word MATHS. What is the probability that it is a vowel?', '1/5', ['2/5', '1/2', '4/5'],
    'The word MATHS has 5 letters and only one vowel (A), so P(vowel) = 1/5. (2/5 wrongly counts two vowels; only A qualifies.)', 'Calculate', 'AO1'),
  q('WCM-PRB', 'easy', 'A fair die is thrown once. Find the probability of obtaining a number greater than 4.', '1/3', ['1/2', '2/3', '1/6'],
    'The outcomes greater than 4 are 5 and 6 — two of the six equally likely outcomes — so the probability is 2/6 = 1/3. (1/6 is the probability of one specific number.)', 'Find', 'AO1'),
  q('WCM-PRB', 'medium', 'Two fair dice are thrown together. What is the probability of obtaining a double (both dice showing the same number)?', '1/6', ['1/36', '1/12', '1/3'],
    'Of the 6 × 6 = 36 equally likely outcomes, six are doubles: (1,1), (2,2), …, (6,6). Hence P(double) = 6/36 = 1/6. (1/36 is the probability of one specific double, such as (3,3).)', 'Calculate', 'AO2'),
  q('WCM-PRB', 'medium', 'A bag contains 4 white balls and 6 black balls. A ball is picked at random and replaced, then a second ball is picked. Find the probability that both balls are black.', '9/25', ['1/3', '3/5', '9/20'],
    'Because the first ball is replaced, the draws are independent and P(black) = 6/10 = 3/5 each time. Hence P(both black) = (3/5) × (3/5) = 9/25. (1/3 is close to 30/90, the without-replacement value.)', 'Find', 'AO2'),
  q('WCM-PRB', 'medium', 'The probability that it rains on a given day is 0.3. What is the probability that it does not rain on that day?', '0.7', ['0.3', '0.6', '1.3'],
    'Raining and not raining are complementary events whose probabilities sum to 1, so P(no rain) = 1 − 0.3 = 0.7. (1.3 is impossible: no probability can exceed 1.)', 'Calculate', 'AO2'),
  q('WCM-PRB', 'medium', 'A number is chosen at random from the integers 1 to 20 inclusive. What is the probability that it is a multiple of 3?', '3/10', ['7/20', '1/3', '1/4'],
    'The multiples of 3 from 1 to 20 are 3, 6, 9, 12, 15 and 18 — six numbers — so the probability is 6/20 = 3/10. (7/20 wrongly counts 21, which is outside the range.)', 'Calculate', 'AO2'),
];

// --- Batch assembly ---------------------------------------------------------
function buildQuestion(source, sequence, mcqPosition) {
  const id = `q_was_coremath_s2_${String(sequence).padStart(3, '0')}`;
  const base = {
    id,
    original: true,
    topicCode: source.topicCode,
    type: source.type,
    prompt: source.prompt,
    difficulty: source.difficulty,
    commandWord: source.commandWord,
    assessmentObjective: source.assessmentObjective,
    provenance: [curriculumSource],
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
          : 'This is a plausible misconception, but it does not follow from the calculation in the worked solution.',
      })),
      correctAnswer: labels[correctIndex],
      workedSolution: `${source.solution} Therefore the correct answer is ${labels[correctIndex]}: ${source.correct}.`,
      marks: 1,
      points: 1,
      timeLimit: 90,
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
  examTypeId: 'exam_wassce',
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
    subjectId: 'subj_wassce_core_math',
    specificationCode: 'BRILLA-WASSCE-COREMATH-S2-001',
    sources: [curriculumSource],
    topics: topics.map(([code, , title, objective]) => ({ code, title, objective })),
    questions: builtQuestions,
  }],
};

// --- Validation -------------------------------------------------------------
const officialAttributionPattern = /\b(?:official\s+(?:waec|west african examinations council)|(?:waec|west african examinations council)[ -](?:approved|endorsed|authored|issued|certified))\b/i;
const nonOfficialDisclaimerPattern = /\b(?:not|non[- ]?)\s+official\s+(?:waec|west african examinations council)\b/i;
const nonOfficialDisclaimerGlobalPattern = /\b(?:not|non[- ]?)\s+official\s+(?:waec|west african examinations council)\b/gi;

function assertNoFalseOfficialClaim(value, field, errors) {
  const withoutDisclaimer = String(value ?? '').replace(nonOfficialDisclaimerGlobalPattern, '');
  if (officialAttributionPattern.test(withoutDisclaimer)) errors.push(`${field} contains a false official-exam-board claim`);
}

const validation = validateQuestionBatch(batch, { mode: 'draft' });

// Sprint-1 topics finish their remaining coverage cells (1 medium MCQ, 1 hard
// MCQ and 2 calculations); each NEW gap topic receives 4 easy + 4 medium MCQs.
const expectedCells = {
  'WCM-ALG': { easy: 0, mediumMcq: 1, hardMcq: 1, calc: 2 },
  'WCM-QDR': { easy: 0, mediumMcq: 1, hardMcq: 1, calc: 2 },
  'WCM-GEO': { easy: 0, mediumMcq: 1, hardMcq: 1, calc: 2 },
  'WCM-TRG': { easy: 0, mediumMcq: 1, hardMcq: 1, calc: 2 },
  'WCM-STA': { easy: 0, mediumMcq: 1, hardMcq: 1, calc: 2 },
  'WCM-NUM': { easy: 0, mediumMcq: 1, hardMcq: 1, calc: 2 },
  'WCM-MEN': { easy: 4, mediumMcq: 4, hardMcq: 0, calc: 0 },
  'WCM-RAT': { easy: 4, mediumMcq: 4, hardMcq: 0, calc: 0 },
  'WCM-PRB': { easy: 4, mediumMcq: 4, hardMcq: 0, calc: 0 },
};

function inHouseValidation(errors) {
  if (batch.review.automatedChecksAt !== generatedAt) errors.push('review.automatedChecksAt mismatch');
  if (batch.release.channel !== 'beta') errors.push('release.channel must be beta');
  if (typeof batch.release.contentLabel !== 'string' || batch.release.contentLabel.trim().length < 40) errors.push('release.contentLabel too short');
  if (!nonOfficialDisclaimerPattern.test(batch.release.contentLabel)) errors.push('release.contentLabel must explicitly state the content is not official WAEC material');
  if (batch.release.officialExamBoardContent !== false) errors.push('release.officialExamBoardContent must be false');
  if (batch.release.feedbackEnabled !== true) errors.push('release.feedbackEnabled must be true');
  assertNoFalseOfficialClaim(batch.release.contentLabel, 'release.contentLabel', errors);

  const letterCounts = { A: 0, B: 0, C: 0, D: 0 };
  const perTopic = new Map(topics.map(([code]) => [code, { easy: 0, mediumMcq: 0, hardMcq: 0, calc: 0 }]));
  for (const subject of batch.subjects) {
    for (const question of subject.questions) {
      const cell = perTopic.get(question.topicCode);
      if (!cell) { errors.push(`${question.id}: unknown topicCode ${question.topicCode}`); continue; }
      if (question.type === 'multiple_choice') {
        if (question.difficulty === 'easy') cell.easy += 1;
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
    if (actual.easy !== expected.easy || actual.mediumMcq !== expected.mediumMcq || actual.hardMcq !== expected.hardMcq || actual.calc !== expected.calc) {
      errors.push(`${code}: expected ${JSON.stringify(expected)}, found ${JSON.stringify(actual)}`);
    }
  }
  for (const label of labels) {
    if (letterCounts[label] !== 9) errors.push(`correct answer letter ${label} should appear 9 times, found ${letterCounts[label]}`);
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
    subject_id: 'subj_wassce_core_math',
    exam_type_id: 'exam_wassce',
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
    exam_board_id: 'board_waec',
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

let migrationNumber = 442;
{
  // Canonical topic rows: on prod and on fresh baselines (prod patch 095 and
  // migration 364 create them) every id already exists, so these no-op. They
  // exist so a scratch baseline without the patch still has the bindings.
  // The slug is derived from the canonical id rather than copied from the
  // legacy row: legacy seed/patch rows own the human slugs on fresh baselines
  // and topics is UNIQUE(subject_id, slug).
  const canonicalTopicRows = [
    ['topic_wcoremath_algebra', 'Algebra', 'Manipulate symbols, solve linear and simultaneous equations and rearrange formulae.', 'Algebraic fluency underpins WASSCE Core Mathematics: collect like terms, expand and factorise expressions, solve linear and simultaneous equations, and change the subject of a formula.', '["ax + b = c → x = (c − b)/a", "(a + b)² = a² + 2ab + b²", "a² − b² = (a + b)(a − b)"]', 1],
    ['topic_wcoremath_quadratic', 'Quadratic Equations', 'Solve and analyse quadratic equations and their roots.', 'Quadratic equations are solved by factorisation, completing the square or the formula; the discriminant b² − 4ac determines the nature of the roots.', '["x = (−b ± √(b² − 4ac))/2a", "sum of roots = −b/a", "product of roots = c/a", "equal roots ⇔ b² − 4ac = 0"]', 2],
    ['topic_wcoremath_geometry', 'Geometry', 'Apply properties of angles, triangles, polygons and circles to measurements.', 'Geometry covers angle relationships, properties of triangles and polygons, and circle theorems used to calculate unknown angles and lengths.', '["Angles in a triangle sum to 180°", "Angles on a straight line sum to 180°", "Exterior angles of a polygon sum to 360°", "Angle at centre = 2 × angle at circumference"]', 3],
    ['topic_wcoremath_trigonometry', 'Trigonometry', 'Use trigonometric ratios and identities for right-angled triangles.', 'Trigonometry relates the sides and angles of right-angled triangles through sine, cosine and tangent, together with the theorem of Pythagoras.', '["sin θ = opposite/hypotenuse", "cos θ = adjacent/hypotenuse", "tan θ = opposite/adjacent", "sin²θ + cos²θ = 1", "a² + b² = c²"]', 4],
    ['topic_wcoremath_statistics', 'Statistics & Probability', 'Analyse data with averages and compute probabilities of events.', 'Statistics summarises data with the mean, median, mode and range; probability measures the likelihood of equally likely outcomes.', '["Mean = Σx/n", "Range = largest − smallest", "P(event) = favourable outcomes/total outcomes"]', 5],
    ['topic_wassce_p2_math_num', 'Number and numeration', 'Apply percentages, fractions and ratio reasoning to everyday situations.', 'Number and numeration covers fractions, decimals, percentages, approximation, HCF/LCM, ratio sharing and commercial arithmetic such as profit, loss and simple interest.', '["Percentage profit = profit/cost price × 100", "Simple interest = PRT/100", "a% of N = (a/100) × N"]', 6],
    ['topic_wassce_p2_math_men', 'Mensuration', 'Calculate perimeters, areas, surface areas and volumes of plane figures and solids.', 'Mensuration applies standard formulas for the perimeter and area of plane figures and the surface area and volume of cuboids, cubes and cylinders, often with a stated value of π.', '["Area of rectangle = l × w", "Area of triangle = ½bh", "Area of circle = πr²", "Circumference = 2πr", "Volume of cylinder = πr²h", "Surface area of cube = 6a²"]', 7],
    ['topic_wassce_p2_math_rat', 'Ratio and proportion', 'Simplify ratios and share quantities; solve direct and inverse proportion problems.', 'Ratio and proportion covers simplifying ratios, sharing a quantity in a given ratio, unitary-method problems, map scales, and direct and inverse variation in everyday contexts.', '["Share in ratio a : b → total parts = a + b", "Scale 1 : n → actual = map × n", "Inverse proportion → workers × days is constant"]', 8],
    ['topic_wassce_p2_math_prb', 'Probability', 'Compute probabilities of single and compound events.', 'Probability measures likelihood on a scale from 0 to 1 using equally likely outcomes; compound events combine single-event probabilities by multiplication (independent) or addition (mutually exclusive), with or without replacement.', '["P(event) = favourable outcomes/total outcomes", "P(not A) = 1 − P(A)", "P(A and B) = P(A) × P(B) for independent events"]', 9],
  ];
  const allTopicIds = canonicalTopicRows.map(([id]) => id);
  const name = `${migrationNumber}_wassce_core_math_sprint2_foundation.sql`;
  const lines = [
    `-- ${migrationNumber}: Foundation guard for WASSCE Core Mathematics sprint 2 beta batch (wassce-core-math-sprint2-001).`,
    '-- Original BrillaPrep practice content; not official WAEC examination material.',
    '-- Re-asserts the prod-canonical topic rows for subj_wassce_core_math on scratch',
    '-- baselines; INSERT OR IGNORE no-ops on prod and on fresh baselines where the',
    '-- rows already exist (prod patch 095 and migration 364).',
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
    ...canonicalTopicRows.map(([id, topicName, description, theoryContent, keyFormulas, displayOrder]) =>
      `INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES (${sql(id)}, 'subj_wassce_core_math', NULL, ${sql(topicName)}, ${sql(id.slice(6).replaceAll('_', '-'))}, ${sql(description)}, ${sql(theoryContent)}, ${sql(keyFormulas)}, ${displayOrder}, '2026-08-04T00:00:00.000Z');`),
    `CREATE TABLE IF NOT EXISTS _migration_${migrationNumber}_guard (valid INTEGER NOT NULL CHECK (valid = 1));`,
    `DELETE FROM _migration_${migrationNumber}_guard;`,
    `INSERT INTO _migration_${migrationNumber}_guard(valid) SELECT CASE WHEN EXISTS (SELECT 1 FROM exam_types WHERE id = 'exam_wassce') AND EXISTS (SELECT 1 FROM exam_boards WHERE id = 'board_waec') AND EXISTS (SELECT 1 FROM subjects WHERE id = 'subj_wassce_core_math' AND exam_type_id = 'exam_wassce') AND (SELECT COUNT(*) FROM topics t JOIN subjects s ON s.id = t.subject_id WHERE t.id IN (${allTopicIds.map(sql).join(', ')}) AND t.subject_id = 'subj_wassce_core_math' AND s.exam_type_id = 'exam_wassce') = ${allTopicIds.length} THEN 1 ELSE 0 END;`,
    `DROP TABLE _migration_${migrationNumber}_guard;`,
  ];
  await emitMigration(name, lines);
  migrationNumber += 1;
}

const allQuestions = batch.subjects[0].questions;
const questionsPerPart = 5;
const partCount = Math.ceil(allQuestions.length / questionsPerPart);
for (let part = 1; part <= partCount; part += 1) {
  const partQuestions = allQuestions.slice((part - 1) * questionsPerPart, part * questionsPerPart);
  const ids = partQuestions.map((question) => question.id);
  const guardTable = `_migration_${migrationNumber}_guard`;
  const name = `${migrationNumber}_wassce_core_math_sprint2_part_${part}.sql`;
  const lines = [
    `-- ${migrationNumber}: Original BrillaPrep WASSCE Core Mathematics sprint 2 beta questions, part ${part} of ${partCount} (batch wassce-core-math-sprint2-001).`,
    '-- Curriculum-aligned practice content; not official WAEC examination material.',
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
  const name = `${migrationNumber}_wassce_core_math_sprint2_final_guard.sql`;
  const guardTable = `_migration_${migrationNumber}_guard`;
  const lines = [
    `-- ${migrationNumber}: Final exact-set and relationship guard for WASSCE Core Mathematics sprint 2 beta batch (wassce-core-math-sprint2-001).`,
    'PRAGMA foreign_keys = ON;',
    `CREATE TABLE IF NOT EXISTS ${guardTable} (valid INTEGER NOT NULL CHECK (valid = 1));`,
    `DELETE FROM ${guardTable};`,
    `INSERT INTO ${guardTable}(valid) SELECT CASE WHEN (SELECT COUNT(*) FROM questions q JOIN topics t ON t.id = q.topic_id JOIN question_content_releases r ON r.question_id = q.id WHERE q.id IN (${allIds.map(sql).join(', ')}) AND q.subject_id = t.subject_id AND q.subject_id = 'subj_wassce_core_math' AND q.exam_type_id = 'exam_wassce' AND q.exam_board_id = 'board_waec' AND q.round_type IS NULL AND length(q.explanation) >= 80 AND r.batch_id = '${batchId}' AND r.quality_assurance = 'automated_beta' AND r.release_channel = 'beta' AND r.official_exam_board_content = 0 AND r.feedback_enabled = 1) = 48 AND (SELECT COUNT(*) FROM questions q WHERE q.id IN (${mcqIds.map(sql).join(', ')}) AND q.question_type = 'multiple_choice' AND json_valid(q.options) AND json_array_length(q.options) = 4 AND q.correct_answer IN ('A', 'B', 'C', 'D') AND q.points = 1 AND q.marks = 1 AND q.time_limit = 90) = ${mcqIds.length} AND (SELECT COUNT(*) FROM questions q WHERE q.id IN (${calcIds.map(sql).join(', ')}) AND q.question_type = 'calculation' AND q.options IS NULL AND length(q.correct_answer) >= 1 AND q.points = 4 AND q.marks = 2 AND q.time_limit = 120) = ${calcIds.length} AND (SELECT COUNT(*) FROM question_content_releases WHERE batch_id = '${batchId}') = 48 AND (SELECT COUNT(*) FROM questions WHERE id IN (${allIds.map(sql).join(', ')}) AND difficulty = 'easy') = 12 AND (SELECT COUNT(*) FROM questions WHERE id IN (${allIds.map(sql).join(', ')}) AND difficulty = 'medium') = 24 AND (SELECT COUNT(*) FROM questions WHERE id IN (${allIds.map(sql).join(', ')}) AND difficulty = 'hard') = 12 THEN 1 ELSE 0 END;`,
    `DROP TABLE ${guardTable};`,
  ];
  await emitMigration(name, lines);
  migrationNumber += 1;
}

console.log(JSON.stringify({ validation, outBatch, migrations: migrationPaths }, null, 2));
