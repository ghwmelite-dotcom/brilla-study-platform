import { useState } from 'react';
import { cn } from '@/utils';
import type { SimReportProps } from './types';

type GasTestsSimulationProps = SimReportProps;

interface GasInfo {
  name: string;
  formula: string;
  color: string;
  smell: string;
  tests: Array<{
    name: string;
    procedure: string;
    result: string;
    positive: boolean;
  }>;
  preparation: string;
}

const gases: Record<string, GasInfo> = {
  oxygen: {
    name: 'Oxygen',
    formula: 'O₂',
    color: '#e5e5e5',
    smell: 'Odorless',
    tests: [
      {
        name: 'Glowing Splint',
        procedure: 'Insert a glowing wooden splint into the gas',
        result: 'Splint RELIGHTS with a bright flame',
        positive: true,
      },
    ],
    preparation: '2H₂O₂ → 2H₂O + O₂ (with MnO₂ catalyst)',
  },
  hydrogen: {
    name: 'Hydrogen',
    formula: 'H₂',
    color: '#e5e5e5',
    smell: 'Odorless',
    tests: [
      {
        name: 'Burning Splint',
        procedure: 'Bring a burning splint to the mouth of the tube',
        result: 'SQUEAKY POP sound',
        positive: true,
      },
    ],
    preparation: 'Zn + 2HCl → ZnCl₂ + H₂',
  },
  carbon_dioxide: {
    name: 'Carbon Dioxide',
    formula: 'CO₂',
    color: '#e5e5e5',
    smell: 'Odorless',
    tests: [
      {
        name: 'Limewater Test',
        procedure: 'Bubble gas through limewater (Ca(OH)₂)',
        result: 'Limewater turns MILKY/CLOUDY',
        positive: true,
      },
      {
        name: 'Burning Splint',
        procedure: 'Insert burning splint into the gas',
        result: 'Flame is EXTINGUISHED',
        positive: true,
      },
    ],
    preparation: 'CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂',
  },
  chlorine: {
    name: 'Chlorine',
    formula: 'Cl₂',
    color: '#a3e635',
    smell: 'Pungent, choking',
    tests: [
      {
        name: 'Litmus Paper',
        procedure: 'Hold damp litmus paper in the gas',
        result: 'Litmus is BLEACHED white',
        positive: true,
      },
    ],
    preparation: 'MnO₂ + 4HCl → MnCl₂ + 2H₂O + Cl₂',
  },
  ammonia: {
    name: 'Ammonia',
    formula: 'NH₃',
    color: '#e5e5e5',
    smell: 'Pungent, sharp',
    tests: [
      {
        name: 'Red Litmus Paper',
        procedure: 'Hold damp red litmus paper in the gas',
        result: 'Red litmus turns BLUE (alkaline)',
        positive: true,
      },
      {
        name: 'HCl Fumes',
        procedure: 'Bring glass rod dipped in conc. HCl near gas',
        result: 'Dense WHITE FUMES of NH₄Cl',
        positive: true,
      },
    ],
    preparation: 'NH₄Cl + NaOH → NaCl + H₂O + NH₃',
  },
  sulfur_dioxide: {
    name: 'Sulfur Dioxide',
    formula: 'SO₂',
    color: '#e5e5e5',
    smell: 'Choking, like burnt matches',
    tests: [
      {
        name: 'Dichromate Paper',
        procedure: 'Hold paper soaked in acidified K₂Cr₂O₇',
        result: 'Orange turns GREEN',
        positive: true,
      },
      {
        name: 'Permanganate',
        procedure: 'Bubble through acidified KMnO₄',
        result: 'Purple is DECOLORIZED',
        positive: true,
      },
    ],
    preparation: 'Na₂SO₃ + 2HCl → 2NaCl + H₂O + SO₂',
  },
};

export function GasTestsSimulation({ onObservation, onAction }: GasTestsSimulationProps) {
  const [selectedGas, setSelectedGas] = useState<string | null>(null);
  const [currentTest, setCurrentTest] = useState<number | null>(null);
  const [testInProgress, setTestInProgress] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [completedTests, setCompletedTests] = useState<Set<string>>(new Set());

  const runTest = (gasKey: string, testIndex: number) => {
    const gas = gases[gasKey];
    const test = gas.tests[testIndex];

    setTestInProgress(true);
    setCurrentTest(testIndex);
    onObservation?.(`Testing for ${gas.name}: ${test.procedure}`);
    // Test reagent/tool selection.
    onAction?.('pour', 'app_test_tube');
    if (test.name.toLowerCase().includes('splint')) {
      onAction?.('drag', 'app_splint');
    }
    if (test.name.toLowerCase().includes('litmus')) {
      onAction?.('drag', 'app_litmus_paper');
    }

    setTimeout(() => {
      setTestResult(test.result);
      setCompletedTests(prev => new Set([...prev, `${gasKey}-${testIndex}`]));
      onObservation?.(`Result: ${test.result}`);
      onAction?.('observe', 'app_test_tube');
      onAction?.('observe', 'app_gas_jar');
      onAction?.('record', 'app_test_tube');
      onAction?.('record', 'app_gas_jar');

      setTimeout(() => {
        setTestInProgress(false);
        setTestResult(null);
        setCurrentTest(null);
      }, 3000);
    }, 2000);
  };

  const gas = selectedGas ? gases[selectedGas] : null;

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 text-white p-4 overflow-auto">
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Gas Tests Laboratory
        </h2>
        <p className="text-white/60 text-sm">Identification of Common Gases</p>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
        {/* Left Panel - Gas Selection */}
        <div className="lg:w-56 space-y-4 shrink-0">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-semibold mb-3 text-white/80">Select Gas</h3>
            <div className="space-y-2">
              {Object.entries(gases).map(([key, g]) => (
                <button
                  key={key}
                  onClick={() => {
                    setSelectedGas(key);
                    setCurrentTest(null);
                    setTestResult(null);
                    onObservation?.(`Selected ${g.name} (${g.formula})`);
                    // Gas preparation: generating the gas and connecting the
                    // delivery tube are UI-static here; selection is the
                    // honest observable preparation signal.
                    onAction?.('connect', 'app_delivery_tube');
                    onAction?.('heat', 'app_bunsen_burner');
                  }}
                  disabled={testInProgress}
                  className={cn(
                    'w-full p-3 rounded-lg text-left transition-all border',
                    selectedGas === key
                      ? 'bg-purple-500/20 border-purple-500/50'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{g.name}</span>
                    <span className="text-xs text-white/50 font-mono">{g.formula}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center - Testing Area */}
        <div className="flex-1 flex flex-col min-h-[300px]">
          {gas ? (
            <>
              {/* Gas Info */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-white">{gas.name} ({gas.formula})</h3>
                  <div
                    className="w-8 h-8 rounded-full border-2 border-white/20"
                    style={{ backgroundColor: gas.color }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-white/50">Appearance:</span>
                    <span className="ml-2 text-white/80">
                      {gas.color === '#e5e5e5' ? 'Colorless' : 'Yellow-green'}
                    </span>
                  </div>
                  <div>
                    <span className="text-white/50">Smell:</span>
                    <span className="ml-2 text-white/80">{gas.smell}</span>
                  </div>
                </div>
                <div className="mt-2 text-xs font-mono text-purple-300 bg-purple-500/10 p-2 rounded">
                  {gas.preparation}
                </div>
              </div>

              {/* Test Visualization */}
              <div className="flex-1 flex items-center justify-center bg-white/5 rounded-xl border border-white/10 mb-4">
                <svg viewBox="0 0 400 300" className="w-full h-full max-h-[250px]">
                  {/* Gas jar */}
                  <g transform="translate(150, 50)">
                    <rect x="0" y="0" width="100" height="150" fill="none" stroke="#94a3b8" strokeWidth="3" rx="5" />
                    <rect
                      x="5"
                      y="5"
                      width="90"
                      height="140"
                      fill={gas.color}
                      opacity={gas.color === '#e5e5e5' ? 0.1 : 0.3}
                      rx="3"
                    />

                    {/* Gas label */}
                    <text x="50" y="80" fill="#fff" fontSize="24" textAnchor="middle" fontWeight="bold">
                      {gas.formula}
                    </text>

                    {/* Lid */}
                    <rect x="-5" y="-10" width="110" height="15" fill="#374151" rx="3" />
                  </g>

                  {/* Test area */}
                  {currentTest !== null && (
                    <g transform="translate(280, 100)" className={testInProgress ? 'animate-pulse' : ''}>
                      {/* Splint for O2/H2/CO2 */}
                      {(selectedGas === 'oxygen' || selectedGas === 'hydrogen' || selectedGas === 'carbon_dioxide') && (
                        <>
                          <rect x="0" y="0" width="60" height="8" fill="#8b5a2b" rx="2" />
                          {selectedGas === 'oxygen' && testResult && (
                            <ellipse cx="5" cy="4" rx="10" ry="8" fill="#fbbf24" opacity="0.9" className="animate-pulse" />
                          )}
                          {selectedGas === 'hydrogen' && testResult && (
                            <g>
                              <circle cx="20" cy="4" r="15" fill="#fbbf24" opacity="0.7" className="animate-ping" />
                              <text x="20" y="40" fill="#fbbf24" fontSize="10" textAnchor="middle">POP!</text>
                            </g>
                          )}
                          {selectedGas === 'carbon_dioxide' && testResult && (
                            <line x1="-5" y1="4" x2="15" y2="4" stroke="#6b7280" strokeWidth="3" />
                          )}
                        </>
                      )}

                      {/* Litmus for Cl2/NH3 */}
                      {(selectedGas === 'chlorine' || selectedGas === 'ammonia') && (
                        <rect
                          x="0"
                          y="0"
                          width="40"
                          height="60"
                          fill={
                            testResult
                              ? selectedGas === 'chlorine'
                                ? '#ffffff'
                                : '#3b82f6'
                              : selectedGas === 'ammonia'
                                ? '#ef4444'
                                : '#3b82f6'
                          }
                          rx="2"
                        />
                      )}

                      {/* Limewater for CO2 */}
                      {selectedGas === 'carbon_dioxide' && gas.tests[currentTest]?.name === 'Limewater Test' && (
                        <g>
                          <rect x="0" y="20" width="50" height="60" fill="none" stroke="#94a3b8" strokeWidth="2" rx="3" />
                          <rect
                            x="5"
                            y="35"
                            width="40"
                            height="40"
                            fill={testResult ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)'}
                            rx="2"
                          />
                        </g>
                      )}

                      {/* Dichromate/Permanganate for SO2 */}
                      {selectedGas === 'sulfur_dioxide' && (
                        <g>
                          <rect x="0" y="20" width="50" height="60" fill="none" stroke="#94a3b8" strokeWidth="2" rx="3" />
                          <rect
                            x="5"
                            y="35"
                            width="40"
                            height="40"
                            fill={
                              testResult
                                ? gas.tests[currentTest]?.name === 'Dichromate Paper'
                                  ? '#22c55e'
                                  : '#e5e5e5'
                                : gas.tests[currentTest]?.name === 'Dichromate Paper'
                                  ? '#f97316'
                                  : '#a855f7'
                            }
                            rx="2"
                          />
                        </g>
                      )}

                      {/* HCl rod for NH3 */}
                      {selectedGas === 'ammonia' && gas.tests[currentTest]?.name === 'HCl Fumes' && (
                        <g>
                          <rect x="0" y="0" width="8" height="80" fill="#94a3b8" rx="2" />
                          {testResult && (
                            <g className="animate-pulse">
                              <ellipse cx="4" cy="10" rx="20" ry="10" fill="#fff" opacity="0.8" />
                              <ellipse cx="4" cy="20" rx="25" ry="12" fill="#fff" opacity="0.6" />
                            </g>
                          )}
                        </g>
                      )}
                    </g>
                  )}

                  {/* Result display */}
                  {testResult && (
                    <g>
                      <rect x="50" y="230" width="300" height="50" fill="#1f2937" stroke="#22c55e" strokeWidth="2" rx="10" />
                      <text x="200" y="260" fill="#22c55e" fontSize="12" textAnchor="middle" fontWeight="bold">
                        {testResult}
                      </text>
                    </g>
                  )}

                  {/* Instructions */}
                  {!testInProgress && !testResult && (
                    <text x="200" y="270" fill="#fff" fontSize="11" textAnchor="middle" opacity="0.6">
                      Select a test below to identify the gas
                    </text>
                  )}
                </svg>
              </div>

              {/* Available Tests */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h3 className="text-sm font-semibold mb-3 text-white/80">Available Tests</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {gas.tests.map((test, idx) => (
                    <button
                      key={idx}
                      onClick={() => runTest(selectedGas!, idx)}
                      disabled={testInProgress}
                      className={cn(
                        'p-3 rounded-lg text-left transition-all border',
                        completedTests.has(`${selectedGas}-${idx}`)
                          ? 'bg-emerald-500/20 border-emerald-500/50'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      )}
                    >
                      <div className="font-medium text-sm">{test.name}</div>
                      <div className="text-xs text-white/50 mt-1">{test.procedure}</div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-white/50">
                <div className="text-4xl mb-4">🧪</div>
                <p>Select a gas to begin testing</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Reference */}
        <div className="lg:w-56 space-y-4 shrink-0">
          {/* Quick Reference */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-semibold mb-3 text-white/80">Quick Reference</h3>
            <div className="space-y-2 text-xs">
              <div className="p-2 bg-white/5 rounded-lg">
                <div className="text-cyan-400 font-medium">O₂</div>
                <div className="text-white/50">Relights glowing splint</div>
              </div>
              <div className="p-2 bg-white/5 rounded-lg">
                <div className="text-cyan-400 font-medium">H₂</div>
                <div className="text-white/50">Squeaky pop</div>
              </div>
              <div className="p-2 bg-white/5 rounded-lg">
                <div className="text-cyan-400 font-medium">CO₂</div>
                <div className="text-white/50">Turns limewater milky</div>
              </div>
              <div className="p-2 bg-white/5 rounded-lg">
                <div className="text-yellow-400 font-medium">Cl₂</div>
                <div className="text-white/50">Bleaches litmus</div>
              </div>
              <div className="p-2 bg-white/5 rounded-lg">
                <div className="text-cyan-400 font-medium">NH₃</div>
                <div className="text-white/50">Turns red litmus blue</div>
              </div>
              <div className="p-2 bg-white/5 rounded-lg">
                <div className="text-cyan-400 font-medium">SO₂</div>
                <div className="text-white/50">Decolorizes KMnO₄</div>
              </div>
            </div>
          </div>

          {/* Completed Tests */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-semibold mb-3 text-white/80">Progress</h3>
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-400">
                {completedTests.size}
              </div>
              <div className="text-xs text-white/50">tests completed</div>
            </div>
          </div>

          {/* Safety */}
          <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20">
            <h3 className="text-sm font-semibold mb-2 text-red-400">⚠️ Safety</h3>
            <ul className="text-xs text-red-200/80 space-y-1">
              <li>• Work in fume cupboard for Cl₂, NH₃, SO₂</li>
              <li>• Never inhale gases directly</li>
              <li>• Wear safety goggles</li>
              <li>• H₂ is flammable - keep away from flames</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
