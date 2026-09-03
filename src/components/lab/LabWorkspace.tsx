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
  Sun,
  Moon,
} from 'lucide-react';
import { PhETEmbed } from './PhETEmbed';
import {
  TitrationSimulation,
  QualitativeAnalysisSimulation,
  MicroscopeSimulation,
  FoodTestsSimulation,
  OsmosisSimulation,
  SpecificHeatSimulation,
  ElectrolysisSimulation,
  ReactionRateSimulation,
  CrystallizationSimulation,
  GasTestsSimulation,
  PhotosynthesisSimulation,
  EnzymeSimulation,
  TranspirationSimulation,
  DissectionSimulation,
} from './simulations';
import { useLabStore } from '@/stores/labStore';
import { useThemeStore } from '@/stores/themeStore';
import { useUIStore } from '@/stores/uiStore';
import { Badge } from '@/components/common';
import { buildSimReporters } from './simulations/reporting';
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
    submitPending,
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
    recordMeasurement,
    recordAction,
    recordObservation,
    submitExperiment,
    finishPractice,
  } = useLabStore();

  // Store-backed sim reporting callbacks, built once per render.
  const simReporters = buildSimReporters({ recordMeasurement, recordAction, recordObservation });

  const { resolvedTheme, setTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';

  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [observationText, setObservationText] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<GradingResult | null>(null);
  const [showDataPanel, setShowDataPanel] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMobileProcedure, setShowMobileProcedure] = useState(false);
  const [practiceComplete, setPracticeComplete] = useState(false);

  // Toggle theme for distraction-free mode
  const toggleLocalTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  // Set distraction-free mode
  const { setDistractionFreeMode } = useUIStore();
  useEffect(() => {
    setDistractionFreeMode(true);
    return () => setDistractionFreeMode(false);
  }, [setDistractionFreeMode]);

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
      <div className={cn(
        "fixed inset-0 z-50 flex items-center justify-center transition-colors duration-300",
        isDark
          ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
          : "bg-gradient-to-br from-slate-100 via-white to-slate-100"
      )}>
        <div className="text-center">
          <FlaskConical className={cn("w-16 h-16 mx-auto mb-4", isDark ? "text-slate-600" : "text-slate-300")} />
          <p className={cn("mb-4", isDark ? "text-white/70" : "text-slate-600")}>No active experiment session</p>
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
  // PhET embeds can't emit structured evidence — they run as ungraded
  // practice sessions.
  const isPractice = currentExperiment.simulationType === 'phet';

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
      // submitExperiment already set the store's submitPending flag; the
      // pending card below is the honest UI for a failed submit.
      console.error('Failed to submit:', error);
      setShowSubmitConfirm(false);
    }
  };

  // Handle practice-mode completion (PhET — ungraded)
  const handleFinishPractice = async () => {
    await finishPractice();
    setPracticeComplete(true);
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
      <div className={cn(
        "fixed inset-0 z-50 overflow-y-auto transition-colors duration-300",
        isDark
          ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
          : "bg-gradient-to-br from-slate-100 via-white to-slate-100"
      )}>
        {/* Background pattern */}
        <div className={cn("absolute inset-0", isDark ? "opacity-5" : "opacity-10")}>
          <div className="absolute inset-0" style={{
            backgroundImage: isDark
              ? `radial-gradient(circle at 25% 25%, white 1px, transparent 1px),
                 radial-gradient(circle at 75% 75%, white 1px, transparent 1px)`
              : `radial-gradient(circle at 25% 25%, #6366f1 1px, transparent 1px),
                 radial-gradient(circle at 75% 75%, #8b5cf6 1px, transparent 1px)`,
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

            <h2 className={cn("text-3xl font-bold text-center mb-2", isDark ? "text-white" : "text-slate-900")}>
              Experiment Complete!
            </h2>
            <p className={cn("text-center mb-8", isDark ? "text-white/60" : "text-slate-500")}>{currentExperiment.name}</p>

            {/* Score Circle */}
            <div className="relative w-48 h-48 mx-auto mb-8">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}
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
                <span className={cn("text-5xl font-bold", isDark ? "text-white" : "text-slate-900")}>{results.percentageScore}%</span>
                <span className={cn("text-sm", isDark ? "text-white/50" : "text-slate-500")}>{results.totalScore}/{results.maxScore} marks</span>
              </div>
            </div>

            {/* Criteria Breakdown */}
            <div className={cn(
              "backdrop-blur-sm rounded-2xl p-6 border mb-6",
              isDark ? "bg-white/5 border-white/10" : "bg-white/80 border-slate-200 shadow-lg"
            )}>
              <h3 className={cn("font-semibold mb-4", isDark ? "text-white" : "text-slate-900")}>Performance Breakdown</h3>
              <div className="space-y-3">
                {results.criteriaScores.map((criteria) => (
                  <div key={criteria.criterionId}>
                    <div className="flex items-center justify-between">
                      <span className={cn("text-sm", isDark ? "text-white/70" : "text-slate-600")}>{criteria.criterionName}</span>
                      <div className="flex items-center gap-3">
                        <div className={cn("w-24 h-2 rounded-full overflow-hidden", isDark ? "bg-white/10" : "bg-slate-200")}>
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                            style={{ width: `${(criteria.score / criteria.maxScore) * 100}%` }}
                          />
                        </div>
                        <span className={cn("text-sm font-medium w-12 text-right", isDark ? "text-white" : "text-slate-900")}>
                          {criteria.score}/{criteria.maxScore}
                        </span>
                      </div>
                    </div>
                    <p className={cn("text-xs mt-0.5", isDark ? "text-white/40" : "text-slate-400")}>{criteria.feedback}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Feedback — per-criterion, from the server grading breakdown */}
            <div className={cn(
              "backdrop-blur-sm rounded-2xl p-6 border mb-6",
              isDark ? "bg-white/5 border-white/10" : "bg-white/80 border-slate-200 shadow-lg"
            )}>
              <h3 className={cn("font-semibold mb-4", isDark ? "text-white" : "text-slate-900")}>Feedback</h3>
              <ul className={cn("space-y-2 text-sm", isDark ? "text-white/70" : "text-slate-600")}>
                {results.criteriaScores.map((criteria) => (
                  <li key={criteria.criterionId} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>
                      <span className="font-medium">{criteria.criterionName}:</span> {criteria.feedback}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Step Evidence */}
            <div className={cn(
              "backdrop-blur-sm rounded-2xl p-6 border mb-6",
              isDark ? "bg-white/5 border-white/10" : "bg-white/80 border-slate-200 shadow-lg"
            )}>
              <h3 className={cn("font-semibold mb-4", isDark ? "text-white" : "text-slate-900")}>Step Evidence</h3>
              <div className="space-y-2">
                {results.stepScores.map((step) => (
                  <div key={step.stepNumber} className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className={cn("text-sm", isDark ? "text-white/70" : "text-slate-600")}>
                        Step {step.stepNumber}
                      </span>
                      <p className={cn("text-xs", isDark ? "text-white/40" : "text-slate-400")}>{step.feedback}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {step.evidence === 'self_report_only' && (
                        <Badge variant="warning">Self-reported</Badge>
                      )}
                      <span className={cn("text-sm font-medium", isDark ? "text-white" : "text-slate-900")}>
                        {step.marksEarned}/{step.maxMarks}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={onExit}
                className={cn(
                  "px-6 py-3 rounded-xl font-medium transition-colors border",
                  isDark
                    ? "bg-white/5 text-white border-white/10 hover:bg-white/10"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-sm"
                )}
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

  // Pending grading state — the submit failed (offline/server unreachable),
  // so no score is fabricated; the result lands in lab history on sync.
  if (submitPending && !results) {
    return (
      <div className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4 transition-colors duration-300",
        isDark
          ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
          : "bg-gradient-to-br from-slate-100 via-white to-slate-100"
      )}>
        <div className={cn(
          "w-full max-w-md backdrop-blur-sm rounded-2xl p-8 border text-center",
          isDark ? "bg-white/5 border-white/10" : "bg-white/80 border-slate-200 shadow-lg"
        )}>
          <Clock className={cn("w-12 h-12 mx-auto mb-4", isDark ? "text-amber-400" : "text-amber-500")} />
          <h2 className={cn("text-2xl font-bold mb-2", isDark ? "text-white" : "text-slate-900")}>
            Grading Pending
          </h2>
          <p className={cn("mb-6", isDark ? "text-white/60" : "text-slate-500")}>
            Grading is pending — your result will appear in your lab history once the connection is restored.
          </p>
          <button
            onClick={onExit}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-indigo-700 transition-colors"
          >
            Exit Lab
          </button>
        </div>
      </div>
    );
  }

  // Practice-mode completion (PhET — ungraded, no score)
  if (practiceComplete) {
    return (
      <div className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4 transition-colors duration-300",
        isDark
          ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
          : "bg-gradient-to-br from-slate-100 via-white to-slate-100"
      )}>
        <div className={cn(
          "w-full max-w-md backdrop-blur-sm rounded-2xl p-8 border text-center",
          isDark ? "bg-white/5 border-white/10" : "bg-white/80 border-slate-200 shadow-lg"
        )}>
          <CheckCircle className={cn("w-12 h-12 mx-auto mb-4", isDark ? "text-emerald-400" : "text-emerald-500")} />
          <h2 className={cn("text-2xl font-bold mb-2", isDark ? "text-white" : "text-slate-900")}>
            Practice Complete
          </h2>
          <p className={cn("mb-6", isDark ? "text-white/60" : "text-slate-500")}>
            Practice sessions are not graded. Try a custom lab when you're ready for a scored attempt.
          </p>
          <button
            onClick={onExit}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-indigo-700 transition-colors"
          >
            Exit Lab
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "fixed inset-0 z-50 flex flex-col overflow-hidden transition-colors duration-300",
      isDark
        ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
        : "bg-gradient-to-br from-slate-100 via-white to-slate-100"
    )}>
      {/* Background pattern */}
      <div className={cn("absolute inset-0 pointer-events-none", isDark ? "opacity-5" : "opacity-10")}>
        <div className="absolute inset-0" style={{
          backgroundImage: isDark
            ? `radial-gradient(circle at 25% 25%, white 1px, transparent 1px),
               radial-gradient(circle at 75% 75%, white 1px, transparent 1px)`
            : `radial-gradient(circle at 25% 25%, #6366f1 1px, transparent 1px),
               radial-gradient(circle at 75% 75%, #8b5cf6 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }} />
      </div>

      {/* Top Bar */}
      <div className={cn(
        "relative z-10 flex items-center justify-between px-4 py-3 backdrop-blur-xl border-b shrink-0",
        isDark ? "bg-black/20 border-white/10" : "bg-white/70 border-slate-200 shadow-sm"
      )}>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowExitConfirm(true)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
              isDark
                ? "text-white/70 hover:text-white hover:bg-white/10"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            )}
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Exit</span>
          </button>
          <div className={cn("hidden sm:block h-6 w-px", isDark ? "bg-white/20" : "bg-slate-300")} />
          <div>
            <h2 className={cn("font-semibold line-clamp-1", isDark ? "text-white" : "text-slate-900")}>
              {currentExperiment.name}
            </h2>
            <div className="flex items-center gap-2 text-sm">
              <span className={cn(
                'px-2 py-0.5 rounded-full text-xs font-medium',
                mode === 'guided'
                  ? isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'
                  : isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
              )}>
                {mode === 'guided' ? 'Guided' : 'Sandbox'}
              </span>
              {isPractice && (
                <Badge variant="secondary" size="sm">Practice mode — ungraded</Badge>
              )}
              <span className={isDark ? "text-white/50" : "text-slate-500"}>Step {currentStepIndex + 1} of {totalSteps}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Timer */}
          <div className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-xl border",
            isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-200 shadow-sm"
          )}>
            <Clock className={cn("w-4 h-4", isDark ? "text-white/50" : "text-slate-400")} />
            <span className={cn("font-mono", isDark ? "text-white" : "text-slate-900")}>{formatTime(timeSpent)}</span>
            <button
              className={cn(
                "p-1 rounded transition-colors",
                isDark ? "hover:bg-white/10" : "hover:bg-slate-100"
              )}
              onClick={isTimerRunning ? pauseTimer : resumeTimer}
            >
              {isTimerRunning ? (
                <Pause className={cn("w-3 h-3", isDark ? "text-white/70" : "text-slate-500")} />
              ) : (
                <Play className={cn("w-3 h-3", isDark ? "text-white/70" : "text-slate-500")} />
              )}
            </button>
          </div>

          {/* Progress */}
          <div className={cn(
            "hidden md:flex items-center gap-2 px-3 py-2 rounded-xl border",
            isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-200 shadow-sm"
          )}>
            <div className={cn("w-20 h-2 rounded-full overflow-hidden", isDark ? "bg-white/10" : "bg-slate-200")}>
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className={cn("text-sm", isDark ? "text-white/70" : "text-slate-600")}>{progressPercent}%</span>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleLocalTheme}
            className={cn(
              "p-2 rounded-lg transition-colors",
              isDark
                ? "text-white/70 hover:text-white hover:bg-white/10"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            )}
            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className={cn(
              "p-2 rounded-lg transition-colors",
              isDark
                ? "text-white/70 hover:text-white hover:bg-white/10"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            )}
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>

          {/* Submit / Finish practice */}
          <button
            onClick={isPractice ? handleFinishPractice : () => setShowSubmitConfirm(true)}
            disabled={!isPractice && completedSteps < totalSteps && mode === 'guided'}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all',
              isPractice || completedSteps >= totalSteps || mode === 'sandbox'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700'
                : isDark
                  ? 'bg-white/5 text-white/30 cursor-not-allowed'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            )}
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">{isPractice ? 'Finish practice' : 'Submit'}</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-1 min-h-0 overflow-hidden">
        {/* Left Panel - Procedure Guide */}
        <div className={cn(
          'backdrop-blur-xl border-r overflow-y-auto transition-all shrink-0 hidden md:flex flex-col',
          isDark ? 'bg-black/20 border-white/10' : 'bg-white/70 border-slate-200',
          isProcedurePanelOpen ? 'w-56 lg:w-64' : 'w-12'
        )}>
          <div className={cn(
            "sticky top-0 backdrop-blur-xl border-b z-10",
            isDark ? "bg-black/30 border-white/10" : "bg-white/80 border-slate-200"
          )}>
            <div className="flex items-center justify-between p-2">
              {isProcedurePanelOpen && (
                <div className="flex items-center gap-1.5">
                  <ClipboardList className="w-4 h-4 text-purple-500" />
                  <span className={cn("font-medium text-sm", isDark ? "text-white" : "text-slate-900")}>Procedure</span>
                </div>
              )}
              <button
                className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  isDark ? "hover:bg-white/10 text-white/70" : "hover:bg-slate-100 text-slate-600"
                )}
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
                      ? isDark ? 'bg-purple-500/20 border-purple-500/50' : 'bg-purple-100 border-purple-300'
                      : stepCompletionStatus[idx]
                        ? isDark ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
                        : isDark ? 'bg-white/5 border-transparent hover:border-white/20' : 'bg-slate-50 border-transparent hover:border-slate-300'
                  )}
                  onClick={() => goToStep(idx)}
                >
                  <div className="flex items-start gap-1.5">
                    {stepCompletionStatus[idx] ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <Circle className={cn(
                        'w-4 h-4 shrink-0 mt-0.5',
                        idx === currentStepIndex ? 'text-purple-500' : isDark ? 'text-white/30' : 'text-slate-400'
                      )} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-xs font-medium',
                        idx === currentStepIndex
                          ? isDark ? 'text-purple-300' : 'text-purple-700'
                          : isDark ? 'text-white/70' : 'text-slate-700'
                      )}>
                        Step {step.stepNumber}
                      </p>
                      <p className={cn("text-xs line-clamp-2 mt-0.5", isDark ? "text-white/50" : "text-slate-500")}>
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
          <div className={cn(
            "mx-3 mt-3 p-4 backdrop-blur-xl rounded-xl border shrink-0",
            isDark ? "bg-black/20 border-white/10" : "bg-white/80 border-slate-200 shadow-sm"
          )}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium",
                    isDark ? "bg-purple-500/20 text-purple-300" : "bg-purple-100 text-purple-700"
                  )}>
                    Step {currentStep.stepNumber}
                  </span>
                  {currentStep.isCheckpoint && (
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium",
                      isDark ? "bg-amber-500/20 text-amber-300" : "bg-amber-100 text-amber-700"
                    )}>
                      {currentStep.maxMarks}m
                    </span>
                  )}
                </div>
                <p className={isDark ? "text-white" : "text-slate-900"}>{currentStep.instruction}</p>
                {showHints && currentStep.hint && (
                  <div className={cn(
                    "mt-3 p-3 rounded-lg border flex items-start gap-2",
                    isDark ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-200"
                  )}>
                    <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className={cn("text-sm", isDark ? "text-amber-200" : "text-amber-800")}>{currentStep.hint}</p>
                  </div>
                )}
              </div>
              <button
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  showHints
                    ? 'bg-amber-500/20 text-amber-500'
                    : isDark ? 'text-white/50 hover:bg-white/10' : 'text-slate-400 hover:bg-slate-100'
                )}
                onClick={toggleHints}
                title="Toggle hints"
              >
                <Lightbulb className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Simulation Canvas */}
          <div className={cn(
            "flex-1 m-3 min-h-[250px] overflow-hidden rounded-xl border bg-white",
            isDark ? "border-white/10" : "border-slate-200 shadow-sm"
          )}>
            {currentExperiment.simulationType === 'phet' && currentExperiment.phetSimUrl ? (
              <PhETEmbed
                simUrl={currentExperiment.phetSimUrl}
                title={currentExperiment.name}
                guidanceNotes={currentExperiment.safetyNotes}
              />
            ) : currentExperiment.id === 'exp_acid_base_titration' ||
                 currentExperiment.slug === 'acid-base-titration' ? (
              <TitrationSimulation {...simReporters} />
            ) : currentExperiment.id === 'exp_qualitative_analysis' ||
                 currentExperiment.slug === 'qualitative-analysis' ? (
              <QualitativeAnalysisSimulation {...simReporters} />
            ) : currentExperiment.id === 'exp_microscope_use' ||
                 currentExperiment.slug === 'microscope-use' ? (
              <MicroscopeSimulation {...simReporters} />
            ) : currentExperiment.id === 'exp_food_tests' ||
                 currentExperiment.slug === 'food-tests' ? (
              <FoodTestsSimulation {...simReporters} />
            ) : currentExperiment.id === 'exp_osmosis' ||
                 currentExperiment.slug === 'osmosis-cells' ? (
              <OsmosisSimulation {...simReporters} />
            ) : currentExperiment.id === 'exp_specific_heat_capacity' ||
                 currentExperiment.slug === 'specific-heat-capacity' ? (
              <SpecificHeatSimulation {...simReporters} />
            ) : currentExperiment.id === 'exp_electrolysis_brine' ||
                 currentExperiment.slug === 'electrolysis-brine' ? (
              <ElectrolysisSimulation {...simReporters} />
            ) : currentExperiment.id === 'exp_rate_of_reaction' ||
                 currentExperiment.slug === 'rate-of-reaction' ? (
              <ReactionRateSimulation {...simReporters} />
            ) : currentExperiment.id === 'exp_crystal_preparation' ||
                 currentExperiment.slug === 'crystal-preparation' ? (
              <CrystallizationSimulation {...simReporters} />
            ) : currentExperiment.id === 'exp_gas_tests' ||
                 currentExperiment.slug === 'gas-tests' ? (
              <GasTestsSimulation {...simReporters} />
            ) : currentExperiment.id === 'exp_photosynthesis' ||
                 currentExperiment.slug === 'photosynthesis' ? (
              <PhotosynthesisSimulation {...simReporters} />
            ) : currentExperiment.id === 'exp_enzyme_activity' ||
                 currentExperiment.slug === 'enzyme-activity' ? (
              <EnzymeSimulation {...simReporters} />
            ) : currentExperiment.id === 'exp_transpiration' ||
                 currentExperiment.slug === 'transpiration' ? (
              <TranspirationSimulation {...simReporters} />
            ) : currentExperiment.id === 'exp_dissection' ||
                 currentExperiment.slug === 'virtual-dissection' ? (
              <DissectionSimulation {...simReporters} />
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
          <div className={cn(
            "flex items-center justify-between px-3 py-3 backdrop-blur-xl border-t shrink-0",
            isDark ? "bg-black/20 border-white/10" : "bg-white/70 border-slate-200"
          )}>
            <button
              onClick={previousStep}
              disabled={currentStepIndex === 0}
              className={cn(
                'flex items-center gap-1 px-3 py-2 rounded-lg font-medium transition-colors',
                currentStepIndex === 0
                  ? isDark ? 'text-white/30 cursor-not-allowed' : 'text-slate-300 cursor-not-allowed'
                  : isDark ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              )}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Prev</span>
            </button>

            <div className="flex items-center gap-2">
              {/* Mobile procedure button */}
              <button
                onClick={() => setShowMobileProcedure(true)}
                className={cn(
                  "md:hidden flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-colors",
                  isDark ? "text-white/70 hover:text-white hover:bg-white/10" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                )}
              >
                <ClipboardList className="w-4 h-4" />
                <span className="text-xs">{currentStepIndex + 1}/{totalSteps}</span>
              </button>

              {/* Data Recording Toggle */}
              <button
                onClick={() => setShowDataPanel(!showDataPanel)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-colors',
                  showDataPanel
                    ? isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'
                    : isDark ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
                  ? isDark ? 'text-white/30 cursor-not-allowed' : 'text-slate-300 cursor-not-allowed'
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
        <div className={cn(
          "relative z-10 backdrop-blur-xl border-t shrink-0 max-h-64 overflow-hidden flex flex-col",
          isDark ? "bg-black/30 border-white/10" : "bg-white/80 border-slate-200"
        )}>
          <div className={cn(
            "flex items-center justify-between px-4 py-2 border-b",
            isDark ? "border-white/10" : "border-slate-200"
          )}>
            <div className="flex items-center gap-2">
              <Table className="w-4 h-4 text-purple-500" />
              <span className={cn("font-medium text-sm", isDark ? "text-white" : "text-slate-900")}>Data Recording</span>
            </div>
            <button
              className={cn(
                "p-1 rounded transition-colors",
                isDark ? "hover:bg-white/10 text-white/70" : "hover:bg-slate-100 text-slate-600"
              )}
              onClick={() => setShowDataPanel(false)}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Measurements */}
              <div>
                <h4 className={cn("text-xs font-medium mb-2 uppercase tracking-wide", isDark ? "text-white/70" : "text-slate-500")}>Measurements</h4>
                {measurements.length > 0 ? (
                  <div className="space-y-1">
                    {measurements.map((m) => (
                      <div key={m.id} className={cn(
                        "text-xs p-2 rounded-lg flex justify-between border",
                        isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"
                      )}>
                        <span className={cn("font-mono", isDark ? "text-white" : "text-slate-900")}>{m.value} {m.unit}</span>
                        <span className={isDark ? "text-white/40" : "text-slate-500"}>Step {m.stepNumber}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={cn("text-xs italic", isDark ? "text-white/40" : "text-slate-400")}>No measurements yet</p>
                )}
              </div>

              {/* Observations */}
              <div>
                <h4 className={cn("text-xs font-medium mb-2 uppercase tracking-wide", isDark ? "text-white/70" : "text-slate-500")}>Observations</h4>
                <div className="space-y-1">
                  {observations.map((obs) => (
                    <div key={obs.id} className={cn(
                      "text-xs p-2 rounded-lg border",
                      isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"
                    )}>
                      <p className={isDark ? "text-white/80" : "text-slate-700"}>{obs.text}</p>
                      <span className={isDark ? "text-white/40" : "text-slate-500"}>Step {obs.stepNumber}</span>
                    </div>
                  ))}
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={observationText}
                      onChange={(e) => setObservationText(e.target.value)}
                      placeholder="Add observation..."
                      className={cn(
                        "flex-1 text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50",
                        isDark
                          ? "bg-white/5 border-white/10 text-white placeholder:text-white/40"
                          : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
                      )}
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
                  <h4 className={cn("text-xs font-medium mb-2 uppercase tracking-wide flex items-center gap-1", isDark ? "text-white/70" : "text-slate-500")}>
                    <AlertTriangle className="w-3 h-3 text-amber-500" />
                    Safety Notes
                  </h4>
                  <ul className="text-xs space-y-1">
                    {currentExperiment.safetyNotes.map((note, idx) => (
                      <li key={idx} className={cn(
                        "flex items-start gap-1 p-2 rounded-lg border",
                        isDark ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-200"
                      )}>
                        <span className="text-amber-500 shrink-0">!</span>
                        <span className={isDark ? "text-amber-200" : "text-amber-800"}>{note}</span>
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
        <div className={cn(
          "fixed inset-0 backdrop-blur-sm flex items-center justify-center z-[60] p-4",
          isDark ? "bg-black/70" : "bg-slate-900/50"
        )}>
          <div className={cn(
            "w-full max-w-md rounded-2xl p-6 border animate-in zoom-in-95 duration-200",
            isDark ? "bg-slate-800 border-white/10" : "bg-white border-slate-200 shadow-xl"
          )}>
            <h3 className={cn("text-lg font-bold mb-2", isDark ? "text-white" : "text-slate-900")}>Submit Experiment?</h3>
            <p className={cn("mb-4", isDark ? "text-white/70" : "text-slate-600")}>
              You have completed {completedSteps} of {totalSteps} steps.
              {completedSteps < totalSteps && (
                <span className={cn("block mt-1", isDark ? "text-amber-400" : "text-amber-600")}>
                  Some steps are incomplete. You may lose marks.
                </span>
              )}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className={cn(
                  "px-4 py-2 rounded-lg transition-colors border",
                  isDark
                    ? "bg-white/5 text-white border-white/10 hover:bg-white/10"
                    : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                )}
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
        <div className={cn(
          "fixed inset-0 backdrop-blur-sm flex items-center justify-center z-[60] p-4",
          isDark ? "bg-black/70" : "bg-slate-900/50"
        )}>
          <div className={cn(
            "w-full max-w-md rounded-2xl p-6 border animate-in zoom-in-95 duration-200",
            isDark ? "bg-slate-800 border-white/10" : "bg-white border-slate-200 shadow-xl"
          )}>
            <h3 className={cn("text-lg font-bold mb-2", isDark ? "text-white" : "text-slate-900")}>Exit Lab?</h3>
            <p className={cn("mb-4", isDark ? "text-white/70" : "text-slate-600")}>
              Your progress will be lost if you exit now. Are you sure you want to leave?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowExitConfirm(false)}
                className={cn(
                  "px-4 py-2 rounded-lg transition-colors border",
                  isDark
                    ? "bg-white/5 text-white border-white/10 hover:bg-white/10"
                    : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                )}
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

      {/* Mobile Procedure Panel */}
      {showMobileProcedure && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div
            className={cn("absolute inset-0 backdrop-blur-sm", isDark ? "bg-black/60" : "bg-slate-900/50")}
            onClick={() => setShowMobileProcedure(false)}
          />
          <div className={cn(
            "absolute inset-x-0 bottom-0 rounded-t-3xl border-t p-4 animate-in slide-in-from-bottom duration-300 max-h-[70vh] overflow-hidden flex flex-col",
            isDark ? "bg-slate-800 border-white/10" : "bg-white border-slate-200"
          )}>
            <div className={cn("w-12 h-1 rounded-full mx-auto mb-4", isDark ? "bg-white/20" : "bg-slate-300")} />
            <div className="flex items-center justify-between mb-4">
              <h3 className={cn("font-semibold flex items-center gap-2", isDark ? "text-white" : "text-slate-900")}>
                <ClipboardList className="w-5 h-5 text-purple-500" />
                Procedure Steps
              </h3>
              <span className={cn("text-sm", isDark ? "text-white/50" : "text-slate-500")}>
                {completedSteps}/{totalSteps} complete
              </span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pb-4">
              {currentExperiment.procedure.map((step, idx) => (
                <button
                  key={step.stepNumber}
                  onClick={() => {
                    goToStep(idx);
                    setShowMobileProcedure(false);
                  }}
                  className={cn(
                    'w-full p-3 rounded-xl text-left transition-all border',
                    idx === currentStepIndex
                      ? isDark ? 'bg-purple-500/20 border-purple-500/50' : 'bg-purple-100 border-purple-300'
                      : stepCompletionStatus[idx]
                        ? isDark ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
                        : isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
                  )}
                >
                  <div className="flex items-start gap-3">
                    {stepCompletionStatus[idx] ? (
                      <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <Circle className={cn(
                        'w-5 h-5 shrink-0 mt-0.5',
                        idx === currentStepIndex ? 'text-purple-500' : isDark ? 'text-white/30' : 'text-slate-400'
                      )} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-sm font-medium',
                        idx === currentStepIndex
                          ? isDark ? 'text-purple-300' : 'text-purple-700'
                          : isDark ? 'text-white' : 'text-slate-900'
                      )}>
                        Step {step.stepNumber}
                      </p>
                      <p className={cn("text-xs mt-0.5 line-clamp-2", isDark ? "text-white/60" : "text-slate-500")}>
                        {step.instruction}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
