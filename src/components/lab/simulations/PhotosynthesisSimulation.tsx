import { useState, useEffect } from 'react';
import { cn } from '@/utils';
import type { SimReportProps } from './types';

type PhotosynthesisSimulationProps = SimReportProps;

type LeafCondition = 'normal' | 'covered' | 'variegated';
type Stage = 'setup' | 'destarch' | 'light_exposure' | 'decolorize' | 'test' | 'results';

interface LeafResult {
  condition: LeafCondition;
  starchPresent: boolean;
  explanation: string;
}

export function PhotosynthesisSimulation({ onObservation, onAction }: PhotosynthesisSimulationProps) {
  const [stage, setStage] = useState<Stage>('setup');
  const [selectedLeaf, setSelectedLeaf] = useState<LeafCondition>('normal');
  const [destarchTime, setDestarchTime] = useState(0);
  const [lightExposure, setLightExposure] = useState(0);
  const [isBoiling, setIsBoiling] = useState(false);
  const [boilingStage, setBoilingStage] = useState<'water' | 'ethanol' | null>(null);
  const [boilingProgress, setBoilingProgress] = useState(0);
  const [results, setResults] = useState<LeafResult[]>([]);
  // Track internal state (not displayed but needed for logic)
  const [, setIodineApplied] = useState(false);

  // De-starching simulation (48 hours in dark, accelerated)
  useEffect(() => {
    if (stage !== 'destarch') return;

    const interval = setInterval(() => {
      setDestarchTime(prev => {
        if (prev >= 100) {
          onObservation?.('Plant de-starched after 48 hours in darkness');
          setStage('light_exposure');
          return 100;
        }
        if (prev === 50) {
          onObservation?.('De-starching in progress - stored starch being used up');
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [stage, onObservation]);

  // Light exposure simulation
  useEffect(() => {
    if (stage !== 'light_exposure') return;

    const interval = setInterval(() => {
      setLightExposure(prev => {
        if (prev >= 100) {
          onObservation?.('Light exposure complete - photosynthesis occurred in illuminated areas');
          setStage('decolorize');
          return 100;
        }
        if (prev === 30) {
          onObservation?.('Photosynthesis occurring - glucose being produced and converted to starch');
        }
        return prev + 1;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [stage, onObservation]);

  // Boiling simulation
  useEffect(() => {
    if (!isBoiling) return;

    const interval = setInterval(() => {
      setBoilingProgress(prev => {
        if (prev >= 100) {
          setIsBoiling(false);
          if (boilingStage === 'water') {
            onObservation?.('Leaf softened in boiling water - cell membranes disrupted');
          } else {
            onObservation?.('Chlorophyll removed - leaf is now pale/white');
            onAction?.('observe', 'app_test_tube');
          }
          return 100;
        }
        return prev + 3;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isBoiling, boilingStage, onObservation, onAction]);

  const startDestarch = () => {
    setStage('destarch');
    onObservation?.('Placing plant in dark cupboard for de-starching (simulated 48 hours)');
    onAction?.('record', 'app_forceps');
  };

  const boilInWater = () => {
    setBoilingStage('water');
    setBoilingProgress(0);
    setIsBoiling(true);
    onObservation?.('Boiling leaf in water to kill cells and stop reactions');
    onAction?.('drag', 'app_beaker_250');
    onAction?.('pour', 'app_beaker_250');
    onAction?.('heat', 'app_bunsen_burner');
  };

  const boilInEthanol = () => {
    if (boilingProgress < 100 || boilingStage !== 'water') {
      onObservation?.('Must boil in water first');
      return;
    }
    setBoilingStage('ethanol');
    setBoilingProgress(0);
    setIsBoiling(true);
    onObservation?.('Boiling in ethanol to remove chlorophyll (using water bath for safety)');
    onAction?.('drag', 'app_test_tube');
    onAction?.('heat', 'app_bunsen_burner');
  };

  const applyIodine = () => {
    if (boilingStage !== 'ethanol' || boilingProgress < 100) {
      onObservation?.('Must decolorize leaf first');
      return;
    }
    setIodineApplied(true);
    setStage('test');
    onObservation?.('Applying iodine solution to test for starch');
    // Leaf placed on the petri dish and iodine added.
    onAction?.('pour', 'app_petri_dish');

    // Generate results after a delay
    setTimeout(() => {
      const leafResults: LeafResult[] = [
        {
          condition: 'normal',
          starchPresent: true,
          explanation: 'Blue-black color indicates starch present - photosynthesis occurred',
        },
        {
          condition: 'covered',
          starchPresent: false,
          explanation: 'Brown/yellow color - no starch, light was blocked so no photosynthesis',
        },
        {
          condition: 'variegated',
          starchPresent: selectedLeaf === 'variegated',
          explanation: 'Green parts: blue-black (starch). White parts: brown (no chlorophyll, no photosynthesis)',
        },
      ];

      const result = leafResults.find(r => r.condition === selectedLeaf)!;
      setResults([result]);
      onObservation?.(result.explanation);
      onAction?.('observe', 'app_petri_dish');
      onAction?.('record', 'app_petri_dish');
      setStage('results');
    }, 2000);
  };

  const resetExperiment = () => {
    setStage('setup');
    setSelectedLeaf('normal');
    setDestarchTime(0);
    setLightExposure(0);
    setIsBoiling(false);
    setBoilingStage(null);
    setBoilingProgress(0);
    setIodineApplied(false);
    setResults([]);
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-900 via-green-900/20 to-slate-900 text-white p-4 overflow-auto">
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
          Photosynthesis Investigation
        </h2>
        <p className="text-white/60 text-sm">Testing for Starch Production in Leaves</p>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
        {/* Left Panel - Controls */}
        <div className="lg:w-56 space-y-4 shrink-0">
          {/* Stage Progress */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-semibold mb-3 text-white/80">Procedure</h3>
            <div className="space-y-2">
              {[
                { key: 'setup', label: 'Select leaf type' },
                { key: 'destarch', label: 'De-starch plant' },
                { key: 'light_exposure', label: 'Light exposure' },
                { key: 'decolorize', label: 'Decolorize leaf' },
                { key: 'test', label: 'Iodine test' },
                { key: 'results', label: 'Observe results' },
              ].map((s, idx) => (
                <div
                  key={s.key}
                  className={cn(
                    'flex items-center gap-2 text-xs',
                    stage === s.key ? 'text-green-400' :
                    ['setup', 'destarch', 'light_exposure', 'decolorize', 'test', 'results'].indexOf(s.key) < ['setup', 'destarch', 'light_exposure', 'decolorize', 'test', 'results'].indexOf(stage) ? 'text-emerald-400' : 'text-white/30'
                  )}
                >
                  <div className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center text-xs border',
                    stage === s.key ? 'bg-green-500/20 border-green-500' :
                    ['setup', 'destarch', 'light_exposure', 'decolorize', 'test', 'results'].indexOf(s.key) < ['setup', 'destarch', 'light_exposure', 'decolorize', 'test', 'results'].indexOf(stage) ? 'bg-emerald-500/20 border-emerald-500' : 'border-white/20'
                  )}>
                    {idx + 1}
                  </div>
                  {s.label}
                </div>
              ))}
            </div>
          </div>

          {/* Leaf Selection */}
          {stage === 'setup' && (
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="text-sm font-semibold mb-3 text-white/80">Select Leaf Type</h3>
              <div className="space-y-2">
                {[
                  { key: 'normal', label: 'Normal green leaf', desc: 'Full light exposure' },
                  { key: 'covered', label: 'Partially covered', desc: 'Black paper covers part' },
                  { key: 'variegated', label: 'Variegated leaf', desc: 'Green and white regions' },
                ].map((leaf) => (
                  <button
                    key={leaf.key}
                    onClick={() => {
                      setSelectedLeaf(leaf.key as LeafCondition);
                      // Leaf handling with forceps onto the petri dish.
                      onAction?.('drag', 'app_petri_dish');
                      onAction?.('drag', 'app_forceps');
                    }}
                    className={cn(
                      'w-full p-3 rounded-lg text-left transition-all border',
                      selectedLeaf === leaf.key
                        ? 'bg-green-500/20 border-green-500/50'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    )}
                  >
                    <div className="font-medium text-sm">{leaf.label}</div>
                    <div className="text-xs text-white/50">{leaf.desc}</div>
                  </button>
                ))}
              </div>
              <button
                onClick={startDestarch}
                className="w-full mt-3 py-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all"
              >
                Begin Experiment
              </button>
            </div>
          )}

          {/* Decolorization Controls */}
          {stage === 'decolorize' && (
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="text-sm font-semibold mb-3 text-white/80">Decolorization</h3>
              <div className="space-y-2">
                <button
                  onClick={boilInWater}
                  disabled={isBoiling || (boilingStage === 'water' && boilingProgress >= 100)}
                  className={cn(
                    'w-full py-2 rounded-lg text-sm font-medium transition-all',
                    boilingStage === 'water' && boilingProgress >= 100
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                      : isBoiling && boilingStage === 'water'
                        ? 'bg-orange-600 animate-pulse'
                        : 'bg-orange-600 hover:bg-orange-700'
                  )}
                >
                  {boilingStage === 'water' && boilingProgress >= 100 ? '✓ Boiled in water' :
                   isBoiling && boilingStage === 'water' ? 'Boiling...' : 'Boil in water'}
                </button>
                <button
                  onClick={boilInEthanol}
                  disabled={isBoiling || (boilingStage !== 'water' && boilingStage !== 'ethanol') || (boilingStage === 'water' && boilingProgress < 100) || (boilingStage === 'ethanol' && boilingProgress >= 100)}
                  className={cn(
                    'w-full py-2 rounded-lg text-sm font-medium transition-all',
                    boilingStage === 'ethanol' && boilingProgress >= 100
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                      : isBoiling && boilingStage === 'ethanol'
                        ? 'bg-amber-600 animate-pulse'
                        : boilingStage === 'water' && boilingProgress >= 100
                          ? 'bg-amber-600 hover:bg-amber-700'
                          : 'bg-white/10 text-white/30 cursor-not-allowed'
                  )}
                >
                  {boilingStage === 'ethanol' && boilingProgress >= 100 ? '✓ Decolorized' :
                   isBoiling && boilingStage === 'ethanol' ? 'Removing chlorophyll...' : 'Boil in ethanol'}
                </button>
                <button
                  onClick={applyIodine}
                  disabled={boilingStage !== 'ethanol' || boilingProgress < 100}
                  className={cn(
                    'w-full py-2 rounded-lg text-sm font-medium transition-all',
                    boilingStage === 'ethanol' && boilingProgress >= 100
                      ? 'bg-amber-700 hover:bg-amber-800'
                      : 'bg-white/10 text-white/30 cursor-not-allowed'
                  )}
                >
                  Apply Iodine Solution
                </button>
              </div>
              {isBoiling && (
                <div className="mt-3">
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full transition-all',
                        boilingStage === 'water' ? 'bg-orange-500' : 'bg-amber-500'
                      )}
                      style={{ width: `${boilingProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Results */}
          {stage === 'results' && results.length > 0 && (
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="text-sm font-semibold mb-3 text-white/80">Result</h3>
              <div className={cn(
                'p-3 rounded-lg border',
                results[0].starchPresent
                  ? 'bg-blue-500/20 border-blue-500/50'
                  : 'bg-amber-500/20 border-amber-500/50'
              )}>
                <div className={cn(
                  'font-medium mb-1',
                  results[0].starchPresent ? 'text-blue-400' : 'text-amber-400'
                )}>
                  {results[0].starchPresent ? 'Starch PRESENT' : 'No Starch'}
                </div>
                <p className="text-xs text-white/70">{results[0].explanation}</p>
              </div>
              <button
                onClick={resetExperiment}
                className="w-full mt-3 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition-all"
              >
                Try Another Leaf
              </button>
            </div>
          )}
        </div>

        {/* Center - Visualization */}
        <div className="flex-1 flex items-center justify-center min-h-[300px]">
          <svg viewBox="0 0 500 400" className="w-full h-full max-h-[400px]">
            {/* De-starching (dark cupboard) */}
            {stage === 'destarch' && (
              <g transform="translate(150, 100)">
                <rect x="0" y="0" width="200" height="200" fill="#1f2937" stroke="#374151" strokeWidth="3" rx="10" />
                <text x="100" y="30" fill="#fff" fontSize="12" textAnchor="middle" opacity="0.5">Dark Cupboard</text>

                {/* Plant in pot */}
                <g transform="translate(70, 60)">
                  <rect x="10" y="80" width="40" height="40" fill="#8b4513" rx="3" />
                  <rect x="0" y="70" width="60" height="15" fill="#a0522d" rx="2" />
                  {/* Leaves */}
                  <ellipse cx="30" cy="50" rx="25" ry="15" fill="#22c55e" opacity={1 - destarchTime / 200} />
                  <ellipse cx="20" cy="60" rx="20" ry="12" fill="#16a34a" opacity={1 - destarchTime / 200} />
                  <ellipse cx="40" cy="65" rx="18" ry="10" fill="#15803d" opacity={1 - destarchTime / 200} />
                </g>

                {/* Progress */}
                <text x="100" y="180" fill="#fff" fontSize="11" textAnchor="middle">
                  De-starching: {destarchTime}%
                </text>
              </g>
            )}

            {/* Light exposure */}
            {stage === 'light_exposure' && (
              <g transform="translate(100, 80)">
                {/* Sun */}
                <circle cx="150" cy="30" r="30" fill="#fbbf24" className="animate-pulse" />
                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                  <line
                    key={i}
                    x1={150 + Math.cos(angle * Math.PI / 180) * 35}
                    y1={30 + Math.sin(angle * Math.PI / 180) * 35}
                    x2={150 + Math.cos(angle * Math.PI / 180) * 50}
                    y2={30 + Math.sin(angle * Math.PI / 180) * 50}
                    stroke="#fbbf24"
                    strokeWidth="3"
                  />
                ))}

                {/* Plant with selected leaf type */}
                <g transform="translate(100, 100)">
                  <rect x="30" y="100" width="40" height="40" fill="#8b4513" rx="3" />
                  <rect x="20" y="90" width="60" height="15" fill="#a0522d" rx="2" />

                  {/* Leaf based on type */}
                  {selectedLeaf === 'normal' && (
                    <ellipse cx="50" cy="60" rx="35" ry="20" fill="#22c55e" />
                  )}
                  {selectedLeaf === 'covered' && (
                    <g>
                      <ellipse cx="50" cy="60" rx="35" ry="20" fill="#22c55e" />
                      {/* Black paper covering */}
                      <rect x="30" y="50" width="20" height="25" fill="#1f2937" stroke="#000" strokeWidth="1" />
                      <text x="40" y="65" fill="#fff" fontSize="8" textAnchor="middle">covered</text>
                    </g>
                  )}
                  {selectedLeaf === 'variegated' && (
                    <g>
                      <ellipse cx="50" cy="60" rx="35" ry="20" fill="#22c55e" />
                      <ellipse cx="55" cy="60" rx="15" ry="12" fill="#f5f5dc" />
                      <text x="80" y="45" fill="#fff" fontSize="8">white region</text>
                    </g>
                  )}
                </g>

                {/* Light rays */}
                {[...Array(5)].map((_, i) => (
                  <line
                    key={i}
                    x1={120 + i * 20}
                    y1={70}
                    x2={120 + i * 20}
                    y2={150}
                    stroke="#fbbf24"
                    strokeWidth="2"
                    opacity={0.3}
                    strokeDasharray="5,5"
                  />
                ))}

                <text x="150" y="220" fill="#fff" fontSize="11" textAnchor="middle">
                  Light exposure: {lightExposure}%
                </text>
              </g>
            )}

            {/* Decolorization */}
            {stage === 'decolorize' && (
              <g transform="translate(100, 100)">
                {/* Bunsen burner */}
                <g transform="translate(100, 150)">
                  <rect x="20" y="20" width="60" height="15" fill="#444" rx="2" />
                  <rect x="35" y="0" width="30" height="25" fill="#555" rx="2" />
                  {isBoiling && (
                    <g className="animate-pulse">
                      <ellipse cx="50" cy="-10" rx="10" ry="18" fill="#fbbf24" />
                      <ellipse cx="50" cy="-15" rx="6" ry="12" fill="#f97316" />
                    </g>
                  )}
                </g>

                {/* Water bath beaker */}
                <rect x="100" y="80" width="100" height="80" fill="none" stroke="#94a3b8" strokeWidth="3" rx="5" />
                <rect x="105" y="100" width="90" height="55" fill="rgba(59, 130, 246, 0.3)" rx="3" />

                {/* Test tube in water bath */}
                <rect x="135" y="60" width="30" height="90" fill="none" stroke="#94a3b8" strokeWidth="2" rx="3" />
                <rect
                  x="138"
                  y="80"
                  width="24"
                  height="65"
                  fill={
                    boilingStage === 'ethanol'
                      ? boilingProgress >= 100
                        ? 'rgba(245, 245, 220, 0.5)'
                        : `rgba(34, 197, 94, ${1 - boilingProgress / 100})`
                      : 'rgba(34, 197, 94, 0.5)'
                  }
                  rx="2"
                />

                {/* Ethanol label */}
                {boilingStage === 'ethanol' && (
                  <text x="150" y="55" fill="#f59e0b" fontSize="10" textAnchor="middle">Ethanol</text>
                )}

                {/* Steam */}
                {isBoiling && (
                  <g className="animate-pulse" opacity="0.5">
                    <path d="M 140 75 Q 135 55 145 40" fill="none" stroke="#e5e5e5" strokeWidth="2" />
                    <path d="M 155 75 Q 150 55 160 40" fill="none" stroke="#e5e5e5" strokeWidth="2" />
                  </g>
                )}

                <text x="150" y="200" fill="#fff" fontSize="11" textAnchor="middle">
                  {boilingStage === 'water' && isBoiling && 'Softening leaf in boiling water...'}
                  {boilingStage === 'water' && !isBoiling && boilingProgress >= 100 && 'Water bath ready - add ethanol'}
                  {boilingStage === 'ethanol' && isBoiling && 'Removing chlorophyll in ethanol...'}
                  {boilingStage === 'ethanol' && !isBoiling && boilingProgress >= 100 && 'Leaf decolorized - apply iodine'}
                </text>
              </g>
            )}

            {/* Iodine test & Results */}
            {(stage === 'test' || stage === 'results') && (
              <g transform="translate(150, 100)">
                {/* White tile */}
                <rect x="20" y="80" width="160" height="100" fill="#f5f5f5" stroke="#d4d4d4" strokeWidth="2" rx="5" />

                {/* Leaf on tile */}
                <ellipse
                  cx="100"
                  cy="130"
                  rx="50"
                  ry="30"
                  fill={
                    stage === 'results'
                      ? results[0]?.starchPresent
                        ? '#1e3a5f' // Blue-black for starch
                        : '#8b4513' // Brown for no starch
                      : '#f5f5dc' // Decolorized leaf
                  }
                  stroke="#d4d4d4"
                  strokeWidth="1"
                />

                {/* Variegated pattern */}
                {selectedLeaf === 'variegated' && stage === 'results' && (
                  <ellipse
                    cx="110"
                    cy="130"
                    rx="20"
                    ry="15"
                    fill="#8b4513" // No starch in white region
                  />
                )}

                {/* Covered region */}
                {selectedLeaf === 'covered' && stage === 'results' && (
                  <rect x="70" y="115" width="30" height="30" fill="#8b4513" rx="3" />
                )}

                {/* Iodine dropper */}
                {stage === 'test' && (
                  <g transform="translate(80, 40)" className="animate-bounce">
                    <rect x="0" y="0" width="15" height="50" fill="#8b4513" rx="3" />
                    <ellipse cx="7.5" cy="55" rx="5" ry="3" fill="#8b4513" />
                    <circle cx="7.5" cy="60" r="4" fill="#d97706" />
                  </g>
                )}

                <text x="100" y="210" fill="#fff" fontSize="11" textAnchor="middle">
                  {stage === 'test' && 'Applying iodine solution...'}
                  {stage === 'results' && (selectedLeaf === 'normal'
                    ? 'Entire leaf: Blue-black (starch present)'
                    : selectedLeaf === 'covered'
                      ? 'Exposed: Blue-black | Covered: Brown'
                      : 'Green parts: Blue-black | White parts: Brown')}
                </text>
              </g>
            )}

            {/* Equation */}
            <text x="250" y="30" fill="#fff" fontSize="10" textAnchor="middle" fontFamily="monospace">
              6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂ (light + chlorophyll)
            </text>
          </svg>
        </div>

        {/* Right Panel - Info */}
        <div className="lg:w-56 space-y-4 shrink-0">
          {/* Key Points */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-semibold mb-3 text-white/80">Key Points</h3>
            <ul className="text-xs text-white/60 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-green-400">•</span>
                <span>Starch = evidence of photosynthesis</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">•</span>
                <span>Iodine: brown → blue-black = starch present</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">•</span>
                <span>Light is required for photosynthesis</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">•</span>
                <span>Chlorophyll is required (green pigment)</span>
              </li>
            </ul>
          </div>

          {/* Control Experiments */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-semibold mb-3 text-white/80">Control Variables</h3>
            <div className="space-y-2 text-xs">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <span className="text-green-400 font-medium">Covered leaf:</span>
                <span className="text-white/60 ml-1">Tests need for light</span>
              </div>
              <div className="p-2 bg-green-500/10 rounded-lg">
                <span className="text-green-400 font-medium">Variegated:</span>
                <span className="text-white/60 ml-1">Tests need for chlorophyll</span>
              </div>
            </div>
          </div>

          {/* Why De-starch */}
          <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20">
            <h3 className="text-sm font-semibold mb-2 text-amber-400">Why De-starch?</h3>
            <p className="text-xs text-amber-200/80">
              De-starching ensures any starch found is from recent photosynthesis,
              not stored starch from before the experiment.
            </p>
          </div>

          {/* Safety */}
          <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20">
            <h3 className="text-sm font-semibold mb-2 text-red-400">Safety</h3>
            <ul className="text-xs text-red-200/80 space-y-1">
              <li>• Ethanol is flammable - use water bath</li>
              <li>• Handle hot apparatus carefully</li>
              <li>• Iodine stains - wear lab coat</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
