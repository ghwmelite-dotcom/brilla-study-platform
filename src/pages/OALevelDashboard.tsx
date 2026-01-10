import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  BookOpen,
  Target,
  TrendingUp,
  Clock,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Award,
  BarChart3,
  Brain,
  Zap,
  Calendar,
  ArrowRight,
  Settings,
  Plus,
  Play,
  FileText,
  Timer,
  Trophy,
  Flame,
  ListChecks,
} from 'lucide-react';
import { useExamBoardStore } from '@/stores/examBoardStore';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/utils';

// Subject Card Component
function SubjectCard({
  specification,
  progress,
  targetGrade,
  predictedGrade,
  onClick,
}: {
  specification: {
    id: string;
    syllabusName: string;
    syllabusCode: string;
    examBoard?: { name: string; code: string };
    examType?: { name: string };
    subject?: { icon: string; color: string };
  };
  progress: number;
  targetGrade?: string;
  predictedGrade?: string;
  onClick: () => void;
}) {
  const getGradeColor = (grade: string | undefined) => {
    if (!grade) return 'text-neutral-400';
    if (grade.startsWith('A') || grade === '9' || grade === '8') return 'text-green-600';
    if (grade === 'B' || grade === '7' || grade === '6') return 'text-blue-600';
    if (grade === 'C' || grade === '5') return 'text-amber-600';
    return 'text-neutral-600';
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-amber-500';
    return 'bg-neutral-300';
  };

  return (
    <button
      onClick={onClick}
      className="group relative bg-white rounded-2xl border border-neutral-200 p-5 text-left transition-all hover:shadow-lg hover:border-primary-300 hover:scale-[1.02] active:scale-[0.98]"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: specification.subject?.color || '#6366F1' }}
          >
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-neutral-900 group-hover:text-primary transition-colors">
              {specification.syllabusName}
            </h3>
            <p className="text-xs text-neutral-500">
              {specification.syllabusCode} • {specification.examBoard?.code}
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-neutral-300 group-hover:text-primary transition-colors" />
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-1.5">
          <span className="text-neutral-600">Syllabus Progress</span>
          <span className="font-semibold text-neutral-900">{progress}%</span>
        </div>
        <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', getProgressColor(progress))}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Grades */}
      <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs text-neutral-500 mb-0.5">Target</p>
            <p className={cn('text-lg font-bold', getGradeColor(targetGrade))}>
              {targetGrade || '-'}
            </p>
          </div>
          <div className="w-px h-8 bg-neutral-200" />
          <div>
            <p className="text-xs text-neutral-500 mb-0.5">Predicted</p>
            <p className={cn('text-lg font-bold', getGradeColor(predictedGrade))}>
              {predictedGrade || '-'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          Study Now
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </button>
  );
}

// Stats Card Component (reserved for future use)
function _StatsCard({
  icon: Icon,
  label,
  value,
  subtext,
  color = 'primary',
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtext?: string;
  color?: 'primary' | 'green' | 'amber' | 'purple';
}) {
  const colors = {
    primary: 'bg-primary-50 text-primary-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-4">
      <div className="flex items-center gap-3">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', colors[color])}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-neutral-900">{value}</p>
          <p className="text-xs text-neutral-500">{label}</p>
        </div>
      </div>
      {subtext && <p className="text-xs text-neutral-400 mt-2">{subtext}</p>}
    </div>
  );
}
void _StatsCard; // Silence unused warning

// Recommendation Card Component
function RecommendationCard({
  topic,
  reason,
  priority,
  onClick,
}: {
  topic: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  onClick: () => void;
}) {
  const priorityColors = {
    high: 'border-red-200 bg-red-50',
    medium: 'border-amber-200 bg-amber-50',
    low: 'border-green-200 bg-green-50',
  };

  const priorityIcons = {
    high: <Zap className="w-4 h-4 text-red-500" />,
    medium: <Clock className="w-4 h-4 text-amber-500" />,
    low: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-4 rounded-xl border text-left transition-all hover:shadow-md',
        priorityColors[priority]
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{priorityIcons[priority]}</div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-neutral-900 truncate">{topic}</h4>
          <p className="text-sm text-neutral-600 mt-0.5">{reason}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-neutral-400 flex-shrink-0" />
      </div>
    </button>
  );
}

// Quiz Card Component for subject-specific quizzes
function QuizCard({
  subject,
  questionsCount,
  duration,
  difficulty,
  color,
  onStart,
}: {
  subject: string;
  questionsCount: number;
  duration: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Mixed';
  color: string;
  onStart: () => void;
}) {
  const difficultyColors = {
    Easy: 'bg-green-100 text-green-700',
    Medium: 'bg-amber-100 text-amber-700',
    Hard: 'bg-red-100 text-red-700',
    Mixed: 'bg-purple-100 text-purple-700',
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-4 hover:shadow-lg transition-all group">
      <div className="flex items-start gap-3">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: color || '#6366F1' }}
        >
          <FileText className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-neutral-900 truncate">{subject}</h4>
          <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
            <span className="flex items-center gap-1">
              <ListChecks className="w-3.5 h-3.5" />
              {questionsCount} questions
            </span>
            <span className="flex items-center gap-1">
              <Timer className="w-3.5 h-3.5" />
              {duration}
            </span>
          </div>
          <div className="mt-2">
            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', difficultyColors[difficulty])}>
              {difficulty}
            </span>
          </div>
        </div>
      </div>
      <button
        onClick={onStart}
        className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-accent text-white font-medium rounded-xl hover:opacity-90 transition-all group-hover:shadow-md"
      >
        <Play className="w-4 h-4" />
        Start Quiz
      </button>
    </div>
  );
}

// Topic Quiz Item Component
function TopicQuizItem({
  topic,
  questionsAvailable,
  lastScore,
  onClick,
}: {
  topic: string;
  questionsAvailable: number;
  lastScore?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-50 transition-colors text-left group"
    >
      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center group-hover:bg-primary-200 transition-colors">
        <Brain className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-neutral-900 truncate group-hover:text-primary transition-colors">{topic}</p>
        <p className="text-xs text-neutral-500">{questionsAvailable} questions available</p>
      </div>
      {lastScore !== undefined && (
        <div className="flex items-center gap-1 text-sm">
          <Trophy className="w-4 h-4 text-amber-500" />
          <span className="font-semibold text-neutral-900">{lastScore}%</span>
        </div>
      )}
      <ChevronRight className="w-5 h-5 text-neutral-300 group-hover:text-primary transition-colors" />
    </button>
  );
}

export default function OALevelDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    specifications,
    userSpecifications,
    userTargetGrades,
    syllabusTopics,
    userSyllabusProgress,
    isLoading,
    fetchExamBoards,
    fetchUserSpecifications,
    fetchSpecifications,
    fetchSyllabusTopics,
    getSyllabusProgress,
    getPredictedGrade,
  } = useExamBoardStore();

  const [selectedSpecs, setSelectedSpecs] = useState<typeof specifications>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    const init = async () => {
      await fetchExamBoards();
      await fetchUserSpecifications();
      setIsInitialized(true);
    };
    init();
  }, [fetchExamBoards, fetchUserSpecifications]);

  // Get user's selected specifications details
  useEffect(() => {
    if (userSpecifications.length > 0) {
      // Fetch all specifications to get full details
      fetchSpecifications();
    }
  }, [userSpecifications, fetchSpecifications]);

  // Filter specifications to only user's selections
  useEffect(() => {
    if (specifications.length > 0 && userSpecifications.length > 0) {
      const userSpecIds = userSpecifications.map((us) => us.specificationId);
      const filtered = specifications.filter((s) => userSpecIds.includes(s.id));
      setSelectedSpecs(filtered);

      // Fetch syllabus for each selected spec
      filtered.forEach((spec) => {
        fetchSyllabusTopics(spec.id);
      });
    }
  }, [specifications, userSpecifications, fetchSyllabusTopics]);

  // Calculate overall stats
  const totalTopics = syllabusTopics.length;
  const completedTopics = userSyllabusProgress.filter((p) => p.status === 'completed').length;
  const overallProgress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  // Get target grade for a specification
  const getTargetGrade = (specId: string) => {
    const target = userTargetGrades.find((t) => t.specificationId === specId);
    return target?.targetGrade;
  };

  // Generate study recommendations based on progress
  const getRecommendations = () => {
    const recommendations: Array<{
      topic: string;
      reason: string;
      priority: 'high' | 'medium' | 'low';
      specId: string;
    }> = [];

    // Find topics not started or with low confidence
    syllabusTopics.forEach((topic) => {
      const progress = userSyllabusProgress.find((p) => p.syllabusTopicId === topic.id);

      if (!progress || progress.status === 'not_started') {
        recommendations.push({
          topic: topic.title,
          reason: 'Not started yet - begin your preparation',
          priority: 'high',
          specId: topic.specificationId,
        });
      } else if (progress.status === 'in_progress' && (progress.confidenceLevel || 0) < 50) {
        recommendations.push({
          topic: topic.title,
          reason: 'Low confidence - needs more practice',
          priority: 'medium',
          specId: topic.specificationId,
        });
      }
    });

    // Return top 5 recommendations
    return recommendations.slice(0, 5);
  };

  // Show loading state while initializing
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-600">Loading your subjects...</p>
        </div>
      </div>
    );
  }

  // If no subjects selected, show setup prompt
  if (userSpecifications.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-20 h-20 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <GraduationCap className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-4">
            Set Up Your O/A Level Journey
          </h1>
          <p className="text-neutral-600 mb-8">
            Select your exam board, subjects, and target grades to get a personalized
            study experience with syllabus tracking and grade predictions.
          </p>
          <Link
            to="/exam-setup"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary-600 transition-all shadow-lg hover:shadow-xl"
          >
            <Sparkles className="w-5 h-5" />
            Start Setup
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    );
  }

  const recommendations = getRecommendations();

  return (
    <div className="min-h-screen bg-neutral-50 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary via-primary-600 to-accent text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <span className="text-sm font-medium text-white/80">O/A Level Preparation</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold">
                Welcome back, {user?.name?.split(' ')[0] || 'Student'}!
              </h1>
              <p className="text-white/80 mt-1">
                Track your progress and ace your exams
              </p>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/exam-setup"
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span className="text-sm font-medium">Manage Subjects</span>
              </Link>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="w-4 h-4 text-white/70" />
                <span className="text-sm text-white/70">Subjects</span>
              </div>
              <p className="text-2xl font-bold">{selectedSpecs.length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-white/70" />
                <span className="text-sm text-white/70">Progress</span>
              </div>
              <p className="text-2xl font-bold">{overallProgress}%</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-white/70" />
                <span className="text-sm text-white/70">Topics</span>
              </div>
              <p className="text-2xl font-bold">{completedTopics}/{totalTopics}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-white/70" />
                <span className="text-sm text-white/70">On Track</span>
              </div>
              <p className="text-2xl font-bold">{overallProgress >= 50 ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 -mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Subjects */}
          <div className="lg:col-span-2 space-y-6">
            {/* My Subjects */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-neutral-900">My Subjects</h2>
                    <p className="text-sm text-neutral-500">Click to view syllabus & practice</p>
                  </div>
                </div>
                <Link
                  to="/exam-setup"
                  className="flex items-center gap-1.5 text-sm text-primary font-medium hover:text-primary-600"
                >
                  <Plus className="w-4 h-4" />
                  Add Subject
                </Link>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedSpecs.map((spec) => (
                    <SubjectCard
                      key={spec.id}
                      specification={spec}
                      progress={getSyllabusProgress(spec.id)}
                      targetGrade={getTargetGrade(spec.id)}
                      predictedGrade={getPredictedGrade(spec.id) || undefined}
                      onClick={() => navigate(`/oa-level/syllabus/${spec.id}`)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Start a Quiz - Subject Quizzes */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                    <Play className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-neutral-900">Start a Quiz</h2>
                    <p className="text-sm text-neutral-500">Practice with timed quizzes</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-neutral-500">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span>Build your streak!</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedSpecs.slice(0, 3).map((spec) => (
                  <QuizCard
                    key={spec.id}
                    subject={spec.syllabusName}
                    questionsCount={10}
                    duration="15 min"
                    difficulty="Mixed"
                    color={spec.subject?.color || '#6366F1'}
                    onStart={() => navigate(`/practice?subject=${encodeURIComponent(spec.syllabusName)}&mode=quiz&count=10`)}
                  />
                ))}
              </div>

              {selectedSpecs.length > 3 && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => navigate('/practice')}
                    className="text-sm text-primary font-medium hover:text-primary-600"
                  >
                    View all {selectedSpecs.length} subjects →
                  </button>
                </div>
              )}
            </div>

            {/* Topic-Based Practice */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <ListChecks className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-neutral-900">Topic Practice</h2>
                    <p className="text-sm text-neutral-500">Focus on specific syllabus topics</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                {syllabusTopics
                  .filter((topic) => !topic.parentId)
                  .slice(0, 5)
                  .map((topic) => {
                    const progress = userSyllabusProgress.find((p) => p.syllabusTopicId === topic.id);
                    return (
                      <TopicQuizItem
                        key={topic.id}
                        topic={topic.title}
                        questionsAvailable={15}
                        lastScore={progress?.confidenceLevel}
                        onClick={() => navigate(`/practice?topic=${encodeURIComponent(topic.title)}&mode=quiz`)}
                      />
                    );
                  })}
              </div>

              {syllabusTopics.filter((t) => !t.parentId).length > 5 && (
                <Link
                  to={selectedSpecs[0] ? `/oa-level/syllabus/${selectedSpecs[0].id}` : '/oa-level'}
                  className="flex items-center justify-center gap-2 mt-4 w-full py-2.5 text-sm text-primary font-medium hover:bg-primary-50 rounded-xl transition-colors"
                >
                  Browse all topics
                  <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>

            {/* Grade Overview */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-neutral-900">Grade Overview</h2>
                  <p className="text-sm text-neutral-500">Target vs Predicted grades</p>
                </div>
              </div>

              <div className="space-y-4">
                {selectedSpecs.map((spec) => {
                  const target = getTargetGrade(spec.id);
                  const predicted = getPredictedGrade(spec.id);
                  const progress = getSyllabusProgress(spec.id);

                  return (
                    <div key={spec.id} className="flex items-center gap-4">
                      <div className="w-32 truncate">
                        <p className="font-medium text-neutral-900 truncate">{spec.syllabusName}</p>
                        <p className="text-xs text-neutral-500">{spec.syllabusCode}</p>
                      </div>
                      <div className="flex-1">
                        <div className="h-3 bg-neutral-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="text-center">
                          <p className="text-xs text-neutral-500">Target</p>
                          <p className="font-bold text-green-600">{target || '-'}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-neutral-300" />
                        <div className="text-center">
                          <p className="text-xs text-neutral-500">Predicted</p>
                          <p className="font-bold text-primary">{predicted || '-'}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column - Recommendations & Actions */}
          <div className="space-y-6">
            {/* Study Recommendations */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Brain className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-neutral-900">Recommended</h2>
                  <p className="text-sm text-neutral-500">Focus on these topics</p>
                </div>
              </div>

              {recommendations.length > 0 ? (
                <div className="space-y-3">
                  {recommendations.map((rec, index) => (
                    <RecommendationCard
                      key={index}
                      topic={rec.topic}
                      reason={rec.reason}
                      priority={rec.priority}
                      onClick={() => navigate(`/oa-level/syllabus/${rec.specId}`)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Award className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="font-medium text-neutral-900">Great progress!</p>
                  <p className="text-sm text-neutral-500">Keep up the excellent work</p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6">
              <h3 className="font-bold text-neutral-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link
                  to="/practice"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-50 transition-colors group"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <Zap className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-neutral-900">Quick Practice</p>
                    <p className="text-xs text-neutral-500">Test your knowledge</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-neutral-300" />
                </Link>

                <Link
                  to="/past-papers"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-50 transition-colors group"
                >
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                    <Calendar className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-neutral-900">Past Papers</p>
                    <p className="text-xs text-neutral-500">Practice with real exams</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-neutral-300" />
                </Link>

                <Link
                  to="/ai-tutor"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-50 transition-colors group"
                >
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-neutral-900">AI Tutor</p>
                    <p className="text-xs text-neutral-500">Get instant help</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-neutral-300" />
                </Link>
              </div>
            </div>

            {/* Exam Countdown */}
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-6 h-6" />
                <h3 className="font-bold">Exam Session</h3>
              </div>
              <p className="text-3xl font-bold mb-1">June 2025</p>
              <p className="text-white/80 text-sm">Stay focused and keep practicing!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
