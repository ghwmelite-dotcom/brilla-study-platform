import { useState, useEffect, useCallback } from 'react';
import { Button, Badge } from '@/components/common';
import {
  RotateCcw,
  Droplets,
  Eye,
  CheckCircle2,
  Scale,
  Timer,
  Microscope,
  Play,
  Pause,
  BarChart3,
  Beaker,
  FlaskConical
} from 'lucide-react';
import { cn } from '@/utils';
import type { SimReportProps } from './types';

type OsmosisSimulationProps = SimReportProps;

// Sucrose concentrations for the experiment
const concentrations = [
  { id: 0, label: '0M (Distilled Water)', value: 0, color: '#e3f2fd' },
  { id: 1, label: '0.2M Sucrose', value: 0.2, color: '#bbdefb' },
  { id: 2, label: '0.4M Sucrose', value: 0.4, color: '#90caf9' },
  { id: 3, label: '0.6M Sucrose', value: 0.6, color: '#64b5f6' },
  { id: 4, label: '0.8M Sucrose', value: 0.8, color: '#42a5f5' },
  { id: 5, label: '1.0M Sucrose', value: 1.0, color: '#2196f3' },
];

interface PotatoStrip {
  id: number;
  initialMass: number;
  currentMass: number;
  inSolution: number | null; // concentration id
  timeInSolution: number; // seconds
}

type ExperimentPhase = 'setup' | 'weighing' | 'soaking' | 'results' | 'plasmolysis';

export function OsmosisSimulation({ onMeasurement, onObservation, onAction }: OsmosisSimulationProps) {
  // Experiment phase
  const [phase, setPhase] = useState<ExperimentPhase>('setup');

  // Potato strips state
  const [strips, setStrips] = useState<PotatoStrip[]>(() =>
    concentrations.map((_, i) => ({
      id: i,
      initialMass: 2.5 + Math.random() * 0.2, // ~2.5-2.7g each
      currentMass: 2.5 + Math.random() * 0.2,
      inSolution: null,
      timeInSolution: 0,
    }))
  );

  // Timer state
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const targetTime = 30 * 60; // 30 minutes in seconds (but we'll simulate faster)
  const simulationSpeed = 60; // 1 real second = 60 simulated seconds

  // Weighed strips
  const [weighedInitial, setWeighedInitial] = useState<Set<number>>(new Set());
  const [weighedFinal, setWeighedFinal] = useState<Set<number>>(new Set());

  // Plasmolysis state
  const [showPlasmolysis, setShowPlasmolysis] = useState(false);
  const [plasmolysisProgress, setPlasmolysisProgress] = useState(0); // 0-100
  const [selectedCellView, setSelectedCellView] = useState<'normal' | 'salt'>('normal');
  const [microscopeFocus, setMicroscopeFocus] = useState(75);

  // Graph data
  const [showGraph, setShowGraph] = useState(false);

  // Calculate mass change based on concentration
  const calculateMassChange = useCallback((strip: PotatoStrip, time: number): number => {
    if (strip.inSolution === null) return strip.initialMass;

    const concentration = concentrations[strip.inSolution].value;
    const isotonic = 0.45; // Isotonic point ~0.45M

    // Calculate percentage change
    // In hypotonic (low conc): gain water, mass increases
    // In hypertonic (high conc): lose water, mass decreases
    const maxChange = 0.20; // Max 20% change
    const timeProgress = Math.min(time / (30 * 60), 1); // Progress over 30 min

    let percentChange: number;
    if (concentration < isotonic) {
      // Hypotonic - gain water
      percentChange = maxChange * (1 - concentration / isotonic) * timeProgress;
    } else {
      // Hypertonic - lose water
      percentChange = -maxChange * ((concentration - isotonic) / (1 - isotonic)) * timeProgress;
    }

    return strip.initialMass * (1 + percentChange);
  }, []);

  // Timer effect
  useEffect(() => {
    if (!isTimerRunning) return;

    const interval = setInterval(() => {
      setElapsedTime(prev => {
        const newTime = prev + simulationSpeed;

        // Update strip masses
        setStrips(currentStrips =>
          currentStrips.map(strip => {
            if (strip.inSolution !== null) {
              const newTimeInSolution = strip.timeInSolution + simulationSpeed;
              return {
                ...strip,
                currentMass: calculateMassChange(strip, newTimeInSolution),
                timeInSolution: newTimeInSolution,
              };
            }
            return strip;
          })
        );

        if (newTime >= targetTime) {
          setIsTimerRunning(false);
          setPhase('results');
          onObservation?.('30 minutes complete! Remove strips and weigh final masses.');
          onAction?.('observe', 'app_petri_dish');
        }

        return Math.min(newTime, targetTime);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning, calculateMassChange, onObservation, onAction, targetTime]);

  // Plasmolysis animation
  useEffect(() => {
    if (!showPlasmolysis || selectedCellView !== 'salt') return;

    const interval = setInterval(() => {
      setPlasmolysisProgress(prev => Math.min(prev + 2, 100));
    }, 100);

    return () => clearInterval(interval);
  }, [showPlasmolysis, selectedCellView]);

  // Place strip in solution
  const placeStripInSolution = (stripId: number, concentrationId: number) => {
    if (phase !== 'weighing' || !weighedInitial.has(stripId)) return;

    setStrips(prev => prev.map(s =>
      s.id === stripId ? { ...s, inSolution: concentrationId, timeInSolution: 0 } : s
    ));

    const allPlaced = strips.every((s, i) => i === stripId || s.inSolution !== null);
    onAction?.('drag', 'app_petri_dish');
    if (allPlaced || strips.filter(s => s.inSolution !== null).length === 5) {
      onObservation?.(`Placed all potato strips in their solutions. Start the timer!`);
      setPhase('soaking');
    } else {
      onObservation?.(`Placed strip ${stripId + 1} in ${concentrations[concentrationId].label}`);
    }
  };

  // Weigh strip
  const weighStrip = (stripId: number, isFinal: boolean) => {
    const strip = strips[stripId];

    if (isFinal) {
      setWeighedFinal(prev => new Set([...prev, stripId]));
      onMeasurement?.(strip.currentMass, 'g', `Strip ${stripId + 1} final mass (${concentrations[strip.inSolution!]?.label})`);
      onAction?.('measure', 'app_balance', strip.currentMass);
      onAction?.('record', 'app_balance');

      const percentChange = ((strip.currentMass - strip.initialMass) / strip.initialMass) * 100;
      onObservation?.(`Strip ${stripId + 1}: Initial ${strip.initialMass.toFixed(2)}g → Final ${strip.currentMass.toFixed(2)}g (${percentChange > 0 ? '+' : ''}${percentChange.toFixed(1)}%)`);
    } else {
      setWeighedInitial(prev => new Set([...prev, stripId]));
      onMeasurement?.(strip.initialMass, 'g', `Strip ${stripId + 1} initial mass`);
      onAction?.('measure', 'app_balance', strip.initialMass);
      onAction?.('record', 'app_balance');
      onObservation?.(`Weighed strip ${stripId + 1}: ${strip.initialMass.toFixed(2)}g`);

      if (weighedInitial.size === 5) {
        setPhase('weighing');
        onObservation?.('All initial masses recorded. Now place each strip in a different solution.');
      }
    }
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate percentage change
  const getPercentChange = (strip: PotatoStrip) => {
    return ((strip.currentMass - strip.initialMass) / strip.initialMass) * 100;
  };

  // Reset simulation
  const resetSimulation = () => {
    setPhase('setup');
    setStrips(concentrations.map((_, i) => ({
      id: i,
      initialMass: 2.5 + Math.random() * 0.2,
      currentMass: 2.5 + Math.random() * 0.2,
      inSolution: null,
      timeInSolution: 0,
    })));
    setWeighedInitial(new Set());
    setWeighedFinal(new Set());
    setIsTimerRunning(false);
    setElapsedTime(0);
    setShowGraph(false);
    setShowPlasmolysis(false);
    setPlasmolysisProgress(0);
    setSelectedCellView('normal');
  };

  // Start experiment
  const startExperiment = () => {
    setPhase('weighing');
    onObservation?.('Cut 6 potato strips of equal size. Now weigh each strip.');
    onAction?.('drag', 'app_scalpel');
  };

  // Render potato strip
  const renderPotatoStrip = (strip: PotatoStrip, inBeaker: boolean = false) => {
    const percentChange = getPercentChange(strip);
    const widthModifier = 1 + (percentChange / 200); // Subtle width change

    return (
      <div
        className={cn(
          "relative transition-all duration-500",
          inBeaker ? "w-3" : "w-4"
        )}
        style={{
          height: inBeaker ? '40px' : '50px',
          transform: `scaleX(${widthModifier})`,
        }}
      >
        {/* Potato strip */}
        <div
          className={cn(
            "absolute inset-0 rounded-sm",
            "bg-gradient-to-b from-amber-200 via-amber-300 to-amber-400",
            "border border-amber-500/50"
          )}
          style={{
            opacity: strip.inSolution !== null ? 0.9 : 1,
          }}
        >
          {/* Texture lines */}
          <div className="absolute inset-0 opacity-20">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="absolute w-full h-px bg-amber-700"
                style={{ top: `${25 + i * 20}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render beaker with solution
  const renderBeaker = (concentration: typeof concentrations[0], strip?: PotatoStrip) => {
    const hasStrip = strip?.inSolution === concentration.id;

    return (
      <div className="flex flex-col items-center gap-1">
        {/* Beaker */}
        <div
          className={cn(
            "relative w-14 h-20 rounded-b-lg border-2 border-slate-400",
            "bg-gradient-to-b from-white/10 to-white/5",
            "overflow-hidden cursor-pointer transition-all",
            phase === 'weighing' && !hasStrip && "hover:border-blue-400 hover:scale-105"
          )}
          onClick={() => {
            if (phase === 'weighing') {
              const availableStrip = strips.find(s =>
                s.inSolution === null && weighedInitial.has(s.id)
              );
              if (availableStrip) {
                placeStripInSolution(availableStrip.id, concentration.id);
              }
            }
          }}
        >
          {/* Solution */}
          <div
            className="absolute bottom-0 left-0 right-0 transition-all"
            style={{
              height: '70%',
              background: `linear-gradient(to top, ${concentration.color}, ${concentration.color}88)`,
            }}
          >
            {/* Water surface effect */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-white/30" />
          </div>

          {/* Potato strip in solution */}
          {hasStrip && strip && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
              {renderPotatoStrip(strip, true)}
            </div>
          )}

          {/* Beaker markings */}
          <div className="absolute left-1 top-4 bottom-8 w-px bg-slate-300/50" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="absolute left-1 w-2 h-px bg-slate-300/50" style={{ top: `${30 + i * 20}%` }} />
          ))}
        </div>

        {/* Label */}
        <div className="text-center">
          <div className="text-[10px] font-medium text-white">{concentration.value}M</div>
          <div className="text-[8px] text-slate-400">
            {concentration.value === 0 ? 'Water' : 'Sucrose'}
          </div>
        </div>
      </div>
    );
  };

  // Render cell for plasmolysis view
  const renderCell = (index: number, isPlasmolysed: boolean) => {
    const plasmolysisAmount = isPlasmolysed ? plasmolysisProgress / 100 : 0;
    const cellSize = 80;
    const membraneOffset = plasmolysisAmount * 15;

    return (
      <g key={index} transform={`translate(${(index % 3) * 90 + 20}, ${Math.floor(index / 3) * 90 + 20})`}>
        {/* Cell wall - always stays the same */}
        <rect
          x="0"
          y="0"
          width={cellSize}
          height={cellSize}
          fill="none"
          stroke="#4caf50"
          strokeWidth="3"
          rx="4"
        />

        {/* Cell membrane - shrinks during plasmolysis */}
        <rect
          x={membraneOffset}
          y={membraneOffset}
          width={cellSize - membraneOffset * 2}
          height={cellSize - membraneOffset * 2}
          fill={isPlasmolysed ? '#fff3e0' : '#e8f5e9'}
          stroke="#81c784"
          strokeWidth="2"
          rx="3"
          className="transition-all duration-300"
        />

        {/* Vacuole - shrinks more during plasmolysis */}
        <ellipse
          cx={cellSize / 2}
          cy={cellSize / 2}
          rx={Math.max(5, (cellSize / 2.5) - membraneOffset * 1.5)}
          ry={Math.max(5, (cellSize / 3) - membraneOffset * 1.5)}
          fill="#e1f5fe"
          stroke="#4fc3f7"
          strokeWidth="1"
          className="transition-all duration-300"
        />

        {/* Nucleus */}
        <ellipse
          cx={cellSize / 2 + membraneOffset * 0.5}
          cy={cellSize / 2}
          rx="10"
          ry="8"
          fill="#7b1fa2"
          opacity="0.6"
        />

        {/* Gap between membrane and wall during plasmolysis */}
        {isPlasmolysed && plasmolysisAmount > 0.3 && (
          <>
            <line x1="3" y1="3" x2={membraneOffset - 2} y2={membraneOffset - 2} stroke="#64b5f6" strokeWidth="1" strokeDasharray="2,2" />
            <line x1={cellSize - 3} y1="3" x2={cellSize - membraneOffset + 2} y2={membraneOffset - 2} stroke="#64b5f6" strokeWidth="1" strokeDasharray="2,2" />
            <line x1="3" y1={cellSize - 3} x2={membraneOffset - 2} y2={cellSize - membraneOffset + 2} stroke="#64b5f6" strokeWidth="1" strokeDasharray="2,2" />
            <line x1={cellSize - 3} y1={cellSize - 3} x2={cellSize - membraneOffset + 2} y2={cellSize - membraneOffset + 2} stroke="#64b5f6" strokeWidth="1" strokeDasharray="2,2" />
          </>
        )}
      </g>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-800 to-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-700 border-b border-slate-600">
        <div className="flex items-center gap-3">
          <Droplets className="w-5 h-5 text-blue-400" />
          <div>
            <h3 className="font-semibold text-white text-sm">Osmosis Experiment</h3>
            <p className="text-xs text-slate-400">
              {phase === 'setup' && 'Prepare potato strips'}
              {phase === 'weighing' && 'Weigh and place strips'}
              {phase === 'soaking' && 'Strips soaking in solutions'}
              {phase === 'results' && 'Record final measurements'}
              {phase === 'plasmolysis' && 'Observe plasmolysis'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {phase === 'soaking' && (
            <Badge variant="secondary" size="sm" className="bg-blue-900 text-blue-200">
              <Timer className="w-3 h-3 mr-1" />
              {formatTime(elapsedTime)} / {formatTime(targetTime)}
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPlasmolysis(!showPlasmolysis)}
            className={cn(
              "text-slate-300 hover:text-white",
              showPlasmolysis && "bg-purple-900 text-purple-200"
            )}
          >
            <Microscope className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={resetSimulation} className="text-slate-300 hover:text-white">
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex p-4 gap-4 min-h-0 overflow-hidden">
        {!showPlasmolysis ? (
          <>
            {/* Left - Potato Strips & Beakers */}
            <div className="flex-1 flex flex-col gap-4">
              {/* Strips preparation area */}
              <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-white flex items-center gap-2">
                    <Scale className="w-4 h-4 text-amber-400" />
                    Potato Strips
                  </h4>
                  {phase === 'setup' && (
                    <Button size="sm" variant="primary" onClick={startExperiment}>
                      Cut Strips
                    </Button>
                  )}
                </div>

                {/* Strips grid */}
                <div className="grid grid-cols-6 gap-3">
                  {strips.map((strip, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                      {/* Strip (only show if not in solution) */}
                      {strip.inSolution === null && phase !== 'setup' && (
                        <div className="relative">
                          {renderPotatoStrip(strip)}
                          {/* Weigh button */}
                          {!weighedInitial.has(i) && phase === 'weighing' && (
                            <button
                              onClick={() => weighStrip(i, false)}
                              className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-blue-300 hover:text-blue-100 whitespace-nowrap"
                            >
                              Weigh
                            </button>
                          )}
                        </div>
                      )}

                      {/* Status indicator */}
                      <div className="text-center">
                        <div className="text-[10px] text-slate-400">#{i + 1}</div>
                        {weighedInitial.has(i) && (
                          <div className="text-[9px] text-green-400">
                            {strip.initialMass.toFixed(2)}g
                          </div>
                        )}
                        {strip.inSolution !== null && (
                          <div className="text-[9px] text-blue-400">
                            In {concentrations[strip.inSolution].value}M
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Beakers with solutions */}
              <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 flex-1">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-white flex items-center gap-2">
                    <Beaker className="w-4 h-4 text-blue-400" />
                    Sucrose Solutions
                  </h4>
                  {phase === 'soaking' && (
                    <Button
                      size="sm"
                      variant={isTimerRunning ? 'secondary' : 'primary'}
                      onClick={() => setIsTimerRunning(!isTimerRunning)}
                    >
                      {isTimerRunning ? <Pause className="w-3 h-3 mr-1" /> : <Play className="w-3 h-3 mr-1" />}
                      {isTimerRunning ? 'Pause' : 'Start Timer'}
                    </Button>
                  )}
                </div>

                {/* Beakers row */}
                <div className="flex justify-around items-end">
                  {concentrations.map((conc) => {
                    const stripInThisBeaker = strips.find(s => s.inSolution === conc.id);
                    return (
                      <div key={conc.id}>
                        {renderBeaker(conc, stripInThisBeaker)}
                      </div>
                    );
                  })}
                </div>

                {/* Progress bar */}
                {phase === 'soaking' && (
                  <div className="mt-4">
                    <div className="h-2 bg-slate-600 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all"
                        style={{ width: `${(elapsedTime / targetTime) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1 text-center">
                      {Math.round((elapsedTime / targetTime) * 100)}% complete
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right - Controls & Data */}
            <div className="w-72 flex flex-col gap-3 overflow-y-auto">
              {/* Phase indicator */}
              <div className="bg-slate-700 rounded-lg p-3 border border-slate-600">
                <h4 className="text-xs font-medium text-white mb-2 uppercase tracking-wide">Progress</h4>
                <div className="space-y-2">
                  {[
                    { id: 'setup', label: 'Cut potato strips', icon: FlaskConical },
                    { id: 'weighing', label: 'Weigh initial mass', icon: Scale },
                    { id: 'soaking', label: 'Soak for 30 min', icon: Timer },
                    { id: 'results', label: 'Weigh final mass', icon: BarChart3 },
                  ].map(({ id, label, icon: Icon }) => (
                    <div
                      key={id}
                      className={cn(
                        "flex items-center gap-2 text-xs p-2 rounded",
                        phase === id ? "bg-blue-900/50 text-blue-200" :
                        ['results', 'plasmolysis'].includes(phase) ||
                        (phase === 'soaking' && ['setup', 'weighing'].includes(id)) ||
                        (phase === 'weighing' && id === 'setup') ||
                        (phase === 'results' && ['setup', 'weighing', 'soaking'].includes(id))
                          ? "text-green-400" : "text-slate-400"
                      )}
                    >
                      {['results', 'plasmolysis'].includes(phase) ||
                       (phase === 'soaking' && ['setup', 'weighing'].includes(id)) ||
                       (phase === 'weighing' && id === 'setup') ||
                       (phase === 'results' && ['setup', 'weighing', 'soaking'].includes(id)) ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Results table */}
              {(phase === 'results' || elapsedTime > 0) && (
                <div className="bg-slate-700 rounded-lg p-3 border border-slate-600">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-medium text-white uppercase tracking-wide">Results</h4>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowGraph(!showGraph)}
                      className="text-xs"
                    >
                      <BarChart3 className="w-3 h-3 mr-1" />
                      Graph
                    </Button>
                  </div>

                  {showGraph ? (
                    /* Simple bar graph */
                    <div className="h-40 flex items-end justify-around gap-1 border-l border-b border-slate-500 p-2">
                      {strips.map((strip, i) => {
                        const change = getPercentChange(strip);
                        const barHeight = Math.abs(change) * 4;
                        return (
                          <div key={i} className="flex flex-col items-center">
                            <div
                              className={cn(
                                "w-6 transition-all rounded-t",
                                change > 0 ? "bg-green-500" : "bg-red-500"
                              )}
                              style={{
                                height: `${barHeight}px`,
                                marginBottom: change < 0 ? 0 : 'auto',
                                marginTop: change > 0 ? 'auto' : 0,
                              }}
                            />
                            <div className="text-[8px] text-slate-400 mt-1">
                              {strip.inSolution !== null ? `${concentrations[strip.inSolution].value}M` : '-'}
                            </div>
                          </div>
                        );
                      })}
                      {/* Y-axis labels */}
                      <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[8px] text-slate-500 -ml-6">
                        <span>+20%</span>
                        <span>0%</span>
                        <span>-20%</span>
                      </div>
                    </div>
                  ) : (
                    /* Data table */
                    <div className="space-y-1 text-xs max-h-48 overflow-y-auto">
                      <div className="grid grid-cols-4 gap-1 text-slate-400 text-[10px] font-medium pb-1 border-b border-slate-600">
                        <span>Conc.</span>
                        <span>Initial</span>
                        <span>Final</span>
                        <span>Change</span>
                      </div>
                      {strips.filter(s => s.inSolution !== null).sort((a, b) => a.inSolution! - b.inSolution!).map((strip) => {
                        const change = getPercentChange(strip);
                        return (
                          <div key={strip.id} className="grid grid-cols-4 gap-1 text-[10px]">
                            <span className="text-slate-300">{concentrations[strip.inSolution!].value}M</span>
                            <span className="text-slate-300">{strip.initialMass.toFixed(2)}g</span>
                            <span className="text-slate-300">{strip.currentMass.toFixed(2)}g</span>
                            <span className={cn(
                              "font-medium",
                              change > 0 ? "text-green-400" : change < 0 ? "text-red-400" : "text-slate-400"
                            )}>
                              {change > 0 ? '+' : ''}{change.toFixed(1)}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Final weighing (results phase) */}
              {phase === 'results' && (
                <div className="bg-slate-700 rounded-lg p-3 border border-slate-600">
                  <h4 className="text-xs font-medium text-white mb-2 uppercase tracking-wide">
                    Final Measurements
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {strips.filter(s => s.inSolution !== null).map((strip) => (
                      <Button
                        key={strip.id}
                        size="sm"
                        variant={weighedFinal.has(strip.id) ? 'secondary' : 'outline'}
                        className="text-[10px] p-1"
                        onClick={() => weighStrip(strip.id, true)}
                        disabled={weighedFinal.has(strip.id)}
                      >
                        {weighedFinal.has(strip.id) ? (
                          <CheckCircle2 className="w-3 h-3 text-green-400" />
                        ) : (
                          `${concentrations[strip.inSolution!].value}M`
                        )}
                      </Button>
                    ))}
                  </div>

                  {weighedFinal.size === strips.filter(s => s.inSolution !== null).length && (
                    <Button
                      className="w-full mt-3 text-xs"
                      variant="primary"
                      onClick={() => {
                        setShowPlasmolysis(true);
                        setPhase('plasmolysis');
                        onObservation?.('Experiment complete! Now observe plasmolysis in onion cells.');
                      }}
                    >
                      <Microscope className="w-3 h-3 mr-1" />
                      View Plasmolysis
                    </Button>
                  )}
                </div>
              )}

              {/* Observations */}
              <div className="bg-slate-700 rounded-lg p-3 border border-slate-600">
                <h4 className="text-xs font-medium text-white mb-2 uppercase tracking-wide flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  Key Observations
                </h4>
                <div className="space-y-2 text-[10px] text-slate-300">
                  <p>• In <span className="text-blue-300">hypotonic</span> solutions (low concentration): cells <span className="text-green-400">gain water</span>, mass increases</p>
                  <p>• In <span className="text-blue-300">hypertonic</span> solutions (high concentration): cells <span className="text-red-400">lose water</span>, mass decreases</p>
                  <p>• <span className="text-yellow-400">Isotonic point</span>: ~0.4-0.5M sucrose (no net change)</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Plasmolysis View */
          <div className="flex-1 flex gap-4">
            {/* Microscope view */}
            <div className="flex-1 flex flex-col items-center justify-center">
              <div
                className="relative w-80 h-80 rounded-full overflow-hidden border-8 border-slate-700 shadow-2xl"
                style={{
                  background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(200,200,200,0.8) 100%)',
                }}
              >
                {/* Vignette */}
                <div className="absolute inset-0 rounded-full" style={{
                  background: 'radial-gradient(circle, transparent 50%, rgba(0,0,0,0.6) 100%)',
                }} />

                {/* Cells */}
                <div
                  className="absolute inset-4 flex items-center justify-center"
                  style={{
                    filter: `blur(${Math.max(0, (100 - microscopeFocus) / 15)}px)`,
                    opacity: microscopeFocus / 100,
                  }}
                >
                  <svg viewBox="0 0 290 290" className="w-full h-full">
                    {[...Array(9)].map((_, i) => renderCell(i, selectedCellView === 'salt'))}
                  </svg>
                </div>

                {/* Crosshairs */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-400/20" />
                <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-400/20" />
              </div>

              {/* Focus control */}
              <div className="mt-4 flex items-center gap-3">
                <Eye className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-400">Focus:</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={microscopeFocus}
                  onChange={(e) => setMicroscopeFocus(Number(e.target.value))}
                  className="w-32 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* Controls */}
            <div className="w-64 flex flex-col gap-3">
              <div className="bg-slate-700 rounded-lg p-3 border border-slate-600">
                <h4 className="text-xs font-medium text-white mb-3 uppercase tracking-wide">
                  Plasmolysis Observation
                </h4>

                {/* Solution selector */}
                <div className="space-y-2">
                  <Button
                    variant={selectedCellView === 'normal' ? 'primary' : 'outline'}
                    size="sm"
                    className="w-full text-xs justify-start"
                    onClick={() => {
                      setSelectedCellView('normal');
                      setPlasmolysisProgress(0);
                      onObservation?.('Viewing onion cells in distilled water - cells are turgid');
                      // Slide prep for the plasmolysis viewing.
                      onAction?.('drag', 'app_cover_slip');
                      onAction?.('pour', 'app_cover_slip');
                      onAction?.('observe', 'app_microscope');
                    }}
                  >
                    <Droplets className="w-3 h-3 mr-2" />
                    Distilled Water (Normal)
                  </Button>
                  <Button
                    variant={selectedCellView === 'salt' ? 'primary' : 'outline'}
                    size="sm"
                    className="w-full text-xs justify-start"
                    onClick={() => {
                      setSelectedCellView('salt');
                      setPlasmolysisProgress(0);
                      onObservation?.('Adding concentrated salt solution - watch for plasmolysis!');
                      onAction?.('observe', 'app_microscope');
                    }}
                  >
                    <FlaskConical className="w-3 h-3 mr-2" />
                    Concentrated Salt Solution
                  </Button>
                </div>

                {/* Plasmolysis progress */}
                {selectedCellView === 'salt' && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Plasmolysis Progress</span>
                      <span>{plasmolysisProgress}%</span>
                    </div>
                    <div className="h-2 bg-slate-600 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                        style={{ width: `${plasmolysisProgress}%` }}
                      />
                    </div>
                    {plasmolysisProgress >= 100 && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full mt-2 text-xs"
                        onClick={() => {
                          onObservation?.('Plasmolysis complete! Cell membrane has pulled away from cell wall due to water loss.');
                          onMeasurement?.(100, '%', 'Plasmolysis completion');
                          onAction?.('record', 'app_microscope');
                        }}
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Record Observation
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Cell diagram labels */}
              <div className="bg-slate-700 rounded-lg p-3 border border-slate-600">
                <h4 className="text-xs font-medium text-white mb-2 uppercase tracking-wide">
                  Cell Structures
                </h4>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-green-500 rounded-sm" />
                    <span className="text-slate-300">Cell wall (rigid)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-200 border border-green-400 rounded-sm" />
                    <span className="text-slate-300">Cell membrane</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-200 border border-blue-400 rounded-full" />
                    <span className="text-slate-300">Vacuole</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full opacity-60" />
                    <span className="text-slate-300">Nucleus</span>
                  </div>
                </div>
              </div>

              {/* Explanation */}
              <div className="bg-slate-700 rounded-lg p-3 border border-slate-600">
                <h4 className="text-xs font-medium text-white mb-2 uppercase tracking-wide">
                  What's Happening?
                </h4>
                <p className="text-[10px] text-slate-300 leading-relaxed">
                  {selectedCellView === 'normal' ? (
                    "In distilled water (hypotonic), water enters the cell by osmosis. The cell becomes turgid - the vacuole expands and pushes the cell membrane against the cell wall."
                  ) : plasmolysisProgress < 50 ? (
                    "Salt solution is hypertonic. Water is leaving the cell by osmosis. The vacuole is shrinking..."
                  ) : (
                    "Plasmolysis! The cell membrane has pulled away from the cell wall as the cell loses water. The cell is now flaccid. This process is reversible if placed back in water."
                  )}
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => setShowPlasmolysis(false)}
              >
                Back to Potato Experiment
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
