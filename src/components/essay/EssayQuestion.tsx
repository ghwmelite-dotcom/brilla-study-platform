import { useState } from 'react';
import {
  FileText,
  Clock,
  Target,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  BookOpen,
  AlertCircle,
} from 'lucide-react';
import { Card, Badge } from '@/components/common';
import type { EssayQuestion as EssayQuestionType, MarkingCriteria, MarkingScheme } from '@/types';
import { cn } from '@/utils';

interface EssayQuestionProps {
  question: EssayQuestionType;
  showRubric?: boolean;
  className?: string;
}

// Helper to get criteria from markingScheme (could be array or object)
function getCriteria(markingScheme?: MarkingScheme | MarkingCriteria[]): MarkingCriteria[] {
  if (!markingScheme) return [];
  if (Array.isArray(markingScheme)) return markingScheme;
  return markingScheme.criteria || [];
}

function CriteriaItem({ criteria, index }: { criteria: MarkingCriteria; index: number }) {
  const marks = criteria.maxScore || criteria.maxMarks || 0;
  return (
    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-sm">
        {index + 1}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-medium text-slate-900">{criteria.name}</h4>
          <Badge variant="secondary" size="sm">
            {marks} marks
          </Badge>
        </div>
        <p className="text-sm text-slate-600">{criteria.description}</p>
      </div>
    </div>
  );
}

export function EssayQuestion({ question, showRubric = true, className }: EssayQuestionProps) {
  const [isRubricExpanded, setIsRubricExpanded] = useState(false);

  const criteria = getCriteria(question.markingScheme);
  const totalMarks = criteria.reduce(
    (sum, c) => sum + (c.maxScore || c.maxMarks || 0),
    0
  ) || question.marks || 0;

  return (
    <Card className={cn('p-6', className)}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Essay Question</h2>
            <p className="text-sm text-slate-500">{question.subject || 'General'}</p>
          </div>
        </div>
        <Badge variant="accent" size="lg">
          {totalMarks} Marks
        </Badge>
      </div>

      {/* Question Text */}
      <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
        <p className="text-slate-800 text-lg leading-relaxed whitespace-pre-wrap">
          {question.questionText}
        </p>
      </div>

      {/* Requirements */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Word Limit */}
        {(question.wordLimitMin || question.wordLimitMax) && (
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <FileText className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-xs text-blue-600 font-medium">Word Limit</p>
              <p className="text-sm font-semibold text-blue-900">
                {question.wordLimitMin && question.wordLimitMax
                  ? `${question.wordLimitMin} - ${question.wordLimitMax} words`
                  : question.wordLimitMin
                  ? `Min ${question.wordLimitMin} words`
                  : `Max ${question.wordLimitMax} words`}
              </p>
            </div>
          </div>
        )}

        {/* Time Suggestion */}
        <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
          <Clock className="w-5 h-5 text-amber-600" />
          <div>
            <p className="text-xs text-amber-600 font-medium">Suggested Time</p>
            <p className="text-sm font-semibold text-amber-900">
              {Math.ceil((question.wordLimitMax || 500) / 15)} minutes
            </p>
          </div>
        </div>

        {/* Grading */}
        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
          <Target className="w-5 h-5 text-green-600" />
          <div>
            <p className="text-xs text-green-600 font-medium">Grading</p>
            <p className="text-sm font-semibold text-green-900">
              {question.aiGradingEnabled ? 'AI + Model Answer' : 'Model Answer Only'}
            </p>
          </div>
        </div>
      </div>

      {/* Marking Rubric */}
      {showRubric && criteria.length > 0 && (
        <div className="border-t border-slate-200 pt-4">
          <button
            onClick={() => setIsRubricExpanded(!isRubricExpanded)}
            className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <span className="font-medium text-slate-900">Marking Rubric</span>
              <Badge variant="secondary" size="sm">
                {criteria.length} criteria
              </Badge>
            </div>
            {isRubricExpanded ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {isRubricExpanded && (
            <div className="mt-4 space-y-3">
              {criteria.map((c, index) => (
                <CriteriaItem key={c.name} criteria={c} index={index} />
              ))}

              {/* Tips */}
              <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-100">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-900 mb-1">Tips for a Great Essay</h4>
                    <ul className="text-sm text-amber-800 space-y-1">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Structure your essay with clear introduction, body, and conclusion
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Support your arguments with specific examples
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Check your grammar and spelling before submitting
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Stay within the word limit for maximum marks
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
