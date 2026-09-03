import { Clock, FlaskConical, Beaker, Microscope, Star, Play, BookOpen, Lock } from 'lucide-react';
import { Card, Badge, Button } from '@/components/common';
import { useUsageStore } from '@/stores/usageStore';
import { cn } from '@/utils';
import type { Experiment } from '@/types';

interface ExperimentCardProps {
  experiment: Experiment;
  onStart: (experiment: Experiment) => void;
  className?: string;
}

// Subject icon mapping
const subjectIcons: Record<string, typeof FlaskConical> = {
  'subj_wassce_physics': Beaker,
  'subj_wassce_chemistry': FlaskConical,
  'subj_wassce_biology': Microscope,
};

// Subject color mapping
const subjectColors: Record<string, string> = {
  'subj_wassce_physics': 'bg-purple-500',
  'subj_wassce_chemistry': 'bg-green-500',
  'subj_wassce_biology': 'bg-amber-500',
};

// Subject background colors
const subjectBgColors: Record<string, string> = {
  'subj_wassce_physics': 'bg-purple-50',
  'subj_wassce_chemistry': 'bg-green-50',
  'subj_wassce_biology': 'bg-amber-50',
};

// Difficulty colors
const difficultyColors: Record<string, string> = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-red-100 text-red-700',
};

export function ExperimentCard({ experiment, onStart, className }: ExperimentCardProps) {
  const SubjectIcon = subjectIcons[experiment.subjectId] || FlaskConical;
  const iconColor = subjectColors[experiment.subjectId] || 'bg-gray-500';
  const bgColor = subjectBgColors[experiment.subjectId] || 'bg-gray-50';

  // Premium lock: same signal as Practice.tsx
  const { dailyUsage } = useUsageStore();
  const isPremiumUser = dailyUsage?.isUnlimited || dailyUsage?.isPremium || false;
  const isLocked = experiment.isPremium && !isPremiumUser;

  // Get subject name from ID
  const getSubjectName = (subjectId: string) => {
    const mapping: Record<string, string> = {
      'subj_wassce_physics': 'Physics',
      'subj_wassce_chemistry': 'Chemistry',
      'subj_wassce_biology': 'Biology',
    };
    return mapping[subjectId] || 'Science';
  };

  // Calculate total marks
  const totalMarks = experiment.procedure.reduce((sum, step) => sum + step.maxMarks, 0);

  return (
    <Card hoverable className={cn('overflow-hidden relative', className)}>
      {/* Premium lock overlay */}
      {isLocked && (
        <div className="absolute top-3 right-3 z-10">
          <Badge variant="warning" size="sm" icon={<Lock className="w-3 h-3" />}>
            Premium
          </Badge>
        </div>
      )}
      {/* Header with Subject Icon */}
      <div className={cn('p-4 flex items-start gap-4', bgColor)}>
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0', iconColor)}>
          <SubjectIcon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="secondary" size="sm">
              {getSubjectName(experiment.subjectId)}
            </Badge>
            <Badge
              size="sm"
              className={difficultyColors[experiment.difficulty]}
            >
              {experiment.difficulty.charAt(0).toUpperCase() + experiment.difficulty.slice(1)}
            </Badge>
          </div>
          <h3 className="font-semibold text-neutral-900 line-clamp-2">
            {experiment.name}
          </h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        <p className="text-sm text-neutral-600 line-clamp-2">
          {experiment.description}
        </p>

        {/* Meta Info */}
        <div className="flex items-center gap-4 text-sm text-neutral-500">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{experiment.estimatedTime} mins</span>
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            <span>{experiment.procedure.length} steps</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4" />
            <span>{totalMarks} marks</span>
          </div>
        </div>

        {/* Objectives Preview */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-neutral-500 uppercase">Objectives:</p>
          <ul className="text-xs text-neutral-600 space-y-0.5">
            {experiment.objectives.slice(0, 2).map((obj, idx) => (
              <li key={idx} className="flex items-start gap-1">
                <span className="w-1 h-1 bg-primary rounded-full mt-1.5 shrink-0" />
                <span className="line-clamp-1">{obj}</span>
              </li>
            ))}
            {experiment.objectives.length > 2 && (
              <li className="text-neutral-400">
                +{experiment.objectives.length - 2} more
              </li>
            )}
          </ul>
        </div>

        {/* Simulation Type Badge */}
        {experiment.simulationType === 'phet' && (
          <Badge variant="secondary" size="sm" className="bg-blue-50 text-blue-700">
            PhET Simulation
          </Badge>
        )}

        {/* WAEC Past Years */}
        {experiment.waecPastYears && experiment.waecPastYears.length > 0 && (
          <p className="text-xs text-neutral-400">
            WAEC: {experiment.waecPastYears.slice(-3).join(', ')}
          </p>
        )}
      </div>

      {/* Action Footer */}
      <div className="p-4 pt-0">
        <Button
          className="w-full"
          onClick={() => onStart(experiment)}
          rightIcon={isLocked ? <Lock className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        >
          {isLocked ? 'Unlock with Premium' : 'Start Experiment'}
        </Button>
      </div>
    </Card>
  );
}
