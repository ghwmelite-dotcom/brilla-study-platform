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
const batchId = 'wassce-core-math-sprint1-001';
const contentLabel = 'Original BrillaPrep curriculum-aligned WASSCE Core Mathematics practice questions; not official WAEC (West African Examinations Council) examination material. Use the enabled feedback channel to report corrections.';
const releaseSourceUrl = 'https://nacca.gov.gh/secondary-education-curriculum/';

const curriculumSource = {
  publisher: 'National Council for Curriculum and Assessment, Ghana',
  title: 'Secondary Education Curriculum — Core Mathematics',
  url: releaseSourceUrl,
  use: 'curriculum_blueprint_only',
};

// Topic ids are the prod-canonical rows for subj_wassce_core_math (verified
// read-only against brilla-db on 2026-09-09). topic_wcoremath_* rows arrive on
// fresh baselines via prod patch 095 and topic_wassce_p2_math_num via
// migration 364; migration 402 re-asserts them with INSERT OR IGNORE.
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
];

const q = (topicCode, difficulty, prompt, correct, wrong, solution, commandWord, assessmentObjective) =>
  ({ topicCode, difficulty, prompt, correct, wrong, solution, commandWord, assessmentObjective });

const questions = [
  // --- Algebra (topic_wcoremath_algebra): 4 easy, 3 medium, 1 hard -----------
  q('WCM-ALG', 'easy', 'Simplify 3x + 5x − 2x.', '6x', ['10x', '5x', 'x'],
    'Collect like terms: 3x + 5x − 2x = (3 + 5 − 2)x = 6x.', 'Simplify', 'AO1'),
  q('WCM-ALG', 'easy', 'Solve the equation x + 7 = 15.', 'x = 8', ['x = 22', 'x = −8', 'x = 7'],
    'Subtract 7 from both sides: x = 15 − 7 = 8. Check: 8 + 7 = 15, as required.', 'Solve', 'AO1'),
  q('WCM-ALG', 'easy', 'Expand the expression 3(a + 4).', '3a + 12', ['3a + 4', 'a + 12', '3a + 7'],
    'Multiply each term inside the bracket by 3: 3 × a = 3a and 3 × 4 = 12, giving 3a + 12.', 'Expand', 'AO1'),
  q('WCM-ALG', 'easy', 'Given that y = 2x − 3, find the value of y when x = 5.', '7', ['13', '4', '2'],
    'Substitute x = 5 into the formula: y = 2(5) − 3 = 10 − 3 = 7.', 'Evaluate', 'AO1'),
  q('WCM-ALG', 'medium', 'Solve the equation 3(x − 2) = 12.', 'x = 6', ['x = 4', 'x = 14/3', 'x = 2'],
    'Divide both sides by 3: x − 2 = 4. Add 2 to both sides: x = 6. Check: 3(6 − 2) = 3 × 4 = 12, as required.', 'Solve', 'AO2'),
  q('WCM-ALG', 'medium', 'Make t the subject of the formula v = u + at.', 't = (v − u)/a', ['t = (v + u)/a', 't = a(v − u)', 't = v − u − a'],
    'Subtract u from both sides: at = v − u. Then divide both sides by a: t = (v − u)/a.', 'Rearrange', 'AO2'),
  q('WCM-ALG', 'medium', 'Given that x + y = 10 and x − y = 2, find the value of x.', 'x = 6', ['x = 4', 'x = 8', 'x = 5'],
    'Add the two equations to eliminate y: 2x = 12, so x = 6. Then y = 10 − 6 = 4, and indeed 6 − 4 = 2.', 'Solve', 'AO2'),
  q('WCM-ALG', 'hard', 'Simplify (2x²y)³ ÷ (4xy²).', '2x⁵y', ['2x⁶y', '4x⁵y', '2x⁵y²'],
    'Cube the bracket first: (2x²y)³ = 8x⁶y³. Dividing by 4xy²: 8 ÷ 4 = 2, x⁶ ÷ x = x⁵ and y³ ÷ y² = y, giving 2x⁵y.', 'Simplify', 'AO3'),

  // --- Quadratic Equations (topic_wcoremath_quadratic): 4 easy, 3 medium, 1 hard
  q('WCM-QDR', 'easy', 'Factorise x² + 5x + 6.', '(x + 2)(x + 3)', ['(x + 1)(x + 6)', '(x − 2)(x − 3)', '(x + 5)(x + 1)'],
    'Find two numbers that multiply to 6 and add to 5: they are 2 and 3. Hence x² + 5x + 6 = (x + 2)(x + 3).', 'Factorise', 'AO1'),
  q('WCM-QDR', 'easy', 'Write down the roots of the equation (x − 3)(x + 2) = 0.', 'x = 3 or x = −2', ['x = −3 or x = 2', 'x = 3 or x = 2', 'x = −3 or x = −2'],
    'A product is zero only when a factor is zero: x − 3 = 0 gives x = 3, and x + 2 = 0 gives x = −2.', 'Solve', 'AO1'),
  q('WCM-QDR', 'easy', 'For the function y = x² − 4, find the value of y when x = 3.', '5', ['9', '1', '13'],
    'Substitute x = 3 into the function: y = 3² − 4 = 9 − 4 = 5. (The trap answer 9 forgets to subtract 4.)', 'Evaluate', 'AO1'),
  q('WCM-QDR', 'easy', 'Calculate the discriminant of the quadratic equation x² + 4x + 4 = 0.', '0', ['16', '8', '32'],
    'The discriminant is b² − 4ac with a = 1, b = 4 and c = 4: 4² − 4(1)(4) = 16 − 16 = 0, so the equation has one repeated root.', 'Calculate', 'AO1'),
  q('WCM-QDR', 'medium', 'Solve the equation x² − 7x + 12 = 0.', 'x = 3 or x = 4', ['x = 2 or x = 6', 'x = −3 or x = −4', 'x = 1 or x = 12'],
    'Factorise: (x − 3)(x − 4) = 0, since 3 and 4 multiply to 12 and add to 7. Hence x = 3 or x = 4.', 'Solve', 'AO2'),
  q('WCM-QDR', 'medium', 'Find the sum of the roots of the equation 2x² − 8x + 6 = 0.', '4', ['−4', '3', '8'],
    'For ax² + bx + c = 0 the sum of the roots is −b/a. Here that is −(−8)/2 = 8/2 = 4. (The product of the roots, c/a = 3, is the common trap.)', 'Find', 'AO2'),
  q('WCM-QDR', 'medium', 'Express x² + 6x + 2 in the form (x + p)² + q.', '(x + 3)² − 7', ['(x + 3)² + 2', '(x + 3)² − 11', '(x + 6)² − 34'],
    'Half the coefficient of x is 3, and (x + 3)² = x² + 6x + 9. So x² + 6x + 2 = (x + 3)² − 9 + 2 = (x + 3)² − 7.', 'Express', 'AO2'),
  q('WCM-QDR', 'hard', 'The equation x² + kx + 9 = 0 has equal roots. Find the positive value of k.', '6', ['3', '9', '36'],
    'Equal roots require the discriminant to be zero: k² − 4(1)(9) = 0, so k² = 36 and k = ±6. The positive value is k = 6.', 'Find', 'AO3'),

  // --- Geometry (topic_wcoremath_geometry): 4 easy, 3 medium, 1 hard ---------
  q('WCM-GEO', 'easy', 'What is the sum of the interior angles of a triangle?', '180°', ['90°', '270°', '360°'],
    'The three interior angles of any triangle add up to 180°; 360° is the total for a quadrilateral.', 'State', 'AO1'),
  q('WCM-GEO', 'easy', 'Two angles lie on a straight line. If one of them is 65°, find the other angle.', '115°', ['25°', '65°', '125°'],
    'Angles on a straight line are supplementary (they add to 180°), so the other angle is 180° − 65° = 115°.', 'Find', 'AO1'),
  q('WCM-GEO', 'easy', 'Find the area of a triangle with base 12 cm and height 5 cm.', '30 cm²', ['60 cm²', '17 cm²', '32.5 cm²'],
    'Area of a triangle = ½ × base × height = ½ × 12 × 5 = 30 cm². (Forgetting the ½ gives the trap answer 60 cm².)', 'Calculate', 'AO1'),
  q('WCM-GEO', 'easy', 'Find the complement of the angle 35°.', '55°', ['145°', '65°', '35°'],
    'Complementary angles add to 90°, so the complement is 90° − 35° = 55°. (145° is the supplement, not the complement.)', 'Find', 'AO1'),
  q('WCM-GEO', 'medium', 'Find the size of each exterior angle of a regular hexagon.', '60°', ['120°', '45°', '90°'],
    'The exterior angles of any polygon add to 360°. A regular hexagon has 6 equal exterior angles, so each is 360° ÷ 6 = 60°. (120° is each interior angle.)', 'Calculate', 'AO2'),
  q('WCM-GEO', 'medium', 'Taking π = 22/7, find the circumference of a circle of radius 7 cm.', '44 cm', ['22 cm', '154 cm', '88 cm'],
    'Circumference = 2πr = 2 × (22/7) × 7 = 2 × 22 = 44 cm. (154 cm² would be the area, not the circumference.)', 'Calculate', 'AO2'),
  q('WCM-GEO', 'medium', 'The angles of a triangle are in the ratio 1 : 2 : 3. Find the largest angle.', '90°', ['60°', '120°', '45°'],
    'The angles sum to 180° across 1 + 2 + 3 = 6 parts, so one part is 180° ÷ 6 = 30°. The largest angle is 3 × 30° = 90°, making this a right-angled triangle.', 'Find', 'AO2'),
  q('WCM-GEO', 'hard', 'An arc of a circle subtends an angle of 35° at the circumference. Find the angle the same arc subtends at the centre of the circle.', '70°', ['17.5°', '35°', '55°'],
    'The angle a given arc subtends at the centre is twice the angle it subtends at the circumference: 2 × 35° = 70°.', 'Find', 'AO3'),

  // --- Trigonometry (topic_wcoremath_trigonometry): 4 easy, 3 medium, 1 hard -
  q('WCM-TRG', 'easy', 'What is the value of sin 30°?', '1/2', ['√3/2', '1', '√2/2'],
    'From the standard 30°-60°-90° triangle, sin 30° = opposite/hypotenuse = 1/2. (√3/2 is sin 60°.)', 'State', 'AO1'),
  q('WCM-TRG', 'easy', 'In a right-angled triangle, the side opposite angle θ is 3 cm and the side adjacent to θ is 4 cm. Find tan θ.', '3/4', ['4/3', '3/5', '4/5'],
    'tan θ = opposite/adjacent = 3/4 = 0.75. (3/5 and 4/5 wrongly bring in the hypotenuse, which is 5 cm.)', 'Find', 'AO1'),
  q('WCM-TRG', 'easy', 'What is the value of cos 60°?', '1/2', ['√3/2', '1', '√2/2'],
    'From the standard 30°-60°-90° triangle, cos 60° = adjacent/hypotenuse = 1/2. (√3/2 is cos 30°.)', 'State', 'AO1'),
  q('WCM-TRG', 'easy', 'A right-angled triangle has legs of length 3 cm and 4 cm. Find the length of the hypotenuse.', '5 cm', ['7 cm', '6 cm', '√7 cm'],
    'By the theorem of Pythagoras: hypotenuse² = 3² + 4² = 9 + 16 = 25, so the hypotenuse is √25 = 5 cm.', 'Calculate', 'AO1'),
  q('WCM-TRG', 'medium', 'A vertical pole casts a shadow 10 m long on level ground when the angle of elevation of the sun is 45°. Find the height of the pole.', '10 m', ['5 m', '14.1 m', '20 m'],
    'tan 45° = height/shadow and tan 45° = 1, so height = 10 × 1 = 10 m.', 'Calculate', 'AO2'),
  q('WCM-TRG', 'medium', 'For any angle θ, what is the value of sin²θ + cos²θ?', '1', ['0', '2', 'tan²θ'],
    'The Pythagorean identity states that sin²θ + cos²θ = 1 for every angle θ; it follows from applying the theorem of Pythagoras to a point on the unit circle.', 'State', 'AO2'),
  q('WCM-TRG', 'medium', 'The hypotenuse of a right-angled triangle is 13 cm and one leg is 5 cm. Find the length of the other leg.', '12 cm', ['8 cm', '18 cm', '√194 cm'],
    'By the theorem of Pythagoras: other leg² = 13² − 5² = 169 − 25 = 144, so the other leg is √144 = 12 cm. (√194 cm wrongly adds the squares.)', 'Calculate', 'AO2'),
  q('WCM-TRG', 'hard', 'In a right-angled triangle, sin θ = 5/13. Find the value of cos θ.', '12/13', ['13/5', '5/12', '13/12'],
    'sin θ = opposite/hypotenuse = 5/13, so by Pythagoras the adjacent side is √(13² − 5²) = √144 = 12. Hence cos θ = adjacent/hypotenuse = 12/13. (5/12 is tan θ.)', 'Find', 'AO3'),

  // --- Statistics & Probability (topic_wcoremath_statistics): 4 easy, 3 medium, 1 hard
  q('WCM-STA', 'easy', 'Find the mean of the numbers 2, 4, 6, 8 and 10.', '6', ['5', '10', '30'],
    'Mean = (2 + 4 + 6 + 8 + 10) ÷ 5 = 30 ÷ 5 = 6. (30 is the total, not the mean.)', 'Calculate', 'AO1'),
  q('WCM-STA', 'easy', 'The ages of six children are 3, 5, 3, 7, 3 and 5 years. What is the modal age?', '3 years', ['5 years', '7 years', '4 years'],
    'The mode is the most frequent value: 3 occurs three times, 5 occurs twice and 7 occurs once, so the modal age is 3 years.', 'State', 'AO1'),
  q('WCM-STA', 'easy', 'Find the median of the numbers 2, 3, 5, 8 and 9.', '5', ['5.4', '3', '8'],
    'The numbers are already in ascending order, so the median is the middle (3rd) value, 5. (5.4 is the mean, a different average.)', 'Find', 'AO1'),
  q('WCM-STA', 'easy', 'A fair die is thrown once. What is the probability of obtaining an even number?', '1/2', ['1/3', '1/6', '2/3'],
    'The even outcomes are 2, 4 and 6 — three of the six equally likely outcomes — so the probability is 3/6 = 1/2.', 'Calculate', 'AO1'),
  q('WCM-STA', 'medium', 'Find the median of the numbers 1, 2, 5, 7, 8 and 10.', '6', ['5.5', '5', '7'],
    'With six values, the median is the mean of the 3rd and 4th values: (5 + 7) ÷ 2 = 6. (5.5 is the mean of all six values.)', 'Find', 'AO2'),
  q('WCM-STA', 'medium', 'Two fair coins are tossed once. What is the probability that both coins show heads?', '1/4', ['1/2', '1/3', '1/8'],
    'The four equally likely outcomes are HH, HT, TH and TT. Only one of them is HH, so the probability is 1/4.', 'Calculate', 'AO2'),
  q('WCM-STA', 'medium', 'Find the range of the data set 12, 5, 9, 21 and 7.', '16', ['21', '5', '10.8'],
    'Range = largest value − smallest value = 21 − 5 = 16. (21 is merely the largest value.)', 'Calculate', 'AO2'),
  q('WCM-STA', 'hard', 'A bag contains 4 red balls and 6 blue balls. Two balls are drawn at random, one after the other, without replacement. Find the probability that both balls are red.', '2/15', ['4/25', '1/5', '2/25'],
    'P(first red) = 4/10. With only 3 red balls left out of 9, P(second red) = 3/9 = 1/3. Multiplying: 4/10 × 3/9 = 12/90 = 2/15. (4/25 wrongly assumes replacement.)', 'Calculate', 'AO3'),

  // --- Number and numeration (topic_wassce_p2_math_num): 4 easy, 3 medium, 1 hard
  q('WCM-NUM', 'easy', 'Express 0.25 as a fraction in its lowest terms.', '1/4', ['1/5', '4/25', '1/25'],
    '0.25 = 25/100. Dividing the numerator and denominator by 25 gives 1/4.', 'Express', 'AO1'),
  q('WCM-NUM', 'easy', 'Calculate 15% of GH₵200.00.', 'GH₵30.00', ['GH₵15.00', 'GH₵3.00', 'GH₵300.00'],
    '15% of 200 = (15/100) × 200 = 15 × 2 = GH₵30.00.', 'Calculate', 'AO1'),
  q('WCM-NUM', 'easy', 'Round 3.786 correct to one decimal place.', '3.8', ['3.7', '3.79', '4.0'],
    'The second decimal digit is 8, which is at least 5, so the first decimal digit rounds up: 3.786 ≈ 3.8 to one decimal place.', 'Round', 'AO1'),
  q('WCM-NUM', 'easy', 'Find the highest common factor (HCF) of 12 and 18.', '6', ['3', '36', '2'],
    'The factors of 12 are 1, 2, 3, 4, 6, 12 and the factors of 18 are 1, 2, 3, 6, 9, 18. The largest common factor is 6. (36 is the LCM, not the HCF.)', 'Find', 'AO1'),
  q('WCM-NUM', 'medium', 'A trader buys an article for GH₵50.00 and sells it for GH₵65.00. Calculate the percentage profit.', '30%', ['23.1%', '15%', '130%'],
    'Profit = 65 − 50 = GH₵15.00. Percentage profit = (profit ÷ cost price) × 100 = (15/50) × 100 = 30%. (23.1% wrongly uses the selling price as the base.)', 'Calculate', 'AO2'),
  q('WCM-NUM', 'medium', 'Calculate the simple interest on GH₵2,000.00 invested at 5% per annum for 3 years.', 'GH₵300.00', ['GH₵30.00', 'GH₵3,000.00', 'GH₵150.00'],
    'Simple interest = PRT/100 = (2,000 × 5 × 3)/100 = 30,000/100 = GH₵300.00. (GH₵150.00 is the interest for one year only.)', 'Calculate', 'AO2'),
  q('WCM-NUM', 'medium', 'An amount of GH₵840.00 is shared between two people in the ratio 3 : 4. Find the larger share.', 'GH₵480.00', ['GH₵420.00', 'GH₵360.00', 'GH₵120.00'],
    'Total parts = 3 + 4 = 7, so one part is 840 ÷ 7 = GH₵120.00. The larger share is 4 × 120 = GH₵480.00. (GH₵360.00 is the smaller share.)', 'Calculate', 'AO2'),
  q('WCM-NUM', 'hard', 'The price of a shirt is increased by 20% and the new price is later decreased by 20%. The final price is what percentage of the original price?', '96%', ['100%', '104%', '90%'],
    'After the increase the price is 1.20 times the original; after the decrease it is 1.20 × 0.80 = 0.96 times the original, which is 96%. The two 20% changes do not cancel because they act on different bases.', 'Calculate', 'AO3'),
];

// --- Batch assembly ---------------------------------------------------------
function mcq(source, index) {
  const correctIndex = index % 4;
  const rawOptions = [...source.wrong];
  rawOptions.splice(correctIndex, 0, source.correct);
  const options = rawOptions.map((text, optionIndex) => ({
    label: labels[optionIndex],
    text,
    rationale: optionIndex === correctIndex
      ? `This is the supported answer. ${source.solution}`
      : 'This is a plausible misconception, but it does not follow from the calculation in the worked solution.',
  }));
  return { options, correctAnswer: labels[correctIndex] };
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
    specificationCode: 'BRILLA-WASSCE-COREMATH-S1-001',
    sources: [curriculumSource],
    topics: topics.map(([code, , title, objective]) => ({ code, title, objective })),
    questions: questions.map((source, index) => {
      const built = mcq(source, index);
      return {
        id: `q_was_coremath_s1_${String(index + 1).padStart(3, '0')}`,
        original: true,
        topicCode: source.topicCode,
        type: 'multiple_choice',
        prompt: source.prompt,
        options: built.options,
        correctAnswer: built.correctAnswer,
        workedSolution: `${source.solution} Therefore the correct answer is ${built.correctAnswer}: ${source.correct}.`,
        difficulty: source.difficulty,
        marks: 1,
        points: 1,
        timeLimit: 90,
        commandWord: source.commandWord,
        assessmentObjective: source.assessmentObjective,
        provenance: [curriculumSource],
      };
    }),
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

function inHouseValidation(errors) {
  if (batch.review.automatedChecksAt !== generatedAt) errors.push('review.automatedChecksAt mismatch');
  if (batch.release.channel !== 'beta') errors.push('release.channel must be beta');
  if (typeof batch.release.contentLabel !== 'string' || batch.release.contentLabel.trim().length < 40) errors.push('release.contentLabel too short');
  if (!nonOfficialDisclaimerPattern.test(batch.release.contentLabel)) errors.push('release.contentLabel must explicitly state the content is not official WAEC material');
  if (batch.release.officialExamBoardContent !== false) errors.push('release.officialExamBoardContent must be false');
  if (batch.release.feedbackEnabled !== true) errors.push('release.feedbackEnabled must be true');
  assertNoFalseOfficialClaim(batch.release.contentLabel, 'release.contentLabel', errors);

  const letterCounts = { A: 0, B: 0, C: 0, D: 0 };
  const perTopic = new Map(topics.map(([code]) => [code, { total: 0, easy: 0, medium: 0, hard: 0 }]));
  for (const subject of batch.subjects) {
    for (const question of subject.questions) {
      const cell = perTopic.get(question.topicCode);
      if (!cell) { errors.push(`${question.id}: unknown topicCode ${question.topicCode}`); continue; }
      cell.total += 1;
      cell[question.difficulty] += 1;
      if (question.type !== 'multiple_choice') errors.push(`${question.id}: type must be multiple_choice`);
      if (question.marks !== 1) errors.push(`${question.id}: marks must be 1`);
      if (question.points !== 1) errors.push(`${question.id}: points must be 1`);
      if (question.timeLimit !== 90) errors.push(`${question.id}: timeLimit must be 90`);
      letterCounts[question.correctAnswer] += 1;
      if (!Array.isArray(question.provenance) || question.provenance[0]?.use !== 'curriculum_blueprint_only') errors.push(`${question.id}: per-item provenance missing`);
      assertNoFalseOfficialClaim(question.prompt, `${question.id}.prompt`, errors);
      assertNoFalseOfficialClaim(question.workedSolution, `${question.id}.workedSolution`, errors);
      for (const option of question.options ?? []) assertNoFalseOfficialClaim(option.text, `${question.id}.options`, errors);
    }
  }
  for (const [code, cell] of perTopic) {
    if (cell.total !== 8 || cell.easy !== 4 || cell.medium !== 3 || cell.hard !== 1) {
      errors.push(`${code}: expected 8 questions (4 easy, 3 medium, 1 hard), found ${cell.total} (${cell.easy}/${cell.medium}/${cell.hard})`);
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
    question_type: 'multiple_choice',
    round_type: null,
    options: JSON.stringify(question.options.map(({ label, text }) => `${label}. ${text}`)),
    correct_answer: question.correctAnswer,
    explanation: question.workedSolution,
    difficulty: question.difficulty,
    points: 1,
    marks: 1,
    time_limit: 90,
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

let migrationNumber = 402;
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
  ];
  const allTopicIds = canonicalTopicRows.map(([id]) => id);
  const name = `${migrationNumber}_wassce_core_math_sprint1_foundation.sql`;
  const lines = [
    `-- ${migrationNumber}: Foundation guard for WASSCE Core Mathematics sprint 1 beta batch (wassce-core-math-sprint1-001).`,
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
const questionsPerPart = 6;
const partCount = Math.ceil(allQuestions.length / questionsPerPart);
for (let part = 1; part <= partCount; part += 1) {
  const partQuestions = allQuestions.slice((part - 1) * questionsPerPart, part * questionsPerPart);
  const ids = partQuestions.map((question) => question.id);
  const guardTable = `_migration_${migrationNumber}_guard`;
  const name = `${migrationNumber}_wassce_core_math_sprint1_part_${part}.sql`;
  const lines = [
    `-- ${migrationNumber}: Original BrillaPrep WASSCE Core Mathematics sprint 1 beta questions, part ${part} of ${partCount} (batch wassce-core-math-sprint1-001).`,
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
  const name = `${migrationNumber}_wassce_core_math_sprint1_final_guard.sql`;
  const guardTable = `_migration_${migrationNumber}_guard`;
  const lines = [
    `-- ${migrationNumber}: Final exact-set and relationship guard for WASSCE Core Mathematics sprint 1 beta batch (wassce-core-math-sprint1-001).`,
    'PRAGMA foreign_keys = ON;',
    `CREATE TABLE IF NOT EXISTS ${guardTable} (valid INTEGER NOT NULL CHECK (valid = 1));`,
    `DELETE FROM ${guardTable};`,
    `INSERT INTO ${guardTable}(valid) SELECT CASE WHEN (SELECT COUNT(*) FROM questions q JOIN topics t ON t.id = q.topic_id JOIN question_content_releases r ON r.question_id = q.id WHERE q.id IN (${allIds.map(sql).join(', ')}) AND q.subject_id = t.subject_id AND q.subject_id = 'subj_wassce_core_math' AND q.exam_type_id = 'exam_wassce' AND q.exam_board_id = 'board_waec' AND q.question_type = 'multiple_choice' AND q.round_type IS NULL AND json_valid(q.options) AND json_array_length(q.options) = 4 AND q.correct_answer IN ('A', 'B', 'C', 'D') AND length(q.explanation) >= 80 AND r.batch_id = '${batchId}' AND r.quality_assurance = 'automated_beta' AND r.release_channel = 'beta' AND r.official_exam_board_content = 0 AND r.feedback_enabled = 1) = 48 AND (SELECT COUNT(*) FROM question_content_releases WHERE batch_id = '${batchId}') = 48 AND (SELECT COUNT(*) FROM questions WHERE id IN (${allIds.map(sql).join(', ')}) AND difficulty = 'easy') = 24 AND (SELECT COUNT(*) FROM questions WHERE id IN (${allIds.map(sql).join(', ')}) AND difficulty = 'medium') = 18 AND (SELECT COUNT(*) FROM questions WHERE id IN (${allIds.map(sql).join(', ')}) AND difficulty = 'hard') = 6 THEN 1 ELSE 0 END;`,
    `DROP TABLE ${guardTable};`,
  ];
  await emitMigration(name, lines);
  migrationNumber += 1;
}

console.log(JSON.stringify({ validation, outBatch, migrations: migrationPaths }, null, 2));
