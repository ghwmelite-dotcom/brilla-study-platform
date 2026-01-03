import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';
import {
  ChevronRight,
  BookOpen,
  Brain,
  Layers,
  Search,
  Filter,
  Loader2,
  Lock,
} from 'lucide-react';
import { Card, Button, Badge, Input, ProgressBar } from '@/components/common';
import { PremiumSubjectBadge } from '@/components/subscription';
import { DailyUsageIndicator } from '@/components/subscription';
import { cn } from '@/utils';
import { api } from '@/services/api';
import { useExamStore, useUsageStore } from '@/stores';
import { isCoreSubject } from '@/config';

// Icon mapping helper
function getIconComponent(iconName: string): React.ComponentType<{ className?: string }> {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
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
    Dna: Icons.Dna,
  };
  return iconMap[iconName] || Icons.BookOpen;
}

// Color mapping helper - convert hex to Tailwind bg class
function getColorClass(hexColor: string): string {
  const colorMap: Record<string, string> = {
    '#3B82F6': 'bg-blue-500',
    '#8B5CF6': 'bg-purple-500',
    '#10B981': 'bg-emerald-500',
    '#F59E0B': 'bg-amber-500',
    '#EF4444': 'bg-red-500',
    '#06B6D4': 'bg-cyan-500',
    '#84CC16': 'bg-lime-500',
    '#F97316': 'bg-orange-500',
    '#EC4899': 'bg-pink-500',
    '#0EA5E9': 'bg-sky-500',
    '#A855F7': 'bg-violet-500',
    '#DC2626': 'bg-red-600',
    '#78716C': 'bg-stone-500',
    '#0891B2': 'bg-cyan-600',
    '#7C3AED': 'bg-purple-600',
    '#475569': 'bg-slate-600',
    '#EA580C': 'bg-orange-600',
    '#2563EB': 'bg-blue-600',
    '#059669': 'bg-emerald-600',
  };
  return colorMap[hexColor] || 'bg-primary';
}

// API Topic type
interface ApiTopic {
  id: string;
  subject_id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string;
  questionCount: number;
}

export function TopicsPage() {
  const { subjectSlug } = useParams();
  const navigate = useNavigate();
  const { subjects, initializeExamData, currentExamType } = useExamStore();
  const { dailyUsage, fetchDailyUsage } = useUsageStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [apiTopics, setApiTopics] = useState<ApiTopic[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [masteryFilter, setMasteryFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');

  // Check if user has premium access
  const isPremiumUser = dailyUsage?.isUnlimited || dailyUsage?.isPremium || false;

  // Fetch usage data on mount
  useEffect(() => {
    fetchDailyUsage();
  }, [fetchDailyUsage]);

  // Check if a subject is locked for the current user
  const isSubjectLocked = (subjectSlug: string): boolean => {
    if (isPremiumUser) return false;
    return !isCoreSubject(currentExamType, subjectSlug);
  };

  // Ensure subjects are loaded
  useEffect(() => {
    if (subjects.length === 0) {
      initializeExamData();
    }
  }, [subjects.length, initializeExamData]);

  // Find current subject from store
  const currentSubject = subjectSlug
    ? subjects.find(s => s.slug === subjectSlug)
    : null;

  // Fetch topics from API
  useEffect(() => {
    const fetchTopics = async () => {
      if (!currentSubject && subjectSlug) {
        // Subject not found yet, wait for store to load
        return;
      }

      setLoading(true);
      try {
        const subjectId = currentSubject?.id;
        const url = subjectId ? `/topics?subject=${subjectId}` : '/topics';
        const data = await api.get(url) as ApiTopic[];
        if (Array.isArray(data)) {
          setApiTopics(data);
        }
      } catch (err) {
        console.error('Failed to fetch topics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTopics();
  }, [subjectSlug, currentSubject]);

  // If viewing a specific subject
  if (subjectSlug) {
    // Show loading while subjects are being fetched
    if (subjects.length === 0) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      );
    }

    if (!currentSubject) {
      return (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-500">Subject not found</p>
          <p className="text-sm text-neutral-400 mt-2">
            The subject "{subjectSlug}" could not be found.
          </p>
          <Link to="/subjects" className="mt-4 inline-block">
            <Button variant="outline">Browse All Subjects</Button>
          </Link>
        </div>
      );
    }

    const SubjectIcon = getIconComponent(currentSubject.icon);
    const colorClass = getColorClass(currentSubject.color);

    // Build topics from API data
    const parentApiTopics = apiTopics.filter(t => t.parent_id === null);
    const childApiTopics = apiTopics.filter(t => t.parent_id !== null);

    const mergedTopics = parentApiTopics.map(apiTopic => {
      // Find children (subtopics) for this topic
      const children = childApiTopics.filter(c => c.parent_id === apiTopic.id);
      return {
        id: apiTopic.id,  // Use actual topic ID for API queries
        slug: apiTopic.slug,
        name: apiTopic.name,
        description: apiTopic.description || '',
        questionCount: apiTopic.questionCount || 0,
        mastery: 0, // TODO: fetch from user progress
        subtopics: children.map(child => ({
          id: child.id,  // Use actual topic ID for API queries
          slug: child.slug,
          name: child.name,
          questionCount: child.questionCount || 0,
          mastery: 0,
        })),
      };
    });

    const filteredTopics = mergedTopics.filter((t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="space-y-6">
        {/* Subject Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={cn('p-4 rounded-xl text-white', colorClass)}>
              <SubjectIcon className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-neutral-900">{currentSubject.name}</h1>
              <p className="text-neutral-500">{currentSubject.description || 'Explore topics and practice questions'}</p>
            </div>
          </div>
          <Link to="/practice" state={{ subject: currentSubject.id }}>
            <Button leftIcon={<Brain className="w-4 h-4" />}>
              Practice All
            </Button>
          </Link>
        </div>

        {/* Search */}
        <Input
          placeholder="Search topics..."
          leftIcon={<Search className="w-4 h-4" />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />

        {/* Topics List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
        <div className="space-y-4">
          {filteredTopics.map((topic) => (
            <Card key={topic.id} className="overflow-hidden">
              <div
                className="p-4 cursor-pointer hover:bg-neutral-50 transition-colors"
                onClick={() => setExpandedTopic(expandedTopic === topic.id ? null : topic.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-neutral-100 rounded-lg">
                      <Layers className="w-5 h-5 text-neutral-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-neutral-900">{topic.name}</h3>
                      <p className="text-sm text-neutral-500">{topic.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-medium text-neutral-900">{topic.questionCount} questions</p>
                      <p className="text-xs text-neutral-500">Mastery: {topic.mastery}%</p>
                    </div>
                    <div className="w-24">
                      <ProgressBar
                        value={topic.mastery}
                        variant={topic.mastery >= 70 ? 'success' : topic.mastery >= 40 ? 'warning' : 'error'}
                        size="sm"
                      />
                    </div>
                    <ChevronRight
                      className={cn(
                        'w-5 h-5 text-neutral-400 transition-transform',
                        expandedTopic === topic.id && 'rotate-90'
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Expanded content */}
              {expandedTopic === topic.id && (
                <div className="border-t border-neutral-100 p-4 bg-neutral-50">
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Button
                      size="sm"
                      leftIcon={<Brain className="w-4 h-4" />}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/exam/practice?mode=drill&topic=${topic.id}&count=10`);
                      }}
                    >
                      Practice Drill
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<BookOpen className="w-4 h-4" />}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/practice?topic=${topic.id}&mode=flashcard`);
                      }}
                    >
                      Flashcards
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/topics/${currentSubject?.slug}/${topic.id}`);
                      }}
                    >
                      View Theory
                    </Button>
                  </div>

                  {topic.subtopics && topic.subtopics.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-neutral-700 mb-2">Subtopics</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {topic.subtopics.map((subtopic) => (
                          <div
                            key={subtopic.id}
                            className="flex items-center justify-between p-3 bg-white rounded-lg border border-neutral-200"
                          >
                            <span className="text-sm text-neutral-700">{subtopic.name}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="neutral" size="sm">{subtopic.questionCount} Q</Badge>
                              <Badge
                                variant={subtopic.mastery >= 70 ? 'success' : subtopic.mastery >= 40 ? 'warning' : 'error'}
                                size="sm"
                              >
                                {subtopic.mastery}%
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
        )}
      </div>
    );
  }

  // Get current exam type for display
  const examTypeLabel = currentExamType.toUpperCase();

  // Handle click on locked subject
  const handleSubjectClick = (subject: typeof subjects[0], isLocked: boolean) => {
    if (isLocked) {
      navigate('/pricing');
    } else {
      navigate(`/topics/${subject.slug}`);
    }
  };

  // Main subjects view
  return (
    <div className="space-y-6">
      {/* Header with Usage Indicator */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-neutral-900">Topic Library</h1>
          <p className="text-neutral-500">Browse and study topics across all {examTypeLabel} subjects</p>
        </div>
        {/* Daily usage indicator for non-premium users */}
        {dailyUsage && !dailyUsage.isUnlimited && (
          <DailyUsageIndicator variant="compact" />
        )}
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <Input
          placeholder="Search topics..."
          leftIcon={<Search className="w-4 h-4" />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 max-w-md"
        />
        <div className="relative">
          <Button
            variant="outline"
            leftIcon={<Filter className="w-4 h-4" />}
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
          >
            Filter
            {masteryFilter !== 'all' && (
              <Badge variant="primary" className="ml-2">1</Badge>
            )}
          </Button>

          {showFilterDropdown && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowFilterDropdown(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-neutral-200 z-20 p-4">
                <h4 className="font-medium text-neutral-900 mb-3">Filter by Mastery</h4>
                <div className="space-y-2">
                  {[
                    { value: 'all', label: 'All Topics' },
                    { value: 'low', label: 'Low (0-30%)' },
                    { value: 'medium', label: 'Medium (31-70%)' },
                    { value: 'high', label: 'High (71-100%)' },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="mastery"
                        value={option.value}
                        checked={masteryFilter === option.value}
                        onChange={(e) => {
                          setMasteryFilter(e.target.value as typeof masteryFilter);
                          setShowFilterDropdown(false);
                        }}
                        className="text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-neutral-700">{option.label}</span>
                    </label>
                  ))}
                </div>
                {masteryFilter !== 'all' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3 w-full"
                    onClick={() => {
                      setMasteryFilter('all');
                      setShowFilterDropdown(false);
                    }}
                  >
                    Clear Filter
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Subjects Grid */}
      {loading || subjects.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.map((subject) => {
          const SubjectIcon = getIconComponent(subject.icon);
          const colorClass = getColorClass(subject.color);
          const locked = isSubjectLocked(subject.slug);

          // Get topics for this subject from API
          const subjectApiTopics = apiTopics.filter(t => t.subject_id === subject.id);
          const topicCount = subjectApiTopics.filter(t => t.parent_id === null).length || subject.topicCount || 0;
          const totalQuestions = subjectApiTopics.reduce((sum, t) => sum + (t.questionCount || 0), 0) || subject.questionCount || 0;
          const avgMastery = 0; // TODO: fetch from user progress

          return (
            <div
              key={subject.id}
              onClick={() => handleSubjectClick(subject, locked)}
              className="cursor-pointer"
            >
              <Card hoverable className={cn('h-full relative overflow-hidden', locked && 'opacity-90')}>
                <div className={cn('h-2 rounded-t-xl', colorClass)} />
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={cn('p-3 rounded-xl text-white', colorClass, locked && 'grayscale')}>
                      <SubjectIcon className="w-6 h-6" />
                    </div>
                    <div className="flex items-center gap-2">
                      {locked && <PremiumSubjectBadge size="sm" />}
                      <Badge variant="neutral">{topicCount} topics</Badge>
                    </div>
                  </div>
                  <h2 className="text-xl font-semibold text-neutral-900 mb-2">{subject.name}</h2>
                  <p className="text-neutral-500 text-sm mb-4 line-clamp-2">{subject.description || 'Explore topics and practice questions'}</p>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-500">{totalQuestions} questions</span>
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-500">Mastery:</span>
                      <span className={cn(
                        'font-medium',
                        avgMastery >= 70 ? 'text-green-600' : avgMastery >= 40 ? 'text-yellow-600' : 'text-red-600'
                      )}>
                        {avgMastery}%
                      </span>
                    </div>
                  </div>
                  <ProgressBar
                    value={avgMastery}
                    variant={avgMastery >= 70 ? 'success' : avgMastery >= 40 ? 'warning' : 'error'}
                    size="sm"
                    className="mt-2"
                  />
                </div>

                {/* Premium overlay for locked subjects */}
                {locked && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex flex-col items-center justify-end pb-6 rounded-xl">
                    <div className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-full shadow-lg">
                      <Lock className="w-4 h-4" />
                      <span className="text-sm font-medium">Upgrade to Access</span>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
