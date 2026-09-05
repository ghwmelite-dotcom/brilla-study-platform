import { useState, useEffect } from 'react';
import { cn } from '@/utils';
import type { SimReportProps } from './types';
import { simRootBackground } from './simTheme';

type TranspirationSimulationProps = SimReportProps;

interface TrialData {
  condition: string;
  rate: number;
  distance: number;
  time: number;
}

type Condition = 'normal' | 'wind' | 'humid' | 'dark' | 'vaseline';
const CONDITION_RATES: Record<Condition, { rate: number; label: string; description: string }> = {
  normal: { rate: 1.0, label: 'Normal', description: 'Room temperature, still air' },
  wind: { rate: 2.0, label: 'Wind (Fan)', description: 'Increased air movement' },
  humid: { rate: 0.3, label: 'High Humidity', description: 'Plastic bag over leaves' },
  dark: { rate: 0.5, label: 'Darkness', description: 'Stomata partially closed' },
  vaseline: { rate: 0.1, label: 'Vaseline', description: 'Stomata blocked' },
};


export function TranspirationSimulation({ onMeasurement, onObservation, onAction }: TranspirationSimulationProps) {
  const [condition, setCondition] = useState<Condition>('normal');
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [bubblePosition, setBubblePosition] = useState(0); // mm from start
  const [trials, setTrials] = useState<TrialData[]>([]);

  // Transpiration rates for different conditions (mm/min relative to normal)

  // Run simulation
  useEffect(() => {
    if (!isRunning) return;

    const rate = CONDITION_RATES[condition].rate;

    const interval = setInterval(() => {
      setTime(prev => prev + 1);
      setBubblePosition(prev => {
        const newPos = prev + (rate * 0.5); // 0.5mm per second at normal rate
        if (newPos >= 100) {
          setIsRunning(false);
          onObservation?.(`Bubble moved 100mm in ${time + 1}s under ${CONDITION_RATES[condition].label} conditions`);
          onAction?.('observe', 'app_potometer');
          return 100;
        }
        return newPos;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, condition, time, onObservation, onAction]);

  const startMeasurement = () => {
    setIsRunning(true);
    setTime(0);
    setBubblePosition(0);
    onObservation?.(`Starting measurement under ${CONDITION_RATES[condition].label} conditions`);
    // Potometer setup: shoot cut under water, connected, and filled.
    onAction?.('drag', 'app_scalpel');
    onAction?.('connect', 'app_potometer');
    onAction?.('pour', 'app_potometer');
  };

  const stopAndRecord = () => {
    setIsRunning(false);
    const rate = bubblePosition / (time / 60); // mm/min

    const trial: TrialData = {
      condition: CONDITION_RATES[condition].label,
      rate,
      distance: bubblePosition,
      time,
    };
    setTrials(prev => [...prev, trial]);
    onMeasurement?.(rate, 'mm/min', `Rate (${CONDITION_RATES[condition].label})`);
    onObservation?.(`Recorded: ${bubblePosition.toFixed(1)}mm in ${time}s = ${rate.toFixed(2)} mm/min`);
    onAction?.('measure', 'app_stopwatch', time);
    onAction?.('measure', 'app_meter_rule', bubblePosition);
    onAction?.('record', 'app_stopwatch');
  };

  const resetBubble = () => {
    setBubblePosition(0);
    setTime(0);
    onObservation?.('Air bubble repositioned to start');
    onAction?.('drag', 'app_potometer');
    onAction?.('adjust', 'app_potometer');
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 text-white p-4 overflow-auto" style={simRootBackground('rgba(19, 78, 74, 0.2)')}>
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
          Transpiration
        </h2>
        <p className="text-white/60 text-sm">Using a Potometer to Measure Water Uptake</p>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
        {/* Left Panel - Controls */}
        <div className="lg:w-56 space-y-4 shrink-0">
          {/* Condition Selection */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-semibold mb-3 text-white/80">Environmental Condition</h3>
            <div className="space-y-2">
              {(Object.entries(CONDITION_RATES) as [Condition, typeof CONDITION_RATES[Condition]][]).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => !isRunning && setCondition(key)}
                  disabled={isRunning}
                  className={cn(
                    'w-full p-2.5 rounded-lg text-left transition-all border',
                    condition === key
                      ? 'bg-teal-500/20 border-teal-500/50'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  )}
                >
                  <div className="font-medium text-sm">{val.label}</div>
                  <div className="text-xs text-white/50">{val.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-semibold mb-3 text-white/80">Measurement</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/60">Time:</span>
                <span className="font-mono text-cyan-400">{time}s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Distance:</span>
                <span className="font-mono text-teal-400">{bubblePosition.toFixed(1)} mm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Rate:</span>
                <span className="font-mono">
                  {time > 0 ? ((bubblePosition / (time / 60)).toFixed(2)) : '0.00'} mm/min
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            {!isRunning ? (
              <button
                onClick={startMeasurement}
                className="w-full py-3 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-xl font-medium hover:from-teal-700 hover:to-cyan-700 transition-all"
              >
                Start Measurement
              </button>
            ) : (
              <button
                onClick={stopAndRecord}
                className="w-full py-3 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl font-medium hover:from-orange-700 hover:to-red-700 transition-all"
              >
                Stop & Record
              </button>
            )}
            <button
              onClick={resetBubble}
              disabled={isRunning}
              className={cn(
                'w-full py-2 rounded-xl text-sm transition-all',
                isRunning
                  ? 'bg-white/5 text-white/30 cursor-not-allowed'
                  : 'bg-white/10 hover:bg-white/20'
              )}
            >
              Reset Bubble Position
            </button>
          </div>
        </div>

        {/* Center - Potometer Visualization */}
        <div className="flex-1 flex items-center justify-center min-h-[350px]">
          <svg viewBox="0 0 500 400" className="w-full h-full max-h-[400px]">
            {/* Plant shoot */}
            <g transform="translate(180, 30)">
              {/* Stem in tube */}
              <rect x="45" y="80" width="10" height="100" fill="#22c55e" />

              {/* Rubber tubing connection */}
              <ellipse cx="50" cy="80" rx="15" ry="8" fill="#1f2937" />

              {/* Leaves */}
              <g className={condition === 'wind' ? 'animate-pulse' : ''}>
                <ellipse cx="30" cy="50" rx="25" ry="12" fill="#22c55e" transform="rotate(-30, 30, 50)" />
                <ellipse cx="70" cy="50" rx="25" ry="12" fill="#22c55e" transform="rotate(30, 70, 50)" />
                <ellipse cx="50" cy="30" rx="20" ry="10" fill="#16a34a" />
                <ellipse cx="35" cy="65" rx="18" ry="8" fill="#15803d" transform="rotate(-45, 35, 65)" />
                <ellipse cx="65" cy="65" rx="18" ry="8" fill="#15803d" transform="rotate(45, 65, 65)" />
              </g>

              {/* Condition indicators */}
              {condition === 'wind' && (
                <g className="animate-pulse">
                  <path d="M 100 40 Q 110 35 120 40" fill="none" stroke="#60a5fa" strokeWidth="2" />
                  <path d="M 100 50 Q 115 45 130 50" fill="none" stroke="#60a5fa" strokeWidth="2" />
                  <path d="M 100 60 Q 110 55 120 60" fill="none" stroke="#60a5fa" strokeWidth="2" />
                  <text x="140" y="50" fill="#60a5fa" fontSize="10">Wind</text>
                </g>
              )}
              {condition === 'humid' && (
                <g>
                  <ellipse cx="50" cy="45" rx="45" ry="50" fill="none" stroke="#a5b4fc" strokeWidth="2" strokeDasharray="5,5" opacity="0.5" />
                  <text x="50" y="0" fill="#a5b4fc" fontSize="9" textAnchor="middle">Plastic bag</text>
                </g>
              )}
              {condition === 'vaseline' && (
                <g>
                  <ellipse cx="30" cy="50" rx="28" ry="14" fill="rgba(254, 243, 199, 0.3)" transform="rotate(-30, 30, 50)" />
                  <ellipse cx="70" cy="50" rx="28" ry="14" fill="rgba(254, 243, 199, 0.3)" transform="rotate(30, 70, 50)" />
                  <text x="50" y="0" fill="#fde68a" fontSize="9" textAnchor="middle">Vaseline on leaves</text>
                </g>
              )}
              {condition === 'dark' && (
                <rect x="-10" y="-10" width="120" height="100" fill="rgba(0,0,0,0.6)" rx="5">
                  <animate attributeName="opacity" values="0.6;0.4;0.6" dur="2s" repeatCount="indefinite" />
                </rect>
              )}
            </g>

            {/* Potometer tube - horizontal capillary */}
            <g transform="translate(100, 200)">
              {/* Main tube */}
              <rect x="0" y="0" width="300" height="20" fill="none" stroke="#94a3b8" strokeWidth="3" rx="5" />

              {/* Water in tube */}
              <rect x="3" y="3" width="294" height="14" fill="rgba(59, 130, 246, 0.3)" rx="3" />

              {/* Air bubble */}
              <rect
                x={3 + (bubblePosition / 100) * 280}
                y="5"
                width="15"
                height="10"
                fill="#e5e5e5"
                rx="5"
                className={isRunning ? 'transition-all duration-1000' : ''}
              />

              {/* Scale markings */}
              {[0, 20, 40, 60, 80, 100].map((mark) => (
                <g key={mark} transform={`translate(${3 + (mark / 100) * 280}, 0)`}>
                  <line x1="0" y1="22" x2="0" y2="30" stroke="#fff" strokeWidth="1" />
                  <text x="0" y="42" fill="#fff" fontSize="9" textAnchor="middle">{mark}</text>
                </g>
              ))}
              <text x="150" y="55" fill="#fff" fontSize="10" textAnchor="middle" opacity="0.7">mm</text>

              {/* Connection to plant */}
              <path d="M 150 0 L 150 -20 Q 150 -40 130 -60" fill="none" stroke="#94a3b8" strokeWidth="6" />

              {/* Reservoir (for resetting bubble) */}
              <g transform="translate(310, -10)">
                <rect x="0" y="0" width="40" height="40" fill="none" stroke="#94a3b8" strokeWidth="2" rx="5" />
                <rect x="5" y="15" width="30" height="20" fill="rgba(59, 130, 246, 0.3)" rx="3" />
                <text x="20" y="55" fill="#fff" fontSize="8" textAnchor="middle">Reservoir</text>
              </g>
            </g>

            {/* Water uptake arrows */}
            {isRunning && (
              <g className="animate-pulse">
                <path d="M 230 185 L 230 160" fill="none" stroke="#3b82f6" strokeWidth="2" markerEnd="url(#arrowhead)" />
                <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
                  </marker>
                </defs>
              </g>
            )}

            {/* Labels */}
            <text x="250" y="30" fill="#fff" fontSize="11" textAnchor="middle">
              Leafy Shoot
            </text>
            <text x="250" y="280" fill="#fff" fontSize="11" textAnchor="middle" opacity="0.7">
              Capillary Tube (Potometer)
            </text>

            {/* Rate indicator */}
            <g transform="translate(380, 320)">
              <text x="0" y="0" fill="#fff" fontSize="10">Expected rate:</text>
              <text x="0" y="18" fill="#22c55e" fontSize="14" fontWeight="bold">
                {(CONDITION_RATES[condition].rate * 30).toFixed(0)} mm/min
              </text>
              <text x="0" y="35" fill="#fff" fontSize="9" opacity="0.5">
                (relative)
              </text>
            </g>
          </svg>
        </div>

        {/* Right Panel - Results */}
        <div className="lg:w-64 space-y-4 shrink-0">
          {/* Results Table */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-semibold mb-3 text-white/80">Results</h3>
            {trials.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-white/50 border-b border-white/10">
                      <th className="text-left py-2">Condition</th>
                      <th className="text-right py-2">Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trials.map((trial, idx) => (
                      <tr key={idx} className="border-b border-white/5">
                        <td className="py-2">{trial.condition}</td>
                        <td className="py-2 text-right font-mono text-teal-400">
                          {trial.rate.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-white/40 text-xs text-center py-4">No measurements yet</p>
            )}
          </div>

          {/* Bar Chart */}
          {trials.length > 0 && (
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="text-sm font-semibold mb-3 text-white/80">Comparison</h3>
              <div className="space-y-2">
                {trials.map((trial, idx) => {
                  const maxRate = Math.max(...trials.map(t => t.rate));
                  return (
                    <div key={idx}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-white/60">{trial.condition}</span>
                        <span className="font-mono">{trial.rate.toFixed(1)}</span>
                      </div>
                      <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-teal-500 to-cyan-500"
                          style={{ width: `${(trial.rate / maxRate) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Theory */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-semibold mb-2 text-white/80">Factors Affecting Rate</h3>
            <ul className="text-xs text-white/60 space-y-1">
              <li className="flex items-start gap-2">
                <span className="text-teal-400">↑</span>
                <span>Wind: removes humid air from leaf surface</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-400">↑</span>
                <span>Temperature: increases evaporation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400">↓</span>
                <span>Humidity: reduces diffusion gradient</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400">↓</span>
                <span>Darkness: stomata close</span>
              </li>
            </ul>
          </div>

          {/* Important Note */}
          <div className="bg-teal-500/10 rounded-xl p-4 border border-teal-500/20">
            <h3 className="text-sm font-semibold mb-2 text-teal-400">Note</h3>
            <p className="text-xs text-teal-200/80">
              The potometer measures water uptake, not transpiration directly.
              ~99% of water absorbed is lost via transpiration through stomata.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
