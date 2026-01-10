import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useExamBoardStore } from '@/stores/examBoardStore';
import { cn } from '@/utils';

interface OALevelProgressWidgetProps {
  variant?: 'full' | 'compact';
  className?: string;
}

export function OALevelProgressWidget({
  variant = 'full',
  className,
}: OALevelProgressWidgetProps) {
  const {
    specifications,
    userSpecifications,
    syllabusTopics,
    userSyllabusProgress,
    setupComplete,
    fetchUserSpecifications,
    fetchSpecifications,
    fetchSyllabusTopics,
    getSyllabusProgress,
    getPredictedGrade,
  } = useExamBoardStore();

  const [selectedSpecs, setSelectedSpecs] = useState<typeof specifications>([]);

  // Fetch data on mount
  useEffect(() => {
    fetchUserSpecifications();
    fetchSpecifications();
  }, [fetchUserSpecifications, fetchSpecifications]);

  // Get user's selected specifications details
  useEffect(() => {
    if (specifications.length > 0 && userSpecifications.length > 0) {
      const userSpecIds = userSpecifications.map((us) => us.specificationId);
      const filtered = specifications.filter((s) => userSpecIds.includes(s.id));
      setSelectedSpecs(filtered);

      // Fetch syllabus for progress calculation
      filtered.forEach((spec) => {
        fetchSyllabusTopics(spec.id);
      });
    }
  }, [specifications, userSpecifications, fetchSyllabusTopics]);

  // Don't show if no subjects selected
  if (!setupComplete && userSpecifications.length === 0) {
    return null;
  }

  // Calculate overall stats
  const totalTopics = syllabusTopics.length;
  const completedTopics = userSyllabusProgress.filter((p) => p.status === 'completed').length;
  const overallProgress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  // Full variant - hero style widget
  if (variant === 'full') {
    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-primary to-purple-600',
          'shadow-lg',
          className
        )}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
        </div>

        {/* Content */}
        <div className="relative z-10 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Left side - Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">O/A Level Progress</h2>
                  <p className="text-white/70 text-sm">
                    {selectedSpecs.length} subject{selectedSpecs.length !== 1 ? 's' : ''} in
                    progress
                  </p>
                </div>
              </div>

              {/* Progress bars for each subject */}
              <div className="space-y-3 mb-4">
                {selectedSpecs.slice(0, 3).map((spec) => {
                  const progress = getSyllabusProgress(spec.id);
                  const predicted = getPredictedGrade(spec.id);

                  return (
                    <div key={spec.id} className="flex items-center gap-3">
                      <div className="w-24 truncate">
                        <p className="text-sm font-medium text-white truncate">
                          {spec.syllabusName}
                        </p>
                      </div>
                      <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-white rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-white/70">{progress}%</span>
                        {predicted && (
                          <span className="text-green-300 font-medium">{predicted}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {selectedSpecs.length > 3 && (
                  <p className="text-sm text-white/60">
                    +{selectedSpecs.length - 3} more subject{selectedSpecs.length - 3 !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>

            {/* Right side - Stats & CTA */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-stretch gap-4">
              {/* Quick stats */}
              <div className="flex gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center min-w-[80px]">
                  <p className="text-2xl font-bold text-white">{overallProgress}%</p>
                  <p className="text-xs text-white/70">Progress</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center min-w-[80px]">
                  <p className="text-2xl font-bold text-white">
                    {completedTopics}/{totalTopics}
                  </p>
                  <p className="text-xs text-white/70">Topics</p>
                </div>
              </div>

              {/* CTA */}
              <Link
                to="/oa-level"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-primary font-semibold rounded-xl hover:bg-white/90 transition-all shadow-lg"
              >
                <span>View Dashboard</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Compact variant - sidebar card
  return (
    <div
      className={cn(
        'bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 p-5',
        className
      )}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-md">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-neutral-900">O/A Level Progress</h3>
          <p className="text-xs text-neutral-500">
            {selectedSpecs.length} subject{selectedSpecs.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Overall progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-neutral-600">Overall Progress</span>
          <span className="font-semibold text-neutral-900">{overallProgress}%</span>
        </div>
        <div className="h-2.5 bg-white rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-2 bg-white rounded-lg">
          <div className="w-6 h-6 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-1">
            <BookOpen className="w-3.5 h-3.5 text-neutral-500" />
          </div>
          <p className="text-sm font-bold text-neutral-900">{selectedSpecs.length}</p>
          <p className="text-xs text-neutral-500">Subjects</p>
        </div>
        <div className="text-center p-2 bg-white rounded-lg">
          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
          </div>
          <p className="text-sm font-bold text-neutral-900">{completedTopics}</p>
          <p className="text-xs text-neutral-500">Done</p>
        </div>
        <div className="text-center p-2 bg-white rounded-lg">
          <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-1">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <p className="text-sm font-bold text-neutral-900">{totalTopics - completedTopics}</p>
          <p className="text-xs text-neutral-500">Left</p>
        </div>
      </div>

      {/* Subject list */}
      <div className="space-y-2 mb-4">
        {selectedSpecs.slice(0, 3).map((spec) => {
          const progress = getSyllabusProgress(spec.id);
          const predicted = getPredictedGrade(spec.id);

          return (
            <Link
              key={spec.id}
              to={`/oa-level/syllabus/${spec.id}`}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-white transition-colors group"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: spec.subject?.color || '#6366F1' }}
              >
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate group-hover:text-primary">
                  {spec.syllabusName}
                </p>
                <div className="h-1 bg-neutral-200 rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-neutral-500">{progress}%</p>
                {predicted && (
                  <p className="text-xs font-medium text-green-600">{predicted}</p>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* CTA */}
      <Link
        to="/oa-level"
        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium text-sm rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md"
      >
        <Sparkles className="w-4 h-4" />
        View Full Dashboard
      </Link>
    </div>
  );
}

export default OALevelProgressWidget;
