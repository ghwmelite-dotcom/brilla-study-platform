import { FileText, ClipboardList, GraduationCap } from 'lucide-react';
import type { AssessmentDraft, AssessmentType } from '@/types';
import { cn } from '@/utils';

interface BasicInfoStepProps {
  draft: AssessmentDraft;
  onUpdate: (updates: Partial<AssessmentDraft>) => void;
}

const ASSESSMENT_TYPES: {
  type: AssessmentType;
  title: string;
  description: string;
  icon: typeof FileText;
  color: string;
}[] = [
  {
    type: 'quiz',
    title: 'Quick Quiz',
    description: 'Short assessment to check understanding',
    icon: FileText,
    color: 'blue',
  },
  {
    type: 'homework',
    title: 'Homework',
    description: 'Take-home assignment with flexible deadline',
    icon: ClipboardList,
    color: 'amber',
  },
  {
    type: 'mock_exam',
    title: 'Mock Exam',
    description: 'Timed exam simulation with strict conditions',
    icon: GraduationCap,
    color: 'purple',
  },
];

export function BasicInfoStep({ draft, onUpdate }: BasicInfoStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 mb-1">
          Basic Information
        </h2>
        <p className="text-neutral-500">
          Set up the core details for your assessment
        </p>
      </div>

      {/* Assessment Type */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-3">
          Assessment Type
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {ASSESSMENT_TYPES.map(({ type, title, description, icon: Icon, color }) => (
            <button
              key={type}
              onClick={() => onUpdate({ assessmentType: type })}
              className={cn(
                'p-4 rounded-xl border-2 text-left transition-all',
                draft.assessmentType === type
                  ? `border-${color}-500 bg-${color}-50`
                  : 'border-neutral-200 hover:border-neutral-300'
              )}
              style={{
                borderColor: draft.assessmentType === type
                  ? color === 'blue' ? '#3B82F6' : color === 'amber' ? '#F59E0B' : '#8B5CF6'
                  : undefined,
                backgroundColor: draft.assessmentType === type
                  ? color === 'blue' ? '#EFF6FF' : color === 'amber' ? '#FFFBEB' : '#F5F3FF'
                  : undefined,
              }}
            >
              <Icon
                className={cn(
                  'w-6 h-6 mb-2',
                  draft.assessmentType === type
                    ? color === 'blue' ? 'text-blue-600' : color === 'amber' ? 'text-amber-600' : 'text-purple-600'
                    : 'text-neutral-400'
                )}
              />
              <p className="font-medium text-neutral-900">{title}</p>
              <p className="text-xs text-neutral-500 mt-1">{description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1.5">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={draft.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="e.g., Chapter 5 Quiz - Photosynthesis"
          className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        />
        <p className="mt-1 text-xs text-neutral-500">
          Choose a clear, descriptive title for your assessment
        </p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1.5">
          Description
        </label>
        <textarea
          value={draft.description || ''}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="Briefly describe what this assessment covers..."
          rows={3}
          className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
        />
      </div>

      {/* Instructions */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1.5">
          Instructions for Students
        </label>
        <textarea
          value={draft.instructions || ''}
          onChange={(e) => onUpdate({ instructions: e.target.value })}
          placeholder="Any special instructions or guidelines for students..."
          rows={3}
          className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
        />
      </div>

      {/* Subject (if available) */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1.5">
          Subject
        </label>
        <select
          value={draft.subjectId || ''}
          onChange={(e) => onUpdate({ subjectId: e.target.value || undefined })}
          className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none bg-white"
        >
          <option value="">Select a subject (optional)</option>
          <option value="mathematics">Mathematics</option>
          <option value="english">English Language</option>
          <option value="science">Integrated Science</option>
          <option value="social-studies">Social Studies</option>
          <option value="rme">Religious & Moral Education</option>
          <option value="ict">ICT</option>
          <option value="french">French</option>
          <option value="ghanaian-language">Ghanaian Language</option>
        </select>
      </div>
    </div>
  );
}
