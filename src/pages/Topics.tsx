import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Calculator,
  Atom,
  FlaskConical,
  Dna,
  ChevronRight,
  BookOpen,
  Brain,
  Layers,
  Search,
  Filter,
  Loader2,
} from 'lucide-react';
import { Card, Button, Badge, Input, ProgressBar } from '@/components/common';
import { cn } from '@/utils';
import { api } from '@/services/api';

// Topic structure - mastery and questionCount will be populated from API based on user progress
const subjectsData = {
  mathematics: {
    id: 'mathematics',
    name: 'Mathematics',
    icon: Calculator,
    color: 'bg-blue-500',
    description: 'Master mathematical concepts from algebra to calculus',
    topics: [
      {
        id: 'algebra',
        name: 'Algebra',
        description: 'Fundamental algebraic concepts and operations',
        questionCount: 0,
        mastery: 0,
        subtopics: [
          { id: 'quadratic', name: 'Quadratic Equations', questionCount: 0, mastery: 0 },
          { id: 'linear', name: 'Linear Equations', questionCount: 0, mastery: 0 },
          { id: 'polynomials', name: 'Polynomials', questionCount: 0, mastery: 0 },
        ],
      },
      {
        id: 'geometry',
        name: 'Geometry',
        description: 'Study of shapes, sizes, and properties of space',
        questionCount: 0,
        mastery: 0,
        subtopics: [],
      },
      {
        id: 'trigonometry',
        name: 'Trigonometry',
        description: 'Study of triangles and trigonometric functions',
        questionCount: 0,
        mastery: 0,
        subtopics: [],
      },
      {
        id: 'calculus',
        name: 'Calculus',
        description: 'Study of rates of change and accumulation',
        questionCount: 0,
        mastery: 0,
        subtopics: [],
      },
      {
        id: 'statistics',
        name: 'Statistics & Probability',
        description: 'Analysis of data and chance',
        questionCount: 0,
        mastery: 0,
        subtopics: [],
      },
    ],
  },
  physics: {
    id: 'physics',
    name: 'Physics',
    icon: Atom,
    color: 'bg-purple-500',
    description: 'Explore the fundamental laws of the universe',
    topics: [
      { id: 'mechanics', name: 'Mechanics', description: 'Study of motion and forces', questionCount: 0, mastery: 0, subtopics: [] },
      { id: 'electricity', name: 'Electricity & Magnetism', description: 'Electric charges and magnetic fields', questionCount: 0, mastery: 0, subtopics: [] },
      { id: 'waves', name: 'Waves & Optics', description: 'Wave motion and light', questionCount: 0, mastery: 0, subtopics: [] },
      { id: 'thermodynamics', name: 'Thermodynamics', description: 'Heat and energy transfer', questionCount: 0, mastery: 0, subtopics: [] },
      { id: 'modern', name: 'Modern Physics', description: 'Quantum mechanics and relativity', questionCount: 0, mastery: 0, subtopics: [] },
    ],
  },
  chemistry: {
    id: 'chemistry',
    name: 'Chemistry',
    icon: FlaskConical,
    color: 'bg-green-500',
    description: 'Discover the science of matter and its interactions',
    topics: [
      { id: 'atomic', name: 'Atomic Structure', description: 'Structure of atoms and electron configuration', questionCount: 0, mastery: 0, subtopics: [] },
      { id: 'bonding', name: 'Chemical Bonding', description: 'How atoms combine to form compounds', questionCount: 0, mastery: 0, subtopics: [] },
      { id: 'stoichiometry', name: 'Stoichiometry', description: 'Quantitative relationships in reactions', questionCount: 0, mastery: 0, subtopics: [] },
      { id: 'equilibrium', name: 'Chemical Equilibrium', description: 'Balance in reversible reactions', questionCount: 0, mastery: 0, subtopics: [] },
      { id: 'organic', name: 'Organic Chemistry', description: 'Chemistry of carbon compounds', questionCount: 0, mastery: 0, subtopics: [] },
    ],
  },
  biology: {
    id: 'biology',
    name: 'Biology',
    icon: Dna,
    color: 'bg-amber-500',
    description: 'Study life and living organisms',
    topics: [
      { id: 'cells', name: 'Cell Biology', description: 'Structure and function of cells', questionCount: 0, mastery: 0, subtopics: [] },
      { id: 'genetics', name: 'Genetics', description: 'Study of heredity and variation', questionCount: 0, mastery: 0, subtopics: [] },
      { id: 'ecology', name: 'Ecology', description: 'Organisms and their environment', questionCount: 0, mastery: 0, subtopics: [] },
      { id: 'physiology', name: 'Human Physiology', description: 'Functions of the human body', questionCount: 0, mastery: 0, subtopics: [] },
      { id: 'biochemistry', name: 'Biochemistry', description: 'Chemical processes in living organisms', questionCount: 0, mastery: 0, subtopics: [] },
    ],
  },
};

const subjects = Object.values(subjectsData);

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
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [apiTopics, setApiTopics] = useState<ApiTopic[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [masteryFilter, setMasteryFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');

  // Fetch topics from API
  useEffect(() => {
    const fetchTopics = async () => {
      setLoading(true);
      try {
        // Map slug to subject_id
        const subjectIdMap: Record<string, string> = {
          mathematics: 'subj_math',
          physics: 'subj_physics',
          chemistry: 'subj_chemistry',
          biology: 'subj_biology',
        };

        const subjectId = subjectSlug ? subjectIdMap[subjectSlug] : null;
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
  }, [subjectSlug]);

  // If viewing a specific subject
  if (subjectSlug) {
    const subject = subjectsData[subjectSlug as keyof typeof subjectsData];

    if (!subject) {
      return <div className="text-center py-12 text-neutral-500">Subject not found</div>;
    }

    const SubjectIcon = subject.icon;

    // Merge static topics with API data for question counts
    // Only show parent topics (parent_id is null)
    const parentApiTopics = apiTopics.filter(t => t.parent_id === null);
    const childApiTopics = apiTopics.filter(t => t.parent_id !== null);

    const mergedTopics = parentApiTopics.length > 0
      ? parentApiTopics.map(apiTopic => {
          // Find children (subtopics) for this topic
          const children = childApiTopics.filter(c => c.parent_id === apiTopic.id);
          return {
            id: apiTopic.slug || apiTopic.id,
            name: apiTopic.name,
            description: apiTopic.description,
            questionCount: apiTopic.questionCount,
            mastery: 0, // TODO: fetch from user progress
            subtopics: children.map(child => ({
              id: child.slug || child.id,
              name: child.name,
              questionCount: child.questionCount,
              mastery: 0,
            })),
          };
        })
      : subject.topics;

    const filteredTopics = mergedTopics.filter((t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="space-y-6">
        {/* Subject Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={cn('p-4 rounded-xl text-white', subject.color)}>
              <SubjectIcon className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-neutral-900">{subject.name}</h1>
              <p className="text-neutral-500">{subject.description}</p>
            </div>
          </div>
          <Link to="/practice" state={{ subject: subject.id }}>
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
                    <Link to={`/practice?topic=${topic.id}`}>
                      <Button size="sm" leftIcon={<Brain className="w-4 h-4" />}>
                        Practice Drill
                      </Button>
                    </Link>
                    <Link to={`/practice?topic=${topic.id}&mode=flashcard`}>
                      <Button size="sm" variant="outline" leftIcon={<BookOpen className="w-4 h-4" />}>
                        Flashcards
                      </Button>
                    </Link>
                    <Link to={`/topics/${subject.id}/${topic.id}`}>
                      <Button size="sm" variant="ghost">
                        View Theory
                      </Button>
                    </Link>
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

  // Main subjects view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-neutral-900">Topic Library</h1>
        <p className="text-neutral-500">Browse and study topics across all NSMQ subjects</p>
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
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {subjects.map((subject) => {
          const SubjectIcon = subject.icon;
          // Map subject id to subject_id format
          const subjectIdMap: Record<string, string> = {
            mathematics: 'subj_math',
            physics: 'subj_physics',
            chemistry: 'subj_chemistry',
            biology: 'subj_biology',
          };
          const subjectApiId = subjectIdMap[subject.id];

          // Get topics for this subject from API
          const subjectApiTopics = apiTopics.filter(t => t.subject_id === subjectApiId);
          const topicCount = subjectApiTopics.filter(t => t.parent_id === null).length || subject.topics.length;
          const totalQuestions = subjectApiTopics.reduce((sum, t) => sum + (t.questionCount || 0), 0);
          const avgMastery = 0; // TODO: fetch from user progress

          return (
            <Link key={subject.id} to={`/topics/${subject.id}`}>
              <Card hoverable className="h-full">
                <div className={cn('h-2 rounded-t-xl', subject.color)} />
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={cn('p-3 rounded-xl text-white', subject.color)}>
                      <SubjectIcon className="w-6 h-6" />
                    </div>
                    <Badge variant="neutral">{topicCount} topics</Badge>
                  </div>
                  <h2 className="text-xl font-semibold text-neutral-900 mb-2">{subject.name}</h2>
                  <p className="text-neutral-500 text-sm mb-4">{subject.description}</p>

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
              </Card>
            </Link>
          );
        })}
      </div>
      )}
    </div>
  );
}
