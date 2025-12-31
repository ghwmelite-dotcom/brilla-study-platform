// Comprehensive Study Materials for Brilla Platform
// Includes topics, questions, past papers, and essay questions for NSMQ, WASSCE, and BECE

import type { Topic, SampleQuestion, PastPaper, EssayQuestion } from '@/types';

// =============================================
// WASSCE TOPICS
// =============================================

export const wassceTopics: Partial<Topic>[] = [
  // Core Mathematics Topics
  {
    id: 'topic_wassce_math_algebra',
    subjectId: 'subj_wassce_core_math',
    name: 'Algebra and Polynomials',
    slug: 'algebra-polynomials',
    description: 'Algebraic expressions, equations, and polynomial operations',
    theoryContent: `
## Algebra and Polynomials

Algebra is the foundation of higher mathematics. This topic covers:

### Key Concepts
1. **Algebraic Expressions** - Terms, coefficients, and like terms
2. **Polynomials** - Classification by degree and number of terms
3. **Factorization** - Common factors, grouping, and special products
4. **Solving Equations** - Linear, quadratic, and simultaneous equations

### Important Formulas
- Difference of squares: a² - b² = (a+b)(a-b)
- Perfect square trinomials: a² ± 2ab + b² = (a ± b)²
- Quadratic formula: x = (-b ± √(b²-4ac)) / 2a
    `,
    keyFormulas: [
      'a² - b² = (a+b)(a-b)',
      '(a+b)² = a² + 2ab + b²',
      'Quadratic formula: x = (-b ± √(b²-4ac)) / 2a'
    ],
    displayOrder: 1,
  },
  {
    id: 'topic_wassce_math_geometry',
    subjectId: 'subj_wassce_core_math',
    name: 'Mensuration and Geometry',
    slug: 'mensuration-geometry',
    description: 'Areas, volumes, and geometric properties',
    theoryContent: `
## Mensuration and Geometry

This topic covers the measurement of geometric shapes and their properties.

### Plane Shapes
- **Triangles**: Area = ½bh, Types (scalene, isosceles, equilateral)
- **Quadrilaterals**: Rectangle, square, parallelogram, trapezium
- **Circles**: Circumference = 2πr, Area = πr²

### Solid Shapes
- **Prisms**: Volume = Base area × height
- **Cylinders**: Volume = πr²h
- **Cones**: Volume = ⅓πr²h
- **Spheres**: Volume = ⅔πr³, Surface area = 4πr²
    `,
    keyFormulas: [
      'Area of triangle = ½bh',
      'Area of circle = πr²',
      'Volume of cylinder = πr²h',
      'Volume of cone = ⅓πr²h'
    ],
    displayOrder: 2,
  },
  {
    id: 'topic_wassce_math_trigonometry',
    subjectId: 'subj_wassce_core_math',
    name: 'Trigonometry',
    slug: 'trigonometry',
    description: 'Trigonometric ratios, identities, and applications',
    theoryContent: `
## Trigonometry

Trigonometry studies relationships between angles and sides of triangles.

### Basic Ratios
- sin θ = opposite/hypotenuse
- cos θ = adjacent/hypotenuse
- tan θ = opposite/adjacent

### Special Angles
| Angle | sin | cos | tan |
|-------|-----|-----|-----|
| 30° | ½ | √3/2 | 1/√3 |
| 45° | √2/2 | √2/2 | 1 |
| 60° | √3/2 | ½ | √3 |

### Identities
- sin²θ + cos²θ = 1
- tan θ = sin θ / cos θ
    `,
    keyFormulas: [
      'sin²θ + cos²θ = 1',
      'tan θ = sin θ / cos θ',
      'Sine rule: a/sin A = b/sin B = c/sin C',
      'Cosine rule: a² = b² + c² - 2bc cos A'
    ],
    displayOrder: 3,
  },
  {
    id: 'topic_wassce_math_statistics',
    subjectId: 'subj_wassce_core_math',
    name: 'Statistics and Probability',
    slug: 'statistics-probability',
    description: 'Data analysis, measures of central tendency, and probability',
    theoryContent: `
## Statistics and Probability

### Measures of Central Tendency
- **Mean** = Sum of values / Number of values
- **Median** = Middle value when data is ordered
- **Mode** = Most frequent value

### Measures of Dispersion
- **Range** = Highest - Lowest
- **Variance** = Σ(x - x̄)² / n
- **Standard Deviation** = √Variance

### Probability
- P(Event) = Favorable outcomes / Total outcomes
- 0 ≤ P(A) ≤ 1
- P(A') = 1 - P(A)
    `,
    keyFormulas: [
      'Mean = Σx/n',
      'Variance = Σ(x-μ)²/n',
      'P(A∪B) = P(A) + P(B) - P(A∩B)',
      'P(A∩B) = P(A) × P(B) for independent events'
    ],
    displayOrder: 4,
  },

  // English Language Topics
  {
    id: 'topic_wassce_eng_comprehension',
    subjectId: 'subj_wassce_english',
    name: 'Comprehension and Summary',
    slug: 'comprehension-summary',
    description: 'Reading comprehension and summary writing skills',
    theoryContent: `
## Comprehension and Summary

### Reading Comprehension Skills
1. **Skimming** - Quick reading for main ideas
2. **Scanning** - Looking for specific information
3. **Inference** - Reading between the lines
4. **Critical Analysis** - Evaluating author's purpose and tone

### Summary Writing
- Identify main points
- Use your own words
- Be concise (usually 1/3 of original)
- Maintain logical flow
- Avoid personal opinions
    `,
    displayOrder: 1,
  },
  {
    id: 'topic_wassce_eng_grammar',
    subjectId: 'subj_wassce_english',
    name: 'Grammar and Sentence Structure',
    slug: 'grammar-sentence-structure',
    description: 'Parts of speech, tenses, and sentence construction',
    theoryContent: `
## Grammar and Sentence Structure

### Parts of Speech
1. **Nouns** - Names of persons, places, things
2. **Verbs** - Action or state words
3. **Adjectives** - Describe nouns
4. **Adverbs** - Modify verbs, adjectives, other adverbs
5. **Pronouns** - Replace nouns
6. **Prepositions** - Show relationships
7. **Conjunctions** - Join words or clauses
8. **Interjections** - Express emotions

### Tenses
- Present (simple, continuous, perfect)
- Past (simple, continuous, perfect)
- Future (simple, continuous, perfect)
    `,
    displayOrder: 2,
  },
  {
    id: 'topic_wassce_eng_essay',
    subjectId: 'subj_wassce_english',
    name: 'Essay Writing',
    slug: 'essay-writing',
    description: 'Narrative, descriptive, argumentative, and expository essays',
    theoryContent: `
## Essay Writing

### Types of Essays
1. **Narrative** - Tells a story
2. **Descriptive** - Paints a picture with words
3. **Argumentative** - Presents and defends a position
4. **Expository** - Explains or informs
5. **Formal Letters** - Official correspondence
6. **Informal Letters** - Personal correspondence
7. **Articles** - For publication

### Essay Structure
- **Introduction** - Hook, background, thesis
- **Body Paragraphs** - Topic sentence, evidence, analysis
- **Conclusion** - Summary, final thoughts
    `,
    displayOrder: 3,
  },

  // Integrated Science Topics
  {
    id: 'topic_wassce_sci_matter',
    subjectId: 'subj_wassce_int_science',
    name: 'Matter and Its Properties',
    slug: 'matter-properties',
    description: 'States of matter, mixtures, and separation techniques',
    theoryContent: `
## Matter and Its Properties

### States of Matter
1. **Solid** - Fixed shape and volume
2. **Liquid** - Fixed volume, takes shape of container
3. **Gas** - No fixed shape or volume

### Classification of Matter
- **Elements** - Pure substances that cannot be broken down
- **Compounds** - Two or more elements chemically combined
- **Mixtures** - Physical combination of substances

### Separation Techniques
- Filtration (separates insoluble solids from liquids)
- Evaporation (separates dissolved solids from liquids)
- Distillation (separates liquids with different boiling points)
- Chromatography (separates colored substances)
    `,
    displayOrder: 1,
  },
  {
    id: 'topic_wassce_sci_energy',
    subjectId: 'subj_wassce_int_science',
    name: 'Energy and Forces',
    slug: 'energy-forces',
    description: 'Types of energy, energy transformations, and forces',
    theoryContent: `
## Energy and Forces

### Types of Energy
- Kinetic energy (moving objects)
- Potential energy (stored energy)
- Thermal energy (heat)
- Electrical energy
- Chemical energy
- Nuclear energy

### Energy Transformations
Energy cannot be created or destroyed, only transformed from one form to another.

### Forces
- **Gravitational force** - Attraction between masses
- **Electromagnetic force** - Between charged particles
- **Friction** - Opposes motion between surfaces
- **Normal force** - Perpendicular to surface
    `,
    keyFormulas: [
      'KE = ½mv²',
      'PE = mgh',
      'F = ma',
      'W = Fd'
    ],
    displayOrder: 2,
  },
  {
    id: 'topic_wassce_sci_living',
    subjectId: 'subj_wassce_int_science',
    name: 'Living Organisms',
    slug: 'living-organisms',
    description: 'Classification, cells, nutrition, and reproduction',
    theoryContent: `
## Living Organisms

### Characteristics of Living Things
1. Movement
2. Respiration
3. Nutrition
4. Irritability (Response)
5. Growth
6. Excretion
7. Reproduction

### Cell Structure
- **Cell membrane** - Controls entry/exit
- **Nucleus** - Contains genetic material
- **Cytoplasm** - Site of chemical reactions
- **Mitochondria** - Energy production
- **Chloroplasts** (plants) - Photosynthesis

### Classification
- Kingdom → Phylum → Class → Order → Family → Genus → Species
    `,
    displayOrder: 3,
  },

  // Social Studies Topics
  {
    id: 'topic_wassce_sst_governance',
    subjectId: 'subj_wassce_social',
    name: 'Governance and Politics',
    slug: 'governance-politics',
    description: 'Government systems, democracy, and citizenship',
    theoryContent: `
## Governance and Politics

### Arms of Government
1. **Executive** - Implements laws (President, Ministers)
2. **Legislature** - Makes laws (Parliament)
3. **Judiciary** - Interprets laws (Courts)

### Types of Government
- Democracy (rule by the people)
- Monarchy (rule by a king/queen)
- Dictatorship (rule by one person with absolute power)
- Theocracy (rule by religious leaders)

### Ghanaian Constitution
- 1992 Fourth Republican Constitution
- Fundamental human rights
- Separation of powers
- Rule of law
    `,
    displayOrder: 1,
  },
  {
    id: 'topic_wassce_sst_environment',
    subjectId: 'subj_wassce_social',
    name: 'Environment and Development',
    slug: 'environment-development',
    description: 'Environmental issues, sustainable development, and conservation',
    theoryContent: `
## Environment and Development

### Environmental Issues
- Deforestation
- Pollution (air, water, land)
- Climate change
- Desertification
- Loss of biodiversity

### Sustainable Development
Development that meets present needs without compromising future generations.

### Conservation Methods
- Afforestation and reforestation
- Waste management (reduce, reuse, recycle)
- Protected areas and wildlife reserves
- Renewable energy adoption
- Environmental education
    `,
    displayOrder: 2,
  },
];

// =============================================
// BECE TOPICS
// =============================================

export const beceTopics: Partial<Topic>[] = [
  // Mathematics Topics
  {
    id: 'topic_bece_math_numbers',
    subjectId: 'subj_bece_math',
    name: 'Numbers and Numeration',
    slug: 'numbers-numeration',
    description: 'Number systems, operations, and properties',
    theoryContent: `
## Numbers and Numeration

### Types of Numbers
- **Natural Numbers**: 1, 2, 3, 4, ...
- **Whole Numbers**: 0, 1, 2, 3, ...
- **Integers**: ..., -2, -1, 0, 1, 2, ...
- **Fractions and Decimals**
- **Rational Numbers**: Can be expressed as a/b

### Operations
- Addition, Subtraction, Multiplication, Division
- BODMAS rule (Brackets, Orders, Division, Multiplication, Addition, Subtraction)

### Factors and Multiples
- **Factor**: A number that divides evenly
- **Multiple**: Product of a number and an integer
- **HCF**: Highest Common Factor
- **LCM**: Lowest Common Multiple
    `,
    displayOrder: 1,
  },
  {
    id: 'topic_bece_math_fractions',
    subjectId: 'subj_bece_math',
    name: 'Fractions, Decimals, and Percentages',
    slug: 'fractions-decimals-percentages',
    description: 'Working with fractions, decimals, and percentage calculations',
    theoryContent: `
## Fractions, Decimals, and Percentages

### Fractions
- Proper fractions (numerator < denominator)
- Improper fractions (numerator > denominator)
- Mixed numbers (whole number + fraction)

### Converting Between Forms
- Fraction to decimal: divide numerator by denominator
- Decimal to percentage: multiply by 100
- Percentage to fraction: divide by 100

### Percentage Calculations
- Percentage of a quantity = (percentage/100) × quantity
- Percentage increase/decrease
- Simple interest = (P × R × T) / 100
    `,
    keyFormulas: [
      'Percentage = (Part/Whole) × 100',
      'Simple Interest = (P × R × T) / 100'
    ],
    displayOrder: 2,
  },
  {
    id: 'topic_bece_math_ratio',
    subjectId: 'subj_bece_math',
    name: 'Ratio, Rate, and Proportion',
    slug: 'ratio-rate-proportion',
    description: 'Understanding ratios, rates, and proportional relationships',
    theoryContent: `
## Ratio, Rate, and Proportion

### Ratio
- Comparison of two quantities by division
- Written as a:b or a/b
- Simplify by dividing by HCF

### Rate
- Comparison of quantities with different units
- Examples: speed (km/h), price (GH₵/kg)

### Proportion
- Direct proportion: as one increases, the other increases
- Inverse proportion: as one increases, the other decreases
- Cross multiplication to solve proportions
    `,
    keyFormulas: [
      'Speed = Distance / Time',
      'If a/b = c/d, then ad = bc (cross multiplication)'
    ],
    displayOrder: 3,
  },

  // Integrated Science Topics
  {
    id: 'topic_bece_sci_plants',
    subjectId: 'subj_bece_science',
    name: 'Plants and Photosynthesis',
    slug: 'plants-photosynthesis',
    description: 'Plant structure, photosynthesis, and plant nutrition',
    theoryContent: `
## Plants and Photosynthesis

### Parts of a Plant
- **Roots**: Absorb water and minerals, anchor plant
- **Stem**: Transport, support
- **Leaves**: Photosynthesis
- **Flowers**: Reproduction

### Photosynthesis
The process by which plants make food using sunlight.

**Equation:**
6CO₂ + 6H₂O + Light → C₆H₁₂O₆ + 6O₂

**Requirements:**
- Carbon dioxide
- Water
- Sunlight
- Chlorophyll

**Products:**
- Glucose (food)
- Oxygen
    `,
    displayOrder: 1,
  },
  {
    id: 'topic_bece_sci_human_body',
    subjectId: 'subj_bece_science',
    name: 'Human Body Systems',
    slug: 'human-body-systems',
    description: 'Digestive, circulatory, and respiratory systems',
    theoryContent: `
## Human Body Systems

### Digestive System
- **Mouth**: Chewing, saliva
- **Stomach**: Acid digestion
- **Small intestine**: Nutrient absorption
- **Large intestine**: Water absorption

### Circulatory System
- **Heart**: Pumps blood
- **Blood vessels**: Arteries, veins, capillaries
- **Blood**: Red cells, white cells, platelets, plasma

### Respiratory System
- **Nose**: Filters, warms, moistens air
- **Lungs**: Gas exchange
- **Diaphragm**: Breathing muscle
    `,
    displayOrder: 2,
  },

  // English Topics
  {
    id: 'topic_bece_eng_reading',
    subjectId: 'subj_bece_english',
    name: 'Reading Comprehension',
    slug: 'reading-comprehension',
    description: 'Understanding and analyzing written passages',
    theoryContent: `
## Reading Comprehension

### Skills for Comprehension
1. **Reading carefully** - Don't skim
2. **Understanding vocabulary** - Use context clues
3. **Identifying main ideas** - What is the passage about?
4. **Finding details** - Supporting information
5. **Making inferences** - Reading between the lines

### Tips for Success
- Read the passage twice
- Read questions before answering
- Look for keywords in questions
- Answer in complete sentences
- Check your spelling and grammar
    `,
    displayOrder: 1,
  },
  {
    id: 'topic_bece_eng_composition',
    subjectId: 'subj_bece_english',
    name: 'Composition Writing',
    slug: 'composition-writing',
    description: 'Writing stories, letters, and essays',
    theoryContent: `
## Composition Writing

### Types of Compositions
1. **Narrative**: Tells a story
2. **Descriptive**: Describes a person, place, or thing
3. **Letter Writing**: Formal and informal letters
4. **Article Writing**: For newspapers/magazines

### Structure
- **Introduction**: Capture attention
- **Body**: Develop your ideas (3-4 paragraphs)
- **Conclusion**: Wrap up effectively

### Tips
- Plan before writing
- Use varied vocabulary
- Check spelling and punctuation
- Stay within word limit
    `,
    displayOrder: 2,
  },

  // Social Studies Topics
  {
    id: 'topic_bece_sst_ghana',
    subjectId: 'subj_bece_social',
    name: 'Ghana: Our Homeland',
    slug: 'ghana-homeland',
    description: 'Geography, history, and culture of Ghana',
    theoryContent: `
## Ghana: Our Homeland

### Geography
- Location: West Africa, Gulf of Guinea
- Capital: Accra
- Regions: 16 administrative regions
- Major rivers: Volta, Pra, Ankobra, Tano

### History
- Gold Coast under British rule
- Independence: March 6, 1957
- First President: Dr. Kwame Nkrumah
- Current constitution: 1992 (Fourth Republic)

### National Symbols
- Flag: Red, Gold, Green with Black Star
- Coat of Arms
- National Anthem: "God Bless Our Homeland Ghana"
- National Pledge
    `,
    displayOrder: 1,
  },
  {
    id: 'topic_bece_sst_citizenship',
    subjectId: 'subj_bece_social',
    name: 'Citizenship and Rights',
    slug: 'citizenship-rights',
    description: 'Rights, responsibilities, and civic duties',
    theoryContent: `
## Citizenship and Rights

### Ways of Becoming a Ghanaian
1. By birth (parents are Ghanaian)
2. By registration
3. By naturalization

### Rights of Citizens
- Right to life
- Right to education
- Right to vote
- Freedom of speech
- Freedom of movement
- Right to own property

### Responsibilities
- Pay taxes
- Obey laws
- Vote in elections
- Protect the environment
- Respect others' rights
    `,
    displayOrder: 2,
  },
];

// =============================================
// WASSCE QUESTIONS
// =============================================

export const wassceQuestions: SampleQuestion[] = [
  // Core Mathematics
  {
    id: 'wassce_math_001',
    topicId: 'topic_wassce_math_algebra',
    subjectId: 'subj_wassce_core_math',
    questionText: 'Factorize completely: x² - 9',
    questionType: 'objective',
    options: ['(x-3)(x-3)', '(x+3)(x-3)', '(x+9)(x-1)', '(x+3)(x+3)'],
    correctAnswer: '(x+3)(x-3)',
    explanation: 'This is a difference of two squares. x² - 9 = x² - 3² = (x+3)(x-3)',
    difficulty: 'easy',
    points: 2,
    examTypeId: 'exam_wassce',
    paperTypeId: 'paper_wassce_1',
  },
  {
    id: 'wassce_math_002',
    topicId: 'topic_wassce_math_algebra',
    subjectId: 'subj_wassce_core_math',
    questionText: 'Solve for x: 2x + 5 = 3x - 7',
    questionType: 'objective',
    options: ['x = 12', 'x = -12', 'x = 2', 'x = -2'],
    correctAnswer: 'x = 12',
    explanation: '2x + 5 = 3x - 7; 5 + 7 = 3x - 2x; 12 = x',
    difficulty: 'easy',
    points: 2,
    examTypeId: 'exam_wassce',
    paperTypeId: 'paper_wassce_1',
  },
  {
    id: 'wassce_math_003',
    topicId: 'topic_wassce_math_geometry',
    subjectId: 'subj_wassce_core_math',
    questionText: 'The area of a circle is 154 cm². Find its radius. (Take π = 22/7)',
    questionType: 'objective',
    options: ['7 cm', '14 cm', '49 cm', '22 cm'],
    correctAnswer: '7 cm',
    explanation: 'Area = πr²; 154 = (22/7)r²; r² = 154 × 7/22 = 49; r = 7 cm',
    difficulty: 'medium',
    points: 2,
    examTypeId: 'exam_wassce',
    paperTypeId: 'paper_wassce_1',
  },
  {
    id: 'wassce_math_004',
    topicId: 'topic_wassce_math_trigonometry',
    subjectId: 'subj_wassce_core_math',
    questionText: 'If tan θ = 3/4, what is sin θ?',
    questionType: 'objective',
    options: ['3/5', '4/5', '3/4', '5/3'],
    correctAnswer: '3/5',
    explanation: 'If tan θ = 3/4 = opp/adj, then hyp = √(3² + 4²) = 5. So sin θ = opp/hyp = 3/5',
    difficulty: 'medium',
    points: 2,
    examTypeId: 'exam_wassce',
    paperTypeId: 'paper_wassce_1',
  },
  {
    id: 'wassce_math_005',
    topicId: 'topic_wassce_math_statistics',
    subjectId: 'subj_wassce_core_math',
    questionText: 'Find the mean of: 12, 15, 18, 21, 24',
    questionType: 'objective',
    options: ['15', '18', '21', '90'],
    correctAnswer: '18',
    explanation: 'Mean = (12 + 15 + 18 + 21 + 24) / 5 = 90 / 5 = 18',
    difficulty: 'easy',
    points: 2,
    examTypeId: 'exam_wassce',
    paperTypeId: 'paper_wassce_1',
  },
  {
    id: 'wassce_math_006',
    topicId: 'topic_wassce_math_statistics',
    subjectId: 'subj_wassce_core_math',
    questionText: 'A bag contains 3 red balls, 5 blue balls, and 2 green balls. What is the probability of picking a blue ball?',
    questionType: 'objective',
    options: ['1/2', '3/10', '1/5', '2/5'],
    correctAnswer: '1/2',
    explanation: 'Total balls = 3 + 5 + 2 = 10. P(blue) = 5/10 = 1/2',
    difficulty: 'easy',
    points: 2,
    examTypeId: 'exam_wassce',
    paperTypeId: 'paper_wassce_1',
  },

  // English Language
  {
    id: 'wassce_eng_001',
    topicId: 'topic_wassce_eng_grammar',
    subjectId: 'subj_wassce_english',
    questionText: 'Choose the correct option: The committee _____ divided in their opinions.',
    questionType: 'objective',
    options: ['is', 'are', 'was', 'were'],
    correctAnswer: 'were',
    explanation: 'When "committee" refers to individual members acting separately (as in having different opinions), use a plural verb.',
    difficulty: 'medium',
    points: 2,
    examTypeId: 'exam_wassce',
    paperTypeId: 'paper_wassce_1',
  },
  {
    id: 'wassce_eng_002',
    topicId: 'topic_wassce_eng_grammar',
    subjectId: 'subj_wassce_english',
    questionText: 'Identify the part of speech of "quickly" in: She ran quickly.',
    questionType: 'objective',
    options: ['Adjective', 'Adverb', 'Verb', 'Noun'],
    correctAnswer: 'Adverb',
    explanation: '"Quickly" modifies the verb "ran" and describes how she ran, making it an adverb.',
    difficulty: 'easy',
    points: 2,
    examTypeId: 'exam_wassce',
    paperTypeId: 'paper_wassce_1',
  },
  {
    id: 'wassce_eng_003',
    topicId: 'topic_wassce_eng_grammar',
    subjectId: 'subj_wassce_english',
    questionText: 'The antonym of "abundant" is:',
    questionType: 'objective',
    options: ['plentiful', 'scarce', 'sufficient', 'excessive'],
    correctAnswer: 'scarce',
    explanation: 'Abundant means plentiful or in large quantities. Scarce means in short supply, the opposite.',
    difficulty: 'easy',
    points: 2,
    examTypeId: 'exam_wassce',
    paperTypeId: 'paper_wassce_1',
  },

  // Integrated Science
  {
    id: 'wassce_sci_001',
    topicId: 'topic_wassce_sci_matter',
    subjectId: 'subj_wassce_int_science',
    questionText: 'Which separation technique is used to separate a mixture of oil and water?',
    questionType: 'objective',
    options: ['Filtration', 'Distillation', 'Using a separating funnel', 'Evaporation'],
    correctAnswer: 'Using a separating funnel',
    explanation: 'Oil and water are immiscible liquids with different densities. A separating funnel allows the denser liquid (water) to be drained from the bottom.',
    difficulty: 'easy',
    points: 2,
    examTypeId: 'exam_wassce',
    paperTypeId: 'paper_wassce_1',
  },
  {
    id: 'wassce_sci_002',
    topicId: 'topic_wassce_sci_energy',
    subjectId: 'subj_wassce_int_science',
    questionText: 'What is the SI unit of energy?',
    questionType: 'objective',
    options: ['Newton', 'Joule', 'Watt', 'Pascal'],
    correctAnswer: 'Joule',
    explanation: 'The Joule (J) is the SI unit of energy and work. Newton is force, Watt is power, Pascal is pressure.',
    difficulty: 'easy',
    points: 2,
    examTypeId: 'exam_wassce',
    paperTypeId: 'paper_wassce_1',
  },
  {
    id: 'wassce_sci_003',
    topicId: 'topic_wassce_sci_living',
    subjectId: 'subj_wassce_int_science',
    questionText: 'The organelle responsible for photosynthesis in plant cells is:',
    questionType: 'objective',
    options: ['Mitochondria', 'Nucleus', 'Chloroplast', 'Ribosome'],
    correctAnswer: 'Chloroplast',
    explanation: 'Chloroplasts contain chlorophyll, which captures light energy for photosynthesis.',
    difficulty: 'easy',
    points: 2,
    examTypeId: 'exam_wassce',
    paperTypeId: 'paper_wassce_1',
  },

  // Social Studies
  {
    id: 'wassce_sst_001',
    topicId: 'topic_wassce_sst_governance',
    subjectId: 'subj_wassce_social',
    questionText: 'Which arm of government is responsible for making laws in Ghana?',
    questionType: 'objective',
    options: ['Executive', 'Legislature', 'Judiciary', 'Electoral Commission'],
    correctAnswer: 'Legislature',
    explanation: 'The Legislature (Parliament) makes laws. The Executive implements them, and the Judiciary interprets them.',
    difficulty: 'easy',
    points: 2,
    examTypeId: 'exam_wassce',
    paperTypeId: 'paper_wassce_1',
  },
  {
    id: 'wassce_sst_002',
    topicId: 'topic_wassce_sst_environment',
    subjectId: 'subj_wassce_social',
    questionText: 'Which of the following is NOT a cause of environmental degradation?',
    questionType: 'objective',
    options: ['Deforestation', 'Afforestation', 'Pollution', 'Mining'],
    correctAnswer: 'Afforestation',
    explanation: 'Afforestation (planting trees) helps the environment. The others are causes of degradation.',
    difficulty: 'easy',
    points: 2,
    examTypeId: 'exam_wassce',
    paperTypeId: 'paper_wassce_1',
  },
];

// =============================================
// BECE QUESTIONS
// =============================================

export const beceQuestions: SampleQuestion[] = [
  // Mathematics
  {
    id: 'bece_math_001',
    topicId: 'topic_bece_math_numbers',
    subjectId: 'subj_bece_math',
    questionText: 'What is the HCF of 12 and 18?',
    questionType: 'objective',
    options: ['2', '3', '6', '36'],
    correctAnswer: '6',
    explanation: 'Factors of 12: 1, 2, 3, 4, 6, 12. Factors of 18: 1, 2, 3, 6, 9, 18. HCF = 6',
    difficulty: 'easy',
    points: 1,
    examTypeId: 'exam_bece',
    paperTypeId: 'paper_bece_1',
  },
  {
    id: 'bece_math_002',
    topicId: 'topic_bece_math_fractions',
    subjectId: 'subj_bece_math',
    questionText: 'Express 0.25 as a fraction in its simplest form.',
    questionType: 'objective',
    options: ['25/100', '1/4', '2/5', '1/5'],
    correctAnswer: '1/4',
    explanation: '0.25 = 25/100 = 1/4 (dividing both by 25)',
    difficulty: 'easy',
    points: 1,
    examTypeId: 'exam_bece',
    paperTypeId: 'paper_bece_1',
  },
  {
    id: 'bece_math_003',
    topicId: 'topic_bece_math_fractions',
    subjectId: 'subj_bece_math',
    questionText: 'Calculate 15% of GH₵200.',
    questionType: 'objective',
    options: ['GH₵15', 'GH₵30', 'GH₵35', 'GH₵45'],
    correctAnswer: 'GH₵30',
    explanation: '15% of 200 = (15/100) × 200 = 0.15 × 200 = 30',
    difficulty: 'easy',
    points: 1,
    examTypeId: 'exam_bece',
    paperTypeId: 'paper_bece_1',
  },
  {
    id: 'bece_math_004',
    topicId: 'topic_bece_math_ratio',
    subjectId: 'subj_bece_math',
    questionText: 'Divide GH₵120 in the ratio 2:3.',
    questionType: 'objective',
    options: ['GH₵40 and GH₵80', 'GH₵48 and GH₵72', 'GH₵60 and GH₵60', 'GH₵24 and GH₵96'],
    correctAnswer: 'GH₵48 and GH₵72',
    explanation: 'Total parts = 2 + 3 = 5. Each part = 120/5 = 24. First share = 2 × 24 = 48, Second = 3 × 24 = 72',
    difficulty: 'medium',
    points: 1,
    examTypeId: 'exam_bece',
    paperTypeId: 'paper_bece_1',
  },

  // Integrated Science
  {
    id: 'bece_sci_001',
    topicId: 'topic_bece_sci_plants',
    subjectId: 'subj_bece_science',
    questionText: 'Which gas is produced during photosynthesis?',
    questionType: 'objective',
    options: ['Carbon dioxide', 'Nitrogen', 'Oxygen', 'Hydrogen'],
    correctAnswer: 'Oxygen',
    explanation: 'Photosynthesis produces oxygen and glucose: 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂',
    difficulty: 'easy',
    points: 1,
    examTypeId: 'exam_bece',
    paperTypeId: 'paper_bece_1',
  },
  {
    id: 'bece_sci_002',
    topicId: 'topic_bece_sci_human_body',
    subjectId: 'subj_bece_science',
    questionText: 'Which organ pumps blood around the body?',
    questionType: 'objective',
    options: ['Liver', 'Lungs', 'Heart', 'Kidney'],
    correctAnswer: 'Heart',
    explanation: 'The heart is a muscular organ that pumps blood through the circulatory system.',
    difficulty: 'easy',
    points: 1,
    examTypeId: 'exam_bece',
    paperTypeId: 'paper_bece_1',
  },
  {
    id: 'bece_sci_003',
    topicId: 'topic_bece_sci_human_body',
    subjectId: 'subj_bece_science',
    questionText: 'Where does digestion begin in humans?',
    questionType: 'objective',
    options: ['Stomach', 'Small intestine', 'Mouth', 'Large intestine'],
    correctAnswer: 'Mouth',
    explanation: 'Digestion begins in the mouth where food is mechanically broken down by teeth and chemically by saliva.',
    difficulty: 'easy',
    points: 1,
    examTypeId: 'exam_bece',
    paperTypeId: 'paper_bece_1',
  },

  // English Language
  {
    id: 'bece_eng_001',
    topicId: 'topic_bece_eng_reading',
    subjectId: 'subj_bece_english',
    questionText: 'The plural of "child" is:',
    questionType: 'objective',
    options: ['childs', 'childes', 'children', 'childrens'],
    correctAnswer: 'children',
    explanation: '"Child" is an irregular noun. Its plural form is "children", not "childs".',
    difficulty: 'easy',
    points: 1,
    examTypeId: 'exam_bece',
    paperTypeId: 'paper_bece_1',
  },
  {
    id: 'bece_eng_002',
    topicId: 'topic_bece_eng_reading',
    subjectId: 'subj_bece_english',
    questionText: 'Choose the correct sentence:',
    questionType: 'objective',
    options: ['He go to school yesterday.', 'He went to school yesterday.', 'He goes to school yesterday.', 'He going to school yesterday.'],
    correctAnswer: 'He went to school yesterday.',
    explanation: '"Yesterday" indicates past tense, so "went" (past tense of "go") is correct.',
    difficulty: 'easy',
    points: 1,
    examTypeId: 'exam_bece',
    paperTypeId: 'paper_bece_1',
  },

  // Social Studies
  {
    id: 'bece_sst_001',
    topicId: 'topic_bece_sst_ghana',
    subjectId: 'subj_bece_social',
    questionText: 'When did Ghana gain independence?',
    questionType: 'objective',
    options: ['March 6, 1957', 'July 1, 1960', 'February 24, 1966', 'January 1, 1958'],
    correctAnswer: 'March 6, 1957',
    explanation: 'Ghana gained independence from Britain on March 6, 1957, becoming the first sub-Saharan African country to do so.',
    difficulty: 'easy',
    points: 1,
    examTypeId: 'exam_bece',
    paperTypeId: 'paper_bece_1',
  },
  {
    id: 'bece_sst_002',
    topicId: 'topic_bece_sst_ghana',
    subjectId: 'subj_bece_social',
    questionText: 'Who was the first President of Ghana?',
    questionType: 'objective',
    options: ['J.B. Danquah', 'Kwame Nkrumah', 'John Agyekum Kufuor', 'Jerry John Rawlings'],
    correctAnswer: 'Kwame Nkrumah',
    explanation: 'Dr. Kwame Nkrumah led Ghana to independence and became its first President in 1960.',
    difficulty: 'easy',
    points: 1,
    examTypeId: 'exam_bece',
    paperTypeId: 'paper_bece_1',
  },
  {
    id: 'bece_sst_003',
    topicId: 'topic_bece_sst_citizenship',
    subjectId: 'subj_bece_social',
    questionText: 'Which of the following is a responsibility of a citizen?',
    questionType: 'objective',
    options: ['Receiving free education', 'Paying taxes', 'Receiving healthcare', 'Freedom of movement'],
    correctAnswer: 'Paying taxes',
    explanation: 'Paying taxes is a civic responsibility. The others are rights that citizens enjoy.',
    difficulty: 'easy',
    points: 1,
    examTypeId: 'exam_bece',
    paperTypeId: 'paper_bece_1',
  },
];

// =============================================
// PAST PAPERS - Only includes papers that exist in the database
// =============================================

export const pastPapers: Partial<PastPaper>[] = [
  // =============================================
  // WASSCE Past Papers - Core Mathematics
  // =============================================
  { id: 'pp_wassce_math_2024_1', examTypeId: 'exam_wassce', subjectId: 'subj_wassce_core_math', paperTypeId: 'paper_wassce_1', year: 2024, month: 'May-June', totalQuestions: 50, totalMarks: 50, timeAllowed: 90, isComplete: true },
  { id: 'pp_wassce_math_2023_1', examTypeId: 'exam_wassce', subjectId: 'subj_wassce_core_math', paperTypeId: 'paper_wassce_1', year: 2023, month: 'May-June', totalQuestions: 50, totalMarks: 50, timeAllowed: 90, isComplete: true },

  // =============================================
  // WASSCE Past Papers - English Language
  // =============================================
  { id: 'pp_wassce_eng_2024_1', examTypeId: 'exam_wassce', subjectId: 'subj_wassce_english', paperTypeId: 'paper_wassce_1', year: 2024, month: 'May-June', totalQuestions: 80, totalMarks: 80, timeAllowed: 60, isComplete: true },
  { id: 'pp_wassce_eng_2023_1', examTypeId: 'exam_wassce', subjectId: 'subj_wassce_english', paperTypeId: 'paper_wassce_1', year: 2023, month: 'May-June', totalQuestions: 80, totalMarks: 80, timeAllowed: 60, isComplete: true },

  // =============================================
  // WASSCE Past Papers - Integrated Science
  // =============================================
  { id: 'pp_wassce_sci_2024_1', examTypeId: 'exam_wassce', subjectId: 'subj_wassce_int_science', paperTypeId: 'paper_wassce_1', year: 2024, month: 'May-June', totalQuestions: 50, totalMarks: 50, timeAllowed: 60, isComplete: true },
  { id: 'pp_wassce_sci_2023_1', examTypeId: 'exam_wassce', subjectId: 'subj_wassce_int_science', paperTypeId: 'paper_wassce_1', year: 2023, month: 'May-June', totalQuestions: 50, totalMarks: 50, timeAllowed: 60, isComplete: true },

  // =============================================
  // WASSCE Past Papers - Social Studies
  // =============================================
  { id: 'pp_wassce_soc_2024_1', examTypeId: 'exam_wassce', subjectId: 'subj_wassce_social', paperTypeId: 'paper_wassce_1', year: 2024, month: 'May-June', totalQuestions: 50, totalMarks: 50, timeAllowed: 60, isComplete: true },
  { id: 'pp_wassce_soc_2023_1', examTypeId: 'exam_wassce', subjectId: 'subj_wassce_social', paperTypeId: 'paper_wassce_1', year: 2023, month: 'May-June', totalQuestions: 50, totalMarks: 50, timeAllowed: 60, isComplete: true },

  // =============================================
  // WASSCE Past Papers - Physics (Elective)
  // =============================================
  { id: 'pp_wassce_phy_2024_1', examTypeId: 'exam_wassce', subjectId: 'subj_wassce_physics', paperTypeId: 'paper_wassce_1', year: 2024, month: 'May-June', totalQuestions: 50, totalMarks: 50, timeAllowed: 60, isComplete: true },
  { id: 'pp_wassce_phy_2023_1', examTypeId: 'exam_wassce', subjectId: 'subj_wassce_physics', paperTypeId: 'paper_wassce_1', year: 2023, month: 'May-June', totalQuestions: 50, totalMarks: 50, timeAllowed: 60, isComplete: true },

  // =============================================
  // WASSCE Past Papers - Chemistry (Elective)
  // =============================================
  { id: 'pp_wassce_chem_2024_1', examTypeId: 'exam_wassce', subjectId: 'subj_wassce_chemistry', paperTypeId: 'paper_wassce_1', year: 2024, month: 'May-June', totalQuestions: 50, totalMarks: 50, timeAllowed: 60, isComplete: true },
  { id: 'pp_wassce_chem_2023_1', examTypeId: 'exam_wassce', subjectId: 'subj_wassce_chemistry', paperTypeId: 'paper_wassce_1', year: 2023, month: 'May-June', totalQuestions: 50, totalMarks: 50, timeAllowed: 60, isComplete: true },

  // =============================================
  // WASSCE Past Papers - Biology (Elective)
  // =============================================
  { id: 'pp_wassce_bio_2024_1', examTypeId: 'exam_wassce', subjectId: 'subj_wassce_biology', paperTypeId: 'paper_wassce_1', year: 2024, month: 'May-June', totalQuestions: 50, totalMarks: 50, timeAllowed: 50, isComplete: true },
  { id: 'pp_wassce_bio_2023_1', examTypeId: 'exam_wassce', subjectId: 'subj_wassce_biology', paperTypeId: 'paper_wassce_1', year: 2023, month: 'May-June', totalQuestions: 50, totalMarks: 50, timeAllowed: 50, isComplete: true },

  // =============================================
  // WASSCE Past Papers - Elective Mathematics
  // =============================================
  { id: 'pp_wassce_emath_2024_1', examTypeId: 'exam_wassce', subjectId: 'subj_wassce_elective_math', paperTypeId: 'paper_wassce_1', year: 2024, month: 'May-June', totalQuestions: 40, totalMarks: 40, timeAllowed: 60, isComplete: true },
  { id: 'pp_wassce_emath_2023_1', examTypeId: 'exam_wassce', subjectId: 'subj_wassce_elective_math', paperTypeId: 'paper_wassce_1', year: 2023, month: 'May-June', totalQuestions: 40, totalMarks: 40, timeAllowed: 60, isComplete: true },

  // =============================================
  // WASSCE Past Papers - Economics (Business)
  // =============================================
  { id: 'pp_wassce_eco_2024_1', examTypeId: 'exam_wassce', subjectId: 'subj_wassce_economics', paperTypeId: 'paper_wassce_1', year: 2024, month: 'May-June', totalQuestions: 50, totalMarks: 50, timeAllowed: 60, isComplete: true },
  { id: 'pp_wassce_eco_2023_1', examTypeId: 'exam_wassce', subjectId: 'subj_wassce_economics', paperTypeId: 'paper_wassce_1', year: 2023, month: 'May-June', totalQuestions: 50, totalMarks: 50, timeAllowed: 60, isComplete: true },

  // =============================================
  // WASSCE Past Papers - Government (Arts)
  // =============================================
  { id: 'pp_wassce_gov_2024_1', examTypeId: 'exam_wassce', subjectId: 'subj_wassce_government', paperTypeId: 'paper_wassce_1', year: 2024, month: 'May-June', totalQuestions: 50, totalMarks: 50, timeAllowed: 60, isComplete: true },
  { id: 'pp_wassce_gov_2023_1', examTypeId: 'exam_wassce', subjectId: 'subj_wassce_government', paperTypeId: 'paper_wassce_1', year: 2023, month: 'May-June', totalQuestions: 50, totalMarks: 50, timeAllowed: 60, isComplete: true },

  // =============================================
  // WASSCE Past Papers - Geography (Arts)
  // =============================================
  { id: 'pp_wassce_geo_2024_1', examTypeId: 'exam_wassce', subjectId: 'subj_wassce_geography', paperTypeId: 'paper_wassce_1', year: 2024, month: 'May-June', totalQuestions: 50, totalMarks: 50, timeAllowed: 60, isComplete: true },
  { id: 'pp_wassce_geo_2023_1', examTypeId: 'exam_wassce', subjectId: 'subj_wassce_geography', paperTypeId: 'paper_wassce_1', year: 2023, month: 'May-June', totalQuestions: 50, totalMarks: 50, timeAllowed: 60, isComplete: true },

  // =============================================
  // WASSCE Past Papers - Literature in English (Arts)
  // =============================================
  { id: 'pp_wassce_lit_2024_1', examTypeId: 'exam_wassce', subjectId: 'subj_wassce_literature', paperTypeId: 'paper_wassce_1', year: 2024, month: 'May-June', totalQuestions: 50, totalMarks: 50, timeAllowed: 60, isComplete: true },
  { id: 'pp_wassce_lit_2023_1', examTypeId: 'exam_wassce', subjectId: 'subj_wassce_literature', paperTypeId: 'paper_wassce_1', year: 2023, month: 'May-June', totalQuestions: 50, totalMarks: 50, timeAllowed: 60, isComplete: true },

  // =============================================
  // WASSCE Past Papers - Financial Accounting (Business)
  // =============================================
  { id: 'pp_wassce_acc_2024_1', examTypeId: 'exam_wassce', subjectId: 'subj_wassce_accounting', paperTypeId: 'paper_wassce_1', year: 2024, month: 'May-June', totalQuestions: 50, totalMarks: 50, timeAllowed: 60, isComplete: true },
  { id: 'pp_wassce_acc_2023_1', examTypeId: 'exam_wassce', subjectId: 'subj_wassce_accounting', paperTypeId: 'paper_wassce_1', year: 2023, month: 'May-June', totalQuestions: 50, totalMarks: 50, timeAllowed: 60, isComplete: true },

  // =============================================
  // WASSCE Past Papers - Christian Religious Studies
  // =============================================
  { id: 'pp_wassce_crs_2024_1', examTypeId: 'exam_wassce', subjectId: 'subj_wassce_crs', paperTypeId: 'paper_wassce_1', year: 2024, month: 'May-June', totalQuestions: 50, totalMarks: 50, timeAllowed: 60, isComplete: true },
  { id: 'pp_wassce_crs_2023_1', examTypeId: 'exam_wassce', subjectId: 'subj_wassce_crs', paperTypeId: 'paper_wassce_1', year: 2023, month: 'May-June', totalQuestions: 50, totalMarks: 50, timeAllowed: 60, isComplete: true },

  // =============================================
  // BECE Past Papers - Mathematics
  // =============================================
  { id: 'pp_bece_math_2024_1', examTypeId: 'exam_bece', subjectId: 'subj_bece_math', paperTypeId: 'paper_bece_1', year: 2024, month: 'June', totalQuestions: 40, totalMarks: 40, timeAllowed: 60, isComplete: true },
  { id: 'pp_bece_math_2023_1', examTypeId: 'exam_bece', subjectId: 'subj_bece_math', paperTypeId: 'paper_bece_1', year: 2023, month: 'June', totalQuestions: 40, totalMarks: 40, timeAllowed: 60, isComplete: true },

  // =============================================
  // BECE Past Papers - English Language
  // =============================================
  { id: 'pp_bece_eng_2024_1', examTypeId: 'exam_bece', subjectId: 'subj_bece_english', paperTypeId: 'paper_bece_1', year: 2024, month: 'June', totalQuestions: 40, totalMarks: 40, timeAllowed: 45, isComplete: true },
  { id: 'pp_bece_eng_2023_1', examTypeId: 'exam_bece', subjectId: 'subj_bece_english', paperTypeId: 'paper_bece_1', year: 2023, month: 'June', totalQuestions: 40, totalMarks: 40, timeAllowed: 45, isComplete: true },

  // =============================================
  // BECE Past Papers - Integrated Science
  // =============================================
  { id: 'pp_bece_sci_2024_1', examTypeId: 'exam_bece', subjectId: 'subj_bece_science', paperTypeId: 'paper_bece_1', year: 2024, month: 'June', totalQuestions: 40, totalMarks: 40, timeAllowed: 45, isComplete: true },
  { id: 'pp_bece_sci_2023_1', examTypeId: 'exam_bece', subjectId: 'subj_bece_science', paperTypeId: 'paper_bece_1', year: 2023, month: 'June', totalQuestions: 40, totalMarks: 40, timeAllowed: 45, isComplete: true },

  // =============================================
  // BECE Past Papers - Social Studies
  // =============================================
  { id: 'pp_bece_soc_2024_1', examTypeId: 'exam_bece', subjectId: 'subj_bece_social', paperTypeId: 'paper_bece_1', year: 2024, month: 'June', totalQuestions: 40, totalMarks: 40, timeAllowed: 45, isComplete: true },
  { id: 'pp_bece_soc_2023_1', examTypeId: 'exam_bece', subjectId: 'subj_bece_social', paperTypeId: 'paper_bece_1', year: 2023, month: 'June', totalQuestions: 40, totalMarks: 40, timeAllowed: 45, isComplete: true },

  // =============================================
  // BECE Past Papers - RME (Religious and Moral Education)
  // =============================================
  { id: 'pp_bece_rme_2024_1', examTypeId: 'exam_bece', subjectId: 'subj_bece_rme', paperTypeId: 'paper_bece_1', year: 2024, month: 'June', totalQuestions: 40, totalMarks: 40, timeAllowed: 45, isComplete: true },
  { id: 'pp_bece_rme_2023_1', examTypeId: 'exam_bece', subjectId: 'subj_bece_rme', paperTypeId: 'paper_bece_1', year: 2023, month: 'June', totalQuestions: 40, totalMarks: 40, timeAllowed: 45, isComplete: true },

  // =============================================
  // BECE Past Papers - ICT (Information and Communication Technology)
  // =============================================
  { id: 'pp_bece_ict_2024_1', examTypeId: 'exam_bece', subjectId: 'subj_bece_ict', paperTypeId: 'paper_bece_1', year: 2024, month: 'June', totalQuestions: 40, totalMarks: 40, timeAllowed: 45, isComplete: true },
  { id: 'pp_bece_ict_2023_1', examTypeId: 'exam_bece', subjectId: 'subj_bece_ict', paperTypeId: 'paper_bece_1', year: 2023, month: 'June', totalQuestions: 40, totalMarks: 40, timeAllowed: 45, isComplete: true },

  // =============================================
  // BECE Past Papers - French
  // =============================================
  { id: 'pp_bece_french_2024_1', examTypeId: 'exam_bece', subjectId: 'subj_bece_french', paperTypeId: 'paper_bece_1', year: 2024, month: 'June', totalQuestions: 40, totalMarks: 40, timeAllowed: 45, isComplete: true },
  { id: 'pp_bece_french_2023_1', examTypeId: 'exam_bece', subjectId: 'subj_bece_french', paperTypeId: 'paper_bece_1', year: 2023, month: 'June', totalQuestions: 40, totalMarks: 40, timeAllowed: 45, isComplete: true },

  // =============================================
  // BECE Past Papers - BDT (Basic Design and Technology)
  // =============================================
  { id: 'pp_bece_bdt_2024_1', examTypeId: 'exam_bece', subjectId: 'subj_bece_bdt', paperTypeId: 'paper_bece_1', year: 2024, month: 'June', totalQuestions: 40, totalMarks: 40, timeAllowed: 45, isComplete: true },
  { id: 'pp_bece_bdt_2023_1', examTypeId: 'exam_bece', subjectId: 'subj_bece_bdt', paperTypeId: 'paper_bece_1', year: 2023, month: 'June', totalQuestions: 40, totalMarks: 40, timeAllowed: 45, isComplete: true },
];

// =============================================
// ESSAY QUESTIONS WITH MARKING SCHEMES
// =============================================

export const essayQuestions: EssayQuestion[] = [
  // WASSCE English Essays
  {
    id: 'essay_wassce_eng_001',
    questionId: 'wassce_essay_eng_001',
    subjectId: 'subj_wassce_english',
    questionText: 'Write an article suitable for publication in your school magazine on the topic: "The Role of Technology in Modern Education"',
    wordLimitMin: 400,
    wordLimitMax: 600,
    marks: 30,
    timeAllowed: 45,
    aiGradingEnabled: true,
    markingScheme: {
      criteria: [
        { name: 'Content', maxScore: 10, description: 'Relevance, depth of ideas, and coverage of the topic' },
        { name: 'Organization', maxScore: 8, description: 'Logical structure, paragraphing, and coherence' },
        { name: 'Expression', maxScore: 7, description: 'Appropriate vocabulary, sentence variety, and style' },
        { name: 'Mechanical Accuracy', maxScore: 5, description: 'Spelling, punctuation, and grammar' },
      ],
      totalMarks: 30,
    },
    modelAnswer: `THE ROLE OF TECHNOLOGY IN MODERN EDUCATION
By [Student Name], Form 3

In an era where smartphones are as common as pencils and the internet serves as an endless library, technology has fundamentally transformed how we learn and teach. This article explores the pivotal role technology plays in shaping modern education.

Technology has democratized access to knowledge. With platforms like Khan Academy, Coursera, and YouTube, students in remote villages can access the same educational content as those in metropolitan areas. This has broken down geographical barriers that once limited educational opportunities. A student in Tamale can now learn coding from experts in Silicon Valley, and a curious mind in Cape Coast can explore the libraries of Oxford University.

Furthermore, technology has made learning interactive and engaging. Gone are the days of monotonous chalk-and-talk sessions. Today's classrooms feature smartboards, virtual reality experiences, and educational games that make complex concepts accessible and enjoyable. Students can dissect a virtual frog in biology class, explore ancient Rome through VR headsets, or solve mathematical problems through gamified applications.

However, technology in education is not without challenges. The digital divide remains a significant concern, as not all students have equal access to devices and internet connectivity. Additionally, excessive screen time can affect students' physical health and attention spans. There is also the risk of over-reliance on technology, potentially diminishing critical thinking and problem-solving skills.

To maximize the benefits while minimizing the drawbacks, schools must adopt a balanced approach. Teachers should be trained to integrate technology effectively into their lessons, using it as a tool to enhance rather than replace traditional teaching methods. Schools should also implement digital literacy programs to help students use technology responsibly.

In conclusion, technology is not merely an addition to modern education; it is becoming its backbone. When used thoughtfully, it can create more inclusive, engaging, and effective learning environments. As we navigate this digital age, let us embrace technology while ensuring that it serves to enhance, not diminish, the quality of education.`,
    tips: [
      'Use an appropriate article format with a catchy headline',
      'Address both benefits and challenges for a balanced view',
      'Include specific examples to support your points',
      'Maintain a formal but engaging tone suitable for a school magazine',
    ],
  },
  {
    id: 'essay_wassce_eng_002',
    questionId: 'wassce_essay_eng_002',
    subjectId: 'subj_wassce_english',
    questionText: 'Write a letter to your friend who lives abroad, describing a traditional festival you recently witnessed in your community.',
    wordLimitMin: 350,
    wordLimitMax: 500,
    marks: 25,
    timeAllowed: 40,
    aiGradingEnabled: true,
    markingScheme: {
      criteria: [
        { name: 'Format', maxScore: 5, description: 'Correct letter format with address, date, salutation, and closing' },
        { name: 'Content', maxScore: 10, description: 'Vivid description of the festival, cultural details, and personal experience' },
        { name: 'Expression', maxScore: 5, description: 'Appropriate informal tone, engaging style' },
        { name: 'Mechanical Accuracy', maxScore: 5, description: 'Spelling, punctuation, and grammar' },
      ],
      totalMarks: 25,
    },
    modelAnswer: `P.O. Box 123
Kumasi
Ashanti Region
Ghana

15th November, 2024

Dear Sarah,

I hope this letter finds you in the best of health and spirits. How is the weather in London? I imagine it must be getting quite cold now. Here in Kumasi, the harmattan is just beginning to set in, and the air has that distinct dry, dusty quality.

I am writing to tell you about something truly spectacular that I witnessed last week – the Akwasidae Festival! You know I have always told you about our Ashanti traditions, but experiencing this festival was beyond anything I could have imagined.

The Akwasidae is celebrated every six weeks to honor our ancestors and the Golden Stool, the sacred symbol of Ashanti unity. This particular celebration was held at the Manhyia Palace, and the entire city came alive with excitement.

The Asantehene, our king, was carried on a palanquin adorned with gold ornaments and colorful cloth. He was surrounded by his chiefs, all dressed in their finest kente cloth, each pattern telling a unique story of our heritage. The golden regalia worn by the royals was breathtaking – from the massive gold chains to the intricately crafted sandals.

The atmosphere was electric with the sound of fontomfrom drums and the blowing of horns. The rhythm was so captivating that I found myself swaying along with the crowd. Traditional dancers performed energetically, their movements telling stories of our ancestors' bravery and wisdom.

What touched me most was the sense of community. People of all ages gathered together, sharing food and laughter. I tried some of the traditional dishes, including fufu and light soup, prepared specially for the occasion.

I wish you could have been there to experience it with me. Perhaps during your next visit to Ghana, we can time it with an Akwasidae celebration. I am sure you would love it!

Please write back soon and tell me how you are doing with your studies. Send my regards to your parents.

Your friend,
Kofi`,
    tips: [
      'Use correct informal letter format',
      'Make the description vivid and sensory',
      'Include cultural details and personal observations',
      'Maintain a friendly, conversational tone',
    ],
  },

  // WASSCE Social Studies Essays
  {
    id: 'essay_wassce_sst_001',
    questionId: 'wassce_essay_sst_001',
    subjectId: 'subj_wassce_social',
    questionText: 'Discuss five (5) factors that have contributed to environmental degradation in Ghana and suggest solutions to address them.',
    wordLimitMin: 450,
    wordLimitMax: 600,
    marks: 20,
    timeAllowed: 35,
    aiGradingEnabled: true,
    markingScheme: {
      criteria: [
        { name: 'Identification of Factors', maxScore: 5, description: 'Clear identification of five relevant factors' },
        { name: 'Explanation', maxScore: 8, description: 'Thorough explanation of each factor and its impact' },
        { name: 'Solutions', maxScore: 5, description: 'Practical and relevant solutions proposed' },
        { name: 'Expression', maxScore: 2, description: 'Clear writing and organization' },
      ],
      totalMarks: 20,
    },
    modelAnswer: `Environmental degradation in Ghana has become a pressing concern that threatens the country's natural resources, biodiversity, and the well-being of its citizens. This essay discusses five major contributing factors and proposes solutions to address them.

**1. Deforestation**
Ghana has one of the highest deforestation rates in Africa. Forests are cleared for timber, agriculture, and urban expansion. The Atewa Forest and other reserves face constant pressure from illegal logging and farming activities. This destruction leads to soil erosion, loss of biodiversity, and disruption of the water cycle.

*Solution:* The government should strengthen enforcement of forestry laws, promote community-based forest management, and incentivize tree planting through programs like the Green Ghana initiative.

**2. Illegal Mining (Galamsey)**
Illegal small-scale mining has caused severe damage to Ghana's water bodies and farmlands. Rivers like the Pra, Ankobra, and Birim have been polluted with mercury and other chemicals, rendering them unfit for drinking and farming.

*Solution:* Stricter enforcement of mining regulations, alternative livelihood programs for former miners, and investment in water treatment facilities are essential steps.

**3. Improper Waste Management**
Ghana faces a significant waste management crisis, particularly in urban areas. Open dumping and burning of waste contribute to air, soil, and water pollution. Plastic waste clogs drains, causing flooding during rainy seasons.

*Solution:* Implementation of comprehensive waste management policies, promotion of recycling, and public education on proper waste disposal can help address this issue.

**4. Industrial Pollution**
Factories and industries often release untreated effluents into water bodies and emit harmful gases into the atmosphere. The Korle Lagoon in Accra is a prime example of industrial pollution's devastating effects.

*Solution:* Stricter enforcement of environmental regulations, incentives for industries adopting clean technologies, and regular environmental impact assessments should be implemented.

**5. Unsustainable Agricultural Practices**
Slash-and-burn farming, overgrazing, and excessive use of chemical fertilizers and pesticides have degraded soil quality and polluted water sources.

*Solution:* Promoting sustainable farming practices, training farmers on organic farming methods, and implementing soil conservation techniques can help restore agricultural lands.

In conclusion, addressing environmental degradation in Ghana requires a multi-faceted approach involving government action, community participation, and individual responsibility. By implementing these solutions, Ghana can protect its natural resources for future generations while ensuring sustainable development.`,
    tips: [
      'Organize your essay with clear headings or numbered points',
      'Provide specific examples relevant to Ghana',
      'Balance the discussion between problems and solutions',
      'Use linking words to ensure coherence',
    ],
  },

  // BECE English Essays
  {
    id: 'essay_bece_eng_001',
    questionId: 'bece_essay_eng_001',
    subjectId: 'subj_bece_english',
    questionText: 'Write a story that ends with the words: "...and from that day, I learned never to judge people by their appearance."',
    wordLimitMin: 250,
    wordLimitMax: 350,
    marks: 20,
    timeAllowed: 30,
    aiGradingEnabled: true,
    markingScheme: {
      criteria: [
        { name: 'Content and Creativity', maxScore: 8, description: 'Interesting plot, character development, and use of the given ending' },
        { name: 'Organization', maxScore: 5, description: 'Clear beginning, middle, and end' },
        { name: 'Expression', maxScore: 4, description: 'Appropriate vocabulary and sentence structure' },
        { name: 'Mechanical Accuracy', maxScore: 3, description: 'Spelling, punctuation, and grammar' },
      ],
      totalMarks: 20,
    },
    modelAnswer: `THE UNEXPECTED HERO

It was the first day of the new school term, and I was already making judgments. A new student had joined our class, and everything about him seemed odd. His uniform was faded and slightly too big, his shoes were old, and his hair was roughly cut. Some of my classmates snickered as he walked to his seat, and I joined in their whispers.

"He looks like he cannot even afford a new uniform," I muttered to my friend Ama.

We nicknamed him "Tattered" and avoided sitting near him during break times. He rarely spoke and often sat alone under the big mango tree in the school compound, reading a worn-out book.

One afternoon, during our games period, everything changed. We were playing football when the ball flew over the fence and landed in the deep gutter that ran behind our school. Everyone knew that gutter was dangerous, especially after the recent rains. Nobody dared to go in.

Just then, a little Junior High student slipped on the wet grass and fell into the gutter. The current was strong, and she was screaming for help. We all stood frozen with fear. Before anyone could react, the new boy dashed forward and jumped into the water without hesitation.

He grabbed the girl and struggled against the current. His face showed determination as he pushed her towards the edge where we could pull her out. Only after she was safe did he climb out himself, shivering but relieved.

When the headmaster praised him in assembly the next day, we learned that his name was Kwame and that his family had lost everything in a fire the previous year. Yet he had risked his life without a second thought for someone in need.

I walked up to him after the assembly and apologized for how we had treated him. He smiled and said, "It is okay. I know what it looks like. But my mother always says what matters is what is inside."

From that day, Kwame became one of my best friends, and from that day, I learned never to judge people by their appearance.`,
    tips: [
      'Create engaging characters the reader can relate to',
      'Build up to the ending naturally',
      'Use descriptive language to make the story vivid',
      'Make sure the ending phrase fits smoothly into your story',
    ],
  },
  {
    id: 'essay_bece_eng_002',
    questionId: 'bece_essay_eng_002',
    subjectId: 'subj_bece_english',
    questionText: 'Your school recently organized a clean-up exercise. Write a letter to your cousin describing the exercise and what you learned from it.',
    wordLimitMin: 200,
    wordLimitMax: 300,
    marks: 15,
    timeAllowed: 25,
    aiGradingEnabled: true,
    markingScheme: {
      criteria: [
        { name: 'Format', maxScore: 3, description: 'Correct informal letter format' },
        { name: 'Content', maxScore: 7, description: 'Clear description of the exercise and lessons learned' },
        { name: 'Expression', maxScore: 3, description: 'Appropriate informal tone' },
        { name: 'Mechanical Accuracy', maxScore: 2, description: 'Spelling, punctuation, and grammar' },
      ],
      totalMarks: 15,
    },
    modelAnswer: `P.O. Box 45
Sunyani
10th December, 2024

Dear Cousin Akosua,

How are you? I hope you are doing well at your new school in Accra. I am writing to tell you about an interesting activity we had at school last week.

Our headmaster organized a clean-up exercise in our school and the surrounding community. All students from JHS 1 to JHS 3 participated. We were divided into groups, and each group was given an area to clean.

My group was assigned to clean the market area near our school. You should have seen the amount of rubbish we collected! There were plastic bags, water sachets, and all sorts of waste everywhere. We filled over twenty big sacks with rubbish. It was hard work, but we had fun working together.

After the exercise, our science teacher spoke to us about the importance of keeping our environment clean. She explained how improper waste disposal can cause diseases and block drains, leading to flooding during the rainy season. I learned that each of us has a responsibility to keep our surroundings clean.

Since then, I have stopped throwing rubbish anyhow. I always look for a dustbin now. Maybe you can organize something similar at your school.

Please write back and tell me about your new school. Give my greetings to Uncle Kofi and Auntie Ama.

Your cousin,
Yaw`,
    tips: [
      'Use proper informal letter format',
      'Describe specific activities during the exercise',
      'Include what you personally learned',
      'Maintain a friendly, conversational tone',
    ],
  },
];

// =============================================
// ADDITIONAL NSMQ QUESTIONS
// =============================================

export const additionalNsmqQuestions: SampleQuestion[] = [
  // More Mathematics Questions
  {
    id: 'q_math_add_001',
    topicId: 'topic_algebra',
    subjectId: 'subj_nsmq_math',
    questionText: 'If log₁₀ 2 = 0.301 and log₁₀ 3 = 0.477, find log₁₀ 12',
    questionType: 'direct_answer',
    roundType: 'round_one',
    correctAnswer: '1.079',
    explanation: 'log₁₀ 12 = log₁₀ (4 × 3) = log₁₀ 4 + log₁₀ 3 = 2log₁₀ 2 + log₁₀ 3 = 2(0.301) + 0.477 = 1.079',
    difficulty: 'medium',
    points: 3,
    timeLimit: 30,
  },
  {
    id: 'q_math_add_002',
    topicId: 'topic_calculus',
    subjectId: 'subj_nsmq_math',
    questionText: 'Find the derivative of f(x) = sin(2x)',
    questionType: 'direct_answer',
    roundType: 'round_one',
    correctAnswer: '2cos(2x)',
    explanation: 'Using chain rule: f\'(x) = cos(2x) × 2 = 2cos(2x)',
    difficulty: 'medium',
    points: 3,
    timeLimit: 30,
  },
  {
    id: 'q_math_add_003',
    topicId: 'topic_statistics',
    subjectId: 'subj_nsmq_math',
    questionText: 'A fair die is thrown twice. What is the probability of getting a sum of 7?',
    questionType: 'direct_answer',
    roundType: 'round_one',
    correctAnswer: '1/6 or 6/36',
    explanation: 'Favorable outcomes: (1,6), (2,5), (3,4), (4,3), (5,2), (6,1) = 6 outcomes. Total = 36. P = 6/36 = 1/6',
    difficulty: 'medium',
    points: 3,
    timeLimit: 30,
  },

  // More Physics Questions
  {
    id: 'q_phys_add_001',
    topicId: 'topic_mechanics',
    subjectId: 'subj_nsmq_physics',
    questionText: 'A ball is thrown vertically upward with velocity 20 m/s. What is the maximum height reached? (g = 10 m/s²)',
    questionType: 'direct_answer',
    roundType: 'round_one',
    correctAnswer: '20 m',
    explanation: 'Using v² = u² - 2gh: 0 = 400 - 20h, h = 20 m',
    difficulty: 'medium',
    points: 3,
    timeLimit: 30,
  },
  {
    id: 'q_phys_add_002',
    topicId: 'topic_electricity',
    subjectId: 'subj_nsmq_physics',
    questionText: 'Three 6Ω resistors are connected in parallel. What is the equivalent resistance?',
    questionType: 'direct_answer',
    roundType: 'round_one',
    correctAnswer: '2 Ω',
    explanation: '1/R = 1/6 + 1/6 + 1/6 = 3/6 = 1/2, so R = 2Ω',
    difficulty: 'medium',
    points: 3,
    timeLimit: 30,
  },
  {
    id: 'q_phys_add_003',
    topicId: 'topic_modern_physics',
    subjectId: 'subj_nsmq_physics',
    questionText: 'If the wavelength of an electron is 0.1 nm, what is its momentum? (h = 6.63 × 10⁻³⁴ Js)',
    questionType: 'direct_answer',
    roundType: 'round_one',
    correctAnswer: '6.63 × 10⁻²⁴ kg m/s',
    explanation: 'Using de Broglie relation λ = h/p: p = h/λ = 6.63 × 10⁻³⁴ / 10⁻¹⁰ = 6.63 × 10⁻²⁴ kg m/s',
    difficulty: 'hard',
    points: 3,
    timeLimit: 30,
  },

  // More Chemistry Questions
  {
    id: 'q_chem_add_001',
    topicId: 'topic_stoichiometry',
    subjectId: 'subj_nsmq_chemistry',
    questionText: 'How many moles of oxygen gas are produced when 2 moles of KClO₃ decompose? (2KClO₃ → 2KCl + 3O₂)',
    questionType: 'direct_answer',
    roundType: 'round_one',
    correctAnswer: '3 moles',
    explanation: 'From the equation, 2 moles KClO₃ produce 3 moles O₂',
    difficulty: 'medium',
    points: 3,
    timeLimit: 30,
  },
  {
    id: 'q_chem_add_002',
    topicId: 'topic_electrochemistry',
    subjectId: 'subj_nsmq_chemistry',
    questionText: 'In the electrochemical series, which metal is the strongest reducing agent: Zn, Cu, Fe, or Au?',
    questionType: 'direct_answer',
    roundType: 'round_one',
    correctAnswer: 'Zinc (Zn)',
    explanation: 'In the series, Zn is highest (most reactive), so it is the strongest reducing agent',
    difficulty: 'easy',
    points: 3,
    timeLimit: 30,
  },

  // More Biology Questions
  {
    id: 'q_bio_add_001',
    topicId: 'topic_genetics',
    subjectId: 'subj_nsmq_biology',
    questionText: 'What is the complementary DNA strand for 5\'-ATCGGA-3\'?',
    questionType: 'direct_answer',
    roundType: 'round_one',
    correctAnswer: '3\'-TAGCCT-5\' or 5\'-TCCGAT-3\'',
    explanation: 'Complementary base pairing: A-T, T-A, C-G, G-C. Reading 3\' to 5\': TCCGAT',
    difficulty: 'medium',
    points: 3,
    timeLimit: 30,
  },
  {
    id: 'q_bio_add_002',
    topicId: 'topic_physiology',
    subjectId: 'subj_nsmq_biology',
    questionText: 'Where in the nephron does most glucose reabsorption occur?',
    questionType: 'direct_answer',
    roundType: 'round_one',
    correctAnswer: 'Proximal convoluted tubule',
    explanation: 'The PCT is where most glucose, amino acids, and water are reabsorbed',
    difficulty: 'medium',
    points: 3,
    timeLimit: 30,
  },
];

// Export all study materials
export const studyMaterials = {
  wassceTopics,
  beceTopics,
  wassceQuestions,
  beceQuestions,
  pastPapers,
  essayQuestions,
  additionalNsmqQuestions,
};

export default studyMaterials;
