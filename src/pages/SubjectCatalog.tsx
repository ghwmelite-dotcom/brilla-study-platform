import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  BookOpen,
  ChevronDown,
  ChevronRight,
  FileText,
  Users,
  GraduationCap,
  Star,
  TrendingUp,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { Card, Badge, Button } from '@/components/common';
import { DailyUsageIndicator, PremiumSubjectBadge } from '@/components/subscription';
import { useExamStore } from '@/stores/examStore';
import { useUsageStore } from '@/stores/usageStore';
import { isCoreSubject } from '@/config';
import { cn } from '@/utils';
import type { Subject } from '@/types';
import { getSubjectIcon } from '@/lib/subjectIcons';

// Exam type display labels
const examTypeLabelMap: Record<string, string> = {
  'nsmq': 'NSMQ',
  'wassce': 'WASSCE',
  'bece': 'BECE',
  'igcse': 'Cambridge IGCSE',
  'cambridge-a-level': 'Cambridge A-Level',
  'cambridge-as': 'Cambridge AS-Level',
  'edexcel-igcse': 'Edexcel IGCSE',
  'edexcel-as': 'Edexcel AS-Level',
  'edexcel-a-level': 'Edexcel A-Level',
};

// Subject progress will be fetched from API in production
// For now, return default empty progress for all subjects
const subjectProgress: Record<string, { completed: number; total: number; mastery: number }> = {};

export function SubjectCatalogPage() {
  const navigate = useNavigate();
  const { currentExamType, subjects, categories, initializeExamData, fetchSubjects, fetchCategories } = useExamStore();
  const { dailyUsage, fetchDailyUsage } = useUsageStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Check if user has premium access
  const isPremiumUser = dailyUsage?.isUnlimited || dailyUsage?.isPremium || false;

  // Check if a subject is locked for the current user
  const isSubjectLocked = (subjectSlug: string): boolean => {
    if (isPremiumUser) return false;
    return !isCoreSubject(currentExamType, subjectSlug);
  };

  // Fetch usage data on mount
  useEffect(() => {
    fetchDailyUsage();
  }, [fetchDailyUsage]);

  // Ensure data is loaded on mount and when exam type changes
  useEffect(() => {
    if (subjects.length === 0 || categories.length === 0) {
      initializeExamData();
    }
    fetchSubjects(currentExamType);
    fetchCategories(currentExamType);
  }, [categories.length, currentExamType, fetchCategories, fetchSubjects, initializeExamData, subjects.length]);

  // Set default expanded categories after categories load
  useEffect(() => {
    if (categories.length > 0 && expandedCategories.size === 0) {
      const coreCategories = categories.filter(c => c.isCore).map(c => c.id);
      setExpandedCategories(new Set(coreCategories));
    }
  }, [categories, expandedCategories.size]);

  // Filter subjects
  const filteredSubjects = useMemo(() => {
    let result = subjects;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        s => s.name.toLowerCase().includes(query) || s.description?.toLowerCase().includes(query)
      );
    }

    if (selectedCategory !== 'all') {
      result = result.filter(s => s.categoryId === selectedCategory);
    }

    return result;
  }, [subjects, searchQuery, selectedCategory]);

  // Group subjects by category
  const subjectsByCategory = useMemo(() => {
    const grouped: Record<string, Subject[]> = {};

    categories.forEach(cat => {
      grouped[cat.id] = filteredSubjects.filter(s => s.categoryId === cat.id);
    });

    // Add uncategorized
    const uncategorized = filteredSubjects.filter(
      s => !s.categoryId || !categories.find(c => c.id === s.categoryId)
    );
    if (uncategorized.length > 0) {
      grouped['uncategorized'] = uncategorized;
    }

    return grouped;
  }, [filteredSubjects, categories]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const getProgress = (subjectId: string) => {
    return subjectProgress[subjectId] || { completed: 0, total: 100, mastery: 0 };
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header with Usage Indicator */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-indigo-100">
              <GraduationCap className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">
                {examTypeLabelMap[currentExamType] || currentExamType.toUpperCase()} Subject Catalog
              </h1>
              <p className="text-neutral-600">
                {subjects.length} subjects across {categories.length} categories
              </p>
            </div>
          </div>
          {/* Daily usage indicator for non-premium users */}
          {dailyUsage && !dailyUsage.isUnlimited && (
            <DailyUsageIndicator variant="compact" />
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search subjects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-neutral-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="pl-9 pr-8 py-2.5 rounded-lg border border-neutral-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 appearance-none min-w-[180px]"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({subjectsByCategory[cat.id]?.length || 0})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
          </div>

          {/* View Toggle */}
          <div className="flex gap-1 p-1 bg-neutral-100 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'px-3 py-1.5 rounded text-sm font-medium transition-colors',
                viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
              )}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'px-3 py-1.5 rounded text-sm font-medium transition-colors',
                viewMode === 'list' ? 'bg-white shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
              )}
            >
              List
            </button>
          </div>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{subjects.length}</p>
              <p className="text-sm text-neutral-500">Subjects</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">
                {Object.values(subjectProgress).filter(p => p.mastery >= 70).length}
              </p>
              <p className="text-sm text-neutral-500">Mastered</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">
                {Object.values(subjectProgress).filter(p => p.mastery > 0 && p.mastery < 70).length}
              </p>
              <p className="text-sm text-neutral-500">In Progress</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100">
              <Star className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">
                {Math.round(
                  Object.values(subjectProgress).reduce((sum, p) => sum + p.mastery, 0) /
                  Math.max(Object.values(subjectProgress).length, 1)
                )}%
              </p>
              <p className="text-sm text-neutral-500">Avg Mastery</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Subject List by Category */}
      {selectedCategory === 'all' ? (
        <div className="space-y-6">
          {categories.map(category => {
            const categorySubjects = subjectsByCategory[category.id] || [];
            if (categorySubjects.length === 0) return null;

            const isExpanded = expandedCategories.has(category.id);

            return (
              <div key={category.id} className="border border-neutral-200 rounded-xl overflow-hidden">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full flex items-center justify-between p-4 bg-neutral-50 hover:bg-neutral-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-neutral-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-neutral-400" />
                    )}
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <h2 className="font-semibold text-neutral-900">{category.name}</h2>
                        {category.isCore && (
                          <Badge variant="primary" className="text-xs">Core</Badge>
                        )}
                      </div>
                      <p className="text-sm text-neutral-500">{category.description}</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-neutral-500">
                    {categorySubjects.length} subject{categorySubjects.length !== 1 ? 's' : ''}
                  </span>
                </button>

                {/* Category Subjects */}
                {isExpanded && (
                  <div className={cn(
                    'p-4 bg-white',
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                      : 'space-y-3'
                  )}>
                    {categorySubjects.map(subject => (
                      <SubjectCard
                        key={subject.id}
                        subject={subject}
                        progress={getProgress(subject.id)}
                        viewMode={viewMode}
                        isLocked={isSubjectLocked(subject.slug)}
                        onLockedClick={() => navigate('/pricing')}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className={cn(
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'space-y-3'
        )}>
          {filteredSubjects.map(subject => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              progress={getProgress(subject.id)}
              viewMode={viewMode}
              isLocked={isSubjectLocked(subject.slug)}
              onLockedClick={() => navigate('/pricing')}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredSubjects.length === 0 && (
        <Card className="p-12 text-center">
          <BookOpen className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-700 mb-2">No subjects found</h3>
          <p className="text-neutral-500 mb-4">
            {searchQuery
              ? `No subjects match "${searchQuery}"`
              : 'No subjects available in this category'}
          </p>
          <Button variant="outline" onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}>
            Clear Filters
          </Button>
        </Card>
      )}
    </div>
  );
}

interface SubjectCardProps {
  subject: Subject;
  progress: { completed: number; total: number; mastery: number };
  viewMode: 'grid' | 'list';
  isLocked?: boolean;
  onLockedClick?: () => void;
}

function SubjectCard({ subject, progress, viewMode, isLocked = false, onLockedClick }: SubjectCardProps) {
  const IconComponent = getSubjectIcon(subject.icon);

  const handleClick = (e: React.MouseEvent) => {
    if (isLocked && onLockedClick) {
      e.preventDefault();
      onLockedClick();
    }
  };

  if (viewMode === 'list') {
    return (
      <Link to={isLocked ? '#' : `/topics/${subject.slug}`} onClick={handleClick}>
        <Card className={cn('p-4 hover:shadow-md transition-shadow relative', isLocked && 'opacity-80')}>
          <div className="flex items-center gap-4">
            <div
              className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', isLocked && 'grayscale')}
              style={{ backgroundColor: `${subject.color}20` }}
            >
              <IconComponent className="w-6 h-6" style={{ color: subject.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-neutral-900">{subject.name}</h3>
                {isLocked && <PremiumSubjectBadge size="sm" />}
              </div>
              <p className="text-sm text-neutral-500 truncate">{subject.description}</p>
            </div>
            <div className="flex items-center gap-6 flex-shrink-0">
              <div className="text-right">
                <p className="text-sm font-medium text-neutral-700">
                  {subject.topicCount || 0} topics
                </p>
                <p className="text-xs text-neutral-500">
                  {subject.questionCount || 0} questions
                </p>
              </div>
              {!isLocked && (
                <div className="w-24">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-neutral-500">Mastery</span>
                    <span className="font-medium">{progress.mastery}%</span>
                  </div>
                  <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        progress.mastery >= 70 ? 'bg-emerald-500' :
                        progress.mastery >= 40 ? 'bg-amber-500' : 'bg-neutral-300'
                      )}
                      style={{ width: `${progress.mastery}%` }}
                    />
                  </div>
                </div>
              )}
              {isLocked ? (
                <Lock className="w-5 h-5 text-amber-500" />
              ) : (
                <ChevronRight className="w-5 h-5 text-neutral-400" />
              )}
            </div>
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <Link to={isLocked ? '#' : `/topics/${subject.slug}`} onClick={handleClick}>
      <Card className={cn('p-5 hover:shadow-md transition-shadow h-full relative overflow-hidden', isLocked && 'opacity-90')}>
        <div className="flex items-start justify-between mb-4">
          <div
            className={cn('w-12 h-12 rounded-xl flex items-center justify-center', isLocked && 'grayscale')}
            style={{ backgroundColor: `${subject.color}20` }}
          >
            <IconComponent className="w-6 h-6" style={{ color: subject.color }} />
          </div>
          {isLocked ? (
            <PremiumSubjectBadge size="sm" />
          ) : progress.mastery >= 70 ? (
            <Badge variant="success" className="text-xs">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Mastered
            </Badge>
          ) : null}
        </div>

        <h3 className="font-semibold text-neutral-900 mb-1">{subject.name}</h3>
        <p className="text-sm text-neutral-500 mb-4 line-clamp-2">
          {subject.description || 'No description available'}
        </p>

        <div className="flex items-center gap-4 text-xs text-neutral-500 mb-4">
          <span className="flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" />
            {subject.topicCount || 0} topics
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {subject.questionCount || 0} questions
          </span>
        </div>

        {/* Progress bar */}
        {!isLocked && (
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-neutral-500">Mastery</span>
              <span className="font-medium text-neutral-700">{progress.mastery}%</span>
            </div>
            <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  progress.mastery >= 70 ? 'bg-emerald-500' :
                  progress.mastery >= 40 ? 'bg-amber-500' : 'bg-neutral-300'
                )}
                style={{ width: `${progress.mastery}%` }}
              />
            </div>
          </div>
        )}

        {/* Premium overlay for locked subjects */}
        {isLocked && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex flex-col items-center justify-end pb-4 rounded-xl">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500 text-white rounded-full shadow-lg text-sm">
              <Lock className="w-3.5 h-3.5" />
              <span className="font-medium">Upgrade</span>
            </div>
          </div>
        )}
      </Card>
    </Link>
  );
}
