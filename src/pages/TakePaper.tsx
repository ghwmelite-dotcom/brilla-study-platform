import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  Send,
  AlertTriangle,
  Loader2,
  CheckCircle,
  X,
  BookOpen,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  FileText,
  GraduationCap,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/services/api';
import { cn } from '@/utils';

interface PaperQuestion {
  id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  options: { id: string; text: string }[] | null;
  marks: number;
  section?: string;
  question_number?: number;
}

interface PaperDetails {
  id: string;
  title: string;
  subject_name: string;
  paper_type_name: string;
  year: number;
  total_questions: number;
  total_marks: number;
  time_allowed: number;
  instructions?: string;
  questions: PaperQuestion[];
}

export default function TakePaper() {
  const { paperId } = useParams<{ paperId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  // State
  const [paper, setPaper] = useState<PaperDetails | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(new Set());
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerWarningShown, setTimerWarningShown] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showStartConfirm, setShowStartConfirm] = useState(true);
  const [showQuestionPanel, setShowQuestionPanel] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Load paper details
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!paperId) return;

    const fetchPaper = async () => {
      try {
        setIsLoading(true);
        const paper = await api.get(`/papers/${paperId}`) as PaperDetails;
        if (paper && paper.id) {
          setPaper(paper);
          setTimeRemaining(paper.time_allowed * 60);
        } else {
          setError('Paper not found');
        }
      } catch {
        setError('Failed to load paper');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaper();
  }, [isAuthenticated, paperId, navigate]);

  // Start attempt
  const startAttempt = async () => {
    if (!paperId || !user) return;

    try {
      const result = await api.post(`/papers/${paperId}/attempt`, { userId: user.id }) as { attemptId: string };
      if (result && result.attemptId) {
        setAttemptId(result.attemptId);
        setShowStartConfirm(false);
        setIsTimerRunning(true);
      } else {
        setError('Failed to start attempt - no attempt ID returned');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      if (errorMessage.includes('ongoing attempt')) {
        const resume = window.confirm('You have an ongoing attempt for this paper. Would you like to abandon it and start fresh?');
        if (resume) {
          try {
            await api.post(`/papers/${paperId}/abandon`, { userId: user.id });
            const retryResult = await api.post(`/papers/${paperId}/attempt`, { userId: user.id }) as { attemptId: string };
            if (retryResult && retryResult.attemptId) {
              setAttemptId(retryResult.attemptId);
              setShowStartConfirm(false);
              setIsTimerRunning(true);
              return;
            }
          } catch {
            setError('Failed to restart attempt. Please try again.');
            return;
          }
        }
        return;
      }
      setError(`Failed to start attempt: ${errorMessage}`);
    }
  };

  // Timer
  useEffect(() => {
    if (!isTimerRunning || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Time warning at 5 minutes
  useEffect(() => {
    if (timeRemaining === 300 && !timerWarningShown) {
      setShowTimeWarning(true);
      setTimerWarningShown(true);
      if (soundEnabled) {
        const audio = new Audio('/sounds/warning.mp3');
        audio.play().catch(() => {});
      }
    }
  }, [timeRemaining, timerWarningShown, soundEnabled]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeRemaining === 0 && isTimerRunning) {
      handleSubmit();
    }
  }, [timeRemaining, isTimerRunning]);

  // Prevent accidental navigation
  useEffect(() => {
    if (!showStartConfirm) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = '';
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [showStartConfirm]);

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

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = paper?.questions[currentQuestionIndex];

  const handleAnswerChange = useCallback(
    async (value: string) => {
      if (!currentQuestion || !attemptId || !user) return;

      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
      setAnsweredQuestions((prev) => new Set(prev).add(currentQuestion.id));

      setIsSaving(true);
      try {
        await api.put(`/papers/attempts/${attemptId}/answer`, {
          questionId: currentQuestion.id,
          answer: value,
          userId: user.id,
        });
      } catch (err) {
        console.error('Failed to save answer:', err);
      } finally {
        setIsSaving(false);
      }
    },
    [currentQuestion, attemptId, user]
  );

  const handleMarkForReview = () => {
    if (!currentQuestion) return;
    setMarkedForReview((prev) => {
      const updated = new Set(prev);
      if (updated.has(currentQuestion.id)) {
        updated.delete(currentQuestion.id);
      } else {
        updated.add(currentQuestion.id);
      }
      return updated;
    });
  };

  const handleSubmit = async () => {
    if (!attemptId || !user) return;

    setShowSubmitConfirm(false);
    setIsSubmitting(true);
    setIsTimerRunning(false);

    try {
      const timeUsed = paper ? paper.time_allowed * 60 - timeRemaining : 0;
      await api.post(`/papers/attempts/${attemptId}/submit`, {
        userId: user.id,
        timeUsed,
      });
      navigate(`/past-papers/results/${attemptId}`);
    } catch {
      setError('Failed to submit paper');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExit = () => {
    setShowExitConfirm(false);
    navigate(-1);
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const nextQuestion = () => {
    if (paper && currentQuestionIndex < paper.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const getQuestionStatus = (question: PaperQuestion) => {
    if (markedForReview.has(question.id)) return 'review';
    if (answeredQuestions.has(question.id)) return 'answered';
    return 'unanswered';
  };

  const progress = {
    answered: answeredQuestions.size,
    total: paper?.questions.length || 0,
    percentage:
      paper?.questions.length
        ? Math.round((answeredQuestions.size / paper.questions.length) * 100)
        : 0,
  };

  const isTimeWarning = timeRemaining <= 300 && timeRemaining > 60;
  const isTimeCritical = timeRemaining <= 60;
  const isLastQuestion = paper ? currentQuestionIndex >= paper.questions.length - 1 : false;

  // Loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-white/70">Loading paper...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-2xl p-8 max-w-md text-center border border-white/10">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Error</h2>
          <p className="text-white/60 mb-6">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-indigo-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // No paper found
  if (!paper || paper.questions.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-2xl p-8 max-w-md text-center border border-white/10">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-white/30" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">No Questions Available</h2>
          <p className="text-white/60 mb-6">
            This paper doesn't have any questions yet. Please check back later.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Start confirmation modal
  if (showStartConfirm) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, white 1px, transparent 1px),
                             radial-gradient(circle at 75% 75%, white 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }} />
        </div>

        <div className="relative bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-2xl max-w-lg w-full p-8 border border-white/10 animate-in zoom-in-95 duration-300">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">{paper.subject_name}</h2>
            <p className="text-white/60">
              {paper.paper_type_name} - {paper.year}
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 mb-6 space-y-3 border border-white/10">
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Questions</span>
              <span className="font-medium text-white">{paper.total_questions}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Total Marks</span>
              <span className="font-medium text-white">{paper.total_marks}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Time Allowed</span>
              <span className="font-medium text-white">{paper.time_allowed} minutes</span>
            </div>
          </div>

          {paper.instructions && (
            <div className="mb-6">
              <h3 className="font-medium text-white mb-2">Instructions</h3>
              <p className="text-sm text-white/60">{paper.instructions}</p>
            </div>
          )}

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-6">
            <p className="text-sm text-amber-300">
              <strong>Important:</strong> Once you start, the timer will begin. Make sure you have a
              stable internet connection and enough time to complete the paper.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex-1 py-3.5 px-4 bg-white/5 text-white rounded-xl hover:bg-white/10 font-medium transition-colors border border-white/10"
            >
              Cancel
            </button>
            <button
              onClick={startAttempt}
              className="flex-1 py-3.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 font-medium transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]"
            >
              Start Paper
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, white 1px, transparent 1px),
                           radial-gradient(circle at 75% 75%, white 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }} />
      </div>

      {/* Header */}
      <header className="relative z-10 bg-black/20 backdrop-blur-xl border-b border-white/10">
        <div className="px-4 lg:px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Exit & Title */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowExitConfirm(true)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all group"
              >
                <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              </button>

              <div className="hidden sm:block">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h1 className="font-semibold text-white text-sm lg:text-base line-clamp-1">
                      {paper.subject_name}
                    </h1>
                    <p className="text-xs text-white/50">{paper.paper_type_name} - {paper.year}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Center: Progress */}
            <div className="flex-1 max-w-md mx-4 hidden md:block">
              <div className="flex items-center gap-3">
                <span className="text-xs text-white/50 whitespace-nowrap">
                  {progress.answered}/{progress.total}
                </span>
                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-purple-500 to-indigo-500"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
                <span className="text-xs text-white/50 whitespace-nowrap">
                  {progress.percentage}%
                </span>
              </div>
            </div>

            {/* Right: Timer & Controls */}
            <div className="flex items-center gap-2 lg:gap-3">
              {/* Timer */}
              {timeRemaining > 0 && (
                <div
                  className={cn(
                    'flex items-center gap-2 px-3 lg:px-4 py-2 rounded-xl font-mono font-bold text-sm lg:text-base transition-all',
                    isTimeCritical
                      ? 'bg-red-500/20 text-red-400 animate-pulse'
                      : isTimeWarning
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-white/10 text-white'
                  )}
                >
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(timeRemaining)}</span>
                </div>
              )}

              {/* Saving indicator */}
              {isSaving && (
                <span className="text-xs text-white/50 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Saving
                </span>
              )}

              {/* Control buttons */}
              <div className="hidden lg:flex items-center gap-1">
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all"
                  title={soundEnabled ? 'Mute' : 'Unmute'}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
                <button
                  onClick={toggleFullscreen}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all"
                  title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>

              {/* Submit button */}
              <button
                onClick={() => setShowSubmitConfirm(true)}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:scale-105"
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
        <div className="md:hidden h-1 bg-white/10">
          <div
            className="h-full transition-all duration-500 bg-gradient-to-r from-purple-500 to-indigo-500"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex overflow-hidden">
        {/* Question content */}
        <div className="flex-1 overflow-y-auto">
          <div className="min-h-full p-4 lg:p-8">
            <div className="max-w-4xl mx-auto">
              {/* Question indicator - mobile */}
              <div className="md:hidden mb-4 flex items-center justify-between">
                <span className="text-white/70 text-sm">
                  Question {currentQuestionIndex + 1} of {paper.questions.length}
                </span>
                <button
                  onClick={() => setShowQuestionPanel(true)}
                  className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-sm"
                >
                  View All
                </button>
              </div>

              {/* Main content card */}
              <div className="bg-white/[0.03] backdrop-blur-sm rounded-2xl lg:rounded-3xl border border-white/10 overflow-hidden p-6 lg:p-8">
                {/* Question Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-white/50">
                      Question {currentQuestionIndex + 1}
                      {currentQuestion?.section && ` (Section ${currentQuestion.section})`}
                    </span>
                  </div>
                  <span className="text-sm text-white/50">
                    {currentQuestion?.marks || 1} mark{(currentQuestion?.marks || 1) !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Question Text */}
                <div className="mb-8">
                  <p className="text-lg lg:text-xl text-white leading-relaxed whitespace-pre-wrap">
                    {currentQuestion?.question_text}
                  </p>
                </div>

                {/* Answer Options - Multiple Choice */}
                {currentQuestion?.question_type === 'multiple_choice' && currentQuestion.options && (
                  <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => {
                      const isSelected = answers[currentQuestion.id] === option.text;
                      const letterIndex = String.fromCharCode(65 + index);

                      return (
                        <button
                          key={option.id || index}
                          onClick={() => handleAnswerChange(option.text)}
                          className={cn(
                            'w-full flex items-center gap-4 p-4 lg:p-5 rounded-2xl border-2 text-left transition-all group',
                            !isSelected && 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]',
                            isSelected && 'border-purple-500/50 bg-purple-500/10'
                          )}
                        >
                          <span
                            className={cn(
                              'w-10 h-10 rounded-xl flex items-center justify-center font-semibold text-sm transition-all shrink-0',
                              !isSelected && 'bg-white/10 text-white/70 group-hover:bg-white/20',
                              isSelected && 'bg-purple-500 text-white'
                            )}
                          >
                            {letterIndex}
                          </span>
                          <span className={cn(
                            'flex-1 text-base lg:text-lg',
                            !isSelected && 'text-white/80',
                            isSelected && 'text-white'
                          )}>
                            {option.text}
                          </span>
                          {isSelected && (
                            <CheckCircle className="w-6 h-6 text-purple-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* True/False */}
                {currentQuestion?.question_type === 'true_false' && (
                  <div className="flex gap-4">
                    {['True', 'False'].map((option) => {
                      const isSelected = answers[currentQuestion.id] === option.toLowerCase();

                      return (
                        <button
                          key={option}
                          onClick={() => handleAnswerChange(option.toLowerCase())}
                          className={cn(
                            'flex-1 py-5 rounded-2xl font-semibold text-lg border-2 transition-all',
                            !isSelected && 'border-white/10 bg-white/[0.02] text-white/70 hover:border-white/20 hover:bg-white/[0.05]',
                            isSelected && 'border-purple-500/50 bg-purple-500/10 text-purple-400'
                          )}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Short Answer */}
                {currentQuestion?.question_type === 'short_answer' && (
                  <input
                    type="text"
                    value={answers[currentQuestion.id] || ''}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    placeholder="Type your answer here..."
                    className="w-full px-5 py-4 rounded-2xl border-2 bg-white/[0.02] text-white text-lg placeholder:text-white/30 focus:outline-none border-white/10 focus:border-purple-500/50 focus:bg-white/[0.05] transition-all"
                  />
                )}

                {/* Essay */}
                {currentQuestion?.question_type === 'essay' && (
                  <textarea
                    value={answers[currentQuestion.id] || ''}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    placeholder="Write your answer here..."
                    rows={8}
                    className="w-full px-5 py-4 rounded-2xl border-2 bg-white/[0.02] text-white text-base placeholder:text-white/30 focus:outline-none border-white/10 focus:border-purple-500/50 focus:bg-white/[0.05] transition-all resize-none"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Question Navigator Sidebar - Desktop */}
        <aside className="hidden lg:flex w-72 xl:w-80 bg-black/20 backdrop-blur-xl border-l border-white/10 flex-col">
          <div className="p-4 border-b border-white/10">
            <h3 className="font-semibold text-white text-sm">Question Navigator</h3>
            <p className="text-xs text-white/50 mt-1">
              {progress.answered} of {progress.total} answered
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-5 gap-2">
              {paper.questions.map((q, index) => {
                const status = getQuestionStatus(q);
                const isCurrent = index === currentQuestionIndex;

                return (
                  <button
                    key={q.id}
                    onClick={() => goToQuestion(index)}
                    className={cn(
                      'aspect-square rounded-xl font-medium text-sm transition-all relative',
                      isCurrent && 'ring-2 ring-white ring-offset-2 ring-offset-slate-900',
                      status === 'answered' && !isCurrent && 'bg-emerald-500/20 text-emerald-400',
                      status === 'review' && 'bg-amber-500/20 text-amber-400',
                      status === 'unanswered' && !isCurrent && 'bg-white/5 text-white/50 hover:bg-white/10',
                      isCurrent && 'bg-white text-slate-900'
                    )}
                  >
                    {index + 1}
                    {status === 'review' && (
                      <Flag className="absolute -top-1 -right-1 w-3 h-3 text-amber-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="p-4 border-t border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-4 h-4 rounded bg-emerald-500/20" />
              <span className="text-white/70">Answered</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-4 h-4 rounded bg-amber-500/20" />
              <span className="text-white/70">Marked for Review</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-4 h-4 rounded bg-white/5" />
              <span className="text-white/70">Not Answered</span>
            </div>
          </div>
        </aside>
      </main>

      {/* Bottom Navigation Bar */}
      <footer className="relative z-10 bg-black/20 backdrop-blur-xl border-t border-white/10">
        <div className="px-4 lg:px-6 py-3">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            {/* Previous */}
            <button
              onClick={previousQuestion}
              disabled={currentQuestionIndex === 0}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all',
                currentQuestionIndex === 0
                  ? 'text-white/30 cursor-not-allowed'
                  : 'text-white bg-white/5 hover:bg-white/10'
              )}
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Previous</span>
            </button>

            {/* Mark for Review */}
            <button
              onClick={handleMarkForReview}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all',
                currentQuestion && markedForReview.has(currentQuestion.id)
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'text-white/70 bg-white/5 hover:bg-white/10'
              )}
            >
              <Flag className="w-4 h-4" />
              <span className="hidden sm:inline">
                {currentQuestion && markedForReview.has(currentQuestion.id) ? 'Marked' : 'Mark'}
              </span>
            </button>

            {/* Next / Finish */}
            <button
              onClick={isLastQuestion ? () => setShowSubmitConfirm(true) : nextQuestion}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all',
                'bg-gradient-to-r text-white shadow-lg hover:shadow-xl hover:scale-105',
                isLastQuestion ? 'from-emerald-500 to-teal-500' : 'from-purple-600 to-indigo-600'
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

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowExitConfirm(false)} />
          <div className="relative bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-md w-full border border-white/10 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-white text-center mb-2">
              Exit Paper?
            </h3>
            <p className="text-white/60 text-center mb-6">
              Your progress will be lost. Are you sure you want to exit?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-white/5 text-white font-medium hover:bg-white/10 transition-colors"
              >
                Continue
              </button>
              <button
                onClick={handleExit}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSubmitConfirm(false)} />
          <div className="relative bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-md w-full border border-white/10 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Send className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white text-center mb-2">
              Submit Paper?
            </h3>
            <p className="text-white/60 text-center mb-4">
              {progress.answered < progress.total
                ? `You have ${progress.total - progress.answered} unanswered questions.`
                : 'You have answered all questions.'}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-white/5 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-white">{progress.answered}</p>
                <p className="text-xs text-white/50">Answered</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-white">{progress.total - progress.answered}</p>
                <p className="text-xs text-white/50">Unanswered</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-white/5 text-white font-medium hover:bg-white/10 transition-colors"
              >
                Review
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 font-medium transition-colors flex items-center justify-center gap-2 text-white"
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
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-amber-500/20 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-amber-400 animate-pulse" />
            </div>
            <h3 className="text-xl font-bold text-white text-center mb-2">
              5 Minutes Remaining
            </h3>
            <p className="text-white/60 text-center mb-6">
              You have 5 minutes left to complete and submit your paper.
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
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowQuestionPanel(false)} />
          <div className="absolute inset-x-0 bottom-0 bg-slate-800 rounded-t-3xl border-t border-white/10 p-4 animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4" />
            <h3 className="font-semibold text-white mb-4">Questions</h3>
            <div className="grid grid-cols-6 gap-2 max-h-64 overflow-y-auto pb-4">
              {paper.questions.map((q, index) => {
                const status = getQuestionStatus(q);
                const isCurrent = index === currentQuestionIndex;

                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      goToQuestion(index);
                      setShowQuestionPanel(false);
                    }}
                    className={cn(
                      'aspect-square rounded-xl font-medium text-sm transition-all',
                      isCurrent && 'ring-2 ring-white bg-white text-slate-900',
                      status === 'answered' && !isCurrent && 'bg-emerald-500/20 text-emerald-400',
                      status === 'review' && 'bg-amber-500/20 text-amber-400',
                      status === 'unanswered' && !isCurrent && 'bg-white/5 text-white/50'
                    )}
                  >
                    {index + 1}
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
