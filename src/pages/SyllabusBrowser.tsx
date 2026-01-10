import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  Play,
  FileText,
  Brain,
  TrendingUp,
  Award,
  Info,
  ExternalLink,
} from 'lucide-react';
import { useExamBoardStore } from '@/stores/examBoardStore';
import { cn } from '@/utils';
import type { SyllabusTopic } from '@/types';

// Topic status type
type TopicStatus = 'not_started' | 'in_progress' | 'completed';

// Topic Item Component
function TopicItem({
  topic,
  depth = 0,
  progress,
  onStatusChange,
  onConfidenceChange,
  onPractice,
}: {
  topic: SyllabusTopic & { children?: SyllabusTopic[] };
  depth?: number;
  progress?: {
    status: TopicStatus;
    confidenceLevel: number;
  };
  onStatusChange: (topicId: string, status: TopicStatus) => void;
  onConfidenceChange: (topicId: string, confidence: number) => void;
  onPractice: (topicId: string, topicTitle: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(depth < 1);
  const hasChildren = topic.children && topic.children.length > 0;
  const status = progress?.status || 'not_started';
  const confidence = progress?.confidenceLevel || 0;

  const statusConfig = {
    not_started: {
      icon: Circle,
      color: 'text-neutral-400',
      bg: 'bg-neutral-100',
      label: 'Not Started',
    },
    in_progress: {
      icon: Clock,
      color: 'text-amber-500',
      bg: 'bg-amber-100',
      label: 'In Progress',
    },
    completed: {
      icon: CheckCircle2,
      color: 'text-green-500',
      bg: 'bg-green-100',
      label: 'Completed',
    },
  };

  const StatusIcon = statusConfig[status].icon;

  // Calculate children progress
  const childrenProgress = useMemo(() => {
    if (!hasChildren) return null;
    const total = topic.children!.length;
    const completed = topic.children!.filter((c) => c.id).length; // Placeholder
    return { total, completed };
  }, [topic.children, hasChildren]);

  return (
    <div className={cn('border-l-2', depth > 0 ? 'ml-6 border-neutral-200' : 'border-transparent')}>
      <div
        className={cn(
          'group flex items-start gap-3 p-3 rounded-xl transition-all',
          'hover:bg-neutral-50',
          depth === 0 && 'bg-white border border-neutral-200 mb-3'
        )}
      >
        {/* Expand/Collapse Button */}
        {hasChildren ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-1 p-1 hover:bg-neutral-200 rounded-lg transition-colors"
          >
            <ChevronRight
              className={cn(
                'w-4 h-4 text-neutral-400 transition-transform',
                isExpanded && 'rotate-90'
              )}
            />
          </button>
        ) : (
          <div className="w-6" />
        )}

        {/* Status Icon */}
        <button
          onClick={() => {
            const nextStatus: Record<TopicStatus, TopicStatus> = {
              not_started: 'in_progress',
              in_progress: 'completed',
              completed: 'not_started',
            };
            onStatusChange(topic.id, nextStatus[status]);
          }}
          className={cn(
            'mt-0.5 p-1.5 rounded-lg transition-all',
            statusConfig[status].bg,
            'hover:scale-110'
          )}
          title={`Click to change status (${statusConfig[status].label})`}
        >
          <StatusIcon className={cn('w-4 h-4', statusConfig[status].color)} />
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                {topic.topicCode && (
                  <span className="text-xs font-mono text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded">
                    {topic.topicCode}
                  </span>
                )}
                <h4
                  className={cn(
                    'font-medium',
                    depth === 0 ? 'text-lg text-neutral-900' : 'text-neutral-800'
                  )}
                >
                  {topic.title}
                </h4>
              </div>
              {topic.description && (
                <p className="text-sm text-neutral-500 mt-1 line-clamp-2">{topic.description}</p>
              )}

              {/* Tier badge */}
              {topic.tier && topic.tier !== 'both' && (
                <span
                  className={cn(
                    'inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full',
                    topic.tier === 'extended'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-blue-100 text-blue-700'
                  )}
                >
                  {topic.tier === 'extended' ? 'Extended Only' : 'Core Only'}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onPractice(topic.id, topic.title)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
                Practice
              </button>
            </div>
          </div>

          {/* Confidence Slider (for non-parent topics) */}
          {!hasChildren && status !== 'not_started' && (
            <div className="mt-3 flex items-center gap-3">
              <span className="text-xs text-neutral-500 w-20">Confidence:</span>
              <input
                type="range"
                min="0"
                max="100"
                value={confidence}
                onChange={(e) => onConfidenceChange(topic.id, parseInt(e.target.value))}
                className="flex-1 h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <span
                className={cn(
                  'text-xs font-medium w-10 text-right',
                  confidence >= 70
                    ? 'text-green-600'
                    : confidence >= 40
                    ? 'text-amber-600'
                    : 'text-red-600'
                )}
              >
                {confidence}%
              </span>
            </div>
          )}

          {/* Children progress indicator */}
          {hasChildren && childrenProgress && (
            <div className="mt-2 flex items-center gap-2 text-xs text-neutral-500">
              <div className="w-24 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full"
                  style={{
                    width: `${(childrenProgress.completed / childrenProgress.total) * 100}%`,
                  }}
                />
              </div>
              <span>
                {childrenProgress.completed}/{childrenProgress.total} subtopics
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="mt-1">
          {topic.children!.map((child) => (
            <TopicItem
              key={child.id}
              topic={child}
              depth={depth + 1}
              progress={progress}
              onStatusChange={onStatusChange}
              onConfidenceChange={onConfidenceChange}
              onPractice={onPractice}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SyllabusBrowser() {
  const { specificationId } = useParams<{ specificationId: string }>();
  const navigate = useNavigate();
  const {
    specifications,
    syllabusTopics,
    userSyllabusProgress,
    paperComponents,
    isLoadingSyllabus,
    fetchSpecifications,
    fetchSyllabusTopics,
    fetchPaperComponents,
    updateSyllabusProgress,
    getSyllabusTree,
    getSyllabusProgress,
    getPredictedGrade,
  } = useExamBoardStore();

  const [activeTab, setActiveTab] = useState<'syllabus' | 'papers' | 'resources'>('syllabus');

  // Fetch data on mount
  useEffect(() => {
    if (specificationId) {
      fetchSpecifications();
      fetchSyllabusTopics(specificationId);
      fetchPaperComponents(specificationId);
    }
  }, [specificationId, fetchSpecifications, fetchSyllabusTopics, fetchPaperComponents]);

  // Get current specification
  const specification = specifications.find((s) => s.id === specificationId);

  // Get syllabus tree
  const syllabusTree = useMemo(() => {
    if (!specificationId) return [];
    return getSyllabusTree(specificationId);
  }, [specificationId, getSyllabusTree, syllabusTopics]);

  // Get progress for a topic
  const getTopicProgress = (topicId: string) => {
    const progress = userSyllabusProgress.find((p) => p.syllabusTopicId === topicId);
    return progress
      ? {
          status: progress.status as TopicStatus,
          confidenceLevel: progress.confidenceLevel || 0,
        }
      : undefined;
  };

  // Handle status change
  const handleStatusChange = async (topicId: string, status: TopicStatus) => {
    await updateSyllabusProgress(topicId, status);
  };

  // Handle confidence change
  const handleConfidenceChange = async (topicId: string, confidence: number) => {
    const currentProgress = userSyllabusProgress.find((p) => p.syllabusTopicId === topicId);
    await updateSyllabusProgress(topicId, currentProgress?.status || 'in_progress', confidence);
  };

  // Handle practice navigation
  const handlePractice = (_topicId: string, topicTitle: string) => {
    // Navigate to practice with topic filter
    navigate(`/practice?topic=${encodeURIComponent(topicTitle)}`);
  };

  // Calculate stats
  const totalTopics = syllabusTopics.filter((t) => !t.parentId).length;
  const progress = specificationId ? getSyllabusProgress(specificationId) : 0;
  const predictedGrade = specificationId ? getPredictedGrade(specificationId) : null;

  if (!specification && !isLoadingSyllabus) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-neutral-900 mb-2">Specification Not Found</h2>
          <p className="text-neutral-500 mb-6">
            This specification doesn't exist or you don't have access to it.
          </p>
          <Link
            to="/oa-level"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-600 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/oa-level"
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-neutral-600" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-neutral-900">
                    {specification?.syllabusName || 'Loading...'}
                  </h1>
                  <span className="text-sm text-neutral-500">
                    ({specification?.syllabusCode})
                  </span>
                </div>
                <p className="text-sm text-neutral-500">
                  {specification?.examBoard?.name} • {specification?.examType?.name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Progress Badge */}
              <div className="hidden md:flex items-center gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{progress}%</p>
                  <p className="text-xs text-neutral-500">Progress</p>
                </div>
                <div className="w-px h-10 bg-neutral-200" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{predictedGrade || '-'}</p>
                  <p className="text-xs text-neutral-500">Predicted</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4 -mb-px">
            {[
              { id: 'syllabus', label: 'Syllabus', icon: BookOpen },
              { id: 'papers', label: 'Papers', icon: FileText },
              { id: 'resources', label: 'Resources', icon: ExternalLink },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors',
                  activeTab === tab.id
                    ? 'bg-neutral-50 text-primary border-b-2 border-primary'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'syllabus' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Syllabus Tree */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-neutral-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-neutral-900">Syllabus Topics</h2>
                      <p className="text-sm text-neutral-500">
                        Click status icons to track your progress
                      </p>
                    </div>
                  </div>
                </div>

                {isLoadingSyllabus ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent" />
                  </div>
                ) : syllabusTree.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                    <p className="text-neutral-500">No syllabus topics available yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {syllabusTree.map((topic) => (
                      <TopicItem
                        key={topic.id}
                        topic={topic}
                        progress={getTopicProgress(topic.id)}
                        onStatusChange={handleStatusChange}
                        onConfidenceChange={handleConfidenceChange}
                        onPractice={handlePractice}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Progress Overview */}
              <div className="bg-white rounded-2xl border border-neutral-200 p-6">
                <h3 className="font-bold text-neutral-900 mb-4">Progress Overview</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-neutral-600">Overall Progress</span>
                      <span className="font-semibold text-neutral-900">{progress}%</span>
                    </div>
                    <div className="h-3 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-3 border-t border-neutral-100">
                    <div className="text-center">
                      <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center mx-auto mb-1">
                        <Circle className="w-4 h-4 text-neutral-400" />
                      </div>
                      <p className="text-lg font-bold text-neutral-900">
                        {userSyllabusProgress.filter((p) => p.status === 'not_started').length ||
                          totalTopics}
                      </p>
                      <p className="text-xs text-neutral-500">Not Started</p>
                    </div>
                    <div className="text-center">
                      <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-1">
                        <Clock className="w-4 h-4 text-amber-500" />
                      </div>
                      <p className="text-lg font-bold text-neutral-900">
                        {userSyllabusProgress.filter((p) => p.status === 'in_progress').length}
                      </p>
                      <p className="text-xs text-neutral-500">In Progress</p>
                    </div>
                    <div className="text-center">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-1">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      </div>
                      <p className="text-lg font-bold text-neutral-900">
                        {userSyllabusProgress.filter((p) => p.status === 'completed').length}
                      </p>
                      <p className="text-xs text-neutral-500">Completed</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grade Prediction */}
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="w-6 h-6" />
                  <h3 className="font-bold">Predicted Grade</h3>
                </div>
                <p className="text-5xl font-bold mb-2">{predictedGrade || '-'}</p>
                <p className="text-white/80 text-sm">
                  Based on your syllabus progress and confidence levels
                </p>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-2xl border border-neutral-200 p-6">
                <h3 className="font-bold text-neutral-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => navigate(`/practice?subject=${specification?.syllabusName}`)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-primary-50 hover:bg-primary-100 transition-colors text-left"
                  >
                    <Sparkles className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium text-neutral-900">Practice Questions</p>
                      <p className="text-xs text-neutral-500">Test your knowledge</p>
                    </div>
                  </button>
                  <button
                    onClick={() => navigate('/ai-tutor')}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors text-left"
                  >
                    <Brain className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="font-medium text-neutral-900">Ask AI Tutor</p>
                      <p className="text-xs text-neutral-500">Get help with topics</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">Study Tip</h4>
                    <p className="text-sm text-blue-700">
                      Click the status icons to cycle through: Not Started → In Progress →
                      Completed. Use the confidence slider to track how well you understand each
                      topic.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'papers' && (
          <div className="bg-white rounded-2xl border border-neutral-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-neutral-900">Paper Components</h2>
                <p className="text-sm text-neutral-500">
                  Exam papers for this specification
                </p>
              </div>
            </div>

            {paperComponents.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                <p className="text-neutral-500">No paper information available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paperComponents.map((paper) => (
                  <div
                    key={paper.id}
                    className="p-4 rounded-xl border border-neutral-200 hover:border-primary-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-neutral-900">{paper.paperName}</h4>
                        <p className="text-sm text-neutral-500">{paper.paperCode}</p>
                      </div>
                      {paper.tier && (
                        <span
                          className={cn(
                            'text-xs font-medium px-2 py-1 rounded-full',
                            paper.tier === 'extended'
                              ? 'bg-purple-100 text-purple-700'
                              : paper.tier === 'core'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-neutral-100 text-neutral-600'
                          )}
                        >
                          {paper.tier}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 bg-neutral-50 rounded-lg">
                        <p className="text-lg font-bold text-neutral-900">
                          {paper.durationMinutes}
                        </p>
                        <p className="text-xs text-neutral-500">minutes</p>
                      </div>
                      <div className="p-2 bg-neutral-50 rounded-lg">
                        <p className="text-lg font-bold text-neutral-900">{paper.totalMarks}</p>
                        <p className="text-xs text-neutral-500">marks</p>
                      </div>
                      <div className="p-2 bg-neutral-50 rounded-lg">
                        <p className="text-lg font-bold text-neutral-900">
                          {paper.weightingPercent}%
                        </p>
                        <p className="text-xs text-neutral-500">weight</p>
                      </div>
                    </div>

                    {paper.description && (
                      <p className="text-sm text-neutral-600 mt-3">{paper.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="bg-white rounded-2xl border border-neutral-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <ExternalLink className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-neutral-900">Resources</h2>
                <p className="text-sm text-neutral-500">
                  Official documents and materials
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {specification?.syllabusPdfUrl && (
                <a
                  href={specification.syllabusPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 rounded-xl border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-all group"
                >
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-neutral-900 group-hover:text-primary">
                      Syllabus PDF
                    </h4>
                    <p className="text-sm text-neutral-500">Official syllabus document</p>
                  </div>
                  <ExternalLink className="w-5 h-5 text-neutral-400 group-hover:text-primary" />
                </a>
              )}

              {specification?.specimenPapersUrl && (
                <a
                  href={specification.specimenPapersUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 rounded-xl border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-all group"
                >
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Award className="w-6 h-6 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-neutral-900 group-hover:text-primary">
                      Specimen Papers
                    </h4>
                    <p className="text-sm text-neutral-500">Sample exam papers</p>
                  </div>
                  <ExternalLink className="w-5 h-5 text-neutral-400 group-hover:text-primary" />
                </a>
              )}

              {/* Exam board website */}
              <a
                href={
                  specification?.examBoard?.code === 'CAIE'
                    ? 'https://www.cambridgeinternational.org'
                    : 'https://qualifications.pearson.com'
                }
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 rounded-xl border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-all group"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <ExternalLink className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-neutral-900 group-hover:text-primary">
                    {specification?.examBoard?.name} Website
                  </h4>
                  <p className="text-sm text-neutral-500">Official exam board site</p>
                </div>
                <ExternalLink className="w-5 h-5 text-neutral-400 group-hover:text-primary" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
