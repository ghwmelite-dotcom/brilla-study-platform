import { useState, useEffect } from 'react';
import { cn } from '@/utils';
import type { SimReportProps } from './types';
import { simRootBackground } from './simTheme';

type ElectrolysisSimulationProps = SimReportProps;

export function ElectrolysisSimulation({ onObservation, onAction }: ElectrolysisSimulationProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [voltage, setVoltage] = useState(6);
  const [current, setCurrent] = useState(0);
  const [time, setTime] = useState(0);
  const [anodeGas, setAnodeGas] = useState(0); // Chlorine at anode
  const [cathodeGas, setCathodeGas] = useState(0); // Hydrogen at cathode
  const [testingGas, setTestingGas] = useState<'anode' | 'cathode' | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [observations, setObservations] = useState<string[]>([]);
  const [showEquations, setShowEquations] = useState(false);

  // Bubbles animation state
  const [anodeBubbles, setAnodeBubbles] = useState<Array<{ id: number; x: number; delay: number }>>([]);
  const [cathodeBubbles, setCathodeBubbles] = useState<Array<{ id: number; x: number; delay: number }>>([]);

  // Electrolysis effect
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTime(prev => prev + 1);

      // Calculate current based on voltage (simplified Ohm's law with electrolyte resistance)
      const calculatedCurrent = voltage / 15; // ~15 ohm resistance
      setCurrent(calculatedCurrent);

      // Gas production rate proportional to current (Faraday's law simplified)
      const gasRate = calculatedCurrent * 0.5;
      setAnodeGas(prev => Math.min(prev + gasRate, 100));
      setCathodeGas(prev => Math.min(prev + gasRate * 2, 100)); // H2 produced at 2x rate

      // Add observations at certain points
      if (time === 5 && !observations.includes('bubbles_start')) {
        onObservation?.('Bubbles begin to form at both electrodes');
        onAction?.('observe', 'app_electrolysis_cell');
        setObservations(prev => [...prev, 'bubbles_start']);
      }
      if (time === 15 && !observations.includes('yellow_green')) {
        onObservation?.('Yellowish-green gas collecting at anode (chlorine)');
        onAction?.('observe', 'app_gas_jar');
        setObservations(prev => [...prev, 'yellow_green']);
      }
      if (time === 20 && !observations.includes('colorless')) {
        onObservation?.('Colorless gas collecting at cathode (hydrogen)');
        onAction?.('observe', 'app_gas_jar');
        setObservations(prev => [...prev, 'colorless']);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [isRunning, voltage, time, observations, onObservation, onAction]);

  // Generate bubbles
  useEffect(() => {
    if (!isRunning) return;

    const bubbleInterval = setInterval(() => {
      // Anode bubbles (chlorine - yellowish)
      setAnodeBubbles(prev => {
        const newBubbles = [...prev.filter(b => Date.now() - b.id < 2000)];
        if (Math.random() > 0.3) {
          newBubbles.push({
            id: Date.now(),
            x: 85 + Math.random() * 20,
            delay: Math.random() * 0.5,
          });
        }
        return newBubbles;
      });

      // Cathode bubbles (hydrogen - colorless)
      setCathodeBubbles(prev => {
        const newBubbles = [...prev.filter(b => Date.now() - b.id < 2000)];
        if (Math.random() > 0.2) {
          newBubbles.push({
            id: Date.now(),
            x: 295 + Math.random() * 20,
            delay: Math.random() * 0.5,
          });
        }
        return newBubbles;
      });
    }, 150);

    return () => clearInterval(bubbleInterval);
  }, [isRunning]);

  const startElectrolysis = () => {
    setIsRunning(true);
    onObservation?.(`Starting electrolysis at ${voltage}V`);
    // Cell, electrodes, and supply are pre-placed in this sim, so starting
    // the run is the honest observable signal that the circuit is connected
    // and the cell filled with brine.
    onAction?.('connect', 'app_carbon_electrodes');
    onAction?.('connect', 'app_dc_power_supply');
    onAction?.('pour', 'app_electrolysis_cell');
    onAction?.('adjust', 'app_dc_power_supply', voltage);
  };

  const stopElectrolysis = () => {
    setIsRunning(false);
    onObservation?.('Electrolysis stopped');
  };

  const testGas = (electrode: 'anode' | 'cathode') => {
    setTestingGas(electrode);

    setTimeout(() => {
      if (electrode === 'anode') {
        // Chlorine test - bleaches litmus
        setTestResult('Damp litmus paper is BLEACHED - confirms CHLORINE (Cl₂)');
        onObservation?.('Anode gas bleaches damp blue litmus paper - Chlorine confirmed');
        onAction?.('drag', 'app_litmus_paper');
      } else {
        // Hydrogen test - squeaky pop
        setTestResult('SQUEAKY POP heard with burning splint - confirms HYDROGEN (H₂)');
        onObservation?.('Cathode gas gives a squeaky pop with burning splint - Hydrogen confirmed');
        onAction?.('drag', 'app_splint');
      }
      onAction?.('record', 'app_electrolysis_cell');

      setTimeout(() => {
        setTestingGas(null);
        setTestResult(null);
      }, 3000);
    }, 1500);
  };

  const resetExperiment = () => {
    setIsRunning(false);
    setTime(0);
    setCurrent(0);
    setAnodeGas(0);
    setCathodeGas(0);
    setObservations([]);
    setTestingGas(null);
    setTestResult(null);
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 text-white p-4 overflow-auto" style={simRootBackground('rgba(49, 46, 129, 0.3)')}>
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-green-400 bg-clip-text text-transparent">
          Electrolysis of Brine
        </h2>
        <p className="text-white/60 text-sm">Concentrated Sodium Chloride Solution</p>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
        {/* Left Panel - Controls */}
        <div className="lg:w-56 space-y-4 shrink-0">
          {/* Voltage Control */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-semibold mb-3 text-white/80">Power Supply</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-white/60 block mb-1">Voltage (V)</label>
                <input
                  type="range"
                  min="3"
                  max="12"
                  value={voltage}
                  onChange={(e) => setVoltage(Number(e.target.value))}
                  disabled={isRunning}
                  className="w-full accent-yellow-500"
                />
                <div className="flex justify-between text-sm">
                  <span className="font-mono text-yellow-400">{voltage}V</span>
                  <span className="font-mono text-cyan-400">{current.toFixed(2)}A</span>
                </div>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-semibold mb-3 text-white/80">Status</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/60">Time:</span>
                <span className="font-mono">{Math.floor(time / 5)}s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Cl₂ collected:</span>
                <span className="font-mono text-yellow-400">{anodeGas.toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">H₂ collected:</span>
                <span className="font-mono text-cyan-400">{cathodeGas.toFixed(0)}%</span>
              </div>
            </div>
          </div>

          {/* Gas Tests */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-semibold mb-3 text-white/80">Gas Tests</h3>
            <div className="space-y-2">
              <button
                onClick={() => testGas('anode')}
                disabled={anodeGas < 30 || testingGas !== null}
                className={cn(
                  'w-full py-2 rounded-lg text-sm font-medium transition-all',
                  anodeGas >= 30 && testingGas === null
                    ? 'bg-yellow-600 hover:bg-yellow-700'
                    : 'bg-white/10 text-white/30 cursor-not-allowed'
                )}
              >
                Test Anode Gas (Litmus)
              </button>
              <button
                onClick={() => testGas('cathode')}
                disabled={cathodeGas < 30 || testingGas !== null}
                className={cn(
                  'w-full py-2 rounded-lg text-sm font-medium transition-all',
                  cathodeGas >= 30 && testingGas === null
                    ? 'bg-cyan-600 hover:bg-cyan-700'
                    : 'bg-white/10 text-white/30 cursor-not-allowed'
                )}
              >
                Test Cathode Gas (Splint)
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            {!isRunning ? (
              <button
                onClick={startElectrolysis}
                className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all"
              >
                Start Electrolysis
              </button>
            ) : (
              <button
                onClick={stopElectrolysis}
                className="w-full py-3 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl font-medium hover:from-red-700 hover:to-orange-700 transition-all"
              >
                Stop
              </button>
            )}
            <button
              onClick={resetExperiment}
              className="w-full py-2 bg-white/10 rounded-xl text-sm hover:bg-white/20 transition-all"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Center - Apparatus */}
        <div className="flex-1 flex items-center justify-center min-h-[350px]">
          <svg viewBox="0 0 500 400" className="w-full h-full max-h-[400px]">
            <defs>
              <linearGradient id="brineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#64748b" stopOpacity="0.5" />
              </linearGradient>
              <linearGradient id="chlorineGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="transparent" />
                <stop offset="100%" stopColor="#84cc16" stopOpacity="0.6" />
              </linearGradient>
              <linearGradient id="hydrogenGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="transparent" />
                <stop offset="100%" stopColor="#e5e5e5" stopOpacity="0.3" />
              </linearGradient>
            </defs>

            {/* Power Supply */}
            <g transform="translate(180, 20)">
              <rect x="0" y="0" width="140" height="50" fill="#374151" rx="5" stroke="#4b5563" strokeWidth="2" />
              <text x="70" y="20" fill="#fff" fontSize="10" textAnchor="middle">DC POWER SUPPLY</text>
              <text x="70" y="38" fill="#22c55e" fontSize="14" textAnchor="middle" fontFamily="monospace">
                {voltage}V | {current.toFixed(2)}A
              </text>
              {/* Indicator light */}
              <circle cx="120" cy="25" r="5" fill={isRunning ? '#22c55e' : '#6b7280'} />
            </g>

            {/* Wires */}
            <path d="M 200 70 L 200 120 L 95 120 L 95 180" fill="none" stroke="#ef4444" strokeWidth="3" />
            <path d="M 300 70 L 300 120 L 305 120 L 305 180" fill="none" stroke="#3b82f6" strokeWidth="3" />

            {/* Labels on wires */}
            <text x="95" y="145" fill="#ef4444" fontSize="10" textAnchor="middle">+ Anode</text>
            <text x="305" y="145" fill="#3b82f6" fontSize="10" textAnchor="middle">- Cathode</text>

            {/* Electrolysis Cell */}
            <g transform="translate(50, 180)">
              {/* Cell container */}
              <rect x="0" y="0" width="300" height="180" fill="none" stroke="#94a3b8" strokeWidth="4" rx="5" />

              {/* Brine solution */}
              <rect x="5" y="40" width="290" height="135" fill="url(#brineGrad)" rx="3" />

              {/* Anode (Carbon/Graphite) */}
              <rect x="35" y="0" width="30" height="140" fill="#1f2937" stroke="#374151" strokeWidth="2" />
              <text x="50" y="-10" fill="#ef4444" fontSize="11" textAnchor="middle" fontWeight="bold">ANODE (+)</text>

              {/* Cathode (Carbon/Graphite) */}
              <rect x="235" y="0" width="30" height="140" fill="#1f2937" stroke="#374151" strokeWidth="2" />
              <text x="250" y="-10" fill="#3b82f6" fontSize="11" textAnchor="middle" fontWeight="bold">CATHODE (-)</text>

              {/* Gas collection tubes */}
              {/* Anode tube (chlorine) */}
              <rect x="30" y="-80" width="40" height="120" fill="none" stroke="#94a3b8" strokeWidth="2" rx="3" />
              <rect x="32" y={-78 + (100 - anodeGas)} width="36" height={anodeGas} fill="url(#chlorineGrad)" rx="2" />

              {/* Cathode tube (hydrogen) */}
              <rect x="230" y="-80" width="40" height="120" fill="none" stroke="#94a3b8" strokeWidth="2" rx="3" />
              <rect x="232" y={-78 + (100 - cathodeGas)} width="36" height={cathodeGas} fill="url(#hydrogenGrad)" rx="2" />

              {/* Bubbles at anode */}
              {isRunning && anodeBubbles.map((bubble) => (
                <circle
                  key={bubble.id}
                  cx={bubble.x - 50}
                  cy={120 - ((Date.now() - bubble.id) / 20)}
                  r={2 + Math.random()}
                  fill="#a3e635"
                  opacity={0.7}
                />
              ))}

              {/* Bubbles at cathode */}
              {isRunning && cathodeBubbles.map((bubble) => (
                <circle
                  key={bubble.id}
                  cx={bubble.x - 50}
                  cy={120 - ((Date.now() - bubble.id) / 15)}
                  r={2 + Math.random()}
                  fill="#e5e5e5"
                  opacity={0.6}
                />
              ))}

              {/* Labels */}
              <text x="50" y="165" fill="#a3e635" fontSize="10" textAnchor="middle">Cl₂</text>
              <text x="250" y="165" fill="#e5e5e5" fontSize="10" textAnchor="middle">H₂</text>

              {/* Solution label */}
              <text x="150" y="200" fill="#fff" fontSize="11" textAnchor="middle" opacity="0.7">
                Concentrated NaCl Solution (Brine)
              </text>
            </g>

            {/* Test result overlay */}
            {testResult && (
              <g>
                <rect x="100" y="150" width="300" height="60" fill="#1e293b" stroke="#22c55e" strokeWidth="2" rx="10" />
                <text x="250" y="185" fill="#22c55e" fontSize="12" textAnchor="middle" fontWeight="bold">
                  {testResult}
                </text>
              </g>
            )}

            {/* Testing animation */}
            {testingGas && (
              <g className="animate-pulse">
                {testingGas === 'anode' ? (
                  <>
                    <rect x="60" y="90" width="30" height="10" fill="#3b82f6" rx="2" />
                    <text x="75" y="85" fill="#fff" fontSize="9" textAnchor="middle">Litmus</text>
                  </>
                ) : (
                  <>
                    <rect x="280" y="90" width="40" height="4" fill="#f97316" rx="1" />
                    <circle cx="320" cy="92" r="4" fill="#ef4444" className="animate-pulse" />
                    <text x="300" y="85" fill="#fff" fontSize="9" textAnchor="middle">Splint</text>
                  </>
                )}
              </g>
            )}
          </svg>
        </div>

        {/* Right Panel - Equations & Info */}
        <div className="lg:w-64 space-y-4 shrink-0">
          {/* Electrode Equations */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <button
              onClick={() => setShowEquations(!showEquations)}
              className="w-full flex justify-between items-center text-sm font-semibold text-white/80"
            >
              Electrode Equations
              <span className={cn('transition-transform', showEquations && 'rotate-180')}>▼</span>
            </button>
            {showEquations && (
              <div className="mt-3 space-y-3 text-xs">
                <div className="bg-red-500/10 rounded-lg p-2 border border-red-500/20">
                  <div className="text-red-400 font-semibold mb-1">Anode (+) Oxidation</div>
                  <div className="font-mono text-white/80">2Cl⁻ → Cl₂ + 2e⁻</div>
                </div>
                <div className="bg-blue-500/10 rounded-lg p-2 border border-blue-500/20">
                  <div className="text-blue-400 font-semibold mb-1">Cathode (-) Reduction</div>
                  <div className="font-mono text-white/80">2H₂O + 2e⁻ → H₂ + 2OH⁻</div>
                </div>
                <div className="bg-purple-500/10 rounded-lg p-2 border border-purple-500/20">
                  <div className="text-purple-400 font-semibold mb-1">Overall</div>
                  <div className="font-mono text-white/80 text-xs">2NaCl + 2H₂O → Cl₂ + H₂ + 2NaOH</div>
                </div>
              </div>
            )}
          </div>

          {/* Products */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-semibold mb-3 text-white/80">Products</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div>
                  <div className="text-yellow-400 text-sm font-medium">Chlorine (Cl₂)</div>
                  <div className="text-white/50 text-xs">At anode - yellow-green, bleaches</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                <div className="w-3 h-3 rounded-full bg-cyan-100" />
                <div>
                  <div className="text-cyan-400 text-sm font-medium">Hydrogen (H₂)</div>
                  <div className="text-white/50 text-xs">At cathode - colorless, squeaky pop</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <div className="w-3 h-3 rounded-full bg-purple-400" />
                <div>
                  <div className="text-purple-400 text-sm font-medium">NaOH</div>
                  <div className="text-white/50 text-xs">In solution - turns red litmus blue</div>
                </div>
              </div>
            </div>
          </div>

          {/* Observations */}
          {observations.length > 0 && (
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="text-sm font-semibold mb-2 text-white/80">Observations</h3>
              <ul className="text-xs text-white/60 space-y-1">
                {observations.includes('bubbles_start') && <li>• Bubbles form at both electrodes</li>}
                {observations.includes('yellow_green') && <li>• Yellow-green gas at anode</li>}
                {observations.includes('colorless') && <li>• Colorless gas at cathode</li>}
              </ul>
            </div>
          )}

          {/* Safety */}
          <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20">
            <h3 className="text-sm font-semibold mb-2 text-red-400">⚠️ Safety</h3>
            <ul className="text-xs text-red-200/80 space-y-1">
              <li>• Chlorine is toxic - use fume cupboard</li>
              <li>• Hydrogen is flammable</li>
              <li>• Wear safety goggles</li>
              <li>• Handle NaOH solution carefully</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
