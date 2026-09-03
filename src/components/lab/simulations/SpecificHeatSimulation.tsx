import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/utils';
import type { SimReportProps } from './types';

type SpecificHeatSimulationProps = SimReportProps;

interface DataPoint {
  massWater: number;
  massMetal: number;
  tempWater: number;
  tempMetal: number;
  tempFinal: number;
  specificHeat: number;
}

export function SpecificHeatSimulation({ onMeasurement, onObservation, onAction }: SpecificHeatSimulationProps) {
  const [stage, setStage] = useState<'setup' | 'heating' | 'mixing' | 'results'>('setup');
  const [selectedMetal, setSelectedMetal] = useState<'aluminum' | 'copper' | 'iron'>('aluminum');
  const [massWater, setMassWater] = useState(100);
  const [massMetal, setMassMetal] = useState(50);
  const [tempWater, setTempWater] = useState(25);
  const [tempMetal, setTempMetal] = useState(25);
  const [finalTemp, setFinalTemp] = useState(25);
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [isHeating, setIsHeating] = useState(false);
  // Track internal state (not displayed but needed for animations)
  const [, setHeatingTime] = useState(0);
  const [, setMixingTime] = useState(0);
  const [isMixing, setIsMixing] = useState(false);

  const calculateFinalTempRef = useRef<() => number>(() => 25);
  const onObservationRef = useRef(onObservation);
  onObservationRef.current = onObservation;
  const onActionRef = useRef(onAction);
  onActionRef.current = onAction;
  // Metal properties (specific heat in J/g°C)
  const metals = {
    aluminum: { name: 'Aluminum', color: '#C0C0C0', actualSHC: 0.897, maxTemp: 100 },
    copper: { name: 'Copper', color: '#B87333', actualSHC: 0.385, maxTemp: 100 },
    iron: { name: 'Iron', color: '#434343', actualSHC: 0.449, maxTemp: 100 },
  };

  const currentMetal = metals[selectedMetal];

  // Heating effect
  useEffect(() => {
    if (!isHeating) return;
    const interval = setInterval(() => {
      setHeatingTime(prev => prev + 1);
      setTempMetal(prev => {
        const newTemp = Math.min(prev + 2, currentMetal.maxTemp);
        if (newTemp >= currentMetal.maxTemp) {
          setIsHeating(false);
          onObservationRef.current?.(`Metal heated to ${newTemp}°C - ready for transfer`);
          onActionRef.current?.('observe', 'app_thermometer');
        }
        return newTemp;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isHeating, currentMetal.maxTemp]);

  // Mixing/equilibration effect
  useEffect(() => {
    if (!isMixing) return;

    // Calculate final temperature using heat exchange
    const targetTemp = calculateFinalTempRef.current();

    const interval = setInterval(() => {
      setMixingTime(prev => prev + 1);
      setFinalTemp(prev => {
        const diff = targetTemp - prev;
        if (Math.abs(diff) < 0.1) {
          setIsMixing(false);
          onObservationRef.current?.(`Thermal equilibrium reached at ${targetTemp.toFixed(1)}°C`);
          onActionRef.current?.('measure', 'app_thermometer', targetTemp);
          onActionRef.current?.('observe', 'app_thermometer');
          return targetTemp;
        }
        return prev + diff * 0.1;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isMixing]);

  const calculateFinalTemp = useCallback(() => {
    // Q_lost by metal = Q_gained by water
    // m_metal * c_metal * (T_metal - T_final) = m_water * c_water * (T_final - T_water)
    const cWater = 4.186; // J/g°C
    const cMetal = currentMetal.actualSHC;

    const numerator = (massMetal * cMetal * tempMetal) + (massWater * cWater * tempWater);
    const denominator = (massMetal * cMetal) + (massWater * cWater);

    return numerator / denominator;
  }, [massMetal, massWater, tempMetal, tempWater, currentMetal.actualSHC]);

  calculateFinalTempRef.current = calculateFinalTemp;
  const calculateSHC = useCallback(() => {
    // c_metal = (m_water * c_water * (T_final - T_water)) / (m_metal * (T_metal - T_final))
    const cWater = 4.186;
    const deltaWater = finalTemp - tempWater;
    const deltaMetal = tempMetal - finalTemp;

    if (deltaMetal === 0) return 0;

    return (massWater * cWater * deltaWater) / (massMetal * deltaMetal);
  }, [massWater, massMetal, tempWater, tempMetal, finalTemp]);

  const startHeating = () => {
    setIsHeating(true);
    setStage('heating');
    onObservationRef.current?.('Heating metal in boiling water bath...');
    // Metal weighed and water measured out before heating begins.
    onAction?.('measure', 'app_balance', massMetal);
    onAction?.('record', 'app_balance');
    onAction?.('adjust', 'app_beaker_250', massWater);
    onAction?.('heat', 'app_bunsen_burner');
  };

  const transferMetal = () => {
    if (tempMetal < 80) {
      onObservationRef.current?.('Metal not hot enough. Heat until at least 80°C');
      return;
    }
    setStage('mixing');
    setFinalTemp(tempWater);
    setIsMixing(true);
    onObservationRef.current?.(`Transferring ${currentMetal.name} (${tempMetal}°C) to calorimeter water (${tempWater}°C)`);
    onAction?.('measure', 'app_thermometer', tempMetal);
    onAction?.('drag', 'app_calorimeter');
    onAction?.('pour', 'app_calorimeter');
  };

  const recordResult = () => {
    const calculatedSHC = calculateSHC();
    const newPoint: DataPoint = {
      massWater,
      massMetal,
      tempWater,
      tempMetal,
      tempFinal: finalTemp,
      specificHeat: calculatedSHC,
    };
    setDataPoints(prev => [...prev, newPoint]);
    // Tag with the matching expectedResult condition so the grader checks
    // against the metal's accepted SHC (iron has no expectedResult).
    const condition = selectedMetal === 'copper'
      ? 'Specific heat capacity of copper'
      : selectedMetal === 'aluminum'
        ? 'Specific heat capacity of aluminum'
        : undefined;
    onMeasurement?.(calculatedSHC, 'J/g°C', `Specific heat of ${currentMetal.name}`, condition);
    onObservationRef.current?.(`Calculated specific heat: ${calculatedSHC.toFixed(3)} J/g°C (Actual: ${currentMetal.actualSHC} J/g°C)`);
    onAction?.('record', 'app_thermometer');
    setStage('results');
  };

  const resetExperiment = () => {
    setStage('setup');
    setTempMetal(25);
    setTempWater(25);
    setFinalTemp(25);
    setHeatingTime(0);
    setMixingTime(0);
    setIsHeating(false);
    setIsMixing(false);
  };

  // Temperature visualization helper
  const getTempColor = (temp: number) => {
    if (temp < 30) return '#3b82f6'; // blue
    if (temp < 50) return '#22c55e'; // green
    if (temp < 70) return '#eab308'; // yellow
    if (temp < 90) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4 overflow-auto">
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
          Specific Heat Capacity
        </h2>
        <p className="text-white/60 text-sm">Method of Mixtures - Calorimetry</p>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
        {/* Left Panel - Controls */}
        <div className="lg:w-64 space-y-4 shrink-0">
          {/* Metal Selection */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-semibold mb-3 text-white/80">Select Metal</h3>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(metals) as Array<keyof typeof metals>).map((metal) => (
                <button
                  key={metal}
                  onClick={() => stage === 'setup' && setSelectedMetal(metal)}
                  disabled={stage !== 'setup'}
                  className={cn(
                    'p-2 rounded-lg text-xs font-medium transition-all border',
                    selectedMetal === metal
                      ? 'bg-orange-500/20 border-orange-500/50 text-orange-300'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                  )}
                >
                  <div
                    className="w-6 h-6 rounded-full mx-auto mb-1 border-2 border-white/20"
                    style={{ backgroundColor: metals[metal].color }}
                  />
                  {metals[metal].name}
                </button>
              ))}
            </div>
          </div>

          {/* Mass Controls */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-semibold mb-3 text-white/80">Masses</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-white/60 block mb-1">Water Mass (g)</label>
                <input
                  type="range"
                  min="50"
                  max="200"
                  value={massWater}
                  onChange={(e) => stage === 'setup' && setMassWater(Number(e.target.value))}
                  disabled={stage !== 'setup'}
                  className="w-full accent-blue-500"
                />
                <span className="text-sm font-mono text-blue-400">{massWater}g</span>
              </div>
              <div>
                <label className="text-xs text-white/60 block mb-1">Metal Mass (g)</label>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={massMetal}
                  onChange={(e) => stage === 'setup' && setMassMetal(Number(e.target.value))}
                  disabled={stage !== 'setup'}
                  className="w-full accent-orange-500"
                />
                <span className="text-sm font-mono text-orange-400">{massMetal}g</span>
              </div>
            </div>
          </div>

          {/* Temperature Display */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-semibold mb-3 text-white/80">Temperatures</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-white/60">Water:</span>
                <span className="font-mono" style={{ color: getTempColor(tempWater) }}>
                  {tempWater.toFixed(1)}°C
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/60">Metal:</span>
                <span className="font-mono" style={{ color: getTempColor(tempMetal) }}>
                  {tempMetal.toFixed(1)}°C
                </span>
              </div>
              {stage === 'mixing' || stage === 'results' ? (
                <div className="flex justify-between items-center pt-2 border-t border-white/10">
                  <span className="text-white/60">Final:</span>
                  <span className="font-mono text-emerald-400">
                    {finalTemp.toFixed(1)}°C
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            {stage === 'setup' && (
              <button
                onClick={startHeating}
                className="w-full py-3 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl font-medium hover:from-orange-700 hover:to-red-700 transition-all"
              >
                Start Heating Metal
              </button>
            )}
            {stage === 'heating' && (
              <button
                onClick={transferMetal}
                disabled={tempMetal < 80}
                className={cn(
                  'w-full py-3 rounded-xl font-medium transition-all',
                  tempMetal >= 80
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'
                    : 'bg-white/10 text-white/30 cursor-not-allowed'
                )}
              >
                {tempMetal >= 80 ? 'Transfer to Calorimeter' : `Heating... ${tempMetal.toFixed(0)}°C`}
              </button>
            )}
            {stage === 'mixing' && !isMixing && (
              <button
                onClick={recordResult}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl font-medium hover:from-emerald-700 hover:to-teal-700 transition-all"
              >
                Record Results
              </button>
            )}
            {stage === 'results' && (
              <button
                onClick={resetExperiment}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl font-medium hover:from-purple-700 hover:to-indigo-700 transition-all"
              >
                New Trial
              </button>
            )}
          </div>
        </div>

        {/* Center - Apparatus Visualization */}
        <div className="flex-1 flex items-center justify-center min-h-[300px]">
          <svg viewBox="0 0 500 400" className="w-full h-full max-h-[400px]">
            {/* Background Grid */}
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
              </pattern>
              <linearGradient id="waterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.9" />
              </linearGradient>
              <linearGradient id="heatGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="50%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#fbbf24" />
              </linearGradient>
            </defs>
            <rect width="500" height="400" fill="url(#grid)" />

            {/* Bunsen Burner (when heating) */}
            {(stage === 'setup' || stage === 'heating') && (
              <g transform="translate(100, 280)">
                {/* Burner base */}
                <rect x="20" y="80" width="60" height="20" fill="#444" rx="2" />
                <rect x="35" y="60" width="30" height="25" fill="#555" rx="2" />

                {/* Flame */}
                {isHeating && (
                  <g className="animate-pulse">
                    <ellipse cx="50" cy="50" rx="15" ry="25" fill="#fbbf24" opacity="0.9" />
                    <ellipse cx="50" cy="45" rx="10" ry="18" fill="#f97316" />
                    <ellipse cx="50" cy="40" rx="6" ry="12" fill="#3b82f6" />
                  </g>
                )}

                {/* Beaker with boiling water */}
                <rect x="20" y="0" width="60" height="60" fill="none" stroke="#94a3b8" strokeWidth="3" rx="2" />
                <rect x="23" y="20" width="54" height="37" fill="url(#waterGrad)" opacity="0.7" />

                {/* Metal in beaker */}
                <ellipse
                  cx="50"
                  cy="45"
                  rx="12"
                  ry="8"
                  fill={currentMetal.color}
                  stroke="#fff"
                  strokeWidth="1"
                  opacity="0.9"
                />

                {/* Steam bubbles */}
                {isHeating && (
                  <>
                    <circle cx="35" cy="30" r="3" fill="#fff" opacity="0.5" className="animate-bounce" />
                    <circle cx="50" cy="25" r="4" fill="#fff" opacity="0.4" className="animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <circle cx="65" cy="28" r="3" fill="#fff" opacity="0.5" className="animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </>
                )}

                {/* Thermometer in beaker */}
                <rect x="70" y="-10" width="4" height="70" fill="#dc2626" rx="2" />
                <circle cx="72" cy="55" r="6" fill="#dc2626" />
                <text x="85" y="5" fill="#fff" fontSize="12" fontFamily="monospace">
                  {tempMetal.toFixed(0)}°C
                </text>
              </g>
            )}

            {/* Calorimeter */}
            <g transform="translate(280, 150)">
              {/* Outer container (styrofoam) */}
              <rect x="0" y="0" width="120" height="150" fill="#e5e5e5" stroke="#d4d4d4" strokeWidth="2" rx="5" />

              {/* Inner container */}
              <rect x="10" y="10" width="100" height="130" fill="#f5f5f5" stroke="#d4d4d4" strokeWidth="1" rx="3" />

              {/* Water */}
              <rect
                x="15"
                y="50"
                width="90"
                height="85"
                fill="url(#waterGrad)"
                opacity="0.8"
                rx="2"
              />

              {/* Metal (after transfer) */}
              {(stage === 'mixing' || stage === 'results') && (
                <ellipse
                  cx="60"
                  cy="110"
                  rx="20"
                  ry="12"
                  fill={currentMetal.color}
                  stroke="#fff"
                  strokeWidth="1"
                  className={isMixing ? 'animate-pulse' : ''}
                />
              )}

              {/* Heat transfer visualization */}
              {isMixing && (
                <g className="animate-pulse">
                  {[...Array(5)].map((_, i) => (
                    <circle
                      key={i}
                      cx={40 + i * 10}
                      cy={90}
                      r={3}
                      fill="#f97316"
                      opacity={0.6 - i * 0.1}
                    />
                  ))}
                </g>
              )}

              {/* Thermometer */}
              <rect x="55" y="-20" width="5" height="90" fill="#dc2626" rx="2" />
              <circle cx="57.5" cy="65" r="8" fill="#dc2626" />

              {/* Lid */}
              <rect x="-5" y="-5" width="130" height="15" fill="#d4d4d4" rx="3" />
              <rect x="52" y="-25" width="10" height="25" fill="#d4d4d4" rx="2" />

              {/* Temperature reading */}
              <text x="75" y="-10" fill="#fff" fontSize="14" fontFamily="monospace" fontWeight="bold">
                {(stage === 'mixing' || stage === 'results') ? finalTemp.toFixed(1) : tempWater.toFixed(1)}°C
              </text>

              {/* Labels */}
              <text x="60" y="175" fill="#fff" fontSize="11" textAnchor="middle" opacity="0.7">
                Calorimeter
              </text>
            </g>

            {/* Transfer Arrow */}
            {stage === 'heating' && tempMetal >= 80 && (
              <g className="animate-pulse">
                <path
                  d="M 180 310 Q 230 280 280 250"
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="3"
                  strokeDasharray="8,4"
                  markerEnd="url(#arrow)"
                />
                <defs>
                  <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L9,3 z" fill="#f97316" />
                  </marker>
                </defs>
                <text x="210" y="260" fill="#f97316" fontSize="11" fontWeight="bold">
                  Transfer quickly!
                </text>
              </g>
            )}

            {/* Stage indicator */}
            <text x="250" y="30" fill="#fff" fontSize="14" textAnchor="middle" fontWeight="bold">
              {stage === 'setup' && 'Setup - Select metal and masses'}
              {stage === 'heating' && `Heating ${currentMetal.name}...`}
              {stage === 'mixing' && 'Thermal equilibration in progress...'}
              {stage === 'results' && 'Equilibrium reached - Record your results'}
            </text>
          </svg>
        </div>

        {/* Right Panel - Results */}
        <div className="lg:w-72 space-y-4 shrink-0">
          {/* Formula */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-semibold mb-2 text-white/80">Formula</h3>
            <div className="bg-black/30 rounded-lg p-3 text-center font-mono text-sm">
              <div className="text-orange-300">Heat lost = Heat gained</div>
              <div className="text-white/70 mt-1 text-xs">
                m<sub>s</sub>c<sub>s</sub>(θ<sub>s</sub>-θ<sub>f</sub>) = m<sub>w</sub>c<sub>w</sub>(θ<sub>f</sub>-θ<sub>w</sub>)
              </div>
            </div>
          </div>

          {/* Calculation */}
          {(stage === 'mixing' || stage === 'results') && (
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="text-sm font-semibold mb-2 text-white/80">Calculation</h3>
              <div className="space-y-1 text-xs font-mono">
                <div className="text-white/60">m<sub>water</sub> = {massWater}g</div>
                <div className="text-white/60">m<sub>metal</sub> = {massMetal}g</div>
                <div className="text-white/60">θ<sub>water</sub> = {tempWater}°C</div>
                <div className="text-white/60">θ<sub>metal</sub> = {tempMetal.toFixed(1)}°C</div>
                <div className="text-emerald-400">θ<sub>final</sub> = {finalTemp.toFixed(1)}°C</div>
                {stage === 'results' && (
                  <div className="pt-2 border-t border-white/10 mt-2">
                    <div className="text-orange-400">
                      c = {calculateSHC().toFixed(3)} J/g°C
                    </div>
                    <div className="text-white/40 text-xs mt-1">
                      (Actual: {currentMetal.actualSHC} J/g°C)
                    </div>
                    <div className={cn(
                      "text-xs mt-1",
                      Math.abs(calculateSHC() - currentMetal.actualSHC) / currentMetal.actualSHC < 0.1
                        ? "text-emerald-400"
                        : "text-amber-400"
                    )}>
                      Error: {((Math.abs(calculateSHC() - currentMetal.actualSHC) / currentMetal.actualSHC) * 100).toFixed(1)}%
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Results Table */}
          {dataPoints.length > 0 && (
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="text-sm font-semibold mb-2 text-white/80">Results</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-white/50">
                      <th className="text-left py-1">#</th>
                      <th className="text-right py-1">c (J/g°C)</th>
                      <th className="text-right py-1">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataPoints.map((point, idx) => (
                      <tr key={idx} className="border-t border-white/10">
                        <td className="py-1">{idx + 1}</td>
                        <td className="text-right font-mono text-orange-300">
                          {point.specificHeat.toFixed(3)}
                        </td>
                        <td className="text-right font-mono text-white/60">
                          {((Math.abs(point.specificHeat - currentMetal.actualSHC) / currentMetal.actualSHC) * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {dataPoints.length > 1 && (
                    <tfoot className="border-t border-white/20">
                      <tr>
                        <td className="py-1 font-medium">Avg</td>
                        <td className="text-right font-mono text-emerald-400">
                          {(dataPoints.reduce((sum, p) => sum + p.specificHeat, 0) / dataPoints.length).toFixed(3)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20">
            <h3 className="text-sm font-semibold mb-2 text-amber-400">Tips</h3>
            <ul className="text-xs text-amber-200/80 space-y-1">
              <li>• Transfer the metal quickly to minimize heat loss</li>
              <li>• Stir gently to ensure uniform temperature</li>
              <li>• Record the highest temperature reached</li>
              <li>• Repeat trials for better accuracy</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
