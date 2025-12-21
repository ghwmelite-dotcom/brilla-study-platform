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
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useStudentAssessmentStore } from '@/stores/studentAssessmentStore';
import type { AssessmentQuestion } from '@/types';
import { ConfirmModal } from '@/components/common/Modal';
import { cn } from '@/utils';

export default function TakeAssessment() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const {
    currentAssessment,
    currentQuestions,
    currentQuestionIndex,
    answers,
    answeredQuestions,
    markedForReview,
    timeRemaining,
    isTimerRunning,
    timerWarningShown,
    isLoading,
    isSaving,
    isSubmitting,
    error,
    fetchAssessmentDetails,
    startAttempt,
    saveAnswer,
    markForReview,
    goToQuestion,
    nextQuestion,
    previousQuestion,
    decrementTimer,
    setTimerWarningShown,
    submitAttempt,
    clearCurrentAssessment,
  } = useStudentAssessmentStore();

  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Load assessment and start attempt
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    if (!id) return;

    const init = async () => {
      const assessment = await fetchAssessmentDetails(id);
      if (assessment) {
        await startAttempt(id);
      }
    };

    init();

    return () => {
      // Don't clear if navigating to results
    };
  }, [isAuthenticated, id, navigate, fetchAssessmentDetails, startAttempt]);

  // Timer
  useEffect(() => {
    if (!isTimerRunning || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      decrementTimer();
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning, decrementTimer]);

  // Time warning at 5 minutes
  useEffect(() => {
    if (timeRemaining === 300 && !timerWarningShown) {
      setShowTimeWarning(true);
      setTimerWarningShown(true);
    }
  }, [timeRemaining, timerWarningShown, setTimerWarningShown]);

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

  const currentQuestion = currentQuestions[currentQuestionIndex];

  const handleAnswerChange = useCallback(
    (value: string) => {
      if (currentQuestion) {
        saveAnswer(currentQuestion.id, value);
      }
    },
    [currentQuestion, saveAnswer]
  );

  const handleMarkForReview = () => {
    if (currentQuestion) {
      const isMarked = markedForReview.has(currentQuestion.id);
      markForReview(currentQuestion.id, !isMarked);
    }
  };

  const handleSubmit = async () => {
    setShowSubmitConfirm(false);
    const result = await submitAttempt();
    if (result) {
      navigate(`/assessments/${id}/results`);
    }
  };

  const handleExit = () => {
    setShowExitConfirm(false);
    clearCurrentAssessment();
    navigate('/assessments');
  };

  const getQuestionStatus = (question: AssessmentQuestion) => {
    if (markedForReview.has(question.id)) return 'review';
    if (answeredQuestions.has(question.id)) return 'answered';
    return 'unanswered';
  };

  const progress = {
    answered: answeredQuestions.size,
    total: currentQuestions.length,
    percentage:
      currentQuestions.length > 0
        ? Math.round((answeredQuestions.size / currentQuestions.length) * 100)
        : 0,
  };

  if (isLoading && !currentAssessment) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-neutral-600">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 max-w-md text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">Error</h2>
          <p className="text-neutral-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/assessments')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Back to Assessments
          </button>
        </div>
      </div>
    );
  }

  if (!currentAssessment || !currentQuestion) {
    return null;
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
                  {currentAssessment.title}
                </h1>
                <p className="text-sm text-neutral-500">
                  Question {currentQuestionIndex + 1} of {currentQuestions.length}
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
                </span>
                <span className="text-sm text-neutral-500">
                  {currentQuestion.marks} mark{currentQuestion.marks !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Question Text */}
              <p className="text-lg text-neutral-900 mb-6 leading-relaxed">
                {currentQuestion.customQuestionText || currentQuestion.question?.questionText}
              </p>

              {/* Answer Options */}
              {currentQuestion.customQuestionType === 'multiple_choice' && (
                <div className="space-y-3">
                  {currentQuestion.customOptions?.map((option, index) => (
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
                          'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                          answers[currentQuestion.id] === option.text
                            ? 'bg-indigo-500 text-white'
                            : 'bg-neutral-100 text-neutral-600'
                        )}
                      >
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="flex-1">{option.text}</span>
                      {answers[currentQuestion.id] === option.text && (
                        <CheckCircle className="w-5 h-5 text-indigo-500" />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {currentQuestion.customQuestionType === 'true_false' && (
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

              {(currentQuestion.customQuestionType === 'short_answer' ||
                currentQuestion.customQuestionType === 'direct_answer') && (
                <input
                  type="text"
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              )}

              {currentQuestion.customQuestionType === 'essay' && (
                <textarea
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  placeholder="Write your essay answer here..."
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
                  markedForReview.has(currentQuestion.id)
                    ? 'bg-amber-100 text-amber-700'
                    : 'text-neutral-600 hover:bg-white'
                )}
              >
                <Flag className="w-4 h-4" />
                {markedForReview.has(currentQuestion.id) ? 'Marked' : 'Mark for Review'}
              </button>

              {currentQuestionIndex < currentQuestions.length - 1 ? (
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
            {currentQuestions.map((q, index) => {
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
                Submit Assessment
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
        title="Submit Assessment?"
        message={
          progress.answered < progress.total
            ? `You have ${progress.total - progress.answered} unanswered questions. Are you sure you want to submit?`
            : 'Are you sure you want to submit your assessment? You cannot change your answers after submission.'
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
              You have 5 minutes left to complete and submit your assessment.
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
        title="Exit Assessment?"
        message="Your progress will be saved, but you'll need to continue later. Are you sure you want to exit?"
        confirmText="Exit"
        variant="danger"
      />
    </div>
  );
}
