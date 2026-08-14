import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Compass,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react';
import { subjects as examSubjects } from '@/data/examData';
import {
  GUIDANCE_EXAM_OPTIONS,
  fromGuidanceExamType,
  getGuidanceSubjects,
  toGuidanceExamType,
  type GuidanceExamType,
} from '@/lib/guidanceExamCatalog';
import { useExamStore } from '@/stores/examStore';
import {
  useGuidanceStore,
  type BriePlan,
  type RoadmapNode,
  type UserGoal,
} from '@/stores/guidanceStore';

const priorityStyles: Record<RoadmapNode['priority'], { label: string; classes: string }> = {
  critical: { label: 'Critical', classes: 'bg-red-50 text-red-700 border-red-200' },
  high: { label: 'High', classes: 'bg-amber-50 text-amber-800 border-amber-200' },
  medium: { label: 'Medium', classes: 'bg-blue-50 text-blue-700 border-blue-200' },
  low: { label: 'Maintain', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

function goalKey(goal: Pick<UserGoal, 'examType' | 'subjectId'>): string {
  return `${goal.examType}:${goal.subjectId}`;
}

function subjectName(subjectId: string, examType?: GuidanceExamType): string {
  if (examType) {
    const match = getGuidanceSubjects(fromGuidanceExamType(examType)).find((subject) => subject.id === subjectId);
    if (match) return match.name;
  }
  return examSubjects.find((subject) => subject.id === subjectId)?.name ?? 'Your subject';
}

function examName(examType: string): string {
  return GUIDANCE_EXAM_OPTIONS.find((exam) => exam.apiId === examType)?.label ?? examType;
}

function buildRevisionHref(examType: string, subjectId: string, node: RoadmapNode): string {
  const params = new URLSearchParams({
    exam: examType,
    subject: subjectId,
    topic: node.topicId,
    subjectName: subjectName(subjectId, examType as GuidanceExamType),
    topicName: node.topicName,
  });
  return `/revision-classroom?${params.toString()}`;
}

function formatExamDate(goal: UserGoal): string | null {
  if (goal.examYear === null && goal.examMonth === null) return null;
  if (goal.examYear === null) {
    return new Intl.DateTimeFormat(undefined, { month: 'long' }).format(
      new Date(Date.UTC(2024, Math.max(0, (goal.examMonth ?? 1) - 1), 1)),
    );
  }

  const monthIndex = Math.max(0, (goal.examMonth ?? 12) - 1);
  return new Intl.DateTimeFormat(undefined, {
    month: goal.examMonth === null ? undefined : 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(goal.examYear, monthIndex, 1)));
}

function daysUntilExam(goal: UserGoal): number | null {
  if (goal.examYear === null) return null;
  const monthIndex = Math.max(0, (goal.examMonth ?? 12) - 1);
  const examDate = Date.UTC(goal.examYear, monthIndex + 1, 0, 23, 59, 59);
  return Math.max(0, Math.ceil((examDate - Date.now()) / 86_400_000));
}

function formatFreshness(value: string | null | undefined): string {
  if (!value) return 'No recent evidence yet';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  const days = Math.max(0, Math.floor((Date.now() - parsed.getTime()) / 86_400_000));
  if (days === 0) return 'Updated today';
  if (days === 1) return 'Updated yesterday';
  return `Updated ${days} days ago`;
}

function readinessCaption(source: BriePlan['readinessSource']): string {
  if (source === 'assessment') return 'from your level check';
  if (source === 'mastery') return 'from your recent practice history';
  return 'take the level check to improve this estimate';
}

function ReadinessGauge({ value }: { value: number }) {
  const reduceMotion = useReducedMotion();
  const safeValue = Math.min(100, Math.max(0, Math.round(value)));
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - safeValue / 100);

  return (
    <div
      className="relative h-36 w-36 shrink-0"
      role="img"
      aria-label={`Provisional readiness estimate ${safeValue} out of 100`}
    >
      <svg className="h-full w-full -rotate-90" viewBox="0 0 128 128" aria-hidden="true">
        <circle cx="64" cy="64" r={radius} fill="none" stroke="currentColor" strokeWidth="10" className="text-violet-100" />
        <motion.circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={reduceMotion ? false : { strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: reduceMotion ? 0 : 0.7, ease: 'easeOut' }}
          className="text-violet-600"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-3xl font-black text-neutral-900">{safeValue}%</span>
      </div>
    </div>
  );
}

function RoadmapCard({
  node,
  examType,
  subjectId,
  compact = false,
}: {
  node: RoadmapNode;
  examType: string;
  subjectId: string;
  compact?: boolean;
}) {
  const priority = priorityStyles[node.priority];
  return (
    <article className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${priority.classes}`}>
            {priority.label}
          </span>
          <h3 className="mt-3 font-semibold text-neutral-950">{node.topicName}</h3>
          <p className="mt-1 text-sm text-neutral-600">
            {node.masteryScore}% mastery · {node.questionsAttempted} question{node.questionsAttempted === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1 text-sm text-neutral-500">
          <Clock3 className="h-4 w-4" aria-hidden="true" />
          {node.estimatedTime} min
        </div>
      </div>
      <Link
        to={buildRevisionHref(examType, subjectId, node)}
        className={`mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 ${compact ? 'w-full' : ''}`}
        aria-label={`Start ${node.topicName}`}
      >
        Start <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </article>
  );
}

export function MyPlan() {
  const navigate = useNavigate();
  const currentExamType = useExamStore((state) => state.currentExamType);
  const setExamType = useExamStore((state) => state.setExamType);
  const {
    goals,
    plan,
    isLoading,
    error,
    fetchGoals,
    fetchPlan,
    regeneratePlan,
    startAssessment,
    openWizard,
    resetQuiz,
  } = useGuidanceStore();
  const [selectedGoalKey, setSelectedGoalKey] = useState('');
  const [upgradeRequired, setUpgradeRequired] = useState(false);
  const [isRetaking, setIsRetaking] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const selectedGoal = useMemo(
    () => goals.find((goal) => goalKey(goal) === selectedGoalKey) ?? null,
    [goals, selectedGoalKey],
  );

  useEffect(() => {
    void fetchGoals();
  }, [fetchGoals]);

  useEffect(() => {
    if (goals.length === 0 || selectedGoalKey) return;
    const matchingCurrentExam = goals.find(
      (goal) => goal.examType === toGuidanceExamType(currentExamType),
    );
    setSelectedGoalKey(goalKey(matchingCurrentExam ?? goals[0]));
  }, [currentExamType, goals, selectedGoalKey]);

  useEffect(() => {
    if (!selectedGoal) return;
    void fetchPlan(selectedGoal.examType, selectedGoal.subjectId);
  }, [fetchPlan, selectedGoal]);

  const currentPlan = plan;

  const handleGoalChange = (key: string) => {
    setSelectedGoalKey(key);
    setUpgradeRequired(false);
    const goal = goals.find((candidate) => goalKey(candidate) === key);
    if (goal) setExamType(fromGuidanceExamType(goal.examType));
  };

  const handleRetake = async () => {
    if (!selectedGoal || isRetaking) return;
    setIsRetaking(true);
    resetQuiz();
    try {
      let result = await startAssessment(selectedGoal.examType, selectedGoal.subjectId);
      if (result === 'skip' || result === 'complete') {
        result = await startAssessment(selectedGoal.examType, selectedGoal.subjectId, {
          forceRetake: true,
        });
      }
      if (result === 'quiz') {
        openWizard();
      } else if (result === 'skip' || result === 'complete') {
        await fetchPlan(selectedGoal.examType, selectedGoal.subjectId);
      }
    } finally {
      setIsRetaking(false);
    }
  };

  const handleRegenerate = async () => {
    if (!selectedGoal || isRegenerating) return;
    setIsRegenerating(true);
    setUpgradeRequired(false);
    try {
      const result = await regeneratePlan(selectedGoal.examType, selectedGoal.subjectId);
      setUpgradeRequired(result === 'premium_required');
    } finally {
      setIsRegenerating(false);
    }
  };

  if (!isLoading && goals.length === 0) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <section className="rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 to-amber-50 p-8 text-center shadow-sm">
          <Compass className="mx-auto h-12 w-12 text-violet-700" aria-hidden="true" />
          <h1 className="mt-4 text-3xl font-black text-neutral-950">Build your route with Counselor Brie</h1>
          <p className="mx-auto mt-3 max-w-xl text-neutral-700">
            Set an exam goal and take a short level check to get one focused study plan.
          </p>
          <button
            type="button"
            onClick={openWizard}
            className="mt-6 min-h-12 rounded-xl bg-violet-700 px-6 py-3 font-semibold text-white hover:bg-violet-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2"
          >
            Meet Brie
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-violet-700">
            <Sparkles className="h-4 w-4" aria-hidden="true" /> Counselor Brie
          </div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-neutral-950 sm:text-4xl">My Plan</h1>
          <p className="mt-2 max-w-2xl text-neutral-600">Your goal, this week’s focus, and the route ahead in one place.</p>
        </div>
        {goals.length > 1 && (
          <div>
            <label htmlFor="goal-selector" className="mb-1 block text-sm font-medium text-neutral-700">Plan</label>
            <select
              id="goal-selector"
              value={selectedGoalKey}
              onChange={(event) => handleGoalChange(event.target.value)}
              className="min-h-11 rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-900 focus:border-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-200"
            >
              {goals.map((goal) => (
                <option key={goal.id} value={goalKey(goal)}>
                  {examName(goal.examType)} · {subjectName(goal.subjectId)}
                </option>
              ))}
            </select>
          </div>
        )}
      </header>

      {error && (
        <div role="alert" className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p>{error}</p>
        </div>
      )}

      {isLoading && !currentPlan ? (
        <div role="status" className="mt-8 flex items-center justify-center gap-3 rounded-2xl border border-neutral-200 bg-white p-10 text-neutral-600">
          <RefreshCw className="h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
          Loading your plan…
        </div>
      ) : currentPlan && selectedGoal ? (
        <>
          <section aria-labelledby="goal-heading" className="mt-8 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            <article className="rounded-3xl bg-gradient-to-br from-violet-800 via-violet-700 to-indigo-800 p-6 text-white shadow-lg sm:p-8">
              <div className="flex items-center gap-2 text-sm font-semibold text-violet-100">
                <Target className="h-4 w-4" aria-hidden="true" /> Your goal
              </div>
              <h2 id="goal-heading" className="mt-3 text-2xl font-black">
                {selectedGoal.targetGrade ? `${selectedGoal.targetGrade} in ` : ''}{subjectName(selectedGoal.subjectId, selectedGoal.examType)}
              </h2>
              <p className="mt-1 text-violet-100">{examName(selectedGoal.examType)}</p>
              {formatExamDate(selectedGoal) && (
                <div className="mt-6 flex flex-wrap gap-3 text-sm">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
                    <CalendarDays className="h-4 w-4" aria-hidden="true" /> {formatExamDate(selectedGoal)}
                  </span>
                  {daysUntilExam(selectedGoal) !== null && (
                    <span className="inline-flex items-center rounded-full bg-amber-300 px-3 py-2 font-bold text-amber-950">
                      {daysUntilExam(selectedGoal)} days remaining
                    </span>
                  )}
                </div>
              )}
            </article>

            <article className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <ReadinessGauge value={currentPlan.readiness} />
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-700">Provisional readiness estimate</p>
                  <p className="mt-2 text-sm text-neutral-600">{readinessCaption(currentPlan.readinessSource)}</p>
                  <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3 text-sm">
                    <div><dt className="text-neutral-500">Confidence</dt><dd className="font-semibold capitalize text-neutral-900">{currentPlan.confidence ?? 'Building'}</dd></div>
                    <div><dt className="text-neutral-500">Evidence</dt><dd className="font-semibold text-neutral-900">{currentPlan.evidenceCount ?? 0} attempts</dd></div>
                    <div><dt className="text-neutral-500">Coverage</dt><dd className="font-semibold text-neutral-900">{Math.round(currentPlan.topicCoverage.ratio * 100)}% ({currentPlan.topicCoverage.covered}/{currentPlan.topicCoverage.total} topics)</dd></div>
                    <div><dt className="text-neutral-500">Freshness</dt><dd className="font-semibold text-neutral-900">{formatFreshness(currentPlan.freshness)}</dd></div>
                  </dl>
                </div>
              </div>
              {currentPlan.completedEarly && (
                <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                  The question bank ended early, so this estimate carries less evidence than planned.
                </p>
              )}
              <p className="mt-4 flex items-start gap-2 text-xs text-neutral-500">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                Brie is an AI academic guide, not a human counselor. This estimate sharpens as you practise.
                {currentPlan.algorithmVersion ? ` Method ${currentPlan.algorithmVersion}.` : ''}
              </p>
            </article>
          </section>

          <section aria-labelledby="this-week-heading" className="mt-10">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-violet-700">Your next three moves</p>
                <h2 id="this-week-heading" className="mt-1 text-2xl font-black text-neutral-950">This Week</h2>
              </div>
              <BookOpen className="h-7 w-7 text-violet-300" aria-hidden="true" />
            </div>
            {currentPlan.thisWeek.length > 0 ? (
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {currentPlan.thisWeek.map((node) => (
                  <RoadmapCard key={node.topicId} node={node} examType={selectedGoal.examType} subjectId={selectedGoal.subjectId} compact />
                ))}
              </div>
            ) : (
              <p className="mt-5 rounded-2xl border border-neutral-200 bg-white p-6 text-neutral-600">No focus topics are available yet.</p>
            )}
          </section>

          <section aria-labelledby="roadmap-heading" className="mt-10">
            <h2 id="roadmap-heading" className="text-2xl font-black text-neutral-950">Your Roadmap</h2>
            <p className="mt-1 text-neutral-600">Weakest areas first, with syllabus order preserved inside each priority.</p>
            <ol className="mt-5 space-y-4">
              {currentPlan.roadmap.map((node, index) => (
                <li key={node.topicId} className="grid gap-3 sm:grid-cols-[44px_1fr] sm:items-stretch">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-100 font-black text-violet-800" aria-hidden="true">{index + 1}</div>
                  <RoadmapCard node={node} examType={selectedGoal.examType} subjectId={selectedGoal.subjectId} />
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="brie-note-heading" className="mt-10 rounded-3xl border border-amber-200 bg-amber-50 p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-300 text-amber-950"><Sparkles className="h-5 w-5" aria-hidden="true" /></div>
              <div>
                <h2 id="brie-note-heading" className="font-black text-neutral-950">Brie’s note</h2>
                <p className="mt-2 leading-7 text-neutral-700">{currentPlan.narrative}</p>
              </div>
            </div>
          </section>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void handleRetake()}
              disabled={isRetaking}
              className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-violet-300 bg-white px-5 py-3 font-semibold text-violet-800 hover:bg-violet-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
            >
              <RotateCcw className={`h-4 w-4 ${isRetaking ? 'animate-spin motion-reduce:animate-none' : ''}`} aria-hidden="true" />
              {isRetaking ? 'Opening level check...' : 'Continue or retake level check'}
            </button>
            <button
              type="button"
              onClick={() => void handleRegenerate()}
              disabled={isRegenerating}
              className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-neutral-950 px-5 py-3 font-semibold text-white hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-700 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${isRegenerating ? 'animate-spin motion-reduce:animate-none' : ''}`} aria-hidden="true" />
              {isRegenerating ? 'Refreshing…' : 'Regenerate Brie’s note'}
            </button>
          </div>

          {upgradeRequired && (
            <div role="status" className="mt-4 flex flex-col gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-950 sm:flex-row sm:items-center sm:justify-between">
              <p><strong>Premium feature:</strong> Your plan stays free; upgrading lets Brie regenerate a fresh coaching note on demand.</p>
              <Link to="/pricing" className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-amber-900 px-4 py-2 font-semibold text-white hover:bg-amber-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-800 focus-visible:ring-offset-2">View plans</Link>
            </div>
          )}
        </>
      ) : (
        <section className="mt-8 rounded-2xl border border-neutral-200 bg-white p-8 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-neutral-300" aria-hidden="true" />
          <p className="mt-3 font-semibold text-neutral-900">Choose a goal to load its plan.</p>
          <button type="button" onClick={() => navigate('/dashboard')} className="mt-4 text-sm font-semibold text-violet-700 underline">Back to dashboard</button>
        </section>
      )}
    </main>
  );
}

export default MyPlan;
