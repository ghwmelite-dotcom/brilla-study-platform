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
const batchId = 'wassce-core-math-sprint3-001';
const contentLabel = 'Original BrillaPrep curriculum-aligned WASSCE Core Mathematics practice questions; not official WAEC (West African Examinations Council) examination material. Use the enabled feedback channel to report corrections.';
const releaseSourceUrl = 'https://nacca.gov.gh/secondary-education-curriculum/';

const curriculumSource = {
  publisher: 'National Council for Curriculum and Assessment, Ghana',
  title: 'Secondary Education Curriculum — Core Mathematics',
  url: releaseSourceUrl,
  use: 'curriculum_blueprint_only',
};

// Topic ids are the prod-canonical rows for subj_wassce_core_math (verified
// read-only against brilla-db on 2026-09-09). Sprint 1 served the six
// topic_wcoremath_* + topic_wassce_p2_math_num easy/medium/hard cells and
// sprint 2 added their medium/hard cells plus the topic_wassce_p2_math_men,
// rat and prb easy/medium cells. Sprint 3 fills the six remaining legacy
// paper-2 topics (alg, geo, sta, qdr, trg, ine) whose easy/medium MCQ cells
// have have:0 with target 4 in artifacts/sprint3/cells-core-math.json, and
// opens the unserved NaCCA topics topic_wassce_core_math_algebra and
// topic_wassce_core_math_numbers with one calculation each.
// topic_wcoremath_calculus is skipped: calculus is not in the WASSCE Core
// Mathematics syllabus.
// Migration 538 re-asserts every row with INSERT OR IGNORE.
const topics = [
  ['WCM3-ALG', 'topic_wassce_p2_math_alg', 'Algebraic processes',
    'Manipulate linear and simultaneous equations and change the subject of a formula accurately.'],
  ['WCM3-GEO', 'topic_wassce_p2_math_geo', 'Plane geometry',
    'Apply angle, triangle, polygon and circle properties to calculate unknown measures.'],
  ['WCM3-STA', 'topic_wassce_p2_math_sta', 'Statistics',
    'Summarise data with measures of central tendency and spread, including frequency tables.'],
  ['WCM3-QDR', 'topic_wassce_p2_math_qdr', 'Quadratic functions',
    'Factorise and solve quadratic equations and analyse their roots and graphs.'],
  ['WCM3-TRG', 'topic_wassce_p2_math_trg', 'Trigonometry',
    'Use trigonometric ratios and Pythagoras to solve right-angled triangle problems.'],
  ['WCM3-INE', 'topic_wassce_p2_math_ine', 'Inequalities',
    'Solve linear inequalities, represent them on a number line and state extreme integer solutions.'],
  ['WCM3-NALG', 'topic_wassce_core_math_algebra', 'Algebraic Reasoning',
    'Use symbols and relationships to model and solve everyday algebraic problems.'],
  ['WCM3-NUM', 'topic_wassce_core_math_numbers', 'Numbers for Everyday Life',
    'Apply number operations, percentages and financial mathematics to everyday life.'],
];

const q = (topicCode, difficulty, prompt, correct, wrong, solution, commandWord, assessmentObjective) =>
  ({ topicCode, type: 'multiple_choice', difficulty, prompt, correct, wrong, solution, commandWord, assessmentObjective });
const calc = (topicCode, difficulty, prompt, answer, solution, commandWord, assessmentObjective) =>
  ({ topicCode, type: 'calculation', difficulty, prompt, answer, solution, commandWord, assessmentObjective });

const questions = [
  // --- Algebraic processes (topic_wassce_p2_math_alg): 4 easy, 4 medium MCQ
  q('WCM3-ALG', 'easy', 'Simplify 4a + 2b − a + 5b.', '3a + 7b', ['3a + 3b', '5a + 7b', '9ab'],
    'Collect the a-terms: 4a − a = 3a. Collect the b-terms: 2b + 5b = 7b. Hence 4a + 2b − a + 5b = 3a + 7b. (9ab wrongly multiplies unlike terms together; 3a + 3b mis-adds the b-terms.)', 'Simplify', 'AO1'),
  q('WCM3-ALG', 'easy', 'Solve the equation 5x − 3 = 17.', 'x = 4', ['x = 20', 'x = 14/5', 'x = 3'],
    'Add 3 to both sides: 5x = 20. Divide both sides by 5: x = 4. Check: 5(4) − 3 = 20 − 3 = 17, as required. (x = 20 forgets the final division; x = 14/5 subtracts 3 instead of adding.)', 'Solve', 'AO1'),
  q('WCM3-ALG', 'easy', 'Expand the expression 2(3y − 5).', '6y − 10', ['6y − 5', '3y − 10', '6y + 10'],
    'Multiply each term inside the bracket by 2: 2 × 3y = 6y and 2 × (−5) = −10, giving 6y − 10. (6y − 5 multiplies only the first term by 2.)', 'Expand', 'AO1'),
  q('WCM3-ALG', 'easy', 'Given that p = 3q + 2, find the value of p when q = 4.', '14', ['24', '12', '9'],
    'Substitute q = 4 into the formula: p = 3(4) + 2 = 12 + 2 = 14. (24 comes from wrongly computing 3 × (4 + 2); 12 forgets to add 2.)', 'Evaluate', 'AO1'),
  q('WCM3-ALG', 'medium', 'Solve the equation 4(x + 3) = 2x + 18.', 'x = 3', ['x = 6', 'x = 15', 'x = 30'],
    'Expand the bracket: 4x + 12 = 2x + 18. Subtract 2x from both sides: 2x + 12 = 18. Subtract 12: 2x = 6, so x = 3. Check: 4(3 + 3) = 24 and 2(3) + 18 = 24, as required. (x = 6 stops after finding 2x.)', 'Solve', 'AO2'),
  q('WCM3-ALG', 'medium', 'Given that x + 2y = 8 and x − y = 2, find the value of x + y.', '6', ['4', '2', '10'],
    'Subtract the second equation from the first: (x + 2y) − (x − y) = 8 − 2, so 3y = 6 and y = 2. Then x = 2 + y = 4, and x + y = 4 + 2 = 6. (4 and 2 are the individual values of x and y.)', 'Find', 'AO2'),
  q('WCM3-ALG', 'medium', 'Make t the subject of the formula s = ½(u + v)t.', 't = 2s/(u + v)', ['t = s(u + v)/2', 't = 2s(u + v)', 't = (u + v)/(2s)'],
    'Multiply both sides by 2 to clear the fraction: 2s = (u + v)t. Then divide both sides by (u + v): t = 2s/(u + v). (t = 2s(u + v) multiplies instead of dividing by (u + v).)', 'Rearrange', 'AO2'),
  q('WCM3-ALG', 'medium', 'Simplify (3x²)² × 2x.', '18x⁵', ['18x⁴', '6x⁵', '9x⁵'],
    'Square the bracket first: (3x²)² = 9x⁴. Then multiply by 2x: 9x⁴ × 2x = 18x⁵, since x⁴ × x = x⁵. (6x⁵ wrongly doubles 3 instead of squaring it; 18x⁴ forgets to add the powers of x.)', 'Simplify', 'AO2'),

  // --- Plane geometry (topic_wassce_p2_math_geo): 4 easy, 4 medium MCQ
  q('WCM3-GEO', 'easy', 'Two angles lie on a straight line. One of them is 65°. Find the other angle.', '115°', ['25°', '65°', '90°'],
    'Angles on a straight line sum to 180°, so the other angle is 180° − 65° = 115°. (25° is the complement 90° − 65°, confusing straight-line with right-angle pairs.)', 'Find', 'AO1'),
  q('WCM3-GEO', 'easy', 'Two angles of a triangle are 50° and 60°. Find the third angle.', '70°', ['110°', '30°', '120°'],
    'The angles of a triangle sum to 180°: 50° + 60° = 110°, so the third angle is 180° − 110° = 70°. (110° is the sum of the two given angles, not the third angle.)', 'Find', 'AO1'),
  q('WCM3-GEO', 'easy', 'Find the complement of an angle of 35°.', '55°', ['145°', '65°', '325°'],
    'Complementary angles sum to 90°, so the complement of 35° is 90° − 35° = 55°. (145° is the supplement 180° − 35°, the wrong angle pair.)', 'Find', 'AO1'),
  q('WCM3-GEO', 'easy', 'The perimeter of a square is 36 cm. Find the length of one side.', '9 cm', ['6 cm', '12 cm', '18 cm'],
    'A square has four equal sides, so each side is 36 ÷ 4 = 9 cm. (6 cm divides by 6 instead of 4; 18 cm halves the perimeter.)', 'Find', 'AO1'),
  q('WCM3-GEO', 'medium', 'Calculate the size of each interior angle of a regular pentagon.', '108°', ['120°', '72°', '540°'],
    'A pentagon has interior-angle sum (5 − 2) × 180° = 540°. A regular pentagon has five equal angles, so each is 540° ÷ 5 = 108°. (72° is the exterior angle; 120° belongs to a regular hexagon.)', 'Calculate', 'AO2'),
  q('WCM3-GEO', 'medium', 'An isosceles triangle has a vertex angle of 40°. Calculate the size of each base angle.', '70°', ['140°', '40°', '100°'],
    'The base angles of an isosceles triangle are equal, and all three angles sum to 180°: each base angle is (180° − 40°) ÷ 2 = 140° ÷ 2 = 70°. (140° forgets the division by 2.)', 'Calculate', 'AO2'),
  q('WCM3-GEO', 'medium', 'Two parallel lines are cut by a transversal. If one of a pair of co-interior angles is 110°, find the other co-interior angle.', '70°', ['110°', '90°', '20°'],
    'Co-interior (allied) angles between parallel lines are supplementary: 180° − 110° = 70°. (110° would be correct for corresponding or alternate angles, not co-interior ones.)', 'Find', 'AO2'),
  q('WCM3-GEO', 'medium', 'Calculate the size of each exterior angle of a regular hexagon.', '60°', ['120°', '90°', '45°'],
    'The exterior angles of any polygon sum to 360°, and a regular hexagon has six equal exterior angles: 360° ÷ 6 = 60°. (120° is each interior angle, 180° − 60°.)', 'Calculate', 'AO2'),

  // --- Statistics (topic_wassce_p2_math_sta): 4 easy, 4 medium MCQ
  q('WCM3-STA', 'easy', 'Write down the mode of the data set 2, 3, 3, 5, 7, 3, 8.', '3', ['5', '4.4', '6'],
    'The mode is the value that occurs most often. Here 3 occurs three times, more than any other value, so the mode is 3. (4.4 is approximately the mean, 31 ÷ 7, a different average.)', 'Write down', 'AO1'),
  q('WCM3-STA', 'easy', 'Find the median of the numbers 4, 7, 9, 11 and 13.', '9', ['7', '8.8', '11'],
    'The numbers are already in order, and the median of five values is the third (middle) one: 9. (8.8 is the mean, 44 ÷ 5, not the median.)', 'Find', 'AO1'),
  q('WCM3-STA', 'easy', 'Find the range of the data set 12, 5, 9, 20 and 7.', '15', ['25', '12', '10.6'],
    'Range = largest value − smallest value = 20 − 5 = 15. (25 adds the extremes instead of subtracting them; 10.6 is the mean, 53 ÷ 5.)', 'Find', 'AO1'),
  q('WCM3-STA', 'easy', 'Calculate the mean of the numbers 4, 8, 6, 10 and 2.', '6', ['30', '8', '7.5'],
    'The sum of the numbers is 4 + 8 + 6 + 10 + 2 = 30, and there are five numbers, so the mean is 30 ÷ 5 = 6. (30 is the total before dividing; 8 is the range.)', 'Calculate', 'AO1'),
  q('WCM3-STA', 'medium', 'Find the median of the data set 3, 5, 8, 10, 12 and 15.', '9', ['8', '10', '8.8'],
    'With six ordered values the median is the mean of the third and fourth: (8 + 10) ÷ 2 = 9. (8 or 10 alone forgets to average the two middle values.)', 'Find', 'AO2'),
  q('WCM3-STA', 'medium', 'The mean of six numbers is 7. Five of the numbers add up to 30. Find the sixth number.', '12', ['6', '7', '5'],
    'The six numbers total 6 × 7 = 42. The five known numbers total 30, so the sixth number is 42 − 30 = 12. (6 is the mean of the five known numbers, 30 ÷ 5.)', 'Find', 'AO2'),
  q('WCM3-STA', 'medium', 'In a frequency table, the value 1 occurs 2 times, the value 2 occurs 3 times and the value 3 occurs 5 times. Calculate the mean of the data.', '2.3', ['2', '2.5', '3'],
    'Total of values = (1 × 2) + (2 × 3) + (3 × 5) = 2 + 6 + 15 = 23. Total frequency = 2 + 3 + 5 = 10. Mean = 23 ÷ 10 = 2.3. (2 is the mean of the values 1, 2, 3 ignoring their frequencies.)', 'Calculate', 'AO2'),
  q('WCM3-STA', 'medium', 'The mean of the numbers 2, 5, x and 9 is 6. Find the value of x.', '8', ['4', '10', '7'],
    'The four numbers total 4 × 6 = 24. The three known numbers total 2 + 5 + 9 = 16, so x = 24 − 16 = 8. (4 wrongly divides 16 by 4 instead of subtracting from 24.)', 'Find', 'AO2'),

  // --- Quadratic functions (topic_wassce_p2_math_qdr): 4 easy, 4 medium MCQ
  q('WCM3-QDR', 'easy', 'Write down the roots of the equation (x − 4)(x + 1) = 0.', 'x = 4 or x = −1', ['x = −4 or x = 1', 'x = 4 or x = 1', 'x = −4 or x = −1'],
    'A product is zero only when a factor is zero: x − 4 = 0 gives x = 4, and x + 1 = 0 gives x = −1. (x = −4 or x = 1 reverses both signs.)', 'Write down', 'AO1'),
  q('WCM3-QDR', 'easy', 'Factorise x² + 7x + 12.', '(x + 3)(x + 4)', ['(x + 2)(x + 6)', '(x − 3)(x − 4)', '(x + 1)(x + 12)'],
    'Find two numbers that multiply to 12 and add to 7: they are 3 and 4. Hence x² + 7x + 12 = (x + 3)(x + 4). ((x + 2)(x + 6) adds to 8, and (x − 3)(x − 4) gives −7x.)', 'Factorise', 'AO1'),
  q('WCM3-QDR', 'easy', 'Given that y = x² + 1, find the value of y when x = 3.', '10', ['7', '9', '4'],
    'Substitute x = 3: y = 3² + 1 = 9 + 1 = 10. (7 treats x² as 2x; 9 forgets to add 1.)', 'Evaluate', 'AO1'),
  q('WCM3-QDR', 'easy', 'Write down the sum of the roots of the equation x² − 6x + 8 = 0.', '6', ['−6', '8', '−8'],
    'For ax² + bx + c = 0 the sum of the roots is −b/a. Here −b/a = −(−6)/1 = 6. (8 is the product of the roots, c/a — a common mix-up; −6 forgets the leading minus.)', 'Write down', 'AO1'),
  q('WCM3-QDR', 'medium', 'Solve the equation x² − 9 = 0.', 'x = 3 or x = −3', ['x = 3 only', 'x = 9 or x = −9', 'x = 81'],
    'Factorise the difference of two squares: (x − 3)(x + 3) = 0, so x = 3 or x = −3. (x = 3 only forgets the negative square root of 9; x = ±9 forgets to take the square root.)', 'Solve', 'AO2'),
  q('WCM3-QDR', 'medium', 'Solve the equation x² − 7x + 10 = 0 by factorisation.', 'x = 2 or x = 5', ['x = −2 or x = −5', 'x = 1 or x = 10', 'x = −2 or x = 5'],
    'Two numbers that multiply to 10 and add to −7 are −2 and −5, so x² − 7x + 10 = (x − 2)(x − 5) = 0, giving x = 2 or x = 5. Check: 2 + 5 = 7 and 2 × 5 = 10. (x = −2 or x = −5 solves x² + 7x + 10 = 0 instead.)', 'Solve', 'AO2'),
  q('WCM3-QDR', 'medium', 'Find the minimum value of y = x² − 4x + 3.', '−1', ['3', '−4', '2'],
    'Complete the square: y = (x − 2)² − 4 + 3 = (x − 2)² − 1. Since (x − 2)² ≥ 0, the least value of y is −1, occurring at x = 2. (2 is the x-value at the minimum, not the minimum value; 3 is just the constant term.)', 'Find', 'AO2'),
  q('WCM3-QDR', 'medium', 'Calculate the discriminant of the quadratic equation 2x² + 3x + 1 = 0.', '1', ['17', '5', '−7'],
    'The discriminant is b² − 4ac with a = 2, b = 3 and c = 1: 3² − 4(2)(1) = 9 − 8 = 1. The positive discriminant confirms two real roots. (17 wrongly adds 9 + 8 instead of subtracting.)', 'Calculate', 'AO2'),

  // --- Trigonometry (topic_wassce_p2_math_trg): 4 easy, 4 medium MCQ
  q('WCM3-TRG', 'easy', 'Write down the value of sin 30°.', '1/2', ['√3/2', '√2/2', '1'],
    'sin 30° is a standard exact value: 1/2. (√3/2 is the value of sin 60°, confusing the two complementary special angles.)', 'Write down', 'AO1'),
  q('WCM3-TRG', 'easy', 'Write down the value of tan 45°.', '1', ['0', '1/√3', '√3'],
    'At 45° the opposite and adjacent sides of the right-angled triangle are equal, so tan 45° = opposite ÷ adjacent = 1. (√3 is tan 60° and 1/√3 is tan 30°.)', 'Write down', 'AO1'),
  q('WCM3-TRG', 'easy', 'A right-angled triangle has shorter sides of 3 cm and 4 cm. Find the length of the hypotenuse.', '5 cm', ['7 cm', '12 cm', '√7 cm'],
    'By the theorem of Pythagoras: hypotenuse = √(3² + 4²) = √(9 + 16) = √25 = 5 cm. (7 cm just adds the two sides; √7 cm subtracts the squares, which applies only when the hypotenuse is given.)', 'Find', 'AO1'),
  q('WCM3-TRG', 'easy', 'Write down the value of cos 60°.', '0.5', ['√3/2', '1', '0'],
    'cos 60° is a standard exact value: 0.5 (that is, 1/2). (√3/2 is cos 30°, confusing the complementary special angles.)', 'Write down', 'AO1'),
  q('WCM3-TRG', 'medium', 'In a right-angled triangle, the side opposite angle θ is 6 cm and the side adjacent to θ is 8 cm. Find tan θ.', '3/4', ['4/3', '3/5', '4/5'],
    'tan θ = opposite ÷ adjacent = 6/8 = 3/4. (3/5 is sin θ: the hypotenuse is √(6² + 8²) = 10 cm, so sin θ = 6/10 = 3/5 — the wrong ratio.)', 'Find', 'AO2'),
  q('WCM3-TRG', 'medium', 'A right-angled triangle has a hypotenuse of 10 cm and an angle of 30°. Find the length of the side opposite the 30° angle.', '5 cm', ['8.7 cm', '5√3 cm', '10 cm'],
    'The opposite side equals hypotenuse × sin 30° = 10 × 0.5 = 5 cm. (5√3 cm ≈ 8.7 cm is the adjacent side, 10 cos 30°, not the side asked for.)', 'Find', 'AO2'),
  q('WCM3-TRG', 'medium', 'A boy stands 20 m from the foot of a vertical mast. The angle of elevation of the top of the mast from the boy is 45°. Calculate the height of the mast.', '20 m', ['20√2 m', '10 m', '40 m'],
    'tan 45° = height ÷ distance = height ÷ 20. Since tan 45° = 1, the height is 20 × 1 = 20 m. (20√2 m ≈ 28.3 m is the line-of-sight distance from the boy to the top, not the height.)', 'Calculate', 'AO2'),
  q('WCM3-TRG', 'medium', 'A right-angled triangle has a hypotenuse of 8 cm and an angle of 60°. Find the length of the side adjacent to the 60° angle.', '4 cm', ['4√3 cm', '8 cm', '16 cm'],
    'The adjacent side equals hypotenuse × cos 60° = 8 × 0.5 = 4 cm. (4√3 cm ≈ 6.9 cm is the side opposite the 60° angle, 8 sin 60°.)', 'Find', 'AO2'),

  // --- Inequalities (topic_wassce_p2_math_ine): 4 easy, 4 medium MCQ
  q('WCM3-INE', 'easy', 'Solve the inequality x + 5 > 9 for x.', 'x > 4', ['x > 14', 'x < 4', 'x > 5'],
    'Subtract 5 from both sides: x > 9 − 5, so x > 4. Check: 4 + 5 = 9, so any value above 4 works. (x > 14 adds 5 instead of subtracting; x < 4 reverses the sign for no reason.)', 'Solve', 'AO1'),
  q('WCM3-INE', 'easy', 'Solve the inequality 2x ≤ 10.', 'x ≤ 5', ['x ≥ 5', 'x ≤ 8', 'x < 5'],
    'Divide both sides by the positive number 2, keeping the sign: x ≤ 5. (x < 5 drops the equality, excluding x = 5 which satisfies 2(5) = 10 ≤ 10.)', 'Solve', 'AO1'),
  q('WCM3-INE', 'easy', 'Which of the following values satisfies the inequality x − 2 < 5?', 'x = 6', ['x = 7', 'x = 8', 'x = 9'],
    'Substituting x = 6 gives 6 − 2 = 4, and 4 < 5, so x = 6 satisfies the inequality. The other values give 5, 6 and 7, none of which is less than 5. Equivalently, solving gives x < 7, and only 6 qualifies.', 'Solve', 'AO1'),
  q('WCM3-INE', 'easy', 'Solve the inequality 3x > 12.', 'x > 4', ['x < 4', 'x > 36', 'x > 9'],
    'Divide both sides by the positive number 3: x > 4. Check: 3 × 4 = 12, so values above 4 work. (x > 36 multiplies by 3 instead of dividing; x > 9 subtracts 3.)', 'Solve', 'AO1'),
  q('WCM3-INE', 'medium', 'Solve the inequality 3x − 4 ≤ 11.', 'x ≤ 5', ['x ≤ 7/3', 'x < 5', 'x ≥ 5'],
    'Add 4 to both sides: 3x ≤ 15. Divide by the positive number 3: x ≤ 5. Check: 3(5) − 4 = 11, and 11 ≤ 11 holds. (x ≤ 7/3 subtracts 4 from 11 instead of adding.)', 'Solve', 'AO2'),
  q('WCM3-INE', 'medium', 'Solve the inequality 5 − 2x ≥ 1.', 'x ≤ 2', ['x ≥ 2', 'x ≤ −2', 'x ≥ −2'],
    'Subtract 5 from both sides: −2x ≥ −4. Dividing by the negative number −2 reverses the inequality sign: x ≤ 2. Check: 5 − 2(2) = 1, and 1 ≥ 1 holds. (x ≥ 2 forgets to reverse the sign when dividing by a negative.)', 'Solve', 'AO2'),
  q('WCM3-INE', 'medium', 'Find the largest integer that satisfies the inequality 4x + 1 < 15.', '3', ['4', '3.5', '2'],
    'Subtract 1: 4x < 14, so x < 3.5. The largest whole number below 3.5 is 3. Check: 4(3) + 1 = 13 < 15, while 4(4) + 1 = 17, which fails. (4 rounds 3.5 up without checking the inequality.)', 'Find', 'AO2'),
  q('WCM3-INE', 'medium', 'Solve the inequality (x/2) + 3 > 5.', 'x > 4', ['x > 16', 'x > 1', 'x < 4'],
    'Subtract 3 from both sides: x/2 > 2. Multiply both sides by the positive number 2: x > 4. Check: (4/2) + 3 = 5, so values above 4 work. (x > 16 adds 3 before doubling: (5 + 3) × 2.)', 'Solve', 'AO2'),

  // --- Algebraic Reasoning (topic_wassce_core_math_algebra) — NaCCA topic: 1 calculation
  calc('WCM3-NALG', 'hard', 'Three consecutive even numbers add up to 78. Taking the smallest number as n, form an equation in n and find the three numbers.', '24, 26 and 28',
    'Let the smallest even number be n; the next two consecutive even numbers are n + 2 and n + 4. Their sum gives the equation n + (n + 2) + (n + 4) = 78, so 3n + 6 = 78. Subtracting 6 gives 3n = 72, and dividing by 3 gives n = 24. The three numbers are therefore 24, 26 and 28. Check: 24 + 26 + 28 = 78, as required. Answer: 24, 26 and 28.', 'Form', 'AO3'),

  // --- Numbers for Everyday Life (topic_wassce_core_math_numbers) — NaCCA topic: 1 calculation
  calc('WCM3-NUM', 'hard', 'A shopkeeper increased the price of a bag of rice by 20%. Some weeks later the new price was reduced by 20%. If the original price was GH₵250.00, calculate the final price.', 'GH₵240.00',
    'After the 20% increase the price is 250 × 1.20 = GH₵300.00. The 20% reduction applies to the new price, not the original: 300 × 0.80 = GH₵240.00. So the final price is GH₵240.00, which is GH₵10.00 below the original price — the two 20% changes do not cancel out because they act on different bases. Equivalently, 250 × 1.20 × 0.80 = 250 × 0.96 = GH₵240.00. Answer: GH₵240.00.', 'Calculate', 'AO3'),
];

// --- Batch assembly ---------------------------------------------------------
function buildQuestion(source, sequence, mcqPosition) {
  const id = `q_wcms3_${String(sequence).padStart(3, '0')}`;
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
    specificationCode: 'BRILLA-WASSCE-COREMATH-S3-001',
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

// The six legacy paper-2 topics each receive 4 easy + 4 medium MCQs (their
// have:0 cells with target 4); the two NaCCA topics each receive 1 calculation
// (their have:0 "any" calculation/short_answer cells with target 2).
const expectedCells = {
  'WCM3-ALG': { easy: 4, mediumMcq: 4, hardMcq: 0, calc: 0 },
  'WCM3-GEO': { easy: 4, mediumMcq: 4, hardMcq: 0, calc: 0 },
  'WCM3-STA': { easy: 4, mediumMcq: 4, hardMcq: 0, calc: 0 },
  'WCM3-QDR': { easy: 4, mediumMcq: 4, hardMcq: 0, calc: 0 },
  'WCM3-TRG': { easy: 4, mediumMcq: 4, hardMcq: 0, calc: 0 },
  'WCM3-INE': { easy: 4, mediumMcq: 4, hardMcq: 0, calc: 0 },
  'WCM3-NALG': { easy: 0, mediumMcq: 0, hardMcq: 0, calc: 1 },
  'WCM3-NUM': { easy: 0, mediumMcq: 0, hardMcq: 0, calc: 1 },
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
    if (letterCounts[label] !== 12) errors.push(`correct answer letter ${label} should appear 12 times, found ${letterCounts[label]}`);
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

let migrationNumber = 538;
{
  // Canonical topic rows: on prod and on fresh baselines (prod patch 095/096
  // and migrations 252-266/364 create them) every id already exists, so these
  // no-op. They exist so a scratch baseline without the patches still has the
  // bindings. The slug is derived from the canonical id rather than copied
  // from the legacy row: legacy seed/patch rows own the human slugs on fresh
  // baselines and topics is UNIQUE(subject_id, slug).
  const canonicalTopicRows = [
    ['topic_wassce_p2_math_alg', 'Algebraic processes', 'Manipulate linear and simultaneous equations and change the subject of a formula accurately.', 'Algebraic processes covers simplifying and expanding expressions, solving linear and simultaneous equations, factorisation and changing the subject of a formula.', '["ax + b = c → x = (c − b)/a", "(a + b)² = a² + 2ab + b²", "a² − b² = (a − b)(a + b)"]', 21],
    ['topic_wassce_p2_math_geo', 'Plane geometry', 'Apply angle, triangle, polygon and circle properties to calculate unknown measures.', 'Plane geometry covers angles at a point and on a straight line, properties of triangles and polygons, parallel-line angle relationships and circle theorems.', '["Angles in a triangle sum to 180°", "Angles on a straight line sum to 180°", "Exterior angles of a polygon sum to 360°", "Interior-angle sum = (n − 2) × 180°"]', 22],
    ['topic_wassce_p2_math_sta', 'Statistics', 'Summarise data with measures of central tendency and spread.', 'Statistics summarises data using the mean, median, mode and range, including frequency tables and simple data interpretation.', '["Mean = Σx/n", "Median = middle value of ordered data", "Range = largest − smallest"]', 23],
    ['topic_wassce_p2_math_qdr', 'Quadratic functions', 'Factorise and solve quadratic equations and analyse their roots and graphs.', 'Quadratic functions are solved by factorisation, completing the square or the formula; the discriminant b² − 4ac determines the nature of the roots and the graph is a parabola with a line of symmetry.', '["x = (−b ± √(b² − 4ac))/2a", "sum of roots = −b/a", "product of roots = c/a", "y = (x − h)² + k has vertex (h, k)"]', 24],
    ['topic_wassce_p2_math_trg', 'Trigonometry', 'Use trigonometric ratios and Pythagoras to solve right-angled triangle problems.', 'Trigonometry relates the sides and angles of right-angled triangles through sine, cosine and tangent, with applications to angles of elevation and depression.', '["sin θ = opposite/hypotenuse", "cos θ = adjacent/hypotenuse", "tan θ = opposite/adjacent", "a² + b² = c²"]', 25],
    ['topic_wassce_p2_math_ine', 'Inequalities', 'Solve linear inequalities, represent them on a number line and state extreme integer solutions.', 'Linear inequalities are solved like equations, except that multiplying or dividing both sides by a negative number reverses the inequality sign.', '["a < b ⇒ a + c < b + c", "a < b and c > 0 ⇒ ac < bc", "a < b and c < 0 ⇒ ac > bc"]', 26],
    ['topic_wassce_core_math_algebra', 'Algebraic Reasoning', 'Use symbols and relationships to model and solve everyday algebraic problems.', 'Algebraic reasoning builds fluency with variables: forming expressions and equations from real situations, solving them and interpreting the solutions in context.', '["Consecutive even numbers: n, n + 2, n + 4", "Model a real situation with an equation and solve it"]', 27],
    ['topic_wassce_core_math_numbers', 'Numbers for Everyday Life', 'Apply number operations, percentages and financial mathematics to everyday life.', 'Numbers for everyday life covers fractions, decimals, percentages, ratio and commercial arithmetic such as successive percentage changes, profit, loss and interest.', '["a% of N = (a/100) × N", "Successive changes multiply: × (1 + r₁)(1 + r₂)", "Simple interest = PRT/100"]', 28],
  ];
  const allTopicIds = canonicalTopicRows.map(([id]) => id);
  const name = `${migrationNumber}_wassce_core_math_sprint3_foundation.sql`;
  const lines = [
    `-- ${migrationNumber}: Foundation guard for WASSCE Core Mathematics sprint 3 beta batch (wassce-core-math-sprint3-001).`,
    '-- Original BrillaPrep practice content; not official WAEC examination material.',
    '-- Re-asserts the prod-canonical topic rows for subj_wassce_core_math on scratch',
    '-- baselines; INSERT OR IGNORE no-ops on prod and on fresh baselines where the',
    '-- rows already exist (prod patches 095/096 and migrations 252-266/364).',
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
  const name = `${migrationNumber}_wassce_core_math_sprint3_part_${part}.sql`;
  const lines = [
    `-- ${migrationNumber}: Original BrillaPrep WASSCE Core Mathematics sprint 3 beta questions, part ${part} of ${partCount} (batch wassce-core-math-sprint3-001).`,
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
  const name = `${migrationNumber}_wassce_core_math_sprint3_final_guard.sql`;
  const guardTable = `_migration_${migrationNumber}_guard`;
  const lines = [
    `-- ${migrationNumber}: Final exact-set and relationship guard for WASSCE Core Mathematics sprint 3 beta batch (wassce-core-math-sprint3-001).`,
    'PRAGMA foreign_keys = ON;',
    `CREATE TABLE IF NOT EXISTS ${guardTable} (valid INTEGER NOT NULL CHECK (valid = 1));`,
    `DELETE FROM ${guardTable};`,
    `INSERT INTO ${guardTable}(valid) SELECT CASE WHEN (SELECT COUNT(*) FROM questions q JOIN topics t ON t.id = q.topic_id JOIN question_content_releases r ON r.question_id = q.id WHERE q.id IN (${allIds.map(sql).join(', ')}) AND q.subject_id = t.subject_id AND q.subject_id = 'subj_wassce_core_math' AND q.exam_type_id = 'exam_wassce' AND q.exam_board_id = 'board_waec' AND q.round_type IS NULL AND length(q.explanation) >= 80 AND r.batch_id = '${batchId}' AND r.quality_assurance = 'automated_beta' AND r.release_channel = 'beta' AND r.official_exam_board_content = 0 AND r.feedback_enabled = 1) = 50 AND (SELECT COUNT(*) FROM questions q WHERE q.id IN (${mcqIds.map(sql).join(', ')}) AND q.question_type = 'multiple_choice' AND json_valid(q.options) AND json_array_length(q.options) = 4 AND q.correct_answer IN ('A', 'B', 'C', 'D') AND q.points = 1 AND q.marks = 1 AND q.time_limit = 90) = ${mcqIds.length} AND (SELECT COUNT(*) FROM questions q WHERE q.id IN (${calcIds.map(sql).join(', ')}) AND q.question_type = 'calculation' AND q.options IS NULL AND length(q.correct_answer) >= 1 AND q.points = 4 AND q.marks = 2 AND q.time_limit = 120) = ${calcIds.length} AND (SELECT COUNT(*) FROM question_content_releases WHERE batch_id = '${batchId}') = 50 AND (SELECT COUNT(*) FROM questions WHERE id IN (${allIds.map(sql).join(', ')}) AND difficulty = 'easy') = 24 AND (SELECT COUNT(*) FROM questions WHERE id IN (${allIds.map(sql).join(', ')}) AND difficulty = 'medium') = 24 AND (SELECT COUNT(*) FROM questions WHERE id IN (${allIds.map(sql).join(', ')}) AND difficulty = 'hard') = 2 THEN 1 ELSE 0 END;`,
    `DROP TABLE ${guardTable};`,
  ];
  await emitMigration(name, lines);
  migrationNumber += 1;
}

console.log(JSON.stringify({ validation, outBatch, migrations: migrationPaths }, null, 2));
