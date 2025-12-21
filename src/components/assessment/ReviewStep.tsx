import {
  FileText,
  Clock,
  HelpCircle,
  Users,
  AlertTriangle,
  Send,
  Loader2,
} from 'lucide-react';
import type { AssessmentDraft } from '@/types';
import { cn } from '@/utils';

interface ReviewStepProps {
  draft: AssessmentDraft;
  onPublish: () => Promise<void>;
  isPublishing: boolean;
}

export function ReviewStep({ draft, onPublish, isPublishing }: ReviewStepProps) {
  const totalMarks = draft.questions.reduce((sum, q) => sum + q.marks, 0);

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Not set';
    return new Date(isoString).toLocaleString('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const getAssessmentTypeLabel = () => {
    switch (draft.assessmentType) {
      case 'quiz':
        return 'Quick Quiz';
      case 'homework':
        return 'Homework Assignment';
      case 'mock_exam':
        return 'Mock Exam';
      default:
        return 'Assessment';
    }
  };

  const getAssignmentSummary = () => {
    const classCount = draft.assignments.filter(
      (a) => a.assignmentType === 'class'
    ).length;
    const studentCount = draft.assignments.filter(
      (a) => a.assignmentType === 'individual'
    ).length;
    const levelAssignment = draft.assignments.find(
      (a) => a.assignmentType === 'school_level'
    );

    const parts: string[] = [];
    if (classCount > 0) {
      parts.push(`${classCount} class${classCount !== 1 ? 'es' : ''}`);
    }
    if (studentCount > 0) {
      parts.push(`${studentCount} student${studentCount !== 1 ? 's' : ''}`);
    }
    if (levelAssignment) {
      parts.push(
        `All ${levelAssignment.schoolLevel?.toUpperCase()}${
          levelAssignment.yearGroup ? ` Year ${levelAssignment.yearGroup}` : ''
        }`
      );
    }

    return parts.length > 0 ? parts.join(', ') : 'No assignments';
  };

  const warnings: string[] = [];
  if (draft.questions.length === 0) {
    warnings.push('No questions added');
  }
  if (draft.assignments.length === 0) {
    warnings.push('No students assigned');
  }
  if (draft.assessmentType === 'mock_exam' && !draft.timeLimit) {
    warnings.push('Mock exam has no time limit');
  }

  const canPublish =
    draft.title.trim().length >= 3 &&
    draft.questions.length > 0 &&
    draft.assignments.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 mb-1">
          Review & Publish
        </h2>
        <p className="text-neutral-500">
          Review your assessment before publishing
        </p>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Issues to Address</p>
              <ul className="mt-1 space-y-1">
                {warnings.map((warning, i) => (
                  <li key={i} className="text-sm text-amber-700">
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* Basic Info */}
        <div className="p-4 bg-neutral-50 rounded-xl">
          <div className="flex items-center gap-2 text-neutral-500 mb-3">
            <FileText className="w-4 h-4" />
            <span className="text-sm font-medium">Basic Info</span>
          </div>
          <h3 className="font-semibold text-neutral-900">{draft.title || 'Untitled'}</h3>
          <p className="text-sm text-neutral-500 mt-1">{getAssessmentTypeLabel()}</p>
          {draft.description && (
            <p className="text-sm text-neutral-600 mt-2 line-clamp-2">
              {draft.description}
            </p>
          )}
        </div>

        {/* Questions */}
        <div className="p-4 bg-neutral-50 rounded-xl">
          <div className="flex items-center gap-2 text-neutral-500 mb-3">
            <HelpCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Questions</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-neutral-900">
              {draft.questions.length}
            </span>
            <span className="text-neutral-500">questions</span>
          </div>
          <p className="text-sm text-neutral-500 mt-1">{totalMarks} total marks</p>
        </div>

        {/* Timing */}
        <div className="p-4 bg-neutral-50 rounded-xl">
          <div className="flex items-center gap-2 text-neutral-500 mb-3">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">Timing</span>
          </div>
          <p className="font-medium text-neutral-900">
            {draft.timeLimit ? `${draft.timeLimit} minutes` : 'No time limit'}
          </p>
          <div className="text-sm text-neutral-500 mt-2 space-y-1">
            <p>Start: {formatDate(draft.startDate)}</p>
            <p>End: {formatDate(draft.endDate)}</p>
          </div>
        </div>

        {/* Assignment */}
        <div className="p-4 bg-neutral-50 rounded-xl">
          <div className="flex items-center gap-2 text-neutral-500 mb-3">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">Assigned To</span>
          </div>
          <p className="font-medium text-neutral-900">{getAssignmentSummary()}</p>
          {draft.lateSubmissionAllowed && (
            <p className="text-sm text-neutral-500 mt-1">
              Late submissions: {draft.latePenaltyPercent || 0}% penalty
            </p>
          )}
        </div>
      </div>

      {/* Settings Summary */}
      <div className="p-4 bg-neutral-50 rounded-xl">
        <h4 className="font-medium text-neutral-900 mb-3">Settings</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'w-4 h-4 rounded-full',
                draft.showCorrectAnswers ? 'bg-green-500' : 'bg-neutral-300'
              )}
            />
            <span className="text-neutral-600">Show correct answers</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'w-4 h-4 rounded-full',
                draft.showScoreImmediately ? 'bg-green-500' : 'bg-neutral-300'
              )}
            />
            <span className="text-neutral-600">Show score immediately</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'w-4 h-4 rounded-full',
                draft.shuffleQuestions ? 'bg-green-500' : 'bg-neutral-300'
              )}
            />
            <span className="text-neutral-600">Shuffle questions</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'w-4 h-4 rounded-full',
                draft.shuffleOptions ? 'bg-green-500' : 'bg-neutral-300'
              )}
            />
            <span className="text-neutral-600">Shuffle options</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-neutral-600">
              Max attempts: {draft.maxAttempts || 'Unlimited'}
            </span>
          </div>
          {draft.passingScore && (
            <div className="flex items-center gap-2">
              <span className="text-neutral-600">
                Passing score: {draft.passingScore}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Publish Button */}
      <div className="pt-4 border-t border-neutral-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-500">
              Once published, students will be able to access this assessment based on your schedule.
            </p>
          </div>
          <button
            onClick={onPublish}
            disabled={!canPublish || isPublishing}
            className={cn(
              'flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all',
              canPublish && !isPublishing
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/25'
                : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
            )}
          >
            {isPublishing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Publish Assessment
              </>
            )}
          </button>
        </div>

        {!canPublish && (
          <p className="mt-3 text-sm text-red-500">
            Please fix the issues above before publishing
          </p>
        )}
      </div>
    </div>
  );
}
