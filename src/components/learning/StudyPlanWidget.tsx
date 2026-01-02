import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar,
  CheckCircle2,
  Circle,
  Star,
  ChevronRight,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/utils';
import { Card, Button } from '@/components/common';
import { useLearningPathStore, type RecommendationPriority } from '@/stores/learningPathStore';

const priorityColors: Record<RecommendationPriority, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-blue-500',
  low: 'bg-green-500',
};

const dayLabels: Record<string, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

interface StudyPlanWidgetProps {
  className?: string;
  showWeekView?: boolean;
}

export function StudyPlanWidget({ className, showWeekView = false }: StudyPlanWidgetProps) {
  const { studyPlan, isLoading, generateStudyPlan, markTopicComplete } = useLearningPathStore();

  useEffect(() => {
    if (studyPlan.length === 0) {
      generateStudyPlan();
    }
  }, [studyPlan.length, generateStudyPlan]);

  const today = new Date().toISOString().split('T')[0];
  const todayPlan = studyPlan.find((p) => p.date === today);
  const upcomingPlans = studyPlan.filter((p) => p.date > today).slice(0, 3);

  const totalXpTarget = studyPlan.reduce((sum, p) => sum + p.xpTarget, 0);
  const totalXpEarned = studyPlan.reduce((sum, p) => sum + p.xpEarned, 0);
  const weekProgress = totalXpTarget > 0 ? Math.round((totalXpEarned / totalXpTarget) * 100) : 0;

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold">Study Plan</h3>
              <p className="text-white/70 text-sm">Your weekly learning schedule</p>
            </div>
          </div>

          <button
            onClick={() => generateStudyPlan()}
            disabled={isLoading}
            className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
            aria-label="Refresh study plan"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          </button>
        </div>

        {/* Week Progress */}
        <div className="mt-4 pt-3 border-t border-white/20">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-white/70">Weekly Progress</span>
            <span className="font-semibold">{totalXpEarned}/{totalXpTarget} XP</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${weekProgress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      {/* Today's Plan */}
      <div className="p-4 border-b border-neutral-100">
        <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3 flex items-center gap-2">
          <Sparkles className="w-3 h-3" />
          Today's Focus
        </h4>

        {isLoading && !todayPlan ? (
          <div className="py-4 text-center">
            <RefreshCw className="w-6 h-6 text-neutral-300 mx-auto animate-spin" />
          </div>
        ) : todayPlan ? (
          <div className="space-y-2">
            {todayPlan.topics.map((topic) => (
              <motion.div
                key={topic.topicId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg transition-colors',
                  topic.completed ? 'bg-emerald-50' : 'bg-neutral-50 hover:bg-neutral-100'
                )}
              >
                <button
                  onClick={() => markTopicComplete(todayPlan.id, topic.topicId)}
                  className="flex-shrink-0"
                  disabled={topic.completed}
                >
                  {topic.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-neutral-300 hover:text-primary transition-colors" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      'font-medium text-sm',
                      topic.completed ? 'text-emerald-700 line-through' : 'text-neutral-700'
                    )}
                  >
                    {topic.topicName}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={cn('w-2 h-2 rounded-full', priorityColors[topic.priority])} />
                    <span className="text-xs text-neutral-400">
                      ~{topic.estimatedMinutes} min
                    </span>
                  </div>
                </div>

                <Link
                  to={`/practice?subject=${topic.subjectId}&topic=${topic.topicId}`}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    topic.completed
                      ? 'text-neutral-300 cursor-not-allowed'
                      : 'text-neutral-400 hover:text-primary hover:bg-primary-50'
                  )}
                  onClick={(e) => topic.completed && e.preventDefault()}
                >
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </motion.div>
            ))}

            {/* Today's XP */}
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg mt-3">
              <div className="flex items-center gap-2 text-amber-700">
                <Star className="w-4 h-4" />
                <span className="text-sm font-medium">Today's XP</span>
              </div>
              <span className="text-sm font-bold text-amber-700">
                {todayPlan.xpEarned}/{todayPlan.xpTarget}
              </span>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-300 mx-auto mb-2" />
            <p className="text-neutral-500 font-medium">No study plan for today</p>
            <p className="text-sm text-neutral-400 mt-1">Check back tomorrow!</p>
          </div>
        )}
      </div>

      {/* Week View (Optional) */}
      {showWeekView && (
        <div className="p-4 border-b border-neutral-100">
          <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">
            This Week
          </h4>

          <div className="flex gap-2">
            {studyPlan.slice(0, 7).map((day) => {
              const isToday = day.date === today;
              const completionPercent =
                day.topics.length > 0
                  ? Math.round(
                      (day.topics.filter((t) => t.completed).length / day.topics.length) * 100
                    )
                  : 0;

              return (
                <div
                  key={day.id}
                  className={cn(
                    'flex-1 p-2 rounded-lg text-center',
                    isToday ? 'bg-primary text-white' : 'bg-neutral-50'
                  )}
                >
                  <p className={cn('text-xs font-medium', isToday ? 'text-white/70' : 'text-neutral-500')}>
                    {dayLabels[day.day]}
                  </p>
                  <p className={cn('text-lg font-bold mt-1', isToday ? 'text-white' : 'text-neutral-900')}>
                    {completionPercent}%
                  </p>
                  <div
                    className={cn(
                      'h-1 rounded-full mt-1',
                      isToday ? 'bg-white/30' : 'bg-neutral-200'
                    )}
                  >
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        isToday ? 'bg-white' : 'bg-emerald-500',
                        day.completed && 'bg-emerald-500'
                      )}
                      style={{ width: `${completionPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming Days */}
      {upcomingPlans.length > 0 && (
        <div className="p-4">
          <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">
            Coming Up
          </h4>

          <div className="space-y-2">
            {upcomingPlans.map((day) => (
              <div
                key={day.id}
                className="flex items-center gap-3 p-2 rounded-lg bg-neutral-50"
              >
                <div className="w-10 h-10 rounded-lg bg-neutral-200 flex items-center justify-center text-neutral-600">
                  <span className="text-xs font-bold">{dayLabels[day.day]}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-700">
                    {day.topics.length} topic{day.topics.length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-neutral-400">
                    {day.topics.map((t) => t.topicName).join(', ')}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-amber-500">
                  <Star className="w-3 h-3" />
                  <span className="text-xs font-medium">{day.xpTarget}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View Full Plan */}
      <div className="p-4 bg-neutral-50 border-t border-neutral-100">
        <Link to="/practice">
          <Button variant="outline" fullWidth size="sm" rightIcon={<ChevronRight className="w-4 h-4" />}>
            Start Learning
          </Button>
        </Link>
      </div>
    </Card>
  );
}
