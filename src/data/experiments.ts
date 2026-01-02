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

  // =============== NEW PHYSICS APPARATUS ===============
  {
    id: 'app_ray_box',
    name: 'Ray Box',
    description: 'Light source producing parallel rays for optics experiments',
    category: 'optical',
    subjectId: 'subj_wassce_physics',
    interactionPoints: [
      { id: 'output', name: 'Light Output', type: 'output', position: { x: 100, y: 50 } },
    ],
    properties: {
      isDraggable: true,
      isConnectable: false,
    },
  },
  {
    id: 'app_glass_block',
    name: 'Rectangular Glass Block',
    description: 'For refraction experiments (refractive index ~1.5)',
    category: 'optical',
    subjectId: 'subj_wassce_physics',
    interactionPoints: [],
    properties: {
      isDraggable: true,
      isConnectable: false,
    },
  },
  {
    id: 'app_protractor',
    name: 'Protractor',
    description: '180° protractor for measuring angles',
    category: 'measurement',
    subjectId: 'subj_wassce_physics',
    interactionPoints: [],
    properties: {
      isDraggable: true,
      isConnectable: false,
      hasReading: true,
      readingType: 'numeric',
      readingUnit: '°',
      minValue: 0,
      maxValue: 90,
      precision: 1,
    },
  },
  {
    id: 'app_pins',
    name: 'Optical Pins',
    description: 'Set of pins for tracing light rays',
    category: 'optical',
    subjectId: 'subj_wassce_physics',
    interactionPoints: [],
    properties: {
      isDraggable: true,
      isConnectable: false,
    },
  },
  {
    id: 'app_convex_lens',
    name: 'Convex Lens',
    description: 'Converging lens (focal length ~15cm)',
    category: 'optical',
    subjectId: 'subj_wassce_physics',
    interactionPoints: [],
    properties: {
      isDraggable: true,
      isConnectable: false,
      hasReading: true,
      readingType: 'numeric',
      readingUnit: 'cm',
    },
  },
  {
    id: 'app_lens_holder',
    name: 'Lens Holder',
    description: 'Stand for holding lenses on optical bench',
    category: 'support',
    subjectId: 'subj_wassce_physics',
    interactionPoints: [
      { id: 'holder', name: 'Lens Position', type: 'connect', position: { x: 50, y: 50 } },
    ],
    properties: {
      isDraggable: true,
      isConnectable: true,
    },
  },
  {
    id: 'app_optical_bench',
    name: 'Optical Bench',
    description: 'Scaled track for positioning optical components',
    category: 'support',
    subjectId: 'subj_wassce_physics',
    interactionPoints: [],
    properties: {
      isDraggable: false,
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
    id: 'app_screen',
    name: 'White Screen',
    description: 'Screen for viewing real images',
    category: 'optical',
    subjectId: 'subj_wassce_physics',
    interactionPoints: [],
    properties: {
      isDraggable: true,
      isConnectable: false,
    },
  },
  {
    id: 'app_illuminated_object',
    name: 'Illuminated Object',
    description: 'Cross-wire or arrow-shaped light source',
    category: 'optical',
    subjectId: 'subj_wassce_physics',
    interactionPoints: [],
    properties: {
      isDraggable: true,
      isConnectable: false,
    },
  },
  {
    id: 'app_knife_edge',
    name: 'Knife Edge (Pivot)',
    description: 'Sharp pivot for balancing meter rule',
    category: 'support',
    subjectId: 'subj_wassce_physics',
    interactionPoints: [
      { id: 'pivot', name: 'Pivot Point', type: 'connect', position: { x: 50, y: 0 } },
    ],
    properties: {
      isDraggable: true,
      isConnectable: true,
    },
  },
  {
    id: 'app_meter_rule_balance',
    name: 'Meter Rule (for balance)',
    description: 'Uniform meter rule for moments experiment',
    category: 'measurement',
    subjectId: 'subj_wassce_physics',
    interactionPoints: [
      { id: 'left', name: 'Left End', type: 'connect', position: { x: 0, y: 50 } },
      { id: 'right', name: 'Right End', type: 'connect', position: { x: 100, y: 50 } },
    ],
    properties: {
      isDraggable: true,
      isConnectable: true,
    },
  },
  {
    id: 'app_mass_hanger',
    name: 'Mass Hanger with Masses',
    description: 'Hanger with slotted masses (10g, 20g, 50g, 100g)',
    category: 'measurement',
    subjectId: 'subj_wassce_physics',
    interactionPoints: [
      { id: 'hook', name: 'Hook', type: 'connect', position: { x: 50, y: 0 } },
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
    },
  },
  {
    id: 'app_calorimeter',
    name: 'Calorimeter',
    description: 'Insulated copper calorimeter with stirrer',
    category: 'container',
    subjectId: 'subj_wassce_physics',
    interactionPoints: [
      { id: 'opening', name: 'Opening', type: 'input', position: { x: 50, y: 0 } },
    ],
    properties: {
      isDraggable: true,
      isConnectable: true,
    },
  },
  {
    id: 'app_thermometer',
    name: 'Thermometer (-10 to 110°C)',
    description: 'Mercury thermometer for temperature measurement',
    category: 'measurement',
    subjectId: 'subj_wassce_physics',
    interactionPoints: [],
    properties: {
      isDraggable: true,
      isConnectable: false,
      hasReading: true,
      readingType: 'numeric',
      readingUnit: '°C',
      minValue: -10,
      maxValue: 110,
      precision: 1,
      defaultValue: 25,
    },
  },
  {
    id: 'app_beaker_250',
    name: 'Beaker (250ml)',
    description: 'Glass beaker for heating water',
    category: 'container',
    subjectId: 'subj_wassce_physics',
    interactionPoints: [
      { id: 'opening', name: 'Opening', type: 'input', position: { x: 50, y: 0 } },
    ],
    properties: {
      isDraggable: true,
      isConnectable: true,
    },
  },
  {
    id: 'app_measuring_cylinder',
    name: 'Measuring Cylinder (100ml)',
    description: 'For measuring liquid volumes',
    category: 'measurement',
    subjectId: 'subj_wassce_physics',
    interactionPoints: [],
    properties: {
      isDraggable: true,
      isConnectable: false,
      hasReading: true,
      readingType: 'numeric',
      readingUnit: 'ml',
      minValue: 0,
      maxValue: 100,
      precision: 1,
    },
  },
  {
    id: 'app_balance',
    name: 'Electronic Balance',
    description: 'Digital balance for mass measurement (0.1g precision)',
    category: 'measurement',
    subjectId: 'subj_wassce_physics',
    interactionPoints: [],
    properties: {
      isDraggable: true,
      isConnectable: false,
      hasReading: true,
      readingType: 'numeric',
      readingUnit: 'g',
      minValue: 0,
      maxValue: 500,
      precision: 1,
    },
  },
  {
    id: 'app_resistance_wire',
    name: 'Resistance Wire (SWG 26)',
    description: 'Constantan wire mounted on board with cm scale',
    category: 'electrical',
    subjectId: 'subj_wassce_physics',
    interactionPoints: [
      { id: 'start', name: 'Start (0cm)', type: 'connect', position: { x: 0, y: 50 } },
      { id: 'jockey', name: 'Jockey Contact', type: 'connect', position: { x: 50, y: 50 } },
    ],
    properties: {
      isDraggable: false,
      isConnectable: true,
      hasReading: true,
      readingType: 'numeric',
      readingUnit: 'cm',
      minValue: 0,
      maxValue: 100,
      precision: 1,
    },
  },
  {
    id: 'app_jockey',
    name: 'Jockey',
    description: 'Sliding contact for potentiometer',
    category: 'electrical',
    subjectId: 'subj_wassce_physics',
    interactionPoints: [],
    properties: {
      isDraggable: true,
      isConnectable: true,
    },
  },

  // =============== NEW CHEMISTRY APPARATUS ===============
  {
    id: 'app_electrolysis_cell',
    name: 'Electrolysis Cell',
    description: 'U-tube or beaker for electrolysis with electrodes',
    category: 'container',
    subjectId: 'subj_wassce_chemistry',
    interactionPoints: [
      { id: 'anode', name: 'Anode (+)', type: 'connect', position: { x: 20, y: 0 } },
      { id: 'cathode', name: 'Cathode (-)', type: 'connect', position: { x: 80, y: 0 } },
    ],
    properties: {
      isDraggable: true,
      isConnectable: true,
    },
  },
  {
    id: 'app_carbon_electrodes',
    name: 'Carbon Electrodes (pair)',
    description: 'Graphite electrodes for electrolysis',
    category: 'electrical',
    subjectId: 'subj_wassce_chemistry',
    interactionPoints: [],
    properties: {
      isDraggable: true,
      isConnectable: true,
    },
  },
  {
    id: 'app_dc_power_supply',
    name: 'DC Power Supply',
    description: 'Variable DC power supply (0-12V)',
    category: 'electrical',
    subjectId: 'subj_wassce_chemistry',
    interactionPoints: [
      { id: 'positive', name: 'Positive (+)', type: 'output', position: { x: 30, y: 100 } },
      { id: 'negative', name: 'Negative (-)', type: 'output', position: { x: 70, y: 100 } },
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
    id: 'app_gas_jar',
    name: 'Gas Jar with Lid',
    description: 'For collecting and testing gases',
    category: 'container',
    subjectId: 'subj_wassce_chemistry',
    interactionPoints: [],
    properties: {
      isDraggable: true,
      isConnectable: false,
    },
  },
  {
    id: 'app_delivery_tube',
    name: 'Delivery Tube',
    description: 'Bent glass tube for gas collection',
    category: 'container',
    subjectId: 'subj_wassce_chemistry',
    interactionPoints: [],
    properties: {
      isDraggable: true,
      isConnectable: true,
    },
  },
  {
    id: 'app_trough',
    name: 'Pneumatic Trough',
    description: 'Water-filled trough for gas collection',
    category: 'container',
    subjectId: 'subj_wassce_chemistry',
    interactionPoints: [],
    properties: {
      isDraggable: true,
      isConnectable: false,
    },
  },
  {
    id: 'app_evaporating_dish',
    name: 'Evaporating Dish',
    description: 'Porcelain dish for evaporation',
    category: 'container',
    subjectId: 'subj_wassce_chemistry',
    interactionPoints: [],
    properties: {
      isDraggable: true,
      isConnectable: false,
    },
  },
  {
    id: 'app_tripod_stand',
    name: 'Tripod Stand',
    description: 'Support for heating apparatus',
    category: 'support',
    subjectId: 'subj_wassce_chemistry',
    interactionPoints: [],
    properties: {
      isDraggable: true,
      isConnectable: false,
    },
  },
  {
    id: 'app_wire_gauze',
    name: 'Wire Gauze',
    description: 'Heat-resistant gauze for even heating',
    category: 'support',
    subjectId: 'subj_wassce_chemistry',
    interactionPoints: [],
    properties: {
      isDraggable: true,
      isConnectable: false,
    },
  },
  {
    id: 'app_splint',
    name: 'Wooden Splint',
    description: 'For testing gases (glowing/burning)',
    category: 'chemical',
    subjectId: 'subj_wassce_chemistry',
    interactionPoints: [],
    properties: {
      isDraggable: true,
      isConnectable: false,
    },
  },
  {
    id: 'app_litmus_paper',
    name: 'Litmus Paper (Red/Blue)',
    description: 'pH indicator paper',
    category: 'chemical',
    subjectId: 'subj_wassce_chemistry',
    interactionPoints: [],
    properties: {
      isDraggable: true,
      isConnectable: false,
    },
  },

  // =============== NEW BIOLOGY APPARATUS ===============
  {
    id: 'app_petri_dish',
    name: 'Petri Dish',
    description: 'Shallow dish for holding specimens',
    category: 'container',
    subjectId: 'subj_wassce_biology',
    interactionPoints: [],
    properties: {
      isDraggable: true,
      isConnectable: false,
    },
  },
  {
    id: 'app_scalpel',
    name: 'Scalpel',
    description: 'Sharp blade for cutting plant/animal tissue',
    category: 'biological',
    subjectId: 'subj_wassce_biology',
    interactionPoints: [],
    properties: {
      isDraggable: true,
      isConnectable: false,
    },
  },
  {
    id: 'app_forceps',
    name: 'Forceps',
    description: 'For handling small specimens',
    category: 'biological',
    subjectId: 'subj_wassce_biology',
    interactionPoints: [],
    properties: {
      isDraggable: true,
      isConnectable: false,
    },
  },
  {
    id: 'app_potometer',
    name: 'Potometer',
    description: 'Apparatus for measuring transpiration rate',
    category: 'biological',
    subjectId: 'subj_wassce_biology',
    interactionPoints: [
      { id: 'shoot', name: 'Shoot Holder', type: 'connect', position: { x: 0, y: 50 } },
      { id: 'reservoir', name: 'Water Reservoir', type: 'input', position: { x: 100, y: 50 } },
    ],
    properties: {
      isDraggable: false,
      isConnectable: true,
      hasReading: true,
      readingType: 'numeric',
      readingUnit: 'ml',
      minValue: 0,
      maxValue: 10,
      precision: 2,
    },
  },
  {
    id: 'app_boiling_tube',
    name: 'Boiling Tube',
    description: 'Large test tube for heating solutions',
    category: 'container',
    subjectId: 'subj_wassce_biology',
    interactionPoints: [],
    properties: {
      isDraggable: true,
      isConnectable: false,
    },
  },
  {
    id: 'app_water_bath',
    name: 'Water Bath',
    description: 'For maintaining constant temperature',
    category: 'heating',
    subjectId: 'subj_wassce_biology',
    interactionPoints: [],
    properties: {
      isDraggable: false,
      isConnectable: false,
      hasReading: true,
      readingType: 'numeric',
      readingUnit: '°C',
      minValue: 0,
      maxValue: 100,
      precision: 1,
      defaultValue: 37,
    },
  },
  {
    id: 'app_syringe',
    name: 'Syringe (10ml)',
    description: 'For measuring and transferring liquids',
    category: 'measurement',
    subjectId: 'subj_wassce_biology',
    interactionPoints: [],
    properties: {
      isDraggable: true,
      isConnectable: false,
      hasReading: true,
      readingType: 'numeric',
      readingUnit: 'ml',
      minValue: 0,
      maxValue: 10,
      precision: 0.5,
    },
  },
  {
    id: 'app_dissecting_board',
    name: 'Dissecting Board',
    description: 'Cork-lined board for pinning specimens',
    category: 'biological',
    subjectId: 'subj_wassce_biology',
    interactionPoints: [],
    properties: {
      isDraggable: false,
      isConnectable: false,
    },
  },
  {
    id: 'app_dissecting_pins',
    name: 'Dissecting Pins',
    description: 'Pins for securing specimens',
    category: 'biological',
    subjectId: 'subj_wassce_biology',
    interactionPoints: [],
    properties: {
      isDraggable: true,
      isConnectable: false,
    },
  },
  {
    id: 'app_scissors',
    name: 'Dissecting Scissors',
    description: 'Fine scissors for cutting tissue',
    category: 'biological',
    subjectId: 'subj_wassce_biology',
    interactionPoints: [],
    properties: {
      isDraggable: true,
      isConnectable: false,
    },
  },
  {
    id: 'app_mounted_needle',
    name: 'Mounted Needle',
    description: 'For teasing apart tissues',
    category: 'biological',
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

  // =============== NEW PHYSICS EXPERIMENTS ===============
  {
    id: 'exp_refraction_snells_law',
    subjectId: 'subj_wassce_physics',
    topicId: 'topic_wassce_phy_light',
    name: "Refraction of Light - Snell's Law",
    slug: 'refraction-snells-law',
    description:
      "Verify Snell's law of refraction and determine the refractive index of a glass block by tracing light rays.",
    objectives: [
      'Trace incident and refracted rays accurately',
      'Measure angles of incidence and refraction',
      'Plot a graph of sin i against sin r',
      'Calculate the refractive index from the gradient',
    ],
    difficulty: 'medium',
    estimatedTime: 45,
    simulationType: 'phet',
    phetSimUrl: 'https://phet.colorado.edu/sims/html/bending-light/latest/bending-light_en.html',
    apparatus: ['app_ray_box', 'app_glass_block', 'app_protractor', 'app_pins', 'app_meter_rule'],
    materials: [
      { name: 'Plain white paper', quantity: '2 sheets' },
      { name: 'Drawing board', quantity: '1' },
      { name: 'Sharp pencil', quantity: '1' },
    ],
    safetyNotes: [
      'Handle pins carefully to avoid injury',
      'Do not look directly into the ray box light',
      'Handle glass block carefully - it can chip or break',
    ],
    procedure: [
      {
        stepNumber: 1,
        instruction: 'Place the glass block on white paper and trace its outline.',
        requiredActions: [
          { actionType: 'drag', targetApparatus: 'app_glass_block', description: 'Position glass block' },
        ],
        isCheckpoint: true,
        maxMarks: 1,
      },
      {
        stepNumber: 2,
        instruction: 'Draw a normal (perpendicular) line at the point where light will enter the block.',
        requiredActions: [
          { actionType: 'record', targetApparatus: 'app_protractor', description: 'Draw normal line' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 3,
        instruction: 'Set the angle of incidence i = 20° and direct the ray box beam along this line.',
        requiredActions: [
          { actionType: 'adjust', targetApparatus: 'app_ray_box', description: 'Set angle of incidence' },
          { actionType: 'measure', targetApparatus: 'app_protractor', targetValue: 20, tolerance: 1, description: 'Measure angle i' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 4,
        instruction: 'Place two pins P1 and P2 along the incident ray.',
        requiredActions: [
          { actionType: 'drag', targetApparatus: 'app_pins', description: 'Position incident ray pins' },
        ],
        isCheckpoint: false,
        maxMarks: 1,
      },
      {
        stepNumber: 5,
        instruction: 'Look through the glass block from the other side and place pins P3 and P4 to appear in line with P1 and P2.',
        hint: 'This locates the emergent ray',
        requiredActions: [
          { actionType: 'drag', targetApparatus: 'app_pins', description: 'Position emergent ray pins' },
          { actionType: 'observe', targetApparatus: 'app_glass_block', description: 'Align pins through glass' },
        ],
        isCheckpoint: true,
        maxMarks: 3,
      },
      {
        stepNumber: 6,
        instruction: 'Remove the glass block and draw the path of light through the block.',
        requiredActions: [
          { actionType: 'record', targetApparatus: 'app_glass_block', description: 'Draw ray path' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 7,
        instruction: 'Measure the angle of refraction r inside the glass block.',
        requiredActions: [
          { actionType: 'measure', targetApparatus: 'app_protractor', description: 'Measure angle r' },
          { actionType: 'record', targetApparatus: 'app_protractor', description: 'Record angle r' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 8,
        instruction: 'Repeat for angles of incidence: 30°, 40°, 50°, 60°, 70°.',
        requiredActions: [
          { actionType: 'adjust', targetApparatus: 'app_ray_box', description: 'Change angle of incidence' },
          { actionType: 'record', targetApparatus: 'app_protractor', description: 'Record all i and r values' },
        ],
        isCheckpoint: true,
        maxMarks: 5,
      },
      {
        stepNumber: 9,
        instruction: 'Calculate sin i and sin r for each pair. Plot a graph of sin i against sin r.',
        requiredActions: [
          { actionType: 'record', targetApparatus: 'app_protractor', description: 'Calculate and plot graph' },
        ],
        isCheckpoint: true,
        maxMarks: 4,
      },
      {
        stepNumber: 10,
        instruction: 'Calculate the refractive index n from the gradient of the graph (n = sin i / sin r).',
        requiredActions: [
          { actionType: 'record', targetApparatus: 'app_protractor', description: 'Calculate refractive index' },
        ],
        isCheckpoint: true,
        maxMarks: 3,
      },
    ],
    expectedResults: [
      { condition: 'Graph of sin i vs sin r', value: 'straight line through origin', unit: '' },
      { condition: 'Refractive index of glass', value: 1.5, tolerance: 0.1, unit: '' },
    ],
    assessmentCriteria: [
      {
        id: 'crit_ray_tracing',
        name: 'Ray Tracing',
        description: 'Accurate tracing of incident and refracted rays',
        maxMarks: 6,
        rubric: [
          { marks: 6, description: 'All rays traced accurately' },
          { marks: 4, description: 'Most rays traced correctly' },
          { marks: 2, description: 'Poor ray tracing' },
        ],
      },
      {
        id: 'crit_measurements',
        name: 'Angle Measurements',
        description: 'Accurate measurement of angles',
        maxMarks: 6,
        rubric: [
          { marks: 6, description: 'All angles measured accurately' },
          { marks: 4, description: 'Minor measurement errors' },
          { marks: 2, description: 'Significant errors' },
        ],
      },
      {
        id: 'crit_analysis',
        name: 'Graph and Analysis',
        description: 'Correct graph plotting and refractive index calculation',
        maxMarks: 8,
        rubric: [
          { marks: 8, description: 'Perfect graph with correct n value' },
          { marks: 5, description: 'Graph correct but calculation errors' },
          { marks: 2, description: 'Incorrect analysis' },
        ],
      },
    ],
    examTypeId: 'exam_wassce',
    paperTypeId: 'paper_wassce_3',
    waecPastYears: [2018, 2020, 2023],
    isActive: true,
  },

  {
    id: 'exp_lens_formula',
    subjectId: 'subj_wassce_physics',
    topicId: 'topic_wassce_phy_light',
    name: 'Lens Formula - Focal Length of Convex Lens',
    slug: 'lens-formula',
    description:
      'Verify the lens formula (1/f = 1/u + 1/v) and determine the focal length of a convex lens.',
    objectives: [
      'Set up an optical bench correctly',
      'Measure object and image distances for different positions',
      'Plot a graph to determine focal length',
      'Verify the lens formula',
    ],
    difficulty: 'medium',
    estimatedTime: 40,
    simulationType: 'phet',
    phetSimUrl: 'https://phet.colorado.edu/sims/html/geometric-optics/latest/geometric-optics_en.html',
    apparatus: ['app_convex_lens', 'app_lens_holder', 'app_optical_bench', 'app_screen', 'app_illuminated_object', 'app_meter_rule'],
    materials: [],
    safetyNotes: [
      'Handle lenses carefully - they are fragile',
      'Do not touch lens surfaces with fingers',
      'Ensure optical bench is stable',
    ],
    procedure: [
      {
        stepNumber: 1,
        instruction: 'Set up the optical bench with the illuminated object at one end.',
        requiredActions: [
          { actionType: 'drag', targetApparatus: 'app_optical_bench', description: 'Set up optical bench' },
          { actionType: 'drag', targetApparatus: 'app_illuminated_object', description: 'Position object' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 2,
        instruction: 'Mount the convex lens in its holder and place it at a measured distance from the object.',
        requiredActions: [
          { actionType: 'drag', targetApparatus: 'app_convex_lens', description: 'Mount lens' },
          { actionType: 'measure', targetApparatus: 'app_meter_rule', description: 'Measure object distance u' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 3,
        instruction: 'Place the screen on the other side of the lens.',
        requiredActions: [
          { actionType: 'drag', targetApparatus: 'app_screen', description: 'Position screen' },
        ],
        isCheckpoint: false,
        maxMarks: 1,
      },
      {
        stepNumber: 4,
        instruction: 'Move the screen until a sharp image is formed. Record the image distance v.',
        hint: 'The image should be clear and well-defined',
        requiredActions: [
          { actionType: 'adjust', targetApparatus: 'app_screen', description: 'Focus image' },
          { actionType: 'measure', targetApparatus: 'app_meter_rule', description: 'Measure image distance v' },
          { actionType: 'record', targetApparatus: 'app_meter_rule', description: 'Record u and v' },
        ],
        isCheckpoint: true,
        maxMarks: 3,
      },
      {
        stepNumber: 5,
        instruction: 'Repeat for at least 5 different object distances (e.g., 20cm, 25cm, 30cm, 35cm, 40cm).',
        requiredActions: [
          { actionType: 'adjust', targetApparatus: 'app_convex_lens', description: 'Change object distance' },
          { actionType: 'record', targetApparatus: 'app_meter_rule', description: 'Record 5 pairs of u and v' },
        ],
        isCheckpoint: true,
        maxMarks: 5,
      },
      {
        stepNumber: 6,
        instruction: 'Calculate 1/u and 1/v for each reading.',
        requiredActions: [
          { actionType: 'record', targetApparatus: 'app_meter_rule', description: 'Calculate reciprocals' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 7,
        instruction: 'Plot a graph of 1/v against 1/u.',
        requiredActions: [
          { actionType: 'record', targetApparatus: 'app_meter_rule', description: 'Plot graph' },
        ],
        isCheckpoint: true,
        maxMarks: 4,
      },
      {
        stepNumber: 8,
        instruction: 'Determine the focal length f from the intercepts (where 1/u=0, 1/v=1/f).',
        requiredActions: [
          { actionType: 'record', targetApparatus: 'app_meter_rule', description: 'Calculate focal length' },
        ],
        isCheckpoint: true,
        maxMarks: 3,
      },
    ],
    expectedResults: [
      { condition: 'Graph of 1/v vs 1/u', value: 'straight line with negative gradient', unit: '' },
      { condition: 'Focal length f', value: 15, tolerance: 2, unit: 'cm' },
    ],
    assessmentCriteria: [
      {
        id: 'crit_setup',
        name: 'Apparatus Setup',
        description: 'Correct arrangement of optical components',
        maxMarks: 5,
        rubric: [
          { marks: 5, description: 'Perfect alignment and setup' },
          { marks: 3, description: 'Minor alignment issues' },
          { marks: 1, description: 'Poor setup' },
        ],
      },
      {
        id: 'crit_measurements',
        name: 'Distance Measurements',
        description: 'Accurate u and v measurements',
        maxMarks: 7,
        rubric: [
          { marks: 7, description: 'All measurements accurate' },
          { marks: 4, description: 'Some measurement errors' },
          { marks: 2, description: 'Many errors' },
        ],
      },
      {
        id: 'crit_analysis',
        name: 'Analysis',
        description: 'Correct graph and focal length determination',
        maxMarks: 8,
        rubric: [
          { marks: 8, description: 'Perfect analysis with correct f' },
          { marks: 5, description: 'Graph correct but f error' },
          { marks: 2, description: 'Incorrect analysis' },
        ],
      },
    ],
    examTypeId: 'exam_wassce',
    paperTypeId: 'paper_wassce_3',
    waecPastYears: [2019, 2021, 2023],
    isActive: true,
  },

  {
    id: 'exp_principle_of_moments',
    subjectId: 'subj_wassce_physics',
    topicId: 'topic_wassce_phy_mechanics',
    name: 'Principle of Moments - Balancing a Meter Rule',
    slug: 'principle-of-moments',
    description:
      'Verify the principle of moments by balancing a meter rule on a pivot with different masses.',
    objectives: [
      'Balance a meter rule on a knife edge',
      'Apply masses at different positions',
      'Verify that clockwise moments equal anticlockwise moments',
      'Calculate unknown masses using the principle',
    ],
    difficulty: 'easy',
    estimatedTime: 35,
    simulationType: 'phet',
    phetSimUrl: 'https://phet.colorado.edu/sims/html/balancing-act/latest/balancing-act_en.html',
    apparatus: ['app_meter_rule_balance', 'app_knife_edge', 'app_mass_hanger', 'app_slotted_mass'],
    materials: [
      { name: 'Known masses (50g, 100g, 200g)', quantity: 'Set' },
      { name: 'Unknown mass', quantity: '1' },
    ],
    safetyNotes: [
      'Ensure the knife edge is stable',
      'Do not overload one side suddenly',
      'Keep masses organized to avoid confusion',
    ],
    procedure: [
      {
        stepNumber: 1,
        instruction: 'Balance the meter rule on the knife edge at its center of gravity (50cm mark).',
        requiredActions: [
          { actionType: 'drag', targetApparatus: 'app_knife_edge', description: 'Position pivot' },
          { actionType: 'adjust', targetApparatus: 'app_meter_rule_balance', description: 'Balance at 50cm' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 2,
        instruction: 'Hang a 100g mass at the 20cm mark (30cm from pivot).',
        requiredActions: [
          { actionType: 'connect', targetApparatus: 'app_slotted_mass', description: 'Hang 100g at 20cm' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 3,
        instruction: 'Find the position where a 50g mass will balance the rule.',
        hint: 'Use the principle: m1 × d1 = m2 × d2',
        requiredActions: [
          { actionType: 'connect', targetApparatus: 'app_slotted_mass', description: 'Hang 50g mass' },
          { actionType: 'adjust', targetApparatus: 'app_slotted_mass', description: 'Find balance position' },
          { actionType: 'measure', targetApparatus: 'app_meter_rule_balance', description: 'Record position' },
        ],
        isCheckpoint: true,
        maxMarks: 3,
      },
      {
        stepNumber: 4,
        instruction: 'Verify: 100g × 30cm = 50g × d. Calculate d and compare with measured value.',
        requiredActions: [
          { actionType: 'record', targetApparatus: 'app_meter_rule_balance', description: 'Calculate and verify' },
        ],
        isCheckpoint: true,
        maxMarks: 3,
      },
      {
        stepNumber: 5,
        instruction: 'Repeat with different mass combinations (e.g., 200g and 100g, 150g and 75g).',
        requiredActions: [
          { actionType: 'adjust', targetApparatus: 'app_slotted_mass', description: 'Try different masses' },
          { actionType: 'record', targetApparatus: 'app_meter_rule_balance', description: 'Record all results' },
        ],
        isCheckpoint: true,
        maxMarks: 4,
      },
      {
        stepNumber: 6,
        instruction: 'Use an unknown mass. Balance it against a known mass and calculate its value.',
        requiredActions: [
          { actionType: 'connect', targetApparatus: 'app_mass_hanger', description: 'Hang unknown mass' },
          { actionType: 'measure', targetApparatus: 'app_meter_rule_balance', description: 'Find balance point' },
          { actionType: 'record', targetApparatus: 'app_meter_rule_balance', description: 'Calculate unknown mass' },
        ],
        isCheckpoint: true,
        maxMarks: 4,
      },
      {
        stepNumber: 7,
        instruction: 'Verify your calculated unknown mass using a balance.',
        requiredActions: [
          { actionType: 'measure', targetApparatus: 'app_balance', description: 'Weigh unknown mass' },
          { actionType: 'record', targetApparatus: 'app_balance', description: 'Compare values' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
    ],
    expectedResults: [
      { condition: 'Clockwise moment', value: 'equals anticlockwise moment', unit: '' },
      { condition: 'Unknown mass calculation', value: 'within 5% of actual', unit: '' },
    ],
    assessmentCriteria: [
      {
        id: 'crit_balance',
        name: 'Balancing Technique',
        description: 'Ability to achieve equilibrium',
        maxMarks: 5,
        rubric: [
          { marks: 5, description: 'Perfect balance achieved quickly' },
          { marks: 3, description: 'Balance achieved with some difficulty' },
          { marks: 1, description: 'Unable to achieve stable balance' },
        ],
      },
      {
        id: 'crit_measurements',
        name: 'Measurements',
        description: 'Accurate distance and mass measurements',
        maxMarks: 7,
        rubric: [
          { marks: 7, description: 'All measurements accurate' },
          { marks: 4, description: 'Some measurement errors' },
          { marks: 2, description: 'Many errors' },
        ],
      },
      {
        id: 'crit_calculations',
        name: 'Calculations',
        description: 'Correct application of principle of moments',
        maxMarks: 8,
        rubric: [
          { marks: 8, description: 'All calculations correct' },
          { marks: 5, description: 'Minor calculation errors' },
          { marks: 2, description: 'Major errors' },
        ],
      },
    ],
    examTypeId: 'exam_wassce',
    paperTypeId: 'paper_wassce_3',
    waecPastYears: [2018, 2020, 2022],
    isActive: true,
  },

  {
    id: 'exp_specific_heat_capacity',
    subjectId: 'subj_wassce_physics',
    topicId: 'topic_wassce_phy_heat',
    name: 'Specific Heat Capacity by Method of Mixtures',
    slug: 'specific-heat-capacity',
    description:
      'Determine the specific heat capacity of a solid (metal block) using the method of mixtures.',
    objectives: [
      'Heat a metal block to a known temperature',
      'Transfer it to water in a calorimeter',
      'Measure temperature changes accurately',
      'Calculate the specific heat capacity of the metal',
    ],
    difficulty: 'hard',
    estimatedTime: 50,
    simulationType: 'custom',
    apparatus: ['app_calorimeter', 'app_thermometer', 'app_beaker_250', 'app_bunsen_burner', 'app_measuring_cylinder', 'app_balance'],
    materials: [
      { name: 'Metal block (copper or aluminum)', quantity: '1' },
      { name: 'String', quantity: '30cm' },
      { name: 'Distilled water', quantity: '100ml' },
    ],
    safetyNotes: [
      'Handle hot objects with tongs or heat-resistant gloves',
      'Be careful when handling boiling water',
      'Do not touch hot metal blocks directly',
      'Ensure good ventilation when using Bunsen burner',
    ],
    procedure: [
      {
        stepNumber: 1,
        instruction: 'Measure and record the mass of the metal block (m_s).',
        requiredActions: [
          { actionType: 'measure', targetApparatus: 'app_balance', description: 'Weigh metal block' },
          { actionType: 'record', targetApparatus: 'app_balance', description: 'Record mass' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 2,
        instruction: 'Measure and record the mass of the empty calorimeter (m_c).',
        requiredActions: [
          { actionType: 'measure', targetApparatus: 'app_balance', description: 'Weigh calorimeter' },
          { actionType: 'record', targetApparatus: 'app_balance', description: 'Record mass' },
        ],
        isCheckpoint: true,
        maxMarks: 1,
      },
      {
        stepNumber: 3,
        instruction: 'Pour about 100ml of cold water into the calorimeter and measure its mass (to find m_w).',
        requiredActions: [
          { actionType: 'pour', targetApparatus: 'app_calorimeter', description: 'Add water' },
          { actionType: 'measure', targetApparatus: 'app_balance', description: 'Weigh calorimeter + water' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 4,
        instruction: 'Measure and record the initial temperature of the water in the calorimeter (θ_1).',
        requiredActions: [
          { actionType: 'measure', targetApparatus: 'app_thermometer', description: 'Measure water temperature' },
          { actionType: 'record', targetApparatus: 'app_thermometer', description: 'Record θ_1' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 5,
        instruction: 'Tie string to the metal block and suspend it in boiling water for 5 minutes.',
        requiredActions: [
          { actionType: 'heat', targetApparatus: 'app_bunsen_burner', description: 'Heat water to boiling' },
          { actionType: 'adjust', targetApparatus: 'app_beaker_250', description: 'Suspend block in boiling water' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 6,
        instruction: 'Record the temperature of the boiling water (θ_s = temperature of hot metal).',
        requiredActions: [
          { actionType: 'measure', targetApparatus: 'app_thermometer', description: 'Measure boiling point' },
          { actionType: 'record', targetApparatus: 'app_thermometer', description: 'Record θ_s' },
        ],
        isCheckpoint: true,
        maxMarks: 1,
      },
      {
        stepNumber: 7,
        instruction: 'Quickly transfer the hot metal block to the calorimeter. Stir gently.',
        hint: 'Transfer must be quick to minimize heat loss',
        requiredActions: [
          { actionType: 'drag', targetApparatus: 'app_calorimeter', description: 'Transfer metal block' },
        ],
        isCheckpoint: true,
        maxMarks: 3,
      },
      {
        stepNumber: 8,
        instruction: 'Record the maximum temperature reached by the water (θ_2).',
        requiredActions: [
          { actionType: 'observe', targetApparatus: 'app_thermometer', description: 'Watch for max temperature' },
          { actionType: 'record', targetApparatus: 'app_thermometer', description: 'Record θ_2' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 9,
        instruction: 'Calculate the specific heat capacity using: m_s × c_s × (θ_s - θ_2) = (m_w × c_w + m_c × c_c) × (θ_2 - θ_1)',
        requiredActions: [
          { actionType: 'record', targetApparatus: 'app_thermometer', description: 'Calculate specific heat capacity' },
        ],
        isCheckpoint: true,
        maxMarks: 5,
      },
    ],
    expectedResults: [
      { condition: 'Specific heat capacity of copper', value: 400, tolerance: 50, unit: 'J/kg°C' },
      { condition: 'Specific heat capacity of aluminum', value: 900, tolerance: 100, unit: 'J/kg°C' },
    ],
    assessmentCriteria: [
      {
        id: 'crit_measurements',
        name: 'Mass Measurements',
        description: 'Accurate mass measurements',
        maxMarks: 5,
        rubric: [
          { marks: 5, description: 'All masses measured accurately' },
          { marks: 3, description: 'Some measurement errors' },
          { marks: 1, description: 'Poor measurements' },
        ],
      },
      {
        id: 'crit_temperatures',
        name: 'Temperature Measurements',
        description: 'Accurate temperature readings',
        maxMarks: 6,
        rubric: [
          { marks: 6, description: 'All temperatures accurate' },
          { marks: 4, description: 'Minor errors' },
          { marks: 2, description: 'Significant errors' },
        ],
      },
      {
        id: 'crit_technique',
        name: 'Experimental Technique',
        description: 'Quick transfer and proper stirring',
        maxMarks: 4,
        rubric: [
          { marks: 4, description: 'Excellent technique' },
          { marks: 2, description: 'Acceptable technique' },
          { marks: 1, description: 'Poor technique with heat loss' },
        ],
      },
      {
        id: 'crit_calculation',
        name: 'Calculation',
        description: 'Correct application of heat equation',
        maxMarks: 5,
        rubric: [
          { marks: 5, description: 'Calculation correct' },
          { marks: 3, description: 'Minor errors' },
          { marks: 1, description: 'Major errors' },
        ],
      },
    ],
    examTypeId: 'exam_wassce',
    paperTypeId: 'paper_wassce_3',
    waecPastYears: [2017, 2019, 2022],
    isActive: true,
  },

  {
    id: 'exp_resistance_wire_length',
    subjectId: 'subj_wassce_physics',
    topicId: 'topic_wassce_phy_electricity',
    name: 'Resistance and Length of a Wire',
    slug: 'resistance-wire-length',
    description:
      'Investigate how the resistance of a wire varies with its length.',
    objectives: [
      'Set up a circuit with a jockey on resistance wire',
      'Measure resistance for different lengths of wire',
      'Plot a graph of resistance against length',
      'Calculate the resistivity of the wire material',
    ],
    difficulty: 'medium',
    estimatedTime: 40,
    simulationType: 'phet',
    phetSimUrl: 'https://phet.colorado.edu/sims/html/resistance-in-a-wire/latest/resistance-in-a-wire_en.html',
    apparatus: ['app_resistance_wire', 'app_ammeter', 'app_voltmeter', 'app_battery', 'app_jockey', 'app_switch', 'app_meter_rule'],
    materials: [
      { name: 'Connecting wires', quantity: '6' },
    ],
    safetyNotes: [
      'Do not exceed maximum current rating',
      'Switch off circuit when not taking readings',
      'Do not touch the resistance wire when current is flowing',
    ],
    procedure: [
      {
        stepNumber: 1,
        instruction: 'Set up the circuit: battery - switch - ammeter - resistance wire (using jockey) in series.',
        requiredActions: [
          { actionType: 'connect', targetApparatus: 'app_battery', description: 'Start with battery' },
          { actionType: 'connect', targetApparatus: 'app_switch', description: 'Add switch' },
          { actionType: 'connect', targetApparatus: 'app_ammeter', description: 'Add ammeter' },
          { actionType: 'connect', targetApparatus: 'app_resistance_wire', description: 'Connect to wire' },
        ],
        isCheckpoint: true,
        maxMarks: 3,
      },
      {
        stepNumber: 2,
        instruction: 'Connect the voltmeter in parallel across the length of wire being measured.',
        requiredActions: [
          { actionType: 'connect', targetApparatus: 'app_voltmeter', description: 'Connect voltmeter in parallel' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 3,
        instruction: 'Place the jockey at the 20cm mark. Close the switch and record I and V.',
        requiredActions: [
          { actionType: 'adjust', targetApparatus: 'app_jockey', description: 'Set length to 20cm' },
          { actionType: 'measure', targetApparatus: 'app_ammeter', description: 'Read current I' },
          { actionType: 'measure', targetApparatus: 'app_voltmeter', description: 'Read voltage V' },
          { actionType: 'record', targetApparatus: 'app_ammeter', description: 'Record I and V' },
        ],
        isCheckpoint: true,
        maxMarks: 3,
      },
      {
        stepNumber: 4,
        instruction: 'Calculate resistance R = V/I for this length.',
        requiredActions: [
          { actionType: 'record', targetApparatus: 'app_voltmeter', description: 'Calculate R' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 5,
        instruction: 'Repeat for lengths: 30cm, 40cm, 50cm, 60cm, 70cm, 80cm.',
        requiredActions: [
          { actionType: 'adjust', targetApparatus: 'app_jockey', description: 'Change length' },
          { actionType: 'record', targetApparatus: 'app_voltmeter', description: 'Record all I, V, R values' },
        ],
        isCheckpoint: true,
        maxMarks: 6,
      },
      {
        stepNumber: 6,
        instruction: 'Plot a graph of Resistance (R) against Length (L).',
        requiredActions: [
          { actionType: 'record', targetApparatus: 'app_voltmeter', description: 'Plot R vs L graph' },
        ],
        isCheckpoint: true,
        maxMarks: 4,
      },
      {
        stepNumber: 7,
        instruction: 'Calculate the gradient of the graph. This equals ρ/A (resistivity/cross-sectional area).',
        requiredActions: [
          { actionType: 'record', targetApparatus: 'app_voltmeter', description: 'Calculate gradient' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 8,
        instruction: 'If the wire diameter is known, calculate the resistivity ρ = RA/L.',
        requiredActions: [
          { actionType: 'record', targetApparatus: 'app_voltmeter', description: 'Calculate resistivity' },
        ],
        isCheckpoint: true,
        maxMarks: 3,
      },
    ],
    expectedResults: [
      { condition: 'Graph of R vs L', value: 'straight line through origin', unit: '' },
      { condition: 'Resistance proportional to', value: 'length', unit: '' },
      { condition: 'Resistivity of constantan', value: 49e-8, tolerance: 5e-8, unit: 'Ωm' },
    ],
    assessmentCriteria: [
      {
        id: 'crit_circuit',
        name: 'Circuit Setup',
        description: 'Correct circuit connections',
        maxMarks: 5,
        rubric: [
          { marks: 5, description: 'All connections correct' },
          { marks: 3, description: 'Minor errors' },
          { marks: 1, description: 'Significant errors' },
        ],
      },
      {
        id: 'crit_measurements',
        name: 'Measurements',
        description: 'Accurate I and V readings',
        maxMarks: 7,
        rubric: [
          { marks: 7, description: 'All readings accurate' },
          { marks: 4, description: 'Some errors' },
          { marks: 2, description: 'Many errors' },
        ],
      },
      {
        id: 'crit_analysis',
        name: 'Analysis',
        description: 'Correct graph and calculations',
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
    waecPastYears: [2017, 2020, 2023],
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

  // =============== NEW CHEMISTRY EXPERIMENTS ===============
  {
    id: 'exp_electrolysis_brine',
    subjectId: 'subj_wassce_chemistry',
    topicId: 'topic_wassce_chem_electrochemistry',
    name: 'Electrolysis of Brine',
    slug: 'electrolysis-brine',
    description:
      'Electrolyze concentrated sodium chloride solution (brine) and identify the products at each electrode.',
    objectives: [
      'Set up an electrolysis apparatus correctly',
      'Observe and collect gases at each electrode',
      'Test and identify the gases produced',
      'Write electrode equations for the reactions',
    ],
    difficulty: 'medium',
    estimatedTime: 45,
    simulationType: 'custom',
    apparatus: ['app_electrolysis_cell', 'app_carbon_electrodes', 'app_dc_power_supply', 'app_gas_jar', 'app_delivery_tube', 'app_trough'],
    materials: [
      { name: 'Concentrated NaCl solution (brine)', quantity: '200ml' },
      { name: 'Litmus paper (red and blue)', quantity: '4 strips' },
      { name: 'Wooden splint', quantity: '2' },
      { name: 'Universal indicator', quantity: '5ml' },
    ],
    safetyNotes: [
      'Work in a well-ventilated area - chlorine gas is toxic',
      'Do not inhale gases directly',
      'Handle electrodes carefully',
      'Ensure electrical connections are secure before switching on',
    ],
    procedure: [
      {
        stepNumber: 1,
        instruction: 'Set up the electrolysis cell with two carbon electrodes immersed in brine.',
        requiredActions: [
          { actionType: 'drag', targetApparatus: 'app_electrolysis_cell', description: 'Set up cell' },
          { actionType: 'connect', targetApparatus: 'app_carbon_electrodes', description: 'Insert electrodes' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 2,
        instruction: 'Connect the electrodes to the DC power supply (anode to +, cathode to -).',
        requiredActions: [
          { actionType: 'connect', targetApparatus: 'app_dc_power_supply', description: 'Connect power supply' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 3,
        instruction: 'Place inverted gas jars filled with brine over each electrode to collect gases.',
        requiredActions: [
          { actionType: 'drag', targetApparatus: 'app_gas_jar', description: 'Position gas jars' },
          { actionType: 'drag', targetApparatus: 'app_trough', description: 'Set up collection' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 4,
        instruction: 'Switch on the power supply at 6V and observe bubbles at both electrodes.',
        requiredActions: [
          { actionType: 'adjust', targetApparatus: 'app_dc_power_supply', targetValue: 6, description: 'Set voltage to 6V' },
          { actionType: 'observe', targetApparatus: 'app_electrolysis_cell', description: 'Observe bubbling' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 5,
        instruction: 'Allow electrolysis to proceed for 5-10 minutes until sufficient gas is collected.',
        requiredActions: [
          { actionType: 'observe', targetApparatus: 'app_gas_jar', description: 'Monitor gas collection' },
        ],
        isCheckpoint: true,
        maxMarks: 1,
      },
      {
        stepNumber: 6,
        instruction: 'Test the gas at the ANODE: Bring damp blue litmus paper near. Observe bleaching.',
        hint: 'Chlorine gas bleaches damp litmus paper',
        requiredActions: [
          { actionType: 'drag', targetApparatus: 'app_litmus_paper', description: 'Test with litmus' },
          { actionType: 'observe', targetApparatus: 'app_gas_jar', description: 'Record observation' },
        ],
        expectedOutcome: 'Blue litmus turns red then white (bleached) = Chlorine',
        isCheckpoint: true,
        maxMarks: 3,
      },
      {
        stepNumber: 7,
        instruction: 'Test the gas at the CATHODE: Bring a burning splint near the gas.',
        hint: 'Hydrogen burns with a squeaky pop',
        requiredActions: [
          { actionType: 'drag', targetApparatus: 'app_splint', description: 'Bring burning splint' },
          { actionType: 'observe', targetApparatus: 'app_gas_jar', description: 'Record observation' },
        ],
        expectedOutcome: 'Gas burns with squeaky pop = Hydrogen',
        isCheckpoint: true,
        maxMarks: 3,
      },
      {
        stepNumber: 8,
        instruction: 'Test the solution around the cathode with universal indicator.',
        requiredActions: [
          { actionType: 'pour', targetApparatus: 'app_electrolysis_cell', description: 'Add indicator' },
          { actionType: 'observe', targetApparatus: 'app_electrolysis_cell', description: 'Observe colour' },
        ],
        expectedOutcome: 'Solution turns blue/purple = Sodium hydroxide formed',
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 9,
        instruction: 'Write the electrode equations and overall equation for the electrolysis.',
        requiredActions: [
          { actionType: 'record', targetApparatus: 'app_electrolysis_cell', description: 'Write equations' },
        ],
        isCheckpoint: true,
        maxMarks: 3,
      },
    ],
    expectedResults: [
      { condition: 'Gas at anode', value: 'Chlorine (Cl2)', unit: '' },
      { condition: 'Gas at cathode', value: 'Hydrogen (H2)', unit: '' },
      { condition: 'Solution at cathode', value: 'Sodium hydroxide (NaOH)', unit: '' },
    ],
    assessmentCriteria: [
      {
        id: 'crit_setup',
        name: 'Apparatus Setup',
        description: 'Correct assembly of electrolysis apparatus',
        maxMarks: 6,
        rubric: [
          { marks: 6, description: 'Perfect setup with good gas collection' },
          { marks: 4, description: 'Setup correct but minor issues' },
          { marks: 2, description: 'Significant setup errors' },
        ],
      },
      {
        id: 'crit_tests',
        name: 'Gas Tests',
        description: 'Correct identification of products',
        maxMarks: 8,
        rubric: [
          { marks: 8, description: 'All products correctly identified' },
          { marks: 5, description: 'Two products correct' },
          { marks: 2, description: 'One product correct' },
        ],
      },
      {
        id: 'crit_equations',
        name: 'Electrode Equations',
        description: 'Correct ionic equations',
        maxMarks: 6,
        rubric: [
          { marks: 6, description: 'All equations correct' },
          { marks: 4, description: 'Minor errors' },
          { marks: 2, description: 'Major errors' },
        ],
      },
    ],
    examTypeId: 'exam_wassce',
    paperTypeId: 'paper_wassce_3',
    waecPastYears: [2018, 2021, 2023],
    isActive: true,
  },

  {
    id: 'exp_rate_of_reaction',
    subjectId: 'subj_wassce_chemistry',
    topicId: 'topic_wassce_chem_rates',
    name: 'Rate of Reaction - Effect of Concentration',
    slug: 'rate-of-reaction',
    description:
      'Investigate how the concentration of reactants affects the rate of reaction using sodium thiosulfate and hydrochloric acid.',
    objectives: [
      'Set up the reaction apparatus correctly',
      'Measure time for the cross to disappear at different concentrations',
      'Plot a graph of 1/time against concentration',
      'Explain the relationship between concentration and rate',
    ],
    difficulty: 'medium',
    estimatedTime: 40,
    simulationType: 'custom',
    apparatus: ['app_conical_flask', 'app_measuring_cylinder', 'app_stopwatch', 'app_white_tile'],
    materials: [
      { name: 'Sodium thiosulfate solution (0.1M)', quantity: '150ml' },
      { name: 'Dilute hydrochloric acid (2M)', quantity: '50ml' },
      { name: 'Distilled water', quantity: '100ml' },
      { name: 'Paper with X mark', quantity: '1' },
    ],
    safetyNotes: [
      'Work in a well-ventilated area - sulfur dioxide is produced',
      'Handle acids with care',
      'Wash hands after experiment',
    ],
    procedure: [
      {
        stepNumber: 1,
        instruction: 'Draw a black cross (X) on white paper and place it under the conical flask.',
        requiredActions: [
          { actionType: 'drag', targetApparatus: 'app_white_tile', description: 'Position paper with X' },
          { actionType: 'drag', targetApparatus: 'app_conical_flask', description: 'Place flask on X' },
        ],
        isCheckpoint: true,
        maxMarks: 1,
      },
      {
        stepNumber: 2,
        instruction: 'Measure 50ml of sodium thiosulfate solution into the flask.',
        requiredActions: [
          { actionType: 'measure', targetApparatus: 'app_measuring_cylinder', description: 'Measure 50ml Na2S2O3' },
          { actionType: 'pour', targetApparatus: 'app_conical_flask', description: 'Add to flask' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 3,
        instruction: 'Add 5ml of dilute HCl, start the stopwatch immediately, and swirl.',
        requiredActions: [
          { actionType: 'pour', targetApparatus: 'app_conical_flask', description: 'Add HCl' },
          { actionType: 'measure', targetApparatus: 'app_stopwatch', description: 'Start timing' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 4,
        instruction: 'Look down through the solution. Stop timing when the X is no longer visible.',
        hint: 'The sulfur precipitate makes the solution cloudy',
        requiredActions: [
          { actionType: 'observe', targetApparatus: 'app_conical_flask', description: 'Watch for X to disappear' },
          { actionType: 'record', targetApparatus: 'app_stopwatch', description: 'Record time' },
        ],
        isCheckpoint: true,
        maxMarks: 3,
      },
      {
        stepNumber: 5,
        instruction: 'Repeat with different volumes of thiosulfate: 40ml+10ml water, 30ml+20ml water, 20ml+30ml water, 10ml+40ml water.',
        requiredActions: [
          { actionType: 'measure', targetApparatus: 'app_measuring_cylinder', description: 'Prepare dilutions' },
          { actionType: 'record', targetApparatus: 'app_stopwatch', description: 'Record all times' },
        ],
        isCheckpoint: true,
        maxMarks: 5,
      },
      {
        stepNumber: 6,
        instruction: 'Calculate 1/time for each concentration (this represents relative rate).',
        requiredActions: [
          { actionType: 'record', targetApparatus: 'app_stopwatch', description: 'Calculate 1/t values' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 7,
        instruction: 'Plot a graph of 1/time (rate) against concentration of thiosulfate.',
        requiredActions: [
          { actionType: 'record', targetApparatus: 'app_stopwatch', description: 'Plot graph' },
        ],
        isCheckpoint: true,
        maxMarks: 4,
      },
      {
        stepNumber: 8,
        instruction: 'State the relationship between concentration and rate of reaction.',
        requiredActions: [
          { actionType: 'record', targetApparatus: 'app_stopwatch', description: 'State conclusion' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
    ],
    expectedResults: [
      { condition: 'Graph shape', value: 'straight line through origin', unit: '' },
      { condition: 'Relationship', value: 'Rate is directly proportional to concentration', unit: '' },
    ],
    assessmentCriteria: [
      {
        id: 'crit_technique',
        name: 'Experimental Technique',
        description: 'Consistent timing and measurement',
        maxMarks: 6,
        rubric: [
          { marks: 6, description: 'Excellent technique throughout' },
          { marks: 4, description: 'Good technique with minor issues' },
          { marks: 2, description: 'Poor technique' },
        ],
      },
      {
        id: 'crit_data',
        name: 'Data Collection',
        description: 'Accurate time measurements',
        maxMarks: 6,
        rubric: [
          { marks: 6, description: 'All measurements accurate' },
          { marks: 4, description: 'Some errors' },
          { marks: 2, description: 'Many errors' },
        ],
      },
      {
        id: 'crit_analysis',
        name: 'Analysis',
        description: 'Correct graph and conclusion',
        maxMarks: 8,
        rubric: [
          { marks: 8, description: 'Perfect graph with correct conclusion' },
          { marks: 5, description: 'Graph correct but conclusion incomplete' },
          { marks: 2, description: 'Incorrect analysis' },
        ],
      },
    ],
    examTypeId: 'exam_wassce',
    paperTypeId: 'paper_wassce_3',
    waecPastYears: [2019, 2021, 2023],
    isActive: true,
  },

  {
    id: 'exp_crystal_preparation',
    subjectId: 'subj_wassce_chemistry',
    topicId: 'topic_wassce_chem_salts',
    name: 'Preparation of Crystals - Copper Sulfate',
    slug: 'crystal-preparation',
    description:
      'Prepare pure crystals of copper(II) sulfate by crystallization from a saturated solution.',
    objectives: [
      'Prepare a saturated solution of copper sulfate',
      'Evaporate the solution to the crystallization point',
      'Obtain and dry pure crystals',
      'Describe the properties of the crystals formed',
    ],
    difficulty: 'easy',
    estimatedTime: 45,
    simulationType: 'custom',
    apparatus: ['app_beaker_250', 'app_evaporating_dish', 'app_bunsen_burner', 'app_tripod_stand', 'app_wire_gauze', 'app_thermometer'],
    materials: [
      { name: 'Copper(II) sulfate powder', quantity: '30g' },
      { name: 'Distilled water', quantity: '100ml' },
      { name: 'Filter paper', quantity: '2' },
      { name: 'Glass rod', quantity: '1' },
    ],
    safetyNotes: [
      'Copper sulfate is harmful if swallowed',
      'Wash hands thoroughly after handling',
      'Be careful when heating - hot solution can splash',
      'Use tongs to handle hot apparatus',
    ],
    procedure: [
      {
        stepNumber: 1,
        instruction: 'Pour 50ml of distilled water into the beaker and heat to about 60°C.',
        requiredActions: [
          { actionType: 'pour', targetApparatus: 'app_beaker_250', description: 'Add water' },
          { actionType: 'heat', targetApparatus: 'app_bunsen_burner', description: 'Heat water' },
          { actionType: 'measure', targetApparatus: 'app_thermometer', description: 'Check temperature' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 2,
        instruction: 'Add copper sulfate powder gradually while stirring until no more dissolves (saturated).',
        hint: 'A saturated solution has excess solid at the bottom',
        requiredActions: [
          { actionType: 'pour', targetApparatus: 'app_beaker_250', description: 'Add copper sulfate' },
          { actionType: 'observe', targetApparatus: 'app_beaker_250', description: 'Stir until saturated' },
        ],
        isCheckpoint: true,
        maxMarks: 3,
      },
      {
        stepNumber: 3,
        instruction: 'Filter the hot saturated solution into the evaporating dish to remove undissolved solid.',
        requiredActions: [
          { actionType: 'pour', targetApparatus: 'app_evaporating_dish', description: 'Filter solution' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 4,
        instruction: 'Gently heat the solution in the evaporating dish until it is about half the original volume.',
        requiredActions: [
          { actionType: 'heat', targetApparatus: 'app_bunsen_burner', description: 'Evaporate solution' },
          { actionType: 'observe', targetApparatus: 'app_evaporating_dish', description: 'Monitor volume' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 5,
        instruction: 'Test for saturation: dip a glass rod in solution and cool - crystals should form on the rod.',
        requiredActions: [
          { actionType: 'observe', targetApparatus: 'app_evaporating_dish', description: 'Test saturation point' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 6,
        instruction: 'Remove from heat and allow the solution to cool slowly undisturbed.',
        hint: 'Slow cooling produces larger, more regular crystals',
        requiredActions: [
          { actionType: 'observe', targetApparatus: 'app_evaporating_dish', description: 'Cool slowly' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 7,
        instruction: 'Observe the blue crystals forming as the solution cools.',
        requiredActions: [
          { actionType: 'observe', targetApparatus: 'app_evaporating_dish', description: 'Watch crystal formation' },
          { actionType: 'record', targetApparatus: 'app_evaporating_dish', description: 'Describe crystals' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 8,
        instruction: 'Filter the crystals, wash with a little cold distilled water, and dry between filter papers.',
        requiredActions: [
          { actionType: 'pour', targetApparatus: 'app_evaporating_dish', description: 'Filter and dry crystals' },
        ],
        isCheckpoint: true,
        maxMarks: 3,
      },
      {
        stepNumber: 9,
        instruction: 'Describe the properties of your crystals: colour, shape, transparency.',
        requiredActions: [
          { actionType: 'record', targetApparatus: 'app_evaporating_dish', description: 'Record properties' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
    ],
    expectedResults: [
      { condition: 'Crystal colour', value: 'Blue', unit: '' },
      { condition: 'Crystal shape', value: 'Triclinic (rhombic)', unit: '' },
      { condition: 'Crystal state', value: 'Hydrated (CuSO4.5H2O)', unit: '' },
    ],
    assessmentCriteria: [
      {
        id: 'crit_technique',
        name: 'Crystallization Technique',
        description: 'Correct procedure for crystal preparation',
        maxMarks: 8,
        rubric: [
          { marks: 8, description: 'Perfect technique with good crystals' },
          { marks: 5, description: 'Good technique, small crystals' },
          { marks: 2, description: 'Poor technique' },
        ],
      },
      {
        id: 'crit_product',
        name: 'Product Quality',
        description: 'Quality and purity of crystals obtained',
        maxMarks: 6,
        rubric: [
          { marks: 6, description: 'Large, pure, well-formed crystals' },
          { marks: 4, description: 'Small but pure crystals' },
          { marks: 2, description: 'Impure or poorly formed crystals' },
        ],
      },
      {
        id: 'crit_observations',
        name: 'Observations',
        description: 'Accurate description of crystal properties',
        maxMarks: 6,
        rubric: [
          { marks: 6, description: 'Complete and accurate description' },
          { marks: 4, description: 'Mostly correct' },
          { marks: 2, description: 'Incomplete or incorrect' },
        ],
      },
    ],
    examTypeId: 'exam_wassce',
    paperTypeId: 'paper_wassce_3',
    waecPastYears: [2018, 2020, 2022],
    isActive: true,
  },

  {
    id: 'exp_gas_tests',
    subjectId: 'subj_wassce_chemistry',
    topicId: 'topic_wassce_chem_gases',
    name: 'Gas Tests Laboratory',
    slug: 'gas-tests',
    description:
      'Learn to identify common gases (hydrogen, oxygen, carbon dioxide, ammonia, chlorine) using characteristic tests.',
    objectives: [
      'Perform the pop test for hydrogen',
      'Perform the glowing splint test for oxygen',
      'Perform the lime water test for carbon dioxide',
      'Test for ammonia and chlorine using appropriate methods',
    ],
    difficulty: 'medium',
    estimatedTime: 50,
    simulationType: 'custom',
    apparatus: ['app_test_tube', 'app_test_tube_rack', 'app_delivery_tube', 'app_gas_jar', 'app_bunsen_burner', 'app_splint'],
    materials: [
      { name: 'Zinc granules', quantity: '5g' },
      { name: 'Dilute HCl', quantity: '20ml' },
      { name: 'Hydrogen peroxide', quantity: '20ml' },
      { name: 'Manganese dioxide', quantity: '2g' },
      { name: 'Calcium carbonate (marble chips)', quantity: '10g' },
      { name: 'Lime water', quantity: '50ml' },
      { name: 'Ammonium chloride', quantity: '5g' },
      { name: 'Sodium hydroxide solution', quantity: '10ml' },
      { name: 'Red and blue litmus paper', quantity: '4 strips' },
    ],
    safetyNotes: [
      'Work in a well-ventilated area',
      'Hydrogen is flammable - keep away from flames until testing',
      'Do not inhale ammonia or chlorine directly',
      'Handle acids and bases with care',
    ],
    procedure: [
      {
        stepNumber: 1,
        instruction: 'TEST FOR HYDROGEN: Add zinc granules to dilute HCl in a test tube. Collect gas.',
        requiredActions: [
          { actionType: 'pour', targetApparatus: 'app_test_tube', description: 'Add zinc and HCl' },
          { actionType: 'observe', targetApparatus: 'app_test_tube', description: 'Collect gas' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 2,
        instruction: 'Bring a burning splint to the mouth of the tube. Listen for the sound.',
        requiredActions: [
          { actionType: 'drag', targetApparatus: 'app_splint', description: 'Apply burning splint' },
          { actionType: 'observe', targetApparatus: 'app_test_tube', description: 'Listen for pop' },
          { actionType: 'record', targetApparatus: 'app_test_tube', description: 'Record observation' },
        ],
        expectedOutcome: 'Squeaky pop = Hydrogen confirmed',
        isCheckpoint: true,
        maxMarks: 3,
      },
      {
        stepNumber: 3,
        instruction: 'TEST FOR OXYGEN: Add MnO2 to hydrogen peroxide. Collect the gas produced.',
        requiredActions: [
          { actionType: 'pour', targetApparatus: 'app_test_tube', description: 'Add H2O2 and MnO2' },
          { actionType: 'observe', targetApparatus: 'app_gas_jar', description: 'Collect oxygen' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 4,
        instruction: 'Insert a glowing (not burning) splint into the gas jar.',
        hint: 'Blow out the flame but keep the splint glowing',
        requiredActions: [
          { actionType: 'drag', targetApparatus: 'app_splint', description: 'Insert glowing splint' },
          { actionType: 'observe', targetApparatus: 'app_gas_jar', description: 'Watch splint' },
          { actionType: 'record', targetApparatus: 'app_gas_jar', description: 'Record observation' },
        ],
        expectedOutcome: 'Splint relights = Oxygen confirmed',
        isCheckpoint: true,
        maxMarks: 3,
      },
      {
        stepNumber: 5,
        instruction: 'TEST FOR CO2: Add dilute HCl to marble chips. Pass the gas through lime water.',
        requiredActions: [
          { actionType: 'pour', targetApparatus: 'app_test_tube', description: 'React acid with carbonate' },
          { actionType: 'connect', targetApparatus: 'app_delivery_tube', description: 'Pass through lime water' },
          { actionType: 'observe', targetApparatus: 'app_test_tube', description: 'Watch lime water' },
        ],
        expectedOutcome: 'Lime water turns milky = CO2 confirmed',
        isCheckpoint: true,
        maxMarks: 3,
      },
      {
        stepNumber: 6,
        instruction: 'Record what happens if excess CO2 is passed through.',
        requiredActions: [
          { actionType: 'observe', targetApparatus: 'app_test_tube', description: 'Continue passing CO2' },
          { actionType: 'record', targetApparatus: 'app_test_tube', description: 'Record observation' },
        ],
        expectedOutcome: 'Milkiness disappears (calcium bicarbonate forms)',
        isCheckpoint: false,
        maxMarks: 2,
      },
      {
        stepNumber: 7,
        instruction: 'TEST FOR AMMONIA: Heat ammonium chloride with NaOH solution gently.',
        requiredActions: [
          { actionType: 'pour', targetApparatus: 'app_test_tube', description: 'Add NH4Cl and NaOH' },
          { actionType: 'heat', targetApparatus: 'app_bunsen_burner', description: 'Heat gently' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 8,
        instruction: 'Hold damp red litmus paper at the mouth of the tube.',
        requiredActions: [
          { actionType: 'drag', targetApparatus: 'app_litmus_paper', description: 'Hold litmus paper' },
          { actionType: 'observe', targetApparatus: 'app_test_tube', description: 'Watch colour change' },
          { actionType: 'record', targetApparatus: 'app_test_tube', description: 'Record observation' },
        ],
        expectedOutcome: 'Red litmus turns blue, pungent smell = Ammonia confirmed',
        isCheckpoint: true,
        maxMarks: 3,
      },
      {
        stepNumber: 9,
        instruction: 'Complete a summary table of all gas tests with observations and conclusions.',
        requiredActions: [
          { actionType: 'record', targetApparatus: 'app_test_tube', description: 'Complete summary table' },
        ],
        isCheckpoint: true,
        maxMarks: 4,
      },
    ],
    expectedResults: [
      { condition: 'Hydrogen test', value: 'Burns with squeaky pop', unit: '' },
      { condition: 'Oxygen test', value: 'Relights glowing splint', unit: '' },
      { condition: 'Carbon dioxide test', value: 'Turns lime water milky', unit: '' },
      { condition: 'Ammonia test', value: 'Turns red litmus blue, pungent smell', unit: '' },
    ],
    assessmentCriteria: [
      {
        id: 'crit_gas_prep',
        name: 'Gas Preparation',
        description: 'Correct preparation of each gas',
        maxMarks: 8,
        rubric: [
          { marks: 8, description: 'All gases prepared correctly' },
          { marks: 5, description: 'Most gases prepared correctly' },
          { marks: 2, description: 'Few gases prepared correctly' },
        ],
      },
      {
        id: 'crit_tests',
        name: 'Test Execution',
        description: 'Correct testing procedure for each gas',
        maxMarks: 8,
        rubric: [
          { marks: 8, description: 'All tests performed correctly' },
          { marks: 5, description: 'Most tests correct' },
          { marks: 2, description: 'Few tests correct' },
        ],
      },
      {
        id: 'crit_identification',
        name: 'Identification',
        description: 'Correct identification of all gases',
        maxMarks: 4,
        rubric: [
          { marks: 4, description: 'All gases correctly identified' },
          { marks: 2, description: 'Some gases identified' },
          { marks: 1, description: 'Few gases identified' },
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

  // =============== NEW BIOLOGY EXPERIMENTS ===============
  {
    id: 'exp_osmosis',
    subjectId: 'subj_wassce_biology',
    topicId: 'topic_wassce_bio_transport',
    name: 'Osmosis in Living Cells',
    slug: 'osmosis-cells',
    description:
      'Investigate osmosis using potato strips in solutions of different concentrations. Observe plasmolysis in onion cells.',
    objectives: [
      'Prepare potato strips of uniform size',
      'Place strips in solutions of different concentrations',
      'Measure changes in mass or length',
      'Observe plasmolysis in onion epidermal cells under microscope',
    ],
    difficulty: 'medium',
    estimatedTime: 50,
    simulationType: 'custom',
    apparatus: ['app_petri_dish', 'app_scalpel', 'app_balance', 'app_measuring_cylinder', 'app_microscope', 'app_cover_slip'],
    materials: [
      { name: 'Fresh potato', quantity: '1 large' },
      { name: 'Sucrose solutions (0M, 0.2M, 0.4M, 0.6M, 0.8M, 1M)', quantity: '50ml each' },
      { name: 'Onion (red preferred)', quantity: '1' },
      { name: 'Distilled water', quantity: '100ml' },
      { name: 'Concentrated salt solution', quantity: '50ml' },
    ],
    safetyNotes: [
      'Handle scalpel carefully - always cut away from yourself',
      'Wash hands after handling biological materials',
      'Handle microscope slides carefully - they can break',
    ],
    procedure: [
      {
        stepNumber: 1,
        instruction: 'Cut 6 potato strips of equal size (approximately 5cm × 1cm × 1cm).',
        requiredActions: [
          { actionType: 'drag', targetApparatus: 'app_scalpel', description: 'Cut potato strips' },
          { actionType: 'measure', targetApparatus: 'app_meter_rule', description: 'Ensure equal sizes' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 2,
        instruction: 'Weigh each potato strip and record its initial mass.',
        requiredActions: [
          { actionType: 'measure', targetApparatus: 'app_balance', description: 'Weigh strips' },
          { actionType: 'record', targetApparatus: 'app_balance', description: 'Record initial masses' },
        ],
        isCheckpoint: true,
        maxMarks: 3,
      },
      {
        stepNumber: 3,
        instruction: 'Place each strip in a different concentration of sucrose solution (0M to 1M).',
        requiredActions: [
          { actionType: 'drag', targetApparatus: 'app_petri_dish', description: 'Place strips in solutions' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 4,
        instruction: 'Leave for 30 minutes, then remove strips, blot dry, and reweigh.',
        requiredActions: [
          { actionType: 'observe', targetApparatus: 'app_petri_dish', description: 'Wait 30 minutes' },
          { actionType: 'measure', targetApparatus: 'app_balance', description: 'Measure final mass' },
          { actionType: 'record', targetApparatus: 'app_balance', description: 'Record final masses' },
        ],
        isCheckpoint: true,
        maxMarks: 3,
      },
      {
        stepNumber: 5,
        instruction: 'Calculate percentage change in mass for each strip: ((final - initial) / initial) × 100.',
        requiredActions: [
          { actionType: 'record', targetApparatus: 'app_balance', description: 'Calculate % change' },
        ],
        isCheckpoint: true,
        maxMarks: 3,
      },
      {
        stepNumber: 6,
        instruction: 'Plot a graph of percentage change in mass against sucrose concentration.',
        requiredActions: [
          { actionType: 'record', targetApparatus: 'app_balance', description: 'Plot graph' },
        ],
        isCheckpoint: true,
        maxMarks: 4,
      },
      {
        stepNumber: 7,
        instruction: 'PLASMOLYSIS: Peel a thin layer of onion epidermis and mount in distilled water.',
        requiredActions: [
          { actionType: 'drag', targetApparatus: 'app_scalpel', description: 'Peel onion epidermis' },
          { actionType: 'drag', targetApparatus: 'app_cover_slip', description: 'Mount on slide' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 8,
        instruction: 'Observe cells under microscope. Sketch a turgid cell.',
        requiredActions: [
          { actionType: 'observe', targetApparatus: 'app_microscope', description: 'View turgid cells' },
          { actionType: 'record', targetApparatus: 'app_microscope', description: 'Draw turgid cell' },
        ],
        isCheckpoint: true,
        maxMarks: 3,
      },
      {
        stepNumber: 9,
        instruction: 'Add concentrated salt solution to the slide edge. Watch for plasmolysis.',
        hint: 'The cell membrane pulls away from the cell wall',
        requiredActions: [
          { actionType: 'pour', targetApparatus: 'app_cover_slip', description: 'Add salt solution' },
          { actionType: 'observe', targetApparatus: 'app_microscope', description: 'Watch for plasmolysis' },
        ],
        isCheckpoint: true,
        maxMarks: 3,
      },
      {
        stepNumber: 10,
        instruction: 'Sketch a plasmolysed cell. Label the cell wall, cell membrane, and shrunken cytoplasm.',
        requiredActions: [
          { actionType: 'record', targetApparatus: 'app_microscope', description: 'Draw plasmolysed cell' },
        ],
        isCheckpoint: true,
        maxMarks: 3,
      },
    ],
    expectedResults: [
      { condition: 'In hypotonic solution (water)', value: 'Mass increases (cells gain water)', unit: '' },
      { condition: 'In hypertonic solution', value: 'Mass decreases (cells lose water)', unit: '' },
      { condition: 'Isotonic point', value: 'Approximately 0.4-0.5M sucrose', unit: '' },
      { condition: 'Plasmolysis', value: 'Cell membrane shrinks away from cell wall', unit: '' },
    ],
    assessmentCriteria: [
      {
        id: 'crit_preparation',
        name: 'Sample Preparation',
        description: 'Uniform potato strips, accurate weighing',
        maxMarks: 5,
        rubric: [
          { marks: 5, description: 'Perfect uniform strips, accurate weighing' },
          { marks: 3, description: 'Acceptable preparation' },
          { marks: 1, description: 'Poor preparation' },
        ],
      },
      {
        id: 'crit_data',
        name: 'Data Collection',
        description: 'Accurate measurements and calculations',
        maxMarks: 7,
        rubric: [
          { marks: 7, description: 'All measurements accurate' },
          { marks: 4, description: 'Some errors' },
          { marks: 2, description: 'Many errors' },
        ],
      },
      {
        id: 'crit_microscopy',
        name: 'Microscopy Skills',
        description: 'Clear observation and drawing of cells',
        maxMarks: 8,
        rubric: [
          { marks: 8, description: 'Clear observations with labeled diagrams' },
          { marks: 5, description: 'Acceptable observations' },
          { marks: 2, description: 'Poor microscopy skills' },
        ],
      },
    ],
    examTypeId: 'exam_wassce',
    paperTypeId: 'paper_wassce_3',
    waecPastYears: [2018, 2020, 2022],
    isActive: true,
  },

  {
    id: 'exp_photosynthesis',
    subjectId: 'subj_wassce_biology',
    topicId: 'topic_wassce_bio_nutrition',
    name: 'Photosynthesis Investigation',
    slug: 'photosynthesis',
    description:
      'Test leaves for starch to prove photosynthesis occurs. Demonstrate that light and chlorophyll are necessary.',
    objectives: [
      'Destarch a plant correctly',
      'Expose leaves to different conditions',
      'Test leaves for starch using iodine',
      'Conclude which factors are needed for photosynthesis',
    ],
    difficulty: 'medium',
    estimatedTime: 55,
    simulationType: 'custom',
    apparatus: ['app_beaker_250', 'app_test_tube', 'app_bunsen_burner', 'app_tripod_stand', 'app_forceps'],
    materials: [
      { name: 'Potted plant (destarched for 48 hours)', quantity: '1' },
      { name: 'Variegated leaf plant', quantity: '1' },
      { name: 'Ethanol', quantity: '100ml' },
      { name: 'Iodine solution', quantity: '20ml' },
      { name: 'Aluminum foil', quantity: '1 sheet' },
      { name: 'White tile', quantity: '1' },
    ],
    safetyNotes: [
      'Ethanol is flammable - do not heat directly over flame',
      'Use water bath to heat ethanol',
      'Handle hot apparatus with care',
      'Ensure good ventilation',
    ],
    procedure: [
      {
        stepNumber: 1,
        instruction: 'Cover part of a leaf with aluminum foil (to block light). Leave plant in bright light for 6 hours.',
        requiredActions: [
          { actionType: 'drag', targetApparatus: 'app_petri_dish', description: 'Cover part of leaf' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 2,
        instruction: 'After exposure, remove the leaf and the foil. Note which parts were covered.',
        requiredActions: [
          { actionType: 'drag', targetApparatus: 'app_forceps', description: 'Remove leaf' },
          { actionType: 'record', targetApparatus: 'app_forceps', description: 'Note covered regions' },
        ],
        isCheckpoint: true,
        maxMarks: 1,
      },
      {
        stepNumber: 3,
        instruction: 'Boil the leaf in water for 1-2 minutes to kill cells and stop reactions.',
        requiredActions: [
          { actionType: 'heat', targetApparatus: 'app_bunsen_burner', description: 'Boil water' },
          { actionType: 'drag', targetApparatus: 'app_beaker_250', description: 'Boil leaf' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 4,
        instruction: 'Transfer leaf to hot ethanol (in water bath) to remove chlorophyll.',
        hint: 'NEVER heat ethanol directly - use water bath!',
        requiredActions: [
          { actionType: 'drag', targetApparatus: 'app_test_tube', description: 'Place in ethanol' },
          { actionType: 'observe', targetApparatus: 'app_test_tube', description: 'Watch decolorization' },
        ],
        isCheckpoint: true,
        maxMarks: 3,
      },
      {
        stepNumber: 5,
        instruction: 'Rinse the leaf in warm water to soften it, then spread on white tile.',
        requiredActions: [
          { actionType: 'pour', targetApparatus: 'app_beaker_250', description: 'Rinse leaf' },
          { actionType: 'drag', targetApparatus: 'app_petri_dish', description: 'Spread on tile' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 6,
        instruction: 'Add iodine solution to the leaf. Observe colour changes in different areas.',
        requiredActions: [
          { actionType: 'pour', targetApparatus: 'app_petri_dish', description: 'Add iodine' },
          { actionType: 'observe', targetApparatus: 'app_petri_dish', description: 'Observe colours' },
        ],
        isCheckpoint: true,
        maxMarks: 3,
      },
      {
        stepNumber: 7,
        instruction: 'Record: Blue-black = starch present. Brown/yellow = no starch.',
        requiredActions: [
          { actionType: 'record', targetApparatus: 'app_petri_dish', description: 'Record observations' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 8,
        instruction: 'TEST FOR CHLOROPHYLL: Repeat test with a variegated leaf (green and white areas).',
        requiredActions: [
          { actionType: 'drag', targetApparatus: 'app_forceps', description: 'Use variegated leaf' },
          { actionType: 'observe', targetApparatus: 'app_petri_dish', description: 'Compare green vs white areas' },
        ],
        isCheckpoint: true,
        maxMarks: 3,
      },
      {
        stepNumber: 9,
        instruction: 'Draw and label diagrams showing which parts tested positive for starch.',
        requiredActions: [
          { actionType: 'record', targetApparatus: 'app_petri_dish', description: 'Draw diagrams' },
        ],
        isCheckpoint: true,
        maxMarks: 3,
      },
      {
        stepNumber: 10,
        instruction: 'Write conclusions about which factors are needed for photosynthesis.',
        requiredActions: [
          { actionType: 'record', targetApparatus: 'app_petri_dish', description: 'Write conclusions' },
        ],
        isCheckpoint: true,
        maxMarks: 3,
      },
    ],
    expectedResults: [
      { condition: 'Exposed to light', value: 'Blue-black (starch present)', unit: '' },
      { condition: 'Covered (no light)', value: 'Brown/yellow (no starch)', unit: '' },
      { condition: 'Green areas', value: 'Blue-black (photosynthesis occurred)', unit: '' },
      { condition: 'White areas (no chlorophyll)', value: 'Brown/yellow (no starch)', unit: '' },
    ],
    assessmentCriteria: [
      {
        id: 'crit_technique',
        name: 'Decolorization Technique',
        description: 'Safe and correct leaf decolorization',
        maxMarks: 6,
        rubric: [
          { marks: 6, description: 'Perfect technique with safety' },
          { marks: 4, description: 'Acceptable technique' },
          { marks: 2, description: 'Poor technique or safety issues' },
        ],
      },
      {
        id: 'crit_observations',
        name: 'Observations',
        description: 'Clear observations of colour changes',
        maxMarks: 6,
        rubric: [
          { marks: 6, description: 'All observations correct' },
          { marks: 4, description: 'Most correct' },
          { marks: 2, description: 'Few correct' },
        ],
      },
      {
        id: 'crit_conclusions',
        name: 'Conclusions',
        description: 'Valid conclusions about photosynthesis requirements',
        maxMarks: 8,
        rubric: [
          { marks: 8, description: 'Complete correct conclusions' },
          { marks: 5, description: 'Partially correct' },
          { marks: 2, description: 'Incorrect conclusions' },
        ],
      },
    ],
    examTypeId: 'exam_wassce',
    paperTypeId: 'paper_wassce_3',
    waecPastYears: [2017, 2019, 2021],
    isActive: true,
  },

  {
    id: 'exp_enzyme_activity',
    subjectId: 'subj_wassce_biology',
    topicId: 'topic_wassce_bio_enzymes',
    name: 'Enzyme Activity - Effect of Temperature',
    slug: 'enzyme-activity',
    description:
      'Investigate how temperature affects the rate of enzyme activity using amylase and starch.',
    objectives: [
      'Prepare starch-amylase mixtures at different temperatures',
      'Test for starch breakdown at regular intervals',
      'Determine the optimum temperature for amylase',
      'Explain denaturation at high temperatures',
    ],
    difficulty: 'hard',
    estimatedTime: 50,
    simulationType: 'custom',
    apparatus: ['app_test_tube', 'app_test_tube_rack', 'app_water_bath', 'app_thermometer', 'app_stopwatch', 'app_boiling_tube'],
    materials: [
      { name: 'Starch solution (1%)', quantity: '50ml' },
      { name: 'Amylase solution', quantity: '20ml' },
      { name: 'Iodine solution', quantity: '20ml' },
      { name: 'Spotting tile', quantity: '1' },
      { name: 'Distilled water', quantity: '100ml' },
    ],
    safetyNotes: [
      'Handle hot water baths carefully',
      'Do not pipette by mouth',
      'Wash hands after handling enzyme solutions',
    ],
    procedure: [
      {
        stepNumber: 1,
        instruction: 'Set up water baths at temperatures: 20°C, 37°C, 50°C, 60°C, 80°C.',
        requiredActions: [
          { actionType: 'adjust', targetApparatus: 'app_water_bath', description: 'Set temperatures' },
          { actionType: 'measure', targetApparatus: 'app_thermometer', description: 'Verify temperatures' },
        ],
        isCheckpoint: true,
        maxMarks: 3,
      },
      {
        stepNumber: 2,
        instruction: 'Place drops of iodine solution in rows on a spotting tile.',
        requiredActions: [
          { actionType: 'pour', targetApparatus: 'app_petri_dish', description: 'Prepare iodine spots' },
        ],
        isCheckpoint: true,
        maxMarks: 1,
      },
      {
        stepNumber: 3,
        instruction: 'Add 5ml starch and 1ml amylase to a test tube. Place in 20°C water bath.',
        requiredActions: [
          { actionType: 'pour', targetApparatus: 'app_test_tube', description: 'Mix starch and amylase' },
          { actionType: 'drag', targetApparatus: 'app_water_bath', description: 'Place in water bath' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 4,
        instruction: 'Start the stopwatch. Every 30 seconds, take a drop and test with iodine.',
        requiredActions: [
          { actionType: 'measure', targetApparatus: 'app_stopwatch', description: 'Start timing' },
          { actionType: 'observe', targetApparatus: 'app_test_tube', description: 'Test with iodine' },
        ],
        isCheckpoint: true,
        maxMarks: 3,
      },
      {
        stepNumber: 5,
        instruction: 'Record time when iodine no longer turns blue-black (starch digested).',
        requiredActions: [
          { actionType: 'record', targetApparatus: 'app_stopwatch', description: 'Record digestion time' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 6,
        instruction: 'Repeat steps 3-5 for each temperature (37°C, 50°C, 60°C, 80°C).',
        requiredActions: [
          { actionType: 'pour', targetApparatus: 'app_test_tube', description: 'Repeat at each temperature' },
          { actionType: 'record', targetApparatus: 'app_stopwatch', description: 'Record all times' },
        ],
        isCheckpoint: true,
        maxMarks: 5,
      },
      {
        stepNumber: 7,
        instruction: 'Calculate rate of reaction (1/time) for each temperature.',
        requiredActions: [
          { actionType: 'record', targetApparatus: 'app_stopwatch', description: 'Calculate rates' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 8,
        instruction: 'Plot a graph of rate of reaction against temperature.',
        requiredActions: [
          { actionType: 'record', targetApparatus: 'app_stopwatch', description: 'Plot graph' },
        ],
        isCheckpoint: true,
        maxMarks: 4,
      },
      {
        stepNumber: 9,
        instruction: 'Identify the optimum temperature from your graph.',
        requiredActions: [
          { actionType: 'record', targetApparatus: 'app_stopwatch', description: 'Identify optimum' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 10,
        instruction: 'Explain why enzyme activity decreases at high temperatures (denaturation).',
        requiredActions: [
          { actionType: 'record', targetApparatus: 'app_stopwatch', description: 'Explain denaturation' },
        ],
        isCheckpoint: true,
        maxMarks: 3,
      },
    ],
    expectedResults: [
      { condition: 'Optimum temperature for amylase', value: 37, tolerance: 3, unit: '°C' },
      { condition: 'At 80°C', value: 'No starch digestion (enzyme denatured)', unit: '' },
      { condition: 'Graph shape', value: 'Bell curve with peak at optimum', unit: '' },
    ],
    assessmentCriteria: [
      {
        id: 'crit_setup',
        name: 'Temperature Control',
        description: 'Accurate maintenance of different temperatures',
        maxMarks: 5,
        rubric: [
          { marks: 5, description: 'All temperatures accurately maintained' },
          { marks: 3, description: 'Some temperature variation' },
          { marks: 1, description: 'Poor temperature control' },
        ],
      },
      {
        id: 'crit_timing',
        name: 'Timing and Testing',
        description: 'Consistent sampling and accurate timing',
        maxMarks: 7,
        rubric: [
          { marks: 7, description: 'Perfect timing and consistent testing' },
          { marks: 4, description: 'Acceptable timing' },
          { marks: 2, description: 'Inconsistent timing' },
        ],
      },
      {
        id: 'crit_analysis',
        name: 'Analysis',
        description: 'Correct graph and conclusions',
        maxMarks: 8,
        rubric: [
          { marks: 8, description: 'Perfect graph with correct optimum' },
          { marks: 5, description: 'Graph correct but conclusion issues' },
          { marks: 2, description: 'Incorrect analysis' },
        ],
      },
    ],
    examTypeId: 'exam_wassce',
    paperTypeId: 'paper_wassce_3',
    waecPastYears: [2018, 2020, 2023],
    isActive: true,
  },

  {
    id: 'exp_transpiration',
    subjectId: 'subj_wassce_biology',
    topicId: 'topic_wassce_bio_transport',
    name: 'Transpiration - Using a Potometer',
    slug: 'transpiration',
    description:
      'Measure the rate of water uptake (transpiration) by a leafy shoot under different conditions.',
    objectives: [
      'Set up a potometer correctly without air bubbles',
      'Measure rate of water uptake under normal conditions',
      'Investigate effects of light, wind, and humidity',
      'Explain factors affecting transpiration rate',
    ],
    difficulty: 'hard',
    estimatedTime: 55,
    simulationType: 'custom',
    apparatus: ['app_potometer', 'app_stopwatch', 'app_meter_rule', 'app_beaker_250'],
    materials: [
      { name: 'Leafy shoot (e.g., Busy Lizzie)', quantity: '1' },
      { name: 'Vaseline', quantity: '10g' },
      { name: 'Electric fan', quantity: '1' },
      { name: 'Desk lamp', quantity: '1' },
      { name: 'Plastic bag', quantity: '1' },
    ],
    safetyNotes: [
      'Cut stem under water to prevent air entering xylem',
      'Handle glass apparatus carefully',
      'Be careful with electrical equipment near water',
    ],
    procedure: [
      {
        stepNumber: 1,
        instruction: 'Fill the potometer tube with water, ensuring no air bubbles.',
        requiredActions: [
          { actionType: 'pour', targetApparatus: 'app_potometer', description: 'Fill with water' },
          { actionType: 'observe', targetApparatus: 'app_potometer', description: 'Check for bubbles' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 2,
        instruction: 'Cut the shoot stem underwater at an angle and quickly insert into potometer.',
        hint: 'Cutting under water prevents air locks',
        requiredActions: [
          { actionType: 'drag', targetApparatus: 'app_scalpel', description: 'Cut stem' },
          { actionType: 'connect', targetApparatus: 'app_potometer', description: 'Insert shoot' },
        ],
        isCheckpoint: true,
        maxMarks: 3,
      },
      {
        stepNumber: 3,
        instruction: 'Seal around the shoot with vaseline to make it airtight.',
        requiredActions: [
          { actionType: 'drag', targetApparatus: 'app_potometer', description: 'Apply vaseline' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 4,
        instruction: 'Allow the apparatus to equilibrate for 5 minutes.',
        requiredActions: [
          { actionType: 'observe', targetApparatus: 'app_potometer', description: 'Wait for equilibrium' },
        ],
        isCheckpoint: false,
        maxMarks: 1,
      },
      {
        stepNumber: 5,
        instruction: 'Introduce an air bubble by briefly lifting tube out of water.',
        requiredActions: [
          { actionType: 'adjust', targetApparatus: 'app_potometer', description: 'Introduce bubble' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 6,
        instruction: 'NORMAL CONDITIONS: Time how long the bubble takes to move 5cm.',
        requiredActions: [
          { actionType: 'measure', targetApparatus: 'app_stopwatch', description: 'Time bubble movement' },
          { actionType: 'measure', targetApparatus: 'app_meter_rule', description: 'Measure distance' },
          { actionType: 'record', targetApparatus: 'app_stopwatch', description: 'Record time' },
        ],
        isCheckpoint: true,
        maxMarks: 3,
      },
      {
        stepNumber: 7,
        instruction: 'Reset bubble. BRIGHT LIGHT: Shine lamp on leaves and repeat measurement.',
        requiredActions: [
          { actionType: 'adjust', targetApparatus: 'app_potometer', description: 'Reset bubble' },
          { actionType: 'observe', targetApparatus: 'app_potometer', description: 'Add light source' },
          { actionType: 'record', targetApparatus: 'app_stopwatch', description: 'Record time' },
        ],
        isCheckpoint: true,
        maxMarks: 3,
      },
      {
        stepNumber: 8,
        instruction: 'Reset bubble. WIND: Direct fan at leaves and repeat measurement.',
        requiredActions: [
          { actionType: 'adjust', targetApparatus: 'app_potometer', description: 'Add fan' },
          { actionType: 'record', targetApparatus: 'app_stopwatch', description: 'Record time' },
        ],
        isCheckpoint: true,
        maxMarks: 3,
      },
      {
        stepNumber: 9,
        instruction: 'Reset bubble. HUMID: Cover leaves with plastic bag and repeat measurement.',
        requiredActions: [
          { actionType: 'drag', targetApparatus: 'app_potometer', description: 'Add plastic bag' },
          { actionType: 'record', targetApparatus: 'app_stopwatch', description: 'Record time' },
        ],
        isCheckpoint: true,
        maxMarks: 3,
      },
      {
        stepNumber: 10,
        instruction: 'Calculate rate (distance/time) for each condition. Compare and explain results.',
        requiredActions: [
          { actionType: 'record', targetApparatus: 'app_stopwatch', description: 'Calculate rates and explain' },
        ],
        isCheckpoint: true,
        maxMarks: 4,
      },
    ],
    expectedResults: [
      { condition: 'Bright light', value: 'Increased rate (stomata open wider)', unit: '' },
      { condition: 'Wind', value: 'Increased rate (removes humid air)', unit: '' },
      { condition: 'High humidity', value: 'Decreased rate (lower diffusion gradient)', unit: '' },
    ],
    assessmentCriteria: [
      {
        id: 'crit_setup',
        name: 'Apparatus Setup',
        description: 'Correct, airtight potometer setup',
        maxMarks: 6,
        rubric: [
          { marks: 6, description: 'Perfect setup, no leaks' },
          { marks: 4, description: 'Setup working with minor issues' },
          { marks: 2, description: 'Poor setup with leaks' },
        ],
      },
      {
        id: 'crit_measurements',
        name: 'Measurements',
        description: 'Accurate timing and distance measurements',
        maxMarks: 7,
        rubric: [
          { marks: 7, description: 'All measurements accurate' },
          { marks: 4, description: 'Some errors' },
          { marks: 2, description: 'Many errors' },
        ],
      },
      {
        id: 'crit_analysis',
        name: 'Analysis',
        description: 'Correct calculations and explanations',
        maxMarks: 7,
        rubric: [
          { marks: 7, description: 'Complete correct analysis' },
          { marks: 4, description: 'Partially correct' },
          { marks: 2, description: 'Incorrect analysis' },
        ],
      },
    ],
    examTypeId: 'exam_wassce',
    paperTypeId: 'paper_wassce_3',
    waecPastYears: [2019, 2021, 2023],
    isActive: true,
  },

  {
    id: 'exp_dissection',
    subjectId: 'subj_wassce_biology',
    topicId: 'topic_wassce_bio_anatomy',
    name: 'Virtual Dissection - Fish Anatomy',
    slug: 'virtual-dissection',
    description:
      'Explore the external and internal anatomy of a bony fish through virtual dissection.',
    objectives: [
      'Identify external features of a fish',
      'Perform a ventral incision to expose internal organs',
      'Identify and label major organ systems',
      'Understand the functions of different organs',
    ],
    difficulty: 'medium',
    estimatedTime: 45,
    simulationType: 'custom',
    apparatus: ['app_dissecting_board', 'app_scalpel', 'app_forceps', 'app_scissors', 'app_dissecting_pins', 'app_mounted_needle'],
    materials: [
      { name: 'Fresh fish specimen (e.g., tilapia)', quantity: '1' },
      { name: 'Dissecting tray with wax', quantity: '1' },
      { name: 'Labels', quantity: '10' },
    ],
    safetyNotes: [
      'Handle sharp instruments with care',
      'Always cut away from yourself',
      'Wash hands thoroughly after dissection',
      'Dispose of specimen properly',
    ],
    procedure: [
      {
        stepNumber: 1,
        instruction: 'Place fish on dissecting board, ventral side up. Pin through tail and head.',
        requiredActions: [
          { actionType: 'drag', targetApparatus: 'app_dissecting_board', description: 'Position fish' },
          { actionType: 'drag', targetApparatus: 'app_dissecting_pins', description: 'Pin specimen' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 2,
        instruction: 'EXTERNAL FEATURES: Identify and label: mouth, eyes, nostrils, operculum, lateral line.',
        requiredActions: [
          { actionType: 'observe', targetApparatus: 'app_dissecting_board', description: 'Identify external features' },
          { actionType: 'record', targetApparatus: 'app_dissecting_board', description: 'Label features' },
        ],
        isCheckpoint: true,
        maxMarks: 3,
      },
      {
        stepNumber: 3,
        instruction: 'Identify and label all fins: dorsal, caudal, anal, pelvic, and pectoral fins.',
        requiredActions: [
          { actionType: 'observe', targetApparatus: 'app_dissecting_board', description: 'Identify fins' },
          { actionType: 'record', targetApparatus: 'app_dissecting_board', description: 'Label fins' },
        ],
        isCheckpoint: true,
        maxMarks: 3,
      },
      {
        stepNumber: 4,
        instruction: 'Lift operculum and observe gills. Count gill arches and note gill filaments.',
        requiredActions: [
          { actionType: 'drag', targetApparatus: 'app_forceps', description: 'Lift operculum' },
          { actionType: 'observe', targetApparatus: 'app_dissecting_board', description: 'Examine gills' },
          { actionType: 'record', targetApparatus: 'app_dissecting_board', description: 'Count and record' },
        ],
        isCheckpoint: true,
        maxMarks: 3,
      },
      {
        stepNumber: 5,
        instruction: 'Make a ventral incision from anus to lower jaw, being careful not to cut deep.',
        hint: 'Cut just through body wall to avoid damaging organs',
        requiredActions: [
          { actionType: 'drag', targetApparatus: 'app_scissors', description: 'Make ventral cut' },
        ],
        isCheckpoint: true,
        maxMarks: 3,
      },
      {
        stepNumber: 6,
        instruction: 'Make lateral cuts and fold back body wall to expose organs. Pin walls aside.',
        requiredActions: [
          { actionType: 'drag', targetApparatus: 'app_scissors', description: 'Make lateral cuts' },
          { actionType: 'drag', targetApparatus: 'app_dissecting_pins', description: 'Pin body wall' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 7,
        instruction: 'DIGESTIVE SYSTEM: Identify mouth, oesophagus, stomach, intestine, liver, anus.',
        requiredActions: [
          { actionType: 'observe', targetApparatus: 'app_dissecting_board', description: 'Identify digestive organs' },
          { actionType: 'record', targetApparatus: 'app_dissecting_board', description: 'Label organs' },
        ],
        isCheckpoint: true,
        maxMarks: 4,
      },
      {
        stepNumber: 8,
        instruction: 'CIRCULATORY SYSTEM: Locate the heart (2 chambers). Identify atrium and ventricle.',
        requiredActions: [
          { actionType: 'observe', targetApparatus: 'app_dissecting_board', description: 'Find heart' },
          { actionType: 'record', targetApparatus: 'app_dissecting_board', description: 'Label chambers' },
        ],
        isCheckpoint: true,
        maxMarks: 3,
      },
      {
        stepNumber: 9,
        instruction: 'SWIM BLADDER: Locate the silvery air-filled sac. State its function.',
        requiredActions: [
          { actionType: 'observe', targetApparatus: 'app_dissecting_board', description: 'Find swim bladder' },
          { actionType: 'record', targetApparatus: 'app_dissecting_board', description: 'State function' },
        ],
        isCheckpoint: true,
        maxMarks: 2,
      },
      {
        stepNumber: 10,
        instruction: 'Draw a labeled diagram of the fish showing external features and internal organs.',
        requiredActions: [
          { actionType: 'record', targetApparatus: 'app_dissecting_board', description: 'Draw and label diagram' },
        ],
        isCheckpoint: true,
        maxMarks: 5,
      },
    ],
    expectedResults: [
      { condition: 'External features', value: 'All correctly identified and labeled', unit: '' },
      { condition: 'Internal organs', value: 'Major systems identified', unit: '' },
      { condition: 'Swim bladder function', value: 'Buoyancy control', unit: '' },
    ],
    assessmentCriteria: [
      {
        id: 'crit_technique',
        name: 'Dissection Technique',
        description: 'Clean cuts without damaging organs',
        maxMarks: 6,
        rubric: [
          { marks: 6, description: 'Excellent technique, clean dissection' },
          { marks: 4, description: 'Acceptable technique' },
          { marks: 2, description: 'Poor technique, organs damaged' },
        ],
      },
      {
        id: 'crit_identification',
        name: 'Organ Identification',
        description: 'Correct identification of all structures',
        maxMarks: 8,
        rubric: [
          { marks: 8, description: 'All organs correctly identified' },
          { marks: 5, description: 'Most organs identified' },
          { marks: 2, description: 'Few organs identified' },
        ],
      },
      {
        id: 'crit_diagram',
        name: 'Biological Drawing',
        description: 'Clear, accurate labeled diagram',
        maxMarks: 6,
        rubric: [
          { marks: 6, description: 'Excellent diagram with all labels' },
          { marks: 4, description: 'Good diagram, some labels missing' },
          { marks: 2, description: 'Poor diagram' },
        ],
      },
    ],
    examTypeId: 'exam_wassce',
    paperTypeId: 'paper_wassce_3',
    waecPastYears: [2018, 2020, 2022],
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
