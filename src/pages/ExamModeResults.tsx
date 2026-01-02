import { useLocation, useNavigate } from 'react-router-dom';
import {
  Trophy,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  Home,
  Share2,
  Zap,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/utils';

interface PracticeResult {
  questionId: string;
  isCorrect: boolean;
  answer: string;
  timeTaken: number;
}

interface ResultsState {
  mode: string;
  totalQuestions: number;
  correctCount: number;
  totalTime: number;
  score: number;
  results: PracticeResult[];
}

export default function ExamModeResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as ResultsState | undefined;

  if (!state) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/70 mb-4">No results to display</p>
          <button
            onClick={() => navigate('/practice')}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium"
          >
            Back to Practice
          </button>
        </div>
      </div>
    );
  }

  const { mode, totalQuestions, correctCount, totalTime, score, results } = state;
  const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const avgTimePerQuestion = totalQuestions > 0 ? Math.round(totalTime / totalQuestions) : 0;

  // Performance rating
  const getPerformanceRating = () => {
    if (accuracy >= 90) return { label: 'Excellent!', color: 'text-emerald-400', bg: 'bg-emerald-500/20' };
    if (accuracy >= 70) return { label: 'Great Job!', color: 'text-blue-400', bg: 'bg-blue-500/20' };
    if (accuracy >= 50) return { label: 'Good Effort!', color: 'text-amber-400', bg: 'bg-amber-500/20' };
    return { label: 'Keep Practicing!', color: 'text-orange-400', bg: 'bg-orange-500/20' };
  };

  const performance = getPerformanceRating();

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-y-auto">
      {/* Animated background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, white 1px, transparent 1px),
                           radial-gradient(circle at 75% 75%, white 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }} />
      </div>

      <div className="relative z-10 min-h-full flex flex-col items-center justify-center p-4 py-12">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            {/* Trophy Animation */}
            <div className={cn(
              'w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6',
              performance.bg,
              'animate-in zoom-in-50 duration-500'
            )}>
              <Trophy className={cn('w-12 h-12', performance.color)} />
            </div>

            <h1 className={cn(
              'text-3xl lg:text-4xl font-bold mb-2',
              performance.color,
              'animate-in slide-in-from-bottom duration-500 delay-100'
            )}>
              {performance.label}
            </h1>
            <p className="text-white/60 animate-in slide-in-from-bottom duration-500 delay-150">
              {mode === 'speed' ? 'Speed Race' : 'Topic Drill'} Complete
            </p>
          </div>

          {/* Score Circle */}
          <div className="relative w-48 h-48 mx-auto mb-8 animate-in zoom-in-75 duration-700 delay-200">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="8"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke={accuracy >= 70 ? '#10b981' : accuracy >= 50 ? '#f59e0b' : '#ef4444'}
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={283}
                strokeDashoffset={283 - (283 * accuracy) / 100}
                className="transition-all duration-1000 delay-500"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-bold text-white">{accuracy}%</span>
              <span className="text-white/50 text-sm">Accuracy</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 animate-in slide-in-from-bottom duration-500 delay-300">
              <div className="flex items-center gap-2 text-emerald-400 mb-2">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs font-medium">Correct</span>
              </div>
              <p className="text-2xl font-bold text-white">{correctCount}</p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 animate-in slide-in-from-bottom duration-500 delay-350">
              <div className="flex items-center gap-2 text-red-400 mb-2">
                <XCircle className="w-4 h-4" />
                <span className="text-xs font-medium">Incorrect</span>
              </div>
              <p className="text-2xl font-bold text-white">{totalQuestions - correctCount}</p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 animate-in slide-in-from-bottom duration-500 delay-400">
              <div className="flex items-center gap-2 text-blue-400 mb-2">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-medium">Total Time</span>
              </div>
              <p className="text-2xl font-bold text-white">{formatTime(totalTime)}</p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 animate-in slide-in-from-bottom duration-500 delay-450">
              <div className="flex items-center gap-2 text-amber-400 mb-2">
                <Zap className="w-4 h-4" />
                <span className="text-xs font-medium">Score</span>
              </div>
              <p className="text-2xl font-bold text-white">{score}</p>
            </div>
          </div>

          {/* Performance Insights */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 mb-8 animate-in slide-in-from-bottom duration-500 delay-500">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              Performance Insights
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/60">Average time per question</span>
                <span className="text-white font-medium">{avgTimePerQuestion}s</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60">Questions attempted</span>
                <span className="text-white font-medium">{results.length}/{totalQuestions}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60">Points earned</span>
                <span className="text-white font-medium">{score} pts</span>
              </div>
            </div>
          </div>

          {/* Question Review Summary */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 mb-8 animate-in slide-in-from-bottom duration-500 delay-550">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-400" />
              Question Summary
            </h3>
            <div className="flex flex-wrap gap-2">
              {results.map((result, index) => (
                <div
                  key={result.questionId}
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center font-medium text-sm',
                    result.isCorrect
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-red-500/20 text-red-400'
                  )}
                >
                  {index + 1}
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 animate-in slide-in-from-bottom duration-500 delay-600">
            <button
              onClick={() => navigate('/practice')}
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-white/5 text-white font-medium hover:bg-white/10 transition-colors border border-white/10"
            >
              <Home className="w-5 h-5" />
              Back to Practice
            </button>
            <button
              onClick={() => {
                navigate(`/exam/practice?mode=${mode}`, { replace: true });
              }}
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium hover:from-blue-700 hover:to-indigo-700 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
              Try Again
            </button>
          </div>

          {/* Share */}
          <button
            onClick={() => {
              // Share functionality
              if (navigator.share) {
                navigator.share({
                  title: 'My Practice Results',
                  text: `I scored ${accuracy}% on my ${mode === 'speed' ? 'Speed Race' : 'Topic Drill'}!`,
                });
              }
            }}
            className="w-full mt-4 flex items-center justify-center gap-2 py-3 text-white/50 hover:text-white/70 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Share Results
          </button>
        </div>
      </div>
    </div>
  );
}
