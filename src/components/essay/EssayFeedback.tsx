import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Target,
  Lightbulb,
  FileText,
} from 'lucide-react';
import { Card, Badge } from '@/components/common';
import type { AIEssayFeedback, CriteriaScore } from '@/types';
import { cn } from '@/utils';

interface EssayFeedbackProps {
  feedback: AIEssayFeedback;
  totalMarks?: number;
  className?: string;
}

function ScoreCircle({ score, maxScore }: { score: number; maxScore: number }) {
  const percentage = (score / maxScore) * 100;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getColor = () => {
    if (percentage >= 80) return 'text-green-500';
    if (percentage >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <div className="relative w-32 h-32">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="64"
          cy="64"
          r="45"
          stroke="currentColor"
          strokeWidth="10"
          fill="none"
          className="text-slate-200"
        />
        <circle
          cx="64"
          cy="64"
          r="45"
          stroke="currentColor"
          strokeWidth="10"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={cn('transition-all duration-1000', getColor())}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('text-3xl font-bold', getColor())}>{score}</span>
        <span className="text-sm text-slate-500">/ {maxScore}</span>
      </div>
    </div>
  );
}

function CriteriaScoreCard({ criteria }: { criteria: CriteriaScore }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const percentage = (criteria.score / criteria.maxScore) * 100;

  const getStatusColor = () => {
    if (percentage >= 80) return 'bg-green-100 border-green-200';
    if (percentage >= 60) return 'bg-amber-100 border-amber-200';
    return 'bg-red-100 border-red-200';
  };

  const getBarColor = () => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className={cn('rounded-xl border p-4', getStatusColor())}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full"
      >
        <div className="flex items-center gap-3">
          <Target className="w-5 h-5 text-slate-600" />
          <span className="font-medium text-slate-900">{criteria.criterionName}</span>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary">
            {criteria.score}/{criteria.maxScore}
          </Badge>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </button>

      {/* Progress Bar */}
      <div className="mt-3 h-2 bg-white/50 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', getBarColor())}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {isExpanded && criteria.feedback && (
        <div className="mt-4 p-3 bg-white/50 rounded-lg">
          <p className="text-sm text-slate-700">{criteria.feedback}</p>
        </div>
      )}
    </div>
  );
}

export function EssayFeedback({ feedback, totalMarks = 100, className }: EssayFeedbackProps) {
  const [showDetails, setShowDetails] = useState(true);

  const overallPercentage = (feedback.overallScore / totalMarks) * 100;

  const getGrade = () => {
    if (overallPercentage >= 80) return { grade: 'A', label: 'Excellent', color: 'text-green-600' };
    if (overallPercentage >= 70) return { grade: 'B', label: 'Good', color: 'text-blue-600' };
    if (overallPercentage >= 60) return { grade: 'C', label: 'Satisfactory', color: 'text-amber-600' };
    if (overallPercentage >= 50) return { grade: 'D', label: 'Needs Improvement', color: 'text-orange-600' };
    return { grade: 'F', label: 'Unsatisfactory', color: 'text-red-600' };
  };

  const gradeInfo = getGrade();

  return (
    <div className={cn('space-y-6', className)}>
      {/* Overall Score Card */}
      <Card className="p-6 bg-gradient-to-br from-slate-50 to-white">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="w-6 h-6 text-primary" />
          <h3 className="text-xl font-bold text-slate-900">AI Grading Results</h3>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Score Circle */}
          <div className="flex flex-col items-center">
            <ScoreCircle score={feedback.overallScore} maxScore={totalMarks} />
            <div className="mt-4 text-center">
              <span className={cn('text-3xl font-bold', gradeInfo.color)}>
                {gradeInfo.grade}
              </span>
              <p className="text-sm text-slate-500">{gradeInfo.label}</p>
            </div>
          </div>

          {/* Summary */}
          <div className="flex-1">
            <h4 className="font-semibold text-slate-900 mb-3">Summary</h4>
            <p className="text-slate-700 leading-relaxed">{feedback.overallFeedback}</p>

            {/* Quick Stats */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              {feedback.strengths && feedback.strengths.length > 0 && (
                <div className="flex items-center gap-2 text-green-600">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">{feedback.strengths.length} strengths</span>
                </div>
              )}
              {feedback.areasForImprovement && feedback.areasForImprovement.length > 0 && (
                <div className="flex items-center gap-2 text-amber-600">
                  <TrendingDown className="w-4 h-4" />
                  <span className="text-sm">{feedback.areasForImprovement.length} areas to improve</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Criteria Breakdown */}
      {feedback.criteriaScores && feedback.criteriaScores.length > 0 && (
        <Card className="p-6">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center justify-between w-full mb-4"
          >
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-slate-900">Criteria Breakdown</h3>
            </div>
            {showDetails ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {showDetails && (
            <div className="space-y-3">
              {feedback.criteriaScores.map((criteria) => (
                <CriteriaScoreCard key={criteria.criterionName} criteria={criteria} />
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Strengths & Improvements */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Strengths */}
        {feedback.strengths && feedback.strengths.length > 0 && (
          <Card className="p-6 border-l-4 border-l-green-500">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-slate-900">Strengths</h3>
            </div>
            <ul className="space-y-2">
              {feedback.strengths.map((strength) => (
                <li key={strength} className="flex items-start gap-2 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{strength}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Improvements */}
        {feedback.areasForImprovement && feedback.areasForImprovement.length > 0 && (
          <Card className="p-6 border-l-4 border-l-amber-500">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-amber-600" />
              <h3 className="font-semibold text-slate-900">Areas for Improvement</h3>
            </div>
            <ul className="space-y-2">
              {feedback.areasForImprovement.map((improvement: string) => (
                <li key={improvement} className="flex items-start gap-2 text-slate-700">
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{improvement}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      {/* Grammar Errors */}
      {feedback.grammarErrors && feedback.grammarErrors.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-slate-900">Grammar & Spelling Issues</h3>
            <Badge variant="accent" size="sm">
              {feedback.grammarErrors.length} found
            </Badge>
          </div>
          <div className="space-y-3">
            {feedback.grammarErrors.slice(0, 5).map((error) => (
              <div key={`${error.position.start}-${error.text}`} className="p-3 bg-red-50 rounded-lg border border-red-100">
                <div className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-900">
                      "{error.text}" → "{error.suggestion}"
                    </p>
                    <p className="text-xs text-red-700 mt-1">{error.type}: Issue found at position {error.position.start}-{error.position.end}</p>
                  </div>
                </div>
              </div>
            ))}
            {feedback.grammarErrors.length > 5 && (
              <p className="text-sm text-slate-500 text-center">
                + {feedback.grammarErrors.length - 5} more issues
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
