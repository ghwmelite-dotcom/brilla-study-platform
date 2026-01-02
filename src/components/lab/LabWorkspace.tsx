import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  CheckCircle,
  Circle,
  Pause,
  Play,
  Send,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Lightbulb,
  FlaskConical,
  ClipboardList,
  Table,
  AlertTriangle,
  Award,
  X,
  Plus,
  Maximize,
  Minimize,
  LogOut,
} from 'lucide-react';
// Note: Badge and ProgressBar removed - using custom styled components
import { PhETEmbed } from './PhETEmbed';
import {
  TitrationSimulation,
  QualitativeAnalysisSimulation,
  MicroscopeSimulation,
  FoodTestsSimulation,
} from './simulations';
import { useLabStore } from '@/stores';
import { cn } from '@/utils';
import type { GradingResult } from '@/types';

interface LabWorkspaceProps {
  onExit: () => void;
}

export function LabWorkspace({ onExit }: LabWorkspaceProps) {
  const {
    currentExperiment,
    currentSession,
    mode,
    currentStepIndex,
    stepCompletionStatus,
    timeSpent,
    isTimerRunning,
    isProcedurePanelOpen,
    showHints,
    measurements,
    observations,
    lastAttemptResult,
    isLoading,
    // Actions
    goToStep,
    completeStep,
    nextStep,
    previousStep,
    incrementTimer,
    pauseTimer,
    resumeTimer,
    toggleProcedurePanel,
    toggleHints,
    addObservation,
    submitExperiment,
  } = useLabStore();

  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [observationText, setObservationText] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<GradingResult | null>(null);
  const [showDataPanel, setShowDataPanel] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        incrementTimer();
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, incrementTimer]);

  // Show results when available
  useEffect(() => {
    if (lastAttemptResult) {
      setResults(lastAttemptResult);
      setShowResults(true);
    }
  }, [lastAttemptResult]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (!currentExperiment || !currentSession) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <FlaskConical className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-white/70 mb-4">No active experiment session</p>
          <button
            onClick={onExit}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors"
          >
            Back to Lab
          </button>
        </div>
      </div>
    );
  }

  const currentStep = currentExperiment.procedure[currentStepIndex];
  const completedSteps = stepCompletionStatus.filter(Boolean).length;
  const totalSteps = currentExperiment.procedure.length;
  const progressPercent = Math.round((completedSteps / totalSteps) * 100);

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle submit
  const handleSubmit = async () => {
    try {
      const result = await submitExperiment();
      setResults(result);
      setShowResults(true);
      setShowSubmitConfirm(false);
    } catch (error) {
      console.error('Failed to submit:', error);
    }
  };

  // Handle add observation
  const handleAddObservation = () => {
    if (observationText.trim()) {
      addObservation(observationText.trim());
      setObservationText('');
    }
  };

  // Results screen
  if (showResults && results) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-y-auto">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, white 1px, transparent 1px),
                             radial-gradient(circle at 75% 75%, white 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }} />
        </div>

        <div className="relative z-10 min-h-full flex items-center justify-center p-4 py-12">
          <div className="w-full max-w-2xl">
            {/* Trophy Animation */}
            <div className={cn(
              'w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6',
              results.percentageScore >= 70 ? 'bg-emerald-500/20' : results.percentageScore >= 50 ? 'bg-amber-500/20' : 'bg-red-500/20',
              'animate-in zoom-in-50 duration-500'
            )}>
              <Award className={cn(
                'w-12 h-12',
                results.percentageScore >= 70 ? 'text-emerald-400' : results.percentageScore >= 50 ? 'text-amber-400' : 'text-red-400'
              )} />
            </div>

            <h2 className="text-3xl font-bold text-white text-center mb-2">
              Experiment Complete!
            </h2>
            <p className="text-white/60 text-center mb-8">{currentExperiment.name}</p>

            {/* Score Circle */}
            <div className="relative w-48 h-48 mx-auto mb-8">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke={results.percentageScore >= 70 ? '#10b981' : results.percentageScore >= 50 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={283}
                  strokeDashoffset={283 - (283 * results.percentageScore) / 100}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-bold text-white">{results.percentageScore}%</span>
                <span className="text-white/50 text-sm">{results.totalScore}/{results.maxScore} marks</span>
              </div>
            </div>

            {/* Criteria Breakdown */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 mb-6">
              <h3 className="font-semibold text-white mb-4">Performance Breakdown</h3>
              <div className="space-y-3">
                {results.criteriaScores.map((criteria) => (
                  <div key={criteria.criterionId} className="flex items-center justify-between">
                    <span className="text-sm text-white/70">{criteria.criterionName}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                          style={{ width: `${(criteria.score / criteria.maxScore) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-white w-12 text-right">
                        {criteria.score}/{criteria.maxScore}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Feedback */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 mb-8">
              <p className="text-white/80 mb-4">{results.feedback.overall}</p>
              {results.feedback.strengths.length > 0 && (
                <div className="mb-3">
                  <span className="text-xs font-medium text-emerald-400 uppercase">Strengths:</span>
                  <ul className="text-sm text-white/70 mt-1">
                    {results.feedback.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {results.feedback.improvements.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-amber-400 uppercase">Areas to improve:</span>
                  <ul className="text-sm text-white/70 mt-1">
                    {results.feedback.improvements.map((s, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={onExit}
                className="px-6 py-3 bg-white/5 text-white rounded-xl font-medium hover:bg-white/10 transition-colors border border-white/10"
              >
                Exit Lab
              </button>
              <button
                onClick={() => {
                  setShowResults(false);
                  onExit();
                }}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-indigo-700 transition-colors"
              >
                Try Another Experiment
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, white 1px, transparent 1px),
                           radial-gradient(circle at 75% 75%, white 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }} />
      </div>

      {/* Top Bar */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3 bg-black/20 backdrop-blur-xl border-b border-white/10 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowExitConfirm(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Exit</span>
          </button>
          <div className="hidden sm:block h-6 w-px bg-white/20" />
          <div>
            <h2 className="font-semibold text-white line-clamp-1">
              {currentExperiment.name}
            </h2>
            <div className="flex items-center gap-2 text-sm">
              <span className={cn(
                'px-2 py-0.5 rounded-full text-xs font-medium',
                mode === 'guided' ? 'bg-purple-500/20 text-purple-300' : 'bg-emerald-500/20 text-emerald-300'
              )}>
                {mode === 'guided' ? 'Guided' : 'Sandbox'}
              </span>
              <span className="text-white/50">Step {currentStepIndex + 1} of {totalSteps}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Timer */}
          <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl border border-white/10">
            <Clock className="w-4 h-4 text-white/50" />
            <span className="font-mono text-white">{formatTime(timeSpent)}</span>
            <button
              className="p-1 rounded hover:bg-white/10 transition-colors"
              onClick={isTimerRunning ? pauseTimer : resumeTimer}
            >
              {isTimerRunning ? (
                <Pause className="w-3 h-3 text-white/70" />
              ) : (
                <Play className="w-3 h-3 text-white/70" />
              )}
            </button>
          </div>

          {/* Progress */}
          <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl border border-white/10">
            <div className="w-20 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-sm text-white/70">{progressPercent}%</span>
          </div>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>

          {/* Submit */}
          <button
            onClick={() => setShowSubmitConfirm(true)}
            disabled={completedSteps < totalSteps && mode === 'guided'}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all',
              completedSteps >= totalSteps || mode === 'sandbox'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700'
                : 'bg-white/5 text-white/30 cursor-not-allowed'
            )}
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Submit</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-1 min-h-0 overflow-hidden">
        {/* Left Panel - Procedure Guide */}
        <div className={cn(
          'bg-black/20 backdrop-blur-xl border-r border-white/10 overflow-y-auto transition-all shrink-0 hidden md:flex flex-col',
          isProcedurePanelOpen ? 'w-56 lg:w-64' : 'w-12'
        )}>
          <div className="sticky top-0 bg-black/30 backdrop-blur-xl border-b border-white/10 z-10">
            <div className="flex items-center justify-between p-2">
              {isProcedurePanelOpen && (
                <div className="flex items-center gap-1.5">
                  <ClipboardList className="w-4 h-4 text-purple-400" />
                  <span className="font-medium text-white text-sm">Procedure</span>
                </div>
              )}
              <button
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/70"
                onClick={toggleProcedurePanel}
              >
                {isProcedurePanelOpen ? (
                  <ChevronLeft className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {isProcedurePanelOpen && (
            <div className="p-2 space-y-1.5 flex-1">
              {currentExperiment.procedure.map((step, idx) => (
                <div
                  key={step.stepNumber}
                  className={cn(
                    'p-2 rounded-lg cursor-pointer transition-all border',
                    idx === currentStepIndex
                      ? 'bg-purple-500/20 border-purple-500/50'
                      : stepCompletionStatus[idx]
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'bg-white/5 border-transparent hover:border-white/20'
                  )}
                  onClick={() => goToStep(idx)}
                >
                  <div className="flex items-start gap-1.5">
                    {stepCompletionStatus[idx] ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <Circle className={cn(
                        'w-4 h-4 shrink-0 mt-0.5',
                        idx === currentStepIndex ? 'text-purple-400' : 'text-white/30'
                      )} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-xs font-medium',
                        idx === currentStepIndex ? 'text-purple-300' : 'text-white/70'
                      )}>
                        Step {step.stepNumber}
                      </p>
                      <p className="text-xs text-white/50 line-clamp-2 mt-0.5">
                        {step.instruction}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main Lab Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Current Step Instruction */}
          <div className="mx-3 mt-3 p-4 bg-black/20 backdrop-blur-xl rounded-xl border border-white/10 shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-full text-xs font-medium">
                    Step {currentStep.stepNumber}
                  </span>
                  {currentStep.isCheckpoint && (
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded-full text-xs font-medium">
                      {currentStep.maxMarks}m
                    </span>
                  )}
                </div>
                <p className="text-white">{currentStep.instruction}</p>
                {showHints && currentStep.hint && (
                  <div className="mt-3 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20 flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-200">{currentStep.hint}</p>
                  </div>
                )}
              </div>
              <button
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  showHints ? 'bg-amber-500/20 text-amber-400' : 'text-white/50 hover:bg-white/10'
                )}
                onClick={toggleHints}
                title="Toggle hints"
              >
                <Lightbulb className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Simulation Canvas */}
          <div className="flex-1 m-3 min-h-[250px] overflow-hidden rounded-xl border border-white/10 bg-white">
            {currentExperiment.simulationType === 'phet' && currentExperiment.phetSimUrl ? (
              <PhETEmbed
                simUrl={currentExperiment.phetSimUrl}
                title={currentExperiment.name}
                guidanceNotes={currentExperiment.safetyNotes}
              />
            ) : currentExperiment.id === 'exp_acid_base_titration' ||
                 currentExperiment.slug === 'acid-base-titration' ? (
              <TitrationSimulation
                onObservation={(text) => addObservation(text)}
              />
            ) : currentExperiment.id === 'exp_qualitative_analysis' ||
                 currentExperiment.slug === 'qualitative-analysis' ? (
              <QualitativeAnalysisSimulation
                onObservation={(text) => addObservation(text)}
              />
            ) : currentExperiment.id === 'exp_microscope_use' ||
                 currentExperiment.slug === 'microscope-use' ? (
              <MicroscopeSimulation
                onObservation={(text) => addObservation(text)}
              />
            ) : currentExperiment.id === 'exp_food_tests' ||
                 currentExperiment.slug === 'food-tests' ? (
              <FoodTestsSimulation
                onObservation={(text) => addObservation(text)}
              />
            ) : (
              <div className="h-full flex items-center justify-center bg-slate-100">
                <div className="text-center p-8">
                  <FlaskConical className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 mb-2 font-medium">Custom Simulation</p>
                  <p className="text-sm text-slate-400">
                    Interactive apparatus workspace coming soon
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Step Navigation + Data Toggle */}
          <div className="flex items-center justify-between px-3 py-3 bg-black/20 backdrop-blur-xl border-t border-white/10 shrink-0">
            <button
              onClick={previousStep}
              disabled={currentStepIndex === 0}
              className={cn(
                'flex items-center gap-1 px-3 py-2 rounded-lg font-medium transition-colors',
                currentStepIndex === 0
                  ? 'text-white/30 cursor-not-allowed'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              )}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Prev</span>
            </button>

            <div className="flex items-center gap-2">
              {/* Mobile step indicator */}
              <span className="text-xs text-white/50 md:hidden">
                {currentStepIndex + 1}/{totalSteps}
              </span>

              {/* Data Recording Toggle */}
              <button
                onClick={() => setShowDataPanel(!showDataPanel)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-colors',
                  showDataPanel
                    ? 'bg-purple-500/20 text-purple-300'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                )}
              >
                <Table className="w-4 h-4" />
                <span className="hidden sm:inline">Data</span>
                {(measurements.length + observations.length) > 0 && (
                  <span className="px-1.5 py-0.5 bg-purple-500 text-white text-xs rounded-full">
                    {measurements.length + observations.length}
                  </span>
                )}
                {showDataPanel ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
              </button>

              {!stepCompletionStatus[currentStepIndex] && (
                <button
                  onClick={completeStep}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-medium hover:from-emerald-700 hover:to-teal-700 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Done</span>
                </button>
              )}
            </div>

            <button
              onClick={nextStep}
              disabled={currentStepIndex === totalSteps - 1}
              className={cn(
                'flex items-center gap-1 px-3 py-2 rounded-lg font-medium transition-colors',
                currentStepIndex === totalSteps - 1
                  ? 'text-white/30 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700'
              )}
            >
              <span className="hidden sm:inline">Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Panel - Data Recording (Collapsible) */}
      {showDataPanel && (
        <div className="relative z-10 bg-black/30 backdrop-blur-xl border-t border-white/10 shrink-0 max-h-64 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Table className="w-4 h-4 text-purple-400" />
              <span className="font-medium text-white text-sm">Data Recording</span>
            </div>
            <button
              className="p-1 rounded hover:bg-white/10 transition-colors text-white/70"
              onClick={() => setShowDataPanel(false)}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Measurements */}
              <div>
                <h4 className="text-xs font-medium text-white/70 mb-2 uppercase tracking-wide">Measurements</h4>
                {measurements.length > 0 ? (
                  <div className="space-y-1">
                    {measurements.map((m) => (
                      <div key={m.id} className="text-xs p-2 bg-white/5 rounded-lg flex justify-between border border-white/10">
                        <span className="font-mono text-white">{m.value} {m.unit}</span>
                        <span className="text-white/40">Step {m.stepNumber}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-white/40 italic">No measurements yet</p>
                )}
              </div>

              {/* Observations */}
              <div>
                <h4 className="text-xs font-medium text-white/70 mb-2 uppercase tracking-wide">Observations</h4>
                <div className="space-y-1">
                  {observations.map((obs) => (
                    <div key={obs.id} className="text-xs p-2 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-white/80">{obs.text}</p>
                      <span className="text-white/40">Step {obs.stepNumber}</span>
                    </div>
                  ))}
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={observationText}
                      onChange={(e) => setObservationText(e.target.value)}
                      placeholder="Add observation..."
                      className="flex-1 text-xs px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddObservation()}
                    />
                    <button
                      onClick={handleAddObservation}
                      className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Safety Notes */}
              {currentExperiment.safetyNotes.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-white/70 mb-2 uppercase tracking-wide flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                    Safety Notes
                  </h4>
                  <ul className="text-xs space-y-1">
                    {currentExperiment.safetyNotes.map((note, idx) => (
                      <li key={idx} className="flex items-start gap-1 p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                        <span className="text-amber-400 shrink-0">!</span>
                        <span className="text-amber-200">{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="w-full max-w-md bg-slate-800 rounded-2xl p-6 border border-white/10 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-2">Submit Experiment?</h3>
            <p className="text-white/70 mb-4">
              You have completed {completedSteps} of {totalSteps} steps.
              {completedSteps < totalSteps && (
                <span className="text-amber-400 block mt-1">
                  Some steps are incomplete. You may lose marks.
                </span>
              )}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="px-4 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-colors border border-white/10"
              >
                Continue Working
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Submitting...' : 'Submit Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="w-full max-w-md bg-slate-800 rounded-2xl p-6 border border-white/10 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-2">Exit Lab?</h3>
            <p className="text-white/70 mb-4">
              Your progress will be lost if you exit now. Are you sure you want to leave?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="px-4 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-colors border border-white/10"
              >
                Stay
              </button>
              <button
                onClick={onExit}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Exit Lab
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
