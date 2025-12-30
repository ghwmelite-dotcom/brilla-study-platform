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
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/services/api';
import { ConfirmModal } from '@/components/common/Modal';
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
        // api.get returns unwrapped data directly
        const paper = await api.get(`/papers/${paperId}`) as PaperDetails;
        if (paper && paper.id) {
          setPaper(paper);
          setTimeRemaining(paper.time_allowed * 60);
        } else {
          setError('Paper not found');
        }
      } catch (err) {
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
      // api.post returns unwrapped data directly
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
      // Check if it's an existing attempt error and offer to resume
      if (errorMessage.includes('ongoing attempt')) {
        const resume = window.confirm('You have an ongoing attempt for this paper. Would you like to abandon it and start fresh?');
        if (resume) {
          // Abandon existing attempt and try again
          try {
            await api.post(`/papers/${paperId}/abandon`, { userId: user.id });
            // Retry starting the attempt
            const retryResult = await api.post(`/papers/${paperId}/attempt`, { userId: user.id }) as { attemptId: string };
            if (retryResult && retryResult.attemptId) {
              setAttemptId(retryResult.attemptId);
              setShowStartConfirm(false);
              setIsTimerRunning(true);
              return;
            }
          } catch (retryErr) {
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
    }
  }, [timeRemaining, timerWarningShown]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeRemaining === 0 && isTimerRunning) {
      handleSubmit();
    }
  }, [timeRemaining, isTimerRunning]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = paper?.questions[currentQuestionIndex];

  const handleAnswerChange = useCallback(
    async (value: string) => {
      if (!currentQuestion || !attemptId || !user) return;

      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
      setAnsweredQuestions((prev) => new Set(prev).add(currentQuestion.id));

      // Save to server
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
      // api.post returns unwrapped data directly
      await api.post(`/papers/attempts/${attemptId}/submit`, {
        userId: user.id,
        timeUsed,
      });
      navigate(`/past-papers/results/${attemptId}`);
    } catch (err) {
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

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-neutral-600">Loading paper...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 max-w-md text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">Error</h2>
          <p className="text-neutral-600 mb-6">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
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
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 max-w-md text-center">
          <BookOpen className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">No Questions Available</h2>
          <p className="text-neutral-600 mb-6">
            This paper doesn't have any questions yet. Please check back later.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
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
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">{paper.subject_name}</h2>
            <p className="text-neutral-600">
              {paper.paper_type_name} - {paper.year}
            </p>
          </div>

          <div className="bg-neutral-50 rounded-xl p-4 mb-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Questions</span>
              <span className="font-medium text-neutral-900">{paper.total_questions}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Total Marks</span>
              <span className="font-medium text-neutral-900">{paper.total_marks}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Time Allowed</span>
              <span className="font-medium text-neutral-900">{paper.time_allowed} minutes</span>
            </div>
          </div>

          {paper.instructions && (
            <div className="mb-6">
              <h3 className="font-medium text-neutral-900 mb-2">Instructions</h3>
              <p className="text-sm text-neutral-600">{paper.instructions}</p>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-amber-800">
              <strong>Important:</strong> Once you start, the timer will begin. Make sure you have a
              stable internet connection and enough time to complete the paper.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex-1 py-3 px-4 border border-neutral-300 text-neutral-700 rounded-xl hover:bg-neutral-50 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={startAttempt}
              className="flex-1 py-3 px-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium"
            >
              Start Paper
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowExitConfirm(true)}
                className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
              <div>
                <h1 className="font-semibold text-neutral-900 line-clamp-1">
                  {paper.subject_name} - {paper.paper_type_name}
                </h1>
                <p className="text-sm text-neutral-500">
                  Question {currentQuestionIndex + 1} of {paper.questions.length}
                </p>
              </div>
            </div>

            {/* Timer */}
            {timeRemaining > 0 && (
              <div
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg font-mono font-medium',
                  timeRemaining <= 300
                    ? 'bg-red-100 text-red-700'
                    : 'bg-neutral-100 text-neutral-700'
                )}
              >
                <Clock className="w-4 h-4" />
                {formatTime(timeRemaining)}
              </div>
            )}

            {/* Saving indicator */}
            {isSaving && (
              <span className="text-sm text-neutral-500 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Saving...
              </span>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-neutral-200">
          <div
            className="h-full bg-indigo-500 transition-all"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-3xl mx-auto">
            {/* Question Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              {/* Question Header */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-indigo-600">
                  Question {currentQuestionIndex + 1}
                  {currentQuestion?.section && ` (Section ${currentQuestion.section})`}
                </span>
                <span className="text-sm text-neutral-500">
                  {currentQuestion?.marks || 1} mark{(currentQuestion?.marks || 1) !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Question Text */}
              <p className="text-lg text-neutral-900 mb-6 leading-relaxed whitespace-pre-wrap">
                {currentQuestion?.question_text}
              </p>

              {/* Answer Options */}
              {currentQuestion?.question_type === 'multiple_choice' && currentQuestion.options && (
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => (
                    <button
                      key={option.id || index}
                      onClick={() => handleAnswerChange(option.text)}
                      className={cn(
                        'w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all',
                        answers[currentQuestion.id] === option.text
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-neutral-200 hover:border-neutral-300'
                      )}
                    >
                      <span
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0',
                          answers[currentQuestion.id] === option.text
                            ? 'bg-indigo-500 text-white'
                            : 'bg-neutral-100 text-neutral-600'
                        )}
                      >
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="flex-1">{option.text}</span>
                      {answers[currentQuestion.id] === option.text && (
                        <CheckCircle className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {currentQuestion?.question_type === 'true_false' && (
                <div className="flex gap-4">
                  {['True', 'False'].map((option) => (
                    <button
                      key={option}
                      onClick={() => handleAnswerChange(option.toLowerCase())}
                      className={cn(
                        'flex-1 py-4 rounded-xl border-2 font-medium transition-all',
                        answers[currentQuestion.id] === option.toLowerCase()
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-neutral-200 hover:border-neutral-300'
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}

              {currentQuestion?.question_type === 'short_answer' && (
                <input
                  type="text"
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              )}

              {currentQuestion?.question_type === 'essay' && (
                <textarea
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  placeholder="Write your answer here..."
                  rows={8}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                />
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={previousQuestion}
                disabled={currentQuestionIndex === 0}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors',
                  currentQuestionIndex === 0
                    ? 'text-neutral-400 cursor-not-allowed'
                    : 'text-neutral-700 hover:bg-white'
                )}
              >
                <ChevronLeft className="w-5 h-5" />
                Previous
              </button>

              <button
                onClick={handleMarkForReview}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors',
                  currentQuestion && markedForReview.has(currentQuestion.id)
                    ? 'bg-amber-100 text-amber-700'
                    : 'text-neutral-600 hover:bg-white'
                )}
              >
                <Flag className="w-4 h-4" />
                {currentQuestion && markedForReview.has(currentQuestion.id) ? 'Marked' : 'Mark for Review'}
              </button>

              {currentQuestionIndex < paper.questions.length - 1 ? (
                <button
                  onClick={nextQuestion}
                  className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                >
                  Next
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={() => setShowSubmitConfirm(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  <Send className="w-4 h-4" />
                  Submit
                </button>
              )}
            </div>
          </div>
        </main>

        {/* Question Navigator Sidebar */}
        <aside className="hidden lg:block w-72 bg-white border-l border-neutral-200 p-4">
          <h3 className="font-semibold text-neutral-900 mb-4">Questions</h3>

          <div className="grid grid-cols-5 gap-2 mb-6">
            {paper.questions.map((q, index) => {
              const status = getQuestionStatus(q);
              return (
                <button
                  key={q.id}
                  onClick={() => goToQuestion(index)}
                  className={cn(
                    'w-10 h-10 rounded-lg font-medium text-sm transition-colors',
                    index === currentQuestionIndex && 'ring-2 ring-indigo-500',
                    status === 'answered' && 'bg-green-100 text-green-700',
                    status === 'review' && 'bg-amber-100 text-amber-700',
                    status === 'unanswered' && 'bg-neutral-100 text-neutral-600'
                  )}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 rounded" />
              <span className="text-neutral-600">Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-amber-100 rounded" />
              <span className="text-neutral-600">Marked for review</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-neutral-100 rounded" />
              <span className="text-neutral-600">Not answered</span>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-6 pt-6 border-t border-neutral-200">
            <p className="text-sm text-neutral-600 mb-2">
              Progress: {progress.answered}/{progress.total} answered
            </p>
            <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 transition-all"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={() => setShowSubmitConfirm(true)}
            disabled={isSubmitting}
            className="w-full mt-6 flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Paper
              </>
            )}
          </button>
        </aside>
      </div>

      {/* Submit Confirmation Modal */}
      <ConfirmModal
        isOpen={showSubmitConfirm}
        onClose={() => setShowSubmitConfirm(false)}
        onConfirm={handleSubmit}
        title="Submit Paper?"
        message={
          progress.answered < progress.total
            ? `You have ${progress.total - progress.answered} unanswered questions. Are you sure you want to submit?`
            : 'Are you sure you want to submit? You cannot change your answers after submission.'
        }
        confirmText="Submit"
        isLoading={isSubmitting}
      />

      {/* Time Warning Modal */}
      {showTimeWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-sm w-full text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              5 Minutes Remaining
            </h3>
            <p className="text-neutral-600 mb-6">
              You have 5 minutes left to complete and submit your paper.
            </p>
            <button
              onClick={() => setShowTimeWarning(false)}
              className="w-full py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Exit Confirmation */}
      <ConfirmModal
        isOpen={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        onConfirm={handleExit}
        title="Exit Paper?"
        message="Your progress will be lost. Are you sure you want to exit?"
        confirmText="Exit"
        variant="danger"
      />
    </div>
  );
}
