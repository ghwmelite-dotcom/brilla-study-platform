import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeQuestionText, validateQuestionBatch } from './question-content-lib.mjs';

const sourceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputRootArgument = process.argv.indexOf('--output-root');
if (outputRootArgument >= 0 && !process.argv[outputRootArgument + 1]) throw new Error('--output-root requires a path');
const outputRoot = outputRootArgument >= 0 ? resolve(process.argv[outputRootArgument + 1]) : sourceRoot;
const generatedAt = '2026-08-26T00:00:00Z';
const batchId = 'wassce-technical-beta-002';
const outputName = 'wassce-technical-beta-002.json';
const timetableUrl = 'https://waecgh.org/wp-content/uploads/2026/03/FINAL-TIMETABLE-FOR-WASSCE-SC-2026-GHANA-ONLY-NEW-TAD.pdf';
const catalogueUrl = 'https://waecgh.org/home/wassce-school/';
const examinerReportUrl = 'https://waecgh.org/wp-content/uploads/2025/05/CHIEF-EXAMINERS-REPORTS.-WASSCE-SC-2023.pdf';
const labels = ['A', 'B', 'C', 'D'];
const difficulties = ['easy', 'medium', 'hard'];
const assessmentObjectives = ['AO1', 'AO2', 'AO3'];
const item = (topicCode, prompt, correct, wrong, explanation) => ({ topicCode, prompt, correct, wrong, explanation });
const officialAttributionPattern = /\b(?:official\s+(?:waec|west african examinations council)|(?:waec|west african examinations council)[ -](?:approved|endorsed|authored|issued|certified))\b/i;
const nonOfficialDisclaimerPattern = /\b(?:not|non[- ]?)\s+official\s+(?:waec|west african examinations council)\b/i;
const nonOfficialDisclaimerGlobalPattern = /\b(?:not|non[- ]?)\s+official\s+(?:waec|west african examinations council)\b/gi;

function assertNoFalseOfficialClaim(value, field) {
  const withoutDisclaimer = value.replace(nonOfficialDisclaimerGlobalPattern, '');
  if (officialAttributionPattern.test(withoutDisclaimer)) {
    throw new Error(`${field} contains a false official-exam-board claim`);
  }
}

function assertNonOfficialLabel(value, field) {
  if (!nonOfficialDisclaimerPattern.test(value)) {
    throw new Error(`${field} must explicitly state that the content is not official WAEC material`);
  }
  assertNoFalseOfficialClaim(value, field);
}

const autoMechanics = {
  key: 'auto_mech',
  subjectId: 'subj_wassce_auto_mech',
  specId: 'spec_wassce_auto_mech_brilla_b002',
  specificationCode: 'BRILLA-WASSCE-AUTO-MECH-BETA-002',
  syllabusName: 'BrillaPrep transitional Auto Mechanics beta content blueprint',
  assessmentInfo: 'Internal BrillaPrep evidence blueprint for the transitional Auto Mechanics subject scheduled by WAEC Ghana in 2026. It does not claim an official syllabus code, validity date or paper structure.',
  releaseSourceUrl: examinerReportUrl,
  contentLabel: 'Original BrillaPrep transitional Auto Mechanics practice aligned to WAEC Ghana examiner evidence; not official WAEC examination material or a copied past paper.',
  sources: [
    { publisher: 'West African Examinations Council, Ghana', title: 'WASSCE for School Candidates technical subject catalogue', url: catalogueUrl },
    { publisher: 'West African Examinations Council, Ghana', title: 'WASSCE for School Candidates 2026 final timetable', url: timetableUrl },
    { publisher: 'West African Examinations Council, Ghana', title: 'WASSCE 2023 Chief Examiners Report: Auto Mechanics 2 and 3', url: examinerReportUrl },
  ],
  topics: [
    ['AM-1', 'Workshop safety, tools and measurement', 'Select automotive workshop tools, apply safe working practices and interpret basic measurements.'],
    ['AM-2', 'Engine construction and operating principles', 'Explain four-stroke engine operation and identify the functions of major engine components.'],
    ['AM-3', 'Fuel, air intake and exhaust systems', 'Analyse petrol and diesel fuel delivery, air intake, combustion and exhaust-gas handling.'],
    ['AM-4', 'Lubrication and cooling systems', 'Explain pressure lubrication, coolant circulation, temperature control and related fault symptoms.'],
    ['AM-5', 'Starting, charging and ignition systems', 'Apply battery, starter, alternator and spark-ignition principles to automotive electrical faults.'],
    ['AM-6', 'Clutch, gearbox and final drive', 'Explain torque transmission through clutches, gearboxes, propeller shafts, differentials and drive shafts.'],
    ['AM-7', 'Steering, suspension and braking', 'Explain vehicle directional control, ride support and hydraulic braking operation and safety.'],
    ['AM-8', 'Wheels, tyres, maintenance and diagnosis', 'Interpret tyre data, plan preventive maintenance and diagnose common vehicle symptoms systematically.'],
  ],
  facts: [
    item('AM-1', 'Which tool applies a manufacturer-specified tightening torque to an engine fastener?', 'A torque wrench', ['A breaker bar', 'A ring spanner', 'An impact wrench'], 'A torque wrench is calibrated to apply a selected turning moment, helping prevent fasteners from being left loose or overstressed.'),
    item('AM-1', 'What is the safest first action before raising a vehicle with a workshop jack?', 'Park on firm level ground and secure the vehicle against movement', ['Raise one side before applying the parking brake', 'Use the nearest body panel as the lifting point', 'Rely on the hydraulic jack without wheel chocks'], 'Stable ground, wheel chocks and the parking brake reduce unintended movement before lifting; axle stands are then required before working underneath.'),
    item('AM-1', 'Which measuring instrument is most suitable for checking a crankshaft journal diameter accurately?', 'An outside micrometer', ['A vernier depth gauge', 'A dial bore gauge', 'A feeler gauge'], 'An outside micrometer measures external diameters precisely enough to compare a journal with its wear and service limits.'),
    item('AM-1', 'Why should compressed air not be directed at a person in an automotive workshop?', 'It can drive particles into the eyes or body and cause serious injury', ['Its pressure is too low to move workshop debris', 'It is safe when the nozzle is held at arm length', 'Only the noise from the air jet presents a hazard'], 'Compressed air can propel debris at high speed or penetrate tissue, so guarded nozzles, eye protection and safe cleaning methods are essential.'),
    item('AM-1', 'What does a vehicle hoist safety lock do after the vehicle is raised?', 'It mechanically supports the lift against unintended lowering', ['It maintains support only by trapping hydraulic pressure', 'It compensates for unequal vehicle weight automatically', 'It prevents the hoist motor from restarting unexpectedly'], 'The mechanical lock carries or secures the raised structure so a hydraulic pressure loss does not allow uncontrolled descent.'),

    item('AM-2', 'During which four-stroke engine stroke are both valves normally closed while the piston moves upward?', 'The compression stroke', ['The exhaust stroke', 'The induction stroke', 'The power stroke'], 'On the compression stroke the trapped charge is compressed as the piston rises, requiring the inlet and exhaust valves to remain closed.'),
    item('AM-2', 'What is the main function of piston rings in a reciprocating engine?', 'Seal combustion pressure while controlling oil on the cylinder wall', ['Locate the piston at top dead centre', 'Transfer camshaft motion to the valves', 'Control coolant flow through the cylinder head'], 'Compression rings limit gas leakage and the oil-control ring regulates the oil film, supporting compression, lubrication and heat transfer.'),
    item('AM-2', 'Which component converts the pistons’ reciprocating motion into rotary motion?', 'The crankshaft', ['The camshaft', 'The flywheel', 'The connecting rod'], 'Connecting rods transmit piston force to offset crankpins, causing the crankshaft to rotate and deliver engine torque.'),
    item('AM-2', 'What does engine compression ratio compare?', 'Cylinder volume at bottom dead centre with volume at top dead centre', ['Swept volume with total engine displacement', 'Combustion pressure before and after ignition', 'Cylinder bore with piston stroke'], 'Compression ratio is the maximum cylinder volume divided by the minimum clearance volume and influences efficiency and combustion requirements.'),
    item('AM-2', 'Why is valve clearance provided in a conventional valve train?', 'To allow thermal expansion while ensuring the valves can fully close', ['To increase valve lift as speed rises', 'To hold each valve slightly open during compression', 'To compensate for piston-ring wear'], 'A correct cold clearance accommodates expansion of valve-train parts; too little can prevent sealing and too much causes noise and timing loss.'),

    item('AM-3', 'What is the primary function of a petrol-engine fuel pump?', 'Deliver fuel from the tank to the engine fuel-metering system', ['Meter the exact air-fuel ratio at each injector', 'Return fuel vapour directly to the exhaust', 'Maintain pressure in the engine oil galleries'], 'The fuel pump supplies petrol at the required flow and pressure to the carburettor or injection rail, not to lubrication or braking circuits.'),
    item('AM-3', 'Why does a diesel engine use a high-pressure injection system?', 'To atomise and meter fuel into highly compressed hot air', ['To compress intake air before it enters the cylinder', 'To ignite each charge with an electrical spark', 'To meter lubricant into the combustion chamber'], 'Fine, correctly timed injection promotes mixing and auto-ignition in the cylinder after compression has raised the air temperature.'),
    item('AM-3', 'What likely happens when an engine air filter becomes severely restricted?', 'Airflow falls, reducing performance and potentially enriching the mixture', ['Intake airflow rises and the mixture becomes leaner', 'Fuel pressure rises enough to improve acceleration', 'Exhaust back pressure falls and engine speed increases'], 'A blocked filter restricts intake air; the resulting mixture or airflow error can reduce power, increase fuel use and raise exhaust smoke.'),
    item('AM-3', 'What is the purpose of a catalytic converter in the exhaust system?', 'Reduce harmful exhaust pollutants through chemical reactions', ['Silence exhaust pulses by absorbing sound energy', 'Measure oxygen content for the engine controller', 'Recirculate exhaust gas into the intake manifold'], 'A catalyst promotes reactions that convert carbon monoxide, hydrocarbons and oxides of nitrogen into less harmful exhaust products when operating correctly.'),
    item('AM-3', 'Which symptom most directly suggests a leaking exhaust manifold near the cylinder head?', 'A sharp ticking noise that changes with engine speed', ['A low booming sound only at the tailpipe', 'A whistle that continues after the engine stops', 'A silent exhaust with unusually high back pressure'], 'Pulsed exhaust gas escaping at the manifold joint commonly produces a ticking sound that follows engine speed and may leave soot marks.'),

    item('AM-4', 'What is the main function of the engine oil pump?', 'Circulate oil under pressure to moving engine parts', ['Cool the lubricant by passing it through the radiator', 'Regulate oil viscosity as engine speed changes', 'Separate fuel that has entered the engine oil'], 'The oil pump draws lubricant from the sump and supplies galleries feeding bearings and other moving surfaces to maintain a protective film.'),
    item('AM-4', 'Why is an engine thermostat used in the cooling system?', 'Control coolant flow so the engine reaches and maintains operating temperature', ['Increase coolant pressure whenever speed rises', 'Keep maximum radiator flow from a cold start', 'Switch the cooling fan on at every temperature'], 'The thermostat restricts radiator flow when cold and opens near its rated temperature, balancing warm-up speed with heat rejection.'),
    item('AM-4', 'What does a low oil-pressure warning require the driver to do?', 'Stop the engine safely and investigate before continued operation', ['Continue slowly until the next oil change', 'Increase engine speed to force the warning lamp off', 'Add coolant before checking lubricant level'], 'Insufficient oil pressure can damage bearings within seconds, so continuing to run the engine risks severe seizure or wear.'),
    item('AM-4', 'Why must a hot pressurised radiator cap not be removed suddenly?', 'Escaping pressure can release boiling coolant and cause burns', ['Air entry will immediately seize the water pump', 'Coolant pressure will force oil from the bearings', 'The thermostat will remain permanently closed'], 'Cooling-system pressure raises coolant boiling point; sudden opening can flash hot coolant into steam and eject it violently.'),
    item('AM-4', 'Which fault can cause both overheating and poor cabin-heater output?', 'Low coolant level that prevents proper circulation', ['A thermostat stuck partly open', 'A cooling fan that runs continuously', 'Coolant mixed at the correct concentration'], 'Low coolant may leave passages and the heater core partly empty, reducing heat transfer while allowing engine hot spots and overheating.'),

    item('AM-5', 'What does a hydrometer measure in a serviceable lead-acid vehicle battery?', 'The relative density of the electrolyte', ['Battery terminal voltage', 'Electrolyte temperature', 'Starter current draw'], 'Electrolyte relative density provides an indication of state of charge and cell condition when temperature and battery design are considered.'),
    item('AM-5', 'What is the starter motor’s function during engine starting?', 'Crank the engine fast enough for combustion to begin', ['Turn the alternator fast enough to charge the battery', 'Preheat the intake air before cranking', 'Advance ignition timing until combustion begins'], 'The starter converts battery electrical energy into torque at the flywheel until the engine can sustain its own combustion cycle.'),
    item('AM-5', 'What is the alternator’s main function while the engine is running?', 'Supply electrical loads and recharge the battery', ['Provide all cranking torque to the flywheel', 'Supply the ignition system only while starting', 'Regulate battery electrolyte density'], 'The belt-driven alternator generates electrical power, and its regulator controls charging voltage for the battery and vehicle systems.'),
    item('AM-5', 'In a spark-ignition engine, what does the ignition coil provide?', 'A high voltage capable of producing a spark across the plug gap', ['A high current at approximately battery voltage', 'A timed low-voltage pulse at the plug gap', 'A steady charging voltage for the starter motor'], 'The coil transforms the low battery voltage into a high-voltage pulse so current can cross the spark-plug gap at the required time.'),
    item('AM-5', 'A battery reads about 12.6 V at rest but voltage collapses during cranking. What is the best next check?', 'Perform a battery load test and inspect high-current connections', ['Check alternator output before testing the battery', 'Replace the starter without a voltage-drop test', 'Clean the spark plugs before checking the cables'], 'A normal open-circuit voltage can coexist with poor capacity or high connection resistance, which a load test and voltage-drop checks reveal.'),

    item('AM-6', 'What is the primary function of a vehicle clutch?', 'Connect and disconnect engine torque from the transmission smoothly', ['Multiply torque through the final-drive gears', 'Synchronise gearbox shaft speeds during every shift', 'Allow the propeller shaft to change angle'], 'The clutch permits progressive engagement for moving off and temporary disconnection for stopping or changing gears.'),
    item('AM-6', 'Why are lower gearbox ratios used when a vehicle starts moving?', 'They multiply torque at the driving wheels', ['They reduce wheel torque to prevent wheelspin', 'They give direct drive between input and output', 'They lower engine speed for a given road speed'], 'A low gear trades output speed for greater torque multiplication, helping overcome inertia and road resistance from rest.'),
    item('AM-6', 'What is the function of a differential during cornering?', 'Allow the left and right driving wheels to rotate at different speeds', ['Lock both axle shafts to the same speed in every turn', 'Change the gearbox ratio as steering angle increases', 'Disconnect the inner driving wheel during a turn'], 'The outside wheel travels farther in a turn, so differential gears permit speed difference while transmitting torque to both axle shafts.'),
    item('AM-6', 'Which symptom is most consistent with a slipping clutch?', 'Engine speed rises without a matching increase in vehicle speed', ['Vehicle speed rises while engine speed remains fixed', 'The clutch pedal becomes firm with no free play', 'The vehicle judders only while the brakes are applied'], 'A worn or contaminated friction surface cannot transmit full torque, so engine revolutions flare while road speed responds slowly.'),
    item('AM-6', 'What does a universal joint permit in a propeller shaft?', 'Torque transmission between shafts operating at changing angles', ['A change in final-drive gear ratio', 'Axial sliding as shaft length changes', 'Different left and right wheel speeds'], 'Universal joints accommodate angular movement caused by suspension and driveline geometry while continuing to transmit rotation.'),

    item('AM-7', 'What is the purpose of steering wheel toe adjustment?', 'Set the specified relationship between the front edges of paired wheels', ['Set the inward tilt of the wheel tops', 'Set steering-axis inclination viewed from the side', 'Remove free play from the steering gearbox'], 'Correct toe helps the tyres roll in the intended direction under load, reducing scrub, instability and abnormal tread wear.'),
    item('AM-7', 'What is a shock absorber designed to control?', 'Oscillation of the suspension springs', ['The static ride height of the suspension', 'The full vehicle weight without the springs', 'The maximum steering angle of the front wheels'], 'The damper converts suspension motion into heat, preventing repeated bouncing while the spring continues to support vehicle weight.'),
    item('AM-7', 'How does a hydraulic brake system transmit pedal force?', 'Pressure in confined brake fluid acts through the system', ['Mechanical rods transmit all pedal force to the wheels', 'Engine vacuum flows through the brake pipes', 'Electrical current drives each caliper piston directly'], 'Pedal force applied at the master cylinder creates hydraulic pressure that acts at wheel cylinders or caliper pistons.'),
    item('AM-7', 'What does a spongy brake pedal commonly indicate?', 'Air in the hydraulic system or another source of fluid compressibility', ['A seized caliper piston that prevents pedal travel', 'A failed brake booster with normal hydraulics', 'Worn friction linings with no air in the system'], 'Unlike brake fluid, trapped air compresses noticeably, increasing pedal travel and reducing the immediate transmission of braking force.'),
    item('AM-7', 'Why is brake fluid kept clean and sealed from moisture?', 'Moisture lowers its boiling point and can promote corrosion', ['Moisture raises the boiling point under heavy braking', 'Water improves lubrication of master-cylinder seals', 'Contamination prevents corrosion inside steel pipes'], 'Brake fluid absorbs moisture over time; contamination can cause vapour formation under heat and corrode hydraulic components.'),

    item('AM-8', 'In the tyre marking 205/55 R16, what does 205 represent?', 'The nominal section width in millimetres', ['The tyre aspect ratio as a percentage', 'The wheel diameter in inches', 'The tyre load index'], 'The first number is nominal tyre section width in millimetres; 55 is aspect ratio and 16 is the wheel diameter in inches.'),
    item('AM-8', 'What tool should be used to check tyre inflation pressure?', 'A calibrated tyre-pressure gauge', ['A tread-depth gauge', 'A wheel-nut torque wrench', 'A dial indicator on the wheel rim'], 'A pressure gauge measures the air pressure directly so it can be compared with the vehicle manufacturer’s cold-pressure recommendation.'),
    item('AM-8', 'What tread pattern is most associated with persistent over-inflation?', 'Greater wear along the centre of the tread', ['Greater wear on both outer shoulders', 'Feathered wear caused by incorrect toe', 'Cupped wear caused by poor damping'], 'Excess pressure tends to crown the tread so the centre carries a disproportionate load, although alignment and duty must also be checked.'),
    item('AM-8', 'Why should diagnostic trouble codes not be treated as automatic proof that the named component is faulty?', 'A code identifies a detected circuit or system condition that still requires testing', ['The code proves the named sensor itself has failed', 'Clearing the code confirms the fault is repaired', 'The named component should be replaced before circuit tests'], 'Wiring, connectors, mechanical faults or another sensor can cause the monitored condition, so tests and service information must confirm the cause.'),
    item('AM-8', 'Which maintenance action most directly helps prevent engine damage from a worn timing belt?', 'Replace the belt and related parts at the specified interval', ['Inspect it only after a rattling noise develops', 'Retension the old belt instead of replacing it', 'Wait for visible cracking regardless of service interval'], 'Age and mileage weaken timing belts; scheduled replacement reduces the risk of sudden failure and piston-to-valve contact on interference engines.'),
  ],
};

const electronics = {
  key: 'electronics',
  subjectId: 'subj_wassce_electronics',
  specId: 'spec_wassce_electronics_brilla_b002',
  specificationCode: 'BRILLA-WASSCE-ELECTRONICS-BETA-002',
  syllabusName: 'BrillaPrep transitional Electronics beta content blueprint',
  assessmentInfo: 'Internal BrillaPrep evidence blueprint for the transitional Electronics subject scheduled by WAEC Ghana in 2026. It does not claim an official syllabus code, validity date or paper structure.',
  releaseSourceUrl: examinerReportUrl,
  contentLabel: 'Original BrillaPrep transitional Electronics practice aligned to WAEC Ghana examiner evidence; not official WAEC examination material or a copied past paper.',
  sources: [
    { publisher: 'West African Examinations Council, Ghana', title: 'WASSCE for School Candidates technical subject catalogue', url: catalogueUrl },
    { publisher: 'West African Examinations Council, Ghana', title: 'WASSCE for School Candidates 2026 final timetable', url: timetableUrl },
    { publisher: 'West African Examinations Council, Ghana', title: 'WASSCE 2023 Chief Examiners Report: Electronics 2 and 3', url: examinerReportUrl },
  ],
  topics: [
    ['ELN-1', 'Workshop safety and electronic measurement', 'Apply safe bench practice and use meters and oscilloscopes to measure electrical quantities.'],
    ['ELN-2', 'Direct-current circuits and passive components', 'Analyse resistor networks and explain capacitor and inductor behaviour in direct-current circuits.'],
    ['ELN-3', 'Alternating-current circuits and electromagnetism', 'Analyse sinusoidal quantities, RLC circuits, resonance, induction and stored magnetic energy.'],
    ['ELN-4', 'Semiconductor diodes and power supplies', 'Explain semiconductor junctions, rectification, filtering, regulation and power-supply faults.'],
    ['ELN-5', 'Transistors and amplifiers', 'Apply bipolar transistor bias, switching, gain and small-signal amplifier principles.'],
    ['ELN-6', 'Oscillators and waveform generation', 'Explain positive feedback, oscillation conditions and common waveform-generator applications.'],
    ['ELN-7', 'Digital electronics', 'Apply binary representation, logic gates, truth tables, flip-flops and counting circuits.'],
    ['ELN-8', 'Communication and control systems', 'Explain modulation, signal transmission, feedback and open- and closed-loop control systems.'],
  ],
  facts: [
    item('ELN-1', 'What should be done before changing components on an energised electronics bench circuit?', 'Disconnect the supply and discharge stored energy safely', ['Switch off the supply but leave charged capacitors untouched', 'Remove only the fuse while the circuit remains connected', 'Short capacitor terminals directly with an uninsulated tool'], 'Isolation and controlled capacitor discharge prevent electric shock, burns and accidental component damage from stored charge.'),
    item('ELN-1', 'How is a voltmeter connected when measuring the voltage across a resistor?', 'In parallel with the resistor', ['In series with the resistor and load current', 'In parallel with the ammeter only', 'Across the supply without identifying the resistor terminals'], 'A voltmeter compares potential at two points and therefore connects in parallel while presenting high input resistance.'),
    item('ELN-1', 'What is the purpose of a shunt resistor in an analogue ammeter?', 'Carry most of the measured current around the sensitive meter movement', ['Increase movement resistance by being connected in series', 'Protect the movement by opening on overload', 'Adjust the pointer to zero before current flows'], 'A low-value shunt shares current with the movement, extending current range while only the rated fraction flows through the coil.'),
    item('ELN-1', 'What does the time-base control of an oscilloscope set?', 'The horizontal time represented per division', ['The vertical voltage represented per division', 'The trigger voltage that begins each sweep', 'The brightness of the displayed trace'], 'The time base controls horizontal sweep rate, allowing period, frequency and timing relationships to be read from the graticule.'),
    item('ELN-1', 'Why is an oscilloscope probe ground lead connected only to an appropriate circuit reference?', 'An incorrect ground connection can short a live point through protective earth', ['The probe input isolates its ground from protective earth', 'Any circuit point is safe because the lead has high resistance', 'The ground reference affects only trace position, not current flow'], 'Bench oscilloscope grounds are often earth-referenced, so careless connection can create a destructive high-current path and a shock hazard.'),

    item('ELN-2', 'Two resistors of 3 kΩ and 6 kΩ are in parallel. What is their equivalent resistance?', '2 kΩ', ['9 kΩ', '4 kΩ', '4.5 kΩ'], 'For two parallel resistors, the product divided by the sum gives 18 divided by 9 kilohms, which equals 2 kΩ.'),
    item('ELN-2', 'What current flows through a 1 kΩ resistor connected across 5 V?', '5 mA', ['0.005 mA', '0.2 mA', '5 A'], 'Ohm’s law gives current as voltage divided by resistance: 5 V divided by 1000 Ω equals 0.005 A or 5 mA.'),
    item('ELN-2', 'What happens to an ideal capacitor after it is fully charged from a steady direct-current source?', 'It blocks steady current while retaining charge', ['It remains a short circuit to steady current', 'It loses all stored charge as soon as charging ends', 'It continues drawing its initial charging current indefinitely'], 'After the transient charging current falls to zero, an ideal capacitor presents an open circuit to steady DC and stores electric-field energy.'),
    item('ELN-2', 'Which property of an inductor opposes a rapid change in its current?', 'Self-induced emf', ['The resistance of its winding alone', 'Electric-field capacitance', 'A mutually induced emf from the same coil'], 'Changing current changes magnetic flux, inducing an emf whose polarity opposes the change according to Lenz’s law.'),
    item('ELN-2', 'Why is a resistor placed in series with a light-emitting diode?', 'To limit current to a safe value', ['To hold the LED voltage at the full supply value', 'To bypass the LED whenever it conducts', 'To make the LED conduct equally in both directions'], 'An LED has a steep current-voltage characteristic, so a series resistor drops excess voltage and controls current within the device rating.'),

    item('ELN-3', 'What is the period of a 50 Hz sinusoidal waveform?', '20 ms', ['5 ms', '10 ms', '50 ms'], 'Period is the reciprocal of frequency: one divided by 50 seconds equals 0.02 seconds, which is 20 milliseconds.'),
    item('ELN-3', 'How does inductive reactance change when frequency increases?', 'It increases in direct proportion to frequency', ['It decreases in inverse proportion to frequency', 'It remains fixed for a given coil', 'It becomes equal to resistance at every frequency'], 'Inductive reactance is two pi times frequency times inductance, so increasing frequency increases opposition for a fixed coil.'),
    item('ELN-3', 'At series resonance, how do inductive and capacitive reactances compare?', 'They are equal in magnitude', ['Both reactances become zero individually', 'Inductive reactance is twice capacitive reactance', 'Circuit resistance becomes infinite'], 'Equal opposite reactances cancel in a series RLC circuit, leaving impedance at its minimum resistive value.'),
    item('ELN-3', 'A 2 H inductor carries 3 A. How much energy is stored in its magnetic field?', '9 J', ['3 J', '6 J', '12 J'], 'Stored energy is one-half L times current squared, so one-half times 2 times 3 squared equals 9 joules.'),
    item('ELN-3', 'What principle produces an emf when magnetic flux linkage changes?', 'Electromagnetic induction', ['The motor effect on a current-carrying conductor', 'Electrostatic induction by a stationary charge', 'Resistive heating in the conductor'], 'Faraday’s law relates induced emf to the rate of change of flux linkage, with polarity described by Lenz’s law.'),

    item('ELN-4', 'When is a silicon p-n junction diode forward biased?', 'Its p-side is made positive relative to its n-side', ['Its n-side is made positive relative to its p-side', 'Both sides are held at the same potential', 'Its p-side is connected through reverse breakdown only'], 'Forward bias reduces the junction barrier and permits substantial current after the applied voltage reaches the device’s operating region.'),
    item('ELN-4', 'What is the output of an ideal full-wave rectifier before filtering?', 'Unidirectional pulses during both input half-cycles', ['Unidirectional pulses during one input half-cycle only', 'A sinusoid that still alternates about zero', 'A constant DC level with no ripple'], 'Full-wave rectification reverses the negative half-cycle so load current has one direction on both halves of the AC input.'),
    item('ELN-4', 'What is the role of a reservoir capacitor after a rectifier?', 'Reduce ripple by supplying the load between waveform peaks', ['Raise the rectifier frequency before the transformer', 'Hold the output at an exact value under every load', 'Block all direct current from reaching the load'], 'The capacitor charges near rectified peaks and discharges into the load between them, smoothing the pulsating voltage.'),
    item('ELN-4', 'Why is a Zener diode useful in a simple voltage regulator?', 'It maintains an approximately constant reverse voltage in breakdown', ['It maintains a constant forward voltage at any current', 'It removes ripple without a series current-limiting element', 'It increases transformer secondary voltage in breakdown'], 'A correctly biased Zener operates in controlled reverse breakdown, providing a reference or shunt-regulated voltage with current limiting.'),
    item('ELN-4', 'A bridge rectifier has one diode open-circuit. What is a likely output symptom?', 'Reduced output with half-wave-like ripple', ['Normal full-wave output with slightly lower peak voltage', 'Zero output on both input half-cycles', 'Normal output voltage with half the ripple frequency'], 'An open bridge diode removes one conduction path, so only part of the AC cycle reaches the load and ripple increases.'),

    item('ELN-5', 'Which bipolar transistor terminal controls collector current through a much smaller current?', 'The base', ['The emitter', 'The collector', 'The gate'], 'In normal active operation, a relatively small base current controls a larger collector current, enabling amplification or switching.'),
    item('ELN-5', 'A transistor has collector current 40 mA and base current 0.2 mA. What is its current gain?', '200', ['20', '80', '800'], 'Common-emitter current gain is collector current divided by base current, so 40 divided by 0.2 equals 200.'),
    item('ELN-5', 'In which region is a bipolar transistor intended to operate as a closed switch?', 'Saturation', ['Cut-off', 'The active region', 'Reverse breakdown'], 'In saturation both junctions are driven so collector-emitter voltage is low and the device approximates a closed electronic switch.'),
    item('ELN-5', 'What defines Class A amplifier operation?', 'The active device conducts for the full input cycle', ['The device conducts for half of each input cycle', 'The device conducts for less than half a cycle', 'Two devices conduct on alternate half-cycles'], 'A Class A stage is biased within the active region so conduction continues through 360 degrees of the signal cycle.'),
    item('ELN-5', 'Why is an emitter bypass capacitor used in a common-emitter amplifier?', 'Increase AC gain while retaining DC bias stabilisation', ['Reduce AC gain while leaving DC bias unchanged', 'Remove the emitter resistor from the DC bias path', 'Couple the collector signal directly to the base'], 'The capacitor provides a low-reactance AC path around the emitter resistor while the resistor continues to stabilise the DC operating point.'),

    item('ELN-6', 'What feedback condition is required to sustain sinusoidal oscillation?', 'Loop gain magnitude of unity with total phase shift of 0° or 360°', ['Loop gain greater than unity with 180° net phase shift', 'Loop gain below unity with 360° net phase shift', 'Zero feedback at the selected frequency'], 'The Barkhausen condition requires reinforcing feedback of the correct phase and a loop-gain magnitude that sustains rather than grows or decays.'),
    item('ELN-6', 'Which oscillator commonly uses a crystal for high frequency stability?', 'A crystal-controlled oscillator', ['An RC phase-shift oscillator', 'A Hartley oscillator', 'An astable multivibrator'], 'Quartz has a high-Q mechanical resonance that provides a stable frequency-selective element in the feedback network.'),
    item('ELN-6', 'What waveform is produced directly by a relaxation oscillator that repeatedly charges and discharges a capacitor between thresholds?', 'A non-sinusoidal periodic waveform such as a square or sawtooth wave', ['A pure sinusoid from linear resonance', 'A constant DC level after one charge cycle', 'A single exponentially decaying pulse'], 'Threshold switching and capacitor ramps create repeating abrupt transitions or ramps rather than a pure sinusoid.'),
    item('ELN-6', 'What is the purpose of an oscillator in a radio transmitter?', 'Generate a periodic carrier or reference signal', ['Select and recover the incoming information signal', 'Remove modulation from the transmitted carrier', 'Hold the transmitter supply at a fixed DC voltage'], 'Transmitters require a stable periodic signal that can be amplified, multiplied or modulated to carry information.'),
    item('ELN-6', 'Why does excessive positive feedback make a linear amplifier unstable?', 'It can cause the circuit to generate unwanted sustained oscillations', ['It always reduces loop gain below unity', 'It guarantees a wider bandwidth without phase effects', 'It shifts the bias point but cannot create an AC output'], 'If loop magnitude and phase meet oscillation conditions unintentionally, disturbances are reinforced rather than damped.'),

    item('ELN-7', 'What decimal value is represented by binary 1011?', '11', ['7', '10', '13'], 'Binary 1011 equals eight plus zero plus two plus one, giving a decimal value of eleven.'),
    item('ELN-7', 'When does a two-input AND gate output logic 1?', 'Only when both inputs are logic 1', ['Whenever either input is logic 1', 'Only when both inputs are logic 0', 'Whenever the inputs differ'], 'The AND truth table produces a high output only for the input combination 1 and 1.'),
    item('ELN-7', 'Which logic gate outputs the inverse of its single input?', 'A NOT gate', ['An AND gate', 'An OR gate', 'An XOR gate'], 'A NOT gate is an inverter: logic 0 becomes 1 and logic 1 becomes 0.'),
    item('ELN-7', 'What is the basic storage capability of a flip-flop?', 'It stores one binary bit', ['It stores four binary bits', 'It stores one continuously variable analogue level', 'It stores the duration of one clock pulse'], 'A flip-flop has two stable states representing one bit and changes state in response to defined control or clock conditions.'),
    item('ELN-7', 'What does a binary counter do on successive valid clock pulses?', 'Advances through a defined sequence of binary states', ['Produces one fixed state for every clock pulse', 'Converts the clock amplitude into a decimal voltage', 'Changes state only when the supply voltage increases'], 'Connected flip-flops change state according to the counter design, representing successive counts in binary form.'),

    item('ELN-8', 'What is a carrier wave in a communication system?', 'A high-frequency signal whose parameter is varied to carry information', ['The original low-frequency information signal', 'A DC bias added only to power the transmitter', 'Unwanted noise generated in the receiver'], 'A carrier provides the radio-frequency waveform whose amplitude, frequency or phase can be changed by the information signal.'),
    item('ELN-8', 'In amplitude modulation, which carrier property follows the information signal?', 'Amplitude', ['Frequency', 'Phase', 'Pulse width'], 'AM varies carrier amplitude in step with the modulating signal while carrier frequency ideally remains constant.'),
    item('ELN-8', 'What distinguishes a closed-loop control system from an open-loop system?', 'It uses feedback about the output to influence control action', ['It follows a preset action without measuring the output', 'It requires a human operator for every correction', 'It uses only the input command to determine control action'], 'Closed-loop control compares measured output with the desired value and adjusts action to reduce error.'),
    item('ELN-8', 'Why can negative feedback improve amplifier accuracy?', 'It reduces sensitivity to component gain changes and distortion', ['It increases sensitivity to transistor gain variation', 'It raises nonlinear distortion while increasing gain', 'It narrows bandwidth while leaving gain unchanged'], 'Feeding back a controlled opposing fraction trades some gain for better linearity, bandwidth and stability.'),
    item('ELN-8', 'What is the function of a demodulator in a radio receiver?', 'Recover the information signal from the modulated carrier', ['Increase carrier power without recovering information', 'Impose the information signal on a carrier', 'Translate the received signal to a higher carrier frequency'], 'After selection and amplification, demodulation extracts the original audio or data information from the received carrier waveform.'),
  ],
};

const subjects = [autoMechanics, electronics];

function mcq(subjectKey, index, source) {
  const correctIndex = index % labels.length;
  const rawOptions = [...source.wrong];
  rawOptions.splice(correctIndex, 0, source.correct);
  const options = rawOptions.map((text, optionIndex) => ({
    label: labels[optionIndex], text,
    rationale: optionIndex === correctIndex
      ? `This is the supported answer. ${source.explanation}`
      : 'This option is a plausible misconception, but it does not follow the principle established in the worked solution.',
  }));
  return {
    id: `q_was_${subjectKey}_b002_${String(index + 1).padStart(3, '0')}`, original: true,
    topicCode: source.topicCode, type: 'multiple_choice', prompt: source.prompt, options,
    correctAnswer: labels[correctIndex],
    workedSolution: `${source.explanation} Therefore the correct answer is ${labels[correctIndex]}: ${source.correct}.`,
    difficulty: difficulties[index % difficulties.length],
    marks: index % 5 === 4 ? 3 : index % 2 === 0 ? 1 : 2,
    commandWord: /why|how/i.test(source.prompt) ? 'Explain' : /what|which|who|when/i.test(source.prompt) ? 'Identify' : 'Apply',
    assessmentObjective: assessmentObjectives[index % assessmentObjectives.length],
  };
}

const batch = {
  batchId, status: 'approved_for_production', examTypeId: 'exam_wassce',
  provenance: subjects.flatMap((subject) => subject.sources.map((source) => ({ ...source, use: 'curriculum_blueprint_only' }))),
  review: { authoringMethod: 'original_curriculum_aligned', qualityAssurance: 'automated_beta', automatedChecksAt: generatedAt },
  release: {
    channel: 'beta',
    contentLabel: 'Original BrillaPrep curriculum-aligned technical practice; not official WAEC examination material. Use the enabled feedback channel to report corrections.',
    officialExamBoardContent: false, feedbackEnabled: true,
  },
  subjects: subjects.map((subject) => ({
    subjectId: subject.subjectId, specificationCode: subject.specificationCode,
    release: {
      contentLabel: subject.contentLabel, sourceUrl: subject.releaseSourceUrl,
      officialExamBoardContent: false, feedbackEnabled: true,
    },
    topics: subject.topics.map(([code, title, objective]) => ({ code, title, objective })),
    questions: subject.facts.map((source, index) => mcq(subject.key, index, source)),
  })),
};

assertNonOfficialLabel(batch.release.contentLabel, 'release.contentLabel');
for (const subject of subjects) {
  assertNonOfficialLabel(subject.contentLabel, `${subject.key}.contentLabel`);
}
for (const subject of batch.subjects) {
  assertNonOfficialLabel(subject.release.contentLabel, `${subject.subjectId}.release.contentLabel`);
  for (const question of subject.questions) {
    assertNoFalseOfficialClaim(question.prompt, `${question.id}.prompt`);
  }
}

async function collectExistingPrompts() {
  const existing = new Map();
  const seedSql = await readFile(resolve(sourceRoot, 'database/seed.sql'), 'utf8');
  for (const match of seedSql.matchAll(/'(?:''|[^'])*'/g)) {
    const literal = match[0].slice(1, -1).replaceAll("''", "'");
    const normalized = normalizeQuestionText(literal);
    if (normalized.length >= 18) existing.set(normalized, 'database/seed.sql');
  }
  for (const name of await readdir(resolve(sourceRoot, 'content/batches'))) {
    if (!name.endsWith('.json') || name === outputName) continue;
    const candidate = JSON.parse(await readFile(resolve(sourceRoot, 'content/batches', name), 'utf8'));
    for (const subject of candidate.subjects ?? []) for (const question of subject.questions ?? []) {
      const normalized = normalizeQuestionText(question.prompt);
      if (normalized) existing.set(normalized, `content/batches/${name}`);
    }
  }
  return existing;
}

const existingPrompts = await collectExistingPrompts();
const duplicatePrompts = batch.subjects.flatMap((subject) => subject.questions)
  .map((question) => ({ question, source: existingPrompts.get(normalizeQuestionText(question.prompt)) }))
  .filter(({ source }) => source);
if (duplicatePrompts.length) throw new Error(`Generated prompts duplicate existing content:\n${duplicatePrompts.map(({ question, source }) => `${question.id}: ${source}`).join('\n')}`);

const validation = validateQuestionBatch(batch, { mode: 'production' });
if (!validation.valid) throw new Error(`Generated batch failed validation:\n${validation.errors.join('\n')}`);
const sql = (value) => value == null ? 'NULL' : `'${String(value).replaceAll("'", "''")}'`;
const topicId = (subject, code) => `topic_was_${subject.key}_b002_${code.split('-').at(-1).toLowerCase()}`;
const syllabusTopicId = (subject, code) => `st_was_${subject.key}_b002_${code.split('-').at(-1).toLowerCase()}`;
const canonicalQuestionFields = [
  'topic_id', 'subject_id', 'exam_type_id', 'paper_type_id', 'past_paper_id', 'question_text',
  'question_type', 'round_type', 'options', 'correct_answer', 'explanation', 'difficulty', 'points',
  'marks', 'time_limit', 'question_number', 'section', 'is_compulsory', 'image_url', 'syllabus_topic_id',
  'command_word', 'assessment_objective', 'source_paper_code', 'source_question_number', 'exam_board_id',
];
function questionValues(subject, question) {
  return {
    topic_id: topicId(subject, question.topicCode), subject_id: subject.subjectId, exam_type_id: 'exam_wassce',
    paper_type_id: null, past_paper_id: null, question_text: question.prompt, question_type: 'multiple_choice',
    round_type: null, options: JSON.stringify(question.options.map(({ label, text }) => `${label}. ${text}`)),
    correct_answer: question.correctAnswer, explanation: question.workedSolution, difficulty: question.difficulty,
    points: question.marks, marks: question.marks, time_limit: 90, question_number: null, section: null,
    is_compulsory: 1, image_url: null, syllabus_topic_id: syllabusTopicId(subject, question.topicCode),
    command_word: question.commandWord, assessment_objective: question.assessmentObjective,
    source_paper_code: null, source_question_number: null, exam_board_id: 'board_waec',
  };
}
const canonicalMatch = (alias, values) => canonicalQuestionFields.map((field) => `${alias}.${field} IS ${sql(values[field])}`).join(' AND ');
const releaseMatch = (alias, subject) => [
  `${alias}.batch_id IS ${sql(batchId)}`, `${alias}.quality_assurance IS 'automated_beta'`,
  `${alias}.release_channel IS 'beta'`, `${alias}.content_label IS ${sql(subject.contentLabel)}`,
  `${alias}.source_url IS ${sql(subject.releaseSourceUrl)}`, `${alias}.official_exam_board_content IS 0`,
  `${alias}.feedback_enabled IS 1`,
].join(' AND ');

const outBatch = resolve(outputRoot, 'content/batches', outputName);
await mkdir(dirname(outBatch), { recursive: true });
await writeFile(outBatch, `${JSON.stringify(batch, null, 2)}\n`);
const migrationPaths = [];
const foundationPath = resolve(outputRoot, 'database/migrations/140_wassce_technical_beta_foundation.sql');
const foundation = [
  '-- 140: BrillaPrep transitional WASSCE Auto Mechanics and Electronics beta blueprint specifications.',
  '-- Internal evidence blueprints; not official WAEC specifications or examination material.',
  'PRAGMA foreign_keys = ON;',
  "INSERT OR IGNORE INTO exam_boards (id, name, code, full_name, region, website_url, is_active, display_order) VALUES ('board_waec', 'WAEC', 'WAEC', 'West African Examinations Council', 'West Africa', 'https://waecgh.org/', 1, 1);",
];
for (const subject of subjects) foundation.push(`INSERT OR IGNORE INTO subject_specifications (id, exam_board_id, subject_id, exam_type_id, syllabus_code, syllabus_name, specification_year, valid_from, syllabus_pdf_url, total_papers, assessment_info, is_active, display_order) VALUES (${sql(subject.specId)}, 'board_waec', ${sql(subject.subjectId)}, 'exam_wassce', ${sql(subject.specificationCode)}, ${sql(subject.syllabusName)}, NULL, NULL, NULL, 0, ${sql(subject.assessmentInfo)}, 1, 1);`);
foundation.push('CREATE TABLE IF NOT EXISTS _migration_140_guard (valid INTEGER NOT NULL CHECK (valid = 1));', 'DELETE FROM _migration_140_guard;');
for (const subject of subjects) foundation.push(`INSERT INTO _migration_140_guard(valid) SELECT CASE WHEN EXISTS (SELECT 1 FROM subject_specifications WHERE id = ${sql(subject.specId)} AND exam_board_id IS 'board_waec' AND subject_id IS ${sql(subject.subjectId)} AND exam_type_id IS 'exam_wassce' AND syllabus_code IS ${sql(subject.specificationCode)} AND syllabus_name IS ${sql(subject.syllabusName)} AND specification_year IS NULL AND valid_from IS NULL AND syllabus_pdf_url IS NULL AND total_papers IS 0 AND assessment_info IS ${sql(subject.assessmentInfo)} AND is_active IS 1) THEN 1 ELSE 0 END;`);
foundation.push('DROP TABLE _migration_140_guard;');
await mkdir(dirname(foundationPath), { recursive: true });
await writeFile(foundationPath, `${foundation.join('\n')}\n`);
migrationPaths.push(foundationPath);

let migrationNumber = 141;
for (const subject of subjects) {
  const lines = [`-- ${migrationNumber}: BrillaPrep ${subject.syllabusName} topic blueprint.`, '-- Internal evidence blueprint; not an official WAEC specification.', 'PRAGMA foreign_keys = ON;'];
  for (const [index, [code, title, objective]] of subject.topics.entries()) {
    lines.push(`INSERT OR IGNORE INTO topics (id, subject_id, name, slug, description, display_order) VALUES (${sql(topicId(subject, code))}, ${sql(subject.subjectId)}, ${sql(title)}, ${sql(`${subject.key}-b002-${code.split('-').at(-1)}`)}, ${sql(objective)}, ${index + 1});`);
    lines.push(`INSERT OR IGNORE INTO syllabus_topics (id, specification_id, topic_code, title, description, assessment_objectives, display_order) VALUES (${sql(syllabusTopicId(subject, code))}, ${sql(subject.specId)}, ${sql(code)}, ${sql(title)}, ${sql(objective)}, ${sql(JSON.stringify(assessmentObjectives))}, ${index + 1});`);
  }
  lines.push(`CREATE TABLE IF NOT EXISTS _migration_${migrationNumber}_guard (valid INTEGER NOT NULL CHECK (valid = 1));`, `DELETE FROM _migration_${migrationNumber}_guard;`);
  for (const [index, [code, title, objective]] of subject.topics.entries()) {
    lines.push(`INSERT INTO _migration_${migrationNumber}_guard(valid) SELECT CASE WHEN EXISTS (SELECT 1 FROM topics WHERE id = ${sql(topicId(subject, code))} AND subject_id IS ${sql(subject.subjectId)} AND name IS ${sql(title)} AND slug IS ${sql(`${subject.key}-b002-${code.split('-').at(-1)}`)} AND description IS ${sql(objective)} AND display_order IS ${index + 1}) AND EXISTS (SELECT 1 FROM syllabus_topics WHERE id = ${sql(syllabusTopicId(subject, code))} AND specification_id IS ${sql(subject.specId)} AND topic_code IS ${sql(code)} AND title IS ${sql(title)} AND description IS ${sql(objective)} AND assessment_objectives IS ${sql(JSON.stringify(assessmentObjectives))} AND display_order IS ${index + 1}) THEN 1 ELSE 0 END;`);
  }
  lines.push(`DROP TABLE _migration_${migrationNumber}_guard;`);
  const output = resolve(outputRoot, `database/migrations/${migrationNumber}_${subject.key}_beta_foundation.sql`);
  await writeFile(output, `${lines.join('\n')}\n`);
  migrationPaths.push(output);
  migrationNumber += 1;
}

for (const subject of subjects) {
  const questions = batch.subjects.find((entry) => entry.subjectId === subject.subjectId).questions;
  for (let part = 1; part <= 8; part += 1) {
    const partQuestions = questions.slice((part - 1) * 5, part * 5);
    const ids = partQuestions.map((question) => question.id);
    const guardTable = `_migration_${migrationNumber}_guard`;
    const lines = [
      `-- ${migrationNumber}: Original BrillaPrep WASSCE ${subject.syllabusName} questions, part ${part}.`,
      '-- Curriculum-aligned practice content; not official WAEC examination material.', 'PRAGMA foreign_keys = ON;',
      `CREATE TABLE IF NOT EXISTS ${guardTable} (valid INTEGER NOT NULL CHECK (valid = 1));`, `DELETE FROM ${guardTable};`,
    ];
    for (const question of partQuestions) {
      const values = questionValues(subject, question);
      lines.push(`INSERT INTO ${guardTable}(valid) SELECT CASE WHEN NOT EXISTS (SELECT 1 FROM questions q WHERE q.id = ${sql(question.id)} AND NOT (${canonicalMatch('q', values)})) AND NOT EXISTS (SELECT 1 FROM question_content_releases r WHERE r.question_id = ${sql(question.id)} AND NOT (${releaseMatch('r', subject)})) THEN 1 ELSE 0 END;`);
    }
    for (const question of partQuestions) {
      const values = questionValues(subject, question);
      lines.push(`INSERT OR IGNORE INTO questions (id, ${canonicalQuestionFields.join(', ')}) VALUES (${sql(question.id)}, ${canonicalQuestionFields.map((field) => sql(values[field])).join(', ')});`);
    }
    lines.push(
      `INSERT OR IGNORE INTO question_content_releases (question_id, batch_id, quality_assurance, release_channel, content_label, source_url, official_exam_board_content, feedback_enabled) SELECT id, ${sql(batchId)}, 'automated_beta', 'beta', ${sql(subject.contentLabel)}, ${sql(subject.releaseSourceUrl)}, 0, 1 FROM questions WHERE id IN (${ids.map(sql).join(', ')});`,
      `DELETE FROM ${guardTable};`,
      `INSERT INTO ${guardTable}(valid) SELECT CASE WHEN (SELECT COUNT(*) FROM questions WHERE id IN (${ids.map(sql).join(', ')})) = 5 AND (SELECT COUNT(*) FROM question_content_releases r WHERE r.question_id IN (${ids.map(sql).join(', ')}) AND ${releaseMatch('r', subject)}) = 5 THEN 1 ELSE 0 END;`,
      `DROP TABLE ${guardTable};`,
    );
    const output = resolve(outputRoot, `database/migrations/${migrationNumber}_${subject.key}_beta_part_${part}.sql`);
    await writeFile(output, `${lines.join('\n')}\n`);
    migrationPaths.push(output);
    migrationNumber += 1;
  }
}

const allIds = batch.subjects.flatMap((entry) => entry.questions.map((question) => question.id));
const finalGuardTable = `_migration_${migrationNumber}_guard`;
const finalReleaseClause = subjects
  .map((subject) => `(q.subject_id IS ${sql(subject.subjectId)} AND ${releaseMatch('r', subject)})`)
  .join(' OR ');
const finalLines = [
  `-- ${migrationNumber}: Final exact-set and relationship guard for WASSCE technical beta batch 002.`,
  'PRAGMA foreign_keys = ON;',
  `CREATE TABLE IF NOT EXISTS ${finalGuardTable} (valid INTEGER NOT NULL CHECK (valid = 1));`,
  `DELETE FROM ${finalGuardTable};`,
  `INSERT INTO ${finalGuardTable}(valid) SELECT CASE WHEN (SELECT COUNT(*) FROM questions q JOIN topics t ON t.id = q.topic_id JOIN syllabus_topics st ON st.id = q.syllabus_topic_id JOIN subject_specifications ss ON ss.id = st.specification_id JOIN question_content_releases r ON r.question_id = q.id WHERE q.id IN (${allIds.map(sql).join(', ')}) AND q.subject_id = t.subject_id AND q.subject_id = ss.subject_id AND q.exam_type_id = ss.exam_type_id AND q.exam_board_id = ss.exam_board_id AND q.question_type = 'multiple_choice' AND json_valid(q.options) AND json_array_length(q.options) = 4 AND q.correct_answer IN ('A','B','C','D') AND length(q.explanation) >= 80 AND (${finalReleaseClause})) = 80 AND (SELECT COUNT(*) FROM question_content_releases WHERE batch_id = ${sql(batchId)}) = 80 THEN 1 ELSE 0 END;`,
  `DROP TABLE ${finalGuardTable};`,
];
const finalOutput = resolve(outputRoot, `database/migrations/${migrationNumber}_wassce_technical_beta_final_guard.sql`);
await writeFile(finalOutput, `${finalLines.join('\n')}\n`);
migrationPaths.push(finalOutput);

console.log(JSON.stringify({ validation, outBatch, migrations: migrationPaths }, null, 2));
