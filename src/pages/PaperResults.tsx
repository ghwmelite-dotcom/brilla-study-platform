import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  CheckCircle,
  XCircle,
  Clock,
  Target,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import { cn } from '@/utils';

interface TheoryFeedback {
  score: number;
  maxScore: number;
  perPoint: Array<{ point: string; awarded: number; maxMarks: number; comment: string }>;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

interface AnswerResult {
  id: string;
  question_text: string;
  question_type: string;
  answer_text: string;
  correct_answer: string;
  is_correct: boolean;
  marks: number;
  marks_earned: number;
  explanation?: string;
  marking_status?: 'pending' | 'graded' | 'marking_failed' | null;
  ai_score?: number | null;
  ai_feedback?: string | null;
}

interface AttemptResult {
  id: string;
  paper_id: string;
  paper_title: string;
  subject_name: string;
  paper_type_name: string;
  year: number;
  total_score: number;
  percentage_score: number;
  time_used: number;
  status: string;
  started_at: string;
  submitted_at: string;
  grade?: string | null;
}

export default function PaperResults() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [attempt, setAttempt] = useState<AttemptResult | null>(null);
  const [answers, setAnswers] = useState<AnswerResult[]>([]);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isRemarking, setIsRemarking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!attemptId || !user) return;

    const fetchResults = async () => {
      try {
        setIsLoading(true);
        const response = await api.get<{ attempt: AttemptResult; answers: AnswerResult[] }>(`/papers/attempts/${attemptId}/results?userId=${user.id}`);
        if (response.success && response.data) {
          setAttempt(response.data.attempt);
          setAnswers(response.data.answers || []);
        } else {
          setError('Results not found');
        }
      } catch {
        setError('Failed to load results');
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [attemptId, user]);

  const toggleQuestion = (questionId: string) => {
    setExpandedQuestions((prev) => {
      const updated = new Set(prev);
      if (updated.has(questionId)) {
        updated.delete(questionId);
      } else {
        updated.add(questionId);
      }
      return updated;
    });
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m ${secs}s`;
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  const getGradeBg = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-100';
    if (percentage >= 60) return 'bg-blue-100';
    if (percentage >= 50) return 'bg-amber-100';
    return 'bg-red-100';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-neutral-600">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 max-w-md text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">Error</h2>
          <p className="text-neutral-600 mb-6">{error || 'Results not found'}</p>
          <button
            onClick={() => navigate('/past-papers')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Back to Past Papers
          </button>
        </div>
      </div>
    );
  }

  const correctCount = answers.filter((a) => a.is_correct).length;
  const incorrectCount = answers.filter((a) => !a.is_correct && a.answer_text).length;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <button
            onClick={() => navigate('/past-papers')}
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Past Papers
          </button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 mb-1">
                {attempt.subject_name} - {attempt.paper_type_name}
              </h1>
              <p className="text-neutral-600">{attempt.year}</p>
            </div>

            <div
              className={cn(
                'text-center px-6 py-4 rounded-xl',
                getGradeBg(attempt.percentage_score)
              )}
            >
              <p className={cn('text-4xl font-bold', getGradeColor(attempt.percentage_score))}>
                {attempt.percentage_score}%
              </p>
              {attempt.grade && (
                <p className={cn('text-lg font-semibold mt-1', getGradeColor(attempt.percentage_score))}>
                  Grade {attempt.grade}
                </p>
              )}
              <p className="text-sm text-neutral-600">Score</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">{correctCount}</p>
                <p className="text-xs text-neutral-500">Correct</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">{incorrectCount}</p>
                <p className="text-xs text-neutral-500">Incorrect</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">{attempt.total_score}</p>
                <p className="text-xs text-neutral-500">Points Earned</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">{formatTime(attempt.time_used)}</p>
                <p className="text-xs text-neutral-500">Time Used</p>
              </div>
            </div>
          </div>
        </div>

        {/* Partially graded banner + retry */}
        {attempt.status === 'partially_graded' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <p className="text-sm text-amber-800">
                Some answers are still awaiting AI marking. Retry marking to complete your result.
              </p>
            </div>
            <button
              onClick={async () => {
                setIsRemarking(true);
                try {
                  await api.post(`/papers/attempts/${attemptId}/remark`, {});
                  const response = await api.get<{ attempt: AttemptResult; answers: AnswerResult[] }>(
                    `/papers/attempts/${attemptId}/results?userId=${user?.id}`,
                  );
                  if (response.success && response.data) {
                    setAttempt(response.data.attempt);
                    setAnswers(response.data.answers || []);
                  }
                } finally {
                  setIsRemarking(false);
                }
              }}
              disabled={isRemarking}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 text-sm font-medium"
            >
              {isRemarking ? 'Marking…' : 'Retry marking'}
            </button>
          </div>
        )}

        {/* Question Review */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200">
            <h2 className="text-lg font-semibold text-neutral-900">Question Review</h2>
            <p className="text-sm text-neutral-500">Click on a question to see the explanation</p>
          </div>

          <div className="divide-y divide-neutral-100">
            {answers.map((answer, index) => (
              <div key={answer.id} className="hover:bg-neutral-50">
                <button
                  onClick={() => toggleQuestion(answer.id)}
                  className="w-full px-6 py-4 flex items-center gap-4 text-left"
                >
                  <span
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0',
                      answer.is_correct
                        ? 'bg-green-100 text-green-700'
                        : answer.answer_text
                        ? 'bg-red-100 text-red-700'
                        : 'bg-neutral-100 text-neutral-500'
                    )}
                  >
                    {index + 1}
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neutral-900 line-clamp-2">{answer.question_text}</p>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-sm text-neutral-500">
                      {answer.marks_earned || 0}/{answer.marks} marks
                    </span>
                    {answer.is_correct ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : answer.answer_text ? (
                      <XCircle className="w-5 h-5 text-red-600" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-neutral-300" />
                    )}
                    {expandedQuestions.has(answer.id) ? (
                      <ChevronUp className="w-5 h-5 text-neutral-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-neutral-400" />
                    )}
                  </div>
                </button>

                {expandedQuestions.has(answer.id) && (
                  <div className="px-6 pb-4 ml-12 space-y-3">
                    <div>
                      <p className="text-xs font-medium text-neutral-500 mb-1">Your Answer</p>
                      <p
                        className={cn(
                          'text-sm p-2 rounded',
                          answer.is_correct
                            ? 'bg-green-50 text-green-800'
                            : answer.answer_text
                            ? 'bg-red-50 text-red-800'
                            : 'bg-neutral-100 text-neutral-500 italic'
                        )}
                      >
                        {answer.answer_text || 'Not answered'}
                      </p>
                    </div>

                    {!answer.is_correct && answer.correct_answer && (
                      <div>
                        <p className="text-xs font-medium text-neutral-500 mb-1">Correct Answer</p>
                        <p className="text-sm p-2 rounded bg-green-50 text-green-800">
                          {answer.correct_answer}
                        </p>
                      </div>
                    )}

                    {answer.explanation && (
                      <div>
                        <p className="text-xs font-medium text-neutral-500 mb-1">Explanation</p>
                        <p className="text-sm p-2 rounded bg-blue-50 text-blue-800">
                          {answer.explanation}
                        </p>
                      </div>
                    )}

                    {answer.marking_status === 'graded' && answer.ai_feedback && (() => {
                      try {
                        const feedback = JSON.parse(answer.ai_feedback) as TheoryFeedback;
                        return (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-neutral-500">
                              AI marking ({feedback.score}/{feedback.maxScore}) — advisory, not an official WAEC result
                            </p>
                            <p className="text-sm p-2 rounded bg-indigo-50 text-indigo-900">{feedback.feedback}</p>
                            {feedback.perPoint.map((p, i) => (
                              <div key={i} className="flex items-start justify-between text-sm p-2 rounded bg-neutral-50">
                                <span className="text-neutral-700">{p.point} — {p.comment}</span>
                                <span className="text-neutral-500 flex-shrink-0 ml-3">{p.awarded}/{p.maxMarks}</span>
                              </div>
                            ))}
                            {feedback.improvements.length > 0 && (
                              <p className="text-sm text-neutral-600">
                                To improve: {feedback.improvements.join('; ')}
                              </p>
                            )}
                          </div>
                        );
                      } catch {
                        return null;
                      }
                    })()}
                    {answer.marking_status === 'pending' && (
                      <p className="text-sm p-2 rounded bg-neutral-100 text-neutral-500 italic">
                        Awaiting AI marking — retry marking below to complete this answer.
                      </p>
                    )}
                    {answer.marking_status === 'marking_failed' && (
                      <p className="text-sm p-2 rounded bg-red-50 text-red-700">
                        Marking failed for this answer. Retry marking — retries of failed markings are free.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-4 mt-8">
          <button
            onClick={() => navigate('/past-papers')}
            className="px-6 py-3 border border-neutral-300 text-neutral-700 rounded-xl hover:bg-neutral-50 font-medium"
          >
            <BookOpen className="w-4 h-4 inline mr-2" />
            Try Another Paper
          </button>
        </div>
      </div>
    </div>
  );
}
