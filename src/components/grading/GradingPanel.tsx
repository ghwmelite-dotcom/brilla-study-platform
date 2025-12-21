import { useState } from 'react';
import {
  X,
  User,
  Clock,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Send,
  Loader2,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { useGradingStore } from '@/stores/gradingStore';
import { AnswerGrader } from './AnswerGrader';
import { cn } from '@/utils';

interface GradingPanelProps {
  onClose: () => void;
}

export function GradingPanel({ onClose }: GradingPanelProps) {
  const {
    currentAttempt,
    currentAnswers,
    isSaving,
    error,
    completeGrading,
    autoGradeObjectives,
    clearError,
  } = useGradingStore();

  const [currentAnswerIndex, setCurrentAnswerIndex] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isCompleting, setIsCompleting] = useState(false);
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);

  if (!currentAttempt) {
    return null;
  }

  const currentAnswer = currentAnswers[currentAnswerIndex];
  const gradedCount = currentAnswers.filter(
    (a) => a.manualMarks !== null || a.autoMarks > 0
  ).length;
  const totalMarks = currentAnswers.reduce(
    (sum, a) => sum + (a.manualMarks ?? a.autoMarks ?? 0),
    0
  );

  const handleAutoGrade = async () => {
    await autoGradeObjectives(currentAttempt.id);
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      await completeGrading(currentAttempt.id, feedback || undefined);
      onClose();
    } catch (error) {
      console.error('Failed to complete grading:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  const canComplete = gradedCount === currentAnswers.length;

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
              <div>
                <h1 className="font-semibold text-neutral-900">
                  {currentAttempt.assessment?.title || 'Grading'}
                </h1>
                <div className="flex items-center gap-3 text-sm text-neutral-500">
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {currentAttempt.student?.name || 'Student'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {currentAnswerIndex + 1} of {currentAnswers.length}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Auto-grade button */}
              <button
                onClick={handleAutoGrade}
                disabled={isSaving}
                className="flex items-center gap-2 px-3 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                <Zap className="w-4 h-4" />
                <span className="text-sm font-medium">Auto-grade MCQs</span>
              </button>

              {/* Score Display */}
              <div className="px-4 py-2 bg-neutral-100 rounded-lg">
                <span className="font-semibold text-neutral-900">
                  {totalMarks}/{currentAttempt.maxScore}
                </span>
                <span className="text-neutral-500 ml-1 text-sm">marks</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-neutral-200">
          <div
            className="h-full bg-purple-500 transition-all"
            style={{
              width: `${(gradedCount / currentAnswers.length) * 100}%`,
            }}
          />
        </div>
      </header>

      {/* Error */}
      {error && (
        <div className="max-w-6xl mx-auto px-4 pt-4">
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
            <p className="text-red-700 text-sm">{error}</p>
            <button onClick={clearError} className="text-red-500">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {currentAnswer && (
            <AnswerGrader
              answer={currentAnswer}
              questionNumber={currentAnswerIndex + 1}
            />
          )}
        </div>
      </main>

      {/* Footer Navigation */}
      <footer className="bg-white border-t border-neutral-200 sticky bottom-0">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentAnswerIndex(Math.max(0, currentAnswerIndex - 1))}
                disabled={currentAnswerIndex === 0}
                className="flex items-center gap-1 px-3 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5" />
                Previous
              </button>
              <button
                onClick={() =>
                  setCurrentAnswerIndex(
                    Math.min(currentAnswers.length - 1, currentAnswerIndex + 1)
                  )
                }
                disabled={currentAnswerIndex === currentAnswers.length - 1}
                className="flex items-center gap-1 px-3 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg disabled:opacity-50"
              >
                Next
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Question Navigator */}
            <div className="flex items-center gap-1.5">
              {currentAnswers.map((answer, index) => {
                const isGraded =
                  answer.manualMarks !== null || answer.autoMarks > 0;
                return (
                  <button
                    key={answer.id}
                    onClick={() => setCurrentAnswerIndex(index)}
                    className={cn(
                      'w-8 h-8 rounded-lg text-sm font-medium transition-colors',
                      index === currentAnswerIndex && 'ring-2 ring-purple-500',
                      isGraded
                        ? 'bg-green-100 text-green-700'
                        : 'bg-neutral-100 text-neutral-600'
                    )}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>

            {/* Complete */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFeedbackInput(!showFeedbackInput)}
                className="flex items-center gap-2 px-3 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg"
              >
                <MessageSquare className="w-4 h-4" />
                Feedback
              </button>

              <button
                onClick={handleComplete}
                disabled={!canComplete || isCompleting}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
                  canComplete && !isCompleting
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                )}
              >
                {isCompleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Completing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Complete Grading
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Feedback Input */}
          {showFeedbackInput && (
            <div className="mt-4 pt-4 border-t border-neutral-200">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Overall Feedback for Student
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Write feedback that will be shown to the student..."
                rows={3}
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-none"
              />
            </div>
          )}

          {/* Completion Warning */}
          {!canComplete && (
            <div className="mt-4 flex items-center gap-2 text-amber-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>
                {currentAnswers.length - gradedCount} answer
                {currentAnswers.length - gradedCount !== 1 ? 's' : ''} still need grading
              </span>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
