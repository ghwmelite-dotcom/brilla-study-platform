import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { Card, Badge, Button } from '@/components/common';
import { useExamStore } from '@/stores';
import { cn } from '@/utils';
import type { Subject } from '@/types';

// Icon mapping
function getIconComponent(iconName: string): React.ComponentType<{ className?: string; style?: React.CSSProperties }> {
  const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
    Calculator: Icons.Calculator,
    Atom: Icons.Atom,
    FlaskConical: Icons.FlaskConical,
    Leaf: Icons.Leaf,
    BookOpen: Icons.BookOpen,
    Languages: Icons.Languages,
    Beaker: Icons.Beaker,
    Users: Icons.Users,
    TrendingUp: Icons.TrendingUp,
    Briefcase: Icons.Briefcase,
    Receipt: Icons.Receipt,
    PiggyBank: Icons.PiggyBank,
    Landmark: Icons.Landmark,
    Globe: Icons.Globe,
    Globe2: Icons.Globe2,
    Clock: Icons.Clock,
    Church: Icons.Church,
    Monitor: Icons.Monitor,
    Ruler: Icons.Ruler,
    UtensilsCrossed: Icons.UtensilsCrossed,
    Hammer: Icons.Hammer,
    MessageCircle: Icons.MessageCircle,
    Heart: Icons.Heart,
    Sigma: Icons.Sigma,
  };
  return iconMap[iconName] || Icons.BookOpen;
}

// Mock progress data
const subjectProgress: Record<string, { completed: number; total: number; mastery: number }> = {
  'subj_wassce_core_math': { completed: 45, total: 200, mastery: 68 },
  'subj_wassce_english': { completed: 30, total: 150, mastery: 55 },
  'subj_wassce_int_science': { completed: 25, total: 180, mastery: 42 },
  'subj_wassce_physics': { completed: 60, total: 180, mastery: 75 },
  'subj_wassce_chemistry': { completed: 40, total: 200, mastery: 58 },
};

export function SubjectCatalogPage() {
  const { currentExamType, subjects, categories, initializeExamData, fetchSubjects, fetchCategories } = useExamStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Ensure data is loaded on mount and when exam type changes
  useEffect(() => {
    if (subjects.length === 0 || categories.length === 0) {
      initializeExamData();
    }
    fetchSubjects(currentExamType);
    fetchCategories(currentExamType);
  }, [currentExamType, initializeExamData, fetchSubjects, fetchCategories]);

  // Set default expanded categories after categories load
  useEffect(() => {
    if (categories.length > 0 && expandedCategories.size === 0) {
      const coreCategories = categories.filter(c => c.isCore).map(c => c.id);
      setExpandedCategories(new Set(coreCategories));
    }
  }, [categories]);

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
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-indigo-100">
            <GraduationCap className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">
              {currentExamType.toUpperCase()} Subject Catalog
            </h1>
            <p className="text-neutral-600">
              {subjects.length} subjects across {categories.length} categories
            </p>
          </div>
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
}

function SubjectCard({ subject, progress, viewMode }: SubjectCardProps) {
  const IconComponent = getIconComponent(subject.icon);

  if (viewMode === 'list') {
    return (
      <Link to={`/topics/${subject.slug}`}>
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${subject.color}20` }}
            >
              <IconComponent className="w-6 h-6" style={{ color: subject.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-neutral-900">{subject.name}</h3>
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
              <ChevronRight className="w-5 h-5 text-neutral-400" />
            </div>
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <Link to={`/topics/${subject.slug}`}>
      <Card className="p-5 hover:shadow-md transition-shadow h-full">
        <div className="flex items-start justify-between mb-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${subject.color}20` }}
          >
            <IconComponent className="w-6 h-6" style={{ color: subject.color }} />
          </div>
          {progress.mastery >= 70 && (
            <Badge variant="success" className="text-xs">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Mastered
            </Badge>
          )}
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
      </Card>
    </Link>
  );
}
