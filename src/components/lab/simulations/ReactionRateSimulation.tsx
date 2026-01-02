import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/utils';

interface ReactionRateSimulationProps {
  onMeasurement?: (value: number, unit: string, label: string) => void;
  onObservation?: (text: string) => void;
}

interface Trial {
  concentration: number;
  time: number;
  rate: number;
}

export function ReactionRateSimulation({ onMeasurement, onObservation }: ReactionRateSimulationProps) {
  const [stage, setStage] = useState<'setup' | 'reacting' | 'results'>('setup');
  const [concentration, setConcentration] = useState(1.0); // mol/dm³
  const [marbleChips, setMarbleChips] = useState(5); // grams
  const [reactionTime, setReactionTime] = useState(0);
  const [gasVolume, setGasVolume] = useState(0);
  const [isReacting, setIsReacting] = useState(false);
  const [reactionComplete, setReactionComplete] = useState(false);
  const [trials, setTrials] = useState<Trial[]>([]);
  const [bubbles, setBubbles] = useState<Array<{ id: number; x: number; size: number }>>([]);
  const [showCrossVisible, setShowCrossVisible] = useState(true);

  // Reaction: CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂
  // Higher concentration = faster reaction

  // Calculate reaction rate based on concentration
  const getReactionRate = useCallback(() => {
    // Rate roughly proportional to concentration (first order approximation)
    return concentration * 2.5; // ml CO₂ per second
  }, [concentration]);

  // Maximum gas that can be produced (limited by marble chips)
  const maxGas = marbleChips * 25; // 5g marble ≈ 125ml CO₂

  // Reaction effect
  useEffect(() => {
    if (!isReacting) return;

    const reactionRate = getReactionRate();

    const interval = setInterval(() => {
      setReactionTime(prev => prev + 0.1);
      setGasVolume(prev => {
        const newVolume = prev + reactionRate * 0.1;
        if (newVolume >= maxGas) {
          setIsReacting(false);
          setReactionComplete(true);
          onObservation?.(`Reaction complete! Time: ${reactionTime.toFixed(1)}s, Gas: ${maxGas}ml CO₂`);
          return maxGas;
        }
        return newVolume;
      });

      // Effervescence visibility decreases as reaction slows
      const progress = gasVolume / maxGas;
      if (progress > 0.3 && showCrossVisible) {
        setShowCrossVisible(false);
        onObservation?.('Cross beneath flask becomes obscured by effervescence');
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isReacting, getReactionRate, maxGas, gasVolume, reactionTime, showCrossVisible, onObservation]);

  // Bubble animation
  useEffect(() => {
    if (!isReacting) return;

    const bubbleInterval = setInterval(() => {
      setBubbles(prev => {
        const newBubbles = [...prev.filter(b => Date.now() - b.id < 1500)];
        // More bubbles with higher concentration
        const bubbleCount = Math.ceil(concentration * 2);
        for (let i = 0; i < bubbleCount; i++) {
          if (Math.random() > 0.4) {
            newBubbles.push({
              id: Date.now() + i,
              x: 150 + Math.random() * 80,
              size: 2 + Math.random() * 3,
            });
          }
        }
        return newBubbles;
      });
    }, 100);

    return () => clearInterval(bubbleInterval);
  }, [isReacting, concentration, getReactionRate]);

  const startReaction = () => {
    setIsReacting(true);
    setStage('reacting');
    setShowCrossVisible(true);
    onObservation?.(`Starting reaction: ${concentration}M HCl with ${marbleChips}g marble chips`);
  };

  const recordTrial = () => {
    const rate = maxGas / reactionTime; // ml/s
    const trial: Trial = {
      concentration,
      time: reactionTime,
      rate,
    };
    setTrials(prev => [...prev, trial]);
    onMeasurement?.(rate, 'ml/s', `Rate at ${concentration}M`);
    onObservation?.(`Recorded: ${concentration}M → ${reactionTime.toFixed(1)}s, Rate: ${rate.toFixed(2)} ml/s`);
    setStage('results');
  };

  const resetForNextTrial = () => {
    setStage('setup');
    setReactionTime(0);
    setGasVolume(0);
    setIsReacting(false);
    setReactionComplete(false);
    setBubbles([]);
    setShowCrossVisible(true);
  };

  // Get color for acid based on concentration
  const getAcidColor = () => {
    // Lighter = more dilute
    const opacity = 0.3 + concentration * 0.15;
    return `rgba(239, 68, 68, ${opacity})`; // Red tint for HCl indicator
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-900 via-emerald-900/20 to-slate-900 text-white p-4 overflow-auto">
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
          Rate of Reaction
        </h2>
        <p className="text-white/60 text-sm">Effect of Concentration on Reaction Rate</p>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
        {/* Left Panel - Controls */}
        <div className="lg:w-56 space-y-4 shrink-0">
          {/* Concentration Control */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-semibold mb-3 text-white/80">HCl Concentration</h3>
            <div className="space-y-2">
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.25"
                value={concentration}
                onChange={(e) => stage === 'setup' && setConcentration(Number(e.target.value))}
                disabled={stage !== 'setup'}
                className="w-full accent-emerald-500"
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/50">Dilute</span>
                <span className="font-mono text-emerald-400 font-bold">{concentration.toFixed(2)} M</span>
                <span className="text-xs text-white/50">Conc.</span>
              </div>
            </div>
          </div>

          {/* Marble Chips */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-semibold mb-3 text-white/80">Marble Chips (CaCO₃)</h3>
            <div className="flex gap-2">
              {[3, 5, 7].map((mass) => (
                <button
                  key={mass}
                  onClick={() => stage === 'setup' && setMarbleChips(mass)}
                  disabled={stage !== 'setup'}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-sm font-medium transition-all border',
                    marbleChips === mass
                      ? 'bg-white/20 border-white/40'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  )}
                >
                  {mass}g
                </button>
              ))}
            </div>
          </div>

          {/* Live Data */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-semibold mb-3 text-white/80">Live Data</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/60">Time:</span>
                <span className="font-mono text-cyan-400">{reactionTime.toFixed(1)}s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">CO₂ Volume:</span>
                <span className="font-mono text-emerald-400">{gasVolume.toFixed(1)} ml</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Progress:</span>
                <span className="font-mono">{((gasVolume / maxGas) * 100).toFixed(0)}%</span>
              </div>
              {/* Progress bar */}
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all"
                  style={{ width: `${(gasVolume / maxGas) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            {stage === 'setup' && (
              <button
                onClick={startReaction}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-xl font-medium hover:from-emerald-700 hover:to-cyan-700 transition-all"
              >
                Add Marble Chips
              </button>
            )}
            {stage === 'reacting' && reactionComplete && (
              <button
                onClick={recordTrial}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl font-medium hover:from-purple-700 hover:to-indigo-700 transition-all"
              >
                Record Results
              </button>
            )}
            {stage === 'results' && (
              <button
                onClick={resetForNextTrial}
                className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl font-medium hover:from-amber-700 hover:to-orange-700 transition-all"
              >
                Next Trial
              </button>
            )}
          </div>
        </div>

        {/* Center - Apparatus */}
        <div className="flex-1 flex items-center justify-center min-h-[300px]">
          <svg viewBox="0 0 500 400" className="w-full h-full max-h-[400px]">
            <defs>
              <linearGradient id="gasGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="transparent" />
                <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.3" />
              </linearGradient>
            </defs>

            {/* Gas syringe */}
            <g transform="translate(320, 100)">
              {/* Syringe body */}
              <rect x="0" y="20" width="150" height="40" fill="#1f2937" stroke="#374151" strokeWidth="2" rx="3" />
              <rect x="5" y="25" width="140" height="30" fill="#374151" rx="2" />

              {/* Gas inside */}
              <rect
                x="5"
                y="25"
                width={Math.min((gasVolume / maxGas) * 140, 140)}
                height="30"
                fill="url(#gasGrad)"
                rx="2"
              />

              {/* Plunger */}
              <rect
                x={5 + Math.min((gasVolume / maxGas) * 140, 135)}
                y="15"
                width="10"
                height="50"
                fill="#6b7280"
                stroke="#4b5563"
                strokeWidth="1"
                rx="2"
              />

              {/* Scale markings */}
              {[0, 25, 50, 75, 100].map((mark) => (
                <g key={mark}>
                  <line
                    x1={5 + (mark / 100) * 130}
                    y1="58"
                    x2={5 + (mark / 100) * 130}
                    y2="65"
                    stroke="#fff"
                    strokeWidth="1"
                  />
                  <text
                    x={5 + (mark / 100) * 130}
                    y="78"
                    fill="#fff"
                    fontSize="8"
                    textAnchor="middle"
                  >
                    {Math.round((mark / 100) * maxGas)}
                  </text>
                </g>
              ))}
              <text x="75" y="95" fill="#fff" fontSize="10" textAnchor="middle" opacity="0.7">
                Volume (ml)
              </text>

              {/* Delivery tube */}
              <path
                d="M 0 40 Q -20 40 -20 80 Q -20 120 -60 140"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="4"
              />
            </g>

            {/* Conical Flask */}
            <g transform="translate(120, 150)">
              {/* Flask body */}
              <path
                d="M 40 0 L 20 100 Q 0 140 60 140 Q 120 140 100 100 L 80 0 Z"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="3"
              />

              {/* Acid in flask */}
              <path
                d="M 30 50 L 22 100 Q 5 135 60 135 Q 115 135 98 100 L 90 50 Z"
                fill={getAcidColor()}
              />

              {/* Marble chips */}
              {stage !== 'setup' && (
                <g>
                  {[...Array(Math.min(marbleChips, 7))].map((_, i) => (
                    <ellipse
                      key={i}
                      cx={40 + (i % 3) * 15 + Math.random() * 5}
                      cy={110 + Math.floor(i / 3) * 12}
                      rx={6 + Math.random() * 3}
                      ry={4 + Math.random() * 2}
                      fill="#e5e5e5"
                      stroke="#d4d4d4"
                      className={isReacting ? 'animate-pulse' : ''}
                    />
                  ))}
                </g>
              )}

              {/* Bubbles */}
              {bubbles.map((bubble) => (
                <circle
                  key={bubble.id}
                  cx={bubble.x - 120}
                  cy={100 - ((Date.now() - bubble.id) / 15)}
                  r={bubble.size}
                  fill="#fff"
                  opacity={0.5}
                />
              ))}

              {/* Stopper with hole */}
              <rect x="35" y="-15" width="50" height="20" fill="#1f2937" rx="3" />
              <circle cx="60" cy="-5" r="6" fill="#374151" />

              {/* Cross marker below flask */}
              <g transform="translate(40, 160)">
                <line x1="0" y1="0" x2="20" y2="20" stroke={showCrossVisible ? '#fff' : '#555'} strokeWidth="2" />
                <line x1="20" y1="0" x2="0" y2="20" stroke={showCrossVisible ? '#fff' : '#555'} strokeWidth="2" />
                <text x="10" y="35" fill="#fff" fontSize="9" textAnchor="middle" opacity="0.6">
                  X mark
                </text>
              </g>
            </g>

            {/* Equation */}
            <text x="250" y="30" fill="#fff" fontSize="11" textAnchor="middle" fontFamily="monospace">
              CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂↑
            </text>

            {/* Status */}
            <text x="250" y="380" fill="#fff" fontSize="12" textAnchor="middle" opacity="0.8">
              {stage === 'setup' && 'Set concentration and add marble chips'}
              {stage === 'reacting' && !reactionComplete && 'Reaction in progress - measuring gas volume...'}
              {stage === 'reacting' && reactionComplete && 'Reaction complete! Record your results.'}
              {stage === 'results' && 'Try different concentrations to compare rates'}
            </text>

            {/* Timer display */}
            {isReacting && (
              <g transform="translate(30, 80)">
                <rect x="0" y="0" width="80" height="40" fill="#1f2937" stroke="#374151" strokeWidth="2" rx="5" />
                <text x="40" y="28" fill="#22c55e" fontSize="18" textAnchor="middle" fontFamily="monospace">
                  {reactionTime.toFixed(1)}s
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* Right Panel - Results & Graph */}
        <div className="lg:w-64 space-y-4 shrink-0">
          {/* Results Table */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-semibold mb-3 text-white/80">Results Table</h3>
            {trials.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-white/50 border-b border-white/10">
                      <th className="text-left py-2">Conc.</th>
                      <th className="text-right py-2">Time</th>
                      <th className="text-right py-2">Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trials.map((trial, idx) => (
                      <tr key={idx} className="border-b border-white/5">
                        <td className="py-2 font-mono text-emerald-400">{trial.concentration}M</td>
                        <td className="py-2 text-right font-mono">{trial.time.toFixed(1)}s</td>
                        <td className="py-2 text-right font-mono text-cyan-400">{trial.rate.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-white/40 text-xs text-center py-4">No trials recorded yet</p>
            )}
          </div>

          {/* Graph */}
          {trials.length >= 2 && (
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="text-sm font-semibold mb-3 text-white/80">Rate vs Concentration</h3>
              <svg viewBox="0 0 200 150" className="w-full">
                {/* Axes */}
                <line x1="30" y1="120" x2="190" y2="120" stroke="#fff" strokeWidth="1" opacity="0.3" />
                <line x1="30" y1="20" x2="30" y2="120" stroke="#fff" strokeWidth="1" opacity="0.3" />

                {/* Grid */}
                {[0, 25, 50, 75, 100].map((y) => (
                  <line key={y} x1="30" y1={120 - y} x2="190" y2={120 - y} stroke="#fff" strokeWidth="0.5" opacity="0.1" />
                ))}

                {/* Data points and line */}
                {trials.map((trial, idx) => {
                  const x = 30 + (trial.concentration / 2.0) * 150;
                  const maxRate = Math.max(...trials.map(t => t.rate));
                  const y = 120 - (trial.rate / maxRate) * 90;
                  return (
                    <g key={idx}>
                      <circle cx={x} cy={y} r="5" fill="#22c55e" />
                      {idx > 0 && (
                        <line
                          x1={30 + (trials[idx - 1].concentration / 2.0) * 150}
                          y1={120 - (trials[idx - 1].rate / maxRate) * 90}
                          x2={x}
                          y2={y}
                          stroke="#22c55e"
                          strokeWidth="2"
                        />
                      )}
                    </g>
                  );
                })}

                {/* Labels */}
                <text x="110" y="140" fill="#fff" fontSize="9" textAnchor="middle" opacity="0.7">
                  Concentration (M)
                </text>
                <text x="12" y="70" fill="#fff" fontSize="9" textAnchor="middle" transform="rotate(-90, 12, 70)" opacity="0.7">
                  Rate
                </text>
              </svg>
            </div>
          )}

          {/* Theory */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-semibold mb-2 text-white/80">Theory</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              Higher concentration means more acid particles per unit volume.
              This increases the frequency of successful collisions between
              reactant particles, resulting in a faster reaction rate.
            </p>
          </div>

          {/* Variables */}
          <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
            <h3 className="text-sm font-semibold mb-2 text-emerald-400">Variables</h3>
            <div className="text-xs space-y-1">
              <div><span className="text-emerald-300">Independent:</span> <span className="text-white/70">Concentration</span></div>
              <div><span className="text-cyan-300">Dependent:</span> <span className="text-white/70">Time / Rate</span></div>
              <div><span className="text-amber-300">Controlled:</span> <span className="text-white/70">Volume, mass, temp</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
