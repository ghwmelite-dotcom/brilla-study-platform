import { useState, useEffect } from 'react';
import { Button, Badge } from '@/components/common';
import {
  RotateCcw,
  Droplets,
  Eye,
  CheckCircle2,
  AlertCircle,
  Beaker
} from 'lucide-react';
import { cn } from '@/utils';
import type { SimReportProps } from './types';

type TitrationSimulationProps = SimReportProps;

export function TitrationSimulation({ onMeasurement, onObservation, onAction }: TitrationSimulationProps) {
  // Burette state
  const [buretteVolume, setBuretteVolume] = useState(50); // ml remaining
  const [initialReading, setInitialReading] = useState(0);
  const [isPouring, setIsPouring] = useState(false);
  const [pourRate, setPourRate] = useState<'slow' | 'fast'>('slow');

  // Flask state
  const [flaskHCl, setFlaskHCl] = useState(0); // 0 = empty, 25 = filled
  const [hasIndicator, setHasIndicator] = useState(false);
  const [naohAdded, setNaohAdded] = useState(0); // ml of NaOH added

  // Color calculation based on pH
  const [currentColor, setCurrentColor] = useState('transparent');

  // Titration values (realistic chemistry)
  const hclConcentration = 0.1; // M
  const naohConcentration = 0.1; // M
  const hclVolume = 25; // ml
  const equivalencePoint = (hclConcentration * hclVolume) / naohConcentration; // Should be 25ml

  // Steps tracking
  const [completedActions, setCompletedActions] = useState<string[]>([]);
  const [titreValues, setTitreValues] = useState<number[]>([]);
  const [currentTitration, setCurrentTitration] = useState(1);

  // Calculate solution color based on indicator and pH
  useEffect(() => {
    if (!hasIndicator || flaskHCl === 0) {
      setCurrentColor('transparent');
      return;
    }

    // Methyl orange: Red/pink in acid, Yellow in base, Orange at transition
    const percentNeutralized = naohAdded / equivalencePoint;

    if (percentNeutralized < 0.9) {
      // Acidic - Pink/Red
      setCurrentColor('rgb(255, 99, 132)');
    } else if (percentNeutralized >= 0.9 && percentNeutralized < 1.0) {
      // Transition zone - Orange
      const transition = (percentNeutralized - 0.9) / 0.1;
      const r = Math.round(255 - (transition * 30));
      const g = Math.round(99 + (transition * 100));
      const b = Math.round(132 - (transition * 132));
      setCurrentColor(`rgb(${r}, ${g}, ${b})`);
    } else if (percentNeutralized >= 1.0 && percentNeutralized < 1.02) {
      // End point - Yellow/Orange
      setCurrentColor('rgb(255, 180, 0)');
    } else {
      // Excess base - Yellow
      setCurrentColor('rgb(255, 220, 0)');
    }
  }, [hasIndicator, flaskHCl, naohAdded, equivalencePoint]);

  // Pouring animation
  useEffect(() => {
    if (!isPouring || buretteVolume <= 0) return;

    const rate = pourRate === 'slow' ? 0.1 : 0.5;
    const interval = setInterval(() => {
      setBuretteVolume(prev => {
        const newVol = Math.max(0, prev - rate);
        setNaohAdded(prevAdded => prevAdded + rate);
        return newVol;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPouring, pourRate, buretteVolume]);

  // Helper functions
  const addHClToFlask = () => {
    if (flaskHCl === 0) {
      setFlaskHCl(25);
      addCompletedAction('pipette');
      onObservation?.('Added 25ml HCl to conical flask using pipette');
      onAction?.('measure', 'app_pipette', 25);
      onAction?.('pour', 'app_conical_flask');
    }
  };

  const addIndicator = () => {
    if (flaskHCl > 0 && !hasIndicator) {
      setHasIndicator(true);
      addCompletedAction('indicator');
      onObservation?.('Added 2-3 drops of methyl orange indicator - solution turned pink/red');
      onAction?.('pour', 'app_conical_flask');
      // Setup phase complete (tile + flask positioned for the titration);
      // these are UI-static placements, so this transition is the honest
      // signal the sim can actually observe.
      onAction?.('drag', 'app_white_tile');
      onAction?.('drag', 'app_conical_flask');
    }
  };

  const recordInitialReading = () => {
    setInitialReading(50 - buretteVolume);
    addCompletedAction('initial_reading');
    onMeasurement?.(50 - buretteVolume, 'ml', 'Initial burette reading');
    onAction?.('measure', 'app_burette');
    onAction?.('record', 'app_burette');
  };

  const recordFinalReading = () => {
    const finalReading = 50 - buretteVolume;
    const titre = finalReading - initialReading;
    setTitreValues(prev => [...prev, titre]);
    addCompletedAction('final_reading');
    onMeasurement?.(finalReading, 'ml', `Final burette reading (Titration ${currentTitration})`);
    // Tag with the expectedResult condition so the grader aggregates titres
    // into 'Average titre value'.
    onMeasurement?.(titre, 'ml', `Titre value ${currentTitration}`, 'Average titre value');
    onAction?.('measure', 'app_burette');
    onAction?.('record', 'app_burette');

    // Check if at endpoint
    const percentNeutralized = naohAdded / equivalencePoint;
    if (percentNeutralized >= 0.98 && percentNeutralized <= 1.05) {
      onObservation?.(`Titration ${currentTitration}: End point reached - color changed from pink to yellow. Titre = ${titre.toFixed(1)} ml`);
      onAction?.('observe', 'app_conical_flask');
    }
  };

  const resetForNextTitration = () => {
    setBuretteVolume(50);
    setFlaskHCl(0);
    setHasIndicator(false);
    setNaohAdded(0);
    setInitialReading(0);
    setCurrentTitration(prev => prev + 1);
    setCompletedActions([]);
    // Refilling the burette with NaOH for the next titre.
    onAction?.('pour', 'app_burette');
  };

  const addCompletedAction = (action: string) => {
    if (!completedActions.includes(action)) {
      setCompletedActions(prev => [...prev, action]);
    }
  };

  const resetAll = () => {
    setBuretteVolume(50);
    setFlaskHCl(0);
    setHasIndicator(false);
    setNaohAdded(0);
    setInitialReading(0);
    setCompletedActions([]);
    setTitreValues([]);
    setCurrentTitration(1);
  };

  // Check for concordant results
  const hasConcordantResults = () => {
    if (titreValues.length < 2) return false;
    const lastTwo = titreValues.slice(-2);
    return Math.abs(lastTwo[0] - lastTwo[1]) <= 0.2;
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b">
        <div className="flex items-center gap-3">
          <Beaker className="w-5 h-5 text-purple-600" />
          <div>
            <h3 className="font-semibold text-neutral-900 text-sm">Acid-Base Titration</h3>
            <p className="text-xs text-neutral-500">Titration #{currentTitration}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {titreValues.length > 0 && (
            <Badge variant={hasConcordantResults() ? 'primary' : 'secondary'} size="sm">
              {titreValues.length} titre{titreValues.length > 1 ? 's' : ''} recorded
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={resetAll}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Simulation Area */}
      <div className="flex-1 flex items-stretch p-4 gap-4 min-h-0">
        {/* Left Side - Burette Setup */}
        <div className="flex-1 flex flex-col items-center justify-center relative">
          {/* Retort Stand */}
          <div className="absolute left-1/2 -translate-x-1/2 w-3 h-80 bg-gradient-to-b from-gray-600 to-gray-700 rounded-t"
               style={{ top: '5%' }} />
          <div className="absolute left-1/2 -translate-x-1/2 w-32 h-3 bg-gradient-to-b from-gray-500 to-gray-600 rounded"
               style={{ top: 'calc(5% + 40px)' }} />

          {/* Burette */}
          <div className="relative ml-8" style={{ marginTop: '60px' }}>
            {/* Burette body */}
            <div className="relative w-6 h-48 bg-gradient-to-r from-gray-100 via-white to-gray-100 border-2 border-gray-300 rounded-t-full">
              {/* Scale markings */}
              <div className="absolute left-full ml-1 h-full flex flex-col justify-between py-2 text-[8px] text-gray-500">
                <span>0</span>
                <span>10</span>
                <span>20</span>
                <span>30</span>
                <span>40</span>
                <span>50</span>
              </div>

              {/* NaOH Solution level */}
              <div
                className="absolute bottom-0 left-0.5 right-0.5 bg-gradient-to-t from-blue-200 to-blue-100 rounded-b transition-all duration-100"
                style={{ height: `${(buretteVolume / 50) * 100}%` }}
              />

              {/* Meniscus */}
              <div
                className="absolute left-0.5 right-0.5 h-1 bg-blue-300 rounded-full"
                style={{ bottom: `${(buretteVolume / 50) * 100}%` }}
              />
            </div>

            {/* Stopcock */}
            <div className="relative">
              <div className="w-6 h-3 bg-gradient-to-b from-amber-600 to-amber-700 rounded" />
              <div
                className={cn(
                  "absolute left-1/2 -translate-x-1/2 w-8 h-2 rounded transition-transform",
                  isPouring ? "rotate-0 bg-green-500" : "rotate-90 bg-amber-600"
                )}
                style={{ top: '50%', transform: `translateX(-50%) translateY(-50%) ${isPouring ? 'rotate(0deg)' : 'rotate(90deg)'}` }}
              />
            </div>

            {/* Burette tip with drip */}
            <div className="w-1 h-4 bg-gray-200 mx-auto">
              {isPouring && (
                <div className="w-0.5 h-12 bg-gradient-to-b from-blue-300 to-transparent mx-auto animate-pulse" />
              )}
            </div>
          </div>

          {/* Reading Display */}
          <div className="mt-4 text-center">
            <p className="text-xs text-neutral-500">Burette Reading</p>
            <p className="text-2xl font-mono font-bold text-neutral-900">
              {(50 - buretteVolume).toFixed(1)} <span className="text-sm">ml</span>
            </p>
          </div>
        </div>

        {/* Center - Conical Flask */}
        <div className="flex-1 flex flex-col items-center justify-end pb-8">
          {/* White Tile */}
          <div className="w-32 h-3 bg-gradient-to-b from-white to-gray-100 border border-gray-200 rounded shadow-sm" />

          {/* Conical Flask */}
          <div className="relative -mt-1">
            {/* Flask neck */}
            <div className="w-6 h-6 bg-gradient-to-r from-gray-100 via-white to-gray-100 border-2 border-gray-300 border-b-0 mx-auto rounded-t" />

            {/* Flask body */}
            <div className="relative w-24 sm:w-28 md:w-32">
              <svg viewBox="0 0 120 100" className="w-full h-auto">
                {/* Flask outline */}
                <path
                  d="M45 0 L45 20 L10 90 Q10 100 20 100 L100 100 Q110 100 110 90 L75 20 L75 0"
                  fill="none"
                  stroke="#d1d5db"
                  strokeWidth="3"
                />

                {/* Solution fill */}
                {flaskHCl > 0 && (
                  <path
                    d="M20 95 L100 95 Q105 95 105 90 L78 30 L42 30 L15 90 Q15 95 20 95"
                    fill={currentColor}
                    opacity={0.8}
                  />
                )}

                {/* Glass highlight */}
                <path
                  d="M48 5 L48 22 L18 88"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  opacity="0.5"
                />
              </svg>

              {/* Swirl animation when pouring */}
              {isPouring && flaskHCl > 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-white/30 border-t-white/60 rounded-full animate-spin" />
                </div>
              )}
            </div>
          </div>

          {/* Flask Info */}
          <div className="mt-4 text-center">
            <p className="text-xs text-neutral-500">Conical Flask</p>
            <div className="flex items-center justify-center gap-2 mt-1">
              {flaskHCl > 0 && <Badge variant="secondary" size="sm">25ml HCl</Badge>}
              {hasIndicator && <Badge variant="primary" size="sm">M.O.</Badge>}
            </div>
          </div>
        </div>

        {/* Right Side - Controls & Info */}
        <div className="w-56 flex flex-col gap-3 overflow-y-auto">
          {/* Action Buttons */}
          <div className="bg-white rounded-lg p-3 border shadow-sm">
            <h4 className="font-medium text-neutral-900 text-xs mb-2 uppercase tracking-wide">Actions</h4>

            <div className="space-y-2">
              {/* Step 1: Add HCl */}
              <Button
                variant={completedActions.includes('pipette') ? 'secondary' : 'outline'}
                size="sm"
                className="w-full justify-start text-xs"
                onClick={addHClToFlask}
                disabled={flaskHCl > 0}
              >
                {completedActions.includes('pipette') ? (
                  <CheckCircle2 className="w-3 h-3 mr-2 text-green-500" />
                ) : (
                  <span className="w-3 h-3 mr-2 rounded-full border border-current" />
                )}
                Pipette 25ml HCl
              </Button>

              {/* Step 2: Add Indicator */}
              <Button
                variant={completedActions.includes('indicator') ? 'secondary' : 'outline'}
                size="sm"
                className="w-full justify-start text-xs"
                onClick={addIndicator}
                disabled={flaskHCl === 0 || hasIndicator}
              >
                {completedActions.includes('indicator') ? (
                  <CheckCircle2 className="w-3 h-3 mr-2 text-green-500" />
                ) : (
                  <span className="w-3 h-3 mr-2 rounded-full border border-current" />
                )}
                Add Indicator
              </Button>

              {/* Step 3: Record Initial */}
              <Button
                variant={completedActions.includes('initial_reading') ? 'secondary' : 'outline'}
                size="sm"
                className="w-full justify-start text-xs"
                onClick={recordInitialReading}
                disabled={completedActions.includes('initial_reading')}
              >
                {completedActions.includes('initial_reading') ? (
                  <CheckCircle2 className="w-3 h-3 mr-2 text-green-500" />
                ) : (
                  <span className="w-3 h-3 mr-2 rounded-full border border-current" />
                )}
                Record Initial Reading
              </Button>

              {/* Pouring Control */}
              <div className="pt-2 border-t">
                <div className="flex gap-1 mb-2">
                  <Button
                    variant={pourRate === 'slow' ? 'primary' : 'outline'}
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => setPourRate('slow')}
                  >
                    Slow
                  </Button>
                  <Button
                    variant={pourRate === 'fast' ? 'primary' : 'outline'}
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => setPourRate('fast')}
                  >
                    Fast
                  </Button>
                </div>
                <Button
                  variant={isPouring ? 'primary' : 'outline'}
                  size="sm"
                  className="w-full text-xs"
                  onMouseDown={() => hasIndicator && setIsPouring(true)}
                  onMouseUp={() => setIsPouring(false)}
                  onMouseLeave={() => setIsPouring(false)}
                  onTouchStart={() => hasIndicator && setIsPouring(true)}
                  onTouchEnd={() => setIsPouring(false)}
                  disabled={!hasIndicator || buretteVolume <= 0}
                >
                  <Droplets className="w-3 h-3 mr-1" />
                  {isPouring ? 'Releasing...' : 'Hold to Pour NaOH'}
                </Button>
              </div>

              {/* Record Final */}
              <Button
                variant={completedActions.includes('final_reading') ? 'secondary' : 'outline'}
                size="sm"
                className="w-full justify-start text-xs"
                onClick={recordFinalReading}
                disabled={naohAdded < 20 || completedActions.includes('final_reading')}
              >
                <Eye className="w-3 h-3 mr-2" />
                Record Final Reading
              </Button>

              {/* Next Titration */}
              {completedActions.includes('final_reading') && (
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full text-xs"
                  onClick={resetForNextTitration}
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Next Titration
                </Button>
              )}
            </div>
          </div>

          {/* Titration Results */}
          {titreValues.length > 0 && (
            <div className="bg-white rounded-lg p-3 border shadow-sm">
              <h4 className="font-medium text-neutral-900 text-xs mb-2 uppercase tracking-wide">
                Titre Values
              </h4>
              <div className="space-y-1">
                {titreValues.map((titre, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500">Titration {idx + 1}</span>
                    <span className="font-mono font-medium">{titre.toFixed(2)} ml</span>
                  </div>
                ))}
                {titreValues.length >= 2 && (
                  <div className="pt-2 mt-2 border-t">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-500">Average</span>
                      <span className="font-mono font-medium text-primary">
                        {(titreValues.reduce((a, b) => a + b, 0) / titreValues.length).toFixed(2)} ml
                      </span>
                    </div>
                    {hasConcordantResults() ? (
                      <div className="flex items-center gap-1 mt-2 text-green-600 text-xs">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Concordant results achieved!</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 mt-2 text-amber-600 text-xs">
                        <AlertCircle className="w-3 h-3" />
                        <span>Results not yet concordant</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Color Guide */}
          <div className="bg-white rounded-lg p-3 border shadow-sm">
            <h4 className="font-medium text-neutral-900 text-xs mb-2 uppercase tracking-wide">
              Color Guide (Methyl Orange)
            </h4>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-pink-400 border" />
                <span className="text-neutral-600">Acidic (Pink/Red)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-orange-400 border" />
                <span className="text-neutral-600">End Point (Orange)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-yellow-400 border" />
                <span className="text-neutral-600">Alkaline (Yellow)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
