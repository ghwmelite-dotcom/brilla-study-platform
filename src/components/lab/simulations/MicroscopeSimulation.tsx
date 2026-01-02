import { useState, useEffect, useRef } from 'react';
import { Button, Badge } from '@/components/common';
import {
  RotateCcw,
  Sun,
  Move,
  Eye,
  CheckCircle2,
  Microscope
} from 'lucide-react';
import { cn } from '@/utils';

interface MicroscopeSimulationProps {
  onMeasurement?: (value: number, unit: string, label: string) => void;
  onObservation?: (text: string) => void;
}

// Specimen types with cell images
const specimens = [
  {
    id: 'onion',
    name: 'Onion Epidermis',
    description: 'Plant cells showing cell wall and nucleus',
    features: ['Cell wall', 'Nucleus', 'Cytoplasm', 'Vacuole'],
    color: '#e8f5e9',
    cellPattern: 'rectangular',
  },
  {
    id: 'cheek',
    name: 'Human Cheek Cells',
    description: 'Animal cells showing nucleus and cell membrane',
    features: ['Cell membrane', 'Nucleus', 'Cytoplasm'],
    color: '#fce4ec',
    cellPattern: 'irregular',
  },
  {
    id: 'elodea',
    name: 'Elodea Leaf',
    description: 'Aquatic plant showing chloroplasts',
    features: ['Cell wall', 'Chloroplasts', 'Cytoplasmic streaming'],
    color: '#c8e6c9',
    cellPattern: 'rectangular',
  },
  {
    id: 'blood',
    name: 'Blood Smear',
    description: 'Red and white blood cells',
    features: ['Red blood cells', 'White blood cells', 'Platelets'],
    color: '#ffebee',
    cellPattern: 'circular',
  },
];

type ObjectivePower = 4 | 10 | 40;

export function MicroscopeSimulation({ onMeasurement, onObservation }: MicroscopeSimulationProps) {
  const [currentSpecimen] = useState(specimens[Math.floor(Math.random() * specimens.length)]);
  const [objectivePower, setObjectivePower] = useState<ObjectivePower>(4);
  const [eyepiecePower] = useState(10);
  const [focusLevel, setFocusLevel] = useState(50); // 0-100
  const [coarseFocus, setCoarseFocus] = useState(50);
  const [fineFocus, setFineFocus] = useState(50);
  const [lightIntensity, setLightIntensity] = useState(50);
  const [slidePosition, setSlidePosition] = useState({ x: 50, y: 50 });
  const [hasSlide, setHasSlide] = useState(false);
  const [isLightOn, setIsLightOn] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const viewRef = useRef<HTMLDivElement>(null);

  // Calculate total magnification
  const totalMagnification = eyepiecePower * objectivePower;

  // Calculate image clarity based on focus
  useEffect(() => {
    const combinedFocus = (coarseFocus + fineFocus) / 2;
    // Focus is optimal around 50 for each power level
    const optimalFocus = 50;
    const focusError = Math.abs(combinedFocus - optimalFocus);
    const clarity = Math.max(0, 100 - focusError * 2);
    setFocusLevel(clarity);
  }, [coarseFocus, fineFocus, objectivePower]);

  // Check step completion
  const addCompletedStep = (step: string) => {
    if (!completedSteps.includes(step)) {
      setCompletedSteps(prev => [...prev, step]);
    }
  };

  const placeSlide = () => {
    setHasSlide(true);
    addCompletedStep('slide');
    onObservation?.(`Placed ${currentSpecimen.name} slide on the stage`);
  };

  const turnOnLight = () => {
    setIsLightOn(true);
    addCompletedStep('light');
    onObservation?.('Adjusted illumination - specimen is now visible');
  };

  const changeObjective = (power: ObjectivePower) => {
    setObjectivePower(power);
    // Reset focus when changing objectives
    setCoarseFocus(50);
    setFineFocus(50);
    addCompletedStep(`objective_${power}`);
    onObservation?.(`Changed to ${power}x objective lens`);
  };

  const recordMagnification = () => {
    addCompletedStep('magnification');
    onMeasurement?.(totalMagnification, 'x', 'Total Magnification');
    onObservation?.(`Total magnification: ${eyepiecePower}x (eyepiece) × ${objectivePower}x (objective) = ${totalMagnification}x`);
  };

  const resetSimulation = () => {
    setObjectivePower(4);
    setCoarseFocus(50);
    setFineFocus(50);
    setLightIntensity(50);
    setSlidePosition({ x: 50, y: 50 });
    setHasSlide(false);
    setIsLightOn(false);
    setCompletedSteps([]);
  };

  // Generate cell pattern for the view
  const renderCellPattern = () => {
    const cells = [];
    const cellSize = objectivePower === 4 ? 20 : objectivePower === 10 ? 40 : 80;
    const numCells = objectivePower === 4 ? 25 : objectivePower === 10 ? 9 : 4;

    for (let i = 0; i < numCells; i++) {
      const row = Math.floor(i / Math.sqrt(numCells));
      const col = i % Math.sqrt(numCells);

      cells.push(
        <g key={i} transform={`translate(${col * cellSize + 10}, ${row * cellSize + 10})`}>
          {currentSpecimen.cellPattern === 'rectangular' ? (
            <>
              {/* Cell wall */}
              <rect
                x="0"
                y="0"
                width={cellSize - 4}
                height={cellSize - 4}
                fill={currentSpecimen.color}
                stroke="#4caf50"
                strokeWidth={objectivePower >= 10 ? 1.5 : 0.5}
                rx="2"
              />
              {/* Nucleus */}
              {objectivePower >= 10 && (
                <ellipse
                  cx={cellSize / 2 - 2}
                  cy={cellSize / 2 - 2}
                  rx={cellSize / 6}
                  ry={cellSize / 8}
                  fill="#7b1fa2"
                  opacity="0.6"
                />
              )}
              {/* Vacuole */}
              {objectivePower >= 40 && (
                <ellipse
                  cx={cellSize / 2 - 2}
                  cy={cellSize / 3}
                  rx={cellSize / 4}
                  ry={cellSize / 5}
                  fill="#e1f5fe"
                  stroke="#0288d1"
                  strokeWidth="0.5"
                />
              )}
              {/* Chloroplasts */}
              {currentSpecimen.id === 'elodea' && objectivePower >= 40 && (
                <>
                  {[...Array(6)].map((_, j) => (
                    <ellipse
                      key={j}
                      cx={10 + (j % 3) * 12}
                      cy={10 + Math.floor(j / 3) * 15}
                      rx="3"
                      ry="2"
                      fill="#2e7d32"
                    />
                  ))}
                </>
              )}
            </>
          ) : currentSpecimen.cellPattern === 'circular' ? (
            <>
              {/* Red blood cell */}
              <circle
                cx={cellSize / 2 - 2}
                cy={cellSize / 2 - 2}
                r={cellSize / 3}
                fill="#ef5350"
                opacity="0.7"
              />
              {objectivePower >= 10 && (
                <circle
                  cx={cellSize / 2 - 2}
                  cy={cellSize / 2 - 2}
                  r={cellSize / 6}
                  fill={currentSpecimen.color}
                />
              )}
            </>
          ) : (
            <>
              {/* Irregular animal cell */}
              <ellipse
                cx={cellSize / 2 - 2}
                cy={cellSize / 2 - 2}
                rx={cellSize / 2.5 + Math.random() * 5}
                ry={cellSize / 3 + Math.random() * 5}
                fill={currentSpecimen.color}
                stroke="#e91e63"
                strokeWidth={objectivePower >= 10 ? 1 : 0.5}
              />
              {/* Nucleus */}
              {objectivePower >= 10 && (
                <circle
                  cx={cellSize / 2 - 2}
                  cy={cellSize / 2 - 2}
                  r={cellSize / 6}
                  fill="#7b1fa2"
                  opacity="0.5"
                />
              )}
            </>
          )}
        </g>
      );
    }
    return cells;
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-800 to-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-700 border-b border-slate-600">
        <div className="flex items-center gap-3">
          <Microscope className="w-5 h-5 text-blue-400" />
          <div>
            <h3 className="font-semibold text-white text-sm">Light Microscope</h3>
            <p className="text-xs text-slate-400">
              {hasSlide ? currentSpecimen.name : 'No slide loaded'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" size="sm" className="bg-blue-900 text-blue-200">
            {totalMagnification}x magnification
          </Badge>
          <Button variant="ghost" size="sm" onClick={resetSimulation} className="text-slate-300 hover:text-white">
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex p-4 gap-4 min-h-0">
        {/* Left - Microscope View */}
        <div className="flex-1 flex flex-col">
          {/* Eyepiece View */}
          <div className="flex-1 flex items-center justify-center">
            <div
              ref={viewRef}
              className="relative w-64 h-64 lg:w-80 lg:h-80 rounded-full overflow-hidden border-8 border-slate-700 shadow-2xl"
              style={{
                background: isLightOn && hasSlide
                  ? `radial-gradient(circle, rgba(255,255,255,${lightIntensity / 100}) 0%, rgba(200,200,200,${lightIntensity / 100}) 100%)`
                  : '#1a1a1a',
              }}
            >
              {/* Vignette effect */}
              <div className="absolute inset-0 rounded-full"
                   style={{
                     background: 'radial-gradient(circle, transparent 50%, rgba(0,0,0,0.7) 100%)',
                   }} />

              {/* Cell view */}
              {isLightOn && hasSlide && (
                <div
                  className="absolute inset-0 flex items-center justify-center transition-all duration-300"
                  style={{
                    filter: `blur(${Math.max(0, (100 - focusLevel) / 10)}px)`,
                    opacity: focusLevel / 100,
                    transform: `translate(${(slidePosition.x - 50) * 0.5}px, ${(slidePosition.y - 50) * 0.5}px)`,
                  }}
                >
                  <svg
                    width="100%"
                    height="100%"
                    viewBox={`0 0 ${objectivePower === 4 ? 120 : objectivePower === 10 ? 120 : 100} ${objectivePower === 4 ? 120 : objectivePower === 10 ? 120 : 100}`}
                    className="p-4"
                  >
                    {renderCellPattern()}
                  </svg>
                </div>
              )}

              {/* No slide message */}
              {!hasSlide && (
                <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm">
                  No slide on stage
                </div>
              )}

              {/* Light off message */}
              {hasSlide && !isLightOn && (
                <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm">
                  Turn on light to view
                </div>
              )}

              {/* Crosshairs */}
              {isLightOn && hasSlide && (
                <>
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-400/30" />
                  <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-400/30" />
                </>
              )}
            </div>
          </div>

          {/* Focus Quality Indicator */}
          <div className="mt-4 flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-400">Focus Quality:</span>
            </div>
            <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all rounded-full",
                  focusLevel > 80 ? "bg-green-500" :
                  focusLevel > 50 ? "bg-yellow-500" : "bg-red-500"
                )}
                style={{ width: `${focusLevel}%` }}
              />
            </div>
            <span className={cn(
              "text-xs font-medium",
              focusLevel > 80 ? "text-green-400" :
              focusLevel > 50 ? "text-yellow-400" : "text-red-400"
            )}>
              {focusLevel > 80 ? 'Sharp' : focusLevel > 50 ? 'Fair' : 'Blurry'}
            </span>
          </div>
        </div>

        {/* Right - Controls */}
        <div className="w-64 flex flex-col gap-3 overflow-y-auto">
          {/* Setup Steps */}
          <div className="bg-slate-700 rounded-lg p-3 border border-slate-600">
            <h4 className="font-medium text-white text-xs mb-2 uppercase tracking-wide">Setup</h4>
            <div className="space-y-2">
              <Button
                variant={completedSteps.includes('slide') ? 'secondary' : 'outline'}
                size="sm"
                className="w-full justify-start text-xs"
                onClick={placeSlide}
                disabled={hasSlide}
              >
                {completedSteps.includes('slide') ? (
                  <CheckCircle2 className="w-3 h-3 mr-2 text-green-400" />
                ) : (
                  <span className="w-3 h-3 mr-2 rounded-full border border-current" />
                )}
                Place Slide on Stage
              </Button>

              <Button
                variant={completedSteps.includes('light') ? 'secondary' : 'outline'}
                size="sm"
                className="w-full justify-start text-xs"
                onClick={turnOnLight}
                disabled={!hasSlide || isLightOn}
              >
                {completedSteps.includes('light') ? (
                  <CheckCircle2 className="w-3 h-3 mr-2 text-green-400" />
                ) : (
                  <Sun className="w-3 h-3 mr-2" />
                )}
                Adjust Illumination
              </Button>
            </div>
          </div>

          {/* Objective Selection */}
          <div className="bg-slate-700 rounded-lg p-3 border border-slate-600">
            <h4 className="font-medium text-white text-xs mb-2 uppercase tracking-wide">
              Objective Lens
            </h4>
            <div className="flex gap-1">
              {([4, 10, 40] as ObjectivePower[]).map((power) => (
                <Button
                  key={power}
                  variant={objectivePower === power ? 'primary' : 'outline'}
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => changeObjective(power)}
                  disabled={!hasSlide}
                >
                  {power}x
                </Button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-2 text-center">
              Total: {eyepiecePower}x × {objectivePower}x = <span className="font-bold text-blue-300">{totalMagnification}x</span>
            </p>
          </div>

          {/* Focus Controls */}
          <div className="bg-slate-700 rounded-lg p-3 border border-slate-600">
            <h4 className="font-medium text-white text-xs mb-2 uppercase tracking-wide">
              Focus Controls
            </h4>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Coarse Focus</span>
                  <span>{coarseFocus}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={coarseFocus}
                  onChange={(e) => setCoarseFocus(Number(e.target.value))}
                  className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                  disabled={!hasSlide || !isLightOn}
                />
              </div>
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Fine Focus</span>
                  <span>{fineFocus}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={fineFocus}
                  onChange={(e) => setFineFocus(Number(e.target.value))}
                  className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                  disabled={!hasSlide || !isLightOn}
                />
              </div>
            </div>
          </div>

          {/* Stage Position */}
          <div className="bg-slate-700 rounded-lg p-3 border border-slate-600">
            <h4 className="font-medium text-white text-xs mb-2 uppercase tracking-wide flex items-center gap-1">
              <Move className="w-3 h-3" />
              Stage Position
            </h4>
            <div className="grid grid-cols-3 gap-1">
              <div />
              <Button
                variant="ghost"
                size="sm"
                className="p-1 text-slate-300"
                onClick={() => setSlidePosition(p => ({ ...p, y: Math.max(0, p.y - 10) }))}
              >
                ▲
              </Button>
              <div />
              <Button
                variant="ghost"
                size="sm"
                className="p-1 text-slate-300"
                onClick={() => setSlidePosition(p => ({ ...p, x: Math.max(0, p.x - 10) }))}
              >
                ◀
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="p-1 text-slate-300 text-[10px]"
                onClick={() => setSlidePosition({ x: 50, y: 50 })}
              >
                ●
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="p-1 text-slate-300"
                onClick={() => setSlidePosition(p => ({ ...p, x: Math.min(100, p.x + 10) }))}
              >
                ▶
              </Button>
              <div />
              <Button
                variant="ghost"
                size="sm"
                className="p-1 text-slate-300"
                onClick={() => setSlidePosition(p => ({ ...p, y: Math.min(100, p.y + 10) }))}
              >
                ▼
              </Button>
              <div />
            </div>
          </div>

          {/* Light Control */}
          {isLightOn && (
            <div className="bg-slate-700 rounded-lg p-3 border border-slate-600">
              <h4 className="font-medium text-white text-xs mb-2 uppercase tracking-wide flex items-center gap-1">
                <Sun className="w-3 h-3 text-yellow-400" />
                Light Intensity
              </h4>
              <input
                type="range"
                min="20"
                max="100"
                value={lightIntensity}
                onChange={(e) => setLightIntensity(Number(e.target.value))}
                className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          )}

          {/* Record Button */}
          <Button
            variant="primary"
            size="sm"
            className="w-full text-xs"
            onClick={recordMagnification}
            disabled={!hasSlide || !isLightOn || focusLevel < 50}
          >
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Record Magnification ({totalMagnification}x)
          </Button>

          {/* Specimen Info */}
          {hasSlide && (
            <div className="bg-slate-700 rounded-lg p-3 border border-slate-600">
              <h4 className="font-medium text-white text-xs mb-2 uppercase tracking-wide">
                Specimen Info
              </h4>
              <p className="text-sm text-white font-medium">{currentSpecimen.name}</p>
              <p className="text-xs text-slate-400 mt-1">{currentSpecimen.description}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {currentSpecimen.features.map((feature) => (
                  <Badge
                    key={feature}
                    variant="secondary"
                    size="sm"
                    className="text-[10px] bg-slate-600"
                  >
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
