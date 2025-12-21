import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Award,
  FileText,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Trophy,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useStudentAssessmentStore } from '@/stores/studentAssessmentStore';
import { cn } from '@/utils';

export default function AssessmentResults() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { lastResult, isLoading, error, fetchAttemptResults } = useStudentAssessmentStore();

  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    if (!id) return;

    // Fetch results - assuming we get attemptId from URL or lastResult
    // In a real app, you'd get the attemptId from the assessment
    // For now, we use the lastResult if available
  }, [isAuthenticated, id, navigate]);

  const toggleQuestion = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  const formatTime = (seconds?: number) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  const getGradeLabel = (percentage: number) => {
    if (percentage >= 80) return 'Excellent';
    if (percentage >= 60) return 'Good';
    if (percentage >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error || !lastResult) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">
            Results Not Available
          </h2>
          <p className="text-neutral-600 mb-6">
            {error || 'The results for this assessment are not yet available.'}
          </p>
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

  const percentage = lastResult.percentage || 0;
  const passed = lastResult.assessment?.passingScore
    ? percentage >= lastResult.assessment.passingScore
    : true;

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <button
          onClick={() => navigate('/assessments')}
          className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Assessments</span>
        </button>

        {/* Score Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div
            className={cn(
              'p-8 text-center text-white',
              passed
                ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                : 'bg-gradient-to-br from-amber-500 to-orange-600'
            )}
          >
            <div className="flex justify-center mb-4">
              {passed ? (
                <Trophy className="w-16 h-16" />
              ) : (
                <AlertCircle className="w-16 h-16" />
              )}
            </div>
            <h1 className="text-3xl font-bold mb-2">
              {lastResult.assessment?.title || 'Assessment'}
            </h1>
            <p className="text-white/80">
              {passed ? 'Congratulations! You passed!' : 'Keep practicing!'}
            </p>
          </div>

          <div className="p-6">
            {/* Score Display */}
            <div className="flex items-center justify-center gap-8 mb-6">
              <div className="text-center">
                <p className={cn('text-5xl font-bold', getGradeColor(percentage))}>
                  {percentage}%
                </p>
                <p className="text-neutral-500 mt-1">{getGradeLabel(percentage)}</p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-neutral-50 rounded-xl p-4 text-center">
                <Award className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-neutral-900">
                  {lastResult.totalScore}/{lastResult.maxScore}
                </p>
                <p className="text-sm text-neutral-500">Score</p>
              </div>

              <div className="bg-neutral-50 rounded-xl p-4 text-center">
                <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-neutral-900">
                  {lastResult.answers?.filter((a) => a.isCorrect).length || 0}
                </p>
                <p className="text-sm text-neutral-500">Correct</p>
              </div>

              <div className="bg-neutral-50 rounded-xl p-4 text-center">
                <XCircle className="w-6 h-6 text-red-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-neutral-900">
                  {lastResult.answers?.filter((a) => !a.isCorrect).length || 0}
                </p>
                <p className="text-sm text-neutral-500">Incorrect</p>
              </div>

              <div className="bg-neutral-50 rounded-xl p-4 text-center">
                <Clock className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-neutral-900">
                  {formatTime(lastResult.timeTaken)}
                </p>
                <p className="text-sm text-neutral-500">Time Taken</p>
              </div>
            </div>
          </div>
        </div>

        {/* Teacher Feedback */}
        {lastResult.teacherFeedback && (
          <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-8">
            <h2 className="font-semibold text-neutral-900 mb-3">Teacher Feedback</h2>
            <p className="text-neutral-600">{lastResult.teacherFeedback}</p>
          </div>
        )}

        {/* Question Review */}
        {lastResult.assessment?.showCorrectAnswers && lastResult.answers && (
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <div className="p-4 border-b border-neutral-200">
              <h2 className="font-semibold text-neutral-900">Question Review</h2>
            </div>

            <div className="divide-y divide-neutral-100">
              {lastResult.answers.map((answer, index) => {
                const isExpanded = expandedQuestions.has(answer.id);
                return (
                  <div key={answer.id} className="p-4">
                    <button
                      onClick={() => toggleQuestion(answer.id)}
                      className="w-full flex items-start gap-3 text-left"
                    >
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                          answer.isCorrect
                            ? 'bg-green-100 text-green-600'
                            : 'bg-red-100 text-red-600'
                        )}
                      >
                        {answer.isCorrect ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <XCircle className="w-5 h-5" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-neutral-900">
                          Question {index + 1}
                        </p>
                        <p className="text-sm text-neutral-500">
                          {answer.autoMarks || answer.manualMarks || 0} marks
                        </p>
                      </div>

                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-neutral-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-neutral-400" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="mt-4 pl-11 space-y-3">
                        <div>
                          <p className="text-sm text-neutral-500">Your Answer:</p>
                          <p className="text-neutral-900">
                            {answer.answerText || 'No answer provided'}
                          </p>
                        </div>

                        {!answer.isCorrect && (
                          <div>
                            <p className="text-sm text-neutral-500">Correct Answer:</p>
                            <p className="text-green-600">
                              {/* This would come from the question data */}
                              Correct answer would be shown here
                            </p>
                          </div>
                        )}

                        {answer.teacherComment && (
                          <div className="bg-neutral-50 rounded-lg p-3">
                            <p className="text-sm text-neutral-500">Teacher Comment:</p>
                            <p className="text-neutral-700">{answer.teacherComment}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-center gap-4 mt-8">
          <button
            onClick={() => navigate('/assessments')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium"
          >
            Back to Assessments
          </button>
          {lastResult.assessment?.maxAttempts &&
            lastResult.attemptNumber < lastResult.assessment.maxAttempts && (
              <button
                onClick={() => navigate(`/assessments/${id}/take`)}
                className="px-6 py-3 bg-white border border-neutral-300 text-neutral-700 rounded-xl hover:bg-neutral-50 font-medium"
              >
                Retry Assessment
              </button>
            )}
        </div>
      </div>
    </div>
  );
}
