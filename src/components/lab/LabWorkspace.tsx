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
} from 'lucide-react';
import { Card, Button, Badge, ProgressBar } from '@/components/common';
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
  const [observationText, setObservationText] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<GradingResult | null>(null);
  const [showDataPanel, setShowDataPanel] = useState(false);

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

  if (!currentExperiment || !currentSession) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-neutral-500">No active experiment session</p>
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
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
            <Award className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">
            Experiment Complete!
          </h2>
          <p className="text-neutral-600 mb-6">{currentExperiment.name}</p>

          {/* Score Circle */}
          <div className="relative w-40 h-40 mx-auto mb-6">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="#e5e7eb"
                strokeWidth="12"
                fill="none"
              />
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke={results.percentageScore >= 70 ? '#10b981' : results.percentageScore >= 50 ? '#f59e0b' : '#ef4444'}
                strokeWidth="12"
                fill="none"
                strokeDasharray={440}
                strokeDashoffset={440 - (440 * results.percentageScore) / 100}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-neutral-900">
                {results.percentageScore}%
              </span>
              <span className="text-sm text-neutral-500">
                {results.totalScore}/{results.maxScore} marks
              </span>
            </div>
          </div>

          {/* Criteria Breakdown */}
          <div className="space-y-3 mb-6 text-left">
            {results.criteriaScores.map((criteria) => (
              <div key={criteria.criterionId} className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">{criteria.criterionName}</span>
                <div className="flex items-center gap-2">
                  <ProgressBar
                    value={(criteria.score / criteria.maxScore) * 100}
                    className="w-24 h-2"
                  />
                  <span className="text-sm font-medium text-neutral-900 w-16 text-right">
                    {criteria.score}/{criteria.maxScore}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Feedback */}
          <Card className="p-4 bg-neutral-50 text-left mb-6">
            <p className="text-neutral-700 mb-3">{results.feedback.overall}</p>
            {results.feedback.strengths.length > 0 && (
              <div className="mb-2">
                <span className="text-xs font-medium text-green-600 uppercase">Strengths:</span>
                <ul className="text-sm text-neutral-600">
                  {results.feedback.strengths.map((s, i) => (
                    <li key={i}>+ {s}</li>
                  ))}
                </ul>
              </div>
            )}
            {results.feedback.improvements.length > 0 && (
              <div>
                <span className="text-xs font-medium text-amber-600 uppercase">Areas to improve:</span>
                <ul className="text-sm text-neutral-600">
                  {results.feedback.improvements.map((s, i) => (
                    <li key={i}>- {s}</li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          {/* Actions */}
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={onExit}>
              Exit Lab
            </Button>
            <Button
              onClick={() => {
                setShowResults(false);
                onExit();
              }}
            >
              Try Another Experiment
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-[600px]">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-neutral-200 rounded-t-lg shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onExit}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Exit
          </Button>
          <div>
            <h2 className="font-semibold text-neutral-900 line-clamp-1">
              {currentExperiment.name}
            </h2>
            <div className="flex items-center gap-2 text-sm text-neutral-500">
              <Badge variant={mode === 'guided' ? 'primary' : 'secondary'} size="sm">
                {mode === 'guided' ? 'Guided' : 'Sandbox'}
              </Badge>
              <span>Step {currentStepIndex + 1} of {totalSteps}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Timer */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 rounded-lg">
            <Clock className="w-4 h-4 text-neutral-500" />
            <span className="font-mono text-neutral-900">{formatTime(timeSpent)}</span>
            <Button
              variant="ghost"
              size="sm"
              className="p-1"
              onClick={isTimerRunning ? pauseTimer : resumeTimer}
            >
              {isTimerRunning ? (
                <Pause className="w-3 h-3" />
              ) : (
                <Play className="w-3 h-3" />
              )}
            </Button>
          </div>

          {/* Progress */}
          <div className="hidden md:flex items-center gap-2">
            <ProgressBar value={progressPercent} className="w-24 h-2" />
            <span className="text-sm text-neutral-500">{progressPercent}%</span>
          </div>

          {/* Submit */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowSubmitConfirm(true)}
            disabled={completedSteps < totalSteps && mode === 'guided'}
          >
            <Send className="w-4 h-4 mr-1" />
            Submit
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-neutral-100 rounded-b-lg">
        {/* Two-column layout: Procedure + Lab Simulation */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left Panel - Procedure Guide (narrower) */}
          <div className={cn(
            'bg-white border-r overflow-y-auto transition-all shrink-0 hidden md:block',
            isProcedurePanelOpen ? 'w-56 lg:w-64' : 'w-10'
          )}>
            <div className="sticky top-0 bg-white border-b z-10">
              <div className="flex items-center justify-between p-2">
                {isProcedurePanelOpen && (
                  <div className="flex items-center gap-1.5">
                    <ClipboardList className="w-4 h-4 text-neutral-500" />
                    <span className="font-medium text-neutral-900 text-sm">Procedure</span>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1"
                  onClick={toggleProcedurePanel}
                >
                  {isProcedurePanelOpen ? (
                    <ChevronLeft className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {isProcedurePanelOpen && (
              <div className="p-2 space-y-1.5">
                {currentExperiment.procedure.map((step, idx) => (
                  <div
                    key={step.stepNumber}
                    className={cn(
                      'p-2 rounded-lg cursor-pointer transition-colors border',
                      idx === currentStepIndex
                        ? 'bg-primary-50 border-primary'
                        : stepCompletionStatus[idx]
                          ? 'bg-green-50 border-green-200'
                          : 'bg-neutral-50 border-transparent hover:border-neutral-200'
                    )}
                    onClick={() => goToStep(idx)}
                  >
                    <div className="flex items-start gap-1.5">
                      {stepCompletionStatus[idx] ? (
                        <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      ) : (
                        <Circle className={cn(
                          'w-4 h-4 shrink-0 mt-0.5',
                          idx === currentStepIndex ? 'text-primary' : 'text-neutral-300'
                        )} />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          'text-xs font-medium',
                          idx === currentStepIndex ? 'text-primary' : 'text-neutral-700'
                        )}>
                          Step {step.stepNumber}
                        </p>
                        <p className="text-xs text-neutral-500 line-clamp-2 mt-0.5">
                          {step.instruction}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Main Lab Area - Simulation (takes remaining width) */}
          <div className="flex-1 flex flex-col min-w-0 bg-neutral-50 overflow-hidden">
            {/* Current Step Instruction - Compact */}
            <div className="mx-2 mt-2 p-3 bg-white rounded-lg border border-neutral-200 shrink-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="primary" size="sm">Step {currentStep.stepNumber}</Badge>
                    {currentStep.isCheckpoint && (
                      <Badge variant="secondary" size="sm">{currentStep.maxMarks}m</Badge>
                    )}
                  </div>
                  <p className="text-sm text-neutral-900">{currentStep.instruction}</p>
                  {showHints && currentStep.hint && (
                    <div className="mt-2 p-2 bg-amber-50 rounded flex items-start gap-2">
                      <Lightbulb className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800">{currentStep.hint}</p>
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1 shrink-0"
                  onClick={toggleHints}
                  title="Toggle hints"
                >
                  <Lightbulb className={cn('w-4 h-4', showHints && 'text-amber-500')} />
                </Button>
              </div>
            </div>

            {/* Simulation Canvas / PhET Embed - Takes most space */}
            <div className="flex-1 m-2 min-h-[250px] overflow-hidden rounded-lg border border-neutral-200 bg-white">
              {currentExperiment.simulationType === 'phet' && currentExperiment.phetSimUrl ? (
                <PhETEmbed
                  simUrl={currentExperiment.phetSimUrl}
                  title={currentExperiment.name}
                  guidanceNotes={currentExperiment.safetyNotes}
                />
              ) : currentExperiment.id === 'exp_acid_base_titration' ? (
                <TitrationSimulation
                  onObservation={(text) => addObservation(text)}
                />
              ) : currentExperiment.id === 'exp_qualitative_analysis' ? (
                <QualitativeAnalysisSimulation
                  onObservation={(text) => addObservation(text)}
                />
              ) : currentExperiment.id === 'exp_microscope_use' ? (
                <MicroscopeSimulation
                  onObservation={(text) => addObservation(text)}
                />
              ) : currentExperiment.id === 'exp_food_tests' ? (
                <FoodTestsSimulation
                  onObservation={(text) => addObservation(text)}
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center p-8">
                    <FlaskConical className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                    <p className="text-neutral-500 mb-2 font-medium">Custom Simulation</p>
                    <p className="text-sm text-neutral-400">
                      Interactive apparatus workspace coming soon
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Step Navigation + Data Toggle */}
            <div className="flex items-center justify-between px-2 py-2 bg-white border-t shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={previousStep}
                disabled={currentStepIndex === 0}
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline ml-1">Prev</span>
              </Button>

              <div className="flex items-center gap-2">
                {/* Mobile step indicator */}
                <span className="text-xs text-neutral-500 md:hidden">
                  {currentStepIndex + 1}/{totalSteps}
                </span>

                {/* Data Recording Toggle */}
                <Button
                  variant={showDataPanel ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => setShowDataPanel(!showDataPanel)}
                  className="gap-1"
                >
                  <Table className="w-4 h-4" />
                  <span className="hidden sm:inline">Data</span>
                  {(measurements.length + observations.length) > 0 && (
                    <Badge variant="primary" size="sm" className="ml-1">
                      {measurements.length + observations.length}
                    </Badge>
                  )}
                  {showDataPanel ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                </Button>

                {!stepCompletionStatus[currentStepIndex] && (
                  <Button variant="primary" size="sm" onClick={completeStep}>
                    <CheckCircle className="w-4 h-4" />
                    <span className="hidden sm:inline ml-1">Done</span>
                  </Button>
                )}
              </div>

              <Button
                size="sm"
                onClick={nextStep}
                disabled={currentStepIndex === totalSteps - 1}
              >
                <span className="hidden sm:inline mr-1">Next</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Panel - Data Recording (Collapsible) */}
        {showDataPanel && (
          <div className="bg-white border-t shrink-0 max-h-64 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 border-b bg-neutral-50">
              <div className="flex items-center gap-2">
                <Table className="w-4 h-4 text-neutral-500" />
                <span className="font-medium text-neutral-900 text-sm">Data Recording</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="p-1"
                onClick={() => setShowDataPanel(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Measurements */}
                <div>
                  <h4 className="text-xs font-medium text-neutral-700 mb-2 uppercase tracking-wide">Measurements</h4>
                  {measurements.length > 0 ? (
                    <div className="space-y-1">
                      {measurements.map((m) => (
                        <div key={m.id} className="text-xs p-2 bg-neutral-50 rounded flex justify-between">
                          <span className="font-mono">{m.value} {m.unit}</span>
                          <span className="text-neutral-400">Step {m.stepNumber}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-neutral-400 italic">No measurements yet</p>
                  )}
                </div>

                {/* Observations */}
                <div>
                  <h4 className="text-xs font-medium text-neutral-700 mb-2 uppercase tracking-wide">Observations</h4>
                  <div className="space-y-1">
                    {observations.map((obs) => (
                      <div key={obs.id} className="text-xs p-2 bg-neutral-50 rounded">
                        <p className="text-neutral-700">{obs.text}</p>
                        <span className="text-neutral-400">Step {obs.stepNumber}</span>
                      </div>
                    ))}
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={observationText}
                        onChange={(e) => setObservationText(e.target.value)}
                        placeholder="Add observation..."
                        className="flex-1 text-xs px-2 py-1.5 border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddObservation()}
                      />
                      <Button size="sm" className="px-2" onClick={handleAddObservation}>
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Safety Notes */}
                {currentExperiment.safetyNotes.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-neutral-700 mb-2 uppercase tracking-wide flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                      Safety Notes
                    </h4>
                    <ul className="text-xs text-neutral-600 space-y-1">
                      {currentExperiment.safetyNotes.map((note, idx) => (
                        <li key={idx} className="flex items-start gap-1 p-1.5 bg-amber-50 rounded">
                          <span className="text-amber-500 shrink-0">!</span>
                          <span>{note}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-neutral-900 mb-2">Submit Experiment?</h3>
            <p className="text-neutral-600 mb-4">
              You have completed {completedSteps} of {totalSteps} steps.
              {completedSteps < totalSteps && (
                <span className="text-amber-600 block mt-1">
                  Some steps are incomplete. You may lose marks.
                </span>
              )}
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowSubmitConfirm(false)}>
                Continue Working
              </Button>
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? 'Submitting...' : 'Submit Now'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
