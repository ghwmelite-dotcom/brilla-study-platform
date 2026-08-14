import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Brain, CheckCircle2, Info, Sparkles, X } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useExamPreferencesStore } from '@/stores/examPreferencesStore';
import { useExamStore } from '@/stores/examStore';
import { useGuidanceStore } from '@/stores/guidanceStore';
import type { ExamTypeSlug } from '@/types';
import { toSafeInternalPath } from '@/utils/navigation';
import {
  GUIDANCE_EXAM_OPTIONS,
  getGuidanceGradeScale,
  getGuidanceSubjects,
  markBrieDismissed,
  toGuidanceExamType,
} from '@/lib/guidanceExamCatalog';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function inputClassName(): string {
  return 'w-full rounded-xl border border-neutral-300 bg-white px-3 py-3 text-neutral-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white';
}

export function CounselorBrieWizard() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const currentExamType = useExamStore((state) => state.currentExamType);
  const preferences = useExamPreferencesStore((state) => state.preferences);
  const {
    wizardOpen,
    currentQuestion,
    askedSoFar,
    target,
    readiness,
    evidence,
    plan,
    lastAnswer,
    activeExamType,
    activeSubjectId,
    isLoading,
    error,
    saveGoal,
    startAssessment,
    submitAnswer,
    closeWizard,
  } = useGuidanceStore();

  const [selectedExam, setSelectedExam] = useState<ExamTypeSlug>(currentExamType);
  const [subjectId, setSubjectId] = useState('');
  const [targetGrade, setTargetGrade] = useState('');
  const [examMonth, setExamMonth] = useState('');
  const [examYear, setExamYear] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const openedFromRef = useRef<HTMLElement | null>(null);
  const questionStartedAtRef = useRef(Date.now());
  const dismissRef = useRef<() => void>(() => undefined);

  const subjects = useMemo(() => getGuidanceSubjects(selectedExam), [selectedExam]);
  const grades = getGuidanceGradeScale(selectedExam);
  const screen = currentQuestion ? 'quiz' : readiness !== null || plan ? 'reveal' : 'intake';

  useEffect(() => {
    const first = subjects[0];
    setSubjectId((current) => subjects.some((subject) => subject.id === current) ? current : first?.id ?? '');
    setTargetGrade('');
    const preferredYear = preferences.find((preference) => preference.slug === selectedExam)?.targetYear;
    setExamYear(preferredYear ? String(preferredYear) : '');
  }, [preferences, selectedExam, subjects]);

  useEffect(() => {
    questionStartedAtRef.current = Date.now();
  }, [currentQuestion?.id]);

  const dismiss = () => {
    const examType = activeExamType ?? toGuidanceExamType(selectedExam);
    const selectedSubject = activeSubjectId ?? subjectId;
    if (user && selectedSubject) markBrieDismissed(user.id, examType, selectedSubject);
    closeWizard();
  };
  dismissRef.current = dismiss;

  useEffect(() => {
    if (!wizardOpen) return;
    openedFromRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.requestAnimationFrame(() => dialogRef.current?.focus());

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        dismissRef.current();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), select:not([disabled]), input:not([disabled]), a[href]'
        )
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      openedFromRef.current?.focus();
    };
  }, [wizardOpen]);

  if (!wizardOpen) return null;

  const submitGoal = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);
    if (!subjectId) {
      setFormError('Choose a subject to continue.');
      return;
    }
    if (grades.length > 0 && !targetGrade) {
      setFormError('Choose the grade you are working towards.');
      return;
    }

    const year = examYear ? Number(examYear) : undefined;
    const month = examMonth ? Number(examMonth) : undefined;
    if (year && month) {
      const now = new Date();
      if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) {
        setFormError('Choose an exam month that has not passed.');
        return;
      }
    }

    const examType = toGuidanceExamType(selectedExam);
    const saved = await saveGoal({
      examType,
      subjectId,
      targetGrade: grades.length > 0 ? targetGrade : undefined,
      examYear: year,
      examMonth: month,
    });
    if (saved) await startAssessment(examType, subjectId);
  };

  const answerQuestion = async (answer: string) => {
    if (!currentQuestion || isLoading) return;
    const timeTaken = Math.max(0, Math.round((Date.now() - questionStartedAtRef.current) / 1000));
    await submitAnswer(currentQuestion.id, answer, timeTaken);
  };

  const startRoute = () => {
    const href = plan?.thisWeek[0]?.href ?? '/my-plan';
    dismiss();
    navigate(toSafeInternalPath(href, '/my-plan'));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="brie-dialog-title"
        aria-describedby="brie-guide-notice"
        tabIndex={-1}
        className="relative flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl outline-none dark:bg-slate-900 motion-reduce:transition-none"
      >
        <header className="flex items-center gap-3 bg-gradient-to-r from-primary to-accent px-5 py-4 text-white">
          <div className="rounded-full bg-white/20 p-2" aria-hidden="true"><Sparkles className="h-6 w-6" /></div>
          <div className="min-w-0 flex-1">
            <h2 id="brie-dialog-title" className="text-xl font-bold">Counselor Brie</h2>
            <p className="text-sm text-white/85">A clear route from where you are to where you want to be.</p>
          </div>
          <button type="button" onClick={dismiss} aria-label="Close Counselor Brie" className="rounded-full p-2 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white">
            <X className="h-5 w-5" />
          </button>
        </header>

        <main className="overflow-y-auto p-5 sm:p-7">
          <p id="brie-guide-notice" className="mb-5 flex gap-2 rounded-xl bg-blue-50 p-3 text-sm text-blue-900 dark:bg-blue-950/40 dark:text-blue-100">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            Brie is an AI academic guide, not a human counselor. Use this plan as study guidance and ask a teacher when you need expert support.
          </p>

          {(formError || error) && <div role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{formError || error}</div>}

          {screen === 'intake' && (
            <form onSubmit={submitGoal} className="space-y-5">
              <div>
                <h3 className="text-2xl font-bold text-neutral-900 dark:text-white">Let's shape your study goal</h3>
                <p className="mt-1 text-neutral-600 dark:text-slate-300">Choose one exam and subject. Brie will check your current level before building the route.</p>
              </div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-slate-200">
                Exam
                <select aria-label="Exam" value={selectedExam} onChange={(event) => setSelectedExam(event.target.value as ExamTypeSlug)} className={`mt-1 ${inputClassName()}`}>
                  {GUIDANCE_EXAM_OPTIONS.map((exam) => <option key={exam.slug} value={exam.slug}>{exam.label}</option>)}
                </select>
              </label>
              <label className="block text-sm font-medium text-neutral-700 dark:text-slate-200">
                Subject
                <select aria-label="Subject" value={subjectId} onChange={(event) => setSubjectId(event.target.value)} className={`mt-1 ${inputClassName()}`}>
                  <option value="">Choose a subject</option>
                  {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
                </select>
              </label>
              {grades.length > 0 && (
                <label className="block text-sm font-medium text-neutral-700 dark:text-slate-200">
                  Target grade
                  <select aria-label="Target grade" value={targetGrade} onChange={(event) => setTargetGrade(event.target.value)} className={`mt-1 ${inputClassName()}`}>
                    <option value="">Choose a target</option>
                    {grades.map((grade) => <option key={grade} value={grade}>{grade}</option>)}
                  </select>
                </label>
              )}
              <fieldset>
                <legend className="text-sm font-medium text-neutral-700 dark:text-slate-200">Exam date (optional)</legend>
                <div className="mt-1 grid grid-cols-2 gap-3">
                  <select aria-label="Exam month" value={examMonth} onChange={(event) => setExamMonth(event.target.value)} className={inputClassName()}>
                    <option value="">Month</option>
                    {MONTHS.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}
                  </select>
                  <select aria-label="Exam year" value={examYear} onChange={(event) => setExamYear(event.target.value)} className={inputClassName()}>
                    <option value="">Year</option>
                    {Array.from({ length: 6 }, (_, index) => new Date().getFullYear() + index).map((year) => <option key={year} value={year}>{year}</option>)}
                  </select>
                </div>
              </fieldset>
              <button disabled={isLoading} type="submit" className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-60">
                {isLoading ? 'Preparing your check...' : "Let's find your starting point"}
              </button>
              <button type="button" onClick={dismiss} className="w-full rounded-lg py-2 text-sm text-neutral-500 hover:text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary">Maybe later</button>
            </form>
          )}

          {screen === 'quiz' && currentQuestion && (
            <section aria-labelledby="brie-question-heading">
              <div className="mb-5 flex items-center justify-between text-sm text-neutral-500">
                <span>Question {askedSoFar + 1} of about {target}</span>
                <span className="capitalize">{currentQuestion.difficulty}</span>
              </div>
              <div className="mb-4 h-2 overflow-hidden rounded-full bg-neutral-100" aria-hidden="true"><div className="h-full bg-primary transition-[width] motion-reduce:transition-none" style={{ width: `${Math.min(100, (askedSoFar / target) * 100)}%` }} /></div>
              {currentQuestion.topicName && <p className="mb-2 text-sm font-medium text-primary">{currentQuestion.topicName}</p>}
              <h3 id="brie-question-heading" className="text-xl font-semibold text-neutral-900 dark:text-white">{currentQuestion.questionText}</h3>
              <p className="mt-2 text-sm text-neutral-500">Take your best shot - this is a level check, not a final exam.</p>
              {lastAnswer && <div role="status" aria-live="polite" className={`mt-4 rounded-lg p-3 text-sm ${lastAnswer.correct ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900'}`}>{lastAnswer.correct ? 'Good reasoning.' : 'That one needs another look.'} {lastAnswer.explanation}</div>}
              <div className="mt-6 grid gap-3">
                {(currentQuestion.options?.length ? currentQuestion.options : ['True', 'False']).map((option) => (
                  <button key={option} type="button" disabled={isLoading} onClick={() => answerQuestion(option)} className="min-h-12 rounded-xl border-2 border-neutral-200 px-4 py-3 text-left font-medium text-neutral-800 hover:border-primary hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60 dark:border-slate-700 dark:text-white">
                    {option}
                  </button>
                ))}
              </div>
            </section>
          )}

          {screen === 'reveal' && (
            <section className="text-center" aria-labelledby="brie-result-heading">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" aria-hidden="true" />
              <h3 id="brie-result-heading" className="mt-3 text-2xl font-bold text-neutral-900 dark:text-white">Your provisional readiness estimate</h3>
              <div className="my-5 text-6xl font-black text-primary" aria-label={`Readiness ${readiness ?? plan?.readiness ?? 0} out of 100`}>{readiness ?? plan?.readiness ?? 0}<span className="text-2xl">/100</span></div>
              <p className="mx-auto max-w-xl text-neutral-700 dark:text-slate-200">{plan?.narrative ?? 'Brie is turning this evidence into your first study route.'}</p>
              {evidence && (
                <div className="mx-auto mt-5 grid max-w-lg grid-cols-3 gap-2 text-left text-xs">
                  <div className="rounded-lg bg-neutral-50 p-3 dark:bg-slate-800"><strong className="block text-base">{evidence.evidenceCount}</strong>answers</div>
                  <div className="rounded-lg bg-neutral-50 p-3 dark:bg-slate-800"><strong className="block text-base">{evidence.topicCoverage.covered}/{evidence.topicCoverage.total}</strong>topics</div>
                  <div className="rounded-lg bg-neutral-50 p-3 capitalize dark:bg-slate-800"><strong className="block text-base">{evidence.confidence}</strong>confidence</div>
                </div>
              )}
              {evidence?.completedEarly && <p className="mt-4 text-sm text-amber-700">The question bank ended early, so treat this estimate with extra caution.</p>}
              {plan?.thisWeek?.length ? (
                <div className="mt-6 text-left"><h4 className="mb-2 font-semibold">Your first focus</h4>{plan.thisWeek.slice(0, 3).map((node) => <div key={node.topicId} className="mb-2 flex items-center gap-2 rounded-lg border border-neutral-200 p-3"><BookOpen className="h-4 w-4 text-primary" /><span>{node.topicName}</span></div>)}</div>
              ) : null}
              <button type="button" disabled={isLoading} onClick={startRoute} className="mt-6 w-full rounded-xl bg-primary px-4 py-3 font-semibold text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                <Brain className="mr-2 inline h-5 w-5" />Start my route
              </button>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
