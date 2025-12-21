import { useState } from 'react';
import { Calendar, Clock, AlertTriangle, Info } from 'lucide-react';
import type { AssessmentDraft } from '@/types';
import { cn } from '@/utils';

interface TimingStepProps {
  draft: AssessmentDraft;
  onUpdate: (updates: Partial<AssessmentDraft>) => void;
}

export function TimingStep({ draft, onUpdate }: TimingStepProps) {
  const formatDateTimeLocal = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toISOString().slice(0, 16);
  };

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    onUpdate({ [field]: value ? new Date(value).toISOString() : undefined });
  };

  const presetTimeLimits = [
    { label: 'No limit', value: 0 },
    { label: '15 min', value: 15 },
    { label: '30 min', value: 30 },
    { label: '45 min', value: 45 },
    { label: '1 hour', value: 60 },
    { label: '1.5 hours', value: 90 },
    { label: '2 hours', value: 120 },
    { label: '3 hours', value: 180 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 mb-1">
          Timing & Schedule
        </h2>
        <p className="text-neutral-500">
          Set when the assessment is available and how long students have
        </p>
      </div>

      {/* Time Limit */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-3">
          <span className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Time Limit
          </span>
        </label>

        <div className="flex flex-wrap gap-2 mb-3">
          {presetTimeLimits.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => onUpdate({ timeLimit: value || undefined })}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                (draft.timeLimit || 0) === value
                  ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-500'
                  : 'bg-neutral-100 text-neutral-700 border-2 border-transparent hover:bg-neutral-200'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-500">Custom:</span>
          <input
            type="number"
            min="0"
            max="480"
            value={draft.timeLimit || ''}
            onChange={(e) =>
              onUpdate({ timeLimit: parseInt(e.target.value) || undefined })
            }
            placeholder="0"
            className="w-20 px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-center"
          />
          <span className="text-sm text-neutral-500">minutes</span>
        </div>

        {draft.assessmentType === 'mock_exam' && !draft.timeLimit && (
          <div className="mt-3 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-700">
              Mock exams typically have time limits to simulate real exam conditions
            </p>
          </div>
        )}
      </div>

      {/* Schedule */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Start Date & Time
            </span>
          </label>
          <input
            type="datetime-local"
            value={formatDateTimeLocal(draft.startDate)}
            onChange={(e) => handleDateChange('startDate', e.target.value)}
            className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
          <p className="mt-1 text-xs text-neutral-500">
            When students can start taking the assessment
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              End Date & Time
            </span>
          </label>
          <input
            type="datetime-local"
            value={formatDateTimeLocal(draft.endDate)}
            onChange={(e) => handleDateChange('endDate', e.target.value)}
            min={formatDateTimeLocal(draft.startDate)}
            className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
          <p className="mt-1 text-xs text-neutral-500">
            Deadline for submission
          </p>
        </div>
      </div>

      {/* Late Submission */}
      <div className="p-4 bg-neutral-50 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-neutral-700">
              Allow Late Submissions
            </label>
            <p className="text-xs text-neutral-500">
              Students can submit after the deadline with a penalty
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              onUpdate({ lateSubmissionAllowed: !draft.lateSubmissionAllowed })
            }
            className={cn(
              'relative w-11 h-6 rounded-full transition-colors',
              draft.lateSubmissionAllowed ? 'bg-indigo-500' : 'bg-neutral-300'
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                draft.lateSubmissionAllowed ? 'left-[22px]' : 'left-0.5'
              )}
            />
          </button>
        </div>

        {draft.lateSubmissionAllowed && (
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Late Penalty
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                max="100"
                value={draft.latePenaltyPercent || 0}
                onChange={(e) =>
                  onUpdate({ latePenaltyPercent: parseInt(e.target.value) || 0 })
                }
                className="w-20 px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-center"
              />
              <span className="text-sm text-neutral-500">% deduction from total score</span>
            </div>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
        <div className="text-sm text-blue-700">
          <p className="font-medium">Scheduling Tips:</p>
          <ul className="mt-1 list-disc list-inside space-y-1 text-blue-600">
            <li>Leave dates empty to allow access immediately after publishing</li>
            <li>For homework, consider giving at least 2-3 days</li>
            <li>For mock exams, set a specific start time when all students should begin</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
