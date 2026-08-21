import { useState, useEffect, useCallback, ReactNode } from 'react';
import {
  Clock,
  X,
  AlertTriangle,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Pause,
  Play,
  ChevronLeft,
  ChevronRight,
  Flag,
  Send,
  CheckCircle,
  Loader2,
  Shield,
  Zap,
  Sun,
  Moon,
} from 'lucide-react';
import { cn } from '@/utils';
import { useThemeStore } from '@/stores/themeStore';
import { useUIStore } from '@/stores/uiStore';

export interface ExamLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  totalQuestions: number;
  currentQuestion: number;
  answeredQuestions: Set<string> | number;
  markedForReview?: Set<string>;
  timeLimit?: number; // in seconds, 0 = no limit
  onExit: () => void;
  onSubmit: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onMarkForReview?: () => void;
  onQuestionSelect?: (index: number) => void;
  isSubmitting?: boolean;
  showNavigation?: boolean;
  showQuestionNav?: boolean;
  examType?: 'practice' | 'mock' | 'assessment' | 'battle' | 'speed';
}

export function ExamLayout({
  children,
  title,
  subtitle,
  totalQuestions,
  currentQuestion,
  answeredQuestions,
  markedForReview = new Set(),
  timeLimit = 0,
  onExit,
  onSubmit,
  onPrevious,
  onNext,
  onMarkForReview,
  onQuestionSelect,
  isSubmitting = false,
  showNavigation = true,
  showQuestionNav = true,
  examType = 'practice',
}: ExamLayoutProps) {
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [showQuestionPanel, setShowQuestionPanel] = useState(false);

  const { resolvedTheme, setTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';

  const toggleLocalTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  // Set distraction-free mode
  const { setDistractionFreeMode } = useUIStore();
  useEffect(() => {
    setDistractionFreeMode(true);
    return () => setDistractionFreeMode(false);
  }, [setDistractionFreeMode]);

  const answeredCount = typeof answeredQuestions === 'number'
    ? answeredQuestions
    : answeredQuestions.size;

  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  // Accent colors for different exam types
  const accentColors: Record<string, { primary: string; secondary: string; bg: string }> = {
    practice: { primary: 'from-blue-600 to-indigo-600', secondary: 'bg-blue-500', bg: 'bg-blue-50' },
    mock: { primary: 'from-purple-600 to-indigo-600', secondary: 'bg-purple-500', bg: 'bg-purple-50' },
    assessment: { primary: 'from-emerald-600 to-teal-600', secondary: 'bg-emerald-500', bg: 'bg-emerald-50' },
    battle: { primary: 'from-red-600 to-orange-600', secondary: 'bg-red-500', bg: 'bg-red-50' },
    speed: { primary: 'from-amber-500 to-orange-500', secondary: 'bg-amber-500', bg: 'bg-amber-50' },
  };

  const colors = accentColors[examType] || accentColors.practice;

  // Timer effect
  useEffect(() => {
    if (timeLimit === 0 || isPaused) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLimit, isPaused, onSubmit]);

  // Time warning at 5 minutes
  useEffect(() => {
    if (timeRemaining === 300 && !showTimeWarning) {
      setShowTimeWarning(true);
      if (soundEnabled) {
        // Play warning sound
        const audio = new Audio('/sounds/warning.mp3');
        audio.play().catch(() => {});
      }
    }
  }, [timeRemaining, showTimeWarning, soundEnabled]);

  // Fullscreen handling
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(() => {});
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(() => {});
    }
  }, []);

  // Prevent accidental navigation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Format time
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isLastQuestion = currentQuestion >= totalQuestions;
  const isTimeWarning = timeLimit > 0 && timeRemaining <= 300;
  const isTimeCritical = timeLimit > 0 && timeRemaining <= 60;

  return (
    <div className={cn(
      "fixed inset-0 z-50 flex flex-col overflow-hidden transition-colors duration-300",
      isDark
        ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
        : "bg-gradient-to-br from-slate-100 via-white to-slate-100"
    )}>
      {/* Animated background pattern */}
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

      {/* Top Header Bar */}
      <header className={cn(
        "relative z-10 backdrop-blur-xl border-b",
        isDark ? "bg-black/20 border-white/10" : "bg-white/70 border-slate-200 shadow-sm"
      )}>
        <div className="px-4 lg:px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Exit & Title */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowExitModal(true)}
                className={cn(
                  "p-2 rounded-xl transition-all group",
                  isDark
                    ? "bg-white/5 hover:bg-white/10 text-white/70 hover:text-white"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900"
                )}
              >
                <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              </button>

              <div className="hidden sm:block">
                <div className="flex items-center gap-2">
                  <div className={cn('p-1.5 rounded-lg bg-gradient-to-r', colors.primary)}>
                    {examType === 'battle' ? <Zap className="w-4 h-4 text-white" /> :
                     examType === 'speed' ? <Zap className="w-4 h-4 text-white" /> :
                     <Shield className="w-4 h-4 text-white" />}
                  </div>
                  <div>
                    <h1 className={cn("font-semibold text-sm lg:text-base line-clamp-1", isDark ? "text-white" : "text-slate-900")}>
                      {title}
                    </h1>
                    {subtitle && (
                      <p className={cn("text-xs", isDark ? "text-white/50" : "text-slate-500")}>{subtitle}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Center: Progress & Question Counter */}
            <div className="flex-1 max-w-md mx-4 hidden md:block">
              <div className="flex items-center gap-3">
                <span className={cn("text-xs whitespace-nowrap", isDark ? "text-white/50" : "text-slate-500")}>
                  {answeredCount}/{totalQuestions}
                </span>
                <div className={cn("flex-1 h-2 rounded-full overflow-hidden", isDark ? "bg-white/10" : "bg-slate-200")}>
                  <div
                    className={cn('h-full rounded-full transition-all duration-500 bg-gradient-to-r', colors.primary)}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className={cn("text-xs whitespace-nowrap", isDark ? "text-white/50" : "text-slate-500")}>
                  {Math.round(progress)}%
                </span>
              </div>
            </div>

            {/* Right: Timer & Controls */}
            <div className="flex items-center gap-2 lg:gap-3">
              {/* Timer */}
              {timeLimit > 0 && (
                <div
                  className={cn(
                    'flex items-center gap-2 px-3 lg:px-4 py-2 rounded-xl font-mono font-bold text-sm lg:text-base transition-all',
                    isTimeCritical
                      ? 'bg-red-500/20 text-red-500 animate-pulse'
                      : isTimeWarning
                        ? 'bg-amber-500/20 text-amber-500'
                        : isDark ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-900'
                  )}
                >
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(timeRemaining)}</span>
                </div>
              )}

              {/* Theme toggle */}
              <button
                onClick={toggleLocalTheme}
                className={cn(
                  "p-2 rounded-lg transition-all hidden lg:flex",
                  isDark
                    ? "bg-white/5 hover:bg-white/10 text-white/70 hover:text-white"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900"
                )}
                title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Control buttons */}
              <div className="hidden lg:flex items-center gap-1">
                {timeLimit > 0 && (
                  <button
                    onClick={() => setIsPaused(!isPaused)}
                    className={cn(
                      "p-2 rounded-lg transition-all",
                      isDark
                        ? "bg-white/5 hover:bg-white/10 text-white/70 hover:text-white"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900"
                    )}
                    title={isPaused ? 'Resume' : 'Pause'}
                  >
                    {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  </button>
                )}
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={cn(
                    "p-2 rounded-lg transition-all",
                    isDark
                      ? "bg-white/5 hover:bg-white/10 text-white/70 hover:text-white"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900"
                  )}
                  title={soundEnabled ? 'Mute' : 'Unmute'}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
                <button
                  onClick={toggleFullscreen}
                  className={cn(
                    "p-2 rounded-lg transition-all",
                    isDark
                      ? "bg-white/5 hover:bg-white/10 text-white/70 hover:text-white"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900"
                  )}
                  title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>

              {/* Submit button */}
              <button
                onClick={() => setShowSubmitModal(true)}
                disabled={isSubmitting}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all',
                  'bg-gradient-to-r text-white shadow-lg hover:shadow-xl hover:scale-105',
                  colors.primary
                )}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Submit</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile progress bar */}
        <div className={cn("md:hidden h-1", isDark ? "bg-white/10" : "bg-slate-200")}>
          <div
            className={cn('h-full transition-all duration-500 bg-gradient-to-r', colors.primary)}
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex overflow-hidden">
        {/* Question content */}
        <div className="flex-1 overflow-y-auto">
          <div className="min-h-full p-4 lg:p-8">
            <div className="max-w-4xl mx-auto">
              {/* Question indicator - mobile */}
              <div className="md:hidden mb-4 flex items-center justify-between">
                <span className={cn("text-sm", isDark ? "text-white/70" : "text-slate-600")}>
                  Question {currentQuestion} of {totalQuestions}
                </span>
                <button
                  onClick={() => setShowQuestionPanel(true)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm",
                    isDark ? "bg-white/10 text-white" : "bg-slate-200 text-slate-700"
                  )}
                >
                  View All
                </button>
              </div>

              {/* Main content card */}
              <div className={cn(
                "backdrop-blur-sm rounded-2xl lg:rounded-3xl border overflow-hidden",
                isDark ? "bg-white/[0.03] border-white/10" : "bg-white/80 border-slate-200 shadow-lg"
              )}>
                {children}
              </div>
            </div>
          </div>
        </div>

        {/* Question Navigator Sidebar - Desktop */}
        {showQuestionNav && onQuestionSelect && (
          <aside className={cn(
            "hidden lg:flex w-72 xl:w-80 backdrop-blur-xl border-l flex-col",
            isDark ? "bg-black/20 border-white/10" : "bg-white/70 border-slate-200"
          )}>
            <div className={cn("p-4 border-b", isDark ? "border-white/10" : "border-slate-200")}>
              <h3 className={cn("font-semibold text-sm", isDark ? "text-white" : "text-slate-900")}>Question Navigator</h3>
              <p className={cn("text-xs mt-1", isDark ? "text-white/50" : "text-slate-500")}>
                {answeredCount} of {totalQuestions} answered
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: totalQuestions }, (_, i) => {
                  const qNum = i + 1;
                  const qId = `q_${i}`;
                  const isAnswered = typeof answeredQuestions === 'number'
                    ? i < answeredQuestions
                    : answeredQuestions.has(qId);
                  const isMarked = markedForReview.has(qId);
                  const isCurrent = qNum === currentQuestion;

                  return (
                    <button
                      key={i}
                      onClick={() => onQuestionSelect(i)}
                      className={cn(
                        'aspect-square rounded-xl font-medium text-sm transition-all relative',
                        isCurrent && (isDark
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 bg-white text-slate-900'
                          : 'ring-2 ring-purple-500 ring-offset-2 ring-offset-white bg-purple-500 text-white'),
                        isAnswered && !isCurrent && (isDark
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-emerald-100 text-emerald-700'),
                        isMarked && (isDark
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-amber-100 text-amber-700'),
                        !isAnswered && !isMarked && !isCurrent && (isDark
                          ? 'bg-white/5 text-white/50 hover:bg-white/10'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200')
                      )}
                    >
                      {qNum}
                      {isMarked && (
                        <Flag className="absolute -top-1 -right-1 w-3 h-3 text-amber-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div className={cn("p-4 border-t space-y-2", isDark ? "border-white/10" : "border-slate-200")}>
              <div className="flex items-center gap-2 text-xs">
                <div className={cn("w-4 h-4 rounded", isDark ? "bg-emerald-500/20" : "bg-emerald-100")} />
                <span className={isDark ? "text-white/70" : "text-slate-600"}>Answered</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className={cn("w-4 h-4 rounded", isDark ? "bg-amber-500/20" : "bg-amber-100")} />
                <span className={isDark ? "text-white/70" : "text-slate-600"}>Marked for Review</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className={cn("w-4 h-4 rounded", isDark ? "bg-white/5" : "bg-slate-100")} />
                <span className={isDark ? "text-white/70" : "text-slate-600"}>Not Answered</span>
              </div>
            </div>
          </aside>
        )}
      </main>

      {/* Bottom Navigation Bar */}
      {showNavigation && (
        <footer className={cn(
          "relative z-10 backdrop-blur-xl border-t",
          isDark ? "bg-black/20 border-white/10" : "bg-white/70 border-slate-200"
        )}>
          <div className="px-4 lg:px-6 py-3">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
              {/* Previous */}
              <button
                onClick={onPrevious}
                disabled={currentQuestion <= 1}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all',
                  currentQuestion <= 1
                    ? isDark ? 'text-white/30 cursor-not-allowed' : 'text-slate-300 cursor-not-allowed'
                    : isDark ? 'text-white bg-white/5 hover:bg-white/10' : 'text-slate-700 bg-slate-100 hover:bg-slate-200'
                )}
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Previous</span>
              </button>

              {/* Mark for Review */}
              {onMarkForReview && (
                <button
                  onClick={onMarkForReview}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all',
                    markedForReview.has(`q_${currentQuestion - 1}`)
                      ? isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'
                      : isDark ? 'text-white/70 bg-white/5 hover:bg-white/10' : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
                  )}
                >
                  <Flag className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {markedForReview.has(`q_${currentQuestion - 1}`) ? 'Marked' : 'Mark'}
                  </span>
                </button>
              )}

              {/* Next / Finish */}
              <button
                onClick={isLastQuestion ? () => setShowSubmitModal(true) : onNext}
                className={cn(
                  'flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all',
                  'bg-gradient-to-r text-white shadow-lg hover:shadow-xl hover:scale-105',
                  isLastQuestion ? 'from-emerald-500 to-teal-500' : colors.primary
                )}
              >
                <span>{isLastQuestion ? 'Finish' : 'Next'}</span>
                {isLastQuestion ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </footer>
      )}

      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className={cn("absolute inset-0 backdrop-blur-sm", isDark ? "bg-black/60" : "bg-slate-900/50")} onClick={() => setShowExitModal(false)} />
          <div className={cn(
            "relative rounded-2xl shadow-2xl p-6 max-w-md w-full border animate-in zoom-in-95 duration-200",
            isDark ? "bg-slate-800 border-white/10" : "bg-white border-slate-200"
          )}>
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className={cn("text-xl font-bold text-center mb-2", isDark ? "text-white" : "text-slate-900")}>
              Exit Exam?
            </h3>
            <p className={cn("text-center mb-6", isDark ? "text-white/60" : "text-slate-500")}>
              Your progress will be saved, but the timer will continue. Are you sure you want to exit?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitModal(false)}
                className={cn(
                  "flex-1 py-3 rounded-xl font-medium transition-colors",
                  isDark ? "bg-white/5 text-white hover:bg-white/10" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                )}
              >
                Continue Exam
              </button>
              <button
                onClick={() => {
                  setShowExitModal(false);
                  onExit();
                }}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className={cn("absolute inset-0 backdrop-blur-sm", isDark ? "bg-black/60" : "bg-slate-900/50")} onClick={() => setShowSubmitModal(false)} />
          <div className={cn(
            "relative rounded-2xl shadow-2xl p-6 max-w-md w-full border animate-in zoom-in-95 duration-200",
            isDark ? "bg-slate-800 border-white/10" : "bg-white border-slate-200"
          )}>
            <div className={cn('w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-gradient-to-r', colors.primary)}>
              <Send className="w-8 h-8 text-white" />
            </div>
            <h3 className={cn("text-xl font-bold text-center mb-2", isDark ? "text-white" : "text-slate-900")}>
              Submit Exam?
            </h3>
            <p className={cn("text-center mb-4", isDark ? "text-white/60" : "text-slate-500")}>
              {answeredCount < totalQuestions
                ? `You have ${totalQuestions - answeredCount} unanswered questions.`
                : 'You have answered all questions.'}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className={cn("rounded-xl p-3 text-center", isDark ? "bg-white/5" : "bg-slate-100")}>
                <p className={cn("text-2xl font-bold", isDark ? "text-white" : "text-slate-900")}>{answeredCount}</p>
                <p className={cn("text-xs", isDark ? "text-white/50" : "text-slate-500")}>Answered</p>
              </div>
              <div className={cn("rounded-xl p-3 text-center", isDark ? "bg-white/5" : "bg-slate-100")}>
                <p className={cn("text-2xl font-bold", isDark ? "text-white" : "text-slate-900")}>{totalQuestions - answeredCount}</p>
                <p className={cn("text-xs", isDark ? "text-white/50" : "text-slate-500")}>Unanswered</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className={cn(
                  "flex-1 py-3 rounded-xl font-medium transition-colors",
                  isDark ? "bg-white/5 text-white hover:bg-white/10" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                )}
              >
                Review
              </button>
              <button
                onClick={() => {
                  setShowSubmitModal(false);
                  onSubmit();
                }}
                disabled={isSubmitting}
                className={cn(
                  'flex-1 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2',
                  'bg-gradient-to-r text-white',
                  colors.primary
                )}
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>Submit</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Time Warning Modal */}
      {showTimeWarning && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className={cn("absolute inset-0 backdrop-blur-sm", isDark ? "bg-black/60" : "bg-slate-900/50")} />
          <div className={cn(
            "relative rounded-2xl shadow-2xl p-6 max-w-sm w-full border animate-in zoom-in-95 duration-200",
            isDark ? "bg-slate-800 border-amber-500/20" : "bg-white border-amber-300"
          )}>
            <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-amber-500 animate-pulse" />
            </div>
            <h3 className={cn("text-xl font-bold text-center mb-2", isDark ? "text-white" : "text-slate-900")}>
              5 Minutes Remaining
            </h3>
            <p className={cn("text-center mb-6", isDark ? "text-white/60" : "text-slate-500")}>
              You have 5 minutes left to complete and submit your exam.
            </p>
            <button
              onClick={() => setShowTimeWarning(false)}
              className="w-full py-3 rounded-xl bg-amber-500 text-white font-medium hover:bg-amber-600 transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Mobile Question Panel */}
      {showQuestionPanel && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className={cn("absolute inset-0 backdrop-blur-sm", isDark ? "bg-black/60" : "bg-slate-900/50")} onClick={() => setShowQuestionPanel(false)} />
          <div className={cn(
            "absolute inset-x-0 bottom-0 rounded-t-3xl border-t p-4 animate-in slide-in-from-bottom duration-300",
            isDark ? "bg-slate-800 border-white/10" : "bg-white border-slate-200"
          )}>
            <div className={cn("w-12 h-1 rounded-full mx-auto mb-4", isDark ? "bg-white/20" : "bg-slate-300")} />
            <h3 className={cn("font-semibold mb-4", isDark ? "text-white" : "text-slate-900")}>Questions</h3>
            <div className="grid grid-cols-6 gap-2 max-h-64 overflow-y-auto pb-4">
              {Array.from({ length: totalQuestions }, (_, i) => {
                const qNum = i + 1;
                const qId = `q_${i}`;
                const isAnswered = typeof answeredQuestions === 'number'
                  ? i < answeredQuestions
                  : answeredQuestions.has(qId);
                const isCurrent = qNum === currentQuestion;

                return (
                  <button
                    key={i}
                    onClick={() => {
                      onQuestionSelect?.(i);
                      setShowQuestionPanel(false);
                    }}
                    className={cn(
                      'aspect-square rounded-xl font-medium text-sm transition-all',
                      isCurrent && (isDark
                        ? 'ring-2 ring-white bg-white text-slate-900'
                        : 'ring-2 ring-purple-500 bg-purple-500 text-white'),
                      isAnswered && !isCurrent && (isDark
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-emerald-100 text-emerald-700'),
                      !isAnswered && !isCurrent && (isDark
                        ? 'bg-white/5 text-white/50'
                        : 'bg-slate-100 text-slate-500')
                    )}
                  >
                    {qNum}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
