import type { Experiment, Apparatus } from '@/types';

// =============================================
// APPARATUS DEFINITIONS
// =============================================

export const labApparatus: Apparatus[] = [
  // =============== PHYSICS APPARATUS ===============
  {
    id: 'app_pendulum_bob',
    name: 'Pendulum Bob',
    description: 'A spherical brass mass for pendulum experiments',
    category: 'measurement',
    subjectId: 'subj_wassce_physics',
    interactionPoints: [
      { id: 'top', name: 'Top Hook', type: 'connect', position: { x: 50, y: 0 } },
    ],
    properties: {
      isDraggable: true,
      isConnectable: true,
    },
  },
  {
    id: 'app_stopwatch',
    name: 'Digital Stopwatch',
    description: 'For precise time measurement to 0.01s',
    category: 'measurement',
    subjectId: 'subj_wassce_physics',
    interactionPoints: [],
    properties: {
      isDraggable: true,
      isConnectable: false,
      hasReading: true,
      readingType: 'numeric',
      readingUnit: 's',
      minValue: 0,
      maxValue: 9999,
      precision: 2,
      defaultValue: 0,
    },
  },
  {
    id: 'app_meter_rule',
    name: 'Meter Rule',
    description: '100cm measuring rule with mm markings',
    category: 'measurement',
    subjectId: 'subj_wassce_physics',
    interactionPoints: [],
    properties: {
      isDraggable: true,
      isConnectable: false,
      hasReading: true,
      readingType: 'numeric',
      readingUnit: 'cm',
      minValue: 0,
      maxValue: 100,
      precision: 1,
    },
  },
  {
    id: 'app_retort_stand',
    name: 'Retort Stand with Clamp',
    description: 'Support stand for pendulum and other apparatus',
    category: 'support',
    subjectId: 'subj_wassce_physics',
    interactionPoints: [
      { id: 'clamp', name: 'Clamp', type: 'connect', position: { x: 50, y: 30 } },
    ],
    properties: {
      isDraggable: true,
      isConnectable: true,
    },
  },
  {
    id: 'app_thread',
    name: 'Inextensible Thread',
    description: 'Light string for pendulum (1m length)',
    category: 'support',
    subjectId: 'subj_wassce_physics',
    interactionPoints: [
      { id: 'top', name: 'Top End', type: 'connect', position: { x: 50, y: 0 } },
      { id: 'bottom', name: 'Bottom End', type: 'connect', position: { x: 50, y: 100 } },
    ],
    properties: {
      isDraggable: true,
      isConnectable: true,
      hasReading: true,
      readingType: 'numeric',
      readingUnit: 'cm',
      minValue: 20,
      maxValue: 100,
      precision: 1,
      defaultValue: 100,
    },
  },
  {
    id: 'app_ammeter',
    name: 'Ammeter (0-5A)',
    description: 'Measures electric current in amperes',
    category: 'electrical',
    subjectId: 'subj_wassce_physics',
    interactionPoints: [
      { id: 'positive', name: 'Positive Terminal', type: 'connect', position: { x: 0, y: 50 } },
      { id: 'negative', name: 'Negative Terminal', type: 'connect', position: { x: 100, y: 50 } },
    ],
    properties: {
      isDraggable: true,
      isConnectable: true,
      hasReading: true,
      readingType: 'numeric',
      readingUnit: 'A',
      minValue: 0,
      maxValue: 5,
      precision: 2,
      defaultValue: 0,
    },
  },
  {
    id: 'app_voltmeter',
    name: 'Voltmeter (0-15V)',
    description: 'Measures voltage/potential difference',
    category: 'electrical',
    subjectId: 'subj_wassce_physics',
    interactionPoints: [
      { id: 'positive', name: 'Positive Terminal', type: 'connect', position: { x: 0, y: 50 } },
      { id: 'negative', name: 'Negative Terminal', type: 'connect', position: { x: 100, y: 50 } },
    ],
    properties: {
      isDraggable: true,
      isConnectable: true,
      hasReading: true,
      readingType: 'numeric',
      readingUnit: 'V',
      minValue: 0,
      maxValue: 15,
      precision: 2,
      defaultValue: 0,
    },
  },
  {
    id: 'app_resistor',
    name: 'Standard Resistor',
    description: 'Known resistance for circuit experiments',
    category: 'electrical',
    subjectId: 'subj_wassce_physics',
    interactionPoints: [
      { id: 'terminal1', name: 'Terminal 1', type: 'connect', position: { x: 0, y: 50 } },
      { id: 'terminal2', name: 'Terminal 2', type: 'connect', position: { x: 100, y: 50 } },
    ],
    properties: {
      isDraggable: true,
      isConnectable: true,
    },
  },
  {
    id: 'app_battery',
    name: 'Battery/Power Supply',
    description: '6V DC power source',
    category: 'electrical',
    subjectId: 'subj_wassce_physics',
    interactionPoints: [
      { id: 'positive', name: 'Positive (+)', type: 'output', position: { x: 0, y: 50 } },
      { id: 'negative', name: 'Negative (-)', type: 'output', position: { x: 100, y: 50 } },
    ],
    properties: {
      isDraggable: true,
      isConnectable: true,
      hasReading: true,
      readingType: 'numeric',
      readingUnit: 'V',
      minValue: 0,
      maxValue: 12,
      precision: 1,
      defaultValue: 6,
    },
  },
  {
    id: 'app_switch',
    name: 'Switch (Key)',
    description: 'Circuit switch/key',
    category: 'electrical',
    subjectId: 'subj_wassce_physics',
    interactionPoints: [
      { id: 'terminal1', name: 'Terminal 1', type: 'connect', position: { x: 0, y: 50 } },
      { id: 'terminal2', name: 'Terminal 2', type: 'connect', position: { x: 100, y: 50 } },
    ],
    properties: {
      isDraggable: true,
      isConnectable: true,
    },
  },
  {
    id: 'app_spring',
    name: 'Helical Spring',
    description: 'Spring for Hooke\'s Law experiment',
    category: 'measurement',
    subjectId: 'subj_wassce_physics',
    interactionPoints: [
      { id: 'top', name: 'Top Hook', type: 'connect', position: { x: 50, y: 0 } },
      { id: 'bottom', name: 'Bottom Hook', type: 'connect', position: { x: 50, y: 100 } },
    ],
    properties: {
      isDraggable: true,
      isConnectable: true,
      hasReading: true,
      readingType: 'numeric',
      readingUnit: 'cm',
    },
  },
  {
    id: 'app_slotted_mass',
    name: 'Slotted Masses',
    description: 'Set of masses (50g each) for loading',
    category: 'measurement',
    subjectId: 'subj_wassce_physics',
    interactionPoints: [
      { id: 'hook', name: 'Hanger Hook', type: 'connect', position: { x: 50, y: 0 } },
    ],
    properties: {
      isDraggable: true,
      isConnectable: true,
      hasReading: true,
      readingType: 'numeric',
      readingUnit: 'g',
      minValue: 0,
      maxValue: 500,
      precision: 0,
      defaultValue: 50,
    },
  },

  // =============== CHEMISTRY APPARATUS ===============
  {
    id: 'app_burette',
    name: 'Burette (50ml)',
    description: 'For accurate volume dispensing in titrations',
    category: 'measurement',
    subjectId: 'subj_wassce_chemistry',
    interactionPoints: [
      { id: 'top', name: 'Top Opening', type: 'input', position: { x: 50, y: 0 } },
      { id: 'tap', name: 'Tap/Stopcock', type: 'output', position: { x: 50, y: 100 } },
    ],
    properties: {
      isDraggable: true,
      isConnectable: true,
      hasReading: true,
      readingType: 'numeric',
      readingUnit: 'ml',
      minValue: 0,
      maxValue: 50,
      precision: 1,
      defaultValue: 0,
    },
  },
  {
    id: 'app_conical_flask',
    name: 'Conical Flask (250ml)',
    description: 'For containing solutions during titration',
    category: 'container',
    subjectId: 'subj_wassce_chemistry',
    interactionPoints: [
      { id: 'opening', name: 'Opening', type: 'input', position: { x: 50, y: 0 } },
    ],
    properties: {
      isDraggable: true,
      isConnectable: true,
    },
  },
  {
    id: 'app_pipette',
    name: 'Pipette (25ml)',
    description: 'For measuring fixed volumes accurately',
    category: 'measurement',
    subjectId: 'subj_wassce_chemistry',
    interactionPoints: [
      { id: 'tip', name: 'Tip', type: 'output', position: { x: 50, y: 100 } },
    ],
    properties: {
      isDraggable: true,
      isConnectable: false,
      hasReading: true,
      readingType: 'numeric',
      readingUnit: 'ml',
      defaultValue: 25,
    },
  },
  {
    id: 'app_burette_stand',
    name: 'Burette Stand',
    description: 'Support for burette during titration',
    category: 'support',
    subjectId: 'subj_wassce_chemistry',
    interactionPoints: [
      { id: 'clamp', name: 'Burette Clamp', type: 'connect', position: { x: 50, y: 30 } },
    ],
    properties: {
      isDraggable: true,
      isConnectable: true,
    },
  },
  {
    id: 'app_white_tile',
    name: 'White Tile',
    description: 'For observing colour changes',
    category: 'support',
    subjectId: 'subj_wassce_chemistry',
    interactionPoints: [],
    properties: {
      isDraggable: true,
      isConnectable: false,
    },
  },
  {
    id: 'app_indicator_bottle',
    name: 'Indicator Bottle',
    description: 'Contains indicator solution (e.g., methyl orange)',
    category: 'chemical',
    subjectId: 'subj_wassce_chemistry',
    interactionPoints: [],
    properties: {
      isDraggable: true,
      isConnectable: false,
    },
  },
  {
    id: 'app_test_tube',
    name: 'Test Tube',
    description: 'For small-scale reactions and tests',
    category: 'container',
    subjectId: 'subj_wassce_chemistry',
    interactionPoints: [
      { id: 'opening', name: 'Opening', type: 'input', position: { x: 50, y: 0 } },
    ],
    properties: {
      isDraggable: true,
      isConnectable: true,
    },
  },
  {
    id: 'app_test_tube_rack',
    name: 'Test Tube Rack',
    description: 'Holds multiple test tubes',
    category: 'support',
    subjectId: 'subj_wassce_chemistry',
    interactionPoints: [],
    properties: {
      isDraggable: true,
      isConnectable: false,
    },
  },
  {
    id: 'app_bunsen_burner',
    name: 'Bunsen Burner',
    description: 'For heating substances',
    category: 'heating',
    subjectId: 'subj_wassce_chemistry',
    interactionPoints: [],
    properties: {
      isDraggable: true,
      isConnectable: false,
    },
  },

  // =============== BIOLOGY APPARATUS ===============
  {
    id: 'app_microscope',
    name: 'Light Microscope',
    description: 'Compound microscope for specimen observation',
    category: 'optical',
    subjectId: 'subj_wassce_biology',
    interactionPoints: [
      { id: 'stage', name: 'Stage', type: 'input', position: { x: 50, y: 50 } },
    ],
    properties: {
      isDraggable: false,
      isConnectable: true,
      hasReading: true,
      readingType: 'numeric',
      readingUnit: 'x',
      minValue: 40,
      maxValue: 400,
      precision: 0,
      defaultValue: 40,
    },
  },
  {
    id: 'app_slide',
    name: 'Glass Slide',
    description: 'For mounting specimens',
    category: 'biological',
    subjectId: 'subj_wassce_biology',
    interactionPoints: [],
    properties: {
      isDraggable: true,
      isConnectable: true,
    },
  },
  {
    id: 'app_cover_slip',
    name: 'Cover Slip',
    description: 'Thin glass cover for wet mounts',
    category: 'biological',
    subjectId: 'subj_wassce_biology',
    interactionPoints: [],
    properties: {
      isDraggable: true,
      isConnectable: false,
    },
  },
  {
    id: 'app_dropper',
    name: 'Dropper/Pipette',
    description: 'For adding small amounts of liquid',
    category: 'measurement',
    subjectId: 'subj_wassce_biology',
    interactionPoints: [],
    properties: {
      isDraggable: true,
      isConnectable: false,
    },
  },
  {
    id: 'app_iodine_solution',
    name: 'Iodine Solution',
    description: 'Reagent for starch test (brown to blue-black)',
    category: 'chemical',
    subjectId: 'subj_wassce_biology',
    interactionPoints: [],
    properties: {
      isDraggable: true,
      isConnectable: false,
    },
  },
  {
    id: 'app_benedicts_solution',
    name: 'Benedict\'s Solution',
    description: 'Reagent for reducing sugar test',
    category: 'chemical',
    subjectId: 'subj_wassce_biology',
    interactionPoints: [],
    properties: {
      isDraggable: true,
      isConnectable: false,
    },
  },
  {
    id: 'app_biuret_reagent',
    name: 'Biuret Reagent',
    description: 'For protein test (blue to purple)',
    category: 'chemical',
    subjectId: 'subj_wassce_biology',
    interactionPoints: [],
    properties: {
      isDraggable: true,
      isConnectable: false,
    },
  },
  {
    id: 'app_sudan_iii',
    name: 'Sudan III Solution',
    description: 'For fat/oil test (red layer)',
    category: 'chemical',
    subjectId: 'subj_wassce_biology',
    interactionPoints: [],
    properties: {
      isDraggable: true,
      isConnectable: false,
    },
  },
];

// =============================================
// PHYSICS EXPERIMENTS
// =============================================

export const physicsExperiments: Experiment[] = [
  {
    id: 'exp_simple_pendulum',
    subjectId: 'subj_wassce_physics',
    topicId: 'topic_wassce_phy_oscillations',
    name: 'Simple Pendulum - Determination of Acceleration due to Gravity',
    slug: 'simple-pendulum',
    description:
      'Determine the acceleration due to gravity (g) using a simple pendulum by measuring the period of oscillation for different lengths.',
    objectives: [
      'Set up a simple pendulum correctly',
      'Measure the period of oscillation accurately for different lengths',
      'Plot a graph of T squared against L',
      'Calculate g from the gradient of the graph',
    ],
    difficulty: 'medium',
    estimatedTime: 45,
    simulationType: 'phet',
    phetSimUrl: 'https://phet.colorado.edu/sims/html/pendulum-lab/latest/pendulum-lab_en.html',
    apparatus: ['app_pendulum_bob', 'app_stopwatch', 'app_meter_rule', 'app_retort_stand', 'app_thread'],
    materials: [],
    safetyNotes: [
      'Ensure the retort stand is stable and clamped to the bench',
      'Keep clear of the oscillating pendulum',
      'Use small amplitude oscillations (less than 10 degrees)',
    ],
    procedure: [
      {
        stepNumber: 1,
        instruction: 'Set up the retort stand firmly on the bench and attach the clamp near the top.',
        hint: 'The stand should not wobble when touched',
        requiredActions: [
          { actionType: 'drag', targetApparatus: 'app_retort_stand', description: 'Place the retort stand' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 2,
        instruction: 'Attach the thread to the clamp and tie the pendulum bob to the other end.',
        hint: 'Ensure the thread passes through the split cork for easy length adjustment',
        requiredActions: [
          { actionType: 'connect', targetApparatus: 'app_thread', description: 'Attach thread to clamp' },
          { actionType: 'connect', targetApparatus: 'app_pendulum_bob', description: 'Attach bob to thread' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 3,
        instruction: 'Measure and set the length L = 100 cm from the point of suspension to the centre of the bob.',
        hint: 'Measure from the bottom of the clamp to the middle of the bob',
        requiredActions: [
          { actionType: 'measure', targetApparatus: 'app_meter_rule', description: 'Measure length' },
          { actionType: 'adjust', targetApparatus: 'app_thread', targetValue: 100, tolerance: 1, description: 'Set length to 100cm' },
        ],
        isCheckpoint: true,
        maxMarks: 3,
      },
      {
        stepNumber: 4,
        instruction: 'Displace the bob slightly (about 5-10 degrees) and release it to oscillate.',
        hint: 'Small amplitude ensures simple harmonic motion',
        requiredActions: [
          { actionType: 'adjust', targetApparatus: 'app_pendulum_bob', description: 'Displace and release bob' },
        ],
        isCheckpoint: false,
        maxMarks: 1,
      },
      {
        stepNumber: 5,
        instruction: 'Allow a few oscillations to stabilize, then use the stopwatch to time 20 complete oscillations.',
        hint: 'Start timing as the bob passes the equilibrium position',
        requiredActions: [
          { actionType: 'measure', targetApparatus: 'app_stopwatch', description: 'Time 20 oscillations' },
          { actionType: 'record', targetApparatus: 'app_stopwatch', description: 'Record time t20' },
        ],
        isCheckpoint: true,
        maxMarks: 3,
      },
      {
        stepNumber: 6,
        instruction: 'Repeat the timing and calculate the average time for 20 oscillations.',
        requiredActions: [
          { actionType: 'measure', targetApparatus: 'app_stopwatch', description: 'Repeat timing' },
          { actionType: 'record', targetApparatus: 'app_stopwatch', description: 'Record and average' },
        ],
        isCheckpoint: false,
        maxMarks: 2,
      },
      {
        stepNumber: 7,
        instruction: 'Calculate the period T = (average time) / 20.',
        requiredActions: [
          { actionType: 'record', targetApparatus: 'app_stopwatch', description: 'Calculate period T' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 8,
        instruction: 'Reduce the length by 10 cm and repeat steps 4-7. Take at least 5 readings for different lengths.',
        hint: 'Use lengths: 100, 90, 80, 70, 60 cm',
        requiredActions: [
          { actionType: 'adjust', targetApparatus: 'app_thread', description: 'Reduce length by 10cm' },
          { actionType: 'record', targetApparatus: 'app_stopwatch', description: 'Record multiple readings' },
        ],
        isCheckpoint: true,
        maxMarks: 5,
      },
    ],
    expectedResults: [
      { condition: 'Graph of T squared vs L should be', value: 'straight line through origin', unit: '' },
      { condition: 'Gradient of graph', value: 4.02, tolerance: 0.2, unit: 's squared per m' },
      { condition: 'Calculated value of g', value: 9.8, tolerance: 0.5, unit: 'm/s squared' },
    ],
    assessmentCriteria: [
      {
        id: 'crit_setup',
        name: 'Apparatus Setup',
        description: 'Correct assembly of pendulum system',
        maxMarks: 5,
        rubric: [
          { marks: 5, description: 'Perfect setup with stable oscillation' },
          { marks: 3, description: 'Setup correct but minor issues' },
          { marks: 1, description: 'Significant setup errors' },
        ],
      },
      {
        id: 'crit_measurement',
        name: 'Measurement Technique',
        description: 'Accuracy of length and time measurements',
        maxMarks: 5,
        rubric: [
          { marks: 5, description: 'All measurements accurate with repeated readings' },
          { marks: 3, description: 'Measurements taken but some errors' },
          { marks: 1, description: 'Poor measurement technique' },
        ],
      },
      {
        id: 'crit_data',
        name: 'Data Recording',
        description: 'Proper tabulation and calculations',
        maxMarks: 5,
        rubric: [
          { marks: 5, description: 'Complete data table with correct calculations' },
          { marks: 3, description: 'Data recorded but calculation errors' },
          { marks: 1, description: 'Incomplete or incorrect data' },
        ],
      },
      {
        id: 'crit_graph',
        name: 'Graph and Analysis',
        description: 'Correct graph plotting and g calculation',
        maxMarks: 5,
        rubric: [
          { marks: 5, description: 'Correct graph with accurate g value' },
          { marks: 3, description: 'Graph correct but calculation errors' },
          { marks: 1, description: 'Incorrect graph or no g calculation' },
        ],
      },
    ],
    examTypeId: 'exam_wassce',
    paperTypeId: 'paper_wassce_3',
    waecPastYears: [2019, 2020, 2022],
    isActive: true,
  },

  {
    id: 'exp_ohms_law',
    subjectId: 'subj_wassce_physics',
    topicId: 'topic_wassce_phy_electricity',
    name: "Ohm's Law - Resistance of a Wire",
    slug: 'ohms-law',
    description:
      "Verify Ohm's law and determine the resistance of a wire by measuring current and voltage.",
    objectives: [
      'Set up a simple circuit with ammeter and voltmeter correctly',
      'Take readings of current and voltage',
      'Plot a graph of V against I',
      'Determine resistance from the gradient',
    ],
    difficulty: 'medium',
    estimatedTime: 40,
    simulationType: 'phet',
    phetSimUrl: 'https://phet.colorado.edu/sims/html/ohms-law/latest/ohms-law_en.html',
    apparatus: ['app_ammeter', 'app_voltmeter', 'app_resistor', 'app_battery', 'app_switch'],
    materials: [
      { name: 'Connecting wires', quantity: '6' },
      { name: 'Resistance wire', quantity: '1' },
    ],
    safetyNotes: [
      'Do not exceed the maximum current rating of components',
      'Switch off the circuit when not taking readings',
      'Handle components carefully',
    ],
    procedure: [
      {
        stepNumber: 1,
        instruction: 'Connect the circuit: battery - switch - ammeter - resistor in series.',
        requiredActions: [
          { actionType: 'connect', targetApparatus: 'app_battery', description: 'Start with battery' },
          { actionType: 'connect', targetApparatus: 'app_switch', description: 'Add switch in series' },
          { actionType: 'connect', targetApparatus: 'app_ammeter', description: 'Add ammeter in series' },
          { actionType: 'connect', targetApparatus: 'app_resistor', description: 'Add resistor' },
        ],
        isCheckpoint: true,
        maxMarks: 4,
      },
      {
        stepNumber: 2,
        instruction: 'Connect the voltmeter in parallel across the resistor.',
        hint: 'Voltmeter must be connected across (parallel to) the component',
        requiredActions: [
          { actionType: 'connect', targetApparatus: 'app_voltmeter', description: 'Connect voltmeter in parallel' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 3,
        instruction: 'Close the switch and record the ammeter and voltmeter readings.',
        requiredActions: [
          { actionType: 'adjust', targetApparatus: 'app_switch', description: 'Close switch' },
          { actionType: 'measure', targetApparatus: 'app_ammeter', description: 'Read current I' },
          { actionType: 'measure', targetApparatus: 'app_voltmeter', description: 'Read voltage V' },
          { actionType: 'record', targetApparatus: 'app_ammeter', description: 'Record I and V' },
        ],
        isCheckpoint: true,
        maxMarks: 3,
      },
      {
        stepNumber: 4,
        instruction: 'Vary the voltage and take at least 5 pairs of readings.',
        requiredActions: [
          { actionType: 'adjust', targetApparatus: 'app_battery', description: 'Vary voltage' },
          { actionType: 'record', targetApparatus: 'app_ammeter', description: 'Record 5 pairs of I and V' },
        ],
        isCheckpoint: true,
        maxMarks: 5,
      },
      {
        stepNumber: 5,
        instruction: 'Plot a graph of V against I.',
        requiredActions: [
          { actionType: 'record', targetApparatus: 'app_voltmeter', description: 'Plot V vs I graph' },
        ],
        isCheckpoint: true,
        maxMarks: 4,
      },
      {
        stepNumber: 6,
        instruction: 'Calculate the resistance from the gradient of the graph (R = V/I).',
        requiredActions: [
          { actionType: 'record', targetApparatus: 'app_voltmeter', description: 'Calculate R from gradient' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
    ],
    expectedResults: [
      { condition: 'Graph of V vs I', value: 'straight line through origin', unit: '' },
      { condition: 'Resistance value', value: 5, tolerance: 0.5, unit: 'ohms' },
    ],
    assessmentCriteria: [
      {
        id: 'crit_circuit',
        name: 'Circuit Setup',
        description: 'Correct circuit connections',
        maxMarks: 6,
        rubric: [
          { marks: 6, description: 'All connections correct' },
          { marks: 4, description: 'Minor connection errors' },
          { marks: 2, description: 'Significant errors in circuit' },
        ],
      },
      {
        id: 'crit_readings',
        name: 'Data Collection',
        description: 'Accurate I and V readings',
        maxMarks: 6,
        rubric: [
          { marks: 6, description: 'All readings accurate' },
          { marks: 4, description: 'Some reading errors' },
          { marks: 2, description: 'Many errors in readings' },
        ],
      },
      {
        id: 'crit_analysis',
        name: 'Analysis',
        description: 'Correct graph and resistance calculation',
        maxMarks: 8,
        rubric: [
          { marks: 8, description: 'Perfect analysis with correct R' },
          { marks: 5, description: 'Graph correct but R error' },
          { marks: 2, description: 'Incorrect analysis' },
        ],
      },
    ],
    examTypeId: 'exam_wassce',
    paperTypeId: 'paper_wassce_3',
    waecPastYears: [2018, 2021, 2023],
    isActive: true,
  },

  {
    id: 'exp_hookes_law',
    subjectId: 'subj_wassce_physics',
    topicId: 'topic_wassce_phy_elasticity',
    name: "Hooke's Law - Spring Constant",
    slug: 'hookes-law',
    description:
      "Verify Hooke's law and determine the spring constant of a helical spring.",
    objectives: [
      'Set up the spring with measuring scale correctly',
      'Measure extension for different loads',
      'Plot a graph of extension against load',
      'Determine the spring constant from the gradient',
    ],
    difficulty: 'easy',
    estimatedTime: 35,
    simulationType: 'phet',
    phetSimUrl: 'https://phet.colorado.edu/sims/html/masses-and-springs/latest/masses-and-springs_en.html',
    apparatus: ['app_spring', 'app_slotted_mass', 'app_retort_stand', 'app_meter_rule'],
    materials: [
      { name: 'Pointer (pin)', quantity: '1' },
    ],
    safetyNotes: [
      'Do not overload the spring beyond its elastic limit',
      'Ensure masses are stable before taking readings',
    ],
    procedure: [
      {
        stepNumber: 1,
        instruction: 'Clamp the spring vertically from the retort stand with a pointer attached to its lower end.',
        requiredActions: [
          { actionType: 'drag', targetApparatus: 'app_retort_stand', description: 'Set up stand' },
          { actionType: 'connect', targetApparatus: 'app_spring', description: 'Attach spring' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 2,
        instruction: 'Position the meter rule vertically beside the spring and note the initial pointer position.',
        requiredActions: [
          { actionType: 'drag', targetApparatus: 'app_meter_rule', description: 'Position meter rule' },
          { actionType: 'measure', targetApparatus: 'app_meter_rule', description: 'Read initial position' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 3,
        instruction: 'Add 50g mass and record the new pointer position. Calculate the extension.',
        requiredActions: [
          { actionType: 'connect', targetApparatus: 'app_slotted_mass', description: 'Add 50g' },
          { actionType: 'measure', targetApparatus: 'app_meter_rule', description: 'Read new position' },
          { actionType: 'record', targetApparatus: 'app_meter_rule', description: 'Record extension' },
        ],
        isCheckpoint: true,
        maxMarks: 3,
      },
      {
        stepNumber: 4,
        instruction: 'Continue adding masses in steps of 50g and record extensions. Take at least 6 readings.',
        requiredActions: [
          { actionType: 'adjust', targetApparatus: 'app_slotted_mass', description: 'Add more masses' },
          { actionType: 'record', targetApparatus: 'app_meter_rule', description: 'Record 6 readings' },
        ],
        isCheckpoint: true,
        maxMarks: 6,
      },
      {
        stepNumber: 5,
        instruction: 'Plot a graph of extension (e) against load (F = mg).',
        requiredActions: [
          { actionType: 'record', targetApparatus: 'app_meter_rule', description: 'Plot e vs F graph' },
        ],
        isCheckpoint: true,
        maxMarks: 4,
      },
      {
        stepNumber: 6,
        instruction: 'Calculate the spring constant k from the gradient (k = F/e).',
        requiredActions: [
          { actionType: 'record', targetApparatus: 'app_meter_rule', description: 'Calculate k' },
        ],
        isCheckpoint: true,
        maxMarks: 3,
      },
    ],
    expectedResults: [
      { condition: 'Graph of e vs F', value: 'straight line through origin', unit: '' },
      { condition: 'Spring constant k', value: 25, tolerance: 5, unit: 'N/m' },
    ],
    assessmentCriteria: [
      {
        id: 'crit_setup',
        name: 'Setup',
        description: 'Correct apparatus arrangement',
        maxMarks: 4,
        rubric: [
          { marks: 4, description: 'Perfect setup' },
          { marks: 2, description: 'Minor issues' },
          { marks: 1, description: 'Significant errors' },
        ],
      },
      {
        id: 'crit_data',
        name: 'Data Collection',
        description: 'Accurate extension measurements',
        maxMarks: 8,
        rubric: [
          { marks: 8, description: 'All readings accurate' },
          { marks: 5, description: 'Some errors' },
          { marks: 2, description: 'Many errors' },
        ],
      },
      {
        id: 'crit_analysis',
        name: 'Analysis',
        description: 'Correct graph and k calculation',
        maxMarks: 8,
        rubric: [
          { marks: 8, description: 'Perfect analysis' },
          { marks: 5, description: 'Minor calculation errors' },
          { marks: 2, description: 'Incorrect analysis' },
        ],
      },
    ],
    examTypeId: 'exam_wassce',
    paperTypeId: 'paper_wassce_3',
    waecPastYears: [2017, 2019, 2022],
    isActive: true,
  },
];

// =============================================
// CHEMISTRY EXPERIMENTS
// =============================================

export const chemistryExperiments: Experiment[] = [
  {
    id: 'exp_acid_base_titration',
    subjectId: 'subj_wassce_chemistry',
    topicId: 'topic_wassce_chem_acids',
    name: 'Acid-Base Titration',
    slug: 'acid-base-titration',
    description:
      'Determine the concentration of an acid using a standard base solution through titration.',
    objectives: [
      'Set up titration apparatus correctly',
      'Perform accurate titration using correct technique',
      'Identify the end point using indicator',
      'Calculate the concentration of the acid',
    ],
    difficulty: 'medium',
    estimatedTime: 50,
    simulationType: 'custom',
    apparatus: ['app_burette', 'app_conical_flask', 'app_pipette', 'app_burette_stand', 'app_white_tile', 'app_indicator_bottle'],
    materials: [
      { name: 'Standard NaOH solution', quantity: '100ml', concentration: '0.1M' },
      { name: 'Unknown HCl solution', quantity: '50ml' },
      { name: 'Methyl orange indicator', quantity: '1 bottle' },
      { name: 'Distilled water', quantity: 'As needed' },
    ],
    safetyNotes: [
      'Wear safety goggles throughout the experiment',
      'Handle acids and bases with care',
      'Wash any spills immediately with water',
      'Report any accidents to the supervisor',
    ],
    procedure: [
      {
        stepNumber: 1,
        instruction: 'Rinse the burette with distilled water, then with the NaOH solution.',
        requiredActions: [
          { actionType: 'pour', targetApparatus: 'app_burette', description: 'Rinse burette' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 2,
        instruction: 'Fill the burette with NaOH solution and record the initial reading.',
        requiredActions: [
          { actionType: 'pour', targetApparatus: 'app_burette', description: 'Fill burette' },
          { actionType: 'measure', targetApparatus: 'app_burette', description: 'Read initial volume' },
          { actionType: 'record', targetApparatus: 'app_burette', description: 'Record reading' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 3,
        instruction: 'Use the pipette to transfer exactly 25ml of HCl into the conical flask.',
        hint: 'Fill pipette above the mark, then drain to the mark',
        requiredActions: [
          { actionType: 'measure', targetApparatus: 'app_pipette', description: 'Measure 25ml HCl' },
          { actionType: 'pour', targetApparatus: 'app_conical_flask', description: 'Transfer to flask' },
        ],
        isCheckpoint: true,
        maxMarks: 3,
      },
      {
        stepNumber: 4,
        instruction: 'Add 2-3 drops of methyl orange indicator to the flask.',
        requiredActions: [
          { actionType: 'pour', targetApparatus: 'app_conical_flask', description: 'Add indicator' },
        ],
        expectedOutcome: 'Solution turns pink/red',
        isCheckpoint: false,
        maxMarks: 1,
      },
      {
        stepNumber: 5,
        instruction: 'Place the flask on the white tile under the burette.',
        requiredActions: [
          { actionType: 'drag', targetApparatus: 'app_white_tile', description: 'Position white tile' },
          { actionType: 'drag', targetApparatus: 'app_conical_flask', description: 'Place flask on tile' },
        ],
        isCheckpoint: true,
        maxMarks: 1,
      },
      {
        stepNumber: 6,
        instruction: 'Slowly add NaOH from the burette while swirling the flask. Watch for colour change.',
        hint: 'Add dropwise near the end point',
        requiredActions: [
          { actionType: 'pour', targetApparatus: 'app_conical_flask', description: 'Add NaOH dropwise' },
          { actionType: 'observe', targetApparatus: 'app_conical_flask', description: 'Watch for colour change' },
        ],
        expectedOutcome: 'Colour changes from pink to orange to yellow',
        isCheckpoint: true,
        maxMarks: 4,
      },
      {
        stepNumber: 7,
        instruction: 'Stop when the colour changes permanently from pink to yellow. Record the final burette reading.',
        requiredActions: [
          { actionType: 'measure', targetApparatus: 'app_burette', description: 'Read final volume' },
          { actionType: 'record', targetApparatus: 'app_burette', description: 'Record titre value' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 8,
        instruction: 'Repeat the titration to get concordant results (within 0.1ml).',
        requiredActions: [
          { actionType: 'record', targetApparatus: 'app_burette', description: 'Record 3 concordant values' },
        ],
        isCheckpoint: true,
        maxMarks: 5,
      },
    ],
    expectedResults: [
      { condition: 'Average titre value', value: 25, tolerance: 2, unit: 'ml' },
      { condition: 'Concordant readings', value: 'within 0.1ml', unit: '' },
    ],
    assessmentCriteria: [
      {
        id: 'crit_technique',
        name: 'Titration Technique',
        description: 'Correct handling of apparatus and technique',
        maxMarks: 8,
        rubric: [
          { marks: 8, description: 'Perfect technique throughout' },
          { marks: 5, description: 'Good technique with minor issues' },
          { marks: 2, description: 'Poor technique' },
        ],
      },
      {
        id: 'crit_accuracy',
        name: 'Accuracy',
        description: 'Concordant results obtained',
        maxMarks: 6,
        rubric: [
          { marks: 6, description: 'Concordant within 0.1ml' },
          { marks: 4, description: 'Within 0.2ml' },
          { marks: 2, description: 'Not concordant' },
        ],
      },
      {
        id: 'crit_calculation',
        name: 'Calculations',
        description: 'Correct concentration calculation',
        maxMarks: 6,
        rubric: [
          { marks: 6, description: 'All calculations correct' },
          { marks: 3, description: 'Minor calculation errors' },
          { marks: 1, description: 'Major errors' },
        ],
      },
    ],
    examTypeId: 'exam_wassce',
    paperTypeId: 'paper_wassce_3',
    waecPastYears: [2017, 2018, 2019, 2020, 2021, 2022, 2023],
    isActive: true,
  },

  {
    id: 'exp_qualitative_analysis',
    subjectId: 'subj_wassce_chemistry',
    topicId: 'topic_wassce_chem_salts',
    name: 'Qualitative Analysis - Salt Identification',
    slug: 'qualitative-analysis',
    description:
      'Identify an unknown salt using systematic qualitative analysis tests.',
    objectives: [
      'Perform flame test correctly',
      'Test for cation using appropriate reagents',
      'Test for anion systematically',
      'Identify the unknown salt',
    ],
    difficulty: 'hard',
    estimatedTime: 60,
    simulationType: 'custom',
    apparatus: ['app_test_tube', 'app_test_tube_rack', 'app_bunsen_burner', 'app_dropper'],
    materials: [
      { name: 'Unknown salt sample', quantity: '5g' },
      { name: 'Dilute HCl', quantity: '20ml' },
      { name: 'Dilute NaOH', quantity: '20ml' },
      { name: 'Dilute H2SO4', quantity: '10ml' },
      { name: 'AgNO3 solution', quantity: '10ml' },
      { name: 'BaCl2 solution', quantity: '10ml' },
    ],
    safetyNotes: [
      'Handle all chemicals with care',
      'Use the fume cupboard for tests that produce gases',
      'Do not taste any chemicals',
      'Wash hands after the experiment',
    ],
    procedure: [
      {
        stepNumber: 1,
        instruction: 'Observe the appearance of the salt (colour, crystal form).',
        requiredActions: [
          { actionType: 'observe', targetApparatus: 'app_test_tube', description: 'Note appearance' },
          { actionType: 'record', targetApparatus: 'app_test_tube', description: 'Record observations' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 2,
        instruction: 'Perform a flame test: Dip a clean wire loop in the salt and heat in the Bunsen flame.',
        requiredActions: [
          { actionType: 'heat', targetApparatus: 'app_bunsen_burner', description: 'Heat wire loop' },
          { actionType: 'observe', targetApparatus: 'app_bunsen_burner', description: 'Note flame colour' },
        ],
        isCheckpoint: true,
        maxMarks: 3,
      },
      {
        stepNumber: 3,
        instruction: 'Add dilute NaOH to a solution of the salt. Heat gently if no precipitate forms.',
        requiredActions: [
          { actionType: 'pour', targetApparatus: 'app_test_tube', description: 'Add NaOH' },
          { actionType: 'observe', targetApparatus: 'app_test_tube', description: 'Note any precipitate' },
        ],
        isCheckpoint: true,
        maxMarks: 4,
      },
      {
        stepNumber: 4,
        instruction: 'Test for chloride: Add dilute HNO3 followed by AgNO3 solution.',
        requiredActions: [
          { actionType: 'pour', targetApparatus: 'app_test_tube', description: 'Add HNO3 then AgNO3' },
          { actionType: 'observe', targetApparatus: 'app_test_tube', description: 'Note any precipitate' },
        ],
        isCheckpoint: true,
        maxMarks: 3,
      },
      {
        stepNumber: 5,
        instruction: 'Test for sulphate: Add dilute HCl followed by BaCl2 solution.',
        requiredActions: [
          { actionType: 'pour', targetApparatus: 'app_test_tube', description: 'Add HCl then BaCl2' },
          { actionType: 'observe', targetApparatus: 'app_test_tube', description: 'Note any precipitate' },
        ],
        isCheckpoint: true,
        maxMarks: 3,
      },
      {
        stepNumber: 6,
        instruction: 'Test for carbonate: Add dilute HCl and test any gas evolved with lime water.',
        requiredActions: [
          { actionType: 'pour', targetApparatus: 'app_test_tube', description: 'Add HCl' },
          { actionType: 'observe', targetApparatus: 'app_test_tube', description: 'Test gas with lime water' },
        ],
        isCheckpoint: true,
        maxMarks: 3,
      },
      {
        stepNumber: 7,
        instruction: 'Identify the cation and anion based on your observations.',
        requiredActions: [
          { actionType: 'record', targetApparatus: 'app_test_tube', description: 'State cation and anion' },
        ],
        isCheckpoint: true,
        maxMarks: 4,
      },
    ],
    expectedResults: [
      { condition: 'Correct cation identification', value: 'As per sample', unit: '' },
      { condition: 'Correct anion identification', value: 'As per sample', unit: '' },
    ],
    assessmentCriteria: [
      {
        id: 'crit_tests',
        name: 'Test Execution',
        description: 'Correct performance of qualitative tests',
        maxMarks: 10,
        rubric: [
          { marks: 10, description: 'All tests performed correctly' },
          { marks: 7, description: 'Most tests correct' },
          { marks: 4, description: 'Some tests correct' },
        ],
      },
      {
        id: 'crit_observations',
        name: 'Observations',
        description: 'Accurate observations recorded',
        maxMarks: 6,
        rubric: [
          { marks: 6, description: 'All observations accurate' },
          { marks: 4, description: 'Most observations correct' },
          { marks: 2, description: 'Few correct observations' },
        ],
      },
      {
        id: 'crit_identification',
        name: 'Identification',
        description: 'Correct salt identification',
        maxMarks: 4,
        rubric: [
          { marks: 4, description: 'Both ions correctly identified' },
          { marks: 2, description: 'One ion correct' },
          { marks: 0, description: 'Incorrect identification' },
        ],
      },
    ],
    examTypeId: 'exam_wassce',
    paperTypeId: 'paper_wassce_3',
    waecPastYears: [2017, 2018, 2019, 2020, 2021, 2022, 2023],
    isActive: true,
  },
];

// =============================================
// BIOLOGY EXPERIMENTS
// =============================================

export const biologyExperiments: Experiment[] = [
  {
    id: 'exp_microscope_use',
    subjectId: 'subj_wassce_biology',
    topicId: 'topic_wassce_bio_cells',
    name: 'Use of the Microscope',
    slug: 'microscope-use',
    description: 'Learn to set up, focus, and use a light microscope to observe specimens.',
    objectives: [
      'Identify the parts of a microscope',
      'Set up the microscope correctly',
      'Focus on a specimen using low and high power',
      'Calculate magnification',
    ],
    difficulty: 'easy',
    estimatedTime: 30,
    simulationType: 'custom',
    apparatus: ['app_microscope', 'app_slide', 'app_cover_slip', 'app_dropper'],
    materials: [
      { name: 'Prepared slide', quantity: '1' },
      { name: 'Lens paper', quantity: 'As needed' },
    ],
    safetyNotes: [
      'Handle the microscope carefully - it is delicate equipment',
      'Always carry with both hands',
      'Never touch lenses with fingers',
    ],
    procedure: [
      {
        stepNumber: 1,
        instruction: 'Place the microscope on a flat surface with the arm facing you.',
        requiredActions: [
          { actionType: 'drag', targetApparatus: 'app_microscope', description: 'Position microscope' },
        ],
        isCheckpoint: true,
        maxMarks: 1,
      },
      {
        stepNumber: 2,
        instruction: 'Clean the eyepiece and objective lenses with lens paper if needed.',
        requiredActions: [
          { actionType: 'adjust', targetApparatus: 'app_microscope', description: 'Clean lenses' },
        ],
        isCheckpoint: false,
        maxMarks: 1,
      },
      {
        stepNumber: 3,
        instruction: 'Rotate the nosepiece to click the lowest power objective (x4 or x10) into position.',
        requiredActions: [
          { actionType: 'adjust', targetApparatus: 'app_microscope', description: 'Select low power objective' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 4,
        instruction: 'Place the slide on the stage and secure with clips. Position specimen over the aperture.',
        requiredActions: [
          { actionType: 'drag', targetApparatus: 'app_slide', description: 'Place slide on stage' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 5,
        instruction: 'Adjust the mirror or lamp to illuminate the specimen.',
        requiredActions: [
          { actionType: 'adjust', targetApparatus: 'app_microscope', description: 'Adjust illumination' },
        ],
        isCheckpoint: true,
        maxMarks: 1,
      },
      {
        stepNumber: 6,
        instruction: 'Looking from the side, lower the objective until it is close to the slide.',
        hint: 'Never lower the objective while looking through the eyepiece',
        requiredActions: [
          { actionType: 'adjust', targetApparatus: 'app_microscope', description: 'Lower objective' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 7,
        instruction: 'Look through the eyepiece and slowly raise the objective using the coarse focus until the specimen is visible.',
        requiredActions: [
          { actionType: 'adjust', targetApparatus: 'app_microscope', description: 'Focus with coarse knob' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 8,
        instruction: 'Use the fine focus to sharpen the image. Switch to high power for detailed observation.',
        requiredActions: [
          { actionType: 'adjust', targetApparatus: 'app_microscope', description: 'Fine focus and high power' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 9,
        instruction: 'Calculate the total magnification (eyepiece x objective).',
        requiredActions: [
          { actionType: 'record', targetApparatus: 'app_microscope', description: 'Calculate magnification' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
    ],
    expectedResults: [
      { condition: 'Specimen clearly visible', value: 'Focused image', unit: '' },
      { condition: 'Magnification at x400', value: 400, unit: 'x' },
    ],
    assessmentCriteria: [
      {
        id: 'crit_handling',
        name: 'Microscope Handling',
        description: 'Correct handling and setup',
        maxMarks: 5,
        rubric: [
          { marks: 5, description: 'Perfect handling' },
          { marks: 3, description: 'Minor issues' },
          { marks: 1, description: 'Poor handling' },
        ],
      },
      {
        id: 'crit_focusing',
        name: 'Focusing Technique',
        description: 'Correct focusing procedure',
        maxMarks: 8,
        rubric: [
          { marks: 8, description: 'Perfect technique' },
          { marks: 5, description: 'Good with minor errors' },
          { marks: 2, description: 'Poor technique' },
        ],
      },
      {
        id: 'crit_observation',
        name: 'Observation',
        description: 'Clear view and magnification',
        maxMarks: 7,
        rubric: [
          { marks: 7, description: 'Clear focused image' },
          { marks: 4, description: 'Partially clear' },
          { marks: 1, description: 'Unable to focus' },
        ],
      },
    ],
    examTypeId: 'exam_wassce',
    paperTypeId: 'paper_wassce_3',
    waecPastYears: [2018, 2020, 2023],
    isActive: true,
  },

  {
    id: 'exp_food_tests',
    subjectId: 'subj_wassce_biology',
    topicId: 'topic_wassce_bio_nutrition',
    name: 'Food Tests - Starch, Protein, Fat',
    slug: 'food-tests',
    description: 'Test food samples for the presence of starch, protein, and fat using specific reagents.',
    objectives: [
      'Perform the iodine test for starch',
      'Perform the Biuret test for protein',
      'Perform the Sudan III/emulsion test for fat',
      'Record and interpret results correctly',
    ],
    difficulty: 'easy',
    estimatedTime: 35,
    simulationType: 'custom',
    apparatus: ['app_test_tube', 'app_test_tube_rack', 'app_dropper', 'app_iodine_solution', 'app_biuret_reagent', 'app_sudan_iii'],
    materials: [
      { name: 'Food samples (bread, egg white, oil)', quantity: 'Small amounts' },
      { name: 'Distilled water', quantity: 'As needed' },
    ],
    safetyNotes: [
      'Handle reagents carefully',
      'Do not taste any substances',
      'Wash hands after experiment',
    ],
    procedure: [
      {
        stepNumber: 1,
        instruction: 'Label three test tubes A (starch), B (protein), C (fat).',
        requiredActions: [
          { actionType: 'drag', targetApparatus: 'app_test_tube', description: 'Label test tubes' },
        ],
        isCheckpoint: true,
        maxMarks: 1,
      },
      {
        stepNumber: 2,
        instruction: 'TEST FOR STARCH: Place a small sample of bread in tube A. Add a few drops of iodine solution.',
        requiredActions: [
          { actionType: 'pour', targetApparatus: 'app_test_tube', description: 'Add iodine to sample' },
          { actionType: 'observe', targetApparatus: 'app_test_tube', description: 'Observe colour change' },
        ],
        expectedOutcome: 'Blue-black colour indicates starch present',
        isCheckpoint: true,
        maxMarks: 3,
      },
      {
        stepNumber: 3,
        instruction: 'Record your observation for the starch test.',
        requiredActions: [
          { actionType: 'record', targetApparatus: 'app_test_tube', description: 'Record starch test result' },
        ],
        isCheckpoint: false,
        maxMarks: 2,
      },
      {
        stepNumber: 4,
        instruction: 'TEST FOR PROTEIN: Add egg white to tube B with water. Add Biuret reagent (NaOH then CuSO4).',
        requiredActions: [
          { actionType: 'pour', targetApparatus: 'app_test_tube', description: 'Add Biuret reagent' },
          { actionType: 'observe', targetApparatus: 'app_test_tube', description: 'Observe colour change' },
        ],
        expectedOutcome: 'Purple/violet colour indicates protein present',
        isCheckpoint: true,
        maxMarks: 3,
      },
      {
        stepNumber: 5,
        instruction: 'Record your observation for the protein test.',
        requiredActions: [
          { actionType: 'record', targetApparatus: 'app_test_tube', description: 'Record protein test result' },
        ],
        isCheckpoint: false,
        maxMarks: 2,
      },
      {
        stepNumber: 6,
        instruction: 'TEST FOR FAT: Add a few drops of oil to tube C with ethanol. Shake and add water.',
        hint: 'A white emulsion indicates fat (emulsion test)',
        requiredActions: [
          { actionType: 'pour', targetApparatus: 'app_test_tube', description: 'Add oil, ethanol, water' },
          { actionType: 'observe', targetApparatus: 'app_test_tube', description: 'Observe emulsion' },
        ],
        expectedOutcome: 'White cloudy emulsion indicates fat present',
        isCheckpoint: true,
        maxMarks: 3,
      },
      {
        stepNumber: 7,
        instruction: 'Alternative: Add Sudan III to a fat sample. Observe for red-stained layer.',
        requiredActions: [
          { actionType: 'pour', targetApparatus: 'app_test_tube', description: 'Add Sudan III' },
          { actionType: 'observe', targetApparatus: 'app_test_tube', description: 'Observe red layer' },
        ],
        expectedOutcome: 'Red/orange layer indicates fat present',
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 8,
        instruction: 'Record your observation for the fat test and complete the results table.',
        requiredActions: [
          { actionType: 'record', targetApparatus: 'app_test_tube', description: 'Complete results table' },
        ],
        isCheckpoint: true,
        maxMarks: 4,
      },
    ],
    expectedResults: [
      { condition: 'Starch test positive', value: 'Blue-black colour', unit: '' },
      { condition: 'Protein test positive', value: 'Purple colour', unit: '' },
      { condition: 'Fat test positive', value: 'White emulsion or red layer', unit: '' },
    ],
    assessmentCriteria: [
      {
        id: 'crit_procedure',
        name: 'Test Procedure',
        description: 'Correct execution of all three tests',
        maxMarks: 9,
        rubric: [
          { marks: 9, description: 'All tests performed correctly' },
          { marks: 6, description: 'Two tests correct' },
          { marks: 3, description: 'One test correct' },
        ],
      },
      {
        id: 'crit_observations',
        name: 'Observations',
        description: 'Accurate recording of colour changes',
        maxMarks: 6,
        rubric: [
          { marks: 6, description: 'All observations accurate' },
          { marks: 4, description: 'Most correct' },
          { marks: 2, description: 'Few correct' },
        ],
      },
      {
        id: 'crit_conclusions',
        name: 'Conclusions',
        description: 'Correct interpretation of results',
        maxMarks: 5,
        rubric: [
          { marks: 5, description: 'All conclusions correct' },
          { marks: 3, description: 'Most correct' },
          { marks: 1, description: 'Few correct' },
        ],
      },
    ],
    examTypeId: 'exam_wassce',
    paperTypeId: 'paper_wassce_3',
    waecPastYears: [2017, 2019, 2021, 2023],
    isActive: true,
  },
];

// =============================================
// COMBINED EXPORTS
// =============================================

export const allExperiments: Experiment[] = [
  ...physicsExperiments,
  ...chemistryExperiments,
  ...biologyExperiments,
];

// Helper functions
export function getExperimentBySlug(slug: string): Experiment | undefined {
  return allExperiments.find((exp) => exp.slug === slug);
}

export function getExperimentById(id: string): Experiment | undefined {
  return allExperiments.find((exp) => exp.id === id);
}

export function getExperimentsBySubject(subjectId: string): Experiment[] {
  return allExperiments.filter((exp) => exp.subjectId === subjectId);
}

export function getApparatusById(id: string): Apparatus | undefined {
  return labApparatus.find((app) => app.id === id);
}

export function getApparatusForExperiment(experimentId: string): Apparatus[] {
  const experiment = getExperimentById(experimentId);
  if (!experiment) return [];

  return experiment.apparatus
    .map((appId) => getApparatusById(appId))
    .filter((app): app is Apparatus => app !== undefined);
}
