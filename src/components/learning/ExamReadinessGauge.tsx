import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  Trophy,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Target,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/utils';
import { Card, CircularProgress } from '@/components/common';
import { useLearningPathStore, type SubjectReadiness } from '@/stores/learningPathStore';
import type { ExamTypeSlug, GhanaExamTypeSlug } from '@/types';
import { isGhanaExam } from '@/types';

interface ExamReadinessGaugeProps {
  examType?: ExamTypeSlug;
  className?: string;
  compact?: boolean;
}

// Exam-specific styling (for Ghana exams)
const examStyles: Record<GhanaExamTypeSlug, { gradient: string; icon: typeof GraduationCap }> = {
  nsmq: {
    gradient: 'from-amber-500 to-orange-600',
    icon: Trophy,
  },
  wassce: {
    gradient: 'from-indigo-500 to-purple-600',
    icon: GraduationCap,
  },
  bece: {
    gradient: 'from-emerald-500 to-teal-600',
    icon: BookOpen,
  },
};

// Get styles for an exam type with fallback for international exams
const getExamStyles = (examType: ExamTypeSlug) => {
  if (isGhanaExam(examType)) {
    return examStyles[examType];
  }
  // Default styles for international exams
  return {
    gradient: 'from-blue-500 to-indigo-600',
    icon: GraduationCap,
  };
};

export function ExamReadinessGauge({ examType = 'wassce', className, compact = false }: ExamReadinessGaugeProps) {
  const { examReadiness, isLoading, calculateExamReadiness } = useLearningPathStore();

  useEffect(() => {
    if (!examReadiness || examReadiness.examType !== examType) {
      calculateExamReadiness(examType);
    }
  }, [examType, examReadiness, calculateExamReadiness]);

  if (isLoading && !examReadiness) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-8 h-8 text-neutral-300 animate-spin" />
        </div>
      </Card>
    );
  }

  if (!examReadiness) {
    return null;
  }

  const { overallReadiness, subjectReadiness, predictedScore, recommendedFocus } = examReadiness;

  // Determine readiness status
  const getReadinessStatus = (value: number) => {
    if (value >= 80) return { label: 'Excellent', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle2 };
    if (value >= 60) return { label: 'Good', color: 'text-blue-600', bg: 'bg-blue-50', icon: TrendingUp };
    if (value >= 40) return { label: 'Fair', color: 'text-amber-600', bg: 'bg-amber-50', icon: Minus };
    return { label: 'Needs Work', color: 'text-red-600', bg: 'bg-red-50', icon: AlertTriangle };
  };

  const status = getReadinessStatus(overallReadiness);
  const StatusIcon = status.icon;

  if (compact) {
    return (
      <Card className={cn('p-4', className)}>
        <div className="flex items-center gap-4">
          <CircularProgress value={overallReadiness} size={60} variant="primary" />
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-neutral-900">{examReadiness.examName} Ready</h4>
              <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', status.bg, status.color)}>
                {status.label}
              </span>
            </div>
            <p className="text-sm text-neutral-500 mt-0.5">
              Predicted score: {predictedScore.low}-{predictedScore.high}%
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const style = getExamStyles(examType);
  const ExamIcon = style.icon;

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Header */}
      <div className={cn('p-4 bg-gradient-to-r text-white', style.gradient)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <ExamIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold">{examReadiness.examName} Readiness</h3>
              <p className="text-white/70 text-sm">Track your exam preparation</p>
            </div>
          </div>

          <button
            onClick={() => calculateExamReadiness(examType)}
            disabled={isLoading}
            className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
            aria-label="Refresh readiness"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Overall Score */}
      <div className="p-6 text-center border-b border-neutral-100">
        <div className="relative inline-block">
          <CircularProgress value={overallReadiness} size={140} variant="primary" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div>
              <div className="text-3xl font-bold text-neutral-900">{overallReadiness}%</div>
              <div className="text-xs text-neutral-500">Overall</div>
            </div>
          </div>
        </div>

        <div className={cn('inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full', status.bg)}>
          <StatusIcon className={cn('w-4 h-4', status.color)} />
          <span className={cn('font-medium text-sm', status.color)}>{status.label}</span>
        </div>

        {/* Predicted Score */}
        <div className="mt-4 p-3 bg-neutral-50 rounded-xl">
          <p className="text-xs text-neutral-500 mb-1">Predicted Score Range</p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-lg font-bold text-neutral-700">{predictedScore.low}%</span>
            <span className="text-neutral-400">-</span>
            <span className="text-lg font-bold text-neutral-700">{predictedScore.high}%</span>
          </div>
        </div>
      </div>

      {/* Subject Breakdown */}
      <div className="p-4">
        <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">
          Subject Readiness
        </h4>

        <div className="space-y-3">
          {subjectReadiness
            .sort((a, b) => a.readiness - b.readiness)
            .map((subject) => (
              <SubjectReadinessBar key={subject.subjectId} subject={subject} />
            ))}
        </div>
      </div>

      {/* Recommended Focus */}
      {recommendedFocus.length > 0 && (
        <div className="p-4 bg-amber-50 border-t border-amber-100">
          <div className="flex items-start gap-2">
            <Target className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">Recommended Focus</p>
              <p className="text-xs text-amber-600 mt-0.5">
                {recommendedFocus.join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

function SubjectReadinessBar({ subject }: { subject: SubjectReadiness }) {
  const getColor = (value: number) => {
    if (value >= 80) return 'bg-emerald-500';
    if (value >= 60) return 'bg-blue-500';
    if (value >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getTrend = () => {
    if (subject.strongTopics.length > subject.weakTopics.length) {
      return { icon: TrendingUp, color: 'text-emerald-500' };
    }
    if (subject.weakTopics.length > subject.strongTopics.length) {
      return { icon: TrendingDown, color: 'text-red-500' };
    }
    return { icon: Minus, color: 'text-neutral-400' };
  };

  const trend = getTrend();
  const TrendIcon = trend.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="group"
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-neutral-700">{subject.subjectName}</span>
          <TrendIcon className={cn('w-3 h-3', trend.color)} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400">
            {subject.topicsCompleted}/{subject.totalTopics} topics
          </span>
          <span className="text-sm font-semibold text-neutral-700">{subject.readiness}%</span>
        </div>
      </div>

      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full', getColor(subject.readiness))}
          initial={{ width: 0 }}
          animate={{ width: `${subject.readiness}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Weak topics tooltip on hover */}
      {subject.weakTopics.length > 0 && (
        <div className="hidden group-hover:block mt-1">
          <p className="text-xs text-red-500">
            Needs work: {subject.weakTopics.slice(0, 2).join(', ')}
            {subject.weakTopics.length > 2 && ` +${subject.weakTopics.length - 2} more`}
          </p>
        </div>
      )}
    </motion.div>
  );
}
