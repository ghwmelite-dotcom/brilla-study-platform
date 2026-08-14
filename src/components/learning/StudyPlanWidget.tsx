import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { AlertCircle, ArrowRight, CalendarDays, Clock3, Compass, RefreshCw, Sparkles } from 'lucide-react';
import { subjects as examSubjects } from '@/data/examData';
import { useExamStore } from '@/stores/examStore';
import { useGuidanceStore, type RoadmapNode, type UserGoal } from '@/stores/guidanceStore';
import { fromGuidanceExamType, getGuidanceSubjects, toGuidanceExamType } from '@/lib/guidanceExamCatalog';

const priorityClasses: Record<RoadmapNode['priority'], string> = {
  critical: 'bg-red-500', high: 'bg-amber-500', medium: 'bg-blue-500', low: 'bg-emerald-500',
};

interface StudyPlanWidgetProps {
  className?: string;
  showWeekView?: boolean;
}

function revisionHref(goal: UserGoal, node: RoadmapNode): string {
  const subjectName = getGuidanceSubjects(fromGuidanceExamType(goal.examType)).find((subject) => subject.id === goal.subjectId)?.name ?? examSubjects.find((subject) => subject.id === goal.subjectId)?.name ?? 'Revision';
  const params = new URLSearchParams({
    exam: goal.examType, subject: goal.subjectId, topic: node.topicId,
    subjectName, topicName: node.topicName,
  });
  return `/revision-classroom?${params.toString()}`;
}

export function StudyPlanWidget({ className = '', showWeekView = false }: StudyPlanWidgetProps) {
  const reduceMotion = useReducedMotion();
  const currentExamType = useExamStore((state) => state.currentExamType);
  const { plan, isLoading, error, fetchGoals, fetchPlan } = useGuidanceStore();
  const [activeGoal, setActiveGoal] = useState<UserGoal | null>(null);

  useEffect(() => {
    let active = true;
    void fetchGoals().then((loadedGoals) => {
      if (!active) return;
      const canonicalExam = toGuidanceExamType(currentExamType);
      setActiveGoal(loadedGoals.find((goal) => goal.examType === canonicalExam) ?? loadedGoals[0] ?? null);
    });
    return () => { active = false; };
  }, [currentExamType, fetchGoals]);

  useEffect(() => {
    if (!activeGoal) return;
    void fetchPlan(activeGoal.examType, activeGoal.subjectId);
  }, [activeGoal, fetchPlan]);

  const refresh = () => {
    if (activeGoal) void fetchPlan(activeGoal.examType, activeGoal.subjectId);
  };

  return (
    <section className={`overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm ${className}`} aria-labelledby="study-plan-widget-title">
      <header className="bg-gradient-to-r from-violet-700 to-indigo-700 p-4 text-white">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15"><Compass className="h-5 w-5" aria-hidden="true" /></span>
            <div>
              <h2 id="study-plan-widget-title" className="font-bold">This Week</h2>
              <p className="text-sm text-violet-100">Counselor Brie's next three moves</p>
            </div>
          </div>
          <button
            type="button"
            onClick={refresh}
            disabled={isLoading || !activeGoal}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-white/15 hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50"
            aria-label="Refresh this week's study plan"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin motion-reduce:animate-none' : ''}`} aria-hidden="true" />
          </button>
        </div>
        {plan && activeGoal && (
          <p className="mt-4 border-t border-white/15 pt-3 text-sm text-violet-100">
            Provisional readiness <strong className="text-white">{Math.round(plan.readiness)}%</strong>
            {plan.confidence ? ` - ${plan.confidence} confidence` : ''}
          </p>
        )}
      </header>

      {error && (
        <div role="alert" className="flex items-start gap-2 border-b border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> {error}
        </div>
      )}

      <div className="p-4">
        {isLoading && !plan ? (
          <div role="status" className="flex items-center justify-center gap-2 py-8 text-sm text-neutral-500">
            <RefreshCw className="h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden="true" /> Loading your plan...
          </div>
        ) : !activeGoal ? (
          <div className="py-7 text-center">
            <Sparkles className="mx-auto h-9 w-9 text-violet-300" aria-hidden="true" />
            <p className="mt-3 font-semibold text-neutral-900">Set your goal to unlock this week</p>
            <Link to="/my-plan" className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-800">Meet Counselor Brie</Link>
          </div>
        ) : plan?.thisWeek.length ? (
          <ol className="space-y-3">
            {plan.thisWeek.map((node, index) => (
              <motion.li
                key={node.topicId}
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.2, delay: reduceMotion ? 0 : index * 0.04 }}
                className="rounded-xl border border-neutral-200 p-3"
              >
                <div className="flex items-start gap-3">
                  <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${priorityClasses[node.priority]}`} aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-neutral-900">{node.topicName}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-neutral-500"><Clock3 className="h-3.5 w-3.5" aria-hidden="true" /> {node.estimatedTime} min - {node.masteryScore}% mastery</p>
                  </div>
                  <Link
                    to={revisionHref(activeGoal, node)}
                    className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl text-violet-700 hover:bg-violet-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
                    aria-label={`Start ${node.topicName}`}
                  ><ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
                </div>
              </motion.li>
            ))}
          </ol>
        ) : (
          <div className="py-7 text-center text-neutral-600">
            <CalendarDays className="mx-auto h-9 w-9 text-neutral-300" aria-hidden="true" />
            <p className="mt-3 font-medium">No focus topics are available yet.</p>
          </div>
        )}

        <Link
          to="/my-plan"
          className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-800 hover:bg-violet-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
        >
          {showWeekView ? 'Open complete roadmap' : 'View My Plan'} <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
