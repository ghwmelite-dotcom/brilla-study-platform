import { useState, useEffect } from 'react';
import { cn } from '@/utils';
import type { SimReportProps } from './types';

type EnzymeSimulationProps = SimReportProps;

interface TrialData {
  temperature: number;
  time: number;
  rate: number;
}

export function EnzymeSimulation({ onMeasurement, onObservation, onAction }: EnzymeSimulationProps) {
  const [temperature, setTemperature] = useState(37);
  const [stage, setStage] = useState<'setup' | 'incubating' | 'testing' | 'results'>('setup');
  const [incubationTime, setIncubationTime] = useState(0);
  const [reactionTime, setReactionTime] = useState(0);
  const [isReacting, setIsReacting] = useState(false);
  const [starchRemaining, setStarchRemaining] = useState(100);
  const [trials, setTrials] = useState<TrialData[]>([]);
  const [bubbles, setBubbles] = useState<Array<{ id: number; x: number }>>([]);

  // Enzyme activity based on temperature (bell curve with optimum at 37°C)
  const getEnzymeActivity = (temp: number) => {
    if (temp < 0 || temp > 70) return 0;
    if (temp > 60) return Math.max(0, 1 - (temp - 60) / 10); // Denaturation
    // Bell curve around 37°C
    const optimum = 37;
    const spread = 15;
    return Math.exp(-Math.pow(temp - optimum, 2) / (2 * Math.pow(spread, 2)));
  };

  // Incubation effect
  useEffect(() => {
    if (stage !== 'incubating') return;

    const interval = setInterval(() => {
      setIncubationTime(prev => {
        if (prev >= 100) {
          onObservation?.(`Enzyme and starch equilibrated at ${temperature}°C`);
          onAction?.('measure', 'app_thermometer', temperature);
          setStage('testing');
          return 100;
        }
        return prev + 5;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [stage, temperature, onObservation, onAction]);

  // Reaction effect
  useEffect(() => {
    if (!isReacting) return;

    const activity = getEnzymeActivity(temperature);
    const reactionRate = activity * 5; // Starch breakdown rate

    const interval = setInterval(() => {
      setReactionTime(prev => prev + 0.1);
      setStarchRemaining(prev => {
        const newValue = prev - reactionRate * 0.1;
        if (newValue <= 0) {
          setIsReacting(false);
          onObservation?.(`Starch completely digested in ${reactionTime.toFixed(1)}s at ${temperature}°C`);
          return 0;
        }
        return newValue;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isReacting, temperature, reactionTime, onObservation]);

  // Bubble animation for mixing
  useEffect(() => {
    if (stage !== 'incubating' && stage !== 'testing') return;

    const interval = setInterval(() => {
      setBubbles(prev => {
        const newBubbles = [...prev.filter(b => Date.now() - b.id < 1500)];
        if (Math.random() > 0.5) {
          newBubbles.push({ id: Date.now(), x: 140 + Math.random() * 40 });
        }
        return newBubbles;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [stage]);

  const startIncubation = () => {
    setStage('incubating');
    setIncubationTime(0);
    onObservation?.(`Incubating enzyme (amylase) and starch at ${temperature}°C`);
    // Tubes placed in the water bath and the bath set to the selected
    // temperature.
    onAction?.('drag', 'app_water_bath');
    onAction?.('adjust', 'app_water_bath', temperature);
  };

  const startReaction = () => {
    setIsReacting(true);
    setReactionTime(0);
    onObservation?.('Mixing enzyme with starch - reaction begins');
    onAction?.('pour', 'app_petri_dish');
    onAction?.('pour', 'app_test_tube');
  };

  const testWithIodine = () => {
    setStage('results');
    const activity = getEnzymeActivity(temperature);
    const time = starchRemaining > 0 ? (100 - starchRemaining) / (activity * 5) : reactionTime;

    const trial: TrialData = {
      temperature,
      time: time || 999,
      rate: activity * 100,
    };
    setTrials(prev => [...prev, trial]);
    onMeasurement?.(time, 's', `Time at ${temperature}°C`);
    onAction?.('measure', 'app_stopwatch', time);
    onAction?.('record', 'app_stopwatch');

    onAction?.('observe', 'app_test_tube');
    if (starchRemaining <= 0) {
      onObservation?.('Iodine remains brown - NO starch present (fully digested)');
    } else if (starchRemaining < 50) {
      onObservation?.('Iodine shows faint blue - some starch remaining');
    } else {
      onObservation?.('Iodine turns blue-black - starch still present');
    }
  };

  const resetTrial = () => {
    setStage('setup');
    setIncubationTime(0);
    setReactionTime(0);
    setStarchRemaining(100);
    setIsReacting(false);
    setBubbles([]);
  };

  // Color based on temperature
  const getWaterBathColor = () => {
    if (temperature < 20) return 'rgba(59, 130, 246, 0.4)';
    if (temperature < 40) return 'rgba(34, 197, 94, 0.4)';
    if (temperature < 60) return 'rgba(249, 115, 22, 0.4)';
    return 'rgba(239, 68, 68, 0.4)';
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-900 via-amber-900/20 to-slate-900 text-white p-4 overflow-auto">
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
          Enzyme Activity
        </h2>
        <p className="text-white/60 text-sm">Effect of Temperature on Amylase Activity</p>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
        {/* Left Panel - Controls */}
        <div className="lg:w-56 space-y-4 shrink-0">
          {/* Temperature Control */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-semibold mb-3 text-white/80">Temperature</h3>
            <input
              type="range"
              min="0"
              max="70"
              value={temperature}
              onChange={(e) => stage === 'setup' && setTemperature(Number(e.target.value))}
              disabled={stage !== 'setup'}
              className="w-full accent-amber-500"
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-white/50">0°C</span>
              <span className={cn(
                'font-mono text-lg font-bold',
                temperature < 20 ? 'text-blue-400' :
                temperature < 40 ? 'text-green-400' :
                temperature < 60 ? 'text-orange-400' : 'text-red-400'
              )}>
                {temperature}°C
              </span>
              <span className="text-xs text-white/50">70°C</span>
            </div>
            {/* Temperature presets */}
            <div className="flex gap-1 mt-3">
              {[0, 25, 37, 50, 70].map(temp => (
                <button
                  key={temp}
                  onClick={() => stage === 'setup' && setTemperature(temp)}
                  disabled={stage !== 'setup'}
                  className={cn(
                    'flex-1 py-1.5 rounded text-xs font-medium transition-all',
                    temperature === temp
                      ? 'bg-amber-500 text-white'
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  )}
                >
                  {temp}°
                </button>
              ))}
            </div>
          </div>

          {/* Enzyme Activity Indicator */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-semibold mb-3 text-white/80">Predicted Activity</h3>
            <div className="h-4 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all"
                style={{ width: `${getEnzymeActivity(temperature) * 100}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs">
              <span className="text-white/50">Activity:</span>
              <span className={cn(
                'font-mono',
                getEnzymeActivity(temperature) > 0.7 ? 'text-green-400' :
                getEnzymeActivity(temperature) > 0.3 ? 'text-amber-400' : 'text-red-400'
              )}>
                {(getEnzymeActivity(temperature) * 100).toFixed(0)}%
              </span>
            </div>
            {temperature > 60 && (
              <p className="text-xs text-red-400 mt-2">⚠️ Enzyme denatured at high temperature</p>
            )}
            {temperature < 10 && (
              <p className="text-xs text-blue-400 mt-2">❄️ Enzyme activity very slow</p>
            )}
          </div>

          {/* Status */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-semibold mb-3 text-white/80">Status</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/60">Stage:</span>
                <span className="capitalize">{stage}</span>
              </div>
              {stage !== 'setup' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-white/60">Time:</span>
                    <span className="font-mono">{reactionTime.toFixed(1)}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Starch:</span>
                    <span className="font-mono">{starchRemaining.toFixed(0)}%</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            {stage === 'setup' && (
              <button
                onClick={startIncubation}
                className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl font-medium hover:from-amber-700 hover:to-orange-700 transition-all"
              >
                Start Incubation
              </button>
            )}
            {stage === 'testing' && !isReacting && starchRemaining === 100 && (
              <button
                onClick={startReaction}
                className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all"
              >
                Mix & Start Reaction
              </button>
            )}
            {stage === 'testing' && (isReacting || starchRemaining < 100) && (
              <button
                onClick={testWithIodine}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl font-medium hover:from-purple-700 hover:to-indigo-700 transition-all"
              >
                Test with Iodine
              </button>
            )}
            {stage === 'results' && (
              <button
                onClick={resetTrial}
                className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl font-medium hover:from-cyan-700 hover:to-blue-700 transition-all"
              >
                New Trial
              </button>
            )}
          </div>
        </div>

        {/* Center - Visualization */}
        <div className="flex-1 flex items-center justify-center min-h-[300px]">
          <svg viewBox="0 0 500 400" className="w-full h-full max-h-[400px]">
            {/* Water bath */}
            <g transform="translate(100, 100)">
              <rect x="0" y="50" width="200" height="150" fill="none" stroke="#94a3b8" strokeWidth="3" rx="10" />
              <rect x="5" y="80" width="190" height="115" fill={getWaterBathColor()} rx="5" />

              {/* Thermometer in bath */}
              <g transform="translate(170, 60)">
                <rect x="0" y="0" width="8" height="80" fill="#dc2626" rx="4" />
                <circle cx="4" cy="85" r="8" fill="#dc2626" />
                <rect
                  x="1"
                  y={80 - (temperature / 70) * 75}
                  width="6"
                  height={(temperature / 70) * 75}
                  fill="#ef4444"
                  rx="3"
                />
              </g>
              <text x="175" y="55" fill="#fff" fontSize="12" textAnchor="middle" fontFamily="monospace">
                {temperature}°C
              </text>

              {/* Test tubes in water bath */}
              {/* Enzyme tube */}
              <g transform="translate(40, 30)">
                <rect x="0" y="0" width="30" height="100" fill="none" stroke="#94a3b8" strokeWidth="2" rx="5" />
                <rect x="3" y="40" width="24" height="55" fill="rgba(245, 158, 11, 0.4)" rx="3" />
                <text x="15" y="-5" fill="#f59e0b" fontSize="9" textAnchor="middle">Amylase</text>

                {/* Bubbles */}
                {(stage === 'incubating' || stage === 'testing') && bubbles.slice(0, 3).map(b => (
                  <circle
                    key={b.id}
                    cx={15}
                    cy={80 - ((Date.now() - b.id) / 30)}
                    r={2}
                    fill="#fff"
                    opacity={0.5}
                  />
                ))}
              </g>

              {/* Starch tube */}
              <g transform="translate(90, 30)">
                <rect x="0" y="0" width="30" height="100" fill="none" stroke="#94a3b8" strokeWidth="2" rx="5" />
                <rect
                  x="3"
                  y="40"
                  width="24"
                  height="55"
                  fill={`rgba(59, 130, 246, ${starchRemaining / 100 * 0.6 + 0.2})`}
                  rx="3"
                />
                <text x="15" y="-5" fill="#3b82f6" fontSize="9" textAnchor="middle">Starch</text>
              </g>

              {/* Mixed reaction tube (when testing) */}
              {(stage === 'testing' || stage === 'results') && (
                <g transform="translate(65, 30)" className={isReacting ? 'animate-pulse' : ''}>
                  <rect x="0" y="0" width="30" height="100" fill="none" stroke="#22c55e" strokeWidth="2" rx="5" />
                  <rect
                    x="3"
                    y="40"
                    width="24"
                    height="55"
                    fill={`rgba(${starchRemaining > 50 ? '59, 130, 246' : starchRemaining > 0 ? '168, 85, 247' : '245, 158, 11'}, 0.5)`}
                    rx="3"
                  />
                  {isReacting && (
                    <text x="15" y="120" fill="#22c55e" fontSize="8" textAnchor="middle" className="animate-pulse">
                      Reacting...
                    </text>
                  )}
                </g>
              )}

              {/* Water bath label */}
              <text x="100" y="220" fill="#fff" fontSize="11" textAnchor="middle" opacity="0.7">
                Water Bath
              </text>

              {/* Heater indicator */}
              {temperature > 25 && (
                <g transform="translate(80, 200)">
                  <rect x="0" y="0" width="40" height="8" fill="#ef4444" rx="2" className="animate-pulse" />
                </g>
              )}
            </g>

            {/* Spot plate for iodine test */}
            {stage === 'results' && (
              <g transform="translate(350, 150)">
                <ellipse cx="40" cy="40" rx="50" ry="30" fill="#f5f5f5" stroke="#d4d4d4" strokeWidth="2" />
                <ellipse
                  cx="40"
                  cy="40"
                  rx="20"
                  ry="15"
                  fill={starchRemaining <= 0 ? '#b45309' : starchRemaining < 50 ? '#6366f1' : '#1e3a5f'}
                />
                <text x="40" y="90" fill="#fff" fontSize="10" textAnchor="middle">
                  {starchRemaining <= 0 ? 'Brown (no starch)' : 'Blue-black (starch)'}
                </text>
              </g>
            )}

            {/* Reaction equation */}
            <text x="250" y="30" fill="#fff" fontSize="10" textAnchor="middle" fontFamily="monospace">
              Starch + Amylase → Maltose (with time)
            </text>

            {/* Status message */}
            <text x="250" y="370" fill="#fff" fontSize="12" textAnchor="middle" opacity="0.8">
              {stage === 'setup' && 'Set temperature and start incubation'}
              {stage === 'incubating' && `Equilibrating at ${temperature}°C... ${incubationTime}%`}
              {stage === 'testing' && !isReacting && 'Ready to mix enzyme with starch'}
              {stage === 'testing' && isReacting && `Starch digestion in progress... ${starchRemaining.toFixed(0)}% remaining`}
              {stage === 'results' && `Reaction time: ${reactionTime.toFixed(1)}s at ${temperature}°C`}
            </text>
          </svg>
        </div>

        {/* Right Panel - Results & Graph */}
        <div className="lg:w-64 space-y-4 shrink-0">
          {/* Results Table */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-semibold mb-3 text-white/80">Results</h3>
            {trials.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-white/50 border-b border-white/10">
                      <th className="text-left py-2">Temp</th>
                      <th className="text-right py-2">Time (s)</th>
                      <th className="text-right py-2">Activity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trials.map((trial, idx) => (
                      <tr key={idx} className="border-b border-white/5">
                        <td className="py-2 font-mono">{trial.temperature}°C</td>
                        <td className="py-2 text-right font-mono text-amber-400">
                          {trial.time < 999 ? trial.time.toFixed(1) : 'N/A'}
                        </td>
                        <td className="py-2 text-right font-mono">{trial.rate.toFixed(0)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-white/40 text-xs text-center py-4">No trials recorded yet</p>
            )}
          </div>

          {/* Activity Curve */}
          {trials.length >= 2 && (
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="text-sm font-semibold mb-3 text-white/80">Activity vs Temperature</h3>
              <svg viewBox="0 0 200 120" className="w-full">
                {/* Axes */}
                <line x1="30" y1="100" x2="190" y2="100" stroke="#fff" strokeWidth="1" opacity="0.3" />
                <line x1="30" y1="10" x2="30" y2="100" stroke="#fff" strokeWidth="1" opacity="0.3" />

                {/* Theoretical curve */}
                <path
                  d={`M 30 ${100 - getEnzymeActivity(0) * 80} ${[...Array(71)].map((_, i) => `L ${30 + (i / 70) * 160} ${100 - getEnzymeActivity(i) * 80}`).join(' ')}`}
                  fill="none"
                  stroke="rgba(245, 158, 11, 0.3)"
                  strokeWidth="2"
                />

                {/* Data points */}
                {trials.map((trial, idx) => (
                  <circle
                    key={idx}
                    cx={30 + (trial.temperature / 70) * 160}
                    cy={100 - (trial.rate / 100) * 80}
                    r="4"
                    fill="#f59e0b"
                  />
                ))}

                {/* Optimum line */}
                <line x1={30 + (37 / 70) * 160} y1="10" x2={30 + (37 / 70) * 160} y2="100" stroke="#22c55e" strokeWidth="1" strokeDasharray="3,3" opacity="0.5" />
                <text x={30 + (37 / 70) * 160} y="8" fill="#22c55e" fontSize="8" textAnchor="middle">37°</text>

                {/* Labels */}
                <text x="110" y="118" fill="#fff" fontSize="8" textAnchor="middle" opacity="0.7">Temperature (°C)</text>
              </svg>
            </div>
          )}

          {/* Theory */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-semibold mb-2 text-white/80">Theory</h3>
            <ul className="text-xs text-white/60 space-y-1">
              <li>• Optimum temp: ~37°C (body temperature)</li>
              <li>• Below optimum: slow kinetic energy</li>
              <li>• Above optimum: enzyme denatures</li>
              <li>• Denaturation is irreversible</li>
            </ul>
          </div>

          {/* Variables */}
          <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20">
            <h3 className="text-sm font-semibold mb-2 text-amber-400">Variables</h3>
            <div className="text-xs space-y-1">
              <div><span className="text-amber-300">Independent:</span> <span className="text-white/70">Temperature</span></div>
              <div><span className="text-cyan-300">Dependent:</span> <span className="text-white/70">Time to digest starch</span></div>
              <div><span className="text-purple-300">Controlled:</span> <span className="text-white/70">pH, concentrations, volume</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
