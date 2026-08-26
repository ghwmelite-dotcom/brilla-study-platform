import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  FileText,
  Filter,
  GraduationCap,
  LayoutGrid,
  List,
  Lock,
  Search,
} from 'lucide-react';
import { Badge, Button, Card } from '@/components/common';
import { DailyUsageIndicator, PremiumSubjectBadge } from '@/components/subscription';
import { useExamStore } from '@/stores/examStore';
import { useAuthStore } from '@/stores/authStore';
import { useUsageStore } from '@/stores/usageStore';
import { isCoreSubject } from '@/config';
import { cn } from '@/utils';
import type { Subject, SubjectCategory } from '@/types';
import { getSubjectIcon } from '@/lib/subjectIcons';

const examTypeLabelMap: Record<string, string> = {
  nsmq: 'NSMQ',
  wassce: 'WASSCE',
  bece: 'BECE',
  igcse: 'Cambridge IGCSE',
  'cambridge-a-level': 'Cambridge A-Level',
  'cambridge-as': 'Cambridge AS-Level',
  'edexcel-igcse': 'Edexcel IGCSE',
  'edexcel-as': 'Edexcel AS-Level',
  'edexcel-a-level': 'Edexcel A-Level',
};

const availabilityOrder: Record<NonNullable<Subject['availabilityStatus']>, number> = {
  available: 0,
  limited: 1,
  unavailable: 2,
  unknown: 3,
};

function getAvailabilityLabel(subject: Subject): string {
  if (subject.availabilityStatus === 'available') return 'Available';
  if (subject.availabilityStatus === 'limited') return 'Limited bank';
  if (subject.availabilityStatus === 'unavailable') return 'Not yet available';
  return 'Checking availability';
}

export function SubjectCatalogPage() {
  const navigate = useNavigate();
  const {
    currentExamType,
    subjects,
    categories,
    isLoadingSubjects,
    error,
    initializeExamData,
    fetchSubjects,
    fetchCategories,
  } = useExamStore();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { dailyUsage, fetchDailyUsage } = useUsageStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const isPremiumUser = dailyUsage?.isUnlimited || dailyUsage?.isPremium || false;

  useEffect(() => {
    initializeExamData();
  }, [initializeExamData]);

  useEffect(() => {
    if (isAuthenticated) void fetchDailyUsage();
  }, [fetchDailyUsage, isAuthenticated]);

  useEffect(() => {
    fetchCategories(currentExamType);
    void fetchSubjects(currentExamType);
    setSelectedCategory('all');
    setExpandedCategories(new Set());
  }, [currentExamType, fetchCategories, fetchSubjects]);

  useEffect(() => {
    if (categories.length > 0 && expandedCategories.size === 0) {
      const defaults = categories.filter((category) => category.isCore).map((category) => category.id);
      setExpandedCategories(new Set(defaults.length > 0 ? defaults : [categories[0].id]));
    }
  }, [categories, expandedCategories.size]);

  const availabilityKnown = !isLoadingSubjects
    && !error
    && subjects.every((subject) => subject.availabilityStatus !== 'unknown');
  const availabilitySummary = useMemo(() => ({
    available: subjects.filter((subject) => subject.availabilityStatus === 'available').length,
    limited: subjects.filter((subject) => subject.availabilityStatus === 'limited').length,
    unavailable: subjects.filter((subject) => subject.availabilityStatus === 'unavailable').length,
  }), [subjects]);

  const filteredSubjects = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return subjects
      .filter((subject) => (
        (!query
          || subject.name.toLowerCase().includes(query)
          || subject.description?.toLowerCase().includes(query))
        && (selectedCategory === 'all' || subject.categoryId === selectedCategory)
      ))
      .sort((left, right) => {
        const statusDifference = availabilityOrder[left.availabilityStatus ?? 'unknown']
          - availabilityOrder[right.availabilityStatus ?? 'unknown'];
        return statusDifference || left.displayOrder - right.displayOrder || left.name.localeCompare(right.name);
      });
  }, [searchQuery, selectedCategory, subjects]);

  const subjectsByCategory = useMemo(() => {
    const grouped: Record<string, Subject[]> = {};
    categories.forEach((category) => {
      grouped[category.id] = filteredSubjects.filter((subject) => subject.categoryId === category.id);
    });
    grouped.uncategorized = filteredSubjects.filter(
      (subject) => !subject.categoryId || !categories.some((category) => category.id === subject.categoryId),
    );
    return grouped;
  }, [categories, filteredSubjects]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((current) => {
      const next = new Set(current);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  };

  const renderSubject = (subject: Subject) => (
    <SubjectCard
      key={subject.id}
      subject={subject}
      viewMode={viewMode}
      isLocked={
        subject.availabilityStatus !== 'unavailable'
        && !isPremiumUser
        && !isCoreSubject(currentExamType, subject.slug)
      }
      onLockedClick={() => navigate('/pricing')}
    />
  );

  const categorySections: Array<SubjectCategory & { subjects: Subject[] }> = [
    ...categories.map((category) => ({ ...category, subjects: subjectsByCategory[category.id] || [] })),
    ...(subjectsByCategory.uncategorized.length > 0 ? [{
      id: 'uncategorized',
      examTypeId: '',
      name: 'Other subjects',
      slug: 'other',
      description: 'Subjects awaiting catalogue categorization',
      isCore: false,
      displayOrder: 9999,
      subjects: subjectsByCategory.uncategorized,
    }] : []),
  ];

  return (
    <main className="p-4 sm:p-6 max-w-7xl mx-auto" aria-busy={isLoadingSubjects}>
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-indigo-100">
            <GraduationCap aria-hidden="true" className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">
              {examTypeLabelMap[currentExamType] || currentExamType.toUpperCase()} Subject Catalogue
            </h1>
            <p className="text-neutral-600">
              {isLoadingSubjects
                ? 'Loading live question-bank availability'
                : error
                  ? 'Live question-bank availability is unavailable'
                  : `Live question-bank availability across ${subjects.length} subjects`}
            </p>
          </div>
        </div>
        {dailyUsage && !dailyUsage.isUnlimited && <DailyUsageIndicator variant="compact" />}
      </header>

      <Card className="mb-6 p-4">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <label htmlFor="subject-search" className="sr-only">Search subjects</label>
            <Search aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              id="subject-search"
              type="search"
              placeholder="Search subjects"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="min-h-12 w-full rounded-lg border border-neutral-200 py-2.5 pl-11 pr-4 focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="relative">
            <label htmlFor="subject-category" className="sr-only">Filter by category</label>
            <Filter aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <select
              id="subject-category"
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              className="min-h-12 min-w-[190px] appearance-none rounded-lg border border-neutral-200 bg-white py-2.5 pl-10 pr-9 focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
            <ChevronDown aria-hidden="true" className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
          </div>

          <div className="flex min-h-12 gap-1 rounded-lg bg-neutral-100 p-1" role="group" aria-label="Catalogue view">
            <button
              type="button"
              aria-pressed={viewMode === 'grid'}
              aria-label="Grid view"
              onClick={() => setViewMode('grid')}
              className={cn('min-w-12 rounded px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary', viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-neutral-600')}
            >
              <LayoutGrid aria-hidden="true" className="mx-auto w-5 h-5" />
            </button>
            <button
              type="button"
              aria-pressed={viewMode === 'list'}
              aria-label="List view"
              onClick={() => setViewMode('list')}
              className={cn('min-w-12 rounded px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary', viewMode === 'list' ? 'bg-white shadow-sm' : 'text-neutral-600')}
            >
              <List aria-hidden="true" className="mx-auto w-5 h-5" />
            </button>
          </div>
        </div>
      </Card>

      <section aria-label="Catalogue availability summary" className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-3">
        <AvailabilitySummaryCard icon={CheckCircle2} label="Available now" count={availabilityKnown ? availabilitySummary.available : null} tone="emerald" />
        <AvailabilitySummaryCard icon={Clock3} label="Limited banks" count={availabilityKnown ? availabilitySummary.limited : null} tone="amber" />
        <AvailabilitySummaryCard icon={BookOpen} label="Not yet available" count={availabilityKnown ? availabilitySummary.unavailable : null} tone="neutral" />
      </section>

      {isLoadingSubjects ? (
        <div role="status" className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <span className="sr-only">Loading live subject availability</span>
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <Card key={item} className="h-48 animate-pulse bg-neutral-100" />
          ))}
        </div>
      ) : error ? (
        <Card className="p-8 text-center" role="alert">
          <AlertCircle aria-hidden="true" className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h2 className="font-semibold text-neutral-900">Live availability could not be loaded</h2>
          <p className="mt-2 text-neutral-600">{error}</p>
          <Button className="mt-4" onClick={() => void fetchSubjects(currentExamType)}>
            Try again
          </Button>
        </Card>
      ) : selectedCategory === 'all' ? (
        <div className="space-y-6">
          {categorySections.map((category) => {
            if (category.subjects.length === 0) return null;
            const isExpanded = expandedCategories.has(category.id);
            const readyCount = category.subjects.filter((subject) => subject.availabilityStatus === 'available').length;
            const regionId = `subject-category-${category.id}`;
            return (
              <section key={category.id} className="overflow-hidden rounded-xl border border-neutral-200">
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  aria-controls={regionId}
                  onClick={() => toggleCategory(category.id)}
                  className="flex min-h-14 w-full items-center justify-between gap-4 bg-neutral-50 p-4 text-left transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                >
                  <div className="flex items-start gap-3">
                    {isExpanded
                      ? <ChevronDown aria-hidden="true" className="mt-0.5 w-5 h-5 text-neutral-500" />
                      : <ChevronRight aria-hidden="true" className="mt-0.5 w-5 h-5 text-neutral-500" />}
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold text-neutral-900">{category.name}</h2>
                        {category.isCore && <Badge variant="primary" className="text-xs">Core</Badge>}
                      </div>
                      <p className="text-sm text-neutral-500">{category.description}</p>
                    </div>
                  </div>
                  <span className="text-sm text-neutral-600">{readyCount} ready · {category.subjects.length} total</span>
                </button>
                {isExpanded && (
                  <div
                    id={regionId}
                    className={cn('bg-white p-4', viewMode === 'grid' ? 'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3' : 'space-y-3')}
                  >
                    {category.subjects.map(renderSubject)}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3' : 'space-y-3'}>
          {filteredSubjects.map(renderSubject)}
        </div>
      )}

      {!isLoadingSubjects && !error && filteredSubjects.length === 0 && (
        <Card className="p-10 text-center">
          <BookOpen aria-hidden="true" className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-neutral-800">No matching subjects</h2>
          <p className="mt-2 text-neutral-500">
            {searchQuery ? `No subject matches “${searchQuery}”.` : 'This category has no configured subjects.'}
          </p>
          <Button variant="outline" className="mt-4" onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}>
            Clear filters
          </Button>
        </Card>
      )}
    </main>
  );
}

interface AvailabilitySummaryCardProps {
  icon: typeof CheckCircle2;
  label: string;
  count: number | null;
  tone: 'emerald' | 'amber' | 'neutral';
}

function AvailabilitySummaryCard({ icon: Icon, label, count, tone }: AvailabilitySummaryCardProps) {
  const toneClasses = {
    emerald: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    neutral: 'bg-neutral-100 text-neutral-700',
  };
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={cn('rounded-lg p-2', toneClasses[tone])}>
          <Icon aria-hidden="true" className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-neutral-900">{count ?? '—'}</p>
          <p className="text-sm text-neutral-600">{label}</p>
        </div>
      </div>
    </Card>
  );
}

interface SubjectCardProps {
  subject: Subject;
  viewMode: 'grid' | 'list';
  isLocked: boolean;
  onLockedClick: () => void;
}

export function SubjectCard({ subject, viewMode, isLocked, onLockedClick }: SubjectCardProps) {
  const Icon = getSubjectIcon(subject.icon);
  const unavailable = subject.availabilityStatus === 'unavailable';
  const limited = subject.availabilityStatus === 'limited';
  const reviewPending = (subject.questionCount ?? 0) > 0
    && subject.contentReviewStatus === 'legacy_unreviewed';
  const automatedBeta = (subject.questionCount ?? 0) > 0
    && subject.contentReviewStatus === 'automated_beta';
  const label = getAvailabilityLabel(subject);

  const body = (
    <Card className={cn(
      'h-full p-4 sm:p-5 transition-shadow',
      !unavailable && 'group-hover:shadow-md',
      unavailable && 'bg-neutral-50',
      viewMode === 'list' && 'sm:flex sm:items-center sm:gap-4',
    )}>
      <div
        className={cn('w-12 h-12 shrink-0 rounded-xl flex items-center justify-center', unavailable && 'grayscale')}
        style={{ backgroundColor: `${subject.color}20` }}
      >
        <Icon aria-hidden="true" className="w-6 h-6" style={{ color: subject.color }} />
      </div>

      <div className={cn('min-w-0 flex-1', viewMode === 'grid' ? 'mt-4' : 'mt-3 sm:mt-0')}>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-neutral-900">{subject.name}</h3>
          {limited && <Badge variant="warning" className="text-xs">Limited bank</Badge>}
          {unavailable && <Badge variant="neutral" className="text-xs">Not yet available</Badge>}
          {reviewPending && <Badge variant="neutral" className="text-xs">Academic review pending</Badge>}
          {automatedBeta && <Badge variant="primary" className="text-xs">Beta practice bank</Badge>}
          {isLocked && !unavailable && <PremiumSubjectBadge size="sm" />}
        </div>
        <p className="mt-1 text-sm text-neutral-500 line-clamp-2">
          {subject.description || 'Subject details are being prepared.'}
        </p>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-neutral-600">
          <span className="flex items-center gap-1">
            <BookOpen aria-hidden="true" className="w-3.5 h-3.5" />
            {subject.topicCount ?? 0} live topics
          </span>
          <span className="flex items-center gap-1">
            <FileText aria-hidden="true" className="w-3.5 h-3.5" />
            {subject.questionCount ?? 0} questions
          </span>
        </div>
        <p className={cn('mt-3 text-sm font-medium', unavailable ? 'text-neutral-600' : limited ? 'text-amber-700' : 'text-emerald-700')}>
          {label}
          {limited && ' — expect repetition while this bank grows.'}
        </p>
        {reviewPending && (
          <p className="mt-1 text-xs text-neutral-600">
            This legacy question bank has not yet completed independent academic review.
          </p>
        )}
        {automatedBeta && (
          <p className="mt-1 text-xs text-neutral-600">
            Original BrillaPrep syllabus-aligned practice content; not official exam-board questions.
          </p>
        )}
      </div>

      <div className={cn('mt-4 flex shrink-0 items-center', viewMode === 'list' && 'sm:mt-0')}>
        {isLocked && !unavailable
          ? <Lock aria-hidden="true" className="w-5 h-5 text-amber-500" />
          : !unavailable && <ChevronRight aria-hidden="true" className="w-5 h-5 text-neutral-400" />}
      </div>
    </Card>
  );

  if (unavailable) {
    return <article aria-label={`${subject.name}: Not yet available`}>{body}</article>;
  }

  return (
    <Link
      to={isLocked ? '#' : `/topics/${subject.slug}`}
      onClick={(event) => {
        if (isLocked) {
          event.preventDefault();
          onLockedClick();
        }
      }}
      aria-label={isLocked ? `${subject.name}: premium subject` : `${subject.name}: ${label}`}
      className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      {body}
    </Link>
  );
}
