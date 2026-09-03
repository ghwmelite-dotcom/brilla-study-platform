import { useState, useEffect } from 'react';
import { cn } from '@/utils';
import type { SimReportProps } from './types';

type CrystallizationSimulationProps = SimReportProps;

type Stage = 'dissolving' | 'heating' | 'filtering' | 'evaporating' | 'cooling' | 'complete';

export function CrystallizationSimulation({ onObservation, onAction }: CrystallizationSimulationProps) {
  const [stage, setStage] = useState<Stage>('dissolving');
  const [temperature, setTemperature] = useState(25);
  const [saturationLevel, setSaturationLevel] = useState(0);
  const [isHeating, setIsHeating] = useState(false);
  const [isStirring, setIsStirring] = useState(false);
  const [addedSolute, setAddedSolute] = useState(0);
  const [evaporationProgress, setEvaporationProgress] = useState(0);
  const [coolingProgress, setCoolingProgress] = useState(0);
  const [crystalQuality, setCrystalQuality] = useState<'poor' | 'good' | 'excellent'>('good');
  // Track internal state (not displayed but needed for logic)
  const [, setCrystalSize] = useState(0);

  // Dissolving effect
  useEffect(() => {
    if (stage !== 'dissolving' || !isStirring || addedSolute === 0) return;

    const maxSolubility = 20 + (temperature - 25) * 1.5; // Higher temp = more soluble

    const interval = setInterval(() => {
      setSaturationLevel(prev => {
        const target = Math.min((addedSolute / maxSolubility) * 100, 100);
        if (prev >= target) {
          setIsStirring(false);
          onAction?.('observe', 'app_beaker_250');
          if (prev >= 100) {
            onObservation?.('Solution is saturated - excess solute remains undissolved');
          } else {
            onObservation?.(`Copper sulfate dissolved - saturation: ${target.toFixed(0)}%`);
          }
          return target;
        }
        return prev + 5;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [stage, isStirring, addedSolute, temperature, onObservation, onAction]);

  // Heating effect
  useEffect(() => {
    if (!isHeating) return;

    const interval = setInterval(() => {
      setTemperature(prev => {
        if (prev >= 80) {
          return 80;
        }
        return prev + 2;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [isHeating]);

  // Evaporation effect
  useEffect(() => {
    if (stage !== 'evaporating' || !isHeating) return;

    const interval = setInterval(() => {
      setEvaporationProgress(prev => {
        if (prev >= 70) {
          setIsHeating(false);
          onObservation?.('Evaporation complete - crystals beginning to form at edges');
          onAction?.('observe', 'app_evaporating_dish');
          return 70;
        }
        // Steam visible
        if (prev === 20) {
          onObservation?.('Solution becoming more concentrated as water evaporates');
        }
        return prev + 2;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [stage, isHeating, onObservation, onAction]);

  // Cooling effect
  useEffect(() => {
    if (stage !== 'cooling') return;

    const interval = setInterval(() => {
      setTemperature(prev => {
        const newTemp = prev - 0.5;
        if (newTemp <= 25) {
          return 25;
        }
        return newTemp;
      });

      setCoolingProgress(prev => {
        if (prev >= 100) {
          // Determine crystal quality based on cooling rate
          setCrystalSize(prev => Math.min(prev + 5, 100));
          onObservation?.('Beautiful blue copper sulfate crystals have formed');
          onAction?.('observe', 'app_evaporating_dish');
          onAction?.('record', 'app_evaporating_dish');
          setStage('complete');
          return 100;
        }
        // Crystal formation observations
        if (prev === 30) {
          onObservation?.('Small crystal nuclei appearing in solution');
          onAction?.('observe', 'app_evaporating_dish');
        }
        if (prev === 60) {
          onObservation?.('Crystals growing - characteristic blue color visible');
          onAction?.('observe', 'app_evaporating_dish');
        }
        return prev + 1;
      });
    }, 150);

    return () => clearInterval(interval);
  }, [stage, onObservation, onAction]);

  const addSolute = () => {
    const amount = 5;
    setAddedSolute(prev => prev + amount);
    onObservation?.(`Added ${amount}g copper sulfate to water`);
    onAction?.('pour', 'app_beaker_250');
  };

  const startStirring = () => {
    setIsStirring(true);
    onObservation?.('Stirring to dissolve copper sulfate...');
  };

  const startHeating = () => {
    setIsHeating(true);
    onAction?.('heat', 'app_bunsen_burner');
    if (stage === 'dissolving') {
      onObservation?.('Heating to increase solubility');
    } else if (stage === 'evaporating') {
      onObservation?.('Heating to evaporate water and concentrate solution');
    }
  };

  const stopHeating = () => {
    setIsHeating(false);
  };

  const proceedToFiltering = () => {
    if (saturationLevel >= 80) {
      setStage('filtering');
      onObservation?.('Filtering the hot saturated solution to remove impurities');
      onAction?.('measure', 'app_thermometer', temperature);
      setTimeout(() => {
        onObservation?.('Filtration complete - clear blue solution obtained');
        // Filtrate transferred to the evaporating dish for concentration.
        onAction?.('pour', 'app_evaporating_dish');
        setStage('evaporating');
      }, 2000);
    } else {
      onObservation?.('Solution not concentrated enough - add more solute or heat');
    }
  };

  const startCooling = () => {
    if (evaporationProgress >= 70) {
      setStage('cooling');
      setCrystalQuality('excellent'); // Slow cooling = better crystals
      onObservation?.('Allowing solution to cool slowly for crystal formation');
      onAction?.('measure', 'app_thermometer', temperature);
    }
  };

  const rapidCooling = () => {
    if (evaporationProgress >= 70) {
      setStage('cooling');
      setCrystalQuality('poor'); // Rapid cooling = smaller crystals
      setCoolingProgress(50); // Skip ahead
      onObservation?.('Rapid cooling in ice bath - smaller crystals will form');
    }
  };

  const resetExperiment = () => {
    setStage('dissolving');
    setTemperature(25);
    setSaturationLevel(0);
    setIsHeating(false);
    setIsStirring(false);
    setAddedSolute(0);
    setEvaporationProgress(0);
    setCoolingProgress(0);
    setCrystalSize(0);
    setCrystalQuality('good');
  };

  // Get solution color based on concentration
  const getSolutionColor = () => {
    const intensity = saturationLevel / 100;
    return `rgba(59, 130, 246, ${0.2 + intensity * 0.6})`; // Blue
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900 text-white p-4 overflow-auto">
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          Preparation of Crystals
        </h2>
        <p className="text-white/60 text-sm">Copper Sulfate Crystallization</p>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
        {/* Left Panel - Controls */}
        <div className="lg:w-56 space-y-4 shrink-0">
          {/* Stage Indicator */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-semibold mb-3 text-white/80">Current Stage</h3>
            <div className="space-y-2">
              {(['dissolving', 'heating', 'filtering', 'evaporating', 'cooling', 'complete'] as Stage[]).map((s, idx) => (
                <div
                  key={s}
                  className={cn(
                    'flex items-center gap-2 text-xs',
                    stage === s ? 'text-blue-400' : s < stage || (idx < ['dissolving', 'heating', 'filtering', 'evaporating', 'cooling', 'complete'].indexOf(stage)) ? 'text-emerald-400' : 'text-white/30'
                  )}
                >
                  <div className={cn(
                    'w-2 h-2 rounded-full',
                    stage === s ? 'bg-blue-400 animate-pulse' :
                    ['dissolving', 'heating', 'filtering', 'evaporating', 'cooling', 'complete'].indexOf(s) < ['dissolving', 'heating', 'filtering', 'evaporating', 'cooling', 'complete'].indexOf(stage) ? 'bg-emerald-400' : 'bg-white/20'
                  )} />
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </div>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-semibold mb-3 text-white/80">Status</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/60">Temperature:</span>
                <span className={cn(
                  'font-mono',
                  temperature > 60 ? 'text-red-400' : temperature > 40 ? 'text-amber-400' : 'text-cyan-400'
                )}>
                  {temperature.toFixed(0)}°C
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Saturation:</span>
                <span className="font-mono text-blue-400">{saturationLevel.toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Solute added:</span>
                <span className="font-mono">{addedSolute}g</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-semibold mb-3 text-white/80">Actions</h3>
            <div className="space-y-2">
              {stage === 'dissolving' && (
                <>
                  <button
                    onClick={addSolute}
                    className="w-full py-2 bg-blue-600 rounded-lg text-sm font-medium hover:bg-blue-700 transition-all"
                  >
                    Add CuSO₄ (+5g)
                  </button>
                  <button
                    onClick={startStirring}
                    disabled={addedSolute === 0 || isStirring}
                    className={cn(
                      'w-full py-2 rounded-lg text-sm font-medium transition-all',
                      addedSolute > 0 && !isStirring
                        ? 'bg-cyan-600 hover:bg-cyan-700'
                        : 'bg-white/10 text-white/30 cursor-not-allowed'
                    )}
                  >
                    {isStirring ? 'Stirring...' : 'Stir'}
                  </button>
                  <button
                    onClick={isHeating ? stopHeating : startHeating}
                    className={cn(
                      'w-full py-2 rounded-lg text-sm font-medium transition-all',
                      isHeating
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-orange-600 hover:bg-orange-700'
                    )}
                  >
                    {isHeating ? 'Stop Heating' : 'Heat'}
                  </button>
                  <button
                    onClick={proceedToFiltering}
                    disabled={saturationLevel < 80}
                    className={cn(
                      'w-full py-2 rounded-lg text-sm font-medium transition-all',
                      saturationLevel >= 80
                        ? 'bg-purple-600 hover:bg-purple-700'
                        : 'bg-white/10 text-white/30 cursor-not-allowed'
                    )}
                  >
                    Filter Solution
                  </button>
                </>
              )}
              {stage === 'evaporating' && (
                <>
                  <button
                    onClick={isHeating ? stopHeating : startHeating}
                    className={cn(
                      'w-full py-2 rounded-lg text-sm font-medium transition-all',
                      isHeating
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-orange-600 hover:bg-orange-700'
                    )}
                  >
                    {isHeating ? 'Stop Heating' : 'Start Evaporation'}
                  </button>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-red-500"
                      style={{ width: `${evaporationProgress}%` }}
                    />
                  </div>
                  {evaporationProgress >= 70 && (
                    <>
                      <button
                        onClick={startCooling}
                        className="w-full py-2 bg-emerald-600 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-all"
                      >
                        Cool Slowly (Best)
                      </button>
                      <button
                        onClick={rapidCooling}
                        className="w-full py-2 bg-cyan-600 rounded-lg text-sm font-medium hover:bg-cyan-700 transition-all text-xs"
                      >
                        Rapid Cooling (Quick)
                      </button>
                    </>
                  )}
                </>
              )}
              {stage === 'cooling' && (
                <div className="text-center py-4">
                  <div className="text-white/60 text-sm mb-2">Cooling in progress...</div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                      style={{ width: `${coolingProgress}%` }}
                    />
                  </div>
                </div>
              )}
              {stage === 'complete' && (
                <button
                  onClick={resetExperiment}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl font-medium hover:from-purple-700 hover:to-indigo-700 transition-all"
                >
                  Start New Experiment
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Center - Apparatus */}
        <div className="flex-1 flex items-center justify-center min-h-[350px]">
          <svg viewBox="0 0 500 400" className="w-full h-full max-h-[400px]">
            <defs>
              <linearGradient id="crystalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="50%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>

            {/* Bunsen Burner */}
            {(stage === 'dissolving' || stage === 'evaporating') && (
              <g transform="translate(180, 320)">
                <rect x="40" y="40" width="60" height="20" fill="#444" rx="2" />
                <rect x="55" y="20" width="30" height="25" fill="#555" rx="2" />

                {isHeating && (
                  <g className="animate-pulse">
                    <ellipse cx="70" cy="10" rx="12" ry="20" fill="#fbbf24" opacity="0.9" />
                    <ellipse cx="70" cy="5" rx="8" ry="14" fill="#f97316" />
                    <ellipse cx="70" cy="0" rx="4" ry="8" fill="#3b82f6" />
                  </g>
                )}
              </g>
            )}

            {/* Evaporating dish / Beaker */}
            <g transform="translate(150, 150)">
              {stage !== 'complete' ? (
                <>
                  {/* Evaporating dish */}
                  <ellipse cx="100" cy="120" rx="80" ry="20" fill="#d4d4d4" stroke="#a3a3a3" strokeWidth="2" />
                  <ellipse cx="100" cy="80" rx="70" ry="15" fill="none" stroke="#a3a3a3" strokeWidth="2" />
                  <path d="M 30 80 Q 20 100 30 120" fill="none" stroke="#a3a3a3" strokeWidth="2" />
                  <path d="M 170 80 Q 180 100 170 120" fill="none" stroke="#a3a3a3" strokeWidth="2" />

                  {/* Solution */}
                  <ellipse
                    cx="100"
                    cy={100 - evaporationProgress * 0.3}
                    rx={65 - evaporationProgress * 0.2}
                    ry={12 - evaporationProgress * 0.1}
                    fill={getSolutionColor()}
                  />

                  {/* Steam when evaporating */}
                  {stage === 'evaporating' && isHeating && (
                    <g className="animate-pulse" opacity="0.5">
                      <path d="M 60 60 Q 55 40 65 20" fill="none" stroke="#e5e5e5" strokeWidth="2" />
                      <path d="M 100 55 Q 95 35 105 15" fill="none" stroke="#e5e5e5" strokeWidth="2" />
                      <path d="M 140 60 Q 135 40 145 20" fill="none" stroke="#e5e5e5" strokeWidth="2" />
                    </g>
                  )}

                  {/* Crystals forming at edges during cooling */}
                  {stage === 'cooling' && coolingProgress > 30 && (
                    <g>
                      {[...Array(Math.floor(coolingProgress / 10))].map((_, i) => (
                        <polygon
                          key={i}
                          points={`${40 + i * 15},105 ${45 + i * 15},95 ${50 + i * 15},105`}
                          fill="url(#crystalGrad)"
                          opacity={0.8}
                        />
                      ))}
                    </g>
                  )}

                  {/* Stirring rod */}
                  {isStirring && (
                    <g className="animate-spin" style={{ transformOrigin: '100px 90px' }}>
                      <rect x="95" y="40" width="10" height="80" fill="#d4d4d4" rx="2" />
                    </g>
                  )}

                  {/* Undissolved solute */}
                  {addedSolute > 0 && saturationLevel < 100 && stage === 'dissolving' && (
                    <g>
                      {[...Array(Math.max(0, Math.floor((100 - saturationLevel) / 20)))].map((_, i) => (
                        <circle
                          key={i}
                          cx={70 + i * 20}
                          cy={105}
                          r={4}
                          fill="#3b82f6"
                          opacity="0.8"
                        />
                      ))}
                    </g>
                  )}
                </>
              ) : (
                /* Final crystals */
                <g>
                  <text x="100" y="30" fill="#fff" fontSize="14" textAnchor="middle" fontWeight="bold">
                    Copper Sulfate Crystals
                  </text>

                  {/* Petri dish with crystals */}
                  <ellipse cx="100" cy="100" rx="70" ry="20" fill="#f5f5f5" stroke="#d4d4d4" strokeWidth="2" />

                  {/* Crystals based on quality */}
                  {crystalQuality === 'excellent' && (
                    <g>
                      <polygon points="70,90 90,60 110,90" fill="url(#crystalGrad)" stroke="#60a5fa" strokeWidth="1" />
                      <polygon points="100,95 115,70 130,95" fill="url(#crystalGrad)" stroke="#60a5fa" strokeWidth="1" />
                      <polygon points="60,100 75,80 90,100" fill="url(#crystalGrad)" stroke="#60a5fa" strokeWidth="1" />
                    </g>
                  )}
                  {crystalQuality === 'good' && (
                    <g>
                      {[...Array(5)].map((_, i) => (
                        <polygon
                          key={i}
                          points={`${50 + i * 20},95 ${55 + i * 20},85 ${60 + i * 20},95`}
                          fill="url(#crystalGrad)"
                          stroke="#60a5fa"
                          strokeWidth="1"
                        />
                      ))}
                    </g>
                  )}
                  {crystalQuality === 'poor' && (
                    <g>
                      {[...Array(10)].map((_, i) => (
                        <circle
                          key={i}
                          cx={45 + (i % 5) * 25}
                          cy={90 + Math.floor(i / 5) * 10}
                          r={3}
                          fill="#3b82f6"
                        />
                      ))}
                    </g>
                  )}

                  <text x="100" y="140" fill="#fff" fontSize="11" textAnchor="middle" opacity="0.7">
                    Quality: {crystalQuality.charAt(0).toUpperCase() + crystalQuality.slice(1)}
                  </text>
                </g>
              )}
            </g>

            {/* Filter paper (during filtering) */}
            {stage === 'filtering' && (
              <g transform="translate(350, 180)" className="animate-pulse">
                <polygon points="0,0 40,80 -40,80" fill="#f5f5f5" stroke="#d4d4d4" strokeWidth="2" />
                <text x="0" y="100" fill="#fff" fontSize="10" textAnchor="middle">Filtering...</text>
              </g>
            )}

            {/* Temperature indicator */}
            <g transform="translate(400, 200)">
              <rect x="0" y="0" width="20" height="100" fill="#1f2937" stroke="#374151" strokeWidth="2" rx="5" />
              <rect
                x="3"
                y={100 - ((temperature - 20) / 60) * 90}
                width="14"
                height={((temperature - 20) / 60) * 90}
                fill={temperature > 60 ? '#ef4444' : temperature > 40 ? '#f59e0b' : '#3b82f6'}
                rx="3"
              />
              <circle cx="10" cy="105" r="12" fill="#ef4444" />
              <text x="10" y="130" fill="#fff" fontSize="10" textAnchor="middle">{temperature}°C</text>
            </g>

            {/* Title */}
            <text x="250" y="30" fill="#fff" fontSize="12" textAnchor="middle" opacity="0.8">
              CuSO₄·5H₂O Crystallization
            </text>
          </svg>
        </div>

        {/* Right Panel - Info */}
        <div className="lg:w-64 space-y-4 shrink-0">
          {/* Procedure */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-semibold mb-3 text-white/80">Procedure</h3>
            <ol className="text-xs text-white/60 space-y-2">
              <li className={cn(stage === 'dissolving' && 'text-blue-400')}>
                1. Add copper sulfate to warm water
              </li>
              <li className={cn(stage === 'dissolving' && 'text-blue-400')}>
                2. Stir until saturated solution forms
              </li>
              <li className={cn(stage === 'filtering' && 'text-blue-400')}>
                3. Filter to remove impurities
              </li>
              <li className={cn(stage === 'evaporating' && 'text-blue-400')}>
                4. Evaporate to concentrate
              </li>
              <li className={cn(stage === 'cooling' && 'text-blue-400')}>
                5. Cool slowly for large crystals
              </li>
              <li className={cn(stage === 'complete' && 'text-blue-400')}>
                6. Collect and dry crystals
              </li>
            </ol>
          </div>

          {/* Crystal Quality Guide */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-semibold mb-3 text-white/80">Crystal Quality</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 p-2 bg-emerald-500/10 rounded-lg">
                <div className="w-4 h-4 rotate-45 bg-gradient-to-br from-blue-400 to-cyan-400" />
                <div>
                  <div className="text-emerald-400 font-medium">Slow Cooling</div>
                  <div className="text-white/50">Large, well-formed crystals</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-amber-500/10 rounded-lg">
                <div className="flex gap-0.5">
                  <div className="w-2 h-2 bg-blue-400 rounded-full" />
                  <div className="w-2 h-2 bg-blue-400 rounded-full" />
                </div>
                <div>
                  <div className="text-amber-400 font-medium">Rapid Cooling</div>
                  <div className="text-white/50">Small, numerous crystals</div>
                </div>
              </div>
            </div>
          </div>

          {/* Properties */}
          <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
            <h3 className="text-sm font-semibold mb-2 text-blue-400">CuSO₄·5H₂O</h3>
            <ul className="text-xs text-white/70 space-y-1">
              <li>• Blue triclinic crystals</li>
              <li>• Water of crystallization: 5 molecules</li>
              <li>• Solubility increases with temperature</li>
              <li>• Dehydrates to white powder when heated</li>
            </ul>
          </div>

          {/* Safety */}
          <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20">
            <h3 className="text-sm font-semibold mb-2 text-amber-400">Safety</h3>
            <ul className="text-xs text-amber-200/80 space-y-1">
              <li>• Wear safety goggles</li>
              <li>• Handle hot apparatus with care</li>
              <li>• Copper sulfate is harmful if ingested</li>
              <li>• Wash hands after handling</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
